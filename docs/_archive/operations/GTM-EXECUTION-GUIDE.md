# GTM Execution Guide

**Date:** December 12, 2024
**Purpose:** Step-by-step guide to complete remaining GTM tasks

## Prerequisites

Before starting, ensure you have:
- [ ] Access to Waldur Admin UI
- [ ] Access to Agent Registry Django Admin
- [ ] WSL terminal or bash shell
- [ ] Git repos cloned locally

## Quick Reference: Scripts Location

```
/workspace/repo/github.com/GSVDEV/gsv-agentregistry/scripts/
├── configure_waldur_webhooks.py  # Configure Waldur → Registry webhooks
├── publish_test_agent.py         # Publish test agent to marketplace
├── run_e2e_tests.py              # Run E2E test suite
├── gtm_validation.py             # GTM readiness validation
├── load_test.py                  # Load testing
└── security_review.py            # Security scanning
```

---

## Step 1: Configure Waldur Webhooks (30 min)

### 1.1 Create Service Account and Get Token (via kubectl)

The Waldur Admin UI doesn't have an API Tokens section in the menu. Use kubectl instead:

```bash
# Step 1: Create service account user (if not exists)
kubectl -n cmp exec deployment/waldur-mastermind-api -- waldur shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='agent-registry-service').exists():
    User.objects.create_user('agent-registry-service', 'agent-registry@internal.gsv.dev', 'SecurePassword123!')
    print('User created')
else:
    print('User already exists')
"

# Step 2: Make user staff and generate token
kubectl -n cmp exec deployment/waldur-mastermind-api -- waldur shell -c "
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.get(username='agent-registry-service')
user.is_staff = True
user.save()
token, created = Token.objects.get_or_create(user=user)
print(f'Token: {token.key}')
"
```

Copy the token output for use in webhook configuration.

### 1.2 Configure Webhooks (via kubectl - RECOMMENDED)

The simplest approach is to configure webhooks directly via kubectl:

```bash
# Configure all 3 webhooks in one command
kubectl -n cmp exec deployment/waldur-mastermind-api -- python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waldur_core.server.settings')
import django
django.setup()
from waldur_core.logging.models import WebHook
from django.contrib.auth import get_user_model

User = get_user_model()
service_user = User.objects.filter(username='agent-registry-service').first()
if not service_user:
    service_user = User.objects.filter(is_staff=True).first()

BASE_URL = 'http://agent-registry.cmp.svc.cluster.local:8000'

configs = [
    (BASE_URL + '/webhooks/waldur/order/', ['marketplace_order_created', 'marketplace_order_approved', 'marketplace_order_completed', 'marketplace_order_failed', 'marketplace_order_rejected', 'marketplace_order_terminated'], 'Order'),
    (BASE_URL + '/webhooks/waldur/customer/', ['customer_creation_succeeded', 'customer_update_succeeded', 'customer_deletion_succeeded'], 'Customer'),
    (BASE_URL + '/webhooks/waldur/project/', ['project_creation_succeeded', 'project_update_succeeded', 'project_deletion_succeeded'], 'Project'),
]

for url, events, name in configs:
    h = WebHook.objects.filter(destination_url=url).first()
    if h:
        h.event_types = events
        h.is_active = True
        h.save()
        print(f'[UPDATED] {name} webhook')
    else:
        WebHook.objects.create(user=service_user, destination_url=url, event_types=events, is_active=True, content_type=1)
        print(f'[CREATED] {name} webhook')

print(f'Total webhooks: {WebHook.objects.filter(destination_url__contains=\"agent-registry\").count()}')
"
```

### 1.3 Verify Webhook Configuration

```bash
# Check webhooks are configured
kubectl -n cmp exec deployment/waldur-mastermind-api -- python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'waldur_core.server.settings')
import django
django.setup()
from waldur_core.logging.models import WebHook
hooks = WebHook.objects.filter(destination_url__contains='agent-registry')
print(f'Configured webhooks: {hooks.count()}')
for h in hooks:
    print(f'  [OK] {h.destination_url}')
    print(f'       Active: {h.is_active}, Events: {len(h.event_types)}')
"

# Test webhook endpoints are accessible
kubectl -n cmp exec deployment/agent-registry -- python -c "
import requests
for ep in ['/webhooks/waldur/order/', '/webhooks/waldur/customer/', '/webhooks/waldur/project/']:
    r = requests.post(f'http://localhost:8000{ep}', json={'event_type': 'test', 'context': {}}, timeout=5)
    print(f'[PASS] {ep} -> {r.status_code}')
"
```

