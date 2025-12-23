# GSV Platform Customer Guide

**Version:** 1.0
**Last Updated:** December 2024
**Audience:** Customers, End Users

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Browsing the Marketplace](#2-browsing-the-marketplace)
3. [Subscribing to Agents](#3-subscribing-to-agents)
4. [Configuring Your Agent](#4-configuring-your-agent)
5. [Integrating Agents](#5-integrating-agents)
6. [Managing Usage](#6-managing-usage)
7. [Support and Help](#7-support-and-help)

---

## 1. Getting Started

### 1.1 What is GSV Platform?

GSV Platform is an AI agent marketplace where you can:
- Browse and subscribe to pre-built AI agents
- Customize agents for your brand
- Integrate agents into your website, app, or workflow
- Pay only for what you use

### 1.2 Customer Journey

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   BROWSE     │───>│  SUBSCRIBE   │───>│  CONFIGURE   │───>│   INTEGRATE  │
│(Marketplace) │    │  (Plan)      │    │  (Persona)   │    │   (Widget)   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### 1.3 Access URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Portal | https://portal.digitlify.com | Dashboard & management |
| Marketplace | https://portal.digitlify.com/marketplace | Browse agents |
| Documentation | https://docs.digitlify.com | API docs |

### 1.4 Creating Your Account

1. Navigate to https://portal.digitlify.com
2. Click **Sign Up** or **Login with SSO**
3. Complete your profile
4. Verify your email address
5. (Optional) Add billing information

---

## 2. Browsing the Marketplace

### 2.1 Finding Agents

The marketplace offers various ways to discover agents:

- **Categories**: Customer Support, Sales, HR, IT Support
- **Search**: Find by name or keywords
- **Featured**: Top-rated and trending agents
- **Filters**: Price, rating, capabilities

### 2.2 Agent Categories

| Category | Use Cases |
|----------|-----------|
| Customer Support | FAQ bots, ticket handling, live chat |
| Sales | Lead qualification, product recommendations |
| HR | Employee onboarding, policy questions |
| IT Support | Technical troubleshooting, password resets |
| Education | Training assistants, quiz bots |

### 2.3 Evaluating Agents

Each agent listing includes:
- **Description**: What the agent does
- **Capabilities**: Specific features
- **Pricing Plans**: Cost and quotas
- **Reviews**: User ratings and feedback
- **Demo**: Try before you buy (free tier)

### 2.4 Comparing Plans

| Feature | Free Trial | Starter | Professional |
|---------|------------|---------|--------------|
| Messages/month | 100 | 1,000 | 10,000 |
| Rate limit | 1/sec | 5/sec | 20/sec |
| Support | Community | Email | Priority |
| Analytics | Basic | Standard | Full |
| Custom branding | No | Yes | Yes |
| API access | No | Yes | Yes |

---

## 3. Subscribing to Agents

### 3.1 Subscription Process

1. Find an agent in the marketplace
2. Click **Subscribe** on your preferred plan
3. Review the terms and pricing
4. Complete checkout
5. Receive your API key

### 3.2 Subscription Management

Access your subscriptions at:
**Portal → Dashboard → My Agents**

Here you can:
- View active subscriptions
- Upgrade or downgrade plans
- Cancel subscriptions
- View usage and billing

### 3.3 Your API Key

After subscribing, you'll receive an API key:

```
ar_sk_live_x7k9m2n4p6q8r0s1t3u5v7w9
```

**Keep this key secure!** It provides access to your subscription.

---

## 4. Configuring Your Agent

### 4.1 Persona Configuration

Customize how your agent presents itself:

| Setting | Description | Example |
|---------|-------------|---------|
| Agent Name | Display name | "Acme Support Bot" |
| Greeting | Welcome message | "Hi! How can I help today?" |
| Tone | Communication style | Professional, Friendly, Casual |
| Avatar | Profile image | Emoji, image URL, or custom |
| Primary Color | Brand color | #4A90D9 |

### 4.2 API Configuration

```bash
# Configure via API
PATCH /api/v1/access/{access_id}/persona/
Authorization: Bearer {your_api_key}
Content-Type: application/json

{
  "agent_name": "Acme Support Bot",
  "greeting_message": "Welcome to Acme! How can I assist you?",
  "tone": "professional",
  "avatar_type": "EMOJI",
  "avatar_emoji": "robot",
  "primary_color": "#4A90D9"
}
```

### 4.3 Training Documents

Upload documents to customize agent responses:

1. Navigate to **My Agents → [Agent] → Training**
2. Click **Upload Document**
3. Select file (PDF, MD, TXT, DOCX)
4. Wait for processing (1-5 minutes)
5. Verify indexed chunks

Supported formats:
- PDF (up to 50MB)
- Markdown (.md)
- Plain text (.txt)
- Word documents (.docx)

### 4.4 Knowledge Base

View and manage uploaded content:

```bash
GET /api/v1/access/{access_id}/documents/
Authorization: Bearer {your_api_key}

# Response
{
  "documents": [
    {
      "id": "doc-uuid",
      "filename": "company-faq.pdf",
      "status": "INDEXED",
      "chunks": 45,
      "uploaded_at": "2024-12-04T10:00:00Z"
    }
  ]
}
```

---

## 5. Integrating Agents

### 5.1 Integration Options

| Method | Use Case | Difficulty |
|--------|----------|------------|
| Web Widget | Website chat | Easy |
| API | Custom apps | Medium |
| Slack/Teams | Workplace | Easy |
| Mobile SDK | iOS/Android | Advanced |

### 5.2 Web Widget Integration

#### Creating a Widget

1. Go to **My Agents → [Agent] → Widgets**
2. Click **Create Widget**
3. Configure:
   - Type: Web Chat
   - Position: Bottom Right
   - Allowed domains: yourdomain.com
4. Copy the embed code

#### Embed Code

```html
<!-- Add before </body> -->
<script
  src="https://api.digitlify.com/widget/v1/gsv-widget.js"
  data-widget-id="wgt_your_widget_id"
  async>
</script>
```

#### Widget Customization

```html
<script
  src="https://api.digitlify.com/widget/v1/gsv-widget.js"
  data-widget-id="wgt_your_widget_id"
  data-position="bottom-right"
  data-theme="light"
  data-primary-color="#4A90D9"
  async>
</script>
```

### 5.3 API Integration

#### Basic Chat Request

```bash
POST /api/v1/chat/
Authorization: Bearer ar_sk_live_xxxxx
Content-Type: application/json

{
  "message": "How do I reset my password?",
  "conversation_id": "optional-session-id"
}

# Response
{
  "response": "To reset your password, click 'Forgot Password' on the login page...",
  "conversation_id": "conv-uuid",
  "tokens_used": {
    "input": 15,
    "output": 45
  }
}
```

#### Streaming Response

```bash
POST /api/v1/chat/stream/
Authorization: Bearer ar_sk_live_xxxxx
Content-Type: application/json

{
  "message": "Explain your return policy",
  "conversation_id": "conv-uuid"
}

# Server-Sent Events response
data: {"chunk": "Our return "}
data: {"chunk": "policy allows "}
data: {"chunk": "returns within 30 days..."}
data: {"done": true, "conversation_id": "conv-uuid"}
```

### 5.4 SDK Examples

#### JavaScript/TypeScript

```javascript
import { GSVClient } from '@gsv/client';

const client = new GSVClient({
  apiKey: 'ar_sk_live_xxxxx'
});

const response = await client.chat({
  message: 'How do I track my order?',
  conversationId: 'session-123'
});

console.log(response.text);
```

#### Python

```python
from gsv import GSVClient

client = GSVClient(api_key='ar_sk_live_xxxxx')

response = client.chat(
    message='What are your business hours?',
    conversation_id='session-123'
)

print(response.text)
```

---

## 6. Managing Usage

### 6.1 Usage Dashboard

View your usage at **Portal → Dashboard → Usage**:

- Total API calls this month
- Remaining quota
- Response time metrics
- Cost breakdown

### 6.2 Usage API

```bash
GET /api/v1/access/{access_id}/usage/?period=current_month
Authorization: Bearer {your_api_key}

# Response
{
  "period": "2024-12-01 to 2024-12-31",
  "quota": 10000,
  "used": 4532,
  "remaining": 5468,
  "api_calls": 4532,
  "tokens": {
    "input": 45000,
    "output": 135000
  }
}
```

### 6.3 Quota Alerts

Configure alerts at **Portal → Settings → Notifications**:

- 50% quota warning
- 80% quota warning
- 100% quota reached
- Rate limit exceeded

### 6.4 Upgrading Plans

When you need more capacity:

1. Go to **My Agents → [Agent] → Subscription**
2. Click **Upgrade Plan**
3. Select new plan
4. Confirm upgrade (pro-rated billing)

### 6.5 Billing

Access invoices at **Portal → Billing**:

- Current billing period
- Payment history
- Invoice downloads
- Payment methods

---

## 7. Support and Help

### 7.1 Getting Help

| Channel | Response Time | Use For |
|---------|---------------|---------|
| Documentation | Instant | How-to guides |
| Community Forum | Hours | General questions |
| Email Support | 24 hours | Account issues |
| Live Chat | Minutes | Urgent issues (Pro+) |

### 7.2 Common Issues

#### Widget Not Loading

```html
<!-- Check: -->
1. Script is loaded before </body>
2. Widget ID is correct
3. Domain is in allowed list
4. No JavaScript errors in console
```

#### API Errors

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 401 | Invalid API key | Check key format |
| 403 | Rate limited | Wait or upgrade |
| 429 | Quota exceeded | Upgrade plan |
| 500 | Server error | Contact support |

#### Slow Responses

- Check your network connection
- Verify API endpoint region
- Consider upgrading for priority

### 7.3 Feedback

Help us improve:
- Rate your agent experience
- Report issues via Portal
- Suggest features in Forum

### 7.4 Contact

- Documentation: https://docs.digitlify.com
- Support: support@digitlify.com
- Sales: sales@digitlify.com
- Security: security@digitlify.com

---

## Quick Reference

### API Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| Chat | POST | `/api/v1/chat/` |
| Stream chat | POST | `/api/v1/chat/stream/` |
| Get usage | GET | `/api/v1/access/{id}/usage/` |
| Update persona | PATCH | `/api/v1/access/{id}/persona/` |
| Upload document | POST | `/api/v1/access/{id}/documents/` |
| Create widget | POST | `/api/v1/access/{id}/widgets/` |

### Authentication

```bash
# All API requests require authentication header:
Authorization: Bearer ar_sk_live_your_api_key
```

### Rate Limits

| Plan | Rate Limit | Burst |
|------|------------|-------|
| Free | 1/second | 5 |
| Starter | 5/second | 20 |
| Professional | 20/second | 100 |
| Enterprise | 100/second | 500 |

---

*Document generated by GSV Platform Engineering Team*
