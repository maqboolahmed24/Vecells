import {
  GENESIS_ASSURANCE_LEDGER_HASH,
  buildAssuranceLedgerEntry,
  hashAssurancePayload,
  orderedSetHash,
  type AssuranceLedgerEntry,
} from "./phase9-assurance-ledger-contracts";
import {
  PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
  type AssurancePackFactoryResult,
  type MonthlyAssurancePack,
} from "./phase9-assurance-pack-factory";
import { createPhase9AssurancePackFactoryFixture } from "./phase9-assurance-pack-factory";
import {
  PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION,
  Phase9CapaAttestationWorkflowService,
  type AssuranceWorkflowGraphVerdictRef,
  type CAPAAction,
} from "./phase9-capa-attestation-workflow";
import {
  PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION,
  createPhase9InvestigationTimelineFixture,
} from "./phase9-investigation-timeline-service";
import {
  PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
  createPhase9ProjectionRebuildQuarantineFixture,
} from "./phase9-projection-rebuild-quarantine";

export const PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION =
  "447.phase9.incident-reportability-workflow.v1";

export type IncidentDetectionSource =
  | "telemetry"
  | "operator_report"
  | "near_miss"
  | "audit_investigation"
  | "break_glass_review"
  | "projection_quarantine"
  | "assurance_evidence_gap"
  | "external_notification"
  | "supplier_alert";

export type SecurityIncidentType =
  | "security"
  | "privacy"
  | "clinical_safety"
  | "availability"
  | "projection_integrity"
  | "supplier";

export type SecurityIncidentSeverity = "sev1" | "sev2" | "sev3" | "sev4" | "near_miss";

export type SecurityIncidentStatus =
  | "new"
  | "triaged"
  | "investigating"
  | "contained"
  | "reportability_assessing"
  | "reportable_pending"
  | "reported"
  | "post_incident_review"
  | "closed"
  | "blocked";

export type PatientSafetyImpactState = "none" | "potential" | "confirmed";
export type DataProtectionImpactState = "none" | "under_review" | "confirmed";
export type NearMissInvestigationState =
  | "reported"
  | "triaged"
  | "investigating"
  | "capa_opened"
  | "linked_incident"
  | "training_planned"
  | "closed_near_miss";

export type ReportabilityDecision =
  | "not_reportable"
  | "reportable_pending_submission"
  | "reported"
  | "needs_senior_review"
  | "insufficient_facts_blocked"
  | "superseded";

export type ContainmentActionType =
  | "access_freeze"
  | "producer_quarantine"
  | "route_downgrade"
  | "credential_rotation_task"
  | "communication_hold"
  | "restoration_handoff"
  | "governed_escalation";

export type ContainmentResultState =
  | "pending"
  | "running"
  | "settled"
  | "failed"
  | "blocked"
  | "superseded";

export type ExternalReportingHandoffState =
  | "not_required"
  | "pending_submission"
  | "submitted"
  | "acknowledged"
  | "blocked";

export type PostIncidentReviewState = "open" | "blocked" | "completed";
export type TrainingDrillSourceType =
  | "incident"
  | "near_miss"
  | "tabletop"
  | "reportability_gap"
  | "recurring_plan";
export type IncidentConfidentialityMode = "standard" | "confidential" | "anonymous_allowed";
export type IncidentDisclosureClass = "metadata_only" | "masked_summary" | "bounded_detail";

export interface IncidentWorkflowActorContext {
  readonly tenantId: string;
  readonly actorRef: string;
  readonly roleRefs: readonly string[];
  readonly purposeOfUseRef: string;
  readonly reasonRef: string;
  readonly idempotencyKey: string;
  readonly scopeTokenRef: string;
  readonly generatedAt: string;
}

export interface SecurityIncident {
  readonly securityIncidentId: string;
  readonly tenantId: string;
  readonly incidentType: SecurityIncidentType;
  readonly detectionSource: IncidentDetectionSource;
  readonly sourceRef: string;
  readonly detectedAt: string;
  readonly severity: SecurityIncidentSeverity;
  readonly impactScope: string;
  readonly status: SecurityIncidentStatus;
  readonly reportabilityAssessmentRef: string;
  readonly ownerRef: string;
  readonly timelineRef: string;
  readonly timelineHash: string;
  readonly timelineIntegrityState: "pending" | "exact" | "blocked";
  readonly containmentActionRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly preservedEvidenceRefs: readonly string[];
  readonly affectedSystemRefs: readonly string[];
  readonly affectedDataRefs: readonly string[];
  readonly patientSafetyImpactState: PatientSafetyImpactState;
  readonly dataProtectionImpactState: DataProtectionImpactState;
  readonly linkedNearMissRefs: readonly string[];
  readonly auditInvestigationRefs: readonly string[];
  readonly projectionQuarantineRefs: readonly string[];
  readonly capaRefs: readonly string[];
  readonly trainingDrillRefs: readonly string[];
  readonly graphSnapshotRef: string;
  readonly graphHash: string;
  readonly incidentHash: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NearMissReport {
  readonly nearMissReportId: string;
  readonly tenantId: string;
  readonly reportedBy: string;
  readonly contextRef: string;
  readonly summaryRef: string;
  readonly confidentialityMode: IncidentConfidentialityMode;
  readonly investigationState: NearMissInvestigationState;
  readonly linkedIncidentRef: string;
  readonly evidenceRefs: readonly string[];
  readonly capaRefs: readonly string[];
  readonly trainingDrillRefs: readonly string[];
  readonly workflowHandlingAuditRefs: readonly string[];
  readonly nearMissHash: string;
  readonly reportedAt: string;
  readonly updatedAt: string;
}

export interface ReportabilitySupportingFacts {
  readonly timelineEvidenceRefs: readonly string[];
  readonly affectedDataRefs: readonly string[];
  readonly affectedSystemRefs: readonly string[];
  readonly patientSafetyImpactState: PatientSafetyImpactState;
  readonly dataProtectionImpactState: DataProtectionImpactState;
  readonly confidentialityImpactState: DataProtectionImpactState;
  readonly knownContainmentStatusRef: string;
  readonly decisionRationaleRef: string;
  readonly graphSnapshotRef: string;
  readonly graphHash: string;
  readonly factsHash: string;
}

export interface ReportabilityAssessment {
  readonly assessmentId: string;
  readonly tenantId: string;
  readonly incidentRef: string;
  readonly frameworkRef: string;
  readonly decision: ReportabilityDecision;
  readonly supportingFactsRef: string;
  readonly reportedAt: string;
  readonly assessedBy: string;
  readonly assessedAt: string;
  readonly supersedesAssessmentRef?: string;
  readonly supersededByAssessmentRef?: string;
  readonly supportingFacts: ReportabilitySupportingFacts;
  readonly decisionHash: string;
}

export interface ContainmentAction {
  readonly containmentActionId: string;
  readonly tenantId: string;
  readonly incidentRef: string;
  readonly actionType: ContainmentActionType;
  readonly initiatedBy: string;
  readonly initiatedAt: string;
  readonly resultState: ContainmentResultState;
  readonly idempotencyKey: string;
  readonly idempotencyDecision: "accepted" | "exact_replay" | "collision_review";
  readonly commandActionRecordRef: string;
  readonly commandSettlementRef: string;
  readonly auditRecordRef: string;
  readonly purposeOfUseRef: string;
  readonly reasonRef: string;
  readonly evidencePreservedBeforeAction: boolean;
  readonly evidenceRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly settlementHash: string;
  readonly completedAt?: string;
}

export interface ExternalReportingHandoffRecord {
  readonly externalReportingHandoffId: string;
  readonly tenantId: string;
  readonly assessmentRef: string;
  readonly incidentRef: string;
  readonly routeRef: string;
  readonly handoffState: ExternalReportingHandoffState;
  readonly recordedBy: string;
  readonly recordedAt: string;
  readonly handoffHash: string;
}

export interface PostIncidentReview {
  readonly reviewId: string;
  readonly tenantId: string;
  readonly incidentRef: string;
  readonly rootCauseRef: string;
  readonly capaRefs: readonly string[];
  readonly lessonsLearnedRef: string;
  readonly ownerRef: string;
  readonly reportabilityAssessmentRef: string;
  readonly state: PostIncidentReviewState;
  readonly requiredCapaOwnershipComplete: boolean;
  readonly blockedReasonRefs: readonly string[];
  readonly reviewHash: string;
  readonly openedAt: string;
  readonly completedAt?: string;
}

export interface TrainingDrillRecord {
  readonly trainingDrillRecordId: string;
  readonly tenantId: string;
  readonly sourceType: TrainingDrillSourceType;
  readonly sourceRef: string;
  readonly scenarioRef: string;
  readonly audienceRef: string;
  readonly runAt: string;
  readonly findingsRef: string;
  readonly followUpRefs: readonly string[];
  readonly capaRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly drillHash: string;
}

export interface IncidentCAPAPropagationRecord {
  readonly incidentCapaPropagationRecordId: string;
  readonly tenantId: string;
  readonly incidentRef: string;
  readonly nearMissRefs: readonly string[];
  readonly evidenceGapRefs: readonly string[];
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly graphHash: string;
  readonly capaAction: CAPAAction;
  readonly propagationHash: string;
}

export interface IncidentAssurancePackPropagation {
  readonly incidentAssurancePackPropagationId: string;
  readonly tenantId: string;
  readonly incidentRef: string;
  readonly monthlyAssurancePackRef: string;
  readonly incidentRefs: readonly string[];
  readonly capaRefs: readonly string[];
  readonly graphEdgeRefs: readonly string[];
  readonly packVersionHash: string;
  readonly packSignoffState: MonthlyAssurancePack["signoffState"];
  readonly propagationHash: string;
  readonly propagatedAt: string;
}

export interface IncidentTelemetryDisclosureFence {
  readonly disclosureFenceId: string;
  readonly tenantId: string;
  readonly sourceRef: string;
  readonly permittedDisclosureClass: IncidentDisclosureClass;
  readonly redactedFields: readonly string[];
  readonly safeTelemetryPayload: Record<string, string>;
  readonly summaryHash: string;
  readonly fenceHash: string;
  readonly recordedAt: string;
}

export interface IncidentWorkflowLedgerWriteback {
  readonly writebackId: string;
  readonly tenantId: string;
  readonly incidentRef: string;
  readonly reportabilityAssessmentRef: string;
  readonly assuranceLedgerEntry: AssuranceLedgerEntry;
  readonly graphEdgeRefs: readonly string[];
  readonly evidenceGraphSnapshotRef: string;
  readonly graphHash: string;
  readonly writebackHash: string;
  readonly writtenAt: string;
}

export interface IncidentQueueFilters {
  readonly tenantId: string;
  readonly severity?: SecurityIncidentSeverity;
  readonly status?: SecurityIncidentStatus;
  readonly detectionSource?: IncidentDetectionSource;
  readonly ownerRef?: string;
}

export interface IncidentQueuePage {
  readonly rows: readonly SecurityIncident[];
  readonly nextCursor?: string;
}

export interface IncidentClosureExplanation {
  readonly incidentRef: string;
  readonly blocked: boolean;
  readonly blockerRefs: readonly string[];
  readonly nextSafeActions: readonly string[];
}

export interface Phase9IncidentReportabilityWorkflowFixture {
  readonly schemaVersion: typeof PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION;
  readonly generatedAt: string;
  readonly upstreamTimelineSchemaVersion: typeof PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION;
  readonly upstreamCapaSchemaVersion: typeof PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION;
  readonly upstreamPackSchemaVersion: typeof PHASE9_ASSURANCE_PACK_FACTORY_VERSION;
  readonly upstreamProjectionQuarantineSchemaVersion: typeof PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly producedObjects: readonly string[];
  readonly apiSurface: readonly string[];
  readonly telemetryIncident: SecurityIncident;
  readonly operatorIncident: SecurityIncident;
  readonly nearMissIncident: SecurityIncident;
  readonly firstClassNearMiss: NearMissReport;
  readonly linkedNearMiss: NearMissReport;
  readonly triagedIncident: SecurityIncident;
  readonly evidencePreservedIncident: SecurityIncident;
  readonly containmentBlockedBeforeEvidence: ContainmentAction;
  readonly containmentStart: ContainmentAction;
  readonly containmentReplay: ContainmentAction;
  readonly containmentComplete: ContainmentAction;
  readonly blockedFactsAssessment: ReportabilityAssessment;
  readonly pendingSubmissionAssessment: ReportabilityAssessment;
  readonly supersededAssessment: ReportabilityAssessment;
  readonly reportedAssessment: ReportabilityAssessment;
  readonly externalReportingHandoff: ExternalReportingHandoffRecord;
  readonly openReview: PostIncidentReview;
  readonly blockedClosureMissingReportability: PostIncidentReview;
  readonly blockedClosureIncompleteCapa: PostIncidentReview;
  readonly completedReview: PostIncidentReview;
  readonly capaPropagation: IncidentCAPAPropagationRecord;
  readonly completedCapaAction: CAPAAction;
  readonly assurancePackPropagation: IncidentAssurancePackPropagation;
  readonly drillFromIncident: TrainingDrillRecord;
  readonly drillFromNearMiss: TrainingDrillRecord;
  readonly incidentQueuePage: IncidentQueuePage;
  readonly closureExplanation: IncidentClosureExplanation;
  readonly disclosureFence: IncidentTelemetryDisclosureFence;
  readonly ledgerWriteback: IncidentWorkflowLedgerWriteback;
  readonly tenantDeniedErrorCode: string;
  readonly purposeDeniedErrorCode: string;
  readonly authorizationDeniedErrorCode: string;
  readonly replayHash: string;
}

export class Phase9IncidentReportabilityWorkflowError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9IncidentReportabilityWorkflowError";
    this.code = code;
  }
}

function incidentInvariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Phase9IncidentReportabilityWorkflowError(code, message);
  }
}

function sortedUnique(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function incidentHash(value: unknown, namespace = "phase9.447.incident-workflow"): string {
  return hashAssurancePayload(value, namespace);
}

function severityRank(severity: SecurityIncidentSeverity): number {
  return { sev1: 0, sev2: 1, sev3: 2, sev4: 3, near_miss: 4 }[severity];
}

function isHighRiskContainment(actionType: ContainmentActionType): boolean {
  return (
    actionType === "access_freeze" ||
    actionType === "producer_quarantine" ||
    actionType === "route_downgrade" ||
    actionType === "credential_rotation_task" ||
    actionType === "communication_hold"
  );
}

function isFinalReportabilityDecision(decision: ReportabilityDecision): boolean {
  return decision === "not_reportable" || decision === "reported";
}

function isTerminalCapaAction(action: CAPAAction): boolean {
  return (
    action.status === "completed" ||
    action.status === "rejected" ||
    action.status === "superseded" ||
    action.status === "cancelled"
  );
}

function hasIncidentRole(actor: IncidentWorkflowActorContext): boolean {
  return actor.roleRefs.some((role) =>
    ["incident_responder", "security_governance", "assurance_governance"].includes(role),
  );
}

function requireIncidentActor(actor: IncidentWorkflowActorContext, action: string): void {
  incidentInvariant(
    hasIncidentRole(actor),
    "INCIDENT_WORKFLOW_ROLE_DENIED",
    `${action} requires an incident or assurance governance role.`,
  );
  incidentInvariant(
    actor.purposeOfUseRef.startsWith("incident:") ||
      actor.purposeOfUseRef.startsWith("assurance:incident"),
    "INCIDENT_WORKFLOW_PURPOSE_DENIED",
    `${action} requires incident purpose-of-use.`,
  );
  incidentInvariant(
    actor.reasonRef.length > 0,
    "INCIDENT_WORKFLOW_REASON_REQUIRED",
    `${action} requires a reason.`,
  );
  incidentInvariant(
    actor.idempotencyKey.length > 0,
    "INCIDENT_WORKFLOW_IDEMPOTENCY_REQUIRED",
    `${action} requires an idempotency key.`,
  );
  incidentInvariant(
    actor.scopeTokenRef.includes(actor.tenantId),
    "INCIDENT_WORKFLOW_SCOPE_DENIED",
    `${action} requires a tenant-bound scope token.`,
  );
}

function requireNearMissActor(actor: IncidentWorkflowActorContext, action: string): void {
  incidentInvariant(
    hasIncidentRole(actor) || actor.roleRefs.includes("staff_reporter"),
    "INCIDENT_WORKFLOW_ROLE_DENIED",
    `${action} requires reporter or incident workflow role.`,
  );
  incidentInvariant(
    actor.purposeOfUseRef.startsWith("incident:"),
    "INCIDENT_WORKFLOW_PURPOSE_DENIED",
    `${action} requires incident purpose-of-use.`,
  );
  incidentInvariant(
    actor.scopeTokenRef.includes(actor.tenantId),
    "INCIDENT_WORKFLOW_SCOPE_DENIED",
    `${action} requires a tenant-bound scope token.`,
  );
}

function ensureIncidentTenant(
  actor: IncidentWorkflowActorContext,
  incident: SecurityIncident,
): void {
  incidentInvariant(
    actor.tenantId === incident.tenantId,
    "INCIDENT_WORKFLOW_TENANT_DENIED",
    "Incident tenant must match actor tenant.",
  );
}

function classifySeverity(input: {
  readonly affectedSubjectCount: number;
  readonly privilegedAccessSuspected: boolean;
  readonly patientSafetyImpactState: PatientSafetyImpactState;
  readonly dataProtectionImpactState: DataProtectionImpactState;
  readonly projectionQuarantined: boolean;
}): SecurityIncidentSeverity {
  if (
    input.patientSafetyImpactState === "confirmed" ||
    (input.dataProtectionImpactState === "confirmed" && input.affectedSubjectCount >= 500) ||
    input.privilegedAccessSuspected
  ) {
    return "sev1";
  }
  if (
    input.patientSafetyImpactState === "potential" ||
    input.dataProtectionImpactState === "confirmed" ||
    input.projectionQuarantined
  ) {
    return "sev2";
  }
  if (input.affectedSubjectCount > 0 || input.dataProtectionImpactState === "under_review") {
    return "sev3";
  }
  return "sev4";
}

export class Phase9IncidentReportabilityWorkflowService {
  private readonly incidents = new Map<string, SecurityIncident>();
  private readonly nearMisses = new Map<string, NearMissReport>();
  private readonly containmentActions = new Map<string, ContainmentAction>();
  private readonly containmentSemanticHashes = new Map<string, string>();
  private readonly capaPropagations = new Map<string, IncidentCAPAPropagationRecord>();
  private readonly trainingDrills = new Map<string, TrainingDrillRecord>();

  createNearMiss(input: {
    readonly actor: IncidentWorkflowActorContext;
    readonly reportedBy: string;
    readonly contextRef: string;
    readonly summaryRef: string;
    readonly confidentialityMode: IncidentConfidentialityMode;
    readonly evidenceRefs?: readonly string[];
    readonly linkedIncidentRef?: string;
  }): NearMissReport {
    requireNearMissActor(input.actor, "createNearMiss");
    const base = {
      tenantId: input.actor.tenantId,
      reportedBy: input.reportedBy,
      contextRef: input.contextRef,
      summaryRef: input.summaryRef,
      idempotencyKey: input.actor.idempotencyKey,
    };
    const id = `nmr_447_${incidentHash(base, "phase9.447.near-miss.id").slice(0, 16)}`;
    const auditRef = `audit:447:near-miss:${id}`;
    const withoutHash = {
      nearMissReportId: id,
      tenantId: input.actor.tenantId,
      reportedBy: input.reportedBy,
      contextRef: input.contextRef,
      summaryRef: input.summaryRef,
      confidentialityMode: input.confidentialityMode,
      investigationState: input.linkedIncidentRef
        ? ("linked_incident" as const)
        : ("reported" as const),
      linkedIncidentRef: input.linkedIncidentRef ?? "incident:not-converted",
      evidenceRefs: sortedUnique(input.evidenceRefs ?? []),
      capaRefs: [] as readonly string[],
      trainingDrillRefs: [] as readonly string[],
      workflowHandlingAuditRefs: [auditRef],
      reportedAt: input.actor.generatedAt,
      updatedAt: input.actor.generatedAt,
    };
    const nearMiss: NearMissReport = {
      ...withoutHash,
      nearMissHash: incidentHash(withoutHash, "phase9.447.near-miss.hash"),
    };
    this.nearMisses.set(nearMiss.nearMissReportId, nearMiss);
    return nearMiss;
  }

  createIncident(input: {
    readonly actor: IncidentWorkflowActorContext;
    readonly incidentType: SecurityIncidentType;
    readonly detectionSource: IncidentDetectionSource;
    readonly sourceRef: string;
    readonly detectedAt: string;
    readonly severity: SecurityIncidentSeverity;
    readonly impactScope: string;
    readonly ownerRef: string;
    readonly affectedSystemRefs?: readonly string[];
    readonly affectedDataRefs?: readonly string[];
    readonly patientSafetyImpactState?: PatientSafetyImpactState;
    readonly dataProtectionImpactState?: DataProtectionImpactState;
    readonly linkedNearMissRefs?: readonly string[];
    readonly auditInvestigationRefs?: readonly string[];
    readonly projectionQuarantineRefs?: readonly string[];
    readonly graphSnapshotRef: string;
    readonly graphHash: string;
  }): SecurityIncident {
    requireIncidentActor(input.actor, "createIncident");
    const incidentId = `si_447_${incidentHash(
      {
        tenantId: input.actor.tenantId,
        sourceRef: input.sourceRef,
        detectionSource: input.detectionSource,
        detectedAt: input.detectedAt,
        idempotencyKey: input.actor.idempotencyKey,
      },
      "phase9.447.security-incident.id",
    ).slice(0, 16)}`;
    const withoutHash = {
      securityIncidentId: incidentId,
      tenantId: input.actor.tenantId,
      incidentType: input.incidentType,
      detectionSource: input.detectionSource,
      sourceRef: input.sourceRef,
      detectedAt: input.detectedAt,
      severity: input.severity,
      impactScope: input.impactScope,
      status: "new" as const,
      reportabilityAssessmentRef: "reportability:pending",
      ownerRef: input.ownerRef,
      timelineRef: "timeline:pending",
      timelineHash: "timeline-hash:pending",
      timelineIntegrityState: "pending" as const,
      containmentActionRefs: [] as readonly string[],
      evidenceRefs: [] as readonly string[],
      preservedEvidenceRefs: [] as readonly string[],
      affectedSystemRefs: sortedUnique(input.affectedSystemRefs ?? []),
      affectedDataRefs: sortedUnique(input.affectedDataRefs ?? []),
      patientSafetyImpactState: input.patientSafetyImpactState ?? "none",
      dataProtectionImpactState: input.dataProtectionImpactState ?? "under_review",
      linkedNearMissRefs: sortedUnique(input.linkedNearMissRefs ?? []),
      auditInvestigationRefs: sortedUnique(input.auditInvestigationRefs ?? []),
      projectionQuarantineRefs: sortedUnique(input.projectionQuarantineRefs ?? []),
      capaRefs: [] as readonly string[],
      trainingDrillRefs: [] as readonly string[],
      graphSnapshotRef: input.graphSnapshotRef,
      graphHash: input.graphHash,
      createdAt: input.actor.generatedAt,
      updatedAt: input.actor.generatedAt,
    };
    const incident: SecurityIncident = {
      ...withoutHash,
      incidentHash: incidentHash(withoutHash, "phase9.447.security-incident.hash"),
    };
    this.incidents.set(incident.securityIncidentId, incident);
    return incident;
  }

  triageIncidentSeverity(input: {
    readonly actor: IncidentWorkflowActorContext;
    readonly incident: SecurityIncident;
    readonly affectedSubjectCount: number;
    readonly privilegedAccessSuspected: boolean;
    readonly projectionQuarantined?: boolean;
    readonly patientSafetyImpactState?: PatientSafetyImpactState;
    readonly dataProtectionImpactState?: DataProtectionImpactState;
    readonly escalationRef?: string;
  }): SecurityIncident {
    requireIncidentActor(input.actor, "triageIncidentSeverity");
    ensureIncidentTenant(input.actor, input.incident);
    const severity = classifySeverity({
      affectedSubjectCount: input.affectedSubjectCount,
      privilegedAccessSuspected: input.privilegedAccessSuspected,
      patientSafetyImpactState:
        input.patientSafetyImpactState ?? input.incident.patientSafetyImpactState,
      dataProtectionImpactState:
        input.dataProtectionImpactState ?? input.incident.dataProtectionImpactState,
      projectionQuarantined:
        input.projectionQuarantined ?? input.incident.projectionQuarantineRefs.length > 0,
    });
    const updatedBase = {
      ...input.incident,
      severity,
      status: "triaged" as const,
      patientSafetyImpactState:
        input.patientSafetyImpactState ?? input.incident.patientSafetyImpactState,
      dataProtectionImpactState:
        input.dataProtectionImpactState ?? input.incident.dataProtectionImpactState,
      auditInvestigationRefs: sortedUnique([
        ...input.incident.auditInvestigationRefs,
        input.escalationRef ?? `escalation:${severity}:${input.incident.securityIncidentId}`,
      ]),
      updatedAt: input.actor.generatedAt,
    };
    const updated: SecurityIncident = {
      ...updatedBase,
      incidentHash: incidentHash(updatedBase, "phase9.447.security-incident.hash"),
    };
    this.incidents.set(updated.securityIncidentId, updated);
    return updated;
  }

  attachEvidenceTimelineRefs(input: {
    readonly actor: IncidentWorkflowActorContext;
    readonly incident: SecurityIncident;
    readonly evidenceRefs: readonly string[];
    readonly preservedEvidenceRefs: readonly string[];
    readonly timelineRef: string;
    readonly timelineHash: string;
  }): SecurityIncident {
    requireIncidentActor(input.actor, "attachEvidenceTimelineRefs");
    ensureIncidentTenant(input.actor, input.incident);
    incidentInvariant(
      input.evidenceRefs.length > 0 && input.preservedEvidenceRefs.length > 0,
      "INCIDENT_EVIDENCE_PRESERVATION_REQUIRED",
      "Incident evidence and preservation refs are required before containment.",
    );
    const updatedBase = {
      ...input.incident,
      status: "investigating" as const,
      evidenceRefs: sortedUnique([...input.incident.evidenceRefs, ...input.evidenceRefs]),
      preservedEvidenceRefs: sortedUnique([
        ...input.incident.preservedEvidenceRefs,
        ...input.preservedEvidenceRefs,
      ]),
      timelineRef: input.timelineRef,
      timelineHash: input.timelineHash,
      timelineIntegrityState: "exact" as const,
      updatedAt: input.actor.generatedAt,
    };
    const updated: SecurityIncident = {
      ...updatedBase,
      incidentHash: incidentHash(updatedBase, "phase9.447.security-incident.hash"),
    };
    this.incidents.set(updated.securityIncidentId, updated);
    return updated;
  }

  startContainmentAction(input: {
    readonly actor: IncidentWorkflowActorContext;
    readonly incident: SecurityIncident;
    readonly actionType: ContainmentActionType;
    readonly evidenceRefs?: readonly string[];
  }): ContainmentAction {
    requireIncidentActor(input.actor, "startContainmentAction");
    ensureIncidentTenant(input.actor, input.incident);
    const semantic = {
      incidentRef: input.incident.securityIncidentId,
      actionType: input.actionType,
      tenantId: input.actor.tenantId,
      evidenceRefs: sortedUnique(input.evidenceRefs ?? input.incident.preservedEvidenceRefs),
    };
    const semanticHash = incidentHash(semantic, "phase9.447.containment.semantic");
    const idempotencyScope = `${input.actor.tenantId}:${input.actor.idempotencyKey}`;
    const previousSemanticHash = this.containmentSemanticHashes.get(idempotencyScope);
    const previousAction = this.containmentActions.get(idempotencyScope);
    if (previousSemanticHash === semanticHash && previousAction) {
      return { ...previousAction, idempotencyDecision: "exact_replay" };
    }
    const evidenceRefs = sortedUnique(input.evidenceRefs ?? input.incident.preservedEvidenceRefs);
    const evidencePreservedBeforeAction =
      input.incident.timelineIntegrityState === "exact" &&
      input.incident.preservedEvidenceRefs.length > 0;
    const blockerRefs =
      isHighRiskContainment(input.actionType) && !evidencePreservedBeforeAction
        ? ["containment:evidence-preservation-required"]
        : previousSemanticHash && previousSemanticHash !== semanticHash
          ? ["containment:idempotency-collision-review-required"]
          : [];
    const resultState: ContainmentResultState = blockerRefs.length > 0 ? "blocked" : "running";
    const actionSeed = {
      ...semantic,
      idempotencyKey: input.actor.idempotencyKey,
      resultState,
      blockerRefs,
    };
    const actionHash = incidentHash(actionSeed, "phase9.447.containment.id");
    const settlementHash = incidentHash(
      {
        actionSeed,
        commandSettlementRef: `command-settlement:447:${actionHash.slice(0, 12)}`,
      },
      "phase9.447.containment.settlement",
    );
    const action: ContainmentAction = {
      containmentActionId: `ca_447_${actionHash.slice(0, 16)}`,
      tenantId: input.actor.tenantId,
      incidentRef: input.incident.securityIncidentId,
      actionType: input.actionType,
      initiatedBy: input.actor.actorRef,
      initiatedAt: input.actor.generatedAt,
      resultState,
      idempotencyKey: input.actor.idempotencyKey,
      idempotencyDecision: previousSemanticHash ? "collision_review" : "accepted",
      commandActionRecordRef: `command-action:447:${actionHash.slice(0, 12)}`,
      commandSettlementRef: `command-settlement:447:${settlementHash.slice(0, 12)}`,
      auditRecordRef: `audit:447:containment:${actionHash.slice(0, 12)}`,
      purposeOfUseRef: input.actor.purposeOfUseRef,
      reasonRef: input.actor.reasonRef,
      evidencePreservedBeforeAction,
      evidenceRefs,
      blockerRefs: sortedUnique(blockerRefs),
      settlementHash,
    };
    if (!previousSemanticHash) {
      this.containmentSemanticHashes.set(idempotencyScope, semanticHash);
      this.containmentActions.set(idempotencyScope, action);
    }
    return action;
  }

  completeContainmentAction(input: {
    readonly actor: IncidentWorkflowActorContext;
    readonly incident: SecurityIncident;
    readonly action: ContainmentAction;
    readonly resultState: Extract<ContainmentResultState, "settled" | "failed" | "blocked">;
  }): ContainmentAction {
    requireIncidentActor(input.actor, "completeContainmentAction");
    ensureIncidentTenant(input.actor, input.incident);
    incidentInvariant(
      input.action.tenantId === input.actor.tenantId,
      "INCIDENT_WORKFLOW_TENANT_DENIED",
      "Containment tenant must match actor tenant.",
    );
    const completedBase = {
      ...input.action,
      resultState: input.resultState,
      completedAt: input.actor.generatedAt,
    };
    return {
      ...completedBase,
      settlementHash: incidentHash(completedBase, "phase9.447.containment.settlement"),
    };
  }

  runReportabilityAssessment(input: {
    readonly actor: IncidentWorkflowActorContext;
    readonly incident: SecurityIncident;
    readonly frameworkRef: string;
    readonly decision: ReportabilityDecision;
    readonly decisionRationaleRef: string;
    readonly supportingFactsRef: string;
    readonly timelineEvidenceRefs: readonly string[];
    readonly knownContainmentStatusRef: string;
    readonly reportedAt?: string;
    readonly supersedesAssessmentRef?: string;
  }): ReportabilityAssessment {
    requireIncidentActor(input.actor, "runReportabilityAssessment");
    ensureIncidentTenant(input.actor, input.incident);
    incidentInvariant(
      input.frameworkRef.includes(":"),
      "INCIDENT_REPORTABILITY_FRAMEWORK_REQUIRED",
      "Reportability assessment must use a versioned framework ref.",
    );
    const factsWithoutHash = {
      timelineEvidenceRefs: sortedUnique(input.timelineEvidenceRefs),
      affectedDataRefs: input.incident.affectedDataRefs,
      affectedSystemRefs: input.incident.affectedSystemRefs,
      patientSafetyImpactState: input.incident.patientSafetyImpactState,
      dataProtectionImpactState: input.incident.dataProtectionImpactState,
      confidentialityImpactState: input.incident.dataProtectionImpactState,
      knownContainmentStatusRef: input.knownContainmentStatusRef,
      decisionRationaleRef: input.decisionRationaleRef,
      graphSnapshotRef: input.incident.graphSnapshotRef,
      graphHash: input.incident.graphHash,
    };
    const supportingFacts: ReportabilitySupportingFacts = {
      ...factsWithoutHash,
      factsHash: incidentHash(factsWithoutHash, "phase9.447.reportability.facts"),
    };
    const base = {
      tenantId: input.actor.tenantId,
      incidentRef: input.incident.securityIncidentId,
      frameworkRef: input.frameworkRef,
      decision: input.decision,
      supportingFactsRef: input.supportingFactsRef,
      factsHash: supportingFacts.factsHash,
      supersedesAssessmentRef: input.supersedesAssessmentRef ?? "",
    };
    const assessmentId = `ra_447_${incidentHash(base, "phase9.447.reportability.id").slice(0, 16)}`;
    const assessmentWithoutHash = {
      assessmentId,
      tenantId: input.actor.tenantId,
      incidentRef: input.incident.securityIncidentId,
      frameworkRef: input.frameworkRef,
      decision: input.decision,
      supportingFactsRef: input.supportingFactsRef,
      reportedAt: input.reportedAt ?? "report:not-yet-submitted",
      assessedBy: input.actor.actorRef,
      assessedAt: input.actor.generatedAt,
      ...(input.supersedesAssessmentRef
        ? { supersedesAssessmentRef: input.supersedesAssessmentRef }
        : {}),
      supportingFacts,
    };
    return {
      ...assessmentWithoutHash,
      decisionHash: incidentHash(assessmentWithoutHash, "phase9.447.reportability.decision"),
    };
  }

  supersedeReportabilityAssessment(input: {
    readonly actor: IncidentWorkflowActorContext;
    readonly assessment: ReportabilityAssessment;
    readonly supersededByAssessmentRef: string;
  }): ReportabilityAssessment {
    requireIncidentActor(input.actor, "supersedeReportabilityAssessment");
    incidentInvariant(
      input.actor.tenantId === input.assessment.tenantId,
      "INCIDENT_WORKFLOW_TENANT_DENIED",
      "Reportability assessment tenant must match actor tenant.",
    );
    const supersededBase = {
      ...input.assessment,
      decision: "superseded" as const,
      supersededByAssessmentRef: input.supersededByAssessmentRef,
    };
    return {
      ...supersededBase,
      decisionHash: incidentHash(supersededBase, "phase9.447.reportability.decision"),
    };
  }

  recordExternalReportingHandoffState(input: {
    readonly actor: IncidentWorkflowActorContext;
    readonly assessment: ReportabilityAssessment;
    readonly routeRef: string;
    readonly handoffState: ExternalReportingHandoffState;
  }): ExternalReportingHandoffRecord {
    requireIncidentActor(input.actor, "recordExternalReportingHandoffState");
    incidentInvariant(
      input.actor.tenantId === input.assessment.tenantId,
      "INCIDENT_WORKFLOW_TENANT_DENIED",
      "Reportability handoff tenant must match actor tenant.",
    );
    const base = {
      tenantId: input.actor.tenantId,
      assessmentRef: input.assessment.assessmentId,
      incidentRef: input.assessment.incidentRef,
      routeRef: input.routeRef,
      handoffState: input.handoffState,
      recordedAt: input.actor.generatedAt,
    };
    const handoffHash = incidentHash(base, "phase9.447.external-reporting-handoff");
    return {
      externalReportingHandoffId: `erh_447_${handoffHash.slice(0, 16)}`,
      tenantId: input.actor.tenantId,
      assessmentRef: input.assessment.assessmentId,
      incidentRef: input.assessment.incidentRef,
      routeRef: input.routeRef,
      handoffState: input.handoffState,
      recordedBy: input.actor.actorRef,
      recordedAt: input.actor.generatedAt,
      handoffHash,
    };
  }

  openPostIncidentReview(input: {
    readonly actor: IncidentWorkflowActorContext;
    readonly incident: SecurityIncident;
    readonly rootCauseRef: string;
    readonly lessonsLearnedRef: string;
    readonly ownerRef: string;
    readonly reportabilityAssessmentRef: string;
    readonly capaRefs?: readonly string[];
  }): PostIncidentReview {
    requireIncidentActor(input.actor, "openPostIncidentReview");
    ensureIncidentTenant(input.actor, input.incident);
    const base = {
      tenantId: input.actor.tenantId,
      incidentRef: input.incident.securityIncidentId,
      rootCauseRef: input.rootCauseRef,
      lessonsLearnedRef: input.lessonsLearnedRef,
      ownerRef: input.ownerRef,
      reportabilityAssessmentRef: input.reportabilityAssessmentRef,
      capaRefs: sortedUnique(input.capaRefs ?? []),
      openedAt: input.actor.generatedAt,
    };
    const reviewHash = incidentHash(base, "phase9.447.post-incident-review");
    return {
      reviewId: `pir_447_${reviewHash.slice(0, 16)}`,
      tenantId: input.actor.tenantId,
      incidentRef: input.incident.securityIncidentId,
      rootCauseRef: input.rootCauseRef,
      capaRefs: sortedUnique(input.capaRefs ?? []),
      lessonsLearnedRef: input.lessonsLearnedRef,
      ownerRef: input.ownerRef,
      reportabilityAssessmentRef: input.reportabilityAssessmentRef,
      state: "open",
      requiredCapaOwnershipComplete: false,
      blockedReasonRefs: [],
      reviewHash,
      openedAt: input.actor.generatedAt,
    };
  }

  completePostIncidentReview(input: {
    readonly actor: IncidentWorkflowActorContext;
    readonly review: PostIncidentReview;
    readonly reportabilityAssessment?: ReportabilityAssessment;
    readonly capaActions: readonly CAPAAction[];
  }): PostIncidentReview {
    requireIncidentActor(input.actor, "completePostIncidentReview");
    incidentInvariant(
      input.actor.tenantId === input.review.tenantId,
      "INCIDENT_WORKFLOW_TENANT_DENIED",
      "Post-incident review tenant must match actor tenant.",
    );
    const blockerRefs: string[] = [];
    if (!input.reportabilityAssessment) {
      blockerRefs.push("reportability:assessment-missing");
    } else if (!isFinalReportabilityDecision(input.reportabilityAssessment.decision)) {
      blockerRefs.push(`reportability:${input.reportabilityAssessment.decision}`);
    }
    if (input.capaActions.length === 0) {
      blockerRefs.push("capa:ownership-missing");
    }
    for (const capa of input.capaActions) {
      if (!capa.ownerRef) {
        blockerRefs.push(`capa:owner-missing:${capa.capaActionId}`);
      }
      if (!isTerminalCapaAction(capa)) {
        blockerRefs.push(`capa:incomplete:${capa.capaActionId}`);
      }
    }
    const nextBase = {
      ...input.review,
      capaRefs: sortedUnique(input.capaActions.map((capa) => capa.capaActionId)),
      reportabilityAssessmentRef:
        input.reportabilityAssessment?.assessmentId ?? input.review.reportabilityAssessmentRef,
      state: blockerRefs.length === 0 ? ("completed" as const) : ("blocked" as const),
      requiredCapaOwnershipComplete: blockerRefs.every((ref) => !ref.startsWith("capa:")),
      blockedReasonRefs: sortedUnique(blockerRefs),
      ...(blockerRefs.length === 0 ? { completedAt: input.actor.generatedAt } : {}),
    };
    return {
      ...nextBase,
      reviewHash: incidentHash(nextBase, "phase9.447.post-incident-review"),
    };
  }

  createCapaFromIncident(input: {
    readonly actor: IncidentWorkflowActorContext;
    readonly incident: SecurityIncident;
    readonly rootCauseRef: string;
    readonly ownerRef: string;
    readonly targetDate: string;
    readonly evidenceGapRefs: readonly string[];
    readonly graphVerdict: AssuranceWorkflowGraphVerdictRef;
  }): IncidentCAPAPropagationRecord {
    requireIncidentActor(input.actor, "createCapaFromIncident");
    ensureIncidentTenant(input.actor, input.incident);
    const capaService = new Phase9CapaAttestationWorkflowService();
    const capaResult = capaService.createCapaAction({
      actor: {
        tenantId: input.actor.tenantId,
        actorRef: input.actor.actorRef,
        roleRefs: sortedUnique([...input.actor.roleRefs, "capa_owner"]),
        purposeOfUseRef: "assurance:capa:incident",
        generatedAt: input.actor.generatedAt,
      },
      sourceRef: input.incident.securityIncidentId,
      rootCauseRef: input.rootCauseRef,
      ownerRef: input.ownerRef,
      targetDate: input.targetDate,
      evidenceGapRefs: input.evidenceGapRefs,
      incidentRefs: [input.incident.securityIncidentId, ...input.incident.linkedNearMissRefs],
      controlRefs: ["control:incident-response:447", "control:reportability:447"],
      assuranceEvidenceGraphSnapshotRef: input.incident.graphSnapshotRef,
      assuranceGraphCompletenessVerdictRef: input.graphVerdict.verdictId,
      graphHash: input.graphVerdict.graphHash,
      idempotencyKey: input.actor.idempotencyKey,
    });
    const propagationBase = {
      incidentRef: input.incident.securityIncidentId,
      nearMissRefs: input.incident.linkedNearMissRefs,
      capaActionRef: capaResult.capaAction.capaActionId,
      evidenceGapRefs: input.evidenceGapRefs,
      graphHash: input.graphVerdict.graphHash,
    };
    const propagationHash = incidentHash(propagationBase, "phase9.447.incident-capa-propagation");
    const record: IncidentCAPAPropagationRecord = {
      incidentCapaPropagationRecordId: `icp_447_${propagationHash.slice(0, 16)}`,
      tenantId: input.actor.tenantId,
      incidentRef: input.incident.securityIncidentId,
      nearMissRefs: input.incident.linkedNearMissRefs,
      evidenceGapRefs: sortedUnique(input.evidenceGapRefs),
      assuranceEvidenceGraphSnapshotRef: input.incident.graphSnapshotRef,
      graphHash: input.graphVerdict.graphHash,
      capaAction: capaResult.capaAction,
      propagationHash,
    };
    this.capaPropagations.set(record.incidentCapaPropagationRecordId, record);
    return record;
  }

  listCapaFromIncident(input: {
    readonly tenantId: string;
    readonly incidentRef: string;
    readonly records: readonly IncidentCAPAPropagationRecord[];
  }): readonly CAPAAction[] {
    return input.records
      .filter(
        (record) => record.tenantId === input.tenantId && record.incidentRef === input.incidentRef,
      )
      .map((record) => record.capaAction)
      .sort((left, right) => left.capaActionId.localeCompare(right.capaActionId));
  }

  propagateIncidentToAssurancePack(input: {
    readonly actor: IncidentWorkflowActorContext;
    readonly incident: SecurityIncident;
    readonly packResult: AssurancePackFactoryResult;
    readonly capaActions: readonly CAPAAction[];
  }): IncidentAssurancePackPropagation {
    requireIncidentActor(input.actor, "propagateIncidentToAssurancePack");
    ensureIncidentTenant(input.actor, input.incident);
    incidentInvariant(
      input.packResult.pack.tenantId === input.actor.tenantId,
      "INCIDENT_WORKFLOW_TENANT_DENIED",
      "Assurance pack tenant must match incident tenant.",
    );
    const graphEdgeRefs = sortedUnique([
      `aege_447_incident_${input.incident.securityIncidentId}`,
      ...input.capaActions.map((capa) => `aege_447_gap_drives_capa_${capa.capaActionId}`),
      `aege_447_pack_${input.packResult.monthlyPack.monthlyAssurancePackId}`,
    ]);
    const base = {
      incidentRef: input.incident.securityIncidentId,
      monthlyPackRef: input.packResult.monthlyPack.monthlyAssurancePackId,
      packVersionHash: input.packResult.pack.packVersionHash,
      capaRefs: input.capaActions.map((capa) => capa.capaActionId),
      graphEdgeRefs,
    };
    const propagationHash = incidentHash(base, "phase9.447.incident-pack-propagation");
    return {
      incidentAssurancePackPropagationId: `iapp_447_${propagationHash.slice(0, 16)}`,
      tenantId: input.actor.tenantId,
      incidentRef: input.incident.securityIncidentId,
      monthlyAssurancePackRef: input.packResult.monthlyPack.monthlyAssurancePackId,
      incidentRefs: sortedUnique([
        ...input.packResult.monthlyPack.incidentRefs,
        input.incident.securityIncidentId,
      ]),
      capaRefs: sortedUnique(input.capaActions.map((capa) => capa.capaActionId)),
      graphEdgeRefs,
      packVersionHash: input.packResult.pack.packVersionHash,
      packSignoffState: input.packResult.monthlyPack.signoffState,
      propagationHash,
      propagatedAt: input.actor.generatedAt,
    };
  }

  createTrainingDrill(input: {
    readonly actor: IncidentWorkflowActorContext;
    readonly sourceType: TrainingDrillSourceType;
    readonly sourceRef: string;
    readonly scenarioRef: string;
    readonly audienceRef: string;
    readonly runAt: string;
    readonly findingsRef: string;
    readonly followUpRefs?: readonly string[];
    readonly capaRefs?: readonly string[];
    readonly evidenceRefs?: readonly string[];
  }): TrainingDrillRecord {
    requireIncidentActor(input.actor, "createTrainingDrill");
    const base = {
      tenantId: input.actor.tenantId,
      sourceType: input.sourceType,
      sourceRef: input.sourceRef,
      scenarioRef: input.scenarioRef,
      audienceRef: input.audienceRef,
      runAt: input.runAt,
      findingsRef: input.findingsRef,
    };
    const drillHash = incidentHash(base, "phase9.447.training-drill");
    const drill: TrainingDrillRecord = {
      trainingDrillRecordId: `tdr_447_${drillHash.slice(0, 16)}`,
      tenantId: input.actor.tenantId,
      sourceType: input.sourceType,
      sourceRef: input.sourceRef,
      scenarioRef: input.scenarioRef,
      audienceRef: input.audienceRef,
      runAt: input.runAt,
      findingsRef: input.findingsRef,
      followUpRefs: sortedUnique(input.followUpRefs ?? []),
      capaRefs: sortedUnique(input.capaRefs ?? []),
      evidenceRefs: sortedUnique(input.evidenceRefs ?? []),
      drillHash,
    };
    this.trainingDrills.set(drill.trainingDrillRecordId, drill);
    return drill;
  }

  listTrainingDrills(input: {
    readonly tenantId: string;
    readonly sourceRef?: string;
    readonly drills: readonly TrainingDrillRecord[];
  }): readonly TrainingDrillRecord[] {
    return input.drills
      .filter(
        (drill) =>
          drill.tenantId === input.tenantId &&
          (!input.sourceRef || drill.sourceRef === input.sourceRef),
      )
      .sort((left, right) => left.trainingDrillRecordId.localeCompare(right.trainingDrillRecordId));
  }

  listIncidentQueue(input: {
    readonly filters: IncidentQueueFilters;
    readonly incidents: readonly SecurityIncident[];
    readonly cursor?: string;
    readonly limit?: number;
  }): IncidentQueuePage {
    const limit = input.limit ?? 25;
    const offset = input.cursor?.startsWith("cursor:")
      ? Number(input.cursor.slice("cursor:".length))
      : 0;
    const rows = input.incidents
      .filter((incident) => incident.tenantId === input.filters.tenantId)
      .filter((incident) => !input.filters.severity || incident.severity === input.filters.severity)
      .filter((incident) => !input.filters.status || incident.status === input.filters.status)
      .filter(
        (incident) =>
          !input.filters.detectionSource ||
          incident.detectionSource === input.filters.detectionSource,
      )
      .filter((incident) => !input.filters.ownerRef || incident.ownerRef === input.filters.ownerRef)
      .sort(
        (left, right) =>
          severityRank(left.severity) - severityRank(right.severity) ||
          left.detectedAt.localeCompare(right.detectedAt) ||
          left.securityIncidentId.localeCompare(right.securityIncidentId),
      );
    const pageRows = rows.slice(offset, offset + limit);
    const nextOffset = offset + pageRows.length;
    return {
      rows: pageRows,
      nextCursor: nextOffset < rows.length ? `cursor:${nextOffset}` : undefined,
    };
  }

  explainBlockedClosure(input: {
    readonly incident: SecurityIncident;
    readonly reportabilityAssessment?: ReportabilityAssessment;
    readonly capaActions: readonly CAPAAction[];
  }): IncidentClosureExplanation {
    const blockerRefs: string[] = [];
    if (!input.reportabilityAssessment) {
      blockerRefs.push("reportability:assessment-missing");
    } else if (!isFinalReportabilityDecision(input.reportabilityAssessment.decision)) {
      blockerRefs.push(`reportability:${input.reportabilityAssessment.decision}`);
    }
    if (input.capaActions.length === 0) {
      blockerRefs.push("capa:ownership-missing");
    }
    blockerRefs.push(
      ...input.capaActions
        .filter((capa) => !isTerminalCapaAction(capa))
        .map((capa) => `capa:incomplete:${capa.capaActionId}`),
    );
    return {
      incidentRef: input.incident.securityIncidentId,
      blocked: blockerRefs.length > 0,
      blockerRefs: sortedUnique(blockerRefs),
      nextSafeActions: blockerRefs.map((blocker) =>
        blocker.startsWith("reportability") ? "complete_reportability_assessment" : "complete_capa",
      ),
    };
  }

  redactIncidentTelemetry(input: {
    readonly incident: SecurityIncident;
    readonly rawTelemetryPayload: Record<string, string>;
    readonly summaryRef: string;
    readonly permittedDisclosureClass: IncidentDisclosureClass;
    readonly recordedAt: string;
  }): IncidentTelemetryDisclosureFence {
    const protectedFields = [
      "incidentSummary",
      "patientIdentifier",
      "routeParams",
      "artifactFragment",
      "investigationKey",
    ];
    const safeTelemetryPayload = Object.fromEntries(
      Object.entries(input.rawTelemetryPayload).map(([key, value]) => [
        key,
        protectedFields.includes(key)
          ? `[redacted:${incidentHash(value, "phase9.447.redacted").slice(0, 12)}]`
          : value,
      ]),
    );
    const base = {
      incidentRef: input.incident.securityIncidentId,
      permittedDisclosureClass: input.permittedDisclosureClass,
      safeTelemetryPayload,
      summaryHash: incidentHash(input.summaryRef, "phase9.447.summary-ref"),
    };
    const fenceHash = incidentHash(base, "phase9.447.telemetry-disclosure-fence");
    return {
      disclosureFenceId: `utdf_447_${fenceHash.slice(0, 16)}`,
      tenantId: input.incident.tenantId,
      sourceRef: input.incident.securityIncidentId,
      permittedDisclosureClass: input.permittedDisclosureClass,
      redactedFields: protectedFields,
      safeTelemetryPayload,
      summaryHash: base.summaryHash,
      fenceHash,
      recordedAt: input.recordedAt,
    };
  }

  writeIncidentLedgerEvidence(input: {
    readonly actor: IncidentWorkflowActorContext;
    readonly incident: SecurityIncident;
    readonly reportabilityAssessment: ReportabilityAssessment;
    readonly containmentActions: readonly ContainmentAction[];
    readonly capaActions: readonly CAPAAction[];
    readonly trainingDrills: readonly TrainingDrillRecord[];
    readonly packPropagation: IncidentAssurancePackPropagation;
    readonly disclosureFence: IncidentTelemetryDisclosureFence;
    readonly previousHash?: string;
  }): IncidentWorkflowLedgerWriteback {
    requireIncidentActor(input.actor, "writeIncidentLedgerEvidence");
    ensureIncidentTenant(input.actor, input.incident);
    const graphEdgeRefs = sortedUnique([
      `aege_447_incident_opens_gap_${input.incident.securityIncidentId}`,
      ...input.capaActions.map((capa) => `aege_447_gap_drives_capa_${capa.capaActionId}`),
      ...input.packPropagation.graphEdgeRefs,
      ...input.trainingDrills.map((drill) => `aege_447_training_${drill.trainingDrillRecordId}`),
    ]);
    const canonicalPayload = {
      incidentRef: input.incident.securityIncidentId,
      reportabilityAssessmentRef: input.reportabilityAssessment.assessmentId,
      reportabilityDecision: input.reportabilityAssessment.decision,
      containmentRefs: input.containmentActions.map((action) => action.containmentActionId),
      capaRefs: input.capaActions.map((capa) => capa.capaActionId),
      trainingDrillRefs: input.trainingDrills.map((drill) => drill.trainingDrillRecordId),
      packPropagationRef: input.packPropagation.incidentAssurancePackPropagationId,
      disclosureFenceRef: input.disclosureFence.disclosureFenceId,
      graphHash: input.incident.graphHash,
    };
    const ledgerEntry = buildAssuranceLedgerEntry({
      assuranceLedgerEntryId: `ale_447_${incidentHash(
        canonicalPayload,
        "phase9.447.ledger.id",
      ).slice(0, 16)}`,
      sourceEventRef: `event:incident-workflow:${input.incident.securityIncidentId}`,
      entryType: "evidence_materialization",
      tenantId: input.actor.tenantId,
      producerRef: PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION,
      namespaceRef: "analytics_assurance.incident_workflow",
      schemaVersionRef: PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION,
      normalizationVersionRef: "normalization:447:incident-writeback:v1",
      sourceSequenceRef: `seq:${input.incident.securityIncidentId}`,
      sourceBoundedContextRef: "analytics_assurance",
      governingBoundedContextRef: "assurance_and_governance",
      requiredContextBoundaryRefs: [
        "phase9:assurance-ledger",
        "phase9:incident-workflow",
        "phase9:reportability",
        "phase9:capa",
      ],
      edgeCorrelationId: input.incident.securityIncidentId,
      auditRecordRef: input.reportabilityAssessment.decisionHash,
      telemetryDisclosureFenceRef: input.disclosureFence.disclosureFenceId,
      causalTokenRef: input.actor.idempotencyKey,
      replayDecisionClass: "exact_replay",
      effectKeyRef: `incident-workflow:${input.incident.securityIncidentId}`,
      controlRefs: [
        "control:incident-response:447",
        "control:reportability:447",
        "control:capa-follow-up:447",
      ],
      evidenceRefs: sortedUnique([
        input.incident.securityIncidentId,
        input.reportabilityAssessment.assessmentId,
        ...input.containmentActions.map((action) => action.containmentActionId),
        ...input.capaActions.map((capa) => capa.capaActionId),
        ...input.trainingDrills.map((drill) => drill.trainingDrillRecordId),
        input.packPropagation.incidentAssurancePackPropagationId,
      ]),
      graphEdgeRefs,
      previousHash: input.previousHash ?? GENESIS_ASSURANCE_LEDGER_HASH,
      createdAt: input.actor.generatedAt,
      canonicalPayload,
      inputSetValues: [
        input.incident.incidentHash,
        input.reportabilityAssessment.decisionHash,
        input.containmentActions.map((action) => action.settlementHash),
        input.capaActions.map((capa) => capa.versionHash),
        input.trainingDrills.map((drill) => drill.drillHash),
        input.packPropagation.propagationHash,
      ],
    });
    const base = {
      incidentRef: input.incident.securityIncidentId,
      ledgerHash: ledgerEntry.hash,
      graphEdgeRefs,
      graphHash: input.incident.graphHash,
    };
    const writebackHash = incidentHash(base, "phase9.447.ledger-writeback");
    return {
      writebackId: `ilw_447_${writebackHash.slice(0, 16)}`,
      tenantId: input.actor.tenantId,
      incidentRef: input.incident.securityIncidentId,
      reportabilityAssessmentRef: input.reportabilityAssessment.assessmentId,
      assuranceLedgerEntry: ledgerEntry,
      graphEdgeRefs,
      evidenceGraphSnapshotRef: input.incident.graphSnapshotRef,
      graphHash: input.incident.graphHash,
      writebackHash,
      writtenAt: input.actor.generatedAt,
    };
  }
}

function completeCapaActionForFixture(capa: CAPAAction, completedAt: string): CAPAAction {
  const completedBase = {
    ...capa,
    status: "completed" as const,
    updatedAt: completedAt,
    closedAt: completedAt,
  };
  return {
    ...completedBase,
    versionHash: incidentHash(completedBase, "phase9.447.completed-capa.fixture"),
  };
}

export function createPhase9IncidentReportabilityWorkflowFixture(): Phase9IncidentReportabilityWorkflowFixture {
  const generatedAt = "2026-04-27T12:00:00.000Z";
  const service = new Phase9IncidentReportabilityWorkflowService();
  const timelineFixture = createPhase9InvestigationTimelineFixture();
  const packFixture = createPhase9AssurancePackFactoryFixture();
  const projectionFixture = createPhase9ProjectionRebuildQuarantineFixture();
  const packResult = packFixture.baselineResult;
  const graphVerdict: AssuranceWorkflowGraphVerdictRef = {
    verdictId: packResult.pack.graphVerdictRef,
    state: "complete",
    graphHash: packResult.pack.graphHash,
    decisionHash: packResult.pack.graphVerdictDecisionHash,
    reasonCodes: [],
    trustBlockingRefs: [],
  };
  const actor: IncidentWorkflowActorContext = {
    tenantId: packResult.pack.tenantId,
    actorRef: "actor:incident-responder-447",
    roleRefs: ["incident_responder", "security_governance"],
    purposeOfUseRef: "incident:response",
    reasonRef: "reason:incident-response-447",
    idempotencyKey: "idem:447:incident-base",
    scopeTokenRef: `scope-token:${packResult.pack.tenantId}:incident`,
    generatedAt,
  };
  const reporter: IncidentWorkflowActorContext = {
    ...actor,
    actorRef: "actor:staff-reporter-447",
    roleRefs: ["staff_reporter"],
    purposeOfUseRef: "incident:near_miss",
    idempotencyKey: "idem:447:near-miss-first-class",
  };
  const firstClassNearMiss = service.createNearMiss({
    actor: reporter,
    reportedBy: reporter.actorRef,
    contextRef: "support-ticket:447:near-miss-context",
    summaryRef: "summary-ref:447:near-miss-confidential",
    confidentialityMode: "confidential",
    evidenceRefs: ["evidence:447:near-miss-observation"],
  });
  const linkedNearMiss = service.createNearMiss({
    actor: { ...reporter, idempotencyKey: "idem:447:near-miss-linked" },
    reportedBy: reporter.actorRef,
    contextRef: "support-ticket:447:near-miss-linked-context",
    summaryRef: "summary-ref:447:near-miss-linked",
    confidentialityMode: "standard",
    evidenceRefs: ["evidence:447:near-miss-linked"],
  });
  const telemetryIncident = service.createIncident({
    actor: { ...actor, idempotencyKey: "idem:447:incident-telemetry" },
    incidentType: "privacy",
    detectionSource: "telemetry",
    sourceRef: "telemetry:447:bulk-export-anomaly",
    detectedAt: "2026-04-27T08:30:00.000Z",
    severity: "sev3",
    impactScope: "scope:tenant-demo:patient-communications",
    ownerRef: actor.actorRef,
    affectedSystemRefs: ["system:patient-web", "system:secure-messaging"],
    affectedDataRefs: ["data:patient-contact-route", "data:message-summary"],
    patientSafetyImpactState: "potential",
    dataProtectionImpactState: "under_review",
    graphSnapshotRef: packResult.pack.graphSnapshotRef,
    graphHash: packResult.pack.graphHash,
  });
  const operatorIncident = service.createIncident({
    actor: { ...actor, idempotencyKey: "idem:447:incident-operator" },
    incidentType: "availability",
    detectionSource: "operator_report",
    sourceRef: "operator-report:447:route-downgrade",
    detectedAt: "2026-04-27T08:35:00.000Z",
    severity: "sev2",
    impactScope: "scope:tenant-demo:ops-routing",
    ownerRef: actor.actorRef,
    affectedSystemRefs: ["system:ops-console"],
    affectedDataRefs: ["data:ops-route-state"],
    patientSafetyImpactState: "none",
    dataProtectionImpactState: "none",
    graphSnapshotRef: packResult.pack.graphSnapshotRef,
    graphHash: packResult.pack.graphHash,
  });
  const nearMissIncident = service.createIncident({
    actor: { ...actor, idempotencyKey: "idem:447:incident-near-miss" },
    incidentType: "security",
    detectionSource: "near_miss",
    sourceRef: linkedNearMiss.nearMissReportId,
    detectedAt: "2026-04-27T08:40:00.000Z",
    severity: "sev4",
    impactScope: "scope:tenant-demo:support-access",
    ownerRef: actor.actorRef,
    affectedSystemRefs: ["system:support-desk"],
    affectedDataRefs: ["data:support-summary"],
    linkedNearMissRefs: [linkedNearMiss.nearMissReportId],
    patientSafetyImpactState: "none",
    dataProtectionImpactState: "under_review",
    graphSnapshotRef: packResult.pack.graphSnapshotRef,
    graphHash: packResult.pack.graphHash,
  });
  const triagedIncident = service.triageIncidentSeverity({
    actor: { ...actor, idempotencyKey: "idem:447:triage" },
    incident: telemetryIncident,
    affectedSubjectCount: 1200,
    privilegedAccessSuspected: true,
    patientSafetyImpactState: "potential",
    dataProtectionImpactState: "confirmed",
    escalationRef: "escalation:447:senior-review",
  });
  const timelineRef =
    timelineFixture.baselineResult.timelineReconstruction.investigationTimelineReconstructionId;
  const evidencePreservedIncident = service.attachEvidenceTimelineRefs({
    actor: { ...actor, idempotencyKey: "idem:447:evidence" },
    incident: triagedIncident,
    evidenceRefs: [
      "evidence:447:telemetry-snapshot",
      timelineRef,
      projectionFixture.quarantineLedgerWriteback.assuranceLedgerEntry.assuranceLedgerEntryId,
    ],
    preservedEvidenceRefs: [
      "preserved-evidence:447:worm-audit-cut",
      "preserved-evidence:447:graph-cut",
    ],
    timelineRef,
    timelineHash: timelineFixture.baselineResult.timelineReconstruction.timelineHash,
  });
  const containmentBlockedBeforeEvidence = service.startContainmentAction({
    actor: { ...actor, idempotencyKey: "idem:447:containment-blocked" },
    incident: operatorIncident,
    actionType: "access_freeze",
  });
  const containmentStart = service.startContainmentAction({
    actor: { ...actor, idempotencyKey: "idem:447:containment-access-freeze" },
    incident: evidencePreservedIncident,
    actionType: "access_freeze",
  });
  const containmentReplay = service.startContainmentAction({
    actor: { ...actor, idempotencyKey: "idem:447:containment-access-freeze" },
    incident: evidencePreservedIncident,
    actionType: "access_freeze",
  });
  const containmentComplete = service.completeContainmentAction({
    actor: { ...actor, idempotencyKey: "idem:447:containment-complete" },
    incident: evidencePreservedIncident,
    action: containmentStart,
    resultState: "settled",
  });
  const blockedFactsAssessment = service.runReportabilityAssessment({
    actor: { ...actor, idempotencyKey: "idem:447:reportability-blocked" },
    incident: evidencePreservedIncident,
    frameworkRef: "DSPT:incident-reporting:2026-03",
    decision: "insufficient_facts_blocked",
    supportingFactsRef: "supporting-facts:447:blocked",
    decisionRationaleRef: "rationale:447:awaiting-containment-confirmation",
    timelineEvidenceRefs: [timelineRef],
    knownContainmentStatusRef: containmentStart.containmentActionId,
  });
  const pendingSubmissionAssessment = service.runReportabilityAssessment({
    actor: { ...actor, idempotencyKey: "idem:447:reportability-pending" },
    incident: evidencePreservedIncident,
    frameworkRef: "DSPT:incident-reporting:2026-03",
    decision: "reportable_pending_submission",
    supportingFactsRef: "supporting-facts:447:pending-submission",
    decisionRationaleRef: "rationale:447:data-protection-confirmed",
    timelineEvidenceRefs: [timelineRef, containmentComplete.containmentActionId],
    knownContainmentStatusRef: containmentComplete.containmentActionId,
    supersedesAssessmentRef: blockedFactsAssessment.assessmentId,
  });
  const reportedAssessment = service.runReportabilityAssessment({
    actor: { ...actor, idempotencyKey: "idem:447:reportability-reported" },
    incident: evidencePreservedIncident,
    frameworkRef: "DSPT:incident-reporting:2026-03",
    decision: "reported",
    supportingFactsRef: "supporting-facts:447:reported",
    decisionRationaleRef: "rationale:447:submitted-through-dspt-route",
    timelineEvidenceRefs: [timelineRef, containmentComplete.containmentActionId],
    knownContainmentStatusRef: containmentComplete.containmentActionId,
    reportedAt: "2026-04-27T12:15:00.000Z",
    supersedesAssessmentRef: pendingSubmissionAssessment.assessmentId,
  });
  const supersededAssessment = service.supersedeReportabilityAssessment({
    actor: { ...actor, idempotencyKey: "idem:447:reportability-supersede" },
    assessment: pendingSubmissionAssessment,
    supersededByAssessmentRef: reportedAssessment.assessmentId,
  });
  const externalReportingHandoff = service.recordExternalReportingHandoffState({
    actor: { ...actor, idempotencyKey: "idem:447:reporting-handoff" },
    assessment: reportedAssessment,
    routeRef: "external-reporting-route:dspt:2026",
    handoffState: "acknowledged",
  });
  const openReview = service.openPostIncidentReview({
    actor: { ...actor, idempotencyKey: "idem:447:review-open" },
    incident: evidencePreservedIncident,
    rootCauseRef: "root-cause:447:bulk-export-policy-gap",
    lessonsLearnedRef: "lessons:447:export-guardrail",
    ownerRef: "actor:incident-review-owner-447",
    reportabilityAssessmentRef: reportedAssessment.assessmentId,
  });
  const blockedClosureMissingReportability = service.completePostIncidentReview({
    actor: { ...actor, idempotencyKey: "idem:447:review-block-reportability" },
    review: openReview,
    reportabilityAssessment: blockedFactsAssessment,
    capaActions: [],
  });
  const capaPropagation = service.createCapaFromIncident({
    actor: { ...actor, idempotencyKey: "idem:447:capa-from-incident" },
    incident: evidencePreservedIncident,
    rootCauseRef: "root-cause:447:bulk-export-policy-gap",
    ownerRef: "actor:capa-owner-447",
    targetDate: "2026-05-06T17:00:00.000Z",
    evidenceGapRefs: ["gap:incident-follow-up:447", "gap:export-policy-guardrail:447"],
    graphVerdict,
  });
  const blockedClosureIncompleteCapa = service.completePostIncidentReview({
    actor: { ...actor, idempotencyKey: "idem:447:review-block-capa" },
    review: openReview,
    reportabilityAssessment: reportedAssessment,
    capaActions: [capaPropagation.capaAction],
  });
  const completedCapaAction = completeCapaActionForFixture(
    capaPropagation.capaAction,
    "2026-04-27T12:30:00.000Z",
  );
  const completedReview = service.completePostIncidentReview({
    actor: { ...actor, idempotencyKey: "idem:447:review-complete" },
    review: openReview,
    reportabilityAssessment: reportedAssessment,
    capaActions: [completedCapaAction],
  });
  const assurancePackPropagation = service.propagateIncidentToAssurancePack({
    actor: { ...actor, idempotencyKey: "idem:447:pack-propagation" },
    incident: evidencePreservedIncident,
    packResult,
    capaActions: [completedCapaAction],
  });
  const drillFromIncident = service.createTrainingDrill({
    actor: { ...actor, idempotencyKey: "idem:447:drill-incident" },
    sourceType: "incident",
    sourceRef: evidencePreservedIncident.securityIncidentId,
    scenarioRef: "scenario:447:reportable-data-incident",
    audienceRef: "audience:security-and-support",
    runAt: "2026-05-10T10:00:00.000Z",
    findingsRef: "findings:447:incident-drill",
    followUpRefs: [completedCapaAction.capaActionId],
    capaRefs: [completedCapaAction.capaActionId],
    evidenceRefs: [reportedAssessment.assessmentId],
  });
  const drillFromNearMiss = service.createTrainingDrill({
    actor: { ...actor, idempotencyKey: "idem:447:drill-near-miss" },
    sourceType: "near_miss",
    sourceRef: firstClassNearMiss.nearMissReportId,
    scenarioRef: "scenario:447:near-miss-reporting",
    audienceRef: "audience:all-staff",
    runAt: "2026-05-12T10:00:00.000Z",
    findingsRef: "findings:447:near-miss-drill",
    followUpRefs: ["follow-up:447:near-miss-guidance"],
    evidenceRefs: [firstClassNearMiss.nearMissReportId],
  });
  const incidentWithClosureRefs: SecurityIncident = {
    ...evidencePreservedIncident,
    status: "post_incident_review",
    reportabilityAssessmentRef: reportedAssessment.assessmentId,
    containmentActionRefs: [containmentComplete.containmentActionId],
    capaRefs: [completedCapaAction.capaActionId],
    trainingDrillRefs: [drillFromIncident.trainingDrillRecordId],
    updatedAt: generatedAt,
    incidentHash: incidentHash(
      {
        ...evidencePreservedIncident,
        status: "post_incident_review",
        reportabilityAssessmentRef: reportedAssessment.assessmentId,
        containmentActionRefs: [containmentComplete.containmentActionId],
        capaRefs: [completedCapaAction.capaActionId],
        trainingDrillRefs: [drillFromIncident.trainingDrillRecordId],
        updatedAt: generatedAt,
      },
      "phase9.447.security-incident.hash",
    ),
  };
  const incidentQueuePage = service.listIncidentQueue({
    filters: { tenantId: actor.tenantId },
    incidents: [incidentWithClosureRefs, operatorIncident, nearMissIncident],
    limit: 2,
  });
  const closureExplanation = service.explainBlockedClosure({
    incident: incidentWithClosureRefs,
    reportabilityAssessment: pendingSubmissionAssessment,
    capaActions: [capaPropagation.capaAction],
  });
  const disclosureFence = service.redactIncidentTelemetry({
    incident: incidentWithClosureRefs,
    summaryRef: "Patient Alice was exposed through /patients/nhs-447 route",
    rawTelemetryPayload: {
      incidentSummary: "Patient Alice was exposed through /patients/nhs-447 route",
      patientIdentifier: "nhs-447",
      routeParams: "/patients/nhs-447/incidents/si",
      artifactFragment: "raw-export-fragment",
      metricCode: "incident.queue.created",
    },
    permittedDisclosureClass: "metadata_only",
    recordedAt: generatedAt,
  });
  const ledgerWriteback = service.writeIncidentLedgerEvidence({
    actor: { ...actor, idempotencyKey: "idem:447:ledger-writeback" },
    incident: incidentWithClosureRefs,
    reportabilityAssessment: reportedAssessment,
    containmentActions: [containmentComplete],
    capaActions: [completedCapaAction],
    trainingDrills: [drillFromIncident, drillFromNearMiss],
    packPropagation: assurancePackPropagation,
    disclosureFence,
  });
  let tenantDeniedErrorCode = "";
  try {
    service.attachEvidenceTimelineRefs({
      actor: {
        ...actor,
        tenantId: "tenant:other",
        scopeTokenRef: "scope-token:tenant:other:incident",
        idempotencyKey: "idem:447:tenant-denied",
      },
      incident: telemetryIncident,
      evidenceRefs: ["evidence:tenant-denied"],
      preservedEvidenceRefs: ["preserved:tenant-denied"],
      timelineRef,
      timelineHash: timelineFixture.baselineResult.timelineReconstruction.timelineHash,
    });
  } catch (error) {
    tenantDeniedErrorCode =
      error instanceof Phase9IncidentReportabilityWorkflowError ? error.code : "UNKNOWN";
  }
  let purposeDeniedErrorCode = "";
  try {
    service.createIncident({
      actor: {
        ...actor,
        purposeOfUseRef: "support:look",
        idempotencyKey: "idem:447:purpose-denied",
      },
      incidentType: "security",
      detectionSource: "audit_investigation",
      sourceRef: "audit:447:purpose-denied",
      detectedAt: generatedAt,
      severity: "sev4",
      impactScope: "scope:tenant-demo:denied",
      ownerRef: actor.actorRef,
      graphSnapshotRef: packResult.pack.graphSnapshotRef,
      graphHash: packResult.pack.graphHash,
    });
  } catch (error) {
    purposeDeniedErrorCode =
      error instanceof Phase9IncidentReportabilityWorkflowError ? error.code : "UNKNOWN";
  }
  let authorizationDeniedErrorCode = "";
  try {
    service.startContainmentAction({
      actor: {
        ...actor,
        roleRefs: [],
        idempotencyKey: "idem:447:auth-denied",
      },
      incident: evidencePreservedIncident,
      actionType: "producer_quarantine",
    });
  } catch (error) {
    authorizationDeniedErrorCode =
      error instanceof Phase9IncidentReportabilityWorkflowError ? error.code : "UNKNOWN";
  }
  return {
    schemaVersion: PHASE9_INCIDENT_REPORTABILITY_WORKFLOW_VERSION,
    generatedAt,
    upstreamTimelineSchemaVersion: PHASE9_INVESTIGATION_TIMELINE_SERVICE_VERSION,
    upstreamCapaSchemaVersion: PHASE9_CAPA_ATTESTATION_WORKFLOW_VERSION,
    upstreamPackSchemaVersion: PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
    upstreamProjectionQuarantineSchemaVersion: PHASE9_PROJECTION_REBUILD_QUARANTINE_VERSION,
    sourceAlgorithmRefs: [
      "blueprint/phase-9-the-assurance-ledger.md#9G",
      "blueprint/phase-9-the-assurance-ledger.md#9C",
      "blueprint/phase-9-the-assurance-ledger.md#9D",
      "blueprint/phase-9-the-assurance-ledger.md#9A",
      "blueprint/staff-operations-and-support-blueprint.md#support-replay",
      "data/contracts/439_phase9_investigation_timeline_service_contract.json",
      "data/contracts/441_phase9_capa_attestation_workflow_contract.json",
      "data/contracts/446_phase9_projection_rebuild_quarantine_contract.json",
    ],
    producedObjects: [
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
    ],
    apiSurface: [
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
    ],
    telemetryIncident,
    operatorIncident,
    nearMissIncident,
    firstClassNearMiss,
    linkedNearMiss,
    triagedIncident,
    evidencePreservedIncident,
    containmentBlockedBeforeEvidence,
    containmentStart,
    containmentReplay,
    containmentComplete,
    blockedFactsAssessment,
    pendingSubmissionAssessment,
    supersededAssessment,
    reportedAssessment,
    externalReportingHandoff,
    openReview,
    blockedClosureMissingReportability,
    blockedClosureIncompleteCapa,
    completedReview,
    capaPropagation,
    completedCapaAction,
    assurancePackPropagation,
    drillFromIncident,
    drillFromNearMiss,
    incidentQueuePage,
    closureExplanation,
    disclosureFence,
    ledgerWriteback,
    tenantDeniedErrorCode,
    purposeDeniedErrorCode,
    authorizationDeniedErrorCode,
    replayHash: orderedSetHash(
      [
        telemetryIncident.incidentHash,
        operatorIncident.incidentHash,
        nearMissIncident.incidentHash,
        firstClassNearMiss.nearMissHash,
        reportedAssessment.decisionHash,
        containmentComplete.settlementHash,
        completedCapaAction.versionHash,
        assurancePackPropagation.propagationHash,
        drillFromIncident.drillHash,
        drillFromNearMiss.drillHash,
        ledgerWriteback.assuranceLedgerEntry.hash,
      ],
      "phase9.447.fixture.replay",
    ),
  };
}

export function phase9IncidentReportabilityWorkflowSummary(
  fixture: Phase9IncidentReportabilityWorkflowFixture = createPhase9IncidentReportabilityWorkflowFixture(),
): string {
  return [
    "# 447 Phase 9 Incident Reportability Workflow",
    "",
    `Schema version: ${fixture.schemaVersion}`,
    `Generated at: ${fixture.generatedAt}`,
    `Telemetry incident: ${fixture.telemetryIncident.securityIncidentId}`,
    `Near miss retained as first-class report: ${fixture.firstClassNearMiss.nearMissReportId}`,
    `Reportability decision: ${fixture.reportedAssessment.decision}`,
    `CAPA action: ${fixture.completedCapaAction.capaActionId}`,
    `Ledger writeback hash: ${fixture.ledgerWriteback.assuranceLedgerEntry.hash}`,
    `Replay hash: ${fixture.replayHash}`,
    "",
    "## Workflow Contract",
    "",
    "- Incidents can originate from telemetry, operator report, near miss, audit, break-glass, projection quarantine, assurance gap, external notification, or supplier alert sources.",
    "- Near misses remain first-class records and can feed CAPA or training without forced incident conversion.",
    "- Evidence and deterministic timeline refs are preserved before high-risk containment actions settle.",
    "- Reportability decisions carry versioned framework refs, graph-pinned supporting facts, supersession, and external handoff state.",
    "- Post-incident review cannot close while reportability or CAPA ownership is incomplete.",
    "- Incident outcomes propagate to CAPA, assurance packs, training drills, redacted telemetry fences, the assurance ledger, and graph edge refs.",
    "",
  ].join("\n");
}

export function phase9IncidentQueueMatrixCsv(
  fixture: Phase9IncidentReportabilityWorkflowFixture = createPhase9IncidentReportabilityWorkflowFixture(),
): string {
  const rows = [
    ["case", "ref", "state", "blocker"],
    [
      "telemetry_incident",
      fixture.telemetryIncident.securityIncidentId,
      fixture.telemetryIncident.status,
      "",
    ],
    [
      "operator_incident",
      fixture.operatorIncident.securityIncidentId,
      fixture.operatorIncident.status,
      "",
    ],
    [
      "near_miss_incident",
      fixture.nearMissIncident.securityIncidentId,
      fixture.nearMissIncident.detectionSource,
      "",
    ],
    [
      "first_class_near_miss",
      fixture.firstClassNearMiss.nearMissReportId,
      fixture.firstClassNearMiss.investigationState,
      "",
    ],
    [
      "blocked_containment_before_evidence",
      fixture.containmentBlockedBeforeEvidence.containmentActionId,
      fixture.containmentBlockedBeforeEvidence.resultState,
      fixture.containmentBlockedBeforeEvidence.blockerRefs.join("|"),
    ],
    [
      "blocked_review_reportability",
      fixture.blockedClosureMissingReportability.reviewId,
      fixture.blockedClosureMissingReportability.state,
      fixture.blockedClosureMissingReportability.blockedReasonRefs.join("|"),
    ],
    [
      "blocked_review_capa",
      fixture.blockedClosureIncompleteCapa.reviewId,
      fixture.blockedClosureIncompleteCapa.state,
      fixture.blockedClosureIncompleteCapa.blockedReasonRefs.join("|"),
    ],
    ["completed_review", fixture.completedReview.reviewId, fixture.completedReview.state, ""],
  ];
  return `${rows.map((row) => row.join(",")).join("\n")}\n`;
}

export function phase9ReportabilityAndCapaRegisterCsv(
  fixture: Phase9IncidentReportabilityWorkflowFixture = createPhase9IncidentReportabilityWorkflowFixture(),
): string {
  const rows = [
    ["incidentRef", "assessmentRef", "decision", "handoffState", "capaRef", "packPropagationRef"],
    [
      fixture.evidencePreservedIncident.securityIncidentId,
      fixture.reportedAssessment.assessmentId,
      fixture.reportedAssessment.decision,
      fixture.externalReportingHandoff.handoffState,
      fixture.completedCapaAction.capaActionId,
      fixture.assurancePackPropagation.incidentAssurancePackPropagationId,
    ],
  ];
  return `${rows.map((row) => row.join(",")).join("\n")}\n`;
}
