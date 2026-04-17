export const AUTH_CALLBACK_RECOVERY_TASK_ID = "par_195";
export const AUTH_CALLBACK_RECOVERY_MODE = "Auth_Callback_Recovery_Atlas";

export type AuthTransactionState =
  | "opened"
  | "awaiting_callback"
  | "callback_received"
  | "verified"
  | "consumed"
  | "denied"
  | "expired"
  | "replayed";

export type AuthCallbackOutcomeClass =
  | "not_started"
  | "holding"
  | "session_settling"
  | "success"
  | "consent_declined"
  | "insufficient_assurance"
  | "expired_transaction"
  | "replayed_callback"
  | "signed_out";

export type SessionEstablishmentDecisionValue =
  | "create_fresh"
  | "rotate_existing"
  | "reuse_existing"
  | "deny"
  | "bounded_recovery";

export type WritableAuthorityState = "none" | "auth_read_only" | "claim_pending" | "writable";

export type ReturnAuthority = "auth_only" | "claim_pending" | "writable_resume" | "recovery_only";

export type ReturnIntentState = "pending" | "consumed" | "superseded" | "recovered";

export type CapabilityDecisionState = "allow" | "step_up_required" | "recover_only" | "deny";

export type SessionTerminationTrigger =
  | "none"
  | "user_sign_out"
  | "idle_timeout"
  | "absolute_timeout"
  | "server_revocation"
  | "callback_replay";

export type RouteFenceState = "aligned" | "release_drift" | "stale_return";
export type RouteIntentBindingValidity = "valid" | "stale" | "superseded" | "missing";

export type AuthRecoveryScreenKey =
  | "sign_in_entry"
  | "callback_holding"
  | "confirming_details"
  | "consent_declined"
  | "higher_assurance_required"
  | "safe_re_entry"
  | "session_expired"
  | "signed_out_clean";

export interface AuthTransaction {
  readonly transactionId: string;
  readonly transactionState: AuthTransactionState;
  readonly stateDigestRef: string;
  readonly callbackSettlementRef: string | null;
  readonly sessionEstablishmentDecisionRef: string | null;
  readonly errorRef: string | null;
  readonly startedAt: string;
  readonly expiresAt: string;
}

export interface SessionEstablishmentDecision {
  readonly decisionId: string;
  readonly decision: SessionEstablishmentDecisionValue;
  readonly writableAuthorityState: WritableAuthorityState;
  readonly subjectComparisonState:
    | "no_session"
    | "anonymous_session"
    | "same_subject_same_binding"
    | "same_subject_binding_advanced"
    | "different_subject"
    | "mismatched_secure_link_subject"
    | "stale_existing";
  readonly reasonCodes: readonly string[];
}

export interface PostAuthReturnIntent {
  readonly returnIntentId: string;
  readonly returnAuthority: ReturnAuthority;
  readonly intentState: ReturnIntentState;
  readonly routeFamilyRef: string;
  readonly routeTargetRef: string;
  readonly selectedAnchorRef: string;
  readonly fallbackRouteRef: string;
}

export interface CapabilityDecision {
  readonly capabilityDecisionId: string;
  readonly decisionState: CapabilityDecisionState;
  readonly writableAuthorityState: "writable" | "read_only" | "blocked";
  readonly reasonCodes: readonly string[];
  readonly stepUpPathRef: string | null;
  readonly recoveryPathRef: string | null;
}

export interface SessionTerminationSettlement {
  readonly settlementId: string;
  readonly trigger: SessionTerminationTrigger;
  readonly projectionPosture:
    | "none"
    | "signed_out"
    | "session_expired"
    | "stale_return"
    | "bounded_recovery";
  readonly reasonCodes: readonly string[];
}

export interface RouteContinuityState {
  readonly routeFenceState: RouteFenceState;
  readonly releaseDriftDetected: boolean;
  readonly releaseApprovalFreezeRef: string;
  readonly manifestVersionRef: string;
  readonly continuityKeyRef: string;
}

