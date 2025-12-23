# E2E Test Checklist - December 16, 2025

**Purpose:** Complete checklist for E2E testing of buyer and seller journey maps
**Status:** Ready for execution

---

## Pre-Test Setup

### Environment Verification

- [ ] CMP Backend is running at `app.digitlify.com/api`
- [ ] CMP Frontend is running at `app.digitlify.com`
- [ ] Studio is running at `studio.digitlify.com`
- [ ] Runtime is running at `runtime.digitlify.com`
- [ ] SSO is running at `sso.digitlify.com`
- [ ] RAGFlow is running at `ragflow.digitlify.com`

### Test Accounts

| Role | Email | Purpose |
|------|-------|---------|
| Buyer | buyer-test@digitlify.com | Customer journey testing |
| Seller | seller-test@digitlify.com | Provider journey testing |
| Admin | admin@digitlify.com | Admin operations |

### Stripe Test Configuration

- [ ] Test mode enabled
- [ ] Publishable key configured: `pk_test_...`
- [ ] Secret key configured: `sk_test_...`
- [ ] Webhook secret configured: `whsec_...`
- [ ] Test card: `4242 4242 4242 4242`, any future date, any CVC

---

## Backend E2E Tests (Automated)

### Run All Tests

```bash
cd /workspace/repo/github.com/Digitlify-Inc/cmp-backend
source venv/bin/activate  # if using virtualenv
pytest src/waldur_mastermind/marketplace_site_agent/tests/test_e2e_gtm.py -v --tb=short
```

### Test Results

| Test Class | Tests | Pass | Fail | Status |
|------------|-------|------|------|--------|
| ProviderJourneyE2ETest | 4 | | | |
| BuyerJourneyE2ETest | 6 | | | |
| GatewayE2ETest | 4 | | | |
| StripeIntegrationE2ETest | 2 | | | |
| KeyServiceUnitTest | 3 | | | |
| **TOTAL** | **19** | | | |

### Individual Test Status

#### ProviderJourneyE2ETest
- [ ] `test_create_agent` - Create new agent
- [ ] `test_validate_flow` - Validate flow structure
- [ ] `test_import_flow` - Import Langflow JSON
- [ ] `test_publish_agent` - Publish to marketplace

#### BuyerJourneyE2ETest
- [ ] `test_list_customer_configs` - List agent configs
- [ ] `test_update_agent_config` - Update config settings
- [ ] `test_create_api_key` - Generate JWT API key
- [ ] `test_revoke_api_key` - Revoke API key
- [ ] `test_get_usage_stats` - View usage statistics
- [ ] `test_get_widget_embed_code` - Get embed code

#### GatewayE2ETest
- [ ] `test_invoke_without_api_key` - Reject without auth
- [ ] `test_invoke_with_invalid_api_key` - Reject invalid key
- [ ] `test_invoke_with_valid_api_key` - Accept valid key
- [ ] `test_invoke_with_revoked_key` - Reject revoked key

#### StripeIntegrationE2ETest
- [ ] `test_create_checkout_session` - Create Stripe session
- [ ] `test_stripe_config_endpoint` - Get Stripe config

#### KeyServiceUnitTest
- [ ] `test_generate_jwt_key` - Generate JWT with tenant context
- [ ] `test_validate_expired_key` - Reject expired keys
- [ ] `test_hash_key` - Consistent key hashing

---

## Manual E2E Tests

### 1. Buyer Journey

#### 1.1 Discovery Phase

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.1.1 | Navigate to `/marketplace/` | Marketplace landing page loads | |
| 1.1.2 | View categories | 4 categories visible (Agents, Apps, Assistants, Automations) | |
| 1.1.3 | Click on "Agents" category | Filtered list of agents shows | |
| 1.1.4 | Use search bar | Search results appear | |
| 1.1.5 | Click on an offering | Offering detail page loads | |

#### 1.2 Purchase Phase

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.2.1 | Click "Subscribe" or "Get Started" | Redirected to login (if not authenticated) | |
| 1.2.2 | Log in as buyer | Dashboard loads | |
| 1.2.3 | Select project | Project selector shows available projects | |
| 1.2.4 | Click "Proceed to Checkout" | Redirected to Stripe Checkout | |
| 1.2.5 | Enter test card `4242 4242 4242 4242` | Payment accepted | |
| 1.2.6 | Complete payment | Redirected to success page | |
| 1.2.7 | Verify order created | Order appears in "My Orders" | |

#### 1.3 Configuration Phase

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.3.1 | Navigate to "My Agents" | List of subscribed agents shows | |
| 1.3.2 | Click on subscribed agent | Agent config page loads | |
| 1.3.3 | Update agent name | Name saves successfully | |
| 1.3.4 | Set greeting message | Message saves successfully | |
| 1.3.5 | Select tone | Tone selection saves | |
| 1.3.6 | Set brand color | Color saves successfully | |
| 1.3.7 | Upload training document | Document uploads and processes | |

#### 1.4 API Key Management

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.4.1 | Navigate to "API Keys" tab | API keys section loads | |
| 1.4.2 | Click "Create New Key" | Key creation dialog opens | |
| 1.4.3 | Enter key name | Name accepted | |
| 1.4.4 | Click "Generate" | Key generated, displays `ar_sk_live_...` | |
| 1.4.5 | Copy key | Key copied to clipboard | |
| 1.4.6 | Click "Revoke" on key | Confirmation dialog shows | |
| 1.4.7 | Confirm revoke | Key status changes to revoked | |

