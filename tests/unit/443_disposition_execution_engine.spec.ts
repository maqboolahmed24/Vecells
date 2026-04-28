import { describe, expect, it } from "vitest";
import {
  Phase9DispositionExecutionEngine,
  createPhase9DispositionExecutionFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

describe("443 Phase 9 disposition execution engine", () => {
  it("disposition job admission from current assessments only", () => {
    const fixture = createPhase9DispositionExecutionFixture();

    expect(fixture.archiveQueuedResult.job.resultState).toBe("queued");
    expect(fixture.deleteQueuedResult.job.resultState).toBe("queued");
    expect(fixture.archiveQueuedResult.job.candidateAssessmentRefs.length).toBeGreaterThan(0);
    expect(fixture.deleteQueuedResult.job.expectedAssessmentHashes[0]).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejection of raw storage scan candidates", () => {
    const fixture = createPhase9DispositionExecutionFixture();

    expect(fixture.rawScanBlockedResult.job.resultState).toBe("blocked");
    expect(
      fixture.rawScanBlockedResult.job.blockerRefs.some((ref) => ref.includes("raw_storage_scan")),
    ).toBe(true);
  });

  it("WORM/hash-chain/audit/assurance-ledger deletion exclusion", () => {
    const fixture = createPhase9DispositionExecutionFixture();

    expect(fixture.wormDeleteBlockedResult.job.resultState).toBe("blocked");
    expect(
      fixture.wormDeleteBlockedResult.job.blockerRefs.some((ref) => ref.includes("immutable")),
    ).toBe(true);
  });

  it("replay-critical archive-only protection", () => {
    const fixture = createPhase9DispositionExecutionFixture();

    expect(fixture.replayCriticalDeleteBlockedResult.job.resultState).toBe("blocked");
    expect(
      fixture.replayCriticalDeleteBlockedResult.job.blockerRefs.some((ref) =>
        ref.includes("replay-critical"),
      ),
    ).toBe(true);
    expect(fixture.replayCriticalArchiveQueuedResult.job.resultState).toBe("queued");
  });

  it("stale assessment, stale graph, and stale hold-state blocking", () => {
    const fixture = createPhase9DispositionExecutionFixture();

    expect(fixture.staleAssessmentBlockedResult.job.resultState).toBe("blocked");
    expect(
      fixture.staleAssessmentBlockedResult.job.blockerRefs.some((ref) =>
        ref.includes("assessment:stale"),
      ),
    ).toBe(true);
    expect(fixture.staleGraphBlockedResult.job.resultState).toBe("blocked");
    expect(
      fixture.staleGraphBlockedResult.job.blockerRefs.some((ref) => ref.startsWith("graph:")),
    ).toBe(true);
    expect(fixture.staleHoldStateBlockedResult.job.resultState).toBe("blocked");
    expect(
      fixture.staleHoldStateBlockedResult.job.blockerRefs.some((ref) => ref.includes("hold-state")),
    ).toBe(true);
  });

  it("archive checksum determinism and manifest hash reproducibility", () => {
    const fixture = createPhase9DispositionExecutionFixture();

    expect(fixture.archiveExecutionResult.job.resultState).toBe("completed");
    expect(fixture.archiveExecutionResult.manifest?.manifestHash).toBe(
      fixture.archiveReplayExecutionResult.manifest?.manifestHash,
    );
    expect(fixture.archiveExecutionResult.manifest?.checksumBundleRef).toMatch(/^[a-f0-9]{64}$/);
  });

  it("deletion certificate hash reproducibility", () => {
    const fixture = createPhase9DispositionExecutionFixture();

    expect(fixture.deleteExecutionResult.deletionCertificates[0]?.certificateHash).toBe(
      fixture.deleteReplayExecutionResult.deletionCertificates[0]?.certificateHash,
    );
  });

  it("certificate immutability and lifecycle binding", () => {
    const fixture = createPhase9DispositionExecutionFixture();

    expect(fixture.deleteExecutionResult.deletionCertificates[0]?.deletionCertificateId).toMatch(
      /^dc_443_/,
    );
    expect(fixture.deleteExecutionResult.certificateLifecycleBindings[0]?.artifactClassRef).toBe(
      "class:deletion_certificate",
    );
    expect(fixture.deleteExecutionResult.certificateLifecycleBindings[0]?.graphCriticality).toBe(
      "hash_chained",
    );
    expect(fixture.deleteExecutionResult.certificateLifecycleBindings[0]?.disposalMode).toBe(
      "archive_only",
    );
  });

  it("graph dependency preservation for assurance packs, investigations, CAPA, recovery artifacts, archive manifests, and certificates", () => {
    const fixture = createPhase9DispositionExecutionFixture();

    expect(fixture.dependencyPreservationExplainer.activeDependencyRefs).toEqual(
      expect.arrayContaining([
        "dependency:assurance-pack:pack_440",
        "dependency:investigation:timeline_439",
        "dependency:capa:capa_441",
        "dependency:recovery-artifact:restore_438",
        "dependency:archive-manifest:am_443_prior",
        "dependency:deletion-certificate:dc_443_prior",
      ]),
    );
  });

  it("legal hold release requiring a superseding assessment before job execution", () => {
    const fixture = createPhase9DispositionExecutionFixture();

    expect(fixture.legalHoldReleaseOldAssessmentBlockedResult.job.resultState).toBe("blocked");
    expect(
      fixture.legalHoldReleaseOldAssessmentBlockedResult.job.blockerRefs.some((ref) =>
        ref.includes("hold-state"),
      ),
    ).toBe(true);
    expect(fixture.legalHoldReleaseSupersedingAssessmentResult.job.resultState).toBe("queued");
  });

  it("partially completed job recovery", () => {
    const fixture = createPhase9DispositionExecutionFixture();

    expect(fixture.partialArchiveResult.job.resultState).toBe("partially_completed");
    expect(
      fixture.partialArchiveResult.job.blockerRefs.some((ref) => ref.includes("checksum:missing")),
    ).toBe(true);
    expect(fixture.partialRecoveryResult.job.resultState).toBe("completed");
  });

  it("duplicate idempotency-key and duplicate scheduler safety", () => {
    const fixture = createPhase9DispositionExecutionFixture();

    expect(fixture.duplicateQueueFirstResult.job.dispositionJobId).toBe(
      fixture.duplicateQueueSecondResult.job.dispositionJobId,
    );
    expect(fixture.duplicateQueueFirstResult.job.jobHash).toBe(
      fixture.duplicateQueueSecondResult.job.jobHash,
    );
  });

  it("tenant-crossing and purpose-of-use denial", () => {
    const fixture = createPhase9DispositionExecutionFixture();

    expect(fixture.tenantDeniedErrorCode).toBe("DISPOSITION_TENANT_SCOPE_DENIED");
    expect(fixture.purposeDeniedErrorCode).toBe("DISPOSITION_PURPOSE_OF_USE_DENIED");
  });

  it("explainer redaction and audience-safe presentation", () => {
    const fixture = createPhase9DispositionExecutionFixture();

    expect(fixture.blockExplainerResult.blockExplainers[0]?.summaryProjectionRef).toMatch(
      /^summary:redacted:/,
    );
    expect(fixture.blockExplainerResult.presentationPolicy.redactionPolicyRef).toContain(
      "summary-first",
    );
    expect(fixture.blockExplainerResult.presentationPolicy.safeFieldRefs).not.toContain(
      "rawArchiveUrl",
    );
  });

  it("assurance-ledger lifecycle event writeback", () => {
    const fixture = createPhase9DispositionExecutionFixture();

    expect(fixture.lifecycleWritebackResult.lifecycleEvents.length).toBeGreaterThan(0);
    expect(fixture.lifecycleWritebackResult.lifecycleEvents[0]?.lifecycleEventType).toBe(
      "records_lifecycle.deletion_certificate_written",
    );
    expect(
      fixture.lifecycleWritebackResult.lifecycleEvents[0]?.assuranceLedgerEntry.entryType,
    ).toBe("evidence_materialization");
    expect(fixture.lifecycleWritebackResult.lifecycleEvents[0]?.assuranceLedgerEntry.hash).toMatch(
      /^[a-f0-9]{64}$/,
    );
  });

  it("pages execution records with stable cursors", () => {
    const engine = new Phase9DispositionExecutionEngine();
    const firstPage = engine.listWithCursor(["a", "b", "c"], undefined, 2);

    expect(firstPage.rows).toEqual(["a", "b"]);
    expect(firstPage.nextCursor).toBe("cursor:2");
    expect(engine.listWithCursor(["a", "b", "c"], firstPage.nextCursor, 2).rows).toEqual(["c"]);
  });
});
