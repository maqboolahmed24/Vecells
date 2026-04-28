export const EMBEDDED_RECOVERY_ARTIFACT_TASK_ID = "par_393";
export const EMBEDDED_RECOVERY_ARTIFACT_VISUAL_MODE =
  "NHSApp_Embedded_Recovery_And_Artifacts";
export const EMBEDDED_RECOVERY_ARTIFACT_CONTRACT_REF =
  "EmbeddedRecoveryArtifactContract:393:phase7-deep-link-artifact-route-freeze";
export const EMBEDDED_RECOVERY_ARTIFACT_SHELL_CONTINUITY_KEY =
  "patient.portal.nhs-app.embedded.recovery-artifact-family";

export type EmbeddedRecoveryArtifactRouteKey =
  | "expired_link"
  | "invalid_context"
  | "lost_session"
  | "unsupported_action"
  | "channel_unavailable"
  | "route_freeze"
  | "degraded_mode"
  | "artifact_summary"
  | "artifact_preview"
  | "download_progress"
  | "artifact_fallback"
  | "return_safe";

export type EmbeddedRecoveryArtifactFixture =
  | "expired-link"
  | "invalid-context"
  | "lost-session"
  | "unsupported-action"
  | "channel-unavailable"
  | "route-freeze"
  | "degraded-mode"
  | "artifact-summary"
  | "artifact-preview"
  | "download-progress"
  | "artifact-fallback"
  | "return-safe";

export type EmbeddedRecoveryArtifactActionability =
  | "live"
  | "handoff_gated"
  | "summary_only"
  | "read_only"
  | "recovery_required"
  | "blocked";

export type EmbeddedRecoveryArtifactTone =
  | "info"
  | "warning"
  | "error"
  | "neutral"
  | "blocked";

export type EmbeddedRecoveryArtifactRouteFreezeState =
  | "live"
  | "limited_release_hold"
  | "read_only"
  | "placeholder_only"
  | "frozen"
  | "kill_switch_active";

export type EmbeddedRecoveryArtifactDegradedState =
  | "none"
  | "summary_only"
  | "safe_browser_handoff"
  | "secure_send_later"
  | "recovery_required"
  | "blocked";

export interface EmbeddedRecoveryArtifactSummaryRow {
  readonly label: string;
  readonly value: string;
}

export interface EmbeddedPreservedContextLine {
  readonly label: string;
  readonly currentSectionLabel: string;
  readonly summary: string;
  readonly summarySafetyState: "safe_summary" | "placeholder_only" | "not_available";
  readonly selectedAnchorRef: string;
  readonly returnContractRef: string;
  readonly lastSafeRoutePath: string;
  readonly supportCode: string | null;
}

export interface EmbeddedRecoveryTruth {
  readonly kind: EmbeddedRecoveryArtifactRouteKey;
  readonly title: string;
  readonly body: string;
  readonly primaryActionLabel: string;
  readonly secondaryActionLabel: string | null;
  readonly tone: EmbeddedRecoveryArtifactTone;
  readonly actionability: EmbeddedRecoveryArtifactActionability;
  readonly routeFreezeState: EmbeddedRecoveryArtifactRouteFreezeState;
  readonly degradedModeState: EmbeddedRecoveryArtifactDegradedState;
  readonly continuityState:
    | "preserved"
    | "summary_only"
    | "recovery_required"
    | "blocked";
  readonly shellDisposition:
    | "same_shell_summary"
    | "same_shell_recovery"
    | "same_shell_blocked";
  readonly ariaRole: "status" | "alert";
  readonly supportCode: string | null;
}

