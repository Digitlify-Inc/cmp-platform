"""API Key authentication for Gateway API."""

import logging
from dataclasses import dataclass
from typing import Any, Optional

import httpx
from fastapi import HTTPException, Request, status
from fastapi.security import APIKeyHeader

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class APIKeyContext:
    """Context object created from API key introspection."""

    key_id: str
    instance_id: str
    tenant_id: str
    org_id: str
    name: str
    scopes: list[str]
    entitlements: dict[str, Any]

    @classmethod
    def from_introspection(cls, data: dict[str, Any]) -> "APIKeyContext":
        """Create APIKeyContext from introspection response."""
        return cls(
            key_id=data.get("id", ""),
            instance_id=data.get("instance_id", ""),
            tenant_id=data.get("tenant_id", ""),
            org_id=data.get("org_id", ""),
            name=data.get("name", ""),
            scopes=data.get("scopes", ["run"]),
            entitlements=data.get("entitlements", {}),
        )


class APIKeyAuth(APIKeyHeader):
    """API Key authentication dependency for FastAPI.

    Validates API keys against the Control Plane introspection endpoint.
    API keys should be passed in the X-API-Key header.
    """

    def __init__(self, auto_error: bool = True):
        super().__init__(name="X-API-Key", auto_error=auto_error)
        self._http_client: Optional[httpx.AsyncClient] = None

    @property
    def http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client for CP requests."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(
                base_url=settings.control_plane_url,
                timeout=10.0,
            )
        return self._http_client

    async def introspect_key(self, api_key: str) -> dict[str, Any]:
        """Introspect an API key against the Control Plane.

        Args:
            api_key: The API key to introspect (e.g., cmp_sk_xxx)

        Returns:
            Introspection response with key metadata and entitlements

        Raises:
            HTTPException: If key is invalid or introspection fails
        """
        try:
            response = await self.http_client.post(
                "/api/v1/api_keys/introspect/",
                json={"key": api_key},
                headers={"Content-Type": "application/json"},
            )

            if response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid API key",
                )

            if response.status_code == 403:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="API key is revoked or expired",
                )

            if response.status_code != 200:
                logger.error(f"API key introspection failed: {response.status_code}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to validate API key",
                )

            return response.json()

        except httpx.RequestError as e:
            logger.error(f"Failed to connect to Control Plane: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service unavailable",
            )

    async def __call__(self, request: Request) -> Optional[APIKeyContext]:
        """Validate API key and return context."""
        api_key: str = await super().__call__(request)

        if api_key is None:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="API key required",
                )
            return None

        # Validate key format (cmp_sk_ prefix)
        if not api_key.startswith("cmp_sk_"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key format",
            )

        # Introspect key against Control Plane
        introspection = await self.introspect_key(api_key)

        return APIKeyContext.from_introspection(introspection)


# Dependency for API key protected routes
api_key_auth = APIKeyAuth()
api_key_auth_optional = APIKeyAuth(auto_error=False)
