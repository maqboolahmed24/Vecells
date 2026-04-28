export const MOBILE_SMS_CONTINUATION_TASK_ID = "par_198";
export const MOBILE_SMS_CONTINUATION_VISUAL_MODE = "Mobile_Continuation_Pulse";
export const MOBILE_SMS_CONTINUATION_ROUTE_FAMILY = "rf_mobile_sms_continuation";
export const MOBILE_SMS_CONTINUATION_ENTRY = "/sms-continuation";

export type ContinuationScreenKey =
  | "SeededContinuationLanding"
  | "ChallengeContinuationLanding"
  | "ChallengeQuestionStep"
  | "CapturedSoFarReview"
  | "AddMoreDetailStep"
  | "UploadEvidenceStep"
  | "ReviewBeforeSubmitStep"
  | "ReplayMappedOutcome"
  | "StaleLinkRecoveryBridge"
  | "ManualOnlyOutcome";

export type MobileContinuationStepKey =
  | "landing"
  | "challenge"
  | "captured_so_far"
  | "add_detail"
  | "upload_evidence"
  | "review_submit"
  | "receipt"
  | "safe_outcome";

export type TelephonyContinuationEligibility =
  | "eligible_seeded"
  | "eligible_challenge"
  | "stale_superseded"
  | "replayed_mapping"
  | "recovery_required"
  | "manual_only"
  | "no_access";

export type ContinuationAccent = "seeded" | "challenge" | "review" | "blocked";

export interface AccessGrant {
  projectionName: "AccessGrant";
  grantFamily: "telephony_sms_continuation_seeded" | "telephony_sms_continuation_challenge";
  grantStatus: "current" | "stale" | "replayed" | "recovery_required" | "manual_only";
  handsetVerificationState: "verified" | "challenge_required" | "not_verified";
  seededVerifiedAllowed: boolean;
}

export interface AccessGrantScopeEnvelope {
  projectionName: "AccessGrantScopeEnvelope";
  scopeState:
    | "seeded_mutable"
    | "challenge_zero_detail"
    | "review_mutable"
    | "recovery_only"
    | "manual_only";
  canUploadEvidence: boolean;
  canSubmitCanonicalRequest: boolean;
  allowedAudienceFields: readonly string[];
  suppressedAudienceFields: readonly string[];
}

export interface AccessGrantRedemptionRecord {
  projectionName: "AccessGrantRedemptionRecord";
  redemptionState: "fresh" | "challenge_pending" | "settled" | "duplicate" | "stale" | "blocked";
  settledOutcomeRef: string;
  duplicateMapsToSettledPath: boolean;
}

export interface AccessGrantSupersessionRecord {
  projectionName: "AccessGrantSupersessionRecord";
  supersessionState:
    | "none"
    | "superseded_by_new_sms"
    | "replaced_by_signed_in_request"
    | "manual_follow_up";
  currentSafeDestination: string;
  secondPathForbidden: boolean;
}

export interface RouteIntentBinding {
  projectionName: "RouteIntentBinding";
  routeFamily: typeof MOBILE_SMS_CONTINUATION_ROUTE_FAMILY;
  routeIntent:
    | "seeded_continue"
    | "challenge_then_continue"
    | "review_canonical_request"
    | "upload_evidence"
    | "mapped_outcome"
    | "same_shell_recovery"
    | "manual_only";
  validity: "valid" | "stale" | "blocked";
  returnContract: "same_mobile_shell";
}

export interface RecoveryContinuationToken {
  projectionName: "RecoveryContinuationToken";
  recoveryState: "not_required" | "stale_recovery" | "sign_in_uplift" | "manual_support";
  tokenClass: "continuation_recovery_pointer";
  safeReturnPath: string;
  rawTokenVisibleToClient: false;
}

export interface PatientSecureLinkSessionProjection {
  projectionName: "PatientSecureLinkSessionProjection";
  sessionState:
    | "seeded_verified"
    | "challenge_pending"
    | "challenge_verified"
    | "recoverable"
    | "blocked";
  handsetVerified: boolean;
  secureLinkRedeemed: boolean;
  safeCopyMode:
    | "seeded_safe_summary"
    | "zero_detail_challenge"
    | "same_shell_recovery"
    | "manual_only";
  rawIdentifierExposure: "forbidden";
}

