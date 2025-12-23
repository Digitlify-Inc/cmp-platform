"""API views for orgs app."""

import logging

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Membership, Organization, Project, Team
from .serializers import (
    MembershipSerializer,
    OrganizationSerializer,
    ProjectSerializer,
    TeamSerializer,
    WorkspaceSerializer,
)
from .services import WorkspaceService

logger = logging.getLogger(__name__)


class AutoWorkspaceView(APIView):
    """
    POST /orgs/auto

    Auto-create or return existing personal workspace for the current user.
    """

    def post(self, request):
        """Create or return existing personal workspace."""
        user = request.user

        result = WorkspaceService.get_or_create_personal_workspace(
            user_id=user.id,
            username=user.username,
            email=user.email,
        )

        serializer = WorkspaceSerializer(result)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrganizationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for organizations.

    Users can only see organizations they are members of.
    """

    serializer_class = OrganizationSerializer

    def get_queryset(self):
        """Filter to organizations the user is a member of."""
        user_id = self.request.user.id
        membership_org_ids = Membership.objects.filter(user_id=user_id).values_list(
            "organization_id", flat=True
        )
        return Organization.objects.filter(id__in=membership_org_ids)

    def perform_create(self, serializer):
        """Set owner_id to current user when creating organization."""
        organization = serializer.save(owner_id=self.request.user.id)
        # Create owner membership
        Membership.objects.create(
            organization=organization,
            user_id=self.request.user.id,
            role=Membership.Role.OWNER,
        )


class ProjectViewSet(viewsets.ModelViewSet):
    """
    API endpoint for projects.

    Nested under organizations.
    """

    serializer_class = ProjectSerializer

    def get_queryset(self):
        """Filter to projects in organizations the user can access."""
        user_id = self.request.user.id
        membership_org_ids = Membership.objects.filter(user_id=user_id).values_list(
            "organization_id", flat=True
        )
        org_id = self.kwargs.get("org_id")
        if org_id:
            return Project.objects.filter(organization_id=org_id, organization_id__in=membership_org_ids)
        return Project.objects.filter(organization_id__in=membership_org_ids)

    def perform_create(self, serializer):
        """Set organization from URL."""
        org_id = self.kwargs.get("org_id")
        organization = Organization.objects.get(id=org_id)
        serializer.save(organization=organization)


class TeamViewSet(viewsets.ModelViewSet):
    """
    API endpoint for teams.

    Nested under organizations.
    """

    serializer_class = TeamSerializer

    def get_queryset(self):
        """Filter to teams in organizations the user can access."""
        user_id = self.request.user.id
        membership_org_ids = Membership.objects.filter(user_id=user_id).values_list(
            "organization_id", flat=True
        )
        org_id = self.kwargs.get("org_id")
        if org_id:
            return Team.objects.filter(organization_id=org_id, organization_id__in=membership_org_ids)
        return Team.objects.filter(organization_id__in=membership_org_ids)

    def perform_create(self, serializer):
        """Set organization from URL."""
        org_id = self.kwargs.get("org_id")
        organization = Organization.objects.get(id=org_id)
        serializer.save(organization=organization)


class MembershipViewSet(viewsets.ModelViewSet):
    """
    API endpoint for memberships.

    Nested under organizations.
    """

    serializer_class = MembershipSerializer

    def get_queryset(self):
        """Filter to memberships in organizations the user can access."""
        user_id = self.request.user.id
        membership_org_ids = Membership.objects.filter(user_id=user_id).values_list(
            "organization_id", flat=True
        )
        org_id = self.kwargs.get("org_id")
        if org_id:
            return Membership.objects.filter(
                organization_id=org_id, organization_id__in=membership_org_ids
            )
        return Membership.objects.filter(organization_id__in=membership_org_ids)

    def perform_create(self, serializer):
        """Set organization from URL."""
        org_id = self.kwargs.get("org_id")
        organization = Organization.objects.get(id=org_id)
        serializer.save(organization=organization)
