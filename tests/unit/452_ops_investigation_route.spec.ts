import { describe, expect, it } from "vitest";
import {
  createInitialOpsShellState,
  navigateOpsShell,
  resolveOpsBoardSnapshot,
  returnFromOpsChildRoute,
  setOpsDeltaGateState,
} from "../../apps/ops-console/src/operations-shell-seed.model";
import {
  createOpsInvestigationFixture,
  createOpsInvestigationProjection,
} from "../../apps/ops-console/src/operations-investigation-phase9.model";

describe("452 operations investigation route contracts", () => {
  it("renders required investigation drawer and audit explorer data", () => {
    const projection = createOpsInvestigationProjection("overview", "normal");

    expect(projection.scopeEnvelope.purposeOfUse).toBe("operations_investigation");
    expect(projection.timelineEvents).toHaveLength(4);
    expect(projection.evidenceGraph.graphRows).toHaveLength(3);
    expect(projection.breakGlassReview.authorizedVisibility).toBe(true);
    expect(projection.supportReplayBoundary.replayDeterminismState).toBe("exact");
    expect(projection.bundleExport.exportState).toBe("export_ready");
  });

  it("keeps drawer question hash stable across stale proof drift", () => {
    const normal = createOpsInvestigationProjection("queues", "normal", "ops-route-04");
    const stale = createOpsInvestigationProjection("queues", "stale", "ops-route-04");

    expect(stale.investigationQuestionHash).toBe(normal.investigationQuestionHash);
    expect(stale.drawerSession.deltaState).toBe("drifted");
    expect(stale.newerProofDiffSummary).toContain(normal.investigationQuestionHash);
    expect(stale.timelineReconstruction.timelineState).toBe("stale");
  });

  it("blocks replay export when graph completeness or visibility is missing", () => {
    const fixture = createOpsInvestigationFixture();

    expect(fixture.scenarioProjections.audit.quarantined.evidenceGraph.verdictState).toBe(
      "blocked",
    );
    expect(fixture.scenarioProjections.audit.blocked.bundleExport.exportState).toBe("blocked");
    expect(
      fixture.scenarioProjections.audit.permission_denied.breakGlassReview.authorizedVisibility,
    ).toBe(false);
    expect(
      fixture.scenarioProjections.audit.permission_denied.supportReplayBoundary
        .restoreEligibilityState,
    ).toBe("blocked");
    expect(fixture.scenarioProjections.audit.settlement_pending.bundleExport.exportState).toBe(
      "redaction_review",
    );
  });

  it("binds /ops/:lens/investigations route state to selected anomaly and return token", () => {
    const selected = navigateOpsShell(
      createInitialOpsShellState("/ops/overview"),
      "/ops/overview/investigations/ops-route-04",
    );
    const snapshot = resolveOpsBoardSnapshot(selected, 1440);
    const returned = resolveOpsBoardSnapshot(returnFromOpsChildRoute(selected), 1440);

    expect(snapshot.location.childRouteKind).toBe("investigations");
    expect(snapshot.investigationProjection.route).toBe(
      "/ops/:lens/investigations/:opsRouteIntentId",
    );
    expect(snapshot.investigationProjection.selectedAnomalyRef).toBe("ops-route-04");
    expect(snapshot.returnToken?.originPath).toBe("/ops/overview");
    expect(returned.location.pathname).toBe("/ops/overview");
    expect(returned.selectedAnomaly.anomalyId).toBe("ops-route-04");
  });

  it("audit root exposes audit-origin investigation projection", () => {
    const snapshot = resolveOpsBoardSnapshot(createInitialOpsShellState("/ops/audit"), 1440);

    expect(snapshot.location.childRouteKind).toBeNull();
    expect(snapshot.investigationProjection.originLens).toBe("audit");
    expect(snapshot.investigationProjection.route).toBe("/ops/audit");
    expect(snapshot.investigationProjection.auditQuerySession.causalityState).toBe("complete");
  });

  it("stale drawer remains read-only instead of rebasing the preserved question", () => {
    const drawer = navigateOpsShell(
      createInitialOpsShellState("/ops/queues"),
      "/ops/queues/investigations/ops-route-07",
    );
    const stale = resolveOpsBoardSnapshot(setOpsDeltaGateState(drawer, "stale"), 1440);

    expect(stale.investigationProjection.drawerSession.deltaState).toBe("drifted");
    expect(stale.investigationProjection.drawerSession.continuityQuestionHash).toBe(
      stale.investigationProjection.investigationQuestionHash,
    );
    expect(stale.workbenchState).toBe("frozen");
  });
});
