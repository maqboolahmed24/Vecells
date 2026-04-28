export const NHS_APP_CHANNEL_WORKBENCH_VISUAL_MODE = "NHSApp_Channel_Control_Workbench" as const;
export const NHS_APP_CHANNEL_SUPPORT_PREFIX = "/ops/support/channels/nhs-app" as const;
export const NHS_APP_CHANNEL_SUPPORT_CASE_PREFIX = "/ops/support/cases" as const;
export const NHS_APP_CHANNEL_RELEASE_PREFIX = "/ops/release/nhs-app/cases" as const;
export const NHS_APP_CHANNEL_AUDIT_PREFIX = "/ops/audit/channel/nhs-app" as const;

export type NHSAppChannelType = "embedded_nhs_app" | "standalone_web";
export type NHSAppSSOOutcome =
  | "silent_success"
  | "silent_failed"
  | "consent_denied"
  | "safe_reentry_required";
export type NHSAppFreezePosture =
  | "none"
  | "read_only"
  | "placeholder_only"
  | "redirect_to_safe_route"
  | "kill_switch_active";
export type NHSAppArtifactPosture =
  | "available"
  | "summary_first"
  | "download_blocked"
  | "placeholder_only";
export type NHSAppRecoveryKind =
  | "continue_embedded"
  | "safe_reentry"
  | "read_only_status"
  | "browser_safe_route"
  | "contact_practice";
export type NHSAppTimelineEventKind =
  | "entry"
  | "route_resolution"
  | "sso"
  | "navigation"
  | "artifact"
  | "freeze"
  | "recovery";
export type NHSAppWorkbenchTab = "context" | "freeze" | "patient" | "audit";
export type NHSAppWorkbenchRouteMode = "support" | "support_case" | "release" | "audit";

export interface NHSAppChannelTimelineEvent {
  readonly eventId: string;
  readonly kind: NHSAppTimelineEventKind;
  readonly occurredAt: string;
  readonly heading: string;
  readonly summary: string;
  readonly patientVisibleSummary: string;
  readonly evidenceRef: string;
  readonly auditEventRef: string;
}

export interface NHSAppChannelCase {
  readonly caseId: string;
  readonly supportCaseRef: string;
  readonly routeFamily: string;
  readonly journeyPathId: string;
  readonly jumpOffRoute: string;
  readonly resumePath: string;
  readonly channelType: NHSAppChannelType;
  readonly ssoOutcome: NHSAppSSOOutcome;
  readonly bridgeCapabilityFloor: string;
  readonly cohortRef: string;
  readonly freezePosture: NHSAppFreezePosture;
  readonly routeFreezeRecordRef: string | null;
  readonly routeFreezeDispositionRef: string;
  readonly artifactPosture: NHSAppArtifactPosture;
  readonly releaseEvidenceRef: string;
  readonly recoveryKind: NHSAppRecoveryKind;
  readonly recoveryPath: string;
  readonly recoverySummary: string;
  readonly patientVisibleSummary: string;
  readonly operatorSummary: string;
  readonly releaseSummary: string;
  readonly auditEventRef: string;
  readonly telemetryRef: string;
  readonly timeline: readonly NHSAppChannelTimelineEvent[];
}

export interface NHSAppWorkbenchUrlState {
  readonly routeMode: NHSAppWorkbenchRouteMode;
  readonly selectedCaseId: string;
  readonly selectedEventId: string;
  readonly selectedTab: NHSAppWorkbenchTab;
  readonly inspectorDocked: boolean;
}

