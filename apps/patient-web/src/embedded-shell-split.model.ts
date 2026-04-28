import {
  patientAppointments,
  patientIdentitySummary,
  patientRecords,
  patientRequests,
  patientThreads,
  type PatientAppointmentProjection,
  type PatientRecordProjection,
  type PatientRequestProjection,
  type PatientThreadProjection,
} from "./patient-shell-seed.model";

export const EMBEDDED_SHELL_TASK_ID = "par_387";
export const EMBEDDED_SHELL_VISUAL_MODE = "NHSApp_Embedded_Patient_Shell";
export const EMBEDDED_SHELL_STORAGE_KEY = "vecells.phase7.embedded-shell.continuity";
export const EMBEDDED_SHELL_MANIFEST_VERSION = "nhsapp-manifest-v0.1.0-freeze-374";
export const EMBEDDED_SHELL_RELEASE_FREEZE_REF =
  "ReleaseApprovalFreeze:RAF-P7-374-CONTRACT-FREEZE";
export const EMBEDDED_SHELL_BRIDGE_CAPABILITY_MATRIX_REF =
  "BridgeCapabilityMatrix:381-sandpit-verification-current";
export const EMBEDDED_SHELL_MINIMUM_BRIDGE_CAPABILITY_REF =
  "MinimumBridgeCapabilities:phase7-embedded-floor-375-pending";
export const EMBEDDED_SHELL_COMPATIBILITY_EVIDENCE_REF =
  "CompatibilityEvidence:phase7-bridge-floor-freeze-374";

export type EmbeddedShellMode = "standalone" | "embedded";
export type EmbeddedChannelProfile = "browser" | "nhs_app" | "constrained_browser";
export type EmbeddedTrustTier =
  | "standalone_web"
  | "trusted_embedded"
  | "user_agent_observed"
  | "query_hint_only"
  | "invalid";
export type EmbeddedShellState = "live" | "revalidate_only" | "recovery_only" | "blocked";
export type EmbeddedRecoveryReason =
  | "none"
  | "signed_context_missing"
  | "stale_continuity"
  | "wrong_patient"
  | "route_freeze"
  | "eligibility_blocked"
  | "shell_drift";
export type EmbeddedNavEligibilityState =
  | "live"
  | "read_only"
  | "placeholder_only"
  | "safe_browser_handoff"
  | "recovery_required"
  | "blocked";
export type EmbeddedRouteFamily =
  | "patient_home"
  | "request_status"
  | "appointment_manage"
  | "record_letter_summary"
  | "patient_message_thread";
export type EmbeddedRouteId =
  | "jp_patient_home"
  | "jp_request_status"
  | "jp_manage_local_appointment"
  | "jp_records_letters_summary"
  | "jp_patient_message_thread";

export interface EmbeddedShellRouteNode {
  readonly routeId: EmbeddedRouteId;
  readonly routeFamilyRef: EmbeddedRouteFamily;
  readonly routeTitle: string;
  readonly standalonePath: string;
  readonly embeddedPath: string;
  readonly entityId: string;
  readonly entityLabel: string;
  readonly entityContinuityKey: string;
  readonly selectedAnchorRef: string;
  readonly statusLabel: string;
  readonly statusTone: "success" | "caution" | "blocked" | "neutral";
  readonly consentSummary: string;
  readonly errorSummary: string | null;
  readonly summary: string;
  readonly routeFacts: readonly string[];
  readonly dominantActionLabel: string;
  readonly primarySupportLabel: string;
  readonly dataSourceRef: string;
  readonly sourceProjection:
    | PatientRequestProjection
    | PatientAppointmentProjection
    | PatientRecordProjection
    | PatientThreadProjection
    | null;
}

export interface ShellPolicy {
  readonly shellPolicyId: string;
  readonly channelType: EmbeddedChannelProfile;
  readonly showHeader: boolean;
  readonly showFooter: boolean;
  readonly showBackLink: boolean;
  readonly safeAreaInsetsMode: "none" | "host_controlled";
  readonly externalLinkMode: "normal_browser" | "safe_browser_handoff" | "blocked";
  readonly downloadMode: "portal" | "summary_then_handoff" | "blocked";
}

