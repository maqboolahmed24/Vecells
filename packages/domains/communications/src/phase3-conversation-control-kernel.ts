import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
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

function addMinutes(iso: string, minutes: number): string {
  const base = new Date(iso);
  invariant(!Number.isNaN(base.getTime()), "INVALID_BASE_TIMESTAMP", "Base timestamp is invalid.");
  base.setUTCMinutes(base.getUTCMinutes() + minutes);
  return base.toISOString();
}

function nextKernelId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
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

function compactRefs(values: readonly (string | null | undefined)[]): string[] {
  return [...new Set(values.map(optionalRef).filter((value): value is string => Boolean(value)))];
}

function placeholderRef(kind: string, seed: string): string {
  return `${kind}::${seed}`;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

export type ConversationTupleAvailabilityState = "authoritative" | "placeholder" | "missing";
export type ConversationPreviewVisibilityMode =
  | "full"
  | "public_safe_summary"
  | "step_up_required"
  | "suppressed_recovery_only";
export type ConversationContinuityValidationState =
  | "trusted"
  | "degraded"
  | "stale"
  | "blocked";
export type ConversationDeliveryRiskState = "on_track" | "at_risk" | "likely_failed" | "disputed";
export type ConversationAuthoritativeOutcomeState =
  | "awaiting_delivery_truth"
  | "awaiting_reply"
  | "callback_scheduled"
  | "awaiting_review"
  | "reviewed"
  | "settled"
  | "recovery_required";
export type ConversationReplyNeededState =
  | "none"
  | "reply_needed"
  | "blocked_by_repair"
  | "blocked_by_diversion"
  | "read_only";
export type ConversationAwaitingReviewState =
  | "none"
  | "awaiting_review"
  | "review_pending"
  | "blocked";
export type ConversationRepairRequiredState =
  | "none"
  | "contact_route_repair"
  | "policy_blocked"
  | "recovery_only";
export type ConversationStateConfidenceBand = "high" | "medium" | "low";
export type ConversationCommandResult =
  | "accepted_in_place"
  | "review_pending"
  | "awaiting_external"
  | "repair_required"
  | "stale_recoverable"
  | "blocked_policy"
  | "denied_scope"
  | "expired";
export type ConversationLocalAckState = "none" | "shown" | "superseded";
export type ConversationTransportState =
  | "local_only"
  | "provider_accepted"
  | "provider_rejected"
  | "timed_out";
export type ConversationExternalObservationState =
  | "unobserved"
  | "delivered"
  | "answered"
  | "failed"
  | "disputed"
  | "expired";
export type PatientComposerScope = "reply" | "acknowledgement" | "availability_update";
export type PatientComposerLeaseState = "active" | "blocked" | "resume_required" | "released";
export type PatientUrgentSurfaceState =
  | "assimilation_pending"
  | "review_pending"
  | "urgent_required"
  | "urgent_issued"
  | "manual_review_required";
export type PatientUrgentSeverityBand = "moderate" | "urgent" | "critical";

export interface ConversationTupleCompatibilitySnapshot {
  tupleId: string;
  taskId: string;
  clusterRef: string;
  threadId: string;
  subthreadRef: string;
  selectedAnchorRef: string;
  typedSubthreadRefs: readonly string[];
  latestCommunicationEnvelopeRef: string | null;
  latestReminderPlanRef: string | null;
  latestReceiptEnvelopeRef: string | null;
  latestSettlementRef: string | null;
  latestCallbackStatusRef: string | null;
  latestSupportActionSettlementRef: string | null;
  patientShellConsistencyRef: string;
  visibilityProjectionRef: string;
  visibilityTier: string;
  previewMode: ConversationPreviewVisibilityMode;
  releaseState: string;
  routeIntentBindingRef: string;
  requiredReleaseApprovalFreezeRef: string | null;
  channelReleaseFreezeState: string;
  requiredAssuranceSliceTrustRefs: readonly string[];
  embeddedSessionRef: string | null;
  reachabilityDependencyRef: string | null;
  reachabilityAssessmentRef: string | null;
  reachabilityEpoch: number;
  contactRepairJourneyRef: string | null;
  messageExpectationState:
    | "reply_needed"
    | "awaiting_review"
    | "reviewed"
    | "reply_blocked"
    | "delivery_repair_required"
    | "closed"
    | null;
  callbackVisibleState:
    | "queued"
    | "scheduled"
    | "attempting_now"
    | "retry_planned"
    | "route_repair_required"
    | "escalated"
    | "closed"
    | null;
  callbackWindowRiskState: "on_track" | "at_risk" | "missed_window" | "repair_required" | null;
  unreadCount: number;
  deliveryRiskState: ConversationDeliveryRiskState;
  authoritativeOutcomeState: ConversationAuthoritativeOutcomeState;
  dominantNextActionRef: string | null;
  placeholderContractRef: string;
  experienceContinuityEvidenceRef: string;
  continuityValidationState: ConversationContinuityValidationState;
  receiptGrammarVersionRef: string;
  threadTupleHash: string;
  monotoneRevision: number;
  tupleAvailabilityState: ConversationTupleAvailabilityState;
  computedAt: string;
  version: number;
}

export interface PatientConversationPreviewDigestSnapshot {
  digestId: string;
  clusterRef: string;
  threadId: string;
  typedSubthreadRefs: readonly string[];
  latestCommunicationEnvelopeRef: string;
  latestReminderPlanRef: string;
  patientShellConsistencyRef: string;
  visibilityProjectionRef: string;
  visibilityTier: string;
  releaseState: string;
  routeIntentBindingRef: string;
  requiredReleaseApprovalFreezeRef: string;
  channelReleaseFreezeState: string;
  requiredAssuranceSliceTrustRefs: readonly string[];
  embeddedSessionRef: string;
  latestReceiptEnvelopeRef: string;
  latestSettlementRef: string;
  latestSupportActionSettlementRef: string;
  latestCallbackStatusRef: string;
  reachabilityDependencyRef: string;
  reachabilityAssessmentRef: string;
  reachabilityEpoch: number;
  contactRepairJourneyRef: string;
  unreadCount: number;
  replyNeededState: ConversationReplyNeededState;
  awaitingReviewState: ConversationAwaitingReviewState;
  deliveryDisputeState: string;
  deliveryRiskState: ConversationDeliveryRiskState;
  authoritativeOutcomeState: ConversationAuthoritativeOutcomeState;
  repairRequiredState: ConversationRepairRequiredState;
  stateConfidenceBand: ConversationStateConfidenceBand;
  dominantNextActionRef: string;
  transitionEnvelopeRef: string;
  placeholderContractRef: string;
  recoveryRouteRef: string;
  experienceContinuityEvidenceRef: string;
  receiptGrammarVersionRef: string;
  threadTupleHash: string;
  monotoneRevision: number;
  computedAt: string;
  version: number;
}

export interface PatientComposerLeaseSnapshot {
  leaseId: string;
  clusterRef: string;
  composerScope: PatientComposerScope;
  routeIntentBindingRef: string;
  lineageFenceEpoch: number;
  draftRef: string;
  reachabilityDependencyRef: string;
  reachabilityAssessmentRef: string;
  reachabilityEpoch: number;
  contactRepairRef: string;
  contactRepairJourneyRef: string;
  consentCheckpointRef: string;
  selectedAnchorRef: string;
  resumeContinuationRef: string;
  latestSettlementRef: string;
  visibilityProjectionRef: string;
  transitionEnvelopeRef: string;
  experienceContinuityEvidenceRef: string;
  receiptGrammarVersionRef: string;
  leaseState: PatientComposerLeaseState;
  expiresAt: string;
  version: number;
}

export interface PatientUrgentDiversionStateSnapshot {
  diversionStateId: string;
  clusterRef: string;
  currentEvidenceAssimilationRef: string;
  currentMaterialDeltaAssessmentRef: string;
  currentEvidenceClassificationRef: string;
  currentSafetyPreemptionRef: string;
  currentSafetyDecisionRef: string;
  currentUrgentDiversionSettlementRef: string;
  safetyDecisionEpoch: number;
  triggerReasonCode: string;
  severityBand: PatientUrgentSeverityBand;
  asyncMessagingAllowedState: "allowed" | "blocked";
  composerFreezeState: "live" | "frozen";
  surfaceState: PatientUrgentSurfaceState;
  diversionGuidanceRef: string;
  reentryRuleRef: string;
  recordedAt: string;
  version: number;
}

export interface ConversationCommandSettlementSnapshot {
  conversationSettlementId: string;
  actionRecordRef: string;
  clusterRef: string;
  threadId: string;
  subthreadRef: string;
  latestCommunicationEnvelopeRef: string;
  routeIntentBindingRef: string;
  commandSettlementRef: string;
  actionScope: string;
  governingObjectRef: string;
  identityRepairBranchDispositionRef: string;
  latestReceiptEnvelopeRef: string;
  latestCallbackStatusRef: string;
  visibilityProjectionRef: string;
  reachabilityDependencyRef: string;
  reachabilityAssessmentRef: string;
  reachabilityEpoch: number;
  contactRepairJourneyRef: string;
  verificationCheckpointRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  transitionEnvelopeRef: string;
  releaseRecoveryDispositionRef: string;
  result: ConversationCommandResult;
  localAckState: ConversationLocalAckState;
  transportState: ConversationTransportState;
  externalObservationState: ConversationExternalObservationState;
  authoritativeOutcomeState: ConversationAuthoritativeOutcomeState;
  stateConfidenceBand: ConversationStateConfidenceBand;
  sameShellRecoveryRef: string;
  projectionVersionRef: string;
  experienceContinuityEvidenceRef: string;
  receiptGrammarVersionRef: string;
  threadTupleHash: string;
  causalToken: string;
  recoveryRouteRef: string;
  monotoneRevision: number;
  recordedAt: string;
  version: number;
}

export interface RecoveryContinuationTokenSnapshot {
  recoveryContinuationRef: string;
  taskId: string;
  clusterRef: string;
  selectedAnchorRef: string;
  actionScope: string;
  contactRepairJourneyRef: string | null;
  sameShellRecoveryRef: string;
  recoveryRouteRef: string;
  issuedAt: string;
  expiresAt: string;
  version: number;
}

export interface RecordConversationSettlementInput {
  taskId: string;
  clusterRef: string;
  actionRecordRef: string;
  commandSettlementRef: string;
  actionScope: string;
  governingObjectRef: string;
  routeIntentBindingRef: string;
  causalToken: string;
  result: ConversationCommandResult;
  localAckState: ConversationLocalAckState;
  transportState: ConversationTransportState;
  externalObservationState: ConversationExternalObservationState;
  authoritativeOutcomeState: ConversationAuthoritativeOutcomeState;
  stateConfidenceBand?: ConversationStateConfidenceBand;
  identityRepairBranchDispositionRef?: string | null;
  latestCommunicationEnvelopeRef?: string | null;
  latestReceiptEnvelopeRef?: string | null;
  latestCallbackStatusRef?: string | null;
  verificationCheckpointRef?: string | null;
  sameShellRecoveryRef?: string | null;
  releaseRecoveryDispositionRef?: string | null;
  surfaceRouteContractRef?: string | null;
  surfacePublicationRef?: string | null;
  runtimePublicationBundleRef?: string | null;
  recordedAt: string;
}

export interface AcquirePatientComposerLeaseInput {
  taskId: string;
  clusterRef: string;
  composerScope: PatientComposerScope;
  lineageFenceEpoch: number;
  selectedAnchorRef?: string | null;
  draftRef?: string | null;
  consentCheckpointRef?: string | null;
  resumeContinuationRef?: string | null;
  recordedAt: string;
  ttlMinutes?: number;
}

export interface ReleasePatientComposerLeaseInput {
  leaseId: string;
  releasedAt: string;
}

export interface RecomputePatientUrgentDiversionInput {
  clusterRef: string;
  currentEvidenceAssimilationRef: string;
  currentMaterialDeltaAssessmentRef: string;
  currentEvidenceClassificationRef: string;
  currentSafetyPreemptionRef: string;
  currentSafetyDecisionRef: string;
  currentUrgentDiversionSettlementRef: string;
  safetyDecisionEpoch: number;
  triggerReasonCode: string;
  severityBand: PatientUrgentSeverityBand;
  surfaceState: PatientUrgentSurfaceState;
  diversionGuidanceRef: string;
  reentryRuleRef: string;
  recordedAt: string;
}

export interface ConversationControlRepositories {
  getTuple(clusterRef: string): Promise<ConversationTupleCompatibilitySnapshot | null>;
  listTuplesForTask(taskId: string): Promise<readonly ConversationTupleCompatibilitySnapshot[]>;
  saveTuple(
    tuple: ConversationTupleCompatibilitySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getDigest(clusterRef: string): Promise<PatientConversationPreviewDigestSnapshot | null>;
  saveDigest(
    digest: PatientConversationPreviewDigestSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listComposerLeasesForCluster(clusterRef: string): Promise<readonly PatientComposerLeaseSnapshot[]>;
  getComposerLease(leaseId: string): Promise<PatientComposerLeaseSnapshot | null>;
  saveComposerLease(
    lease: PatientComposerLeaseSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getUrgentDiversion(clusterRef: string): Promise<PatientUrgentDiversionStateSnapshot | null>;
  saveUrgentDiversion(
    diversion: PatientUrgentDiversionStateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listSettlementsForCluster(
    clusterRef: string,
  ): Promise<readonly ConversationCommandSettlementSnapshot[]>;
  getSettlementByCommand(
    commandSettlementRef: string,
  ): Promise<ConversationCommandSettlementSnapshot | null>;
  saveSettlement(
    settlement: ConversationCommandSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getRecoveryContinuation(
    recoveryContinuationRef: string,
  ): Promise<RecoveryContinuationTokenSnapshot | null>;
  saveRecoveryContinuation(
    continuation: RecoveryContinuationTokenSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

class InMemoryConversationControlStore implements ConversationControlRepositories {
  private readonly tuples = new Map<string, ConversationTupleCompatibilitySnapshot>();
  private readonly digests = new Map<string, PatientConversationPreviewDigestSnapshot>();
  private readonly composerLeases = new Map<string, PatientComposerLeaseSnapshot>();
  private readonly urgentDiversions = new Map<string, PatientUrgentDiversionStateSnapshot>();
  private readonly settlements = new Map<string, ConversationCommandSettlementSnapshot>();
  private readonly settlementsByCommand = new Map<string, string>();
  private readonly recoveryContinuations = new Map<string, RecoveryContinuationTokenSnapshot>();

  async getTuple(clusterRef: string): Promise<ConversationTupleCompatibilitySnapshot | null> {
    return this.tuples.get(clusterRef) ?? null;
  }

  async listTuplesForTask(taskId: string): Promise<readonly ConversationTupleCompatibilitySnapshot[]> {
    return [...this.tuples.values()]
      .filter((tuple) => tuple.taskId === taskId)
      .sort((left, right) => compareIso(left.computedAt, right.computedAt));
  }

  async saveTuple(
    tuple: ConversationTupleCompatibilitySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.tuples, tuple.clusterRef, tuple, options);
  }

  async getDigest(clusterRef: string): Promise<PatientConversationPreviewDigestSnapshot | null> {
    return this.digests.get(clusterRef) ?? null;
  }

  async saveDigest(
    digest: PatientConversationPreviewDigestSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.digests, digest.clusterRef, digest, options);
  }

  async listComposerLeasesForCluster(
    clusterRef: string,
  ): Promise<readonly PatientComposerLeaseSnapshot[]> {
    return [...this.composerLeases.values()]
      .filter((lease) => lease.clusterRef === clusterRef)
      .sort((left, right) => compareIso(left.expiresAt, right.expiresAt));
  }

  async getComposerLease(leaseId: string): Promise<PatientComposerLeaseSnapshot | null> {
    return this.composerLeases.get(leaseId) ?? null;
  }

  async saveComposerLease(
    lease: PatientComposerLeaseSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.composerLeases, lease.leaseId, lease, options);
  }

  async getUrgentDiversion(
    clusterRef: string,
  ): Promise<PatientUrgentDiversionStateSnapshot | null> {
    return this.urgentDiversions.get(clusterRef) ?? null;
  }

  async saveUrgentDiversion(
    diversion: PatientUrgentDiversionStateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.urgentDiversions, diversion.clusterRef, diversion, options);
  }

  async listSettlementsForCluster(
    clusterRef: string,
  ): Promise<readonly ConversationCommandSettlementSnapshot[]> {
    return [...this.settlements.values()]
      .filter((settlement) => settlement.clusterRef === clusterRef)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt));
  }

  async getSettlementByCommand(
    commandSettlementRef: string,
  ): Promise<ConversationCommandSettlementSnapshot | null> {
    const settlementId = this.settlementsByCommand.get(commandSettlementRef);
    return settlementId ? (this.settlements.get(settlementId) ?? null) : null;
  }

  async saveSettlement(
    settlement: ConversationCommandSettlementSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.settlements, settlement.conversationSettlementId, settlement, options);
    this.settlementsByCommand.set(
      settlement.commandSettlementRef,
      settlement.conversationSettlementId,
    );
  }

  async getRecoveryContinuation(
    recoveryContinuationRef: string,
  ): Promise<RecoveryContinuationTokenSnapshot | null> {
    return this.recoveryContinuations.get(recoveryContinuationRef) ?? null;
  }

  async saveRecoveryContinuation(
    continuation: RecoveryContinuationTokenSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.recoveryContinuations,
      continuation.recoveryContinuationRef,
      continuation,
      options,
    );
  }
}

