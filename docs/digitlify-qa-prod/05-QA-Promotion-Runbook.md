# QA Promotion Runbook (48-hour plan)

This is a pragmatic sequence to get QA live quickly and safely.

## Phase A — Code & Config Freeze
- Freeze new features; only allow P0/P1 fixes.
- Tag a release candidate (RC) in both repos.

## Phase B — Domain & DNS
1) Confirm Cloudflare zones:
   - `digitlify.com`
2) Create wildcard DNS records (external-dns can manage if permitted):
   - `*.qa.digitlify.com` → ingress LB / tunnel
   - `qa.digitlify.com` → ingress LB / tunnel
3) Decide TLS strategy in QA:
   - staging Let's Encrypt (recommended) OR mkcert/self-signed for internal.

## Phase C — GitOps overlay readiness
1) Ensure QA overlay contains ingress patches for all public-facing services:
   - marketplace, shop/admin, cp, api, widget, studio, runtime, rag, sso, idp
2) Ensure `external-dns.alpha.kubernetes.io/hostname` matches QA hostnames.
3) Ensure cert-manager ClusterIssuer exists and works in QA.

## Phase D — Secrets / ESO / Vault
1) Fix Vault KVv2 key path usage (see P0-04).
2) Validate secrets sync:
   - `kubectl get externalsecret -A`
   - `kubectl describe externalsecret ...` → Synced=True
3) Validate pods start without manual secret edits.

## Phase E — Identity & Redirect URIs
1) Keycloak:
   - Clients redirect URIs include:
     - `https://qa.digitlify.com/*`
     - `https://admin.qa.digitlify.com/*` (if needed)
     - `https://studio.qa.digitlify.com/*`
2) Cookies:
   - Set correct cookie domain for NextAuth (avoid cross-subdomain surprises).

## Phase F — Payments
- QA can use Dummy payments to validate provisioning:
  - The key is “paid order → instance created”.
- Stripe in prod can be deferred, but capture the exact prod plan (doc 09).

## Phase G — Run E2E
1) Run smoke suite first.
2) Fix failures.
3) Run full suite.
4) Produce QA handoff report:
   - known issues (P2 ok), what was tested, what remains.

## Exit criteria to declare QA “ready”
- All P0 fixed
- Golden-path E2E passes (see 04)
- Buyer can configure at least:
  - API key + 1 run
  - basic data source ingest OR a placeholder with clear “not in MVP” messaging

