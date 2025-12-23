"""App configuration for connectors."""

from django.apps import AppConfig


class ConnectorsConfig(AppConfig):
    """Configuration for the connectors app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "control_plane.apps.connectors"
    verbose_name = "Connectors"
