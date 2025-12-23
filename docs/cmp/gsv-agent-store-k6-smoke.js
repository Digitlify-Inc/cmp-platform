/**
 * GSV Agent Store — k6 smoke test (Integration Contracts Pack v1)
 * Generated from 19-Integration-Contracts-Pack-v1.md
 *
 * One-command run (example):
 *   k6 run \
 *     -e API_BASE="https://api.example.com" \
 *     -e CP_BASE="https://cp.example.com" \
 *     -e USER_JWT="<user access token>" \
 *     -e SERVICE_JWT="<service jwt>" \
 *     -e OFFERING_VERSION_ID="ov_100" \
 *     -e PLAN_ID="pro" \
 *     gsv-agent-store-k6-smoke.js
 *
 * Optional toggles:
 *   -e USE_COMMERCE_FLOW="0"            # default 0: use CP /instances create; 1: use /integrations/saleor/order-paid
 *   -e RUN_GATEWAY_ONLY="1"            # default 1: do not call CP authorize/settle directly (Gateway does it)
 *   -e CREATE_CONNECTOR_BINDING="0"     # default 0
 *   -e TEST_RAG="0"                    # default 0
 *
 * Required env vars:
 *   API_BASE, CP_BASE, USER_JWT, SERVICE_JWT, OFFERING_VERSION_ID, PLAN_ID
 *
 * If you already have ids, you may set:
 *   ORG_ID, PROJECT_ID, WALLET_ID, INSTANCE_ID
 */

import http from "k6/http";
import { check, sleep, fail } from "k6";

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ["rate<0.01"],
  },
};

function hdrs(extra) {
  return Object.assign({
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-Request-Id": __ENV.X_REQUEST_ID || `${Date.now()}-${Math.random()}`,
  }, extra || {});
}

function authUser(extra) {
  return hdrs(Object.assign({
    "Authorization": `Bearer ${__ENV.USER_JWT}`,
  }, extra || {}));
}

function authService(extra) {
  return hdrs(Object.assign({
    "Authorization": `Bearer ${__ENV.SERVICE_JWT}`,
  }, extra || {}));
}

function j(res) {
  try { return res.json(); } catch (e) { return null; }
}

function postJson(url, headers, body) {
  return http.post(url, JSON.stringify(body || {}), { headers });
}

function get(url, headers) {
  return http.get(url, { headers });
}

function waitForActive(cpBase, instanceId, maxSeconds) {
  const start = Date.now();
  while ((Date.now() - start) < maxSeconds * 1000) {
    const res = get(`${cpBase}/instances/${instanceId}`, authUser());
    if (res.status === 200) {
      const data = j(res);
      if (data && String(data.state).toLowerCase() === "active") return true;
    }
    sleep(2);
  }
  return false;
}

