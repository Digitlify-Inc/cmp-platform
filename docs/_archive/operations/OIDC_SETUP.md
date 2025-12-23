# OIDC Setup Guide

Guide for configuring OIDC authentication with Keycloak for platform services.

---

## Overview

The GSV Platform uses oauth2-proxy as an OIDC gatekeeper in front of services that don't have native OIDC support. This provides SSO authentication while the underlying service (like Langflow) uses its own local authentication.

**Flow:**
```
Browser → oauth2-proxy → Keycloak Login → oauth2-proxy → Backend Service
```

---

## Prerequisites

1. Keycloak running and accessible at `sso.dev.gsv.dev`
2. A realm created (e.g., `digitlify`)
3. ArgoCD managing the platform apps

---

## Step 1: Create Keycloak Client

### 1.1 Access Keycloak Admin Console

```
URL: https://sso.dev.gsv.dev/admin
Username: temp-admin
Password: (from secret - see CREDENTIALS.md)
```

### 1.2 Select the Realm

Navigate to the `digitlify` realm (or create one if needed).

### 1.3 Create the Client

1. Go to **Clients** → **Create client**
2. **General Settings:**
   - Client ID: `cmp-agentstudio` (or your chosen name)
   - Client Protocol: `openid-connect`
   - Click **Next**

3. **Capability config:**
   - Client authentication: **ON** ✓
   - Authorization: OFF
   - Authentication flow:
     - Standard flow: **✓ checked** (required!)
     - Direct access grants: optional
     - Others: unchecked
   - Click **Next**

4. **Login settings:**
   - Root URL: (leave blank)
   - Home URL: (leave blank)
   - Valid redirect URIs: `https://studio.dev.gsv.dev/oauth2/callback`
   - Valid post logout redirect URIs: (leave blank)
   - Web origins: `https://studio.dev.gsv.dev`
   - Click **Save**

### 1.4 Get Client Secret

1. Go to **Credentials** tab
2. Copy the **Client Secret** value
3. Keep this safe - you'll need it for the Kubernetes secret

---

## Step 2: Configure oauth2-proxy

### 2.1 Understanding the Architecture

oauth2-proxy needs to:
- Redirect browser to Keycloak for login (external URL)
- Exchange auth code for tokens (internal URL - cluster DNS)
- Validate tokens (internal URL - cluster DNS)

This split (external for browser, internal for server-side) is critical in Kind/local clusters where external DNS resolution differs from internal.

### 2.2 Create the Secret

File: `platform/base/agentstudio/oauth2-proxy-secret.yaml`

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: agentstudio-oauth2-proxy
  namespace: agentstudio
type: Opaque
stringData:
  # MUST match the Keycloak client ID exactly (case-sensitive)
  client-id: "cmp-agentstudio"

  # From Keycloak → Clients → cmp-agentstudio → Credentials tab
  client-secret: "YOUR_CLIENT_SECRET_HERE"

  # Generate with: openssl rand -base64 32
  cookie-secret: "RANDOM_32_BYTE_STRING"
```

### 2.3 Configure the Deployment Patch

File: `platform/overlays/dev/agentstudio/oauth2-proxy-patch.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agentstudio-oauth2-proxy
  namespace: agentstudio
