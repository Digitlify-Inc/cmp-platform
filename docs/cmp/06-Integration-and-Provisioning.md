# E2E Integration & Provisioning — MVP

**Date:** 2025-12-17

## 1) Saleor → Provisioner App → Control Plane
- Saleor webhook `OrderFullyPaid` hits Provisioner App.
- Provisioner App translates to:
  - offering purchase → `POST /instances` (idempotent)
  - credit pack purchase → `POST /wallet/topup` (idempotent)

Idempotency key: `{order_id}:{line_id}`

## 2) Provisioning via GitOps
- Control Plane creates desired state (routes/policies/KB bindings)
- Commits manifests to internal Git
- ArgoCD reconciles
- Control Plane marks instance ACTIVE when readiness checks pass

## 3) Execution path
- Buyer → Gateway (OIDC/API key)
- Gateway:
  - entitlements + limits
  - credits authorize/settle (MVP sync)
  - routes to Runner → Langflow Runtime
- Tools:
  - Langflow calls Connector Gateway
  - Connector Gateway pulls secrets from Vault and executes connector/MCP calls
- RAG:
  - Ragflow + MinIO behind platform APIs