export interface PatientEmbeddedNavEligibility {
  readonly embeddedNavEligibilityId: string;
  readonly journeyPathRef: EmbeddedRouteId;
  readonly routeFamilyRef: EmbeddedRouteFamily;
  readonly patientEmbeddedSessionProjectionRef: string;
  readonly bridgeCapabilityMatrixRef: string;
  readonly minimumBridgeCapabilitiesRef: string;
  readonly requiredBridgeActionRefs: readonly string[];
  readonly allowedBridgeActionRefs: readonly string[];
  readonly fallbackActionRefs: readonly string[];
  readonly routeFreezeDispositionRef: string;
  readonly continuityEvidenceRef: string;
  readonly eligibilityState: EmbeddedNavEligibilityState;
  readonly evaluatedAt: string;
}

export interface EmbeddedShellConsistencyProjection {
  readonly consistencyId: string;
  readonly journeyPathId: EmbeddedRouteId;
  readonly patientShellContinuityKey: string;
  readonly entityContinuityKey: string;
  readonly bundleVersion: string;
  readonly audienceTier: "patient_authenticated" | "patient_revalidation";
  readonly governingObjectVersionRefs: readonly string[];
  readonly selectedAnchorRef: string;
  readonly returnContractRef: string;
  readonly placeholderContractRefs: readonly string[];
  readonly continuityEvidenceRefs: readonly string[];
  readonly currentBridgeCapabilityMatrixRef: string;
  readonly patientEmbeddedNavEligibilityRef: string;
  readonly shellState: EmbeddedShellState;
  readonly computedAt: string;
  readonly staleAt: string;
  readonly causalConsistencyState: "valid" | "stale" | "blocked";
  readonly projectionTrustState: EmbeddedTrustTier;
}

export interface EmbeddedRecoveryPosture {
  readonly reason: EmbeddedRecoveryReason;
  readonly title: string;
  readonly detail: string;
  readonly nextStep: string;
  readonly ariaLive: "polite" | "assertive";
  readonly dominantActionLabel: string;
  readonly mutationState: "enabled" | "frozen";
}

export interface EmbeddedShellContext {
  readonly taskId: typeof EMBEDDED_SHELL_TASK_ID;
  readonly visualMode: typeof EMBEDDED_SHELL_VISUAL_MODE;
  readonly shellMode: EmbeddedShellMode;
  readonly channelProfile: EmbeddedChannelProfile;
  readonly trustTier: EmbeddedTrustTier;
  readonly shellState: EmbeddedShellState;
  readonly recovery: EmbeddedRecoveryPosture;
  readonly routeNode: EmbeddedShellRouteNode;
  readonly shellPolicy: ShellPolicy;
  readonly consistencyProjection: EmbeddedShellConsistencyProjection;
  readonly navEligibility: PatientEmbeddedNavEligibility;
  readonly patientShellContinuityKey: string;
  readonly entityContinuityKey: string;
  readonly selectedAnchorRef: string;
  readonly returnContractRef: string;
  readonly returnHandoffRef: string | null;
  readonly continuityRestored: boolean;
  readonly routeTreeVersion: "phase7.embedded-shell-route-tree.v1";
}

export interface EmbeddedContinuityEnvelope {
  readonly patientShellContinuityKey: string;
  readonly entityContinuityKey: string;
  readonly selectedAnchorRef: string;
  readonly returnContractRef: string;
  readonly shellState: EmbeddedShellState;
  readonly shellMode: EmbeddedShellMode;
  readonly routeId: EmbeddedRouteId;
  readonly storedAt: string;
}

const defaultRequest = patientRequests[0]!;
const defaultAppointment = patientAppointments[0]!;
const defaultRecord = patientRecords.find((record) => record.id === "REC-LET-3") ?? patientRecords[1]!;
const defaultThread = patientThreads[0]!;

