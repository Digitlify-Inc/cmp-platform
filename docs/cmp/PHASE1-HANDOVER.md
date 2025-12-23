# CMP Phase 1 Implementation Handover

**Date:** 2025-12-18
**Phase:** 1 - Control Plane MVP (COMPLETE)
**Next:** Phase 2/3 - Saleor Commerce + Runner

---

## Quick Start for Next Session

```bash
# 1. Check cluster status
kubectl get pods -n cmp

# 2. Verify ArgoCD apps
kubectl get applications -n argocd | grep cmp

# 3. Test health endpoints (containers don't have curl, use test pod)
kubectl run test-curl --image=curlimages/curl --rm -it --restart=Never -- \
  curl -s http://cmp-control-plane.cmp:8000/health/

kubectl run test-curl2 --image=curlimages/curl --rm -it --restart=Never -- \
  curl -s http://cmp-gateway.cmp:8000/health

# 4. Port forward for local testing
kubectl port-forward -n cmp svc/cmp-control-plane 8001:8000 &
kubectl port-forward -n cmp svc/cmp-gateway 8002:8000 &
```

---

## CMP Architecture Overview

**CMP = Cloud Marketplace Platform** (Saleor++ - pivot from Waldur)

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMMERCE PLANE                               │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │   Saleor    │  │   Wagtail   │  <- NOT DEPLOYED YET          │
│  │  (Store)    │  │   (CMS)     │  <- cmp-cms DEPLOYED          │
│  └──────┬──────┘  └─────────────┘                               │
│         │ OrderFullyPaid webhook                                 │
│         ▼                                                        │
├─────────────────────────────────────────────────────────────────┤
│                     PLATFORM PLANE                               │
│  ┌─────────────┐  ┌─────────────────────┐                       │
│  │ Provisioner │─▶│   Control Plane     │  <- DEPLOYED          │
│  │  (FastAPI)  │  │   (Django/DRF)      │                       │
│  └─────────────┘  │  - Orgs/Projects    │                       │
│   NOT DEPLOYED    │  - Offerings        │                       │
│                   │  - Billing/Wallet   │                       │
│                   │  - Instances        │                       │
│                   └──────────┬──────────┘                       │
│                              │                                   │
├─────────────────────────────────────────────────────────────────┤
│                     EXECUTION PLANE                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Gateway   │─▶│   Runner    │─▶│  Langflow   │             │
│  │  (FastAPI)  │  │  (FastAPI)  │  │  Runtime    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│     DEPLOYED       NOT DEPLOYED      DEPLOYED (runtime ns)      │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principle:** Saleor sells; Control Plane provisions; Gateway executes.

---

## What's Deployed vs. Not Deployed

### DEPLOYED (Phase 1 Complete)

| Service | Namespace | Host | Status |
|---------|-----------|------|--------|
| cmp-cms (Wagtail) | cmp | dev.gsv.dev | Running, TLS pending |
| cmp-control-plane | cmp | cp.dev.gsv.dev | Running, TLS Ready |
| cmp-gateway | cmp | api.dev.gsv.dev | Running, TLS Ready |
| cmp-control-plane-postgres | cmp | internal | Running |
| cmp-cms-postgres | cmp | internal | Running |

### NOT YET DEPLOYED (Per Implementation Plan)

| Service | Namespace | Host | Phase | Priority |
|---------|-----------|------|-------|----------|
| **Saleor (cmp-commerce)** | cmp | store.dev.gsv.dev | Phase 3 | **P0** |
| cmp-runner | cmp | internal | Phase 2 | P1 |
| cmp-web (Next.js) | cmp | TBD | Phase 3 | P0 |
| cmp-provisioner | cmp | internal | Phase 3 | P1 |
| cmp-connector | cmp | internal | Phase 2 | P1 |

---

## Saleor Deployment Requirements

**Saleor is CRITICAL for CMP** - it's the Commerce Plane that handles:
- Store/catalog (products = offerings, variants = plans)
- Checkout flow
- Payment processing
- Order management
- Credit pack sales

### To Deploy Saleor:

1. **Vendor Saleor Helm chart:**
   ```
   gsv-gitops/charts/saleor/
   ```

