import { describe, expect, it } from "vitest";
import {
  createInitialOpsShellState,
  navigateOpsShell,
  resolveOpsBoardSnapshot,
  returnFromOpsChildRoute,
  setOpsDeltaGateState,
} from "./operations-shell-seed.model";
import {
  OPS_INVESTIGATION_SCHEMA_VERSION,
  createOpsInvestigationFixture,
  createOpsInvestigationProjection,
  normalizeOpsInvestigationScenarioState,
} from "./operations-investigation-phase9.model";

describe("task 452 operations investigation projection", () => {
  it("normalizes investigation scenario aliases", () => {
    expect(normalizeOpsInvestigationScenarioState("permission-denied")).toBe("permission_denied");
    expect(normalizeOpsInvestigationScenarioState("settlement-pending")).toBe("settlement_pending");
    expect(normalizeOpsInvestigationScenarioState("unknown")).toBe("normal");
  });

  it("publishes exact normal graph timeline replay and export state", () => {
    const projection = createOpsInvestigationProjection("overview", "normal", "ops-route-07");

    expect(projection.schemaVersion).toBe(OPS_INVESTIGATION_SCHEMA_VERSION);
    expect(projection.timelineReconstruction.timelineState).toBe("exact");
    expect(projection.evidenceGraph.verdictState).toBe("complete");
    expect(projection.supportReplayBoundary.restoreEligibilityState).toBe("restore_live");
    expect(projection.bundleExport.exportState).toBe("export_ready");
    expect(projection.timelineEvents.filter((event) => event.selected)).toHaveLength(1);
  });

  it("fails closed for stale quarantined blocked and permission-denied graph gaps", () => {
    expect(createOpsInvestigationProjection("audit", "stale").evidenceGraph.verdictState).toBe(
      "stale",
    );
    expect(createOpsInvestigationProjection("audit", "stale").bundleExport.exportState).toBe(
      "summary_only",
    );
    expect(
      createOpsInvestigationProjection("audit", "quarantined").evidenceGraph.verdictState,
    ).toBe("blocked");
    expect(createOpsInvestigationProjection("audit", "blocked").bundleExport.exportState).toBe(
      "blocked",
    );
    expect(
      createOpsInvestigationProjection("audit", "permission_denied").breakGlassReview
        .authorizedVisibility,
    ).toBe(false);
  });

  it("keeps the investigation question hash stable while drawer delta drifts", () => {
    const normal = createOpsInvestigationProjection("overview", "normal", "ops-route-04");
    const stale = createOpsInvestigationProjection("overview", "stale", "ops-route-04");

    expect(stale.investigationQuestionHash).toBe(normal.investigationQuestionHash);
    expect(stale.scopeEnvelope.scopeHash).not.toBe(normal.scopeEnvelope.scopeHash);
    expect(stale.drawerSession.deltaState).toBe("drifted");
    expect(stale.restoreReport.restoreState).toBe("nearest_valid");
  });

  it("binds drawer and audit explorer projections into shell snapshots", () => {
    const drawer = resolveOpsBoardSnapshot(
      createInitialOpsShellState("/ops/overview/investigations/ops-route-07"),
      1440,
    );
    const audit = resolveOpsBoardSnapshot(createInitialOpsShellState("/ops/audit"), 1440);

    expect(drawer.location.childRouteKind).toBe("investigations");
    expect(drawer.investigationProjection.originLens).toBe("overview");
    expect(drawer.investigationProjection.selectedAnomalyRef).toBe("ops-route-07");
    expect(drawer.investigationProjection.drawerSession.deltaState).toBe("aligned");
    expect(audit.location.lens).toBe("audit");
    expect(audit.investigationProjection.originLens).toBe("audit");
    expect(audit.investigationProjection.route).toBe("/ops/audit");
  });

  it("downgrades investigation drawer workbench state on stale live deltas", () => {
    const drawer = navigateOpsShell(
      createInitialOpsShellState("/ops/overview"),
      "/ops/overview/investigations/ops-route-07",
    );
    const stale = setOpsDeltaGateState(drawer, "stale");
    const snapshot = resolveOpsBoardSnapshot(stale, 1440);

    expect(snapshot.location.childRouteKind).toBe("investigations");
    expect(snapshot.investigationProjection.drawerSession.deltaState).toBe("drifted");
    expect(snapshot.workbenchState).toBe("frozen");
  });

  it("return token restores the root board and selected anchor", () => {
    const drawer = navigateOpsShell(
      createInitialOpsShellState("/ops/queues"),
      "/ops/queues/investigations/ops-route-04",
    );
    const returned = resolveOpsBoardSnapshot(returnFromOpsChildRoute(drawer), 1440);

    expect(returned.location.pathname).toBe("/ops/queues");
    expect(returned.selectedAnomaly.anomalyId).toBe("ops-route-04");
    expect(drawer.returnToken?.selectedAnomalyId).toBe("ops-route-07");
  });

  it("publishes all task 452 route fixtures deterministically", () => {
    const fixture = createOpsInvestigationFixture();
    const recomputed = createOpsInvestigationFixture();

    expect(fixture.schemaVersion).toBe(OPS_INVESTIGATION_SCHEMA_VERSION);
    expect(fixture.scenarioProjections.audit.normal.boardStateDigestRef).toBe(
      recomputed.scenarioProjections.audit.normal.boardStateDigestRef,
    );
    expect(fixture.automationAnchors).toEqual(
      expect.arrayContaining([
        "investigation-drawer",
        "investigation-question",
        "timeline-ladder",
        "audit-explorer",
        "break-glass-review",
        "support-replay-boundary",
        "evidence-graph-mini-map",
        "safe-return-anchor",
      ]),
    );
  });
});
