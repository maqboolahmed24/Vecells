export const AUTHENTICATED_HOME_STATUS_TRACKER_TASK_ID = "par_196";
export const AUTHENTICATED_HOME_STATUS_TRACKER_VISUAL_MODE = "Quiet_Portal_Atlas";

export type AuthenticatedPortalRouteKey =
  | "home"
  | "quiet_home"
  | "requests_index"
  | "request_detail"
  | "request_detail_narrowed"
  | "reachability_blocker"
  | "session_expiring"
  | "session_expired";

export type PatientRequestGroup = "needs_attention" | "in_progress" | "complete";
export type PatientStatusTone = "attention" | "info" | "success" | "blocker" | "quiet";
export type PatientAudienceScope = "summary" | "request_row" | "request_detail" | "restricted";
export type PatientSpotlightReason =
  | "reply_needed"
  | "contact_route_blocks_current_action"
  | "session_expiring"
  | "quiet_threshold_not_met";

export interface PatientAudienceCoverageProjection {
  projectionName: "PatientAudienceCoverageProjection";
  audienceRef: "aud_patient_authenticated_self";
  coverageScope: PatientAudienceScope;
  allowedFields: readonly string[];
  suppressedFields: readonly string[];
  maxVisibleDetail: "summary_only" | "row_plus_summary" | "full_patient_safe_detail";
  disclosurePosture: "patient_safe_summary" | "same_patient_full_detail" | "identity_hold_narrowed";
}

export interface PatientIdentityHoldProjection {
  projectionName: "PatientIdentityHoldProjection";
  holdState: "clear" | "contact_route_blocked" | "identity_evidence_hold";
  blocksCurrentAction: boolean;
  patientSafeReason: string;
  allowedRecoveryAction: string;
}

export interface PatientActionRecoveryProjection {
  projectionName: "PatientActionRecoveryProjection";
  recoveryState: "available" | "armed" | "bounded_post_expiry" | "not_required";
  nextSafeAction: string;
  recoveryPath: string;
  postExpiryLimitMinutes: number;
  continuityKeyPreserved: boolean;
}

export interface PatientRequestReturnBundle {
  projectionName: "PatientRequestReturnBundle";
  selectedRequestId: string;
  selectedFilter: PatientRequestGroup | "all";
  selectedAnchorId: string;
  focusTestId: string;
  originPathname: "/portal/requests";
  restoredBy: "soft_navigation" | "refresh_replay" | "browser_back";
}

export interface PatientRequestSummaryProjection {
  projectionName: "PatientRequestSummaryProjection";
  requestId: string;
  title: string;
  group: PatientRequestGroup;
  statusLabel: string;
  statusTone: PatientStatusTone;
  canonicalTruthRef: string;
  patientSummary: string;
  updatedLabel: string;
  nextActionLabel: string;
  actionability: "primary" | "secondary" | "read_only" | "blocked";
  anchorId: string;
  audienceCoverage: PatientAudienceCoverageProjection;
  identityHold: PatientIdentityHoldProjection;
  actionRecovery: PatientActionRecoveryProjection;
}

export interface PatientSpotlightDecisionProjection {
  projectionName: "PatientSpotlightDecisionProjection";
  selectedRequestId: string | null;
  reason: PatientSpotlightReason;
  headline: string;
  body: string;
  primaryActionLabel: string;
  primaryActionPath: string;
  singleDominantAction: true;
  quietThresholdScore: number;
  selectedScore: number;
  contactPreferenceSecondaryUnlessBlocking: boolean;
  outrankedCandidateIds: readonly string[];
  sourceProjectionRefs: readonly string[];
}

export interface PatientPortalNavigationProjection {
  projectionName: "PatientPortalNavigationProjection";
  activeRouteKey: AuthenticatedPortalRouteKey;
  items: readonly {
    id: "home" | "requests" | "messages" | "account";
    label: string;
    path: string;
    badgeLabel: string | null;
    ariaCurrent: boolean;
  }[];
}

