"""Admin configuration for instances app."""

from django.contrib import admin

from .models import APIKey, Instance


class APIKeyInline(admin.TabularInline):
    model = APIKey
    extra = 0
    readonly_fields = ["id", "key_prefix", "key_hash", "last_used_at", "created_at"]


@admin.register(Instance)
class InstanceAdmin(admin.ModelAdmin):
    list_display = [
        "offering_version",
        "organization",
        "project",
        "plan",
        "state",
        "created_at",
    ]
    list_filter = ["state", "organization"]
    search_fields = [
        "offering_version__offering__name",
        "organization__name",
        "name",
    ]
    readonly_fields = ["id", "effective_config", "created_at", "updated_at"]
    inlines = [APIKeyInline]


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "instance",
        "key_prefix",
        "is_active",
        "last_used_at",
        "expires_at",
        "created_at",
    ]
    list_filter = ["is_active"]
    search_fields = ["name", "key_prefix", "instance__name"]
    readonly_fields = ["id", "key_prefix", "key_hash", "last_used_at", "created_at"]