export const EMBEDDED_PATIENT_ROUTE_TREE: readonly EmbeddedShellRouteNode[] = [
  {
    routeId: "jp_patient_home",
    routeFamilyRef: "patient_home",
    routeTitle: `${patientIdentitySummary.givenName}'s NHS App continuity`,
    standalonePath: "/home",
    embeddedPath: "/nhs-app/home",
    entityId: "patient-home",
    entityLabel: patientIdentitySummary.fullName,
    entityContinuityKey: "EntityContinuity:patient-home:samira-ahmed:v1",
    selectedAnchorRef: "SelectedAnchor:patient-home:attention-summary",
    statusLabel: "Same-shell home",
    statusTone: "success",
    consentSummary: "Authenticated patient session; no new consent prompt is implied by shell mode.",
    errorSummary: null,
    summary:
      "The embedded channel starts in the same patient shell and keeps the current request, record, and message summaries visible.",
    routeFacts: [
      `${defaultRequest.id}: ${defaultRequest.title}`,
      `${defaultRecord.id}: ${defaultRecord.title}`,
      `${defaultThread.id}: ${defaultThread.subject}`,
    ],
    dominantActionLabel: "Continue the current request",
    primarySupportLabel: "View route continuity",
    dataSourceRef: "PatientShellSeedProjection:home",
    sourceProjection: null,
  },
  {
    routeId: "jp_request_status",
    routeFamilyRef: "request_status",
    routeTitle: "Request status",
    standalonePath: `/requests/${defaultRequest.id}/status`,
    embeddedPath: `/nhs-app/requests/${defaultRequest.id}/status`,
    entityId: defaultRequest.id,
    entityLabel: defaultRequest.title,
    entityContinuityKey: `EntityContinuity:request:${defaultRequest.id}:status:v1`,
    selectedAnchorRef: `SelectedAnchor:request:${defaultRequest.id}:status-summary`,
    statusLabel: "Reply needed",
    statusTone: "caution",
    consentSummary: "Reply controls remain governed by the active request lineage and embedded eligibility.",
    errorSummary: null,
    summary: defaultRequest.summary,
    routeFacts: defaultRequest.lineage,
    dominantActionLabel: "Open the requested reply",
    primarySupportLabel: "Review request lineage",
    dataSourceRef: `PatientRequestProjection:${defaultRequest.id}`,
    sourceProjection: defaultRequest,
  },
  {
    routeId: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    routeTitle: "Appointment manage",
    standalonePath: `/appointments/${defaultAppointment.id}/manage`,
    embeddedPath: `/nhs-app/appointments/${defaultAppointment.id}/manage`,
    entityId: defaultAppointment.id,
    entityLabel: defaultAppointment.title,
    entityContinuityKey: `EntityContinuity:appointment:${defaultAppointment.id}:manage:v1`,
    selectedAnchorRef: `SelectedAnchor:appointment:${defaultAppointment.id}:manage-summary`,
    statusLabel: "Read-only confirmation",
    statusTone: "caution",
    consentSummary: "Appointment changes remain fenced until route-freeze and bridge capability truth agree.",
    errorSummary: "Live appointment mutation is not shown unless the route freeze disposition is live.",
    summary: defaultAppointment.summary,
    routeFacts: [
      defaultAppointment.dateLabel,
      defaultAppointment.locationLabel,
      defaultAppointment.trustCue,
    ],
    dominantActionLabel: defaultAppointment.manageLabel,
    primarySupportLabel: "Keep last safe appointment summary",
    dataSourceRef: `PatientAppointmentProjection:${defaultAppointment.id}`,
    sourceProjection: defaultAppointment,
  },
  {
    routeId: "jp_records_letters_summary",
    routeFamilyRef: "record_letter_summary",
    routeTitle: "Record letter summary",
    standalonePath: `/records/letters/${defaultRecord.id}`,
    embeddedPath: `/nhs-app/records/letters/${defaultRecord.id}`,
    entityId: defaultRecord.id,
    entityLabel: defaultRecord.title,
    entityContinuityKey: `EntityContinuity:record:${defaultRecord.id}:letter-summary:v1`,
    selectedAnchorRef: `SelectedAnchor:record:${defaultRecord.id}:letter-summary`,
    statusLabel: "Summary first",
    statusTone: "success",
    consentSummary: "The record summary stays visible; document delivery remains governed separately.",
    errorSummary: null,
    summary: defaultRecord.summary,
    routeFacts: [
      defaultRecord.detailSummary,
      defaultRecord.trustCue,
      `Updated ${defaultRecord.updatedAt.slice(0, 10)}`,
    ],
    dominantActionLabel: defaultRecord.followUpLabel,
    primarySupportLabel: "Review record provenance",
    dataSourceRef: `PatientRecordProjection:${defaultRecord.id}`,
    sourceProjection: defaultRecord,
  },
  {
    routeId: "jp_patient_message_thread",
    routeFamilyRef: "patient_message_thread",
    routeTitle: "Message thread",
    standalonePath: `/messages/thread/${defaultThread.id}`,
    embeddedPath: `/nhs-app/messages/thread/${defaultThread.id}`,
    entityId: defaultThread.id,
    entityLabel: defaultThread.subject,
    entityContinuityKey: `EntityContinuity:thread:${defaultThread.id}:message:v1`,
    selectedAnchorRef: `SelectedAnchor:thread:${defaultThread.id}:message-summary`,
    statusLabel: "Reply needed",
    statusTone: "caution",
    consentSummary: "Messaging reply posture is tied to contact-route truth and active thread lineage.",
    errorSummary: null,
    summary: defaultThread.preview,
    routeFacts: defaultThread.threadLines.map((line) => `${line.speaker}: ${line.body}`),
    dominantActionLabel: "Continue this thread",
    primarySupportLabel: "Review message provenance",
    dataSourceRef: `PatientThreadProjection:${defaultThread.id}`,
    sourceProjection: defaultThread,
  },
] as const;

