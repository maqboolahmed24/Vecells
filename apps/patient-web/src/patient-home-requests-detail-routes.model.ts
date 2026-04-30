import { PATIENT_BOOKING_ENTRY_IDS, bookingEntryPath } from "./patient-booking-entry.paths";
import { resolvePharmacyProductMergePreviewForRequest } from "../../../packages/domains/pharmacy/src/phase6-pharmacy-product-merge-preview";

export const PATIENT_HOME_REQUESTS_DETAIL_TASK_ID =
  "par_215_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_home_requests_and_request_detail_routes";
export const PATIENT_HOME_REQUESTS_DETAIL_VISUAL_MODE = "Quiet_Casework_Premium";

export type PatientCaseworkRouteKey =
  | "home"
  | "quiet_home"
  | "requests_index"
  | "request_detail"
  | "account";
export type PatientRequestBucket = "needs_attention" | "in_progress" | "complete";
export type PatientRequestActionability = "live" | "secondary" | "read_only" | "blocked";
export type PatientCaseworkTone = "attention" | "info" | "success" | "blocked" | "quiet";
export type PatientChildSurfaceKind =
  | "more_info"
  | "callback"
  | "records"
  | "communications"
  | "booking"
  | "pharmacy";
export type PatientRestoreMode = "soft_navigation" | "browser_back" | "refresh_replay";

export interface PatientRequestReturnBundle {
  readonly projectionName: "PatientRequestReturnBundle";
  readonly requestReturnBundleRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly selectedAnchorRef: string;
  readonly selectedFilterRef: PatientRequestBucket | "all";
  readonly disclosurePosture: "row_summary" | "detail_header" | "child_route" | "recovery";
  readonly scrollStateRef: string | null;
  readonly returnRouteRef: "/requests";
  readonly detailRouteRef: `/requests/${string}`;
  readonly selectedAnchorTupleHash: string;
  readonly lineageTupleHash: string;
  readonly continuityEvidenceRef: string;
  readonly sameShellState: "preserved" | "read_only" | "recovery_required" | "identity_hold";
  readonly restoredBy: PatientRestoreMode;
  readonly focusTestId: string;
  readonly computedAt: string;
}

export interface PatientSpotlightDecisionProjection {
  readonly projectionName: "PatientSpotlightDecisionProjection";
  readonly decisionRef: string;
  readonly decisionTier:
    | "patient_action"
    | "dependency_repair"
    | "watchful_attention"
    | "quiet_home";
  readonly selectedCandidateRef: string | null;
  readonly selectedEntityRef: string | null;
  readonly selectedActionRef: string | null;
  readonly selectedActionRouteRef: string | null;
  readonly selectedActionLabel: string | null;
  readonly headline: string;
  readonly body: string;
  readonly singleDominantAction: true;
  readonly candidateLadder: readonly string[];
  readonly excludedCandidateRefs: readonly string[];
  readonly outrankedCandidateRefs: readonly string[];
  readonly quietHomeDecisionRef: string;
  readonly selectionTupleHash: string;
  readonly sourceProjectionRefs: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly computedAt: string;
}

export interface PatientQuietHomeDecision {
  readonly projectionName: "PatientQuietHomeDecision";
  readonly decisionRef: string;
  readonly decisionTier: "quiet_home";
  readonly eligible: boolean;
  readonly reason:
    | "all_clear"
    | "candidate_present"
    | "blocked_by_degraded_truth"
    | "blocked_by_visibility_or_actionability";
  readonly explanation: string;
  readonly gentlestSafeNextActionRef: "/requests";
  readonly blockedPreventionRefs: readonly string[];
  readonly candidateSetEmpty: boolean;
  readonly queryTruthState: "complete" | "converging" | "query_failed";
  readonly computedAt: string;
}

export interface PatientNavUrgencyDigest {
  readonly projectionName: "PatientNavUrgencyDigest";
  readonly digestRef: string;
  readonly urgentCount: number;
  readonly attentionCount: number;
  readonly dependencyRepairCount: number;
  readonly quietHomeEligible: boolean;
  readonly dominantRouteRef: string | null;
}

export interface PatientNavReturnContract {
  readonly projectionName: "PatientNavReturnContract";
  readonly contractRef: string;
  readonly originRouteRef: "/home" | "/requests" | "/portal/account" | `/requests/${string}`;
  readonly returnRouteRef: "/home" | "/requests";
  readonly selectedEntityRef: string | null;
  readonly selectedCandidateRef: string | null;
  readonly tupleHash: string;
  readonly continuityState: "preserved" | "quiet" | "recovery_only" | "blocked";
}

export interface PatientPortalNavigationProjection {
  readonly projectionName: "PatientPortalNavigationProjection";
  readonly activeRouteRef: "/home" | "/requests" | "/portal/account" | `/requests/${string}`;
  readonly items: readonly {
    readonly id: "home" | "requests" | "messages" | "account";
    readonly label: string;
    readonly path: string;
    readonly badgeLabel: string | null;
    readonly ariaCurrent: boolean;
    readonly placeholder: boolean;
  }[];
}

export interface PatientHomeCompactPanel {
  readonly panelRef: string;
  readonly kind: "active_requests" | "appointments" | "record_updates" | "unread_messages";
  readonly label: string;
  readonly summary: string;
  readonly stateLabel: string;
  readonly path: string;
  readonly tone: PatientCaseworkTone;
  readonly governedPlaceholder: boolean;
  readonly sourceProjectionRefs: readonly string[];
}

export interface PatientHomeProjection {
  readonly projectionName: "PatientHomeProjection";
  readonly projectionAlias: "PatientPortalHomeProjection";
  readonly patientHomeProjectionId: string;
  readonly homeMode: "attention" | "quiet";
  readonly patientLabel: string;
  readonly maskedPatientRef: string;
  readonly spotlightDecision: PatientSpotlightDecisionProjection;
  readonly quietHomeDecision: PatientQuietHomeDecision;
  readonly navigationUrgencyDigest: PatientNavUrgencyDigest;
  readonly navReturnContract: PatientNavReturnContract;
  readonly portalNavigation: PatientPortalNavigationProjection;
  readonly compactPanels: readonly PatientHomeCompactPanel[];
  readonly querySurfaceRef: "GET /v1/me/home";
  readonly sourceProjectionRefs: readonly string[];
  readonly computedAt: string;
}

