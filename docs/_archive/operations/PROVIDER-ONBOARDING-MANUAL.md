# Provider Onboarding - Manual Process

**Date:** December 11, 2024
**Status:** Interim Solution for Soft Launch
**Until:** Provider Portal MVP is complete

---

## Overview

Until the Provider Portal is built, agent providers (sellers) must be onboarded manually by the admin team. This document describes the step-by-step process.

## Prerequisites

- Admin access to:
  - Waldur CMP (`https://cmp.{domain}/admin/`)
  - Agent Registry (`https://agent-registry.{domain}/admin/`)
  - Keycloak (`https://sso.{domain}/admin/`)
- Provider has:
  - Completed provider application form
  - Signed terms of service
  - Provided business information

---

## Process Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROVIDER ONBOARDING FLOW (Manual)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Create User      2. Create Org       3. Create Agent    4. Publish      │
│  ┌─────────────┐    ┌─────────────┐     ┌─────────────┐    ┌─────────────┐  │
│  │  Keycloak   │───▶│   Waldur    │────▶│  Registry   │───▶│   Waldur    │  │
│  │  User +     │    │ Organization│     │   Agent     │    │  Offering   │  │
│  │  Provider   │    │ + Service   │     │  Instance   │    │  + Plans    │  │
│  │  Role       │    │  Provider   │     │             │    │             │  │
│  └─────────────┘    └─────────────┘     └─────────────┘    └─────────────┘  │
│                                                                              │
│  Time: ~10 min       Time: ~15 min       Time: ~20 min     Time: ~15 min    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Create Keycloak User (10 min)

### 1.1 Login to Keycloak Admin

1. Go to `https://sso.{domain}/admin/`
2. Select realm: `gsv` (dev) or `digitlify` (qa/prod)

### 1.2 Create User

1. Go to Users → Add User
2. Fill in details:

```yaml
Username: provider-{company-slug}  # e.g., provider-acme
Email: provider@company.com
Email Verified: ON
First Name: Provider
Last Name: Name
Enabled: ON
```

3. Click Create

### 1.3 Set Password

