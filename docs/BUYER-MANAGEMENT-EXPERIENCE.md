# Buyer Management Experience Design

## Overview

This document describes how buyers manage and use their subscribed agents, apps, assistants, and automations through the GSV Platform marketplace.

---

## Product Types and Their Management Patterns

### 1. Agents (e.g., Customer Support Agent)
**Consumption Model:** API/Widget/MCP
**Training:** Data sources, websites, documents
**Customization:** Branding, personality, responses

### 2. Assistants (e.g., HR Onboarding Assistant)
**Consumption Model:** Chat interface, scheduled tasks
**Training:** Company policies, procedures, workflows
**Customization:** Approval flows, escalation rules

### 3. Apps (e.g., Code Review App)
**Consumption Model:** Webhooks, CI/CD integration
**Training:** Code standards, review guidelines
**Customization:** Severity rules, auto-approve criteria

### 4. Automations (e.g., Email Automation)
**Consumption Model:** Triggers, scheduled runs
**Training:** Templates, rules
**Customization:** Timing, conditions, outputs

---

## Buyer Journey: Customer Support Agent Example

### Phase 1: Purchase & Provision
```
[Browse Marketplace] -> [Select "Customer Support Agent"]
        |
        v
[Choose Plan: Basic ($19.99) or Pro ($49.99)]
        |
        v
[Checkout with Stripe] -> [Order Paid Webhook]
        |
        v
[Auto-Provision Instance] -> [Receive API Key + Widget Code]
```

### Phase 2: Configuration (Post-Purchase)

#### Step 1: Access Instance Dashboard
```
/account/instances/{instanceId}
├── Overview (status, credits, API keys)
├── Configuration (behavior settings)
├── Training (data sources)
├── Connectors (integrations)
├── Branding (widget customization)
├── API Keys (access management)
├── Usage (billing, logs)
└── Widget Builder (embed code)
```

#### Step 2: Configure Training Data Sources
```yaml
Training Sources:
  - type: website
    url: https://mycompany.com
    crawl_depth: 3
    refresh: daily

  - type: document
    files:
      - FAQ.pdf
      - Product-Manual.docx
    refresh: on_upload

  - type: api
    endpoint: https://api.mycompany.com/knowledge
    auth: bearer_token
    refresh: hourly

  - type: database
    connection: postgresql://...
    tables: [products, faqs]
    refresh: realtime
```

#### Step 3: Configure Branding
```yaml
Branding:
  name: "Acme Support"
  avatar: https://mycompany.com/logo.png
  primary_color: "#6B46C1"
  greeting: "Hi! I'm Acme's AI assistant. How can I help?"
  fallback_message: "Let me connect you with a human agent."
  position: bottom-right
```

#### Step 4: Configure Connectors
```yaml
Connectors:
  # For escalation to human agents
  - id: zendesk
    display_name: "Zendesk"
    config:
      subdomain: mycompany
      escalation_trigger: "human agent"

  # For order lookup
  - id: shopify
    display_name: "Shopify Store"
    config:
      shop: mystore.myshopify.com

  # For internal notifications
  - id: slack
    display_name: "Slack Alerts"
    config:
      channel: "#support-escalations"
```

### Phase 3: Deployment Options

#### Option A: Widget Embed
```html
<!-- Embed in website -->
<script src="https://widget.gsv.dev/v1/loader.js"></script>
<script>
  GSVWidget.init({
    instanceId: "c436b19e-2a91-46c2-a0d7-a1f6bff0face",
    apiKey: "cmp_sk_xxx...",
    theme: "auto",
    position: "bottom-right"
  });
</script>
```

#### Option B: API Integration
```bash
# Direct API call
curl -X POST https://api.gsv.dev/v1/runs \
  -H "Authorization: Bearer cmp_sk_xxx..." \
  -H "Content-Type: application/json" \
  -d '{
    "instance_id": "c436b19e-2a91-46c2-a0d7-a1f6bff0face",
    "input": {
      "query": "What are your shipping options?"
    }
  }'
```

#### Option C: MCP Server
```json
// claude_desktop_config.json
{
  "mcpServers": {
    "customer-support": {
      "command": "gsv-mcp",
      "args": ["--instance", "c436b19e-2a91-46c2-a0d7-a1f6bff0face"],
      "env": {
        "GSV_API_KEY": "cmp_sk_xxx..."
      }
    }
  }
}
```

---

## Buyer Journey: HR Assistant Example

### Phase 1: Purchase & Provision
Same as above - automatic provisioning on order paid.

### Phase 2: Configuration