function requiresRecoveryContinuation(result: ConversationCommandResult): boolean {
  return (
    result === "repair_required" ||
    result === "stale_recoverable" ||
    result === "blocked_policy" ||
    result === "review_pending"
  );
}

function confidenceForTuple(input: {
  tuple: ConversationTupleCompatibilitySnapshot;
  urgentDiversion: PatientUrgentDiversionStateSnapshot | null;
  latestSettlement: ConversationCommandSettlementSnapshot | null;
}): ConversationStateConfidenceBand {
  if (
    input.tuple.tupleAvailabilityState !== "authoritative" ||
    input.tuple.continuityValidationState === "blocked" ||
    input.tuple.continuityValidationState === "stale" ||
    input.tuple.deliveryRiskState === "disputed" ||
    input.latestSettlement?.externalObservationState === "disputed"
  ) {
    return "low";
  }
  if (
    input.tuple.continuityValidationState === "degraded" ||
    input.urgentDiversion?.asyncMessagingAllowedState === "blocked" ||
    input.tuple.deliveryRiskState === "at_risk" ||
    input.tuple.deliveryRiskState === "likely_failed"
  ) {
    return "medium";
  }
  return "high";
}

function repairStateForTuple(input: {
  tuple: ConversationTupleCompatibilitySnapshot;
  urgentDiversion: PatientUrgentDiversionStateSnapshot | null;
  latestSettlement: ConversationCommandSettlementSnapshot | null;
}): ConversationRepairRequiredState {
  if (input.tuple.continuityValidationState === "blocked") {
    return "recovery_only";
  }
  if (input.urgentDiversion?.asyncMessagingAllowedState === "blocked") {
    return "policy_blocked";
  }
  if (
    input.tuple.contactRepairJourneyRef ||
    input.tuple.deliveryRiskState === "likely_failed" ||
    input.tuple.deliveryRiskState === "disputed" ||
    input.latestSettlement?.result === "repair_required"
  ) {
    return "contact_route_repair";
  }
  return "none";
}

