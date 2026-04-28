import { createHash } from "node:crypto";
import type {
  NormalizedTelephonyEvent,
  TelephonyCallState,
  TelephonyCanonicalEventType,
  TelephonyMenuSelection,
} from "./telephony-edge-ingestion";

export const TELEPHONY_CALL_SESSION_SERVICE_NAME = "TelephonyCallSessionService";
export const TELEPHONY_CALL_SESSION_SCHEMA_VERSION = "188.phase2.call-session.v1";
export const TELEPHONY_CALL_SESSION_EVENT_SCHEMA_VERSION =
  "188.phase2.call-session-event.v1";
export const TELEPHONY_MENU_CAPTURE_SCHEMA_VERSION = "188.phase2.menu-capture.v1";
export const TELEPHONY_CALL_SESSION_PROJECTION_SCHEMA_VERSION =
  "188.phase2.call-session-projection.v1";
export const TELEPHONY_CALL_SESSION_POLICY_VERSION =
  "phase2-call-session-state-machine-188.v1";
export const TELEPHONY_CALL_SESSION_TIMEOUT_POLICY_VERSION =
  "phase2-call-session-timeout-policy-188.v1";

export const callSessionStateMachineMigrationPlanRefs = [
  "services/command-api/migrations/103_phase2_call_session_state_machine.sql",
] as const;

export const callSessionStateMachinePersistenceTables = [
  "phase2_call_session_canonical_events",
  "phase2_call_session_aggregates",
  "phase2_menu_selection_captures",
  "phase2_telephony_urgent_live_assessments",
  "phase2_telephony_safety_preemption_records",
  "phase2_call_session_support_projections",
  "phase2_call_session_rebuild_checkpoints",
  "phase2_call_session_timeout_policies",
] as const;

export const callSessionStateMachineGapResolutions = [
  "GAP_RESOLVED_PHASE2_CALL_SESSION_EVENT_TAXONOMY",
  "GAP_RESOLVED_PHASE2_CALL_SESSION_TIMEOUT_POLICY",
  "GAP_RESOLVED_PHASE2_CALL_SESSION_MENU_CORRECTION_APPEND_ONLY",
  "GAP_RESOLVED_PHASE2_CALL_SESSION_PROVIDER_COMPLETED_NOT_CLOSED",
  "GAP_RESOLVED_PHASE2_CALL_SESSION_URGENT_LIVE_CONTINUES_EVIDENCE",
] as const;

export const CALL_SESSION_REASON_CODES = [
  "TEL_SESSION_188_CALL_SESSION_CREATED",
  "TEL_SESSION_188_EVENT_APPLIED",
  "TEL_SESSION_188_DUPLICATE_EVENT_REPLAY_COLLAPSED",
  "TEL_SESSION_188_OUT_OF_ORDER_REBUILD_ORDERED",
  "TEL_SESSION_188_MENU_CAPTURE_APPENDED",
  "TEL_SESSION_188_MENU_CORRECTION_APPENDED",
  "TEL_SESSION_188_URGENT_ASSESSMENT_OPENED",
  "TEL_SESSION_188_URGENT_ASSESSMENT_REFRESHED",
  "TEL_SESSION_188_URGENT_LIVE_PREEMPTION_OPENED",
  "TEL_SESSION_188_PROVIDER_COMPLETION_NOT_PLATFORM_CLOSED",
  "TEL_SESSION_188_PROVIDER_ERROR_RECORDED",
  "TEL_SESSION_188_ABANDONMENT_SETTLED",
  "TEL_SESSION_188_TIMEOUT_POLICY_APPLIED",
  "TEL_SESSION_188_RECORDING_REF_ATTACHED",
  "TEL_SESSION_188_PROMOTION_SHORTCUT_BLOCKED",
  "TEL_SESSION_188_ILLEGAL_TRANSITION_BLOCKED",
  "TEL_SESSION_188_TERMINAL_STATE_PRESERVED",
  "TEL_SESSION_188_SUPPORT_SAFE_PROJECTION_DERIVED",
  "TEL_SESSION_188_REBUILD_DETERMINISTIC",
  "TEL_SESSION_188_NO_RAW_PROVIDER_PAYLOAD",
] as const;

export type CallSessionReasonCode = (typeof CALL_SESSION_REASON_CODES)[number];

export type CallSessionEventType =
  | "call_initiated"
  | "call_answered"
  | "menu_captured"
  | "identity_step_started"
  | "identity_resolved"
  | "identity_partial"
  | "identity_attempt_failed"
  | "recording_promised"
  | "recording_available"
  | "provider_error"
  | "call_abandoned"
  | "call_completed"
  | "urgent_live_signal_observed"
  | "operator_override_requested"
  | "manual_followup_requested"
  | "transcript_readiness_recorded"
  | "evidence_readiness_assessed"
  | "continuation_eligibility_settled"
  | "continuation_sent"
  | "request_seeded"
  | "submission_promoted"
  | "call_closed";

export type CallSessionMenuTransportSource =
  | "dtmf"
  | "speech"
  | "operator"
  | "simulator"
  | "unknown";
export type CallSessionMenuParsePosture =
  | "exact"
  | "speech_confident"
  | "speech_uncertain"
  | "operator_confirmed"
  | "unknown";
export type CallSessionUrgentLiveOutcome = "none" | "suspected" | "urgent_live_required";
export type CallSessionUrgentLiveState = "open" | "preempted" | "cleared" | "superseded";
export type CallSessionNextMilestone =
  | "capture_menu_selection"
  | "start_identity_capture"
  | "settle_identity_capture"
  | "await_recording_promise"
  | "await_recording"
  | "prepare_evidence"
  | "await_readiness_assessment"
  | "continue_urgent_live_and_evidence"
  | "dispatch_continuation"
  | "seed_canonical_request"
  | "promote_submission"
  | "settle_manual_followup"
  | "closed";
export type CallSessionBlockerReason =
  | "none"
  | "waiting_for_call_start"
  | "waiting_for_menu_selection"
  | "identity_required_before_promotion"
  | "recording_expected_missing"
  | "recording_missing"
  | "provider_error"
  | "urgent_live_only_not_routine"
  | "manual_followup_required"
  | "manual_audio_review_required"
  | "readiness_required_before_promotion"
  | "platform_close_required";

export interface CallSessionEventPayload {
  readonly menuPath?: TelephonyMenuSelection;
  readonly rawTransportSourceFamily?: CallSessionMenuTransportSource;
  readonly normalizedMenuCode?: string;
  readonly confidence?: number;
  readonly parsePosture?: CallSessionMenuParsePosture;
  readonly branchRepeatCount?: number;
  readonly correctionOfCaptureRef?: string | null;
  readonly maskedCallerContextRef?: string | null;
  readonly maskedCallerFragment?: string | null;
  readonly recordingArtifactRef?: string;
  readonly recordingJobRef?: string;
  readonly transcriptReadinessRef?: string;
  readonly evidenceReadinessAssessmentRef?: string;
  readonly continuationEligibilityRef?: string;
  readonly manualReviewDispositionRef?: string;
  readonly verificationRef?: string;
  readonly requestSeedRef?: string;
  readonly latestSubmissionIngressRef?: string;
  readonly lineageRef?: string;
  readonly urgentSignalRefs?: readonly string[];
  readonly urgentSignalSourceClasses?: readonly (
    | "ivr_selection"
    | "spoken_phrase"
    | "staff_observation"
    | "live_rule"
  )[];
  readonly providerErrorRef?: string;
  readonly providerCompletionRef?: string;
  readonly operatorOverrideRef?: string;
  readonly reasonCodes?: readonly string[];
}