const routeById = new Map(EMBEDDED_PATIENT_ROUTE_TREE.map((route) => [route.routeId, route]));

function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim() || "/home";
  return trimmed === "/" ? "/home" : trimmed.replace(/\/+$/, "") || "/home";
}

function hasEmbeddedShellQuery(search: string | URLSearchParams): boolean {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  return (
    params.has("shell") ||
    params.has("channel") ||
    params.has("from") ||
    params.get("phase7") === "embedded_shell" ||
    params.get("context") === "signed"
  );
}

function isRouteTreePath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return (
    normalized === "/home" ||
    normalized === "/embedded-shell" ||
    normalized === "/embedded-shell/home" ||
    /^\/requests\/[^/]+\/status$/.test(normalized) ||
    /^\/appointments\/[^/]+\/manage$/.test(normalized) ||
    /^\/records\/letters\/[^/]+$/.test(normalized) ||
    /^\/messages\/thread\/[^/]+$/.test(normalized)
  );
}

export function isEmbeddedShellSplitPath(pathname: string, search = ""): boolean {
  const normalized = normalizePathname(pathname);
  if (
    normalized === "/nhs-app" ||
    normalized.startsWith("/nhs-app/") ||
    normalized === "/embedded-shell" ||
    normalized.startsWith("/embedded-shell/")
  ) {
    return true;
  }
  return hasEmbeddedShellQuery(search) && isRouteTreePath(normalized);
}

function routeIdFromPath(pathname: string, params: URLSearchParams): EmbeddedRouteId {
  const normalized = normalizePathname(pathname).replace(/^\/nhs-app(?=\/|$)/, "") || "/home";
  if (normalized === "/handoff-return") {
    const route = params.get("route");
    if (route === "request_status") return "jp_request_status";
    if (route === "appointment_manage") return "jp_manage_local_appointment";
    if (route === "record_letter_summary") return "jp_records_letters_summary";
    if (route === "patient_message_thread") return "jp_patient_message_thread";
    return "jp_patient_home";
  }
  if (/^\/requests\/[^/]+\/status$/.test(normalized)) return "jp_request_status";
  if (/^\/appointments\/[^/]+\/manage$/.test(normalized)) return "jp_manage_local_appointment";
  if (/^\/records\/letters\/[^/]+$/.test(normalized)) return "jp_records_letters_summary";
  if (/^\/messages\/thread\/[^/]+$/.test(normalized)) return "jp_patient_message_thread";
  return "jp_patient_home";
}

