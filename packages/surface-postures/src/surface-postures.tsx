import type { ReactNode } from "react";
import {
  CasePulse,
  SharedStatusStrip,
  statusTruthSpecimens,
  type CasePulseContract,
  type ProjectionFreshnessEnvelope,
  type StatusAudienceProfile,
  type StatusTruthInput,
} from "@vecells/design-system";
import { getPersistentShellSpec } from "@vecells/persistent-shell";

export const SURFACE_POSTURES_TASK_ID = "par_110";
export const SURFACE_POSTURES_VISUAL_MODE = "Posture_Gallery";
export const SURFACE_POSTURE_CLASS_ORDER = [
  "blocked_recovery",
  "bounded_recovery",
  "read_only",
  "placeholder_only",
  "partial_visibility",
  "stale_review",
  "loading_summary",
  "calm_degraded",
  "empty",
  "sparse",
] as const;

export type SurfacePostureClass = (typeof SURFACE_POSTURE_CLASS_ORDER)[number];
export type SurfacePostureScope = "shell" | "section" | "region" | "list" | "table" | "artifact";
export type SurfaceVisibilityState = "full" | "partial" | "placeholder_only" | "blocked";
export type SurfaceFreshnessState = "fresh" | "updating" | "stale_review" | "blocked_recovery";
export type SurfaceActionabilityState =
  | "live"
  | "guarded"
  | "read_only"
  | "recovery_only"
  | "blocked";
export type SurfaceContentDensity = "populated" | "known_structure" | "empty" | "sparse";
export type SurfaceDegradedMode = "none" | "calm_degraded" | "bounded_recovery";
export type SurfaceTone = "neutral" | "caution" | "critical";

export interface SurfaceRecoveryAction {
  actionId: string;
  label: string;
  detail: string;
  importance: "dominant" | "secondary";
  actionKind: "resume" | "refresh" | "acknowledge" | "handoff" | "return";
}

export interface SurfacePlaceholderSegment {
  segmentId: string;
  label: string;
  reason: string;
  footprint: "line" | "card" | "table_row" | "chart";
}

export interface SurfaceSelectedAnchor {
  anchorId: string;
  label: string;
  summary: string;
  returnLabel: string;
}

export interface SurfacePostureIssue {
  code: string;
  severity: "warning" | "error";
  message: string;
}

export interface SurfacePostureContract {
  postureId: string;
  postureClass: SurfacePostureClass;
  audience: StatusAudienceProfile;
  scope: SurfacePostureScope;
  shellSlug: string;
  shellLabel: string;
  regionLabel: string;
  title: string;
  summary: string;
  dominantQuestion: string;
  nextSafeActionLabel: string;
  stateOwner: string;
  visibilityState: SurfaceVisibilityState;
  freshnessState: SurfaceFreshnessState;
  actionabilityState: SurfaceActionabilityState;
  contentDensity: SurfaceContentDensity;
  degradedMode: SurfaceDegradedMode;
  tone: SurfaceTone;
  selectedAnchor: SurfaceSelectedAnchor | null;
  preservationSummary: string;
  whatUsuallyAppears: string;
  withheldSummary: string | null;
  liveContentSummary: string;
  rationale: string;
  minimumHeightPx: number;
  missionStackFoldSafe: boolean;
  placeholderSegments: readonly SurfacePlaceholderSegment[];
  recoveryActions: readonly SurfaceRecoveryAction[];
  statusInput: StatusTruthInput;
  pulse: CasePulseContract;
  sourceRefs: readonly string[];
}

export interface SurfacePostureCatalog {
  taskId: string;
  postureCount: number;
  specimenCount: number;
  audienceCount: number;
  gapResolutionCount: number;
  aliasCount: number;
}

export interface SurfacePostureResolution {
  resolvedPostureClass: SurfacePostureClass;
  tone: SurfaceTone;
  issues: readonly SurfacePostureIssue[];
}

interface SurfacePostureSpecimenConfig {
  postureId: string;
  postureClass: SurfacePostureClass;
  audience: StatusAudienceProfile;
  scope: SurfacePostureScope;
  shellSlug?: string;
  shellLabel?: string;
  regionLabel: string;
  title: string;
  summary: string;
  dominantQuestion: string;
  nextSafeActionLabel: string;
  stateOwner: string;
  visibilityState: SurfaceVisibilityState;
  freshnessState: SurfaceFreshnessState;
  actionabilityState: SurfaceActionabilityState;
  contentDensity: SurfaceContentDensity;
  degradedMode: SurfaceDegradedMode;
  selectedAnchor: SurfaceSelectedAnchor | null;
  preservationSummary: string;
  whatUsuallyAppears: string;
  withheldSummary: string | null;
  liveContentSummary: string;
  rationale: string;
  minimumHeightPx: number;
  missionStackFoldSafe: boolean;
  placeholderSegments: readonly SurfacePlaceholderSegment[];
  recoveryActions: readonly SurfaceRecoveryAction[];
  sourceRefs: readonly string[];
}

const AUDIENCE_SHELL_SLUG: Record<StatusAudienceProfile, string> = {
  patient: "patient-web",
  workspace: "clinical-workspace",
  hub: "hub-desk",
  operations: "ops-console",
  governance: "governance-console",
  pharmacy: "pharmacy-console",
};

const statusTruthByAudience = new Map(
  statusTruthSpecimens.map((specimen) => [specimen.audience, specimen] as const),
);