export const NHS_APP_CHANNEL_CASES: readonly NHSAppChannelCase[] = [
  {
    caseId: "SUP-398-001",
    supportCaseRef: "SupportCase:398:entry-resume",
    routeFamily: "start_request",
    journeyPathId: "jp_start_medical_request",
    jumpOffRoute: "/start/medical-request?from=nhsApp",
    resumePath: "/requests/draft/resume",
    channelType: "embedded_nhs_app",
    ssoOutcome: "silent_success",
    bridgeCapabilityFloor: "MinimumBridgeCapabilities:phase7-embedded-floor-375-pending",
    cohortRef: "ChannelReleaseCohort:397:limited-release-first-wave",
    freezePosture: "none",
    routeFreezeRecordRef: null,
    routeFreezeDispositionRef: "RouteFreezeDispositionTemplate:397:jp_start_medical_request",
    artifactPosture: "summary_first",
    releaseEvidenceRef: "ReleaseGuardrailPolicy:397:nhs-app-limited-release",
    recoveryKind: "continue_embedded",
    recoveryPath: "/start/medical-request",
    recoverySummary: "Continue in the embedded NHS App shell with local draft continuity.",
    patientVisibleSummary:
      "The patient saw the embedded start request flow with supplier chrome hidden.",
    operatorSummary: "Silent SSO settled and draft continuity stayed on the NHS App route.",
    releaseSummary: "Limited-release cohort remained green with no active freeze record.",
    auditEventRef: "ChannelAuditEvent:398:entry-resume",
    telemetryRef: "ChannelTelemetryPlan:384:limited_release",
    timeline: [
      event(
        "evt-398-entry",
        "entry",
        "07:58",
        "NHS App jump-off opened",
        "The NHS App opened the configured start request route.",
        "The patient entered through the NHS App service tile.",
      ),
      event(
        "evt-398-route",
        "route_resolution",
        "07:58",
        "Route resolved",
        "The route resolver selected the embedded start request family.",
        "The page opened without duplicate supplier header or footer.",
      ),
      event(
        "evt-398-sso-success",
        "sso",
        "07:59",
        "Silent SSO succeeded",
        "The SSO bridge bound the asserted identity to a local session.",
        "The patient did not need to sign in again.",
      ),
      event(
        "evt-398-navigation",
        "navigation",
        "08:01",
        "Draft continuity restored",
        "Return intent and draft lease matched the manifest tuple.",
        "The patient returned to the same draft step.",
      ),
      event(
        "evt-398-artifact",
        "artifact",
        "08:04",
        "Summary-first artifact posture",
        "The artifact surface exposed summary refs only.",
        "The patient saw a summary rather than a file download.",
      ),
    ],
  },
  {
    caseId: "SUP-398-002",
    supportCaseRef: "SupportCase:398:appointment-freeze",
    routeFamily: "appointment_manage",
    journeyPathId: "jp_manage_local_appointment",
    jumpOffRoute: "/appointments/manage?from=nhsApp",
    resumePath: "/appointments",
    channelType: "embedded_nhs_app",
    ssoOutcome: "safe_reentry_required",
    bridgeCapabilityFloor: "MinimumBridgeCapabilities:phase7-embedded-floor-375-pending",
    cohortRef: "ChannelReleaseCohort:397:limited-release-first-wave",
    freezePosture: "redirect_to_safe_route",
    routeFreezeRecordRef: "ChannelReleaseFreezeRecord:397:compatibility-drift",
    routeFreezeDispositionRef: "RouteFreezeDispositionTemplate:397:jp_manage_local_appointment",
    artifactPosture: "download_blocked",
    releaseEvidenceRef: "CompatibilityEvidence:phase7-bridge-floor-freeze-374",
    recoveryKind: "browser_safe_route",
    recoveryPath: "/appointments",
    recoverySummary:
      "Send the patient to the safe appointment route while the embedded write path is frozen.",
    patientVisibleSummary: "The patient saw a bounded redirect to the safe appointment route.",
    operatorSummary:
      "SSO context drift required safe re-entry before any write action could continue.",
    releaseSummary: "Route freeze is active and actionability remains below the release policy.",
    auditEventRef: "ChannelAuditEvent:398:appointment-freeze",
    telemetryRef: "ChannelTelemetryPlan:384:limited_release",
    timeline: [
      event(
        "evt-398-appointment-entry",
        "entry",
        "09:13",
        "Appointment jump-off opened",
        "The NHS App opened the manage appointment route.",
        "The patient entered from an appointment service card.",
      ),
      event(
        "evt-398-appointment-sso",
        "sso",
        "09:14",
        "Safe re-entry required",
        "Context drift blocked silent SSO and preserved the return path.",
        "The patient saw a re-entry explanation instead of a blank page.",
      ),
      event(
        "evt-398-freeze",
        "freeze",
        "09:14",
        "Freeze disposition applied",
        "Compatibility drift mapped the route to redirect_to_safe_route.",
        "The patient was redirected to the browser-safe appointment route.",
      ),
      event(
        "evt-398-recovery",
        "recovery",
        "09:15",
        "Recovery action offered",
        "Support action remained subordinate to RouteFreezeDisposition.",
        "The patient could continue through the safe route only.",
      ),
    ],
  },
  {
    caseId: "SUP-398-003",
    supportCaseRef: "SupportCase:398:status-consent-denied",
    routeFamily: "request_status",
    journeyPathId: "jp_request_status",
    jumpOffRoute: "/requests/REQ-398/status?from=nhsApp",
    resumePath: "/requests/REQ-398/status",
    channelType: "standalone_web",
    ssoOutcome: "consent_denied",
    bridgeCapabilityFloor: "MinimumBridgeCapabilities:browser-fallback",
    cohortRef: "ChannelReleaseCohort:397:limited-release-first-wave",
    freezePosture: "read_only",
    routeFreezeRecordRef: "ChannelReleaseFreezeRecord:397:telemetry-missing",
    routeFreezeDispositionRef: "RouteFreezeDispositionTemplate:397:jp_request_status",
    artifactPosture: "available",
    releaseEvidenceRef: "ChannelReleaseFreezeRecord:397:telemetry-missing",
    recoveryKind: "read_only_status",
    recoveryPath: "/requests/REQ-398/status",
    recoverySummary: "Keep request status readable and prevent message or more-info writes.",
    patientVisibleSummary: "The patient saw request status in read-only mode after consent denial.",
    operatorSummary:
      "Support can explain consent denial, standalone fallback, and read-only status from one view.",
    releaseSummary: "Telemetry-missing freeze keeps status readable but blocks write actions.",
    auditEventRef: "ChannelAuditEvent:398:status-consent-denied",
    telemetryRef: "ChannelTelemetryPlan:384:limited_release",
    timeline: [
      event(
        "evt-398-status-entry",
        "entry",
        "10:41",
        "Status link opened",
        "The patient followed the request status route from NHS App.",
        "The patient opened their request status view.",
      ),
      event(
        "evt-398-consent-denied",
        "sso",
        "10:42",
        "Consent denied",
        "NHS login returned ConsentNotGiven and the bridge settled a safe denial.",
        "The patient saw a clear consent-denied recovery path.",
      ),
      event(
        "evt-398-status-freeze",
        "freeze",
        "10:43",
        "Read-only freeze active",
        "Telemetry missing mapped the route to read_only.",
        "The patient could read status but not submit a message.",
      ),
      event(
        "evt-398-audit-link",
        "recovery",
        "10:45",
        "Audit deep link recorded",
        "Audit and support views share the same channel event ref.",
        "The patient-visible state is replayable for support.",
      ),
    ],
  },
];

