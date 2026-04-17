import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.ts";
import { createRuntime } from "../src/runtime.ts";

describe("api-gateway dependency degradation integration", () => {
  let runtime;

  afterEach(async () => {
    if (runtime) {
      await runtime.stop();
      runtime = undefined;
    }
  });

  it("resolves bounded gateway fallback decisions through authority evaluation", async () => {
    const config = loadConfig({
      VECELLS_ENVIRONMENT: "test",
      API_GATEWAY_SERVICE_PORT: "0",
      API_GATEWAY_ADMIN_PORT: "0",
      API_GATEWAY_RATE_LIMIT_PER_MINUTE: "180",
    });

    runtime = createRuntime(config);
    await runtime.start();

    const response = await fetch(`http://127.0.0.1:${runtime.ports.service}/authority/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        gatewayServiceRef: "agws_patient_web",
        routeFamilyRef: "rf_patient_home",
        operationKind: "read",
        dependencyCode: "dep_nhs_login_rail",
        observedFailureModeClass: "callback_ambiguity",
        healthState: "degraded",
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.degradationDecision.decisionState).toBe("degraded");
    expect(body.degradationDecision.gatewayReadMode).toBe("read_only");
    expect(body.degradationDecision.browserMutationMode).toBe("refuse");
    expect(body.degradationDecision.primaryAudienceFallback.fallbackMode).toBe(
      "patient_safe_placeholder",
    );
  });
});
