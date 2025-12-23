"""Combined authentication supporting both JWT and API Key."""

import logging
from dataclasses import dataclass
from typing import Optional, Union

from fastapi import Depends, HTTPException, Request, status

from .api_key import APIKeyAuth, APIKeyContext
from .jwt import JWTAuth, User

logger = logging.getLogger(__name__)


@dataclass
class AuthContext:
    """Unified authentication context for both JWT and API key auth.

    This allows routes to accept either authentication method and get
    a consistent interface for accessing tenant/instance information.
    """

    auth_type: str  # "jwt" or "api_key"
    user_id: Optional[str] = None  # Keycloak user ID (for JWT)
    instance_id: Optional[str] = None  # Instance ID (for API key)
    tenant_id: Optional[str] = None
    org_id: Optional[str] = None
    scopes: list[str] = None
    entitlements: dict = None

    def __post_init__(self):
        if self.scopes is None:
            self.scopes = []
        if self.entitlements is None:
            self.entitlements = {}

    @classmethod
    def from_user(cls, user: User) -> "AuthContext":
        """Create AuthContext from JWT User."""
        # Extract tenant/org from token claims if available
        tenant_id = user.claims.get("tenant_id") or user.claims.get("azp")
        org_id = user.claims.get("org_id")

        return cls(
            auth_type="jwt",
            user_id=user.id,
            tenant_id=tenant_id,
            org_id=org_id,
            scopes=user.roles,
            entitlements={},
        )

    @classmethod
    def from_api_key(cls, api_key_ctx: APIKeyContext) -> "AuthContext":
        """Create AuthContext from API Key context."""
        return cls(
            auth_type="api_key",
            instance_id=api_key_ctx.instance_id,
            tenant_id=api_key_ctx.tenant_id,
            org_id=api_key_ctx.org_id,
            scopes=api_key_ctx.scopes,
            entitlements=api_key_ctx.entitlements,
        )


class CombinedAuth:
    """Combined authentication that accepts either JWT or API key.

    Usage:
        @app.post("/v1/runs")
        async def create_run(auth: AuthContext = Depends(combined_auth)):
            # Works with both JWT and API key
            pass

    Priority:
        1. X-API-Key header (for widget/API usage)
        2. Authorization: Bearer <JWT> (for console UI)
    """

    def __init__(self, auto_error: bool = True):
        self.auto_error = auto_error
        self._jwt_auth = JWTAuth(auto_error=False)
        self._api_key_auth = APIKeyAuth(auto_error=False)

    async def __call__(self, request: Request) -> Optional[AuthContext]:
        """Authenticate request using either API key or JWT."""

        # Try API key first (for widget/API usage)
        api_key = request.headers.get("X-API-Key")
        if api_key:
            try:
                api_key_ctx = await self._api_key_auth(request)
                if api_key_ctx:
                    return AuthContext.from_api_key(api_key_ctx)
            except HTTPException:
                # API key was provided but invalid
                raise

        # Try JWT token
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                user = await self._jwt_auth(request)
                if user:
                    return AuthContext.from_user(user)
            except HTTPException:
                # JWT was provided but invalid
                raise

        # No valid authentication
        if self.auto_error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required. Provide X-API-Key or Authorization: Bearer <token>",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return None


# Dependencies for routes
combined_auth = CombinedAuth()
combined_auth_optional = CombinedAuth(auto_error=False)
