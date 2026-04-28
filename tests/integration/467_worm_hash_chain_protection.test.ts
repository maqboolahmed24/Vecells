import { describe, expect, it } from "vitest";
import { buildPhase9RetentionLegalHoldWormReplaySuite } from "../../tools/test/run_phase9_retention_legal_hold_worm_replay";

describe("467 WORM and hash-chain disposition protection", () => {
  it("excludes WORM and hash-chained records from delete jobs", () => {
    const { fixture, evidence } = buildPhase9RetentionLegalHoldWormReplaySuite();
    const worm = fixture.dispositionProtectionCases.wormHashChain;

    expect(evidence.coverage.wormHashChainDeletionExclusion).toBe(true);
    expect(evidence.gapClosures.wormExceptionGap).toBe(true);
    expect(worm.assessmentState).toBe("blocked");
    expect(worm.lifecycleBlockers).toEqual(
      expect.arrayContaining(["criticality:hash-chained-never-delete", "policy:archive-only"]),
    );
    expect(worm.jobState).toBe("blocked");
    expect(worm.jobBlockers.some((ref) => ref.startsWith("immutable:delete-excluded"))).toBe(true);
    expect(worm.deleteCertificateRefs).toEqual([]);
  });

  it("does not provide an override path for protected audit-ledger records", () => {
    const { fixture } = buildPhase9RetentionLegalHoldWormReplaySuite();
    const worm = fixture.dispositionProtectionCases.wormHashChain;

    expect(worm.adminOverrideDeleteAllowed).toBe(false);
    expect(worm.jobBlockers).toEqual(
      expect.arrayContaining(["policy:archive-only:rc_442_audit_worm"]),
    );
  });

  it("keeps summary-only archive presentation separate from raw object locations", () => {
    const { fixture, evidence } = buildPhase9RetentionLegalHoldWormReplaySuite();

    expect(evidence.noRawArtifactUrls).toBe(true);
    expect(fixture.archiveManifestCase.summaryOnlyLocation).toBe(true);
    expect(fixture.archiveManifestCase.manifest.archiveLocationRef).toMatch(
      /^archive-location:summary-only:/,
    );
    expect(fixture.archiveManifestCase.manifest.archiveLocationRef).not.toContain("://");
  });
});