export interface RouteIntentBinding {
  readonly bindingRef: string | null;
  readonly validity: RouteIntentBindingValidity;
  readonly routeFamilyRef: string;
  readonly governingObjectRef: string;
  readonly selectedAnchorRef: string;
}

export interface AuthRecoveryScreenContent {
  readonly eyebrow: string;
  readonly title: string;
  readonly summary: string;
  readonly primaryAction: string;
  readonly secondaryAction: string;
  readonly trustCue: string;
  readonly nextPath: string;
  readonly severity: "neutral" | "active" | "recovery" | "caution" | "blocked" | "healthy";
}

export interface AuthRecoveryStateProjection {
  readonly screenKey: AuthRecoveryScreenKey;
  readonly routePath: string;
  readonly patientVisibleState: string;
  readonly callbackOutcomeClass: AuthCallbackOutcomeClass;
  readonly transaction: AuthTransaction;
  readonly sessionDecision: SessionEstablishmentDecision;
  readonly returnIntent: PostAuthReturnIntent;
  readonly capabilityDecision: CapabilityDecision;
  readonly terminationSettlement: SessionTerminationSettlement;
  readonly routeContinuity: RouteContinuityState;
  readonly routeIntentBinding: RouteIntentBinding;
  readonly content: AuthRecoveryScreenContent;
}

export const AUTH_RECOVERY_ROUTE_PATHS: Record<AuthRecoveryScreenKey, string> = {
  sign_in_entry: "/auth/sign-in",
  callback_holding: "/auth/callback",
  confirming_details: "/auth/callback/confirming",
  consent_declined: "/auth/recovery/consent-declined",
  higher_assurance_required: "/auth/recovery/higher-assurance",
  safe_re_entry: "/auth/recovery/safe-re-entry",
  session_expired: "/auth/recovery/session-expired",
  signed_out_clean: "/auth/signed-out",
};

const baseTransaction = {
  transactionId: "auth_txn_195_patient_portal",
  stateDigestRef: "state_digest_ref_195_vault_only",
  callbackSettlementRef: null,
  sessionEstablishmentDecisionRef: null,
  errorRef: null,
  startedAt: "2026-04-15T09:10:00+01:00",
  expiresAt: "2026-04-15T09:20:00+01:00",
} as const;

const baseSessionDecision = {
  decisionId: "session_decision_195_patient_portal",
  decision: "create_fresh",
  writableAuthorityState: "auth_read_only",
  subjectComparisonState: "no_session",
  reasonCodes: ["NO_EXISTING_SESSION", "AUTH_CALLBACK_195_WAIT_FOR_GOVERNOR"],
} as const satisfies SessionEstablishmentDecision;

const baseReturnIntent = {
  returnIntentId: "return_intent_195_patient_portal",
  returnAuthority: "auth_only",
  intentState: "pending",
  routeFamilyRef: "rf_patient_requests",
  routeTargetRef: "request_status_REQ-2049",
  selectedAnchorRef: "request-summary",
  fallbackRouteRef: "/requests/REQ-2049",
} as const satisfies PostAuthReturnIntent;

const baseCapabilityDecision = {
  capabilityDecisionId: "capability_195_patient_portal",
  decisionState: "recover_only",
  writableAuthorityState: "read_only",
  reasonCodes: ["CAP_180_ROUTE_PROFILE_RESOLVED", "AUTH_CALLBACK_195_NO_WRITE_BEFORE_SESSION"],
  stepUpPathRef: "/auth/recovery/higher-assurance",
  recoveryPathRef: "/auth/recovery/safe-re-entry",
} as const satisfies CapabilityDecision;

const baseTerminationSettlement = {
  settlementId: "session_termination_195_none",
  trigger: "none",
  projectionPosture: "none",
  reasonCodes: ["NO_TERMINATION_SETTLEMENT"],
} as const satisfies SessionTerminationSettlement;

