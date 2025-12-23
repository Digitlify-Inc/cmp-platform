import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for CMP Marketplace
 *
 * Environments:
 * - dev: dev.gsv.dev (GSVDEV development)
 * - qa: qa.digitlify.com (Digitlify QA)
 * - prod: digitlify.com (Digitlify Production)
 *
 * Usage:
 *   E2E_ENV=qa pnpm test:e2e        # Run against QA
 *   E2E_ENV=prod pnpm test:e2e      # Run against Prod
 *   pnpm test:e2e                   # Run against dev (default)
 */

const ENV = process.env.E2E_ENV || 'dev';

const DOMAINS: Record<string, string> = {
  dev: 'dev.gsv.dev',
  qa: 'qa.digitlify.com',
  prod: 'digitlify.com',
};

const BASE_DOMAIN = DOMAINS[ENV] || DOMAINS.dev;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'e2e-report' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || `https://${BASE_DOMAIN}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: process.env.E2E_START_SERVER ? {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  } : undefined,
});
