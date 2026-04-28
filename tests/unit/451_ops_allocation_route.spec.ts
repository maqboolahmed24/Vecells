import { describe, expect, it } from "vitest";
import {
  createInitialOpsShellState,
  navigateOpsShell,
  resolveOpsBoardSnapshot,
  returnFromOpsChildRoute,
  selectOpsAnomaly,
} from "../../apps/ops-console/src/operations-shell-seed.model";
import {
  createOpsAllocationFixture,
  createOpsAllocationProjection,
} from "../../apps/ops-console/src/operations-allocation-phase9.model";

describe("451 operations allocation route contracts", () => {
  it("renders required allocation surfaces and table parity data", () => {
    const projection = createOpsAllocationProjection("queues", "normal");

    expect(projection.bottleneckLadder).toHaveLength(5);
    expect(projection.capacityRows).toHaveLength(3);
    expect(projection.cohortRows).toHaveLength(4);
    expect(projection.interventionCandidates).toHaveLength(3);
    expect(projection.actionEligibilityFence.eligibilityState).toBe("executable");
  });

  it("keeps one selected anomaly across queues and capacity route snapshots", () => {
    const queues = resolveOpsBoardSnapshot(
      selectOpsAnomaly(createInitialOpsShellState("/ops/queues"), "ops-route-04"),
      1440,
    );
    const capacity = resolveOpsBoardSnapshot(
      selectOpsAnomaly(createInitialOpsShellState("/ops/capacity"), "ops-route-15"),
      1440,
    );

    expect(queues.allocationProjection.selectedAnomalyRef).toBe("ops-route-04");
    expect(queues.allocationProjection.bottleneckLadder.filter((row) => row.selected)).toHaveLength(
      1,
    );
    expect(capacity.allocationProjection.selectedAnomalyRef).toBe("ops-route-15");
    expect(
      capacity.allocationProjection.bottleneckLadder.filter((row) => row.selected),
    ).toHaveLength(1);
  });

  it("fails closed for degraded stale quarantined blocked permission denied and settlement states", () => {
    const fixture = createOpsAllocationFixture();

    expect(
      fixture.scenarioProjections.queues.degraded.actionEligibilityFence.eligibilityState,
    ).toBe("handoff_required");
    expect(fixture.scenarioProjections.queues.stale.actionEligibilityFence.eligibilityState).toBe(
      "stale_reacquire",
    );
    expect(
      fixture.scenarioProjections.queues.quarantined.actionEligibilityFence.eligibilityState,
    ).toBe("read_only_recovery");
    expect(fixture.scenarioProjections.queues.blocked.actionEligibilityFence.eligibilityState).toBe(
      "blocked",
    );
    expect(
      fixture.scenarioProjections.queues.permission_denied.actionEligibilityFence.eligibilityState,
    ).toBe("blocked");
    expect(
      fixture.scenarioProjections.queues.settlement_pending.candidateLease.settlementStatus,
    ).toBe("pending_effect");
  });

  it("scenario compare and return token preserve selected anomaly without re-ranking", () => {
    const board = selectOpsAnomaly(createInitialOpsShellState("/ops/queues"), "ops-route-04");
    const before = resolveOpsBoardSnapshot(board, 1440);
    const compare = navigateOpsShell(board, "/ops/queues/compare/ops-route-04");
    const compared = resolveOpsBoardSnapshot(compare, 1480);
    const returned = resolveOpsBoardSnapshot(returnFromOpsChildRoute(compare), 1440);

    expect(compared.allocationProjection.scenarioCompare.rankOrderStable).toBe(true);
    expect(compared.allocationProjection.selectedAnomalyRef).toBe("ops-route-04");
    expect(compare.returnToken?.selectedAnomalyId).toBe("ops-route-04");
    expect(returned.location.pathname).toBe("/ops/queues");
    expect(returned.selectedAnomaly.anomalyId).toBe(before.selectedAnomaly.anomalyId);
  });

  it("low-sample cohort cannot become dominant even with high point pressure", () => {
    const projection = createOpsAllocationProjection("queues", "normal");
    const lowSampleCohort = projection.cohortRows.find((row) => row.lowSample);
    const lowSampleBottleneck = projection.bottleneckLadder.find(
      (row) => row.anomalyRef === "ops-route-21",
    );

    expect(lowSampleCohort?.pressureIndex).toBeGreaterThan(80);
    expect(lowSampleCohort?.promotionState).toBe("context_only");
    expect(lowSampleBottleneck?.rank).toBeGreaterThan(1);
  });
});
