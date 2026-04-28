export const CLAIM_RESUME_IDENTITY_HOLD_TASK_ID = "par_197";
export const CLAIM_RESUME_IDENTITY_HOLD_VISUAL_MODE = "Continuity_Bridge_Atlas";

export type ClaimResumePostureKey =
  | "claim_pending"
  | "claim_confirmed"
  | "read_only"
  | "recover_only"
  | "identity_hold"
  | "rebind_required"
  | "stale_link_mapped"
  | "stale_grant_mapped"
  | "support_recovery_required"
  | "wrong_patient_freeze"
  | "promoted_draft_mapped";

export type ClaimResumeReasonCode =
  | "access_grant_redemption_pending"
  | "access_grant_settled_same_lineage"
  | "scope_envelope_narrowed_read_only"
  | "identity_evidence_hold_active"
  | "subject_rebind_required"
  | "stale_link_already_settled"
  | "duplicate_redemption_mapped"
  | "support_recovery_required"
  | "wrong_patient_freeze_active"
  | "promoted_draft_already_request";

export type ClaimResumeAccent = "pending" | "read_only" | "support" | "hold" | "settled";

export interface PostAuthReturnIntent {
  projectionName: "PostAuthReturnIntent";
  routeFamily: "rf_patient_claim_resume";
  returnTarget: "/portal/claim" | "/portal/requests";
  intentState: "fresh" | "stale_recoverable" | "settled" | "blocked";
  preservesSameLineage: boolean;
}

export interface RouteIntentBinding {
  projectionName: "RouteIntentBinding";
  routeFamily: "rf_patient_claim_resume";
  routeIntent: "claim_request" | "resume_request" | "read_only_return" | "identity_repair";
  validity: "valid" | "stale" | "blocked";
  routeFenceState: "open" | "read_only" | "recovery_only" | "blocked";
}

export interface AccessGrantScopeEnvelope {
  projectionName: "AccessGrantScopeEnvelope";
  scopeState: "claimable" | "read_only" | "summary_only" | "rebind_required";
  allowedAudienceFields: readonly string[];
  suppressedAudienceFields: readonly string[];
  writableAllowed: boolean;
}

export interface AccessGrantRedemptionRecord {
  projectionName: "AccessGrantRedemptionRecord";
  redemptionState: "pending" | "settled" | "duplicate" | "stale" | "superseded";
  settledOutcomeRef: string;
  exactOncePreserved: boolean;
}

export interface AccessGrantSupersessionRecord {
  projectionName: "AccessGrantSupersessionRecord";
  supersessionState: "none" | "replaced_by_request" | "replaced_by_recovery" | "blocked_subject";
  currentSafeDestination: string;
  secondPathForbidden: boolean;
}

export interface PatientAudienceCoverageProjection {
  projectionName: "PatientAudienceCoverageProjection";
  maxVisibleDetail: "summary_only" | "read_only_summary" | "claim_context";
  allowedFields: readonly string[];
  suppressedFields: readonly string[];
  phiBearingDetailAllowed: boolean;
}

export interface PatientIdentityHoldProjection {
  projectionName: "PatientIdentityHoldProjection";
  holdState: "clear" | "identity_hold" | "rebind_required" | "wrong_patient_freeze";
  blocksWritableAction: boolean;
  patientSafeReason: string;
  releaseActionLabel: string;
}

export interface PatientActionRecoveryProjection {
  projectionName: "PatientActionRecoveryProjection";
  recoveryState: "not_required" | "claim_pending" | "recover_only" | "support_required";
  nextSafeAction: string;
  recoveryPath: string;
  sameShellRequired: boolean;
}

export interface PatientRequestReturnBundle {
  projectionName: "PatientRequestReturnBundle";
  selectedRequestId: string;
  selectedAnchorId: string;
  returnTarget: "/portal/requests";
  lastSafeSummary: string;
  restoredBy: "soft_navigation" | "refresh_replay" | "duplicate_replay" | "cross_device_replay";
}

