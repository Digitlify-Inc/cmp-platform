"""App configuration for orgs."""

from django.apps import AppConfig


class OrgsConfig(AppConfig):
    """Configuration for the orgs app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "control_plane.apps.orgs"
    verbose_name = "Organizations"
