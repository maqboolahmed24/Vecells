import { describe, expect, it } from "vitest";
import {
  createInitialOpsShellState,
  resolveOpsBoardSnapshot,
  selectOpsHealthCell,
  setOpsDeltaGateState,
} from "./operations-shell-seed.model";
import {
  OPS_RESILIENCE_SCHEMA_VERSION,
  createOpsResilienceFixture,
  createOpsResilienceProjection,
  normalizeOpsResilienceScenarioState,
} from "./operations-resilience-phase9.model";

describe("task 453 operations resilience projection", () => {
  it("normalizes resilience scenario aliases", () => {
    expect(normalizeOpsResilienceScenarioState("permission-denied")).toBe("permission_denied");
    expect(normalizeOpsResilienceScenarioState("settlement-pending")).toBe("settlement_pending");
    expect(normalizeOpsResilienceScenarioState("unknown")).toBe("normal");
  });

  it("publishes a live recovery-proof wall for normal posture", () => {
    const projection = createOpsResilienceProjection("normal", "svc_recovery");

    expect(projection.schemaVersion).toBe(OPS_RESILIENCE_SCHEMA_VERSION);
    expect(projection.runtimeBinding.bindingState).toBe("live");
    expect(projection.recoveryControlPosture.postureState).toBe("live_control");
    expect(projection.readinessSnapshot.readinessState).toBe("ready");
    expect(projection.backupFreshness.manifestState).toBe("current");
    expect(projection.runTimeline.timelineState).toBe("exact");
    expect(projection.essentialFunctions).toHaveLength(10);
    expect(projection.dependencyRestoreBands).toHaveLength(10);
    expect(projection.artifactStage.artifactState).toBe("external_handoff_ready");
  });

  it("fails closed for stale degraded freeze blocked permission and pending settlement", () => {
    expect(createOpsResilienceProjection("stale").runtimeBinding.bindingState).toBe(
      "diagnostic_only",
    );
    expect(createOpsResilienceProjection("stale").runbookBindings[0]?.bindingState).toBe("stale");
    expect(createOpsResilienceProjection("degraded").recoveryControlPosture.postureState).toBe(
      "diagnostic_only",
    );
    expect(createOpsResilienceProjection("freeze").recoveryControlPosture.postureState).toBe(
      "governed_recovery",
    );
    expect(createOpsResilienceProjection("blocked").backupFreshness.manifestState).toBe("missing");
    expect(createOpsResilienceProjection("permission_denied").runtimeBinding.bindingState).toBe(
      "blocked",
    );
    expect(createOpsResilienceProjection("settlement_pending").latestSettlement.result).toBe(
      "accepted_pending_evidence",
    );
  });

  it("keeps historical runs visible but non-authoritative after tuple drift", () => {
    const stale = createOpsResilienceProjection("stale", "svc_recovery");

    expect(stale.runTimeline.timelineState).toBe("stale");
    expect(stale.recoveryRunEvents.every((event) => event.currentAuthority)).toBe(true);
    expect(
      stale.recoveryRunEvents.some((event) => event.currentAuthority === "historical_only"),
    ).toBe(true);
    expect(stale.historicalRunWarning).toContain("cannot satisfy current posture");
  });

  it("binds resilience projection into /ops/resilience shell snapshots", () => {
    const snapshot = resolveOpsBoardSnapshot(createInitialOpsShellState("/ops/resilience"), 1440);

    expect(snapshot.location.lens).toBe("resilience");
    expect(snapshot.resilienceProjection.route).toBe("/ops/resilience");
    expect(snapshot.resilienceProjection.selectedFunctionCode).toBe("digital_intake");
    expect(snapshot.workbenchState).toBe("live");
  });

  it("updates selected essential function from selected health cell", () => {
    const base = createInitialOpsShellState("/ops/resilience");
    const selected = selectOpsHealthCell(base, "svc_pharmacy_loop");
    const snapshot = resolveOpsBoardSnapshot(selected, 1440);

    expect(snapshot.resilienceProjection.selectedHealthCellRef).toBe("svc_pharmacy_loop");
    expect(snapshot.resilienceProjection.selectedFunctionCode).toBe("pharmacy_referral_loop");
    expect(
      snapshot.resilienceProjection.dependencyRestoreBands.find(
        (row) => row.functionCode === "pharmacy_referral_loop",
      )?.currentAuthority,
    ).toBe("current_tuple");
  });

  it("downgrades resilience workbench state when live deltas stale the tuple", () => {
    const stale = setOpsDeltaGateState(createInitialOpsShellState("/ops/resilience"), "stale");
    const snapshot = resolveOpsBoardSnapshot(stale, 1440);

    expect(snapshot.resilienceProjection.recoveryControlPosture.postureState).toBe(
      "diagnostic_only",
    );
    expect(snapshot.workbenchState).toBe("frozen");
  });

  it("publishes all task 453 route fixtures deterministically", () => {
    const fixture = createOpsResilienceFixture();
    const recomputed = createOpsResilienceFixture();

    expect(fixture.schemaVersion).toBe(OPS_RESILIENCE_SCHEMA_VERSION);
    expect(fixture.scenarioProjections.normal.boardStateDigestRef).toBe(
      recomputed.scenarioProjections.normal.boardStateDigestRef,
    );
    expect(fixture.automationAnchors).toEqual(
      expect.arrayContaining([
        "resilience-board",
        "essential-function-map",
        "dependency-restore-bands",
        "backup-freshness",
        "runbook-binding",
        "recovery-control-posture",
        "recovery-action-rail",
        "resilience-settlement",
        "recovery-artifact-stage",
      ]),
    );
  });
});
