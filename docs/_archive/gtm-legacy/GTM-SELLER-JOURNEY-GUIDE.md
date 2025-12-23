# Seller Journey - Step-by-Step Guide

**Last Updated:** 2025-12-16  
**Platform Version:** GTM Release

---

## Overview

This guide walks through the complete seller journey from creating an agent in Studio to publishing it on the CMP Marketplace.

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  1. Studio  │───▶│  2. Export  │───▶│  3. Import  │───▶│ 4. Configure│───▶│  5. Publish │
│   (Build)   │    │   (JSON)    │    │   to CMP    │    │   Pricing   │    │ Marketplace │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Prerequisites

- Platform admin has registered your organization as a **Service Provider**
- You have **Provider** role in your organization
- Access to Agent Studio: https://studio.dev.gsv.dev
- Access to CMP Portal: https://app.dev.gsv.dev

---

## Step 1: Build Agent Flow in Studio

### 1.1 Access Agent Studio

1. Navigate to **https://studio.dev.gsv.dev**
2. Login with SSO (Keycloak)
3. You will see the Studio dashboard

### 1.2 Create New Flow

1. Click **"+ New Flow"** button (top right)
2. Enter flow name (e.g., "Customer Support Agent")
3. Click **"Create"**

### 1.3 Design Your Flow

The flow canvas opens. Add components:

**Input Component:**
- Drag **"Chat Input"** from left panel
- This receives user messages

**LLM Component:**
- Drag **"OpenAI"** or **"Anthropic"** model
- Configure:
  - Model: gpt-4, claude-3-sonnet, etc.
  - Temperature: 0.7 (adjust as needed)
  - System Prompt: Define agent behavior

**Output Component:**
- Drag **"Chat Output"**
- Connect to LLM output

**Optional Components:**
- **RAG**: Connect to knowledge base
- **Tools**: Add function calling
- **Memory**: Add conversation history

### 1.4 Connect Components

- Click and drag from output ports to input ports
- Ensure data flows: Input → Processing → Output

### 1.5 Test Your Flow

1. Click **"Playground"** button (top right)
2. Enter test message in chat
3. Verify response quality
4. Iterate on prompts/config until satisfied

---

## Step 2: Export Flow as JSON

### 2.1 Export Flow

1. In Studio, open your flow
2. Click **"..."** menu (top right)
3. Select **"Export"**
4. Or use keyboard shortcut: **Ctrl+Shift+E**

### 2.2 Copy JSON

1. A modal appears with JSON content
2. Click **"Copy to Clipboard"**
3. Save JSON locally as backup (optional)

**Example JSON Structure:**
```json
{
  "name": "Customer Support Agent",
  "description": "AI agent for customer inquiries",
  "data": {
    "nodes": [...],
    "edges": [...]
  }
}
```

---

## Step 3: Import Flow to CMP

### 3.1 Navigate to Provider Dashboard

1. Go to **https://app.dev.gsv.dev**
2. Login with SSO
3. Select your organization
4. Navigate to **Marketplace → Provider Dashboard**

### 3.2 Create New Offering

1. Click **"+ Create Offering"**
2. Fill in details:
   - **Name**: "Customer Support Agent"
   - **Category**: Select "Agents"
   - **Type**: "Site Agent" (SITE_AGENT)
   - **Organization**: Your service provider org
3. Click **"Create"**

### 3.3 Import Flow

1. In offering details, go to **"Agent"** tab
2. Click **"Import Flow"** button
3. Paste the JSON from Step 2
4. System validates the flow structure
5. If valid, you see:
   - Node count
   - Edge count
   - Flow name
6. Toggle **"Deploy to Runtime"**: ON (recommended)
7. Click **"Import"**

### 3.4 Verify Import

- Status changes to "Flow Imported"
- Runtime endpoint is generated
- Version is set to "1.0.0"

---

## Step 4: Configure Pricing

### 4.1 Navigate to Plans

1. In offering details, go to **"Plans"** tab
2. A default plan exists with "month" billing

### 4.2 Edit Plan

1. Click on the default plan
2. Configure:
   - **Name**: e.g., "Starter", "Professional", "Enterprise"
   - **Description**: What's included

### 4.3 Add Pricing Components

Click **"+ Add Component"** for each:

