import { VecellLogoWordmark } from "./vecell-branding";

export const ARTIFACT_SHELL_TASK_ID = "par_109";
export const ARTIFACT_SHELL_VISUAL_MODE = "Artifact_Studio";
export const ARTIFACT_SHELL_SOURCE_PRECEDENCE = [
  "prompt/109.md",
  "prompt/shared_operating_contract_106_to_115.md",
  "prompt/AGENT.md",
  "prompt/checklist.md",
  "blueprint/platform-frontend-blueprint.md#1.19 ArtifactSurfaceFrame",
  "blueprint/platform-frontend-blueprint.md#1.19A ArtifactStage",
  "blueprint/platform-frontend-blueprint.md#ArtifactPresentationContract",
  "blueprint/platform-frontend-blueprint.md#ArtifactSurfaceBinding",
  "blueprint/platform-frontend-blueprint.md#ArtifactParityDigest",
  "blueprint/platform-frontend-blueprint.md#ArtifactSurfaceContext",
  "blueprint/platform-frontend-blueprint.md#ArtifactTransferSettlement",
  "blueprint/platform-frontend-blueprint.md#ArtifactFallbackDisposition",
  "blueprint/platform-frontend-blueprint.md#OutboundNavigationGrant",
  "blueprint/canonical-ui-contract-kernel.md#Canonical contracts / ArtifactModePresentationProfile",
  "blueprint/platform-runtime-and-release-blueprint.md#Runbook bundles dashboard packs release handoff summaries and recovery activation guides are approved operator artifacts",
  "blueprint/patient-portal-experience-architecture-blueprint.md#1A Calm route posture and artifact delivery",
  "blueprint/patient-account-and-communications-blueprint.md#Purpose",
  "blueprint/governance-admin-console-frontend-blueprint.md#Core shell responsibilities",
  "blueprint/operations-console-frontend-blueprint.md#State and interaction model",
  "blueprint/phase-7-inside-the-nhs-app.md#7E NHS App bridge API navigation model and embedded behaviours",
  "blueprint/accessibility-and-content-system-contract.md#Canonical accessibility and content objects",
  "blueprint/forensic-audit-findings.md#Finding 98",
  "blueprint/forensic-audit-findings.md#Finding 101",
  "blueprint/forensic-audit-findings.md#Finding 115",
  "blueprint/forensic-audit-findings.md#Finding 117",
  "blueprint/forensic-audit-findings.md#Finding 118",
  "blueprint/forensic-audit-findings.md#Finding 120",
] as const;

export const ARTIFACT_SHELL_GAP_RESOLUTIONS = [
  {
    gapId: "GAP_RESOLUTION_ARTIFACT_COPY_EMBEDDED_SUMMARY_ONLY",
    title: "Embedded preview copy fails closed to summary-first language",
    resolution:
      "When embedded preview capability is ambiguous, the shell must say that the summary remains approved while preview waits for a safer browser or secure-send-later path.",
    source_refs: [
      "prompt/109.md#Gap_handling_you_must_perform_during_this_task",
      "blueprint/platform-frontend-blueprint.md#ArtifactFallbackDisposition",
    ],
  },
  {
    gapId: "GAP_RESOLUTION_ARTIFACT_COPY_TRANSFER_PROVISIONAL",
    title: "Transfer acknowledgement is always provisional",
    resolution:
      "Buttons, browser dialogs, and spawned tabs are expressed as provisional movement until ArtifactTransferSettlement reaches an authoritative state.",
    source_refs: [
      "blueprint/platform-frontend-blueprint.md#ArtifactTransferSettlement",
      "blueprint/platform-frontend-blueprint.md#8-step artifact rendering algorithm",
    ],
  },
  {
    gapId: "GAP_RESOLUTION_ARTIFACT_COPY_LARGE_PREVIEW_PLACEHOLDER",
    title: "Large artifacts fall back to approved summary copy",
    resolution:
      "Large guarded artifacts must keep the verified summary and expose a summary sentence instead of pretending inline preview is loading forever.",
    source_refs: [
      "prompt/109.md#Mission",
      "blueprint/platform-frontend-blueprint.md#ArtifactFallbackDisposition",
    ],
  },
] as const;

export const ARTIFACT_SHELL_FOLLOW_ON_DEPENDENCIES = [
  {
    dependencyId: "FOLLOW_ON_DEPENDENCY_ARTIFACT_ROUTE_BINDINGS_PATIENT_RECORDS",
    ownerTaskRange: "par_115-par_120",
    description:
      "Bind live patient and staff route families to the shared artifact shell once seed routes publish real SelectedAnchor and route-release list tuples.",
    source_refs: ["prompt/109.md#Gap_handling_you_must_perform_during_this_task", "prompt/115.md"],
  },
  {
    dependencyId: "FOLLOW_ON_DEPENDENCY_ARTIFACT_RUNTIME_GRANTS",
    ownerTaskRange: "par_112-par_114",
    description:
      "Swap mock navigation grants and activity data hooks for runtime publication, route-guard, and automation-anchor bindings without changing the shell law.",
    source_refs: [
      "prompt/109.md#Actual_production_strategy_later",
      "prompt/112.md",
      "prompt/114.md",
    ],
  },
] as const;

export type ArtifactKind =
  | "appointment_confirmation"
  | "record_result_summary"
  | "release_evidence_pack"
  | "recovery_report"
  | "record_attachment";

export type ArtifactRequestedMode =
  | "structured_summary"
  | "governed_preview"
  | "download"
  | "print_preview"
  | "external_handoff";

export type ArtifactStageMode =
  | "structured_summary"
  | "governed_preview"
  | "print_preview"
  | "placeholder_only"
  | "recovery_only";

export type ArtifactParityState =
  | "summary_verified"
  | "summary_provisional"
  | "source_only"
  | "parity_stale"
  | "parity_unavailable"
  | "parity_blocked";

export type ArtifactAuthorityState =
  | "summary_verified"
  | "summary_provisional"
  | "source_only"
  | "recovery_only";

export type ArtifactChannelPosture =
  | "standard_browser"
  | "constrained_browser"
  | "embedded"
  | "frozen_channel";

export type ArtifactByteDeliveryPosture =
  | "available"
  | "large_guarded"
  | "blocked"
  | "embedded_blocked";

export type ArtifactSummarySafetyTier =
  | "verified"
  | "provisional"
  | "source_only"
  | "recovery_only";

export type ArtifactPreviewPolicy = "inline_preview" | "summary_only" | "placeholder_only";

export type ArtifactActionPolicy = "allowed" | "blocked";
export type ArtifactHandoffPolicy = "grant_required" | "blocked";

export type ArtifactFallbackKind =
  | "none"
  | "summary_only"
  | "placeholder_only"
  | "secure_send_later"
  | "recovery_only";

export type ArtifactFallbackTrigger =
  | "none"
  | "embedded_limit"
  | "grant_expired"
  | "grant_blocked"
  | "preview_blocked"
  | "large_artifact"
  | "unsupported_type"
  | "stale_publication"
  | "parity_drift";

export type ArtifactGrantState = "active" | "expired" | "blocked" | "not_required";
export type ArtifactDestinationType = "browser" | "cross_app" | "print_service" | "download";

export type ArtifactTransferKind = "none" | "download" | "print" | "handoff";

export type ArtifactTransferState =
  | "not_started"
  | "arming"
  | "pending"
  | "available"
  | "returned"
  | "recovery_required"
  | "blocked";

export type ArtifactLocalAckState = "none" | "clicked" | "dialog_opened" | "tab_opened";

export type ArtifactReturnTruthState = "return_safe" | "return_guarded" | "return_blocked";
export type ArtifactTone = "neutral" | "caution" | "critical";
export type ArtifactHandoffPosture = "secondary" | "armed" | "blocked";

export interface ArtifactSummarySection {
  id: string;
  title: string;
  body: string;
  emphasis?: string;
}

export interface ArtifactPreviewPage {
  id: string;
  title: string;
  lines: readonly string[];
}

