import { describe, expect, it } from "vitest";
import { createPhase9IncidentReportabilityWorkflowFixture } from "../../packages/domains/analytics_assurance/src/index.ts";

describe("447 Phase 9 incident reportability workflow", () => {
  it("incident creation from telemetry, operator report, and near miss", () => {
    const fixture = createPhase9IncidentReportabilityWorkflowFixture();

    expect(fixture.telemetryIncident.detectionSource).toBe("telemetry");
    expect(fixture.operatorIncident.detectionSource).toBe("operator_report");
    expect(fixture.nearMissIncident.detectionSource).toBe("near_miss");
    expect(fixture.nearMissIncident.linkedNearMissRefs).toContain(
      fixture.linkedNearMiss.nearMissReportId,
    );
  });

  it("near-miss first-class lifecycle without forced incident conversion", () => {
    const fixture = createPhase9IncidentReportabilityWorkflowFixture();

    expect(fixture.firstClassNearMiss.investigationState).toBe("reported");
    expect(fixture.firstClassNearMiss.linkedIncidentRef).toBe("incident:not-converted");
    expect(fixture.drillFromNearMiss.sourceType).toBe("near_miss");
    expect(fixture.nearMissIncident.sourceRef).toBe(fixture.linkedNearMiss.nearMissReportId);
  });

  it("severity classification and escalation", () => {
    const fixture = createPhase9IncidentReportabilityWorkflowFixture();

    expect(fixture.telemetryIncident.severity).toBe("sev3");
    expect(fixture.triagedIncident.severity).toBe("sev1");
    expect(fixture.triagedIncident.auditInvestigationRefs).toContain(
      "escalation:447:senior-review",
    );
  });

  it("evidence preservation before containment", () => {
    const fixture = createPhase9IncidentReportabilityWorkflowFixture();

    expect(fixture.containmentBlockedBeforeEvidence.resultState).toBe("blocked");
    expect(fixture.containmentBlockedBeforeEvidence.blockerRefs).toContain(
      "containment:evidence-preservation-required",
    );
    expect(fixture.containmentStart.evidencePreservedBeforeAction).toBe(true);
    expect(fixture.containmentStart.resultState).toBe("running");
  });

  it("incident timeline integrity", () => {
    const fixture = createPhase9IncidentReportabilityWorkflowFixture();

    expect(fixture.evidencePreservedIncident.timelineIntegrityState).toBe("exact");
    expect(fixture.evidencePreservedIncident.timelineRef).toMatch(/^itrec_439_/);
    expect(fixture.evidencePreservedIncident.timelineHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.reportedAssessment.supportingFacts.timelineEvidenceRefs).toContain(
      fixture.evidencePreservedIncident.timelineRef,
    );
  });

  it("reportability decision and supersession", () => {
    const fixture = createPhase9IncidentReportabilityWorkflowFixture();

    expect(fixture.blockedFactsAssessment.decision).toBe("insufficient_facts_blocked");
    expect(fixture.pendingSubmissionAssessment.decision).toBe("reportable_pending_submission");
    expect(fixture.supersededAssessment.decision).toBe("superseded");
    expect(fixture.reportedAssessment.decision).toBe("reported");
    expect(fixture.reportedAssessment.supersedesAssessmentRef).toBe(
      fixture.pendingSubmissionAssessment.assessmentId,
    );
  });

  it("blocked closure when reportability or CAPA is incomplete", () => {
    const fixture = createPhase9IncidentReportabilityWorkflowFixture();

    expect(fixture.blockedClosureMissingReportability.state).toBe("blocked");
    expect(fixture.blockedClosureMissingReportability.blockedReasonRefs).toContain(
      "reportability:insufficient_facts_blocked",
    );
    expect(fixture.blockedClosureIncompleteCapa.state).toBe("blocked");
    expect(fixture.blockedClosureIncompleteCapa.blockedReasonRefs[0]).toMatch(/^capa:incomplete:/);
    expect(fixture.completedReview.state).toBe("completed");
  });

  it("containment idempotency and authorization", () => {
    const fixture = createPhase9IncidentReportabilityWorkflowFixture();

    expect(fixture.containmentStart.idempotencyDecision).toBe("accepted");
    expect(fixture.containmentReplay.idempotencyDecision).toBe("exact_replay");
    expect(fixture.containmentReplay.containmentActionId).toBe(
      fixture.containmentStart.containmentActionId,
    );
    expect(fixture.authorizationDeniedErrorCode).toBe("INCIDENT_WORKFLOW_ROLE_DENIED");
  });

  it("incident-to-CAPA propagation", () => {
    const fixture = createPhase9IncidentReportabilityWorkflowFixture();

    expect(fixture.capaPropagation.incidentRef).toBe(
      fixture.evidencePreservedIncident.securityIncidentId,
    );
    expect(fixture.capaPropagation.capaAction.incidentRefs).toContain(
      fixture.evidencePreservedIncident.securityIncidentId,
    );
    expect(fixture.completedCapaAction.status).toBe("completed");
  });

  it("incident-to-assurance-pack propagation", () => {
    const fixture = createPhase9IncidentReportabilityWorkflowFixture();

    expect(fixture.assurancePackPropagation.incidentRefs).toContain(
      fixture.evidencePreservedIncident.securityIncidentId,
    );
    expect(fixture.assurancePackPropagation.capaRefs).toContain(
      fixture.completedCapaAction.capaActionId,
    );
    expect(fixture.assurancePackPropagation.graphEdgeRefs).toContain(
      `aege_447_incident_${fixture.evidencePreservedIncident.securityIncidentId}`,
    );
  });

  it("training drill creation from incident and near miss", () => {
    const fixture = createPhase9IncidentReportabilityWorkflowFixture();

    expect(fixture.drillFromIncident.sourceType).toBe("incident");
    expect(fixture.drillFromIncident.followUpRefs).toContain(
      fixture.completedCapaAction.capaActionId,
    );
    expect(fixture.drillFromNearMiss.sourceType).toBe("near_miss");
    expect(fixture.drillFromNearMiss.sourceRef).toBe(fixture.firstClassNearMiss.nearMissReportId);
  });

  it("tenant isolation and purpose-of-use controls", () => {
    const fixture = createPhase9IncidentReportabilityWorkflowFixture();

    expect(fixture.tenantDeniedErrorCode).toBe("INCIDENT_WORKFLOW_TENANT_DENIED");
    expect(fixture.purposeDeniedErrorCode).toBe("INCIDENT_WORKFLOW_PURPOSE_DENIED");
  });

  it("redaction of incident summaries in logs and telemetry", () => {
    const fixture = createPhase9IncidentReportabilityWorkflowFixture();
    const payload = JSON.stringify(fixture.disclosureFence.safeTelemetryPayload);

    expect(fixture.disclosureFence.redactedFields).toEqual(
      expect.arrayContaining(["incidentSummary", "patientIdentifier", "routeParams"]),
    );
    expect(payload).not.toContain("Patient Alice");
    expect(payload).not.toContain("nhs-447");
    expect(payload).toContain("[redacted:");
  });

  it("assurance-ledger and graph writeback", () => {
    const fixture = createPhase9IncidentReportabilityWorkflowFixture();

    expect(fixture.ledgerWriteback.assuranceLedgerEntry.entryType).toBe("evidence_materialization");
    expect(fixture.ledgerWriteback.assuranceLedgerEntry.telemetryDisclosureFenceRef).toBe(
      fixture.disclosureFence.disclosureFenceId,
    );
    expect(fixture.ledgerWriteback.graphEdgeRefs).toEqual(
      expect.arrayContaining([
        `aege_447_incident_opens_gap_${fixture.evidencePreservedIncident.securityIncidentId}`,
        `aege_447_gap_drives_capa_${fixture.completedCapaAction.capaActionId}`,
      ]),
    );
    expect(fixture.ledgerWriteback.assuranceLedgerEntry.hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
