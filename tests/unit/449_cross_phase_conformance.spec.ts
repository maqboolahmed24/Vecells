import { describe, expect, it } from "vitest";
import {
  Phase9CrossPhaseConformanceService,
  createPhase9CrossPhaseConformanceFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

describe("449 Phase 9 cross-phase conformance", () => {
  it("phase row exact/stale/blocked derivation", () => {
    const fixture = createPhase9CrossPhaseConformanceFixture();

    expect(fixture.exactPhaseRows.every((row) => row.rowState === "exact")).toBe(true);
    expect(fixture.staleControlSliceTrustRow.rowState).toBe("stale");
    expect(fixture.summaryContradictionRow.rowState).toBe("blocked");
    expect(fixture.missingRuntimePublicationRow.rowHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("summary contradiction blocking", () => {
    const fixture = createPhase9CrossPhaseConformanceFixture();

    expect(fixture.summaryContradictionRow.summaryAlignmentState).toBe("blocked");
    expect(fixture.summaryContradictionRow.rowState).toBe("blocked");
    expect(fixture.blockerExplanation.phaseBlockerRefs).toContain(
      "phase3_duplicate_resolution:summary:blocked",
    );
  });

  it("missing runtime publication blocking", () => {
    const fixture = createPhase9CrossPhaseConformanceFixture();

    expect(fixture.missingRuntimePublicationRow.requiredRuntimePublicationBundleRefs).toContain(
      "missing:runtime-publication-bundle",
    );
    expect(fixture.missingRuntimePublicationRow.verificationCoverageState).toBe("blocked");
    expect(fixture.missingProofRefs).toContain("missing:runtime-publication-bundle");
  });

  it("missing verification scenario blocking", () => {
    const fixture = createPhase9CrossPhaseConformanceFixture();

    expect(fixture.missingVerificationScenarioRow.requiredVerificationScenarioRefs).toContain(
      "missing:verification-scenario",
    );
    expect(fixture.missingVerificationScenarioRow.verificationCoverageState).toBe("blocked");
  });

  it("stale control status or slice trust blocking", () => {
    const fixture = createPhase9CrossPhaseConformanceFixture();

    expect(fixture.staleControlSliceTrustRow.operationalProofState).toBe("stale");
    expect(fixture.staleControlSliceTrustRow.rowState).toBe("stale");
    expect(fixture.blockerExplanation.phaseBlockerRefs).toContain(
      "slice_trust_control_status:operational:stale",
    );
  });

  it("stale continuity evidence blocking", () => {
    const fixture = createPhase9CrossPhaseConformanceFixture();

    expect(fixture.staleContinuityEvidenceRow.operationalProofState).toBe("stale");
    expect(fixture.staleContinuityEvidenceRow.requiredExperienceContinuityEvidenceRefs).toContain(
      "experience-continuity:stale",
    );
    expect(fixture.blockedBauReadinessPack.blockerRefs).toContain("continuity-review:stale");
  });

  it("missing governance/ops proof blocking", () => {
    const fixture = createPhase9CrossPhaseConformanceFixture();

    expect(fixture.missingGovernanceOpsProofRow.operationalProofState).toBe("blocked");
    expect(fixture.missingGovernanceOpsProofRow.requiredOpsContinuityEvidenceSliceRefs).toContain(
      "missing:ops-continuity-evidence-slice",
    );
    expect(
      fixture.missingGovernanceOpsProofRow.requiredGovernanceContinuityEvidenceBundleRefs,
    ).toContain("missing:governance-continuity-evidence-bundle");
  });

  it("scorecard hash determinism", () => {
    const fixture = createPhase9CrossPhaseConformanceFixture();
    const recomputed = createPhase9CrossPhaseConformanceFixture();
    const service = new Phase9CrossPhaseConformanceService();
    const stateAndHash = service.getScorecardStateAndHash({
      actor: {
        tenantScope: "tenant:demo-gp",
        actorRef: "actor:test",
        roleRefs: ["service_owner"],
        purposeOfUseRef: "governance:cross-phase-conformance:test",
        reasonRef: "reason:test",
        idempotencyKey: "idem:test:scorecard-state",
        scopeTokenRef: "scope-token:tenant:demo-gp:test",
        generatedAt: fixture.generatedAt,
      },
      scorecard: fixture.exactScorecard,
    });

    expect(fixture.exactScorecard.scorecardHash).toBe(recomputed.exactScorecard.scorecardHash);
    expect(stateAndHash.scorecardState).toBe("exact");
    expect(stateAndHash.scorecardHash).toBe(fixture.exactScorecard.scorecardHash);
  });

  it("scorecard stale after proof drift", () => {
    const fixture = createPhase9CrossPhaseConformanceFixture();

    expect(fixture.staleScorecardAfterProofDrift.scorecardState).toBe("stale");
    expect(fixture.staleScorecardAfterProofDrift.scorecardHash).not.toBe(
      fixture.exactScorecard.scorecardHash,
    );
  });

  it("BAU signoff blocked unless scorecard exact", () => {
    const fixture = createPhase9CrossPhaseConformanceFixture();

    expect(fixture.signedOffBauReadinessPack.signoffState).toBe("signed_off");
    expect(fixture.signedOffBauReadinessPack.blockerRefs).toEqual([]);
    expect(fixture.blockedBauReadinessPack.signoffState).toBe("blocked");
    expect(fixture.blockedBauReadinessPack.blockerRefs).toEqual(
      expect.arrayContaining(["scorecard:blocked", "continuity-review:stale"]),
    );
  });

  it("release-to-BAU blocked on stale/blocked scorecard", () => {
    const fixture = createPhase9CrossPhaseConformanceFixture();

    expect(fixture.releaseToBAURecord.releaseToBAURecordId).toMatch(/^rtb_449_/);
    expect(fixture.blockedReleaseToBAUAttempt.state).toBe("blocked");
    expect(fixture.blockedReleaseToBAUAttempt.blockerRefs).toEqual(
      expect.arrayContaining([
        "scorecard:blocked",
        "release-to-bau:acceptance-missing",
        "release-to-bau:rollback-plan-missing",
      ]),
    );
  });

  it("on-call contact validation blocking", () => {
    const fixture = createPhase9CrossPhaseConformanceFixture();

    expect(fixture.validOnCallMatrix.contactValidationState).toBe("validated");
    expect(fixture.validOnCallMatrix.blockerRefs).toEqual([]);
    expect(fixture.blockedOnCallMatrix.blockerRefs).toEqual(
      expect.arrayContaining(["on-call:rota-missing", "on-call:contact-validation:stale"]),
    );
  });

  it("runbook rehearsal freshness blocking", () => {
    const fixture = createPhase9CrossPhaseConformanceFixture();

    expect(fixture.currentRunbookBundle.rehearsalFreshnessState).toBe("current");
    expect(fixture.staleRunbookBundle.rehearsalFreshnessState).toBe("stale");
    expect(fixture.staleRunbookBundle.blockerRefs).toContain("runbook:rehearsal:stale");
  });

  it("exercise evidence linkage", () => {
    const fixture = createPhase9CrossPhaseConformanceFixture();

    expect(fixture.exerciseEvidenceRecords).toHaveLength(11);
    expect(fixture.exerciseEvidenceRecords.map((record) => record.exerciseType)).toEqual(
      expect.arrayContaining([
        "full_load_soak_patient_staff",
        "projection_rebuild_raw_events",
        "backup_restore_clean_environment",
        "failover_rehearsal",
        "security_incident_rehearsal",
        "reportable_incident_drill",
        "monthly_assurance_pack_generation",
        "retention_deletion_dry_run",
        "tenant_baseline_diff_approval_audit",
        "full_end_to_end_regression",
        "continuity_evidence_convergence",
      ]),
    );
    expect(
      fixture.exerciseEvidenceRecords.every((record) => record.verificationScenarioRef.length > 0),
    ).toBe(true);
  });

  it("tenant isolation and authorization", () => {
    const fixture = createPhase9CrossPhaseConformanceFixture();

    expect(fixture.tenantDeniedErrorCode).toBe("CONFORMANCE_TENANT_SCOPE_DENIED");
    expect(fixture.authorizationDeniedErrorCode).toBe("CONFORMANCE_ROLE_DENIED");
  });
});
