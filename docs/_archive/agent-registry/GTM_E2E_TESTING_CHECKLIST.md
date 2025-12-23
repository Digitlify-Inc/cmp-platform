# GSV Agent Registry - E2E Testing Checklist for GTM

**Document Version:** 1.0
**Status:** Active
**Created:** December 2, 2025
**Target:** GTM Soft Launch Validation

---

## Overview

This checklist covers all E2E testing scenarios required for GTM validation. Each test should be executed against the QA environment with a live Waldur instance.

---

## Pre-Test Setup

### Environment Requirements

| Component | Requirement | Status |
|-----------|-------------|--------|
| Agent Registry | Deployed to QA namespace | [ ] |
| PostgreSQL | Running with migrations applied | [ ] |
| Redis | Running for cache/Celery | [ ] |
| Celery Worker | Running | [ ] |
| Celery Beat | Running with schedule | [ ] |
| Waldur CMP | Accessible via API | [ ] |
| LangFlow Studio | Accessible (optional for manual tests) | [ ] |
| LangFlow Runtime | Accessible | [ ] |

### Configuration Verification

```bash
# Verify environment variables
kubectl exec -it deploy/agent-registry -n agent-registry -- env | grep -E "WALDUR|RUNTIME|STUDIO"

# Expected output:
# WALDUR_API_URL=http://waldur-api.cmp.svc.cluster.local
# WALDUR_API_TOKEN=<redacted>
# WALDUR_WEBHOOK_SECRET=<redacted>
# RUNTIME_BASE_URL=http://runtime.dev.gsv.dev
# STUDIO_API_URL=http://langflow-studio.studio.svc.cluster.local
```

### Test Data Preparation

```yaml
# Test Tenant (create in Waldur first)
test_customer:
  name: "E2E Test Customer"
  waldur_uuid: "will-be-generated"

# Test Project (create in Waldur under test_customer)
test_project:
  name: "E2E Test Project"
  waldur_uuid: "will-be-generated"

# Test Agent (create in Agent Registry)
test_agent:
  name: "E2E Test Support Agent"
  agent_id: "e2e-test-agent-001"
  category: "customer_support"
```

---

## Test Scenarios

### 1. Tenant Lifecycle Tests

#### 1.1 Tenant Creation via Webhook

**Precondition:** Waldur instance accessible, webhook secret configured

**Steps:**
1. [ ] Create new Customer in Waldur portal
2. [ ] Verify Waldur sends webhook to Agent Registry
3. [ ] Check Agent Registry logs for webhook receipt
4. [ ] Verify AgentTenant created in Django admin
5. [ ] Confirm waldur_customer_uuid matches

**Expected Results:**
- [ ] AgentTenant exists with correct data
- [ ] `is_active = True`
- [ ] `tenancy_model = "shared"` (default)

**Test Command:**
```bash
# Check tenant was created
curl -s -H "Authorization: Token $ADMIN_TOKEN" \
  "$REGISTRY_URL/api/v1/tenants/?waldur_customer_uuid=<uuid>" | jq
```

---

#### 1.2 Tenant Update via Webhook

**Steps:**
1. [ ] Update Customer name in Waldur
2. [ ] Verify webhook received
3. [ ] Check AgentTenant.waldur_customer_name updated

**Expected Results:**
- [ ] Name synced within 5 seconds
- [ ] No duplicate tenants created

---

#### 1.3 Tenant Suspension

**Steps:**
1. [ ] Suspend Customer in Waldur (or simulate via admin)
2. [ ] Verify AgentTenant.is_active = False
3. [ ] Verify AgentTenant.suspended_at set

**Expected Results:**
- [ ] Tenant marked as suspended
- [ ] API keys under this tenant should fail validation

---

### 2. Project Lifecycle Tests

#### 2.1 Project Creation via Webhook

**Steps:**
1. [ ] Create Project in Waldur under test Customer
2. [ ] Verify webhook received
3. [ ] Check AgentProject created with correct tenant FK

**Expected Results:**
- [ ] AgentProject exists
- [ ] Linked to correct AgentTenant
- [ ] `is_active = True`

---

#### 2.2 Project Archive

**Steps:**
1. [ ] Archive Project in Waldur
2. [ ] Verify AgentProject.is_active = False

---

### 3. Agent Lifecycle Tests

#### 3.1 Agent Registration (DRAFT)

