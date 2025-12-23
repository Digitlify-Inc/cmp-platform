# P0 GTM Fixes - Long-Term GitOps Solution

**Date:** 2025-12-22
**Status:** Implementation Complete
**Next:** Apply changes, verify in cluster

---

## Overview

This document describes the GitOps-based solutions for the four P0 blockers identified in the GTM audit:

1. **Connector/MCP Gateway Missing** - External tool calls blocked
2. **Ragflow Broken** - Architecture mismatch (exec format error)
3. **Saleor → Provisioner Webhook Not Wired** - Order provisioning broken
4. **Wallet/Credits Integration Incomplete** - Billing flow unverified

---

## 1. Connector/MCP Gateway

### Problem
Agents cannot use external connectors (Zendesk, Slack, HubSpot, etc.) because the Connector Gateway service was not deployed.

### Solution
Created complete GitOps manifests for the Connector/MCP Gateway service:

**Files Created:**
```
gsv-gitops/platform/base/cmp-connector/
├── kustomization.yaml
├── deployment.yaml        # 2 replicas, ServiceAccount, security context
├── service.yaml           # ClusterIP on port 8000
├── configmap.yaml         # Vault paths, timeouts, policy enforcement
├── external-secret.yaml   # Service JWT from Vault
└── networkpolicy.yaml     # Ingress from runtime/runner, egress to Vault/CP/external

gsv-gitops/platform/overlays/dev/cmp-connector/
├── kustomization.yaml
└── deployment-patch.yaml  # Debug mode for dev

gsv-gitops/platform/apps/dev/cmp-connector.yaml  # ArgoCD Application
```

### Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐
│ Langflow Runtime│───▶│ Connector Gateway │───▶│   Vault     │
│  (tool.invoke)  │    │  (policy check)   │    │ (secrets)   │
└─────────────────┘    └────────┬───────────┘    └─────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  External APIs   │
                       │ (Zendesk, Slack) │
                       └─────────────────┘
```

### Key Features
- **Vault-backed secrets**: Connector credentials stored at `kv/data/connectors/{org}/{project}/{binding}`
- **Policy enforcement**: Tool allowlists fetched from Control Plane
- **Audit logging**: All tool invocations logged
- **Network isolation**: NetworkPolicy restricts ingress/egress

### Vault Secrets Required
```bash
vault kv put secret/cmp/connector \
  service_jwt_secret="<generated>"
```

---

## 2. Ragflow Architecture Fix

### Problem
Ragflow pod in CrashLoopBackOff with `exec format error` - the ARM64 image was being used on AMD64 (WSL2/KinD).

### Root Cause
The overlay used `dev-slim-arm64` tag which is incompatible with x86_64 nodes.

### Solution
Updated the overlay to use multi-arch images with explicit node selector:

**Files Modified:**
```
gsv-gitops/platform/overlays/dev/rag/kustomization.yaml
  - Changed image tag from "dev-slim-arm64" to "v0.15.1" (multi-arch)
  - Added deployment-arch-patch.yaml to patches

gsv-gitops/platform/overlays/dev/rag/deployment-arch-patch.yaml (NEW)
  - Node selector: kubernetes.io/arch: amd64
  - imagePullPolicy: Always
  - runAsUser: 0 (Ragflow requirement)
```

### How It Works
```yaml
# deployment-arch-patch.yaml
spec:
  template:
    spec:
      nodeSelector:
        kubernetes.io/arch: amd64  # Forces amd64 image on WSL2/KinD
      containers:
        - name: rag
          imagePullPolicy: Always  # Ensures fresh pull of correct arch
```

### Verification
```bash
# After ArgoCD sync:
kubectl get pods -n rag -l app=rag
# Should show Running, not CrashLoopBackOff

kubectl logs -n rag -l app=rag --tail=20
# Should show Ragflow startup, not "exec format error"
```

---

## 3. Saleor → Provisioner Webhook Wiring

### Problem
Saleor `OrderFullyPaid` webhook was not configured to call the Provisioner service.

### Solution
Created GitOps manifests for:
1. **Provisioner Service** - Codified existing imperative deployment
2. **Webhook Setup Job** - Automatically configures Saleor webhooks

**Files Created:**
```
gsv-gitops/platform/base/cmp-provisioner/
├── kustomization.yaml
├── deployment.yaml        # 2 replicas, security context
├── service.yaml           # ClusterIP on port 8000
├── configmap.yaml         # Control Plane URL, retry config
└── external-secret.yaml   # Webhook secret, service JWT

gsv-gitops/platform/overlays/dev/cmp-provisioner/
├── kustomization.yaml
└── deployment-patch.yaml

gsv-gitops/platform/apps/dev/cmp-provisioner.yaml

gsv-gitops/platform/base/cmp-commerce/webhook-setup-job.yaml (NEW)
  - PostSync ArgoCD hook
  - Creates Saleor App "CMP Provisioner"
  - Configures webhooks: OrderFullyPaid, OrderCreated, OrderCancelled
