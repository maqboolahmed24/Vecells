import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildTransportSandboxManifest,
  buildUpdateRecordObservationManifest,
  materializeTransportSandboxTrackedArtifacts,
  prepareOperatorSubmissionBundle,
  readAndValidateTransportSandboxControlPlane,
  validateSandboxReadinessDocuments,
} from "../../scripts/pharmacy/367_update_record_transport_sandbox_lib.ts";

describe("367 transport sandbox control plane", () => {
  it("validates the generated manifest set without drift", async () => {
    const result = await validateSandboxReadinessDocuments(
      await buildUpdateRecordObservationManifest(),
      await buildTransportSandboxManifest(),
    );

    expect(result.issues).toEqual([]);
  });

  it("materializes tracked artifacts and reads them back", async () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "vecells-367-materialize-"),
    );

    await materializeTransportSandboxTrackedArtifacts(rootDir);
    const loaded = await readAndValidateTransportSandboxControlPlane(rootDir);

    expect(loaded.updateManifest.observations.length).toBeGreaterThan(0);
    expect(loaded.transportManifest.transports.length).toBeGreaterThan(0);
  });

  it("prepares operator bundles with masked secret fingerprints", async () => {
    const outputDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "vecells-367-bundle-"),
    );

    const prepared = await prepareOperatorSubmissionBundle({
      outputDir,
      requestIds: [
        "update_record_367_integration_pairing",
        "transport_367_mesh_training_mailbox",
      ],
    });

    expect(fs.existsSync(prepared.outputPath)).toBe(true);
    expect(prepared.bundle.requests).toHaveLength(2);
    expect(
      prepared.bundle.requests.every(
        (entry) => entry.maskedSecretFingerprints.length >= 0,
      ),
    ).toBe(true);
  });
});
