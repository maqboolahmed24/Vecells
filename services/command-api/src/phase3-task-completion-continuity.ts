import {
  createWorkspaceProjectionAuthorityService,
  createWorkspaceProjectionStore,
  type WorkspaceContextProjectionBundle,
  type WorkspaceProjectionDependencies,
} from "@vecells/domain-identity-access";
import {
  type Phase3TaskLocalAckState,
  type NextTaskLaunchLeaseSnapshot,
  type OperatorHandoffFrameSnapshot,
  type OperatorHandoffSettlementState,
  type OperatorHandoffType,
  type Phase3ApprovalEscalationBundle,
  type Phase3DirectResolutionBundle,
  type Phase3TaskCompletionContinuityBundle,
  type Phase3TaskCompletionContinuityKernelService,
  type Phase3TaskCompletionContinuityRepositories,
  type TaskCompletionAuthoritativeSettlementState,
  type TaskCompletionNextTaskLaunchState,
  type TaskCompletionSettlementEnvelopeSnapshot,
  type TriageReopenRecordSnapshot,
  createPhase3TaskCompletionContinuityKernelService,
  createPhase3TaskCompletionContinuityKernelStore,
} from "@vecells/domain-triage-workspace";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  createPhase3ReopenLaunchApplication,
  phase3ReopenLaunchMigrationPlanRefs,
  phase3ReopenLaunchPersistenceTables,
  type Phase3ReopenLaunchApplication,
} from "./phase3-reopen-launch-leases";
import {
  createReleaseTrustFreezeSimulationHarness,
  releaseTrustFreezeWorkspaceScenarioIds,
} from "./release-trust-freeze";

export const PHASE3_TASK_COMPLETION_CONTINUITY_SERVICE_NAME =
  "Phase3TaskCompletionContinuityApplication";
export const PHASE3_TASK_COMPLETION_CONTINUITY_SCHEMA_VERSION =
  "242.phase3.task-completion-continuity.v1";
export const PHASE3_TASK_COMPLETION_CONTINUITY_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/{taskId}/completion-continuity",
] as const;

export const phase3TaskCompletionContinuityRoutes = [
  {
    routeId: "workspace_task_completion_continuity_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/completion-continuity",
    contractFamily: "TaskCompletionContinuityBundleContract",
    purpose:
      "Expose the current TaskCompletionSettlementEnvelope, OperatorHandoffFrame, WorkspaceContinuityEvidenceProjection, WorkspaceTrustEnvelope, and NextTaskLaunchLease for one task.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_settle_completion",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}:settle-completion",
    contractFamily: "TaskCompletionSettlementCommandContract",
    purpose:
      "Settle one authoritative TaskCompletionSettlementEnvelope from the current direct consequence or governed handoff path instead of inferring calm completion from local acknowledgement.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_record_manual_handoff_requirement",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}:record-manual-handoff",
    contractFamily: "OperatorHandoffFrameCommandContract",
    purpose:
      "Record one durable OperatorHandoffFrame when manual baton, supervisor takeover, or downstream owner acceptance keeps calm completion blocked.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_compute_continuity_evidence",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}:compute-continuity-evidence",
    contractFamily: "WorkspaceContinuityEvidenceComputationCommandContract",
    purpose:
      "Recompute WorkspaceContinuityEvidenceProjection and WorkspaceTrustEnvelope from authoritative task, publication, anchor, queue-snapshot, and launch-lease truth.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_evaluate_next_task_readiness",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}:evaluate-next-task-readiness",
    contractFamily: "NextTaskReadinessEvaluationCommandContract",
    purpose:
      "Evaluate next-task readiness only from the live NextTaskLaunchLease, TaskCompletionSettlementEnvelope, WorkspaceContinuityEvidenceProjection, and current trust tuple.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_invalidate_stale_continuity",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}:invalidate-stale-continuity",
    contractFamily: "WorkspaceContinuityInvalidationCommandContract",
    purpose:
      "Move completion and continuity posture to stale_recoverable or recovery_required when reopen, supersession, ownership drift, or publication drift invalidates the current calm shell.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

const workspaceProjectionPersistenceTables = [
  "phase3_staff_workspace_consistency_projections",
  "phase3_workspace_slice_trust_projections",
  "phase3_protected_composition_states",
  "phase3_workspace_continuity_evidence_projections",
  "phase3_workspace_trust_envelopes",
] as const;

export const phase3TaskCompletionContinuityPersistenceTables = [
  ...new Set([
    ...phase3ReopenLaunchPersistenceTables,
    ...workspaceProjectionPersistenceTables,
    "phase3_task_completion_settlement_envelopes",
    "phase3_operator_handoff_frames",
  ]),
] as const;

