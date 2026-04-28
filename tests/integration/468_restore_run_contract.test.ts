import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_468_SCHEMA_VERSION,
  buildPhase9RestoreFailoverChaosSliceQuarantineSuite,
  writePhase9RestoreFailoverChaosSliceQuarantineArtifacts,
} from "../../tools/test/run_phase9_restore_failover_chaos_slice_quarantine";

const root = path.resolve(__dirname, "..", "..");

function loadFixture() {
  const fixturePath = path.join(root, "tests/fixtures/468_resilience_essential_function_cases.json");
  if (!fs.existsSync(fixturePath)) {
    writePhase9RestoreFailoverChaosSliceQuarantineArtifacts();
  }
  return JSON.parse(fs.readFileSync(fixturePath, "utf8")) as ReturnType<
    typeof buildPhase9RestoreFailoverChaosSliceQuarantineSuite
  >["fixture"];
}

describe("468 restore run contract", () => {
  it("covers essential function maps and recovery tiers for every required journey", () => {
    const fixture = loadFixture();
    expect(fixture.schemaVersion).toBe(PHASE9_468_SCHEMA_VERSION);
    expect(fixture.essentialFunctionCases.map((row) => row.functionCode)).toEqual([
      "digital_intake",
      "safety_gate",
      "triage_queue",
      "patient_status_secure_links",
      "local_booking",
      "hub_coordination",
      "pharmacy_referral_loop",
      "outbound_communications",
      "audit_search",
      "assistive_layer_downgrade",
    ]);
    for (const row of fixture.essentialFunctionCases) {
      expect(row.covered).toBe(true);
      expect(row.recoveryTierRef).toMatch(/^rt_444_/);
      expect(row.runbookBindingRefs.length).toBeGreaterThan(0);
      expect(row.requiredDependencyProofRefs.length).toBeGreaterThan(0);
      expect(row.requiredJourneyProofRefs.length).toBeGreaterThan(0);
      expect(row.failoverScenarioRefs.length).toBeGreaterThan(0);
      expect(row.chaosExperimentRefs.length).toBeGreaterThan(0);
    }
  });

  it("proves backup manifest state coverage and clean-room restore authority", () => {
    const fixture = loadFixture();
    expect(fixture.backupManifestStateCases.map((row) => row.state)).toEqual([
      "current",
      "stale",
      "missing",
      "withdrawn",
    ]);
    expect(fixture.backupManifestStateCases.find((row) => row.state === "current")?.controlOutcome)
      .toBe("live_control");
    expect(fixture.backupManifestStateCases.find((row) => row.state === "withdrawn")?.controlOutcome)
      .toBe("blocked");

    const restore = fixture.restoreRunCases.cleanEnvironmentRestore;
    expect(restore.targetEnvironmentClass).toBe("synthetic-clean-room");
    expect(restore.backupSetManifestRefs.length).toBeGreaterThanOrEqual(4);
    expect(restore.dependencyValidationState).toBe("complete");
    expect(restore.journeyValidationState).toBe("complete");
    expect(restore.resultState).toBe("succeeded");
  });

  it("blocks dependency cycles and data-restore-only runs before recovery authority", () => {
    const fixture = loadFixture();
    expect(fixture.restoreRunCases.dataRestoreOnly.resultState).toBe("data_restored");
    expect(fixture.restoreRunCases.cleanEnvironmentRestore.resultState).toBe("succeeded");
    expect(fixture.restoreRunCases.dependencyBlocked.dependencyValidationState).toBe("blocked");
    expect(fixture.restoreRunCases.dependencyBlocked.resultState).toBe("failed");
    expect(fixture.restoreRunCases.dependencyBlocked.cycleDetected).toBe(true);
    expect(fixture.restoreRunCases.dependencyBlocked.cyclePathRefs).toEqual(
      expect.arrayContaining(["digital_intake", "safety_gate", "triage_queue"]),
    );
    expect(fixture.restoreRunCases.missingJourneyProof.journeyValidationState).toBe("pending");
    expect(fixture.restoreRunCases.missingJourneyProof.resultState).toBe(
      "journey_validation_pending",
    );
    expect(fixture.journeyProofCoverage.every((row) => row.covered && row.restoreValidated)).toBe(
      true,
    );
  });
});
