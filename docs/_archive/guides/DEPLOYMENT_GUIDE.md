# GSV Platform Deployment Guide

**Version:** 1.0
**Last Updated:** December 2024
**Audience:** DevOps Engineers, Platform Engineers

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Environment Configuration](#2-environment-configuration)
3. [Local Development (Kind)](#3-local-development-kind)
4. [Proxmox Home Lab Deployment](#4-proxmox-home-lab-deployment)
5. [Hetzner Cloud Deployment](#5-hetzner-cloud-deployment)
6. [Custom Domain Configuration](#6-custom-domain-configuration)
7. [Environment Promotion](#7-environment-promotion)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Introduction

### 1.1 Deployment Architecture

The GSV Platform supports three deployment targets:

| Provider | Use Case | Load Balancer | DNS | Storage |
|----------|----------|---------------|-----|---------|
| **Kind** | Local development | MetalLB | Local (dnsmasq/hosts) | Local path |
| **Proxmox** | Home lab / On-premises | MetalLB | Local DNS / PiHole | Longhorn |
| **Hetzner** | Production cloud | Hetzner LB | Cloudflare | Hetzner Volumes |

### 1.2 Make Commands Overview

```bash
# Current available commands
make help                    # Show all available commands

# Development
make deploy-dev              # Full dev deployment (Kind cluster)
make status                  # Show platform status
make smoke                   # Run smoke tests

# Promotion
make promote.qa              # Promote dev → qa
make promote.prod            # Promote qa → prod (requires confirmation)
make promote.status          # Show version status across environments

# Cluster Management
make kind.up                 # Create Kind cluster
make kind.down               # Delete Kind cluster
make clean                   # Full cleanup
```

### 1.3 Deployment Commands by Environment

| Command | Environment | Current Status |
|---------|-------------|----------------|
| `make deploy-dev` | Development (Kind) | **Implemented** |
| `make deploy-qa` | QA (Proxmox/Hetzner) | Planned |
| `make deploy-prod` | Production (Hetzner) | Planned |

> **Note:** Currently, `deploy-qa` and `deploy-prod` are not yet implemented as separate make targets. The platform uses GitOps (ArgoCD) with environment overlays. See [Section 7: Environment Promotion](#7-environment-promotion).

---

## 2. Environment Configuration

### 2.1 Configuration Files

```
gsv-gitops/
├── .env.example              # Template for secrets
├── .env                      # Local secrets (gitignored)
├── scripts/env.sh            # Domain and environment variables
├── defaults/
│   └── providers/
│       ├── hetzner.yaml      # Hetzner-specific defaults
│       └── proxmox.yaml      # Proxmox-specific defaults
├── platform/
│   └── overlays/
│       ├── dev/              # Development environment
│       ├── qa/               # QA environment
│       └── prod/             # Production environment
└── charts/
    └── cmp/
        ├── values.yaml           # Base values
        ├── values-cmp-dev.yaml   # Dev overrides
        ├── values-cmp-qa.yaml    # QA overrides
        └── values-cmp-prod.yaml  # Prod overrides
```

### 2.2 .env Configuration

Create a `.env` file from the template:

```bash
cp .env.example .env
```

**Required Variables:**

```bash
# =============================================================================
# REQUIRED SECRETS
# =============================================================================

# GitHub Personal Access Token (for ArgoCD to access private repos)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# =============================================================================
# DEPLOYMENT CONFIGURATION
# =============================================================================

# Provider: kind | proxmox | hetzner
PROVIDER=kind

# Environment: dev | qa | prod
ENVIRONMENT=dev

# =============================================================================
# CLOUD PROVIDER TOKENS (Required for cloud deployments)
# =============================================================================

# Cloudflare API Token (for DNS management)
CLOUDFLARE_TOKEN=your_cloudflare_token

# Hetzner Cloud Token (for Hetzner deployments)
HCLOUD_TOKEN=your_hetzner_token

# =============================================================================
# OPTIONAL OVERRIDES
# =============================================================================

# Override base domain (defaults based on environment)
# dev: dev.gsv.dev
# qa: qa.gsv.dev
# prod: digitlify.com
# BASE_DOMAIN=custom.domain.com
```

### 2.3 scripts/env.sh - Domain Configuration

The `scripts/env.sh` file is the **single source of truth** for all domain settings:

```bash
# Base domain - all environments are subdomains of this
: "${BASE_DOMAIN:=gsv.dev}"

# Environment subdomains
: "${DEV_ENV:=dev}"
: "${QA_ENV:=qa}"

# Full environment domains
: "${DEV_DOMAIN:=${DEV_ENV}.${BASE_DOMAIN}}"   # dev.gsv.dev
: "${QA_DOMAIN:=${QA_ENV}.${BASE_DOMAIN}}"     # qa.gsv.dev

# Platform Services (dev environment)
: "${KEYCLOAK_FQDN:=sso.${DEV_DOMAIN}}"        # sso.dev.gsv.dev
: "${WALDUR_FQDN:=portal.${DEV_DOMAIN}}"       # portal.dev.gsv.dev
: "${AGENTSTUDIO_FQDN:=studio.${DEV_DOMAIN}}"  # studio.dev.gsv.dev
: "${AGENTRUNTIME_FQDN:=runtime.${DEV_DOMAIN}}" # runtime.dev.gsv.dev
: "${GRAFANA_FQDN:=grafana.${DEV_DOMAIN}}"     # grafana.dev.gsv.dev
: "${API_FQDN:=api.${DEV_DOMAIN}}"             # api.dev.gsv.dev
```

### 2.4 Overriding Domain Configuration

**Option 1: Environment Variables**

```bash
export BASE_DOMAIN=mycompany.local
make deploy-dev
```

**Option 2: .env File**

```bash
# In .env
BASE_DOMAIN=mycompany.local
```

**Option 3: Edit scripts/env.sh**

```bash
# Change the default value
: "${BASE_DOMAIN:=mycompany.local}"
```

---

## 3. Local Development (Kind)

### 3.1 Prerequisites

```bash
# Install required tools
make preflight

# Expected output:
# [OK] docker
# [OK] kind
# [OK] kubectl
# [OK] kustomize
# [OK] helm
# [OK] mkcert
# [OK] jq
```

### 3.2 Full Deployment

```bash
# One-command deployment
make deploy-dev
```

This command executes:

1. `kind.up` - Creates Kind cluster
2. `ingress.setup` - Installs MetalLB, Traefik, cert-manager
3. `registry.setup` - Configures GHCR pull secrets
4. `argocd.install` - Installs ArgoCD
5. `gitops.bootstrap` - Deploys platform apps via ArgoCD

### 3.3 DNS Configuration (Local)

#### macOS

```bash
# Run setup script
make macos.setup

# Or manually add to /etc/hosts
sudo bash -c 'cat >> /etc/hosts << EOF
127.0.0.1 argocd.dev.gsv.dev
127.0.0.1 sso.dev.gsv.dev
127.0.0.1 portal.dev.gsv.dev
127.0.0.1 studio.dev.gsv.dev
127.0.0.1 api.dev.gsv.dev
127.0.0.1 grafana.dev.gsv.dev
EOF'
```

#### Ubuntu/WSL2

```bash
# Full setup with DNS
make ubuntu.setup.all

# This configures dnsmasq for automatic DNS resolution
# All *.dev.gsv.dev domains resolve to 127.0.0.1
```

### 3.4 Access URLs

After deployment:

| Service | URL | Credentials |
|---------|-----|-------------|
| ArgoCD | https://argocd.dev.gsv.dev | admin / (auto-generated) |
| Portal | https://portal.dev.gsv.dev | Keycloak SSO |
| Studio | https://studio.dev.gsv.dev | Keycloak SSO |
| SSO | https://sso.dev.gsv.dev | admin / admin |
| Grafana | https://grafana.dev.gsv.dev | admin / prom-operator |

```bash
# Get ArgoCD admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 -d && echo
```

---

## 4. Proxmox Home Lab Deployment

### 4.1 Overview

For on-premises deployment using Proxmox virtualization platform with local DNS.

### 4.2 Prerequisites

- Proxmox cluster with 3+ nodes
- k3s or RKE2 Kubernetes cluster
- Local DNS server (PiHole, FreeIPA, or dnsmasq)
- MetalLB for LoadBalancer services
- Longhorn for distributed storage

### 4.3 Configuration

**1. Set Provider in .env:**

```bash
PROVIDER=proxmox
ENVIRONMENT=dev
BASE_DOMAIN=home.local
```

**2. Update defaults/providers/proxmox.yaml:**

```yaml
provider:
  name: proxmox
  type: on-premises

kubernetes:
  distribution: k3s
  version: "v1.29.0+k3s1"
  storageClass: longhorn
  ingressClass: traefik

networking:
  loadBalancer:
    type: metallb
    # Update with your network range
    addressPool: "192.168.1.200-192.168.1.220"
  mode: bridge

tls:
  # For homelab, use self-signed certificates
  issuer: self-signed
  # Or use Let's Encrypt with DNS challenge
  # issuer: letsencrypt-prod

dns:
  provider: pihole  # or: freeipa, dnsmasq, none

vm:
  template: ubuntu-2404-cloudinit
  controlPlane:
    count: 3
    cores: 4
    memory: 8192
    disk: 50
  workers:
    count: 3
    cores: 8
    memory: 16384
    disk: 100
```

### 4.4 Local DNS Setup

#### Option A: PiHole

```bash
# Add local DNS records in PiHole admin:
# Settings → Local DNS → DNS Records

# Add these entries (replace 192.168.1.200 with your MetalLB IP):
argocd.home.local      192.168.1.200
sso.home.local         192.168.1.200
portal.home.local      192.168.1.200
studio.home.local      192.168.1.200
api.home.local         192.168.1.200
grafana.home.local     192.168.1.200
```

#### Option B: dnsmasq

```bash
# /etc/dnsmasq.d/gsv-platform.conf
address=/.home.local/192.168.1.200

# Restart dnsmasq
sudo systemctl restart dnsmasq
```

#### Option C: FreeIPA

```bash
# Add DNS zone
ipa dnszone-add home.local

# Add wildcard record
ipa dnsrecord-add home.local '*' --a-rec=192.168.1.200
```

### 4.5 Deployment Steps

```bash
# 1. Configure kubeconfig to point to Proxmox k3s cluster
export KUBECONFIG=~/.kube/config-proxmox

# 2. Verify cluster access
kubectl get nodes

# 3. Install infrastructure components
make metallb.install
make ingress.setup
make argocd.install

# 4. Bootstrap GitOps
make gitops.bootstrap

# 5. Verify deployment
make status
```

### 4.6 TLS Certificates (Self-Signed)

For homelab with self-signed certificates:

```bash
# Create CA certificate with mkcert
mkcert -install
mkcert -cert-file certs/tls.crt -key-file certs/tls.key \
  "*.home.local"

# Create Kubernetes secret
kubectl create secret tls wildcard-home-tls \
  --cert=certs/tls.crt \
  --key=certs/tls.key \
  -n cert-manager

# Or use cert-manager with self-signed issuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: self-signed
spec:
  selfSigned: {}
EOF
```

---

## 5. Hetzner Cloud Deployment

### 5.1 Overview

Production-grade deployment on Hetzner Cloud with:
- k3s HA cluster (3 control plane + 3 workers)
- Hetzner Load Balancer
- Cloudflare DNS
- Let's Encrypt certificates

### 5.2 Prerequisites

- Hetzner Cloud account
- Cloudflare account (for DNS)
- Domain configured in Cloudflare

### 5.3 Configuration

**1. Set Provider in .env:**

```bash
PROVIDER=hetzner
ENVIRONMENT=prod
BASE_DOMAIN=digitlify.com
HCLOUD_TOKEN=your_hetzner_token
CLOUDFLARE_TOKEN=your_cloudflare_token
```

**2. Update defaults/providers/hetzner.yaml:**

```yaml
provider:
  name: hetzner
  type: cloud

kubernetes:
  distribution: k3s
  version: "v1.29.0+k3s1"
  storageClass: hcloud-volumes
  ingressClass: traefik

networking:
  loadBalancer:
    type: hetzner
    location: fsn1  # Frankfurt
  network:
    enabled: true
    cidr: "10.0.0.0/16"
    zone: eu-central

tls:
  issuer: letsencrypt-prod
  email: admin@digitlify.com

dns:
  provider: cloudflare
  externalDns:
    enabled: true
    policy: sync

servers:
  location: fsn1
  controlPlane:
    count: 3
    type: cpx21  # 3 vCPU, 4GB RAM
  workers:
    count: 3
    type: cpx31  # 4 vCPU, 8GB RAM

firewall:
  enabled: true
  rules:
    - name: allow-https
      port: 443
      source: ["0.0.0.0/0"]
    - name: allow-k8s-api
      port: 6443
      source: ["YOUR_IP/32"]  # Restrict API access
```

### 5.4 Cluster Provisioning

#### Option A: Using k3s-ansible

```bash
# Clone k3s-ansible
git clone https://github.com/k3s-io/k3s-ansible.git
cd k3s-ansible

# Configure inventory
cat > inventory/gsv-prod/hosts.ini <<EOF
[master]
gsv-master-1 ansible_host=<IP1>
gsv-master-2 ansible_host=<IP2>
gsv-master-3 ansible_host=<IP3>

[node]
gsv-worker-1 ansible_host=<IP4>
gsv-worker-2 ansible_host=<IP5>
gsv-worker-3 ansible_host=<IP6>

[k3s_cluster:children]
master
node
EOF

# Run playbook
ansible-playbook site.yml -i inventory/gsv-prod/hosts.ini
```

#### Option B: Using Terraform + Hetzner Provider

```hcl
# terraform/hetzner/main.tf
provider "hcloud" {
  token = var.hcloud_token
}

resource "hcloud_server" "control_plane" {
  count       = 3
  name        = "gsv-cp-${count.index + 1}"
  server_type = "cpx21"
  image       = "ubuntu-24.04"
  location    = "fsn1"

  network {
    network_id = hcloud_network.gsv.id
    ip         = cidrhost("10.0.1.0/24", count.index + 10)
  }
}
```

### 5.5 External DNS Setup

```yaml
# external-dns configuration for Cloudflare
apiVersion: apps/v1
kind: Deployment
metadata:
  name: external-dns
  namespace: external-dns
spec:
  template:
    spec:
      containers:
      - name: external-dns
        image: registry.k8s.io/external-dns/external-dns:v0.14.0
        args:
        - --source=ingress
        - --domain-filter=digitlify.com
        - --provider=cloudflare
        - --cloudflare-proxied
        env:
        - name: CF_API_TOKEN
          valueFrom:
            secretKeyRef:
              name: cloudflare-api-token
              key: api-token
```

### 5.6 Production TLS

```yaml
# Let's Encrypt production issuer
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@digitlify.com
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
    - dns01:
        cloudflare:
          apiTokenSecretRef:
            name: cloudflare-api-token
            key: api-token
```

### 5.7 Deployment Steps

```bash
# 1. Provision infrastructure (Terraform)
cd terraform/hetzner
terraform init
terraform apply

# 2. Configure kubectl
export KUBECONFIG=~/.kube/config-hetzner-prod

# 3. Install Hetzner CSI driver
kubectl apply -f https://raw.githubusercontent.com/hetznercloud/csi-driver/main/deploy/kubernetes/hcloud-csi.yml

# 4. Install external-dns
helm install external-dns external-dns/external-dns \
  -n external-dns --create-namespace \
  -f values-external-dns.yaml

# 5. Install cert-manager with Cloudflare DNS
helm install cert-manager jetstack/cert-manager \
  -n cert-manager --create-namespace \
  --set installCRDs=true

# 6. Deploy platform
make ingress.setup
make argocd.install
make gitops.bootstrap
```

---

## 6. Custom Domain Configuration

### 6.1 Domain Naming Convention

| Environment | Base Domain | Service URLs |
|-------------|-------------|--------------|
| Development | `dev.gsv.dev` | `*.dev.gsv.dev` |
| QA | `qa.gsv.dev` | `*.qa.gsv.dev` |
| Production | `digitlify.com` | `*.digitlify.com` |

### 6.2 Changing Domains

#### Step 1: Update scripts/env.sh

```bash
# Change base domain
: "${BASE_DOMAIN:=mycompany.com}"

# Service FQDNs will auto-generate:
# sso.mycompany.com
# portal.mycompany.com
# studio.mycompany.com
# etc.
```

#### Step 2: Update Helm Values

```yaml
# charts/cmp/values-cmp-{env}.yaml
waldur:
  site:
    domain: "portal.mycompany.com"

homeportScheme: https
homeportHostname: portal.mycompany.com
apiHostname: portal.mycompany.com

ingress:
  tls:
    customHomeportSecretName: wildcard-mycompany-tls
```

#### Step 3: Update Kustomization Overlays

```yaml
# platform/overlays/{env}/kustomization.yaml
# Update any hardcoded domain references
```

#### Step 4: Configure DNS

```bash
# For Cloudflare (production)
# Add A record: *.mycompany.com → Load Balancer IP

# For local (Kind)
# Add to /etc/hosts or dnsmasq
```

#### Step 5: Generate Certificates

```bash
# For Let's Encrypt (production)
# cert-manager handles automatically

# For local development
mkcert -cert-file certs/tls.crt -key-file certs/tls.key \
  "*.mycompany.com"
```

### 6.3 Multi-Domain Setup

For organizations with separate domains per environment:

```bash
# scripts/env.sh
: "${DEV_DOMAIN:=dev.internal.company.com}"
: "${QA_DOMAIN:=qa.company-staging.com}"
: "${PROD_DOMAIN:=mycompany.com}"

# Then set service FQDNs per environment
```

---

## 7. Environment Promotion

### 7.1 GitOps Promotion Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│   DEV   │───>│   QA    │───>│  PROD   │
│ (Kind)  │    │(Proxmox)│    │(Hetzner)│
└─────────┘    └─────────┘    └─────────┘
     │              │              │
     v              v              v
  Latest         Tested         Stable
  (main)        (tagged)      (released)
```

### 7.2 Using Make Commands

```bash
# Check current versions across environments
make promote.status

# Output:
# Application          | dev          | qa           | prod
# ---------------------|--------------|--------------|-------------
# agent-registry       | v1.5.0       | v1.4.2       | v1.4.0
# agentstudio          | v2.1.0       | v2.0.5       | v2.0.0
# agentruntime         | v1.3.0       | v1.2.0       | v1.2.0

# Promote dev to QA
make promote.qa

# Promote QA to Prod (with confirmation)
make promote.prod
```

### 7.3 Manual Promotion

```bash
# scripts/promotion/promote.sh
./scripts/promotion/promote.sh --app agent-registry --from dev --to qa
./scripts/promotion/promote.sh --all --from qa --to prod --auto-merge
```

### 7.4 ArgoCD Sync

After promotion:

```bash
# Auto-sync enabled: ArgoCD syncs automatically

# Manual sync if needed
argocd app sync agent-registry
argocd app sync agentstudio
argocd app sync --all
```

---

## 8. Troubleshooting

### 8.1 Common Issues

#### Issue: DNS Not Resolving

```bash
# Check if dnsmasq is running (Ubuntu)
systemctl status dnsmasq

# Verify DNS resolution
dig sso.dev.gsv.dev @127.0.0.1

# Test with curl
curl -k https://sso.dev.gsv.dev/realms/gsv

# Fallback: Add to /etc/hosts
echo "127.0.0.1 sso.dev.gsv.dev" | sudo tee -a /etc/hosts
```

#### Issue: Certificate Errors

```bash
# Check cert-manager status
kubectl get certificates -A
kubectl describe certificate wildcard-dev-tls -n cert-manager

# View certificate details
kubectl get secret wildcard-dev-tls -n cert-manager -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -text -noout

# Force certificate renewal
kubectl delete certificate wildcard-dev-tls -n cert-manager
```

#### Issue: ArgoCD Not Syncing

```bash
# Check ArgoCD application status
argocd app list
argocd app get gsv-platform

# View sync errors
argocd app get gsv-platform --show-operation

# Force sync
argocd app sync gsv-platform --force
```

#### Issue: Pods Not Starting

```bash
# Check pod status
kubectl describe pod -n cmp agent-registry-xxx

# Common causes:
# - Image pull errors: Check GHCR credentials
kubectl get secret ghcr-pull-secret -n cmp

# - Resource limits: Check node capacity
kubectl describe nodes

# - ConfigMap/Secret missing
kubectl get events -n cmp --sort-by='.lastTimestamp'
```

### 8.2 Deployment Verification

```bash
# Full verification script
./scripts/verify/smoke-tests.sh

# Manual verification
# 1. Check all pods running
kubectl get pods -A | grep -v Running | grep -v Completed

# 2. Check ArgoCD apps
kubectl get applications -n argocd

# 3. Test endpoints
curl -sk https://sso.dev.gsv.dev/realms/gsv | jq .
curl -sk https://api.dev.gsv.dev/health/
curl -sk https://portal.dev.gsv.dev/
```

### 8.3 Logs and Debugging

```bash
# ArgoCD logs
kubectl logs -n argocd deployment/argocd-server -f

# Agent Registry logs
kubectl logs -n cmp deployment/agent-registry -f

# Keycloak logs
kubectl logs -n sso deployment/keycloak -f

# Traefik logs
kubectl logs -n traefik deployment/traefik -f
```

---

## Appendix A: Quick Reference

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PROVIDER` | `kind` | `kind`, `proxmox`, or `hetzner` |
| `ENVIRONMENT` | `dev` | `dev`, `qa`, or `prod` |
| `BASE_DOMAIN` | `gsv.dev` | Base domain for all services |
| `GITHUB_TOKEN` | - | GitHub PAT for ArgoCD |
| `CLOUDFLARE_TOKEN` | - | Cloudflare API token |
| `HCLOUD_TOKEN` | - | Hetzner Cloud token |

### Make Targets

| Target | Description |
|--------|-------------|
| `make deploy-dev` | Full dev deployment |
| `make status` | Show platform status |
| `make smoke` | Run smoke tests |
| `make promote.qa` | Promote to QA |
| `make promote.prod` | Promote to Prod |
| `make clean` | Full cleanup |

### Default URLs (Dev)

| Service | URL |
|---------|-----|
| ArgoCD | https://argocd.dev.gsv.dev |
| SSO | https://sso.dev.gsv.dev |
| Portal | https://portal.dev.gsv.dev |
| Studio | https://studio.dev.gsv.dev |
| API | https://api.dev.gsv.dev |
| Grafana | https://grafana.dev.gsv.dev |

---

*Document generated by GSV Platform Engineering Team*
