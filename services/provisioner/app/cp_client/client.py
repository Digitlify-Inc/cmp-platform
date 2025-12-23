"""Control Plane client for provisioning operations."""

import logging
from dataclasses import dataclass
from typing import Any, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class ProvisioningResult:
    """Result of provisioning operation."""

    instance_id: str
    api_key: str
    status: str


class ControlPlaneClient:
    """Client for Control Plane API.

    Handles instance provisioning after successful order payment.
    """

    def __init__(self):
        self.base_url = settings.control_plane_url.rstrip("/")
        self.timeout = settings.control_plane_timeout

    async def provision_instance(
        self,
        order_id: str,
        user_email: str,
        offering_id: str,
        plan_id: str,
        metadata: Optional[dict[str, Any]] = None,
    ) -> ProvisioningResult:
        """
        Provision a new instance for a paid order.

        This is called after Saleor's OrderFullyPaid webhook.
        The Control Plane will:
        1. Find or create the user's organization
        2. Create an instance for the offering/plan
        3. Generate an API key
        4. Add starter credits if applicable

        Args:
            order_id: Saleor order ID (for idempotency)
            user_email: User's email address
            offering_id: The offering (product) being provisioned
            plan_id: The plan (variant) being provisioned
            metadata: Additional order metadata

        Returns:
            ProvisioningResult with instance ID and API key
        """
        url = f"{self.base_url}/integrations/commerce/provision"

        payload = {
            "order_id": order_id,
            "user_email": user_email,
            "offering_id": offering_id,
            "plan_id": plan_id,
            "metadata": metadata or {},
        }

        logger.info(f"Provisioning instance for order {order_id}, offering {offering_id}")

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()

                logger.info(
                    f"Provisioned instance {data.get('instance_id')} for order {order_id}"
                )

                return ProvisioningResult(
                    instance_id=data.get("instance_id", ""),
                    api_key=data.get("api_key", ""),
                    status=data.get("status", "active"),
                )

            except httpx.HTTPStatusError as e:
                logger.error(f"Provisioning failed for order {order_id}: {e}")
                raise
            except httpx.RequestError as e:
                logger.error(f"Control Plane request error: {e}")
                raise

    async def add_credits(
        self,
        order_id: str,
        user_email: str,
        credit_amount: int,
    ) -> dict[str, Any]:
        """
        Add credits to user's wallet for a credit pack purchase.

        Args:
            order_id: Saleor order ID
            user_email: User's email
            credit_amount: Amount of credits to add

        Returns:
            Wallet update result
        """
        url = f"{self.base_url}/integrations/commerce/add-credits"

        payload = {
            "order_id": order_id,
            "user_email": user_email,
            "credit_amount": credit_amount,
        }

        logger.info(f"Adding {credit_amount} credits for order {order_id}")

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()


# Singleton client
cp_client = ControlPlaneClient()
