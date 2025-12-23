# Credentials Reference

Default credentials for development environments.

> **WARNING:** These are development defaults only. Never use in production!

---

## Quick Reference (Dev Environment)

| Application | URL | Username | Password |
|------------|-----|----------|----------|
| **ArgoCD** | https://argocd.dev.gsv.dev | `admin` | See [ArgoCD](#argocd) |
| **Keycloak Admin** | https://sso.dev.gsv.dev/admin | `temp-admin` | See [Keycloak](#keycloak-sso) |
| **Keycloak User** (GSV Realm) | SSO Login | `admin` | `Admin123!` |
| **CMP Portal** | https://portal.dev.gsv.dev | SSO via Keycloak | - |
| **CMP Admin** | https://portal.dev.gsv.dev/admin | See [Creating CMP Admin](#creating-cmp-admin) | - |
| **AgentStudio** | https://studio.dev.gsv.dev | `admin` | See [AgentStudio](#agentstudio-langflow) |
| **AgentRuntime** | https://runtime.dev.gsv.dev | `admin` | See [AgentRuntime](#agentruntime-langflow) |
| **Agent Registry** | https://api.dev.gsv.dev/admin | See [Creating Agent Registry Admin](#creating-agent-registry-admin) | - |
| **Backstage** | https://idp.dev.gsv.dev | SSO via Keycloak | - |
| **Grafana** | https://grafana.dev.gsv.dev | `admin` | See [Grafana](#grafana) |

---

## Dev Environment (Kind)

### ArgoCD
| Field | Value |
|-------|-------|
| URL | https://argocd.dev.gsv.dev |
| Username | `admin` |
| Password | *Run:* `kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath='{.data.password}' \| base64 -d` |

### Keycloak (SSO)
| Field | Value |
|-------|-------|
| URL | https://sso.dev.gsv.dev |
| Admin Console | https://sso.dev.gsv.dev/admin |
| Username | `temp-admin` |
| Password | *Run:* `kubectl -n sso get secret digitlify-idp-initial-admin -o jsonpath='{.data.password}' \| base64 -d` |
| Realm | `gsv` |

**GSV Realm Default User:**
| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `Admin123!` |
| Email | `admin@gsv.dev` |

> This user is auto-created via `realm-gsv.yaml` KeycloakRealmImport

### Grafana
| Field | Value |
|-------|-------|
| URL | https://grafana.dev.gsv.dev |
| Username | `admin` |
| Password | *Run:* `kubectl get secret prometheus-stack-grafana -n observability -o jsonpath='{.data.admin-password}' \| base64 -d` |

### AgentStudio (LangFlow)
| Field | Value |
|-------|-------|
| URL | https://studio.dev.gsv.dev |
| SSO | Login via Keycloak (gsv realm) |
| App Username | `admin` |
| App Password | *Run:* `kubectl get secret agentstudio-admin -n agentstudio -o jsonpath='{.data.password}' \| base64 -d` |

> **Note:** AgentStudio uses oauth2-proxy as OIDC gatekeeper. First login via Keycloak SSO, then authenticate in Langflow with app credentials.

### AgentRuntime (LangFlow)
| Field | Value |
|-------|-------|
| URL | https://runtime.dev.gsv.dev |
| SSO | Login via Keycloak (gsv realm) |
| App Username | `admin` |
| App Password | *Run:* `kubectl get secret agentruntime-env -n agentruntime -o jsonpath='{.data.LANGFLOW_SUPERUSER_PASSWORD}' \| base64 -d` |

