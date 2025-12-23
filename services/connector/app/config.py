"""Configuration for CMP Connector Gateway."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Debug mode
    debug: bool = False
    log_level: str = "info"

    # Vault configuration
    vault_addr: str = "http://vault.vault.svc.cluster.local:8200"
    vault_auth_method: str = "kubernetes"
    vault_role: str = "cmp-connector"
    vault_mount_path: str = "auth/kubernetes"
    vault_secrets_path: str = "kv/data/connectors"

    # Control Plane configuration
    control_plane_url: str = "http://cmp-control-plane.cmp.svc.cluster.local:8000"
    control_plane_timeout: int = 10

    # Service authentication
    service_jwt_secret: str = ""

    # Request timeouts
    external_request_timeout: int = 30
    max_retries: int = 3
    retry_backoff_seconds: float = 1.0

    # Rate limiting
    rate_limit_enabled: bool = True
    rate_limit_requests_per_minute: int = 100

    class Config:
        env_prefix = ""
        case_sensitive = False


settings = Settings()