**Steps:**
1. [ ] Create agent via API: `POST /api/v1/agents/`
   ```json
   {
     "project_id": "<project-id>",
     "agent_id": "e2e-test-agent-001",
     "name": "E2E Test Support Agent",
     "description": "Test agent for E2E validation",
     "category": "customer_support",
     "langflow_flow_id": "test-flow-123"
   }
   ```
2. [ ] Verify agent created in DRAFT state
3. [ ] Verify in Django admin

**Expected Results:**
- [ ] AgentInstance exists
- [ ] `state = "DRAFT"`
- [ ] `waldur_offering_uuid = null`

---

#### 3.2 Agent Deployment (DRAFT → DEPLOYED)

**Steps:**
1. [ ] Call deploy endpoint: `POST /api/v1/agents/<id>/deploy/`
2. [ ] Verify state transition
3. [ ] (Optional) Verify runtime received flow

**Expected Results:**
- [ ] `state = "DEPLOYED"`
- [ ] `runtime_endpoint` populated
- [ ] `state_changed_at` updated

---

#### 3.3 Agent Publishing (DEPLOYED → LISTED)

**Steps:**
1. [ ] Add at least one plan:
   ```json
   POST /api/v1/agents/<id>/plans/
   {
     "name": "Starter",
     "price_cents": 2900,
     "monthly_quota": 10000,
     "rate_limit_per_second": 10
   }
   ```
2. [ ] Call publish endpoint: `POST /api/v1/agents/<id>/publish/`
3. [ ] Verify Waldur Offering created

**Expected Results:**
- [ ] `state = "LISTED"`
- [ ] `waldur_offering_uuid` populated
- [ ] Offering visible in Waldur marketplace
- [ ] Plans synced to Waldur

**Verification:**
```bash
# Check Waldur offering
curl -s -H "Authorization: Token $WALDUR_TOKEN" \
  "$WALDUR_URL/api/marketplace-offerings/<offering-uuid>/" | jq
```

---

#### 3.4 Agent Activation (LISTED → ACTIVE)

**Steps:**
1. [ ] Call activate endpoint: `POST /api/v1/agents/<id>/activate/`
2. [ ] Verify state change

**Expected Results:**
- [ ] `state = "ACTIVE"`
- [ ] Agent orderable in Waldur

---

#### 3.5 Agent Pause/Resume (ACTIVE ↔ PAUSED)

**Steps:**
1. [ ] Pause: `POST /api/v1/agents/<id>/pause/`
2. [ ] Verify `state = "PAUSED"`
3. [ ] Verify existing keys still work (grace period)
4. [ ] Resume: `POST /api/v1/agents/<id>/resume/` (or activate)
5. [ ] Verify `state = "ACTIVE"`

---

#### 3.6 Agent Retirement (→ RETIRED)

**Steps:**
1. [ ] Retire: `POST /api/v1/agents/<id>/retire/`
2. [ ] Verify `state = "RETIRED"`
3. [ ] Verify not visible in marketplace

---

### 4. Subscription Flow Tests

#### 4.1 Order Creation (Waldur → Agent Registry)

**Steps:**
1. [ ] Customer orders agent in Waldur marketplace
2. [ ] Verify Waldur sends order webhook
3. [ ] Check AgentAccess created

**Expected Results:**
- [ ] AgentAccess exists
- [ ] `key_prefix` starts with `ar_`
- [ ] `quota_limit` matches plan
- [ ] `waldur_order_uuid` populated

---

#### 4.2 API Key Generation

**Steps:**
1. [ ] Verify API key returned in webhook response (or available in Waldur)
2. [ ] Test key format: `ar_<base64>`

**Expected Results:**
- [ ] Key format valid
- [ ] Key works for authentication

---

#### 4.3 Subscription Cancellation

**Steps:**
1. [ ] Cancel order in Waldur
2. [ ] Verify revocation webhook received
3. [ ] Check AgentAccess revoked

**Expected Results:**
- [ ] `is_active = False`
- [ ] `revoked_at` set
- [ ] Key no longer works

---

### 5. API Execution Tests

#### 5.1 Successful Prediction Call

**Steps:**
1. [ ] Make prediction request:
   ```bash
   curl -X POST "$REGISTRY_URL/agents/<agent-id>/predict" \
     -H "X-API-Key: ar_<your-key>" \
     -H "Content-Type: application/json" \
     -d '{"input": "Hello, test message"}'
   ```
2. [ ] Verify 200 response
3. [ ] Check UsageRecord created

