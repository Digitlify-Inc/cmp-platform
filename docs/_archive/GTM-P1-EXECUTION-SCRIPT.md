# GTM P1 Gap Execution Script

**Date:** December 16, 2025
**Execution Time:** ~2 hours total
**Prerequisites:** kubectl access, npm installed, Stripe account

---

## Quick Reference

| Gap | Command | Time |
|-----|---------|------|
| 1. Build Widget | `npm run build:widget` | 30 min |
| 2. Stripe Keys | kubectl secret | 30 min |
| 3. Demo Agents | `python manage.py load_demo_agents` | 15 min |
| 4. E2E Tests | `pytest && npm run cypress:run` | 1 hour |
| 5. Manual UAT | See checklist | 4 hours |

---

## Phase 1: Build Widget Bundle (30 min)

```bash
# Step 1: Navigate to frontend
cd /workspace/repo/github.com/Digitlify-Inc/cmp-frontend

# Step 2: Install dependencies (if needed)
npm install

# Step 3: Build widget
npm run build:widget

# Step 4: Verify output
ls -la dist/widget/
# Expected: loader.js, widget.js, widget.css

# Step 5: Test widget locally (optional)
python -m http.server 8080 --directory dist/widget/
# Open: http://localhost:8080/loader.js

# Step 6: Commit and push
git add dist/widget/
git commit -m "build: generate widget bundle for GTM"
git push origin main
```

**Verification:**
```bash
curl -s https://widget.digitlify.com/loader.js | head -5
# Should return JavaScript content
```

---

## Phase 2: Configure Stripe (30 min)

### 2.1 Get Keys from Stripe Dashboard

1. Go to https://dashboard.stripe.com
2. Navigate: Developers → API Keys
3. Copy keys:

```bash
# Save these (DO NOT COMMIT)
export STRIPE_SECRET="sk_live_..."
export STRIPE_PUBLISHABLE="pk_live_..."
```

### 2.2 Configure Webhook

1. Go to: Developers → Webhooks → Add endpoint
2. URL: `https://app.digitlify.com/api/stripe/webhook/`
3. Events to select:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.paid
   - invoice.payment_failed
4. Copy webhook secret:

```bash
export STRIPE_WEBHOOK="whsec_..."
```

### 2.3 Apply Kubernetes Secret

```bash
# Create secret (single command)
kubectl create secret generic stripe-secrets \
  --namespace=cmp \
  --from-literal=STRIPE_API_KEY_SECRET="$STRIPE_SECRET" \
  --from-literal=STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE" \
  --from-literal=STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK" \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart backend
kubectl rollout restart deployment/cmp-backend -n cmp

# Wait for rollout
kubectl rollout status deployment/cmp-backend -n cmp
```

**Verification:**
```bash
# Check secret exists
kubectl get secret stripe-secrets -n cmp

# Check env in pod
kubectl exec deploy/cmp-backend -n cmp -- env | grep STRIPE
```

---

## Phase 3: Load Demo Agents (15 min)

```bash
# Option A: Via kubectl exec
kubectl exec -it deploy/cmp-backend -n cmp -- bash -c '
  python manage.py load_cmp_categories && \
  python manage.py load_demo_agents
'

# Option B: Via Django shell (for verification)
kubectl exec -it deploy/cmp-backend -n cmp -- python manage.py shell << 'EOF'
from waldur_mastermind.marketplace.models import Category, Offering
from waldur_mastermind.marketplace_site_agent.models import AgentIdentity

print("=== Categories ===")
for c in Category.objects.all():
    print(f"  - {c.title}")

print("\n=== Agent Offerings ===")
for o in Offering.objects.filter(type='marketplace_site_agent'):
    print(f"  - {o.name} ({o.state})")

print("\n=== Agent Identities ===")
for a in AgentIdentity.objects.all():
    print(f"  - {a.name} (v{a.version})")
EOF
```

**Expected Output:**
```
=== Categories ===
  - Agents
  - Apps
  - Assistants
  - Automations

=== Agent Offerings ===
  - Customer Support Agent (Active)
  - Document Analysis Agent (Active)
  - Code Review Assistant (Active)
  - Email Automation Agent (Active)

=== Agent Identities ===
  - Customer Support Agent (v1.0.0)
  - Document Analysis Agent (v1.0.0)
  - Code Review Assistant (v1.0.0)
  - Email Automation Agent (v1.0.0)
```

