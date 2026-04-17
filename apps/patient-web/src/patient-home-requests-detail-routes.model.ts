export const PATIENT_HOME_REQUESTS_DETAIL_TASK_ID =
  "par_215_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_home_requests_and_request_detail_routes";
export const PATIENT_HOME_REQUESTS_DETAIL_VISUAL_MODE = "Quiet_Casework_Premium";

export type PatientCaseworkRouteKey = "home" | "quiet_home" | "requests_index" | "request_detail";
export type PatientRequestBucket = "needs_attention" | "in_progress" | "complete";
export type PatientRequestActionability = "live" | "secondary" | "read_only" | "blocked";
export type PatientCaseworkTone = "attention" | "info" | "success" | "blocked" | "quiet";
export type PatientChildSurfaceKind = "more_info" | "callback" | "records" | "communications";
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
  readonly originRouteRef: "/home" | "/requests" | `/requests/${string}`;
  readonly returnRouteRef: "/home" | "/requests";
  readonly selectedEntityRef: string | null;
  readonly selectedCandidateRef: string | null;
  readonly tupleHash: string;
  readonly continuityState: "preserved" | "quiet" | "recovery_only" | "blocked";
}

export interface PatientPortalNavigationProjection {
  readonly projectionName: "PatientPortalNavigationProjection";
  readonly activeRouteRef: "/home" | "/requests" | `/requests/${string}`;
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
  readonly reasonCodes: readonly string[];
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
    reasonCodes: ["selected_by_PatientSpotlightDecisionProjection", "same_lineage_context_ready"],
  },
  {
    projectionName: "PatientRequestSummaryProjection",
    summaryProjectionRef: "patient_request_summary::request_211_b",
    requestRef: "request_211_b",
    requestLineageRef: "lineage_211_b",
    displayLabel: "Admin request",
    statusText: "In progress",
    statusTone: "info",
    bucket: "in_progress",
    patientSummary:
      "The practice has the request. There is no new patient action while it is checked.",
    latestMeaningfulUpdateAt: "2026-04-16T09:30:00.000Z",
    updatedLabel: "Updated today, 09:30",
    nextSafeActionRef: "view_request",
    dominantActionRef: null,
    actionLabel: "Read current status",
    actionability: "secondary",
    trustCueRef: "in_progress",
    summarySafetyTier: "patient_safe_summary",
    surfaceState: "ready",
    reasonCodes: ["practice_awaited", "quiet_secondary_row"],
  },
  {
    projectionName: "PatientRequestSummaryProjection",
    summaryProjectionRef: "patient_request_summary::request_215_callback",
    requestRef: "request_215_callback",
    requestLineageRef: "lineage_215_callback",
    displayLabel: "Phone callback",
    statusText: "Callback queued",
    statusTone: "quiet",
    bucket: "in_progress",
    patientSummary:
      "A callback status surface is reserved here until the callback projection lands.",
    latestMeaningfulUpdateAt: "2026-04-15T16:10:00.000Z",
    updatedLabel: "Updated yesterday, 16:10",
    nextSafeActionRef: "view_callback_placeholder",
    dominantActionRef: null,
    actionLabel: "View callback placeholder",
    actionability: "read_only",
    trustCueRef: "governed_placeholder",
    summarySafetyTier: "patient_safe_summary",
    surfaceState: "placeholder_only",
    reasonCodes: ["future_child_surface_placeholder", "PatientCallbackStatusProjection_pending"],
  },
  {
    projectionName: "PatientRequestSummaryProjection",
    summaryProjectionRef: "patient_request_summary::request_215_closed",
    requestRef: "request_215_closed",
    requestLineageRef: "lineage_215_closed",
    displayLabel: "Prescription question",
    statusText: "Complete",
    statusTone: "success",
    bucket: "complete",
    patientSummary:
      "The prescription question is closed and remains available as a patient-safe summary.",
    latestMeaningfulUpdateAt: "2026-04-14T15:20:00.000Z",
    updatedLabel: "Closed 14 Apr, 15:20",
    nextSafeActionRef: "review_closed_summary",
    dominantActionRef: null,
    actionLabel: "Review closed summary",
    actionability: "read_only",
    trustCueRef: "authoritative_outcome_settled",
    summarySafetyTier: "read_only",
    surfaceState: "ready",
    reasonCodes: ["settled_read_only", "not_promoted_on_home"],
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
        path: "#account-placeholder",
        badgeLabel: null,
        ariaCurrent: false,
        placeholder: true,
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
      summary: "Four request summaries are available; one has a patient-owned action.",
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
      summary: "Appointments stay reserved for the later booking surface and do not invent data.",
      stateLabel: "Future surface",
      path: "#appointments-placeholder",
      tone: "quiet",
      governedPlaceholder: true,
      sourceProjectionRefs: ["GovernedPlaceholderCard", "PatientRequestDownstreamProjection"],
    },
    {
      panelRef: "home_panel_record_updates",
      kind: "record_updates",
      label: "Record updates",
      summary:
        "Record-follow-up context is acknowledged but waits for the health-record projection.",
      stateLabel: "Future surface",
      path: "#records-placeholder",
      tone: "info",
      governedPlaceholder: true,
      sourceProjectionRefs: ["GovernedPlaceholderCard", "PatientRequestDownstreamProjection"],
    },
    {
      panelRef: "home_panel_unread_messages",
      kind: "unread_messages",
      label: "Unread messages",
      summary:
        "Message previews are represented as a placeholder until communications visibility is live.",
      stateLabel: "Future surface",
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

function groupedRequests(
  selectedFilterRef: PatientRequestBucket | "all",
): PatientRequestsIndexProjection["groups"] {
  const specs: readonly {
    readonly bucket: PatientRequestBucket;
    readonly label: string;
    readonly description: string;
  }[] = [
    {
      bucket: "needs_attention",
      label: "Needs attention",
      description: "Patient-owned actions appear first and remain one-at-a-time.",
    },
    {
      bucket: "in_progress",
      label: "In progress",
      description: "Current practice-owned or placeholder states without promotion.",
    },
    {
      bucket: "complete",
      label: "Complete",
      description: "Settled summaries stay readable but are not home actions.",
    },
  ];
  return specs.map((spec) => ({
    ...spec,
    requests: patientRequestSummaries215.filter(
      (request) =>
        request.bucket === spec.bucket &&
        (selectedFilterRef === "all" || request.bucket === selectedFilterRef),
    ),
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
    groups: groupedRequests(selectedFilterRef),
  };
}

function downstreamFor(
  request: PatientRequestSummaryProjection,
): readonly PatientRequestDownstreamProjection[] {
  const base = `/requests/${request.requestRef}`;
  const missingContextRef = "PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT";
  const missingRecordsRef = "PARALLEL_INTERFACE_GAP_CROSSCUTTING_RECORDS";
  const communicationsRef = "PatientCommunicationsTimelineProjection";

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
        summary: "Callback posture is visible as a governed placeholder, not hidden.",
        authoritativeState: "queued",
        awaitingParty: "practice",
        visibilityTier: "placeholder_only",
        placeholderPosture: "sibling_projection_missing",
        placeholderReasonRefs: [missingContextRef, "PatientCallbackStatusProjection"],
        nextSafeActionRef: "view_callback_status",
        routeRef: `${base}/callback`,
        childAnchorTupleHash: tupleHash("request_211_a:callback"),
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
        summary: "Health record context is partial until the record projection is present.",
        authoritativeState: "available",
        awaitingParty: "none",
        visibilityTier: "placeholder_only",
        placeholderPosture: "sibling_projection_missing",
        placeholderReasonRefs: [missingRecordsRef, "PatientRequestDownstreamProjection"],
        nextSafeActionRef: "view_results_update",
        routeRef: `${base}/records`,
        childAnchorTupleHash: tupleHash("request_211_a:records"),
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
        summary:
          "Message chronology is acknowledged from task 214 but not launched from this route.",
        authoritativeState: "preview_available",
        awaitingParty: "patient",
        visibilityTier: "placeholder_only",
        placeholderPosture: "sibling_projection_missing",
        placeholderReasonRefs: [communicationsRef, missingContextRef],
        nextSafeActionRef: "open_communications_thread",
        routeRef: `${base}/messages`,
        childAnchorTupleHash: tupleHash("request_211_a:communications"),
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
      summary:
        "No child route is live for this request, so the route keeps a governed placeholder.",
      authoritativeState: request.bucket === "complete" ? "settled" : "in_progress",
      awaitingParty: request.bucket === "complete" ? "none" : "practice",
      visibilityTier: "placeholder_only",
      placeholderPosture: "sibling_projection_missing",
      placeholderReasonRefs: [missingContextRef, "GovernedPlaceholderCard"],
      nextSafeActionRef: request.nextSafeActionRef,
      routeRef: `${base}/updates`,
      childAnchorTupleHash: tupleHash(`${request.requestRef}:updates`),
    },
  ];
}

function detailFor(
  requestRef: string,
  selectedFilterRef: PatientRequestBucket | "all",
  restoredBy: PatientRestoreMode,
): PatientRequestDetailProjection {
  const request = requestByRef.get(requestRef) ?? firstRequestSummary215();
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
        : `/requests/${request.requestRef}`,
    blockedReasonRef: null,
  };

  return {
    projectionName: "PatientRequestDetailProjection",
    detailProjectionRef: `patient_request_detail::${request.requestRef}`,
    requestRef: request.requestRef,
    requestLineageRef: request.requestLineageRef,
    title: request.displayLabel,
    statusRibbon: {
      label: request.statusText,
      tone: request.statusTone,
      freshnessLabel: request.updatedLabel,
      canonicalTruthRef: `canonical_request_truth::${request.requestRef}`,
    },
    patientSafeDetail:
      request.requestRef === "request_211_a"
        ? "The team is waiting for one patient-safe reply about photo timing. Clinical reasoning and staff-only notes stay outside this route."
        : request.patientSummary,
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
      receiptLabel:
        request.bucket === "complete"
          ? "Authoritative outcome settled"
          : "Same-lineage context preserved",
      latestMeaningfulUpdateLabel: request.latestMeaningfulUpdateAt,
      sourceProjectionRefs: [
        "PatientActionSettlementProjection",
        "PatientRequestReturnBundle",
        "PatientRequestLineageProjection",
      ],
    },
    trustSummaries: [
      "The route uses the 211 request projection family for rows, detail, lineage, action routing, and return bundles.",
      "Future child surfaces render as governed placeholders rather than empty gaps.",
      "The selected anchor and filter survive soft navigation, refresh replay, and browser back.",
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
    ],
  };
}

