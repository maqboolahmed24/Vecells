import { describe, expect, it } from "vitest";
import {
  Phase9AssurancePackFactory,
  createPhase9AssurancePackFactoryFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

describe("440 Phase 9 assurance pack factory", () => {
  it("same inputs produce identical pack hashes", () => {
    const first = createPhase9AssurancePackFactoryFixture();
    const second = createPhase9AssurancePackFactoryFixture();

    expect(second.baselineResult.pack.packVersionHash).toBe(first.baselineResult.pack.packVersionHash);
    expect(second.baselineResult.pack.serializedArtifactHash).toBe(first.baselineResult.pack.serializedArtifactHash);
    expect(second.replayHash).toBe(first.replayHash);
  });

  it("graph verdict missing blocks pack", () => {
    const fixture = createPhase9AssurancePackFactoryFixture();

    expect(fixture.missingGraphVerdictResult.pack.packState).toBe("blocked_graph");
    expect(fixture.missingGraphVerdictResult.pack.blockerRefs).toContain("graph:verdict-missing");
  });

  it("stale evidence blocks or marks stale according to framework policy", () => {
    const fixture = createPhase9AssurancePackFactoryFixture();

    expect(fixture.staleEvidenceResult.pack.packState).toBe("stale_pack");
    expect(fixture.staleEvidenceResult.evidenceGaps.map((gap) => gap.gapType)).toContain("stale_evidence");
  });

  it("missing redaction policy blocks export-ready state", () => {
    const fixture = createPhase9AssurancePackFactoryFixture();

    expect(fixture.missingRedactionSettlement.result).toBe("denied_scope");
    expect(fixture.missingRedactionSettlement.recoveryActionRef).toBe("recovery:denied_scope");
  });

  it("ambiguous standards version blocks generation", () => {
    const fixture = createPhase9AssurancePackFactoryFixture();

    expect(fixture.ambiguousStandardsResult.pack.packState).toBe("denied_scope");
    expect(fixture.ambiguousStandardsResult.evidenceGaps.map((gap) => gap.gapType)).toContain(
      "policy_version_mismatch",
    );
  });

  it("wrong tenant evidence denied", () => {
    const fixture = createPhase9AssurancePackFactoryFixture();

    expect(fixture.wrongTenantResult.pack.packState).toBe("denied_scope");
    expect(fixture.wrongTenantResult.pack.blockerRefs).toContain("tenant:evidence:evidence:440:core");
  });

  it("superseded evidence not used as current", () => {
    const fixture = createPhase9AssurancePackFactoryFixture();

    expect(fixture.supersededEvidenceResult.pack.packState).toBe("stale_pack");
    expect(fixture.supersededEvidenceResult.evidenceGaps.map((gap) => gap.gapType)).toContain(
      "superseded_evidence",
    );
  });

  it("continuity section required and missing -> blocked", () => {
    const fixture = createPhase9AssurancePackFactoryFixture();

    expect(fixture.missingContinuityResult.pack.packState).toBe("stale_pack");
    expect(fixture.missingContinuityResult.continuitySections[0]?.blockingRefs).toContain(
      "continuity:missing:dtac:control:continuity",
    );
  });

  it("generated artifact has retention lifecycle binding", () => {
    const fixture = createPhase9AssurancePackFactoryFixture();

    expect(fixture.baselineResult.pack.retentionLifecycleBindingRef).toBe("rlb_440_pack");
    expect(fixture.baselineResult.pack.generatedArtifactRef).toMatch(/^artifact:assurance-pack:/);
  });

  it("dry-run does not persist authoritative pack", () => {
    const fixture = createPhase9AssurancePackFactoryFixture();

    expect(fixture.dryRunResult.pack.packState).toBe("dry_run");
    expect(fixture.dryRunResult.persisted).toBe(false);
  });

  it("reproduction from hashes succeeds", () => {
    const fixture = createPhase9AssurancePackFactoryFixture();
    const factory = new Phase9AssurancePackFactory();

    expect(factory.reproducePackFromHashes(fixture.baselineResult)).toBe("exact");
    expect(fixture.reproductionSettlement.reproductionState).toBe("exact");
  });

  it("render template version change changes pack version hash", () => {
    const fixture = createPhase9AssurancePackFactoryFixture();

    expect(fixture.changedTemplateResult.pack.packVersionHash).not.toBe(
      fixture.baselineResult.pack.packVersionHash,
    );
  });

  it("preview/export uses artifact presentation policy", () => {
    const fixture = createPhase9AssurancePackFactoryFixture();

    expect(fixture.exportReadySettlement.result).toBe("export_ready");
    expect(fixture.exportReadySettlement.presentationArtifactRef).toBe(
      fixture.baselineResult.pack.generatedArtifactRef,
    );
  });
});
