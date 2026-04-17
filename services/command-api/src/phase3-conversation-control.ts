import {
  createPhase3ConversationControlService,
  createPhase3ConversationControlStore,
  type AcquirePatientComposerLeaseInput,
  type AcquirePatientComposerLeaseResult,
  type ConversationAuthoritativeOutcomeState,
  type ConversationCommandResult,
  type ConversationCommandSettlementSnapshot,
  type ConversationControlRepositories,
  type ConversationExternalObservationState,
  type ConversationLocalAckState,
  type ConversationStateConfidenceBand,
  type ConversationTransportState,
  type ConversationTupleCompatibilitySnapshot,
  type PatientComposerLeaseSnapshot,
  type Phase3ConversationControlClusterBundle,
  type Phase3ConversationControlService,
  type RecordConversationSettlementInput,
  type RecordConversationSettlementResult,
  type RecoveryContinuationTokenSnapshot,
  type RecomputePatientUrgentDiversionInput,
} from "@vecells/domain-communications";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import type {
  ProtectedCompositionMode,
  ProtectedCompositionValidityState,
  WorkspaceFocusProtectionLeaseState,
  WorkspaceInvalidatingDriftState,
} from "@vecells/domain-identity-access";
import {
  createPhase3CommunicationReachabilityRepairApplication,
  phase3CommunicationRepairMigrationPlanRefs,
  phase3CommunicationRepairPersistenceTables,
  type Phase3CommunicationRepairApplication,
  type Phase3CommunicationRepairTaskBundle,
} from "./phase3-communication-reachability-repair";
import {
  createPhase3TriageKernelApplication,
  phase3TriageKernelMigrationPlanRefs,
  phase3TriageKernelPersistenceTables,
  type Phase3TriageKernelApplication,
} from "./phase3-triage-kernel";

export const PHASE3_CONVERSATION_CONTROL_SERVICE_NAME =
  "Phase3ConversationDigestSettlementApplication";
export const PHASE3_CONVERSATION_CONTROL_SCHEMA_VERSION =
  "246.phase3.conversation-digest-settlement.v1";
export const PHASE3_CONVERSATION_CONTROL_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/{taskId}/conversation-control",
  "GET /v1/me/messages/{clusterId}/conversation-control",
] as const;

