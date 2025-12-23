"""App configuration for instances."""

from django.apps import AppConfig


class InstancesConfig(AppConfig):
    """Configuration for the instances app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "control_plane.apps.instances"
    verbose_name = "Instances"
