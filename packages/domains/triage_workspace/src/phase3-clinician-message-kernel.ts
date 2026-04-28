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

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
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

function nextKernelId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

export type ClinicianMessageThreadState =
  | "drafted"
  | "approved"
  | "sent"
  | "delivered"
  | "delivery_failed"
  | "delivery_disputed"
  | "patient_replied"
  | "awaiting_clinician_review"
  | "contact_route_repair_pending"
  | "escalated_to_callback"
  | "closed"
  | "reopened";

export type MessageApprovalRequiredState = "required" | "not_required";
export type MessageRepairIntent =
  | "initial_send"
  | "controlled_resend"
  | "channel_change"
  | "attachment_recovery";
export type MessageTransportState =
  | "drafted"
  | "approved"
  | "dispatching"
  | "provider_accepted"
  | "provider_rejected";
export type MessageDeliveryEvidenceState =
  | "unobserved"
  | "delivered"
  | "failed"
  | "disputed"
  | "expired";
export type ThreadExpectationPatientVisibleState =
  | "reply_needed"
  | "awaiting_review"
  | "reviewed"
  | "reply_blocked"
  | "delivery_repair_required"
  | "closed";
export type ThreadDeliveryRiskState = "on_track" | "at_risk" | "likely_failed" | "disputed";
export type ThreadStateConfidenceBand = "high" | "medium" | "low";
export type ThreadResolutionDecision =
  | "await_reply"
  | "review_pending"
  | "escalate_to_callback"
  | "close"
  | "reopen"
  | "repair_route";
export type MessageDeliveryEvidenceStrength =
  | "direct_provider_receipt"
  | "durable_channel_ack"
  | "manual_attestation"
  | "contradictory_signal";
export type MessageReplyClassificationHint =
  | "technical_only"
  | "potentially_clinical"
  | "contact_safety_relevant"
  | "unknown";

const threadStates: readonly ClinicianMessageThreadState[] = [
  "drafted",
  "approved",
  "sent",
  "delivered",
  "delivery_failed",
  "delivery_disputed",
  "patient_replied",
  "awaiting_clinician_review",
  "contact_route_repair_pending",
  "escalated_to_callback",
  "closed",
  "reopened",
];

const approvalRequiredStates: readonly MessageApprovalRequiredState[] = ["required", "not_required"];
const repairIntents: readonly MessageRepairIntent[] = [
  "initial_send",
  "controlled_resend",
  "channel_change",
  "attachment_recovery",
];
const transportStates: readonly MessageTransportState[] = [
  "drafted",
  "approved",
  "dispatching",
  "provider_accepted",
  "provider_rejected",
];
const deliveryEvidenceStates: readonly MessageDeliveryEvidenceState[] = [
  "unobserved",
  "delivered",
  "failed",
  "disputed",
  "expired",
];
const expectationStates: readonly ThreadExpectationPatientVisibleState[] = [
  "reply_needed",
  "awaiting_review",
  "reviewed",
  "reply_blocked",
  "delivery_repair_required",
  "closed",
];
const deliveryRiskStates: readonly ThreadDeliveryRiskState[] = [
  "on_track",
  "at_risk",
  "likely_failed",
  "disputed",
];
const confidenceBands: readonly ThreadStateConfidenceBand[] = ["high", "medium", "low"];
const resolutionDecisions: readonly ThreadResolutionDecision[] = [
  "await_reply",
  "review_pending",
  "escalate_to_callback",
  "close",
  "reopen",
  "repair_route",
];
const evidenceStrengths: readonly MessageDeliveryEvidenceStrength[] = [
  "direct_provider_receipt",
  "durable_channel_ack",
  "manual_attestation",
  "contradictory_signal",
];
const replyClassificationHints: readonly MessageReplyClassificationHint[] = [
  "technical_only",
  "potentially_clinical",
  "contact_safety_relevant",
  "unknown",
];

export const clinicianMessageLegalTransitions: Readonly<
  Record<ClinicianMessageThreadState, readonly ClinicianMessageThreadState[]>
> = {
  drafted: ["approved", "closed"],
  approved: ["drafted", "sent", "closed"],
  sent: ["delivered", "delivery_failed", "delivery_disputed", "closed"],
  delivered: ["patient_replied", "contact_route_repair_pending", "closed"],
  delivery_failed: ["contact_route_repair_pending", "closed"],
  delivery_disputed: ["contact_route_repair_pending", "awaiting_clinician_review", "closed"],
  patient_replied: ["awaiting_clinician_review"],
  awaiting_clinician_review: ["escalated_to_callback", "closed"],
  contact_route_repair_pending: ["approved", "sent", "escalated_to_callback", "closed"],
  escalated_to_callback: ["closed", "reopened"],
  closed: ["reopened"],
  reopened: ["awaiting_clinician_review", "approved"],
} as const;

