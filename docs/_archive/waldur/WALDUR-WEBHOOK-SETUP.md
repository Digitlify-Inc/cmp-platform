# Waldur Webhook Configuration Guide

**Date:** December 11, 2024
**Updated:** December 11, 2024
**Purpose:** Configure Waldur CMP to send webhooks to Agent Registry

## Overview

When a customer orders an AI Agent through Waldur CMP marketplace, Waldur sends webhooks to the Agent Registry to:
1. Create the customer's tenant (if new)
2. Create the project (if new)
3. Provision access to the ordered agent (generate API key)

## Important: Waldur Event System

Waldur uses an internal event logging system. Webhooks are triggered by **event types**, not custom webhook endpoints. The Agent Registry must subscribe to specific event types.

### Available Marketplace Event Types

From `waldur_core/logging/enums.py`:

| Event Type | Description |
|------------|-------------|
| `marketplace_order_created` | Order placed by customer |
| `marketplace_order_approved` | Order approved (if approval required) |
| `marketplace_order_completed` | Order processing finished |
| `marketplace_order_failed` | Order processing failed |
| `marketplace_order_rejected` | Order rejected |
| `marketplace_resource_create_succeeded` | Resource provisioned |
| `customer_creation_succeeded` | New customer created |
| `customer_update_succeeded` | Customer updated |
| `project_creation_succeeded` | New project created |
| `project_update_succeeded` | Project updated |

## Prerequisites

- Access to Waldur Admin panel
- Agent Registry deployed and accessible
- Waldur user account to own the webhooks

## Webhook Endpoints

Configure these webhook endpoints in Waldur:

| Event Type(s) | Endpoint | Method |
|---------------|----------|--------|
| `marketplace_order_created`, `marketplace_order_approved`, `marketplace_order_completed` | `https://agent-registry.{domain}/webhooks/waldur/order/` | POST |
| `customer_creation_succeeded`, `customer_update_succeeded` | `https://agent-registry.{domain}/webhooks/waldur/customer/` | POST |
| `project_creation_succeeded`, `project_update_succeeded` | `https://agent-registry.{domain}/webhooks/waldur/project/` | POST |

### Environment-Specific URLs

| Environment | Agent Registry URL | Waldur URL |
|-------------|-------------------|------------|
| Development | `https://agent-registry.dev.gsv.dev` | `https://app.dev.gsv.dev` |
| QA | `https://agent-registry.qa.digitlify.com` | `https://app.qa.digitlify.com` |
| Production | `https://agent-registry.digitlify.com` | `https://app.digitlify.com` |

## Step-by-Step Configuration

### 1. Create Service Account in Waldur

First, create a service account user that will own the webhooks:

```bash
# Via Waldur Admin UI
1. Login to Waldur Admin: https://app.{domain}/admin/
2. Navigate to: Users → Add User
3. Create service account:
   - Username: agent-registry-service
   - Email: agent-registry@internal.gsv.dev
   - Is Staff: Yes (to access webhook API)
4. Generate API token for this user
```

### 2. Configure Agent Registry

The Agent Registry needs to verify incoming webhooks. Since Waldur's standard WebHook model doesn't include HMAC signatures, we use one of these approaches:

**Option A: IP-based allowlisting (recommended for internal networks)**
```yaml
# Agent Registry environment
WALDUR_WEBHOOK_ALLOWED_IPS=10.0.0.0/8,172.16.0.0/12
```

**Option B: Shared API token verification**
```yaml
# Both systems share a token for verification
WALDUR_API_TOKEN=<service-account-token>
```

### 3. Configure Waldur Webhooks

#### Option A: Via Waldur Admin UI

1. Login to Waldur Admin: `https://app.{domain}/admin/`
2. Navigate to: **Logging** → **Web hooks**
3. Click **Add Web Hook**
4. For each webhook:

**Order Webhook:**
```
User: agent-registry-service
Destination URL: https://agent-registry.{domain}/webhooks/waldur/order/
Content Type: json
Event Types: ["marketplace_order_created", "marketplace_order_approved", "marketplace_order_completed"]
Event Groups: []
Is Active: Yes
```

