# GSV Agent Registry - E2E Gap Analysis for GTM

**Document Version:** 1.4
**Status:** Active
**Created:** December 2, 2025
**Last Updated:** December 10, 2025
**Target:** GTM Soft Launch (End of 2025)

---

## Executive Summary

The Agent Registry is **75-80% ready** for GTM soft launch. Core infrastructure, Waldur integration, and agent lifecycle management are complete. This document identifies remaining gaps and provides specific code changes needed to achieve E2E functionality.

### GTM Readiness Score

| Category | Status | Score |
|----------|--------|-------|
| Core Infrastructure | Complete | 100% |
| Agent Lifecycle | Complete | 100% |
| Waldur/CMP Integration | Complete | 95% |
| Usage & Billing | Complete | 100% |
| API Key Auth | Complete | 100% |
| Admin Interface | Complete | 100% |
| E2E Testing | Partial | 60% |
| Customer Configuration | Complete | 100% |
| Widget/Embed | Missing | 0% |
| **Stripe Payment Gateway** | **NOT STARTED - P0** | **0%** |
| **Customer Portal (cmp-portal)** | **In Progress** | **85%** |
| **Provider Portal** | **Not Started** | **0%** |
| Marketing Website (gsv-website) | Complete | 100% |

**Overall: 72%** (reduced due to Stripe P0 requirement)

### Customer Portal Progress (Updated Dec 9, 2025)

| Feature | Status | Notes |
|---------|--------|-------|
| Marketplace Listing | Complete | Agent grid with search/filter |
| Agent Detail Page | Complete | Full agent info with plans |
| Subscription Checkout | Complete | Plan selection, project assignment, modal flow |
| Organization Management | Complete | Org/project switching, team members |
| User Profile & Settings | Complete | Profile editing, org settings |
| My Agents Dashboard | Complete | Subscribed agents management |
| Persona Configuration | Complete | Customize agent appearance |
| API Keys Management | Complete | Create/revoke API keys |
| Usage Analytics | Complete | Charts and metrics |
| Training Documents | Complete | Upload/manage training docs |
| Widget Embed | Partial | UI ready, backend integration pending |
| OIDC/SSO Integration | Complete | NextAuth.js with Keycloak |

**Customer Portal Repository:** `GSVDEV/cmp-portal`

### Provider Portal (Service Provider Dashboard) - NOT STARTED

**Note:** The Provider Portal is a SEPARATE component from the marketing website (gsv-website).

**GTM Simplification:** For initial GTM soft launch, there is only **ONE service provider: Digitlify Inc.**
- Service Provider = Seller (uploads/registers agents, sets pricing)
- Customer = Buyer (browses marketplace, subscribes to agents)

This single-provider model simplifies GTM requirements significantly:
- No multi-tenant provider registration needed initially
- Digitlify team can use Django Admin to register agents
- Focus on Customer Portal experience for buyers

| Required Feature | GTM Status | Full Feature Status | Description |
|------------------|------------|---------------------|-------------|
| Provider Registration | N/A (single provider) | Not Started | SSO-based provider onboarding |
| Agent Upload/Registration | Via Django Admin | Not Started | Register agents in Agent Registry |
| Pricing Configuration | Via Django Admin | Not Started | Set pricing models (free, subscription, usage-based) |
| Catalog Management | Via Django Admin | Not Started | Manage agent/app/MCP offerings |
| Revenue Dashboard | Basic (Admin) | Not Started | View usage analytics and revenue |
| Payout Management | N/A (single provider) | Not Started | Configure payout settings |
| Provider SSO | N/A (single provider) | Not Started | Keycloak integration for providers |

**GTM Path (Single Provider - Digitlify Inc.):**
- Use Django Admin for all agent management
- P0 Admin Interface gap addresses this need
- No additional Provider Portal UI needed for GTM

**Post-GTM Architecture Options (Multi-Provider):**
1. **Separate App**: New Next.js app similar to cmp-portal but for providers
2. **Mode in cmp-portal**: Add provider role/mode to existing Customer Portal
3. **Agent Studio Extension**: Extend LangFlow/Agent Studio with publishing features

**Marketing Website Repository:** `GSVDEV/gsv-website` (Wagtail CMS - landing page only)

---

## Platform Architecture

### Domain Structure

| Domain | Purpose | Component |
|--------|---------|-----------|
| `www.digitlify.com` | Marketing, content, blogs | gsv-website (Wagtail CMS) |
| `app.digitlify.com` | CMP Platform (Waldur) | waldur-mastermind, cmp-portal |
| `studio.digitlify.com` | Agent development (LangFlow) | agentstudio |
| `api.digitlify.com` | Agent Registry API | agent-registry |
| `*.digitlify.com` | Other platform components | Various services |

### Core Components

| Component | Description | Multi-Tenancy |
|-----------|-------------|---------------|
| **CMP (Waldur)** | Customer Management Platform - Organization, Project, Team management | Built-in (Org-Project-Team) |
| **Keycloak (SSO)** | Identity Provider - Authentication & Authorization | Built-in (Realms) |
| **Agent Studio** | LangFlow in studio mode for developing "flows" | Via Agent Registry |
| **Agent Registry** | Lifecycle management for apps, agents, MCPs | Via Waldur integration |
| **Customer Portal** | Self-service portal for customers (buyers) | Via Waldur tenant model |
| **Provider Portal** | Self-service portal for sellers (future) | Via Waldur tenant model |
| **Agent Runtime** | LangFlow in execution environment | Per-tenant isolation |