export interface CallSessionCanonicalEvent {
  readonly schemaVersion: typeof TELEPHONY_CALL_SESSION_EVENT_SCHEMA_VERSION;
  readonly callSessionEventRef: string;
  readonly eventType: CallSessionEventType;
  readonly sourceCanonicalEventRef: string;
  readonly sourceCanonicalEventType: TelephonyCanonicalEventType | "manual_timeout" | "operator";
  readonly callSessionRef: string;
  readonly providerCorrelationRef: string;
  readonly idempotencyKey: string;
  readonly sequence: number | null;
  readonly occurredAt: string;
  readonly recordedAt: string;
  readonly payload: CallSessionEventPayload;
  readonly reasonCodes: readonly CallSessionReasonCode[];
  readonly policyVersionRef: typeof TELEPHONY_CALL_SESSION_POLICY_VERSION;
  readonly createdByAuthority: typeof TELEPHONY_CALL_SESSION_SERVICE_NAME;
}

export interface MenuSelectionCapture {
  readonly schemaVersion: typeof TELEPHONY_MENU_CAPTURE_SCHEMA_VERSION;
  readonly menuCaptureRef: string;
  readonly callSessionRef: string;
  readonly selectedTopLevelPath: TelephonyMenuSelection;
  readonly rawTransportSourceFamily: CallSessionMenuTransportSource;
  readonly normalizedMenuCode: string;
  readonly capturedAt: string;
  readonly providerEventRef: string;
  readonly confidence: number | null;
  readonly parsePosture: CallSessionMenuParsePosture;
  readonly branchRepeatCount: number;
  readonly correctionOfCaptureRef: string | null;
  readonly maskedCallerContextRef: string | null;
  readonly sessionCorrelationRefs: readonly string[];
  readonly canonicalEventRef: string;
  readonly policyVersionRef: typeof TELEPHONY_CALL_SESSION_POLICY_VERSION;
  readonly createdByAuthority: typeof TELEPHONY_CALL_SESSION_SERVICE_NAME;
}

export interface TelephonyUrgentLiveAssessmentRecord {
  readonly telephonyUrgentLiveAssessmentId: string;
  readonly callSessionRef: string;
  readonly signalRefs: readonly string[];
  readonly signalSourceClasses: readonly (
    | "ivr_selection"
    | "spoken_phrase"
    | "staff_observation"
    | "live_rule"
  )[];
  readonly assessmentOutcome: CallSessionUrgentLiveOutcome;
  readonly preemptionRef: string | null;
  readonly assessmentState: CallSessionUrgentLiveState;
  readonly assessedAt: string;
  readonly reasonCodes: readonly CallSessionReasonCode[];
  readonly policyVersionRef: typeof TELEPHONY_CALL_SESSION_POLICY_VERSION;
  readonly createdByAuthority: typeof TELEPHONY_CALL_SESSION_SERVICE_NAME;
}

export interface TelephonySafetyPreemptionRecord {
  readonly safetyPreemptionRef: string;
  readonly callSessionRef: string;
  readonly priority: "urgent_live";
  readonly status: "pending";
  readonly openedByUrgentLiveAssessmentRef: string;
  readonly openedAt: string;
  readonly reasonCodes: readonly CallSessionReasonCode[];
  readonly policyVersionRef: typeof TELEPHONY_CALL_SESSION_POLICY_VERSION;
  readonly createdByAuthority: typeof TELEPHONY_CALL_SESSION_SERVICE_NAME;
}

export interface CallSessionRebuildRule {
  readonly source: "canonical_call_session_events_plus_immutable_assessment_refs";
  readonly eventOrdering: "sequence_then_occurred_at_then_event_precedence_then_ref";
  readonly menuHandling: "append_only_latest_non_duplicate_capture_is_current";
  readonly providerCompletionHandling: "provider_completed_does_not_mean_platform_closed";
  readonly promotionHandling: "promotion_relevant_states_require_authoritative_readiness_refs";
  readonly providerPayloadHandling: "payload_ref_only_raw_payload_never_replayed_below_edge";
}

