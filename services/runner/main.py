"""Runner service - Langflow adapter for CMP Gateway."""

import logging

from fastapi import FastAPI

from app.api import run_router
from app.config import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="CMP Runner",
    description="Langflow adapter service for CMP Gateway",
    version="0.1.0",
)

# Include routers
app.include_router(run_router)


@app.on_event("startup")
async def startup():
    logger.info("Runner service starting...")
    logger.info(f"Langflow URL: {settings.langflow_url}")
    logger.info(f"Control Plane URL: {settings.control_plane_url}")


@app.on_event("shutdown")
async def shutdown():
    logger.info("Runner service shutting down...")