**Fixed Monthly Fee:**
- Type: FIXED
- Name: "Base subscription"
- Price: e.g., $29.00/month

**API Calls (Usage-Based):**
- Type: USAGE
- Name: "API Calls"
- Measured Unit: "calls"
- Price: e.g., $0.001 per call

**Token Usage:**
- Type: USAGE
- Name: "Tokens"
- Measured Unit: "1K tokens"
- Price: e.g., $0.01 per 1K tokens

**One-Time Setup (Optional):**
- Type: ONE_TIME
- Name: "Setup fee"
- Price: e.g., $99.00

### 4.4 Create Additional Plans (Optional)

1. Click **"+ Add Plan"**
2. Create tiers: Starter, Professional, Enterprise
3. Different limits/prices per tier

**Example Pricing Structure:**

| Plan | Monthly Fee | API Calls Included | Overage Rate |
|------|-------------|-------------------|--------------|
| Starter | $29 | 10,000 | $0.002/call |
| Professional | $99 | 50,000 | $0.001/call |
| Enterprise | $299 | Unlimited | N/A |

### 4.5 Save Plans

Click **"Save"** after configuring each plan.

---

## Step 5: Configure Offering Details

### 5.1 Basic Information

In **"Overview"** tab:
- **Full Description**: Detailed markdown description
- **Features**: List key capabilities
- **Use Cases**: Example applications

### 5.2 Media

In **"Media"** tab:
- **Thumbnail**: 400x300 recommended
- **Screenshots**: Show agent in action
- **Demo Video**: Optional YouTube/Vimeo link

### 5.3 Documentation

In **"Documentation"** tab:
- **Getting Started**: Quick start guide
- **API Reference**: Endpoint documentation
- **FAQ**: Common questions

---

## Step 6: Publish to Marketplace

### 6.1 Review Offering

Before publishing, verify:
- [ ] Flow is imported and deployed
- [ ] At least one plan is configured
- [ ] Description is complete
- [ ] Thumbnail is uploaded

### 6.2 Publish

1. Click **"Publish"** button (top right)
2. Select visibility:
   - **Public**: Visible to all marketplace users
   - **Private**: Only visible to specific organizations
3. Confirm publication

### 6.3 Verification

- Offering state changes: DRAFT → ACTIVE
- Appears in marketplace catalog
- Buyers can now discover and purchase

---

## Post-Publication

### Monitor Analytics

In **"Analytics"** tab:
- Total customers
- Active subscriptions
- API call volume
- Revenue metrics

### Update Flow

To update the agent flow:
1. Make changes in Studio
2. Export new JSON
3. Import as new version
4. Existing customers auto-update (or choose manual)

### Manage Customers

In **"Customers"** tab:
- View subscriber list
- See usage per customer
- Handle support requests

---

## Troubleshooting

### Flow Import Fails

**Error: "Invalid JSON structure"**
- Ensure you copied complete JSON from Studio
- Check for missing closing braces

**Error: "Missing required nodes"**
- Flow must have input and output nodes
- Add Chat Input and Chat Output components

### Runtime Deployment Fails

**Error: "Unable to deploy to runtime"**
- Check runtime service is healthy
- Verify API key configuration
- Contact platform admin

### Offering Won't Publish

**Error: "Incomplete offering"**
- Add at least one active plan
- Fill required fields (name, category)
- Upload thumbnail image

---

## API Reference

### Import Flow Endpoint

```
POST /api/provider-agents/{uuid}/import_flow/

Headers:
  Authorization: Token {api_token}
  Content-Type: application/json

Body:
{
  "flow_definition": { /* Langflow JSON */ },
  "flow_version": "1.0.0",
  "deploy_to_runtime": true
}

Response:
{
  "uuid": "agent-uuid",
  "runtime_endpoint": "https://runtime.../api/v1/flows/{flow_id}",
  "status": "deployed"
}
```

### Validate Flow Endpoint

```
POST /api/provider-agents/validate_flow/

Body:
{
  "flow_definition": { /* Langflow JSON */ }
}

Response:
{
  "valid": true,
  "node_count": 5,
  "edge_count": 4,
  "flow_name": "Customer Support Agent"
}
```

---

*Document Version: 1.0*  
*Last Updated: 2025-12-16*
