# Pricing & Bundling Model - AI Agent Marketplace

**Date:** December 16, 2025
**Status:** Design Specification
**Priority:** P1 - Required for GTM

---

## Executive Summary

The primary ordering model is **bundled subscription plans** with usage limits based on resource type. This provides predictable costs for buyers while enabling flexible monetization for providers.

---

## Primary Model: Bundled Subscription Plans

### Plan Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SUBSCRIPTION PLANS                                │
├──────────────┬──────────────┬──────────────┬──────────────────────────── │
│    FREE      │   STARTER    │     PRO      │      ENTERPRISE            │
│    $0/mo     │   $29/mo     │   $99/mo     │      Custom                │
├──────────────┼──────────────┼──────────────┼──────────────────────────── │
│ AGENTS       │              │              │                            │
│ 1 agent      │ 3 agents     │ 10 agents    │ Unlimited                  │
├──────────────┼──────────────┼──────────────┼──────────────────────────── │
│ API CALLS    │              │              │                            │
│ 100/month    │ 5,000/month  │ 50,000/month │ Custom                     │
├──────────────┼──────────────┼──────────────┼──────────────────────────── │
│ TOKENS       │              │              │                            │
│ 10K tokens   │ 100K tokens  │ 1M tokens    │ Custom                     │
├──────────────┼──────────────┼──────────────┼──────────────────────────── │
│ STORAGE      │              │              │                            │
│ 10 MB        │ 500 MB       │ 5 GB         │ Custom                     │
├──────────────┼──────────────┼──────────────┼──────────────────────────── │
│ SUPPORT      │              │              │                            │
│ Community    │ Email        │ Priority     │ Dedicated                  │
├──────────────┼──────────────┼──────────────┼──────────────────────────── │
│              │ [Get Started]│ [Get Started]│ [Contact Sales]            │
└──────────────┴──────────────┴──────────────┴────────────────────────────┘
```

---

## Usage Limits by Resource Type

### 1. Text/Chat Tokens
```
Measurement: Input tokens + Output tokens
Pricing tiers:
├── Free:     10,000 tokens/month
├── Starter:  100,000 tokens/month
├── Pro:      1,000,000 tokens/month
└── Overage:  $0.002 per 1K tokens
```

### 2. API Calls
```
Measurement: Number of API requests
Pricing tiers:
├── Free:     100 calls/month
├── Starter:  5,000 calls/month
├── Pro:      50,000 calls/month
└── Overage:  $0.001 per call
```

### 3. Image Generation
```
Measurement: By resolution
Pricing (credits per image):
├── 256x256:   1 credit
├── 512x512:   2 credits
├── 1024x1024: 4 credits
├── 2048x2048: 8 credits
└── 4K:        16 credits

Bundle allocation:
├── Free:     10 credits/month
├── Starter:  100 credits/month
├── Pro:      500 credits/month
└── Overage:  $0.02 per credit
```

### 4. Document Storage (RAG)
```
Measurement: Storage size
Pricing tiers:
├── Free:     10 MB
├── Starter:  500 MB
├── Pro:      5 GB
└── Overage:  $0.10 per GB/month
```

### 5. Knowledge Base Queries
```
Measurement: RAG retrieval calls
Pricing tiers:
├── Free:     50 queries/month
├── Starter:  1,000 queries/month
├── Pro:      10,000 queries/month
└── Overage:  $0.005 per query
```

### 6. Workflow Executions
```
Measurement: Workflow runs
Pricing tiers:
├── Free:     10 runs/month
├── Starter:  500 runs/month
├── Pro:      5,000 runs/month
└── Overage:  $0.01 per run
```

---

## App/Agent-Specific Pricing

Some agents may have additional pricing models:

### Per-Seat Pricing (Team Apps)
```
Example: Team Collaboration Agent
├── Base: $29/month (includes 5 seats)
├── Additional seats: $5/seat/month
└── Features:
    ├── Basic: All users
    ├── Advanced: Admin seats only
    └── Premium: Available as add-on
```

### Feature-Based Tiers
```
Example: Document Analysis Agent

Basic ($19/mo)
├── PDF analysis
├── Text extraction
└── Basic summarization

Professional ($49/mo)
├── Everything in Basic
├── Multi-document comparison
├── Advanced insights
└── API access

