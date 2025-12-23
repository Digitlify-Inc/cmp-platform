# GSV Platform - Site Kit Implementation Plan

**Date:** December 12, 2024
**Status:** Ready for Implementation
**Dependencies:** SITE-KIT-ARCHITECTURE.md

## Overview

This document provides a detailed implementation breakdown for the Site Kit architecture. Each task includes specific file locations, code examples, and acceptance criteria.

## Quick Wins (Immediate Actions)

### 1. Enable Organization Creation in Waldur

**Priority:** P0 - Critical
**Effort:** 1 hour
**Impact:** Unblocks user self-registration

**Current State:**
- Organization creation exists at `/organizations/create/`
- Feature is gated by `MarketplaceFeatures.show_experimental_ui_components`
- Location: `cmp-frontend/src/user/routes.ts:221-234`

**Action Required:**

Update Waldur backend configuration to enable the feature:

```yaml
# File: gsv-gitops/platform/base/waldur/configmap.yaml (or equivalent)
# Add or update the features configuration

data:
  FEATURES: |
    {
      "marketplace": {
        "show_experimental_ui_components": true
      }
    }
```

Or via environment variable in deployment:

```yaml
# File: gsv-gitops/platform/base/waldur/deployment.yaml
env:
  - name: WALDUR_FEATURES__MARKETPLACE__SHOW_EXPERIMENTAL_UI_COMPONENTS
    value: "true"
```

**Verification:**
1. Deploy configuration change via GitOps
2. Login to Waldur as a new user
3. Navigate to `/organizations/create/`
4. Complete organization creation wizard
5. Verify organization appears in user's dashboard

---

## Phase 1: Foundation

### Task 1.1: Create Agent Registry API Client in Waldur Frontend

**Files to Create:**
- `cmp-frontend/src/api/agentRegistry.ts`

**Code:**

```typescript
// cmp-frontend/src/api/agentRegistry.ts
import Axios from 'axios';
import { ENV } from '@waldur/core/config';

const getAgentRegistryUrl = () => {
  // Use environment variable or derive from Waldur config
  return ENV.plugins?.AGENT_REGISTRY_URL || 'https://api.dev.gsv.dev';
};

const agentRegistryClient = Axios.create({
  baseURL: getAgentRegistryUrl(),
});

// Add auth interceptor
agentRegistryClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('waldur_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Seller (Provider) APIs
export const providerAgentApi = {
  list: (providerId: string) =>
    agentRegistryClient.get(`/api/v1/providers/${providerId}/agents/`),

  get: (agentId: string) =>
    agentRegistryClient.get(`/api/v1/agents/${agentId}/`),

  create: (providerId: string, data: any) =>
    agentRegistryClient.post(`/api/v1/providers/${providerId}/agents/`, data),

  update: (agentId: string, data: any) =>
    agentRegistryClient.patch(`/api/v1/agents/${agentId}/`, data),

  delete: (agentId: string) =>
    agentRegistryClient.delete(`/api/v1/agents/${agentId}/`),

  // Versions
  listVersions: (agentId: string) =>
    agentRegistryClient.get(`/api/v1/agents/${agentId}/versions/`),

  createVersion: (agentId: string, data: any) =>
    agentRegistryClient.post(`/api/v1/agents/${agentId}/versions/`, data),

  publishVersion: (versionId: string) =>
    agentRegistryClient.post(`/api/v1/versions/${versionId}/publish/`),

  // Training
  listTrainingDocs: (agentId: string) =>
    agentRegistryClient.get(`/api/v1/agents/${agentId}/training/`),

  uploadTrainingDoc: (agentId: string, formData: FormData) =>
    agentRegistryClient.post(`/api/v1/agents/${agentId}/training/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteTrainingDoc: (docId: string) =>
    agentRegistryClient.delete(`/api/v1/training/${docId}/`),
};