export interface PatientRequestSummaryProjection {
  readonly projectionName: "PatientRequestSummaryProjection";
  readonly summaryProjectionRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly displayLabel: string;
  readonly statusText: string;
  readonly statusTone: PatientCaseworkTone;
  readonly bucket: PatientRequestBucket;
  readonly patientSummary: string;
  readonly latestMeaningfulUpdateAt: string;
  readonly updatedLabel: string;
  readonly nextSafeActionRef: string | null;
  readonly dominantActionRef: string | null;
  readonly actionLabel: string;
  readonly actionability: PatientRequestActionability;
  readonly trustCueRef: string;
  readonly summarySafetyTier: "patient_safe_summary" | "same_patient_detail" | "read_only";
  readonly surfaceState: "ready" | "summary_only" | "placeholder_only";
  readonly linkedPharmacyCaseId: string | null;
  readonly linkedPharmacyStatusLabel: string | null;
  readonly changedSinceSeenLabel: string | null;
  readonly reasonCodes: readonly string[];
}

export interface PatientPharmacyChildContinuationProjection {
  readonly projectionName: "PatientPharmacyChildContinuationProjection";
  readonly pharmacyCaseId: string;
  readonly mergeState: "dispatch_pending" | "urgent_return" | "completed";
  readonly requestLineageLabel: string;
  readonly changedSinceSeenLabel: string;
  readonly freshnessLabel: string;
  readonly notificationStateLabel: string;
  readonly supportReplaySummary: string;
  readonly auditSummary: string;
  readonly sourceProjectionRefs: readonly string[];
}

export interface PatientRequestLineageProjection {
  readonly projectionName: "PatientRequestLineageProjection";
  readonly patientRequestLineageProjectionId: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly currentStageRef: string;
  readonly lineageCaseLinkRefs: readonly string[];
  readonly downstreamProjectionRefs: readonly string[];
  readonly childObjects: readonly string[];
  readonly requestReturnBundleRef: string;
  readonly nextActionProjectionRef: string;
  readonly latestLineageCaseLinkRef: string | null;
  readonly selectedChildAnchorRef: string | null;
  readonly selectedChildAnchorTupleHash: string;
  readonly lineageTupleHash: string;
  readonly visibilityState: "full" | "partial" | "placeholder_only";
  readonly computedAt: string;
}

export interface PatientRequestDownstreamProjection {
  readonly projectionName: "PatientRequestDownstreamProjection";
  readonly downstreamProjectionRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly childType: PatientChildSurfaceKind;
  readonly childRef: string;
  readonly patientLabelRef: string;
  readonly label: string;
  readonly summary: string;
  readonly authoritativeState: string;
  readonly awaitingParty: "patient" | "practice" | "none";
  readonly visibilityTier: "full" | "partial" | "placeholder_only";
  readonly placeholderPosture:
    | "none"
    | "sibling_projection_missing"
    | "step_up_required"
    | "read_only";
  readonly placeholderReasonRefs: readonly string[];
  readonly nextSafeActionRef: string | null;
  readonly routeRef: string;
  readonly childAnchorTupleHash: string;
  readonly pharmacyChild: PatientPharmacyChildContinuationProjection | null;
}

export interface PatientNextActionProjection {
  readonly projectionName: "PatientNextActionProjection";
  readonly nextActionProjectionRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly actionType: "respond_more_info" | "view_request" | "review_closed_summary";
  readonly dominantActionRef: string | null;
  readonly actionLabel: string;
  readonly actionability: PatientRequestActionability;
  readonly routingProjectionRef: string | null;
  readonly blockingDependencyRefs: readonly string[];
  readonly requestReturnBundleRef: string;
}

export interface PatientActionRoutingProjection {
  readonly projectionName: "PatientActionRoutingProjection";
  readonly actionRoutingProjectionRef: string;
  readonly routeFamilyRef: "patient_requests";
  readonly routeIntentBindingRef: "route_intent_211_v1";
  readonly capabilityLeaseRef: string;
  readonly writableEligibilityFenceRef: string;
  readonly policyBundleRef: string;
  readonly requestReturnBundleRef: string;
  readonly continuityEvidenceRef: string;
  readonly actionType: PatientNextActionProjection["actionType"];
  readonly routeTargetRef: string | null;
  readonly blockedReasonRef: string | null;
}

export interface PatientActionSettlementProjection {
  readonly projectionName: "PatientActionSettlementProjection";
  readonly actionSettlementProjectionRef: string;
  readonly actionRoutingProjectionRef: string;
  readonly localAckState: "none" | "acknowledged";
  readonly processingAcceptanceState: "not_started" | "accepted" | "pending";
  readonly authoritativeOutcomeState:
    | "local_acknowledged"
    | "pending_authoritative_confirmation"
    | "authoritative_outcome_settled";
  readonly sameShellState: "pending" | "settled" | "recovery_required";
  readonly requestReturnBundleRef: string;
  readonly settledAt: string | null;
}

export interface PatientSafetyInterruptionProjection {
  readonly projectionName: "PatientSafetyInterruptionProjection";
  readonly safetyInterruptionProjectionRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly surfaceState: "none" | "urgent_required";
  readonly interruptionReasonRef: string | null;
  readonly suppressedActionRefs: readonly string[];
  readonly nextSafeActionRef: string;
  readonly requestReturnBundleRef: string;
}

export interface PatientCasePulseProjection {
  readonly projectionName: "PatientCasePulseProjection";
  readonly pulseRef: string;
  readonly freshnessLabel: string;
  readonly trustLabel: string;
  readonly receiptLabel: string;
  readonly latestMeaningfulUpdateLabel: string;
  readonly sourceProjectionRefs: readonly string[];
}

export interface PatientRequestDetailProjection {
  readonly projectionName: "PatientRequestDetailProjection";
  readonly detailProjectionRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly title: string;
  readonly statusRibbon: {
    readonly label: string;
    readonly tone: PatientCaseworkTone;
    readonly freshnessLabel: string;
    readonly canonicalTruthRef: string;
  };
  readonly patientSafeDetail: string;
  readonly summary: PatientRequestSummaryProjection;
  readonly lineage: PatientRequestLineageProjection;
  readonly downstream: readonly PatientRequestDownstreamProjection[];
  readonly nextAction: PatientNextActionProjection;
  readonly actionRouting: PatientActionRoutingProjection;
  readonly actionSettlement: PatientActionSettlementProjection;
  readonly safetyInterruption: PatientSafetyInterruptionProjection;
  readonly returnBundle: PatientRequestReturnBundle;
  readonly casePulse: PatientCasePulseProjection;
  readonly trustSummaries: readonly string[];
  readonly sourceProjectionRefs: readonly string[];
}

