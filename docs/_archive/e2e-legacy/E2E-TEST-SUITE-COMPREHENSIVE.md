# Comprehensive E2E Test Suite

> **Purpose**: Complete E2E test coverage for all test types including UAT
> **Version**: 2.0
> **Last Updated**: 2024-12-14
> **Status**: GTM Validation Ready

---

## Test Suite Overview

This document covers all test types required for GTM validation:

| Test Type | Purpose | Environment |
|-----------|---------|-------------|
| Unit Tests | Component-level validation | Local/CI |
| Integration Tests | Service interaction validation | Dev/QA |
| E2E Tests | Complete flow validation | QA/Staging |
| UAT Tests | Business acceptance validation | Staging |
| Performance Tests | Load and stress testing | Staging |
| Security Tests | Vulnerability assessment | Staging |

---

## Test Categories by Offering Type

### Offering Types Covered

1. **Agents** (e.g., Customer Support Agent)
2. **Apps** (e.g., Lead Qualifier Bot)
3. **Assistants** (e.g., Sales Assistant)
4. **Automations** (e.g., Document Processor)
5. **MCPs** (e.g., CRM Integration MCP)

Each offering type has:
- Common test scenarios (apply to all)
- Type-specific test scenarios (unique to that type)

---

## Part 1: Seller (Provider) Journey Tests

### 1.1 Agent Creation in Studio (Langflow)

#### Test Case: SELLER-STUDIO-001 - Create Customer Support Agent Flow

**Preconditions:**
- Seller has Studio access
- Langflow Studio is running

**Steps:**
1. [ ] Login to Langflow Studio
2. [ ] Create new flow named "Customer Support Agent v1"
3. [ ] Add components:
   - Chat Input
   - OpenAI LLM (or configured LLM)
   - RAG Retriever
   - Prompt Template
   - Chat Output
4. [ ] Configure RAG retriever with Qdrant
5. [ ] Set system prompt for customer support persona
6. [ ] Test flow with sample inputs
7. [ ] Save and deploy flow

**Expected Results:**
- [ ] Flow saves successfully
- [ ] Flow ID generated: flow_xxxxxx
- [ ] Test execution returns valid responses
- [ ] Flow appears in "My Flows" list

---

#### Test Case: SELLER-STUDIO-002 - Create Lead Qualifier Bot Flow

**Steps:**
1. [ ] Create flow "Lead Qualifier Bot v1"
2. [ ] Add components:
   - Form Input (name, email, company, budget)
   - Conditional Router
   - OpenAI LLM for qualification
   - JSON Output
3. [ ] Configure qualification criteria
4. [ ] Test with sample leads
5. [ ] Save and deploy

**Expected Results:**
- [ ] Flow qualifies leads correctly (Hot/Warm/Cold)
- [ ] JSON output structured correctly
- [ ] Integration-ready format

---

#### Test Case: SELLER-STUDIO-003 - Create Document Processor Automation

**Steps:**
1. [ ] Create flow "Document Processor v1"
2. [ ] Add components:
   - File Input
   - Document Parser (PDF, DOCX, etc.)
   - OpenAI for extraction
   - Structured Output
3. [ ] Configure extraction schema
4. [ ] Test with sample documents
5. [ ] Save and deploy

**Expected Results:**
- [ ] Parses multiple document types
- [ ] Extracts structured data correctly
- [ ] Handles errors gracefully

---

### 1.2 Publishing to Marketplace

#### Test Case: SELLER-PUB-001 - Publish Agent to Marketplace

**Preconditions:**
- Agent flow created in Studio
- Seller account has provider permissions

**Steps:**
1. [ ] Navigate to Provider Portal
2. [ ] Click "Create New Offering"
3. [ ] Select type: "Agent"
4. [ ] Fill details:
   - Name: "Multimodal Customer Support Agent"
   - Description: Full description
   - Category: Customer Service
   - Langflow Flow ID: flow_xxxxxx