#### 1.5 Agent Usage

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.5.1 | Use API key to invoke agent | Response received | |
| 1.5.2 | Navigate to "Usage" tab | Usage statistics load | |
| 1.5.3 | Verify API call count | Count incremented | |
| 1.5.4 | Verify token usage | Token counts displayed | |

#### 1.6 Widget Integration

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.6.1 | Navigate to "Widget" tab | Widget config page loads | |
| 1.6.2 | View embed code | Embed code displayed | |
| 1.6.3 | Copy embed code | Code copied | |
| 1.6.4 | Paste in external HTML page | Widget loads | |
| 1.6.5 | Send message in widget | Response received | |

### 2. Seller Journey

#### 2.1 Provider Setup

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 2.1.1 | Log in as seller | Dashboard loads | |
| 2.1.2 | Navigate to Provider section | Provider dashboard loads | |
| 2.1.3 | Verify organization is service provider | Provider badge visible | |

#### 2.2 Agent Creation

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 2.2.1 | Navigate to "My Agents" | Agent list loads | |
| 2.2.2 | Click "Create Agent" | Creation form opens | |
| 2.2.3 | Enter agent name | Name accepted | |
| 2.2.4 | Enter description | Description accepted | |
| 2.2.5 | Select category | Category selected | |
| 2.2.6 | Save agent | Agent created, detail page loads | |

#### 2.3 Flow Import

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 2.3.1 | Go to Studio | Studio loads | |
| 2.3.2 | Create or open flow | Flow editor loads | |
| 2.3.3 | Export flow as JSON | JSON file downloaded | |
| 2.3.4 | Return to CMP agent page | Agent detail page loads | |
| 2.3.5 | Click "Import Flow" | Import dialog opens | |
| 2.3.6 | Upload flow JSON | Flow imported successfully | |
| 2.3.7 | Verify flow version | Version displayed | |

#### 2.4 Pricing Setup

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 2.4.1 | Navigate to "Plans" tab | Pricing plans section loads | |
| 2.4.2 | Create pricing plan | Plan form opens | |
| 2.4.3 | Set price | Price saved | |
| 2.4.4 | Set usage limits | Limits saved | |
| 2.4.5 | Save plan | Plan created | |

#### 2.5 Publishing

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 2.5.1 | Click "Publish" | Confirmation dialog shows | |
| 2.5.2 | Confirm publish | Agent published, state changes to ACTIVE | |
| 2.5.3 | Browse marketplace | Agent visible in marketplace | |
| 2.5.4 | Click "Unpublish" | Agent removed from marketplace | |

#### 2.6 Monitoring

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 2.6.1 | Navigate to "Orders" | Order list loads | |
| 2.6.2 | View order details | Order details visible | |
| 2.6.3 | Navigate to "Customers" | Customer list loads | |
| 2.6.4 | View analytics | Analytics dashboard loads | |

### 3. API Tests (curl)

#### 3.1 Gateway API Tests

```bash
# Test 1: Health check
curl -X GET https://app.digitlify.com/api/agent-gateway/health/
# Expected: {"status": "healthy", "checks": {"runtime": "healthy"}}
```
- [ ] Health check returns healthy status

```bash
# Test 2: Validate API key
curl -X POST https://app.digitlify.com/api/agent-gateway/validate/ \
  -H "Authorization: Bearer ar_sk_live_<your_key>"
# Expected: {"valid": true, "tenant_id": "...", ...}
```
- [ ] Valid key returns tenant context

```bash
# Test 3: Invoke without key (should fail)
curl -X POST https://app.digitlify.com/api/agent-gateway/invoke/ \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello"}'
# Expected: {"error": "unauthorized", ...}
```
- [ ] Unauthorized request rejected

```bash
# Test 4: Invoke with valid key
curl -X POST https://app.digitlify.com/api/agent-gateway/invoke/ \
  -H "Authorization: Bearer ar_sk_live_<your_key>" \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello"}'
# Expected: {"output": "...", "session_id": "...", "usage": {...}}
```
- [ ] Valid request returns response

#### 3.2 Stripe API Tests

```bash
# Test 5: Get Stripe config
curl -X GET https://app.digitlify.com/api/stripe/config/
# Expected: {"publishable_key": "pk_test_...", "enabled": true}
```
- [ ] Stripe config returns publishable key

---

## Test Summary

### Automated Tests

| Category | Total | Passed | Failed |
|----------|-------|--------|--------|
| Provider Journey | 4 | | |
| Buyer Journey | 6 | | |
| Gateway | 4 | | |
| Stripe | 2 | | |
| Key Service | 3 | | |
| **TOTAL** | **19** | | |

### Manual Tests

| Category | Total | Passed | Failed | Blocked |
|----------|-------|--------|--------|---------|
| Buyer - Discovery | 5 | | | |
| Buyer - Purchase | 7 | | | |
| Buyer - Configuration | 7 | | | |
| Buyer - API Keys | 7 | | | |
| Buyer - Usage | 4 | | | |
| Buyer - Widget | 5 | | | |
| Seller - Setup | 3 | | | |
| Seller - Creation | 6 | | | |
| Seller - Flow Import | 7 | | | |
| Seller - Pricing | 5 | | | |
| Seller - Publishing | 4 | | | |
| Seller - Monitoring | 4 | | | |
| API Tests | 5 | | | |
| **TOTAL** | **69** | | | |

---

## Issues Found

| Issue # | Description | Severity | Component | Status |
|---------|-------------|----------|-----------|--------|
| | | | | |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Dev Lead | | | |
| Product Owner | | | |

---

*Document created: December 16, 2025*