function replyNeededStateForTuple(input: {
  tuple: ConversationTupleCompatibilitySnapshot;
  urgentDiversion: PatientUrgentDiversionStateSnapshot | null;
  repairRequiredState: ConversationRepairRequiredState;
}): ConversationReplyNeededState {
  if (input.tuple.tupleAvailabilityState !== "authoritative") {
    return "read_only";
  }
  if (
    input.tuple.continuityValidationState === "blocked" ||
    input.tuple.continuityValidationState === "stale"
  ) {
    return "read_only";
  }
  if (input.tuple.previewMode === "step_up_required") {
    return "read_only";
  }
  if (input.tuple.previewMode === "suppressed_recovery_only") {
    return "read_only";
  }
  if (input.urgentDiversion?.asyncMessagingAllowedState === "blocked") {
    return "blocked_by_diversion";
  }
  if (input.repairRequiredState === "contact_route_repair") {
    return "blocked_by_repair";
  }
  if (
    input.tuple.messageExpectationState === "reply_needed" ||
    input.tuple.authoritativeOutcomeState === "awaiting_reply"
  ) {
    return "reply_needed";
  }
  return "none";
}

function awaitingReviewStateForTuple(input: {
  tuple: ConversationTupleCompatibilitySnapshot;
  urgentDiversion: PatientUrgentDiversionStateSnapshot | null;
  latestSettlement: ConversationCommandSettlementSnapshot | null;
}): ConversationAwaitingReviewState {
  if (input.tuple.continuityValidationState === "blocked") {
    return "blocked";
  }
  if (
    input.urgentDiversion?.surfaceState === "review_pending" ||
    input.urgentDiversion?.surfaceState === "manual_review_required"
  ) {
    return "review_pending";
  }
  if (
    input.latestSettlement?.result === "review_pending" ||
    input.tuple.messageExpectationState === "awaiting_review" ||
    input.tuple.authoritativeOutcomeState === "awaiting_review"
  ) {
    return "awaiting_review";
  }
  return "none";
}

