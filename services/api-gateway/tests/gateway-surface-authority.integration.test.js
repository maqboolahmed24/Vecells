import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.ts";
import { createRuntime } from "../src/runtime.ts";

describe("api-gateway gateway surface authority endpoints", () => {
  let runtime;

  afterEach(async () => {
    if (runtime) {
      await runtime.stop();
      runtime = undefined;
    }
  });

  it("publishes audience-specific gateway authority and OpenAPI documents", async () => {
    const config = loadConfig({
      VECELLS_ENVIRONMENT: "test",
      API_GATEWAY_SERVICE_PORT: "0",
      API_GATEWAY_ADMIN_PORT: "0",
    });

    runtime = createRuntime(config);
    await runtime.start();

    const authorityResponse = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/authority/surfaces?gatewayServiceRef=agws_pharmacy_console`,
    );
    expect(authorityResponse.status).toBe(200);
    const authorityBody = await authorityResponse.json();
    expect(authorityBody.gatewayServices).toHaveLength(1);
    expect(authorityBody.gatewayServices[0].gatewayServiceRef).toBe("agws_pharmacy_console");
    expect(authorityBody.routePublications[0].routeFamilyRef).toBe("rf_pharmacy_console");
    expect(authorityBody.boundaryRows.some((row) => row.boundary_state === "blocked")).toBe(true);

    const openApiResponse = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/authority/openapi?gatewayServiceRef=agws_pharmacy_console`,
    );
    expect(openApiResponse.status).toBe(200);
    const openApiBody = await openApiResponse.json();
    expect(openApiBody.documents).toHaveLength(1);
    expect(openApiBody.documents[0].document.paths).toHaveProperty(
      "/audiences/pharmacy-console/routes/rf_pharmacy_console/read",
    );
    expect(openApiBody.documents[0].document.paths).toHaveProperty(
      "/audiences/pharmacy-console/routes/rf_pharmacy_console/mutation",
    );
  });

  it("allows declared contracts and rejects undeclared boundaries or cache/stream semantics", async () => {
    const config = loadConfig({
      VECELLS_ENVIRONMENT: "test",
      API_GATEWAY_SERVICE_PORT: "0",
      API_GATEWAY_ADMIN_PORT: "0",
    });

    runtime = createRuntime(config);
    await runtime.start();

    const allowedMutation = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/authority/evaluate`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          gatewayServiceRef: "agws_pharmacy_console",
          routeFamilyRef: "rf_pharmacy_console",
          operationKind: "mutation",
          contractRef: "MCC_050_RF_PHARMACY_CONSOLE_V1",
          downstreamWorkloadFamilyRef: "wf_command_orchestration",
          sessionPolicyRef: "SP_PHARMACY_SERVICING_SCOPE",
        }),
      },
    );
    expect(allowedMutation.status).toBe(200);
    const allowedBody = await allowedMutation.json();
    expect(allowedBody.ok).toBe(true);
    expect(allowedBody.gatewaySurfaceRef).toBe("gws_pharmacy_console");

    const forbiddenDownstream = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/authority/evaluate`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          gatewayServiceRef: "agws_pharmacy_console",
          routeFamilyRef: "rf_pharmacy_console",
          operationKind: "mutation",
          contractRef: "MCC_050_RF_PHARMACY_CONSOLE_V1",
          downstreamWorkloadFamilyRef: "wf_integration_dispatch",
        }),
      },
    );
    expect(forbiddenDownstream.status).toBe(403);
    const forbiddenDownstreamBody = await forbiddenDownstream.json();
    expect(forbiddenDownstreamBody.error).toBe("DOWNSTREAM_WORKLOAD_FAMILY_FORBIDDEN");

    const forbiddenAdapter = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/authority/evaluate`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          gatewayServiceRef: "agws_pharmacy_console",
          routeFamilyRef: "rf_pharmacy_console",
          operationKind: "read",
          contractRef: "PQC_050_RF_PHARMACY_CONSOLE_V1",
          requestsAdapterEgress: true,
        }),
      },
    );
    expect(forbiddenAdapter.status).toBe(403);
    const forbiddenAdapterBody = await forbiddenAdapter.json();
    expect(forbiddenAdapterBody.error).toBe("DIRECT_ADAPTER_EGRESS_FORBIDDEN");

    const missingStream = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/authority/evaluate`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          gatewayServiceRef: "agws_patient_web",
          routeFamilyRef: "rf_intake_self_service",
          operationKind: "stream",
        }),
      },
    );
    expect(missingStream.status).toBe(409);
    const missingStreamBody = await missingStream.json();
    expect(missingStreamBody.error).toBe("LIVE_CHANNEL_UNDECLARED");

    const wrongCache = await fetch(`http://127.0.0.1:${runtime.ports.service}/authority/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        gatewayServiceRef: "agws_pharmacy_console",
        routeFamilyRef: "rf_pharmacy_console",
        operationKind: "cache",
        cachePolicyRef: "CP_PUBLIC_NO_PERSISTED_PHI",
      }),
    });
    expect(wrongCache.status).toBe(409);
    const wrongCacheBody = await wrongCache.json();
    expect(wrongCacheBody.error).toBe("CACHE_POLICY_UNDECLARED");

    const blockedPublication = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/authority/evaluate`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          gatewayServiceRef: "agws_clinical_workspace",
          routeFamilyRef: "rf_assistive_control_shell",
          operationKind: "read",
        }),
      },
    );
    expect(blockedPublication.status).toBe(409);
    const blockedPublicationBody = await blockedPublication.json();
    expect(blockedPublicationBody.error).toBe("SURFACE_PUBLICATION_BLOCKED");
  });
});
