# Waldur E2E Process Flow - Provider & Customer Journey Maps

## Entity Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WALDUR PLATFORM                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐         ┌─────────────────────────────────────────┐       │
│   │   STAFF     │         │           MARKETPLACE                    │       │
│   │  (Admin)    │         │  ┌─────────────────────────────────┐    │       │
│   └─────────────┘         │  │         CATEGORIES              │    │       │
│                           │  │  (Compute, Storage, HPC, etc.)  │    │       │
│                           │  └─────────────────────────────────┘    │       │
│                           │               │                          │       │
│   ┌──────────────────┐    │  ┌───────────▼─────────────────────┐    │       │
│   │    CUSTOMER      │    │  │         OFFERINGS                │    │       │
│   │  (Organization)  │    │  │  ┌─────────────────────────┐    │    │       │
│   │                  │    │  │  │ - Name, Description     │    │    │       │
│   │  ┌────────────┐  │    │  │  │ - Plans (Pricing)       │    │    │       │
│   │  │  PROJECT   │  │    │  │  │ - Components            │    │    │       │
│   │  │            │  │    │  │  │ - Endpoints             │    │    │       │
│   │  │ ┌────────┐ │  │◄───┼──┤  │ - Terms of Service      │    │    │       │
│   │  │ │RESOURCE│ │  │    │  │  └─────────────────────────┘    │    │       │
│   │  │ └────────┘ │  │    │  └─────────────────────────────────┘    │       │
│   │  │ ┌────────┐ │  │    │               ▲                          │       │
│   │  │ │ ORDER  │ │  │    │               │                          │       │
│   │  │ └────────┘ │  │    └───────────────┼──────────────────────────┘       │
│   │  └────────────┘  │                    │                                  │
│   └──────────────────┘    ┌───────────────┴──────────────────┐              │
│                           │      SERVICE PROVIDER            │              │
│                           │      (Organization)              │              │
│                           └──────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Provider Journey Map