export interface PatientRequestsIndexProjection {
  projectionName: "PatientRequestsIndexProjection";
  selectedFilter: PatientRequestGroup | "all";
  selectedAnchorId: string;
  groups: readonly {
    group: PatientRequestGroup;
    label: string;
    description: string;
    requests: readonly PatientRequestSummaryProjection[];
  }[];
}

export interface PatientRequestDetailProjection {
  projectionName: "PatientRequestDetailProjection";
  requestId: string;
  title: string;
  statusRibbon: {
    label: string;
    tone: PatientStatusTone;
    freshnessLabel: string;
    canonicalTruthRef: string;
  };
  identityStrip: {
    label: string;
    maskedPatientRef: string;
    posture: string;
  };
  stateBraid: readonly {
    label: string;
    state: string;
    timestampLabel: string;
  }[];
  decisionDock: readonly {
    label: string;
    path: string;
    actionability: PatientRequestSummaryProjection["actionability"];
  }[];
  patientSafeDetail: string;
  ambientStateRibbon: string;
  audienceCoverage: PatientAudienceCoverageProjection;
  identityHold: PatientIdentityHoldProjection;
  returnBundle: PatientRequestReturnBundle;
}

export interface PatientHomeProjection {
  projectionName: "PatientHomeProjection";
  homeMode: "attention" | "quiet";
  patientLabel: string;
  maskedPatientRef: string;
  shellLayout: {
    topBandPx: 64;
    leftNavPx: 240;
    centerMinPx: 720;
    optionalRightPx: 320;
    maxWidthPx: 1440;
    horizontalPaddingPx: 32;
  };
  spotlightDecision: PatientSpotlightDecisionProjection;
  navigation: PatientPortalNavigationProjection;
  compactCards: readonly {
    id: "active_requests" | "callback_attention" | "account_details";
    label: string;
    body: string;
    path: string;
    tone: PatientStatusTone;
  }[];
  requestsIndex: PatientRequestsIndexProjection;
  sessionExpiry: {
    state: "stable" | "warning" | "expired";
    warningLabel: string;
    recoveryLabel: string;
    secondsRemaining: number;
  };
  audienceCoverage: PatientAudienceCoverageProjection;
  identityHold: PatientIdentityHoldProjection;
  actionRecovery: PatientActionRecoveryProjection;
}

export interface PatientPortalEntryProjection {
  projectionName: "PatientPortalEntryProjection";
  routeKey: AuthenticatedPortalRouteKey;
  pathname: string;
  visualMode: typeof AUTHENTICATED_HOME_STATUS_TRACKER_VISUAL_MODE;
  home: PatientHomeProjection;
  requestsIndex: PatientRequestsIndexProjection;
  requestDetail: PatientRequestDetailProjection | null;
  returnBundle: PatientRequestReturnBundle;
}

export const clearAudienceCoverage: PatientAudienceCoverageProjection = {
  projectionName: "PatientAudienceCoverageProjection",
  audienceRef: "aud_patient_authenticated_self",
  coverageScope: "request_detail",
  allowedFields: ["title", "status", "summary", "nextAction", "timeline", "decisionDock"],
  suppressedFields: ["staffInternalNotes", "triageScore", "rawIdentifiers"],
  maxVisibleDetail: "full_patient_safe_detail",
  disclosurePosture: "same_patient_full_detail",
};

export const rowAudienceCoverage: PatientAudienceCoverageProjection = {
  projectionName: "PatientAudienceCoverageProjection",
  audienceRef: "aud_patient_authenticated_self",
  coverageScope: "request_row",
  allowedFields: ["title", "status", "patientSummary", "updatedLabel", "nextAction"],
  suppressedFields: ["staffInternalNotes", "clinicalReasoning", "rawIdentifiers"],
  maxVisibleDetail: "row_plus_summary",
  disclosurePosture: "patient_safe_summary",
};

