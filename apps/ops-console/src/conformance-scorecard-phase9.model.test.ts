import { describe, expect, it } from "vitest";
import {
  CONFORMANCE_SCORECARD_GAP_ARTIFACT_REF,
  CONFORMANCE_SCORECARD_SCHEMA_VERSION,
  CONFORMANCE_SCORECARD_VISUAL_MODE,
  createCrossPhaseConformanceScorecardFixture,
  createCrossPhaseConformanceScorecardProjection,
  normalizeConformanceScorecardScenarioState,
} from "./conformance-scorecard-phase9.model";

describe("task 460 conformance scorecard projection", () => {
  it("normalizes route scenario aliases", () => {
    expect(normalizeConformanceScorecardScenarioState("exact")).toBe("exact");
    expect(normalizeConformanceScorecardScenarioState("summary-drift")).toBe("summary_drift");
    expect(normalizeConformanceScorecardScenarioState("missing-verification")).toBe(
      "missing_verification",
    );
    expect(normalizeConformanceScorecardScenarioState("permission-denied")).toBe(
      "permission_denied",
    );
  });

  it("projects an exact service-owner scorecard from canonical conformance rows", () => {
    const projection = createCrossPhaseConformanceScorecardProjection({ scenarioState: "exact" });

    expect(projection.schemaVersion).toBe(CONFORMANCE_SCORECARD_SCHEMA_VERSION);
    expect(projection.visualMode).toBe(CONFORMANCE_SCORECARD_VISUAL_MODE);
    expect(projection.route).toBe("/ops/conformance");
    expect(projection.scorecardHash.scorecardState).toBe("exact");
    expect(projection.bauSignoffReadiness.actionState).toBe("ready");
    expect(projection.phaseRows.length).toBeGreaterThanOrEqual(5);
    expect(projection.controlFamilyMatrix.cells.length).toBe(
      projection.controlFamilyMatrix.families.length *
        projection.controlFamilyMatrix.dimensions.length,
    );
  });

  it("fails closed for summary drift, missing verification, stale runtime, and ops proof gaps", () => {
    for (const scenarioState of [
      "summary_drift",
      "missing_verification",
      "stale_runtime_tuple",
      "missing_ops_proof",
      "blocked",
    ] as const) {
      const projection = createCrossPhaseConformanceScorecardProjection({ scenarioState });

      expect(projection.scorecardHash.scorecardState).toBe("blocked");
      expect(projection.bauSignoffReadiness.actionAllowed).toBe(false);
      expect(projection.blockerQueue.blockerCount).toBeGreaterThan(0);
    }
  });

  it("keeps deferred channel rows explicit without pretending they are live blockers", () => {
    const projection = createCrossPhaseConformanceScorecardProjection({
      scenarioState: "deferred_channel",
      stateFilter: "deferred",
    });

    expect(projection.visibleRows).toHaveLength(1);
    expect(projection.visibleRows[0]?.rowKind).toBe("deferred_channel");
    expect(projection.visibleRows[0]?.rowHashParity).toBe("deferred");
    expect(projection.bauSignoffReadiness.actionState).toBe("ready");
  });

  it("suppresses raw URLs and publishes the interface gap adapter", () => {
    const projection = createCrossPhaseConformanceScorecardProjection({
      scenarioState: "permission_denied",
    });

    expect(projection.interfaceGapArtifactRef).toBe(CONFORMANCE_SCORECARD_GAP_ARTIFACT_REF);
    expect(projection.noRawArtifactUrls).toBe(true);
    expect(projection.safeHandoffLinks.every((link) => link.rawArtifactUrlSuppressed)).toBe(true);
    expect(JSON.stringify(projection)).not.toMatch(/https?:\/\//);
  });

  it("publishes deterministic fixtures for all Playwright visual states", () => {
    const fixture = createCrossPhaseConformanceScorecardFixture();
    const recomputed = createCrossPhaseConformanceScorecardFixture();

    expect(fixture.schemaVersion).toBe(CONFORMANCE_SCORECARD_SCHEMA_VERSION);
    expect(fixture.scenarioProjections.exact.scorecardHash.scorecardHash).toBe(
      recomputed.scenarioProjections.exact.scorecardHash.scorecardHash,
    );
    expect(Object.keys(fixture.scenarioProjections)).toEqual(
      expect.arrayContaining([
        "exact",
        "stale",
        "blocked",
        "deferred_channel",
        "no_blocker",
        "permission_denied",
      ]),
    );
  });
});