function authoritativeOutcomeForTuple(input: {
  tuple: ConversationTupleCompatibilitySnapshot;
  urgentDiversion: PatientUrgentDiversionStateSnapshot | null;
  latestSettlement: ConversationCommandSettlementSnapshot | null;
}): ConversationAuthoritativeOutcomeState {
  if (input.tuple.tupleAvailabilityState !== "authoritative") {
    return "recovery_required";
  }
  if (
    input.tuple.continuityValidationState === "blocked" ||
    input.tuple.continuityValidationState === "stale"
  ) {
    return "recovery_required";
  }
  if (input.urgentDiversion?.asyncMessagingAllowedState === "blocked") {
    return "recovery_required";
  }
  return input.latestSettlement?.authoritativeOutcomeState ?? input.tuple.authoritativeOutcomeState;
}

function dominantNextActionForTuple(input: {
  tuple: ConversationTupleCompatibilitySnapshot;
  urgentDiversion: PatientUrgentDiversionStateSnapshot | null;
  repairRequiredState: ConversationRepairRequiredState;
  replyNeededState: ConversationReplyNeededState;
  awaitingReviewState: ConversationAwaitingReviewState;
}): string {
  if (input.urgentDiversion?.asyncMessagingAllowedState === "blocked") {
    return input.urgentDiversion.diversionGuidanceRef;
  }
  if (input.repairRequiredState === "contact_route_repair") {
    return "contact_route_repair";
  }
  if (
    input.awaitingReviewState === "awaiting_review" ||
    input.awaitingReviewState === "review_pending"
  ) {
    return "await_review_outcome";
  }
  if (input.replyNeededState === "reply_needed") {
    return input.tuple.dominantNextActionRef ?? "reply_to_thread";
  }
  return input.tuple.dominantNextActionRef ?? "view_cluster";
}

