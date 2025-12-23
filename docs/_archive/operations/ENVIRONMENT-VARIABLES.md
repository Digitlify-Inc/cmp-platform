# Environment Variables Reference

**Date:** December 11, 2024
**Purpose:** Complete reference of environment variables for all platform components

---

## Agent Config Portal (cmp-portal)

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_URL` | Portal base URL | `https://portal.dev.gsv.dev` |
| `NEXTAUTH_SECRET` | NextAuth session secret | `<random-32-char-string>` |
| `KEYCLOAK_ID` | Keycloak client ID | `cmp-portal` |
| `KEYCLOAK_SECRET` | Keycloak client secret | `<from-keycloak>` |
| `KEYCLOAK_ISSUER` | Keycloak realm URL | `https://sso.dev.gsv.dev/realms/gsv` |
| `NEXT_PUBLIC_API_URL` | Agent Registry API URL | `https://agent-registry.dev.gsv.dev` |
| `NEXT_PUBLIC_WALDUR_URL` | Waldur CMP URL | `https://app.dev.gsv.dev` |

### Environment-Specific Values

| Variable | Dev | QA | Production |
|----------|-----|----|----|
| `NEXTAUTH_URL` | `https://portal.dev.gsv.dev` | `https://portal.qa.digitlify.com` | `https://portal.digitlify.com` |
| `KEYCLOAK_ISSUER` | `https://sso.dev.gsv.dev/realms/gsv` | `https://sso.qa.digitlify.com/realms/digitlify` | `https://sso.digitlify.com/realms/digitlify` |
| `NEXT_PUBLIC_API_URL` | `https://agent-registry.dev.gsv.dev` | `https://agent-registry.qa.digitlify.com` | `https://agent-registry.digitlify.com` |
| `NEXT_PUBLIC_WALDUR_URL` | `https://app.dev.gsv.dev` | `https://app.qa.digitlify.com` | `https://app.digitlify.com` |

---

## Agent Registry (gsv-agentregistry)

### Core Django Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DJANGO_SECRET_KEY` | Django secret key | - | **Yes** (prod) |
| `DJANGO_DEBUG` | Enable debug mode | `False` | No |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hosts | `localhost,127.0.0.1` | Yes (prod) |
| `CSRF_TRUSTED_ORIGINS` | CSRF trusted origins | - | Yes (prod) |
| `ENVIRONMENT` | Environment name | `dev` | No |

### Database Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Full database URL | - | Yes |
| `DB_HOST` | Database host | `localhost` | If not using DATABASE_URL |
| `DB_PORT` | Database port | `5432` | No |
| `DB_NAME` | Database name | `agent_registry` | If not using DATABASE_URL |
| `DB_USER` | Database user | `agent_registry` | If not using DATABASE_URL |
| `DB_PASSWORD` | Database password | - | If not using DATABASE_URL |

### Redis/Cache Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379/0` | Yes (prod) |
| `CELERY_BROKER_URL` | Celery broker URL | Same as REDIS_URL | No |

### Waldur Integration Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `WALDUR_API_URL` | Waldur API base URL | `http://waldur-api.cmp.svc.cluster.local` | Yes |
| `WALDUR_API_TOKEN` | Waldur service account token | - | **Yes** |
| `WALDUR_WEBHOOK_SECRET` | Webhook signing secret | - | **Yes** |

### OIDC/Keycloak Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OIDC_ENABLED` | Enable OIDC auth | `True` | No |
| `OIDC_OP_BASE_URL` | Keycloak base URL | `https://sso.dev.gsv.dev` | Yes |
| `OIDC_OP_REALM` | Keycloak realm | `gsv` | Yes |
| `OIDC_OP_ISSUER` | Full issuer URL | Auto-derived | No |
| `OIDC_RP_CLIENT_ID` | OIDC client ID | `agent-registry` | Yes |
| `OIDC_RP_CLIENT_SECRET` | OIDC client secret | - | Yes (if confidential client) |
| `OIDC_VALID_AUDIENCES` | Additional valid audiences | - | No |

### Environment-Specific Values

| Variable | Dev | QA | Production |
|----------|-----|----|----|
| `DJANGO_ALLOWED_HOSTS` | `agent-registry.dev.gsv.dev` | `agent-registry.qa.digitlify.com` | `agent-registry.digitlify.com` |
| `WALDUR_API_URL` | `https://app.dev.gsv.dev/api/` | `https://app.qa.digitlify.com/api/` | `https://app.digitlify.com/api/` |
| `OIDC_OP_BASE_URL` | `https://sso.dev.gsv.dev` | `https://sso.qa.digitlify.com` | `https://sso.digitlify.com` |
| `OIDC_OP_REALM` | `gsv` | `digitlify` | `digitlify` |

---

## Waldur CMP (cmp-frontend / cmp-backend)

### Key Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WALDUR_MASTERMIND_URL` | Backend API URL | Yes |
| `WALDUR_HOMEPORT_URL` | Frontend URL | Yes |
| `WALDUR_DATABASE_URL` | PostgreSQL connection | Yes |
| `WALDUR_REDIS_URL` | Redis connection | Yes |
| `WALDUR_SECRET_KEY` | Django secret | Yes |

Refer to Waldur documentation for complete variable list.

---

## Kubernetes Secrets

### cmp-portal-secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: cmp-portal-secrets
type: Opaque
stringData:
  NEXTAUTH_SECRET: "<generated-secret>"
  KEYCLOAK_SECRET: "<from-keycloak>"
```

### agent-registry-secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: agent-registry-secrets
type: Opaque
stringData:
  DJANGO_SECRET_KEY: "<generated-secret>"
  DB_PASSWORD: "<database-password>"
  WALDUR_API_TOKEN: "<waldur-service-token>"
  WALDUR_WEBHOOK_SECRET: "<webhook-secret>"
  OIDC_RP_CLIENT_SECRET: "<keycloak-client-secret>"
```

---

## Generating Secrets

```bash
# Generate random secret (32 bytes hex)
openssl rand -hex 32

# Generate base64 secret
openssl rand -base64 32

# Generate Django secret key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## Validation Checklist

Before deployment, verify:

- [ ] All `**Yes**` required variables are set
- [ ] Secrets are not committed to git
- [ ] URLs match the target environment
- [ ] Database is accessible from the deployment
- [ ] Redis is accessible from the deployment
- [ ] Keycloak realm and client exist
- [ ] Waldur API token has correct permissions

---

## Related Documentation

- [Waldur Webhook Setup](./WALDUR-WEBHOOK-SETUP.md)
- [Operator Runbook](./OPERATOR-RUNBOOK.md)
- [GTM Checklist](../GTM-CHECKLIST-2024-12-11.md)
