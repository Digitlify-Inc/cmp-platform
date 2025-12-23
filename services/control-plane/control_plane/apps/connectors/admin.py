"""Admin configuration for connectors app."""

from django.contrib import admin

from .models import ConnectorBinding


@admin.register(ConnectorBinding)
class ConnectorBindingAdmin(admin.ModelAdmin):
    list_display = [
        "connector_id",
        "display_name",
        "organization",
        "project",
        "status",
        "created_at",
    ]
    list_filter = ["status", "connector_id", "organization"]
    search_fields = ["connector_id", "display_name", "organization__name"]
    readonly_fields = ["id", "created_at", "updated_at"]
