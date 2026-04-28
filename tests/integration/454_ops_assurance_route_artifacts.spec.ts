import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  OPS_ASSURANCE_SCHEMA_VERSION,
  createOpsAssuranceFixture,
} from "../../apps/ops-console/src/operations-assurance-phase9.model";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("454 operations assurance artifacts", () => {
  it("publishes deterministic route contract and fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      routes: string[];
      requiredSurfaces: string[];
      automationAnchors: string[];
      frameworkCodes: string[];
      assuranceAuthority: {
        bindingState: string;
        packState: string;
        settlementResult: string;
        controlCount: number;
        artifactState: string;
      };
      triadProof: {
        normalFreshness: string;
        normalTrust: string;
        normalCompleteness: string;
        staleGraph: string;
        degradedTrust: string;
        degradedGate: string;
        quarantinedTrust: string;
        quarantinedGate: string;
        blockedGraph: string;
        deniedScopeSettlement: string;
        pendingSettlement: string;
      };
      packPreviewProof: {
        packVersionHash: string;
        evidenceSetHash: string;
        continuitySetHash: string;
        graphDecisionHash: string;
        reproductionState: string;
      };
      noGapArtifactRequired: boolean;
    }>("data/contracts/454_phase9_ops_assurance_route_contract.json");
    const fixture = readJson<ReturnType<typeof createOpsAssuranceFixture>>(
      "data/fixtures/454_phase9_ops_assurance_route_fixtures.json",
    );
    const recomputed = createOpsAssuranceFixture();

    expect(contract.schemaVersion).toBe(OPS_ASSURANCE_SCHEMA_VERSION);
    expect(contract.routes).toContain("/ops/assurance");
    expect(contract.requiredSurfaces).toEqual(
      expect.arrayContaining([
        "AssuranceCenter",
        "FrameworkSelector",
        "ControlHeatMap",
        "ControlHeatTable",
        "EvidenceGapQueue",
        "CapaTracker",
        "PackPreview",
        "PackSettlement",
        "PackExportState",
      ]),
    );
    expect(contract.automationAnchors).toEqual(
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
    expect(contract.frameworkCodes).toEqual(expect.arrayContaining(["DSPT", "DTAC", "DCB0129"]));
    expect(contract.assuranceAuthority.bindingState).toBe("live");
    expect(contract.assuranceAuthority.packState).toBe("export_ready");
    expect(contract.assuranceAuthority.settlementResult).toBe("export_ready");
    expect(contract.assuranceAuthority.controlCount).toBe(6);
    expect(contract.assuranceAuthority.artifactState).toBe("external_handoff_ready");
    expect(contract.triadProof.normalFreshness).toBe("current");
    expect(contract.triadProof.normalTrust).toBe("trusted");
    expect(contract.triadProof.normalCompleteness).toBe("complete");
    expect(contract.triadProof.staleGraph).toBe("stale");
    expect(contract.triadProof.degradedTrust).toBe("degraded");
    expect(contract.triadProof.degradedGate).toBe("attestation_required");
    expect(contract.triadProof.quarantinedTrust).toBe("quarantined");
    expect(contract.triadProof.quarantinedGate).toBe("blocked_quarantined");
    expect(contract.triadProof.blockedGraph).toBe("blocked");
    expect(contract.triadProof.deniedScopeSettlement).toBe("denied_scope");
    expect(contract.triadProof.pendingSettlement).toBe("pending_attestation");
    expect(contract.packPreviewProof.packVersionHash).toBeTruthy();
    expect(contract.packPreviewProof.evidenceSetHash).toBeTruthy();
    expect(contract.packPreviewProof.continuitySetHash).toBeTruthy();
    expect(contract.packPreviewProof.graphDecisionHash).toBeTruthy();
    expect(contract.packPreviewProof.reproductionState).toBe("exact");
    expect(contract.noGapArtifactRequired).toBe(true);
    expect(fixture.scenarioProjections.normal.boardStateDigestRef).toBe(
      recomputed.scenarioProjections.normal.boardStateDigestRef,
    );
  });

  it("records heat-map triad and settlement notes", () => {
    const notes = readText("data/analysis/454_ops_assurance_implementation_note.md");

    expect(notes).toContain("Assurance Center");
    expect(notes).toContain("freshness, trust, and completeness");
    expect(notes).toContain("summary-first");
    expect(notes).toContain("AssurancePackSettlement");
  });

  it("does not publish a task 454 pack settlement contract gap", () => {
    const gapPath = path.join(
      root,
      "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_454_PACK_SETTLEMENT_INPUTS.json",
    );

    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