#### Step 1: Connect HR Systems
```yaml
Connectors:
  - id: workday
    display_name: "Workday HRIS"
    config:
      tenant: mycompany
      sync: bidirectional

  - id: bamboohr
    display_name: "BambooHR"
    config:
      subdomain: mycompany
```

#### Step 2: Upload Training Documents
```yaml
Training:
  - type: document
    category: policies
    files:
      - Employee-Handbook.pdf
      - PTO-Policy.pdf
      - Benefits-Guide.pdf

  - type: document
    category: procedures
    files:
      - Onboarding-Checklist.pdf
      - Equipment-Request-Process.pdf
```

#### Step 3: Configure Workflows
```yaml
Workflows:
  - name: new_hire_onboarding
    trigger: workday.new_employee
    steps:
      - action: send_welcome_email
        template: welcome_email
      - action: create_checklist
        template: onboarding_checklist
      - action: schedule_orientation
        calendar: hr_calendar
      - action: notify_manager
        channel: slack

  - name: pto_request
    trigger: employee.pto_request
    steps:
      - action: check_balance
      - action: get_manager_approval
        timeout: 48h
      - action: update_calendar
      - action: notify_team
```

### Phase 3: Usage Modes

#### Chat Mode (Employee Self-Service)
```
Employee: "How many PTO days do I have left?"
Assistant: "You have 12 PTO days remaining for 2025.
           Would you like to submit a request?"
```

#### Scheduled Tasks
```yaml
Scheduled:
  - name: weekly_onboarding_report
    cron: "0 9 * * MON"
    action: generate_report
    recipients: [hr-team@company.com]

  - name: benefits_enrollment_reminder
    cron: "0 10 1 11 *"  # Nov 1st
    action: send_reminder
    filter: employees_without_elections
```

---

## Instance Management UI Components

