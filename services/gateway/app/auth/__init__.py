"""Authentication module."""

from .api_key import APIKeyAuth, APIKeyContext, api_key_auth, api_key_auth_optional
from .combined import AuthContext, CombinedAuth, combined_auth, combined_auth_optional
from .jwt import JWTAuth, User, jwt_auth

__all__ = [
    # JWT auth
    "JWTAuth",
    "User",
    "jwt_auth",
    # API key auth
    "APIKeyAuth",
    "APIKeyContext",
    "api_key_auth",
    "api_key_auth_optional",
    # Combined auth (supports both)
    "AuthContext",
    "CombinedAuth",
    "combined_auth",
    "combined_auth_optional",
]