### 1.4 Alternative: Configure via Script (if DNS works)

If your environment can resolve external DNS names:

```bash
cd /workspace/repo/github.com/GSVDEV/gsv-agentregistry

# Set token (from step 1.1)
export WALDUR_TOKEN="<your-token>"

# Test endpoints
python scripts/configure_waldur_webhooks.py --env dev --test-endpoints

# Configure webhooks
python scripts/configure_waldur_webhooks.py --env dev --configure
```

---

## Step 2: Publish Test Agent (20 min)

### 2.1 Get Service Provider UUID

1. Login to Waldur Admin
2. Navigate to: **Structure** → **Customers (Organizations)**
3. Find or create "GSV Platform Provider" organization
4. Copy the **UUID** from the URL or detail page

### 2.2 Run Publish Script

```bash
cd /workspace/repo/github.com/GSVDEV/gsv-agentregistry

# Set environment variables
export WALDUR_API_URL="https://app.dev.gsv.dev/api/"
export WALDUR_API_TOKEN="<your-waldur-token>"
export SERVICE_PROVIDER_UUID="<provider-uuid-from-step-2.1>"

# Run publish script
python scripts/publish_test_agent.py
```

### 2.3 Expected Output

```
============================================================
GSV Agent Registry - Publish Test Agent to Waldur
============================================================

1. Creating/getting service provider tenant...
   Created tenant: GSV Platform Provider

2. Creating/getting test agent...
   Created agent: Customer Support Agent (Test)

3. Creating/getting pricing plans...
   Created plan: Free Tier ($0/month)
   Created plan: Starter ($29/month)
   Created plan: Professional ($99/month)
   Created plan: Enterprise ($499/month)

4. Publishing to Waldur marketplace...
   Publishing to Waldur marketplace...
   SUCCESS! Agent published to Waldur
   Offering UUID: abc123-def456-...
```

### 2.4 Verify in Waldur

1. Go to Waldur CMP: `https://app.dev.gsv.dev/`
2. Navigate to: **Marketplace**
3. Find "Customer Support Agent (Test)"
4. Verify:
   - [ ] Agent appears in listing
   - [ ] Description is correct
   - [ ] 4 pricing plans visible
   - [ ] Order button works

---

## Step 3: Run E2E Tests (30 min)

### 3.1 Smoke Tests (Quick)

```bash
cd /workspace/repo/github.com/GSVDEV/gsv-agentregistry

# Quick health check - 2 minutes
python scripts/run_e2e_tests.py --env dev --smoke
```

Expected output:
```
============================================================
 Service Health Checks
============================================================
[PASS] Health: Agent Registry (0.15s)
[PASS] Health: Waldur CMP (0.23s)
[PASS] Health: Config Portal (0.18s)
[PASS] Health: Keycloak SSO (0.21s)

============================================================
 Webhook Endpoint Checks
============================================================
[PASS] Webhook: order (0.12s)
[PASS] Webhook: customer (0.11s)
[PASS] Webhook: project (0.10s)
```

### 3.2 Full E2E Suite

```bash
# Full test suite - 5-10 minutes
python scripts/run_e2e_tests.py --env dev

# With HTML report
python scripts/run_e2e_tests.py --env dev --html-report

# Save results to JSON
python scripts/run_e2e_tests.py --env dev --output e2e_results.json
```

### 3.3 Specific Categories

```bash
# Webhook integration tests
python scripts/run_e2e_tests.py --env dev --category webhooks

# Customer journey tests
python scripts/run_e2e_tests.py --env dev --category customer

# Provider journey tests
python scripts/run_e2e_tests.py --env dev --category provider
```

### 3.4 Using Pytest Directly

```bash
# Set environment
export TEST_ENV=dev
export REGISTRY_URL=https://agent-registry.dev.gsv.dev
export WALDUR_URL=https://app.dev.gsv.dev

# Run all E2E tests
pytest tests/e2e/ -v

# Run with markers
pytest tests/e2e/ -v -m webhooks
pytest tests/e2e/ -v -m customer
pytest tests/e2e/ -v -m provider
```

---

## Step 4: Manual E2E Order Flow Test (30 min)

### 4.1 Customer Registration (Waldur)

1. Open Waldur CMP: `https://app.dev.gsv.dev/`
2. Click **Register** or **Sign Up**
3. Create a new account:
   - Email: `test-customer@example.com`
   - Organization: "Test Customer Inc"
4. Verify email (check inbox)
5. Login

### 4.2 Create Project

1. Go to **Dashboard** → **Create Project**
2. Name: "AI Agents Test Project"
3. Click **Create**