### Multi-Tenancy Model

**IMPORTANT:** Multi-tenancy is already supported out of the box:

- **Waldur** provides Organization → Project → Team hierarchy
- **Keycloak** provides realm-based multi-tenancy for SSO
- **Agent Registry** inherits tenant model from Waldur via webhook sync

No additional multi-tenancy infrastructure is required. Other components (Agent Studio, Agent Runtime, Customer Portal) need to respect the same tenant boundaries that Waldur establishes.

**Provider Onboarding Model (Post-GTM):**
Multiple providers can be onboarded using the same mechanism as customers:
- Each Provider = Waldur Organization (with "provider" role/type)
- Provider onboarding follows same flow as customer onboarding
- Provider Portal UI would be similar to Customer Portal but with seller-focused features
- No separate multi-tenancy implementation needed

**GTM Single-Provider Note:** For GTM soft launch, Digitlify Inc. is the sole provider (seller). The multi-tenant infrastructure supports future expansion to multiple providers without architectural changes - providers simply onboard as Organizations.

---

## 1. Gap Analysis: Critical Gaps (P0)

### 1.1 Admin Interface - Django Admin Configuration [COMPLETED]

**Status:** COMPLETE - All admin.py files have been implemented in gsv-agents repository.

**Implementation Summary:**
- `agent_registry/tenants/admin.py` - AgentTenant, AgentProject management
- `agent_registry/agents/admin.py` - AgentInstance lifecycle, AgentPlan pricing
- `agent_registry/access/admin.py` - AgentAccess API keys, AgentConfiguration
- `agent_registry/usage/admin.py` - UsageRecord, TenantQuotaSnapshot, DailyUsageSummary

All admin interfaces include custom list displays, filtering, searching, autocomplete fields, and administrative actions for state transitions, quota management, and Waldur sync.

<details>
<summary>Original Gap Description (for reference)</summary>

**Gap:** No admin.py files exist in any app. Operations team cannot manage tenants, agents, or access keys without direct database access.

**Impact:** Cannot perform GTM operations like tenant onboarding, agent management, or subscription troubleshooting.
</details>

**Files to Create:**

```
agent_registry/tenants/admin.py    # New file
agent_registry/agents/admin.py     # New file
agent_registry/access/admin.py     # New file
agent_registry/usage/admin.py      # New file
```

**Code Changes:**

**File: `agent_registry/tenants/admin.py`**
```python
from django.contrib import admin
from django.utils.html import format_html
from .models import AgentTenant, AgentProject


@admin.register(AgentTenant)
class AgentTenantAdmin(admin.ModelAdmin):
    list_display = [
        "name", "slug", "tenancy_model", "is_active_display",
        "monthly_api_calls_limit", "max_agents", "created_at"
    ]
    list_filter = ["tenancy_model", "is_active", "created_at"]
    search_fields = ["name", "slug", "waldur_customer_uuid", "waldur_customer_name"]
    readonly_fields = ["created_at", "updated_at", "waldur_customer_uuid"]
    ordering = ["-created_at"]

    fieldsets = (
        ("Identity", {
            "fields": ("name", "slug", "waldur_customer_uuid", "waldur_customer_name")
        }),
        ("Tenancy Configuration", {
            "fields": ("tenancy_model", "dedicated_namespace", "dedicated_resource_quota")
        }),
        ("Limits", {
            "fields": ("monthly_api_calls_limit", "max_agents")
        }),
        ("Status", {
            "fields": ("is_active", "suspended_at", "suspension_reason")
        }),
        ("Metadata", {
            "fields": ("metadata", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

    def is_active_display(self, obj):
        if obj.is_active:
            return format_html('<span style="color: green;">Active</span>')
        return format_html('<span style="color: red;">Inactive</span>')
    is_active_display.short_description = "Status"

    actions = ["suspend_tenants", "reactivate_tenants"]

    @admin.action(description="Suspend selected tenants")
    def suspend_tenants(self, request, queryset):
        from django.utils import timezone
        queryset.update(is_active=False, suspended_at=timezone.now())

    @admin.action(description="Reactivate selected tenants")
    def reactivate_tenants(self, request, queryset):
        queryset.update(is_active=True, suspended_at=None, suspension_reason="")


@admin.register(AgentProject)
class AgentProjectAdmin(admin.ModelAdmin):
    list_display = ["name", "tenant", "waldur_project_name", "is_active", "created_at"]
    list_filter = ["is_active", "tenant", "created_at"]
    search_fields = ["name", "waldur_project_uuid", "tenant__name"]
    readonly_fields = ["created_at", "updated_at"]
    autocomplete_fields = ["tenant"]
```

