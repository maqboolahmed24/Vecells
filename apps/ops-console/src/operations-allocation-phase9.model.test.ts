import { describe, expect, it } from "vitest";
import {
  createInitialOpsShellState,
  resolveOpsBoardSnapshot,
  selectOpsAnomaly,
  setOpsDeltaGateState,
} from "./operations-shell-seed.model";
import {
  OPS_ALLOCATION_SCHEMA_VERSION,
  createOpsAllocationFixture,
  createOpsAllocationProjection,
  normalizeOpsAllocationScenarioState,
} from "./operations-allocation-phase9.model";

describe("task 451 operations allocation projection", () => {
  it("normalizes allocation scenario aliases", () => {
    expect(normalizeOpsAllocationScenarioState("permission-denied")).toBe("permission_denied");
    expect(normalizeOpsAllocationScenarioState("settlement-pending")).toBe("settlement_pending");
    expect(normalizeOpsAllocationScenarioState("unknown")).toBe("normal");
  });

  it("publishes ranked bottleneck ladder with low-sample cohort blocked from dominance", () => {
    const projection = createOpsAllocationProjection("queues", "normal", "ops-route-07");
    const lowSampleCohort = projection.cohortRows.find((row) => row.lowSample);
    const lowSampleBottleneck = projection.bottleneckLadder.find(
      (row) => row.anomalyRef === "ops-route-21",
    );

    expect(projection.schemaVersion).toBe(OPS_ALLOCATION_SCHEMA_VERSION);
    expect(projection.bottleneckLadder).toHaveLength(5);
    expect(projection.bottleneckLadder[0]?.anomalyRef).toBe("ops-route-07");
    expect(lowSampleCohort?.promotionState).toBe("context_only");
    expect(lowSampleBottleneck?.rank).not.toBe(1);
  });

  it("downgrades intervention leases for stale quarantined blocked and settlement-pending states", () => {
    expect(createOpsAllocationProjection("queues", "normal").candidateLease.eligibilityState).toBe(
      "executable",
    );
    expect(createOpsAllocationProjection("queues", "stale").candidateLease.eligibilityState).toBe(
      "stale_reacquire",
    );
    expect(
      createOpsAllocationProjection("queues", "quarantined").candidateLease.eligibilityState,
    ).toBe("read_only_recovery");
    expect(createOpsAllocationProjection("queues", "blocked").candidateLease.eligibilityState).toBe(
      "blocked",
    );
    expect(
      createOpsAllocationProjection("queues", "settlement_pending").candidateLease.settlementStatus,
    ).toBe("pending_effect");
  });

  it("keeps capacity deltas writable only for executable projections", () => {
    const normal = createOpsAllocationProjection("capacity", "normal");
    const stale = createOpsAllocationProjection("capacity", "stale");

    expect(normal.capacityRows.some((row) => row.proposedDelta > 0)).toBe(true);
    expect(normal.capacityRows.every((row) => row.proposalState === "proposed")).toBe(true);
    expect(stale.capacityRows.every((row) => row.proposedDelta === 0)).toBe(true);
    expect(stale.capacityRows.every((row) => row.proposalState === "read_only")).toBe(true);
  });

  it("binds allocation projection into queues and capacity shell snapshots", () => {
    const queues = resolveOpsBoardSnapshot(createInitialOpsShellState("/ops/queues"), 1440);
    const capacity = resolveOpsBoardSnapshot(createInitialOpsShellState("/ops/capacity"), 1440);

    expect(queues.allocationProjection.routeLens).toBe("queues");
    expect(capacity.allocationProjection.routeLens).toBe("capacity");
    expect(queues.allocationProjection.selectedAnomalyRef).toBe(queues.selectedAnomaly.anomalyId);
    expect(queues.selectionLease.actionEligibilityState).toBe("live");
    expect(queues.workbenchState).toBe("live");
  });

  it("preserves selected anomaly while live deltas downgrade action state in place", () => {
    const selected = selectOpsAnomaly(createInitialOpsShellState("/ops/queues"), "ops-route-04");
    const stale = setOpsDeltaGateState(selected, "stale");
    const snapshot = resolveOpsBoardSnapshot(stale, 1440);

    expect(snapshot.selectedAnomaly.anomalyId).toBe("ops-route-04");
    expect(snapshot.allocationProjection.selectedAnomalyRef).toBe("ops-route-04");
    expect(snapshot.allocationProjection.actionEligibilityFence.eligibilityState).toBe(
      "stale_reacquire",
    );
    expect(snapshot.workbenchState).toBe("frozen");
  });

  it("publishes all task 451 route fixtures deterministically", () => {
    const fixture = createOpsAllocationFixture();
    const recomputed = createOpsAllocationFixture();

    expect(fixture.schemaVersion).toBe(OPS_ALLOCATION_SCHEMA_VERSION);
    expect(fixture.scenarioProjections.queues.normal.boardStateDigestRef).toBe(
      recomputed.scenarioProjections.queues.normal.boardStateDigestRef,
    );
    expect(fixture.automationAnchors).toEqual(
      expect.arrayContaining([
        "bottleneck-radar",
        "capacity-allocator",
        "cohort-impact-matrix",
        "intervention-workbench",
        "action-eligibility-state",
        "scenario-compare",
        "ops-governance-handoff",
      ]),
    );
  });
});
