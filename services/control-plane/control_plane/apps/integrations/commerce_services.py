"""Commerce provisioning services - called by Provisioner App."""

import logging
from dataclasses import dataclass

from django.db import transaction

from control_plane.apps.billing.models import LedgerEntry
from control_plane.apps.instances.services import APIKeyService, InstanceService
from control_plane.apps.offerings.models import Offering
from control_plane.apps.orgs.services import WorkspaceService

from .models import IdempotencyRecord

logger = logging.getLogger(__name__)


@dataclass
class ProvisioningResult:
    """Result of provisioning an instance."""

    instance_id: str
    api_key: str
    status: str


@dataclass
class AddCreditsResult:
    """Result of adding credits."""

    wallet_id: str
    credits_added: int
    new_balance: int


class CommerceProvisioningService:
    """Service for handling provisioning requests from Provisioner App."""

    @classmethod
    @transaction.atomic
    def provision_instance(
        cls,
        order_id: str,
        user_email: str,
        offering_id: str,
        plan_id: str,
        metadata: dict = None,
    ) -> ProvisioningResult:
        """Provision an instance for a paid order."""
        metadata = metadata or {}
        idempotency_key = f"provision:{order_id}:{offering_id}"

        existing = IdempotencyRecord.objects.filter(key=idempotency_key).first()
        if existing:
            return ProvisioningResult(
                instance_id=existing.response.get("instance_id", ""),
                api_key=existing.response.get("api_key", ""),
                status="active",
            )

        workspace = WorkspaceService.get_or_create_workspace_for_customer(email=user_email)

        # Find offering
        offering = None
        cp_offering_id = metadata.get("cp_offering_id")
        if cp_offering_id:
            offering = Offering.objects.filter(slug=cp_offering_id).first()
        if not offering:
            offering = Offering.objects.filter(saleor_product_id=offering_id).first()
        if not offering:
            product_name = metadata.get("product_name", "")
            if product_name:
                slug = product_name.lower().replace(" ", "-")
                offering = Offering.objects.filter(slug__icontains=slug).first()
        if not offering:
            raise ValueError(f"Offering not found for ID: {offering_id}")

        # Get version and plan
        offering_version = offering.versions.order_by("-created_at").first()
        if not offering_version:
            raise ValueError(f"No version found for offering: {offering.name}")

        plan = offering.plans.filter(saleor_variant_id=plan_id).first()
        if not plan:
            plan = offering.plans.order_by("price_credits").first()
        if not plan:
            raise ValueError(f"No plan found for offering: {offering.name}")

        # Create instance
        instance = InstanceService.create_instance(
            offering_version_id=str(offering_version.id),
            org_id=str(workspace.organization.id),
            project_id=str(workspace.project.id),
            plan_id=str(plan.id),
            name=metadata.get("product_name", offering.name),
            idempotency_key=idempotency_key,
        )

        # Generate API key
        api_key_result = APIKeyService.create_api_key(
            instance=instance,
            name=f"Default Key - Order {order_id}",
        )

        # Record idempotency
        IdempotencyRecord.objects.create(
            key=idempotency_key,
            response={"instance_id": str(instance.id), "api_key": api_key_result.full_key},
        )

        logger.info(f"Provisioned instance {instance.id} for {user_email}")

        return ProvisioningResult(
            instance_id=str(instance.id),
            api_key=api_key_result.full_key,
            status="active",
        )

    @classmethod
    @transaction.atomic
    def add_credits(cls, order_id: str, user_email: str, credit_amount: int) -> AddCreditsResult:
        """Add credits to a user's wallet."""
        idempotency_key = f"credits:{order_id}"

        existing = IdempotencyRecord.objects.filter(key=idempotency_key).first()
        if existing:
            return AddCreditsResult(
                wallet_id=existing.response.get("wallet_id", ""),
                credits_added=existing.response.get("credits_added", 0),
                new_balance=existing.response.get("new_balance", 0),
            )

        workspace = WorkspaceService.get_or_create_workspace_for_customer(email=user_email)
        wallet = workspace.wallet
        wallet.balance += credit_amount
        wallet.save()

        LedgerEntry.objects.create(
            wallet=wallet,
            amount=credit_amount,
            entry_type=LedgerEntry.EntryType.TOPUP,
            reference_id=idempotency_key,
            metadata={"source": "saleor", "order_id": order_id},
        )

        IdempotencyRecord.objects.create(
            key=idempotency_key,
            response={"wallet_id": str(wallet.id), "credits_added": credit_amount, "new_balance": wallet.balance},
        )

        logger.info(f"Added {credit_amount} credits for {user_email}")

        return AddCreditsResult(
            wallet_id=str(wallet.id),
            credits_added=credit_amount,
            new_balance=wallet.balance,
        )
