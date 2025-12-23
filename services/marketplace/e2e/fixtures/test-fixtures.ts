import { test as base, expect } from "@playwright/test";

/**
 * Environment-based configuration for E2E tests
 *
 * Environments:
 * - dev: dev.gsv.dev (GSVDEV development)
 * - qa: qa.digitlify.com (Digitlify QA)
 * - prod: digitlify.com (Digitlify Production)
 *
 * Set E2E_ENV=qa or E2E_ENV=prod to switch environments
 * Or set individual E2E_* variables to override specific URLs
 */

const ENV = process.env.E2E_ENV || "dev";

// Domain mapping per environment
const DOMAINS: Record<string, string> = {
  dev: "dev.gsv.dev",
  qa: "qa.digitlify.com",
  prod: "digitlify.com",
};

const BASE_DOMAIN = DOMAINS[ENV] || DOMAINS.dev;

export const TEST_ACCOUNTS = {
  buyer: {
    email: process.env.E2E_BUYER_EMAIL || `buyer@test.${BASE_DOMAIN}`,
    password: process.env.E2E_BUYER_PASSWORD || "Test123!",
  },
  seller: {
    email: process.env.E2E_SELLER_EMAIL || `seller@test.${BASE_DOMAIN}`,
    password: process.env.E2E_SELLER_PASSWORD || "Test123!",
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || `admin@${BASE_DOMAIN}`,
    password: process.env.E2E_ADMIN_PASSWORD || "Admin123!",
  },
};

/**
 * Service URLs for E2E Testing
 *
 * FQDN Architecture:
 * - {domain}: Main site + Marketplace (Next.js serving Saleor storefront)
 * - shop.{domain}: Saleor Commerce API (GraphQL backend)
 * - admin.{domain}: Saleor Dashboard (admin UI)
 * - cp.{domain}: Control Plane API (Django/DRF)
 * - api.{domain}: Gateway API (FastAPI - execution entrypoint)
 * - sso.{domain}: Keycloak SSO (OIDC provider)
 * - runtime.{domain}: Langflow Runtime (agent execution)
 * - studio.{domain}: Langflow Studio (flow builder IDE)
 * - rag.{domain}: Ragflow (RAG backend)
 *
 * Note: CMS (Wagtail) is headless, content served via Next.js routes
 */
export const URLS = {
  // Main site - Next.js serves both marketing pages and marketplace
  site: process.env.E2E_BASE_URL || `https://${BASE_DOMAIN}`,
  marketplace: process.env.E2E_BASE_URL || `https://${BASE_DOMAIN}`,

  // Commerce (Saleor)
  saleor: process.env.E2E_SALEOR_URL || `https://shop.${BASE_DOMAIN}`,
  saleorGraphQL: process.env.E2E_SALEOR_GRAPHQL_URL || `https://shop.${BASE_DOMAIN}/graphql/`,
  dashboard: process.env.E2E_DASHBOARD_URL || `https://admin.${BASE_DOMAIN}`,

  // Platform APIs
  controlPlane: process.env.E2E_CP_URL || `https://cp.${BASE_DOMAIN}`,
  gateway: process.env.E2E_API_URL || `https://api.${BASE_DOMAIN}`,

  // Auth
  keycloak: process.env.E2E_SSO_URL || `https://sso.${BASE_DOMAIN}`,

  // Execution
  runtime: process.env.E2E_RUNTIME_URL || `https://runtime.${BASE_DOMAIN}`,
  studio: process.env.E2E_STUDIO_URL || `https://studio.${BASE_DOMAIN}`,

  // RAG
  rag: process.env.E2E_RAG_URL || `https://rag.${BASE_DOMAIN}`,
};

export const CATEGORIES = ["Agents", "Apps", "Assistants", "Automations"] as const;

export const FACETS = {
  roles: ["Customer Support", "Sales/SDR", "Marketing", "HR", "IT/Helpdesk", "Operations", "Finance"],
  capabilities: ["RAG Knowledge Base", "Tool Connectors", "Prompt Orchestration", "Multi-Agent"],
  outcomes: ["customer_support", "sales_outreach", "hr_ops", "marketing_content"],
};

export const test = base.extend<{
  authenticatedBuyer: void;
  authenticatedSeller: void;
}>({
  authenticatedBuyer: async ({ page }, use) => {
    await page.goto("/");
    await page.click("text=Login");
    await page.waitForURL(/keycloak/);
    await page.fill("input[name=username]", TEST_ACCOUNTS.buyer.email);
    await page.fill("input[name=password]", TEST_ACCOUNTS.buyer.password);
    await page.click("input[type=submit]");
    await page.waitForURL(/marketplace/);
    await use();
  },
  authenticatedSeller: async ({ page }, use) => {
    await page.goto("/");
    await page.click("text=Login");
    await page.waitForURL(/keycloak/);
    await page.fill("input[name=username]", TEST_ACCOUNTS.seller.email);
    await page.fill("input[name=password]", TEST_ACCOUNTS.seller.password);
    await page.click("input[type=submit]");
    await page.waitForURL(/marketplace/);
    await use();
  },
});

export { expect };
