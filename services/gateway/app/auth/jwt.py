"""JWT authentication for Gateway API."""

import logging
from dataclasses import dataclass
from typing import Any, Optional

import httpx
import jwt
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class User:
    """User object created from JWT claims."""

    id: str  # Keycloak user ID (sub)
    username: str
    email: str
    name: str
    roles: list[str]
    claims: dict[str, Any]

    @classmethod
    def from_claims(cls, claims: dict[str, Any]) -> "User":
        """Create User from JWT claims."""
        realm_access = claims.get("realm_access", {})
        return cls(
            id=claims.get("sub", ""),
            username=claims.get("preferred_username", ""),
            email=claims.get("email", ""),
            name=claims.get("name", ""),
            roles=realm_access.get("roles", []),
            claims=claims,
        )


class JWKSClient:
    """Client for fetching JWKS from OIDC issuer."""

    _jwks_client: Optional[jwt.PyJWKClient] = None

    @classmethod
    async def get_signing_key(cls, token: str) -> jwt.PyJWK:
        """Get the signing key for a JWT token."""
        if cls._jwks_client is None:
            jwks_uri = f"{settings.oidc_issuer}/protocol/openid-connect/certs"
            cls._jwks_client = jwt.PyJWKClient(jwks_uri)

        try:
            return cls._jwks_client.get_signing_key_from_jwt(token)
        except jwt.exceptions.PyJWKClientError as e:
            logger.error(f"Failed to get signing key: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )


class JWTAuth(HTTPBearer):
    """JWT authentication dependency for FastAPI."""

    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(self, request: Request) -> Optional[User]:
        """Validate JWT and return User."""
        credentials: HTTPAuthorizationCredentials = await super().__call__(request)

        if credentials is None:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated",
                )
            return None

        token = credentials.credentials

        try:
            # Get signing key from JWKS
            signing_key = await JWKSClient.get_signing_key(token)

            # Decode and validate token
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=settings.oidc_audience,
                issuer=settings.oidc_issuer,
                options={
                    "verify_signature": True,
                    "verify_aud": True,
                    "verify_iss": True,
                    "verify_exp": True,
                },
            )

            return User.from_claims(claims)

        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
            )
        except jwt.InvalidAudienceError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token audience",
            )
        except jwt.InvalidIssuerError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token issuer",
            )
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )


# Dependency for protected routes
jwt_auth = JWTAuth()
