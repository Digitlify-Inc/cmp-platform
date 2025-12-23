"""Connector models for external service bindings."""

import uuid

from django.db import models


class ConnectorBinding(models.Model):
    """
    A connector binding links an external service to an organization.

    Credentials are stored in Vault at the specified path.
    """

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        REVOKED = "revoked", "Revoked"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "orgs.Organization",
        on_delete=models.CASCADE,
        related_name="connector_bindings",
    )
    project = models.ForeignKey(
        "orgs.Project",
        on_delete=models.CASCADE,
        related_name="connector_bindings",
    )
    connector_id = models.CharField(max_length=255)  # e.g., "openai", "slack"
    display_name = models.CharField(max_length=255)
    vault_path = models.CharField(max_length=500)  # Path in Vault
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.connector_id}: {self.display_name}"