export interface EmbeddedArtifactTruth {
  readonly artifactId: string;
  readonly title: string;
  readonly summary: string;
  readonly provenanceSummary: string;
  readonly filename: string;
  readonly mimeType: string;
  readonly contentLengthBytes: number;
  readonly modeTruth:
    | "structured_summary"
    | "preview_available"
    | "bridge_transfer_ready"
    | "transfer_in_progress"
    | "secure_send_later"
    | "summary_only"
    | "blocked";
  readonly previewState:
    | "available"
    | "summary_only"
    | "loading"
    | "unsupported"
    | "blocked";
  readonly transferState:
    | "not_started"
    | "bridge_ready"
    | "in_progress"
    | "transferred"
    | "deferred"
    | "blocked";
  readonly fallbackState:
    | "none"
    | "secure_send_later"
    | "safe_browser_handoff"
    | "summary_only"
    | "blocked";
  readonly byteGrantState:
    | "issued"
    | "redeemed"
    | "expired"
    | "superseded"
    | "blocked"
    | "not_required";
  readonly safeBrowserHandoffAllowed: boolean;
  readonly secureSendLaterAllowed: boolean;
  readonly rows: readonly EmbeddedRecoveryArtifactSummaryRow[];
}

export interface EmbeddedRecoveryArtifactContinuityEvidence {
  readonly evidenceRef: string;
  readonly journeyRef: string;
  readonly routeFamilyRef: string;
  readonly journeyPathRef: string;
  readonly resolvedEntryMode: "site_link" | "deep_link" | "secure_link" | "recovery";
  readonly shellContinuityKey: typeof EMBEDDED_RECOVERY_ARTIFACT_SHELL_CONTINUITY_KEY;
  readonly embeddedEligibilityState:
    | "live"
    | "read_only"
    | "placeholder_only"
    | "safe_browser_handoff"
    | "recovery_required"
    | "blocked";
  readonly bridgeCapabilityState: "verified" | "stale" | "unavailable";
  readonly actionability: EmbeddedRecoveryArtifactActionability;
  readonly sourceProjectionRefs: readonly string[];
}

export interface EmbeddedRecoveryArtifactContext {
  readonly taskId: typeof EMBEDDED_RECOVERY_ARTIFACT_TASK_ID;
  readonly visualMode: typeof EMBEDDED_RECOVERY_ARTIFACT_VISUAL_MODE;
  readonly contractRef: typeof EMBEDDED_RECOVERY_ARTIFACT_CONTRACT_REF;
  readonly routeKey: EmbeddedRecoveryArtifactRouteKey;
  readonly fixture: EmbeddedRecoveryArtifactFixture;
  readonly journeyRef: string;
  readonly embeddedPath: string;
  readonly canonicalPath: string;
  readonly preservedContext: EmbeddedPreservedContextLine;
  readonly recoveryTruth: EmbeddedRecoveryTruth;
  readonly artifactTruth: EmbeddedArtifactTruth;
  readonly continuityEvidence: EmbeddedRecoveryArtifactContinuityEvidence;
  readonly actionCluster: {
    readonly primaryLabel: string;
    readonly secondaryLabel: string | null;
    readonly primaryEnabled: boolean;
  };
  readonly announcement: string;
}

const KNOWN_FIXTURES = new Set<EmbeddedRecoveryArtifactFixture>([
  "expired-link",
  "invalid-context",
  "lost-session",
  "unsupported-action",
  "channel-unavailable",
  "route-freeze",
  "degraded-mode",
  "artifact-summary",
  "artifact-preview",
  "download-progress",
  "artifact-fallback",
  "return-safe",
]);

const ROUTE_KEY_BY_SEGMENT: Record<string, EmbeddedRecoveryArtifactRouteKey> = {
  "expired-link": "expired_link",
  "invalid-context": "invalid_context",
  "lost-session": "lost_session",
  "unsupported-action": "unsupported_action",
  "channel-unavailable": "channel_unavailable",
  "route-freeze": "route_freeze",
  "degraded-mode": "degraded_mode",
  "artifact-summary": "artifact_summary",
  "artifact-preview": "artifact_preview",
  "download-progress": "download_progress",
  "artifact-fallback": "artifact_fallback",
  "return-safe": "return_safe",
};

const SEGMENT_BY_ROUTE_KEY: Record<EmbeddedRecoveryArtifactRouteKey, string> =
  Object.fromEntries(
    Object.entries(ROUTE_KEY_BY_SEGMENT).map(([segment, routeKey]) => [routeKey, segment]),
  ) as Record<EmbeddedRecoveryArtifactRouteKey, string>;