5. [ ] Configure pricing plans:
   - Starter: $49/mo, 1000 convos
   - Professional: $149/mo, 10000 convos
   - Business: $499/mo, 50000 convos
6. [ ] Define config_schema (what buyers can configure)
7. [ ] Add screenshots/demo video
8. [ ] Submit for review / Publish

**Expected Results:**
- [ ] Offering created in DRAFT state
- [ ] Waldur offering created
- [ ] Config schema validated
- [ ] Pricing plans synced to Stripe
- [ ] Offering visible in marketplace (after activation)

---

### 1.3 Provider Analytics

#### Test Case: SELLER-ANALYTICS-001 - View Revenue Dashboard

**Steps:**
1. [ ] Navigate to Provider Analytics
2. [ ] View MRR (Monthly Recurring Revenue)
3. [ ] View active subscriptions count
4. [ ] View usage by agent
5. [ ] Export report

**Expected Results:**
- [ ] MRR calculated from active Stripe subscriptions
- [ ] Subscription count accurate
- [ ] Usage breakdown by agent
- [ ] Export generates valid CSV/PDF

---

## Part 2: Buyer Journey Tests

### 2.1 Discovery & Browsing

#### Test Case: BUYER-BROWSE-001 - Browse Marketplace Catalog

**Preconditions:**
- Multiple offerings published (Agent, App, Automation, MCP)
- Buyer logged in

**Steps:**
1. [ ] Navigate to marketplace catalog
2. [ ] Verify category tabs visible: [All] [Agents] [Apps] [Assistants] [Automations] [MCPs]
3. [ ] Filter by "Agents"
4. [ ] Verify only agents shown
5. [ ] Filter by price range: $50-100
6. [ ] Search for "customer support"
7. [ ] Verify search results relevance

**Expected Results:**
- [ ] All categories render correctly
- [ ] Filters work independently and combined
- [ ] Search returns relevant results
- [ ] Pagination works (if >12 items)

---

#### Test Case: BUYER-BROWSE-002 - View Offering Detail Page

**Steps:**
1. [ ] Click on "Customer Support Agent" card
2. [ ] Verify detail page loads
3. [ ] Check features list
4. [ ] Check pricing plans displayed
5. [ ] Check reviews/ratings
6. [ ] Check provider info

**Expected Results:**
- [ ] All details render correctly
- [ ] Pricing plans show correct amounts
- [ ] "Subscribe" buttons work for each plan
- [ ] Configuration preview visible

---

### 2.2 Subscription & Checkout

#### Test Case: BUYER-CHECKOUT-001 - Subscribe to Agent (Stripe Checkout)

**Preconditions:**
- Buyer logged in
- Test Stripe keys configured
- Test card: 4242 4242 4242 4242

**Steps:**
1. [ ] From detail page, click "Subscribe - $149/mo" (Professional)
2. [ ] Verify redirect to Stripe Checkout
3. [ ] Verify correct amount shown ($149.00/mo)
4. [ ] Enter test card details
5. [ ] Complete checkout
6. [ ] Verify redirect to success page
7. [ ] Verify subscription created

**Expected Results:**
- [ ] Stripe Checkout session created
- [ ] Payment processed successfully
- [ ] Stripe subscription created (status: active)
- [ ] Waldur resource created
- [ ] Agent appears in buyers "My Items"
- [ ] Welcome email sent (if configured)

---

#### Test Case: BUYER-CHECKOUT-002 - Handle Payment Failure

**Steps:**
1. [ ] Attempt subscription with decline card: 4000 0000 0000 0002
2. [ ] Verify error handling
3. [ ] Verify no resource created

**Expected Results:**
- [ ] Clear error message shown
- [ ] No Stripe subscription created
- [ ] No Waldur resource created
- [ ] User can retry with different card

---

### 2.3 Agent Configuration Tests

#### Test Case: BUYER-CONFIG-001 - Configure Customer Support Agent

**Preconditions:**
- Buyer subscribed to Customer Support Agent (Professional)

