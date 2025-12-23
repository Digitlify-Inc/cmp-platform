"""Business logic services for instances app."""

import hashlib
import logging
import secrets
from dataclasses import dataclass
from typing import Optional

from django.db import transaction

from control_plane.apps.offerings.models import OfferingVersion, Plan
from control_plane.apps.orgs.models import Membership, Organization, Project
from control_plane.exceptions import DuplicateResourceError, ResourceNotFoundError

from .models import APIKey, Instance

logger = logging.getLogger(__name__)


@dataclass
class APIKeyResult:
    """Result of API key creation."""

    api_key: APIKey
    full_key: str  # Only available on creation


class InstanceService:
    """Service for instance operations."""

    @classmethod
    @transaction.atomic
    def create_instance(
        cls,
        offering_version_id: str,
        org_id: str,
        project_id: str,
        plan_id: str,
        name: str = "",
        overrides: Optional[dict] = None,
        idempotency_key: Optional[str] = None,
    ) -> Instance:
        """
        Create a new instance (subscription).

        Idempotent if idempotency_key is provided.
        """
        # Check idempotency
        if idempotency_key:
            existing = Instance.objects.filter(idempotency_key=idempotency_key).first()
            if existing:
                logger.info(f"Instance already exists for key: {idempotency_key}")
                return existing

        # Validate references
        try:
            offering_version = OfferingVersion.objects.get(id=offering_version_id)
        except OfferingVersion.DoesNotExist:
            raise ResourceNotFoundError(f"OfferingVersion {offering_version_id} not found")

        try:
            organization = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            raise ResourceNotFoundError(f"Organization {org_id} not found")

        try:
            project = Project.objects.get(id=project_id, organization=organization)
        except Project.DoesNotExist:
            raise ResourceNotFoundError(f"Project {project_id} not found")

        try:
            plan = Plan.objects.get(id=plan_id, offering=offering_version.offering)
        except Plan.DoesNotExist:
            raise ResourceNotFoundError(f"Plan {plan_id} not found")

        # Create instance
        instance = Instance.objects.create(
            offering_version=offering_version,
            organization=organization,
            project=project,
            plan=plan,
            name=name,
            overrides=overrides or {},
            idempotency_key=idempotency_key,
            state=Instance.State.ACTIVE,  # Auto-activate for now
        )

        logger.info(f"Created instance {instance.id} for {offering_version.offering.name}")

        return instance

    @classmethod
    def get_entitlements(cls, instance_id: str) -> dict:
        """
        Get computed entitlements for an instance.

        Returns capabilities and limits from the plan.
        """
        try:
            instance = Instance.objects.select_related(
                "offering_version", "plan"
            ).get(id=instance_id)
        except Instance.DoesNotExist:
            raise ResourceNotFoundError(f"Instance {instance_id} not found")

        # Build capabilities list with limits
        capabilities = []
        for cap_id in instance.offering_version.capabilities or []:
            cap = {"id": cap_id}
            # Add limits from plan if available
            if instance.plan.limits:
                cap["limits"] = instance.plan.limits
            capabilities.append(cap)

        return {
            "instance_id": str(instance.id),
            "capabilities": capabilities,
        }