**File: `agent_registry/agents/admin.py`**
```python
from django.contrib import admin
from django.utils.html import format_html
from .models import AgentInstance, AgentPlan, AgentState


@admin.register(AgentInstance)
class AgentInstanceAdmin(admin.ModelAdmin):
    list_display = [
        "name", "agent_id", "state_display", "category",
        "project", "version", "state_changed_at"
    ]
    list_filter = ["state", "category", "project__tenant", "created_at"]
    search_fields = ["name", "agent_id", "description", "waldur_offering_uuid"]
    readonly_fields = [
        "created_at", "updated_at", "state_changed_at",
        "waldur_offering_uuid", "waldur_resource_uuid"
    ]
    autocomplete_fields = ["project"]
    ordering = ["-created_at"]

    fieldsets = (
        ("Identity", {
            "fields": ("name", "agent_id", "description", "version", "category", "tags")
        }),
        ("Project", {
            "fields": ("project",)
        }),
        ("Lifecycle", {
            "fields": ("state", "state_changed_at")
        }),
        ("LangFlow Integration", {
            "fields": ("langflow_flow_id", "langflow_flow_version")
        }),
        ("Runtime", {
            "fields": ("namespace", "runtime_endpoint", "runtime_deployment_name")
        }),
        ("Waldur Integration", {
            "fields": ("waldur_offering_uuid", "waldur_resource_uuid")
        }),
        ("Configuration", {
            "fields": ("config", "max_concurrent_requests", "timeout_seconds")
        }),
        ("Metadata", {
            "fields": ("metadata", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

    def state_display(self, obj):
        colors = {
            AgentState.DRAFT: "gray",
            AgentState.DEPLOYED: "blue",
            AgentState.LISTED: "orange",
            AgentState.ACTIVE: "green",
            AgentState.PAUSED: "yellow",
            AgentState.RETIRED: "red",
        }
        color = colors.get(obj.state, "black")
        return format_html(f'<span style="color: {color}; font-weight: bold;">{obj.state}</span>')
    state_display.short_description = "State"

    actions = ["deploy_agents", "activate_agents", "pause_agents", "retire_agents"]

    @admin.action(description="Transition to DEPLOYED")
    def deploy_agents(self, request, queryset):
        for agent in queryset:
            agent.transition_to(AgentState.DEPLOYED)
            agent.save()

    @admin.action(description="Transition to ACTIVE")
    def activate_agents(self, request, queryset):
        for agent in queryset:
            if agent.state == AgentState.LISTED:
                agent.transition_to(AgentState.ACTIVE)
                agent.save()

    @admin.action(description="Transition to PAUSED")
    def pause_agents(self, request, queryset):
        for agent in queryset:
            if agent.state == AgentState.ACTIVE:
                agent.transition_to(AgentState.PAUSED)
                agent.save()

    @admin.action(description="Retire agents")
    def retire_agents(self, request, queryset):
        for agent in queryset:
            agent.transition_to(AgentState.RETIRED)
            agent.save()


@admin.register(AgentPlan)
class AgentPlanAdmin(admin.ModelAdmin):
    list_display = [
        "name", "agent", "price_display", "monthly_quota",
        "rate_limit_per_second", "is_active", "display_order"
    ]
    list_filter = ["is_active", "agent__category", "created_at"]
    search_fields = ["name", "agent__name", "waldur_plan_uuid"]
    readonly_fields = ["created_at", "updated_at", "waldur_plan_uuid"]
    autocomplete_fields = ["agent"]
    ordering = ["agent", "display_order"]

    def price_display(self, obj):
        return f"${obj.price_cents/100:.2f}/{obj.currency}"
    price_display.short_description = "Price"
```