export interface PatientActionRecoveryProjection {
  projectionName: "PatientActionRecoveryProjection";
  recoveryState: "not_required" | "same_shell_bridge" | "sign_in_uplift_return" | "manual_only";
  nextSafeAction: string;
  sameShellRequired: boolean;
  genericHomeRedirectForbidden: boolean;
}

export interface PatientRequestReturnBundle {
  projectionName: "PatientRequestReturnBundle";
  selectedMobileStep: MobileContinuationStepKey;
  requestSummary: string;
  saveState: "saved" | "saving" | "needs_review" | "submitted";
  returnTarget: string;
  canonicalPhase1Semantics: "request_type_questions_upload_review_submit_receipt_status";
  sameLineageReturnRequired: true;
}

export interface TelephonyContinuationContext {
  projectionName: "TelephonyContinuationContext";
  entryChannel: "sms_after_call";
  callCaptureState: "seeded_context_available" | "challenge_required" | "manual_only";
  continuationContextState:
    | "current"
    | "challenge_pending"
    | "challenge_verified"
    | "stale"
    | "replayed"
    | "recovery_required"
    | "manual_only";
  capturedContextSafety:
    | "safe_seeded_summary"
    | "withheld_until_challenge"
    | "withheld_manual_only";
}

export interface CapturedContextRow {
  label: string;
  value: string;
  visibility: "safe_seeded_context" | "post_challenge_context" | "withheld";
}

export interface MobileContinuationContext {
  projectionName: "MobileContinuationContext";
  eligibility: TelephonyContinuationEligibility;
  accessGrant: AccessGrant;
  accessGrantScopeEnvelope: AccessGrantScopeEnvelope;
  accessGrantRedemptionRecord: AccessGrantRedemptionRecord;
  accessGrantSupersessionRecord: AccessGrantSupersessionRecord;
  routeIntentBinding: RouteIntentBinding;
  recoveryContinuationToken: RecoveryContinuationToken;
  patientSecureLinkSessionProjection: PatientSecureLinkSessionProjection;
  patientActionRecoveryProjection: PatientActionRecoveryProjection;
  patientRequestReturnBundle: PatientRequestReturnBundle;
  telephonyContinuationContext: TelephonyContinuationContext;
  safeCapturedContext: readonly CapturedContextRow[];
}

export interface MobileContinuationScreenProjection {
  projectionName: "MobileContinuationScreenProjection";
  screenKey: ContinuationScreenKey;
  stepKey: MobileContinuationStepKey;
  accent: ContinuationAccent;
  title: string;
  eyebrow: string;
  body: string;
  dominantActionLabel: string;
  dominantActionPath: string;
  secondaryActionLabel: string | null;
  secondaryActionPath: string | null;
  progressIndex: number;
  progressTotal: 5;
  revealsSeededContext: boolean;
  uploadDominantOnMobile: boolean;
  manualOnlyOutcome: boolean;
  replayCreatesSecondPath: false;
}

export interface MobileContinuationResolverInput {
  pathname: string;
  restoredStep?: MobileContinuationStepKey | null;
}

export interface MobileContinuationRouteProjection {
  projectionName: "MobileContinuationRouteProjection";
  pathname: string;
  taskId: typeof MOBILE_SMS_CONTINUATION_TASK_ID;
  visualMode: typeof MOBILE_SMS_CONTINUATION_VISUAL_MODE;
  screen: MobileContinuationScreenProjection;
  context: MobileContinuationContext;
}

const capturedSeededSummary: readonly CapturedContextRow[] = [
  {
    label: "Request started from",
    value: "A phone call from today",
    visibility: "safe_seeded_context",
  },
  {
    label: "What we captured",
    value: "Callback request and general topic only",
    visibility: "safe_seeded_context",
  },
  {
    label: "Next useful detail",
    value: "Add what has changed, then attach evidence if it helps",
    visibility: "safe_seeded_context",
  },
];