// Buyer (Customer) APIs
export const customerAgentApi = {
  listAccess: (customerId: string) =>
    agentRegistryClient.get(`/api/v1/customers/${customerId}/agent-access/`),

  getAccess: (accessId: string) =>
    agentRegistryClient.get(`/api/v1/agent-access/${accessId}/`),

  // Configuration
  getConfig: (accessId: string) =>
    agentRegistryClient.get(`/api/v1/agent-access/${accessId}/configuration/`),

  updateConfig: (accessId: string, config: any) =>
    agentRegistryClient.put(`/api/v1/agent-access/${accessId}/configuration/`, config),

  // API Keys
  listApiKeys: (accessId: string) =>
    agentRegistryClient.get(`/api/v1/agent-access/${accessId}/api-keys/`),

  createApiKey: (accessId: string, name: string) =>
    agentRegistryClient.post(`/api/v1/agent-access/${accessId}/api-keys/`, { name }),

  revokeApiKey: (keyId: string) =>
    agentRegistryClient.delete(`/api/v1/api-keys/${keyId}/`),

  // Widget
  getWidgetConfig: (accessId: string) =>
    agentRegistryClient.get(`/api/v1/agent-access/${accessId}/widget/`),

  updateWidgetConfig: (accessId: string, config: any) =>
    agentRegistryClient.put(`/api/v1/agent-access/${accessId}/widget/`, config),

  getEmbedCode: (accessId: string) =>
    agentRegistryClient.get(`/api/v1/agent-access/${accessId}/embed-code/`),
};

export default agentRegistryClient;
```

**Acceptance Criteria:**
- [ ] API client created with proper typing
- [ ] Auth token automatically included in requests
- [ ] Both provider and customer endpoints covered
- [ ] Error handling follows Waldur patterns

---

### Task 1.2: Add Seller Site Kit Routes

**Files to Modify:**
- `cmp-frontend/src/marketplace/routes.ts`

**Files to Create:**
- `cmp-frontend/src/marketplace/service-providers/agents/index.ts`
- `cmp-frontend/src/marketplace/service-providers/agents/ProviderAgentsList.tsx`

**Route Additions:**

```typescript
// Add to cmp-frontend/src/marketplace/routes.ts

// Import at top
import { lazyComponent } from '@waldur/core/lazyComponent';

// Add these routes after 'marketplace-vendor-offerings' route (around line 379)

{
  name: 'marketplace-provider-agents',
  url: 'agents/',
  component: lazyComponent(() =>
    import('./service-providers/agents/ProviderAgentsList').then((module) => ({
      default: module.ProviderAgentsList,
    })),
  ),
  parent: 'provider-marketplace',
  data: {
    breadcrumb: () => translate('AI Agents'),
    priority: 122,
  },
},

{
  name: 'marketplace-provider-agent-details',
  url: 'agents/:agent_uuid/',
  component: lazyComponent(() =>
    import('./service-providers/agents/AgentDetailsPage').then((module) => ({
      default: module.AgentDetailsPage,
    })),
  ),
  parent: 'marketplace-provider',
  data: {
    skipBreadcrumb: true,
  },
},

{
  name: 'marketplace-provider-agent-versions',
  url: 'agents/:agent_uuid/versions/',
  component: lazyComponent(() =>
    import('./service-providers/agents/AgentVersionsPage').then((module) => ({
      default: module.AgentVersionsPage,
    })),
  ),
  parent: 'marketplace-provider',
  data: {
    skipBreadcrumb: true,
  },
},

{
  name: 'marketplace-provider-agent-training',
  url: 'agents/:agent_uuid/training/',
  component: lazyComponent(() =>
    import('./service-providers/agents/AgentTrainingPage').then((module) => ({
      default: module.AgentTrainingPage,
    })),
  ),
  parent: 'marketplace-provider',
  data: {
    skipBreadcrumb: true,
  },
},
```

---

### Task 1.3: Add Buyer Site Kit Routes

**Files to Modify:**
- `cmp-frontend/src/customer/routes.ts`

**Files to Create:**
- `cmp-frontend/src/customer/agents/index.ts`
- `cmp-frontend/src/customer/agents/CustomerAgentsList.tsx`

**Route Additions:**

```typescript
// Add to cmp-frontend/src/customer/routes.ts

// Add these routes after 'organization-resources' route (around line 71)