function joinClasses(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function toneByPosture(postureClass: SurfacePostureClass): SurfaceTone {
  switch (postureClass) {
    case "blocked_recovery":
      return "critical";
    case "bounded_recovery":
    case "read_only":
    case "partial_visibility":
    case "stale_review":
      return "caution";
    default:
      return "neutral";
  }
}

function requireStatusSeed(audience: StatusAudienceProfile) {
  const seed = statusTruthByAudience.get(audience);
  if (!seed) {
    throw new Error(`Missing status truth specimen for audience ${audience}.`);
  }
  return seed;
}

function mapProjectionActionability(
  actionabilityState: SurfaceActionabilityState,
): ProjectionFreshnessEnvelope["actionabilityState"] {
  switch (actionabilityState) {
    case "live":
      return "live";
    case "guarded":
      return "guarded";
    case "read_only":
      return "frozen";
    case "recovery_only":
    case "blocked":
      return "recovery_only";
  }
}

function mapProjectionTransport(
  freshnessState: SurfaceFreshnessState,
): ProjectionFreshnessEnvelope["transportState"] {
  switch (freshnessState) {
    case "fresh":
      return "live";
    case "updating":
      return "reconnecting";
    case "stale_review":
      return "paused";
    case "blocked_recovery":
      return "disconnected";
  }
}

function mapProjectionTrust(postureClass: SurfacePostureClass): StatusTruthInput["authority"]["projectionTrustState"] {
  switch (postureClass) {
    case "blocked_recovery":
      return "blocked";
    case "partial_visibility":
    case "placeholder_only":
      return "partial";
    case "stale_review":
    case "read_only":
    case "bounded_recovery":
    case "calm_degraded":
      return "degraded";
    default:
      return "trusted";
  }
}

function mapStatusDegradeMode(
  postureClass: SurfacePostureClass,
  degradedMode: SurfaceDegradedMode,
): StatusTruthInput["authority"]["degradeMode"] {
  if (postureClass === "blocked_recovery") {
    return "recovery_required";
  }
  if (postureClass === "stale_review" || postureClass === "read_only") {
    return "refresh_required";
  }
  if (degradedMode === "bounded_recovery") {
    return "refresh_required";
  }
  return "quiet_pending";
}

function mapOutcomeState(
  postureClass: SurfacePostureClass,
): StatusTruthInput["authoritativeOutcomeState"] {
  switch (postureClass) {
    case "blocked_recovery":
      return "recovery_required";
    case "bounded_recovery":
      return "review_required";
    case "read_only":
      return "review_required";
    case "loading_summary":
      return "pending";
    default:
      return "none";
  }
}

function buildStatusInput(config: SurfacePostureSpecimenConfig): StatusTruthInput {
  const seed = requireStatusSeed(config.audience).statusInput;
  const shellSlug = config.shellSlug ?? AUDIENCE_SHELL_SLUG[config.audience];
  return {
    ...seed,
    dominantActionLabel: config.nextSafeActionLabel,
    authoritativeOutcomeState: mapOutcomeState(config.postureClass),
    processingAcceptanceState:
      config.postureClass === "loading_summary" ? "accepted_for_processing" : "none",
    pendingExternalState:
      config.postureClass === "loading_summary" ? "awaiting_confirmation" : "none",
    localFeedbackState: config.postureClass === "loading_summary" ? "shown" : "none",
    saveState: config.postureClass === "loading_summary" ? "saving" : "idle",
    lastChangedAt: "2026-04-12T10:30:00.000Z",
    authority: {
      ...seed.authority,
      macroStateRef:
        config.postureClass === "blocked_recovery"
          ? "blocked"
          : config.postureClass === "read_only" || config.postureClass === "stale_review"
            ? "reviewing_next_steps"
            : config.postureClass === "empty" || config.postureClass === "sparse"
              ? "received"
              : "in_review",
      projectionTrustState: mapProjectionTrust(config.postureClass),
      degradeMode: mapStatusDegradeMode(config.postureClass, config.degradedMode),
      ownedSignalClasses: [
        "StatusStripAuthority",
        "ProjectionFreshnessEnvelope",
        "SurfacePostureFrame",
      ],
    },
    freshnessEnvelope: {
      ...seed.freshnessEnvelope,
      projectionFreshnessState: config.freshnessState,
      transportState: mapProjectionTransport(config.freshnessState),
      actionabilityState: mapProjectionActionability(config.actionabilityState),
      selectedAnchorRef: config.selectedAnchor?.anchorId ?? `${config.postureId}::anchor::none`,
      localizedDegradationRefs:
        config.degradedMode === "none"
          ? []
          : [`${config.postureId}::degraded::${config.degradedMode}`],
      reasonRefs: [config.postureId, config.postureClass],
      lastKnownGoodSnapshotRef: `${config.postureId}::safe-summary`,
      continuityKey: `${shellSlug}::${config.audience}`,
      evaluatedAt: "2026-04-12T10:30:00.000Z",
    },
  };
}

function buildCasePulse(config: SurfacePostureSpecimenConfig): CasePulseContract {
  const seed = requireStatusSeed(config.audience).pulse;
  return {
    ...seed,
    audience: config.audience,
    headline: config.title,
    subheadline: config.summary,
    primaryNextActionLabel: config.nextSafeActionLabel,
    changedSinceSeen:
      config.postureClass === "loading_summary"
        ? "Detail rows are hydrating inside the same shell."
        : config.postureClass === "blocked_recovery"
          ? "Recovery is required before the next governed step."
          : config.postureClass === "read_only"
            ? "Writable posture is suppressed; scope and diff anchor stay visible."
            : "The shell summary remains grounded to the same object and question.",
  };
}

function createSurfacePostureSpecimen(
  config: SurfacePostureSpecimenConfig,
): SurfacePostureContract {
  const shell = getPersistentShellSpec(
    AUDIENCE_SHELL_SLUG[config.audience] as Parameters<typeof getPersistentShellSpec>[0],
  );

  return {
    ...config,
    shellSlug: shell.shellSlug,
    shellLabel: shell.displayName,
    tone: toneByPosture(config.postureClass),
    statusInput: buildStatusInput({ ...config, shellSlug: shell.shellSlug, shellLabel: shell.displayName }),
    pulse: buildCasePulse({ ...config, shellSlug: shell.shellSlug, shellLabel: shell.displayName }),
  };
}

function placeholder(
  segmentId: string,
  label: string,
  reason: string,
  footprint: SurfacePlaceholderSegment["footprint"],
): SurfacePlaceholderSegment {
  return { segmentId, label, reason, footprint };
}

function recoveryAction(
  actionId: string,
  label: string,
  detail: string,
  importance: SurfaceRecoveryAction["importance"],
  actionKind: SurfaceRecoveryAction["actionKind"],
): SurfaceRecoveryAction {
  return { actionId, label, detail, importance, actionKind };
}

export const surfacePostureAliasMappings = [
  {
    aliasId: "POSTURE_ALIAS_BLOCKED_RECOVERY",
    aliases: ["blocked", "recovery"],
    canonicalPostureClass: "blocked_recovery",
  },
  {
    aliasId: "POSTURE_ALIAS_STALE_REVIEW",
    aliases: ["stale", "degraded"],
    canonicalPostureClass: "stale_review",
  },
  {
    aliasId: "POSTURE_ALIAS_LOADING_SUMMARY",
    aliases: ["loading", "refreshing_known_surface"],
    canonicalPostureClass: "loading_summary",
  },
  {
    aliasId: "POSTURE_ALIAS_PLACEHOLDER_ONLY",
    aliases: ["governed_placeholder", "visibility_withheld"],
    canonicalPostureClass: "placeholder_only",
  },
  {
    aliasId: "POSTURE_ALIAS_BOUNDED_RECOVERY",
    aliases: ["guarded_resume", "recovery_with_context"],
    canonicalPostureClass: "bounded_recovery",
  },
] as const;

export const surfacePostureGapResolutions = [
  {
    gapId: "GAP_RESOLUTION_POSTURE_CLASS_CALM_DEGRADED",
    title: "Calm degraded mode is explicit when reassurance is suppressed but recovery is not yet dominant.",
    resolution:
      "Routes may not disguise continuity drift or trust suppression as ordinary empty or sparse calm; calm_degraded keeps the same shell and safe summary visible without escalating to full blocked recovery.",
  },
  {
    gapId: "GAP_RESOLUTION_POSTURE_CLASS_BOUNDED_RECOVERY",
    title: "Bounded recovery stays distinct from blocked recovery.",
    resolution:
      "When one clear recovery path still exists, the shell keeps that single path dominant and preserves context instead of escalating to fatal blocked posture or decorative emptiness.",
  },
] as const;

export const surfacePostureContractFamilies = [
  "SurfacePostureFrame",
  "SurfaceStateFrame",
] as const;

export const surfacePostureObjectFamilies = [
  "posture_state",
  "placeholder_visibility",
  "recovery_action_cluster",
] as const;

export const packageContract = {
  packageName: "@vecells/surface-postures",
  taskId: SURFACE_POSTURES_TASK_ID,
  visualMode: SURFACE_POSTURES_VISUAL_MODE,
};

export const surfacePostureSpecimens = [
  createSurfacePostureSpecimen({
    postureId: "patient_loading_summary",
    postureClass: "loading_summary",
    audience: "patient",
    scope: "section",
    regionLabel: "Appointments",
    title: "Appointment detail is hydrating inside the same shell",
    summary:
      "The booked appointment summary and selected anchor stay visible while the full timeline catches up.",
    dominantQuestion: "Is this still the appointment I opened?",
    nextSafeActionLabel: "Keep reviewing the current summary",
    stateOwner: "PatientSectionSurfaceState",
    visibilityState: "full",
    freshnessState: "updating",
    actionabilityState: "guarded",
    contentDensity: "known_structure",
    degradedMode: "none",
    selectedAnchor: {
      anchorId: "appt_anchor_2026_04_17",
      label: "17 Apr 2026, 09:40 appointment",
      summary: "Drift-safe summary stays pinned while the detail rail hydrates.",
      returnLabel: "Back to appointment summary",
    },
    preservationSummary: "Keep the appointment headline, venue, and selected anchor pinned.",
    whatUsuallyAppears: "Appointment prep, venue details, arrival guidance, and change controls.",
    withheldSummary: "Prep notes and travel guidance are still hydrating.",
    liveContentSummary: "Booked appointment summary, shell masthead, and urgency strip remain visible.",
    rationale:
      "Known-object route entry must preserve shell identity, CasePulse, and the selected anchor instead of blanking the section.",
    minimumHeightPx: 420,
    missionStackFoldSafe: true,
    placeholderSegments: [
      placeholder("prep-card", "Prep summary", "Known card footprint", "card"),
      placeholder("timeline-row-1", "Travel guidance row", "Known row footprint", "line"),
      placeholder("timeline-row-2", "Arrival row", "Known row footprint", "line"),
    ],
    recoveryActions: [
      recoveryAction(
        "keep_reviewing",
        "Keep reviewing current summary",
        "Stay on the pinned appointment summary while detail rows catch up.",
        "dominant",
        "acknowledge",
      ),
    ],
    sourceRefs: [
      "blueprint/patient-portal-experience-architecture-blueprint.md#386",
      "blueprint/staff-workspace-interface-architecture.md#315",
    ],
  }),
  createSurfacePostureSpecimen({
    postureId: "workspace_empty_queue",
    postureClass: "empty",
    audience: "workspace",
    scope: "list",
    regionLabel: "Urgent review queue",
    title: "No task needs action in this queue right now",
    summary:
      "The selected queue, filters, and return context stay visible so staff can confirm this is a calm no-work state.",
    dominantQuestion: "Is the queue truly quiet or did my filters hide work?",
    nextSafeActionLabel: "Review saved filters",
    stateOwner: "WorkspaceSurfaceState",
    visibilityState: "full",
    freshnessState: "fresh",
    actionabilityState: "live",
    contentDensity: "empty",
    degradedMode: "none",
    selectedAnchor: {
      anchorId: "queue_filter_urgent_review",
      label: "Urgent review queue",
      summary: "Queue choice and filter tuple remain explicit.",
      returnLabel: "Back to urgent review queue",
    },
    preservationSummary: "Preserve queue selection, saved filters, and return path.",
    whatUsuallyAppears: "Priority-ranked tasks and protected workbench previews.",
    withheldSummary: null,
    liveContentSummary: "Queue chooser, filter summary, and safe next step remain visible.",
    rationale:
      "Calm no-work posture must stay distinct from filter-empty or blocked queue truth.",
    minimumHeightPx: 360,
    missionStackFoldSafe: true,
    placeholderSegments: [],
    recoveryActions: [
      recoveryAction(
        "review_filters",
        "Review saved filters",
        "Confirm the queue is quiet rather than filter-exhausted.",
        "dominant",
        "refresh",
      ),
      recoveryAction(
        "switch_queue",
        "Open next queue",
        "Move to the safest adjacent queue without losing your return context.",
        "secondary",
        "return",
      ),
    ],
    sourceRefs: [
      "blueprint/staff-workspace-interface-architecture.md#314",
      "blueprint/staff-workspace-interface-architecture.md#438",
    ],
  }),
  createSurfacePostureSpecimen({
    postureId: "hub_sparse_watchlist",
    postureClass: "sparse",
    audience: "hub",
    scope: "region",
    regionLabel: "Coordination watchlist",
    title: "Only watchful coordination summaries remain",
    summary:
      "The board compresses to the few active watchpoints that still matter instead of padding the surface with decorative density.",
    dominantQuestion: "What is the safest next coordination lens?",
    nextSafeActionLabel: "Open the top watchpoint",
    stateOwner: "HubDeskSurfaceState",
    visibilityState: "full",
    freshnessState: "fresh",
    actionabilityState: "live",
    contentDensity: "sparse",
    degradedMode: "none",
    selectedAnchor: {
      anchorId: "hub_watchpoint_north_sector",
      label: "North sector watchpoint",
      summary: "The current watchpoint remains highlighted even in sparse posture.",
      returnLabel: "Back to North sector watchpoint",
    },
    preservationSummary: "Keep the current watchpoint and sector scope visible.",
    whatUsuallyAppears: "Queue clusters, handoff summaries, and cross-site exceptions.",
    withheldSummary: null,
    liveContentSummary: "Top watchpoint, route context, and one safe next lens stay visible.",
    rationale:
      "Sparse posture is meaningful residual content, not decorative emptiness.",
    minimumHeightPx: 340,
    missionStackFoldSafe: true,
    placeholderSegments: [],
    recoveryActions: [
      recoveryAction(
        "open_watchpoint",
        "Open the top watchpoint",
        "Move into the still-relevant coordination item without changing shell scope.",
        "dominant",
        "resume",
      ),
    ],
    sourceRefs: [
      "blueprint/operations-console-frontend-blueprint.md#337",
      "blueprint/staff-workspace-interface-architecture.md#414",
    ],
  }),
  createSurfacePostureSpecimen({
    postureId: "workspace_partial_visibility",
    postureClass: "partial_visibility",
    audience: "workspace",
    scope: "table",
    regionLabel: "Task workbench",
    title: "The workbench is partially visible and bounded",
    summary:
      "The last safe task summary remains interactive only where the visibility envelope still permits it.",
    dominantQuestion: "What remains safe to review while withheld fields catch up?",
    nextSafeActionLabel: "Review the visible summary",
    stateOwner: "WorkspaceSurfaceState",
    visibilityState: "partial",
    freshnessState: "stale_review",
    actionabilityState: "guarded",
    contentDensity: "populated",
    degradedMode: "none",
    selectedAnchor: {
      anchorId: "task_anchor_case_311",
      label: "Case 311 / intake summary",
      summary: "The protected summary row remains pinned above withheld fields.",
      returnLabel: "Back to case 311 summary",
    },
    preservationSummary: "Keep the case headline, queue context, and safe summary rows visible.",
    whatUsuallyAppears: "Task summary, evidence rows, and governed mutation controls.",
    withheldSummary: "Identity-sensitive rows and mutation controls are withheld until visibility recovers.",
    liveContentSummary: "Visible summary rows remain, but gated fields do not pretend to be ready.",
    rationale:
      "Partial visibility is first-class; calm summary remains visible while withheld fields stay explicitly bounded.",
    minimumHeightPx: 400,
    missionStackFoldSafe: true,
    placeholderSegments: [
      placeholder("withheld-row-1", "Identity block", "Visibility withheld", "table_row"),
      placeholder("withheld-row-2", "Capability block", "Visibility withheld", "table_row"),
    ],
    recoveryActions: [
      recoveryAction(
        "review_visible_summary",
        "Review the visible summary",
        "Keep working from the safe summary that is still permitted.",
        "dominant",
        "acknowledge",
      ),
      recoveryAction(
        "request_release_refresh",
        "Request visibility refresh",
        "Re-evaluate the current release and visibility envelope for the hidden fields.",
        "secondary",
        "refresh",
      ),
    ],
    sourceRefs: [
      "blueprint/accessibility-and-content-system-contract.md#90",
      "blueprint/forensic-audit-findings.md#724",
    ],
  }),
  createSurfacePostureSpecimen({
    postureId: "operations_stale_review",
    postureClass: "stale_review",
    audience: "operations",
    scope: "table",
    regionLabel: "Incident board",
    title: "The board stays visible while projection truth is under review",
    summary:
      "Operators keep the last stable anomaly context, but writable posture remains suppressed until freshness catches up.",
    dominantQuestion: "Can I trust the current incident board enough to act?",
    nextSafeActionLabel: "Review freshness evidence",
    stateOwner: "OpsBoardSurfaceState",
    visibilityState: "full",
    freshnessState: "stale_review",
    actionabilityState: "guarded",
    contentDensity: "populated",
    degradedMode: "none",
    selectedAnchor: {
      anchorId: "incident_board_anchor_critical_queue",
      label: "Critical queue anomaly",
      summary: "The same anomaly row stays highlighted while freshness evidence is reviewed.",
      returnLabel: "Back to critical queue anomaly",
    },
    preservationSummary: "Preserve the selected anomaly, board scope, and intervention context.",
    whatUsuallyAppears: "Live anomaly rows, intervention controls, and drift evidence.",
    withheldSummary: "Fresh counts and intervention confidence are under review.",
    liveContentSummary: "The last stable board and anomaly context remain visible.",
    rationale:
      "Transport health alone may not clear stale review; the operator keeps context instead of losing the board.",
    minimumHeightPx: 420,
    missionStackFoldSafe: true,
    placeholderSegments: [
      placeholder("stale-chart", "Incident delta chart", "Awaiting reviewed freshness", "chart"),
    ],
    recoveryActions: [
      recoveryAction(
        "review_freshness",
        "Review freshness evidence",
        "Use the current evidence bundle before re-arming intervention controls.",
        "dominant",
        "refresh",
      ),
      recoveryAction(
        "switch_to_read_only",
        "Open read-only snapshot",
        "Freeze the board to the last reviewed snapshot if the anomaly needs quieter inspection.",
        "secondary",
        "return",
      ),
    ],
    sourceRefs: [
      "blueprint/operations-console-frontend-blueprint.md#212",
      "blueprint/canonical-ui-contract-kernel.md#230",
    ],
  }),
  createSurfacePostureSpecimen({
    postureId: "pharmacy_blocked_recovery",
    postureClass: "blocked_recovery",
    audience: "pharmacy",
    scope: "section",
    regionLabel: "Dispense checkpoint",
    title: "Recovery is required before the dispense line can resume",
    summary:
      "The current case and selected line remain visible, but the shell makes one repair path dominant before anything continues.",
    dominantQuestion: "What is the single safe recovery path for this line?",
    nextSafeActionLabel: "Reconcile the blocked line",
    stateOwner: "PharmacyConsoleSurfaceState",
    visibilityState: "blocked",
    freshnessState: "blocked_recovery",
    actionabilityState: "blocked",
    contentDensity: "populated",
    degradedMode: "bounded_recovery",
    selectedAnchor: {
      anchorId: "dispense_line_14",
      label: "Dispense line 14",
      summary: "The blocked line, medication summary, and prior checkpoint remain visible.",
      returnLabel: "Back to dispense line 14",
    },
    preservationSummary: "Preserve the active dispense line, prior checkpoint summary, and case context.",
    whatUsuallyAppears: "Line-level dispense progress, handoff state, and governed release controls.",
    withheldSummary: "Further dispense actions are blocked until reconciliation succeeds.",
    liveContentSummary: "The last safe case summary stays visible beneath the blocked posture.",
    rationale:
      "Blocked recovery keeps the same shell and current line visible while one dominant repair path takes precedence.",
    minimumHeightPx: 420,
    missionStackFoldSafe: true,
    placeholderSegments: [
      placeholder("reconcile-panel", "Reconcile checklist", "Recovery path required", "card"),
    ],
    recoveryActions: [
      recoveryAction(
        "reconcile_line",
        "Reconcile the blocked line",
        "Run the governed reconcile path before any release or handoff resumes.",
        "dominant",
        "resume",
      ),
      recoveryAction(
        "open_last_safe_summary",
        "Open last safe summary",
        "Re-check the prior checkpoint without losing the blocked line context.",
        "secondary",
        "return",
      ),
    ],
    sourceRefs: [
      "blueprint/pharmacy-console-frontend-architecture.md#126",
      "blueprint/pharmacy-console-frontend-architecture.md#127",
    ],
  }),
  createSurfacePostureSpecimen({
    postureId: "governance_read_only",
    postureClass: "read_only",
    audience: "governance",
    scope: "artifact",
    regionLabel: "Policy diff review",
    title: "The diff remains visible, but writable posture is fenced",
    summary:
      "Reviewers keep the scope, verification time, and selected diff anchor while approvals remain read-only.",
    dominantQuestion: "What can still be reviewed without reopening mutation posture?",
    nextSafeActionLabel: "Review the published diff",
    stateOwner: "GovernanceSurfaceState",
    visibilityState: "full",
    freshnessState: "stale_review",
    actionabilityState: "read_only",
    contentDensity: "populated",
    degradedMode: "none",
    selectedAnchor: {
      anchorId: "governance_diff_anchor_policy_9",
      label: "Policy paragraph 9",
      summary: "The selected diff anchor stays pinned above suppressed approval controls.",
      returnLabel: "Back to policy paragraph 9",
    },
    preservationSummary: "Keep verification time, scope, and selected diff anchor visible.",
    whatUsuallyAppears: "Diff canvas, compile verdict, and governed approval controls.",
    withheldSummary: "Approval and promotion controls stay fenced until trust and publication realign.",
    liveContentSummary: "The published diff and audit summary remain readable.",
    rationale:
      "Read-only posture must preserve analytical scope without pretending the current surface is writable.",
    minimumHeightPx: 420,
    missionStackFoldSafe: true,
    placeholderSegments: [
      placeholder("approval-rail", "Approval controls", "Writable fence is closed", "card"),
    ],
    recoveryActions: [
      recoveryAction(
        "review_diff",
        "Review the published diff",
        "Continue analytical review while approvals remain fenced.",
        "dominant",
        "acknowledge",
      ),
      recoveryAction(
        "refresh_publication",
        "Refresh publication proof",
        "Re-check bundle freshness before reopening any mutation controls.",
        "secondary",
        "refresh",
      ),
    ],
    sourceRefs: [
      "blueprint/governance-admin-console-frontend-blueprint.md#292",
      "blueprint/platform-frontend-blueprint.md#3771",
    ],
  }),
  createSurfacePostureSpecimen({
    postureId: "patient_placeholder_only",
    postureClass: "placeholder_only",
    audience: "patient",
    scope: "artifact",
    regionLabel: "Health record result",
    title: "The record stays structured, but only the governed placeholder is visible",
    summary:
      "The shell preserves the result identity and explanation while previewable content waits for a safer visibility envelope.",
    dominantQuestion: "What is this result, and what is withheld right now?",
    nextSafeActionLabel: "Read the safe summary",
    stateOwner: "PatientSectionSurfaceState",
    visibilityState: "placeholder_only",
    freshnessState: "stale_review",
    actionabilityState: "guarded",
    contentDensity: "known_structure",
    degradedMode: "none",
    selectedAnchor: {
      anchorId: "record_result_anchor_774",
      label: "Result update from 11 Apr",
      summary: "The known result identity stays visible even while the content body is withheld.",
      returnLabel: "Back to result update from 11 Apr",
    },
    preservationSummary: "Keep the result identity, timing, and return path visible.",
    whatUsuallyAppears: "Structured summary, record detail, and governed artifact preview.",
    withheldSummary: "The result body is withheld until the current visibility envelope allows it.",
    liveContentSummary: "A truthful shell summary remains in place so the page does not jump later.",
    rationale:
      "Placeholder-only posture must tell the patient what is known and what is still withheld without pretending the record body is ready.",
    minimumHeightPx: 420,
    missionStackFoldSafe: true,
    placeholderSegments: [
      placeholder("result-title", "Result title", "Known structure reserved", "line"),
      placeholder("result-body", "Result body placeholder", "Visibility envelope withheld", "card"),
    ],
    recoveryActions: [
      recoveryAction(
        "read_safe_summary",
        "Read the safe summary",
        "Use the verified summary while the full record body remains withheld.",
        "dominant",
        "acknowledge",
      ),
      recoveryAction(
        "request_visibility_refresh",
        "Request visibility refresh",
        "Ask the shell to re-check whether this record can be revealed now.",
        "secondary",
        "refresh",
      ),
    ],
    sourceRefs: [
      "blueprint/patient-portal-experience-architecture-blueprint.md#372",
      "blueprint/accessibility-and-content-system-contract.md#90",
    ],
  }),
  createSurfacePostureSpecimen({
    postureId: "patient_calm_degraded",
    postureClass: "calm_degraded",
    audience: "patient",
    scope: "section",
    regionLabel: "Messages",
    title: "This message thread remains calm but bounded",
    summary:
      "The last trustworthy conversation summary stays visible while the shell suppresses ordinary reassurance until continuity proof returns.",
    dominantQuestion: "What is still safe to understand from this conversation right now?",
    nextSafeActionLabel: "Review the current thread summary",
    stateOwner: "PatientDegradedModeProjection",
    visibilityState: "full",
    freshnessState: "fresh",
    actionabilityState: "live",
    contentDensity: "populated",
    degradedMode: "calm_degraded",
    selectedAnchor: {
      anchorId: "message_thread_anchor_88",
      label: "Reply summary from care team",
      summary: "The current thread summary stays visible, but reply posture is suppressed.",
      returnLabel: "Back to reply summary",
    },
    preservationSummary: "Preserve the thread summary, sender, and return path while reassurance is suppressed.",
    whatUsuallyAppears: "Thread summary, reply history, and next safe action.",
    withheldSummary: "Reply readiness and freshness reassurance stay suppressed until continuity proof returns.",
    liveContentSummary: "The patient still sees the current thread summary and safe route context.",
    rationale:
      "Calm degraded mode preserves the same shell and summary while explicitly suppressing ordinary reassurance or writable posture.",
    minimumHeightPx: 400,
    missionStackFoldSafe: true,
    placeholderSegments: [
      placeholder("reply-box", "Reply composer", "Writable posture suppressed", "card"),
    ],
    recoveryActions: [
      recoveryAction(
        "review_thread_summary",
        "Review the current thread summary",
        "Stay with the trustworthy summary while continuity evidence is restored.",
        "dominant",
        "acknowledge",
      ),
    ],
    sourceRefs: [
      "blueprint/patient-portal-experience-architecture-blueprint.md#157",
      "blueprint/platform-frontend-blueprint.md#2235",
    ],
  }),
  createSurfacePostureSpecimen({
    postureId: "hub_bounded_recovery",
    postureClass: "bounded_recovery",
    audience: "hub",
    scope: "region",
    regionLabel: "Transfer coordination",
    title: "The transfer summary stays visible with one bounded recovery path",
    summary:
      "The shell does not reset; it keeps the last safe transfer summary visible and narrows the next move to one governed recovery action.",
    dominantQuestion: "Can this transfer recover inside the same shell?",
    nextSafeActionLabel: "Resume the governed transfer path",
    stateOwner: "HubTransferSurfaceState",
    visibilityState: "full",
    freshnessState: "stale_review",
    actionabilityState: "recovery_only",
    contentDensity: "populated",
    degradedMode: "bounded_recovery",
    selectedAnchor: {
      anchorId: "transfer_anchor_north_west",
      label: "North west transfer tuple",
      summary: "The same transfer tuple remains visible while the bounded repair path is armed.",
      returnLabel: "Back to north west transfer tuple",
    },
    preservationSummary: "Keep the transfer tuple, scope, and last safe summary visible.",
    whatUsuallyAppears: "Transfer readiness, handoff checkpoints, and partner confirmations.",
    withheldSummary: "Only the governed resume path stays armed until reconciliation succeeds.",
    liveContentSummary: "The hub keeps the current tuple visible under one bounded resume action.",
    rationale:
      "Bounded recovery remains distinct from fatal blocked posture when one governed same-shell repair path still exists.",
    minimumHeightPx: 400,
    missionStackFoldSafe: true,
    placeholderSegments: [
      placeholder("partner-confirmation", "Partner confirmation panel", "Bounded recovery path active", "card"),
    ],
    recoveryActions: [
      recoveryAction(
        "resume_transfer",
        "Resume the governed transfer path",
        "Continue through the only safe recovery path without losing shell context.",
        "dominant",
        "resume",
      ),
      recoveryAction(
        "review_last_safe_tuple",
        "Review the last safe tuple",
        "Check the last confirmed transfer tuple before resuming.",
        "secondary",
        "return",
      ),
    ],
    sourceRefs: [
      "blueprint/platform-frontend-blueprint.md#2139",
      "blueprint/forensic-audit-findings.md#724",
    ],
  }),
] as const satisfies readonly SurfacePostureContract[];

export const surfacePostureCatalog: SurfacePostureCatalog = {
  taskId: SURFACE_POSTURES_TASK_ID,
  postureCount: SURFACE_POSTURE_CLASS_ORDER.length,
  specimenCount: surfacePostureSpecimens.length,
  audienceCount: new Set(surfacePostureSpecimens.map((specimen) => specimen.audience)).size,
  gapResolutionCount: surfacePostureGapResolutions.length,
  aliasCount: surfacePostureAliasMappings.length,
};

export function bootstrapSharedPackage() {
  return {
    packageName: packageContract.packageName,
    contractFamilies: surfacePostureContractFamilies.length,
    objectFamilies: surfacePostureObjectFamilies.length,
    specimens: surfacePostureCatalog.specimenCount,
  };
}

export function resolveSurfacePostureClass(
  contract: Pick<
    SurfacePostureContract,
    | "actionabilityState"
    | "visibilityState"
    | "freshnessState"
    | "contentDensity"
    | "degradedMode"
    | "postureClass"
    | "recoveryActions"
  >,
): SurfacePostureResolution {
  let resolvedPostureClass: SurfacePostureClass;

  if (
    contract.actionabilityState === "blocked" ||
    contract.visibilityState === "blocked" ||
    contract.freshnessState === "blocked_recovery"
  ) {
    resolvedPostureClass = "blocked_recovery";
  } else if (
    contract.actionabilityState === "recovery_only" ||
    contract.degradedMode === "bounded_recovery"
  ) {
    resolvedPostureClass = "bounded_recovery";
  } else if (contract.actionabilityState === "read_only") {
    resolvedPostureClass = "read_only";
  } else if (contract.visibilityState === "placeholder_only") {
    resolvedPostureClass = "placeholder_only";
  } else if (contract.visibilityState === "partial") {
    resolvedPostureClass = "partial_visibility";
  } else if (contract.freshnessState === "stale_review") {
    resolvedPostureClass = "stale_review";
  } else if (
    contract.freshnessState === "updating" &&
    contract.contentDensity === "known_structure"
  ) {
    resolvedPostureClass = "loading_summary";
  } else if (contract.degradedMode === "calm_degraded") {
    resolvedPostureClass = "calm_degraded";
  } else if (contract.contentDensity === "empty") {
    resolvedPostureClass = "empty";
  } else {
    resolvedPostureClass = "sparse";
  }

  const issues: SurfacePostureIssue[] = [];

  if (resolvedPostureClass !== contract.postureClass) {
    issues.push({
      code: "POSTURE_CLASS_MISMATCH",
      severity: "error",
      message:
        "The declared posture class does not match the shared precedence resolver and may not override the shared taxonomy.",
    });
  }

  if (
    (resolvedPostureClass === "blocked_recovery" ||
      resolvedPostureClass === "bounded_recovery" ||
      resolvedPostureClass === "empty") &&
    !contract.recoveryActions.some((action) => action.importance === "dominant")
  ) {
    issues.push({
      code: "POSTURE_DOMINANT_ACTION_REQUIRED",
      severity: "error",
      message:
        "Blocked, bounded-recovery, and empty posture require one dominant safe action.",
    });
  }

  if (
    resolvedPostureClass === "placeholder_only" &&
    contract.contentDensity !== "known_structure"
  ) {
    issues.push({
      code: "POSTURE_PLACEHOLDER_TRUTH_CONFLICT",
      severity: "warning",
      message:
        "Placeholder-only posture should reserve truthful known structure so the surface does not jump later.",
    });
  }

  if (
    resolvedPostureClass === "read_only" &&
    contract.actionabilityState !== "read_only"
  ) {
    issues.push({
      code: "POSTURE_READ_ONLY_CONFLICT",
      severity: "error",
      message: "Read-only posture must fail closed on writable actionability.",
    });
  }

  return {
    resolvedPostureClass,
    tone: toneByPosture(resolvedPostureClass),
    issues,
  };
}

export function validateSurfacePostureContract(
  contract: SurfacePostureContract,
): readonly SurfacePostureIssue[] {
  return resolveSurfacePostureClass(contract).issues;
}

export function resolveSurfacePostureContract(
  contract: SurfacePostureContract,
): SurfacePostureContract & {
  issues: readonly SurfacePostureIssue[];
  resolvedPostureClass: SurfacePostureClass;
} {
  const resolution = resolveSurfacePostureClass(contract);
  return {
    ...contract,
    postureClass: resolution.resolvedPostureClass,
    tone: resolution.tone,
    issues: resolution.issues,
    resolvedPostureClass: resolution.resolvedPostureClass,
  };
}

function ariaLiveForPosture(postureClass: SurfacePostureClass) {
  return postureClass === "blocked_recovery" ? "assertive" : "polite";
}

function dominantRecoveryAction(
  actions: readonly SurfaceRecoveryAction[],
): SurfaceRecoveryAction | null {
  return actions.find((action) => action.importance === "dominant") ?? null;
}

function PlaceholderBlueprint({
  segments,
}: {
  segments: readonly SurfacePlaceholderSegment[];
}) {
  if (segments.length === 0) {
    return null;
  }
  return (
    <div className="surface-posture-placeholder-grid" data-testid="placeholder-blueprint">
      {segments.map((segment) => (
        <article
          className={joinClasses(
            "surface-posture-placeholder",
            `surface-posture-placeholder--${segment.footprint}`,
          )}
          key={segment.segmentId}
          data-footprint={segment.footprint}
          data-placeholder-segment={segment.segmentId}
        >
          <strong>{segment.label}</strong>
          <span>{segment.reason}</span>
        </article>
      ))}
    </div>
  );
}

function PostureSummary({
  contract,
}: {
  contract: SurfacePostureContract;
}) {
  return (
    <div className="surface-posture-summary-stack">
      <header className="surface-posture-summary-card">
        <span className="surface-posture-kicker">Question</span>
        <h2>{contract.title}</h2>
        <p>{contract.summary}</p>
      </header>
      <article className="surface-posture-detail-card">
        <span className="surface-posture-kicker">Dominant question</span>
        <strong>{contract.dominantQuestion}</strong>
        <p>{contract.rationale}</p>
      </article>
      <article className="surface-posture-detail-card">
        <span className="surface-posture-kicker">Truthful footprint</span>
        <strong>{contract.liveContentSummary}</strong>
        <p>{contract.whatUsuallyAppears}</p>
      </article>
      {contract.withheldSummary ? (
        <article className="surface-posture-detail-card">
          <span className="surface-posture-kicker">Withheld or delayed</span>
          <strong>{contract.withheldSummary}</strong>
          <p>{contract.preservationSummary}</p>
        </article>
      ) : null}
    </div>
  );
}

function PreservedAnchorCard({
  anchor,
}: {
  anchor: SurfaceSelectedAnchor | null;
}) {
  if (!anchor) {
    return null;
  }
  return (
    <aside
      className="surface-posture-anchor-card"
      data-testid="preserved-anchor"
      data-anchor-id={anchor.anchorId}
    >
      <span className="surface-posture-kicker">Preserved anchor</span>
      <strong>{anchor.label}</strong>
      <p>{anchor.summary}</p>
      <small>{anchor.returnLabel}</small>
    </aside>
  );
}

export function RecoveryActionCluster({
  actions,
}: {
  actions: readonly SurfaceRecoveryAction[];
}) {
  if (actions.length === 0) {
    return null;
  }
  const dominant = dominantRecoveryAction(actions);
  return (
    <section
      className="surface-posture-recovery-cluster"
      data-testid="recovery-action-cluster"
      data-dominant-recovery-action={dominant?.label ?? "none"}
      aria-label="Recovery actions"
    >
      {actions.map((action) => (
        <article
          className={joinClasses(
            "surface-posture-action",
            action.importance === "dominant" && "surface-posture-action--dominant",
          )}
          key={action.actionId}
          data-action-kind={action.actionKind}
          data-action-importance={action.importance}
        >
          <strong>{action.label}</strong>
          <p>{action.detail}</p>
        </article>
      ))}
    </section>
  );
}

export function DegradedModeNoticeStrip({
  contract,
}: {
  contract: SurfacePostureContract;
}) {
  const modeLabel =
    contract.postureClass === "blocked_recovery"
      ? "Blocked recovery"
      : contract.postureClass === "bounded_recovery"
        ? "Bounded recovery"
        : contract.degradedMode === "calm_degraded"
          ? "Calm degraded mode"
          : contract.postureClass === "stale_review"
            ? "Stale review"
            : "Same-shell posture";

  return (
    <div
      className={joinClasses(
        "surface-posture-notice-strip",
        contract.tone === "caution" && "surface-posture-notice-strip--caution",
        contract.tone === "critical" && "surface-posture-notice-strip--critical",
      )}
      data-testid="degraded-mode-notice-strip"
      data-posture-class={contract.postureClass}
      role={contract.postureClass === "blocked_recovery" ? "alert" : "status"}
    >
      <strong>{modeLabel}</strong>
      <span>{contract.preservationSummary}</span>
    </div>
  );
}

export function SurfacePostureFrame({
  contract,
  children,
}: {
  contract: SurfacePostureContract;
  children?: ReactNode;
}) {
  const dominantAction = dominantRecoveryAction(contract.recoveryActions);
  const resolution = resolveSurfacePostureContract(contract);

  return (
    <section
      className={joinClasses(
        "surface-posture-frame",
        `surface-posture-frame--${resolution.postureClass}`,
        `surface-posture-frame--${contract.scope}`,
      )}
      data-testid="surface-posture-frame"
      data-posture-class={resolution.postureClass}
      data-surface-state={resolution.postureClass}
      data-state-owner={contract.stateOwner}
      data-state-reason={contract.rationale}
      data-dominant-action={contract.nextSafeActionLabel}
      data-dominant-recovery-action={dominantAction?.label ?? "none"}
      data-preserved-anchor={contract.selectedAnchor?.anchorId ?? "none"}
      data-visibility-state={contract.visibilityState}
      data-freshness-state={contract.freshnessState}
      data-actionability-state={contract.actionabilityState}
      data-return-anchor={contract.selectedAnchor?.returnLabel ?? "none"}
      data-scope={contract.scope}
      data-mission-stack-fold-safe={contract.missionStackFoldSafe ? "true" : "false"}
      aria-live={ariaLiveForPosture(resolution.postureClass)}
      aria-label={`${contract.regionLabel} posture frame`}
      style={{ minHeight: `${contract.minimumHeightPx}px` }}
    >
      <header className="surface-posture-frame__masthead">
        <div>
          <span className="surface-posture-kicker">{contract.shellLabel}</span>
          <h1>{contract.regionLabel}</h1>
        </div>
        <div className="surface-posture-frame__tuple">
          <span>{contract.scope}</span>
          <span>{contract.postureClass.replaceAll("_", " ")}</span>
        </div>
      </header>
      <SharedStatusStrip input={contract.statusInput} />
      <CasePulse pulse={contract.pulse} />
      <div className="surface-posture-frame__grid">
        <div className="surface-posture-frame__main">
          <DegradedModeNoticeStrip contract={resolution} />
          <PostureSummary contract={resolution} />
          {children}
          <PlaceholderBlueprint segments={contract.placeholderSegments} />
        </div>
        <div className="surface-posture-frame__side">
          <PreservedAnchorCard anchor={contract.selectedAnchor} />
          <RecoveryActionCluster actions={contract.recoveryActions} />
          {resolution.issues.length > 0 ? (
            <ul className="surface-posture-issue-list" data-testid="posture-issues">
              {resolution.issues.map((issue) => (
                <li key={`${issue.code}-${issue.message}`} data-severity={issue.severity}>
                  <strong>{issue.code}</strong>
                  <span>{issue.message}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FrameBody({
  label,
  body,
}: {
  label: string;
  body: string;
}) {
  return (
    <article className="surface-posture-body-card">
      <span className="surface-posture-kicker">{label}</span>
      <p>{body}</p>
    </article>
  );
}

export function LoadingSummaryFrame({ contract }: { contract: SurfacePostureContract }) {
  return (
    <SurfacePostureFrame contract={contract}>
      <FrameBody
        label="Loading summary"
        body="Known shell chrome, object identity, and selected anchor stay present while only the unresolved footprint hydrates."
      />
    </SurfacePostureFrame>
  );
}

export function EmptyStateFrame({ contract }: { contract: SurfacePostureContract }) {
  return (
    <SurfacePostureFrame contract={contract}>
      <FrameBody
        label="Empty state"
        body="Nothing is needed here right now. The shell explains what usually appears and points to the next safe move."
      />
    </SurfacePostureFrame>
  );
}

export function SparseStateFrame({ contract }: { contract: SurfacePostureContract }) {
  return (
    <SurfacePostureFrame contract={contract}>
      <FrameBody
        label="Sparse state"
        body="A meaningful residual summary remains, so the surface stays analytical instead of decorative."
      />
    </SurfacePostureFrame>
  );
}

export function PartialVisibilityFrame({ contract }: { contract: SurfacePostureContract }) {
  return (
    <SurfacePostureFrame contract={contract}>
      <FrameBody
        label="Partial visibility"
        body="Visible safe summary remains in place while withheld or masked fields stay explicit and spatially truthful."
      />
    </SurfacePostureFrame>
  );
}

export function StaleReviewFrame({ contract }: { contract: SurfacePostureContract }) {
  return (
    <SurfacePostureFrame contract={contract}>
      <FrameBody
        label="Stale review"
        body="The surface keeps the last stable view visible while freshness evidence is reviewed before action posture returns."
      />
    </SurfacePostureFrame>
  );
}

export function BlockedRecoveryFrame({ contract }: { contract: SurfacePostureContract }) {
  return (
    <SurfacePostureFrame contract={contract}>
      <FrameBody
        label="Blocked recovery"
        body="The shell stays on the same object and makes one recovery path dominant instead of dropping the user into a detached error page."
      />
    </SurfacePostureFrame>
  );
}

export function ReadOnlyFrame({ contract }: { contract: SurfacePostureContract }) {
  return (
    <SurfacePostureFrame contract={contract}>
      <FrameBody
        label="Read-only"
        body="The analytical or patient-safe summary remains visible, but writable posture is explicitly fenced until trust, freshness, and release proof align."
      />
    </SurfacePostureFrame>
  );
}

export function PlaceholderOnlyFrame({ contract }: { contract: SurfacePostureContract }) {
  return (
    <SurfacePostureFrame contract={contract}>
      <FrameBody
        label="Placeholder only"
        body="Only the governed placeholder footprint is shown, so the shell preserves identity without overclaiming visibility or readiness."
      />
    </SurfacePostureFrame>
  );
}

export function SurfaceStateFrame({ contract }: { contract: SurfacePostureContract }) {
  const resolved = resolveSurfacePostureContract(contract);
  switch (resolved.postureClass) {
    case "loading_summary":
      return <LoadingSummaryFrame contract={resolved} />;
    case "empty":
      return <EmptyStateFrame contract={resolved} />;
    case "sparse":
      return <SparseStateFrame contract={resolved} />;
    case "partial_visibility":
      return <PartialVisibilityFrame contract={resolved} />;
    case "stale_review":
    case "calm_degraded":
      return <StaleReviewFrame contract={resolved} />;
    case "blocked_recovery":
    case "bounded_recovery":
      return <BlockedRecoveryFrame contract={resolved} />;
    case "read_only":
      return <ReadOnlyFrame contract={resolved} />;
    case "placeholder_only":
      return <PlaceholderOnlyFrame contract={resolved} />;
  }
}