const EMBEDDED_RECOVERY_SOURCE_PROJECTIONS = [
  "ExternalEntryResolution",
  "SiteLinkManifest",
  "ChannelContextResolution",
  "PatientEmbeddedSessionProjection",
  "PatientEmbeddedNavEligibility",
  "BridgeCapabilityMatrix",
  "ArtifactPresentationContract",
  "ArtifactModeTruthProjection",
  "PatientDegradedModeProjection",
  "RouteFreezeDisposition",
] as const;

function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim() || "/nhs-app/recovery/REC-393/expired-link";
  return trimmed === "/"
    ? "/nhs-app/recovery/REC-393/expired-link"
    : trimmed.replace(/\/+$/, "");
}

export function isEmbeddedRecoveryArtifactPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  const segment = Object.keys(ROUTE_KEY_BY_SEGMENT).join("|");
  return (
    new RegExp(`^/nhs-app/recovery/[^/]+(?:/(?:${segment}))?$`).test(normalized) ||
    new RegExp(`^/embedded-recovery(?:/[^/]+)?(?:/(?:${segment}))?$`).test(normalized) ||
    new RegExp(`^/nhs-app/artifacts/[^/]+(?:/(?:${segment}))?$`).test(normalized)
  );
}

function routeKeyFromSegment(segment: string | null): EmbeddedRecoveryArtifactRouteKey {
  if (segment && ROUTE_KEY_BY_SEGMENT[segment]) {
    return ROUTE_KEY_BY_SEGMENT[segment];
  }
  return "expired_link";
}

function fixtureForRouteKey(routeKey: EmbeddedRecoveryArtifactRouteKey): EmbeddedRecoveryArtifactFixture {
  return SEGMENT_BY_ROUTE_KEY[routeKey] as EmbeddedRecoveryArtifactFixture;
}

function normalizeFixture(
  fixture: string | null,
  routeKey: EmbeddedRecoveryArtifactRouteKey,
): EmbeddedRecoveryArtifactFixture {
  if (fixture && KNOWN_FIXTURES.has(fixture as EmbeddedRecoveryArtifactFixture)) {
    return fixture as EmbeddedRecoveryArtifactFixture;
  }
  return fixtureForRouteKey(routeKey);
}

export function embeddedRecoveryArtifactJourneyForFixture(
  fixture: EmbeddedRecoveryArtifactFixture,
): string {
  switch (fixture) {
    case "artifact-summary":
    case "artifact-preview":
    case "download-progress":
    case "artifact-fallback":
      return "ART-393";
    case "route-freeze":
      return "FRZ-393";
    case "degraded-mode":
      return "DGD-393";
    case "return-safe":
      return "RET-393";
    default:
      return "REC-393";
  }
}

function normalizeJourneyRef(
  requestedJourneyRef: string,
  fixture: EmbeddedRecoveryArtifactFixture,
  fixtureWasExplicit: boolean,
): string {
  if (fixtureWasExplicit) {
    return embeddedRecoveryArtifactJourneyForFixture(fixture);
  }
  const upper = requestedJourneyRef.toUpperCase();
  return /^[A-Z]{3}-\d{3,4}$/.test(upper)
    ? upper
    : embeddedRecoveryArtifactJourneyForFixture(fixture);
}

export function parseEmbeddedRecoveryArtifactLocation(input: {
  readonly pathname: string;
  readonly search?: string;
}): {
  readonly journeyRef: string;
  readonly routeKey: EmbeddedRecoveryArtifactRouteKey;
  readonly fixture: EmbeddedRecoveryArtifactFixture;
  readonly fixtureWasExplicit: boolean;
} {
  const normalized = normalizePathname(input.pathname);
  const params = new URLSearchParams(input.search ?? "");
  const parts = normalized.split("/").filter(Boolean);
  let journeyRef = params.get("journey") ?? "REC-393";
  let segment: string | null = params.get("view");

  if (parts[0] === "nhs-app" && parts[1] === "recovery") {
    journeyRef = parts[2] ?? journeyRef;
    segment = parts[3] ?? segment ?? "expired-link";
  }

  if (parts[0] === "nhs-app" && parts[1] === "artifacts") {
    journeyRef = parts[2] ?? "ART-393";
    segment = parts[3] ?? segment ?? "artifact-summary";
  }

  const embeddedIndex = parts.indexOf("embedded-recovery");
  if (embeddedIndex >= 0) {
    journeyRef = parts[embeddedIndex + 1] ?? journeyRef;
    segment = parts[embeddedIndex + 2] ?? segment ?? "expired-link";
  }

  const routeKey = routeKeyFromSegment(segment);
  const fixtureWasExplicit = params.has("fixture");
  const fixture = normalizeFixture(params.get("fixture"), routeKey);

  return {
    journeyRef: normalizeJourneyRef(journeyRef, fixture, fixtureWasExplicit),
    routeKey,
    fixture,
    fixtureWasExplicit,
  };
}