export const phase3ConversationControlRoutes = [
  {
    routeId: "workspace_task_conversation_control_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/conversation-control",
    contractFamily: "ConversationControlTaskBundleContract",
    purpose:
      "Expose the task-scoped canonical PatientConversationPreviewDigest, PatientComposerLease, PatientUrgentDiversionState, ConversationCommandSettlement, and communication-repair compatibility bundle without restitching thread truth locally.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "patient_portal_conversation_control_current",
    method: "GET",
    path: "/v1/me/messages/{clusterId}/conversation-control",
    contractFamily: "ConversationControlClusterBundleContract",
    purpose:
      "Resolve the current cluster digest, composer, urgent-diversion, and latest settlement posture from the canonical 246 control plane rather than draft or scroll-local state.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "internal_conversation_tuple_publish",
    method: "POST",
    path: "/internal/v1/conversations/tuples:publish",
    contractFamily: "ConversationTupleCompatibilityContract",
    purpose:
      "Publish the 246/247 tuple compatibility snapshot as the only input to digest and composer derivation, without local thread reconstruction in this service.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "patient_portal_conversation_acquire_composer",
    method: "POST",
    path: "/v1/me/messages/{clusterId}:acquire-composer",
    contractFamily: "AcquirePatientComposerLeaseCommandContract",
    purpose:
      "Acquire or reuse the single live PatientComposerLease for the current cluster while preserving the active anchor and draft across refresh or reconnect.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "patient_portal_conversation_release_composer",
    method: "POST",
    path: "/v1/me/messages/{clusterId}/composer-leases/{leaseId}:release",
    contractFamily: "ReleasePatientComposerLeaseCommandContract",
    purpose:
      "Release the live PatientComposerLease explicitly instead of allowing hidden secondary composers or silent local draft orphaning.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "internal_conversation_urgent_diversion_recompute",
    method: "POST",
    path: "/internal/v1/conversations/clusters/{clusterId}:recompute-urgent-diversion",
    contractFamily: "PatientUrgentDiversionStateCommandContract",
    purpose:
      "Recompute PatientUrgentDiversionState so unsafe async messaging freezes composition in place and redirects the dominant action without losing the current cluster.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "internal_message_conversation_settlement_record",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/message-thread/{threadId}:record-conversation-settlement",
    contractFamily: "RecordConversationCommandSettlementCommandContract",
    purpose:
      "Record the canonical message mutation settlement with local ack, transport, external observation, and authoritative outcome held apart under one immutable conversation receipt grammar.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "internal_callback_conversation_settlement_record",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:record-conversation-settlement",
    contractFamily: "RecordConversationCommandSettlementCommandContract",
    purpose:
      "Record the canonical callback mutation settlement with bounded same-shell recovery and without collapsing staff acknowledgement into final callback truth.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase3ConversationControlPersistenceTables = [
  ...new Set([
    ...phase3TriageKernelPersistenceTables,
    ...phase3CommunicationRepairPersistenceTables,
    "phase3_conversation_tuple_compatibility",
    "phase3_conversation_preview_digests",
    "phase3_patient_composer_leases",
    "phase3_patient_urgent_diversion_states",
    "phase3_conversation_command_settlements",
    "phase3_recovery_continuation_tokens",
  ]),
] as const;

export const phase3ConversationControlMigrationPlanRefs = [
  ...new Set([
    ...phase3TriageKernelMigrationPlanRefs,
    ...phase3CommunicationRepairMigrationPlanRefs,
    "services/command-api/migrations/122_phase3_conversation_digest_and_settlement.sql",
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

function isProtectedModeActive(
  mode: ProtectedCompositionMode | null | undefined,
  forceProtectedContext: boolean | undefined,
): boolean {
  if (forceProtectedContext) {
    return true;
  }
  return (
    mode === "drafting" ||
    mode === "compare_review" ||
    mode === "delivery_dispute_review"
  );
}

function normalizeSettlementAgainstTuple(input: {
  tuple: ConversationTupleCompatibilitySnapshot;
  result: ConversationCommandResult;
  authoritativeOutcomeState: ConversationAuthoritativeOutcomeState;
  stateConfidenceBand?: ConversationStateConfidenceBand;
}): Pick<
  RecordConversationSettlementInput,
  "result" | "authoritativeOutcomeState" | "stateConfidenceBand"
> {
  const { tuple } = input;
  if (
    tuple.tupleAvailabilityState !== "authoritative" ||
    tuple.continuityValidationState === "stale" ||
    tuple.continuityValidationState === "blocked"
  ) {
    return {
      result: "stale_recoverable",
      authoritativeOutcomeState: "recovery_required",
      stateConfidenceBand: "low",
    };
  }
  if (
    tuple.previewMode === "step_up_required" ||
    tuple.previewMode === "suppressed_recovery_only"
  ) {
    return {
      result: "blocked_policy",
      authoritativeOutcomeState: "recovery_required",
      stateConfidenceBand: "low",
    };
  }
  return {
    result: input.result,
    authoritativeOutcomeState: input.authoritativeOutcomeState,
    stateConfidenceBand: input.stateConfidenceBand,
  };
}

export interface StaffConversationMutationGuardInput {
  reviewActionLeaseRef?: string | null;
  focusProtectionLeaseRef?: string | null;
  focusProtectionLeaseState?: WorkspaceFocusProtectionLeaseState | null;
  protectedCompositionStateRef?: string | null;
  protectedCompositionMode?: ProtectedCompositionMode | null;
  protectedCompositionValidityState?: ProtectedCompositionValidityState | null;
  invalidatingDriftState?: WorkspaceInvalidatingDriftState | null;
  forceProtectedContext?: boolean;
}

export interface QueryConversationControlTaskInput {
  taskId: string;
}

export interface QueryConversationControlClusterInput {
  clusterRef: string;
}

export interface RecordMessageConversationSettlementInput {
  taskId: string;
  clusterRef: string;
  threadId: string;
  actorKind: "patient" | "staff";
  actionRecordRef: string;
  commandSettlementRef: string;
  actionScope: string;
  routeIntentBindingRef: string;
  causalToken: string;
  result: ConversationCommandResult;
  localAckState: ConversationLocalAckState;
  transportState: ConversationTransportState;
  externalObservationState: ConversationExternalObservationState;
  authoritativeOutcomeState: ConversationAuthoritativeOutcomeState;
  latestCommunicationEnvelopeRef?: string | null;
  latestReceiptEnvelopeRef?: string | null;
  verificationCheckpointRef?: string | null;
  sameShellRecoveryRef?: string | null;
  recordedAt: string;
  staffGuards?: StaffConversationMutationGuardInput | null;
}

export interface RecordCallbackConversationSettlementInput {
  taskId: string;
  clusterRef: string;
  callbackCaseId: string;
  actorKind: "patient" | "staff";
  actionRecordRef: string;
  commandSettlementRef: string;
  actionScope: string;
  routeIntentBindingRef: string;
  causalToken: string;
  result: ConversationCommandResult;
  localAckState: ConversationLocalAckState;
  transportState: ConversationTransportState;
  externalObservationState: ConversationExternalObservationState;
  authoritativeOutcomeState: ConversationAuthoritativeOutcomeState;
  latestCommunicationEnvelopeRef?: string | null;
  latestReceiptEnvelopeRef?: string | null;
  latestCallbackStatusRef?: string | null;
  verificationCheckpointRef?: string | null;
  sameShellRecoveryRef?: string | null;
  recordedAt: string;
  staffGuards?: StaffConversationMutationGuardInput | null;
}

export interface Phase3ConversationControlTaskQueryResult {
  taskId: string;
  clusters: readonly Phase3ConversationControlClusterBundle[];
  communicationRepair: Phase3CommunicationRepairTaskBundle;
}

export interface Phase3ConversationControlSettlementResult {
  cluster: Phase3ConversationControlClusterBundle;
  settlement: ConversationCommandSettlementSnapshot;
  recoveryContinuation: RecoveryContinuationTokenSnapshot | null;
  reusedExisting: boolean;
}

export interface Phase3ConversationControlApplication {
  readonly serviceName: typeof PHASE3_CONVERSATION_CONTROL_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_CONVERSATION_CONTROL_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_CONVERSATION_CONTROL_QUERY_SURFACES;
  readonly routes: typeof phase3ConversationControlRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly communicationRepairApplication: Phase3CommunicationRepairApplication;
  readonly repositories: ConversationControlRepositories;
  readonly service: Phase3ConversationControlService;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  publishConversationTuple(
    snapshot: ConversationTupleCompatibilitySnapshot,
  ): Promise<ConversationTupleCompatibilitySnapshot>;
  queryTaskConversationControl(
    input: QueryConversationControlTaskInput,
  ): Promise<Phase3ConversationControlTaskQueryResult>;
  queryConversationCluster(
    input: QueryConversationControlClusterInput,
  ): Promise<Phase3ConversationControlClusterBundle | null>;
  acquireComposerLease(input: AcquirePatientComposerLeaseInput): Promise<AcquirePatientComposerLeaseResult>;
  releaseComposerLease(input: {
    leaseId: string;
    releasedAt: string;
  }): Promise<PatientComposerLeaseSnapshot>;
  recomputeUrgentDiversion(
    input: RecomputePatientUrgentDiversionInput,
  ): Promise<Phase3ConversationControlClusterBundle>;
  recordMessageMutationSettlement(
    input: RecordMessageConversationSettlementInput,
  ): Promise<Phase3ConversationControlSettlementResult>;
  recordCallbackMutationSettlement(
    input: RecordCallbackConversationSettlementInput,
  ): Promise<Phase3ConversationControlSettlementResult>;
}

class Phase3ConversationControlApplicationImpl
  implements Phase3ConversationControlApplication
{
  readonly serviceName = PHASE3_CONVERSATION_CONTROL_SERVICE_NAME;
  readonly schemaVersion = PHASE3_CONVERSATION_CONTROL_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_CONVERSATION_CONTROL_QUERY_SURFACES;
  readonly routes = phase3ConversationControlRoutes;
  readonly triageApplication: Phase3TriageKernelApplication;
  readonly communicationRepairApplication: Phase3CommunicationRepairApplication;
  readonly repositories: ConversationControlRepositories;
  readonly service: Phase3ConversationControlService;
  readonly persistenceTables = phase3ConversationControlPersistenceTables;
  readonly migrationPlanRef = phase3ConversationControlMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3ConversationControlMigrationPlanRefs;
  private readonly idGenerator: BackboneIdGenerator;

  constructor(options?: {
    triageApplication?: Phase3TriageKernelApplication;
    communicationRepairApplication?: Phase3CommunicationRepairApplication;
    repositories?: ConversationControlRepositories;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("command_api_phase3_conversation_control");
    this.triageApplication =
      options?.triageApplication ??
      createPhase3TriageKernelApplication({ idGenerator: this.idGenerator });
    this.communicationRepairApplication =
      options?.communicationRepairApplication ??
      createPhase3CommunicationReachabilityRepairApplication({
        idGenerator: this.idGenerator,
        triageApplication: this.triageApplication,
      });
    this.repositories = options?.repositories ?? createPhase3ConversationControlStore();
    this.service = createPhase3ConversationControlService(this.repositories, {
      idGenerator: this.idGenerator,
    });
  }

  async publishConversationTuple(
    snapshot: ConversationTupleCompatibilitySnapshot,
  ): Promise<ConversationTupleCompatibilitySnapshot> {
    const saved = await this.service.saveTupleCompatibility(snapshot);
    await this.service.recomputeDigest(saved.clusterRef, saved.computedAt);
    return saved;
  }

  async queryTaskConversationControl(
    input: QueryConversationControlTaskInput,
  ): Promise<Phase3ConversationControlTaskQueryResult> {
    const taskId = requireRef(input.taskId, "taskId");
    return {
      taskId,
      clusters: await this.service.listTaskClusters(taskId),
      communicationRepair: await this.communicationRepairApplication.queryTaskCommunicationRepair(
        taskId,
      ),
    };
  }

  async queryConversationCluster(
    input: QueryConversationControlClusterInput,
  ): Promise<Phase3ConversationControlClusterBundle | null> {
    return this.service.queryCluster(requireRef(input.clusterRef, "clusterRef"));
  }

  async acquireComposerLease(
    input: AcquirePatientComposerLeaseInput,
  ): Promise<AcquirePatientComposerLeaseResult> {
    return this.service.acquireComposerLease(input);
  }

  async releaseComposerLease(input: {
    leaseId: string;
    releasedAt: string;
  }): Promise<PatientComposerLeaseSnapshot> {
    return this.service.releaseComposerLease({
      leaseId: requireRef(input.leaseId, "leaseId"),
      releasedAt: ensureIsoTimestamp(input.releasedAt, "releasedAt"),
    });
  }

  async recomputeUrgentDiversion(
    input: RecomputePatientUrgentDiversionInput,
  ): Promise<Phase3ConversationControlClusterBundle> {
    await this.service.recomputeUrgentDiversion(input);
    return this.requireClusterBundle(input.clusterRef);
  }

  async recordMessageMutationSettlement(
    input: RecordMessageConversationSettlementInput,
  ): Promise<Phase3ConversationControlSettlementResult> {
    const tuple = await this.requireTuple(input.clusterRef);
    invariant(
      tuple.threadId === requireRef(input.threadId, "threadId"),
      "MESSAGE_THREAD_TUPLE_MISMATCH",
      `Cluster ${input.clusterRef} is not aligned to message thread ${input.threadId}.`,
    );
    await this.requireStaffMutationGuards(
      input.actorKind,
      input.taskId,
      input.actionScope,
      input.staffGuards ?? null,
    );
    return this.finalizeSettlement(
      input.taskId,
      tuple,
      {
        actionRecordRef: input.actionRecordRef,
        commandSettlementRef: input.commandSettlementRef,
        actionScope: input.actionScope,
        governingObjectRef: input.threadId,
        routeIntentBindingRef: input.routeIntentBindingRef,
        causalToken: input.causalToken,
        result: input.result,
        localAckState: input.localAckState,
        transportState: input.transportState,
        externalObservationState: input.externalObservationState,
        authoritativeOutcomeState: input.authoritativeOutcomeState,
        latestCommunicationEnvelopeRef: optionalRef(input.latestCommunicationEnvelopeRef),
        latestReceiptEnvelopeRef: optionalRef(input.latestReceiptEnvelopeRef),
        verificationCheckpointRef: optionalRef(input.verificationCheckpointRef),
        sameShellRecoveryRef: optionalRef(input.sameShellRecoveryRef),
        recordedAt: input.recordedAt,
      },
    );
  }

  async recordCallbackMutationSettlement(
    input: RecordCallbackConversationSettlementInput,
  ): Promise<Phase3ConversationControlSettlementResult> {
    const tuple = await this.requireTuple(input.clusterRef);
    await this.requireStaffMutationGuards(
      input.actorKind,
      input.taskId,
      input.actionScope,
      input.staffGuards ?? null,
    );
    return this.finalizeSettlement(
      input.taskId,
      tuple,
      {
        actionRecordRef: input.actionRecordRef,
        commandSettlementRef: input.commandSettlementRef,
        actionScope: input.actionScope,
        governingObjectRef: input.callbackCaseId,
        routeIntentBindingRef: input.routeIntentBindingRef,
        causalToken: input.causalToken,
        result: input.result,
        localAckState: input.localAckState,
        transportState: input.transportState,
        externalObservationState: input.externalObservationState,
        authoritativeOutcomeState: input.authoritativeOutcomeState,
        latestCommunicationEnvelopeRef: optionalRef(input.latestCommunicationEnvelopeRef),
        latestReceiptEnvelopeRef: optionalRef(input.latestReceiptEnvelopeRef),
        latestCallbackStatusRef: optionalRef(input.latestCallbackStatusRef),
        verificationCheckpointRef: optionalRef(input.verificationCheckpointRef),
        sameShellRecoveryRef: optionalRef(input.sameShellRecoveryRef),
        recordedAt: input.recordedAt,
      },
    );
  }

  private async requireTuple(
    clusterRef: string,
  ): Promise<ConversationTupleCompatibilitySnapshot> {
    const tuple = await this.repositories.getTuple(requireRef(clusterRef, "clusterRef"));
    invariant(tuple, "CONVERSATION_TUPLE_NOT_FOUND", `Cluster ${clusterRef} has no 246 tuple.`);
    return tuple;
  }

  private async requireClusterBundle(
    clusterRef: string,
  ): Promise<Phase3ConversationControlClusterBundle> {
    const bundle = await this.service.queryCluster(clusterRef);
    invariant(bundle, "CONVERSATION_CLUSTER_NOT_FOUND", `Cluster ${clusterRef} is required.`);
    return bundle;
  }

  private async finalizeSettlement(
    taskId: string,
    tuple: ConversationTupleCompatibilitySnapshot,
    input: Omit<RecordConversationSettlementInput, "taskId" | "clusterRef">,
  ): Promise<Phase3ConversationControlSettlementResult> {
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const normalized = normalizeSettlementAgainstTuple({
      tuple,
      result: input.result,
      authoritativeOutcomeState: input.authoritativeOutcomeState,
      stateConfidenceBand: undefined,
    });
    const recorded: RecordConversationSettlementResult = await this.service.recordSettlement({
      taskId: requireRef(taskId, "taskId"),
      clusterRef: tuple.clusterRef,
      actionRecordRef: requireRef(input.actionRecordRef, "actionRecordRef"),
      commandSettlementRef: requireRef(input.commandSettlementRef, "commandSettlementRef"),
      actionScope: requireRef(input.actionScope, "actionScope"),
      governingObjectRef: requireRef(input.governingObjectRef, "governingObjectRef"),
      routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
      causalToken: requireRef(input.causalToken, "causalToken"),
      result: normalized.result,
      localAckState: input.localAckState,
      transportState: input.transportState,
      externalObservationState: input.externalObservationState,
      authoritativeOutcomeState: normalized.authoritativeOutcomeState,
      stateConfidenceBand: normalized.stateConfidenceBand,
      latestCommunicationEnvelopeRef: optionalRef(input.latestCommunicationEnvelopeRef),
      latestReceiptEnvelopeRef: optionalRef(input.latestReceiptEnvelopeRef),
      latestCallbackStatusRef: optionalRef(input.latestCallbackStatusRef),
      verificationCheckpointRef: optionalRef(input.verificationCheckpointRef),
      sameShellRecoveryRef:
        optionalRef(input.sameShellRecoveryRef) ?? `/patient/messages/${tuple.clusterRef}/recover`,
      recordedAt,
    });
    const cluster = await this.requireClusterBundle(tuple.clusterRef);
    return {
      cluster,
      settlement: recorded.settlement,
      recoveryContinuation: recorded.recoveryContinuation,
      reusedExisting: recorded.reusedExisting,
    };
  }

  private async requireStaffMutationGuards(
    actorKind: "patient" | "staff",
    taskId: string,
    actionScope: string,
    guards: StaffConversationMutationGuardInput | null,
  ): Promise<void> {
    if (actorKind !== "staff") {
      return;
    }
    const task = await this.triageApplication.triageRepositories.getTask(requireRef(taskId, "taskId"));
    invariant(task, "TRIAGE_TASK_NOT_FOUND", `Task ${taskId} is required for ${actionScope}.`);
    const taskSnapshot = task.toSnapshot();
    invariant(
      taskSnapshot.reviewFreshnessState === "fresh",
      "STALE_QUEUE_CONTEXT",
      `${actionScope} requires fresh review context.`,
    );
    invariant(
      taskSnapshot.activeReviewSessionRef,
      "REVIEW_ACTION_LEASE_REQUIRED",
      `${actionScope} requires an active review session.`,
    );
    const session = await this.triageApplication.triageRepositories.getReviewSession(
      taskSnapshot.activeReviewSessionRef,
    );
    invariant(
      session,
      "REVIEW_SESSION_NOT_FOUND",
      `Review session ${taskSnapshot.activeReviewSessionRef} is required.`,
    );
    const reviewSession = session.toSnapshot();
    invariant(
      reviewSession.sessionState === "active",
      "REVIEW_SESSION_NOT_ACTIVE",
      `${actionScope} requires an active review session.`,
    );
    invariant(
      optionalRef(guards?.reviewActionLeaseRef) === reviewSession.reviewActionLeaseRef,
      "REVIEW_ACTION_LEASE_MISMATCH",
      `${actionScope} requires the current ReviewActionLease.`,
    );
    const requiresProtectedContext = isProtectedModeActive(
      guards?.protectedCompositionMode,
      guards?.forceProtectedContext,
    );
    if (!requiresProtectedContext) {
      return;
    }
    invariant(
      optionalRef(guards?.focusProtectionLeaseRef),
      "FOCUS_PROTECTION_LEASE_REQUIRED",
      `${actionScope} requires WorkspaceFocusProtectionLease.`,
    );
    invariant(
      guards?.focusProtectionLeaseState === "active",
      "FOCUS_PROTECTION_LEASE_NOT_ACTIVE",
      `${actionScope} requires an active WorkspaceFocusProtectionLease.`,
    );
    invariant(
      optionalRef(guards?.protectedCompositionStateRef),
      "PROTECTED_COMPOSITION_STATE_REQUIRED",
      `${actionScope} requires ProtectedCompositionState.`,
    );
    invariant(
      guards?.protectedCompositionValidityState === "live",
      "PROTECTED_COMPOSITION_NOT_LIVE",
      `${actionScope} requires live ProtectedCompositionState.`,
    );
    invariant(
      (guards?.invalidatingDriftState ?? "none") === "none",
      "PROTECTED_COMPOSITION_DRIFT",
      `${actionScope} is blocked by protected composition drift.`,
    );
  }
}

export function createPhase3ConversationControlApplication(options?: {
  triageApplication?: Phase3TriageKernelApplication;
  communicationRepairApplication?: Phase3CommunicationRepairApplication;
  repositories?: ConversationControlRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase3ConversationControlApplication {
  return new Phase3ConversationControlApplicationImpl(options);
}