export const restrictedAudienceCoverage: PatientAudienceCoverageProjection = {
  projectionName: "PatientAudienceCoverageProjection",
  audienceRef: "aud_patient_authenticated_self",
  coverageScope: "restricted",
  allowedFields: ["title", "status", "safeSummary", "recoveryAction"],
  suppressedFields: [
    "messageBodies",
    "attachmentPreviews",
    "staffInternalNotes",
    "clinicalReasoning",
    "rawIdentifiers",
  ],
  maxVisibleDetail: "summary_only",
  disclosurePosture: "identity_hold_narrowed",
};

const clearHold: PatientIdentityHoldProjection = {
  projectionName: "PatientIdentityHoldProjection",
  holdState: "clear",
  blocksCurrentAction: false,
  patientSafeReason: "Identity and contact posture are clear for this patient-safe route.",
  allowedRecoveryAction: "Continue in the same authenticated shell.",
};

const contactBlockerHold: PatientIdentityHoldProjection = {
  projectionName: "PatientIdentityHoldProjection",
  holdState: "contact_route_blocked",
  blocksCurrentAction: true,
  patientSafeReason:
    "Your contact route must be repaired before the requested reply can safely move.",
  allowedRecoveryAction: "Repair contact route in the same shell",
};

const evidenceHold: PatientIdentityHoldProjection = {
  projectionName: "PatientIdentityHoldProjection",
  holdState: "identity_evidence_hold",
  blocksCurrentAction: true,
  patientSafeReason:
    "Some request detail is narrowed until identity evidence catches up with the route.",
  allowedRecoveryAction: "Use bounded recovery and keep the request summary visible.",
};

const noRecoveryRequired: PatientActionRecoveryProjection = {
  projectionName: "PatientActionRecoveryProjection",
  recoveryState: "not_required",
  nextSafeAction: "Continue from the current projection.",
  recoveryPath: "/portal/home",
  postExpiryLimitMinutes: 0,
  continuityKeyPreserved: true,
};

const contactRecovery: PatientActionRecoveryProjection = {
  projectionName: "PatientActionRecoveryProjection",
  recoveryState: "armed",
  nextSafeAction: "Repair the contact route, then resume the selected request anchor.",
  recoveryPath: "/portal/reachability-blocker",
  postExpiryLimitMinutes: 15,
  continuityKeyPreserved: true,
};

const postExpiryRecovery: PatientActionRecoveryProjection = {
  projectionName: "PatientActionRecoveryProjection",
  recoveryState: "bounded_post_expiry",
  nextSafeAction: "Sign in again and return to the last safe request anchor.",
  recoveryPath: "/portal/session-expired",
  postExpiryLimitMinutes: 10,
  continuityKeyPreserved: true,
};

