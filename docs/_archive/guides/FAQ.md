# GSV Platform - Frequently Asked Questions

**Last Updated:** December 2024

---

## Table of Contents

1. [General Questions](#1-general-questions)
2. [Provider Questions](#2-provider-questions)
3. [Customer Questions](#3-customer-questions)
4. [Technical Questions](#4-technical-questions)
5. [Billing Questions](#5-billing-questions)
6. [Security Questions](#6-security-questions)
7. [Deployment Questions](#7-deployment-questions)

---

## 1. General Questions

### Q: What is the GSV Platform?

The GSV Platform is a multi-tenant AI agent marketplace that enables:
- **Providers** to design, deploy, and monetize AI agents
- **Customers** to subscribe, customize, and integrate AI agents
- **Operators** to manage platform infrastructure

### Q: What are the main components?

| Component | Purpose |
|-----------|---------|
| Agent Studio | Visual flow builder for designing agents |
| Agent Registry | Central orchestration and MCP hub |
| Agent Runtime | Execution environment for agents |
| Portal | Customer/Provider dashboard |
| CMP (Waldur) | Marketplace and billing |
| SSO (Keycloak) | Identity and access management |

### Q: What AI models are supported?

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google (Gemini)
- Local models via Ollama
- Custom model integrations

### Q: Is the platform multi-tenant?

Yes. The platform supports:
- Organizations (tenants)
- Projects within organizations
- Teams with RBAC
- Individual user accounts

---

## 2. Provider Questions

### Q: How do I become a provider?

1. Register at https://portal.digitlify.com
2. Request provider access
3. Complete provider verification
4. Start designing agents in Studio

### Q: What can I build with Agent Studio?

You can build:
- FAQ and support bots
- Sales assistants
- Data analysis agents
- Custom workflow automations
- RAG-based knowledge agents

### Q: How does pricing work for providers?

- Set your own pricing tiers
- Revenue share: 70% provider / 30% platform
- Monthly payouts (30-day terms)
- Minimum payout: €100

### Q: How do I deploy my agent?

```bash
# 1. Design in Studio
# 2. Register via API
POST /api/v1/agents/

# 3. Deploy
POST /api/v1/agents/{id}/deploy/

# 4. Publish to marketplace
POST /api/v1/agents/{id}/publish/
```

### Q: Can I update my agent after publishing?

Yes, you can:
- Update description and metadata
- Change pricing (existing subscribers keep current rate)
- Push new versions (with controlled rollout)
- Update training documents

### Q: How do I handle customer support for my agent?

You're responsible for:
- Responding to customer questions
- Handling billing disputes
- Providing documentation
- Platform provides: Infrastructure, uptime, technical support

---

## 3. Customer Questions

### Q: How do I subscribe to an agent?

1. Browse the marketplace
2. Select a plan (Free, Starter, Pro, Enterprise)
3. Complete checkout
4. Receive your API key
5. Start integrating

### Q: How do I integrate an agent into my website?

**Web Widget (Easiest):**
```html
<script
  src="https://api.digitlify.com/widget/v1/gsv-widget.js"
  data-widget-id="wgt_your_widget_id"
  async>
</script>
```

**API Integration:**
```bash
curl -X POST https://api.digitlify.com/api/v1/chat/ \
  -H "Authorization: Bearer ar_sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

### Q: Can I customize the agent's responses?

Yes! You can:
- Set persona (name, greeting, tone)
- Upload training documents
- Configure brand colors
- Set custom system prompts (Enterprise)

### Q: What happens if I exceed my quota?

- API requests return 429 (Too Many Requests)
- You'll receive an email notification
- You can upgrade your plan immediately
- Usage resets on billing cycle

### Q: Can I export my conversation history?

Yes, via API:
```bash
GET /api/v1/access/{id}/conversations/?format=json
```

### Q: How do I cancel my subscription?

1. Go to Portal → My Agents → [Agent]
2. Click Subscription → Cancel
3. Access continues until end of billing period
4. Data retained for 30 days after cancellation

---

## 4. Technical Questions

### Q: What is the API rate limit?

| Plan | Rate Limit | Burst |
|------|------------|-------|
| Free | 1/second | 5 |
| Starter | 5/second | 20 |
| Professional | 20/second | 100 |
| Enterprise | 100/second | 500 |

### Q: What's the response latency?

Typical latency:
- Simple queries: 500ms - 1s
- RAG queries: 1s - 2s
- Complex reasoning: 2s - 5s

SLA (Enterprise): P99 < 5 seconds

### Q: How do I handle authentication?

All API requests require Bearer token:
```bash
Authorization: Bearer ar_sk_live_your_api_key
```

### Q: Is there a streaming API?

Yes:
```bash
POST /api/v1/chat/stream/
# Returns Server-Sent Events
```

### Q: What SDKs are available?

- JavaScript/TypeScript: `@gsv/client`
- Python: `gsv-client`
- Go: `github.com/gsv/go-client`
- REST API for other languages

### Q: How do I debug integration issues?

1. Check API key format: `ar_sk_live_xxx`
2. Verify domain is whitelisted (for widgets)
3. Check browser console for errors
4. Use request ID for support tickets
5. Enable debug mode: `?debug=true`

### Q: What webhook events are available?

| Event | Trigger |
|-------|---------|
| `subscription.created` | New subscription |
| `subscription.cancelled` | Cancellation |
| `usage.limit.warning` | 80% quota used |
| `usage.limit.exceeded` | Quota exceeded |

---

## 5. Billing Questions

### Q: What payment methods are accepted?

- Credit/Debit cards (Visa, Mastercard)
- SEPA Direct Debit (EU)
- PayPal (coming soon)
- Bank transfer (Enterprise)

### Q: When am I billed?

- Monthly on subscription date
- Annual option available (2 months free)
- Overage billed at end of cycle

### Q: Can I get a refund?

- Full refund within 7 days of subscription
- Pro-rated refund if downgrading
- No refund for cancellation mid-cycle

### Q: How is usage calculated?

| Metric | Description |
|--------|-------------|
| API Calls | Each request to /chat endpoint |
| Tokens | Input + Output tokens used |
| Storage | Documents stored (GB) |

### Q: Do unused quotas roll over?

No, quotas reset each billing cycle.

### Q: How do I get an invoice?

Portal → Billing → Invoices → Download PDF

### Q: Is there an enterprise agreement?

Yes, for organizations needing:
- Custom SLAs
- Volume discounts
- Dedicated support
- Custom integrations

Contact: sales@digitlify.com

---

## 6. Security Questions

### Q: Is my data encrypted?

Yes:
- In transit: TLS 1.3
- At rest: AES-256
- Database: Encrypted at rest
- Backups: Encrypted

### Q: Where is data stored?

- Primary: EU (Germany)
- Backups: EU (Finland)
- CDN: Global edge

### Q: Is the platform GDPR compliant?

Yes:
- Data Processing Agreement available
- Right to erasure supported
- Data export available
- Privacy policy: https://digitlify.com/privacy

### Q: How long is conversation data retained?

| Plan | Retention |
|------|-----------|
| Free | 30 days |
| Starter | 90 days |
| Professional | 1 year |
| Enterprise | Custom |

### Q: Can I request data deletion?

Yes:
1. Portal → Settings → Privacy
2. Request Data Deletion
3. Processed within 30 days

### Q: How are API keys secured?

- Keys hashed in database (not stored in plain text)
- Can be rotated anytime
- Rate limited per key
- Audit log of all API calls

### Q: Is there SOC 2 compliance?

SOC 2 Type II certification in progress. Expected Q2 2025.

---

## 7. Deployment Questions

### Q: How do I deploy the platform locally?

```bash
# Prerequisites
make preflight

# Full deployment
make deploy-dev

# Access
https://argocd.dev.gsv.dev
https://portal.dev.gsv.dev
```

### Q: Does `make deploy-qa` and `make deploy-prod` work?

Currently:
- `make deploy-dev` - **Implemented** (Kind cluster)
- `make deploy-qa` - Planned (use GitOps promotion)
- `make deploy-prod` - Planned (use GitOps promotion)

For QA/Prod, use the promotion workflow:
```bash
make promote.qa      # dev → qa
make promote.prod    # qa → prod
```

### Q: Where are environment variables configured?

1. `.env` - Local secrets (gitignored)
2. `scripts/env.sh` - Domain configuration
3. `charts/*/values-*.yaml` - Helm values

### Q: How do I configure custom domains?

1. Edit `scripts/env.sh`:
   ```bash
   BASE_DOMAIN=mycompany.com
   ```
2. Update Helm values with new domains
3. Configure DNS records
4. Generate TLS certificates

### Q: What's the difference between Kind, Proxmox, and Hetzner?

| Provider | Use Case | Load Balancer | Storage |
|----------|----------|---------------|---------|
| Kind | Local dev | MetalLB | Local |
| Proxmox | On-premises | MetalLB | Longhorn |
| Hetzner | Cloud prod | Hetzner LB | Hetzner Volumes |

### Q: How do I set up local DNS for development?

**macOS:**
```bash
# Add to /etc/hosts
127.0.0.1 argocd.dev.gsv.dev
127.0.0.1 portal.dev.gsv.dev
```

**Ubuntu:**
```bash
make ubuntu.setup.dns
# Configures dnsmasq automatically
```

### Q: How do I check platform status?

```bash
# ArgoCD apps
make status

# Smoke tests
make smoke

# Pod status
kubectl get pods -A | grep -v Running
```

---

## Getting More Help

### Documentation
- Platform Docs: https://docs.digitlify.com
- API Reference: https://api.digitlify.com/docs
- GitHub: https://github.com/GSVDEV

### Support Channels
- Email: support@digitlify.com
- Community: https://community.digitlify.com
- Enterprise: enterprise@digitlify.com

### Report Issues
- Bug Reports: GitHub Issues
- Security: security@digitlify.com

---

*Document generated by GSV Platform Engineering Team*
