# QA Promotion Checklist

## Date: 2025-12-21
## Environment: dev.gsv.dev -> qa.digitlify.com

---

## Pre-Promotion Checklist

### 1. Security & RBAC ✅

| Component | Configuration | Status |
|-----------|--------------|--------|
| Runtime OAuth2-Proxy | ALLOWED_GROUPS=/gsv-team | ✅ Deployed |
| Studio OAuth2-Proxy | ALLOWED_GROUPS=/gsv-team,/sellers | ✅ Deployed |
| Network Policy | Runtime isolated to OAuth2-proxy + Runner | ✅ Applied |
| Internal Service | runtime-internal for Runner API access | ✅ Created |
| Keycloak Groups | gsv-team, sellers, buyers | ✅ Created |
| Test Users | operator, seller, buyer | ✅ Created |
| Groups Mapper | OIDC groups claim configured | ✅ Configured |

### 2. Session Management ✅

| Setting | Value | Purpose |
|---------|-------|---------|
| Cookie Expire | 168h (7 days) | Long session lifetime |
| Cookie Refresh | 1h | Automatic refresh before expiry |
| LANGFLOW_AUTO_LOGIN | true | Trust OAuth2-proxy auth |

### 3. E2E Test Results

| Test Suite | Passed | Failed | Skipped |
|------------|--------|--------|---------|
| Buyer Journey | 20 | 0 | 1 |
| Seller Journey | 3 | 0 | 0 |
| API Integration | 6 | 3 | 0 |

**Notes:**
- API Integration failures are data-related (channel not configured)
- All security-critical tests pass

### 4. Platform Services Status

| Service | Namespace | Pods | Status |
|---------|-----------|------|--------|
| Runtime | runtime | 2/2 | Running |
| Studio | studio | 2/2 | Running |
| Marketplace | cmp | 1/1 | Running |
| Control Plane | cmp | 1/1 | Running |
| Saleor API | cmp | 1/1 | Running |
| SSO (Keycloak) | sso | 2/2 | Running |

### 5. GitOps Changes Committed

**gsv-gitops (73faf61):**
- realm-gsv.yaml: RBAC roles and groups
- runtime/oauth2-proxy-deployment.yaml: Operator-only access
- studio/oauth2-proxy-deployment.yaml: Operator + Seller access
- runtime/network-policy.yaml: Pod isolation
- runtime/service-internal.yaml: Internal API service
- scripts/seed-vault-langflow.sh: Vault seeding script

**gsv-platform (00ebd22):**
- docs/LANGFLOW-TENANT-ISOLATION-ARCHITECTURE.md
- docs/LANGFLOW-STABILIZATION-DEPLOYMENT.md
- e2e/tenant-isolation.spec.ts
- e2e/full-e2e-flow.spec.ts
- e2e/api-integration.spec.ts (URL fixes)

---

## RBAC Access Matrix

| User Type | Studio | Runtime | Marketplace | Control Plane |
|-----------|--------|---------|-------------|---------------|
| Operator (gsv-team) | ✅ Full | ✅ Full | ✅ | ✅ |
| Seller (sellers) | ✅ Full | ❌ 403 | ✅ | ✅ |
| Buyer (buyers) | ❌ 403 | ❌ 403 | ✅ | ✅ |
| Anonymous | ❌ Redirect | ❌ Redirect | ✅ Browse | ❌ |

---

## Manual Verification Steps (Pre-QA)

1. **Operator Access Test**
   - [ ] Login as operator@gsv.dev
   - [ ] Access Studio (https://studio.dev.gsv.dev) - should work
   - [ ] Access Runtime (https://runtime.dev.gsv.dev) - should work
   - [ ] Create a flow in Studio
   - [ ] Deploy flow to Runtime

2. **Seller Access Test**
   - [ ] Login as seller@test.gsv.dev
   - [ ] Access Studio (https://studio.dev.gsv.dev) - should work
   - [ ] Access Runtime (https://runtime.dev.gsv.dev) - should see 403
   - [ ] Create a flow in Studio
   - [ ] Verify cannot access Runtime API

3. **Buyer Access Test**
   - [ ] Login as buyer@test.gsv.dev
   - [ ] Access Studio (https://studio.dev.gsv.dev) - should see 403
   - [ ] Access Runtime (https://runtime.dev.gsv.dev) - should see 403
   - [ ] Browse Marketplace without login
   - [ ] Add product to cart
   - [ ] Complete checkout flow

4. **SSO Session Test**
   - [ ] Login to one service
   - [ ] Navigate to another service
   - [ ] Verify no re-login required
   - [ ] Refresh page after 30 minutes
   - [ ] Verify still logged in

---

## QA Environment Configuration

For QA promotion, update the following in digitlify-gitops:

1. **OAuth2-Proxy clients**: Point to qa.digitlify.com domain
2. **Keycloak realm**: Import gsv realm to Digitlify Keycloak
3. **Network Policies**: Apply same isolation rules
4. **Vault secrets**: Seed with QA-specific values

---

## Known Issues

1. **API Integration Test - Channel Query**: The default-channel may not exist in Saleor. Need to seed channel data.

2. **Password Grant**: Direct password grant fails in tests. OAuth2 authorization code flow works correctly via browser.

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Platform Lead | | | |
| Security | | | |
| QA Lead | | | |