export const patientRequestSummaries196: readonly PatientRequestSummaryProjection[] = [
  {
    projectionName: "PatientRequestSummaryProjection",
    requestId: "REQ-4219",
    title: "Dermatology photo timing",
    group: "needs_attention",
    statusLabel: "Needs your reply",
    statusTone: "attention",
    canonicalTruthRef: "request_truth::REQ-4219::reply_needed",
    patientSummary:
      "The team needs one daylight photo and the flare window before they can continue the review.",
    updatedLabel: "Updated 13 Apr, 08:16",
    nextActionLabel: "Add photo timing",
    actionability: "primary",
    anchorId: "anchor-REQ-4219",
    audienceCoverage: rowAudienceCoverage,
    identityHold: clearHold,
    actionRecovery: noRecoveryRequired,
  },
  {
    projectionName: "PatientRequestSummaryProjection",
    requestId: "REQ-3991",
    title: "Secure message contact route",
    group: "needs_attention",
    statusLabel: "Contact route blocks reply",
    statusTone: "blocker",
    canonicalTruthRef: "request_truth::REQ-3991::contact_blocked",
    patientSummary:
      "The request summary remains visible, but the reply path is fenced until your contact route is repaired.",
    updatedLabel: "Updated 13 Apr, 07:50",
    nextActionLabel: "Repair contact route",
    actionability: "blocked",
    anchorId: "anchor-REQ-3991",
    audienceCoverage: restrictedAudienceCoverage,
    identityHold: contactBlockerHold,
    actionRecovery: contactRecovery,
  },
  {
    projectionName: "PatientRequestSummaryProjection",
    requestId: "REQ-4140",
    title: "Medication dose question",
    group: "in_progress",
    statusLabel: "In review",
    statusTone: "info",
    canonicalTruthRef: "request_truth::REQ-4140::awaiting_review",
    patientSummary:
      "Your latest message is in review. There is no new action for you while the current dose summary remains visible.",
    updatedLabel: "Updated 13 Apr, 07:35",
    nextActionLabel: "Read current status",
    actionability: "secondary",
    anchorId: "anchor-REQ-4140",
    audienceCoverage: rowAudienceCoverage,
    identityHold: clearHold,
    actionRecovery: noRecoveryRequired,
  },
  {
    projectionName: "PatientRequestSummaryProjection",
    requestId: "REQ-4044",
    title: "Wound photo update",
    group: "complete",
    statusLabel: "Complete",
    statusTone: "success",
    canonicalTruthRef: "request_truth::REQ-4044::settled",
    patientSummary:
      "The wound photo update is settled and remains available as a patient-safe closed summary.",
    updatedLabel: "Closed 12 Apr, 16:28",
    nextActionLabel: "Review closed summary",
    actionability: "read_only",
    anchorId: "anchor-REQ-4044",
    audienceCoverage: rowAudienceCoverage,
    identityHold: clearHold,
    actionRecovery: noRecoveryRequired,
  },
];

const requestById = new Map(
  patientRequestSummaries196.map((request) => [request.requestId, request] as const),
);

export function makePatientRequestReturnBundle(
  requestId: string,
  selectedFilter: PatientRequestReturnBundle["selectedFilter"] = "all",
  restoredBy: PatientRequestReturnBundle["restoredBy"] = "soft_navigation",
): PatientRequestReturnBundle {
  const request = requestById.get(requestId) ?? patientRequestSummaries196[0];
  if (!request) {
    throw new Error("PATIENT_REQUEST_SUMMARY_196_MISSING");
  }
  return {
    projectionName: "PatientRequestReturnBundle",
    selectedRequestId: request.requestId,
    selectedFilter,
    selectedAnchorId: request.anchorId,
    focusTestId: `request-tracker-row-${request.requestId}`,
    originPathname: "/portal/requests",
    restoredBy,
  };
}

function groupRequests(
  selectedFilter: PatientRequestReturnBundle["selectedFilter"],
  selectedAnchorId: string,
): PatientRequestsIndexProjection {
  const groupSpecs: readonly {
    group: PatientRequestGroup;
    label: string;
    description: string;
  }[] = [
    {
      group: "needs_attention",
      label: "Needs attention",
      description: "Only requests with a patient-safe next step are promoted.",
    },
    {
      group: "in_progress",
      label: "In progress",
      description: "Current canonical truth without overclaiming completion.",
    },
    {
      group: "complete",
      label: "Complete",
      description: "Settled summaries remain readable, not promoted.",
    },
  ];

  return {
    projectionName: "PatientRequestsIndexProjection",
    selectedFilter,
    selectedAnchorId,
    groups: groupSpecs.map((spec) => ({
      ...spec,
      requests: patientRequestSummaries196.filter((request) => request.group === spec.group),
    })),
  };
}

function navigationFor(routeKey: AuthenticatedPortalRouteKey): PatientPortalNavigationProjection {
  const activeHome =
    routeKey === "home" ||
    routeKey === "quiet_home" ||
    routeKey === "reachability_blocker" ||
    routeKey === "session_expiring" ||
    routeKey === "session_expired";
  const activeRequests = routeKey === "requests_index" || routeKey.startsWith("request_detail");

  return {
    projectionName: "PatientPortalNavigationProjection",
    activeRouteKey: routeKey,
    items: [
      {
        id: "home",
        label: "Home",
        path: "/portal/home",
        badgeLabel: activeHome ? "Current" : null,
        ariaCurrent: activeHome,
      },
      {
        id: "requests",
        label: "Requests",
        path: "/portal/requests",
        badgeLabel: "2",
        ariaCurrent: activeRequests,
      },
      {
        id: "messages",
        label: "Messages",
        path: "/portal/messages",
        badgeLabel: null,
        ariaCurrent: false,
      },
      {
        id: "account",
        label: "Account",
        path: "/portal/account",
        badgeLabel: null,
        ariaCurrent: false,
      },
    ],
  };
}

