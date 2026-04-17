import { describe, expect, it } from "vitest";
import { loadConfig, redactConfig } from "../src/config.ts";

describe("notification-worker config", () => {
  it("loads secure defaults", () => {
    const config = loadConfig({
      VECELLS_ENVIRONMENT: "test",
    });

    expect(config.serviceName).toBe("notification-worker");
    expect(config.servicePort).toBe(7103);
    expect(config.adminPort).toBe(7203);
    expect(config.secretRefs.length).toBe(3);
    expect(config.dispatchBatchSize).toBe(50);
    expect(config.providerMode).toBe("simulator");
    expect(config.callbackSettlementWindowSeconds).toBe(300);
    expect(config.resendGuardMode).toBe("manual_review");

    const redacted = redactConfig(config);
    expect(redacted.secretRefs).toEqual([...config.secretRefs]);
  });

  it("fails closed on invalid env", () => {
    expect(() =>
      loadConfig({
        VECELLS_ENVIRONMENT: "test",
        NOTIFICATION_WORKER_DISPATCH_BATCH_SIZE: "invalid",
      }),
    ).toThrow(/Invalid/);
  });
});
