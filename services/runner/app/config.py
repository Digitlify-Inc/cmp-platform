"""Configuration for Runner service."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    # Service
    debug: bool = False
    log_level: str = "info"

    # Control Plane (for instance/offering lookups)
    control_plane_url: str = "http://cmp-control-plane.cmp:8000"

    # Langflow Runtime
    langflow_url: str = "http://runtime.runtime:80"
    langflow_api_key: str = ""

    # LLM API Keys (injected into flows at runtime)
    openai_api_key: str = ""

    # MinIO / S3 Storage (for artifact fetch)
    s3_endpoint: str = "http://minio.storage:9000"
    s3_access_key: str = ""
    s3_secret_key: str = ""
    s3_bucket: str = "artifacts"

    # Timeouts (seconds)
    langflow_timeout: int = 120
    control_plane_timeout: int = 10

    class Config:
        env_prefix = ""
        case_sensitive = False


settings = Settings()
