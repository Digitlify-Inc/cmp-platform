"""JWT Authentication for Control Plane API."""

import logging
from typing import Any

import httpx
import jwt
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from rest_framework import authentication, exceptions

logger = logging.getLogger(__name__)


class OIDCUser:
    """User object created from OIDC JWT claims."""

    def __init__(self, claims: dict[str, Any]):
        self.claims = claims
        self.is_authenticated = True
        self.is_active = True
        self.is_anonymous = False

    @property
    def id(self) -> str:
        """Keycloak user ID (sub claim)."""
        return self.claims.get("sub", "")

    @property
    def username(self) -> str:
        """Preferred username from Keycloak."""
        return self.claims.get("preferred_username", "")

    @property
    def email(self) -> str:
        """Email from Keycloak."""
        return self.claims.get("email", "")

    @property
    def name(self) -> str:
        """Full name from Keycloak."""
        return self.claims.get("name", "")

    @property
    def roles(self) -> list[str]:
        """Realm roles from Keycloak."""
        realm_access = self.claims.get("realm_access", {})
        return realm_access.get("roles", [])

    def has_role(self, role: str) -> bool:
        """Check if user has a specific role."""
        return role in self.roles

    def __str__(self) -> str:
        return f"OIDCUser({self.username})"


class JWKSClient:
    """Client for fetching JWKS from OIDC issuer."""

    _cache: dict[str, Any] = {}

    @classmethod
    def get_signing_key(cls, token: str) -> jwt.PyJWK:
        """Get the signing key for a JWT token."""
        issuer = settings.OIDC_ISSUER
        jwks_uri = f"{issuer}/protocol/openid-connect/certs"

        # Cache JWKS
        if jwks_uri not in cls._cache:
            try:
                response = httpx.get(jwks_uri, timeout=10.0)
                response.raise_for_status()
                cls._cache[jwks_uri] = jwt.PyJWKClient(jwks_uri)
            except httpx.HTTPError as e:
                logger.error(f"Failed to fetch JWKS: {e}")
                raise exceptions.AuthenticationFailed("Failed to validate token")

        jwks_client = cls._cache[jwks_uri]
        try:
            return jwks_client.get_signing_key_from_jwt(token)
        except jwt.exceptions.PyJWKClientError as e:
            logger.error(f"Failed to get signing key: {e}")
            raise exceptions.AuthenticationFailed("Invalid token")


class JWTAuthentication(authentication.BaseAuthentication):
    """JWT authentication using Keycloak OIDC."""

    def authenticate(self, request):
        """Authenticate request using Bearer token."""
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")

        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None

        token = parts[1]

        try:
            # Get signing key from JWKS
            signing_key = JWKSClient.get_signing_key(token)

            # Build list of accepted audiences
            # Primary audience is OIDC_AUDIENCE, but also accept marketplace tokens
            audiences = [settings.OIDC_AUDIENCE]
            if hasattr(settings, "OIDC_ADDITIONAL_AUDIENCES") and settings.OIDC_ADDITIONAL_AUDIENCES:
                audiences.extend(settings.OIDC_ADDITIONAL_AUDIENCES.split(","))
            # Always accept marketplace and account tokens for cross-service calls
            for aud in ["marketplace", "account"]:
                if aud not in audiences:
                    audiences.append(aud)

            # Decode and validate token
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=audiences,
                issuer=settings.OIDC_ISSUER,
                options={
                    "verify_signature": True,
                    "verify_aud": True,
                    "verify_iss": True,
                    "verify_exp": True,
                },
            )

            user = OIDCUser(claims)
            return (user, token)

        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Token has expired")
        except jwt.InvalidAudienceError:
            raise exceptions.AuthenticationFailed("Invalid token audience")
        except jwt.InvalidIssuerError:
            raise exceptions.AuthenticationFailed("Invalid token issuer")
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            raise exceptions.AuthenticationFailed("Invalid token")

    def authenticate_header(self, request):
        """Return WWW-Authenticate header value."""
        return 'Bearer realm="cmp-control-plane"'
