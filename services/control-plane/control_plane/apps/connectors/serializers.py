"""Serializers for connectors app."""

from rest_framework import serializers

from .models import ConnectorBinding


class ConnectorBindingSerializer(serializers.ModelSerializer):
    """Serializer for connector bindings."""

    class Meta:
        model = ConnectorBinding
        fields = [
            "id",
            "connector_id",
            "display_name",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ConnectorBindingCreateSerializer(serializers.Serializer):
    """Serializer for creating connector bindings."""

    connector_id = serializers.CharField(max_length=255)
    display_name = serializers.CharField(max_length=255)
    project_id = serializers.UUIDField()
    credentials = serializers.DictField(
        child=serializers.CharField(),
        required=False,
        help_text="Credentials to store in Vault (e.g., api_key, api_secret)",
    )
