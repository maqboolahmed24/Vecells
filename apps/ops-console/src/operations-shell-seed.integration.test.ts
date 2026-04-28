import { describe, expect, it } from "vitest";
import {
  createInitialOpsShellState,
  navigateOpsShell,
  openOpsGovernanceHandoff,
  resolveOpsBoardSnapshot,
} from "./operations-shell-seed.model";

describe("operations shell continuity integration", () => {
  it("preserves the same shell continuity key across board to compare transitions", () => {
    const board = createInitialOpsShellState("/ops/incidents", {
      selectedAnomalyId: "ops-route-15",
    });
    const compare = navigateOpsShell(board, "/ops/incidents/compare/ops-route-15");

    expect(board.continuitySnapshot.selectedAnchor.continuityFrameRef).toBe("ops.board");
    expect(compare.continuitySnapshot.selectedAnchor.continuityFrameRef).toBe("ops.board");
    expect(compare.location.routeFamilyRef).toBe("rf_operations_drilldown");
  });

  it("records a bounded governance handoff without replacing the operations shell", () => {
    const board = createInitialOpsShellState("/ops/dependencies", {
      selectedAnomalyId: "ops-route-04",
    });
    const withHandoff = openOpsGovernanceHandoff(board);

    expect(withHandoff.governanceHandoff?.returnToken.originPath).toBe("/ops/dependencies");
    expect(withHandoff.location.routeFamilyRef).toBe("rf_operations_board");
    expect(withHandoff.telemetry.at(-1)?.eventClass).toBe("dominant_action_changed");
  });

  it("opens three-plane posture only for compare and incident-command contexts", () => {
    const compare = createInitialOpsShellState("/ops/incidents/compare/ops-route-15", {
      selectedAnomalyId: "ops-route-15",
    });
    const queues = createInitialOpsShellState("/ops/queues", {
      selectedAnomalyId: "ops-route-07",
    });

    expect(resolveOpsBoardSnapshot(compare, 1440).frameMode).toBe("three_plane");
    expect(resolveOpsBoardSnapshot(queues, 1440).frameMode).toBe("two_plane");
  });
});
