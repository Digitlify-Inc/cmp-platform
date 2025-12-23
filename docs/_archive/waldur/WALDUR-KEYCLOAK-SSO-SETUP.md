# Waldur-Keycloak SSO Integration Guide

**Date:** December 11, 2024
**Status:** Configuration Guide
**Priority:** P0 for GTM

---

## Overview

This guide covers configuring Waldur CMP to authenticate users via Keycloak SSO, enabling single sign-on across all platform components:
- Waldur CMP (cmp-frontend/cmp-backend)
- Agent Config Portal (cmp-portal)
- Agent Registry (gsv-agentregistry)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SSO ARCHITECTURE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   Waldur    │    │ cmp-portal  │    │   Agent     │    │   Studio    │   │
│  │     CMP     │    │             │    │  Registry   │    │             │   │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘   │
│         │                  │                  │                  │          │
│         │    OIDC/SAML2    │      OIDC        │      OIDC        │   OIDC   │
│         │                  │                  │                  │          │
│         └────────────┬─────┴─────────┬────────┴─────────┬────────┘          │
│                      │               │                  │                    │
│                      ▼               ▼                  ▼                    │
│              ┌───────────────────────────────────────────────┐              │
│              │              Keycloak SSO                     │              │
│              │         sso.{domain}/realms/{realm}           │              │
│              │                                               │              │
│              │  - User Management                            │              │
│              │  - Role Management (customer, provider, admin)│              │
│              │  - Session Management                         │              │
│              │  - Token Issuance                             │              │
│              └───────────────────────────────────────────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

1. Keycloak server running and accessible
2. Admin access to Keycloak
3. Admin access to Waldur
4. DNS configured for all services

---

## Step 1: Keycloak Configuration

### 1.1 Create Realm (if not exists)

```bash
# Environment-specific realms
# Dev: gsv
# QA/Prod: digitlify
```

1. Login to Keycloak Admin Console
2. Create Realm: `gsv` (dev) or `digitlify` (qa/prod)
3. Configure realm settings:
   - Login tab: Enable "User registration" if needed
   - Tokens tab: Set access token lifespan (e.g., 5 minutes)
   - Sessions tab: Configure SSO session idle/max

### 1.2 Create Waldur Client

1. Go to Clients → Create Client
2. Configure:

```yaml
Client ID: waldur
Client Protocol: openid-connect
Root URL: https://cmp.{domain}
Valid Redirect URIs:
  - https://cmp.{domain}/*
  - https://cmp.{domain}/api/auth-social/complete/keycloak/
Web Origins: https://cmp.{domain}
```

3. Capability config:
   - Client authentication: ON (confidential client)
   - Authorization: OFF
   - Standard flow: ON
   - Direct access grants: OFF

4. Save and copy the Client Secret from Credentials tab

### 1.3 Create Client Scopes (Optional)

For custom claims mapping:

```yaml
Scope Name: waldur
Protocol: openid-connect
Include in token scope: ON

Mappers:
  - Name: organization
    Mapper Type: User Attribute
    User Attribute: organization
    Token Claim Name: organization
    Claim JSON Type: String
```

### 1.4 Create Roles

```yaml
Realm Roles:
  - customer    # For marketplace customers
  - provider    # For agent providers (sellers)
  - admin       # For platform administrators
```

### 1.5 Create Test Users

```yaml
User 1 (Customer):
  Username: test-customer
  Email: customer@test.local
  Roles: customer

User 2 (Provider):
  Username: test-provider
  Email: provider@test.local
  Roles: provider

User 3 (Admin):
  Username: test-admin
  Email: admin@test.local
  Roles: admin
```

---

## Step 2: Waldur Backend Configuration

Waldur supports two authentication methods with Keycloak:
- **OIDC** (recommended) - via `waldur_auth_social`
- **SAML2** - via `waldur_auth_saml2`

### 2.1 OIDC Configuration (Recommended)

