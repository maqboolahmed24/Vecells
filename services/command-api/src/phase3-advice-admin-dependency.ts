import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type RequestSnapshot,
} from "@vecells/domain-kernel";
import {
  createPhase3AdviceAdminDependencyKernelService,
  createPhase3AdviceAdminDependencyKernelStore,
  type AdviceAdminDependencyProjection,
  type AdviceAdminDependencySetSnapshot,
  type EvaluateAdviceAdminDependencySetInput,
  type Phase3AdviceAdminDependencyBundle,
  type Phase3AdviceAdminDependencyRepositories,
  type Phase3AdviceAdminDependencyKernelService,
  type Phase3TriageTaskSnapshot,
} from "@vecells/domain-triage-workspace";
import {
  createPhase3AdminResolutionPolicyApplication,
  phase3AdminResolutionPolicyMigrationPlanRefs,
  phase3AdminResolutionPolicyPersistenceTables,
  type Phase3AdminResolutionPolicyApplication,
  type Phase3AdminResolutionPolicyApplicationBundle,
} from "./phase3-admin-resolution-policy";
import {
  createPhase3AdviceRenderApplication,
  phase3AdviceRenderMigrationPlanRefs,
  phase3AdviceRenderPersistenceTables,
  type Phase3AdviceRenderApplication,
  type Phase3AdviceRenderApplicationBundle,
} from "./phase3-advice-render-settlement";
import {
  createPhase3CommunicationReachabilityRepairApplication,
  phase3CommunicationRepairMigrationPlanRefs,
  phase3CommunicationRepairPersistenceTables,
  type CommunicationRepairBindingBundle,
  type Phase3CommunicationRepairApplication,
  type Phase3CommunicationRepairTaskBundle,
} from "./phase3-communication-reachability-repair";
import {
  createPhase3PatientConversationProjectionApplication,
  type Phase3PatientConversationProjectionApplication,
  type Phase3PatientConversationProjectionQueryResult,
} from "./phase3-patient-conversation-projections";
import {
  createPhase3SelfCareBoundaryApplication,
  type Phase3SelfCareBoundaryApplication,
  type Phase3SelfCareBoundaryApplicationBundle,
} from "./phase3-self-care-boundary-grants";
import {
  createPhase3TriageKernelApplication,
  type Phase3TriageKernelApplication,
} from "./phase3-triage-kernel";

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

export const PHASE3_ADVICE_ADMIN_DEPENDENCY_SERVICE_NAME =
  "Phase3AdviceAdminDependencyApplication";
export const PHASE3_ADVICE_ADMIN_DEPENDENCY_SCHEMA_VERSION =
  "252.phase3.advice-admin-dependency-set.v1";
export const PHASE3_ADVICE_ADMIN_DEPENDENCY_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/{taskId}/advice-admin-dependency",
] as const;

export const phase3AdviceAdminDependencyRoutes = [
  {
    routeId: "workspace_task_advice_admin_dependency_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/advice-admin-dependency",
    contractFamily: "AdviceAdminDependencySetBundleContract",
    purpose:
      "Expose the current AdviceAdminDependencySet, dominant blocker, dominant recovery route, and reopen posture for the active self-care or bounded-admin tuple.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_evaluate_advice_admin_dependency_set",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}:evaluate-advice-admin-dependency-set",
    contractFamily: "EvaluateAdviceAdminDependencySetCommandContract",
    purpose:
      "Evaluate dependency legality for the live boundary tuple and reject stale tuple writes as stale_recoverable instead of silently mutating consequence state.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_refresh_advice_admin_dependency_set",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}:refresh-advice-admin-dependency-set",
    contractFamily: "RefreshAdviceAdminDependencySetCommandContract",
    purpose:
      "Refresh the current AdviceAdminDependencySet against canonical reachability, render, admin, and conversation truth while preserving idempotent reuse on the same tuple.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_recalculate_advice_admin_reopen_state",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}:recalculate-advice-admin-reopen-state",
    contractFamily: "RecalculateAdviceAdminReopenStateCommandContract",
    purpose:
      "Recalculate reopen and clinical reentry posture from the canonical trigger registry when dependency blockers or boundary drift change under the same request lineage.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase3AdviceAdminDependencyPersistenceTables = [
  ...new Set([
    ...phase3AdviceRenderPersistenceTables,
    ...phase3AdminResolutionPolicyPersistenceTables,
    ...phase3CommunicationRepairPersistenceTables,
    "phase3_advice_admin_dependency_sets",
  ]),
] as const;

