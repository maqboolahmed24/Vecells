import type { RuntimeScenario } from "@vecells/persistent-shell";
import {
  resolvePhase3PatientWorkspaceConversationBundleByTaskId,
  type Phase3PatientWorkspaceDeliveryPosture,
  type Phase3PatientWorkspaceRepairPosture,
} from "@vecells/domain-kernel";
import {
  requireCase,
  staffCases,
  workspaceFixtureSafePatientLabel,
  type StaffQueueCase,
} from "./workspace-shell.data";

export type CallbackWorkbenchStage = "detail" | "outcome" | "repair";
export type CallbackSurfaceMutationState = "live" | "stale_recoverable" | "recovery_only" | "blocked";
export type CallbackCaseViewState =
  | "queued"
  | "scheduled"
  | "ready_for_attempt"
  | "awaiting_outcome_evidence"
  | "no_answer"
  | "voicemail_left"
  | "contact_route_repair_pending"
  | "awaiting_retry";
export type CallbackIntentLeaseState =
  | "queued"
  | "live_scheduled"
  | "live_ready"
  | "suspended_for_repair";
export type CallbackRouteHealthState = "current" | "drifted" | "repair_required";
export type CallbackResolutionGateState =
  | "awaiting_attempt"
  | "awaiting_evidence"
  | "retry_available"
  | "complete_available"
  | "cancel_available"
  | "repair_required";
export type CallbackAttemptState =
  | "not_started"
  | "initiated"
  | "provider_acked"
  | "outcome_pending"
  | "settled"
  | "reconcile_required";
export type CallbackOutcome = "answered" | "no_answer" | "voicemail_left" | "route_invalid" | "provider_failure";
export type CallbackEvidenceState = "missing" | "partial" | "durable";
export type CallbackPatientVisibleState =
  | "queued"
  | "scheduled"
  | "attempting_now"
  | "retry_planned"
  | "route_repair_required";

interface CallbackAttemptSeed {
  attemptId: string;
  anchorRef: string;
  occurredAtLabel: string;
  targetRouteLabel: string;
  providerCorrelationRef: string;
  dialFenceRef: string;
  attemptState: Exclude<CallbackAttemptState, "not_started">;
  outcome: CallbackOutcome | null;
  evidenceState: CallbackEvidenceState;
  outcomeEvidenceBundleRef: string | null;
  note: string;
  selectedByDefault?: boolean;
}

interface CallbackCaseSeed {
  taskId: string;
  callbackCaseId: string;
  requestLabel: string;
  patientLabel: string;
  state: CallbackCaseViewState;
  intentLeaseState: CallbackIntentLeaseState;
  currentAttemptState: CallbackAttemptState;
  routeHealth: CallbackRouteHealthState;
  resolutionGateState: CallbackResolutionGateState;
  ownerLabel: string;
  urgencyLabel: string;
  promiseWindowLabel: string;
  preferredRouteLabel: string;
  expectationEnvelopeRef: string;
  intentLeaseRef: string;
  resolutionGateRef: string;
  patientVisibleState: CallbackPatientVisibleState;
  patientWordingPreview: string;
  fallbackGuidance: string;
  stalePromiseWarning: string | null;
  worklistSummary: string;
  dueLabel: string;
  nextAllowedActionLabel: string;
  routeRepairSummary: string | null;
  verificationCheckpointRef: string | null;
  reachabilityAssessmentRef: string | null;
  attempts: readonly CallbackAttemptSeed[];
}

export interface CallbackWorklistRowProjection {
  rowId: string;
  taskId: string;
  callbackCaseId: string;
  anchorRef: string;
  patientLabel: string;
  requestLabel: string;
  promiseWindowLabel: string;
  urgencyLabel: string;
  currentOwnerLabel: string;
  routeHealthLabel: string;
  callbackState: CallbackCaseViewState;
  intentLeaseState: CallbackIntentLeaseState;
  attemptState: CallbackAttemptState;
  resolutionGateState: CallbackResolutionGateState;
  nextAllowedActionLabel: string;
  summary: string;
  dueLabel: string;
  selected: boolean;
}

export interface CallbackExpectationCardProjection {
  cardId: string;
  expectationEnvelopeRef: string;
  patientVisibleState: CallbackPatientVisibleState;
  promiseWindowLabel: string;
  preferredRouteLabel: string;
  patientWordingPreview: string;
  fallbackGuidance: string;
  stalePromiseWarning: string | null;
}

