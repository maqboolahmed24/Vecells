import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  bootstrapDirectoryAndDispatchCredentials,
  buildDirectorySourceManifest,
  buildDispatchProviderBindingManifest,
  buildSecretReferenceManifest,
  materializeDirectoryDispatchTrackedArtifacts,
  readAndValidateDirectoryDispatchControlPlane,
  validateDirectoryDispatchControlPlaneDocuments,
} from "../../scripts/pharmacy/366_directory_dispatch_credentials_lib.ts";

describe("366 directory and dispatch control plane", () => {
  it("validates the generated manifest set without drift", async () => {
    const result = await validateDirectoryDispatchControlPlaneDocuments(
      await buildDirectorySourceManifest(),
      await buildDispatchProviderBindingManifest(),
      await buildSecretReferenceManifest(),
    );

    expect(result.issues).toEqual([]);
  });

  it("materializes tracked config artifacts and reads them back", async () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "vecells-366-materialize-"),
    );

    await materializeDirectoryDispatchTrackedArtifacts(rootDir);
    const loaded = await readAndValidateDirectoryDispatchControlPlane(rootDir);

    expect(loaded.directoryManifest.sources.length).toBeGreaterThan(0);
    expect(loaded.dispatchManifest.bindings.length).toBeGreaterThan(0);
    expect(loaded.secretManifest.secrets.length).toBeGreaterThan(0);
  });

  it("writes only fully automated rows on local apply and becomes idempotent", async () => {
    const outputDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "vecells-366-bootstrap-"),
    );

    const first = await bootstrapDirectoryAndDispatchCredentials({
      outputDir,
      mode: "apply",
    });
    const second = await bootstrapDirectoryAndDispatchCredentials({
      outputDir,
      mode: "apply",
    });

    expect(
      first.actions.some((entry) => entry.action === "configured"),
    ).toBe(true);
    expect(
      second.actions.some((entry) => entry.action === "already_current"),
    ).toBe(true);
    expect(
      first.actions.some((entry) => entry.action === "manual_bridge_required"),
    ).toBe(true);
  });
});
