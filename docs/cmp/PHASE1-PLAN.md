# Phase 1 Implementation Plan - Control Plane MVP

**Created:** 2025-12-18
**Status:** In Progress

---

## Overview

Phase 1 builds the Control Plane service - the source of truth for the CMP platform. This includes organizations, offerings, instances, wallets, and billing.

---

## 1. Services to Build

### 1.1 Control Plane (Django/DRF)

**Location:** `gsv-platform/services/control-plane/`

**Technology Stack:**
- Python 3.11+
- Django 5.0+
- Django REST Framework 3.14+
- PostgreSQL (via CNPG in cluster)
- OIDC authentication (Keycloak)

**Django Apps:**
| App | Models | Purpose |
|-----|--------|---------|
| `orgs` | Organization, Project, Team, Membership | Multi-tenancy |
| `offerings` | Offering, OfferingVersion | Agent/app catalog |
| `instances` | Instance, InstanceConfig | User subscriptions |
| `billing` | Wallet, LedgerEntry, Reservation | Credit system |
| `connectors` | ConnectorBinding | Secret bindings |
| `integrations` | IdempotencyRecord | Webhook handling |

**API Endpoints (from OpenAPI spec):**
- `POST /integrations/saleor/order-paid` - Webhook ingestion
- `POST /orgs/auto` - Auto-create workspace
- `GET/POST /offerings` - Offering CRUD
- `POST /offerings/{id}/versions` - Version management
- `GET/POST /instances` - Instance lifecycle
- `GET /instances/{id}/entitlements` - Capability lookup
- `GET /wallets/{id}` - Wallet balance
- `POST /wallets/{id}/topups` - Credit top-up
- `POST /billing/authorize` - Reserve credits
- `POST /billing/settle` - Debit actual usage
- `POST /connectors/bindings` - Create binding
- `POST /connectors/bindings/{id}/revoke` - Revoke binding

### 1.2 Gateway (FastAPI)

**Location:** `gsv-platform/services/gateway/`

**Technology Stack:**
- Python 3.11+
- FastAPI 0.109+
- httpx (async HTTP client)
- python-jose (JWT validation)

**API Endpoints:**
- `POST /v1/runs` - Execute agent run
- `POST /v1/widget/session:init` - Widget session

**Responsibilities:**
- Validate JWT from SSO (Keycloak)
- Call Control Plane for billing authorize/settle
- Route to Runner service
- Return response with usage/billing info

---

## 2. Database Schema

### Core Tables

```sql
-- Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    owner_id VARCHAR(255) NOT NULL,  -- Keycloak user ID
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, slug)
);

-- Offerings (Agents/Apps catalog)
CREATE TABLE offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,  -- agent, app, assistant, automation
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',  -- draft, published, paused, eos, eol
    saleor_product_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE offering_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_id UUID REFERENCES offerings(id),
    version_label VARCHAR(50) NOT NULL,
    artifact_s3_key VARCHAR(500) NOT NULL,
    artifact_sha256 CHAR(64) NOT NULL,
    capabilities JSONB DEFAULT '[]',
    defaults JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(offering_id, version_label)
);

-- Instances (User subscriptions)
CREATE TABLE instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_version_id UUID REFERENCES offering_versions(id),
    org_id UUID REFERENCES organizations(id),
    project_id UUID REFERENCES projects(id),
    plan_id VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    state VARCHAR(50) DEFAULT 'requested',  -- requested, provisioning, active, paused, terminated
    overrides JSONB DEFAULT '{}',
    effective_config JSONB DEFAULT '{}',
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    balance INTEGER DEFAULT 0,
    currency VARCHAR(20) DEFAULT 'credits',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id),
    amount INTEGER NOT NULL,  -- positive = credit, negative = debit
    entry_type VARCHAR(50) NOT NULL,  -- topup, usage, refund, trial_grant
    reference_id VARCHAR(255),
    instance_id UUID REFERENCES instances(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id),
    instance_id UUID REFERENCES instances(id),
    amount INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',  -- pending, settled, expired, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    settled_at TIMESTAMPTZ
);

-- Idempotency
CREATE TABLE idempotency_records (
    key VARCHAR(255) PRIMARY KEY,
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Implementation Steps

### Step 1: Create Django Project Structure

```
services/control-plane/
├── Dockerfile
├── requirements.txt
├── manage.py
├── pyproject.toml
├── control_plane/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   ├── asgi.py
│   └── apps/
│       ├── orgs/
│       ├── offerings/
│       ├── instances/
│       ├── billing/
│       ├── connectors/
│       └── integrations/
└── tests/
```

### Step 2: Create FastAPI Gateway Project

```
services/gateway/
├── Dockerfile
├── requirements.txt
├── main.py
├── pyproject.toml
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── auth/
│   │   ├── __init__.py
│   │   └── jwt.py
│   ├── billing/
│   │   ├── __init__.py
│   │   └── client.py
│   ├── routing/
│   │   ├── __init__.py
│   │   └── runner.py
│   └── api/
│       ├── __init__.py
│       ├── runs.py
│       └── widget.py
└── tests/
```

### Step 3: Create K8s Manifests

```
gsv-gitops/platform/base/
├── cmp-control-plane/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── external-secret.yaml
│   └── kustomization.yaml
└── cmp-gateway/
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    ├── configmap.yaml
    ├── external-secret.yaml
    └── kustomization.yaml