export function embeddedRecoveryArtifactPath(input: {
  readonly journeyRef: string;
  readonly routeKey: EmbeddedRecoveryArtifactRouteKey;
  readonly fixture?: EmbeddedRecoveryArtifactFixture | null;
}): string {
  const params = new URLSearchParams();
  if (input.fixture) params.set("fixture", input.fixture);
  return `/nhs-app/recovery/${input.journeyRef}/${SEGMENT_BY_ROUTE_KEY[input.routeKey]}${
    params.size > 0 ? `?${params.toString()}` : ""
  }`;
}

function canonicalPathFor(routeKey: EmbeddedRecoveryArtifactRouteKey, journeyRef: string): string {
  if (
    routeKey === "artifact_summary" ||
    routeKey === "artifact_preview" ||
    routeKey === "download_progress" ||
    routeKey === "artifact_fallback"
  ) {
    return `/artifacts/${journeyRef}/summary`;
  }
  if (routeKey === "route_freeze" || routeKey === "degraded_mode") {
    return `/requests/${journeyRef}/status`;
  }
  return `/requests/${journeyRef}/recovery`;
}

function preservedContextFor(
  fixture: EmbeddedRecoveryArtifactFixture,
  journeyRef: string,
): EmbeddedPreservedContextLine {
  const supportCodeByFixture: Partial<Record<EmbeddedRecoveryArtifactFixture, string>> = {
    "expired-link": "P7-LINK-EXPIRED",
    "invalid-context": "P7-CTX-MISSING",
    "lost-session": "P7-SESSION-LOST",
    "unsupported-action": "P7-WEBVIEW-UNSUPPORTED",
    "channel-unavailable": "P7-CHANNEL-UNAVAILABLE",
    "route-freeze": "P7-ROUTE-FROZEN",
    "artifact-fallback": "P7-FILE-UNAVAILABLE",
  };
  const placeholder =
    fixture === "invalid-context" || fixture === "channel-unavailable"
      ? "placeholder_only"
      : "safe_summary";
  return {
    label:
      fixture.startsWith("artifact") || fixture === "download-progress"
        ? "Document context"
        : "Last safe context",
    currentSectionLabel:
      fixture.startsWith("artifact") || fixture === "download-progress"
        ? "Appointment letter"
        : "Request status",
    summary:
      placeholder === "placeholder_only"
        ? "We can show the owning route and recovery step, but not richer details until the context is checked again."
        : "Skin change request for Monday morning. The request summary remains available inside the NHS App.",
    summarySafetyState: placeholder,
    selectedAnchorRef: `SelectedAnchor:393:${journeyRef}`,
    returnContractRef: `ReturnContract:393:${journeyRef}`,
    lastSafeRoutePath: `/nhs-app/requests/${journeyRef}/status`,
    supportCode: supportCodeByFixture[fixture] ?? null,
  };
}

