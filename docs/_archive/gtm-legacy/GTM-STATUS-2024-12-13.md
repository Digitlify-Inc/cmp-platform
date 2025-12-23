# GTM Status Report - December 13, 2024

**Status:** Active Development
**Platform Readiness:** ~80%

---

## Executive Summary

The GSV Platform has made significant progress toward go-to-market (GTM) readiness. The core Waldur CMP is operational with SSO integration, organization self-registration, and webhook-based integration with Agent Registry.

**Key Achievement:** The Site Agent architecture already exists in Waldur marketplace_site_agent module, providing a clear path to deprecate the standalone Agent Registry.

---

## Completed Tasks (This Session)

### 1. Portal SSO Configuration ✅
- Keycloak OIDC provider properly configured with client ID cmp-portal
- Discovery URL: https://sso.dev.gsv.dev/realms/gsv/.well-known/openid-configuration
- Login flow tested and working via /api-auth/keycloak/init/
- Identity provider configured in Waldur database

### 2. Waldur Webhooks for Agent Registry ✅
- Three webhooks already configured:
  - **Order webhook**: marketplace order lifecycle events
  - **Customer webhook**: organization lifecycle events
  - **Project webhook**: project lifecycle events
- All pointing to Agent Registry internal service
- Security via cluster-internal networking

### 3. Project Admin Role on Default Project ✅
- **Commit:** aed33b3 on cmp-backend
- Users now get ProjectRole.ADMIN on default project
- Applied to both self_register and staff perform_create endpoints

### 4. Frontend User Permissions Refresh ✅
- SimpleOrganizationForm.tsx calls UsersService.refreshCurrentUser() after org creation
- Fixes "No association" banner issue

---

## Site Agent Architecture Analysis

### Current Implementation

The Waldur backend already includes a comprehensive marketplace_site_agent module:

**Location:** cmp-backend/src/waldur_mastermind/marketplace_site_agent/

**Models:**
- AgentIdentity - Identity for each running agent instance
- AgentService - Services within an agent (event processing, usage reporting)
- AgentProcessor - Processors within services (order processing, membership sync)

**Features:**
- Event subscription management via RabbitMQ
- Service registration and heartbeat tracking
- Processor lifecycle management
- Integration with Waldur marketplace offerings

**Frontend:**
- cmp-frontend/src/site-agent/ - Marketplace plugin components
- SiteAgentOffering - Offering configuration
- SiteAgentOrderForm - Order form component
- SiteAgentCredentialsForm - Credentials display

### Deprecation Path

The existing Site Agent architecture can replace the standalone Agent Registry:

| Agent Registry Feature | Site Agent Equivalent | Status |
|----------------------|----------------------|--------|
| Agent model | AgentIdentity | ✅ Exists |
| Service registration | AgentService model | ✅ Exists |
| Event subscriptions | register_event_subscription action | ✅ Exists |
| RabbitMQ integration | Built-in via logging backend | ✅ Exists |
| Marketplace integration | SITE_AGENT_OFFERING type | ✅ Exists |
| MCP protocol | Needs integration | 🔶 Planned |
| API key management | Needs extension | 🔶 Planned |
| Widget SDK | Move to frontend | 🔶 Planned |

---

## Remaining Gaps

### Critical (GTM Blockers)

1. **New Backend Image Build**
   - Project Admin fix needs deployment
   - Trigger CI/CD for cmp-backend:main (commit aed33b3)
   
2. **E2E Testing Validation**
   - Full user flow: Register -> Create Org -> Default Project with Admin role
   - Order flow: Browse -> Order Agent -> Webhook -> Access Provisioned

### High Priority

3. **Marketplace Offerings Setup**
   - Create initial agent offerings in Waldur
   - Configure offering plans and pricing
   - Link to Site Agent plugin

4. **Site Agent MCP Integration**
   - Extend marketplace_site_agent with MCP protocol support
   - Enable agent runtime communication

### Medium Priority

5. **Google OAuth in Keycloak**
   - Replace placeholder credentials with real Google OAuth
   - Update Vault secrets

6. **Widget SDK Migration**
   - Move widget components from cmp-portal to cmp-frontend
   - Integrate with Site Agent context

### Lower Priority

7. **LangFlow Studio Integration**
   - OAuth2 proxy configuration
   - Waldur project linking

8. **Stripe Billing**
   - Configure Stripe API keys
   - Enable checkout flows

---

## Recommendation: Deprecate Standalone Agent Registry

Based on the analysis, the standalone cmp-agentregistry / gsv-agentregistry should be deprecated in favor of extending the existing marketplace_site_agent module:

### Rationale
1. **Reduces Complexity**: One less service to deploy and maintain
2. **Unified Auth**: No separate token management
3. **Native Marketplace Integration**: Already integrated with Waldur offerings
4. **Event Infrastructure**: RabbitMQ integration built-in
5. **Permission System**: Uses Waldur RBAC

### Migration Steps
1. Extend marketplace_site_agent models for:
   - MCP protocol endpoints
   - API key management (per-project)
   - Usage metering
   
2. Move frontend components from cmp-portal to cmp-frontend Site Kit

3. Migrate webhooks from Agent Registry to direct Waldur event handling

4. Update runtime to use Site Agent endpoints

---

## Next Actions

1. **Immediate**: Deploy new backend image with Project Admin fix
2. **This Week**: Run E2E validation of full user journey
3. **Next Sprint**: Extend Site Agent for MCP and API key management
4. **Q1 2025**: Complete deprecation of standalone Agent Registry

---

*Document maintained by GSV Platform Team*
*Last updated: December 13, 2024*
