# Project Plan — GTM

**Date:** 2025-12-17

This file provides two options:
- **Plan A (2-week thin-slice):** meet “ASAP couple of weeks” by narrowing scope
- **Plan B (3-week buffered):** adds buffer and reduces launch risk

## Plan A — 2-week thin-slice (recommended)
**Scope constraints**
- 2 offerings max (1 Assistant + 1 RAG Agent/App)
- 1–2 value streams only
- 2–3 connectors only (+ HTTP connector)
- Credits enforcement sync at Gateway (OpenMeter optional)

### Week 1
- Saleor + Wagtail deployed and seeded (products, attributes, landing pages)
- Control Plane v0: org/project, offering/version, instance, wallet/ledger
- Provisioner App: order-paid webhook → instance create/top-up
- Gateway + Runner: one happy-path run end-to-end

### Week 2
- Connector Gateway: 2–3 connectors + policy allowlists
- RAG: Ragflow+MinIO capability handler (one offering uses it)
- Credits: authorize/settle debit loop + suspend-on-zero
- Workspace UI: run wizard, connectors wizard, wallet page
- Smoke tests + launch checklist

## Plan B — 3-week buffered
- Week 1: same as Plan A Week 1
- Week 2: RAG + connectors + credits enforcement + UI
- Week 3: hardening (idempotency, retries), better onboarding, incident playbooks