export interface CallbackAttemptTimelineEntryProjection {
  entryId: string;
  anchorRef: string;
  occurredAtLabel: string;
  targetRouteLabel: string;
  providerCorrelationRef: string;
  dialFenceRef: string;
  attemptState: Exclude<CallbackAttemptState, "not_started">;
  outcome: CallbackOutcome | null;
  evidenceState: CallbackEvidenceState;
  outcomeEvidenceBundleRef: string | null;
  note: string;
  selected: boolean;
}

export interface CallbackAttemptTimelineProjection {
  timelineId: string;
  selectedAttemptRef: string | null;
  activeAttemptState: CallbackAttemptState;
  entries: readonly CallbackAttemptTimelineEntryProjection[];
  emptyStateLabel: string;
}

export interface CallbackOutcomeOptionProjection {
  outcome: CallbackOutcome;
  label: string;
  summary: string;
  requiredEvidence: readonly string[];
  legalNextActions: readonly string[];
}

export interface CallbackOutcomeCaptureProjection {
  captureId: string;
  stageState: "ready" | "repair_required" | "stale_recoverable" | "blocked";
  resolutionGateRef: string;
  resolutionGateState: CallbackResolutionGateState;
  selectedAttemptRef: string | null;
  duplicateAttemptGuardLabel: string;
  freezeReason: string | null;
  outcomeOptions: readonly CallbackOutcomeOptionProjection[];
}

export interface CallbackRouteRepairPromptProjection {
  promptId: string;
  visible: boolean;
  routeHealth: CallbackRouteHealthState;
  headline: string;
  summary: string;
  verificationCheckpointRef: string | null;
  reachabilityAssessmentRef: string | null;
  actionLabel: string;
}

export interface CallbackControlProjection {
  controlId: string;
  actionKey: "schedule" | "reschedule" | "cancel" | "initiate_attempt" | "open_task";
  label: string;
  enabled: boolean;
  detail: string;
}

export interface CallbackDetailSurfaceProjection {
  surfaceId: string;
  taskId: string;
  requestRef: string;
  requestLineageRef: string;
  callbackCaseId: string;
  patientConversationRouteRef: string;
  phase3ConversationBundleRef: string;
  deliveryPosture: Phase3PatientWorkspaceDeliveryPosture;
  repairPosture: Phase3PatientWorkspaceRepairPosture;
  dominantNextActionRef: string;
  mutationState: CallbackSurfaceMutationState;
  selectedStage: CallbackWorkbenchStage;
  callbackState: CallbackCaseViewState;
  intentLeaseState: CallbackIntentLeaseState;
  currentAttemptState: CallbackAttemptState;
  routeHealth: CallbackRouteHealthState;
  resolutionGateState: CallbackResolutionGateState;
  headline: string;
  summary: string;
  ownerLabel: string;
  urgencyLabel: string;
  promiseWindowLabel: string;
  preferredRouteLabel: string;
  decisionEpochRef: string;
  expectationCard: CallbackExpectationCardProjection;
  attemptTimeline: CallbackAttemptTimelineProjection;
  outcomeCapture: CallbackOutcomeCaptureProjection;
  routeRepairPrompt: CallbackRouteRepairPromptProjection;
  controls: readonly CallbackControlProjection[];
  sourceSummaryPoints: readonly string[];
}

export interface CallbackWorkbenchProjection {
  routeId: string;
  visualMode: "Callback_Operations_Deck";
  queueHealthSummary: string;
  dueNowSummary: string;
  rowCount: number;
  selectedTaskId: string;
  selectedStage: CallbackWorkbenchStage;
  mutationState: CallbackSurfaceMutationState;
  rows: readonly CallbackWorklistRowProjection[];
  detailSurface: CallbackDetailSurfaceProjection;
}

