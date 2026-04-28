import { useEffect, useMemo, useRef, useState } from "react";
import type { StaffRouteKind, StaffShellRoute, StaffShellLedger } from "./workspace-shell.data";
import type { WorkspaceFocusContinuityProjection } from "./workspace-focus-continuity.data";

export const WORKSPACE_ACCESSIBILITY_VISUAL_MODE = "Quiet_Clinical_Ergonomic_Hardening";

export const WORKSPACE_FOCUS_TARGET_IDS = {
  workboard: "workspace-workboard",
  previewPocket: "workspace-preview-pocket",
  taskCanvas: "workspace-task-canvas",
  decisionDock: "workspace-decision-dock",
  context: "workspace-context-region",
  peerRoute: "workspace-peer-route",
} as const;

export type WorkspaceFocusTargetId =
  (typeof WORKSPACE_FOCUS_TARGET_IDS)[keyof typeof WORKSPACE_FOCUS_TARGET_IDS];

export type WorkspaceAccessibilitySurfaceRef =
  | "workspace_shell"
  | "workspace_navigation"
  | "queue_workboard"
  | "queue_preview"
  | "active_task_shell"
  | "task_canvas"
  | "decision_dock"
  | "context_region"
  | "peer_route";

export type WorkspaceAccessibilityFreshnessState = "fresh" | "stale" | "degraded" | "blocked";
export type WorkspaceAccessibilityActionability = "live" | "bounded" | "read_only" | "recovery_required";

export interface AccessibleSurfaceContract {
  accessibleSurfaceContractId: string;
  surfaceRef: WorkspaceAccessibilitySurfaceRef;
  landmarkRole: "banner" | "navigation" | "main" | "region" | "complementary" | "search" | "form";
  headingRef: string;
  accessibleNameRef: string;
  stateSummaryRef: string;
  dominantActionRef: string;
  readingOrderRef: string;
  chromeSuppressionRef: string;
  freshnessAccessibilityContractRef: string;
}

export interface KeyboardInteractionContract {
  keyboardInteractionContractId: string;
  surfaceRef: WorkspaceAccessibilitySurfaceRef;
  navigationModel: "tab_ring" | "roving_tabindex" | "grid" | "toolbar" | "tabs" | "listbox";
  entryRef: string;
  selectionModel: "selection_independent" | "selection_follows_focus" | "explicit_commit";
  shortcutScopeRef: string;
  shortcutDisclosureRef: string;
  escapeBehaviorRef: string;
  restoreTargetRef: string;
  selectedAnchorRef: string;
}

export interface FocusTransitionContract {
  focusTransitionContractId: string;
  surfaceRef: WorkspaceAccessibilitySurfaceRef;
  trigger:
    | "open"
    | "close"
    | "same_shell_refresh"
    | "invalidation"
    | "settlement"
    | "restore"
    | "browser_return";
  fromTargetRef: string;
  toTargetRef: string;
  fallbackTargetRef: string;
  selectedAnchorRef: string;
  scrollPolicy: "preserve" | "reveal_without_jump" | "top_reset_forbidden";
  announcementRef: string;
  focusReasonRef: string;
  transitionState: "stable" | "promoted" | "recovery_only";
}

export interface AssistiveAnnouncementContract {
  assistiveAnnouncementContractId: string;
  surfaceRef: WorkspaceAccessibilitySurfaceRef;
  channel: "polite" | "assertive" | "off";
  announcementClass:
    | "surface_summary"
    | "routine_status"
    | "authoritative_settlement"
    | "blocker"
    | "recovery"
    | "freshness_actionability";
  messageRef: string;
  sourceStateRef: string;
  selectedAnchorRef: string;
  dominantActionRef: string;
  batchWindowMs: number;
  dedupeWindowMs: number;
  focusImpact: "none" | "advisory" | "required";
}

export interface FreshnessAccessibilityContract {
  freshnessAccessibilityContractId: string;
  surfaceRef: WorkspaceAccessibilitySurfaceRef;
  trustState: WorkspaceAccessibilityFreshnessState;
  transportState: "live" | "paused" | "reconnecting";
  actionabilityState: WorkspaceAccessibilityActionability;
  assistiveSummaryRef: string;
  nextSafeActionRef: string;
}