export interface PreservedContinuityContext {
  label: string;
  value: string;
  visibility: "full_safe" | "masked" | "summary_only";
}

export interface ClaimResumePostureProjection {
  projectionName: "ClaimResumePostureProjection";
  postureKey: ClaimResumePostureKey;
  reasonCode: ClaimResumeReasonCode;
  accent: ClaimResumeAccent;
  title: string;
  explanation: string;
  preservedContext: readonly PreservedContinuityContext[];
  dominantActionLabel: string;
  dominantActionPath: string;
  secondaryActionLabel: string | null;
  secondaryActionPath: string | null;
  showProgress: boolean;
  writableAllowed: boolean;
  patientCopyDisallowsJargon: true;
  postAuthReturnIntent: PostAuthReturnIntent;
  routeIntentBinding: RouteIntentBinding;
  accessGrantScopeEnvelope: AccessGrantScopeEnvelope;
  accessGrantRedemptionRecord: AccessGrantRedemptionRecord;
  accessGrantSupersessionRecord: AccessGrantSupersessionRecord;
  patientActionRecoveryProjection: PatientActionRecoveryProjection;
  patientIdentityHoldProjection: PatientIdentityHoldProjection;
  patientAudienceCoverageProjection: PatientAudienceCoverageProjection;
  patientRequestReturnBundle: PatientRequestReturnBundle;
}

const safeRequestReturnBundle: PatientRequestReturnBundle = {
  projectionName: "PatientRequestReturnBundle",
  selectedRequestId: "REQ-4219",
  selectedAnchorId: "anchor-REQ-4219",
  returnTarget: "/portal/requests",
  lastSafeSummary: "A request from this week is still linked to your account.",
  restoredBy: "soft_navigation",
};

const claimContext: readonly PreservedContinuityContext[] = [
  {
    label: "What we kept in place",
    value: "Your return path, request anchor, and last safe summary are still held in this shell.",
    visibility: "summary_only",
  },
  {
    label: "Request context",
    value: "Request from this week",
    visibility: "summary_only",
  },
  {
    label: "Account context",
    value: "Signed-in patient, masked NHS reference",
    visibility: "masked",
  },
];

const readableContext: readonly PreservedContinuityContext[] = [
  ...claimContext,
  {
    label: "Viewable now",
    value: "Status, safe summary, and return route. Editing waits for a current claim.",
    visibility: "full_safe",
  },
];

const holdContext: readonly PreservedContinuityContext[] = [
  {
    label: "What we kept in place",
    value: "The request anchor and last safe summary are preserved while identity is checked.",
    visibility: "summary_only",
  },
  {
    label: "Hidden for now",
    value: "Message bodies, attachment previews, and detailed request narrative.",
    visibility: "summary_only",
  },
];

function baseIntent(intentState: PostAuthReturnIntent["intentState"]): PostAuthReturnIntent {
  return {
    projectionName: "PostAuthReturnIntent",
    routeFamily: "rf_patient_claim_resume",
    returnTarget: "/portal/claim",
    intentState,
    preservesSameLineage: true,
  };
}

function routeBinding(
  routeIntent: RouteIntentBinding["routeIntent"],
  routeFenceState: RouteIntentBinding["routeFenceState"],
): RouteIntentBinding {
  return {
    projectionName: "RouteIntentBinding",
    routeFamily: "rf_patient_claim_resume",
    routeIntent,
    validity: routeFenceState === "open" || routeFenceState === "read_only" ? "valid" : "blocked",
    routeFenceState,
  };
}