function shellModeFor(pathname: string, params: URLSearchParams, userAgent = ""): EmbeddedShellMode {
  const normalized = normalizePathname(pathname);
  const shellParam = params.get("shell");
  const channel = params.get("channel");
  const from = params.get("from");
  const looksLikeNhsApp = /nhsapp|nhs-app|nhs app/i.test(userAgent);
  if (shellParam === "standalone") return "standalone";
  if (
    shellParam === "embedded" ||
    channel === "nhs_app" ||
    from === "nhsApp" ||
    normalized === "/nhs-app" ||
    normalized.startsWith("/nhs-app/") ||
    looksLikeNhsApp
  ) {
    return "embedded";
  }
  return "standalone";
}

function trustTierFor(
  mode: EmbeddedShellMode,
  params: URLSearchParams,
  userAgent = "",
): EmbeddedTrustTier {
  if (mode === "standalone") return "standalone_web";
  if (params.get("scenario") === "wrong_patient" || params.get("scenario") === "eligibility_blocked") {
    return "invalid";
  }
  if (params.get("context") === "signed" || params.has("entryToken")) return "trusted_embedded";
  if (/nhsapp|nhs-app|nhs app/i.test(userAgent)) return "user_agent_observed";
  return "query_hint_only";
}

function recoveryReasonFor(
  trustTier: EmbeddedTrustTier,
  params: URLSearchParams,
): EmbeddedRecoveryReason {
  const scenario = params.get("scenario");
  if (scenario === "stale_continuity") return "stale_continuity";
  if (scenario === "wrong_patient") return "wrong_patient";
  if (scenario === "route_freeze") return "route_freeze";
  if (scenario === "eligibility_blocked") return "eligibility_blocked";
  if (scenario === "shell_drift") return "shell_drift";
  if (trustTier === "query_hint_only" || trustTier === "user_agent_observed") {
    return "signed_context_missing";
  }
  return "none";
}

function shellStateFor(reason: EmbeddedRecoveryReason): EmbeddedShellState {
  switch (reason) {
    case "none":
      return "live";
    case "signed_context_missing":
    case "shell_drift":
      return "revalidate_only";
    case "stale_continuity":
    case "route_freeze":
      return "recovery_only";
    case "wrong_patient":
    case "eligibility_blocked":
      return "blocked";
  }
}

function eligibilityStateFor(
  reason: EmbeddedRecoveryReason,
  mode: EmbeddedShellMode,
): EmbeddedNavEligibilityState {
  if (mode === "standalone") return "live";
  switch (reason) {
    case "none":
      return "live";
    case "signed_context_missing":
    case "shell_drift":
      return "recovery_required";
    case "stale_continuity":
      return "recovery_required";
    case "route_freeze":
      return "read_only";
    case "wrong_patient":
    case "eligibility_blocked":
      return "blocked";
  }
}