export default function () {
  const API_BASE = __ENV.API_BASE;
  const CP_BASE  = __ENV.CP_BASE;

  if (!API_BASE || !CP_BASE || !__ENV.USER_JWT || !__ENV.SERVICE_JWT || !__ENV.OFFERING_VERSION_ID || !__ENV.PLAN_ID) {
    fail("Missing required env vars: API_BASE, CP_BASE, USER_JWT, SERVICE_JWT, OFFERING_VERSION_ID, PLAN_ID");
  }

  const USE_COMMERCE_FLOW = (__ENV.USE_COMMERCE_FLOW || "0") === "1";
  const RUN_GATEWAY_ONLY  = (__ENV.RUN_GATEWAY_ONLY || "1") === "1";
  const CREATE_CONNECTOR_BINDING = (__ENV.CREATE_CONNECTOR_BINDING || "0") === "1";
  const TEST_RAG = (__ENV.TEST_RAG || "0") === "1";

  // Step 1: ensure workspace (org/project/wallet)
  let orgId = __ENV.ORG_ID;
  let projectId = __ENV.PROJECT_ID;
  let walletId = __ENV.WALLET_ID;

  if (!orgId || !projectId || !walletId) {
    const resWs = postJson(`${CP_BASE}/orgs/auto`, authUser(), {});
    check(resWs, {"CP /orgs/auto 200": r => r.status === 200}) || fail(`orgs/auto failed: ${resWs.status} ${resWs.body}`);
    const ws = j(resWs);
    orgId = ws.orgId; projectId = ws.projectId; walletId = ws.walletId;
  }

  // Step 2: create instance (activation)
  let instanceId = __ENV.INSTANCE_ID;
  if (!instanceId) {
    if (USE_COMMERCE_FLOW) {
      const orderId = __ENV.SALEOR_ORDER_ID || "T3JkZXI6MTIz";
      const lineId = __ENV.SALEOR_LINE_ID || "T3JkZXJMaW5lOjQ1";
      const idem = `saleor:${orderId}:${lineId}`;
      const resIn = postJson(`${CP_BASE}/integrations/saleor/order-paid`,
        authService({"Idempotency-Key": idem}),
        {
          orderId,
          occurredAt: "2025-12-17T18:36:16.279145Z",
          customerId: "buyer@example.com",
          idempotencyKey: idem,
          lines: [{ lineId, kind: "offering_plan", offeringVersionId: __ENV.OFFERING_VERSION_ID, planId: __ENV.PLAN_ID }]
        }
      );
      check(resIn, {"CP /integrations/saleor/order-paid 200": r => r.status === 200}) || fail(`order-paid failed: ${resIn.status} ${resIn.body}`);
      // Note: response may not return instanceId directly; prefer CP /instances flow for now.
      // If your CP returns instanceId in actions, add parsing here.
      fail("Commerce flow executed; set INSTANCE_ID env var or switch USE_COMMERCE_FLOW=0 to create instance directly.");
    } else {
      const idem = `ui:${orgId}:${projectId}:${Date.now()}`;
      const resInst = postJson(`${CP_BASE}/instances`,
        authUser({"Idempotency-Key": idem}),
        {
          offeringVersionId: __ENV.OFFERING_VERSION_ID,
          orgId,
          projectId,
          planId: __ENV.PLAN_ID,
          instanceName: "Smoke Instance",
          overrides: {}
        }
      );
      check(resInst, {"CP /instances 201/200": r => r.status === 201 || r.status === 200}) || fail(`instances create failed: ${resInst.status} ${resInst.body}`);
      const inst = j(resInst);
      instanceId = inst.instanceId;
    }
  }

  // Step 3: wait for ACTIVE (GitOps)
  const active = waitForActive(CP_BASE, instanceId, 60);
  check(null, {"Instance becomes ACTIVE within 60s": _ => active}) || fail("Instance did not become ACTIVE in time (check ArgoCD sync/health).");

  // Step 4: optionally test direct billing endpoints
  if (!RUN_GATEWAY_ONLY) {
    const idemAuth = `run:${instanceId}:${Date.now()}:authorize`;
    const resAuth = postJson(`${CP_BASE}/billing/authorize`,
      authService({"Idempotency-Key": idemAuth}),
      { instanceId, requestedBudget: 5 }
    );
    check(resAuth, {"CP /billing/authorize 200": r => r.status === 200}) || fail(`authorize failed: ${resAuth.status} ${resAuth.body}`);
    const auth = j(resAuth);
    check(auth, {"Authorize allowed": a => a && a.allowed === true}) || fail("authorize returned allowed=false unexpectedly");

    const reservationId = auth.reservationId;
    const resSettle = postJson(`${CP_BASE}/billing/settle`,
      authService({"Idempotency-Key": reservationId}),
      {
        reservationId,
        instanceId,
        usage: { llm_tokens_in: 1, llm_tokens_out: 1, tool_calls: 0, requests: 1, rag_queries: 0, rag_ingestion_mb: 0 }
      }
    );
    check(resSettle, {"CP /billing/settle 200": r => r.status === 200}) || fail(`settle failed: ${resSettle.status} ${resSettle.body}`);
  }

  // Step 5: run via Gateway → Runner → Runtime
  const resRun = postJson(`${API_BASE}/v1/runs`, authUser(), {
    instanceId,
    input: { query: "Hello, help me reset my password." },
    metadata: { channel: "web", locale: "en-US" }
  });
  check(resRun, {
    "GW /v1/runs 200": r => r.status === 200,
    "GW /v1/runs not blocked by credits": r => r.status !== 403,
  }) || fail(`run failed: ${resRun.status} ${resRun.body}`);

  const runData = j(resRun);
  check(runData, {"Run response has runId": d => d && d.runId}) || fail("run response missing runId");

  // Step 6: optional connector binding sanity (CP only)
  if (CREATE_CONNECTOR_BINDING) {
    const resBind = postJson(`${CP_BASE}/connectors/bindings`, authUser(), {
      orgId, projectId,
      connectorId: __ENV.CONNECTOR_ID || "zendesk",
      displayName: "Zendesk (Smoke)",
      vaultPath: __ENV.VAULT_PATH || `kv/data/connectors/${orgId}/${projectId}/bind_zendesk_1`
    });
    check(resBind, {"CP /connectors/bindings 201/200": r => r.status === 201 || r.status === 200}) || fail(`binding failed: ${resBind.status} ${resBind.body}`);
    const bind = j(resBind);
    const bindingId = bind.bindingId;

    const resRevoke = postJson(`${CP_BASE}/connectors/bindings/${bindingId}/revoke`, authUser(), {});
    check(resRevoke, {"CP revoke 200/204": r => r.status === 200 || r.status === 204}) || fail(`revoke failed: ${resRevoke.status} ${resRevoke.body}`);
  }

  // Step 7: optional RAG presign flow (CP only)
  if (TEST_RAG) {
    const resPresign = postJson(`${CP_BASE}/instances/${instanceId}/rag/uploads:presign`, authUser(), {
      filename: "kb.pdf", contentType: "application/pdf", sizeBytes: 1024
    });
    check(resPresign, {"RAG presign 200": r => r.status === 200}) || fail(`presign failed: ${resPresign.status} ${resPresign.body}`);
    // Upload PUT to MinIO is intentionally omitted from smoke (needs local file).
  }

  // Step 8: widget init (branding + origin allowlist)
  const resWidget = postJson(`${API_BASE}/v1/widget/session:init`, hdrs(), {
    instanceId,
    origin: __ENV.ORIGIN || "https://customer-website.com"
  });
  check(resWidget, {"Widget init 200/403": r => [200,403].includes(r.status)}) || fail(`widget init unexpected: ${resWidget.status}`);

  // Done
  sleep(1);
}
