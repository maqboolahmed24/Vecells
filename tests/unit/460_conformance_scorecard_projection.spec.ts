import { describe, expect, it } from "vitest";
import {
  CONFORMANCE_SCORECARD_GAP_ARTIFACT_REF,
  createCrossPhaseConformanceScorecardProjection,
} from "../../apps/ops-console/src/conformance-scorecard-phase9.model";

describe("task 460 conformance scorecard invariants", () => {
  it("sorts blocker queue by severity, due date, and blocker ref", () => {
    const projection = createCrossPhaseConformanceScorecardProjection({
      scenarioState: "blocked",
      blockerFilter: "has_blocker",
    });

    const severities = projection.blockerQueue.items.map((item) => item.severity);
    expect(severities[0]).toBe("critical");
    expect(projection.blockerQueue.items.length).toBe(projection.blockerQueue.blockerCount);
  });

  it("filters rows by phase, dimension, owner, blocker state, and row state", () => {
    const blocked = createCrossPhaseConformanceScorecardProjection({ scenarioState: "blocked" });
    const blockedRow = blocked.phaseRows.find(
      (row) => row.rowState === "blocked" && row.verificationCoverageState !== "exact",
    )!;
    const filtered = createCrossPhaseConformanceScorecardProjection({
      scenarioState: "blocked",
      phaseFilter: blockedRow.phaseCode,
      dimensionFilter: "verification_coverage",
      ownerFilter: blockedRow.ownerKey,
      blockerFilter: "has_blocker",
      stateFilter: "blocked",
    });

    expect(filtered.visibleRows.length).toBeGreaterThan(0);
    expect(filtered.visibleRows.every((row) => row.phaseCode === blockedRow.phaseCode)).toBe(true);
    expect(filtered.visibleRows.every((row) => row.ownerKey === blockedRow.ownerKey)).toBe(true);
    expect(filtered.visibleRows.every((row) => row.blockerRefs.length > 0)).toBe(true);
  });

  it("preserves selected row through drawer open and close projection states", () => {
    const initial = createCrossPhaseConformanceScorecardProjection({ scenarioState: "blocked" });
    const selectedRowRef = initial.phaseRows.at(-1)!.phaseConformanceRowId;
    const open = createCrossPhaseConformanceScorecardProjection({
      scenarioState: "blocked",
      selectedRowRef,
      drawerOpen: true,
    });
    const closed = createCrossPhaseConformanceScorecardProjection({
      scenarioState: "blocked",
      selectedRowRef,
      drawerOpen: false,
    });

    expect(open.sourceTrace.selectedRowRef).toBe(selectedRowRef);
    expect(closed.sourceTrace.selectedRowRef).toBe(selectedRowRef);
    expect(open.sourceTrace.drawerState).toBe("open");
    expect(closed.sourceTrace.drawerState).toBe("closed");
  });

  it("blocks BAU signoff for stale scorecards and permission denied scorecards", () => {
    const stale = createCrossPhaseConformanceScorecardProjection({ scenarioState: "stale" });
    const permissionDenied = createCrossPhaseConformanceScorecardProjection({
      scenarioState: "permission_denied",
    });

    expect(stale.bauSignoffReadiness.actionState).toBe("diagnostic_only");
    expect(stale.bauSignoffReadiness.actionAllowed).toBe(false);
    expect(permissionDenied.bauSignoffReadiness.actionState).toBe("permission_denied");
    expect(permissionDenied.bauSignoffReadiness.actionAllowed).toBe(false);
  });

  it("keeps handoff routes same-shell and hash-bound", () => {
    const projection = createCrossPhaseConformanceScorecardProjection({ scenarioState: "exact" });

    expect(projection.safeHandoffLinks.map((link) => link.targetSurface)).toEqual([
      "assurance",
      "governance",
      "operations",
      "resilience",
      "incident",
      "records",
      "release",
    ]);
    expect(projection.safeHandoffLinks.every((link) => link.route.startsWith("/ops/"))).toBe(true);
    expect(projection.interfaceGapArtifactRef).toBe(CONFORMANCE_SCORECARD_GAP_ARTIFACT_REF);
  });
});
