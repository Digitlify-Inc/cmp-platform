# Testing Strategy — MVP

**Date:** 2025-12-17

## Minimal E2E tests (must-have)
1) Saleor order paid webhook → instance created (idempotent)
2) Instance becomes ACTIVE via GitOps readiness
3) Run via Gateway → Runner → Langflow Runtime
4) Credits debit recorded; run blocked at zero
5) Credit pack top-up unblocks immediately
6) Connector binding works; revoke blocks
7) RAG upload → ingestion → retrieval works; cross-tenant fails
