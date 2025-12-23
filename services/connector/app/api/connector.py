"""Connector execution API endpoints."""

from typing import Any

import httpx
import structlog
from fastapi import APIRouter, HTTPException, status

from app.config import settings
from app.connectors.executor import ConnectorExecutor
from app.models import ToolCallRequest, ToolCallResponse, ConnectorBindingInfo
from app.vault.client import vault_client

logger = structlog.get_logger()

router = APIRouter(prefix="/connectors", tags=["connectors"])


@router.post("/execute", response_model=ToolCallResponse)
async def execute_tool_call(request: ToolCallRequest):
    """Execute a tool call through a connector binding.

    Flow:
    1. Validate request and check entitlements via Control Plane
    2. Fetch connector binding configuration from Control Plane
    3. Retrieve secrets from Vault using binding vault_path
    4. Execute the tool call with the connector
    5. Return results
    """
    log = logger.bind(
        instance_id=request.instance_id,
        binding_id=request.binding_id,
        tool_name=request.tool_name,
        request_id=request.request_id,
    )

    log.info("Executing tool call")

    try:
        # Step 1: Get connector binding from Control Plane
        binding = await _get_connector_binding(
            request.org_id,
            request.project_id,
            request.binding_id,
            log,
        )

        if not binding.enabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Connector binding is disabled",
            )

        # Step 2: Get secrets from Vault
        secrets = await vault_client.get_secrets(binding.vault_path)
        if secrets is None:
            log.error("Failed to retrieve secrets from Vault", vault_path=binding.vault_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve connector secrets",
            )

        # Step 3: Execute the tool call
        executor = ConnectorExecutor(
            connector_type=binding.connector_type,
            config=binding.config,
            secrets=secrets,
            timeout=request.timeout or settings.external_request_timeout,
        )

        result = await executor.execute(
            tool_name=request.tool_name,
            tool_input=request.tool_input,
        )

        log.info("Tool call executed successfully", execution_time_ms=result.execution_time_ms)

        return result

    except HTTPException:
        raise
    except Exception as e:
        log.error("Tool call execution failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tool call execution failed: {str(e)}",
        )


@router.get("/bindings/{binding_id}/validate")
async def validate_binding(
    binding_id: str,
    org_id: str,
    project_id: str,
):
    """Validate that a connector binding is properly configured.

    Checks:
    1. Binding exists in Control Plane
    2. Secrets exist in Vault
    3. Connector is reachable (optional connectivity test)
    """
    log = logger.bind(binding_id=binding_id, org_id=org_id, project_id=project_id)
    log.info("Validating connector binding")

    try:
        # Get binding from Control Plane
        binding = await _get_connector_binding(org_id, project_id, binding_id, log)

        # Check Vault secrets
        secrets = await vault_client.get_secrets(binding.vault_path)
        secrets_valid = secrets is not None

        return {
            "binding_id": binding_id,
            "valid": binding.enabled and secrets_valid,
            "enabled": binding.enabled,
            "secrets_configured": secrets_valid,
            "connector_type": binding.connector_type,
        }

    except HTTPException:
        raise
    except Exception as e:
        log.error("Binding validation failed", error=str(e))
        return {
            "binding_id": binding_id,
            "valid": False,
            "error": str(e),
        }


async def _get_connector_binding(
    org_id: str,
    project_id: str,
    binding_id: str,
    log: Any,
) -> ConnectorBindingInfo:
    """Fetch connector binding from Control Plane."""
    url = f"{settings.control_plane_url}/api/v1/connectors/bindings/{binding_id}"

    try:
        async with httpx.AsyncClient(timeout=settings.control_plane_timeout) as client:
            response = await client.get(
                url,
                params={"org_id": org_id, "project_id": project_id},
                headers={"X-Service-Auth": settings.service_jwt_secret},
            )

            if response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Connector binding not found: {binding_id}",
                )

            response.raise_for_status()
            data = response.json()

            return ConnectorBindingInfo(
                id=data["id"],
                connector_type=data["connector_type"],
                config=data.get("config", {}),
                vault_path=data["vault_path"],
                enabled=data.get("enabled", True),
            )

    except httpx.HTTPError as e:
        log.error("Failed to fetch connector binding", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to communicate with Control Plane",
        )
