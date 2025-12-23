# GTM Implementation Plan - Agent Marketplace UX

**Date:** December 16, 2025
**Status:** APPROVED - Ready for Implementation
**Approach:** Agent.ai + MuleRun Pattern (Credit-Based, Run-First UX)

---

## Locked Decisions

### UX Pattern
- **Agent.ai style:** Social proof, professional network feel, provider attribution
- **MuleRun style:** Credit system, pay-per-run, instant access

### Pricing Model (MuleRun Reference)
- **Credit conversion:** $1 = 100 credits
- **Subscription tiers:**

  | Plan | Monthly | Yearly (20% off) | Credits |
  |------|---------|------------------|---------|
  | Free | $0 | - | 300 starter + 50 daily |
  | Plus | $19.9/mo | $15.9/mo | + 2,000/month |
  | Pro | $99.9/mo | $79.9/mo | + 10,000/month |
  | Enterprise | Custom | Custom | Pay-as-you-go |

- **Plan features:**
  - Free: 1 session, 10GB storage, 350+ agents, 1 Page instance
  - Plus: 5 sessions, 100GB, scheduled tasks, 10 Pages + custom domains
  - Pro: 30 sessions, 1TB, priority access, early features, 50 Pages
  - Enterprise: Org management, private agents, dedicated environment, SLA

- **Top-up packages (Plus/Pro only):**
  - Starter: $15 = 1,500 credits
  - Standard: $50 = 5,000 credits
  - Power: $100 = 10,000 credits

- **Billing toggle:** [Yearly SAVE~20%] / [Monthly]
- **Agent pricing:** Credits per run (fixed or variable by provider)

### Core Principles
1. **Instant access** - No approval workflows
2. **Try before subscribe** - Chat playground on every agent
3. **Credit-based** - Pay only for what you use
4. **Social proof** - Runs, ratings, reviews visible

---

## Phase 1: Core Marketplace UX (Week 1-2)

### 1.1 Backend: Auto-Approval
**Priority:** P0 | **Effort:** 2h

```python
# cmp-backend: Set auto_approve=True as default for site agent offerings
# File: src/waldur_mastermind/marketplace_site_agent/models.py

class AgentOffering(Offering):
    class Meta:
        proxy = True

    def save(self, *args, **kwargs):
        # Auto-approve all agent orders by default
        if not self.pk:
            self.auto_approve = True
        super().save(*args, **kwargs)
```

**Tasks:**
- [ ] Update `SiteAgentOfferingCreateSerializer` to set `auto_approve=True`
- [ ] Migration to update existing offerings
- [ ] Test: Order should auto-approve without admin intervention

### 1.2 Frontend: Agent Cards with Credit Pricing
**Priority:** P0 | **Effort:** 8h

**Current Card → New Card:**
```
BEFORE:                          AFTER:
┌──────────────────┐            ┌──────────────────┐
│ [Image]          │            │ [Image/GIF]      │
│ Agent Name       │            │ Agent Name  [PRO]│
│ Description...   │            │ by @provider     │
│                  │            │ Description...   │
│ [View Details]   │            │ ⭐4.8 • 2.7K runs│
└──────────────────┘            │ [5 credits/run]  │
                                │ [Run] [Details]  │
                                └──────────────────┘
```

**Files to modify:**
- `src/marketplace/offerings/OfferingCard.tsx`
- `src/marketplace/offerings/OfferingGrid.tsx`
- `src/marketplace/types.ts` (add runs, rating fields)

**New component props:**
```typescript
interface AgentCardProps {
  uuid: string;
  name: string;
  provider: {
    name: string;
    handle: string;
  };
  description: string;
  category: 'agents' | 'apps' | 'assistants' | 'automations';
  stats: {
    runs: number;
    rating: number;
    reviewsCount: number;
  };
  pricing: {
    model: 'free' | 'fixed_credits' | 'variable_credits' | 'subscription';
    creditsPerRun?: number;
    creditsMin?: number;
    creditsMax?: number;
  };
  isPremium: boolean;
  previewImage?: string;
}
```

### 1.3 Frontend: Category Pills
**Priority:** P1 | **Effort:** 4h

**Replace sidebar filters with horizontal pills:**
```tsx
// src/marketplace/components/CategoryPills.tsx
const categories = [
  { id: 'all', label: 'All', icon: '🔥' },
  { id: 'agents', label: 'Agents', icon: '🤖' },
  { id: 'apps', label: 'Apps', icon: '📱' },
  { id: 'assistants', label: 'Assistants', icon: '💬' },
  { id: 'automations', label: 'Automations', icon: '⚡' },
];
```

