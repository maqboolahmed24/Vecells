import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION,
  createPhase9IncidentReportabilityWorkflowFixture,
  phase9IncidentQueueMatrixCsv,
  phase9IncidentReportabilityWorkflowSummary,
  phase9ReportabilityAndCapaRegisterCsv,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(
  contractsDir,
  "447_phase9_incident_reportability_workflow_contract.json",
);
const fixturePath = path.join(
  fixturesDir,
  "447_phase9_incident_reportability_workflow_fixtures.json",
);
const summaryPath = path.join(analysisDir, "447_phase9_incident_reportability_workflow_summary.md");
const notesPath = path.join(analysisDir, "447_algorithm_alignment_notes.md");
const queueMatrixPath = path.join(analysisDir, "447_incident_queue_matrix.csv");
const reportabilityRegisterPath = path.join(analysisDir, "447_reportability_and_capa_register.csv");

const fixture = createPhase9IncidentReportabilityWorkflowFixture();

const contractArtifact = {
  schemaVersion: PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION,
  upstreamTimelineSchemaVersion: fixture.upstreamTimelineSchemaVersion,
  upstreamCapaSchemaVersion: fixture.upstreamCapaSchemaVersion,
  upstreamPackSchemaVersion: fixture.upstreamPackSchemaVersion,
  upstreamProjectionQuarantineSchemaVersion: fixture.upstreamProjectionQuarantineSchemaVersion,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  producedObjects: fixture.producedObjects,
  apiSurface: fixture.apiSurface,
  incidentAuthority: {
    telemetrySource: fixture.telemetryIncident.detectionSource,
    operatorSource: fixture.operatorIncident.detectionSource,
    nearMissSource: fixture.nearMissIncident.detectionSource,
    triagedSeverity: fixture.triagedIncident.severity,
    evidenceTimelineState: fixture.evidencePreservedIncident.timelineIntegrityState,
    containmentBeforeEvidenceState: fixture.containmentBlockedBeforeEvidence.resultState,
    containmentReplayDecision: fixture.containmentReplay.idempotencyDecision,
  },
  reportabilityAuthority: {
    blockedDecision: fixture.blockedFactsAssessment.decision,
    pendingDecision: fixture.pendingSubmissionAssessment.decision,
    supersededDecision: fixture.supersededAssessment.decision,
    finalDecision: fixture.reportedAssessment.decision,
    handoffState: fixture.externalReportingHandoff.handoffState,
  },
  closureAuthority: {
    missingReportabilityState: fixture.blockedClosureMissingReportability.state,
    incompleteCapaState: fixture.blockedClosureIncompleteCapa.state,
    completedReviewState: fixture.completedReview.state,
    closureExplanationBlocked: fixture.closureExplanation.blocked,
  },
  propagationAuthority: {
    capaRef: fixture.capaPropagation.capaAction.capaActionId,
    completedCapaStatus: fixture.completedCapaAction.status,
    packPropagationRef: fixture.assurancePackPropagation.incidentAssurancePackPropagationId,
    packIncidentIncluded: fixture.assurancePackPropagation.incidentRefs.includes(
      fixture.evidencePreservedIncident.securityIncidentId,
    ),
    drillSources: [fixture.drillFromIncident.sourceType, fixture.drillFromNearMiss.sourceType],
  },
  redactionAuthority: {
    disclosureFenceRef: fixture.disclosureFence.disclosureFenceId,
    permittedDisclosureClass: fixture.disclosureFence.permittedDisclosureClass,
    redactedFields: fixture.disclosureFence.redactedFields,
  },
  ledgerWriteback: {
    entryType: fixture.ledgerWriteback.assuranceLedgerEntry.entryType,
    ledgerHash: fixture.ledgerWriteback.assuranceLedgerEntry.hash,
    replayDecisionClass: fixture.ledgerWriteback.assuranceLedgerEntry.replayDecisionClass,
    graphEdgeRefs: fixture.ledgerWriteback.graphEdgeRefs,
  },
  deterministicReplay: {
    replayHash: fixture.replayHash,
  },
  noGapArtifactRequired: true,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(summaryPath, phase9IncidentReportabilityWorkflowSummary(fixture));
fs.writeFileSync(
  notesPath,
  [
    "# Phase 9 Incident Reportability Workflow Algorithm Alignment",
    "",
    "Task 447 implements section 9G as a governed backend workflow. Incidents can originate from telemetry, operator reports, near misses, audit, break-glass review, projection quarantine, assurance evidence gaps, external notifications, or supplier alerts.",
    "",
    "Near misses are first-class records. They can remain near misses, link to incidents, drive CAPA, or create training drills without being forced into the incident queue.",
    "",
    "Reportability decisions are versioned, evidence-based, timeline-pinned, supersedable, and paired with external handoff state. Post-incident review blocks closure until reportability and CAPA ownership are complete.",
    "",
    "Containment actions require role, purpose, reason, tenant-bound scope, and idempotency. High-risk containment proves evidence preservation and authoritative command settlement refs before it can settle.",
    "",
    "Incident outcomes propagate into CAPA, assurance packs, training drills, redacted telemetry fences, assurance-ledger entries, and graph edge refs.",
    "",
  ].join("\n"),
);
fs.writeFileSync(queueMatrixPath, phase9IncidentQueueMatrixCsv(fixture));
fs.writeFileSync(reportabilityRegisterPath, phase9ReportabilityAndCapaRegisterCsv(fixture));

console.log(
  `Phase 9 incident reportability workflow contract: ${path.relative(root, contractPath)}`,
);
console.log(`Replay hash: ${fixture.replayHash}`);
