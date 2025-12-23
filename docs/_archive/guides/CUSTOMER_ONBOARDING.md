# Customer Onboarding Guide

This guide walks you through the process of subscribing to an AI Agent on the GSV Marketplace and deploying it on your website or application.

## Prerequisites

- Active GSV Portal account
- Organization/Project set up in the portal
- Website or application where you want to deploy the agent

## Step 1: Sign Up / Sign In

### New Customers

1. Visit the GSV Portal at https://portal.gsv.ai (or https://portal.dev.gsv.dev for dev)
2. Click **Sign Up**
3. Enter your email and create a password, or use **Sign in with SSO**
4. Verify your email address
5. Complete your profile:
   - Company name
   - Contact information
   - Billing address

### Existing Customers

1. Visit the GSV Portal
2. Click **Sign In**
3. Enter credentials or use SSO

## Step 2: Create an Organization

If you haven't already created an organization:

1. After logging in, click **Create Organization**
2. Enter:
   - Organization name (your company name)
   - Description
   - Contact email
3. Click **Create**

## Step 3: Create a Project

Projects help you organize resources by team, department, or purpose.

1. Navigate to **Projects**
2. Click **New Project**
3. Enter:
   - Project name (e.g., "Customer Support", "Sales Team")
   - Description
   - Select your organization
4. Click **Create Project**

## Step 4: Browse the Agent Marketplace

1. Navigate to **Marketplace**
2. Browse available AI Agents by category:
   - Customer Support
   - Sales & Lead Generation
   - Knowledge Base
   - Custom Solutions
3. Click on an agent to view details:
   - Features and capabilities
   - Supported languages
   - Input/Output types
   - Pricing plans

## Step 5: Subscribe to an Agent

1. Select your desired agent (e.g., "Customer Support Agent")
2. Review the pricing plans:

| Plan | Price | Features |
|------|-------|----------|
| Free | $0/mo | 100 conversations/month, basic features |
| Basic | $29.99/mo | 1,000 conversations/month, analytics |
| Pro | $99.99/mo | 10,000 conversations/month, priority support |
| Enterprise | Custom | Unlimited, dedicated support, SLA |

3. Click **Subscribe**
4. Select your project
5. Choose a plan
6. Confirm subscription

## Step 6: Get Your API Key

After subscribing, you'll need an API key to integrate the agent:

1. Go to **My Subscriptions**
2. Click on your agent subscription
3. Navigate to **API Keys** tab
4. Click **Generate API Key**
5. Copy and securely store your API key

**Important**: Keep your API key secure and never expose it in client-side code.

## Step 7: Integrate the Agent

### Option A: Embed Widget (Recommended for Websites)

The easiest way to add an agent to your website:

1. Go to your subscription details
2. Click **Get Widget Code**
3. Copy the embed code:

```html
<script src="https://api.gsv.ai/widget/gsv-widget.js"></script>
<script>
  GSVWidget.init({
    apiKey: 'your-public-api-key',
    agentId: 'your-agent-id',
    theme: 'light',  // 'light' or 'dark'
    position: 'bottom-right'
  });
</script>
```

4. Paste the code before the `</body>` tag on your website
5. The chat widget will appear on your site

For detailed widget configuration, see the [Widget Integration Guide](./WIDGET_INTEGRATION.md).

### Option B: API Integration

For custom integrations or mobile apps:

```bash
# Start a conversation
curl -X POST https://api.gsv.ai/v1/conversations/ \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, I need help"}'

# Response
{
  "conversation_id": "conv_abc123",
  "response": "Hello! How can I assist you today?",
  "metadata": {
    "confidence": 0.95,
    "intent": "greeting"
  }
}
```

### Option C: Webhook Integration

Receive agent responses via webhook:

1. Go to subscription settings
2. Navigate to **Webhooks**
3. Add your webhook URL
4. Select events to receive:
   - `conversation.created`
   - `message.received`
   - `conversation.ended`

## Step 8: Customize Your Agent

### Training Data

Upload custom training documents:

1. Go to subscription **Settings**
2. Click **Training Data**
3. Upload documents:
   - FAQs
   - Product documentation
   - Support policies
4. Click **Retrain** to apply changes

### Appearance

Customize the widget appearance:

1. Go to **Widget Settings**
2. Configure:
   - Brand colors
   - Logo
   - Welcome message
   - Button text
3. Preview changes
4. Click **Save**

### Behavior

Configure agent behavior:

1. Go to **Behavior Settings**
2. Set:
   - Response tone (formal/casual)
   - Supported languages
   - Working hours
   - Fallback messages
3. Save changes

## Step 9: Monitor Usage

Track your agent's performance:

1. Navigate to **Analytics**
2. View metrics:
   - Total conversations
   - Messages processed
   - Resolution rate
   - Average response time
   - Customer satisfaction

### Usage Alerts

Set up usage alerts to avoid overages:

1. Go to **Settings** > **Alerts**
2. Configure thresholds:
   - 80% of quota used
   - 90% of quota used
3. Select notification method (email/webhook)

## Step 10: Upgrade or Manage Subscription

### Upgrade Plan

1. Go to **My Subscriptions**
2. Click your subscription
3. Click **Change Plan**
4. Select new plan
5. Confirm changes (prorated billing applies)

### Cancel Subscription

1. Go to **My Subscriptions**
2. Click subscription
3. Click **Cancel Subscription**
4. Confirm cancellation
5. Access continues until end of billing period

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Widget not showing | Check API key and agent ID |
| API returns 401 | Verify API key is valid |
| Slow responses | Check your network connection |
| Quota exceeded | Upgrade plan or wait for reset |
| Agent not responding correctly | Update training data |

## Support

- **Email**: support@gsv.ai
- **Documentation**: https://docs.gsv.ai
- **Status Page**: https://status.gsv.ai
- **Community**: https://community.gsv.ai

## Next Steps

- [Widget Integration Guide](./WIDGET_INTEGRATION.md) - Detailed widget customization
- [API Reference](./API_REFERENCE.md) - Full API documentation
- [Training Data Guide](./TRAINING_DATA.md) - Best practices for training
- [Analytics Guide](./ANALYTICS.md) - Understanding your metrics
