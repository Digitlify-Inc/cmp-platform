# CMP Platform - GTM Journeys Documentation

**Last Updated:** 2024-12-16
**Status:** GTM Readiness 95%

---

## 1. User Registration & Organizations

### 1.1 Email Verification
**Current Status: NOT ENABLED**

- Users via Keycloak OAuth bypass email verification
- Optional: `OIDC_BLOCK_CREATION_OF_UNINVITED_USERS` blocks uninvited users
- **Recommendation:** Enable via Keycloak realm settings

### 1.2 Organization Creation

| Method | Endpoint | Who Can Use |
|--------|----------|-------------|
| Standard | `POST /api/customers/` | Staff only |
| Self-Register | `POST /api/customers/self_register/` | Any (if `ONBOARDING_UNIVERSAL_AUTO_APPROVE=True`) |

### 1.3 Default Project
**Setting:** `CREATE_DEFAULT_PROJECT_ON_ORGANIZATION_CREATION=False` (disabled by default)

### 1.4 Multiple Organizations
**Fully supported** - no restrictions

---

## 2. Service Provider Approval

### 2.1 Becoming a Provider
1. User needs `REGISTER_SERVICE_PROVIDER` permission
2. Organization Settings → Marketplace → Register as Provider
3. System creates `ServiceProvider` linked to Customer

### 2.2 Operator Approval
**GTM Status: ON HOLD**

Order states: `PENDING_CONSUMER → PENDING_PROVIDER → EXECUTING → DONE`

---

## 3. Seller Journey

### Flow: Studio → CMP Import → Runtime → Marketplace

### Steps:
1. **Studio**: Create flow in Langflow, export JSON
2. **CMP Import**: `POST /api/provider-agents/{uuid}/import_flow/`
3. **Configure**: Add pricing plans (FIXED, USAGE, ONE_TIME)
4. **Runtime**: Auto-deployed to Langflow runtime
5. **Publish**: Offering state DRAFT → ACTIVE

### Pricing Types:
- `FIXED`: Monthly recurring
- `USAGE`: Pay-per-use
- `ONE_TIME`: Setup fee
- `LIMIT`: Capped usage tier

---

## 4. Buyer Journey

### Flow: Browse → Purchase → Configure → Get Keys → Use

### Steps:
1. **Browse**: `GET /api/marketplace-public-offerings/`
2. **Purchase**: `POST /api/marketplace-orders/`
3. **Configure**: `PATCH /api/customer-agent-configs/{uuid}/`
   - Persona: agent_name, greeting, system_prompt, tone
   - Branding: colors, avatar
   - Widget: position, theme, allowed_domains
4. **API Keys**: `POST /api/customer-agent-configs/{uuid}/api_keys/`
   - Format: `ar_sk_live_{random_24_chars}`
5. **Use Widget**:
```html
<script src="https://widget.digitlify.com/loader.js"></script>
<script>WaldurWidget.init({widget_id, api_key, theme, position});</script>
```
6. **API Call**: `POST /api/agent-gateway/invoke/`

---

## 5. Key Settings

| Setting | Default | Purpose |
|---------|---------|---------|
| `ONBOARDING_UNIVERSAL_AUTO_APPROVE` | False | Enable self-registration |
| `CREATE_DEFAULT_PROJECT_ON_ORGANIZATION_CREATION` | False | Auto-create first project |

---

## 6. Key Files

### Backend
- `marketplace/models.py` - Offering, Plan, Order
- `marketplace_site_agent/models.py` - AgentIdentity, CustomerAgentConfig
- `marketplace_site_agent/services/runtime.py` - Langflow deployment
- `marketplace_site_agent/gateway/views.py` - Agent invocation

### Frontend
- `marketplace/service-providers/agents/` - Seller UI
- `customer/agents/` - Buyer UI

---

*Generated: 2024-12-16*