2. **Create K8s manifests:**
   ```
   gsv-gitops/platform/base/cmp-commerce/
   ├── deployment.yaml      # Saleor API + Dashboard
   ├── service.yaml
   ├── ingress.yaml         # store.dev.gsv.dev
   ├── configmap.yaml
   ├── external-secret.yaml
   └── kustomization.yaml
   ```

3. **Create ArgoCD app:**
   ```
   gsv-gitops/platform/apps/dev/cmp-commerce.yaml
   ```

4. **Configure products/variants** for offerings

5. **Build Provisioner service** to handle OrderFullyPaid webhooks

### Saleor Components Needed:
- Saleor Core (API)
- Saleor Dashboard (Admin UI)
- Saleor Storefront (or custom Next.js)
- PostgreSQL database (via CNPG)
- Redis (for Celery tasks)

---

## Current Cluster State

```
ArgoCD Apps (31 total):
- cmp-cms                  Synced   Healthy
- cmp-control-plane        Synced   Healthy
- cmp-gateway              Synced   Healthy
- cnpg-cmp-cms             Synced   Healthy
- cnpg-cmp-control-plane   Synced   Healthy

Pods (namespace: cmp):
- cmp-cms-xxx                        Running  (1 replica)
- cmp-cms-postgres-1                 Running
- cmp-cms-postgres-2                 Running
- cmp-control-plane-xxx              Running  (2 replicas)
- cmp-gateway-xxx                    Running  (2 replicas)
- cmp-control-plane-postgres-1       Running

TLS Certificates:
- cmp-control-plane-tls   Ready
- cmp-gateway-tls         Ready
- dev-gsv-dev-tls         Not Ready (cmp-cms needs mkcert-ca fix)
```

---

## What Was Completed in Phase 1

### 1. Control Plane Service (Django 5.0 / DRF)

**Location:** `gsv-platform/services/control-plane/`

**Apps Created:**
- `orgs` - Organization, Project, Team, Membership models
- `billing` - Wallet, LedgerEntry, Reservation models
- `offerings` - Offering, OfferingVersion, Plan models
- `instances` - Instance, APIKey models
- `connectors` - ConnectorBinding (stub)
- `integrations` - IdempotencyRecord (stub for Saleor webhooks)

**API Endpoints:**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /health/ | GET | No | Health check |
| /orgs/ | GET/POST | JWT | Organizations CRUD |
| /orgs/{id}/projects/ | GET/POST | JWT | Projects CRUD |
| /offerings/ | GET/POST | JWT | Offerings catalog |
| /instances/ | GET/POST | JWT | Instance lifecycle |
| /wallets/ | GET | JWT | Wallet balance |
| /billing/authorize | POST | JWT | Reserve credits |
| /billing/settle | POST | JWT | Settle usage |

### 2. Gateway Service (FastAPI)

**Location:** `gsv-platform/services/gateway/`

**API Endpoints:**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /health | GET | No | Health check |
| /v1/runs | POST | JWT | Execute agent run |
| /v1/widget/session:init | POST | JWT | Init chat widget |

### 3. Kubernetes Manifests

**Location:** `gsv-gitops/platform/`

```
├── base/
│   ├── cmp-control-plane/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml        # cp.dev.gsv.dev
│   │   ├── configmap.yaml
│   │   ├── external-secret.yaml
│   │   └── kustomization.yaml
│   ├── cmp-gateway/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml        # api.dev.gsv.dev
│   │   ├── configmap.yaml
│   │   └── kustomization.yaml
│   └── cnpg/cmp-control-plane-postgres/
│       ├── cluster.yaml
│       ├── credentials-secret.yaml
│       └── kustomization.yaml
├── overlays/dev/
│   ├── cmp-control-plane/
│   │   ├── kustomization.yaml
│   │   └── deployment-patch.yaml  # imagePullPolicy: IfNotPresent
│   └── cmp-gateway/
│       ├── kustomization.yaml
│       └── deployment-patch.yaml
└── apps/dev/
    ├── cmp-control-plane.yaml
    ├── cmp-gateway.yaml
    └── cnpg-cmp-control-plane.yaml
```

---

## Known Issues & Fixes Applied

### 1. TLS Certificate Issuer
**Problem:** Ingresses referenced `letsencrypt-prod` but only `mkcert-ca` exists
**Fix:** Changed `cert-manager.io/cluster-issuer: mkcert-ca` in ingress.yaml files
**Status:** Fixed for cmp-control-plane and cmp-gateway; cmp-cms still needs fix

