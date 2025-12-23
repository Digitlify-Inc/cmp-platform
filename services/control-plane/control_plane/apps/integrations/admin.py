"""Admin configuration for integrations app."""

from django.contrib import admin

from .models import IdempotencyRecord


@admin.register(IdempotencyRecord)
class IdempotencyRecordAdmin(admin.ModelAdmin):
    list_display = ["key", "created_at"]
    search_fields = ["key"]
    readonly_fields = ["key", "response", "created_at"]
