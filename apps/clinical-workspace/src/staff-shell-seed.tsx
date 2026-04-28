import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  buildAutomationSurfaceAttributes,
  createUiTelemetryEnvelope,
  type UiTelemetryEnvelopeExample,
} from "@vecells/persistent-shell";
import { CasePulse, SharedStatusStrip } from "@vecells/design-system";
import { SurfaceStateFrame } from "@vecells/surface-postures";
import { ActiveTaskShell } from "./workspace-active-task-shell";
import { ApprovalInboxRoute, EscalationWorkspaceRoute } from "./workspace-approval-escalation";
import {
  buildCallbackWorkbenchProjection,
  defaultCallbackWorkbenchTaskId,
  listCallbackWorkbenchTaskIds,
} from "./workspace-callback-workbench.data";
import { CallbackWorklistRoute } from "./workspace-callback-workbench";
import { ChangedWorkRoute } from "./workspace-changed-review";
import {
  buildSelfCareAdminViewsRouteProjection,
  defaultSelfCareAdminTaskId,
  listSelfCareAdminTaskIds,
} from "./workspace-selfcare-admin.data";
import { SelfCareAdminViewsRoute } from "./workspace-selfcare-admin";
import {
  buildClinicianMessageWorkbenchProjection,
  defaultClinicianMessageWorkbenchTaskId,
  listClinicianMessageWorkbenchTaskIds,
  type ClinicianMessageStage,
} from "./workspace-clinician-message-repair.data";
import { ClinicianMessageThreadSurface } from "./workspace-clinician-message-repair";
import { STAFF_BOOKING_HANDOFF_VISUAL_MODE } from "./workspace-booking-handoff.model";
import { StaffBookingHandoffPanel } from "./workspace-booking-handoff";
import { AssistiveRailShell, AssistiveRailStateAdapter } from "./assistive-rail";
import {
  AssistiveWorkspaceStageHost,
  AssistiveWorkspaceStageStateAdapter,
} from "./assistive-workspace-stage";
import {
  AssistiveQueueAndAssuranceMergeAdapter,
  AssistiveQueueOpenToStageBridge,
  buildAssistiveQueueAndAssuranceMergeState,
} from "./assistive-queue-assurance-merge";
import { buildWorkspaceFocusContinuityProjection } from "./workspace-focus-continuity.data";
import {
  CLINICAL_BETA_VALIDATION_FEATURE_FLAG,
  CLINICAL_BETA_VALIDATION_VISUAL_MODE,
  recordWorkspaceSupportUiEvent,
  type ValidationRouteFamilyRef,
  type ValidationActionFamily,
} from "./workspace-support-observability";
import { WorkspaceValidationRoute } from "./workspace-validation-board";
import { WorkspaceCommandPalette } from "./workspace-command-palette";
import {
  STAFF_STORAGE_KEY,
  STAFF_TELEMETRY_SCENARIO_ID,
  applyQueueChangeBatch,
  buildApprovalInboxRouteProjection,
  buildChangedWorkRouteProjection,
  buildStaffPath,
  buildEscalationRouteProjection,
  buildSurfacePosture,
  buildTaskWorkspaceProjection,
  buildWorkspaceStatus,
  createInitialAttachmentAndThreadSelection,
  createInitialRapidEntryDraft,
  createInitialLedger,
  createStaffRouteAuthority,
  defaultAnchorForRoute,
  defaultDecisionOption,
  deriveTaskForRoute,
  deriveVisibleQueueRows,
  listQueueCases,
  listSearchCases,
  parseStaffPath,
  reduceLedgerForNavigation,
  requireCase,
  staffAutomationProfile,
  staffCases,
  staffHomeModules,
  staffQueues,
  type StaffHomeModule,
  type StaffRouteAuthorityArtifacts,
  type StaffRouteKind,
  type StaffShellLedger,
  type StaffShellRoute,
  type RapidEntryDraftInput,
} from "./workspace-shell.data";
import { QueueScanManager } from "./workspace-queue-workboard";
import {
  WORKSPACE_FOCUS_TARGET_IDS,
  WORKSPACE_ACCESSIBILITY_VISUAL_MODE,
  WorkspaceAnnouncementHub,
  WorkspaceSkipLinks,
  buildWorkspaceAccessibilityContractBundle,
  buildWorkspaceAnnouncementPlan,
  buildWorkspaceSurfaceAttributes,
  resolveRouteFocusEntryId,
  resolveWorkspaceFocusOrder,
  resolveWorkspaceKeyboardModelDescription,
} from "./workspace-accessibility";

const WORKSPACE_ROUTE_FAMILY_TASK_ID =
  "par_255_phase3_track_Playwright_or_other_appropriate_tooling_frontend_build_workspace_home_queue_and_task_route_family";
const WORKSPACE_DESIGN_MODE = "Quiet_Clinical_Mission_Control";
const CONTROL_ROOM_DESIGN_MODE = "Quiet_Escalation_Control_Room";
const DELTA_REENTRY_DESIGN_MODE = "Delta_Reentry_Compass";
const CALLBACK_OPERATIONS_DECK = "Callback_Operations_Deck";
const THREAD_REPAIR_STUDIO = "Thread_Repair_Studio";
const BOUNDED_CONSEQUENCE_STUDIO = "Bounded_Consequence_Studio";

function validationPublicationPosture(
  runtimeScenario: StaffShellLedger["runtimeScenario"],
): "live" | "projection_visible" | "recovery_only" | "blocked" {
  switch (runtimeScenario) {
    case "live":
      return "live";
    case "stale_review":
      return "projection_visible";
    case "read_only":
    case "recovery_only":
      return "recovery_only";
    case "blocked":
      return "blocked";
  }
}

function validationRecoveryPosture(
  runtimeScenario: StaffShellLedger["runtimeScenario"],
): "none" | "stale_recoverable" | "read_only_fallback" | "recovery_required" | "blocked" {
  switch (runtimeScenario) {
    case "live":
      return "none";
    case "stale_review":
      return "stale_recoverable";
    case "read_only":
      return "read_only_fallback";
    case "recovery_only":
      return "recovery_required";
    case "blocked":
      return "blocked";
  }
}

function validationEventState(
  runtimeScenario: StaffShellLedger["runtimeScenario"],
): "provisional" | "authoritative" | "buffered" | "resolved" | "failed" {
  switch (runtimeScenario) {
    case "live":
      return "authoritative";
    case "stale_review":
      return "buffered";
    case "read_only":
    case "recovery_only":
      return "provisional";
    case "blocked":
      return "failed";
  }
}

function validationSettlementProfile(runtimeScenario: StaffShellLedger["runtimeScenario"]) {
  switch (runtimeScenario) {
    case "live":
      return {
        localAckState: "shown" as const,
        processingAcceptanceState: "externally_accepted" as const,
        externalObservationState: "projection_visible" as const,
        authoritativeSource: "projection_visible" as const,
        authoritativeOutcomeState: "settled" as const,
        settlementState: "authoritative" as const,
      };
    case "stale_review":
      return {
        localAckState: "buffered" as const,
        processingAcceptanceState: "awaiting_external_confirmation" as const,
        externalObservationState: "projection_visible" as const,
        authoritativeSource: "not_yet_authoritative" as const,
        authoritativeOutcomeState: "review_required" as const,
        settlementState: "accepted" as const,
      };
    case "read_only":
      return {
        localAckState: "shown" as const,
        processingAcceptanceState: "accepted_for_processing" as const,
        externalObservationState: "recovery_only" as const,
        authoritativeSource: "recovery_disposition" as const,
        authoritativeOutcomeState: "recovery_required" as const,
        settlementState: "disputed" as const,
      };
    case "recovery_only":
      return {
        localAckState: "restored" as const,
        processingAcceptanceState: "accepted_for_processing" as const,
        externalObservationState: "recovery_only" as const,
        authoritativeSource: "recovery_disposition" as const,
        authoritativeOutcomeState: "recovery_required" as const,
        settlementState: "disputed" as const,
      };
    case "blocked":
      return {
        localAckState: "shown" as const,
        processingAcceptanceState: "externally_rejected" as const,
        externalObservationState: "blocked" as const,
        authoritativeSource: "recovery_disposition" as const,
        authoritativeOutcomeState: "failed" as const,
        settlementState: "reverted" as const,
      };
  }
}

function actionFamilyForRoute(route: StaffShellRoute): ValidationActionFamily | null {
  switch (route.kind) {
    case "queue":
    case "search":
      return "claim";
    case "task":
      return "start_review";
    case "more-info":
      return "request_more_info";
    case "decision":
      return "close";
    case "consequences":
      return "self_care_action";
    case "callbacks":
      return "callback_action";
    case "messages":
      return "message_action";
    case "approvals":
      return "approve";
    case "escalations":
      return "escalate";
    case "changed":
      return "reopen";
    case "bookings":
      return "handoff";
    case "support-handoff":
      return "handoff";
    case "home":
    case "validation":
      return null;
  }
}

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function isPeerSelectionRoute(kind: StaffRouteKind): boolean {
  return (
    kind === "consequences" ||
    kind === "callbacks" ||
    kind === "messages" ||
    kind === "approvals" ||
    kind === "escalations" ||
    kind === "changed" ||
    kind === "bookings" ||
    kind === "search"
  );
}

function taskBelongsToRoute(kind: StaffRouteKind, taskId: string): boolean {
  const task = requireCase(taskId);
  switch (kind) {
    case "consequences":
      return listSelfCareAdminTaskIds().includes(taskId);
    case "callbacks":
      return listCallbackWorkbenchTaskIds().includes(taskId);
    case "messages":
      return listClinicianMessageWorkbenchTaskIds().includes(taskId);
    case "approvals":
      return task.state === "approval";
    case "escalations":
      return task.state === "escalated" || task.state === "blocked";
    case "changed":
      return (
        task.state === "changed" || task.state === "reassigned" || task.deltaClass !== "contextual"
      );
    case "search":
      return true;
    default:
      return false;
  }
}

function selectedTaskForRoute(route: StaffShellRoute, selectedTaskId: string) {
  if (isPeerSelectionRoute(route.kind) && taskBelongsToRoute(route.kind, selectedTaskId)) {
    return requireCase(selectedTaskId);
  }
  return deriveTaskForRoute(route) ?? requireCase(selectedTaskId);
}

function designModeForRoute(route: StaffShellRoute): string {
  if (route.kind === "validation") {
    return CLINICAL_BETA_VALIDATION_VISUAL_MODE;
  }
  if (route.kind === "changed") {
    return DELTA_REENTRY_DESIGN_MODE;
  }
  if (route.kind === "consequences") {
    return BOUNDED_CONSEQUENCE_STUDIO;
  }
  if (route.kind === "messages") {
    return THREAD_REPAIR_STUDIO;
  }
  if (route.kind === "callbacks") {
    return CALLBACK_OPERATIONS_DECK;
  }
  if (route.kind === "bookings") {
    return STAFF_BOOKING_HANDOFF_VISUAL_MODE;
  }
  return route.kind === "approvals" || route.kind === "escalations"
    ? CONTROL_ROOM_DESIGN_MODE
    : WORKSPACE_DESIGN_MODE;
}