{
  name: 'organization-agents',
  parent: 'organization',
  url: 'agents/',
  component: lazyComponent(() =>
    import('./agents/CustomerAgentsList').then((module) => ({
      default: module.CustomerAgentsList,
    })),
  ),
  data: {
    breadcrumb: () => translate('My Agents'),
    priority: 112,
  },
},

{
  name: 'organization-agent-configure',
  parent: 'organization',
  url: 'agents/:access_uuid/configure/',
  component: lazyComponent(() =>
    import('./agents/AgentConfigurePage').then((module) => ({
      default: module.AgentConfigurePage,
    })),
  ),
  data: {
    skipBreadcrumb: true,
  },
},

{
  name: 'organization-agent-widgets',
  parent: 'organization',
  url: 'agents/:access_uuid/widgets/',
  component: lazyComponent(() =>
    import('./agents/AgentWidgetsPage').then((module) => ({
      default: module.AgentWidgetsPage,
    })),
  ),
  data: {
    skipBreadcrumb: true,
  },
},

{
  name: 'organization-agent-keys',
  parent: 'organization',
  url: 'agents/:access_uuid/keys/',
  component: lazyComponent(() =>
    import('./agents/AgentKeysPage').then((module) => ({
      default: module.AgentKeysPage,
    })),
  ),
  data: {
    skipBreadcrumb: true,
  },
},
```

---

## Phase 2: Seller Site Kit Components

### Task 2.1: Provider Agents List

**File:** `cmp-frontend/src/marketplace/service-providers/agents/ProviderAgentsList.tsx`

```typescript
import { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentStateAndParams } from '@uirouter/react';

import { Table, createFetcher } from '@waldur/table';
import { translate } from '@waldur/i18n';
import { providerAgentApi } from '@waldur/api/agentRegistry';
import { AgentCreateButton } from './AgentCreateButton';
import { AgentRowActions } from './AgentRowActions';

export const ProviderAgentsList: FC = () => {
  const { params } = useCurrentStateAndParams();
  const providerId = params.uuid;

  const columns = [
    {
      title: translate('Name'),
      render: ({ row }) => row.name,
    },
    {
      title: translate('Category'),
      render: ({ row }) => row.category?.name || '-',
    },
    {
      title: translate('Status'),
      render: ({ row }) => row.state,
    },
    {
      title: translate('Version'),
      render: ({ row }) => row.current_version || '-',
    },
    {
      title: translate('Created'),
      render: ({ row }) => row.created,
    },
  ];

  return (
    <Table
      title={translate('AI Agents')}
      columns={columns}
      fetcher={createFetcher(() => providerAgentApi.list(providerId))}
      actions={<AgentCreateButton providerId={providerId} />}
      rowActions={AgentRowActions}
    />
  );
};
```

---

### Task 2.2: Agent Create Dialog

**File:** `cmp-frontend/src/marketplace/service-providers/agents/AgentCreateDialog.tsx`

```typescript
import { FC } from 'react';
import { useDispatch } from 'react-redux';
import { reduxForm } from 'redux-form';

import { translate } from '@waldur/i18n';
import { closeModalDialog } from '@waldur/modal/actions';
import { ModalDialog } from '@waldur/modal/ModalDialog';
import { FormContainer, StringField, TextField, SelectField } from '@waldur/form';
import { providerAgentApi } from '@waldur/api/agentRegistry';
import { showSuccess, showError } from '@waldur/store/notify';

interface AgentCreateDialogProps {
  providerId: string;
  resolve: { refetch: () => void };
}

const FORM_ID = 'AgentCreateForm';

