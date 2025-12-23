# Go/No-Go Checklist

## Go criteria
- P0 blockers closed
- Golden-path E2E passes in QA
- Tenant isolation smoke verified:
  - buyer cannot access another tenant’s instance/config/keys
- Billing accuracy smoke verified:
  - 1 run → usage event → credit decrement visible

## No-Go triggers
- Payment webhooks unreliable (if launching with Stripe)
- Secrets not syncing (ESO)
- Gateway requires SSO for widget/API (unless you explicitly launch without widget)

## Launch-day checklist
- on-call contact
- dashboards links
- rollback tag
- status page messaging (optional)

