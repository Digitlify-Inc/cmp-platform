# E2E Test Script - Order Flow Validation

**Date:** December 11, 2024
**Purpose:** Validate the complete order flow from Waldur marketplace to Agent Config Portal

## Prerequisites

- [ ] Waldur CMP deployed and accessible
- [ ] Agent Registry deployed and accessible
- [ ] Agent Config Portal deployed and accessible
- [ ] Waldur webhooks configured (see WALDUR-WEBHOOK-SETUP.md)
- [ ] Test agent published to Waldur marketplace
- [ ] Test user account in Keycloak

## Test Environment URLs

| Component | Dev | QA | Production |
|-----------|-----|----|----|
| Waldur CMP | https://app.dev.gsv.dev | https://app.qa.digitlify.com | https://app.digitlify.com |
| Agent Registry | https://agent-registry.dev.gsv.dev | https://agent-registry.qa.digitlify.com | https://agent-registry.digitlify.com |
| Agent Config Portal | https://portal.dev.gsv.dev | https://portal.qa.digitlify.com | https://portal.digitlify.com |
| Studio | https://studio.dev.gsv.dev | https://studio.qa.digitlify.com | https://studio.digitlify.com |
| Keycloak SSO | https://sso.dev.gsv.dev | https://sso.qa.digitlify.com | https://sso.digitlify.com |

## Test Cases

### TC-000: Studio to Registry Flow (Provider Journey)

**Objective:** Verify provider can publish agent from Studio to Registry and have it appear in marketplace.

#### Prerequisites
- Provider account created in Keycloak with `provider` role
- Provider organization created in Waldur as Service Provider
- Studio instance accessible
- Studio API key configured in Agent Registry

#### Steps

1. **Login to Studio**
   ```
   URL: https://studio.{env}.gsv.dev
   User: test-provider@example.com
   Expected: Redirected to Keycloak, then to Studio dashboard
   ```

2. **Create or Import Flow**
   ```
   Navigate: Flows → New Flow
   Add Components:
     - LLM (e.g., OpenAI GPT-4)
     - Prompt Template
     - Chat Memory
   Connect components
   Test flow with sample input
   Expected: Flow executes successfully
   ```

3. **Export Flow**
   ```
   Click: Export → JSON
   Save as: my-agent-flow.json
   Expected: JSON file downloaded with flow definition
   ```

4. **Publish via Studio Integration API**
   ```bash
   curl -X POST "https://agent-registry.{env}.gsv.dev/api/v1/studio/publish/" \
     -H "Content-Type: application/json" \
     -H "X-Studio-Api-Key: ${STUDIO_API_KEY}" \
     -d '{
       "provider_id": "'${PROVIDER_CUSTOMER_UUID}'",
       "flow": '"$(cat my-agent-flow.json)"',
       "version": "1.0.0",
       "category": "customer_support",
       "tags": ["support", "gpt-4"],
       "config": {
         "model": "gpt-4",
         "temperature": 0.7
       },
       "plans": [
         {
           "name": "Starter",
           "price_cents": 2900,
           "monthly_quota": 1000
         }
       ],
       "auto_deploy": true
     }'

   Expected Response:
   {
     "success": true,
     "agent_id": "flow-uuid",
     "registry_id": "uuid",
     "state": "DEPLOYED",
     "version": "1.0.0",
     "message": "Agent 'My Agent' registered successfully"
   }
   ```

5. **Check Agent Status**
   ```bash
   curl -X GET "https://agent-registry.{env}.gsv.dev/api/v1/studio/status/flow-uuid/" \
     -H "X-Studio-Api-Key: ${STUDIO_API_KEY}"

   Expected:
   {
     "found": true,
     "agent_id": "flow-uuid",
     "state": "DEPLOYED",
     "is_orderable": false
   }
   ```

6. **Publish to Marketplace** (Admin step)
   ```bash
   # Via Django Admin or API
   # Change state: DEPLOYED → LISTED → ACTIVE
   # Link to Waldur Offering
   ```

