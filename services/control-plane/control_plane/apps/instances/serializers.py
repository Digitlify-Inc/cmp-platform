"""Serializers for instances app."""

from rest_framework import serializers

from .models import APIKey, Instance


class InstanceCreateSerializer(serializers.Serializer):
    """Serializer for creating an instance."""

    offering_version_id = serializers.UUIDField()
    org_id = serializers.UUIDField()
    project_id = serializers.UUIDField()
    plan_id = serializers.UUIDField()
    instance_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    overrides = serializers.DictField(required=False, default=dict)
    idempotency_key = serializers.CharField(max_length=255, required=False, allow_blank=True)


class OfferingNestedSerializer(serializers.Serializer):
    """Nested serializer for offering in instance response."""

    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.CharField()
    category = serializers.CharField()


class OfferingVersionNestedSerializer(serializers.Serializer):
    """Nested serializer for offering version in instance response."""

    id = serializers.UUIDField()
    version_label = serializers.CharField()
    offering = OfferingNestedSerializer()


class PlanNestedSerializer(serializers.Serializer):
    """Nested serializer for plan in instance response."""

    id = serializers.UUIDField()
    name = serializers.CharField()


class InstanceSerializer(serializers.ModelSerializer):
    """Serializer for Instance model with nested relations."""

    offering_version = serializers.SerializerMethodField()
    plan = serializers.SerializerMethodField()
    organization = serializers.UUIDField(source="organization.id", read_only=True)
    project = serializers.UUIDField(source="project.id", read_only=True)

    class Meta:
        model = Instance
        fields = [
            "id",
            "name",
            "state",
            "organization",
            "project",
            "offering_version",
            "plan",
            "overrides",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def get_offering_version(self, obj):
        """Return nested offering version data."""
        ov = obj.offering_version
        if not ov:
            return None
        return {
            "id": str(ov.id),
            "version_label": ov.version_label,
            "offering": {
                "id": str(ov.offering.id),
                "name": ov.offering.name,
                "slug": ov.offering.slug,
                "category": ov.offering.category,
            }
        }

    def get_plan(self, obj):
        """Return nested plan data."""
        plan = obj.plan
        if not plan:
            return None
        return {
            "id": str(plan.id),
            "name": plan.name,
        }


class EntitlementsSerializer(serializers.Serializer):
    """Serializer for instance entitlements."""

    instance_id = serializers.UUIDField()
    capabilities = serializers.ListField(
        child=serializers.DictField()
    )


class APIKeyCreateSerializer(serializers.Serializer):
    """Serializer for creating an API key."""

    name = serializers.CharField(max_length=255)
    expires_at = serializers.DateTimeField(required=False, allow_null=True)


class APIKeySerializer(serializers.ModelSerializer):
    """Serializer for API key (without secret)."""

    class Meta:
        model = APIKey
        fields = [
            "id",
            "name",
            "key_prefix",
            "last_used_at",
            "expires_at",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "key_prefix", "last_used_at", "created_at"]


class APIKeyCreatedSerializer(serializers.Serializer):
    """Serializer for newly created API key (with secret)."""

    id = serializers.UUIDField()
    name = serializers.CharField()
    key = serializers.CharField()  # Full key - only shown once
    key_prefix = serializers.CharField()
    expires_at = serializers.DateTimeField(allow_null=True)
    created_at = serializers.DateTimeField()
