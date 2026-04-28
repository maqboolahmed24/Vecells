import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { writeProgrammeConformanceArtifacts } from "../../tools/conformance/generate_472_programme_conformance_scorecard";

const root = process.cwd();

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

describe("task 472 Phase 7 deferred scope dependency handling", () => {
  beforeAll(() => {
    writeProgrammeConformanceArtifacts();
  });

  it("permits the core scorecard only with an explicit non-mandatory Phase 7 deferred row", () => {
    const scorecard = readJson<any>("data/conformance/472_cross_phase_conformance_scorecard.json");
    const phaseRows = readJson<any>("data/conformance/472_phase_conformance_rows.json").rows;
    const phase7 = phaseRows.find((row: any) => row.rowCode === "phase_7");

    expect(phase7).toBeTruthy();
    expect(phase7.rowId).toBe("phase_7_deferred_nhs_app_channel_scope");
    expect(phase7.rowState).toBe("deferred_scope");
    expect(phase7.mandatoryForCurrentCoreRelease).toBe(false);
    expect(phase7.permittedDeferredScope).toBe(true);
    expect(phase7.contractAdoptionState).toBe("partial");
    expect(scorecard.scorecardState).toBe("exact");
    expect(scorecard.permittedDeferredRows).toContain(phase7.rowId);
  });

  it("keeps Phase 7-derived active dependencies in current proof rows", () => {
    const note = readJson<any>(
      "data/conformance/472_deferred_scope_and_phase7_dependency_note.json",
    );
    const controlRows = readJson<any>(
      "data/conformance/472_cross_phase_control_family_rows.json",
    ).rows;
    const artifactGrantRow = controlRows.find(
      (row: any) => row.rowCode === "artifact_presentation_outbound_navigation_grant",
    );

    expect(note.deferredScopeState).toBe("permitted_explicit");
    expect(note.phase7LiveNhsAppLaunchState).toBe("deferred_to_task_473");
    expect(note.activeDependenciesRemainCurrent).toBe(true);
    for (const dependency of [
      "route-freeze:ops-conformance",
      "ArtifactPresentationContract",
      "OutboundNavigationGrant",
      "PatientEmbeddedNavEligibility",
      "BridgeCapabilityMatrix",
      "embedded-context-resolution",
      "continuity-return-token",
    ]) {
      expect(note.activeDependencyRefs).toContain(dependency);
    }

    expect(artifactGrantRow.rowState).toBe("exact");
    expect(artifactGrantRow.activeDependencyRefs).toEqual(
      expect.arrayContaining([
        "ArtifactPresentationContract",
        "OutboundNavigationGrant",
        "continuity-return-token",
      ]),
    );
  });
});
