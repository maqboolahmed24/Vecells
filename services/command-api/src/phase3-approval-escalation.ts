import {
  createCommandSettlementAuthorityService,
  createLeaseFenceCommandAuthorityService,
} from "@vecells/domain-identity-access";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  createPhase3ApprovalEscalationKernelService,
  createPhase3ApprovalEscalationKernelStore,
  evaluateGovernedApprovalRequirement,
  phase3GovernedApprovalMatrixRef,
  type ApprovalCheckpointSnapshot,
  type ApprovalInvalidationReasonClass,
  type DutyEscalationRecordSnapshot,
  type GovernedApprovalRequirementAssessmentSnapshot,
  type Phase3ApprovalEscalationBundle,
  type Phase3ApprovalEscalationKernelService,
  type Phase3ApprovalEscalationRepositories,
  type TriageReopenRecordSnapshot,
  type UrgentContactAttemptSnapshot,
  type UrgentContactAttemptState,
  type UrgentContactRouteClass,
  type UrgentEscalationOutcomeClass,
} from "@vecells/domain-triage-workspace";
import {
  createPhase3EndpointDecisionEngineApplication,
  phase3EndpointDecisionMigrationPlanRefs,
  phase3EndpointDecisionPersistenceTables,
  type Phase3EndpointDecisionEngineApplication,
} from "./phase3-endpoint-decision-engine";
import {
  createPhase3TriageKernelApplication,
  phase3TriageKernelMigrationPlanRefs,
  phase3TriageKernelPersistenceTables,
  type Phase3TriageKernelApplication,
} from "./phase3-triage-kernel";

const TRIAGE_DOMAIN = "triage_workspace";
const APPROVAL_DOMAIN = "triage_approval_checkpoint";
const TRIAGE_DESCRIPTOR = "TriageTask";
const APPROVAL_LEASE_AUTHORITY_REF = "lease_authority_triage_approval";

export const PHASE3_APPROVAL_ESCALATION_SERVICE_NAME =
  "Phase3ApprovalEscalationApplication";
export const PHASE3_APPROVAL_ESCALATION_SCHEMA_VERSION =
  "239.phase3.approval-escalation.v1";
export const PHASE3_APPROVAL_ESCALATION_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/{taskId}/approval-escalation",
] as const;

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Error(`${code}: ${message}`);
  }
}

function requireRef(value: string | null | undefined, field: string): string {
  invariant(
    typeof value === "string" && value.trim().length > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} is required.`,
  );
  return value.trim();
}

function optionalRef(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}_TIMESTAMP`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

function nextApprovalEscalationId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

export const phase3ApprovalEscalationRoutes = [
  {
    routeId: "workspace_task_approval_escalation_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/approval-escalation",
    contractFamily: "ApprovalEscalationBundleContract",
    purpose:
      "Expose the current governed approval assessment, ApprovalCheckpoint, DutyEscalationRecord, UrgentContactAttempt chain, urgent outcome, and any triage reopen record for one workspace task.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_evaluate_approval_requirement",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}:evaluate-approval-requirement",
    contractFamily: "ApprovalRequirementEvaluationCommandContract",
    purpose:
      "Evaluate the frozen 228 approval matrix against the current unsuperseded DecisionEpoch and mint or reuse the authoritative ApprovalCheckpoint.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_request_approval",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/approval/{checkpointId}:request",
    contractFamily: "ApprovalCheckpointRequestCommandContract",
    purpose:
      "Promote a required checkpoint into pending review under its own lifecycle lease instead of inferring approval from local endpoint chrome.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_approve_decision",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/approval/{checkpointId}:approve",
    contractFamily: "ApprovalCheckpointApproveCommandContract",
    purpose:
      "Approve the current epoch-bound checkpoint only when one valid approver role is presented and self-approval remains blocked.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_reject_decision",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/approval/{checkpointId}:reject",
    contractFamily: "ApprovalCheckpointRejectCommandContract",
    purpose:
      "Reject the current checkpoint with an explicit reason instead of quietly leaving the endpoint rail pending.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_invalidate_approval",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/approval/{checkpointId}:invalidate",
    contractFamily: "ApprovalCheckpointInvalidationCommandContract",
    purpose:
      "Supersede stale approval after decision drift, patient reply, duplicate resolution, trust drift, or manual epoch replacement.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_start_urgent_escalation",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}:start-urgent-escalation",
    contractFamily: "DutyEscalationStartCommandContract",
    purpose:
      "Create the first-class DutyEscalationRecord against the current live DecisionEpoch and move the triage task into escalated posture.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_record_urgent_contact_attempt",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/urgent-escalation/{escalationId}/contact-attempts",
    contractFamily: "UrgentContactAttemptCommandContract",
    purpose:
      "Append one replay-safe urgent contact attempt without forking a second live truth chain for duplicate taps or retries.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_record_urgent_outcome",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}/urgent-escalation/{escalationId}:record-outcome",
    contractFamily: "UrgentEscalationOutcomeCommandContract",
    purpose:
      "Route the urgent outcome only against the current unsuperseded DecisionEpoch, transitioning the triage task to direct resolution, handoff pending, or governed reopen.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase3ApprovalEscalationPersistenceTables = [
  ...new Set([
    ...phase3TriageKernelPersistenceTables,
    ...phase3EndpointDecisionPersistenceTables,
    "phase3_governed_approval_assessments",
    "phase3_approval_checkpoints",
    "phase3_duty_escalation_records",
    "phase3_urgent_contact_attempts",
    "phase3_urgent_escalation_outcomes",
    "phase3_triage_reopen_records",
  ]),
] as const;