export const phase3AdviceAdminDependencyMigrationPlanRefs = [
  ...new Set([
    ...phase3AdviceRenderMigrationPlanRefs,
    ...phase3AdminResolutionPolicyMigrationPlanRefs,
    ...phase3CommunicationRepairMigrationPlanRefs,
    "services/command-api/migrations/128_phase3_advice_admin_dependency_set_engine.sql",
  ]),
] as const;

export interface AdviceAdminIdentityBlockingSnapshot {
  requestRef: string;
  identityRepairCaseRef: string | null;
  blockingVersionRef: string | null;
  blockingState: "clear" | "blocked_pending_identity";
  recoveryRouteRef: string | null;
  reasonCodeRefs: readonly string[];
}

interface AdviceAdminIdentityBlockingPort {
  queryRequestIdentityBlocking(
    requestRef: string,
  ): Promise<AdviceAdminIdentityBlockingSnapshot | null>;
}

export interface Phase3AdviceAdminDependencyApplicationBundle {
  dependencyBundle: Phase3AdviceAdminDependencyBundle;
  projection: AdviceAdminDependencyProjection;
  triageTask: Phase3TriageTaskSnapshot | null;
  selfCareBoundaryBundle: Phase3SelfCareBoundaryApplicationBundle | null;
  adviceRenderBundle: Phase3AdviceRenderApplicationBundle | null;
  adminResolutionBundle: Phase3AdminResolutionPolicyApplicationBundle | null;
  communicationRepairBundle: Phase3CommunicationRepairTaskBundle | null;
  conversationProjection: Phase3PatientConversationProjectionQueryResult | null;
  identityBlocking: AdviceAdminIdentityBlockingSnapshot | null;
  currentBoundaryTupleHash: string | null;
  currentDecisionEpochRef: string | null;
  currentDependencySetRef: string | null;
}

export interface AdviceAdminDependencyMutationInput {
  taskId: string;
  actorRef: string;
  evaluatedAt: string;
  presentedBoundaryTupleHash?: string | null;
  presentedDecisionEpochRef?: string | null;
  presentedDependencySetRef?: string | null;
}

export interface AdviceAdminDependencyMutationResult
  extends Phase3AdviceAdminDependencyApplicationBundle {
  result: "applied" | "stale_recoverable";
  reasonCodeRefs: readonly string[];
}

interface AdviceAdminDependencyContext {
  task: Phase3TriageTaskSnapshot;
  request: RequestSnapshot;
  selfCareBoundaryBundle: Phase3SelfCareBoundaryApplicationBundle;
  adviceRenderBundle: Phase3AdviceRenderApplicationBundle;
  adminResolutionBundle: Phase3AdminResolutionPolicyApplicationBundle;
  communicationRepairBundle: Phase3CommunicationRepairTaskBundle;
  conversationProjection: Phase3PatientConversationProjectionQueryResult | null;
  identityBlocking: AdviceAdminIdentityBlockingSnapshot | null;
  dependencyBundle: Phase3AdviceAdminDependencyBundle;
}

type TriageTaskSnapshot = AdviceAdminDependencyContext["task"];

function pickRepairBinding(
  bundle: Phase3CommunicationRepairTaskBundle,
): CommunicationRepairBindingBundle | null {
  const candidates = [bundle.messageRepair, bundle.callbackRepair].filter(
    (value): value is CommunicationRepairBindingBundle => value !== null,
  );
  if (candidates.length === 0) {
    return null;
  }
  const preferred =
    candidates.find((candidate) => candidate.binding.bindingState !== "clear") ?? candidates[0];
  return preferred ?? null;
}

function pickCurrentDecisionEpochRef(
  boundaryDecisionEpochRef: string,
  task: TriageTaskSnapshot,
  adviceRenderBundle: Phase3AdviceRenderApplicationBundle,
  adminResolutionBundle: Phase3AdminResolutionPolicyApplicationBundle,
): string {
  const candidates = [
    adviceRenderBundle.renderBundle.currentRenderSettlement?.decisionEpochRef ?? null,
    adminResolutionBundle.adminResolutionBundle.currentAdminResolutionCase?.decisionEpochRef ?? null,
    task.currentDecisionEpochRef ?? null,
  ]
    .map(optionalRef)
    .filter((value): value is string => value !== null);
  return candidates.find((value) => value !== boundaryDecisionEpochRef) ?? candidates[0] ?? boundaryDecisionEpochRef;
}

