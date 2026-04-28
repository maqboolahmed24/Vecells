import { describe, expect, it } from "vitest";
import { buildPhase9RetentionLegalHoldWormReplaySuite } from "../../tools/test/run_phase9_retention_legal_hold_worm_replay";

describe("467 replay dependency and idempotency protection", () => {
  it("blocks replay-critical deletes while preserving archive-only execution", () => {
    const { fixture, evidence } = buildPhase9RetentionLegalHoldWormReplaySuite();
    const replay = fixture.dispositionProtectionCases.replayCritical;

    expect(evidence.coverage.replayCriticalArchiveOnlyProtection).toBe(true);
    expect(replay.deleteJobState).toBe("blocked");
    expect(replay.deleteBlockers).toEqual(
      expect.arrayContaining(["dependency:replay-critical-active:artifact:model-trace:442"]),
    );
    expect(replay.archiveJobState).toBe("queued");
    expect(replay.activeDependencyRefs.length).toBeGreaterThan(0);
  });

  it("preserves transitive dependencies through assurance, incident, recovery, CAPA, manifest, and certificate edges", () => {
    const { fixture, evidence } = buildPhase9RetentionLegalHoldWormReplaySuite();
    const dependency = fixture.dispositionProtectionCases.dependencyPreservation;

    expect(evidence.coverage.transitiveDependencyProtection).toBe(true);
    expect(evidence.gapClosures.dependencyLightGap).toBe(true);
    expect(dependency.transitiveAssessmentState).toBe("blocked");
    expect(dependency.transitiveDependencyRefs.length).toBeGreaterThan(1);
    expect(dependency.graphDependencyRefs).toEqual(
      expect.arrayContaining([
        "dependency:assurance-pack:pack_440",
        "dependency:investigation:timeline_439",
        "dependency:capa:capa_441",
        "dependency:recovery-artifact:restore_438",
        "dependency:archive-manifest:am_443_prior",
        "dependency:deletion-certificate:dc_443_prior",
      ]),
    );
    expect(dependency.explainerRef).toMatch(/^dbe_443_/);
  });

  it("keeps disposition queues deterministic under duplicate scheduler replays", () => {
    const { fixture, evidence } = buildPhase9RetentionLegalHoldWormReplaySuite();

    expect(evidence.coverage.dispositionJobIdempotency).toBe(true);
    expect(fixture.idempotencyAndReplay.duplicateQueueJobIdEqual).toBe(true);
    expect(fixture.idempotencyAndReplay.duplicateQueueJobHashEqual).toBe(true);
    expect(fixture.idempotencyAndReplay.archiveManifestHashEqual).toBe(true);
    expect(fixture.idempotencyAndReplay.deletionCertificateHashEqual).toBe(true);
  });
});