**File: `agent_registry/access/admin.py`**
```python
from django.contrib import admin
from django.utils.html import format_html
from .models import AgentAccess, AgentConfiguration


@admin.register(AgentAccess)
class AgentAccessAdmin(admin.ModelAdmin):
    list_display = [
        "key_prefix_display", "tenant", "agent_instance",
        "plan", "quota_display", "is_active_display", "last_used_at"
    ]
    list_filter = ["is_active", "tenant", "agent_instance", "plan", "created_at"]
    search_fields = [
        "key_prefix", "waldur_user_email", "waldur_user_uuid",
        "tenant__name", "agent_instance__name"
    ]
    readonly_fields = [
        "key_hash", "key_prefix", "created_at", "updated_at",
        "last_used_at", "total_requests", "quota_used"
    ]
    autocomplete_fields = ["tenant", "agent_instance", "plan"]
    ordering = ["-created_at"]

    fieldsets = (
        ("Access Key", {
            "fields": ("key_prefix", "key_hash", "name")
        }),
        ("Relationships", {
            "fields": ("tenant", "agent_instance", "plan")
        }),
        ("Waldur User", {
            "fields": ("waldur_user_uuid", "waldur_user_email", "waldur_order_uuid")
        }),
        ("Quota", {
            "fields": ("quota_limit", "quota_used", "quota_reset_at")
        }),
        ("Rate Limiting", {
            "fields": ("rate_limit_per_second",)
        }),
        ("Status", {
            "fields": ("is_active", "revoked_at", "revocation_reason")
        }),
        ("Usage Stats", {
            "fields": ("last_used_at", "total_requests")
        }),
        ("Metadata", {
            "fields": ("metadata", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

    def key_prefix_display(self, obj):
        return format_html(f'<code>{obj.key_prefix}...</code>')
    key_prefix_display.short_description = "API Key"

    def quota_display(self, obj):
        pct = (obj.quota_used / obj.quota_limit * 100) if obj.quota_limit else 0
        color = "green" if pct < 80 else ("orange" if pct < 100 else "red")
        return format_html(
            f'<span style="color: {color};">{obj.quota_used:,} / {obj.quota_limit:,} ({pct:.1f}%)</span>'
        )
    quota_display.short_description = "Quota Usage"

    def is_active_display(self, obj):
        if obj.is_active and not obj.revoked_at:
            return format_html('<span style="color: green;">Active</span>')
        return format_html('<span style="color: red;">Revoked</span>')
    is_active_display.short_description = "Status"

    actions = ["revoke_keys", "reset_quotas"]

    @admin.action(description="Revoke selected API keys")
    def revoke_keys(self, request, queryset):
        for access in queryset:
            access.revoke(reason="Revoked by admin")

    @admin.action(description="Reset quotas for selected keys")
    def reset_quotas(self, request, queryset):
        for access in queryset:
            access.reset_quota()


@admin.register(AgentConfiguration)
class AgentConfigurationAdmin(admin.ModelAdmin):
    list_display = ["access", "widget_enabled", "rag_enabled", "last_rag_sync_at"]
    list_filter = ["widget_enabled", "rag_enabled", "created_at"]
    search_fields = ["access__key_prefix", "branding_name"]
    readonly_fields = ["created_at", "updated_at", "last_rag_sync_at"]
    autocomplete_fields = ["access"]

    fieldsets = (
        ("Subscription", {
            "fields": ("access",)
        }),
        ("Widget", {
            "fields": ("widget_enabled", "widget_position", "widget_theme", "widget_avatar_url")
        }),
        ("Branding", {
            "fields": ("branding_name", "branding_logo_url", "branding_welcome_message", "branding_tagline")
        }),
        ("RAG", {
            "fields": ("rag_enabled", "rag_sources", "rag_chunk_size", "rag_chunk_overlap", "last_rag_sync_at")
        }),
        ("Training", {
            "fields": ("training_examples", "system_prompt_override", "context_variables")
        }),
        ("Advanced", {
            "fields": ("temperature", "max_tokens", "allowed_domains")
        }),
    )
```

**File: `agent_registry/usage/admin.py`**
```python
from django.contrib import admin
from django.utils.html import format_html
from .models import UsageRecord, TenantQuotaSnapshot, DailyUsageSummary


@admin.register(UsageRecord)
class UsageRecordAdmin(admin.ModelAdmin):
    list_display = [
        "request_id_short", "access_key", "agent_name",
        "response_status_display", "response_time_ms", "tokens_total", "created_at"
    ]
    list_filter = ["response_status", "billing_period", "created_at"]
    search_fields = ["request_id", "access__key_prefix", "agent_instance__name"]
    readonly_fields = [
        "access", "agent_instance", "endpoint", "request_method", "request_id",
        "response_status", "response_time_ms", "tokens_input", "tokens_output",
        "tokens_total", "estimated_cost_cents", "billing_period", "tenant_id",
        "created_at", "updated_at"
    ]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"

    def request_id_short(self, obj):
        return obj.request_id[:8] + "..." if obj.request_id else "-"
    request_id_short.short_description = "Request ID"

    def access_key(self, obj):
        return obj.access.key_prefix if obj.access else "-"
    access_key.short_description = "API Key"

    def agent_name(self, obj):
        return obj.agent_instance.name if obj.agent_instance else "-"
    agent_name.short_description = "Agent"

    def response_status_display(self, obj):
        color = "green" if 200 <= obj.response_status < 300 else "red"
        return format_html(f'<span style="color: {color};">{obj.response_status}</span>')
    response_status_display.short_description = "Status"

    def has_add_permission(self, request):
        return False  # Usage records are created by the system

    def has_change_permission(self, request, obj=None):
        return False  # Usage records are immutable


@admin.register(TenantQuotaSnapshot)
class TenantQuotaSnapshotAdmin(admin.ModelAdmin):
    list_display = [
        "tenant", "billing_cycle_id", "total_api_calls",
        "total_tokens", "total_cost_display", "sync_status", "is_finalized"
    ]
    list_filter = ["billing_cycle_id", "synced_to_waldur", "is_finalized", "created_at"]
    search_fields = ["tenant__name", "billing_cycle_id"]
    readonly_fields = [
        "tenant", "billing_cycle_id", "total_api_calls",
        "total_tokens_input", "total_tokens_output", "total_tokens",
        "total_cost_cents", "usage_by_agent", "synced_to_waldur",
        "synced_at", "sync_attempts", "sync_error", "is_finalized",
        "finalized_at", "created_at", "updated_at"
    ]
    ordering = ["-billing_cycle_id", "tenant__name"]

    def total_cost_display(self, obj):
        return f"${obj.total_cost_cents/100:.2f}"
    total_cost_display.short_description = "Cost"

    def sync_status(self, obj):
        if obj.synced_to_waldur:
            return format_html('<span style="color: green;">Synced</span>')
        if obj.sync_error:
            return format_html(f'<span style="color: red;" title="{obj.sync_error}">Error</span>')
        return format_html('<span style="color: orange;">Pending</span>')
    sync_status.short_description = "Sync Status"

    actions = ["retry_sync"]

    @admin.action(description="Retry Waldur sync")
    def retry_sync(self, request, queryset):
        from agent_registry.usage.tasks import sync_billing_to_waldur
        for snapshot in queryset.filter(synced_to_waldur=False):
            sync_billing_to_waldur.delay(snapshot.id)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(DailyUsageSummary)
class DailyUsageSummaryAdmin(admin.ModelAdmin):
    list_display = [
        "tenant", "agent_instance", "date", "total_requests",
        "successful_requests", "failed_requests", "avg_response_time_ms"
    ]
    list_filter = ["date", "tenant"]
    search_fields = ["tenant__name", "agent_instance__name"]
    readonly_fields = [
        "tenant", "agent_instance", "date", "total_requests",
        "successful_requests", "failed_requests", "total_tokens",
        "avg_response_time_ms", "p95_response_time_ms", "created_at", "updated_at"
    ]
    ordering = ["-date", "tenant__name"]
    date_hierarchy = "date"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
```