export interface PatientRequestsIndexProjection {
  readonly projectionName: "PatientRequestsIndexProjection";
  readonly patientRequestsIndexProjectionId: string;
  readonly defaultBucket: PatientRequestBucket;
  readonly visibleBuckets: readonly PatientRequestBucket[];
  readonly activeFilterSetRef: PatientRequestBucket | "all";
  readonly selectedAnchorRef: string | null;
  readonly selectedAnchorTupleHash: string | null;
  readonly selectedRequestReturnBundleRef: string | null;
  readonly dominantActionRef: string | null;
  readonly trustCueRef: string;
  readonly requestSummaryRefs: readonly string[];
  readonly requestLineageRefs: readonly string[];
  readonly surfaceState: "ready";
  readonly groups: readonly {
    readonly bucket: PatientRequestBucket;
    readonly label: string;
    readonly description: string;
    readonly requests: readonly PatientRequestSummaryProjection[];
  }[];
}

export interface PatientHomeRequestsDetailEntryProjection {
  readonly projectionName: "PatientHomeRequestsDetailEntryProjection";
  readonly routeKey: PatientCaseworkRouteKey;
  readonly pathname: string;
  readonly visualMode: typeof PATIENT_HOME_REQUESTS_DETAIL_VISUAL_MODE;
  readonly home: PatientHomeProjection;
  readonly requestsIndex: PatientRequestsIndexProjection;
  readonly requestDetail: PatientRequestDetailProjection | null;
  readonly returnBundle: PatientRequestReturnBundle;
}

export type PatientHomeRequestsDetailPath =
  | "/home"
  | "/home/quiet"
  | "/portal/account"
  | "/requests"
  | `/requests/${string}`;

export const patientRequestSummaries215: readonly PatientRequestSummaryProjection[] = [
  {
    projectionName: "PatientRequestSummaryProjection",
    summaryProjectionRef: "patient_request_summary::request_211_a",
    requestRef: "request_211_a",
    requestLineageRef: "lineage_211_a",
    displayLabel: "Dermatology request",
    statusText: "Reply needed",
    statusTone: "attention",
    bucket: "needs_attention",
    patientSummary:
      "The practice needs one daylight photo note and the flare timing before review can continue.",
    latestMeaningfulUpdateAt: "2026-04-16T10:45:00.000Z",
    updatedLabel: "Updated today, 10:45",
    nextSafeActionRef: "reply_to_more_info",
    dominantActionRef: "respond_more_info",
    actionLabel: "Reply with more information",
    actionability: "live",
    trustCueRef: "fresh_from_practice",
    summarySafetyTier: "same_patient_detail",
    surfaceState: "ready",
    linkedPharmacyCaseId: null,
    linkedPharmacyStatusLabel: null,
    changedSinceSeenLabel: null,
    reasonCodes: ["selected_by_PatientSpotlightDecisionProjection", "same_lineage_context_ready"],
  },
  {
    projectionName: "PatientRequestSummaryProjection",
    summaryProjectionRef: "patient_request_summary::request_211_b",
    requestRef: "request_211_b",
    requestLineageRef: "lineage_211_b",
    displayLabel: "Pharmacy referral",
    statusText: "Proof pending",
    statusTone: "info",
    bucket: "in_progress",
    patientSummary:
      "Harbour Pharmacy Group remains the chosen pharmacy while the referral proof is still being confirmed.",
    latestMeaningfulUpdateAt: "2026-04-16T09:30:00.000Z",
    updatedLabel: "Updated today, 09:30",
    nextSafeActionRef: "open_pharmacy_status",
    dominantActionRef: null,
    actionLabel: "Open pharmacy status",
    actionability: "secondary",
    trustCueRef: "pharmacy_merge_authoritative",
    summarySafetyTier: "patient_safe_summary",
    surfaceState: "ready",
    linkedPharmacyCaseId: "PHC-2057",
    linkedPharmacyStatusLabel: "Referral proof pending",
    changedSinceSeenLabel: "Pharmacy confirmation is still pending",
    reasonCodes: ["pharmacy_child_visible", "practice_awaited", "quiet_secondary_row"],
  },
  {
    projectionName: "PatientRequestSummaryProjection",
    summaryProjectionRef: "patient_request_summary::request_215_callback",
    requestRef: "request_215_callback",
    requestLineageRef: "lineage_215_callback",
    displayLabel: "Urgent pharmacy return",
    statusText: "Urgent review",
    statusTone: "blocked",
    bucket: "in_progress",
    patientSummary: "The pharmacy has sent this request back for urgent review.",
    latestMeaningfulUpdateAt: "2026-04-15T16:10:00.000Z",
    updatedLabel: "Updated yesterday, 16:10",
    nextSafeActionRef: "review_urgent_return",
    dominantActionRef: null,
    actionLabel: "Review urgent update",
    actionability: "read_only",
    trustCueRef: "urgent_return_visible",
    summarySafetyTier: "same_patient_detail",
    surfaceState: "ready",
    linkedPharmacyCaseId: "PHC-2103",
    linkedPharmacyStatusLabel: "Urgent return reopened",
    changedSinceSeenLabel: "Urgent pharmacy update added yesterday",
    reasonCodes: ["pharmacy_reopened", "bounce_back_preserved", "urgent_return_visible"],
  },
  {
    projectionName: "PatientRequestSummaryProjection",
    summaryProjectionRef: "patient_request_summary::request_215_closed",
    requestRef: "request_215_closed",
    requestLineageRef: "lineage_215_closed",
    displayLabel: "Pharmacy outcome",
    statusText: "Outcome recorded",
    statusTone: "success",
    bucket: "complete",
    patientSummary: "The pharmacy outcome is available to review.",
    latestMeaningfulUpdateAt: "2026-04-14T15:20:00.000Z",
    updatedLabel: "Closed 14 Apr, 15:20",
    nextSafeActionRef: "review_pharmacy_outcome",
    dominantActionRef: null,
    actionLabel: "Review pharmacy outcome",
    actionability: "read_only",
    trustCueRef: "pharmacy_outcome_settled",
    summarySafetyTier: "read_only",
    surfaceState: "ready",
    linkedPharmacyCaseId: "PHC-2196",
    linkedPharmacyStatusLabel: "Outcome recorded",
    changedSinceSeenLabel: "Pharmacy outcome recorded",
    reasonCodes: ["settled_read_only", "pharmacy_outcome_visible", "not_promoted_on_home"],
  },
];