function recoveryPostureFor(
  reason: EmbeddedRecoveryReason,
  route: EmbeddedShellRouteNode,
): EmbeddedRecoveryPosture {
  switch (reason) {
    case "none":
      return {
        reason,
        title: "Continuity verified",
        detail: "The same patient shell, route family, selected anchor, and return contract are active.",
        nextStep: "Continue in this shell.",
        ariaLive: "polite",
        dominantActionLabel: route.dominantActionLabel,
        mutationState: "enabled",
      };
    case "signed_context_missing":
      return {
        reason,
        title: "NHS App context needs revalidation",
        detail:
          "This route asked for embedded styling, but only a non-authoritative hint was present. The shell keeps the last safe summary and blocks embedded-only actions.",
        nextStep: "Revalidate NHS App context before showing live bridge actions.",
        ariaLive: "polite",
        dominantActionLabel: "Revalidate NHS App context",
        mutationState: "frozen",
      };
    case "stale_continuity":
      return {
        reason,
        title: "Continuity evidence is stale",
        detail:
          "The selected anchor is preserved, but the shell must recover in place before live actions can resume.",
        nextStep: "Use the same-shell recovery path.",
        ariaLive: "polite",
        dominantActionLabel: "Recover this route",
        mutationState: "frozen",
      };
    case "wrong_patient":
      return {
        reason,
        title: "Patient context does not match",
        detail:
          "The embedded session and route subject disagree. The route stays bounded and does not expose a fresh patient shell.",
        nextStep: "Return to the NHS App and sign in again.",
        ariaLive: "assertive",
        dominantActionLabel: "Return to NHS App",
        mutationState: "frozen",
      };
    case "route_freeze":
      return {
        reason,
        title: "Route is frozen for embedded mutation",
        detail:
          "The shell may keep the appointment summary visible, but live change controls stay frozen by the route-freeze disposition.",
        nextStep: "Keep viewing the last safe summary.",
        ariaLive: "polite",
        dominantActionLabel: "Keep safe summary",
        mutationState: "frozen",
      };
    case "eligibility_blocked":
      return {
        reason,
        title: "Embedded eligibility is blocked",
        detail:
          "The current route cannot use the embedded channel because bridge capability and route eligibility do not meet the floor.",
        nextStep: "Continue in a safe browser handoff or contact support.",
        ariaLive: "assertive",
        dominantActionLabel: "Open safe handoff",
        mutationState: "frozen",
      };
    case "shell_drift":
      return {
        reason,
        title: "Shell consistency drift detected",
        detail:
          "The route remains in the embedded shell while bundle and governing-object references are checked again.",
        nextStep: "Refresh continuity evidence before continuing.",
        ariaLive: "polite",
        dominantActionLabel: "Refresh continuity",
        mutationState: "frozen",
      };
  }
}

function channelProfileFor(mode: EmbeddedShellMode, params: URLSearchParams): EmbeddedChannelProfile {
  if (mode === "standalone") return "browser";
  if (params.get("channel") === "constrained_browser") return "constrained_browser";
  return "nhs_app";
}

function buildPatientShellContinuityKey(route: EmbeddedShellRouteNode): string {
  return `PatientShellContinuity:phase7:${patientIdentitySummary.maskedNhsNumber}:${route.routeFamilyRef}:v1`;
}

function buildReturnContractRef(route: EmbeddedShellRouteNode): string {
  return `PatientReturnContract:phase7:${route.routeId}:${route.entityId}:v1`;
}

function buildShellPolicy(mode: EmbeddedShellMode, channelProfile: EmbeddedChannelProfile): ShellPolicy {
  return {
    shellPolicyId: `ShellPolicy:phase7:${mode}:${channelProfile}:v1`,
    channelType: channelProfile,
    showHeader: mode === "standalone",
    showFooter: mode === "standalone",
    showBackLink: mode === "embedded",
    safeAreaInsetsMode: mode === "embedded" ? "host_controlled" : "none",
    externalLinkMode: mode === "embedded" ? "safe_browser_handoff" : "normal_browser",
    downloadMode: mode === "embedded" ? "summary_then_handoff" : "portal",
  };
}

