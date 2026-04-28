import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
  createPhase9AssurancePackFactoryFixture,
  type Phase9AssurancePackFactoryFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("440 Phase 9 assurance pack factory artifacts", () => {
  it("publishes assurance pack factory contract and deterministic fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      producedObjects: string[];
      frameworkCodes: string[];
      deterministicReplay: {
        baselinePackVersionHash: string;
        changedTemplatePackVersionHash: string;
      };
    }>("data/contracts/440_phase9_assurance_pack_factory_contract.json");
    const fixture = readJson<Phase9AssurancePackFactoryFixture>(
      "data/fixtures/440_phase9_assurance_pack_factory_fixtures.json",
    );
    const recomputed = createPhase9AssurancePackFactoryFixture();

    expect(contract.schemaVersion).toBe(PHASE9_ASSURANCE_PACK_FACTORY_VERSION);
    expect(contract.producedObjects).toEqual(
      expect.arrayContaining([
        "StandardsVersionMap",
        "FrameworkPackGenerator",
        "MonthlyAssurancePack",
        "ContinuityEvidencePackSection",
        "AssurancePackSettlement",
      ]),
    );
    expect(contract.frameworkCodes).toEqual(
      expect.arrayContaining(["DSPT", "DTAC", "DCB0129", "DCB0160", "NHS_APP_CHANNEL", "IM1_CHANGE", "LOCAL_TENANT"]),
    );
    expect(contract.deterministicReplay.changedTemplatePackVersionHash).not.toBe(
      contract.deterministicReplay.baselinePackVersionHash,
    );
    expect(fixture.baselineResult.pack.packVersionHash).toBe(recomputed.baselineResult.pack.packVersionHash);
    expect(fixture.replayHash).toBe(recomputed.replayHash);
  });

  it("records required pack hashes and graph provenance", () => {
    const fixture = readJson<Phase9AssurancePackFactoryFixture>(
      "data/fixtures/440_phase9_assurance_pack_factory_fixtures.json",
    );
    const pack = fixture.baselineResult.pack;

    for (const value of [
      pack.evidenceSetHash,
      pack.continuitySetHash,
      pack.queryPlanHash,
      pack.renderTemplateHash,
      pack.redactionPolicyHash,
      pack.serializedArtifactHash,
      pack.exportManifestHash,
      pack.reproductionHash,
      pack.packVersionHash,
    ]) {
      expect(value).toMatch(/^[a-f0-9]{64}$/);
    }
    expect(pack.graphSnapshotRef).toBe(fixture.baselineResult.monthlyPack.assuranceEvidenceGraphSnapshotRef);
    expect(pack.graphVerdictRef).toBe(fixture.baselineResult.monthlyPack.assuranceGraphCompletenessVerdictRef);
  });

  it("stores fail-closed fixtures for graph trust freshness scope and continuity", () => {
    const fixture = readJson<Phase9AssurancePackFactoryFixture>(
      "data/fixtures/440_phase9_assurance_pack_factory_fixtures.json",
    );

    expect(fixture.missingGraphVerdictResult.pack.packState).toBe("blocked_graph");
    expect(fixture.staleEvidenceResult.pack.packState).toBe("stale_pack");
    expect(fixture.ambiguousStandardsResult.pack.packState).toBe("denied_scope");
    expect(fixture.wrongTenantResult.pack.packState).toBe("denied_scope");
    expect(fixture.supersededEvidenceResult.pack.packState).toBe("stale_pack");
    expect(fixture.missingContinuityResult.pack.packState).toBe("stale_pack");
  });

  it("materializes action settlements for task 441 attestation and export workflow", () => {
    const fixture = readJson<Phase9AssurancePackFactoryFixture>(
      "data/fixtures/440_phase9_assurance_pack_factory_fixtures.json",
    );

    expect(fixture.reproductionSettlement.result).toBe("signed_off");
    expect(fixture.reproductionSettlement.reproductionState).toBe("exact");
    expect(fixture.exportReadySettlement.result).toBe("export_ready");
    expect(fixture.exportReadySettlement.exportManifestHash).toBe(
      fixture.baselineResult.pack.exportManifestHash,
    );
  });

  it("stores operator-readable summary alignment notes and no gap artifact", () => {
    const summary = readText("data/analysis/440_phase9_assurance_pack_factory_summary.md");
    const notes = readText("data/analysis/440_algorithm_alignment_notes.md");
    const matrix = readText("data/analysis/440_assurance_pack_framework_matrix.csv");
    const gapPath = path.join(
      root,
      "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_440_ASSURANCE_PACK_FACTORY.json",
    );

    expect(summary).toContain("Framework mappings");
    expect(summary).toContain("Pack version hash");
    expect(notes).toContain("StandardsVersionMap rows are versioned");
    expect(matrix).toContain("DTAC");
    expect(matrix).toContain("LOCAL_TENANT");
    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
