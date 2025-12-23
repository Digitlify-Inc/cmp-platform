"""Health check endpoints for Connector Gateway."""

from fastapi import APIRouter

from app.vault.client import vault_client

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Liveness probe - service is running."""
    return {"status": "healthy"}


@router.get("/ready")
async def readiness_check():
    """Readiness probe - service can handle requests."""
    # Check Vault connectivity
    vault_status = await vault_client.check_health()

    if not vault_status:
        return {"status": "not_ready", "reason": "vault_unavailable"}

    return {"status": "ready"}