export interface AssistiveTextPolicy {
  assistiveTextPolicyId: string;
  audienceTier: "staff";
  tone: "calm" | "directive" | "clinical" | "operational";
  readingAgeBand: "professional_staff";
  ctaPolicy: "one_primary";
}

export interface AccessibilitySemanticCoverageProfile {
  accessibilitySemanticCoverageProfileId: string;
  routeFamilyRef: StaffShellRoute["routeFamilyRef"];
  shellType: "staff";
  audienceTier: "staff";
  semanticSurfaceRefs: readonly WorkspaceAccessibilitySurfaceRef[];
  coverageTupleHash: string;
  coverageState: "complete" | "degraded" | "blocked";
  requiredBreakpointClassRefs: ReadonlyArray<"compact" | "narrow" | "medium" | "wide">;
  missionStackCoverageRef: string;
  reducedMotionEquivalenceRef: string;
  bufferedUpdateCoverageRefs: readonly string[];
}

export interface WorkspaceAccessibilityContractBundle {
  taskId: string;
  visualMode: typeof WORKSPACE_ACCESSIBILITY_VISUAL_MODE;
  accessibleSurfaceContracts: readonly AccessibleSurfaceContract[];
  keyboardInteractionContracts: readonly KeyboardInteractionContract[];
  focusTransitionContracts: readonly FocusTransitionContract[];
  assistiveAnnouncementContracts: readonly AssistiveAnnouncementContract[];
  freshnessAccessibilityContracts: readonly FreshnessAccessibilityContract[];
  assistiveTextPolicy: AssistiveTextPolicy;
  accessibilitySemanticCoverageProfile: AccessibilitySemanticCoverageProfile;
}

function focusEntryForRoute(kind: StaffRouteKind) {
  switch (kind) {
    case "home":
    case "queue":
    case "search":
      return WORKSPACE_FOCUS_TARGET_IDS.workboard;
    case "task":
      return WORKSPACE_FOCUS_TARGET_IDS.taskCanvas;
    case "more-info":
    case "decision":
      return WORKSPACE_FOCUS_TARGET_IDS.decisionDock;
    case "validation":
      return WORKSPACE_FOCUS_TARGET_IDS.peerRoute;
    case "callbacks":
    case "messages":
    case "consequences":
    case "approvals":
    case "escalations":
    case "changed":
    case "bookings":
    case "support-handoff":
      return WORKSPACE_FOCUS_TARGET_IDS.peerRoute;
  }
}

export function resolveWorkspaceFocusOrder(kind: StaffRouteKind): readonly WorkspaceFocusTargetId[] {
  if (kind === "task" || kind === "more-info" || kind === "decision") {
    return [
      WORKSPACE_FOCUS_TARGET_IDS.workboard,
      WORKSPACE_FOCUS_TARGET_IDS.taskCanvas,
      WORKSPACE_FOCUS_TARGET_IDS.decisionDock,
      WORKSPACE_FOCUS_TARGET_IDS.context,
    ];
  }
  if (kind === "home" || kind === "queue" || kind === "search") {
    return [WORKSPACE_FOCUS_TARGET_IDS.workboard, WORKSPACE_FOCUS_TARGET_IDS.peerRoute];
  }
  return [WORKSPACE_FOCUS_TARGET_IDS.peerRoute];
}

function trustStateFromScenario(
  runtimeScenario: StaffShellLedger["runtimeScenario"],
): WorkspaceAccessibilityFreshnessState {
  switch (runtimeScenario) {
    case "live":
      return "fresh";
    case "stale_review":
      return "stale";
    case "read_only":
    case "recovery_only":
      return "degraded";
    case "blocked":
      return "blocked";
  }
}

function actionabilityFromScenario(
  runtimeScenario: StaffShellLedger["runtimeScenario"],
): WorkspaceAccessibilityActionability {
  switch (runtimeScenario) {
    case "live":
      return "live";
    case "stale_review":
      return "bounded";
    case "read_only":
      return "read_only";
    case "recovery_only":
    case "blocked":
      return "recovery_required";
  }
}