**Verification:**
```bash
# Check marketplace API
curl -s https://app.digitlify.com/api/marketplace-public-offerings/ | jq '.count'
# Should return 4 or more
```

---

## Phase 4: Run E2E Tests (1 hour)

### 4.1 Backend Tests

```bash
cd /workspace/repo/github.com/Digitlify-Inc/cmp-backend

# Run all GTM E2E tests
pytest src/waldur_mastermind/marketplace_site_agent/tests/test_e2e_gtm.py -v --tb=short

# Run specific test suites
pytest src/waldur_mastermind/marketplace_site_agent/tests/test_e2e_gtm.py::ProviderJourneyE2ETest -v
pytest src/waldur_mastermind/marketplace_site_agent/tests/test_e2e_gtm.py::BuyerJourneyE2ETest -v
pytest src/waldur_mastermind/marketplace_site_agent/tests/test_e2e_gtm.py::GatewayE2ETest -v
pytest src/waldur_mastermind/marketplace_site_agent/tests/test_e2e_gtm.py::StripeIntegrationE2ETest -v

# Generate HTML report
pytest src/waldur_mastermind/marketplace_site_agent/tests/test_e2e_gtm.py \
  --html=reports/e2e_report.html --self-contained-html
```

**Expected Results:**
```
============================= test session starts ==============================
collected 19 items

test_e2e_gtm.py::ProviderJourneyE2ETest::test_create_agent PASSED
test_e2e_gtm.py::ProviderJourneyE2ETest::test_import_flow PASSED
test_e2e_gtm.py::ProviderJourneyE2ETest::test_publish_agent PASSED
test_e2e_gtm.py::ProviderJourneyE2ETest::test_analytics PASSED
test_e2e_gtm.py::BuyerJourneyE2ETest::test_browse_marketplace PASSED
test_e2e_gtm.py::BuyerJourneyE2ETest::test_create_order PASSED
test_e2e_gtm.py::BuyerJourneyE2ETest::test_configure_agent PASSED
test_e2e_gtm.py::BuyerJourneyE2ETest::test_create_api_key PASSED
test_e2e_gtm.py::BuyerJourneyE2ETest::test_get_widget_embed PASSED
test_e2e_gtm.py::BuyerJourneyE2ETest::test_usage_tracking PASSED
test_e2e_gtm.py::GatewayE2ETest::test_token_validation PASSED
test_e2e_gtm.py::GatewayE2ETest::test_invoke_agent PASSED
test_e2e_gtm.py::GatewayE2ETest::test_rate_limiting PASSED
test_e2e_gtm.py::GatewayE2ETest::test_invalid_key PASSED
test_e2e_gtm.py::StripeIntegrationE2ETest::test_checkout_session PASSED
test_e2e_gtm.py::StripeIntegrationE2ETest::test_stripe_config PASSED
test_e2e_gtm.py::KeyServiceUnitTest::test_generate_key PASSED
test_e2e_gtm.py::KeyServiceUnitTest::test_validate_key PASSED
test_e2e_gtm.py::KeyServiceUnitTest::test_revoke_key PASSED

============================= 19 passed in 45.23s ==============================
```

### 4.2 Frontend Tests

```bash
cd /workspace/repo/github.com/Digitlify-Inc/cmp-frontend

# Install Cypress if needed
npm install

# Run all Cypress tests (headless)
npm run cypress:run

# Run specific test categories
npx cypress run --spec "cypress/e2e/marketplace/**/*.cy.ts"
npx cypress run --spec "cypress/e2e/customer/**/*.cy.ts"

# Interactive mode (for debugging)
npm run cypress:open
```

**Expected Results:**
```
====================================================================================================

  (Run Finished)

       Spec                                              Tests  Passing  Failing  Pending  Skipped
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  marketplace/browse.cy.ts                 00:25        4        4        -        -        - │
  │ ✔  marketplace/offering-details.cy.ts       00:18        3        3        -        -        - │
  │ ✔  customer/agents.cy.ts                    00:22        4        4        -        -        - │
  │ ✔  customer/api-keys.cy.ts                  00:15        3        3        -        -        - │
  │ ✔  customer/widget.cy.ts                    00:12        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        01:32       16       16        -        -        -
```

---

## Phase 5: Manual UAT Checklist (4 hours)

