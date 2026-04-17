import { describe, expect, it } from "vitest";
import * as runtimeSecrets from "../src/index";

describe("runtime-secrets public api", () => {
  it("exports the bootstrap and adapter helpers", () => {
    expect(typeof runtimeSecrets.bootstrapSecretStore).toBe("function");
    expect(typeof runtimeSecrets.createServiceSecretBootstrap).toBe("function");
    expect(typeof runtimeSecrets.getServiceSecretRefs).toBe("function");
  });
});