```

### Webhook Configuration
```python
# Webhooks created by setup job:
{
    "name": "OrderFullyPaid",
    "target_url": "http://cmp-provisioner.cmp.svc.cluster.local:8000/webhooks/order-fully-paid",
    "events": [WebhookEventAsyncType.ORDER_FULLY_PAID],
},
{
    "name": "OrderCreated",
    "target_url": "http://cmp-provisioner.cmp.svc.cluster.local:8000/webhooks/order-created",
    "events": [WebhookEventAsyncType.ORDER_CREATED],
},
{
    "name": "OrderCancelled",
    "target_url": "http://cmp-provisioner.cmp.svc.cluster.local:8000/webhooks/order-cancelled",
    "events": [WebhookEventAsyncType.ORDER_CANCELLED],
}
```

### Vault Secrets Required
```bash
vault kv put secret/cmp/provisioner \
  saleor_webhook_secret="<shared-with-saleor>" \
  service_jwt_secret="<for-cp-auth>"
```

---

## 4. Wallet/Credits Integration

### Problem
Gateway billing endpoints not properly configured to call Control Plane.

### Solution
Enhanced Gateway ConfigMap with complete billing configuration:

**File Modified:**
```
gsv-gitops/platform/base/cmp-gateway/configmap.yaml
```

### Configuration Added
```yaml
# Billing/Credits Configuration
BILLING_ENABLED: "true"
BILLING_AUTHORIZE_PATH: "/billing/authorize"
BILLING_SETTLE_PATH: "/billing/settle"
BILLING_MAX_RETRIES: "3"
BILLING_RETRY_BACKOFF_SECONDS: "1"
BILLING_TIMEOUT: "5"

# Entitlements caching
ENTITLEMENTS_CACHE_TTL_SECONDS: "60"
ENTITLEMENTS_PATH: "/instances/{id}/entitlements"

# Rate limiting
RATE_LIMIT_ENABLED: "true"
RATE_LIMIT_REQUESTS_PER_MINUTE: "60"
```

### Billing Flow
```
┌─────────┐    ┌─────────┐    ┌───────────────┐    ┌────────┐
│  Buyer  │───▶│ Gateway │───▶│ Control Plane │───▶│ Runner │
└─────────┘    └────┬────┘    └───────────────┘    └────────┘
                    │              ▲
                    │  1. authorize│
                    │              │
                    │  3. settle   │
                    └──────────────┘
```

1. Gateway calls `POST /billing/authorize` before execution
2. If `allowed=true`, Gateway calls Runner
3. After execution, Gateway calls `POST /billing/settle` with usage

---

## Vault Secrets Summary

All new secrets added to `vault-secrets-seed-job.yaml`:

```bash
# Connector Gateway
vault kv put secret/cmp/connector service_jwt_secret=...

# Provisioner
vault kv put secret/cmp/provisioner \
  saleor_webhook_secret=... \
  service_jwt_secret=...

# Runner
vault kv put secret/cmp/runner \
  langflow_api_key=... \
  openai_api_key=...

# MinIO (artifact storage)
vault kv put secret/cmp/minio \
  access_key=cmp-artifacts \
  secret_key=...
```

---

## Deployment Sequence

### Step 1: Commit Changes
```bash
cd /workspace/repo/github.com/GSVDEV/gsv-gitops
git add -A
git commit -m "feat(cmp): Add P0 GTM fixes - connector, provisioner, ragflow, billing"
git push origin main
```

### Step 2: Sync ArgoCD (automatic with selfHeal)
```bash
# Or manually:
argocd app sync platform-apps
argocd app sync rag
argocd app sync cmp-provisioner
argocd app sync cmp-connector
argocd app sync cmp-commerce  # Triggers webhook setup job
argocd app sync cmp-gateway
```

### Step 3: Verify Vault Secrets
```bash
# Ensure Vault secrets are seeded
kubectl get jobs -n vault | grep vault-secrets-seed
kubectl logs -n vault job/vault-secrets-seed | grep -E "(cmp/connector|cmp/provisioner)"
```

### Step 4: Verify Deployments
```bash
# All CMP pods should be Running
kubectl get pods -n cmp

# Ragflow should be Running (not CrashLoopBackOff)
kubectl get pods -n rag -l app=rag

# Check webhook setup job
kubectl get jobs -n cmp | grep webhook-setup
kubectl logs -n cmp job/cmp-commerce-webhook-setup
```

### Step 5: Run E2E Tests
```bash
cd /workspace/repo/github.com/GSVDEV/gsv-platform/docs/cmp
k6 run \
  -e API_BASE="http://api.dev.gsv.dev" \
  -e CP_BASE="http://cp.dev.gsv.dev" \
  -e USER_JWT="<token>" \
  -e SERVICE_JWT="<token>" \
  -e OFFERING_VERSION_ID="ov_100" \
  -e PLAN_ID="pro" \
  gsv-agent-store-k6-smoke.js
```

---

## Test Cases Unblocked

| Test | Before | After |
|------|--------|-------|
| T1: Order paid → instance | May fail | Should pass |
| T4: Credits debit | Unknown | Should pass |
| T5: Top-up unblocks | Unknown | Should pass |
| T6: Connector binding | Blocked | Should pass |
| T7: RAG isolation | Blocked | Should pass |

---

## Rollback

If issues occur, revert to previous commit:
```bash
cd /workspace/repo/github.com/GSVDEV/gsv-gitops
git revert HEAD
git push origin main
argocd app sync platform-apps --prune
```

---

## Next Steps

1. **Apply changes** - Commit and push to trigger ArgoCD sync
2. **Monitor ArgoCD** - Watch for sync errors
3. **Verify Ragflow** - Confirm no more exec format error
4. **Test E2E** - Run k6 smoke tests
5. **Update documentation** - Mark P0 blockers as resolved