const baseRouteContinuity = {
  routeFenceState: "aligned",
  releaseDriftDetected: false,
  releaseApprovalFreezeRef: "release_freeze_patient_auth_195_v1",
  manifestVersionRef: "frontend_manifest_patient_auth_195_v1",
  continuityKeyRef: "continuity_patient_request_REQ-2049",
} as const satisfies RouteContinuityState;

const baseRouteIntentBinding = {
  bindingRef: "route_intent_binding_195_patient_request",
  validity: "valid",
  routeFamilyRef: "rf_patient_requests",
  governingObjectRef: "REQ-2049",
  selectedAnchorRef: "request-summary",
} as const satisfies RouteIntentBinding;

export const AUTH_RECOVERY_STATES = [
  {
    screenKey: "sign_in_entry",
    routePath: AUTH_RECOVERY_ROUTE_PATHS.sign_in_entry,
    patientVisibleState: "sign_in_entry",
    callbackOutcomeClass: "not_started",
    transaction: {
      ...baseTransaction,
      transactionId: "auth_txn_195_entry",
      transactionState: "opened",
    },
    sessionDecision: baseSessionDecision,
    returnIntent: baseReturnIntent,
    capabilityDecision: baseCapabilityDecision,
    terminationSettlement: baseTerminationSettlement,
    routeContinuity: baseRouteContinuity,
    routeIntentBinding: baseRouteIntentBinding,
    content: {
      eyebrow: "NHS login",
      title: "Sign in without losing your place",
      summary:
        "The request context is held by the route intent binding before the NHS login redirect starts.",
      primaryAction: "Continue with NHS login",
      secondaryAction: "Review what is kept",
      trustCue:
        "Only a return intent, route binding, and masked continuity key are displayed. No raw claims or tokens are rendered.",
      nextPath: AUTH_RECOVERY_ROUTE_PATHS.callback_holding,
      severity: "active",
    },
  },
  {
    screenKey: "callback_holding",
    routePath: AUTH_RECOVERY_ROUTE_PATHS.callback_holding,
    patientVisibleState: "callback_holding",
    callbackOutcomeClass: "holding",
    transaction: {
      ...baseTransaction,
      transactionId: "auth_txn_195_callback_holding",
      transactionState: "callback_received",
      callbackSettlementRef: "callback_settlement_195_pending",
    },
    sessionDecision: {
      ...baseSessionDecision,
      reasonCodes: ["CALLBACK_RECEIVED", "SESSION_GOVERNOR_NOT_SETTLED"],
    },
    returnIntent: baseReturnIntent,
    capabilityDecision: baseCapabilityDecision,
    terminationSettlement: baseTerminationSettlement,
    routeContinuity: baseRouteContinuity,
    routeIntentBinding: baseRouteIntentBinding,
    content: {
      eyebrow: "Callback received",
      title: "Checking the sign-in result",
      summary:
        "The callback is being settled against the frozen return intent before any patient action becomes writable.",
      primaryAction: "Finish checks",
      secondaryAction: "Keep this page open",
      trustCue:
        "Holding copy follows AuthTransaction.transactionState and does not infer success from browser query parameters.",
      nextPath: AUTH_RECOVERY_ROUTE_PATHS.confirming_details,
      severity: "active",
    },
  },
  {
    screenKey: "confirming_details",
    routePath: AUTH_RECOVERY_ROUTE_PATHS.confirming_details,
    patientVisibleState: "confirming_details",
    callbackOutcomeClass: "session_settling",
    transaction: {
      ...baseTransaction,
      transactionId: "auth_txn_195_confirming",
      transactionState: "verified",
      callbackSettlementRef: "callback_settlement_195_success",
      sessionEstablishmentDecisionRef: "session_decision_195_confirming",
    },
    sessionDecision: {
      decisionId: "session_decision_195_confirming",
      decision: "create_fresh",
      writableAuthorityState: "writable",
      subjectComparisonState: "no_session",
      reasonCodes: ["NO_EXISTING_SESSION", "SESSION_CREATED_FROM_CALLBACK"],
    },
    returnIntent: {
      ...baseReturnIntent,
      returnAuthority: "writable_resume",
      intentState: "pending",
    },
    capabilityDecision: {
      ...baseCapabilityDecision,
      decisionState: "allow",
      writableAuthorityState: "writable",
      reasonCodes: ["CAP_180_CAPABILITY_ALLOW", "CAP_180_SCOPE_ENVELOPE_AUTHORIZED"],
    },
    terminationSettlement: baseTerminationSettlement,
    routeContinuity: baseRouteContinuity,
    routeIntentBinding: baseRouteIntentBinding,
    content: {
      eyebrow: "Session being established",
      title: "Confirming your details",
      summary:
        "The session decision is current and the return intent is still pending, so the shell can confirm the safe resume target.",
      primaryAction: "Return to my request",
      secondaryAction: "Stay on this page",
      trustCue:
        "Write access is shown only because SessionEstablishmentDecision and CapabilityDecision both allow it.",
      nextPath: AUTH_RECOVERY_ROUTE_PATHS.safe_re_entry,
      severity: "healthy",
    },
  },
  {
    screenKey: "consent_declined",
    routePath: AUTH_RECOVERY_ROUTE_PATHS.consent_declined,
    patientVisibleState: "consent_declined",
    callbackOutcomeClass: "consent_declined",
    transaction: {
      ...baseTransaction,
      transactionId: "auth_txn_195_consent_declined",
      transactionState: "denied",
      errorRef: "masked_provider_error_consent_declined",
    },
    sessionDecision: {
      ...baseSessionDecision,
      decision: "deny",
      writableAuthorityState: "none",
      reasonCodes: ["PROVIDER_CONSENT_DECLINED", "NO_SESSION_CREATED"],
    },
    returnIntent: {
      ...baseReturnIntent,
      returnAuthority: "auth_only",
      intentState: "recovered",
    },
    capabilityDecision: {
      ...baseCapabilityDecision,
      decisionState: "deny",
      writableAuthorityState: "blocked",
      reasonCodes: ["CAP_180_CAPABILITY_DENIED", "CONSENT_NOT_GRANTED"],
    },
    terminationSettlement: baseTerminationSettlement,
    routeContinuity: baseRouteContinuity,
    routeIntentBinding: baseRouteIntentBinding,
    content: {
      eyebrow: "Consent not granted",
      title: "You did not share your NHS login details",
      summary:
        "The request remains visible in the same shell, but the sign-in attempt cannot create a session.",
      primaryAction: "Try NHS login again",
      secondaryAction: "Return without signing in",
      trustCue:
        "The page explains the declined outcome without exposing provider error payloads or raw OIDC values.",
      nextPath: AUTH_RECOVERY_ROUTE_PATHS.sign_in_entry,
      severity: "caution",
    },
  },
  {
    screenKey: "higher_assurance_required",
    routePath: AUTH_RECOVERY_ROUTE_PATHS.higher_assurance_required,
    patientVisibleState: "higher_assurance_required",
    callbackOutcomeClass: "insufficient_assurance",
    transaction: {
      ...baseTransaction,
      transactionId: "auth_txn_195_higher_assurance",
      transactionState: "verified",
      callbackSettlementRef: "callback_settlement_195_step_up",
    },
    sessionDecision: {
      ...baseSessionDecision,
      decision: "bounded_recovery",
      writableAuthorityState: "auth_read_only",
      subjectComparisonState: "same_subject_same_binding",
      reasonCodes: ["ASSURANCE_BELOW_ROUTE_REQUIREMENT", "BOUNDED_RECOVERY_ALLOWED"],
    },
    returnIntent: {
      ...baseReturnIntent,
      returnAuthority: "recovery_only",
      intentState: "pending",
    },
    capabilityDecision: {
      ...baseCapabilityDecision,
      decisionState: "step_up_required",
      writableAuthorityState: "read_only",
      reasonCodes: [
        "CAP_180_VERIFICATION_BELOW_ROUTE_REQUIREMENT",
        "CAP_180_STEP_UP_PATH_AVAILABLE",
      ],
    },
    terminationSettlement: baseTerminationSettlement,
    routeContinuity: baseRouteContinuity,
    routeIntentBinding: baseRouteIntentBinding,
    content: {
      eyebrow: "Higher assurance required",
      title: "A stronger NHS login check is needed",
      summary:
        "You can keep this request context, but the next action needs a higher assurance session before writing.",
      primaryAction: "Complete stronger NHS login",
      secondaryAction: "Use read-only recovery",
      trustCue:
        "The blocked state is driven by CapabilityDecision.reasonCodes and not by local route guesses.",
      nextPath: AUTH_RECOVERY_ROUTE_PATHS.callback_holding,
      severity: "recovery",
    },
  },
  {
    screenKey: "safe_re_entry",
    routePath: AUTH_RECOVERY_ROUTE_PATHS.safe_re_entry,
    patientVisibleState: "safe_re_entry",
    callbackOutcomeClass: "success",
    transaction: {
      ...baseTransaction,
      transactionId: "auth_txn_195_safe_re_entry",
      transactionState: "consumed",
      callbackSettlementRef: "callback_settlement_195_consumed",
      sessionEstablishmentDecisionRef: "session_decision_195_safe_re_entry",
    },
    sessionDecision: {
      decisionId: "session_decision_195_safe_re_entry",
      decision: "reuse_existing",
      writableAuthorityState: "auth_read_only",
      subjectComparisonState: "same_subject_same_binding",
      reasonCodes: ["SESSION_REUSE_ALLOWED", "ROUTE_RELEASE_DRIFT_REQUIRES_READ_ONLY_RETURN"],
    },
    returnIntent: {
      ...baseReturnIntent,
      returnAuthority: "recovery_only",
      intentState: "recovered",
    },
    capabilityDecision: {
      ...baseCapabilityDecision,
      decisionState: "recover_only",
      writableAuthorityState: "read_only",
      reasonCodes: ["CAP_180_RELEASE_POSTURE_DRIFT", "CAP_180_SAME_LINEAGE_RECOVERY_AVAILABLE"],
    },
    terminationSettlement: {
      ...baseTerminationSettlement,
      settlementId: "session_termination_195_stale_return",
      trigger: "callback_replay",
      projectionPosture: "stale_return",
      reasonCodes: ["REPLAY_OR_BACK_BUTTON_RETURN", "NO_GENERIC_HOME_REDIRECT"],
    },
    routeContinuity: {
      ...baseRouteContinuity,
      routeFenceState: "stale_return",
      releaseDriftDetected: true,
      releaseApprovalFreezeRef: "release_freeze_patient_auth_195_v0_superseded",
    },
    routeIntentBinding: {
      ...baseRouteIntentBinding,
      validity: "stale",
    },
    content: {
      eyebrow: "Safe re-entry",
      title: "We kept your place, but actions are read-only",
      summary:
        "The route binding is stale, so the shell resumes at the same request in a bounded recovery posture.",
      primaryAction: "Open safe request summary",
      secondaryAction: "Start a fresh sign-in",
      trustCue:
        "Refresh, replay, and back-button returns keep the same shell while writable authority is fenced.",
      nextPath: AUTH_RECOVERY_ROUTE_PATHS.sign_in_entry,
      severity: "recovery",
    },
  },
  {
    screenKey: "session_expired",
    routePath: AUTH_RECOVERY_ROUTE_PATHS.session_expired,
    patientVisibleState: "session_expired",
    callbackOutcomeClass: "expired_transaction",
    transaction: {
      ...baseTransaction,
      transactionId: "auth_txn_195_session_expired",
      transactionState: "expired",
      callbackSettlementRef: "callback_settlement_195_expired",
    },
    sessionDecision: {
      ...baseSessionDecision,
      decision: "bounded_recovery",
      writableAuthorityState: "auth_read_only",
      subjectComparisonState: "stale_existing",
      reasonCodes: ["STALE_EXISTING_SESSION", "IDLE_TIMEOUT_REAUTH_REQUIRED"],
    },
    returnIntent: {
      ...baseReturnIntent,
      returnAuthority: "recovery_only",
      intentState: "recovered",
    },
    capabilityDecision: {
      ...baseCapabilityDecision,
      decisionState: "recover_only",
      writableAuthorityState: "read_only",
      reasonCodes: ["CAP_180_SESSION_STALE_OR_EXPIRED", "CAP_180_SCOPE_RECOVER_ONLY"],
    },
    terminationSettlement: {
      settlementId: "session_termination_195_idle",
      trigger: "idle_timeout",
      projectionPosture: "session_expired",
      reasonCodes: ["IDLE_TIMEOUT", "COOKIES_ROTATED", "GRANTS_NARROWED"],
    },
    routeContinuity: baseRouteContinuity,
    routeIntentBinding: baseRouteIntentBinding,
    content: {
      eyebrow: "Session expired",
      title: "Your session timed out",
      summary:
        "The recovery page keeps your request context and shows the next safe action without restoring write access.",
      primaryAction: "Sign in again",
      secondaryAction: "View read-only summary",
      trustCue:
        "Countdown and timeout copy comes from SessionTerminationSettlement.trigger and recovery-only authority.",
      nextPath: AUTH_RECOVERY_ROUTE_PATHS.sign_in_entry,
      severity: "blocked",
    },
  },
  {
    screenKey: "signed_out_clean",
    routePath: AUTH_RECOVERY_ROUTE_PATHS.signed_out_clean,
    patientVisibleState: "signed_out_clean",
    callbackOutcomeClass: "signed_out",
    transaction: {
      ...baseTransaction,
      transactionId: "auth_txn_195_signed_out",
      transactionState: "consumed",
      callbackSettlementRef: "callback_settlement_195_signed_out",
    },
    sessionDecision: {
      ...baseSessionDecision,
      decision: "deny",
      writableAuthorityState: "none",
      reasonCodes: ["USER_SIGNED_OUT", "NO_ACTIVE_SESSION"],
    },
    returnIntent: {
      ...baseReturnIntent,
      returnAuthority: "auth_only",
      intentState: "consumed",
    },
    capabilityDecision: {
      ...baseCapabilityDecision,
      decisionState: "deny",
      writableAuthorityState: "blocked",
      reasonCodes: ["CAP_180_SESSION_REQUIRED", "CAP_180_CAPABILITY_DENIED"],
    },
    terminationSettlement: {
      settlementId: "session_termination_195_user_sign_out",
      trigger: "user_sign_out",
      projectionPosture: "signed_out",
      reasonCodes: ["USER_SIGN_OUT_COMPLETE", "COOKIE_AND_CSRF_CLEARED"],
    },
    routeContinuity: baseRouteContinuity,
    routeIntentBinding: baseRouteIntentBinding,
    content: {
      eyebrow: "Signed out",
      title: "You are signed out",
      summary:
        "The shell confirms sign-out cleanly and does not leave a blank redirect or ambiguous callback page.",
      primaryAction: "Sign in again",
      secondaryAction: "Go to request start",
      trustCue:
        "The identity chip switches to signed-out context while retaining only non-sensitive continuity copy.",
      nextPath: AUTH_RECOVERY_ROUTE_PATHS.sign_in_entry,
      severity: "neutral",
    },
  },
] as const satisfies readonly AuthRecoveryStateProjection[];

