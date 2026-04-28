import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildProgrammeConformanceScorecard,
  sha256,
  stableStringify,
  writeProgrammeConformanceArtifacts,
} from "../../tools/conformance/generate_472_programme_conformance_scorecard";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("task 472 scorecard hash determinism", () => {
  it("rebuilds the same scorecard hash from ordered canonical inputs", () => {
    const first = buildProgrammeConformanceScorecard();
    const second = buildProgrammeConformanceScorecard();

    expect(second.scorecard.scorecardHash).toBe(first.scorecard.scorecardHash);
    expect(second.scorecard.scorecardHashInputs).toEqual(first.scorecard.scorecardHashInputs);
    expect(second.phaseConformanceRows.map((row) => row.rowHash)).toEqual(
      first.phaseConformanceRows.map((row) => row.rowHash),
    );
    expect(second.controlFamilyRows.map((row) => row.rowHash)).toEqual(
      first.controlFamilyRows.map((row) => row.rowHash),
    );
  });

  it("matches every row hash to stable JSON without the rowHash field", () => {
    const artifact = buildProgrammeConformanceScorecard();
    for (const row of [...artifact.phaseConformanceRows, ...artifact.controlFamilyRows]) {
      const { rowHash, ...rowWithoutHash } = row;
      expect(sha256(stableStringify(rowWithoutHash))).toBe(rowHash);
    }
  });

  it("writes byte-stable scorecard JSON across repeated generator runs", () => {
    writeProgrammeConformanceArtifacts();
    const first = sha256(read("data/conformance/472_cross_phase_conformance_scorecard.json"));
    writeProgrammeConformanceArtifacts();
    const second = sha256(read("data/conformance/472_cross_phase_conformance_scorecard.json"));

    expect(second).toBe(first);
  });
});
