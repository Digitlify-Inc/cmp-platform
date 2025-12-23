"""Billing models for credits and usage tracking."""

import uuid

from django.db import models


class Wallet(models.Model):
    """
    A wallet holds credit balance for an organization.

    Each organization has one wallet.
    Balance is stored as integer credits.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.OneToOneField(
        "orgs.Organization",
        on_delete=models.CASCADE,
        related_name="wallet",
    )
    balance = models.IntegerField(default=0)
    currency = models.CharField(max_length=20, default="credits")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Wallet({self.organization.name}: {self.balance} {self.currency})"


class LedgerEntry(models.Model):
    """
    A ledger entry records a credit transaction.

    Types:
    - topup: Credits added (purchase or trial)
    - usage: Credits debited (agent run)
    - refund: Credits returned
    - trial_grant: Initial trial credits
    """

    class EntryType(models.TextChoices):
        TOPUP = "topup", "Top-up"
        USAGE = "usage", "Usage"
        REFUND = "refund", "Refund"
        TRIAL_GRANT = "trial_grant", "Trial Grant"
        RESERVATION = "reservation", "Reservation"
        SETTLEMENT = "settlement", "Settlement"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name="ledger_entries",
    )
    amount = models.IntegerField()  # Positive = credit, Negative = debit
    entry_type = models.CharField(max_length=20, choices=EntryType.choices)
    reference_id = models.CharField(max_length=255, blank=True, default="")
    instance = models.ForeignKey(
        "instances.Instance",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_entries",
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Ledger entries"

    def __str__(self):
        sign = "+" if self.amount >= 0 else ""
        return f"Ledger({sign}{self.amount} {self.entry_type})"


class Reservation(models.Model):
    """
    A reservation holds credits for a pending operation.

    Created when authorizing a run, settled when complete.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SETTLED = "settled", "Settled"
        EXPIRED = "expired", "Expired"
        CANCELLED = "cancelled", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name="reservations",
    )
    instance = models.ForeignKey(
        "instances.Instance",
        on_delete=models.CASCADE,
        related_name="reservations",
    )
    amount = models.IntegerField()  # Reserved amount
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    settled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Reservation({self.amount} {self.status})"