**Customer Webhook:**
```
User: agent-registry-service
Destination URL: https://agent-registry.{domain}/webhooks/waldur/customer/
Content Type: json
Event Types: ["customer_creation_succeeded", "customer_update_succeeded"]
Event Groups: []
Is Active: Yes
```

**Project Webhook:**
```
User: agent-registry-service
Destination URL: https://agent-registry.{domain}/webhooks/waldur/project/
Content Type: json
Event Types: ["project_creation_succeeded", "project_update_succeeded"]
Event Groups: []
Is Active: Yes
```

#### Option B: Via Waldur API

```bash
# Set variables
WALDUR_URL="https://app.digitlify.com"
WALDUR_TOKEN="your-service-account-api-token"
AGENT_REGISTRY_URL="https://agent-registry.digitlify.com"

# Create Order Webhook
curl -X POST "${WALDUR_URL}/api/hooks-web/" \
  -H "Authorization: Token ${WALDUR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "event_types": ["marketplace_order_created", "marketplace_order_approved", "marketplace_order_completed"],
    "event_groups": [],
    "destination_url": "'${AGENT_REGISTRY_URL}'/webhooks/waldur/order/",
    "content_type": 1,
    "is_active": true
  }'

# Create Customer Webhook
curl -X POST "${WALDUR_URL}/api/hooks-web/" \
  -H "Authorization: Token ${WALDUR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "event_types": ["customer_creation_succeeded", "customer_update_succeeded"],
    "event_groups": [],
    "destination_url": "'${AGENT_REGISTRY_URL}'/webhooks/waldur/customer/",
    "content_type": 1,
    "is_active": true
  }'

# Create Project Webhook
curl -X POST "${WALDUR_URL}/api/hooks-web/" \
  -H "Authorization: Token ${WALDUR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "event_types": ["project_creation_succeeded", "project_update_succeeded"],
    "event_groups": [],
    "destination_url": "'${AGENT_REGISTRY_URL}'/webhooks/waldur/project/",
    "content_type": 1,
    "is_active": true
  }'
```

**Note:** `content_type: 1` = JSON, `content_type: 2` = Form data

#### Option C: Automated Script (Recommended)

Use the provided configuration script for easier setup:

```bash
# Clone or navigate to the Agent Registry repository
cd /workspace/repo/github.com/GSVDEV/gsv-agentregistry

# Set environment variables
export WALDUR_TOKEN="your-service-account-api-token"

# Configure webhooks for a specific environment
python scripts/configure_waldur_webhooks.py --env dev --configure

# Or for production
python scripts/configure_waldur_webhooks.py --env production --configure

# Verify webhooks without making changes
python scripts/configure_waldur_webhooks.py --env production

# Test if Agent Registry endpoints are accessible
python scripts/configure_waldur_webhooks.py --env production --test-endpoints
```

The script supports:
- `--env dev|qa|production`: Use predefined environment URLs
- `--configure`: Create/update webhooks (default is verify-only)
- `--force-recreate`: Delete and recreate existing webhooks
- `--test-endpoints`: Test if Agent Registry endpoints are accessible

### 4. Verify Webhook Configuration

List configured webhooks:

```bash
curl -X GET "${WALDUR_URL}/api/hooks/" \
  -H "Authorization: Token ${WALDUR_TOKEN}"
```

Or use the script:

```bash
python scripts/configure_waldur_webhooks.py --env production
```

## Webhook Payload Examples

Waldur sends webhook payloads with the following structure:

### Order Created Webhook

```json
{
  "created": "2024-12-11T10:00:00.000000+00:00",
  "message": "Marketplace order Customer Support Agent has been created.",
  "context": {
    "order_uuid": "abc123-def456-...",
    "order_name": "Customer Support Agent",
    "offering_uuid": "offering-uuid-here",
    "offering_name": "Customer Support Agent",
    "plan_uuid": "plan-uuid-here",
    "plan_name": "Professional",
    "project_uuid": "project-uuid-here",
    "project_name": "My Project",
    "customer_uuid": "customer-uuid-here",
    "customer_name": "Acme Corp",
    "user_uuid": "user-uuid-here",
    "user_email": "user@example.com"
  },
  "event_type": "marketplace_order_created"
}
```

