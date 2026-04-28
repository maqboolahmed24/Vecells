import {
  EMBEDDED_PATIENT_ROUTE_TREE,
  buildEmbeddedShellUrl,
  resolveEmbeddedShellContext,
  type EmbeddedRouteFamily,
  type EmbeddedShellRouteNode,
} from "./embedded-shell-split.model";

export const EMBEDDED_ENTRY_TASK_ID = "par_388";
export const EMBEDDED_ENTRY_VISUAL_MODE = "NHSApp_Embedded_Entry_Corridor";
export const EMBEDDED_ENTRY_STORAGE_KEY = "vecells.phase7.embedded-entry.redaction";
export const EMBEDDED_ENTRY_ROUTE_TREE_VERSION = "phase7.embedded-entry-route-tree.v1";
export const EMBEDDED_ENTRY_POLICY_REF = "EmbeddedEntryCorridorPolicy:388:phase7-sso-entry";
export const EMBEDDED_ENTRY_SESSION_POLICY_REF = "SessionMergePolicy:phase2-local-session-continuity";
export const EMBEDDED_ENTRY_GRANT_REF = "SSOEntryGrant:388:nhs-app-jump-off";
export const EMBEDDED_ENTRY_BRIDGE_TX_REF = "AuthBridgeTransaction:388:silent-reauth";

export type EmbeddedEntryStateId =
  | "secure_entry_landing"
  | "opening_nhs_login"
  | "confirming_details"
  | "silent_reauth_success"
  | "consent_denied"
  | "expired_session"
  | "safe_reentry"
  | "wrong_context_recovery"
  | "silent_failure";

export type EmbeddedEntryParam =
  | "landing"
  | "opening"
  | "confirming"
  | "success"
  | "reauth_success"
  | "consent_denied"
  | "expired"
  | "safe_reentry"
  | "wrong_context"
  | "failure";

export type EmbeddedEntryTone = "neutral" | "accent" | "success" | "warning" | "blocked";
export type EmbeddedEntryActionKind =
  | "begin_login"
  | "wait"
  | "handoff_shell"
  | "restart"
  | "return_host"
  | "safe_retry";

export interface EmbeddedEntryStateDefinition {
  readonly id: EmbeddedEntryStateId;
  readonly param: EmbeddedEntryParam;
  readonly title: string;
  readonly detail: string;
  readonly tone: EmbeddedEntryTone;
  readonly progressIndex: number;
  readonly ariaLive: "polite" | "assertive";
  readonly role: "status" | "alert";
  readonly primaryActionLabel: string;
  readonly secondaryActionLabel: string | null;
  readonly actionKind: EmbeddedEntryActionKind;
  readonly shellHandoffAllowed: boolean;
}

export interface SSOEntryGrant {
  readonly grantRef: string;
  readonly channelRef: "nhs_app_embedded";
  readonly grantStatus:
    | "ready"
    | "opening"
    | "confirming"
    | "verified"
    | "declined"
    | "expired"
    | "blocked";
  readonly identityEvidenceRef: string;
  readonly rawUrlRedacted: boolean;
  readonly receivedAt: string;
}

export interface AuthBridgeTransaction {
  readonly transactionRef: string;
  readonly entryGrantRef: string;
  readonly routeFamilyRef: EmbeddedRouteFamily;
  readonly routePath: string;
  readonly verificationPosture:
    | "not_started"
    | "opening"
    | "confirming"
    | "confirmed"
    | "declined"
    | "expired"
    | "blocked";
  readonly browserHistoryPosture: "scrubbed" | "clean";
}

export interface SessionMergePolicy {
  readonly policyRef: string;
  readonly continuityMode: "same_patient_shell";
  readonly mergeDecisionRefs: readonly string[];
  readonly expiryCopyRef: string;
}

export interface IdentityAssertionBinding {
  readonly bindingRef: string;
  readonly bindingStatus: "absent" | "redacted_present" | "bound" | "rejected";
  readonly redactedFingerprintRef: string | null;
  readonly patientBindingScope: "route_subject_only";
}

export interface SessionMergeDecision {
  readonly decisionRef: string;
  readonly decision:
    | "not_started"
    | "open_login"
    | "merge_local_session"
    | "keep_safe_reentry"
    | "deny_merge"
    | "restart_required";
  readonly rationale: string;
  readonly shellContinuityKey: string;
}

export interface ReturnIntent {
  readonly intentRef: string;
  readonly routeFamilyRef: EmbeddedRouteFamily;
  readonly selectedAnchorRef: string;
  readonly shellUrl: string;
  readonly visibleSummary: string;
}

