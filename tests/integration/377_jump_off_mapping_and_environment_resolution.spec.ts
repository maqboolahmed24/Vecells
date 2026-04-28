import { describe, expect, it } from "vitest";
import {
  PHASE7_CONFIG_FINGERPRINT,
  PHASE7_INTAKE_CONVERGENCE_REF,
  PHASE7_MANIFEST_VERSION,
  createDefaultPhase7NhsAppManifestApplication,
} from "../../services/command-api/src/phase7-nhs-app-manifest-service.ts";

describe("377 jump-off mapping and environment resolution", () => {
  it("resolves a trusted pharmacy status jump-off from the pinned Sandpit manifest", () => {
    const application = createDefaultPhase7NhsAppManifestApplication();

    const result = application.resolveJumpOff({
      environment: "sandpit",
      nhsAppPlacement: "gp_services_pharmacy_status",
      odsCode: "A83001",
      releaseCohortRef: "cohort:phase7-internal-sandpit-only",
      expectedManifestVersion: PHASE7_MANIFEST_VERSION,
      expectedConfigFingerprint: PHASE7_CONFIG_FINGERPRINT,
    });

    expect(result.status).toBe("resolved");
    expect(result.exposureState).toBe("exposed");
    expect(result.journeyPath?.journeyPathId).toBe("jp_pharmacy_status");
    expect(result.jumpOffUrlTemplate).toBe(
      "https://sandpit.vecells.invalid/nhs-app/requests/:requestId/pharmacy/status?from=nhsApp",
    );
    expect(result.auditRecord.odsCodeHash).toMatch(/^sha256:/);
  });

  it("blocks an intake jump-off when continuity evidence is not trusted", () => {
    const application = createDefaultPhase7NhsAppManifestApplication();

    const result = application.resolveJumpOff({
      environment: "sandpit",
      nhsAppPlacement: "gp_services_ask_gp_medical",
      odsCode: "A83001",
      releaseCohortRef: "cohort:phase7-internal-sandpit-only",
    });

    expect(result.status).toBe("blocked");
    expect(result.blockedReasons).toContain("pending_continuity_validation");
    expect(result.routeMetadata?.intakeConvergenceContractRef).toBe(PHASE7_INTAKE_CONVERGENCE_REF);
    expect(result.jumpOffUrlTemplate).toBeNull();
  });

  it("returns deterministic blocked reasons for placement, cohort, ODS, and tuple drift", () => {
    const application = createDefaultPhase7NhsAppManifestApplication();

    expect(
      application.resolveJumpOff({
        environment: "sandpit",
        nhsAppPlacement: "gp_services_unknown",
        odsCode: "A83001",
        releaseCohortRef: "cohort:phase7-internal-sandpit-only",
      }).blockedReasons,
    ).toContain("not_in_manifest");

    expect(
      application.resolveJumpOff({
        environment: "sandpit",
        nhsAppPlacement: "gp_services_pharmacy_status",
        odsCode: "A83001",
        releaseCohortRef: "cohort:future-nhs-app-limited-release",
      }).blockedReasons,
    ).toContain("cohort_blocked");

    expect(
      application.resolveJumpOff({
        environment: "sandpit",
        nhsAppPlacement: "gp_services_pharmacy_status",
        odsCode: "Z99999",
        releaseCohortRef: "cohort:phase7-internal-sandpit-only",
      }).blockedReasons,
    ).toContain("ods_rule_blocked");

    expect(
      application.resolveJumpOff({
        environment: "sandpit",
        nhsAppPlacement: "gp_services_pharmacy_status",
        odsCode: "A83001",
        releaseCohortRef: "cohort:phase7-internal-sandpit-only",
        expectedConfigFingerprint: "sha256:drift",
      }).blockedReasons,
    ).toContain("config_fingerprint_mismatch");
  });

  it("keeps inventory-only routes visible as metadata without exposing them", () => {
    const application = createDefaultPhase7NhsAppManifestApplication();

    const lookup = application.lookupJourneyPath({
      environment: "sandpit",
      journeyPathId: "jp_records_letters_summary",
      expectedManifestVersion: PHASE7_MANIFEST_VERSION,
      expectedConfigFingerprint: PHASE7_CONFIG_FINGERPRINT,
    });

    expect(lookup.exposureState).toBe("inventory_only");
    expect(lookup.blockedReasons).toContain("requires_embedded_adaptation");
    expect(lookup.journeyPath?.routeOwner).toBe("records");
  });

  it("exposes onboarding references while preserving missing prerequisite blockers", () => {
    const application = createDefaultPhase7NhsAppManifestApplication();

    const evidence = application.resolveOnboardingEvidence({
      environment: "local_preview",
      expectedManifestVersion: PHASE7_MANIFEST_VERSION,
      expectedConfigFingerprint: PHASE7_CONFIG_FINGERPRINT,
    });

    expect(evidence.evidencePack.SCALRefs).toContain(
      "SCAL:future-nhs-app-supplier-conformance-assessment",
    );
    expect(evidence.serviceDeskProfile.serviceManagementProtocolRef).toBe(
      "ServiceManagementProtocol:nhs-app-incident-rehearsal-required",
    );
    expect(evidence.blockedReasons).toContain("pending_continuity_validation");
  });
});