7. **Verify in Waldur Marketplace**
   ```
   Login to Waldur CMP as customer
   Navigate: Marketplace → Browse
   Search: Agent name
   Expected: Agent appears with pricing plan
   ```

8. **Create New Version**
   ```bash
   curl -X POST "https://agent-registry.{env}.gsv.dev/api/v1/studio/version/" \
     -H "Content-Type: application/json" \
     -H "X-Studio-Api-Key: ${STUDIO_API_KEY}" \
     -d '{
       "agent_id": "flow-uuid",
       "version": "1.1.0",
       "flow": '"$(cat my-updated-flow.json)"',
       "changelog": "Added support for image inputs"
     }'

   Expected:
   {
     "success": true,
     "version": "1.1.0"
   }
   ```

#### Pass Criteria
- [ ] Flow exports from Studio successfully
- [ ] Studio API accepts and registers the agent
- [ ] Agent appears in Registry with correct metadata
- [ ] Agent can be deployed and published
- [ ] Versioning works correctly
- [ ] Agent is orderable in Waldur marketplace

---

### TC-001: Complete Order Flow

**Objective:** Verify customer can order an agent and access it in the config portal.

#### Steps

1. **Login to Waldur CMP**
   ```
   URL: https://cmp.{env}.gsv.dev
   User: test-customer@example.com
   Expected: Redirected to Keycloak, then back to Waldur dashboard
   ```

2. **Browse Marketplace**
   ```
   Navigate: Marketplace → Browse
   Search: "Customer Support Agent"
   Expected: Test agent appears in search results
   ```

3. **View Agent Details**
   ```
   Click: "Customer Support Agent (Test)"
   Expected:
     - Agent description visible
     - Pricing plans visible (Free, Starter, Professional, Enterprise)
     - "Order" button enabled
   ```

4. **Order Agent**
   ```
   Select Plan: "Starter" ($29/month)
   Click: "Order"
   Fill: Project name (optional)
   Click: "Submit Order"
   Expected: Order confirmation page shown
   ```

5. **Verify Webhook Received**
   ```bash
   # Check Agent Registry logs
   kubectl logs -l app=agent-registry -n agent-registry --tail=50 | grep webhook

   Expected output:
   INFO Received Waldur webhook: marketplace_order.created
   INFO Processing order: <order-uuid>
   INFO Created AgentAccess for user: test-customer@example.com
   ```

6. **Verify AgentAccess Created**
   ```bash
   # Using Django shell or API
   curl -X GET "https://agent-registry.{env}.gsv.dev/api/v1/access/" \
     -H "Authorization: Bearer <admin-token>"

   Expected: New AgentAccess record for the user
   ```

7. **Login to Agent Config Portal**
   ```
   URL: https://portal.{env}.gsv.dev
   Expected: Redirected to Keycloak (same session), then to portal dashboard
   ```

8. **Verify Agent in Dashboard**
   ```
   Navigate: Dashboard → My Agents
   Expected: "Customer Support Agent (Test)" appears with "active" status
   ```

9. **Configure Agent**
   ```
   Click: "Configure" on the agent card
   Expected: Agent configuration page loads with:
     - Persona settings
     - Widget management
     - Training documents
     - API keys
   ```

10. **Create Widget**
    ```
    Navigate: Widgets
    Click: "Create Widget"
    Fill:
      - Name: "Test Widget"
      - Type: "Chat"
      - Domain: "localhost"
    Click: "Save"
    Expected: Widget created, embed code shown
    ```

11. **Generate API Key**
    ```
    Navigate: API Keys
    Click: "Create API Key"
    Fill:
      - Name: "Test Key"
      - Scopes: ["chat", "query"]
    Click: "Create"
    Expected: API key shown (copy immediately!)
    ```

12. **Test API Key**
    ```bash
    curl -X POST "https://agent-registry.{env}.gsv.dev/api/v1/agents/<agent-id>/chat" \
      -H "X-API-Key: <your-api-key>" \
      -H "Content-Type: application/json" \
      -d '{"message": "Hello, can you help me?"}'

    Expected: Agent response with status 200
    ```

