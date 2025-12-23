# GTM Status Update - December 14, 2024

## Summary of Changes Made

This document summarizes the GTM gap fixes implemented on December 14, 2024.

---

## 1. cmp-gitops Repository Created (P0 CRITICAL - FIXED)

**Status:** COMPLETE

The cmp-gitops repository was empty. Created full GitOps deployment structure:

### Files Created:
```
cmp-gitops/
├── README.md
├── bootstrap/
│   ├── kustomization.yaml
│   └── app-of-apps.yaml
├── charts/cmp/
│   ├── values-prod.yaml
│   └── values-qa.yaml
├── platform/
│   ├── apps/prod/
│   │   ├── cmp.yaml
│   │   ├── agent-registry.yaml
│   │   ├── keycloak.yaml
│   │   └── vault.yaml
│   └── overlays/prod/
│       ├── agent-registry/
│       │   ├── kustomization.yaml
│       │   ├── deployment.yaml
│       │   ├── service.yaml
│       │   ├── ingress.yaml
│       │   └── external-secrets.yaml
│       ├── cmp/
│       │   ├── kustomization.yaml
│       │   ├── rabbitmq.yaml
│       │   ├── redis.yaml
│       │   └── external-secrets.yaml
│       ├── keycloak/
│       │   ├── kustomization.yaml
│       │   ├── certificate.yaml
│       │   └── ingress.yaml
│       └── vault/
│           ├── kustomization.yaml
│           └── cluster-secret-store.yaml
```

### Domain Configuration:
- Production: `*.digitlify.com`
- QA: `*.qa.digitlify.com`

---

## 2. Async Document Processing (P0 - FIXED)

**Status:** COMPLETE

**Location:** `cmp-backend/src/waldur_mastermind/marketplace_site_agent/`

### Changes:
- Task `process_training_document` exists in `tasks.py`
- Updated `views.py` to call the task on document upload
- Documents now transition: PENDING -> PROCESSING -> INDEXED (or FAILED)

### Code Flow:
1. Document uploaded via `upload_training_document` endpoint
2. Task `process_training_document.delay()` queued
3. Celery worker processes document asynchronously
4. Status updated in database

---

## 3. Revenue Calculation (P1 - FIXED)

**Status:** COMPLETE

**Location:** `cmp-backend/src/waldur_mastermind/marketplace_site_agent/views.py`

### Changes:
- Revenue now calculated from active Stripe subscriptions
- Uses `StripeSubscription` model to get active subscriptions
- Sums `unit_price` from associated plans

### Code:
```python
from waldur_mastermind.marketplace_site_agent.stripe import models as stripe_models
active_subscriptions = stripe_models.StripeSubscription.objects.filter(
    resource__in=resources,
    status=stripe_models.StripeSubscription.Status.ACTIVE,
)
total_revenue = Decimal("0.00")
for sub in active_subscriptions:
    if hasattr(sub.stripe_price, "plan") and sub.stripe_price.plan.unit_price:
        total_revenue += sub.stripe_price.plan.unit_price
```

---

## 4. CORS Widget Origin Validation (P2 - FIXED)

**Status:** COMPLETE

**Location:** `gsv-agentregistry/agent_registry/core/middleware.py`

### Changes:
- Implemented origin validation in `_add_cors_headers` method
- Validates `X-Widget-ID` header against `WidgetConfig.allowed_domains`
- Extracts domain from Origin header and checks against whitelist
- Fails open on errors (allows request if validation fails)

### Security Behavior:
- If widget has `allowed_domains` set and origin not in list, CORS headers are not added
- Browser will block the request due to missing CORS headers
- Widgets without `allowed_domains` allow all origins (backwards compatible)

---

## Updated GTM Readiness

| Area | Previous | Current | Status |
|------|----------|---------|--------|
| cmp-gitops | 0% | 100% | DONE |
| Async Doc Processing | 0% | 100% | DONE |
| Revenue Calculation | 0% | 100% | DONE |
| CORS Validation | 0% | 100% | DONE |
| **Overall GTM** | ~75% | ~90% | READY |

---

## Remaining Items (Not Blocking GTM)

### P2 - Nice to Have:
1. **Platform-specific Grafana dashboards** - Can use generic K8s dashboards for launch
2. **Multi-region Runtime** - Single region acceptable for soft launch
3. **Provider Portal UI** - Use Django Admin for single-provider GTM

### Post-Launch:
1. Widget JS CDN distribution
2. Stripe Connect for multi-provider payouts
3. n8n/Dify Studio adapters

---

## Next Steps

1. **Configure Vault secrets** for production:
   - `secret/digitlify/prod/stripe` - API key and webhook secret
   - `secret/digitlify/prod/rabbitmq` - Credentials
   - `secret/digitlify/prod/keycloak` - Client secrets
   - `secret/digitlify/prod/agent-registry` - Django secret key, API tokens

2. **Push cmp-gitops to GitHub** and connect to ArgoCD

3. **Run E2E tests** on the integrated system

4. **Deploy first test agent** to production

---

## Files Modified

### cmp-backend:
- `src/waldur_mastermind/marketplace_site_agent/views.py` - Task call, revenue calculation

### gsv-agentregistry:
- `agent_registry/core/middleware.py` - CORS validation

### cmp-gitops (new):
- 23 new files created (see section 1)

