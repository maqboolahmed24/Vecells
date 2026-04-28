import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  stableReviewDigest,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
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

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSorted(values: readonly string[]): string[] {
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

function nextId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

export type AdminResolutionSettlementResult =
  | "queued"
  | "patient_notified"
  | "waiting_dependency"
  | "completed"
  | "reopened_for_review"
  | "blocked_pending_safety"
  | "stale_recoverable";

export type AdminResolutionSettlementTrustState = "trusted" | "degraded" | "quarantined";

export type AdminResolutionSettlementActionType =
  | "queue_admin_resolution"
  | "notify_patient"
  | "wait_dependency"
  | "record_completion"
  | "reopen_for_review"
  | "block_pending_safety"
  | "mark_stale_recoverable";

export type AdminResolutionProjectionState = "fresh" | "stale" | "recovery_required";

export type AdminResolutionReentryDestination =
  | "clinician_review"
  | "triage_review"
  | "identity_repair"
  | "contact_route_repair"
  | "consent_repair"
  | "external_confirmation"
  | "bounded_admin_resume";

export type AdminResolutionReentryMode =
  | "reopen_launch"
  | "repair_route_only"
  | "same_shell_recovery";

export type AdminResolutionReentryReasonClass =
  | "clinical_reentry"
  | "boundary_reopened"
  | "identity_repair"
  | "reachability_repair"
  | "consent_repair"
  | "external_confirmation"
  | "stale_tuple";

const settlementResults: readonly AdminResolutionSettlementResult[] = [
  "queued",
  "patient_notified",
  "waiting_dependency",
  "completed",
  "reopened_for_review",
  "blocked_pending_safety",
  "stale_recoverable",
];

const trustStates: readonly AdminResolutionSettlementTrustState[] = [
  "trusted",
  "degraded",
  "quarantined",
];

const actionTypes: readonly AdminResolutionSettlementActionType[] = [
  "queue_admin_resolution",
  "notify_patient",
  "wait_dependency",
  "record_completion",
  "reopen_for_review",
  "block_pending_safety",
  "mark_stale_recoverable",
];

const projectionStates: readonly AdminResolutionProjectionState[] = [
  "fresh",
  "stale",
  "recovery_required",
];

const reentryDestinations: readonly AdminResolutionReentryDestination[] = [
  "clinician_review",
  "triage_review",
  "identity_repair",
  "contact_route_repair",
  "consent_repair",
  "external_confirmation",
  "bounded_admin_resume",
];

const reentryModes: readonly AdminResolutionReentryMode[] = [
  "reopen_launch",
  "repair_route_only",
  "same_shell_recovery",
];

const reentryReasonClasses: readonly AdminResolutionReentryReasonClass[] = [
  "clinical_reentry",
  "boundary_reopened",
  "identity_repair",
  "reachability_repair",
  "consent_repair",
  "external_confirmation",
  "stale_tuple",
];

export interface AdminResolutionTransitionGuardRule {
  result: AdminResolutionSettlementResult;
  allowedPredecessors: readonly (AdminResolutionSettlementResult | "none")[];
  requiresStableTuple: boolean;
  requiresCompletionArtifact: boolean;
  requiresExpectationTemplate: boolean;
  patientVisibilityMayAdvance: boolean;
  terminalMode: "reopenable" | "recovery_only";
  staleFallbackResult: "stale_recoverable";
}

export const adminResolutionTransitionGuardTable: Readonly<
  Record<AdminResolutionSettlementResult, AdminResolutionTransitionGuardRule>
> = {
  queued: {
    result: "queued",
    allowedPredecessors: [
      "none",
      "stale_recoverable",
      "blocked_pending_safety",
      "reopened_for_review",
    ],
    requiresStableTuple: true,
    requiresCompletionArtifact: false,
    requiresExpectationTemplate: false,
    patientVisibilityMayAdvance: false,
    terminalMode: "reopenable",
    staleFallbackResult: "stale_recoverable",
  },
  patient_notified: {
    result: "patient_notified",
    allowedPredecessors: [
      "none",
      "queued",
      "waiting_dependency",
      "stale_recoverable",
    ],
    requiresStableTuple: true,
    requiresCompletionArtifact: false,
    requiresExpectationTemplate: false,
    patientVisibilityMayAdvance: true,
    terminalMode: "reopenable",
    staleFallbackResult: "stale_recoverable",
  },
  waiting_dependency: {
    result: "waiting_dependency",
    allowedPredecessors: [
      "none",
      "queued",
      "patient_notified",
      "stale_recoverable",
    ],
    requiresStableTuple: true,
    requiresCompletionArtifact: false,
    requiresExpectationTemplate: false,
    patientVisibilityMayAdvance: true,
    terminalMode: "reopenable",
    staleFallbackResult: "stale_recoverable",
  },
  completed: {
    result: "completed",
    allowedPredecessors: [
      "none",
      "queued",
      "patient_notified",
      "waiting_dependency",
    ],
    requiresStableTuple: true,
    requiresCompletionArtifact: true,
    requiresExpectationTemplate: true,
    patientVisibilityMayAdvance: true,
    terminalMode: "reopenable",
    staleFallbackResult: "stale_recoverable",
  },
  reopened_for_review: {
    result: "reopened_for_review",
    allowedPredecessors: [
      "none",
      "queued",
      "patient_notified",
      "waiting_dependency",
      "completed",
      "blocked_pending_safety",
      "stale_recoverable",
    ],
    requiresStableTuple: false,
    requiresCompletionArtifact: false,
    requiresExpectationTemplate: false,
    patientVisibilityMayAdvance: false,
    terminalMode: "recovery_only",
    staleFallbackResult: "stale_recoverable",
  },
  blocked_pending_safety: {
    result: "blocked_pending_safety",
    allowedPredecessors: [
      "none",
      "queued",
      "patient_notified",
      "waiting_dependency",
      "completed",
      "stale_recoverable",
    ],
    requiresStableTuple: false,
    requiresCompletionArtifact: false,
    requiresExpectationTemplate: false,
    patientVisibilityMayAdvance: false,
    terminalMode: "recovery_only",
    staleFallbackResult: "stale_recoverable",
  },
  stale_recoverable: {
    result: "stale_recoverable",
    allowedPredecessors: [
      "none",
      "queued",
      "patient_notified",
      "waiting_dependency",
      "completed",
      "reopened_for_review",
      "blocked_pending_safety",
      "stale_recoverable",
    ],
    requiresStableTuple: false,
    requiresCompletionArtifact: false,
    requiresExpectationTemplate: false,
    patientVisibilityMayAdvance: false,
    terminalMode: "recovery_only",
    staleFallbackResult: "stale_recoverable",
  },
};

export interface AdminResolutionActionRecordSnapshot {
  adminResolutionActionRecordId: string;
  taskId: string;
  adminResolutionCaseRef: string;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  clinicalMeaningState: string;
  operationalFollowUpScope: string;
  decisionEpochRef: string;
  decisionSupersessionRecordRef: string | null;
  actionType: AdminResolutionSettlementActionType;
  routeIntentBindingRef: string;
  reviewActionLeaseRef: string;
  reviewActionOwnershipEpochRef: string;
  reviewActionFencingToken: string;
  workspaceConsistencyProjectionRef: string;
  workspaceTrustProjectionRef: string;
  commandActionRef: string;
  policyBundleRef: string;
  releaseApprovalFreezeRef: string;
  channelReleaseFreezeRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  lineageFenceEpoch: number;
  reasonCodeRefs: readonly string[];
  idempotencyKey: string;
  createdByRef: string;
  createdAt: string;
  settledAt: string | null;
  version: number;
}

export interface AdminResolutionSettlementSnapshot {
  adminResolutionSettlementId: string;
  taskId: string;
  adminResolutionCaseRef: string;
  adminResolutionActionRecordRef: string;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  clinicalMeaningState: string;
  operationalFollowUpScope: string;
  decisionEpochRef: string;
  decisionSupersessionRecordRef: string | null;
  commandSettlementRef: string;
  transitionEnvelopeRef: string;
  taskCompletionSettlementEnvelopeRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  dependencySetRef: string;
  releaseWatchRef: string;
  reopenState: string;
  result: AdminResolutionSettlementResult;
  trustState: AdminResolutionSettlementTrustState;
  completionArtifactRef: string | null;
  patientExpectationTemplateRef: string | null;
  recoveryDispositionRef: string;
  visibilityTier: string;
  summarySafetyTier: string;
  placeholderContractRef: string;
  recoveryRouteRef: string;
  selectedAnchorRef: string;
  lineageFenceEpoch: number;
  reasonCodeRefs: readonly string[];
  settlementRevision: number;
  recordedAt: string;
  version: number;
}

export interface AdminResolutionExperienceProjectionSnapshot {
  adminResolutionExperienceProjectionId: string;
  taskId: string;
  adminResolutionCaseRef: string;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  decisionEpochRef: string;
  currentSettlementRef: string;
  completionArtifactRef: string | null;
  dependencySetRef: string;
  releaseWatchRef: string;
  patientShellConsistencyProjectionRef: string;
  patientEmbeddedSessionProjectionRef: string;
  staffWorkspaceConsistencyProjectionRef: string;
  workspaceSliceTrustProjectionRef: string;
  consistencyProjectionRef: string;
  visibilityPolicyRef: string;
  bundleVersion: string;
  audienceTier: string;
  routeFamilyRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  transitionEnvelopeRef: string;
  selectedAnchorRef: string;
  clinicalMeaningState: string;
  operationalFollowUpScope: string;
  adminMutationAuthorityState: "bounded_admin_only" | "frozen";
  boundaryReopenState: string;
  releaseState: string;
  trustState: AdminResolutionSettlementTrustState;
  visibilityTier: string;
  summarySafetyTier: string;
  placeholderContractRef: string;
  routeFreezeDispositionRef: string;
  dominantNextActionRef: string;
  projectionState: AdminResolutionProjectionState;
  computedAt: string;
  version: number;
}

export interface AdminResolutionCrossDomainReentrySnapshot {
  adminResolutionCrossDomainReentryId: string;
  taskId: string;
  adminResolutionCaseRef: string;
  originatingSettlementRef: string;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  decisionEpochRef: string;
  dependencySetRef: string;
  destination: AdminResolutionReentryDestination;
  resolverMode: AdminResolutionReentryMode;
  reasonClass: AdminResolutionReentryReasonClass;
  causalReasonCodeRefs: readonly string[];
  preserveSupersededProvenance: boolean;
  createdGovernedArtifactRef: string | null;
  reusedGovernedArtifactRef: string | null;
  continuityHintRef: string;
  recoveryRouteRef: string;
  createdAt: string;
  version: number;
}

export interface Phase3AdminResolutionSettlementBundle {
  currentActionRecord: AdminResolutionActionRecordSnapshot | null;
  currentSettlement: AdminResolutionSettlementSnapshot | null;
  currentExperienceProjection: AdminResolutionExperienceProjectionSnapshot | null;
  currentCrossDomainReentry: AdminResolutionCrossDomainReentrySnapshot | null;
  actionRecords: readonly AdminResolutionActionRecordSnapshot[];
  settlements: readonly AdminResolutionSettlementSnapshot[];
  experienceProjections: readonly AdminResolutionExperienceProjectionSnapshot[];
  crossDomainReentries: readonly AdminResolutionCrossDomainReentrySnapshot[];
}

export interface AdminResolutionLiveTupleSnapshot {
  taskId: string;
  currentBoundaryDecisionRef: string | null;
  currentBoundaryTupleHash: string | null;
  currentBoundaryState: string | null;
  currentClinicalMeaningState: string | null;
  currentOperationalFollowUpScope: string | null;
  currentAdminMutationAuthorityState: string | null;
  currentDecisionEpochRef: string | null;
  currentDecisionSupersessionRecordRef: string | null;
  currentDependencySetRef: string | null;
  currentDependencyReopenState: string | null;
  canContinueCurrentConsequence: boolean;
  currentLineageFenceEpoch: number | null;
  currentCompletionArtifactRef: string | null;
  currentPatientExpectationTemplateRef: string | null;
  currentReopenState: string | null;
  currentVisibilityTier: string;
  currentSummarySafetyTier: string;
  currentPlaceholderContractRef: string;
  currentReleaseState: string;
  currentTrustState: AdminResolutionSettlementTrustState;
  currentSurfaceRouteContractRef: string;
  currentSurfacePublicationRef: string;
  currentRuntimePublicationBundleRef: string;
  currentTaskCompletionSettlementEnvelopeRef: string;
  currentSelectedAnchorRef: string;
  currentRouteFamilyRef: string;
  currentPatientShellConsistencyProjectionRef: string;
  currentPatientEmbeddedSessionProjectionRef: string;
  currentStaffWorkspaceConsistencyProjectionRef: string;
  currentWorkspaceSliceTrustProjectionRef: string;
  currentConsistencyProjectionRef: string;
  currentVisibilityPolicyRef: string;
  currentAudienceTier: string;
  currentTransitionEnvelopeRef: string;
  currentReleaseWatchRef: string;
  currentRouteIntentBindingRef: string;
  currentReviewActionLeaseRef: string;
  currentReviewActionOwnershipEpochRef: string;
  currentReviewActionFencingToken: string;
  currentWorkspaceConsistencyProjectionRef: string;
  currentWorkspaceTrustProjectionRef: string;
  currentCommandActionRef: string;
  currentCommandSettlementRef: string;
  currentReleaseApprovalFreezeRef: string;
  currentChannelReleaseFreezeRef: string;
}

export interface AdminResolutionSettlementMutationInput {
  adminResolutionCaseRef: string;
  caseBoundaryDecisionRef: string;
  caseBoundaryTupleHash: string;
  caseDecisionEpochRef: string;
  caseLineageFenceEpoch: number;
  actionType: AdminResolutionSettlementActionType;
  desiredResult: AdminResolutionSettlementResult;
  actorRef: string;
  recordedAt: string;
  policyBundleRef: string;
  liveTuple: AdminResolutionLiveTupleSnapshot;
  presentedBoundaryTupleHash?: string | null;
  presentedDecisionEpochRef?: string | null;
  presentedDependencySetRef?: string | null;
  presentedCompletionArtifactRef?: string | null;
  presentedLineageFenceEpoch?: number | null;
  completionArtifactRef?: string | null;
  patientExpectationTemplateRef?: string | null;
  reasonCodeRefs?: readonly string[];
}

export interface ResolveAdminCrossDomainReentryInput {
  adminResolutionCaseRef: string;
  originatingSettlementRef: string;
  decisionEpochRef: string;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  dependencySetRef: string;
  destination: AdminResolutionReentryDestination;
  resolverMode: AdminResolutionReentryMode;
  reasonClass: AdminResolutionReentryReasonClass;
  causalReasonCodeRefs: readonly string[];
  preserveSupersededProvenance: boolean;
  createdGovernedArtifactRef?: string | null;
  reusedGovernedArtifactRef?: string | null;
  continuityHintRef: string;
  recoveryRouteRef: string;
  createdAt: string;
}

export interface AdminResolutionStaleTupleEvaluation {
  stale: boolean;
  staleReasonCodeRefs: readonly string[];
  liveTupleIllegal: boolean;
  liveTupleReasonCodeRefs: readonly string[];
}

export interface AdminResolutionReentryResolution {
  destination: AdminResolutionReentryDestination;
  resolverMode: AdminResolutionReentryMode;
  reasonClass: AdminResolutionReentryReasonClass;
  causalReasonCodeRefs: readonly string[];
  preserveSupersededProvenance: boolean;
  continuityHintRef: string;
  recoveryRouteRef: string;
}

export interface AdminResolutionSettlementMutationResult
  extends Phase3AdminResolutionSettlementBundle {
  actionRecord: AdminResolutionActionRecordSnapshot;
  settlement: AdminResolutionSettlementSnapshot;
  experienceProjection: AdminResolutionExperienceProjectionSnapshot;
  replayedExisting: boolean;
  staleTupleEvaluation: AdminResolutionStaleTupleEvaluation;
}

function normalizeActionRecord(
  snapshot: AdminResolutionActionRecordSnapshot,
): AdminResolutionActionRecordSnapshot {
  ensurePositiveInteger(snapshot.version, "version");
  ensurePositiveInteger(snapshot.lineageFenceEpoch, "lineageFenceEpoch");
  invariant(
    actionTypes.includes(snapshot.actionType),
    "INVALID_ADMIN_RESOLUTION_ACTION_TYPE",
    "Unsupported AdminResolutionActionRecord.actionType.",
  );
  return {
    ...snapshot,
    adminResolutionActionRecordId: requireRef(
      snapshot.adminResolutionActionRecordId,
      "adminResolutionActionRecordId",
    ),
    taskId: requireRef(snapshot.taskId, "taskId"),
    adminResolutionCaseRef: requireRef(snapshot.adminResolutionCaseRef, "adminResolutionCaseRef"),
    boundaryDecisionRef: requireRef(snapshot.boundaryDecisionRef, "boundaryDecisionRef"),
    boundaryTupleHash: requireRef(snapshot.boundaryTupleHash, "boundaryTupleHash"),
    clinicalMeaningState: requireRef(snapshot.clinicalMeaningState, "clinicalMeaningState"),
    operationalFollowUpScope: requireRef(
      snapshot.operationalFollowUpScope,
      "operationalFollowUpScope",
    ),
    decisionEpochRef: requireRef(snapshot.decisionEpochRef, "decisionEpochRef"),
    decisionSupersessionRecordRef: optionalRef(snapshot.decisionSupersessionRecordRef),
    routeIntentBindingRef: requireRef(snapshot.routeIntentBindingRef, "routeIntentBindingRef"),
    reviewActionLeaseRef: requireRef(snapshot.reviewActionLeaseRef, "reviewActionLeaseRef"),
    reviewActionOwnershipEpochRef: requireRef(
      snapshot.reviewActionOwnershipEpochRef,
      "reviewActionOwnershipEpochRef",
    ),
    reviewActionFencingToken: requireRef(
      snapshot.reviewActionFencingToken,
      "reviewActionFencingToken",
    ),
    workspaceConsistencyProjectionRef: requireRef(
      snapshot.workspaceConsistencyProjectionRef,
      "workspaceConsistencyProjectionRef",
    ),
    workspaceTrustProjectionRef: requireRef(
      snapshot.workspaceTrustProjectionRef,
      "workspaceTrustProjectionRef",
    ),
    commandActionRef: requireRef(snapshot.commandActionRef, "commandActionRef"),
    policyBundleRef: requireRef(snapshot.policyBundleRef, "policyBundleRef"),
    releaseApprovalFreezeRef: requireRef(
      snapshot.releaseApprovalFreezeRef,
      "releaseApprovalFreezeRef",
    ),
    channelReleaseFreezeRef: requireRef(
      snapshot.channelReleaseFreezeRef,
      "channelReleaseFreezeRef",
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
    reasonCodeRefs: uniqueSorted(snapshot.reasonCodeRefs),
    idempotencyKey: requireRef(snapshot.idempotencyKey, "idempotencyKey"),
    createdByRef: requireRef(snapshot.createdByRef, "createdByRef"),
    createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
    settledAt: snapshot.settledAt ? ensureIsoTimestamp(snapshot.settledAt, "settledAt") : null,
  };
}

function normalizeSettlement(
  snapshot: AdminResolutionSettlementSnapshot,
): AdminResolutionSettlementSnapshot {
  ensurePositiveInteger(snapshot.version, "version");
  ensurePositiveInteger(snapshot.lineageFenceEpoch, "lineageFenceEpoch");
  ensurePositiveInteger(snapshot.settlementRevision, "settlementRevision");
  invariant(
    settlementResults.includes(snapshot.result),
    "INVALID_ADMIN_RESOLUTION_SETTLEMENT_RESULT",
    "Unsupported AdminResolutionSettlement.result.",
  );
  invariant(
    trustStates.includes(snapshot.trustState),
    "INVALID_ADMIN_RESOLUTION_SETTLEMENT_TRUST_STATE",
    "Unsupported AdminResolutionSettlement.trustState.",
  );
  return {
    ...snapshot,
    adminResolutionSettlementId: requireRef(
      snapshot.adminResolutionSettlementId,
      "adminResolutionSettlementId",
    ),
    taskId: requireRef(snapshot.taskId, "taskId"),
    adminResolutionCaseRef: requireRef(snapshot.adminResolutionCaseRef, "adminResolutionCaseRef"),
    adminResolutionActionRecordRef: requireRef(
      snapshot.adminResolutionActionRecordRef,
      "adminResolutionActionRecordRef",
    ),
    boundaryDecisionRef: requireRef(snapshot.boundaryDecisionRef, "boundaryDecisionRef"),
    boundaryTupleHash: requireRef(snapshot.boundaryTupleHash, "boundaryTupleHash"),
    clinicalMeaningState: requireRef(snapshot.clinicalMeaningState, "clinicalMeaningState"),
    operationalFollowUpScope: requireRef(
      snapshot.operationalFollowUpScope,
      "operationalFollowUpScope",
    ),
    decisionEpochRef: requireRef(snapshot.decisionEpochRef, "decisionEpochRef"),
    decisionSupersessionRecordRef: optionalRef(snapshot.decisionSupersessionRecordRef),
    commandSettlementRef: requireRef(snapshot.commandSettlementRef, "commandSettlementRef"),
    transitionEnvelopeRef: requireRef(snapshot.transitionEnvelopeRef, "transitionEnvelopeRef"),
    taskCompletionSettlementEnvelopeRef: requireRef(
      snapshot.taskCompletionSettlementEnvelopeRef,
      "taskCompletionSettlementEnvelopeRef",
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
    dependencySetRef: requireRef(snapshot.dependencySetRef, "dependencySetRef"),
    releaseWatchRef: requireRef(snapshot.releaseWatchRef, "releaseWatchRef"),
    reopenState: requireRef(snapshot.reopenState, "reopenState"),
    completionArtifactRef: optionalRef(snapshot.completionArtifactRef),
    patientExpectationTemplateRef: optionalRef(snapshot.patientExpectationTemplateRef),
    recoveryDispositionRef: requireRef(snapshot.recoveryDispositionRef, "recoveryDispositionRef"),
    visibilityTier: requireRef(snapshot.visibilityTier, "visibilityTier"),
    summarySafetyTier: requireRef(snapshot.summarySafetyTier, "summarySafetyTier"),
    placeholderContractRef: requireRef(
      snapshot.placeholderContractRef,
      "placeholderContractRef",
    ),
    recoveryRouteRef: requireRef(snapshot.recoveryRouteRef, "recoveryRouteRef"),
    selectedAnchorRef: requireRef(snapshot.selectedAnchorRef, "selectedAnchorRef"),
    reasonCodeRefs: uniqueSorted(snapshot.reasonCodeRefs),
    recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
  };
}

function normalizeExperienceProjection(
  snapshot: AdminResolutionExperienceProjectionSnapshot,
): AdminResolutionExperienceProjectionSnapshot {
  ensurePositiveInteger(snapshot.version, "version");
  invariant(
    trustStates.includes(snapshot.trustState),
    "INVALID_ADMIN_RESOLUTION_PROJECTION_TRUST_STATE",
    "Unsupported AdminResolutionExperienceProjection.trustState.",
  );
  invariant(
    projectionStates.includes(snapshot.projectionState),
    "INVALID_ADMIN_RESOLUTION_PROJECTION_STATE",
    "Unsupported AdminResolutionExperienceProjection.projectionState.",
  );
  return {
    ...snapshot,
    adminResolutionExperienceProjectionId: requireRef(
      snapshot.adminResolutionExperienceProjectionId,
      "adminResolutionExperienceProjectionId",
    ),
    taskId: requireRef(snapshot.taskId, "taskId"),
    adminResolutionCaseRef: requireRef(snapshot.adminResolutionCaseRef, "adminResolutionCaseRef"),
    boundaryDecisionRef: requireRef(snapshot.boundaryDecisionRef, "boundaryDecisionRef"),
    boundaryTupleHash: requireRef(snapshot.boundaryTupleHash, "boundaryTupleHash"),
    decisionEpochRef: requireRef(snapshot.decisionEpochRef, "decisionEpochRef"),
    currentSettlementRef: requireRef(snapshot.currentSettlementRef, "currentSettlementRef"),
    completionArtifactRef: optionalRef(snapshot.completionArtifactRef),
    dependencySetRef: requireRef(snapshot.dependencySetRef, "dependencySetRef"),
    releaseWatchRef: requireRef(snapshot.releaseWatchRef, "releaseWatchRef"),
    patientShellConsistencyProjectionRef: requireRef(
      snapshot.patientShellConsistencyProjectionRef,
      "patientShellConsistencyProjectionRef",
    ),
    patientEmbeddedSessionProjectionRef: requireRef(
      snapshot.patientEmbeddedSessionProjectionRef,
      "patientEmbeddedSessionProjectionRef",
    ),
    staffWorkspaceConsistencyProjectionRef: requireRef(
      snapshot.staffWorkspaceConsistencyProjectionRef,
      "staffWorkspaceConsistencyProjectionRef",
    ),
    workspaceSliceTrustProjectionRef: requireRef(
      snapshot.workspaceSliceTrustProjectionRef,
      "workspaceSliceTrustProjectionRef",
    ),
    consistencyProjectionRef: requireRef(
      snapshot.consistencyProjectionRef,
      "consistencyProjectionRef",
    ),
    visibilityPolicyRef: requireRef(snapshot.visibilityPolicyRef, "visibilityPolicyRef"),
    bundleVersion: requireRef(snapshot.bundleVersion, "bundleVersion"),
    audienceTier: requireRef(snapshot.audienceTier, "audienceTier"),
    routeFamilyRef: requireRef(snapshot.routeFamilyRef, "routeFamilyRef"),
    surfaceRouteContractRef: requireRef(
      snapshot.surfaceRouteContractRef,
      "surfaceRouteContractRef",
    ),
    surfacePublicationRef: requireRef(snapshot.surfacePublicationRef, "surfacePublicationRef"),
    runtimePublicationBundleRef: requireRef(
      snapshot.runtimePublicationBundleRef,
      "runtimePublicationBundleRef",
    ),
    transitionEnvelopeRef: requireRef(snapshot.transitionEnvelopeRef, "transitionEnvelopeRef"),
    selectedAnchorRef: requireRef(snapshot.selectedAnchorRef, "selectedAnchorRef"),
    clinicalMeaningState: requireRef(snapshot.clinicalMeaningState, "clinicalMeaningState"),
    operationalFollowUpScope: requireRef(
      snapshot.operationalFollowUpScope,
      "operationalFollowUpScope",
    ),
    releaseState: requireRef(snapshot.releaseState, "releaseState"),
    visibilityTier: requireRef(snapshot.visibilityTier, "visibilityTier"),
    summarySafetyTier: requireRef(snapshot.summarySafetyTier, "summarySafetyTier"),
    placeholderContractRef: requireRef(
      snapshot.placeholderContractRef,
      "placeholderContractRef",
    ),
    routeFreezeDispositionRef: requireRef(
      snapshot.routeFreezeDispositionRef,
      "routeFreezeDispositionRef",
    ),
    dominantNextActionRef: requireRef(snapshot.dominantNextActionRef, "dominantNextActionRef"),
    computedAt: ensureIsoTimestamp(snapshot.computedAt, "computedAt"),
  };
}

function normalizeCrossDomainReentry(
  snapshot: AdminResolutionCrossDomainReentrySnapshot,
): AdminResolutionCrossDomainReentrySnapshot {
  ensurePositiveInteger(snapshot.version, "version");
  invariant(
    reentryDestinations.includes(snapshot.destination),
    "INVALID_ADMIN_RESOLUTION_REENTRY_DESTINATION",
    "Unsupported AdminResolutionCrossDomainReentry.destination.",
  );
  invariant(
    reentryModes.includes(snapshot.resolverMode),
    "INVALID_ADMIN_RESOLUTION_REENTRY_MODE",
    "Unsupported AdminResolutionCrossDomainReentry.resolverMode.",
  );
  invariant(
    reentryReasonClasses.includes(snapshot.reasonClass),
    "INVALID_ADMIN_RESOLUTION_REENTRY_REASON_CLASS",
    "Unsupported AdminResolutionCrossDomainReentry.reasonClass.",
  );
  return {
    ...snapshot,
    adminResolutionCrossDomainReentryId: requireRef(
      snapshot.adminResolutionCrossDomainReentryId,
      "adminResolutionCrossDomainReentryId",
    ),
    taskId: requireRef(snapshot.taskId, "taskId"),
    adminResolutionCaseRef: requireRef(snapshot.adminResolutionCaseRef, "adminResolutionCaseRef"),
    originatingSettlementRef: requireRef(
      snapshot.originatingSettlementRef,
      "originatingSettlementRef",
    ),
    boundaryDecisionRef: requireRef(snapshot.boundaryDecisionRef, "boundaryDecisionRef"),
    boundaryTupleHash: requireRef(snapshot.boundaryTupleHash, "boundaryTupleHash"),
    decisionEpochRef: requireRef(snapshot.decisionEpochRef, "decisionEpochRef"),
    dependencySetRef: requireRef(snapshot.dependencySetRef, "dependencySetRef"),
    causalReasonCodeRefs: uniqueSorted(snapshot.causalReasonCodeRefs),
    createdGovernedArtifactRef: optionalRef(snapshot.createdGovernedArtifactRef),
    reusedGovernedArtifactRef: optionalRef(snapshot.reusedGovernedArtifactRef),
    continuityHintRef: requireRef(snapshot.continuityHintRef, "continuityHintRef"),
    recoveryRouteRef: requireRef(snapshot.recoveryRouteRef, "recoveryRouteRef"),
    createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
  };
}

export interface Phase3AdminResolutionSettlementRepositories {
  getAdminResolutionActionRecord(
    adminResolutionActionRecordId: string,
  ): Promise<AdminResolutionActionRecordSnapshot | null>;
  getActionRecordByCaseAndIdempotencyKey(
    adminResolutionCaseRef: string,
    idempotencyKey: string,
  ): Promise<AdminResolutionActionRecordSnapshot | null>;
  saveAdminResolutionActionRecord(
    actionRecord: AdminResolutionActionRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAdminResolutionActionRecordsForCase(
    adminResolutionCaseRef: string,
  ): Promise<readonly AdminResolutionActionRecordSnapshot[]>;
  getCurrentAdminResolutionActionRecordForCase(
    adminResolutionCaseRef: string,
  ): Promise<AdminResolutionActionRecordSnapshot | null>;

  getAdminResolutionSettlement(
    adminResolutionSettlementId: string,
  ): Promise<AdminResolutionSettlementSnapshot | null>;
  getSettlementByActionRecord(
    adminResolutionActionRecordRef: string,
  ): Promise<AdminResolutionSettlementSnapshot | null>;
  saveAdminResolutionSettlement(
    settlement: AdminResolutionSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAdminResolutionSettlementsForCase(
    adminResolutionCaseRef: string,
  ): Promise<readonly AdminResolutionSettlementSnapshot[]>;
  getCurrentAdminResolutionSettlementForCase(
    adminResolutionCaseRef: string,
  ): Promise<AdminResolutionSettlementSnapshot | null>;
  getCurrentAdminResolutionSettlementForTask(
    taskId: string,
  ): Promise<AdminResolutionSettlementSnapshot | null>;

  getAdminResolutionExperienceProjection(
    adminResolutionExperienceProjectionId: string,
  ): Promise<AdminResolutionExperienceProjectionSnapshot | null>;
  saveAdminResolutionExperienceProjection(
    projection: AdminResolutionExperienceProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAdminResolutionExperienceProjectionsForCase(
    adminResolutionCaseRef: string,
  ): Promise<readonly AdminResolutionExperienceProjectionSnapshot[]>;
  getCurrentAdminResolutionExperienceProjectionForCase(
    adminResolutionCaseRef: string,
  ): Promise<AdminResolutionExperienceProjectionSnapshot | null>;
  getCurrentAdminResolutionExperienceProjectionForTask(
    taskId: string,
  ): Promise<AdminResolutionExperienceProjectionSnapshot | null>;

  getAdminResolutionCrossDomainReentry(
    adminResolutionCrossDomainReentryId: string,
  ): Promise<AdminResolutionCrossDomainReentrySnapshot | null>;
  saveAdminResolutionCrossDomainReentry(
    reentry: AdminResolutionCrossDomainReentrySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAdminResolutionCrossDomainReentriesForCase(
    adminResolutionCaseRef: string,
  ): Promise<readonly AdminResolutionCrossDomainReentrySnapshot[]>;
  getCurrentAdminResolutionCrossDomainReentryForCase(
    adminResolutionCaseRef: string,
  ): Promise<AdminResolutionCrossDomainReentrySnapshot | null>;
  getCurrentAdminResolutionCrossDomainReentryForTask(
    taskId: string,
  ): Promise<AdminResolutionCrossDomainReentrySnapshot | null>;
}

class InMemoryPhase3AdminResolutionSettlementStore
  implements Phase3AdminResolutionSettlementRepositories
{
  private readonly actionRecords = new Map<string, AdminResolutionActionRecordSnapshot>();
  private readonly actionRecordIdsByCase = new Map<string, string[]>();
  private readonly currentActionRecordByCase = new Map<string, string>();
  private readonly actionRecordByCaseAndKey = new Map<string, string>();

  private readonly settlements = new Map<string, AdminResolutionSettlementSnapshot>();
  private readonly settlementIdsByCase = new Map<string, string[]>();
  private readonly currentSettlementByCase = new Map<string, string>();
  private readonly currentSettlementByTask = new Map<string, string>();
  private readonly settlementByActionRecord = new Map<string, string>();

  private readonly projections = new Map<string, AdminResolutionExperienceProjectionSnapshot>();
  private readonly projectionIdsByCase = new Map<string, string[]>();
  private readonly currentProjectionByCase = new Map<string, string>();
  private readonly currentProjectionByTask = new Map<string, string>();

  private readonly reentries = new Map<string, AdminResolutionCrossDomainReentrySnapshot>();
  private readonly reentryIdsByCase = new Map<string, string[]>();
  private readonly currentReentryByCase = new Map<string, string>();
  private readonly currentReentryByTask = new Map<string, string>();

  async getAdminResolutionActionRecord(
    adminResolutionActionRecordId: string,
  ): Promise<AdminResolutionActionRecordSnapshot | null> {
    return this.actionRecords.get(adminResolutionActionRecordId) ?? null;
  }

  async getActionRecordByCaseAndIdempotencyKey(
    adminResolutionCaseRef: string,
    idempotencyKey: string,
  ): Promise<AdminResolutionActionRecordSnapshot | null> {
    const currentId = this.actionRecordByCaseAndKey.get(
      `${adminResolutionCaseRef}::${idempotencyKey}`,
    );
    return currentId ? (this.actionRecords.get(currentId) ?? null) : null;
  }

  async saveAdminResolutionActionRecord(
    actionRecord: AdminResolutionActionRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const normalized = normalizeActionRecord(actionRecord);
    saveWithCas(
      this.actionRecords,
      normalized.adminResolutionActionRecordId,
      normalized,
      options,
    );
    const existing = this.actionRecordIdsByCase.get(normalized.adminResolutionCaseRef) ?? [];
    if (!existing.includes(normalized.adminResolutionActionRecordId)) {
      this.actionRecordIdsByCase.set(normalized.adminResolutionCaseRef, [
        ...existing,
        normalized.adminResolutionActionRecordId,
      ]);
    }
    this.actionRecordByCaseAndKey.set(
      `${normalized.adminResolutionCaseRef}::${normalized.idempotencyKey}`,
      normalized.adminResolutionActionRecordId,
    );
    const currentId = this.currentActionRecordByCase.get(normalized.adminResolutionCaseRef);
    const current = currentId ? this.actionRecords.get(currentId) ?? null : null;
    if (current === null || compareIso(current.createdAt, normalized.createdAt) <= 0) {
      this.currentActionRecordByCase.set(
        normalized.adminResolutionCaseRef,
        normalized.adminResolutionActionRecordId,
      );
    }
  }

  async listAdminResolutionActionRecordsForCase(
    adminResolutionCaseRef: string,
  ): Promise<readonly AdminResolutionActionRecordSnapshot[]> {
    return (this.actionRecordIdsByCase.get(adminResolutionCaseRef) ?? [])
      .map((id) => this.actionRecords.get(id))
      .filter((entry): entry is AdminResolutionActionRecordSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async getCurrentAdminResolutionActionRecordForCase(
    adminResolutionCaseRef: string,
  ): Promise<AdminResolutionActionRecordSnapshot | null> {
    const currentId = this.currentActionRecordByCase.get(adminResolutionCaseRef);
    return currentId ? (this.actionRecords.get(currentId) ?? null) : null;
  }

  async getAdminResolutionSettlement(
    adminResolutionSettlementId: string,
  ): Promise<AdminResolutionSettlementSnapshot | null> {
    return this.settlements.get(adminResolutionSettlementId) ?? null;
  }

  async getSettlementByActionRecord(
    adminResolutionActionRecordRef: string,
  ): Promise<AdminResolutionSettlementSnapshot | null> {
    const settlementId = this.settlementByActionRecord.get(adminResolutionActionRecordRef);
    return settlementId ? (this.settlements.get(settlementId) ?? null) : null;
  }

  async saveAdminResolutionSettlement(
    settlement: AdminResolutionSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const normalized = normalizeSettlement(settlement);
    saveWithCas(
      this.settlements,
      normalized.adminResolutionSettlementId,
      normalized,
      options,
    );
    const existing = this.settlementIdsByCase.get(normalized.adminResolutionCaseRef) ?? [];
    if (!existing.includes(normalized.adminResolutionSettlementId)) {
      this.settlementIdsByCase.set(normalized.adminResolutionCaseRef, [
        ...existing,
        normalized.adminResolutionSettlementId,
      ]);
    }
    this.settlementByActionRecord.set(
      normalized.adminResolutionActionRecordRef,
      normalized.adminResolutionSettlementId,
    );
    const currentCaseId = this.currentSettlementByCase.get(normalized.adminResolutionCaseRef);
    const currentCase =
      currentCaseId ? this.settlements.get(currentCaseId) ?? null : null;
    if (currentCase === null || compareIso(currentCase.recordedAt, normalized.recordedAt) <= 0) {
      this.currentSettlementByCase.set(
        normalized.adminResolutionCaseRef,
        normalized.adminResolutionSettlementId,
      );
    }
    const currentTaskId = this.currentSettlementByTask.get(normalized.taskId);
    const currentTask =
      currentTaskId ? this.settlements.get(currentTaskId) ?? null : null;
    if (currentTask === null || compareIso(currentTask.recordedAt, normalized.recordedAt) <= 0) {
      this.currentSettlementByTask.set(normalized.taskId, normalized.adminResolutionSettlementId);
    }
  }

  async listAdminResolutionSettlementsForCase(
    adminResolutionCaseRef: string,
  ): Promise<readonly AdminResolutionSettlementSnapshot[]> {
    return (this.settlementIdsByCase.get(adminResolutionCaseRef) ?? [])
      .map((id) => this.settlements.get(id))
      .filter((entry): entry is AdminResolutionSettlementSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt));
  }

  async getCurrentAdminResolutionSettlementForCase(
    adminResolutionCaseRef: string,
  ): Promise<AdminResolutionSettlementSnapshot | null> {
    const currentId = this.currentSettlementByCase.get(adminResolutionCaseRef);
    return currentId ? (this.settlements.get(currentId) ?? null) : null;
  }

  async getCurrentAdminResolutionSettlementForTask(
    taskId: string,
  ): Promise<AdminResolutionSettlementSnapshot | null> {
    const currentId = this.currentSettlementByTask.get(taskId);
    return currentId ? (this.settlements.get(currentId) ?? null) : null;
  }

  async getAdminResolutionExperienceProjection(
    adminResolutionExperienceProjectionId: string,
  ): Promise<AdminResolutionExperienceProjectionSnapshot | null> {
    return this.projections.get(adminResolutionExperienceProjectionId) ?? null;
  }

  async saveAdminResolutionExperienceProjection(
    projection: AdminResolutionExperienceProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    let normalized = normalizeExperienceProjection(projection);
    const current = this.projections.get(normalized.adminResolutionExperienceProjectionId) ?? null;
    if (current && options?.expectedVersion === undefined) {
      if (JSON.stringify(current) === JSON.stringify(normalized)) {
        return;
      }
      if (current.version >= normalized.version) {
        normalized = {
          ...normalized,
          version: current.version + 1,
        };
      }
    }
    saveWithCas(
      this.projections,
      normalized.adminResolutionExperienceProjectionId,
      normalized,
      options,
    );
    const existing = this.projectionIdsByCase.get(normalized.adminResolutionCaseRef) ?? [];
    if (!existing.includes(normalized.adminResolutionExperienceProjectionId)) {
      this.projectionIdsByCase.set(normalized.adminResolutionCaseRef, [
        ...existing,
        normalized.adminResolutionExperienceProjectionId,
      ]);
    }
    const currentCaseId = this.currentProjectionByCase.get(normalized.adminResolutionCaseRef);
    const currentCase =
      currentCaseId ? this.projections.get(currentCaseId) ?? null : null;
    if (currentCase === null || compareIso(currentCase.computedAt, normalized.computedAt) <= 0) {
      this.currentProjectionByCase.set(
        normalized.adminResolutionCaseRef,
        normalized.adminResolutionExperienceProjectionId,
      );
    }
    const currentTaskId = this.currentProjectionByTask.get(normalized.taskId);
    const currentTask =
      currentTaskId ? this.projections.get(currentTaskId) ?? null : null;
    if (currentTask === null || compareIso(currentTask.computedAt, normalized.computedAt) <= 0) {
      this.currentProjectionByTask.set(
        normalized.taskId,
        normalized.adminResolutionExperienceProjectionId,
      );
    }
  }

  async listAdminResolutionExperienceProjectionsForCase(
    adminResolutionCaseRef: string,
  ): Promise<readonly AdminResolutionExperienceProjectionSnapshot[]> {
    return (this.projectionIdsByCase.get(adminResolutionCaseRef) ?? [])
      .map((id) => this.projections.get(id))
      .filter((entry): entry is AdminResolutionExperienceProjectionSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.computedAt, right.computedAt));
  }

  async getCurrentAdminResolutionExperienceProjectionForCase(
    adminResolutionCaseRef: string,
  ): Promise<AdminResolutionExperienceProjectionSnapshot | null> {
    const currentId = this.currentProjectionByCase.get(adminResolutionCaseRef);
    return currentId ? (this.projections.get(currentId) ?? null) : null;
  }

  async getCurrentAdminResolutionExperienceProjectionForTask(
    taskId: string,
  ): Promise<AdminResolutionExperienceProjectionSnapshot | null> {
    const currentId = this.currentProjectionByTask.get(taskId);
    return currentId ? (this.projections.get(currentId) ?? null) : null;
  }

  async getAdminResolutionCrossDomainReentry(
    adminResolutionCrossDomainReentryId: string,
  ): Promise<AdminResolutionCrossDomainReentrySnapshot | null> {
    return this.reentries.get(adminResolutionCrossDomainReentryId) ?? null;
  }

  async saveAdminResolutionCrossDomainReentry(
    reentry: AdminResolutionCrossDomainReentrySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const normalized = normalizeCrossDomainReentry(reentry);
    saveWithCas(
      this.reentries,
      normalized.adminResolutionCrossDomainReentryId,
      normalized,
      options,
    );
    const existing = this.reentryIdsByCase.get(normalized.adminResolutionCaseRef) ?? [];
    if (!existing.includes(normalized.adminResolutionCrossDomainReentryId)) {
      this.reentryIdsByCase.set(normalized.adminResolutionCaseRef, [
        ...existing,
        normalized.adminResolutionCrossDomainReentryId,
      ]);
    }
    const currentCaseId = this.currentReentryByCase.get(normalized.adminResolutionCaseRef);
    const currentCase = currentCaseId ? this.reentries.get(currentCaseId) ?? null : null;
    if (currentCase === null || compareIso(currentCase.createdAt, normalized.createdAt) <= 0) {
      this.currentReentryByCase.set(
        normalized.adminResolutionCaseRef,
        normalized.adminResolutionCrossDomainReentryId,
      );
    }
    const currentTaskId = this.currentReentryByTask.get(normalized.taskId);
    const currentTask = currentTaskId ? this.reentries.get(currentTaskId) ?? null : null;
    if (currentTask === null || compareIso(currentTask.createdAt, normalized.createdAt) <= 0) {
      this.currentReentryByTask.set(
        normalized.taskId,
        normalized.adminResolutionCrossDomainReentryId,
      );
    }
  }

  async listAdminResolutionCrossDomainReentriesForCase(
    adminResolutionCaseRef: string,
  ): Promise<readonly AdminResolutionCrossDomainReentrySnapshot[]> {
    return (this.reentryIdsByCase.get(adminResolutionCaseRef) ?? [])
      .map((id) => this.reentries.get(id))
      .filter((entry): entry is AdminResolutionCrossDomainReentrySnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async getCurrentAdminResolutionCrossDomainReentryForCase(
    adminResolutionCaseRef: string,
  ): Promise<AdminResolutionCrossDomainReentrySnapshot | null> {
    const currentId = this.currentReentryByCase.get(adminResolutionCaseRef);
    return currentId ? (this.reentries.get(currentId) ?? null) : null;
  }

  async getCurrentAdminResolutionCrossDomainReentryForTask(
    taskId: string,
  ): Promise<AdminResolutionCrossDomainReentrySnapshot | null> {
    const currentId = this.currentReentryByTask.get(taskId);
    return currentId ? (this.reentries.get(currentId) ?? null) : null;
  }
}

export class AdminResolutionStaleTupleGuard {
  evaluate(options: {
    currentCaseRef: string;
    currentCaseBoundaryDecisionRef: string;
    currentCaseBoundaryTupleHash: string;
    currentCaseDecisionEpochRef: string;
    currentCaseLineageFenceEpoch: number;
    presentedBoundaryTupleHash?: string | null;
    presentedDecisionEpochRef?: string | null;
    presentedDependencySetRef?: string | null;
    presentedCompletionArtifactRef?: string | null;
    presentedLineageFenceEpoch?: number | null;
    liveTuple: AdminResolutionLiveTupleSnapshot;
  }): AdminResolutionStaleTupleEvaluation {
    const staleReasons = new Set<string>();
    const liveReasons = new Set<string>();
    const liveTuple = options.liveTuple;

    const currentBoundaryDecisionRef = optionalRef(liveTuple.currentBoundaryDecisionRef);
    if (currentBoundaryDecisionRef !== options.currentCaseBoundaryDecisionRef) {
      liveReasons.add("boundary_decision_drift");
    }
    if (optionalRef(liveTuple.currentBoundaryTupleHash) !== options.currentCaseBoundaryTupleHash) {
      liveReasons.add("boundary_tuple_drift");
    }
    if (optionalRef(liveTuple.currentDecisionEpochRef) !== options.currentCaseDecisionEpochRef) {
      liveReasons.add("decision_epoch_drift");
    }
    if (
      liveTuple.currentLineageFenceEpoch !== null &&
      liveTuple.currentLineageFenceEpoch !== options.currentCaseLineageFenceEpoch
    ) {
      liveReasons.add("lineage_fence_drift");
    }
    if (optionalRef(options.presentedBoundaryTupleHash) !== null) {
      if (options.presentedBoundaryTupleHash !== optionalRef(liveTuple.currentBoundaryTupleHash)) {
        staleReasons.add("presented_boundary_tuple_hash_drift");
      }
    }
    if (optionalRef(options.presentedDecisionEpochRef) !== null) {
      if (options.presentedDecisionEpochRef !== optionalRef(liveTuple.currentDecisionEpochRef)) {
        staleReasons.add("presented_decision_epoch_drift");
      }
    }
    if (optionalRef(options.presentedDependencySetRef) !== null) {
      if (options.presentedDependencySetRef !== optionalRef(liveTuple.currentDependencySetRef)) {
        staleReasons.add("presented_dependency_set_drift");
      }
    }
    if (optionalRef(options.presentedCompletionArtifactRef) !== null) {
      if (
        options.presentedCompletionArtifactRef !== optionalRef(liveTuple.currentCompletionArtifactRef)
      ) {
        staleReasons.add("presented_completion_artifact_drift");
      }
    }
    if (options.presentedLineageFenceEpoch !== null && options.presentedLineageFenceEpoch !== undefined) {
      if (options.presentedLineageFenceEpoch !== liveTuple.currentLineageFenceEpoch) {
        staleReasons.add("presented_lineage_fence_drift");
      }
    }
    if (liveTuple.currentBoundaryState !== "live") {
      liveReasons.add("boundary_state_not_live");
    }
    if (liveTuple.currentClinicalMeaningState !== "bounded_admin_only") {
      liveReasons.add("clinical_meaning_not_bounded_admin_only");
    }
    if (liveTuple.currentOperationalFollowUpScope !== "bounded_admin_resolution") {
      liveReasons.add("operational_follow_up_scope_not_bounded_admin_resolution");
    }
    if (liveTuple.currentAdminMutationAuthorityState !== "bounded_admin_only") {
      liveReasons.add("admin_mutation_authority_not_bounded");
    }
    if (optionalRef(liveTuple.currentDecisionSupersessionRecordRef) !== null) {
      liveReasons.add("decision_superseded");
    }
    if (liveTuple.currentReopenState !== "stable") {
      liveReasons.add("boundary_reopen_not_stable");
    }
    if (!liveTuple.canContinueCurrentConsequence) {
      liveReasons.add("dependency_can_no_longer_continue_current_consequence");
    }
    if (
      optionalRef(liveTuple.currentDependencyReopenState) !== null &&
      liveTuple.currentDependencyReopenState !== "stable"
    ) {
      liveReasons.add("dependency_reopen_not_stable");
    }

    return {
      stale: staleReasons.size > 0,
      staleReasonCodeRefs: uniqueSorted([...staleReasons]),
      liveTupleIllegal: liveReasons.size > 0,
      liveTupleReasonCodeRefs: uniqueSorted([...liveReasons]),
    };
  }
}

export class AdminResolutionReentryResolver {
  resolve(options: {
    settlement: Pick<
      AdminResolutionSettlementSnapshot,
      | "result"
      | "taskId"
      | "adminResolutionCaseRef"
      | "boundaryDecisionRef"
      | "boundaryTupleHash"
      | "decisionEpochRef"
      | "dependencySetRef"
      | "recoveryRouteRef"
    >;
    liveTuple: Pick<
      AdminResolutionLiveTupleSnapshot,
      | "currentClinicalMeaningState"
      | "currentBoundaryState"
      | "currentReopenState"
      | "currentDependencyReopenState"
      | "currentDependencySetRef"
      | "canContinueCurrentConsequence"
    >;
    reasonCodeRefs: readonly string[];
    dominantRecoveryRouteRef?: string | null;
    dominantBlockerRef?: string | null;
  }): AdminResolutionReentryResolution {
    const reasonCodeRefs = uniqueSorted(options.reasonCodeRefs);
    const dominantRecoveryRouteRef =
      optionalRef(options.dominantRecoveryRouteRef) ?? options.settlement.recoveryRouteRef;
    const blocker = optionalRef(options.dominantBlockerRef);

    if (
      options.liveTuple.currentClinicalMeaningState !== "bounded_admin_only" ||
      options.liveTuple.currentBoundaryState !== "live" ||
      options.liveTuple.currentReopenState === "reopened" ||
      options.liveTuple.currentReopenState === "blocked_pending_review" ||
      options.liveTuple.currentDependencyReopenState === "reopen_required" ||
      options.liveTuple.currentDependencyReopenState === "reopened" ||
      options.liveTuple.currentDependencyReopenState === "blocked_pending_review"
    ) {
      return {
        destination:
          options.settlement.result === "reopened_for_review"
            ? "clinician_review"
            : "triage_review",
        resolverMode: "reopen_launch",
        reasonClass:
          options.liveTuple.currentReopenState === "reopened" ||
          options.liveTuple.currentBoundaryState !== "live"
            ? "boundary_reopened"
            : "clinical_reentry",
        causalReasonCodeRefs: uniqueSorted([...reasonCodeRefs, "reentry_requires_governed_review"]),
        preserveSupersededProvenance: true,
        continuityHintRef: "continuity_hint.same_shell_reopen_launch",
        recoveryRouteRef: dominantRecoveryRouteRef,
      };
    }

    if (blocker?.includes("identity")) {
      return {
        destination: "identity_repair",
        resolverMode: "repair_route_only",
        reasonClass: "identity_repair",
        causalReasonCodeRefs: uniqueSorted([...reasonCodeRefs, "identity_repair_active"]),
        preserveSupersededProvenance: true,
        continuityHintRef: "continuity_hint.identity_repair_recovery",
        recoveryRouteRef: dominantRecoveryRouteRef,
      };
    }

    if (blocker?.includes("reachability") || blocker?.includes("contact_route")) {
      return {
        destination: "contact_route_repair",
        resolverMode: "repair_route_only",
        reasonClass: "reachability_repair",
        causalReasonCodeRefs: uniqueSorted([...reasonCodeRefs, "contact_route_repair_required"]),
        preserveSupersededProvenance: true,
        continuityHintRef: "continuity_hint.contact_route_repair",
        recoveryRouteRef: dominantRecoveryRouteRef,
      };
    }

    if (blocker?.includes("consent")) {
      return {
        destination: "consent_repair",
        resolverMode: "repair_route_only",
        reasonClass: "consent_repair",
        causalReasonCodeRefs: uniqueSorted([...reasonCodeRefs, "consent_checkpoint_required"]),
        preserveSupersededProvenance: true,
        continuityHintRef: "continuity_hint.consent_checkpoint_repair",
        recoveryRouteRef: dominantRecoveryRouteRef,
      };
    }

    if (blocker?.includes("external_confirmation")) {
      return {
        destination: "external_confirmation",
        resolverMode: "repair_route_only",
        reasonClass: "external_confirmation",
        causalReasonCodeRefs: uniqueSorted([...reasonCodeRefs, "external_confirmation_pending"]),
        preserveSupersededProvenance: true,
        continuityHintRef: "continuity_hint.external_confirmation",
        recoveryRouteRef: dominantRecoveryRouteRef,
      };
    }

    return {
      destination: "bounded_admin_resume",
      resolverMode: "same_shell_recovery",
      reasonClass: "stale_tuple",
      causalReasonCodeRefs: uniqueSorted([...reasonCodeRefs, "bounded_admin_same_shell_recovery"]),
      preserveSupersededProvenance: true,
      continuityHintRef: "continuity_hint.same_shell_admin_recovery",
      recoveryRouteRef: dominantRecoveryRouteRef,
    };
  }
}

export class AdminResolutionProjectionReconciler {
  reconcile(options: {
    settlement: AdminResolutionSettlementSnapshot;
    liveTuple: AdminResolutionLiveTupleSnapshot;
    reentry: AdminResolutionCrossDomainReentrySnapshot | null;
    computedAt: string;
  }): AdminResolutionExperienceProjectionSnapshot {
    const settlement = options.settlement;
    const reentry = options.reentry;
    const computedAt = ensureIsoTimestamp(options.computedAt, "computedAt");
    const projectionState: AdminResolutionProjectionState =
      settlement.result === "queued" &&
      settlement.trustState === "trusted" &&
      settlement.reopenState === "stable"
        ? "fresh"
        : settlement.result === "stale_recoverable"
          ? "stale"
          : "recovery_required";

    return {
      adminResolutionExperienceProjectionId: `admin_resolution_experience_projection_${stableReviewDigest({
        taskId: settlement.taskId,
        settlementId: settlement.adminResolutionSettlementId,
        result: settlement.result,
      })}`,
      taskId: settlement.taskId,
      adminResolutionCaseRef: settlement.adminResolutionCaseRef,
      boundaryDecisionRef: settlement.boundaryDecisionRef,
      boundaryTupleHash: settlement.boundaryTupleHash,
      decisionEpochRef: settlement.decisionEpochRef,
      currentSettlementRef: settlement.adminResolutionSettlementId,
      completionArtifactRef: settlement.completionArtifactRef,
      dependencySetRef: settlement.dependencySetRef,
      releaseWatchRef: settlement.releaseWatchRef,
      patientShellConsistencyProjectionRef:
        options.liveTuple.currentPatientShellConsistencyProjectionRef,
      patientEmbeddedSessionProjectionRef:
        options.liveTuple.currentPatientEmbeddedSessionProjectionRef,
      staffWorkspaceConsistencyProjectionRef:
        options.liveTuple.currentStaffWorkspaceConsistencyProjectionRef,
      workspaceSliceTrustProjectionRef:
        options.liveTuple.currentWorkspaceSliceTrustProjectionRef,
      consistencyProjectionRef: options.liveTuple.currentConsistencyProjectionRef,
      visibilityPolicyRef: options.liveTuple.currentVisibilityPolicyRef,
      bundleVersion: "254.phase3.admin-resolution-settlement-and-reentry.v1",
      audienceTier: options.liveTuple.currentAudienceTier,
      routeFamilyRef: options.liveTuple.currentRouteFamilyRef,
      surfaceRouteContractRef: settlement.surfaceRouteContractRef,
      surfacePublicationRef: settlement.surfacePublicationRef,
      runtimePublicationBundleRef: settlement.runtimePublicationBundleRef,
      transitionEnvelopeRef: options.liveTuple.currentTransitionEnvelopeRef,
      selectedAnchorRef: settlement.selectedAnchorRef,
      clinicalMeaningState: settlement.clinicalMeaningState,
      operationalFollowUpScope: settlement.operationalFollowUpScope,
      adminMutationAuthorityState:
        settlement.result === "completed" ||
        settlement.result === "patient_notified" ||
        settlement.result === "waiting_dependency" ||
        settlement.result === "queued"
          ? "bounded_admin_only"
          : "frozen",
      boundaryReopenState:
        settlement.result === "reopened_for_review"
          ? "reopened"
          : settlement.result === "blocked_pending_safety"
            ? "blocked_pending_review"
            : settlement.reopenState,
      releaseState: options.liveTuple.currentReleaseState,
      trustState: settlement.trustState,
      visibilityTier: settlement.visibilityTier,
      summarySafetyTier: settlement.summarySafetyTier,
      placeholderContractRef: settlement.placeholderContractRef,
      routeFreezeDispositionRef: settlement.recoveryDispositionRef,
      dominantNextActionRef:
        reentry?.destination
          ? `dominant_next_action.${reentry.destination}`
          : settlement.result === "completed"
            ? "dominant_next_action.next_task_launch"
            : settlement.result === "waiting_dependency"
              ? "dominant_next_action.waiting_dependency"
              : settlement.result === "patient_notified"
                ? "dominant_next_action.patient_visibility_monitor"
                : "dominant_next_action.review_admin_settlement",
      projectionState,
      computedAt,
      version: 1,
    };
  }
}

export interface Phase3AdminResolutionSettlementKernelService {
  readonly transitionGuardTable: typeof adminResolutionTransitionGuardTable;
  readonly staleTupleGuard: AdminResolutionStaleTupleGuard;
  readonly reentryResolver: AdminResolutionReentryResolver;
  readonly projectionReconciler: AdminResolutionProjectionReconciler;
  queryTaskBundle(taskId: string): Promise<Phase3AdminResolutionSettlementBundle>;
  recordAdminResolutionSettlement(
    input: AdminResolutionSettlementMutationInput,
  ): Promise<AdminResolutionSettlementMutationResult>;
  resolveAdminCrossDomainReentry(
    input: ResolveAdminCrossDomainReentryInput,
  ): Promise<AdminResolutionCrossDomainReentrySnapshot>;
}

class Phase3AdminResolutionSettlementKernelServiceImpl
  implements Phase3AdminResolutionSettlementKernelService
{
  readonly transitionGuardTable = adminResolutionTransitionGuardTable;
  readonly staleTupleGuard = new AdminResolutionStaleTupleGuard();
  readonly reentryResolver = new AdminResolutionReentryResolver();
  readonly projectionReconciler = new AdminResolutionProjectionReconciler();
  private readonly inflightMutationByKey = new Map<
    string,
    Promise<AdminResolutionSettlementMutationResult>
  >();

  constructor(
    private readonly repositories: Phase3AdminResolutionSettlementRepositories,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  async queryTaskBundle(taskId: string): Promise<Phase3AdminResolutionSettlementBundle> {
    const currentSettlement =
      await this.repositories.getCurrentAdminResolutionSettlementForTask(requireRef(taskId, "taskId"));
    if (!currentSettlement) {
      return {
        currentActionRecord: null,
        currentSettlement: null,
        currentExperienceProjection: null,
        currentCrossDomainReentry: null,
        actionRecords: [],
        settlements: [],
        experienceProjections: [],
        crossDomainReentries: [],
      };
    }
    const actionRecords = await this.repositories.listAdminResolutionActionRecordsForCase(
      currentSettlement.adminResolutionCaseRef,
    );
    const settlements = await this.repositories.listAdminResolutionSettlementsForCase(
      currentSettlement.adminResolutionCaseRef,
    );
    const experienceProjections =
      await this.repositories.listAdminResolutionExperienceProjectionsForCase(
        currentSettlement.adminResolutionCaseRef,
      );
    const crossDomainReentries =
      await this.repositories.listAdminResolutionCrossDomainReentriesForCase(
        currentSettlement.adminResolutionCaseRef,
      );
    return {
      currentActionRecord:
        (await this.repositories.getCurrentAdminResolutionActionRecordForCase(
          currentSettlement.adminResolutionCaseRef,
        )) ?? null,
      currentSettlement,
      currentExperienceProjection:
        (await this.repositories.getCurrentAdminResolutionExperienceProjectionForTask(taskId)) ?? null,
      currentCrossDomainReentry:
        (await this.repositories.getCurrentAdminResolutionCrossDomainReentryForTask(taskId)) ?? null,
      actionRecords,
      settlements,
      experienceProjections,
      crossDomainReentries,
    };
  }

  async recordAdminResolutionSettlement(
    input: AdminResolutionSettlementMutationInput,
  ): Promise<AdminResolutionSettlementMutationResult> {
    const adminResolutionCaseRef = requireRef(input.adminResolutionCaseRef, "adminResolutionCaseRef");
    const liveTuple = input.liveTuple;
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const actionType = input.actionType;
    invariant(
      actionTypes.includes(actionType),
      "INVALID_ADMIN_RESOLUTION_MUTATION_ACTION_TYPE",
      "Unsupported settlement action type.",
    );
    invariant(
      settlementResults.includes(input.desiredResult),
      "INVALID_ADMIN_RESOLUTION_MUTATION_RESULT",
      "Unsupported desired settlement result.",
    );

    const staleTupleEvaluation = this.staleTupleGuard.evaluate({
      currentCaseRef: adminResolutionCaseRef,
      currentCaseBoundaryDecisionRef: requireRef(
        input.caseBoundaryDecisionRef,
        "caseBoundaryDecisionRef",
      ),
      currentCaseBoundaryTupleHash: requireRef(input.caseBoundaryTupleHash, "caseBoundaryTupleHash"),
      currentCaseDecisionEpochRef: requireRef(input.caseDecisionEpochRef, "caseDecisionEpochRef"),
      currentCaseLineageFenceEpoch: ensurePositiveInteger(
        input.caseLineageFenceEpoch,
        "caseLineageFenceEpoch",
      ),
      presentedBoundaryTupleHash: input.presentedBoundaryTupleHash,
      presentedDecisionEpochRef: input.presentedDecisionEpochRef,
      presentedDependencySetRef: input.presentedDependencySetRef,
      presentedCompletionArtifactRef: input.presentedCompletionArtifactRef,
      presentedLineageFenceEpoch: input.presentedLineageFenceEpoch,
      liveTuple,
    });

    const reasonCodeRefs = uniqueSorted([
      ...(input.reasonCodeRefs ?? []),
      ...staleTupleEvaluation.staleReasonCodeRefs,
      ...staleTupleEvaluation.liveTupleReasonCodeRefs,
    ]);

    const desiredResult = staleTupleEvaluation.stale
      ? "stale_recoverable"
      : input.desiredResult;
    const transitionRule = this.transitionGuardTable[desiredResult];
    const currentSettlement =
      await this.repositories.getCurrentAdminResolutionSettlementForCase(adminResolutionCaseRef);
    const predecessor = currentSettlement?.result ?? "none";
    invariant(
      transitionRule.allowedPredecessors.includes(predecessor),
      "ILLEGAL_ADMIN_RESOLUTION_SETTLEMENT_TRANSITION",
      `Cannot transition admin settlement from ${predecessor} to ${desiredResult}.`,
    );

    const completionArtifactRef =
      optionalRef(input.completionArtifactRef) ?? optionalRef(liveTuple.currentCompletionArtifactRef);
    const patientExpectationTemplateRef =
      optionalRef(input.patientExpectationTemplateRef) ??
      optionalRef(liveTuple.currentPatientExpectationTemplateRef);

    if (transitionRule.requiresStableTuple) {
      invariant(
        !staleTupleEvaluation.liveTupleIllegal,
        "ADMIN_RESOLUTION_SETTLEMENT_TUPLE_ILLEGAL",
        "Admin settlement requires the live bounded-admin tuple to remain stable and legal.",
      );
    }
    if (transitionRule.requiresCompletionArtifact) {
      invariant(
        completionArtifactRef !== null,
        "ADMIN_RESOLUTION_COMPLETION_ARTIFACT_REQUIRED",
        "AdminResolutionSettlement.result=completed requires a current completion artifact.",
      );
    }
    if (transitionRule.requiresExpectationTemplate) {
      invariant(
        patientExpectationTemplateRef !== null,
        "ADMIN_RESOLUTION_EXPECTATION_TEMPLATE_REQUIRED",
        "AdminResolutionSettlement.result=completed requires a patient expectation template binding.",
      );
    }
    if (desiredResult === "waiting_dependency") {
      invariant(
        reasonCodeRefs.some((reason) => reason.includes("waiting") || reason.includes("dependency")),
        "ADMIN_RESOLUTION_WAITING_REASON_REQUIRED",
        "AdminResolutionSettlement.result=waiting_dependency requires waiting posture provenance.",
      );
    }

    const idempotencyKey = stableReviewDigest({
      adminResolutionCaseRef,
      actionType,
      desiredResult,
      boundaryTupleHash: liveTuple.currentBoundaryTupleHash,
      decisionEpochRef: liveTuple.currentDecisionEpochRef,
      dependencySetRef: liveTuple.currentDependencySetRef,
      completionArtifactRef,
      patientExpectationTemplateRef,
      reasonCodeRefs,
    });
    const mutationKey = `${adminResolutionCaseRef}:${idempotencyKey}`;
    const inflight = this.inflightMutationByKey.get(mutationKey);
    if (inflight) {
      return inflight;
    }

    const mutationPromise = this.recordAdminResolutionSettlementUnderLock({
      adminResolutionCaseRef,
      liveTuple,
      recordedAt,
      actionType,
      desiredResult,
      input,
      staleTupleEvaluation,
      reasonCodeRefs,
      completionArtifactRef,
      patientExpectationTemplateRef,
      idempotencyKey,
    });
    this.inflightMutationByKey.set(mutationKey, mutationPromise);
    try {
      return await mutationPromise;
    } finally {
      if (this.inflightMutationByKey.get(mutationKey) === mutationPromise) {
        this.inflightMutationByKey.delete(mutationKey);
      }
    }
  }

  private async recordAdminResolutionSettlementUnderLock(options: {
    adminResolutionCaseRef: string;
    liveTuple: AdminResolutionLiveTupleSnapshot;
    recordedAt: string;
    actionType: AdminResolutionSettlementActionType;
    desiredResult: AdminResolutionSettlementResult;
    input: AdminResolutionSettlementMutationInput;
    staleTupleEvaluation: AdminResolutionStaleTupleEvaluation;
    reasonCodeRefs: readonly string[];
    completionArtifactRef: string | null;
    patientExpectationTemplateRef: string | null;
    idempotencyKey: string;
  }): Promise<AdminResolutionSettlementMutationResult> {
    const {
      adminResolutionCaseRef,
      liveTuple,
      recordedAt,
      actionType,
      desiredResult,
      input,
      staleTupleEvaluation,
      reasonCodeRefs,
      completionArtifactRef,
      patientExpectationTemplateRef,
      idempotencyKey,
    } = options;
    const currentSettlement =
      await this.repositories.getCurrentAdminResolutionSettlementForCase(adminResolutionCaseRef);
    const existingAction = await this.repositories.getActionRecordByCaseAndIdempotencyKey(
      adminResolutionCaseRef,
      idempotencyKey,
    );
    if (existingAction) {
      const existingSettlement = await this.repositories.getSettlementByActionRecord(
        existingAction.adminResolutionActionRecordId,
      );
      if (existingSettlement) {
        const replayBundle = await this.queryTaskBundle(existingSettlement.taskId);
        return {
          ...replayBundle,
          actionRecord: existingAction,
          settlement: existingSettlement,
          experienceProjection:
            (await this.repositories.getCurrentAdminResolutionExperienceProjectionForCase(
              adminResolutionCaseRef,
            )) ??
            this.projectionReconciler.reconcile({
              settlement: existingSettlement,
              liveTuple,
              reentry:
                (await this.repositories.getCurrentAdminResolutionCrossDomainReentryForCase(
                  adminResolutionCaseRef,
                )) ?? null,
              computedAt: existingSettlement.recordedAt,
            }),
          replayedExisting: true,
          staleTupleEvaluation,
        };
      }
    }

    const actionRecordId = nextId(this.idGenerator, "admin_resolution_action_record");
    const actionRecord: AdminResolutionActionRecordSnapshot = {
      adminResolutionActionRecordId: actionRecordId,
      taskId: requireRef(liveTuple.taskId, "taskId"),
      adminResolutionCaseRef,
      boundaryDecisionRef: requireRef(liveTuple.currentBoundaryDecisionRef, "currentBoundaryDecisionRef"),
      boundaryTupleHash: requireRef(liveTuple.currentBoundaryTupleHash, "currentBoundaryTupleHash"),
      clinicalMeaningState: requireRef(
        liveTuple.currentClinicalMeaningState,
        "currentClinicalMeaningState",
      ),
      operationalFollowUpScope: requireRef(
        liveTuple.currentOperationalFollowUpScope,
        "currentOperationalFollowUpScope",
      ),
      decisionEpochRef: requireRef(liveTuple.currentDecisionEpochRef, "currentDecisionEpochRef"),
      decisionSupersessionRecordRef: optionalRef(
        liveTuple.currentDecisionSupersessionRecordRef,
      ),
      actionType,
      routeIntentBindingRef: requireRef(
        liveTuple.currentRouteIntentBindingRef,
        "currentRouteIntentBindingRef",
      ),
      reviewActionLeaseRef: requireRef(
        liveTuple.currentReviewActionLeaseRef,
        "currentReviewActionLeaseRef",
      ),
      reviewActionOwnershipEpochRef: requireRef(
        liveTuple.currentReviewActionOwnershipEpochRef,
        "currentReviewActionOwnershipEpochRef",
      ),
      reviewActionFencingToken: requireRef(
        liveTuple.currentReviewActionFencingToken,
        "currentReviewActionFencingToken",
      ),
      workspaceConsistencyProjectionRef: requireRef(
        liveTuple.currentWorkspaceConsistencyProjectionRef,
        "currentWorkspaceConsistencyProjectionRef",
      ),
      workspaceTrustProjectionRef: requireRef(
        liveTuple.currentWorkspaceTrustProjectionRef,
        "currentWorkspaceTrustProjectionRef",
      ),
      commandActionRef: requireRef(liveTuple.currentCommandActionRef, "currentCommandActionRef"),
      policyBundleRef: requireRef(input.policyBundleRef, "policyBundleRef"),
      releaseApprovalFreezeRef: requireRef(
        liveTuple.currentReleaseApprovalFreezeRef,
        "currentReleaseApprovalFreezeRef",
      ),
      channelReleaseFreezeRef: requireRef(
        liveTuple.currentChannelReleaseFreezeRef,
        "currentChannelReleaseFreezeRef",
      ),
      surfaceRouteContractRef: requireRef(
        liveTuple.currentSurfaceRouteContractRef,
        "currentSurfaceRouteContractRef",
      ),
      surfacePublicationRef: requireRef(
        liveTuple.currentSurfacePublicationRef,
        "currentSurfacePublicationRef",
      ),
      runtimePublicationBundleRef: requireRef(
        liveTuple.currentRuntimePublicationBundleRef,
        "currentRuntimePublicationBundleRef",
      ),
      lineageFenceEpoch: ensurePositiveInteger(
        liveTuple.currentLineageFenceEpoch ?? 1,
        "currentLineageFenceEpoch",
      ),
      reasonCodeRefs,
      idempotencyKey,
      createdByRef: requireRef(input.actorRef, "actorRef"),
      createdAt: recordedAt,
      settledAt: recordedAt,
      version: 1,
    };
    await this.repositories.saveAdminResolutionActionRecord(actionRecord);

    const settlementRevision = (currentSettlement?.settlementRevision ?? 0) + 1;
    const settlement: AdminResolutionSettlementSnapshot = {
      adminResolutionSettlementId: nextId(this.idGenerator, "admin_resolution_settlement"),
      taskId: actionRecord.taskId,
      adminResolutionCaseRef,
      adminResolutionActionRecordRef: actionRecord.adminResolutionActionRecordId,
      boundaryDecisionRef: actionRecord.boundaryDecisionRef,
      boundaryTupleHash: actionRecord.boundaryTupleHash,
      clinicalMeaningState: actionRecord.clinicalMeaningState,
      operationalFollowUpScope: actionRecord.operationalFollowUpScope,
      decisionEpochRef: actionRecord.decisionEpochRef,
      decisionSupersessionRecordRef: actionRecord.decisionSupersessionRecordRef,
      commandSettlementRef: requireRef(
        liveTuple.currentCommandSettlementRef,
        "currentCommandSettlementRef",
      ),
      transitionEnvelopeRef: requireRef(
        liveTuple.currentTransitionEnvelopeRef,
        "currentTransitionEnvelopeRef",
      ),
      taskCompletionSettlementEnvelopeRef: requireRef(
        liveTuple.currentTaskCompletionSettlementEnvelopeRef,
        "currentTaskCompletionSettlementEnvelopeRef",
      ),
      surfaceRouteContractRef: actionRecord.surfaceRouteContractRef,
      surfacePublicationRef: actionRecord.surfacePublicationRef,
      runtimePublicationBundleRef: actionRecord.runtimePublicationBundleRef,
      dependencySetRef: requireRef(liveTuple.currentDependencySetRef, "currentDependencySetRef"),
      releaseWatchRef: requireRef(liveTuple.currentReleaseWatchRef, "currentReleaseWatchRef"),
      reopenState: requireRef(liveTuple.currentReopenState ?? "stable", "currentReopenState"),
      result: desiredResult,
      trustState: liveTuple.currentTrustState,
      completionArtifactRef,
      patientExpectationTemplateRef,
      recoveryDispositionRef: this.deriveRecoveryDispositionRef(desiredResult),
      visibilityTier: requireRef(liveTuple.currentVisibilityTier, "currentVisibilityTier"),
      summarySafetyTier: requireRef(
        liveTuple.currentSummarySafetyTier,
        "currentSummarySafetyTier",
      ),
      placeholderContractRef: requireRef(
        liveTuple.currentPlaceholderContractRef,
        "currentPlaceholderContractRef",
      ),
      recoveryRouteRef: this.deriveRecoveryRouteRef(desiredResult, liveTuple),
      selectedAnchorRef: requireRef(liveTuple.currentSelectedAnchorRef, "currentSelectedAnchorRef"),
      lineageFenceEpoch: actionRecord.lineageFenceEpoch,
      reasonCodeRefs,
      settlementRevision,
      recordedAt,
      version: 1,
    };
    await this.repositories.saveAdminResolutionSettlement(settlement);

    const currentReentry =
      await this.repositories.getCurrentAdminResolutionCrossDomainReentryForCase(
        adminResolutionCaseRef,
      );
    const experienceProjection = this.projectionReconciler.reconcile({
      settlement,
      liveTuple,
      reentry: currentReentry,
      computedAt: recordedAt,
    });
    await this.repositories.saveAdminResolutionExperienceProjection(experienceProjection);

    const bundle = await this.queryTaskBundle(settlement.taskId);
    return {
      ...bundle,
      actionRecord,
      settlement,
      experienceProjection,
      replayedExisting: false,
      staleTupleEvaluation,
    };
  }

  async resolveAdminCrossDomainReentry(
    input: ResolveAdminCrossDomainReentryInput,
  ): Promise<AdminResolutionCrossDomainReentrySnapshot> {
    invariant(
      reentryDestinations.includes(input.destination),
      "INVALID_ADMIN_RESOLUTION_REENTRY_DESTINATION",
      "Unsupported reentry destination.",
    );
    invariant(
      reentryModes.includes(input.resolverMode),
      "INVALID_ADMIN_RESOLUTION_REENTRY_MODE",
      "Unsupported reentry resolver mode.",
    );
    invariant(
      reentryReasonClasses.includes(input.reasonClass),
      "INVALID_ADMIN_RESOLUTION_REENTRY_REASON_CLASS",
      "Unsupported reentry reason class.",
    );
    const createdAt = ensureIsoTimestamp(input.createdAt, "createdAt");
    const settlement = await this.repositories.getAdminResolutionSettlement(
      requireRef(input.originatingSettlementRef, "originatingSettlementRef"),
    );
    invariant(
      settlement,
      "ADMIN_RESOLUTION_SETTLEMENT_NOT_FOUND",
      `AdminResolutionSettlement ${input.originatingSettlementRef} is required before resolving re-entry.`,
    );
    const snapshot: AdminResolutionCrossDomainReentrySnapshot = {
      adminResolutionCrossDomainReentryId: nextId(
        this.idGenerator,
        "admin_resolution_cross_domain_reentry",
      ),
      taskId: settlement.taskId,
      adminResolutionCaseRef: requireRef(input.adminResolutionCaseRef, "adminResolutionCaseRef"),
      originatingSettlementRef: requireRef(
        input.originatingSettlementRef,
        "originatingSettlementRef",
      ),
      boundaryDecisionRef: requireRef(input.boundaryDecisionRef, "boundaryDecisionRef"),
      boundaryTupleHash: requireRef(input.boundaryTupleHash, "boundaryTupleHash"),
      decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
      dependencySetRef: requireRef(input.dependencySetRef, "dependencySetRef"),
      destination: input.destination,
      resolverMode: input.resolverMode,
      reasonClass: input.reasonClass,
      causalReasonCodeRefs: uniqueSorted(input.causalReasonCodeRefs),
      preserveSupersededProvenance: input.preserveSupersededProvenance,
      createdGovernedArtifactRef: optionalRef(input.createdGovernedArtifactRef),
      reusedGovernedArtifactRef: optionalRef(input.reusedGovernedArtifactRef),
      continuityHintRef: requireRef(input.continuityHintRef, "continuityHintRef"),
      recoveryRouteRef: requireRef(input.recoveryRouteRef, "recoveryRouteRef"),
      createdAt,
      version: 1,
    };
    await this.repositories.saveAdminResolutionCrossDomainReentry(snapshot);
    return snapshot;
  }

  private deriveRecoveryDispositionRef(result: AdminResolutionSettlementResult): string {
    switch (result) {
      case "completed":
        return "recovery_disposition.none";
      case "patient_notified":
        return "recovery_disposition.patient_follow_up_monitor";
      case "waiting_dependency":
        return "recovery_disposition.waiting_dependency_live";
      case "reopened_for_review":
        return "recovery_disposition.reopen_for_review";
      case "blocked_pending_safety":
        return "recovery_disposition.blocked_pending_safety";
      case "stale_recoverable":
        return "recovery_disposition.same_shell_stale_recoverable";
      case "queued":
      default:
        return "recovery_disposition.none";
    }
  }

  private deriveRecoveryRouteRef(
    result: AdminResolutionSettlementResult,
    liveTuple: AdminResolutionLiveTupleSnapshot,
  ): string {
    switch (result) {
      case "completed":
        return `/workspace/task/${liveTuple.taskId}`;
      case "patient_notified":
      case "waiting_dependency":
      case "queued":
        return `/workspace/task/${liveTuple.taskId}/admin-resolution`;
      case "reopened_for_review":
        return `/workspace/task/${liveTuple.taskId}/decision`;
      case "blocked_pending_safety":
        return "/workspace/changed";
      case "stale_recoverable":
      default:
        return `/workspace/task/${liveTuple.taskId}?recovery=admin_settlement`;
    }
  }
}

export function createPhase3AdminResolutionSettlementKernelStore(): Phase3AdminResolutionSettlementRepositories {
  return new InMemoryPhase3AdminResolutionSettlementStore();
}

export function createPhase3AdminResolutionSettlementKernelService(
  repositories: Phase3AdminResolutionSettlementRepositories,
  options?: { idGenerator?: BackboneIdGenerator },
): Phase3AdminResolutionSettlementKernelService {
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("phase3_admin_resolution_settlement_kernel");
  return new Phase3AdminResolutionSettlementKernelServiceImpl(repositories, idGenerator);
}
