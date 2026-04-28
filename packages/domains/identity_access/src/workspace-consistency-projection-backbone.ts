import {
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  RequestBackboneInvariantError,
  buildWorkspaceEntityContinuityKey,
  computeWorkspaceTupleHash,
  createDeterministicBackboneIdGenerator,
  type WorkspaceRecoveryAction,
} from "@vecells/domain-kernel";
import {
  mapReleaseTrustSurfaceAuthorityToOperationalState,
  type ReleaseTrustFreezeVerdictSnapshot,
} from "./release-trust-freeze-backbone";

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

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function ensureNonNegativeInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative integer.`,
  );
  return value;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
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

function nextWorkspaceProjectionId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

export const workspaceProjectionReasonCodes = [
  "WORKSPACE_232_ROUTE_FAMILY_DRIFT",
  "WORKSPACE_232_ROUTE_CONTRACT_DRIFT",
  "WORKSPACE_232_SURFACE_PUBLICATION_DRIFT",
  "WORKSPACE_232_RUNTIME_PUBLICATION_DRIFT",
  "WORKSPACE_232_RELEASE_TRUST_DEGRADED",
  "WORKSPACE_232_RELEASE_TRUST_RECOVERY_BOUND",
  "WORKSPACE_232_RELEASE_TRUST_QUARANTINED",
  "WORKSPACE_232_REVIEW_FRESHNESS_QUEUED_UPDATES",
  "WORKSPACE_232_REVIEW_FRESHNESS_REVIEW_REQUIRED",
  "WORKSPACE_232_REVIEW_ACTION_LEASE_MISSING",
  "WORKSPACE_232_REVIEW_ACTION_LEASE_EXPIRED",
  "WORKSPACE_232_REQUEST_LIFECYCLE_LEASE_MISSING",
  "WORKSPACE_232_REQUEST_LIFECYCLE_LEASE_EXPIRED",
  "WORKSPACE_232_OWNERSHIP_EPOCH_MISMATCH",
  "WORKSPACE_232_FENCING_TOKEN_MISMATCH",
  "WORKSPACE_232_LINEAGE_FENCE_DRIFT",
  "WORKSPACE_232_SELECTED_ANCHOR_REMAPPABLE",
  "WORKSPACE_232_SELECTED_ANCHOR_LOST",
  "WORKSPACE_232_QUEUE_SNAPSHOT_DRIFT",
  "WORKSPACE_232_TASK_COMPLETION_PENDING",
  "WORKSPACE_232_CONTINUITY_EVIDENCE_DEGRADED",
  "WORKSPACE_232_CONTINUITY_EVIDENCE_STALE",
  "WORKSPACE_232_CONTINUITY_EVIDENCE_BLOCKED",
  "WORKSPACE_232_FOCUS_BUFFERING_ACTIVE",
  "WORKSPACE_232_PROTECTED_COMPOSITION_INVALIDATED",
  "WORKSPACE_232_CONSEQUENCE_REVIEW_REQUIRED",
  "WORKSPACE_232_CONSEQUENCE_SUPERSEDED",
  "WORKSPACE_232_STALE_OWNER_RECOVERY_OPEN",
  "WORKSPACE_232_DEPENDENCY_SLICE_DEGRADED",
  "WORKSPACE_232_DEPENDENCY_SLICE_QUARANTINED",
] as const;

export type WorkspaceProjectionReasonCode = (typeof workspaceProjectionReasonCodes)[number];
export type WorkspaceFamily =
  | "staff_review"
  | "support_ticket"
  | "hub_coordination"
  | "governance_review"
  | "ops_intervention";
export type WorkspaceCausalConsistencyState =
  | "consistent"
  | "stale_recoverable"
  | "recovery_required";
export type WorkspaceProjectionTrustState =
  | "trusted"
  | "degraded"
  | "recovery_bound"
  | "quarantined";
export type WorkspaceSliceTrustState = WorkspaceProjectionTrustState;
export type WorkspaceSliceRenderMode = "interactive" | "observe_only" | "recovery_required";
export type WorkspaceEnvelopeState =
  | "interactive"
  | "observe_only"
  | "stale_recoverable"
  | "recovery_required"
  | "reassigned";
export type WorkspaceMutationAuthorityState = "live" | "frozen" | "blocked";
export type WorkspaceInterruptionPacingState =
  | "live"
  | "buffered"
  | "blocking_only"
  | "recovery_only";
export type WorkspaceCompletionCalmState =
  | "not_eligible"
  | "pending_settlement"
  | "eligible"
  | "blocked";
export type WorkspaceFocusReason =
  | "composing"
  | "comparing"
  | "confirming"
  | "assistive_review"
  | "reading_delta"
  | "delivery_dispute_review";
export type WorkspaceFocusProtectionLeaseState =
  | "active"
  | "release_pending"
  | "invalidated"
  | "released"
  | "superseded";
export type WorkspaceInvalidatingDriftState =
  | "none"
  | "ownership"
  | "lineage"
  | "review_version"
  | "publication"
  | "trust"
  | "anchor_invalidated"
  | "compare_target_invalidated"
  | "settlement_drift";
export type ProtectedCompositionMode =
  | "drafting"
  | "compare_review"
  | "delta_review"
  | "approval_review"
  | "handoff_review"
  | "consequence_confirm"
  | "delivery_dispute_review";
export type AllowedLivePatchMode =
  | "blocking_only"
  | "non_disruptive_plus_blocking"
  | "local_ack_only";
export type ProtectedCompositionValidityState =
  | "live"
  | "stale_recoverable"
  | "recovery_only";
export type WorkspaceContinuityValidationState =
  | "trusted"
  | "degraded"
  | "stale"
  | "blocked";
export type WorkspaceContinuityLaunchState =
  | "trusted_ready"
  | "trusted_blocked"
  | "degraded"
  | "stale"
  | "blocked";
export type WorkspaceCompletionSettlementState =
  | "pending"
  | "settled"
  | "recovery_required"
  | "manual_handoff_required"
  | "stale_recoverable";
export type WorkspaceNextTaskLaunchState = "blocked" | "gated" | "ready" | "launched";
export type WorkspaceLeaseHealthState =
  | "live"
  | "expired"
  | "broken"
  | "superseded"
  | "missing";
export type WorkspaceConsequenceState = "current" | "review_required" | "superseded";
export type WorkspaceAnchorContinuityState =
  | "confirmed"
  | "stale_remappable"
  | "lost_recovery_required";

export interface StaffWorkspaceConsistencyProjectionSnapshot {
  workspaceConsistencyProjectionId: string;
  taskId: string;
  requestId: string;
  entityContinuityKey: string;
  bundleVersion: number;
  audienceTier: string;
  governingObjectRefs: readonly string[];
  entityVersionRefs: readonly string[];
  queueChangeBatchRef: string | null;
  reviewVersionRef: number;
  workspaceSnapshotVersion: number;
  computedAt: string;
  staleAt: string;
  causalConsistencyState: WorkspaceCausalConsistencyState;
  projectionTrustState: WorkspaceProjectionTrustState;
  blockingReasonRefs: readonly WorkspaceProjectionReasonCode[];
  version: number;
}

export interface WorkspaceSliceTrustProjectionSnapshot {
  workspaceSliceTrustProjectionId: string;
  taskId: string;
  queueSliceTrustState: WorkspaceSliceTrustState;
  taskSliceTrustState: WorkspaceSliceTrustState;
  attachmentSliceTrustState: WorkspaceSliceTrustState;
  assistiveSliceTrustState: WorkspaceSliceTrustState;
  dependencySliceTrustState: WorkspaceSliceTrustState;
  assuranceSliceTrustRefs: readonly string[];
  renderMode: WorkspaceSliceRenderMode;
  blockingDependencyRefs: readonly string[];
  evaluatedAt: string;
  version: number;
}

export interface ProtectedCompositionStateSnapshot {
  protectedCompositionStateId: string;
  taskId: string;
  focusProtectionLeaseRef: string;
  compositionMode: ProtectedCompositionMode;
  draftArtifactRefs: readonly string[];
  primarySelectedAnchorRef: string;
  compareAnchorRefs: readonly string[];
  assistiveInsertionPointRef: string | null;
  primaryReadingTargetRef: string;
  quietReturnTargetRef: string;
  allowedLivePatchMode: AllowedLivePatchMode;
  stateValidity: ProtectedCompositionValidityState;
  releaseGateRef: string;
  startedAt: string;
  releasedAt: string | null;
  invalidatingDriftState: WorkspaceInvalidatingDriftState;
  blockingReasonRefs: readonly WorkspaceProjectionReasonCode[];
  version: number;
}

export interface WorkspaceContinuityEvidenceProjectionSnapshot {
  workspaceContinuityEvidenceProjectionId: string;
  taskId: string;
  controlCode: "workspace_task_completion";
  routeFamilyRef: string;
  routeContinuityEvidenceContractRef: string;
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  sourceQueueRankSnapshotRef: string;
  latestTaskCompletionSettlementRef: string;
  latestPrefetchWindowRef: string | null;
  latestNextTaskLaunchLeaseRef: string | null;
  experienceContinuityEvidenceRef: string;
  continuityTupleHash: string;
  validationState: WorkspaceContinuityValidationState;
  nextTaskLaunchState: WorkspaceContinuityLaunchState;
  blockingRefs: readonly WorkspaceProjectionReasonCode[];
  anchorContinuityState: WorkspaceAnchorContinuityState;
  anchorRepairTargetRef: string | null;
  capturedAt: string;
  version: number;
}

export interface WorkspaceTrustEnvelopeSnapshot {
  workspaceTrustEnvelopeId: string;
  workspaceFamily: WorkspaceFamily;
  workspaceRef: string;
  taskOrCaseRef: string;
  queueKey: string;
  workspaceConsistencyProjectionRef: string;
  workspaceSliceTrustProjectionRef: string;
  primaryActionLeaseRef: string | null;
  requestLifecycleLeaseRef: string | null;
  focusProtectionLeaseRef: string | null;
  protectedCompositionStateRef: string | null;
  taskCompletionSettlementEnvelopeRef: string;
  surfaceRuntimeBindingRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
  sourceQueueRankSnapshotRef: string;
  continuityEvidenceRef: string;
  consistencyTupleHash: string;
  trustTupleHash: string;
  envelopeState: WorkspaceEnvelopeState;
  mutationAuthorityState: WorkspaceMutationAuthorityState;
  interruptionPacingState: WorkspaceInterruptionPacingState;
  completionCalmState: WorkspaceCompletionCalmState;
  blockingReasonRefs: readonly WorkspaceProjectionReasonCode[];
  requiredRecoveryAction: WorkspaceRecoveryAction;
  computedAt: string;
  version: number;
}

export interface WorkspaceContextProjectionBundle {
  taskId: string;
  requestId: string;
  queueKey: string;
  workspaceRef: string;
  staffWorkspaceConsistencyProjection: StaffWorkspaceConsistencyProjectionSnapshot;
  workspaceSliceTrustProjection: WorkspaceSliceTrustProjectionSnapshot;
  protectedCompositionState: ProtectedCompositionStateSnapshot | null;
  workspaceContinuityEvidenceProjection: WorkspaceContinuityEvidenceProjectionSnapshot;
  workspaceTrustEnvelope: WorkspaceTrustEnvelopeSnapshot;
}

export interface PersistedStaffWorkspaceConsistencyProjectionRow
  extends StaffWorkspaceConsistencyProjectionSnapshot {
  aggregateType: "StaffWorkspaceConsistencyProjection";
  persistenceSchemaVersion: 1;
}

export interface PersistedWorkspaceSliceTrustProjectionRow
  extends WorkspaceSliceTrustProjectionSnapshot {
  aggregateType: "WorkspaceSliceTrustProjection";
  persistenceSchemaVersion: 1;
}

export interface PersistedProtectedCompositionStateRow extends ProtectedCompositionStateSnapshot {
  aggregateType: "ProtectedCompositionState";
  persistenceSchemaVersion: 1;
}

export interface PersistedWorkspaceContinuityEvidenceProjectionRow
  extends WorkspaceContinuityEvidenceProjectionSnapshot {
  aggregateType: "WorkspaceContinuityEvidenceProjection";
  persistenceSchemaVersion: 1;
}

export interface PersistedWorkspaceTrustEnvelopeRow extends WorkspaceTrustEnvelopeSnapshot {
  aggregateType: "WorkspaceTrustEnvelope";
  persistenceSchemaVersion: 1;
}

export interface EvaluateStaffWorkspaceConsistencyProjectionInput {
  taskId: string;
  requestId: string;
  routeFamilyRef: string;
  selectedAnchorTupleHashRef: string;
  bundleVersion: number;
  audienceTier: string;
  governingObjectRefs: readonly string[];
  entityVersionRefs: readonly string[];
  queueChangeBatchRef?: string | null;
  reviewVersionRef: number;
  workspaceSnapshotVersion: number;
  reviewFreshnessState: "fresh" | "queued_updates" | "review_required";
  routeFamilyState: "matched" | "drifted";
  routeContractState: "matched" | "drifted";
  publicationState: "current" | "drifted" | "stale";
  consequenceState: WorkspaceConsequenceState;
  anchorContinuityState: WorkspaceAnchorContinuityState;
  releaseTrustState: WorkspaceProjectionTrustState;
  computedAt: string;
  staleAt: string;
}

export interface EvaluateWorkspaceSliceTrustProjectionInput {
  taskId: string;
  queueSliceTrustState: WorkspaceSliceTrustState;
  taskSliceTrustState: WorkspaceSliceTrustState;
  attachmentSliceTrustState: WorkspaceSliceTrustState;
  assistiveSliceTrustState: WorkspaceSliceTrustState;
  dependencySliceTrustState: WorkspaceSliceTrustState;
  assuranceSliceTrustRefs: readonly string[];
  blockingDependencyRefs?: readonly string[];
  evaluatedAt: string;
}

export interface EvaluateProtectedCompositionStateInput {
  taskId: string;
  focusProtectionLeaseRef: string;
  compositionMode: ProtectedCompositionMode;
  draftArtifactRefs: readonly string[];
  primarySelectedAnchorRef: string;
  compareAnchorRefs: readonly string[];
  assistiveInsertionPointRef?: string | null;
  primaryReadingTargetRef: string;
  quietReturnTargetRef: string;
  allowedLivePatchMode: AllowedLivePatchMode;
  focusProtectionLeaseState: WorkspaceFocusProtectionLeaseState;
  invalidatingDriftState: WorkspaceInvalidatingDriftState;
  releaseGateRef: string;
  startedAt: string;
  releasedAt?: string | null;
}

export interface EvaluateWorkspaceContinuityEvidenceProjectionInput {
  taskId: string;
  routeFamilyRef: string;
  routeContinuityEvidenceContractRef: string;
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
  continuitySelectedAnchorTupleHashRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  expectedSurfacePublicationRef: string;
  expectedRuntimePublicationBundleRef: string;
  sourceQueueRankSnapshotRef: string;
  continuitySourceQueueRankSnapshotRef: string;
  latestTaskCompletionSettlementRef: string;
  latestPrefetchWindowRef?: string | null;
  latestNextTaskLaunchLeaseRef?: string | null;
  experienceContinuityEvidenceRef: string;
  completionSettlementState: WorkspaceCompletionSettlementState;
  nextTaskLaunchState: WorkspaceNextTaskLaunchState;
  anchorRepairTargetRef?: string | null;
  capturedAt: string;
}

export interface EvaluateWorkspaceTrustEnvelopeInput {
  workspaceFamily: WorkspaceFamily;
  workspaceRef: string;
  taskOrCaseRef: string;
  queueKey: string;
  workspaceConsistencyProjection: StaffWorkspaceConsistencyProjectionSnapshot;
  workspaceSliceTrustProjection: WorkspaceSliceTrustProjectionSnapshot;
  primaryActionLeaseRef?: string | null;
  primaryActionLeaseState: WorkspaceLeaseHealthState;
  requestLifecycleLeaseRef?: string | null;
  requestLifecycleLeaseState: WorkspaceLeaseHealthState;
  focusProtectionLeaseRef?: string | null;
  protectedCompositionState?: ProtectedCompositionStateSnapshot | null;
  taskCompletionSettlementEnvelopeRef: string;
  surfaceRuntimeBindingRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
  sourceQueueRankSnapshotRef: string;
  continuityEvidenceProjection: WorkspaceContinuityEvidenceProjectionSnapshot;
  computedAt: string;
  staleOwnerRecoveryRef?: string | null;
}

export interface AssembleWorkspaceProjectionBundleInput {
  workspaceRef: string;
  workspaceFamily?: WorkspaceFamily;
  taskId: string;
  requestId: string;
  queueKey: string;
  routeFamilyRef: string;
  routeContinuityEvidenceContractRef: string;
  audienceTier: string;
  governingObjectRefs: readonly string[];
  entityVersionRefs: readonly string[];
  queueChangeBatchRef?: string | null;
  reviewVersionRef: number;
  workspaceSnapshotVersion: number;
  reviewFreshnessState: "fresh" | "queued_updates" | "review_required";
  currentRouteFamilyRef: string;
  expectedSurfaceRouteContractRef: string;
  currentSurfaceRouteContractRef: string;
  expectedSurfacePublicationRef: string;
  surfacePublicationRef: string;
  expectedRuntimePublicationBundleRef: string;
  runtimePublicationBundleRef: string;
  surfaceRuntimeBindingRef: string;
  selectedAnchorRef: string;
  selectedAnchorTupleHashRef: string;
  continuitySelectedAnchorTupleHashRef: string;
  continuitySourceQueueRankSnapshotRef: string;
  sourceQueueRankSnapshotRef: string;
  latestTaskCompletionSettlementRef: string;
  taskCompletionSettlementEnvelopeRef: string;
  latestPrefetchWindowRef?: string | null;
  latestNextTaskLaunchLeaseRef?: string | null;
  experienceContinuityEvidenceRef: string;
  completionSettlementState: WorkspaceCompletionSettlementState;
  nextTaskLaunchState: WorkspaceNextTaskLaunchState;
  releaseTrustVerdict: ReleaseTrustFreezeVerdictSnapshot;
  queueSliceTrustState?: WorkspaceSliceTrustState;
  attachmentSliceTrustState?: WorkspaceSliceTrustState;
  assistiveSliceTrustState?: WorkspaceSliceTrustState;
  dependencySliceTrustState?: WorkspaceSliceTrustState;
  assuranceSliceTrustRefs?: readonly string[];
  blockingDependencyRefs?: readonly string[];
  reviewActionLeaseRef?: string | null;
  reviewActionLeaseState: WorkspaceLeaseHealthState;
  requestLifecycleLeaseRef?: string | null;
  requestLifecycleLeaseState: WorkspaceLeaseHealthState;
  focusProtectionLeaseRef?: string | null;
  focusProtectionLeaseState?: WorkspaceFocusProtectionLeaseState | null;
  invalidatingDriftState?: WorkspaceInvalidatingDriftState | null;
  compositionMode?: ProtectedCompositionMode | null;
  draftArtifactRefs?: readonly string[];
  compareAnchorRefs?: readonly string[];
  assistiveInsertionPointRef?: string | null;
  primaryReadingTargetRef?: string | null;
  quietReturnTargetRef?: string | null;
  allowedLivePatchMode?: AllowedLivePatchMode | null;
  releaseGateRef?: string | null;
  compositionStartedAt?: string | null;
  compositionReleasedAt?: string | null;
  consequenceState?: WorkspaceConsequenceState;
  anchorRepairTargetRef?: string | null;
  staleOwnerRecoveryRef?: string | null;
  ownershipEpochRef?: number | null;
  presentedOwnershipEpoch?: number | null;
  fencingToken?: string | null;
  presentedFencingToken?: string | null;
  lineageFenceEpoch?: number | null;
  presentedLineageFenceEpoch?: number | null;
  computedAt: string;
  staleAt: string;
}

function trustSeverity(state: WorkspaceSliceTrustState): number {
  switch (state) {
    case "trusted":
      return 0;
    case "degraded":
      return 1;
    case "recovery_bound":
      return 2;
    case "quarantined":
      return 3;
  }
}

function maxTrustState(states: readonly WorkspaceSliceTrustState[]): WorkspaceSliceTrustState {
  return [...states].sort((left, right) => trustSeverity(right) - trustSeverity(left))[0]!;
}

function normalizeStaffWorkspaceConsistencyProjection(
  snapshot: StaffWorkspaceConsistencyProjectionSnapshot,
): StaffWorkspaceConsistencyProjectionSnapshot {
  return {
    ...snapshot,
    workspaceConsistencyProjectionId: requireRef(
      snapshot.workspaceConsistencyProjectionId,
      "workspaceConsistencyProjectionId",
    ),
    taskId: requireRef(snapshot.taskId, "taskId"),
    requestId: requireRef(snapshot.requestId, "requestId"),
    entityContinuityKey: requireRef(snapshot.entityContinuityKey, "entityContinuityKey"),
    audienceTier: requireRef(snapshot.audienceTier, "audienceTier"),
    governingObjectRefs: uniqueSortedRefs(snapshot.governingObjectRefs),
    entityVersionRefs: uniqueSortedRefs(snapshot.entityVersionRefs),
    queueChangeBatchRef: optionalRef(snapshot.queueChangeBatchRef),
    reviewVersionRef: ensureNonNegativeInteger(snapshot.reviewVersionRef, "reviewVersionRef"),
    workspaceSnapshotVersion: ensureNonNegativeInteger(
      snapshot.workspaceSnapshotVersion,
      "workspaceSnapshotVersion",
    ),
    computedAt: ensureIsoTimestamp(snapshot.computedAt, "computedAt"),
    staleAt: ensureIsoTimestamp(snapshot.staleAt, "staleAt"),
    blockingReasonRefs: uniqueSortedRefs(
      snapshot.blockingReasonRefs,
    ) as WorkspaceProjectionReasonCode[],
    bundleVersion: ensurePositiveInteger(snapshot.bundleVersion, "bundleVersion"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

export function validateStaffWorkspaceConsistencyProjection(
  snapshot: StaffWorkspaceConsistencyProjectionSnapshot,
): StaffWorkspaceConsistencyProjectionSnapshot {
  return normalizeStaffWorkspaceConsistencyProjection(snapshot);
}

function normalizeWorkspaceSliceTrustProjection(
  snapshot: WorkspaceSliceTrustProjectionSnapshot,
): WorkspaceSliceTrustProjectionSnapshot {
  return {
    ...snapshot,
    workspaceSliceTrustProjectionId: requireRef(
      snapshot.workspaceSliceTrustProjectionId,
      "workspaceSliceTrustProjectionId",
    ),
    taskId: requireRef(snapshot.taskId, "taskId"),
    assuranceSliceTrustRefs: uniqueSortedRefs(snapshot.assuranceSliceTrustRefs),
    blockingDependencyRefs: uniqueSortedRefs(snapshot.blockingDependencyRefs),
    evaluatedAt: ensureIsoTimestamp(snapshot.evaluatedAt, "evaluatedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

export function validateWorkspaceSliceTrustProjection(
  snapshot: WorkspaceSliceTrustProjectionSnapshot,
): WorkspaceSliceTrustProjectionSnapshot {
  return normalizeWorkspaceSliceTrustProjection(snapshot);
}

function normalizeProtectedCompositionState(
  snapshot: ProtectedCompositionStateSnapshot,
): ProtectedCompositionStateSnapshot {
  return {
    ...snapshot,
    protectedCompositionStateId: requireRef(
      snapshot.protectedCompositionStateId,
      "protectedCompositionStateId",
    ),
    taskId: requireRef(snapshot.taskId, "taskId"),
    focusProtectionLeaseRef: requireRef(snapshot.focusProtectionLeaseRef, "focusProtectionLeaseRef"),
    draftArtifactRefs: uniqueSortedRefs(snapshot.draftArtifactRefs),
    primarySelectedAnchorRef: requireRef(
      snapshot.primarySelectedAnchorRef,
      "primarySelectedAnchorRef",
    ),
    compareAnchorRefs: uniqueSortedRefs(snapshot.compareAnchorRefs),
    assistiveInsertionPointRef: optionalRef(snapshot.assistiveInsertionPointRef),
    primaryReadingTargetRef: requireRef(
      snapshot.primaryReadingTargetRef,
      "primaryReadingTargetRef",
    ),
    quietReturnTargetRef: requireRef(snapshot.quietReturnTargetRef, "quietReturnTargetRef"),
    releaseGateRef: requireRef(snapshot.releaseGateRef, "releaseGateRef"),
    startedAt: ensureIsoTimestamp(snapshot.startedAt, "startedAt"),
    releasedAt: snapshot.releasedAt
      ? ensureIsoTimestamp(snapshot.releasedAt, "releasedAt")
      : null,
    blockingReasonRefs: uniqueSortedRefs(
      snapshot.blockingReasonRefs,
    ) as WorkspaceProjectionReasonCode[],
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

export function validateProtectedCompositionState(
  snapshot: ProtectedCompositionStateSnapshot,
): ProtectedCompositionStateSnapshot {
  return normalizeProtectedCompositionState(snapshot);
}

function normalizeWorkspaceContinuityEvidenceProjection(
  snapshot: WorkspaceContinuityEvidenceProjectionSnapshot,
): WorkspaceContinuityEvidenceProjectionSnapshot {
  return {
    ...snapshot,
    workspaceContinuityEvidenceProjectionId: requireRef(
      snapshot.workspaceContinuityEvidenceProjectionId,
      "workspaceContinuityEvidenceProjectionId",
    ),
    taskId: requireRef(snapshot.taskId, "taskId"),
    routeFamilyRef: requireRef(snapshot.routeFamilyRef, "routeFamilyRef"),
    routeContinuityEvidenceContractRef: requireRef(
      snapshot.routeContinuityEvidenceContractRef,
      "routeContinuityEvidenceContractRef",
    ),
    selectedAnchorRef: requireRef(snapshot.selectedAnchorRef, "selectedAnchorRef"),
    selectedAnchorTupleHashRef: requireRef(
      snapshot.selectedAnchorTupleHashRef,
      "selectedAnchorTupleHashRef",
    ),
    surfacePublicationRef: requireRef(snapshot.surfacePublicationRef, "surfacePublicationRef"),
    runtimePublicationBundleRef: requireRef(
      snapshot.runtimePublicationBundleRef,
      "runtimePublicationBundleRef",
    ),
    sourceQueueRankSnapshotRef: requireRef(
      snapshot.sourceQueueRankSnapshotRef,
      "sourceQueueRankSnapshotRef",
    ),
    latestTaskCompletionSettlementRef: requireRef(
      snapshot.latestTaskCompletionSettlementRef,
      "latestTaskCompletionSettlementRef",
    ),
    latestPrefetchWindowRef: optionalRef(snapshot.latestPrefetchWindowRef),
    latestNextTaskLaunchLeaseRef: optionalRef(snapshot.latestNextTaskLaunchLeaseRef),
    experienceContinuityEvidenceRef: requireRef(
      snapshot.experienceContinuityEvidenceRef,
      "experienceContinuityEvidenceRef",
    ),
    continuityTupleHash: requireRef(snapshot.continuityTupleHash, "continuityTupleHash"),
    blockingRefs: uniqueSortedRefs(snapshot.blockingRefs) as WorkspaceProjectionReasonCode[],
    anchorRepairTargetRef: optionalRef(snapshot.anchorRepairTargetRef),
    capturedAt: ensureIsoTimestamp(snapshot.capturedAt, "capturedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

export function validateWorkspaceContinuityEvidenceProjection(
  snapshot: WorkspaceContinuityEvidenceProjectionSnapshot,
): WorkspaceContinuityEvidenceProjectionSnapshot {
  return normalizeWorkspaceContinuityEvidenceProjection(snapshot);
}

function normalizeWorkspaceTrustEnvelope(
  snapshot: WorkspaceTrustEnvelopeSnapshot,
): WorkspaceTrustEnvelopeSnapshot {
  return {
    ...snapshot,
    workspaceTrustEnvelopeId: requireRef(snapshot.workspaceTrustEnvelopeId, "workspaceTrustEnvelopeId"),
    workspaceRef: requireRef(snapshot.workspaceRef, "workspaceRef"),
    taskOrCaseRef: requireRef(snapshot.taskOrCaseRef, "taskOrCaseRef"),
    queueKey: requireRef(snapshot.queueKey, "queueKey"),
    workspaceConsistencyProjectionRef: requireRef(
      snapshot.workspaceConsistencyProjectionRef,
      "workspaceConsistencyProjectionRef",
    ),
    workspaceSliceTrustProjectionRef: requireRef(
      snapshot.workspaceSliceTrustProjectionRef,
      "workspaceSliceTrustProjectionRef",
    ),
    primaryActionLeaseRef: optionalRef(snapshot.primaryActionLeaseRef),
    requestLifecycleLeaseRef: optionalRef(snapshot.requestLifecycleLeaseRef),
    focusProtectionLeaseRef: optionalRef(snapshot.focusProtectionLeaseRef),
    protectedCompositionStateRef: optionalRef(snapshot.protectedCompositionStateRef),
    taskCompletionSettlementEnvelopeRef: requireRef(
      snapshot.taskCompletionSettlementEnvelopeRef,
      "taskCompletionSettlementEnvelopeRef",
    ),
    surfaceRuntimeBindingRef: requireRef(
      snapshot.surfaceRuntimeBindingRef,
      "surfaceRuntimeBindingRef",
    ),
    surfacePublicationRef: requireRef(snapshot.surfacePublicationRef, "surfacePublicationRef"),
    runtimePublicationBundleRef: requireRef(
      snapshot.runtimePublicationBundleRef,
      "runtimePublicationBundleRef",
    ),
    selectedAnchorRef: requireRef(snapshot.selectedAnchorRef, "selectedAnchorRef"),
    selectedAnchorTupleHashRef: requireRef(
      snapshot.selectedAnchorTupleHashRef,
      "selectedAnchorTupleHashRef",
    ),
    sourceQueueRankSnapshotRef: requireRef(
      snapshot.sourceQueueRankSnapshotRef,
      "sourceQueueRankSnapshotRef",
    ),
    continuityEvidenceRef: requireRef(snapshot.continuityEvidenceRef, "continuityEvidenceRef"),
    consistencyTupleHash: requireRef(snapshot.consistencyTupleHash, "consistencyTupleHash"),
    trustTupleHash: requireRef(snapshot.trustTupleHash, "trustTupleHash"),
    blockingReasonRefs: uniqueSortedRefs(
      snapshot.blockingReasonRefs,
    ) as WorkspaceProjectionReasonCode[],
    computedAt: ensureIsoTimestamp(snapshot.computedAt, "computedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

export function validateWorkspaceTrustEnvelope(
  snapshot: WorkspaceTrustEnvelopeSnapshot,
): WorkspaceTrustEnvelopeSnapshot {
  return normalizeWorkspaceTrustEnvelope(snapshot);
}

function mapConsistencyTrustState(input: {
  publicationState: "current" | "drifted" | "stale";
  releaseTrustState: WorkspaceProjectionTrustState;
}): WorkspaceProjectionTrustState {
  if (input.publicationState === "stale" || input.releaseTrustState === "quarantined") {
    return "quarantined";
  }
  if (input.publicationState === "drifted" || input.releaseTrustState === "recovery_bound") {
    return "recovery_bound";
  }
  if (input.releaseTrustState === "degraded") {
    return "degraded";
  }
  return "trusted";
}

export function evaluateStaffWorkspaceConsistencyProjection(
  input: EvaluateStaffWorkspaceConsistencyProjectionInput,
): Omit<StaffWorkspaceConsistencyProjectionSnapshot, "workspaceConsistencyProjectionId" | "version"> {
  const computedAt = ensureIsoTimestamp(input.computedAt, "computedAt");
  const staleAt = ensureIsoTimestamp(input.staleAt, "staleAt");
  const blockingReasonRefs: WorkspaceProjectionReasonCode[] = [];

  if (input.routeFamilyState === "drifted") {
    blockingReasonRefs.push("WORKSPACE_232_ROUTE_FAMILY_DRIFT");
  }
  if (input.routeContractState === "drifted") {
    blockingReasonRefs.push("WORKSPACE_232_ROUTE_CONTRACT_DRIFT");
  }
  if (input.publicationState === "drifted") {
    blockingReasonRefs.push("WORKSPACE_232_SURFACE_PUBLICATION_DRIFT");
    blockingReasonRefs.push("WORKSPACE_232_RUNTIME_PUBLICATION_DRIFT");
  }
  if (input.publicationState === "stale") {
    blockingReasonRefs.push("WORKSPACE_232_SURFACE_PUBLICATION_DRIFT");
    blockingReasonRefs.push("WORKSPACE_232_RUNTIME_PUBLICATION_DRIFT");
  }
  if (input.reviewFreshnessState === "queued_updates") {
    blockingReasonRefs.push("WORKSPACE_232_REVIEW_FRESHNESS_QUEUED_UPDATES");
  }
  if (input.reviewFreshnessState === "review_required") {
    blockingReasonRefs.push("WORKSPACE_232_REVIEW_FRESHNESS_REVIEW_REQUIRED");
  }
  if (input.consequenceState === "review_required") {
    blockingReasonRefs.push("WORKSPACE_232_CONSEQUENCE_REVIEW_REQUIRED");
  }
  if (input.consequenceState === "superseded") {
    blockingReasonRefs.push("WORKSPACE_232_CONSEQUENCE_SUPERSEDED");
  }
  if (input.anchorContinuityState === "stale_remappable") {
    blockingReasonRefs.push("WORKSPACE_232_SELECTED_ANCHOR_REMAPPABLE");
  }
  if (input.anchorContinuityState === "lost_recovery_required") {
    blockingReasonRefs.push("WORKSPACE_232_SELECTED_ANCHOR_LOST");
  }
  if (input.releaseTrustState === "degraded") {
    blockingReasonRefs.push("WORKSPACE_232_RELEASE_TRUST_DEGRADED");
  }
  if (input.releaseTrustState === "recovery_bound") {
    blockingReasonRefs.push("WORKSPACE_232_RELEASE_TRUST_RECOVERY_BOUND");
  }
  if (input.releaseTrustState === "quarantined") {
    blockingReasonRefs.push("WORKSPACE_232_RELEASE_TRUST_QUARANTINED");
  }

  let causalConsistencyState: WorkspaceCausalConsistencyState = "consistent";
  if (
    input.publicationState === "stale" ||
    input.anchorContinuityState === "lost_recovery_required" ||
    input.consequenceState === "superseded"
  ) {
    causalConsistencyState = "recovery_required";
  } else if (blockingReasonRefs.length > 0) {
    causalConsistencyState = "stale_recoverable";
  }

  const projectionTrustState = mapConsistencyTrustState({
    publicationState: input.publicationState,
    releaseTrustState: input.releaseTrustState,
  });

  return {
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    entityContinuityKey: buildWorkspaceEntityContinuityKey({
      requestId: input.requestId,
      routeFamilyRef: input.routeFamilyRef,
      selectedAnchorTupleHashRef: input.selectedAnchorTupleHashRef,
    }),
    bundleVersion: ensurePositiveInteger(input.bundleVersion, "bundleVersion"),
    audienceTier: requireRef(input.audienceTier, "audienceTier"),
    governingObjectRefs: uniqueSortedRefs(input.governingObjectRefs),
    entityVersionRefs: uniqueSortedRefs(input.entityVersionRefs),
    queueChangeBatchRef: optionalRef(input.queueChangeBatchRef),
    reviewVersionRef: ensureNonNegativeInteger(input.reviewVersionRef, "reviewVersionRef"),
    workspaceSnapshotVersion: ensureNonNegativeInteger(
      input.workspaceSnapshotVersion,
      "workspaceSnapshotVersion",
    ),
    computedAt,
    staleAt,
    causalConsistencyState,
    projectionTrustState,
    blockingReasonRefs: uniqueSortedRefs(
      blockingReasonRefs,
    ) as WorkspaceProjectionReasonCode[],
  };
}

export function evaluateWorkspaceSliceTrustProjection(
  input: EvaluateWorkspaceSliceTrustProjectionInput,
): Omit<WorkspaceSliceTrustProjectionSnapshot, "workspaceSliceTrustProjectionId" | "version"> {
  const evaluatedAt = ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt");
  const allStates = [
    input.queueSliceTrustState,
    input.taskSliceTrustState,
    input.attachmentSliceTrustState,
    input.assistiveSliceTrustState,
    input.dependencySliceTrustState,
  ] as const;
  const dominantState = maxTrustState(allStates);
  const blockingDependencyRefs = uniqueSortedRefs(input.blockingDependencyRefs ?? []);

  let renderMode: WorkspaceSliceRenderMode = "interactive";
  if (dominantState === "degraded") {
    renderMode = "observe_only";
  }
  if (dominantState === "recovery_bound" || dominantState === "quarantined") {
    renderMode = "recovery_required";
  }

  return {
    taskId: requireRef(input.taskId, "taskId"),
    queueSliceTrustState: input.queueSliceTrustState,
    taskSliceTrustState: input.taskSliceTrustState,
    attachmentSliceTrustState: input.attachmentSliceTrustState,
    assistiveSliceTrustState: input.assistiveSliceTrustState,
    dependencySliceTrustState: input.dependencySliceTrustState,
    assuranceSliceTrustRefs: uniqueSortedRefs(input.assuranceSliceTrustRefs),
    renderMode,
    blockingDependencyRefs,
    evaluatedAt,
  };
}

export function evaluateProtectedCompositionState(
  input: EvaluateProtectedCompositionStateInput,
): Omit<ProtectedCompositionStateSnapshot, "protectedCompositionStateId" | "version"> {
  const startedAt = ensureIsoTimestamp(input.startedAt, "startedAt");
  const releasedAt = input.releasedAt ? ensureIsoTimestamp(input.releasedAt, "releasedAt") : null;
  const blockingReasonRefs: WorkspaceProjectionReasonCode[] = [];

  let stateValidity: ProtectedCompositionValidityState = "live";
  if (
    input.focusProtectionLeaseState === "invalidated" &&
    (input.invalidatingDriftState === "ownership" || input.invalidatingDriftState === "lineage")
  ) {
    stateValidity = "recovery_only";
    blockingReasonRefs.push("WORKSPACE_232_PROTECTED_COMPOSITION_INVALIDATED");
  } else if (
    input.focusProtectionLeaseState === "invalidated" &&
    input.invalidatingDriftState !== "none"
  ) {
    stateValidity = "stale_recoverable";
    blockingReasonRefs.push("WORKSPACE_232_PROTECTED_COMPOSITION_INVALIDATED");
  }

  return {
    taskId: requireRef(input.taskId, "taskId"),
    focusProtectionLeaseRef: requireRef(input.focusProtectionLeaseRef, "focusProtectionLeaseRef"),
    compositionMode: input.compositionMode,
    draftArtifactRefs: uniqueSortedRefs(input.draftArtifactRefs),
    primarySelectedAnchorRef: requireRef(
      input.primarySelectedAnchorRef,
      "primarySelectedAnchorRef",
    ),
    compareAnchorRefs: uniqueSortedRefs(input.compareAnchorRefs),
    assistiveInsertionPointRef: optionalRef(input.assistiveInsertionPointRef),
    primaryReadingTargetRef: requireRef(
      input.primaryReadingTargetRef,
      "primaryReadingTargetRef",
    ),
    quietReturnTargetRef: requireRef(input.quietReturnTargetRef, "quietReturnTargetRef"),
    allowedLivePatchMode: input.allowedLivePatchMode,
    stateValidity,
    releaseGateRef: requireRef(input.releaseGateRef, "releaseGateRef"),
    startedAt,
    releasedAt,
    invalidatingDriftState: input.invalidatingDriftState,
    blockingReasonRefs: uniqueSortedRefs(
      blockingReasonRefs,
    ) as WorkspaceProjectionReasonCode[],
  };
}

export function evaluateWorkspaceContinuityEvidenceProjection(
  input: EvaluateWorkspaceContinuityEvidenceProjectionInput,
): Omit<WorkspaceContinuityEvidenceProjectionSnapshot, "workspaceContinuityEvidenceProjectionId" | "version"> {
  const capturedAt = ensureIsoTimestamp(input.capturedAt, "capturedAt");
  const blockingRefs: WorkspaceProjectionReasonCode[] = [];

  let anchorContinuityState: WorkspaceAnchorContinuityState = "confirmed";
  if (input.selectedAnchorTupleHashRef !== input.continuitySelectedAnchorTupleHashRef) {
    if (optionalRef(input.anchorRepairTargetRef)) {
      anchorContinuityState = "stale_remappable";
      blockingRefs.push("WORKSPACE_232_SELECTED_ANCHOR_REMAPPABLE");
    } else {
      anchorContinuityState = "lost_recovery_required";
      blockingRefs.push("WORKSPACE_232_SELECTED_ANCHOR_LOST");
    }
  }

  if (input.sourceQueueRankSnapshotRef !== input.continuitySourceQueueRankSnapshotRef) {
    blockingRefs.push("WORKSPACE_232_QUEUE_SNAPSHOT_DRIFT");
  }
  if (input.surfacePublicationRef !== input.expectedSurfacePublicationRef) {
    blockingRefs.push("WORKSPACE_232_SURFACE_PUBLICATION_DRIFT");
  }
  if (input.runtimePublicationBundleRef !== input.expectedRuntimePublicationBundleRef) {
    blockingRefs.push("WORKSPACE_232_RUNTIME_PUBLICATION_DRIFT");
  }
  if (input.completionSettlementState === "pending") {
    blockingRefs.push("WORKSPACE_232_TASK_COMPLETION_PENDING");
  }
  if (input.completionSettlementState === "stale_recoverable") {
    blockingRefs.push("WORKSPACE_232_CONTINUITY_EVIDENCE_STALE");
  }
  if (
    input.completionSettlementState === "recovery_required" ||
    input.completionSettlementState === "manual_handoff_required"
  ) {
    blockingRefs.push("WORKSPACE_232_CONTINUITY_EVIDENCE_BLOCKED");
  }

  let validationState: WorkspaceContinuityValidationState = "trusted";
  if (
    input.completionSettlementState === "recovery_required" ||
    input.completionSettlementState === "manual_handoff_required" ||
    anchorContinuityState === "lost_recovery_required"
  ) {
    validationState = "blocked";
  } else if (
    input.completionSettlementState === "stale_recoverable" ||
    input.surfacePublicationRef !== input.expectedSurfacePublicationRef ||
    input.runtimePublicationBundleRef !== input.expectedRuntimePublicationBundleRef
  ) {
    validationState = "stale";
  } else if (
    anchorContinuityState === "stale_remappable" ||
    input.sourceQueueRankSnapshotRef !== input.continuitySourceQueueRankSnapshotRef ||
    input.completionSettlementState === "pending"
  ) {
    validationState = "degraded";
  }

  let nextTaskLaunchState: WorkspaceContinuityLaunchState = "trusted_blocked";
  if (validationState === "blocked") {
    nextTaskLaunchState = "blocked";
  } else if (validationState === "stale") {
    nextTaskLaunchState = "stale";
  } else if (validationState === "degraded") {
    nextTaskLaunchState = "degraded";
  } else if (input.nextTaskLaunchState === "ready" || input.nextTaskLaunchState === "launched") {
    nextTaskLaunchState = "trusted_ready";
  }

  const continuityTupleHash = computeWorkspaceTupleHash([
    { key: "taskId", value: input.taskId },
    { key: "routeFamilyRef", value: input.routeFamilyRef },
    { key: "selectedAnchorTupleHashRef", value: input.selectedAnchorTupleHashRef },
    { key: "surfacePublicationRef", value: input.surfacePublicationRef },
    { key: "runtimePublicationBundleRef", value: input.runtimePublicationBundleRef },
    { key: "sourceQueueRankSnapshotRef", value: input.sourceQueueRankSnapshotRef },
    { key: "latestTaskCompletionSettlementRef", value: input.latestTaskCompletionSettlementRef },
  ]);

  return {
    taskId: requireRef(input.taskId, "taskId"),
    controlCode: "workspace_task_completion",
    routeFamilyRef: requireRef(input.routeFamilyRef, "routeFamilyRef"),
    routeContinuityEvidenceContractRef: requireRef(
      input.routeContinuityEvidenceContractRef,
      "routeContinuityEvidenceContractRef",
    ),
    selectedAnchorRef: requireRef(input.selectedAnchorRef, "selectedAnchorRef"),
    selectedAnchorTupleHashRef: requireRef(
      input.selectedAnchorTupleHashRef,
      "selectedAnchorTupleHashRef",
    ),
    surfacePublicationRef: requireRef(input.surfacePublicationRef, "surfacePublicationRef"),
    runtimePublicationBundleRef: requireRef(
      input.runtimePublicationBundleRef,
      "runtimePublicationBundleRef",
    ),
    sourceQueueRankSnapshotRef: requireRef(
      input.sourceQueueRankSnapshotRef,
      "sourceQueueRankSnapshotRef",
    ),
    latestTaskCompletionSettlementRef: requireRef(
      input.latestTaskCompletionSettlementRef,
      "latestTaskCompletionSettlementRef",
    ),
    latestPrefetchWindowRef: optionalRef(input.latestPrefetchWindowRef),
    latestNextTaskLaunchLeaseRef: optionalRef(input.latestNextTaskLaunchLeaseRef),
    experienceContinuityEvidenceRef: requireRef(
      input.experienceContinuityEvidenceRef,
      "experienceContinuityEvidenceRef",
    ),
    continuityTupleHash,
    validationState,
    nextTaskLaunchState,
    blockingRefs: uniqueSortedRefs(blockingRefs) as WorkspaceProjectionReasonCode[],
    anchorContinuityState,
    anchorRepairTargetRef: optionalRef(input.anchorRepairTargetRef),
    capturedAt,
  };
}

function chooseRecoveryAction(
  reasonRefs: readonly WorkspaceProjectionReasonCode[],
  input: {
    staleOwnerRecoveryRef?: string | null;
    primaryActionLeaseState: WorkspaceLeaseHealthState;
    requestLifecycleLeaseState: WorkspaceLeaseHealthState;
  },
): WorkspaceRecoveryAction {
  if (
    input.primaryActionLeaseState !== "live" ||
    input.requestLifecycleLeaseState !== "live" ||
    reasonRefs.includes("WORKSPACE_232_OWNERSHIP_EPOCH_MISMATCH") ||
    reasonRefs.includes("WORKSPACE_232_FENCING_TOKEN_MISMATCH") ||
    reasonRefs.includes("WORKSPACE_232_LINEAGE_FENCE_DRIFT")
  ) {
    return optionalRef(input.staleOwnerRecoveryRef) ? "supervised_takeover" : "reacquire_lease";
  }
  if (
    reasonRefs.includes("WORKSPACE_232_SELECTED_ANCHOR_REMAPPABLE") ||
    reasonRefs.includes("WORKSPACE_232_SELECTED_ANCHOR_LOST")
  ) {
    return "repair_anchor";
  }
  if (
    reasonRefs.includes("WORKSPACE_232_CONSEQUENCE_REVIEW_REQUIRED") ||
    reasonRefs.includes("WORKSPACE_232_CONSEQUENCE_SUPERSEDED")
  ) {
    return "review_consequence_drift";
  }
  if (reasonRefs.length > 0) {
    return "refresh_projection";
  }
  return "none";
}

export function evaluateWorkspaceTrustEnvelope(
  input: EvaluateWorkspaceTrustEnvelopeInput,
): Omit<WorkspaceTrustEnvelopeSnapshot, "workspaceTrustEnvelopeId" | "version"> {
  const computedAt = ensureIsoTimestamp(input.computedAt, "computedAt");
  const blockingReasonRefs = new Set<WorkspaceProjectionReasonCode>();

  for (const reason of input.workspaceConsistencyProjection.blockingReasonRefs) {
    blockingReasonRefs.add(reason);
  }
  for (const reason of input.continuityEvidenceProjection.blockingRefs) {
    blockingReasonRefs.add(reason);
  }
  if (input.workspaceSliceTrustProjection.dependencySliceTrustState === "degraded") {
    blockingReasonRefs.add("WORKSPACE_232_DEPENDENCY_SLICE_DEGRADED");
  }
  if (
    input.workspaceSliceTrustProjection.dependencySliceTrustState === "recovery_bound" ||
    input.workspaceSliceTrustProjection.dependencySliceTrustState === "quarantined"
  ) {
    blockingReasonRefs.add("WORKSPACE_232_DEPENDENCY_SLICE_QUARANTINED");
  }
  if (input.primaryActionLeaseState === "missing") {
    blockingReasonRefs.add("WORKSPACE_232_REVIEW_ACTION_LEASE_MISSING");
  }
  if (input.primaryActionLeaseState !== "live" && input.primaryActionLeaseState !== "missing") {
    blockingReasonRefs.add("WORKSPACE_232_REVIEW_ACTION_LEASE_EXPIRED");
  }
  if (input.requestLifecycleLeaseState === "missing") {
    blockingReasonRefs.add("WORKSPACE_232_REQUEST_LIFECYCLE_LEASE_MISSING");
  }
  if (input.requestLifecycleLeaseState !== "live" && input.requestLifecycleLeaseState !== "missing") {
    blockingReasonRefs.add("WORKSPACE_232_REQUEST_LIFECYCLE_LEASE_EXPIRED");
  }
  if (input.staleOwnerRecoveryRef) {
    blockingReasonRefs.add("WORKSPACE_232_STALE_OWNER_RECOVERY_OPEN");
  }
  if (
    input.protectedCompositionState &&
    input.protectedCompositionState.stateValidity !== "live"
  ) {
    blockingReasonRefs.add("WORKSPACE_232_PROTECTED_COMPOSITION_INVALIDATED");
  }
  if (input.focusProtectionLeaseRef) {
    blockingReasonRefs.add("WORKSPACE_232_FOCUS_BUFFERING_ACTIVE");
  }

  const releaseLive =
    input.workspaceConsistencyProjection.projectionTrustState === "trusted" &&
    input.workspaceSliceTrustProjection.renderMode === "interactive";
  const leaseLive =
    input.primaryActionLeaseState === "live" && input.requestLifecycleLeaseState === "live";
  const continuityTrusted = input.continuityEvidenceProjection.validationState === "trusted";
  const ownershipTupleDrift =
    [...blockingReasonRefs].includes("WORKSPACE_232_OWNERSHIP_EPOCH_MISMATCH") ||
    [...blockingReasonRefs].includes("WORKSPACE_232_FENCING_TOKEN_MISMATCH") ||
    [...blockingReasonRefs].includes("WORKSPACE_232_LINEAGE_FENCE_DRIFT");

  let envelopeState: WorkspaceEnvelopeState = "interactive";
  if (input.staleOwnerRecoveryRef) {
    envelopeState = "reassigned";
  } else if (
    ownershipTupleDrift ||
    input.primaryActionLeaseState !== "live" ||
    input.requestLifecycleLeaseState !== "live" ||
    input.workspaceConsistencyProjection.causalConsistencyState === "recovery_required" ||
    input.workspaceSliceTrustProjection.renderMode === "recovery_required" ||
    input.continuityEvidenceProjection.validationState === "blocked"
  ) {
    envelopeState = "recovery_required";
  } else if (
    input.workspaceConsistencyProjection.causalConsistencyState === "stale_recoverable" ||
    input.continuityEvidenceProjection.validationState === "stale"
  ) {
    envelopeState = "stale_recoverable";
  } else if (
    input.workspaceSliceTrustProjection.renderMode === "observe_only" ||
    input.protectedCompositionState?.stateValidity === "stale_recoverable"
  ) {
    envelopeState = "observe_only";
  }

  let mutationAuthorityState: WorkspaceMutationAuthorityState = "live";
  if (envelopeState === "observe_only" || envelopeState === "stale_recoverable") {
    mutationAuthorityState = "frozen";
  }
  if (envelopeState === "recovery_required" || envelopeState === "reassigned") {
    mutationAuthorityState = "blocked";
  }

  let interruptionPacingState: WorkspaceInterruptionPacingState = "live";
  if (envelopeState === "recovery_required" || envelopeState === "reassigned") {
    interruptionPacingState = "recovery_only";
  } else if (
    input.protectedCompositionState?.stateValidity === "stale_recoverable" ||
    input.protectedCompositionState?.allowedLivePatchMode === "blocking_only"
  ) {
    interruptionPacingState = "blocking_only";
  } else if (
    input.focusProtectionLeaseRef ||
    input.protectedCompositionState?.stateValidity === "live" ||
    input.workspaceSliceTrustProjection.renderMode === "observe_only" ||
    input.workspaceConsistencyProjection.causalConsistencyState === "stale_recoverable"
  ) {
    interruptionPacingState = "buffered";
  }

  let completionCalmState: WorkspaceCompletionCalmState = "not_eligible";
  if (
    input.continuityEvidenceProjection.nextTaskLaunchState === "trusted_ready" &&
    releaseLive &&
    leaseLive &&
    continuityTrusted
  ) {
    completionCalmState = "eligible";
  } else if (
    input.continuityEvidenceProjection.nextTaskLaunchState === "trusted_blocked" ||
    input.continuityEvidenceProjection.validationState === "degraded" ||
    input.continuityEvidenceProjection.validationState === "trusted"
  ) {
    completionCalmState = "pending_settlement";
  }
  if (
    envelopeState === "recovery_required" ||
    envelopeState === "reassigned" ||
    input.continuityEvidenceProjection.validationState === "stale" ||
    input.continuityEvidenceProjection.validationState === "blocked"
  ) {
    completionCalmState = "blocked";
  }

  const reasonRefs = uniqueSortedRefs(
    [...blockingReasonRefs] as WorkspaceProjectionReasonCode[],
  ) as WorkspaceProjectionReasonCode[];

  const consistencyTupleHash = computeWorkspaceTupleHash([
    { key: "taskOrCaseRef", value: input.taskOrCaseRef },
    { key: "consistencyProjectionRef", value: input.workspaceConsistencyProjection.workspaceConsistencyProjectionId },
    { key: "continuityProjectionRef", value: input.continuityEvidenceProjection.workspaceContinuityEvidenceProjectionId },
    { key: "selectedAnchorTupleHashRef", value: input.selectedAnchorTupleHashRef },
    { key: "surfacePublicationRef", value: input.surfacePublicationRef },
    { key: "runtimePublicationBundleRef", value: input.runtimePublicationBundleRef },
    { key: "sourceQueueRankSnapshotRef", value: input.sourceQueueRankSnapshotRef },
  ]);
  const trustTupleHash = computeWorkspaceTupleHash([
    { key: "consistencyTupleHash", value: consistencyTupleHash },
    { key: "sliceTrustProjectionRef", value: input.workspaceSliceTrustProjection.workspaceSliceTrustProjectionId },
    { key: "primaryActionLeaseRef", value: input.primaryActionLeaseRef },
    { key: "requestLifecycleLeaseRef", value: input.requestLifecycleLeaseRef },
    { key: "continuityTupleHash", value: input.continuityEvidenceProjection.continuityTupleHash },
    { key: "envelopeState", value: envelopeState },
    { key: "mutationAuthorityState", value: mutationAuthorityState },
  ]);

  return {
    workspaceFamily: input.workspaceFamily,
    workspaceRef: requireRef(input.workspaceRef, "workspaceRef"),
    taskOrCaseRef: requireRef(input.taskOrCaseRef, "taskOrCaseRef"),
    queueKey: requireRef(input.queueKey, "queueKey"),
    workspaceConsistencyProjectionRef:
      input.workspaceConsistencyProjection.workspaceConsistencyProjectionId,
    workspaceSliceTrustProjectionRef:
      input.workspaceSliceTrustProjection.workspaceSliceTrustProjectionId,
    primaryActionLeaseRef: optionalRef(input.primaryActionLeaseRef),
    requestLifecycleLeaseRef: optionalRef(input.requestLifecycleLeaseRef),
    focusProtectionLeaseRef: optionalRef(input.focusProtectionLeaseRef),
    protectedCompositionStateRef: input.protectedCompositionState
      ? input.protectedCompositionState.protectedCompositionStateId
      : null,
    taskCompletionSettlementEnvelopeRef: requireRef(
      input.taskCompletionSettlementEnvelopeRef,
      "taskCompletionSettlementEnvelopeRef",
    ),
    surfaceRuntimeBindingRef: requireRef(
      input.surfaceRuntimeBindingRef,
      "surfaceRuntimeBindingRef",
    ),
    surfacePublicationRef: requireRef(input.surfacePublicationRef, "surfacePublicationRef"),
    runtimePublicationBundleRef: requireRef(
      input.runtimePublicationBundleRef,
      "runtimePublicationBundleRef",
    ),
    selectedAnchorRef: requireRef(input.selectedAnchorRef, "selectedAnchorRef"),
    selectedAnchorTupleHashRef: requireRef(
      input.selectedAnchorTupleHashRef,
      "selectedAnchorTupleHashRef",
    ),
    sourceQueueRankSnapshotRef: requireRef(
      input.sourceQueueRankSnapshotRef,
      "sourceQueueRankSnapshotRef",
    ),
    continuityEvidenceRef:
      input.continuityEvidenceProjection.workspaceContinuityEvidenceProjectionId,
    consistencyTupleHash,
    trustTupleHash,
    envelopeState,
    mutationAuthorityState,
    interruptionPacingState,
    completionCalmState,
    blockingReasonRefs: reasonRefs,
    requiredRecoveryAction: chooseRecoveryAction(reasonRefs, {
      staleOwnerRecoveryRef: input.staleOwnerRecoveryRef,
      primaryActionLeaseState: input.primaryActionLeaseState,
      requestLifecycleLeaseState: input.requestLifecycleLeaseState,
    }),
    computedAt,
  };
}

function deriveAnchorContinuityState(input: AssembleWorkspaceProjectionBundleInput): WorkspaceAnchorContinuityState {
  if (input.selectedAnchorTupleHashRef === input.continuitySelectedAnchorTupleHashRef) {
    return "confirmed";
  }
  if (optionalRef(input.anchorRepairTargetRef)) {
    return "stale_remappable";
  }
  return "lost_recovery_required";
}

function deriveReleaseTrustState(
  verdict: ReleaseTrustFreezeVerdictSnapshot,
): WorkspaceProjectionTrustState {
  return mapReleaseTrustSurfaceAuthorityToOperationalState(verdict.surfaceAuthorityState);
}

function deriveTaskSliceTrustState(input: {
  releaseTrustState: WorkspaceProjectionTrustState;
  consequenceState: WorkspaceConsequenceState;
  anchorContinuityState: WorkspaceAnchorContinuityState;
}): WorkspaceSliceTrustState {
  if (
    input.releaseTrustState === "quarantined" ||
    input.anchorContinuityState === "lost_recovery_required" ||
    input.consequenceState === "superseded"
  ) {
    return "quarantined";
  }
  if (
    input.releaseTrustState === "recovery_bound" ||
    input.anchorContinuityState === "stale_remappable"
  ) {
    return "recovery_bound";
  }
  if (input.releaseTrustState === "degraded" || input.consequenceState === "review_required") {
    return "degraded";
  }
  return "trusted";
}

function deriveQueueSliceTrustState(input: {
  reviewFreshnessState: "fresh" | "queued_updates" | "review_required";
  sourceQueueRankSnapshotRef: string;
  continuitySourceQueueRankSnapshotRef: string;
}): WorkspaceSliceTrustState {
  if (input.reviewFreshnessState === "review_required") {
    return "recovery_bound";
  }
  if (
    input.reviewFreshnessState === "queued_updates" ||
    input.sourceQueueRankSnapshotRef !== input.continuitySourceQueueRankSnapshotRef
  ) {
    return "degraded";
  }
  return "trusted";
}

export interface WorkspaceProjectionDependencies {
  saveStaffWorkspaceConsistencyProjection(
    row: PersistedStaffWorkspaceConsistencyProjectionRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getLatestStaffWorkspaceConsistencyProjection(
    taskId: string,
  ): Promise<PersistedStaffWorkspaceConsistencyProjectionRow | null>;
  saveWorkspaceSliceTrustProjection(
    row: PersistedWorkspaceSliceTrustProjectionRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getLatestWorkspaceSliceTrustProjection(
    taskId: string,
  ): Promise<PersistedWorkspaceSliceTrustProjectionRow | null>;
  saveProtectedCompositionState(
    row: PersistedProtectedCompositionStateRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getLatestProtectedCompositionState(
    taskId: string,
  ): Promise<PersistedProtectedCompositionStateRow | null>;
  saveWorkspaceContinuityEvidenceProjection(
    row: PersistedWorkspaceContinuityEvidenceProjectionRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getLatestWorkspaceContinuityEvidenceProjection(
    taskId: string,
  ): Promise<PersistedWorkspaceContinuityEvidenceProjectionRow | null>;
  saveWorkspaceTrustEnvelope(
    row: PersistedWorkspaceTrustEnvelopeRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getLatestWorkspaceTrustEnvelope(taskId: string): Promise<PersistedWorkspaceTrustEnvelopeRow | null>;
}

export class InMemoryWorkspaceProjectionStore implements WorkspaceProjectionDependencies {
  private readonly consistencyById = new Map<string, PersistedStaffWorkspaceConsistencyProjectionRow>();
  private readonly consistencyHeadByTask = new Map<string, string>();
  private readonly sliceTrustById = new Map<string, PersistedWorkspaceSliceTrustProjectionRow>();
  private readonly sliceTrustHeadByTask = new Map<string, string>();
  private readonly protectedCompositionById = new Map<string, PersistedProtectedCompositionStateRow>();
  private readonly protectedCompositionHeadByTask = new Map<string, string>();
  private readonly continuityById = new Map<
    string,
    PersistedWorkspaceContinuityEvidenceProjectionRow
  >();
  private readonly continuityHeadByTask = new Map<string, string>();
  private readonly envelopeById = new Map<string, PersistedWorkspaceTrustEnvelopeRow>();
  private readonly envelopeHeadByTask = new Map<string, string>();

  async saveStaffWorkspaceConsistencyProjection(
    row: PersistedStaffWorkspaceConsistencyProjectionRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const normalized = {
      ...validateStaffWorkspaceConsistencyProjection(row),
      aggregateType: "StaffWorkspaceConsistencyProjection" as const,
      persistenceSchemaVersion: 1 as const,
    };
    saveWithCas(this.consistencyById, normalized.workspaceConsistencyProjectionId, normalized, options);
    this.consistencyHeadByTask.set(normalized.taskId, normalized.workspaceConsistencyProjectionId);
  }

  async getLatestStaffWorkspaceConsistencyProjection(
    taskId: string,
  ): Promise<PersistedStaffWorkspaceConsistencyProjectionRow | null> {
    const headId = this.consistencyHeadByTask.get(taskId);
    return headId ? (this.consistencyById.get(headId) ?? null) : null;
  }

  async saveWorkspaceSliceTrustProjection(
    row: PersistedWorkspaceSliceTrustProjectionRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const normalized = {
      ...validateWorkspaceSliceTrustProjection(row),
      aggregateType: "WorkspaceSliceTrustProjection" as const,
      persistenceSchemaVersion: 1 as const,
    };
    saveWithCas(this.sliceTrustById, normalized.workspaceSliceTrustProjectionId, normalized, options);
    this.sliceTrustHeadByTask.set(normalized.taskId, normalized.workspaceSliceTrustProjectionId);
  }

  async getLatestWorkspaceSliceTrustProjection(
    taskId: string,
  ): Promise<PersistedWorkspaceSliceTrustProjectionRow | null> {
    const headId = this.sliceTrustHeadByTask.get(taskId);
    return headId ? (this.sliceTrustById.get(headId) ?? null) : null;
  }

  async saveProtectedCompositionState(
    row: PersistedProtectedCompositionStateRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const normalized = {
      ...validateProtectedCompositionState(row),
      aggregateType: "ProtectedCompositionState" as const,
      persistenceSchemaVersion: 1 as const,
    };
    saveWithCas(
      this.protectedCompositionById,
      normalized.protectedCompositionStateId,
      normalized,
      options,
    );
    this.protectedCompositionHeadByTask.set(normalized.taskId, normalized.protectedCompositionStateId);
  }

  async getLatestProtectedCompositionState(
    taskId: string,
  ): Promise<PersistedProtectedCompositionStateRow | null> {
    const headId = this.protectedCompositionHeadByTask.get(taskId);
    return headId ? (this.protectedCompositionById.get(headId) ?? null) : null;
  }

  async saveWorkspaceContinuityEvidenceProjection(
    row: PersistedWorkspaceContinuityEvidenceProjectionRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const normalized = {
      ...validateWorkspaceContinuityEvidenceProjection(row),
      aggregateType: "WorkspaceContinuityEvidenceProjection" as const,
      persistenceSchemaVersion: 1 as const,
    };
    saveWithCas(this.continuityById, normalized.workspaceContinuityEvidenceProjectionId, normalized, options);
    this.continuityHeadByTask.set(normalized.taskId, normalized.workspaceContinuityEvidenceProjectionId);
  }

  async getLatestWorkspaceContinuityEvidenceProjection(
    taskId: string,
  ): Promise<PersistedWorkspaceContinuityEvidenceProjectionRow | null> {
    const headId = this.continuityHeadByTask.get(taskId);
    return headId ? (this.continuityById.get(headId) ?? null) : null;
  }

  async saveWorkspaceTrustEnvelope(
    row: PersistedWorkspaceTrustEnvelopeRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const normalized = {
      ...validateWorkspaceTrustEnvelope(row),
      aggregateType: "WorkspaceTrustEnvelope" as const,
      persistenceSchemaVersion: 1 as const,
    };
    saveWithCas(this.envelopeById, normalized.workspaceTrustEnvelopeId, normalized, options);
    this.envelopeHeadByTask.set(normalized.taskOrCaseRef, normalized.workspaceTrustEnvelopeId);
  }

  async getLatestWorkspaceTrustEnvelope(
    taskId: string,
  ): Promise<PersistedWorkspaceTrustEnvelopeRow | null> {
    const headId = this.envelopeHeadByTask.get(taskId);
    return headId ? (this.envelopeById.get(headId) ?? null) : null;
  }
}

export function createWorkspaceProjectionStore(): WorkspaceProjectionDependencies {
  return new InMemoryWorkspaceProjectionStore();
}

export const workspaceProjectionParallelInterfaceGaps = [
  {
    gapId: "PARALLEL_INTERFACE_GAP_232_FOCUS_PROTECTION_LEASE_WRITER",
    description:
      "Focus-protection leases still enter the workspace trust projector through typed placeholder refs until the dedicated writer track lands.",
  },
  {
    gapId: "PARALLEL_INTERFACE_GAP_232_DECISION_DRIFT_INVALIDATION_PORT",
    description:
      "DecisionEpoch invalidation still arrives as a stable consequence-state input until par_238 publishes the live endpoint supersession port; duplicate supersession now has a canonical port from par_234.",
  },
] as const;

export function createWorkspaceProjectionAuthorityService(
  repositories: WorkspaceProjectionDependencies = createWorkspaceProjectionStore(),
  idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator(
    "identity_access_workspace_projection",
  ),
) {
  return {
    async publishProtectedCompositionState(
      input: EvaluateProtectedCompositionStateInput,
    ): Promise<ProtectedCompositionStateSnapshot> {
      const snapshot = validateProtectedCompositionState({
        ...evaluateProtectedCompositionState(input),
        protectedCompositionStateId: nextWorkspaceProjectionId(
          idGenerator,
          "protected_composition_state",
        ),
        version: 1,
      });
      await repositories.saveProtectedCompositionState({
        ...snapshot,
        aggregateType: "ProtectedCompositionState",
        persistenceSchemaVersion: 1,
      });
      return snapshot;
    },

    async assembleWorkspaceProjectionBundle(
      input: AssembleWorkspaceProjectionBundleInput,
    ): Promise<WorkspaceContextProjectionBundle> {
      const releaseTrustState = deriveReleaseTrustState(input.releaseTrustVerdict);
      const anchorContinuityState = deriveAnchorContinuityState(input);
      const consequenceState = input.consequenceState ?? "current";
      const queueSliceTrustState =
        input.queueSliceTrustState ??
        deriveQueueSliceTrustState({
          reviewFreshnessState: input.reviewFreshnessState,
          sourceQueueRankSnapshotRef: input.sourceQueueRankSnapshotRef,
          continuitySourceQueueRankSnapshotRef: input.continuitySourceQueueRankSnapshotRef,
        });
      const taskSliceTrustState = deriveTaskSliceTrustState({
        releaseTrustState,
        consequenceState,
        anchorContinuityState,
      });
      const attachmentSliceTrustState = input.attachmentSliceTrustState ?? releaseTrustState;
      const assistiveSliceTrustState = input.assistiveSliceTrustState ?? releaseTrustState;
      const dependencySliceTrustState = input.dependencySliceTrustState ?? releaseTrustState;

      const consistencyProjection = validateStaffWorkspaceConsistencyProjection({
        ...evaluateStaffWorkspaceConsistencyProjection({
          taskId: input.taskId,
          requestId: input.requestId,
          routeFamilyRef: input.routeFamilyRef,
          selectedAnchorTupleHashRef: input.selectedAnchorTupleHashRef,
          bundleVersion: 1,
          audienceTier: input.audienceTier,
          governingObjectRefs: input.governingObjectRefs,
          entityVersionRefs: input.entityVersionRefs,
          queueChangeBatchRef: input.queueChangeBatchRef,
          reviewVersionRef: input.reviewVersionRef,
          workspaceSnapshotVersion: input.workspaceSnapshotVersion,
          reviewFreshnessState: input.reviewFreshnessState,
          routeFamilyState:
            input.currentRouteFamilyRef === input.routeFamilyRef ? "matched" : "drifted",
          routeContractState:
            input.currentSurfaceRouteContractRef === input.expectedSurfaceRouteContractRef
              ? "matched"
              : "drifted",
          publicationState:
            input.surfacePublicationRef === input.expectedSurfacePublicationRef &&
            input.runtimePublicationBundleRef === input.expectedRuntimePublicationBundleRef
              ? "current"
              : releaseTrustState === "quarantined"
                ? "stale"
                : "drifted",
          consequenceState,
          anchorContinuityState,
          releaseTrustState,
          computedAt: input.computedAt,
          staleAt: input.staleAt,
        }),
        workspaceConsistencyProjectionId: nextWorkspaceProjectionId(
          idGenerator,
          "workspace_consistency_projection",
        ),
        version: 1,
      });

      const sliceTrustProjection = validateWorkspaceSliceTrustProjection({
        ...evaluateWorkspaceSliceTrustProjection({
          taskId: input.taskId,
          queueSliceTrustState,
          taskSliceTrustState,
          attachmentSliceTrustState,
          assistiveSliceTrustState,
          dependencySliceTrustState,
          assuranceSliceTrustRefs:
            input.assuranceSliceTrustRefs ??
            input.releaseTrustVerdict.requiredAssuranceSliceTrustRefs ??
            [],
          blockingDependencyRefs: input.blockingDependencyRefs ?? [],
          evaluatedAt: input.computedAt,
        }),
        workspaceSliceTrustProjectionId: nextWorkspaceProjectionId(
          idGenerator,
          "workspace_slice_trust_projection",
        ),
        version: 1,
      });

      let protectedCompositionState: ProtectedCompositionStateSnapshot | null = null;
      let createdProtectedCompositionState = false;
      if (input.compositionMode && input.focusProtectionLeaseRef && input.releaseGateRef) {
        protectedCompositionState = validateProtectedCompositionState({
          ...evaluateProtectedCompositionState({
            taskId: input.taskId,
            focusProtectionLeaseRef: input.focusProtectionLeaseRef,
            compositionMode: input.compositionMode,
            draftArtifactRefs: input.draftArtifactRefs ?? [],
            primarySelectedAnchorRef: input.selectedAnchorRef,
            compareAnchorRefs: input.compareAnchorRefs ?? [],
            assistiveInsertionPointRef: input.assistiveInsertionPointRef ?? null,
            primaryReadingTargetRef:
              input.primaryReadingTargetRef ?? `${input.taskId}::reading_target`,
            quietReturnTargetRef: input.quietReturnTargetRef ?? `${input.taskId}::quiet_return`,
            allowedLivePatchMode: input.allowedLivePatchMode ?? "blocking_only",
            focusProtectionLeaseState: input.focusProtectionLeaseState ?? "active",
            invalidatingDriftState: input.invalidatingDriftState ?? "none",
            releaseGateRef: input.releaseGateRef,
            startedAt: input.compositionStartedAt ?? input.computedAt,
            releasedAt: input.compositionReleasedAt ?? null,
          }),
          protectedCompositionStateId: nextWorkspaceProjectionId(
            idGenerator,
            "protected_composition_state",
          ),
          version: 1,
        });
        createdProtectedCompositionState = true;
      } else {
        const existingProtectedComposition = await repositories.getLatestProtectedCompositionState(
          input.taskId,
        );
        protectedCompositionState = existingProtectedComposition ?? null;
      }

      const continuityProjection = validateWorkspaceContinuityEvidenceProjection({
        ...evaluateWorkspaceContinuityEvidenceProjection({
          taskId: input.taskId,
          routeFamilyRef: input.routeFamilyRef,
          routeContinuityEvidenceContractRef: input.routeContinuityEvidenceContractRef,
          selectedAnchorRef: input.selectedAnchorRef,
          selectedAnchorTupleHashRef: input.selectedAnchorTupleHashRef,
          continuitySelectedAnchorTupleHashRef: input.continuitySelectedAnchorTupleHashRef,
          surfacePublicationRef: input.surfacePublicationRef,
          runtimePublicationBundleRef: input.runtimePublicationBundleRef,
          expectedSurfacePublicationRef: input.expectedSurfacePublicationRef,
          expectedRuntimePublicationBundleRef: input.expectedRuntimePublicationBundleRef,
          sourceQueueRankSnapshotRef: input.sourceQueueRankSnapshotRef,
          continuitySourceQueueRankSnapshotRef: input.continuitySourceQueueRankSnapshotRef,
          latestTaskCompletionSettlementRef: input.latestTaskCompletionSettlementRef,
          latestPrefetchWindowRef: input.latestPrefetchWindowRef ?? null,
          latestNextTaskLaunchLeaseRef: input.latestNextTaskLaunchLeaseRef ?? null,
          experienceContinuityEvidenceRef: input.experienceContinuityEvidenceRef,
          completionSettlementState: input.completionSettlementState,
          nextTaskLaunchState: input.nextTaskLaunchState,
          anchorRepairTargetRef: input.anchorRepairTargetRef ?? null,
          capturedAt: input.computedAt,
        }),
        workspaceContinuityEvidenceProjectionId: nextWorkspaceProjectionId(
          idGenerator,
          "workspace_continuity_evidence_projection",
        ),
        version: 1,
      });

      if (
        input.ownershipEpochRef !== undefined &&
        input.presentedOwnershipEpoch !== undefined &&
        input.ownershipEpochRef !== input.presentedOwnershipEpoch
      ) {
        continuityProjection.blockingRefs = uniqueSortedRefs([
          ...continuityProjection.blockingRefs,
          "WORKSPACE_232_OWNERSHIP_EPOCH_MISMATCH",
        ]) as WorkspaceProjectionReasonCode[];
      }
      if (
        input.fencingToken !== undefined &&
        input.presentedFencingToken !== undefined &&
        optionalRef(input.fencingToken) !== optionalRef(input.presentedFencingToken)
      ) {
        continuityProjection.blockingRefs = uniqueSortedRefs([
          ...continuityProjection.blockingRefs,
          "WORKSPACE_232_FENCING_TOKEN_MISMATCH",
        ]) as WorkspaceProjectionReasonCode[];
      }
      if (
        input.lineageFenceEpoch !== undefined &&
        input.presentedLineageFenceEpoch !== undefined &&
        input.lineageFenceEpoch !== input.presentedLineageFenceEpoch
      ) {
        continuityProjection.blockingRefs = uniqueSortedRefs([
          ...continuityProjection.blockingRefs,
          "WORKSPACE_232_LINEAGE_FENCE_DRIFT",
        ]) as WorkspaceProjectionReasonCode[];
      }

      const trustEnvelope = validateWorkspaceTrustEnvelope({
        ...evaluateWorkspaceTrustEnvelope({
          workspaceFamily: input.workspaceFamily ?? "staff_review",
          workspaceRef: input.workspaceRef,
          taskOrCaseRef: input.taskId,
          queueKey: input.queueKey,
          workspaceConsistencyProjection: consistencyProjection,
          workspaceSliceTrustProjection: sliceTrustProjection,
          primaryActionLeaseRef: input.reviewActionLeaseRef ?? null,
          primaryActionLeaseState: input.reviewActionLeaseState,
          requestLifecycleLeaseRef: input.requestLifecycleLeaseRef ?? null,
          requestLifecycleLeaseState: input.requestLifecycleLeaseState,
          focusProtectionLeaseRef: input.focusProtectionLeaseRef ?? null,
          protectedCompositionState,
          taskCompletionSettlementEnvelopeRef: input.taskCompletionSettlementEnvelopeRef,
          surfaceRuntimeBindingRef: input.surfaceRuntimeBindingRef,
          surfacePublicationRef: input.surfacePublicationRef,
          runtimePublicationBundleRef: input.runtimePublicationBundleRef,
          selectedAnchorRef: input.selectedAnchorRef,
          selectedAnchorTupleHashRef: input.selectedAnchorTupleHashRef,
          sourceQueueRankSnapshotRef: input.sourceQueueRankSnapshotRef,
          continuityEvidenceProjection: continuityProjection,
          computedAt: input.computedAt,
          staleOwnerRecoveryRef: input.staleOwnerRecoveryRef ?? null,
        }),
        workspaceTrustEnvelopeId: nextWorkspaceProjectionId(
          idGenerator,
          "workspace_trust_envelope",
        ),
        version: 1,
      });

      await repositories.saveStaffWorkspaceConsistencyProjection({
        ...consistencyProjection,
        aggregateType: "StaffWorkspaceConsistencyProjection",
        persistenceSchemaVersion: 1,
      });
      await repositories.saveWorkspaceSliceTrustProjection({
        ...sliceTrustProjection,
        aggregateType: "WorkspaceSliceTrustProjection",
        persistenceSchemaVersion: 1,
      });
      if (protectedCompositionState && createdProtectedCompositionState) {
        await repositories.saveProtectedCompositionState({
          ...protectedCompositionState,
          aggregateType: "ProtectedCompositionState",
          persistenceSchemaVersion: 1,
        });
      }
      await repositories.saveWorkspaceContinuityEvidenceProjection({
        ...continuityProjection,
        aggregateType: "WorkspaceContinuityEvidenceProjection",
        persistenceSchemaVersion: 1,
      });
      await repositories.saveWorkspaceTrustEnvelope({
        ...trustEnvelope,
        aggregateType: "WorkspaceTrustEnvelope",
        persistenceSchemaVersion: 1,
      });

      return {
        taskId: input.taskId,
        requestId: input.requestId,
        queueKey: input.queueKey,
        workspaceRef: input.workspaceRef,
        staffWorkspaceConsistencyProjection: consistencyProjection,
        workspaceSliceTrustProjection: sliceTrustProjection,
        protectedCompositionState,
        workspaceContinuityEvidenceProjection: continuityProjection,
        workspaceTrustEnvelope: trustEnvelope,
      };
    },
  };
}
