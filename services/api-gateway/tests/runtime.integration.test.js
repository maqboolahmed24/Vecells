import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.ts";
import { createRuntime } from "../src/runtime.ts";
import { serviceDefinition } from "../src/service-definition.ts";

describe("api-gateway runtime", () => {
  let runtime;

  afterEach(async () => {
    if (runtime) {
      await runtime.stop();
      runtime = undefined;
    }
  });

  it("serves health, readiness, and correlation-aware workload routes", async () => {
    const config = loadConfig({
      VECELLS_ENVIRONMENT: "test",
      API_GATEWAY_SERVICE_PORT: "0",
      API_GATEWAY_ADMIN_PORT: "0",
      API_GATEWAY_RATE_LIMIT_PER_MINUTE: "180",
    });

    runtime = createRuntime(config);
    await runtime.start();

    const healthResponse = await fetch(`http://127.0.0.1:${runtime.ports.admin}/health`);
    expect(healthResponse.status).toBe(200);
    const healthBody = await healthResponse.json();
    expect(healthBody.service).toBe(serviceDefinition.service);

    const readyResponse = await fetch(`http://127.0.0.1:${runtime.ports.admin}/ready`);
    expect(readyResponse.status).toBe(200);
    const readyBody = await readyResponse.json();
    expect(readyBody.ok).toBe(true);

    const correlationId = "corr-api-gateway";
    const routeResponse = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/ingress/surfaces`,
      {
        method: "GET",
        headers: { "x-correlation-id": correlationId, "content-type": "application/json" },
      },
    );
    expect(routeResponse.status).toBe(200);
    expect(routeResponse.headers.get("x-correlation-id")).toBe(correlationId);
    const body = await routeResponse.json();
    expect(body.rateLimitPerMinute).toBe(config.rateLimitPerMinute);
  });
});
