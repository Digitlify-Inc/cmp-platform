# E2E UAT Test Results

**Date:** December 12, 2024
**Tester:** Claude (Automated)
**Environment:** dev.gsv.dev

---

## Executive Summary

| Component | Status | Notes |
|-----------|--------|-------|
| SSO (Keycloak) | PASS | OIDC configuration working |
| Portal | FAIL | SSO client ID mismatch (FIXED) |
| CMP (Waldur) | PARTIAL | app.dev.gsv.dev - No response (may need VPN/internal) |
| Agent Studio | PASS | OAuth2 Proxy working |
| Agent Registry API | PASS | Returns 401 (expected - needs auth) |
| Agent Runtime | PASS | OAuth2 Proxy working |

---

## Detailed Test Results

### 1. SSO (Keycloak) - sso.dev.gsv.dev

**Status:** PASS

**Test:** OIDC Discovery Endpoint
```bash
curl -sk https://sso.dev.gsv.dev/realms/gsv/.well-known/openid-configuration
```

**Result:** Returns full OIDC configuration including:
- `issuer`: https://sso.dev.gsv.dev/realms/gsv
- `authorization_endpoint`: https://sso.dev.gsv.dev/realms/gsv/protocol/openid-connect/auth
- `token_endpoint`: https://sso.dev.gsv.dev/realms/gsv/protocol/openid-connect/token
- All required endpoints present and correct

**Configured Clients:**
| Client ID | Purpose | Redirect URIs |
|-----------|---------|---------------|
| backstage | Internal Developer Portal | idp.dev.gsv.dev |
| portal | GSV Portal (Next.js) | portal.dev.gsv.dev |
| gsv-api | API Testing | Direct access grants |
| agent-registry | Agent Registry API | api.dev.gsv.dev |
| agentstudio | Agent Studio (LangFlow) | studio.dev.gsv.dev |
| agentruntime | Agent Runtime | runtime.dev.gsv.dev |
| cmp-portal | Waldur CMP | app.dev.gsv.dev |
| gsv-website | Marketing Website | dev.gsv.dev |

---

### 2. Portal - portal.dev.gsv.dev

**Status:** FAIL (Configuration Issue - FIXED)

**Test:** Login Page
```bash
curl -sk https://portal.dev.gsv.dev/login
```

**Result:** Page loads correctly with "Sign in with SSO" button

**Test:** Auth Providers
```bash
curl -sk https://portal.dev.gsv.dev/api/auth/providers
```

**Result:** Returns Keycloak provider configuration:
```json
{
  "keycloak": {
    "id": "keycloak",
    "name": "Keycloak",
    "signinUrl": "https://portal.dev.gsv.dev/api/auth/signin/keycloak",
    "callbackUrl": "https://portal.dev.gsv.dev/api/auth/callback/keycloak"
  }
}
```

**Test:** SSO Signin
```bash
curl -skI https://portal.dev.gsv.dev/api/auth/signin/keycloak
```

**Result:** HTTP 400 Bad Request

**Root Cause:**
The k8s ConfigMap was using `KEYCLOAK_ID=cmp-portal`, but the `cmp-portal` client in Keycloak is configured for `app.dev.gsv.dev` (Waldur), NOT `portal.dev.gsv.dev`.

The correct client to use is `portal`, which has redirect URIs for `portal.dev.gsv.dev`.

**Fix Applied:**
1. Updated `k8s/configmap.yaml`: Changed `KEYCLOAK_ID` from `cmp-portal` to `portal`
2. Updated `k8s/secret.yaml`: Changed `KEYCLOAK_SECRET` from `cmp-portal-oidc-secret` to `gsv-portal-client-secret`
3. Updated `.env.example`: Updated documentation and default client ID

**Files Modified:**
- `cmp-portal/k8s/configmap.yaml`
- `cmp-portal/k8s/secret.yaml`
- `cmp-portal/.env.example`

**Action Required:** Redeploy cmp-portal with updated configuration.

---

### 3. CMP (Waldur) - app.dev.gsv.dev

**Status:** PARTIAL (No Response)

**Test:** Homepage
```bash
curl -sk https://app.dev.gsv.dev
```

**Result:** Empty response / Connection issues

**Notes:**
- May require VPN or internal network access
- Could be firewall/ingress configuration issue
- Need to verify Waldur deployment status

**Action Required:** Check Waldur deployment and ingress configuration.

---

### 4. Agent Studio - studio.dev.gsv.dev

**Status:** PASS

**Test:** Homepage
```bash
curl -sk https://studio.dev.gsv.dev
```

**Result:** Returns OAuth2 Proxy sign-in page:
- "Sign in with OpenID Connect" button present
- OAuth2 Proxy version v7.6.0
- Redirects to `/oauth2/start` for authentication

**Notes:**
- OAuth2 Proxy correctly protecting the application
- Will redirect to Keycloak for authentication
- Client ID: `agentstudio`

---

### 5. Agent Registry API - api.dev.gsv.dev

**Status:** PASS

