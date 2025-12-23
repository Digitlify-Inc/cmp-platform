# GSV Platform - Organization Self-Creation Solution

**Date:** December 12, 2024
**Status:** IMPLEMENTED
**Priority:** Critical - Blocks User Onboarding

## Implementation Summary

The universal auto-approval backend has been implemented. Users can now create organizations through the onboarding flow without staff intervention.

### Files Created/Modified

| File | Change |
|------|--------|
| `cmp-backend/src/waldur_core/onboarding/backends/universal.py` | NEW - Universal auto-approve backend |
| `cmp-backend/src/waldur_core/onboarding/backends/__init__.py` | Added import for UniversalAutoApproveBackend |
| `cmp-backend/src/waldur_core/onboarding/enums.py` | Added UNIVERSAL_AUTO_APPROVE validation method |
| `cmp-backend/src/waldur_core/server/constance_settings.py` | Added ONBOARDING_UNIVERSAL_AUTO_APPROVE and ONBOARDING_UNIVERSAL_COUNTRIES settings |
| `cmp-backend/src/waldur_core/onboarding/migrations/0006_enable_auto_approve.py` | NEW - Migration to enable auto-approve by default |

### How to Enable/Configure

**Option 1: Via Django Admin (Recommended for quick testing)**
1. Go to `/api/admin/constance/config/`
2. Find "Onboarding settings" section
3. Set `ONBOARDING_UNIVERSAL_AUTO_APPROVE` to `True`
4. Optionally set `ONBOARDING_UNIVERSAL_COUNTRIES` to limit which countries can use auto-approve (default is `*` for all)

**Option 2: Via Database Migration (Automatic for new deployments)**
- The migration `0006_enable_auto_approve` automatically enables auto-approve for new deployments
- Run `python manage.py migrate onboarding` to apply

**Option 3: Via Management Command**
```bash
python manage.py constance set ONBOARDING_UNIVERSAL_AUTO_APPROVE True
```

### User Flow After Implementation

1. User logs in via Keycloak SSO
2. User navigates to `/organizations/create/` (or clicks "Create Organization" button)
3. User fills in organization details (name, country, etc.)
4. System auto-approves the verification (no external registry check needed)
5. User calls `create_customer` endpoint
6. Organization is created, user becomes owner
7. User can now create projects and order resources

---

## Problem Statement

When a user self-registers via Keycloak SSO, they land in Waldur CMP but **cannot create an organization**. Without an organization, users cannot:
- Create projects
- Order marketplace resources
- Access any meaningful functionality

The standard `/api/customers/` endpoint requires `is_staff=True` (hardcoded in `cmp-backend/src/waldur_core/structure/views.py:286-288`).

## Root Cause Analysis

### Code Analysis

**Direct Customer Creation API** (`CustomerViewSet.perform_create`):
```python
# waldur_core/structure/views.py:286-288
def perform_create(self, serializer):
    if not self.request.user.is_staff:
        raise PermissionDenied()
    # ... creates customer
```

This is **hardcoded** and **not configurable** - it's a deliberate design choice by Waldur to require admin intervention for organization creation.

### Waldur's Design Philosophy

Waldur is designed for environments where:
1. Organizations represent legal entities (universities, companies)
2. Organization creation should be controlled/approved
3. Resources have real costs that need proper authorization

### Existing Onboarding Flow

Waldur has an **onboarding verification system** (`waldur_core/onboarding/`) that:
1. Allows authenticated users to start verification
2. Validates company identity via external registries (Estonia, Austria, Sweden)
3. Creates customer after successful verification
4. **Bypasses the staff check** via `create_customer_if_verified()`

**The catch:** This requires either:
- Automatic validation via supported country registries
- Manual approval by staff for unsupported countries/edge cases

## Solution Options

### Option 1: Enable and Configure Onboarding Flow (Recommended for Production)

**Approach:** Use Waldur's built-in onboarding verification system

**Pros:**
- Uses existing, tested code path
- Maintains proper audit trail
- Supports KYB (Know Your Business) requirements
- No code modifications needed

**Cons:**
- Requires configuration
- May need manual approval for some cases
- More steps for end users

**Implementation:**

1. **Enable the feature flag:**
```yaml
# In Waldur configuration
FEATURES:
  marketplace:
    show_experimental_ui_components: true
```

2. **Configure onboarding for your use case:**

For **automatic approval** (development/testing):
```python
# Create a "universal" validation backend that auto-approves
# or configure manual validation with auto-approval
```

For **manual approval flow:**
- Staff reviews requests in admin panel
- Approve creates the organization
- User is notified

3. **Add "US" or your default country to supported countries:**
```python
# waldur_core/onboarding/backends/universal.py (new file)
class UniversalValidator:
    """Auto-approve validator for regions without official registries."""

    def validate(self, legal_person_identifier, person_identifier, **kwargs):
        # Auto-approve all requests
        return {
            "status": "verified",
            "company_data": {...}
        }
```

---

### Option 2: Create Custom "Allow Self-Service" Setting (Backend Modification)

**Approach:** Add a configuration option to allow any authenticated user to create organizations

**Pros:**
- Simple, direct solution
- Easy to understand
- Can be toggled per environment

**Cons:**
- Requires backend code change
- Needs to be maintained through Waldur upgrades
- Less audit trail than onboarding flow

**Implementation:**

