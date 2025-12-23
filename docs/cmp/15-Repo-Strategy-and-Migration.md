# Repo Strategy & cmp-agentregistry Relationship (Decision + Plan)

**Date:** 2025-12-17

This closes the “cmp-agentregistry relationship unclear” gap with an explicit decision framework.

## Options
### A) Control Plane absorbs cmp-agentregistry (recommended end-state)
- CP owns offerings/versions/instances/billing/lifecycle.
- cmp-agentregistry becomes a module/library or is deprecated.

### B) CP delegates to cmp-agentregistry (only if registry is already mature)
- Registry stays authoritative for offering/version metadata.
- CP calls registry to resolve version → artifact/capabilities.

### C) Hybrid import/mirror (recommended for GTM)
- CP is authoritative for activation/billing/provisioning.
- CP optionally imports/mirrors offerings from cmp-agentregistry until cutover.

**Recommendation for GTM:** start with **Option C**, converge to **Option A** post-GTM.

## Cutover checklist
- [ ] CP can publish versions without cmp-agentregistry
- [ ] Saleor provisioning uses CP ids
- [ ] Billing + entitlements only in CP
- [ ] Runtime paths do not depend on registry calls
