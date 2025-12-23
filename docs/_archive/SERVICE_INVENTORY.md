# GSV Platform Service Inventory

## Quick Reference Table

### All Services Overview

| Service | Dev FQDN | QA FQDN | Prod FQDN | Namespace | Port |
|---------|----------|---------|-----------|-----------|------|
| ArgoCD | argocd.dev.gsv.dev | argocd.qa.digitlify.com | argocd.digitlify.com | argocd | 443 |
| Grafana | grafana.dev.gsv.dev | grafana.qa.digitlify.com | grafana.digitlify.com | observability | 443 |
| Vault | vault.dev.gsv.dev | vault.qa.digitlify.com | vault.digitlify.com | vault | 443 |
| SSO (Keycloak) | sso.dev.gsv.dev | sso.qa.digitlify.com | sso.digitlify.com | keycloak/sso | 443 |
| CMP Portal | portal.dev.gsv.dev | marketplace.qa.digitlify.com | portal.digitlify.com | cmp | 443 |
| Agent Studio | studio.dev.gsv.dev | studio.qa.digitlify.com | studio.digitlify.com | agentstudio | 443 |
| Agent Registry API | api.dev.gsv.dev | api.qa.digitlify.com | api.digitlify.com | cmp | 443 |
| Backstage | backstage.dev.gsv.dev | backstage.qa.digitlify.com | backstage.digitlify.com | backstage | 443 |
| MinIO Console | minio.dev.gsv.dev | minio.qa.digitlify.com | minio.digitlify.com | backup-system | 443 |

---

## Default Credentials

### Administrative Access

| Service | Username | Default Password | Notes |
|---------|----------|------------------|-------|
| ArgoCD | admin | (auto-generated) | See commands below |
| Grafana | admin | admin | Change on first login |
| Vault | root | (auto-generated) | Stored in vault-init secret |
| MinIO | minioadmin | minioadmin | Development only |
| Keycloak | admin | (in secret) | keycloak-admin-credentials |

### Database Credentials

| Database | Service | Username | Secret Name |
|----------|---------|----------|-------------|
| CMP PostgreSQL | cmp-postgres-rw | waldur | cmp-postgres-app |
| Keycloak PostgreSQL | cmp-keycloak-pg-rw | keycloak | cmp-keycloak-pg-app |
| SSO PostgreSQL | sso-pg-rw | keycloak | sso-pg-app |
| Agent Registry DB | agent-registry-postgres-rw | agent_registry | agent-registry-postgres-app |
| Agent Runtime DB | agentruntime-postgres-rw | agentruntime | agentruntime-postgres-app |
| Agent Studio DB | agentstudio-postgres-rw | agentstudio | agentstudio-postgres-app |

### Message Queue

| Service | Username | Secret Name |
|---------|----------|-------------|
| RabbitMQ | waldur | cmp-rabbitmq-credentials |

---

## Namespace Map

| Namespace | Services | Purpose |
|-----------|----------|---------|
| argocd | ArgoCD Server | GitOps deployment |
| vault | HashiCorp Vault | Secrets management |
| external-secrets | ESO | Secret synchronization |
| keycloak | Keycloak, PostgreSQL | CMP Identity |
| sso | Keycloak, PostgreSQL | Platform SSO |
| cmp | CMP/Waldur, Agent Registry | Marketplace |
| agentstudio | Agent Studio, PostgreSQL | AI development |
| agentruntime | Agent Runtime, PostgreSQL | AI execution |
| backstage | Backstage, PostgreSQL | Developer portal |
| observability | Prometheus, Grafana, Loki | Monitoring |
| backup-system | MinIO, Velero | Backup and DR |
| cnpg-system | CNPG Operator | Database management |

---

## Quick Commands

### Get Credentials

```bash
# ArgoCD admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Vault root token
kubectl -n vault get secret vault-init -o jsonpath="{.data.root_token}" | base64 -d

# Grafana admin password
kubectl -n observability get secret prometheus-stack-grafana -o jsonpath="{.data.admin-password}" | base64 -d

# Database password (CMP)
kubectl -n cmp get secret cmp-postgres-app -o jsonpath="{.data.password}" | base64 -d
```

### Port Forward Services

```bash
# Grafana
kubectl -n observability port-forward svc/prometheus-stack-grafana 3000:80

# ArgoCD
kubectl -n argocd port-forward svc/argocd-server 8080:443

# Vault
kubectl -n vault port-forward svc/vault 8200:8200

# Agent Platform Services
kubectl -n sso port-forward svc/digitlify-idp-service 8088:8080 &
kubectl -n cmp port-forward svc/agent-registry 8000:80 &
kubectl -n cmp port-forward svc/waldur-mastermind-api 8080:80 &
kubectl -n agentstudio port-forward svc/agentstudio 7860:80 &
kubectl -n agentruntime port-forward svc/agentruntime 7861:80 &
```

---

## Internal Kubernetes Service URLs

These are the in-cluster URLs for service-to-service communication:

| Service | Internal URL | Notes |
|---------|--------------|-------|
| SSO (Keycloak) | `http://digitlify-idp-service.sso.svc.cluster.local:8080` | OIDC provider |
| Waldur API | `http://waldur-mastermind-api.cmp.svc.cluster.local:80` | CMP backend |
| Agent Registry | `http://agent-registry.cmp.svc.cluster.local:80` | Agent management |
| Agent Studio | `http://agentstudio.agentstudio.svc.cluster.local:80` | LangFlow Studio |
| Agent Runtime | `http://agentruntime.agentruntime.svc.cluster.local:80` | LangFlow Runtime |
| Redis | `redis://cmp-redis.cmp.svc.cluster.local:6379` | Cache/Queue |
| Qdrant | `http://qdrant.cmp.svc.cluster.local:6333` | Vector Store |

---

## OIDC/SSO Configuration

### Keycloak Realm Configuration

| Setting | Value |
|---------|-------|
| Realm | `gsv` |
| External Issuer | `https://sso.dev.gsv.dev/realms/gsv` |
| Internal Base URL | `http://digitlify-idp-service.sso.svc.cluster.local:8080` |
| Token Endpoint | `/realms/gsv/protocol/openid-connect/token` |
| JWKS Endpoint | `/realms/gsv/protocol/openid-connect/certs` |

### Service Account Client (for API access)

| Setting | Value |
|---------|-------|
| Client ID | `gsv-api` |
| Client Secret | `gsv-api-test-secret` (dev only) |
| Grant Type | `client_credentials` |
| Token Audience | `account` (Keycloak default) |

### Get OIDC Token

```bash
# Get service account token for API access
TOKEN=$(curl -s -X POST http://localhost:8088/realms/gsv/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=gsv-api" \
  -d "client_secret=gsv-api-test-secret" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

# Test Agent Registry API with token
curl -s http://localhost:8000/api/v1/agents/ \
  -H "Authorization: Bearer $TOKEN"
```

### Agent Registry OIDC Configuration

The Agent Registry uses these environment variables for OIDC:

| Variable | Value | Notes |
|----------|-------|-------|
| `OIDC_ENABLED` | `True` | Enable OIDC authentication |
| `OIDC_OP_BASE_URL` | `http://digitlify-idp-service.sso.svc.cluster.local:8080` | Internal Keycloak URL |
| `OIDC_OP_REALM` | `gsv` | Keycloak realm name |
| `OIDC_RP_CLIENT_ID` | `account` | Expected token audience |
| `OIDC_OP_ISSUER` | `https://sso.dev.gsv.dev/realms/gsv` | Token issuer (external URL) |

**Important:** The issuer must match the external URL in the token, while internal URLs are used for JWKS fetching.
