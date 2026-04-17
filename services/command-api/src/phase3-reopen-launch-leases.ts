import {
  RequestAggregate,
  RequestLineageAggregate,
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type RequestLineageSnapshot,
  type RequestSnapshot,
} from "@vecells/domain-kernel";
import { type SubmissionBackboneDependencies } from "@vecells/domain-identity-access";
import {
  createPhase3ReopenLaunchKernelService,
  createPhase3ReopenLaunchKernelStore,
  type NextTaskLaunchLeaseSnapshot,
  type Phase3DirectResolutionBundle,
  type Phase3ReopenLaunchBundle,
  type Phase3ReopenLaunchKernelRepositories,
  type Phase3ReopenLaunchKernelService,
  type Phase3TaskLaunchContextSnapshot,
  type Phase3TriageTransitionResult,
  type TriageReopenRecordSnapshot,
} from "@vecells/domain-triage-workspace";
import {
  createPhase3ApprovalEscalationApplication,
  phase3ApprovalEscalationMigrationPlanRefs,
  phase3ApprovalEscalationPersistenceTables,
  type Phase3ApprovalEscalationApplication,
} from "./phase3-approval-escalation";
import {
  createPhase3DirectResolutionApplication,
  phase3DirectResolutionMigrationPlanRefs,
  phase3DirectResolutionPersistenceTables,
  type Phase3DirectResolutionApplication,
} from "./phase3-direct-resolution-handoffs";
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

export const PHASE3_REOPEN_LAUNCH_SERVICE_NAME =
  "Phase3ReopenLaunchLeaseApplication";
export const PHASE3_REOPEN_LAUNCH_SCHEMA_VERSION =
  "241.phase3.reopen-launch-leases.v1";
export const PHASE3_REOPEN_LAUNCH_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/{taskId}/reopen-launch",
] as const;

export const phase3ReopenLaunchRoutes = [
  {
    routeId: "workspace_task_reopen_launch_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/reopen-launch",
    contractFamily: "ReopenLaunchBundleContract",
    purpose:
      "Expose the current TriageReopenRecord, TaskLaunchContext, NextTaskLaunchLease, and reopen priority posture for one workspace task.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_reopen_from_resolved",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}:reopen-from-resolved",
    contractFamily: "TriageReopenCommandContract",
    purpose:
      "Reopen governed work after a resolved-without-appointment consequence fails, preserving the superseded path and restoring queue continuity through TaskLaunchContext.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_reopen_from_handoff",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}:reopen-from-handoff",
    contractFamily: "TriageReopenCommandContract",
    purpose:
      "Reopen governed work after booking or pharmacy handoff bounce-back, preserving lineage to the invalidated handoff intent and the superseded DecisionEpoch.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_reopen_from_invalidation",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}:reopen-from-invalidation",
    contractFamily: "TriageReopenCommandContract",
    purpose:
      "Reopen governed work after approval invalidation, consequence supersession, or materially new evidence invalidates the prior endpoint path.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_issue_next_task_launch_lease",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}:issue-next-task-launch-lease",
    contractFamily: "NextTaskLaunchLeaseCommandContract",
    purpose:
      "Issue the explicit NextTaskLaunchLease for the recommended next task only from current TaskLaunchContext, source settlement, and continuity tuple truth.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_validate_next_task_launch_lease",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/next-task-launch/{nextTaskLaunchLeaseId}:validate",
    contractFamily: "NextTaskLaunchLeaseValidationCommandContract",
    purpose:
      "Validate or degrade an issued NextTaskLaunchLease when queue, continuity, settlement, anchor, publication, or trust truth drifts.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_invalidate_next_task_launch_lease",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/next-task-launch/{nextTaskLaunchLeaseId}:invalidate",
    contractFamily: "NextTaskLaunchLeaseInvalidationCommandContract",
    purpose:
      "Explicitly invalidate a stale or blocked NextTaskLaunchLease without inferring calm completion or silently advancing to the next task.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase3ReopenLaunchPersistenceTables = [
  ...new Set([
    ...phase3TriageKernelPersistenceTables,
    ...phase3EndpointDecisionPersistenceTables,
    ...phase3ApprovalEscalationPersistenceTables,
    ...phase3DirectResolutionPersistenceTables,
    "phase3_next_task_launch_leases",
  ]),
] as const;