function transportStateFromScenario(
  runtimeScenario: StaffShellLedger["runtimeScenario"],
): FreshnessAccessibilityContract["transportState"] {
  return runtimeScenario === "blocked"
    ? "paused"
    : runtimeScenario === "stale_review"
      ? "reconnecting"
      : "live";
}

export function buildWorkspaceSurfaceAttributes(input: {
  surface: WorkspaceAccessibilitySurfaceRef;
  surfaceState: string;
  focusModel: KeyboardInteractionContract["navigationModel"];
  selectedAnchorRef: string;
  runtimeScenario: StaffShellLedger["runtimeScenario"];
}) {
  return {
    "data-surface": input.surface,
    "data-surface-state": input.surfaceState,
    "data-selected-anchor": input.selectedAnchorRef,
    "data-focus-model": input.focusModel,
    "data-freshness-state": trustStateFromScenario(input.runtimeScenario),
    "data-recovery-posture": actionabilityFromScenario(input.runtimeScenario),
  } as const;
}

export function buildWorkspaceAccessibilityContractBundle(input: {
  route: StaffShellRoute;
  breakpoint: "compact" | "narrow" | "medium" | "wide";
  layoutMode: "two_plane" | "three_plane" | "mission_stack";
  runtimeScenario: StaffShellLedger["runtimeScenario"];
  selectedAnchorRef: string;
  dominantActionLabel: string;
  bufferedUpdateActive: boolean;
}): WorkspaceAccessibilityContractBundle {
  const freshnessState = trustStateFromScenario(input.runtimeScenario);
  const actionabilityState = actionabilityFromScenario(input.runtimeScenario);
  const coverageState =
    freshnessState === "blocked"
      ? "blocked"
      : freshnessState === "degraded"
        ? "degraded"
        : "complete";
  const coverageTupleHash = [
    input.route.routeFamilyRef,
    input.breakpoint,
    input.layoutMode,
    input.runtimeScenario,
    input.selectedAnchorRef,
  ].join("::");

  const surfaces: readonly WorkspaceAccessibilitySurfaceRef[] =
    input.route.kind === "task" || input.route.kind === "more-info" || input.route.kind === "decision"
      ? ["workspace_shell", "workspace_navigation", "queue_workboard", "active_task_shell", "task_canvas", "decision_dock", "context_region"]
      : ["workspace_shell", "workspace_navigation", "queue_workboard", "peer_route"];

  const freshnessContracts = surfaces.map((surface) => ({
    freshnessAccessibilityContractId: `freshness::${surface}`,
    surfaceRef: surface,
    trustState: freshnessState,
    transportState: transportStateFromScenario(input.runtimeScenario),
    actionabilityState,
    assistiveSummaryRef: `${surface} trust is ${freshnessState} and actionability is ${actionabilityState}.`,
    nextSafeActionRef: input.dominantActionLabel,
  }));

  return {
    taskId:
      "par_268_phase3_track_Playwright_or_other_appropriate_tooling_frontend_build_accessibility_and_ergonomic_refinements_for_clinical_workspace",
    visualMode: WORKSPACE_ACCESSIBILITY_VISUAL_MODE,
    accessibleSurfaceContracts: surfaces.map((surface) => ({
      accessibleSurfaceContractId: `surface::${surface}`,
      surfaceRef: surface,
      landmarkRole:
        surface === "workspace_shell"
          ? "main"
          : surface === "workspace_navigation"
            ? "navigation"
            : surface === "decision_dock" || surface === "context_region"
              ? "complementary"
              : "region",
      headingRef: `${surface}-heading`,
      accessibleNameRef: surface.replaceAll("_", " "),
      stateSummaryRef: `${surface} is ${freshnessState}`,
      dominantActionRef: input.dominantActionLabel,
      readingOrderRef:
        surface === "queue_workboard"
          ? "workboard_then_preview"
          : surface === "task_canvas"
            ? "summary_delta_evidence_consequence_reference"
            : "shell_primary_order",
      chromeSuppressionRef: "workspace_shell_chrome_suppression",
      freshnessAccessibilityContractRef: `freshness::${surface}`,
    })),
    keyboardInteractionContracts: [
      {
        keyboardInteractionContractId: "keyboard::queue_workboard",
        surfaceRef: "queue_workboard",
        navigationModel: "listbox",
        entryRef: WORKSPACE_FOCUS_TARGET_IDS.workboard,
        selectionModel: "explicit_commit",
        shortcutScopeRef: "workspace_queue_keyboard_scope",
        shortcutDisclosureRef: "Arrow keys move rows, Space pins preview, Enter opens the task.",
        escapeBehaviorRef: "returns_to_selected_anchor_without_clearing_preview",
        restoreTargetRef: WORKSPACE_FOCUS_TARGET_IDS.workboard,
        selectedAnchorRef: input.selectedAnchorRef,
      },
      {
        keyboardInteractionContractId: "keyboard::task_canvas",
        surfaceRef: "task_canvas",
        navigationModel: "tab_ring",
        entryRef: WORKSPACE_FOCUS_TARGET_IDS.taskCanvas,
        selectionModel: "selection_independent",
        shortcutScopeRef: "workspace_task_canvas_scope",
        shortcutDisclosureRef: "Tab moves between task stacks, viewer, and thread references.",
        escapeBehaviorRef: "returns_to_current_task_anchor",
        restoreTargetRef: WORKSPACE_FOCUS_TARGET_IDS.taskCanvas,
        selectedAnchorRef: input.selectedAnchorRef,
      },
      {
        keyboardInteractionContractId: "keyboard::decision_dock",
        surfaceRef: "decision_dock",
        navigationModel: "tab_ring",
        entryRef: WORKSPACE_FOCUS_TARGET_IDS.decisionDock,
        selectionModel: "explicit_commit",
        shortcutScopeRef: "workspace_decision_dock_scope",
        shortcutDisclosureRef: "Tab moves through shortlist, stages, continuity, and next-task controls.",
        escapeBehaviorRef: "returns_to_task_canvas",
        restoreTargetRef: WORKSPACE_FOCUS_TARGET_IDS.taskCanvas,
        selectedAnchorRef: input.selectedAnchorRef,
      },
      {
        keyboardInteractionContractId: "keyboard::peer_route",
        surfaceRef: "peer_route",
        navigationModel: "tab_ring",
        entryRef: WORKSPACE_FOCUS_TARGET_IDS.peerRoute,
        selectionModel: "selection_independent",
        shortcutScopeRef: "workspace_peer_route_scope",
        shortcutDisclosureRef: "Tab enters the route surface and arrow keys stay local only inside declared tabs or lists.",
        escapeBehaviorRef: "returns_to_route_focus_entry",
        restoreTargetRef: WORKSPACE_FOCUS_TARGET_IDS.peerRoute,
        selectedAnchorRef: input.selectedAnchorRef,
      },
    ],
    focusTransitionContracts: [
      {
        focusTransitionContractId: "focus::route_open",
        surfaceRef: "workspace_shell",
        trigger: "open",
        fromTargetRef: "route_launcher",
        toTargetRef: focusEntryForRoute(input.route.kind),
        fallbackTargetRef: WORKSPACE_FOCUS_TARGET_IDS.workboard,
        selectedAnchorRef: input.selectedAnchorRef,
        scrollPolicy: "reveal_without_jump",
        announcementRef: "announce::route_summary",
        focusReasonRef: "route_entry",
        transitionState: coverageState === "complete" ? "stable" : "recovery_only",
      },
      {
        focusTransitionContractId: "focus::route_restore",
        surfaceRef: "workspace_shell",
        trigger: "restore",
        fromTargetRef: "browser_return",
        toTargetRef: focusEntryForRoute(input.route.kind),
        fallbackTargetRef: WORKSPACE_FOCUS_TARGET_IDS.workboard,
        selectedAnchorRef: input.selectedAnchorRef,
        scrollPolicy: "preserve",
        announcementRef: "announce::restored_current_truth",
        focusReasonRef: "same_shell_restore",
        transitionState: input.bufferedUpdateActive ? "promoted" : "stable",
      },
    ],
    assistiveAnnouncementContracts: [
      {
        assistiveAnnouncementContractId: "announce::workspace_shell",
        surfaceRef: "workspace_shell",
        channel: coverageState === "complete" ? "polite" : "assertive",
        announcementClass:
          coverageState === "blocked"
            ? "blocker"
            : coverageState === "degraded"
              ? "recovery"
              : input.bufferedUpdateActive
                ? "routine_status"
                : "surface_summary",
        messageRef: `${input.route.title}. ${input.dominantActionLabel}.`,
        sourceStateRef: input.runtimeScenario,
        selectedAnchorRef: input.selectedAnchorRef,
        dominantActionRef: input.dominantActionLabel,
        batchWindowMs: input.bufferedUpdateActive ? 280 : 180,
        dedupeWindowMs: 1200,
        focusImpact: coverageState === "complete" ? "none" : "advisory",
      },
    ],
    freshnessAccessibilityContracts: freshnessContracts,
    assistiveTextPolicy: {
      assistiveTextPolicyId: "policy::workspace_staff_operational",
      audienceTier: "staff",
      tone: "operational",
      readingAgeBand: "professional_staff",
      ctaPolicy: "one_primary",
    },
    accessibilitySemanticCoverageProfile: {
      accessibilitySemanticCoverageProfileId: "coverage::workspace_phase3",
      routeFamilyRef: input.route.routeFamilyRef,
      shellType: "staff",
      audienceTier: "staff",
      semanticSurfaceRefs: surfaces,
      coverageTupleHash,
      coverageState,
      requiredBreakpointClassRefs: ["compact", "narrow", "medium", "wide"],
      missionStackCoverageRef: "mission_stack_supported",
      reducedMotionEquivalenceRef: "reduced_motion_outline_and_structure",
      bufferedUpdateCoverageRefs: input.bufferedUpdateActive
        ? ["buffered_queue_digest", "selected_anchor_preserved"]
        : ["steady_state"],
    },
  };
}

