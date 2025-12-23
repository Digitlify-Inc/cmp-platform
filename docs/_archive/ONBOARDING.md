# GSV Platform - Getting Started

This guide covers setting up the GSV Platform on a fresh machine.

---

## Requirements

### Minimum System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Disk | 50 GB free | 100 GB free |
| Network | Internet access | Internet access |

### Supported Operating Systems

| OS | Version | Status |
|----|---------|--------|
| Ubuntu | 22.04+ | ✅ Supported |
| Ubuntu | 24.04+ | ✅ Supported (Primary) |
| WSL2 | Ubuntu 22.04+ | ✅ Supported |
| macOS | 13+ (Apple Silicon) | 🔄 In Progress |
| macOS | 13+ (Intel) | 🔄 In Progress |

### Network Requirements

- Internet access to download packages from:
  - Ubuntu repositories (archive.ubuntu.com)
  - GitHub (github.com, raw.githubusercontent.com)
  - Docker Hub (docker.io)
  - Helm repositories (get.helm.sh)
  - Kubernetes (dl.k8s.io)

### What Gets Installed

The setup script installs these tools (all installed to `/usr/local/bin`):

| Tool | Version | Purpose |
|------|---------|---------|  
| Docker | Latest | Container runtime |
| Kind | v0.24.0 | Local Kubernetes clusters |
| kubectl | v1.31.2 | Kubernetes CLI |
| kustomize | v5.4.3 | Kubernetes configuration |
| Helm | Latest | Kubernetes package manager |
| mkcert | v1.4.4 | Local TLS certificates |
| ArgoCD CLI | v2.13.0 | GitOps CLI |
| jq | Latest | JSON processing |
| yq | Latest | YAML processing |

---

## Quick Start (One-Liner)

**For Ubuntu 22.04+:**

```bash
curl -sSL https://raw.githubusercontent.com/GSVDEV/gsv-gitops/main/bootstrap.sh | bash
```

This single command will:
1. Install all prerequisites (make, git, docker, kind, kubectl, etc.)
2. Clone the repository
3. Run preflight checks

---

## Manual Setup

### Step 1: Clone the Repository

Choose **ONE** of the following methods:

#### Option A: HTTPS (Recommended for most users)

```bash
git clone https://github.com/GSVDEV/gsv-gitops.git
cd gsv-gitops
```

When prompted:
- **Username:** Your GitHub username
- **Password:** Your **Personal Access Token (PAT)**, NOT your password

<details>
<summary>📋 How to Create a Personal Access Token (PAT)</summary>

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Give it a name (e.g., "GSV Platform")
4. Set expiration (e.g., 90 days)
5. Select scope: **`repo`** (Full control of private repositories)
6. Click **"Generate token"**
7. **Copy the token immediately** (you won't see it again!)
8. Use this token as your password when cloning

**Tip:** Cache credentials to avoid re-entering:
```bash
git config --global credential.helper 'cache --timeout=28800'  # 8 hours
```
</details>

#### Option B: SSH (For frequent contributors)

```bash
git clone git@github.com:GSVDEV/gsv-gitops.git
cd gsv-gitops
```

<details>
<summary>🔑 How to Setup SSH Keys</summary>

**1. Generate SSH Key:**
```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```
Press Enter for default location, optionally set a passphrase.

**2. Start SSH Agent:**
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

**3. Copy Public Key:**
```bash
cat ~/.ssh/id_ed25519.pub
```

**4. Add to GitHub:**
- Go to: https://github.com/settings/ssh/new
- Title: `Ubuntu - <machine-name>`
- Key: Paste the output from step 3
- Click **"Add SSH key"**

**5. Test Connection:**
```bash
ssh -T git@github.com
```
Expected output: `Hi <username>! You've successfully authenticated...`
</details>

---

### Step 2: Install Prerequisites

**If `make` is not installed:**
```bash
sudo apt-get update && sudo apt-get install -y make
```

**Then run setup:**
```bash
# Check what's missing
make preflight

# Install all prerequisites (idempotent - safe to run multiple times)
make ubuntu.setup
```

**Important:** If docker was just installed, the script will tell you to run:
```bash
newgrp docker
```
This applies the docker group to your current session. (Or logout and login again)

---

### Step 3: Deploy the Platform

```bash
cd ~/gsv-gitops
make deploy-dev
```

This runs:
1. **kind.up** - Creates 3-node Kind cluster (1 control-plane + 2 workers)
2. **ingress.setup** - Installs Traefik + cert-manager + mkcert TLS
3. **argocd.install** - Installs ArgoCD
4. **gitops.bootstrap** - Creates root Application
5. **smoke** - Runs smoke tests

---

### Step 4: Setup DNS (Optional but Recommended)

```bash
cd ~/gsv-gitops
make ubuntu.setup.dns
```

This configures `*.dev.rnd.gsv.dev` → `127.0.0.1` via dnsmasq, enabling:
- `https://argocd.dev.rnd.gsv.dev`
- `https://keycloak.dev.rnd.gsv.dev`
- `https://portal.dev.rnd.gsv.dev`

---

### Step 5: Access the Platform

**Get ArgoCD password:**
```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo
```

**Access ArgoCD UI:**
- With DNS: https://argocd.dev.rnd.gsv.dev
- Without DNS: `kubectl port-forward svc/argocd-server -n argocd 8080:443`

---

## Validation Checklist

```
[ ] make preflight       - All tools show [OK]
[ ] make deploy-dev      - Completes without errors
[ ] kubectl get nodes    - Shows 3 nodes in Ready state
[ ] ArgoCD UI accessible - Can login with admin password
[ ] Apps syncing         - Applications show Synced/Healthy in ArgoCD
```

---

## Troubleshooting

### "Permission denied (publickey)" when cloning

**Cause:** SSH key not configured or not added to GitHub.

**Fix:** Use HTTPS instead:
```bash
git clone https://github.com/GSVDEV/gsv-gitops.git
```

### "make: command not found"

**Fix:**
```bash
sudo apt-get update && sudo apt-get install -y make
```

### Docker permission denied

**Cause:** User not in docker group.

**Fix:**
```bash
sudo usermod -aG docker $USER
newgrp docker  # Or logout and login
```

### mkcert CA not found

**Cause:** mkcert not installed or CA not initialized.

**Fix:**
```bash
make ubuntu.setup
mkcert -install
```

---

## Next Steps

After successful deployment:

1. **Explore ArgoCD:** See apps syncing at https://argocd.dev.rnd.gsv.dev
2. **Check Keycloak:** SSO at https://keycloak.dev.rnd.gsv.dev
3. **View Portal:** Waldur CMP at https://portal.dev.rnd.gsv.dev
4. **Access Studio:** LangFlow at https://studio.dev.rnd.gsv.dev

For architecture details, see [PLATFORM_OVERVIEW.md](architecture/PLATFORM_OVERVIEW.md).