const STATE_BY_SCREEN = AUTH_RECOVERY_STATES.reduce(
  (accumulator, state) => ({
    ...accumulator,
    [state.screenKey]: state,
  }),
  {} as Record<AuthRecoveryScreenKey, AuthRecoveryStateProjection>,
);

const SCREEN_BY_PATH = Object.fromEntries(
  AUTH_RECOVERY_STATES.flatMap((state) => {
    const aliases =
      state.screenKey === "sign_in_entry"
        ? ["/auth", "/auth/"]
        : state.screenKey === "callback_holding"
          ? ["/auth/callback/holding"]
          : [];
    return [
      [state.routePath, state.screenKey],
      ...aliases.map((alias) => [alias, state.screenKey]),
    ];
  }),
) as Record<string, AuthRecoveryScreenKey | undefined>;

export function isAuthCallbackRecoveryPath(pathname: string): boolean {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}

export function getAuthRecoveryState(
  screenKey: AuthRecoveryScreenKey,
): AuthRecoveryStateProjection {
  return STATE_BY_SCREEN[screenKey];
}

export function resolveAuthRecoveryRoute(pathname: string): AuthRecoveryStateProjection {
  const normalized = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  return getAuthRecoveryState(SCREEN_BY_PATH[normalized] ?? "sign_in_entry");
}