export interface ClinicianMessageThreadSnapshot {
  threadId: string;
  sourceTriageTaskRef: string;
  clinicianMessageSeedRef: string;
  episodeRef: string;
  requestId: string;
  requestLineageRef: string;
  lineageCaseLinkRef: string;
  decisionEpochRef: string;
  decisionId: string;
  state: ClinicianMessageThreadState;
  threadPurposeRef: string;
  closureRuleRef: string;
  authorActorRef: string;
  approverActorRef: string | null;
  approvalRequiredState: MessageApprovalRequiredState;
  latestDraftRef: string;
  messageSubject: string;
  messageBody: string;
  dispatchFenceCounter: number;
  activeDispatchEnvelopeRef: string | null;
  latestDeliveryEvidenceBundleRef: string | null;
  currentExpectationEnvelopeRef: string | null;
  activeResolutionGateRef: string | null;
  latestReplyRef: string | null;
  reachabilityDependencyRef: string | null;
  requestLifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  patientVisibleExpectationState: ThreadExpectationPatientVisibleState;
  reSafetyRequired: boolean;
  callbackEscalationRef: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface MessageDispatchEnvelopeSnapshot {
  messageDispatchEnvelopeId: string;
  threadRef: string;
  threadVersionRef: string;
  draftRef: string;
  approvedByRef: string | null;
  deliveryPlanRef: string;
  contactRouteRef: string | null;
  routeIntentBindingRef: string;
  requestLifecycleLeaseRef: string;
  dispatchFenceEpoch: number;
  ownershipEpochRef: number;
  fencingToken: string;
  commandActionRecordRef: string;
  idempotencyRecordRef: string;
  adapterDispatchAttemptRef: string;
  adapterEffectKey: string;
  latestReceiptCheckpointRef: string | null;
  supportMutationAttemptRef: string | null;
  supportActionRecordRef: string | null;
  repairIntent: MessageRepairIntent;
  channelTemplateRef: string;
  transportState: MessageTransportState;
  deliveryEvidenceState: MessageDeliveryEvidenceState;
  currentDeliveryConfidenceRef: string;
  deliveryModelVersionRef: string;
  calibrationVersion: string;
  causalToken: string;
  monotoneRevision: number;
  idempotencyKey: string;
  createdAt: string;
  version: number;
}

export interface MessageDeliveryEvidenceBundleSnapshot {
  messageDeliveryEvidenceBundleId: string;
  threadRef: string;
  dispatchEnvelopeRef: string;
  dispatchFenceEpoch: number;
  threadVersionRef: string;
  receiptCheckpointRef: string;
  deliveryState: Exclude<MessageDeliveryEvidenceState, "unobserved">;
  evidenceStrength: MessageDeliveryEvidenceStrength;
  providerDispositionRef: string;
  deliveryArtifactRefs: readonly string[];
  reachabilityDependencyRef: string | null;
  supportActionSettlementRef: string | null;
  causalToken: string;
  recordedAt: string;
  version: number;
}

export interface ThreadExpectationEnvelopeSnapshot {
  threadExpectationEnvelopeId: string;
  threadRef: string;
  reachabilityDependencyRef: string | null;
  contactRepairJourneyRef: string | null;
  identityRepairBranchDispositionRef: string | null;
  patientVisibleState: ThreadExpectationPatientVisibleState;
  replyWindowRef: string;
  deliveryRiskState: ThreadDeliveryRiskState;
  stateConfidenceBand: ThreadStateConfidenceBand;
  fallbackGuidanceRef: string;
  routeIntentBindingRef: string;
  requiredReleaseApprovalFreezeRef: string | null;
  channelReleaseFreezeState: string;
  requiredAssuranceSliceTrustRefs: readonly string[];
  latestSupportActionSettlementRef: string | null;
  transitionEnvelopeRef: string;
  continuityEvidenceRef: string;
  freezeDispositionRef: string | null;
  causalToken: string;
  monotoneRevision: number;
  createdAt: string;
  version: number;
}

export interface ThreadResolutionGateSnapshot {
  threadResolutionGateId: string;
  threadRef: string;
  latestDispatchRef: string;
  latestReplyRef: string | null;
  latestExpectationEnvelopeRef: string;
  latestSupportActionSettlementRef: string | null;
  decision: ThreadResolutionDecision;
  decisionReasonRef: string;
  sameShellRecoveryRef: string | null;
  requiresLifecycleReview: boolean;
  causalToken: string;
  monotoneRevision: number;
  decidedAt: string;
  version: number;
}

export interface MessagePatientReplySnapshot {
  messagePatientReplyId: string;
  threadRef: string;
  requestId: string;
  requestLineageRef: string;
  dispatchEnvelopeRef: string;
  threadVersionRef: string;
  replyRouteFamilyRef: string;
  replyChannelRef: string;
  replyText: string;
  replyArtifactRefs: readonly string[];
  providerCorrelationRef: string | null;
  secureEntryGrantRef: string | null;
  classificationHint: MessageReplyClassificationHint;
  reSafetyRequired: boolean;
  needsAssimilation: boolean;
  causalToken: string;
  repliedAt: string;
  version: number;
}

export interface Phase3ClinicianMessageBundle {
  messageThread: ClinicianMessageThreadSnapshot;
  currentDispatchEnvelope: MessageDispatchEnvelopeSnapshot | null;
  currentDeliveryEvidenceBundle: MessageDeliveryEvidenceBundleSnapshot | null;
  currentExpectationEnvelope: ThreadExpectationEnvelopeSnapshot | null;
  currentResolutionGate: ThreadResolutionGateSnapshot | null;
  latestReply: MessagePatientReplySnapshot | null;
}

export interface CreateClinicianMessageThreadInput {
  threadId: string;
  sourceTriageTaskRef: string;
  clinicianMessageSeedRef: string;
  episodeRef: string;
  requestId: string;
  requestLineageRef: string;
  lineageCaseLinkRef: string;
  decisionEpochRef: string;
  decisionId: string;
  threadPurposeRef: string;
  closureRuleRef: string;
  authorActorRef: string;
  approvalRequiredState: MessageApprovalRequiredState;
  messageSubject: string;
  messageBody: string;
  requestLifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  createdAt: string;
  initialExpectationEnvelope: Omit<
    ThreadExpectationEnvelopeSnapshot,
    "threadRef" | "monotoneRevision" | "version"
  >;
}

export interface SaveClinicianMessageDraftInput {
  threadRef: string;
  messageSubject: string;
  messageBody: string;
  authorActorRef: string;
  recordedAt: string;
}

export interface ApproveClinicianMessageDraftInput {
  threadRef: string;
  approvedByRef: string;
  approvedAt: string;
}

export interface DispatchClinicianMessageInput {
  threadRef: string;
  nextState: ClinicianMessageThreadState;
  dispatchEnvelope: Omit<MessageDispatchEnvelopeSnapshot, "threadRef" | "monotoneRevision" | "version">;
  expectationEnvelope: Omit<
    ThreadExpectationEnvelopeSnapshot,
    "threadRef" | "monotoneRevision" | "version"
  >;
  dispatchedAt: string;
}

export interface ObserveMessageProviderReceiptInput {
  threadRef: string;
  messageDispatchEnvelopeId: string;
  receiptCheckpointRef: string;
  receiptDecisionClass: string;
  nextTransportState: MessageTransportState;
  observedAt: string;
}

export interface RecordMessageDeliveryEvidenceInput {
  threadRef: string;
  nextState: ClinicianMessageThreadState;
  evidenceBundle: Omit<
    MessageDeliveryEvidenceBundleSnapshot,
    "threadRef" | "version"
  >;
  expectationEnvelope: Omit<
    ThreadExpectationEnvelopeSnapshot,
    "threadRef" | "monotoneRevision" | "version"
  >;
  recordedAt: string;
}

export interface IngestPatientReplyInput {
  threadRef: string;
  nextState: ClinicianMessageThreadState;
  reply: Omit<MessagePatientReplySnapshot, "threadRef" | "version">;
  expectationEnvelope: Omit<
    ThreadExpectationEnvelopeSnapshot,
    "threadRef" | "monotoneRevision" | "version"
  >;
  recordedAt: string;
}

export interface SettleThreadResolutionGateInput {
  threadRef: string;
  nextState: ClinicianMessageThreadState;
  resolutionGate: Omit<ThreadResolutionGateSnapshot, "threadRef" | "monotoneRevision" | "version">;
  expectationEnvelope: Omit<
    ThreadExpectationEnvelopeSnapshot,
    "threadRef" | "monotoneRevision" | "version"
  > | null;
  callbackEscalationRef?: string | null;
  recordedAt: string;
}

export interface CloseClinicianMessageThreadInput {
  threadRef: string;
  closedAt: string;
}

export interface ReopenClinicianMessageThreadInput {
  threadRef: string;
  nextState: ClinicianMessageThreadState;
  requestLifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  ownershipEpoch: number;
  fencingToken: string;
  currentLineageFenceEpoch: number;
  expectationEnvelope: Omit<
    ThreadExpectationEnvelopeSnapshot,
    "threadRef" | "monotoneRevision" | "version"
  >;
  reopenedAt: string;
}

export interface CreateClinicianMessageThreadResult {
  bundle: Phase3ClinicianMessageBundle;
  reusedExisting: boolean;
}

export interface DispatchClinicianMessageResult {
  bundle: Phase3ClinicianMessageBundle;
  dispatchEnvelope: MessageDispatchEnvelopeSnapshot;
  reusedExistingEnvelope: boolean;
}

export interface RecordMessageDeliveryEvidenceResult {
  bundle: Phase3ClinicianMessageBundle;
  evidenceBundle: MessageDeliveryEvidenceBundleSnapshot;
  reusedExisting: boolean;
}

export interface IngestPatientReplyResult {
  bundle: Phase3ClinicianMessageBundle;
  reply: MessagePatientReplySnapshot;
  reusedExisting: boolean;
}

export interface Phase3ClinicianMessageKernelRepositories {
  getMessageThread(threadId: string): Promise<ClinicianMessageThreadSnapshot | null>;
  saveMessageThread(
    thread: ClinicianMessageThreadSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentMessageThreadForTask(taskId: string): Promise<ClinicianMessageThreadSnapshot | null>;
  getCurrentMessageThreadForSeed(
    clinicianMessageSeedRef: string,
  ): Promise<ClinicianMessageThreadSnapshot | null>;
  listMessageThreadsForTask(taskId: string): Promise<readonly ClinicianMessageThreadSnapshot[]>;

  getMessageDispatchEnvelope(
    messageDispatchEnvelopeId: string,
  ): Promise<MessageDispatchEnvelopeSnapshot | null>;
  saveMessageDispatchEnvelope(
    envelope: MessageDispatchEnvelopeSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentMessageDispatchEnvelopeForThread(
    threadRef: string,
  ): Promise<MessageDispatchEnvelopeSnapshot | null>;
  findMessageDispatchEnvelopeByNaturalKey(
    threadRef: string,
    threadVersionRef: string,
    dispatchFenceEpoch: number,
  ): Promise<MessageDispatchEnvelopeSnapshot | null>;
  listMessageDispatchEnvelopesForThread(
    threadRef: string,
  ): Promise<readonly MessageDispatchEnvelopeSnapshot[]>;

  getMessageDeliveryEvidenceBundle(
    messageDeliveryEvidenceBundleId: string,
  ): Promise<MessageDeliveryEvidenceBundleSnapshot | null>;
  saveMessageDeliveryEvidenceBundle(
    bundle: MessageDeliveryEvidenceBundleSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentMessageDeliveryEvidenceBundleForThread(
    threadRef: string,
  ): Promise<MessageDeliveryEvidenceBundleSnapshot | null>;
  findMessageDeliveryEvidenceBundleByCausalToken(
    threadRef: string,
    causalToken: string,
  ): Promise<MessageDeliveryEvidenceBundleSnapshot | null>;
  listMessageDeliveryEvidenceBundlesForThread(
    threadRef: string,
  ): Promise<readonly MessageDeliveryEvidenceBundleSnapshot[]>;

  getThreadExpectationEnvelope(
    threadExpectationEnvelopeId: string,
  ): Promise<ThreadExpectationEnvelopeSnapshot | null>;
  saveThreadExpectationEnvelope(
    envelope: ThreadExpectationEnvelopeSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentThreadExpectationEnvelopeForThread(
    threadRef: string,
  ): Promise<ThreadExpectationEnvelopeSnapshot | null>;
  findThreadExpectationEnvelopeByCausalToken(
    threadRef: string,
    causalToken: string,
  ): Promise<ThreadExpectationEnvelopeSnapshot | null>;
  listThreadExpectationEnvelopesForThread(
    threadRef: string,
  ): Promise<readonly ThreadExpectationEnvelopeSnapshot[]>;

  getThreadResolutionGate(threadResolutionGateId: string): Promise<ThreadResolutionGateSnapshot | null>;
  saveThreadResolutionGate(
    gate: ThreadResolutionGateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentThreadResolutionGateForThread(
    threadRef: string,
  ): Promise<ThreadResolutionGateSnapshot | null>;
  findThreadResolutionGateByCausalToken(
    threadRef: string,
    causalToken: string,
  ): Promise<ThreadResolutionGateSnapshot | null>;
  listThreadResolutionGatesForThread(
    threadRef: string,
  ): Promise<readonly ThreadResolutionGateSnapshot[]>;

  getMessagePatientReply(messagePatientReplyId: string): Promise<MessagePatientReplySnapshot | null>;
  saveMessagePatientReply(
    reply: MessagePatientReplySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentMessagePatientReplyForThread(threadRef: string): Promise<MessagePatientReplySnapshot | null>;
  findMessagePatientReplyByCausalToken(
    threadRef: string,
    causalToken: string,
  ): Promise<MessagePatientReplySnapshot | null>;
  listMessagePatientRepliesForThread(
    threadRef: string,
  ): Promise<readonly MessagePatientReplySnapshot[]>;

  withMessageThreadBoundary<T>(operation: () => Promise<T>): Promise<T>;
}

class InMemoryPhase3ClinicianMessageKernelStore
  implements Phase3ClinicianMessageKernelRepositories
{
  private readonly threads = new Map<string, ClinicianMessageThreadSnapshot>();
  private readonly threadsByTask = new Map<string, string[]>();
  private readonly currentThreadByTask = new Map<string, string>();
  private readonly currentThreadBySeed = new Map<string, string>();

  private readonly dispatchEnvelopes = new Map<string, MessageDispatchEnvelopeSnapshot>();
  private readonly dispatchEnvelopesByThread = new Map<string, string[]>();
  private readonly currentDispatchEnvelopeByThread = new Map<string, string>();
  private readonly dispatchEnvelopeByNaturalKey = new Map<string, string>();

  private readonly deliveryBundles = new Map<string, MessageDeliveryEvidenceBundleSnapshot>();
  private readonly deliveryBundlesByThread = new Map<string, string[]>();
  private readonly currentDeliveryBundleByThread = new Map<string, string>();
  private readonly deliveryBundleByCausalToken = new Map<string, string>();

  private readonly expectationEnvelopes = new Map<string, ThreadExpectationEnvelopeSnapshot>();
  private readonly expectationEnvelopesByThread = new Map<string, string[]>();
  private readonly currentExpectationEnvelopeByThread = new Map<string, string>();
  private readonly expectationEnvelopeByCausalToken = new Map<string, string>();

  private readonly resolutionGates = new Map<string, ThreadResolutionGateSnapshot>();
  private readonly resolutionGatesByThread = new Map<string, string[]>();
  private readonly currentResolutionGateByThread = new Map<string, string>();
  private readonly resolutionGateByCausalToken = new Map<string, string>();

  private readonly replies = new Map<string, MessagePatientReplySnapshot>();
  private readonly repliesByThread = new Map<string, string[]>();
  private readonly currentReplyByThread = new Map<string, string>();
  private readonly replyByCausalToken = new Map<string, string>();

  private boundaryQueue: Promise<void> = Promise.resolve();

  async withMessageThreadBoundary<T>(operation: () => Promise<T>): Promise<T> {
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

  async getMessageThread(threadId: string): Promise<ClinicianMessageThreadSnapshot | null> {
    return this.threads.get(threadId) ?? null;
  }

  async saveMessageThread(
    thread: ClinicianMessageThreadSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.threads, thread.threadId, thread, options);
    const existing = this.threadsByTask.get(thread.sourceTriageTaskRef) ?? [];
    if (!existing.includes(thread.threadId)) {
      this.threadsByTask.set(thread.sourceTriageTaskRef, [...existing, thread.threadId]);
    }
    this.currentThreadByTask.set(thread.sourceTriageTaskRef, thread.threadId);
    this.currentThreadBySeed.set(thread.clinicianMessageSeedRef, thread.threadId);
  }

  async getCurrentMessageThreadForTask(
    taskId: string,
  ): Promise<ClinicianMessageThreadSnapshot | null> {
    const current = this.currentThreadByTask.get(taskId);
    return current ? (this.threads.get(current) ?? null) : null;
  }

  async getCurrentMessageThreadForSeed(
    clinicianMessageSeedRef: string,
  ): Promise<ClinicianMessageThreadSnapshot | null> {
    const current = this.currentThreadBySeed.get(clinicianMessageSeedRef);
    return current ? (this.threads.get(current) ?? null) : null;
  }

  async listMessageThreadsForTask(
    taskId: string,
  ): Promise<readonly ClinicianMessageThreadSnapshot[]> {
    return (this.threadsByTask.get(taskId) ?? [])
      .map((id) => this.threads.get(id))
      .filter((entry): entry is ClinicianMessageThreadSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async getMessageDispatchEnvelope(
    messageDispatchEnvelopeId: string,
  ): Promise<MessageDispatchEnvelopeSnapshot | null> {
    return this.dispatchEnvelopes.get(messageDispatchEnvelopeId) ?? null;
  }

  async saveMessageDispatchEnvelope(
    envelope: MessageDispatchEnvelopeSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.dispatchEnvelopes,
      envelope.messageDispatchEnvelopeId,
      envelope,
      options,
    );
    const existing = this.dispatchEnvelopesByThread.get(envelope.threadRef) ?? [];
    if (!existing.includes(envelope.messageDispatchEnvelopeId)) {
      this.dispatchEnvelopesByThread.set(envelope.threadRef, [
        ...existing,
        envelope.messageDispatchEnvelopeId,
      ]);
    }
    this.currentDispatchEnvelopeByThread.set(envelope.threadRef, envelope.messageDispatchEnvelopeId);
    this.dispatchEnvelopeByNaturalKey.set(
      `${envelope.threadRef}::${envelope.threadVersionRef}::${envelope.dispatchFenceEpoch}`,
      envelope.messageDispatchEnvelopeId,
    );
  }

  async getCurrentMessageDispatchEnvelopeForThread(
    threadRef: string,
  ): Promise<MessageDispatchEnvelopeSnapshot | null> {
    const current = this.currentDispatchEnvelopeByThread.get(threadRef);
    return current ? (this.dispatchEnvelopes.get(current) ?? null) : null;
  }

  async findMessageDispatchEnvelopeByNaturalKey(
    threadRef: string,
    threadVersionRef: string,
    dispatchFenceEpoch: number,
  ): Promise<MessageDispatchEnvelopeSnapshot | null> {
    const current = this.dispatchEnvelopeByNaturalKey.get(
      `${threadRef}::${threadVersionRef.trim()}::${dispatchFenceEpoch}`,
    );
    return current ? (this.dispatchEnvelopes.get(current) ?? null) : null;
  }

  async listMessageDispatchEnvelopesForThread(
    threadRef: string,
  ): Promise<readonly MessageDispatchEnvelopeSnapshot[]> {
    return (this.dispatchEnvelopesByThread.get(threadRef) ?? [])
      .map((id) => this.dispatchEnvelopes.get(id))
      .filter((entry): entry is MessageDispatchEnvelopeSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async getMessageDeliveryEvidenceBundle(
    messageDeliveryEvidenceBundleId: string,
  ): Promise<MessageDeliveryEvidenceBundleSnapshot | null> {
    return this.deliveryBundles.get(messageDeliveryEvidenceBundleId) ?? null;
  }

  async saveMessageDeliveryEvidenceBundle(
    bundle: MessageDeliveryEvidenceBundleSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.deliveryBundles, bundle.messageDeliveryEvidenceBundleId, bundle, options);
    const existing = this.deliveryBundlesByThread.get(bundle.threadRef) ?? [];
    if (!existing.includes(bundle.messageDeliveryEvidenceBundleId)) {
      this.deliveryBundlesByThread.set(bundle.threadRef, [
        ...existing,
        bundle.messageDeliveryEvidenceBundleId,
      ]);
    }
    this.currentDeliveryBundleByThread.set(bundle.threadRef, bundle.messageDeliveryEvidenceBundleId);
    this.deliveryBundleByCausalToken.set(
      `${bundle.threadRef}::${bundle.causalToken}`,
      bundle.messageDeliveryEvidenceBundleId,
    );
  }

  async getCurrentMessageDeliveryEvidenceBundleForThread(
    threadRef: string,
  ): Promise<MessageDeliveryEvidenceBundleSnapshot | null> {
    const current = this.currentDeliveryBundleByThread.get(threadRef);
    return current ? (this.deliveryBundles.get(current) ?? null) : null;
  }

  async findMessageDeliveryEvidenceBundleByCausalToken(
    threadRef: string,
    causalToken: string,
  ): Promise<MessageDeliveryEvidenceBundleSnapshot | null> {
    const current = this.deliveryBundleByCausalToken.get(`${threadRef}::${causalToken.trim()}`);
    return current ? (this.deliveryBundles.get(current) ?? null) : null;
  }

  async listMessageDeliveryEvidenceBundlesForThread(
    threadRef: string,
  ): Promise<readonly MessageDeliveryEvidenceBundleSnapshot[]> {
    return (this.deliveryBundlesByThread.get(threadRef) ?? [])
      .map((id) => this.deliveryBundles.get(id))
      .filter((entry): entry is MessageDeliveryEvidenceBundleSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt));
  }

  async getThreadExpectationEnvelope(
    threadExpectationEnvelopeId: string,
  ): Promise<ThreadExpectationEnvelopeSnapshot | null> {
    return this.expectationEnvelopes.get(threadExpectationEnvelopeId) ?? null;
  }

  async saveThreadExpectationEnvelope(
    envelope: ThreadExpectationEnvelopeSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.expectationEnvelopes,
      envelope.threadExpectationEnvelopeId,
      envelope,
      options,
    );
    const existing = this.expectationEnvelopesByThread.get(envelope.threadRef) ?? [];
    if (!existing.includes(envelope.threadExpectationEnvelopeId)) {
      this.expectationEnvelopesByThread.set(envelope.threadRef, [
        ...existing,
        envelope.threadExpectationEnvelopeId,
      ]);
    }
    this.currentExpectationEnvelopeByThread.set(envelope.threadRef, envelope.threadExpectationEnvelopeId);
    this.expectationEnvelopeByCausalToken.set(
      `${envelope.threadRef}::${envelope.causalToken}`,
      envelope.threadExpectationEnvelopeId,
    );
  }

  async getCurrentThreadExpectationEnvelopeForThread(
    threadRef: string,
  ): Promise<ThreadExpectationEnvelopeSnapshot | null> {
    const current = this.currentExpectationEnvelopeByThread.get(threadRef);
    return current ? (this.expectationEnvelopes.get(current) ?? null) : null;
  }

  async findThreadExpectationEnvelopeByCausalToken(
    threadRef: string,
    causalToken: string,
  ): Promise<ThreadExpectationEnvelopeSnapshot | null> {
    const current = this.expectationEnvelopeByCausalToken.get(
      `${threadRef}::${causalToken.trim()}`,
    );
    return current ? (this.expectationEnvelopes.get(current) ?? null) : null;
  }

  async listThreadExpectationEnvelopesForThread(
    threadRef: string,
  ): Promise<readonly ThreadExpectationEnvelopeSnapshot[]> {
    return (this.expectationEnvelopesByThread.get(threadRef) ?? [])
      .map((id) => this.expectationEnvelopes.get(id))
      .filter((entry): entry is ThreadExpectationEnvelopeSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async getThreadResolutionGate(
    threadResolutionGateId: string,
  ): Promise<ThreadResolutionGateSnapshot | null> {
    return this.resolutionGates.get(threadResolutionGateId) ?? null;
  }

  async saveThreadResolutionGate(
    gate: ThreadResolutionGateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.resolutionGates, gate.threadResolutionGateId, gate, options);
    const existing = this.resolutionGatesByThread.get(gate.threadRef) ?? [];
    if (!existing.includes(gate.threadResolutionGateId)) {
      this.resolutionGatesByThread.set(gate.threadRef, [...existing, gate.threadResolutionGateId]);
    }
    this.currentResolutionGateByThread.set(gate.threadRef, gate.threadResolutionGateId);
    this.resolutionGateByCausalToken.set(
      `${gate.threadRef}::${gate.causalToken}`,
      gate.threadResolutionGateId,
    );
  }

  async getCurrentThreadResolutionGateForThread(
    threadRef: string,
  ): Promise<ThreadResolutionGateSnapshot | null> {
    const current = this.currentResolutionGateByThread.get(threadRef);
    return current ? (this.resolutionGates.get(current) ?? null) : null;
  }

  async findThreadResolutionGateByCausalToken(
    threadRef: string,
    causalToken: string,
  ): Promise<ThreadResolutionGateSnapshot | null> {
    const current = this.resolutionGateByCausalToken.get(`${threadRef}::${causalToken.trim()}`);
    return current ? (this.resolutionGates.get(current) ?? null) : null;
  }

  async listThreadResolutionGatesForThread(
    threadRef: string,
  ): Promise<readonly ThreadResolutionGateSnapshot[]> {
    return (this.resolutionGatesByThread.get(threadRef) ?? [])
      .map((id) => this.resolutionGates.get(id))
      .filter((entry): entry is ThreadResolutionGateSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.decidedAt, right.decidedAt));
  }

  async getMessagePatientReply(
    messagePatientReplyId: string,
  ): Promise<MessagePatientReplySnapshot | null> {
    return this.replies.get(messagePatientReplyId) ?? null;
  }

  async saveMessagePatientReply(
    reply: MessagePatientReplySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.replies, reply.messagePatientReplyId, reply, options);
    const existing = this.repliesByThread.get(reply.threadRef) ?? [];
    if (!existing.includes(reply.messagePatientReplyId)) {
      this.repliesByThread.set(reply.threadRef, [...existing, reply.messagePatientReplyId]);
    }
    this.currentReplyByThread.set(reply.threadRef, reply.messagePatientReplyId);
    this.replyByCausalToken.set(`${reply.threadRef}::${reply.causalToken}`, reply.messagePatientReplyId);
  }

  async getCurrentMessagePatientReplyForThread(
    threadRef: string,
  ): Promise<MessagePatientReplySnapshot | null> {
    const current = this.currentReplyByThread.get(threadRef);
    return current ? (this.replies.get(current) ?? null) : null;
  }

  async findMessagePatientReplyByCausalToken(
    threadRef: string,
    causalToken: string,
  ): Promise<MessagePatientReplySnapshot | null> {
    const current = this.replyByCausalToken.get(`${threadRef}::${causalToken.trim()}`);
    return current ? (this.replies.get(current) ?? null) : null;
  }

  async listMessagePatientRepliesForThread(
    threadRef: string,
  ): Promise<readonly MessagePatientReplySnapshot[]> {
    return (this.repliesByThread.get(threadRef) ?? [])
      .map((id) => this.replies.get(id))
      .filter((entry): entry is MessagePatientReplySnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.repliedAt, right.repliedAt));
  }
}

function normalizeMessageThread(input: ClinicianMessageThreadSnapshot): ClinicianMessageThreadSnapshot {
  ensurePositiveInteger(input.version, "version");
  ensurePositiveInteger(input.ownershipEpoch, "ownershipEpoch");
  ensurePositiveInteger(input.currentLineageFenceEpoch, "currentLineageFenceEpoch");
  invariant(
    threadStates.includes(input.state),
    "INVALID_CLINICIAN_MESSAGE_THREAD_STATE",
    "Unsupported ClinicianMessageThread.state.",
  );
  invariant(
    approvalRequiredStates.includes(input.approvalRequiredState),
    "INVALID_MESSAGE_APPROVAL_REQUIRED_STATE",
    "Unsupported ClinicianMessageThread.approvalRequiredState.",
  );
  invariant(
    input.dispatchFenceCounter >= 0,
    "INVALID_DISPATCH_FENCE_COUNTER",
    "dispatchFenceCounter must be >= 0.",
  );
  invariant(
    expectationStates.includes(input.patientVisibleExpectationState),
    "INVALID_THREAD_EXPECTATION_STATE",
    "Unsupported patient-visible expectation state.",
  );
  return {
    ...input,
    threadId: requireRef(input.threadId, "threadId"),
    sourceTriageTaskRef: requireRef(input.sourceTriageTaskRef, "sourceTriageTaskRef"),
    clinicianMessageSeedRef: requireRef(input.clinicianMessageSeedRef, "clinicianMessageSeedRef"),
    episodeRef: requireRef(input.episodeRef, "episodeRef"),
    requestId: requireRef(input.requestId, "requestId"),
    requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
    lineageCaseLinkRef: requireRef(input.lineageCaseLinkRef, "lineageCaseLinkRef"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    decisionId: requireRef(input.decisionId, "decisionId"),
    threadPurposeRef: requireRef(input.threadPurposeRef, "threadPurposeRef"),
    closureRuleRef: requireRef(input.closureRuleRef, "closureRuleRef"),
    authorActorRef: requireRef(input.authorActorRef, "authorActorRef"),
    approverActorRef: optionalRef(input.approverActorRef),
    latestDraftRef: requireRef(input.latestDraftRef, "latestDraftRef"),
    messageSubject: requireRef(input.messageSubject, "messageSubject"),
    messageBody: requireRef(input.messageBody, "messageBody"),
    activeDispatchEnvelopeRef: optionalRef(input.activeDispatchEnvelopeRef),
    latestDeliveryEvidenceBundleRef: optionalRef(input.latestDeliveryEvidenceBundleRef),
    currentExpectationEnvelopeRef: optionalRef(input.currentExpectationEnvelopeRef),
    activeResolutionGateRef: optionalRef(input.activeResolutionGateRef),
    latestReplyRef: optionalRef(input.latestReplyRef),
    reachabilityDependencyRef: optionalRef(input.reachabilityDependencyRef),
    requestLifecycleLeaseRef: requireRef(input.requestLifecycleLeaseRef, "requestLifecycleLeaseRef"),
    leaseAuthorityRef: requireRef(input.leaseAuthorityRef, "leaseAuthorityRef"),
    fencingToken: requireRef(input.fencingToken, "fencingToken"),
    callbackEscalationRef: optionalRef(input.callbackEscalationRef),
    closedAt: optionalRef(input.closedAt),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(input.updatedAt, "updatedAt"),
  };
}

function normalizeDispatchEnvelope(
  input: MessageDispatchEnvelopeSnapshot,
): MessageDispatchEnvelopeSnapshot {
  ensurePositiveInteger(input.version, "version");
  ensurePositiveInteger(input.dispatchFenceEpoch, "dispatchFenceEpoch");
  ensurePositiveInteger(input.ownershipEpochRef, "ownershipEpochRef");
  ensurePositiveInteger(input.monotoneRevision, "monotoneRevision");
  invariant(
    repairIntents.includes(input.repairIntent),
    "INVALID_MESSAGE_REPAIR_INTENT",
    "Unsupported MessageDispatchEnvelope.repairIntent.",
  );
  invariant(
    transportStates.includes(input.transportState),
    "INVALID_MESSAGE_TRANSPORT_STATE",
    "Unsupported MessageDispatchEnvelope.transportState.",
  );
  invariant(
    deliveryEvidenceStates.includes(input.deliveryEvidenceState),
    "INVALID_MESSAGE_DELIVERY_EVIDENCE_STATE",
    "Unsupported MessageDispatchEnvelope.deliveryEvidenceState.",
  );
  return {
    ...input,
    messageDispatchEnvelopeId: requireRef(
      input.messageDispatchEnvelopeId,
      "messageDispatchEnvelopeId",
    ),
    threadRef: requireRef(input.threadRef, "threadRef"),
    threadVersionRef: requireRef(input.threadVersionRef, "threadVersionRef"),
    draftRef: requireRef(input.draftRef, "draftRef"),
    approvedByRef: optionalRef(input.approvedByRef),
    deliveryPlanRef: requireRef(input.deliveryPlanRef, "deliveryPlanRef"),
    contactRouteRef: optionalRef(input.contactRouteRef),
    routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
    requestLifecycleLeaseRef: requireRef(input.requestLifecycleLeaseRef, "requestLifecycleLeaseRef"),
    fencingToken: requireRef(input.fencingToken, "fencingToken"),
    commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
    idempotencyRecordRef: requireRef(input.idempotencyRecordRef, "idempotencyRecordRef"),
    adapterDispatchAttemptRef: requireRef(
      input.adapterDispatchAttemptRef,
      "adapterDispatchAttemptRef",
    ),
    adapterEffectKey: requireRef(input.adapterEffectKey, "adapterEffectKey"),
    latestReceiptCheckpointRef: optionalRef(input.latestReceiptCheckpointRef),
    supportMutationAttemptRef: optionalRef(input.supportMutationAttemptRef),
    supportActionRecordRef: optionalRef(input.supportActionRecordRef),
    channelTemplateRef: requireRef(input.channelTemplateRef, "channelTemplateRef"),
    currentDeliveryConfidenceRef: requireRef(
      input.currentDeliveryConfidenceRef,
      "currentDeliveryConfidenceRef",
    ),
    deliveryModelVersionRef: requireRef(input.deliveryModelVersionRef, "deliveryModelVersionRef"),
    calibrationVersion: requireRef(input.calibrationVersion, "calibrationVersion"),
    causalToken: requireRef(input.causalToken, "causalToken"),
    idempotencyKey: requireRef(input.idempotencyKey, "idempotencyKey"),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
  };
}

function normalizeDeliveryEvidenceBundle(
  input: MessageDeliveryEvidenceBundleSnapshot,
): MessageDeliveryEvidenceBundleSnapshot {
  ensurePositiveInteger(input.version, "version");
  ensurePositiveInteger(input.dispatchFenceEpoch, "dispatchFenceEpoch");
  invariant(
    deliveryEvidenceStates.includes(input.deliveryState),
    "INVALID_MESSAGE_DELIVERY_STATE",
    "Unsupported MessageDeliveryEvidenceBundle.deliveryState.",
  );
  invariant(
    evidenceStrengths.includes(input.evidenceStrength),
    "INVALID_MESSAGE_EVIDENCE_STRENGTH",
    "Unsupported MessageDeliveryEvidenceBundle.evidenceStrength.",
  );
  return {
    ...input,
    messageDeliveryEvidenceBundleId: requireRef(
      input.messageDeliveryEvidenceBundleId,
      "messageDeliveryEvidenceBundleId",
    ),
    threadRef: requireRef(input.threadRef, "threadRef"),
    dispatchEnvelopeRef: requireRef(input.dispatchEnvelopeRef, "dispatchEnvelopeRef"),
    threadVersionRef: requireRef(input.threadVersionRef, "threadVersionRef"),
    receiptCheckpointRef: requireRef(input.receiptCheckpointRef, "receiptCheckpointRef"),
    providerDispositionRef: requireRef(input.providerDispositionRef, "providerDispositionRef"),
    deliveryArtifactRefs: uniqueSorted(input.deliveryArtifactRefs),
    reachabilityDependencyRef: optionalRef(input.reachabilityDependencyRef),
    supportActionSettlementRef: optionalRef(input.supportActionSettlementRef),
    causalToken: requireRef(input.causalToken, "causalToken"),
    recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
  };
}

function normalizeExpectationEnvelope(
  input: ThreadExpectationEnvelopeSnapshot,
): ThreadExpectationEnvelopeSnapshot {
  ensurePositiveInteger(input.version, "version");
  ensurePositiveInteger(input.monotoneRevision, "monotoneRevision");
  invariant(
    expectationStates.includes(input.patientVisibleState),
    "INVALID_THREAD_EXPECTATION_PATIENT_VISIBLE_STATE",
    "Unsupported ThreadExpectationEnvelope.patientVisibleState.",
  );
  invariant(
    deliveryRiskStates.includes(input.deliveryRiskState),
    "INVALID_THREAD_DELIVERY_RISK_STATE",
    "Unsupported ThreadExpectationEnvelope.deliveryRiskState.",
  );
  invariant(
    confidenceBands.includes(input.stateConfidenceBand),
    "INVALID_THREAD_CONFIDENCE_BAND",
    "Unsupported ThreadExpectationEnvelope.stateConfidenceBand.",
  );
  return {
    ...input,
    threadExpectationEnvelopeId: requireRef(
      input.threadExpectationEnvelopeId,
      "threadExpectationEnvelopeId",
    ),
    threadRef: requireRef(input.threadRef, "threadRef"),
    reachabilityDependencyRef: optionalRef(input.reachabilityDependencyRef),
    contactRepairJourneyRef: optionalRef(input.contactRepairJourneyRef),
    identityRepairBranchDispositionRef: optionalRef(input.identityRepairBranchDispositionRef),
    replyWindowRef: requireRef(input.replyWindowRef, "replyWindowRef"),
    fallbackGuidanceRef: requireRef(input.fallbackGuidanceRef, "fallbackGuidanceRef"),
    routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
    requiredReleaseApprovalFreezeRef: optionalRef(input.requiredReleaseApprovalFreezeRef),
    channelReleaseFreezeState: requireRef(
      input.channelReleaseFreezeState,
      "channelReleaseFreezeState",
    ),
    requiredAssuranceSliceTrustRefs: uniqueSorted(input.requiredAssuranceSliceTrustRefs),
    latestSupportActionSettlementRef: optionalRef(input.latestSupportActionSettlementRef),
    transitionEnvelopeRef: requireRef(input.transitionEnvelopeRef, "transitionEnvelopeRef"),
    continuityEvidenceRef: requireRef(input.continuityEvidenceRef, "continuityEvidenceRef"),
    freezeDispositionRef: optionalRef(input.freezeDispositionRef),
    causalToken: requireRef(input.causalToken, "causalToken"),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
  };
}

function normalizeResolutionGate(input: ThreadResolutionGateSnapshot): ThreadResolutionGateSnapshot {
  ensurePositiveInteger(input.version, "version");
  ensurePositiveInteger(input.monotoneRevision, "monotoneRevision");
  invariant(
    resolutionDecisions.includes(input.decision),
    "INVALID_THREAD_RESOLUTION_DECISION",
    "Unsupported ThreadResolutionGate.decision.",
  );
  return {
    ...input,
    threadResolutionGateId: requireRef(input.threadResolutionGateId, "threadResolutionGateId"),
    threadRef: requireRef(input.threadRef, "threadRef"),
    latestDispatchRef: requireRef(input.latestDispatchRef, "latestDispatchRef"),
    latestReplyRef: optionalRef(input.latestReplyRef),
    latestExpectationEnvelopeRef: requireRef(
      input.latestExpectationEnvelopeRef,
      "latestExpectationEnvelopeRef",
    ),
    latestSupportActionSettlementRef: optionalRef(input.latestSupportActionSettlementRef),
    decisionReasonRef: requireRef(input.decisionReasonRef, "decisionReasonRef"),
    sameShellRecoveryRef: optionalRef(input.sameShellRecoveryRef),
    causalToken: requireRef(input.causalToken, "causalToken"),
    decidedAt: ensureIsoTimestamp(input.decidedAt, "decidedAt"),
  };
}

function normalizeMessagePatientReply(
  input: MessagePatientReplySnapshot,
): MessagePatientReplySnapshot {
  ensurePositiveInteger(input.version, "version");
  invariant(
    replyClassificationHints.includes(input.classificationHint),
    "INVALID_MESSAGE_REPLY_CLASSIFICATION_HINT",
    "Unsupported MessagePatientReply.classificationHint.",
  );
  return {
    ...input,
    messagePatientReplyId: requireRef(input.messagePatientReplyId, "messagePatientReplyId"),
    threadRef: requireRef(input.threadRef, "threadRef"),
    requestId: requireRef(input.requestId, "requestId"),
    requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
    dispatchEnvelopeRef: requireRef(input.dispatchEnvelopeRef, "dispatchEnvelopeRef"),
    threadVersionRef: requireRef(input.threadVersionRef, "threadVersionRef"),
    replyRouteFamilyRef: requireRef(input.replyRouteFamilyRef, "replyRouteFamilyRef"),
    replyChannelRef: requireRef(input.replyChannelRef, "replyChannelRef"),
    replyText: requireRef(input.replyText, "replyText"),
    replyArtifactRefs: uniqueSorted(input.replyArtifactRefs),
    providerCorrelationRef: optionalRef(input.providerCorrelationRef),
    secureEntryGrantRef: optionalRef(input.secureEntryGrantRef),
    causalToken: requireRef(input.causalToken, "causalToken"),
    repliedAt: ensureIsoTimestamp(input.repliedAt, "repliedAt"),
  };
}

function assertLegalThreadTransition(
  currentState: ClinicianMessageThreadState,
  nextState: ClinicianMessageThreadState,
): void {
  if (currentState === nextState) {
    return;
  }
  invariant(
    clinicianMessageLegalTransitions[currentState].includes(nextState),
    "ILLEGAL_THREAD_TRANSITION",
    `ClinicianMessageThread cannot transition from ${currentState} to ${nextState}.`,
  );
}

export interface Phase3ClinicianMessageKernelService {
  queryThreadBundle(threadId: string): Promise<Phase3ClinicianMessageBundle>;
  queryCurrentThreadBundleForTask(taskId: string): Promise<Phase3ClinicianMessageBundle | null>;
  createMessageThread(input: CreateClinicianMessageThreadInput): Promise<CreateClinicianMessageThreadResult>;
  saveDraft(input: SaveClinicianMessageDraftInput): Promise<Phase3ClinicianMessageBundle>;
  approveDraft(input: ApproveClinicianMessageDraftInput): Promise<Phase3ClinicianMessageBundle>;
  dispatchThread(input: DispatchClinicianMessageInput): Promise<DispatchClinicianMessageResult>;
  observeProviderReceipt(input: ObserveMessageProviderReceiptInput): Promise<Phase3ClinicianMessageBundle>;
  recordDeliveryEvidence(
    input: RecordMessageDeliveryEvidenceInput,
  ): Promise<RecordMessageDeliveryEvidenceResult>;
  ingestPatientReply(input: IngestPatientReplyInput): Promise<IngestPatientReplyResult>;
  settleResolutionGate(input: SettleThreadResolutionGateInput): Promise<Phase3ClinicianMessageBundle>;
  closeThread(input: CloseClinicianMessageThreadInput): Promise<Phase3ClinicianMessageBundle>;
  reopenThread(input: ReopenClinicianMessageThreadInput): Promise<Phase3ClinicianMessageBundle>;
  listMessageThreadsForTask(taskId: string): Promise<readonly ClinicianMessageThreadSnapshot[]>;
}

class Phase3ClinicianMessageKernelServiceImpl
  implements Phase3ClinicianMessageKernelService
{
  constructor(
    private readonly repositories: Phase3ClinicianMessageKernelRepositories,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  async queryThreadBundle(threadId: string): Promise<Phase3ClinicianMessageBundle> {
    const messageThread = await this.requireMessageThread(threadId);
    const [
      currentDispatchEnvelope,
      currentDeliveryEvidenceBundle,
      currentExpectationEnvelope,
      currentResolutionGate,
      latestReply,
    ] = await Promise.all([
      this.repositories.getCurrentMessageDispatchEnvelopeForThread(threadId),
      this.repositories.getCurrentMessageDeliveryEvidenceBundleForThread(threadId),
      this.repositories.getCurrentThreadExpectationEnvelopeForThread(threadId),
      this.repositories.getCurrentThreadResolutionGateForThread(threadId),
      this.repositories.getCurrentMessagePatientReplyForThread(threadId),
    ]);
    return {
      messageThread,
      currentDispatchEnvelope,
      currentDeliveryEvidenceBundle,
      currentExpectationEnvelope,
      currentResolutionGate,
      latestReply,
    };
  }

  async queryCurrentThreadBundleForTask(
    taskId: string,
  ): Promise<Phase3ClinicianMessageBundle | null> {
    const thread = await this.repositories.getCurrentMessageThreadForTask(taskId);
    return thread ? this.queryThreadBundle(thread.threadId) : null;
  }

  async createMessageThread(
    input: CreateClinicianMessageThreadInput,
  ): Promise<CreateClinicianMessageThreadResult> {
    return this.repositories.withMessageThreadBoundary(async () => {
      const existing = await this.repositories.getCurrentMessageThreadForSeed(
        input.clinicianMessageSeedRef,
      );
      if (existing) {
        return {
          bundle: await this.queryThreadBundle(existing.threadId),
          reusedExisting: true,
        };
      }

      const createdAt = ensureIsoTimestamp(input.createdAt, "createdAt");
      const thread = normalizeMessageThread({
        threadId: input.threadId,
        sourceTriageTaskRef: input.sourceTriageTaskRef,
        clinicianMessageSeedRef: input.clinicianMessageSeedRef,
        episodeRef: input.episodeRef,
        requestId: input.requestId,
        requestLineageRef: input.requestLineageRef,
        lineageCaseLinkRef: input.lineageCaseLinkRef,
        decisionEpochRef: input.decisionEpochRef,
        decisionId: input.decisionId,
        state: "drafted",
        threadPurposeRef: input.threadPurposeRef,
        closureRuleRef: input.closureRuleRef,
        authorActorRef: input.authorActorRef,
        approverActorRef: null,
        approvalRequiredState: input.approvalRequiredState,
        latestDraftRef: `${input.threadId}@draft.v1`,
        messageSubject: input.messageSubject,
        messageBody: input.messageBody,
        dispatchFenceCounter: 0,
        activeDispatchEnvelopeRef: null,
        latestDeliveryEvidenceBundleRef: null,
        currentExpectationEnvelopeRef: input.initialExpectationEnvelope.threadExpectationEnvelopeId,
        activeResolutionGateRef: null,
        latestReplyRef: null,
        reachabilityDependencyRef: optionalRef(input.initialExpectationEnvelope.reachabilityDependencyRef),
        requestLifecycleLeaseRef: input.requestLifecycleLeaseRef,
        leaseAuthorityRef: input.leaseAuthorityRef,
        ownershipEpoch: input.ownershipEpoch,
        fencingToken: input.fencingToken,
        currentLineageFenceEpoch: input.currentLineageFenceEpoch,
        patientVisibleExpectationState: input.initialExpectationEnvelope.patientVisibleState,
        reSafetyRequired: false,
        callbackEscalationRef: null,
        closedAt: null,
        createdAt,
        updatedAt: createdAt,
        version: 1,
      });
      await this.repositories.saveMessageThread(thread);

      const expectationEnvelope = normalizeExpectationEnvelope({
        ...input.initialExpectationEnvelope,
        threadRef: thread.threadId,
        monotoneRevision: 1,
        version: 1,
      });
      await this.repositories.saveThreadExpectationEnvelope(expectationEnvelope);

      return {
        bundle: await this.queryThreadBundle(thread.threadId),
        reusedExisting: false,
      };
    });
  }

  async saveDraft(input: SaveClinicianMessageDraftInput): Promise<Phase3ClinicianMessageBundle> {
    return this.repositories.withMessageThreadBoundary(async () => {
      const thread = await this.requireMessageThread(input.threadRef);
      invariant(
        thread.state === "drafted" ||
          thread.state === "approved" ||
          thread.state === "reopened" ||
          thread.state === "contact_route_repair_pending",
        "MESSAGE_THREAD_NOT_DRAFTABLE",
        "Draft changes require a thread that is still writable.",
      );
      const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      const nextThread = normalizeMessageThread({
        ...thread,
        state:
          thread.state === "approved" || thread.state === "contact_route_repair_pending"
            ? "drafted"
            : thread.state,
        authorActorRef: input.authorActorRef,
        latestDraftRef: `${thread.threadId}@draft.v${thread.version + 1}`,
        messageSubject: input.messageSubject,
        messageBody: input.messageBody,
        approverActorRef:
          thread.approvalRequiredState === "required" ? null : thread.approverActorRef,
        updatedAt: recordedAt,
        version: nextVersion(thread.version),
      });
      await this.repositories.saveMessageThread(nextThread, {
        expectedVersion: thread.version,
      });
      return this.queryThreadBundle(thread.threadId);
    });
  }

  async approveDraft(
    input: ApproveClinicianMessageDraftInput,
  ): Promise<Phase3ClinicianMessageBundle> {
    return this.repositories.withMessageThreadBoundary(async () => {
      const thread = await this.requireMessageThread(input.threadRef);
      invariant(
        thread.state === "drafted" || thread.state === "approved" || thread.state === "reopened",
        "MESSAGE_THREAD_NOT_APPROVABLE",
        "Only drafted or reopened threads may be approved.",
      );
      const approvedAt = ensureIsoTimestamp(input.approvedAt, "approvedAt");
      const nextThread = normalizeMessageThread({
        ...thread,
        state: "approved",
        approverActorRef: input.approvedByRef,
        updatedAt: approvedAt,
        version: nextVersion(thread.version),
      });
      await this.repositories.saveMessageThread(nextThread, {
        expectedVersion: thread.version,
      });
      return this.queryThreadBundle(thread.threadId);
    });
  }

  async dispatchThread(
    input: DispatchClinicianMessageInput,
  ): Promise<DispatchClinicianMessageResult> {
    return this.repositories.withMessageThreadBoundary(async () => {
      const thread = await this.requireMessageThread(input.threadRef);
      const existing = await this.repositories.findMessageDispatchEnvelopeByNaturalKey(
        thread.threadId,
        input.dispatchEnvelope.threadVersionRef,
        input.dispatchEnvelope.dispatchFenceEpoch,
      );
      if (existing) {
        return {
          bundle: await this.queryThreadBundle(thread.threadId),
          dispatchEnvelope: existing,
          reusedExistingEnvelope: true,
        };
      }

      assertLegalThreadTransition(thread.state, input.nextState);
      const dispatchedAt = ensureIsoTimestamp(input.dispatchedAt, "dispatchedAt");
      const currentExpectation =
        await this.repositories.getCurrentThreadExpectationEnvelopeForThread(thread.threadId);
      const currentDispatch =
        await this.repositories.getCurrentMessageDispatchEnvelopeForThread(thread.threadId);

      const dispatchEnvelope = normalizeDispatchEnvelope({
        ...input.dispatchEnvelope,
        threadRef: thread.threadId,
        monotoneRevision: (currentDispatch?.monotoneRevision ?? 0) + 1,
        version: 1,
      });
      await this.repositories.saveMessageDispatchEnvelope(dispatchEnvelope);

      const expectationEnvelope = normalizeExpectationEnvelope({
        ...input.expectationEnvelope,
        threadRef: thread.threadId,
        monotoneRevision: (currentExpectation?.monotoneRevision ?? 0) + 1,
        version: 1,
      });
      await this.repositories.saveThreadExpectationEnvelope(expectationEnvelope);

      const nextThread = normalizeMessageThread({
        ...thread,
        state: input.nextState,
        dispatchFenceCounter: Math.max(thread.dispatchFenceCounter, dispatchEnvelope.dispatchFenceEpoch),
        activeDispatchEnvelopeRef: dispatchEnvelope.messageDispatchEnvelopeId,
        latestDeliveryEvidenceBundleRef: null,
        currentExpectationEnvelopeRef: expectationEnvelope.threadExpectationEnvelopeId,
        patientVisibleExpectationState: expectationEnvelope.patientVisibleState,
        reachabilityDependencyRef: expectationEnvelope.reachabilityDependencyRef,
        updatedAt: dispatchedAt,
        version: nextVersion(thread.version),
      });
      await this.repositories.saveMessageThread(nextThread, {
        expectedVersion: thread.version,
      });

      return {
        bundle: await this.queryThreadBundle(thread.threadId),
        dispatchEnvelope,
        reusedExistingEnvelope: false,
      };
    });
  }

  async observeProviderReceipt(
    input: ObserveMessageProviderReceiptInput,
  ): Promise<Phase3ClinicianMessageBundle> {
    return this.repositories.withMessageThreadBoundary(async () => {
      const thread = await this.requireMessageThread(input.threadRef);
      const envelope = await this.requireDispatchEnvelope(input.messageDispatchEnvelopeId);
      invariant(
        envelope.threadRef === thread.threadId,
        "MESSAGE_DISPATCH_THREAD_MISMATCH",
        "MessageDispatchEnvelope does not belong to the thread.",
      );
      const nextEnvelope = normalizeDispatchEnvelope({
        ...envelope,
        latestReceiptCheckpointRef: input.receiptCheckpointRef,
        transportState: input.nextTransportState,
        version: nextVersion(envelope.version),
      });
      await this.repositories.saveMessageDispatchEnvelope(nextEnvelope, {
        expectedVersion: envelope.version,
      });
      return this.queryThreadBundle(thread.threadId);
    });
  }

  async recordDeliveryEvidence(
    input: RecordMessageDeliveryEvidenceInput,
  ): Promise<RecordMessageDeliveryEvidenceResult> {
    return this.repositories.withMessageThreadBoundary(async () => {
      const thread = await this.requireMessageThread(input.threadRef);
      const existing = await this.repositories.findMessageDeliveryEvidenceBundleByCausalToken(
        thread.threadId,
        input.evidenceBundle.causalToken,
      );
      if (existing) {
        return {
          bundle: await this.queryThreadBundle(thread.threadId),
          evidenceBundle: existing,
          reusedExisting: true,
        };
      }

      assertLegalThreadTransition(thread.state, input.nextState);
      const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      const currentDispatch =
        await this.repositories.getCurrentMessageDispatchEnvelopeForThread(thread.threadId);
      invariant(
        currentDispatch,
        "MESSAGE_DISPATCH_ENVELOPE_REQUIRED",
        "A live MessageDispatchEnvelope is required.",
      );
      const currentExpectation =
        await this.repositories.getCurrentThreadExpectationEnvelopeForThread(thread.threadId);
      const evidenceBundle = normalizeDeliveryEvidenceBundle({
        ...input.evidenceBundle,
        threadRef: thread.threadId,
        version: 1,
      });
      await this.repositories.saveMessageDeliveryEvidenceBundle(evidenceBundle);

      const nextExpectationEnvelope = normalizeExpectationEnvelope({
        ...input.expectationEnvelope,
        threadRef: thread.threadId,
        monotoneRevision: (currentExpectation?.monotoneRevision ?? 0) + 1,
        version: 1,
      });
      await this.repositories.saveThreadExpectationEnvelope(nextExpectationEnvelope);

      const nextDispatch = normalizeDispatchEnvelope({
        ...currentDispatch,
        latestReceiptCheckpointRef: evidenceBundle.receiptCheckpointRef,
        deliveryEvidenceState: evidenceBundle.deliveryState,
        transportState:
          evidenceBundle.deliveryState === "delivered"
            ? "provider_accepted"
            : currentDispatch.transportState === "drafted" ||
                currentDispatch.transportState === "approved"
              ? "provider_rejected"
              : currentDispatch.transportState,
        currentDeliveryConfidenceRef: `delivery_confidence_${evidenceBundle.evidenceStrength}`,
        version: nextVersion(currentDispatch.version),
      });
      await this.repositories.saveMessageDispatchEnvelope(nextDispatch, {
        expectedVersion: currentDispatch.version,
      });

      const nextThread = normalizeMessageThread({
        ...thread,
        state: input.nextState,
        latestDeliveryEvidenceBundleRef: evidenceBundle.messageDeliveryEvidenceBundleId,
        currentExpectationEnvelopeRef: nextExpectationEnvelope.threadExpectationEnvelopeId,
        patientVisibleExpectationState: nextExpectationEnvelope.patientVisibleState,
        reachabilityDependencyRef:
          evidenceBundle.reachabilityDependencyRef ?? nextExpectationEnvelope.reachabilityDependencyRef,
        updatedAt: recordedAt,
        version: nextVersion(thread.version),
      });
      await this.repositories.saveMessageThread(nextThread, {
        expectedVersion: thread.version,
      });

      return {
        bundle: await this.queryThreadBundle(thread.threadId),
        evidenceBundle,
        reusedExisting: false,
      };
    });
  }

  async ingestPatientReply(input: IngestPatientReplyInput): Promise<IngestPatientReplyResult> {
    return this.repositories.withMessageThreadBoundary(async () => {
      const thread = await this.requireMessageThread(input.threadRef);
      const existing = await this.repositories.findMessagePatientReplyByCausalToken(
        thread.threadId,
        input.reply.causalToken,
      );
      if (existing) {
        return {
          bundle: await this.queryThreadBundle(thread.threadId),
          reply: existing,
          reusedExisting: true,
        };
      }

      assertLegalThreadTransition(thread.state, input.nextState);
      const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      const currentDispatch =
        await this.repositories.getCurrentMessageDispatchEnvelopeForThread(thread.threadId);
      invariant(
        currentDispatch,
        "MESSAGE_DISPATCH_ENVELOPE_REQUIRED",
        "A live MessageDispatchEnvelope is required.",
      );
      const currentExpectation =
        await this.repositories.getCurrentThreadExpectationEnvelopeForThread(thread.threadId);
      const reply = normalizeMessagePatientReply({
        ...input.reply,
        threadRef: thread.threadId,
        version: 1,
      });
      await this.repositories.saveMessagePatientReply(reply);

      const nextExpectationEnvelope = normalizeExpectationEnvelope({
        ...input.expectationEnvelope,
        threadRef: thread.threadId,
        monotoneRevision: (currentExpectation?.monotoneRevision ?? 0) + 1,
        version: 1,
      });
      await this.repositories.saveThreadExpectationEnvelope(nextExpectationEnvelope);

      const nextThread = normalizeMessageThread({
        ...thread,
        state: input.nextState,
        latestReplyRef: reply.messagePatientReplyId,
        currentExpectationEnvelopeRef: nextExpectationEnvelope.threadExpectationEnvelopeId,
        patientVisibleExpectationState: nextExpectationEnvelope.patientVisibleState,
        reSafetyRequired: reply.reSafetyRequired,
        updatedAt: recordedAt,
        version: nextVersion(thread.version),
      });
      await this.repositories.saveMessageThread(nextThread, {
        expectedVersion: thread.version,
      });

      return {
        bundle: await this.queryThreadBundle(thread.threadId),
        reply,
        reusedExisting: false,
      };
    });
  }

  async settleResolutionGate(
    input: SettleThreadResolutionGateInput,
  ): Promise<Phase3ClinicianMessageBundle> {
    return this.repositories.withMessageThreadBoundary(async () => {
      const thread = await this.requireMessageThread(input.threadRef);
      const existing = await this.repositories.findThreadResolutionGateByCausalToken(
        thread.threadId,
        input.resolutionGate.causalToken,
      );
      if (existing) {
        return this.queryThreadBundle(thread.threadId);
      }

      assertLegalThreadTransition(thread.state, input.nextState);
      const decidedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      const currentExpectation =
        await this.repositories.getCurrentThreadExpectationEnvelopeForThread(thread.threadId);
      const currentResolution =
        await this.repositories.getCurrentThreadResolutionGateForThread(thread.threadId);

      let expectationEnvelopeId = thread.currentExpectationEnvelopeRef;
      let patientVisibleExpectationState = thread.patientVisibleExpectationState;
      let reachabilityDependencyRef = thread.reachabilityDependencyRef;

      if (input.expectationEnvelope) {
        const expectationEnvelope = normalizeExpectationEnvelope({
          ...input.expectationEnvelope,
          threadRef: thread.threadId,
          monotoneRevision: (currentExpectation?.monotoneRevision ?? 0) + 1,
          version: 1,
        });
        await this.repositories.saveThreadExpectationEnvelope(expectationEnvelope);
        expectationEnvelopeId = expectationEnvelope.threadExpectationEnvelopeId;
        patientVisibleExpectationState = expectationEnvelope.patientVisibleState;
        reachabilityDependencyRef = expectationEnvelope.reachabilityDependencyRef;
      }

      const resolutionGate = normalizeResolutionGate({
        ...input.resolutionGate,
        threadRef: thread.threadId,
        monotoneRevision: (currentResolution?.monotoneRevision ?? 0) + 1,
        version: 1,
      });
      await this.repositories.saveThreadResolutionGate(resolutionGate);

      const nextThread = normalizeMessageThread({
        ...thread,
        state: input.nextState,
        currentExpectationEnvelopeRef: expectationEnvelopeId,
        activeResolutionGateRef: resolutionGate.threadResolutionGateId,
        patientVisibleExpectationState,
        reachabilityDependencyRef,
        callbackEscalationRef:
          resolutionGate.decision === "escalate_to_callback"
            ? optionalRef(input.callbackEscalationRef)
            : thread.callbackEscalationRef,
        closedAt:
          input.nextState === "closed"
            ? optionalRef(thread.closedAt) ?? decidedAt
            : thread.closedAt,
        updatedAt: decidedAt,
        version: nextVersion(thread.version),
      });
      await this.repositories.saveMessageThread(nextThread, {
        expectedVersion: thread.version,
      });

      return this.queryThreadBundle(thread.threadId);
    });
  }

  async closeThread(
    input: CloseClinicianMessageThreadInput,
  ): Promise<Phase3ClinicianMessageBundle> {
    return this.repositories.withMessageThreadBoundary(async () => {
      const thread = await this.requireMessageThread(input.threadRef);
      invariant(
        thread.state === "closed",
        "MESSAGE_THREAD_NOT_CLOSED",
        "The thread must already be closed through ThreadResolutionGate.",
      );
      if (thread.closedAt) {
        return this.queryThreadBundle(thread.threadId);
      }
      const closedAt = ensureIsoTimestamp(input.closedAt, "closedAt");
      const nextThread = normalizeMessageThread({
        ...thread,
        closedAt,
        updatedAt: closedAt,
        version: nextVersion(thread.version),
      });
      await this.repositories.saveMessageThread(nextThread, {
        expectedVersion: thread.version,
      });
      return this.queryThreadBundle(thread.threadId);
    });
  }

  async reopenThread(
    input: ReopenClinicianMessageThreadInput,
  ): Promise<Phase3ClinicianMessageBundle> {
    return this.repositories.withMessageThreadBoundary(async () => {
      const thread = await this.requireMessageThread(input.threadRef);
      assertLegalThreadTransition(thread.state, input.nextState);
      const reopenedAt = ensureIsoTimestamp(input.reopenedAt, "reopenedAt");
      const currentExpectation =
        await this.repositories.getCurrentThreadExpectationEnvelopeForThread(thread.threadId);
      const expectationEnvelope = normalizeExpectationEnvelope({
        ...input.expectationEnvelope,
        threadRef: thread.threadId,
        monotoneRevision: (currentExpectation?.monotoneRevision ?? 0) + 1,
        version: 1,
      });
      await this.repositories.saveThreadExpectationEnvelope(expectationEnvelope);

      const nextThread = normalizeMessageThread({
        ...thread,
        state: input.nextState,
        currentExpectationEnvelopeRef: expectationEnvelope.threadExpectationEnvelopeId,
        requestLifecycleLeaseRef: input.requestLifecycleLeaseRef,
        leaseAuthorityRef: input.leaseAuthorityRef,
        ownershipEpoch: input.ownershipEpoch,
        fencingToken: input.fencingToken,
        currentLineageFenceEpoch: input.currentLineageFenceEpoch,
        patientVisibleExpectationState: expectationEnvelope.patientVisibleState,
        reachabilityDependencyRef: expectationEnvelope.reachabilityDependencyRef,
        closedAt: null,
        updatedAt: reopenedAt,
        version: nextVersion(thread.version),
      });
      await this.repositories.saveMessageThread(nextThread, {
        expectedVersion: thread.version,
      });
      return this.queryThreadBundle(thread.threadId);
    });
  }

  async listMessageThreadsForTask(
    taskId: string,
  ): Promise<readonly ClinicianMessageThreadSnapshot[]> {
    return this.repositories.listMessageThreadsForTask(taskId);
  }

  private async requireMessageThread(threadId: string): Promise<ClinicianMessageThreadSnapshot> {
    const thread = await this.repositories.getMessageThread(threadId);
    invariant(thread, "MESSAGE_THREAD_NOT_FOUND", `ClinicianMessageThread ${threadId} is required.`);
    return thread;
  }

  private async requireDispatchEnvelope(
    messageDispatchEnvelopeId: string,
  ): Promise<MessageDispatchEnvelopeSnapshot> {
    const envelope = await this.repositories.getMessageDispatchEnvelope(messageDispatchEnvelopeId);
    invariant(
      envelope,
      "MESSAGE_DISPATCH_ENVELOPE_NOT_FOUND",
      `MessageDispatchEnvelope ${messageDispatchEnvelopeId} is required.`,
    );
    return envelope;
  }
}

export function createPhase3ClinicianMessageKernelStore(): Phase3ClinicianMessageKernelRepositories {
  return new InMemoryPhase3ClinicianMessageKernelStore();
}

export function createPhase3ClinicianMessageKernelService(
  repositories: Phase3ClinicianMessageKernelRepositories,
  options?: { idGenerator?: BackboneIdGenerator },
): Phase3ClinicianMessageKernelService {
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("phase3_clinician_message_kernel");
  return new Phase3ClinicianMessageKernelServiceImpl(repositories, idGenerator);
}