---

### 1.2 Stripe Payment Gateway Integration [P0 - REQUIRED FOR GTM]

**Status:** NOT STARTED - **Stripe is required from Day 1 for payment collection**

**Gap:** No payment gateway integration exists. `IntegrationProvider.STRIPE` is defined as a placeholder but not implemented. Customers cannot pay via credit card.

**Impact:** CRITICAL - Cannot collect payments from customers without Stripe integration.

**Architecture Decision:** Agent Registry will own Stripe integration because:
- `AgentPlan` is the source of truth for pricing
- `UsageRecord` and `TenantQuotaSnapshot` track usage for billing
- `AgentAccess` manages subscriptions

**Files to Create/Modify:**

```
# Agent Registry (gsv-agents)
agent_registry/billing/                 # New Django app
├── __init__.py
├── models.py                          # StripeCustomer, StripeSubscription, StripeProduct, StripeWebhookEvent
├── services.py                        # StripeService class
├── webhooks.py                        # Webhook handlers
├── views.py                           # Checkout, subscription endpoints
├── serializers.py                     # API serializers
├── urls.py                            # URL routing
└── admin.py                           # Admin interface

# Existing files to modify
agent_registry/agents/models.py        # Add stripe_product_id, stripe_price_id to AgentPlan
agent_registry/access/models.py        # Add stripe_subscription_id, stripe_customer_id to AgentAccess
agent_registry/settings.py             # Add STRIPE_CONFIG settings

# CMP Portal (cmp-portal)
src/components/StripeCheckout.tsx      # New - Stripe Elements component
src/app/(dashboard)/marketplace/[slug]/page.tsx  # Update checkout modal
src/app/(dashboard)/billing/page.tsx   # New - Billing/payment management
src/lib/api.ts                         # Add Stripe checkout methods
```

**Data Models:**

```python
# agent_registry/billing/models.py

class StripeCustomer(models.Model):
    """Maps tenant to Stripe customer."""
    tenant = models.OneToOneField(AgentTenant, on_delete=models.CASCADE)
    stripe_customer_id = models.CharField(max_length=255, unique=True)
    email = models.EmailField()
    default_payment_method_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class StripeProduct(models.Model):
    """Maps AgentPlan to Stripe product/price."""
    agent_plan = models.OneToOneField(AgentPlan, on_delete=models.CASCADE)
    stripe_product_id = models.CharField(max_length=255)
    stripe_price_id = models.CharField(max_length=255)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)


class StripeSubscription(models.Model):
    """Tracks active Stripe subscriptions."""
    agent_access = models.OneToOneField(AgentAccess, on_delete=models.CASCADE)
    stripe_subscription_id = models.CharField(max_length=255, unique=True)
    status = models.CharField(max_length=50)  # active, past_due, canceled, etc.
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    cancel_at_period_end = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class StripeWebhookEvent(models.Model):
    """Idempotent webhook event tracking."""
    event_id = models.CharField(max_length=255, unique=True)
    event_type = models.CharField(max_length=100)
    payload = models.JSONField()
    processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**API Endpoints:**

```python
# agent_registry/billing/urls.py
urlpatterns = [
    path('checkout/', StripeCheckoutView.as_view(), name='stripe-checkout'),
    path('subscriptions/', StripeSubscriptionListView.as_view(), name='stripe-subscriptions'),
    path('subscriptions/<str:subscription_id>/', StripeSubscriptionDetailView.as_view()),
    path('subscriptions/<str:subscription_id>/cancel/', StripeSubscriptionCancelView.as_view()),
    path('customer/', StripeCustomerView.as_view(), name='stripe-customer'),
    path('webhooks/', StripeWebhookView.as_view(), name='stripe-webhook'),
]
```

**Service Layer:**

```python
# agent_registry/billing/services.py