### Pre-UAT Setup

```bash
# Create test accounts (if not exist)
# Via Keycloak admin or self-registration

# Seller account
Email: seller.uat@digitlify.com
Password: UAT_Seller_2025!

# Buyer account
Email: buyer.uat@digitlify.com
Password: UAT_Buyer_2025!
```

### Seller Journey Checklist

| Step | Test Case | Status | Notes |
|------|-----------|--------|-------|
| S1 | Login via SSO | [ ] | |
| S2 | Create organization "UAT Provider" | [ ] | |
| S3 | Register as service provider | [ ] | |
| S4 | Create agent "UAT Support Bot" | [ ] | |
| S5 | Import sample flow JSON | [ ] | |
| S6 | Set pricing ($29/month) | [ ] | |
| S7 | Publish to marketplace | [ ] | |
| S8 | Verify agent in marketplace | [ ] | |
| S9 | View analytics dashboard | [ ] | |

### Buyer Journey Checklist

| Step | Test Case | Status | Notes |
|------|-----------|--------|-------|
| B1 | Browse marketplace (anonymous) | [ ] | |
| B2 | View "UAT Support Bot" details | [ ] | |
| B3 | Login via SSO | [ ] | |
| B4 | Create organization "UAT Customer" | [ ] | |
| B5 | Purchase agent (Stripe test card) | [ ] | |
| B6 | Verify agent in "My Agents" | [ ] | |
| B7 | Configure agent persona | [ ] | |
| B8 | Create API key | [ ] | |
| B9 | Copy widget embed code | [ ] | |
| B10 | Test API invoke (curl) | [ ] | |

### API Invoke Test

```bash
# Get API key from step B8
API_KEY="ar_sk_live_XXXXXXXXXXXXXXXX"

# Test invoke
curl -X POST https://app.digitlify.com/api/agent-gateway/invoke/ \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello, how can you help me?"}' | jq .
```

**Expected Response:**
```json
{
  "output": "Hello! I'm here to help you...",
  "session_id": "...",
  "usage": {
    "input_tokens": 8,
    "output_tokens": 25,
    "elapsed_ms": 750
  }
}
```

### Integration Tests

| Test | Status | Notes |
|------|--------|-------|
| SSO token works across components | [ ] | |
| Stripe webhook creates subscription | [ ] | |
| Usage tracking records API calls | [ ] | |
| Rate limiting blocks after limit | [ ] | |
| Different orgs can't see each other | [ ] | |

---

## Phase 6: Sign-Off

### Test Summary

| Category | Total | Passed | Failed |
|----------|-------|--------|--------|
| Backend E2E | 19 | | |
| Frontend Cypress | 16 | | |
| Manual Seller | 9 | | |
| Manual Buyer | 10 | | |
| Integration | 5 | | |
| **TOTAL** | **59** | | |

### Sign-Off Approvals

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Dev Lead | | | |
| Product Owner | | | |
| Security | | | |

### Notes

```
Issues Found:
-

Workarounds Applied:
-

Post-Launch Items:
-
```

---

## Quick Commands Reference

```bash
# Check all services
curl -s https://app.digitlify.com/api/health/ | jq .

# Check marketplace count
curl -s https://app.digitlify.com/api/marketplace-public-offerings/ | jq '.count'

# Check backend logs
kubectl logs deploy/cmp-backend -n cmp --tail=100

# Check frontend logs
kubectl logs deploy/cmp-frontend -n cmp --tail=100

# Restart all
kubectl rollout restart deployment -n cmp

# Port forward for debugging
kubectl port-forward svc/cmp-backend 8000:80 -n cmp
```

---

## Rollback Plan

If issues found, rollback steps:

```bash
# Rollback backend
kubectl rollout undo deployment/cmp-backend -n cmp

# Rollback frontend
kubectl rollout undo deployment/cmp-frontend -n cmp

# Disable Stripe (if payment issues)
kubectl delete secret stripe-secrets -n cmp
kubectl rollout restart deployment/cmp-backend -n cmp

# Remove demo agents (if data issues)
kubectl exec deploy/cmp-backend -n cmp -- python manage.py shell << 'EOF'
from waldur_mastermind.marketplace.models import Offering
Offering.objects.filter(name__contains='Demo').delete()
EOF
```

---

**Document Created:** December 16, 2025
**Execution Owner:** DevOps / QA Team
