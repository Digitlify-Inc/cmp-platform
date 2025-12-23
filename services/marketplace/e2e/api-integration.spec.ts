import { test, expect } from "@playwright/test";

const URLS = {
  saleor: "https://store.dev.gsv.dev/graphql/",
  controlPlane: "https://cp.dev.gsv.dev",
  site: "https://dev.gsv.dev",
};

test.describe("Saleor GraphQL API", () => {
  test("Products query returns data", async ({ request }) => {
    const response = await request.post(URLS.saleor, {
      data: {
        query: `
          query {
            products(first: 10, channel: "default-channel") {
              edges {
                node {
                  id
                  name
                  slug
                }
              }
            }
          }
        `,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(body.data.products).toBeDefined();
  });

  test("Collections query returns data", async ({ request }) => {
    const response = await request.post(URLS.saleor, {
      data: {
        query: `
          query {
            collections(first: 10, channel: "default-channel") {
              edges {
                node {
                  id
                  name
                  slug
                }
              }
            }
          }
        `,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data).toBeDefined();
  });

  test("Channel query returns default-channel", async ({ request }) => {
    const response = await request.post(URLS.saleor, {
      data: {
        query: `
          query {
            channel(slug: "default-channel") {
              id
              name
              slug
              isActive
            }
          }
        `,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.channel.slug).toBe("default-channel");
    expect(body.data.channel.isActive).toBe(true);
  });
});

test.describe("Control Plane API", () => {
  test("Health check endpoint responds", async ({ request }) => {
    const response = await request.get(`${URLS.controlPlane}/health/`);
    expect(response.status()).toBe(200);
  });

  test("Offerings endpoint returns data", async ({ request }) => {
    const response = await request.get(`${URLS.controlPlane}/offerings/`);
    
    // Offerings are public - should return 200
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.count).toBeGreaterThanOrEqual(0);
    expect(body.results).toBeInstanceOf(Array);
  });

  test("Organizations endpoint requires auth", async ({ request }) => {
    const response = await request.get(`${URLS.controlPlane}/orgs/`);
    
    // Should require authentication
    expect([401, 403]).toContain(response.status());
  });
});

test.describe("Main Site + Marketplace Health", () => {
  test("Site health check responds", async ({ request }) => {
    const response = await request.get(`${URLS.site}/api/health`);
    expect(response.status()).toBe(200);
  });

  test("Site serves HTML", async ({ request }) => {
    const response = await request.get(URLS.site);
    expect(response.status()).toBe(200);
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("text/html");
  });

  test("Marketplace route is accessible", async ({ request }) => {
    const response = await request.get(`${URLS.site}/marketplace`);
    expect(response.status()).toBe(200);
  });
});

test.describe("SSO Health", () => {
  test("Keycloak realm is accessible", async ({ request }) => {
    const response = await request.get("https://sso.dev.gsv.dev/realms/gsv/.well-known/openid-configuration");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.issuer).toBeDefined();
    expect(body.authorization_endpoint).toBeDefined();
  });
});

test.describe("Dashboard Health", () => {
  test("Saleor Dashboard serves UI", async ({ request }) => {
    const response = await request.get("https://admin.dev.gsv.dev/");
    expect(response.status()).toBe(200);
  });
});
