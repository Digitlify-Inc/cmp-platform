# GTM Credit System

## Overview

The CMP marketplace uses a credit-based pricing model where $1 USD = 100 credits. This document describes how the existing Waldur credit infrastructure supports the GTM agent marketplace.

## Existing Waldur Credit Infrastructure

Waldur already has a **production-ready credit system** with sophisticated features. The GTM marketplace leverages this existing infrastructure.

### Credit Models

```
┌─────────────────────────────────────────────────────────────────┐
│                    WALDUR CREDIT HIERARCHY                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CustomerCredit (Organization Level)                             │
│  ├── value: 10,000 credits                                       │
│  ├── expected_consumption: 500/month                             │
│  ├── end_date: 2025-12-01                                        │
│  ├── offerings: [Agent offerings only]                           │
│  │                                                               │
│  └── ProjectCredit (Project Level)                               │
│      ├── Project A: 3,000 credits allocated                      │
│      ├── Project B: 2,000 credits allocated                      │
│      └── Unallocated: 5,000 credits                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Models (Already Exist)

| Model | Location | Purpose |
|-------|----------|---------|
| `BaseCredit` | `invoices/models.py:558-638` | Abstract base with value, expiration, minimal consumption |
| `CustomerCredit` | `invoices/models.py:640-680` | Organization-level credits |
| `ProjectCredit` | `invoices/models.py:682-740` | Project-level allocation |
| `InvoiceItem` | `invoices/models.py:264-480` | Links usage to credits |
| `MonthlyCompensation` | `invoices/compensations.py` | Auto-applies credits to invoices |

### Credit Features Already Available

| Feature | Status | Details |
|---------|--------|---------|
| Credit balance tracking | Exists | `BaseCredit.value` (decimal) |
| Organization credits | Exists | `CustomerCredit` model |
| Project allocation | Exists | `ProjectCredit` model |
| Credit expiration | Exists | `BaseCredit.end_date` |
| Minimal consumption | Exists | Guaranteed minimum monthly spend |
| Offering restrictions | Exists | `CustomerCredit.offerings` M2M |
| Linear consumption | Exists | Time-based scaling as credits deplete |
| Invoice compensation | Exists | `MonthlyCompensation` class |
| Consumption history | Exists | `consumption_last_month` property |

## Credit Pricing Model

### Subscription Tiers

| Tier | Monthly Cost | Credits Included | $/Credit |
|------|-------------|------------------|----------|
| Free | $0 | 100 | N/A |
| Plus | $19.90 | 2,000 | $0.01 |
| Pro | $99.90 | 12,000 | $0.0083 |
| Enterprise | Custom | Custom | Negotiated |

### Credit Costs by Action

| Action | Credits | Notes |
|--------|---------|-------|
| Chat message (simple) | 1 | Topic assistants |
| Chat message (agent) | 2-3 | Agents with tools |
| RAG query | 2 | Includes embedding lookup |
| Document upload | 5 | Per document for RAG training |
| Web search | 3 | External API cost |
| Image generation | 10 | DALL-E/Midjourney |
| Voice interaction | 2 | Whisper + TTS |
| Code execution | 3 | Sandbox environment |

## How Credits Work

### Purchase Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. BUYER PURCHASES CREDITS                                       │
│    - Selects tier (Plus/Pro) or buys credit pack                 │
│    - Payment processed (Stripe)                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. CUSTOMER CREDIT CREATED/UPDATED                               │
│    CustomerCredit.value += purchased_credits                     │
│    CustomerCredit.end_date = expiration (if applicable)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. OPTIONAL: ALLOCATE TO PROJECTS                                │
│    ProjectCredit created for specific projects                   │
│    Total allocations <= CustomerCredit.value                     │
└─────────────────────────────────────────────────────────────────┘
```

### Consumption Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. AGENT INTERACTION                                             │
│    User sends message to agent                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. USAGE RECORDED                                                │
│    ComponentUsage created:                                       │
│    - resource: Subscription (Resource)                           │
│    - usage: credit_cost (e.g., 2)                                │
│    - billing_period: current month                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. INVOICE ITEM CREATED                                          │
│    InvoiceItem added to pending invoice:                         │
│    - unit_price: credit_cost                                     │
│    - quantity: 1                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. MONTHLY COMPENSATION (End of Month)                           │
│    MonthlyCompensation.apply_compensations():                    │
│    - Creates negative InvoiceItems                               │
│    - Deducts from CustomerCredit.value                           │
│    - Applies minimal consumption if needed                       │
└─────────────────────────────────────────────────────────────────┘
```

### Real-Time Balance Check

For immediate balance display (before monthly invoice):

```python
def get_current_credit_balance(customer):
    """Calculate real-time credit balance."""
    credit = CustomerCredit.objects.filter(customer=customer).first()
    if not credit:
        return 0

    # Get pending invoice items for current month
    pending_usage = InvoiceItem.objects.filter(
        invoice__customer=customer,
        invoice__state=Invoice.States.PENDING,
        credit__isnull=True  # Not yet compensated
    ).aggregate(total=Sum('total'))['total'] or 0

    return credit.value - pending_usage
```

## Integration with Agent Marketplace

### Offering Component Setup

Each agent offering should have a USAGE-type component for credit tracking:

```python
# When creating agent offering
OfferingComponent.objects.create(
    offering=agent_offering,
    type='credits',
    name='AI Credits',
    billing_type=OfferingComponent.BillingTypes.USAGE,
    measured_unit='credits',
    description='Credits consumed per interaction'
)
```

### Recording Agent Usage

```python
# In agent execution handler
def record_agent_usage(resource, action_type):
    """Record credit usage for agent interaction."""
    credit_cost = get_credit_cost(resource.offering, action_type)

    ComponentUsage.objects.create(
        resource=resource,
        component=resource.offering.components.get(type='credits'),
        usage=credit_cost,
        date=timezone.now(),
        billing_period=get_current_billing_period(),
        description=f'{action_type} - {credit_cost} credits'
    )
