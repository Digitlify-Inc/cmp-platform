"""Configuration for Gateway service."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    # Service
    debug: bool = False
    log_level: str = "info"

    # Control Plane
    control_plane_url: str = "http://cmp-control-plane.cmp:8000"

    # Runner
    runner_url: str = "http://cmp-runner.cmp:8000"

    # OIDC/SSO (Keycloak)
    oidc_issuer: str = "https://sso.dev.gsv.dev/realms/gsv"
    oidc_audience: str = "cmp-gateway"

    # Timeouts (seconds)
    run_timeout: int = 120
    control_plane_timeout: int = 10

    class Config:
        env_prefix = ""
        case_sensitive = False


settings = Settings()