export interface ArtifactPresentationContract {
  contractId: string;
  artifactKind: ArtifactKind;
  summaryRequired: boolean;
  previewPolicy: ArtifactPreviewPolicy;
  downloadPolicy: ArtifactActionPolicy;
  printPolicy: ArtifactActionPolicy;
  handoffPolicy: ArtifactHandoffPolicy;
  requiredSummaryAuthority: "verified_only" | "verified_or_provisional" | "source_only_allowed";
  source_refs: readonly string[];
}

export interface ArtifactSurfaceBinding {
  bindingId: string;
  routeFamilyRef: string;
  artifactLabel: string;
  selectedAnchorRef: string;
  selectedAnchorLabel: string;
  previewContractRef: string;
  downloadContractRef: string;
  printContractRef: string;
  handoffContractRef: string;
  requiredParityStates: readonly ArtifactParityState[];
  embeddedFallback: ArtifactFallbackKind;
  staleFallback: ArtifactFallbackKind;
  unsupportedFallback: ArtifactFallbackKind;
  source_refs: readonly string[];
}

export interface ArtifactParityDigest {
  parityDigestId: string;
  sourceArtifactHash: string;
  summaryHash: string;
  authorityState: ArtifactAuthorityState;
  sourceParityState: ArtifactParityState;
  parityStatement: string;
  lastVerifiedAt: string;
  verifiedBy: string;
  driftReason: string | null;
  source_refs: readonly string[];
}

export interface ArtifactSurfaceContext {
  contextId: string;
  shellContinuityKey: string;
  routeFamilyRef: string;
  selectedAnchorRef: string;
  selectedAnchorLabel: string;
  returnTargetRef: string;
  returnTargetLabel: string;
  channelPosture: ArtifactChannelPosture;
  artifactModeRequest: ArtifactRequestedMode;
  visibilityCeiling: "full" | "masked" | "restricted";
  summarySafetyTier: ArtifactSummarySafetyTier;
  byteDeliveryPosture: ArtifactByteDeliveryPosture;
  currentRouteLineage: string;
  source_refs: readonly string[];
}

export interface ArtifactTransferSettlement {
  settlementId: string;
  transferKind: ArtifactTransferKind;
  authoritativeTransferState: ArtifactTransferState;
  localAckState: ArtifactLocalAckState;
  progressLabel: string;
  lastUpdatedAt: string;
  source_refs: readonly string[];
}

export interface ArtifactFallbackDisposition {
  fallbackId: string;
  fallbackKind: ArtifactFallbackKind;
  trigger: ArtifactFallbackTrigger;
  title: string;
  summary: string;
  recoveryActionLabel: string;
  source_refs: readonly string[];
}

export interface OutboundNavigationGrant {
  grantId: string;
  state: ArtifactGrantState;
  destinationLabel: string;
  destinationType: ArtifactDestinationType;
  routeFamilyRef: string;
  continuityKey: string;
  selectedAnchorRef: string;
  returnTargetRef: string;
  expiresAt: string | null;
  scrubbedDestination: string;
  reason: string;
  source_refs: readonly string[];
}

export interface ArtifactIssue {
  code: string;
  severity: "warning" | "error";
  message: string;
}

export interface ArtifactActionAvailability {
  label: string;
  allowed: boolean;
  reason: string;
}

export interface ArtifactModeTruthProjection {
  requestedMode: ArtifactRequestedMode;
  currentMode: ArtifactStageMode;
  tone: ArtifactTone;
  fallbackKind: ArtifactFallbackKind;
  fallbackTrigger: ArtifactFallbackTrigger;
  parityLabel: string;
  sourceAuthorityLabel: string;
  canPreview: boolean;
  canDownload: boolean;
  canPrint: boolean;
  canHandoff: boolean;
  handoffPosture: ArtifactHandoffPosture;
  transferPosture: "idle" | "arming" | "pending" | "available" | "recovery_only" | "blocked";
  returnTruthState: ArtifactReturnTruthState;
  returnSummary: string;
  previewSummary: string;
  issues: readonly ArtifactIssue[];
  reasonTrail: readonly string[];
}

export interface ArtifactShellSpecimen {
  id: string;
  title: string;
  subtitle: string;
  artifactKind: ArtifactKind;
  artifactLabel: string;
  summarySections: readonly ArtifactSummarySection[];
  previewPages: readonly ArtifactPreviewPage[];
  contract: ArtifactPresentationContract;
  binding: ArtifactSurfaceBinding;
  parityDigest: ArtifactParityDigest;
  context: ArtifactSurfaceContext;
  transferSettlement: ArtifactTransferSettlement;
  fallbackDisposition: ArtifactFallbackDisposition;
  grant: OutboundNavigationGrant;
}

function joinClasses(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function formatTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toISOString().slice(0, 16).replace("T", " ");
}

function fallbackMode(kind: ArtifactFallbackKind): ArtifactStageMode {
  if (kind === "placeholder_only") {
    return "placeholder_only";
  }
  if (kind === "recovery_only" || kind === "secure_send_later") {
    return "recovery_only";
  }
  return "structured_summary";
}

function parityLabel(parityState: ArtifactParityState): string {
  switch (parityState) {
    case "summary_verified":
      return "Summary verified";
    case "summary_provisional":
      return "Summary provisional";
    case "source_only":
      return "Source only";
    case "parity_stale":
      return "Parity stale";
    case "parity_unavailable":
      return "Parity unavailable";
    case "parity_blocked":
      return "Parity blocked";
  }
}

function authorityLabel(authorityState: ArtifactAuthorityState): string {
  switch (authorityState) {
    case "summary_verified":
      return "Verified derivative";
    case "summary_provisional":
      return "Provisional summary";
    case "source_only":
      return "Source authority only";
    case "recovery_only":
      return "Recovery-only status";
  }
}

export function validateArtifactTruthTuple(
  specimen: ArtifactShellSpecimen,
): readonly ArtifactIssue[] {
  const issues: ArtifactIssue[] = [];

  if (specimen.binding.routeFamilyRef !== specimen.context.routeFamilyRef) {
    issues.push({
      code: "ARTIFACT_ROUTE_FAMILY_MISMATCH",
      severity: "error",
      message: "ArtifactSurfaceBinding and ArtifactSurfaceContext must agree on journey group.",
    });
  }

  if (specimen.binding.selectedAnchorRef !== specimen.context.selectedAnchorRef) {
    issues.push({
      code: "ARTIFACT_SELECTED_ANCHOR_MISMATCH",
      severity: "error",
      message: "ArtifactSurfaceBinding and ArtifactSurfaceContext lost the same selected anchor.",
    });
  }

  if (
    specimen.grant.state === "active" &&
    (specimen.grant.routeFamilyRef !== specimen.context.routeFamilyRef ||
      specimen.grant.continuityKey !== specimen.context.shellContinuityKey ||
      specimen.grant.selectedAnchorRef !== specimen.context.selectedAnchorRef ||
      specimen.grant.returnTargetRef !== specimen.context.returnTargetRef)
  ) {
    issues.push({
      code: "ARTIFACT_GRANT_SCOPE_MISMATCH",
      severity: "error",
      message:
        "Active OutboundNavigationGrant must stay scoped to the same journey group, continuity key, anchor, and return target as the current artifact context.",
    });
  }

  if (
    specimen.contract.requiredSummaryAuthority === "verified_only" &&
    specimen.parityDigest.authorityState !== "summary_verified"
  ) {
    issues.push({
      code: "ARTIFACT_VERIFIED_SUMMARY_REQUIRED",
      severity: "warning",
      message:
        "This rules requires verified summary authority, but the current parity digest is provisional or source-only.",
    });
  }

  if (
    specimen.context.summarySafetyTier === "recovery_only" &&
    specimen.parityDigest.authorityState !== "recovery_only"
  ) {
    issues.push({
      code: "ARTIFACT_RECOVERY_TIER_DRIFT",
      severity: "warning",
      message:
        "Recovery-only summary safety should align with recovery-only parity authority so the shell stays causally honest.",
    });
  }

  if (
    specimen.transferSettlement.localAckState !== "none" &&
    specimen.transferSettlement.authoritativeTransferState === "not_started"
  ) {
    issues.push({
      code: "ARTIFACT_TRANSFER_ACK_DRIFT",
      severity: "warning",
      message:
        "Local acknowledgement exists without a corresponding transfer state. Transfer status must not overclaim readiness.",
    });
  }

  return issues;
}