const callbackOutcomeOptions: readonly CallbackOutcomeOptionProjection[] = [
  {
    outcome: "answered",
    label: "Answered",
    summary: "Record who answered, which route was used, and whether any safety preemption is still pending.",
    requiredEvidence: [
      "Route evidence confirmed",
      "Provider disposition recorded",
      "Patient acknowledgement captured",
      "Safety classification confirmed",
    ],
    legalNextActions: ["Complete callback", "Escalate", "Return to governed review"],
  },
  {
    outcome: "no_answer",
    label: "No answer",
    summary: "Prove the dial target and provider disposition before offering retry or escalation.",
    requiredEvidence: ["Route evidence confirmed", "Provider disposition recorded"],
    legalNextActions: ["Schedule retry", "Escalate"],
  },
  {
    outcome: "voicemail_left",
    label: "Voicemail left",
    summary: "Voicemail is not calm completion. Keep evidence durable and require a gate decision for the next step.",
    requiredEvidence: [
      "Route evidence confirmed",
      "Provider disposition recorded",
      "Voicemail policy checked",
    ],
    legalNextActions: ["Schedule retry", "Escalate", "Cancel callback"],
  },
  {
    outcome: "route_invalid",
    label: "Invalid route",
    summary: "Promote route repair immediately and revoke stale promise language.",
    requiredEvidence: ["Route evidence confirmed", "Reachability drift noted"],
    legalNextActions: ["Open route repair"],
  },
  {
    outcome: "provider_failure",
    label: "Provider failure",
    summary: "Separate provider failure from patient outcome and hold the gate until the evidence bundle is durable.",
    requiredEvidence: ["Provider disposition recorded", "Correlation ref preserved"],
    legalNextActions: ["Retry later", "Escalate"],
  },
] as const;

