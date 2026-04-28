import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION,
  createPhase9ResilienceActionSettlementFixture,
  type Phase9ResilienceActionSettlementFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("445 Phase 9 resilience action settlement artifacts", () => {
  it("publishes restore failover chaos settlement contract and deterministic fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      producedObjects: string[];
      apiSurface: string[];
      deterministicReplay: {
        replayHash: string;
        deterministicArtifactHash: string;
        deterministicArtifactReplayHash: string;
      };
    }>("data/contracts/445_phase9_resilience_action_settlement_contract.json");
    const fixture = readJson<Phase9ResilienceActionSettlementFixture>(
      "data/fixtures/445_phase9_resilience_action_settlement_fixtures.json",
    );
    const recomputed = createPhase9ResilienceActionSettlementFixture();

    expect(contract.schemaVersion).toBe(PHASE9_RESILIENCE_ACTION_SETTLEMENT_VERSION);
    expect(contract.producedObjects).toEqual(
      expect.arrayContaining([
        "RestoreRun",
        "FailoverScenario",
        "FailoverRun",
        "ChaosExperiment",
        "ChaosRun",
        "ResilienceActionSettlement",
        "RecoveryEvidenceArtifact",
      ]),
    );
    expect(contract.apiSurface).toEqual(
      expect.arrayContaining([
        "prepareRestore",
        "activateFailover",
        "startChaos",
        "attestRecoveryPack",
        "writeRecoveryEvidenceGraph",
      ]),
    );
    expect(contract.deterministicReplay.deterministicArtifactHash).toBe(
      contract.deterministicReplay.deterministicArtifactReplayHash,
    );
    expect(fixture.replayHash).toBe(recomputed.replayHash);
  });

  it("stores settled recovery evidence writeback and governed artifact catalog", () => {
    const fixture = readJson<Phase9ResilienceActionSettlementFixture>(
      "data/fixtures/445_phase9_resilience_action_settlement_fixtures.json",
    );
    const catalog = readText("data/analysis/445_recovery_evidence_artifact_catalog.csv");

    expect(fixture.recoveryEvidencePack.packState).toBe("current");
    expect(fixture.recoveryEvidenceGraphWriteback.assuranceLedgerEntry.hash).toMatch(
      /^[a-f0-9]{64}$/,
    );
    expect(fixture.recoveryEvidenceArtifacts[0]?.artifactPresentationContractRef).toMatch(
      /^apc_445_/,
    );
    expect(fixture.recoveryEvidenceArtifacts[0]?.summaryRef).not.toMatch(/^(s3|gs|blob):\/\//);
    expect(catalog).toContain("recoveryEvidenceArtifactId");
    expect(catalog).toContain("restore_report");
  });

  it("stores operator summary notes matrix and no command settlement gap artifact", () => {
    const summary = readText("data/analysis/445_phase9_resilience_action_settlement_summary.md");
    const notes = readText("data/analysis/445_algorithm_alignment_notes.md");
    const matrix = readText("data/analysis/445_settlement_result_matrix.csv");
    const gapPath = path.join(
      root,
      "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_445_COMMAND_SETTLEMENT.json",
    );

    expect(summary).toContain("Readiness tuple hash");
    expect(summary).toContain("Recovery evidence writeback hash");
    expect(notes).toContain("ResilienceActionSettlement");
    expect(notes).toContain("raw object-store refs are rejected");
    expect(matrix).toContain("failover_stale_scope");
    expect(matrix).toContain("chaos_guardrail");
    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
