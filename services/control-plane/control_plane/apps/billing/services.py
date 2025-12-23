"""Business logic services for billing app."""

import logging
from dataclasses import dataclass
from typing import Optional

from django.db import transaction
from django.utils import timezone

from control_plane.apps.instances.models import Instance
from control_plane.exceptions import InsufficientCreditsError, ResourceNotFoundError

from .models import LedgerEntry, Reservation, Wallet

logger = logging.getLogger(__name__)

# Default budget per run if not specified
DEFAULT_RUN_BUDGET = 10


@dataclass
class AuthorizeResult:
    """Result of authorize operation."""

    allowed: bool
    reservation_id: str
    budget: int
    balance: int


@dataclass
class SettleResult:
    """Result of settle operation."""

    debited: int
    balance: int
    ledger_entry_id: str
    status: str


class BillingService:
    """Service for billing operations."""

    @classmethod
    @transaction.atomic
    def authorize(
        cls,
        instance_id: str,
        requested_budget: int = 0,
    ) -> AuthorizeResult:
        """
        Authorize a run by reserving credits.

        Creates a reservation that holds credits until settled.
        """
        # Get instance and wallet
        try:
            instance = Instance.objects.select_related(
                "organization__wallet"
            ).get(id=instance_id)
        except Instance.DoesNotExist:
            raise ResourceNotFoundError(f"Instance {instance_id} not found")

        wallet = instance.organization.wallet

        # Determine budget
        budget = requested_budget if requested_budget > 0 else DEFAULT_RUN_BUDGET

        # Check balance
        # Available = balance - pending reservations
        pending_reservations = Reservation.objects.filter(
            wallet=wallet,
            status=Reservation.Status.PENDING,
        ).aggregate(total=models.Sum("amount"))["total"] or 0

        available = wallet.balance - pending_reservations

        if available < budget:
            logger.warning(
                f"Insufficient credits for instance {instance_id}: "
                f"available={available}, requested={budget}"
            )
            # Still create reservation but with 0 budget and not allowed
            reservation = Reservation.objects.create(
                wallet=wallet,
                instance=instance,
                amount=0,
                status=Reservation.Status.CANCELLED,
            )
            return AuthorizeResult(
                allowed=False,
                reservation_id=str(reservation.id),
                budget=0,
                balance=wallet.balance,
            )

        # Create reservation
        reservation = Reservation.objects.create(
            wallet=wallet,
            instance=instance,
            amount=budget,
            status=Reservation.Status.PENDING,
        )

        logger.info(
            f"Authorized run for instance {instance_id}: "
            f"reservation={reservation.id}, budget={budget}"
        )

        return AuthorizeResult(
            allowed=True,
            reservation_id=str(reservation.id),
            budget=budget,
            balance=wallet.balance,
        )

    @classmethod
    @transaction.atomic
    def settle(
        cls,
        reservation_id: str,
        instance_id: str,
        usage: Optional[dict] = None,
    ) -> SettleResult:
        """
        Settle a reservation and debit actual usage.

        Calculates credit cost based on usage metrics.
        """
        # Get reservation
        try:
            reservation = Reservation.objects.select_related(
                "wallet", "instance"
            ).get(id=reservation_id)
        except Reservation.DoesNotExist:
            raise ResourceNotFoundError(f"Reservation {reservation_id} not found")

        if reservation.status != Reservation.Status.PENDING:
            # Already settled - return idempotent response
            logger.info(f"Reservation {reservation_id} already settled")
            # Find the ledger entry
            ledger_entry = LedgerEntry.objects.filter(
                reference_id=str(reservation_id)
            ).first()
            return SettleResult(
                debited=0,
                balance=reservation.wallet.balance,
                ledger_entry_id=str(ledger_entry.id) if ledger_entry else "",
                status="settled",
            )

        # Calculate credit cost from usage
        usage = usage or {}
        debited = cls._calculate_credit_cost(usage)

        # Cap debit at reserved amount
        debited = min(debited, reservation.amount)

        wallet = reservation.wallet

        # Debit wallet
        wallet.balance -= debited
        wallet.save()

        # Create ledger entry
        ledger_entry = LedgerEntry.objects.create(
            wallet=wallet,
            amount=-debited,
            entry_type=LedgerEntry.EntryType.USAGE,
            reference_id=str(reservation_id),
            instance=reservation.instance,
            metadata={"usage": usage},
        )

        # Mark reservation as settled
        reservation.status = Reservation.Status.SETTLED
        reservation.settled_at = timezone.now()
        reservation.save()

        logger.info(
            f"Settled reservation {reservation_id}: "
            f"debited={debited}, balance={wallet.balance}"
        )

        return SettleResult(
            debited=debited,
            balance=wallet.balance,
            ledger_entry_id=str(ledger_entry.id),
            status="settled",
        )

    @classmethod
    def _calculate_credit_cost(cls, usage: dict) -> int:
        """
        Calculate credit cost from usage metrics.

        Pricing (per 1 credit):
        - 1000 LLM tokens in
        - 500 LLM tokens out
        - 1 tool call
        - 1 request
        - 10 RAG queries
        """
        tokens_in = usage.get("llm_tokens_in", 0)
        tokens_out = usage.get("llm_tokens_out", 0)
        tool_calls = usage.get("tool_calls", 0)
        requests = usage.get("requests", 0)
        rag_queries = usage.get("rag_queries", 0)

        # Calculate credits
        credits = 0
        credits += tokens_in // 1000  # 1 credit per 1000 tokens in
        credits += (tokens_out * 2) // 1000  # 2x for output tokens
        credits += tool_calls  # 1 credit per tool call
        credits += requests  # 1 credit per request
        credits += rag_queries // 10  # 1 credit per 10 RAG queries

        # Minimum 1 credit per run
        return max(credits, 1)

    @classmethod
    @transaction.atomic
    def topup(
        cls,
        wallet_id: str,
        credits_amount: int,
        idempotency_key: str,
    ) -> Wallet:
        """
        Add credits to a wallet (idempotent).
        """
        # Check idempotency
        existing = LedgerEntry.objects.filter(reference_id=idempotency_key).first()
        if existing:
            logger.info(f"Topup already processed: {idempotency_key}")
            return existing.wallet

        # Get wallet
        try:
            wallet = Wallet.objects.get(id=wallet_id)
        except Wallet.DoesNotExist:
            raise ResourceNotFoundError(f"Wallet {wallet_id} not found")

        # Add credits
        wallet.balance += credits_amount
        wallet.save()

        # Create ledger entry
        LedgerEntry.objects.create(
            wallet=wallet,
            amount=credits_amount,
            entry_type=LedgerEntry.EntryType.TOPUP,
            reference_id=idempotency_key,
            metadata={"source": "topup"},
        )

        logger.info(f"Topped up wallet {wallet_id}: +{credits_amount} credits")

        return wallet


# Import models at module level to avoid circular import in _calculate_credit_cost
from django.db import models
