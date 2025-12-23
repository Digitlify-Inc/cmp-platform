# Langflow Integration — Authoring, Packaging, Execution (MVP)

**Date:** 2025-12-17

This doc fills the gap: how Control Plane and the execution plane target a specific Langflow flow version for a specific instance.

## MVP approach
- Treat Langflow as **authoring + execution engine**
- Introduce a **Flow Runner** as a stable adapter in front of Langflow Runtime

## Artifact lifecycle
1) Creator builds in Langflow Studio
2) Export `flow.json`
3) Upload to Control Plane → immutable OfferingVersion (hash + metadata)
4) Store artifact in MinIO:
   - `s3://gsv-artifacts/offering/{offeringId}/version/{version}/flow.json`

## Invocation contract (Gateway → Runner)
`POST /v1/runs`
```json
{
  "instanceId": "ins_123",
  "offeringVersion": "offv_456",
  "input": { "query": "..." },
  "context": { "orgId": "org_1", "projectId": "prj_1", "userId": "usr_1" }
}
```

Runner responsibilities
- fetch artifact from MinIO (server-side)
- validate hash
- inject **effective config** (non-secret)
- call Langflow Runtime internal API
- normalize output and emit run/tool events
