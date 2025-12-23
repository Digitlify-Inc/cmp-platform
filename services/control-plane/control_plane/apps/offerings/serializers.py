"""Serializers for offerings app."""

from rest_framework import serializers

from .models import Offering, OfferingVersion, Plan


class OfferingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating an offering."""

    class Meta:
        model = Offering
        fields = [
            "name",
            "category",
            "value_streams",
            "description",
            "saleor_product_id",
        ]


class OfferingSerializer(serializers.ModelSerializer):
    """Serializer for Offering model."""

    offering_id = serializers.UUIDField(source="id", read_only=True)

    class Meta:
        model = Offering
        fields = [
            "offering_id",
            "name",
            "slug",
            "category",
            "description",
            "value_streams",
            "status",
            "saleor_product_id",
            "thumbnail_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["offering_id", "slug", "created_at", "updated_at"]


class OfferingVersionCreateSerializer(serializers.Serializer):
    """Serializer for creating an offering version."""

    version_label = serializers.CharField(max_length=50)
    artifact = serializers.DictField(child=serializers.CharField())
    capabilities = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
    )
    defaults = serializers.DictField(required=False, default=dict)

    def validate_artifact(self, value):
        """Validate artifact has required fields."""
        if "s3Key" not in value:
            raise serializers.ValidationError("artifact.s3Key is required")
        if "sha256" not in value:
            raise serializers.ValidationError("artifact.sha256 is required")
        if len(value.get("sha256", "")) != 64:
            raise serializers.ValidationError("artifact.sha256 must be 64 characters")
        return value


class OfferingVersionSerializer(serializers.ModelSerializer):
    """Serializer for OfferingVersion model."""

    offering_version_id = serializers.UUIDField(source="id", read_only=True)
    artifact = serializers.SerializerMethodField()

    class Meta:
        model = OfferingVersion
        fields = [
            "offering_version_id",
            "version_label",
            "artifact",
            "capabilities",
            "defaults",
            "status",
            "created_at",
        ]
        read_only_fields = ["offering_version_id", "created_at"]

    def get_artifact(self, obj):
        return {
            "s3Key": obj.artifact_s3_key,
            "sha256": obj.artifact_sha256,
        }


class PlanSerializer(serializers.ModelSerializer):
    """Serializer for Plan model."""

    class Meta:
        model = Plan
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "billing_period",
            "price_credits",
            "included_credits",
            "limits",
            "is_default",
            "is_trial",
            "saleor_variant_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class OfferingDetailSerializer(OfferingSerializer):
    """Detailed serializer for Offering with versions and plans."""

    versions = OfferingVersionSerializer(many=True, read_only=True)
    plans = PlanSerializer(many=True, read_only=True)

    class Meta(OfferingSerializer.Meta):
        fields = OfferingSerializer.Meta.fields + ["versions", "plans"]
