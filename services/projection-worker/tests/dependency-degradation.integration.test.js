import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.ts";
import { createRuntime } from "../src/runtime.ts";

describe("projection-worker dependency degradation integration", () => {
  let runtime;

  afterEach(async () => {
    if (runtime) {
      await runtime.stop();
      runtime = undefined;
    }
  });

  it("publishes explicit projection stale posture from the shared degradation engine", async () => {
    const config = loadConfig({
      VECELLS_ENVIRONMENT: "test",
      PROJECTION_WORKER_SERVICE_PORT: "0",
      PROJECTION_WORKER_ADMIN_PORT: "0",
      PROJECTION_WORKER_CONSUMER_BATCH_SIZE: "25",
    });

    runtime = createRuntime(config);
    await runtime.start();

    const response = await fetch(`http://127.0.0.1:${runtime.ports.service}/events/intake`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": "corr-projection-degradation",
      },
      body: JSON.stringify({
        projectionName: "support-replay",
        routeFamilyRef: "rf_support_replay_observe",
        dependencyCode: "dep_transcription_processing_provider",
        observedFailureModeClass: "transport_loss",
        healthState: "degraded",
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.degradation.projectionPublicationMode).toBe("projection_stale");
    expect(body.degradation.freshnessState).toBe("stale_review");
    expect(body.continuity.posture).toBe("projection-stale-explicit");
  });
});
