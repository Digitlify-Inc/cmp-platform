# GSV Platform Deployment Guide

Complete guide for deploying the GSV Platform on any supported OS.

---

## Quick Start

### First Time Setup (One-time)

**Ubuntu/WSL2:**
```bash
git clone https://github.com/GSVDEV/gsv-gitops.git
cd gsv-gitops
make ubuntu.setup.all   # Installs tools + configures DNS
```

**macOS:**
```bash
git clone https://github.com/GSVDEV/gsv-gitops.git
cd gsv-gitops
make macos.setup        # Installs tools + configures DNS
```

### Deploy Platform

```bash
make deploy-dev
```

That's it! The platform will be available at:
- ArgoCD: https://argocd.dev.gsv.dev
- Keycloak: https://sso.dev.gsv.dev
- Portal: https://portal.dev.gsv.dev
- Studio: https://studio.dev.gsv.dev
- Grafana: https://grafana.dev.gsv.dev

---

## What `make deploy-dev` Does

1. **Creates Kind Cluster** - 3-node cluster with port mappings
2. **Installs Traefik** - Ingress controller on NodePorts 30080/30443
3. **Installs cert-manager** - With self-signed CA for TLS
4. **Installs ArgoCD** - GitOps controller
5. **Bootstraps GitOps** - Creates root Application pointing to this repo
6. **Updates DNS** - Configures dnsmasq to resolve *.dev.gsv.dev

ArgoCD then deploys all platform apps automatically:
- CNPG Operator + PostgreSQL clusters
- Keycloak Operator + Keycloak IdP
- Waldur CMP
- AgentStudio (Langflow)
- AgentRuntime
- Prometheus + Grafana (Observability)
- Velero + MinIO (Backup)

---

## Credentials

See [CREDENTIALS.md](reference/CREDENTIALS.md) for all default credentials.

**Quick access:**
```bash
# ArgoCD admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d && echo

# Keycloak admin password
kubectl -n keycloak get secret digitlify-idp-initial-admin -o jsonpath='{.data.password}' | base64 -d && echo

# Platform status
make status
```

---

## Troubleshooting

### DNS not resolving

If `*.dev.gsv.dev` doesn't resolve:

```bash
# Update dnsmasq after cluster is running
make ubuntu.setup.dns-update

# Or check dnsmasq status
sudo systemctl status dnsmasq

# Manual fallback - add to /etc/hosts
echo "172.20.0.1 argocd.dev.gsv.dev sso.dev.gsv.dev portal.dev.gsv.dev studio.dev.gsv.dev grafana.dev.gsv.dev" | sudo tee -a /etc/hosts
```

### ArgoCD apps not syncing

```bash
# Check ArgoCD applications
kubectl get applications -n argocd

# Force refresh
kubectl -n argocd patch app gsv-root --type merge -p '{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}'

# Check logs
kubectl -n argocd logs -l app.kubernetes.io/name=argocd-application-controller --tail=50
```

### Pods stuck or failing

```bash
# Check all pods
kubectl get pods -A | grep -v Running

# Check specific namespace
kubectl describe pods -n <namespace>
kubectl logs <pod-name> -n <namespace>
```

---

## Reset & Cleanup

```bash
# Delete cluster (preserves tools)
make clean

# Full reset
make reset
```

---

## Advanced: Manual Steps

If you prefer to run steps individually:

```bash
# 1. Create cluster
make kind.up

# 2. Install ingress
make ingress.setup

# 3. Install ArgoCD
make argocd.install

# 4. Bootstrap GitOps
make gitops.bootstrap

# 5. Update DNS
make ubuntu.setup.dns-update   # or macos equivalent
```

---

*Last Updated: November 27, 2025*