export function isPatientHomeRequestsDetailPath(pathname: string): boolean {
  return (
    pathname === "/home" ||
    pathname === "/home/quiet" ||
    pathname === "/requests" ||
    /^\/requests\/[^/]+$/.test(pathname)
  );
}

export function resolvePatientHomeRequestsDetailEntry(input: {
  readonly pathname: string;
  readonly search?: string;
  readonly selectedFilterRef?: PatientRequestBucket | "all";
  readonly restoredBy?: PatientRestoreMode;
  readonly restoredBundle?: PatientRequestReturnBundle | null;
}): PatientHomeRequestsDetailEntryProjection {
  const selectedFilterRef =
    input.selectedFilterRef ??
    input.restoredBundle?.selectedFilterRef ??
    (input.pathname === "/requests" ? "all" : "all");
  const restoredBy = input.restoredBy ?? "soft_navigation";
  const search = new URLSearchParams(input.search ?? "");
  const quietMode = input.pathname === "/home/quiet" || search.get("mode") === "quiet";
  const routeKey: PatientCaseworkRouteKey =
    input.pathname === "/home" || input.pathname === "/home/quiet"
      ? quietMode
        ? "quiet_home"
        : "home"
      : input.pathname === "/requests"
        ? "requests_index"
        : "request_detail";
  const detailMatch = input.pathname.match(/^\/requests\/([^/]+)$/);
  const selectedRequestRef =
    detailMatch?.[1] ??
    input.restoredBundle?.requestRef ??
    (routeKey === "requests_index" ? null : "request_211_a");
  const activeRouteRef =
    routeKey === "request_detail" && selectedRequestRef
      ? (`/requests/${selectedRequestRef}` as const)
      : routeKey === "requests_index"
        ? "/requests"
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
    pathname: input.pathname,
    visualMode: PATIENT_HOME_REQUESTS_DETAIL_VISUAL_MODE,
    home,
    requestsIndex,
    requestDetail,
    returnBundle,
  };
}