### Customer Created Webhook

```json
{
  "created": "2024-12-11T10:00:00.000000+00:00",
  "message": "Organization Acme Corp has been created.",
  "context": {
    "customer_uuid": "customer-uuid-here",
    "customer_name": "Acme Corp",
    "customer_abbreviation": "acme",
    "user_uuid": "user-uuid-here",
    "user_email": "admin@acme.com"
  },
  "event_type": "customer_creation_succeeded"
}
```

### Project Created Webhook

```json
{
  "created": "2024-12-11T10:00:00.000000+00:00",
  "message": "Project My Project has been created.",
  "context": {
    "project_uuid": "project-uuid-here",
    "project_name": "My Project",
    "customer_uuid": "customer-uuid-here",
    "customer_name": "Acme Corp",
    "user_uuid": "user-uuid-here"
  },
  "event_type": "project_creation_succeeded"
}
```

## Webhook Security

**Important:** Waldur's standard WebHook model does NOT include HMAC signature verification. Use one of these approaches:

### Option A: Network-Level Security (Recommended)
- Deploy Agent Registry in the same Kubernetes cluster as Waldur
- Use network policies to restrict webhook endpoint access
- Use internal service URLs (e.g., `http://agent-registry.agent-registry.svc.cluster.local`)

### Option B: IP Allowlisting
```python
# Agent Registry webhook view
ALLOWED_IPS = ['10.0.0.0/8', '172.16.0.0/12']

def validate_source_ip(request):
    client_ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
    return any(ipaddress.ip_address(client_ip) in ipaddress.ip_network(net) for net in ALLOWED_IPS)
```

### Option C: Custom Header Verification
Add a custom header in Waldur webhook configuration (if supported by your deployment):
```yaml
# Agent Registry environment
WALDUR_WEBHOOK_AUTH_HEADER=X-Webhook-Token
WALDUR_WEBHOOK_AUTH_TOKEN=<shared-secret>
```

## Testing Webhooks

### Manual Test

Use the Waldur Admin to trigger a test webhook:

1. Go to **Structure** → **Webhooks**
2. Select your webhook
3. Click **Test Webhook**
4. Check Agent Registry logs for the received event

### Verify in Agent Registry Logs

```bash
# Kubernetes
kubectl logs -l app=agent-registry -n agent-registry --tail=100 | grep webhook

# Docker
docker logs agent-registry 2>&1 | grep webhook
```

Expected log output:
```
INFO Received Waldur webhook: marketplace_order.created
INFO Processing order: order-uuid-here
INFO Created AgentAccess for user: user@example.com
```

## Troubleshooting

### Webhook Not Received

1. Check Waldur webhook status (should show delivery attempts)
2. Verify Agent Registry is accessible from Waldur network
3. Check firewall rules allow POST to webhook endpoints
4. Verify SSL certificate is valid (no self-signed in production)

### Signature Verification Failed

1. Verify `WALDUR_WEBHOOK_SECRET` matches in both systems
2. Check for whitespace or encoding issues in secret
3. Ensure payload is not modified by any proxy

### Order Not Creating Access

1. Check Agent Registry logs for errors
2. Verify the offering UUID is registered in Agent Registry
3. Verify the customer/tenant exists or can be created

## Security Considerations

- Always use HTTPS for webhook endpoints
- Rotate webhook secrets periodically
- Monitor webhook delivery failures
- Implement rate limiting on webhook endpoints
- Log all webhook events for audit

## Related Documentation

- [GTM Alignment](../gsv-platform/GTM-ALIGNMENT-2024.md)
- [Agent Registry Webhooks](../../repo/github.com/GSVDEV/gsv-agentregistry/docs/webhooks.md)
- [Waldur Webhooks Documentation](https://docs.waldur.com/admin-guide/webhooks/)
