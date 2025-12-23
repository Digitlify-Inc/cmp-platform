"""
Django settings for CMP Control Plane.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/topics/settings/
"""

import os
from pathlib import Path

import dj_database_url
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    debug: bool = False
    secret_key: str = "change-me-in-production"
    allowed_hosts: str = "localhost,127.0.0.1"

    # Database
    database_url: str = "postgres://postgres:postgres@localhost:5432/control_plane"

    # OIDC/SSO
    oidc_issuer: str = "https://sso.dev.gsv.dev/realms/gsv"
    oidc_client_id: str = "cmp-control-plane"
    oidc_client_secret: str = ""
    oidc_audience: str = "cmp-control-plane"

    # MinIO/S3
    s3_endpoint: str = "http://minio.storage:9000"
    s3_access_key: str = ""
    s3_secret_key: str = ""
    s3_bucket: str = "cmp-artifacts"

    # Vault
    vault_addr: str = "http://vault.vault:8200"
    vault_token: str = ""

    # Trial credits for new users
    trial_credits: int = 100

    class Config:
        env_prefix = ""
        case_sensitive = False


# Load settings from environment
settings = Settings()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = settings.secret_key

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = settings.debug

ALLOWED_HOSTS = [h.strip() for h in settings.allowed_hosts.split(",") if h.strip()]

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "corsheaders",
    "django_filters",
    "health_check",
    "health_check.db",
    "drf_spectacular",
    # Local apps
    "control_plane.apps.orgs",
    "control_plane.apps.offerings",
    "control_plane.apps.instances",
    "control_plane.apps.billing",
    "control_plane.apps.connectors",
    "control_plane.apps.integrations",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "control_plane.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "control_plane.wsgi.application"

# Database
DATABASES = {
    "default": dj_database_url.parse(
        settings.database_url,
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "control_plane.auth.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.LimitOffsetPagination",
    "PAGE_SIZE": 50,
    "EXCEPTION_HANDLER": "control_plane.exceptions.custom_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# CORS
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [
    "https://store.dev.gsv.dev",
    "https://api.dev.gsv.dev",
]

# Logging - use simple format for now, structlog can be added later
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "control_plane": {
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
    },
}

# OIDC Settings (for JWT validation)
OIDC_ISSUER = settings.oidc_issuer
OIDC_AUDIENCE = settings.oidc_audience
OIDC_CLIENT_ID = settings.oidc_client_id

# MinIO/S3 Settings
S3_ENDPOINT = settings.s3_endpoint
S3_ACCESS_KEY = settings.s3_access_key
S3_SECRET_KEY = settings.s3_secret_key
S3_BUCKET = settings.s3_bucket

# Vault Settings
VAULT_ADDR = settings.vault_addr
VAULT_TOKEN = settings.vault_token

# Trial Credits
TRIAL_CREDITS = settings.trial_credits

# OpenAPI/Swagger Documentation (drf-spectacular)
SPECTACULAR_SETTINGS = {
    "TITLE": "GSV Control Plane API",
    "DESCRIPTION": """
The GSV Control Plane API manages AI agent offerings, instances, billing, and integrations
for the Digitlify Cloud Marketplace platform.

## Authentication
All endpoints (except `/health/` and `/offerings/`) require JWT authentication.
Include the Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Core Resources
- **Offerings** - AI agent product catalog
- **Instances** - Provisioned agent instances for buyers
- **Organizations** - Tenant/workspace management
- **Billing** - Credits, wallets, and usage tracking
- **Connectors** - Third-party integration bindings
    """,
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": r"/api/v[0-9]",
    "TAGS": [
        {"name": "offerings", "description": "AI Agent Offerings (public catalog)"},
        {"name": "instances", "description": "Provisioned agent instances"},
        {"name": "organizations", "description": "Tenant and workspace management"},
        {"name": "billing", "description": "Credits, wallets, and usage"},
        {"name": "connectors", "description": "Third-party integrations"},
        {"name": "integrations", "description": "Webhook handlers"},
    ],
}
