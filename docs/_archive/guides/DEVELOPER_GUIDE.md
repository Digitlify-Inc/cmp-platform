# GSV Platform Developer Guide

## Introduction

Guide for developers building applications and integrations on the GSV Platform.

---

## Development Environment

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Docker | 20.10+ | Containers |
| kubectl | 1.28+ | K8s CLI |
| Helm | 3.12+ | Charts |
| Python | 3.11+ | Backend |
| Node.js | 18+ | Frontend |
| Git | 2.40+ | Version control |

### Local Kubernetes (Kind)

```bash
# Install Kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind && sudo mv ./kind /usr/local/bin/kind

# Create cluster
kind create cluster --name gsv-dev
```

---

## Platform APIs

| API | Base URL | Purpose |
|-----|----------|---------|
| CMP API | https://portal.{domain}/api | Marketplace |
| Agent Registry | https://api.{domain}/api/v1 | Agent mgmt |
| Agent Studio | https://studio.{domain}/api/v1 | Flows |

### Authentication

```bash
# Get token
TOKEN=$(curl -s -X POST https://portal.dev.gsv.dev/api-auth/password/ \
  -H "Content-Type: application/json" \
  -d '{"username": "user@example.com", "password": "password"}' | jq -r '.token')

# Use token
curl -H "Authorization: Token $TOKEN" https://portal.dev.gsv.dev/api/
```

### OAuth 2.0 (Client Credentials)

```python
import requests

def get_service_token():
    response = requests.post(
        "https://sso.dev.gsv.dev/realms/gsv-platform/protocol/openid-connect/token",
        data={
            "grant_type": "client_credentials",
            "client_id": "your-service",
            "client_secret": "your-secret"
        }
    )
    return response.json()["access_token"]
```

---

## CMP API Examples

### List Projects

```bash
curl -H "Authorization: Token $TOKEN" \
  https://portal.dev.gsv.dev/api/projects/
```

### Create Project

```python
import requests

headers = {"Authorization": f"Token {TOKEN}", "Content-Type": "application/json"}

project = {
    "name": "my-project",
    "description": "My project",
    "customer": "/api/customers/uuid/"
}

response = requests.post(
    "https://portal.dev.gsv.dev/api/projects/",
    headers=headers,
    json=project
)
```

---

## Agent Registry API

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/agents | List agents |
| POST | /api/v1/agents | Create agent |
| GET | /api/v1/agents/{id} | Get agent |
| PUT | /api/v1/agents/{id} | Update agent |
| DELETE | /api/v1/agents/{id} | Delete agent |

### Register Agent

```python
import requests

agent_data = {
    "name": "my-agent",
    "description": "Support agent",
    "project_id": "project-uuid",
    "type": "conversational",
    "config": {
        "model": "gpt-4",
        "temperature": 0.7
    }
}

response = requests.post(
    "https://api.dev.gsv.dev/api/v1/agents",
    headers={"Authorization": f"Bearer {TOKEN}"},
    json=agent_data
)
```

---

## Building AI Agents

### Agent Studio Workflow

1. Design flow in Agent Studio UI
2. Test in Playground
3. Export configuration
4. Register in Agent Registry
5. Deploy via GitOps

### Invoke Agent

```python
def invoke_agent(agent_id, message, session_id=None):
    response = requests.post(
        f"https://runtime.dev.gsv.dev/api/v1/agents/{agent_id}/invoke",
        headers={"Authorization": f"Bearer {TOKEN}"},
        json={
            "message": message,
            "session_id": session_id
        }
    )
    return response.json()
```

---

## GitOps Workflow

### Repository Structure

```
gsv-gitops/
+-- bootstrap/       # ArgoCD bootstrap
+-- platform/
|   +-- apps/       # ArgoCD Applications
|   +-- base/       # Base configs
|   +-- overlays/   # Environment overrides
+-- charts/         # Helm charts
```

### Development Flow

1. Create feature branch
2. Make changes
3. Test locally with kustomize/helm
4. Commit and push
5. Create PR (triggers CI)
6. Merge to main (ArgoCD syncs)

```bash
# Test kustomize
kustomize build platform/overlays/dev/my-app

# Test helm
helm template my-release charts/my-chart -f values-dev.yaml
```

---

## Best Practices

### API Design
- RESTful conventions
- Version APIs (v1, v2)
- Consistent error responses
- Pagination for lists

### Security
- Never commit secrets
- Use ExternalSecrets
- Validate inputs
- Use TLS everywhere

### Kubernetes Resources

```yaml
# Always set limits
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

# Always set probes
livenessProbe:
  httpGet:
    path: /health
    port: 8080
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
```

### Observability

```python
import structlog
logger = structlog.get_logger()

logger.info("request_processed", user_id=user.id, duration_ms=duration)
```

### Git Commits

```
feat: add new feature
fix: bug fix
docs: documentation
refactor: code restructuring
test: adding tests
```
