import { describe, expect, it } from "vitest";

import { serviceDefinition } from "../../services/command-api/src/service-definition.ts";
import {
  indexSCALBundle,
  load396JsonFile,
  phase7NhsAppOnboardingRoutes,
  toCsvRows,
  validateOnboardingAssetsFromFiles,
  type SCALSubmissionBundleManifest,
} from "../../services/command-api/src/phase7-nhs-app-onboarding-service.ts";

const ROOT = "/Users/test/Code/V";

describe("396 NHS App onboarding integration", () => {
  it("registers onboarding routes in the command API route catalog", () => {
    for (const route of phase7NhsAppOnboardingRoutes) {
      expect(serviceDefinition.routeCatalog.some((entry) => entry.routeId === route.routeId)).toBe(
        true,
      );
    }
  });

  it("builds a machine-readable signoff readiness report from repository manifests", () => {
    const report = validateOnboardingAssetsFromFiles({
      root: ROOT,
      environmentProfilePath: "data/config/396_nhs_app_environment_profile_manifest.example.json",
      demoDatasetPath: "data/config/396_nhs_app_demo_dataset_manifest.example.json",
      scalBundlePath: "data/config/396_scal_submission_bundle_manifest.example.json",
    });

    expect(report.readinessState).toBe("ready");
    expect(report.machineReadableSummary.sandpitReady).toBe(true);
    expect(report.machineReadableSummary.aosReady).toBe(true);
    expect(report.machineReadableSummary.demoResetDeterministic).toBe(true);
    expect(report.machineReadableSummary.scalEvidenceExportable).toBe(true);
  });

  it("exports the SCAL evidence index without raw identity assertions", () => {
    const manifest = load396JsonFile<SCALSubmissionBundleManifest>(
      "data/config/396_scal_submission_bundle_manifest.example.json",
      ROOT,
    );
    const index = indexSCALBundle(manifest);
    const csv = toCsvRows(index.rows as unknown as Record<string, unknown>[]);

    expect(csv).toContain("requirementId");
    expect(csv).toContain("SCAL-396-ENV-PARITY");
    expect(csv).not.toContain("eyJhbGciOiJIUzI1NiJ9.synthetic.signature");
    expect(csv).toContain("[REDACTED:assertedLoginIdentity]");
  });
});
