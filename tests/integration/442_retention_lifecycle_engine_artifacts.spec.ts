import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION,
  createPhase9RetentionLifecycleEngineFixture,
  type RetentionLifecycleEngineFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("442 Phase 9 retention lifecycle engine artifacts", () => {
  it("publishes retention lifecycle contract and deterministic fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      producedObjects: string[];
      apiSurface: string[];
      deterministicReplay: {
        replayHash: string;
        baselineDecisionHash: string;
        deterministicDecisionReplayHash: string;
      };
    }>("data/contracts/442_phase9_retention_lifecycle_engine_contract.json");
    const fixture = readJson<RetentionLifecycleEngineFixture>(
      "data/fixtures/442_phase9_retention_lifecycle_engine_fixtures.json",
    );
    const recomputed = createPhase9RetentionLifecycleEngineFixture();

    expect(contract.schemaVersion).toBe(PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION);
    expect(contract.producedObjects).toEqual(
      expect.arrayContaining([
        "RetentionClass",
        "RetentionLifecycleBinding",
        "RetentionDecision",
        "LegalHoldRecord",
        "DispositionEligibilityAssessment",
      ]),
    );
    expect(contract.apiSurface).toEqual(
      expect.arrayContaining([
        "bindLifecycleForArtifact",
        "runDispositionEligibilityAssessment",
        "emitLifecycleEvidenceForAssuranceGraph",
      ]),
    );
    expect(contract.deterministicReplay.baselineDecisionHash).toBe(
      contract.deterministicReplay.deterministicDecisionReplayHash,
    );
    expect(fixture.replayHash).toBe(recomputed.replayHash);
  });

  it("stores disposition blockers for holds dependencies graph and raw scans", () => {
    const fixture = readJson<RetentionLifecycleEngineFixture>(
      "data/fixtures/442_phase9_retention_lifecycle_engine_fixtures.json",
    );

    expect(fixture.legalHoldBlockedAssessment.result).toBe("blocked");
    expect(fixture.transitiveDependencyAssessment.result).toBe("blocked");
    expect(fixture.dependencyCycleAssessment.result).toBe("blocked");
    expect(fixture.wormHashChainedAssessment.result).toBe("blocked");
    expect(fixture.replayCriticalAssessment.result).toBe("blocked");
    expect(fixture.assurancePackDependencyAssessment.result).toBe("blocked");
    expect(fixture.missingGraphVerdictAssessment.result).toBe("blocked");
    expect(fixture.rawStorageScanAssessment.result).toBe("blocked");
  });

  it("stores lifecycle binding decision legal hold and reassessment evidence", () => {
    const fixture = readJson<RetentionLifecycleEngineFixture>(
      "data/fixtures/442_phase9_retention_lifecycle_engine_fixtures.json",
    );

    expect(fixture.artifactCreationResult.binding?.classificationHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.baselineDecision.decisionHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.legalHoldResult.legalHold.holdHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.releasedLegalHoldResult.legalHold.supersedesHoldRef).toBe(
      fixture.legalHoldResult.legalHold.legalHoldRecordId,
    );
    expect(fixture.reassessmentAfterRelease.result).toBe("eligible");
    expect(fixture.lifecycleEvidenceRecord.lifecycleEvidenceHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("keeps retention class supersession and old decision lineage", () => {
    const fixture = readJson<RetentionLifecycleEngineFixture>(
      "data/fixtures/442_phase9_retention_lifecycle_engine_fixtures.json",
    );

    expect(fixture.supersededRetentionClass.classState).toBe("superseded");
    expect(fixture.replacementRetentionClass.classState).toBe("active");
    expect(fixture.oldDecisionAfterSupersession.retentionClassRef).not.toBe(
      fixture.newDecisionAfterSupersession.retentionClassRef,
    );
    expect(fixture.newDecisionAfterSupersession.supersedesDecisionRef).toBe(
      fixture.oldDecisionAfterSupersession.retentionDecisionId,
    );
  });

  it("stores operator-readable summary alignment notes and no gap artifact", () => {
    const summary = readText("data/analysis/442_phase9_retention_lifecycle_engine_summary.md");
    const notes = readText("data/analysis/442_algorithm_alignment_notes.md");
    const matrix = readText("data/analysis/442_retention_lifecycle_blocking_matrix.csv");
    const gapPath = path.join(
      root,
      "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_442_RETENTION_LIFECYCLE_ENGINE.json",
    );

    expect(summary).toContain("Retention classes");
    expect(summary).toContain("Replay hash");
    expect(notes).toContain("lifecycle binding is minted at artifact creation time");
    expect(matrix).toContain("legal_hold");
    expect(matrix).toContain("raw_storage_scan");
    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