function spotlightFor(
  routeKey: AuthenticatedPortalRouteKey,
  homeMode: PatientHomeProjection["homeMode"],
): PatientSpotlightDecisionProjection {
  if (routeKey === "reachability_blocker") {
    return {
      projectionName: "PatientSpotlightDecisionProjection",
      selectedRequestId: "REQ-3991",
      reason: "contact_route_blocks_current_action",
      headline: "Repair your contact route before replying",
      body: "This blocker is promoted only because it blocks the current request action. Other contact-preference copy stays secondary.",
      primaryActionLabel: "Repair contact route",
      primaryActionPath: "/portal/reachability-blocker",
      singleDominantAction: true,
      quietThresholdScore: 70,
      selectedScore: 96,
      contactPreferenceSecondaryUnlessBlocking: true,
      outrankedCandidateIds: ["REQ-4219", "REQ-4140"],
      sourceProjectionRefs: [
        "PatientSpotlightDecisionProjection",
        "PatientIdentityHoldProjection",
        "PatientActionRecoveryProjection",
      ],
    };
  }

  if (routeKey === "session_expiring" || routeKey === "session_expired") {
    return {
      projectionName: "PatientSpotlightDecisionProjection",
      selectedRequestId: "REQ-4219",
      reason: "session_expiring",
      headline: "Keep your request context before the session ends",
      body: "The same-shell recovery key preserves your selected request anchor without exposing extra detail after expiry.",
      primaryActionLabel: "Keep me signed in",
      primaryActionPath: "/portal/session-expiring",
      singleDominantAction: true,
      quietThresholdScore: 70,
      selectedScore: 88,
      contactPreferenceSecondaryUnlessBlocking: true,
      outrankedCandidateIds: ["REQ-3991", "REQ-4140"],
      sourceProjectionRefs: [
        "PatientSpotlightDecisionProjection",
        "PatientActionRecoveryProjection",
        "PatientRequestReturnBundle",
      ],
    };
  }

  if (homeMode === "quiet") {
    return {
      projectionName: "PatientSpotlightDecisionProjection",
      selectedRequestId: null,
      reason: "quiet_threshold_not_met",
      headline: "No action is needed right now",
      body: "The portal stays quiet because no request, callback, repair, or account blocker outranks the quiet threshold.",
      primaryActionLabel: "Review request summaries",
      primaryActionPath: "/portal/requests",
      singleDominantAction: true,
      quietThresholdScore: 70,
      selectedScore: 24,
      contactPreferenceSecondaryUnlessBlocking: true,
      outrankedCandidateIds: ["REQ-4140", "REQ-4044"],
      sourceProjectionRefs: [
        "PatientSpotlightDecisionProjection",
        "PatientHomeProjection",
        "PatientRequestsIndexProjection",
      ],
    };
  }

  return {
    projectionName: "PatientSpotlightDecisionProjection",
    selectedRequestId: "REQ-4219",
    reason: "reply_needed",
    headline: "One reply keeps your dermatology request moving",
    body: "The request spotlight promotes exactly one next action from canonical request truth. Supporting cards stay compact and secondary.",
    primaryActionLabel: "Add photo timing",
    primaryActionPath: "/portal/requests/REQ-4219",
    singleDominantAction: true,
    quietThresholdScore: 70,
    selectedScore: 91,
    contactPreferenceSecondaryUnlessBlocking: true,
    outrankedCandidateIds: ["REQ-3991", "REQ-4140", "REQ-4044"],
    sourceProjectionRefs: [
      "PatientSpotlightDecisionProjection",
      "PatientRequestsIndexProjection",
      "PatientRequestSummaryProjection",
    ],
  };
}

