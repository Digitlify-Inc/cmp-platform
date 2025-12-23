"""Views for connectors app."""

import logging
import uuid

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from control_plane.apps.orgs.models import Membership, Project
from control_plane.vault import get_vault_client

from .models import ConnectorBinding
from .serializers import ConnectorBindingCreateSerializer, ConnectorBindingSerializer

logger = logging.getLogger(__name__)


class ConnectorBindingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for connector bindings.

    Connector bindings link external services (like Zendesk, Slack)
    to an organization/project. Credentials are stored in Vault.
    """

    serializer_class = ConnectorBindingSerializer

    def get_queryset(self):
        """Filter to bindings in organizations the user can access."""
        user_id = self.request.user.id
        membership_org_ids = Membership.objects.filter(user_id=user_id).values_list(
            "organization_id", flat=True
        )
        return ConnectorBinding.objects.filter(
            organization_id__in=membership_org_ids,
            status=ConnectorBinding.Status.ACTIVE,
        )

    def get_serializer_class(self):
        if self.action == "create":
            return ConnectorBindingCreateSerializer
        return ConnectorBindingSerializer

    def create(self, request):
        """Create a new connector binding."""
        serializer = ConnectorBindingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        project_id = serializer.validated_data["project_id"]

        # Verify user has access to project
        try:
            project = Project.objects.select_related("organization").get(id=project_id)
        except Project.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Project not found"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not Membership.objects.filter(
            organization=project.organization,
            user_id=request.user.id,
        ).exists():
            return Response(
                {"error": {"code": "forbidden", "message": "Access denied"}},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Generate vault path
        vault_path = (
            f"kv/data/connectors/{project.organization_id}/{project_id}/"
            f"{serializer.validated_data[connector_id]}/{uuid.uuid4()}"
        )

        binding = ConnectorBinding.objects.create(
            organization=project.organization,
            project=project,
            connector_id=serializer.validated_data["connector_id"],
            display_name=serializer.validated_data["display_name"],
            vault_path=vault_path,
        )

        # Store credentials in Vault if provided
        credentials = serializer.validated_data.get("credentials")
        if credentials:
            vault_client = get_vault_client()
            if vault_client.is_configured:
                success = vault_client.write_secret(vault_path, credentials)
                if not success:
                    logger.warning(
                        f"Failed to store credentials in Vault for binding {binding.id}"
                    )
            else:
                logger.info(
                    f"Vault not configured, credentials not stored for binding {binding.id}"
                )

        response_serializer = ConnectorBindingSerializer(binding)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None):
        """Revoke a connector binding."""
        binding = self.get_object()
        
        # Delete credentials from Vault
        vault_client = get_vault_client()
        if vault_client.is_configured and binding.vault_path:
            success = vault_client.delete_secret(binding.vault_path)
            if not success:
                logger.warning(
                    f"Failed to delete credentials from Vault for binding {binding.id}"
                )

        binding.status = ConnectorBinding.Status.REVOKED
        binding.save()

        serializer = ConnectorBindingSerializer(binding)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def credentials(self, request, pk=None):
        """Retrieve credentials for a connector binding.
        
        Returns masked credentials for display purposes.
        """
        binding = self.get_object()
        
        vault_client = get_vault_client()
        if not vault_client.is_configured:
            return Response(
                {"error": {"code": "vault_not_configured", "message": "Vault is not configured"}},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        secret_data = vault_client.read_secret(binding.vault_path)
        if secret_data is None:
            return Response(
                {"error": {"code": "not_found", "message": "Credentials not found"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Mask sensitive values
        masked_data = {}
        for key, value in secret_data.items():
            if isinstance(value, str) and len(value) > 4:
                masked_data[key] = value[:2] + "*" * (len(value) - 4) + value[-2:]
            else:
                masked_data[key] = "****"

        return Response({
            "binding_id": str(binding.id),
            "connector_id": binding.connector_id,
            "credentials": masked_data,
        })
