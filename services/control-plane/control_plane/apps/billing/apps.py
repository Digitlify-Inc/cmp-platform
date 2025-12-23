"""App configuration for billing."""

from django.apps import AppConfig


class BillingConfig(AppConfig):
    """Configuration for the billing app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "control_plane.apps.billing"
    verbose_name = "Billing"