class APIKeyService:
    """Service for API key operations."""

    @classmethod
    @transaction.atomic
    def create_api_key(
        cls,
        instance: Instance,
        name: str,
        expires_at=None,
    ) -> APIKeyResult:
        """
        Create a new API key for an instance.

        Returns the full key (only available on creation).
        """
        # Generate key: cmp_sk_<random>
        random_part = secrets.token_urlsafe(32)
        full_key = f"cmp_sk_{random_part}"
        key_prefix = full_key[:12]
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()

        api_key = APIKey.objects.create(
            instance=instance,
            name=name,
            key_prefix=key_prefix,
            key_hash=key_hash,
            expires_at=expires_at,
        )

        logger.info(f"Created API key {api_key.id} for instance {instance.id}")

        return APIKeyResult(api_key=api_key, full_key=full_key)

    @classmethod
    def validate_api_key(cls, key: str) -> Optional[Instance]:
        """
        Validate an API key and return the associated instance.

        Returns None if key is invalid.
        """
        if not key.startswith("cmp_sk_"):
            return None

        key_hash = hashlib.sha256(key.encode()).hexdigest()
        key_prefix = key[:12]

        try:
            api_key = APIKey.objects.select_related(
                "instance__organization",
                "instance__offering_version",
            ).get(
                key_hash=key_hash,
                key_prefix=key_prefix,
                is_active=True,
            )

            # Check expiration
            if api_key.expires_at:
                from django.utils import timezone
                if api_key.expires_at < timezone.now():
                    return None

            # Check instance state
            if api_key.instance.state != Instance.State.ACTIVE:
                return None

            # Update last used
            api_key.last_used_at = timezone.now()
            api_key.save(update_fields=["last_used_at"])

            return api_key.instance

        except APIKey.DoesNotExist:
            return None

    @classmethod
    def revoke_api_key(cls, api_key_id: str) -> APIKey:
        """Revoke an API key."""
        try:
            api_key = APIKey.objects.get(id=api_key_id)
        except APIKey.DoesNotExist:
            raise ResourceNotFoundError(f"API key {api_key_id} not found")

        api_key.is_active = False
        api_key.save()

        logger.info(f"Revoked API key {api_key_id}")

        return api_key

    @classmethod
    @transaction.atomic
    def start_trial(
        cls,
        user_id: str,
        email: str,
        product_slug: str,
    ) -> dict:
        """
        Start a free trial for a product.

        1. Get or create org/project/wallet for user
        2. Find offering by Saleor product slug
        3. Create trial instance
        4. Grant trial credits if first time
        """
        from control_plane.apps.billing.models import LedgerEntry, Wallet
        from control_plane.apps.orgs.services import WorkspaceService

        # Get or create workspace
        workspace = WorkspaceService.get_or_create_workspace_for_user(user_id, email)

        # Find offering by slug (assumes slug matches product slug)
        from control_plane.apps.offerings.models import Offering

        offering = Offering.objects.filter(slug=product_slug).first()
        if not offering:
            # Try fuzzy match on name
            offering = Offering.objects.filter(
                name__icontains=product_slug.replace("-", " ")
            ).first()

        if not offering:
            raise ValueError(f"Offering not found for product: {product_slug}")

        # Get latest version
        offering_version = offering.versions.order_by("-created_at").first()
        if not offering_version:
            raise ValueError(f"No versions found for offering: {offering.name}")

        # Get trial/free plan (lowest price)
        trial_plan = offering.plans.order_by("base_price").first()
        if not trial_plan:
            raise ValueError(f"No plans found for offering: {offering.name}")

        # Check for existing trial instance
        existing = Instance.objects.filter(
            organization=workspace.organization,
            offering_version__offering=offering,
        ).first()

        if existing:
            return {
                "instance": existing,
                "credits_granted": 0,
            }

        # Create trial instance
        instance = cls.create_instance(
            offering_version_id=str(offering_version.id),
            org_id=str(workspace.organization.id),
            project_id=str(workspace.project.id),
            plan_id=str(trial_plan.id),
            name=f"{offering.name} Trial",
            idempotency_key=f"trial:{user_id}:{offering.id}",
        )

        # Grant trial credits if wallet has 0 balance
        credits_granted = 0
        wallet = workspace.organization.wallet
        if wallet.balance == 0:
            trial_credits = 100  # Default trial credits
            wallet.balance += trial_credits
            wallet.save()

            LedgerEntry.objects.create(
                wallet=wallet,
                amount=trial_credits,
                entry_type=LedgerEntry.EntryType.TRIAL_GRANT,
                reference_id=f"trial:{instance.id}",
                metadata={"offering": offering.name},
            )
            credits_granted = trial_credits

        logger.info(f"Started trial for {email}: instance {instance.id}, credits: {credits_granted}")

        return {
            "instance": instance,
            "credits_granted": credits_granted,
        }