function scopeEnvelope(
  scopeState: AccessGrantScopeEnvelope["scopeState"],
  writableAllowed: boolean,
): AccessGrantScopeEnvelope {
  return {
    projectionName: "AccessGrantScopeEnvelope",
    scopeState,
    allowedAudienceFields: writableAllowed
      ? ["status", "lastSafeSummary", "nextSafeAction", "returnTarget"]
      : ["status", "lastSafeSummary", "returnTarget"],
    suppressedAudienceFields:
      scopeState === "summary_only" || scopeState === "rebind_required"
        ? ["messageBodies", "attachmentPreviews", "requestNarrative", "rawIdentifiers"]
        : ["rawIdentifiers", "internalReasonPayloads"],
    writableAllowed,
  };
}

function audienceCoverage(
  maxVisibleDetail: PatientAudienceCoverageProjection["maxVisibleDetail"],
  phiBearingDetailAllowed: boolean,
): PatientAudienceCoverageProjection {
  return {
    projectionName: "PatientAudienceCoverageProjection",
    maxVisibleDetail,
    allowedFields: phiBearingDetailAllowed
      ? ["safeSummary", "status", "returnTarget", "nextAction"]
      : ["safeSummary", "returnTarget", "nextAction"],
    suppressedFields: phiBearingDetailAllowed
      ? ["rawGrantIds", "subjectHashes", "internalReasonPayloads"]
      : [
          "rawGrantIds",
          "subjectHashes",
          "internalReasonPayloads",
          "messageBodies",
          "attachmentPreviews",
          "requestNarrative",
        ],
    phiBearingDetailAllowed,
  };
}

function identityHold(
  holdState: PatientIdentityHoldProjection["holdState"],
): PatientIdentityHoldProjection {
  const holdCopy = {
    clear: {
      reason: "The current claim and signed-in patient still match this request.",
      action: "Continue",
      blocks: false,
    },
    identity_hold: {
      reason: "Some details are paused while we make sure this request belongs with this account.",
      action: "Continue identity check",
      blocks: true,
    },
    rebind_required: {
      reason: "This request needs to be safely reconnected before details or edits can return.",
      action: "Reconnect request",
      blocks: true,
    },
    wrong_patient_freeze: {
      reason: "We have paused this route because the account and request may not match.",
      action: "Get help with this request",
      blocks: true,
    },
  } satisfies Record<
    PatientIdentityHoldProjection["holdState"],
    { reason: string; action: string; blocks: boolean }
  >;
  const copy = holdCopy[holdState];
  return {
    projectionName: "PatientIdentityHoldProjection",
    holdState,
    blocksWritableAction: copy.blocks,
    patientSafeReason: copy.reason,
    releaseActionLabel: copy.action,
  };
}

function recovery(
  recoveryState: PatientActionRecoveryProjection["recoveryState"],
  nextSafeAction: string,
  recoveryPath: string,
): PatientActionRecoveryProjection {
  return {
    projectionName: "PatientActionRecoveryProjection",
    recoveryState,
    nextSafeAction,
    recoveryPath,
    sameShellRequired: true,
  };
}

function redemption(
  redemptionState: AccessGrantRedemptionRecord["redemptionState"],
  settledOutcomeRef: string,
): AccessGrantRedemptionRecord {
  return {
    projectionName: "AccessGrantRedemptionRecord",
    redemptionState,
    settledOutcomeRef,
    exactOncePreserved: true,
  };
}

function supersession(
  supersessionState: AccessGrantSupersessionRecord["supersessionState"],
  currentSafeDestination: string,
): AccessGrantSupersessionRecord {
  return {
    projectionName: "AccessGrantSupersessionRecord",
    supersessionState,
    currentSafeDestination,
    secondPathForbidden: true,
  };
}