**Steps:**
1. [ ] From dashboard, click "Configure" on agent
2. [ ] Verify configuration page loads
3. [ ] Verify tabs match config_schema:
   - Training (RAG)
   - Persona
   - Branding
   - API Keys
   - Widgets
4. [ ] Complete each tab (see sub-tests below)

---

#### Test Case: BUYER-CONFIG-002 - Training Tab (RAG)

**Steps:**
1. [ ] Navigate to Training tab
2. [ ] Upload PDF document (product_guide.pdf, 5MB)
3. [ ] Verify upload progress indicator
4. [ ] Verify async processing starts
5. [ ] Wait for processing complete
6. [ ] Add website URL for crawling
7. [ ] Trigger crawl
8. [ ] Verify documents appear in list

**Expected Results:**
- [ ] File uploads successfully
- [ ] Celery task triggered (process_training_document)
- [ ] Document appears in list with status
- [ ] Status updates: Uploaded -> Processing -> Ready
- [ ] Website crawled and indexed
- [ ] Error handling for failed uploads

---

#### Test Case: BUYER-CONFIG-003 - Persona Tab

**Steps:**
1. [ ] Navigate to Persona tab
2. [ ] Set Agent Name: "Acme Support Bot"
3. [ ] Set Tone: "Professional"
4. [ ] Set custom greeting: "Hello! How can I help you today?"
5. [ ] Set escalation rules
6. [ ] Save configuration

**Expected Results:**
- [ ] All fields save correctly
- [ ] Changes reflected in agent behavior
- [ ] Preview shows updated persona

---

#### Test Case: BUYER-CONFIG-004 - Branding Tab

**Steps:**
1. [ ] Navigate to Branding tab
2. [ ] Upload logo (acme_logo.png)
3. [ ] Set primary color: #1E88E5
4. [ ] Set secondary color: #FFC107
5. [ ] Set widget title: "Acme Support"
6. [ ] Save and preview

**Expected Results:**
- [ ] Logo uploads and displays
- [ ] Colors applied to widget preview
- [ ] Branding persists after page reload

---

#### Test Case: BUYER-CONFIG-005 - API Keys Tab

**Steps:**
1. [ ] Navigate to API Keys tab
2. [ ] Click "Generate New Key"
3. [ ] Enter description: "Production API Key"
4. [ ] Select permissions: Read + Write
5. [ ] Generate key
6. [ ] Copy key value (shown only once)
7. [ ] Test key with API call
8. [ ] Revoke test key

**Expected Results:**
- [ ] Key generated with prefix: ar_live_xxxxxxxx
- [ ] Key works for API calls
- [ ] Key appears in list with created date
- [ ] Revoke disables key immediately
- [ ] Revoked key returns 401

---

#### Test Case: BUYER-CONFIG-006 - Widgets Tab

**Steps:**
1. [ ] Navigate to Widgets tab
2. [ ] Generate widget embed code
3. [ ] Configure allowed domains: ["acme.com", "*.acme.com"]
4. [ ] Set position: bottom-right
5. [ ] Copy embed code
6. [ ] Test on allowed domain
7. [ ] Test on disallowed domain

**Expected Results:**
- [ ] Embed code generated correctly
- [ ] Widget loads on allowed domains
- [ ] Widget blocked on disallowed domains (CORS)
- [ ] Position setting works
- [ ] Branding applied to widget

---

## Part 3: Offering-Specific Tests

### 3.1 Customer Support Agent Tests

#### Test Case: AGENT-CS-001 - Chat Conversation Flow

**Preconditions:**
- Agent configured with training documents
- Persona set to "Professional"

**Steps:**
1. [ ] Open widget on test page
2. [ ] Send message: "What are your business hours?"
3. [ ] Verify response uses trained data
4. [ ] Send follow-up: "How do I reset my password?"
5. [ ] Verify context maintained
6. [ ] Test multilingual: "Cuales son sus horas de trabajo?"
7. [ ] Verify Spanish response

