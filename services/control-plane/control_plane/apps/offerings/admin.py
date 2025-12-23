"""Admin configuration for offerings app."""

from django.contrib import admin

from .models import Offering, OfferingVersion, Plan


class OfferingVersionInline(admin.TabularInline):
    model = OfferingVersion
    extra = 0
    readonly_fields = ["id", "created_at"]


class PlanInline(admin.TabularInline):
    model = Plan
    extra = 0
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(Offering)
class OfferingAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "category", "status", "created_at"]
    list_filter = ["category", "status"]
    search_fields = ["name", "slug"]
    readonly_fields = ["id", "created_at", "updated_at"]
    inlines = [OfferingVersionInline, PlanInline]


@admin.register(OfferingVersion)
class OfferingVersionAdmin(admin.ModelAdmin):
    list_display = ["offering", "version_label", "status", "created_at"]
    list_filter = ["status", "offering"]
    search_fields = ["offering__name", "version_label"]
    readonly_fields = ["id", "created_at"]


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = [
        "offering",
        "name",
        "billing_period",
        "price_credits",
        "is_default",
        "is_trial",
    ]
    list_filter = ["billing_period", "is_default", "is_trial", "offering"]
    search_fields = ["offering__name", "name"]
    readonly_fields = ["id", "created_at", "updated_at"]