const requestByRef = new Map(
  patientRequestSummaries215.map((request) => [request.requestRef, request] as const),
);

function firstRequestSummary215(): PatientRequestSummaryProjection {
  const request = patientRequestSummaries215[0];
  if (!request) {
    throw new Error("PATIENT_HOME_REQUESTS_DETAIL_215_FIXTURE_EMPTY");
  }
  return request;
}

function tupleHash(seed: string): string {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return `tuple_${hash.toString(16).padStart(8, "0")}`;
}

export function makePatientRequestReturnBundle215(
  requestRef = "request_211_a",
  selectedFilterRef: PatientRequestBucket | "all" = "all",
  restoredBy: PatientRestoreMode = "soft_navigation",
): PatientRequestReturnBundle {
  const request = requestByRef.get(requestRef) ?? firstRequestSummary215();
  const lineageTupleHash = tupleHash(
    `${request.requestLineageRef}:${request.summaryProjectionRef}`,
  );
  return {
    projectionName: "PatientRequestReturnBundle",
    requestReturnBundleRef: `patient_request_return_bundle::${request.requestRef}`,
    requestRef: request.requestRef,
    requestLineageRef: request.requestLineageRef,
    selectedAnchorRef: request.requestRef,
    selectedFilterRef,
    disclosurePosture: "detail_header",
    scrollStateRef: null,
    returnRouteRef: "/requests",
    detailRouteRef: `/requests/${request.requestRef}`,
    selectedAnchorTupleHash: tupleHash(`${request.requestRef}:${selectedFilterRef}`),
    lineageTupleHash,
    continuityEvidenceRef: `patient_experience_continuity::${request.requestRef}`,
    sameShellState: request.actionability === "blocked" ? "recovery_required" : "preserved",
    restoredBy,
    focusTestId: `request-summary-row-${request.requestRef}`,
    computedAt: "2026-04-16T11:15:00.000Z",
  };
}

function navigationFor(
  routeKey: PatientCaseworkRouteKey,
  activeRouteRef: PatientPortalNavigationProjection["activeRouteRef"],
): PatientPortalNavigationProjection {
  const activeHome = routeKey === "home" || routeKey === "quiet_home";
  const activeRequests = routeKey === "requests_index" || routeKey === "request_detail";
  const activeAccount = routeKey === "account";
  return {
    projectionName: "PatientPortalNavigationProjection",
    activeRouteRef,
    items: [
      {
        id: "home",
        label: "Home",
        path: "/home",
        badgeLabel: activeHome ? "Current" : null,
        ariaCurrent: activeHome,
        placeholder: false,
      },
      {
        id: "requests",
        label: "Requests",
        path: "/requests",
        badgeLabel: "4",
        ariaCurrent: activeRequests,
        placeholder: false,
      },
      {
        id: "messages",
        label: "Messages",
        path: "#communications-placeholder",
        badgeLabel: null,
        ariaCurrent: false,
        placeholder: true,
      },
      {
        id: "account",
        label: "Account",
        path: "/portal/account",
        badgeLabel: null,
        ariaCurrent: activeAccount,
        placeholder: false,
      },
    ],
  };
}

function spotlightFor(
  homeMode: PatientHomeProjection["homeMode"],
): PatientSpotlightDecisionProjection {
  if (homeMode === "quiet") {
    return {
      projectionName: "PatientSpotlightDecisionProjection",
      decisionRef: "spotlight_decision_215_quiet",
      decisionTier: "quiet_home",
      selectedCandidateRef: null,
      selectedEntityRef: null,
      selectedActionRef: null,
      selectedActionRouteRef: null,
      selectedActionLabel: null,
      headline: "No action is needed right now",
      body: "The home surface stays quiet because every governed projection is complete and no patient-owned action outranks the quiet threshold.",
      singleDominantAction: true,
      candidateLadder: [],
      excludedCandidateRefs: [],
      outrankedCandidateRefs: ["request_211_b", "request_215_callback", "request_215_closed"],
      quietHomeDecisionRef: "quiet_home_decision_215",
      selectionTupleHash: tupleHash("quiet_home:all_clear"),
      sourceProjectionRefs: [
        "PatientSpotlightDecisionProjection",
        "PatientQuietHomeDecision",
        "PatientNavUrgencyDigest",
      ],
      reasonCodes: ["quiet_threshold_not_met", "no_dashboard_filler"],
      computedAt: "2026-04-16T11:15:00.000Z",
    };
  }

  return {
    projectionName: "PatientSpotlightDecisionProjection",
    decisionRef: "spotlight_decision_215_patient_action",
    decisionTier: "patient_action",
    selectedCandidateRef: "request_211_a",
    selectedEntityRef: "request_211_a",
    selectedActionRef: "respond_more_info",
    selectedActionRouteRef: "/requests/request_211_a",
    selectedActionLabel: "Reply with more information",
    headline: "Your dermatology request needs one reply",
    body: "The home spotlight promotes the single patient-owned action from the shared request projection. Other work stays compact and secondary.",
    singleDominantAction: true,
    candidateLadder: ["request_211_a", "request_211_b", "request_215_callback"],
    excludedCandidateRefs: ["request_215_closed"],
    outrankedCandidateRefs: ["request_211_b", "request_215_callback", "request_215_closed"],
    quietHomeDecisionRef: "quiet_home_decision_215",
    selectionTupleHash: tupleHash("patient_action:request_211_a"),
    sourceProjectionRefs: [
      "PatientSpotlightDecisionProjection",
      "PatientRequestsIndexProjection",
      "PatientRequestSummaryProjection",
    ],
    reasonCodes: ["patient_owed_action", "single_dominant_action"],
    computedAt: "2026-04-16T11:15:00.000Z",
  };
}

