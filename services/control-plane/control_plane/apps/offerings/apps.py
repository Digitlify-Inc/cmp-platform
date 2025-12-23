"""App configuration for offerings."""

from django.apps import AppConfig


class OfferingsConfig(AppConfig):
    """Configuration for the offerings app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "control_plane.apps.offerings"
    verbose_name = "Offerings"
