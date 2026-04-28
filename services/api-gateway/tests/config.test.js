import { describe, expect, it } from "vitest";
import { loadConfig, redactConfig } from "../src/config.ts";

describe("api-gateway config", () => {
  it("loads secure defaults", () => {
    const config = loadConfig({
      VECELLS_ENVIRONMENT: "test",
    });

    expect(config.serviceName).toBe("api-gateway");
    expect(config.serviceHost).toBe("127.0.0.1");
    expect(config.servicePort).toBe(7100);
    expect(config.adminHost).toBe("127.0.0.1");
    expect(config.adminPort).toBe(7200);
    expect(config.secretRefs.length).toBe(2);
    expect(config.rateLimitPerMinute).toBe(180);
    expect(config.authEdgeMode).toBe("hybrid");
    expect(config.routeFreezeMode).toBe("observe");

    const redacted = redactConfig(config);
    expect(redacted.secretRefs).toEqual([...config.secretRefs]);
  });

  it("fails closed on invalid env", () => {
    expect(() =>
      loadConfig({
        VECELLS_ENVIRONMENT: "test",
        API_GATEWAY_RATE_LIMIT_PER_MINUTE: "invalid",
      }),
    ).toThrow(/Invalid/);
  });

  it("can read Render-style host and PORT values", () => {
    const config = loadConfig({
      VECELLS_ENVIRONMENT: "production",
      HOST: "0.0.0.0",
      PORT: "10000",
      API_GATEWAY_ADMIN_HOST: "127.0.0.1",
      API_GATEWAY_ADMIN_PORT: "0",
    });

    expect(config.serviceHost).toBe("0.0.0.0");
    expect(config.servicePort).toBe(10000);
    expect(config.adminHost).toBe("127.0.0.1");
    expect(config.adminPort).toBe(0);
  });
});