export interface SSOReturnDisposition {
  readonly dispositionRef: string;
  readonly disposition:
    | "entry_ready"
    | "opening"
    | "confirming"
    | "shell_handoff"
    | "host_retry"
    | "consent_declined"
    | "session_expired"
    | "wrong_context"
    | "silent_failure";
  readonly patientVisibleState: string;
}

export interface EmbeddedEntryCorridorContext {
  readonly taskId: typeof EMBEDDED_ENTRY_TASK_ID;
  readonly visualMode: typeof EMBEDDED_ENTRY_VISUAL_MODE;
  readonly routeTreeVersion: typeof EMBEDDED_ENTRY_ROUTE_TREE_VERSION;
  readonly entryPolicyRef: typeof EMBEDDED_ENTRY_POLICY_REF;
  readonly entryState: EmbeddedEntryStateDefinition;
  readonly routeNode: EmbeddedShellRouteNode;
  readonly returnIntent: ReturnIntent;
  readonly ssoEntryGrant: SSOEntryGrant;
  readonly authBridgeTransaction: AuthBridgeTransaction;
  readonly sessionMergePolicy: SessionMergePolicy;
  readonly identityAssertionBinding: IdentityAssertionBinding;
  readonly sessionMergeDecision: SessionMergeDecision;
  readonly ssoReturnDisposition: SSOReturnDisposition;
  readonly shellContinuityKey: string;
  readonly selectedAnchorRef: string;
  readonly sanitizedSearch: string;
  readonly sensitiveUrlRedacted: boolean;
}

const SENSITIVE_QUERY_KEYS = [
  "assertedLoginIdentity",
  "asserted_login_identity",
  "jwt",
  "JWT",
  "token",
  "access_token",
  "id_token",
  "refresh_token",
  "code",
  "nonce",
  "state",
  "pkce",
  "PKCE",
  "error",
  "error_description",
] as const;

const ROUTE_FAMILY_TO_ROUTE = new Map<EmbeddedRouteFamily, EmbeddedShellRouteNode>(
  EMBEDDED_PATIENT_ROUTE_TREE.map((route) => [route.routeFamilyRef, route]),
);

export const EMBEDDED_ENTRY_PROGRESS_STEPS = [
  "App entry",
  "NHS login",
  "Details check",
  "Open journey",
] as const;

const DEFAULT_ROUTE = ROUTE_FAMILY_TO_ROUTE.get("request_status") ?? EMBEDDED_PATIENT_ROUTE_TREE[0]!;