export const defaultNHSAppWorkbenchUrlState: NHSAppWorkbenchUrlState = {
  routeMode: "support",
  selectedCaseId: NHS_APP_CHANNEL_CASES[0]?.caseId ?? "SUP-398-001",
  selectedEventId: NHS_APP_CHANNEL_CASES[0]?.timeline[0]?.eventId ?? "evt-398-entry",
  selectedTab: "context",
  inspectorDocked: true,
};

export function parseNHSAppWorkbenchUrl(pathname: string, search: string): NHSAppWorkbenchUrlState {
  const params = new URLSearchParams(search);
  const routeMode = routeModeFromPath(pathname);
  const pathCaseId = parseCaseId(pathname);
  const auditEventId =
    routeMode === "audit" ? pathname.split("/").filter(Boolean).at(-1) : undefined;
  const selectedCaseId =
    params.get("case") ??
    pathCaseId ??
    caseByEventId(auditEventId ?? "")?.caseId ??
    defaultNHSAppWorkbenchUrlState.selectedCaseId;
  const selectedCase = selectNHSAppChannelCase(selectedCaseId);
  const selectedEventId =
    params.get("event") ??
    auditEventId ??
    selectedCase.timeline[0]?.eventId ??
    defaultNHSAppWorkbenchUrlState.selectedEventId;
  const selectedTab = parseTab(params.get("tab"), routeMode);
  return {
    routeMode,
    selectedCaseId: selectedCase.caseId,
    selectedEventId,
    selectedTab,
    inspectorDocked: params.get("dock") !== "false",
  };
}

export function buildNHSAppWorkbenchUrl(state: NHSAppWorkbenchUrlState): string {
  const selectedCase = selectNHSAppChannelCase(state.selectedCaseId);
  const base =
    state.routeMode === "support_case"
      ? `${NHS_APP_CHANNEL_SUPPORT_CASE_PREFIX}/${selectedCase.caseId}/channel`
      : state.routeMode === "release"
        ? `${NHS_APP_CHANNEL_RELEASE_PREFIX}/${selectedCase.journeyPathId}`
        : state.routeMode === "audit"
          ? `${NHS_APP_CHANNEL_AUDIT_PREFIX}/${state.selectedEventId}`
          : NHS_APP_CHANNEL_SUPPORT_PREFIX;
  const params = new URLSearchParams({
    case: selectedCase.caseId,
    tab: state.selectedTab,
    event: state.selectedEventId,
    dock: String(state.inspectorDocked),
  });
  params.set("channel", selectedCase.channelType);
  params.set("route", selectedCase.routeFamily);
  params.set("sso", selectedCase.ssoOutcome);
  params.set("freeze", selectedCase.freezePosture);
  return `${base}?${params.toString()}`;
}