class StripeService:
    def __init__(self):
        stripe.api_key = settings.STRIPE_CONFIG['API_KEY_SECRET']

    def get_or_create_customer(self, tenant: AgentTenant, email: str) -> StripeCustomer:
        """Get or create Stripe customer for tenant."""
        pass

    def create_checkout_session(
        self,
        customer: StripeCustomer,
        agent_plan: AgentPlan,
        success_url: str,
        cancel_url: str
    ) -> str:
        """Create Stripe Checkout session, return session ID."""
        pass

    def create_subscription(
        self,
        customer: StripeCustomer,
        stripe_product: StripeProduct,
        agent_access: AgentAccess
    ) -> StripeSubscription:
        """Create Stripe subscription."""
        pass

    def cancel_subscription(self, subscription: StripeSubscription) -> None:
        """Cancel subscription at period end."""
        pass

    def sync_product_to_stripe(self, agent_plan: AgentPlan) -> StripeProduct:
        """Create/update Stripe product and price for AgentPlan."""
        pass

    def report_usage(self, agent_access: AgentAccess, quantity: int) -> None:
        """Report usage for metered billing."""
        pass
```

**Webhook Handlers:**

```python
# agent_registry/billing/webhooks.py

class StripeWebhookHandler:
    @staticmethod
    def handle_checkout_session_completed(event: dict) -> None:
        """Handle successful checkout - create subscription."""
        pass

    @staticmethod
    def handle_invoice_payment_succeeded(event: dict) -> None:
        """Handle successful payment - update subscription status."""
        pass

    @staticmethod
    def handle_invoice_payment_failed(event: dict) -> None:
        """Handle failed payment - notify customer, may suspend access."""
        pass

    @staticmethod
    def handle_customer_subscription_updated(event: dict) -> None:
        """Handle subscription changes."""
        pass

    @staticmethod
    def handle_customer_subscription_deleted(event: dict) -> None:
        """Handle subscription cancellation."""
        pass
```

**Frontend Components:**

```typescript
// src/components/StripeCheckout.tsx
'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function StripeCheckout({ clientSecret, onSuccess, onError }: Props) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}

function CheckoutForm({ onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/checkout/success' },
      redirect: 'if_required',
    });

    if (error) onError(error);
    else if (paymentIntent?.status === 'succeeded') onSuccess(paymentIntent);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>Subscribe</button>
    </form>
  );
}
```

**Environment Variables:**

```bash
# Agent Registry
STRIPE_API_KEY_SECRET=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_WEBHOOK_URL=https://api.digitlify.com/api/v1/billing/webhooks/

# CMP Portal
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**GTM Implementation Checklist:**

- [ ] Create `billing` Django app in gsv-agents
- [ ] Implement `StripeService` class
- [ ] Create Stripe webhook endpoint
- [ ] Add Stripe models with migrations
- [ ] Update `AgentPlan` to sync to Stripe
- [ ] Update marketplace checkout in cmp-portal
- [ ] Implement `StripeCheckout` component
- [ ] Create billing management page
- [ ] Test checkout flow end-to-end
- [ ] Configure Stripe webhooks in Stripe Dashboard
- [ ] Add Stripe secrets to Kubernetes/Vault

---

### 1.3 E2E Waldur Integration Testing

**Gap:** No live Waldur integration test exists. The E2E test script (`samples/e2e_test.sh`) uses mocked responses.

**Impact:** Cannot verify webhook flows, offering creation, or billing sync with real Waldur instance.

**Files to Create/Modify:**

```
samples/waldur_e2e_test.py          # New file - Live Waldur E2E test
agent_registry/tests/test_waldur_integration.py  # Integration tests
```

**Testing Checklist:**

```markdown
## Waldur E2E Testing Checklist

### Pre-requisites
- [ ] Waldur instance accessible (QA environment)
- [ ] Waldur API token configured
- [ ] Webhook secret configured
- [ ] Agent Registry deployed with Waldur settings

### Tenant Lifecycle
- [ ] Create Waldur Customer → AgentTenant created via webhook
- [ ] Update Waldur Customer → AgentTenant updated
- [ ] Suspend Waldur Customer → AgentTenant suspended

### Project Lifecycle
- [ ] Create Waldur Project → AgentProject created via webhook
- [ ] Archive Waldur Project → AgentProject deactivated

### Agent Publishing
- [ ] Register agent in Agent Registry
- [ ] Deploy agent (state: DRAFT → DEPLOYED)
- [ ] Publish agent to Waldur (state: DEPLOYED → LISTED)
- [ ] Verify Waldur Offering created with correct:
  - [ ] Name and description
  - [ ] Category mapping
  - [ ] Plans and pricing
- [ ] Activate agent (state: LISTED → ACTIVE)

### Subscription Flow
- [ ] Customer orders agent in Waldur
- [ ] Waldur sends order webhook to Agent Registry
- [ ] AgentAccess created with API key
- [ ] API key returned to Waldur (for customer display)

### Usage & Billing
- [ ] Make API calls with generated key
- [ ] Verify UsageRecord created for each call
- [ ] Run daily aggregation task
- [ ] Verify DailyUsageSummary populated
- [ ] Run monthly billing sync
- [ ] Verify TenantQuotaSnapshot synced to Waldur

### Error Handling
- [ ] Invalid webhook signature → 403 response
- [ ] Duplicate webhook → Idempotent handling
- [ ] Waldur API timeout → Retry logic
- [ ] Billing sync failure → Error recorded, retry queued
```

---

