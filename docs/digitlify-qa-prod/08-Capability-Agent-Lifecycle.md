# Capability-based Agent/App Lifecycle (Per Customer)

This document defines how a subscribed “capability-based” offering becomes a runnable, configurable instance for a tenant.

## Entities
- **Offering** (seller-defined): template + capabilities + plan + price
- **Instance** (buyer-owned): per-tenant copy with config, keys, KB, usage
- **Capability**: declared features (multilingual, widget, crm_sync, rag, voice, etc.)
- **Flow Template**: Langflow flow (seller/ops created)
- **Runtime**: headless executor for flows
- **Gateway**: single API entrypoint for runs, billing, widget
- **Control Plane**: system of record for tenancy, entitlements, wallet, instance state

## Lifecycle (Happy path)
1) Seller publishes Offering (includes flow_template_id + declared capabilities)
2) Buyer purchases plan
3) Commerce webhook → CP `provision()` creates:
   - instance
   - entitlements
   - wallet linkage / limits
4) Buyer opens Customer Console:
   - sets branding
   - configures channels (widget/API)
   - attaches KB sources (RAG)
5) Buyer (or widget) calls Gateway with API key:
   - Gateway authorizes credits (CP)
   - Gateway calls Runner
   - Runner executes flow via Runtime
   - usage emitted to OpenMeter/export
   - credits settled

## What a “Runtime Environment” consists of
Minimum components:
- Langflow Runtime (headless)
- Vector store / retrieval endpoint (RAGFlow or equivalent)
- Secrets access (Vault/ESO)
- Network policies (tenant isolation boundaries)
- Object storage (MinIO) for artifacts/uploads
- Execution worker limits (CPU/mem)
- Optional: sandboxing (gVisor) for enterprise tiers

## Tenant isolation approach
- Shared plans:
  - shared runtime namespace
  - strict `tenant_id` scoping in CP + Gateway + RAG
  - hard quotas enforced at Gateway/Runner + OpenMeter
- Enterprise plans:
  - dedicated namespace
  - dedicated runtime + dedicated KB
  - optional dedicated gateway worker pool

