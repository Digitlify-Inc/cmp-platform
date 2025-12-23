# CMP Phase 2 Implementation Handover

**Date:** 2025-12-18
**Phase:** 2 - Commerce Plane (Saleor) + Runner + Provisioner
**Status:** COMPLETE

> **IMPORTANT:** Waldur has been DEPRECATED. CMP is now fully based on Saleor.
> - Saleor = Commerce (catalog, checkout, payments, orders)
> - Saleor Dashboard = Admin UI
> - Custom Next.js Storefront = Customer-facing UI (to be built)

---

## Quick Start for Next Session

```bash
# 1. Check cluster status
kubectl get pods -n cmp

# 2. Verify all services are running
kubectl get pods -n cmp | grep -E 'commerce|control-plane|gateway|runner|provisioner'

# 3. Test endpoints
curl -k https://cp.dev.gsv.dev/
curl -k https://api.dev.gsv.dev/
curl -k https://store.dev.gsv.dev/graphql/ -X POST -H 'Content-Type: application/json' -d '{"query": "{ shop { name } }"}'

# 4. Access Saleor Dashboard
# URL: https://admin.dev.gsv.dev/
# Email: admin@dev.gsv.dev
# Password: Admin123!
```

---

## Current Architecture State

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMMERCE PLANE                               │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │   Saleor    │  │   Wagtail   │                               │
│  │ (Commerce)  │  │   (CMS)     │                               │
│  │  store.*    │  │   dev.*     │                               │
│  └──────┬──────┘  └─────────────┘                               │
│         │ OrderFullyPaid webhook                                 │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │ Provisioner │ ─────────────────────────────────────┐         │
│  │  (FastAPI)  │                                       │         │
│  └─────────────┘                                       │         │
├─────────────────────────────────────────────────────────────────┤
│                     PLATFORM PLANE                               │
│                                                         │         │
│                   ┌─────────────────────┐               │         │
│                   │   Control Plane     │◀──────────────┘         │
│                   │   (Django/DRF)      │                         │
│                   │  - Orgs/Projects    │                         │
│                   │  - Offerings        │                         │
│                   │  - Billing/Wallet   │                         │
│                   │  - Instances        │                         │
│                   └──────────┬──────────┘                         │
│                              │                                    │
├─────────────────────────────────────────────────────────────────┤
│                     EXECUTION PLANE                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Gateway   │─▶│   Runner    │─▶│  Langflow   │             │
│  │  (FastAPI)  │  │  (FastAPI)  │  │  Runtime    │             │
│  │   api.*     │  │  internal   │  │  runtime ns │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘

ALL SERVICES NOW DEPLOYED IN cmp NAMESPACE
```

---

## Deployed Services Summary

| Service | Namespace | Host | Status | Notes |
|---------|-----------|------|--------|-------|
| cmp-commerce-api | cmp | store.dev.gsv.dev | Running | Saleor 3.22 + PG 16 |
| cmp-commerce-dashboard | cmp | admin.dev.gsv.dev | Running | Saleor Dashboard |
| cmp-commerce-worker | cmp | internal | Running | Celery (2Gi RAM) |
| cmp-commerce-redis | cmp | internal | Running | Valkey 8.1 |
| cmp-commerce-postgres | cmp | internal | Running | PostgreSQL 16 via CNPG |
| cmp-control-plane | cmp | cp.dev.gsv.dev | Running | Django 5.0 / DRF |
| cmp-gateway | cmp | api.dev.gsv.dev | Running | FastAPI |
| cmp-runner | cmp | internal | Running | FastAPI (Langflow adapter) |
| cmp-provisioner | cmp | internal | Running | FastAPI (Saleor webhook handler) |
| cmp-cms | cmp | dev.gsv.dev | Running | Wagtail CMS |

---

## New Services Built in Phase 2

### 1. Runner Service (FastAPI)

**Location:** `gsv-platform/services/runner/`

**Purpose:** Bridges Gateway to Langflow Runtime
- Fetches flow artifacts from Control Plane
- Executes flows via Langflow API
- Reports usage back to Control Plane

**API Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| /health | GET | Health check |
| /run | POST | Execute a flow |

**Key Files:**
- `app/langflow/client.py` - Langflow Runtime client
- `app/api/run.py` - Run endpoint handler
- `app/config.py` - Configuration (env-based)

### 2. Provisioner Service (FastAPI)

**Location:** `gsv-platform/services/provisioner/`

**Purpose:** Handles Saleor OrderFullyPaid webhooks
- Receives webhook from Saleor on order completion
- Calls Control Plane to provision instances or add credits
- Uses idempotency keys to prevent duplicate processing

**API Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| /health | GET | Health check |
| /webhooks/saleor/order-paid | POST | Handle OrderFullyPaid |

**Key Files:**
- `app/webhooks/saleor.py` - Webhook handler
- `app/cp_client/client.py` - Control Plane client

### 3. Saleor Commerce Stack

**Components:**
- **Saleor API** - GraphQL API (ghcr.io/saleor/saleor:3.22)
- **Saleor Dashboard** - Admin UI (ghcr.io/saleor/saleor-dashboard:3.22.3)
- **Celery Worker** - Background tasks (same as API image)
- **Redis (Valkey)** - Cache and Celery broker
- **PostgreSQL** - Database (CNPG, PG 16)

---

## Important Fixes Applied

### 1. PostgreSQL Version (CRITICAL)
**Problem:** Saleor 3.22 migrations fail on PostgreSQL 18
**Fix:** Downgraded CNPG cluster to PostgreSQL 16
```yaml
spec:
  imageName: ghcr.io/cloudnative-pg/postgresql:16.4
