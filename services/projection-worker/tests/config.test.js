import { describe, expect, it } from "vitest";
import { loadConfig, redactConfig } from "../src/config.ts";

describe("projection-worker config", () => {
  it("loads secure defaults", () => {
    const config = loadConfig({
      VECELLS_ENVIRONMENT: "test",
    });

    expect(config.serviceName).toBe("projection-worker");
    expect(config.serviceHost).toBe("127.0.0.1");
    expect(config.servicePort).toBe(7102);
    expect(config.adminHost).toBe("127.0.0.1");
    expect(config.adminPort).toBe(7202);
    expect(config.secretRefs.length).toBe(2);
    expect(config.consumerBatchSize).toBe(25);
    expect(config.freshnessBudgetSeconds).toBe(45);
    expect(config.deadLetterTopic).toBe("projection.dead-lettered");
    expect(config.rebuildWindowMode).toBe("scheduled");
    expect(config.poisonRetryLimit).toBe(3);

    const redacted = redactConfig(config);
    expect(redacted.secretRefs).toEqual([...config.secretRefs]);
  });

  it("fails closed on invalid env", () => {
    expect(() =>
      loadConfig({
        VECELLS_ENVIRONMENT: "test",
        PROJECTION_WORKER_CONSUMER_BATCH_SIZE: "invalid",
      }),
    ).toThrow(/Invalid/);
  });

  it("can read Render-style host and PORT values", () => {
    const config = loadConfig({
      VECELLS_ENVIRONMENT: "production",
      HOST: "0.0.0.0",
      PORT: "10000",
      PROJECTION_WORKER_ADMIN_HOST: "127.0.0.1",
      PROJECTION_WORKER_ADMIN_PORT: "0",
    });

    expect(config.serviceHost).toBe("0.0.0.0");
    expect(config.servicePort).toBe(10000);
    expect(config.adminHost).toBe("127.0.0.1");
    expect(config.adminPort).toBe(0);
  });
});