1. Go to Credentials tab
2. Set Password
3. Temporary: OFF (so provider doesn't have to change)

### 1.4 Assign Provider Role

1. Go to Role Mappings tab
2. Under Realm Roles, assign:
   - `provider`

### 1.5 Record User ID

```bash
# Copy the User ID from URL or details
# Format: UUID like 12345678-1234-1234-1234-123456789012
USER_UUID=<keycloak-user-id>
```

---

## Step 2: Create Waldur Organization (15 min)

### 2.1 Login to Waldur Admin

1. Go to `https://cmp.{domain}/admin/`
2. Login with admin credentials

### 2.2 Create Customer (Organization)

1. Go to Structure → Customers → Add Customer
2. Fill in details:

```yaml
Name: Provider Company Name
Abbreviation: ACME  # Short name
Native Name: (optional)
Registration Code: (business registration)
Country: US  # or appropriate
Address: Provider business address
Postal: 12345
Bank Name: (optional for billing)
Bank Account: (optional)
Contact Details: provider@company.com
Agreement Number: PROV-001  # Internal tracking
```

3. Save

### 2.3 Enable as Service Provider

1. Go to Marketplace → Service Providers → Add Service Provider
2. Fill in:

```yaml
Customer: <Select the customer just created>
Enable Notifications: ON
Description: "Provider Company - Agent Provider"
```

3. Save

### 2.4 Record Customer UUID

```bash
# From the customer detail page URL or via API
CUSTOMER_UUID=<waldur-customer-uuid>
```

---

## Step 3: Create Agent in Registry (20 min)

### 3.1 Using Studio Integration API (Recommended)

If provider has exported their flow from Studio:

```bash
# POST to Studio publish endpoint
curl -X POST https://agent-registry.{domain}/api/v1/studio/publish/ \
  -H "Content-Type: application/json" \
  -H "X-Studio-Api-Key: ${STUDIO_API_KEY}" \
  -d '{
    "provider_id": "'${CUSTOMER_UUID}'",
    "flow": {
      "id": "agent-unique-id",
      "name": "Customer Support Agent",
      "description": "AI-powered customer support",
      "data": {
        "nodes": [...],
        "edges": [...]
      }
    },
    "version": "1.0.0",
    "category": "customer_support",
    "tags": ["support", "multilingual", "24x7"],
    "config": {
      "model": "gpt-4",
      "temperature": 0.7
    },
    "max_concurrent_requests": 10,
    "timeout_seconds": 30,
    "plans": [
      {
        "name": "Starter",
        "description": "For small teams",
        "price_cents": 2900,
        "monthly_quota": 1000,
        "rate_limit_per_second": 5,
        "features": ["Basic support", "Email integration"]
      },
      {
        "name": "Pro",
        "description": "For growing businesses",
        "price_cents": 9900,
        "monthly_quota": 10000,
        "rate_limit_per_second": 20,
        "features": ["Priority support", "All integrations", "Analytics"]
      }
    ],
    "auto_deploy": true,
    "auto_publish": false
  }'
```

### 3.2 Using Django Admin

1. Go to `https://agent-registry.{domain}/admin/`
2. Login with admin credentials

#### Create Tenant

1. Go to Tenants → Agent Tenants → Add
2. Fill in:

```yaml
Waldur Customer UUID: <from Step 2.4>
Waldur Customer Name: Provider Company Name
Name: Provider Company Name
Tenancy Model: shared
Monthly API Calls Limit: 100000
Max Agents: 10
Is Active: ON
```

3. Save and record Tenant ID

#### Create Project

1. Go to Tenants → Agent Projects → Add
2. Fill in:

```yaml
Tenant: <Select tenant just created>
Waldur Project UUID: (can be same as customer UUID initially)
Name: Default Project
Description: Provider's default agent project
Is Active: ON
```

3. Save

#### Create Agent Instance

1. Go to Agents → Agent Instances → Add
2. Fill in:

```yaml
Project: <Select project>
Agent ID: provider-agent-001  # Unique ID
Name: Customer Support Agent
Description: AI-powered customer support agent
Version: 1.0.0
Category: customer_support
Tags: ["support", "ai", "multilingual"]
State: DRAFT
Langflow Flow ID: <flow-id-from-studio>
Namespace: shared-pool
Max Concurrent Requests: 10
Timeout Seconds: 30
Config: {"model": "gpt-4", "temperature": 0.7}
```

3. Save

#### Create Pricing Plans

1. Go to Agents → Agent Plans → Add
2. Create Starter plan:

```yaml
Agent: <Select agent>
Name: Starter
Description: For small teams
Price Cents: 2900
Currency: USD
Monthly Quota: 1000
Rate Limit Per Second: 5
Features: ["Basic support", "Email integration"]
Is Active: ON
Display Order: 0
```

3. Create Pro plan similarly with higher limits

---

## Step 4: Publish to Marketplace (15 min)

### 4.1 Deploy Agent

1. In Agent Registry admin, go to Agent Instance
2. Change State: `DRAFT` → `DEPLOYED`
3. Save
4. Verify runtime endpoint is populated

### 4.2 Create Waldur Offering

1. Go to Waldur Admin → Marketplace → Offerings → Add
2. Fill in:

```yaml
Name: Customer Support Agent
Description: AI-powered customer support agent by Provider Company
Full Description: <detailed markdown description>
Customer: <Provider's organization>
Category: AI Agents
State: Active
Type: Support
Shared: ON  # Makes it visible to all customers

# Components (for usage-based billing)
Components:
  - Type: api_calls
    Name: API Calls
    Measured Unit: calls
    Billing Type: Usage
    Limit Period: Monthly
```

3. Save and copy Offering UUID

### 4.3 Create Offering Plans

1. In Offering detail, go to Plans tab
2. Add Plan:

```yaml
Name: Starter
Unit Price: 29.00
Unit: month
Max Amount: 1000  # monthly quota

# Component prices
api_calls: 0.001  # per additional call over quota
```

3. Repeat for Pro plan

### 4.4 Link Registry to Waldur

1. Back in Agent Registry admin
2. Edit the Agent Instance
3. Set:

```yaml
Waldur Offering UUID: <from step 4.2>
```

4. Change State: `DEPLOYED` → `LISTED` → `ACTIVE`
5. Save

### 4.5 Verify in Marketplace

1. Go to `https://cmp.{domain}/marketplace/`
2. Search for the agent
3. Verify listing appears correctly

---

## Step 5: Notify Provider

### Email Template

```
Subject: Your Agent is Live on the Marketplace!

Dear [Provider Name],

Great news! Your agent "[Agent Name]" has been published to the GSV Marketplace.

Details:
- Agent: [Agent Name]
- Plans: Starter ($29/mo), Pro ($99/mo)
- Marketplace URL: https://cmp.{domain}/marketplace/offerings/[offering-uuid]

Next Steps:
1. Login to the CMP portal to view your listing
2. Share the marketplace link with potential customers
3. Monitor usage and revenue in your dashboard (coming soon)

Your login credentials:
- URL: https://cmp.{domain}
- Username: [username]
- Password: [sent separately or "use SSO"]

If you need to make changes to your agent, please contact support.

Best regards,
The GSV Platform Team
```

---

## Verification Checklist

After completing all steps, verify:

- [ ] Provider can login via SSO
- [ ] Provider sees their organization in Waldur
- [ ] Agent appears in marketplace
- [ ] Agent can be ordered by test customer
- [ ] Order creates access in Agent Registry
- [ ] Agent is callable via API
- [ ] Usage is tracked correctly

---

## Rollback Procedure

If something goes wrong:

### Delete Agent (Draft state only)

```bash
# Via Admin or API
DELETE /api/v1/agents/{agent-id}/
```

### Unpublish from Marketplace

1. Waldur Admin → Offering → Change State to `Paused`
2. Agent Registry → Agent → Change State to `PAUSED`

### Delete Organization (if needed)

1. Waldur Admin → Customer → Delete
2. This cascades to remove service provider association

---

## Time Tracking

| Step | Estimated | Actual |
|------|-----------|--------|
| Keycloak User | 10 min | |
| Waldur Organization | 15 min | |
| Agent Registration | 20 min | |
| Marketplace Publishing | 15 min | |
| **Total** | **60 min** | |

---

## Related Documentation

- [Studio Integration API](../gsv-platform/PROVIDER-PORTAL-DESIGN.md)
- [Waldur Webhook Setup](./WALDUR-WEBHOOK-SETUP.md)
- [Environment Variables](./ENVIRONMENT-VARIABLES.md)
