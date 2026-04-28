import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { writeProgrammeConformanceArtifacts } from "../../tools/conformance/generate_472_programme_conformance_scorecard";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

describe("task 472 summary alignment blocking", () => {
  beforeAll(() => {
    writeProgrammeConformanceArtifacts();
  });

  it("keeps stale or flattened summary claims visible as blocked originals", () => {
    const scorecard = readJson<any>("data/conformance/472_cross_phase_conformance_scorecard.json");
    const corrections = readJson<any>("data/conformance/472_summary_alignment_corrections.json");

    expect(corrections.summaryAlignmentState).toBe("exact_after_correction");
    expect(corrections.blockedClaimExamples.length).toBeGreaterThanOrEqual(3);
    expect(scorecard.blockingSummaryClaimRefs).toEqual(
      corrections.blockedClaimExamples.map((correction: any) => correction.correctionId),
    );

    for (const correction of corrections.blockedClaimExamples) {
      expect(correction.originalClaimState).toBe("blocked");
      expect(correction.correctionApplied).toBe(true);
      expect(correction.affectedRows.length).toBeGreaterThan(0);
      expect(correction.requiredCorrection).not.toContain("complete without proof");
    }
  });

  it("does not let BAU prose claim readiness unless the scorecard is exact", () => {
    const scorecard = readJson<any>("data/conformance/472_cross_phase_conformance_scorecard.json");
    const report = read("docs/programme/472_programme_merge_conformance_report.md");
    const bauSummary = read("docs/programme/472_bau_handoff_summary.md");

    expect(report).toContain("Blocked original summary claims");
    expect(report).toContain("not hidden");
    expect(report).not.toMatch(/Phase 7[^.\n]*complete/i);

    if (scorecard.scorecardState === "exact") {
      expect(bauSummary).toContain("BAU state is ready");
      expect(scorecard.bauHandoffState).toBe("ready_for_bau_handoff");
    } else {
      expect(bauSummary).toContain("BAU state is blocked");
      expect(bauSummary).not.toContain("BAU state is ready");
    }
  });
});