```

### Pre-Interaction Balance Check

```python
def check_sufficient_credits(customer, required_credits):
    """Check if customer has enough credits before interaction."""
    balance = get_current_credit_balance(customer)
    if balance < required_credits:
        raise InsufficientCreditsError(
            f'Insufficient credits. Required: {required_credits}, Available: {balance}'
        )
    return True
```

## API Endpoints Needed

### Credit Balance API

```
GET /api/customers/{uuid}/credits/
Response:
{
  "total_credits": 10000,
  "allocated_to_projects": 5000,
  "available": 5000,
  "pending_usage": 234,
  "current_balance": 4766,
  "expires_at": "2025-12-01",
  "minimal_consumption": 500
}
```

### Project Credit API

```
GET /api/projects/{uuid}/credits/
Response:
{
  "allocated": 3000,
  "used_this_month": 456,
  "available": 2544,
  "consumption_last_month": 890
}
```

### Usage History API

```
GET /api/resources/{uuid}/usage/
Response:
{
  "results": [
    {
      "date": "2024-12-16T10:30:00Z",
      "action": "chat_message",
      "credits": 2,
      "description": "Chat interaction"
    },
    ...
  ],
  "total_this_month": 234,
  "total_last_month": 456
}
```

## Minimal Consumption (Commitment)

For enterprise customers with committed spend:

```python
# Example: $500/month minimum commitment
CustomerCredit.objects.create(
    customer=enterprise_customer,
    value=60000,  # $600 worth of credits
    expected_consumption=5000,  # 5000 credits/month minimum
    minimal_consumption_logic='FIXED',  # or 'LINEAR' for time-based
    apply_as_minimal_consumption=True,
    end_date=date(2025, 12, 1)
)
```

**How it works:**
- If actual usage < 5000 credits, customer is still charged 5000
- Credits are deducted regardless of usage
- Prevents over-provisioning of free tier usage

## Credit Allocation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREDIT ALLOCATION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Organization: Acme Corp                                         │
│  CustomerCredit.value = 10,000                                   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Allocate to Projects (Optional)                          │    │
│  │                                                          │    │
│  │  Project: Website       ProjectCredit.value = 3,000     │    │
│  │  Project: Mobile App    ProjectCredit.value = 2,000     │    │
│  │  Unallocated:           5,000                           │    │
│  │                                                          │    │
│  │  Total allocated <= CustomerCredit.value                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Usage Priority:                                                 │
│  1. If subscription in project with ProjectCredit → use project │
│  2. Otherwise → use customer (unallocated) credits              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Integration

### Credit Balance Display

```tsx
// CreditBalanceWidget.tsx
export const CreditBalanceWidget: FC<{ customerId: string }> = ({ customerId }) => {
  const { data: credits } = useQuery({
    queryKey: ['customer-credits', customerId],
    queryFn: () => getCustomerCredits(customerId),
  });

  return (
    <Card>
      <Card.Body>
        <div className="d-flex justify-content-between">
          <span>Available Credits</span>
          <strong>{credits?.current_balance.toLocaleString()}</strong>
        </div>
        <ProgressBar
          now={(credits?.current_balance / credits?.total_credits) * 100}
          variant={credits?.current_balance < 100 ? 'danger' : 'primary'}
        />
        {credits?.expires_at && (
          <small className="text-muted">
            Expires: {formatDate(credits.expires_at)}
          </small>
        )}
      </Card.Body>
    </Card>
  );
};
```

### Low Balance Warning

```tsx
// LowBalanceAlert.tsx
export const LowBalanceAlert: FC = () => {
  const customer = useSelector(getCustomer);
  const { data: credits } = useCustomerCredits(customer?.uuid);

  if (!credits || credits.current_balance > 100) {
    return null;
  }

  return (
    <Alert variant="warning">
      <Alert.Heading>Low Credit Balance</Alert.Heading>
      <p>
        You have {credits.current_balance} credits remaining.
        <Link to="/credits/purchase">Purchase more credits</Link>
      </p>
    </Alert>
  );
};
```

## What Needs to Be Built

### Already Exists (Use As-Is)
- CustomerCredit / ProjectCredit models
- MonthlyCompensation engine
- InvoiceItem with credit FK
- ComponentUsage tracking
- Minimal consumption logic

### Needs API Endpoints
- `GET /api/customers/{uuid}/credits/` - Balance query
- `GET /api/projects/{uuid}/credits/` - Project allocation
- `POST /api/customers/{uuid}/credits/allocate/` - Allocate to project
- `GET /api/resources/{uuid}/usage/` - Usage history

### Needs Frontend Components
- CreditBalanceWidget
- CreditAllocationForm
- UsageHistoryTable
- LowBalanceAlert
- CreditPurchaseFlow

### Needs Backend Logic
- Pre-interaction credit check
- Real-time balance calculation
- Credit purchase/top-up flow
- Usage recording per agent action

## Related Documents

- [GTM-BUYER-JOURNEY.md](./GTM-BUYER-JOURNEY.md) - Buyer journey with credit display
- [GTM-CAPABILITY-CONFIG.md](./GTM-CAPABILITY-CONFIG.md) - Credit costs per capability
- [GTM-TENANT-ISOLATION.md](./GTM-TENANT-ISOLATION.md) - Credit isolation by org/project
