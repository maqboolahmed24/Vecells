import { describe, expect, it } from "vitest";
import { buildPhase9RetentionLegalHoldWormReplaySuite } from "../../tools/test/run_phase9_retention_legal_hold_worm_replay";

describe("467 archive manifest and deletion certificate hardening", () => {
  it("pins archive manifests to canonical hashes, current assessments, and the graph snapshot", () => {
    const { fixture, evidence } = buildPhase9RetentionLegalHoldWormReplaySuite();
    const manifest = fixture.archiveManifestCase.manifest;
    const job = fixture.archiveManifestCase.job;

    expect(evidence.coverage.archiveManifestCanonicalHashAndGraphPinning).toBe(true);
    expect(manifest.manifestHash).toMatch(/^[a-f0-9]{64}$/);
    expect(manifest.graphHash).toBe(job.graphHash);
    expect(manifest.candidateAssessmentRefs).toEqual(job.candidateAssessmentRefs);
    expect(manifest.retentionDecisionRefs).toEqual(job.retentionDecisionRefs);
    expect(manifest.assuranceEvidenceGraphSnapshotRef).toBe("aegs_442_current");
    expect(manifest.assuranceGraphCompletenessVerdictRef).toBe("agcv_442_complete");
    expect(manifest.manifestHash).toBe(fixture.archiveManifestCase.replayManifestHash);
  });

  it("writes deletion certificates before completion and binds lifecycle writeback", () => {
    const { fixture, evidence } = buildPhase9RetentionLegalHoldWormReplaySuite();
    const certificate = fixture.deletionCertificateCase.certificate;
    const job = fixture.deletionCertificateCase.job;
    const lifecycleBinding = fixture.deletionCertificateCase.certificateLifecycleBinding;

    expect(evidence.coverage.deletionCertificateCanonicalHashScopeAndAuditAppend).toBe(true);
    expect(certificate.certificateHash).toMatch(/^[a-f0-9]{64}$/);
    expect(certificate.dispositionJobRef).toBe(job.dispositionJobId);
    expect(job.candidateAssessmentRefs).toContain(certificate.assessmentRef);
    expect(certificate.graphHash).toBe(job.graphHash);
    expect(certificate.certificateHash).toBe(fixture.deletionCertificateCase.replayCertificateHash);
    expect(lifecycleBinding?.artifactClassRef).toBe("class:deletion_certificate");
    expect(lifecycleBinding?.graphCriticality).toBe("hash_chained");
    expect(lifecycleBinding?.disposalMode).toBe("archive_only");
    expect(fixture.deletionCertificateCase.lifecycleEvent?.lifecycleEventType).toBe(
      "records_lifecycle.deletion_certificate_written",
    );
  });

  it("blocks certificate optimism when the certificate write cannot complete", () => {
    const { fixture, evidence } = buildPhase9RetentionLegalHoldWormReplaySuite();
    const blocked = fixture.deletionCertificateCase.certificateWriteBlockedResult;

    expect(evidence.gapClosures.certificateOptimismGap).toBe(true);
    expect(blocked.job.resultState).toBe("blocked");
    expect(blocked.job.blockerRefs).toContain("certificate:write-before-delete-required");
    expect(blocked.deletionCertificates).toEqual([]);
  });
});