function quietHomeDecisionFor(
  homeMode: PatientHomeProjection["homeMode"],
): PatientQuietHomeDecision {
  return {
    projectionName: "PatientQuietHomeDecision",
    decisionRef: "quiet_home_decision_215",
    decisionTier: "quiet_home",
    eligible: homeMode === "quiet",
    reason: homeMode === "quiet" ? "all_clear" : "candidate_present",
    explanation:
      homeMode === "quiet"
        ? "Every source projection is complete and no visible request, callback, record update, or communications item needs patient action."
        : "A request candidate is present, so quiet home is not eligible and the single spotlight is promoted.",
    gentlestSafeNextActionRef: "/requests",
    blockedPreventionRefs: [],
    candidateSetEmpty: homeMode === "quiet",
    queryTruthState: "complete",
    computedAt: "2026-04-16T11:15:00.000Z",
  };
}

function compactPanels(): readonly PatientHomeCompactPanel[] {
  return [
    {
      panelRef: "home_panel_active_requests",
      kind: "active_requests",
      label: "Active requests",
      summary: "Four requests are available; one needs your reply.",
      stateLabel: "1 reply needed",
      path: "/requests",
      tone: "attention",
      governedPlaceholder: false,
      sourceProjectionRefs: ["PatientRequestsIndexProjection", "PatientRequestSummaryProjection"],
    },
    {
      panelRef: "home_panel_appointments",
      kind: "appointments",
      label: "Appointments",
      summary: "Start or change an appointment from this account.",
      stateLabel: "Book or rebook",
      path: bookingEntryPath(PATIENT_BOOKING_ENTRY_IDS.homeReady),
      tone: "info",
      governedPlaceholder: false,
      sourceProjectionRefs: [
        "PatientNavReturnContract",
        "PatientPortalEntryProjection",
        "PatientAppointmentWorkspaceProjection",
      ],
    },
    {
      panelRef: "home_panel_record_updates",
      kind: "record_updates",
      label: "Record updates",
      summary: "Health record updates will appear here when they are ready.",
      stateLabel: "Coming soon",
      path: "#records-placeholder",
      tone: "info",
      governedPlaceholder: true,
      sourceProjectionRefs: ["GovernedPlaceholderCard", "PatientRequestDownstreamProjection"],
    },
    {
      panelRef: "home_panel_unread_messages",
      kind: "unread_messages",
      label: "Unread messages",
      summary: "Message previews will appear here when available.",
      stateLabel: "Coming soon",
      path: "#communications-placeholder",
      tone: "quiet",
      governedPlaceholder: true,
      sourceProjectionRefs: ["GovernedPlaceholderCard", "PatientCommunicationsTimelineProjection"],
    },
  ];
}

function homeProjectionFor(
  routeKey: PatientCaseworkRouteKey,
  activeRouteRef: PatientPortalNavigationProjection["activeRouteRef"],
  homeMode: PatientHomeProjection["homeMode"],
): PatientHomeProjection {
  const spotlightDecision = spotlightFor(homeMode);
  const quietHomeDecision = quietHomeDecisionFor(homeMode);
  return {
    projectionName: "PatientHomeProjection",
    projectionAlias: "PatientPortalHomeProjection",
    patientHomeProjectionId: `patient_home_projection_215_${homeMode}`,
    homeMode,
    patientLabel: "Samira",
    maskedPatientRef: "NHS 943 *** 7812",
    spotlightDecision,
    quietHomeDecision,
    navigationUrgencyDigest: {
      projectionName: "PatientNavUrgencyDigest",
      digestRef: "nav_urgency_digest_215",
      urgentCount: 0,
      attentionCount: homeMode === "attention" ? 1 : 0,
      dependencyRepairCount: 0,
      quietHomeEligible: homeMode === "quiet",
      dominantRouteRef: spotlightDecision.selectedActionRouteRef,
    },
    navReturnContract: {
      projectionName: "PatientNavReturnContract",
      contractRef: "nav_return_contract_215",
      originRouteRef: activeRouteRef,
      returnRouteRef: routeKey === "request_detail" ? "/requests" : "/home",
      selectedEntityRef: spotlightDecision.selectedEntityRef,
      selectedCandidateRef: spotlightDecision.selectedCandidateRef,
      tupleHash: spotlightDecision.selectionTupleHash,
      continuityState: homeMode === "quiet" ? "quiet" : "preserved",
    },
    portalNavigation: navigationFor(routeKey, activeRouteRef),
    compactPanels: compactPanels(),
    querySurfaceRef: "GET /v1/me/home",
    sourceProjectionRefs: [
      "PatientSpotlightDecisionProjection",
      "PatientQuietHomeDecision",
      "PatientNavUrgencyDigest",
      "PatientNavReturnContract",
    ],
    computedAt: "2026-04-16T11:15:00.000Z",
  };
}

function groupedRequests(): PatientRequestsIndexProjection["groups"] {
  const specs: readonly {
    readonly bucket: PatientRequestBucket;
    readonly label: string;
    readonly description: string;
  }[] = [
    {
      bucket: "needs_attention",
      label: "Needs attention",
      description: "Requests that need something from you appear first.",
    },
    {
      bucket: "in_progress",
      label: "In progress",
      description: "Requests the practice is still working on.",
    },
    {
      bucket: "complete",
      label: "Complete",
      description: "Finished requests stay available for review.",
    },
  ];
  return specs.map((spec) => ({
    ...spec,
    requests: patientRequestSummaries215.filter((request) => request.bucket === spec.bucket),
  }));
}

function requestsIndexFor(
  selectedFilterRef: PatientRequestBucket | "all",
  selectedRequestRef: string | null,
): PatientRequestsIndexProjection {
  const selectedRequest = selectedRequestRef ? requestByRef.get(selectedRequestRef) : null;
  return {
    projectionName: "PatientRequestsIndexProjection",
    patientRequestsIndexProjectionId: "patient_requests_index_215",
    defaultBucket: "needs_attention",
    visibleBuckets: ["needs_attention", "in_progress", "complete"],
    activeFilterSetRef: selectedFilterRef,
    selectedAnchorRef: selectedRequest?.requestRef ?? null,
    selectedAnchorTupleHash: selectedRequest
      ? tupleHash(`${selectedRequest.requestRef}:${selectedFilterRef}`)
      : null,
    selectedRequestReturnBundleRef: selectedRequest
      ? `patient_request_return_bundle::${selectedRequest.requestRef}`
      : null,
    dominantActionRef: "respond_more_info",
    trustCueRef: "PatientRequestsIndexProjection::fresh",
    requestSummaryRefs: patientRequestSummaries215.map((request) => request.summaryProjectionRef),
    requestLineageRefs: patientRequestSummaries215.map((request) => request.requestLineageRef),
    surfaceState: "ready",
    groups: groupedRequests(),
  };
}

