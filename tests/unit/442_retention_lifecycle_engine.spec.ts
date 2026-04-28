import { describe, expect, it } from "vitest";
import {
  Phase9RetentionLifecycleEngine,
  Phase9RetentionLifecycleEngineError,
  createPhase9RetentionLifecycleEngineFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

describe("442 Phase 9 retention lifecycle engine", () => {
  it("artifact creation creates lifecycle binding", () => {
    const fixture = createPhase9RetentionLifecycleEngineFixture();

    expect(fixture.artifactCreationResult.result).toBe("bound");
    expect(fixture.artifactCreationResult.binding?.retentionLifecycleBindingId).toMatch(/^rlb_442_/);
    expect(fixture.artifactCreationResult.binding?.artifactClassRef).toBe("class:request_snapshot");
  });

  it("missing retention class blocks artifact creation or quarantines according to source policy", () => {
    const fixture = createPhase9RetentionLifecycleEngineFixture();

    expect(fixture.missingRetentionClassResult.result).toBe("quarantined");
    expect(fixture.missingRetentionClassResult.blockerRefs).toContain("retention:class-missing-or-inactive");
  });

  it("retention decision hash deterministic", () => {
    const fixture = createPhase9RetentionLifecycleEngineFixture();

    expect(fixture.deterministicDecisionReplay.decisionHash).toBe(fixture.baselineDecision.decisionHash);
  });

  it("minimum retention not reached -> not due", () => {
    const fixture = createPhase9RetentionLifecycleEngineFixture();

    expect(fixture.notDueAssessment.result).toBe("not_due");
    expect(fixture.notDueAssessment.blockerRefs.some((ref) => ref.startsWith("retention:not_due"))).toBe(true);
  });

  it("legal hold blocks disposition", () => {
    const fixture = createPhase9RetentionLifecycleEngineFixture();

    expect(fixture.legalHoldBlockedAssessment.result).toBe("blocked");
    expect(fixture.legalHoldBlockedAssessment.activeLegalHoldRefs).toContain(
      fixture.legalHoldResult.legalHold.legalHoldRecordId,
    );
  });

  it("released legal hold allows reassessment but preserves lineage", () => {
    const fixture = createPhase9RetentionLifecycleEngineFixture();

    expect(fixture.releasedLegalHoldResult.legalHold.holdState).toBe("released");
    expect(fixture.releasedLegalHoldResult.legalHold.supersedesHoldRef).toBe(
      fixture.legalHoldResult.legalHold.legalHoldRecordId,
    );
    expect(fixture.reassessmentAfterRelease.result).toBe("eligible");
  });

  it("transitive dependency blocks disposition", () => {
    const fixture = createPhase9RetentionLifecycleEngineFixture();

    expect(fixture.transitiveDependencyAssessment.result).toBe("blocked");
    expect(fixture.transitiveDependencyAssessment.activeDependencyLinkRefs.length).toBeGreaterThan(1);
  });

  it("dependency cycle handled safely", () => {
    const fixture = createPhase9RetentionLifecycleEngineFixture();

    expect(fixture.dependencyCycleAssessment.result).toBe("blocked");
    expect(fixture.dependencyCycleAssessment.blockerRefs).toContain("dependency:cycle");
  });

  it("WORM/hash-chained artifact not delete-eligible", () => {
    const fixture = createPhase9RetentionLifecycleEngineFixture();

    expect(fixture.wormHashChainedAssessment.result).toBe("blocked");
    expect(
      fixture.wormHashChainedAssessment.blockerRefs.some((ref) => ref.includes("hash-chained-never-delete")),
    ).toBe(true);
  });

  it("replay-critical artifact blocks delete", () => {
    const fixture = createPhase9RetentionLifecycleEngineFixture();

    expect(fixture.replayCriticalAssessment.result).toBe("blocked");
    expect(fixture.replayCriticalAssessment.blockerRefs).toContain(
      "criticality:replay-critical-active-dependency",
    );
  });

  it("assurance pack dependency blocks delete", () => {
    const fixture = createPhase9RetentionLifecycleEngineFixture();

    expect(fixture.assurancePackDependencyAssessment.result).toBe("blocked");
    expect(
      fixture.assurancePackDependencyAssessment.blockerRefs.some((ref) =>
        ref.includes("assurance_pack_input"),
      ),
    ).toBe(true);
  });

  it("graph verdict missing blocks assessment", () => {
    const fixture = createPhase9RetentionLifecycleEngineFixture();

    expect(fixture.missingGraphVerdictAssessment.result).toBe("blocked");
    expect(fixture.missingGraphVerdictAssessment.blockerRefs).toContain("graph:missing-verdict-state");
  });

  it("cross-tenant dependency denied", () => {
    const fixture = createPhase9RetentionLifecycleEngineFixture();

    expect(fixture.crossTenantDependencyErrorCode).toBe("CROSS_TENANT_DEPENDENCY_DENIED");
  });

  it("superseded retention class preserves old decisions and allows new decisions", () => {
    const fixture = createPhase9RetentionLifecycleEngineFixture();

    expect(fixture.supersededRetentionClass.classState).toBe("superseded");
    expect(fixture.oldDecisionAfterSupersession.retentionClassRef).toBe("rc_442_request_snapshot");
    expect(fixture.newDecisionAfterSupersession.retentionClassRef).toBe("rc_442_request_snapshot_v2");
    expect(fixture.newDecisionAfterSupersession.supersedesDecisionRef).toBe(
      fixture.oldDecisionAfterSupersession.retentionDecisionId,
    );
  });

  it("no raw storage scan can mark artifact delete-ready", () => {
    const fixture = createPhase9RetentionLifecycleEngineFixture();

    expect(fixture.rawStorageScanAssessment.result).toBe("blocked");
    expect(fixture.rawStorageScanAssessment.dispositionEligibilityAssessment.eligibilityState).toBe("blocked");
    expect(fixture.rawStorageScanAssessment.blockerRefs).toContain("source:raw-storage-scan-denied");
  });

  it("audit records emitted for hold and assessment actions", () => {
    const fixture = createPhase9RetentionLifecycleEngineFixture();

    expect(fixture.legalHoldResult.auditRecords.length).toBeGreaterThan(0);
    expect(fixture.releasedLegalHoldResult.auditRecords.length).toBeGreaterThan(0);
    expect(fixture.reassessmentAfterRelease.auditRecords.length).toBeGreaterThan(0);
    expect(fixture.lifecycleEvidenceRecord.lifecycleEvidenceHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("denies lifecycle mutations without records purpose", () => {
    const engine = new Phase9RetentionLifecycleEngine();
    const fixture = createPhase9RetentionLifecycleEngineFixture();
    const retentionClass = fixture.retentionClasses[0]!;

    expect(() =>
      engine.bindLifecycleForArtifact({
        actor: {
          tenantId: "tenant:demo-gp",
          actorRef: "actor:bad-purpose",
          roleRefs: ["records_governance"],
          purposeOfUseRef: "assurance:read",
          reasonRef: "reason:test",
          generatedAt: "2026-04-27T12:00:00.000Z",
        },
        artifactRef: "artifact:bad-purpose",
        artifactVersionRef: "artifact-version:bad-purpose:v1",
        artifactClassRef: "class:request_snapshot",
        retentionClass,
        graphCriticality: "ordinary",
      }),
    ).toThrow(Phase9RetentionLifecycleEngineError);
  });
});
