import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildModelVendorKeyReferenceManifest,
  buildModelVendorProjectManifest,
  buildModelVendorRegistry,
  buildReadinessEvidence,
  containsSensitiveLeak,
  detectPrimaryConfiguredVendorFromRepository,
  materializeModelVendorSetupArtifacts,
  readAndValidateModelVendorSetup,
  redactSensitiveText,
  resolvePrimaryConfiguredVendor,
  stableFingerprintForSecretRef,
  validateModelVendorSetupDocuments,
} from "../../scripts/assistive/425_model_vendor_project_setup_lib.ts";

describe("425 model vendor project setup", () => {
  it("detects the repository primary provider as the watch-only local twin", () => {
    const detection = detectPrimaryConfiguredVendorFromRepository();

    expect(detection.primaryProviderId).toBe(
      "vecells_assistive_vendor_watch_shadow_twin",
    );
    expect(detection.detectionState).toBe("watch_only_local_twin");
    expect(detection.providerSignals).toEqual([]);
  });

  it("validates generated manifests and blocks apply", () => {
    const setup = {
      registry: buildModelVendorRegistry(),
      projectManifest: buildModelVendorProjectManifest(),
      keyReferenceManifest: buildModelVendorKeyReferenceManifest(),
    };

    const validation = validateModelVendorSetupDocuments(setup);
    const readiness = buildReadinessEvidence(setup, "verify");

    expect(validation.issues).toEqual([]);
    expect(resolvePrimaryConfiguredVendor(setup.registry).providerId).toBe(
      "vecells_assistive_vendor_watch_shadow_twin",
    );
    expect(readiness.decision).toBe("ready_for_dry_run_rehearsal_verify");
    expect(readiness.projectRows.every((row) => row.applyAllowed === false)).toBe(
      true,
    );
  });

  it("materializes tracked artifacts and reads them back", () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-425-"));

    materializeModelVendorSetupArtifacts(rootDir);
    const loaded = readAndValidateModelVendorSetup(rootDir);

    expect(loaded.validation.issues).toEqual([]);
    expect(loaded.registry.primaryProviderId).toBe(
      "vecells_assistive_vendor_watch_shadow_twin",
    );
    expect(loaded.projectManifest.projects).toHaveLength(3);
    expect(loaded.keyReferenceManifest.keyReferences).toHaveLength(3);
  });

  it("verifies masked fingerprints from secret references", () => {
    const manifest = buildModelVendorKeyReferenceManifest();
    const first = manifest.keyReferences[0]!;

    expect(first.maskedFingerprint).toBe(
      stableFingerprintForSecretRef({
        keyReferenceId: first.keyReferenceId,
        environmentId: first.environmentId,
        secretRef: first.secretRef,
      }),
    );
    expect(first.maskedFingerprint).toMatch(/^fp_sha256_[a-f0-9]{20}$/u);
  });

  it("redacts secret locators and raw key shaped values", () => {
    const leaked =
      "value secret://vecells/nonprod/dev/assistive-shadow-twin/invocation-handle sk-test1234567890abcdef";
    const redacted = redactSensitiveText(leaked);

    expect(containsSensitiveLeak(leaked)).toBe(true);
    expect(containsSensitiveLeak(redacted)).toBe(false);
    expect(redacted).toContain("[secret-ref:redacted]");
    expect(redacted).toContain("[secret-value:redacted]");
  });

  it("fails closed on external key references marked ready", () => {
    const setup = {
      registry: buildModelVendorRegistry(),
      projectManifest: buildModelVendorProjectManifest(),
      keyReferenceManifest: {
        ...buildModelVendorKeyReferenceManifest(),
        keyReferences: buildModelVendorKeyReferenceManifest().keyReferences.map(
          (entry) =>
            entry.providerId === "openai"
              ? { ...entry, keyStatus: "ready_reference" as const }
              : entry,
        ),
      },
    };

    expect(validateModelVendorSetupDocuments(setup).issues).toContainEqual(
      expect.objectContaining({
        code: "EXTERNAL_KEY_READY_WITHOUT_SELECTION",
      }),
    );
  });
});
