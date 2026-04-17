import {
  makePatientRequestReturnBundle215,
  type PatientRequestReturnBundle,
} from "./patient-home-requests-detail-routes.model";

export const PATIENT_MORE_INFO_CALLBACK_REPAIR_TASK_ID =
  "par_216_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_more_info_response_callback_status_and_contact_repair_views";
export const PATIENT_MORE_INFO_CALLBACK_REPAIR_VISUAL_MODE = "Precision_Reassurance_Workflow";

export type WorkflowRouteKey =
  | "more_info_step"
  | "more_info_check"
  | "more_info_confirmation"
  | "more_info_late_review"
  | "more_info_expired"
  | "more_info_read_only"
  | "callback_status"
  | "callback_at_risk"
  | "contact_repair"
  | "contact_repair_applied"
  | "consent_checkpoint";

export type WorkflowTone = "response" | "callback" | "warning" | "blocked" | "success" | "quiet";

export interface PromptStepProjection {
  readonly promptRef: string;
  readonly label: string;
  readonly question: string;
  readonly hint: string;
  readonly answerKind: "short_text" | "single_choice";
  readonly required: boolean;
  readonly options?: readonly string[];
}

export interface PatientMoreInfoStatusProjection {
  readonly projectionName: "PatientMoreInfoStatusProjection";
  readonly moreInfoStatusProjectionId: string;
  readonly cycleRef: string;
  readonly requestRef: string;
  readonly questionSummaryRef: string;
  readonly replyWindowCheckpointRef: string;
  readonly reminderScheduleRef: string;
  readonly latestResponseDispositionRef: string;
  readonly reachabilityDependencyRef: string;
  readonly reachabilityAssessmentRef: string;
  readonly contactRepairJourneyRef: string | null;
  readonly requestReturnBundleRef: string;
  readonly selectedAnchorRef: string;
  readonly dueAt: string;
  readonly lateReplyReviewUntilAt: string;
  readonly surfaceState:
    | "reply_needed"
    | "reply_submitted"
    | "awaiting_review"
    | "late_review"
    | "expired"
    | "superseded"
    | "repair_required"
    | "read_only";
  readonly dominantActionRef:
    | "continue_more_info"
    | "check_answers"
    | "send_more_info"
    | "return_to_request"
    | "contact_route_repair"
    | "renew_consent"
    | "recover_session";
  readonly placeholderContractRef: string | null;
  readonly experienceContinuityEvidenceRef: string;
  readonly renderedAt: string;
}

export interface PatientMoreInfoResponseThreadProjection {
  readonly projectionName: "PatientMoreInfoResponseThreadProjection";
  readonly responseThreadProjectionId: string;
  readonly cycleRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly threadTitle: string;
  readonly currentStepIndex: number;
  readonly totalSteps: number;
  readonly promptSteps: readonly PromptStepProjection[];
  readonly submittedAnswerSummary: readonly {
    readonly promptRef: string;
    readonly question: string;
    readonly answer: string;
  }[];
  readonly attachmentBlockState: "not_required" | "optional" | "read_only";
  readonly answerabilityState: "answerable" | "blocked_by_repair" | "read_only" | "expired";
  readonly requestReturnBundleRef: string;
  readonly focusTransitionRef: string;
}

export interface PatientCallbackStatusProjection {
  readonly projectionName: "PatientCallbackStatusProjection";
  readonly callbackStatusProjectionId: string;
  readonly callbackCaseRef: string;
  readonly requestRef: string;
  readonly callbackExpectationEnvelopeRef: string;
  readonly latestOutcomeEvidenceRef: string;
  readonly resolutionGateRef: string;
  readonly reachabilityDependencyRef: string;
  readonly reachabilitySummaryRef: string;
  readonly contactRepairProjectionRef: string | null;
  readonly contactRepairJourneyRef: string | null;
  readonly consentCheckpointRef: string | null;
  readonly selectedAnchorRef: string;
  readonly requestReturnBundleRef: string;
  readonly patientVisibleState:
    | "queued"
    | "scheduled"
    | "attempting_now"
    | "retry_planned"
    | "route_repair_required"
    | "escalated"
    | "closed";
  readonly windowRiskState: "on_track" | "at_risk" | "missed_window" | "repair_required";
  readonly surfaceState: "ready" | "pending_confirmation" | "repair_required" | "read_only";
  readonly dominantActionRef: "view_callback" | "contact_route_repair" | "return_to_request";
  readonly experienceContinuityEvidenceRef: string;
  readonly renderedAt: string;
}