export const CLAIM_RESUME_POSTURE_FIXTURES: readonly ClaimResumePostureProjection[] = [
  {
    projectionName: "ClaimResumePostureProjection",
    postureKey: "claim_pending",
    reasonCode: "access_grant_redemption_pending",
    accent: "pending",
    title: "We are attaching your request safely",
    explanation:
      "Sign-in worked, and the request is being connected before any writable detail appears.",
    preservedContext: claimContext,
    dominantActionLabel: "Stay on this page",
    dominantActionPath: "/portal/claim/pending",
    secondaryActionLabel: "View requests read-only",
    secondaryActionPath: "/portal/claim/read-only",
    showProgress: true,
    writableAllowed: false,
    patientCopyDisallowsJargon: true,
    postAuthReturnIntent: baseIntent("fresh"),
    routeIntentBinding: routeBinding("claim_request", "open"),
    accessGrantScopeEnvelope: scopeEnvelope("claimable", false),
    accessGrantRedemptionRecord: redemption("pending", "claim_result::REQ-4219::pending"),
    accessGrantSupersessionRecord: supersession("none", "/portal/claim/pending"),
    patientActionRecoveryProjection: recovery(
      "claim_pending",
      "Wait for safe attachment",
      "/portal/claim/pending",
    ),
    patientIdentityHoldProjection: identityHold("clear"),
    patientAudienceCoverageProjection: audienceCoverage("claim_context", false),
    patientRequestReturnBundle: safeRequestReturnBundle,
  },
  {
    projectionName: "ClaimResumePostureProjection",
    postureKey: "claim_confirmed",
    reasonCode: "access_grant_settled_same_lineage",
    accent: "settled",
    title: "Your request is connected",
    explanation:
      "You are back in the same request lineage, with the current safe summary and return target preserved.",
    preservedContext: readableContext,
    dominantActionLabel: "Open request status",
    dominantActionPath: "/portal/requests",
    secondaryActionLabel: null,
    secondaryActionPath: null,
    showProgress: false,
    writableAllowed: true,
    patientCopyDisallowsJargon: true,
    postAuthReturnIntent: baseIntent("settled"),
    routeIntentBinding: routeBinding("resume_request", "open"),
    accessGrantScopeEnvelope: scopeEnvelope("claimable", true),
    accessGrantRedemptionRecord: redemption("settled", "claim_result::REQ-4219::settled"),
    accessGrantSupersessionRecord: supersession("none", "/portal/requests"),
    patientActionRecoveryProjection: recovery(
      "not_required",
      "Open request status",
      "/portal/requests",
    ),
    patientIdentityHoldProjection: identityHold("clear"),
    patientAudienceCoverageProjection: audienceCoverage("claim_context", true),
    patientRequestReturnBundle: safeRequestReturnBundle,
  },
  {
    projectionName: "ClaimResumePostureProjection",
    postureKey: "read_only",
    reasonCode: "scope_envelope_narrowed_read_only",
    accent: "read_only",
    title: "You can view this request read-only",
    explanation:
      "This is the same request lineage, but editing waits until the current claim is refreshed.",
    preservedContext: readableContext,
    dominantActionLabel: "View safe summary",
    dominantActionPath: "/portal/requests",
    secondaryActionLabel: "Refresh claim",
    secondaryActionPath: "/portal/claim/pending",
    showProgress: false,
    writableAllowed: false,
    patientCopyDisallowsJargon: true,
    postAuthReturnIntent: baseIntent("stale_recoverable"),
    routeIntentBinding: routeBinding("read_only_return", "read_only"),
    accessGrantScopeEnvelope: scopeEnvelope("read_only", false),
    accessGrantRedemptionRecord: redemption("settled", "claim_result::REQ-4219::read_only"),
    accessGrantSupersessionRecord: supersession("none", "/portal/claim/read-only"),
    patientActionRecoveryProjection: recovery(
      "not_required",
      "View safe summary",
      "/portal/requests",
    ),
    patientIdentityHoldProjection: identityHold("clear"),
    patientAudienceCoverageProjection: audienceCoverage("read_only_summary", true),
    patientRequestReturnBundle: safeRequestReturnBundle,
  },
  {
    projectionName: "ClaimResumePostureProjection",
    postureKey: "recover_only",
    reasonCode: "stale_link_already_settled",
    accent: "support",
    title: "This link now opens recovery only",
    explanation:
      "The old path is no longer live, but we kept the safe request context and the next step.",
    preservedContext: claimContext,
    dominantActionLabel: "Continue recovery",
    dominantActionPath: "/portal/claim/recover-only",
    secondaryActionLabel: "View read-only summary",
    secondaryActionPath: "/portal/claim/read-only",
    showProgress: false,
    writableAllowed: false,
    patientCopyDisallowsJargon: true,
    postAuthReturnIntent: baseIntent("stale_recoverable"),
    routeIntentBinding: routeBinding("resume_request", "recovery_only"),
    accessGrantScopeEnvelope: scopeEnvelope("summary_only", false),
    accessGrantRedemptionRecord: redemption("stale", "claim_result::REQ-4219::recovery"),
    accessGrantSupersessionRecord: supersession(
      "replaced_by_recovery",
      "/portal/claim/recover-only",
    ),
    patientActionRecoveryProjection: recovery(
      "recover_only",
      "Continue same-shell recovery",
      "/portal/claim/recover-only",
    ),
    patientIdentityHoldProjection: identityHold("clear"),
    patientAudienceCoverageProjection: audienceCoverage("summary_only", false),
    patientRequestReturnBundle: safeRequestReturnBundle,
  },
  {
    projectionName: "ClaimResumePostureProjection",
    postureKey: "identity_hold",
    reasonCode: "identity_evidence_hold_active",
    accent: "hold",
    title: "We need to check this request before showing details",
    explanation:
      "Your place is held, but detailed content is hidden until the identity check is safe.",
    preservedContext: holdContext,
    dominantActionLabel: "Continue identity check",
    dominantActionPath: "/portal/claim/identity-hold",
    secondaryActionLabel: "View what is still kept",
    secondaryActionPath: "/portal/claim/read-only",
    showProgress: false,
    writableAllowed: false,
    patientCopyDisallowsJargon: true,
    postAuthReturnIntent: baseIntent("blocked"),
    routeIntentBinding: routeBinding("identity_repair", "blocked"),
    accessGrantScopeEnvelope: scopeEnvelope("summary_only", false),
    accessGrantRedemptionRecord: redemption("settled", "claim_result::REQ-4219::identity_hold"),
    accessGrantSupersessionRecord: supersession("blocked_subject", "/portal/claim/identity-hold"),
    patientActionRecoveryProjection: recovery(
      "support_required",
      "Continue identity check",
      "/portal/claim/identity-hold",
    ),
    patientIdentityHoldProjection: identityHold("identity_hold"),
    patientAudienceCoverageProjection: audienceCoverage("summary_only", false),
    patientRequestReturnBundle: safeRequestReturnBundle,
  },
  {
    projectionName: "ClaimResumePostureProjection",
    postureKey: "rebind_required",
    reasonCode: "subject_rebind_required",
    accent: "hold",
    title: "Reconnect this request before continuing",
    explanation:
      "We kept a safe summary, but the request needs to be reconnected before details or edits return.",
    preservedContext: holdContext,
    dominantActionLabel: "Reconnect request",
    dominantActionPath: "/portal/claim/rebind-required",
    secondaryActionLabel: "Get support",
    secondaryActionPath: "/portal/claim/support-recovery",
    showProgress: false,
    writableAllowed: false,
    patientCopyDisallowsJargon: true,
    postAuthReturnIntent: baseIntent("blocked"),
    routeIntentBinding: routeBinding("identity_repair", "blocked"),
    accessGrantScopeEnvelope: scopeEnvelope("rebind_required", false),
    accessGrantRedemptionRecord: redemption("settled", "claim_result::REQ-4219::rebind_required"),
    accessGrantSupersessionRecord: supersession("blocked_subject", "/portal/claim/rebind-required"),
    patientActionRecoveryProjection: recovery(
      "support_required",
      "Reconnect request",
      "/portal/claim/rebind-required",
    ),
    patientIdentityHoldProjection: identityHold("rebind_required"),
    patientAudienceCoverageProjection: audienceCoverage("summary_only", false),
    patientRequestReturnBundle: safeRequestReturnBundle,
  },
  {
    projectionName: "ClaimResumePostureProjection",
    postureKey: "stale_link_mapped",
    reasonCode: "stale_link_already_settled",
    accent: "support",
    title: "That old link now points to the current result",
    explanation:
      "The link has already been used or replaced, so we mapped it to the settled safe destination.",
    preservedContext: claimContext,
    dominantActionLabel: "Go to current result",
    dominantActionPath: "/portal/requests",
    secondaryActionLabel: null,
    secondaryActionPath: null,
    showProgress: false,
    writableAllowed: false,
    patientCopyDisallowsJargon: true,
    postAuthReturnIntent: baseIntent("settled"),
    routeIntentBinding: routeBinding("resume_request", "read_only"),
    accessGrantScopeEnvelope: scopeEnvelope("summary_only", false),
    accessGrantRedemptionRecord: redemption("stale", "claim_result::REQ-4219::settled"),
    accessGrantSupersessionRecord: supersession("replaced_by_request", "/portal/requests"),
    patientActionRecoveryProjection: recovery(
      "not_required",
      "Go to current result",
      "/portal/requests",
    ),
    patientIdentityHoldProjection: identityHold("clear"),
    patientAudienceCoverageProjection: audienceCoverage("summary_only", false),
    patientRequestReturnBundle: safeRequestReturnBundle,
  },
  {
    projectionName: "ClaimResumePostureProjection",
    postureKey: "stale_grant_mapped",
    reasonCode: "duplicate_redemption_mapped",
    accent: "support",
    title: "This request was already claimed",
    explanation:
      "A repeated or cross-device use returns to the settled result instead of starting a second claim.",
    preservedContext: claimContext,
    dominantActionLabel: "Open settled result",
    dominantActionPath: "/portal/requests",
    secondaryActionLabel: null,
    secondaryActionPath: null,
    showProgress: false,
    writableAllowed: false,
    patientCopyDisallowsJargon: true,
    postAuthReturnIntent: baseIntent("settled"),
    routeIntentBinding: routeBinding("resume_request", "read_only"),
    accessGrantScopeEnvelope: scopeEnvelope("summary_only", false),
    accessGrantRedemptionRecord: redemption("duplicate", "claim_result::REQ-4219::settled"),
    accessGrantSupersessionRecord: supersession("replaced_by_request", "/portal/requests"),
    patientActionRecoveryProjection: recovery(
      "not_required",
      "Open settled result",
      "/portal/requests",
    ),
    patientIdentityHoldProjection: identityHold("clear"),
    patientAudienceCoverageProjection: audienceCoverage("summary_only", false),
    patientRequestReturnBundle: safeRequestReturnBundle,
  },
  {
    projectionName: "ClaimResumePostureProjection",
    postureKey: "support_recovery_required",
    reasonCode: "support_recovery_required",
    accent: "support",
    title: "Support can help recover this request",
    explanation:
      "The shell keeps the safe context while the next step moves through the governed support route.",
    preservedContext: holdContext,
    dominantActionLabel: "Contact support",
    dominantActionPath: "/portal/claim/support-recovery",
    secondaryActionLabel: "Return to home",
    secondaryActionPath: "/portal/home",
    showProgress: false,
    writableAllowed: false,
    patientCopyDisallowsJargon: true,
    postAuthReturnIntent: baseIntent("blocked"),
    routeIntentBinding: routeBinding("identity_repair", "recovery_only"),
    accessGrantScopeEnvelope: scopeEnvelope("summary_only", false),
    accessGrantRedemptionRecord: redemption(
      "superseded",
      "claim_result::REQ-4219::support_recovery",
    ),
    accessGrantSupersessionRecord: supersession(
      "replaced_by_recovery",
      "/portal/claim/support-recovery",
    ),
    patientActionRecoveryProjection: recovery(
      "support_required",
      "Contact support",
      "/portal/claim/support-recovery",
    ),
    patientIdentityHoldProjection: identityHold("identity_hold"),
    patientAudienceCoverageProjection: audienceCoverage("summary_only", false),
    patientRequestReturnBundle: safeRequestReturnBundle,
  },
  {
    projectionName: "ClaimResumePostureProjection",
    postureKey: "wrong_patient_freeze",
    reasonCode: "wrong_patient_freeze_active",
    accent: "hold",
    title: "This request is paused for safety",
    explanation:
      "The request may not match this account, so detailed content and actions stay hidden.",
    preservedContext: holdContext,
    dominantActionLabel: "Get help with this request",
    dominantActionPath: "/portal/claim/support-recovery",
    secondaryActionLabel: null,
    secondaryActionPath: null,
    showProgress: false,
    writableAllowed: false,
    patientCopyDisallowsJargon: true,
    postAuthReturnIntent: baseIntent("blocked"),
    routeIntentBinding: routeBinding("identity_repair", "blocked"),
    accessGrantScopeEnvelope: scopeEnvelope("summary_only", false),
    accessGrantRedemptionRecord: redemption(
      "settled",
      "claim_result::REQ-4219::wrong_patient_freeze",
    ),
    accessGrantSupersessionRecord: supersession(
      "blocked_subject",
      "/portal/claim/wrong-patient-freeze",
    ),
    patientActionRecoveryProjection: recovery(
      "support_required",
      "Get help with this request",
      "/portal/claim/support-recovery",
    ),
    patientIdentityHoldProjection: identityHold("wrong_patient_freeze"),
    patientAudienceCoverageProjection: audienceCoverage("summary_only", false),
    patientRequestReturnBundle: safeRequestReturnBundle,
  },
  {
    projectionName: "ClaimResumePostureProjection",
    postureKey: "promoted_draft_mapped",
    reasonCode: "promoted_draft_already_request",
    accent: "settled",
    title: "This draft is now a request",
    explanation: "The old draft link opens the current request truth instead of reopening editing.",
    preservedContext: claimContext,
    dominantActionLabel: "Open request status",
    dominantActionPath: "/portal/requests",
    secondaryActionLabel: null,
    secondaryActionPath: null,
    showProgress: false,
    writableAllowed: false,
    patientCopyDisallowsJargon: true,
    postAuthReturnIntent: baseIntent("settled"),
    routeIntentBinding: routeBinding("resume_request", "read_only"),
    accessGrantScopeEnvelope: scopeEnvelope("summary_only", false),
    accessGrantRedemptionRecord: redemption("settled", "claim_result::REQ-4219::promoted_draft"),
    accessGrantSupersessionRecord: supersession("replaced_by_request", "/portal/requests"),
    patientActionRecoveryProjection: recovery(
      "not_required",
      "Open request status",
      "/portal/requests",
    ),
    patientIdentityHoldProjection: identityHold("clear"),
    patientAudienceCoverageProjection: audienceCoverage("summary_only", false),
    patientRequestReturnBundle: safeRequestReturnBundle,
  },
];