```

### 2. ALLOWED_HOSTS Configuration
**Problem:** 400 Bad Request on GraphQL endpoint
**Fix:** Updated configmap with correct hosts:
```
ALLOWED_HOSTS: store.dev.gsv.dev,cmp-commerce-api.cmp,localhost,127.0.0.1
```

### 3. Ingress Hostname
**Problem:** Ingress had shop.dev.gsv.dev instead of store.dev.gsv.dev
**Fix:** Patched ingress:
```bash
kubectl patch ingress cmp-commerce-api -n cmp --type='json' \
  -p='[{"op":"replace","path":"/spec/rules/0/host","value":"store.dev.gsv.dev"}]'
```

### 4. Worker Memory (OOMKilled)
**Problem:** Celery worker OOMKilled at 512Mi
**Fix:** Increased to 2Gi memory limit

### 5. Root Endpoints
**Problem:** cp.dev.gsv.dev and api.dev.gsv.dev returned 404
**Fix:** Added root views to both services:
- Control Plane: `urls.py` - `root_view()` function
- Gateway: `main.py` - `@app.get("/")`

---

## Saleor Admin Credentials

| Field | Value |
|-------|-------|
| Dashboard URL | https://admin.dev.gsv.dev/ |
| Email | admin@dev.gsv.dev |
| Password | Admin123! |

---

## K8s Manifest Locations

### New Manifests Created:
```
gsv-gitops/platform/base/
├── cmp-commerce/           # Created but may be deleted
├── cmp-runner/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── external-secret.yaml
│   └── kustomization.yaml
├── cmp-provisioner/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   └── kustomization.yaml
└── cnpg/cmp-commerce-postgres/
    ├── cluster.yaml
    ├── credentials-secret.yaml
    └── kustomization.yaml
```

---

## Next Steps (Phase 3)

### 1. Configure Saleor Products
- Create product types for offerings
- Create products representing AI agents
- Configure variants for different plans (Basic, Pro, Enterprise)
- Set up pricing with credit-based values

### 2. Wire Up Provisioner Webhook
- Configure Saleor webhook for ORDER_FULLY_PAID
- Point to: `http://cmp-provisioner.cmp:8000/webhooks/saleor/order-paid`
- Test end-to-end flow

### 3. Integrate Gateway with Runner
- Gateway calls Runner for flow execution
- Runner fetches artifacts from Control Plane
- Runner calls Langflow Runtime

### 4. Complete Control Plane APIs
- Instance provisioning from Provisioner
- Credit purchase handling
- Usage tracking and billing

### 5. Build Custom Storefront (Next.js)
- Build Next.js storefront using Saleor SDK
- Connect to Saleor GraphQL for catalog/checkout
- Connect to Control Plane for instance management
- Connect to Gateway for agent execution

> **NOTE:** Waldur has been DEPRECATED. The frontend will be a custom Next.js app built on Saleor.

---

## Known Issues Still Pending

### 1. ENABLE_SSL Redirect
The Saleor API has ENABLE_SSL=False now but may need adjustment for production HTTPS.

### 2. DNS Resolution
`store.dev.gsv.dev` may not resolve from outside the cluster. Add to `/etc/hosts` for local testing:
```
127.0.0.1 store.dev.gsv.dev admin.dev.gsv.dev cp.dev.gsv.dev api.dev.gsv.dev dev.gsv.dev
```

### 3. TLS Certificates
Some ingresses may still need mkcert-ca certificates generated.

---

## Development Commands

### Build and Load Images (KinD)
```bash
# Build
cd /workspace/repo/github.com/GSVDEV/gsv-platform/services/control-plane
docker build -t ghcr.io/gsvdev/cmp-control-plane:latest .

cd /workspace/repo/github.com/GSVDEV/gsv-platform/services/gateway
docker build -t ghcr.io/gsvdev/cmp-gateway:latest .

# Load into KinD
kind load docker-image ghcr.io/gsvdev/cmp-control-plane:latest --name kind-gsv
kind load docker-image ghcr.io/gsvdev/cmp-gateway:latest --name kind-gsv
```

### Restart Deployments
```bash
kubectl rollout restart deployment cmp-commerce-api cmp-commerce-worker -n cmp
kubectl rollout restart deployment cmp-control-plane cmp-gateway -n cmp
```

### Check Logs
```bash
kubectl logs -n cmp deployment/cmp-commerce-api -c api --tail=50
kubectl logs -n cmp deployment/cmp-control-plane --tail=50
kubectl logs -n cmp deployment/cmp-gateway --tail=50
```

### Run Saleor Migrations
```bash
kubectl exec -n cmp deployment/cmp-commerce-api -c api -- python manage.py migrate --noinput
```

### Create Saleor Superuser
```bash
kubectl exec -n cmp deployment/cmp-commerce-api -c api -- python manage.py createsuperuser --noinput --email=admin@dev.gsv.dev
```

---

## Files Reference

| Purpose | Location |
|---------|----------|
| Control Plane code | `gsv-platform/services/control-plane/` |
| Gateway code | `gsv-platform/services/gateway/` |
| Runner code | `gsv-platform/services/runner/` |
| Provisioner code | `gsv-platform/services/provisioner/` |
| K8s manifests | `gsv-gitops/platform/base/cmp-*` |
| Architecture docs | `gsv-platform/docs/cmp/02-Architecture.md` |
| Phase 1 handover | `gsv-platform/docs/cmp/PHASE1-HANDOVER.md` |

---

*Last Updated: 2025-12-18 12:30 UTC*
*Status: Phase 2 Commerce Deployment Complete*
*Next: Configure Saleor products, wire webhooks, integrate frontend*
