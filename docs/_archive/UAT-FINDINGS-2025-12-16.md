# UAT Findings - December 16, 2025

## Executive Summary

During initial UAT testing of the buyer journey, several critical UX issues were identified that need to be addressed before GTM.

**Severity Levels:**
- **P0 (Critical)**: Blocks core functionality
- **P1 (High)**: Major UX issue affecting user experience
- **P2 (Medium)**: Minor UX issue

---

## Issues Found

### Issue 1: Orders Require Manual Provider Approval (P0)

**Problem:** When a buyer orders an agent from the marketplace, the order goes to "Pending provider approval" state instead of being automatically approved.

**Expected:** For self-service agent subscriptions, orders should be auto-approved immediately.

**Screenshot Reference:** Order showing "Pending provider approval" status

**Root Cause:** Waldur marketplace defaults to B2B approval workflow. Each offering needs `auto_approve_remote_orders: true` in `plugin_options`.

**Fix Required:**
1. **Backend**: Update all site agent offerings to set `auto_approve_remote_orders: true`
2. **Migration/Script**: Create management command to update existing offerings
3. **Frontend**: When creating new agent offerings, default this option to `true`

**Code Location:**
- Backend: `src/waldur_mastermind/marketplace/utils.py:1421-1439` - approval logic
- Offering model: `plugin_options` field

---

### Issue 2: Missing Agent Configuration UI After Subscription (P0)

**Problem:** When clicking on a subscribed agent (e.g., `test-2-first-proj-2-knowledge`), users see generic Waldur "Resource details" page instead of the agent-specific configuration page.

**Expected:** Users should see:
- Agent name/greeting customization
- API key management
- Widget embed code
- Training document upload
- Usage statistics

**Root Cause:** 
1. The "My Agents" route exists at `/organizations/:uuid/agents/` but users are navigating to the generic "Subscriptions" view
2. The CustomerAgentConfig is created when resource becomes OK, but the UI flow doesn't guide users there
3. Clicking a resource from "Subscriptions" goes to the generic resource detail page, not the agent config page

**Fix Required:**
1. **Frontend**: Add "Configure" action button on resource detail page for site agent resources
2. **Frontend**: Redirect site agent resources to agent config page instead of generic resource page
3. **Frontend**: Make "My Agents" tab more prominent in navigation

**Code Location:**
- Routes: `src/customer/routes.ts:73-131` - Agent routes exist
- Components: `src/customer/agents/` - All components exist

---

### Issue 3: Terminology Confusion - "Resources" vs "Subscriptions" (P1)

**Problem:** The "Subscriptions" tab shows "Resources" heading internally, causing terminology confusion for buyers.

**Screenshot Reference:** Tab says "Subscriptions" but page shows "Resources" heading

**Expected:** Consistent terminology throughout the buyer experience.

**Fix Required:**
1. **Frontend**: Update page titles and headings to use "Subscriptions" consistently
2. **Frontend**: Consider renaming "Resources" to "Subscriptions" in buyer context

---

### Issue 4: No Link to Agent Configuration from Resource Detail (P1)

**Problem:** When viewing a subscribed agent resource, there's no obvious way to configure/use the agent.

**Expected:** Clear "Configure Agent" or "Manage Agent" button/link visible on the resource detail page.

**Fix Required:**
1. **Frontend**: Add conditional action buttons for site agent resources:
   - "Configure" - Goes to agent config page
   - "API Keys" - Goes to API keys page
   - "Widget" - Goes to widget embed page

**Code Location:**
- Resource actions: Need to extend resource detail page with agent-specific actions

---

### Issue 5: Training Documents Feature Not Accessible (P2)

**Problem:** How to train agents with custom documents is not clear or accessible from the UI.

**Expected:** Clear workflow for uploading training documents to customize agent behavior.

**Fix Required:**
1. **Frontend**: Add "Training" tab to agent configuration page
2. **Backend**: Ensure training document upload API is working
3. **Documentation**: Add user guide for training agents

---

## Architecture Notes

### How Agent Config Works

1. User orders an agent from marketplace
2. Order goes to "Pending provider approval" (ISSUE #1)
3. After approval, Resource state becomes "OK"
4. Signal handler creates `CustomerAgentConfig` automatically
5. `CustomerAgentConfig` contains:
   - `agent_name` - Customizable display name
   - `greeting_message` - Initial message
   - `tone` - Communication style
   - `brand_color` - Widget customization
   - API keys - For programmatic access
   - Widget embed code - For website integration

### Existing API Endpoints (All Working)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `GET /api/customer-agent-configs/` | List buyer's agents | Working |
| `PATCH /api/customer-agent-configs/{uuid}/` | Update config | Working |
| `GET /api/customer-agent-configs/{uuid}/api_keys/` | List API keys | Working |
| `POST /api/customer-agent-configs/{uuid}/api_keys/` | Create API key | Working |
| `GET /api/customer-agent-configs/{uuid}/widget_embed/` | Get embed code | Working |
| `GET /api/customer-agent-configs/{uuid}/usage/` | Get usage stats | Working |

### Existing Frontend Routes (All Implemented)

| Route | Purpose |
|-------|---------|
| `/organizations/:uuid/agents/` | My Agents list |
| `/organizations/:uuid/agents/:resource_uuid/configure/` | Agent config page |
| `/organizations/:uuid/agents/:resource_uuid/keys/` | API keys page |
| `/organizations/:uuid/agents/:resource_uuid/widgets/` | Widget page |

---

## Priority Fix Order

1. **P0**: Enable auto-approval for all agent offerings
2. **P0**: Add navigation from Subscriptions to Agent Config
3. **P1**: Fix terminology consistency
4. **P1**: Add "Configure" action to resource detail page
5. **P2**: Document training workflow

---

## Recommended Fixes

### Quick Fix for Auto-Approval

Run this Django shell command to enable auto-approval for all site agent offerings:

```python
from waldur_mastermind.marketplace.models import Offering
from waldur_mastermind.marketplace_site_agent.constants import SITE_AGENT_OFFERING

offerings = Offering.objects.filter(type=SITE_AGENT_OFFERING)
for offering in offerings:
    plugin_options = offering.plugin_options or {}
    plugin_options['auto_approve_remote_orders'] = True
    offering.plugin_options = plugin_options
    offering.save(update_fields=['plugin_options'])
    print(f"Updated: {offering.name}")
```

### Quick Fix for Navigation

Add a "Configure Agent" link in the resource detail page actions when resource type is `Marketplace.SiteAgent`.

---

*Document created: December 16, 2025*
*Status: UAT In Progress*
