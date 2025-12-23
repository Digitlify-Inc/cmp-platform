"""Integrations models for idempotency tracking."""

from django.db import models


class IdempotencyRecord(models.Model):
    """
    Record of processed webhook events for idempotency.

    Used to ensure webhook handlers are idempotent.
    """

    key = models.CharField(max_length=255, primary_key=True)
    response = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Idempotency records"

    def __str__(self):
        return self.key