export interface PatientReachabilitySummaryProjection {
  readonly projectionName: "PatientReachabilitySummaryProjection";
  readonly reachabilitySummaryProjectionId: string;
  readonly activeDependencyRefs: readonly string[];
  readonly dominantDependencyRef: string | null;
  readonly currentContactRouteSnapshotRef: string;
  readonly currentReachabilityAssessmentRef: string;
  readonly reachabilityEpoch: string;
  readonly contactRepairJourneyRef: string;
  readonly preferredContactRouteRef: string;
  readonly selectedAnchorRef: string;
  readonly resumeContinuationRef: string;
  readonly verificationState: "verified" | "needs_verification" | "pending";
  readonly routeAuthorityState:
    | "current"
    | "stale_verification"
    | "stale_demographics"
    | "stale_preferences"
    | "disputed";
  readonly deliveryRiskState: "clear" | "at_risk" | "likely_failed" | "disputed";
  readonly repairRequiredState: "none" | "required" | "recovering";
  readonly dominantRepairActionRef: "repair_contact_route" | null;
  readonly summaryState: "clear" | "at_risk" | "blocked" | "recovering" | "rebound_pending";
  readonly computedAt: string;
}

export interface PatientContactRepairProjection {
  readonly projectionName: "PatientContactRepairProjection";
  readonly contactRepairProjectionId: string;
  readonly repairCaseRef: string;
  readonly reachabilityDependencyRef: string;
  readonly contactRepairJourneyRef: string;
  readonly blockedAssessmentRef: string;
  readonly governingObjectRef: string;
  readonly blockedActionRefs: readonly string[];
  readonly dominantBlockedActionRef: string;
  readonly selectedAnchorRef: string;
  readonly currentRouteRef: string;
  readonly currentContactRouteSnapshotRef: string;
  readonly allowedRepairPathRefs: readonly string[];
  readonly stepUpRequirementRef: string | null;
  readonly verificationCheckpointRef: string | null;
  readonly resultingReachabilityAssessmentRef: string | null;
  readonly resumeContinuationRef: string;
  readonly requestReturnBundleRef: string;
  readonly patientRecoveryLoopRef: string;
  readonly repairState:
    | "ready"
    | "submitting"
    | "awaiting_verification"
    | "rebound_pending"
    | "applied"
    | "recovery_required";
  readonly renderedAt: string;
}

export interface PatientConsentCheckpointProjection {
  readonly projectionName: "PatientConsentCheckpointProjection";
  readonly consentCheckpointProjectionId: string;
  readonly governingObjectRef: string;
  readonly checkpointClass: "callback" | "pharmacy" | "other";
  readonly consentScope: string;
  readonly blockedActionRefs: readonly string[];
  readonly renewalRouteRef: string;
  readonly resumeContinuationRef: string;
  readonly requestReturnBundleRef: string;
  readonly experienceContinuityEvidenceRef: string;
  readonly surfaceState:
    | "current"
    | "expiring"
    | "expired"
    | "renewal_pending"
    | "withdrawal_reconciliation"
    | "recovery_required";
  readonly renderedAt: string;
}

export interface WorkflowEntryProjection {
  readonly projectionName: "PatientMoreInfoCallbackContactRepairEntryProjection";
  readonly routeKey: WorkflowRouteKey;
  readonly visualMode: typeof PATIENT_MORE_INFO_CALLBACK_REPAIR_VISUAL_MODE;
  readonly pathname: string;
  readonly requestRef: string;
  readonly requestTitle: string;
  readonly maskedPatientRef: string;
  readonly returnBundle: PatientRequestReturnBundle;
  readonly moreInfoStatus: PatientMoreInfoStatusProjection;
  readonly moreInfoThread: PatientMoreInfoResponseThreadProjection;
  readonly callbackStatus: PatientCallbackStatusProjection;
  readonly reachabilitySummary: PatientReachabilitySummaryProjection;
  readonly contactRepair: PatientContactRepairProjection;
  readonly consentCheckpoint: PatientConsentCheckpointProjection;
  readonly sourceProjectionRefs: readonly string[];
}