function downstreamFor(
  request: PatientRequestSummaryProjection,
): readonly PatientRequestDownstreamProjection[] {
  const base = `/requests/${request.requestRef}`;
  const missingContextRef = "PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT";
  const missingRecordsRef = "PARALLEL_INTERFACE_GAP_CROSSCUTTING_RECORDS";
  const communicationsRef = "PatientCommunicationsTimelineProjection";
  const pharmacyMerge = resolvePharmacyProductMergePreviewForRequest(request.requestRef);

  if (request.requestRef === "request_211_a") {
    return [
      {
        projectionName: "PatientRequestDownstreamProjection",
        downstreamProjectionRef: "patient_downstream::request_211_a::more_info",
        requestRef: request.requestRef,
        requestLineageRef: request.requestLineageRef,
        childType: "more_info",
        childRef: "thread_211_a",
        patientLabelRef: "more_info_question",
        label: "More information response",
        summary: "Reserved for the response surface that task 216 will own.",
        authoritativeState: "reply_needed",
        awaitingParty: "patient",
        visibilityTier: "placeholder_only",
        placeholderPosture: "sibling_projection_missing",
        placeholderReasonRefs: [missingContextRef, "PatientNextActionProjection"],
        nextSafeActionRef: "reply_to_more_info",
        routeRef: `${base}/more-info`,
        childAnchorTupleHash: tupleHash("request_211_a:more_info"),
        pharmacyChild: null,
      },
      {
        projectionName: "PatientRequestDownstreamProjection",
        downstreamProjectionRef: "patient_downstream::request_211_a::callback",
        requestRef: request.requestRef,
        requestLineageRef: request.requestLineageRef,
        childType: "callback",
        childRef: "case_211_callback",
        patientLabelRef: "callback_case",
        label: "Callback status",
        summary: "Callback status is visible as a saved summary, not hidden.",
        authoritativeState: "queued",
        awaitingParty: "practice",
        visibilityTier: "placeholder_only",
        placeholderPosture: "sibling_projection_missing",
        placeholderReasonRefs: [missingContextRef, "PatientCallbackStatusProjection"],
        nextSafeActionRef: "view_callback_status",
        routeRef: `${base}/callback`,
        childAnchorTupleHash: tupleHash("request_211_a:callback"),
        pharmacyChild: null,
      },
      {
        projectionName: "PatientRequestDownstreamProjection",
        downstreamProjectionRef: "patient_downstream::request_211_a::booking_entry",
        requestRef: request.requestRef,
        requestLineageRef: request.requestLineageRef,
        childType: "booking",
        childRef: "booking_entry_300_requests_ready",
        patientLabelRef: "booking_follow_up",
        label: "Booking follow-up",
        summary: "Booking follow-up is available before scheduling opens.",
        authoritativeState: "available",
        awaitingParty: "none",
        visibilityTier: "full",
        placeholderPosture: "none",
        placeholderReasonRefs: [
          "PatientRequestReturnBundle",
          "PatientNavReturnContract",
          "PatientBookingEntryProjectionAdapter",
        ],
        nextSafeActionRef: "open_booking_entry",
        routeRef: bookingEntryPath(PATIENT_BOOKING_ENTRY_IDS.requestsReady),
        childAnchorTupleHash: tupleHash("request_211_a:booking_entry"),
        pharmacyChild: null,
      },
      {
        projectionName: "PatientRequestDownstreamProjection",
        downstreamProjectionRef: "patient_downstream::request_211_a::records",
        requestRef: request.requestRef,
        requestLineageRef: request.requestLineageRef,
        childType: "records",
        childRef: "record_211_a",
        patientLabelRef: "results_update",
        label: "Record follow-up",
        summary: "A health record update will appear here when it is ready.",
        authoritativeState: "available",
        awaitingParty: "none",
        visibilityTier: "placeholder_only",
        placeholderPosture: "sibling_projection_missing",
        placeholderReasonRefs: [missingRecordsRef, "PatientRequestDownstreamProjection"],
        nextSafeActionRef: "view_results_update",
        routeRef: `${base}/records`,
        childAnchorTupleHash: tupleHash("request_211_a:records"),
        pharmacyChild: null,
      },
      {
        projectionName: "PatientRequestDownstreamProjection",
        downstreamProjectionRef: "patient_downstream::request_211_a::communications",
        requestRef: request.requestRef,
        requestLineageRef: request.requestLineageRef,
        childType: "communications",
        childRef: "message_214_a",
        patientLabelRef: "communications_thread",
        label: "Communications thread",
        summary: "Message updates will appear here when they are ready.",
        authoritativeState: "preview_available",
        awaitingParty: "patient",
        visibilityTier: "placeholder_only",
        placeholderPosture: "sibling_projection_missing",
        placeholderReasonRefs: [communicationsRef, missingContextRef],
        nextSafeActionRef: "open_communications_thread",
        routeRef: `${base}/messages`,
        childAnchorTupleHash: tupleHash("request_211_a:communications"),
        pharmacyChild: null,
      },
    ];
  }

  if (pharmacyMerge) {
    return [
      {
        projectionName: "PatientRequestDownstreamProjection",
        downstreamProjectionRef: `patient_downstream::${request.requestRef}::pharmacy`,
        requestRef: request.requestRef,
        requestLineageRef: request.requestLineageRef,
        childType: "pharmacy",
        childRef: pharmacyMerge.pharmacyCaseId,
        patientLabelRef: "pharmacy_continuation",
        label: pharmacyMerge.childLabel,
        summary: pharmacyMerge.childSummary,
        authoritativeState: pharmacyMerge.authoritativeStateLabel,
        awaitingParty:
          pharmacyMerge.mergeState === "completed"
            ? "none"
            : pharmacyMerge.mergeState === "urgent_return"
              ? "patient"
              : "practice",
        visibilityTier: "full",
        placeholderPosture: "none",
        placeholderReasonRefs: pharmacyMerge.sourceProjectionRefs,
        nextSafeActionRef: request.nextSafeActionRef,
        routeRef: pharmacyMerge.patientRouteRef,
        childAnchorTupleHash: tupleHash(`${request.requestRef}:${pharmacyMerge.pharmacyCaseId}`),
        pharmacyChild: {
          projectionName: "PatientPharmacyChildContinuationProjection",
          pharmacyCaseId: pharmacyMerge.pharmacyCaseId,
          mergeState: pharmacyMerge.mergeState,
          requestLineageLabel: pharmacyMerge.requestLineageLabel,
          changedSinceSeenLabel: pharmacyMerge.changedSinceSeenLabel,
          freshnessLabel: pharmacyMerge.freshnessLabel,
          notificationStateLabel: pharmacyMerge.patientNotification.stateLabel,
          supportReplaySummary: pharmacyMerge.supportReplaySummary,
          auditSummary: pharmacyMerge.auditSummary,
          sourceProjectionRefs: pharmacyMerge.sourceProjectionRefs,
        },
      },
    ];
  }

  return [
    {
      projectionName: "PatientRequestDownstreamProjection",
      downstreamProjectionRef: `patient_downstream::${request.requestRef}::summary`,
      requestRef: request.requestRef,
      requestLineageRef: request.requestLineageRef,
      childType: "communications",
      childRef: `${request.requestRef}_summary_placeholder`,
      patientLabelRef: "summary_placeholder",
      label: "Related updates",
      summary: "Related updates will appear here when they are ready.",
      authoritativeState: request.bucket === "complete" ? "settled" : "in_progress",
      awaitingParty: request.bucket === "complete" ? "none" : "practice",
      visibilityTier: "placeholder_only",
      placeholderPosture: "sibling_projection_missing",
      placeholderReasonRefs: [missingContextRef, "GovernedPlaceholderCard"],
      nextSafeActionRef: request.nextSafeActionRef,
      routeRef: `${base}/updates`,
      childAnchorTupleHash: tupleHash(`${request.requestRef}:updates`),
      pharmacyChild: null,
    },
  ];
}