function buildNavEligibility(input: {
  readonly route: EmbeddedShellRouteNode;
  readonly mode: EmbeddedShellMode;
  readonly eligibilityState: EmbeddedNavEligibilityState;
}): PatientEmbeddedNavEligibility {
  return {
    embeddedNavEligibilityId: `PatientEmbeddedNavEligibility:387:${input.route.routeId}:${input.eligibilityState}`,
    journeyPathRef: input.route.routeId,
    routeFamilyRef: input.route.routeFamilyRef,
    patientEmbeddedSessionProjectionRef: `PatientEmbeddedSessionProjection:387:${input.mode}`,
    bridgeCapabilityMatrixRef: EMBEDDED_SHELL_BRIDGE_CAPABILITY_MATRIX_REF,
    minimumBridgeCapabilitiesRef: EMBEDDED_SHELL_MINIMUM_BRIDGE_CAPABILITY_REF,
    requiredBridgeActionRefs: ["host_return", "safe_browser_handoff", "route_back_action"],
    allowedBridgeActionRefs:
      input.eligibilityState === "live" ? ["host_return", "route_back_action"] : ["host_return"],
    fallbackActionRefs: ["same_shell_recovery", "safe_browser_handoff"],
    routeFreezeDispositionRef:
      input.eligibilityState === "read_only"
        ? "RouteFreezeDisposition:385:embedded-read-only"
        : "RouteFreezeDisposition:385:embedded-live-or-recovery",
    continuityEvidenceRef: EMBEDDED_SHELL_COMPATIBILITY_EVIDENCE_REF,
    eligibilityState: input.eligibilityState,
    evaluatedAt: "2026-04-27T09:00:00Z",
  };
}

function buildConsistencyProjection(input: {
  readonly route: EmbeddedShellRouteNode;
  readonly trustTier: EmbeddedTrustTier;
  readonly shellState: EmbeddedShellState;
  readonly patientShellContinuityKey: string;
  readonly navEligibility: PatientEmbeddedNavEligibility;
  readonly returnContractRef: string;
}): EmbeddedShellConsistencyProjection {
  return {
    consistencyId: `EmbeddedShellConsistencyProjection:387:${input.route.routeId}:${input.shellState}`,
    journeyPathId: input.route.routeId,
    patientShellContinuityKey: input.patientShellContinuityKey,
    entityContinuityKey: input.route.entityContinuityKey,
    bundleVersion: "phase7.embedded-shell.route-tree.v1",
    audienceTier: input.shellState === "live" ? "patient_authenticated" : "patient_revalidation",
    governingObjectVersionRefs: [
      EMBEDDED_SHELL_MANIFEST_VERSION,
      EMBEDDED_SHELL_RELEASE_FREEZE_REF,
      input.route.dataSourceRef,
    ],
    selectedAnchorRef: input.route.selectedAnchorRef,
    returnContractRef: input.returnContractRef,
    placeholderContractRefs: [
      "PlaceholderContract:384:webview-limitation",
      "PlaceholderContract:387:embedded-recovery-frame",
    ],
    continuityEvidenceRefs: [
      EMBEDDED_SHELL_COMPATIBILITY_EVIDENCE_REF,
      "ContinuityEvidence:378-context-resolution-current",
      "ContinuityEvidence:381-bridge-runtime-current",
    ],
    currentBridgeCapabilityMatrixRef: EMBEDDED_SHELL_BRIDGE_CAPABILITY_MATRIX_REF,
    patientEmbeddedNavEligibilityRef: input.navEligibility.embeddedNavEligibilityId,
    shellState: input.shellState,
    computedAt: "2026-04-27T09:00:00Z",
    staleAt: "2026-04-27T09:15:00Z",
    causalConsistencyState:
      input.shellState === "blocked" ? "blocked" : input.shellState === "live" ? "valid" : "stale",
    projectionTrustState: input.trustTier,
  };
}

export function buildEmbeddedShellUrl(
  route: EmbeddedShellRouteNode,
  mode: EmbeddedShellMode,
  options: {
    readonly scenario?: EmbeddedRecoveryReason | "none";
    readonly handoffReturn?: boolean;
    readonly signedContext?: boolean;
  } = {},
): string {
  const params = new URLSearchParams();
  params.set("phase7", "embedded_shell");
  params.set("shell", mode);
  if (mode === "embedded") {
    params.set("channel", "nhs_app");
    if (options.signedContext !== false) {
      params.set("context", "signed");
    }
  }
  if (options.scenario && options.scenario !== "none") {
    params.set("scenario", options.scenario);
  }
  if (options.handoffReturn) {
    params.set("route", route.routeFamilyRef);
    params.set("anchor", route.entityId);
    params.set("return", "browser_handoff");
    return `/nhs-app/handoff-return?${params.toString()}`;
  }
  const base = mode === "embedded" ? route.embeddedPath : route.standalonePath;
  return `${base}?${params.toString()}`;
}