Enterprise ($149/mo)
├── Everything in Professional
├── Custom model fine-tuning
├── SSO integration
└── Audit logs
```

### Usage-Based (Metered)
```
Example: Translation Agent
├── Per character: $0.00001
├── Per word: $0.0001
├── Per page (estimated): $0.05
├── Minimum monthly: $10
└── Volume discounts at 100K+ chars
```

---

## Bundle Components Matrix

```
┌────────────────────┬────────┬─────────┬────────┬────────────┐
│ Component          │ FREE   │ STARTER │ PRO    │ ENTERPRISE │
├────────────────────┼────────┼─────────┼────────┼────────────┤
│ Active Agents      │ 1      │ 3       │ 10     │ Unlimited  │
│ API Calls/month    │ 100    │ 5,000   │ 50,000 │ Custom     │
│ Tokens/month       │ 10K    │ 100K    │ 1M     │ Custom     │
│ Storage            │ 10MB   │ 500MB   │ 5GB    │ Custom     │
│ Image Credits      │ 10     │ 100     │ 500    │ Custom     │
│ RAG Queries        │ 50     │ 1,000   │ 10,000 │ Custom     │
│ Workflow Runs      │ 10     │ 500     │ 5,000  │ Custom     │
│ Team Members       │ 1      │ 5       │ 25     │ Unlimited  │
│ Projects           │ 1      │ 3       │ 10     │ Unlimited  │
│ Data Retention     │ 7 days │ 30 days │ 90 days│ Custom     │
│ Support            │ Forum  │ Email   │ Priority│ Dedicated │
│ SLA                │ -      │ 99%     │ 99.9%  │ 99.99%    │
│ API Rate Limit     │ 10/min │ 100/min │ 1K/min │ Custom     │
│ Concurrent Sessions│ 1      │ 5       │ 25     │ Unlimited  │
│ Custom Branding    │ ✗      │ ✗       │ ✓      │ ✓          │
│ SSO/SAML           │ ✗      │ ✗       │ ✓      │ ✓          │
│ Audit Logs         │ ✗      │ ✗       │ ✓      │ ✓          │
│ Dedicated Support  │ ✗      │ ✗       │ ✗      │ ✓          │
└────────────────────┴────────┴─────────┴────────┴────────────┘
```

---

## Overage Handling Options

### Option 1: Hard Stop
```
When limit reached:
├── Block new requests
├── Show upgrade prompt
└── Send email notification
```

### Option 2: Soft Limit with Overage
```
When limit reached:
├── Continue service
├── Charge overage rates
├── Alert at 80%, 100%, 150%
└── Hard stop at 200%
```

### Option 3: Auto-Upgrade
```
When limit reached:
├── Auto-upgrade to next tier
├── Pro-rate for billing cycle
├── Notify user of upgrade
└── Option to downgrade next cycle
```

---

## UI: Pricing Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                           Choose Your Plan                              │
│                                                                         │
│        [Monthly ○]  [Annual ● Save 20%]                                │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │             │  │             │  │  POPULAR    │  │             │   │
│  │    FREE     │  │   STARTER   │  │     PRO     │  │ ENTERPRISE  │   │
│  │             │  │             │  │             │  │             │   │
│  │    $0       │  │    $29      │  │    $99      │  │   Custom    │   │
│  │   /month    │  │   /month    │  │   /month    │  │             │   │
│  │             │  │             │  │             │  │             │   │
│  │ • 1 agent   │  │ • 3 agents  │  │ • 10 agents │  │ • Unlimited │   │
│  │ • 100 calls │  │ • 5K calls  │  │ • 50K calls │  │ • Custom    │   │
│  │ • 10K tokens│  │ • 100K tok  │  │ • 1M tokens │  │ • Dedicated │   │
│  │ • 10MB stor │  │ • 500MB     │  │ • 5GB       │  │ • SLA 99.99%│   │
│  │             │  │             │  │             │  │             │   │
│  │ [Get Free]  │  │[Get Started]│  │[Get Started]│  │[Contact Us] │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                    Compare all features  [▼ Expand]                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## UI: Usage Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Usage Overview                                          [This Month ▼] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Current Plan: PRO ($99/month)                    [Manage Plan]        │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │    API Calls    │  │     Tokens      │  │    Storage      │        │
│  │   ████████░░    │  │   ██████░░░░    │  │   ███░░░░░░░    │        │
│  │  32,456/50,000  │  │  612K/1M        │  │   1.2GB/5GB     │        │
│  │      65%        │  │      61%        │  │      24%        │        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │  Image Credits  │  │   RAG Queries   │  │ Workflow Runs   │        │
│  │   ████░░░░░░    │  │   █████████░    │  │   ██░░░░░░░░    │        │
│  │    245/500      │  │   8,932/10,000  │  │    892/5,000    │        │
│  │      49%        │  │      89%        │  │      18%        │        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│                                                                         │
│  ⚠️ RAG Queries at 89% - Consider upgrading to avoid interruption      │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Usage by Agent                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Customer Support    ████████████████████░░░░░  65%  16,234 calls │  │
│  │ Knowledge Base      ████████████░░░░░░░░░░░░░  48%   2,456 calls │  │
│  │ Email Automation    ███████░░░░░░░░░░░░░░░░░░  28%     892 calls │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Subscription/Plan
```python
class Plan:
    id: UUID
    name: str  # "Free", "Starter", "Pro", "Enterprise"
    price_monthly: Decimal
    price_annual: Decimal
    limits: dict  # JSON with all limits
    features: list  # List of feature flags
    is_active: bool

