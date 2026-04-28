import { describe, expect, it } from "vitest";
import {
  createInitialOpsShellState,
  resolveOpsBoardSnapshot,
  selectOpsHealthCell,
} from "../../apps/ops-console/src/operations-shell-seed.model";
import {
  createOpsResilienceFixture,
  createOpsResilienceProjection,
} from "../../apps/ops-console/src/operations-resilience-phase9.model";

describe("453 operations resilience route contracts", () => {
  it("renders required resilience board proof surfaces", () => {
    const projection = createOpsResilienceProjection("normal");

    expect(projection.route).toBe("/ops/resilience");
    expect(projection.essentialFunctions).toHaveLength(10);
    expect(projection.dependencyRestoreBands).toHaveLength(10);
    expect(projection.recoveryRunEvents).toHaveLength(3);
    expect(projection.actionRail).toHaveLength(10);
    expect(projection.latestSettlement.result).toBe("applied");
  });

  it("keeps restore failover and chaos controls settlement-bound", () => {
    const pending = createOpsResilienceProjection("settlement_pending");
    const blocked = createOpsResilienceProjection("blocked");

    expect(pending.latestSettlement.result).toBe("accepted_pending_evidence");
    expect(
      pending.actionRail
        .filter((action) => action.allowed)
        .every((action) => action.settlementResult === "accepted_pending_evidence"),
    ).toBe(true);
    expect(blocked.actionRail.every((action) => action.allowed === false)).toBe(true);
    expect(blocked.latestSettlement.result).toBe("blocked_readiness");
  });

  it("distinguishes stale runbook missing backup active freeze and degraded trust", () => {
    expect(createOpsResilienceProjection("stale").runbookBindings[0]?.bindingState).toBe("stale");
    expect(createOpsResilienceProjection("blocked").backupFreshness.manifestState).toBe("missing");
    expect(createOpsResilienceProjection("freeze").recoveryControlPosture.freezeState).toBe(
      "active",
    );
    expect(createOpsResilienceProjection("degraded").recoveryControlPosture.trustState).toBe(
      "degraded",
    );
  });

  it("preserves selected essential function through the shell snapshot", () => {
    const selected = selectOpsHealthCell(
      createInitialOpsShellState("/ops/resilience"),
      "svc_pharmacy_loop",
    );
    const snapshot = resolveOpsBoardSnapshot(selected, 1440);

    expect(snapshot.resilienceProjection.selectedFunctionCode).toBe("pharmacy_referral_loop");
    expect(
      snapshot.resilienceProjection.essentialFunctions.filter((row) => row.selected),
    ).toHaveLength(1);
    expect(snapshot.resilienceProjection.boardTupleHash).toContain("pharmacy_referral_loop");
  });

  it("blocks external artifact handoff when graph or tuple posture is not current", () => {
    expect(createOpsResilienceProjection("normal").artifactStage.artifactState).toBe(
      "external_handoff_ready",
    );
    expect(createOpsResilienceProjection("stale").artifactStage.artifactState).toBe(
      "governed_preview",
    );
    expect(createOpsResilienceProjection("permission_denied").artifactStage.artifactState).toBe(
      "summary_only",
    );
  });

  it("publishes deterministic fixture coverage for every resilience scenario", () => {
    const fixture = createOpsResilienceFixture();

    expect(Object.keys(fixture.scenarioProjections)).toEqual(
      expect.arrayContaining([
        "normal",
        "empty",
        "stale",
        "degraded",
        "blocked",
        "permission_denied",
        "freeze",
        "settlement_pending",
      ]),
    );
    expect(fixture.scenarioProjections.normal.runtimeBinding.bindingState).toBe("live");
    expect(fixture.scenarioProjections.permission_denied.runtimeBinding.bindingState).toBe(
      "blocked",
    );
  });
});