const callbackCaseSeeds: readonly CallbackCaseSeed[] = [
  {
    taskId: "task-412",
    callbackCaseId: "callback_case_412_route_repair",
    requestLabel: "Same-day inhaler safety callback",
    patientLabel: "Elena Morris",
    state: "contact_route_repair_pending",
    intentLeaseState: "suspended_for_repair",
    currentAttemptState: "settled",
    routeHealth: "repair_required",
    resolutionGateState: "repair_required",
    ownerLabel: "Urgent callback lane",
    urgencyLabel: "Repair dominant",
    promiseWindowLabel: "Promise revoked until route verification rebounds",
    preferredRouteLabel: "Disputed mobile ending 6631",
    expectationEnvelopeRef: "callback_expectation_envelope::task-412::revoked",
    intentLeaseRef: "callback_intent_lease::task-412::repair",
    resolutionGateRef: "callback_resolution_gate::task-412",
    patientVisibleState: "route_repair_required",
    patientWordingPreview:
      "We are rechecking the safest contact route before setting a new callback time.",
    fallbackGuidance: "Repair the contact route, then publish a fresh expectation envelope before promising another window.",
    stalePromiseWarning:
      "Same-day callback wording is withdrawn because the current route is disputed and the last attempt proved invalid.",
    worklistSummary:
      "Two attempts failed against a disputed mobile number. Repair is the only safe dominant action.",
    dueLabel: "Repair due now",
    nextAllowedActionLabel: "Repair route",
    routeRepairSummary:
      "The contact route is degraded. Suppress stale callback promise wording and move the operator into repair in place.",
    verificationCheckpointRef: "contact_route_verification_checkpoint::task-412",
    reachabilityAssessmentRef: "reachability_assessment_record::task-412",
    attempts: [
      {
        attemptId: "callback_attempt_412_1",
        anchorRef: "callback-attempt-task-412-1",
        occurredAtLabel: "09:18",
        targetRouteLabel: "Mobile ending 6631",
        providerCorrelationRef: "prov-call-412-a1",
        dialFenceRef: "attempt_fence::task-412::1",
        attemptState: "settled",
        outcome: "no_answer",
        evidenceState: "durable",
        outcomeEvidenceBundleRef: "callback_outcome_evidence_bundle::task-412::1",
        note: "No answer captured durably; retry remained legal until route drift was confirmed.",
      },
      {
        attemptId: "callback_attempt_412_2",
        anchorRef: "callback-attempt-task-412-2",
        occurredAtLabel: "10:02",
        targetRouteLabel: "Mobile ending 6631",
        providerCorrelationRef: "prov-call-412-a2",
        dialFenceRef: "attempt_fence::task-412::2",
        attemptState: "settled",
        outcome: "route_invalid",
        evidenceState: "durable",
        outcomeEvidenceBundleRef: "callback_outcome_evidence_bundle::task-412::2",
        note: "The second attempt proved the route invalid. Promise wording is now revoked until repair rebounds.",
        selectedByDefault: true,
      },
    ],
  },
  {
    taskId: "task-311",
    callbackCaseId: "callback_case_311_ready",
    requestLabel: "Returned-evidence follow-up callback",
    patientLabel: "Asha Patel",
    state: "scheduled",
    intentLeaseState: "live_ready",
    currentAttemptState: "not_started",
    routeHealth: "current",
    resolutionGateState: "awaiting_attempt",
    ownerLabel: "Clinical callback queue",
    urgencyLabel: "Window opens in 14 minutes",
    promiseWindowLabel: "Today 15:10 to 15:40",
    preferredRouteLabel: "Mobile ending 4421",
    expectationEnvelopeRef: "callback_expectation_envelope::task-311::current",
    intentLeaseRef: "callback_intent_lease::task-311::ready",
    resolutionGateRef: "callback_resolution_gate::task-311",
    patientVisibleState: "scheduled",
    patientWordingPreview:
      "We expect to call you this afternoon between 15:10 and 15:40 using your mobile number on file.",
    fallbackGuidance: "If the window changes materially, publish a new envelope revision instead of stretching the local timer.",
    stalePromiseWarning: null,
    worklistSummary:
      "The expectation envelope is current and the intent lease is live. One governed attempt may be started when the operator is ready.",
    dueLabel: "Window opens 15:10",
    nextAllowedActionLabel: "Initiate attempt",
    routeRepairSummary: null,
    verificationCheckpointRef: null,
    reachabilityAssessmentRef: null,
    attempts: [],
  },
  {
    taskId: "task-118",
    callbackCaseId: "callback_case_118_retry",
    requestLabel: "Ownership clarification callback",
    patientLabel: "Maya Foster",
    state: "awaiting_retry",
    intentLeaseState: "queued",
    currentAttemptState: "settled",
    routeHealth: "current",
    resolutionGateState: "retry_available",
    ownerLabel: "Quiet callback review",
    urgencyLabel: "Retry allowed",
    promiseWindowLabel: "Retry not yet promised",
    preferredRouteLabel: "Mobile ending 2198",
    expectationEnvelopeRef: "callback_expectation_envelope::task-118::retry_pending",
    intentLeaseRef: "callback_intent_lease::task-118::queued",
    resolutionGateRef: "callback_resolution_gate::task-118",
    patientVisibleState: "retry_planned",
    patientWordingPreview:
      "We tried to call and will try again if needed after the current review confirms the next safe window.",
    fallbackGuidance: "Retry only after the current queue owner republishes the promise window through the expectation envelope.",
    stalePromiseWarning: null,
    worklistSummary:
      "A no-answer attempt already has durable evidence. The gate now allows retry or escalation, but not calm closure.",
    dueLabel: "Retry queue",
    nextAllowedActionLabel: "Schedule retry",
    routeRepairSummary: null,
    verificationCheckpointRef: null,
    reachabilityAssessmentRef: null,
    attempts: [
      {
        attemptId: "callback_attempt_118_1",
        anchorRef: "callback-attempt-task-118-1",
        occurredAtLabel: "11:41",
        targetRouteLabel: "Mobile ending 2198",
        providerCorrelationRef: "prov-call-118-a1",
        dialFenceRef: "attempt_fence::task-118::1",
        attemptState: "settled",
        outcome: "no_answer",
        evidenceState: "durable",
        outcomeEvidenceBundleRef: "callback_outcome_evidence_bundle::task-118::1",
        note: "The attempt settled with durable evidence, so retry is legal without implying the callback is complete.",
        selectedByDefault: true,
      },
    ],
  },
  {
    taskId: "task-208",
    callbackCaseId: "callback_case_208_voicemail",
    requestLabel: "Booking-intent consent callback",
    patientLabel: "Noah Bennett",
    state: "voicemail_left",
    intentLeaseState: "queued",
    currentAttemptState: "settled",
    routeHealth: "drifted",
    resolutionGateState: "awaiting_evidence",
    ownerLabel: "Approval callback review",
    urgencyLabel: "Evidence still incomplete",
    promiseWindowLabel: "Previous window withdrawn after voicemail",
    preferredRouteLabel: "Mobile ending 0317",
    expectationEnvelopeRef: "callback_expectation_envelope::task-208::voicemail_hold",
    intentLeaseRef: "callback_intent_lease::task-208::queued",
    resolutionGateRef: "callback_resolution_gate::task-208",
    patientVisibleState: "retry_planned",
    patientWordingPreview:
      "We tried to call and left a message. We will confirm the next step after reviewing the callback evidence.",
    fallbackGuidance: "Do not let voicemail stand in for completion. Capture the evidence bundle, then choose retry, escalate, or cancel explicitly.",
    stalePromiseWarning:
      "Voicemail was left, but the callback is not done. Completion remains fenced until the outcome bundle is durable and the gate decides the next step.",
    worklistSummary:
      "Voicemail settled locally, but the provider and route evidence bundle is still partial. No calm closure is legal yet.",
    dueLabel: "Evidence pending",
    nextAllowedActionLabel: "Finish outcome evidence",
    routeRepairSummary: null,
    verificationCheckpointRef: null,
    reachabilityAssessmentRef: null,
    attempts: [
      {
        attemptId: "callback_attempt_208_1",
        anchorRef: "callback-attempt-task-208-1",
        occurredAtLabel: "13:06",
        targetRouteLabel: "Mobile ending 0317",
        providerCorrelationRef: "prov-call-208-a1",
        dialFenceRef: "attempt_fence::task-208::1",
        attemptState: "settled",
        outcome: "voicemail_left",
        evidenceState: "partial",
        outcomeEvidenceBundleRef: null,
        note: "The voicemail disposition is known, but the durable outcome evidence bundle is still incomplete.",
        selectedByDefault: true,
      },
    ],
  },
] as const;

