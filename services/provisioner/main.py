"""Provisioner service - Saleor webhook handler for CMP."""

import logging

from fastapi import FastAPI

from app.config import settings
from app.webhooks import saleor_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="CMP Provisioner",
    description="Saleor webhook handler for provisioning CMP instances",
    version="0.1.0",
)

# Include routers
app.include_router(saleor_router)


@app.get("/health")
async def health_check():
    """Service health check."""
    return {"status": "healthy", "service": "provisioner"}


@app.on_event("startup")
async def startup():
    logger.info("Provisioner service starting...")
    logger.info(f"Control Plane URL: {settings.control_plane_url}")


@app.on_event("shutdown")
async def shutdown():
    logger.info("Provisioner service shutting down...")
