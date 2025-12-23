"""Business logic for Saleor integration."""

import logging
from dataclasses import dataclass
from typing import List

from django.db import transaction

from control_plane.apps.billing.models import LedgerEntry, Wallet
from control_plane.apps.instances.services import InstanceService
from control_plane.apps.orgs.services import WorkspaceService

from .models import IdempotencyRecord

logger = logging.getLogger(__name__)


@dataclass
class OrderProcessingResult:
    """Result of processing a Saleor order."""

    processed: bool
    actions: List[str]


class SaleorIntegrationService:
    """Service for processing Saleor events."""

    @classmethod
    @transaction.atomic
    def process_order_paid(
        cls,
        order_id: str,
        occurred_at: str,
        customer_id: str,  # email
        idempotency_key: str,
        lines: List[dict],
    ) -> OrderProcessingResult:
        """
        Process a Saleor ORDER_FULLY_PAID event.

        Creates instances for offering plans, or tops up wallet for credit packs.
        Idempotent by idempotency_key.
        """
        # Check idempotency
        existing = IdempotencyRecord.objects.filter(key=idempotency_key).first()
        if existing:
            logger.info(f"Order already processed: {idempotency_key}")
            return OrderProcessingResult(
                processed=True,
                actions=existing.response.get("actions", []),
            )

        actions = []

        # Get or create workspace for customer
        workspace = WorkspaceService.get_or_create_workspace_for_customer(
            email=customer_id,
        )

        for line in lines:
            line_id = line.get("lineId")
            kind = line.get("kind", "offering_plan")
            line_idempotency_key = f"{idempotency_key}:{line_id}"

            if kind == "offering_plan":
                # Create instance
                offering_version_id = line.get("offeringVersionId")
                plan_id = line.get("planId")

                if not offering_version_id or not plan_id:
                    logger.warning(f"Missing offeringVersionId or planId for line {line_id}")
                    continue

                try:
                    instance = InstanceService.create_instance(
                        offering_version_id=offering_version_id,
                        org_id=str(workspace.organization.id),
                        project_id=str(workspace.project.id),
                        plan_id=plan_id,
                        name=f"Order {order_id}",
                        idempotency_key=line_idempotency_key,
                    )
                    actions.append(f"instance_created:{instance.id}")
                    logger.info(f"Created instance {instance.id} for order {order_id}")
                except Exception as e:
                    logger.error(f"Failed to create instance for line {line_id}: {e}")
                    actions.append(f"instance_failed:{line_id}:{str(e)}")

            elif kind == "credit_pack":
                # Top up wallet
                credits_amount = line.get("creditsAmount", 0)
                if credits_amount <= 0:
                    logger.warning(f"Invalid credits amount for line {line_id}")
                    continue

                try:
                    wallet = workspace.organization.wallet
                    wallet.balance += credits_amount
                    wallet.save()

                    # Create ledger entry
                    LedgerEntry.objects.create(
                        wallet=wallet,
                        amount=credits_amount,
                        entry_type=LedgerEntry.EntryType.TOPUP,
                        reference_id=line_idempotency_key,
                        metadata={
                            "source": "saleor",
                            "order_id": order_id,
                        },
                    )
                    actions.append(f"credits_added:{credits_amount}")
                    logger.info(f"Added {credits_amount} credits for order {order_id}")
                except Exception as e:
                    logger.error(f"Failed to add credits for line {line_id}: {e}")
                    actions.append(f"credits_failed:{line_id}:{str(e)}")

        # Record idempotency
        IdempotencyRecord.objects.create(
            key=idempotency_key,
            response={"processed": True, "actions": actions},
        )

        return OrderProcessingResult(processed=True, actions=actions)
