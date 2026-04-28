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

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
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

function nextKernelId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function addMinutes(iso: string, minutes: number): string {
  const date = new Date(iso);
  invariant(!Number.isNaN(date.getTime()), "INVALID_BASE_TIMESTAMP", "Base timestamp is invalid.");
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString();
}

function startOfDayUtc(iso: string): Date {
  const date = new Date(iso);
  invariant(!Number.isNaN(date.getTime()), "INVALID_BASE_TIMESTAMP", "Base timestamp is invalid.");
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
  );
}

function atUtcHour(base: string, hour: number, minute = 0): string {
  const day = startOfDayUtc(base);
  day.setUTCHours(hour, minute, 0, 0);
  return day.toISOString();
}

export type CallbackCaseState =
  | "created"
  | "queued"
  | "scheduled"
  | "ready_for_attempt"
  | "attempt_in_progress"
  | "awaiting_outcome_evidence"
  | "answered"
  | "no_answer"
  | "voicemail_left"
  | "contact_route_repair_pending"
  | "awaiting_retry"
  | "escalation_review"
  | "completed"
  | "cancelled"
  | "expired"
  | "closed"
  | "reopened";

export type CallbackLeaseMode =
  | "queued"
  | "scheduled"
  | "ready_for_attempt"
  | "suspended_for_repair";

export type CallbackAttemptSettlementState =
  | "initiated"
  | "provider_acked"
  | "outcome_pending"
  | "settled"
  | "reconcile_required";

export type CallbackPatientVisibleState =
  | "queued"
  | "scheduled"
  | "attempting_now"
  | "retry_planned"
  | "route_repair_required"
  | "escalated"
  | "closed";

export type CallbackWindowRiskState =
  | "on_track"
  | "at_risk"
  | "missed_window"
  | "repair_required";

export type CallbackStateConfidenceBand = "high" | "medium" | "low";
export type CallbackOutcome =
  | "answered"
  | "no_answer"
  | "voicemail_left"
  | "route_invalid"
  | "provider_failure";
export type CallbackSafetyClassification =
  | "technical_only"
  | "potentially_clinical"
  | "contact_safety_relevant";
export type CallbackSafetyPreemptionState = "clear" | "pending";
export type CallbackResolutionDecision = "retry" | "escalate" | "complete" | "cancel" | "expire";
export type CallbackRouteAuthorityState = "current" | "repair_required" | "drifted";
export type CallbackVoicemailAllowedState = "allowed" | "disallowed" | "ambiguous";
export type CallbackVoicemailCompletionDisposition =
  | "retry"
  | "complete"
  | "escalate"
  | "evidence_only";

const callbackCaseStates: readonly CallbackCaseState[] = [
  "created",
  "queued",
  "scheduled",
  "ready_for_attempt",
  "attempt_in_progress",
  "awaiting_outcome_evidence",
  "answered",
  "no_answer",
  "voicemail_left",
  "contact_route_repair_pending",
  "awaiting_retry",
  "escalation_review",
  "completed",
  "cancelled",
  "expired",
  "closed",
  "reopened",
];

const callbackLeaseModes: readonly CallbackLeaseMode[] = [
  "queued",
  "scheduled",
  "ready_for_attempt",
  "suspended_for_repair",
];

const callbackAttemptSettlementStates: readonly CallbackAttemptSettlementState[] = [
  "initiated",
  "provider_acked",
  "outcome_pending",
  "settled",
  "reconcile_required",
];

const callbackPatientVisibleStates: readonly CallbackPatientVisibleState[] = [
  "queued",
  "scheduled",
  "attempting_now",
  "retry_planned",
  "route_repair_required",
  "escalated",
  "closed",
];

const callbackWindowRiskStates: readonly CallbackWindowRiskState[] = [
  "on_track",
  "at_risk",
  "missed_window",
  "repair_required",
];

const callbackConfidenceBands: readonly CallbackStateConfidenceBand[] = [
  "high",
  "medium",
  "low",
];

const callbackOutcomes: readonly CallbackOutcome[] = [
  "answered",
  "no_answer",
  "voicemail_left",
  "route_invalid",
  "provider_failure",
];

const callbackSafetyClassifications: readonly CallbackSafetyClassification[] = [
  "technical_only",
  "potentially_clinical",
  "contact_safety_relevant",
];

const callbackSafetyPreemptionStates: readonly CallbackSafetyPreemptionState[] = [
  "clear",
  "pending",
];

const callbackResolutionDecisions: readonly CallbackResolutionDecision[] = [
  "retry",
  "escalate",
  "complete",
  "cancel",
  "expire",
];

const callbackRouteAuthorityStates: readonly CallbackRouteAuthorityState[] = [
  "current",
  "repair_required",
  "drifted",
];

const callbackVoicemailAllowedStates: readonly CallbackVoicemailAllowedState[] = [
  "allowed",
  "disallowed",
  "ambiguous",
];

const callbackVoicemailCompletionDispositions: readonly CallbackVoicemailCompletionDisposition[] = [
  "retry",
  "complete",
  "escalate",
  "evidence_only",
];

export const callbackLegalTransitions: Readonly<
  Record<CallbackCaseState, readonly CallbackCaseState[]>
> = {
  created: ["queued", "scheduled"],
  queued: ["scheduled", "cancelled"],
  scheduled: ["ready_for_attempt", "awaiting_retry", "contact_route_repair_pending", "cancelled"],
  ready_for_attempt: ["attempt_in_progress", "awaiting_retry", "contact_route_repair_pending"],
  attempt_in_progress: ["awaiting_outcome_evidence", "contact_route_repair_pending"],
  awaiting_outcome_evidence: [
    "answered",
    "no_answer",
    "voicemail_left",
    "contact_route_repair_pending",
  ],
  answered: ["completed", "escalation_review"],
  no_answer: ["awaiting_retry", "contact_route_repair_pending", "escalation_review", "expired"],
  voicemail_left: [
    "awaiting_retry",
    "contact_route_repair_pending",
    "completed",
    "escalation_review",
  ],
  contact_route_repair_pending: ["awaiting_retry", "escalation_review", "cancelled"],
  awaiting_retry: ["scheduled", "ready_for_attempt", "expired", "cancelled"],
  escalation_review: ["completed", "cancelled", "expired"],
  completed: ["closed"],
  cancelled: ["closed"],
  expired: ["closed"],
  closed: ["reopened"],
  reopened: ["queued", "scheduled"],
} as const;

