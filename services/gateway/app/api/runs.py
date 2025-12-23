"""Runs API endpoint."""

import logging
import uuid
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth import User, jwt_auth
from app.billing.client import billing_client
from app.routing.runner import runner_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["runs"])


class MessageInput(BaseModel):
    """Message in conversation."""

    role: str  # system, user, assistant
    content: str


class RunInput(BaseModel):
    """Input for agent run."""

    query: Optional[str] = None
    messages: Optional[list[MessageInput]] = None


class RunRequest(BaseModel):
    """Request for POST /v1/runs."""

    instance_id: str
    input: RunInput
    metadata: Optional[dict[str, Any]] = None


class UsageInfo(BaseModel):
    """Usage information from run."""

    llm_tokens_in: int = 0
    llm_tokens_out: int = 0
    tool_calls: int = 0
    requests: int = 0


class BillingInfo(BaseModel):
    """Billing information from run."""

    debited: int
    balance: int


class RunOutput(BaseModel):
    """Output from agent run."""

    text: Optional[str] = None
    data: Optional[dict[str, Any]] = None


class RunResponse(BaseModel):
    """Response for POST /v1/runs."""

    run_id: str
    output: RunOutput
    usage: UsageInfo
    billing: BillingInfo


@router.post("/runs", response_model=RunResponse)
async def execute_run(
    request: RunRequest,
    user: User = Depends(jwt_auth),
):
    """
    Execute an agent run.

    Flow:
    1. Authorize billing (reserve credits)
    2. Route to Runner service
    3. Settle billing (debit actual usage)
    4. Return response with usage/billing info
    """
    run_id = str(uuid.uuid4())
    logger.info(f"Starting run {run_id} for instance {request.instance_id}")

    # 1. Authorize billing
    try:
        auth_result = await billing_client.authorize(
            instance_id=request.instance_id,
            requested_budget=10,  # Default budget
        )
    except Exception as e:
        logger.error(f"Billing authorization failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Billing service unavailable",
        )

    if not auth_result.allowed:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient credits",
        )

    # 2. Execute run via Runner
    try:
        run_result = await runner_client.execute(
            instance_id=request.instance_id,
            input_data=request.input.model_dump(),
            metadata=request.metadata,
        )
    except Exception as e:
        logger.error(f"Run execution failed: {e}")
        # Still settle with 0 usage on failure
        try:
            await billing_client.settle(
                reservation_id=auth_result.reservation_id,
                instance_id=request.instance_id,
                usage={},
            )
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Agent execution failed",
        )

    # 3. Settle billing
    try:
        settle_result = await billing_client.settle(
            reservation_id=auth_result.reservation_id,
            instance_id=request.instance_id,
            usage=run_result.usage,
        )
    except Exception as e:
        logger.error(f"Billing settlement failed: {e}")
        # Run succeeded but billing failed - log and continue
        settle_result = type(
            "SettleResult",
            (),
            {"debited": 0, "balance": auth_result.balance},
        )()

    logger.info(
        f"Completed run {run_id}: "
        f"usage={run_result.usage}, debited={settle_result.debited}"
    )

    # 4. Return response
    return RunResponse(
        run_id=run_id,
        output=RunOutput(
            text=run_result.output.get("text"),
            data=run_result.output.get("data"),
        ),
        usage=UsageInfo(
            llm_tokens_in=run_result.usage.get("llm_tokens_in", 0),
            llm_tokens_out=run_result.usage.get("llm_tokens_out", 0),
            tool_calls=run_result.usage.get("tool_calls", 0),
            requests=run_result.usage.get("requests", 0),
        ),
        billing=BillingInfo(
            debited=settle_result.debited,
            balance=settle_result.balance,
        ),
    )