### 1.3 Missing Apps Registration

**Gap:** Apps may not be properly registered in Django settings.

**File to Verify: `agent_registry/settings.py`**

Ensure `INSTALLED_APPS` includes:
```python
INSTALLED_APPS = [
    # Django core
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party
    "rest_framework",
    "corsheaders",

    # Agent Registry apps
    "agent_registry.core",
    "agent_registry.tenants",
    "agent_registry.agents",
    "agent_registry.access",
    "agent_registry.usage",
    "agent_registry.waldur",
    "agent_registry.webhooks",
    "agent_registry.mcp",
    "agent_registry.mcp_server",
    "agent_registry.api",
]
```

---

## 2. Gap Analysis: High Priority Gaps (P1)

### 2.1 Widget/Embed JavaScript Library

**Gap:** `AgentConfiguration.get_widget_embed_code()` generates HTML referencing `https://widget.gsv.dev/agent-widget.js` which doesn't exist.

**Impact:** Customers cannot embed agents on their websites.

**Recommended Approach for GTM:**

**Option A (Fast - Use existing solution):**
- Integrate Botpress Web SDK or Chatwoot widget
- Configure to call Agent Registry API endpoint
- Modify embed code generation accordingly

**Option B (Custom - Post-GTM):**
- Build React-based widget component
- Bundle with webpack/rollup
- Host on CDN

**Immediate Fix (agent_registry/access/models.py:387-400):**

Update `get_widget_embed_code()` to use a placeholder that can be configured:

```python
def get_widget_embed_code(self) -> str:
    """Generate embeddable widget code snippet."""
    from django.conf import settings

    widget_base_url = settings.AGENT_REGISTRY.get(
        "WIDGET_BASE_URL",
        "https://widget.gsv.dev"
    )
    agent_id = self.access.agent_instance.agent_id

    return f'''<!-- GSV Agent Widget -->
<div id="gsv-agent-widget"></div>
<script>
  window.GSVAgentConfig = {{
    agentId: "{agent_id}",
    apiKey: "YOUR_API_KEY",  // Replace with your API key
    baseUrl: "{settings.AGENT_REGISTRY.get('API_BASE_URL', 'https://api.digitlify.com')}",
    position: "{self.widget_position}",
    theme: {self.widget_theme or {}},
    branding: {{
      name: "{self.branding_name or self.access.agent_instance.name}",
      logo: "{self.branding_logo_url}",
      welcomeMessage: "{self.branding_welcome_message or 'Hi! How can I help you?'}",
      tagline: "{self.branding_tagline}"
    }}
  }};
</script>
<script src="{widget_base_url}/agent-widget.js" async></script>'''
```

---

### 2.2 Health Check Endpoint Enhancement

**Gap:** Health endpoint may not check all dependencies.

**File to Modify: `agent_registry/core/views.py` or `agent_registry/api/views.py`**

```python
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import redis


def health_check(request):
    """Comprehensive health check for all dependencies."""
    health = {
        "status": "healthy",
        "checks": {}
    }

    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health["checks"]["database"] = {"status": "healthy"}
    except Exception as e:
        health["checks"]["database"] = {"status": "unhealthy", "error": str(e)}
        health["status"] = "unhealthy"

    # Redis/Cache check
    try:
        cache.set("health_check", "ok", 10)
        if cache.get("health_check") == "ok":
            health["checks"]["cache"] = {"status": "healthy"}
        else:
            raise Exception("Cache read failed")
    except Exception as e:
        health["checks"]["cache"] = {"status": "unhealthy", "error": str(e)}
        health["status"] = "unhealthy"

    # Celery check (optional - check if beat is running)
    try:
        from django_celery_beat.models import PeriodicTask
        task_count = PeriodicTask.objects.filter(enabled=True).count()
        health["checks"]["celery"] = {"status": "healthy", "enabled_tasks": task_count}
    except Exception as e:
        health["checks"]["celery"] = {"status": "unknown", "error": str(e)}

    status_code = 200 if health["status"] == "healthy" else 503
    return JsonResponse(health, status=status_code)
```

---

## 3. Gap Analysis: Medium Priority Gaps (P2)

### 3.1 User/Team Management

**Gap:** No explicit User model. Only API keys for authentication.

**Current State:**
- `AgentAccess.waldur_user_uuid` tracks Waldur users
- No local user model or RBAC

**Recommendation for GTM:**
- Defer user management to Waldur (current design)
- Add `AgentAccess.role` field for future RBAC

**Post-GTM Enhancement:**

```python
# agent_registry/access/models.py

class AccessRole(models.TextChoices):
    OWNER = "owner", "Owner"           # Full control
    ADMIN = "admin", "Admin"           # Manage keys, view usage
    DEVELOPER = "developer", "Developer"  # Use API only
    VIEWER = "viewer", "Viewer"        # View-only access


class AgentAccess(SoftDeleteModel):
    # ... existing fields ...

    role = models.CharField(
        max_length=20,
        choices=AccessRole.choices,
        default=AccessRole.DEVELOPER,
        help_text="Access role (for RBAC)"
    )
```

---

### 3.2 Audit Logging

**Gap:** No audit trail for administrative actions.