function recoveryTruthFor(
  routeKey: EmbeddedRecoveryArtifactRouteKey,
  fixture: EmbeddedRecoveryArtifactFixture,
): EmbeddedRecoveryTruth {
  const base = {
    kind: routeKey,
    routeFreezeState: "live" as EmbeddedRecoveryArtifactRouteFreezeState,
    degradedModeState: "none" as EmbeddedRecoveryArtifactDegradedState,
    continuityState: "preserved" as const,
    shellDisposition: "same_shell_summary" as const,
    ariaRole: "status" as const,
    supportCode: null,
  };

  switch (fixture) {
    case "expired-link":
      return {
        ...base,
        title: "This link has expired",
        body:
          "For your security, links only stay open for a short time. You can reopen the last safe request summary from here.",
        primaryActionLabel: "Open safe summary",
        secondaryActionLabel: "Back to NHS App",
        tone: "warning",
        actionability: "recovery_required",
        shellDisposition: "same_shell_recovery",
        supportCode: "P7-LINK-EXPIRED",
      };
    case "invalid-context":
      return {
        ...base,
        title: "We need to check this link",
        body:
          "The link did not include enough trusted NHS App context, so we are keeping you on a recovery screen.",
        primaryActionLabel: "Check again",
        secondaryActionLabel: "Back to services",
        tone: "error",
        actionability: "recovery_required",
        continuityState: "summary_only",
        shellDisposition: "same_shell_recovery",
        ariaRole: "alert",
        supportCode: "P7-CTX-MISSING",
      };
    case "lost-session":
      return {
        ...base,
        title: "Your session needs checking",
        body:
          "Your place is preserved, but you need to confirm your NHS login before continuing.",
        primaryActionLabel: "Confirm NHS login",
        secondaryActionLabel: "Open safe summary",
        tone: "warning",
        actionability: "recovery_required",
        shellDisposition: "same_shell_recovery",
        supportCode: "P7-SESSION-LOST",
      };
    case "unsupported-action":
      return {
        ...base,
        title: "This action is not available in the NHS App",
        body:
          "The NHS App cannot use this browser action here. We will keep the summary visible and offer the supported next step.",
        primaryActionLabel: "Review supported option",
        secondaryActionLabel: "Open safe summary",
        tone: "warning",
        actionability: "handoff_gated",
        degradedModeState: "summary_only",
        supportCode: "P7-WEBVIEW-UNSUPPORTED",
      };
    case "channel-unavailable":
      return {
        ...base,
        title: "This route is not available in the app right now",
        body:
          "The NHS App channel cannot safely open this route. You can return to the last safe summary while we keep richer actions paused.",
        primaryActionLabel: "Return to summary",
        secondaryActionLabel: "Back to services",
        tone: "blocked",
        actionability: "blocked",
        continuityState: "summary_only",
        degradedModeState: "blocked",
        shellDisposition: "same_shell_blocked",
        ariaRole: "alert",
        supportCode: "P7-CHANNEL-UNAVAILABLE",
      };
    case "route-freeze":
      return {
        ...base,
        title: "This route is paused",
        body:
          "The latest release checks have paused this route. We are showing the safe summary instead of hiding the route.",
        primaryActionLabel: "Open safe summary",
        secondaryActionLabel: "Back to services",
        tone: "warning",
        actionability: "read_only",
        routeFreezeState: "frozen",
        continuityState: "summary_only",
        shellDisposition: "same_shell_summary",
        supportCode: "P7-ROUTE-FROZEN",
      };
    case "degraded-mode":
      return {
        ...base,
        title: "Some actions are limited",
        body:
          "The route is still readable, but preview, download, or handoff actions are reduced until the app confirms the channel is safe.",
        primaryActionLabel: "Review summary",
        secondaryActionLabel: "Back to services",
        tone: "neutral",
        actionability: "summary_only",
        degradedModeState: "summary_only",
        continuityState: "summary_only",
      };
    case "artifact-summary":
      return {
        ...base,
        title: "Document summary",
        body:
          "Review the important details first. Richer artifact actions stay gated by the embedded grant.",
        primaryActionLabel: "Preview document",
        secondaryActionLabel: "Send later instead",
        tone: "info",
        actionability: "live",
      };
    case "artifact-preview":
      return {
        ...base,
        title: "Preview document",
        body:
          "The preview is available inside the shell. Download remains a deliberate bridge action.",
        primaryActionLabel: "Download through NHS App",
        secondaryActionLabel: "Back to summary",
        tone: "info",
        actionability: "handoff_gated",
      };
    case "download-progress":
      return {
        ...base,
        title: "Preparing download",
        body:
          "The NHS App is preparing the file transfer. Keep this screen open until the action finishes or falls back.",
        primaryActionLabel: "Return to summary",
        secondaryActionLabel: "Send later instead",
        tone: "info",
        actionability: "handoff_gated",
      };
    case "artifact-fallback":
      return {
        ...base,
        title: "Use the summary or send later",
        body:
          "The file cannot be safely transferred in this webview right now. The summary remains visible and secure send later is available.",
        primaryActionLabel: "Send securely later",
        secondaryActionLabel: "Back to summary",
        tone: "warning",
        actionability: "summary_only",
        degradedModeState: "secure_send_later",
      };
    case "return-safe":
    default:
      return {
        ...base,
        title: "Return to the safe summary",
        body:
          "We preserved the last safe route and will reopen it in the same NHS App shell.",
        primaryActionLabel: "Open safe summary",
        secondaryActionLabel: "Back to services",
        tone: "neutral",
        actionability: "live",
      };
  }
}

