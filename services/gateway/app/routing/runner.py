"""Runner client for executing agent runs."""

import logging
from dataclasses import dataclass
from typing import Any, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class RunResult:
    """Result of agent run execution."""

    run_id: str
    output: dict[str, Any]
    usage: dict[str, int]


class RunnerClient:
    """Client for Runner service."""

    def __init__(self):
        self.base_url = settings.runner_url
        self.timeout = settings.run_timeout

    async def execute(
        self,
        instance_id: str,
        input_data: dict[str, Any],
        metadata: Optional[dict] = None,
    ) -> RunResult:
        """
        Execute an agent run.

        Forwards request to Runner service which:
        1. Fetches artifact from MinIO
        2. Calls Studio (Langflow) runtime
        3. Returns response with usage metrics
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/run",
                    json={
                        "instance_id": instance_id,
                        "input": input_data,
                        "metadata": metadata or {},
                    },
                    timeout=self.timeout,
                )
                response.raise_for_status()
                data = response.json()

                return RunResult(
                    run_id=data.get("run_id", ""),
                    output=data.get("output", {}),
                    usage=data.get("usage", {}),
                )

            except httpx.HTTPStatusError as e:
                logger.error(f"Runner execute failed: {e}")
                raise
            except httpx.RequestError as e:
                logger.error(f"Runner execute request error: {e}")
                raise


# Singleton client
runner_client = RunnerClient()