### Dashboard Overview
```
┌──────────────────────────────────────────────────────────────┐
│ Customer Support Agent                         [Active] ●    │
│ Basic Plan • Created Dec 15, 2025                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │  597    │  │   3     │  │  1,247  │  │  98.5%  │         │
│  │ Credits │  │API Keys │  │Requests │  │ Uptime  │         │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Quick Actions                                                │
│                                                              │
│  [⚙️ Configuration]  [📚 Training]  [🔗 Connectors]          │
│  [🔑 API Keys]       [📊 Usage]     [💬 Widget Builder]      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Configuration Page
```
┌──────────────────────────────────────────────────────────────┐
│ Configuration                                    [Save] [↺]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Behavior Settings                                            │
│ ─────────────────                                            │
│ Model:           [GPT-4 ▼]                                   │
│ Temperature:     [0.7 ═══════○══]                            │
│ Max Tokens:      [2048      ]                                │
│                                                              │
│ Response Style                                               │
│ ─────────────                                                │
│ Tone:            [Professional ▼]                            │
│ Language:        [Auto-detect ▼]                             │
│ ☑ Include sources in responses                               │
│ ☑ Suggest follow-up questions                                │
│                                                              │
│ Guardrails                                                   │
│ ──────────                                                   │
│ ☑ Block competitor mentions                                  │
│ ☑ Escalate pricing questions                                 │
│ ☑ Never make up information                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Training Page
```
┌──────────────────────────────────────────────────────────────┐
│ Training Data Sources                      [+ Add Source]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ 🌐 Website: mycompany.com                              │   │
│ │    Status: ✓ Synced • 247 pages • Updated 2h ago      │   │
│ │    [Sync Now] [Settings] [Remove]                      │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ 📄 Documents: Product Documentation                    │   │
│ │    Status: ✓ Indexed • 15 files • 2.3MB               │   │
│ │    [Upload More] [View Files] [Remove]                 │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ 🔌 API: Shopify Products                               │   │
│ │    Status: ✓ Connected • 1,247 products • Live sync   │   │
│ │    [Test Connection] [Settings] [Remove]               │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Widget Builder
```
┌──────────────────────────────────────────────────────────────┐
│ Widget Builder                              [Preview] [Copy] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────────┐  ┌────────────────────────────────────┐ │
│ │ Appearance       │  │          Live Preview              │ │
│ │ ────────────────│  │  ┌─────────────────────────────┐   │ │
│ │ Name: [Acme Bot]│  │  │  ┌───┐                      │   │ │
│ │ Color: [#6B46C1]│  │  │  │ A │ Acme Support         │   │ │
│ │ Position: [BR ▼]│  │  │  └───┘                      │   │ │
│ │ Avatar: [Upload]│  │  │  Hi! How can I help you?   │   │ │
│ │                 │  │  │                             │   │ │
│ │ Behavior        │  │  │  ┌─────────────────────────┐│   │ │
│ │ ────────────────│  │  │  │ Type your message...   ││   │ │
│ │ Greeting: [...] │  │  │  └─────────────────────────┘│   │ │
│ │ Auto-open: [OFF]│  │  └─────────────────────────────┘   │ │
│ │ Sound: [ON]     │  │                                    │ │
│ └──────────────────┘  └────────────────────────────────────┘ │
│                                                              │
│ Embed Code                                                   │
│ ──────────                                                   │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ <script src="https://widget.gsv.dev/v1/loader.js">      │ │
│ │ </script>                                                │ │
│ │ <script>                                                 │ │
│ │   GSVWidget.init({                                       │ │
│ │     instanceId: "c436b19e-...",                          │ │
│ │     apiKey: "cmp_sk_..."                                 │ │
│ │   });                                                    │ │
│ │ </script>                                    [📋 Copy]   │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## API Endpoints for Buyer Management

### Instance Configuration
```
GET    /instances/{id}/                    # Get instance details
PATCH  /instances/{id}/                    # Update overrides/config
GET    /instances/{id}/entitlements/       # Get plan capabilities
```

### Training Data
```
GET    /instances/{id}/training/sources/   # List training sources
POST   /instances/{id}/training/sources/   # Add source
DELETE /instances/{id}/training/sources/{sourceId}/
POST   /instances/{id}/training/sync/      # Trigger sync
GET    /instances/{id}/training/status/    # Get sync status
```

### Connectors
```
GET    /connectors/available/              # List available connectors
GET    /instances/{id}/connectors/         # List bound connectors
POST   /instances/{id}/connectors/         # Bind connector
DELETE /instances/{id}/connectors/{bindingId}/
POST   /instances/{id}/connectors/{bindingId}/test/
```

### Widget
```
GET    /instances/{id}/widget/config/      # Get widget config
PATCH  /instances/{id}/widget/config/      # Update widget config
POST   /instances/{id}/widget/preview/     # Generate preview
```

### API Keys
```
GET    /instances/{id}/api_keys/           # List API keys
POST   /instances/{id}/api_keys/           # Create API key
DELETE /instances/{id}/api_keys/{keyId}/   # Revoke API key
```

---

## Data Models Required

### TrainingSource
```python
class TrainingSource(models.Model):
    class SourceType(models.TextChoices):
        WEBSITE = "website"
        DOCUMENT = "document"
        API = "api"
        DATABASE = "database"

    instance = ForeignKey(Instance)
    source_type = CharField(choices=SourceType.choices)
    config = JSONField()  # URL, credentials, etc.
    status = CharField()  # pending, syncing, synced, error
    last_sync = DateTimeField()
    document_count = IntegerField()
    error_message = TextField(null=True)
```

### WidgetConfig
```python
class WidgetConfig(models.Model):
    instance = OneToOneField(Instance)
    name = CharField()
    avatar_url = URLField()
    primary_color = CharField()
    greeting_message = TextField()
    fallback_message = TextField()
    position = CharField()  # bottom-right, bottom-left, etc.
    auto_open = BooleanField()
    sound_enabled = BooleanField()
```

### InstanceOverrides (already exists in Instance.overrides)
```json
{
  "model": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 2048,
  "tone": "professional",
  "language": "auto",
  "include_sources": true,
  "suggest_followups": true,
  "guardrails": {
    "block_competitors": true,
    "escalate_pricing": true,
    "hallucination_prevention": true
  }
}
```

---

## Implementation Priority

### P0 - MVP (Week 1)
1. Instance configuration (overrides) UI
2. API keys management (already exists)
3. Basic usage/billing view (already exists)

### P1 - Training & Connectors (Week 2)
1. Training sources management
2. Document upload
3. Website crawler integration
4. Connector binding UI

### P2 - Widget & Advanced (Week 3)
1. Widget builder
2. Widget embed code generator
3. MCP configuration helper
4. Advanced analytics

---

## Example Flows

### Flow 1: Configure Customer Support Agent
1. User logs in, goes to /account/instances
2. Clicks on "Customer Support Agent" instance
3. Goes to Configuration tab
4. Sets: model=GPT-4, tone=friendly, include_sources=true
5. Goes to Training tab
6. Adds website source: https://mycompany.com
7. Uploads product documentation PDFs
8. Goes to Connectors tab
9. Binds Zendesk for escalation
10. Goes to Widget Builder
11. Customizes appearance
12. Copies embed code to website

### Flow 2: Configure HR Assistant
1. User logs in, goes to /account/instances
2. Clicks on "HR Onboarding Assistant" instance
3. Goes to Connectors tab
4. Binds Workday HRIS
5. Goes to Training tab
6. Uploads employee handbook, policies
7. Goes to Configuration tab
8. Enables scheduled tasks
9. Sets up weekly report automation
