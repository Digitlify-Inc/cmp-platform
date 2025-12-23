# Open Issues Register (Prioritized)

> Use this as the single source of truth for release readiness. Convert P0/P1 into Jira stories.

Legend:
- **P0** = stop-ship
- **P1** = must-fix for solid QA/UAT
- **P2** = can follow post-GTM

| ID | Priority | Area | Issue | What breaks | Recommended fix |
|---|---|---|---|---|---|
| ISS-001 | P0 | Customer Console | Missing training/branding/widget/connectors/usage pages | Buyers cannot configure subscribed agent/app | Implement Customer Console MVP (see 07/08 docs) |
| ISS-002 | P0 | Billing/Metering | Usage is stubbed (zeros), flat charge | Credits and invoices wrong | Emit usage events + integrate OpenMeter/export hooks |
| ISS-003 | P0 | Auth | No API-key auth path for widget/API | End-users can’t use widget without Keycloak | Add API key auth + key introspection in CP |
| ISS-004 | P0 | Secrets | ESO/Vault key path mismatch (`secret/data/...`) | Secrets don’t sync; pods crash | Normalize Vault keys for KV v2 |
| ISS-005 | P0 | Commerce | Stripe/payment not enabled | Paid checkout not testable | Dummy in QA + Stripe app/plugin in prod |
| ISS-006 | P0 | UX/Nav | “My Agents” demo page vs real instances | Confusing + can look broken | Replace with CP-backed instances UI |
| ISS-007 | P1 | E2E | Playwright URLs hard-coded to dev.gsv.dev | QA/prod E2E runs drift | Env-driven URL config |
| ISS-008 | P1 | GitOps | Some base ingresses dev.gsv.dev while others digitlify.com | Confusing overlays; risk wrong host in prod | Make base=prod, overlays patch env |
| ISS-009 | P1 | Runner | flow_id fallback uses instance_id | Runs fail unless IDs match | Store instance→flow mapping in CP + runner resolves it |
| ISS-010 | P1 | Connectors | Marketplace points to `/api/v1` while CP exposes root paths | 404 for connectors | Unify API base path + auth header |
| ISS-011 | P1 | Security | Billing authorize/settle may lack membership checks | Cross-tenant abuse | Enforce tenant/org membership on all billing endpoints |
| ISS-012 | P1 | Storage | MinIO endpoint mismatch across components | Backup/export failures | Standardize S3 endpoint + bucket names per env |
| ISS-013 | P2 | Observability | No end-to-end trace correlation IDs | Debugging hard | Add request ID propagation + OTel |
| ISS-014 | P2 | Multi-model | Bifrost not deployed/wired | Multi-model routing missing | Add Bifrost deployment + Langflow integration |
| ISS-015 | P2 | RAG | RAGFlow integration not wired into flows and console | Training UX incomplete | Implement KB ingestion + retrieval tool in Langflow |

