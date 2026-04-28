import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_470_SCHEMA_VERSION,
  buildPhase9FullRegressionAndDefensiveSecuritySuite,
  writePhase9FullRegressionAndDefensiveSecurityArtifacts,
} from "../../tools/testing/run_470_full_regression_and_defensive_security";

const root = path.resolve(__dirname, "..", "..");

function loadFixture() {
  const fixturePath = path.join(root, "tests/fixtures/470_cross_phase_synthetic_programme_cases.json");
  if (!fs.existsSync(fixturePath)) {
    writePhase9FullRegressionAndDefensiveSecurityArtifacts();
  }
  return JSON.parse(fs.readFileSync(fixturePath, "utf8")) as ReturnType<
    typeof buildPhase9FullRegressionAndDefensiveSecuritySuite
  >["fixture"];
}

function loadEvidence() {
  const evidencePath = path.join(
    root,
    "data/evidence/470_full_regression_and_defensive_security_results.json",
  );
  if (!fs.existsSync(evidencePath)) {
    writePhase9FullRegressionAndDefensiveSecurityArtifacts();
  }
  return JSON.parse(fs.readFileSync(evidencePath, "utf8")) as ReturnType<
    typeof buildPhase9FullRegressionAndDefensiveSecuritySuite
  >["evidence"];
}

describe("470 full cross-phase regression", () => {
  it("builds a deterministic fixture covering every required programme journey", () => {
    const fixture = loadFixture();
    expect(fixture.schemaVersion).toBe(PHASE9_470_SCHEMA_VERSION);
    expect(fixture.taskId).toContain("par_470_phase9");
    expect(fixture.fixtureHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.journeyCases.map((journey) => journey.journeyId)).toEqual(
      expect.arrayContaining([
        "patient-intake-receipt-status-manage-recovery",
        "red-flag-diversion-safety-epoch",
        "identity-grant-secure-link-access-renewal",
        "duplicate-same-episode-review-queue-rank",
        "clinical-workspace-task-more-info-endpoint-booking-next-task",
        "local-booking-hub-coordination-external-confirmation-gates",
        "smart-waitlist-offer-hold-confirm-expire",
        "pharmacy-referral-and-bounce-back",
        "outbound-comms-reachability-repair",
        "assistive-review-final-artifact-override-downgrade",
        "ops-overview-heatmap-investigation-intervention",
        "audit-assurance-break-glass-redaction",
        "resilience-restore-failover-quarantine",
        "incident-near-miss-tenant-governance-dependency-hygiene",
        "records-retention-legal-hold-worm-replay",
        "access-studio-compliance-ledger-conformance-scorecard",
      ]),
    );
    expect(fixture.journeyCases).toHaveLength(16);
  });

  it("requires route binding, authoritative settlement, artifact grants, and telemetry redaction on every journey", () => {
    const fixture = loadFixture();
    for (const journey of fixture.journeyCases) {
      expect(journey.expectedOutcomeState).toBe("passed");
      expect(journey.dataClassification).toBe("synthetic_no_phi");
      expect(journey.runtimeInvariants.routeIntentBinding).toBe(true);
      expect(journey.runtimeInvariants.authoritativeCommandSettlementOnly).toBe(true);
      expect(journey.runtimeInvariants.staleActionLeaseDenied).toBe(true);
      expect(journey.runtimeInvariants.artifactPresentationContractRequired).toBe(true);
      expect(journey.runtimeInvariants.outboundNavigationGrantRequired).toBe(true);
      expect(journey.runtimeInvariants.uiTelemetryRedacted).toBe(true);
      expect(journey.routeContinuity.sameShellRecovery).toBe(true);
      expect(journey.routeContinuity.safeReturnToken).toMatch(/^ORT_470_/);
      expect(journey.routeContinuity.routeParamsCarryOnlyOpaqueRefs).toBe(true);
      expect(journey.proofRefs.length).toBeGreaterThan(0);
    }
  });

  it("passes all phase-9 final assurance gates without Sev1 or Sev2 defects", () => {
    const evidence = loadEvidence();
    expect(evidence.allCoveragePassed).toBe(true);
    expect(evidence.noSev1OrSev2Defects).toBe(true);
    expect(evidence.noExternalTargets).toBe(true);
    expect(evidence.noRealSecretsOrPhi).toBe(true);
    expect(evidence.noSensitiveFixtureMarkers).toBe(true);
    expect(evidence.noSensitiveEvidenceMarkers).toBe(true);
    expect(evidence.noRawArtifactUrls).toBe(true);
    expect(evidence.noTracePersistence).toBe(true);

    for (const [name, covered] of Object.entries(evidence.coverage)) {
      expect(covered, `coverage ${name}`).toBe(true);
    }
  });
});
