# Frictionless Buyer Journey

**Date:** December 13, 2024
**Status:** Planning
**Priority:** P0 - Critical for GTM

## Vision

Zero-friction customer acquisition. Users should go from discovery to using an AI agent in **under 5 minutes** with **minimal steps**.

## Current vs Target State

### Current Journey (Too Many Steps)
```
Register → Login → Create Organization (4 steps) → Create Project →
Set Payment Profile → Browse Marketplace → Select Plan → Create Order →
Configure Agent → Use Agent
```
**Problems:**
- 4-step organization wizard
- Project creation required (but unclear)
- Payment profile separate from checkout
- No guidance after org creation
- Configuration happens after purchase

### Target Journey (Frictionless)
```
Browse Marketplace → Select Agent → Choose Plan →
{Register OR Login OR Accept Invite} → Pay → Use Agent
```
**Goals:**
- Marketplace-first experience
- Single checkout flow
- Auto-provisioning of org/project
- Immediate access after payment

---

## Entry Points

### 1. Direct Registration
```
Landing Page → Sign Up → Auto-create Organization → Dashboard
```
- Keycloak SSO or local auth
- Organization auto-created with user's name
- Default project auto-created
- Redirect to marketplace or dashboard

### 2. Invitation
```
Email Invitation → Accept → {Register if new} → Join Organization → Dashboard
```
- Invited user joins existing org
- No org creation needed
- Inherits project access based on invitation scope

### 3. Marketplace Browse (Guest)
```
Browse Agents → View Details → Select Plan → {Register to Continue} → Checkout
```
- Anonymous browsing enabled (`ANONYMOUS_USER_CAN_VIEW_OFFERINGS: true`)
- Registration/login prompted at checkout
- Cart preserved through auth flow
- Auto-create org/project if needed

---

## Organizational Hierarchy

### Simplified Model
```
Organization (Company/Tenant)
  └── Project (Logical Container)
       └── Resources (Deployed Agents/MCPs)
```

### Auto-Provisioning Rules

| Scenario | Organization | Project | Action |
|----------|--------------|---------|--------|
| New user registers | Auto-create "{Name}'s Organization" | Auto-create "Default" | Redirect to marketplace |
| Invited to org | Use existing | Use invitation scope | Redirect to dashboard |
| First purchase | Use existing or auto-create | Auto-create "Default" if none | Deploy resource |

### Team/Permissions (Phase 2)
- Organization Owner: Full control
- Organization Manager: Manage projects, invite users
- Project Admin: Manage project resources
- Project Member: Use resources

**Note:** Team management is secondary to initial purchase flow. Users can invite team after first use.

---

## Payment Models

### 1. Credit/Wallet System
```
Add Credits → Browse → Purchase → Credits Deducted → Use
```
- Pre-paid credits
- Usage deducted from wallet
- Low balance alerts
- Auto-top-up option

**Use Cases:**
- Pay-as-you-go users
- Testing/experimentation
- Small businesses

### 2. Subscription Plans (Monthly/Yearly)
```
Select Plan → Checkout → Recurring Billing → Use within Limits
```
- Fixed monthly/yearly price
- Bundled usage limits
- Overage charges or throttling
- Annual discount (e.g., 2 months free)

**Tiers:**
| Plan | Price | Included | Overage |
|------|-------|----------|---------|
| Starter | $29/mo | 1,000 API calls | $0.01/call |
| Pro | $99/mo | 10,000 API calls | $0.008/call |
| Enterprise | Custom | Unlimited | Dedicated support |

### 3. Bundled Price Plans
```
Bundle = Multiple Agents/Features at Discount
```
- Agent bundles (e.g., "Customer Service Suite")
- Feature bundles (e.g., "Analytics + Chat + Voice")
- Partner bundles

### 4. Usage-Based (Pure Pay-per-Use)
```
Use → Meter Usage → Invoice at End of Period
```
- Post-paid billing
- Requires payment profile on file
- Usage tracking per resource
- Monthly invoice

---

## Checkout Flow