function readPersistedLedger(): StaffShellLedger | null {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return null;
  }
  const payload = ownerWindow.localStorage.getItem(STAFF_STORAGE_KEY);
  if (!payload) {
    return null;
  }
  try {
    const parsed = JSON.parse(payload) as Partial<StaffShellLedger>;
    const defaultSelectedTaskId =
      parsed.path === "/workspace/callbacks"
        ? defaultCallbackWorkbenchTaskId()
        : parsed.path === "/workspace/consequences"
          ? defaultSelfCareAdminTaskId()
          : parsed.path === "/workspace/messages"
            ? defaultClinicianMessageWorkbenchTaskId()
            : "task-311";
    return {
      path: parsed.path ?? "/workspace",
      selectedAnchorId: parsed.selectedAnchorId ?? "hero-recommended-queue",
      queueKey: parsed.queueKey ?? "recommended",
      selectedTaskId: parsed.selectedTaskId ?? defaultSelectedTaskId,
      previewTaskId: parsed.previewTaskId ?? parsed.selectedTaskId ?? defaultSelectedTaskId,
      searchQuery: parsed.searchQuery ?? "",
      callbackStage: parsed.callbackStage ?? "detail",
      messageStage: parsed.messageStage ?? "detail",
      bufferedUpdateCount: parsed.bufferedUpdateCount ?? (parsed.queuedBatchPending ? 3 : 0),
      queuedBatchPending: parsed.queuedBatchPending ?? false,
      bufferedQueueTrayState:
        parsed.bufferedQueueTrayState ?? (parsed.queuedBatchPending ? "collapsed" : "collapsed"),
      runtimeScenario: parsed.runtimeScenario ?? "live",
      lastQuietRegionLabel: parsed.lastQuietRegionLabel ?? "Queue workboard",
    };
  } catch {
    return null;
  }
}

function writePersistedLedger(ledger: StaffShellLedger): void {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return;
  }
  ownerWindow.localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(ledger));
}

function initialRoute(): StaffShellRoute {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return parseStaffPath("/workspace");
  }
  return parseStaffPath(ownerWindow.location.pathname, ownerWindow.location.search);
}

function runtimeScenarioFromSearch(): StaffShellLedger["runtimeScenario"] | null {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return null;
  }
  const state = new URLSearchParams(ownerWindow.location.search).get("state")?.trim().toLowerCase();
  switch (state) {
    case "quiet":
    case "calm":
    case "live":
      return "live";
    case "stale":
    case "stale-review":
    case "stale_review":
      return "stale_review";
    case "read-only":
    case "read_only":
    case "readonly":
    case "observe":
      return "read_only";
    case "recovery":
    case "degraded":
    case "recovery-only":
    case "recovery_only":
      return "recovery_only";
    case "blocked":
      return "blocked";
    default:
      return null;
  }
}

function dispatchRouteChange(): void {
  const ownerWindow = safeWindow();
  ownerWindow?.dispatchEvent(new CustomEvent("vecells-route-change"));
}

function historyStateFromLedger(
  ledger: Pick<
    StaffShellLedger,
    "selectedTaskId" | "previewTaskId" | "selectedAnchorId" | "callbackStage" | "messageStage"
  >,
) {
  return {
    selectedTaskId: ledger.selectedTaskId,
    previewTaskId: ledger.previewTaskId,
    selectedAnchorId: ledger.selectedAnchorId,
    callbackStage: ledger.callbackStage,
    messageStage: ledger.messageStage,
  };
}

const PRESERVED_ROUTE_QUERY_KEYS = [
  "state",
  "fixture",
  "assistiveRail",
  "assistiveRailCollapsed",
  "assistiveDraft",
  "assistiveConfidence",
  "assistiveOverride",
  "assistiveTrust",
  "assistiveRecovery",
  "assistiveStage",
  "assistiveMerge",
] as const;

