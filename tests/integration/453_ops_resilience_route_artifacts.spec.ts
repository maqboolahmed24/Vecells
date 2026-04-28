import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  OPS_RESILIENCE_SCHEMA_VERSION,
  createOpsResilienceFixture,
} from "../../apps/ops-console/src/operations-resilience-phase9.model";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("453 operations resilience artifacts", () => {
  it("publishes deterministic route contract and fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      routes: string[];
      requiredSurfaces: string[];
      automationAnchors: string[];
      resilienceAuthority: {
        bindingState: string;
        controlState: string;
        latestSettlementResult: string;
        essentialFunctionCount: number;
        dependencyBandCount: number;
        actionRailCount: number;
      };
      downgradeProof: {
        staleBindingState: string;
        staleRunbookState: string;
        degradedTrustState: string;
        freezeState: string;
        blockedBackupState: string;
        permissionDeniedBindingState: string;
        settlementPendingResult: string;
      };
      artifactProof: {
        normalArtifactState: string;
        staleArtifactState: string;
        permissionDeniedArtifactState: string;
      };
      timelineProof: {
        normalTimelineState: string;
        normalRunAuthority: string;
        staleTimelineState: string;
        staleRunAuthority: string;
        runEventCount: number;
      };
      noGapArtifactRequired: boolean;
    }>("data/contracts/453_phase9_ops_resilience_route_contract.json");
    const fixture = readJson<ReturnType<typeof createOpsResilienceFixture>>(
      "data/fixtures/453_phase9_ops_resilience_route_fixtures.json",
    );
    const recomputed = createOpsResilienceFixture();

    expect(contract.schemaVersion).toBe(OPS_RESILIENCE_SCHEMA_VERSION);
    expect(contract.routes).toContain("/ops/resilience");
    expect(contract.requiredSurfaces).toEqual(
      expect.arrayContaining([
        "ResilienceBoard",
        "EssentialFunctionMap",
        "DependencyRestoreBands",
        "BackupFreshness",
        "RunbookBinding",
        "OperationalReadinessSnapshot",
        "RecoveryControlPosture",
        "RecoveryRunTimeline",
        "RecoveryActionRail",
        "ResilienceSettlement",
        "RecoveryArtifactStage",
      ]),
    );
    expect(contract.automationAnchors).toEqual(
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
    expect(contract.resilienceAuthority.bindingState).toBe("live");
    expect(contract.resilienceAuthority.controlState).toBe("live_control");
    expect(contract.resilienceAuthority.latestSettlementResult).toBe("applied");
    expect(contract.resilienceAuthority.essentialFunctionCount).toBe(10);
    expect(contract.resilienceAuthority.dependencyBandCount).toBe(10);
    expect(contract.resilienceAuthority.actionRailCount).toBe(10);
    expect(contract.downgradeProof.staleBindingState).toBe("diagnostic_only");
    expect(contract.downgradeProof.staleRunbookState).toBe("stale");
    expect(contract.downgradeProof.degradedTrustState).toBe("degraded");
    expect(contract.downgradeProof.freezeState).toBe("active");
    expect(contract.downgradeProof.blockedBackupState).toBe("missing");
    expect(contract.downgradeProof.permissionDeniedBindingState).toBe("blocked");
    expect(contract.downgradeProof.settlementPendingResult).toBe("accepted_pending_evidence");
    expect(contract.artifactProof.normalArtifactState).toBe("external_handoff_ready");
    expect(contract.artifactProof.staleArtifactState).toBe("governed_preview");
    expect(contract.artifactProof.permissionDeniedArtifactState).toBe("summary_only");
    expect(contract.timelineProof.normalTimelineState).toBe("exact");
    expect(contract.timelineProof.normalRunAuthority).toBe("current_tuple");
    expect(contract.timelineProof.staleTimelineState).toBe("stale");
    expect(contract.timelineProof.staleRunAuthority).toBe("historical_only");
    expect(contract.timelineProof.runEventCount).toBe(3);
    expect(contract.noGapArtifactRequired).toBe(true);
    expect(fixture.scenarioProjections.normal.boardStateDigestRef).toBe(
      recomputed.scenarioProjections.normal.boardStateDigestRef,
    );
  });

  it("records resilience visual grammar and safety notes", () => {
    const notes = readText("data/analysis/453_ops_resilience_implementation_note.md");

    expect(notes).toContain("ResilienceBoard");
    expect(notes).toContain("topological dependency restore bands");
    expect(notes).toContain("settlement-bound controls");
    expect(notes).toContain("fail closed");
  });

  it("does not publish a task 453 resilience board contract gap", () => {
    const gapPath = path.join(
      root,
      "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_453_RESILIENCE_BOARD_INPUTS.json",
    );

    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