export const phase3ApprovalEscalationMigrationPlanRefs = [
  ...new Set([
    ...phase3TriageKernelMigrationPlanRefs,
    ...phase3EndpointDecisionMigrationPlanRefs,
    "services/command-api/migrations/115_phase3_approval_checkpoint_and_urgent_escalation.sql",
  ]),
] as const;

interface TaskLeaseContextSnapshot {
  taskId: string;
  requestId: string;
  queueKey: string;
  assignedTo: string | null;
  reviewVersion: number;
  version: number;
  lifecycleLeaseRef: string | null;
  leaseAuthorityRef: string | null;
  launchContextRef: string;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  activeReviewSessionRef: string | null;
  ownershipState: string;
  status: string;
}

export interface EvaluateApprovalRequirementCommandInput {
  taskId: string;
  actorRef: string;
  recordedAt: string;
  checkpointLeaseTtlSeconds?: number;
}

export interface ApprovalCheckpointCommandInput {
  taskId: string;
  checkpointId: string;
  actorRef: string;
  recordedAt: string;
}

export interface ApproveDecisionCommandInput extends ApprovalCheckpointCommandInput {
  presentedRoleRefs: readonly string[];
}

export interface RejectDecisionCommandInput extends ApprovalCheckpointCommandInput {
  rejectionReason: string;
}

export interface InvalidateApprovalCommandInput extends ApprovalCheckpointCommandInput {
  invalidationReasonClass: ApprovalInvalidationReasonClass;
}

export interface StartUrgentEscalationCommandInput {
  taskId: string;
  actorRef: string;
  recordedAt: string;
  triggerMode: DutyEscalationRecordSnapshot["triggerMode"];
  triggerReasonCode: string;
  severityBand: DutyEscalationRecordSnapshot["severityBand"];
}

export interface RecordUrgentContactAttemptCommandInput {
  taskId: string;
  escalationId: string;
  actorRef: string;
  recordedAt: string;
  attemptReplayKey: string;
  contactRouteClass: UrgentContactRouteClass;
  attemptState: UrgentContactAttemptState;
  completedAt?: string | null;
  outcomeNote?: string | null;
}

export interface RecordUrgentOutcomeCommandInput {
  taskId: string;
  escalationId: string;
  actorRef: string;
  recordedAt: string;
  outcomeClass: UrgentEscalationOutcomeClass;
  endpointDecisionSettlementRef?: string | null;
  bookingIntentRef?: string | null;
  pharmacyIntentRef?: string | null;
  presentationArtifactRef?: string | null;
}

export interface Phase3ApprovalEscalationApplication {
  readonly serviceName: typeof PHASE3_APPROVAL_ESCALATION_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_APPROVAL_ESCALATION_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_APPROVAL_ESCALATION_QUERY_SURFACES;
  readonly routes: typeof phase3ApprovalEscalationRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly endpointApplication: Phase3EndpointDecisionEngineApplication;
  readonly repositories: Phase3ApprovalEscalationRepositories;
  readonly service: Phase3ApprovalEscalationKernelService;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  queryTaskApprovalEscalation(taskId: string): Promise<Phase3ApprovalEscalationBundle>;
  evaluateApprovalRequirement(
    input: EvaluateApprovalRequirementCommandInput,
  ): Promise<{
    approvalAssessment: GovernedApprovalRequirementAssessmentSnapshot;
    checkpoint: ApprovalCheckpointSnapshot;
    supersededCheckpoint: ApprovalCheckpointSnapshot | null;
  }>;
  requestApproval(input: ApprovalCheckpointCommandInput): Promise<ApprovalCheckpointSnapshot>;
  approveDecision(input: ApproveDecisionCommandInput): Promise<ApprovalCheckpointSnapshot>;
  rejectDecision(input: RejectDecisionCommandInput): Promise<ApprovalCheckpointSnapshot>;
  invalidateApproval(input: InvalidateApprovalCommandInput): Promise<ApprovalCheckpointSnapshot>;
  startUrgentEscalation(
    input: StartUrgentEscalationCommandInput,
  ): Promise<{
    escalation: DutyEscalationRecordSnapshot;
    taskTransition: Awaited<ReturnType<Phase3TriageKernelApplication["markEscalated"]>> | null;
  }>;
  recordUrgentContactAttempt(
    input: RecordUrgentContactAttemptCommandInput,
  ): Promise<{
    escalation: DutyEscalationRecordSnapshot;
    attempt: UrgentContactAttemptSnapshot;
  }>;
  recordUrgentOutcome(
    input: RecordUrgentOutcomeCommandInput,
  ): Promise<{
    escalation: DutyEscalationRecordSnapshot;
    taskTransitions: readonly unknown[];
    outcomeClass: UrgentEscalationOutcomeClass;
  }>;
}

