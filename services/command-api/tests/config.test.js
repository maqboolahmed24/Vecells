import { describe, expect, it } from "vitest";
import { loadConfig, redactConfig } from "../src/config.ts";

describe("command-api config", () => {
  it("loads secure defaults", () => {
    const config = loadConfig({
      VECELLS_ENVIRONMENT: "test",
    });

    expect(config.serviceName).toBe("command-api");
    expect(config.servicePort).toBe(7101);
    expect(config.adminPort).toBe(7201);
    expect(config.secretRefs.length).toBe(2);
    expect(config.idempotencyTtlSeconds).toBe(900);
    expect(config.outboxTopic).toBe("command.outbox.pending");
    expect(config.mutationGateMode).toBe("named_review");
    expect(config.routeIntentMode).toBe("required");

    const redacted = redactConfig(config);
    expect(redacted.secretRefs).toEqual([...config.secretRefs]);
  });

  it("fails closed on invalid env", () => {
    expect(() =>
      loadConfig({
        VECELLS_ENVIRONMENT: "test",
        COMMAND_API_IDEMPOTENCY_TTL_SECONDS: "invalid",
      }),
    ).toThrow(/Invalid/);
  });
});