spec:
  template:
    spec:
      containers:
        - name: oauth2-proxy
          env:
            # OIDC Provider
            - name: OAUTH2_PROXY_PROVIDER
              value: "oidc"
            
            # Skip OIDC discovery - set endpoints manually
            # This prevents oauth2-proxy from using external URLs from discovery
            - name: OAUTH2_PROXY_SKIP_OIDC_DISCOVERY
              value: "true"
            
            # Issuer URL (for token validation)
            - name: OAUTH2_PROXY_OIDC_ISSUER_URL
              value: "https://sso.dev.gsv.dev/realms/digitlify"
            
            # Login URL - EXTERNAL (browser redirects here)
            - name: OAUTH2_PROXY_LOGIN_URL
              value: "https://sso.dev.gsv.dev/realms/digitlify/protocol/openid-connect/auth"
            
            # Redeem URL - INTERNAL (server-side token exchange)
            - name: OAUTH2_PROXY_REDEEM_URL
              value: "http://digitlify-idp-service.keycloak.svc.cluster.local:8080/realms/digitlify/protocol/openid-connect/token"
            
            # JWKS URL - INTERNAL (server-side token validation)
            - name: OAUTH2_PROXY_OIDC_JWKS_URL
              value: "http://digitlify-idp-service.keycloak.svc.cluster.local:8080/realms/digitlify/protocol/openid-connect/certs"
            
            # Client credentials from secret
            - name: OAUTH2_PROXY_CLIENT_ID
              valueFrom:
                secretKeyRef:
                  name: agentstudio-oauth2-proxy
                  key: client-id
            - name: OAUTH2_PROXY_CLIENT_SECRET
              valueFrom:
                secretKeyRef:
                  name: agentstudio-oauth2-proxy
                  key: client-secret
            
            # External callback URL (what browser sees)
            - name: OAUTH2_PROXY_REDIRECT_URL
              value: "https://studio.dev.gsv.dev/oauth2/callback"
            
            # Upstream service
            - name: OAUTH2_PROXY_UPSTREAMS
              value: "http://agentstudio.agentstudio.svc.cluster.local"
            
            # Allow all email domains
            - name: OAUTH2_PROXY_EMAIL_DOMAINS
              value: "*"
            
            # Listen address
            - name: OAUTH2_PROXY_HTTP_ADDRESS
              value: "0.0.0.0:4180"
            
            # Cookie settings
            - name: OAUTH2_PROXY_COOKIE_SECRET
              valueFrom:
                secretKeyRef:
                  name: agentstudio-oauth2-proxy
                  key: cookie-secret
            - name: OAUTH2_PROXY_COOKIE_SECURE
              value: "false"  # Set to "true" for production with real TLS
            - name: OAUTH2_PROXY_COOKIE_SAMESITE
              value: "lax"
            
            # Header settings
            - name: OAUTH2_PROXY_SET_AUTHORIZATION_HEADER
              value: "true"
            - name: OAUTH2_PROXY_SET_XAUTHREQUEST
              value: "true"
            - name: OAUTH2_PROXY_PASS_ACCESS_TOKEN
              value: "true"
            
            # Behind reverse proxy
            - name: OAUTH2_PROXY_REVERSE_PROXY
              value: "true"
            
            # Skip TLS verification for internal calls
            - name: OAUTH2_PROXY_SSL_INSECURE_SKIP_VERIFY
              value: "true"
            
            # Skip issuer verification (internal vs external URL mismatch)
            - name: OAUTH2_PROXY_INSECURE_OIDC_SKIP_ISSUER_VERIFICATION
              value: "true"
```

---

## Step 3: Configure Ingress

The ingress should route traffic through oauth2-proxy:

File: `platform/overlays/dev/agentstudio/ingress-patch.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: agentstudio
  namespace: agentstudio
  annotations:
    cert-manager.io/cluster-issuer: selfsigned-ca
spec:
  rules:
    - host: studio.dev.gsv.dev
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: agentstudio-oauth2-proxy  # Routes through proxy
                port:
                  number: 4180
  tls:
    - hosts:
        - studio.dev.gsv.dev
      secretName: agentstudio-dev-tls
```

---

## Step 4: Create Keycloak User

Since oauth2-proxy is just a gatekeeper (not integrated with the backend), you need users in Keycloak to authenticate:

1. In Keycloak Admin → **Users** → **Add user**
2. Fill in:
   - Username: `admin`
   - Email: `admin@example.com`
   - Email verified: ON
3. Click **Create**
4. Go to **Credentials** tab → **Set password**
5. Set password, turn OFF "Temporary"
6. Save

---

## Step 5: Deploy and Verify

### 5.1 Commit and Push

```bash
cd gsv-gitops
git add -A
git commit -m "feat: configure OIDC for agentstudio"
git push
```

### 5.2 Wait for ArgoCD Sync

```bash
# Watch ArgoCD sync
kubectl -n argocd get app agentstudio -w

# Or force sync
kubectl -n argocd patch app agentstudio --type merge \
  -p '{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}'