export interface CallSessionAggregate {
  readonly schemaVersion: typeof TELEPHONY_CALL_SESSION_SCHEMA_VERSION;
  readonly callSessionRef: string;
  readonly providerCorrelationRef: string;
  readonly callState: TelephonyCallState;
  readonly stateSequence: readonly TelephonyCallState[];
  readonly canonicalEventRefs: readonly string[];
  readonly eventIdempotencyKeys: readonly string[];
  readonly menuCaptureRefs: readonly string[];
  readonly currentMenuCaptureRef: string | null;
  readonly currentMenuPath: TelephonyMenuSelection | null;
  readonly urgentLiveAssessmentRefs: readonly string[];
  readonly currentUrgentLiveAssessmentRef: string;
  readonly urgentLivePosture: CallSessionUrgentLiveOutcome;
  readonly safetyPreemptionRef: string | null;
  readonly recordingRefs: readonly string[];
  readonly verificationRef: string | null;
  readonly transcriptReadinessRef: string | null;
  readonly evidenceReadinessAssessmentRef: string | null;
  readonly continuationEligibilityRef: string | null;
  readonly manualReviewDispositionRef: string | null;
  readonly requestSeedRef: string | null;
  readonly latestSubmissionIngressRef: string | null;
  readonly lineageRef: string;
  readonly maskedCallerRef: string | null;
  readonly maskedCallerFragment: string | null;
  readonly currentLastSeenEventRef: string;
  readonly nextExpectedMilestone: CallSessionNextMilestone;
  readonly activeBlockerReason: CallSessionBlockerReason;
  readonly policyVersionRef: typeof TELEPHONY_CALL_SESSION_POLICY_VERSION;
  readonly timeoutPolicyVersionRef: typeof TELEPHONY_CALL_SESSION_TIMEOUT_POLICY_VERSION;
  readonly rebuildRule: CallSessionRebuildRule;
  readonly stateRevision: number;
  readonly reasonCodes: readonly CallSessionReasonCode[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByAuthority: typeof TELEPHONY_CALL_SESSION_SERVICE_NAME;
}

export interface CallSessionSupportProjection {
  readonly schemaVersion: typeof TELEPHONY_CALL_SESSION_PROJECTION_SCHEMA_VERSION;
  readonly projectionRef: string;
  readonly callSessionRef: string;
  readonly currentCallState: TelephonyCallState;
  readonly currentMenuPath: TelephonyMenuSelection | null;
  readonly currentUrgentLivePosture: CallSessionUrgentLiveOutcome;
  readonly currentLastSeenEventRef: string;
  readonly nextExpectedMilestone: CallSessionNextMilestone;
  readonly activeBlockerOrHoldReason: CallSessionBlockerReason;
  readonly linkedRecordingRefs: readonly string[];
  readonly verificationRef: string | null;
  readonly transcriptReadinessRef: string | null;
  readonly evidenceReadinessAssessmentRef: string | null;
  readonly continuationEligibilityRef: string | null;
  readonly maskedCallerFragment: string | null;
  readonly disclosureBoundary: "support_safe_masked_projection";
  readonly derivedFromEventRefs: readonly string[];
  readonly derivedAt: string;
  readonly reasonCodes: readonly CallSessionReasonCode[];
  readonly createdByAuthority: typeof TELEPHONY_CALL_SESSION_SERVICE_NAME;
}

export interface CallSessionTimeoutPolicy {
  readonly schemaVersion: "188.phase2.call-session-timeout-policy.v1";
  readonly policyVersionRef: typeof TELEPHONY_CALL_SESSION_TIMEOUT_POLICY_VERSION;
  readonly menuSelectedTimeoutSeconds: 180;
  readonly identityInProgressTimeoutSeconds: 240;
  readonly recordingExpectedTimeoutSeconds: 600;
  readonly timeoutClock: "last_state_transition_updated_at";
  readonly timeoutDisposition: {
    readonly menu_selected: "abandoned";
    readonly identity_in_progress: "manual_followup_required";
    readonly recording_expected: "recording_missing";
  };
  readonly createdByAuthority: typeof TELEPHONY_CALL_SESSION_SERVICE_NAME;
}

export interface CallSessionApplyResult {
  readonly session: CallSessionAggregate;
  readonly eventApplied: boolean;
  readonly menuCapture: MenuSelectionCapture | null;
  readonly urgentLiveAssessment: TelephonyUrgentLiveAssessmentRecord | null;
  readonly safetyPreemption: TelephonySafetyPreemptionRecord | null;
  readonly projection: CallSessionSupportProjection;
  readonly reasonCodes: readonly CallSessionReasonCode[];
}

export interface CallSessionRepositorySnapshot {
  readonly events: readonly CallSessionCanonicalEvent[];
  readonly sessions: readonly CallSessionAggregate[];
  readonly menuCaptures: readonly MenuSelectionCapture[];
  readonly urgentLiveAssessments: readonly TelephonyUrgentLiveAssessmentRecord[];
  readonly safetyPreemptions: readonly TelephonySafetyPreemptionRecord[];
  readonly projections: readonly CallSessionSupportProjection[];
}

export interface CallSessionRepository {
  saveEvent(event: CallSessionCanonicalEvent): Promise<void>;
  listEvents(callSessionRef: string): Promise<readonly CallSessionCanonicalEvent[]>;
  findSession(callSessionRef: string): Promise<CallSessionAggregate | undefined>;
  saveSession(session: CallSessionAggregate): Promise<void>;
  saveMenuCapture(capture: MenuSelectionCapture): Promise<void>;
  findMenuCapture(menuCaptureRef: string): Promise<MenuSelectionCapture | undefined>;
  saveUrgentLiveAssessment(assessment: TelephonyUrgentLiveAssessmentRecord): Promise<void>;
  saveSafetyPreemption(preemption: TelephonySafetyPreemptionRecord): Promise<void>;
  saveProjection(projection: CallSessionSupportProjection): Promise<void>;
  getProjection(callSessionRef: string): Promise<CallSessionSupportProjection | undefined>;
  snapshots?(): CallSessionRepositorySnapshot;
}

export interface CallSessionStateMachineService {
  appendCallSessionEvent(event: CallSessionCanonicalEvent): Promise<CallSessionApplyResult>;
  appendNormalizedTelephonyEvent(event: NormalizedTelephonyEvent): Promise<CallSessionApplyResult>;
  rebuildCallSession(callSessionRef: string): Promise<CallSessionApplyResult | null>;
  getSupportProjection(callSessionRef: string): Promise<CallSessionSupportProjection | undefined>;
  evaluateTimeout(input: {
    readonly callSessionRef: string;
    readonly evaluatedAt: string;
  }): Promise<CallSessionApplyResult | null>;
}

export interface CallSessionStateMachineApplication {
  readonly migrationPlanRefs: typeof callSessionStateMachineMigrationPlanRefs;
  readonly persistenceTables: typeof callSessionStateMachinePersistenceTables;
  readonly gapResolutions: typeof callSessionStateMachineGapResolutions;
  readonly timeoutPolicy: CallSessionTimeoutPolicy;
  readonly service: CallSessionStateMachineService;
  readonly repository: CallSessionRepository;
}

export const defaultCallSessionTimeoutPolicy: CallSessionTimeoutPolicy = {
  schemaVersion: "188.phase2.call-session-timeout-policy.v1",
  policyVersionRef: TELEPHONY_CALL_SESSION_TIMEOUT_POLICY_VERSION,
  menuSelectedTimeoutSeconds: 180,
  identityInProgressTimeoutSeconds: 240,
  recordingExpectedTimeoutSeconds: 600,
  timeoutClock: "last_state_transition_updated_at",
  timeoutDisposition: {
    menu_selected: "abandoned",
    identity_in_progress: "manual_followup_required",
    recording_expected: "recording_missing",
  },
  createdByAuthority: TELEPHONY_CALL_SESSION_SERVICE_NAME,
};

export const callSessionRebuildRule: CallSessionRebuildRule = {
  source: "canonical_call_session_events_plus_immutable_assessment_refs",
  eventOrdering: "sequence_then_occurred_at_then_event_precedence_then_ref",
  menuHandling: "append_only_latest_non_duplicate_capture_is_current",
  providerCompletionHandling: "provider_completed_does_not_mean_platform_closed",
  promotionHandling: "promotion_relevant_states_require_authoritative_readiness_refs",
  providerPayloadHandling: "payload_ref_only_raw_payload_never_replayed_below_edge",
};

export const callSessionTransitionMatrix = [
  ["__start__", "initiated", "call_initiated"],
  ["initiated", "menu_selected", "menu_captured"],
  ["initiated", "abandoned", "call_abandoned"],
  ["initiated", "provider_error", "provider_error"],
  ["menu_selected", "identity_in_progress", "identity_step_started"],
  ["menu_selected", "urgent_live_only", "urgent_live_signal_observed"],
  ["menu_selected", "recording_expected", "recording_promised"],
  ["menu_selected", "abandoned", "call_abandoned"],
  ["identity_in_progress", "identity_resolved", "identity_resolved"],
  ["identity_in_progress", "identity_partial", "identity_partial"],
  ["identity_in_progress", "identity_failed", "identity_attempt_failed"],
  ["identity_in_progress", "manual_followup_required", "manual_followup_requested"],
  ["identity_resolved", "recording_expected", "recording_promised"],
  ["identity_partial", "recording_expected", "recording_promised"],
  ["recording_expected", "recording_available", "recording_available"],
  ["recording_expected", "recording_missing", "manual_followup_requested"],
  ["recording_expected", "provider_error", "provider_error"],
  ["recording_available", "evidence_preparing", "transcript_readiness_recorded"],
  ["recording_available", "provider_error", "provider_error"],
  ["evidence_preparing", "evidence_pending", "transcript_readiness_recorded"],
  ["evidence_preparing", "transcript_degraded", "transcript_readiness_recorded"],
  ["evidence_pending", "urgent_live_only", "evidence_readiness_assessed"],
  ["evidence_pending", "continuation_eligible", "continuation_eligibility_settled"],
  ["evidence_pending", "evidence_ready", "evidence_readiness_assessed"],
  ["evidence_pending", "manual_audio_review_required", "manual_followup_requested"],
  ["urgent_live_only", "evidence_pending", "evidence_readiness_assessed"],
  ["urgent_live_only", "manual_followup_required", "manual_followup_requested"],
  ["continuation_eligible", "continuation_sent", "continuation_sent"],
  ["continuation_eligible", "evidence_ready", "evidence_readiness_assessed"],
  ["evidence_ready", "request_seeded", "request_seeded"],
  ["request_seeded", "submitted", "submission_promoted"],
  ["submitted", "closed", "call_closed"],
  ["abandoned", "closed", "call_closed"],
  ["provider_error", "manual_followup_required", "manual_followup_requested"],
  ["provider_error", "closed", "call_closed"],
  ["manual_followup_required", "closed", "call_closed"],
  ["manual_audio_review_required", "evidence_pending", "evidence_readiness_assessed"],
  ["manual_audio_review_required", "evidence_ready", "evidence_readiness_assessed"],
  ["manual_audio_review_required", "closed", "call_closed"],
  ["transcript_degraded", "manual_audio_review_required", "manual_followup_requested"],
] as const;

const terminalStates = new Set<TelephonyCallState>(["closed", "submitted"]);

const eventPrecedence: Record<CallSessionEventType, number> = {
  call_initiated: 10,
  call_answered: 20,
  menu_captured: 30,
  urgent_live_signal_observed: 35,
  identity_step_started: 40,
  identity_resolved: 45,
  identity_partial: 46,
  identity_attempt_failed: 47,
  recording_promised: 50,
  call_completed: 55,
  call_abandoned: 60,
  recording_available: 70,
  transcript_readiness_recorded: 80,
  evidence_readiness_assessed: 90,
  continuation_eligibility_settled: 100,
  continuation_sent: 110,
  request_seeded: 120,
  submission_promoted: 130,
  provider_error: 140,
  operator_override_requested: 150,
  manual_followup_requested: 160,
  call_closed: 170,
};

function assert(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) throw new Error(`${code}: ${message}`);
}