export const phase3TaskCompletionContinuityMigrationPlanRefs = [
  ...new Set([
    ...phase3ReopenLaunchMigrationPlanRefs,
    "services/command-api/migrations/118_phase3_task_completion_and_workspace_continuity.sql",
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

function plusMinutes(iso: string, minutes: number): string {
  const date = new Date(iso);
  invariant(!Number.isNaN(date.getTime()), "INVALID_BASE_TIMESTAMP", "Base timestamp is invalid.");
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString();
}

function stableExperienceContinuityEvidenceRef(taskId: string): string {
  return `experience_continuity_evidence_${taskId}`;
}

function nextApplicationId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

type ReleaseScenarioId = (typeof releaseTrustFreezeWorkspaceScenarioIds)[number];

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
  reviewFreshnessState: string;
  launchContextRef: string;
  workspaceTrustEnvelopeRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  taskCompletionSettlementEnvelopeRef: string;
  lifecycleLeaseRef: string | null;
  staleOwnerRecoveryRef: string | null;
  activeReviewSessionRef: string | null;
  latestDecisionSupersessionRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

interface ReviewSessionSnapshot {
  reviewSessionId: string;
  taskId: string;
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
  workspaceSnapshotVersion: number;
  reviewActionLeaseRef: string;
  requestLifecycleLeaseRef: string;
  audienceSurfaceRuntimeBindingRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  workspaceTrustEnvelopeRef: string;
  openedAt: string;
  lastActivityAt: string;
  version: number;
}

interface LaunchContextSnapshot {
  launchContextId: string;
  taskId: string;
  sourceQueueKey: string;
  sourceQueueRankSnapshotRef: string;
  returnAnchorRef: string;
  returnAnchorTupleHash: string;
  nextTaskCandidateRefs: readonly string[];
  nextTaskRankSnapshotRef: string | null;
  selectedAnchorRef: string;
  selectedAnchorTupleHash: string;
  nextTaskBlockingReasonRefs: readonly string[];
  nextTaskLaunchState: TaskCompletionNextTaskLaunchState;
  departingTaskReturnStubState: string;
  prefetchWindowRef: string | null;
  updatedAt: string;
}

type ContinuityProjectionSnapshot =
  WorkspaceContextProjectionBundle["workspaceContinuityEvidenceProjection"];
type TrustEnvelopeSnapshot = WorkspaceContextProjectionBundle["workspaceTrustEnvelope"];

export interface Phase3TaskCompletionContinuityApplicationBundle {
  task: TaskSnapshot;
  reviewSession: ReviewSessionSnapshot;
  launchContext: LaunchContextSnapshot;
  completionEnvelope: TaskCompletionSettlementEnvelopeSnapshot | null;
  operatorHandoffFrame: OperatorHandoffFrameSnapshot | null;
  workspaceContinuityEvidenceProjection: ContinuityProjectionSnapshot | null;
  workspaceTrustEnvelope: TrustEnvelopeSnapshot | null;
  nextTaskLaunchLease: NextTaskLaunchLeaseSnapshot | null;
  directResolution: Phase3DirectResolutionBundle;
  approval: Phase3ApprovalEscalationBundle;
  reopenRecord: TriageReopenRecordSnapshot | null;
}

export interface SettleTaskCompletionInput {
  taskId: string;
  actorRef: string;
  recordedAt: string;
  releaseScenarioId?: ReleaseScenarioId;
}

export interface RecordManualHandoffRequirementInput {
  taskId: string;
  actorRef: string;
  recordedAt: string;
  handoffType: OperatorHandoffType;
  nextOwnerRef: string;
  readinessSummaryRef: string;
  pendingDependencyRefs: readonly string[];
  confirmedArtifactRef?: string | null;
  settlementState?: OperatorHandoffSettlementState;
  releaseScenarioId?: ReleaseScenarioId;
}

export interface ComputeTaskCompletionContinuityInput {
  taskId: string;
  recordedAt: string;
  releaseScenarioId?: ReleaseScenarioId;
  currentSurfacePublicationRef?: string;
  currentRuntimePublicationBundleRef?: string;
  continuitySelectedAnchorTupleHashRef?: string;
  continuitySourceQueueRankSnapshotRef?: string;
  anchorRepairTargetRef?: string | null;
}

export interface EvaluateNextTaskReadinessInput extends ComputeTaskCompletionContinuityInput {
  actorRef: string;
  currentSourceRankSnapshotRef?: string;
  currentSourceSettlementEnvelopeRef?: string;
  currentContinuityEvidenceRef?: string;
  currentReturnAnchorRef?: string;
  currentSelectedAnchorRef?: string;
  currentSelectedAnchorTupleHash?: string;
  staleOwnerRecoveryRef?: string | null;
  ownershipDrifted?: boolean;
  publicationDrifted?: boolean;
  trustDrifted?: boolean;
}

export interface InvalidateStaleContinuityInput extends ComputeTaskCompletionContinuityInput {
  actorRef: string;
  invalidationReason:
    | "reopened"
    | "decision_superseded"
    | "ownership_drift"
    | "trust_drift"
    | "publication_drift"
    | "queue_snapshot_drift"
    | "selected_anchor_drift";
}

interface CompletionSettlementDerivation {
  actionType: string;
  authoritativeSettlementState: TaskCompletionAuthoritativeSettlementState;
  nextOwnerRef: string | null;
  closureSummaryRef: string;
  releaseConditionRef: string;
  operatorHandoffFrame: Omit<RecordManualHandoffRequirementInput, "actorRef" | "releaseScenarioId"> | null;
}

export interface Phase3TaskCompletionContinuityApplication {
  readonly serviceName: typeof PHASE3_TASK_COMPLETION_CONTINUITY_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_TASK_COMPLETION_CONTINUITY_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_TASK_COMPLETION_CONTINUITY_QUERY_SURFACES;
  readonly routes: typeof phase3TaskCompletionContinuityRoutes;
  readonly reopenLaunchApplication: Phase3ReopenLaunchApplication;
  readonly repositories: Phase3TaskCompletionContinuityRepositories;
  readonly service: Phase3TaskCompletionContinuityKernelService;
  readonly workspaceRepositories: WorkspaceProjectionDependencies;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  queryTaskCompletionContinuity(taskId: string): Promise<Phase3TaskCompletionContinuityApplicationBundle>;
  settleTaskCompletion(input: SettleTaskCompletionInput): Promise<Phase3TaskCompletionContinuityApplicationBundle>;
  recordManualHandoffRequirement(
    input: RecordManualHandoffRequirementInput,
  ): Promise<Phase3TaskCompletionContinuityApplicationBundle>;
  computeContinuityEvidence(
    input: ComputeTaskCompletionContinuityInput,
  ): Promise<Phase3TaskCompletionContinuityApplicationBundle>;
  evaluateNextTaskReadiness(
    input: EvaluateNextTaskReadinessInput,
  ): Promise<Phase3TaskCompletionContinuityApplicationBundle>;
  invalidateStaleContinuity(
    input: InvalidateStaleContinuityInput,
  ): Promise<Phase3TaskCompletionContinuityApplicationBundle>;
}

class Phase3TaskCompletionContinuityApplicationImpl
  implements Phase3TaskCompletionContinuityApplication
{
  readonly serviceName = PHASE3_TASK_COMPLETION_CONTINUITY_SERVICE_NAME;
  readonly schemaVersion = PHASE3_TASK_COMPLETION_CONTINUITY_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_TASK_COMPLETION_CONTINUITY_QUERY_SURFACES;
  readonly routes = phase3TaskCompletionContinuityRoutes;
  readonly reopenLaunchApplication: Phase3ReopenLaunchApplication;
  readonly repositories: Phase3TaskCompletionContinuityRepositories;
  readonly service: Phase3TaskCompletionContinuityKernelService;
  readonly workspaceRepositories: WorkspaceProjectionDependencies;
  readonly persistenceTables = phase3TaskCompletionContinuityPersistenceTables;
  readonly migrationPlanRef = phase3TaskCompletionContinuityMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3TaskCompletionContinuityMigrationPlanRefs;

  private readonly idGenerator: BackboneIdGenerator;
  private readonly workspaceAuthority: ReturnType<typeof createWorkspaceProjectionAuthorityService>;
  private readonly releaseTrustHarness = createReleaseTrustFreezeSimulationHarness();

  constructor(options?: {
    reopenLaunchApplication?: Phase3ReopenLaunchApplication;
    repositories?: Phase3TaskCompletionContinuityRepositories;
    workspaceRepositories?: WorkspaceProjectionDependencies;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase3_task_completion_continuity");
    this.reopenLaunchApplication =
      options?.reopenLaunchApplication ??
      createPhase3ReopenLaunchApplication({ idGenerator: this.idGenerator });
    this.repositories =
      options?.repositories ?? createPhase3TaskCompletionContinuityKernelStore();
    this.service = createPhase3TaskCompletionContinuityKernelService(this.repositories, {
      idGenerator: this.idGenerator,
    });
    this.workspaceRepositories = options?.workspaceRepositories ?? createWorkspaceProjectionStore();
    this.workspaceAuthority = createWorkspaceProjectionAuthorityService(
      this.workspaceRepositories,
      this.idGenerator,
    );
  }

  async queryTaskCompletionContinuity(
    taskId: string,
  ): Promise<Phase3TaskCompletionContinuityApplicationBundle> {
    const task = await this.requireTask(taskId);
    const reviewSession = await this.requireLatestReviewSession(taskId);
    const launchContext = await this.requireLaunchContext(task.toSnapshot().launchContextRef);
    const completionBundle = await this.service.queryTaskBundle(taskId);
    const reopenBundle = await this.reopenLaunchApplication.queryTaskReopenLaunch(taskId);
    const directResolution = await this.reopenLaunchApplication.directResolutionApplication.queryTaskDirectResolution(
      taskId,
    );
    const approval = await this.reopenLaunchApplication.approvalApplication.queryTaskApprovalEscalation(
      taskId,
    );
    const workspaceContinuityEvidenceProjection =
      await this.workspaceRepositories.getLatestWorkspaceContinuityEvidenceProjection(taskId);
    const workspaceTrustEnvelope =
      await this.workspaceRepositories.getLatestWorkspaceTrustEnvelope(taskId);

    return {
      task: task.toSnapshot() as TaskSnapshot,
      reviewSession: reviewSession.toSnapshot() as ReviewSessionSnapshot,
      launchContext: launchContext.toSnapshot() as LaunchContextSnapshot,
      completionEnvelope: completionBundle.completionEnvelope,
      operatorHandoffFrame: completionBundle.operatorHandoffFrame,
      workspaceContinuityEvidenceProjection,
      workspaceTrustEnvelope,
      nextTaskLaunchLease: reopenBundle.nextTaskLaunchLease,
      directResolution,
      approval,
      reopenRecord: reopenBundle.reopenRecord,
    };
  }

  async settleTaskCompletion(
    input: SettleTaskCompletionInput,
  ): Promise<Phase3TaskCompletionContinuityApplicationBundle> {
    const context = await this.loadReconciliationContext(input.taskId);
    const derived = this.deriveCompletionSettlement(context);
    if (context.completionEnvelope && this.isStableCompletionReplay(context, derived)) {
      return this.queryTaskCompletionContinuity(input.taskId);
    }
    return this.reconcileAndPersist({
      context,
      recordedAt: input.recordedAt,
      releaseScenarioId: input.releaseScenarioId,
      completionDerivation: derived,
      continuityOverrides: {},
      keepEnvelopeIdentity: true,
    });
  }

  async recordManualHandoffRequirement(
    input: RecordManualHandoffRequirementInput,
  ): Promise<Phase3TaskCompletionContinuityApplicationBundle> {
    const context = await this.loadReconciliationContext(input.taskId);
    const closureSummaryRef =
      context.directResolution.presentationArtifact?.presentationArtifactId ??
      `${input.taskId}::manual_handoff_summary`;
    const derived: CompletionSettlementDerivation = {
      actionType: "manual_handoff_required",
      authoritativeSettlementState: "manual_handoff_required",
      nextOwnerRef: input.nextOwnerRef,
      closureSummaryRef,
      releaseConditionRef: "release_condition_manual_handoff_required",
      operatorHandoffFrame: {
        taskId: input.taskId,
        recordedAt: input.recordedAt,
        handoffType: input.handoffType,
        nextOwnerRef: input.nextOwnerRef,
        readinessSummaryRef: input.readinessSummaryRef,
        pendingDependencyRefs: input.pendingDependencyRefs,
        confirmedArtifactRef: input.confirmedArtifactRef ?? null,
        settlementState: input.settlementState ?? "pending_acceptance",
      },
    };
    return this.reconcileAndPersist({
      context,
      recordedAt: input.recordedAt,
      releaseScenarioId: input.releaseScenarioId,
      completionDerivation: derived,
      continuityOverrides: {},
      keepEnvelopeIdentity: true,
    });
  }

  async computeContinuityEvidence(
    input: ComputeTaskCompletionContinuityInput,
  ): Promise<Phase3TaskCompletionContinuityApplicationBundle> {
    const context = await this.loadReconciliationContext(input.taskId);
    const derived = this.deriveCompletionSettlement(context);
    return this.reconcileAndPersist({
      context,
      recordedAt: input.recordedAt,
      releaseScenarioId: input.releaseScenarioId,
      completionDerivation: derived,
      continuityOverrides: input,
      keepEnvelopeIdentity: true,
    });
  }

  async evaluateNextTaskReadiness(
    input: EvaluateNextTaskReadinessInput,
  ): Promise<Phase3TaskCompletionContinuityApplicationBundle> {
    const current = await this.queryTaskCompletionContinuity(input.taskId);
    if (current.nextTaskLaunchLease) {
      await this.reopenLaunchApplication.validateNextTaskLaunchLease({
        taskId: input.taskId,
        actorRef: input.actorRef,
        nextTaskLaunchLeaseId: current.nextTaskLaunchLease.nextTaskLaunchLeaseId,
        recordedAt: input.recordedAt,
        currentSourceRankSnapshotRef:
          input.currentSourceRankSnapshotRef ?? current.nextTaskLaunchLease.sourceRankSnapshotRef,
        currentSourceSettlementEnvelopeRef:
          input.currentSourceSettlementEnvelopeRef ??
          (current.completionEnvelope?.taskCompletionSettlementEnvelopeId ??
            current.task.taskCompletionSettlementEnvelopeRef),
        currentContinuityEvidenceRef:
          input.currentContinuityEvidenceRef ?? stableExperienceContinuityEvidenceRef(input.taskId),
        currentReturnAnchorRef:
          input.currentReturnAnchorRef ?? current.launchContext.returnAnchorRef,
        publicationDrifted: input.publicationDrifted,
        trustDrifted: input.trustDrifted,
      });
    }

    const context = await this.loadReconciliationContext(input.taskId);
    const derived = this.deriveCompletionSettlement(context);
    return this.reconcileAndPersist({
      context,
      recordedAt: input.recordedAt,
      releaseScenarioId: input.releaseScenarioId,
      completionDerivation: derived,
      continuityOverrides: input,
      keepEnvelopeIdentity: true,
    });
  }

  async invalidateStaleContinuity(
    input: InvalidateStaleContinuityInput,
  ): Promise<Phase3TaskCompletionContinuityApplicationBundle> {
    const current = await this.queryTaskCompletionContinuity(input.taskId);
    if (current.nextTaskLaunchLease?.leaseState === "live") {
      await this.reopenLaunchApplication.invalidateNextTaskLaunchLease({
        taskId: input.taskId,
        actorRef: input.actorRef,
        nextTaskLaunchLeaseId: current.nextTaskLaunchLease.nextTaskLaunchLeaseId,
        recordedAt: input.recordedAt,
        blockingReasonRefs: this.mapInvalidationReasonToBlockingRefs(input.invalidationReason),
      });
    }

    const context = await this.loadReconciliationContext(input.taskId);
    const base = this.deriveCompletionSettlement(context);
    const derived: CompletionSettlementDerivation = {
      ...base,
      authoritativeSettlementState: this.mapInvalidationReasonToSettlementState(
        input.invalidationReason,
      ),
      releaseConditionRef: this.mapInvalidationReasonToReleaseCondition(input.invalidationReason),
    };
    return this.reconcileAndPersist({
      context,
      recordedAt: input.recordedAt,
      releaseScenarioId: input.releaseScenarioId,
      completionDerivation: derived,
      continuityOverrides: input,
      keepEnvelopeIdentity: true,
    });
  }

  private async reconcileAndPersist(options: {
    context: Awaited<ReturnType<Phase3TaskCompletionContinuityApplicationImpl["loadReconciliationContext"]>>;
    recordedAt: string;
    releaseScenarioId?: ReleaseScenarioId;
    completionDerivation: CompletionSettlementDerivation;
    continuityOverrides: Partial<EvaluateNextTaskReadinessInput>;
    keepEnvelopeIdentity: boolean;
  }): Promise<Phase3TaskCompletionContinuityApplicationBundle> {
    const recordedAt = ensureIsoTimestamp(options.recordedAt, "recordedAt");
    const experienceContinuityEvidenceRef = stableExperienceContinuityEvidenceRef(
      options.context.task.taskId,
    );

    let operatorHandoffFrameRef: string | null = null;
    if (options.completionDerivation.operatorHandoffFrame) {
      const currentId = options.context.operatorHandoffFrame?.operatorHandoffFrameId;
      const handoffRecord = await this.service.recordOperatorHandoffFrame({
        operatorHandoffFrameId: currentId ?? nextApplicationId(this.idGenerator, "operator_handoff_frame"),
        taskId: options.context.task.taskId,
        handoffType: options.completionDerivation.operatorHandoffFrame.handoffType,
        nextOwnerRef: options.completionDerivation.operatorHandoffFrame.nextOwnerRef,
        readinessSummaryRef: options.completionDerivation.operatorHandoffFrame.readinessSummaryRef,
        pendingDependencyRefs:
          options.completionDerivation.operatorHandoffFrame.pendingDependencyRefs,
        confirmedArtifactRef:
          options.completionDerivation.operatorHandoffFrame.confirmedArtifactRef ?? null,
        settlementState:
          options.completionDerivation.operatorHandoffFrame.settlementState ?? "pending_acceptance",
        generatedAt: recordedAt,
      });
      operatorHandoffFrameRef = handoffRecord.operatorHandoffFrame.operatorHandoffFrameId;
    }

    const sourceQueueRankSnapshotRef = this.deriveSourceQueueRankSnapshotRef(options.context);
    const continuityBundle = await this.workspaceAuthority.assembleWorkspaceProjectionBundle(
      await this.buildWorkspaceProjectionBundleInput({
        context: options.context,
        recordedAt,
        completionDerivation: options.completionDerivation,
        experienceContinuityEvidenceRef,
        sourceQueueRankSnapshotRef,
        operatorHandoffFrameRef,
        releaseScenarioId: options.releaseScenarioId,
        continuityOverrides: options.continuityOverrides,
      }),
    );
    const nextTaskLaunchState = this.deriveNextTaskLaunchState(
      options.context,
      options.completionDerivation.authoritativeSettlementState,
      continuityBundle,
      sourceQueueRankSnapshotRef,
      experienceContinuityEvidenceRef,
    );
    const blockingReasonRefs = this.deriveCompletionBlockingReasonRefs({
      context: options.context,
      completionDerivation: options.completionDerivation,
      continuityBundle,
      nextTaskLaunchState,
    });

    const currentEnvelopeId =
      options.keepEnvelopeIdentity && options.context.completionEnvelope
        ? options.context.completionEnvelope.taskCompletionSettlementEnvelopeId
        : nextApplicationId(this.idGenerator, "task_completion_settlement_envelope");
    const completionEnvelope = await this.service.settleTaskCompletion({
      taskCompletionSettlementEnvelopeId: currentEnvelopeId,
      taskId: options.context.task.taskId,
      actionType: options.completionDerivation.actionType,
      selectedAnchorRef: options.context.reviewSession.selectedAnchorRef,
      sourceQueueRankSnapshotRef,
      workspaceTrustEnvelopeRef: continuityBundle.workspaceTrustEnvelope.workspaceTrustEnvelopeId,
      localAckState: this.deriveLocalAckState(options.context),
      authoritativeSettlementState: options.completionDerivation.authoritativeSettlementState,
      nextOwnerRef: options.completionDerivation.nextOwnerRef,
      closureSummaryRef: options.completionDerivation.closureSummaryRef,
      blockingReasonRefs,
      nextTaskLaunchState,
      nextTaskLaunchLeaseRef:
        options.context.nextTaskLaunchLease?.nextTaskLaunchLeaseId ?? null,
      experienceContinuityEvidenceRef,
      releaseConditionRef: options.completionDerivation.releaseConditionRef,
      operatorHandoffFrameRef,
      settledAt: recordedAt,
    });

    await this.persistTaskSurfaceRefs({
      context: options.context,
      completionEnvelope: completionEnvelope.completionEnvelope,
      continuityBundle,
      recordedAt,
    });

    return this.queryTaskCompletionContinuity(options.context.task.taskId);
  }

  private async buildWorkspaceProjectionBundleInput(options: {
    context: Awaited<ReturnType<Phase3TaskCompletionContinuityApplicationImpl["loadReconciliationContext"]>>;
    recordedAt: string;
    releaseScenarioId?: ReleaseScenarioId;
    completionDerivation: CompletionSettlementDerivation;
    experienceContinuityEvidenceRef: string;
    sourceQueueRankSnapshotRef: string;
    operatorHandoffFrameRef: string | null;
    continuityOverrides: Partial<EvaluateNextTaskReadinessInput>;
  }): Promise<Parameters<ReturnType<typeof createWorkspaceProjectionAuthorityService>["assembleWorkspaceProjectionBundle"]>[0]> {
    const releaseTrustScenario = await this.releaseTrustHarness.runScenarioById(
      options.releaseScenarioId ?? "live_exact_parity_trusted_slices",
    );
    const currentEnvelopeRef =
      options.context.completionEnvelope?.taskCompletionSettlementEnvelopeId ??
      options.context.task.taskCompletionSettlementEnvelopeRef;
    const provisionalNextTaskLaunchState =
      options.completionDerivation.authoritativeSettlementState === "settled" &&
      options.context.nextTaskLaunchLease?.leaseState === "live" &&
      options.context.nextTaskLaunchLease.launchEligibilityState === "ready" &&
      options.context.nextTaskLaunchLease.sourceSettlementEnvelopeRef === currentEnvelopeRef &&
      options.context.nextTaskLaunchLease.continuityEvidenceRef ===
        options.experienceContinuityEvidenceRef &&
      options.context.nextTaskLaunchLease.sourceRankSnapshotRef === options.sourceQueueRankSnapshotRef
        ? "ready"
        : options.completionDerivation.authoritativeSettlementState === "settled"
          ? "gated"
          : "blocked";
    return {
      workspaceRef: `/workspace/task/${options.context.task.taskId}`,
      workspaceFamily: "staff_review",
      taskId: options.context.task.taskId,
      requestId: options.context.task.requestId,
      queueKey: options.context.task.queueKey,
      routeFamilyRef: "rf_workspace_phase3_triage",
      routeContinuityEvidenceContractRef: "route_continuity_workspace_task_completion_v1",
      audienceTier: "staff_triage",
      governingObjectRefs: [
        options.context.task.taskId,
        options.context.task.requestId,
        options.context.reviewSession.reviewSessionId,
      ],
      entityVersionRefs: [
        `${options.context.task.taskId}@v${options.context.task.version}`,
        `${options.context.reviewSession.reviewSessionId}@v${options.context.reviewSession.version}`,
        `review_version_${options.context.task.reviewVersion}`,
      ],
      queueChangeBatchRef: null,
      reviewVersionRef: options.context.task.reviewVersion,
      workspaceSnapshotVersion: options.context.reviewSession.workspaceSnapshotVersion,
      reviewFreshnessState: options.context.task.reviewFreshnessState as
        | "fresh"
        | "queued_updates"
        | "review_required",
      currentRouteFamilyRef: "rf_workspace_phase3_triage",
      expectedSurfaceRouteContractRef: options.context.reviewSession.surfaceRouteContractRef,
      currentSurfaceRouteContractRef: options.context.reviewSession.surfaceRouteContractRef,
      expectedSurfacePublicationRef: options.context.reviewSession.surfacePublicationRef,
      surfacePublicationRef:
        options.continuityOverrides.currentSurfacePublicationRef ??
        options.context.reviewSession.surfacePublicationRef,
      expectedRuntimePublicationBundleRef: options.context.reviewSession.runtimePublicationBundleRef,
      runtimePublicationBundleRef:
        options.continuityOverrides.currentRuntimePublicationBundleRef ??
        options.context.reviewSession.runtimePublicationBundleRef,
      selectedAnchorRef: options.context.reviewSession.selectedAnchorRef,
      selectedAnchorTupleHashRef: options.context.reviewSession.selectedAnchorTupleHashRef,
      continuitySelectedAnchorTupleHashRef:
        options.continuityOverrides.continuitySelectedAnchorTupleHashRef ??
        options.context.launchContext.selectedAnchorTupleHash,
      continuitySourceQueueRankSnapshotRef:
        options.continuityOverrides.continuitySourceQueueRankSnapshotRef ??
        (options.context.nextTaskLaunchLease?.sourceRankSnapshotRef ??
          options.sourceQueueRankSnapshotRef),
      sourceQueueRankSnapshotRef: options.sourceQueueRankSnapshotRef,
      latestTaskCompletionSettlementRef:
        options.context.completionEnvelope?.taskCompletionSettlementEnvelopeId ??
        options.context.task.taskCompletionSettlementEnvelopeRef,
      taskCompletionSettlementEnvelopeRef:
        options.context.completionEnvelope?.taskCompletionSettlementEnvelopeId ??
        options.context.task.taskCompletionSettlementEnvelopeRef,
      latestPrefetchWindowRef: options.context.launchContext.prefetchWindowRef,
      latestNextTaskLaunchLeaseRef:
        options.context.nextTaskLaunchLease?.nextTaskLaunchLeaseId ?? null,
      experienceContinuityEvidenceRef: options.experienceContinuityEvidenceRef,
      completionSettlementState: options.completionDerivation.authoritativeSettlementState,
      nextTaskLaunchState: provisionalNextTaskLaunchState,
      releaseTrustVerdict: releaseTrustScenario.verdict,
      reviewActionLeaseRef: options.context.reviewSession.reviewActionLeaseRef,
      reviewActionLeaseState: options.context.task.staleOwnerRecoveryRef ? "expired" : "live",
      requestLifecycleLeaseRef: options.context.reviewSession.requestLifecycleLeaseRef,
      requestLifecycleLeaseState: options.context.reviewSession.requestLifecycleLeaseRef
        ? "live"
        : options.context.task.lifecycleLeaseRef
          ? "live"
          : "missing",
      focusProtectionLeaseRef: null,
      focusProtectionLeaseState: "released",
      invalidatingDriftState: "none",
      compositionMode: null,
      draftArtifactRefs: [],
      compareAnchorRefs: [],
      primaryReadingTargetRef: `${options.context.task.taskId}::reading_target`,
      quietReturnTargetRef: `${options.context.task.taskId}::quiet_return`,
      allowedLivePatchMode: "blocking_only",
      releaseGateRef: null,
      compositionStartedAt: null,
      compositionReleasedAt: null,
      consequenceState: options.context.task.latestDecisionSupersessionRef ? "superseded" : "current",
      anchorRepairTargetRef: optionalRef(options.continuityOverrides.anchorRepairTargetRef) ?? null,
      staleOwnerRecoveryRef: options.context.task.staleOwnerRecoveryRef,
      ownershipEpochRef: options.context.task.ownershipEpoch,
      presentedOwnershipEpoch: options.context.task.ownershipEpoch,
      fencingToken: options.context.task.fencingToken,
      presentedFencingToken: options.context.task.fencingToken,
      lineageFenceEpoch: options.context.task.currentLineageFenceEpoch,
      presentedLineageFenceEpoch: options.context.task.currentLineageFenceEpoch,
      surfaceRuntimeBindingRef: options.context.reviewSession.audienceSurfaceRuntimeBindingRef,
      computedAt: options.recordedAt,
      staleAt: plusMinutes(options.recordedAt, 10),
    };
  }

  private deriveCompletionSettlement(context: Awaited<ReturnType<Phase3TaskCompletionContinuityApplicationImpl["loadReconciliationContext"]>>): CompletionSettlementDerivation {
    const presentationArtifactRef =
      context.directResolution.presentationArtifact?.presentationArtifactId ??
      `${context.task.taskId}::closure_summary`;

    if (context.task.latestDecisionSupersessionRef) {
      return {
        actionType: "decision_superseded",
        authoritativeSettlementState: "stale_recoverable",
        nextOwnerRef: null,
        closureSummaryRef: presentationArtifactRef,
        releaseConditionRef: "release_condition_decision_superseded",
        operatorHandoffFrame: null,
      };
    }

    if (context.task.status === "reopened") {
      return {
        actionType: "reopened",
        authoritativeSettlementState: "recovery_required",
        nextOwnerRef: null,
        closureSummaryRef: presentationArtifactRef,
        releaseConditionRef: "release_condition_governed_reopen",
        operatorHandoffFrame: null,
      };
    }

    if (
      context.directResolution.settlement?.settlementState === "recovery_only" ||
      context.task.staleOwnerRecoveryRef
    ) {
      return {
        actionType: context.directResolution.settlement?.endpointCode ?? context.task.status,
        authoritativeSettlementState: "recovery_required",
        nextOwnerRef: null,
        closureSummaryRef: presentationArtifactRef,
        releaseConditionRef: "release_condition_governed_recovery",
        operatorHandoffFrame: null,
      };
    }

    if (
      context.directResolution.settlement?.settlementState === "settled" &&
      context.directResolution.settlement?.triageTaskStatus === "handoff_pending"
    ) {
      const isBooking = context.directResolution.bookingIntent !== null;
      const nextOwnerRef = isBooking ? "owner_booking_queue" : "owner_pharmacy_first";
      return {
        actionType: isBooking ? "booking_handoff" : "pharmacy_handoff",
        authoritativeSettlementState: "manual_handoff_required",
        nextOwnerRef,
        closureSummaryRef: presentationArtifactRef,
        releaseConditionRef: "release_condition_manual_handoff_required",
        operatorHandoffFrame: {
          taskId: context.task.taskId,
          recordedAt: context.directResolution.settlement.recordedAt,
          handoffType: isBooking ? "booking" : "pharmacy",
          nextOwnerRef,
          readinessSummaryRef: presentationArtifactRef,
          pendingDependencyRefs: uniqueSorted([
            isBooking ? "TASK_242_BOOKING_ACCEPTANCE_PENDING" : "TASK_242_PHARMACY_ACCEPTANCE_PENDING",
            context.directResolution.bookingIntent?.intentId ??
              context.directResolution.pharmacyIntent?.intentId ??
              "",
          ]),
          confirmedArtifactRef:
            context.directResolution.bookingIntent?.intentId ??
            context.directResolution.pharmacyIntent?.intentId ??
            context.directResolution.presentationArtifact?.presentationArtifactId ??
            null,
          settlementState: "pending_acceptance",
        },
      };
    }

    if (
      context.directResolution.settlement?.settlementState === "settled" &&
      context.directResolution.settlement?.triageTaskStatus === "resolved_without_appointment"
    ) {
      return {
        actionType: context.directResolution.settlement.endpointCode,
        authoritativeSettlementState: "settled",
        nextOwnerRef: null,
        closureSummaryRef: presentationArtifactRef,
        releaseConditionRef: "release_condition_authoritative_completion",
        operatorHandoffFrame: null,
      };
    }

    return {
      actionType: context.directResolution.settlement?.endpointCode ?? context.task.status,
      authoritativeSettlementState: "pending",
      nextOwnerRef: null,
      closureSummaryRef: presentationArtifactRef,
      releaseConditionRef: "release_condition_authoritative_settlement_pending",
      operatorHandoffFrame: null,
    };
  }

  private deriveSourceQueueRankSnapshotRef(
    context: Awaited<ReturnType<Phase3TaskCompletionContinuityApplicationImpl["loadReconciliationContext"]>>,
  ): string {
    return (
      context.nextTaskLaunchLease?.sourceRankSnapshotRef ??
      context.launchContext.nextTaskRankSnapshotRef ??
      context.launchContext.sourceQueueRankSnapshotRef
    );
  }

  private deriveLocalAckState(
    context: Awaited<ReturnType<Phase3TaskCompletionContinuityApplicationImpl["loadReconciliationContext"]>>,
  ): Phase3TaskLocalAckState {
    return context.latestTaskCommandSettlement?.localAckState ?? "none";
  }

  private deriveNextTaskLaunchState(
    context: Awaited<ReturnType<Phase3TaskCompletionContinuityApplicationImpl["loadReconciliationContext"]>>,
    authoritativeSettlementState: TaskCompletionAuthoritativeSettlementState,
    continuityBundle: WorkspaceContextProjectionBundle,
    sourceQueueRankSnapshotRef: string,
    experienceContinuityEvidenceRef: string,
  ): TaskCompletionNextTaskLaunchState {
    if (
      context.launchContext.nextTaskLaunchState === "launched" ||
      context.nextTaskLaunchLease?.leaseState === "consumed"
    ) {
      return "launched";
    }
    if (authoritativeSettlementState !== "settled") {
      return "blocked";
    }
    if (!context.nextTaskLaunchLease || context.nextTaskLaunchLease.leaseState !== "live") {
      return "gated";
    }
    if (
      continuityBundle.workspaceContinuityEvidenceProjection.validationState !== "trusted" ||
      continuityBundle.workspaceTrustEnvelope.envelopeState !== "interactive" ||
      continuityBundle.workspaceTrustEnvelope.mutationAuthorityState !== "live"
    ) {
      return continuityBundle.workspaceContinuityEvidenceProjection.validationState === "blocked"
        ? "blocked"
        : "gated";
    }
    if (
      context.nextTaskLaunchLease.sourceSettlementEnvelopeRef !==
        (context.completionEnvelope?.taskCompletionSettlementEnvelopeId ??
          context.task.taskCompletionSettlementEnvelopeRef) ||
      context.nextTaskLaunchLease.continuityEvidenceRef !== experienceContinuityEvidenceRef ||
      context.nextTaskLaunchLease.sourceRankSnapshotRef !== sourceQueueRankSnapshotRef ||
      context.nextTaskLaunchLease.launchEligibilityState !== "ready"
    ) {
      return "gated";
    }
    return "ready";
  }

  private deriveCompletionBlockingReasonRefs(options: {
    context: Awaited<ReturnType<Phase3TaskCompletionContinuityApplicationImpl["loadReconciliationContext"]>>;
    completionDerivation: CompletionSettlementDerivation;
    continuityBundle: WorkspaceContextProjectionBundle;
    nextTaskLaunchState: TaskCompletionNextTaskLaunchState;
  }): readonly string[] {
    const reasons = new Set<string>();

    switch (options.completionDerivation.authoritativeSettlementState) {
      case "pending":
        reasons.add("TASK_242_AUTHORITATIVE_SETTLEMENT_PENDING");
        break;
      case "manual_handoff_required":
        reasons.add("TASK_242_MANUAL_HANDOFF_REQUIRED");
        break;
      case "recovery_required":
        reasons.add("TASK_242_RECOVERY_REQUIRED");
        break;
      case "stale_recoverable":
        reasons.add("TASK_242_STALE_COMPLETION_CONTEXT");
        break;
      default:
        break;
    }

    if (
      options.completionDerivation.authoritativeSettlementState === "settled" &&
      !options.context.nextTaskLaunchLease
    ) {
      reasons.add("TASK_242_NEXT_TASK_LEASE_REQUIRED");
    }
    if (options.nextTaskLaunchState === "gated") {
      reasons.add("TASK_242_NEXT_TASK_GATED");
    }
    if (options.continuityBundle.workspaceContinuityEvidenceProjection.validationState === "degraded") {
      reasons.add("TASK_242_CONTINUITY_DEGRADED");
    }
    if (options.continuityBundle.workspaceContinuityEvidenceProjection.validationState === "stale") {
      reasons.add("TASK_242_CONTINUITY_STALE");
    }
    if (options.continuityBundle.workspaceContinuityEvidenceProjection.validationState === "blocked") {
      reasons.add("TASK_242_CONTINUITY_BLOCKED");
    }
    for (const reason of options.continuityBundle.workspaceContinuityEvidenceProjection.blockingRefs) {
      reasons.add(reason);
    }
    for (const reason of options.continuityBundle.workspaceTrustEnvelope.blockingReasonRefs) {
      reasons.add(reason);
    }
    for (const reason of options.context.nextTaskLaunchLease?.blockingReasonRefs ?? []) {
      reasons.add(reason);
    }
    if (options.context.task.latestDecisionSupersessionRef) {
      reasons.add("TASK_242_DECISION_SUPERSEDED");
    }
    if (options.context.task.staleOwnerRecoveryRef) {
      reasons.add("TASK_242_STALE_OWNER_RECOVERY");
    }
    return uniqueSorted([...reasons]);
  }

  private mapInvalidationReasonToSettlementState(
    reason: InvalidateStaleContinuityInput["invalidationReason"],
  ): TaskCompletionAuthoritativeSettlementState {
    switch (reason) {
      case "reopened":
      case "ownership_drift":
      case "trust_drift":
        return "recovery_required";
      default:
        return "stale_recoverable";
    }
  }

  private mapInvalidationReasonToReleaseCondition(
    reason: InvalidateStaleContinuityInput["invalidationReason"],
  ): string {
    switch (reason) {
      case "reopened":
        return "release_condition_reopen_recovery";
      case "decision_superseded":
        return "release_condition_decision_superseded";
      case "ownership_drift":
        return "release_condition_ownership_drift";
      case "trust_drift":
        return "release_condition_trust_drift";
      case "publication_drift":
        return "release_condition_publication_drift";
      case "queue_snapshot_drift":
        return "release_condition_queue_snapshot_drift";
      case "selected_anchor_drift":
        return "release_condition_selected_anchor_drift";
    }
  }

  private mapInvalidationReasonToBlockingRefs(
    reason: InvalidateStaleContinuityInput["invalidationReason"],
  ): readonly string[] {
    switch (reason) {
      case "reopened":
        return ["TASK_242_REOPENED_CONTEXT"];
      case "decision_superseded":
        return ["TASK_242_DECISION_SUPERSEDED"];
      case "ownership_drift":
        return ["TASK_242_STALE_OWNER_RECOVERY"];
      case "trust_drift":
        return ["TASK_242_TRUST_DRIFT"];
      case "publication_drift":
        return ["TASK_242_PUBLICATION_DRIFT"];
      case "queue_snapshot_drift":
        return ["TASK_242_QUEUE_SNAPSHOT_DRIFT"];
      case "selected_anchor_drift":
        return ["TASK_242_SELECTED_ANCHOR_DRIFT"];
    }
  }

  private isStableCompletionReplay(
    context: Awaited<ReturnType<Phase3TaskCompletionContinuityApplicationImpl["loadReconciliationContext"]>>,
    derived: CompletionSettlementDerivation,
  ): boolean {
    return (
      context.completionEnvelope !== null &&
      context.workspaceContinuityEvidenceProjection !== null &&
      context.workspaceTrustEnvelope !== null &&
      context.completionEnvelope.actionType === derived.actionType &&
      context.completionEnvelope.authoritativeSettlementState ===
        derived.authoritativeSettlementState &&
      context.completionEnvelope.closureSummaryRef === derived.closureSummaryRef &&
      context.completionEnvelope.releaseConditionRef === derived.releaseConditionRef &&
      context.completionEnvelope.selectedAnchorRef === context.reviewSession.selectedAnchorRef &&
      context.completionEnvelope.sourceQueueRankSnapshotRef ===
        this.deriveSourceQueueRankSnapshotRef(context)
    );
  }

  private async persistTaskSurfaceRefs(options: {
    context: Awaited<ReturnType<Phase3TaskCompletionContinuityApplicationImpl["loadReconciliationContext"]>>;
    completionEnvelope: TaskCompletionSettlementEnvelopeSnapshot;
    continuityBundle: WorkspaceContextProjectionBundle;
    recordedAt: string;
  }): Promise<void> {
    const updatedTask = options.context.taskDocument.update({
      taskCompletionSettlementEnvelopeRef:
        options.completionEnvelope.taskCompletionSettlementEnvelopeId,
      workspaceTrustEnvelopeRef:
        options.continuityBundle.workspaceTrustEnvelope.workspaceTrustEnvelopeId,
      updatedAt: options.recordedAt,
    });
    await this.reopenLaunchApplication.triageApplication.triageRepositories.saveTask(updatedTask, {
      expectedVersion: options.context.taskDocument.version,
    });

    const updatedReviewSession = options.context.reviewSessionDocument.update({
      workspaceTrustEnvelopeRef:
        options.continuityBundle.workspaceTrustEnvelope.workspaceTrustEnvelopeId,
    });
    await this.reopenLaunchApplication.triageApplication.triageRepositories.saveReviewSession(
      updatedReviewSession,
      { expectedVersion: options.context.reviewSessionDocument.version },
    );

    const updatedLaunchContext = options.context.launchContextDocument.update({
      nextTaskBlockingReasonRefs: options.completionEnvelope.blockingReasonRefs,
      nextTaskLaunchState: options.completionEnvelope.nextTaskLaunchState,
      nextTaskRankSnapshotRef: options.completionEnvelope.sourceQueueRankSnapshotRef,
      departingTaskReturnStubState:
        options.completionEnvelope.authoritativeSettlementState === "pending" ? "none" : "pinned",
      updatedAt: options.recordedAt,
    });
    await this.reopenLaunchApplication.triageApplication.triageRepositories.saveLaunchContext(
      updatedLaunchContext,
      { expectedVersion: options.context.launchContextDocument.version },
    );
  }

  private async loadReconciliationContext(taskId: string) {
    const taskDocument = await this.requireTask(taskId);
    const reviewSessionDocument = await this.requireLatestReviewSession(taskId);
    const launchContextDocument = await this.requireLaunchContext(taskDocument.toSnapshot().launchContextRef);
    const completionBundle = await this.service.queryTaskBundle(taskId);
    const reopenBundle = await this.reopenLaunchApplication.queryTaskReopenLaunch(taskId);
    const directResolution = await this.reopenLaunchApplication.directResolutionApplication.queryTaskDirectResolution(
      taskId,
    );
    const approval = await this.reopenLaunchApplication.approvalApplication.queryTaskApprovalEscalation(
      taskId,
    );
    const latestTaskCommandSettlement = await this.findLatestTaskCommandSettlement(taskId);
    return {
      taskDocument,
      reviewSessionDocument,
      launchContextDocument,
      task: taskDocument.toSnapshot() as TaskSnapshot,
      reviewSession: reviewSessionDocument.toSnapshot() as ReviewSessionSnapshot,
      launchContext: launchContextDocument.toSnapshot() as LaunchContextSnapshot,
      completionEnvelope: completionBundle.completionEnvelope,
      operatorHandoffFrame: completionBundle.operatorHandoffFrame,
      workspaceContinuityEvidenceProjection:
        await this.workspaceRepositories.getLatestWorkspaceContinuityEvidenceProjection(taskId),
      workspaceTrustEnvelope:
        await this.workspaceRepositories.getLatestWorkspaceTrustEnvelope(taskId),
      nextTaskLaunchLease: reopenBundle.nextTaskLaunchLease,
      reopenRecord: reopenBundle.reopenRecord,
      directResolution,
      approval,
      latestTaskCommandSettlement,
    };
  }

  private async requireTask(taskId: string) {
    const task = await this.reopenLaunchApplication.triageApplication.triageRepositories.getTask(taskId);
    invariant(task, "TRIAGE_TASK_NOT_FOUND", `TriageTask ${taskId} is required.`);
    return task;
  }

  private async requireLatestReviewSession(taskId: string) {
    const task = await this.requireTask(taskId);
    const activeReviewSessionRef = task.toSnapshot().activeReviewSessionRef;
    if (activeReviewSessionRef) {
      const active = await this.reopenLaunchApplication.triageApplication.triageRepositories.getReviewSession(
        activeReviewSessionRef,
      );
      invariant(active, "REVIEW_SESSION_NOT_FOUND", `ReviewSession ${activeReviewSessionRef} is required.`);
      return active;
    }
    const sessions = await this.reopenLaunchApplication.triageApplication.triageRepositories.listReviewSessions();
    const latest = [...sessions]
      .filter((entry) => entry.toSnapshot().taskId === taskId)
      .sort((left, right) =>
        left.toSnapshot().openedAt.localeCompare(right.toSnapshot().openedAt),
      )
      .at(-1);
    invariant(latest, "REVIEW_SESSION_NOT_FOUND", `A review session is required for ${taskId}.`);
    return latest;
  }

  private async requireLaunchContext(launchContextRef: string) {
    const launchContext =
      await this.reopenLaunchApplication.triageApplication.triageRepositories.getLaunchContext(
        launchContextRef,
      );
    invariant(
      launchContext,
      "TASK_LAUNCH_CONTEXT_NOT_FOUND",
      `TaskLaunchContext ${launchContextRef} is required.`,
    );
    return launchContext;
  }

  private async findLatestTaskCommandSettlement(taskId: string) {
    const settlements =
      await this.reopenLaunchApplication.triageApplication.triageRepositories.listTaskCommandSettlements();
    return [...settlements]
      .filter((entry) => entry.toSnapshot().taskId === taskId)
      .sort((left, right) => left.toSnapshot().recordedAt.localeCompare(right.toSnapshot().recordedAt))
      .at(-1)
      ?.toSnapshot();
  }
}

export function createPhase3TaskCompletionContinuityApplication(options?: {
  reopenLaunchApplication?: Phase3ReopenLaunchApplication;
  repositories?: Phase3TaskCompletionContinuityRepositories;
  workspaceRepositories?: WorkspaceProjectionDependencies;
  idGenerator?: BackboneIdGenerator;
}): Phase3TaskCompletionContinuityApplication {
  return new Phase3TaskCompletionContinuityApplicationImpl(options);
}