export const AgentCreateDialog: FC<AgentCreateDialogProps> = reduxForm({
  form: FORM_ID,
})(({ handleSubmit, submitting, providerId, resolve }) => {
  const dispatch = useDispatch();

  const createAgent = async (formData: any) => {
    try {
      await providerAgentApi.create(providerId, formData);
      dispatch(showSuccess(translate('Agent created successfully.')));
      dispatch(closeModalDialog());
      resolve.refetch();
    } catch (error) {
      dispatch(showError(translate('Failed to create agent.')));
    }
  };

  return (
    <form onSubmit={handleSubmit(createAgent)}>
      <ModalDialog
        title={translate('Create AI Agent')}
        closeButton
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => dispatch(closeModalDialog())}
            >
              {translate('Cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {translate('Create')}
            </button>
          </>
        }
      >
        <FormContainer submitting={submitting}>
          <StringField
            name="name"
            label={translate('Name')}
            required
          />
          <TextField
            name="description"
            label={translate('Description')}
          />
          <SelectField
            name="category"
            label={translate('Category')}
            options={[
              { value: 'chatbot', label: translate('Chatbot') },
              { value: 'assistant', label: translate('Assistant') },
              { value: 'automation', label: translate('Automation') },
            ]}
          />
        </FormContainer>
      </ModalDialog>
    </form>
  );
});
```

---

### Task 2.3: Agent Details Page

**File:** `cmp-frontend/src/marketplace/service-providers/agents/AgentDetailsPage.tsx`

```typescript
import { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

import { translate } from '@waldur/i18n';
import { LoadingSpinner } from '@waldur/core/LoadingSpinner';
import { providerAgentApi } from '@waldur/api/agentRegistry';
import { Card } from '@waldur/core/Card';

export const AgentDetailsPage: FC = () => {
  const { params } = useCurrentStateAndParams();
  const router = useRouter();
  const agentId = params.agent_uuid;

  const { data: agent, isLoading, error } = useQuery(
    ['agent', agentId],
    () => providerAgentApi.get(agentId).then((res) => res.data),
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>{translate('Failed to load agent')}</div>;

  return (
    <div className="container-fluid">
      <Card title={agent.name}>
        <div className="row">
          <div className="col-md-6">
            <dl>
              <dt>{translate('Description')}</dt>
              <dd>{agent.description || '-'}</dd>

              <dt>{translate('Category')}</dt>
              <dd>{agent.category?.name || '-'}</dd>

              <dt>{translate('Status')}</dt>
              <dd>{agent.state}</dd>

              <dt>{translate('Current Version')}</dt>
              <dd>{agent.current_version || '-'}</dd>
            </dl>
          </div>
          <div className="col-md-6">
            <h5>{translate('Quick Actions')}</h5>
            <div className="d-flex flex-column gap-2">
              <button
                className="btn btn-outline-primary"
                onClick={() =>
                  router.stateService.go('marketplace-provider-agent-versions', {
                    agent_uuid: agentId,
                  })
                }
              >
                {translate('Manage Versions')}
              </button>
              <button
                className="btn btn-outline-primary"
                onClick={() =>
                  router.stateService.go('marketplace-provider-agent-training', {
                    agent_uuid: agentId,
                  })
                }
              >
                {translate('Training Documents')}
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
```

---

## Phase 3: Buyer Site Kit Components

### Task 3.1: Customer Agents List

**File:** `cmp-frontend/src/customer/agents/CustomerAgentsList.tsx`

```typescript
import { FC } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from '@uirouter/react';

import { Table, createFetcher } from '@waldur/table';
import { translate } from '@waldur/i18n';
import { getCustomer } from '@waldur/workspace/selectors';
import { customerAgentApi } from '@waldur/api/agentRegistry';

export const CustomerAgentsList: FC = () => {
  const router = useRouter();
  const customer = useSelector(getCustomer);

  const columns = [
    {
      title: translate('Agent'),
      render: ({ row }) => row.agent?.name || '-',
    },
    {
      title: translate('Status'),
      render: ({ row }) => row.status,
    },
    {
      title: translate('API Calls'),
      render: ({ row }) => row.usage_stats?.api_calls || 0,
    },
    {
      title: translate('Since'),
      render: ({ row }) => row.created,
    },
  ];

  const rowActions = ({ row }) => (
    <div className="btn-group">
      <button
        className="btn btn-sm btn-outline-primary"
        onClick={() =>
          router.stateService.go('organization-agent-configure', {
            access_uuid: row.uuid,
          })
        }
      >
        {translate('Configure')}
      </button>
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={() =>
          router.stateService.go('organization-agent-widgets', {
            access_uuid: row.uuid,
          })
        }
      >
        {translate('Widget')}
      </button>
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={() =>
          router.stateService.go('organization-agent-keys', {
            access_uuid: row.uuid,
          })
        }
      >
        {translate('API Keys')}
      </button>
    </div>
  );

  return (
    <Table
      title={translate('My AI Agents')}
      columns={columns}
      fetcher={createFetcher(() => customerAgentApi.listAccess(customer.uuid))}
      rowActions={rowActions}
    />
  );
};
```

---

### Task 3.2: Agent Configuration Page

**File:** `cmp-frontend/src/customer/agents/AgentConfigurePage.tsx`

```typescript
import { FC, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentStateAndParams } from '@uirouter/react';
import { useDispatch } from 'react-redux';

import { translate } from '@waldur/i18n';
import { LoadingSpinner } from '@waldur/core/LoadingSpinner';
import { customerAgentApi } from '@waldur/api/agentRegistry';
import { Card } from '@waldur/core/Card';
import { showSuccess, showError } from '@waldur/store/notify';
import {
  FormContainer,
  StringField,
  TextField,
  SelectField,
} from '@waldur/form';

export const AgentConfigurePage: FC = () => {
  const { params } = useCurrentStateAndParams();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const accessId = params.access_uuid;

  const { data: config, isLoading } = useQuery(
    ['agent-config', accessId],
    () => customerAgentApi.getConfig(accessId).then((res) => res.data),
  );

  const mutation = useMutation(
    (newConfig: any) => customerAgentApi.updateConfig(accessId, newConfig),
    {
      onSuccess: () => {
        dispatch(showSuccess(translate('Configuration saved.')));
        queryClient.invalidateQueries(['agent-config', accessId]);
      },
      onError: () => {
        dispatch(showError(translate('Failed to save configuration.')));
      },
    },
  );

  const handleSubmit = useCallback(
    (formData: any) => {
      mutation.mutate(formData);
    },
    [mutation],
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="container-fluid">
      <Card title={translate('Agent Configuration')}>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(config); }}>
          <FormContainer>
            <StringField
              name="persona_name"
              label={translate('Persona Name')}
              description={translate('Display name for the agent')}
            />
            <TextField
              name="system_prompt"
              label={translate('System Prompt')}
              description={translate('Instructions for the AI agent')}
              rows={6}
            />
            <SelectField
              name="tone"
              label={translate('Tone')}
              options={[
                { value: 'professional', label: translate('Professional') },
                { value: 'friendly', label: translate('Friendly') },
                { value: 'casual', label: translate('Casual') },
              ]}
            />
            <StringField
              name="welcome_message"
              label={translate('Welcome Message')}
              description={translate('First message shown to users')}
            />
          </FormContainer>
          <div className="mt-4">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={mutation.isLoading}
            >
              {translate('Save Configuration')}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
```

---

### Task 3.3: Agent API Keys Page

**File:** `cmp-frontend/src/customer/agents/AgentKeysPage.tsx`

```typescript
import { FC, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentStateAndParams } from '@uirouter/react';
import { useDispatch } from 'react-redux';

import { translate } from '@waldur/i18n';
import { LoadingSpinner } from '@waldur/core/LoadingSpinner';
import { customerAgentApi } from '@waldur/api/agentRegistry';
import { Card } from '@waldur/core/Card';
import { showSuccess, showError } from '@waldur/store/notify';
import { Table } from '@waldur/table';

export const AgentKeysPage: FC = () => {
  const { params } = useCurrentStateAndParams();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const accessId = params.access_uuid;
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);

  const { data: keys, isLoading } = useQuery(
    ['agent-keys', accessId],
    () => customerAgentApi.listApiKeys(accessId).then((res) => res.data),
  );

  const createMutation = useMutation(
    (name: string) => customerAgentApi.createApiKey(accessId, name),
    {
      onSuccess: (response) => {
        setNewKey(response.data.key);
        dispatch(showSuccess(translate('API key created.')));
        queryClient.invalidateQueries(['agent-keys', accessId]);
        setNewKeyName('');
      },
      onError: () => {
        dispatch(showError(translate('Failed to create API key.')));
      },
    },
  );

  const revokeMutation = useMutation(
    (keyId: string) => customerAgentApi.revokeApiKey(keyId),
    {
      onSuccess: () => {
        dispatch(showSuccess(translate('API key revoked.')));
        queryClient.invalidateQueries(['agent-keys', accessId]);
      },
      onError: () => {
        dispatch(showError(translate('Failed to revoke API key.')));
      },
    },
  );

  if (isLoading) return <LoadingSpinner />;

  const columns = [
    {
      title: translate('Name'),
      render: ({ row }) => row.name,
    },
    {
      title: translate('Prefix'),
      render: ({ row }) => row.prefix + '...',
    },
    {
      title: translate('Created'),
      render: ({ row }) => row.created,
    },
    {
      title: translate('Last Used'),
      render: ({ row }) => row.last_used || translate('Never'),
    },
  ];

  return (
    <div className="container-fluid">
      <Card title={translate('API Keys')}>
        {newKey && (
          <div className="alert alert-success">
            <strong>{translate('New API Key Created:')}</strong>
            <code className="ms-2">{newKey}</code>
            <p className="mb-0 mt-2 text-muted">
              {translate('Copy this key now. You will not be able to see it again.')}
            </p>
          </div>
        )}

        <div className="mb-4">
          <h5>{translate('Create New Key')}</h5>
          <div className="input-group" style={{ maxWidth: 400 }}>
            <input
              type="text"
              className="form-control"
              placeholder={translate('Key name')}
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={() => createMutation.mutate(newKeyName)}
              disabled={!newKeyName || createMutation.isLoading}
            >
              {translate('Create')}
            </button>
          </div>
        </div>

        <Table
          columns={columns}
          data={keys}
          rowActions={({ row }) => (
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => revokeMutation.mutate(row.uuid)}
              disabled={revokeMutation.isLoading}
            >
              {translate('Revoke')}
            </button>
          )}
        />
      </Card>
    </div>
  );
};
```

---

### Task 3.4: Agent Widgets Page

**File:** `cmp-frontend/src/customer/agents/AgentWidgetsPage.tsx`

```typescript
import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentStateAndParams } from '@uirouter/react';

import { translate } from '@waldur/i18n';
import { LoadingSpinner } from '@waldur/core/LoadingSpinner';
import { customerAgentApi } from '@waldur/api/agentRegistry';
import { Card } from '@waldur/core/Card';
import { CopyToClipboard } from '@waldur/core/CopyToClipboard';

export const AgentWidgetsPage: FC = () => {
  const { params } = useCurrentStateAndParams();
  const accessId = params.access_uuid;
  const [copied, setCopied] = useState(false);

  const { data: embedData, isLoading } = useQuery(
    ['agent-embed', accessId],
    () => customerAgentApi.getEmbedCode(accessId).then((res) => res.data),
  );

  if (isLoading) return <LoadingSpinner />;

  const embedCode = embedData?.embed_code || `
<script src="https://widget.gsv.dev/loader.js"></script>
<script>
  GSVWidget.init({
    accessKey: '${accessId}',
    position: 'bottom-right'
  });
</script>`;

  return (
    <div className="container-fluid">
      <Card title={translate('Widget Embed Code')}>
        <p className="text-muted">
          {translate('Add this code to your website to embed the chat widget.')}
        </p>

        <div className="position-relative">
          <pre className="bg-light p-3 rounded">
            <code>{embedCode}</code>
          </pre>
          <CopyToClipboard
            text={embedCode}
            className="position-absolute top-0 end-0 m-2"
          />
        </div>

        <h5 className="mt-4">{translate('Widget Configuration')}</h5>
        <p className="text-muted">
          {translate('Customize the widget appearance and behavior.')}
        </p>

        <div className="row">
          <div className="col-md-6">
            <label className="form-label">{translate('Position')}</label>
            <select className="form-select">
              <option value="bottom-right">{translate('Bottom Right')}</option>
              <option value="bottom-left">{translate('Bottom Left')}</option>
              <option value="top-right">{translate('Top Right')}</option>
              <option value="top-left">{translate('Top Left')}</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">{translate('Theme')}</label>
            <select className="form-select">
              <option value="light">{translate('Light')}</option>
              <option value="dark">{translate('Dark')}</option>
              <option value="auto">{translate('Auto (System)')}</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
};
```

---

## Phase 4: Agent Registry API Extensions

### Task 4.1: Extend Agent Registry API Endpoints

The Agent Registry backend needs these API endpoints to support the Site Kit:

**Required Endpoints:**

```
# Provider (Seller) Endpoints
GET    /api/v1/providers/{provider_id}/agents/
POST   /api/v1/providers/{provider_id}/agents/
GET    /api/v1/agents/{agent_id}/
PATCH  /api/v1/agents/{agent_id}/
DELETE /api/v1/agents/{agent_id}/
GET    /api/v1/agents/{agent_id}/versions/
POST   /api/v1/agents/{agent_id}/versions/
POST   /api/v1/versions/{version_id}/publish/
GET    /api/v1/agents/{agent_id}/training/
POST   /api/v1/agents/{agent_id}/training/
DELETE /api/v1/training/{doc_id}/

# Customer (Buyer) Endpoints
GET    /api/v1/customers/{customer_id}/agent-access/
GET    /api/v1/agent-access/{access_id}/
GET    /api/v1/agent-access/{access_id}/configuration/
PUT    /api/v1/agent-access/{access_id}/configuration/
GET    /api/v1/agent-access/{access_id}/api-keys/
POST   /api/v1/agent-access/{access_id}/api-keys/
DELETE /api/v1/api-keys/{key_id}/
GET    /api/v1/agent-access/{access_id}/widget/
PUT    /api/v1/agent-access/{access_id}/widget/
GET    /api/v1/agent-access/{access_id}/embed-code/
```

**Implementation Location:** `cmp-agentregistry/agent_registry/api/`

---

## Phase 5: GitOps Configuration

### Task 5.1: Update Waldur ConfigMap

**File:** `gsv-gitops/platform/base/waldur/configmap.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: waldur-config
data:
  # Enable organization self-service creation
  WALDUR_FEATURES__MARKETPLACE__SHOW_EXPERIMENTAL_UI_COMPONENTS: "true"

  # Agent Registry integration
  AGENT_REGISTRY_URL: "https://api.dev.gsv.dev"
```

---

### Task 5.2: Configure Portal Redirects

**File:** `gsv-gitops/platform/base/ingress/portal-redirect.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: portal-redirect
  annotations:
    nginx.ingress.kubernetes.io/permanent-redirect: "https://app.dev.gsv.dev$request_uri"
    nginx.ingress.kubernetes.io/permanent-redirect-code: "301"
spec:
  ingressClassName: nginx
  rules:
    - host: portal.dev.gsv.dev
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: dummy
                port:
                  number: 80
```

---

## Testing Checklist

### Organization Creation
- [ ] New user can register via Keycloak
- [ ] User can access `/organizations/create/`
- [ ] User can complete all 4 steps
- [ ] Organization is created successfully
- [ ] User becomes organization owner

### Seller Site Kit
- [ ] Provider can view agents list
- [ ] Provider can create new agent
- [ ] Provider can view agent details
- [ ] Provider can manage versions
- [ ] Provider can upload training docs

### Buyer Site Kit
- [ ] Customer can view purchased agents
- [ ] Customer can configure agent
- [ ] Customer can manage API keys
- [ ] Customer can get widget embed code
- [ ] Widget works when embedded

### Integration
- [ ] Waldur webhooks trigger Agent Registry
- [ ] Agent Registry API auth works with Waldur tokens
- [ ] Usage data flows to Waldur billing

---

## Rollback Plan

If issues are discovered after deployment:

1. **Revert Feature Flag**
   ```yaml
   WALDUR_FEATURES__MARKETPLACE__SHOW_EXPERIMENTAL_UI_COMPONENTS: "false"
   ```

2. **Remove Portal Redirects**
   Delete or modify `portal-redirect.yaml` to restore portal access

3. **Restore Portal Deployment**
   Uncomment portal resources in GitOps if previously removed

4. **Communication**
   Notify users of temporary rollback

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Organization self-creation | >90% success | Waldur analytics |
| Agent configuration saves | <2s response | APM monitoring |
| Widget embed success | >95% | Error tracking |
| Support tickets | No increase | Helpdesk |
| User satisfaction | >4.0/5.0 | Survey |