function buildBrowserRouteUrl(path: string, search: string): string {
  const nextUrl = new URL(path, "https://workspace.local");
  const currentParams = new URLSearchParams(search);
  for (const key of PRESERVED_ROUTE_QUERY_KEYS) {
    if (nextUrl.searchParams.has(key)) {
      continue;
    }
    for (const value of currentParams.getAll(key)) {
      nextUrl.searchParams.append(key, value);
    }
  }
  const nextSearch = nextUrl.searchParams.toString();
  return `${nextUrl.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
}

function layoutModeForWidth(
  width: number,
  route: StaffShellRoute,
): "two_plane" | "three_plane" | "mission_stack" {
  if (width < 1120) {
    return "mission_stack";
  }
  return route.kind === "callbacks" ||
    route.kind === "validation" ||
    route.kind === "consequences" ||
    route.kind === "messages" ||
    route.kind === "approvals" ||
    route.kind === "escalations" ||
    route.kind === "changed" ||
    route.kind === "bookings"
    ? "three_plane"
    : "two_plane";
}

function breakpointLabel(width: number): "compact" | "narrow" | "medium" | "wide" {
  if (width < 640) {
    return "compact";
  }
  if (width < 1120) {
    return "narrow";
  }
  if (width < 1440) {
    return "medium";
  }
  return "wide";
}

function routeTestId(kind: StaffRouteKind): string {
  switch (kind) {
    case "home":
      return "WorkspaceHomeRoute";
    case "queue":
      return "WorkspaceQueueRoute";
    case "task":
      return "WorkspaceTaskRoute";
    case "more-info":
      return "WorkspaceMoreInfoChildRoute";
    case "decision":
      return "WorkspaceDecisionChildRoute";
    case "validation":
      return "WorkspaceValidationRoute";
    case "consequences":
      return "WorkspaceConsequencesRoute";
    case "callbacks":
      return "WorkspaceCallbacksRoute";
    case "messages":
      return "WorkspaceMessagesRoute";
    case "approvals":
      return "WorkspaceApprovalsRoute";
    case "escalations":
      return "WorkspaceEscalationsRoute";
    case "changed":
      return "WorkspaceChangedRoute";
    case "bookings":
      return "WorkspaceBookingsRoute";
    case "search":
      return "WorkspaceSearchRoute";
    case "support-handoff":
      return "WorkspaceSupportHandoffRoute";
  }
}

function anchorPostureForRoute(route: StaffShellRoute): string {
  switch (route.kind) {
    case "home":
      return "home_resume_anchor";
    case "queue":
      return "queue_selected_anchor";
    case "task":
      return "task_primary_anchor";
    case "more-info":
      return "child_route_protected_anchor";
    case "decision":
      return "child_route_commit_anchor";
    case "validation":
    case "consequences":
    case "callbacks":
    case "messages":
    case "approvals":
    case "escalations":
    case "changed":
    case "bookings":
    case "search":
      return "same_shell_peer_anchor";
    case "support-handoff":
      return "handoff_boundary_anchor";
  }
}

function buildTelemetryEnvelope(input: {
  route: StaffShellRoute;
  eventClass:
    | "surface_enter"
    | "selected_anchor_changed"
    | "dominant_action_changed"
    | "recovery_posture_changed"
    | "visibility_freshness_downgrade";
  selectedAnchorRef: string;
  dominantActionRef: string;
  recoveryPosture: string;
  visualizationAuthority: string;
  artifactModeState?: string;
  payload: Record<string, string>;
}): UiTelemetryEnvelopeExample {
  return createUiTelemetryEnvelope({
    scenarioId: STAFF_TELEMETRY_SCENARIO_ID,
    routeFamilyRef: input.route.routeFamilyRef,
    sourceSurface: "status_truth_lab",
    eventClass: input.eventClass,
    surfaceState: {
      selectedAnchorRef: input.selectedAnchorRef,
      dominantActionRef: input.dominantActionRef,
      recoveryPosture: input.recoveryPosture as "live" | "read_only" | "recovery_only" | "blocked",
      visualizationAuthority: input.visualizationAuthority as
        | "visual_table_summary"
        | "table_only"
        | "summary_only",
      artifactModeState: input.artifactModeState ?? "summary_only",
      routeShellPosture:
        input.recoveryPosture === "live" ? "shell_live" : `shell_${input.recoveryPosture}`,
    },
    payload: input.payload,
  });
}

function StaffInsignia() {
  return (
    <svg
      aria-hidden="true"
      className="staff-shell__insignia"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10 24H48L86 48" />
      <path d="M10 48H48L86 48" />
      <path d="M10 72H48L86 48" />
      <circle cx="48" cy="48" r="7" />
      <circle cx="86" cy="48" r="5" />
    </svg>
  );
}

function SectionLink({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="staff-shell__section-link"
      data-active={active ? "true" : "false"}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function InterruptionModule({
  module,
  active,
  onSelect,
}: {
  module: StaffHomeModule;
  active: boolean;
  onSelect: (moduleId: string) => void;
}) {
  return (
    <button
      type="button"
      className={classNames("staff-shell__module", active && "staff-shell__module--active")}
      data-tone={module.tone}
      onClick={() => onSelect(module.id)}
    >
      <div className="staff-shell__module-head">
        <span>{module.title}</span>
        <strong>{module.summary}</strong>
      </div>
      <p>{module.detail}</p>
    </button>
  );
}

function SupportStub() {
  return (
    <section className="staff-shell__support-stub" data-testid="support-handoff-stub">
      <span className="staff-shell__eyebrow">Bounded support stub</span>
      <h3>Support remains a separate shell family</h3>
      <p>
        This placeholder keeps the clinical workspace in control while naming the future support
        handoff boundary honestly.
      </p>
      <ul>
        <li>Read-only launch summary only</li>
        <li>No hidden second support shell under `shellType = staff`</li>
        <li>Return target stays the current workspace queue row</li>
      </ul>
    </section>
  );
}

export function WorkspaceNavRail({
  route,
  activeQueueKey,
  runtimeScenario,
  selectedAnchorId,
  onNavigate,
}: {
  route: StaffShellRoute;
  activeQueueKey: string;
  runtimeScenario: StaffShellLedger["runtimeScenario"];
  selectedAnchorId: string;
  onNavigate: (nextRoute: StaffShellRoute) => void;
}) {
  return (
    <aside
      className="staff-shell__nav-rail"
      aria-label="Workspace navigation"
      data-testid="WorkspaceNavRail"
      {...buildWorkspaceSurfaceAttributes({
        surface: "workspace_navigation",
        surfaceState: route.kind,
        focusModel: "tab_ring",
        selectedAnchorRef: selectedAnchorId,
        runtimeScenario,
      })}
    >
      <div className="staff-shell__nav-rail-head">
        <span className="staff-shell__eyebrow">WorkspaceNavRail</span>
        <strong>Quiet clinical mission control</strong>
        <p>One shell family for queue scanning, active review, and bounded child-route work.</p>
      </div>

      <nav className="staff-shell__nav-groups" aria-label="Clinical workspace sections">
        <SectionLink
          active={route.kind === "home"}
          label="Home"
          onClick={() => onNavigate(parseStaffPath("/workspace"))}
        />
        <SectionLink
          active={
            route.kind === "queue" ||
            route.kind === "task" ||
            route.kind === "more-info" ||
            route.kind === "decision"
          }
          label="Queue"
          onClick={() => onNavigate(parseStaffPath(`/workspace/queue/${activeQueueKey}`))}
        />
        <SectionLink
          active={route.kind === "validation"}
          label="Validation"
          onClick={() => onNavigate(parseStaffPath("/workspace/validation"))}
        />
        <SectionLink
          active={route.kind === "callbacks"}
          label="Callbacks"
          onClick={() => onNavigate(parseStaffPath("/workspace/callbacks"))}
        />
        <SectionLink
          active={route.kind === "consequences"}
          label="Consequences"
          onClick={() => onNavigate(parseStaffPath("/workspace/consequences"))}
        />
        <SectionLink
          active={route.kind === "messages"}
          label="Messages"
          onClick={() => onNavigate(parseStaffPath("/workspace/messages"))}
        />
        <SectionLink
          active={route.kind === "approvals"}
          label="Approvals"
          onClick={() => onNavigate(parseStaffPath("/workspace/approvals"))}
        />
        <SectionLink
          active={route.kind === "escalations"}
          label="Escalations"
          onClick={() => onNavigate(parseStaffPath("/workspace/escalations"))}
        />
        <SectionLink
          active={route.kind === "changed"}
          label="Changed"
          onClick={() => onNavigate(parseStaffPath("/workspace/changed"))}
        />
        <SectionLink
          active={route.kind === "bookings"}
          label="Bookings"
          onClick={() => onNavigate(parseStaffPath("/workspace/bookings"))}
        />
        <SectionLink
          active={route.kind === "search"}
          label="Search"
          onClick={() => onNavigate(parseStaffPath("/workspace/search"))}
        />
      </nav>

      <section className="staff-shell__rail-queues" aria-label="Queue shortcuts">
        <span className="staff-shell__eyebrow">Saved views</span>
        <div className="staff-shell__queue-picker staff-shell__queue-picker--rail">
          {staffQueues.map((queue) => (
            <button
              type="button"
              className="staff-shell__queue-link"
              data-active={activeQueueKey === queue.key ? "true" : "false"}
              key={queue.key}
              onClick={() => onNavigate(parseStaffPath(`/workspace/queue/${queue.key}`))}
            >
              {queue.label}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

export function WorkspaceHeaderBand({
  route,
  authority,
  workspaceShellContinuityKey,
  entityContinuityKey,
  selectedAnchorId,
  restoreStorageKey,
  runtimeScenario,
  onRuntimeScenarioChange,
  onOpenCommandPalette,
}: {
  route: StaffShellRoute;
  authority: StaffRouteAuthorityArtifacts;
  workspaceShellContinuityKey: string;
  entityContinuityKey: string;
  selectedAnchorId: string;
  restoreStorageKey: string;
  runtimeScenario: StaffShellLedger["runtimeScenario"];
  onRuntimeScenarioChange: (scenario: StaffShellLedger["runtimeScenario"]) => void;
  onOpenCommandPalette: () => void;
}) {
  return (
    <header className="staff-shell__masthead" data-testid="WorkspaceHeaderBand">
      <div className="staff-shell__brand">
        <StaffInsignia />
        <div>
          <span className="staff-shell__eyebrow">WorkspaceHeaderBand</span>
          <h1 id="workspace-shell-heading">Staff workspace route family</h1>
          <p>
            Home, queue, task, and child-route review stay inside one same-shell staff workbench
            with typed continuity and trust posture.
          </p>
        </div>
      </div>

      <div className="staff-shell__header-summary">
        <div className="staff-shell__meta">
          <span>{route.title}</span>
          <span>{authority.manifest.frontendContractManifestId}</span>
          <span>{authority.guardDecision.effectivePosture.replaceAll("_", " ")}</span>
        </div>
        <div className="staff-shell__continuity-grid">
          <div>
            <strong>workspaceShellContinuityKey</strong>
            <span>{workspaceShellContinuityKey}</span>
          </div>
          <div>
            <strong>entityContinuityKey</strong>
            <span>{entityContinuityKey}</span>
          </div>
          <div>
            <strong>Selected anchor</strong>
            <span>{selectedAnchorId}</span>
          </div>
          <div>
            <strong>Restore epoch</strong>
            <span>{restoreStorageKey}</span>
          </div>
        </div>
        <label className="staff-shell__header-select">
          <span>Route posture</span>
          <select
            data-testid="runtime-scenario-select"
            value={runtimeScenario}
            onChange={(event) =>
              onRuntimeScenarioChange(
                event.currentTarget.value as StaffShellLedger["runtimeScenario"],
              )
            }
          >
            <option value="live">Live</option>
            <option value="stale_review">Stale review</option>
            <option value="read_only">Read-only</option>
            <option value="recovery_only">Recovery only</option>
            <option value="blocked">Blocked</option>
          </select>
        </label>
        <button
          type="button"
          className="staff-shell__command-palette-trigger"
          data-testid="WorkspaceCommandPaletteTrigger"
          aria-haspopup="dialog"
          onClick={onOpenCommandPalette}
        >
          <span>Jump</span>
          <strong>Ctrl+K</strong>
        </button>
      </div>
    </header>
  );
}

export function WorkspaceStatusStrip({
  pulse,
  statusInput,
  dominantActionLabel,
  anchorPosture,
  designContractState,
}: {
  pulse: any;
  statusInput: any;
  dominantActionLabel: string;
  anchorPosture: string;
  designContractState: string;
}) {
  return (
    <section className="staff-shell__status-band" data-testid="WorkspaceStatusStrip">
      <div className="staff-shell__pulse-band">
        <CasePulse pulse={pulse} />
      </div>
      <SharedStatusStrip input={statusInput} />
      <div className="staff-shell__status-meta">
        <span>
          <strong>Dominant action</strong>
          {dominantActionLabel}
        </span>
        <span>
          <strong>Anchor posture</strong>
          {anchorPosture}
        </span>
        <span>
          <strong>Design contract state</strong>
          {designContractState}
        </span>
      </div>
    </section>
  );
}

export function WorkspaceHome({
  homeModule,
  activeHomeModuleId,
  onModuleSelect,
  onOpenRecommendedTask,
}: {
  homeModule: StaffHomeModule;
  activeHomeModuleId: string;
  onModuleSelect: (moduleId: string) => void;
  onOpenRecommendedTask: () => void;
}) {
  return (
    <div className="staff-shell__home" data-testid="WorkspaceHomeContent">
      <section className="staff-shell__hero" data-testid="today-workbench-hero">
        <span className="staff-shell__eyebrow">TodayWorkbenchHero</span>
        <h2>Resume the returned-evidence queue before anything else</h2>
        <p>
          The recommended queue stays expanded because decisive deltas and callback drift need
          bounded review before settlement can resume.
        </p>
        <button
          type="button"
          className="staff-shell__inline-action"
          onClick={onOpenRecommendedTask}
        >
          Open Task 311 in the same shell
        </button>
      </section>

      <section className="staff-shell__home-modules">
        {staffHomeModules.map((module) => (
          <InterruptionModule
            key={module.id}
            module={module}
            active={module.id === activeHomeModuleId}
            onSelect={onModuleSelect}
          />
        ))}
      </section>

      <section className="staff-shell__home-detail">
        <span className="staff-shell__eyebrow">{homeModule.title}</span>
        <strong>{homeModule.summary}</strong>
        <p>{homeModule.detail}</p>
      </section>
    </div>
  );
}

export function WorkspaceShell({
  children,
  breakpoint,
  layoutMode,
  route,
  designMode,
  runtimeScenario,
  boundaryState,
  reducedMotion,
  manifestValidation,
  workspaceShellContinuityKey,
  entityContinuityKey,
  designContractState,
  dominantActionLabel,
  anchorPosture,
  selectedAnchorId,
  restoreStorageKey,
  surfaceAttributes,
  visualMode,
  accessibilityCoverageHash,
  accessibilityCoverageState,
  assistiveAnnouncement,
  keyboardModelDescription,
  keyboardRegionOrder,
}: {
  children: ReactNode;
  breakpoint: "compact" | "narrow" | "medium" | "wide";
  layoutMode: "two_plane" | "three_plane" | "mission_stack";
  route: StaffShellRoute;
  designMode: string;
  runtimeScenario: StaffShellLedger["runtimeScenario"];
  boundaryState: string;
  reducedMotion: boolean;
  manifestValidation: string;
  workspaceShellContinuityKey: string;
  entityContinuityKey: string;
  designContractState: string;
  dominantActionLabel: string;
  anchorPosture: string;
  selectedAnchorId: string;
  restoreStorageKey: string;
  surfaceAttributes: Record<string, string>;
  visualMode: string;
  accessibilityCoverageHash: string;
  accessibilityCoverageState: string;
  assistiveAnnouncement: {
    channel: "polite" | "assertive" | "off";
    announcementClass:
      | "surface_summary"
      | "routine_status"
      | "authoritative_settlement"
      | "blocker"
      | "recovery"
      | "freshness_actionability";
    message: string;
    stateHash: string;
  };
  keyboardModelDescription: string;
  keyboardRegionOrder: string;
}) {
  return (
    <main
      className="staff-shell"
      aria-labelledby="workspace-shell-heading"
      aria-describedby="workspace-shell-keyboard-model"
      data-breakpoint-class={breakpoint}
      data-layout-mode={layoutMode}
      data-route-kind={route.kind}
      data-runtime-scenario={runtimeScenario}
      data-boundary-state={boundaryState}
      data-motion-profile={reducedMotion ? "reduced" : "standard"}
      data-manifest-validation={manifestValidation}
      data-testid="WorkspaceShellRouteFamily"
      data-shell-type="staff"
      data-route-family={route.routeFamilyRef}
      data-workspace-shell-continuity-key={workspaceShellContinuityKey}
      data-entity-continuity-key={entityContinuityKey}
      data-design-contract-state={designContractState}
      data-dominant-action={dominantActionLabel}
      data-anchor-posture={anchorPosture}
      data-selected-anchor-ref={selectedAnchorId}
      data-restore-storage-key={restoreStorageKey}
      data-design-mode={designMode}
      data-visual-mode={visualMode}
      data-semantic-coverage-hash={accessibilityCoverageHash}
      data-semantic-coverage-state={accessibilityCoverageState}
      data-keyboard-region-order={keyboardRegionOrder}
      data-task-id={WORKSPACE_ROUTE_FAMILY_TASK_ID}
      {...surfaceAttributes}
    >
      <p id="workspace-shell-keyboard-model" className="sr-only">
        {keyboardModelDescription}
      </p>
      <WorkspaceSkipLinks routeKind={route.kind} />
      <WorkspaceAnnouncementHub
        message={assistiveAnnouncement.message}
        channel={assistiveAnnouncement.channel}
        announcementClass={assistiveAnnouncement.announcementClass}
        stateHash={assistiveAnnouncement.stateHash}
      />
      {children}
    </main>
  );
}

export function WorkspaceRouteFamilyController() {
  const initialRouteRef = useRef(initialRoute());
  const persistedLedger = readPersistedLedger();
  const restorePeerSelection =
    Boolean(persistedLedger) &&
    isPeerSelectionRoute(initialRouteRef.current.kind) &&
    persistedLedger?.path === initialRouteRef.current.path &&
    taskBelongsToRoute(initialRouteRef.current.kind, persistedLedger!.selectedTaskId);
  const [route, setRoute] = useState(initialRouteRef.current);
  const [runtimeScenario, setRuntimeScenario] = useState<StaffShellLedger["runtimeScenario"]>(
    runtimeScenarioFromSearch() ?? persistedLedger?.runtimeScenario ?? "live",
  );
  const [ledger, setLedger] = useState<StaffShellLedger>(() => {
    const routeSeed = createInitialLedger(initialRouteRef.current, runtimeScenario);
    if (!persistedLedger) {
      return routeSeed;
    }
    return {
      ...persistedLedger,
      path: initialRouteRef.current.path,
      queueKey: initialRouteRef.current.queueKey ?? persistedLedger.queueKey,
      selectedTaskId: restorePeerSelection
        ? persistedLedger.selectedTaskId
        : (initialRouteRef.current.taskId ?? persistedLedger.selectedTaskId),
      previewTaskId: restorePeerSelection
        ? persistedLedger.previewTaskId
        : (initialRouteRef.current.taskId ?? persistedLedger.previewTaskId),
      selectedAnchorId: restorePeerSelection
        ? persistedLedger.selectedAnchorId
        : (initialRouteRef.current.taskId &&
            initialRouteRef.current.taskId === persistedLedger.selectedTaskId &&
            persistedLedger.selectedAnchorId) ||
          (initialRouteRef.current.queueKey &&
            initialRouteRef.current.queueKey === persistedLedger.queueKey &&
            persistedLedger.selectedAnchorId) ||
          defaultAnchorForRoute(initialRouteRef.current),
      searchQuery: initialRouteRef.current.searchQuery,
      callbackStage:
        initialRouteRef.current.kind === "callbacks" ? persistedLedger.callbackStage : "detail",
      messageStage:
        initialRouteRef.current.kind === "messages" ? persistedLedger.messageStage : "detail",
      queuedBatchPending: routeSeed.queuedBatchPending,
      bufferedUpdateCount: routeSeed.bufferedUpdateCount,
      bufferedQueueTrayState: routeSeed.bufferedQueueTrayState,
    };
  });
  const [viewportWidth, setViewportWidth] = useState(safeWindow()?.innerWidth ?? 1440);
  const [previewPinned, setPreviewPinned] = useState(false);
  const [previewTaskId, setPreviewTaskId] = useState(ledger.previewTaskId);
  const [activeHomeModuleId, setActiveHomeModuleId] = useState(staffHomeModules[0]?.id ?? "");
  const [decisionSelection, setDecisionSelection] = useState(
    defaultDecisionOption(requireCase(ledger.selectedTaskId)),
  );
  const [rapidEntryDraft, setRapidEntryDraft] = useState<RapidEntryDraftInput>(() =>
    createInitialRapidEntryDraft(requireCase(ledger.selectedTaskId)),
  );
  const [attachmentAndThreadSelection, setAttachmentAndThreadSelection] = useState(() =>
    createInitialAttachmentAndThreadSelection(requireCase(ledger.selectedTaskId)),
  );
  const [telemetryLog, setTelemetryLog] = useState<readonly UiTelemetryEnvelopeExample[]>([]);
  const [boundaryState, setBoundaryState] = useState("reuse_shell");
  const [restoreStorageKey, setRestoreStorageKey] = useState(
    "persistent-shell::clinical-workspace",
  );
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => {
    const ownerWindow = safeWindow();
    return ownerWindow?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  });
  const rapidEntryAutosaveTimer = useRef<number | null>(null);
  const lastRouteEventKeyRef = useRef("");
  const lastRecoveryEventKeyRef = useRef("");

  const searchDraft = route.kind === "search" ? route.searchQuery : "";
  const deferredSearch = useDeferredValue(searchDraft);
  const visibleRows = deriveVisibleQueueRows(route, {
    ...ledger,
    searchQuery: deferredSearch || ledger.searchQuery,
  });
  const activeTask = selectedTaskForRoute(route, ledger.selectedTaskId);
  const authority = createStaffRouteAuthority(route, runtimeScenario);
  const automationProfile = staffAutomationProfile(route.routeFamilyRef);
  const surfaceAttributes = buildAutomationSurfaceAttributes(automationProfile, {
    selectedAnchorRef: ledger.selectedAnchorId,
    focusRestoreRef: `focus_restore.${route.routeFamilyRef}.${ledger.selectedAnchorId}`,
    dominantActionRef: `marker.${route.routeFamilyRef}.dominant_action`,
    recoveryPosture:
      authority.guardDecision.effectivePosture === "live"
        ? "live"
        : authority.guardDecision.effectivePosture,
    visualizationAuthority:
      authority.guardDecision.effectivePosture === "blocked"
        ? "summary_only"
        : authority.guardDecision.effectivePosture === "recovery_only"
          ? "table_only"
          : "visual_table_summary",
    artifactModeState: route.kind === "task" ? "digest_cards" : "summary_only",
    routeShellPosture:
      authority.guardDecision.effectivePosture === "live"
        ? "shell_live"
        : `shell_${authority.guardDecision.effectivePosture}`,
  });
  const postureContract = buildSurfacePosture(route, authority, {
    queueRows: visibleRows,
    selectedAnchorId: ledger.selectedAnchorId,
    searchQuery: deferredSearch,
  });
  const { statusInput, pulse } = buildWorkspaceStatus(route, runtimeScenario, activeTask);
  const workspaceShellContinuityKey = `workspace::role.clinical_reviewer::channel.browser::${authority.manifest.frontendContractManifestId}`;
  const entityContinuityKey = route.taskId
    ? `staff_task::${activeTask.id}::${activeTask.patientRef}`
    : `staff_workspace_scope::${route.kind}::${ledger.queueKey}`;
  const designContractState = `${authority.verdict.validationState}:${authority.manifest.designContractLintState}`;
  const dominantActionLabel = statusInput.dominantActionLabel;
  const anchorPosture = anchorPostureForRoute(route);
  const isActiveTaskRoute =
    route.kind === "task" || route.kind === "more-info" || route.kind === "decision";
  const assistiveRailState = isActiveTaskRoute
    ? AssistiveRailStateAdapter({
        route,
        runtimeScenario,
        selectedAnchorRef: ledger.selectedAnchorId,
        taskRef: activeTask.id,
        patientLabel: activeTask.patientLabel,
      })
    : null;
  const assistiveStageState = isActiveTaskRoute
    ? AssistiveWorkspaceStageStateAdapter({
        route,
        runtimeScenario,
        selectedAnchorRef: ledger.selectedAnchorId,
        taskRef: activeTask.id,
        patientLabel: activeTask.patientLabel,
        queueKey: ledger.queueKey,
      })
    : null;
  const promotedAssistiveStageState =
    assistiveStageState && assistiveStageState.stageMode !== "summary_stub"
      ? assistiveStageState
      : null;
  const assistiveQueueAssuranceState = buildAssistiveQueueAndAssuranceMergeState({
    task: activeTask,
    routeKind: route.kind,
    runtimeScenario,
    selectedAnchorRef: ledger.selectedAnchorId,
    queueKey: ledger.queueKey,
  });
  const taskProjection = isActiveTaskRoute
    ? buildTaskWorkspaceProjection({
        route,
        task: activeTask,
        authority,
        runtimeScenario,
        statusInput,
        pulse,
        selectedDecision: decisionSelection,
        selectedAnchorRef: ledger.selectedAnchorId,
        rapidEntryDraft,
        attachmentAndThreadSelection,
      })
    : null;
  const focusContinuity = buildWorkspaceFocusContinuityProjection({
    route,
    task: activeTask,
    taskProjection,
    ledger: {
      ...ledger,
      runtimeScenario,
    },
  });
  const accessibilityBundle = buildWorkspaceAccessibilityContractBundle({
    route,
    breakpoint: breakpointLabel(viewportWidth),
    layoutMode: layoutModeForWidth(viewportWidth, route),
    runtimeScenario,
    selectedAnchorRef: ledger.selectedAnchorId,
    dominantActionLabel,
    bufferedUpdateActive: Boolean(focusContinuity.bufferedQueueTray),
  });
  const assistiveAnnouncement = buildWorkspaceAnnouncementPlan({
    route,
    runtimeScenario,
    selectedAnchorRef: ledger.selectedAnchorId,
    dominantActionLabel,
    focusContinuity,
    rowCountLabel:
      route.kind === "queue" || route.kind === "search"
        ? `${visibleRows.length} workboard rows available`
        : route.kind === "task" || route.kind === "more-info" || route.kind === "decision"
          ? "Active task review in progress"
          : `${visibleRows.length} governed route items available`,
  });

  const emitTelemetry = useEffectEvent(
    (
      eventClass: Parameters<typeof buildTelemetryEnvelope>[0]["eventClass"],
      payload: Record<string, string>,
    ) => {
      const next = buildTelemetryEnvelope({
        route,
        eventClass,
        selectedAnchorRef: ledger.selectedAnchorId,
        dominantActionRef: `marker.${route.routeFamilyRef}.dominant_action`,
        recoveryPosture: authority.guardDecision.effectivePosture,
        visualizationAuthority:
          authority.guardDecision.effectivePosture === "blocked"
            ? "summary_only"
            : authority.guardDecision.effectivePosture === "recovery_only"
              ? "table_only"
              : "visual_table_summary",
        payload,
      });
      setTelemetryLog((current) => [...current.slice(-5), next]);
    },
  );

  const emitValidationEvent = useEffectEvent(
    (
      actionFamily: ValidationActionFamily,
      override?: Partial<{
        eventClass:
          | "shell"
          | "continuity"
          | "transition"
          | "projection"
          | "queue"
          | "anchor"
          | "side_stage"
          | "live"
          | "announcement"
          | "motion"
          | "review"
          | "recovery";
        routeIntentRef: string;
        surfaceRef: string;
        selectedAnchorRef: string;
        routeFamilyRef: ValidationRouteFamilyRef;
        routePath: string;
        canonicalObjectDescriptorRef: string;
        eventState: "provisional" | "authoritative" | "buffered" | "resolved" | "failed";
        interactionMode: "pointer" | "keyboard" | "system";
        publicationPosture: "live" | "projection_visible" | "recovery_only" | "blocked";
        recoveryPosture:
          | "none"
          | "stale_recoverable"
          | "read_only_fallback"
          | "recovery_required"
          | "blocked";
      }>,
    ) => {
      const settlement = validationSettlementProfile(runtimeScenario);
      recordWorkspaceSupportUiEvent({
        routeFamilyRef: override?.routeFamilyRef ?? route.routeFamilyRef,
        routePath: override?.routePath ?? route.path,
        routeIntentRef: override?.routeIntentRef ?? `workspace.${route.kind}`,
        canonicalObjectDescriptorRef: override?.canonicalObjectDescriptorRef ?? route.title,
        canonicalEntitySeed: `${activeTask.id}:${activeTask.patientRef}`,
        shellInstanceRef: WORKSPACE_ROUTE_FAMILY_TASK_ID,
        continuityKey: workspaceShellContinuityKey,
        selectedAnchorRef: override?.selectedAnchorRef ?? ledger.selectedAnchorId,
        surfaceRef: override?.surfaceRef ?? routeTestId(route.kind),
        audienceTier: "staff",
        channelContextRef: "browser.clinical_workspace",
        actionFamily,
        eventClass:
          override?.eventClass ??
          (route.kind === "queue" ? "queue" : route.kind === "task" ? "review" : "transition"),
        eventState: override?.eventState ?? validationEventState(runtimeScenario),
        publicationPosture:
          override?.publicationPosture ?? validationPublicationPosture(runtimeScenario),
        recoveryPosture: override?.recoveryPosture ?? validationRecoveryPosture(runtimeScenario),
        shellDecisionClass:
          runtimeScenario === "blocked"
            ? "frozen"
            : boundaryState === "reuse_shell"
              ? "reused"
              : boundaryState === "restore_shell"
                ? "restored"
                : "recovered",
        semanticCoverageRef:
          accessibilityBundle.accessibilitySemanticCoverageProfile
            .accessibilitySemanticCoverageProfileId,
        releaseTupleRef: authority.manifest.runtimePublicationBundleRef,
        evidenceLinkPath:
          actionFamily === "stale_recovery"
            ? "/Users/test/Code/V/output/playwright/269-workspace-support-event-chains-stale.png"
            : actionFamily === "claim" || actionFamily === "start_review"
              ? "/Users/test/Code/V/output/playwright/269-workspace-support-event-chains-workspace.png"
              : "/Users/test/Code/V/output/playwright/269-validation-board-live.png",
        interactionMode: override?.interactionMode ?? "system",
        ...settlement,
      });
    },
  );

  const queueRapidEntryAutosave = useEffectEvent((draftPatch?: Partial<RapidEntryDraftInput>) => {
    if (rapidEntryAutosaveTimer.current !== null) {
      window.clearTimeout(rapidEntryAutosaveTimer.current);
    }
    setRapidEntryDraft((current) => ({
      ...current,
      ...draftPatch,
      autosaveState: "saving",
      lastLocalChangeAt: "2026-04-17T08:31:00Z",
    }));
    rapidEntryAutosaveTimer.current = window.setTimeout(() => {
      setRapidEntryDraft((current) => ({
        ...current,
        autosaveState: "saved",
      }));
    }, 220);
  });

  const pushLedgerState = useEffectEvent(
    (
      reducer: (current: StaffShellLedger) => StaffShellLedger,
      options?: { replace?: boolean; nextRoute?: StaffShellRoute },
    ) => {
      const ownerWindow = safeWindow();
      startTransition(() => {
        setLedger((current) => {
          const next = reducer(current);
          if (ownerWindow) {
            ownerWindow.history[options?.replace ? "replaceState" : "pushState"](
              historyStateFromLedger(next),
              "",
              buildBrowserRouteUrl((options?.nextRoute ?? route).path, ownerWindow.location.search),
            );
            dispatchRouteChange();
          }
          return next;
        });
      });
    },
  );

  const navigateTo = useEffectEvent((nextRoute: StaffShellRoute, replace = false) => {
    startTransition(() => {
      const reduction = reduceLedgerForNavigation({
        ledger,
        currentRoute: route,
        nextRoute,
        runtimeScenario,
      });
      setLedger((current) => ({
        ...reduction.ledger,
        queuedBatchPending: current.queuedBatchPending,
        bufferedUpdateCount: current.queuedBatchPending
          ? Math.max(current.bufferedUpdateCount, 1)
          : nextRoute.kind === "more-info" || nextRoute.kind === "decision"
            ? current.bufferedUpdateCount
            : 0,
        bufferedQueueTrayState: current.queuedBatchPending
          ? reduction.ledger.bufferedQueueTrayState
          : "collapsed",
      }));
      setRoute(nextRoute);
      setBoundaryState(reduction.boundaryState);
      setRestoreStorageKey(reduction.restoreStorageKey);
      setDecisionSelection(defaultDecisionOption(requireCase(reduction.ledger.selectedTaskId)));
      const ownerWindow = safeWindow();
      if (ownerWindow) {
        ownerWindow.history[replace ? "replaceState" : "pushState"](
          historyStateFromLedger(reduction.ledger),
          "",
          buildBrowserRouteUrl(nextRoute.path, ownerWindow.location.search),
        );
        dispatchRouteChange();
      }
      emitTelemetry("surface_enter", {
        path: nextRoute.path,
        routeFamilyRef: nextRoute.routeFamilyRef,
        boundaryState: reduction.boundaryState,
      });
    });
  });

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    if (ownerWindow.location.pathname === "/") {
      ownerWindow.history.replaceState(
        historyStateFromLedger(ledger),
        "",
        buildBrowserRouteUrl(route.path, ownerWindow.location.search),
      );
    }
    const handleResize = () => setViewportWidth(ownerWindow.innerWidth);
    const motionQuery = ownerWindow.matchMedia?.("(prefers-reduced-motion: reduce)");
    const handlePopState = (event: PopStateEvent) => {
      const nextRoute = parseStaffPath(ownerWindow.location.pathname, ownerWindow.location.search);
      const nextRuntimeScenario = runtimeScenarioFromSearch();
      const historyState = (event.state ?? {}) as Partial<
        Pick<
          StaffShellLedger,
          "selectedTaskId" | "previewTaskId" | "selectedAnchorId" | "callbackStage" | "messageStage"
        >
      >;
      const routeSelectionAvailable =
        isPeerSelectionRoute(nextRoute.kind) &&
        typeof historyState.selectedTaskId === "string" &&
        taskBelongsToRoute(nextRoute.kind, historyState.selectedTaskId);
      startTransition(() => {
        setRoute(nextRoute);
        if (nextRuntimeScenario) {
          setRuntimeScenario(nextRuntimeScenario);
        }
        setLedger((current) => ({
          ...current,
          path: nextRoute.path,
          queueKey: nextRoute.queueKey ?? current.queueKey,
          selectedTaskId: routeSelectionAvailable
            ? historyState.selectedTaskId!
            : isPeerSelectionRoute(nextRoute.kind) &&
                taskBelongsToRoute(nextRoute.kind, current.selectedTaskId)
              ? current.selectedTaskId
              : (nextRoute.taskId ?? current.selectedTaskId),
          previewTaskId:
            routeSelectionAvailable && typeof historyState.previewTaskId === "string"
              ? historyState.previewTaskId
              : isPeerSelectionRoute(nextRoute.kind) &&
                  taskBelongsToRoute(nextRoute.kind, current.previewTaskId)
                ? current.previewTaskId
                : (nextRoute.taskId ?? current.previewTaskId),
          selectedAnchorId:
            routeSelectionAvailable && typeof historyState.selectedAnchorId === "string"
              ? historyState.selectedAnchorId
              : isPeerSelectionRoute(nextRoute.kind) &&
                  taskBelongsToRoute(nextRoute.kind, current.selectedTaskId)
                ? current.selectedAnchorId
                : defaultAnchorForRoute(nextRoute),
          searchQuery: nextRoute.searchQuery,
          callbackStage:
            nextRoute.kind === "callbacks" && typeof historyState.callbackStage === "string"
              ? historyState.callbackStage
              : nextRoute.kind === "callbacks" && current.path === nextRoute.path
                ? current.callbackStage
                : "detail",
          messageStage:
            nextRoute.kind === "messages" && typeof historyState.messageStage === "string"
              ? historyState.messageStage
              : nextRoute.kind === "messages" && current.path === nextRoute.path
                ? current.messageStage
                : "detail",
        }));
      });
    };
    const handleMotionChange = () => setReducedMotion(motionQuery?.matches ?? false);
    const handleCommandPaletteShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen((current) => !current);
      }
    };
    handleResize();
    handleMotionChange();
    ownerWindow.addEventListener("resize", handleResize);
    ownerWindow.addEventListener("popstate", handlePopState);
    ownerWindow.addEventListener("keydown", handleCommandPaletteShortcut);
    motionQuery?.addEventListener?.("change", handleMotionChange);
    return () => {
      ownerWindow.removeEventListener("resize", handleResize);
      ownerWindow.removeEventListener("popstate", handlePopState);
      ownerWindow.removeEventListener("keydown", handleCommandPaletteShortcut);
      motionQuery?.removeEventListener?.("change", handleMotionChange);
    };
  }, [route.path]);

  useEffect(() => {
    writePersistedLedger({ ...ledger, runtimeScenario });
  }, [ledger, runtimeScenario]);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    ownerWindow.history.replaceState(
      historyStateFromLedger(ledger),
      "",
      buildBrowserRouteUrl(route.path, ownerWindow.location.search),
    );
  }, [
    ledger.callbackStage,
    ledger.messageStage,
    ledger.previewTaskId,
    ledger.selectedAnchorId,
    ledger.selectedTaskId,
    route.path,
  ]);

  useEffect(() => {
    setRapidEntryDraft(createInitialRapidEntryDraft(activeTask));
  }, [activeTask.id]);

  useEffect(() => {
    setAttachmentAndThreadSelection(createInitialAttachmentAndThreadSelection(activeTask));
  }, [activeTask.id]);

  useEffect(() => {
    return () => {
      if (rapidEntryAutosaveTimer.current !== null) {
        window.clearTimeout(rapidEntryAutosaveTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (route.kind === "search") {
      const ownerWindow = safeWindow();
      if (ownerWindow && route.searchQuery) {
        const nextRouteUrl = buildBrowserRouteUrl(
          buildStaffPath(route),
          ownerWindow.location.search,
        );
        const currentRouteUrl = `${ownerWindow.location.pathname}${ownerWindow.location.search}`;
        if (currentRouteUrl !== nextRouteUrl) {
          ownerWindow.history.replaceState(historyStateFromLedger(ledger), "", nextRouteUrl);
          dispatchRouteChange();
        }
      }
    }
  }, [ledger, route]);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    const targetId = resolveRouteFocusEntryId(route.kind);
    if (!targetId) {
      return;
    }
    const frame = ownerWindow.requestAnimationFrame(() => {
      const target = ownerWindow.document.getElementById(targetId);
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.contains(ownerWindow.document.activeElement)) {
        return;
      }
      target.focus({ preventScroll: false });
    });
    return () => ownerWindow.cancelAnimationFrame(frame);
  }, [route.path, route.kind]);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    const regionOrder = resolveWorkspaceFocusOrder(route.kind);
    const focusRegion = (targetId: string) => {
      const target = ownerWindow.document.getElementById(targetId);
      if (!(target instanceof HTMLElement)) {
        return;
      }
      target.focus({ preventScroll: false });
      target.scrollIntoView({ block: "nearest", inline: "nearest" });
    };
    const handleRegionCycling = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable === true;
      if (!event.altKey || !event.shiftKey || isTypingTarget) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        const activeElement = ownerWindow.document.activeElement as HTMLElement | null;
        const currentIndex = regionOrder.findIndex(
          (regionId) =>
            activeElement?.id === regionId || Boolean(activeElement?.closest?.(`#${regionId}`)),
        );
        const offset = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex =
          currentIndex === -1
            ? 0
            : (currentIndex + offset + regionOrder.length) % regionOrder.length;
        const nextRegion = regionOrder[nextIndex];
        if (!nextRegion) {
          return;
        }
        event.preventDefault();
        focusRegion(nextRegion);
        return;
      }
      if (event.key === "1" || event.key === "2" || event.key === "3" || event.key === "4") {
        const nextRegion = regionOrder[Number(event.key) - 1];
        if (!nextRegion) {
          return;
        }
        event.preventDefault();
        focusRegion(nextRegion);
      }
    };
    ownerWindow.addEventListener("keydown", handleRegionCycling);
    return () => ownerWindow.removeEventListener("keydown", handleRegionCycling);
  }, [route.kind]);

  useEffect(() => {
    if (!telemetryLog.length) {
      emitTelemetry("surface_enter", {
        path: route.path,
        routeFamilyRef: route.routeFamilyRef,
        startup: "true",
      });
    }
  }, [emitTelemetry, route.path, route.routeFamilyRef, telemetryLog.length]);

  useEffect(() => {
    const actionFamily = actionFamilyForRoute(route);
    if (!actionFamily) {
      return;
    }
    const routeEventKey = [
      route.path,
      route.kind,
      actionFamily,
      runtimeScenario,
      ledger.selectedAnchorId,
      activeTask.id,
    ].join(":");
    if (lastRouteEventKeyRef.current === routeEventKey) {
      return;
    }
    emitValidationEvent(actionFamily, {
      routeIntentRef: `workspace.${route.kind}.entered`,
      surfaceRef: routeTestId(route.kind),
      eventClass:
        route.kind === "queue"
          ? "queue"
          : route.kind === "task"
            ? "review"
            : route.kind === "callbacks" || route.kind === "messages"
              ? "live"
              : "transition",
    });
    lastRouteEventKeyRef.current = routeEventKey;
  }, [activeTask.id, emitValidationEvent, ledger.selectedAnchorId, route, runtimeScenario]);

  useEffect(() => {
    if (runtimeScenario === "live") {
      return;
    }
    const recoveryEventKey = [
      route.path,
      runtimeScenario,
      ledger.selectedAnchorId,
      activeTask.id,
    ].join(":");
    if (lastRecoveryEventKeyRef.current === recoveryEventKey) {
      return;
    }
    emitValidationEvent("stale_recovery", {
      routeIntentRef: `workspace.${route.kind}.recovery`,
      eventClass: "recovery",
    });
    lastRecoveryEventKeyRef.current = recoveryEventKey;
  }, [
    activeTask.id,
    emitValidationEvent,
    ledger.selectedAnchorId,
    route.kind,
    route.path,
    runtimeScenario,
  ]);

  const layoutMode = layoutModeForWidth(viewportWidth, route);
  const breakpoint = breakpointLabel(viewportWidth);
  const homeModule =
    staffHomeModules.find((module) => module.id === activeHomeModuleId) ?? staffHomeModules[0]!;
  const isPeerWorkbenchRoute =
    route.kind === "validation" ||
    route.kind === "consequences" ||
    route.kind === "callbacks" ||
    route.kind === "messages" ||
    route.kind === "approvals" ||
    route.kind === "escalations" ||
    route.kind === "changed" ||
    route.kind === "bookings";
  const sourceTaskRoute = parseStaffPath(buildStaffPath({ kind: "task", taskId: activeTask.id }));
  const sourceTaskStatus = buildWorkspaceStatus(sourceTaskRoute, runtimeScenario, activeTask);
  const sourceTaskProjection = isPeerWorkbenchRoute
    ? buildTaskWorkspaceProjection({
        route: sourceTaskRoute,
        task: activeTask,
        authority: createStaffRouteAuthority(sourceTaskRoute, runtimeScenario),
        runtimeScenario,
        statusInput: sourceTaskStatus.statusInput,
        pulse: sourceTaskStatus.pulse,
        selectedDecision: decisionSelection,
        selectedAnchorRef: ledger.selectedAnchorId,
        rapidEntryDraft,
        attachmentAndThreadSelection,
      })
    : null;
  const approvalProjection =
    route.kind === "approvals" && sourceTaskProjection
      ? buildApprovalInboxRouteProjection({
          task: activeTask,
          rows: visibleRows,
          runtimeScenario,
          sourceTaskProjection,
        })
      : null;
  const escalationProjection =
    route.kind === "escalations" && sourceTaskProjection
      ? buildEscalationRouteProjection({
          task: activeTask,
          rows: visibleRows,
          runtimeScenario,
          sourceTaskProjection,
        })
      : null;
  const changedProjection =
    route.kind === "changed" && sourceTaskProjection
      ? buildChangedWorkRouteProjection({
          task: activeTask,
          rows: visibleRows,
          runtimeScenario,
          sourceTaskProjection,
        })
      : null;
  const selfCareAdminProjection =
    route.kind === "consequences"
      ? buildSelfCareAdminViewsRouteProjection({
          runtimeScenario,
          selectedTaskId: ledger.selectedTaskId,
        })
      : null;
  const callbackProjection =
    route.kind === "callbacks"
      ? buildCallbackWorkbenchProjection({
          runtimeScenario,
          selectedTaskId: ledger.selectedTaskId,
          selectedAnchorRef: ledger.selectedAnchorId,
          selectedStage: ledger.callbackStage,
        })
      : null;
  const messageProjection =
    route.kind === "messages"
      ? buildClinicianMessageWorkbenchProjection({
          runtimeScenario,
          selectedTaskId: ledger.selectedTaskId,
          selectedAnchorRef: ledger.selectedAnchorId,
          selectedStage: ledger.messageStage,
        })
      : null;

  const openTask = (taskId: string, anchorRef = `queue-row-${taskId}`) => {
    const nextRoute = parseStaffPath(buildStaffPath({ kind: "task", taskId }));
    emitValidationEvent("claim", {
      routeIntentRef: "workspace.queue.claim",
      eventClass: route.kind === "queue" ? "queue" : "transition",
      selectedAnchorRef: anchorRef,
      interactionMode: "pointer",
      routeFamilyRef: nextRoute.routeFamilyRef,
      routePath: nextRoute.path,
      canonicalObjectDescriptorRef: nextRoute.title,
      surfaceRef: routeTestId(nextRoute.kind),
    });
    setLedger((current) => ({
      ...current,
      selectedTaskId: taskId,
      previewTaskId: taskId,
      selectedAnchorId: anchorRef,
    }));
    navigateTo(nextRoute);
  };

  const openPeerRouteTask = (
    routeKind: "callbacks" | "consequences",
    taskId: string,
    anchorRef: string,
  ) => {
    const nextRoute = parseStaffPath(buildStaffPath({ kind: routeKind }));
    const callbackStage =
      routeKind === "callbacks"
        ? anchorRef.startsWith("callback-repair-")
          ? "repair"
          : anchorRef.startsWith("callback-attempt-") ||
              anchorRef.startsWith("callback-attempt-live-")
            ? "outcome"
            : "detail"
        : ledger.callbackStage;
    const seededLedger = {
      ...ledger,
      selectedTaskId: taskId,
      previewTaskId: taskId,
      selectedAnchorId: anchorRef,
      callbackStage,
    };
    const reduction = reduceLedgerForNavigation({
      ledger: seededLedger,
      currentRoute: route,
      nextRoute,
      runtimeScenario,
    });
    const nextLedger = {
      ...reduction.ledger,
      selectedTaskId: taskId,
      previewTaskId: taskId,
      selectedAnchorId: anchorRef,
      callbackStage,
      queuedBatchPending: ledger.queuedBatchPending,
      bufferedUpdateCount: ledger.queuedBatchPending ? Math.max(ledger.bufferedUpdateCount, 1) : 0,
      bufferedQueueTrayState: ledger.queuedBatchPending
        ? reduction.ledger.bufferedQueueTrayState
        : "collapsed",
    };

    emitValidationEvent(routeKind === "callbacks" ? "callback_action" : "self_care_action", {
      routeIntentRef: `workspace.queue.launch.${routeKind}`,
      eventClass: "transition",
      selectedAnchorRef: anchorRef,
      interactionMode: "pointer",
      routeFamilyRef: nextRoute.routeFamilyRef,
      routePath: nextRoute.path,
      canonicalObjectDescriptorRef: nextRoute.title,
      surfaceRef: routeTestId(nextRoute.kind),
    });

    startTransition(() => {
      setLedger(nextLedger);
      setRoute(nextRoute);
      setBoundaryState(reduction.boundaryState);
      setRestoreStorageKey(reduction.restoreStorageKey);
      setDecisionSelection(defaultDecisionOption(requireCase(taskId)));
      const ownerWindow = safeWindow();
      if (ownerWindow) {
        ownerWindow.history.pushState(
          historyStateFromLedger(nextLedger),
          "",
          buildBrowserRouteUrl(nextRoute.path, ownerWindow.location.search),
        );
        dispatchRouteChange();
      }
      emitTelemetry("surface_enter", {
        path: nextRoute.path,
        routeFamilyRef: nextRoute.routeFamilyRef,
        boundaryState: reduction.boundaryState,
      });
    });
  };

  const selectControlRoomTask = (taskId: string, anchorRef: string) => {
    emitValidationEvent(route.kind === "escalations" ? "escalate" : "approve", {
      routeIntentRef: `workspace.${route.kind}.select_task`,
      selectedAnchorRef: anchorRef,
      interactionMode: "pointer",
    });
    setLedger((current) => ({
      ...current,
      selectedTaskId: taskId,
      previewTaskId: taskId,
      selectedAnchorId: anchorRef,
    }));
    setDecisionSelection(defaultDecisionOption(requireCase(taskId)));
  };

  const selectCallbackTask = (taskId: string, anchorRef: string) => {
    emitValidationEvent("callback_action", {
      routeIntentRef: "workspace.callbacks.select_case",
      selectedAnchorRef: anchorRef,
      interactionMode: "pointer",
    });
    pushLedgerState((current) => ({
      ...current,
      selectedTaskId: taskId,
      previewTaskId: taskId,
      selectedAnchorId: anchorRef,
      callbackStage: "detail",
    }));
  };

  const selectConsequenceTask = (taskId: string, anchorRef: string) => {
    emitValidationEvent("self_care_action", {
      routeIntentRef: "workspace.consequences.select_case",
      selectedAnchorRef: anchorRef,
      interactionMode: "pointer",
    });
    pushLedgerState((current) => ({
      ...current,
      selectedTaskId: taskId,
      previewTaskId: taskId,
      selectedAnchorId: anchorRef,
    }));
  };

  const selectMessageTask = (taskId: string, anchorRef: string) => {
    emitValidationEvent("message_action", {
      routeIntentRef: "workspace.messages.select_thread",
      selectedAnchorRef: anchorRef,
      interactionMode: "pointer",
    });
    pushLedgerState((current) => ({
      ...current,
      selectedTaskId: taskId,
      previewTaskId: taskId,
      selectedAnchorId: anchorRef,
      messageStage: "detail",
    }));
  };

  const selectCallbackAttempt = (anchorRef: string) => {
    emitValidationEvent("callback_action", {
      routeIntentRef: "workspace.callbacks.select_attempt",
      selectedAnchorRef: anchorRef,
      interactionMode: "pointer",
    });
    pushLedgerState((current) => ({
      ...current,
      selectedAnchorId: anchorRef,
      callbackStage: current.callbackStage === "repair" ? "repair" : "outcome",
    }));
  };

  const selectMessageEvent = (anchorRef: string) => {
    emitValidationEvent("message_action", {
      routeIntentRef: "workspace.messages.select_event",
      selectedAnchorRef: anchorRef,
      interactionMode: "pointer",
    });
    pushLedgerState((current) => ({
      ...current,
      selectedAnchorId: anchorRef,
    }));
  };

  const selectCallbackStage = (stage: StaffShellLedger["callbackStage"]) => {
    emitValidationEvent("callback_action", {
      routeIntentRef: `workspace.callbacks.stage.${stage}`,
      eventClass: "side_stage",
      interactionMode: "pointer",
    });
    pushLedgerState((current) => ({
      ...current,
      callbackStage: stage,
      selectedAnchorId:
        stage === "detail"
          ? `callback-detail-${current.selectedTaskId}`
          : stage === "repair"
            ? current.selectedAnchorId.startsWith("callback-attempt-") ||
              current.selectedAnchorId.startsWith("callback-attempt-live-")
              ? current.selectedAnchorId
              : `callback-repair-${current.selectedTaskId}`
            : current.selectedAnchorId.startsWith("callback-attempt-") ||
                current.selectedAnchorId.startsWith("callback-attempt-live-")
              ? current.selectedAnchorId
              : `callback-outcome-${current.selectedTaskId}`,
    }));
  };

  const selectMessageStage = (stage: ClinicianMessageStage) => {
    emitValidationEvent("message_action", {
      routeIntentRef: `workspace.messages.stage.${stage}`,
      eventClass: "side_stage",
      interactionMode: "pointer",
    });
    pushLedgerState((current) => ({
      ...current,
      messageStage: stage,
      selectedAnchorId:
        current.selectedAnchorId.startsWith("message-event-") ||
        current.selectedAnchorId.startsWith("message-detail-")
          ? current.selectedAnchorId
          : `message-detail-${current.selectedTaskId}`,
    }));
  };

  const launchNextTask = () => {
    emitValidationEvent("close", {
      routeIntentRef: "workspace.task.launch_next",
      eventClass: "transition",
      interactionMode: "pointer",
    });
    const ordered = applyQueueChangeBatch(listQueueCases(activeTask.launchQueue), activeTask.id);
    const nextTask = ordered.find((item) => item.id !== activeTask.id) ?? ordered[0];
    if (nextTask) {
      openTask(nextTask.id);
    }
  };

  return (
    <WorkspaceShell
      breakpoint={breakpoint}
      layoutMode={layoutMode}
      route={route}
      designMode={designModeForRoute(route)}
      runtimeScenario={runtimeScenario}
      boundaryState={boundaryState}
      reducedMotion={reducedMotion}
      manifestValidation={authority.verdict.validationState}
      workspaceShellContinuityKey={workspaceShellContinuityKey}
      entityContinuityKey={entityContinuityKey}
      designContractState={designContractState}
      dominantActionLabel={dominantActionLabel}
      anchorPosture={anchorPosture}
      selectedAnchorId={ledger.selectedAnchorId}
      restoreStorageKey={restoreStorageKey}
      surfaceAttributes={{
        ...surfaceAttributes,
        ...buildWorkspaceSurfaceAttributes({
          surface: "workspace_shell",
          surfaceState: route.kind,
          focusModel: "tab_ring",
          selectedAnchorRef: ledger.selectedAnchorId,
          runtimeScenario,
        }),
      }}
      visualMode={WORKSPACE_ACCESSIBILITY_VISUAL_MODE}
      accessibilityCoverageHash={
        accessibilityBundle.accessibilitySemanticCoverageProfile.coverageTupleHash
      }
      accessibilityCoverageState={
        accessibilityBundle.accessibilitySemanticCoverageProfile.coverageState
      }
      assistiveAnnouncement={assistiveAnnouncement}
      keyboardModelDescription={resolveWorkspaceKeyboardModelDescription(route.kind)}
      keyboardRegionOrder={resolveWorkspaceFocusOrder(route.kind).join(" -> ")}
    >
      <div
        data-testid="staff-shell-root"
        data-route-kind={route.kind}
        data-runtime-scenario={runtimeScenario}
        data-layout-mode={layoutMode}
        data-motion-profile={reducedMotion ? "reduced" : "standard"}
        data-automation-surface={surfaceAttributes["data-automation-surface"]}
      >
        <WorkspaceCommandPalette
          open={commandPaletteOpen}
          activeQueueKey={ledger.queueKey}
          activeTaskId={ledger.selectedTaskId}
          currentRouteKind={route.kind}
          onClose={() => setCommandPaletteOpen(false)}
          onSelectRoute={(nextRoute) => navigateTo(nextRoute)}
        />
        <WorkspaceHeaderBand
          route={route}
          authority={authority}
          workspaceShellContinuityKey={workspaceShellContinuityKey}
          entityContinuityKey={entityContinuityKey}
          selectedAnchorId={ledger.selectedAnchorId}
          restoreStorageKey={restoreStorageKey}
          runtimeScenario={runtimeScenario}
          onRuntimeScenarioChange={(nextScenario) => {
            setRuntimeScenario(nextScenario);
            emitTelemetry("recovery_posture_changed", {
              path: route.path,
              runtimeScenario: nextScenario,
            });
          }}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        {!isActiveTaskRoute && (
          <WorkspaceStatusStrip
            pulse={pulse}
            statusInput={statusInput}
            dominantActionLabel={dominantActionLabel}
            anchorPosture={anchorPosture}
            designContractState={designContractState}
          />
        )}

        <div
          className={classNames(
            "staff-shell__layout",
            isPeerWorkbenchRoute && "staff-shell__layout--control-room",
            assistiveRailState && !assistiveStageState && "staff-shell__layout--assistive",
            promotedAssistiveStageState && "staff-shell__layout--assistive-stage",
          )}
          data-testid="staff-shell-layout"
        >
          <WorkspaceNavRail
            route={route}
            activeQueueKey={ledger.queueKey}
            runtimeScenario={runtimeScenario}
            selectedAnchorId={ledger.selectedAnchorId}
            onNavigate={navigateTo}
          />
          {!isPeerWorkbenchRoute && (
            <QueueScanManager
              route={route}
              ledger={ledger}
              focusContinuity={focusContinuity}
              runtimeScenario={runtimeScenario}
              previewTaskId={previewTaskId}
              previewPinned={previewPinned}
              onPreviewTaskChange={setPreviewTaskId}
              onPreviewPinnedChange={setPreviewPinned}
              onLedgerChange={(updater) => setLedger((current) => updater(current))}
              onNavigate={navigateTo}
              onOpenTask={openTask}
              onOpenPeerRouteTask={openPeerRouteTask}
            />
          )}
          <section
            className={classNames(
              "staff-shell__main-pane",
              isActiveTaskRoute && "staff-shell__main-pane--task-plane",
              isPeerWorkbenchRoute && "staff-shell__main-pane--control-room",
            )}
            data-testid={routeTestId(route.kind)}
            data-visual-mode={
              route.kind === "validation" ? CLINICAL_BETA_VALIDATION_VISUAL_MODE : undefined
            }
            data-feature-flag={
              route.kind === "validation" ? CLINICAL_BETA_VALIDATION_FEATURE_FLAG : undefined
            }
            id={!isActiveTaskRoute ? WORKSPACE_FOCUS_TARGET_IDS.peerRoute : undefined}
            tabIndex={!isActiveTaskRoute ? -1 : undefined}
            {...(!isActiveTaskRoute
              ? buildWorkspaceSurfaceAttributes({
                  surface: "peer_route",
                  surfaceState: route.kind,
                  focusModel: "tab_ring",
                  selectedAnchorRef: ledger.selectedAnchorId,
                  runtimeScenario,
                })
              : {})}
          >
            {route.kind === "home" && (
              <WorkspaceHome
                homeModule={homeModule}
                activeHomeModuleId={activeHomeModuleId}
                onModuleSelect={setActiveHomeModuleId}
                onOpenRecommendedTask={() => openTask("task-311")}
              />
            )}

            {(route.kind === "queue" || route.kind === "search") && postureContract && (
              <div className="staff-shell__posture-stage" data-testid="queue-posture-stage">
                <SurfaceStateFrame contract={postureContract} />
              </div>
            )}

            {isActiveTaskRoute && (
              <>
                {postureContract && (
                  <section className="staff-shell__inline-posture" data-testid="inline-posture">
                    <strong>{postureContract.title}</strong>
                    <span>{postureContract.summary}</span>
                  </section>
                )}
                <AssistiveQueueOpenToStageBridge state={assistiveQueueAssuranceState} />
                {taskProjection && (
                  <ActiveTaskShell
                    projection={taskProjection}
                    focusContinuity={focusContinuity}
                    route={route}
                    runtimeScenario={runtimeScenario}
                    selectedDecision={decisionSelection}
                    onDecisionChange={(value) => {
                      setDecisionSelection(value);
                      emitTelemetry("dominant_action_changed", {
                        path: route.path,
                        decision: value,
                      });
                    }}
                    onOpenTask={() =>
                      navigateTo(
                        parseStaffPath(buildStaffPath({ kind: "task", taskId: activeTask.id })),
                      )
                    }
                    onOpenMoreInfo={() =>
                      navigateTo(
                        parseStaffPath(
                          buildStaffPath({ kind: "more-info", taskId: activeTask.id }),
                        ),
                      )
                    }
                    onOpenDecision={() =>
                      navigateTo(
                        parseStaffPath(buildStaffPath({ kind: "decision", taskId: activeTask.id })),
                      )
                    }
                    onLaunchNext={launchNextTask}
                    onBufferedQueueApply={() =>
                      setLedger((current) => ({
                        ...current,
                        queuedBatchPending: false,
                        bufferedUpdateCount: 0,
                        bufferedQueueTrayState: "collapsed",
                      }))
                    }
                    onBufferedQueueToggleReview={() =>
                      setLedger((current) => ({
                        ...current,
                        bufferedQueueTrayState:
                          current.bufferedQueueTrayState === "expanded" ? "collapsed" : "expanded",
                      }))
                    }
                    onBufferedQueueDefer={() =>
                      setLedger((current) => ({
                        ...current,
                        bufferedQueueTrayState: "deferred",
                      }))
                    }
                    onOpenSupportStub={() =>
                      navigateTo(parseStaffPath("/workspace/support-handoff"))
                    }
                    onReasonSelect={(value) =>
                      queueRapidEntryAutosave({ selectedReasonChip: value })
                    }
                    onQuestionSetSelect={(value) =>
                      queueRapidEntryAutosave({ selectedQuestionSet: value })
                    }
                    onMacroSelect={(value) => queueRapidEntryAutosave({ selectedMacro: value })}
                    onDuePickSelect={(value) => queueRapidEntryAutosave({ selectedDuePick: value })}
                    onNoteChange={(value) => queueRapidEntryAutosave({ note: value })}
                    onOpenArtifact={(artifactId: string) =>
                      setAttachmentAndThreadSelection((current) => ({
                        ...current,
                        selectedArtifactId: artifactId,
                      }))
                    }
                    onCloseArtifact={() =>
                      setAttachmentAndThreadSelection((current) => ({
                        ...current,
                        selectedArtifactId: null,
                      }))
                    }
                    onSelectThreadEvent={(eventId: string) =>
                      setAttachmentAndThreadSelection((current) => ({
                        ...current,
                        selectedThreadEventId: eventId,
                      }))
                    }
                    onResetThreadSelection={() =>
                      setAttachmentAndThreadSelection((current) => ({
                        ...current,
                        selectedThreadEventId:
                          createInitialAttachmentAndThreadSelection(activeTask)
                            .selectedThreadEventId,
                      }))
                    }
                    onSelectAnchor={(anchorRef) =>
                      setLedger((current) => ({
                        ...current,
                        selectedAnchorId: anchorRef,
                      }))
                    }
                  />
                )}
                {assistiveStageState && assistiveStageState.stageMode === "summary_stub" && (
                  <AssistiveWorkspaceStageHost state={assistiveStageState} />
                )}
                <section className="staff-shell__telemetry-card" data-testid="telemetry-log">
                  <span className="staff-shell__eyebrow">UI telemetry envelopes</span>
                  <ol>
                    {telemetryLog.map((entry, index) => (
                      <li key={`${entry.envelopeId}:${index}`}>
                        <strong>{entry.eventClass}</strong>
                        <span>{entry.payloadDigestRef}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              </>
            )}

            {route.kind === "approvals" && approvalProjection && (
              <ApprovalInboxRoute
                projection={approvalProjection}
                onSelectTask={selectControlRoomTask}
                onOpenTask={openTask}
              />
            )}

            {route.kind === "validation" && (
              <WorkspaceValidationRoute runtimeScenario={runtimeScenario} />
            )}

            {route.kind === "callbacks" && callbackProjection && (
              <CallbackWorklistRoute
                projection={callbackProjection}
                focusContinuity={focusContinuity}
                selectedAnchorRef={ledger.selectedAnchorId}
                onSelectCase={selectCallbackTask}
                onSelectAttempt={selectCallbackAttempt}
                onSelectStage={selectCallbackStage}
                onOpenTask={(taskId) => openTask(taskId, `callback-detail-${taskId}`)}
                onBufferedQueueApply={() =>
                  setLedger((current) => ({
                    ...current,
                    queuedBatchPending: false,
                    bufferedUpdateCount: 0,
                    bufferedQueueTrayState: "collapsed",
                  }))
                }
                onBufferedQueueToggleReview={() =>
                  setLedger((current) => ({
                    ...current,
                    bufferedQueueTrayState:
                      current.bufferedQueueTrayState === "expanded" ? "collapsed" : "expanded",
                  }))
                }
                onBufferedQueueDefer={() =>
                  setLedger((current) => ({
                    ...current,
                    bufferedQueueTrayState: "deferred",
                  }))
                }
              />
            )}

            {route.kind === "consequences" && selfCareAdminProjection && (
              <SelfCareAdminViewsRoute
                projection={selfCareAdminProjection}
                onSelectCase={selectConsequenceTask}
                onOpenTask={(taskId) => openTask(taskId, `consequence-detail-${taskId}`)}
              />
            )}

            {route.kind === "messages" && messageProjection && (
              <ClinicianMessageThreadSurface
                projection={messageProjection}
                focusContinuity={focusContinuity}
                onSelectThread={selectMessageTask}
                onSelectEvent={selectMessageEvent}
                onSelectStage={selectMessageStage}
                onOpenTask={(taskId) => openTask(taskId, `message-detail-${taskId}`)}
                onBufferedQueueApply={() =>
                  setLedger((current) => ({
                    ...current,
                    queuedBatchPending: false,
                    bufferedUpdateCount: 0,
                    bufferedQueueTrayState: "collapsed",
                  }))
                }
                onBufferedQueueToggleReview={() =>
                  setLedger((current) => ({
                    ...current,
                    bufferedQueueTrayState:
                      current.bufferedQueueTrayState === "expanded" ? "collapsed" : "expanded",
                  }))
                }
                onBufferedQueueDefer={() =>
                  setLedger((current) => ({
                    ...current,
                    bufferedQueueTrayState: "deferred",
                  }))
                }
              />
            )}

            {route.kind === "escalations" && escalationProjection && (
              <EscalationWorkspaceRoute
                projection={escalationProjection}
                onSelectTask={selectControlRoomTask}
                onOpenTask={openTask}
              />
            )}

            {route.kind === "changed" && changedProjection && (
              <ChangedWorkRoute
                projection={changedProjection}
                routeKind={route.kind}
                onSelectTask={selectControlRoomTask}
                onOpenTask={openTask}
                onSelectAnchor={(anchorRef) =>
                  setLedger((current) => ({
                    ...current,
                    selectedAnchorId: anchorRef,
                  }))
                }
              />
            )}

            {route.kind === "bookings" && (
              <StaffBookingHandoffPanel
                bookingCaseId={route.bookingCaseId}
                runtimeScenario={runtimeScenario}
                focusContinuity={focusContinuity}
                onOpenCase={(bookingCaseId) =>
                  navigateTo(parseStaffPath(buildStaffPath({ kind: "bookings", bookingCaseId })))
                }
                onBufferedQueueApply={() =>
                  setLedger((current) => ({
                    ...current,
                    queuedBatchPending: false,
                    bufferedUpdateCount: 0,
                    bufferedQueueTrayState: "collapsed",
                  }))
                }
                onBufferedQueueToggleReview={() =>
                  setLedger((current) => ({
                    ...current,
                    bufferedQueueTrayState:
                      current.bufferedQueueTrayState === "expanded" ? "collapsed" : "expanded",
                  }))
                }
                onBufferedQueueDefer={() =>
                  setLedger((current) => ({
                    ...current,
                    bufferedQueueTrayState: "deferred",
                  }))
                }
                onLaunchNext={launchNextTask}
              />
            )}

            {route.kind === "search" && !postureContract && (
              <section className="staff-shell__peer-route" data-testid="search-route">
                <header>
                  <span className="staff-shell__eyebrow">Search</span>
                  <h2>Exact-match and filtered search stays inside the staff shell</h2>
                </header>
                <label className="staff-shell__search-field">
                  <span>Search request, patient, or route</span>
                  <input
                    value={ledger.searchQuery}
                    onChange={(event) => {
                      const nextSearchQuery = event.currentTarget.value;
                      setLedger((current) => ({
                        ...current,
                        searchQuery: nextSearchQuery,
                      }));
                    }}
                  />
                </label>
                <div className="staff-shell__peer-grid">
                  {listSearchCases(ledger.searchQuery).map((task) => (
                    <article key={task.id} className="staff-shell__peer-card">
                      <strong>{task.patientLabel}</strong>
                      <p>{task.primaryReason}</p>
                      <button
                        type="button"
                        className="staff-shell__inline-action"
                        onClick={() =>
                          navigateTo(
                            parseStaffPath(buildStaffPath({ kind: "task", taskId: task.id })),
                          )
                        }
                      >
                        Open exact-match result
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {route.kind === "support-handoff" && <SupportStub />}
          </section>

          {promotedAssistiveStageState && (
            <AssistiveWorkspaceStageHost state={promotedAssistiveStageState} />
          )}

          {assistiveStageState
            ? null
            : assistiveRailState && <AssistiveRailShell state={assistiveRailState} />}

          {!isActiveTaskRoute && (
            <aside className="staff-shell__dock-pane">
              <section className="staff-shell__authority-card" data-testid="route-authority-card">
                <span className="staff-shell__eyebrow">Route authority</span>
                <strong>{authority.guardDecision.effectivePosture.replaceAll("_", " ")}</strong>
                <p>
                  Manifest validation: {authority.verdict.validationState}. Safe to consume:{" "}
                  {String(authority.verdict.safeToConsume)}.
                </p>
                <p>
                  Digest drift: {authority.verdict.driftState}. Runtime bundle:{" "}
                  {authority.manifest.runtimePublicationBundleRef}.
                </p>
              </section>

              <AssistiveQueueAndAssuranceMergeAdapter state={assistiveQueueAssuranceState} />

              <section className="staff-shell__telemetry-card" data-testid="telemetry-log">
                <span className="staff-shell__eyebrow">UI telemetry envelopes</span>
                <ol>
                  {telemetryLog.map((entry, index) => (
                    <li key={`${entry.envelopeId}:${index}`}>
                      <strong>{entry.eventClass}</strong>
                      <span>{entry.payloadDigestRef}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </aside>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}

export const StaffShellSeedApp = WorkspaceRouteFamilyController;
