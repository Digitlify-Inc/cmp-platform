# GSV Platform Marketplace Operator Guide

## Introduction

Guide for marketplace operators managing service offerings, tenants, pricing, and operations.

---

## Operator Access

| Environment | URL |
|-------------|-----|
| Development | https://portal.dev.gsv.dev/admin/ |
| QA | https://marketplace.qa.digitlify.com/admin/ |
| Production | https://portal.digitlify.com/admin/ |

### Operator Roles

| Role | Permissions |
|------|-------------|
| Staff | Full admin access |
| Support | View all, manage tickets |
| Finance | Billing and invoicing |
| Catalog Manager | Manage offerings |

---

## Key Concepts

| Term | Definition |
|------|------------|
| Customer | Top-level organization (tenant) |
| Project | Logical grouping within a customer |
| Offering | A service in the marketplace |
| Plan | Configuration/pricing tier |
| Order | Request to provision a resource |
| Resource | Instance of an offering |
| Invoice | Monthly billing statement |

---

## Managing Service Offerings

### Offering Structure

```
Category (e.g., "Compute")
+-- Offering (e.g., "Virtual Machine")
    +-- Plan A (e.g., "Small")
    +-- Plan B (e.g., "Medium")
    +-- Plan C (e.g., "Large")
```

### Create Category (API)

```bash
curl -X POST https://portal.dev.gsv.dev/api/marketplace-categories/ \
  -H "Authorization: Token $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Services",
    "description": "AI and ML services"
  }'
```

### Create Offering (API)

```bash
curl -X POST https://portal.dev.gsv.dev/api/marketplace-offerings/ \
  -H "Authorization: Token $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Agent",
    "category": "/api/marketplace-categories/uuid/",
    "type": "GSVAgents.Agent",
    "state": "Active",
    "description": "Deploy AI agents"
  }'
```

### Offering States

| State | Description | Visibility |
|-------|-------------|------------|
| Draft | Under development | Staff only |
| Active | Available | All users |
| Paused | Temporarily unavailable | Existing only |
| Archived | Discontinued | None |

---

## Tenant Management

### Create Customer (API)

```bash
curl -X POST https://portal.dev.gsv.dev/api/customers/ \
  -H "Authorization: Token $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "email": "billing@acme.com",
    "country": "US"
  }'
```

### Manage Quotas

```bash
# View quotas
curl https://portal.dev.gsv.dev/api/customers/uuid/ \
  -H "Authorization: Token $STAFF_TOKEN" | jq '.quotas'

# Update quotas
curl -X PATCH https://portal.dev.gsv.dev/api/customers/uuid/ \
  -H "Authorization: Token $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quotas": {
      "nc_project_count": 10,
      "nc_resource_count": 100
    }
  }'
```

### Block Customer

```bash
curl -X POST https://portal.dev.gsv.dev/api/customers/uuid/block/ \
  -H "Authorization: Token $STAFF_TOKEN"
```

---

## Pricing & Plans

### Pricing Models

| Model | Description | Use Case |
|-------|-------------|----------|
| Fixed | Fixed monthly | Subscriptions |
| Usage | Pay per use | API calls |
| Tiered | Volume-based | Storage |
| Hybrid | Base + usage | SaaS |

### Create Plan

```bash
curl -X POST https://portal.dev.gsv.dev/api/marketplace-plans/ \
  -H "Authorization: Token $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "offering": "/api/marketplace-offerings/uuid/",
    "name": "Professional",
    "unit_price": "99.00",
    "unit": "month"
  }'
```

---

## Order Management

### Order States

| State | Description |
|-------|-------------|
| Draft | Not submitted |
| Pending Approval | Awaiting approval |
| Executing | Being provisioned |
| Done | Completed |
| Rejected | Declined |
| Failed | Provisioning failed |

### Process Orders

```bash
# View pending orders
curl "https://portal.dev.gsv.dev/api/marketplace-orders/?state=pending%20provider" \
  -H "Authorization: Token $STAFF_TOKEN"

# Approve order
curl -X POST https://portal.dev.gsv.dev/api/marketplace-orders/uuid/approve/ \
  -H "Authorization: Token $STAFF_TOKEN"

# Reject order
curl -X POST https://portal.dev.gsv.dev/api/marketplace-orders/uuid/reject/ \
  -H "Authorization: Token $STAFF_TOKEN"
```

---

## Usage & Billing

### Submit Usage

```bash
curl -X POST https://portal.dev.gsv.dev/api/marketplace-component-usages/ \
  -H "Authorization: Token $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": "/api/marketplace-resources/uuid/",
    "component": "/api/marketplace-plan-components/uuid/",
    "usage": 1500,
    "date": "2024-01-15"
  }'
```

### Generate Invoice

```bash
curl -X POST https://portal.dev.gsv.dev/api/invoices/ \
  -H "Authorization: Token $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": "/api/customers/uuid/",
    "year": 2024,
    "month": 1
  }'
```

### Mark Invoice Paid

```bash
curl -X POST https://portal.dev.gsv.dev/api/invoices/uuid/paid/ \
  -H "Authorization: Token $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_date": "2024-02-01"
  }'
```

---

## Reports & Analytics

### Available Reports

| Report | Description |
|--------|-------------|
| Revenue | Monthly revenue |
| Usage | Resource usage |
| Orders | Order statistics |
| Customers | Growth metrics |

### Generate Reports

```bash
# Revenue report
curl "https://portal.dev.gsv.dev/api/marketplace-stats/revenue/?start=2024-01-01&end=2024-01-31" \
  -H "Authorization: Token $STAFF_TOKEN"

# Usage report
curl "https://portal.dev.gsv.dev/api/marketplace-stats/usage/?offering=uuid&start=2024-01-01&end=2024-01-31" \
  -H "Authorization: Token $STAFF_TOKEN"
```

### KPIs

| Metric | Description |
|--------|-------------|
| MRR | Monthly Recurring Revenue |
| Churn Rate | Customer loss rate |
| ARPU | Average Revenue Per User |
| Order Completion | Orders completed vs submitted |

---

## Support Operations

### Manage Tickets

```bash
# View open tickets
curl "https://portal.dev.gsv.dev/api/support-issues/?state=open" \
  -H "Authorization: Token $STAFF_TOKEN"

# Assign ticket
curl -X PATCH https://portal.dev.gsv.dev/api/support-issues/uuid/ \
  -H "Authorization: Token $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assignee": "/api/users/staff-uuid/"}'

# Resolve ticket
curl -X POST https://portal.dev.gsv.dev/api/support-issues/uuid/resolve/ \
  -H "Authorization: Token $STAFF_TOKEN"
```

### SLA Configuration

| Priority | Response | Resolution |
|----------|----------|------------|
| Critical | 1 hour | 4 hours |
| High | 4 hours | 1 day |
| Medium | 1 day | 3 days |
| Low | 3 days | 7 days |

---

## Quick Reference

### Common Tasks

| Task | API Endpoint |
|------|--------------|
| Create Offering | POST /api/marketplace-offerings/ |
| Approve Order | POST /api/marketplace-orders/{uuid}/approve/ |
| Block Customer | POST /api/customers/{uuid}/block/ |
| Generate Invoice | POST /api/invoices/ |
| View Usage | GET /api/marketplace-stats/usage/ |

### Useful Filters

```bash
# Orders by state
/api/marketplace-orders/?state=pending%20provider

# Resources by offering
/api/marketplace-resources/?offering_uuid=xxx

# Customers by state
/api/customers/?is_active=true

# Invoices by period
/api/invoices/?year=2024&month=1
```