function artifactTruthFor(fixture: EmbeddedRecoveryArtifactFixture): EmbeddedArtifactTruth {
  const fallbackState =
    fixture === "artifact-fallback"
      ? "secure_send_later"
      : fixture === "unsupported-action" || fixture === "degraded-mode"
        ? "summary_only"
        : fixture === "channel-unavailable"
          ? "blocked"
          : "none";
  const modeTruth =
    fixture === "artifact-preview"
      ? "preview_available"
      : fixture === "download-progress"
        ? "transfer_in_progress"
        : fixture === "artifact-fallback"
          ? "secure_send_later"
          : fixture === "channel-unavailable"
            ? "blocked"
            : "structured_summary";
  const previewState =
    fixture === "artifact-preview"
      ? "available"
      : fixture === "download-progress"
        ? "loading"
        : fixture === "artifact-fallback" || fixture === "unsupported-action"
          ? "unsupported"
          : fixture === "channel-unavailable"
            ? "blocked"
            : "summary_only";
  const transferState =
    fixture === "download-progress"
      ? "in_progress"
      : fixture === "artifact-preview"
        ? "bridge_ready"
        : fixture === "artifact-fallback"
          ? "deferred"
          : fixture === "channel-unavailable"
            ? "blocked"
            : "not_started";
  const byteGrantState =
    fixture === "artifact-preview" || fixture === "download-progress"
      ? "issued"
      : fixture === "artifact-fallback"
        ? "expired"
        : fixture === "channel-unavailable"
          ? "blocked"
          : "not_required";
  const rows = [
    { label: "File", value: "Appointment letter PDF" },
    { label: "Source", value: "BookingConfirmationTruthProjection:382:confirmed" },
    {
      label: "Delivery",
      value:
        transferState === "in_progress"
          ? "NHS App byte transfer in progress"
          : fallbackState === "secure_send_later"
            ? "Secure send later"
            : previewState === "available"
              ? "In-shell preview ready"
              : "Structured summary first",
    },
    {
      label: "Return",
      value: "Same-shell request status summary",
    },
  ] as const;

  return {
    artifactId: "artifact:393:appointment-letter",
    title: "Appointment letter",
    summary:
      "Your appointment letter includes the time, place, reference, and what to bring. Review those details before using file actions.",
    provenanceSummary: "Generated from ArtifactPresentationContract and current embedded grants.",
    filename: "appointment-letter.pdf",
    mimeType: "application/pdf",
    contentLengthBytes: 640000,
    modeTruth,
    previewState,
    transferState,
    fallbackState,
    byteGrantState,
    safeBrowserHandoffAllowed: fixture === "artifact-fallback" || fixture === "unsupported-action",
    secureSendLaterAllowed: fixture === "artifact-fallback" || fixture === "download-progress",
    rows,
  };
}

