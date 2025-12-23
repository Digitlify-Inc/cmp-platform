"""Run API endpoint - Gateway calls this to execute agent runs."""

import logging
import uuid
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.config import settings
from app.langflow import langflow_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["run"])


class RunRequest(BaseModel):
    """Request from Gateway to execute a run."""

    instance_id: str
    input: dict[str, Any]
    metadata: Optional[dict[str, Any]] = None


class RunResponse(BaseModel):
    """Response to Gateway with run results."""

    run_id: str
    output: dict[str, Any]
    usage: dict[str, int]


@router.post("/run", response_model=RunResponse)
async def execute_run(request: RunRequest):
    """
    Execute an agent run.

    Called by Gateway after billing authorization.
    Flow:
    1. Look up instance -> offering -> flow_id mapping (from metadata or CP)
    2. Fetch flow artifact from storage (optional, if needed)
    3. Call Langflow Runtime with the flow
    4. Return response with usage metrics
    """
    run_id = str(uuid.uuid4())
    logger.info(f"Executing run {run_id} for instance {request.instance_id}")

    # Extract input
    input_data = request.input
    query = input_data.get("query", "")
    messages = input_data.get("messages", [])

    # If messages provided, use last user message as input
    if messages and not query:
        for msg in reversed(messages):
            if msg.get("role") == "user":
                query = msg.get("content", "")
                break

    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No query or user message provided",
        )

    # Get flow_id from metadata or derive from instance
    # In production, this would look up the instance -> offering -> flow mapping
    # For now, we expect flow_id in metadata or use instance_id as fallback
    metadata = request.metadata or {}
    flow_id = metadata.get("flow_id", request.instance_id)
    session_id = metadata.get("session_id")

    # Build tweaks to inject API keys at runtime
    # This keeps secrets out of the flow definitions
    tweaks = {}
    if settings.openai_api_key:
        # Inject OpenAI API key into any OpenAI component
        # The component ID pattern is OpenAIModelComponent-*
        tweaks["OpenAI"] = {"api_key": settings.openai_api_key}

    # Execute via Langflow
    try:
        result = await langflow_client.run_flow(
            flow_id=flow_id,
            input_value=query,
            session_id=session_id,
            tweaks=tweaks if tweaks else None,
        )
    except Exception as e:
        logger.error(f"Langflow execution failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Agent execution failed: {str(e)}",
        )

    # Build usage metrics (in production, parse from Langflow response)
    # Langflow doesn't provide token counts directly, so we estimate or get from callbacks
    usage = {
        "llm_tokens_in": 0,
        "llm_tokens_out": 0,
        "tool_calls": 0,
        "requests": 1,
    }

    logger.info(f"Run {run_id} completed successfully")

    return RunResponse(
        run_id=run_id,
        output=result.outputs,
        usage=usage,
    )


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    langflow_healthy = await langflow_client.health_check()
    return {
        "status": "healthy",
        "langflow": "healthy" if langflow_healthy else "degraded",
    }