**Expected Results:**
- [ ] Response contains agent output
- [ ] `response_status = 200`
- [ ] `quota_used` incremented

---

#### 5.2 Quota Enforcement

**Steps:**
1. [ ] Set low quota limit (e.g., 5)
2. [ ] Make 6 requests
3. [ ] Verify 6th request returns 429

**Expected Results:**
- [ ] First 5 requests succeed
- [ ] 6th request: `429 Too Many Requests`
- [ ] Error message includes quota info

---

#### 5.3 Rate Limiting

**Steps:**
1. [ ] Set rate limit to 2/second
2. [ ] Send 5 requests rapidly
3. [ ] Verify rate limiting kicks in

**Expected Results:**
- [ ] Some requests return 429
- [ ] Rate limit header in response

---

#### 5.4 Invalid API Key

**Steps:**
1. [ ] Send request with invalid key
2. [ ] Verify 401 response

**Expected Results:**
- [ ] `401 Unauthorized`
- [ ] Clear error message

---

#### 5.5 Revoked API Key

**Steps:**
1. [ ] Revoke a key via admin
2. [ ] Try to use revoked key
3. [ ] Verify rejection

**Expected Results:**
- [ ] `401 Unauthorized`
- [ ] Key revocation logged

---

### 6. Usage & Billing Tests

#### 6.1 Usage Record Creation

**Steps:**
1. [ ] Make 10 API calls
2. [ ] Query usage records:
   ```bash
   curl -s -H "Authorization: Token $ADMIN_TOKEN" \
     "$REGISTRY_URL/api/v1/usage/?access=<access-id>" | jq
   ```
3. [ ] Verify 10 records exist

**Expected Results:**
- [ ] 10 UsageRecords created
- [ ] Each has correct timestamps, tokens, status

---

#### 6.2 Daily Aggregation

**Steps:**
1. [ ] Trigger daily aggregation task:
   ```bash
   kubectl exec -it deploy/agent-registry-worker -n agent-registry -- \
     python manage.py run_daily_aggregation
   ```
2. [ ] Check DailyUsageSummary created

**Expected Results:**
- [ ] Summary exists for today
- [ ] Totals match individual records
- [ ] Success/failure counts correct

---

#### 6.3 Monthly Billing Snapshot

**Steps:**
1. [ ] Trigger billing snapshot:
   ```bash
   kubectl exec -it deploy/agent-registry-worker -n agent-registry -- \
     python manage.py create_billing_snapshot --cycle=2025-12
   ```
2. [ ] Check TenantQuotaSnapshot created

**Expected Results:**
- [ ] Snapshot exists
- [ ] `total_api_calls` correct
- [ ] `usage_by_agent` populated

---

#### 6.4 Waldur Billing Sync

**Steps:**
1. [ ] Trigger Waldur sync:
   ```bash
   kubectl exec -it deploy/agent-registry-worker -n agent-registry -- \
     python manage.py sync_billing_to_waldur --cycle=2025-12
   ```
2. [ ] Verify sync success

**Expected Results:**
- [ ] `synced_to_waldur = True`
- [ ] `synced_at` populated
- [ ] Usage visible in Waldur

---

### 7. Webhook Security Tests

#### 7.1 Valid Signature

**Steps:**
1. [ ] Send webhook with correct HMAC signature
2. [ ] Verify 200 response

---

#### 7.2 Invalid Signature

**Steps:**
1. [ ] Send webhook with wrong signature
2. [ ] Verify 403 response

**Expected Results:**
- [ ] `403 Forbidden`
- [ ] Security event logged

---

#### 7.3 Missing Signature

**Steps:**
1. [ ] Send webhook without signature header
2. [ ] Verify rejection

**Expected Results:**
- [ ] `403 Forbidden` or `400 Bad Request`

---

#### 7.4 Idempotent Handling

**Steps:**
1. [ ] Send same webhook twice (same event ID)
2. [ ] Verify no duplicate records

**Expected Results:**
- [ ] Only one tenant/project/access created
- [ ] Second request returns 200 (idempotent)

---

### 8. Customer Configuration Tests

#### 8.1 Widget Configuration

**Steps:**
1. [ ] Create AgentConfiguration:
   ```bash
   curl -X PATCH "$REGISTRY_URL/api/v1/agents/<id>/config/" \
     -H "X-API-Key: ar_<key>" \
     -H "Content-Type: application/json" \
     -d '{
       "widget_enabled": true,
       "widget_position": "bottom-right",
       "branding_name": "Test Bot",
       "branding_welcome_message": "Hello!"
     }'
   ```
