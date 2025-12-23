"""Vault client for retrieving connector secrets.

Supports Kubernetes auth method for service account authentication.
"""

import os
from typing import Any

import httpx
import structlog

from app.config import settings

logger = structlog.get_logger()


class VaultClient:
    """Client for HashiCorp Vault using Kubernetes authentication."""

    def __init__(self):
        self._token: str | None = None
        self._token_expires_at: float = 0

    async def _authenticate(self) -> str | None:
        """Authenticate to Vault using Kubernetes service account.

        Returns the Vault token or None if authentication fails.
        """
        # Read service account token
        sa_token_path = "/var/run/secrets/kubernetes.io/serviceaccount/token"

        try:
            if os.path.exists(sa_token_path):
                with open(sa_token_path) as f:
                    jwt = f.read().strip()
            else:
                # For local development, use root token if available
                root_token = os.environ.get("VAULT_TOKEN")
                if root_token:
                    logger.debug("Using VAULT_TOKEN for authentication")
                    return root_token
                logger.warning("No service account token found and no VAULT_TOKEN set")
                return None

            # Authenticate with Vault
            auth_url = f"{settings.vault_addr}/v1/{settings.vault_mount_path}/login"

            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    auth_url,
                    json={
                        "role": settings.vault_role,
                        "jwt": jwt,
                    },
                )
                response.raise_for_status()
                data = response.json()

                token = data["auth"]["client_token"]
                logger.info("Successfully authenticated to Vault")
                return token

        except FileNotFoundError:
            logger.error("Service account token not found", path=sa_token_path)
            return None
        except httpx.HTTPError as e:
            logger.error("Vault authentication failed", error=str(e))
            return None
        except Exception as e:
            logger.error("Unexpected error during Vault authentication", error=str(e))
            return None

    async def _get_token(self) -> str | None:
        """Get a valid Vault token, authenticating if necessary."""
        import time

        # Check if we have a valid cached token
        if self._token and time.time() < self._token_expires_at:
            return self._token

        # Authenticate and cache the token
        token = await self._authenticate()
        if token:
            self._token = token
            # Cache for 5 minutes (Vault tokens typically last longer)
            self._token_expires_at = time.time() + 300

        return self._token

    async def get_secrets(self, path: str) -> dict[str, Any] | None:
        """Retrieve secrets from Vault at the given path.

        Args:
            path: Vault secret path (e.g., "connectors/org123/proj456/binding789")

        Returns:
            Dictionary of secrets or None if retrieval fails.
        """
        token = await self._get_token()
        if not token:
            logger.error("No Vault token available")
            return None

        # Build the full path
        # Path format: kv/data/connectors/{orgId}/{projectId}/{bindingId}
        full_path = f"{settings.vault_addr}/v1/{path}"

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    full_path,
                    headers={"X-Vault-Token": token},
                )

                if response.status_code == 404:
                    logger.warning("Secret not found", path=path)
                    return None

                response.raise_for_status()
                data = response.json()

                # KV v2 secrets are nested under data.data
                secrets = data.get("data", {}).get("data", {})
                logger.debug("Retrieved secrets from Vault", path=path, keys=list(secrets.keys()))
                return secrets

        except httpx.HTTPError as e:
            logger.error("Failed to retrieve secrets from Vault", path=path, error=str(e))
            return None

    async def check_health(self) -> bool:
        """Check if Vault is healthy and accessible."""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{settings.vault_addr}/v1/sys/health")
                # Vault returns 200 for initialized+unsealed, 429 for standby
                return response.status_code in (200, 429)
        except Exception as e:
            logger.error("Vault health check failed", error=str(e))
            return False


# Singleton instance
vault_client = VaultClient()
