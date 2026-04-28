import { describe, expect, it } from "vitest";

import {
  compareSandpitAOSParity,
  createDemoResetPlan,
  indexSCALBundle,
  load396JsonFile,
  redactSensitiveText,
  redactUrl,
  validateDemoDatasetManifest,
  type IntegrationDemoDatasetManifest,
  type NHSAppEnvironmentProfileManifest,
  type SCALSubmissionBundleManifest,
} from "../../services/command-api/src/phase7-nhs-app-onboarding-service.ts";

const ROOT = "/Users/test/Code/V";

describe("396 NHS App onboarding assets", () => {
  it("validates Sandpit and AOS against one promoted release tuple", () => {
    const manifest = load396JsonFile<NHSAppEnvironmentProfileManifest>(
      "data/config/396_nhs_app_environment_profile_manifest.example.json",
      ROOT,
    );

    const parity = compareSandpitAOSParity(manifest);

    expect(parity.parityState).toBe("matching");
    expect(parity.failureReasons).toEqual([]);
    expect(parity.environmentResults.map((result) => result.environment)).toEqual([
      "sandpit",
      "aos",
    ]);
  });

  it("blocks tuple drift even when routes still look present", () => {
    const manifest = load396JsonFile<NHSAppEnvironmentProfileManifest>(
      "data/config/396_nhs_app_environment_profile_manifest.example.json",
      ROOT,
    );
    const drifted = JSON.parse(JSON.stringify(manifest)) as NHSAppEnvironmentProfileManifest;
    (drifted.environments[1] as { configFingerprint: string }).configFingerprint =
      "sha256:396-drifted-aos";

    const parity = compareSandpitAOSParity(drifted);

    expect(parity.parityState).toBe("drift");
    expect(parity.failureReasons).toEqual(
      expect.arrayContaining(["manifest_tuple_drift", "sandpit_aos_tuple_drift"]),
    );
  });

  it("requires all demo walkthrough journeys and produces deterministic reset plans", () => {
    const manifest = load396JsonFile<IntegrationDemoDatasetManifest>(
      "data/config/396_nhs_app_demo_dataset_manifest.example.json",
      ROOT,
    );

    const validation = validateDemoDatasetManifest(manifest);
    const sandpit = manifest.environments.find((entry) => entry.environment === "sandpit");
    expect(sandpit).toBeDefined();
    const resetA = createDemoResetPlan(sandpit!);
    const resetB = createDemoResetPlan(sandpit!);

    expect(validation.readinessState).toBe("ready");
    expect(
      validation.environmentResults.every((result) => result.missingJourneyKinds.length === 0),
    ).toBe(true);
    expect(resetA.afterHash).toBe(resetB.afterHash);
    expect(resetA.beforeHash).toBe(resetA.afterHash);
  });

  it("indexes SCAL evidence by freshness and redaction class", () => {
    const manifest = load396JsonFile<SCALSubmissionBundleManifest>(
      "data/config/396_scal_submission_bundle_manifest.example.json",
      ROOT,
    );

    const index = indexSCALBundle(manifest);

    expect(index.readinessState).toBe("ready");
    expect(index.rows.length).toBeGreaterThanOrEqual(5);
    expect(index.rows.every((row) => row.freshnessState === "current")).toBe(true);
    expect(
      index.rows.find((row) => row.redactionClass === "phi_url")?.redactedArtifactPath,
    ).toContain("[REDACTED:assertedLoginIdentity]");
  });

  it("redacts identity assertions, tokens, and patient identifiers", () => {
    const url = redactUrl(
      "https://supplier.invalid/status?assertedLoginIdentity=eyJhbGciOiJIUzI1NiJ9.payload.signature&patientId=123",
    );
    const text = redactSensitiveText(
      "Bearer abcdefghijklmnopqrstuvwxyz patientId=patient-123 NHS number=1234567890",
    );

    expect(url).not.toContain("payload.signature");
    expect(url).toContain("[REDACTED:assertedLoginIdentity]");
    expect(text).toContain("[REDACTED:bearer-token]");
    expect(text).toContain("patientId=[REDACTED:identifier]");
    expect(text).toContain("NHS number=[REDACTED:nhs-number]");
  });
});