#### Option A: Via Django Admin

1. Go to Waldur Admin → Identity Providers
2. Create new Identity Provider:

```yaml
Provider: keycloak
Label: "Sign in with Keycloak"
Client ID: waldur
Client Secret: <from-keycloak>
Discovery URL: https://sso.{domain}/realms/{realm}/.well-known/openid-configuration
Management URL: (leave empty)
Protected Fields:
  - email
  - first_name
  - last_name
User Field: username
User Claim: preferred_username
Attribute Mapping:
  email: email
  first_name: given_name
  last_name: family_name
Enable PKCE: false
Verify SSL: true
Enable Post Logout Redirect: true
```

#### Option B: Via Import Command

Create file `keycloak-oidc.yaml`:

```yaml
provider: keycloak
label: "Sign in with Keycloak"
client_id: waldur
client_secret: "${KEYCLOAK_CLIENT_SECRET}"
discovery_url: "https://sso.${DOMAIN}/realms/${REALM}/.well-known/openid-configuration"
protected_fields:
  - email
  - first_name
  - last_name
user_field: username
user_claim: preferred_username
attribute_mapping:
  email: email
  first_name: given_name
  last_name: family_name
enable_pkce: false
verify_ssl: true
enable_post_logout_redirect: true
```

Import:
```bash
python manage.py import_auth_social keycloak-oidc.yaml
```

### 2.2 SAML2 Configuration (Alternative)

Create `/etc/waldur/saml2.conf.py`:

```python
WALDUR_AUTH_SAML2 = {
    'name': 'saml2',
    'xmlsec_binary': '/usr/bin/xmlsec1',
    'base_url': 'https://cmp.{domain}',
    'debug': False,
    'cert_file': '/etc/waldur/saml2/sp.crt',
    'key_file': '/etc/waldur/saml2/sp.pem',
    'saml_attribute_mapping': {
        'uid': ['username'],
        'email': ['email'],
        'firstName': ['first_name'],
        'lastName': ['last_name'],
    },
    'idp_metadata_remote': [
        {
            'url': 'https://sso.{domain}/realms/{realm}/protocol/saml/descriptor',
            'timeout': 10,
        }
    ],
    'logout_requests_signed': 'true',
    'authn_requests_signed': 'true',
}
```

Generate SP certificate:
```bash
mkdir -p /etc/waldur/saml2
openssl req -new -x509 -days 3652 -nodes \
  -out /etc/waldur/saml2/sp.crt \
  -keyout /etc/waldur/saml2/sp.pem \
  -subj "/CN=cmp.{domain}"
```

---

## Step 3: Waldur Frontend Configuration

### 3.1 Enable SSO in UI

Update Waldur frontend configuration (typically via Helm values or ConfigMap):

```yaml
# In waldur-homeport config
features:
  loginMethods:
    - keycloak
  keycloakLabel: "Sign in with SSO"
```

### 3.2 Hide Local Login (Optional)

To force SSO-only authentication:

```yaml
features:
  hideLocalLogin: true
  loginMethods:
    - keycloak
```

---

## Step 4: Environment Variables

### Waldur Backend

```bash
# OIDC Configuration (if using environment variables)
WALDUR_AUTH_SOCIAL__KEYCLOAK__ENABLED=true
WALDUR_AUTH_SOCIAL__KEYCLOAK__CLIENT_ID=waldur
WALDUR_AUTH_SOCIAL__KEYCLOAK__CLIENT_SECRET=<secret>
WALDUR_AUTH_SOCIAL__KEYCLOAK__DISCOVERY_URL=https://sso.{domain}/realms/{realm}/.well-known/openid-configuration
```

### Kubernetes Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: waldur-keycloak-secret
  namespace: cmp
type: Opaque
stringData:
  client-secret: "<keycloak-client-secret>"
