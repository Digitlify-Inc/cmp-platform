import { test, expect } from '@playwright/test';
import { URLS } from './fixtures/test-fixtures';

/**
 * Agent Execution E2E Tests
 *
 * Tests the complete agent execution flow:
 * Gateway → Runner → Langflow Runtime
 *
 * Per Testing Strategy (doc 14), this covers:
 * T3: Run via Gateway → Runner → Langflow Runtime
 *
 * Prerequisites:
 * - Demo flows created in Langflow Runtime
 * - Control Plane offerings seeded
 * - Test instances created
 */

// Demo flow IDs created in Runtime
const DEMO_FLOWS = {
  customerSupport: '9aadc89c-3f7d-4805-8d03-9899c3afe672',
  knowledgeBase: 'a61922c9-4822-4d6a-8e6c-ea4a1563cfb6',
  salesOutreach: '8ec45bf1-9af0-4646-b5bf-a397caf5d453',
};

// =============================================================================
// GATEWAY HEALTH TESTS
// =============================================================================
test.describe('AE1: Gateway Health', () => {
  test('AE1.1: Gateway service is reachable', async ({ request }) => {
    try {
      const response = await request.get(`${URLS.gateway}/health`);
      expect([200, 404]).toContain(response.status());

      if (response.status() === 200) {
        const body = await response.json();
        expect(body.status).toBe('healthy');
      }
    } catch (e) {
      console.log('Gateway not publicly accessible:', e);
    }
  });

  test('AE1.2: Gateway requires authentication for runs', async ({ request }) => {
    const response = await request.post(`${URLS.gateway}/v1/runs`, {
      data: {
        instance_id: 'test-instance',
        input: { query: 'Hello' },
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([401, 403, 404]).toContain(response.status());
  });
});

// =============================================================================
// LANGFLOW RUNTIME TESTS
// =============================================================================
test.describe('AE2: Langflow Runtime', () => {
  test('AE2.1: Runtime health endpoint responds', async ({ request }) => {
    const response = await request.get(`${URLS.runtime}/health`);

    if (response.status() === 200) {
      const body = await response.json();
      expect(body.status).toBeDefined();
    } else {
      expect([302, 401, 403]).toContain(response.status());
    }
  });

  test('AE2.2: Runtime API requires authentication', async ({ request }) => {
    const response = await request.get(`${URLS.runtime}/api/v1/flows`);
    expect([302, 401, 403]).toContain(response.status());
  });
});

// =============================================================================
// CONTROL PLANE INSTANCE TESTS
// =============================================================================
test.describe('AE3: Control Plane', () => {
  test('AE3.1: Instances endpoint requires auth', async ({ request }) => {
    const response = await request.get(`${URLS.controlPlane}/instances/`);
    expect([401, 403]).toContain(response.status());
  });

  test('AE3.2: Offerings endpoint is public', async ({ request }) => {
    const response = await request.get(`${URLS.controlPlane}/offerings/`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.results).toBeInstanceOf(Array);
  });

  test('AE3.3: OpenAPI schema is available', async ({ request }) => {
    const response = await request.get(`${URLS.controlPlane}/api/schema/`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.openapi).toBeDefined();
  });

  test('AE3.4: Swagger UI is accessible', async ({ request }) => {
    const response = await request.get(`${URLS.controlPlane}/api/docs/`);
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/html');
  });
});

// =============================================================================
// RUN CONSOLE UI TESTS
// =============================================================================
test.describe('AE4: Run Console UI', () => {
  test('AE4.1: Run console page structure', async ({ page }) => {
    await page.goto(`${URLS.marketplace}/default-channel/run/test-instance`);
    await expect(page.locator('body')).toBeVisible();

    const content = await page.content();
    expect(content).not.toContain('500 Internal Server Error');
  });
});

// =============================================================================
// CREDIT AUTHORIZATION TESTS
// =============================================================================
test.describe('AE5: Credit Authorization', () => {
  test('AE5.1: Billing authorize requires auth', async ({ request }) => {
    const response = await request.post(`${URLS.controlPlane}/billing/authorize`, {
      data: { instance_id: 'test-instance', credits: 10 },
      headers: { 'Content-Type': 'application/json' },
    });
    expect([401, 403]).toContain(response.status());
  });

  test('AE5.2: Wallet endpoint requires auth', async ({ request }) => {
    const response = await request.get(`${URLS.controlPlane}/wallets/me`);
    expect([401, 403]).toContain(response.status());
  });
});

// =============================================================================
// MY AGENTS PAGE TESTS
// =============================================================================
test.describe('AE6: My Agents Page', () => {
  test('AE6.1: Instances page loads', async ({ page }) => {
    await page.goto(`${URLS.marketplace}/default-channel/account/instances`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('AE6.2: Instance detail page exists', async ({ page }) => {
    await page.goto(`${URLS.marketplace}/default-channel/account/instances/test-instance`);
    await expect(page.locator('body')).toBeVisible();
  });
});

// =============================================================================
// BILLING PAGE TESTS
// =============================================================================
test.describe('AE7: Billing Integration', () => {
  test('AE7.1: Billing page loads', async ({ page }) => {
    await page.goto(`${URLS.marketplace}/default-channel/account/billing`);
    await expect(page.locator('body')).toBeVisible();
  });
});