### 1.4 Frontend: "Run Agent" Modal with Chat Playground
**Priority:** P0 | **Effort:** 12h

**New component:**
```tsx
// src/marketplace/components/RunAgentModal.tsx
interface RunAgentModalProps {
  offering: AgentOffering;
  isOpen: boolean;
  onClose: () => void;
  onAddToMyAgents: () => void;
}
```

**Features:**
- Chat interface (reuse existing chat component)
- Credit balance display
- Cost per message indicator
- "Add to My Agents" CTA
- Works for anonymous users (with login prompt)

### 1.5 Frontend: Terminology Updates
**Priority:** P1 | **Effort:** 2h

**Search & Replace:**
| Old Term | New Term |
|----------|----------|
| Resources | My Agents |
| Offerings | Agents |
| Order | Subscribe |
| marketplace-resources | my-agents |

**Files:**
- Navigation components
- Breadcrumbs
- Route definitions
- i18n strings

### 1.6 Frontend: Execution Count Display
**Priority:** P1 | **Effort:** 4h

**Backend API change:**
```python
# Add to offering serializer
class PublicOfferingSerializer:
    runs_count = serializers.IntegerField(read_only=True)
    rating_average = serializers.FloatField(read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)
```

**Frontend display:**
```tsx
<span className="text-sm text-gray-500">
  ⭐ {rating.toFixed(1)} ({reviewsCount}) • {formatNumber(runs)}+ runs
</span>
```

---

## Phase 2: Credit System (Week 2-3)

### 2.1 Backend: Credit Models
**Priority:** P0 | **Effort:** 8h

```python
# src/waldur_mastermind/marketplace_credits/models.py

class CreditPackage(models.Model):
    """Purchasable credit packages"""
    name = models.CharField(max_length=100)
    credits = models.PositiveIntegerField()
    bonus_credits = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stripe_price_id = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    @property
    def total_credits(self):
        return self.credits + self.bonus_credits

class CreditBalance(models.Model):
    """Organization credit balance"""
    customer = models.OneToOneField('structure.Customer', on_delete=models.CASCADE)
    balance = models.PositiveIntegerField(default=0)
    starter_credits_claimed = models.BooleanField(default=False)
    last_daily_refresh = models.DateField(null=True)

    def refresh_daily_credits(self, amount=50):
        today = timezone.now().date()
        if self.last_daily_refresh != today:
            self.balance += amount
            self.last_daily_refresh = today
            self.save()

class CreditTransaction(models.Model):
    """Credit transaction history"""
    TRANSACTION_TYPES = [
        ('purchase', 'Package Purchase'),
        ('starter', 'Starter Credits'),
        ('daily', 'Daily Credits'),
        ('spend', 'Agent Run'),
        ('refund', 'Refund'),
    ]

    customer = models.ForeignKey('structure.Customer', on_delete=models.CASCADE)
    amount = models.IntegerField()  # Positive = credit, Negative = debit
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    reference_type = models.CharField(max_length=50, blank=True)
    reference_id = models.UUIDField(null=True)
    description = models.CharField(max_length=255, blank=True)
    created = models.DateTimeField(auto_now_add=True)
```

### 2.2 Backend: Credit Package Seeding
**Priority:** P0 | **Effort:** 2h

```python
# Management command: load_credit_packages
PACKAGES = [
    {'name': 'Small', 'credits': 1000, 'bonus': 0, 'price': 10.00},
    {'name': 'Medium', 'credits': 5000, 'bonus': 500, 'price': 50.00},
    {'name': 'Large', 'credits': 10000, 'bonus': 2000, 'price': 100.00},
    {'name': 'XL', 'credits': 50000, 'bonus': 20000, 'price': 500.00},
]
```

### 2.3 Backend: Stripe Integration for Credits
**Priority:** P0 | **Effort:** 8h

```python
# src/waldur_mastermind/marketplace_credits/views.py

class CreditPurchaseView(APIView):
    def post(self, request):
        package = CreditPackage.objects.get(uuid=request.data['package_uuid'])
        customer = request.user.customer

        # Create Stripe checkout session
        session = stripe.checkout.Session.create(
            mode='payment',
            line_items=[{
                'price': package.stripe_price_id,
                'quantity': 1,
            }],
            success_url=f'{settings.FRONTEND_URL}/credits/success',
            cancel_url=f'{settings.FRONTEND_URL}/credits/cancel',
            metadata={
                'customer_uuid': str(customer.uuid),
                'package_uuid': str(package.uuid),
            }
        )
        return Response({'checkout_url': session.url})
```