export function resolveAuthRecoveryScreenKey(
  projection: AuthRecoveryStateProjection,
): AuthRecoveryScreenKey {
  if (projection.terminationSettlement.trigger === "user_sign_out") {
    return "signed_out_clean";
  }

  if (
    projection.terminationSettlement.trigger === "idle_timeout" ||
    projection.terminationSettlement.trigger === "absolute_timeout" ||
    projection.transaction.transactionState === "expired"
  ) {
    return "session_expired";
  }

  if (projection.callbackOutcomeClass === "consent_declined") {
    return "consent_declined";
  }

  if (
    projection.callbackOutcomeClass === "insufficient_assurance" ||
    projection.capabilityDecision.decisionState === "step_up_required"
  ) {
    return "higher_assurance_required";
  }

  if (
    projection.transaction.transactionState === "awaiting_callback" ||
    projection.transaction.transactionState === "callback_received"
  ) {
    return "callback_holding";
  }

  if (
    projection.transaction.transactionState === "opened" &&
    projection.callbackOutcomeClass === "not_started"
  ) {
    return "sign_in_entry";
  }

  if (
    projection.routeIntentBinding.validity !== "valid" ||
    projection.routeContinuity.routeFenceState !== "aligned" ||
    projection.capabilityDecision.decisionState === "recover_only"
  ) {
    return "safe_re_entry";
  }

  if (
    projection.sessionDecision.decision !== "deny" &&
    projection.sessionDecision.writableAuthorityState === "writable" &&
    projection.returnIntent.returnAuthority === "writable_resume" &&
    projection.returnIntent.intentState === "pending" &&
    projection.capabilityDecision.decisionState === "allow"
  ) {
    return "confirming_details";
  }

  return "sign_in_entry";
}

export function resolveAuthRecoveryContractRows() {
  return AUTH_RECOVERY_STATES.map((state) => ({
    screenKey: state.screenKey,
    routePath: state.routePath,
    transactionState: state.transaction.transactionState,
    callbackOutcomeClass: state.callbackOutcomeClass,
    sessionDecision: state.sessionDecision.decision,
    writableAuthorityState: state.sessionDecision.writableAuthorityState,
    returnAuthority: state.returnIntent.returnAuthority,
    intentState: state.returnIntent.intentState,
    capabilityDecisionState: state.capabilityDecision.decisionState,
    terminationTrigger: state.terminationSettlement.trigger,
    routeFenceState: state.routeContinuity.routeFenceState,
    routeIntentBindingValidity: state.routeIntentBinding.validity,
  }));
}