```

### 5.3 Restart oauth2-proxy

After secret changes, restart the pod:

```bash
kubectl -n agentstudio delete pod -l app.kubernetes.io/name=oauth2-proxy
```

### 5.4 Check Logs

```bash
kubectl -n agentstudio logs -l app.kubernetes.io/name=oauth2-proxy -f
```

Look for:
- `OAuthProxy configured for OpenID Connect Client ID: cmp-agentstudio`
- No errors on callback

---

## Troubleshooting

### Error: "Invalid client or Invalid client credentials"

**Cause:** Client ID or secret mismatch between K8s secret and Keycloak.

**Fix:**
```bash
# Check what's in K8s
kubectl -n agentstudio get secret agentstudio-oauth2-proxy \
  -o jsonpath='{.data.client-id}' | base64 -d && echo
kubectl -n agentstudio get secret agentstudio-oauth2-proxy \
  -o jsonpath='{.data.client-secret}' | base64 -d && echo

# Compare with Keycloak Credentials tab - must match exactly
```

### Error: "dial tcp 127.0.0.1:443: connect: connection refused"

**Cause:** oauth2-proxy is using OIDC discovery and getting external URLs that resolve to localhost inside the cluster.

**Fix:** Set `OAUTH2_PROXY_SKIP_OIDC_DISCOVERY=true` and configure internal URLs manually for REDEEM_URL and JWKS_URL.

### Error: "Client not enabled to retrieve service account"

**Cause:** Testing with `client_credentials` grant but that's not enabled.

**Note:** This is not an error for authorization_code flow. The test command should return "Code not valid" if credentials are correct.

### Test Credentials Directly

```bash
kubectl run curl-test --rm -it --restart=Never --image=curlimages/curl -- \
  -X POST "http://digitlify-idp-service.keycloak.svc.cluster.local:8080/realms/digitlify/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=cmp-agentstudio" \
  -d "client_secret=YOUR_SECRET" \
  -d "grant_type=authorization_code" \
  -d "code=test123" \
  -d "redirect_uri=https://studio.dev.gsv.dev/oauth2/callback"
```

Expected: `{"error":"invalid_grant","error_description":"Code not valid"}`

If you see "Invalid client credentials", the secret is wrong.

---

## Key Configuration Points

| Setting | Value | Why |
|---------|-------|-----|
| SKIP_OIDC_DISCOVERY | true | Prevents using external URLs from discovery |
| LOGIN_URL | External | Browser needs to reach Keycloak |
| REDEEM_URL | Internal | Server-side, use cluster DNS |
| JWKS_URL | Internal | Server-side, use cluster DNS |
| INSECURE_OIDC_SKIP_ISSUER_VERIFICATION | true | Issuer in token is external, but we validate internally |
| COOKIE_SECURE | false | For local dev without real TLS |

---

## Security Notes

1. **Production:** Set `COOKIE_SECURE=true` with real TLS certificates
2. **Production:** Use proper secrets management (Vault, Sealed Secrets)
3. **Production:** Remove `SSL_INSECURE_SKIP_VERIFY`
4. **Production:** Configure proper issuer verification

---

## Backstage Native OIDC (Without oauth2-proxy)

Backstage has native OIDC support and doesn't require oauth2-proxy. This section covers configuring Backstage directly with Keycloak.

### Prerequisites

1. Keycloak running with realm `gsv`
2. Backstage deployed
3. User entities in Backstage catalog matching Keycloak user emails

### Step 1: Create Keycloak Client for Backstage

#### 1.1 Access Keycloak Admin

```
URL: https://sso.dev.gsv.dev/admin
Realm: gsv
```

#### 1.2 Create Client

1. **Clients** → **Create client**
2. **General Settings:**
   - Client ID: `backstage`
   - Click **Next**
3. **Capability config:**
   - Client authentication: **ON**
   - Standard flow: **ON** (Authorization Code)
   - Click **Next**
4. **Login settings:**
   - Root URL: `https://backstage.dev.gsv.dev`
   - Valid redirect URIs: `https://backstage.dev.gsv.dev/api/auth/oidc/handler/frame`
   - Web origins: `https://backstage.dev.gsv.dev`
   - Click **Save**

#### 1.3 Get Client Secret

1. Go to **Credentials** tab
2. Copy the **Client Secret**

### Step 2: Configure Backstage

#### 2.1 Create Secrets

```bash
kubectl create secret generic backstage-secrets \
  --namespace=backstage \
  --from-literal=AUTH_SESSION_SECRET=$(openssl rand -base64 32) \
  --from-literal=AUTH_OIDC_CLIENT_ID=backstage \
  --from-literal=AUTH_OIDC_CLIENT_SECRET='<your-client-secret>'
```