export const phase3ReopenLaunchMigrationPlanRefs = [
  ...new Set([
    ...phase3TriageKernelMigrationPlanRefs,
    ...phase3EndpointDecisionMigrationPlanRefs,
    ...phase3ApprovalEscalationMigrationPlanRefs,
    ...phase3DirectResolutionMigrationPlanRefs,
    "services/command-api/migrations/117_phase3_reopen_and_next_task_launch_leases.sql",
  ]),
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

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

interface TaskSnapshot {
  taskId: string;
  requestId: string;
  queueKey: string;
  assignedTo: string | null;
  status: string;
  reviewVersion: number;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  ownershipState: string;
  launchContextRef: string;
  lifecycleLeaseRef: string | null;
  staleOwnerRecoveryRef: string | null;
  currentDecisionEpochRef: string | null;
  currentEndpointDecisionRef: string | null;
  taskCompletionSettlementEnvelopeRef: string;
}

interface ReviewSessionSnapshot {
  reviewSessionId: string;
  taskId: string;
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
  audienceSurfaceRuntimeBindingRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  workspaceSliceTrustProjectionRef: string;
  releaseRecoveryDispositionRef: string;
  openedAt: string;
  lastActivityAt: string;
}

export interface Phase3ReopenPriorityAdjustment {
  priorityBand: string;
  urgencyCarryFloor: number;
}

export interface Phase3ReopenLaunchApplicationBundle extends Phase3ReopenLaunchBundle {
  task: TaskSnapshot;
  priorityAdjustment: Phase3ReopenPriorityAdjustment | null;
  requestWorkflowState: string;
}

export interface ReopenResolvedCommandInput {
  taskId: string;
  actorRef: string;
  recordedAt: string;
  reasonCode: string;
  sourceDomain?: TriageReopenRecordSnapshot["sourceDomain"];
  evidenceRefs?: readonly string[];
  priorityOverride?: string;
  reopenedByMode?: TriageReopenRecordSnapshot["reopenedByMode"];
}

export interface ReopenHandoffCommandInput extends ReopenResolvedCommandInput {}

export interface ReopenInvalidationCommandInput extends ReopenResolvedCommandInput {
  sourceDomain: TriageReopenRecordSnapshot["sourceDomain"];
  supersededDecisionEpochRef?: string | null;
}

export interface IssueNextTaskLaunchLeaseCommandInput {
  taskId: string;
  actorRef: string;
  recordedAt: string;
  nextTaskCandidateRef: string;
  continuityEvidenceRef: string;
  sourceSettlementEnvelopeRef?: string | null;
  sourceRankSnapshotRef?: string | null;
  prefetchWindowRef?: string | null;
  expiresAt?: string | null;
}

export interface ValidateNextTaskLaunchLeaseCommandInput {
  taskId: string;
  actorRef: string;
  nextTaskLaunchLeaseId: string;
  recordedAt: string;
  currentSourceRankSnapshotRef?: string | null;
  currentSourceSettlementEnvelopeRef?: string | null;
  currentContinuityEvidenceRef?: string | null;
  currentReturnAnchorRef?: string | null;
  publicationDrifted?: boolean;
  trustDrifted?: boolean;
}

export interface InvalidateNextTaskLaunchLeaseCommandInput {
  taskId: string;
  actorRef: string;
  nextTaskLaunchLeaseId: string;
  recordedAt: string;
  blockingReasonRefs: readonly string[];
}

export interface GovernedReopenResult {
  reopenRecord: TriageReopenRecordSnapshot;
  decisionSupersessionRecordRef: string;
  reopenedTaskTransition: Phase3TriageTransitionResult | null;
  queuedTaskTransition: Phase3TriageTransitionResult | null;
  launchContext: Phase3TaskLaunchContextSnapshot;
  priorityAdjustment: Phase3ReopenPriorityAdjustment;
}

export interface Phase3ReopenLaunchApplication {
  readonly serviceName: typeof PHASE3_REOPEN_LAUNCH_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_REOPEN_LAUNCH_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_REOPEN_LAUNCH_QUERY_SURFACES;
  readonly routes: typeof phase3ReopenLaunchRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly endpointApplication: Phase3EndpointDecisionEngineApplication;
  readonly approvalApplication: Phase3ApprovalEscalationApplication;
  readonly directResolutionApplication: Phase3DirectResolutionApplication;
  readonly repositories: Phase3ReopenLaunchKernelRepositories;
  readonly service: Phase3ReopenLaunchKernelService;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  queryTaskReopenLaunch(taskId: string): Promise<Phase3ReopenLaunchApplicationBundle>;
  reopenFromResolved(input: ReopenResolvedCommandInput): Promise<GovernedReopenResult>;
  reopenFromHandoff(input: ReopenHandoffCommandInput): Promise<GovernedReopenResult>;
  reopenFromInvalidation(input: ReopenInvalidationCommandInput): Promise<GovernedReopenResult>;
  issueNextTaskLaunchLease(
    input: IssueNextTaskLaunchLeaseCommandInput,
  ): Promise<NextTaskLaunchLeaseSnapshot>;
  validateNextTaskLaunchLease(
    input: ValidateNextTaskLaunchLeaseCommandInput,
  ): Promise<NextTaskLaunchLeaseSnapshot>;
  invalidateNextTaskLaunchLease(
    input: InvalidateNextTaskLaunchLeaseCommandInput,
  ): Promise<NextTaskLaunchLeaseSnapshot>;
}

class Phase3ReopenLaunchApplicationImpl implements Phase3ReopenLaunchApplication {
  readonly serviceName = PHASE3_REOPEN_LAUNCH_SERVICE_NAME;
  readonly schemaVersion = PHASE3_REOPEN_LAUNCH_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_REOPEN_LAUNCH_QUERY_SURFACES;
  readonly routes = phase3ReopenLaunchRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly endpointApplication: Phase3EndpointDecisionEngineApplication;
  readonly approvalApplication: Phase3ApprovalEscalationApplication;
  readonly directResolutionApplication: Phase3DirectResolutionApplication;
  readonly repositories: Phase3ReopenLaunchKernelRepositories;
  readonly service: Phase3ReopenLaunchKernelService;
  readonly persistenceTables = phase3ReopenLaunchPersistenceTables;
  readonly migrationPlanRef = phase3ReopenLaunchMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3ReopenLaunchMigrationPlanRefs;

  constructor(options?: {
    triageApplication?: Phase3TriageKernelApplication;
    endpointApplication?: Phase3EndpointDecisionEngineApplication;
    approvalApplication?: Phase3ApprovalEscalationApplication;
    directResolutionApplication?: Phase3DirectResolutionApplication;
    repositories?: Phase3ReopenLaunchKernelRepositories;
    idGenerator?: BackboneIdGenerator;
  }) {
    const idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase3_reopen_launch");
    this.triageApplication =
      options?.triageApplication ??
      createPhase3TriageKernelApplication({ idGenerator });
    this.endpointApplication =
      options?.endpointApplication ??
      createPhase3EndpointDecisionEngineApplication({
        idGenerator,
        triageApplication: this.triageApplication,
      });
    this.approvalApplication =
      options?.approvalApplication ??
      createPhase3ApprovalEscalationApplication({
        idGenerator,
        triageApplication: this.triageApplication,
        endpointApplication: this.endpointApplication,
      });
    this.directResolutionApplication =
      options?.directResolutionApplication ??
      createPhase3DirectResolutionApplication({
        idGenerator,
        triageApplication: this.triageApplication,
        endpointApplication: this.endpointApplication,
        approvalApplication: this.approvalApplication,
      });
    this.repositories =
      options?.repositories ??
      createPhase3ReopenLaunchKernelStore({
        triageRepositories: this.triageApplication.triageRepositories,
        approvalRepositories: this.approvalApplication.repositories,
      });
    this.service = createPhase3ReopenLaunchKernelService(this.repositories, { idGenerator });
  }

  async queryTaskReopenLaunch(taskId: string): Promise<Phase3ReopenLaunchApplicationBundle> {
    const task = await this.requireTask(taskId);
    const request = await this.requireRequest(task.requestId, taskId);
    const bundle = await this.service.queryTaskBundle({
      taskId,
      launchContextRef: task.launchContextRef,
    });
    return {
      ...bundle,
      task,
      priorityAdjustment: bundle.reopenRecord
        ? this.deriveReopenPriorityAdjustment(bundle.reopenRecord.priorityOverride)
        : request.priorityBand
          ? { priorityBand: request.priorityBand, urgencyCarryFloor: 0.4 }
          : null,
      requestWorkflowState: request.workflowState,
    };
  }

  async reopenFromResolved(input: ReopenResolvedCommandInput): Promise<GovernedReopenResult> {
    const task = await this.requireTask(input.taskId);
    const bundle = await this.directResolutionApplication.queryTaskDirectResolution(input.taskId);
    invariant(
      bundle.settlement !== null,
      "DIRECT_RESOLUTION_SETTLEMENT_REQUIRED",
      `Task ${input.taskId} requires a settled direct resolution bundle before reopen-from-resolved can proceed.`,
    );
    invariant(
      bundle.settlement.triageTaskStatus === "resolved_without_appointment",
      "DIRECT_RESOLUTION_STATE_MISMATCH",
      "reopenFromResolved requires a resolved_without_appointment consequence path.",
    );
    const sourceDomain =
      input.sourceDomain ??
      (bundle.callbackSeed
        ? "callback"
        : bundle.clinicianMessageSeed
          ? "clinician_message"
          : "direct_resolution");
    return this.reopenGovernedPath({
      task,
      directResolutionBundle: bundle,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      reasonCode: input.reasonCode,
      evidenceRefs: input.evidenceRefs ?? [],
      priorityOverride: input.priorityOverride ?? "same_day_return",
      reopenedByMode: input.reopenedByMode ?? "reviewer_manual",
      sourceDomain,
      supersededDecisionEpochRef: bundle.settlement.decisionEpochRef,
    });
  }

  async reopenFromHandoff(input: ReopenHandoffCommandInput): Promise<GovernedReopenResult> {
    const task = await this.requireTask(input.taskId);
    const bundle = await this.directResolutionApplication.queryTaskDirectResolution(input.taskId);
    invariant(
      bundle.settlement !== null,
      "DIRECT_RESOLUTION_SETTLEMENT_REQUIRED",
      `Task ${input.taskId} requires a settled handoff bundle before reopen-from-handoff can proceed.`,
    );
    invariant(
      bundle.settlement.triageTaskStatus === "handoff_pending",
      "HANDOFF_SETTLEMENT_STATE_MISMATCH",
      "reopenFromHandoff requires a handoff_pending consequence path.",
    );
    const sourceDomain =
      input.sourceDomain ??
      (bundle.bookingIntent ? "booking_handoff" : "pharmacy_handoff");
    return this.reopenGovernedPath({
      task,
      directResolutionBundle: bundle,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      reasonCode: input.reasonCode,
      evidenceRefs: input.evidenceRefs ?? [],
      priorityOverride: input.priorityOverride ?? "urgent_return",
      reopenedByMode: input.reopenedByMode ?? "reviewer_manual",
      sourceDomain,
      supersededDecisionEpochRef: bundle.settlement.decisionEpochRef,
    });
  }

  async reopenFromInvalidation(
    input: ReopenInvalidationCommandInput,
  ): Promise<GovernedReopenResult> {
    const task = await this.requireTask(input.taskId);
    const directResolutionBundle =
      await this.directResolutionApplication.queryTaskDirectResolution(input.taskId).catch(() => null);
    const supersededDecisionEpochRef =
      optionalRef(input.supersededDecisionEpochRef) ??
      directResolutionBundle?.settlement?.decisionEpochRef ??
      task.currentDecisionEpochRef;
    invariant(
      supersededDecisionEpochRef !== null,
      "SUPERSEDED_DECISION_EPOCH_REQUIRED",
      "reopenFromInvalidation requires a superseded DecisionEpoch reference.",
    );
    return this.reopenGovernedPath({
      task,
      directResolutionBundle,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      reasonCode: input.reasonCode,
      evidenceRefs: input.evidenceRefs ?? [],
      priorityOverride: input.priorityOverride ?? "expedited_return",
      reopenedByMode: input.reopenedByMode ?? "supervisor_manual",
      sourceDomain: input.sourceDomain,
      supersededDecisionEpochRef,
    });
  }

  async issueNextTaskLaunchLease(
    input: IssueNextTaskLaunchLeaseCommandInput,
  ): Promise<NextTaskLaunchLeaseSnapshot> {
    const task = await this.requireTask(input.taskId);
    const launchContext = await this.requireLaunchContext(task.launchContextRef);
    const recoveryRef = await this.joinStaleOwnerRecoveryIfNeeded(
      task,
      input.actorRef,
      input.recordedAt,
    );
    let launchEligibilityState: NextTaskLaunchLeaseSnapshot["launchEligibilityState"] = "ready";
    const blockingReasonRefs: string[] = [];
    const expectedRankSnapshotRef =
      launchContext.nextTaskRankSnapshotRef ?? launchContext.sourceQueueRankSnapshotRef;
    const sourceRankSnapshotRef = input.sourceRankSnapshotRef ?? expectedRankSnapshotRef;
    if (sourceRankSnapshotRef !== expectedRankSnapshotRef) {
      launchEligibilityState = "stale";
      blockingReasonRefs.push("TASK_241_QUEUE_SNAPSHOT_DRIFT");
    }
    const sourceSettlementEnvelopeRef =
      optionalRef(input.sourceSettlementEnvelopeRef) ?? task.taskCompletionSettlementEnvelopeRef;
    if (sourceSettlementEnvelopeRef !== task.taskCompletionSettlementEnvelopeRef) {
      launchEligibilityState = "blocked";
      blockingReasonRefs.push("TASK_241_SETTLEMENT_DRIFT");
    }
    if (recoveryRef) {
      launchEligibilityState = "blocked";
      blockingReasonRefs.push(`TASK_241_STALE_OWNER_RECOVERY:${recoveryRef}`);
    }

    const issued = await this.service.issueNextTaskLaunchLease({
      sourceTaskRef: task.taskId,
      launchContextRef: task.launchContextRef,
      prefetchWindowRef: input.prefetchWindowRef ?? null,
      nextTaskCandidateRef: input.nextTaskCandidateRef,
      sourceSettlementEnvelopeRef,
      continuityEvidenceRef: requireRef(input.continuityEvidenceRef, "continuityEvidenceRef"),
      sourceRankSnapshotRef,
      issuedAt: input.recordedAt,
      expiresAt:
        optionalRef(input.expiresAt) ??
        new Date(Date.parse(ensureIsoTimestamp(input.recordedAt, "recordedAt")) + 5 * 60 * 1000).toISOString(),
      launchEligibilityState,
      blockingReasonRefs,
    });
    return issued.nextTaskLaunchLease;
  }

  async validateNextTaskLaunchLease(
    input: ValidateNextTaskLaunchLeaseCommandInput,
  ): Promise<NextTaskLaunchLeaseSnapshot> {
    const task = await this.requireTask(input.taskId);
    const launchContext = await this.requireLaunchContext(task.launchContextRef);
    const recoveryRef = await this.joinStaleOwnerRecoveryIfNeeded(
      task,
      input.actorRef,
      input.recordedAt,
    );
    const validated = await this.service.validateNextTaskLaunchLease({
      nextTaskLaunchLeaseId: input.nextTaskLaunchLeaseId,
      validatedAt: input.recordedAt,
      currentSourceRankSnapshotRef:
        optionalRef(input.currentSourceRankSnapshotRef) ??
        launchContext.nextTaskRankSnapshotRef ??
        launchContext.sourceQueueRankSnapshotRef,
      currentSourceSettlementEnvelopeRef:
        optionalRef(input.currentSourceSettlementEnvelopeRef) ?? task.taskCompletionSettlementEnvelopeRef,
      currentContinuityEvidenceRef:
        optionalRef(input.currentContinuityEvidenceRef) ??
        `${task.taskId}::workspace_continuity_evidence_placeholder::241`,
      currentReturnAnchorRef:
        optionalRef(input.currentReturnAnchorRef) ?? launchContext.returnAnchorRef,
      currentSelectedAnchorRef: launchContext.selectedAnchorRef,
      currentSelectedAnchorTupleHash: launchContext.selectedAnchorTupleHash,
      staleOwnerRecoveryRef: recoveryRef,
      ownershipDrifted: recoveryRef !== null,
      publicationDrifted: input.publicationDrifted,
      trustDrifted: input.trustDrifted,
    });
    return validated.nextTaskLaunchLease;
  }

  async invalidateNextTaskLaunchLease(
    input: InvalidateNextTaskLaunchLeaseCommandInput,
  ): Promise<NextTaskLaunchLeaseSnapshot> {
    const invalidated = await this.service.invalidateNextTaskLaunchLease({
      nextTaskLaunchLeaseId: input.nextTaskLaunchLeaseId,
      invalidatedAt: input.recordedAt,
      blockingReasonRefs: input.blockingReasonRefs,
    });
    return invalidated.nextTaskLaunchLease;
  }

  private async reopenGovernedPath(input: {
    task: TaskSnapshot;
    directResolutionBundle: Phase3DirectResolutionBundle | null;
    actorRef: string;
    recordedAt: string;
    reasonCode: string;
    evidenceRefs: readonly string[];
    priorityOverride: string;
    reopenedByMode: TriageReopenRecordSnapshot["reopenedByMode"];
    sourceDomain: TriageReopenRecordSnapshot["sourceDomain"];
    supersededDecisionEpochRef: string;
  }): Promise<GovernedReopenResult> {
    const supersession = await this.ensureDecisionSupersessionRecord({
      task: input.task,
      actorRef: input.actorRef,
      recordedAt: input.recordedAt,
      supersededDecisionEpochRef: input.supersededDecisionEpochRef,
    });
    await this.invalidateApprovalIfNeeded(
      input.task.taskId,
      input.supersededDecisionEpochRef,
      supersession.decisionSupersessionRecordId,
      input.recordedAt,
    );
    const currentDirectResolutionBundle = input.directResolutionBundle
      ? await this.directResolutionApplication.service.reconcileSupersededConsequences({
          taskId: input.task.taskId,
          priorDecisionEpochRef: input.supersededDecisionEpochRef,
          decisionSupersessionRecordRef: supersession.decisionSupersessionRecordId,
          reconciledAt: input.recordedAt,
        })
      : null;
    const reopen = await this.service.recordGovernedReopen({
      taskId: input.task.taskId,
      sourceDomain: input.sourceDomain,
      reasonCode: input.reasonCode,
      evidenceRefs: uniqueSorted([
        ...input.evidenceRefs,
        ...this.collectDirectResolutionEvidenceRefs(currentDirectResolutionBundle),
        supersession.decisionSupersessionRecordId,
      ]),
      supersededDecisionEpochRef: input.supersededDecisionEpochRef,
      decisionSupersessionRecordRef: supersession.decisionSupersessionRecordId,
      priorityOverride: input.priorityOverride,
      reopenedByMode: input.reopenedByMode,
      reopenedAt: input.recordedAt,
    });
    const currentTask = await this.requireTask(input.task.taskId);
    let reopenedTaskTransition: Phase3TriageTransitionResult | null = null;
    let queuedTaskTransition: Phase3TriageTransitionResult | null = null;

    if (currentTask.status !== "reopened" && currentTask.status !== "queued") {
      const recoveryRef = await this.joinStaleOwnerRecoveryIfNeeded(
        currentTask,
        input.actorRef,
        input.recordedAt,
      );
      invariant(
        recoveryRef === null,
        "TRIAGE_TASK_REQUIRES_RECOVERY",
        `Task ${currentTask.taskId} requires same-shell recovery before reopen can proceed: ${recoveryRef}.`,
      );
      reopenedTaskTransition = await this.triageApplication.reopenTask({
        taskId: currentTask.taskId,
        actorRef: input.actorRef,
        recordedAt: input.recordedAt,
        reopenContractRef: reopen.reopenRecord.reopenRecordId,
      });
      queuedTaskTransition = await this.triageApplication.moveTaskToQueue({
        taskId: currentTask.taskId,
        actorRef: input.actorRef,
        queuedAt: input.recordedAt,
      });
    }

    const latestTask = await this.requireTask(input.task.taskId);
    const priorityAdjustment = await this.applyReopenPriorityAndWorkflow(
      latestTask,
      input.recordedAt,
      reopen.reopenRecord.priorityOverride,
    );
    const restoredLaunchContext = await this.service.restoreTaskLaunchContext({
      launchContextRef: latestTask.launchContextRef,
      restoredAt: input.recordedAt,
      nextTaskLaunchState: "blocked",
      nextTaskBlockingReasonRefs: ["TASK_241_QUEUE_RECALC_REQUIRED"],
      departingTaskReturnStubState: "pinned",
      changedSinceSeenAt: input.recordedAt,
      previewDigestRef: `reopen_priority:${priorityAdjustment.priorityBand}:urgency:${priorityAdjustment.urgencyCarryFloor}`,
    });

    return {
      reopenRecord: reopen.reopenRecord,
      decisionSupersessionRecordRef: supersession.decisionSupersessionRecordId,
      reopenedTaskTransition,
      queuedTaskTransition,
      launchContext: restoredLaunchContext,
      priorityAdjustment,
    };
  }

  private async ensureDecisionSupersessionRecord(input: {
    task: TaskSnapshot;
    actorRef: string;
    recordedAt: string;
    supersededDecisionEpochRef: string;
  }) {
    const supersessions =
      await this.endpointApplication.decisionRepositories.listSupersessionRecordsForTask(
        input.task.taskId,
      );
    const existing = supersessions.find(
      (record) => record.priorDecisionEpochRef === input.supersededDecisionEpochRef,
    );
    if (existing) {
      return existing;
    }

    const decisionBundle = await this.endpointApplication.queryTaskEndpointDecision(input.task.taskId);
    invariant(
      decisionBundle && decisionBundle.epoch.epochId === input.supersededDecisionEpochRef,
      "DECISION_SUPERSESSION_CONTEXT_REQUIRED",
      `Task ${input.task.taskId} requires the current unsuperseded DecisionEpoch before a new reopen supersession can be minted.`,
    );
    const request = await this.requireRequest(input.task.requestId, input.task.taskId);
    const reviewSession = await this.requireLatestReviewSession(input.task.taskId);
    const mutation = await this.endpointApplication.decisionService.invalidateStaleDecision({
      taskId: input.task.taskId,
      requestId: input.task.requestId,
      decisionId: decisionBundle.decision.decisionId,
      fence: this.buildDecisionFence(input.task, reviewSession, request),
      previewInput: this.buildDecisionPreviewInput(input.task, request),
      command: this.buildSyntheticCommandContext(input.task.taskId, input.actorRef, input.recordedAt),
      manualReplace: true,
    });
    invariant(
      mutation.supersessionRecord,
      "DECISION_SUPERSESSION_RECORD_REQUIRED",
      `Task ${input.task.taskId} failed to materialize a DecisionSupersessionRecord.`,
    );
    return mutation.supersessionRecord;
  }

  private async invalidateApprovalIfNeeded(
    taskId: string,
    supersededDecisionEpochRef: string,
    decisionSupersessionRecordRef: string,
    recordedAt: string,
  ): Promise<void> {
    const approvalBundle = await this.approvalApplication.queryTaskApprovalEscalation(taskId);
    if (
      !approvalBundle.checkpoint ||
      approvalBundle.checkpoint.decisionEpochRef !== supersededDecisionEpochRef ||
      approvalBundle.checkpoint.state === "superseded"
    ) {
      return;
    }
    await this.approvalApplication.service.invalidateCheckpoint({
      checkpointId: approvalBundle.checkpoint.checkpointId,
      invalidationReasonClass: "epoch_superseded",
      invalidatedAt: recordedAt,
      decisionSupersessionRecordRef,
    });
  }

  private collectDirectResolutionEvidenceRefs(
    bundle: Phase3DirectResolutionBundle | null,
  ): readonly string[] {
    if (!bundle?.settlement) {
      return [];
    }
    return uniqueSorted(
      [
        bundle.settlement.settlementId,
        bundle.callbackSeed?.callbackSeedId,
        bundle.clinicianMessageSeed?.clinicianMessageSeedId,
        bundle.selfCareStarter?.selfCareStarterId,
        bundle.adminResolutionStarter?.adminResolutionStarterId,
        bundle.bookingIntent?.intentId,
        bundle.pharmacyIntent?.intentId,
        bundle.presentationArtifact?.presentationArtifactId,
        bundle.patientStatusProjection?.projectionUpdateId,
        bundle.settlement.decisionSupersessionRecordRef,
      ].filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    );
  }

  private deriveReopenPriorityAdjustment(priorityOverride: string): Phase3ReopenPriorityAdjustment {
    switch (priorityOverride) {
      case "urgent_return":
        return { priorityBand: "urgent", urgencyCarryFloor: 0.92 };
      case "same_day_return":
        return { priorityBand: "same_day", urgencyCarryFloor: 0.72 };
      case "expedited_return":
        return { priorityBand: "elevated", urgencyCarryFloor: 0.58 };
      default:
        return {
          priorityBand: priorityOverride,
          urgencyCarryFloor: 0.45,
        };
    }
  }

  private async applyReopenPriorityAndWorkflow(
    task: TaskSnapshot,
    recordedAt: string,
    priorityOverride: string,
  ): Promise<Phase3ReopenPriorityAdjustment> {
    const priorityAdjustment = this.deriveReopenPriorityAdjustment(priorityOverride);
    const submissionRepositories =
      this.triageApplication.controlPlaneRepositories as unknown as SubmissionBackboneDependencies;
    const request = await this.triageApplication.controlPlaneRepositories.getRequest(task.requestId);
    invariant(request, "REQUEST_NOT_FOUND", `Request ${task.requestId} is required for ${task.taskId}.`);
    const requestSnapshot = request.toSnapshot() as RequestSnapshot;
    if (
      requestSnapshot.workflowState !== "triage_active" ||
      requestSnapshot.priorityBand !== priorityAdjustment.priorityBand ||
      requestSnapshot.currentTriageTaskRef !== task.taskId ||
      requestSnapshot.assignedQueueRef !== task.queueKey
    ) {
      const reopenedRequest = RequestAggregate.hydrate({
        ...requestSnapshot,
        workflowState: "triage_active",
        priorityBand: priorityAdjustment.priorityBand,
        currentTriageTaskRef: task.taskId,
        assignedQueueRef: task.queueKey,
        updatedAt: recordedAt,
        requestVersion: requestSnapshot.requestVersion + 1,
        version: requestSnapshot.version + 1,
      });
      await this.triageApplication.controlPlaneRepositories.saveRequest(reopenedRequest, {
        expectedVersion: request.version,
      });
    }

    const lineage = await submissionRepositories.getRequestLineage(requestSnapshot.requestLineageRef);
    invariant(
      lineage,
      "REQUEST_LINEAGE_NOT_FOUND",
      `RequestLineage ${requestSnapshot.requestLineageRef} is required for ${task.taskId}.`,
    );
    const lineageSnapshot = lineage.toSnapshot() as RequestLineageSnapshot;
    if (
      lineageSnapshot.lineageState !== "active" ||
      lineageSnapshot.latestTriageTaskRef !== task.taskId
    ) {
      const reopenedLineage = RequestLineageAggregate.hydrate({
        ...lineageSnapshot,
        lineageState: "active",
        latestTriageTaskRef: task.taskId,
        updatedAt: recordedAt,
        version: lineageSnapshot.version + 1,
      });
      await submissionRepositories.saveRequestLineage(reopenedLineage, {
        expectedVersion: lineage.version,
      });
    }
    return priorityAdjustment;
  }

  private async joinStaleOwnerRecoveryIfNeeded(
    task: TaskSnapshot,
    actorRef: string,
    recordedAt: string,
  ): Promise<string | null> {
    if (optionalRef(task.staleOwnerRecoveryRef) !== null) {
      return task.staleOwnerRecoveryRef;
    }
    if (task.ownershipState !== "active" || optionalRef(task.lifecycleLeaseRef) === null) {
      return null;
    }
    const authorityState = await this.triageApplication.controlPlaneRepositories.getLeaseAuthorityState(
      `triage_workspace::${task.taskId}`,
    );
    if (!authorityState?.currentLeaseRef) {
      return null;
    }
    const currentLease =
      await this.triageApplication.controlPlaneRepositories.getRequestLifecycleLease(
        authorityState.currentLeaseRef,
      );
    const leaseSnapshot = currentLease?.toSnapshot();
    if (
      leaseSnapshot &&
      leaseSnapshot.state === "active" &&
      leaseSnapshot.ownershipEpoch === task.ownershipEpoch &&
      leaseSnapshot.fencingToken === task.fencingToken &&
      authorityState.currentLineageEpoch === task.currentLineageFenceEpoch
    ) {
      return null;
    }
    const stale = await this.triageApplication.markStaleOwnerDetected({
      taskId: task.taskId,
      authorizedByRef: actorRef,
      detectedAt: recordedAt,
      breakReason: "reopen_sensitive_work_requires_recovery",
      breakGuardSeconds: 0,
    });
    return stale.task.staleOwnerRecoveryRef;
  }

  private buildDecisionFence(
    task: TaskSnapshot,
    reviewSession: ReviewSessionSnapshot,
    request: RequestSnapshot,
  ) {
    return {
      taskId: task.taskId,
      requestId: task.requestId,
      reviewSessionRef: reviewSession.reviewSessionId,
      reviewVersionRef: task.reviewVersion,
      selectedAnchorRef: reviewSession.selectedAnchorRef,
      selectedAnchorTupleHashRef: reviewSession.selectedAnchorTupleHashRef,
      governingSnapshotRef:
        request.currentEvidenceSnapshotRef ?? `governing_snapshot_${task.requestId}`,
      evidenceSnapshotRef:
        request.currentEvidenceSnapshotRef ?? `evidence_snapshot_${task.requestId}`,
      compiledPolicyBundleRef: "phase3_endpoint_policy_bundle_238.v1",
      safetyDecisionEpochRef: `${task.requestId}::safety_epoch::${request.safetyDecisionEpoch}`,
      duplicateLineageRef: null,
      lineageFenceEpoch: task.currentLineageFenceEpoch,
      ownershipEpochRef: task.ownershipEpoch,
      audienceSurfaceRuntimeBindingRef: reviewSession.audienceSurfaceRuntimeBindingRef,
      surfaceRouteContractRef: reviewSession.surfaceRouteContractRef,
      surfacePublicationRef: reviewSession.surfacePublicationRef,
      runtimePublicationBundleRef: reviewSession.runtimePublicationBundleRef,
      releasePublicationParityRef: `${reviewSession.surfacePublicationRef}::${reviewSession.runtimePublicationBundleRef}`,
      workspaceSliceTrustProjectionRef: reviewSession.workspaceSliceTrustProjectionRef,
      continuityEvidenceRef: `${task.taskId}::workspace_continuity_evidence_placeholder::241`,
      releaseRecoveryDispositionRef: reviewSession.releaseRecoveryDispositionRef,
      writeState: "live",
    } as const;
  }

  private buildDecisionPreviewInput(task: TaskSnapshot, request: RequestSnapshot) {
    const sourceArtifactRefs = uniqueSorted(
      [
        request.originIngressRecordRef,
        request.normalizedSubmissionRef,
        request.currentEvidenceSnapshotRef,
        request.currentEvidenceAssimilationRef,
        request.currentMaterialDeltaAssessmentRef,
        request.currentEvidenceClassificationRef,
        request.currentSafetyDecisionRef,
        request.currentUrgentDiversionSettlementRef,
      ].filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    );
    return {
      requestSummaryLines: [
        `Request ${task.requestId}`,
        `Queue ${task.queueKey}`,
        `Review version ${task.reviewVersion}`,
      ],
      patientNarrative: [
        request.narrativeRef ? `Narrative ${request.narrativeRef}` : "Narrative pending",
      ],
      safetySummaryLines: [
        request.currentSafetyDecisionRef
          ? `Safety ${request.currentSafetyDecisionRef}`
          : "Safety decision pending",
      ],
      contactSummaryLines: [
        request.contactPreferencesRef
          ? `Contact ${request.contactPreferencesRef}`
          : "Contact preferences pending",
      ],
      duplicateSummaryLines: ["Duplicate posture unchanged"],
      identitySummaryLines: [`Workflow ${request.workflowState}`],
      priorResponseSummaryLines: [
        request.currentEvidenceAssimilationRef
          ? `Assimilation ${request.currentEvidenceAssimilationRef}`
          : "No prior response assimilation",
      ],
      sourceArtifactRefs,
      reviewBundleDigestRef: `${task.taskId}::review_bundle_digest::241`,
      rulesVersion: "235.review-bundle-summary.v1",
      templateVersion: "238.endpoint-preview.v1",
    } as const;
  }

  private buildSyntheticCommandContext(
    taskId: string,
    actorRef: string,
    recordedAt: string,
  ) {
    const suffix = `${taskId}_${recordedAt}`;
    return {
      actorRef,
      routeIntentTupleHash: `synthetic_route_tuple_${suffix}`,
      routeIntentBindingRef: `synthetic_route_binding_${suffix}`,
      commandActionRecordRef: `synthetic_action_${suffix}`,
      commandSettlementRecordRef: `synthetic_settlement_${suffix}`,
      transitionEnvelopeRef: `synthetic_transition_${suffix}`,
      releaseRecoveryDispositionRef: `synthetic_recovery_${suffix}`,
      causalToken: `synthetic_cause_${suffix}`,
      recordedAt,
      recoveryRouteRef: `/workspace/tasks/${taskId}/recover`,
    };
  }

  private async requireTask(taskId: string): Promise<TaskSnapshot> {
    const task = await this.triageApplication.triageRepositories.getTask(taskId);
    invariant(task, "TRIAGE_TASK_NOT_FOUND", `TriageTask ${taskId} is required.`);
    return task.toSnapshot() as TaskSnapshot;
  }

  private async requireLaunchContext(
    launchContextRef: string,
  ): Promise<Phase3TaskLaunchContextSnapshot> {
    const launchContext = await this.triageApplication.triageRepositories.getLaunchContext(
      launchContextRef,
    );
    invariant(
      launchContext,
      "TASK_LAUNCH_CONTEXT_NOT_FOUND",
      `TaskLaunchContext ${launchContextRef} is required.`,
    );
    return launchContext.toSnapshot();
  }

  private async requireRequest(requestId: string, taskId: string): Promise<RequestSnapshot> {
    const request = await this.triageApplication.controlPlaneRepositories.getRequest(requestId);
    invariant(request, "REQUEST_NOT_FOUND", `Request ${requestId} is required for ${taskId}.`);
    return request.toSnapshot() as RequestSnapshot;
  }

  private async requireLatestReviewSession(taskId: string): Promise<ReviewSessionSnapshot> {
    const sessions = await this.triageApplication.triageRepositories.listReviewSessions();
    const session = [...sessions]
      .map((entry) => entry.toSnapshot() as ReviewSessionSnapshot)
      .filter((entry) => entry.taskId === taskId)
      .sort((left, right) => left.openedAt.localeCompare(right.openedAt))
      .at(-1);
    invariant(session, "REVIEW_SESSION_NOT_FOUND", `A review session is required for ${taskId}.`);
    return session;
  }
}

export function createPhase3ReopenLaunchApplication(options?: {
  triageApplication?: Phase3TriageKernelApplication;
  endpointApplication?: Phase3EndpointDecisionEngineApplication;
  approvalApplication?: Phase3ApprovalEscalationApplication;
  directResolutionApplication?: Phase3DirectResolutionApplication;
  repositories?: Phase3ReopenLaunchKernelRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase3ReopenLaunchApplication {
  return new Phase3ReopenLaunchApplicationImpl(options);
}