function inferConsentCheckpoint(
  conversationProjection: Phase3PatientConversationProjectionQueryResult | null,
): { consentCheckpointRef: string | null; consentRecoveryRouteRef: string | null } {
  const lease = conversationProjection?.controlCluster?.activeComposerLease ?? null;
  const consentCheckpointRef = optionalRef(lease?.consentCheckpointRef);
  return {
    consentCheckpointRef,
    consentRecoveryRouteRef:
      consentCheckpointRef !== null
        ? `/workspace/tasks/${conversationProjection?.taskId ?? "unknown"}/communications/consent`
        : null,
  };
}

function inferDeliveryDispute(
  conversationProjection: Phase3PatientConversationProjectionQueryResult | null,
): { deliveryDisputeRef: string | null; deliveryDisputeRecoveryRouteRef: string | null } {
  const digest = conversationProjection?.controlCluster?.digest ?? null;
  if (!digest || digest.deliveryDisputeState !== "disputed") {
    return {
      deliveryDisputeRef: null,
      deliveryDisputeRecoveryRouteRef: null,
    };
  }
  return {
    deliveryDisputeRef:
      optionalRef(digest.latestSettlementRef) ??
      optionalRef(digest.latestReceiptEnvelopeRef) ??
      digest.digestId,
    deliveryDisputeRecoveryRouteRef:
      optionalRef(digest.recoveryRouteRef) ??
      `/workspace/tasks/${conversationProjection?.taskId ?? "unknown"}/communications/dispute`,
  };
}

class NullAdviceAdminIdentityBlockingPort implements AdviceAdminIdentityBlockingPort {
  async queryRequestIdentityBlocking(): Promise<AdviceAdminIdentityBlockingSnapshot | null> {
    return null;
  }
}

export interface Phase3AdviceAdminDependencyApplication {
  readonly serviceName: typeof PHASE3_ADVICE_ADMIN_DEPENDENCY_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_ADVICE_ADMIN_DEPENDENCY_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_ADVICE_ADMIN_DEPENDENCY_QUERY_SURFACES;
  readonly routes: typeof phase3AdviceAdminDependencyRoutes;
  readonly triageApplication: Pick<
    Phase3TriageKernelApplication,
    "triageRepositories" | "controlPlaneRepositories"
  >;
  readonly selfCareBoundaryApplication: Pick<
    Phase3SelfCareBoundaryApplication,
    "queryTaskSelfCareBoundary"
  >;
  readonly adviceRenderApplication: Pick<
    Phase3AdviceRenderApplication,
    "queryTaskAdviceRender"
  >;
  readonly adminResolutionApplication: Pick<
    Phase3AdminResolutionPolicyApplication,
    "queryTaskAdminResolution"
  >;
  readonly communicationRepairApplication: Pick<
    Phase3CommunicationRepairApplication,
    "queryTaskCommunicationRepair"
  >;
  readonly patientConversationProjectionApplication: Pick<
    Phase3PatientConversationProjectionApplication,
    "queryTaskPatientConversationProjection"
  >;
  readonly identityBlockingPort: AdviceAdminIdentityBlockingPort;
  readonly repositories: Phase3AdviceAdminDependencyRepositories;
  readonly service: Phase3AdviceAdminDependencyKernelService;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  queryTaskAdviceAdminDependency(
    taskId: string,
  ): Promise<Phase3AdviceAdminDependencyApplicationBundle | null>;
  fetchCurrentAdviceAdminDependencySet(
    taskId: string,
  ): Promise<Phase3AdviceAdminDependencyApplicationBundle | null>;
  evaluateAdviceAdminDependencySet(
    input: AdviceAdminDependencyMutationInput,
  ): Promise<AdviceAdminDependencyMutationResult>;
  refreshAdviceAdminDependencySet(
    input: AdviceAdminDependencyMutationInput,
  ): Promise<AdviceAdminDependencyMutationResult>;
  recalculateAdviceAdminReopenState(
    input: AdviceAdminDependencyMutationInput,
  ): Promise<AdviceAdminDependencyMutationResult>;
}

