"""Configuration for Provisioner service."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    # Service
    debug: bool = False
    log_level: str = "info"

    # Control Plane
    control_plane_url: str = "http://cmp-control-plane.cmp:8000"
    control_plane_timeout: int = 30

    # Saleor
    saleor_api_url: str = "http://cmp-commerce-api:8000/graphql/"
    saleor_webhook_secret: str = ""

    class Config:
        env_prefix = ""
        case_sensitive = False


settings = Settings()