function mutationStateForScenario(runtimeScenario: RuntimeScenario): CallbackSurfaceMutationState {
  switch (runtimeScenario) {
    case "live":
      return "live";
    case "stale_review":
      return "stale_recoverable";
    case "recovery_only":
    case "read_only":
      return "recovery_only";
    case "blocked":
      return "blocked";
  }
}

function freezeReasonForScenario(runtimeScenario: RuntimeScenario): string | null {
  switch (runtimeScenario) {
    case "stale_review":
      return "A fresher callback tuple is required before any new attempt or terminal outcome can be recorded.";
    case "read_only":
    case "recovery_only":
      return "The callback shell preserves the last safe attempt and promise context, but mutation remains frozen under recovery posture.";
    case "blocked":
      return "Release truth is blocked. The callback workbench stays visible without writable attempt or resolution controls.";
    case "live":
    default:
      return null;
  }
}

function routeHealthLabel(routeHealth: CallbackRouteHealthState): string {
  switch (routeHealth) {
    case "repair_required":
      return "Repair required";
    case "drifted":
      return "Drifted";
    case "current":
    default:
      return "Current";
  }
}

function detailHeadline(seed: CallbackCaseSeed): string {
  switch (seed.state) {
    case "contact_route_repair_pending":
      return "Repair the callback route before promising another window";
    case "awaiting_retry":
      return "Retry is legal, but only because the prior attempt evidence is already durable";
    case "voicemail_left":
      return "Voicemail is recorded, but the callback is not done";
    case "scheduled":
    case "ready_for_attempt":
    default:
      return "Current callback promise and attempt controls";
  }
}

function detailSummary(seed: CallbackCaseSeed): string {
  switch (seed.state) {
    case "contact_route_repair_pending":
      return "The current expectation envelope is revoked in place. Show repair as the dominant next action and keep the failed attempts visible.";
    case "awaiting_retry":
      return "The no-answer result is proven. The next step is a governed retry or escalation, not a soft local reminder.";
    case "voicemail_left":
      return "Hold completion until the evidence bundle is durable and the gate chooses the next legal action.";
    case "scheduled":
    case "ready_for_attempt":
    default:
      return "The expectation envelope, lease, and attempt controls are aligned. One governed attempt may be started without creating a duplicate live dial.";
  }
}

