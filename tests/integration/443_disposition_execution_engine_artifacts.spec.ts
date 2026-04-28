import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION,
  createPhase9DispositionExecutionFixture,
  type Phase9DispositionExecutionFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("443 Phase 9 disposition execution engine artifacts", () => {
  it("publishes disposition contract and deterministic fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      producedObjects: string[];
      apiSurface: string[];
      deterministicReplay: {
        manifestHash: string;
        manifestReplayHash: string;
        certificateHash: string;
        certificateReplayHash: string;
      };
    }>("data/contracts/443_phase9_disposition_execution_engine_contract.json");
    const fixture = readJson<Phase9DispositionExecutionFixture>(
      "data/fixtures/443_phase9_disposition_execution_engine_fixtures.json",
    );
    const recomputed = createPhase9DispositionExecutionFixture();

    expect(contract.schemaVersion).toBe(PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION);
    expect(contract.producedObjects).toEqual(
      expect.arrayContaining([
        "DispositionJob",
        "DispositionBlockExplainer",
        "DeletionCertificate",
        "ArchiveManifest",
      ]),
    );
    expect(contract.apiSurface).toEqual(
      expect.arrayContaining(["queueArchiveJob", "queueDeleteJob", "executeDispositionJobSafely"]),
    );
    expect(contract.deterministicReplay.manifestHash).toBe(
      contract.deterministicReplay.manifestReplayHash,
    );
    expect(contract.deterministicReplay.certificateHash).toBe(
      contract.deterministicReplay.certificateReplayHash,
    );
    expect(fixture.replayHash).toBe(recomputed.replayHash);
  });

  it("stores archive manifest certificate and assurance-ledger lifecycle event writeback", () => {
    const fixture = readJson<Phase9DispositionExecutionFixture>(
      "data/fixtures/443_phase9_disposition_execution_engine_fixtures.json",
    );

    expect(fixture.archiveExecutionResult.manifest?.archiveManifestId).toMatch(/^am_443_/);
    expect(fixture.archiveExecutionResult.manifest?.manifestHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.deleteExecutionResult.deletionCertificates[0]?.deletionCertificateId).toMatch(
      /^dc_443_/,
    );
    expect(fixture.deleteExecutionResult.deletionCertificates[0]?.certificateHash).toMatch(
      /^[a-f0-9]{64}$/,
    );
    expect(fixture.deleteExecutionResult.lifecycleEvents[0]?.assuranceLedgerEntry.hash).toMatch(
      /^[a-f0-9]{64}$/,
    );
  });

  it("stores blocker explainers and summary-first presentation metadata", () => {
    const fixture = readJson<Phase9DispositionExecutionFixture>(
      "data/fixtures/443_phase9_disposition_execution_engine_fixtures.json",
    );

    expect(fixture.rawScanBlockedResult.blockExplainers[0]?.dispositionBlockExplainerId).toMatch(
      /^dbe_443_/,
    );
    expect(fixture.rawScanBlockedResult.blockExplainers[0]?.summaryProjectionRef).toContain(
      "summary:redacted:",
    );
    expect(fixture.rawScanBlockedResult.presentationPolicy.redactionPolicyRef).toBe(
      "redaction:summary-first-no-raw-archive-url",
    );
  });

  it("stores operator-readable summary notes matrix and no gap artifact", () => {
    const summary = readText("data/analysis/443_phase9_disposition_execution_engine_summary.md");
    const notes = readText("data/analysis/443_algorithm_alignment_notes.md");
    const matrix = readText("data/analysis/443_disposition_blocking_matrix.csv");
    const gapPath = path.join(
      root,
      "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_443_RETENTION_ELIGIBILITY_INPUTS.json",
    );

    expect(summary).toContain("Archive manifest hash");
    expect(summary).toContain("Deletion certificate hash");
    expect(notes).toContain("only archive/delete authority");
    expect(matrix).toContain("raw_storage_scan");
    expect(matrix).toContain("stale_hold_state");
    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