```python
# waldur_core/structure/views.py

def perform_create(self, serializer):
    # Check new setting
    allow_self_service = django_settings.WALDUR_CORE.get(
        'ALLOW_USER_ORGANIZATION_CREATION', False
    )

    if not (self.request.user.is_staff or allow_self_service):
        raise PermissionDenied()

    customer = serializer.save()
    # ... rest of the code
```

```yaml
# Configuration
WALDUR_CORE:
  ALLOW_USER_ORGANIZATION_CREATION: true
```

---

### Option 3: Auto-Create Organization on First Login (Handler-Based)

**Approach:** Automatically create a personal organization when a user first logs in

**Pros:**
- Zero friction for users
- Works with existing SSO
- Common pattern (GitHub, GitLab, etc.)

**Cons:**
- Requires backend modification
- May create many single-user orgs
- Naming conventions needed

**Implementation:**

```python
# waldur_core/structure/handlers.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from waldur_core.structure.models import Customer
from waldur_core.permissions.fixtures import CustomerRole

User = get_user_model()

@receiver(post_save, sender=User)
def create_personal_organization(sender, instance, created, **kwargs):
    """Create personal organization for new users."""
    if not created:
        return

    # Check if feature is enabled
    if not django_settings.WALDUR_CORE.get('AUTO_CREATE_PERSONAL_ORG', False):
        return

    # Check if user already has an organization
    if instance.customer_permissions.exists():
        return

    # Create personal organization
    customer = Customer.objects.create(
        name=f"{instance.full_name or instance.username}'s Organization",
        # Mark as personal org
        # Could add a field like `is_personal_org = True`
    )

    # Add user as owner
    customer.add_user(instance, CustomerRole.OWNER)
```

---

### Option 4: Invitation-Based Flow (Existing Feature)

**Approach:** Use Waldur's existing invitation system

**Pros:**
- No code changes
- Already implemented
- Proper permission model

**Cons:**
- Requires someone with org to invite
- Chicken-and-egg problem for first user
- Not self-service

**How it works:**
1. Admin creates initial organization
2. Admin invites users to create organizations (if they have `CREATE_CUSTOMER_PERMISSION`)
3. Invited users can create their own organizations

---

### Option 5: Webhook-Triggered Organization Creation

**Approach:** Create organization when Waldur receives a webhook from Keycloak/IDP

**Pros:**
- Triggered at authentication time
- Can include IDP attributes (org name, etc.)
- No UI changes needed

**Cons:**
- Requires webhook handler development
- IDP must send appropriate claims/attributes
- May need Keycloak customization

**Implementation:**

Configure Keycloak to call webhook on user creation:
```
POST /api/webhooks/keycloak/user-created/
{
  "user_id": "...",
  "email": "...",
  "organization_name": "..."  // From IDP attribute
}
```

Handler creates org and assigns user as owner.

---

## Recommendation

### For Immediate Development/Testing: Option 2 or 3

**Option 2 (Setting)** is the quickest path:

1. Add configuration setting to allow self-service organization creation
2. Enable only in development/testing environments
3. Keep disabled in production (use Option 1 for production)

### For Production: Option 1 (Onboarding Flow)

The onboarding flow is the proper path because:
1. It provides audit trail
2. Supports KYB compliance if needed
3. Already built and tested
4. Can be configured for auto-approval if needed

**Steps for Production:**

1. Enable `show_experimental_ui_components` feature flag
2. Create a "Universal" onboarding checklist for countries without registries
3. Configure auto-approval for GSV use case OR
4. Set up staff notification for manual approval (takes <1 min per request)

---

## Implementation Plan

### Phase 1: Quick Fix for Development (1-2 hours)

1. Add `ALLOW_USER_ORGANIZATION_CREATION` setting to backend
2. Enable in dev environment
3. Test organization creation flow

### Phase 2: Production-Ready Solution (2-3 days)

1. Configure onboarding verification system
2. Create universal validation backend (auto-approve)
3. Set up onboarding checklist for GSV
4. Test end-to-end flow
5. Document admin approval process (if needed)

### Phase 3: Long-Term (Future)

1. Consider auto-create personal org on first login
2. Add organization templates
3. Integrate with SSO attributes for org info

---

## Configuration Reference

### Enable Onboarding UI (Frontend)

```yaml
# cmp-frontend config or environment
FEATURES__MARKETPLACE__SHOW_EXPERIMENTAL_UI_COMPONENTS: "true"
```

### Backend Settings

```python
# waldur_core/server/base_settings.py or constance

WALDUR_CORE = {
    # Option 2: Allow any user to create orgs
    'ALLOW_USER_ORGANIZATION_CREATION': False,  # Set True to enable

    # Option 3: Auto-create personal org
    'AUTO_CREATE_PERSONAL_ORG': False,  # Set True to enable
}

# Onboarding settings
WALDUR_ONBOARDING = {
    'AUTO_APPROVE_VERIFICATIONS': True,  # Auto-approve without staff review
    'VERIFICATION_EXPIRY_HOURS': 24,
}
```

---

## Appendix: Code Locations

| Component | File |
|-----------|------|
| Customer ViewSet | `cmp-backend/src/waldur_core/structure/views.py:130` |
| Onboarding Views | `cmp-backend/src/waldur_core/onboarding/views.py` |
| Onboarding Models | `cmp-backend/src/waldur_core/onboarding/models.py` |
| Validation Backends | `cmp-backend/src/waldur_core/onboarding/backends/` |
| Feature Flags | `cmp-frontend/src/FeaturesEnums.ts` |
| Org Create Page | `cmp-frontend/src/user/organization-create/` |
