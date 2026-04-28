import { describe, expect, it } from "vitest";
import {
  createOpsAssuranceFixture,
  createOpsAssuranceProjection,
} from "../../apps/ops-console/src/operations-assurance-phase9.model";
import {
  createInitialOpsShellState,
  resolveOpsBoardSnapshot,
} from "../../apps/ops-console/src/operations-shell-seed.model";

describe("454 operations assurance route contracts", () => {
  it("renders required assurance center proof surfaces", () => {
    const projection = createOpsAssuranceProjection("normal");

    expect(projection.route).toBe("/ops/assurance");
    expect(projection.frameworkOptions.length).toBeGreaterThanOrEqual(6);
    expect(projection.controlHeatMap).toHaveLength(6);
    expect(projection.controlHeatMap[0]?.freshnessState).toBe("current");
    expect(projection.controlHeatMap[0]?.trustState).toBe("trusted");
    expect(projection.controlHeatMap[0]?.completenessState).toBe("complete");
    expect(projection.packPreview.reproductionState).toBe("exact");
  });

  it("keeps attestation signoff publish and export settlement-bound", () => {
    const normal = createOpsAssuranceProjection("normal");
    const pending = createOpsAssuranceProjection("settlement_pending");
    const blocked = createOpsAssuranceProjection("blocked");

    expect(normal.latestSettlement.result).toBe("export_ready");
    expect(normal.actionRail.every((action) => action.allowed)).toBe(true);
    expect(pending.latestSettlement.result).toBe("pending_attestation");
    expect(
      pending.actionRail.filter((action) => action.allowed).map((action) => action.actionType),
    ).toEqual(["attest"]);
    expect(blocked.actionRail.every((action) => action.allowed === false)).toBe(true);
  });

  it("distinguishes stale graph degraded trust quarantine and denied scope", () => {
    expect(createOpsAssuranceProjection("stale").completenessSummary.graphVerdictState).toBe(
      "stale",
    );
    expect(createOpsAssuranceProjection("degraded").completenessSummary.trustState).toBe(
      "degraded",
    );
    expect(createOpsAssuranceProjection("quarantined").completenessSummary.trustState).toBe(
      "quarantined",
    );
    expect(createOpsAssuranceProjection("permission_denied").latestSettlement.result).toBe(
      "denied_scope",
    );
  });

  it("exposes pack preview hashes and governed artifact refs before export", () => {
    const projection = createOpsAssuranceProjection("normal");

    expect(projection.packPreview.packVersionHash).toBeTruthy();
    expect(projection.packPreview.evidenceSetHash).toBeTruthy();
    expect(projection.packPreview.continuitySetHash).toBeTruthy();
    expect(projection.packPreview.graphDecisionHash).toBeTruthy();
    expect(projection.packPreview.redactionPolicyHash).toBeTruthy();
    expect(projection.packPreview.artifactPresentationContractRef).toContain("APC_454");
    expect(projection.packPreview.outboundNavigationGrantRef).toContain("ONG_454");
  });

  it("preserves assurance projection through the operations shell", () => {
    const snapshot = resolveOpsBoardSnapshot(createInitialOpsShellState("/ops/assurance"), 1440);

    expect(snapshot.assuranceProjection.selectedFrameworkCode).toBe("DTAC");
    expect(snapshot.assuranceProjection.runtimeBinding.routeFamilyRef).toBe("/ops/assurance");
    expect(snapshot.assuranceProjection.boardTupleHash).toContain("ops-assurance-board-tuple-454");
  });

  it("publishes deterministic fixture coverage for every assurance scenario", () => {
    const fixture = createOpsAssuranceFixture();

    expect(Object.keys(fixture.scenarioProjections)).toEqual(
      expect.arrayContaining([
        "normal",
        "empty",
        "stale",
        "degraded",
        "blocked",
        "permission_denied",
        "quarantined",
        "settlement_pending",
      ]),
    );
    expect(fixture.scenarioProjections.normal.latestSettlement.result).toBe("export_ready");
    expect(fixture.scenarioProjections.quarantined.runtimeBinding.bindingState).toBe("blocked");
  });
});
