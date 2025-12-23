"""App configuration for integrations."""

from django.apps import AppConfig


class IntegrationsConfig(AppConfig):
    """Configuration for the integrations app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "control_plane.apps.integrations"
    verbose_name = "Integrations"