export function buildWorkspaceAnnouncementPlan(input: {
  route: StaffShellRoute;
  runtimeScenario: StaffShellLedger["runtimeScenario"];
  selectedAnchorRef: string;
  dominantActionLabel: string;
  focusContinuity: WorkspaceFocusContinuityProjection;
  rowCountLabel: string;
}) {
  const freshness = trustStateFromScenario(input.runtimeScenario);
  const recoveryPosture = actionabilityFromScenario(input.runtimeScenario);
  const bufferedTray = input.focusContinuity.bufferedQueueTray;

  if (freshness === "blocked") {
    return {
      channel: "assertive" as const,
      announcementClass: "blocker" as const,
      message: `${input.route.title}. Blocked posture. ${input.focusContinuity.protectionStrip.summary} ${input.dominantActionLabel}.`,
      stateHash: `blocked::${input.route.path}::${input.selectedAnchorRef}`,
    };
  }

  if (freshness === "degraded") {
    return {
      channel: "assertive" as const,
      announcementClass: "recovery" as const,
      message: `${input.route.title}. Recovery-only posture. ${input.focusContinuity.protectionStrip.summary} ${input.dominantActionLabel}.`,
      stateHash: `recovery::${input.route.path}::${input.selectedAnchorRef}`,
    };
  }

  if (bufferedTray) {
    return {
      channel: "polite" as const,
      announcementClass: "routine_status" as const,
      message: `${input.route.title}. ${bufferedTray.totalCount} buffered queue changes held for ${bufferedTray.preservedAnchorRef}. ${input.dominantActionLabel}.`,
      stateHash: `buffered::${input.route.path}::${bufferedTray.preservedAnchorRef}::${bufferedTray.totalCount}`,
    };
  }

  if (freshness === "stale") {
    return {
      channel: "polite" as const,
      announcementClass: "freshness_actionability" as const,
      message: `${input.route.title}. Stale review posture. Current anchor ${input.selectedAnchorRef}. ${input.dominantActionLabel}.`,
      stateHash: `stale::${input.route.path}::${input.selectedAnchorRef}`,
    };
  }

  return {
    channel: "polite" as const,
    announcementClass: "surface_summary" as const,
    message: `${input.route.title}. ${input.rowCountLabel}. Current anchor ${input.selectedAnchorRef}. Dominant action ${input.dominantActionLabel}.`,
    stateHash: `surface::${input.route.path}::${input.selectedAnchorRef}::${recoveryPosture}`,
  };
}