export interface CallbackCaseSnapshot {
  callbackCaseId: string;
  sourceTriageTaskRef: string;
  callbackSeedRef: string;
  episodeRef: string;
  requestId: string;
  requestLineageRef: string;
  lineageCaseLinkRef: string;
  decisionEpochRef: string;
  decisionId: string;
  state: CallbackCaseState;
  callbackUrgencyRef: string;
  preferredWindowRef: string;
  serviceWindowRef: string;
  contactRouteRef: string;
  fallbackRouteRef: string;
  activeIntentLeaseRef: string | null;
  attemptCounter: number;
  latestSettledAttemptRef: string | null;
  currentExpectationEnvelopeRef: string | null;
  latestOutcomeEvidenceBundleRef: string | null;
  activeResolutionGateRef: string | null;
  retryPolicyRef: string;
  reachabilityDependencyRef: string | null;
  patientVisibleExpectationState: CallbackPatientVisibleState;
  latestAttemptOutcome: CallbackOutcome | null;
  stalePromiseSuppressedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CallbackIntentLeaseSnapshot {
  callbackIntentLeaseId: string;
  callbackCaseRef: string;
  requestLifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  ownedByActorRef: string;
  ownedBySessionRef: string | null;
  serviceWindowRef: string;
  contactRouteRef: string;
  routeIntentBindingRef: string;
  lineageFenceEpoch: number;
  ownershipEpoch: number;
  fencingToken: string;
  leaseMode: CallbackLeaseMode;
  caseVersionRef: string;
  lastHeartbeatAt: string;
  staleOwnerRecoveryRef: string | null;
  expiresAt: string;
  monotoneRevision: number;
  version: number;
}

export interface CallbackAttemptRecordSnapshot {
  callbackAttemptRecordId: string;
  callbackCaseRef: string;
  callbackIntentLeaseRef: string;
  requestLifecycleLeaseRef: string;
  attemptOrdinal: number;
  attemptFenceEpoch: number;
  ownershipEpochRef: number;
  fencingToken: string;
  dialTargetRef: string;
  channelProviderRef: string;
  commandActionRecordRef: string;
  idempotencyRecordRef: string;
  adapterDispatchAttemptRef: string;
  adapterEffectKey: string;
  latestReceiptCheckpointRef: string | null;
  latestReceiptDecisionClass: string | null;
  initiatedAt: string;
  settlementState: CallbackAttemptSettlementState;
  idempotencyKey: string;
  version: number;
}

export interface CallbackExpectationEnvelopeSnapshot {
  expectationEnvelopeId: string;
  callbackCaseRef: string;
  identityRepairBranchDispositionRef: string | null;
  patientVisibleState: CallbackPatientVisibleState;
  expectedWindowRef: string;
  windowLowerAt: string;
  windowUpperAt: string;
  windowRiskState: CallbackWindowRiskState;
  stateConfidenceBand: CallbackStateConfidenceBand;
  predictionModelRef: string;
  fallbackGuidanceRef: string;
  grantSetRef: string | null;
  routeIntentBindingRef: string;
  requiredReleaseApprovalFreezeRef: string | null;
  channelReleaseFreezeState: string;
  requiredAssuranceSliceTrustRefs: readonly string[];
  transitionEnvelopeRef: string;
  continuityEvidenceRef: string;
  causalToken: string;
  freezeDispositionRef: string | null;
  expectationReasonRef: string;
  monotoneRevision: number;
  createdAt: string;
  version: number;
}

export interface CallbackOutcomeEvidenceBundleSnapshot {
  callbackOutcomeEvidenceBundleId: string;
  callbackCaseRef: string;
  attemptRef: string;
  attemptFenceEpoch: number;
  outcome: CallbackOutcome;
  recordedByActorRef: string;
  recordedAt: string;
  routeEvidenceRef: string;
  providerDispositionRef: string | null;
  patientAcknowledgementRef: string | null;
  safetyClassification: CallbackSafetyClassification;
  safetyPreemptionState: CallbackSafetyPreemptionState;
  voicemailPolicyRef: string | null;
  voicemailEvidenceRefs: readonly string[];
  causalToken: string;
  version: number;
}

export interface CallbackResolutionGateSnapshot {
  callbackResolutionGateId: string;
  callbackCaseRef: string;
  latestAttemptRef: string;
  latestOutcomeEvidenceRef: string;
  latestExpectationEnvelopeRef: string;
  decision: CallbackResolutionDecision;
  decisionReasonRef: string;
  nextActionAt: string | null;
  stalePromiseRevocationRef: string | null;
  requiresLifecycleReview: boolean;
  causalToken: string;
  monotoneRevision: number;
  decidedAt: string;
  version: number;
}

export interface Phase3CallbackBundle {
  callbackCase: CallbackCaseSnapshot;
  currentIntentLease: CallbackIntentLeaseSnapshot | null;
  latestAttempt: CallbackAttemptRecordSnapshot | null;
  currentExpectationEnvelope: CallbackExpectationEnvelopeSnapshot | null;
  latestOutcomeEvidenceBundle: CallbackOutcomeEvidenceBundleSnapshot | null;
  currentResolutionGate: CallbackResolutionGateSnapshot | null;
}

export interface CallbackAttemptWindowPolicyInput {
  callbackUrgencyRef: string;
  preferredWindowRef: string;
  serviceWindowRef: string;
  routeAuthorityState: CallbackRouteAuthorityState;
  recordedAt: string;
}

export interface CallbackAttemptWindowPolicyDecision {
  expectedWindowRef: string;
  windowLowerAt: string;
  windowUpperAt: string;
  windowRiskState: CallbackWindowRiskState;
  stateConfidenceBand: CallbackStateConfidenceBand;
  predictionModelRef: string;
  fallbackGuidanceRef: string;
  policyReasonRefs: readonly string[];
}

export interface CallbackVoicemailPolicyInput {
  pathwayRef: string;
  tenantPolicyRef: string | null;
  callbackUrgencyRef: string;
  explicitPermissionState: "granted" | "not_granted" | "unknown";
  containsClinicalContent: boolean;
  verifiedTargetState: "verified" | "unknown";
}

export interface CallbackVoicemailPolicyDecision {
  voicemailAllowedState: CallbackVoicemailAllowedState;
  scriptClassRef: string | null;
  requiredEvidenceRefs: readonly string[];
  completionDisposition: CallbackVoicemailCompletionDisposition;
  policyRef: string;
  reasonRefs: readonly string[];
}

export interface CallbackResolutionDecisionInput {
  latestAttemptOrdinal: number;
  maxAttempts: number;
  outcome: CallbackOutcome;
  routeAuthorityState: CallbackRouteAuthorityState;
  safetyPreemptionState: CallbackSafetyPreemptionState;
  expectationWindowUpperAt: string;
  evaluatedAt: string;
  voicemailDisposition?: CallbackVoicemailCompletionDisposition | null;
  explicitDecision?: CallbackResolutionDecision | null;
}

export interface CallbackResolutionDecisionEvaluation {
  decision: CallbackResolutionDecision;
  decisionReasonRef: string;
  nextActionAt: string | null;
  requiresLifecycleReview: boolean;
}

export function resolveCallbackAttemptWindowPolicy(
  input: CallbackAttemptWindowPolicyInput,
): CallbackAttemptWindowPolicyDecision {
  const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
  invariant(
    callbackRouteAuthorityStates.includes(input.routeAuthorityState),
    "INVALID_CALLBACK_ROUTE_AUTHORITY_STATE",
    "Unsupported callback route authority state.",
  );
  if (input.routeAuthorityState !== "current") {
    return {
      expectedWindowRef: `callback_window_${input.preferredWindowRef}_repair`,
      windowLowerAt: recordedAt,
      windowUpperAt: recordedAt,
      windowRiskState: "repair_required",
      stateConfidenceBand: "high",
      predictionModelRef: "callback_attempt_window_policy_repair_gate.v1",
      fallbackGuidanceRef: "CALLBACK_243_CONTACT_ROUTE_REPAIR_REQUIRED",
      policyReasonRefs: ["CALLBACK_243_CONTACT_ROUTE_REPAIR_REQUIRED"],
    };
  }

  const urgency = input.callbackUrgencyRef.toLowerCase();
  const durationMinutes =
    urgency.includes("urgent") || urgency.includes("same_day")
      ? 120
      : urgency.includes("routine_72h")
        ? 72 * 60
        : urgency.includes("routine")
          ? 24 * 60
          : 6 * 60;

  let lowerAt = recordedAt;
  const preferred = input.preferredWindowRef.toLowerCase();
  if (preferred.includes("after_18")) {
    const candidate = atUtcHour(recordedAt, 18, 0);
    lowerAt = compareIso(candidate, recordedAt) >= 0 ? candidate : atUtcHour(addMinutes(recordedAt, 1440), 18, 0);
  } else if (preferred.includes("before_12")) {
    const candidate = atUtcHour(recordedAt, 9, 0);
    lowerAt = compareIso(candidate, recordedAt) >= 0 ? candidate : atUtcHour(addMinutes(recordedAt, 1440), 9, 0);
  }

  const serviceWindow = input.serviceWindowRef.toLowerCase();
  if (serviceWindow.includes("daytime")) {
    const daytimeFloor = atUtcHour(lowerAt, 8, 0);
    if (compareIso(lowerAt, daytimeFloor) < 0) {
      lowerAt = daytimeFloor;
    }
  }

  const upperAt = addMinutes(lowerAt, durationMinutes);
  const windowRiskState = compareIso(recordedAt, upperAt) > 0 ? "missed_window" : "on_track";

  return {
    expectedWindowRef: `callback_window_${input.preferredWindowRef}_${input.serviceWindowRef}`,
    windowLowerAt: lowerAt,
    windowUpperAt: upperAt,
    windowRiskState,
    stateConfidenceBand: windowRiskState === "missed_window" ? "low" : "medium",
    predictionModelRef: "callback_attempt_window_policy_243.v1",
    fallbackGuidanceRef:
      windowRiskState === "missed_window"
        ? "CALLBACK_243_WINDOW_MISSED_REPLAN_REQUIRED"
        : "CALLBACK_243_WINDOW_ACTIVE",
    policyReasonRefs:
      windowRiskState === "missed_window"
        ? ["CALLBACK_243_WINDOW_MISSED_REPLAN_REQUIRED"]
        : ["CALLBACK_243_WINDOW_ACTIVE"],
  };
}

export function resolveCallbackVoicemailPolicy(
  input: CallbackVoicemailPolicyInput,
): CallbackVoicemailPolicyDecision {
  const pathway = requireRef(input.pathwayRef, "pathwayRef").toLowerCase();
  const urgency = requireRef(input.callbackUrgencyRef, "callbackUrgencyRef").toLowerCase();
  const tenantPolicyRef = optionalRef(input.tenantPolicyRef);

  if (
    input.containsClinicalContent ||
    urgency.includes("urgent") ||
    input.explicitPermissionState === "not_granted"
  ) {
    return {
      voicemailAllowedState: "disallowed",
      scriptClassRef: null,
      requiredEvidenceRefs: [],
      completionDisposition: "escalate",
      policyRef: tenantPolicyRef ?? "callback_voicemail_policy_safe_default_disallow",
      reasonRefs: [
        input.containsClinicalContent
          ? "CALLBACK_243_VOICEMAIL_CLINICAL_CONTENT_BLOCKED"
          : "CALLBACK_243_VOICEMAIL_PERMISSION_REQUIRED",
      ],
    };
  }

  if (input.explicitPermissionState === "unknown" || input.verifiedTargetState === "unknown") {
    return {
      voicemailAllowedState: "ambiguous",
      scriptClassRef: null,
      requiredEvidenceRefs: [],
      completionDisposition: "evidence_only",
      policyRef: tenantPolicyRef ?? "callback_voicemail_policy_safe_default_ambiguous",
      reasonRefs: ["CALLBACK_243_VOICEMAIL_POLICY_AMBIGUOUS"],
    };
  }

  const scriptClassRef = pathway.includes("admin")
    ? "callback_voicemail_script_minimal_identity_only"
    : "callback_voicemail_script_generic_callback_request";

  return {
    voicemailAllowedState: "allowed",
    scriptClassRef,
    requiredEvidenceRefs: [
      "CALLBACK_243_VOICEMAIL_RECORDING_CAPTURED",
      "CALLBACK_243_VOICEMAIL_SCRIPT_ATTESTED",
    ],
    completionDisposition: pathway.includes("admin") ? "complete" : "retry",
    policyRef: tenantPolicyRef ?? "callback_voicemail_policy_default_allowed",
    reasonRefs: ["CALLBACK_243_VOICEMAIL_ALLOWED"],
  };
}

export function evaluateCallbackResolutionDecision(
  input: CallbackResolutionDecisionInput,
): CallbackResolutionDecisionEvaluation {
  if (input.explicitDecision) {
    return {
      decision: input.explicitDecision,
      decisionReasonRef: `CALLBACK_243_EXPLICIT_${input.explicitDecision.toUpperCase()}_REQUESTED`,
      nextActionAt: null,
      requiresLifecycleReview: input.explicitDecision === "escalate",
    };
  }

  if (input.safetyPreemptionState === "pending") {
    return {
      decision: "escalate",
      decisionReasonRef: "CALLBACK_243_SAFETY_PREEMPTION_PENDING",
      nextActionAt: null,
      requiresLifecycleReview: true,
    };
  }

  if (input.outcome === "answered") {
    return {
      decision: "complete",
      decisionReasonRef: "CALLBACK_243_OUTCOME_ANSWERED_COMPLETE",
      nextActionAt: null,
      requiresLifecycleReview: false,
    };
  }

  if (input.outcome === "route_invalid" || input.routeAuthorityState !== "current") {
    return {
      decision: "retry",
      decisionReasonRef: "CALLBACK_243_CONTACT_ROUTE_REPAIR_REQUIRED",
      nextActionAt: null,
      requiresLifecycleReview: false,
    };
  }

  if (input.outcome === "voicemail_left") {
    const disposition = input.voicemailDisposition ?? "evidence_only";
    if (disposition === "complete") {
      return {
        decision: "complete",
        decisionReasonRef: "CALLBACK_243_VOICEMAIL_POLICY_ALLOWS_COMPLETE",
        nextActionAt: null,
        requiresLifecycleReview: false,
      };
    }
    if (disposition === "retry" || disposition === "evidence_only") {
      return {
        decision:
          input.latestAttemptOrdinal >= input.maxAttempts ? "escalate" : "retry",
        decisionReasonRef:
          disposition === "retry"
            ? "CALLBACK_243_VOICEMAIL_RETRY_REQUIRED"
            : "CALLBACK_243_VOICEMAIL_EVIDENCE_ONLY",
        nextActionAt:
          input.latestAttemptOrdinal >= input.maxAttempts
            ? null
            : addMinutes(input.evaluatedAt, 120),
        requiresLifecycleReview: input.latestAttemptOrdinal >= input.maxAttempts,
      };
    }
    return {
      decision: "escalate",
      decisionReasonRef: "CALLBACK_243_VOICEMAIL_POLICY_DISALLOWS_COMPLETE",
      nextActionAt: null,
      requiresLifecycleReview: true,
    };
  }

  if (compareIso(input.evaluatedAt, input.expectationWindowUpperAt) > 0) {
    return {
      decision: "expire",
      decisionReasonRef: "CALLBACK_243_EXPECTATION_WINDOW_EXPIRED",
      nextActionAt: null,
      requiresLifecycleReview: false,
    };
  }

  if (input.latestAttemptOrdinal >= input.maxAttempts) {
    return {
      decision: "escalate",
      decisionReasonRef: "CALLBACK_243_MAX_ATTEMPTS_REACHED",
      nextActionAt: null,
      requiresLifecycleReview: true,
    };
  }

  return {
    decision: "retry",
    decisionReasonRef:
      input.outcome === "provider_failure"
        ? "CALLBACK_243_PROVIDER_FAILURE_RETRY"
        : "CALLBACK_243_NO_ANSWER_RETRY",
    nextActionAt: addMinutes(input.evaluatedAt, 120),
    requiresLifecycleReview: false,
  };
}

export interface CreateCallbackCaseInput {
  callbackCaseId: string;
  sourceTriageTaskRef: string;
  callbackSeedRef: string;
  episodeRef: string;
  requestId: string;
  requestLineageRef: string;
  lineageCaseLinkRef: string;
  decisionEpochRef: string;
  decisionId: string;
  initialCaseState: CallbackCaseState;
  callbackUrgencyRef: string;
  preferredWindowRef: string;
  serviceWindowRef: string;
  contactRouteRef: string;
  fallbackRouteRef: string;
  retryPolicyRef: string;
  reachabilityDependencyRef?: string | null;
  createdAt: string;
  initialIntentLease: Omit<
    CallbackIntentLeaseSnapshot,
    "callbackCaseRef" | "caseVersionRef" | "monotoneRevision" | "version"
  >;
  initialExpectationEnvelope?: Omit<
    CallbackExpectationEnvelopeSnapshot,
    "callbackCaseRef" | "monotoneRevision" | "version"
  > | null;
}

export interface ScheduleCallbackInput {
  callbackCaseRef: string;
  nextCaseState: CallbackCaseState;
  callbackUrgencyRef?: string;
  preferredWindowRef?: string;
  fallbackRouteRef?: string | null;
  reachabilityDependencyRef?: string | null;
  intentLease: Omit<CallbackIntentLeaseSnapshot, "callbackCaseRef" | "caseVersionRef" | "version">;
  expectationEnvelope: Omit<
    CallbackExpectationEnvelopeSnapshot,
    "callbackCaseRef" | "monotoneRevision" | "version"
  >;
  recordedAt: string;
}

export interface InitiateCallbackAttemptInput {
  callbackCaseRef: string;
  nextCaseState: CallbackCaseState;
  attempt: Omit<CallbackAttemptRecordSnapshot, "callbackCaseRef" | "version">;
  expectationEnvelope: Omit<
    CallbackExpectationEnvelopeSnapshot,
    "callbackCaseRef" | "monotoneRevision" | "version"
  >;
  recordedAt: string;
}

export interface ObserveProviderReceiptInput {
  callbackCaseRef: string;
  callbackAttemptRecordId: string;
  receiptCheckpointRef: string;
  receiptDecisionClass: string;
  settlementState: CallbackAttemptSettlementState;
  observedAt: string;
}

export interface RecordOutcomeEvidenceInput {
  callbackCaseRef: string;
  nextCaseState: CallbackCaseState;
  reachabilityDependencyRef?: string | null;
  evidenceBundle: Omit<CallbackOutcomeEvidenceBundleSnapshot, "callbackCaseRef" | "version">;
  expectationEnvelope: Omit<
    CallbackExpectationEnvelopeSnapshot,
    "callbackCaseRef" | "monotoneRevision" | "version"
  > | null;
  recordedAt: string;
}

export interface SettleCallbackResolutionGateInput {
  callbackCaseRef: string;
  nextCaseState: CallbackCaseState;
  resolutionGate: Omit<CallbackResolutionGateSnapshot, "callbackCaseRef" | "monotoneRevision" | "version">;
  expectationEnvelope: Omit<
    CallbackExpectationEnvelopeSnapshot,
    "callbackCaseRef" | "monotoneRevision" | "version"
  > | null;
  recordedAt: string;
}

export interface CloseCallbackCaseInput {
  callbackCaseRef: string;
  closedAt: string;
}

export interface ReopenCallbackCaseInput {
  callbackCaseRef: string;
  nextCaseState: CallbackCaseState;
  intentLease: Omit<CallbackIntentLeaseSnapshot, "callbackCaseRef" | "caseVersionRef" | "version">;
  expectationEnvelope: Omit<
    CallbackExpectationEnvelopeSnapshot,
    "callbackCaseRef" | "monotoneRevision" | "version"
  >;
  reopenedAt: string;
}

export interface CreateCallbackCaseResult {
  bundle: Phase3CallbackBundle;
  reusedExisting: boolean;
}

export interface InitiateCallbackAttemptResult {
  bundle: Phase3CallbackBundle;
  callbackAttempt: CallbackAttemptRecordSnapshot;
  reusedExistingAttempt: boolean;
}

export interface RecordOutcomeEvidenceResult {
  bundle: Phase3CallbackBundle;
  outcomeEvidenceBundle: CallbackOutcomeEvidenceBundleSnapshot;
  reusedExisting: boolean;
}

export interface Phase3CallbackKernelRepositories {
  getCallbackCase(callbackCaseId: string): Promise<CallbackCaseSnapshot | null>;
  saveCallbackCase(
    callbackCase: CallbackCaseSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentCallbackCaseForTask(taskId: string): Promise<CallbackCaseSnapshot | null>;
  getCurrentCallbackCaseForSeed(callbackSeedRef: string): Promise<CallbackCaseSnapshot | null>;
  listCallbackCasesForTask(taskId: string): Promise<readonly CallbackCaseSnapshot[]>;

  getCallbackIntentLease(callbackIntentLeaseId: string): Promise<CallbackIntentLeaseSnapshot | null>;
  saveCallbackIntentLease(
    callbackIntentLease: CallbackIntentLeaseSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentCallbackIntentLeaseForCase(
    callbackCaseRef: string,
  ): Promise<CallbackIntentLeaseSnapshot | null>;
  listCallbackIntentLeasesForCase(
    callbackCaseRef: string,
  ): Promise<readonly CallbackIntentLeaseSnapshot[]>;

  getCallbackAttemptRecord(
    callbackAttemptRecordId: string,
  ): Promise<CallbackAttemptRecordSnapshot | null>;
  saveCallbackAttemptRecord(
    callbackAttemptRecord: CallbackAttemptRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentCallbackAttemptForCase(
    callbackCaseRef: string,
  ): Promise<CallbackAttemptRecordSnapshot | null>;
  findCallbackAttemptByNaturalKey(
    callbackCaseRef: string,
    attemptFenceEpoch: number,
    dialTargetRef: string,
  ): Promise<CallbackAttemptRecordSnapshot | null>;
  listCallbackAttemptsForCase(
    callbackCaseRef: string,
  ): Promise<readonly CallbackAttemptRecordSnapshot[]>;

  getCallbackExpectationEnvelope(
    expectationEnvelopeId: string,
  ): Promise<CallbackExpectationEnvelopeSnapshot | null>;
  saveCallbackExpectationEnvelope(
    expectationEnvelope: CallbackExpectationEnvelopeSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentCallbackExpectationEnvelopeForCase(
    callbackCaseRef: string,
  ): Promise<CallbackExpectationEnvelopeSnapshot | null>;
  findCallbackExpectationEnvelopeByCausalToken(
    callbackCaseRef: string,
    causalToken: string,
  ): Promise<CallbackExpectationEnvelopeSnapshot | null>;
  listCallbackExpectationEnvelopesForCase(
    callbackCaseRef: string,
  ): Promise<readonly CallbackExpectationEnvelopeSnapshot[]>;

  getCallbackOutcomeEvidenceBundle(
    callbackOutcomeEvidenceBundleId: string,
  ): Promise<CallbackOutcomeEvidenceBundleSnapshot | null>;
  saveCallbackOutcomeEvidenceBundle(
    callbackOutcomeEvidenceBundle: CallbackOutcomeEvidenceBundleSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentCallbackOutcomeEvidenceBundleForCase(
    callbackCaseRef: string,
  ): Promise<CallbackOutcomeEvidenceBundleSnapshot | null>;
  findCallbackOutcomeEvidenceBundleByCausalToken(
    callbackCaseRef: string,
    causalToken: string,
  ): Promise<CallbackOutcomeEvidenceBundleSnapshot | null>;
  listCallbackOutcomeEvidenceBundlesForCase(
    callbackCaseRef: string,
  ): Promise<readonly CallbackOutcomeEvidenceBundleSnapshot[]>;

  getCallbackResolutionGate(
    callbackResolutionGateId: string,
  ): Promise<CallbackResolutionGateSnapshot | null>;
  saveCallbackResolutionGate(
    callbackResolutionGate: CallbackResolutionGateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentCallbackResolutionGateForCase(
    callbackCaseRef: string,
  ): Promise<CallbackResolutionGateSnapshot | null>;
  findCallbackResolutionGateByCausalToken(
    callbackCaseRef: string,
    causalToken: string,
  ): Promise<CallbackResolutionGateSnapshot | null>;
  listCallbackResolutionGatesForCase(
    callbackCaseRef: string,
  ): Promise<readonly CallbackResolutionGateSnapshot[]>;

  withCallbackBoundary<T>(operation: () => Promise<T>): Promise<T>;
}

class InMemoryPhase3CallbackKernelStore implements Phase3CallbackKernelRepositories {
  private readonly callbackCases = new Map<string, CallbackCaseSnapshot>();
  private readonly callbackCasesByTask = new Map<string, string[]>();
  private readonly currentCallbackCaseByTask = new Map<string, string>();
  private readonly currentCallbackCaseBySeed = new Map<string, string>();

  private readonly callbackIntentLeases = new Map<string, CallbackIntentLeaseSnapshot>();
  private readonly callbackIntentLeasesByCase = new Map<string, string[]>();
  private readonly currentCallbackIntentLeaseByCase = new Map<string, string>();

  private readonly callbackAttempts = new Map<string, CallbackAttemptRecordSnapshot>();
  private readonly callbackAttemptsByCase = new Map<string, string[]>();
  private readonly currentCallbackAttemptByCase = new Map<string, string>();
  private readonly callbackAttemptByNaturalKey = new Map<string, string>();

  private readonly expectationEnvelopes = new Map<string, CallbackExpectationEnvelopeSnapshot>();
  private readonly expectationEnvelopesByCase = new Map<string, string[]>();
  private readonly currentExpectationEnvelopeByCase = new Map<string, string>();
  private readonly expectationEnvelopeByCausalToken = new Map<string, string>();

  private readonly outcomeEvidenceBundles = new Map<string, CallbackOutcomeEvidenceBundleSnapshot>();
  private readonly outcomeEvidenceBundlesByCase = new Map<string, string[]>();
  private readonly currentOutcomeEvidenceBundleByCase = new Map<string, string>();
  private readonly outcomeEvidenceBundleByCausalToken = new Map<string, string>();

  private readonly resolutionGates = new Map<string, CallbackResolutionGateSnapshot>();
  private readonly resolutionGatesByCase = new Map<string, string[]>();
  private readonly currentResolutionGateByCase = new Map<string, string>();
  private readonly resolutionGateByCausalToken = new Map<string, string>();

  private boundaryQueue: Promise<void> = Promise.resolve();

  async withCallbackBoundary<T>(operation: () => Promise<T>): Promise<T> {
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

  async getCallbackCase(callbackCaseId: string): Promise<CallbackCaseSnapshot | null> {
    return this.callbackCases.get(callbackCaseId) ?? null;
  }

  async saveCallbackCase(
    callbackCase: CallbackCaseSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.callbackCases, callbackCase.callbackCaseId, callbackCase, options);
    const existing = this.callbackCasesByTask.get(callbackCase.sourceTriageTaskRef) ?? [];
    if (!existing.includes(callbackCase.callbackCaseId)) {
      this.callbackCasesByTask.set(callbackCase.sourceTriageTaskRef, [
        ...existing,
        callbackCase.callbackCaseId,
      ]);
    }
    this.currentCallbackCaseByTask.set(
      callbackCase.sourceTriageTaskRef,
      callbackCase.callbackCaseId,
    );
    this.currentCallbackCaseBySeed.set(callbackCase.callbackSeedRef, callbackCase.callbackCaseId);
  }

  async getCurrentCallbackCaseForTask(taskId: string): Promise<CallbackCaseSnapshot | null> {
    const current = this.currentCallbackCaseByTask.get(taskId);
    return current ? (this.callbackCases.get(current) ?? null) : null;
  }

  async getCurrentCallbackCaseForSeed(
    callbackSeedRef: string,
  ): Promise<CallbackCaseSnapshot | null> {
    const current = this.currentCallbackCaseBySeed.get(callbackSeedRef);
    return current ? (this.callbackCases.get(current) ?? null) : null;
  }

  async listCallbackCasesForTask(taskId: string): Promise<readonly CallbackCaseSnapshot[]> {
    return (this.callbackCasesByTask.get(taskId) ?? [])
      .map((id) => this.callbackCases.get(id))
      .filter((entry): entry is CallbackCaseSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async getCallbackIntentLease(
    callbackIntentLeaseId: string,
  ): Promise<CallbackIntentLeaseSnapshot | null> {
    return this.callbackIntentLeases.get(callbackIntentLeaseId) ?? null;
  }

  async saveCallbackIntentLease(
    callbackIntentLease: CallbackIntentLeaseSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.callbackIntentLeases,
      callbackIntentLease.callbackIntentLeaseId,
      callbackIntentLease,
      options,
    );
    const existing = this.callbackIntentLeasesByCase.get(callbackIntentLease.callbackCaseRef) ?? [];
    if (!existing.includes(callbackIntentLease.callbackIntentLeaseId)) {
      this.callbackIntentLeasesByCase.set(callbackIntentLease.callbackCaseRef, [
        ...existing,
        callbackIntentLease.callbackIntentLeaseId,
      ]);
    }
    this.currentCallbackIntentLeaseByCase.set(
      callbackIntentLease.callbackCaseRef,
      callbackIntentLease.callbackIntentLeaseId,
    );
  }

  async getCurrentCallbackIntentLeaseForCase(
    callbackCaseRef: string,
  ): Promise<CallbackIntentLeaseSnapshot | null> {
    const current = this.currentCallbackIntentLeaseByCase.get(callbackCaseRef);
    return current ? (this.callbackIntentLeases.get(current) ?? null) : null;
  }

  async listCallbackIntentLeasesForCase(
    callbackCaseRef: string,
  ): Promise<readonly CallbackIntentLeaseSnapshot[]> {
    return (this.callbackIntentLeasesByCase.get(callbackCaseRef) ?? [])
      .map((id) => this.callbackIntentLeases.get(id))
      .filter((entry): entry is CallbackIntentLeaseSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.lastHeartbeatAt, right.lastHeartbeatAt));
  }

  async getCallbackAttemptRecord(
    callbackAttemptRecordId: string,
  ): Promise<CallbackAttemptRecordSnapshot | null> {
    return this.callbackAttempts.get(callbackAttemptRecordId) ?? null;
  }

  async saveCallbackAttemptRecord(
    callbackAttemptRecord: CallbackAttemptRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.callbackAttempts,
      callbackAttemptRecord.callbackAttemptRecordId,
      callbackAttemptRecord,
      options,
    );
    const existing = this.callbackAttemptsByCase.get(callbackAttemptRecord.callbackCaseRef) ?? [];
    if (!existing.includes(callbackAttemptRecord.callbackAttemptRecordId)) {
      this.callbackAttemptsByCase.set(callbackAttemptRecord.callbackCaseRef, [
        ...existing,
        callbackAttemptRecord.callbackAttemptRecordId,
      ]);
    }
    this.currentCallbackAttemptByCase.set(
      callbackAttemptRecord.callbackCaseRef,
      callbackAttemptRecord.callbackAttemptRecordId,
    );
    this.callbackAttemptByNaturalKey.set(
      `${callbackAttemptRecord.callbackCaseRef}::${callbackAttemptRecord.attemptFenceEpoch}::${callbackAttemptRecord.dialTargetRef}`,
      callbackAttemptRecord.callbackAttemptRecordId,
    );
  }

  async getCurrentCallbackAttemptForCase(
    callbackCaseRef: string,
  ): Promise<CallbackAttemptRecordSnapshot | null> {
    const current = this.currentCallbackAttemptByCase.get(callbackCaseRef);
    return current ? (this.callbackAttempts.get(current) ?? null) : null;
  }

  async findCallbackAttemptByNaturalKey(
    callbackCaseRef: string,
    attemptFenceEpoch: number,
    dialTargetRef: string,
  ): Promise<CallbackAttemptRecordSnapshot | null> {
    const current = this.callbackAttemptByNaturalKey.get(
      `${callbackCaseRef}::${attemptFenceEpoch}::${dialTargetRef.trim()}`,
    );
    return current ? (this.callbackAttempts.get(current) ?? null) : null;
  }

  async listCallbackAttemptsForCase(
    callbackCaseRef: string,
  ): Promise<readonly CallbackAttemptRecordSnapshot[]> {
    return (this.callbackAttemptsByCase.get(callbackCaseRef) ?? [])
      .map((id) => this.callbackAttempts.get(id))
      .filter((entry): entry is CallbackAttemptRecordSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.initiatedAt, right.initiatedAt));
  }

  async getCallbackExpectationEnvelope(
    expectationEnvelopeId: string,
  ): Promise<CallbackExpectationEnvelopeSnapshot | null> {
    return this.expectationEnvelopes.get(expectationEnvelopeId) ?? null;
  }

  async saveCallbackExpectationEnvelope(
    expectationEnvelope: CallbackExpectationEnvelopeSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.expectationEnvelopes,
      expectationEnvelope.expectationEnvelopeId,
      expectationEnvelope,
      options,
    );
    const existing = this.expectationEnvelopesByCase.get(expectationEnvelope.callbackCaseRef) ?? [];
    if (!existing.includes(expectationEnvelope.expectationEnvelopeId)) {
      this.expectationEnvelopesByCase.set(expectationEnvelope.callbackCaseRef, [
        ...existing,
        expectationEnvelope.expectationEnvelopeId,
      ]);
    }
    this.currentExpectationEnvelopeByCase.set(
      expectationEnvelope.callbackCaseRef,
      expectationEnvelope.expectationEnvelopeId,
    );
    this.expectationEnvelopeByCausalToken.set(
      `${expectationEnvelope.callbackCaseRef}::${expectationEnvelope.causalToken}`,
      expectationEnvelope.expectationEnvelopeId,
    );
  }

  async getCurrentCallbackExpectationEnvelopeForCase(
    callbackCaseRef: string,
  ): Promise<CallbackExpectationEnvelopeSnapshot | null> {
    const current = this.currentExpectationEnvelopeByCase.get(callbackCaseRef);
    return current ? (this.expectationEnvelopes.get(current) ?? null) : null;
  }

  async findCallbackExpectationEnvelopeByCausalToken(
    callbackCaseRef: string,
    causalToken: string,
  ): Promise<CallbackExpectationEnvelopeSnapshot | null> {
    const current = this.expectationEnvelopeByCausalToken.get(
      `${callbackCaseRef}::${causalToken.trim()}`,
    );
    return current ? (this.expectationEnvelopes.get(current) ?? null) : null;
  }

  async listCallbackExpectationEnvelopesForCase(
    callbackCaseRef: string,
  ): Promise<readonly CallbackExpectationEnvelopeSnapshot[]> {
    return (this.expectationEnvelopesByCase.get(callbackCaseRef) ?? [])
      .map((id) => this.expectationEnvelopes.get(id))
      .filter((entry): entry is CallbackExpectationEnvelopeSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt));
  }

  async getCallbackOutcomeEvidenceBundle(
    callbackOutcomeEvidenceBundleId: string,
  ): Promise<CallbackOutcomeEvidenceBundleSnapshot | null> {
    return this.outcomeEvidenceBundles.get(callbackOutcomeEvidenceBundleId) ?? null;
  }

  async saveCallbackOutcomeEvidenceBundle(
    callbackOutcomeEvidenceBundle: CallbackOutcomeEvidenceBundleSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.outcomeEvidenceBundles,
      callbackOutcomeEvidenceBundle.callbackOutcomeEvidenceBundleId,
      callbackOutcomeEvidenceBundle,
      options,
    );
    const existing =
      this.outcomeEvidenceBundlesByCase.get(callbackOutcomeEvidenceBundle.callbackCaseRef) ?? [];
    if (!existing.includes(callbackOutcomeEvidenceBundle.callbackOutcomeEvidenceBundleId)) {
      this.outcomeEvidenceBundlesByCase.set(callbackOutcomeEvidenceBundle.callbackCaseRef, [
        ...existing,
        callbackOutcomeEvidenceBundle.callbackOutcomeEvidenceBundleId,
      ]);
    }
    this.currentOutcomeEvidenceBundleByCase.set(
      callbackOutcomeEvidenceBundle.callbackCaseRef,
      callbackOutcomeEvidenceBundle.callbackOutcomeEvidenceBundleId,
    );
    this.outcomeEvidenceBundleByCausalToken.set(
      `${callbackOutcomeEvidenceBundle.callbackCaseRef}::${callbackOutcomeEvidenceBundle.causalToken}`,
      callbackOutcomeEvidenceBundle.callbackOutcomeEvidenceBundleId,
    );
  }

  async getCurrentCallbackOutcomeEvidenceBundleForCase(
    callbackCaseRef: string,
  ): Promise<CallbackOutcomeEvidenceBundleSnapshot | null> {
    const current = this.currentOutcomeEvidenceBundleByCase.get(callbackCaseRef);
    return current ? (this.outcomeEvidenceBundles.get(current) ?? null) : null;
  }

  async findCallbackOutcomeEvidenceBundleByCausalToken(
    callbackCaseRef: string,
    causalToken: string,
  ): Promise<CallbackOutcomeEvidenceBundleSnapshot | null> {
    const current = this.outcomeEvidenceBundleByCausalToken.get(
      `${callbackCaseRef}::${causalToken.trim()}`,
    );
    return current ? (this.outcomeEvidenceBundles.get(current) ?? null) : null;
  }

  async listCallbackOutcomeEvidenceBundlesForCase(
    callbackCaseRef: string,
  ): Promise<readonly CallbackOutcomeEvidenceBundleSnapshot[]> {
    return (this.outcomeEvidenceBundlesByCase.get(callbackCaseRef) ?? [])
      .map((id) => this.outcomeEvidenceBundles.get(id))
      .filter((entry): entry is CallbackOutcomeEvidenceBundleSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt));
  }