const capturedAfterChallenge: readonly CapturedContextRow[] = [
  {
    label: "Request started from",
    value: "A verified SMS continuation from a recent call",
    visibility: "post_challenge_context",
  },
  {
    label: "What we captured",
    value: "A callback request and a safe request summary",
    visibility: "post_challenge_context",
  },
];

const withheldContext: readonly CapturedContextRow[] = [
  {
    label: "Captured context",
    value: "Hidden until the handset challenge is complete",
    visibility: "withheld",
  },
];

function scopeEnvelope(
  scopeState: AccessGrantScopeEnvelope["scopeState"],
  canSubmitCanonicalRequest: boolean,
): AccessGrantScopeEnvelope {
  return {
    projectionName: "AccessGrantScopeEnvelope",
    scopeState,
    canUploadEvidence: scopeState !== "manual_only" && scopeState !== "recovery_only",
    canSubmitCanonicalRequest,
    allowedAudienceFields:
      scopeState === "challenge_zero_detail"
        ? ["challengePrompt", "safeAction", "saveState"]
        : ["safeSummary", "selectedMobileStep", "saveState", "uploadEvidence", "reviewSubmit"],
    suppressedAudienceFields:
      scopeState === "challenge_zero_detail"
        ? ["patientName", "requestNarrative", "callTranscript", "attachments", "rawIdentifiers"]
        : ["rawPhoneNumber", "rawGrantToken", "callRecordingUrl", "callbackSignature"],
  };
}

function accessGrant(
  grantFamily: AccessGrant["grantFamily"],
  grantStatus: AccessGrant["grantStatus"],
  handsetVerificationState: AccessGrant["handsetVerificationState"],
): AccessGrant {
  return {
    projectionName: "AccessGrant",
    grantFamily,
    grantStatus,
    handsetVerificationState,
    seededVerifiedAllowed:
      grantFamily === "telephony_sms_continuation_seeded" &&
      handsetVerificationState === "verified",
  };
}