### 4.3 Order Agent

1. Go to **Marketplace**
2. Find "Customer Support Agent (Test)"
3. Click **Order**
4. Select plan: **Starter** ($29/month)
5. Confirm order

### 4.4 Verify Webhook Processing

1. Check Agent Registry logs:
   ```bash
   # Kubernetes
   kubectl logs -l app=agent-registry -n agent-registry --tail=100 | grep webhook

   # Or Django Admin
   # Go to Admin → Agent Access → Check new entry created
   ```

2. Verify in Agent Registry Admin:
   - [ ] New AgentTenant created (if first order)
   - [ ] New AgentProject created (if first project)
   - [ ] New AgentAccess created with API key

### 4.5 Get API Key

1. In Waldur, go to **My Resources**
2. Find the agent subscription
3. API key should be displayed (generated by webhook)

### 4.6 Test API Key

```bash
API_KEY="<api-key-from-step-4.5>"
AGENT_ID="test-support-agent-001"
REGISTRY_URL="https://agent-registry.dev.gsv.dev"

# Test agent info
curl -s "${REGISTRY_URL}/agents/${AGENT_ID}/info" \
  -H "X-API-Key: ${API_KEY}" | jq

# Test predict (if runtime configured)
curl -s -X POST "${REGISTRY_URL}/agents/${AGENT_ID}/predict" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how can you help me?"}' | jq

# Check usage
curl -s "${REGISTRY_URL}/agents/${AGENT_ID}/usage" \
  -H "X-API-Key: ${API_KEY}" | jq
```

### 4.7 Test Config Portal

1. Go to Config Portal: `https://portal.{env}.gsv.dev/`
2. Login with same credentials as Waldur
3. Verify:
   - [ ] Agent subscription appears in dashboard
   - [ ] Can configure agent persona
   - [ ] Can manage widget settings
   - [ ] Usage statistics visible

---

## Step 5: Test Provider Journey (Optional, 20 min)

### 5.1 Provider Login

1. Login to Waldur as provider (or use admin account)
2. Navigate to service provider organization

### 5.2 Check Offering Management

1. Go to **Service Provider** → **Offerings**
2. Verify test agent offering visible
3. Check:
   - [ ] Can edit offering details
   - [ ] Can update pricing plans
   - [ ] Can pause/activate offering

### 5.3 Check Order Management

1. Go to **Service Provider** → **Orders**
2. Verify test order visible
3. Check order status and details

---

## Step 6: Validation Checklist

### Webhook Flow ✓

- [ ] Customer webhook creates AgentTenant
- [ ] Project webhook creates AgentProject
- [ ] Order webhook creates AgentAccess with API key
- [ ] Order completion webhook confirms access

### Customer Journey ✓

- [ ] Can browse marketplace
- [ ] Can view agent details
- [ ] Can order agent with plan
- [ ] Receives API key after order
- [ ] Can use API key for requests
- [ ] Can view usage in portal

### Provider Journey ✓

- [ ] Agent appears in marketplace
- [ ] Pricing plans correct
- [ ] Can manage offering
- [ ] Can view orders

### Integration ✓

- [ ] SSO login works across portals
- [ ] Waldur ↔ Registry data syncs
- [ ] Usage reporting works

---

## Troubleshooting

### Webhook Not Received

```bash
# Check webhook configuration in Waldur
curl -s "${WALDUR_URL}/api/hooks/" \
  -H "Authorization: Token ${WALDUR_TOKEN}" | jq

# Check Agent Registry logs
kubectl logs -l app=agent-registry -n agent-registry --tail=100
```

### API Key Not Working

```bash
# Validate key
curl -s -X POST "${REGISTRY_URL}/api/v1/access/validate/" \
  -H "Content-Type: application/json" \
  -d '{"api_key": "YOUR_KEY"}' | jq
```

### Order Not Creating Access

1. Check webhook endpoint is configured in Waldur
2. Check Agent Registry has the offering UUID registered
3. Check webhook payload format matches expected

### SSO Login Issues

1. Verify Keycloak realm configuration
2. Check client credentials in both systems
3. Verify redirect URIs are correct

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Development | | | |
| QA | | | |
| Security | | | |
| Operations | | | |

---

## Next Steps After Validation

1. **Deploy to QA** - Repeat tests in QA environment
2. **Deploy to Production** - Final deployment
3. **Monitor** - Watch logs and metrics for first 24-48 hours
4. **Document** - Update any outdated documentation
5. **Announce** - Internal announcement of GTM readiness