#### 2.2 ArgoCD Application Config

Update `platform/apps/dev/backstage.yaml`:

```yaml
backstage:
  appConfig:
    # Use OIDC sign-in page
    signInPage: oidc

    auth:
      session:
        secret: ${AUTH_SESSION_SECRET}
      environment: production
      providers:
        oidc:
          production:
            # IMPORTANT: Use internal cluster DNS, not external URL
            metadataUrl: http://digitlify-idp-service.sso.svc.cluster.local:8080/realms/gsv/.well-known/openid-configuration
            clientId: ${AUTH_OIDC_CLIENT_ID}
            clientSecret: ${AUTH_OIDC_CLIENT_SECRET}
            prompt: auto
            signIn:
              resolvers:
                # Matches OIDC email to User entity spec.profile.email
                - resolver: emailMatchingUserEntityProfileEmail
                # Fallback: matches email local part to User entity name
                - resolver: emailLocalPartMatchingUserEntityName

  extraEnvVarsSecrets:
    - backstage-secrets
```

### Step 3: Create User Entities in Catalog

Users must exist in the Backstage catalog for sign-in resolvers to work.

#### 3.1 Create ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backstage-user-catalog
  namespace: backstage
data:
  users.yaml: |
    apiVersion: backstage.io/v1alpha1
    kind: User
    metadata:
      name: admin
    spec:
      profile:
        displayName: Admin User
        email: admin@gsv.dev  # MUST match Keycloak user email
      memberOf:
        - platform-team
    ---
    apiVersion: backstage.io/v1alpha1
    kind: Group
    metadata:
      name: platform-team
    spec:
      type: team
      children: []
```

#### 3.2 Mount ConfigMap in Backstage

```yaml
backstage:
  extraVolumes:
    - name: user-catalog
      configMap:
        name: backstage-user-catalog

  extraVolumeMounts:
    - name: user-catalog
      mountPath: /app/users

  appConfig:
    catalog:
      locations:
        - type: file
          target: /app/users/users.yaml
          rules:
            - allow: [User, Group]
```

### Step 4: Create Keycloak User

1. In Keycloak Admin → realm `gsv` → **Users** → **Add user**
2. Fill in:
   - Username: `admin`
   - Email: `admin@gsv.dev` (MUST match catalog User entity)
   - Email verified: **ON**
3. Go to **Credentials** tab → **Set password**
4. Set password, turn OFF "Temporary"

### Key Differences from oauth2-proxy

| Aspect | oauth2-proxy | Backstage Native OIDC |
|--------|--------------|----------------------|
| Integration | External gatekeeper | Built into Backstage |
| User Identity | Just authentication | Full identity resolution |
| Catalog Integration | None | Maps to User entities |
| Session Management | Cookie-based | Backstage session |
| Sign-in Resolvers | N/A | emailMatching, etc. |

### Troubleshooting

#### "Unable to resolve user identity"

**Cause:** No matching User entity in the catalog.

**Fix:**
1. Check the email in Keycloak matches a User entity's `spec.profile.email`
2. Verify catalog locations are configured correctly
3. Check Backstage logs: `kubectl logs -n backstage -l app.kubernetes.io/name=backstage`

#### "OIDC discovery failed"

**Cause:** Backstage can't reach Keycloak internally.

**Fix:**
1. Use internal cluster DNS: `http://digitlify-idp-service.sso.svc.cluster.local:8080/...`
2. Don't use external URL (it may not resolve from within the cluster)

#### "Invalid redirect URI"

**Cause:** Keycloak client config mismatch.

**Fix:** Ensure Keycloak client has:
- Valid redirect URIs: `https://backstage.dev.gsv.dev/api/auth/oidc/handler/frame`
- Web origins: `https://backstage.dev.gsv.dev`

---

## Agent Registry Native OIDC (Django + PyJWT)

Agent Registry has native OIDC/JWT authentication built with PyJWT and Django. It validates JWT tokens from Keycloak and authenticates users/service accounts.

### Architecture

```
Client → Agent Registry API → OIDC Token Validation → User/Service Account
                                    ↓
                             Keycloak JWKS
                        (internal cluster URL)
```

### Prerequisites

1. Keycloak running with realm `gsv`
2. OIDC client configured (e.g., `gsv-api` for service accounts)
3. Agent Registry deployed in `cmp` namespace

