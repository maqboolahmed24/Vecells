import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.ts";
import { createRuntime } from "../src/runtime.ts";

describe("command-api dependency degradation integration", () => {
  let runtime;

  afterEach(async () => {
    if (runtime) {
      await runtime.stop();
      runtime = undefined;
    }
  });

  it("freezes mutation authority when the degradation engine returns command halt", async () => {
    const config = loadConfig({
      VECELLS_ENVIRONMENT: "test",
      COMMAND_API_SERVICE_PORT: "0",
      COMMAND_API_ADMIN_PORT: "0",
      COMMAND_API_IDEMPOTENCY_TTL_SECONDS: "900",
    });

    runtime = createRuntime(config);
    await runtime.start();

    const response = await fetch(`http://127.0.0.1:${runtime.ports.service}/commands/submit`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "idem-degradation-001",
        "x-correlation-id": "corr-command-degradation",
      },
      body: JSON.stringify({
        routeIntent: "rf_patient_appointments",
        dependencyCode: "dep_local_booking_supplier_adapters",
        observedFailureModeClass: "accepted_pending_stall",
        healthState: "degraded",
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.accepted).toBe(false);
    expect(body.degradation.browserMutationMode).toBe("refuse");
    expect(body.settlement.state).toBe("halted_by_dependency_degradation");
    expect(body.outbox.status).toBe("withheld_by_degradation");
  });
});