function redemption(
  redemptionState: AccessGrantRedemptionRecord["redemptionState"],
): AccessGrantRedemptionRecord {
  return {
    projectionName: "AccessGrantRedemptionRecord",
    redemptionState,
    settledOutcomeRef: "same-lineage-request-receipt",
    duplicateMapsToSettledPath: redemptionState === "duplicate",
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

function routeIntent(
  routeIntentValue: RouteIntentBinding["routeIntent"],
  validity: RouteIntentBinding["validity"],
): RouteIntentBinding {
  return {
    projectionName: "RouteIntentBinding",
    routeFamily: MOBILE_SMS_CONTINUATION_ROUTE_FAMILY,
    routeIntent: routeIntentValue,
    validity,
    returnContract: "same_mobile_shell",
  };
}

function secureSession(
  sessionState: PatientSecureLinkSessionProjection["sessionState"],
  handsetVerified: boolean,
  safeCopyMode: PatientSecureLinkSessionProjection["safeCopyMode"],
): PatientSecureLinkSessionProjection {
  return {
    projectionName: "PatientSecureLinkSessionProjection",
    sessionState,
    handsetVerified,
    secureLinkRedeemed: sessionState !== "challenge_pending",
    safeCopyMode,
    rawIdentifierExposure: "forbidden",
  };
}

function recoveryProjection(
  recoveryState: PatientActionRecoveryProjection["recoveryState"],
  nextSafeAction: string,
): PatientActionRecoveryProjection {
  return {
    projectionName: "PatientActionRecoveryProjection",
    recoveryState,
    nextSafeAction,
    sameShellRequired: true,
    genericHomeRedirectForbidden: true,
  };
}

function recoveryToken(
  recoveryState: RecoveryContinuationToken["recoveryState"],
  safeReturnPath: string,
): RecoveryContinuationToken {
  return {
    projectionName: "RecoveryContinuationToken",
    recoveryState,
    tokenClass: "continuation_recovery_pointer",
    safeReturnPath,
    rawTokenVisibleToClient: false,
  };
}

function returnBundle(
  selectedMobileStep: MobileContinuationStepKey,
  saveState: PatientRequestReturnBundle["saveState"],
): PatientRequestReturnBundle {
  return {
    projectionName: "PatientRequestReturnBundle",
    selectedMobileStep,
    requestSummary: "Same-lineage continuation request from a recent call",
    saveState,
    returnTarget: `${MOBILE_SMS_CONTINUATION_ENTRY}/${pathForStep(selectedMobileStep)}`,
    canonicalPhase1Semantics: "request_type_questions_upload_review_submit_receipt_status",
    sameLineageReturnRequired: true,
  };
}

function telephonyContext(
  callCaptureState: TelephonyContinuationContext["callCaptureState"],
  continuationContextState: TelephonyContinuationContext["continuationContextState"],
  capturedContextSafety: TelephonyContinuationContext["capturedContextSafety"],
): TelephonyContinuationContext {
  return {
    projectionName: "TelephonyContinuationContext",
    entryChannel: "sms_after_call",
    callCaptureState,
    continuationContextState,
    capturedContextSafety,
  };
}

function contextFor(
  eligibility: TelephonyContinuationEligibility,
  stepKey: MobileContinuationStepKey,
): MobileContinuationContext {
  if (eligibility === "eligible_challenge") {
    const challengeVerified = stepKey !== "landing" && stepKey !== "challenge";
    return {
      projectionName: "MobileContinuationContext",
      eligibility,
      accessGrant: accessGrant(
        "telephony_sms_continuation_challenge",
        "current",
        challengeVerified ? "verified" : "challenge_required",
      ),
      accessGrantScopeEnvelope: scopeEnvelope(
        challengeVerified ? "review_mutable" : "challenge_zero_detail",
        challengeVerified,
      ),
      accessGrantRedemptionRecord: redemption(challengeVerified ? "fresh" : "challenge_pending"),
      accessGrantSupersessionRecord: supersession(
        "none",
        `${MOBILE_SMS_CONTINUATION_ENTRY}/detail`,
      ),
      routeIntentBinding: routeIntent("challenge_then_continue", "valid"),
      recoveryContinuationToken: recoveryToken(
        "not_required",
        `${MOBILE_SMS_CONTINUATION_ENTRY}/challenge`,
      ),
      patientSecureLinkSessionProjection: secureSession(
        challengeVerified ? "challenge_verified" : "challenge_pending",
        challengeVerified,
        challengeVerified ? "seeded_safe_summary" : "zero_detail_challenge",
      ),
      patientActionRecoveryProjection: recoveryProjection("not_required", "Continue request"),
      patientRequestReturnBundle: returnBundle(stepKey, "saved"),
      telephonyContinuationContext: telephonyContext(
        "challenge_required",
        challengeVerified ? "challenge_verified" : "challenge_pending",
        challengeVerified ? "safe_seeded_summary" : "withheld_until_challenge",
      ),
      safeCapturedContext: challengeVerified ? capturedAfterChallenge : withheldContext,
    };
  }

  if (eligibility === "replayed_mapping") {
    return {
      projectionName: "MobileContinuationContext",
      eligibility,
      accessGrant: accessGrant("telephony_sms_continuation_seeded", "replayed", "verified"),
      accessGrantScopeEnvelope: scopeEnvelope("recovery_only", false),
      accessGrantRedemptionRecord: redemption("duplicate"),
      accessGrantSupersessionRecord: supersession(
        "replaced_by_signed_in_request",
        `${MOBILE_SMS_CONTINUATION_ENTRY}/submitted`,
      ),
      routeIntentBinding: routeIntent("mapped_outcome", "valid"),
      recoveryContinuationToken: recoveryToken(
        "not_required",
        `${MOBILE_SMS_CONTINUATION_ENTRY}/submitted`,
      ),
      patientSecureLinkSessionProjection: secureSession(
        "seeded_verified",
        true,
        "same_shell_recovery",
      ),
      patientActionRecoveryProjection: recoveryProjection(
        "same_shell_bridge",
        "View the settled continuation",
      ),
      patientRequestReturnBundle: returnBundle("receipt", "submitted"),
      telephonyContinuationContext: telephonyContext(
        "seeded_context_available",
        "replayed",
        "safe_seeded_summary",
      ),
      safeCapturedContext: capturedSeededSummary,
    };
  }

  if (eligibility === "stale_superseded" || eligibility === "recovery_required") {
    return {
      projectionName: "MobileContinuationContext",
      eligibility,
      accessGrant: accessGrant("telephony_sms_continuation_seeded", "stale", "verified"),
      accessGrantScopeEnvelope: scopeEnvelope("recovery_only", false),
      accessGrantRedemptionRecord: redemption("stale"),
      accessGrantSupersessionRecord: supersession(
        "superseded_by_new_sms",
        `${MOBILE_SMS_CONTINUATION_ENTRY}/recovery`,
      ),
      routeIntentBinding: routeIntent("same_shell_recovery", "stale"),
      recoveryContinuationToken: recoveryToken(
        "stale_recovery",
        `${MOBILE_SMS_CONTINUATION_ENTRY}/recovery`,
      ),
      patientSecureLinkSessionProjection: secureSession("recoverable", true, "same_shell_recovery"),
      patientActionRecoveryProjection: recoveryProjection(
        "same_shell_bridge",
        "Recover this continuation",
      ),
      patientRequestReturnBundle: returnBundle(stepKey, "saved"),
      telephonyContinuationContext: telephonyContext(
        "seeded_context_available",
        "recovery_required",
        "safe_seeded_summary",
      ),
      safeCapturedContext: capturedSeededSummary,
    };
  }

  if (eligibility === "manual_only" || eligibility === "no_access") {
    return {
      projectionName: "MobileContinuationContext",
      eligibility,
      accessGrant: accessGrant(
        "telephony_sms_continuation_challenge",
        "manual_only",
        "not_verified",
      ),
      accessGrantScopeEnvelope: scopeEnvelope("manual_only", false),
      accessGrantRedemptionRecord: redemption("blocked"),
      accessGrantSupersessionRecord: supersession("manual_follow_up", "/contact-practice"),
      routeIntentBinding: routeIntent("manual_only", "blocked"),
      recoveryContinuationToken: recoveryToken("manual_support", "/contact-practice"),
      patientSecureLinkSessionProjection: secureSession("blocked", false, "manual_only"),
      patientActionRecoveryProjection: recoveryProjection("manual_only", "Contact the practice"),
      patientRequestReturnBundle: returnBundle("safe_outcome", "needs_review"),
      telephonyContinuationContext: telephonyContext(
        "manual_only",
        "manual_only",
        "withheld_manual_only",
      ),
      safeCapturedContext: withheldContext,
    };
  }

  return {
    projectionName: "MobileContinuationContext",
    eligibility,
    accessGrant: accessGrant("telephony_sms_continuation_seeded", "current", "verified"),
    accessGrantScopeEnvelope: scopeEnvelope(
      stepKey === "receipt" ? "recovery_only" : "seeded_mutable",
      stepKey !== "receipt",
    ),
    accessGrantRedemptionRecord: redemption(stepKey === "receipt" ? "settled" : "fresh"),
    accessGrantSupersessionRecord: supersession("none", `${MOBILE_SMS_CONTINUATION_ENTRY}/review`),
    routeIntentBinding: routeIntent(
      stepKey === "upload_evidence"
        ? "upload_evidence"
        : stepKey === "review_submit"
          ? "review_canonical_request"
          : "seeded_continue",
      "valid",
    ),
    recoveryContinuationToken: recoveryToken(
      stepKey === "add_detail" ? "sign_in_uplift" : "not_required",
      `${MOBILE_SMS_CONTINUATION_ENTRY}/detail`,
    ),
    patientSecureLinkSessionProjection: secureSession(
      "seeded_verified",
      true,
      "seeded_safe_summary",
    ),
    patientActionRecoveryProjection: recoveryProjection(
      stepKey === "add_detail" ? "sign_in_uplift_return" : "not_required",
      "Continue in the mobile shell",
    ),
    patientRequestReturnBundle: returnBundle(
      stepKey,
      stepKey === "receipt" ? "submitted" : "saved",
    ),
    telephonyContinuationContext: telephonyContext(
      "seeded_context_available",
      "current",
      "safe_seeded_summary",
    ),
    safeCapturedContext: capturedSeededSummary,
  };
}

function pathForStep(stepKey: MobileContinuationStepKey): string {
  switch (stepKey) {
    case "challenge":
      return "challenge-step";
    case "captured_so_far":
      return "captured";
    case "add_detail":
      return "detail";
    case "upload_evidence":
      return "upload";
    case "review_submit":
      return "review";
    case "receipt":
      return "submitted";
    case "safe_outcome":
      return "manual-only";
    default:
      return "seeded";
  }
}

function screen(
  screenKey: ContinuationScreenKey,
  stepKey: MobileContinuationStepKey,
  accent: ContinuationAccent,
  copy: {
    eyebrow: string;
    title: string;
    body: string;
    dominantActionLabel: string;
    dominantActionPath: string;
    secondaryActionLabel?: string | null;
    secondaryActionPath?: string | null;
    progressIndex: number;
    revealsSeededContext: boolean;
    uploadDominantOnMobile?: boolean;
    manualOnlyOutcome?: boolean;
  },
): MobileContinuationScreenProjection {
  return {
    projectionName: "MobileContinuationScreenProjection",
    screenKey,
    stepKey,
    accent,
    title: copy.title,
    eyebrow: copy.eyebrow,
    body: copy.body,
    dominantActionLabel: copy.dominantActionLabel,
    dominantActionPath: copy.dominantActionPath,
    secondaryActionLabel: copy.secondaryActionLabel ?? null,
    secondaryActionPath: copy.secondaryActionPath ?? null,
    progressIndex: copy.progressIndex,
    progressTotal: 5,
    revealsSeededContext: copy.revealsSeededContext,
    uploadDominantOnMobile: copy.uploadDominantOnMobile ?? false,
    manualOnlyOutcome: copy.manualOnlyOutcome ?? false,
    replayCreatesSecondPath: false,
  };
}

const seededLanding = screen("SeededContinuationLanding", "landing", "seeded", {
  eyebrow: "Seeded continuation",
  title: "Continue the request from your call",
  body: "We have already captured some details after a verified handset check. Add anything missing before you submit.",
  dominantActionLabel: "Review what is captured",
  dominantActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/captured`,
  secondaryActionLabel: "Add more detail",
  secondaryActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/detail`,
  progressIndex: 1,
  revealsSeededContext: true,
});

const challengeLanding = screen("ChallengeContinuationLanding", "landing", "challenge", {
  eyebrow: "Quick check",
  title: "Confirm this phone before we show anything",
  body: "For safety, this page shows no request details until the handset challenge is complete.",
  dominantActionLabel: "Start phone check",
  dominantActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/challenge-step`,
  progressIndex: 1,
  revealsSeededContext: false,
});

const challengeStep = screen("ChallengeQuestionStep", "challenge", "challenge", {
  eyebrow: "Privacy check",
  title: "Enter the six digit code from the call",
  body: "This check protects request details. We will only show captured context after the challenge succeeds.",
  dominantActionLabel: "Continue safely",
  dominantActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/challenge-verified`,
  secondaryActionLabel: "Use manual support instead",
  secondaryActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/manual-only`,
  progressIndex: 1,
  revealsSeededContext: false,
});

const capturedReview = screen("CapturedSoFarReview", "captured_so_far", "seeded", {
  eyebrow: "Captured so far",
  title: "Check the safe summary before adding more",
  body: "Only the safe context from the call is shown here. You can add more detail or go straight to upload.",
  dominantActionLabel: "Add more detail",
  dominantActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/detail`,
  secondaryActionLabel: "Upload evidence",
  secondaryActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/upload`,
  progressIndex: 2,
  revealsSeededContext: true,
});

const detailStep = screen("AddMoreDetailStep", "add_detail", "seeded", {
  eyebrow: "Question step",
  title: "Add the detail you could not say on the call",
  body: "This uses the same Phase 1 request questions as web intake, not a phone-only schema.",
  dominantActionLabel: "Save and add evidence",
  dominantActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/upload`,
  secondaryActionLabel: "Sign in and return here",
  secondaryActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/sign-in-return`,
  progressIndex: 3,
  revealsSeededContext: true,
});

const uploadStep = screen("UploadEvidenceStep", "upload_evidence", "review", {
  eyebrow: "Upload evidence",
  title: "Add a photo or document if it helps",
  body: "Uploads stay in the same continuation shell and follow the canonical Phase 1 evidence lane.",
  dominantActionLabel: "Review before sending",
  dominantActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/review`,
  secondaryActionLabel: "Back to details",
  secondaryActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/detail`,
  progressIndex: 4,
  revealsSeededContext: true,
  uploadDominantOnMobile: true,
});

const reviewStep = screen("ReviewBeforeSubmitStep", "review_submit", "review", {
  eyebrow: "Review",
  title: "Send this as one request",
  body: "Submitting here converges into the same request, receipt, status, and re-safety path as web.",
  dominantActionLabel: "Submit request",
  dominantActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/submitted`,
  secondaryActionLabel: "Add evidence",
  secondaryActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/upload`,
  progressIndex: 5,
  revealsSeededContext: true,
});

const submittedStep = screen("ReviewBeforeSubmitStep", "receipt", "review", {
  eyebrow: "Submitted",
  title: "Your request has been sent",
  body: "The request now follows the shared receipt, status, and safety review route used by web intake.",
  dominantActionLabel: "Track request status",
  dominantActionPath: "/portal/requests",
  secondaryActionLabel: "Back to continuation",
  secondaryActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/captured`,
  progressIndex: 5,
  revealsSeededContext: true,
});

const replayMapped = screen("ReplayMappedOutcome", "receipt", "blocked", {
  eyebrow: "Already used",
  title: "This continuation already maps to the settled request",
  body: "A replayed continuation does not create a second path. We show the same settled receipt instead.",
  dominantActionLabel: "View settled receipt",
  dominantActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/submitted`,
  progressIndex: 5,
  revealsSeededContext: true,
});

const staleBridge = screen("StaleLinkRecoveryBridge", "safe_outcome", "blocked", {
  eyebrow: "Link replaced",
  title: "Recover this continuation in the same shell",
  body: "This link is stale or superseded. We keep you in the mobile shell and bridge to the latest safe continuation.",
  dominantActionLabel: "Recover latest link",
  dominantActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/recovery`,
  secondaryActionLabel: "Use manual support",
  secondaryActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/manual-only`,
  progressIndex: 1,
  revealsSeededContext: true,
});

const recoveryBridge = screen("StaleLinkRecoveryBridge", "add_detail", "challenge", {
  eyebrow: "Recovered",
  title: "You are back in the same mobile step",
  body: "The recovery bridge restores selected step, save state, and return contract without dropping to a generic home page.",
  dominantActionLabel: "Continue where you left off",
  dominantActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/detail`,
  secondaryActionLabel: "Review captured context",
  secondaryActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/captured`,
  progressIndex: 3,
  revealsSeededContext: true,
});

const signInReturnBridge = screen("AddMoreDetailStep", "add_detail", "challenge", {
  eyebrow: "Signed in",
  title: "Returned to your saved mobile step",
  body: "Step-up completed and returned to the same continuation shell with the selected step preserved.",
  dominantActionLabel: "Continue saved detail",
  dominantActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/detail`,
  secondaryActionLabel: "Upload evidence",
  secondaryActionPath: `${MOBILE_SMS_CONTINUATION_ENTRY}/upload`,
  progressIndex: 3,
  revealsSeededContext: true,
});

const manualOnly = screen("ManualOnlyOutcome", "safe_outcome", "blocked", {
  eyebrow: "Manual support",
  title: "This link needs practice support",
  body: "No request details are shown and no continuation can be redeemed here. Please contact the practice using the usual route.",
  dominantActionLabel: "Contact the practice",
  dominantActionPath: "/contact-practice",
  progressIndex: 1,
  revealsSeededContext: false,
  manualOnlyOutcome: true,
});

export const MOBILE_CONTINUATION_SCREEN_FIXTURES: readonly MobileContinuationScreenProjection[] = [
  seededLanding,
  challengeLanding,
  challengeStep,
  capturedReview,
  detailStep,
  uploadStep,
  reviewStep,
  replayMapped,
  staleBridge,
  manualOnly,
];

function screenForPath(pathname: string): MobileContinuationScreenProjection {
  switch (pathname) {
    case `${MOBILE_SMS_CONTINUATION_ENTRY}/challenge`:
      return challengeLanding;
    case `${MOBILE_SMS_CONTINUATION_ENTRY}/challenge-step`:
      return challengeStep;
    case `${MOBILE_SMS_CONTINUATION_ENTRY}/challenge-verified`:
    case `${MOBILE_SMS_CONTINUATION_ENTRY}/captured`:
      return capturedReview;
    case `${MOBILE_SMS_CONTINUATION_ENTRY}/detail`:
      return detailStep;
    case `${MOBILE_SMS_CONTINUATION_ENTRY}/upload`:
      return uploadStep;
    case `${MOBILE_SMS_CONTINUATION_ENTRY}/review`:
      return reviewStep;
    case `${MOBILE_SMS_CONTINUATION_ENTRY}/submitted`:
      return submittedStep;
    case `${MOBILE_SMS_CONTINUATION_ENTRY}/replay`:
      return replayMapped;
    case `${MOBILE_SMS_CONTINUATION_ENTRY}/stale-link`:
      return staleBridge;
    case `${MOBILE_SMS_CONTINUATION_ENTRY}/recovery`:
      return recoveryBridge;
    case `${MOBILE_SMS_CONTINUATION_ENTRY}/manual-only`:
      return manualOnly;
    case `${MOBILE_SMS_CONTINUATION_ENTRY}/sign-in-return`:
      return signInReturnBridge;
    case `${MOBILE_SMS_CONTINUATION_ENTRY}/seeded`:
    default:
      return seededLanding;
  }
}

function eligibilityForPath(
  pathname: string,
  stepKey: MobileContinuationStepKey,
): TelephonyContinuationEligibility {
  if (
    pathname === `${MOBILE_SMS_CONTINUATION_ENTRY}/challenge` ||
    pathname === `${MOBILE_SMS_CONTINUATION_ENTRY}/challenge-step` ||
    pathname === `${MOBILE_SMS_CONTINUATION_ENTRY}/challenge-verified`
  ) {
    return "eligible_challenge";
  }
  if (pathname === `${MOBILE_SMS_CONTINUATION_ENTRY}/replay`) {
    return "replayed_mapping";
  }
  if (pathname === `${MOBILE_SMS_CONTINUATION_ENTRY}/stale-link`) {
    return "stale_superseded";
  }
  if (pathname === `${MOBILE_SMS_CONTINUATION_ENTRY}/recovery`) {
    return "recovery_required";
  }
  if (pathname === `${MOBILE_SMS_CONTINUATION_ENTRY}/manual-only`) {
    return "manual_only";
  }
  if (stepKey === "receipt") {
    return "eligible_seeded";
  }
  return "eligible_seeded";
}

export function MobileContinuationResolver(
  input: string | MobileContinuationResolverInput,
): MobileContinuationRouteProjection {
  const pathname = typeof input === "string" ? input : input.pathname;
  const screenProjection = screenForPath(pathname);
  const eligibility = eligibilityForPath(pathname, screenProjection.stepKey);
  return {
    projectionName: "MobileContinuationRouteProjection",
    pathname,
    taskId: MOBILE_SMS_CONTINUATION_TASK_ID,
    visualMode: MOBILE_SMS_CONTINUATION_VISUAL_MODE,
    screen: screenProjection,
    context: contextFor(eligibility, screenProjection.stepKey),
  };
}

export function isMobileSmsContinuationPath(pathname: string): boolean {
  return (
    pathname === MOBILE_SMS_CONTINUATION_ENTRY ||
    pathname.startsWith(`${MOBILE_SMS_CONTINUATION_ENTRY}/`)
  );
}