function digest(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableRef(prefix: string, value: unknown): string {
  return `${prefix}_${digest(value).slice(0, 24)}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function unique<TValue extends string>(values: readonly TValue[]): TValue[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function iso(value: string, field: string): string {
  const parsed = Date.parse(value);
  assert(!Number.isNaN(parsed), "INVALID_CALL_SESSION_TIMESTAMP", `${field} must be ISO.`);
  return new Date(parsed).toISOString();
}

function sortEvents(
  events: readonly CallSessionCanonicalEvent[],
): readonly CallSessionCanonicalEvent[] {
  return [...events].sort((left, right) => {
    const leftSeq = left.sequence ?? Number.MAX_SAFE_INTEGER;
    const rightSeq = right.sequence ?? Number.MAX_SAFE_INTEGER;
    if (leftSeq !== rightSeq) return leftSeq - rightSeq;
    const occurred = left.occurredAt.localeCompare(right.occurredAt);
    if (occurred !== 0) return occurred;
    const precedence = eventPrecedence[left.eventType] - eventPrecedence[right.eventType];
    if (precedence !== 0) return precedence;
    return left.callSessionEventRef.localeCompare(right.callSessionEventRef);
  });
}

function eventTypeFromNormalized(event: NormalizedTelephonyEvent): CallSessionEventType {
  const providerStatusClass = event.normalizedPayload.providerStatusClass;
  switch (event.canonicalEventType) {
    case "call_started":
      return providerStatusClass === "call.answered" ? "call_answered" : "call_initiated";
    case "menu_selection_captured":
      return "menu_captured";
    case "identity_capture_started":
      return "identity_step_started";
    case "identity_resolved":
      return "identity_resolved";
    case "identity_partial":
      return "identity_partial";
    case "identity_failed":
      return "identity_attempt_failed";
    case "recording_expected":
      return "recording_promised";
    case "recording_available":
      return "recording_available";
    case "provider_error_recorded":
      return "provider_error";
    case "call_abandoned":
      return providerStatusClass === "provider_completed_not_platform_closed"
        ? "call_completed"
        : "call_abandoned";
    case "urgent_live_preempted":
      return "urgent_live_signal_observed";
    case "manual_review_opened":
      return "operator_override_requested";
    case "manual_followup_opened":
      return "manual_followup_requested";
    case "transcript_ready":
    case "transcript_degraded":
    case "transcript_job_queued":
      return "transcript_readiness_recorded";
    case "evidence_readiness_assessed":
      return "evidence_readiness_assessed";
    case "continuation_eligibility_settled":
      return "continuation_eligibility_settled";
    case "continuation_sent":
      return "continuation_sent";
    case "request_seeded":
      return "request_seeded";
    case "submission_promoted":
      return "submission_promoted";
    case "call_closed":
      return "call_closed";
    case "audio_quarantined":
    case "recording_missing":
      return "manual_followup_requested";
    default:
      return "provider_error";
  }
}

function normalizedMenuCode(menuPath: TelephonyMenuSelection | undefined): string {
  switch (menuPath) {
    case "symptoms":
      return "MENU_SYMPTOMS";
    case "medications":
      return "MENU_MEDS";
    case "admin":
      return "MENU_ADMIN";
    case "results":
      return "MENU_RESULTS";
    default:
      return "MENU_UNKNOWN";
  }
}

export function callSessionEventFromNormalizedTelephonyEvent(
  event: NormalizedTelephonyEvent,
): CallSessionCanonicalEvent {
  const eventType = eventTypeFromNormalized(event);
  const menuPath = event.normalizedPayload.menuSelection;
  const reasonCodes: CallSessionReasonCode[] = ["TEL_SESSION_188_NO_RAW_PROVIDER_PAYLOAD"];
  if (eventType === "call_completed") {
    reasonCodes.push("TEL_SESSION_188_PROVIDER_COMPLETION_NOT_PLATFORM_CLOSED");
  }
  if (eventType === "provider_error") reasonCodes.push("TEL_SESSION_188_PROVIDER_ERROR_RECORDED");
  if (eventType === "menu_captured") reasonCodes.push("TEL_SESSION_188_MENU_CAPTURE_APPENDED");
  if (event.normalizedPayload.recordingArtifactRef) {
    reasonCodes.push("TEL_SESSION_188_RECORDING_REF_ATTACHED");
  }
  return createCallSessionCanonicalEvent({
    eventType,
    sourceCanonicalEventRef: event.canonicalEventId,
    sourceCanonicalEventType: event.canonicalEventType,
    callSessionRef: event.callSessionRef,
    providerCorrelationRef: event.providerCallRef,
    idempotencyKey: event.idempotencyKey,
    sequence: event.sequence,
    occurredAt: event.occurredAt,
    recordedAt: event.normalizedAt,
    payload: {
      ...(menuPath
        ? {
            menuPath,
            rawTransportSourceFamily: "dtmf",
            normalizedMenuCode: normalizedMenuCode(menuPath),
            confidence: 1,
            parsePosture: "exact",
          }
        : {}),
      maskedCallerContextRef: event.normalizedPayload.maskedCallerRef ?? null,
      maskedCallerFragment: event.normalizedPayload.maskedCallerFragment ?? null,
      recordingArtifactRef: event.normalizedPayload.recordingArtifactRef,
      recordingJobRef: event.normalizedPayload.recordingJobRef,
      providerErrorRef: event.normalizedPayload.providerErrorRef,
      urgentSignalRefs: event.normalizedPayload.reasonCodes.some((code) =>
        code.toLowerCase().includes("urgent_live"),
      )
        ? [event.canonicalEventId]
        : [],
      urgentSignalSourceClasses: event.normalizedPayload.reasonCodes.some((code) =>
        code.toLowerCase().includes("urgent_live"),
      )
        ? ["live_rule"]
        : [],
      reasonCodes: event.normalizedPayload.reasonCodes,
    },
    reasonCodes,
  });
}

export function createCallSessionCanonicalEvent(input: {
  readonly eventType: CallSessionEventType;
  readonly sourceCanonicalEventRef?: string;
  readonly sourceCanonicalEventType?: TelephonyCanonicalEventType | "manual_timeout" | "operator";
  readonly callSessionRef: string;
  readonly providerCorrelationRef?: string;
  readonly idempotencyKey?: string;
  readonly sequence?: number | null;
  readonly occurredAt: string;
  readonly recordedAt?: string;
  readonly payload?: CallSessionEventPayload;
  readonly reasonCodes?: readonly CallSessionReasonCode[];
}): CallSessionCanonicalEvent {
  const occurredAt = iso(input.occurredAt, "occurredAt");
  const recordedAt = iso(input.recordedAt ?? input.occurredAt, "recordedAt");
  const sourceCanonicalEventRef =
    input.sourceCanonicalEventRef ??
    stableRef("tel_call_session_source_event_188", {
      callSessionRef: input.callSessionRef,
      eventType: input.eventType,
      occurredAt,
      sequence: input.sequence ?? null,
    });
  const idempotencyKey =
    input.idempotencyKey ??
    stableRef("tel_call_session_idempotency_188", {
      callSessionRef: input.callSessionRef,
      eventType: input.eventType,
      sourceCanonicalEventRef,
    });
  return {
    schemaVersion: TELEPHONY_CALL_SESSION_EVENT_SCHEMA_VERSION,
    callSessionEventRef: stableRef("tel_call_session_event_188", {
      callSessionRef: input.callSessionRef,
      eventType: input.eventType,
      sourceCanonicalEventRef,
      idempotencyKey,
    }),
    eventType: input.eventType,
    sourceCanonicalEventRef,
    sourceCanonicalEventType: input.sourceCanonicalEventType ?? "operator",
    callSessionRef: input.callSessionRef,
    providerCorrelationRef:
      input.providerCorrelationRef ??
      stableRef("provider_correlation_188", { callSessionRef: input.callSessionRef }),
    idempotencyKey,
    sequence: input.sequence ?? null,
    occurredAt,
    recordedAt,
    payload: input.payload ?? {},
    reasonCodes: unique([
      "TEL_SESSION_188_NO_RAW_PROVIDER_PAYLOAD",
      ...(input.reasonCodes ?? []),
    ]),
    policyVersionRef: TELEPHONY_CALL_SESSION_POLICY_VERSION,
    createdByAuthority: TELEPHONY_CALL_SESSION_SERVICE_NAME,
  };
}

function nextMilestoneFor(state: TelephonyCallState): CallSessionNextMilestone {
  switch (state) {
    case "initiated":
      return "capture_menu_selection";
    case "menu_selected":
      return "start_identity_capture";
    case "identity_in_progress":
      return "settle_identity_capture";
    case "identity_resolved":
    case "identity_partial":
      return "await_recording_promise";
    case "recording_expected":
      return "await_recording";
    case "recording_available":
      return "prepare_evidence";
    case "evidence_preparing":
      return "await_readiness_assessment";
    case "evidence_pending":
      return "await_readiness_assessment";
    case "urgent_live_only":
      return "continue_urgent_live_and_evidence";
    case "continuation_eligible":
      return "dispatch_continuation";
    case "continuation_sent":
      return "seed_canonical_request";
    case "evidence_ready":
      return "seed_canonical_request";
    case "request_seeded":
      return "promote_submission";
    case "manual_followup_required":
    case "manual_audio_review_required":
    case "recording_missing":
    case "transcript_degraded":
    case "provider_error":
    case "identity_failed":
      return "settle_manual_followup";
    case "submitted":
    case "closed":
    case "abandoned":
      return "closed";
  }
}

function blockerFor(state: TelephonyCallState): CallSessionBlockerReason {
  switch (state) {
    case "initiated":
      return "waiting_for_menu_selection";
    case "menu_selected":
    case "identity_in_progress":
    case "identity_partial":
    case "identity_resolved":
      return "identity_required_before_promotion";
    case "recording_expected":
      return "recording_expected_missing";
    case "urgent_live_only":
      return "urgent_live_only_not_routine";
    case "provider_error":
      return "provider_error";
    case "manual_followup_required":
    case "identity_failed":
      return "manual_followup_required";
    case "manual_audio_review_required":
    case "transcript_degraded":
      return "manual_audio_review_required";
    case "recording_missing":
      return "recording_missing";
    case "continuation_eligible":
      return "readiness_required_before_promotion";
    case "evidence_preparing":
    case "evidence_pending":
    case "recording_available":
    case "continuation_sent":
      return "readiness_required_before_promotion";
    case "evidence_ready":
    case "request_seeded":
    case "submitted":
    case "closed":
    case "abandoned":
      return "none";
  }
}

function createOpenUrgentLiveAssessment(
  event: CallSessionCanonicalEvent,
): TelephonyUrgentLiveAssessmentRecord {
  return {
    telephonyUrgentLiveAssessmentId: stableRef("tel_urgent_live_assessment_188", {
      callSessionRef: event.callSessionRef,
      openingEventRef: event.callSessionEventRef,
    }),
    callSessionRef: event.callSessionRef,
    signalRefs: [],
    signalSourceClasses: [],
    assessmentOutcome: "none",
    preemptionRef: null,
    assessmentState: "open",
    assessedAt: event.recordedAt,
    reasonCodes: ["TEL_SESSION_188_URGENT_ASSESSMENT_OPENED"],
    policyVersionRef: TELEPHONY_CALL_SESSION_POLICY_VERSION,
    createdByAuthority: TELEPHONY_CALL_SESSION_SERVICE_NAME,
  };
}

function createUrgentLiveAssessment(
  event: CallSessionCanonicalEvent,
  outcome: CallSessionUrgentLiveOutcome,
  preemptionRef: string | null,
): TelephonyUrgentLiveAssessmentRecord {
  return {
    telephonyUrgentLiveAssessmentId: stableRef("tel_urgent_live_assessment_188", {
      callSessionRef: event.callSessionRef,
      eventRef: event.callSessionEventRef,
      outcome,
    }),
    callSessionRef: event.callSessionRef,
    signalRefs: event.payload.urgentSignalRefs ?? [],
    signalSourceClasses: event.payload.urgentSignalSourceClasses ?? [],
    assessmentOutcome: outcome,
    preemptionRef,
    assessmentState: outcome === "urgent_live_required" ? "preempted" : "open",
    assessedAt: event.recordedAt,
    reasonCodes:
      outcome === "urgent_live_required"
        ? ["TEL_SESSION_188_URGENT_LIVE_PREEMPTION_OPENED"]
        : ["TEL_SESSION_188_URGENT_ASSESSMENT_REFRESHED"],
    policyVersionRef: TELEPHONY_CALL_SESSION_POLICY_VERSION,
    createdByAuthority: TELEPHONY_CALL_SESSION_SERVICE_NAME,
  };
}

function createSafetyPreemption(
  event: CallSessionCanonicalEvent,
  assessmentRef: string,
): TelephonySafetyPreemptionRecord {
  return {
    safetyPreemptionRef: stableRef("safety_preemption_urgent_live_188", {
      callSessionRef: event.callSessionRef,
      eventRef: event.callSessionEventRef,
    }),
    callSessionRef: event.callSessionRef,
    priority: "urgent_live",
    status: "pending",
    openedByUrgentLiveAssessmentRef: assessmentRef,
    openedAt: event.recordedAt,
    reasonCodes: ["TEL_SESSION_188_URGENT_LIVE_PREEMPTION_OPENED"],
    policyVersionRef: TELEPHONY_CALL_SESSION_POLICY_VERSION,
    createdByAuthority: TELEPHONY_CALL_SESSION_SERVICE_NAME,
  };
}

function createMenuCapture(
  event: CallSessionCanonicalEvent,
  session: CallSessionAggregate,
): MenuSelectionCapture {
  const selectedTopLevelPath = event.payload.menuPath ?? "unknown";
  const correctionOfCaptureRef =
    event.payload.correctionOfCaptureRef === undefined
      ? session.currentMenuCaptureRef
      : event.payload.correctionOfCaptureRef;
  return {
    schemaVersion: TELEPHONY_MENU_CAPTURE_SCHEMA_VERSION,
    menuCaptureRef: stableRef("tel_menu_capture_188", {
      callSessionRef: event.callSessionRef,
      eventRef: event.callSessionEventRef,
      menuPath: selectedTopLevelPath,
    }),
    callSessionRef: event.callSessionRef,
    selectedTopLevelPath,
    rawTransportSourceFamily: event.payload.rawTransportSourceFamily ?? "unknown",
    normalizedMenuCode: event.payload.normalizedMenuCode ?? normalizedMenuCode(selectedTopLevelPath),
    capturedAt: event.occurredAt,
    providerEventRef: event.sourceCanonicalEventRef,
    confidence: event.payload.confidence ?? null,
    parsePosture: event.payload.parsePosture ?? "unknown",
    branchRepeatCount: event.payload.branchRepeatCount ?? session.menuCaptureRefs.length,
    correctionOfCaptureRef,
    maskedCallerContextRef: event.payload.maskedCallerContextRef ?? session.maskedCallerRef,
    sessionCorrelationRefs: unique([
      event.callSessionRef,
      event.providerCorrelationRef,
      event.sourceCanonicalEventRef,
    ]),
    canonicalEventRef: event.callSessionEventRef,
    policyVersionRef: TELEPHONY_CALL_SESSION_POLICY_VERSION,
    createdByAuthority: TELEPHONY_CALL_SESSION_SERVICE_NAME,
  };
}

function createInitialSession(
  event: CallSessionCanonicalEvent,
): {
  readonly session: CallSessionAggregate;
  readonly urgentLiveAssessment: TelephonyUrgentLiveAssessmentRecord;
} {
  const urgentLiveAssessment = createOpenUrgentLiveAssessment(event);
  const callState: TelephonyCallState = "initiated";
  return {
    urgentLiveAssessment,
    session: {
      schemaVersion: TELEPHONY_CALL_SESSION_SCHEMA_VERSION,
      callSessionRef: event.callSessionRef,
      providerCorrelationRef: event.providerCorrelationRef,
      callState,
      stateSequence: [callState],
      canonicalEventRefs: [],
      eventIdempotencyKeys: [],
      menuCaptureRefs: [],
      currentMenuCaptureRef: null,
      currentMenuPath: null,
      urgentLiveAssessmentRefs: [urgentLiveAssessment.telephonyUrgentLiveAssessmentId],
      currentUrgentLiveAssessmentRef: urgentLiveAssessment.telephonyUrgentLiveAssessmentId,
      urgentLivePosture: "none",
      safetyPreemptionRef: null,
      recordingRefs: [],
      verificationRef: null,
      transcriptReadinessRef: null,
      evidenceReadinessAssessmentRef: null,
      continuationEligibilityRef: null,
      manualReviewDispositionRef: null,
      requestSeedRef: null,
      latestSubmissionIngressRef: null,
      lineageRef:
        event.payload.lineageRef ??
        stableRef("telephony_lineage_188", { callSessionRef: event.callSessionRef }),
      maskedCallerRef: event.payload.maskedCallerContextRef ?? null,
      maskedCallerFragment: event.payload.maskedCallerFragment ?? null,
      currentLastSeenEventRef: event.callSessionEventRef,
      nextExpectedMilestone: nextMilestoneFor(callState),
      activeBlockerReason: blockerFor(callState),
      policyVersionRef: TELEPHONY_CALL_SESSION_POLICY_VERSION,
      timeoutPolicyVersionRef: TELEPHONY_CALL_SESSION_TIMEOUT_POLICY_VERSION,
      rebuildRule: callSessionRebuildRule,
      stateRevision: 0,
      reasonCodes: ["TEL_SESSION_188_CALL_SESSION_CREATED"],
      createdAt: event.recordedAt,
      updatedAt: event.recordedAt,
      createdByAuthority: TELEPHONY_CALL_SESSION_SERVICE_NAME,
    },
  };
}

function transition(
  session: CallSessionAggregate,
  nextState: TelephonyCallState,
): Pick<CallSessionAggregate, "callState" | "stateSequence" | "nextExpectedMilestone" | "activeBlockerReason"> {
  if (session.callState === nextState) {
    return {
      callState: session.callState,
      stateSequence: session.stateSequence,
      nextExpectedMilestone: nextMilestoneFor(session.callState),
      activeBlockerReason: blockerFor(session.callState),
    };
  }
  return {
    callState: nextState,
    stateSequence: [...session.stateSequence, nextState],
    nextExpectedMilestone: nextMilestoneFor(nextState),
    activeBlockerReason: blockerFor(nextState),
  };
}

function hasUrgentSignal(event: CallSessionCanonicalEvent): boolean {
  if (event.eventType === "urgent_live_signal_observed") return true;
  if ((event.payload.urgentSignalRefs ?? []).length > 0) return true;
  return (event.payload.reasonCodes ?? []).some((code) => code.toLowerCase().includes("urgent"));
}

function promotionRefsPresent(session: CallSessionAggregate, event: CallSessionCanonicalEvent): boolean {
  return Boolean(
    event.payload.evidenceReadinessAssessmentRef ??
      session.evidenceReadinessAssessmentRef ??
      event.payload.requestSeedRef,
  );
}

function applyEvent(
  existing: CallSessionAggregate | null,
  event: CallSessionCanonicalEvent,
): CallSessionApplyResult {
  const initialized = existing ? null : createInitialSession(event);
  const openingAssessment = initialized?.urgentLiveAssessment ?? null;
  let session = existing ?? initialized?.session;
  assert(session, "CALL_SESSION_INITIALIZATION_FAILED", "CallSession could not be initialized.");
  if (session.eventIdempotencyKeys.includes(event.idempotencyKey)) {
    const projection = deriveCallSessionSupportProjection(session, event.recordedAt);
    return {
      session,
      eventApplied: false,
      menuCapture: null,
      urgentLiveAssessment: null,
      safetyPreemption: null,
      projection,
      reasonCodes: ["TEL_SESSION_188_DUPLICATE_EVENT_REPLAY_COLLAPSED"],
    };
  }

  let menuCapture: MenuSelectionCapture | null = null;
  let urgentLiveAssessment: TelephonyUrgentLiveAssessmentRecord | null = openingAssessment;
  let safetyPreemption: TelephonySafetyPreemptionRecord | null = null;
  let nextState = session.callState;
  let activeBlockerOverride: CallSessionBlockerReason | null = null;
  const reasonCodes: CallSessionReasonCode[] = [
    "TEL_SESSION_188_EVENT_APPLIED",
    ...(existing ? [] : (["TEL_SESSION_188_CALL_SESSION_CREATED"] as const)),
    ...event.reasonCodes,
  ];
  const recordingRefs = unique([
    ...session.recordingRefs,
    ...(event.payload.recordingArtifactRef ? [event.payload.recordingArtifactRef] : []),
  ]);
  if (event.payload.recordingArtifactRef) {
    reasonCodes.push("TEL_SESSION_188_RECORDING_REF_ATTACHED");
  }

  if (event.eventType === "menu_captured") {
    menuCapture = createMenuCapture(event, session);
    reasonCodes.push(
      menuCapture.correctionOfCaptureRef
        ? "TEL_SESSION_188_MENU_CORRECTION_APPENDED"
        : "TEL_SESSION_188_MENU_CAPTURE_APPENDED",
    );
    const menuOutcome = hasUrgentSignal(event)
      ? "urgent_live_required"
      : event.payload.menuPath === "symptoms"
        ? "suspected"
        : "none";
    const tentativeAssessmentRef = stableRef("tel_urgent_live_assessment_188", {
      callSessionRef: event.callSessionRef,
      eventRef: event.callSessionEventRef,
      outcome: menuOutcome,
    });
    safetyPreemption =
      menuOutcome === "urgent_live_required"
        ? createSafetyPreemption(event, tentativeAssessmentRef)
        : null;
    urgentLiveAssessment = createUrgentLiveAssessment(
      event,
      menuOutcome,
      safetyPreemption?.safetyPreemptionRef ?? null,
    );
    reasonCodes.push("TEL_SESSION_188_URGENT_ASSESSMENT_REFRESHED");
    if (menuOutcome === "urgent_live_required") {
      nextState = "urgent_live_only";
      reasonCodes.push("TEL_SESSION_188_URGENT_LIVE_PREEMPTION_OPENED");
    } else if (!terminalStates.has(session.callState) && session.callState !== "abandoned") {
      nextState = "menu_selected";
    } else {
      reasonCodes.push("TEL_SESSION_188_TERMINAL_STATE_PRESERVED");
    }
  } else if (hasUrgentSignal(event)) {
    const assessmentRef = stableRef("tel_urgent_live_assessment_188", {
      callSessionRef: event.callSessionRef,
      eventRef: event.callSessionEventRef,
      outcome: "urgent_live_required",
    });
    safetyPreemption = createSafetyPreemption(event, assessmentRef);
    urgentLiveAssessment = createUrgentLiveAssessment(
      event,
      "urgent_live_required",
      safetyPreemption.safetyPreemptionRef,
    );
    nextState = "urgent_live_only";
    reasonCodes.push("TEL_SESSION_188_URGENT_LIVE_PREEMPTION_OPENED");
  } else {
    switch (event.eventType) {
      case "call_initiated":
      case "call_answered":
        nextState = session.callState;
        break;
      case "identity_step_started":
        nextState = session.callState === "menu_selected" ? "identity_in_progress" : session.callState;
        if (session.callState !== "menu_selected") {
          activeBlockerOverride = "waiting_for_menu_selection";
          reasonCodes.push("TEL_SESSION_188_ILLEGAL_TRANSITION_BLOCKED");
        }
        break;
      case "identity_resolved":
        nextState =
          session.callState === "identity_in_progress" ? "identity_resolved" : session.callState;
        break;
      case "identity_partial":
        nextState =
          session.callState === "identity_in_progress" ? "identity_partial" : session.callState;
        break;
      case "identity_attempt_failed":
        nextState = "identity_failed";
        break;
      case "recording_promised":
        nextState =
          session.callState === "closed" || session.callState === "abandoned"
            ? session.callState
            : "recording_expected";
        break;
      case "recording_available":
        if (session.callState === "closed" || session.callState === "abandoned") {
          nextState = session.callState;
          reasonCodes.push("TEL_SESSION_188_TERMINAL_STATE_PRESERVED");
        } else if (session.callState === "recording_expected") {
          nextState = "recording_available";
        } else {
          activeBlockerOverride = "recording_expected_missing";
          reasonCodes.push("TEL_SESSION_188_ILLEGAL_TRANSITION_BLOCKED");
        }
        break;
      case "call_completed":
        nextState = session.callState;
        activeBlockerOverride =
          session.callState === "initiated" ? "waiting_for_menu_selection" : blockerFor(session.callState);
        reasonCodes.push("TEL_SESSION_188_PROVIDER_COMPLETION_NOT_PLATFORM_CLOSED");
        break;
      case "call_abandoned":
        nextState = "abandoned";
        reasonCodes.push("TEL_SESSION_188_ABANDONMENT_SETTLED");
        break;
      case "provider_error":
        nextState = terminalStates.has(session.callState) ? session.callState : "provider_error";
        reasonCodes.push("TEL_SESSION_188_PROVIDER_ERROR_RECORDED");
        break;
      case "operator_override_requested":
      case "manual_followup_requested":
        if (session.callState === "recording_expected") nextState = "recording_missing";
        else nextState = "manual_followup_required";
        break;
      case "transcript_readiness_recorded":
        nextState =
          event.payload.transcriptReadinessRef || session.callState === "recording_available"
            ? "evidence_preparing"
            : session.callState;
        break;
      case "evidence_readiness_assessed":
        if (event.payload.evidenceReadinessAssessmentRef) {
          if ((event.payload.reasonCodes ?? []).includes("safety_usable")) nextState = "evidence_ready";
          else if ((event.payload.reasonCodes ?? []).includes("urgent_live_only"))
            nextState = "urgent_live_only";
          else nextState = "evidence_pending";
        } else {
          nextState = "evidence_pending";
        }
        break;
      case "continuation_eligibility_settled":
        nextState = "continuation_eligible";
        break;
      case "continuation_sent":
        nextState = "continuation_sent";
        break;
      case "request_seeded":
        if (session.callState === "evidence_ready" && promotionRefsPresent(session, event)) {
          nextState = "request_seeded";
        } else {
          nextState = session.callState;
          activeBlockerOverride = "readiness_required_before_promotion";
          reasonCodes.push("TEL_SESSION_188_PROMOTION_SHORTCUT_BLOCKED");
        }
        break;
      case "submission_promoted":
        if (session.callState === "request_seeded" && promotionRefsPresent(session, event)) {
          nextState = "submitted";
        } else {
          nextState = session.callState;
          activeBlockerOverride = "readiness_required_before_promotion";
          reasonCodes.push("TEL_SESSION_188_PROMOTION_SHORTCUT_BLOCKED");
        }
        break;
      case "call_closed":
        nextState = "closed";
        break;
    }
  }

  const transitioned = transition(session, nextState);
  const currentMenuCaptureRef = menuCapture?.menuCaptureRef ?? session.currentMenuCaptureRef;
  const currentMenuPath = menuCapture?.selectedTopLevelPath ?? session.currentMenuPath;
  const urgentRefs = urgentLiveAssessment
    ? unique([...session.urgentLiveAssessmentRefs, urgentLiveAssessment.telephonyUrgentLiveAssessmentId])
    : session.urgentLiveAssessmentRefs;
  const updated: CallSessionAggregate = {
    ...session,
    callState: transitioned.callState,
    stateSequence: transitioned.stateSequence,
    canonicalEventRefs: unique([...session.canonicalEventRefs, event.callSessionEventRef]),
    eventIdempotencyKeys: unique([...session.eventIdempotencyKeys, event.idempotencyKey]),
    menuCaptureRefs: menuCapture
      ? unique([...session.menuCaptureRefs, menuCapture.menuCaptureRef])
      : session.menuCaptureRefs,
    currentMenuCaptureRef,
    currentMenuPath,
    urgentLiveAssessmentRefs: urgentRefs,
    currentUrgentLiveAssessmentRef:
      urgentLiveAssessment?.telephonyUrgentLiveAssessmentId ?? session.currentUrgentLiveAssessmentRef,
    urgentLivePosture: urgentLiveAssessment?.assessmentOutcome ?? session.urgentLivePosture,
    safetyPreemptionRef: safetyPreemption?.safetyPreemptionRef ?? session.safetyPreemptionRef,
    recordingRefs,
    verificationRef: event.payload.verificationRef ?? session.verificationRef,
    transcriptReadinessRef: event.payload.transcriptReadinessRef ?? session.transcriptReadinessRef,
    evidenceReadinessAssessmentRef:
      event.payload.evidenceReadinessAssessmentRef ?? session.evidenceReadinessAssessmentRef,
    continuationEligibilityRef:
      event.payload.continuationEligibilityRef ?? session.continuationEligibilityRef,
    manualReviewDispositionRef:
      event.payload.manualReviewDispositionRef ?? session.manualReviewDispositionRef,
    requestSeedRef: event.payload.requestSeedRef ?? session.requestSeedRef,
    latestSubmissionIngressRef:
      event.payload.latestSubmissionIngressRef ?? session.latestSubmissionIngressRef,
    lineageRef: event.payload.lineageRef ?? session.lineageRef,
    maskedCallerRef: session.maskedCallerRef ?? event.payload.maskedCallerContextRef ?? null,
    maskedCallerFragment: session.maskedCallerFragment ?? event.payload.maskedCallerFragment ?? null,
    currentLastSeenEventRef: event.callSessionEventRef,
    nextExpectedMilestone: transitioned.nextExpectedMilestone,
    activeBlockerReason: activeBlockerOverride ?? transitioned.activeBlockerReason,
    stateRevision: session.stateRevision + 1,
    reasonCodes: unique([...session.reasonCodes, ...reasonCodes]),
    updatedAt: event.recordedAt,
  };
  const projection = deriveCallSessionSupportProjection(updated, event.recordedAt);
  return {
    session: updated,
    eventApplied: true,
    menuCapture,
    urgentLiveAssessment,
    safetyPreemption,
    projection,
    reasonCodes: unique(reasonCodes),
  };
}

export function deriveCallSessionSupportProjection(
  session: CallSessionAggregate,
  derivedAt: string = session.updatedAt,
): CallSessionSupportProjection {
  return {
    schemaVersion: TELEPHONY_CALL_SESSION_PROJECTION_SCHEMA_VERSION,
    projectionRef: stableRef("tel_call_session_projection_188", {
      callSessionRef: session.callSessionRef,
      revision: session.stateRevision,
    }),
    callSessionRef: session.callSessionRef,
    currentCallState: session.callState,
    currentMenuPath: session.currentMenuPath,
    currentUrgentLivePosture: session.urgentLivePosture,
    currentLastSeenEventRef: session.currentLastSeenEventRef,
    nextExpectedMilestone: session.nextExpectedMilestone,
    activeBlockerOrHoldReason: session.activeBlockerReason,
    linkedRecordingRefs: session.recordingRefs,
    verificationRef: session.verificationRef,
    transcriptReadinessRef: session.transcriptReadinessRef,
    evidenceReadinessAssessmentRef: session.evidenceReadinessAssessmentRef,
    continuationEligibilityRef: session.continuationEligibilityRef,
    maskedCallerFragment: session.maskedCallerFragment,
    disclosureBoundary: "support_safe_masked_projection",
    derivedFromEventRefs: session.canonicalEventRefs,
    derivedAt: iso(derivedAt, "derivedAt"),
    reasonCodes: ["TEL_SESSION_188_SUPPORT_SAFE_PROJECTION_DERIVED"],
    createdByAuthority: TELEPHONY_CALL_SESSION_SERVICE_NAME,
  };
}

export function rebuildCallSessionFromEvents(
  events: readonly CallSessionCanonicalEvent[],
): CallSessionApplyResult | null {
  let session: CallSessionAggregate | null = null;
  let lastResult: CallSessionApplyResult | null = null;
  for (const event of sortEvents(events)) {
    lastResult = applyEvent(session, event);
    session = lastResult.session;
  }
  if (!lastResult) return null;
  return {
    ...lastResult,
    reasonCodes: unique([...lastResult.reasonCodes, "TEL_SESSION_188_REBUILD_DETERMINISTIC"]),
  };
}

export function createInMemoryCallSessionRepository(): CallSessionRepository {
  const events = new Map<string, CallSessionCanonicalEvent>();
  const sessions = new Map<string, CallSessionAggregate>();
  const menuCaptures = new Map<string, MenuSelectionCapture>();
  const urgentLiveAssessments = new Map<string, TelephonyUrgentLiveAssessmentRecord>();
  const safetyPreemptions = new Map<string, TelephonySafetyPreemptionRecord>();
  const projections = new Map<string, CallSessionSupportProjection>();
  return {
    async saveEvent(event) {
      events.set(event.callSessionEventRef, event);
    },
    async listEvents(callSessionRef) {
      return sortEvents([...events.values()].filter((event) => event.callSessionRef === callSessionRef));
    },
    async findSession(callSessionRef) {
      return sessions.get(callSessionRef);
    },
    async saveSession(session) {
      sessions.set(session.callSessionRef, session);
    },
    async saveMenuCapture(capture) {
      menuCaptures.set(capture.menuCaptureRef, capture);
    },
    async findMenuCapture(menuCaptureRef) {
      return menuCaptures.get(menuCaptureRef);
    },
    async saveUrgentLiveAssessment(assessment) {
      urgentLiveAssessments.set(assessment.telephonyUrgentLiveAssessmentId, assessment);
    },
    async saveSafetyPreemption(preemption) {
      safetyPreemptions.set(preemption.safetyPreemptionRef, preemption);
    },
    async saveProjection(projection) {
      projections.set(projection.callSessionRef, projection);
    },
    async getProjection(callSessionRef) {
      return projections.get(callSessionRef);
    },
    snapshots() {
      return {
        events: [...events.values()],
        sessions: [...sessions.values()],
        menuCaptures: [...menuCaptures.values()],
        urgentLiveAssessments: [...urgentLiveAssessments.values()],
        safetyPreemptions: [...safetyPreemptions.values()],
        projections: [...projections.values()],
      };
    },
  };
}

export function createCallSessionStateMachineService(options: {
  readonly repository: CallSessionRepository;
  readonly timeoutPolicy?: CallSessionTimeoutPolicy;
}): CallSessionStateMachineService {
  const timeoutPolicy = options.timeoutPolicy ?? defaultCallSessionTimeoutPolicy;
  async function persistApplyResult(
    event: CallSessionCanonicalEvent,
    result: CallSessionApplyResult,
  ): Promise<CallSessionApplyResult> {
    await options.repository.saveEvent(event);
    if (result.menuCapture) await options.repository.saveMenuCapture(result.menuCapture);
    if (result.urgentLiveAssessment) {
      await options.repository.saveUrgentLiveAssessment(result.urgentLiveAssessment);
    }
    if (result.safetyPreemption) {
      await options.repository.saveSafetyPreemption(result.safetyPreemption);
    }
    await options.repository.saveSession(result.session);
    await options.repository.saveProjection(result.projection);
    return result;
  }
  async function appendCallSessionEvent(
    event: CallSessionCanonicalEvent,
  ): Promise<CallSessionApplyResult> {
    const existing = await options.repository.findSession(event.callSessionRef);
    const result = applyEvent(existing ?? null, event);
    return persistApplyResult(event, result);
  }
  return {
    appendCallSessionEvent,
    async appendNormalizedTelephonyEvent(event) {
      return appendCallSessionEvent(callSessionEventFromNormalizedTelephonyEvent(event));
    },
    async rebuildCallSession(callSessionRef) {
      const result = rebuildCallSessionFromEvents(await options.repository.listEvents(callSessionRef));
      if (!result) return null;
      await options.repository.saveSession(result.session);
      await options.repository.saveProjection(result.projection);
      return result;
    },
    async getSupportProjection(callSessionRef) {
      return options.repository.getProjection(callSessionRef);
    },
    async evaluateTimeout(input) {
      const session = await options.repository.findSession(input.callSessionRef);
      if (!session) return null;
      const evaluatedAt = iso(input.evaluatedAt, "evaluatedAt");
      const elapsedSeconds = (Date.parse(evaluatedAt) - Date.parse(session.updatedAt)) / 1000;
      let eventType: CallSessionEventType | null = null;
      let payload: CallSessionEventPayload = {};
      if (
        session.callState === "menu_selected" &&
        elapsedSeconds >= timeoutPolicy.menuSelectedTimeoutSeconds
      ) {
        eventType = "call_abandoned";
      } else if (
        session.callState === "identity_in_progress" &&
        elapsedSeconds >= timeoutPolicy.identityInProgressTimeoutSeconds
      ) {
        eventType = "manual_followup_requested";
      } else if (
        session.callState === "recording_expected" &&
        elapsedSeconds >= timeoutPolicy.recordingExpectedTimeoutSeconds
      ) {
        eventType = "manual_followup_requested";
        payload = {
          manualReviewDispositionRef: stableRef("tel_manual_review_disposition_188", {
            callSessionRef: session.callSessionRef,
            timeoutState: session.callState,
          }),
        };
      }
      if (!eventType) return null;
      const timeoutEvent = createCallSessionCanonicalEvent({
        eventType,
        sourceCanonicalEventType: "manual_timeout",
        callSessionRef: session.callSessionRef,
        providerCorrelationRef: session.providerCorrelationRef,
        occurredAt: evaluatedAt,
        recordedAt: evaluatedAt,
        payload,
        reasonCodes: ["TEL_SESSION_188_TIMEOUT_POLICY_APPLIED"],
      });
      return appendCallSessionEvent(timeoutEvent);
    },
  };
}

export function createCallSessionStateMachineApplication(options?: {
  readonly repository?: CallSessionRepository;
  readonly timeoutPolicy?: CallSessionTimeoutPolicy;
}): CallSessionStateMachineApplication {
  const repository = options?.repository ?? createInMemoryCallSessionRepository();
  const timeoutPolicy = options?.timeoutPolicy ?? defaultCallSessionTimeoutPolicy;
  return {
    migrationPlanRefs: callSessionStateMachineMigrationPlanRefs,
    persistenceTables: callSessionStateMachinePersistenceTables,
    gapResolutions: callSessionStateMachineGapResolutions,
    timeoutPolicy,
    service: createCallSessionStateMachineService({ repository, timeoutPolicy }),
    repository,
  };
}