const STATE_DEFINITIONS: Record<EmbeddedEntryParam, EmbeddedEntryStateDefinition> = {
  landing: {
    id: "secure_entry_landing",
    param: "landing",
    title: "Open request status",
    detail: "We will check your NHS login and keep your place before opening the journey.",
    tone: "accent",
    progressIndex: 0,
    ariaLive: "polite",
    role: "status",
    primaryActionLabel: "Continue with NHS login",
    secondaryActionLabel: "Back to NHS App",
    actionKind: "begin_login",
    shellHandoffAllowed: false,
  },
  opening: {
    id: "opening_nhs_login",
    param: "opening",
    title: "Opening your NHS login",
    detail: "Keep this screen open while the NHS App checks your sign-in.",
    tone: "accent",
    progressIndex: 1,
    ariaLive: "polite",
    role: "status",
    primaryActionLabel: "Waiting for NHS login",
    secondaryActionLabel: "Back to NHS App",
    actionKind: "wait",
    shellHandoffAllowed: false,
  },
  confirming: {
    id: "confirming_details",
    param: "confirming",
    title: "Confirming your details",
    detail: "This usually takes a few seconds. We will keep your request status ready.",
    tone: "accent",
    progressIndex: 2,
    ariaLive: "polite",
    role: "status",
    primaryActionLabel: "Waiting for confirmation",
    secondaryActionLabel: "Back to NHS App",
    actionKind: "wait",
    shellHandoffAllowed: false,
  },
  success: {
    id: "silent_reauth_success",
    param: "success",
    title: "You are signed in",
    detail: "Your request status is ready to open inside the NHS App.",
    tone: "success",
    progressIndex: 3,
    ariaLive: "polite",
    role: "status",
    primaryActionLabel: "Continue to request status",
    secondaryActionLabel: null,
    actionKind: "handoff_shell",
    shellHandoffAllowed: true,
  },
  reauth_success: {
    id: "silent_reauth_success",
    param: "reauth_success",
    title: "You are still signed in",
    detail: "We kept the same NHS App journey and confirmed your access.",
    tone: "success",
    progressIndex: 3,
    ariaLive: "polite",
    role: "status",
    primaryActionLabel: "Return to this journey",
    secondaryActionLabel: null,
    actionKind: "handoff_shell",
    shellHandoffAllowed: true,
  },
  consent_denied: {
    id: "consent_denied",
    param: "consent_denied",
    title: "You chose not to use your NHS login",
    detail: "We could not continue this NHS App journey without that permission.",
    tone: "warning",
    progressIndex: 1,
    ariaLive: "assertive",
    role: "alert",
    primaryActionLabel: "Back to NHS App",
    secondaryActionLabel: "Try NHS login again",
    actionKind: "return_host",
    shellHandoffAllowed: false,
  },
  expired: {
    id: "expired_session",
    param: "expired",
    title: "Your session has ended",
    detail: "For your privacy, sign in again from the NHS App before viewing this journey.",
    tone: "warning",
    progressIndex: 0,
    ariaLive: "assertive",
    role: "alert",
    primaryActionLabel: "Sign in again",
    secondaryActionLabel: "Back to NHS App",
    actionKind: "restart",
    shellHandoffAllowed: false,
  },
  safe_reentry: {
    id: "safe_reentry",
    param: "safe_reentry",
    title: "Please go back to the NHS App and try again",
    detail: "The journey did not open from a trusted NHS App handoff.",
    tone: "blocked",
    progressIndex: 0,
    ariaLive: "assertive",
    role: "alert",
    primaryActionLabel: "Back to NHS App",
    secondaryActionLabel: null,
    actionKind: "safe_retry",
    shellHandoffAllowed: false,
  },
  wrong_context: {
    id: "wrong_context_recovery",
    param: "wrong_context",
    title: "We could not sign you in here",
    detail: "The NHS App journey and this request did not match, so we stopped before opening details.",
    tone: "blocked",
    progressIndex: 0,
    ariaLive: "assertive",
    role: "alert",
    primaryActionLabel: "Back to NHS App",
    secondaryActionLabel: "Try NHS login again",
    actionKind: "return_host",
    shellHandoffAllowed: false,
  },
  failure: {
    id: "silent_failure",
    param: "failure",
    title: "We could not sign you in here",
    detail: "The NHS App could not confirm this journey. Please go back and try again.",
    tone: "blocked",
    progressIndex: 1,
    ariaLive: "assertive",
    role: "alert",
    primaryActionLabel: "Back to NHS App",
    secondaryActionLabel: "Try NHS login again",
    actionKind: "safe_retry",
    shellHandoffAllowed: false,
  },
};

export function getEmbeddedEntryStateDefinition(param: EmbeddedEntryParam): EmbeddedEntryStateDefinition {
  return STATE_DEFINITIONS[param];
}

function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim() || "/nhs-app/entry";
  return trimmed === "/" ? "/nhs-app/entry" : trimmed.replace(/\/+$/, "") || "/nhs-app/entry";
}

export function isEmbeddedEntryCorridorPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return (
    normalized === "/nhs-app/entry" ||
    normalized.startsWith("/nhs-app/entry/") ||
    normalized === "/embedded-entry" ||
    normalized.startsWith("/embedded-entry/") ||
    normalized === "/auth/nhs-app/entry" ||
    normalized.startsWith("/auth/nhs-app/entry/") ||
    normalized === "/nhs-app/sign-in" ||
    normalized.startsWith("/nhs-app/sign-in/")
  );
}

function routeForParam(params: URLSearchParams): EmbeddedShellRouteNode {
  const route = params.get("route");
  if (
    route === "patient_home" ||
    route === "request_status" ||
    route === "appointment_manage" ||
    route === "record_letter_summary" ||
    route === "patient_message_thread"
  ) {
    return ROUTE_FAMILY_TO_ROUTE.get(route) ?? DEFAULT_ROUTE;
  }
  return DEFAULT_ROUTE;
}

function entryParamFor(params: URLSearchParams): EmbeddedEntryParam {
  const entry = params.get("entry");
  if (
    entry === "landing" ||
    entry === "opening" ||
    entry === "confirming" ||
    entry === "success" ||
    entry === "reauth_success" ||
    entry === "consent_denied" ||
    entry === "expired" ||
    entry === "safe_reentry" ||
    entry === "wrong_context" ||
    entry === "failure"
  ) {
    return entry;
  }
  if (params.get("error_description") === "ConsentNotGiven") {
    return "consent_denied";
  }
  if (params.get("error") === "access_denied") {
    return "consent_denied";
  }
  return "landing";
}

