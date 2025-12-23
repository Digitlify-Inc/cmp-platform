"""Offering models for agent/app catalog."""

import uuid

from django.db import models
from slugify import slugify


class Offering(models.Model):
    """
    An offering is an agent or app available in the marketplace.

    Offerings can have multiple versions, each immutable after publish.
    """

    class Category(models.TextChoices):
        AGENT = "agent", "Agent"
        APP = "app", "App"
        ASSISTANT = "assistant", "Assistant"
        AUTOMATION = "automation", "Automation"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        PAUSED = "paused", "Paused"
        EOS = "eos", "End of Sale"
        EOL = "eol", "End of Life"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    category = models.CharField(max_length=20, choices=Category.choices)
    description = models.TextField(blank=True, default="")
    value_streams = models.JSONField(default=list, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    saleor_product_id = models.CharField(max_length=255, blank=True, default="")
    thumbnail_url = models.URLField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Offering.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class OfferingVersion(models.Model):
    """
    A version of an offering.

    Versions are immutable after publish. Each version contains:
    - Artifact reference (S3 key + SHA256)
    - Capabilities
    - Default configuration
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        PAUSED = "paused", "Paused"
        DEPRECATED = "deprecated", "Deprecated"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    offering = models.ForeignKey(
        Offering,
        on_delete=models.CASCADE,
        related_name="versions",
    )
    version_label = models.CharField(max_length=50)  # e.g., "1.0.0"
    artifact_s3_key = models.CharField(max_length=500)
    artifact_sha256 = models.CharField(max_length=64)
    capabilities = models.JSONField(default=list, blank=True)
    defaults = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = [["offering", "version_label"]]

    def __str__(self):
        return f"{self.offering.name} v{self.version_label}"


class Plan(models.Model):
    """
    A pricing plan for an offering.

    Plans define the pricing and limits for an offering version.
    """

    class BillingPeriod(models.TextChoices):
        MONTHLY = "monthly", "Monthly"
        YEARLY = "yearly", "Yearly"
        ONE_TIME = "one_time", "One-time"
        USAGE = "usage", "Usage-based"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    offering = models.ForeignKey(
        Offering,
        on_delete=models.CASCADE,
        related_name="plans",
    )
    name = models.CharField(max_length=255)  # e.g., "Free", "Pro", "Enterprise"
    slug = models.SlugField(max_length=255)
    description = models.TextField(blank=True, default="")
    billing_period = models.CharField(
        max_length=20,
        choices=BillingPeriod.choices,
        default=BillingPeriod.MONTHLY,
    )
    price_credits = models.IntegerField(default=0)  # Price in credits
    included_credits = models.IntegerField(default=0)  # Credits included
    limits = models.JSONField(default=dict, blank=True)  # Rate limits, quotas
    is_default = models.BooleanField(default=False)
    is_trial = models.BooleanField(default=False)
    saleor_variant_id = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["price_credits"]
        unique_together = [["offering", "slug"]]

    def __str__(self):
        return f"{self.offering.name} - {self.name}"