function continuityFor(input: {
  readonly journeyRef: string;
  readonly fixture: EmbeddedRecoveryArtifactFixture;
  readonly recoveryTruth: EmbeddedRecoveryTruth;
}): EmbeddedRecoveryArtifactContinuityEvidence {
  const routeFamilyRef =
    input.fixture.startsWith("artifact") || input.fixture === "download-progress"
      ? "appointment_manage"
      : input.fixture === "route-freeze"
        ? "pharmacy_status"
        : "request_status";
  const journeyPathRef =
    routeFamilyRef === "appointment_manage"
      ? "jp_manage_local_appointment"
      : routeFamilyRef === "pharmacy_status"
        ? "jp_pharmacy_status"
        : "jp_request_status";
  return {
    evidenceRef: "experience_continuity::embedded_recovery_artifact::phase7::393",
    journeyRef: input.journeyRef,
    routeFamilyRef,
    journeyPathRef,
    resolvedEntryMode:
      input.fixture === "expired-link"
        ? "secure_link"
        : input.fixture === "return-safe"
          ? "recovery"
          : "site_link",
    shellContinuityKey: EMBEDDED_RECOVERY_ARTIFACT_SHELL_CONTINUITY_KEY,
    embeddedEligibilityState:
      input.recoveryTruth.actionability === "blocked"
        ? "blocked"
        : input.recoveryTruth.actionability === "recovery_required"
          ? "recovery_required"
          : input.recoveryTruth.actionability === "summary_only"
            ? "placeholder_only"
            : input.recoveryTruth.actionability === "read_only"
              ? "read_only"
              : "live",
    bridgeCapabilityState:
      input.fixture === "channel-unavailable"
        ? "unavailable"
        : input.fixture === "degraded-mode" || input.fixture === "unsupported-action"
          ? "stale"
          : "verified",
    actionability: input.recoveryTruth.actionability,
    sourceProjectionRefs: [
      ...EMBEDDED_RECOVERY_SOURCE_PROJECTIONS,
      "ExternalEntryMatrix:380:secure_link_expired",
      "ArtifactDeliveryMatrix:382:capability_missing",
      "DegradedModeMatrix:382:secure_send_later",
      "RouteFreezeDispositionMatrix:385:frozen_route",
    ],
  };
}

export function resolveEmbeddedRecoveryArtifactContext(input: {
  readonly pathname: string;
  readonly search?: string;
}): EmbeddedRecoveryArtifactContext {
  const parsed = parseEmbeddedRecoveryArtifactLocation(input);
  const recoveryTruth = recoveryTruthFor(parsed.routeKey, parsed.fixture);
  const preservedContext = preservedContextFor(parsed.fixture, parsed.journeyRef);
  const artifactTruth = artifactTruthFor(parsed.fixture);
  const continuityEvidence = continuityFor({
    journeyRef: parsed.journeyRef,
    fixture: parsed.fixture,
    recoveryTruth,
  });
  const embeddedPath = embeddedRecoveryArtifactPath({
    journeyRef: parsed.journeyRef,
    routeKey: parsed.routeKey,
    fixture: parsed.fixture,
  });
  const primaryEnabled = recoveryTruth.actionability !== "blocked";

  return {
    taskId: EMBEDDED_RECOVERY_ARTIFACT_TASK_ID,
    visualMode: EMBEDDED_RECOVERY_ARTIFACT_VISUAL_MODE,
    contractRef: EMBEDDED_RECOVERY_ARTIFACT_CONTRACT_REF,
    routeKey: parsed.routeKey,
    fixture: parsed.fixture,
    journeyRef: parsed.journeyRef,
    embeddedPath,
    canonicalPath: canonicalPathFor(parsed.routeKey, parsed.journeyRef),
    preservedContext,
    recoveryTruth,
    artifactTruth,
    continuityEvidence,
    actionCluster: {
      primaryLabel: recoveryTruth.primaryActionLabel,
      secondaryLabel: recoveryTruth.secondaryActionLabel,
      primaryEnabled,
    },
    announcement: `${recoveryTruth.title}. ${preservedContext.currentSectionLabel} context is ${preservedContext.summarySafetyState.replaceAll(
      "_",
      " ",
    )}.`,
  };
}

export const embeddedRecoveryArtifactFixtureSequence = [
  "expired-link",
  "invalid-context",
  "lost-session",
  "unsupported-action",
  "channel-unavailable",
  "route-freeze",
  "degraded-mode",
  "artifact-summary",
  "artifact-preview",
  "download-progress",
  "artifact-fallback",
  "return-safe",
] as const satisfies readonly EmbeddedRecoveryArtifactFixture[];
