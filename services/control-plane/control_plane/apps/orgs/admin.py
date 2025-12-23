"""Admin configuration for orgs app."""

from django.contrib import admin

from .models import Membership, Organization, Project, Team


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "owner_id", "created_at"]
    search_fields = ["name", "slug", "owner_id"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["name", "organization", "slug", "is_default", "created_at"]
    list_filter = ["is_default", "organization"]
    search_fields = ["name", "slug"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ["name", "organization", "slug", "created_at"]
    list_filter = ["organization"]
    search_fields = ["name", "slug"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ["user_id", "organization", "role", "created_at"]
    list_filter = ["role", "organization"]
    search_fields = ["user_id"]
    readonly_fields = ["id", "created_at", "updated_at"]
