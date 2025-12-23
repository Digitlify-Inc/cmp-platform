"""Instance models for user subscriptions."""

import uuid

from django.db import models


class Instance(models.Model):
    """
    An instance is a user's subscription to an offering.

    Instances track:
    - Which offering version is subscribed
    - Which plan is being used
    - Custom configuration overrides
    - Lifecycle state
    """

    class State(models.TextChoices):
        REQUESTED = "requested", "Requested"
        PROVISIONING = "provisioning", "Provisioning"
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        TERMINATED = "terminated", "Terminated"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    offering_version = models.ForeignKey(
        "offerings.OfferingVersion",
        on_delete=models.PROTECT,
        related_name="instances",
    )
    organization = models.ForeignKey(
        "orgs.Organization",
        on_delete=models.CASCADE,
        related_name="instances",
    )
    project = models.ForeignKey(
        "orgs.Project",
        on_delete=models.CASCADE,
        related_name="instances",
    )
    plan = models.ForeignKey(
        "offerings.Plan",
        on_delete=models.PROTECT,
        related_name="instances",
    )
    name = models.CharField(max_length=255, blank=True, default="")
    state = models.CharField(
        max_length=20,
        choices=State.choices,
        default=State.REQUESTED,
    )
    overrides = models.JSONField(default=dict, blank=True)
    effective_config = models.JSONField(default=dict, blank=True)
    idempotency_key = models.CharField(max_length=255, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.offering_version.offering.name} @ {self.project}"

    def compute_effective_config(self):
        """
        Compute effective config by merging:
        1. Offering version defaults
        2. Plan limits
        3. Instance overrides
        """
        config = {}

        # Start with offering defaults
        config.update(self.offering_version.defaults or {})

        # Add plan limits
        if self.plan and self.plan.limits:
            config["limits"] = self.plan.limits

        # Apply instance overrides
        config.update(self.overrides or {})

        return config

    def save(self, *args, **kwargs):
        # Compute effective config on save
        self.effective_config = self.compute_effective_config()
        super().save(*args, **kwargs)


class APIKey(models.Model):
    """
    API key for accessing an instance.

    Each instance can have multiple API keys.
    Keys are hashed after creation - only the prefix is stored.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    instance = models.ForeignKey(
        Instance,
        on_delete=models.CASCADE,
        related_name="api_keys",
    )
    name = models.CharField(max_length=255)
    key_prefix = models.CharField(max_length=12)  # First 8 chars for display
    key_hash = models.CharField(max_length=64)  # SHA256 hash of full key
    last_used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "API key"
        verbose_name_plural = "API keys"

    def __str__(self):
        return f"{self.name} ({self.key_prefix}...)"
