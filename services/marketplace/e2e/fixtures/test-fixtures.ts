import { test as base, expect } from "@playwright/test";

export const TEST_ACCOUNTS = {
  buyer: {
    email: "buyer@test.gsv.dev",
    password: "Test123!",
  },
  seller: {
    email: "seller@test.gsv.dev",
    password: "Test123!",
  },
  admin: {
    email: "admin@dev.gsv.dev",
    password: "Admin123!",
  },
};

/**
 * Service URLs for E2E Testing
 *
 * FQDN Architecture (as of 2025-12-22):
 * - dev.gsv.dev: Main site + Marketplace (Next.js serving Saleor storefront)
 * - store.dev.gsv.dev: Saleor Commerce API (GraphQL backend)
 * - admin.dev.gsv.dev: Saleor Dashboard (admin UI)
 * - cp.dev.gsv.dev: Control Plane API (Django/DRF)
 * - api.dev.gsv.dev: Gateway API (FastAPI - execution entrypoint)
 * - sso.dev.gsv.dev: Keycloak SSO (OIDC provider)
 * - runtime.dev.gsv.dev: Langflow Runtime (agent execution)
 * - studio.dev.gsv.dev: Langflow Studio (flow builder IDE)
 * - rag.dev.gsv.dev: Ragflow (RAG backend)
 *
 * Note: CMS (Wagtail) is headless, content served via Next.js routes
 */
export const URLS = {
  // Main site - Next.js serves both marketing pages and marketplace
  site: process.env.E2E_BASE_URL || "https://dev.gsv.dev",
  marketplace: process.env.E2E_BASE_URL || "https://dev.gsv.dev",

  // Commerce (Saleor)
  saleor: "https://store.dev.gsv.dev",
  saleorGraphQL: "https://store.dev.gsv.dev/graphql/",
  dashboard: "https://admin.dev.gsv.dev",

  // Platform APIs
  controlPlane: "https://cp.dev.gsv.dev",
  gateway: "https://api.dev.gsv.dev",

  // Auth
  keycloak: "https://sso.dev.gsv.dev",

  // Execution
  runtime: "https://runtime.dev.gsv.dev",
  studio: "https://studio.dev.gsv.dev",

  // RAG
  rag: "https://rag.dev.gsv.dev",
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
