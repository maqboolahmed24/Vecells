import { describe, expect, it } from "vitest";
import {
  createPhase9GovernanceControlFixture,
  evaluateDispositionEligibility,
  resolveTransitiveArtifactDependencies,
  validateDependencyGraphForDisposition,
  validateDependencyRiskRecord,
  validateDispositionDecisionRequiresAssessment,
  validateGovernanceContractDefinitionCoverage,
  validateGovernanceContractObject,
  validateGovernanceOverride,
  validateGovernanceTenantIsolation,
  validateImmutableConfigCannotMutateInPlace,
  validateIncidentReportabilityEvidence,
  validateRecoveryEvidenceWriteback,
  validateRetentionClassificationBoundAtCreation,
  validateTenantPolicyPublicationRequiresVersionHash,
  type ArtifactDependencyLink,
  type LegalHoldRecord,
  type LegalHoldScopeManifest,
  type RetentionDecision,
  type RetentionLifecycleBinding,
} from "../../packages/domains/analytics_assurance/src/phase9-governance-control-contracts.ts";

describe("434 Phase 9 governance control contracts", () => {
  it("validates frozen governance contract definitions and valid examples", () => {
    const fixture = createPhase9GovernanceControlFixture();

    expect(validateGovernanceContractDefinitionCoverage()).toEqual({ valid: true, errors: [] });
    for (const contractName of fixture.contractNames) {
      expect(validateGovernanceContractObject(contractName, fixture.examples[contractName])).toEqual({
        valid: true,
        errors: [],
      });
    }
  });

  it("accepts valid retention, legal-hold, and disposition examples", () => {
    const fixture = createPhase9GovernanceControlFixture();

    expect(validateRetentionClassificationBoundAtCreation(fixture.examples.RetentionLifecycleBinding as unknown as RetentionLifecycleBinding)).toEqual({
      valid: true,
      errors: [],
    });
    expect(fixture.dispositionAssessment.eligibilityState).toBe("blocked");
    expect(fixture.dispositionAssessment.blockingReasonRefs).toContain("active_dependency");
    expect(fixture.dispositionAssessment.blockingReasonRefs).toContain("transitive_legal_hold");
  });

  it("rejects retention classification inferred from storage paths", () => {
    const fixture = createPhase9GovernanceControlFixture();
    const binding = {
      ...fixture.examples.RetentionLifecycleBinding,
      artifactClassRef: "s3://bucket/transcripts/001.txt",
    } as unknown as RetentionLifecycleBinding;

    expect(validateRetentionClassificationBoundAtCreation(binding).errors).toContain(
      "RETENTION_CLASS_INFERRED_FROM_STORAGE_PATH",
    );
  });

  it("rejects disposition without assessment", () => {
    const fixture = createPhase9GovernanceControlFixture();
    const decision = {
      ...fixture.examples.RetentionDecision,
      effectiveDisposition: "delete_pending",
      dispositionEligibilityAssessmentRef: "",
    } as unknown as RetentionDecision;

    expect(validateDispositionDecisionRequiresAssessment(decision)).toEqual({
      valid: false,
      errors: ["DISPOSITION_ASSESSMENT_REQUIRED:rd_434_transcript_001"],
    });
  });

  it("handles a dependency cycle and fails closed", () => {
    const links: ArtifactDependencyLink[] = [
      {
        dependencyLinkId: "adl_cycle_a_b",
        artifactRef: "artifact:a",
        dependentArtifactRef: "artifact:b",
        governingScopeRef: "scope:test",
        dependencyType: "test",
        dependencyStrength: "disposal_blocking",
        activeState: "active",
        sourceGraphEdgeRef: "edge:a-b",
        linkHash: "h:a-b",
      },
      {
        dependencyLinkId: "adl_cycle_b_a",
        artifactRef: "artifact:b",
        dependentArtifactRef: "artifact:a",
        governingScopeRef: "scope:test",
        dependencyType: "test",
        dependencyStrength: "disposal_blocking",
        activeState: "active",
        sourceGraphEdgeRef: "edge:b-a",
        linkHash: "h:b-a",
      },
    ];

    expect(resolveTransitiveArtifactDependencies("artifact:a", links).cycleDetected).toBe(true);
    expect(validateDependencyGraphForDisposition("artifact:a", links).errors).toEqual([
      "DEPENDENCY_CYCLE_FAIL_CLOSED:artifact:a",
    ]);
  });

  it("proves legal hold blocks disposition transitively", () => {
    const fixture = createPhase9GovernanceControlFixture();

    expect(fixture.dispositionClosure.dependencyArtifactRefs).toContain("artifact:evidence-snapshot:001");
    expect(fixture.dispositionAssessment.activeLegalHoldRefs).toContain("lhr_434_patient_dispute");
    expect(fixture.dispositionAssessment.blockingReasonRefs).toContain("transitive_legal_hold");
  });

  it("keeps legal hold and retention freeze as one preservation-first control plane", () => {
    const fixture = createPhase9GovernanceControlFixture();
    const binding = {
      ...fixture.examples.RetentionLifecycleBinding,
      activeFreezeRefs: ["freeze:records-review"],
      activeLegalHoldRefs: ["lhr_434_patient_dispute"],
    } as unknown as RetentionLifecycleBinding;
    const assessment = evaluateDispositionEligibility({
      binding,
      decision: fixture.examples.RetentionDecision as unknown as RetentionDecision,
      dependencyLinks: [fixture.examples.ArtifactDependencyLink as unknown as ArtifactDependencyLink],
      legalHolds: [fixture.examples.LegalHoldRecord as unknown as LegalHoldRecord],
      legalHoldScopeManifests: [fixture.examples.LegalHoldScopeManifest as unknown as LegalHoldScopeManifest],
      assuranceEvidenceGraphSnapshotRef: "aegs_432_current",
      assuranceGraphCompletenessVerdictRef: "agcv_432_complete",
      graphHash: "graph-hash",
      assessedAt: fixture.generatedAt,
    });

    expect(assessment.blockingReasonRefs).toContain("active_retention_freeze");
    expect(assessment.blockingReasonRefs).toContain("active_legal_hold");
  });

  it("proves immutable config cannot be mutated in place", () => {
    const fixture = createPhase9GovernanceControlFixture();
    const previous = fixture.examples.ImmutableConfigPublication;
    const next = { ...previous, publishedBy: "governance-user:mutator" };

    expect(validateImmutableConfigCannotMutateInPlace(previous, next).errors).toContain(
      "IMMUTABLE_CONFIG_MUTATED_IN_PLACE:icp_434_tenant_a",
    );
  });

  it("requires tenant policy publication version hash", () => {
    const fixture = createPhase9GovernanceControlFixture();
    const badPublication = { ...fixture.examples.TenantPolicyPack, versionHash: "" };

    expect(validateTenantPolicyPublicationRequiresVersionHash(badPublication).errors).toContain(
      "TENANT_POLICY_PUBLICATION_FIELD_MISSING:versionHash",
    );
  });

  it("proves incident reportability requires audit and timeline refs", () => {
    const fixture = createPhase9GovernanceControlFixture();
    const badIncident = { ...fixture.examples.IncidentRecord, auditEvidenceRefs: [], timelineEntryRefs: [] };

    expect(
      validateIncidentReportabilityEvidence(badIncident, fixture.examples.ReportabilityAssessment, [
        fixture.examples.IncidentTimelineEntry,
      ]).errors,
    ).toEqual(expect.arrayContaining(["INCIDENT_AUDIT_REFS_REQUIRED", "INCIDENT_TIMELINE_REFS_REQUIRED"]));
  });

  it("rejects recovery evidence missing graph ref", () => {
    const fixture = createPhase9GovernanceControlFixture();
    const badEvidence = { ...fixture.examples.RecoveryEvidenceWriteback, graphHash: "" };

    expect(validateRecoveryEvidenceWriteback(badEvidence).errors).toEqual([
      "RECOVERY_EVIDENCE_GRAPH_REF_MISSING:graphHash",
    ]);
  });

  it("rejects dependency risk missing owner or scope", () => {
    const fixture = createPhase9GovernanceControlFixture();
    const badRisk = { ...fixture.examples.DependencyRiskRecord, ownerRef: "", scopeRef: "" };

    expect(validateDependencyRiskRecord(badRisk).errors).toEqual([
      "DEPENDENCY_RISK_FIELD_MISSING:ownerRef",
      "DEPENDENCY_RISK_FIELD_MISSING:scopeRef",
    ]);
  });

  it("rejects governance override without expiry", () => {
    const fixture = createPhase9GovernanceControlFixture();
    const badOverride = { ...fixture.examples.PolicyOverrideRecord, expiresAt: "" };

    expect(validateGovernanceOverride(badOverride).errors).toEqual([
      "GOVERNANCE_OVERRIDE_FIELD_MISSING:expiresAt",
    ]);
  });

  it("denies a cross-tenant reference", () => {
    expect(
      validateGovernanceTenantIsolation("tenant:a", [
        { sourceRef: "dependency:local", tenantId: "tenant:a", referencedTenantIds: ["tenant:b"] },
      ]),
    ).toEqual({
      valid: false,
      errors: ["CROSS_TENANT_REFERENCE:dependency:local:tenant:b"],
    });
  });
});
