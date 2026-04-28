import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.ts";
import { createRuntime } from "../src/runtime.ts";

describe("api-gateway cache/channel contract governor endpoint", () => {
  let runtime;

  afterEach(async () => {
    if (runtime) {
      await runtime.stop();
      runtime = undefined;
    }
  });

  it("returns a deterministic browser runtime decision", async () => {
    const config = loadConfig({
      VECELLS_ENVIRONMENT: "test",
      API_GATEWAY_SERVICE_PORT: "0",
      API_GATEWAY_ADMIN_PORT: "0",
      API_GATEWAY_RATE_LIMIT_PER_MINUTE: "180",
    });

    runtime = createRuntime(config);
    await runtime.start();

    const response = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/runtime/cache-channel-contracts?routeFamilyRef=rf_operations_board&environmentRing=local&transportState=replay_gap&projectionFreshnessState=replay_gap`,
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.decision.routeFamilyRef).toBe("rf_operations_board");
    expect(body.decision.effectiveBrowserPosture).toBe("recovery_only");
    expect(body.decision.reasonRefs).toContain("transport_replay_gap");
    expect(body.law.cachePresenceImpliesWritableAction).toBe(false);
    expect(body.telemetryPreview).toHaveLength(1);
  });
});
