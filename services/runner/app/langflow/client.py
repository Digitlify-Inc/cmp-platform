"""Langflow Runtime client."""

import logging
from dataclasses import dataclass
from typing import Any, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class LangflowRunResult:
    """Result from Langflow flow execution."""

    run_id: str
    outputs: dict[str, Any]
    session_id: Optional[str] = None


class LangflowClient:
    """Client for Langflow Runtime API.

    Based on Langflow API docs:
    - POST /api/v1/run/{flow_id} - Run a flow
    - Supports streaming with ?stream=true
    - Tweaks for runtime parameter overrides
    """

    def __init__(self):
        self.base_url = settings.langflow_url.rstrip("/")
        self.api_key = settings.langflow_api_key
        self.timeout = settings.langflow_timeout

    def _headers(self) -> dict[str, str]:
        """Build request headers."""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["x-api-key"] = self.api_key
        return headers

    async def run_flow(
        self,
        flow_id: str,
        input_value: str,
        input_type: str = "chat",
        output_type: str = "chat",
        tweaks: Optional[dict[str, Any]] = None,
        session_id: Optional[str] = None,
        stream: bool = False,
    ) -> LangflowRunResult:
        """
        Execute a Langflow flow.

        Args:
            flow_id: The flow UUID or endpoint name
            input_value: The input text/query
            input_type: Type of input (chat, text, etc.)
            output_type: Type of output (chat, text, etc.)
            tweaks: Runtime parameter overrides
            session_id: Session ID for conversation continuity
            stream: Whether to stream LLM responses

        Returns:
            LangflowRunResult with outputs and metadata
        """
        url = f"{self.base_url}/api/v1/run/{flow_id}"
        if stream:
            url += "?stream=true"

        payload: dict[str, Any] = {
            "input_value": input_value,
            "input_type": input_type,
            "output_type": output_type,
        }

        if tweaks:
            payload["tweaks"] = tweaks
        if session_id:
            payload["session_id"] = session_id

        logger.info(f"Calling Langflow flow {flow_id}")
        logger.debug(f"Payload: {payload}")

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                url,
                json=payload,
                headers=self._headers(),
            )
            response.raise_for_status()
            data = response.json()

        # Parse Langflow response
        # Response format: {"outputs": [{"outputs": [{"results": {...}}]}]}
        outputs = {}
        result_session_id = None

        if "outputs" in data and data["outputs"]:
            first_output = data["outputs"][0]
            if "outputs" in first_output and first_output["outputs"]:
                for output in first_output["outputs"]:
                    if "results" in output:
                        results = output["results"]
                        # Extract message content
                        if "message" in results:
                            msg = results["message"]
                            if isinstance(msg, dict):
                                outputs["text"] = msg.get("text", "")
                                result_session_id = msg.get("session_id")
                            else:
                                outputs["text"] = str(msg)
                        outputs["data"] = results

        # Generate run ID from response or create one
        run_id = data.get("run_id", "")
        if not run_id and "outputs" in data and data["outputs"]:
            # Try to get from session
            run_id = result_session_id or ""

        logger.info(f"Langflow flow {flow_id} completed, run_id={run_id}")

        return LangflowRunResult(
            run_id=run_id,
            outputs=outputs,
            session_id=result_session_id,
        )

    async def health_check(self) -> bool:
        """Check if Langflow is healthy."""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.base_url}/health")
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"Langflow health check failed: {e}")
            return False


# Singleton client
langflow_client = LangflowClient()