function detailFor(
  requestRef: string,
  selectedFilterRef: PatientRequestBucket | "all",
  restoredBy: PatientRestoreMode,
): PatientRequestDetailProjection {
  const request = requestByRef.get(requestRef) ?? firstRequestSummary215();
  const pharmacyMerge = resolvePharmacyProductMergePreviewForRequest(request.requestRef);
  const returnBundle = makePatientRequestReturnBundle215(
    request.requestRef,
    selectedFilterRef,
    restoredBy,
  );
  const downstream = downstreamFor(request);
  const lineage: PatientRequestLineageProjection = {
    projectionName: "PatientRequestLineageProjection",
    patientRequestLineageProjectionId: `patient_request_lineage::${request.requestRef}`,
    requestRef: request.requestRef,
    requestLineageRef: request.requestLineageRef,
    currentStageRef: request.statusText,
    lineageCaseLinkRefs:
      request.requestRef === "request_211_a"
        ? ["case_211_more_info", "case_211_callback", "record_211_a"]
        : pharmacyMerge
          ? [`case_${request.requestRef}`, `pharmacy_case_${pharmacyMerge.pharmacyCaseId}`]
          : [`case_${request.requestRef}`],
    downstreamProjectionRefs: downstream.map((child) => child.downstreamProjectionRef),
    childObjects: downstream.map((child) => `${child.childType}:${child.childRef}`),
    requestReturnBundleRef: returnBundle.requestReturnBundleRef,
    nextActionProjectionRef: `patient_next_action::${request.requestRef}`,
    latestLineageCaseLinkRef: downstream[0]?.childRef ?? null,
    selectedChildAnchorRef: downstream[0]?.childRef ?? null,
    selectedChildAnchorTupleHash: downstream[0]?.childAnchorTupleHash ?? tupleHash("none"),
    lineageTupleHash: returnBundle.lineageTupleHash,
    visibilityState: request.surfaceState === "placeholder_only" ? "placeholder_only" : "full",
    computedAt: "2026-04-16T11:15:00.000Z",
  };
  const actionability = request.actionability;
  const nextAction: PatientNextActionProjection = {
    projectionName: "PatientNextActionProjection",
    nextActionProjectionRef: `patient_next_action::${request.requestRef}`,
    requestRef: request.requestRef,
    requestLineageRef: request.requestLineageRef,
    actionType:
      request.dominantActionRef === "respond_more_info"
        ? "respond_more_info"
        : request.bucket === "complete"
          ? "review_closed_summary"
          : "view_request",
    dominantActionRef: request.dominantActionRef,
    actionLabel: request.actionLabel,
    actionability,
    routingProjectionRef: `patient_action_routing::${request.requestRef}`,
    blockingDependencyRefs: actionability === "blocked" ? ["identity_hold"] : [],
    requestReturnBundleRef: returnBundle.requestReturnBundleRef,
  };
  const actionRouting: PatientActionRoutingProjection = {
    projectionName: "PatientActionRoutingProjection",
    actionRoutingProjectionRef: `patient_action_routing::${request.requestRef}`,
    routeFamilyRef: "patient_requests",
    routeIntentBindingRef: "route_intent_211_v1",
    capabilityLeaseRef: "capability_lease_215_live",
    writableEligibilityFenceRef:
      actionability === "live" ? "writable_eligibility_live" : "writable_eligibility_read_only",
    policyBundleRef: "patient_request_action_policy_215",
    requestReturnBundleRef: returnBundle.requestReturnBundleRef,
    continuityEvidenceRef: returnBundle.continuityEvidenceRef,
    actionType: nextAction.actionType,
    routeTargetRef:
      request.dominantActionRef === "respond_more_info"
        ? `/requests/${request.requestRef}/more-info`
        : (pharmacyMerge?.patientRouteRef ?? `/requests/${request.requestRef}`),
    blockedReasonRef: null,
  };

  return {
    projectionName: "PatientRequestDetailProjection",
    detailProjectionRef: `patient_request_detail::${request.requestRef}`,
    requestRef: request.requestRef,
    requestLineageRef: request.requestLineageRef,
    title: request.displayLabel,
    statusRibbon: {
      label: pharmacyMerge?.requestStatusLabel ?? request.statusText,
      tone: request.statusTone,
      freshnessLabel: request.updatedLabel,
      canonicalTruthRef: `canonical_request_truth::${request.requestRef}`,
    },
    patientSafeDetail:
      request.requestRef === "request_211_a"
        ? "The team is waiting for one patient-safe reply about photo timing. Clinical reasoning and staff-only notes stay outside this route."
        : (pharmacyMerge?.childSummary ?? request.patientSummary),
    summary: request,
    lineage,
    downstream,
    nextAction,
    actionRouting,
    actionSettlement: {
      projectionName: "PatientActionSettlementProjection",
      actionSettlementProjectionRef: `patient_action_settlement::${request.requestRef}`,
      actionRoutingProjectionRef: actionRouting.actionRoutingProjectionRef,
      localAckState: "none",
      processingAcceptanceState: "not_started",
      authoritativeOutcomeState:
        request.bucket === "complete" ? "authoritative_outcome_settled" : "local_acknowledged",
      sameShellState: request.bucket === "complete" ? "settled" : "pending",
      requestReturnBundleRef: returnBundle.requestReturnBundleRef,
      settledAt: request.bucket === "complete" ? "2026-04-14T15:20:00.000Z" : null,
    },
    safetyInterruption: {
      projectionName: "PatientSafetyInterruptionProjection",
      safetyInterruptionProjectionRef: `patient_safety_interruption::${request.requestRef}`,
      requestRef: request.requestRef,
      requestLineageRef: request.requestLineageRef,
      surfaceState: "none",
      interruptionReasonRef: null,
      suppressedActionRefs: [],
      nextSafeActionRef: request.nextSafeActionRef ?? "view_request",
      requestReturnBundleRef: returnBundle.requestReturnBundleRef,
    },
    returnBundle,
    casePulse: {
      projectionName: "PatientCasePulseProjection",
      pulseRef: `patient_case_pulse::${request.requestRef}`,
      freshnessLabel: request.updatedLabel,
      trustLabel: request.trustCueRef.replaceAll("_", " "),
      receiptLabel: pharmacyMerge
        ? pharmacyMerge.authoritativeStateLabel
        : request.bucket === "complete"
          ? "Outcome recorded"
          : "Request details kept together",
      latestMeaningfulUpdateLabel: request.latestMeaningfulUpdateAt,
      sourceProjectionRefs: [
        "PatientActionSettlementProjection",
        "PatientRequestReturnBundle",
        "PatientRequestLineageProjection",
      ],
    },
    trustSummaries: [
      "This page keeps the request, next step, and related updates together.",
      pharmacyMerge
        ? `Pharmacy update ${pharmacyMerge.pharmacyCaseId} stays visible with this request.`
        : "Related updates appear here when they are ready.",
      pharmacyMerge
        ? pharmacyMerge.patientNotification.stateLabel
        : "Returning to the request list keeps your place.",
    ],
    sourceProjectionRefs: [
      "PatientRequestDetailProjection",
      "PatientRequestLineageProjection",
      "PatientRequestDownstreamProjection",
      "PatientNextActionProjection",
      "PatientActionRoutingProjection",
      "PatientActionSettlementProjection",
      "PatientSafetyInterruptionProjection",
      "PatientRequestReturnBundle",
      ...(pharmacyMerge?.sourceProjectionRefs ?? []),
    ],
  };
}

