import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.ts";
import { createRuntime } from "../src/runtime.ts";

describe("api-gateway contract registry endpoint", () => {
  let runtime;

  afterEach(async () => {
    if (runtime) {
      await runtime.stop();
      runtime = undefined;
    }
  });

  it("returns route-family, audience, gateway, and digest lookups", async () => {
    const config = loadConfig({
      VECELLS_ENVIRONMENT: "test",
      API_GATEWAY_SERVICE_PORT: "0",
      API_GATEWAY_ADMIN_PORT: "0",
      API_GATEWAY_RATE_LIMIT_PER_MINUTE: "180",
    });

    runtime = createRuntime(config);
    await runtime.start();

    const routeResponse = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/contracts/registry?routeFamilyRef=rf_patient_requests`,
    );
    expect(routeResponse.status).toBe(200);
    const routeBody = await routeResponse.json();
    expect(routeBody.routeFamilyBundles).toHaveLength(1);
    expect(routeBody.routeFamilyBundles[0].routeFamilyRef).toBe("rf_patient_requests");

    const audienceResponse = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/contracts/registry?audienceSurface=audsurf_patient_authenticated_portal`,
    );
    expect(audienceResponse.status).toBe(200);
    const audienceBody = await audienceResponse.json();
    expect(audienceBody.routeFamilyBundles).toHaveLength(5);

    const gatewayResponse = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/contracts/registry?gatewaySurfaceRef=gws_patient_home`,
    );
    expect(gatewayResponse.status).toBe(200);
    const gatewayBody = await gatewayResponse.json();
    expect(gatewayBody.routeFamilyBundles).toHaveLength(1);
    expect(gatewayBody.routeFamilyBundles[0].routeFamilyRef).toBe("rf_patient_home");

    const digestResponse = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/contracts/registry?contractDigestRef=projection-query-digest::938aa4fecf715a10`,
    );
    expect(digestResponse.status).toBe(200);
    const digestBody = await digestResponse.json();
    expect(digestBody.contract.projectionQueryContractId).toBe("PQC_050_RF_PATIENT_REQUESTS_V1");
    expect(digestBody.routeFamilyBundles[0].routeFamilyRef).toBe("rf_patient_requests");

    const missingDigestResponse = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/contracts/registry?contractDigestRef=projection-query-digest::missing`,
    );
    expect(missingDigestResponse.status).toBe(404);
  });
});
