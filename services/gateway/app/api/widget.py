"""Widget API endpoint."""

import logging
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth import User, jwt_auth

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/widget", tags=["widget"])


class WidgetSessionInitRequest(BaseModel):
    """Request for widget session initialization."""

    instance_id: str
    origin: str


class WidgetConfig(BaseModel):
    """Widget configuration."""

    brand_name: Optional[str] = None
    logo_url: Optional[str] = None
    avatar_url: Optional[str] = None
    primary_color: Optional[str] = "#6366f1"
    accent_color: Optional[str] = "#8b5cf6"
    font_family: Optional[str] = "Inter"
    launcher_text: Optional[str] = "Chat with us"
    position: Optional[str] = "bottom-right"


class WidgetSessionInitResponse(BaseModel):
    """Response for widget session initialization."""

    widget_token: str
    expires_in_sec: int
    config: WidgetConfig


@router.post("/session:init", response_model=WidgetSessionInitResponse)
async def init_widget_session(
    request: WidgetSessionInitRequest,
    user: User = Depends(jwt_auth),
):
    """
    Initialize a widget session.

    Creates a short-lived token for widget embedding.
    Validates origin against allowlist.
    Returns branding configuration.
    """
    # TODO: Validate origin against instance allowlist
    # TODO: Fetch branding config from instance

    # Generate widget token (short-lived)
    widget_token = secrets.token_urlsafe(32)

    logger.info(
        f"Initialized widget session for instance {request.instance_id} "
        f"from origin {request.origin}"
    )

    return WidgetSessionInitResponse(
        widget_token=widget_token,
        expires_in_sec=3600,  # 1 hour
        config=WidgetConfig(),
    )
