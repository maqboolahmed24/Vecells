import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_CROSS_PHASE_CONFORMANCE_VERSION,
  createPhase9CrossPhaseConformanceFixture,
  type Phase9CrossPhaseConformanceFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("449 Phase 9 cross-phase conformance artifacts", () => {
  it("publishes conformance contract and deterministic fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      producedObjects: string[];
      apiSurface: string[];
      conformanceAuthority: { exactScorecardState: string; blockedScorecardState: string };
      bauAuthority: { signedOffState: string; blockedReleaseAttemptState: string };
      deterministicReplay: { replayHash: string };
      noGapArtifactRequired: boolean;
    }>("data/contracts/449_phase9_cross_phase_conformance_contract.json");
    const fixture = readJson<Phase9CrossPhaseConformanceFixture>(
      "data/fixtures/449_phase9_cross_phase_conformance_fixtures.json",
    );
    const recomputed = createPhase9CrossPhaseConformanceFixture();

    expect(contract.schemaVersion).toBe(PHASE9_CROSS_PHASE_CONFORMANCE_VERSION);
    expect(contract.producedObjects).toEqual(
      expect.arrayContaining([
        "BAUReadinessPack",
        "OnCallMatrix",
        "RunbookBundle",
        "PhaseConformanceRow",
        "CrossPhaseConformanceScorecard",
        "ReleaseToBAURecord",
      ]),
    );
    expect(contract.apiSurface).toEqual(
      expect.arrayContaining([
        "generatePhaseConformanceRow",
        "generateCrossPhaseScorecard",
        "listBlockersByPhase",
        "listMissingProofRefs",
        "attemptReleaseToBAURecordCreation",
      ]),
    );
    expect(contract.conformanceAuthority.exactScorecardState).toBe("exact");
    expect(contract.conformanceAuthority.blockedScorecardState).toBe("blocked");
    expect(contract.bauAuthority.signedOffState).toBe("signed_off");
    expect(contract.bauAuthority.blockedReleaseAttemptState).toBe("blocked");
    expect(contract.noGapArtifactRequired).toBe(true);
    expect(fixture.replayHash).toBe(recomputed.replayHash);
    expect(contract.deterministicReplay.replayHash).toBe(fixture.replayHash);
  });

  it("stores conformance row report BAU blocker register and runbook notes", () => {
    const summary = readText("data/analysis/449_phase9_cross_phase_conformance_summary.md");
    const notes = readText("data/analysis/449_algorithm_alignment_notes.md");
    const rowCsv = readText("data/analysis/449_phase_conformance_rows.csv");
    const blockerCsv = readText("data/analysis/449_bau_signoff_blockers.csv");

    expect(summary).toContain("CrossPhaseConformanceScorecard is exact only");
    expect(notes).toContain("BAU readiness is blocked");
    expect(rowCsv).toContain("phase3_duplicate_resolution,blocked");
    expect(rowCsv).toContain("cross_phase_runtime_release,exact");
    expect(blockerCsv).toContain("scorecard:blocked");
    expect(blockerCsv).toContain("release-to-bau:acceptance-missing");
  });

  it("does not publish a 449 input gap when all upstream Phase 9 artifacts are present", () => {
    const gapPath = path.join(
      root,
      "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_449_CONFORMANCE_INPUTS.json",
    );
    const fixture = readJson<Phase9CrossPhaseConformanceFixture>(
      "data/fixtures/449_phase9_cross_phase_conformance_fixtures.json",
    );

    expect(fs.existsSync(gapPath)).toBe(false);
    expect(Object.keys(fixture.upstreamSchemaVersions)).toEqual(
      expect.arrayContaining(["432", "433", "444", "445", "446", "447", "448"]),
    );
  });
});
