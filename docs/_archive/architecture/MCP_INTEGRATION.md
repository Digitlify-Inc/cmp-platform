# MCP Integration Architecture

**Version:** 2.0  
**Status:** Design Specification

---

## Overview

The GSV Platform uses **Model Context Protocol (MCP)** as the integration layer between components.

### What is MCP?

MCP is Anthropic's standardized protocol for connecting AI applications with external context and tools.

**Key Concepts:**
- **MCP Servers:** Provide resources, tools, and prompts
- **MCP Clients:** Consume MCP servers (Claude, LangFlow, etc.)
- **Resources:** Data sources (read-only)
- **Tools:** Functions that can be called (actions)
- **Prompts:** Reusable prompt templates

---

## MCP Server Ecosystem

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Client Layer                              │
│  (Claude Desktop, LangFlow Studio, Custom Apps)                 │
└───────────┬─────────────────────────────────────────────────────┘
            │
            │ MCP Protocol (JSON-RPC over stdio/SSE)
            │
┌───────────▼─────────────────────────────────────────────────────┐
│                    MCP Server Ecosystem                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Agent      │  │   Waldur     │  │   LangFlow   │          │
│  │   Registry   │  │   MCP        │  │   MCP        │          │
│  │   (Hub)      │  │   Server     │  │   Server     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Agent Registry MCP Server

The **central hub** connecting all platform components.

### Resources

| Resource URI | Description |
|--------------|-------------|
| `tenants://list` | List all tenants |
| `tenants://{id}` | Get tenant details |
| `agents://list` | List all agents |
| `agents://{id}` | Get agent details |
| `access://list` | List access records |
| `usage://stats` | Usage statistics |

### Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `create_tenant` | Create tenant | waldur_customer_uuid, name, tenancy_model |
| `create_project` | Create project | tenant_id, waldur_project_uuid, name |
| `register_agent` | Register agent | tenant_id, agent_id, langflow_flow_id |
| `provision_agent` | Deploy to runtime | agent_instance_id, environment |
| `grant_access` | Generate API key | agent_instance_id, waldur_user_uuid, quota |
| `revoke_access` | Revoke API key | access_id |
| `track_usage` | Record usage | api_key, endpoint, metrics |
| `validate_api_key` | Validate key | api_key |

---

## Waldur MCP Server

Integration with the marketplace platform.

### Resources

| Resource URI | Description |
|--------------|-------------|
| `offerings://` | Marketplace offerings |
| `orders://` | Customer orders |
| `customers://` | Customer data |
| `projects://` | Project information |

### Tools

| Tool | Description |
|------|-------------|
| `create_offering` | Create marketplace offering |
| `update_offering` | Update offering |
| `create_plan` | Add pricing plan |
| `get_orders` | Retrieve orders |
| `provision_service` | Provision ordered service |

---

## LangFlow MCP Server

Integration with flow design and execution.

### Resources

| Resource URI | Description |
|--------------|-------------|
| `flows://` | All flows |
| `deployments://` | Active deployments |
| `components://` | Available components |

### Tools

| Tool | Description |
|------|-------------|
| `create_flow` | Create new flow |
| `deploy_flow` | Deploy to runtime |
| `test_flow` | Test execution |
| `get_flow_metrics` | Performance metrics |

---

## Integration Flow: Publish Agent

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Studio    │     │   Agent     │     │   Waldur    │
│  (LangFlow) │     │  Registry   │     │    CMP      │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ 1. Create Flow    │                   │
       │──────────────────▶│                   │
       │                   │                   │
       │ 2. Deploy Flow    │                   │
       │──────────────────▶│                   │
       │                   │                   │
       │                   │ 3. Register Agent │
       │                   │──────────────────▶│
       │                   │                   │
       │                   │ 4. Create Offering│
       │                   │──────────────────▶│
       │                   │                   │
       │ 5. Return Success │                   │
       │◀──────────────────│                   │
       │                   │                   │
```

---

## Integration Flow: Customer Order

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Waldur    │     │   Agent     │     │  LangFlow   │     │  Customer   │
│    CMP      │     │  Registry   │     │   Runtime   │     │             │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │ 1. Order Webhook  │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │ 2. Provision Agent│                   │
       │                   │──────────────────▶│                   │
       │                   │                   │                   │
       │                   │ 3. Generate API Key                   │
       │                   │──────────────────────────────────────▶│
       │                   │                   │                   │
       │ 4. Update Order   │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │                   │                   │ 5. API Calls      │
       │                   │                   │◀──────────────────│
       │                   │                   │                   │
       │                   │ 6. Track Usage    │                   │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
```

---

## MCP Transport Options

### stdio (Default)
```json
{
  "mcpServers": {
    "agent-registry": {
      "command": "python",
      "args": ["-m", "agent_registry.mcp.server"],
      "env": {
        "DATABASE_URL": "postgresql://..."
      }
    }
  }
}
```

### SSE (HTTP)
```json
{
  "mcpServers": {
    "agent-registry": {
      "url": "http://agent-registry.cmp.svc.cluster.local:8001/mcp",
      "transport": "sse"
    }
  }
}
```

---

## Security Considerations

1. **Authentication:** MCP servers authenticate via service accounts
2. **Authorization:** Tool access controlled by MCP server
3. **Transport:** TLS required for SSE transport
4. **Audit:** All tool calls logged

---

## Future MCP Servers

| Server | Purpose | Timeline |
|--------|---------|----------|
| Backstage MCP | Software catalog | Q1 2026 |
| Vault MCP | Secrets management | Q1 2026 |
| GitHub MCP | Repository management | Q1 2026 |
| Monitoring MCP | Observability | Q2 2026 |

---

*Last Updated: November 27, 2025*