export function resolveArtifactModeTruth(
  specimen: ArtifactShellSpecimen,
): ArtifactModeTruthProjection {
  const issues = validateArtifactTruthTuple(specimen);
  const reasonTrail: string[] = [];
  const {
    contract,
    binding,
    context,
    parityDigest,
    transferSettlement,
    grant,
  } = specimen;

  let fallbackKind: ArtifactFallbackKind = "none";
  let fallbackTrigger: ArtifactFallbackTrigger = "none";
  let currentMode: ArtifactStageMode = "structured_summary";
  let tone: ArtifactTone = "neutral";

  const parityBlocked =
    parityDigest.sourceParityState === "parity_blocked" ||
    parityDigest.authorityState === "recovery_only";
  const parityStale =
    parityDigest.sourceParityState === "parity_stale" ||
    parityDigest.sourceParityState === "summary_provisional";
  const previewPolicyAllows = contract.previewPolicy === "inline_preview";
  const basePreviewAllowed = previewPolicyAllows && context.byteDeliveryPosture === "available";
  const baseDownloadAllowed =
    contract.downloadPolicy === "allowed" && context.byteDeliveryPosture !== "blocked";
  const basePrintAllowed =
    contract.printPolicy === "allowed" &&
    context.channelPosture === "standard_browser" &&
    grant.state === "active";
  const baseHandoffAllowed =
    contract.handoffPolicy === "grant_required" &&
    grant.state === "active" &&
    context.channelPosture !== "embedded";

  let canPreview = basePreviewAllowed;
  let canDownload = baseDownloadAllowed;
  let canPrint = basePrintAllowed;
  let canHandoff = baseHandoffAllowed;

  if (context.channelPosture === "embedded") {
    reasonTrail.push("Embedded channel status fails closed to same-shell summary.");
    canPreview = false;
    canPrint = false;
    canHandoff = false;
    fallbackKind = binding.embeddedFallback;
    fallbackTrigger = "embedded_limit";
  } else if (
    context.channelPosture === "constrained_browser" &&
    context.artifactModeRequest !== "structured_summary"
  ) {
    reasonTrail.push("Constrained browser status suppresses detached preview and print surfaces.");
    canPrint = false;
    if (
      context.artifactModeRequest === "governed_preview" &&
      contract.previewPolicy !== "inline_preview"
    ) {
      canPreview = false;
    }
  }

  if (context.byteDeliveryPosture === "large_guarded") {
    reasonTrail.push("Large guarded bytes downgrade preview to a approved summary.");
    canPreview = false;
    if (fallbackKind === "none") {
      fallbackKind = "placeholder_only";
      fallbackTrigger = "large_artifact";
    }
  } else if (
    context.byteDeliveryPosture === "blocked" ||
    context.byteDeliveryPosture === "embedded_blocked"
  ) {
    reasonTrail.push("Byte delivery status blocks inline preview and download.");
    canPreview = false;
    canDownload = false;
    if (fallbackKind === "none") {
      fallbackKind = binding.unsupportedFallback;
      fallbackTrigger =
        context.byteDeliveryPosture === "embedded_blocked" ? "embedded_limit" : "preview_blocked";
    }
  }

  if (parityBlocked) {
    reasonTrail.push("Parity is blocked, so the shell must downgrade to recovery status.");
    tone = "critical";
    canPreview = false;
    canPrint = false;
    canHandoff = false;
    fallbackKind = "recovery_only";
    fallbackTrigger = "parity_drift";
  } else if (parityStale) {
    tone = "caution";
    reasonTrail.push(
      "Parity is provisional or stale, so the shell must say so before preview is trusted.",
    );
  }

  if (grant.state === "expired") {
    reasonTrail.push("Expired navigation grant blocks print or handoff without leaving the shell.");
    canPrint = false;
    canHandoff = false;
    if (
      context.artifactModeRequest === "print_preview" ||
      context.artifactModeRequest === "external_handoff"
    ) {
      fallbackKind = fallbackKind === "recovery_only" ? fallbackKind : "summary_only";
      fallbackTrigger = "grant_expired";
    }
  } else if (grant.state === "blocked") {
    reasonTrail.push("Blocked navigation grant forces in-place recovery.");
    canPrint = false;
    canHandoff = false;
    fallbackKind = "recovery_only";
    fallbackTrigger = "grant_blocked";
    tone = "critical";
  }

  if (
    contract.requiredSummaryAuthority === "verified_only" &&
    parityDigest.authorityState !== "summary_verified"
  ) {
    reasonTrail.push("Verified summary is required, so richer artifact modes are held back.");
    canPreview = false;
    if (fallbackKind === "none") {
      fallbackKind = binding.staleFallback;
      fallbackTrigger = "stale_publication";
    }
  }

  switch (context.artifactModeRequest) {
    case "structured_summary":
      currentMode = fallbackKind === "recovery_only" ? "recovery_only" : "structured_summary";
      break;
    case "governed_preview":
      currentMode =
        canPreview && fallbackKind === "none"
          ? "governed_preview"
          : fallbackMode(fallbackKind || "summary_only");
      if (!canPreview && fallbackKind === "none") {
        fallbackKind = "summary_only";
        fallbackTrigger = "preview_blocked";
      }
      break;
    case "download":
      currentMode = fallbackKind === "recovery_only" ? "recovery_only" : "structured_summary";
      if (!canDownload && fallbackKind === "none") {
        fallbackKind = "summary_only";
        fallbackTrigger = "preview_blocked";
      }
      break;
    case "print_preview":
      currentMode =
        canPrint && fallbackKind === "none"
          ? "print_preview"
          : fallbackMode(fallbackKind || "summary_only");
      if (!canPrint && fallbackKind === "none") {
        fallbackKind = "summary_only";
        fallbackTrigger = "preview_blocked";
      }
      break;
    case "external_handoff":
      currentMode = fallbackKind === "recovery_only" ? "recovery_only" : "structured_summary";
      if (!canHandoff && fallbackKind === "none") {
        fallbackKind = "summary_only";
        fallbackTrigger = "preview_blocked";
      }
      break;
  }

  let transferPosture: ArtifactModeTruthProjection["transferPosture"] = "idle";
  switch (transferSettlement.authoritativeTransferState) {
    case "arming":
      transferPosture = "arming";
      break;
    case "pending":
      transferPosture = "pending";
      break;
    case "available":
    case "returned":
      transferPosture = "available";
      break;
    case "recovery_required":
      transferPosture = "recovery_only";
      tone = "critical";
      fallbackKind = "recovery_only";
      if (fallbackTrigger === "none") {
        fallbackTrigger = "grant_blocked";
      }
      break;
    case "blocked":
      transferPosture = "blocked";
      tone = "critical";
      break;
    case "not_started":
      transferPosture = "idle";
      break;
  }

  if (fallbackKind === "recovery_only") {
    currentMode = "recovery_only";
  } else if (
    fallbackKind === "placeholder_only" &&
    context.artifactModeRequest === "governed_preview"
  ) {
    currentMode = "placeholder_only";
  }

  let returnTruthState: ArtifactReturnTruthState = "return_guarded";
  let returnSummary =
    "The shell keeps the selected anchor and return target visible while transfer status settles.";
  if (
    grant.state === "active" &&
    grant.continuityKey === context.shellContinuityKey &&
    grant.returnTargetRef === context.returnTargetRef
  ) {
    returnTruthState = "return_safe";
    returnSummary = `Return safe via ${context.returnTargetLabel}.`;
  } else if (grant.state === "expired" || grant.state === "blocked") {
    returnTruthState = "return_blocked";
    returnSummary =
      "Return-safe continuity is not lawful, so the shell stays in place and surfaces recovery instead of departing.";
  }

  const handoffPosture: ArtifactHandoffPosture =
    canHandoff && context.artifactModeRequest === "external_handoff"
      ? "armed"
      : canHandoff
        ? "secondary"
        : "blocked";

  const previewSummary =
    currentMode === "governed_preview"
      ? "Approved inline preview stays inside the same shell."
      : currentMode === "print_preview"
        ? "Print status uses the same approved stage before any browser step."
        : currentMode === "placeholder_only"
          ? "A approved summary replaces preview while the verified summary remains primary."
          : currentMode === "recovery_only"
            ? "Recovery status replaces preview while the last safe summary stays visible."
            : "Structured summary remains the primary approved surface.";

  return {
    requestedMode: context.artifactModeRequest,
    currentMode,
    tone,
    fallbackKind,
    fallbackTrigger,
    parityLabel: parityLabel(parityDigest.sourceParityState),
    sourceAuthorityLabel: authorityLabel(parityDigest.authorityState),
    canPreview,
    canDownload,
    canPrint,
    canHandoff,
    handoffPosture,
    transferPosture,
    returnTruthState,
    returnSummary,
    previewSummary,
    issues,
    reasonTrail,
  };
}