### Single-Page Checkout
```
┌─────────────────────────────────────────────────────────────┐
│ Checkout: AI Customer Support Agent                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────┐  ┌─────────────────────────────────────┐│
│ │ Selected Plan   │  │ Your Information                   ││
│ │                 │  │                                     ││
│ │ ○ Starter $29/mo│  │ Organization: [Auto: John's Org]   ││
│ │ ● Pro $99/mo    │  │ Project: [Auto: Default]           ││
│ │ ○ Enterprise    │  │                                     ││
│ │                 │  │ ─────────────────────────────────── ││
│ │ Billing Cycle:  │  │                                     ││
│ │ ○ Monthly       │  │ Payment Method                      ││
│ │ ● Yearly (-17%) │  │ [Card] [PayPal] [Invoice]          ││
│ │                 │  │                                     ││
│ │                 │  │ Card: **** **** **** 4242          ││
│ │                 │  │ [+ Add New Card]                    ││
│ └─────────────────┘  │                                     ││
│                      │ ─────────────────────────────────── ││
│ Order Summary        │                                     ││
│ ─────────────────    │ [x] I agree to Terms of Service    ││
│ Pro Plan (Yearly)    │                                     ││
│ $99 × 12 = $1,188    │ ┌─────────────────────────────────┐ ││
│ Discount: -$198      │ │     Complete Purchase - $990    │ ││
│ ─────────────────    │ └─────────────────────────────────┘ ││
│ Total: $990/year     │                                     ││
│                      └─────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Post-Purchase Flow
```
Purchase Complete → Agent Deployed → Configuration Wizard → First Chat
```

1. **Immediate Confirmation**
   - Order confirmation screen
   - Email receipt
   - Access to agent dashboard

2. **Quick Configuration** (Optional)
   - Persona name
   - Welcome message
   - Basic settings
   - Skip option available

3. **First Use**
   - Test chat interface
   - Widget preview
   - API key generation

---

## Implementation Phases

### Phase 0: Quick Wins (Already Done)
- [x] Organization auto-approval enabled
- [x] Simple organization form for auto-approve mode
- [x] Anonymous marketplace browsing

### Phase 1: Auto-Provisioning (Next)
1. **Auto-create default project on org creation**
   - File: `cmp-backend/src/waldur_core/structure/handlers.py`
   - Trigger: `customer_creation_succeeded` signal
   - Create project named "Default" or "{Org Name} - Default"

2. **Streamline checkout to include org/project creation**
   - File: `cmp-frontend/src/marketplace/deploy/DeployPage.tsx`
   - If no org: prompt to create inline
   - If no project: auto-create

3. **Post-org-creation redirect to marketplace**
   - File: `cmp-frontend/src/user/organization-create/SimpleOrganizationForm.tsx`
   - After success: redirect to `/marketplace/` not dashboard

### Phase 2: Payment Integration
1. **Add payment step to checkout**
   - Integrate Stripe/PayPal
   - Store payment methods per organization
   - Support card, bank, invoice

2. **Implement credit/wallet system**
   - Credit purchase flow
   - Balance display in header
   - Usage deduction logic

3. **Subscription management**
   - Plan upgrade/downgrade
   - Billing cycle management
   - Invoice generation

### Phase 3: Post-Purchase Experience
1. **Agent configuration wizard**
   - Embedded in resource detail page
   - Guided setup steps
   - Skip option

2. **Quick start guide**
   - Widget embed instructions
   - API documentation link
   - Sample code

3. **Usage dashboard**
   - API calls graph
   - Cost tracking
   - Alerts setup

---

## API Changes Required

### Backend (cmp-backend)

```python
# New endpoint: Auto-create organization + project + order
POST /api/marketplace/quick-checkout/
{
    "offering_uuid": "...",
    "plan_uuid": "...",
    "payment_method": "card",
    "payment_token": "tok_...",  # From Stripe
    "organization_name": "...",  # Optional, auto-generate if missing
}

Response:
{
    "order_uuid": "...",
    "resource_uuid": "...",
    "organization_uuid": "...",
    "project_uuid": "...",
    "access_url": "/resource-details/..."
}
```

### Signal Handlers

```python
# Auto-create default project on organization creation
@receiver(post_save, sender=Customer)
def create_default_project(sender, instance, created, **kwargs):
    if created:
        Project.objects.create(
            customer=instance,
            name="Default",
            description="Auto-created default project",
        )
```

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Time to first purchase | ~15 min | < 5 min | Analytics |
| Checkout abandonment | Unknown | < 20% | Funnel tracking |
| Post-purchase activation | Unknown | > 80% within 24h | Usage logs |
| Support tickets (onboarding) | Unknown | < 5% of signups | Helpdesk |

---

## Competitive Analysis

| Platform | Sign-up to Use | Payment Model |
|----------|----------------|---------------|
| OpenAI API | ~2 min | Credit prepay |
| Anthropic API | ~3 min | Credit prepay |
| AWS Bedrock | ~10 min | Usage-based |
| **Our Target** | **< 5 min** | **Hybrid** |

---

## Dependencies

| Dependency | Owner | Status |
|------------|-------|--------|
| Organization auto-approval | Backend | Done |
| Simple org form | Frontend | Done |
| Default project auto-creation | Backend | TODO |
| Payment gateway integration | Backend | TODO |
| Credit system | Backend | TODO |
| Subscription billing | Backend | TODO |
| Checkout flow redesign | Frontend | TODO |
| Post-purchase wizard | Frontend | TODO |

---

## Next Steps

1. **Implement default project auto-creation** (backend)
2. **Update post-org-creation redirect** (frontend)
3. **Design integrated checkout component** (frontend)
4. **Evaluate payment gateway options** (Stripe vs alternatives)
5. **Define subscription tiers and pricing** (business)
