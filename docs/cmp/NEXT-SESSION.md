# Next Session Guide

**Created:** 2025-12-18
**Purpose:** Quick start for next Claude Code session

---

## Context

Phase 0 (Foundation) is complete. All file changes made but NOT applied to cluster yet.

## Immediate Actions

### 1. Apply Namespace Migration

```bash
# Delete old ArgoCD apps first
kubectl delete application agentstudio agentruntime ragflow website -n argocd
kubectl delete application cnpg-agentstudio cnpg-agentruntime cnpg-website -n argocd

# Delete old namespaces
kubectl delete ns agentstudio agentruntime ragflow website

# Sync platform-apps (creates new apps with new names)
argocd app sync platform-apps

# Verify
kubectl get applications -n argocd | grep -E "studio|runtime|rag|cmp"
kubectl get ns | grep -E "^studio|^runtime|^rag|^cmp"
```

### 2. Start Phase 1 - Control Plane

Create the Control Plane Django service:

```
gsv-platform/services/control-plane/
├── Dockerfile
├── requirements.txt
├── manage.py
└── control_plane/
    ├── __init__.py
    ├── settings.py
    ├── urls.py
    ├── wsgi.py
    ├── orgs/           # Organization, Project, Team
    ├── offerings/      # Offering, OfferingVersion
    ├── instances/      # Instance lifecycle
    └── billing/        # Wallet, LedgerEntry
```

Key APIs to implement:
- POST /orgs/auto - Auto-create workspace
- GET/POST /offerings - List/create offerings
- GET/POST /instances - Instance management
- POST /billing/authorize, /billing/settle

### 3. Create K8s Manifests

```
gsv-gitops/platform/base/cmp-control-plane/
├── deployment.yaml
├── service.yaml
├── ingress.yaml
├── configmap.yaml
├── external-secret.yaml
└── kustomization.yaml
```

---

## Key Files to Read

1. `gsv-platform/docs/cmp/IMPLEMENTATION-PLAN.md` - Full architecture
2. `gsv-platform/docs/cmp/STATUS.md` - Current status
3. `gsv-gitops/docs/NAMESPACE-MIGRATION.md` - Migration steps
4. `gsv-platform/docs/cmp/07-Control-Plane-API.md` - API specs

---

## Role-Based Naming (Quick Reference)

| Role | Namespace | Service |
|------|-----------|---------|
| studio | studio | Langflow IDE |
| runtime | runtime | Langflow execution |
| rag | rag | Ragflow |
| sso | sso | Keycloak |
| vault | vault | Vault + ESO |
| cms | cmp | cmp-cms (Wagtail) |
| commerce | cmp | cmp-commerce (Saleor) |

---

## Repos

- **gsv-platform**: Code + docs (active)
- **gsv-gitops**: K8s manifests (active)
- **cmp-frontend/backend**: Deprecated (CI disabled)

---

*Start here in next session!*