function hasSensitiveValue(params: URLSearchParams): boolean {
  return SENSITIVE_QUERY_KEYS.some((key) => params.has(key));
}

function redactionFingerprint(params: URLSearchParams): string | null {
  let hash = 2166136261;
  let seen = false;
  for (const key of SENSITIVE_QUERY_KEYS) {
    const value = params.get(key);
    if (!value) continue;
    seen = true;
    const input = `${key}:${value}`;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
  }
  return seen ? `redacted-${(hash >>> 0).toString(16)}` : null;
}

export function sanitizeEmbeddedEntrySearch(search: string | URLSearchParams): {
  readonly search: string;
  readonly sensitiveUrlRedacted: boolean;
  readonly redactedFingerprintRef: string | null;
} {
  const params = search instanceof URLSearchParams ? new URLSearchParams(search) : new URLSearchParams(search);
  const fingerprint = redactionFingerprint(params);
  const sensitiveUrlRedacted = hasSensitiveValue(params);
  for (const key of SENSITIVE_QUERY_KEYS) {
    params.delete(key);
  }
  const sanitized = params.toString();
  return {
    search: sanitized ? `?${sanitized}` : "",
    sensitiveUrlRedacted,
    redactedFingerprintRef: fingerprint,
  };
}

export function buildEmbeddedEntryUrl(input: {
  readonly route: EmbeddedShellRouteNode;
  readonly entry: EmbeddedEntryParam;
}): string {
  const params = new URLSearchParams();
  params.set("entry", input.entry);
  params.set("route", input.route.routeFamilyRef);
  params.set("channel", "nhs_app");
  return `/nhs-app/entry?${params.toString()}`;
}

function grantStatusFor(entry: EmbeddedEntryParam): SSOEntryGrant["grantStatus"] {
  switch (entry) {
    case "landing":
      return "ready";
    case "opening":
      return "opening";
    case "confirming":
      return "confirming";
    case "success":
    case "reauth_success":
      return "verified";
    case "consent_denied":
      return "declined";
    case "expired":
      return "expired";
    case "safe_reentry":
    case "wrong_context":
    case "failure":
      return "blocked";
  }
}

function verificationPostureFor(entry: EmbeddedEntryParam): AuthBridgeTransaction["verificationPosture"] {
  switch (entry) {
    case "landing":
      return "not_started";
    case "opening":
      return "opening";
    case "confirming":
      return "confirming";
    case "success":
    case "reauth_success":
      return "confirmed";
    case "consent_denied":
      return "declined";
    case "expired":
      return "expired";
    case "safe_reentry":
    case "wrong_context":
    case "failure":
      return "blocked";
  }
}

function mergeDecisionFor(input: {
  readonly entry: EmbeddedEntryParam;
  readonly route: EmbeddedShellRouteNode;
  readonly shellContinuityKey: string;
}): SessionMergeDecision {
  const base = {
    decisionRef: `SessionMergeDecision:388:${input.route.routeId}:${input.entry}`,
    shellContinuityKey: input.shellContinuityKey,
  };
  switch (input.entry) {
    case "landing":
      return {
        ...base,
        decision: "not_started",
        rationale: "Entry is ready and will not open patient details until the NHS App journey is confirmed.",
      };
    case "opening":
      return {
        ...base,
        decision: "open_login",
        rationale: "The NHS App sign-in handoff has started and route intent remains preserved.",
      };
    case "confirming":
      return {
        ...base,
        decision: "open_login",
        rationale: "The same route intent waits while patient details are confirmed.",
      };
    case "success":
    case "reauth_success":
      return {
        ...base,
        decision: "merge_local_session",
        rationale: "The entry corridor can hand off to the existing embedded shell with the selected anchor intact.",
      };
    case "consent_denied":
      return {
        ...base,
        decision: "deny_merge",
        rationale: "The patient declined the NHS login sharing step, so the local shell remains closed.",
      };
    case "expired":
      return {
        ...base,
        decision: "restart_required",
        rationale: "The previous local session is not reused after expiry.",
      };
    case "safe_reentry":
    case "wrong_context":
    case "failure":
      return {
        ...base,
        decision: "keep_safe_reentry",
        rationale: "The route stays bounded and asks the patient to restart from the NHS App.",
      };
  }
}

