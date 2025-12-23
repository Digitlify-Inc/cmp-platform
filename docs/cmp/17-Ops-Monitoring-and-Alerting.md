# Ops Monitoring & Alerting — MVP Readiness

**Date:** 2025-12-17

This closes the “monitoring/alerting thresholds” gap with concrete MVP thresholds.

## Gateway
- 5xx rate > **1% for 5m**
- p95 latency > **1500ms for 10m** on `/v1/runs`
- widget init failure rate > **2% for 10m**
- OIDC verification/introspection failures > **1% for 10m**

## Control Plane
- billing authorize errors > **0.5% for 10m**
- billing settle errors > **0.5% for 10m**
- instances stuck PROVISIONING > **3 for 15m**
- DB saturation > **80% for 10m**

## Runner / Runtime
- run failure rate > **2% for 10m**
- timeout rate > **1% for 10m**
- p95 execution time > **30s for 10m** (tune per offering)

## Connector/MCP Gateway + Vault
- Vault read failures > **0.2% for 10m**
- connector 5xx > **2% for 10m**
- policy deny spike > **3x baseline for 15m**

## Ragflow + MinIO
- rag ingest failures > **1% for 15m**
- rag query p95 latency > **2000ms for 10m**
- minio 5xx > **0.5% for 10m**
- disk used > **80% (ticket)**, > **90% (page)**

## Credits/business sanity
- avg debit per run increases > **2x day-over-day**
- insufficient-credit blocks spike > **3x baseline for 30m**