### Phase 1: Provider Onboarding

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROVIDER ONBOARDING FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │   REGISTER   │────▶│   VERIFY     │────▶│   SETUP      │                 │
│  │   ACCOUNT    │     │   IDENTITY   │     │   PROVIDER   │                 │
│  └──────────────┘     └──────────────┘     │   ORG        │                 │
│        │                     │              └──────────────┘                 │
│        ▼                     ▼                     │                         │
│  ┌──────────────┐     ┌──────────────┐            ▼                         │
│  │ - Username   │     │ - SSO/SAML   │     ┌──────────────┐                 │
│  │ - Email      │     │ - OAuth2     │     │ ASSIGN ROLES │                 │
│  │ - Password   │     │ - National   │     │              │                 │
│  └──────────────┘     │   ID (TARA)  │     │ - OWNER      │                 │
│                       │ - Business   │     │ - MANAGER    │                 │
│                       │   Registry   │     │ - ADMIN      │                 │
│                       └──────────────┘     └──────────────┘                 │
│                                                                              │
│  VERIFICATION STATES:                                                        │
│  ┌──────────┐   ┌───────────┐   ┌────────┐                                  │
│  │ VERIFIED │   │ ESCALATED │   │ FAILED │                                  │
│  │ (Auto)   │   │ (Manual)  │   │ (Retry)│                                  │
│  └──────────┘   └───────────┘   └────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 2: Offering Creation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      OFFERING CREATION FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ STEP 1: SELECT ORGANIZATION                                          │    │
│  │ Provider Dashboard → Marketplace → Offerings → Add                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ STEP 2: BASIC INFORMATION                                            │    │
│  │ ┌─────────────────┬──────────────────────────────────────────────┐  │    │
│  │ │ Field           │ Description                                   │  │    │
│  │ ├─────────────────┼──────────────────────────────────────────────┤  │    │
│  │ │ Name*           │ Display name in marketplace                   │  │    │
│  │ │ Description*    │ Short summary                                 │  │    │
│  │ │ Full Desc       │ Technical details (Markdown)                  │  │    │
│  │ │ Category*       │ Compute, Storage, HPC, etc.                   │  │    │
│  │ │ Type*           │ OpenStack, SLURM, Basic, Support              │  │    │
│  │ │ Terms of Service│ Legal terms URL                               │  │    │
│  │ │ Privacy Policy  │ Privacy link                                  │  │    │
│  │ │ Access URL      │ Service endpoint                              │  │    │
│  │ │ Location        │ Physical location                             │  │    │
│  │ │ Logo            │ Branding image                                │  │    │
│  │ └─────────────────┴──────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ STEP 3: INTEGRATION / CREDENTIALS (Type-specific)                    │    │
│  │                                                                       │    │
│  │  OpenStack:                    SLURM:                                 │    │
│  │  ├─ API URL (Keystone)         ├─ SSH Endpoints                      │    │
│  │  ├─ Domain Name                ├─ Management Console                 │    │
│  │  ├─ Username/Password          ├─ Batch System Config                │    │
│  │  ├─ Tenant Name                └─ Account Configuration              │    │
│  │  └─ External Network ID                                               │    │
│  │                                                                       │    │
│  │  [SYNCHRONIZE] → Verify Connection                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ STEP 4: ACCOUNTING COMPONENTS                                        │    │
│  │                                                                       │    │
│  │  Component Types:              Billing Types:                         │    │
│  │  ├─ CPU Hours                  ├─ Usage-based                        │    │
│  │  ├─ GPU Hours                  ├─ Limit-based                        │    │
│  │  ├─ RAM (GB)                   ├─ Fixed price                        │    │
│  │  ├─ Storage (GB)               ├─ One-time                           │    │
│  │  └─ Network (GB)               └─ One-time on plan switch            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ STEP 5: CREATE PLANS                                                 │    │
│  │                                                                       │    │
│  │  Plan Configuration:                                                  │    │
│  │  ├─ Plan Name                                                         │    │
│  │  ├─ Accounting Period (Monthly, Hourly, etc.)                        │    │
│  │  ├─ Component Prices                                                  │    │
│  │  ├─ Organization Group Restrictions (optional)                        │    │
│  │  └─ Future Price (for existing resources)                            │    │
│  │                                                                       │    │
│  │  Example Plans:                                                       │    │
│  │  ┌─────────────┬──────────────┬───────────────┐                      │    │
│  │  │ Basic       │ Professional │ Enterprise    │                      │    │
│  │  │ €0.05/CPU-h │ €0.04/CPU-h  │ Custom        │                      │    │
│  │  │ €0.01/GB    │ €0.008/GB    │ Volume disc.  │                      │    │
│  │  └─────────────┴──────────────┴───────────────┘                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ STEP 6: ENDPOINTS & GETTING STARTED                                  │    │
│  │                                                                       │    │
│  │  Endpoints:                                                           │    │
│  │  ├─ Management Console URL                                            │    │
│  │  ├─ SSH Login Nodes                                                   │    │
│  │  ├─ API Endpoints                                                     │    │
│  │  └─ Documentation Links                                               │    │
│  │                                                                       │    │
│  │  Getting Started Template Variables:                                  │    │
│  │  ├─ {resource_name}                                                   │    │
│  │  ├─ {resource_username}                                               │    │
│  │  ├─ {backend_id}                                                      │    │
│  │  ├─ {backend_metadata_key}                                            │    │
│  │  └─ {options_key}                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ STEP 7: ACTIVATE OFFERING                                            │    │
│  │                                                                       │    │
│  │  Offering States:                                                     │    │
│  │  ┌─────────┐   ┌────────┐   ┌──────────┐   ┌──────────┐             │    │
│  │  │  DRAFT  │──▶│ ACTIVE │──▶│  PAUSED  │──▶│ ARCHIVED │             │    │
│  │  └─────────┘   └────────┘   └──────────┘   └──────────┘             │    │
│  │       │             │             │                                   │    │
│  │       │             │             │                                   │    │
│  │  Not visible   Visible in    Hidden for      Permanently             │    │
│  │  in marketplace marketplace  maintenance     removed                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 3: Order Management (Provider Side)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROVIDER ORDER MANAGEMENT FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                          ┌─────────────────┐                                │
│                          │  ORDER RECEIVED │                                │
│                          │ (pending-provider)                               │
│                          └────────┬────────┘                                │
│                                   │                                          │
│                    ┌──────────────┼──────────────┐                          │
│                    ▼              ▼              ▼                          │
│            ┌─────────────┐ ┌───────────┐ ┌─────────────┐                    │
│            │   APPROVE   │ │  REJECT   │ │   WAIT FOR  │                    │
│            │             │ │           │ │  CONSUMER   │                    │
│            └──────┬──────┘ └─────┬─────┘ └──────┬──────┘                    │
│                   │              │              │                            │
│                   ▼              ▼              ▼                            │
│            ┌─────────────┐ ┌───────────┐ ┌─────────────┐                    │
│            │  EXECUTING  │ │ REJECTED  │ │  CANCELED   │                    │
│            └──────┬──────┘ └───────────┘ │ (by consumer)│                   │
│                   │                       └─────────────┘                    │
│         ┌────────┴────────┐                                                  │
│         ▼                 ▼                                                  │
│   ┌───────────┐     ┌───────────┐                                           │
│   │   DONE    │     │   ERRED   │                                           │
│   │ (success) │     │  (failed) │                                           │
│   └───────────┘     └───────────┘                                           │
│                                                                              │
│  Provider Actions:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ marketplace_orders_approve_by_provider(uuid, client)                 │    │
│  │ marketplace_orders_reject_by_provider(uuid, client)                  │    │
│  │ marketplace_resources_set_backend_id(uuid, backend_id)               │    │
│  │ marketplace_resources_report_usage(uuid, usage_data)                 │    │
│  │ marketplace_resources_create_user(uuid, user_data)                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Customer Journey Map

