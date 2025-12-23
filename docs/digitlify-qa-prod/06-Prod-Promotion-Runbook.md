# Prod Promotion Runbook

## 1) Pre-prod gates
- QA sign-off on Golden Path
- Security review:
  - tenant isolation (no cross-tenant instance access)
  - billing endpoints authorization
  - API key scope and revocation

## 2) Production DNS & TLS
- Confirm wildcard + apex:
  - `digitlify.com`, `www.digitlify.com`, `*.digitlify.com`
- Use Let’s Encrypt DNS-01 with Cloudflare (recommended).

## 3) Payments (Stripe)
- Enable Stripe via Saleor payment app/plugin.
- Store all Stripe secrets in Vault.
- Test:
  - successful payment
  - webhook delivery
  - provisioning success
  - refund/cancel path (at least manual for GTM)

## 4) Rollout strategy
- Blue/green if possible, or phased Argo waves:
  1) infra (cert-manager, external-dns, ESO, vault)
  2) identity (Keycloak)
  3) commerce (Saleor)
  4) platform (CP, Gateway, Runner, Runtime, Studio)
  5) marketplace UI + widget

## 5) Post-deploy checks
- Smoke tests:
  - home page loads
  - login works
  - marketplace browse works
  - place order works
  - instance created
  - run works and deducts credits
- Observability:
  - dashboards live
  - logs searchable

## 6) Rollback
- Maintain previous Argo revision (git tag) as rollback point.
- Document which DB migrations are reversible.