function dispositionFor(entry: EmbeddedEntryParam): SSOReturnDisposition["disposition"] {
  switch (entry) {
    case "landing":
      return "entry_ready";
    case "opening":
      return "opening";
    case "confirming":
      return "confirming";
    case "success":
    case "reauth_success":
      return "shell_handoff";
    case "consent_denied":
      return "consent_declined";
    case "expired":
      return "session_expired";
    case "wrong_context":
      return "wrong_context";
    case "safe_reentry":
      return "host_retry";
    case "failure":
      return "silent_failure";
  }
}

export function resolveEmbeddedEntryCorridorContext(input: {
  readonly pathname: string;
  readonly search?: string;
  readonly userAgent?: string;
  readonly redactionObserved?: boolean;
}): EmbeddedEntryCorridorContext {
  const originalParams = new URLSearchParams(input.search ?? "");
  const entryParam = entryParamFor(originalParams);
  const route = routeForParam(originalParams);
  const sanitized = sanitizeEmbeddedEntrySearch(originalParams);
  const shellContext = resolveEmbeddedShellContext({
    pathname: route.embeddedPath,
    search: "?context=signed&shell=embedded&channel=nhs_app",
    userAgent: input.userAgent,
  });
  const entryState = getEmbeddedEntryStateDefinition(entryParam);
  const shellUrl = buildEmbeddedShellUrl(route, "embedded", { signedContext: true });
  const sensitiveUrlRedacted = sanitized.sensitiveUrlRedacted || Boolean(input.redactionObserved);
  const bindingStatus: IdentityAssertionBinding["bindingStatus"] =
    sanitized.redactedFingerprintRef || sensitiveUrlRedacted
      ? entryState.shellHandoffAllowed
        ? "bound"
        : "redacted_present"
      : "absent";

  return {
    taskId: EMBEDDED_ENTRY_TASK_ID,
    visualMode: EMBEDDED_ENTRY_VISUAL_MODE,
    routeTreeVersion: EMBEDDED_ENTRY_ROUTE_TREE_VERSION,
    entryPolicyRef: EMBEDDED_ENTRY_POLICY_REF,
    entryState,
    routeNode: route,
    returnIntent: {
      intentRef: `ReturnIntent:388:${route.routeId}`,
      routeFamilyRef: route.routeFamilyRef,
      selectedAnchorRef: route.selectedAnchorRef,
      shellUrl,
      visibleSummary: `Returning to ${route.routeTitle}.`,
    },
    ssoEntryGrant: {
      grantRef: EMBEDDED_ENTRY_GRANT_REF,
      channelRef: "nhs_app_embedded",
      grantStatus: grantStatusFor(entryParam),
      identityEvidenceRef:
        sanitized.redactedFingerprintRef ?? `IdentityEvidence:388:${route.routeId}:not-received`,
      rawUrlRedacted: sensitiveUrlRedacted,
      receivedAt: "2026-04-27T09:05:00Z",
    },
    authBridgeTransaction: {
      transactionRef: EMBEDDED_ENTRY_BRIDGE_TX_REF,
      entryGrantRef: EMBEDDED_ENTRY_GRANT_REF,
      routeFamilyRef: route.routeFamilyRef,
      routePath: route.embeddedPath,
      verificationPosture: verificationPostureFor(entryParam),
      browserHistoryPosture: sensitiveUrlRedacted ? "scrubbed" : "clean",
    },
    sessionMergePolicy: {
      policyRef: EMBEDDED_ENTRY_SESSION_POLICY_REF,
      continuityMode: "same_patient_shell",
      mergeDecisionRefs: [
        `SessionMergeDecision:388:${route.routeId}:success`,
        `SessionMergeDecision:388:${route.routeId}:failure`,
      ],
      expiryCopyRef: "ExpiredSessionCopy:388:nhs-app-entry",
    },
    identityAssertionBinding: {
      bindingRef: `IdentityAssertionBinding:388:${route.routeId}`,
      bindingStatus,
      redactedFingerprintRef: sanitized.redactedFingerprintRef,
      patientBindingScope: "route_subject_only",
    },
    sessionMergeDecision: mergeDecisionFor({
      entry: entryParam,
      route,
      shellContinuityKey: shellContext.patientShellContinuityKey,
    }),
    ssoReturnDisposition: {
      dispositionRef: `SSOReturnDisposition:388:${route.routeId}:${entryParam}`,
      disposition: dispositionFor(entryParam),
      patientVisibleState: entryState.title,
    },
    shellContinuityKey: shellContext.patientShellContinuityKey,
    selectedAnchorRef: route.selectedAnchorRef,
    sanitizedSearch: sanitized.search,
    sensitiveUrlRedacted,
  };
}