### Phase 1: Customer Onboarding

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CUSTOMER ONBOARDING FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ STEP 1: USER REGISTRATION                                             │   │
│  │                                                                        │   │
│  │  Authentication Methods:                                               │   │
│  │  ├─ Local Account (Username/Password)                                  │   │
│  │  ├─ SSO/SAML (Enterprise)                                              │   │
│  │  ├─ OAuth2 (Google, GitHub, etc.)                                      │   │
│  │  ├─ National ID (TARA - Estonia)                                       │   │
│  │  └─ Federated Identity (eduGAIN)                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ STEP 2: ORGANIZATION CREATION                                         │   │
│  │                                                                        │   │
│  │  Required Fields:                  Optional Fields:                    │   │
│  │  ├─ Organization Name              ├─ Abbreviation                     │   │
│  │  ├─ Registration Code              ├─ Contact Email                    │   │
│  │  ├─ Country                        ├─ Phone                            │   │
│  │  └─ Address                        ├─ Homepage                         │   │
│  │                                    └─ Logo                             │   │
│  │                                                                        │   │
│  │  Automatic Validation (if configured):                                 │   │
│  │  ┌────────────┐   ┌──────────────┐   ┌───────────────┐                │   │
│  │  │ Check User │──▶│ Query Biz    │──▶│ Verify User   │                │   │
│  │  │ Identity   │   │ Registry     │   │ Authorization │                │   │
│  │  └────────────┘   └──────────────┘   └───────┬───────┘                │   │
│  │                                              │                         │   │
│  │            ┌─────────────────────────────────┼──────────────────────┐  │   │
│  │            ▼                                 ▼                      ▼  │   │
│  │     ┌──────────┐                      ┌───────────┐          ┌───────┐ │   │
│  │     │ VERIFIED │                      │ ESCALATED │          │FAILED │ │   │
│  │     │ (Auto-   │                      │ (Manual   │          │(Retry)│ │   │
│  │     │ approve) │                      │  review)  │          │       │ │   │
│  │     └──────────┘                      └───────────┘          └───────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ STEP 3: ASSIGN ROLES                                                  │   │
│  │                                                                        │   │
│  │  Organization Roles:              Project Roles:                       │   │
│  │  ├─ CUSTOMER.OWNER               ├─ PROJECT.ADMIN                     │   │
│  │  │  (Full control)               │  (Full project control)            │   │
│  │  ├─ CUSTOMER.MANAGER             ├─ PROJECT.MANAGER                   │   │
│  │  │  (Service management)         │  (Resource requests)               │   │
│  │  └─ CUSTOMER.SUPPORT             └─ PROJECT.MEMBER                    │   │
│  │     (Support access)                (Basic access)                     │   │
│  │                                                                        │   │
│  │  Role Features:                                                        │   │
│  │  ├─ Invitation-based assignment                                        │   │
│  │  ├─ Temporary roles (expiration date)                                  │   │
│  │  └─ Audit logging for all changes                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 2: Project Creation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PROJECT CREATION FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ PROJECT CONFIGURATION                                                 │   │
│  │                                                                        │   │
│  │  ┌──────────────────┬───────────────────────────────────────────────┐ │   │
│  │  │ Field            │ Description                                    │ │   │
│  │  ├──────────────────┼───────────────────────────────────────────────┤ │   │
│  │  │ Name*            │ Project identifier                            │ │   │
│  │  │ Description      │ Purpose and scope                             │ │   │
│  │  │ Backend ID       │ External system reference                     │ │   │
│  │  │ End Date         │ Project expiration                            │ │   │
│  │  │ OECD FOS Code    │ Research classification                       │ │   │
│  │  │ Customer*        │ Parent organization                           │ │   │
│  │  └──────────────────┴───────────────────────────────────────────────┘ │   │
│  │                                                                        │   │
│  │  Project becomes ACTIVE immediately upon creation                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ ADD TEAM MEMBERS                                                      │   │
│  │                                                                        │   │
│  │  Methods:                                                              │   │
│  │  ├─ Invite by Email                                                    │   │
│  │  ├─ Add Existing User                                                  │   │
│  │  └─ Bulk Import                                                        │   │
│  │                                                                        │   │
│  │  Role Assignment:                                                      │   │
│  │  ├─ System Administrator                                               │   │
│  │  ├─ Project Manager                                                    │   │
│  │  └─ Member                                                             │   │
│  │                                                                        │   │
│  │  Options:                                                              │   │
│  │  ├─ Expiration Date                                                    │   │
│  │  └─ Notifications                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 3: Resource Ordering

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      RESOURCE ORDERING FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ STEP 1: BROWSE MARKETPLACE                                            │   │
│  │                                                                        │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │   │
│  │  │                      MARKETPLACE                                 │  │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │   │
│  │  │  │ Compute │ │ Storage │ │   HPC   │ │Databases│ │  Other  │   │  │   │
│  │  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │  │   │
│  │  │       │           │           │           │           │        │  │   │
│  │  │       ▼           ▼           ▼           ▼           ▼        │  │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │  │   │
│  │  │  │  Offering Cards:                                        │   │  │   │
│  │  │  │  ├─ Logo & Name                                         │   │  │   │
│  │  │  │  ├─ Provider                                            │   │  │   │
│  │  │  │  ├─ Short Description                                   │   │  │   │
│  │  │  │  ├─ Starting Price                                      │   │  │   │
│  │  │  │  └─ [View Details] [Order Now]                          │   │  │   │
│  │  │  └─────────────────────────────────────────────────────────┘   │  │   │
│  │  └─────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ STEP 2: CONFIGURE ORDER                                               │   │
│  │                                                                        │   │
│  │  ┌───────────────────────────────────────────────────────────────┐    │   │
│  │  │ Order Configuration Form                                       │    │   │
│  │  │                                                                 │    │   │
│  │  │  Project*:        [Select Project ▼]                           │    │   │
│  │  │                                                                 │    │   │
│  │  │  Plan*:           ○ Basic  ○ Professional  ○ Enterprise        │    │   │
│  │  │                                                                 │    │   │
│  │  │  Limits:                                                        │    │   │
│  │  │  ┌──────────────┬────────────┬──────────────┐                  │    │   │
│  │  │  │ Component    │ Value      │ Price        │                  │    │   │
│  │  │  ├──────────────┼────────────┼──────────────┤                  │    │   │
│  │  │  │ CPU Hours    │ [1000    ] │ €50.00       │                  │    │   │
│  │  │  │ RAM (GB)     │ [256     ] │ €25.60       │                  │    │   │
│  │  │  │ Storage (GB) │ [500     ] │ €5.00        │                  │    │   │
│  │  │  ├──────────────┼────────────┼──────────────┤                  │    │   │
│  │  │  │ TOTAL        │            │ €80.60/month │                  │    │   │
│  │  │  └──────────────┴────────────┴──────────────┘                  │    │   │
│  │  │                                                                 │    │   │
│  │  │  Attributes:     (Offering-specific)                           │    │   │
│  │  │  ├─ Instance Type: [Standard ▼]                                │    │   │
│  │  │  └─ Region: [EU-West ▼]                                        │    │   │
│  │  │                                                                 │    │   │
│  │  │  ☑ I accept the Terms of Service                               │    │   │
│  │  │                                                                 │    │   │
│  │  │                    [Submit Order]                               │    │   │
│  │  └───────────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ STEP 3: ORDER LIFECYCLE                                               │   │
│  │                                                                        │   │
│  │     ┌─────────────────┐                                               │   │
│  │     │ ORDER CREATED   │ ◄─── Order Type: CREATE                       │   │
│  │     │ (pending-*)     │                                               │   │
│  │     └────────┬────────┘                                               │   │
│  │              │                                                         │   │
│  │     ┌────────┴────────┐                                               │   │
│  │     ▼                 ▼                                               │   │
│  │ ┌─────────────┐  ┌─────────────┐                                     │   │
│  │ │ pending-    │  │ pending-    │                                     │   │
│  │ │ consumer    │  │ provider    │                                     │   │
│  │ │             │  │             │                                     │   │
│  │ │ (Awaiting   │  │ (Awaiting   │                                     │   │
│  │ │  consumer   │  │  provider   │                                     │   │
│  │ │  action)    │  │  approval)  │                                     │   │
│  │ └──────┬──────┘  └──────┬──────┘                                     │   │
│  │        │                │                                             │   │
│  │        │   ┌────────────┼────────────┐                               │   │
│  │        │   │            │            │                               │   │
│  │        ▼   ▼            ▼            ▼                               │   │
│  │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                    │   │
│  │   │  EXECUTING  │ │  REJECTED   │ │  CANCELED   │                    │   │
│  │   └──────┬──────┘ └─────────────┘ └─────────────┘                    │   │
│  │          │                                                            │   │
│  │     ┌────┴────┐                                                       │   │
│  │     ▼         ▼                                                       │   │
│  │ ┌───────┐ ┌───────┐                                                   │   │
│  │ │ DONE  │ │ ERRED │                                                   │   │
│  │ └───────┘ └───────┘                                                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 4: Resource Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      RESOURCE MANAGEMENT FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ RESOURCE STATES                                                       │   │
│  │                                                                        │   │
│  │   ┌──────────┐   ┌────────┐   ┌───────────┐   ┌────────────┐         │   │
│  │   │ CREATING │──▶│   OK   │──▶│ UPDATING  │──▶│TERMINATING │         │   │
│  │   └──────────┘   └────────┘   └───────────┘   └────────────┘         │   │
│  │        │              │             │               │                 │   │
│  │        ▼              │             │               ▼                 │   │
│  │   ┌──────────┐        │             │         ┌──────────┐           │   │
│  │   │ REJECTED │        │             │         │TERMINATED│           │   │
│  │   └──────────┘        │             │         └──────────┘           │   │
│  │                       │             │                                 │   │
│  │                       ▼             ▼                                 │   │
│  │                  ┌─────────┐                                          │   │
│  │                  │  ERRED  │                                          │   │
│  │                  └─────────┘                                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ RESOURCE OPERATIONS                                                   │   │
│  │                                                                        │   │
│  │  Order Types:                                                          │   │
│  │  ├─ CREATE     → Create new allocation                                 │   │
│  │  ├─ UPDATE     → Modify limits/configuration                          │   │
│  │  └─ TERMINATE  → Remove allocation                                    │   │
│  │                                                                        │   │
│  │  Available Actions:                                                    │   │
│  │  ┌────────────────────────────────────────────────────────────────┐   │   │
│  │  │ POST /api/marketplace-resources/{uuid}/update_limits/          │   │   │
│  │  │   → Modify resource limits (creates UPDATE order)              │   │   │
│  │  │                                                                 │   │   │
│  │  │ POST /api/marketplace-resources/{uuid}/terminate/              │   │   │
│  │  │   → Terminate resource (creates TERMINATE order)               │   │   │
│  │  │                                                                 │   │   │
│  │  │ GET /api/marketplace-component-usages/                         │   │   │
│  │  │   → View usage history and costs                               │   │   │
│  │  └────────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ RESOURCE DASHBOARD                                                    │   │
│  │                                                                        │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │   │
│  │  │ Resource: HPC Cluster - Project Alpha                           │  │   │
│  │  │ Status: ● OK                                                    │  │   │
│  │  │                                                                  │  │   │
│  │  │ Limits:                    Usage (Current Period):              │  │   │
│  │  │ ├─ CPU: 1000 hours        ├─ CPU: 456 hours (45.6%)            │  │   │
│  │  │ ├─ RAM: 256 GB            ├─ RAM: 128 GB (50%)                 │  │   │
│  │  │ └─ Storage: 500 GB        └─ Storage: 234 GB (46.8%)           │  │   │
│  │  │                                                                  │  │   │
│  │  │ Endpoints:                                                       │  │   │
│  │  │ ├─ SSH: ssh.hpc.provider.com                                    │  │   │
│  │  │ └─ Dashboard: https://dashboard.provider.com                    │  │   │
│  │  │                                                                  │  │   │
│  │  │ [Update Limits] [View Usage] [Terminate]                        │  │   │
│  │  └─────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Customization Options