export const promptSteps216: readonly PromptStepProjection[] = [
  {
    promptRef: "prompt_216_photo_timing",
    label: "Photo timing",
    question: "When was the photo taken?",
    hint: "For example, Monday morning or 14 April at 8pm.",
    answerKind: "short_text",
    required: true,
  },
  {
    promptRef: "prompt_216_symptom_change",
    label: "Change since request",
    question: "Has the rash changed since you sent the request?",
    hint: "Choose the closest option. You can add detail before sending.",
    answerKind: "single_choice",
    required: true,
    options: ["No clear change", "It looks worse", "It is improving"],
  },
];

function stateForRoute(
  routeKey: WorkflowRouteKey,
): PatientMoreInfoStatusProjection["surfaceState"] {
  if (routeKey === "more_info_confirmation") return "reply_submitted";
  if (routeKey === "more_info_late_review") return "late_review";
  if (routeKey === "more_info_expired") return "expired";
  if (routeKey === "more_info_read_only") return "read_only";
  if (routeKey === "contact_repair" || routeKey === "callback_at_risk") return "repair_required";
  return "reply_needed";
}

function dominantActionForRoute(
  routeKey: WorkflowRouteKey,
): PatientMoreInfoStatusProjection["dominantActionRef"] {
  if (routeKey === "more_info_check") return "send_more_info";
  if (routeKey === "more_info_confirmation" || routeKey === "more_info_read_only")
    return "return_to_request";
  if (routeKey === "more_info_expired") return "recover_session";
  if (routeKey === "consent_checkpoint") return "renew_consent";
  if (routeKey === "contact_repair" || routeKey === "callback_at_risk") {
    return "contact_route_repair";
  }
  return "continue_more_info";
}

function callbackVisibleState(
  routeKey: WorkflowRouteKey,
): PatientCallbackStatusProjection["patientVisibleState"] {
  if (routeKey === "callback_at_risk") return "route_repair_required";
  if (routeKey === "more_info_confirmation") return "queued";
  return "scheduled";
}

function routeKeyFor(pathname: string): WorkflowRouteKey {
  if (/^\/contact-repair\/[^/]+\/applied$/.test(pathname)) return "contact_repair_applied";
  if (/^\/contact-repair\/[^/]+$/.test(pathname)) return "contact_repair";
  if (/\/callback\/at-risk$/.test(pathname)) return "callback_at_risk";
  if (/\/callback$/.test(pathname)) return "callback_status";
  if (/\/consent-checkpoint$/.test(pathname)) return "consent_checkpoint";
  if (/\/more-info\/confirmation$/.test(pathname)) return "more_info_confirmation";
  if (/\/more-info\/late-review$/.test(pathname)) return "more_info_late_review";
  if (/\/more-info\/expired$/.test(pathname)) return "more_info_expired";
  if (/\/more-info\/read-only$/.test(pathname)) return "more_info_read_only";
  if (/\/more-info\/check$/.test(pathname)) return "more_info_check";
  return "more_info_step";
}

function requestRefFor(pathname: string): string {
  const requestMatch = pathname.match(/^\/requests\/([^/]+)/);
  if (requestMatch?.[1]) return requestMatch[1];
  return "request_211_a";
}

export function isMoreInfoCallbackContactRepairPath(pathname: string): boolean {
  return (
    /^\/requests\/[^/]+\/more-info(?:\/(?:step-2|check|confirmation|late-review|expired|read-only))?$/.test(
      pathname,
    ) ||
    /^\/requests\/[^/]+\/callback(?:\/at-risk)?$/.test(pathname) ||
    /^\/requests\/[^/]+\/consent-checkpoint$/.test(pathname) ||
    /^\/contact-repair\/[^/]+(?:\/applied)?$/.test(pathname)
  );
}