function sessionStateFor(
  routeKey: AuthenticatedPortalRouteKey,
): PatientHomeProjection["sessionExpiry"] {
  if (routeKey === "session_expired") {
    return {
      state: "expired",
      warningLabel: "Your session ended.",
      recoveryLabel: "Sign in again within 10 minutes to resume this request anchor.",
      secondsRemaining: 0,
    };
  }
  if (routeKey === "session_expiring") {
    return {
      state: "warning",
      warningLabel: "Your session will end in 2 minutes.",
      recoveryLabel: "Keep me signed in or continue with bounded recovery.",
      secondsRemaining: 120,
    };
  }
  return {
    state: "stable",
    warningLabel: "Session stable",
    recoveryLabel: "Same-shell continuity key is current.",
    secondsRemaining: 900,
  };
}

function homeProjectionFor(
  routeKey: AuthenticatedPortalRouteKey,
  homeMode: PatientHomeProjection["homeMode"],
  returnBundle: PatientRequestReturnBundle,
): PatientHomeProjection {
  const identityHold = routeKey === "reachability_blocker" ? contactBlockerHold : clearHold;
  const actionRecovery =
    routeKey === "session_expired" || routeKey === "session_expiring"
      ? postExpiryRecovery
      : routeKey === "reachability_blocker"
        ? contactRecovery
        : noRecoveryRequired;

  return {
    projectionName: "PatientHomeProjection",
    homeMode,
    patientLabel: "Samira",
    maskedPatientRef: "NHS 943 *** 7812",
    shellLayout: {
      topBandPx: 64,
      leftNavPx: 240,
      centerMinPx: 720,
      optionalRightPx: 320,
      maxWidthPx: 1440,
      horizontalPaddingPx: 32,
    },
    spotlightDecision: spotlightFor(routeKey, homeMode),
    navigation: navigationFor(routeKey),
    compactCards: [
      {
        id: "active_requests",
        label: "Active requests",
        body: "Two requests need a visible status lane; one has a reply action.",
        path: "/portal/requests",
        tone: "info",
      },
      {
        id: "callback_attention",
        label: "Messages and callbacks",
        body:
          routeKey === "reachability_blocker"
            ? "Contact repair is promoted because it blocks the current reply."
            : "No callback outranks the selected request action right now.",
        path: "/portal/reachability-blocker",
        tone: routeKey === "reachability_blocker" ? "blocker" : "quiet",
      },
      {
        id: "account_details",
        label: "Account details",
        body: "NHS login and Vecells contact preference rows stay separate.",
        path: "/portal/account",
        tone: "quiet",
      },
    ],
    requestsIndex: groupRequests(returnBundle.selectedFilter, returnBundle.selectedAnchorId),
    sessionExpiry: sessionStateFor(routeKey),
    audienceCoverage: homeMode === "quiet" ? rowAudienceCoverage : clearAudienceCoverage,
    identityHold,
    actionRecovery,
  };
}

