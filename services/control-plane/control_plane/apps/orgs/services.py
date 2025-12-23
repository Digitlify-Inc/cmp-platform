"""Business logic services for orgs app."""

import logging
from dataclasses import dataclass
from typing import Optional

from django.conf import settings
from django.db import transaction

from control_plane.apps.billing.models import Wallet

from .models import Membership, Organization, Project

logger = logging.getLogger(__name__)


@dataclass
class WorkspaceResult:
    """Result of workspace auto-creation."""

    organization: Organization
    project: Project
    wallet: Wallet
    trial_granted: bool


class WorkspaceService:
    """Service for managing workspaces."""

    @classmethod
    @transaction.atomic
    def get_or_create_personal_workspace(
        cls,
        user_id: str,
        username: str,
        email: str,
    ) -> WorkspaceResult:
        """
        Get or create a personal workspace for a user.

        This is called on first login or when accessing /orgs/auto.
        Creates:
        - Organization (personal workspace)
        - Default project
        - Wallet with trial credits
        - Owner membership

        Returns existing workspace if already created.
        """
        # Check if user already has an organization they own
        existing_org = Organization.objects.filter(owner_id=user_id).first()

        if existing_org:
            # Return existing workspace
            project = existing_org.projects.filter(is_default=True).first()
            if not project:
                project = existing_org.projects.first()

            wallet = Wallet.objects.filter(organization=existing_org).first()

            return WorkspaceResult(
                organization=existing_org,
                project=project,
                wallet=wallet,
                trial_granted=False,
            )

        # Create new personal workspace
        org_name = f"{username}'s Workspace"
        organization = Organization.objects.create(
            name=org_name,
            owner_id=user_id,
        )

        # Create default project
        project = Project.objects.create(
            organization=organization,
            name="Default",
            is_default=True,
        )

        # Create wallet with trial credits
        wallet = Wallet.objects.create(
            organization=organization,
            balance=settings.TRIAL_CREDITS,
        )

        # Create owner membership
        Membership.objects.create(
            organization=organization,
            user_id=user_id,
            role=Membership.Role.OWNER,
        )

        logger.info(
            f"Created personal workspace for user {user_id}: "
            f"org={organization.id}, project={project.id}, wallet={wallet.id}"
        )

        return WorkspaceResult(
            organization=organization,
            project=project,
            wallet=wallet,
            trial_granted=True,
        )

    @classmethod
    def get_user_organizations(cls, user_id: str) -> list[Organization]:
        """Get all organizations a user is a member of."""
        membership_org_ids = Membership.objects.filter(user_id=user_id).values_list(
            "organization_id", flat=True
        )
        return list(Organization.objects.filter(id__in=membership_org_ids))

    @classmethod
    def get_user_role(cls, user_id: str, organization: Organization) -> Optional[str]:
        """Get user's role in an organization."""
        try:
            membership = Membership.objects.get(organization=organization, user_id=user_id)
            return membership.role
        except Membership.DoesNotExist:
            return None

    @classmethod
    def user_can_access(cls, user_id: str, organization: Organization) -> bool:
        """Check if user can access an organization."""
        return Membership.objects.filter(organization=organization, user_id=user_id).exists()

    @classmethod
    def user_is_admin(cls, user_id: str, organization: Organization) -> bool:
        """Check if user is admin or owner of an organization."""
        return Membership.objects.filter(
            organization=organization,
            user_id=user_id,
            role__in=[Membership.Role.OWNER, Membership.Role.ADMIN],
        ).exists()


    @classmethod
    @transaction.atomic
    def get_or_create_workspace_for_customer(
        cls,
        email: str,
    ) -> WorkspaceResult:
        """
        Get or create a workspace for a customer by email.

        Used by Saleor integration when processing orders.
        The email is the customer identifier from Saleor.
        """
        # Check if organization exists for this email (as owner)
        # For now, we use email as the user_id
        existing_org = Organization.objects.filter(
            memberships__user_id=email,
            memberships__role=Membership.Role.OWNER,
        ).first()

        if existing_org:
            # Return existing workspace
            project = existing_org.projects.filter(is_default=True).first()
            if not project:
                project = existing_org.projects.first()

            wallet = Wallet.objects.filter(organization=existing_org).first()

            return WorkspaceResult(
                organization=existing_org,
                project=project,
                wallet=wallet,
                trial_granted=False,
            )

        # Create new workspace for customer
        username = email.split("@")[0]
        org_name = f"{username}'s Workspace"
        organization = Organization.objects.create(
            name=org_name,
            owner_id=email,  # Use email as owner_id for now
        )

        # Create default project
        project = Project.objects.create(
            organization=organization,
            name="Default",
            is_default=True,
        )

        # Create wallet with trial credits
        wallet = Wallet.objects.create(
            organization=organization,
            balance=settings.TRIAL_CREDITS,
        )

        # Create owner membership
        Membership.objects.create(
            organization=organization,
            user_id=email,
            role=Membership.Role.OWNER,
        )

        logger.info(
            f"Created workspace for customer {email}: "
            f"org={organization.id}, project={project.id}, wallet={wallet.id}"
        )

        return WorkspaceResult(
            organization=organization,
            project=project,
            wallet=wallet,
            trial_granted=True,
        )


    @classmethod
    @transaction.atomic
    def get_or_create_workspace_for_user(
        cls,
        user_id: str,
        email: str,
    ) -> WorkspaceResult:
        """
        Get or create a workspace for an authenticated user.

        Used by trial creation and account setup.
        """
        from control_plane.apps.billing.models import Wallet

        # Check if organization exists for this user
        existing_org = Organization.objects.filter(
            memberships__user_id=user_id,
            memberships__role=Membership.Role.OWNER,
        ).first()

        if existing_org:
            # Return existing workspace
            project = existing_org.projects.filter(is_default=True).first()
            if not project:
                project = existing_org.projects.first()

            wallet = Wallet.objects.filter(organization=existing_org).first()

            return WorkspaceResult(
                organization=existing_org,
                project=project,
                wallet=wallet,
                trial_granted=False,
            )

        # Create new organization
        org_name = email.split("@")[0].replace(".", " ").title() + " Workspace"
        organization = Organization.objects.create(name=org_name)

        # Create owner membership
        Membership.objects.create(
            organization=organization,
            user_id=user_id,
            role=Membership.Role.OWNER,
        )

        # Create default project
        project = Project.objects.create(
            organization=organization,
            name="Default Project",
            is_default=True,
        )

        # Create wallet
        wallet = Wallet.objects.create(
            organization=organization,
            balance=0,
        )

        logger.info(f"Created workspace for user {email}: org={organization.id}")

        return WorkspaceResult(
            organization=organization,
            project=project,
            wallet=wallet,
            trial_granted=True,
        )