export const ArtifactModeTruthResolver = resolveArtifactModeTruth;

function actionAvailability(
  label: string,
  allowed: boolean,
  reason: string,
): ArtifactActionAvailability {
  return { label, allowed, reason };
}

export function ArtifactActionMatrix({
  specimen,
  projection,
}: {
  specimen: ArtifactShellSpecimen;
  projection: ArtifactModeTruthProjection;
}) {
  const actions = [
    actionAvailability(
      "Preview",
      projection.canPreview,
      projection.canPreview
        ? "Inline preview is lawful for the current tuple."
        : "Preview is downgraded in place for the current tuple.",
    ),
    actionAvailability(
      "Download",
      projection.canDownload,
      projection.canDownload
        ? "Approved byte delivery can remain secondary."
        : "Byte delivery is unavailable for the current tuple.",
    ),
    actionAvailability(
      "Print",
      projection.canPrint,
      projection.canPrint
        ? "Print preview is armed under the current rules and grant."
        : "Print stays secondary and unarmed because the current tuple cannot support it.",
    ),
    actionAvailability(
      "Handoff",
      projection.canHandoff,
      projection.canHandoff
        ? "The current grant keeps handoff route-scoped and return-safe."
        : "External movement is blocked; the shell keeps the same summary visible instead.",
    ),
  ] as const;

  return (
    <section className="artifact-shell-action-matrix" data-testid="artifact-action-matrix">
      {actions.map((action) => (
        <button
          key={action.label}
          className={joinClasses(
            "artifact-shell-control",
            action.allowed && "artifact-shell-control--active",
          )}
          type="button"
          disabled={!action.allowed}
          aria-disabled={!action.allowed}
          data-action={action.label.toLowerCase()}
          data-route-family={specimen.binding.routeFamilyRef}
        >
          <span>{action.label}</span>
          <small>{action.reason}</small>
        </button>
      ))}
    </section>
  );
}

export function ArtifactParityDigestPanel({
  digest,
  projection,
}: {
  digest: ArtifactParityDigest;
  projection: ArtifactModeTruthProjection;
}) {
  return (
    <section
      className={joinClasses(
        "artifact-shell-panel",
        "artifact-shell-parity",
        projection.tone === "caution" && "artifact-shell-panel--caution",
        projection.tone === "critical" && "artifact-shell-panel--critical",
      )}
      data-testid="artifact-parity-digest"
      data-dom-marker="parity-digest"
      data-parity-state={digest.sourceParityState}
      data-authority-state={digest.authorityState}
    >
      <div className="artifact-shell-panel__header">
        <span className="artifact-shell-kicker">Parity</span>
        <h3>{projection.parityLabel}</h3>
      </div>
      <p>{digest.parityStatement}</p>
      <dl className="artifact-shell-definition-list">
        <div>
          <dt>Authority</dt>
          <dd>{projection.sourceAuthorityLabel}</dd>
        </div>
        <div>
          <dt>Verified</dt>
          <dd>{formatTimestamp(digest.lastVerifiedAt)}</dd>
        </div>
        <div>
          <dt>Verifier</dt>
          <dd>{digest.verifiedBy}</dd>
        </div>
        <div>
          <dt>Drift</dt>
          <dd>{digest.driftReason ?? "No drift recorded."}</dd>
        </div>
      </dl>
    </section>
  );
}

export function ArtifactTransferTimeline({
  specimen,
  projection,
}: {
  specimen: ArtifactShellSpecimen;
  projection: ArtifactModeTruthProjection;
}) {
  const steps = [
    {
      label: "Anchor retained",
      state: "complete",
      detail: `${specimen.context.selectedAnchorLabel} stays visible through the artifact journey.`,
    },
    {
      label: "Mode verified details",
      state:
        projection.currentMode === "recovery_only" || projection.currentMode === "placeholder_only"
          ? "guarded"
          : "complete",
      detail: projection.previewSummary,
    },
    {
      label: "Transfer settlement",
      state: projection.transferPosture,
      detail: specimen.transferSettlement.progressLabel,
    },
    {
      label: "Return target",
      state: projection.returnTruthState,
      detail: projection.returnSummary,
    },
  ] as const;

  return (
    <section className="artifact-shell-timeline" data-testid="artifact-transfer-timeline">
      {steps.map((step) => (
        <article
          key={step.label}
          className="artifact-shell-timeline__step"
          data-step-state={step.state}
        >
          <span className="artifact-shell-kicker">{step.label}</span>
          <strong>{step.state}</strong>
          <p>{step.detail}</p>
        </article>
      ))}
    </section>
  );
}

function ArtifactSummaryRail({
  specimen,
  projection,
}: {
  specimen: ArtifactShellSpecimen;
  projection: ArtifactModeTruthProjection;
}) {
  return (
    <section className="artifact-shell-summary-rail" data-testid="artifact-summary-rail">
      <article
        className="artifact-shell-anchor"
        data-testid="artifact-selected-anchor"
        data-dom-marker="selected-anchor"
      >
        <span className="artifact-shell-kicker">Selected anchor</span>
        <strong>{specimen.binding.selectedAnchorLabel}</strong>
        <p>{projection.returnSummary}</p>
      </article>
      {specimen.summarySections.map((section) => (
        <article
          className="artifact-shell-summary-section"
          key={section.id}
          data-summary-section={section.id}
        >
          <h3>{section.title}</h3>
          <p>{section.body}</p>
          {section.emphasis ? <strong>{section.emphasis}</strong> : null}
        </article>
      ))}
    </section>
  );
}

