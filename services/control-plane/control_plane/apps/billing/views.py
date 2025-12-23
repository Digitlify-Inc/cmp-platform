"""API views for billing app."""

import logging

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from control_plane.apps.orgs.models import Membership

from .models import Wallet
from .serializers import (
    BillingAuthorizeRequestSerializer,
    BillingAuthorizeResponseSerializer,
    BillingSettleRequestSerializer,
    BillingSettleResponseSerializer,
    WalletSerializer,
    WalletTopupSerializer,
)
from .services import BillingService

logger = logging.getLogger(__name__)


class WalletDetailView(APIView):
    """
    GET /wallets/{wallet_id}

    Get wallet details.
    """

    def get(self, request, wallet_id):
        """Get wallet by ID."""
        # Check access
        try:
            wallet = Wallet.objects.select_related("organization").get(id=wallet_id)
        except Wallet.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Wallet not found"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check user has access to organization
        if not Membership.objects.filter(
            organization=wallet.organization,
            user_id=request.user.id,
        ).exists():
            return Response(
                {"error": {"code": "forbidden", "message": "Access denied"}},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = WalletSerializer(wallet)
        return Response(serializer.data)


class WalletTopupView(APIView):
    """
    POST /wallets/{wallet_id}/topups

    Add credits to a wallet.
    """

    def post(self, request, wallet_id):
        """Top up wallet with credits."""
        serializer = WalletTopupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check access
        try:
            wallet = Wallet.objects.select_related("organization").get(id=wallet_id)
        except Wallet.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Wallet not found"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check user is admin
        if not Membership.objects.filter(
            organization=wallet.organization,
            user_id=request.user.id,
            role__in=[Membership.Role.OWNER, Membership.Role.ADMIN],
        ).exists():
            return Response(
                {"error": {"code": "forbidden", "message": "Admin access required"}},
                status=status.HTTP_403_FORBIDDEN,
            )

        wallet = BillingService.topup(
            wallet_id=str(wallet_id),
            credits_amount=serializer.validated_data["credits_amount"],
            idempotency_key=serializer.validated_data["idempotency_key"],
        )

        return Response(WalletSerializer(wallet).data)


class BillingAuthorizeView(APIView):
    permission_classes = [AllowAny]
    """
    POST /billing/authorize

    Authorize a run by reserving credits.
    """

    def post(self, request):
        """Authorize a run."""
        serializer = BillingAuthorizeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = BillingService.authorize(
            instance_id=str(serializer.validated_data["instance_id"]),
            requested_budget=serializer.validated_data.get("requested_budget", 0),
        )

        response_serializer = BillingAuthorizeResponseSerializer(
            {
                "allowed": result.allowed,
                "reservation_id": result.reservation_id,
                "budget": result.budget,
                "balance": result.balance,
            }
        )
        return Response(response_serializer.data)


class BillingSettleView(APIView):
    permission_classes = [AllowAny]
    """
    POST /billing/settle

    Settle a reservation and debit actual usage.
    """

    def post(self, request):
        """Settle a run."""
        serializer = BillingSettleRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = BillingService.settle(
            reservation_id=str(serializer.validated_data["reservation_id"]),
            instance_id=str(serializer.validated_data["instance_id"]),
            usage=serializer.validated_data.get("usage"),
        )

        response_serializer = BillingSettleResponseSerializer(
            {
                "debited": result.debited,
                "balance": result.balance,
                "ledger_entry_id": result.ledger_entry_id,
                "status": result.status,
            }
        )
        return Response(response_serializer.data)


class MyWalletView(APIView):
    """
    GET /wallets/me

    Get wallet for the current user's primary organization.
    """

    def get(self, request):
        """Get current user's wallet."""
        from control_plane.apps.orgs.models import Membership, Organization

        # Find user's primary organization (first one they own)
        user_id = request.user.id
        membership = Membership.objects.filter(
            user_id=user_id,
            role=Membership.Role.OWNER,
        ).select_related("organization").first()

        if not membership:
            # Try any membership
            membership = Membership.objects.filter(
                user_id=user_id,
            ).select_related("organization").first()

        if not membership:
            return Response(
                {"error": {"code": "not_found", "message": "No organization found"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            wallet = Wallet.objects.get(organization=membership.organization)
        except Wallet.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Wallet not found"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = WalletSerializer(wallet)
        return Response(serializer.data)


class MyWalletLedgerView(APIView):
    """
    GET /wallets/me/ledger

    Get ledger entries for the current user's primary organization wallet.
    """

    def get(self, request):
        """Get current user's wallet ledger entries."""
        from control_plane.apps.orgs.models import Membership

        from .models import LedgerEntry

        # Find user's primary organization
        user_id = request.user.id
        membership = Membership.objects.filter(
            user_id=user_id,
            role=Membership.Role.OWNER,
        ).select_related("organization").first()

        if not membership:
            membership = Membership.objects.filter(
                user_id=user_id,
            ).select_related("organization").first()

        if not membership:
            return Response(
                {"error": {"code": "not_found", "message": "No organization found"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            wallet = Wallet.objects.get(organization=membership.organization)
        except Wallet.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Wallet not found"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get ledger entries (most recent first)
        entries = LedgerEntry.objects.filter(wallet=wallet).select_related("instance")[:50]

        from .serializers import LedgerEntrySerializer
        serializer = LedgerEntrySerializer(entries, many=True)
        return Response(serializer.data)