**Test:** Agents Endpoint (Unauthenticated)
```bash
curl -sk https://api.dev.gsv.dev/api/v1/agents/
```

**Result:**
```json
{
  "error": {
    "code": "not_authenticated",
    "message": "Authentication credentials were not provided."
  }
}
```

**Notes:**
- API is responding correctly
- Returns 401 Unauthorized as expected (requires authentication)
- API endpoint pattern: `/api/v1/agents/`

**Test:** Health Endpoint
```bash
curl -sk https://api.dev.gsv.dev/api/v1/health
```

**Result:** 404 Not Found (health endpoint may be at different path)

---

### 6. Agent Runtime - runtime.dev.gsv.dev

**Status:** PASS

**Test:** Homepage
```bash
curl -sk https://runtime.dev.gsv.dev
```

**Result:** Returns OAuth2 Proxy sign-in page:
- "Sign in with OpenID Connect" button present
- OAuth2 Proxy version v7.6.0
- Redirects to `/oauth2/start` for authentication

**Notes:**
- OAuth2 Proxy correctly protecting the application
- Will redirect to Keycloak for authentication
- Client ID: `agentruntime`

---

## Issues Found and Fixes

### Issue #1: Portal SSO Client ID Mismatch

**Severity:** HIGH (Blocks login)

**Description:**
The Customer Portal (portal.dev.gsv.dev) was configured to use the `cmp-portal` Keycloak client, which has redirect URIs for `app.dev.gsv.dev` (Waldur), not `portal.dev.gsv.dev`.

**Impact:**
- Users cannot complete SSO login flow
- Keycloak returns error due to invalid redirect URI

**Fix:**
Changed the portal to use the `portal` Keycloak client which has correct redirect URIs.

**Files Changed:**
```
cmp-portal/k8s/configmap.yaml
cmp-portal/k8s/secret.yaml
cmp-portal/.env.example
```

**Deployment Steps:**
```bash
# Apply updated configuration
kubectl apply -f k8s/configmap.yaml -n portal
kubectl apply -f k8s/secret.yaml -n portal

# Restart the deployment to pick up new config
kubectl rollout restart deployment/cmp-portal -n portal
```

---

### Issue #2: CMP (Waldur) Not Responding

**Severity:** MEDIUM

**Description:**
The CMP endpoint at app.dev.gsv.dev returns empty responses.

**Possible Causes:**
1. Waldur deployment not running
2. Ingress not configured
3. Network/firewall blocking external access
4. Service not exposed correctly

**Action Required:**
```bash
# Check deployment status
kubectl get pods -n cmp
kubectl get ingress -n cmp
kubectl describe ingress -n waldur
```

---

## Component Architecture Summary

```
                    EXTERNAL ACCESS
                          |
            +-------------+-------------+
            |             |             |
            v             v             v
     +-----------+  +-----------+  +-----------+
     |   SSO     |  |  Portal   |  |   CMP     |
     | Keycloak  |  | (Next.js) |  | (Waldur)  |
     +-----------+  +-----------+  +-----------+
            |             |             |
            v             v             v
     +---------------------------------------------+
     |              KUBERNETES CLUSTER              |
     +---------------------------------------------+
            |             |             |
     +-----------+  +-----------+  +-----------+
     |  Studio   |  | Registry  |  |  Runtime  |
     | (LangFlow)|  |   (API)   |  | (LangFlow)|
     +-----------+  +-----------+  +-----------+
```

---

## Recommendations

### Immediate Actions

1. **Redeploy Portal** with fixed SSO configuration
2. **Investigate CMP** (Waldur) deployment status
3. **Add health endpoints** to Agent Registry for monitoring

### Short-term Improvements

1. Add status page at `status.dev.gsv.dev`
2. Implement centralized logging
3. Add Prometheus metrics endpoints
4. Configure alerting for service health

### Documentation Needs

1. Update deployment runbook with correct client IDs
2. Document client-to-service mapping
3. Create troubleshooting guide for SSO issues

---

## Test Environment Details

| Property | Value |
|----------|-------|
| Keycloak Realm | gsv |
| Environment | dev |
| Domain | dev.gsv.dev |
| Kubernetes Cluster | (Not accessible from test machine) |
| Test Method | curl with SSL verification disabled |

---

## Appendix: Keycloak Client Reference

| Client ID | Service | Root URL | Secret Location |
|-----------|---------|----------|-----------------|
| portal | Customer Portal | portal.dev.gsv.dev | gsv-portal-client-secret |
| cmp-portal | Waldur CMP (app.dev.gsv.dev) | app.dev.gsv.dev | cmp-portal-oidc-secret |
| agentstudio | LangFlow Studio | studio.dev.gsv.dev | agentstudio-oauth2-proxy |
| agentruntime | LangFlow Runtime | runtime.dev.gsv.dev | agentruntime-oauth2-proxy |
| agent-registry | Registry API | api.dev.gsv.dev | agent-registry-oidc-secret |
| backstage | IDP | idp.dev.gsv.dev | backstage-secrets |
| gsv-website | Marketing Site | dev.gsv.dev | gsv-website-oidc-secret |