function buildControls(seed: CallbackCaseSeed, mutationState: CallbackSurfaceMutationState): readonly CallbackControlProjection[] {
  const writable = mutationState === "live";
  return [
    {
      controlId: `callback-control::${seed.callbackCaseId}::schedule`,
      actionKey: "schedule",
      label: "Schedule window",
      enabled: writable && seed.intentLeaseState === "queued",
      detail: "Only live queued intent may schedule a fresh promise window.",
    },
    {
      controlId: `callback-control::${seed.callbackCaseId}::reschedule`,
      actionKey: "reschedule",
      label: "Reschedule window",
      enabled: writable && (seed.intentLeaseState === "live_scheduled" || seed.intentLeaseState === "live_ready"),
      detail: "Reschedule only when the current lease is still authoritative.",
    },
    {
      controlId: `callback-control::${seed.callbackCaseId}::cancel`,
      actionKey: "cancel",
      label: "Cancel callback",
      enabled:
        writable &&
        seed.resolutionGateState !== "repair_required" &&
        seed.resolutionGateState !== "awaiting_evidence",
      detail: "Cancellation stays gated by the current resolution decision, not local schedule removal.",
    },
    {
      controlId: `callback-control::${seed.callbackCaseId}::initiate_attempt`,
      actionKey: "initiate_attempt",
      label: "Initiate governed attempt",
      enabled: writable && seed.intentLeaseState === "live_ready" && seed.routeHealth === "current",
      detail: "Duplicate taps must collapse to the same attempt fence and the same record.",
    },
    {
      controlId: `callback-control::${seed.callbackCaseId}::open_task`,
      actionKey: "open_task",
      label: "Open task shell",
      enabled: true,
      detail: "Jump back into the task shell without losing callback continuity.",
    },
  ] as const;
}

function buildExpectationCard(seed: CallbackCaseSeed): CallbackExpectationCardProjection {
  return {
    cardId: `callback_expectation_card::${seed.callbackCaseId}`,
    expectationEnvelopeRef: seed.expectationEnvelopeRef,
    patientVisibleState: seed.patientVisibleState,
    promiseWindowLabel: seed.promiseWindowLabel,
    preferredRouteLabel: seed.preferredRouteLabel,
    patientWordingPreview: seed.patientWordingPreview,
    fallbackGuidance: seed.fallbackGuidance,
    stalePromiseWarning: seed.stalePromiseWarning,
  };
}

function buildAttemptTimeline(
  seed: CallbackCaseSeed,
  selectedAnchorRef: string,
): CallbackAttemptTimelineProjection {
  return {
    timelineId: `callback_attempt_timeline::${seed.callbackCaseId}`,
    selectedAttemptRef: seed.attempts.find((attempt) => attempt.anchorRef === selectedAnchorRef)?.attemptId ?? null,
    activeAttemptState: seed.currentAttemptState,
    entries: seed.attempts.map((attempt) => ({
      entryId: attempt.attemptId,
      anchorRef: attempt.anchorRef,
      occurredAtLabel: attempt.occurredAtLabel,
      targetRouteLabel: attempt.targetRouteLabel,
      providerCorrelationRef: attempt.providerCorrelationRef,
      dialFenceRef: attempt.dialFenceRef,
      attemptState: attempt.attemptState,
      outcome: attempt.outcome,
      evidenceState: attempt.evidenceState,
      outcomeEvidenceBundleRef: attempt.outcomeEvidenceBundleRef,
      note: attempt.note,
      selected: selectedAnchorRef === attempt.anchorRef || (!selectedAnchorRef && Boolean(attempt.selectedByDefault)),
    })),
    emptyStateLabel:
      seed.attempts.length === 0
        ? "No governed attempts exist yet. Start one attempt fence when the current lease is ready."
        : "Each attempt stays evidence-bound and deduped by attempt fence.",
  };
}

function buildOutcomeCapture(
  seed: CallbackCaseSeed,
  mutationState: CallbackSurfaceMutationState,
  selectedAnchorRef: string,
): CallbackOutcomeCaptureProjection {
  return {
    captureId: `callback_outcome_capture::${seed.callbackCaseId}`,
    stageState:
      mutationState === "blocked"
        ? "blocked"
        : seed.routeHealth === "repair_required"
          ? "repair_required"
          : mutationState === "stale_recoverable"
            ? "stale_recoverable"
            : "ready",
    resolutionGateRef: seed.resolutionGateRef,
    resolutionGateState: seed.resolutionGateState,
    selectedAttemptRef:
      seed.attempts.find((attempt) => attempt.anchorRef === selectedAnchorRef)?.attemptId ??
      seed.attempts.find((attempt) => attempt.selectedByDefault)?.attemptId ??
      null,
    duplicateAttemptGuardLabel:
      "Repeated taps and stale tabs must reuse the current CallbackAttemptRecord instead of minting a second live attempt.",
    freezeReason: freezeReasonForScenario(mutationState === "live" ? "live" : mutationState === "blocked" ? "blocked" : mutationState === "recovery_only" ? "recovery_only" : "stale_review"),
    outcomeOptions: callbackOutcomeOptions,
  };
}

