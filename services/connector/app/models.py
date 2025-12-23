"""Shared models for the Connector Gateway."""
from typing import Any
from pydantic import BaseModel, Field


class ToolCallRequest(BaseModel):
    """Request to execute a tool call via a connector."""
    
    # Caller context
    instance_id: str = Field(..., description="Agent instance ID")
    org_id: str = Field(..., description="Organization ID")
    project_id: str = Field(..., description="Project ID")
    
    # Connector binding
    binding_id: str = Field(..., description="Connector binding ID")
    
    # Tool call details
    tool_name: str = Field(..., description="Name of the tool to execute")
    tool_input: dict[str, Any] = Field(default_factory=dict, description="Tool input parameters")
    
    # Optional request context
    request_id: str | None = Field(None, description="Request ID for tracing")
    timeout: int | None = Field(None, description="Custom timeout in seconds")


class ToolCallResponse(BaseModel):
    """Response from a tool call execution."""
    
    success: bool
    result: Any | None = None
    error: str | None = None
    execution_time_ms: int = 0


class ConnectorBindingInfo(BaseModel):
    """Connector binding information from Control Plane."""
    
    id: str
    connector_type: str  # e.g., "http", "mcp", "oauth2"
    config: dict[str, Any]
    vault_path: str
    enabled: bool