export function WorkspaceAnnouncementHub({
  message,
  channel,
  announcementClass,
  stateHash,
}: {
  message: string;
  channel: "polite" | "assertive" | "off";
  announcementClass:
    | "surface_summary"
    | "routine_status"
    | "authoritative_settlement"
    | "blocker"
    | "recovery"
    | "freshness_actionability";
  stateHash: string;
}) {
  const [published, setPublished] = useState("");
  const lastHashRef = useRef<string>("");

  useEffect(() => {
    if (channel === "off" || lastHashRef.current === stateHash) {
      return;
    }
    const timeout = window.setTimeout(() => {
      lastHashRef.current = stateHash;
      setPublished(message);
    }, channel === "assertive" ? 120 : 200);
    return () => window.clearTimeout(timeout);
  }, [channel, message, stateHash]);

  return (
    <div
      className="staff-shell__live-region"
      data-testid="WorkspaceAnnouncementHub"
      data-announcement-channel={channel}
      data-announcement-class={announcementClass}
      data-announcement-hash={stateHash}
    >
      <div
        className="sr-only"
        id="workspace-live-polite"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {channel === "polite" ? published : ""}
      </div>
      <div
        className="sr-only"
        id="workspace-live-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {channel === "assertive" ? published : ""}
      </div>
    </div>
  );
}

