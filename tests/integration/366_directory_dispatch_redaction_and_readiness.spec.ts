import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  bootstrapDirectoryAndDispatchCredentials,
  buildDirectorySourceManifest,
  buildDispatchProviderBindingManifest,
  buildSecretReferenceManifest,
  containsSecretLeak,
  redactSensitiveText,
  validateDirectoryDispatchControlPlaneDocuments,
  verifyDirectoryAndDispatchReadiness,
} from "../../scripts/pharmacy/366_directory_dispatch_credentials_lib.ts";

describe("366 redaction and readiness", () => {
  it("redacts secret locators and marks them as unsafe before redaction", async () => {
    const secretManifest = await buildSecretReferenceManifest();
    const raw =
      "bind secret://vecells/nonprod/dev/pharmacy/dohs/client-secret before submit";

    expect(containsSecretLeak(raw, secretManifest)).toBe(true);

    const redacted = redactSensitiveText(raw, secretManifest);
    expect(redacted).toContain("[redacted:");
    expect(containsSecretLeak(redacted, secretManifest)).toBe(false);
  });

  it("fails closed when a dispatch binding drifts from the provider capability tuple", async () => {
    const directoryManifest = await buildDirectorySourceManifest();
    const dispatchManifest = await buildDispatchProviderBindingManifest();
    const secretManifest = await buildSecretReferenceManifest();

    const drifted = {
      ...dispatchManifest,
      bindings: dispatchManifest.bindings.map((binding, index) =>
        index === 0
          ? { ...binding, providerCapabilityTupleHash: "cap_drifted" }
          : binding,
      ),
    };

    const result = await validateDirectoryDispatchControlPlaneDocuments(
      directoryManifest,
      drifted,
      secretManifest,
    );
    expect(result.issues).toContain("CAPABILITY_TUPLE_DRIFT:binding_366_bars_dev_riverside");
  });

  it("produces readiness evidence that keeps manual bridge rows explicit", async () => {
    const outputDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "vecells-366-readiness-"),
    );
    await bootstrapDirectoryAndDispatchCredentials({
      outputDir,
      mode: "apply",
      sourceIds: [
        "source_366_dohs_dev_riverside",
        "source_366_registry_dev_market_square",
      ],
      bindingIds: [
        "binding_366_bars_dev_riverside",
        "binding_366_nhsmail_dev_market_square",
      ],
    });

    const summary = await verifyDirectoryAndDispatchReadiness(outputDir);
    expect(
      summary.byEnvironment.find(
        (entry) => entry.environmentId === "development_local_twin",
      )?.readinessState,
    ).toBe("verified");
    expect(
      summary.dispatchChecks.find(
        (entry) => entry.bindingId === "binding_366_mesh_training_hilltop",
      )?.decisionClasses,
    ).toContain("manual_bridge_required");
    expect(
      fs.existsSync(
        path.join(outputDir, "366_directory_dispatch_readiness_summary.json"),
      ),
    ).toBe(true);
  });
});
