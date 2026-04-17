import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.ts";
import { createRuntime } from "../src/runtime.ts";

describe("api-gateway cache and live transport substrate endpoint", () => {
  let runtime;

  afterEach(async () => {
    if (runtime) {
      await runtime.stop();
      runtime = undefined;
    }
  });

  it("returns runtime cache and live transport substrate without conflating health and truth", async () => {
    const config = loadConfig({
      VECELLS_ENVIRONMENT: "test",
      API_GATEWAY_SERVICE_PORT: "0",
      API_GATEWAY_ADMIN_PORT: "0",
      API_GATEWAY_RATE_LIMIT_PER_MINUTE: "180",
    });

    runtime = createRuntime(config);
    await runtime.start();

    const response = await fetch(
      `http://127.0.0.1:${runtime.ports.service}/runtime/cache-live-transport?gatewaySurfaceRef=gws_operations_board&transport=websocket`,
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.filters.gatewaySurfaceRef).toBe("gws_operations_board");
    expect(body.filters.transport).toBe("websocket");
    expect(body.channels.length).toBeGreaterThan(0);
    expect(body.channels[0].gatewaySurfaceRefs).toContain("gws_operations_board");
    expect(body.honestyLaw.cacheWarmthImpliesWritable).toBe(false);
    expect(body.honestyLaw.connectionHealthImpliesFreshTruth).toBe(false);
    expect(body.scenarios.some((row) => row.scenarioId === "operations_board_heartbeat_loss")).toBe(
      true,
    );
  });
});
