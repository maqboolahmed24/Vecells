import fs from "node:fs";
import path from "node:path";
import {
  PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
  PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION,
  PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION,
  PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION,
  PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
  createPhase9IncidentReportabilityWorkflowFixture,
  type Phase9IncidentReportabilityWorkflowFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/analytics_assurance/src/phase9-incident-reportability-workflow.ts",
  "data/contracts/447_phase9_incident_reportability_workflow_contract.json",
  "data/fixtures/447_phase9_incident_reportability_workflow_fixtures.json",
  "data/analysis/447_phase9_incident_reportability_workflow_summary.md",
  "data/analysis/447_algorithm_alignment_notes.md",
  "data/analysis/447_incident_queue_matrix.csv",
  "data/analysis/447_reportability_and_capa_register.csv",
  "tools/test/run_phase9_incident_reportability_workflow.ts",
  "tools/analysis/validate_447_phase9_incident_reportability_workflow.ts",
  "tests/unit/447_incident_reportability_workflow.spec.ts",
  "tests/integration/447_incident_reportability_workflow_artifacts.spec.ts",
];

const requiredTestTokens = [
  "incident creation from telemetry, operator report, and near miss",
  "near-miss first-class lifecycle without forced incident conversion",
  "severity classification and escalation",
  "evidence preservation before containment",
  "incident timeline integrity",
  "reportability decision and supersession",
  "blocked closure when reportability or CAPA is incomplete",
  "containment idempotency and authorization",
  "incident-to-CAPA propagation",
  "incident-to-assurance-pack propagation",
  "training drill creation from incident and near miss",
  "tenant isolation and purpose-of-use controls",
  "redaction of incident summaries in logs and telemetry",
  "assurance-ledger and graph writeback",
];

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

