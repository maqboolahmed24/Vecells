import { describe, expect, it } from "vitest";
import {
  createInitialOpsShellState,
  resolveOpsBoardSnapshot,
  returnFromOpsChildRoute,
  selectOpsHealthCell,
  navigateOpsShell,
} from "../../apps/ops-console/src/operations-shell-seed.model";
import {
  createOpsOverviewFixture,
  createOpsOverviewProjection,
} from "../../apps/ops-console/src/operations-overview-phase9.model";

describe("450 operations overview route contracts", () => {
  it("first stable render uses six vitals and six health cells", () => {
    const stable = createOpsOverviewProjection("stable_service");

    expect(stable.northStarBand).toHaveLength(6);
    expect(stable.serviceHealth).toHaveLength(6);
    expect(stable.stableServiceDigest?.opsStableServiceDigestId).toMatch(/^OSD_450_/);
    expect(stable.dominantSurfaceRef).toBe("OpsStableServiceDigest");
  });

  it("normal degraded blocked quarantined and freeze states fail closed", () => {
    const fixture = createOpsOverviewFixture();

    expect(fixture.scenarioProjections.normal.freshnessStrip.publicationState).toBe("live");
    expect(fixture.scenarioProjections.degraded.freshnessStrip.publicationState).toBe(
      "diagnostic_only",
    );
    expect(fixture.scenarioProjections.quarantined.freshnessStrip.trustState).toBe("quarantined");
    expect(fixture.scenarioProjections.blocked.freshnessStrip.publicationState).toBe("blocked");
    expect(fixture.scenarioProjections.freeze.freshnessStrip.freezeState).toBe("release_freeze");
  });

  it("return token restores the same board digest and selected health cell from health drill-in", () => {
    const board = selectOpsHealthCell(
      createInitialOpsShellState("/ops/overview", {
        overviewState: "normal",
        selectedHealthCellRef: "svc_notification",
      }),
      "svc_notification",
    );
    const before = resolveOpsBoardSnapshot(board, 1440);
    const drill = navigateOpsShell(board, "/ops/overview/health/ops-route-04");
    const returned = returnFromOpsChildRoute(drill);
    const after = resolveOpsBoardSnapshot(returned, 1440);

    expect(drill.returnToken?.boardStateDigestRef).toBe(before.boardStateDigestRef);
    expect(drill.returnToken?.selectedHealthCellRef).toBe("svc_notification");
    expect(after.location.pathname).toBe("/ops/overview");
    expect(after.selectedHealthCellRef).toBe("svc_notification");
    expect(after.boardStateDigestRef).toBe(before.boardStateDigestRef);
  });
});
