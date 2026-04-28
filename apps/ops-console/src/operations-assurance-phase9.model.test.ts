import { describe, expect, it } from "vitest";
import {
  createInitialOpsShellState,
  resolveOpsBoardSnapshot,
  setOpsDeltaGateState,
} from "./operations-shell-seed.model";
import {
  OPS_ASSURANCE_SCHEMA_VERSION,
  createOpsAssuranceFixture,
  createOpsAssuranceProjection,
  normalizeOpsAssuranceScenarioState,
} from "./operations-assurance-phase9.model";

describe("task 454 operations assurance projection", () => {
  it("normalizes assurance scenario aliases", () => {
    expect(normalizeOpsAssuranceScenarioState("permission-denied")).toBe("permission_denied");
    expect(normalizeOpsAssuranceScenarioState("settlement-pending")).toBe("settlement_pending");
    expect(normalizeOpsAssuranceScenarioState("unknown")).toBe("normal");
  });

  it("publishes a live assurance export posture with triad cells", () => {
    const projection = createOpsAssuranceProjection("normal", "DTAC");

    expect(projection.schemaVersion).toBe(OPS_ASSURANCE_SCHEMA_VERSION);
    expect(projection.runtimeBinding.bindingState).toBe("live");
    expect(projection.packPreview.packState).toBe("export_ready");
    expect(projection.latestSettlement.result).toBe("export_ready");
    expect(projection.controlHeatMap).toHaveLength(6);
    expect(projection.controlHeatMap[0]).toMatchObject({
      freshnessState: "current",
      trustState: "trusted",
      completenessState: "complete",
    });
    expect(projection.artifactStage.artifactState).toBe("external_handoff_ready");
  });

  it("keeps degraded and quarantined slices visible with explicit blockers", () => {
    const degraded = createOpsAssuranceProjection("degraded");
    const quarantined = createOpsAssuranceProjection("quarantined");

    expect(degraded.actionRail[0]?.controlState).toBe("attestation_required");
    expect(degraded.degradedSliceAttestation.gateState).toBe("attestation_required");
    expect(quarantined.runtimeBinding.bindingState).toBe("blocked");
    expect(quarantined.degradedSliceAttestation.gateState).toBe("blocked_quarantined");
    expect(quarantined.degradedSliceAttestation.quarantinedTrustRecordRefs).toHaveLength(1);
  });

  it("fails closed for stale graph, missing evidence, denied scope, and pending settlement", () => {
    expect(createOpsAssuranceProjection("stale").latestSettlement.result).toBe("stale_pack");
    expect(createOpsAssuranceProjection("blocked").completenessSummary.graphVerdictState).toBe(
      "blocked",
    );
    expect(createOpsAssuranceProjection("permission_denied").latestSettlement.result).toBe(
      "denied_scope",
    );
    expect(createOpsAssuranceProjection("settlement_pending").latestSettlement.result).toBe(
      "pending_attestation",
    );
  });

  it("resets selected control when framework changes", () => {
    const dspt = createOpsAssuranceProjection("normal", "DSPT", "dtac:technical-security");

    expect(dspt.selectedFrameworkCode).toBe("DSPT");
    expect(dspt.selectedControlCode).toBe("dspt:core");
    expect(
      dspt.frameworkOptions.find((framework) => framework.frameworkCode === "DSPT")?.selected,
    ).toBe(true);
  });

  it("binds assurance projection into /ops/assurance shell snapshots", () => {
    const snapshot = resolveOpsBoardSnapshot(createInitialOpsShellState("/ops/assurance"), 1440);

    expect(snapshot.location.lens).toBe("assurance");
    expect(snapshot.assuranceProjection.route).toBe("/ops/assurance");
    expect(snapshot.assuranceProjection.selectedFrameworkCode).toBe("DTAC");
    expect(snapshot.workbenchState).toBe("live");
  });

  it("downgrades the assurance workbench for stale live deltas", () => {
    const stale = setOpsDeltaGateState(createInitialOpsShellState("/ops/assurance"), "stale");
    const snapshot = resolveOpsBoardSnapshot(stale, 1440);

    expect(snapshot.assuranceProjection.runtimeBinding.bindingState).toBe("diagnostic_only");
    expect(snapshot.workbenchState).toBe("frozen");
  });

  it("publishes all task 454 fixtures deterministically", () => {
    const fixture = createOpsAssuranceFixture();
    const recomputed = createOpsAssuranceFixture();

    expect(fixture.schemaVersion).toBe(OPS_ASSURANCE_SCHEMA_VERSION);
    expect(fixture.scenarioProjections.normal.boardStateDigestRef).toBe(
      recomputed.scenarioProjections.normal.boardStateDigestRef,
    );
    expect(fixture.frameworkProjections.DSPT.selectedFrameworkCode).toBe("DSPT");
    expect(fixture.automationAnchors).toEqual(
      expect.arrayContaining([
        "assurance-center",
        "framework-selector",
        "control-heat-map",
        "control-heat-table",
        "evidence-gap-queue",
        "capa-tracker",
        "pack-preview",
        "pack-settlement",
        "pack-export-state",
      ]),
    );
  });
});