  async getCallbackResolutionGate(
    callbackResolutionGateId: string,
  ): Promise<CallbackResolutionGateSnapshot | null> {
    return this.resolutionGates.get(callbackResolutionGateId) ?? null;
  }

  async saveCallbackResolutionGate(
    callbackResolutionGate: CallbackResolutionGateSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.resolutionGates,
      callbackResolutionGate.callbackResolutionGateId,
      callbackResolutionGate,
      options,
    );
    const existing = this.resolutionGatesByCase.get(callbackResolutionGate.callbackCaseRef) ?? [];
    if (!existing.includes(callbackResolutionGate.callbackResolutionGateId)) {
      this.resolutionGatesByCase.set(callbackResolutionGate.callbackCaseRef, [
        ...existing,
        callbackResolutionGate.callbackResolutionGateId,
      ]);
    }
    this.currentResolutionGateByCase.set(
      callbackResolutionGate.callbackCaseRef,
      callbackResolutionGate.callbackResolutionGateId,
    );
    this.resolutionGateByCausalToken.set(
      `${callbackResolutionGate.callbackCaseRef}::${callbackResolutionGate.causalToken}`,
      callbackResolutionGate.callbackResolutionGateId,
    );
  }

  async getCurrentCallbackResolutionGateForCase(
    callbackCaseRef: string,
  ): Promise<CallbackResolutionGateSnapshot | null> {
    const current = this.currentResolutionGateByCase.get(callbackCaseRef);
    return current ? (this.resolutionGates.get(current) ?? null) : null;
  }