### 2. ImagePullBackOff in KinD
**Problem:** Pods couldn't pull from ghcr.io
**Fix:** Created `deployment-patch.yaml` with `imagePullPolicy: IfNotPresent`

### 3. ALLOWED_HOSTS Bad Request
**Problem:** Health probes failed (Host header = pod IP)
**Fix:** Set `ALLOWED_HOSTS="*"` in deployment env

### 4. Gateway Import Error
**Problem:** `jwt_auth` not exported from auth module
**Fix:** Added to `app/auth/__init__.py`

### 5. CNPG PVC Pending
**Problem:** Wrong storage class `local-path`
**Fix:** Changed to `storageClass: standard`

### 6. Structlog TypeError
**Problem:** `'str' object is not callable` in logging
**Fix:** Replaced structlog with standard Django verbose format

---

## Key Design Decisions

### 1. Credit-Based Billing
- Wallet per organization
- Synchronous authorize/settle pattern
- Reservations prevent overspend
- LedgerEntry for audit trail

### 2. Multi-Tenant Hierarchy
```
Organization (billing owner)
  └── Project (isolation boundary)
       └── Instance (agent subscription)
            └── APIKey (access credential)
```

### 3. JWT Authentication
- Keycloak OIDC issuer: `https://sso.dev.gsv.dev/realms/gsv`
- Claims: sub, email, org_uuid
- Auto-provisioning on first request

### 4. Namespace Strategy
- `cmp` namespace for ALL CMP services (unified)
- Role-based naming: studio, runtime, rag, sso, vault, storage

---

## Development Commands

### Build Docker Images
```bash
# Control Plane
cd /mnt/c/workspace/repo/github.com/GSVDEV/gsv-platform/services/control-plane
docker build -t ghcr.io/gsvdev/cmp-control-plane:latest .

# Gateway
cd /mnt/c/workspace/repo/github.com/GSVDEV/gsv-platform/services/gateway
docker build -t ghcr.io/gsvdev/cmp-gateway:latest .

# Load into KinD
kind load docker-image ghcr.io/gsvdev/cmp-control-plane:latest --name kind-gsv
kind load docker-image ghcr.io/gsvdev/cmp-gateway:latest --name kind-gsv
```

### Run Migrations
```bash
kubectl exec -n cmp deploy/cmp-control-plane -- python manage.py migrate
```

### Check Logs
```bash
kubectl logs -n cmp -l app=cmp-control-plane -f
kubectl logs -n cmp -l app=cmp-gateway -f
```

---

## Next Session Priorities

### Option A: Deploy Saleor (Phase 3 moved up)
1. Vendor Saleor Helm chart
2. Create cmp-commerce manifests
3. Deploy to cluster
4. Configure products/variants
5. Build Provisioner service

### Option B: Continue Phase 2
1. Build Runner service (Langflow adapter)
2. Build Connector Gateway (Vault-backed tools)
3. Configure Keycloak OIDC clients

### Recommended: Option A
Saleor is critical for the complete flow. Without it, there's no way to:
- Browse/buy offerings
- Process payments
- Trigger provisioning webhooks

---

## Files Reference

| Purpose | Location |
|---------|----------|
| Control Plane code | `gsv-platform/services/control-plane/` |
| Gateway code | `gsv-platform/services/gateway/` |
| K8s manifests | `gsv-gitops/platform/base/cmp-*` |
| Dev overlays | `gsv-gitops/platform/overlays/dev/cmp-*` |
| ArgoCD apps | `gsv-gitops/platform/apps/dev/cmp-*.yaml` |
| Architecture docs | `gsv-platform/docs/cmp/02-Architecture.md` |
| Implementation plan | `gsv-platform/docs/cmp/IMPLEMENTATION-PLAN.md` |
| Status tracking | `gsv-platform/docs/cmp/STATUS.md` |

---

## Vault Secrets

| Path | Keys |
|------|------|
| secret/cmp/control-plane | database_url, django_secret_key, s3_access_key, s3_secret_key |
| secret/cmp/postgres | username, password |

---

*Last Updated: 2025-12-18 11:00 UTC*
*Next Session: Deploy Saleor Commerce*