export function updateNHSAppWorkbenchState(
  state: NHSAppWorkbenchUrlState,
  patch: Partial<NHSAppWorkbenchUrlState>,
): NHSAppWorkbenchUrlState {
  const nextCase = patch.selectedCaseId
    ? selectNHSAppChannelCase(patch.selectedCaseId)
    : selectNHSAppChannelCase(state.selectedCaseId);
  const eventStillValid = nextCase.timeline.some(
    (eventEntry) => eventEntry.eventId === (patch.selectedEventId ?? state.selectedEventId),
  );
  return {
    ...state,
    ...patch,
    selectedCaseId: nextCase.caseId,
    selectedEventId: eventStillValid
      ? (patch.selectedEventId ?? state.selectedEventId)
      : (nextCase.timeline[0]?.eventId ?? defaultNHSAppWorkbenchUrlState.selectedEventId),
  };
}

export function selectNHSAppChannelCase(caseId: string): NHSAppChannelCase {
  return (
    NHS_APP_CHANNEL_CASES.find((entry) => entry.caseId === caseId) ?? NHS_APP_CHANNEL_CASES[0]!
  );
}

export function selectedNHSAppChannelEvent(
  selectedCase: NHSAppChannelCase,
  eventId: string,
): NHSAppChannelTimelineEvent {
  return (
    selectedCase.timeline.find((entry) => entry.eventId === eventId) ?? selectedCase.timeline[0]!
  );
}

export function summarizeNHSAppChannelCases(): {
  readonly totalCases: number;
  readonly embeddedCases: number;
  readonly frozenCases: number;
  readonly safeReentryCases: number;
} {
  return {
    totalCases: NHS_APP_CHANNEL_CASES.length,
    embeddedCases: NHS_APP_CHANNEL_CASES.filter((entry) => entry.channelType === "embedded_nhs_app")
      .length,
    frozenCases: NHS_APP_CHANNEL_CASES.filter((entry) => entry.freezePosture !== "none").length,
    safeReentryCases: NHS_APP_CHANNEL_CASES.filter(
      (entry) => entry.ssoOutcome === "safe_reentry_required",
    ).length,
  };
}

function event(
  eventId: string,
  kind: NHSAppTimelineEventKind,
  time: string,
  heading: string,
  summary: string,
  patientVisibleSummary: string,
): NHSAppChannelTimelineEvent {
  return {
    eventId,
    kind,
    occurredAt: `2026-04-27T${time}:00.000Z`,
    heading,
    summary,
    patientVisibleSummary,
    evidenceRef: `EvidenceRef:398:${eventId}`,
    auditEventRef: `AuditEvent:398:${eventId}`,
  };
}

function routeModeFromPath(pathname: string): NHSAppWorkbenchRouteMode {
  if (pathname.startsWith(NHS_APP_CHANNEL_AUDIT_PREFIX)) {
    return "audit";
  }
  if (pathname.startsWith(NHS_APP_CHANNEL_RELEASE_PREFIX)) {
    return "release";
  }
  if (pathname.startsWith(NHS_APP_CHANNEL_SUPPORT_CASE_PREFIX)) {
    return "support_case";
  }
  return "support";
}

function parseCaseId(pathname: string): string | null {
  const supportMatch = /^\/ops\/support\/cases\/([^/]+)\/channel/u.exec(pathname);
  if (supportMatch?.[1]) {
    return supportMatch[1];
  }
  const releaseJourney = /^\/ops\/release\/nhs-app\/cases\/([^/?#]+)/u.exec(pathname)?.[1];
  if (releaseJourney) {
    return (
      NHS_APP_CHANNEL_CASES.find((entry) => entry.journeyPathId === releaseJourney)?.caseId ?? null
    );
  }
  return null;
}

function caseByEventId(eventId: string): NHSAppChannelCase | null {
  return (
    NHS_APP_CHANNEL_CASES.find((entry) =>
      entry.timeline.some((eventEntry) => eventEntry.eventId === eventId),
    ) ?? null
  );
}

function parseTab(value: string | null, routeMode: NHSAppWorkbenchRouteMode): NHSAppWorkbenchTab {
  if (value === "context" || value === "freeze" || value === "patient" || value === "audit") {
    return value;
  }
  if (routeMode === "release") {
    return "freeze";
  }
  if (routeMode === "audit") {
    return "audit";
  }
  return "context";
}