export function WorkspaceSkipLinks({
  routeKind,
}: {
  routeKind: StaffRouteKind;
}) {
  const links = useMemo(() => {
    if (routeKind === "task" || routeKind === "more-info" || routeKind === "decision") {
      return [
        { href: `#${WORKSPACE_FOCUS_TARGET_IDS.workboard}`, label: "Skip to workboard" },
        { href: `#${WORKSPACE_FOCUS_TARGET_IDS.taskCanvas}`, label: "Skip to task canvas" },
        { href: `#${WORKSPACE_FOCUS_TARGET_IDS.decisionDock}`, label: "Skip to decision dock" },
        { href: `#${WORKSPACE_FOCUS_TARGET_IDS.context}`, label: "Skip to context region" },
      ];
    }
    if (routeKind === "home" || routeKind === "queue" || routeKind === "search") {
      return [
        { href: `#${WORKSPACE_FOCUS_TARGET_IDS.workboard}`, label: "Skip to workboard" },
        { href: `#${WORKSPACE_FOCUS_TARGET_IDS.peerRoute}`, label: "Skip to current route" },
      ];
    }
    return [
      { href: `#${WORKSPACE_FOCUS_TARGET_IDS.peerRoute}`, label: "Skip to current route" },
    ];
  }, [routeKind]);

  return (
    <nav className="staff-shell__skip-links" aria-label="Skip links">
      {links.map((link) => (
        <a key={link.href} href={link.href} className="staff-shell__skip-link">
          {link.label}
        </a>
      ))}
    </nav>
  );
}

export function resolveRouteFocusEntryId(kind: StaffRouteKind) {
  return focusEntryForRoute(kind);
}

export function resolveWorkspaceKeyboardModelDescription(kind: StaffRouteKind) {
  const orderedLabels =
    kind === "task" || kind === "more-info" || kind === "decision"
      ? "workboard, task canvas, decision dock, then context region"
      : kind === "bookings"
        ? "the booking exception queue, case summary, slot compare stage, then recovery and settlement controls"
      : kind === "home" || kind === "queue" || kind === "search"
        ? "workboard, then the current route surface"
        : "the current route surface";
  return `Use skip links or Alt+Shift+ArrowLeft and Alt+Shift+ArrowRight to move between ${orderedLabels}. Queue rows use arrow keys for scan, Space pins preview, and Enter opens the task.`;
}