# Example limits JSON:
{
    "agents": 3,
    "api_calls_monthly": 5000,
    "tokens_monthly": 100000,
    "storage_bytes": 524288000,  # 500MB
    "image_credits_monthly": 100,
    "rag_queries_monthly": 1000,
    "workflow_runs_monthly": 500,
    "team_members": 5,
    "projects": 3,
    "rate_limit_per_minute": 100,
    "concurrent_sessions": 5,
    "data_retention_days": 30
}
```

### Usage Tracking
```python
class UsageRecord:
    id: UUID
    customer: FK(Customer)
    period_start: Date
    period_end: Date

    # Counters
    api_calls: int
    tokens_input: int
    tokens_output: int
    storage_bytes: int
    image_credits: int
    rag_queries: int
    workflow_runs: int

    # Per-agent breakdown
    usage_by_agent: dict  # {agent_uuid: {...counters}}

    # Billing
    overage_charges: Decimal
    is_finalized: bool
```

### Overage Rates
```python
class OverageRate:
    plan: FK(Plan)
    resource_type: str  # "api_calls", "tokens", etc.
    rate: Decimal
    unit_size: int  # e.g., 1000 for "per 1K tokens"
```

---

## Stripe Integration

### Products Structure
```
Product: AI Agent Marketplace
├── Price: Free (recurring, $0/month)
├── Price: Starter Monthly ($29/month)
├── Price: Starter Annual ($278/year)
├── Price: Pro Monthly ($99/month)
├── Price: Pro Annual ($950/year)
└── Metered Prices (for overages):
    ├── API Calls Overage ($0.001/call)
    ├── Token Overage ($0.002/1K tokens)
    ├── Storage Overage ($0.10/GB)
    └── Image Credit Overage ($0.02/credit)
```

### Checkout Flow
```
1. User selects plan
2. Create Stripe Checkout Session
   - subscription mode
   - with selected price
   - success_url → /subscription/success
   - cancel_url → /pricing
3. User completes payment
4. Webhook: checkout.session.completed
   - Create/update customer subscription
   - Set usage limits
   - Activate features
5. Redirect to success page
6. Monthly: Report metered usage to Stripe
```

---

## Implementation Priority

### Phase 1: Basic Plans (Week 1-2)
- [ ] Create Plan model with limits
- [ ] Implement Stripe subscription checkout
- [ ] Basic usage tracking
- [ ] Plan enforcement (hard limits)

### Phase 2: Usage Dashboard (Week 3-4)
- [ ] Usage aggregation jobs
- [ ] Dashboard UI components
- [ ] Usage alerts (80%, 100%)

### Phase 3: Overage Handling (Week 5-6)
- [ ] Overage rate configuration
- [ ] Metered billing to Stripe
- [ ] Soft limit mode

### Phase 4: Advanced Features (Week 7-8)
- [ ] Per-agent usage breakdown
- [ ] Custom enterprise limits
- [ ] Annual billing discounts
- [ ] Add-on purchases

---

*Document created: December 16, 2025*