function detailProjectionFor(
  requestId: string,
  narrowed: boolean,
  restoredBy: PatientRequestReturnBundle["restoredBy"] = "soft_navigation",
): PatientRequestDetailProjection {
  const request = requestById.get(requestId) ?? patientRequestSummaries196[0];
  if (!request) {
    throw new Error("PATIENT_REQUEST_DETAIL_196_MISSING");
  }
  const coverage = narrowed ? restrictedAudienceCoverage : clearAudienceCoverage;
  const identityHold =
    narrowed || request.identityHold.holdState !== "clear" ? evidenceHold : clearHold;
  const returnBundle = makePatientRequestReturnBundle(request.requestId, request.group, restoredBy);
  const detailText =
    coverage.maxVisibleDetail === "summary_only"
      ? "Only the safe summary is visible while the hold is active. Message bodies, attachments, and internal notes stay suppressed."
      : `${request.patientSummary} The detail keeps CasePulse identity, StateBraid timeline, DecisionDock actions, and AmbientStateRibbon freshness in the same shell.`;

  return {
    projectionName: "PatientRequestDetailProjection",
    requestId: request.requestId,
    title: request.title,
    statusRibbon: {
      label: request.statusLabel,
      tone: request.statusTone,
      freshnessLabel: request.updatedLabel,
      canonicalTruthRef: request.canonicalTruthRef,
    },
    identityStrip: {
      label: "CasePulse identity",
      maskedPatientRef: "NHS 943 *** 7812",
      posture: identityHold.holdState === "clear" ? "same patient verified" : "detail narrowed",
    },
    stateBraid: [
      {
        label: "Submitted",
        state: "Request accepted into patient lineage",
        timestampLabel: "10 Apr",
      },
      {
        label: "Reviewed",
        state:
          request.group === "needs_attention" ? "Patient action requested" : "Team review active",
        timestampLabel: "12 Apr",
      },
      {
        label: "Current truth",
        state: request.statusLabel,
        timestampLabel: request.updatedLabel,
      },
    ],
    decisionDock: [
      {
        label: request.nextActionLabel,
        path:
          request.actionability === "blocked" ? "/portal/reachability-blocker" : "/portal/requests",
        actionability: request.actionability,
      },
      {
        label: "Return to tracker",
        path: "/portal/requests",
        actionability: "secondary",
      },
    ],
    patientSafeDetail: detailText,
    ambientStateRibbon:
      coverage.maxVisibleDetail === "summary_only"
        ? "AmbientStateRibbon: narrowed until audience and hold posture clear."
        : "AmbientStateRibbon: fresh from canonical request truth.",
    audienceCoverage: coverage,
    identityHold,
    returnBundle,
  };
}

function routeKeyForPath(pathname: string): AuthenticatedPortalRouteKey {
  if (pathname === "/portal/quiet") {
    return "quiet_home";
  }
  if (pathname === "/portal/requests") {
    return "requests_index";
  }
  if (pathname === "/portal/reachability-blocker") {
    return "reachability_blocker";
  }
  if (pathname === "/portal/session-expiring") {
    return "session_expiring";
  }
  if (pathname === "/portal/session-expired") {
    return "session_expired";
  }
  if (pathname.endsWith("/narrowed")) {
    return "request_detail_narrowed";
  }
  if (pathname.startsWith("/portal/requests/")) {
    return "request_detail";
  }
  return "home";
}

function requestIdFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  return parts[2] ?? "REQ-4219";
}

export function isAuthenticatedHomeStatusTrackerPath(pathname: string): boolean {
  return pathname === "/portal" || pathname.startsWith("/portal/");
}

export function resolveAuthenticatedPortalEntry(
  rawPathname: string,
  restoredBy: PatientRequestReturnBundle["restoredBy"] = "soft_navigation",
): PatientPortalEntryProjection {
  const pathname = rawPathname === "/portal" ? "/portal/home" : rawPathname;
  const routeKey = routeKeyForPath(pathname);
  const homeMode: PatientHomeProjection["homeMode"] =
    routeKey === "quiet_home" ? "quiet" : "attention";
  const requestId = routeKey.startsWith("request_detail")
    ? requestIdFromPath(pathname)
    : "REQ-4219";
  const returnBundle = makePatientRequestReturnBundle(requestId, "all", restoredBy);
  const requestDetail =
    routeKey === "request_detail" || routeKey === "request_detail_narrowed"
      ? detailProjectionFor(requestId, routeKey === "request_detail_narrowed", restoredBy)
      : null;
  const home = homeProjectionFor(routeKey, homeMode, requestDetail?.returnBundle ?? returnBundle);

  return {
    projectionName: "PatientPortalEntryProjection",
    routeKey,
    pathname,
    visualMode: AUTHENTICATED_HOME_STATUS_TRACKER_VISUAL_MODE,
    home,
    requestsIndex: home.requestsIndex,
    requestDetail,
    returnBundle: requestDetail?.returnBundle ?? returnBundle,
  };
}
