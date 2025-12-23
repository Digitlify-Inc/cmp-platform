"""Billing client for Control Plane API."""

import logging
from dataclasses import dataclass
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class AuthorizeResult:
    """Result of billing authorization."""

    allowed: bool
    reservation_id: str
    budget: int
    balance: int


@dataclass
class SettleResult:
    """Result of billing settlement."""

    debited: int
    balance: int
    ledger_entry_id: str
    status: str


class BillingClient:
    """Client for Control Plane billing API."""

    def __init__(self):
        self.base_url = settings.control_plane_url
        self.timeout = settings.control_plane_timeout

    async def authorize(
        self,
        instance_id: str,
        requested_budget: int = 0,
        token: str = None,
    ) -> AuthorizeResult:
        """
        Authorize a run by reserving credits.

        Returns authorization result with reservation ID.
        """
        async with httpx.AsyncClient() as client:
            headers = {}
            if token:
                headers["Authorization"] = f"Bearer {token}"

            try:
                response = await client.post(
                    f"{self.base_url}/billing/authorize",
                    json={
                        "instance_id": instance_id,
                        "requested_budget": requested_budget,
                    },
                    headers=headers,
                    timeout=self.timeout,
                )
                response.raise_for_status()
                data = response.json()

                return AuthorizeResult(
                    allowed=data["allowed"],
                    reservation_id=data["reservation_id"],
                    budget=data["budget"],
                    balance=data["balance"],
                )

            except httpx.HTTPStatusError as e:
                logger.error(f"Billing authorize failed: {e}")
                raise
            except httpx.RequestError as e:
                logger.error(f"Billing authorize request error: {e}")
                raise

    async def settle(
        self,
        reservation_id: str,
        instance_id: str,
        usage: Optional[dict] = None,
        token: str = None,
    ) -> SettleResult:
        """
        Settle a reservation and debit actual usage.

        Returns settlement result with final balance.
        """
        async with httpx.AsyncClient() as client:
            headers = {}
            if token:
                headers["Authorization"] = f"Bearer {token}"

            try:
                response = await client.post(
                    f"{self.base_url}/billing/settle",
                    json={
                        "reservation_id": reservation_id,
                        "instance_id": instance_id,
                        "usage": usage or {},
                    },
                    headers=headers,
                    timeout=self.timeout,
                )
                response.raise_for_status()
                data = response.json()

                return SettleResult(
                    debited=data["debited"],
                    balance=data["balance"],
                    ledger_entry_id=data["ledger_entry_id"],
                    status=data["status"],
                )

            except httpx.HTTPStatusError as e:
                logger.error(f"Billing settle failed: {e}")
                raise
            except httpx.RequestError as e:
                logger.error(f"Billing settle request error: {e}")
                raise


# Singleton client
billing_client = BillingClient()
