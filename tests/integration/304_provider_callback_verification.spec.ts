import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  bootstrapProviderSandboxes,
  buildProviderCallbackManifest,
  buildProviderSandboxRegistry,
  resetProviderSandboxes,
  verifyProviderCallbacks,
} from "../../scripts/providers/304_provider_sandbox_lib.ts";

const TEST_OUTPUT_DIR = path.resolve(
  process.cwd(),
  ".artifacts",
  "provider-sandboxes",
  "304-integration",
);

describe("304 provider callback verification", () => {
  it("keeps callback verification bound to runtime registration state and replay-safe decisions", async () => {
    await resetProviderSandboxes({ outputDir: TEST_OUTPUT_DIR });

    const registry = await buildProviderSandboxRegistry();
    const manifest = await buildProviderCallbackManifest();
    const bootstrap = await bootstrapProviderSandboxes({ outputDir: TEST_OUTPUT_DIR });
    const verification = await verifyProviderCallbacks({ outputDir: TEST_OUTPUT_DIR });

    expect(registry.sandboxes).toHaveLength(7);
    expect(manifest.callbacks).toHaveLength(7);

    expect(
      bootstrap.actions.find(
        (action) => action.sandboxId === "sandbox_304_vecells_local_gateway_local_twin",
      )?.action,
    ).toBe("configured");
    expect(
      bootstrap.actions.find(
        (action) => action.sandboxId === "sandbox_304_vecells_local_gateway_sandbox_twin",
      )?.action,
    ).toBe("configured");
    expect(
      bootstrap.actions.find(
        (action) => action.sandboxId === "sandbox_304_optum_im1_supported_test",
      )?.action,
    ).toBe("manual_bridge_required");

    expect(
      verification.callbackChecks.find(
        (row) => row.callbackId === "callback_304_vecells_local_gateway_local_twin",
      ),
    ).toMatchObject({
      state: "verified",
      receiptDecisionClasses: ["accepted_new", "semantic_replay", "stale_ignored"],
    });
    expect(
      verification.callbackChecks.find(
        (row) => row.callbackId === "callback_304_vecells_local_gateway_sandbox_twin",
      ),
    ).toMatchObject({
      state: "verified",
      receiptDecisionClasses: ["accepted_new", "semantic_replay", "stale_ignored"],
    });
    expect(
      verification.callbackChecks.find(
        (row) => row.callbackId === "callback_304_tpp_im1_transaction_supported_test",
      ),
    ).toMatchObject({
      state: "manual_bridge_required",
      receiptDecisionClasses: [],
    });
    expect(
      verification.callbackChecks.find(
        (row) => row.callbackId === "callback_304_optum_im1_supported_test",
      ),
    ).toMatchObject({
      state: "verified",
      receiptDecisionClasses: [],
    });
    expect(
      verification.callbackChecks.find(
        (row) => row.callbackId === "callback_304_gp_connect_integration_candidate",
      ),
    ).toMatchObject({
      state: "not_applicable",
      receiptDecisionClasses: [],
    });
  });
});
