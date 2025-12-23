"""Serializers for billing app."""

from rest_framework import serializers

from .models import LedgerEntry, Reservation, Wallet


class WalletSerializer(serializers.ModelSerializer):
    """Serializer for Wallet model."""

    wallet_id = serializers.UUIDField(source="id", read_only=True)

    class Meta:
        model = Wallet
        fields = ["wallet_id", "balance", "currency"]
        read_only_fields = ["wallet_id", "balance", "currency"]


class LedgerEntrySerializer(serializers.ModelSerializer):
    """Serializer for LedgerEntry model."""

    class Meta:
        model = LedgerEntry
        fields = [
            "id",
            "amount",
            "entry_type",
            "reference_id",
            "instance",
            "metadata",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class WalletTopupSerializer(serializers.Serializer):
    """Serializer for wallet top-up request."""

    credits_amount = serializers.IntegerField(min_value=1)
    idempotency_key = serializers.CharField(max_length=255)


class BillingAuthorizeRequestSerializer(serializers.Serializer):
    """Serializer for billing authorize request."""

    instance_id = serializers.UUIDField()
    requested_budget = serializers.IntegerField(min_value=0, default=0)


class BillingAuthorizeResponseSerializer(serializers.Serializer):
    """Serializer for billing authorize response."""

    allowed = serializers.BooleanField()
    reservation_id = serializers.UUIDField()
    budget = serializers.IntegerField()
    balance = serializers.IntegerField()


class BillingSettleRequestSerializer(serializers.Serializer):
    """Serializer for billing settle request."""

    reservation_id = serializers.UUIDField()
    instance_id = serializers.UUIDField()
    usage = serializers.DictField(child=serializers.IntegerField(min_value=0), required=False)


class BillingSettleResponseSerializer(serializers.Serializer):
    """Serializer for billing settle response."""

    debited = serializers.IntegerField()
    balance = serializers.IntegerField()
    ledger_entry_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=["settled", "pending_reconciliation"])