const postureByKey = new Map(
  CLAIM_RESUME_POSTURE_FIXTURES.map((posture) => [posture.postureKey, posture] as const),
);

export interface ClaimResumePostureResolverInput {
  routeFamily: "rf_patient_claim_resume";
  pathname: string;
  postAuthReturnIntent: PostAuthReturnIntent;
  routeIntentBinding: RouteIntentBinding;
  sessionPosture: "authenticated" | "rotating" | "expired";
  accessGrantScopeEnvelope: AccessGrantScopeEnvelope;
  accessGrantRedemptionRecord: AccessGrantRedemptionRecord;
  accessGrantSupersessionRecord: AccessGrantSupersessionRecord;
  patientActionRecoveryProjection: PatientActionRecoveryProjection;
  patientIdentityHoldProjection: PatientIdentityHoldProjection;
  patientAudienceCoverageProjection: PatientAudienceCoverageProjection;
  continuityEvidence: "current" | "stale_recoverable" | "blocked";
}

export interface ClaimResumeRouteProjection {
  projectionName: "ClaimResumeRouteProjection";
  visualMode: typeof CLAIM_RESUME_IDENTITY_HOLD_VISUAL_MODE;
  pathname: string;
  resolverInput: ClaimResumePostureResolverInput;
  posture: ClaimResumePostureProjection;
}

