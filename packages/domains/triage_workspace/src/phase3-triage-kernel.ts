import { createHash } from "node:crypto";
import {
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
} from "@vecells/domain-kernel";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
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

function ensureNonNegativeInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative integer.`,
  );
  return value;
}

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function saveWithCas<T extends { version: number }>(
  map: Map<string, T>,
  key: string,
  row: T,
  options?: CompareAndSetWriteOptions,
): void {
  const current = map.get(key);
  if (options?.expectedVersion !== undefined) {
    invariant(
      current?.version === options.expectedVersion,
      "OPTIMISTIC_CONCURRENCY_MISMATCH",
      `Expected version ${options.expectedVersion} for ${key}, received ${current?.version ?? "missing"}.`,
    );
  } else if (current) {
    invariant(
      current.version < row.version,
      "NON_MONOTONE_SAVE",
      `Persisted version for ${key} must increase monotonically.`,
    );
  }
  map.set(key, row);
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function nextKernelId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export type Phase3TriageTaskStatus =
  | "triage_ready"
  | "queued"
  | "claimed"
  | "in_review"
  | "awaiting_patient_info"
  | "review_resumed"
  | "endpoint_selected"
  | "escalated"
  | "resolved_without_appointment"
  | "handoff_pending"
  | "closed"
  | "reopened";

export type Phase3OwnershipState = "active" | "releasing" | "expired" | "broken";
export type Phase3ReviewFreshnessState = "fresh" | "queued_updates" | "review_required";
export type Phase3ReviewSessionState =
  | "opening"
  | "active"
  | "release_pending"
  | "released"
  | "superseded"
  | "closed";
export type Phase3BufferState = "none" | "queued_updates" | "review_required";
export type Phase3NextTaskLaunchState = "blocked" | "gated" | "ready" | "launched";
export type Phase3ReturnStubState = "none" | "pinned" | "released";
export type Phase3TaskSettlementResult =
  | "applied"
  | "projection_pending"
  | "stale_recoverable"
  | "denied_scope"
  | "review_required";
export type Phase3TaskLocalAckState = "none" | "shown" | "superseded";
export type Phase3ProcessingAcceptanceState =
  | "not_started"
  | "accepted_for_processing"
  | "awaiting_external_confirmation"
  | "externally_accepted"
  | "externally_rejected"
  | "timed_out";
export type Phase3ExternalObservationState =
  | "unobserved"
  | "projection_visible"
  | "external_effect_observed"
  | "review_disposition_observed"
  | "recovery_observed"
  | "disputed"
  | "failed"
  | "expired";
export type Phase3AuthoritativeOutcomeState =
  | "pending"
  | "projection_pending"
  | "review_required"
  | "stale_recoverable"
  | "recovery_required"
  | "settled"
  | "failed"
  | "expired"
  | "superseded";
export type Phase3TaskActionScope =
  | "task_claim"
  | "task_release"
  | "start_review"
  | "move_to_queue"
  | "request_more_info"
  | "resume_review"
  | "select_endpoint"
  | "escalate"
  | "resolved_without_appointment"
  | "handoff_pending"
  | "reopen"
  | "close"
  | "take_over_stale_task";
export type Phase3TransitionReasonCode =
  | "task_seeded"
  | "task_claimed"
  | "session_heartbeat_recorded"
  | "lease_release_requested"
  | "task_returned_to_queue"
  | "review_started"
  | "more_info_requested"
  | "review_resumed_after_patient_reply"
  | "endpoint_selected_under_current_epoch"
  | "escalation_selected_under_current_epoch"
  | "resolved_without_appointment_settled"
  | "handoff_pending_settled"
  | "task_closed_after_lifecycle_signal"
  | "task_reopened"
  | "stale_owner_recovery_open"
  | "supervisor_takeover_committed";

const taskStatuses: readonly Phase3TriageTaskStatus[] = [
  "triage_ready",
  "queued",
  "claimed",
  "in_review",
  "awaiting_patient_info",
  "review_resumed",
  "endpoint_selected",
  "escalated",
  "resolved_without_appointment",
  "handoff_pending",
  "closed",
  "reopened",
];

const reviewSessionStates: readonly Phase3ReviewSessionState[] = [
  "opening",
  "active",
  "release_pending",
  "released",
  "superseded",
  "closed",
];

const ownershipStates: readonly Phase3OwnershipState[] = ["active", "releasing", "expired", "broken"];
const freshnessStates: readonly Phase3ReviewFreshnessState[] = [
  "fresh",
  "queued_updates",
  "review_required",
];
const bufferStates: readonly Phase3BufferState[] = ["none", "queued_updates", "review_required"];
const nextTaskLaunchStates: readonly Phase3NextTaskLaunchState[] = [
  "blocked",
  "gated",
  "ready",
  "launched",
];
const returnStubStates: readonly Phase3ReturnStubState[] = ["none", "pinned", "released"];

export const phase3TriageLegalTransitions: Readonly<
  Record<Phase3TriageTaskStatus, readonly Phase3TriageTaskStatus[]>
> = {
  triage_ready: ["queued"],
  queued: ["claimed"],
  claimed: ["queued", "in_review"],
  in_review: ["queued", "awaiting_patient_info", "endpoint_selected", "escalated"],
  awaiting_patient_info: ["review_resumed", "escalated"],
  review_resumed: ["queued", "claimed"],
  endpoint_selected: ["resolved_without_appointment", "handoff_pending", "escalated"],
  escalated: ["resolved_without_appointment", "handoff_pending", "reopened"],
  resolved_without_appointment: ["closed", "reopened"],
  handoff_pending: ["closed", "reopened"],
  closed: ["reopened"],
  reopened: ["queued"],
} as const;

export interface Phase3TriageTaskSnapshot {
  taskId: string;
  requestId: string;
  queueKey: string;
  assignedTo: string | null;
  status: Phase3TriageTaskStatus;
  reviewVersion: number;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  ownershipState: Phase3OwnershipState;
  reviewFreshnessState: Phase3ReviewFreshnessState;
  launchContextRef: string;
  workspaceTrustEnvelopeRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  taskCompletionSettlementEnvelopeRef: string;
  lifecycleLeaseRef: string | null;
  leaseAuthorityRef: string | null;
  leaseTtlSeconds: number | null;
  lastHeartbeatAt: string | null;
  staleOwnerRecoveryRef: string | null;
  activeReviewSessionRef: string | null;
  duplicateClusterRef: string | null;
  currentEndpointDecisionRef: string | null;
  currentDecisionEpochRef: string | null;
  latestDecisionSupersessionRef: string | null;
  duplicateResolutionDecisionRef: string | null;
  duplicateReviewSnapshotRef: string | null;
  releaseRecoveryDispositionRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Phase3ReviewSessionSnapshot {
  reviewSessionId: string;
  taskId: string;
  openedBy: string;
  openedAt: string;
  lastActivityAt: string;
  sessionState: Phase3ReviewSessionState;
  workspaceSnapshotVersion: number;
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
  bufferState: Phase3BufferState;
  lineageFenceEpoch: number;
  staffWorkspaceConsistencyProjectionRef: string;
  workspaceSliceTrustProjectionRef: string;
  workspaceTrustEnvelopeRef: string;
  requestLifecycleLeaseRef: string;
  reviewActionLeaseRef: string;
  ownershipEpochRef: number;
  audienceSurfaceRuntimeBindingRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string;
  transitionEnvelopeRef: string | null;
  version: number;
}

export interface Phase3TaskLaunchContextSnapshot {
  launchContextId: string;
  taskId: string;
  sourceQueueKey: string;
  sourceSavedViewRef: string | null;
  sourceRowIndex: number | null;
  sourceQueueRankSnapshotRef: string;
  returnAnchorRef: string;
  returnAnchorTupleHash: string;
  nextTaskCandidateRefs: readonly string[];
  nextTaskRankSnapshotRef: string | null;
  previewSnapshotRef: string | null;
  previewDigestRef: string | null;
  prefetchWindowRef: string | null;
  prefetchCandidateRefs: readonly string[];
  prefetchRankSnapshotRef: string | null;
  selectedAnchorRef: string;
  selectedAnchorTupleHash: string;
  changedSinceSeenAt: string | null;
  nextTaskBlockingReasonRefs: readonly string[];
  nextTaskLaunchState: Phase3NextTaskLaunchState;
  departingTaskReturnStubState: Phase3ReturnStubState;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Phase3TaskCommandSettlementSnapshot {
  settlementId: string;
  taskId: string;
  actionScope: Phase3TaskActionScope;
  governingObjectRef: string;
  canonicalObjectDescriptorRef: string;
  governingObjectVersionRef: string;
  routeIntentTupleHash: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  transitionEnvelopeRef: string;
  releaseRecoveryDispositionRef: string;
  result: Phase3TaskSettlementResult;
  localAckState: Phase3TaskLocalAckState;
  processingAcceptanceState: Phase3ProcessingAcceptanceState;
  externalObservationState: Phase3ExternalObservationState;
  authoritativeOutcomeState: Phase3AuthoritativeOutcomeState;
  settlementRevision: number;
  causalToken: string;
  recordedAt: string;
  recoveryRouteRef: string | null;
  version: number;
}

export interface Phase3TaskTransitionJournalEntrySnapshot {
  transitionJournalEntryId: string;
  taskId: string;
  previousStatus: Phase3TriageTaskStatus;
  nextStatus: Phase3TriageTaskStatus;
  actorRef: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  currentOwnershipEpoch: number;
  currentLineageFenceEpoch: number;
  reasonCode: Phase3TransitionReasonCode;
  emittedEventName: string;
  recordedAt: string;
  version: number;
}

abstract class BasePhase3Document<T extends { version: number }> {
  protected constructor(protected readonly snapshot: T) {}

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): T {
    return { ...this.snapshot };
  }
}

export class Phase3TriageTaskDocument extends BasePhase3Document<Phase3TriageTaskSnapshot> {
  private constructor(snapshot: Phase3TriageTaskSnapshot) {
    super(Phase3TriageTaskDocument.normalize(snapshot));
  }

  static create(input: Omit<Phase3TriageTaskSnapshot, "version">): Phase3TriageTaskDocument {
    return new Phase3TriageTaskDocument({ ...input, version: 1 });
  }

  static hydrate(snapshot: Phase3TriageTaskSnapshot): Phase3TriageTaskDocument {
    return new Phase3TriageTaskDocument(snapshot);
  }

  static normalize(snapshot: Phase3TriageTaskSnapshot): Phase3TriageTaskSnapshot {
    ensureNonNegativeInteger(snapshot.reviewVersion, "reviewVersion");
    ensureNonNegativeInteger(snapshot.ownershipEpoch, "ownershipEpoch");
    ensureNonNegativeInteger(snapshot.currentLineageFenceEpoch, "currentLineageFenceEpoch");
    ensurePositiveInteger(snapshot.version, "version");
    invariant(taskStatuses.includes(snapshot.status), "INVALID_TASK_STATUS", "Unsupported task status.");
    invariant(
      ownershipStates.includes(snapshot.ownershipState),
      "INVALID_OWNERSHIP_STATE",
      "Unsupported ownershipState.",
    );
    invariant(
      freshnessStates.includes(snapshot.reviewFreshnessState),
      "INVALID_REVIEW_FRESHNESS_STATE",
      "Unsupported reviewFreshnessState.",
    );

    const normalized = {
      ...snapshot,
      taskId: requireRef(snapshot.taskId, "taskId"),
      requestId: requireRef(snapshot.requestId, "requestId"),
      queueKey: requireRef(snapshot.queueKey, "queueKey"),
      assignedTo: optionalRef(snapshot.assignedTo),
      fencingToken: requireRef(snapshot.fencingToken, "fencingToken"),
      launchContextRef: requireRef(snapshot.launchContextRef, "launchContextRef"),
      workspaceTrustEnvelopeRef: requireRef(
        snapshot.workspaceTrustEnvelopeRef,
        "workspaceTrustEnvelopeRef",
      ),
      surfaceRouteContractRef: requireRef(
        snapshot.surfaceRouteContractRef,
        "surfaceRouteContractRef",
      ),
      surfacePublicationRef: requireRef(snapshot.surfacePublicationRef, "surfacePublicationRef"),
      runtimePublicationBundleRef: requireRef(
        snapshot.runtimePublicationBundleRef,
        "runtimePublicationBundleRef",
      ),
      taskCompletionSettlementEnvelopeRef: requireRef(
        snapshot.taskCompletionSettlementEnvelopeRef,
        "taskCompletionSettlementEnvelopeRef",
      ),
      lifecycleLeaseRef: optionalRef(snapshot.lifecycleLeaseRef),
      leaseAuthorityRef: optionalRef(snapshot.leaseAuthorityRef),
      lastHeartbeatAt: snapshot.lastHeartbeatAt
        ? ensureIsoTimestamp(snapshot.lastHeartbeatAt, "lastHeartbeatAt")
        : null,
      staleOwnerRecoveryRef: optionalRef(snapshot.staleOwnerRecoveryRef),
      activeReviewSessionRef: optionalRef(snapshot.activeReviewSessionRef),
      duplicateClusterRef: optionalRef(snapshot.duplicateClusterRef),
      currentEndpointDecisionRef: optionalRef(snapshot.currentEndpointDecisionRef),
      currentDecisionEpochRef: optionalRef(snapshot.currentDecisionEpochRef),
      latestDecisionSupersessionRef: optionalRef(snapshot.latestDecisionSupersessionRef),
      duplicateResolutionDecisionRef: optionalRef(snapshot.duplicateResolutionDecisionRef),
      duplicateReviewSnapshotRef: optionalRef(snapshot.duplicateReviewSnapshotRef),
      releaseRecoveryDispositionRef: optionalRef(snapshot.releaseRecoveryDispositionRef),
      createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
      updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    };

    if (
      normalized.status === "claimed" ||
      normalized.status === "in_review" ||
      normalized.status === "awaiting_patient_info" ||
      normalized.status === "review_resumed" ||
      normalized.status === "endpoint_selected" ||
      normalized.status === "escalated" ||
      normalized.status === "resolved_without_appointment" ||
      normalized.status === "handoff_pending"
    ) {
      invariant(
        normalized.assignedTo !== null,
        "ASSIGNED_ACTOR_REQUIRED",
        "Assigned actor is required for active or consequence-bearing task states.",
      );
    }
    if (normalized.ownershipState === "expired" || normalized.ownershipState === "broken") {
      invariant(
        normalized.staleOwnerRecoveryRef !== null,
        "STALE_RECOVERY_REF_REQUIRED",
        "Expired or broken ownership requires staleOwnerRecoveryRef.",
      );
    }
    return normalized;
  }

  update(changes: Partial<Phase3TriageTaskSnapshot>): Phase3TriageTaskDocument {
    return new Phase3TriageTaskDocument({
      ...this.snapshot,
      ...changes,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export class Phase3ReviewSessionDocument extends BasePhase3Document<Phase3ReviewSessionSnapshot> {
  private constructor(snapshot: Phase3ReviewSessionSnapshot) {
    super(Phase3ReviewSessionDocument.normalize(snapshot));
  }

  static create(input: Omit<Phase3ReviewSessionSnapshot, "version">): Phase3ReviewSessionDocument {
    return new Phase3ReviewSessionDocument({ ...input, version: 1 });
  }

  static hydrate(snapshot: Phase3ReviewSessionSnapshot): Phase3ReviewSessionDocument {
    return new Phase3ReviewSessionDocument(snapshot);
  }

  static normalize(snapshot: Phase3ReviewSessionSnapshot): Phase3ReviewSessionSnapshot {
    ensureNonNegativeInteger(snapshot.workspaceSnapshotVersion, "workspaceSnapshotVersion");
    ensureNonNegativeInteger(snapshot.lineageFenceEpoch, "lineageFenceEpoch");
    ensureNonNegativeInteger(snapshot.ownershipEpochRef, "ownershipEpochRef");
    ensurePositiveInteger(snapshot.version, "version");
    invariant(
      reviewSessionStates.includes(snapshot.sessionState),
      "INVALID_REVIEW_SESSION_STATE",
      "Unsupported review session state.",
    );
    invariant(
      bufferStates.includes(snapshot.bufferState),
      "INVALID_BUFFER_STATE",
      "Unsupported review session buffer state.",
    );
    return {
      ...snapshot,
      reviewSessionId: requireRef(snapshot.reviewSessionId, "reviewSessionId"),
      taskId: requireRef(snapshot.taskId, "taskId"),
      openedBy: requireRef(snapshot.openedBy, "openedBy"),
      openedAt: ensureIsoTimestamp(snapshot.openedAt, "openedAt"),
      lastActivityAt: ensureIsoTimestamp(snapshot.lastActivityAt, "lastActivityAt"),
      selectedAnchorRef: requireRef(snapshot.selectedAnchorRef, "selectedAnchorRef"),
      selectedAnchorTupleHashRef: requireRef(
        snapshot.selectedAnchorTupleHashRef,
        "selectedAnchorTupleHashRef",
      ),
      staffWorkspaceConsistencyProjectionRef: requireRef(
        snapshot.staffWorkspaceConsistencyProjectionRef,
        "staffWorkspaceConsistencyProjectionRef",
      ),
      workspaceSliceTrustProjectionRef: requireRef(
        snapshot.workspaceSliceTrustProjectionRef,
        "workspaceSliceTrustProjectionRef",
      ),
      workspaceTrustEnvelopeRef: requireRef(
        snapshot.workspaceTrustEnvelopeRef,
        "workspaceTrustEnvelopeRef",
      ),
      requestLifecycleLeaseRef: requireRef(
        snapshot.requestLifecycleLeaseRef,
        "requestLifecycleLeaseRef",
      ),
      reviewActionLeaseRef: requireRef(snapshot.reviewActionLeaseRef, "reviewActionLeaseRef"),
      audienceSurfaceRuntimeBindingRef: requireRef(
        snapshot.audienceSurfaceRuntimeBindingRef,
        "audienceSurfaceRuntimeBindingRef",
      ),
      surfaceRouteContractRef: requireRef(
        snapshot.surfaceRouteContractRef,
        "surfaceRouteContractRef",
      ),
      surfacePublicationRef: requireRef(snapshot.surfacePublicationRef, "surfacePublicationRef"),
      runtimePublicationBundleRef: requireRef(
        snapshot.runtimePublicationBundleRef,
        "runtimePublicationBundleRef",
      ),
      releaseRecoveryDispositionRef: requireRef(
        snapshot.releaseRecoveryDispositionRef,
        "releaseRecoveryDispositionRef",
      ),
      transitionEnvelopeRef: optionalRef(snapshot.transitionEnvelopeRef),
    };
  }

  update(changes: Partial<Phase3ReviewSessionSnapshot>): Phase3ReviewSessionDocument {
    return new Phase3ReviewSessionDocument({
      ...this.snapshot,
      ...changes,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export class Phase3TaskLaunchContextDocument extends BasePhase3Document<Phase3TaskLaunchContextSnapshot> {
  private constructor(snapshot: Phase3TaskLaunchContextSnapshot) {
    super(Phase3TaskLaunchContextDocument.normalize(snapshot));
  }

  static create(
    input: Omit<Phase3TaskLaunchContextSnapshot, "version">,
  ): Phase3TaskLaunchContextDocument {
    return new Phase3TaskLaunchContextDocument({ ...input, version: 1 });
  }

  static hydrate(snapshot: Phase3TaskLaunchContextSnapshot): Phase3TaskLaunchContextDocument {
    return new Phase3TaskLaunchContextDocument(snapshot);
  }

  static normalize(snapshot: Phase3TaskLaunchContextSnapshot): Phase3TaskLaunchContextSnapshot {
    ensurePositiveInteger(snapshot.version, "version");
    invariant(
      nextTaskLaunchStates.includes(snapshot.nextTaskLaunchState),
      "INVALID_NEXT_TASK_LAUNCH_STATE",
      "Unsupported nextTaskLaunchState.",
    );
    invariant(
      returnStubStates.includes(snapshot.departingTaskReturnStubState),
      "INVALID_RETURN_STUB_STATE",
      "Unsupported departingTaskReturnStubState.",
    );
    return {
      ...snapshot,
      launchContextId: requireRef(snapshot.launchContextId, "launchContextId"),
      taskId: requireRef(snapshot.taskId, "taskId"),
      sourceQueueKey: requireRef(snapshot.sourceQueueKey, "sourceQueueKey"),
      sourceSavedViewRef: optionalRef(snapshot.sourceSavedViewRef),
      sourceQueueRankSnapshotRef: requireRef(
        snapshot.sourceQueueRankSnapshotRef,
        "sourceQueueRankSnapshotRef",
      ),
      returnAnchorRef: requireRef(snapshot.returnAnchorRef, "returnAnchorRef"),
      returnAnchorTupleHash: requireRef(snapshot.returnAnchorTupleHash, "returnAnchorTupleHash"),
      nextTaskRankSnapshotRef: optionalRef(snapshot.nextTaskRankSnapshotRef),
      previewSnapshotRef: optionalRef(snapshot.previewSnapshotRef),
      previewDigestRef: optionalRef(snapshot.previewDigestRef),
      prefetchWindowRef: optionalRef(snapshot.prefetchWindowRef),
      prefetchRankSnapshotRef: optionalRef(snapshot.prefetchRankSnapshotRef),
      selectedAnchorRef: requireRef(snapshot.selectedAnchorRef, "selectedAnchorRef"),
      selectedAnchorTupleHash: requireRef(
        snapshot.selectedAnchorTupleHash,
        "selectedAnchorTupleHash",
      ),
      changedSinceSeenAt: snapshot.changedSinceSeenAt
        ? ensureIsoTimestamp(snapshot.changedSinceSeenAt, "changedSinceSeenAt")
        : null,
      createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
      updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    };
  }

  update(changes: Partial<Phase3TaskLaunchContextSnapshot>): Phase3TaskLaunchContextDocument {
    return new Phase3TaskLaunchContextDocument({
      ...this.snapshot,
      ...changes,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export class Phase3TaskCommandSettlementDocument extends BasePhase3Document<Phase3TaskCommandSettlementSnapshot> {
  private constructor(snapshot: Phase3TaskCommandSettlementSnapshot) {
    super(Phase3TaskCommandSettlementDocument.normalize(snapshot));
  }

  static create(
    input: Omit<Phase3TaskCommandSettlementSnapshot, "version">,
  ): Phase3TaskCommandSettlementDocument {
    return new Phase3TaskCommandSettlementDocument({ ...input, version: 1 });
  }

  static hydrate(snapshot: Phase3TaskCommandSettlementSnapshot): Phase3TaskCommandSettlementDocument {
    return new Phase3TaskCommandSettlementDocument(snapshot);
  }

  static normalize(snapshot: Phase3TaskCommandSettlementSnapshot): Phase3TaskCommandSettlementSnapshot {
    ensurePositiveInteger(snapshot.settlementRevision, "settlementRevision");
    ensurePositiveInteger(snapshot.version, "version");
    return {
      ...snapshot,
      settlementId: requireRef(snapshot.settlementId, "settlementId"),
      taskId: requireRef(snapshot.taskId, "taskId"),
      actionScope: requireRef(snapshot.actionScope, "actionScope") as Phase3TaskActionScope,
      governingObjectRef: requireRef(snapshot.governingObjectRef, "governingObjectRef"),
      canonicalObjectDescriptorRef: requireRef(
        snapshot.canonicalObjectDescriptorRef,
        "canonicalObjectDescriptorRef",
      ),
      governingObjectVersionRef: requireRef(
        snapshot.governingObjectVersionRef,
        "governingObjectVersionRef",
      ),
      routeIntentTupleHash: requireRef(snapshot.routeIntentTupleHash, "routeIntentTupleHash"),
      routeIntentBindingRef: requireRef(snapshot.routeIntentBindingRef, "routeIntentBindingRef"),
      commandActionRecordRef: requireRef(snapshot.commandActionRecordRef, "commandActionRecordRef"),
      commandSettlementRecordRef: requireRef(
        snapshot.commandSettlementRecordRef,
        "commandSettlementRecordRef",
      ),
      transitionEnvelopeRef: requireRef(snapshot.transitionEnvelopeRef, "transitionEnvelopeRef"),
      releaseRecoveryDispositionRef: requireRef(
        snapshot.releaseRecoveryDispositionRef,
        "releaseRecoveryDispositionRef",
      ),
      causalToken: requireRef(snapshot.causalToken, "causalToken"),
      recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
      recoveryRouteRef: optionalRef(snapshot.recoveryRouteRef),
    };
  }
}

export class Phase3TaskTransitionJournalEntryDocument extends BasePhase3Document<Phase3TaskTransitionJournalEntrySnapshot> {
  private constructor(snapshot: Phase3TaskTransitionJournalEntrySnapshot) {
    super(Phase3TaskTransitionJournalEntryDocument.normalize(snapshot));
  }

  static create(
    input: Omit<Phase3TaskTransitionJournalEntrySnapshot, "version">,
  ): Phase3TaskTransitionJournalEntryDocument {
    return new Phase3TaskTransitionJournalEntryDocument({ ...input, version: 1 });
  }

  static hydrate(
    snapshot: Phase3TaskTransitionJournalEntrySnapshot,
  ): Phase3TaskTransitionJournalEntryDocument {
    return new Phase3TaskTransitionJournalEntryDocument(snapshot);
  }

  static normalize(
    snapshot: Phase3TaskTransitionJournalEntrySnapshot,
  ): Phase3TaskTransitionJournalEntrySnapshot {
    ensureNonNegativeInteger(snapshot.currentOwnershipEpoch, "currentOwnershipEpoch");
    ensureNonNegativeInteger(snapshot.currentLineageFenceEpoch, "currentLineageFenceEpoch");
    ensurePositiveInteger(snapshot.version, "version");
    invariant(
      taskStatuses.includes(snapshot.previousStatus) && taskStatuses.includes(snapshot.nextStatus),
      "INVALID_TRANSITION_JOURNAL_STATUS",
      "Transition journal statuses must use the frozen triage vocabulary.",
    );
    return {
      ...snapshot,
      transitionJournalEntryId: requireRef(
        snapshot.transitionJournalEntryId,
        "transitionJournalEntryId",
      ),
      taskId: requireRef(snapshot.taskId, "taskId"),
      actorRef: requireRef(snapshot.actorRef, "actorRef"),
      routeIntentBindingRef: requireRef(snapshot.routeIntentBindingRef, "routeIntentBindingRef"),
      commandActionRecordRef: requireRef(snapshot.commandActionRecordRef, "commandActionRecordRef"),
      commandSettlementRecordRef: requireRef(
        snapshot.commandSettlementRecordRef,
        "commandSettlementRecordRef",
      ),
      reasonCode: requireRef(snapshot.reasonCode, "reasonCode") as Phase3TransitionReasonCode,
      emittedEventName: requireRef(snapshot.emittedEventName, "emittedEventName"),
      recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
    };
  }
}

export interface Phase3TriageKernelRepositories {
  getTask(taskId: string): Promise<Phase3TriageTaskDocument | undefined>;
  saveTask(task: Phase3TriageTaskDocument, options?: CompareAndSetWriteOptions): Promise<void>;
  listTasks(): Promise<readonly Phase3TriageTaskDocument[]>;

  getReviewSession(reviewSessionId: string): Promise<Phase3ReviewSessionDocument | undefined>;
  saveReviewSession(
    reviewSession: Phase3ReviewSessionDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listReviewSessions(): Promise<readonly Phase3ReviewSessionDocument[]>;
  getActiveReviewSessionForTask(taskId: string): Promise<Phase3ReviewSessionDocument | undefined>;

  getLaunchContext(
    launchContextId: string,
  ): Promise<Phase3TaskLaunchContextDocument | undefined>;
  saveLaunchContext(
    launchContext: Phase3TaskLaunchContextDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listLaunchContexts(): Promise<readonly Phase3TaskLaunchContextDocument[]>;

  getTaskCommandSettlement(
    settlementId: string,
  ): Promise<Phase3TaskCommandSettlementDocument | undefined>;
  saveTaskCommandSettlement(
    settlement: Phase3TaskCommandSettlementDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listTaskCommandSettlements(): Promise<readonly Phase3TaskCommandSettlementDocument[]>;

  saveTransitionJournalEntry(
    entry: Phase3TaskTransitionJournalEntryDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listTransitionJournalEntriesForTask(
    taskId: string,
  ): Promise<readonly Phase3TaskTransitionJournalEntryDocument[]>;

  withTaskBoundary<T>(operation: () => Promise<T>): Promise<T>;
}

export class InMemoryPhase3TriageKernelStore implements Phase3TriageKernelRepositories {
  private readonly tasks = new Map<string, Phase3TriageTaskSnapshot>();
  private readonly reviewSessions = new Map<string, Phase3ReviewSessionSnapshot>();
  private readonly activeReviewSessionByTask = new Map<string, string>();
  private readonly launchContexts = new Map<string, Phase3TaskLaunchContextSnapshot>();
  private readonly settlements = new Map<string, Phase3TaskCommandSettlementSnapshot>();
  private readonly journalEntries = new Map<string, Phase3TaskTransitionJournalEntrySnapshot>();
  private readonly journalByTask = new Map<string, string[]>();
  private boundaryQueue: Promise<void> = Promise.resolve();

  async withTaskBoundary<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.boundaryQueue;
    let release: () => void = () => undefined;
    this.boundaryQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  async getTask(taskId: string): Promise<Phase3TriageTaskDocument | undefined> {
    const row = this.tasks.get(taskId);
    return row ? Phase3TriageTaskDocument.hydrate(row) : undefined;
  }

  async saveTask(task: Phase3TriageTaskDocument, options?: CompareAndSetWriteOptions): Promise<void> {
    saveWithCas(this.tasks, task.toSnapshot().taskId, task.toSnapshot(), options);
  }

  async listTasks(): Promise<readonly Phase3TriageTaskDocument[]> {
    return [...this.tasks.values()]
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => Phase3TriageTaskDocument.hydrate(row));
  }

  async getReviewSession(reviewSessionId: string): Promise<Phase3ReviewSessionDocument | undefined> {
    const row = this.reviewSessions.get(reviewSessionId);
    return row ? Phase3ReviewSessionDocument.hydrate(row) : undefined;
  }

  async saveReviewSession(
    reviewSession: Phase3ReviewSessionDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = reviewSession.toSnapshot();
    const currentActive = this.activeReviewSessionByTask.get(row.taskId);
    if (
      (row.sessionState === "opening" || row.sessionState === "active" || row.sessionState === "release_pending") &&
      currentActive &&
      currentActive !== row.reviewSessionId
    ) {
      const active = this.reviewSessions.get(currentActive);
      invariant(
        !active || active.sessionState === "released" || active.sessionState === "superseded" || active.sessionState === "closed",
        "ACTIVE_REVIEW_SESSION_CONFLICT",
        `Task ${row.taskId} already has an active review session ${currentActive}.`,
      );
    }
    saveWithCas(this.reviewSessions, row.reviewSessionId, row, options);
    if (row.sessionState === "opening" || row.sessionState === "active" || row.sessionState === "release_pending") {
      this.activeReviewSessionByTask.set(row.taskId, row.reviewSessionId);
    } else if (this.activeReviewSessionByTask.get(row.taskId) === row.reviewSessionId) {
      this.activeReviewSessionByTask.delete(row.taskId);
    }
  }

  async listReviewSessions(): Promise<readonly Phase3ReviewSessionDocument[]> {
    return [...this.reviewSessions.values()]
      .sort((left, right) => compareIso(left.openedAt, right.openedAt))
      .map((row) => Phase3ReviewSessionDocument.hydrate(row));
  }

  async getActiveReviewSessionForTask(taskId: string): Promise<Phase3ReviewSessionDocument | undefined> {
    const reviewSessionId = this.activeReviewSessionByTask.get(taskId);
    if (!reviewSessionId) {
      return undefined;
    }
    const row = this.reviewSessions.get(reviewSessionId);
    return row ? Phase3ReviewSessionDocument.hydrate(row) : undefined;
  }

  async getLaunchContext(
    launchContextId: string,
  ): Promise<Phase3TaskLaunchContextDocument | undefined> {
    const row = this.launchContexts.get(launchContextId);
    return row ? Phase3TaskLaunchContextDocument.hydrate(row) : undefined;
  }

  async saveLaunchContext(
    launchContext: Phase3TaskLaunchContextDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.launchContexts,
      launchContext.toSnapshot().launchContextId,
      launchContext.toSnapshot(),
      options,
    );
  }

  async listLaunchContexts(): Promise<readonly Phase3TaskLaunchContextDocument[]> {
    return [...this.launchContexts.values()]
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => Phase3TaskLaunchContextDocument.hydrate(row));
  }

  async getTaskCommandSettlement(
    settlementId: string,
  ): Promise<Phase3TaskCommandSettlementDocument | undefined> {
    const row = this.settlements.get(settlementId);
    return row ? Phase3TaskCommandSettlementDocument.hydrate(row) : undefined;
  }

  async saveTaskCommandSettlement(
    settlement: Phase3TaskCommandSettlementDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.settlements,
      settlement.toSnapshot().settlementId,
      settlement.toSnapshot(),
      options,
    );
  }

  async listTaskCommandSettlements(): Promise<readonly Phase3TaskCommandSettlementDocument[]> {
    return [...this.settlements.values()]
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => Phase3TaskCommandSettlementDocument.hydrate(row));
  }

  async saveTransitionJournalEntry(
    entry: Phase3TaskTransitionJournalEntryDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = entry.toSnapshot();
    saveWithCas(this.journalEntries, row.transitionJournalEntryId, row, options);
    const existing = this.journalByTask.get(row.taskId) ?? [];
    this.journalByTask.set(row.taskId, [...existing, row.transitionJournalEntryId]);
  }

  async listTransitionJournalEntriesForTask(
    taskId: string,
  ): Promise<readonly Phase3TaskTransitionJournalEntryDocument[]> {
    const ids = this.journalByTask.get(taskId) ?? [];
    return ids
      .map((id) => this.journalEntries.get(id))
      .filter((row): row is Phase3TaskTransitionJournalEntrySnapshot => Boolean(row))
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => Phase3TaskTransitionJournalEntryDocument.hydrate(row));
  }
}

export function createPhase3TriageKernelStore(): Phase3TriageKernelRepositories {
  return new InMemoryPhase3TriageKernelStore();
}

export class Phase3TriageTransitionGuard {
  assertPresentedTaskTuple(input: {
    task: Phase3TriageTaskDocument;
    presentedOwnershipEpoch: number;
    presentedFencingToken: string;
    presentedLineageFenceEpoch: number;
  }): void {
    const snapshot = input.task.toSnapshot();
    invariant(
      snapshot.ownershipEpoch === input.presentedOwnershipEpoch,
      "STALE_OWNERSHIP_EPOCH",
      "Presented ownership epoch is stale.",
    );
    invariant(
      snapshot.fencingToken === requireRef(input.presentedFencingToken, "presentedFencingToken"),
      "STALE_FENCING_TOKEN",
      "Presented fencing token is stale.",
    );
    invariant(
      snapshot.currentLineageFenceEpoch === input.presentedLineageFenceEpoch,
      "STALE_LINEAGE_FENCE_EPOCH",
      "Presented lineage fence epoch is stale.",
    );
  }

  assertActiveOwnership(task: Phase3TriageTaskDocument): void {
    invariant(
      task.toSnapshot().ownershipState === "active",
      "LEASE_NOT_ACTIVE",
      "Task mutation requires active ownership state.",
    );
  }

  assertWorkflowTransition(
    previousStatus: Phase3TriageTaskStatus,
    nextStatus: Phase3TriageTaskStatus,
  ): void {
    const legal = phase3TriageLegalTransitions[previousStatus];
    invariant(
      legal.includes(nextStatus),
      "ILLEGAL_TRIAGE_WORKFLOW_TRANSITION",
      `Illegal triage workflow transition ${previousStatus} -> ${nextStatus}.`,
    );
  }

  assertLiveMutationContext(input: {
    task: Phase3TriageTaskDocument;
    presentedOwnershipEpoch: number;
    presentedFencingToken: string;
    presentedLineageFenceEpoch: number;
  }): void {
    this.assertPresentedTaskTuple(input);
    this.assertActiveOwnership(input.task);
  }

  assertActiveAssignment(task: Phase3TriageTaskDocument): void {
    const snapshot = task.toSnapshot();
    invariant(
      snapshot.assignedTo !== null,
      "TASK_NOT_ASSIGNED",
      "Task assignment is required for this operation.",
    );
  }

  assertConsequenceHooks(input: {
    nextStatus: Phase3TriageTaskStatus;
    currentDecisionEpochRef?: string | null;
    currentEndpointDecisionRef?: string | null;
    moreInfoContractRef?: string | null;
    escalationContractRef?: string | null;
    consequenceHookRef?: string | null;
    lifecycleCoordinatorSignalRef?: string | null;
    reopenContractRef?: string | null;
  }): void {
    if (input.nextStatus === "awaiting_patient_info") {
      invariant(
        optionalRef(input.moreInfoContractRef) !== null,
        "MORE_INFO_CONTRACT_REQUIRED",
        "awaiting_patient_info requires the frozen more-info contract path or a fail-closed placeholder.",
      );
    }
    if (input.nextStatus === "endpoint_selected") {
      invariant(
        optionalRef(input.currentDecisionEpochRef) !== null &&
          optionalRef(input.currentEndpointDecisionRef) !== null,
        "ENDPOINT_EPOCH_REQUIRED",
        "endpoint_selected requires current endpoint and decision epoch refs.",
      );
    }
    if (input.nextStatus === "escalated") {
      invariant(
        optionalRef(input.currentDecisionEpochRef) !== null &&
          optionalRef(input.escalationContractRef) !== null,
        "ESCALATION_CONTRACT_REQUIRED",
        "escalated requires current DecisionEpoch and escalation contract refs.",
      );
    }
    if (input.nextStatus === "resolved_without_appointment" || input.nextStatus === "handoff_pending") {
      invariant(
        optionalRef(input.currentDecisionEpochRef) !== null &&
          optionalRef(input.consequenceHookRef) !== null,
        "CONSEQUENCE_SETTLEMENT_HOOK_REQUIRED",
        `${input.nextStatus} requires current DecisionEpoch and a consequence settlement hook.`,
      );
    }
    if (input.nextStatus === "closed") {
      invariant(
        optionalRef(input.lifecycleCoordinatorSignalRef) !== null,
        "LIFECYCLE_COORDINATOR_SIGNAL_REQUIRED",
        "Task close requires a lifecycle-coordinator signal ref.",
      );
    }
    if (input.nextStatus === "reopened") {
      invariant(
        optionalRef(input.reopenContractRef) !== null,
        "REOPEN_CONTRACT_REQUIRED",
        "reopened requires the frozen reopen contract path or a fail-closed placeholder.",
      );
    }
  }
}

export interface Phase3CommandContext {
  actorRef: string;
  routeIntentTupleHash: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  transitionEnvelopeRef: string;
  releaseRecoveryDispositionRef: string;
  causalToken: string;
  recordedAt: string;
  recoveryRouteRef?: string | null;
  result?: Phase3TaskSettlementResult;
  localAckState?: Phase3TaskLocalAckState;
  processingAcceptanceState?: Phase3ProcessingAcceptanceState;
  externalObservationState?: Phase3ExternalObservationState;
  authoritativeOutcomeState?: Phase3AuthoritativeOutcomeState;
}

interface Phase3LiveContext {
  presentedOwnershipEpoch: number;
  presentedFencingToken: string;
  presentedLineageFenceEpoch: number;
}

export interface CreatePhase3TriageTaskInput {
  taskId?: string;
  requestId: string;
  queueKey: string;
  sourceQueueRankSnapshotRef: string;
  returnAnchorRef: string;
  returnAnchorTupleHash: string;
  selectedAnchorRef: string;
  selectedAnchorTupleHash: string;
  workspaceTrustEnvelopeRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  taskCompletionSettlementEnvelopeRef: string;
  createdAt: string;
}

export interface ClaimPhase3TriageTaskInput extends Phase3LiveContext {
  taskId: string;
  actorRef: string;
  nextOwnershipEpoch: number;
  nextLineageFenceEpoch: number;
  nextFencingToken: string;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  leaseTtlSeconds: number;
  claimedAt: string;
  command: Phase3CommandContext;
}

export interface ReviewSessionContextInput extends Phase3LiveContext {
  taskId: string;
  staffWorkspaceConsistencyProjectionRef: string;
  workspaceSliceTrustProjectionRef: string;
  audienceSurfaceRuntimeBindingRef: string;
  reviewActionLeaseRef: string;
  requestLifecycleLeaseRef: string;
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
}

export interface TakeOverStaleTaskInput {
  taskId: string;
  actorRef: string;
  staleOwnerRecoveryRef: string;
  nextOwnershipEpoch: number;
  nextLineageFenceEpoch: number;
  nextFencingToken: string;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  leaseTtlSeconds: number;
  takeoverAt: string;
  command: Phase3CommandContext;
}

export interface TransitionTaskInput extends Phase3LiveContext {
  taskId: string;
  nextStatus: Phase3TriageTaskStatus;
  command: Phase3CommandContext;
  selectedAnchorRef?: string;
  selectedAnchorTupleHash?: string;
  moreInfoContractRef?: string | null;
  currentDecisionEpochRef?: string | null;
  currentEndpointDecisionRef?: string | null;
  escalationContractRef?: string | null;
  consequenceHookRef?: string | null;
  lifecycleCoordinatorSignalRef?: string | null;
  reopenContractRef?: string | null;
}

export interface ReleaseTaskInput extends Phase3LiveContext {
  taskId: string;
  nextLineageFenceEpoch: number;
  releasedAt: string;
  command: Phase3CommandContext;
}

export interface HeartbeatReviewSessionInput extends Phase3LiveContext {
  taskId: string;
  reviewSessionId: string;
  heartbeatAt: string;
}

export interface RefreshActiveLeaseInput extends Phase3LiveContext {
  taskId: string;
  nextOwnershipEpoch: number;
  nextLineageFenceEpoch: number;
  nextFencingToken: string;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  leaseTtlSeconds: number;
  refreshedAt: string;
}

export interface ReopenTaskInput extends Phase3LiveContext {
  taskId: string;
  actorRef: string;
  nextOwnershipEpoch: number;
  nextLineageFenceEpoch: number;
  nextFencingToken: string;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  leaseTtlSeconds: number;
  reopenedAt: string;
  command: Phase3CommandContext;
  reopenContractRef: string;
  retainCurrentLease?: boolean;
  selectedAnchorRef?: string;
  selectedAnchorTupleHash?: string;
}

export interface MarkStaleOwnerDetectedInput {
  taskId: string;
  staleOwnerRecoveryRef: string;
  nextLineageFenceEpoch: number;
  detectedAt: string;
  broken: boolean;
}

export interface Phase3TriageTransitionResult {
  task: Phase3TriageTaskSnapshot;
  launchContext: Phase3TaskLaunchContextSnapshot;
  reviewSession: Phase3ReviewSessionSnapshot | null;
  taskSettlement: Phase3TaskCommandSettlementSnapshot | null;
  transitionJournalEntry: Phase3TaskTransitionJournalEntrySnapshot | null;
  emittedEventName: string | null;
}

function emittedEventName(previousStatus: Phase3TriageTaskStatus, nextStatus: Phase3TriageTaskStatus): string {
  return `phase3.triage.task.transition.${previousStatus}.${nextStatus}.v1`;
}

function buildTaskSettlement(
  idGenerator: BackboneIdGenerator,
  task: Phase3TriageTaskDocument,
  actionScope: Phase3TaskActionScope,
  command: Phase3CommandContext,
): Phase3TaskCommandSettlementDocument {
  const taskSnapshot = task.toSnapshot();
  return Phase3TaskCommandSettlementDocument.create({
    settlementId: nextKernelId(idGenerator, "phase3_task_command_settlement"),
    taskId: taskSnapshot.taskId,
    actionScope,
    governingObjectRef: taskSnapshot.taskId,
    canonicalObjectDescriptorRef: "TriageTask",
    governingObjectVersionRef: `${taskSnapshot.taskId}@v${task.version + 1}`,
    routeIntentTupleHash: requireRef(command.routeIntentTupleHash, "routeIntentTupleHash"),
    routeIntentBindingRef: requireRef(command.routeIntentBindingRef, "routeIntentBindingRef"),
    commandActionRecordRef: requireRef(command.commandActionRecordRef, "commandActionRecordRef"),
    commandSettlementRecordRef: requireRef(
      command.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    transitionEnvelopeRef: requireRef(command.transitionEnvelopeRef, "transitionEnvelopeRef"),
    releaseRecoveryDispositionRef: requireRef(
      command.releaseRecoveryDispositionRef,
      "releaseRecoveryDispositionRef",
    ),
    result: command.result ?? "applied",
    localAckState: command.localAckState ?? "shown",
    processingAcceptanceState: command.processingAcceptanceState ?? "accepted_for_processing",
    externalObservationState: command.externalObservationState ?? "projection_visible",
    authoritativeOutcomeState: command.authoritativeOutcomeState ?? "settled",
    settlementRevision: 1,
    causalToken: requireRef(command.causalToken, "causalToken"),
    recordedAt: ensureIsoTimestamp(command.recordedAt, "recordedAt"),
    recoveryRouteRef: optionalRef(command.recoveryRouteRef),
  });
}

function buildTransitionJournalEntry(
  idGenerator: BackboneIdGenerator,
  input: {
    task: Phase3TriageTaskDocument;
    previousStatus: Phase3TriageTaskStatus;
    nextStatus: Phase3TriageTaskStatus;
    command: Phase3CommandContext;
    reasonCode: Phase3TransitionReasonCode;
  },
): Phase3TaskTransitionJournalEntryDocument {
  const snapshot = input.task.toSnapshot();
  return Phase3TaskTransitionJournalEntryDocument.create({
    transitionJournalEntryId: nextKernelId(idGenerator, "phase3_task_transition_journal"),
    taskId: snapshot.taskId,
    previousStatus: input.previousStatus,
    nextStatus: input.nextStatus,
    actorRef: requireRef(input.command.actorRef, "actorRef"),
    routeIntentBindingRef: requireRef(input.command.routeIntentBindingRef, "routeIntentBindingRef"),
    commandActionRecordRef: requireRef(input.command.commandActionRecordRef, "commandActionRecordRef"),
    commandSettlementRecordRef: requireRef(
      input.command.commandSettlementRecordRef,
      "commandSettlementRecordRef",
    ),
    currentOwnershipEpoch: snapshot.ownershipEpoch,
    currentLineageFenceEpoch: snapshot.currentLineageFenceEpoch,
    reasonCode: input.reasonCode,
    emittedEventName: emittedEventName(input.previousStatus, input.nextStatus),
    recordedAt: ensureIsoTimestamp(input.command.recordedAt, "recordedAt"),
  });
}

export class Phase3TriageTransitionExecutor {
  private readonly guard = new Phase3TriageTransitionGuard();

  constructor(
    private readonly repositories: Phase3TriageKernelRepositories,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  private async requireTask(taskId: string): Promise<Phase3TriageTaskDocument> {
    const task = await this.repositories.getTask(taskId);
    invariant(task, "TRIAGE_TASK_NOT_FOUND", `TriageTask ${taskId} is required.`);
    return task;
  }

  private async requireLaunchContext(task: Phase3TriageTaskDocument): Promise<Phase3TaskLaunchContextDocument> {
    const launchContext = await this.repositories.getLaunchContext(task.toSnapshot().launchContextRef);
    invariant(
      launchContext,
      "TASK_LAUNCH_CONTEXT_NOT_FOUND",
      `TaskLaunchContext ${task.toSnapshot().launchContextRef} is required.`,
    );
    return launchContext;
  }

  private async maybeLoadActiveSession(
    task: Phase3TriageTaskDocument,
  ): Promise<Phase3ReviewSessionDocument | undefined> {
    const activeReviewSessionRef = task.toSnapshot().activeReviewSessionRef;
    return activeReviewSessionRef
      ? this.repositories.getReviewSession(activeReviewSessionRef)
      : undefined;
  }

  async createTask(input: CreatePhase3TriageTaskInput): Promise<Phase3TriageTransitionResult> {
    return this.repositories.withTaskBoundary(async () => {
      const createdAt = ensureIsoTimestamp(input.createdAt, "createdAt");
      const taskId = optionalRef(input.taskId) ?? nextKernelId(this.idGenerator, "phase3_triage_task");
      const launchContext = Phase3TaskLaunchContextDocument.create({
        launchContextId: nextKernelId(this.idGenerator, "phase3_task_launch_context"),
        taskId,
        sourceQueueKey: input.queueKey,
        sourceSavedViewRef: null,
        sourceRowIndex: null,
        sourceQueueRankSnapshotRef: input.sourceQueueRankSnapshotRef,
        returnAnchorRef: input.returnAnchorRef,
        returnAnchorTupleHash: input.returnAnchorTupleHash,
        nextTaskCandidateRefs: [],
        nextTaskRankSnapshotRef: null,
        previewSnapshotRef: null,
        previewDigestRef: null,
        prefetchWindowRef: null,
        prefetchCandidateRefs: [],
        prefetchRankSnapshotRef: null,
        selectedAnchorRef: input.selectedAnchorRef,
        selectedAnchorTupleHash: input.selectedAnchorTupleHash,
        changedSinceSeenAt: null,
        nextTaskBlockingReasonRefs: [],
        nextTaskLaunchState: "blocked",
        departingTaskReturnStubState: "none",
        createdAt,
        updatedAt: createdAt,
      });
      const task = Phase3TriageTaskDocument.create({
        taskId,
        requestId: input.requestId,
        queueKey: input.queueKey,
        assignedTo: null,
        status: "triage_ready",
        reviewVersion: 0,
        ownershipEpoch: 0,
        fencingToken: sha256Hex(`${taskId}::seed`),
        currentLineageFenceEpoch: 0,
        ownershipState: "releasing",
        reviewFreshnessState: "fresh",
        launchContextRef: launchContext.toSnapshot().launchContextId,
        workspaceTrustEnvelopeRef: input.workspaceTrustEnvelopeRef,
        surfaceRouteContractRef: input.surfaceRouteContractRef,
        surfacePublicationRef: input.surfacePublicationRef,
        runtimePublicationBundleRef: input.runtimePublicationBundleRef,
        taskCompletionSettlementEnvelopeRef: input.taskCompletionSettlementEnvelopeRef,
        lifecycleLeaseRef: null,
        leaseAuthorityRef: null,
        leaseTtlSeconds: null,
        lastHeartbeatAt: null,
        staleOwnerRecoveryRef: null,
        activeReviewSessionRef: null,
        duplicateClusterRef: null,
        currentEndpointDecisionRef: null,
        currentDecisionEpochRef: null,
        latestDecisionSupersessionRef: null,
        duplicateResolutionDecisionRef: null,
        duplicateReviewSnapshotRef: null,
        releaseRecoveryDispositionRef: null,
        createdAt,
        updatedAt: createdAt,
      });
      await this.repositories.saveLaunchContext(launchContext);
      await this.repositories.saveTask(task);
      return {
        task: task.toSnapshot(),
        launchContext: launchContext.toSnapshot(),
        reviewSession: null,
        taskSettlement: null,
        transitionJournalEntry: null,
        emittedEventName: null,
      };
    });
  }

  async claimTask(input: ClaimPhase3TriageTaskInput): Promise<Phase3TriageTransitionResult> {
    return this.repositories.withTaskBoundary(async () => {
      const task = await this.requireTask(input.taskId);
      const launchContext = await this.requireLaunchContext(task);
      this.guard.assertWorkflowTransition(task.toSnapshot().status, "claimed");
      invariant(
        task.toSnapshot().ownershipEpoch === input.presentedOwnershipEpoch,
        "STALE_CLAIM_CONTEXT",
        "Claim requires the current task ownership epoch; presented claim context is stale.",
      );
      invariant(
        task.toSnapshot().fencingToken === requireRef(input.presentedFencingToken, "presentedFencingToken"),
        "STALE_CLAIM_FENCING_TOKEN",
        "Claim requires the current task fencing token; presented claim context is stale.",
      );
      invariant(
        task.toSnapshot().currentLineageFenceEpoch === input.presentedLineageFenceEpoch,
        "STALE_CLAIM_LINEAGE_EPOCH",
        "Claim requires the current task lineage fence epoch; presented claim context is stale.",
      );
      invariant(
        input.nextOwnershipEpoch > task.toSnapshot().ownershipEpoch,
        "CLAIM_OWNERSHIP_EPOCH_NOT_INCREMENTED",
        "Claim must advance ownershipEpoch.",
      );
      invariant(
        input.nextLineageFenceEpoch > task.toSnapshot().currentLineageFenceEpoch,
        "CLAIM_LINEAGE_FENCE_EPOCH_NOT_INCREMENTED",
        "Claim must advance currentLineageFenceEpoch.",
      );

      const updatedTask = task.update({
        assignedTo: input.actorRef,
        status: "claimed",
        ownershipEpoch: input.nextOwnershipEpoch,
        fencingToken: input.nextFencingToken,
        currentLineageFenceEpoch: input.nextLineageFenceEpoch,
        ownershipState: "active",
        lifecycleLeaseRef: input.lifecycleLeaseRef,
        leaseAuthorityRef: input.leaseAuthorityRef,
        leaseTtlSeconds: input.leaseTtlSeconds,
        lastHeartbeatAt: input.claimedAt,
        staleOwnerRecoveryRef: null,
        releaseRecoveryDispositionRef: input.command.releaseRecoveryDispositionRef,
        updatedAt: input.claimedAt,
      });
      const settlement = buildTaskSettlement(this.idGenerator, updatedTask, "task_claim", input.command);
      const journal = buildTransitionJournalEntry(this.idGenerator, {
        task: updatedTask,
        previousStatus: task.toSnapshot().status,
        nextStatus: "claimed",
        command: input.command,
        reasonCode: "task_claimed",
      });
      await this.repositories.saveTaskCommandSettlement(settlement);
      await this.repositories.saveTransitionJournalEntry(journal);
      await this.repositories.saveTask(updatedTask, { expectedVersion: task.version });

      return {
        task: updatedTask.toSnapshot(),
        launchContext: launchContext.toSnapshot(),
        reviewSession: null,
        taskSettlement: settlement.toSnapshot(),
        transitionJournalEntry: journal.toSnapshot(),
        emittedEventName: journal.toSnapshot().emittedEventName,
      };
    });
  }

  async enterReview(input: ReviewSessionContextInput & { command: Phase3CommandContext; openedAt: string }): Promise<Phase3TriageTransitionResult> {
    return this.repositories.withTaskBoundary(async () => {
      const task = await this.requireTask(input.taskId);
      const launchContext = await this.requireLaunchContext(task);
      this.guard.assertLiveMutationContext({
        task,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      });
      this.guard.assertWorkflowTransition(task.toSnapshot().status, "in_review");

      const reviewSession = Phase3ReviewSessionDocument.create({
        reviewSessionId: nextKernelId(this.idGenerator, "phase3_review_session"),
        taskId: task.toSnapshot().taskId,
        openedBy: input.command.actorRef,
        openedAt: input.openedAt,
        lastActivityAt: input.openedAt,
        sessionState: "active",
        workspaceSnapshotVersion: task.toSnapshot().reviewVersion + 1,
        selectedAnchorRef: input.selectedAnchorRef,
        selectedAnchorTupleHashRef: input.selectedAnchorTupleHashRef,
        bufferState: "none",
        lineageFenceEpoch: input.presentedLineageFenceEpoch,
        staffWorkspaceConsistencyProjectionRef: input.staffWorkspaceConsistencyProjectionRef,
        workspaceSliceTrustProjectionRef: input.workspaceSliceTrustProjectionRef,
        workspaceTrustEnvelopeRef: task.toSnapshot().workspaceTrustEnvelopeRef,
        requestLifecycleLeaseRef: input.requestLifecycleLeaseRef,
        reviewActionLeaseRef: input.reviewActionLeaseRef,
        ownershipEpochRef: input.presentedOwnershipEpoch,
        audienceSurfaceRuntimeBindingRef: input.audienceSurfaceRuntimeBindingRef,
        surfaceRouteContractRef: task.toSnapshot().surfaceRouteContractRef,
        surfacePublicationRef: task.toSnapshot().surfacePublicationRef,
        runtimePublicationBundleRef: task.toSnapshot().runtimePublicationBundleRef,
        releaseRecoveryDispositionRef: input.command.releaseRecoveryDispositionRef,
        transitionEnvelopeRef: input.command.transitionEnvelopeRef,
      });
      const updatedLaunchContext = launchContext.update({
        selectedAnchorRef: input.selectedAnchorRef,
        selectedAnchorTupleHash: input.selectedAnchorTupleHashRef,
        updatedAt: input.openedAt,
      });
      const updatedTask = task.update({
        status: "in_review",
        reviewVersion: task.toSnapshot().reviewVersion + 1,
        activeReviewSessionRef: reviewSession.toSnapshot().reviewSessionId,
        updatedAt: input.openedAt,
      });
      const settlement = buildTaskSettlement(this.idGenerator, updatedTask, "start_review", input.command);
      const journal = buildTransitionJournalEntry(this.idGenerator, {
        task: updatedTask,
        previousStatus: task.toSnapshot().status,
        nextStatus: "in_review",
        command: input.command,
        reasonCode: "review_started",
      });
      await this.repositories.saveReviewSession(reviewSession);
      await this.repositories.saveLaunchContext(updatedLaunchContext, { expectedVersion: launchContext.version });
      await this.repositories.saveTaskCommandSettlement(settlement);
      await this.repositories.saveTransitionJournalEntry(journal);
      await this.repositories.saveTask(updatedTask, { expectedVersion: task.version });
      return {
        task: updatedTask.toSnapshot(),
        launchContext: updatedLaunchContext.toSnapshot(),
        reviewSession: reviewSession.toSnapshot(),
        taskSettlement: settlement.toSnapshot(),
        transitionJournalEntry: journal.toSnapshot(),
        emittedEventName: journal.toSnapshot().emittedEventName,
      };
    });
  }

  async heartbeatReviewSession(input: HeartbeatReviewSessionInput): Promise<Phase3TriageTransitionResult> {
    return this.repositories.withTaskBoundary(async () => {
      const task = await this.requireTask(input.taskId);
      const launchContext = await this.requireLaunchContext(task);
      this.guard.assertLiveMutationContext({
        task,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      });
      const reviewSession = await this.repositories.getReviewSession(input.reviewSessionId);
      invariant(reviewSession, "REVIEW_SESSION_NOT_FOUND", `ReviewSession ${input.reviewSessionId} is required.`);
      invariant(
        reviewSession.toSnapshot().taskId === input.taskId,
        "REVIEW_SESSION_TASK_MISMATCH",
        "ReviewSession does not belong to the requested task.",
      );
      invariant(
        reviewSession.toSnapshot().sessionState === "active",
        "REVIEW_SESSION_NOT_ACTIVE",
        "Only active review sessions may heartbeat.",
      );
      const updatedSession = reviewSession.update({
        lastActivityAt: input.heartbeatAt,
        workspaceSnapshotVersion: reviewSession.toSnapshot().workspaceSnapshotVersion + 1,
      });
      const updatedTask = task.update({
        lastHeartbeatAt: input.heartbeatAt,
        updatedAt: input.heartbeatAt,
      });
      await this.repositories.saveReviewSession(updatedSession, { expectedVersion: reviewSession.version });
      await this.repositories.saveTask(updatedTask, { expectedVersion: task.version });
      return {
        task: updatedTask.toSnapshot(),
        launchContext: launchContext.toSnapshot(),
        reviewSession: updatedSession.toSnapshot(),
        taskSettlement: null,
        transitionJournalEntry: null,
        emittedEventName: null,
      };
    });
  }

  async refreshActiveLease(input: RefreshActiveLeaseInput): Promise<Phase3TriageTransitionResult> {
    return this.repositories.withTaskBoundary(async () => {
      const task = await this.requireTask(input.taskId);
      const launchContext = await this.requireLaunchContext(task);
      this.guard.assertLiveMutationContext({
        task,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      });
      this.guard.assertActiveOwnership(task);
      invariant(
        input.nextOwnershipEpoch > task.toSnapshot().ownershipEpoch,
        "REFRESH_LEASE_OWNERSHIP_EPOCH_NOT_INCREMENTED",
        "refreshActiveLease must advance ownershipEpoch.",
      );
      invariant(
        input.nextLineageFenceEpoch > task.toSnapshot().currentLineageFenceEpoch,
        "REFRESH_LEASE_LINEAGE_FENCE_EPOCH_NOT_INCREMENTED",
        "refreshActiveLease must advance currentLineageFenceEpoch.",
      );

      const activeSession = await this.maybeLoadActiveSession(task);
      const updatedSession =
        activeSession &&
        activeSession.toSnapshot().sessionState !== "superseded" &&
        activeSession.toSnapshot().sessionState !== "closed"
          ? activeSession.update({
              requestLifecycleLeaseRef: input.lifecycleLeaseRef,
              ownershipEpochRef: input.nextOwnershipEpoch,
              lineageFenceEpoch: input.nextLineageFenceEpoch,
              lastActivityAt: input.refreshedAt,
            })
          : null;
      const updatedTask = task.update({
        ownershipEpoch: input.nextOwnershipEpoch,
        fencingToken: input.nextFencingToken,
        currentLineageFenceEpoch: input.nextLineageFenceEpoch,
        ownershipState: "active",
        lifecycleLeaseRef: input.lifecycleLeaseRef,
        leaseAuthorityRef: input.leaseAuthorityRef,
        leaseTtlSeconds: input.leaseTtlSeconds,
        lastHeartbeatAt: input.refreshedAt,
        staleOwnerRecoveryRef: null,
        updatedAt: input.refreshedAt,
      });

      if (updatedSession) {
        await this.repositories.saveReviewSession(updatedSession, {
          expectedVersion: activeSession!.version,
        });
      }
      await this.repositories.saveTask(updatedTask, { expectedVersion: task.version });
      return {
        task: updatedTask.toSnapshot(),
        launchContext: launchContext.toSnapshot(),
        reviewSession: updatedSession?.toSnapshot() ?? activeSession?.toSnapshot() ?? null,
        taskSettlement: null,
        transitionJournalEntry: null,
        emittedEventName: null,
      };
    });
  }

  async reopenTask(input: ReopenTaskInput): Promise<Phase3TriageTransitionResult> {
    return this.repositories.withTaskBoundary(async () => {
      const task = await this.requireTask(input.taskId);
      const currentLaunchContext = await this.requireLaunchContext(task);
      let launchContext = currentLaunchContext;
      this.guard.assertPresentedTaskTuple({
        task,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      });
      this.guard.assertWorkflowTransition(task.toSnapshot().status, "reopened");
      this.guard.assertConsequenceHooks({
        nextStatus: "reopened",
        reopenContractRef: input.reopenContractRef,
      });
      const retainCurrentLease = input.retainCurrentLease === true;
      if (retainCurrentLease) {
        invariant(
          input.nextOwnershipEpoch === task.toSnapshot().ownershipEpoch,
          "REOPEN_CURRENT_LEASE_OWNERSHIP_EPOCH_MISMATCH",
          "Current-lease reopen must preserve ownershipEpoch.",
        );
        invariant(
          input.nextLineageFenceEpoch === task.toSnapshot().currentLineageFenceEpoch,
          "REOPEN_CURRENT_LEASE_LINEAGE_EPOCH_MISMATCH",
          "Current-lease reopen must preserve currentLineageFenceEpoch.",
        );
      } else {
        invariant(
          input.nextOwnershipEpoch > task.toSnapshot().ownershipEpoch,
          "REOPEN_OWNERSHIP_EPOCH_NOT_INCREMENTED",
          "reopenTask must advance ownershipEpoch.",
        );
        invariant(
          input.nextLineageFenceEpoch > task.toSnapshot().currentLineageFenceEpoch,
          "REOPEN_LINEAGE_FENCE_EPOCH_NOT_INCREMENTED",
          "reopenTask must advance currentLineageFenceEpoch.",
        );
      }

      const activeSession = await this.maybeLoadActiveSession(task);
      const updatedSession =
        activeSession &&
        activeSession.toSnapshot().sessionState !== "superseded" &&
        activeSession.toSnapshot().sessionState !== "closed"
          ? activeSession.update({
              sessionState: "superseded",
              lastActivityAt: input.reopenedAt,
              transitionEnvelopeRef: input.command.transitionEnvelopeRef,
            })
          : null;

      if (input.selectedAnchorRef && input.selectedAnchorTupleHash) {
        launchContext = launchContext.update({
          selectedAnchorRef: input.selectedAnchorRef,
          selectedAnchorTupleHash: input.selectedAnchorTupleHash,
          returnAnchorRef: input.selectedAnchorRef,
          returnAnchorTupleHash: input.selectedAnchorTupleHash,
          updatedAt: input.reopenedAt,
        });
      }

      const updatedTask = task.update({
        assignedTo: input.actorRef,
        status: "reopened",
        ownershipEpoch: input.nextOwnershipEpoch,
        fencingToken: input.nextFencingToken,
        currentLineageFenceEpoch: input.nextLineageFenceEpoch,
        ownershipState: "active",
        reviewFreshnessState: "review_required",
        lifecycleLeaseRef: input.lifecycleLeaseRef,
        leaseAuthorityRef: input.leaseAuthorityRef,
        leaseTtlSeconds: input.leaseTtlSeconds,
        lastHeartbeatAt: input.reopenedAt,
        staleOwnerRecoveryRef: null,
        activeReviewSessionRef: null,
        releaseRecoveryDispositionRef: input.command.releaseRecoveryDispositionRef,
        updatedAt: input.reopenedAt,
      });
      const settlement = buildTaskSettlement(this.idGenerator, updatedTask, "reopen", input.command);
      const journal = buildTransitionJournalEntry(this.idGenerator, {
        task: updatedTask,
        previousStatus: task.toSnapshot().status,
        nextStatus: "reopened",
        command: input.command,
        reasonCode: "task_reopened",
      });

      if (updatedSession) {
        await this.repositories.saveReviewSession(updatedSession, {
          expectedVersion: activeSession!.version,
        });
      }
      await this.repositories.saveLaunchContext(launchContext, {
        expectedVersion: currentLaunchContext.version,
      });
      await this.repositories.saveTaskCommandSettlement(settlement);
      await this.repositories.saveTransitionJournalEntry(journal);
      await this.repositories.saveTask(updatedTask, { expectedVersion: task.version });
      return {
        task: updatedTask.toSnapshot(),
        launchContext: launchContext.toSnapshot(),
        reviewSession: updatedSession?.toSnapshot() ?? activeSession?.toSnapshot() ?? null,
        taskSettlement: settlement.toSnapshot(),
        transitionJournalEntry: journal.toSnapshot(),
        emittedEventName: journal.toSnapshot().emittedEventName,
      };
    });
  }

  async releaseTask(input: ReleaseTaskInput): Promise<Phase3TriageTransitionResult> {
    return this.repositories.withTaskBoundary(async () => {
      const task = await this.requireTask(input.taskId);
      const launchContext = await this.requireLaunchContext(task);
      this.guard.assertLiveMutationContext({
        task,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      });
      invariant(
        input.nextLineageFenceEpoch > task.toSnapshot().currentLineageFenceEpoch,
        "RELEASE_LINEAGE_FENCE_EPOCH_NOT_INCREMENTED",
        "releaseTask must advance currentLineageFenceEpoch.",
      );
      const activeSession = task.toSnapshot().activeReviewSessionRef
        ? await this.maybeLoadActiveSession(task)
        : undefined;
      const updatedSession =
        activeSession && activeSession.toSnapshot().sessionState === "active"
          ? activeSession.update({
              sessionState: "release_pending",
              lastActivityAt: input.releasedAt,
            })
          : null;
      const updatedTask = task.update({
        ownershipState: "releasing",
        currentLineageFenceEpoch: input.nextLineageFenceEpoch,
        updatedAt: input.releasedAt,
      });
      const settlement = buildTaskSettlement(this.idGenerator, updatedTask, "task_release", input.command);
      const journal = buildTransitionJournalEntry(this.idGenerator, {
        task: updatedTask,
        previousStatus: task.toSnapshot().status,
        nextStatus: task.toSnapshot().status,
        command: input.command,
        reasonCode: "lease_release_requested",
      });
      if (updatedSession) {
        await this.repositories.saveReviewSession(updatedSession, { expectedVersion: activeSession!.version });
      }
      await this.repositories.saveTaskCommandSettlement(settlement);
      await this.repositories.saveTransitionJournalEntry(journal);
      await this.repositories.saveTask(updatedTask, { expectedVersion: task.version });
      return {
        task: updatedTask.toSnapshot(),
        launchContext: launchContext.toSnapshot(),
        reviewSession: updatedSession?.toSnapshot() ?? activeSession?.toSnapshot() ?? null,
        taskSettlement: settlement.toSnapshot(),
        transitionJournalEntry: journal.toSnapshot(),
        emittedEventName: journal.toSnapshot().emittedEventName,
      };
    });
  }

  async markStaleOwnerDetected(input: MarkStaleOwnerDetectedInput): Promise<Phase3TriageTransitionResult> {
    return this.repositories.withTaskBoundary(async () => {
      const task = await this.requireTask(input.taskId);
      const launchContext = await this.requireLaunchContext(task);
      invariant(
        input.nextLineageFenceEpoch > task.toSnapshot().currentLineageFenceEpoch,
        "STALE_OWNER_LINEAGE_FENCE_EPOCH_NOT_INCREMENTED",
        "markStaleOwnerDetected must advance currentLineageFenceEpoch.",
      );
      const activeSession = await this.maybeLoadActiveSession(task);
      const updatedSession =
        activeSession && activeSession.toSnapshot().sessionState !== "superseded"
          ? activeSession.update({
              sessionState: "superseded",
              lastActivityAt: input.detectedAt,
            })
          : null;
      const updatedTask = task.update({
        ownershipState: input.broken ? "broken" : "expired",
        currentLineageFenceEpoch: input.nextLineageFenceEpoch,
        staleOwnerRecoveryRef: input.staleOwnerRecoveryRef,
        updatedAt: input.detectedAt,
      });
      if (updatedSession) {
        await this.repositories.saveReviewSession(updatedSession, { expectedVersion: activeSession!.version });
      }
      await this.repositories.saveTask(updatedTask, { expectedVersion: task.version });
      return {
        task: updatedTask.toSnapshot(),
        launchContext: launchContext.toSnapshot(),
        reviewSession: updatedSession?.toSnapshot() ?? activeSession?.toSnapshot() ?? null,
        taskSettlement: null,
        transitionJournalEntry: null,
        emittedEventName: null,
      };
    });
  }

  async takeOverStaleTask(input: TakeOverStaleTaskInput): Promise<Phase3TriageTransitionResult> {
    return this.repositories.withTaskBoundary(async () => {
      const task = await this.requireTask(input.taskId);
      const launchContext = await this.requireLaunchContext(task);
      invariant(
        task.toSnapshot().ownershipState === "expired" || task.toSnapshot().ownershipState === "broken",
        "TASK_NOT_STALE_FOR_TAKEOVER",
        "takeOverStaleTask requires expired or broken ownership state.",
      );
      invariant(
        task.toSnapshot().staleOwnerRecoveryRef === input.staleOwnerRecoveryRef,
        "STALE_RECOVERY_REFERENCE_MISMATCH",
        "takeOverStaleTask requires the current staleOwnerRecoveryRef.",
      );
      invariant(
        input.nextOwnershipEpoch > task.toSnapshot().ownershipEpoch,
        "TAKEOVER_OWNERSHIP_EPOCH_NOT_INCREMENTED",
        "takeOverStaleTask must advance ownershipEpoch.",
      );
      invariant(
        input.nextLineageFenceEpoch > task.toSnapshot().currentLineageFenceEpoch,
        "TAKEOVER_LINEAGE_FENCE_EPOCH_NOT_INCREMENTED",
        "takeOverStaleTask must advance currentLineageFenceEpoch.",
      );
      const activeSession = await this.maybeLoadActiveSession(task);
      const supersededSession =
        activeSession &&
        activeSession.toSnapshot().sessionState !== "superseded" &&
        activeSession.toSnapshot().sessionState !== "closed"
          ? activeSession.update({
              sessionState: "superseded",
              lastActivityAt: input.takeoverAt,
            })
          : null;
      const updatedTask = task.update({
        assignedTo: input.actorRef,
        status: "claimed",
        ownershipState: "active",
        ownershipEpoch: input.nextOwnershipEpoch,
        currentLineageFenceEpoch: input.nextLineageFenceEpoch,
        fencingToken: input.nextFencingToken,
        lifecycleLeaseRef: input.lifecycleLeaseRef,
        leaseAuthorityRef: input.leaseAuthorityRef,
        leaseTtlSeconds: input.leaseTtlSeconds,
        lastHeartbeatAt: input.takeoverAt,
        staleOwnerRecoveryRef: null,
        activeReviewSessionRef: null,
        updatedAt: input.takeoverAt,
      });
      const settlement = buildTaskSettlement(
        this.idGenerator,
        updatedTask,
        "take_over_stale_task",
        input.command,
      );
      const journal = buildTransitionJournalEntry(this.idGenerator, {
        task: updatedTask,
        previousStatus: task.toSnapshot().status,
        nextStatus: "claimed",
        command: input.command,
        reasonCode: "supervisor_takeover_committed",
      });
      if (supersededSession) {
        await this.repositories.saveReviewSession(supersededSession, {
          expectedVersion: activeSession!.version,
        });
      }
      await this.repositories.saveTaskCommandSettlement(settlement);
      await this.repositories.saveTransitionJournalEntry(journal);
      await this.repositories.saveTask(updatedTask, { expectedVersion: task.version });
      return {
        task: updatedTask.toSnapshot(),
        launchContext: launchContext.toSnapshot(),
        reviewSession: supersededSession?.toSnapshot() ?? activeSession?.toSnapshot() ?? null,
        taskSettlement: settlement.toSnapshot(),
        transitionJournalEntry: journal.toSnapshot(),
        emittedEventName: journal.toSnapshot().emittedEventName,
      };
    });
  }

  async transitionTask(input: TransitionTaskInput): Promise<Phase3TriageTransitionResult> {
    return this.repositories.withTaskBoundary(async () => {
      const task = await this.requireTask(input.taskId);
      const currentLaunchContext = await this.requireLaunchContext(task);
      let launchContext = currentLaunchContext;
      this.guard.assertPresentedTaskTuple({
        task,
        presentedOwnershipEpoch: input.presentedOwnershipEpoch,
        presentedFencingToken: input.presentedFencingToken,
        presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      });
      if (
        task.toSnapshot().status === "claimed" ||
        task.toSnapshot().status === "in_review" ||
        task.toSnapshot().status === "endpoint_selected"
      ) {
        this.guard.assertActiveOwnership(task);
      }
      this.guard.assertWorkflowTransition(task.toSnapshot().status, input.nextStatus);
      this.guard.assertConsequenceHooks({
        nextStatus: input.nextStatus,
        currentDecisionEpochRef: input.currentDecisionEpochRef,
        currentEndpointDecisionRef: input.currentEndpointDecisionRef,
        moreInfoContractRef: input.moreInfoContractRef,
        escalationContractRef: input.escalationContractRef,
        consequenceHookRef: input.consequenceHookRef,
        lifecycleCoordinatorSignalRef: input.lifecycleCoordinatorSignalRef,
        reopenContractRef: input.reopenContractRef,
      });

      const activeSession = await this.maybeLoadActiveSession(task);
      let updatedSession: Phase3ReviewSessionDocument | null = null;
      if (
        activeSession &&
        (input.nextStatus === "queued" ||
          input.nextStatus === "awaiting_patient_info" ||
          input.nextStatus === "resolved_without_appointment" ||
          input.nextStatus === "handoff_pending" ||
          input.nextStatus === "closed" ||
          input.nextStatus === "reopened")
      ) {
        updatedSession = activeSession.update({
          sessionState:
            input.nextStatus === "queued" || input.nextStatus === "awaiting_patient_info"
              ? "released"
              : input.nextStatus === "reopened"
                ? "superseded"
                : "closed",
          lastActivityAt: input.command.recordedAt,
          transitionEnvelopeRef: input.command.transitionEnvelopeRef,
        });
      }

      if (input.selectedAnchorRef && input.selectedAnchorTupleHash) {
        launchContext = launchContext.update({
          selectedAnchorRef: input.selectedAnchorRef,
          selectedAnchorTupleHash: input.selectedAnchorTupleHash,
          returnAnchorRef: input.selectedAnchorRef,
          returnAnchorTupleHash: input.selectedAnchorTupleHash,
          updatedAt: input.command.recordedAt,
        });
      }

      const nextOwnershipState =
        input.nextStatus === "queued" || input.nextStatus === "closed" || input.nextStatus === "reopened"
          ? "releasing"
          : task.toSnapshot().ownershipState;
      const nextAssignedTo =
        input.nextStatus === "queued" || input.nextStatus === "closed" || input.nextStatus === "reopened"
          ? null
          : task.toSnapshot().assignedTo;
      const nextReviewFreshness =
        input.nextStatus === "reopened" ? "review_required" : task.toSnapshot().reviewFreshnessState;
      const nextActionScope: Phase3TaskActionScope =
        input.nextStatus === "queued"
          ? "move_to_queue"
          : input.nextStatus === "awaiting_patient_info"
            ? "request_more_info"
            : input.nextStatus === "review_resumed"
              ? "resume_review"
              : input.nextStatus === "endpoint_selected"
                ? "select_endpoint"
                : input.nextStatus === "escalated"
                  ? "escalate"
                  : input.nextStatus === "resolved_without_appointment"
                    ? "resolved_without_appointment"
                    : input.nextStatus === "handoff_pending"
                      ? "handoff_pending"
                      : input.nextStatus === "reopened"
                        ? "reopen"
                        : "close";
      const reasonCode: Phase3TransitionReasonCode =
        input.nextStatus === "queued"
          ? "task_returned_to_queue"
          : input.nextStatus === "awaiting_patient_info"
            ? "more_info_requested"
            : input.nextStatus === "review_resumed"
              ? "review_resumed_after_patient_reply"
              : input.nextStatus === "endpoint_selected"
                ? "endpoint_selected_under_current_epoch"
                : input.nextStatus === "escalated"
                  ? "escalation_selected_under_current_epoch"
                  : input.nextStatus === "resolved_without_appointment"
                    ? "resolved_without_appointment_settled"
                    : input.nextStatus === "handoff_pending"
                      ? "handoff_pending_settled"
                      : input.nextStatus === "reopened"
                        ? "task_reopened"
                        : "task_closed_after_lifecycle_signal";

      const updatedTask = task.update({
        status: input.nextStatus,
        assignedTo: nextAssignedTo,
        ownershipState: nextOwnershipState,
        reviewFreshnessState: nextReviewFreshness,
        lifecycleLeaseRef:
          input.nextStatus === "queued" ||
          input.nextStatus === "closed" ||
          input.nextStatus === "reopened"
            ? null
            : task.toSnapshot().lifecycleLeaseRef,
        leaseAuthorityRef:
          input.nextStatus === "queued" ||
          input.nextStatus === "closed" ||
          input.nextStatus === "reopened"
            ? null
            : task.toSnapshot().leaseAuthorityRef,
        leaseTtlSeconds:
          input.nextStatus === "queued" ||
          input.nextStatus === "closed" ||
          input.nextStatus === "reopened"
            ? null
            : task.toSnapshot().leaseTtlSeconds,
        reviewVersion: task.toSnapshot().reviewVersion + 1,
        activeReviewSessionRef:
          input.nextStatus === "in_review"
            ? task.toSnapshot().activeReviewSessionRef
            : updatedSession
              ? null
              : task.toSnapshot().activeReviewSessionRef,
        currentEndpointDecisionRef:
          input.nextStatus === "endpoint_selected" ? input.currentEndpointDecisionRef ?? null : task.toSnapshot().currentEndpointDecisionRef,
        currentDecisionEpochRef:
          input.nextStatus === "endpoint_selected" ||
          input.nextStatus === "escalated" ||
          input.nextStatus === "resolved_without_appointment" ||
          input.nextStatus === "handoff_pending"
            ? input.currentDecisionEpochRef ?? task.toSnapshot().currentDecisionEpochRef
            : task.toSnapshot().currentDecisionEpochRef,
        releaseRecoveryDispositionRef: input.command.releaseRecoveryDispositionRef,
        updatedAt: input.command.recordedAt,
      });
      const settlement = buildTaskSettlement(this.idGenerator, updatedTask, nextActionScope, input.command);
      const journal = buildTransitionJournalEntry(this.idGenerator, {
        task: updatedTask,
        previousStatus: task.toSnapshot().status,
        nextStatus: input.nextStatus,
        command: input.command,
        reasonCode,
      });

      if (updatedSession) {
        await this.repositories.saveReviewSession(updatedSession, { expectedVersion: activeSession!.version });
      }
      await this.repositories.saveLaunchContext(launchContext, {
        expectedVersion: currentLaunchContext.version,
      });
      await this.repositories.saveTaskCommandSettlement(settlement);
      await this.repositories.saveTransitionJournalEntry(journal);
      await this.repositories.saveTask(updatedTask, { expectedVersion: task.version });
      return {
        task: updatedTask.toSnapshot(),
        launchContext: launchContext.toSnapshot(),
        reviewSession: updatedSession?.toSnapshot() ?? activeSession?.toSnapshot() ?? null,
        taskSettlement: settlement.toSnapshot(),
        transitionJournalEntry: journal.toSnapshot(),
        emittedEventName: journal.toSnapshot().emittedEventName,
      };
    });
  }
}

export interface Phase3TriageKernelService {
  createTask(input: CreatePhase3TriageTaskInput): Promise<Phase3TriageTransitionResult>;
  claimTask(input: ClaimPhase3TriageTaskInput): Promise<Phase3TriageTransitionResult>;
  enterReview(
    input: ReviewSessionContextInput & { command: Phase3CommandContext; openedAt: string },
  ): Promise<Phase3TriageTransitionResult>;
  heartbeatReviewSession(input: HeartbeatReviewSessionInput): Promise<Phase3TriageTransitionResult>;
  refreshActiveLease(input: RefreshActiveLeaseInput): Promise<Phase3TriageTransitionResult>;
  reopenTask(input: ReopenTaskInput): Promise<Phase3TriageTransitionResult>;
  releaseTask(input: ReleaseTaskInput): Promise<Phase3TriageTransitionResult>;
  markStaleOwnerDetected(input: MarkStaleOwnerDetectedInput): Promise<Phase3TriageTransitionResult>;
  takeOverStaleTask(input: TakeOverStaleTaskInput): Promise<Phase3TriageTransitionResult>;
  transitionTask(input: TransitionTaskInput): Promise<Phase3TriageTransitionResult>;
}

export function createPhase3TriageKernelService(
  repositories: Phase3TriageKernelRepositories = createPhase3TriageKernelStore(),
  options?: { idGenerator?: BackboneIdGenerator },
): Phase3TriageKernelService {
  const idGenerator =
    options?.idGenerator ?? createDeterministicBackboneIdGenerator("phase3_triage_kernel");
  return new Phase3TriageTransitionExecutor(repositories, idGenerator);
}