export function resolveWorkflowEntry(pathname: string): WorkflowEntryProjection {
  const routeKey = routeKeyFor(pathname);
  const requestRef = requestRefFor(pathname);
  const returnBundle = {
    ...makePatientRequestReturnBundle215(requestRef, "needs_attention", "soft_navigation"),
    disclosurePosture: "child_route" as const,
  };
  const repairRequired = routeKey === "contact_repair" || routeKey === "callback_at_risk";
  const repairApplied = routeKey === "contact_repair_applied";
  const consentBlocked = routeKey === "consent_checkpoint";
  const surfaceState = stateForRoute(routeKey);
  const reachabilityState = repairRequired
    ? "blocked"
    : repairApplied
      ? "rebound_pending"
      : "clear";

  return {
    projectionName: "PatientMoreInfoCallbackContactRepairEntryProjection",
    routeKey,
    visualMode: PATIENT_MORE_INFO_CALLBACK_REPAIR_VISUAL_MODE,
    pathname,
    requestRef,
    requestTitle: "Dermatology request",
    maskedPatientRef: "NHS 943 *** 7812",
    returnBundle,
    moreInfoStatus: {
      projectionName: "PatientMoreInfoStatusProjection",
      moreInfoStatusProjectionId: `more_info_status_216_${routeKey}`,
      cycleRef: "cycle_216_dermatology_photo",
      requestRef,
      questionSummaryRef: "question_summary_216_photo_timing",
      replyWindowCheckpointRef:
        routeKey === "more_info_expired" ? "checkpoint_216_expired" : "checkpoint_216_open",
      reminderScheduleRef: "reminder_schedule_216_photo",
      latestResponseDispositionRef:
        routeKey === "more_info_confirmation"
          ? "response_disposition_216_awaiting_review"
          : "response_disposition_216_none",
      reachabilityDependencyRef: "reachability_dependency_216_sms",
      reachabilityAssessmentRef: repairRequired
        ? "reachability_assessment_216_likely_failed"
        : "reachability_assessment_216_clear",
      contactRepairJourneyRef: repairRequired ? "repair_journey_216_sms" : null,
      requestReturnBundleRef: returnBundle.requestReturnBundleRef,
      selectedAnchorRef: returnBundle.selectedAnchorRef,
      dueAt: "2026-04-17T18:00:00.000Z",
      lateReplyReviewUntilAt: "2026-04-18T12:00:00.000Z",
      surfaceState,
      dominantActionRef: dominantActionForRoute(routeKey),
      placeholderContractRef: surfaceState === "read_only" ? "public_safe_placeholder_216" : null,
      experienceContinuityEvidenceRef: returnBundle.continuityEvidenceRef,
      renderedAt: "2026-04-16T12:15:00.000Z",
    },
    moreInfoThread: {
      projectionName: "PatientMoreInfoResponseThreadProjection",
      responseThreadProjectionId: "more_info_thread_216_dermatology_photo",
      cycleRef: "cycle_216_dermatology_photo",
      requestRef,
      requestLineageRef: returnBundle.requestLineageRef,
      threadTitle: "Photo timing reply",
      currentStepIndex: routeKey === "more_info_check" ? 2 : pathname.includes("/step-2") ? 1 : 0,
      totalSteps: promptSteps216.length,
      promptSteps: promptSteps216,
      submittedAnswerSummary: [
        {
          promptRef: "prompt_216_photo_timing",
          question: "When was the photo taken?",
          answer: "Monday morning in daylight",
        },
        {
          promptRef: "prompt_216_symptom_change",
          question: "Has the rash changed since you sent the request?",
          answer: "No clear change",
        },
      ],
      attachmentBlockState: routeKey === "more_info_read_only" ? "read_only" : "optional",
      answerabilityState:
        routeKey === "more_info_expired"
          ? "expired"
          : routeKey === "more_info_read_only"
            ? "read_only"
            : repairRequired
              ? "blocked_by_repair"
              : "answerable",
      requestReturnBundleRef: returnBundle.requestReturnBundleRef,
      focusTransitionRef: "focus_more_info_active_step",
    },
    callbackStatus: {
      projectionName: "PatientCallbackStatusProjection",
      callbackStatusProjectionId: `callback_status_216_${routeKey}`,
      callbackCaseRef: "callback_216_dermatology",
      requestRef,
      callbackExpectationEnvelopeRef: "CallbackExpectationEnvelope::216_dermatology",
      latestOutcomeEvidenceRef: "CallbackOutcomeEvidenceBundle::216_pending",
      resolutionGateRef: "CallbackResolutionGate::216_open",
      reachabilityDependencyRef: "reachability_dependency_216_sms",
      reachabilitySummaryRef: "reachability_summary_216",
      contactRepairProjectionRef: repairRequired ? "contact_repair_projection_216_sms" : null,
      contactRepairJourneyRef: repairRequired ? "repair_journey_216_sms" : null,
      consentCheckpointRef: consentBlocked ? "consent_checkpoint_216_callback" : null,
      selectedAnchorRef: returnBundle.selectedAnchorRef,
      requestReturnBundleRef: returnBundle.requestReturnBundleRef,
      patientVisibleState: callbackVisibleState(routeKey),
      windowRiskState: repairRequired ? "repair_required" : "on_track",
      surfaceState: repairRequired ? "repair_required" : "ready",
      dominantActionRef: repairRequired ? "contact_route_repair" : "view_callback",
      experienceContinuityEvidenceRef: returnBundle.continuityEvidenceRef,
      renderedAt: "2026-04-16T12:15:00.000Z",
    },
    reachabilitySummary: {
      projectionName: "PatientReachabilitySummaryProjection",
      reachabilitySummaryProjectionId: "reachability_summary_216",
      activeDependencyRefs: repairRequired ? ["sms_route_delivery_failed"] : [],
      dominantDependencyRef: repairRequired ? "sms_route_delivery_failed" : null,
      currentContactRouteSnapshotRef: "contact_route_snapshot_216_sms",
      currentReachabilityAssessmentRef: repairRequired
        ? "reachability_assessment_216_likely_failed"
        : "reachability_assessment_216_clear",
      reachabilityEpoch: "reachability_epoch_216_v1",
      contactRepairJourneyRef: "repair_journey_216_sms",
      preferredContactRouteRef: "mobile_ending_4421",
      selectedAnchorRef: returnBundle.selectedAnchorRef,
      resumeContinuationRef: "resume_continuation_216_request_211_a",
      verificationState: repairApplied
        ? "pending"
        : repairRequired
          ? "needs_verification"
          : "verified",
      routeAuthorityState: repairRequired ? "stale_verification" : "current",
      deliveryRiskState: repairRequired ? "likely_failed" : "clear",
      repairRequiredState: repairRequired ? "required" : repairApplied ? "recovering" : "none",
      dominantRepairActionRef: repairRequired ? "repair_contact_route" : null,
      summaryState: reachabilityState,
      computedAt: "2026-04-16T12:15:00.000Z",
    },
    contactRepair: {
      projectionName: "PatientContactRepairProjection",
      contactRepairProjectionId: "contact_repair_projection_216_sms",
      repairCaseRef: "repair_216_sms",
      reachabilityDependencyRef: "reachability_dependency_216_sms",
      contactRepairJourneyRef: "repair_journey_216_sms",
      blockedAssessmentRef: "reachability_assessment_216_likely_failed",
      governingObjectRef: requestRef,
      blockedActionRefs: ["respond_more_info", "callback_status"],
      dominantBlockedActionRef: "respond_more_info",
      selectedAnchorRef: returnBundle.selectedAnchorRef,
      currentRouteRef: "mobile_ending_4421",
      currentContactRouteSnapshotRef: "contact_route_snapshot_216_sms",
      allowedRepairPathRefs: ["verify_mobile_number", "choose_email_fallback"],
      stepUpRequirementRef: "nhs_login_step_up_if_contact_changed",
      verificationCheckpointRef: repairApplied ? "verification_checkpoint_216_pending" : null,
      resultingReachabilityAssessmentRef: repairApplied
        ? "reachability_assessment_216_rebound_pending"
        : null,
      resumeContinuationRef: "resume_continuation_216_request_211_a",
      requestReturnBundleRef: returnBundle.requestReturnBundleRef,
      patientRecoveryLoopRef: "patient_recovery_loop_216_repair",
      repairState: repairApplied ? "applied" : "ready",
      renderedAt: "2026-04-16T12:15:00.000Z",
    },
    consentCheckpoint: {
      projectionName: "PatientConsentCheckpointProjection",
      consentCheckpointProjectionId: "consent_checkpoint_216_callback",
      governingObjectRef: requestRef,
      checkpointClass: "callback",
      consentScope: "callback_follow_up_sms",
      blockedActionRefs: consentBlocked ? ["callback_status", "respond_more_info"] : [],
      renewalRouteRef: `/requests/${requestRef}/consent-checkpoint`,
      resumeContinuationRef: "resume_continuation_216_request_211_a",
      requestReturnBundleRef: returnBundle.requestReturnBundleRef,
      experienceContinuityEvidenceRef: returnBundle.continuityEvidenceRef,
      surfaceState: consentBlocked ? "expired" : "current",
      renderedAt: "2026-04-16T12:15:00.000Z",
    },
    sourceProjectionRefs: [
      "PatientMoreInfoStatusProjection",
      "PatientMoreInfoResponseThreadProjection",
      "PatientCallbackStatusProjection",
      "PatientReachabilitySummaryProjection",
      "PatientContactRepairProjection",
      "PatientConsentCheckpointProjection",
      "PatientRequestReturnBundle",
    ],
  };
}