```

### Step 4: Create CNPG Database

```
gsv-gitops/platform/base/cnpg/cmp-control-plane-postgres/
├── cluster.yaml
├── credentials-secret.yaml
└── kustomization.yaml
```

---

## 4. MVP Scope (What to Build First)

### Priority 1 (Must Have for MVP)
1. **orgs app** - Auto-create workspace (`POST /orgs/auto`)
2. **offerings app** - List/get offerings (read-only for now)
3. **instances app** - Create/list instances
4. **billing app** - Wallet, authorize, settle

### Priority 2 (Phase 1 Complete)
5. **integrations app** - Saleor webhook handler
6. **connectors app** - Connector bindings
7. Gateway service with runs endpoint

### Deferred
- Offering creation UI (use admin for now)
- GitOps commit logic (manual for now)
- Full RBAC (use simple owner check for now)

---

## 5. Configuration

### Environment Variables (Control Plane)

```bash
# Django
DEBUG=false
SECRET_KEY=<from-vault>
ALLOWED_HOSTS=cp.dev.gsv.dev

# Database
DATABASE_URL=postgres://user:pass@cmp-control-plane-postgres-rw:5432/control_plane

# SSO (Keycloak)
OIDC_ISSUER=https://sso.dev.gsv.dev/realms/gsv
OIDC_CLIENT_ID=cmp-control-plane
OIDC_CLIENT_SECRET=<from-vault>

# MinIO
S3_ENDPOINT=http://minio.storage:9000
S3_ACCESS_KEY=<from-vault>
S3_SECRET_KEY=<from-vault>
S3_BUCKET=cmp-artifacts

# Vault
VAULT_ADDR=http://vault.vault:8200
VAULT_TOKEN=<from-vault>
```

### Environment Variables (Gateway)

```bash
# FastAPI
DEBUG=false
LOG_LEVEL=info

# Control Plane
CONTROL_PLANE_URL=http://cmp-control-plane.cmp:8000

# Runner
RUNNER_URL=http://cmp-runner.cmp:8000

# SSO (Keycloak)
OIDC_ISSUER=https://sso.dev.gsv.dev/realms/gsv
OIDC_AUDIENCE=cmp-gateway
```

---

## 6. Testing Strategy

### Unit Tests
- Model validation
- Serializer tests
- Business logic in services

### Integration Tests
- API endpoint tests with test database
- JWT validation with mock OIDC

### E2E Tests (k6)
- Full flow: create workspace -> subscribe -> run agent

---

## 7. Success Criteria

- [ ] Control Plane deployed and healthy
- [ ] Gateway deployed and healthy
- [ ] `POST /orgs/auto` creates workspace
- [ ] `GET /offerings` returns catalog
- [ ] `POST /instances` creates subscription
- [ ] `POST /billing/authorize` reserves credits
- [ ] `POST /billing/settle` debits usage
- [ ] Gateway `/v1/runs` validates JWT and routes

---

## 8. Next Steps After Phase 1

1. **Phase 2**: Runner service + Studio integration
2. **Phase 3**: Commerce (Saleor) + Provisioner
3. **Phase 4**: Web App (Next.js)
4. **Phase 5**: Connector Gateway

---

*Last Updated: 2025-12-18*