### 1. Offering Customization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      OFFERING CUSTOMIZATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ CATEGORY MANAGEMENT                                                  │    │
│  │ ├─ Create custom categories                                          │    │
│  │ ├─ Set category icons and descriptions                               │    │
│  │ └─ Define category-specific attributes                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ OFFERING TYPES                                                       │    │
│  │ ├─ OpenStack Tenant     - Full OpenStack integration                 │    │
│  │ ├─ SLURM                - HPC batch system                           │    │
│  │ ├─ VMware               - VMware vSphere                             │    │
│  │ ├─ Azure                - Microsoft Azure                            │    │
│  │ ├─ Basic                - Manual provisioning                        │    │
│  │ ├─ Support              - Support services                           │    │
│  │ ├─ Custom Scripts       - Webhook-based automation                   │    │
│  │ └─ Remote Waldur        - Federation with other Waldur instances     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ BILLING MODELS                                                       │    │
│  │ ├─ Usage-based          - Pay for actual consumption                 │    │
│  │ ├─ Limit-based          - Pay for allocated limits                   │    │
│  │ ├─ Fixed price          - Flat rate per period                       │    │
│  │ ├─ One-time             - Single payment                             │    │
│  │ └─ One-time on switch   - Payment when changing plans               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ACCESS CONTROL                                                       │    │
│  │ ├─ Plan restrictions by organization groups                          │    │
│  │ ├─ Offering visibility (public/private)                              │    │
│  │ └─ Approval workflows (auto/manual)                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Workflow Customization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      WORKFLOW CUSTOMIZATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ APPROVAL WORKFLOWS                                                   │    │
│  │                                                                       │    │
│  │  Configuration Options:                                               │    │
│  │  ├─ Auto-approve for verified organizations                          │    │
│  │  ├─ Manager approval required                                         │    │
│  │  ├─ Provider approval required                                        │    │
│  │  └─ Multi-stage approval (consumer → manager → provider)             │    │
│  │                                                                       │    │
│  │  Per-Offering Settings:                                               │    │
│  │  ├─ offering.auto_approve_in_service_provider_projects = true/false  │    │
│  │  └─ offering.secret_options.auto_approve = true/false                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ CUSTOM SCRIPTS (Lifecycle Hooks)                                     │    │
│  │                                                                       │    │
│  │  Events:                     Script Environment:                      │    │
│  │  ├─ on_create               ├─ Docker container (compose)            │    │
│  │  ├─ on_update               ├─ Kubernetes Job (Helm)                 │    │
│  │  ├─ on_terminate            └─ Injected variables:                   │    │
│  │  └─ on_usage_report             ├─ RESOURCE_UUID                     │    │
│  │                                  ├─ RESOURCE_NAME                     │    │
│  │                                  ├─ PROJECT_UUID                      │    │
│  │                                  ├─ CUSTOMER_UUID                     │    │
│  │                                  └─ ORDER_ATTRIBUTES                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ONBOARDING CUSTOMIZATION                                             │    │
│  │                                                                       │    │
│  │  ├─ Business registry integration (country-specific)                 │    │
│  │  ├─ Custom validation backends                                        │    │
│  │  ├─ Required user profile fields                                      │    │
│  │  ├─ Project metadata requirements                                     │    │
│  │  │    ├─ OECD FOS codes                                              │    │
│  │  │    ├─ Backend IDs                                                  │    │
│  │  │    └─ Custom attributes                                            │    │
│  │  └─ Organization group assignments                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. UI/Branding Customization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      UI/BRANDING CUSTOMIZATION                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ HOMEPORT (Self-Service Portal) CUSTOMIZATION                         │    │
│  │                                                                       │    │
│  │  Branding:                     Features:                              │    │
│  │  ├─ Site title                 ├─ Enable/disable sections            │    │
│  │  ├─ Logo                       ├─ Custom menu items                  │    │
│  │  ├─ Favicon                    ├─ Footer links                       │    │
│  │  ├─ Color scheme               ├─ Help text overrides               │    │
│  │  └─ Terms & policies           └─ Custom CSS                         │    │
│  │                                                                       │    │
│  │  Environment Variables:                                               │    │
│  │  ├─ WALDUR_HOMEPORT_TITLE                                            │    │
│  │  ├─ WALDUR_HOMEPORT_LOGO_URL                                         │    │
│  │  ├─ WALDUR_HOMEPORT_SHORT_PAGE_TITLE                                 │    │
│  │  └─ WALDUR_HOMEPORT_FEATURES                                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ GETTING STARTED TEMPLATES                                            │    │
│  │                                                                       │    │
│  │  Template Variables:                                                  │    │
│  │  ├─ {resource_name}         - Resource display name                  │    │
│  │  ├─ {resource_username}     - Associated username                    │    │
│  │  ├─ {backend_id}            - Backend identifier                     │    │
│  │  ├─ {backend_metadata_key}  - Dynamic metadata                       │    │
│  │  └─ {options_key}           - Custom option values                   │    │
│  │                                                                       │    │
│  │  Example Template:                                                    │    │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │    │
│  │  │ # Welcome to {resource_name}                                    │ │    │
│  │  │                                                                  │ │    │
│  │  │ Your allocation is ready! Connect using:                        │ │    │
│  │  │ ```                                                              │ │    │
│  │  │ ssh {resource_username}@login.cluster.com                       │ │    │
│  │  │ ```                                                              │ │    │
│  │  │ Backend ID: {backend_id}                                        │ │    │
│  │  └─────────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete API Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API ENDPOINT SUMMARY                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CUSTOMERS (Organizations)                                                   │
│  ├─ GET    /api/customers/                    List organizations            │
│  ├─ POST   /api/customers/                    Create organization           │
│  └─ GET    /api/customers/{uuid}/             Get organization details      │
│                                                                              │
│  PROJECTS                                                                    │
│  ├─ GET    /api/projects/                     List projects                 │
│  ├─ POST   /api/projects/                     Create project                │
│  ├─ PATCH  /api/projects/{uuid}/              Update project                │
│  └─ DELETE /api/projects/{uuid}/              Delete project                │
│                                                                              │
│  MARKETPLACE - OFFERINGS                                                     │
│  ├─ GET    /api/marketplace-public-offerings/ Browse offerings              │
│  ├─ GET    /api/marketplace-public-plans/     View plans                    │
│  └─ POST   /api/marketplace-offerings/        Create offering (provider)    │
│                                                                              │
│  MARKETPLACE - ORDERS                                                        │
│  ├─ POST   /api/marketplace-orders/           Create order                  │
│  ├─ GET    /api/marketplace-orders/{uuid}/    Get order status              │
│  ├─ POST   /api/marketplace-orders/{uuid}/approve_by_provider/  Approve     │
│  ├─ POST   /api/marketplace-orders/{uuid}/reject_by_provider/   Reject      │
│  └─ POST   /api/marketplace-orders/{uuid}/cancel/               Cancel      │
│                                                                              │
│  MARKETPLACE - RESOURCES                                                     │
│  ├─ GET    /api/marketplace-resources/                    List resources    │
│  ├─ GET    /api/marketplace-resources/{uuid}/             Get resource      │
│  ├─ POST   /api/marketplace-resources/{uuid}/update_limits/   Update        │
│  ├─ POST   /api/marketplace-resources/{uuid}/terminate/       Terminate     │
│  └─ POST   /api/marketplace-resources/{uuid}/set_backend_id/  Set backend   │
│                                                                              │
│  USAGE & REPORTING                                                           │
│  ├─ GET    /api/marketplace-component-usages/ View usage data               │
│  └─ POST   /api/marketplace-resources/{uuid}/report_usage/  Report usage    │
│                                                                              │
│  PERMISSIONS                                                                 │
│  ├─ GET    /api/user-permissions/             List permissions              │
│  ├─ POST   /api/user-permissions/             Add permission                │
│  └─ POST   /api/user-permissions/delete_user/ Remove permission             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## State Transition Diagrams