#### Pass Criteria
- [ ] All steps complete without errors
- [ ] Agent appears in portal within 30 seconds of order
- [ ] API key works for agent API calls
- [ ] Widget embed code is valid

---

### TC-002: Portal Navigation to Waldur

**Objective:** Verify redirect links from Agent Config Portal to Waldur work correctly.

#### Steps

1. **Login to Agent Config Portal**
   ```
   URL: https://portal.{env}.gsv.dev
   ```

2. **Click Marketplace Link**
   ```
   Click: "Marketplace" in sidebar (external link icon)
   Expected: New tab opens to Waldur marketplace
   URL: https://cmp.{env}.gsv.dev/marketplace/
   ```

3. **Click Billing Link**
   ```
   Click: "Billing" in sidebar (external link icon)
   Expected: New tab opens to Waldur billing
   URL: https://cmp.{env}.gsv.dev/billing/
   ```

4. **Click Organization Link**
   ```
   Click: "Organization" in sidebar (external link icon)
   Expected: New tab opens to Waldur profile
   URL: https://cmp.{env}.gsv.dev/profile/
   ```

5. **Test Internal Marketplace Redirect**
   ```
   URL: https://portal.{env}.gsv.dev/marketplace
   Expected: Redirect page shown, auto-redirects to Waldur in 3 seconds
   ```

#### Pass Criteria
- [ ] All external links open in new tab
- [ ] URLs point to correct Waldur pages
- [ ] User remains logged in (SSO session)

---

### TC-003: Multi-Tenancy Isolation

**Objective:** Verify tenant A cannot see tenant B's agents.

#### Steps

1. **Create Two Test Users**
   ```
   User A: tenant-a@example.com (Organization: Tenant A Corp)
   User B: tenant-b@example.com (Organization: Tenant B Corp)
   ```

2. **User A Orders Agent**
   ```
   Login as User A
   Order: "Customer Support Agent"
   Verify: Agent appears in User A's portal
   ```

3. **User B Checks Portal**
   ```
   Login as User B
   Navigate: Dashboard → My Agents
   Expected: User A's agent is NOT visible
   ```

4. **User B Orders Same Agent**
   ```
   Order: Same "Customer Support Agent"
   Verify: User B now has their own instance
   ```

5. **Verify API Key Isolation**
   ```bash
   # User A's API key should NOT work for User B's agent
   curl -X POST "https://agent-registry.{env}.gsv.dev/api/v1/agents/<user-b-agent>/chat" \
     -H "X-API-Key: <user-a-key>" \
     -d '{"message": "test"}'

   Expected: 401 Unauthorized or 403 Forbidden
   ```

#### Pass Criteria
- [ ] Users can only see their own agents
- [ ] API keys are scoped to tenant
- [ ] No data leakage between tenants

---

### TC-004: Usage Reporting to Waldur

**Objective:** Verify usage is reported back to Waldur for billing.

#### Steps

1. **Generate Usage**
   ```bash
   # Make 10 API calls
   for i in {1..10}; do
     curl -X POST "https://agent-registry.{env}.gsv.dev/api/v1/agents/<agent-id>/chat" \
       -H "X-API-Key: <api-key>" \
       -d '{"message": "Test message '$i'"}'
     sleep 1
   done
   ```

2. **Check Agent Registry Usage**
   ```bash
   curl -X GET "https://agent-registry.{env}.gsv.dev/api/v1/access/<access-id>/usage" \
     -H "Authorization: Bearer <token>"

   Expected: Usage count shows 10 API calls
   ```

3. **Trigger Usage Sync** (if not automatic)
   ```bash
   # Via Celery task or management command
   kubectl exec -it deploy/agent-registry -n agent-registry -- \
     python manage.py sync_usage_to_waldur
   ```

4. **Check Waldur Usage**
   ```
   Login to Waldur CMP
   Navigate: Organization → Projects → <Project> → Resources
   Click: Agent subscription
   Expected: Usage shows API calls consumed
   ```

#### Pass Criteria
- [ ] Usage tracked in Agent Registry
- [ ] Usage synced to Waldur
- [ ] Waldur shows correct usage for billing