export function validateConversationTupleCompatibilitySnapshot(
  snapshot: ConversationTupleCompatibilitySnapshot,
): ConversationTupleCompatibilitySnapshot {
  return {
    ...snapshot,
    tupleId: requireRef(snapshot.tupleId, "tupleId"),
    taskId: requireRef(snapshot.taskId, "taskId"),
    clusterRef: requireRef(snapshot.clusterRef, "clusterRef"),
    threadId: requireRef(snapshot.threadId, "threadId"),
    subthreadRef: requireRef(snapshot.subthreadRef, "subthreadRef"),
    selectedAnchorRef: requireRef(snapshot.selectedAnchorRef, "selectedAnchorRef"),
    typedSubthreadRefs: compactRefs(snapshot.typedSubthreadRefs),
    patientShellConsistencyRef: requireRef(
      snapshot.patientShellConsistencyRef,
      "patientShellConsistencyRef",
    ),
    visibilityProjectionRef: requireRef(snapshot.visibilityProjectionRef, "visibilityProjectionRef"),
    visibilityTier: requireRef(snapshot.visibilityTier, "visibilityTier"),
    previewMode: snapshot.previewMode,
    releaseState: requireRef(snapshot.releaseState, "releaseState"),
    routeIntentBindingRef: requireRef(snapshot.routeIntentBindingRef, "routeIntentBindingRef"),
    channelReleaseFreezeState: requireRef(
      snapshot.channelReleaseFreezeState,
      "channelReleaseFreezeState",
    ),
    requiredAssuranceSliceTrustRefs: compactRefs(snapshot.requiredAssuranceSliceTrustRefs),
    reachabilityEpoch: ensureNonNegativeInteger(snapshot.reachabilityEpoch, "reachabilityEpoch"),
    unreadCount: ensureNonNegativeInteger(snapshot.unreadCount, "unreadCount"),
    deliveryRiskState: snapshot.deliveryRiskState,
    authoritativeOutcomeState: snapshot.authoritativeOutcomeState,
    placeholderContractRef: requireRef(snapshot.placeholderContractRef, "placeholderContractRef"),
    experienceContinuityEvidenceRef: requireRef(
      snapshot.experienceContinuityEvidenceRef,
      "experienceContinuityEvidenceRef",
    ),
    continuityValidationState: snapshot.continuityValidationState,
    receiptGrammarVersionRef: requireRef(
      snapshot.receiptGrammarVersionRef,
      "receiptGrammarVersionRef",
    ),
    threadTupleHash: requireRef(snapshot.threadTupleHash, "threadTupleHash"),
    monotoneRevision: ensurePositiveInteger(snapshot.monotoneRevision, "monotoneRevision"),
    tupleAvailabilityState: snapshot.tupleAvailabilityState,
    computedAt: ensureIsoTimestamp(snapshot.computedAt, "computedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

export interface Phase3ConversationControlClusterBundle {
  tuple: ConversationTupleCompatibilitySnapshot;
  digest: PatientConversationPreviewDigestSnapshot;
  activeComposerLease: PatientComposerLeaseSnapshot | null;
  urgentDiversion: PatientUrgentDiversionStateSnapshot | null;
  latestSettlement: ConversationCommandSettlementSnapshot | null;
}

export interface AcquirePatientComposerLeaseResult {
  lease: PatientComposerLeaseSnapshot;
  reusedExisting: boolean;
}

export interface RecordConversationSettlementResult {
  settlement: ConversationCommandSettlementSnapshot;
  recoveryContinuation: RecoveryContinuationTokenSnapshot | null;
  reusedExisting: boolean;
}

export interface Phase3ConversationControlService {
  saveTupleCompatibility(
    snapshot: ConversationTupleCompatibilitySnapshot,
  ): Promise<ConversationTupleCompatibilitySnapshot>;
  queryCluster(clusterRef: string): Promise<Phase3ConversationControlClusterBundle | null>;
  listTaskClusters(taskId: string): Promise<readonly Phase3ConversationControlClusterBundle[]>;
  recomputeDigest(clusterRef: string, computedAt: string): Promise<PatientConversationPreviewDigestSnapshot>;
  acquireComposerLease(
    input: AcquirePatientComposerLeaseInput,
  ): Promise<AcquirePatientComposerLeaseResult>;
  releaseComposerLease(input: ReleasePatientComposerLeaseInput): Promise<PatientComposerLeaseSnapshot>;
  recomputeUrgentDiversion(
    input: RecomputePatientUrgentDiversionInput,
  ): Promise<PatientUrgentDiversionStateSnapshot>;
  recordSettlement(
    input: RecordConversationSettlementInput,
  ): Promise<RecordConversationSettlementResult>;
}

class Phase3ConversationControlServiceImpl implements Phase3ConversationControlService {
  private readonly idGenerator: BackboneIdGenerator;

  constructor(
    private readonly repositories: ConversationControlRepositories,
    options?: { idGenerator?: BackboneIdGenerator },
  ) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator("phase3_conversation_control");
  }

  async saveTupleCompatibility(
    snapshot: ConversationTupleCompatibilitySnapshot,
  ): Promise<ConversationTupleCompatibilitySnapshot> {
    const normalized = validateConversationTupleCompatibilitySnapshot(snapshot);
    const existing = await this.repositories.getTuple(normalized.clusterRef);
    const version = existing ? nextVersion(existing.version) : normalized.version;
    const saved = {
      ...normalized,
      version,
    };
    await this.repositories.saveTuple(saved, existing ? { expectedVersion: existing.version } : undefined);
    await this.syncActiveLeaseForCluster(saved.clusterRef, saved.computedAt);
    return saved;
  }

  async queryCluster(clusterRef: string): Promise<Phase3ConversationControlClusterBundle | null> {
    const tuple = await this.repositories.getTuple(clusterRef);
    if (!tuple) {
      return null;
    }
    const digest =
      (await this.repositories.getDigest(clusterRef)) ?? (await this.recomputeDigest(clusterRef, tuple.computedAt));
    const activeComposerLease = await this.currentComposerLease(clusterRef);
    const urgentDiversion = await this.repositories.getUrgentDiversion(clusterRef);
    const latestSettlement = await this.latestSettlement(clusterRef);
    return {
      tuple,
      digest,
      activeComposerLease,
      urgentDiversion,
      latestSettlement,
    };
  }

  async listTaskClusters(taskId: string): Promise<readonly Phase3ConversationControlClusterBundle[]> {
    const tuples = await this.repositories.listTuplesForTask(taskId);
    const bundles: Phase3ConversationControlClusterBundle[] = [];
    for (const tuple of tuples) {
      const bundle = await this.queryCluster(tuple.clusterRef);
      if (bundle) {
        bundles.push(bundle);
      }
    }
    return bundles;
  }

  async recomputeDigest(
    clusterRef: string,
    computedAt: string,
  ): Promise<PatientConversationPreviewDigestSnapshot> {
    const tuple = await this.requireTuple(clusterRef);
    const urgentDiversion = await this.repositories.getUrgentDiversion(clusterRef);
    const latestSettlement = await this.latestSettlement(clusterRef);
    const existing = await this.repositories.getDigest(clusterRef);
    const repairRequiredState = repairStateForTuple({
      tuple,
      urgentDiversion,
      latestSettlement,
    });
    const replyNeededState = replyNeededStateForTuple({
      tuple,
      urgentDiversion,
      repairRequiredState,
    });
    const awaitingReviewState = awaitingReviewStateForTuple({
      tuple,
      urgentDiversion,
      latestSettlement,
    });
    const authoritativeOutcomeState = authoritativeOutcomeForTuple({
      tuple,
      urgentDiversion,
      latestSettlement,
    });
    const stateConfidenceBand = confidenceForTuple({
      tuple,
      urgentDiversion,
      latestSettlement,
    });
    const dominantNextActionRef = dominantNextActionForTuple({
      tuple,
      urgentDiversion,
      repairRequiredState,
      replyNeededState,
      awaitingReviewState,
    });
    const monotoneRevision = Math.max(
      tuple.monotoneRevision,
      latestSettlement?.monotoneRevision ?? 0,
      existing ? existing.monotoneRevision + 1 : 1,
    );
    const digest: PatientConversationPreviewDigestSnapshot = {
      digestId: existing?.digestId ?? nextKernelId(this.idGenerator, "patient_conversation_digest"),
      clusterRef: tuple.clusterRef,
      threadId: tuple.threadId,
      typedSubthreadRefs: tuple.typedSubthreadRefs,
      latestCommunicationEnvelopeRef:
        tuple.latestCommunicationEnvelopeRef ??
        placeholderRef("communication_envelope", `${tuple.clusterRef}::pending`),
      latestReminderPlanRef:
        tuple.latestReminderPlanRef ??
        placeholderRef("reminder_plan", `${tuple.clusterRef}::none`),
      patientShellConsistencyRef: tuple.patientShellConsistencyRef,
      visibilityProjectionRef: tuple.visibilityProjectionRef,
      visibilityTier: tuple.visibilityTier,
      releaseState: tuple.releaseState,
      routeIntentBindingRef: tuple.routeIntentBindingRef,
      requiredReleaseApprovalFreezeRef:
        tuple.requiredReleaseApprovalFreezeRef ??
        placeholderRef("release_approval_freeze", `${tuple.clusterRef}::none`),
      channelReleaseFreezeState: tuple.channelReleaseFreezeState,
      requiredAssuranceSliceTrustRefs:
        tuple.requiredAssuranceSliceTrustRefs.length > 0
          ? tuple.requiredAssuranceSliceTrustRefs
          : [placeholderRef("assurance_slice_trust", `${tuple.clusterRef}::none`)],
      embeddedSessionRef:
        tuple.embeddedSessionRef ?? placeholderRef("embedded_session", `${tuple.clusterRef}::none`),
      latestReceiptEnvelopeRef:
        latestSettlement?.latestReceiptEnvelopeRef ??
        tuple.latestReceiptEnvelopeRef ??
        placeholderRef("patient_receipt_envelope", `${tuple.clusterRef}::pending`),
      latestSettlementRef:
        latestSettlement?.conversationSettlementId ??
        tuple.latestSettlementRef ??
        placeholderRef("conversation_settlement", `${tuple.clusterRef}::pending`),
      latestSupportActionSettlementRef:
        tuple.latestSupportActionSettlementRef ??
        placeholderRef("support_action_settlement", `${tuple.clusterRef}::none`),
      latestCallbackStatusRef:
        tuple.latestCallbackStatusRef ??
        placeholderRef("patient_callback_status", `${tuple.clusterRef}::none`),
      reachabilityDependencyRef:
        tuple.reachabilityDependencyRef ??
        placeholderRef("reachability_dependency", `${tuple.clusterRef}::none`),
      reachabilityAssessmentRef:
        tuple.reachabilityAssessmentRef ??
        placeholderRef("reachability_assessment", `${tuple.clusterRef}::pending`),
      reachabilityEpoch: tuple.reachabilityEpoch,
      contactRepairJourneyRef:
        tuple.contactRepairJourneyRef ??
        placeholderRef("contact_route_repair_journey", `${tuple.clusterRef}::none`),
      unreadCount:
        tuple.tupleAvailabilityState === "authoritative" ? tuple.unreadCount : 0,
      replyNeededState,
      awaitingReviewState,
      deliveryDisputeState:
        tuple.deliveryRiskState === "disputed" ||
        latestSettlement?.externalObservationState === "disputed"
          ? "disputed"
          : "none",
      deliveryRiskState:
        tuple.continuityValidationState === "blocked" ? "at_risk" : tuple.deliveryRiskState,
      authoritativeOutcomeState,
      repairRequiredState,
      stateConfidenceBand,
      dominantNextActionRef,
      transitionEnvelopeRef: placeholderRef(
        "transition_envelope",
        `${tuple.clusterRef}:${dominantNextActionRef}:${monotoneRevision}`,
      ),
      placeholderContractRef: tuple.placeholderContractRef,
      recoveryRouteRef: `/patient/messages/${tuple.clusterRef}/recover`,
      experienceContinuityEvidenceRef: tuple.experienceContinuityEvidenceRef,
      receiptGrammarVersionRef: tuple.receiptGrammarVersionRef,
      threadTupleHash: tuple.threadTupleHash,
      monotoneRevision,
      computedAt: ensureIsoTimestamp(computedAt, "computedAt"),
      version: existing ? nextVersion(existing.version) : 1,
    };
    await this.repositories.saveDigest(
      digest,
      existing ? { expectedVersion: existing.version } : undefined,
    );
    await this.syncActiveLeaseForCluster(clusterRef, computedAt);
    return digest;
  }

  async acquireComposerLease(
    input: AcquirePatientComposerLeaseInput,
  ): Promise<AcquirePatientComposerLeaseResult> {
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const tuple = await this.requireTuple(input.clusterRef);
    const activeLease = await this.currentComposerLease(input.clusterRef);
    if (activeLease && activeLease.leaseState !== "released") {
      return { lease: activeLease, reusedExisting: true };
    }
    const urgentDiversion = await this.repositories.getUrgentDiversion(input.clusterRef);
    const latestSettlement = await this.latestSettlement(input.clusterRef);
    const repairRequiredState = repairStateForTuple({
      tuple,
      urgentDiversion,
      latestSettlement,
    });
    const leaseState: PatientComposerLeaseState =
      tuple.tupleAvailabilityState !== "authoritative"
        ? "resume_required"
        : tuple.continuityValidationState === "blocked" || tuple.continuityValidationState === "stale"
          ? "resume_required"
          : urgentDiversion?.asyncMessagingAllowedState === "blocked" ||
              repairRequiredState === "contact_route_repair" ||
              tuple.previewMode === "step_up_required" ||
              tuple.previewMode === "suppressed_recovery_only"
            ? "blocked"
            : "active";
    const draftRef =
      input.draftRef ??
      activeLease?.draftRef ??
      placeholderRef("conversation_draft", `${tuple.clusterRef}:${input.composerScope}`);
    const lease: PatientComposerLeaseSnapshot = {
      leaseId: nextKernelId(this.idGenerator, "patient_composer_lease"),
      clusterRef: tuple.clusterRef,
      composerScope: input.composerScope,
      routeIntentBindingRef: tuple.routeIntentBindingRef,
      lineageFenceEpoch: ensureNonNegativeInteger(input.lineageFenceEpoch, "lineageFenceEpoch"),
      draftRef,
      reachabilityDependencyRef:
        tuple.reachabilityDependencyRef ??
        placeholderRef("reachability_dependency", `${tuple.clusterRef}::none`),
      reachabilityAssessmentRef:
        tuple.reachabilityAssessmentRef ??
        placeholderRef("reachability_assessment", `${tuple.clusterRef}::pending`),
      reachabilityEpoch: tuple.reachabilityEpoch,
      contactRepairRef:
        tuple.contactRepairJourneyRef ??
        placeholderRef("contact_repair_entry", `${tuple.clusterRef}::none`),
      contactRepairJourneyRef:
        tuple.contactRepairJourneyRef ??
        placeholderRef("contact_route_repair_journey", `${tuple.clusterRef}::none`),
      consentCheckpointRef:
        input.consentCheckpointRef ??
        placeholderRef("consent_checkpoint", `${tuple.clusterRef}::satisfied`),
      selectedAnchorRef: input.selectedAnchorRef ?? tuple.selectedAnchorRef,
      resumeContinuationRef:
        input.resumeContinuationRef ??
        placeholderRef("recovery_continuation", `${tuple.clusterRef}:${input.composerScope}`),
      latestSettlementRef:
        latestSettlement?.conversationSettlementId ??
        tuple.latestSettlementRef ??
        placeholderRef("conversation_settlement", `${tuple.clusterRef}::pending`),
      visibilityProjectionRef: tuple.visibilityProjectionRef,
      transitionEnvelopeRef: placeholderRef(
        "transition_envelope",
        `${tuple.clusterRef}:${input.composerScope}:${leaseState}`,
      ),
      experienceContinuityEvidenceRef: tuple.experienceContinuityEvidenceRef,
      receiptGrammarVersionRef: tuple.receiptGrammarVersionRef,
      leaseState,
      expiresAt: addMinutes(recordedAt, input.ttlMinutes ?? 15),
      version: 1,
    };
    await this.repositories.saveComposerLease(lease);
    return { lease, reusedExisting: false };
  }

  async releaseComposerLease(
    input: ReleasePatientComposerLeaseInput,
  ): Promise<PatientComposerLeaseSnapshot> {
    const existing = await this.repositories.getComposerLease(input.leaseId);
    invariant(existing, "UNKNOWN_COMPOSER_LEASE", `Unknown PatientComposerLease ${input.leaseId}.`);
    const released: PatientComposerLeaseSnapshot = {
      ...existing,
      leaseState: "released",
      expiresAt: ensureIsoTimestamp(input.releasedAt, "releasedAt"),
      version: nextVersion(existing.version),
    };
    await this.repositories.saveComposerLease(released, { expectedVersion: existing.version });
    return released;
  }

  async recomputeUrgentDiversion(
    input: RecomputePatientUrgentDiversionInput,
  ): Promise<PatientUrgentDiversionStateSnapshot> {
    const tuple = await this.requireTuple(input.clusterRef);
    const existing = await this.repositories.getUrgentDiversion(input.clusterRef);
    const surfaceState = input.surfaceState;
    const diversion: PatientUrgentDiversionStateSnapshot = {
      diversionStateId:
        existing?.diversionStateId ??
        nextKernelId(this.idGenerator, "patient_urgent_diversion_state"),
      clusterRef: tuple.clusterRef,
      currentEvidenceAssimilationRef: requireRef(
        input.currentEvidenceAssimilationRef,
        "currentEvidenceAssimilationRef",
      ),
      currentMaterialDeltaAssessmentRef: requireRef(
        input.currentMaterialDeltaAssessmentRef,
        "currentMaterialDeltaAssessmentRef",
      ),
      currentEvidenceClassificationRef: requireRef(
        input.currentEvidenceClassificationRef,
        "currentEvidenceClassificationRef",
      ),
      currentSafetyPreemptionRef: requireRef(
        input.currentSafetyPreemptionRef,
        "currentSafetyPreemptionRef",
      ),
      currentSafetyDecisionRef: requireRef(input.currentSafetyDecisionRef, "currentSafetyDecisionRef"),
      currentUrgentDiversionSettlementRef: requireRef(
        input.currentUrgentDiversionSettlementRef,
        "currentUrgentDiversionSettlementRef",
      ),
      safetyDecisionEpoch: ensureNonNegativeInteger(
        input.safetyDecisionEpoch,
        "safetyDecisionEpoch",
      ),
      triggerReasonCode: requireRef(input.triggerReasonCode, "triggerReasonCode"),
      severityBand: input.severityBand,
      asyncMessagingAllowedState:
        surfaceState === "urgent_required" ||
        surfaceState === "urgent_issued" ||
        surfaceState === "manual_review_required"
          ? "blocked"
          : "allowed",
      composerFreezeState:
        surfaceState === "assimilation_pending" || surfaceState === "review_pending"
          ? "frozen"
          : surfaceState === "urgent_required" ||
              surfaceState === "urgent_issued" ||
              surfaceState === "manual_review_required"
            ? "frozen"
            : "live",
      surfaceState,
      diversionGuidanceRef: requireRef(input.diversionGuidanceRef, "diversionGuidanceRef"),
      reentryRuleRef: requireRef(input.reentryRuleRef, "reentryRuleRef"),
      recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
      version: existing ? nextVersion(existing.version) : 1,
    };
    await this.repositories.saveUrgentDiversion(
      diversion,
      existing ? { expectedVersion: existing.version } : undefined,
    );
    await this.recomputeDigest(tuple.clusterRef, diversion.recordedAt);
    await this.syncActiveLeaseForCluster(tuple.clusterRef, diversion.recordedAt);
    return diversion;
  }

  async recordSettlement(
    input: RecordConversationSettlementInput,
  ): Promise<RecordConversationSettlementResult> {
    const existing = await this.repositories.getSettlementByCommand(input.commandSettlementRef);
    if (existing) {
      const continuation = requiresRecoveryContinuation(existing.result)
        ? await this.repositories.getRecoveryContinuation(
            placeholderRef(
              "recovery_continuation",
              `${existing.clusterRef}:${existing.commandSettlementRef}`,
            ),
          )
        : null;
      return {
        settlement: existing,
        recoveryContinuation: continuation,
        reusedExisting: true,
      };
    }

    const tuple = await this.requireTuple(input.clusterRef);
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const settlements = await this.repositories.listSettlementsForCluster(input.clusterRef);
    const monotoneRevision = Math.max(
      tuple.monotoneRevision,
      settlements.at(-1)?.monotoneRevision ?? 0,
      1,
    );
    const settlement: ConversationCommandSettlementSnapshot = {
      conversationSettlementId: nextKernelId(this.idGenerator, "conversation_command_settlement"),
      actionRecordRef: requireRef(input.actionRecordRef, "actionRecordRef"),
      clusterRef: tuple.clusterRef,
      threadId: tuple.threadId,
      subthreadRef: tuple.subthreadRef,
      latestCommunicationEnvelopeRef:
        input.latestCommunicationEnvelopeRef ??
        tuple.latestCommunicationEnvelopeRef ??
        placeholderRef("communication_envelope", `${tuple.clusterRef}::pending`),
      routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
      commandSettlementRef: requireRef(input.commandSettlementRef, "commandSettlementRef"),
      actionScope: requireRef(input.actionScope, "actionScope"),
      governingObjectRef: requireRef(input.governingObjectRef, "governingObjectRef"),
      identityRepairBranchDispositionRef:
        input.identityRepairBranchDispositionRef ??
        placeholderRef("identity_repair_branch_disposition", `${tuple.clusterRef}::released`),
      latestReceiptEnvelopeRef:
        input.latestReceiptEnvelopeRef ??
        tuple.latestReceiptEnvelopeRef ??
        placeholderRef("patient_receipt_envelope", `${tuple.clusterRef}::pending`),
      latestCallbackStatusRef:
        input.latestCallbackStatusRef ??
        tuple.latestCallbackStatusRef ??
        placeholderRef("patient_callback_status", `${tuple.clusterRef}::none`),
      visibilityProjectionRef: tuple.visibilityProjectionRef,
      reachabilityDependencyRef:
        tuple.reachabilityDependencyRef ??
        placeholderRef("reachability_dependency", `${tuple.clusterRef}::none`),
      reachabilityAssessmentRef:
        tuple.reachabilityAssessmentRef ??
        placeholderRef("reachability_assessment", `${tuple.clusterRef}::pending`),
      reachabilityEpoch: tuple.reachabilityEpoch,
      contactRepairJourneyRef:
        tuple.contactRepairJourneyRef ??
        placeholderRef("contact_route_repair_journey", `${tuple.clusterRef}::none`),
      verificationCheckpointRef:
        input.verificationCheckpointRef ??
        placeholderRef("verification_checkpoint", `${tuple.clusterRef}::none`),
      surfaceRouteContractRef:
        input.surfaceRouteContractRef ??
        placeholderRef("surface_route_contract", `${tuple.clusterRef}::conversation`),
      surfacePublicationRef:
        input.surfacePublicationRef ??
        placeholderRef("surface_publication", `${tuple.clusterRef}::current`),
      runtimePublicationBundleRef:
        input.runtimePublicationBundleRef ??
        placeholderRef("runtime_publication_bundle", `${tuple.clusterRef}::current`),
      transitionEnvelopeRef: placeholderRef(
        "transition_envelope",
        `${tuple.clusterRef}:${input.commandSettlementRef}`,
      ),
      releaseRecoveryDispositionRef:
        input.releaseRecoveryDispositionRef ??
        placeholderRef("release_recovery_disposition", `${tuple.clusterRef}::current`),
      result: input.result,
      localAckState: input.localAckState,
      transportState: input.transportState,
      externalObservationState: input.externalObservationState,
      authoritativeOutcomeState: input.authoritativeOutcomeState,
      stateConfidenceBand:
        input.stateConfidenceBand ??
        confidenceForTuple({
          tuple,
          urgentDiversion: await this.repositories.getUrgentDiversion(tuple.clusterRef),
          latestSettlement: null,
        }),
      sameShellRecoveryRef:
        input.sameShellRecoveryRef ?? `/patient/messages/${tuple.clusterRef}/recover`,
      projectionVersionRef: `${tuple.threadId}@conversation_settlement_${recordedAt}`,
      experienceContinuityEvidenceRef: tuple.experienceContinuityEvidenceRef,
      receiptGrammarVersionRef: tuple.receiptGrammarVersionRef,
      threadTupleHash: tuple.threadTupleHash,
      causalToken: requireRef(input.causalToken, "causalToken"),
      recoveryRouteRef: `/patient/messages/${tuple.clusterRef}/recover`,
      monotoneRevision,
      recordedAt,
      version: 1,
    };
    await this.repositories.saveSettlement(settlement);
    let recoveryContinuation: RecoveryContinuationTokenSnapshot | null = null;
    if (requiresRecoveryContinuation(settlement.result)) {
      recoveryContinuation = {
        recoveryContinuationRef: placeholderRef(
          "recovery_continuation",
          `${tuple.clusterRef}:${settlement.commandSettlementRef}`,
        ),
        taskId: input.taskId,
        clusterRef: tuple.clusterRef,
        selectedAnchorRef: tuple.selectedAnchorRef,
        actionScope: settlement.actionScope,
        contactRepairJourneyRef: optionalRef(tuple.contactRepairJourneyRef),
        sameShellRecoveryRef: settlement.sameShellRecoveryRef,
        recoveryRouteRef: settlement.recoveryRouteRef,
        issuedAt: recordedAt,
        expiresAt: addMinutes(recordedAt, 30),
        version: 1,
      };
      await this.repositories.saveRecoveryContinuation(recoveryContinuation);
    }
    await this.recomputeDigest(tuple.clusterRef, recordedAt);
    return {
      settlement,
      recoveryContinuation,
      reusedExisting: false,
    };
  }

  private async requireTuple(clusterRef: string): Promise<ConversationTupleCompatibilitySnapshot> {
    const tuple = await this.repositories.getTuple(clusterRef);
    invariant(tuple, "UNKNOWN_CONVERSATION_TUPLE", `Unknown conversation tuple for ${clusterRef}.`);
    return tuple;
  }

  private async latestSettlement(
    clusterRef: string,
  ): Promise<ConversationCommandSettlementSnapshot | null> {
    const settlements = await this.repositories.listSettlementsForCluster(clusterRef);
    return settlements.length > 0 ? settlements[settlements.length - 1]! : null;
  }

  private async currentComposerLease(
    clusterRef: string,
  ): Promise<PatientComposerLeaseSnapshot | null> {
    const leases = await this.repositories.listComposerLeasesForCluster(clusterRef);
    const current = leases
      .filter((lease) => lease.leaseState !== "released")
      .sort((left, right) => compareIso(right.expiresAt, left.expiresAt))[0];
    return current ?? null;
  }

  private async syncActiveLeaseForCluster(clusterRef: string, observedAt: string): Promise<void> {
    const activeLease = await this.currentComposerLease(clusterRef);
    if (!activeLease || activeLease.leaseState === "released") {
      return;
    }
    const tuple = await this.repositories.getTuple(clusterRef);
    if (!tuple) {
      return;
    }
    const urgentDiversion = await this.repositories.getUrgentDiversion(clusterRef);
    const latestSettlement = await this.latestSettlement(clusterRef);
    const repairRequiredState = repairStateForTuple({
      tuple,
      urgentDiversion,
      latestSettlement,
    });
    const nextState: PatientComposerLeaseState =
      tuple.tupleAvailabilityState !== "authoritative"
        ? "resume_required"
        : tuple.continuityValidationState === "blocked" || tuple.continuityValidationState === "stale"
          ? "resume_required"
          : urgentDiversion?.asyncMessagingAllowedState === "blocked" ||
              repairRequiredState === "contact_route_repair" ||
              tuple.previewMode === "step_up_required" ||
              tuple.previewMode === "suppressed_recovery_only"
            ? "blocked"
            : "active";
    if (nextState === activeLease.leaseState) {
      return;
    }
    const updated: PatientComposerLeaseSnapshot = {
      ...activeLease,
      latestSettlementRef:
        latestSettlement?.conversationSettlementId ??
        activeLease.latestSettlementRef,
      experienceContinuityEvidenceRef: tuple.experienceContinuityEvidenceRef,
      reachabilityAssessmentRef:
        tuple.reachabilityAssessmentRef ?? activeLease.reachabilityAssessmentRef,
      reachabilityEpoch: tuple.reachabilityEpoch,
      contactRepairJourneyRef:
        tuple.contactRepairJourneyRef ?? activeLease.contactRepairJourneyRef,
      leaseState: nextState,
      expiresAt: addMinutes(observedAt, 15),
      version: nextVersion(activeLease.version),
    };
    await this.repositories.saveComposerLease(updated, { expectedVersion: activeLease.version });
  }
}

export function createPhase3ConversationControlStore(): ConversationControlRepositories {
  return new InMemoryConversationControlStore();
}

export function createPhase3ConversationControlService(
  repositories: ConversationControlRepositories,
  options?: { idGenerator?: BackboneIdGenerator },
): Phase3ConversationControlService {
  return new Phase3ConversationControlServiceImpl(repositories, options);
}