**Expected Results:**
- [ ] Responses accurate based on training
- [ ] Conversation context maintained
- [ ] Multilingual support works (50+ languages)
- [ ] Response time < 3 seconds

---

#### Test Case: AGENT-CS-002 - Voice Channel (Professional+)

**Preconditions:**
- Professional plan with voice enabled

**Steps:**
1. [ ] Enable voice in configuration
2. [ ] Test voice input (speech-to-text)
3. [ ] Verify transcription accuracy
4. [ ] Test voice output (text-to-speech)
5. [ ] Verify natural speech

**Expected Results:**
- [ ] STT accuracy > 95%
- [ ] TTS sounds natural
- [ ] Low latency < 1 second
- [ ] Voice available only on Professional+ plans

---

#### Test Case: AGENT-CS-003 - Escalation to Human

**Steps:**
1. [ ] Configure escalation rules
2. [ ] Chat until escalation triggered
3. [ ] Verify escalation notification
4. [ ] Verify handoff to human (if integrated)

**Expected Results:**
- [ ] Escalation triggers correctly
- [ ] Notification sent (email/Slack/webhook)
- [ ] Conversation history preserved

---

### 3.2 Lead Qualifier Bot Tests

#### Test Case: APP-LQ-001 - Lead Qualification Flow

**Steps:**
1. [ ] Submit lead form:
   - Name: "John Doe"
   - Email: "john@enterprise.com"
   - Company: "Enterprise Corp"
   - Budget: "$100,000+"
   - Timeline: "This quarter"
2. [ ] Verify qualification score
3. [ ] Verify lead categorization (Hot/Warm/Cold)
4. [ ] Check CRM integration (if configured)

**Expected Results:**
- [ ] Lead scored correctly based on criteria
- [ ] High budget + short timeline = Hot lead
- [ ] Lead data sent to CRM
- [ ] Notification to sales team

---

#### Test Case: APP-LQ-002 - Low Quality Lead

**Steps:**
1. [ ] Submit lead form:
   - Name: "Test User"
   - Email: "test@gmail.com"
   - Company: "N/A"
   - Budget: "Under $1,000"
   - Timeline: "Just browsing"
2. [ ] Verify low score
3. [ ] Verify different handling

**Expected Results:**
- [ ] Lead categorized as Cold
- [ ] Different follow-up sequence triggered
- [ ] No immediate sales notification

---

### 3.3 Sales Assistant Tests

#### Test Case: ASSIST-SALES-001 - Product Recommendation

**Steps:**
1. [ ] Chat: "I need a solution for customer support"
2. [ ] Verify assistant asks qualifying questions
3. [ ] Provide requirements
4. [ ] Verify product recommendation
5. [ ] Request pricing quote

**Expected Results:**
- [ ] Relevant questions asked
- [ ] Appropriate product recommended
- [ ] Pricing quote generated
- [ ] Demo booking option offered

---

### 3.4 Document Processor Tests

#### Test Case: AUTO-DOC-001 - Invoice Processing

**Steps:**
1. [ ] Upload invoice PDF
2. [ ] Verify extraction:
   - Vendor name
   - Invoice number
   - Date
   - Line items
   - Total amount
3. [ ] Verify JSON output format
4. [ ] Test batch processing (5 invoices)

**Expected Results:**
- [ ] All fields extracted correctly
- [ ] Accuracy > 95%
- [ ] Batch processing completes
- [ ] Errors flagged for manual review

---

#### Test Case: AUTO-DOC-002 - Contract Analysis

**Steps:**
1. [ ] Upload contract PDF
2. [ ] Verify extraction:
   - Parties
   - Key dates
   - Terms
   - Obligations
3. [ ] Verify risk flagging

**Expected Results:**
- [ ] Key clauses identified
- [ ] Dates extracted correctly
- [ ] Risks highlighted
- [ ] Summary generated

---

### 3.5 MCP Integration Tests

#### Test Case: MCP-CRM-001 - CRM Data Fetch

**Steps:**
1. [ ] Configure MCP with Salesforce credentials
2. [ ] Call: get_contact("john@example.com")
3. [ ] Verify contact data returned
4. [ ] Call: get_opportunities(contact_id)
5. [ ] Verify opportunities returned

**Expected Results:**
- [ ] Authentication successful
- [ ] Contact data accurate
- [ ] Opportunities listed
- [ ] Error handling for not found

---

#### Test Case: MCP-CRM-002 - CRM Data Update

**Steps:**
1. [ ] Call: update_contact(id, {phone: "123-456-7890"})
2. [ ] Verify update in Salesforce
3. [ ] Call: create_task(contact_id, "Follow up")
4. [ ] Verify task created

**Expected Results:**
- [ ] Contact updated
- [ ] Task created
- [ ] Audit log entry created

---

## Part 4: User Acceptance Testing (UAT)

### 4.1 UAT Test Plan Overview

| UAT Phase | Focus Area | Participants | Duration |
|-----------|------------|--------------|----------|
| Phase 1 | Seller Journey | Internal providers | 2 days |
| Phase 2 | Buyer Journey | Beta customers | 3 days |
| Phase 3 | Full E2E | All stakeholders | 2 days |
| Phase 4 | Go/No-Go | Leadership | 1 day |

---

### 4.2 Seller UAT Scenarios

#### UAT-SELLER-001: Complete Provider Onboarding

**Objective:** Validate a new provider can successfully create and publish an offering

**Acceptance Criteria:**
- [ ] Provider can create account and access Studio
- [ ] Provider can build a working agent flow in < 2 hours
- [ ] Provider can publish to marketplace in < 30 minutes
- [ ] Provider can view analytics within 24 hours of first sale

**Success Metrics:**
- Time to first published offering: < 3 hours
- Number of support tickets: 0-1
- Provider satisfaction score: 4+/5

---

#### UAT-SELLER-002: Revenue and Analytics Validation

**Objective:** Validate provider can accurately track revenue

**Acceptance Criteria:**
- [ ] MRR reflects actual Stripe subscriptions
- [ ] Subscription counts are accurate
- [ ] Usage data is visible and correct
- [ ] Export functionality works

---

### 4.3 Buyer UAT Scenarios

#### UAT-BUYER-001: Complete Buyer Journey - Customer Support Agent

**Objective:** Validate end-to-end buyer experience

**Persona:** Marketing Manager at mid-size company

**Acceptance Criteria:**
- [ ] Can discover and understand offering in < 5 minutes
- [ ] Can complete checkout in < 3 minutes
- [ ] Can configure agent in < 30 minutes
- [ ] Agent works on their website within 1 hour

**Success Metrics:**
- Time to working deployment: < 2 hours
- Configuration completion rate: 100%
- First-response accuracy: > 80%
- Buyer satisfaction: 4+/5

---

#### UAT-BUYER-002: Multi-Offering Dashboard Management

**Objective:** Validate buyers can manage multiple subscriptions

**Acceptance Criteria:**
- [ ] All subscriptions visible in dashboard
- [ ] Filter by type and status works
- [ ] Can access each configuration
- [ ] Can manage subscription lifecycle

---

#### UAT-BUYER-003: Widget Integration Testing

**Objective:** Validate widget works across common platforms

| Platform | Expected Behavior |
|----------|-------------------|
| WordPress | Widget loads, chat works |
| Shopify | Widget loads, chat works |
| React App | Widget loads, chat works |
| Static HTML | Widget loads, chat works |

---

### 4.4 Integration UAT Scenarios

#### UAT-INT-001: Stripe Payment Flow

**Test Cases:**
- [ ] Credit card payment success
- [ ] Declined payment handling
- [ ] Subscription upgrade (proration)
- [ ] Subscription cancellation
- [ ] Webhook processing

---

#### UAT-INT-002: Langflow Runtime Integration

**Test Cases:**
- [ ] Simple chat flow execution
- [ ] RAG flow with document retrieval
- [ ] Multi-step conditional flows
- [ ] Error handling (LLM timeout)
- [ ] Tenant isolation verification

---

#### UAT-INT-003: Waldur/CMP Integration

**Test Cases:**
- [ ] Offering sync to Waldur
- [ ] Order/Resource creation
- [ ] Usage sync to billing
- [ ] Resource lifecycle management

---

## Part 5: Performance Testing

### 5.1 Load Test Scenarios

#### PERF-001: API Throughput

**Objective:** Validate API handles expected load

**Target:** 1000 RPS for 10 minutes

**Success Criteria:**
- [ ] p50 latency < 200ms
- [ ] p95 latency < 1s
- [ ] p99 latency < 3s
- [ ] Error rate < 0.1%

---

#### PERF-002: Widget Load Time

**Objective:** Validate widget loads quickly

**Success Criteria:**
- [ ] Widget JS bundle < 200KB
- [ ] First paint < 2s
- [ ] Interactive < 3.5s
- [ ] No layout shift from widget

---

### 5.2 Stress Test Scenarios

#### PERF-003: Concurrent User Limit

**Objective:** Find system breaking point

**Stages:**
1. Ramp to 100 users (5 min)
2. Ramp to 500 users (10 min)
3. Ramp to 1000 users (10 min)
4. Stress test 2000 users (5 min)
5. Ramp down (5 min)

---

## Part 6: Security Testing

### 6.1 Authentication Tests

#### SEC-AUTH-001: API Key Security

**Test Cases:**
- [ ] Invalid API key returns 401
- [ ] Expired API key returns 401
- [ ] Revoked API key returns 401
- [ ] API key cannot access other tenants
- [ ] Rate limiting per API key works

---

#### SEC-AUTH-002: JWT Token Security

**Test Cases:**
- [ ] Invalid JWT returns 401
- [ ] Expired JWT returns 401
- [ ] JWT from different tenant rejected
- [ ] Tampered JWT rejected

---

### 6.2 Authorization Tests

#### SEC-AUTHZ-001: Tenant Isolation

**Test Cases:**
- [ ] Tenant A cannot see Tenant B agents
- [ ] Tenant A cannot see Tenant B configs
- [ ] Tenant A cannot see Tenant B usage
- [ ] Tenant A cannot access Tenant B API keys
- [ ] SQL injection cannot bypass RLS

---

### 6.3 Input Validation Tests

#### SEC-INPUT-001: XSS Prevention

**Test Cases:**
- [ ] Script tags in agent name escaped
- [ ] Script tags in config fields escaped
- [ ] Widget does not execute injected scripts

---

#### SEC-INPUT-002: SQL Injection Prevention

**Test Cases:**
- [ ] SQL in search params sanitized
- [ ] SQL in filter params sanitized
- [ ] SQL in config fields sanitized

---

## Part 7: Test Automation

### 7.1 CI/CD Integration

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      redis:
        image: redis:7

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install -r requirements-test.txt
      
      - name: Run unit tests
        run: pytest tests/unit/ -v
      
      - name: Run integration tests
        run: pytest tests/integration/ -v
      
      - name: Run E2E tests
        run: pytest tests/e2e/ -v --html=report.html
      
      - name: Upload test report
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: report.html
```

---

### 7.2 Test Data Management

```python
# tests/fixtures/test_data.py

TEST_OFFERINGS = {
    "customer_support_agent": {
        "name": "Customer Support Agent",
        "type": "agent",
        "category": "customer_service",
        "plans": [
            {"name": "Starter", "price": 4900, "quota": 1000},
            {"name": "Pro", "price": 14900, "quota": 10000},
            {"name": "Business", "price": 49900, "quota": 50000},
        ],
        "config_schema": {...}
    },
    "lead_qualifier_bot": {
        "name": "Lead Qualifier Bot",
        "type": "app",
        "category": "sales",
        "plans": [
            {"name": "Starter", "price": 2900, "quota": 500},
            {"name": "Pro", "price": 9900, "quota": 5000},
        ]
    },
    "document_processor": {
        "name": "Document Processor",
        "type": "automation",
        "category": "operations",
        "plans": [
            {"name": "Starter", "price": 9900, "quota": 100},
            {"name": "Pro", "price": 29900, "quota": 1000},
        ]
    },
    "crm_integration_mcp": {
        "name": "CRM Integration MCP",
        "type": "mcp",
        "category": "integrations",
        "plans": [
            {"name": "Standard", "price": 4900, "quota": 10000},
        ]
    }
}
```

---

## Part 8: Test Report Template

### 8.1 Test Execution Summary

```markdown
# E2E Test Report

**Date:** YYYY-MM-DD
**Environment:** QA / Staging
**Build:** v1.x.x
**Tester:** Name

## Summary

| Category | Passed | Failed | Blocked | Total |
|----------|--------|--------|---------|-------|
| Seller Journey | X | X | X | X |
| Buyer Journey | X | X | X | X |
| Agent Tests | X | X | X | X |
| App Tests | X | X | X | X |
| Automation Tests | X | X | X | X |
| MCP Tests | X | X | X | X |
| UAT Scenarios | X | X | X | X |
| Performance | X | X | X | X |
| Security | X | X | X | X |
| **TOTAL** | **X** | **X** | **X** | **X** |

## Pass Rate: XX%

## Critical Issues

| ID | Test Case | Issue | Severity | Status |
|----|-----------|-------|----------|--------|
| 1 | XXX | Description | Critical | Open |

## Recommendations

- [ ] Fix critical issues before GTM
- [ ] Address high-severity issues in v1.1
- [ ] Schedule follow-up testing

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Dev Lead | | | |
| Product Owner | | | |
```

---

## Appendix A: Test Environment Setup

### A.1 QA Environment

```yaml
# Environment URLs
waldur_url: https://waldur.qa.digitlify.com
registry_url: https://registry.qa.digitlify.com
studio_url: https://studio.qa.digitlify.com
runtime_url: https://runtime.qa.digitlify.com
widget_url: https://widget.qa.digitlify.com

# Test Credentials
test_provider:
  email: provider@test.digitlify.com
  password: <from-vault>
  
test_buyer:
  email: buyer@test.digitlify.com
  password: <from-vault>

# Stripe Test Mode
stripe_pk: pk_test_xxx
stripe_sk: sk_test_xxx
```

### A.2 Test Data Reset

```bash
#!/bin/bash
# reset_test_data.sh

# Reset test tenants
kubectl exec -it deploy/agent-registry -n agent-registry -- \
  python manage.py reset_test_data --tenant=test_tenant

# Clear test subscriptions in Stripe
stripe subscriptions list --customer=cus_test --limit=100 | \
  jq -r '.data[].id' | \
  xargs -I {} stripe subscriptions cancel {}
```

---

## Appendix B: Common Test Scenarios Matrix

| Scenario | Agent | App | Assistant | Automation | MCP |
|----------|-------|-----|-----------|------------|-----|
| Browse catalog | Y | Y | Y | Y | Y |
| View details | Y | Y | Y | Y | Y |
| Subscribe | Y | Y | Y | Y | Y |
| Configure training | Y | N | Y | N | N |
| Configure persona | Y | N | Y | N | N |
| Generate API key | Y | Y | Y | Y | Y |
| Generate widget | Y | Y | Y | N | N |
| Chat interaction | Y | Y | Y | N | N |
| Form submission | N | Y | N | N | N |
| Document processing | N | N | N | Y | N |
| External API calls | N | N | N | N | Y |
| Batch processing | N | Y | N | Y | N |

---

*Document Version: 2.0*
*Last Updated: 2024-12-14*
*Author: GTM Team*