function buildRouteRepairPrompt(seed: CallbackCaseSeed): CallbackRouteRepairPromptProjection {
  return {
    promptId: `callback_route_repair_prompt::${seed.callbackCaseId}`,
    visible: seed.routeHealth === "repair_required" || seed.routeHealth === "drifted",
    routeHealth: seed.routeHealth,
    headline:
      seed.routeHealth === "repair_required"
        ? "CallbackRouteRepairPrompt"
        : "Route verification is drifting",
    summary:
      seed.routeRepairSummary ??
      "The callback route is still current, but the shell should stay ready to promote repair if the next attempt proves drift.",
    verificationCheckpointRef: seed.verificationCheckpointRef,
    reachabilityAssessmentRef: seed.reachabilityAssessmentRef,
    actionLabel:
      seed.routeHealth === "repair_required" ? "Open route repair" : "Review route verification",
  };
}

function buildWorklistRow(seed: CallbackCaseSeed, selectedTaskId: string): CallbackWorklistRowProjection {
  const patientLabel = workspaceFixtureSafePatientLabel(seed.taskId, seed.patientLabel);
  return {
    rowId: `callback_worklist_row::${seed.callbackCaseId}`,
    taskId: seed.taskId,
    callbackCaseId: seed.callbackCaseId,
    anchorRef: `callback-detail-${seed.taskId}`,
    patientLabel,
    requestLabel: seed.requestLabel,
    promiseWindowLabel: seed.promiseWindowLabel,
    urgencyLabel: seed.urgencyLabel,
    currentOwnerLabel: seed.ownerLabel,
    routeHealthLabel: routeHealthLabel(seed.routeHealth),
    callbackState: seed.state,
    intentLeaseState: seed.intentLeaseState,
    attemptState: seed.currentAttemptState,
    resolutionGateState: seed.resolutionGateState,
    nextAllowedActionLabel: seed.nextAllowedActionLabel,
    summary: seed.worklistSummary,
    dueLabel: seed.dueLabel,
    selected: seed.taskId === selectedTaskId,
  };
}

function requireCallbackSeed(taskId: string): CallbackCaseSeed {
  const seed = callbackCaseSeeds.find((candidate) => candidate.taskId === taskId);
  if (!seed) {
    throw new Error(`CALLBACK_CASE_SEED_MISSING: ${taskId}`);
  }
  return seed;
}

function sourceSummaryPoints(task: StaffQueueCase, seed: CallbackCaseSeed): readonly string[] {
  return [
    task.primaryReason,
    task.previewSummary,
    seed.worklistSummary,
    task.summaryPoints[0] ?? task.secondaryMeta,
  ];
}

export function listCallbackWorkbenchTaskIds(): readonly string[] {
  return callbackCaseSeeds.map((seed) => seed.taskId);
}

export function callbackWorkbenchRouteRows(): readonly StaffQueueCase[] {
  return listCallbackWorkbenchTaskIds().map((taskId) => requireCase(taskId));
}

export function defaultCallbackWorkbenchTaskId(): string {
  return callbackCaseSeeds[0]?.taskId ?? "task-412";
}

