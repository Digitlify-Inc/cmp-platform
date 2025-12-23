"""Usage event emission for billing integration."""

import json
import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

import httpx

from app.config import settings

from .models import RunMetrics

logger = logging.getLogger(__name__)


@dataclass
class UsageEvent:
    """Usage event to be emitted for billing/metering.

    This event contains all information needed for:
    - Credit deduction (based on token usage and model)
    - Usage analytics (tokens, duration, tool calls)
    - Billing reports (per tenant/org/instance)
    """

    # Identifiers
    event_id: str
    run_id: str
    tenant_id: str
    org_id: str
    instance_id: str

    # Model and usage
    model: str
    tokens_in: int
    tokens_out: int
    total_tokens: int

    # Execution metrics
    duration_ms: int
    tool_calls: int
    status: str  # success, error

    # Timestamps
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    # Computed billing (credits)
    credits: float = 0.0

    # Optional error info
    error_message: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        return asdict(self)

    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict())


class UsageEventEmitter:
    """Emits usage events for billing and analytics.

    Supports multiple backends:
    - Control Plane HTTP endpoint (default)
    - Kafka (for high-throughput)
    - OpenMeter (for advanced metering)
    """

    # Credit rates per 1K tokens (can be overridden per model)
    CREDIT_RATES = {
        "default": {"input": 0.01, "output": 0.03},
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-4-turbo": {"input": 0.01, "output": 0.03},
        "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
        "claude-3-opus": {"input": 0.015, "output": 0.075},
        "claude-3-sonnet": {"input": 0.003, "output": 0.015},
        "claude-3-haiku": {"input": 0.00025, "output": 0.00125},
    }

    def __init__(self):
        self._http_client: Optional[httpx.AsyncClient] = None

    @property
    def http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(
                base_url=settings.control_plane_url,
                timeout=5.0,
            )
        return self._http_client

    def calculate_credits(self, model: str, tokens_in: int, tokens_out: int) -> float:
        """Calculate credits based on model and token usage."""
        rates = self.CREDIT_RATES.get(model, self.CREDIT_RATES["default"])
        credits = (tokens_in / 1000 * rates["input"]) + (tokens_out / 1000 * rates["output"])
        return round(credits, 6)

    def create_event(
        self,
        run_metrics: RunMetrics,
        tenant_id: str,
        org_id: str,
        instance_id: str,
    ) -> UsageEvent:
        """Create a UsageEvent from RunMetrics."""
        credits = self.calculate_credits(
            run_metrics.model,
            run_metrics.token_usage.prompt_tokens,
            run_metrics.token_usage.completion_tokens,
        )

        return UsageEvent(
            event_id=str(UUID(int=hash(str(run_metrics.run_id) + datetime.utcnow().isoformat()) % (2**128))),
            run_id=str(run_metrics.run_id),
            tenant_id=tenant_id,
            org_id=org_id,
            instance_id=instance_id,
            model=run_metrics.model,
            tokens_in=run_metrics.token_usage.prompt_tokens,
            tokens_out=run_metrics.token_usage.completion_tokens,
            total_tokens=run_metrics.token_usage.total_tokens,
            duration_ms=run_metrics.duration_ms,
            tool_calls=run_metrics.tool_calls,
            status=run_metrics.status,
            credits=credits,
            error_message=run_metrics.error_message,
        )

    async def emit(self, event: UsageEvent) -> bool:
        """Emit a usage event to the Control Plane.

        Returns True if successful, False otherwise.
        Failures are logged but don't raise exceptions (fire-and-forget).
        """
        try:
            response = await self.http_client.post(
                "/api/v1/usage/events/",
                json=event.to_dict(),
                headers={"Content-Type": "application/json"},
            )

            if response.status_code not in (200, 201, 202):
                logger.warning(
                    f"Failed to emit usage event: {response.status_code} - {response.text}"
                )
                return False

            logger.debug(f"Usage event emitted: {event.event_id}")
            return True

        except httpx.RequestError as e:
            logger.error(f"Failed to emit usage event: {e}")
            return False

    async def emit_from_metrics(
        self,
        run_metrics: RunMetrics,
        tenant_id: str,
        org_id: str,
        instance_id: str,
    ) -> bool:
        """Create and emit a usage event from run metrics."""
        event = self.create_event(run_metrics, tenant_id, org_id, instance_id)
        return await self.emit(event)


# Singleton emitter instance
usage_emitter = UsageEventEmitter()