### Configuration (ConfigMap)

File: `platform/base/agent-registry/configmap.yaml`

**Critical OIDC Settings:**

```yaml
# OIDC Configuration (Keycloak)
OIDC_ENABLED: "True"

# Internal Keycloak URL for OIDC discovery (cluster DNS)
OIDC_OP_BASE_URL: "http://digitlify-idp-service.sso.svc.cluster.local:8080"
OIDC_OP_REALM: "gsv"

# Primary client ID for token validation
OIDC_RP_CLIENT_ID: "account"

# Additional valid audiences (comma-separated)
# Tokens from these clients are also accepted
OIDC_VALID_AUDIENCES: "gsv-api"

# EXTERNAL issuer URL for JWT validation
# Tokens are issued with this URL as the "iss" claim
OIDC_OP_ISSUER: "https://sso.dev.gsv.dev/realms/gsv"

# INTERNAL JWKS endpoint - CRITICAL!
# The pod CANNOT reach external URLs, so we MUST use internal cluster DNS
# This is used to fetch the public keys for JWT signature verification
OIDC_OP_JWKS_ENDPOINT: "http://digitlify-idp-service.sso.svc.cluster.local:8080/realms/gsv/protocol/openid-connect/certs"
```

### Key Configuration Points

| Setting | Value Type | Purpose |
|---------|------------|---------|
| `OIDC_OP_ISSUER` | External URL | Must match the `iss` claim in tokens |
| `OIDC_OP_JWKS_ENDPOINT` | Internal URL | Pod fetches signing keys from cluster DNS |
| `OIDC_RP_CLIENT_ID` | String | Primary audience for token validation |
| `OIDC_VALID_AUDIENCES` | Comma-separated | Additional valid audiences |

### Why Internal JWKS Endpoint?

**Problem:** When a pod tries to fetch JWKS from the external URL (`sso.dev.gsv.dev`), it times out because:
1. The pod cannot resolve external DNS to the ingress controller
2. Even if DNS works, the connection may loop back through the ingress

**Solution:** Use the internal Kubernetes service URL:
```
http://digitlify-idp-service.sso.svc.cluster.local:8080/realms/gsv/protocol/openid-connect/certs
```

This allows the pod to directly reach Keycloak within the cluster.

### Testing OIDC Authentication

```bash
# Port forward services
kubectl port-forward svc/digitlify-idp-service -n sso 8088:8080 &
kubectl port-forward svc/agent-registry -n cmp 8000:80 &

# Get a token using client_credentials grant
TOKEN=$(curl -s -X POST http://localhost:8088/realms/gsv/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=gsv-api" \
  -d "client_secret=YOUR_SECRET" | jq -r '.access_token')

# Test Agent Registry API
curl -s http://localhost:8000/api/v1/agents/ \
  -H "Authorization: Bearer $TOKEN"
```

### Troubleshooting

#### "Authentication failed" (HTTP 401)

**Check logs:**
```bash
kubectl logs -n cmp -l app.kubernetes.io/name=agent-registry --tail=50 | grep -i oidc
```

**Common causes:**

1. **JWKS fetch timeout:**
   ```
   Connection to sso.dev.gsv.dev timed out
   ```
   **Fix:** Set `OIDC_OP_JWKS_ENDPOINT` to use internal cluster URL

2. **Audience mismatch:**
   ```
   Token audience doesn't match client_id
   ```
   **Fix:** Add the client ID to `OIDC_VALID_AUDIENCES` (comma-separated)

3. **Issuer mismatch:**
   ```
   Invalid token issuer
   ```
   **Fix:** Ensure `OIDC_OP_ISSUER` matches the `iss` claim in the token

#### After ConfigMap Changes

Always restart the deployment to pick up new config:
```bash
kubectl rollout restart deployment/agent-registry -n cmp
kubectl rollout status deployment/agent-registry -n cmp
```

### Service Account vs User Tokens

Agent Registry supports both:

| Token Type | Grant | Has `email` | Username |
|------------|-------|-------------|----------|
| User | password/auth_code | Yes | preferred_username or email |
| Service Account | client_credentials | No | `service-account-{client_id}` |

The OIDC backend automatically detects service account tokens and creates appropriate user records.

---

*Last Updated: December 10, 2025*
