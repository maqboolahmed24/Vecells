import { describe, expect, it } from "vitest";
import {
  createPhase9AssurancePackFactoryFixture,
  hashAssurancePayload,
} from "../../packages/domains/analytics_assurance/src/index";
import { runPhase9AuditBreakGlassAssuranceRedactionSuite } from "../../tools/test/run_phase9_audit_break_glass_assurance_redaction";

function recomputePackVersionHash(pack: {
  readonly frameworkVersion: string;
  readonly queryPlanHash: string;
  readonly renderTemplateHash: string;
  readonly redactionPolicyHash: string;
  readonly continuitySetHash: string;
  readonly graphHash: string;
  readonly graphVerdictDecisionHash: string;
  readonly trustSnapshotSetHash: string;
  readonly evidenceSetHash: string;
}): string {
  return hashAssurancePayload(
    {
      frameworkVersion: pack.frameworkVersion,
      queryPlanHash: pack.queryPlanHash,
      renderTemplateHash: pack.renderTemplateHash,
      redactionPolicyHash: pack.redactionPolicyHash,
      continuitySetHash: pack.continuitySetHash,
      graphHash: pack.graphHash,
      verdictDecisionHash: pack.graphVerdictDecisionHash,
      trustSnapshotSetHash: pack.trustSnapshotSetHash,
      evidenceSetHash: pack.evidenceSetHash,
    },
    "phase9.440.pack-version",
  );
}

describe("task 466 assurance pack generation determinism", () => {
  it("covers DSPT, DTAC, DCB0129, and DCB0160 generator families", () => {
    const fixture = createPhase9AssurancePackFactoryFixture();
    const frameworks = new Set(fixture.standardsVersionMaps.map((map) => map.frameworkCode));
    const generatorFrameworks = new Set(
      fixture.generators.map((generator) => generator.frameworkCode),
    );

    for (const required of ["DSPT", "DTAC", "DCB0129", "DCB0160"] as const) {
      expect(frameworks.has(required)).toBe(true);
      expect(generatorFrameworks.has(required)).toBe(true);
    }
  });

  it("reproduces pack hashes from graph, evidence, continuity, trust, template, and redaction inputs", () => {
    const fixture = createPhase9AssurancePackFactoryFixture();
    const pack = fixture.baselineResult.pack;

    expect(pack.reproductionState).toBe("exact");
    expect(pack.packVersionHash).toBe(recomputePackVersionHash(pack));
    expect(fixture.replayHash).toBe(createPhase9AssurancePackFactoryFixture().replayHash);
    expect(fixture.changedTemplateResult.pack.packVersionHash).not.toBe(pack.packVersionHash);
  });

  it("keeps export settlement exact only with current graph, pack version, grant, and redaction policy", () => {
    const fixture = createPhase9AssurancePackFactoryFixture();

    expect(fixture.exportReadySettlement.result).toBe("export_ready");
    expect(fixture.exportReadySettlement.reproductionState).toBe("exact");
    expect(fixture.exportReadySettlement.exportManifestHash).toBe(
      fixture.baselineResult.pack.exportManifestHash,
    );
    expect(fixture.missingRedactionSettlement.result).toBe("denied_scope");
    expect(fixture.missingRedactionSettlement.recoveryActionRef).toBe("recovery:denied_scope");
  });

  it("fails closed for stale, blocked, denied, trust, and continuity gaps", () => {
    const fixture = createPhase9AssurancePackFactoryFixture();
    const evidence = runPhase9AuditBreakGlassAssuranceRedactionSuite();

    expect(fixture.missingGraphVerdictResult.pack.packState).toBe("blocked_graph");
    expect(fixture.staleEvidenceResult.pack.packState).toBe("stale_pack");
    expect(fixture.wrongTenantResult.pack.packState).toBe("denied_scope");
    expect(fixture.supersededEvidenceResult.pack.packState).toBe("stale_pack");
    expect(fixture.missingContinuityResult.pack.blockerRefs).toContain(
      "continuity:missing:dtac:control:continuity",
    );
    expect(evidence.assurancePack.allFailureModesFailClosed).toBe(true);
    expect(evidence.assurancePack.packExportOptimismGapClosed).toBe(true);
  });
});
