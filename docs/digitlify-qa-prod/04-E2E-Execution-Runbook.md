# E2E Execution Runbook (QA & Prod)

## 1) Pre-req
- Node 20+
- pnpm
- Playwright browsers installed
- Test users exist in Keycloak:
  - buyer1, seller1, operator1 (or equivalent groups)

## 2) Parameterize URLs (required)
Update Playwright config to accept environment variables:

- `E2E_SITE_URL` (Marketplace) e.g. `https://qa.digitlify.com`
- `E2E_CP_URL` e.g. `https://cp.qa.digitlify.com`
- `E2E_SALEOR_URL` e.g. `https://shop.qa.digitlify.com/graphql/`
- `E2E_STUDIO_URL` e.g. `https://studio.qa.digitlify.com`
- `E2E_RUNTIME_URL` e.g. `https://runtime.qa.digitlify.com`
- `E2E_API_URL` e.g. `https://api.qa.digitlify.com`

## 3) Suggested suites
### Smoke (10–15 min)
- Platform Health
- Main Site + Marketplace Health
- Buyer Journey: Phase 1 (Discovery) + Phase 2 (Evaluation)
- Seller Journey: Phase 1 (Dashboard Access)
- Wallet endpoints (auth + shape)

### Full regression (60–120 min)
- Run all suites

## 4) Golden-path E2E (what must pass for GTM)
1) Buyer signs up / signs in
2) Buyer browses marketplace and views offering
3) Buyer adds to cart and places order
4) Payment is confirmed (dummy/manual in QA OK)
5) Provisioning webhook fires → CP creates instance + entitlements
6) Buyer sees instance in “My Instances”
7) Buyer creates API key (or widget token)
8) Buyer runs agent (1 request) and sees usage debited
9) Seller can create/list offering and see it visible publicly

## 5) Artifacts
- Save Playwright HTML report as a build artifact in CI.
- Export a short “E2E Summary” Markdown into release notes.

