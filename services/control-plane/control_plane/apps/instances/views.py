"""API views for instances app."""

import logging

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from control_plane.apps.orgs.models import Membership

from .models import APIKey, Instance
from .serializers import (
    APIKeyCreateSerializer,
    APIKeyCreatedSerializer,
    APIKeySerializer,
    EntitlementsSerializer,
    InstanceCreateSerializer,
    InstanceSerializer,
)
from .services import APIKeyService, InstanceService

logger = logging.getLogger(__name__)


class InstanceViewSet(viewsets.ModelViewSet):
    """
    API endpoint for instances.
    """

    serializer_class = InstanceSerializer

    def get_queryset(self):
        """Filter to instances in organizations the user can access."""
        user_id = self.request.user.id
        membership_org_ids = Membership.objects.filter(user_id=user_id).values_list(
            "organization_id", flat=True
        )
        return Instance.objects.filter(organization_id__in=membership_org_ids).select_related("offering_version", "offering_version__offering", "plan", "organization", "project")

    def get_serializer_class(self):
        if self.action == "create":
            return InstanceCreateSerializer
        return InstanceSerializer

    def create(self, request):
        """Create a new instance."""
        serializer = InstanceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check user has access to the organization
        org_id = serializer.validated_data["org_id"]
        if not Membership.objects.filter(
            organization_id=org_id,
            user_id=request.user.id,
        ).exists():
            return Response(
                {"error": {"code": "forbidden", "message": "Access denied"}},
                status=status.HTTP_403_FORBIDDEN,
            )

        instance = InstanceService.create_instance(
            offering_version_id=str(serializer.validated_data["offering_version_id"]),
            org_id=str(serializer.validated_data["org_id"]),
            project_id=str(serializer.validated_data["project_id"]),
            plan_id=str(serializer.validated_data["plan_id"]),
            name=serializer.validated_data.get("instance_name", ""),
            overrides=serializer.validated_data.get("overrides"),
            idempotency_key=serializer.validated_data.get("idempotency_key"),
        )

        response_serializer = InstanceSerializer(instance)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def entitlements(self, request, pk=None):
        """
        GET /instances/{id}/entitlements

        Get computed entitlements for an instance.
        """
        entitlements = InstanceService.get_entitlements(str(pk))
        serializer = EntitlementsSerializer(entitlements)
        return Response(serializer.data)

    @action(detail=True, methods=["get", "post"])
    def api_keys(self, request, pk=None):
        """
        GET /instances/{id}/api_keys - List API keys
        POST /instances/{id}/api_keys - Create API key
        """
        instance = self.get_object()

        if request.method == "GET":
            api_keys = instance.api_keys.filter(is_active=True)
            serializer = APIKeySerializer(api_keys, many=True)
            return Response(serializer.data)

        elif request.method == "POST":
            serializer = APIKeyCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            result = APIKeyService.create_api_key(
                instance=instance,
                name=serializer.validated_data["name"],
                expires_at=serializer.validated_data.get("expires_at"),
            )

            response_serializer = APIKeyCreatedSerializer({
                "id": result.api_key.id,
                "name": result.api_key.name,
                "key": result.full_key,
                "key_prefix": result.api_key.key_prefix,
                "expires_at": result.api_key.expires_at,
                "created_at": result.api_key.created_at,
            })
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class APIKeyRevokeView(APIView):
    """
    POST /instances/{instance_id}/api_keys/{key_id}/revoke

    Revoke an API key.
    """

    def post(self, request, instance_id, key_id):
        """Revoke an API key."""
        # Check user has access to instance
        if not Membership.objects.filter(
            organization__instances__id=instance_id,
            user_id=request.user.id,
        ).exists():
            return Response(
                {"error": {"code": "forbidden", "message": "Access denied"}},
                status=status.HTTP_403_FORBIDDEN,
            )

        api_key = APIKeyService.revoke_api_key(str(key_id))
        serializer = APIKeySerializer(api_key)
        return Response(serializer.data)


class StartTrialView(APIView):
    """
    POST /instances/trial

    Start a free trial for an offering by Saleor product slug.
    Creates an org/project/wallet if needed, then creates a trial instance.
    """

    def post(self, request):
        """Start a trial for the given product."""
        product_slug = request.data.get("product_slug")
        if not product_slug:
            return Response(
                {"error": {"code": "bad_request", "message": "product_slug required"}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = InstanceService.start_trial(
                user_id=request.user.id,
                email=request.user.email,
                product_slug=product_slug,
            )
            return Response({
                "instance_id": str(result["instance"].id),
                "state": result["instance"].state,
                "trial_credits_granted": result.get("credits_granted", 0),
                "redirect_url": f"/run/{result['instance'].id}",
            }, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {"error": {"code": "not_found", "message": str(e)}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.error(f"Failed to start trial: {e}")
            return Response(
                {"error": {"code": "internal_error", "message": str(e)}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