for (const relativePath of requiredFiles) {
  assert(fs.existsSync(path.join(root, relativePath)), `MISSING_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
assert(
  packageJson.scripts?.["test:phase9:incident-reportability-workflow"] ===
    "pnpm exec tsx ./tools/test/run_phase9_incident_reportability_workflow.ts && pnpm exec vitest run tests/unit/447_incident_reportability_workflow.spec.ts tests/integration/447_incident_reportability_workflow_artifacts.spec.ts",
  "PACKAGE_SCRIPT_MISSING:test:phase9:incident-reportability-workflow",
);
assert(
  packageJson.scripts?.["validate:447-phase9-incident-reportability-workflow"] ===
    "pnpm exec tsx ./tools/analysis/validate_447_phase9_incident_reportability_workflow.ts",
  "PACKAGE_SCRIPT_MISSING:validate:447-phase9-incident-reportability-workflow",
);

const checklist = readText("prompt/checklist.md");
assert(/^- \[(?:-|X)\] par_447_/m.test(checklist), "CHECKLIST_TASK_447_NOT_CLAIMED_OR_COMPLETE");

for (const [relativePath, version] of [
  [
    "data/contracts/439_phase9_investigation_timeline_service_contract.json",
    PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION,
  ],
  [
    "data/contracts/440_phase9_assurance_pack_factory_contract.json",
    PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
  ],
  [
    "data/contracts/441_phase9_capa_attestation_workflow_contract.json",
    PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION,
  ],
  [
    "data/contracts/446_phase9_projection_rebuild_quarantine_contract.json",
    PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
  ],
] as const) {
  assert(fs.existsSync(path.join(root, relativePath)), `UPSTREAM_ARTIFACT_MISSING:${relativePath}`);
  assert(
    readJson<{ schemaVersion?: string }>(relativePath).schemaVersion === version,
    `UPSTREAM_VERSION_DRIFT:${relativePath}`,
  );
}

const contract = readJson<{
  schemaVersion?: string;
  upstreamTimelineSchemaVersion?: string;
  upstreamCapaSchemaVersion?: string;
  upstreamPackSchemaVersion?: string;
  upstreamProjectionQuarantineSchemaVersion?: string;
  sourceAlgorithmRefs?: readonly string[];
  producedObjects?: readonly string[];
  apiSurface?: readonly string[];
  incidentAuthority?: Record<string, string | boolean>;
  reportabilityAuthority?: Record<string, string>;
  closureAuthority?: Record<string, string | boolean>;
  propagationAuthority?: Record<string, string | boolean | readonly string[]>;
  redactionAuthority?: { redactedFields?: readonly string[] };
  ledgerWriteback?: { entryType?: string; ledgerHash?: string; replayDecisionClass?: string };
  deterministicReplay?: { replayHash?: string };
  noGapArtifactRequired?: boolean;
}>("data/contracts/447_phase9_incident_reportability_workflow_contract.json");

assert(
  contract.schemaVersion === PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION,
  "CONTRACT_SCHEMA_VERSION_DRIFT",
);
assert(
  contract.upstreamTimelineSchemaVersion === PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION,
  "UPSTREAM_TIMELINE_SCHEMA_VERSION_DRIFT",
);
assert(
  contract.upstreamCapaSchemaVersion === PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION,
  "UPSTREAM_CAPA_SCHEMA_VERSION_DRIFT",
);
assert(
  contract.upstreamPackSchemaVersion === PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
  "UPSTREAM_PACK_SCHEMA_VERSION_DRIFT",
);
assert(
  contract.upstreamProjectionQuarantineSchemaVersion ===
    PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
  "UPSTREAM_PROJECTION_QUARANTINE_SCHEMA_VERSION_DRIFT",
);
for (const sourceRef of [
  "#9G",
  "#9C",
  "#9D",
  "#9A",
  "staff-operations",
  "439_phase9",
  "441_phase9",
  "446_phase9",
]) {
  assert(
    contract.sourceAlgorithmRefs?.some((candidate) => candidate.includes(sourceRef)),
    `SOURCE_REF_MISSING:${sourceRef}`,
  );
}
for (const objectName of [
  "SecurityIncident",
  "NearMissReport",
  "ReportabilityAssessment",
  "ContainmentAction",
  "PostIncidentReview",
  "TrainingDrillRecord",
  "IncidentCAPAPropagationRecord",
  "IncidentAssurancePackPropagation",
  "IncidentTelemetryDisclosureFence",
  "IncidentWorkflowLedgerWriteback",
  "IncidentQueuePage",
]) {
  assert(contract.producedObjects?.includes(objectName), `PRODUCED_OBJECT_MISSING:${objectName}`);
}
for (const methodName of [
  "createIncident",
  "createNearMiss",
  "triageIncidentSeverity",
  "attachEvidenceTimelineRefs",
  "startContainmentAction",
  "completeContainmentAction",
  "runReportabilityAssessment",
  "recordExternalReportingHandoffState",
  "openPostIncidentReview",
  "completePostIncidentReview",
  "createCapaFromIncident",
  "listCapaFromIncident",
  "createTrainingDrill",
  "listTrainingDrills",
  "listIncidentQueue",
  "explainBlockedClosure",
  "propagateIncidentToAssurancePack",
  "redactIncidentTelemetry",
  "writeIncidentLedgerEvidence",
]) {
  assert(contract.apiSurface?.includes(methodName), `API_SURFACE_MISSING:${methodName}`);
}
assert(contract.incidentAuthority?.telemetrySource === "telemetry", "TELEMETRY_SOURCE_MISSING");
assert(contract.incidentAuthority?.operatorSource === "operator_report", "OPERATOR_SOURCE_MISSING");
assert(contract.incidentAuthority?.nearMissSource === "near_miss", "NEAR_MISS_SOURCE_MISSING");
assert(contract.incidentAuthority?.triagedSeverity === "sev1", "SEVERITY_ESCALATION_MISSING");
assert(contract.incidentAuthority?.evidenceTimelineState === "exact", "TIMELINE_NOT_EXACT");
assert(
  contract.incidentAuthority?.containmentBeforeEvidenceState === "blocked",
  "CONTAINMENT_NOT_BLOCKED",
);
assert(
  contract.incidentAuthority?.containmentReplayDecision === "exact_replay",
  "IDEMPOTENCY_REPLAY_MISSING",
);
assert(
  contract.reportabilityAuthority?.blockedDecision === "insufficient_facts_blocked",
  "BLOCKED_REPORTABILITY_MISSING",
);
assert(
  contract.reportabilityAuthority?.pendingDecision === "reportable_pending_submission",
  "PENDING_REPORTABILITY_MISSING",
);
assert(
  contract.reportabilityAuthority?.supersededDecision === "superseded",
  "REPORTABILITY_SUPERSESSION_MISSING",
);
assert(contract.reportabilityAuthority?.finalDecision === "reported", "REPORTED_DECISION_MISSING");
assert(
  contract.reportabilityAuthority?.handoffState === "acknowledged",
  "REPORTING_HANDOFF_MISSING",
);
assert(
  contract.closureAuthority?.missingReportabilityState === "blocked",
  "MISSING_REPORTABILITY_CLOSURE_NOT_BLOCKED",
);
assert(
  contract.closureAuthority?.incompleteCapaState === "blocked",
  "INCOMPLETE_CAPA_CLOSURE_NOT_BLOCKED",
);
assert(contract.closureAuthority?.completedReviewState === "completed", "COMPLETED_REVIEW_MISSING");
assert(
  contract.propagationAuthority?.completedCapaStatus === "completed",
  "COMPLETED_CAPA_MISSING",
);
assert(contract.propagationAuthority?.packIncidentIncluded === true, "PACK_PROPAGATION_MISSING");
assert(
  contract.redactionAuthority?.redactedFields?.includes("incidentSummary"),
  "INCIDENT_SUMMARY_REDACTION_MISSING",
);
assert(
  contract.ledgerWriteback?.entryType === "evidence_materialization",
  "LEDGER_ENTRY_TYPE_INVALID",
);
assert(
  contract.ledgerWriteback?.replayDecisionClass === "exact_replay",
  "LEDGER_REPLAY_CLASS_INVALID",
);
assert(contract.ledgerWriteback?.ledgerHash?.match(/^[a-f0-9]{64}$/), "LEDGER_HASH_INVALID");
assert(contract.deterministicReplay?.replayHash?.match(/^[a-f0-9]{64}$/), "REPLAY_HASH_INVALID");
assert(contract.noGapArtifactRequired === true, "CAPA_GAP_POSTURE_MISSING");

const fixture = readJson<Phase9IncidentReportabilityWorkflowFixture>(
  "data/fixtures/447_phase9_incident_reportability_workflow_fixtures.json",
);
const recomputed = createPhase9IncidentReportabilityWorkflowFixture();
assert(fixture.replayHash === recomputed.replayHash, "REPLAY_HASH_DRIFT");
assert(
  fixture.telemetryIncident.detectionSource === "telemetry",
  "FIXTURE_TELEMETRY_SOURCE_MISSING",
);
assert(
  fixture.operatorIncident.detectionSource === "operator_report",
  "FIXTURE_OPERATOR_SOURCE_MISSING",
);
assert(
  fixture.nearMissIncident.detectionSource === "near_miss",
  "FIXTURE_NEAR_MISS_SOURCE_MISSING",
);
assert(
  fixture.firstClassNearMiss.linkedIncidentRef === "incident:not-converted",
  "NEAR_MISS_FORCED_CONVERSION",
);
assert(fixture.triagedIncident.severity === "sev1", "FIXTURE_SEVERITY_ESCALATION_MISSING");
assert(
  fixture.evidencePreservedIncident.timelineIntegrityState === "exact",
  "FIXTURE_TIMELINE_NOT_EXACT",
);
assert(
  fixture.containmentStart.evidencePreservedBeforeAction === true,
  "CONTAINMENT_LACKS_EVIDENCE",
);
assert(
  fixture.containmentReplay.idempotencyDecision === "exact_replay",
  "CONTAINMENT_REPLAY_MISSING",
);
assert(fixture.reportedAssessment.decision === "reported", "FIXTURE_REPORTED_DECISION_MISSING");
assert(fixture.supersededAssessment.decision === "superseded", "FIXTURE_SUPERSESSION_MISSING");
assert(
  fixture.blockedClosureMissingReportability.state === "blocked",
  "FIXTURE_MISSING_REPORTABILITY_NOT_BLOCKED",
);
assert(
  fixture.blockedClosureIncompleteCapa.state === "blocked",
  "FIXTURE_INCOMPLETE_CAPA_NOT_BLOCKED",
);
assert(fixture.completedReview.state === "completed", "FIXTURE_COMPLETED_REVIEW_MISSING");
assert(fixture.completedCapaAction.status === "completed", "FIXTURE_CAPA_NOT_COMPLETED");
assert(
  fixture.assurancePackPropagation.incidentRefs.includes(
    fixture.evidencePreservedIncident.securityIncidentId,
  ),
  "FIXTURE_PACK_INCIDENT_PROPAGATION_MISSING",
);
assert(fixture.drillFromIncident.sourceType === "incident", "FIXTURE_INCIDENT_DRILL_MISSING");
assert(fixture.drillFromNearMiss.sourceType === "near_miss", "FIXTURE_NEAR_MISS_DRILL_MISSING");
assert(
  fixture.tenantDeniedErrorCode === "INCIDENT_WORKFLOW_TENANT_DENIED",
  "TENANT_DENIAL_MISSING",
);
assert(
  fixture.purposeDeniedErrorCode === "INCIDENT_WORKFLOW_PURPOSE_DENIED",
  "PURPOSE_DENIAL_MISSING",
);
assert(
  fixture.authorizationDeniedErrorCode === "INCIDENT_WORKFLOW_ROLE_DENIED",
  "AUTHZ_DENIAL_MISSING",
);
assert(
  !JSON.stringify(fixture.disclosureFence.safeTelemetryPayload).includes("Patient Alice"),
  "REDACTION_LEAKED_INCIDENT_SUMMARY",
);
assert(
  fixture.ledgerWriteback.assuranceLedgerEntry.hash.match(/^[a-f0-9]{64}$/),
  "FIXTURE_LEDGER_HASH_INVALID",
);

const unitSpec = readText("tests/unit/447_incident_reportability_workflow.spec.ts");
for (const token of requiredTestTokens) {
  assert(unitSpec.includes(token), `TEST_TOKEN_MISSING:${token}`);
}

const gapPath = path.join(
  root,
  "data/contracts/PHASE9_BATCH_443_457_INTERFACE_GAP_447_CAPA_WORKFLOW.json",
);
assert(!fs.existsSync(gapPath), "UNEXPECTED_CAPA_GAP_ARTIFACT");

console.log("447 Phase 9 incident reportability workflow validation passed");
