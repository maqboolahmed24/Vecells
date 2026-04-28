import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION,
  createPhase9OperationalReadinessPostureFixture,
  type Phase9OperationalReadinessPostureFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("444 Phase 9 operational readiness posture artifacts", () => {
  it("publishes readiness posture contract and deterministic fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      producedObjects: string[];
      apiSurface: string[];
      deterministicReplay: {
        liveControlTupleHash: string;
        deterministicReplayControlTupleHash: string;
      };
    }>("data/contracts/444_phase9_operational_readiness_posture_contract.json");
    const fixture = readJson<Phase9OperationalReadinessPostureFixture>(
      "data/fixtures/444_phase9_operational_readiness_posture_fixtures.json",
    );
    const recomputed = createPhase9OperationalReadinessPostureFixture();

    expect(contract.schemaVersion).toBe(PHASE9_OPERATIONAL_READINESS_POSTURE_VERSION);
    expect(contract.producedObjects).toEqual(
      expect.arrayContaining([
        "EssentialFunctionMap",
        "RecoveryTier",
        "BackupSetManifest",
        "OperationalReadinessSnapshot",
        "RunbookBindingRecord",
        "RecoveryControlPosture",
      ]),
    );
    expect(contract.apiSurface).toEqual(
      expect.arrayContaining([
        "listEssentialFunctions",
        "getRecoveryControlPosture",
        "listRecoveryProofDebt",
      ]),
    );
    expect(contract.deterministicReplay.liveControlTupleHash).toBe(
      contract.deterministicReplay.deterministicReplayControlTupleHash,
    );
    expect(fixture.replayHash).toBe(recomputed.replayHash);
  });

  it("stores tuple-bound readiness snapshot runbooks backups and posture evidence", () => {
    const fixture = readJson<Phase9OperationalReadinessPostureFixture>(
      "data/fixtures/444_phase9_operational_readiness_posture_fixtures.json",
    );

    expect(fixture.readySnapshot.operationalReadinessSnapshotId).toMatch(/^ors_444_/);
    expect(fixture.readySnapshot.resilienceTupleHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.runbookBindings[0]?.bindingHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.backupManifests[0]?.manifestTupleHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.livePosture.controlTupleHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("stores operator-facing summary notes matrix proof debt and no gap artifact", () => {
    const summary = readText("data/analysis/444_phase9_operational_readiness_posture_summary.md");
    const notes = readText("data/analysis/444_algorithm_alignment_notes.md");
    const matrix = readText("data/analysis/444_recovery_control_posture_matrix.csv");
    const proofDebt = readText("data/analysis/444_recovery_proof_debt.csv");
    const gapPath = path.join(
      root,
      "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_444_READINESS_RUNTIME_CONTRACTS.json",
    );

    expect(summary).toContain("Readiness tuple hash");
    expect(summary).toContain("Live control tuple hash");
    expect(notes).toContain("current tuple only");
    expect(matrix).toContain("stale_publication");
    expect(matrix).toContain("partial_dependency");
    expect(proofDebt).toContain("functionCode");
    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