---

## Automated Test Script

### Option A: Python Test Runner (Recommended)

Use the comprehensive E2E test runner:

```bash
cd /workspace/repo/github.com/GSVDEV/gsv-agentregistry

# Run smoke tests (health checks + API endpoints + webhooks)
python scripts/run_e2e_tests.py --env dev --smoke

# Run all E2E tests
python scripts/run_e2e_tests.py --env dev

# Run specific test categories
python scripts/run_e2e_tests.py --env dev --category customer   # Customer journey
python scripts/run_e2e_tests.py --env dev --category provider   # Provider journey
python scripts/run_e2e_tests.py --env dev --category webhooks   # Webhook integration

# Generate HTML report
python scripts/run_e2e_tests.py --env dev --html-report

# Save results to JSON
python scripts/run_e2e_tests.py --env dev --output results.json

# For QA or Production
python scripts/run_e2e_tests.py --env qa
python scripts/run_e2e_tests.py --env production
```

### Option B: Run Pytest Directly

```bash
cd /workspace/repo/github.com/GSVDEV/gsv-agentregistry

# Set environment
export TEST_ENV=dev
export REGISTRY_URL=https://agent-registry.dev.gsv.dev
export WALDUR_URL=https://app.dev.gsv.dev

# Run all E2E tests
pytest tests/e2e/ -v

# Run specific test categories
pytest tests/e2e/ -v -m customer    # Customer journey tests
pytest tests/e2e/ -v -m provider    # Provider journey tests
pytest tests/e2e/ -v -m webhooks    # Webhook tests

# Generate HTML report
pytest tests/e2e/ -v --html=e2e_report.html
```

### Option C: Bash Script (Quick Check)

```bash
#!/bin/bash
# e2e_test.sh - Quick E2E health check

set -e

ENV=${1:-dev}
BASE_URL="https://agent-registry.${ENV}.gsv.dev"
WALDUR_URL="https://cmp.${ENV}.gsv.dev"
PORTAL_URL="https://portal.${ENV}.gsv.dev"

echo "Running E2E tests for environment: ${ENV}"

# Test 1: Health checks
echo "Testing health endpoints..."
curl -sf "${BASE_URL}/health/" > /dev/null && echo "  Agent Registry: OK" || echo "  Agent Registry: FAILED"
curl -sf "${WALDUR_URL}/api/" > /dev/null && echo "  Waldur CMP: OK" || echo "  Waldur CMP: FAILED"
curl -sf "${PORTAL_URL}" > /dev/null && echo "  Portal: OK" || echo "  Portal: FAILED"

# Test 2: API authentication
echo "Testing API authentication..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/v1/agents/" -H "X-API-Key: invalid-key")
if [ "$RESPONSE" == "401" ]; then
  echo "  Invalid key rejected: OK"
else
  echo "  Invalid key rejected: FAILED (got ${RESPONSE})"
fi

# Test 3: Webhook endpoint accessible
echo "Testing webhook endpoints..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/webhooks/waldur/order/" \
  -H "Content-Type: application/json" \
  -d '{"event_type": "test", "context": {}}')
if [ "$RESPONSE" == "400" ] || [ "$RESPONSE" == "401" ]; then
  echo "  Webhook endpoint: OK (rejects invalid requests)"
else
  echo "  Webhook endpoint: UNEXPECTED (got ${RESPONSE})"
fi

echo ""
echo "Basic E2E tests completed. Run Python test runner for full validation."
```

---

## Test Results Template

| Test Case | Date | Tester | Result | Notes |
|-----------|------|--------|--------|-------|
| TC-001 | | | PASS/FAIL | |
| TC-002 | | | PASS/FAIL | |
| TC-003 | | | PASS/FAIL | |
| TC-004 | | | PASS/FAIL | |

---

## Related Documentation

- [Waldur Webhook Setup](./WALDUR-WEBHOOK-SETUP.md)
- [GTM Checklist](../GTM-CHECKLIST-2024-12-11.md)
- [Operator Runbook](./OPERATOR-RUNBOOK.md)