```

---

## Step 5: Testing

### 5.1 Verify Discovery URL

```bash
curl -s https://sso.{domain}/realms/{realm}/.well-known/openid-configuration | jq .
```

Expected response should include:
- `authorization_endpoint`
- `token_endpoint`
- `userinfo_endpoint`
- `end_session_endpoint`

### 5.2 Test Login Flow

1. Open Waldur CMP: `https://cmp.{domain}`
2. Click "Sign in with Keycloak"
3. Should redirect to: `https://sso.{domain}/realms/{realm}/protocol/openid-connect/auth?...`
4. Login with test credentials
5. Should redirect back to Waldur with authenticated session

### 5.3 Verify User Creation

After first login:
```bash
# In Waldur Admin, check user was created
python manage.py shell
>>> from waldur_core.core.models import User
>>> User.objects.filter(username='test-customer').exists()
True
```

### 5.4 Test Logout

1. Click logout in Waldur
2. Should redirect to Keycloak logout
3. Should end session in Keycloak
4. Verify session is cleared across all apps

---

## Step 6: Cross-Application SSO

### 6.1 Same Keycloak Client for All Apps

For seamless SSO, all applications can use the same Keycloak session:

| Application | Client ID | Notes |
|-------------|-----------|-------|
| Waldur CMP | waldur | Confidential client |
| cmp-portal | cmp-portal | Confidential client |
| Agent Registry | agent-registry | Confidential or public |

### 6.2 Token Sharing (Advanced)

For API calls between services using user context:

1. Portal gets token from Keycloak
2. Portal calls Agent Registry with `Authorization: Bearer <token>`
3. Agent Registry validates token against Keycloak

---

## Troubleshooting

### Issue: "Invalid redirect_uri"

**Cause:** Redirect URI not registered in Keycloak
**Fix:** Add the full callback URL to Valid Redirect URIs:
```
https://cmp.{domain}/api/auth-social/complete/keycloak/
```

### Issue: "Invalid token signature"

**Cause:** Client secret mismatch or wrong discovery URL
**Fix:** Verify client secret and discovery URL are correct

### Issue: User attributes not mapped

**Cause:** Keycloak not sending claims
**Fix:**
1. Check client scopes include required claims
2. Verify attribute mapping in IdP configuration

### Issue: Logout doesn't work

**Cause:** Post-logout redirect not configured
**Fix:**
1. Enable `enable_post_logout_redirect: true`
2. Add post-logout redirect URI in Keycloak client

### Issue: CORS errors

**Cause:** Web Origins not configured
**Fix:** Add Waldur domain to Web Origins in Keycloak client

---

## Security Considerations

1. **Always use HTTPS** - Never expose Keycloak or callbacks over HTTP
2. **Use confidential clients** - For server-side applications
3. **Rotate secrets regularly** - Update client secrets periodically
4. **Enable PKCE** - For public clients (SPAs)
5. **Validate SSL certificates** - Set `verify_ssl: true`
6. **Limit token lifetime** - Use short access tokens, longer refresh tokens
7. **Audit login events** - Enable event logging in Keycloak

---

## Environment-Specific Configuration

| Environment | Keycloak URL | Realm | Waldur Domain |
|-------------|--------------|-------|---------------|
| Dev | `https://sso.dev.gsv.dev` | `gsv` | `app.dev.gsv.dev` |
| QA | `https://sso.qa.digitlify.com` | `digitlify` | `app.qa.digitlify.com` |
| Production | `https://sso.digitlify.com` | `digitlify` | `app.digitlify.com` |

---

## Related Documentation

- [Environment Variables](./ENVIRONMENT-VARIABLES.md)
- [Waldur Webhook Setup](./WALDUR-WEBHOOK-SETUP.md)
- [GTM Analysis](../GTM-COMPREHENSIVE-ANALYSIS-2024-12-11.md)
- [Waldur Auth Social Documentation](https://docs.waldur.com/admin-guide/identities/keycloak/)
