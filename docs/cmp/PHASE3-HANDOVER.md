# CMP Phase 3 Implementation Handover

**Date:** 2025-12-18
**Phase:** 3 - Commerce Integration
**Status:** IN PROGRESS (Core infrastructure complete, storefront pending)

---

## Quick Start for Next Session

```bash
# 1. Check cluster status
kubectl get pods -n cmp

# 2. Verify all services are running
kubectl get pods -n cmp | grep -E "commerce|control-plane|gateway|runner|provisioner"

# 3. Test endpoints
curl -s http://cmp-gateway.cmp:8000/health
curl -s http://cmp-control-plane.cmp:8000/health/

# 4. Test Saleor GraphQL (from within cluster)
kubectl run curl-test --image=curlimages/curl --rm -it --restart=Never -- \
  curl -s "http://cmp-commerce-api.cmp:8000/graphql/" -X POST \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"{ products(first: 5, channel: \\\"default-channel\\\") { edges { node { name } } } }\"}"

# 5. Access Saleor Dashboard
# URL: https://admin.dev.gsv.dev/
# Email: admin@dev.gsv.dev
# Password: Admin123!
```

---

## What Was Completed in This Session

### 1. Saleor Webhook Configuration
- Created "CMP Provisioner" app in Saleor
- Configured ORDER_FULLY_PAID webhook
- Target: `http://cmp-provisioner.cmp:8000/webhooks/saleor/order-paid`

### 2. Product Catalog Setup
Created complete product catalog in Saleor:

**Product Types:**
- AI Agent (slug: ai-agent) - Digital, no shipping
- Credit Pack (slug: credit-pack) - Digital, no shipping

**Categories:**
- AI Agents (slug: ai-agents)
- Credit Packs (slug: credit-packs)

**Products with Variants:**
| Product | SKU | Price |
|---------|-----|-------|
| Customer Support Agent - Basic | CSA-BASIC | $19.99 |
| Customer Support Agent - Pro | CSA-PRO | $49.99 |
| Knowledge Base Agent - Basic | KBA-BASIC | $29.99 |
| Knowledge Base Agent - Pro | KBA-PRO | $79.99 |
| Starter Credit Pack (100) | CREDITS-100 | $10.00 |
| Pro Credit Pack (500) | CREDITS-500 | $40.00 |

All products:
- Published to default-channel
- Visible in listings
- Available for purchase

### 3. Gateway Code Fix
Fixed Gateway service to include API routers:
- Added import: `from app.api import runs_router, widget_router`
- Added: `app.include_router(runs_router)`
- Added: `app.include_router(widget_router)`
- Rebuilt and deployed as v0.4.0

### 4. Execution Pipeline Verification
Verified Gateway -> Runner -> Langflow pipeline:
- Gateway correctly routes to Runner at `/run`
- Runner correctly calls Langflow Runtime
- Pipeline returns expected error when no flow exists

---

## Saleor GraphQL IDs (for reference)

```
Channel: Q2hhbm5lbDox (default-channel)

Product Types:
- AI Agent: UHJvZHVjdFR5cGU6Mg==
- Credit Pack: UHJvZHVjdFR5cGU6Mw==

Categories:
- AI Agents: Q2F0ZWdvcnk6Mg==
- Credit Packs: Q2F0ZWdvcnk6Mw==

Products:
- Customer Support Agent: UHJvZHVjdDox
- Knowledge Base Agent: UHJvZHVjdDoy
- Starter Credit Pack: UHJvZHVjdDoz
- Pro Credit Pack: UHJvZHVjdDo0

Product Variants:
- CSA-BASIC: UHJvZHVjdFZhcmlhbnQ6MQ==
- CSA-PRO: UHJvZHVjdFZhcmlhbnQ6Mg==
- KBA-BASIC: UHJvZHVjdFZhcmlhbnQ6Mw==
- KBA-PRO: UHJvZHVjdFZhcmlhbnQ6NA==
- CREDITS-100: UHJvZHVjdFZhcmlhbnQ6NQ==
- CREDITS-500: UHJvZHVjdFZhcmlhbnQ6Ng==

Apps:
- CMP Provisioner: QXBwOjI=

Webhooks:
- Order Paid Webhook: V2ViaG9vazox
```

---

## Configuration Changes Made

### 1. Saleor ConfigMap Fix
Changed `PUBLIC_URL` from `https://` to `http://` to prevent SSL redirects:
```bash
kubectl patch configmap cmp-commerce-api-config -n cmp --type="json" \
  -p="[{\"op\": \"replace\", \"path\": \"/data/PUBLIC_URL\", \"value\": \"http://store.dev.gsv.dev/\"}]"
```

