import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.ts";
import { createRuntime } from "../src/runtime.ts";
import { serviceDefinition } from "../src/service-definition.ts";

describe("command-api runtime", () => {
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
      COMMAND_API_SERVICE_PORT: "0",
      COMMAND_API_ADMIN_PORT: "0",
      COMMAND_API_IDEMPOTENCY_TTL_SECONDS: "900",
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

    const correlationId = "corr-command-api";
    const routeResponse = await fetch(`http://127.0.0.1:${runtime.ports.service}/commands/submit`, {
      method: "POST",
      headers: {
        "x-correlation-id": correlationId,
        "idempotency-key": "idem-test-001",
        "content-type": "application/json",
      },
      body: JSON.stringify({ routeIntent: "rf_patient_home", channel: "test-envelope" }),
    });
    expect(routeResponse.status).toBe(200);
    expect(routeResponse.headers.get("x-correlation-id")).toBe(correlationId);
    const body = await routeResponse.json();
    expect(body.outbox.topic).toBe(config.outboxTopic);
  });
});