**Recommendation:** Add django-auditlog or custom audit model post-GTM.

**Quick Win for GTM:**

```python
# agent_registry/core/middleware.py

import logging
import json

logger = logging.getLogger("audit")


class AuditLogMiddleware:
    """Log all write operations for audit trail."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Log write operations
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            logger.info(json.dumps({
                "event": "api_write",
                "method": request.method,
                "path": request.path,
                "user": getattr(request, "user", None),
                "api_key": request.headers.get("X-API-Key", "")[:10] + "...",
                "status": response.status_code,
                "ip": request.META.get("REMOTE_ADDR"),
            }))

        return response
```

---

### 3.3 Monitoring Dashboards

**Gap:** Prometheus metrics configured but no Grafana dashboards.

**Files to Create in gsv-gitops:**

```
charts/agent-registry/dashboards/
├── agent-registry-overview.json    # Main dashboard
├── agent-usage.json                # Usage metrics
└── agent-billing.json              # Billing metrics
```

**Key Metrics to Monitor:**

```
# Request metrics
agent_registry_requests_total{endpoint, status}
agent_registry_request_duration_seconds{endpoint}

# Agent lifecycle
agent_registry_agents_total{state}
agent_registry_state_transitions_total{from_state, to_state}

# Usage
agent_registry_api_calls_total{tenant, agent}
agent_registry_tokens_total{tenant, agent, direction}
agent_registry_quota_usage_ratio{tenant}

# Billing
agent_registry_billing_sync_total{status}
agent_registry_billing_sync_duration_seconds
```

---

## 4. Sprint Plan for GTM

### Sprint 1: Admin & Core (Week 1)

| Task | Priority | Effort | Owner |
|------|----------|--------|-------|
| Create admin.py for all apps | P0 | 4h | Backend |
| Register apps in settings.py | P0 | 1h | Backend |
| Add Django admin customizations | P0 | 4h | Backend |
| Verify migrations | P0 | 2h | Backend |
| Test admin CRUD operations | P0 | 2h | QA |

**Deliverable:** Ops team can manage tenants, agents, access keys via Django admin

### Sprint 2: E2E Testing (Week 2)

| Task | Priority | Effort | Owner |
|------|----------|--------|-------|
| Setup QA Waldur instance | P0 | 4h | DevOps |
| Create Waldur E2E test script | P0 | 8h | Backend |
| Test webhook flows | P0 | 4h | QA |
| Test billing sync | P0 | 4h | QA |
| Document E2E test procedure | P1 | 2h | Backend |

**Deliverable:** E2E test suite passing against QA Waldur

### Sprint 3: Polish & Launch Prep (Week 3)

| Task | Priority | Effort | Owner |
|------|----------|--------|-------|
| Fix widget embed code | P1 | 2h | Backend |
| Enhance health checks | P1 | 2h | Backend |
| Add audit logging | P2 | 4h | Backend |
| Create Grafana dashboards | P2 | 4h | DevOps |
| Load testing | P1 | 4h | QA |
| Security review | P1 | 4h | Security |

**Deliverable:** Production-ready Agent Registry

### Sprint 4: Soft Launch (Week 4)

| Task | Priority | Effort | Owner |
|------|----------|--------|-------|
| Deploy to production | P0 | 4h | DevOps |
| Smoke tests | P0 | 2h | QA |
| Monitor metrics | P0 | Ongoing | DevOps |
| Customer onboarding | P0 | Varies | Support |
| Bug fixes | P0 | Varies | Backend |

**Deliverable:** GTM Soft Launch

---

## 5. Post-GTM Roadmap

### Phase 2: Q1 2026

| Feature | Priority | Description |
|---------|----------|-------------|
| Custom Widget JS | High | Build embeddable React widget |
| n8n Adapter | Medium | Multi-studio support |
| User RBAC | Medium | Role-based access control |
| Agent Versioning | Medium | Version control and rollback |
| ESO + Vault | High | Secret management |

### Phase 3: Q2 2026

| Feature | Priority | Description |
|---------|----------|-------------|
| Dify Adapter | Low | Additional studio support |
| A/B Testing | Medium | Agent variant testing |
| Advanced RAG | Medium | Document upload, embedding |
| WebSocket Streaming | Low | Real-time responses |

---

## 6. Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Waldur API changes | High | Low | Version pinning, monitoring |
| Widget delays | Medium | Medium | Use existing solution for GTM |
| Billing sync failures | High | Medium | Retry logic, alerts, manual override |
| Performance issues | High | Low | Load testing, caching |
| Security vulnerabilities | Critical | Low | Security review, pen testing |

---

## 7. Success Criteria for GTM

### Must Have
- [ ] Admin can create/manage tenants via Django admin
- [ ] Admin can publish agents to Waldur marketplace
- [ ] Customers can subscribe and receive API keys
- [ ] API calls are tracked and billed correctly
- [ ] E2E test suite passes

### Should Have
- [ ] Grafana dashboards for monitoring
- [ ] Audit logging for compliance
- [ ] Load tested for 1000 concurrent users

### Nice to Have
- [ ] Custom embed widget
- [ ] Multiple studio support
- [ ] Advanced RAG features

---

*Document created: December 2, 2025*
*Next review: December 9, 2025*
