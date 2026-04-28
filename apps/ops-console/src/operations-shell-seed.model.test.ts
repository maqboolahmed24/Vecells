import { describe, expect, it } from "vitest";
import {
  createInitialOpsShellState,
  createOpsDeltaGate,
  navigateOpsShell,
  parseOpsPath,
  rankOpsAnomalies,
  resolveOpsBoardSnapshot,
  returnFromOpsChildRoute,
  selectOpsAnomaly,
  setOpsDeltaGateState,
} from "./operations-shell-seed.model";

describe("operations shell seed model", () => {
  it("parses board and drilldown routes into the canonical route families", () => {
    expect(parseOpsPath("/ops/overview")).toMatchObject({
      lens: "overview",
      routeFamilyRef: "rf_operations_board",
      childRouteKind: null,
    });

    expect(parseOpsPath("/ops/resilience/health/ops-route-18")).toMatchObject({
      lens: "resilience",
      routeFamilyRef: "rf_operations_drilldown",
      childRouteKind: "health",
      opsRouteIntentId: "ops-route-18",
    });
  });

  it("keeps the selected anomaly pinned while delta posture changes", () => {
    const initial = createInitialOpsShellState("/ops/queues", {
      selectedAnomalyId: "ops-route-07",
    });
    const selected = selectOpsAnomaly(initial, "ops-route-07");
    const buffered = setOpsDeltaGateState(selected, "buffered");
    const stale = setOpsDeltaGateState(buffered, "stale");

    expect(buffered.selectedAnomalyId).toBe("ops-route-07");
    expect(stale.selectedAnomalyId).toBe("ops-route-07");
    expect(resolveOpsBoardSnapshot(stale, 1440).selectionLease.leaseState).toBe("frozen");
  });

  it("returns from child routes through the OpsReturnToken law instead of raw history", () => {
    const board = createInitialOpsShellState("/ops/audit", {
      selectedAnomalyId: "ops-route-12",
    });
    const drilldown = navigateOpsShell(board, "/ops/audit/investigations/ops-route-12");
    const returned = returnFromOpsChildRoute(drilldown);

    expect(drilldown.location.routeFamilyRef).toBe("rf_operations_drilldown");
    expect(returned.location.pathname).toBe("/ops/audit");
    expect(returned.location.routeFamilyRef).toBe("rf_operations_board");
    expect(returned.selectedAnomalyId).toBe("ops-route-12");
  });

  it("downgrades stale and table-only delta gates to truthful visualization modes", () => {
    expect(createOpsDeltaGate("stale").visualizationMode).toBe("summary_only");
    expect(createOpsDeltaGate("table_only").visualizationMode).toBe("table_only");
  });

  it("prioritizes current-lens anomalies without deleting lower-noise watchpoints", () => {
    const ranked = rankOpsAnomalies("dependencies", "live");
    expect(ranked[0]?.anomalyId).toBe("ops-route-04");
    expect(ranked.some((anomaly) => anomaly.anomalyId === "ops-route-21")).toBe(true);
  });
});