export function readEmbeddedContinuityEnvelope(storage: Storage | null): EmbeddedContinuityEnvelope | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(EMBEDDED_SHELL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EmbeddedContinuityEnvelope>;
    if (
      typeof parsed.patientShellContinuityKey === "string" &&
      typeof parsed.entityContinuityKey === "string" &&
      typeof parsed.selectedAnchorRef === "string" &&
      typeof parsed.returnContractRef === "string" &&
      typeof parsed.routeId === "string"
    ) {
      return parsed as EmbeddedContinuityEnvelope;
    }
  } catch {
    return null;
  }
  return null;
}

export function buildEmbeddedContinuityEnvelope(context: EmbeddedShellContext): EmbeddedContinuityEnvelope {
  return {
    patientShellContinuityKey: context.patientShellContinuityKey,
    entityContinuityKey: context.entityContinuityKey,
    selectedAnchorRef: context.selectedAnchorRef,
    returnContractRef: context.returnContractRef,
    shellState: context.shellState,
    shellMode: context.shellMode,
    routeId: context.routeNode.routeId,
    storedAt: "2026-04-27T09:00:00Z",
  };
}

export function writeEmbeddedContinuityEnvelope(
  storage: Storage | null,
  context: EmbeddedShellContext,
): void {
  if (!storage) return;
  storage.setItem(EMBEDDED_SHELL_STORAGE_KEY, JSON.stringify(buildEmbeddedContinuityEnvelope(context)));
}

export function resolveEmbeddedShellContext(input: {
  readonly pathname: string;
  readonly search?: string;
  readonly userAgent?: string;
  readonly storedEnvelope?: EmbeddedContinuityEnvelope | null;
}): EmbeddedShellContext {
  const params = new URLSearchParams(input.search ?? "");
  const route = routeById.get(routeIdFromPath(input.pathname, params)) ?? EMBEDDED_PATIENT_ROUTE_TREE[0]!;
  const shellMode = shellModeFor(input.pathname, params, input.userAgent);
  const channelProfile = channelProfileFor(shellMode, params);
  const trustTier = trustTierFor(shellMode, params, input.userAgent);
  const recoveryReason = shellMode === "standalone" ? "none" : recoveryReasonFor(trustTier, params);
  const shellState = shellMode === "standalone" ? "live" : shellStateFor(recoveryReason);
  const eligibilityState = eligibilityStateFor(recoveryReason, shellMode);
  const patientShellContinuityKey = buildPatientShellContinuityKey(route);
  const returnContractRef = buildReturnContractRef(route);
  const navEligibility = buildNavEligibility({ route, mode: shellMode, eligibilityState });
  const consistencyProjection = buildConsistencyProjection({
    route,
    trustTier,
    shellState,
    patientShellContinuityKey,
    navEligibility,
    returnContractRef,
  });
  const stored = input.storedEnvelope;
  const continuityRestored = Boolean(
    stored &&
      stored.patientShellContinuityKey === patientShellContinuityKey &&
      stored.entityContinuityKey === route.entityContinuityKey &&
      stored.selectedAnchorRef === route.selectedAnchorRef,
  );
  return {
    taskId: EMBEDDED_SHELL_TASK_ID,
    visualMode: EMBEDDED_SHELL_VISUAL_MODE,
    shellMode,
    channelProfile,
    trustTier,
    shellState,
    recovery: recoveryPostureFor(recoveryReason, route),
    routeNode: route,
    shellPolicy: buildShellPolicy(shellMode, channelProfile),
    consistencyProjection,
    navEligibility,
    patientShellContinuityKey,
    entityContinuityKey: route.entityContinuityKey,
    selectedAnchorRef: route.selectedAnchorRef,
    returnContractRef,
    returnHandoffRef: params.get("return") === "browser_handoff" ? "SafeBrowserHandoffReturn:387" : null,
    continuityRestored,
    routeTreeVersion: "phase7.embedded-shell-route-tree.v1",
  };
}