### 2.4 Backend: Free Credits on Signup
**Priority:** P0 | **Effort:** 4h

```python
# Signal handler for new customer creation
@receiver(post_save, sender=Customer)
def grant_starter_credits(sender, instance, created, **kwargs):
    if created:
        balance, _ = CreditBalance.objects.get_or_create(customer=instance)
        if not balance.starter_credits_claimed:
            balance.balance += 300  # Starter credits
            balance.starter_credits_claimed = True
            balance.save()

            CreditTransaction.objects.create(
                customer=instance,
                amount=300,
                transaction_type='starter',
                description='Welcome starter credits'
            )
```

### 2.5 Backend: Credit Consumption on Agent Run
**Priority:** P0 | **Effort:** 8h

```python
# src/waldur_mastermind/marketplace_site_agent/gateway.py

def invoke_agent(config, input_data, user):
    customer = config.resource.project.customer
    balance = CreditBalance.objects.get(customer=customer)

    # Calculate cost based on agent pricing
    pricing = config.offering.agent_pricing
    credits_required = pricing.credits_per_run

    if balance.balance < credits_required:
        raise InsufficientCreditsError(
            required=credits_required,
            available=balance.balance
        )

    # Invoke agent
    result = runtime_client.invoke(config, input_data)

    # Deduct credits
    balance.balance -= credits_required
    balance.save()

    CreditTransaction.objects.create(
        customer=customer,
        amount=-credits_required,
        transaction_type='spend',
        reference_type='agent_run',
        reference_id=result.run_id,
        description=f'Agent run: {config.offering.name}'
    )

    return result
```

### 2.6 Frontend: Credit Balance Display
**Priority:** P1 | **Effort:** 4h

```tsx
// src/components/CreditBalance.tsx
const CreditBalance = () => {
  const { data: balance } = useQuery('creditBalance', fetchCreditBalance);

  return (
    <div className="flex items-center gap-2">
      <span className="text-yellow-500">🪙</span>
      <span className="font-medium">{balance?.credits.toLocaleString()}</span>
      <Link to="/credits" className="text-sm text-blue-500">
        Buy more
      </Link>
    </div>
  );
};
```

### 2.7 Frontend: Credit Purchase Flow
**Priority:** P1 | **Effort:** 8h

**Pages:**
- `/credits` - View balance + purchase packages
- `/credits/success` - Post-purchase confirmation
- `/credits/history` - Transaction history

---

## Phase 3: My Agents Dashboard (Week 3-4)

### 3.1 Frontend: New "My Agents" Page
**Priority:** P0 | **Effort:** 12h

**Route:** `/my-agents`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ My Agents                                        [+ Browse Agents]  │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ Credits  │ │ Runs     │ │ Active   │ │ Spent    │               │
│ │ 847      │ │ 1,234    │ │ 4        │ │ $12.34   │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│ [Agent Card 1 with quick actions]                                  │
│ [Agent Card 2 with quick actions]                                  │
│ [Agent Card 3 with quick actions]                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Frontend: Agent Quick Actions
**Priority:** P0 | **Effort:** 8h

```tsx
const AgentQuickActions = ({ config }) => (
  <div className="flex gap-2">
    <Button onClick={() => openChat(config)}>💬 Chat</Button>
    <Button onClick={() => navigate(`/my-agents/${config.uuid}/configure`)}>
      ⚙️ Configure
    </Button>
    <Button onClick={() => navigate(`/my-agents/${config.uuid}/api-keys`)}>
      🔑 API Keys
    </Button>
    <Button onClick={() => navigate(`/my-agents/${config.uuid}/widget`)}>
      📦 Widget
    </Button>
  </div>
);
```

### 3.3 Frontend: Agent Configuration Tabs
**Priority:** P1 | **Effort:** 16h

**Tabs:**
1. **Persona** - Name, greeting, system prompt, tone
2. **Branding** - Colors, logo, theme
3. **Widget** - Embed code, position, styling
4. **Advanced** - API settings, webhooks

---

## Phase 4: Provider Experience (Week 4-5)

### 4.1 Provider Dashboard
**Priority:** P1 | **Effort:** 8h