  async findCallbackResolutionGateByCausalToken(
    callbackCaseRef: string,
    causalToken: string,
  ): Promise<CallbackResolutionGateSnapshot | null> {
    const current = this.resolutionGateByCausalToken.get(
      `${callbackCaseRef}::${causalToken.trim()}`,
    );
    return current ? (this.resolutionGates.get(current) ?? null) : null;
  }

  async listCallbackResolutionGatesForCase(
    callbackCaseRef: string,
  ): Promise<readonly CallbackResolutionGateSnapshot[]> {
    return (this.resolutionGatesByCase.get(callbackCaseRef) ?? [])
      .map((id) => this.resolutionGates.get(id))
      .filter((entry): entry is CallbackResolutionGateSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.decidedAt, right.decidedAt));
  }
}

function normalizeCallbackCase(input: CallbackCaseSnapshot): CallbackCaseSnapshot {
  ensurePositiveInteger(input.version, "version");
  invariant(
    callbackCaseStates.includes(input.state),
    "INVALID_CALLBACK_CASE_STATE",
    "Unsupported CallbackCase state.",
  );
  invariant(input.attemptCounter >= 0, "INVALID_ATTEMPT_COUNTER", "attemptCounter must be >= 0.");
  return {
    ...input,
    callbackCaseId: requireRef(input.callbackCaseId, "callbackCaseId"),
    sourceTriageTaskRef: requireRef(input.sourceTriageTaskRef, "sourceTriageTaskRef"),
    callbackSeedRef: requireRef(input.callbackSeedRef, "callbackSeedRef"),
    episodeRef: requireRef(input.episodeRef, "episodeRef"),
    requestId: requireRef(input.requestId, "requestId"),
    requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
    lineageCaseLinkRef: requireRef(input.lineageCaseLinkRef, "lineageCaseLinkRef"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    decisionId: requireRef(input.decisionId, "decisionId"),
    callbackUrgencyRef: requireRef(input.callbackUrgencyRef, "callbackUrgencyRef"),
    preferredWindowRef: requireRef(input.preferredWindowRef, "preferredWindowRef"),
    serviceWindowRef: requireRef(input.serviceWindowRef, "serviceWindowRef"),
    contactRouteRef: requireRef(input.contactRouteRef, "contactRouteRef"),
    fallbackRouteRef: requireRef(input.fallbackRouteRef, "fallbackRouteRef"),
    activeIntentLeaseRef: optionalRef(input.activeIntentLeaseRef),
    latestSettledAttemptRef: optionalRef(input.latestSettledAttemptRef),
    currentExpectationEnvelopeRef: optionalRef(input.currentExpectationEnvelopeRef),
    latestOutcomeEvidenceBundleRef: optionalRef(input.latestOutcomeEvidenceBundleRef),
    activeResolutionGateRef: optionalRef(input.activeResolutionGateRef),
    retryPolicyRef: requireRef(input.retryPolicyRef, "retryPolicyRef"),
    reachabilityDependencyRef: optionalRef(input.reachabilityDependencyRef),
    patientVisibleExpectationState: requireCallbackPatientVisibleState(
      input.patientVisibleExpectationState,
    ),
    latestAttemptOutcome: input.latestAttemptOutcome
      ? requireCallbackOutcome(input.latestAttemptOutcome)
      : null,
    stalePromiseSuppressedAt: optionalRef(input.stalePromiseSuppressedAt),
    closedAt: optionalRef(input.closedAt),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
    updatedAt: ensureIsoTimestamp(input.updatedAt, "updatedAt"),
  };
}

function normalizeCallbackIntentLease(
  input: CallbackIntentLeaseSnapshot,
): CallbackIntentLeaseSnapshot {
  ensurePositiveInteger(input.version, "version");
  ensurePositiveInteger(input.lineageFenceEpoch, "lineageFenceEpoch");
  ensurePositiveInteger(input.ownershipEpoch, "ownershipEpoch");
  ensurePositiveInteger(input.monotoneRevision, "monotoneRevision");
  invariant(
    callbackLeaseModes.includes(input.leaseMode),
    "INVALID_CALLBACK_LEASE_MODE",
    "Unsupported CallbackIntentLease mode.",
  );
  return {
    ...input,
    callbackIntentLeaseId: requireRef(input.callbackIntentLeaseId, "callbackIntentLeaseId"),
    callbackCaseRef: requireRef(input.callbackCaseRef, "callbackCaseRef"),
    requestLifecycleLeaseRef: requireRef(
      input.requestLifecycleLeaseRef,
      "requestLifecycleLeaseRef",
    ),
    leaseAuthorityRef: requireRef(input.leaseAuthorityRef, "leaseAuthorityRef"),
    ownedByActorRef: requireRef(input.ownedByActorRef, "ownedByActorRef"),
    ownedBySessionRef: optionalRef(input.ownedBySessionRef),
    serviceWindowRef: requireRef(input.serviceWindowRef, "serviceWindowRef"),
    contactRouteRef: requireRef(input.contactRouteRef, "contactRouteRef"),
    routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
    fencingToken: requireRef(input.fencingToken, "fencingToken"),
    caseVersionRef: requireRef(input.caseVersionRef, "caseVersionRef"),
    lastHeartbeatAt: ensureIsoTimestamp(input.lastHeartbeatAt, "lastHeartbeatAt"),
    staleOwnerRecoveryRef: optionalRef(input.staleOwnerRecoveryRef),
    expiresAt: ensureIsoTimestamp(input.expiresAt, "expiresAt"),
  };
}

function normalizeCallbackAttemptRecord(
  input: CallbackAttemptRecordSnapshot,
): CallbackAttemptRecordSnapshot {
  ensurePositiveInteger(input.version, "version");
  ensurePositiveInteger(input.attemptOrdinal, "attemptOrdinal");
  ensurePositiveInteger(input.attemptFenceEpoch, "attemptFenceEpoch");
  ensurePositiveInteger(input.ownershipEpochRef, "ownershipEpochRef");
  invariant(
    callbackAttemptSettlementStates.includes(input.settlementState),
    "INVALID_CALLBACK_ATTEMPT_SETTLEMENT_STATE",
    "Unsupported CallbackAttemptRecord settlementState.",
  );
  return {
    ...input,
    callbackAttemptRecordId: requireRef(input.callbackAttemptRecordId, "callbackAttemptRecordId"),
    callbackCaseRef: requireRef(input.callbackCaseRef, "callbackCaseRef"),
    callbackIntentLeaseRef: requireRef(input.callbackIntentLeaseRef, "callbackIntentLeaseRef"),
    requestLifecycleLeaseRef: requireRef(
      input.requestLifecycleLeaseRef,
      "requestLifecycleLeaseRef",
    ),
    fencingToken: requireRef(input.fencingToken, "fencingToken"),
    dialTargetRef: requireRef(input.dialTargetRef, "dialTargetRef"),
    channelProviderRef: requireRef(input.channelProviderRef, "channelProviderRef"),
    commandActionRecordRef: requireRef(input.commandActionRecordRef, "commandActionRecordRef"),
    idempotencyRecordRef: requireRef(input.idempotencyRecordRef, "idempotencyRecordRef"),
    adapterDispatchAttemptRef: requireRef(
      input.adapterDispatchAttemptRef,
      "adapterDispatchAttemptRef",
    ),
    adapterEffectKey: requireRef(input.adapterEffectKey, "adapterEffectKey"),
    latestReceiptCheckpointRef: optionalRef(input.latestReceiptCheckpointRef),
    latestReceiptDecisionClass: optionalRef(input.latestReceiptDecisionClass),
    initiatedAt: ensureIsoTimestamp(input.initiatedAt, "initiatedAt"),
    idempotencyKey: requireRef(input.idempotencyKey, "idempotencyKey"),
  };
}

function normalizeCallbackExpectationEnvelope(
  input: CallbackExpectationEnvelopeSnapshot,
): CallbackExpectationEnvelopeSnapshot {
  ensurePositiveInteger(input.version, "version");
  ensurePositiveInteger(input.monotoneRevision, "monotoneRevision");
  invariant(
    callbackPatientVisibleStates.includes(input.patientVisibleState),
    "INVALID_CALLBACK_EXPECTATION_STATE",
    "Unsupported CallbackExpectationEnvelope.patientVisibleState.",
  );
  invariant(
    callbackWindowRiskStates.includes(input.windowRiskState),
    "INVALID_CALLBACK_WINDOW_RISK_STATE",
    "Unsupported CallbackExpectationEnvelope.windowRiskState.",
  );
  invariant(
    callbackConfidenceBands.includes(input.stateConfidenceBand),
    "INVALID_CALLBACK_CONFIDENCE_BAND",
    "Unsupported CallbackExpectationEnvelope.stateConfidenceBand.",
  );
  return {
    ...input,
    expectationEnvelopeId: requireRef(input.expectationEnvelopeId, "expectationEnvelopeId"),
    callbackCaseRef: requireRef(input.callbackCaseRef, "callbackCaseRef"),
    identityRepairBranchDispositionRef: optionalRef(input.identityRepairBranchDispositionRef),
    expectedWindowRef: requireRef(input.expectedWindowRef, "expectedWindowRef"),
    windowLowerAt: ensureIsoTimestamp(input.windowLowerAt, "windowLowerAt"),
    windowUpperAt: ensureIsoTimestamp(input.windowUpperAt, "windowUpperAt"),
    predictionModelRef: requireRef(input.predictionModelRef, "predictionModelRef"),
    fallbackGuidanceRef: requireRef(input.fallbackGuidanceRef, "fallbackGuidanceRef"),
    grantSetRef: optionalRef(input.grantSetRef),
    routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
    requiredReleaseApprovalFreezeRef: optionalRef(input.requiredReleaseApprovalFreezeRef),
    channelReleaseFreezeState: requireRef(
      input.channelReleaseFreezeState,
      "channelReleaseFreezeState",
    ),
    requiredAssuranceSliceTrustRefs: uniqueSorted(input.requiredAssuranceSliceTrustRefs),
    transitionEnvelopeRef: requireRef(input.transitionEnvelopeRef, "transitionEnvelopeRef"),
    continuityEvidenceRef: requireRef(input.continuityEvidenceRef, "continuityEvidenceRef"),
    causalToken: requireRef(input.causalToken, "causalToken"),
    freezeDispositionRef: optionalRef(input.freezeDispositionRef),
    expectationReasonRef: requireRef(input.expectationReasonRef, "expectationReasonRef"),
    createdAt: ensureIsoTimestamp(input.createdAt, "createdAt"),
  };
}

function normalizeCallbackOutcomeEvidenceBundle(
  input: CallbackOutcomeEvidenceBundleSnapshot,
): CallbackOutcomeEvidenceBundleSnapshot {
  ensurePositiveInteger(input.version, "version");
  ensurePositiveInteger(input.attemptFenceEpoch, "attemptFenceEpoch");
  invariant(
    callbackOutcomes.includes(input.outcome),
    "INVALID_CALLBACK_OUTCOME",
    "Unsupported CallbackOutcomeEvidenceBundle.outcome.",
  );
  invariant(
    callbackSafetyClassifications.includes(input.safetyClassification),
    "INVALID_CALLBACK_SAFETY_CLASSIFICATION",
    "Unsupported CallbackOutcomeEvidenceBundle.safetyClassification.",
  );
  invariant(
    callbackSafetyPreemptionStates.includes(input.safetyPreemptionState),
    "INVALID_CALLBACK_SAFETY_PREEMPTION_STATE",
    "Unsupported CallbackOutcomeEvidenceBundle.safetyPreemptionState.",
  );
  return {
    ...input,
    callbackOutcomeEvidenceBundleId: requireRef(
      input.callbackOutcomeEvidenceBundleId,
      "callbackOutcomeEvidenceBundleId",
    ),
    callbackCaseRef: requireRef(input.callbackCaseRef, "callbackCaseRef"),
    attemptRef: requireRef(input.attemptRef, "attemptRef"),
    recordedByActorRef: requireRef(input.recordedByActorRef, "recordedByActorRef"),
    recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
    routeEvidenceRef: requireRef(input.routeEvidenceRef, "routeEvidenceRef"),
    providerDispositionRef: optionalRef(input.providerDispositionRef),
    patientAcknowledgementRef: optionalRef(input.patientAcknowledgementRef),
    voicemailPolicyRef: optionalRef(input.voicemailPolicyRef),
    voicemailEvidenceRefs: uniqueSorted(input.voicemailEvidenceRefs),
    causalToken: requireRef(input.causalToken, "causalToken"),
  };
}

function normalizeCallbackResolutionGate(
  input: CallbackResolutionGateSnapshot,
): CallbackResolutionGateSnapshot {
  ensurePositiveInteger(input.version, "version");
  ensurePositiveInteger(input.monotoneRevision, "monotoneRevision");
  invariant(
    callbackResolutionDecisions.includes(input.decision),
    "INVALID_CALLBACK_RESOLUTION_DECISION",
    "Unsupported CallbackResolutionGate.decision.",
  );
  return {
    ...input,
    callbackResolutionGateId: requireRef(
      input.callbackResolutionGateId,
      "callbackResolutionGateId",
    ),
    callbackCaseRef: requireRef(input.callbackCaseRef, "callbackCaseRef"),
    latestAttemptRef: requireRef(input.latestAttemptRef, "latestAttemptRef"),
    latestOutcomeEvidenceRef: requireRef(
      input.latestOutcomeEvidenceRef,
      "latestOutcomeEvidenceRef",
    ),
    latestExpectationEnvelopeRef: requireRef(
      input.latestExpectationEnvelopeRef,
      "latestExpectationEnvelopeRef",
    ),
    decisionReasonRef: requireRef(input.decisionReasonRef, "decisionReasonRef"),
    nextActionAt: optionalRef(input.nextActionAt),
    stalePromiseRevocationRef: optionalRef(input.stalePromiseRevocationRef),
    causalToken: requireRef(input.causalToken, "causalToken"),
    decidedAt: ensureIsoTimestamp(input.decidedAt, "decidedAt"),
  };
}

function requireCallbackPatientVisibleState(value: CallbackPatientVisibleState): CallbackPatientVisibleState {
  invariant(
    callbackPatientVisibleStates.includes(value),
    "INVALID_CALLBACK_PATIENT_VISIBLE_STATE",
    "Unsupported callback patient-visible state.",
  );
  return value;
}

function requireCallbackOutcome(value: CallbackOutcome): CallbackOutcome {
  invariant(callbackOutcomes.includes(value), "INVALID_CALLBACK_OUTCOME", "Unsupported callback outcome.");
  return value;
}

function assertLegalCallbackTransition(
  currentState: CallbackCaseState,
  nextState: CallbackCaseState,
): void {
  if (currentState === nextState) {
    return;
  }
  invariant(
    callbackLegalTransitions[currentState].includes(nextState),
    "ILLEGAL_CALLBACK_TRANSITION",
    `CallbackCase cannot transition from ${currentState} to ${nextState}.`,
  );
}

export interface Phase3CallbackKernelService {
  queryCallbackBundle(callbackCaseId: string): Promise<Phase3CallbackBundle>;
  queryCurrentCallbackBundleForTask(taskId: string): Promise<Phase3CallbackBundle | null>;
  createCallbackCase(input: CreateCallbackCaseInput): Promise<CreateCallbackCaseResult>;
  scheduleCallback(input: ScheduleCallbackInput): Promise<Phase3CallbackBundle>;
  cancelCallback(input: SettleCallbackResolutionGateInput): Promise<Phase3CallbackBundle>;
  armCallbackReadyForAttempt(input: ScheduleCallbackInput): Promise<Phase3CallbackBundle>;
  initiateCallbackAttempt(input: InitiateCallbackAttemptInput): Promise<InitiateCallbackAttemptResult>;
  observeProviderReceipt(input: ObserveProviderReceiptInput): Promise<Phase3CallbackBundle>;
  recordOutcomeEvidence(input: RecordOutcomeEvidenceInput): Promise<RecordOutcomeEvidenceResult>;
  settleResolutionGate(input: SettleCallbackResolutionGateInput): Promise<Phase3CallbackBundle>;
  closeCallbackCase(input: CloseCallbackCaseInput): Promise<Phase3CallbackBundle>;
  reopenCallbackCase(input: ReopenCallbackCaseInput): Promise<Phase3CallbackBundle>;
  listCallbackCasesForTask(taskId: string): Promise<readonly CallbackCaseSnapshot[]>;
}

class Phase3CallbackKernelServiceImpl implements Phase3CallbackKernelService {
  constructor(
    private readonly repositories: Phase3CallbackKernelRepositories,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  async queryCallbackBundle(callbackCaseId: string): Promise<Phase3CallbackBundle> {
    const callbackCase = await this.requireCallbackCase(callbackCaseId);
    const [
      currentIntentLease,
      latestAttempt,
      currentExpectationEnvelope,
      latestOutcomeEvidenceBundle,
      currentResolutionGate,
    ] = await Promise.all([
      this.repositories.getCurrentCallbackIntentLeaseForCase(callbackCaseId),
      this.repositories.getCurrentCallbackAttemptForCase(callbackCaseId),
      this.repositories.getCurrentCallbackExpectationEnvelopeForCase(callbackCaseId),
      this.repositories.getCurrentCallbackOutcomeEvidenceBundleForCase(callbackCaseId),
      this.repositories.getCurrentCallbackResolutionGateForCase(callbackCaseId),
    ]);
    return {
      callbackCase,
      currentIntentLease,
      latestAttempt,
      currentExpectationEnvelope,
      latestOutcomeEvidenceBundle,
      currentResolutionGate,
    };
  }

  async queryCurrentCallbackBundleForTask(taskId: string): Promise<Phase3CallbackBundle | null> {
    const callbackCase = await this.repositories.getCurrentCallbackCaseForTask(taskId);
    return callbackCase ? this.queryCallbackBundle(callbackCase.callbackCaseId) : null;
  }

  async createCallbackCase(input: CreateCallbackCaseInput): Promise<CreateCallbackCaseResult> {
    return this.repositories.withCallbackBoundary(async () => {
      const existingBySeed = await this.repositories.getCurrentCallbackCaseForSeed(
        input.callbackSeedRef,
      );
      if (existingBySeed) {
        return {
          bundle: await this.queryCallbackBundle(existingBySeed.callbackCaseId),
          reusedExisting: true,
        };
      }

      const createdAt = ensureIsoTimestamp(input.createdAt, "createdAt");
      const callbackCase = normalizeCallbackCase({
        callbackCaseId: input.callbackCaseId,
        sourceTriageTaskRef: input.sourceTriageTaskRef,
        callbackSeedRef: input.callbackSeedRef,
        episodeRef: input.episodeRef,
        requestId: input.requestId,
        requestLineageRef: input.requestLineageRef,
        lineageCaseLinkRef: input.lineageCaseLinkRef,
        decisionEpochRef: input.decisionEpochRef,
        decisionId: input.decisionId,
        state: input.initialCaseState,
        callbackUrgencyRef: input.callbackUrgencyRef,
        preferredWindowRef: input.preferredWindowRef,
        serviceWindowRef: input.serviceWindowRef,
        contactRouteRef: input.contactRouteRef,
        fallbackRouteRef: input.fallbackRouteRef,
        activeIntentLeaseRef: input.initialIntentLease.callbackIntentLeaseId,
        attemptCounter: 0,
        latestSettledAttemptRef: null,
        currentExpectationEnvelopeRef: input.initialExpectationEnvelope?.expectationEnvelopeId ?? null,
        latestOutcomeEvidenceBundleRef: null,
        activeResolutionGateRef: null,
        retryPolicyRef: input.retryPolicyRef,
        reachabilityDependencyRef: optionalRef(input.reachabilityDependencyRef),
        patientVisibleExpectationState:
          input.initialExpectationEnvelope?.patientVisibleState ?? "queued",
        latestAttemptOutcome: null,
        stalePromiseSuppressedAt: null,
        closedAt: null,
        createdAt,
        updatedAt: createdAt,
        version: 1,
      });
      await this.repositories.saveCallbackCase(callbackCase);

      const intentLease = normalizeCallbackIntentLease({
        ...input.initialIntentLease,
        callbackCaseRef: callbackCase.callbackCaseId,
        caseVersionRef: `${callbackCase.callbackCaseId}@v${callbackCase.version}`,
        monotoneRevision: 1,
        version: 1,
      });
      await this.repositories.saveCallbackIntentLease(intentLease);

      if (input.initialExpectationEnvelope) {
        const expectationEnvelope = normalizeCallbackExpectationEnvelope({
          ...input.initialExpectationEnvelope,
          callbackCaseRef: callbackCase.callbackCaseId,
          monotoneRevision: 1,
          version: 1,
        });
        await this.repositories.saveCallbackExpectationEnvelope(expectationEnvelope);
      }

      return {
        bundle: await this.queryCallbackBundle(callbackCase.callbackCaseId),
        reusedExisting: false,
      };
    });
  }

  async scheduleCallback(input: ScheduleCallbackInput): Promise<Phase3CallbackBundle> {
    return this.mutateCaseWithLeaseAndExpectation({
      callbackCaseRef: input.callbackCaseRef,
      nextCaseState: input.nextCaseState,
      callbackUrgencyRef: input.callbackUrgencyRef,
      preferredWindowRef: input.preferredWindowRef,
      fallbackRouteRef: input.fallbackRouteRef,
      reachabilityDependencyRef: input.reachabilityDependencyRef,
      intentLease: input.intentLease,
      expectationEnvelope: input.expectationEnvelope,
      recordedAt: input.recordedAt,
      expectCurrentState: null,
    });
  }

  async cancelCallback(input: SettleCallbackResolutionGateInput): Promise<Phase3CallbackBundle> {
    return this.settleResolutionGate(input);
  }

  async armCallbackReadyForAttempt(input: ScheduleCallbackInput): Promise<Phase3CallbackBundle> {
    return this.mutateCaseWithLeaseAndExpectation({
      callbackCaseRef: input.callbackCaseRef,
      nextCaseState: input.nextCaseState,
      callbackUrgencyRef: input.callbackUrgencyRef,
      preferredWindowRef: input.preferredWindowRef,
      fallbackRouteRef: input.fallbackRouteRef,
      reachabilityDependencyRef: input.reachabilityDependencyRef,
      intentLease: input.intentLease,
      expectationEnvelope: input.expectationEnvelope,
      recordedAt: input.recordedAt,
      expectCurrentState: null,
    });
  }

  async initiateCallbackAttempt(
    input: InitiateCallbackAttemptInput,
  ): Promise<InitiateCallbackAttemptResult> {
    return this.repositories.withCallbackBoundary(async () => {
      const callbackCase = await this.requireCallbackCase(input.callbackCaseRef);
      const attemptNaturalKey = await this.repositories.findCallbackAttemptByNaturalKey(
        callbackCase.callbackCaseId,
        input.attempt.attemptFenceEpoch,
        input.attempt.dialTargetRef,
      );
      if (attemptNaturalKey) {
        return {
          bundle: await this.queryCallbackBundle(callbackCase.callbackCaseId),
          callbackAttempt: attemptNaturalKey,
          reusedExistingAttempt: true,
        };
      }

      assertLegalCallbackTransition(callbackCase.state, input.nextCaseState);
      const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      const nextAttempt = normalizeCallbackAttemptRecord({
        ...input.attempt,
        callbackCaseRef: callbackCase.callbackCaseId,
        version: 1,
      });
      await this.repositories.saveCallbackAttemptRecord(nextAttempt);

      const currentExpectation = await this.repositories.getCurrentCallbackExpectationEnvelopeForCase(
        callbackCase.callbackCaseId,
      );
      const nextExpectationEnvelope = normalizeCallbackExpectationEnvelope({
        ...input.expectationEnvelope,
        callbackCaseRef: callbackCase.callbackCaseId,
        monotoneRevision: (currentExpectation?.monotoneRevision ?? 0) + 1,
        version: 1,
      });
      await this.repositories.saveCallbackExpectationEnvelope(nextExpectationEnvelope);

      const nextCase = normalizeCallbackCase({
        ...callbackCase,
        state: input.nextCaseState,
        attemptCounter: callbackCase.attemptCounter + 1,
        currentExpectationEnvelopeRef: nextExpectationEnvelope.expectationEnvelopeId,
        patientVisibleExpectationState: nextExpectationEnvelope.patientVisibleState,
        updatedAt: recordedAt,
        version: nextVersion(callbackCase.version),
      });
      await this.repositories.saveCallbackCase(nextCase, {
        expectedVersion: callbackCase.version,
      });

      return {
        bundle: await this.queryCallbackBundle(callbackCase.callbackCaseId),
        callbackAttempt: nextAttempt,
        reusedExistingAttempt: false,
      };
    });
  }

  async observeProviderReceipt(input: ObserveProviderReceiptInput): Promise<Phase3CallbackBundle> {
    return this.repositories.withCallbackBoundary(async () => {
      const callbackCase = await this.requireCallbackCase(input.callbackCaseRef);
      const attempt = await this.requireCallbackAttempt(input.callbackAttemptRecordId);
      invariant(
        attempt.callbackCaseRef === callbackCase.callbackCaseId,
        "CALLBACK_ATTEMPT_CASE_MISMATCH",
        "CallbackAttemptRecord does not belong to the callback case.",
      );
      const nextAttempt = normalizeCallbackAttemptRecord({
        ...attempt,
        latestReceiptCheckpointRef: input.receiptCheckpointRef,
        latestReceiptDecisionClass: input.receiptDecisionClass,
        settlementState: input.settlementState,
        version: nextVersion(attempt.version),
      });
      await this.repositories.saveCallbackAttemptRecord(nextAttempt, {
        expectedVersion: attempt.version,
      });

      const nextCaseState =
        input.settlementState === "outcome_pending"
          ? "awaiting_outcome_evidence"
          : input.settlementState === "reconcile_required"
            ? "contact_route_repair_pending"
            : "attempt_in_progress";
      if (callbackCase.state !== nextCaseState) {
        assertLegalCallbackTransition(callbackCase.state, nextCaseState);
        const nextCase = normalizeCallbackCase({
          ...callbackCase,
          state: nextCaseState,
          updatedAt: ensureIsoTimestamp(input.observedAt, "observedAt"),
          version: nextVersion(callbackCase.version),
        });
        await this.repositories.saveCallbackCase(nextCase, {
          expectedVersion: callbackCase.version,
        });
      }
      return this.queryCallbackBundle(callbackCase.callbackCaseId);
    });
  }

  async recordOutcomeEvidence(
    input: RecordOutcomeEvidenceInput,
  ): Promise<RecordOutcomeEvidenceResult> {
    return this.repositories.withCallbackBoundary(async () => {
      const callbackCase = await this.requireCallbackCase(input.callbackCaseRef);
      const existing = await this.repositories.findCallbackOutcomeEvidenceBundleByCausalToken(
        callbackCase.callbackCaseId,
        input.evidenceBundle.causalToken,
      );
      if (existing) {
        return {
          bundle: await this.queryCallbackBundle(callbackCase.callbackCaseId),
          outcomeEvidenceBundle: existing,
          reusedExisting: true,
        };
      }

      assertLegalCallbackTransition(callbackCase.state, input.nextCaseState);
      const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      const currentExpectation = await this.repositories.getCurrentCallbackExpectationEnvelopeForCase(
        callbackCase.callbackCaseId,
      );
      const evidenceBundle = normalizeCallbackOutcomeEvidenceBundle({
        ...input.evidenceBundle,
        callbackCaseRef: callbackCase.callbackCaseId,
        version: 1,
      });
      await this.repositories.saveCallbackOutcomeEvidenceBundle(evidenceBundle);

      let expectationEnvelopeId = callbackCase.currentExpectationEnvelopeRef;
      let patientVisibleExpectationState = callbackCase.patientVisibleExpectationState;
      if (input.expectationEnvelope) {
        const nextExpectationEnvelope = normalizeCallbackExpectationEnvelope({
          ...input.expectationEnvelope,
          callbackCaseRef: callbackCase.callbackCaseId,
          monotoneRevision: (currentExpectation?.monotoneRevision ?? 0) + 1,
          version: 1,
        });
        await this.repositories.saveCallbackExpectationEnvelope(nextExpectationEnvelope);
        expectationEnvelopeId = nextExpectationEnvelope.expectationEnvelopeId;
        patientVisibleExpectationState = nextExpectationEnvelope.patientVisibleState;
      }

      const nextCase = normalizeCallbackCase({
        ...callbackCase,
        state: input.nextCaseState,
        currentExpectationEnvelopeRef: expectationEnvelopeId,
        latestOutcomeEvidenceBundleRef: evidenceBundle.callbackOutcomeEvidenceBundleId,
        patientVisibleExpectationState,
        latestAttemptOutcome: evidenceBundle.outcome,
        reachabilityDependencyRef:
          optionalRef(input.reachabilityDependencyRef) ?? callbackCase.reachabilityDependencyRef,
        stalePromiseSuppressedAt:
          input.nextCaseState === "contact_route_repair_pending" ? recordedAt : callbackCase.stalePromiseSuppressedAt,
        updatedAt: recordedAt,
        version: nextVersion(callbackCase.version),
      });
      await this.repositories.saveCallbackCase(nextCase, {
        expectedVersion: callbackCase.version,
      });

      return {
        bundle: await this.queryCallbackBundle(callbackCase.callbackCaseId),
        outcomeEvidenceBundle: evidenceBundle,
        reusedExisting: false,
      };
    });
  }

  async settleResolutionGate(input: SettleCallbackResolutionGateInput): Promise<Phase3CallbackBundle> {
    return this.repositories.withCallbackBoundary(async () => {
      const callbackCase = await this.requireCallbackCase(input.callbackCaseRef);
      const existing = await this.repositories.findCallbackResolutionGateByCausalToken(
        callbackCase.callbackCaseId,
        input.resolutionGate.causalToken,
      );
      if (existing) {
        return this.queryCallbackBundle(callbackCase.callbackCaseId);
      }

      assertLegalCallbackTransition(callbackCase.state, input.nextCaseState);
      const decidedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
      const currentExpectation = await this.repositories.getCurrentCallbackExpectationEnvelopeForCase(
        callbackCase.callbackCaseId,
      );
      let expectationEnvelopeId = callbackCase.currentExpectationEnvelopeRef;
      let patientVisibleExpectationState = callbackCase.patientVisibleExpectationState;
      if (input.expectationEnvelope) {
        const expectationEnvelope = normalizeCallbackExpectationEnvelope({
          ...input.expectationEnvelope,
          callbackCaseRef: callbackCase.callbackCaseId,
          monotoneRevision: (currentExpectation?.monotoneRevision ?? 0) + 1,
          version: 1,
        });
        await this.repositories.saveCallbackExpectationEnvelope(expectationEnvelope);
        expectationEnvelopeId = expectationEnvelope.expectationEnvelopeId;
        patientVisibleExpectationState = expectationEnvelope.patientVisibleState;
      }

      const resolutionGate = normalizeCallbackResolutionGate({
        ...input.resolutionGate,
        callbackCaseRef: callbackCase.callbackCaseId,
        monotoneRevision:
          ((await this.repositories.getCurrentCallbackResolutionGateForCase(callbackCase.callbackCaseId))
            ?.monotoneRevision ?? 0) + 1,
        version: 1,
      });
      await this.repositories.saveCallbackResolutionGate(resolutionGate);

      const nextCase = normalizeCallbackCase({
        ...callbackCase,
        state: input.nextCaseState,
        currentExpectationEnvelopeRef: expectationEnvelopeId,
        activeResolutionGateRef: resolutionGate.callbackResolutionGateId,
        patientVisibleExpectationState,
        stalePromiseSuppressedAt:
          resolutionGate.decision === "retry" ||
          resolutionGate.decision === "escalate" ||
          resolutionGate.decision === "cancel" ||
          resolutionGate.decision === "expire"
            ? decidedAt
            : callbackCase.stalePromiseSuppressedAt,
        updatedAt: decidedAt,
        version: nextVersion(callbackCase.version),
      });
      await this.repositories.saveCallbackCase(nextCase, {
        expectedVersion: callbackCase.version,
      });

      return this.queryCallbackBundle(callbackCase.callbackCaseId);
    });
  }

  async closeCallbackCase(input: CloseCallbackCaseInput): Promise<Phase3CallbackBundle> {
    return this.repositories.withCallbackBoundary(async () => {
      const callbackCase = await this.requireCallbackCase(input.callbackCaseRef);
      assertLegalCallbackTransition(callbackCase.state, "closed");
      const closedAt = ensureIsoTimestamp(input.closedAt, "closedAt");
      const nextCase = normalizeCallbackCase({
        ...callbackCase,
        state: "closed",
        patientVisibleExpectationState: "closed",
        closedAt,
        updatedAt: closedAt,
        version: nextVersion(callbackCase.version),
      });
      await this.repositories.saveCallbackCase(nextCase, {
        expectedVersion: callbackCase.version,
      });
      return this.queryCallbackBundle(callbackCase.callbackCaseId);
    });
  }

  async reopenCallbackCase(input: ReopenCallbackCaseInput): Promise<Phase3CallbackBundle> {
    return this.repositories.withCallbackBoundary(async () => {
      const callbackCase = await this.requireCallbackCase(input.callbackCaseRef);
      assertLegalCallbackTransition(callbackCase.state, input.nextCaseState);
      const reopenedAt = ensureIsoTimestamp(input.reopenedAt, "reopenedAt");
      const currentExpectation = await this.repositories.getCurrentCallbackExpectationEnvelopeForCase(
        callbackCase.callbackCaseId,
      );
      const expectationEnvelope = normalizeCallbackExpectationEnvelope({
        ...input.expectationEnvelope,
        callbackCaseRef: callbackCase.callbackCaseId,
        monotoneRevision: (currentExpectation?.monotoneRevision ?? 0) + 1,
        version: 1,
      });
      await this.repositories.saveCallbackExpectationEnvelope(expectationEnvelope);

      const intentLease = normalizeCallbackIntentLease({
        ...input.intentLease,
        callbackCaseRef: callbackCase.callbackCaseId,
        caseVersionRef: `${callbackCase.callbackCaseId}@v${callbackCase.version + 1}`,
        monotoneRevision:
          ((await this.repositories.getCurrentCallbackIntentLeaseForCase(callbackCase.callbackCaseId))
            ?.monotoneRevision ?? 0) + 1,
        version: 1,
      });
      await this.repositories.saveCallbackIntentLease(intentLease);

      const nextCase = normalizeCallbackCase({
        ...callbackCase,
        state: input.nextCaseState,
        activeIntentLeaseRef: intentLease.callbackIntentLeaseId,
        currentExpectationEnvelopeRef: expectationEnvelope.expectationEnvelopeId,
        patientVisibleExpectationState: expectationEnvelope.patientVisibleState,
        closedAt: null,
        updatedAt: reopenedAt,
        version: nextVersion(callbackCase.version),
      });
      await this.repositories.saveCallbackCase(nextCase, {
        expectedVersion: callbackCase.version,
      });

      return this.queryCallbackBundle(callbackCase.callbackCaseId);
    });
  }

  async listCallbackCasesForTask(taskId: string): Promise<readonly CallbackCaseSnapshot[]> {
    return this.repositories.listCallbackCasesForTask(taskId);
  }

  private async mutateCaseWithLeaseAndExpectation(input: {
    callbackCaseRef: string;
    nextCaseState: CallbackCaseState;
    callbackUrgencyRef?: string;
    preferredWindowRef?: string;
    fallbackRouteRef?: string | null;
    reachabilityDependencyRef?: string | null;
    intentLease: Omit<CallbackIntentLeaseSnapshot, "callbackCaseRef" | "caseVersionRef" | "version">;
    expectationEnvelope: Omit<
      CallbackExpectationEnvelopeSnapshot,
      "callbackCaseRef" | "monotoneRevision" | "version"
    >;
    recordedAt: string;
    expectCurrentState: CallbackCaseState | null;
  }): Promise<Phase3CallbackBundle> {
    return this.repositories.withCallbackBoundary(async () => {
      const callbackCase = await this.requireCallbackCase(input.callbackCaseRef);
      if (input.expectCurrentState && callbackCase.state !== input.expectCurrentState) {
        throw new RequestBackboneInvariantError(
          "CALLBACK_CASE_STATE_MISMATCH",
          `CallbackCase ${callbackCase.callbackCaseId} expected ${input.expectCurrentState} but is ${callbackCase.state}.`,
        );
      }
      assertLegalCallbackTransition(callbackCase.state, input.nextCaseState);
      const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");

      const currentLease = await this.repositories.getCurrentCallbackIntentLeaseForCase(
        callbackCase.callbackCaseId,
      );
      const nextIntentLease = normalizeCallbackIntentLease({
        ...input.intentLease,
        callbackCaseRef: callbackCase.callbackCaseId,
        caseVersionRef: `${callbackCase.callbackCaseId}@v${callbackCase.version + 1}`,
        monotoneRevision: (currentLease?.monotoneRevision ?? 0) + 1,
        version: currentLease?.callbackIntentLeaseId === input.intentLease.callbackIntentLeaseId
          ? nextVersion(currentLease.version)
          : 1,
      });
      await this.repositories.saveCallbackIntentLease(
        nextIntentLease,
        currentLease?.callbackIntentLeaseId === nextIntentLease.callbackIntentLeaseId
          ? { expectedVersion: currentLease.version }
          : undefined,
      );

      const currentExpectation = await this.repositories.getCurrentCallbackExpectationEnvelopeForCase(
        callbackCase.callbackCaseId,
      );
      const dedupedExpectation = await this.repositories.findCallbackExpectationEnvelopeByCausalToken(
        callbackCase.callbackCaseId,
        input.expectationEnvelope.causalToken,
      );
      const nextExpectationEnvelope =
        dedupedExpectation ??
        normalizeCallbackExpectationEnvelope({
          ...input.expectationEnvelope,
          callbackCaseRef: callbackCase.callbackCaseId,
          monotoneRevision: (currentExpectation?.monotoneRevision ?? 0) + 1,
          version: 1,
        });
      if (!dedupedExpectation) {
        await this.repositories.saveCallbackExpectationEnvelope(nextExpectationEnvelope);
      }

      const nextCase = normalizeCallbackCase({
        ...callbackCase,
        state: input.nextCaseState,
        activeIntentLeaseRef: nextIntentLease.callbackIntentLeaseId,
        currentExpectationEnvelopeRef: nextExpectationEnvelope.expectationEnvelopeId,
        patientVisibleExpectationState: nextExpectationEnvelope.patientVisibleState,
        callbackUrgencyRef: input.callbackUrgencyRef ?? callbackCase.callbackUrgencyRef,
        preferredWindowRef: input.preferredWindowRef ?? callbackCase.preferredWindowRef,
        serviceWindowRef: nextIntentLease.serviceWindowRef,
        contactRouteRef: nextIntentLease.contactRouteRef,
        fallbackRouteRef: input.fallbackRouteRef ?? callbackCase.fallbackRouteRef,
        reachabilityDependencyRef:
          optionalRef(input.reachabilityDependencyRef) ?? callbackCase.reachabilityDependencyRef,
        updatedAt: recordedAt,
        version: nextVersion(callbackCase.version),
      });
      await this.repositories.saveCallbackCase(nextCase, {
        expectedVersion: callbackCase.version,
      });
      return this.queryCallbackBundle(callbackCase.callbackCaseId);
    });
  }

  private async requireCallbackCase(callbackCaseId: string): Promise<CallbackCaseSnapshot> {
    const callbackCase = await this.repositories.getCallbackCase(callbackCaseId);
    invariant(callbackCase, "CALLBACK_CASE_NOT_FOUND", `CallbackCase ${callbackCaseId} is required.`);
    return callbackCase;
  }

  private async requireCallbackAttempt(
    callbackAttemptRecordId: string,
  ): Promise<CallbackAttemptRecordSnapshot> {
    const attempt = await this.repositories.getCallbackAttemptRecord(callbackAttemptRecordId);
    invariant(
      attempt,
      "CALLBACK_ATTEMPT_NOT_FOUND",
      `CallbackAttemptRecord ${callbackAttemptRecordId} is required.`,
    );
    return attempt;
  }
}

export function createPhase3CallbackKernelStore(): Phase3CallbackKernelRepositories {
  return new InMemoryPhase3CallbackKernelStore();
}

export function createPhase3CallbackKernelService(
  repositories: Phase3CallbackKernelRepositories,
  options?: { idGenerator?: BackboneIdGenerator },
): Phase3CallbackKernelService {
  return new Phase3CallbackKernelServiceImpl(
    repositories,
    options?.idGenerator ?? createDeterministicBackboneIdGenerator("phase3_callback_kernel"),
  );
}