### CMP Portal (Waldur)
| Field | Value |
|-------|-------|
| URL | https://portal.dev.gsv.dev |
| Admin URL | https://portal.dev.gsv.dev/admin |
| SSO Login | Click "Sign in with Digitlify SSO" |
| Create staff user | See [Creating CMP Admin](#creating-cmp-admin) below |

### Agent Registry (Django)
| Field | Value |
|-------|-------|
| URL | https://api.dev.gsv.dev |
| Admin URL | https://api.dev.gsv.dev/admin |
| Create admin | See [Creating Agent Registry Admin](#creating-agent-registry-admin) below |

### Backstage
| Field | Value |
|-------|-------|
| URL | https://idp.dev.gsv.dev |
| SSO | Login via Keycloak (gsv realm) |

---

## Creating Admin Users

### Creating CMP Admin

CMP (Waldur) doesn't auto-create a staff/superuser. Create one manually:

```bash
# Interactive method
kubectl -n cmp exec -it deployment/waldur-mastermind-api -- waldur createsuperuser

# Or one-liner with defaults
kubectl -n cmp exec -it deployment/waldur-mastermind-api -- waldur shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@gsv.dev', 'Admin123!')
    print('Admin user created')
else:
    print('Admin user already exists')
"
```

### Creating Agent Registry Admin

Agent Registry (Django) also requires manual admin creation:

```bash
# Interactive method
kubectl -n cmp exec -it deployment/agent-registry -- python manage.py createsuperuser

# Or one-liner with defaults
kubectl -n cmp exec -it deployment/agent-registry -- python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@gsv.dev', 'Admin123!')
    print('Admin user created')
else:
    print('Admin user already exists')
"
```

---

## Keycloak Clients (GSV Realm)

| Client ID | Purpose | Secret Location | Type |
|-----------|---------|-----------------|------|
| `backstage` | Backstage IDP Portal | Vault: `gsv/backstage` | Confidential |
| `portal` | GSV Portal (Next.js) | Vault: `gsv/portal` | Confidential |
| `gsv-api` | API Testing (direct grants) | In realm-gsv.yaml | Confidential |
| `agent-registry` | Agent Registry Backend | Vault: `gsv/agent-registry` | Confidential |
| `agentstudio` | AgentStudio OAuth2-Proxy | Vault: `oauth/agentstudio` | Confidential |
| `agentruntime` | AgentRuntime OAuth2-Proxy | Vault: `oauth/agentruntime` | Confidential |
| `cmp-portal` | CMP Portal (Waldur) | In values-cmp-dev.yaml | Confidential |

**Get client secret from Keycloak:**
```bash
# Via Keycloak Admin UI:
# 1. Login to https://sso.dev.gsv.dev/admin
# 2. Select "gsv" realm
# 3. Clients → <client-id> → Credentials tab
```

---

## Database Credentials

### PostgreSQL (CNPG)

| Database | Secret Name | Namespace |
|----------|-------------|-----------|
| CMP | `cmp-postgres-app` | cmp |
| Keycloak | `sso-keycloak-pg-app` | sso |
| AgentStudio | `agentstudio-postgres-app` | agentstudio |
| AgentRuntime | `agentruntime-postgres-app` | agentruntime |
| Agent Registry | `agent-registry-postgres-app` | cmp |

**Get credentials:**
```bash
# Connection string (full URI)
kubectl get secret <secret-name> -n <namespace> -o jsonpath='{.data.uri}' | base64 -d

# Username
kubectl get secret <secret-name> -n <namespace> -o jsonpath='{.data.username}' | base64 -d

# Password
kubectl get secret <secret-name> -n <namespace> -o jsonpath='{.data.password}' | base64 -d

# Host
kubectl get secret <secret-name> -n <namespace> -o jsonpath='{.data.host}' | base64 -d
```

---

## Vault & External Secrets

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           HashiCorp Vault                           │
│                    (Source of Truth for Secrets)                    │
├─────────────────────────────────────────────────────────────────────┤
│  secret/gsv/                                                        │
│  ├── agentstudio/     (admin credentials, langflow config)          │
│  ├── agentruntime/    (superuser credentials, langflow config)      │
│  ├── agent-registry/  (django secret, db creds, API keys)           │
│  ├── backstage/       (oidc, github token, db creds)                │
│  ├── portal/          (nextauth, keycloak secret)                   │
│  ├── sso/             (keycloak db credentials)                     │
│  ├── cnpg-backup/     (minio credentials for backups)               │
│  └── rabbitmq/        (rabbitmq credentials)                        │
│                                                                     │
│  secret/oauth/                                                      │
│  ├── agentstudio/     (oauth2-proxy: client-id, secret, cookie)     │
│  └── agentruntime/    (oauth2-proxy: client-id, secret, cookie)     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                    External Secrets Operator (ESO)
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Kubernetes Secrets                             │
│           (Auto-synced from Vault via ExternalSecret CRs)           │
├─────────────────────────────────────────────────────────────────────┤
│  Namespace: agentstudio                                             │
│  ├── agentstudio-admin          (from gsv/agentstudio)              │
│  ├── agentstudio-env            (from gsv/agentstudio)              │
│  └── agentstudio-oauth2-proxy   (from oauth/agentstudio)            │
│                                                                     │
│  Namespace: agentruntime                                            │
│  ├── agentruntime-env           (from gsv/agentruntime)             │
│  └── agentruntime-oauth2-proxy  (from oauth/agentruntime)           │
│                                                                     │
│  Namespace: cmp                                                     │
│  ├── agent-registry-env         (from gsv/agent-registry)           │
│  └── cmp-rabbitmq-credentials   (from gsv/rabbitmq)                 │
│                                                                     │
│  Namespace: backstage                                               │
│  └── backstage-secrets          (from gsv/backstage)                │
│                                                                     │
│  Namespace: sso                                                     │
│  └── sso-db-secret              (from gsv/sso)                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Vault Secret Paths

| Vault Path | K8s Secret | Namespace | Purpose |
|------------|------------|-----------|---------|
| `secret/gsv/agentstudio` | `agentstudio-admin`, `agentstudio-env` | agentstudio | LangFlow admin credentials |
| `secret/gsv/agentruntime` | `agentruntime-env` | agentruntime | LangFlow superuser credentials |
| `secret/gsv/agent-registry` | `agent-registry-env` | cmp | Django config, DB, API keys |
| `secret/gsv/backstage` | `backstage-secrets` | backstage | OIDC, GitHub, ArgoCD tokens |
| `secret/gsv/portal` | `portal-env` | portal | NextAuth, Keycloak secrets |
| `secret/gsv/sso` | `sso-db-secret` | sso | Keycloak database credentials |
| `secret/gsv/cnpg-backup` | `cnpg-minio-credentials` | multiple | MinIO backup credentials |
| `secret/gsv/rabbitmq` | `cmp-rabbitmq-credentials` | cmp | RabbitMQ credentials |
| `secret/oauth/agentstudio` | `agentstudio-oauth2-proxy` | agentstudio | OAuth2-proxy client config |
| `secret/oauth/agentruntime` | `agentruntime-oauth2-proxy` | agentruntime | OAuth2-proxy client config |

### Accessing Vault Secrets

```bash
# Get Vault root token (dev only!)
ROOT_TOKEN=$(kubectl get secret vault-init -n vault -o jsonpath='{.data.root_token}' | base64 -d)

# Port-forward to Vault
kubectl port-forward -n vault svc/vault 8200:8200 &

# Read a secret
curl -s -H "X-Vault-Token: $ROOT_TOKEN" \
  http://localhost:8200/v1/secret/data/gsv/agentstudio | jq '.data.data'

# List secrets in a path
curl -s -H "X-Vault-Token: $ROOT_TOKEN" \
  'http://localhost:8200/v1/secret/metadata/gsv?list=true' | jq '.data.keys'
```

---

## Rotating Secrets (ESO + Vault)

### How Secret Rotation Works

1. **Update secret in Vault** → ESO auto-syncs to K8s (default: 1 hour refresh)
2. **Restart pods** to pick up new secrets (or use reloader)

### Rotate a Secret in Vault

```bash
# Get Vault root token
ROOT_TOKEN=$(kubectl get secret vault-init -n vault -o jsonpath='{.data.root_token}' | base64 -d)

# Port-forward to Vault
kubectl port-forward -n vault svc/vault 8200:8200 &

# Generate new password
NEW_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')

# Update secret (example: AgentStudio admin password)
curl -X PUT \
  -H "X-Vault-Token: $ROOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"data\": {\"admin_username\": \"admin\", \"admin_password\": \"$NEW_PASSWORD\", \"do_not_track\": \"true\"}}" \
  http://localhost:8200/v1/secret/data/gsv/agentstudio

# Force ESO to sync immediately (optional - otherwise waits for refreshInterval)
kubectl annotate externalsecret agentstudio-admin -n agentstudio force-sync=$(date +%s) --overwrite

# Restart pods to pick up new secret
kubectl rollout restart deployment/agentstudio -n agentstudio
```

### Rotate OAuth2-Proxy Secrets

```bash
# Generate new cookie secret
NEW_COOKIE=$(openssl rand -base64 32 | tr -d '\n')

# Update in Vault
curl -X PUT \
  -H "X-Vault-Token: $ROOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"data\": {\"client-id\": \"agentstudio\", \"client-secret\": \"<from-keycloak>\", \"cookie-secret\": \"$NEW_COOKIE\"}}" \
  http://localhost:8200/v1/secret/data/oauth/agentstudio

# Force sync and restart
kubectl annotate externalsecret agentstudio-oauth2-proxy -n agentstudio force-sync=$(date +%s) --overwrite
kubectl rollout restart deployment/agentstudio-oauth2-proxy -n agentstudio
```

### Rotate Keycloak Client Secrets

**Important:** Keycloak client secrets must be updated in TWO places:
1. **Vault** (for the application)
2. **Keycloak** (regenerate in admin console)
3. **realm-gsv.yaml** (for GitOps - if realm is reimported)

```bash
# 1. Regenerate in Keycloak Admin Console:
#    - Login to https://sso.dev.gsv.dev/admin
#    - Select "gsv" realm → Clients → <client>
#    - Credentials tab → Regenerate Secret

# 2. Update Vault with new secret
curl -X PUT \
  -H "X-Vault-Token: $ROOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"data\": {\"client-id\": \"agentstudio\", \"client-secret\": \"<new-secret>\", \"cookie-secret\": \"$(openssl rand -base64 32 | tr -d '\n')\"}}" \
  http://localhost:8200/v1/secret/data/oauth/agentstudio

# 3. Update realm-gsv.yaml for GitOps persistence
# Edit: platform/base/idp/sso/realm-gsv.yaml
# Find the client and update the "secret:" field

# 4. Force sync and restart
kubectl annotate externalsecret agentstudio-oauth2-proxy -n agentstudio force-sync=$(date +%s) --overwrite
kubectl rollout restart deployment/agentstudio-oauth2-proxy -n agentstudio
```

### Rotate Database Passwords

CNPG-managed databases have auto-generated passwords. To rotate:

```bash
# Delete the app secret (CNPG operator will regenerate)
kubectl delete secret cmp-postgres-app -n cmp

# Restart pods that use the database
kubectl rollout restart deployment/waldur-mastermind-api -n cmp
kubectl rollout restart deployment/waldur-mastermind-worker -n cmp
kubectl rollout restart deployment/waldur-mastermind-beat -n cmp
```

### Rotate ArgoCD Admin Password

```bash
# Delete the secret (ArgoCD will regenerate on restart)
kubectl delete secret argocd-initial-admin-secret -n argocd
kubectl rollout restart deployment argocd-server -n argocd

# Get new password
kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath='{.data.password}' | base64 -d
```

### Check ExternalSecret Sync Status

```bash
# List all ExternalSecrets and their status
kubectl get externalsecret -A

# Check specific ExternalSecret
kubectl describe externalsecret agentstudio-admin -n agentstudio

# View sync events
kubectl get events -n agentstudio --field-selector involvedObject.name=agentstudio-admin
```

---

## Vault Initialization (Dev Environment)

Secrets are auto-initialized by `vault-secrets-init-job.yaml` during deployment. This job:

1. Waits for Vault to be healthy
2. Gets the root token from `vault-init` secret
3. Creates all required secrets with random passwords if they don't exist
4. Skips secrets that already have valid values

**Re-run initialization (regenerate all secrets):**
```bash
# Delete existing secrets in Vault first (optional - for full reset)
kubectl delete job vault-secrets-init -n vault
kubectl create job --from=cronjob/vault-secrets-init vault-secrets-init-manual -n vault

# Or trigger via ArgoCD sync
argocd app sync vault --force
```

---

## Security Reminders

1. **Never commit real production credentials to Git**
2. **Rotate all defaults before production**
3. **Use Vault in production** (not plain K8s secrets)
4. **Enable MFA for admin accounts** (Keycloak supports this)
5. **Audit credential access regularly**
6. **Keep Keycloak client secrets in sync** with:
   - Vault (for applications)
   - realm-gsv.yaml (for GitOps persistence)
7. **ExternalSecrets refresh every 1 hour** by default - force sync for immediate updates

---

*Last Updated: December 8, 2025*