### 2. Gateway Image Update
```bash
# Build with routers included
docker build -t ghcr.io/gsvdev/cmp-gateway:v0.4.0 .
docker tag ghcr.io/gsvdev/cmp-gateway:v0.4.0 ghcr.io/gsvdev/cmp-gateway:latest

# Load to KinD
kind load docker-image ghcr.io/gsvdev/cmp-gateway:latest --name kind-gsv
```

---

## Files Modified

### gsv-platform/services/gateway/main.py
Added router imports and includes:
```python
from app.api import runs_router, widget_router
...
app.include_router(runs_router)
app.include_router(widget_router)
```

### gsv-platform/services/gateway/app/api/__init__.py
Created with router exports.

### gsv-platform/services/gateway/app/api/runs.py
Created with POST /v1/runs endpoint.

### gsv-platform/services/gateway/app/api/widget.py
Created with POST /v1/widget/session:init endpoint.

### gsv-platform/services/gateway/app/routing/__init__.py
Created with runner_client export.

### gsv-platform/services/gateway/app/routing/runner.py
Created with RunnerClient class.

---

## Next Steps (Phase 3 Completion)

### 1. Build Next.js Storefront (Priority)
```
gsv-platform/apps/web/
├── package.json
├── next.config.js
├── src/
│   ├── app/
│   │   ├── (marketing)/     # Landing, about, pricing
│   │   ├── (store)/         # Marketplace, agent details
│   │   ├── (workspace)/     # Dashboard, my agents
│   │   └── (checkout)/      # Cart, checkout (Saleor)
│   ├── components/
│   ├── lib/
│   │   ├── saleor/          # Saleor SDK client
│   │   ├── control-plane/   # CP API client
│   │   └── gateway/         # Gateway API client
│   └── styles/
└── README.md
```

Key integrations:
- Saleor SDK for product catalog and checkout
- Control Plane API for instance management
- Gateway API for agent execution
- Keycloak OIDC for authentication

### 2. Create Sample Langflow Flows
- Access Langflow Studio at https://studio.dev.gsv.dev/
- Create a simple chat flow
- Note the flow ID
- Register as offering in Control Plane
- Test execution via Gateway

### 3. Complete Provisioner Integration
- Verify Saleor webhook signature validation
- Test ORDER_FULLY_PAID end-to-end
- Implement instance creation logic
- Implement credit addition logic

---

## Testing Commands

### Test Products API (Public)
```bash
kubectl run curl-products --image=curlimages/curl --rm -it --restart=Never -- \
  curl -s "http://cmp-commerce-api.cmp:8000/graphql/" -X POST \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"{ products(first: 10, channel: \\\"default-channel\\\") { edges { node { name pricing { priceRange { start { gross { amount currency } } } } } } } }\"}"
```

### Test Gateway Runs (requires valid flow_id)
```bash
kubectl run curl-run --image=curlimages/curl --rm -it --restart=Never -- \
  curl -s "http://cmp-gateway.cmp:8000/v1/runs" -X POST \
  -H "Content-Type: application/json" \
  -d "{\"instance_id\": \"<flow-uuid>\", \"input\": {\"query\": \"Hello\"}}"
```

### Get Saleor Admin Token
```bash
kubectl exec -n cmp deployment/cmp-commerce-api -c api -- python3 manage.py shell -c "
from saleor.account.models import User
from saleor.core.jwt import create_access_token
user = User.objects.get(email=admin@dev.gsv.dev)
print(create_access_token(user))
"
```

---

## Architecture Decisions

1. **Saleor for Commerce Only** - Saleor handles catalog, cart, checkout, payments. No provisioning logic in Saleor.

2. **Provisioner as Webhook Handler** - Dedicated service to receive Saleor webhooks and call Control Plane.

3. **Control Plane as Source of Truth** - All instance state, billing, and entitlements managed by Control Plane.

4. **Gateway for Execution** - All agent execution goes through Gateway for auth, billing, and routing.

5. **Runner for Langflow Abstraction** - Runner provides stable interface even if Langflow API changes.

---

## Known Issues

1. **No Sample Flows** - Langflow Runtime has no flows; execution fails with JSON parse error.

2. **Provisioner Not Tested E2E** - Webhook configured but not tested with real order.

3. **No Storefront** - Custom Next.js app not started yet.

4. **ArgoCD May Revert Changes** - Image tags in deployment may be overwritten by ArgoCD sync.

---

## Documentation Updated

- `STATUS.md` - Updated to Phase 3 status
- `PHASE3-HANDOVER.md` - This file (new)

---

*Created: 2025-12-18 15:00 UTC*
*Author: Claude Code*
*Next Session: Build Next.js Storefront*