2. [ ] Get widget embed code:
   ```bash
   curl "$REGISTRY_URL/agents/<id>/widget/" -H "X-API-Key: ar_<key>"
   ```

**Expected Results:**
- [ ] Configuration saved
- [ ] Embed code returned
- [ ] Branding reflected in code

---

#### 8.2 RAG Configuration (if implemented)

**Steps:**
1. [ ] Enable RAG with sources
2. [ ] Verify configuration persists

---

### 9. Health & Monitoring Tests

#### 9.1 Health Endpoint

**Steps:**
1. [ ] Call health endpoint:
   ```bash
   curl "$REGISTRY_URL/health/"
   ```
2. [ ] Verify all checks pass

**Expected Results:**
- [ ] `{"status": "healthy"}`
- [ ] Database check: healthy
- [ ] Cache check: healthy

---

#### 9.2 Metrics Endpoint

**Steps:**
1. [ ] Call metrics endpoint:
   ```bash
   curl "$REGISTRY_URL/metrics/"
   ```
2. [ ] Verify Prometheus format

**Expected Results:**
- [ ] Prometheus metrics returned
- [ ] Request counters present
- [ ] Custom agent metrics present

---

#### 9.3 Liveness/Readiness Probes

**Steps:**
1. [ ] Check pod status in K8s
2. [ ] Verify probes passing

---

### 10. Error Handling Tests

#### 10.1 Waldur API Timeout

**Steps:**
1. [ ] Simulate Waldur timeout (firewall/network)
2. [ ] Attempt to publish agent
3. [ ] Verify graceful failure

**Expected Results:**
- [ ] Error logged
- [ ] Agent state unchanged
- [ ] Clear error message returned

---

#### 10.2 Runtime Connection Failure

**Steps:**
1. [ ] Simulate runtime unavailable
2. [ ] Make prediction call
3. [ ] Verify error handling

**Expected Results:**
- [ ] 503 Service Unavailable
- [ ] Error logged with context

---

#### 10.3 Database Connection Loss

**Steps:**
1. [ ] Simulate DB connection loss (briefly)
2. [ ] Make API call
3. [ ] Verify recovery

**Expected Results:**
- [ ] 503 during outage
- [ ] Recovery after reconnect

---

## Post-Test Cleanup

```bash
# Cleanup test data
# 1. Delete test agents
# 2. Delete test API keys
# 3. Archive test project in Waldur
# 4. (Optional) Delete test customer
```

---

## Test Report Template

```markdown
# E2E Test Report - Agent Registry GTM

**Date:** YYYY-MM-DD
**Environment:** QA
**Tester:** <name>

## Summary

| Category | Passed | Failed | Blocked |
|----------|--------|--------|---------|
| Tenant Lifecycle | x/3 | | |
| Project Lifecycle | x/2 | | |
| Agent Lifecycle | x/6 | | |
| Subscription Flow | x/3 | | |
| API Execution | x/5 | | |
| Usage & Billing | x/4 | | |
| Webhook Security | x/4 | | |
| Customer Config | x/2 | | |
| Health & Monitoring | x/3 | | |
| Error Handling | x/3 | | |
| **TOTAL** | **X/35** | | |

## Failed Tests

1. Test X.Y: <description>
   - Expected: ...
   - Actual: ...
   - Screenshot/Log: ...

## Blocked Tests

1. Test A.B: <reason>

## Notes

- ...

## Recommendation

[ ] Ready for GTM
[ ] Requires fixes (list blockers)
```

---

## Appendix: Test Scripts

### Quick E2E Script

```bash
#!/bin/bash
# e2e_quick_test.sh
# Quick E2E validation script

set -e

REGISTRY_URL="${REGISTRY_URL:-http://localhost:8000}"
API_KEY="${API_KEY:-ar_test123}"

echo "=== Agent Registry E2E Quick Test ==="

# Health check
echo "[1/5] Health check..."
curl -sf "$REGISTRY_URL/health/" | jq .status

# List agents
echo "[2/5] List agents..."
curl -sf -H "X-API-Key: $API_KEY" "$REGISTRY_URL/api/v1/agents/" | jq '.count'

# (Add more tests)

echo "=== Quick test complete ==="
```

---

*Document created: December 2, 2025*
*Target: GTM Validation Sprint*