### Order States

```
                    ┌─────────────────┐
                    │     CREATED     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
      │  pending-   │ │  pending-   │ │  executing  │
      │  consumer   │ │  provider   │ │             │
      └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
             │               │               │
             │    ┌──────────┼──────────┐    │
             │    ▼          ▼          ▼    │
             │ ┌────────┐ ┌────────┐ ┌────────┐
             │ │rejected│ │canceled│ │        │
             │ └────────┘ └────────┘ │        │
             │                       │        │
             └───────────────────────┼────────┘
                                     │
                          ┌──────────┴──────────┐
                          ▼                     ▼
                    ┌──────────┐          ┌──────────┐
                    │   done   │          │  erred   │
                    └──────────┘          └──────────┘
```

### Resource States

```
      ┌──────────┐
      │ CREATING │
      └────┬─────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌────────┐  ┌────────┐
│   OK   │  │REJECTED│
└───┬────┘  └────────┘
    │
    ├───────────────┐
    ▼               ▼
┌────────┐    ┌───────────┐
│UPDATING│    │TERMINATING│
└───┬────┘    └─────┬─────┘
    │               │
    │          ┌────┴────┐
    │          ▼         ▼
    │    ┌──────────┐ ┌─────┐
    │    │TERMINATED│ │ERRED│
    │    └──────────┘ └─────┘
    │
    └──────────▶ OK (loop back)
```

---

## Sources

- [Waldur Official Documentation](https://docs.waldur.com/latest/)
- [Waldur Platform Homepage](https://waldur.com/)
- [Offerings Guide](https://docs.waldur.com/latest/user-guide/service-provider-organization/adding-an-offering/)
- [Allocation Lifecycle Management](https://docs.waldur.com/latest/integrator-guide/SDK-Examples/allocation-management-sp/)
- [Customer Onboarding Validation](https://docs.waldur.com/latest/developer-guide/customer-onboarding-automatic-validation/)
- [Roles and Permissions](https://docs.waldur.com/latest/about/terminology/roles_and_permissions/)
- [REST API Reference](https://docs.waldur.com/latest/integrator-guide/APIs/api/)
- [User Role Management](https://docs.waldur.com/latest/user-guide/staff-users/user_role_management/)

---

*Document generated: December 2024*
