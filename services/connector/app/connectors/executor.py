"""Connector executor - handles different connector types."""

import time
from typing import Any

import httpx
import structlog

from app.models import ToolCallResponse

logger = structlog.get_logger()


class ConnectorExecutor:
    """Executes tool calls through different connector types.

    Supported connector types:
    - http: Generic HTTP/REST API calls
    - mcp: Model Context Protocol servers
    - oauth2: OAuth2-authenticated APIs
    """

    def __init__(
        self,
        connector_type: str,
        config: dict[str, Any],
        secrets: dict[str, Any],
        timeout: int = 30,
    ):
        self.connector_type = connector_type
        self.config = config
        self.secrets = secrets
        self.timeout = timeout

    async def execute(
        self,
        tool_name: str,
        tool_input: dict[str, Any],
    ) -> ToolCallResponse:
        """Execute a tool call based on connector type."""
        start_time = time.time()

        try:
            if self.connector_type == "http":
                result = await self._execute_http(tool_name, tool_input)
            elif self.connector_type == "mcp":
                result = await self._execute_mcp(tool_name, tool_input)
            elif self.connector_type == "oauth2":
                result = await self._execute_oauth2(tool_name, tool_input)
            else:
                return ToolCallResponse(
                    success=False,
                    error=f"Unsupported connector type: {self.connector_type}",
                    execution_time_ms=int((time.time() - start_time) * 1000),
                )

            execution_time_ms = int((time.time() - start_time) * 1000)
            return ToolCallResponse(
                success=True,
                result=result,
                execution_time_ms=execution_time_ms,
            )

        except Exception as e:
            execution_time_ms = int((time.time() - start_time) * 1000)
            logger.error(
                "Connector execution failed",
                connector_type=self.connector_type,
                tool_name=tool_name,
                error=str(e),
            )
            return ToolCallResponse(
                success=False,
                error=str(e),
                execution_time_ms=execution_time_ms,
            )

    async def _execute_http(
        self,
        tool_name: str,
        tool_input: dict[str, Any],
    ) -> Any:
        """Execute an HTTP API call.

        Config format:
        {
            "base_url": "https://api.example.com",
            "tools": {
                "tool_name": {
                    "method": "POST",
                    "path": "/endpoint",
                    "headers": {"Content-Type": "application/json"}
                }
            }
        }

        Secrets format:
        {
            "api_key": "...",
            "auth_header": "Authorization",
            "auth_prefix": "Bearer"
        }
        """
        base_url = self.config.get("base_url", "")
        tools = self.config.get("tools", {})
        tool_config = tools.get(tool_name, {})

        if not tool_config:
            raise ValueError(f"Tool not configured: {tool_name}")

        method = tool_config.get("method", "POST")
        path = tool_config.get("path", "")
        headers = dict(tool_config.get("headers", {}))

        # Add authentication
        api_key = self.secrets.get("api_key", "")
        auth_header = self.secrets.get("auth_header", "Authorization")
        auth_prefix = self.secrets.get("auth_prefix", "Bearer")

        if api_key:
            headers[auth_header] = f"{auth_prefix} {api_key}" if auth_prefix else api_key

        url = f"{base_url}{path}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            if method.upper() == "GET":
                response = await client.get(url, params=tool_input, headers=headers)
            elif method.upper() == "POST":
                response = await client.post(url, json=tool_input, headers=headers)
            elif method.upper() == "PUT":
                response = await client.put(url, json=tool_input, headers=headers)
            elif method.upper() == "DELETE":
                response = await client.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            response.raise_for_status()

            # Try to parse as JSON, fall back to text
            try:
                return response.json()
            except Exception:
                return response.text

    async def _execute_mcp(
        self,
        tool_name: str,
        tool_input: dict[str, Any],
    ) -> Any:
        """Execute a Model Context Protocol (MCP) server call.

        Config format:
        {
            "server_url": "https://mcp-server.example.com",
            "server_name": "example-server"
        }

        Secrets format:
        {
            "api_key": "...",
        }
        """
        server_url = self.config.get("server_url", "")

        if not server_url:
            raise ValueError("MCP server URL not configured")

        # MCP uses JSON-RPC style requests
        request_body = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": tool_input,
            },
            "id": 1,
        }

        headers = {"Content-Type": "application/json"}

        # Add API key if present
        api_key = self.secrets.get("api_key", "")
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                server_url,
                json=request_body,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()

            if "error" in data:
                raise ValueError(f"MCP error: {data['error']}")

            return data.get("result", {}).get("content", [])

    async def _execute_oauth2(
        self,
        tool_name: str,
        tool_input: dict[str, Any],
    ) -> Any:
        """Execute an OAuth2-authenticated API call.

        Config format:
        {
            "base_url": "https://api.example.com",
            "token_url": "https://auth.example.com/oauth/token",
            "tools": {...}
        }

        Secrets format:
        {
            "client_id": "...",
            "client_secret": "...",
            "refresh_token": "..."  # Optional
        }
        """
        # Get OAuth2 access token
        access_token = await self._get_oauth2_token()

        # Execute the API call with the token
        base_url = self.config.get("base_url", "")
        tools = self.config.get("tools", {})
        tool_config = tools.get(tool_name, {})

        if not tool_config:
            raise ValueError(f"Tool not configured: {tool_name}")

        method = tool_config.get("method", "POST")
        path = tool_config.get("path", "")
        headers = dict(tool_config.get("headers", {}))
        headers["Authorization"] = f"Bearer {access_token}"

        url = f"{base_url}{path}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            if method.upper() == "GET":
                response = await client.get(url, params=tool_input, headers=headers)
            else:
                response = await client.post(url, json=tool_input, headers=headers)

            response.raise_for_status()

            try:
                return response.json()
            except Exception:
                return response.text

    async def _get_oauth2_token(self) -> str:
        """Get OAuth2 access token using client credentials or refresh token."""
        token_url = self.config.get("token_url", "")
        client_id = self.secrets.get("client_id", "")
        client_secret = self.secrets.get("client_secret", "")
        refresh_token = self.secrets.get("refresh_token")

        if not token_url or not client_id or not client_secret:
            raise ValueError("OAuth2 credentials not properly configured")

        async with httpx.AsyncClient(timeout=10) as client:
            if refresh_token:
                # Use refresh token
                response = await client.post(
                    token_url,
                    data={
                        "grant_type": "refresh_token",
                        "refresh_token": refresh_token,
                        "client_id": client_id,
                        "client_secret": client_secret,
                    },
                )
            else:
                # Use client credentials
                response = await client.post(
                    token_url,
                    data={
                        "grant_type": "client_credentials",
                        "client_id": client_id,
                        "client_secret": client_secret,
                    },
                )

            response.raise_for_status()
            data = response.json()
            return data["access_token"]
