import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildModelAuditAndSafetyContract,
  buildModelAuditAndSafetyReadinessEvidence,
  buildModelAuditBaseline,
  buildModelSafetyBaseline,
  containsSensitiveLeak,
  materializeModelAuditAndSafetyArtifacts,
  readAndValidateModelAuditAndSafetySetup,
  redactSensitiveText,
  validateModelAuditAndSafetySetupDocuments,
} from "../../scripts/assistive/426_model_audit_and_safety_lib.ts";
import { materializeModelVendorSetupArtifacts } from "../../scripts/assistive/425_model_vendor_project_setup_lib.ts";

function buildSetup() {
  return {
    auditBaseline: buildModelAuditBaseline(),
    safetyBaseline: buildModelSafetyBaseline(),
    contract: buildModelAuditAndSafetyContract(),
  };
}

describe("426 model audit and safety", () => {
  it("validates generated audit and safety baselines", () => {
    const setup = buildSetup();
    const validation = validateModelAuditAndSafetySetupDocuments(setup);
    const verifyEvidence = buildModelAuditAndSafetyReadinessEvidence(setup, "verify");
    const applyEvidence = buildModelAuditAndSafetyReadinessEvidence(setup, "apply");

    expect(validation.issues).toEqual([]);
    expect(verifyEvidence.decision).toBe("ready_for_dry_run_rehearsal_verify");
    expect(applyEvidence.decision).toBe("blocked_for_apply");
    expect(
      verifyEvidence.auditRows
        .filter((row) => row.providerId === verifyEvidence.primaryProviderId)
        .every((row) => row.status === "verified"),
    ).toBe(true);
    expect(
      verifyEvidence.safetyRows
        .filter((row) => row.providerId === verifyEvidence.primaryProviderId)
        .every((row) => row.status === "verified"),
    ).toBe(true);
  });

  it("materializes tracked artifacts and reads them back", () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-426-"));

    materializeModelVendorSetupArtifacts(rootDir);
    materializeModelAuditAndSafetyArtifacts(rootDir);
    const loaded = readAndValidateModelAuditAndSafetySetup(rootDir);

    expect(loaded.validation.issues).toEqual([]);
    expect(loaded.auditBaseline.auditControls).toHaveLength(3);
    expect(loaded.safetyBaseline.safetyControls).toHaveLength(3);
    expect(loaded.contract.applyModeDefault).toBe("blocked");
  });

  it("redacts inherited secret locators and raw key-shaped values", () => {
    const leaked =
      "secret://vecells/nonprod/dev/assistive-shadow-twin/invocation-handle sk-test1234567890abcdef";
    const redacted = redactSensitiveText(leaked);

    expect(containsSensitiveLeak(leaked)).toBe(true);
    expect(containsSensitiveLeak(redacted)).toBe(false);
    expect(redacted).toContain("[secret-ref:redacted]");
    expect(redacted).toContain("[secret-value:redacted]");
  });

  it("fails closed when an external provider audit row is marked configured", () => {
    const setup = buildSetup();
    const mutated = {
      ...setup,
      auditBaseline: {
        ...setup.auditBaseline,
        auditControls: setup.auditBaseline.auditControls.map((entry) =>
          entry.providerId === "openai"
            ? { ...entry, status: "verified" as const, retentionDays: 30 }
            : entry,
        ),
      },
    };

    expect(validateModelAuditAndSafetySetupDocuments(mutated).issues).toContainEqual(
      expect.objectContaining({
        code: "EXTERNAL_AUDIT_CONFIGURED_WITHOUT_PROVIDER_SELECTION",
      }),
    );
  });

  it("fails closed when a configured model allow-list is too broad", () => {
    const setup = buildSetup();
    const mutated = {
      ...setup,
      safetyBaseline: {
        ...setup.safetyBaseline,
        safetyControls: setup.safetyBaseline.safetyControls.map((entry) =>
          entry.providerId === "vecells_assistive_vendor_watch_shadow_twin"
            ? { ...entry, allowedModelFamilies: ["*"] }
            : entry,
        ),
      },
    };

    expect(validateModelAuditAndSafetySetupDocuments(mutated).issues).toContainEqual(
      expect.objectContaining({
        code: "SAFETY_ALLOW_LIST_TOO_BROAD",
      }),
    );
  });

  it("rejects raw payload-shaped fields in manifests", () => {
    const setup = buildSetup();
    const mutated = {
      ...setup,
      safetyBaseline: {
        ...setup.safetyBaseline,
        rawAuditPayload: {
          messages: [{ role: "user", content: "synthetic but raw-shaped" }],
        },
      },
    };

    expect(
      validateModelAuditAndSafetySetupDocuments(
        mutated as unknown as ReturnType<typeof buildSetup>,
      ).issues,
    ).toContainEqual(
      expect.objectContaining({
        code: "RAW_PAYLOAD_FIELD_DETECTED",
      }),
    );
  });
});

