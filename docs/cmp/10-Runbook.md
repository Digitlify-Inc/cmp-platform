# Runbook

Date: 2025-12-17


---

## Rollback & Recovery (No-Gaps Procedures)

### A) Rollback a broken offering version
1) Control Plane: mark new version `paused` or `deprecated`.
2) Update instances to previous good `offeringVersionId` (or pause instances).
3) CP commits desired state; ArgoCD reconciles.
4) Validate: runs succeed and credit debits normalize.

### B) Rollback GitOps desired state (routes/policies/KB)
1) Revert the offending commit under `clusters/<env>/instances/...`
2) ArgoCD sync and reconcile.
3) Validate gateway route/policy readiness.

### C) Stop provisioning during incidents
1) Disable Saleor webhook delivery OR disable Provisioner App endpoint.
2) After fix, re-enable and re-process orders idempotently.

### D) Ledger corrections
- Ledger is append-only. Never edit past entries.
- Use compensating entries for corrections.

### E) Connector secret compromise
1) Revoke binding.
2) Rotate upstream secret.
3) Create new binding.
4) Audit tool-call logs.

### F) RAG boundary incident
1) Pause impacted instances.
2) Block Ragflow access at Gateway/Connector Gateway.
3) Validate KB scopes + MinIO prefix/bucket boundaries.
