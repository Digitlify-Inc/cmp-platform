"""Vault client for secret management.

This module provides a client for interacting with HashiCorp Vault
to store and retrieve connector credentials.
"""

import logging
from typing import Any, Optional

import hvac
from django.conf import settings

logger = logging.getLogger(__name__)


class VaultClient:
    """Client for HashiCorp Vault operations."""

    def __init__(
        self,
        addr: Optional[str] = None,
        token: Optional[str] = None,
    ):
        """Initialize Vault client.
        
        Args:
            addr: Vault server address (defaults to settings.VAULT_ADDR)
            token: Vault token (defaults to settings.VAULT_TOKEN)
        """
        self.addr = addr or getattr(settings, "VAULT_ADDR", "")
        self.token = token or getattr(settings, "VAULT_TOKEN", "")
        self._client: Optional[hvac.Client] = None

    @property
    def client(self) -> hvac.Client:
        """Get or create Vault client."""
        if self._client is None:
            self._client = hvac.Client(
                url=self.addr,
                token=self.token,
            )
        return self._client

    @property
    def is_configured(self) -> bool:
        """Check if Vault is properly configured."""
        return bool(self.addr and self.token)

    def is_authenticated(self) -> bool:
        """Check if client is authenticated with Vault."""
        if not self.is_configured:
            return False
        try:
            return self.client.is_authenticated()
        except Exception as e:
            logger.warning(f"Vault authentication check failed: {e}")
            return False

    def read_secret(self, path: str) -> Optional[dict[str, Any]]:
        """Read a secret from Vault KV v2.
        
        Args:
            path: Full path to secret (e.g., "kv/data/connectors/org/proj/id")
        
        Returns:
            Secret data dict or None if not found
        """
        if not self.is_configured:
            logger.warning("Vault not configured, cannot read secret")
            return None

        try:
            # Parse mount point and secret path
            parts = path.split("/")
            if len(parts) < 3:
                logger.error(f"Invalid Vault path: {path}")
                return None

            mount_point = parts[0]
            secret_path = "/".join(parts[2:])  # Skip data in kv/data/path

            response = self.client.secrets.kv.v2.read_secret_version(
                path=secret_path,
                mount_point=mount_point,
            )
            return response.get("data", {}).get("data")
        except hvac.exceptions.InvalidPath:
            logger.debug(f"Secret not found at path: {path}")
            return None
        except Exception as e:
            logger.error(f"Failed to read secret from {path}: {e}")
            return None

    def write_secret(self, path: str, data: dict[str, Any]) -> bool:
        """Write a secret to Vault KV v2.
        
        Args:
            path: Full path for secret (e.g., "kv/data/connectors/org/proj/id")
            data: Secret data to store
        
        Returns:
            True if successful, False otherwise
        """
        if not self.is_configured:
            logger.warning("Vault not configured, cannot write secret")
            return False

        try:
            # Parse mount point and secret path
            parts = path.split("/")
            if len(parts) < 3:
                logger.error(f"Invalid Vault path: {path}")
                return False

            mount_point = parts[0]
            secret_path = "/".join(parts[2:])  # Skip data in kv/data/path

            self.client.secrets.kv.v2.create_or_update_secret(
                path=secret_path,
                secret=data,
                mount_point=mount_point,
            )
            logger.info(f"Secret written to {path}")
            return True
        except Exception as e:
            logger.error(f"Failed to write secret to {path}: {e}")
            return False

    def delete_secret(self, path: str) -> bool:
        """Delete a secret from Vault KV v2.
        
        Args:
            path: Full path to secret (e.g., "kv/data/connectors/org/proj/id")
        
        Returns:
            True if successful, False otherwise
        """
        if not self.is_configured:
            logger.warning("Vault not configured, cannot delete secret")
            return False

        try:
            # Parse mount point and secret path
            parts = path.split("/")
            if len(parts) < 3:
                logger.error(f"Invalid Vault path: {path}")
                return False

            mount_point = parts[0]
            secret_path = "/".join(parts[2:])  # Skip data in kv/data/path

            self.client.secrets.kv.v2.delete_metadata_and_all_versions(
                path=secret_path,
                mount_point=mount_point,
            )
            logger.info(f"Secret deleted from {path}")
            return True
        except hvac.exceptions.InvalidPath:
            logger.debug(f"Secret already deleted or not found: {path}")
            return True  # Idempotent
        except Exception as e:
            logger.error(f"Failed to delete secret from {path}: {e}")
            return False


# Global singleton instance
_vault_client: Optional[VaultClient] = None


def get_vault_client() -> VaultClient:
    """Get the global Vault client instance."""
    global _vault_client
    if _vault_client is None:
        _vault_client = VaultClient()
    return _vault_client