### 4.2 Agent Pricing Configuration
**Priority:** P1 | **Effort:** 8h

```tsx
// Pricing model selector in agent creation wizard
<RadioGroup value={pricingModel} onChange={setPricingModel}>
  <Radio value="free">Free</Radio>
  <Radio value="fixed_credits">Fixed Credits Per Run</Radio>
  <Radio value="variable_credits">Variable Credits</Radio>
  <Radio value="subscription">Subscription Only</Radio>
</RadioGroup>

{pricingModel === 'fixed_credits' && (
  <Input
    label="Credits Per Run"
    type="number"
    value={creditsPerRun}
    onChange={setCreditsPerRun}
  />
)}
```

### 4.3 Revenue Tracking
**Priority:** P2 | **Effort:** 16h

---

## File Structure Changes

### Backend (cmp-backend)

```
src/waldur_mastermind/
├── marketplace_credits/          # NEW MODULE
│   ├── __init__.py
│   ├── models.py                 # CreditPackage, CreditBalance, CreditTransaction
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── management/
│       └── commands/
│           └── load_credit_packages.py
├── marketplace_site_agent/
│   ├── models.py                 # Add AgentPricing model
│   ├── serializers.py            # Add pricing fields
│   └── gateway.py                # Add credit consumption
```

### Frontend (cmp-frontend)

```
src/
├── marketplace/
│   ├── components/
│   │   ├── AgentCard.tsx         # REDESIGN
│   │   ├── CategoryPills.tsx     # NEW
│   │   ├── RunAgentModal.tsx     # NEW
│   │   └── CreditBadge.tsx       # NEW
│   ├── pages/
│   │   └── MarketplacePage.tsx   # UPDATE
├── my-agents/                    # NEW SECTION
│   ├── pages/
│   │   ├── MyAgentsPage.tsx
│   │   ├── AgentConfigPage.tsx
│   │   ├── AgentApiKeysPage.tsx
│   │   └── AgentWidgetPage.tsx
│   └── components/
│       ├── AgentQuickActions.tsx
│       └── UsageStats.tsx
├── credits/                      # NEW SECTION
│   ├── pages/
│   │   ├── CreditsPage.tsx
│   │   ├── PurchaseSuccessPage.tsx
│   │   └── TransactionHistoryPage.tsx
│   └── components/
│       ├── CreditBalance.tsx
│       ├── PackageCard.tsx
│       └── TransactionList.tsx
├── components/
│   └── Header/
│       └── CreditBalanceWidget.tsx  # NEW
```

---

## API Endpoints Summary

### New Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/credits/balance/` | Get current credit balance |
| GET | `/api/credits/packages/` | List available packages |
| POST | `/api/credits/purchase/` | Initiate Stripe checkout |
| GET | `/api/credits/transactions/` | Transaction history |
| POST | `/api/agents/{uuid}/run/` | Run agent (consumes credits) |
| GET | `/api/marketplace/agents/` | Public agent listing (simplified) |

### Modified Endpoints

| Endpoint | Change |
|----------|--------|
| `GET /api/marketplace-public-offerings/` | Add `runs_count`, `rating_average`, `pricing` fields |
| `POST /api/marketplace-orders/` | Auto-approve, consume credits |

---

## Testing Checklist

### Phase 1
- [ ] Agent cards display credit pricing
- [ ] "Run Agent" opens chat modal
- [ ] Chat works without subscription
- [ ] Category pills filter correctly
- [ ] "My Agents" shows subscribed agents

### Phase 2
- [ ] New user receives 300 starter credits
- [ ] Daily credits refresh (50/day)
- [ ] Credit purchase via Stripe works
- [ ] Agent run deducts correct credits
- [ ] Insufficient credits shows error
- [ ] Transaction history accurate

### Phase 3
- [ ] My Agents dashboard loads
- [ ] Quick actions work (Chat, Configure, API Keys, Widget)
- [ ] Usage stats accurate
- [ ] Agent configuration saves

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first run | < 60s | Analytics |
| Signup → first run | < 2min | Funnel |
| Run conversion (browse → run) | > 30% | Analytics |
| Credit purchase rate | > 10% | Revenue |
| Agent activation | > 50% | Product |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Credit fraud | Rate limiting, anomaly detection |
| Runaway costs | Hard credit limit per session |
| Agent abuse | Usage monitoring, ToS enforcement |
| Stripe failures | Webhook retry, manual reconciliation |

---

*Document approved: December 16, 2025*
*Implementation start: Immediately*