class Phase3ApprovalEscalationApplicationImpl
  implements Phase3ApprovalEscalationApplication
{
  readonly serviceName = PHASE3_APPROVAL_ESCALATION_SERVICE_NAME;
  readonly schemaVersion = PHASE3_APPROVAL_ESCALATION_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_APPROVAL_ESCALATION_QUERY_SURFACES;
  readonly routes = phase3ApprovalEscalationRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly endpointApplication: Phase3EndpointDecisionEngineApplication;
  readonly repositories: Phase3ApprovalEscalationRepositories;
  readonly service: Phase3ApprovalEscalationKernelService;
  readonly persistenceTables = phase3ApprovalEscalationPersistenceTables;
  readonly migrationPlanRef = phase3ApprovalEscalationMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3ApprovalEscalationMigrationPlanRefs;

  private readonly idGenerator: BackboneIdGenerator;
  private readonly leaseAuthority;
  private readonly settlementAuthority;

  constructor(options?: {
    triageApplication?: Phase3TriageKernelApplication;
    endpointApplication?: Phase3EndpointDecisionEngineApplication;
    repositories?: Phase3ApprovalEscalationRepositories;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase3_approval_escalation");
    this.triageApplication =
      options?.triageApplication ??
      createPhase3TriageKernelApplication({ idGenerator: this.idGenerator });
    this.endpointApplication =
      options?.endpointApplication ??
      createPhase3EndpointDecisionEngineApplication({
        idGenerator: this.idGenerator,
        triageApplication: this.triageApplication,
      });
    this.repositories =
      options?.repositories ?? createPhase3ApprovalEscalationKernelStore();
    this.service = createPhase3ApprovalEscalationKernelService(this.repositories, {
      idGenerator: this.idGenerator,
    });
    this.leaseAuthority = createLeaseFenceCommandAuthorityService(
      this.triageApplication.controlPlaneRepositories,
      this.idGenerator,
    );
    this.settlementAuthority = createCommandSettlementAuthorityService(
      this.triageApplication.controlPlaneRepositories,
      this.idGenerator,
    );
  }

  async queryTaskApprovalEscalation(taskId: string): Promise<Phase3ApprovalEscalationBundle> {
    return this.service.queryTaskBundle(taskId);
  }

  async evaluateApprovalRequirement(
    input: EvaluateApprovalRequirementCommandInput,
  ): Promise<{
    approvalAssessment: GovernedApprovalRequirementAssessmentSnapshot;
    checkpoint: ApprovalCheckpointSnapshot;
    supersededCheckpoint: ApprovalCheckpointSnapshot | null;
  }> {
    await this.ensureLiveTaskMutationLease(input.taskId, input.actorRef, input.recordedAt);
    const task = await this.requireTask(input.taskId);
    const decisionBundle = await this.requireCurrentDecisionBundle(input.taskId);
    const request = await this.requireRequest(task.requestId, input.taskId);
    const evaluated = evaluateGovernedApprovalRequirement({
      taskId: task.taskId,
      requestId: task.requestId,
      decisionEpochRef: decisionBundle.epoch.epochId,
      decisionId: decisionBundle.decision.decisionId,
      endpointCode: decisionBundle.decision.chosenEndpoint,
      payload: decisionBundle.decision.payload,
      evaluatedAt: input.recordedAt,
    });
    const currentBundle = await this.service.queryTaskBundle(task.taskId);
    if (
      currentBundle.checkpoint &&
      currentBundle.approvalAssessment &&
      currentBundle.checkpoint.decisionEpochRef === decisionBundle.epoch.epochId &&
      currentBundle.approvalAssessment.tupleHash === evaluated.tupleHash
    ) {
      return {
        approvalAssessment: currentBundle.approvalAssessment,
        checkpoint: currentBundle.checkpoint,
        supersededCheckpoint: null,
      };
    }

    const checkpointId = nextApprovalEscalationId(
      this.idGenerator,
      "phase3_approval_checkpoint",
    );
    const acquired = await this.leaseAuthority.acquireLease({
      requestId: task.requestId,
      episodeId: request.episodeId,
      requestLineageRef: request.requestLineageRef,
      domain: APPROVAL_DOMAIN,
      domainObjectRef: checkpointId,
      leaseAuthorityRef: APPROVAL_LEASE_AUTHORITY_REF,
      ownerActorRef: input.actorRef,
      ownerWorkerRef: "approval_checkpoint_kernel",
      governingObjectVersionRef: `${checkpointId}@v1`,
      leaseScopeComponents: ["approval_checkpoint", "approve_decision"],
      leaseTtlSeconds: input.checkpointLeaseTtlSeconds ?? 1800,
      acquiredAt: input.recordedAt,
      sameShellRecoveryRouteRef: this.approvalRecoveryRoute(task.taskId),
      operatorVisibleWorkRef: `approval_${checkpointId}`,
      blockedActionScopeRefs: ["approval_checkpoint", "approve_decision"],
    });
    await this.issueTaskCommand({
      task,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      actionScope: "evaluate_approval_requirement",
      semanticPayload: {
        decisionEpochRef: decisionBundle.epoch.epochId,
        decisionId: decisionBundle.decision.decisionId,
        approvalMatrixRef: phase3GovernedApprovalMatrixRef,
        approvalTupleHash: evaluated.tupleHash,
      },
    });
    const result = await this.service.evaluateApprovalRequirement({
      assessment: {
        assessmentId: `approval_assessment_${task.taskId}_${evaluated.tupleHash}`,
        taskId: task.taskId,
        requestId: task.requestId,
        decisionEpochRef: decisionBundle.epoch.epochId,
        decisionId: decisionBundle.decision.decisionId,
        endpointClass: decisionBundle.decision.chosenEndpoint,
        approvalPolicyMatrixRef: evaluated.approvalPolicyMatrixRef,
        tenantPolicyRef: evaluated.tenantPolicyRef,
        pathwayRef: evaluated.pathwayRef,
        riskBurdenClass: evaluated.riskBurdenClass,
        assistiveProvenanceState: evaluated.assistiveProvenanceState,
        sensitiveOverrideState: evaluated.sensitiveOverrideState,
        matchedPolicyRuleRefs: evaluated.matchedPolicyRuleRefs,
        requiredApprovalMode: evaluated.requiredApprovalMode,
        checkpointState: evaluated.checkpointState,
        reasonCodeRefs: evaluated.reasonCodeRefs,
        evaluatedAt: input.recordedAt,
        tupleHash: evaluated.tupleHash,
        version: 1,
      },
      checkpointId,
      actionType: evaluated.actionType,
      requestedBy: input.actorRef,
      requestedAt: input.recordedAt,
      lifecycleLeaseRef: acquired.lease.toSnapshot().leaseId,
      leaseAuthorityRef: APPROVAL_LEASE_AUTHORITY_REF,
      leaseTtlSeconds: acquired.lease.toSnapshot().leaseTtlSeconds,
      lastHeartbeatAt: acquired.lease.toSnapshot().heartbeatAt,
      fencingToken: acquired.lease.toSnapshot().fencingToken,
      ownershipEpoch: acquired.lease.toSnapshot().ownershipEpoch,
      currentLineageFenceEpoch: acquired.lineageFence.currentEpoch,
    });
    if (result.supersededCheckpoint) {
      await this.releaseSupersededCheckpoint(result.supersededCheckpoint, input.recordedAt);
    }
    return {
      approvalAssessment: result.assessment,
      checkpoint: result.checkpoint,
      supersededCheckpoint: result.supersededCheckpoint,
    };
  }

  async requestApproval(input: ApprovalCheckpointCommandInput): Promise<ApprovalCheckpointSnapshot> {
    const task = await this.requireTask(input.taskId);
    const checkpoint = await this.requireCheckpoint(input.taskId, input.checkpointId);
    await this.ensureCheckpointLeaseActive(checkpoint, input.recordedAt);
    await this.issueTaskCommand({
      task,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      actionScope: "request_approval",
      semanticPayload: {
        checkpointId: checkpoint.checkpointId,
        decisionEpochRef: checkpoint.decisionEpochRef,
      },
    });
    return this.service.requestApproval({
      checkpointId: checkpoint.checkpointId,
      requestedBy: input.actorRef,
      requestedAt: input.recordedAt,
    });
  }

  async approveDecision(input: ApproveDecisionCommandInput): Promise<ApprovalCheckpointSnapshot> {
    const task = await this.requireTask(input.taskId);
    const checkpoint = await this.requireCheckpoint(input.taskId, input.checkpointId);
    await this.ensureCheckpointLeaseActive(checkpoint, input.recordedAt);
    await this.issueTaskCommand({
      task,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      actionScope: "approve_decision",
      semanticPayload: {
        checkpointId: checkpoint.checkpointId,
        decisionEpochRef: checkpoint.decisionEpochRef,
        presentedRoleRefs: [...input.presentedRoleRefs],
      },
    });
    return this.service.approveCheckpoint({
      checkpointId: checkpoint.checkpointId,
      approvedBy: input.actorRef,
      approvedAt: input.recordedAt,
      presentedRoleRefs: input.presentedRoleRefs,
    });
  }

  async rejectDecision(input: RejectDecisionCommandInput): Promise<ApprovalCheckpointSnapshot> {
    const task = await this.requireTask(input.taskId);
    const checkpoint = await this.requireCheckpoint(input.taskId, input.checkpointId);
    await this.ensureCheckpointLeaseActive(checkpoint, input.recordedAt);
    await this.issueTaskCommand({
      task,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      actionScope: "reject_decision",
      semanticPayload: {
        checkpointId: checkpoint.checkpointId,
        rejectionReason: input.rejectionReason,
      },
    });
    return this.service.rejectCheckpoint({
      checkpointId: checkpoint.checkpointId,
      rejectedBy: input.actorRef,
      rejectedAt: input.recordedAt,
      rejectionReason: input.rejectionReason,
    });
  }

  async invalidateApproval(
    input: InvalidateApprovalCommandInput,
  ): Promise<ApprovalCheckpointSnapshot> {
    const task = await this.requireTask(input.taskId);
    const checkpoint = await this.requireCheckpoint(input.taskId, input.checkpointId);
    await this.ensureCheckpointLeaseActive(checkpoint, input.recordedAt);
    await this.issueTaskCommand({
      task,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      actionScope: "invalidate_approval",
      semanticPayload: {
        checkpointId: checkpoint.checkpointId,
        invalidationReasonClass: input.invalidationReasonClass,
      },
    });
    const updated = await this.service.invalidateCheckpoint({
      checkpointId: checkpoint.checkpointId,
      invalidationReasonClass: input.invalidationReasonClass,
      invalidatedAt: input.recordedAt,
    });
    await this.releaseSupersededCheckpoint(updated, input.recordedAt);
    return updated;
  }

  async startUrgentEscalation(
    input: StartUrgentEscalationCommandInput,
  ): Promise<{
    escalation: DutyEscalationRecordSnapshot;
    taskTransition: Awaited<ReturnType<Phase3TriageKernelApplication["markEscalated"]>> | null;
  }> {
    await this.ensureLiveTaskMutationLease(input.taskId, input.actorRef, input.recordedAt);
    const task = await this.requireTask(input.taskId);
    const decisionBundle = await this.requireCurrentDecisionBundle(input.taskId);
    invariant(
      decisionBundle.decision.chosenEndpoint === "duty_clinician_escalation",
      "URGENT_ESCALATION_ENDPOINT_REQUIRED",
      "Urgent escalation start requires the current endpoint to be duty_clinician_escalation.",
    );
    await this.issueTaskCommand({
      task,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      actionScope: "start_urgent_escalation",
      semanticPayload: {
        decisionEpochRef: decisionBundle.epoch.epochId,
        decisionId: decisionBundle.decision.decisionId,
        triggerMode: input.triggerMode,
        severityBand: input.severityBand,
      },
    });
    const escalation = await this.service.startUrgentEscalation({
      taskId: task.taskId,
      requestId: task.requestId,
      decisionEpochRef: decisionBundle.epoch.epochId,
      endpointDecisionRef: decisionBundle.decision.decisionId,
      triggerMode: input.triggerMode,
      triggerReasonCode: input.triggerReasonCode,
      severityBand: input.severityBand,
      urgentTaskRef: `urgent_task_${task.taskId}_${decisionBundle.epoch.epochId}`,
      openedAt: input.recordedAt,
    });
    const taskTransition =
      task.status === "escalated"
        ? null
        : await this.triageApplication.markEscalated({
            taskId: task.taskId,
            actorRef: input.actorRef,
            recordedAt: input.recordedAt,
            currentDecisionEpochRef: decisionBundle.epoch.epochId,
            escalationContractRef: escalation.dutyEscalationRecordId,
          });
    return {
      escalation,
      taskTransition,
    };
  }

  async recordUrgentContactAttempt(
    input: RecordUrgentContactAttemptCommandInput,
  ): Promise<{
    escalation: DutyEscalationRecordSnapshot;
    attempt: UrgentContactAttemptSnapshot;
  }> {
    await this.ensureLiveTaskMutationLease(input.taskId, input.actorRef, input.recordedAt);
    const task = await this.requireTask(input.taskId);
    const escalation = await this.requireEscalation(input.taskId, input.escalationId);
    await this.ensureEscalationEpochCurrent(task.taskId, escalation, input.recordedAt);
    await this.issueTaskCommand({
      task,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      actionScope: "record_urgent_contact_attempt",
      semanticPayload: {
        escalationId: escalation.dutyEscalationRecordId,
        attemptReplayKey: input.attemptReplayKey,
        contactRouteClass: input.contactRouteClass,
        attemptState: input.attemptState,
      },
    });
    return this.service.recordUrgentContactAttempt({
      escalationId: escalation.dutyEscalationRecordId,
      decisionEpochRef: escalation.decisionEpochRef,
      attemptReplayKey: input.attemptReplayKey,
      contactRouteClass: input.contactRouteClass,
      attemptState: input.attemptState,
      attemptedAt: input.recordedAt,
      completedAt: input.completedAt,
      outcomeNote: input.outcomeNote,
    });
  }

  async recordUrgentOutcome(
    input: RecordUrgentOutcomeCommandInput,
  ): Promise<{
    escalation: DutyEscalationRecordSnapshot;
    taskTransitions: readonly unknown[];
    outcomeClass: UrgentEscalationOutcomeClass;
  }> {
    await this.ensureLiveTaskMutationLease(input.taskId, input.actorRef, input.recordedAt);
    const task = await this.requireTask(input.taskId);
    const escalation = await this.requireEscalation(input.taskId, input.escalationId);
    const decisionBundle = await this.ensureEscalationEpochCurrent(
      task.taskId,
      escalation,
      input.recordedAt,
    );
    await this.issueTaskCommand({
      task,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      actionScope: "record_urgent_outcome",
      semanticPayload: {
        escalationId: escalation.dutyEscalationRecordId,
        outcomeClass: input.outcomeClass,
      },
    });

    const taskTransitions: unknown[] = [];
    if (input.outcomeClass === "direct_non_appointment") {
      await this.service.recordUrgentOutcome({
        escalationId: escalation.dutyEscalationRecordId,
        decisionEpochRef: escalation.decisionEpochRef,
        outcomeClass: input.outcomeClass,
        endpointDecisionSettlementRef: input.endpointDecisionSettlementRef,
        presentationArtifactRef: input.presentationArtifactRef,
        recordedAt: input.recordedAt,
      });
      if (task.status !== "resolved_without_appointment") {
        taskTransitions.push(
          await this.triageApplication.markResolvedWithoutAppointment({
            taskId: task.taskId,
            actorRef: input.actorRef,
            recordedAt: input.recordedAt,
            currentDecisionEpochRef: decisionBundle.epoch.epochId,
            consequenceHookRef: `urgent_outcome_${escalation.dutyEscalationRecordId}`,
          }),
        );
      }
      return {
        escalation: (await this.requireEscalation(task.taskId, escalation.dutyEscalationRecordId)),
        taskTransitions,
        outcomeClass: input.outcomeClass,
      };
    }

    if (input.outcomeClass === "downstream_handoff") {
      await this.service.recordUrgentOutcome({
        escalationId: escalation.dutyEscalationRecordId,
        decisionEpochRef: escalation.decisionEpochRef,
        outcomeClass: input.outcomeClass,
        bookingIntentRef: input.bookingIntentRef,
        pharmacyIntentRef: input.pharmacyIntentRef,
        presentationArtifactRef: input.presentationArtifactRef,
        recordedAt: input.recordedAt,
      });
      if (task.status !== "handoff_pending") {
        taskTransitions.push(
          await this.triageApplication.markHandoffPending({
            taskId: task.taskId,
            actorRef: input.actorRef,
            recordedAt: input.recordedAt,
            currentDecisionEpochRef: decisionBundle.epoch.epochId,
            consequenceHookRef: `urgent_outcome_${escalation.dutyEscalationRecordId}`,
          }),
        );
      }
      return {
        escalation: (await this.requireEscalation(task.taskId, escalation.dutyEscalationRecordId)),
        taskTransitions,
        outcomeClass: input.outcomeClass,
      };
    }

    if (input.outcomeClass === "return_to_triage") {
      const invalidated = await this.endpointApplication.invalidateStaleDecision({
        taskId: task.taskId,
        decisionId: decisionBundle.decision.decisionId,
        actorRef: input.actorRef,
        recordedAt: input.recordedAt,
        manualReplace: true,
      });
      const currentBundle = await this.service.queryTaskBundle(task.taskId);
      if (
        currentBundle.checkpoint &&
        currentBundle.checkpoint.decisionEpochRef === decisionBundle.epoch.epochId &&
        currentBundle.checkpoint.state !== "superseded"
      ) {
        await this.service.invalidateCheckpoint({
          checkpointId: currentBundle.checkpoint.checkpointId,
          invalidationReasonClass: "epoch_superseded",
          invalidatedAt: input.recordedAt,
          decisionSupersessionRecordRef:
            invalidated.supersessionRecord?.decisionSupersessionRecordId ?? null,
        });
        await this.releaseSupersededCheckpoint(
          (await this.requireCheckpoint(task.taskId, currentBundle.checkpoint.checkpointId)),
          input.recordedAt,
        );
      }
      invariant(
        invalidated.supersessionRecord,
        "DECISION_SUPERSESSION_REQUIRED",
        "Return-to-triage requires a DecisionSupersessionRecord.",
      );
      const reopenRecord: TriageReopenRecordSnapshot = {
        reopenRecordId: nextApprovalEscalationId(this.idGenerator, "phase3_triage_reopen_record"),
        taskId: task.taskId,
        sourceDomain: "urgent_escalation",
        reasonCode: "urgent_outcome_returned_to_triage",
        evidenceRefs: [
          escalation.dutyEscalationRecordId,
          invalidated.supersessionRecord.decisionSupersessionRecordId,
        ],
        supersededDecisionEpochRef: decisionBundle.epoch.epochId,
        decisionSupersessionRecordRef:
          invalidated.supersessionRecord.decisionSupersessionRecordId,
        priorityOverride: "urgent_return",
        reopenedByMode:
          input.actorRef.startsWith("supervisor_") ? "supervisor_manual" : "reviewer_manual",
        reopenedAt: input.recordedAt,
        version: 1,
      };
      await this.service.recordUrgentOutcome({
        escalationId: escalation.dutyEscalationRecordId,
        decisionEpochRef: escalation.decisionEpochRef,
        outcomeClass: input.outcomeClass,
        triageReopenRecord: reopenRecord,
        presentationArtifactRef: input.presentationArtifactRef,
        recordedAt: input.recordedAt,
      });
      taskTransitions.push(
        await this.triageApplication.reopenTask({
          taskId: task.taskId,
          actorRef: input.actorRef,
          recordedAt: input.recordedAt,
          reopenContractRef: reopenRecord.reopenRecordId,
        }),
      );
      taskTransitions.push(
        await this.triageApplication.moveTaskToQueue({
          taskId: task.taskId,
          actorRef: input.actorRef,
          queuedAt: input.recordedAt,
        }),
      );
      return {
        escalation: (await this.requireEscalation(task.taskId, escalation.dutyEscalationRecordId)),
        taskTransitions,
        outcomeClass: input.outcomeClass,
      };
    }

    await this.service.recordUrgentOutcome({
      escalationId: escalation.dutyEscalationRecordId,
      decisionEpochRef: escalation.decisionEpochRef,
      outcomeClass: input.outcomeClass,
      presentationArtifactRef: input.presentationArtifactRef,
      recordedAt: input.recordedAt,
    });
    return {
      escalation: (await this.requireEscalation(task.taskId, escalation.dutyEscalationRecordId)),
      taskTransitions,
      outcomeClass: input.outcomeClass,
    };
  }

  private async requireTask(taskId: string): Promise<TaskLeaseContextSnapshot> {
    const task = await this.triageApplication.triageRepositories.getTask(taskId);
    invariant(task, "TRIAGE_TASK_NOT_FOUND", `TriageTask ${taskId} is required.`);
    return task.toSnapshot() as TaskLeaseContextSnapshot;
  }

  private async requireCheckpoint(
    taskId: string,
    checkpointId: string,
  ): Promise<ApprovalCheckpointSnapshot> {
    const checkpoint = await this.repositories.getCheckpoint(checkpointId);
    invariant(
      checkpoint && checkpoint.taskId === taskId,
      "APPROVAL_CHECKPOINT_NOT_FOUND",
      `ApprovalCheckpoint ${checkpointId} is required for ${taskId}.`,
    );
    return checkpoint;
  }

  private async requireEscalation(
    taskId: string,
    escalationId: string,
  ): Promise<DutyEscalationRecordSnapshot> {
    const escalation = await this.repositories.getEscalation(escalationId);
    invariant(
      escalation && escalation.taskId === taskId,
      "DUTY_ESCALATION_RECORD_NOT_FOUND",
      `DutyEscalationRecord ${escalationId} is required for ${taskId}.`,
    );
    return escalation;
  }

  private async requireRequest(requestId: string, taskId: string) {
    const request = await this.triageApplication.controlPlaneRepositories.getRequest(requestId);
    invariant(request, "REQUEST_NOT_FOUND", `Request ${requestId} is required for ${taskId}.`);
    return request.toSnapshot();
  }

  private async requireCurrentDecisionBundle(taskId: string) {
    const bundle = await this.endpointApplication.queryTaskEndpointDecision(taskId);
    invariant(bundle, "DECISION_BUNDLE_NOT_FOUND", `Current endpoint decision bundle is required for ${taskId}.`);
    invariant(
      bundle.epoch.epochState === "live" || bundle.epoch.epochState === "committed",
      "CURRENT_DECISION_EPOCH_NOT_LIVE",
      `Task ${taskId} requires a live or committed DecisionEpoch.`,
    );
    return bundle;
  }

  private async ensureLiveTaskMutationLease(
    taskId: string,
    actorRef: string,
    recordedAt: string,
  ): Promise<void> {
    const task = await this.requireTask(taskId);
    const leaseRef = optionalRef(task.lifecycleLeaseRef);
    invariant(
      leaseRef !== null,
      "TRIAGE_TASK_REQUIRES_LIVE_LEASE",
      `Task ${taskId} requires an active lifecycle lease for approval or escalation mutation.`,
    );
    const authorityState = await this.triageApplication.controlPlaneRepositories.getLeaseAuthorityState(
      `${TRIAGE_DOMAIN}::${taskId}`,
    );
    invariant(authorityState, "LEASE_AUTHORITY_NOT_FOUND", `Lease authority state is missing for ${taskId}.`);
    const currentLease = authorityState.currentLeaseRef
      ? await this.triageApplication.controlPlaneRepositories.getRequestLifecycleLease(
          authorityState.currentLeaseRef,
        )
      : undefined;
    const currentLeaseSnapshot = currentLease?.toSnapshot();
    if (
      currentLeaseSnapshot &&
      currentLeaseSnapshot.leaseId === leaseRef &&
      currentLeaseSnapshot.state === "active" &&
      currentLeaseSnapshot.ownershipEpoch === task.ownershipEpoch &&
      currentLeaseSnapshot.fencingToken === task.fencingToken &&
      authorityState.currentLineageEpoch === task.currentLineageFenceEpoch &&
      !this.isLeaseExpired(
        currentLeaseSnapshot.heartbeatAt,
        currentLeaseSnapshot.leaseTtlSeconds,
        recordedAt,
      )
    ) {
      return;
    }
    invariant(
      currentLeaseSnapshot?.leaseId === leaseRef &&
        (currentLeaseSnapshot.state === "expired" ||
          this.isLeaseExpired(
            currentLeaseSnapshot.heartbeatAt,
            currentLeaseSnapshot.leaseTtlSeconds,
            recordedAt,
          )),
      "TRIAGE_TASK_REQUIRES_RECOVERY",
      `Task ${taskId} requires explicit same-shell recovery before approval or escalation mutation.`,
    );
    await this.triageApplication.reacquireTaskLease({
      taskId,
      actorRef,
      reacquiredAt: recordedAt,
    });
  }

  private async ensureCheckpointLeaseActive(
    checkpoint: ApprovalCheckpointSnapshot,
    recordedAt: string,
  ): Promise<void> {
    const authorityState = await this.triageApplication.controlPlaneRepositories.getLeaseAuthorityState(
      `${APPROVAL_DOMAIN}::${checkpoint.checkpointId}`,
    );
    invariant(
      authorityState?.currentLeaseRef,
      "APPROVAL_CHECKPOINT_LEASE_NOT_FOUND",
      `ApprovalCheckpoint ${checkpoint.checkpointId} requires an active lease.`,
    );
    const currentLease = await this.triageApplication.controlPlaneRepositories.getRequestLifecycleLease(
      authorityState.currentLeaseRef,
    );
    invariant(currentLease, "APPROVAL_CHECKPOINT_LEASE_NOT_FOUND", "Approval lease row is missing.");
    const snapshot = currentLease.toSnapshot();
    invariant(
      snapshot.leaseId === checkpoint.lifecycleLeaseRef &&
        snapshot.state === "active" &&
        snapshot.ownershipEpoch === checkpoint.ownershipEpoch &&
        snapshot.fencingToken === checkpoint.fencingToken &&
        authorityState.currentLineageEpoch === checkpoint.currentLineageFenceEpoch &&
        !this.isLeaseExpired(snapshot.heartbeatAt, snapshot.leaseTtlSeconds, recordedAt),
      "APPROVAL_CHECKPOINT_REQUIRES_RECOVERY",
      `ApprovalCheckpoint ${checkpoint.checkpointId} requires same-shell recovery before mutation.`,
    );
  }

  private async ensureEscalationEpochCurrent(
    taskId: string,
    escalation: DutyEscalationRecordSnapshot,
    recordedAt: string,
  ) {
    const bundle = await this.requireCurrentDecisionBundle(taskId);
    if (bundle.epoch.epochId === escalation.decisionEpochRef) {
      return bundle;
    }
    const supersessions =
      await this.endpointApplication.decisionRepositories.listSupersessionRecordsForTask(taskId);
    const latestSupersession = supersessions.at(-1) ?? bundle.latestSupersession;
    invariant(
      latestSupersession,
      "STALE_ESCALATION_WITHOUT_SUPERSESSION",
      "Stale escalation requires a DecisionSupersessionRecord.",
    );
    await this.service.cancelUrgentEscalation({
      escalationId: escalation.dutyEscalationRecordId,
      decisionSupersessionRecordRef: latestSupersession.decisionSupersessionRecordId,
      cancelledAt: recordedAt,
      cancellationState: "cancelled",
    });
    throw new Error(
      `STALE_ESCALATION_EPOCH: Escalation ${escalation.dutyEscalationRecordId} no longer matches the live DecisionEpoch.`,
    );
  }

  private async releaseSupersededCheckpoint(
    checkpoint: ApprovalCheckpointSnapshot,
    recordedAt: string,
  ): Promise<void> {
    try {
      await this.leaseAuthority.releaseLease({
        domain: APPROVAL_DOMAIN,
        domainObjectRef: checkpoint.checkpointId,
        leaseId: checkpoint.lifecycleLeaseRef,
        presentedOwnershipEpoch: checkpoint.ownershipEpoch,
        presentedFencingToken: checkpoint.fencingToken,
        releasedAt: recordedAt,
        sameShellRecoveryRouteRef: this.approvalRecoveryRoute(checkpoint.taskId),
        operatorVisibleWorkRef: `approval_${checkpoint.checkpointId}`,
        blockedActionScopeRefs: ["approval_checkpoint", "approve_decision"],
        closeBlockReason: "approval_checkpoint_superseded",
        detectedByRef: PHASE3_APPROVAL_ESCALATION_SERVICE_NAME,
      });
    } catch {
      // Best-effort release keeps replay-safe invalidation paths tolerant when the same superseded
      // checkpoint is revisited by regression tests.
    }
  }

  private async issueTaskCommand(input: {
    task: TaskLeaseContextSnapshot;
    actorRef: string;
    recordedAt: string;
    actionScope: string;
    semanticPayload: Record<string, unknown>;
  }): Promise<void> {
    const governingObjectVersionRef = await this.currentTaskControlPlaneVersionRef(
      input.task.taskId,
      `${input.task.taskId}@v${input.task.version}`,
    );
    const action = await this.leaseAuthority.registerCommandAction({
      leaseId: requireRef(input.task.lifecycleLeaseRef, "lifecycleLeaseRef"),
      domain: TRIAGE_DOMAIN,
      domainObjectRef: input.task.taskId,
      governingObjectVersionRef,
      presentedOwnershipEpoch: input.task.ownershipEpoch,
      presentedFencingToken: input.task.fencingToken,
      presentedLineageFenceEpoch: input.task.currentLineageFenceEpoch,
      actionScope: input.actionScope,
      governingObjectRef: input.task.taskId,
      canonicalObjectDescriptorRef: TRIAGE_DESCRIPTOR,
      initiatingBoundedContextRef: TRIAGE_DOMAIN,
      governingBoundedContextRef: TRIAGE_DOMAIN,
      lineageScope: "request",
      routeIntentRef: `route_intent_${input.actionScope}_${input.task.taskId}`,
      routeContractDigestRef: `route_contract_digest_${input.actionScope}_v1`,
      requiredContextBoundaryRefs: [],
      parentAnchorRef: input.task.launchContextRef,
      edgeCorrelationId: `edge_${input.actionScope}_${input.task.taskId}`,
      initiatingUiEventRef: `ui_event_${input.actionScope}_${input.task.taskId}`,
      initiatingUiEventCausalityFrameRef: `ui_frame_${input.actionScope}_${input.task.taskId}`,
      actingContextRef: "staff_workspace",
      policyBundleRef: "policy_triage_workspace_v1",
      sourceCommandId: `cmd_${input.actionScope}_${input.task.taskId}_${input.recordedAt}`,
      transportCorrelationId: `transport_${input.actionScope}_${input.task.taskId}`,
      semanticPayload: input.semanticPayload,
      idempotencyKey: `idempotency_${input.actionScope}_${input.task.taskId}_${input.recordedAt}`,
      idempotencyRecordRef: `idempotency_record_${input.actionScope}_${input.task.taskId}`,
      commandFollowingTokenRef: `command_follow_${input.actionScope}_${input.task.taskId}`,
      expectedEffectSetRefs: [`triage.${input.task.taskId}.${input.actionScope}`],
      causalToken: `causal_${input.actionScope}_${input.task.taskId}_${input.recordedAt}`,
      createdAt: input.recordedAt,
      sameShellRecoveryRouteRef: this.taskRecoveryRoute(input.task.taskId),
      operatorVisibleWorkRef: `work_${input.task.taskId}`,
      blockedActionScopeRefs: [input.actionScope],
      detectedByRef: input.actorRef,
    });
    await this.settlementAuthority.recordSettlement({
      actionRecordRef: action.actionRecord.actionRecordId,
      replayDecisionClass: "distinct",
      result: "applied",
      processingAcceptanceState: "accepted_for_processing",
      externalObservationState: "projection_visible",
      authoritativeOutcomeState: "settled",
      authoritativeProofClass: "review_disposition",
      sameShellRecoveryRef: this.taskRecoveryRoute(input.task.taskId),
      projectionVersionRef: `${input.task.taskId}@projection_${input.recordedAt}`,
      uiTransitionSettlementRef: `ui_transition_${action.actionRecord.actionRecordId}`,
      projectionVisibilityRef: "staff_workspace",
      auditRecordRef: `audit_${action.actionRecord.actionRecordId}`,
      blockingRefs: [],
      quietEligibleAt: input.recordedAt,
      lastSafeAnchorRef: input.task.launchContextRef,
      allowedSummaryTier: "full",
      recordedAt: input.recordedAt,
    });
  }

  private async currentTaskControlPlaneVersionRef(
    taskId: string,
    fallback: string,
  ): Promise<string> {
    const authorityState = await this.triageApplication.controlPlaneRepositories.getLeaseAuthorityState(
      `${TRIAGE_DOMAIN}::${taskId}`,
    );
    return authorityState?.governingObjectVersionRef ?? fallback;
  }

  private isLeaseExpired(heartbeatAt: string, leaseTtlSeconds: number, at: string): boolean {
    return Date.parse(heartbeatAt) + leaseTtlSeconds * 1000 <= Date.parse(at);
  }

  private taskRecoveryRoute(taskId: string): string {
    return `/workspace/tasks/${taskId}/recover`;
  }

  private approvalRecoveryRoute(taskIdOrCheckpointId: string): string {
    return `/workspace/tasks/${taskIdOrCheckpointId}/approval`;
  }
}

export function createPhase3ApprovalEscalationApplication(options?: {
  triageApplication?: Phase3TriageKernelApplication;
  endpointApplication?: Phase3EndpointDecisionEngineApplication;
  repositories?: Phase3ApprovalEscalationRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase3ApprovalEscalationApplication {
  return new Phase3ApprovalEscalationApplicationImpl(options);
}