export function buildCallbackWorkbenchProjection(input: {
  runtimeScenario: RuntimeScenario;
  selectedTaskId: string;
  selectedAnchorRef: string;
  selectedStage: CallbackWorkbenchStage;
}): CallbackWorkbenchProjection {
  const mutationState = mutationStateForScenario(input.runtimeScenario);
  const selectedSeed = requireCallbackSeed(input.selectedTaskId);
  const task = requireCase(input.selectedTaskId);
  const patientLabel = workspaceFixtureSafePatientLabel(selectedSeed.taskId, selectedSeed.patientLabel);
  const patientConversationBundle = resolvePhase3PatientWorkspaceConversationBundleByTaskId({
    taskId: input.selectedTaskId === "task-412" ? "task-412" : "task-311",
    scenario:
      input.runtimeScenario === "live"
        ? "live"
        : input.runtimeScenario === "blocked"
          ? "blocked"
          : "stale",
    routeKey: "conversation_callback",
  });
  const dueNowCount = callbackCaseSeeds.filter(
    (seed) =>
      seed.state === "contact_route_repair_pending" ||
      seed.state === "scheduled" ||
      seed.resolutionGateState === "awaiting_evidence",
  ).length;
  const repairCount = callbackCaseSeeds.filter((seed) => seed.routeHealth === "repair_required").length;
  const detailSurface: CallbackDetailSurfaceProjection = {
    surfaceId: `callback_detail_surface::${selectedSeed.callbackCaseId}`,
    taskId: selectedSeed.taskId,
    requestRef: patientConversationBundle.requestRef,
    requestLineageRef: patientConversationBundle.requestLineageRef,
    callbackCaseId: selectedSeed.callbackCaseId,
    patientConversationRouteRef: patientConversationBundle.routeRefs.callback,
    phase3ConversationBundleRef: patientConversationBundle.bundleRef,
    deliveryPosture: patientConversationBundle.parity.deliveryPosture,
    repairPosture: patientConversationBundle.parity.repairPosture,
    dominantNextActionRef: patientConversationBundle.parity.dominantNextActionRef,
    mutationState,
    selectedStage: input.selectedStage,
    callbackState: selectedSeed.state,
    intentLeaseState: selectedSeed.intentLeaseState,
    currentAttemptState: selectedSeed.currentAttemptState,
    routeHealth: selectedSeed.routeHealth,
    resolutionGateState: selectedSeed.resolutionGateState,
    headline: detailHeadline(selectedSeed),
    summary: detailSummary(selectedSeed),
    ownerLabel: selectedSeed.ownerLabel,
    urgencyLabel: selectedSeed.urgencyLabel,
    promiseWindowLabel: selectedSeed.promiseWindowLabel,
    preferredRouteLabel: selectedSeed.preferredRouteLabel,
    decisionEpochRef: `decision_epoch::${selectedSeed.taskId}`,
    expectationCard: {
      ...buildExpectationCard(selectedSeed),
      patientWordingPreview: buildExpectationCard(selectedSeed).patientWordingPreview.replaceAll(
        selectedSeed.patientLabel,
        patientLabel,
      ),
    },
    attemptTimeline: buildAttemptTimeline(selectedSeed, input.selectedAnchorRef),
    outcomeCapture: buildOutcomeCapture(selectedSeed, mutationState, input.selectedAnchorRef),
    routeRepairPrompt: buildRouteRepairPrompt(selectedSeed),
    controls: buildControls(selectedSeed, mutationState),
    sourceSummaryPoints: sourceSummaryPoints(task, selectedSeed),
  };

  return {
    routeId: "callback_workbench_route",
    visualMode: "Callback_Operations_Deck",
    queueHealthSummary:
      `${callbackCaseSeeds.length} callback cases remain in one same-shell operations deck with expectation, attempt, and repair truth aligned.`,
    dueNowSummary:
      `${dueNowCount} cases need immediate evidence or route action. ${repairCount} case ${repairCount === 1 ? "is" : "are"} repair-dominant.`,
    rowCount: callbackCaseSeeds.length,
    selectedTaskId: input.selectedTaskId,
    selectedStage: input.selectedStage,
    mutationState,
    rows: callbackCaseSeeds.map((seed) => buildWorklistRow(seed, input.selectedTaskId)),
    detailSurface,
  };
}

export const callbackWorkbenchResearchBaseline = {
  route: "/workspace/callbacks",
  visualMode: "Callback_Operations_Deck",
  domMarkers: [
    "data-callback-state",
    "data-intent-lease-state",
    "data-attempt-state",
    "data-route-health",
    "data-resolution-gate",
  ],
} as const;

export function callbackWorkbenchTaskCases(): readonly StaffQueueCase[] {
  return staffCases.filter((task) => listCallbackWorkbenchTaskIds().includes(task.id));
}
