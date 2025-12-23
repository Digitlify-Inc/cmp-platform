"""Serializers for Saleor integration."""

from rest_framework import serializers


# ============================================================================
# Saleor Event Serializers (direct webhook - alternative flow)
# ============================================================================

class OrderLineSerializer(serializers.Serializer):
    """Serializer for order line in Saleor event."""

    lineId = serializers.CharField()
    kind = serializers.ChoiceField(
        choices=["offering_plan", "credit_pack"],
        default="offering_plan",
    )
    offeringVersionId = serializers.CharField(required=False)
    planId = serializers.CharField(required=False)
    creditsAmount = serializers.IntegerField(required=False)


class SaleorOrderPaidEventSerializer(serializers.Serializer):
    """
    Serializer for normalized Saleor ORDER_FULLY_PAID event.

    This is the payload from Provisioner App, not raw Saleor webhook.
    """

    orderId = serializers.CharField()
    occurredAt = serializers.DateTimeField()
    customerId = serializers.CharField()  # email
    idempotencyKey = serializers.CharField()
    lines = OrderLineSerializer(many=True)


class SaleorOrderPaidResponseSerializer(serializers.Serializer):
    """Response for Saleor order paid event."""

    processed = serializers.BooleanField()
    actions = serializers.ListField(child=serializers.CharField())


# ============================================================================
# Commerce Provisioning Serializers (called by Provisioner)
# ============================================================================

class CommerceProvisionRequestSerializer(serializers.Serializer):
    """Request from Provisioner to provision an instance."""

    order_id = serializers.CharField()
    user_email = serializers.EmailField()
    offering_id = serializers.CharField()  # Saleor product ID or slug
    plan_id = serializers.CharField()  # Saleor variant ID or slug
    metadata = serializers.DictField(required=False, default=dict)


class CommerceProvisionResponseSerializer(serializers.Serializer):
    """Response for commerce provision request."""

    instance_id = serializers.CharField()
    api_key = serializers.CharField()
    status = serializers.CharField()


class CommerceAddCreditsRequestSerializer(serializers.Serializer):
    """Request from Provisioner to add credits."""

    order_id = serializers.CharField()
    user_email = serializers.EmailField()
    credit_amount = serializers.IntegerField(min_value=1)


class CommerceAddCreditsResponseSerializer(serializers.Serializer):
    """Response for add credits request."""

    wallet_id = serializers.CharField()
    credits_added = serializers.IntegerField()
    new_balance = serializers.IntegerField()