function postureKeyFromPathname(pathname: string): ClaimResumePostureKey {
  const normalized = pathname.replace(/\/$/, "");
  if (normalized.endsWith("/confirmed")) {
    return "claim_confirmed";
  }
  if (normalized.endsWith("/read-only")) {
    return "read_only";
  }
  if (normalized.endsWith("/recover-only")) {
    return "recover_only";
  }
  if (normalized.endsWith("/identity-hold")) {
    return "identity_hold";
  }
  if (normalized.endsWith("/rebind-required")) {
    return "rebind_required";
  }
  if (normalized.endsWith("/stale-link")) {
    return "stale_link_mapped";
  }
  if (normalized.endsWith("/stale-grant")) {
    return "stale_grant_mapped";
  }
  if (normalized.endsWith("/support-recovery")) {
    return "support_recovery_required";
  }
  if (normalized.endsWith("/wrong-patient-freeze")) {
    return "wrong_patient_freeze";
  }
  if (normalized.endsWith("/promoted-draft")) {
    return "promoted_draft_mapped";
  }
  return "claim_pending";
}

export function isClaimResumeIdentityHoldPath(pathname: string): boolean {
  return pathname === "/portal/claim" || pathname.startsWith("/portal/claim/");
}

export function ClaimResumePostureResolver(pathname: string): ClaimResumeRouteProjection {
  const postureKey = postureKeyFromPathname(pathname);
  const posture = postureByKey.get(postureKey) ?? CLAIM_RESUME_POSTURE_FIXTURES[0];
  if (!posture) {
    throw new Error("CLAIM_RESUME_POSTURE_FIXTURES_EMPTY");
  }
  const continuityEvidence =
    posture.routeIntentBinding.routeFenceState === "blocked"
      ? "blocked"
      : posture.postAuthReturnIntent.intentState === "stale_recoverable"
        ? "stale_recoverable"
        : "current";

  return {
    projectionName: "ClaimResumeRouteProjection",
    visualMode: CLAIM_RESUME_IDENTITY_HOLD_VISUAL_MODE,
    pathname: pathname === "/portal/claim" ? "/portal/claim/pending" : pathname,
    resolverInput: {
      routeFamily: "rf_patient_claim_resume",
      pathname,
      postAuthReturnIntent: posture.postAuthReturnIntent,
      routeIntentBinding: posture.routeIntentBinding,
      sessionPosture: posture.postureKey === "claim_pending" ? "rotating" : "authenticated",
      accessGrantScopeEnvelope: posture.accessGrantScopeEnvelope,
      accessGrantRedemptionRecord: posture.accessGrantRedemptionRecord,
      accessGrantSupersessionRecord: posture.accessGrantSupersessionRecord,
      patientActionRecoveryProjection: posture.patientActionRecoveryProjection,
      patientIdentityHoldProjection: posture.patientIdentityHoldProjection,
      patientAudienceCoverageProjection: posture.patientAudienceCoverageProjection,
      continuityEvidence,
    },
    posture,
  };
}
