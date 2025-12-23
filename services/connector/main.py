"""CMP Connector Gateway - Secure external API execution with Vault-backed secrets.

This service acts as a secure proxy for agent tool calls that require external API access.
It retrieves secrets from Vault based on connector bindings and executes authenticated
requests to external services (MCP servers, REST APIs, etc.).

Key responsibilities:
1. Receive tool call requests from Runner
2. Look up connector binding from Control Plane
3. Retrieve secrets from Vault
4. Execute authenticated external API calls
5. Return results to Runner
"""

import logging

import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import connector_router, health_router
from app.config import settings

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logging.basicConfig(
    format="%(message)s",
    level=getattr(logging, settings.log_level.upper()),
)

logger = structlog.get_logger()

# Create FastAPI app
app = FastAPI(
    title="CMP Connector Gateway",
    description="Secure external API execution with Vault-backed secrets",
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# CORS middleware - only allow internal services
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else [],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    logger.error("Unhandled exception", exc_info=exc, path=request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "internal_error",
                "message": "An internal error occurred",
            }
        },
    )


@app.on_event("startup")
async def startup():
    """Initialize service on startup."""
    logger.info(
        "Connector Gateway starting...",
        vault_addr=settings.vault_addr,
        control_plane_url=settings.control_plane_url,
        debug=settings.debug,
    )


@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown."""
    logger.info("Connector Gateway shutting down...")


# Include routers
app.include_router(health_router)
app.include_router(connector_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )
