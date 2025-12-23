# CMP Platform - GTM UAT & E2E Testing Guide

**Version:** 1.0
**Date:** December 16, 2025
**Status:** Ready for Execution
**GTM Readiness:** 95-98%

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Pre-UAT Checklist](#pre-uat-checklist)
3. [P1 Gap Resolution Steps](#p1-gap-resolution-steps)
4. [Seller Journey - Complete Flow](#seller-journey---complete-flow)
5. [Buyer Journey - Complete Flow](#buyer-journey---complete-flow)
6. [API Reference Quick Guide](#api-reference-quick-guide)
7. [Test Data & Credentials](#test-data--credentials)
8. [Troubleshooting Guide](#troubleshooting-guide)

---

## Executive Summary

This document provides a complete UAT (User Acceptance Testing) guide for the CMP (Cloud Marketplace Platform) GTM launch. It includes:

- Step-by-step journey maps for **Sellers** and **Buyers**
- Screen-by-screen navigation guides
- API endpoints and expected responses
- Test data requirements
- P1 gap resolution procedures

### Platform Components

| Component | URL | Purpose |
|-----------|-----|---------|
| CMP Frontend | https://app.digitlify.com | Main marketplace UI |
| Studio | https://studio.digitlify.com | Langflow agent builder |
| Runtime | https://runtime.digitlify.com | Agent execution |
| SSO | https://sso.digitlify.com | Keycloak authentication |
| Widget CDN | https://widget.digitlify.com | Embeddable chat widget |

---

## Pre-UAT Checklist

Before starting UAT, ensure all P1 gaps are resolved:

### Infrastructure Verification

```bash
# Check all services are responding
curl -sk https://app.digitlify.com/api/health/ | jq .
curl -sk https://studio.digitlify.com | head -5
curl -sk https://runtime.digitlify.com | head -5
curl -sk https://sso.digitlify.com/realms/digitlify/.well-known/openid-configuration | jq .issuer
```

### Database Verification

```bash
# SSH to backend pod and verify migrations
kubectl exec -it deploy/cmp-backend -n cmp -- python manage.py showmigrations marketplace_site_agent
```

---

## P1 Gap Resolution Steps

### Gap 1: Build Widget JS Bundle

**Effort:** 30 minutes
**Owner:** Frontend Team

```bash
# Navigate to frontend repository
cd /workspace/repo/github.com/Digitlify-Inc/cmp-frontend

# Install dependencies (if needed)
npm install

# Build widget bundle
npm run build:widget

# Verify output files exist
ls -la dist/widget/
# Expected files:
#   - loader.js
#   - widget.js
#   - widget.css
```

**Deployment:**
```bash
# Copy widget files to CDN or static hosting
# Option 1: Deploy via GitOps (recommended)
git add dist/widget/
git commit -m "build: generate widget bundle for GTM"
git push origin main

# Option 2: Manual upload to CDN
aws s3 sync dist/widget/ s3://widget.digitlify.com/ --acl public-read
```

---

### Gap 2: Configure Production Stripe Keys

**Effort:** 30 minutes
**Owner:** Infrastructure Team

**Step 1: Get Stripe Keys from Dashboard**
1. Go to https://dashboard.stripe.com
2. Navigate to Developers > API Keys
3. Copy:
   - Publishable key: `pk_live_...`
   - Secret key: `sk_live_...`

**Step 2: Configure Webhook**
1. Go to Developers > Webhooks
2. Add endpoint: `https://app.digitlify.com/api/stripe/webhook/`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy webhook secret: `whsec_...`

**Step 3: Update Kubernetes Secrets**

```bash
# Create secret YAML (do NOT commit to git)
cat > /tmp/stripe-secrets.yaml << 'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: stripe-secrets
  namespace: cmp
type: Opaque
stringData:
  STRIPE_API_KEY_SECRET: "sk_live_YOUR_SECRET_KEY"
  STRIPE_PUBLISHABLE_KEY: "pk_live_YOUR_PUBLISHABLE_KEY"
  STRIPE_WEBHOOK_SECRET: "whsec_YOUR_WEBHOOK_SECRET"
EOF

# Apply secret
kubectl apply -f /tmp/stripe-secrets.yaml

# Restart backend to pick up new secrets
kubectl rollout restart deployment/cmp-backend -n cmp

# Clean up
rm /tmp/stripe-secrets.yaml
```

---

### Gap 3: Load Demo Agents

**Effort:** 15-30 minutes
**Owner:** Content Team

```bash
# SSH to backend pod
kubectl exec -it deploy/cmp-backend -n cmp -- bash

# Load CMP categories first
python manage.py load_cmp_categories

# Load demo agents (dry run first)
python manage.py load_demo_agents --dry-run

# Load demo agents for real
python manage.py load_demo_agents

# Verify agents loaded
python manage.py shell << 'EOF'
from waldur_mastermind.marketplace_site_agent.models import AgentIdentity
from waldur_mastermind.marketplace.models import Offering
print(f"Agent Identities: {AgentIdentity.objects.count()}")
print(f"Agent Offerings: {Offering.objects.filter(type='marketplace_site_agent').count()}")
for o in Offering.objects.filter(type='marketplace_site_agent'):
    print(f"  - {o.name} ({o.state})")
EOF
```

**Expected Output:**
```
Agent Identities: 4
Agent Offerings: 4
  - Customer Support Agent (Active)
  - Document Analysis Agent (Active)
  - Code Review Assistant (Active)
  - Email Automation Agent (Active)
```

---

### Gap 4: Run E2E Tests in CI

**Effort:** 1 hour
**Owner:** QA Team

**Backend E2E Tests:**

```bash
cd /workspace/repo/github.com/Digitlify-Inc/cmp-backend

# Run all GTM E2E tests
pytest src/waldur_mastermind/marketplace_site_agent/tests/test_e2e_gtm.py -v

# Run specific test classes
pytest src/waldur_mastermind/marketplace_site_agent/tests/test_e2e_gtm.py::ProviderJourneyE2ETest -v
pytest src/waldur_mastermind/marketplace_site_agent/tests/test_e2e_gtm.py::BuyerJourneyE2ETest -v
pytest src/waldur_mastermind/marketplace_site_agent/tests/test_e2e_gtm.py::GatewayE2ETest -v
pytest src/waldur_mastermind/marketplace_site_agent/tests/test_e2e_gtm.py::StripeIntegrationE2ETest -v
```

**Frontend E2E Tests:**

```bash
cd /workspace/repo/github.com/Digitlify-Inc/cmp-frontend

# Run Cypress tests (headless)
npm run cypress:run

# Run Cypress tests (interactive)
npm run cypress:open

# Run specific test category
npx cypress run --spec "cypress/e2e/marketplace/**/*.cy.ts"
```

---

### Gap 5: Full Manual UAT

**Effort:** 4 hours
**Owner:** QA Team + Product

See detailed journey maps below.

---

## Seller Journey - Complete Flow

### Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SELLER JOURNEY MAP                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. REGISTER        2. CREATE ORG      3. BECOME         4. CREATE          │
│  ┌─────────┐        ┌─────────┐        PROVIDER          AGENT              │
│  │ Sign Up │───────▶│ Create  │───────▶┌─────────┐──────▶┌─────────┐        │
│  │ via SSO │        │ Org     │        │Register │       │ Define  │        │
│  └─────────┘        └─────────┘        │Provider │       │ Agent   │        │
│                                        └─────────┘       └────┬────┘        │
│                                                               │             │
│  8. VIEW            7. PUBLISH         6. SET            5. IMPORT          │
│  ANALYTICS          TO MARKET          PRICING           FLOW               │
│  ┌─────────┐        ┌─────────┐        ┌─────────┐       ┌─────────┐        │
│  │ Monitor │◀───────│ Publish │◀───────│ Define  │◀──────│ Import  │        │
│  │ Usage   │        │ Offering│        │ Plans   │       │ JSON    │        │
│  └─────────┘        └─────────┘        └─────────┘       └─────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Step 1: Register via SSO

**Screen:** SSO Login Page
**URL:** `https://sso.digitlify.com/realms/digitlify/protocol/openid-connect/auth`

**Actions:**
1. Navigate to https://app.digitlify.com
2. Click "Sign In" button
3. Redirected to Keycloak login
4. Options:
   - Enter existing credentials, OR
   - Click "Register" to create new account

**Test Credentials (if pre-created):**
```
Email: seller@example.com
Password: TestSeller123!
```

**Expected Result:**
- User authenticated
- Redirected to app.digitlify.com
- User profile created in Waldur

**API Call (behind the scenes):**
```
POST /api/auth-social/
Authorization: Bearer {keycloak_token}
```

---

### Step 2: Create Organization

**Screen:** Organization Creation
**URL:** `https://app.digitlify.com/organizations/`

**Navigation:**
1. Click user avatar (top right)
2. Click "My Organizations"
3. Click "Create Organization" button

**Form Fields:**

| Field | Value | Required |
|-------|-------|----------|
| Organization Name | "Acme AI Solutions" | Yes |
| Description | "AI-powered business solutions" | No |
| Contact Email | seller@example.com | Yes |
| Phone | +1-555-0123 | No |
| Country | United States | Yes |

**Screenshot Reference:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Create Organization                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Organization Name *                                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Acme AI Solutions                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Description                                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ AI-powered business solutions for enterprise customers      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Contact Email *                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ seller@example.com                                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Country *                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ United States                                           ▼   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│                              [ Cancel ]  [ Create Organization ] │
└─────────────────────────────────────────────────────────────────┘
```

**API Call:**
```http
POST /api/customers/
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Acme AI Solutions",
  "email": "seller@example.com",
  "country": "US",
  "native_name": "Acme AI Solutions",
  "abbreviation": "ACME"
}
```

**Expected Response:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Acme AI Solutions",
  "url": "/api/customers/550e8400-e29b-41d4-a716-446655440001/"
}
```

---

### Step 3: Register as Service Provider

**Screen:** Organization Settings > Marketplace
**URL:** `https://app.digitlify.com/organizations/{org_uuid}/manage/?tab=marketplace`

**Navigation:**
1. Click organization name in sidebar
2. Click "Settings" (gear icon)
3. Click "Marketplace" tab
4. Click "Register as Service Provider"

**Form Fields:**

| Field | Value | Required |
|-------|-------|----------|
| Provider Type | Agent Provider | Yes |
| Terms Accepted | ✓ | Yes |

**Screenshot Reference:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Organization Settings                                            │
├────────────────────┬────────────────────────────────────────────┤
│ General            │                                             │
│ Team               │  Marketplace Settings                       │
│ Billing            │  ─────────────────────                      │
│ ▶ Marketplace      │                                             │
│ Security           │  Service Provider Status: Not Registered    │
│                    │                                             │
│                    │  [ Register as Service Provider ]           │
│                    │                                             │
│                    │  Benefits:                                  │
│                    │  • List AI agents in marketplace            │
│                    │  • Set your own pricing                     │
│                    │  • Access analytics dashboard               │
│                    │  • Receive payments directly                │
│                    │                                             │
└────────────────────┴────────────────────────────────────────────┘
```

**API Call:**
```http
POST /api/marketplace-service-providers/
Content-Type: application/json
Authorization: Bearer {token}

{
  "customer": "/api/customers/{org_uuid}/"
}
```

**Expected Response:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440002",
  "customer_uuid": "550e8400-e29b-41d4-a716-446655440001",
  "customer_name": "Acme AI Solutions"
}
```

---

### Step 4: Create Agent (Define Agent Identity)

**Screen:** Provider Dashboard > Agents
**URL:** `https://app.digitlify.com/providers/{provider_uuid}/agents/`

**Navigation:**
1. Click "Provider Dashboard" in user menu, OR
2. Navigate to `/providers/{uuid}/`
3. Click "Agents" in sidebar
4. Click "Create Agent" button

**Form Fields:**

| Field | Value | Required |
|-------|-------|----------|
| Agent Name | "Customer Support Bot" | Yes |
| Slug | "customer-support-bot" | Yes |
| Description | "AI-powered 24/7 support" | No |
| Category | Assistants | Yes |
| Version | "1.0.0" | Yes |

**Screenshot Reference:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Create New Agent                                        [ X ]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Agent Name *                                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Customer Support Bot                                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Slug * (URL identifier)                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ customer-support-bot                                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Description                                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ AI-powered 24/7 customer support assistant that handles    ││
│  │ common queries, FAQs, and basic troubleshooting.           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Category *                                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Assistants                                              ▼   ││
│  └─────────────────────────────────────────────────────────────┘│
│  Categories: Agents | Apps | Assistants | Automations           │
│                                                                  │
│  Version *                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 1.0.0                                                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│                                   [ Cancel ]  [ Create Agent ]   │
└─────────────────────────────────────────────────────────────────┘
```

**API Call:**
```http
POST /api/provider-agents/
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Customer Support Bot",
  "slug": "customer-support-bot",
  "description": "AI-powered 24/7 customer support assistant",
  "category": "assistants",
  "version": "1.0.0",
  "customer_uuid": "{provider_org_uuid}"
}
```

**Expected Response:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440003",
  "name": "Customer Support Bot",
  "slug": "customer-support-bot",
  "status": "DRAFT",
  "offering_uuid": null
}
```

---

### Step 5: Import Flow from Studio

**Screen:** Agent Details > Import Flow
**URL:** `https://app.digitlify.com/providers/{provider_uuid}/agents/{agent_uuid}/`

**Pre-requisite:** Create flow in Studio (https://studio.digitlify.com)

**Step 5a: Create Flow in Studio**

1. Navigate to https://studio.digitlify.com
2. Login via SSO
3. Click "New Flow"
4. Build flow using drag-and-drop components:
   - Add "Chat Input" component
   - Add "OpenAI" or "Anthropic" LLM component
   - Add "Chat Output" component
   - Connect: Input → LLM → Output
5. Test flow using "Playground"
6. Click "Export" → "JSON"
7. Copy the exported JSON

**Step 5b: Import Flow to CMP**

**Navigation:**
1. Go to Agent Details page
2. Click "Import Flow" button
3. Paste JSON into text area
4. Click "Validate" to check
5. Click "Import & Deploy"

**Screenshot Reference:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Import Flow Definition                                  [ X ]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Paste Langflow Export JSON:                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ {                                                           ││
│  │   "name": "Customer Support Flow",                          ││
│  │   "data": {                                                 ││
│  │     "nodes": [                                              ││
│  │       {"id": "ChatInput-1", "type": "ChatInput"...},        ││
│  │       {"id": "OpenAI-1", "type": "OpenAI"...},              ││
│  │       {"id": "ChatOutput-1", "type": "ChatOutput"...}       ││
│  │     ],                                                      ││
│  │     "edges": [...]                                          ││
│  │   }                                                         ││
│  │ }                                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ✓ Validation Passed                                         ││
│  │   Nodes: 3 | Edges: 2                                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Flow Version                                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 1.0.0                                                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [ ] Deploy to runtime immediately                               │
│                                                                  │
│                            [ Cancel ]  [ Import & Deploy ]       │
└─────────────────────────────────────────────────────────────────┘
```

**API Call:**
```http
POST /api/provider-agents/{agent_uuid}/import_flow/
Content-Type: application/json
Authorization: Bearer {token}

{
  "flow_definition": {
    "name": "Customer Support Flow",
    "data": {
      "nodes": [...],
      "edges": [...]
    }
  },
  "flow_version": "1.0.0",
  "deploy_to_runtime": true
}
```

**Expected Response:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440003",
  "name": "Customer Support Bot",
  "flow_version": "1.0.0",
  "runtime_endpoint": "https://runtime.digitlify.com/flows/abc123",
  "status": "deployed",
  "message": "Flow imported and deployed successfully"
}
```

---

### Step 6: Set Pricing Plans

**Screen:** Agent Details > Publish > Pricing
**URL:** `https://app.digitlify.com/providers/{provider_uuid}/agents/{agent_uuid}/`

**Navigation:**
1. On Agent Details page
2. Click "Publish to Marketplace" button
3. Fill pricing wizard (Step 1 of 2)

**Form Fields - Step 1 (Pricing):**

| Field | Value | Required |
|-------|-------|----------|
| Marketplace Description | "24/7 AI support bot..." | Yes |
| Pricing Model | FIXED_MONTHLY | Yes |
| Monthly Price | $49.00 | Conditional |
| Price Per Call | - | Conditional |
| Free Tier Calls | 100 | No |

**Screenshot Reference:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Publish to Marketplace                          Step 1 of 2     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Marketplace Description *                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 24/7 AI-powered customer support assistant. Handles FAQs,  ││
│  │ basic troubleshooting, and seamless human handover.        ││
│  │ Supports 50+ languages with instant response times.        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Pricing Model *                                                 │
│  ○ FREE          - No charge                                     │
│  ● FIXED_MONTHLY - Monthly subscription                          │
│  ○ USAGE_BASED   - Pay per API call                              │
│  ○ TIERED        - Volume-based pricing                          │
│                                                                  │
│  Monthly Price (USD) *                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ $49.00                                                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Free Tier Calls (optional)                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 100                                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│                                        [ Cancel ]  [ Next → ]    │
└─────────────────────────────────────────────────────────────────┘
```

---

### Step 7: Publish to Marketplace

**Screen:** Publish Wizard > Step 2 (Confirmation)
**URL:** Same as Step 6

**Form Fields - Step 2 (Review):**

| Field | Value | Required |
|-------|-------|----------|
| Visibility | Public | Yes |
| Categories | Assistants, Customer Support | No |
| Terms Accepted | ✓ | Yes |

**Screenshot Reference:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Publish to Marketplace                          Step 2 of 2     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Review Your Agent Listing                                       │
│  ─────────────────────────────                                   │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🤖 Customer Support Bot                                   │  │
│  │  ─────────────────────────                                 │  │
│  │  24/7 AI-powered customer support assistant. Handles       │  │
│  │  FAQs, basic troubleshooting, and seamless human handover. │  │
│  │                                                            │  │
│  │  Category: Assistants                                      │  │
│  │  Price: $49.00/month                                       │  │
│  │  Free Tier: 100 calls                                      │  │
│  │  Version: 1.0.0                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Visibility                                                      │
│  ● Public (visible to all marketplace users)                     │
│  ○ Private (invitation only)                                     │
│                                                                  │
│  [✓] I agree to the Marketplace Provider Terms of Service        │
│                                                                  │
│                               [ ← Back ]  [ Publish Agent ]      │
└─────────────────────────────────────────────────────────────────┘
```

**API Call:**
```http
POST /api/provider-agents/{agent_uuid}/publish/
Content-Type: application/json
Authorization: Bearer {token}

{
  "visibility": "public",
  "categories": ["assistants"],
  "pricing_model": "FIXED_MONTHLY",
  "price_monthly": 49.00,
  "free_tier_calls": 100,
  "marketplace_description": "24/7 AI-powered customer support..."
}
```

**Expected Response:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440003",
  "status": "ACTIVE",
  "offering_uuid": "550e8400-e29b-41d4-a716-446655440010",
  "marketplace_url": "/marketplace-public-offering/550e8400-e29b-41d4-a716-446655440010/"
}
```

---

### Step 8: View Analytics

**Screen:** Provider Dashboard > Agent Analytics
**URL:** `https://app.digitlify.com/providers/{provider_uuid}/agents/{agent_uuid}/`

**Navigation:**
1. Go to Agent Details page
2. Scroll to Analytics section
3. View dashboard metrics

**Screenshot Reference:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Agent Analytics - Customer Support Bot                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ DEPLOYMENTS │ │   ACTIVE    │ │  API CALLS  │ │   REVENUE   ││
│  │     12      │ │     8       │ │   45,230    │ │   $588.00   ││
│  │ Total       │ │ Active      │ │ This Month  │ │ This Month  ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                  │
│  Usage Trend (Last 30 Days)                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │    ▄                                                        ││
│  │   ██ ▄                                                      ││
│  │  ███ █▄  ▄                                                  ││
│  │ ████ ██ ██▄ ▄▄  ▄                                           ││
│  │█████████████████████                                        ││
│  └─────────────────────────────────────────────────────────────┘│
│   Dec 1                                              Dec 16     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**API Call:**
```http
GET /api/provider-agents/{agent_uuid}/analytics/
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
  "total_deployments": 12,
  "active_deployments": 8,
  "total_api_calls": 45230,
  "total_revenue": 588.00,
  "usage_trend": [
    {"date": "2025-12-01", "calls": 1200},
    {"date": "2025-12-02", "calls": 1450},
    ...
  ]
}
```

---

## Buyer Journey - Complete Flow

### Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BUYER JOURNEY MAP                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. BROWSE          2. VIEW            3. PURCHASE        4. CONFIGURE      │
│  MARKETPLACE        DETAILS            AGENT              AGENT             │
│  ┌─────────┐        ┌─────────┐        ┌─────────┐        ┌─────────┐       │
│  │ Search  │───────▶│ Review  │───────▶│ Checkout│───────▶│Customize│       │
│  │ Agents  │        │ Pricing │        │ Payment │        │ Persona │       │
│  └─────────┘        └─────────┘        └─────────┘        └────┬────┘       │
│                                                                 │            │
│  8. USE             7. EMBED           6. GET             5. CREATE         │
│  AGENT              WIDGET             EMBED CODE         API KEY           │
│  ┌─────────┐        ┌─────────┐        ┌─────────┐        ┌─────────┐       │
│  │ Chat or │◀───────│ Add to  │◀───────│ Copy    │◀───────│Generate │       │
│  │ API Call│        │ Website │        │ Snippet │        │ Key     │       │
│  └─────────┘        └─────────┘        └─────────┘        └─────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Step 1: Browse Marketplace

**Screen:** Marketplace Landing Page
**URL:** `https://app.digitlify.com/marketplace/`

**Navigation:**
1. Go to https://app.digitlify.com
2. Click "Marketplace" in navigation
3. Browse featured agents or search

**Screenshot Reference:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 🏪 Marketplace                                    [ Sign In ]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│           Discover, Deploy, Deliver                              │
│           AI Agents for Your Business                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🔍 Search agents...                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Categories                                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Agents  │ │  Apps   │ │Assistants│ │Automations│              │
│  │   12    │ │    8    │ │   15    │ │    6    │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                  │
│  Featured Agents                                                 │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│  │ 🤖 Customer      │ │ 📄 Document      │ │ 💻 Code Review  │ │
│  │    Support Bot   │ │    Analyzer      │ │    Assistant    │ │
│  │ ────────────────│ │ ────────────────│ │ ────────────────│ │
│  │ 24/7 AI support │ │ Analyze docs... │ │ Review PRs...   │ │
│  │                  │ │                  │ │                  │ │
│  │ $49/mo          │ │ $19/mo          │ │ $79/mo          │ │
│  │ ★★★★☆ (42)      │ │ ★★★★★ (28)      │ │ ★★★★☆ (15)      │ │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**API Call (Public):**
```http
GET /api/marketplace-public-offerings/?category=assistants&state=Active
```

**Expected Response:**
```json
{
  "count": 15,
  "results": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440010",
      "name": "Customer Support Bot",
      "category": "Assistants",
      "description": "24/7 AI-powered customer support...",
      "rating": 4.2,
      "reviews_count": 42,
      "plans": [
        {
          "uuid": "...",
          "name": "Monthly",
          "unit_price": 49.00,
          "unit": "month"
        }
      ]
    }
  ]
}
```

---

### Step 2: View Agent Details

**Screen:** Public Offering Details
**URL:** `https://app.digitlify.com/marketplace-public-offering/{offering_uuid}/`

**Navigation:**
1. Click on agent card in marketplace
2. View full details page

**Screenshot Reference:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Marketplace                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────┐  Customer Support Bot                        │
│  │               │  ─────────────────────                        │
│  │      🤖       │  by Acme AI Solutions                        │
│  │               │  ★★★★☆ (42 reviews)                          │
│  └───────────────┘                                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Overview │ Pricing │ Reviews │ Documentation │ Support      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Description                                                     │
│  ───────────                                                     │
│  24/7 AI-powered customer support assistant that handles         │
│  common queries, FAQs, and basic troubleshooting. Features       │
│  intelligent routing and seamless human handover.                │
│                                                                  │
│  Features                                                        │
│  ────────                                                        │
│  ✓ Multi-language support (50+ languages)                       │
│  ✓ Instant response times (<1 second)                           │
│  ✓ Knowledge base integration                                   │
│  ✓ Human escalation workflow                                    │
│  ✓ Customizable persona                                         │
│                                                                  │
│  Pricing                               ┌────────────────────────┐│
│  ───────                               │                        ││
│                                        │  Monthly Plan          ││
│  Starting at $49/month                 │  $49.00/month          ││
│  Free tier: 100 calls                  │                        ││
│                                        │  Includes:             ││
│                                        │  • Unlimited chats     ││
│                                        │  • Email support       ││
│                                        │  • API access          ││
│                                        │                        ││
│                                        │  [ Subscribe Now ]     ││
│                                        └────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**API Call (Public):**
```http
GET /api/marketplace-public-offerings/{offering_uuid}/
```

---

### Step 3: Purchase Agent (Checkout)

**Screen:** Deploy/Order Page
**URL:** `https://app.digitlify.com/marketplace-deploy/`

**Pre-requisite:** User must be logged in

**Navigation:**
1. Click "Subscribe Now" on offering details
2. Select organization (if multiple)
3. Select project (or create new)
4. Review and confirm

**Screenshot Reference:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Subscribe to Customer Support Bot                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Select Organization                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ My Company Inc                                          ▼   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Step 2: Select Project                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Production Project                                      ▼   ││
│  └─────────────────────────────────────────────────────────────┘│
│  [ + Create New Project ]                                        │
│                                                                  │
│  Step 3: Select Plan                                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ● Monthly Plan - $49.00/month                               ││
│  │ ○ Annual Plan - $470.00/year (save 20%)                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Order Summary                        ┌────────────────────────┐│
│  ─────────────                        │ Customer Support Bot   ││
│                                       │ Monthly Plan           ││
│                                       │ ───────────────────    ││
│                                       │ Subtotal:    $49.00    ││
│                                       │ Tax:          $0.00    ││
│                                       │ ───────────────────    ││
│                                       │ Total:       $49.00    ││
│                                       │             /month     ││
│                                       └────────────────────────┘│
│                                                                  │
│  [✓] I agree to the Terms of Service                            │
│                                                                  │
│                                        [ Proceed to Payment ]    │
└─────────────────────────────────────────────────────────────────┘
```

**API Call (Create Order):**
```http
POST /api/marketplace-orders/
Content-Type: application/json
Authorization: Bearer {token}

{
  "offering": "/api/marketplace-offerings/{offering_uuid}/",
  "project": "/api/projects/{project_uuid}/",
  "plan": "/api/marketplace-plans/{plan_uuid}/",
  "attributes": {}
}
```

**Stripe Checkout (if payment required):**
```http
POST /api/stripe/checkout/
Content-Type: application/json
Authorization: Bearer {token}

{
  "order_uuid": "{order_uuid}",
  "success_url": "https://app.digitlify.com/checkout/success",
  "cancel_url": "https://app.digitlify.com/checkout/cancel"
}
```

**Expected Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "session_id": "cs_test_..."
}
```

---

### Step 4: Configure Agent

**Screen:** Customer Agent Configuration
**URL:** `https://app.digitlify.com/organizations/{org_uuid}/agents/{config_uuid}/configure/`

**Navigation:**
1. After successful payment, redirected to "My Agents"
2. Click "Configure" button on agent row
3. Fill configuration form

**Screenshot Reference:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Configure Agent - Customer Support Bot                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Persona │ Branding │ Widget │ Advanced                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  PERSONA SETTINGS                                                │
│  ────────────────                                                │
│                                                                  │
│  Agent Name                                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Support Assistant                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│  How users will see the agent's name                             │
│                                                                  │
│  Greeting Message                                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Hi! I'm your Support Assistant. How can I help you today?  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  System Prompt Override (optional)                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ You are a helpful support assistant for Acme Corp. Be      ││
│  │ friendly, professional, and always offer to escalate to    ││
│  │ a human agent if needed.                                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Tone                                                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Professional                                            ▼   ││
│  └─────────────────────────────────────────────────────────────┘│
│  Options: Professional | Friendly | Casual                       │
│                                                                  │
│                                        [ Cancel ]  [ Save ]      │
└─────────────────────────────────────────────────────────────────┘
```

**API Call:**
```http
PATCH /api/customer-agent-configs/{config_uuid}/
Content-Type: application/json
Authorization: Bearer {token}

{
  "agent_name": "Support Assistant",
  "greeting_message": "Hi! I'm your Support Assistant. How can I help you today?",
  "system_prompt_override": "You are a helpful support assistant...",
  "tone": "professional",
  "primary_color": "#4A90D9",
  "widget_position": "bottom-right",
  "widget_theme": "light"
}
```

**Expected Response:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440020",
  "agent_name": "Support Assistant",
  "greeting_message": "Hi! I'm your Support Assistant...",
  "tone": "professional",
  "primary_color": "#4A90D9",
  "widget_position": "bottom-right",
  "widget_theme": "light"
}
```

---

### Step 5: Create API Key

**Screen:** Agent API Keys
**URL:** `https://app.digitlify.com/organizations/{org_uuid}/agents/{config_uuid}/keys/`

**Navigation:**
1. On agent configuration page
2. Click "API Keys" tab (or navigate via sidebar)
3. Click "Create New Key"

**Screenshot Reference:**
```
┌─────────────────────────────────────────────────────────────────┐
│ API Keys - Support Assistant                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Create New API Key                                              │
│  ──────────────────                                              │
│                                                                  │
│  Key Name                                                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Production Website                                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                  [ Create Key ]  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ⚠️ New API Key Created                                      ││
│  │                                                              ││
│  │ Copy this key now - it won't be shown again!                ││
│  │                                                              ││
│  │ ar_sk_live_xB2kQp9mWrZ3nJvL8QwYtR                          ││
│  │                                              [ 📋 Copy ]    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  Existing Keys                                                   │
│  ─────────────                                                   │
│  ┌────────────────┬────────────┬──────────────┬────────────────┐│
│  │ Name           │ Created    │ Last Used    │ Actions        ││
│  ├────────────────┼────────────┼──────────────┼────────────────┤│
│  │ Production     │ Dec 10     │ Dec 16       │ [ Revoke ]     ││
│  │ ar_sk_live_xB2...│ 2025     │ 14:32        │                ││
│  ├────────────────┼────────────┼──────────────┼────────────────┤│
│  │ Development    │ Dec 5      │ Dec 15       │ [ Revoke ]     ││
│  │ ar_sk_live_yC3...│ 2025     │ 09:15        │                ││
│  └────────────────┴────────────┴──────────────┴────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**API Call (Create Key):**
```http
POST /api/customer-agent-configs/{config_uuid}/api_keys/
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Production Website"
}
```

**Expected Response:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440030",
  "name": "Production Website",
  "key": "ar_sk_live_xB2kQp9mWrZ3nJvL8QwYtR",
  "key_prefix": "ar_sk_live_xB",
  "created": "2025-12-16T10:30:00Z"
}
```

**IMPORTANT:** The full `key` is only returned once at creation time!

---

### Step 6: Get Widget Embed Code

**Screen:** Agent Widget
**URL:** `https://app.digitlify.com/organizations/{org_uuid}/agents/{config_uuid}/widgets/`

**Navigation:**
1. On agent configuration page
2. Click "Widget" tab

**Screenshot Reference:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Widget Embed - Support Assistant                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Widget Embed Code                                               │
│  ─────────────────                                               │
│                                                                  │
│  Copy and paste this code into your website's HTML:              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ <!-- CMP Agent Widget -->                                   ││
│  │ <script src="https://widget.digitlify.com/loader.js">       ││
│  │ </script>                                                   ││
│  │ <script>                                                    ││
│  │   WaldurWidget.init({                                       ││
│  │     widget_id: "550e8400-e29b-41d4-a716-446655440020",     ││
│  │     api_key: "YOUR_API_KEY_HERE",                          ││
│  │     theme: "light",                                         ││
│  │     position: "bottom-right"                                ││
│  │   });                                                       ││
│  │ </script>                                                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                        [ 📋 Copy ]│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ℹ️ Widget ID: 550e8400-e29b-41d4-a716-446655440020         ││
│  │                                                              ││
│  │ Replace YOUR_API_KEY_HERE with an active API key from the   ││
│  │ API Keys tab.                                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Current Configuration                                           │
│  ─────────────────────                                           │
│  ┌────────────────────────┬────────────────────────────────────┐│
│  │ Agent Name             │ Support Assistant                  ││
│  │ Position               │ bottom-right                       ││
│  │ Theme                  │ light                              ││
│  │ Primary Color          │ #4A90D9                            ││
│  │ Greeting               │ Hi! I'm your Support Assistant...  ││
│  │ Custom Prompt          │ Yes                                ││
│  └────────────────────────┴────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**API Call:**
```http
GET /api/customer-agent-configs/{config_uuid}/widget_embed/
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
  "widget_id": "550e8400-e29b-41d4-a716-446655440020",
  "embed_code": "<script src=\"https://widget.digitlify.com/loader.js\"></script>\n<script>\n  WaldurWidget.init({\n    widget_id: \"550e8400-e29b-41d4-a716-446655440020\",\n    api_key: \"YOUR_API_KEY_HERE\",\n    theme: \"light\",\n    position: \"bottom-right\"\n  });\n</script>",
  "loader_url": "https://widget.digitlify.com/loader.js"
}
```

---

### Step 7: Embed Widget on Website

**Screen:** Customer's Website (External)
**URL:** Customer's own website

**Actions:**
1. Open your website's HTML file
2. Paste embed code before `</body>` tag
3. Replace `YOUR_API_KEY_HERE` with actual key
4. Deploy website changes

**Example Integration:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>My Company</title>
</head>
<body>
  <h1>Welcome to My Company</h1>

  <!-- Your website content -->

  <!-- CMP Agent Widget - Add before </body> -->
  <script src="https://widget.digitlify.com/loader.js"></script>
  <script>
    WaldurWidget.init({
      widget_id: "550e8400-e29b-41d4-a716-446655440020",
      api_key: "ar_sk_live_xB2kQp9mWrZ3nJvL8QwYtR",
      theme: "light",
      position: "bottom-right"
    });
  </script>
</body>
</html>
```

---

### Step 8: Use Agent (Chat or API)

**Option A: Widget Chat**

After embedding, visitors see chat widget in corner:

```
┌─────────────────────────────────────────────────────────────────┐
│                     My Company Website                           │
│                                                                  │
│  Welcome to My Company!                                          │
│  ...                                                             │
│                                                                  │
│                                          ┌───────────────────┐   │
│                                          │ 💬 Support        │   │
│                                          │ Assistant         │   │
│                                          │                   │   │
│                                          │ Hi! I'm your      │   │
│                                          │ Support Assistant.│   │
│                                          │ How can I help?   │   │
│                                          │                   │   │
│                                          │ ┌───────────────┐ │   │
│                                          │ │ Type message..│ │   │
│                                          │ └───────────────┘ │   │
│                                          └───────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Option B: Direct API Call**

```bash
curl -X POST https://app.digitlify.com/api/agent-gateway/invoke/ \
  -H "Authorization: Bearer ar_sk_live_xB2kQp9mWrZ3nJvL8QwYtR" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "What are your business hours?",
    "session_id": "user-session-123"
  }'
```

**Expected Response:**
```json
{
  "output": "Our business hours are Monday through Friday, 9 AM to 6 PM EST. However, I'm available 24/7 to help you with any questions! Is there anything specific I can assist you with?",
  "session_id": "user-session-123",
  "request_id": "req_abc123",
  "usage": {
    "input_tokens": 12,
    "output_tokens": 45,
    "elapsed_ms": 850
  }
}
```

---

## API Reference Quick Guide

### Authentication

All API calls require authentication via Bearer token:

```
Authorization: Bearer {token}
```

For API Gateway calls, use API key:
```
Authorization: Bearer {api_key}
# OR
X-API-Key: {api_key}
```

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/customers/` | POST | Create organization |
| `/api/marketplace-service-providers/` | POST | Register as provider |
| `/api/provider-agents/` | POST | Create agent |
| `/api/provider-agents/{uuid}/import_flow/` | POST | Import flow |
| `/api/provider-agents/{uuid}/publish/` | POST | Publish agent |
| `/api/marketplace-public-offerings/` | GET | Browse marketplace |
| `/api/marketplace-orders/` | POST | Create order |
| `/api/customer-agent-configs/{uuid}/` | PATCH | Configure agent |
| `/api/customer-agent-configs/{uuid}/api_keys/` | POST | Create API key |
| `/api/agent-gateway/invoke/` | POST | Invoke agent |

---

## Test Data & Credentials

### Demo Users

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Seller | seller@example.com | TestSeller123! | Seller journey testing |
| Buyer | buyer@example.com | TestBuyer123! | Buyer journey testing |
| Admin | admin@example.com | TestAdmin123! | Admin access |

### Demo Organizations

| Name | Type | UUID |
|------|------|------|
| Acme AI Solutions | Provider | (auto-generated) |
| My Company Inc | Customer | (auto-generated) |

### Demo Agents (After load_demo_agents)

| Name | Category | Price |
|------|----------|-------|
| Customer Support Agent | Assistants | $29/mo |
| Document Analysis Agent | Agents | $19/mo |
| Code Review Assistant | Assistants | $49/mo |
| Email Automation Agent | Automations | $9/mo |

### Test Credit Cards (Stripe Test Mode)

| Type | Number | CVV | Expiry |
|------|--------|-----|--------|
| Success | 4242 4242 4242 4242 | Any | Any future |
| Decline | 4000 0000 0000 0002 | Any | Any future |
| Auth Required | 4000 0025 0000 3155 | Any | Any future |

---

## Troubleshooting Guide

### Common Issues

**Issue: SSO Login Fails**
```
Solution:
1. Check Keycloak client configuration
2. Verify redirect URIs match exactly
3. Check CORS settings
```

**Issue: Agent Not Appearing in Marketplace**
```
Solution:
1. Verify offering state is "Active" (not Draft)
2. Check category assignment
3. Run: GET /api/marketplace-offerings/{uuid}/ to verify state
```

**Issue: Widget Not Loading**
```
Solution:
1. Check browser console for errors
2. Verify widget files deployed to CDN
3. Check API key is valid
4. Verify domain is in allowed_domains list
```

**Issue: API Key Invalid**
```
Solution:
1. Verify key format: ar_sk_live_{24chars}
2. Check key is not revoked (is_active=True)
3. Verify key belongs to correct config
```

**Issue: Flow Import Fails**
```
Solution:
1. Validate JSON format
2. Check for required 'nodes' array
3. Ensure each node has 'id' field
4. Try Langflow re-export
```

### Support Contacts

| Issue Type | Contact |
|------------|---------|
| Technical | support@digitlify.com |
| Billing | billing@digitlify.com |
| Security | security@digitlify.com |

---

## Appendix: E2E Test Checklist

### Seller Journey Tests

- [ ] **TC-S01**: Register new user via SSO
- [ ] **TC-S02**: Create organization
- [ ] **TC-S03**: Register as service provider
- [ ] **TC-S04**: Create agent (name, slug, category)
- [ ] **TC-S05**: Export flow from Studio
- [ ] **TC-S06**: Import flow to CMP
- [ ] **TC-S07**: Set pricing plans
- [ ] **TC-S08**: Publish to marketplace
- [ ] **TC-S09**: Verify agent visible in marketplace
- [ ] **TC-S10**: View analytics dashboard

### Buyer Journey Tests

- [ ] **TC-B01**: Browse marketplace (anonymous)
- [ ] **TC-B02**: View agent details
- [ ] **TC-B03**: Register/login as buyer
- [ ] **TC-B04**: Create organization
- [ ] **TC-B05**: Purchase agent (Stripe checkout)
- [ ] **TC-B06**: Verify agent in "My Agents"
- [ ] **TC-B07**: Configure agent persona
- [ ] **TC-B08**: Create API key
- [ ] **TC-B09**: Get widget embed code
- [ ] **TC-B10**: Invoke agent via API
- [ ] **TC-B11**: Embed widget on test page
- [ ] **TC-B12**: Chat via widget

### Integration Tests

- [ ] **TC-I01**: SSO token exchange
- [ ] **TC-I02**: Stripe webhook processing
- [ ] **TC-I03**: Usage tracking (invoke → usage record)
- [ ] **TC-I04**: Rate limiting (exceed limit)
- [ ] **TC-I05**: Multi-tenant isolation

---

**Document Version:** 1.0
**Last Updated:** December 16, 2025
**Author:** Platform Team