class Phase3AdviceAdminDependencyApplicationImpl
  implements Phase3AdviceAdminDependencyApplication
{
  readonly serviceName = PHASE3_ADVICE_ADMIN_DEPENDENCY_SERVICE_NAME;
  readonly schemaVersion = PHASE3_ADVICE_ADMIN_DEPENDENCY_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_ADVICE_ADMIN_DEPENDENCY_QUERY_SURFACES;
  readonly routes = phase3AdviceAdminDependencyRoutes;
  readonly triageApplication: Pick<
    Phase3TriageKernelApplication,
    "triageRepositories" | "controlPlaneRepositories"
  >;
  readonly selfCareBoundaryApplication: Pick<
    Phase3SelfCareBoundaryApplication,
    "queryTaskSelfCareBoundary"
  >;
  readonly adviceRenderApplication: Pick<
    Phase3AdviceRenderApplication,
    "queryTaskAdviceRender"
  >;
  readonly adminResolutionApplication: Pick<
    Phase3AdminResolutionPolicyApplication,
    "queryTaskAdminResolution"
  >;
  readonly communicationRepairApplication: Pick<
    Phase3CommunicationRepairApplication,
    "queryTaskCommunicationRepair"
  >;
  readonly patientConversationProjectionApplication: Pick<
    Phase3PatientConversationProjectionApplication,
    "queryTaskPatientConversationProjection"
  >;
  readonly identityBlockingPort: AdviceAdminIdentityBlockingPort;
  readonly repositories: Phase3AdviceAdminDependencyRepositories;
  readonly service: Phase3AdviceAdminDependencyKernelService;
  readonly persistenceTables = phase3AdviceAdminDependencyPersistenceTables;
  readonly migrationPlanRef = phase3AdviceAdminDependencyMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3AdviceAdminDependencyMigrationPlanRefs;

  private readonly idGenerator: BackboneIdGenerator;

  constructor(options?: {
    triageApplication?: Pick<
      Phase3TriageKernelApplication,
      "triageRepositories" | "controlPlaneRepositories"
    >;
    selfCareBoundaryApplication?: Pick<
      Phase3SelfCareBoundaryApplication,
      "queryTaskSelfCareBoundary"
    >;
    adviceRenderApplication?: Pick<
      Phase3AdviceRenderApplication,
      "queryTaskAdviceRender"
    >;
    adminResolutionApplication?: Pick<
      Phase3AdminResolutionPolicyApplication,
      "queryTaskAdminResolution"
    >;
    communicationRepairApplication?: Pick<
      Phase3CommunicationRepairApplication,
      "queryTaskCommunicationRepair"
    >;
    patientConversationProjectionApplication?: Pick<
      Phase3PatientConversationProjectionApplication,
      "queryTaskPatientConversationProjection"
    >;
    identityBlockingPort?: AdviceAdminIdentityBlockingPort;
    repositories?: Phase3AdviceAdminDependencyRepositories;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase3_advice_admin_dependency");
    this.triageApplication =
      options?.triageApplication ?? createPhase3TriageKernelApplication({ idGenerator: this.idGenerator });
    this.selfCareBoundaryApplication =
      options?.selfCareBoundaryApplication ??
      createPhase3SelfCareBoundaryApplication({
        idGenerator: this.idGenerator,
        triageApplication: this.triageApplication as Phase3TriageKernelApplication,
      });
    this.adviceRenderApplication =
      options?.adviceRenderApplication ??
      createPhase3AdviceRenderApplication({
        idGenerator: this.idGenerator,
        selfCareBoundaryApplication:
          this.selfCareBoundaryApplication as Pick<
            Phase3SelfCareBoundaryApplication,
            "queryTaskSelfCareBoundary"
          >,
      });
    this.adminResolutionApplication =
      options?.adminResolutionApplication ??
      createPhase3AdminResolutionPolicyApplication({
        idGenerator: this.idGenerator,
        selfCareBoundaryApplication:
          this.selfCareBoundaryApplication as Pick<
            Phase3SelfCareBoundaryApplication,
            "queryTaskSelfCareBoundary"
          >,
      });
    this.communicationRepairApplication =
      options?.communicationRepairApplication ??
      createPhase3CommunicationReachabilityRepairApplication({
        idGenerator: this.idGenerator,
        triageApplication: this.triageApplication as Phase3TriageKernelApplication,
      });
    this.patientConversationProjectionApplication =
      options?.patientConversationProjectionApplication ??
      createPhase3PatientConversationProjectionApplication({
        idGenerator: this.idGenerator,
        triageApplication: this.triageApplication as Phase3TriageKernelApplication,
        communicationRepairApplication:
          this.communicationRepairApplication as Pick<
            Phase3CommunicationRepairApplication,
            "queryTaskCommunicationRepair"
          >,
      });
    this.identityBlockingPort =
      options?.identityBlockingPort ?? new NullAdviceAdminIdentityBlockingPort();
    this.repositories =
      options?.repositories ?? createPhase3AdviceAdminDependencyKernelStore();
    this.service = createPhase3AdviceAdminDependencyKernelService(this.repositories, {
      idGenerator: this.idGenerator,
    });
  }

  async queryTaskAdviceAdminDependency(
    taskId: string,
  ): Promise<Phase3AdviceAdminDependencyApplicationBundle | null> {
    const context = await this.collectContext(taskId);
    if (!context) {
      return null;
    }
    return this.toApplicationBundle(context);
  }

  async fetchCurrentAdviceAdminDependencySet(
    taskId: string,
  ): Promise<Phase3AdviceAdminDependencyApplicationBundle | null> {
    return this.queryTaskAdviceAdminDependency(taskId);
  }

  async evaluateAdviceAdminDependencySet(
    input: AdviceAdminDependencyMutationInput,
  ): Promise<AdviceAdminDependencyMutationResult> {
    return this.applyMutation(input, "evaluate_advice_admin_dependency_set");
  }

  async refreshAdviceAdminDependencySet(
    input: AdviceAdminDependencyMutationInput,
  ): Promise<AdviceAdminDependencyMutationResult> {
    return this.applyMutation(input, "refresh_advice_admin_dependency_set");
  }

  async recalculateAdviceAdminReopenState(
    input: AdviceAdminDependencyMutationInput,
  ): Promise<AdviceAdminDependencyMutationResult> {
    return this.applyMutation(input, "recalculate_advice_admin_reopen_state");
  }

  private async applyMutation(
    input: AdviceAdminDependencyMutationInput,
    evaluationTriggerRef: string,
  ): Promise<AdviceAdminDependencyMutationResult> {
    const evaluatedAt = ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt");
    const actorRef = requireRef(input.actorRef, "actorRef");
    const context = await this.requireContext(input.taskId);
    const staleReasonCodeRefs = this.validatePresentedTuple(input, context);
    if (staleReasonCodeRefs.length > 0) {
      const bundle = this.toApplicationBundle(context);
      return {
        ...bundle,
        result: "stale_recoverable",
        reasonCodeRefs: staleReasonCodeRefs,
      };
    }

    const evaluationInput = this.buildEvaluationInput(context, {
      actorRef,
      evaluatedAt,
      evaluationTriggerRef,
    });
    if (evaluationTriggerRef === "refresh_advice_admin_dependency_set") {
      await this.service.refreshAdviceAdminDependencySet(evaluationInput);
    } else if (evaluationTriggerRef === "recalculate_advice_admin_reopen_state") {
      await this.service.recalculateAdviceAdminReopenState(evaluationInput);
    } else {
      await this.service.evaluateAdviceAdminDependencySet(evaluationInput);
    }

    const refreshed = await this.requireContext(input.taskId);
    const bundle = this.toApplicationBundle(refreshed);
    return {
      ...bundle,
      result: "applied",
      reasonCodeRefs: bundle.dependencyBundle.projection.currentAdviceAdminDependencySet?.reasonCodeRefs ?? [],
    };
  }

  private async requireContext(taskId: string): Promise<AdviceAdminDependencyContext> {
    const context = await this.collectContext(taskId);
    invariant(
      context !== null,
      "TASK_CONTEXT_NOT_FOUND",
      `Task ${taskId} is required for advice/admin dependency evaluation.`,
    );
    invariant(
      context.selfCareBoundaryBundle.boundaryBundle.currentBoundaryDecision !== null,
      "BOUNDARY_DECISION_REQUIRED",
      `Task ${taskId} requires a current SelfCareBoundaryDecision.`,
    );
    return context;
  }

  private async collectContext(
    taskId: string,
  ): Promise<AdviceAdminDependencyContext | null> {
    const taskDocument = await this.triageApplication.triageRepositories.getTask(
      requireRef(taskId, "taskId"),
    );
    if (!taskDocument) {
      return null;
    }
    const task = taskDocument.toSnapshot();
    const requestAggregate = await this.triageApplication.controlPlaneRepositories.getRequest(
      task.requestId,
    );
    invariant(
      requestAggregate,
      "REQUEST_NOT_FOUND",
      `Request ${task.requestId} is required for task ${task.taskId}.`,
    );
    const request = requestAggregate.toSnapshot();
    const [
      selfCareBoundaryBundle,
      adviceRenderBundle,
      adminResolutionBundle,
      communicationRepairBundle,
      conversationProjection,
      identityBlocking,
      dependencyBundle,
    ] = await Promise.all([
      this.selfCareBoundaryApplication.queryTaskSelfCareBoundary(task.taskId),
      this.adviceRenderApplication.queryTaskAdviceRender(task.taskId),
      this.adminResolutionApplication.queryTaskAdminResolution(task.taskId),
      this.communicationRepairApplication.queryTaskCommunicationRepair(task.taskId),
      this.patientConversationProjectionApplication.queryTaskPatientConversationProjection({
        taskId: task.taskId,
        audienceTier: "patient_authenticated",
        trustPosture: "trusted",
      }),
      this.identityBlockingPort.queryRequestIdentityBlocking(request.requestId),
      this.service.queryTaskBundle(task.taskId),
    ]);

    return {
      task,
      request,
      selfCareBoundaryBundle,
      adviceRenderBundle,
      adminResolutionBundle,
      communicationRepairBundle,
      conversationProjection,
      identityBlocking,
      dependencyBundle,
    };
  }

  private buildEvaluationInput(
    context: AdviceAdminDependencyContext,
    command: {
      actorRef: string;
      evaluatedAt: string;
      evaluationTriggerRef: string;
    },
  ): EvaluateAdviceAdminDependencySetInput {
    const boundaryDecision =
      context.selfCareBoundaryBundle.boundaryBundle.currentBoundaryDecision;
    invariant(
      boundaryDecision !== null,
      "BOUNDARY_DECISION_REQUIRED",
      `Task ${context.task.taskId} requires a current SelfCareBoundaryDecision.`,
    );
    const currentSet = context.dependencyBundle.currentAdviceAdminDependencySet;
    const selectedRepair = pickRepairBinding(context.communicationRepairBundle);
    const digest = context.conversationProjection?.controlCluster?.digest ?? null;
    const currentAdminCase =
      context.adminResolutionBundle.adminResolutionBundle.currentAdminResolutionCase;
    const { consentCheckpointRef, consentRecoveryRouteRef } = inferConsentCheckpoint(
      context.conversationProjection,
    );
    const { deliveryDisputeRef, deliveryDisputeRecoveryRouteRef } = inferDeliveryDispute(
      context.conversationProjection,
    );
    const identityBlocking = context.identityBlocking;
    const currentDecisionEpochRef = pickCurrentDecisionEpochRef(
      boundaryDecision.decisionEpochRef,
      context.task,
      context.adviceRenderBundle,
      context.adminResolutionBundle,
    );

    return {
      taskId: context.task.taskId,
      requestRef: boundaryDecision.requestRef ?? context.request.requestId,
      boundaryDecisionRef: boundaryDecision.selfCareBoundaryDecisionId,
      boundaryTupleHash: boundaryDecision.boundaryTupleHash,
      boundaryDecisionState: boundaryDecision.decisionState,
      boundaryState: boundaryDecision.boundaryState,
      boundaryReopenState: boundaryDecision.reopenState,
      boundaryEvidenceSnapshotRef: boundaryDecision.evidenceSnapshotRef,
      decisionEpochRef: boundaryDecision.decisionEpochRef,
      decisionSupersessionRecordRef:
        boundaryDecision.decisionSupersessionRecordRef ??
        context.task.latestDecisionSupersessionRef ??
        null,
      lineageFenceEpoch: boundaryDecision.lineageFenceEpoch,
      adminResolutionSubtypeRef:
        context.adminResolutionBundle.normalizedBoundarySubtypeRef ??
        boundaryDecision.adminResolutionSubtypeRef ??
        currentAdminCase?.adminResolutionSubtypeRef ??
        null,
      currentDecisionEpochRef,
      currentLineageFenceEpoch: context.task.currentLineageFenceEpoch,
      currentEvidenceSnapshotRef: context.request.currentEvidenceSnapshotRef,
      currentSafetyPreemptionRef: context.request.currentSafetyPreemptionRef,
      currentUrgentDiversionSettlementRef:
        context.request.currentUrgentDiversionSettlementRef ??
        context.conversationProjection?.controlCluster?.urgentDiversion?.currentUrgentDiversionSettlementRef ??
        null,
      taskStatus: context.task.status,
      adviceRenderSettlementRef:
        context.adviceRenderBundle.renderBundle.currentRenderSettlement?.adviceRenderSettlementId ??
        boundaryDecision.adviceRenderSettlementRef ??
        currentSet?.adviceRenderSettlementRef ??
        null,
      currentAdviceRenderState:
        context.adviceRenderBundle.renderBundle.currentRenderSettlement?.renderState ??
        context.adviceRenderBundle.effectiveRenderState ??
        null,
      currentAdviceRenderTrustState:
        context.adviceRenderBundle.renderBundle.currentRenderSettlement?.trustState ?? null,
      adminResolutionCaseRef:
        currentAdminCase?.adminResolutionCaseId ??
        boundaryDecision.adminResolutionCaseRef ??
        currentSet?.adminResolutionCaseRef ??
        null,
      currentAdminResolutionCaseState:
        context.adminResolutionBundle.effectiveCaseState ?? currentAdminCase?.caseState ?? null,
      currentAdminResolutionWaitingState: currentAdminCase?.waitingState ?? null,
      currentAdminResolutionDependencyShape:
        currentAdminCase?.waitingDependencyShape ?? null,
      currentAdminResolutionReasonRef:
        currentAdminCase?.waitingReasonCodeRef ?? null,
      currentAdminResolutionContinuityState:
        context.adminResolutionBundle.continuityEvaluation.effectiveCaseState === "frozen"
          ? "frozen"
          : "current",
      currentAdminResolutionContinuityReasons:
        context.adminResolutionBundle.effectiveReasonCodeRefs,
      reachabilityDependencyRef:
        selectedRepair?.binding.reachabilityDependencyRef ??
        optionalRef(digest?.reachabilityDependencyRef) ??
        currentSet?.reachabilityDependencyRef ??
        null,
      contactRepairJourneyRef:
        selectedRepair?.binding.activeRepairJourneyRef ??
        optionalRef(digest?.contactRepairJourneyRef) ??
        currentSet?.contactRepairJourneyRef ??
        null,
      reachabilityEpoch:
        selectedRepair?.binding.currentReachabilityEpoch ??
        digest?.reachabilityEpoch ??
        currentSet?.reachabilityEpoch ??
        null,
      reachabilityAssessmentState:
        selectedRepair?.assessment.assessmentState ??
        (digest?.repairRequiredState === "contact_route_repair" ? "blocked" : null),
      reachabilityRouteAuthorityState:
        selectedRepair?.assessment.routeAuthorityState ?? null,
      reachabilityRecoveryRouteRef:
        selectedRepair?.binding.recoveryRouteRef ??
        optionalRef(digest?.recoveryRouteRef) ??
        null,
      deliveryDisputeRef,
      deliveryDisputeRecoveryRouteRef,
      consentCheckpointRef,
      consentRecoveryRouteRef,
      identityRepairCaseRef:
        identityBlocking?.identityRepairCaseRef ??
        currentSet?.identityRepairCaseRef ??
        null,
      identityBlockingVersionRef:
        identityBlocking?.blockingVersionRef ??
        context.request.currentIdentityBindingRef ??
        currentSet?.identityBlockingVersionRef ??
        null,
      identityRecoveryRouteRef:
        identityBlocking?.recoveryRouteRef ??
        `/workspace/tasks/${context.task.taskId}/identity-repair`,
      externalDependencyRef:
        currentAdminCase?.waitingState === "awaiting_external_dependency" ||
        currentAdminCase?.waitingState === "awaiting_practice_action" ||
        currentAdminCase?.waitingState === "patient_document_return"
          ? currentAdminCase.waitingReasonCodeRef ??
            currentAdminCase.waitingExpiryOrRepairRuleRef ??
            currentAdminCase.adminResolutionCaseId
          : null,
      externalDependencyVersionRef:
        currentAdminCase?.caseVersionRef ?? null,
      externalRecoveryRouteRef:
        currentAdminCase
          ? `/workspace/tasks/${context.task.taskId}/admin-resolution/${currentAdminCase.adminResolutionCaseId}/waiting`
          : `/workspace/tasks/${context.task.taskId}/admin-resolution/waiting`,
      reasonCodeRefs: uniqueSorted([
        ...context.adviceRenderBundle.effectiveReasonCodeRefs,
        ...context.adminResolutionBundle.effectiveReasonCodeRefs,
        ...(identityBlocking?.reasonCodeRefs ?? []),
      ]),
      evaluationTriggerRef: command.evaluationTriggerRef,
      evaluatedByRef: command.actorRef,
      evaluatedAt: command.evaluatedAt,
    };
  }

  private validatePresentedTuple(
    input: AdviceAdminDependencyMutationInput,
    context: AdviceAdminDependencyContext,
  ): readonly string[] {
    const boundaryDecision =
      context.selfCareBoundaryBundle.boundaryBundle.currentBoundaryDecision;
    const currentBoundaryTupleHash = boundaryDecision?.boundaryTupleHash ?? null;
    const currentDecisionEpochRef = boundaryDecision?.decisionEpochRef ?? null;
    const currentDependencySetRef =
      context.dependencyBundle.currentAdviceAdminDependencySet?.adviceAdminDependencySetId ?? null;
    const reasons = new Set<string>();

    if (
      optionalRef(input.presentedBoundaryTupleHash) !== null &&
      optionalRef(input.presentedBoundaryTupleHash) !== currentBoundaryTupleHash
    ) {
      reasons.add("stale_boundary_tuple_hash");
    }
    if (
      optionalRef(input.presentedDecisionEpochRef) !== null &&
      optionalRef(input.presentedDecisionEpochRef) !== currentDecisionEpochRef
    ) {
      reasons.add("stale_decision_epoch");
    }
    if (
      optionalRef(input.presentedDependencySetRef) !== null &&
      optionalRef(input.presentedDependencySetRef) !== currentDependencySetRef
    ) {
      reasons.add("stale_advice_admin_dependency_set");
    }

    return uniqueSorted([...reasons]);
  }

  private toApplicationBundle(
    context: AdviceAdminDependencyContext,
  ): Phase3AdviceAdminDependencyApplicationBundle {
    const boundaryDecision =
      context.selfCareBoundaryBundle.boundaryBundle.currentBoundaryDecision;
    const currentDependencySet = context.dependencyBundle.currentAdviceAdminDependencySet;
    return {
      dependencyBundle: context.dependencyBundle,
      projection: context.dependencyBundle.projection,
      triageTask: context.task,
      selfCareBoundaryBundle: context.selfCareBoundaryBundle,
      adviceRenderBundle: context.adviceRenderBundle,
      adminResolutionBundle: context.adminResolutionBundle,
      communicationRepairBundle: context.communicationRepairBundle,
      conversationProjection: context.conversationProjection,
      identityBlocking: context.identityBlocking,
      currentBoundaryTupleHash: boundaryDecision?.boundaryTupleHash ?? null,
      currentDecisionEpochRef: boundaryDecision?.decisionEpochRef ?? null,
      currentDependencySetRef:
        currentDependencySet?.adviceAdminDependencySetId ?? null,
    };
  }
}

export function createPhase3AdviceAdminDependencyApplication(options?: {
  triageApplication?: Pick<
    Phase3TriageKernelApplication,
    "triageRepositories" | "controlPlaneRepositories"
  >;
  selfCareBoundaryApplication?: Pick<
    Phase3SelfCareBoundaryApplication,
    "queryTaskSelfCareBoundary"
  >;
  adviceRenderApplication?: Pick<
    Phase3AdviceRenderApplication,
    "queryTaskAdviceRender"
  >;
  adminResolutionApplication?: Pick<
    Phase3AdminResolutionPolicyApplication,
    "queryTaskAdminResolution"
  >;
  communicationRepairApplication?: Pick<
    Phase3CommunicationRepairApplication,
    "queryTaskCommunicationRepair"
  >;
  patientConversationProjectionApplication?: Pick<
    Phase3PatientConversationProjectionApplication,
    "queryTaskPatientConversationProjection"
  >;
  identityBlockingPort?: AdviceAdminIdentityBlockingPort;
  repositories?: Phase3AdviceAdminDependencyRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase3AdviceAdminDependencyApplication {
  return new Phase3AdviceAdminDependencyApplicationImpl(options);
}