function ArtifactPreviewFrame({
  specimen,
  projection,
}: {
  specimen: ArtifactShellSpecimen;
  projection: ArtifactModeTruthProjection;
}) {
  if (projection.currentMode === "recovery_only") {
    return (
      <section
        className="artifact-shell-stage-message artifact-shell-stage-message--critical"
        data-testid="artifact-stage-recovery"
        data-dom-marker="recovery-posture"
        data-recovery-posture={projection.fallbackKind}
      >
        <span className="artifact-shell-kicker">Recovery</span>
        <h3>{specimen.fallbackDisposition.title}</h3>
        <p>{specimen.fallbackDisposition.summary}</p>
        <strong>{specimen.fallbackDisposition.recoveryActionLabel}</strong>
      </section>
    );
  }

  if (projection.currentMode === "placeholder_only") {
    return (
      <section
        className="artifact-shell-stage-message artifact-shell-stage-message--caution"
        data-testid="artifact-stage-placeholder"
        data-dom-marker="recovery-posture"
        data-recovery-posture={projection.fallbackKind}
      >
        <span className="artifact-shell-kicker">Summary</span>
        <h3>Preview held back</h3>
        <p>{specimen.fallbackDisposition.summary}</p>
        <strong>Use the verified summary while approved delivery catches up.</strong>
      </section>
    );
  }

  const previewHeading =
    projection.currentMode === "print_preview" ? "Print-safe preview" : "Approved preview";

  return (
    <section
      className="artifact-shell-preview"
      data-testid="artifact-governed-preview"
      data-preview-mode={projection.currentMode}
    >
      <div className="artifact-shell-preview__header">
        <span className="artifact-shell-kicker">{previewHeading}</span>
        <strong>{projection.previewSummary}</strong>
      </div>
      <div className="artifact-shell-preview__pages">
        {projection.currentMode === "structured_summary" ? (
          <article className="artifact-shell-preview__page artifact-shell-preview__page--summary">
            <h4>Summary-first status</h4>
            <p>{projection.previewSummary}</p>
          </article>
        ) : (
          specimen.previewPages.map((page) => (
            <article className="artifact-shell-preview__page" key={page.id}>
              <h4>{page.title}</h4>
              {page.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export function ArtifactStage({ specimen }: { specimen: ArtifactShellSpecimen }) {
  const projection = resolveArtifactModeTruth(specimen);
  return (
    <section
      className={joinClasses(
        "artifact-shell-stage",
        projection.currentMode === "governed_preview" && "artifact-shell-stage--preview",
        projection.currentMode === "print_preview" && "artifact-shell-stage--print",
        projection.currentMode === "placeholder_only" && "artifact-shell-stage--placeholder",
        projection.currentMode === "recovery_only" && "artifact-shell-stage--recovery",
      )}
      data-testid="artifact-stage"
      data-dom-marker="artifact-mode"
      data-artifact-mode={projection.currentMode}
      data-requested-mode={projection.requestedMode}
      data-recovery-posture={projection.fallbackKind}
      data-handoff-posture={projection.handoffPosture}
      data-return-truth-state={projection.returnTruthState}
      data-parity-state={specimen.parityDigest.sourceParityState}
    >
      <div className="artifact-shell-stage__header">
        <div>
          <span className="artifact-shell-kicker">{specimen.artifactLabel}</span>
          <h2>{specimen.title}</h2>
          <p>{specimen.subtitle}</p>
        </div>
        <div className="artifact-shell-chip-row">
          <span className="artifact-shell-chip">{projection.parityLabel}</span>
          <span className="artifact-shell-chip">{projection.sourceAuthorityLabel}</span>
          <span className="artifact-shell-chip">{specimen.context.channelPosture}</span>
        </div>
      </div>
      <ArtifactPreviewFrame specimen={specimen} projection={projection} />
    </section>
  );
}

export function ArtifactSurfaceFrame({ specimen }: { specimen: ArtifactShellSpecimen }) {
  const projection = resolveArtifactModeTruth(specimen);
  return (
    <section
      className={joinClasses(
        "artifact-shell-frame",
        projection.tone === "caution" && "artifact-shell-frame--caution",
        projection.tone === "critical" && "artifact-shell-frame--critical",
      )}
      data-testid={`artifact-surface-frame-${specimen.id}`}
      data-artifact-id={specimen.id}
      data-route-family={specimen.binding.routeFamilyRef}
      data-continuity-key={specimen.context.shellContinuityKey}
      data-dom-marker="continuity-key"
    >
      <header className="artifact-shell-frame__masthead">
        <div>
          <VecellLogoWordmark
            aria-hidden="true"
            style={{ width: 108, height: "auto", marginBottom: 8 }}
          />
          <h1>{specimen.title}</h1>
          <p>{specimen.subtitle}</p>
        </div>
        <div className="artifact-shell-frame__status">
          <strong>{projection.parityLabel}</strong>
          <span>{specimen.context.returnTargetLabel}</span>
        </div>
      </header>
      <div className="artifact-shell-frame__layout">
        <ArtifactSummaryRail specimen={specimen} projection={projection} />
        <ArtifactStage specimen={specimen} />
        <aside className="artifact-shell-inspector" data-testid="artifact-right-rail">
          <ArtifactParityDigestPanel digest={specimen.parityDigest} projection={projection} />
          <section
            className="artifact-shell-panel"
            data-testid="artifact-grant-panel"
            data-dom-marker="handoff-posture"
            data-grant-state={specimen.grant.state}
            data-handoff-posture={projection.handoffPosture}
          >
            <div className="artifact-shell-panel__header">
              <span className="artifact-shell-kicker">Grant</span>
              <h3>{specimen.grant.destinationLabel}</h3>
            </div>
            <p>{specimen.grant.reason}</p>
            <dl className="artifact-shell-definition-list">
              <div>
                <dt>Grant state</dt>
                <dd>{specimen.grant.state}</dd>
              </div>
              <div>
                <dt>Continuity</dt>
                <dd>{specimen.grant.continuityKey}</dd>
              </div>
              <div>
                <dt>Return target</dt>
                <dd>{specimen.context.returnTargetLabel}</dd>
              </div>
              <div>
                <dt>Expires</dt>
                <dd>
                  {specimen.grant.expiresAt ? formatTimestamp(specimen.grant.expiresAt) : "N/A"}
                </dd>
              </div>
            </dl>
          </section>
          <ArtifactActionMatrix specimen={specimen} projection={projection} />
          <section className="artifact-shell-panel" data-testid="artifact-reason-trail">
            <div className="artifact-shell-panel__header">
              <span className="artifact-shell-kicker">Confirmed information trail</span>
              <h3>Why this mode is live</h3>
            </div>
            <ul>
              {projection.reasonTrail.length > 0 ? (
                projection.reasonTrail.map((reason) => <li key={reason}>{reason}</li>)
              ) : (
                <li>The current tuple keeps approved preview available without fallback.</li>
              )}
            </ul>
          </section>
        </aside>
      </div>
      <ArtifactTransferTimeline specimen={specimen} projection={projection} />
    </section>
  );
}

function fallbackCopy(
  trigger: ArtifactFallbackTrigger,
  artifactLabel: string,
): Pick<ArtifactFallbackDisposition, "title" | "summary" | "recoveryActionLabel"> {
  switch (trigger) {
    case "embedded_limit":
      return {
        title: "Embedded channel limit",
        summary: `${artifactLabel} stays in the same shell summary because the current embedded host cannot guarantee lawful preview or return-safe handoff.`,
        recoveryActionLabel: "Open in a safer browser when a scoped grant is available.",
      };
    case "grant_expired":
      return {
        title: "Grant expired",
        summary: `The shell keeps the last safe ${artifactLabel.toLowerCase()} summary visible because the current grant expired before print or handoff could complete.`,
        recoveryActionLabel: "Request a fresh scoped grant from the same journey group.",
      };
    case "grant_blocked":
      return {
        title: "Grant blocked",
        summary: `${artifactLabel} cannot leave the shell because continuity, masking, or destination scope no longer match the active route details.`,
        recoveryActionLabel: "Resolve the blocker, then retry from the same anchor.",
      };
    case "large_artifact":
      return {
        title: "Preview deferred",
        summary: `${artifactLabel} is too large for quiet inline preview right now, so the approved summary remains the primary surface.`,
        recoveryActionLabel: "Use download later or wait for secure-send-later settlement.",
      };
    case "parity_drift":
      return {
        title: "Parity drift detected",
        summary: `${artifactLabel} dropped out of verified parity, so the shell must fall back to recovery-first status before preview or transfer can continue.`,
        recoveryActionLabel: "Refresh approved parity from the same shell.",
      };
    case "stale_publication":
      return {
        title: "Verified summary required",
        summary: `This ${artifactLabel.toLowerCase()} rule requires verified summary authority before richer modes can arm.`,
        recoveryActionLabel: "Wait for verified publication parity or stay on the summary.",
      };
    case "preview_blocked":
    case "unsupported_type":
      return {
        title: "Preview unavailable",
        summary: `${artifactLabel} keeps the structured summary in place because current preview status is not approved.`,
        recoveryActionLabel: "Use the summary or request approved delivery later.",
      };
    case "none":
      return {
        title: "No fallback",
        summary: "The current rule keeps approved preview available without fallback.",
        recoveryActionLabel: "Continue in the same shell.",
      };
  }
}

function createArtifactSpecimen(config: {
  id: string;
  title: string;
  subtitle: string;
  artifactKind: ArtifactKind;
  artifactLabel: string;
  routeFamilyRef: string;
  selectedAnchorLabel: string;
  returnTargetLabel: string;
  requestedMode: ArtifactRequestedMode;
  channelPosture: ArtifactChannelPosture;
  summarySafetyTier: ArtifactSummarySafetyTier;
  byteDeliveryPosture: ArtifactByteDeliveryPosture;
  previewPolicy: ArtifactPreviewPolicy;
  downloadPolicy: ArtifactActionPolicy;
  printPolicy: ArtifactActionPolicy;
  handoffPolicy: ArtifactHandoffPolicy;
  requiredSummaryAuthority: ArtifactPresentationContract["requiredSummaryAuthority"];
  parityState: ArtifactParityState;
  authorityState: ArtifactAuthorityState;
  parityStatement: string;
  driftReason: string | null;
  verifiedBy: string;
  grantState: ArtifactGrantState;
  destinationLabel: string;
  destinationType: ArtifactDestinationType;
  grantReason: string;
  transferKind: ArtifactTransferKind;
  transferState: ArtifactTransferState;
  localAckState: ArtifactLocalAckState;
  transferLabel: string;
  embeddedFallback: ArtifactFallbackKind;
  staleFallback: ArtifactFallbackKind;
  unsupportedFallback: ArtifactFallbackKind;
  fallbackTrigger: ArtifactFallbackTrigger;
  summarySections: readonly ArtifactSummarySection[];
  previewPages: readonly ArtifactPreviewPage[];
}) {
  const fallbackDetails = fallbackCopy(config.fallbackTrigger, config.artifactLabel);
  const selectedAnchorRef = `anchor::${config.id}`;
  const returnTargetRef = `return::${config.id}`;
  const continuityKey = `artifact-shell::${config.routeFamilyRef}`;

  return {
    id: config.id,
    title: config.title,
    subtitle: config.subtitle,
    artifactKind: config.artifactKind,
    artifactLabel: config.artifactLabel,
    summarySections: config.summarySections,
    previewPages: config.previewPages,
    contract: {
      contractId: `artifact-contract::${config.id}`,
      artifactKind: config.artifactKind,
      summaryRequired: true,
      previewPolicy: config.previewPolicy,
      downloadPolicy: config.downloadPolicy,
      printPolicy: config.printPolicy,
      handoffPolicy: config.handoffPolicy,
      requiredSummaryAuthority: config.requiredSummaryAuthority,
      source_refs: [
        "blueprint/platform-frontend-blueprint.md#ArtifactPresentationContract",
        "prompt/109.md",
      ],
    },
    binding: {
      bindingId: `artifact-binding::${config.id}`,
      routeFamilyRef: config.routeFamilyRef,
      artifactLabel: config.artifactLabel,
      selectedAnchorRef,
      selectedAnchorLabel: config.selectedAnchorLabel,
      previewContractRef: `preview-contract::${config.id}`,
      downloadContractRef: `download-contract::${config.id}`,
      printContractRef: `print-contract::${config.id}`,
      handoffContractRef: `handoff-contract::${config.id}`,
      requiredParityStates: [
        "summary_verified",
        "summary_provisional",
        "source_only",
        "parity_stale",
      ],
      embeddedFallback: config.embeddedFallback,
      staleFallback: config.staleFallback,
      unsupportedFallback: config.unsupportedFallback,
      source_refs: [
        "blueprint/platform-frontend-blueprint.md#ArtifactSurfaceBinding",
        "prompt/109.md#Implementation_deliverables_to_create",
      ],
    },
    parityDigest: {
      parityDigestId: `artifact-parity::${config.id}`,
      sourceArtifactHash: `sha256::source::${config.id}`,
      summaryHash: `sha256::summary::${config.id}`,
      authorityState: config.authorityState,
      sourceParityState: config.parityState,
      parityStatement: config.parityStatement,
      lastVerifiedAt: "2026-04-13T16:41:00Z",
      verifiedBy: config.verifiedBy,
      driftReason: config.driftReason,
      source_refs: [
        "blueprint/platform-frontend-blueprint.md#ArtifactParityDigest",
        "prompt/109.md#Exact_surface_behavior",
      ],
    },
    context: {
      contextId: `artifact-context::${config.id}`,
      shellContinuityKey: continuityKey,
      routeFamilyRef: config.routeFamilyRef,
      selectedAnchorRef,
      selectedAnchorLabel: config.selectedAnchorLabel,
      returnTargetRef,
      returnTargetLabel: config.returnTargetLabel,
      channelPosture: config.channelPosture,
      artifactModeRequest: config.requestedMode,
      visibilityCeiling: "full",
      summarySafetyTier: config.summarySafetyTier,
      byteDeliveryPosture: config.byteDeliveryPosture,
      currentRouteLineage: `${config.routeFamilyRef}::stage`,
      source_refs: [
        "blueprint/platform-frontend-blueprint.md#ArtifactSurfaceContext",
        "prompt/109.md#Implementation_instructions",
      ],
    },
    transferSettlement: {
      settlementId: `artifact-transfer::${config.id}`,
      transferKind: config.transferKind,
      authoritativeTransferState: config.transferState,
      localAckState: config.localAckState,
      progressLabel: config.transferLabel,
      lastUpdatedAt: "2026-04-13T16:43:00Z",
      source_refs: [
        "blueprint/platform-frontend-blueprint.md#ArtifactTransferSettlement",
        "prompt/109.md#Verification_requirements",
      ],
    },
    fallbackDisposition: {
      fallbackId: `artifact-fallback::${config.id}`,
      fallbackKind:
        config.fallbackTrigger === "large_artifact"
          ? "placeholder_only"
          : config.fallbackTrigger === "grant_blocked" || config.fallbackTrigger === "parity_drift"
            ? "recovery_only"
            : config.fallbackTrigger === "embedded_limit" ||
                config.fallbackTrigger === "grant_expired" ||
                config.fallbackTrigger === "stale_publication" ||
                config.fallbackTrigger === "preview_blocked"
              ? "summary_only"
              : "none",
      trigger: config.fallbackTrigger,
      title: fallbackDetails.title,
      summary: fallbackDetails.summary,
      recoveryActionLabel: fallbackDetails.recoveryActionLabel,
      source_refs: [
        "blueprint/platform-frontend-blueprint.md#ArtifactFallbackDisposition",
        "prompt/109.md#Gap_handling_you_must_perform_during_this_task",
      ],
    },
    grant: {
      grantId: `outbound-grant::${config.id}`,
      state: config.grantState,
      destinationLabel: config.destinationLabel,
      destinationType: config.destinationType,
      routeFamilyRef: config.routeFamilyRef,
      continuityKey,
      selectedAnchorRef,
      returnTargetRef,
      expiresAt:
        config.grantState === "active"
          ? "2026-04-13T16:58:00Z"
          : config.grantState === "expired"
            ? "2026-04-13T16:30:00Z"
            : null,
      scrubbedDestination: `${config.destinationType}://${config.id}`,
      reason: config.grantReason,
      source_refs: [
        "blueprint/platform-frontend-blueprint.md#OutboundNavigationGrant",
        "prompt/109.md#Implementation_instructions",
      ],
    },
  } satisfies ArtifactShellSpecimen;
}

export const artifactShellSpecimens = [
  createArtifactSpecimen({
    id: "appointment_confirmation_preview",
    title: "Appointment confirmation",
    subtitle:
      "A patient-safe confirmation stays summary-first while approved preview, download, print, and handoff remain secondary.",
    artifactKind: "appointment_confirmation",
    artifactLabel: "Appointment confirmation",
    routeFamilyRef: "rf_patient_appointment_receipt",
    selectedAnchorLabel: "Booking support request card",
    returnTargetLabel: "Patient booking timeline",
    requestedMode: "governed_preview",
    channelPosture: "standard_browser",
    summarySafetyTier: "verified",
    byteDeliveryPosture: "available",
    previewPolicy: "inline_preview",
    downloadPolicy: "allowed",
    printPolicy: "allowed",
    handoffPolicy: "grant_required",
    requiredSummaryAuthority: "verified_only",
    parityState: "summary_verified",
    authorityState: "summary_verified",
    parityStatement:
      "The confirmation summary, inline preview, and byte artifact are derived from the same settled booking tuple.",
    driftReason: null,
    verifiedBy: "Booking publication bundle",
    grantState: "active",
    destinationLabel: "Approved browser handoff",
    destinationType: "browser",
    grantReason: "Scoped browser handoff remains active for the same booking journey group.",
    transferKind: "none",
    transferState: "not_started",
    localAckState: "none",
    transferLabel: "No external transfer is currently in progress.",
    embeddedFallback: "summary_only",
    staleFallback: "summary_only",
    unsupportedFallback: "summary_only",
    fallbackTrigger: "none",
    summarySections: [
      {
        id: "what_changed",
        title: "What changed",
        body: "Your appointment has been reserved for Tuesday 16 April at 09:40.",
        emphasis: "The shell can say this with verified confidence.",
      },
      {
        id: "where_to_go",
        title: "Where to go",
        body: "Community clinic, Floor 2, Room 14. Bring your NHS number and current medications.",
      },
      {
        id: "support",
        title: "Support and access",
        body: "Need to change the slot or request support? Use the same booking timeline instead of leaving the shell.",
      },
    ],
    previewPages: [
      {
        id: "page_1",
        title: "Confirmation page",
        lines: [
          "Appointment confirmation",
          "Patient: Samira Ahmed",
          "Time: Tuesday 16 April 2026, 09:40",
          "Location: Community clinic, Floor 2, Room 14",
        ],
      },
      {
        id: "page_2",
        title: "Preparation notes",
        lines: [
          "Bring your current medicines.",
          "Arrive 10 minutes early.",
          "Use the patient booking timeline if you need support.",
        ],
      },
    ],
  }),
  createArtifactSpecimen({
    id: "record_result_provisional_preview",
    title: "Record result summary",
    subtitle:
      "A lab-result summary keeps provisional parity visible before anyone assumes the shell summary fully matches the source artifact.",
    artifactKind: "record_result_summary",
    artifactLabel: "Record result summary",
    routeFamilyRef: "rf_patient_record_results",
    selectedAnchorLabel: "Result card in patient record",
    returnTargetLabel: "Patient record result list",
    requestedMode: "governed_preview",
    channelPosture: "standard_browser",
    summarySafetyTier: "provisional",
    byteDeliveryPosture: "available",
    previewPolicy: "inline_preview",
    downloadPolicy: "allowed",
    printPolicy: "allowed",
    handoffPolicy: "grant_required",
    requiredSummaryAuthority: "verified_or_provisional",
    parityState: "parity_stale",
    authorityState: "summary_provisional",
    parityStatement:
      "The summary reflects the latest safe parsed result, but a fresh clinician annotation is still reconciling with the source PDF.",
    driftReason: "Annotation digest pending publication parity refresh.",
    verifiedBy: "Record parity witness",
    grantState: "active",
    destinationLabel: "Secure browser review",
    destinationType: "browser",
    grantReason: "A scoped grant exists, but the shell still presents parity as provisional.",
    transferKind: "none",
    transferState: "not_started",
    localAckState: "none",
    transferLabel: "Preview remains in the shell until parity refresh completes.",
    embeddedFallback: "summary_only",
    staleFallback: "summary_only",
    unsupportedFallback: "summary_only",
    fallbackTrigger: "none",
    summarySections: [
      {
        id: "headline",
        title: "Headline reading",
        body: "HbA1c remains above target and the care note was updated five minutes ago.",
        emphasis: "Provisional parity remains visible beside the summary.",
      },
      {
        id: "what_to_do",
        title: "What to do next",
        body: "Review the new care note with your clinician or wait for the final record publication.",
      },
      {
        id: "source_authority",
        title: "Source authority",
        body: "The source PDF is available, but the summary remains marked provisional until parity settles.",
      },
    ],
    previewPages: [
      {
        id: "page_1",
        title: "Result extract",
        lines: [
          "Lab result summary",
          "HbA1c: 71 mmol/mol",
          "Trend: unchanged from prior month",
          "Care note: medication review recommended",
        ],
      },
    ],
  }),
  createArtifactSpecimen({
    id: "evidence_pack_embedded_summary_only",
    title: "Release evidence pack",
    subtitle:
      "The governance evidence pack fails closed to same-shell summary because the embedded host cannot guarantee lawful preview or return-safe handoff.",
    artifactKind: "release_evidence_pack",
    artifactLabel: "Release evidence pack",
    routeFamilyRef: "rf_governance_evidence_pack",
    selectedAnchorLabel: "Governance readiness row",
    returnTargetLabel: "Governance release board",
    requestedMode: "governed_preview",
    channelPosture: "embedded",
    summarySafetyTier: "verified",
    byteDeliveryPosture: "embedded_blocked",
    previewPolicy: "inline_preview",
    downloadPolicy: "allowed",
    printPolicy: "allowed",
    handoffPolicy: "grant_required",
    requiredSummaryAuthority: "verified_only",
    parityState: "summary_verified",
    authorityState: "summary_verified",
    parityStatement:
      "The pack remains verified, but this embedded status cannot safely present preview or print.",
    driftReason: null,
    verifiedBy: "Release publication bundle",
    grantState: "active",
    destinationLabel: "Approved browser handoff",
    destinationType: "browser",
    grantReason: "Grant exists, but the embedded host still fails closed to summary-first status.",
    transferKind: "none",
    transferState: "not_started",
    localAckState: "none",
    transferLabel: "No handoff starts while the host remains embedded.",
    embeddedFallback: "summary_only",
    staleFallback: "summary_only",
    unsupportedFallback: "summary_only",
    fallbackTrigger: "embedded_limit",
    summarySections: [
      {
        id: "pack_scope",
        title: "Pack scope",
        body: "Evidence includes release parity, resilience checks, rollback readiness, and approval notes.",
      },
      {
        id: "current_law",
        title: "Current law",
        body: "This embedded channel cannot safely host preview or print, so the verified summary remains the legal surface.",
        emphasis: "No raw browser action is inferred from byte availability.",
      },
      {
        id: "next_path",
        title: "Next path",
        body: "Open the same route in a safer browser or request a secure-send-later path from governance tools.",
      },
    ],
    previewPages: [
      {
        id: "page_1",
        title: "Evidence index",
        lines: [
          "Release evidence pack",
          "Preview suppressed in embedded status",
          "Summary-first continuity remains active",
        ],
      },
    ],
  }),
  createArtifactSpecimen({
    id: "release_handoff_active_grant",
    title: "Readiness handoff summary",
    subtitle:
      "An operator evidence handoff stays secondary, grant-bound, and return-safe while the same summary and initiating anchor remain visible.",
    artifactKind: "release_evidence_pack",
    artifactLabel: "Readiness handoff summary",
    routeFamilyRef: "rf_operations_release_readiness",
    selectedAnchorLabel: "Release cockpit evidence row",
    returnTargetLabel: "Operations readiness cockpit",
    requestedMode: "external_handoff",
    channelPosture: "standard_browser",
    summarySafetyTier: "verified",
    byteDeliveryPosture: "available",
    previewPolicy: "inline_preview",
    downloadPolicy: "allowed",
    printPolicy: "allowed",
    handoffPolicy: "grant_required",
    requiredSummaryAuthority: "verified_only",
    parityState: "summary_verified",
    authorityState: "summary_verified",
    parityStatement:
      "The handoff summary and source evidence bundle are tied to the same readiness tuple and current release freeze state.",
    driftReason: null,
    verifiedBy: "Operations publication bundle",
    grantState: "active",
    destinationLabel: "Cross-app release workspace",
    destinationType: "cross_app",
    grantReason:
      "Short-lived handoff grant remains scoped to the same journey group and return target.",
    transferKind: "handoff",
    transferState: "pending",
    localAckState: "clicked",
    transferLabel: "Handoff is pending authoritative settlement; the shell still owns continuity.",
    embeddedFallback: "summary_only",
    staleFallback: "summary_only",
    unsupportedFallback: "summary_only",
    fallbackTrigger: "none",
    summarySections: [
      {
        id: "release_state",
        title: "Release state",
        body: "All mandatory checks passed, but the external readiness workspace still owns final acknowledgement.",
      },
      {
        id: "continuity",
        title: "Continuity",
        body: "The evidence row and return target stay visible while the handoff is pending.",
        emphasis: "Click acknowledgement does not equal successful handoff.",
      },
      {
        id: "return_target",
        title: "Return target",
        body: "If the handoff returns, focus restores to the operations readiness cockpit row.",
      },
    ],
    previewPages: [
      {
        id: "page_1",
        title: "Handoff preflight",
        lines: [
          "Readiness handoff summary",
          "Release ring: integration",
          "Return target: operations readiness cockpit",
          "Transfer: pending authoritative settlement",
        ],
      },
    ],
  }),
  createArtifactSpecimen({
    id: "recovery_report_print_expired_grant",
    title: "Recovery report",
    subtitle:
      "Print status degrades in place when the scoped grant expires, keeping the recovery summary and return target visible instead of launching a dead-end print route.",
    artifactKind: "recovery_report",
    artifactLabel: "Recovery report",
    routeFamilyRef: "rf_ops_recovery_reports",
    selectedAnchorLabel: "Recovery incident row",
    returnTargetLabel: "Operations recovery board",
    requestedMode: "print_preview",
    channelPosture: "standard_browser",
    summarySafetyTier: "verified",
    byteDeliveryPosture: "available",
    previewPolicy: "inline_preview",
    downloadPolicy: "allowed",
    printPolicy: "allowed",
    handoffPolicy: "grant_required",
    requiredSummaryAuthority: "verified_only",
    parityState: "summary_verified",
    authorityState: "summary_verified",
    parityStatement:
      "The recovery report remains verified, but print cannot stay armed after the scoped grant expires.",
    driftReason: "Print grant expired before authoritative dialog settlement.",
    verifiedBy: "Recovery disposition ledger",
    grantState: "expired",
    destinationLabel: "Approved print preview",
    destinationType: "print_service",
    grantReason:
      "The print grant has expired, so the shell must fail closed to summary-first status.",
    transferKind: "print",
    transferState: "recovery_required",
    localAckState: "dialog_opened",
    transferLabel: "Print attempt downgraded to in-place recovery after grant expiry.",
    embeddedFallback: "summary_only",
    staleFallback: "summary_only",
    unsupportedFallback: "summary_only",
    fallbackTrigger: "grant_expired",
    summarySections: [
      {
        id: "incident_summary",
        title: "Incident summary",
        body: "Projection rebuild completed, but operator sign-off still needs a fresh print grant.",
      },
      {
        id: "why_print_changed",
        title: "Why print changed",
        body: "The print dialog opened locally, but that acknowledgement is provisional and not authoritative completion.",
        emphasis: "Grant expiry beats local browser feedback.",
      },
      {
        id: "safe_next_step",
        title: "Safe next step",
        body: "Request a fresh print grant from the same recovery board if a physical packet is still required.",
      },
    ],
    previewPages: [
      {
        id: "page_1",
        title: "Print-safe preview",
        lines: [
          "Recovery report",
          "Incident: projection rebuild variance",
          "Print status blocked by expired grant",
        ],
      },
    ],
  }),
  createArtifactSpecimen({
    id: "attachment_large_placeholder",
    title: "Record attachment",
    subtitle:
      "A large attachment keeps the verified summary in place and swaps preview for a quiet approved summary instead of a spinner-only takeover.",
    artifactKind: "record_attachment",
    artifactLabel: "Record attachment",
    routeFamilyRef: "rf_patient_record_attachment",
    selectedAnchorLabel: "Attachment card in patient record",
    returnTargetLabel: "Patient record attachment list",
    requestedMode: "governed_preview",
    channelPosture: "standard_browser",
    summarySafetyTier: "verified",
    byteDeliveryPosture: "large_guarded",
    previewPolicy: "inline_preview",
    downloadPolicy: "allowed",
    printPolicy: "blocked",
    handoffPolicy: "grant_required",
    requiredSummaryAuthority: "verified_only",
    parityState: "summary_verified",
    authorityState: "summary_verified",
    parityStatement:
      "The summary is verified, but the inline preview is intentionally deferred because the attachment is too large for quiet same-shell rendering.",
    driftReason: null,
    verifiedBy: "Attachment parity witness",
    grantState: "active",
    destinationLabel: "Scoped download",
    destinationType: "download",
    grantReason: "Download remains available as a secondary approved action.",
    transferKind: "download",
    transferState: "available",
    localAckState: "clicked",
    transferLabel:
      "The shell can prepare approved download while preview remains summary-only.",
    embeddedFallback: "summary_only",
    staleFallback: "summary_only",
    unsupportedFallback: "placeholder_only",
    fallbackTrigger: "large_artifact",
    summarySections: [
      {
        id: "attachment_scope",
        title: "Attachment scope",
        body: "Uploaded MRI image bundle, 164 MB, linked to the same appointment and record tuple.",
      },
      {
        id: "preview_posture",
        title: "Preview status",
        body: "Inline preview is deferred because large media would otherwise dominate the shell and overclaim readiness.",
      },
      {
        id: "secondary_actions",
        title: "Secondary actions",
        body: "Approved download remains available, but the summary and return target stay primary.",
      },
    ],
    previewPages: [
      {
        id: "page_1",
        title: "Attachment summary",
        lines: [
          "Preview deferred",
          "Large attachment remains bound to approved summary",
          "Use download if byte access is still needed",
        ],
      },
    ],
  }),
] as const satisfies readonly ArtifactShellSpecimen[];

function specimenById(id: string) {
  return artifactShellSpecimens.find((specimen) => specimen.id === id) ?? artifactShellSpecimens[0];
}

export function AppointmentArtifactSpecimen() {
  return <ArtifactSurfaceFrame specimen={specimenById("appointment_confirmation_preview")} />;
}

export function RecordResultArtifactSpecimen() {
  return <ArtifactSurfaceFrame specimen={specimenById("record_result_provisional_preview")} />;
}

export function GovernanceEvidenceArtifactSpecimen() {
  return <ArtifactSurfaceFrame specimen={specimenById("evidence_pack_embedded_summary_only")} />;
}

export function OperationsReleaseArtifactSpecimen() {
  return <ArtifactSurfaceFrame specimen={specimenById("release_handoff_active_grant")} />;
}

export function RecoveryReportArtifactSpecimen() {
  return <ArtifactSurfaceFrame specimen={specimenById("recovery_report_print_expired_grant")} />;
}

export function LargeAttachmentArtifactSpecimen() {
  return <ArtifactSurfaceFrame specimen={specimenById("attachment_large_placeholder")} />;
}

export function ArtifactShellSpecimenGrid({
  specimens = artifactShellSpecimens,
}: {
  specimens?: readonly ArtifactShellSpecimen[];
}) {
  return (
    <section className="artifact-shell-grid" data-testid="artifact-shell-specimen-grid">
      {specimens.map((specimen) => (
        <ArtifactSurfaceFrame key={specimen.id} specimen={specimen} />
      ))}
    </section>
  );
}
