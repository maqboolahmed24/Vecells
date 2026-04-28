import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
  createPhase9ProjectionRebuildQuarantineFixture,
  type Phase9ProjectionRebuildQuarantineFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("446 Phase 9 projection rebuild quarantine artifacts", () => {
  it("publishes projection rebuild quarantine contract and deterministic fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      producedObjects: string[];
      apiSurface: string[];
      deterministicReplay: { replayHash: string };
      rebuildAuthority: { deterministicRunState: string; exactReplayFrozen: boolean };
    }>("data/contracts/446_phase9_projection_rebuild_quarantine_contract.json");
    const fixture = readJson<Phase9ProjectionRebuildQuarantineFixture>(
      "data/fixtures/446_phase9_projection_rebuild_quarantine_fixtures.json",
    );
    const recomputed = createPhase9ProjectionRebuildQuarantineFixture();

    expect(contract.schemaVersion).toBe(PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION);
    expect(contract.producedObjects).toEqual(
      expect.arrayContaining([
        "ProjectionRebuildRun",
        "ProjectionHealthSnapshot",
        "AssuranceSliceTrustRecord",
        "ProducerNamespaceQuarantineRecord",
        "ProjectionQuarantineLedgerWriteback",
      ]),
    );
    expect(contract.apiSurface).toEqual(
      expect.arrayContaining([
        "triggerProjectionRebuild",
        "placeProducerNamespaceQuarantine",
        "releaseProducerNamespaceQuarantine",
        "evaluateSliceTrustForScope",
      ]),
    );
    expect(contract.rebuildAuthority.deterministicRunState).toBe("matched");
    expect(contract.rebuildAuthority.exactReplayFrozen).toBe(true);
    expect(fixture.replayHash).toBe(recomputed.replayHash);
  });

  it("stores quarantine impact register and governed release writeback", () => {
    const fixture = readJson<Phase9ProjectionRebuildQuarantineFixture>(
      "data/fixtures/446_phase9_projection_rebuild_quarantine_fixtures.json",
    );
    const impactRegister = readText("data/analysis/446_quarantine_impact_register.csv");

    expect(fixture.quarantineImpactExplanation.impactedSurfaces).toEqual(
      expect.arrayContaining(["operations", "assurance_pack", "retention", "resilience"]),
    );
    expect(fixture.quarantineImpactExplanation.operationsRenderMode).toBe("blocked");
    expect(fixture.releaseLedgerWriteback.assuranceLedgerEntry.previousHash).toBe(
      fixture.quarantineLedgerWriteback.assuranceLedgerEntry.hash,
    );
    expect(impactRegister).toContain("affectedResiliencePostures");
    expect(impactRegister).toContain("resilience.recovery.evidence");
  });

  it("stores operator summary notes matrix and no slice quarantine gap artifact", () => {
    const summary = readText("data/analysis/446_phase9_projection_rebuild_quarantine_summary.md");
    const notes = readText("data/analysis/446_algorithm_alignment_notes.md");
    const matrix = readText("data/analysis/446_projection_rebuild_quarantine_matrix.csv");
    const gapPath = path.join(
      root,
      "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_446_SLICE_QUARANTINE_CONTRACT.json",
    );

    expect(summary).toContain("Deterministic rebuild hash");
    expect(notes).toContain("Slice trust uses the Phase 9 hysteresis thresholds");
    expect(matrix).toContain("command_following_exact");
    expect(matrix).toContain("quarantine_release");
    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
