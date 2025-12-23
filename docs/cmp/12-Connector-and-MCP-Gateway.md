# Connector & MCP Gateway — Contracts (MVP)

**Date:** 2025-12-17

This is the security-critical layer for tools/connectors/MCP. Flows must call this service instead of external APIs.

## Tool invoke API
`POST /v1/tools/{toolId}:invoke`
```json
{
  "instanceId": "ins_123",
  "bindingId": "bind_abc",
  "input": { "method": "GET", "url": "https://api.example.com/v1/tickets" },
  "context": { "orgId": "org_1", "projectId": "prj_1" }
}
```

## Vault pattern
- Control Plane creates bindings and stores tokens in Vault:
  - `kv/data/connectors/org_1/prj_1/bind_abc`
- Connector Gateway fetches secrets at execution time
- Policies generated from capabilities enforce allowlists and limits
