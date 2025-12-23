"""Serializers for orgs app."""

from rest_framework import serializers

from .models import Membership, Organization, Project, Team


class OrganizationSerializer(serializers.ModelSerializer):
    """Serializer for Organization model."""

    class Meta:
        model = Organization
        fields = ["id", "name", "slug", "owner_id", "created_at", "updated_at"]
        read_only_fields = ["id", "slug", "owner_id", "created_at", "updated_at"]


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for Project model."""

    organization_id = serializers.UUIDField(source="organization.id", read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "organization_id",
            "name",
            "slug",
            "description",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "is_default", "created_at", "updated_at"]


class TeamSerializer(serializers.ModelSerializer):
    """Serializer for Team model."""

    organization_id = serializers.UUIDField(source="organization.id", read_only=True)

    class Meta:
        model = Team
        fields = [
            "id",
            "organization_id",
            "name",
            "slug",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]


class MembershipSerializer(serializers.ModelSerializer):
    """Serializer for Membership model."""

    organization_id = serializers.UUIDField(source="organization.id", read_only=True)
    team_ids = serializers.PrimaryKeyRelatedField(
        source="teams",
        many=True,
        queryset=Team.objects.all(),
        required=False,
    )

    class Meta:
        model = Membership
        fields = [
            "id",
            "organization_id",
            "user_id",
            "role",
            "team_ids",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class WorkspaceSerializer(serializers.Serializer):
    """Serializer for auto-created workspace response."""

    org_id = serializers.UUIDField(source="organization.id")
    project_id = serializers.UUIDField(source="project.id")
    wallet_id = serializers.UUIDField(source="wallet.id")
    trial_granted = serializers.BooleanField()
