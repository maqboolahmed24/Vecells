import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.ts";
import { createRuntime } from "../src/runtime.ts";
import { serviceDefinition } from "../src/service-definition.ts";

describe("projection-worker runtime", () => {
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
      PROJECTION_WORKER_SERVICE_PORT: "0",
      PROJECTION_WORKER_ADMIN_PORT: "0",
      PROJECTION_WORKER_CONSUMER_BATCH_SIZE: "25",
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

    const correlationId = "corr-projection-worker";
    const routeResponse = await fetch(`http://127.0.0.1:${runtime.ports.service}/events/intake`, {
      method: "POST",
      headers: { "x-correlation-id": correlationId, "content-type": "application/json" },
      body: JSON.stringify({
        eventType: "projection.placeholder.rebuild",
        projectionName: "patient-home",
      }),
    });
    expect(routeResponse.status).toBe(200);
    expect(routeResponse.headers.get("x-correlation-id")).toBe(correlationId);
    const body = await routeResponse.json();
    expect(body.deadLetter.topic).toBe(config.deadLetterTopic);
  });
});