export function isPatientHomeRequestsDetailPath(pathname: string): boolean {
  return (
    pathname === "/home" ||
    pathname === "/home/quiet" ||
    pathname === "/portal/account" ||
    pathname === "/requests" ||
    /^\/requests\/[^/]+$/.test(pathname)
  );
}

export function normalizePatientHomeRequestsDetailPath(
  pathname: string,
): PatientHomeRequestsDetailPath {
  return isPatientHomeRequestsDetailPath(pathname)
    ? (pathname as PatientHomeRequestsDetailPath)
    : "/home";
}

export function resolvePatientHomeRequestsDetailEntry(input: {
  readonly pathname: string;
  readonly search?: string;
  readonly selectedFilterRef?: PatientRequestBucket | "all";
  readonly restoredBy?: PatientRestoreMode;
  readonly restoredBundle?: PatientRequestReturnBundle | null;
}): PatientHomeRequestsDetailEntryProjection {
  const pathname = normalizePatientHomeRequestsDetailPath(input.pathname);
  const selectedFilterRef =
    input.selectedFilterRef ??
    input.restoredBundle?.selectedFilterRef ??
    (pathname === "/requests" ? "all" : "all");
  const restoredBy = input.restoredBy ?? "soft_navigation";
  const search = new URLSearchParams(input.search ?? "");
  const quietMode = pathname === "/home/quiet" || search.get("mode") === "quiet";
  const routeKey: PatientCaseworkRouteKey =
    pathname === "/home" || pathname === "/home/quiet"
      ? quietMode
        ? "quiet_home"
        : "home"
      : pathname === "/portal/account"
        ? "account"
        : pathname === "/requests"
          ? "requests_index"
          : "request_detail";
  const detailMatch = pathname.match(/^\/requests\/([^/]+)$/);
  const selectedRequestRef =
    detailMatch?.[1] ??
    (routeKey === "requests_index" ? null : (input.restoredBundle?.requestRef ?? "request_211_a"));
  const activeRouteRef =
    routeKey === "request_detail" && selectedRequestRef
      ? (`/requests/${selectedRequestRef}` as const)
      : routeKey === "requests_index"
        ? "/requests"
        : routeKey === "account"
          ? "/portal/account"
          : "/home";
  const home = homeProjectionFor(routeKey, activeRouteRef, quietMode ? "quiet" : "attention");
  const requestsIndex = requestsIndexFor(selectedFilterRef, selectedRequestRef);
  const requestDetail =
    routeKey === "request_detail" && selectedRequestRef
      ? detailFor(selectedRequestRef, selectedFilterRef, restoredBy)
      : null;
  const returnBundle =
    requestDetail?.returnBundle ??
    input.restoredBundle ??
    makePatientRequestReturnBundle215(
      selectedRequestRef ?? "request_211_a",
      selectedFilterRef,
      restoredBy,
    );

  return {
    projectionName: "PatientHomeRequestsDetailEntryProjection",
    routeKey,
    pathname,
    visualMode: PATIENT_HOME_REQUESTS_DETAIL_VISUAL_MODE,
    home,
    requestsIndex,
    requestDetail,
    returnBundle,
  };
}
