import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  buildAutomationAnchorElementAttributes,
  buildAutomationSurfaceAttributes,
  createUiTelemetryEnvelope,
  type UiTelemetryEnvelopeExample,
} from "@vecells/persistent-shell";
import { CasePulse, SharedStatusStrip } from "@vecells/design-system";
import { SurfaceStateFrame } from "@vecells/surface-postures";
import {
  STAFF_STORAGE_KEY,
  STAFF_TELEMETRY_SCENARIO_ID,
  applyQueueChangeBatch,
  buildStaffPath,
  buildSurfacePosture,
  buildWorkspaceStatus,
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
  routeFamilyRefForKind,
  staffAutomationProfile,
  staffCases,
  staffHomeModules,
  staffQueues,
  type StaffHomeModule,
  type StaffQueueCase,
  type StaffRouteKind,
  type StaffShellLedger,
  type StaffShellRoute,
} from "./staff-shell-seed.data";

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
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
    return JSON.parse(payload) as StaffShellLedger;
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

function layoutModeForWidth(width: number, route: StaffShellRoute): "two_plane" | "three_plane" | "mission_stack" {
  if (width < 1120) {
    return "mission_stack";
  }
  return route.kind === "escalations" ? "three_plane" : "two_plane";
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

function routeLabel(kind: StaffRouteKind): string {
  switch (kind) {
    case "home":
      return "Home";
    case "queue":
      return "Queue";
    case "task":
      return "Task";
    case "more-info":
      return "More-info";
    case "decision":
      return "Decision";
    case "approvals":
      return "Approvals";
    case "escalations":
      return "Escalations";
    case "changed":
      return "Changed";
    case "search":
      return "Search";
    case "support-handoff":
      return "Support handoff";
  }
}

function workboardHeader(route: StaffShellRoute) {
  const queue = staffQueues.find((candidate) => candidate.key === route.queueKey);
  if (queue) {
    return {
      label: queue.label,
      description: queue.description,
    };
  }

  switch (route.kind) {
    case "approvals":
      return {
        label: "Approvals lane",
        description: "Consequence-aware approvals stay resident inside the same staff shell.",
      };
    case "escalations":
      return {
        label: "Escalation lane",
        description: "Urgent callback and blocker review remain low-noise and same-shell.",
      };
    case "search":
      return {
        label: "Search memory",
        description: "Exact-match and filtered search preserves the current shell return posture.",
      };
    case "support-handoff":
      return {
        label: "Support handoff boundary",
        description: "The bounded stub names the future support shell without transferring ownership.",
      };
    default:
      return {
        label: "Recommended queue",
        description: "Best next queue based on the current role, interruption weight, and active task continuity.",
      };
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
      recoveryPosture: input.recoveryPosture as
        | "live"
        | "read_only"
        | "recovery_only"
        | "blocked",
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

function QueueRow({
  task,
  isActive,
  isPreviewing,
  onHover,
  onPin,
  onOpen,
  onSelectAnchor,
}: {
  task: StaffQueueCase;
  isActive: boolean;
  isPreviewing: boolean;
  onHover: (taskId: string) => void;
  onPin: (taskId: string) => void;
  onOpen: (taskId: string) => void;
  onSelectAnchor: (taskId: string) => void;
}) {
  const anchorAttributes = buildAutomationAnchorElementAttributes({
    markerClass: "selected_anchor",
    markerRef: `marker.${task.id}.row_anchor`,
    domMarker: "selected-anchor",
    routeFamilyRef: routeFamilyRefForKind("queue"),
    shellSlug: "clinical-workspace",
    audienceSurface: "audsurf_clinical_workspace",
    disclosureFenceState: "safe",
    repeatedInstanceStrategy: "subordinate_instance_key",
    selector: `[data-task-id="${task.id}"]`,
    selectorAttribute: "data-task-id",
    selectorValue: task.id,
    supportingDomMarkers: ["data-task-id", "data-row-state"],
    supportingEventClasses: ["selected_anchor_changed"],
    contractState: "exact",
    gapResolutionRef: null,
    source_refs: ["prompt/116.md"],
  });

  return (
    <article
      className="staff-shell__queue-row"
      data-active={isActive ? "true" : "false"}
      data-previewing={isPreviewing ? "true" : "false"}
      role="option"
      aria-selected={isActive}
      onMouseEnter={() => onHover(task.id)}
    >
      <span className="staff-shell__signal-rail" data-tone={task.urgencyTone} />
      <button
        type="button"
        className="staff-shell__queue-row-main"
        data-row-state={task.state}
        data-task-id={task.id}
        onFocus={() => onHover(task.id)}
        onClick={() => {
          onSelectAnchor(task.id);
          onOpen(task.id);
        }}
        {...anchorAttributes}
      >
        <div className="staff-shell__queue-copy">
          <strong>{task.primaryReason}</strong>
          <span>{task.secondaryMeta}</span>
        </div>
      </button>
      <div className="staff-shell__queue-actions">
        <span>{task.dueLabel}</span>
        <button
          type="button"
          className="staff-shell__queue-pin"
          onClick={(event) => {
            event.stopPropagation();
            onPin(task.id);
          }}
        >
          {isPreviewing ? "Pinned preview" : "Pin preview"}
        </button>
      </div>
    </article>
  );
}

function QueuePreview({
  task,
  selectedAnchor,
  onOpen,
}: {
  task: StaffQueueCase | null;
  selectedAnchor: string;
  onOpen: (taskId: string) => void;
}) {
  if (!task) {
    return (
      <section className="staff-shell__preview">
        <span className="staff-shell__eyebrow">QueuePreviewDigest</span>
        <h3>Preview stays summary-first</h3>
        <p>Hover or focus a row for 80-120ms to open a lightweight, read-only queue preview.</p>
      </section>
    );
  }

  return (
    <section
      className="staff-shell__preview"
      data-testid="queue-preview-digest"
      data-selected-anchor={selectedAnchor}
    >
      <span className="staff-shell__eyebrow">QueuePreviewDigest</span>
      <h3>{task.patientLabel}</h3>
      <p>{task.previewSummary}</p>
      <dl className="staff-shell__preview-grid">
        <div>
          <dt>Trust</dt>
          <dd>{task.previewTrustNote}</dd>
        </div>
        <div>
          <dt>Due</dt>
          <dd>{task.dueLabel}</dd>
        </div>
        <div>
          <dt>Delta</dt>
          <dd>{task.deltaSummary}</dd>
        </div>
      </dl>
      <button type="button" className="staff-shell__inline-action" onClick={() => onOpen(task.id)}>
        Open task in the same shell
      </button>
    </section>
  );
}

function TaskCanvas({
  task,
  currentRoute,
  postureMode,
  selectedDecision,
}: {
  task: StaffQueueCase;
  currentRoute: StaffShellRoute;
  postureMode: "live" | "guarded" | "recovery";
  selectedDecision: string;
}) {
  return (
    <section className="staff-shell__task-canvas" data-testid="task-canvas-frame">
      <div className="staff-shell__canvas-stack">
        <article className="staff-shell__stack-card" data-testid="summary-stack">
          <header>
            <span className="staff-shell__eyebrow">SummaryStack</span>
            <h3>First meaningful read</h3>
          </header>
          <ul>
            {task.summaryPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>

        <article className="staff-shell__stack-card staff-shell__stack-card--delta" data-testid="delta-stack">
          <header>
            <span className="staff-shell__eyebrow">DeltaStack</span>
            <h3>{task.deltaClass.toUpperCase()} delta packet</h3>
          </header>
          <p>{task.deltaSummary}</p>
          <div className="staff-shell__superseded-strip" data-testid="superseded-context">
            {task.supersededContext.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </article>

        <article className="staff-shell__stack-card" data-testid="evidence-stack">
          <header>
            <span className="staff-shell__eyebrow">EvidenceStack</span>
            <h3>Structured evidence digest</h3>
          </header>
          <div className="staff-shell__evidence-grid">
            {task.evidence.map((item) => (
              <article key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.value}</span>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="staff-shell__stack-card" data-testid="consequence-stack">
          <header>
            <span className="staff-shell__eyebrow">ConsequenceStack</span>
            <h3>Consequence and handoff posture</h3>
          </header>
          <div className="staff-shell__consequence-list">
            {task.consequences.map((item) => (
              <article key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </article>

        <details className="staff-shell__stack-card staff-shell__stack-card--reference" data-testid="reference-stack">
          <summary>
            <span className="staff-shell__eyebrow">ReferenceStack</span>
            <strong>Collapsed by default</strong>
          </summary>
          <ul>
            {task.references.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      </div>

      <aside className="staff-shell__task-support">
        <section className="staff-shell__context-panel">
          <span className="staff-shell__eyebrow">Case continuity</span>
          <strong>{routeLabel(currentRoute.kind)}</strong>
          <p>
            Same-shell route family: {currentRoute.routeFamilyRef}. Current posture: {postureMode}.
          </p>
        </section>
        <section className="staff-shell__context-panel">
          <span className="staff-shell__eyebrow">Selected decision</span>
          <strong>{selectedDecision}</strong>
          <p>Decision preview stays quiet until the reviewer explicitly commits or promotes a child state.</p>
        </section>
      </aside>
    </section>
  );
}

function QuickCaptureTray({
  task,
  note,
  onNoteChange,
  selectedReason,
  onReasonChange,
  selectedDuePick,
  onDuePickChange,
}: {
  task: StaffQueueCase;
  note: string;
  onNoteChange: (value: string) => void;
  selectedReason: string;
  onReasonChange: (value: string) => void;
  selectedDuePick: string;
  onDuePickChange: (value: string) => void;
}) {
  return (
    <section className="staff-shell__quick-capture" data-testid="quick-capture-tray">
      <header>
        <span className="staff-shell__eyebrow">QuickCaptureTray</span>
        <strong>Rapid entry stays inside DecisionDock</strong>
      </header>
      <div className="staff-shell__capture-grid">
        <div>
          <span className="staff-shell__capture-label">Endpoints</span>
          <div className="staff-shell__chip-row">
            {task.quickCapture.endpoints.map((item) => (
              <button type="button" className="staff-shell__chip" key={item}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="staff-shell__capture-label">Question sets</span>
          <div className="staff-shell__chip-row">
            {task.quickCapture.questionSets.map((item) => (
              <button type="button" className="staff-shell__chip" key={item}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="staff-shell__capture-label">Reason chips</span>
          <div className="staff-shell__chip-row">
            {task.quickCapture.reasonChips.map((item) => (
              <button
                type="button"
                className="staff-shell__chip"
                data-active={selectedReason === item ? "true" : "false"}
                key={item}
                onClick={() => onReasonChange(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="staff-shell__capture-label">Macros</span>
          <div className="staff-shell__chip-row">
            {task.quickCapture.macros.map((item) => (
              <button type="button" className="staff-shell__chip" key={item}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="staff-shell__note-field">
          <label htmlFor="quick-capture-note">Inline note</label>
          <textarea
            id="quick-capture-note"
            value={note}
            onChange={(event) => onNoteChange(event.currentTarget.value)}
          />
        </div>
        <div>
          <span className="staff-shell__capture-label">Due-date quick picks</span>
          <div className="staff-shell__chip-row">
            {task.quickCapture.duePicks.map((item) => (
              <button
                type="button"
                className="staff-shell__chip"
                data-active={selectedDuePick === item ? "true" : "false"}
                key={item}
                onClick={() => onDuePickChange(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DecisionDock({
  task,
  route,
  selectedDecision,
  onDecisionChange,
  onOpenMoreInfo,
  onOpenDecision,
  onLaunchNext,
  onOpenSupportStub,
  note,
  onNoteChange,
  selectedReason,
  onReasonChange,
  selectedDuePick,
  onDuePickChange,
}: {
  task: StaffQueueCase;
  route: StaffShellRoute;
  selectedDecision: string;
  onDecisionChange: (value: string) => void;
  onOpenMoreInfo: () => void;
  onOpenDecision: () => void;
  onLaunchNext: () => void;
  onOpenSupportStub: () => void;
  note: string;
  onNoteChange: (value: string) => void;
  selectedReason: string;
  onReasonChange: (value: string) => void;
  selectedDuePick: string;
  onDuePickChange: (value: string) => void;
}) {
  const dominantActionAttributes = buildAutomationAnchorElementAttributes({
    markerClass: "dominant_action",
    markerRef: `marker.${route.routeFamilyRef}.dominant_action`,
    domMarker: "dominant-action",
    routeFamilyRef: route.routeFamilyRef,
    shellSlug: "clinical-workspace",
    audienceSurface: "audsurf_clinical_workspace",
    disclosureFenceState: "safe",
    repeatedInstanceStrategy: "shared_anchor_only",
    selector: `[data-testid="decision-dock"]`,
    selectorAttribute: "data-testid",
    selectorValue: "decision-dock",
    supportingDomMarkers: ["data-dominant-action", "data-route-state"],
    supportingEventClasses: ["dominant_action_changed"],
    contractState: "exact",
    gapResolutionRef: null,
    source_refs: ["prompt/116.md"],
  });

  return (
    <aside
      className="staff-shell__decision-dock"
      data-testid="decision-dock"
      data-route-state={route.kind}
      data-dominant-action={selectedDecision}
      {...dominantActionAttributes}
    >
      <header>
        <span className="staff-shell__eyebrow">DecisionDock</span>
        <h3>Quiet until the action is genuinely ready</h3>
        <p>{task.deltaSummary}</p>
      </header>

      <section className="staff-shell__decision-choice">
        <span className="staff-shell__capture-label">Decision preview</span>
        <div className="staff-shell__chip-row">
          {task.decisionOptions.map((option) => (
            <button
              type="button"
              className="staff-shell__chip"
              data-active={selectedDecision === option ? "true" : "false"}
              key={option}
              onClick={() => onDecisionChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <div className="staff-shell__dock-actions">
        <button type="button" className="staff-shell__dock-action" onClick={onOpenMoreInfo}>
          More-info child route
        </button>
        <button type="button" className="staff-shell__dock-action" onClick={onOpenDecision}>
          Decision child route
        </button>
        <button type="button" className="staff-shell__dock-action" onClick={onLaunchNext}>
          Launch next task
        </button>
        <button type="button" className="staff-shell__dock-action staff-shell__dock-action--ghost" onClick={onOpenSupportStub}>
          Open support handoff stub
        </button>
      </div>

      {(route.kind === "more-info" || route.kind === "decision") && (
        <QuickCaptureTray
          task={task}
          note={note}
          onNoteChange={onNoteChange}
          selectedReason={selectedReason}
          onReasonChange={onReasonChange}
          selectedDuePick={selectedDuePick}
          onDuePickChange={onDuePickChange}
        />
      )}
    </aside>
  );
}

function ProtectedCompositionRibbon({
  route,
  bufferedUpdateCount,
  runtimeScenario,
}: {
  route: StaffShellRoute;
  bufferedUpdateCount: number;
  runtimeScenario: StaffShellLedger["runtimeScenario"];
}) {
  if (route.kind !== "more-info" && route.kind !== "decision") {
    return null;
  }
  return (
    <section
      className="staff-shell__protection-ribbon"
      data-testid="protected-composition-ribbon"
      data-runtime={runtimeScenario}
    >
      <strong>
        {runtimeScenario === "recovery_only" || runtimeScenario === "blocked"
          ? "Protected composition is frozen in place"
          : "Protected composition is buffering disruptive updates"}
      </strong>
      <span>
        Buffered updates: {bufferedUpdateCount}. Quiet return target remains pinned to the current reading region.
      </span>
    </section>
  );
}

function SupportStub() {
  return (
    <section className="staff-shell__support-stub" data-testid="support-handoff-stub">
      <span className="staff-shell__eyebrow">Bounded support stub</span>
      <h3>Support remains a separate shell family</h3>
      <p>
        This placeholder keeps the clinical workspace in control while naming the future support handoff boundary honestly.
      </p>
      <ul>
        <li>Read-only launch summary only</li>
        <li>No hidden second support shell under `shellType = staff`</li>
        <li>Return target stays the current workspace queue row</li>
      </ul>
    </section>
  );
}

export function StaffShellSeedApp() {
  const initialRouteRef = useRef(initialRoute());
  const persistedLedger = readPersistedLedger();
  const [route, setRoute] = useState(initialRouteRef.current);
  const [runtimeScenario, setRuntimeScenario] = useState<StaffShellLedger["runtimeScenario"]>(
    persistedLedger?.runtimeScenario ?? "live",
  );
  const [ledger, setLedger] = useState<StaffShellLedger>(() =>
    persistedLedger
      ? { ...persistedLedger, path: initialRouteRef.current.path }
      : createInitialLedger(initialRouteRef.current, runtimeScenario),
  );
  const [viewportWidth, setViewportWidth] = useState(safeWindow()?.innerWidth ?? 1440);
  const [previewPinned, setPreviewPinned] = useState(false);
  const [previewTaskId, setPreviewTaskId] = useState(ledger.previewTaskId);
  const [activeHomeModuleId, setActiveHomeModuleId] = useState(staffHomeModules[0]?.id ?? "");
  const [decisionSelection, setDecisionSelection] = useState(defaultDecisionOption(requireCase(ledger.selectedTaskId)));
  const [draftNote, setDraftNote] = useState("Need confirmation on the callback note before commit.");
  const [selectedReason, setSelectedReason] = useState("Returned evidence");
  const [selectedDuePick, setSelectedDuePick] = useState("Today 14:30");
  const [telemetryLog, setTelemetryLog] = useState<readonly UiTelemetryEnvelopeExample[]>([]);
  const [boundaryState, setBoundaryState] = useState("reuse_shell");
  const [restoreStorageKey, setRestoreStorageKey] = useState("persistent-shell::clinical-workspace");
  const [reducedMotion, setReducedMotion] = useState(() => {
    const ownerWindow = safeWindow();
    return ownerWindow?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  });
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchDraft = route.kind === "search" ? route.searchQuery : "";
  const deferredSearch = useDeferredValue(searchDraft);
  const visibleRows = deriveVisibleQueueRows(route, {
    ...ledger,
    searchQuery: deferredSearch || ledger.searchQuery,
  });
  const activeTask = deriveTaskForRoute(route) ?? requireCase(ledger.selectedTaskId);
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

  const emitTelemetry = useEffectEvent(
    (eventClass: Parameters<typeof buildTelemetryEnvelope>[0]["eventClass"], payload: Record<string, string>) => {
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
        bufferedUpdateCount:
          nextRoute.kind === "more-info" || nextRoute.kind === "decision"
            ? current.bufferedUpdateCount
            : 1,
      }));
      setRoute(nextRoute);
      setBoundaryState(reduction.boundaryState);
      setRestoreStorageKey(reduction.restoreStorageKey);
      setDecisionSelection(defaultDecisionOption(deriveTaskForRoute(nextRoute) ?? activeTask));
      const ownerWindow = safeWindow();
      if (ownerWindow) {
        ownerWindow.history[replace ? "replaceState" : "pushState"]({}, "", nextRoute.path);
      }
      emitTelemetry("surface_enter", {
        path: nextRoute.path,
        routeFamilyRef: nextRoute.routeFamilyRef,
        boundaryState: reduction.boundaryState,
      });
    });
  });

  const schedulePreview = useEffectEvent((taskId: string) => {
    if (previewPinned && previewTaskId === taskId) {
      return;
    }
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
    }
    previewTimerRef.current = setTimeout(() => {
      startTransition(() => {
        setPreviewTaskId(taskId);
      });
    }, 100);
  });

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    if (ownerWindow.location.pathname === "/") {
      ownerWindow.history.replaceState({}, "", route.path);
    }
    const handleResize = () => setViewportWidth(ownerWindow.innerWidth);
    const motionQuery = ownerWindow.matchMedia?.("(prefers-reduced-motion: reduce)");
    const handlePopState = () => {
      const nextRoute = parseStaffPath(ownerWindow.location.pathname, ownerWindow.location.search);
      startTransition(() => {
        setRoute(nextRoute);
        setLedger((current) => ({
          ...current,
          path: nextRoute.path,
          queueKey: nextRoute.queueKey ?? current.queueKey,
          selectedTaskId: nextRoute.taskId ?? current.selectedTaskId,
          selectedAnchorId: defaultAnchorForRoute(nextRoute),
          searchQuery: nextRoute.searchQuery,
        }));
      });
    };
    const handleMotionChange = () => setReducedMotion(motionQuery?.matches ?? false);
    handleResize();
    handleMotionChange();
    ownerWindow.addEventListener("resize", handleResize);
    ownerWindow.addEventListener("popstate", handlePopState);
    motionQuery?.addEventListener?.("change", handleMotionChange);
    return () => {
      ownerWindow.removeEventListener("resize", handleResize);
      ownerWindow.removeEventListener("popstate", handlePopState);
      motionQuery?.removeEventListener?.("change", handleMotionChange);
    };
  }, [route.path]);

  useEffect(() => {
    writePersistedLedger({ ...ledger, runtimeScenario });
  }, [ledger, runtimeScenario]);

  useEffect(() => {
    if (route.kind === "search") {
      const ownerWindow = safeWindow();
      if (ownerWindow && ownerWindow.location.search !== `?q=${encodeURIComponent(route.searchQuery)}` && route.searchQuery) {
        ownerWindow.history.replaceState({}, "", buildStaffPath(route));
      }
    }
  }, [route]);

  useEffect(() => {
    if (!telemetryLog.length) {
      emitTelemetry("surface_enter", {
        path: route.path,
        routeFamilyRef: route.routeFamilyRef,
        startup: "true",
      });
    }
  }, [emitTelemetry, route.path, route.routeFamilyRef, telemetryLog.length]);

  const layoutMode = layoutModeForWidth(viewportWidth, route);
  const breakpoint = breakpointLabel(viewportWidth);
  const previewTask = staffCases.find((task) => task.id === previewTaskId) ?? null;
  const selectedQueue = workboardHeader(route);
  const homeModule = staffHomeModules.find((module) => module.id === activeHomeModuleId) ?? staffHomeModules[0];

  const openTask = (taskId: string) => {
    const nextRoute = parseStaffPath(buildStaffPath({ kind: "task", taskId }));
    setLedger((current) => ({
      ...current,
      selectedTaskId: taskId,
      previewTaskId: taskId,
      selectedAnchorId: `queue-row-${taskId}`,
    }));
    navigateTo(nextRoute);
  };

  const openSearch = () => {
    navigateTo(parseStaffPath(buildStaffPath({ kind: "search", searchQuery: ledger.searchQuery })));
  };

  const launchNextTask = () => {
    const ordered = applyQueueChangeBatch(listQueueCases(activeTask.launchQueue), activeTask.id);
    const nextTask = ordered.find((item) => item.id !== activeTask.id) ?? ordered[0];
    if (nextTask) {
      openTask(nextTask.id);
    }
  };

  const onQueueKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rows = visibleRows;
    if (!rows.length) {
      return;
    }
    const currentIndex = rows.findIndex((row) => row.id === ledger.selectedTaskId);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex =
        event.key === "ArrowDown"
          ? Math.min(currentIndex + 1, rows.length - 1)
          : Math.max(currentIndex - 1, 0);
      const nextRow = rows[nextIndex] ?? rows[0];
      if (!nextRow) {
        return;
      }
      startTransition(() => {
        setLedger((current) => ({
          ...current,
          selectedTaskId: nextRow.id,
          previewTaskId: nextRow.id,
          selectedAnchorId: `queue-row-${nextRow.id}`,
        }));
        setPreviewTaskId(nextRow.id);
      });
      emitTelemetry("selected_anchor_changed", {
        path: route.path,
        selectedTaskId: nextRow.id,
        keyboard: event.key,
      });
    }
    if (event.key === "Enter") {
      event.preventDefault();
      openTask(ledger.selectedTaskId);
    }
  };

  return (
    <main
      className="staff-shell"
      data-breakpoint-class={breakpoint}
      data-layout-mode={layoutMode}
      data-route-kind={route.kind}
      data-runtime-scenario={runtimeScenario}
      data-boundary-state={boundaryState}
      data-motion-profile={reducedMotion ? "reduced" : "standard"}
      data-manifest-validation={authority.verdict.validationState}
      data-testid="staff-shell-root"
      {...surfaceAttributes}
    >
      <header className="staff-shell__masthead">
        <div className="staff-shell__brand">
          <StaffInsignia />
          <div>
            <span className="staff-shell__eyebrow">Quiet Clinical Mission Control</span>
            <h1>Clinical workspace seed routes</h1>
            <p>Queue-first review, one current decision rail, and same-shell recovery under one continuity ledger.</p>
          </div>
        </div>
        <div className="staff-shell__meta">
          <span>Reviewer: Lee Moran</span>
          <span>{authority.manifest.frontendContractManifestId}</span>
          <span>{authority.guardDecision.effectivePosture.replaceAll("_", " ")}</span>
        </div>
      </header>

      <section className="staff-shell__pulse-band">
        <CasePulse pulse={pulse} />
      </section>

      <SharedStatusStrip input={statusInput} />

      <nav className="staff-shell__section-band" aria-label="Clinical workspace sections">
        <SectionLink active={route.kind === "home"} label="Home" onClick={() => navigateTo(parseStaffPath("/workspace"))} />
        <SectionLink
          active={route.kind === "queue" || route.kind === "task" || route.kind === "more-info" || route.kind === "decision"}
          label="Queue"
          onClick={() => navigateTo(parseStaffPath(`/workspace/queue/${ledger.queueKey}`))}
        />
        <SectionLink active={route.kind === "approvals"} label="Approvals" onClick={() => navigateTo(parseStaffPath("/workspace/approvals"))} />
        <SectionLink active={route.kind === "escalations"} label="Escalations" onClick={() => navigateTo(parseStaffPath("/workspace/escalations"))} />
        <SectionLink active={route.kind === "changed"} label="Changed" onClick={() => navigateTo(parseStaffPath("/workspace/changed"))} />
        <SectionLink active={route.kind === "search"} label="Search" onClick={openSearch} />
      </nav>

      <section className="staff-shell__utility-strip">
        <div className="staff-shell__utility-copy">
          <span className="staff-shell__eyebrow">WorkspaceNavigationLedger</span>
          <strong>{route.path}</strong>
          <p>Selected anchor: {ledger.selectedAnchorId}. Restore key: {restoreStorageKey}.</p>
        </div>
        <div className="staff-shell__utility-actions">
          <label>
            <span>Runtime posture</span>
            <select
              data-testid="runtime-scenario-select"
              value={runtimeScenario}
              onChange={(event) => {
                const nextScenario = event.currentTarget.value as StaffShellLedger["runtimeScenario"];
                setRuntimeScenario(nextScenario);
                emitTelemetry("recovery_posture_changed", {
                  path: route.path,
                  runtimeScenario: nextScenario,
                });
              }}
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
            className="staff-shell__utility-button"
            onClick={() =>
              setLedger((current) => ({
                ...current,
                queuedBatchPending: !current.queuedBatchPending,
              }))
            }
          >
            {ledger.queuedBatchPending ? "Apply queued changes" : "Reset queue snapshot"}
          </button>
        </div>
      </section>

      <div className="staff-shell__layout" data-testid="staff-shell-layout">
        <aside className="staff-shell__workboard-pane">
          <header className="staff-shell__pane-header">
            <span className="staff-shell__eyebrow">WorkspaceHomeProjection</span>
            <h2>{selectedQueue.label}</h2>
            <p>{selectedQueue.description}</p>
          </header>

          <div className="staff-shell__queue-picker">
            {staffQueues.map((queue) => (
              <button
                type="button"
                className="staff-shell__queue-link"
                data-active={(route.queueKey ?? "recommended") === queue.key ? "true" : "false"}
                key={queue.key}
                onClick={() => navigateTo(parseStaffPath(`/workspace/queue/${queue.key}`))}
              >
                {queue.label}
              </button>
            ))}
          </div>

          <div className="staff-shell__preview-pocket">
            <QueuePreview task={previewTask} selectedAnchor={ledger.selectedAnchorId} onOpen={openTask} />
          </div>

          <div
            className="staff-shell__queue-list"
            data-testid="queue-workboard"
            onKeyDown={onQueueKeyDown}
            role="listbox"
            aria-label="Clinical queue workboard"
          >
            {deriveVisibleQueueRows(route, ledger).map((task) => (
              <QueueRow
                key={task.id}
                task={task}
                isActive={ledger.selectedTaskId === task.id}
                isPreviewing={previewTaskId === task.id}
                onHover={schedulePreview}
                onPin={(taskId) => {
                  startTransition(() => {
                    setPreviewTaskId(taskId);
                    setPreviewPinned(true);
                  });
                }}
                onOpen={openTask}
                onSelectAnchor={(taskId) => {
                  setLedger((current) => ({
                    ...current,
                    selectedTaskId: taskId,
                    previewTaskId: taskId,
                    selectedAnchorId: `queue-row-${taskId}`,
                  }));
                }}
              />
            ))}
          </div>
        </aside>

        <section className="staff-shell__main-pane">
          <ProtectedCompositionRibbon
            route={route}
            bufferedUpdateCount={ledger.bufferedUpdateCount}
            runtimeScenario={runtimeScenario}
          />

          {route.kind === "home" && (
            <div className="staff-shell__home">
              <section className="staff-shell__hero" data-testid="today-workbench-hero">
                <span className="staff-shell__eyebrow">TodayWorkbenchHero</span>
                <h2>Resume the returned-evidence queue before anything else</h2>
                <p>
                  The recommended queue stays expanded because decisive deltas and callback drift need bounded review before settlement can resume.
                </p>
                <button type="button" className="staff-shell__inline-action" onClick={() => openTask("task-311")}>
                  Open Task 311 in the same shell
                </button>
              </section>

              <section className="staff-shell__home-modules">
                {staffHomeModules.map((module) => (
                  <InterruptionModule
                    key={module.id}
                    module={module}
                    active={module.id === homeModule?.id}
                    onSelect={setActiveHomeModuleId}
                  />
                ))}
              </section>

              <section className="staff-shell__home-detail">
                <span className="staff-shell__eyebrow">{homeModule?.title}</span>
                <strong>{homeModule?.summary}</strong>
                <p>{homeModule?.detail}</p>
              </section>
            </div>
          )}

          {(route.kind === "queue" || route.kind === "search") && postureContract && (
            <div className="staff-shell__posture-stage" data-testid="queue-posture-stage">
              <SurfaceStateFrame contract={postureContract} />
            </div>
          )}

          {(route.kind === "queue" || route.kind === "task" || route.kind === "more-info" || route.kind === "decision") &&
            (!postureContract || route.kind === "task" || route.kind === "more-info" || route.kind === "decision") && (
              <>
                {postureContract && route.kind !== "queue" && (
                  <section className="staff-shell__inline-posture" data-testid="inline-posture">
                    <strong>{postureContract.title}</strong>
                    <span>{postureContract.summary}</span>
                  </section>
                )}
                <TaskCanvas
                  task={activeTask}
                  currentRoute={route}
                  postureMode={
                    authority.guardDecision.effectivePosture === "live"
                      ? "live"
                      : authority.guardDecision.effectivePosture === "read_only"
                        ? "guarded"
                        : "recovery"
                  }
                  selectedDecision={decisionSelection}
                />
              </>
            )}

          {route.kind === "approvals" && (
            <section className="staff-shell__peer-route" data-testid="approvals-route">
              <header>
                <span className="staff-shell__eyebrow">Approvals</span>
                <h2>Consequence-aware approvals stay inside the same shell</h2>
              </header>
              <div className="staff-shell__peer-grid">
                {staffCases
                  .filter((task) => task.state === "approval")
                  .map((task) => (
                    <article key={task.id} className="staff-shell__peer-card">
                      <strong>{task.primaryReason}</strong>
                      <p>{task.previewSummary}</p>
                      <button type="button" className="staff-shell__inline-action" onClick={() => openTask(task.id)}>
                        Open promoted approval preview
                      </button>
                    </article>
                  ))}
              </div>
            </section>
          )}

          {route.kind === "escalations" && (
            <section className="staff-shell__peer-route staff-shell__peer-route--critical" data-testid="escalations-route">
              <header>
                <span className="staff-shell__eyebrow">Escalations</span>
                <h2>Urgent, low-noise escalation workboard</h2>
              </header>
              <div className="staff-shell__peer-grid">
                {staffCases
                  .filter((task) => task.state === "escalated" || task.state === "blocked")
                  .map((task) => (
                    <article key={task.id} className="staff-shell__peer-card">
                      <strong>{task.primaryReason}</strong>
                      <p>{task.deltaSummary}</p>
                      <button type="button" className="staff-shell__inline-action" onClick={() => openTask(task.id)}>
                        Review escalated case
                      </button>
                    </article>
                  ))}
              </div>
            </section>
          )}

          {route.kind === "changed" && (
            <section className="staff-shell__peer-route" data-testid="changed-route">
              <header>
                <span className="staff-shell__eyebrow">EvidenceDeltaPacket</span>
                <h2>Resumed review remains delta-first</h2>
              </header>
              <div className="staff-shell__peer-grid">
                {staffCases
                  .filter((task) => task.state === "changed" || task.state === "reassigned")
                  .map((task) => (
                    <article key={task.id} className="staff-shell__peer-card">
                      <strong>{task.deltaSummary}</strong>
                      <p>{task.supersededContext[0]}</p>
                      <button type="button" className="staff-shell__inline-action" onClick={() => openTask(task.id)}>
                        Resume in task shell
                      </button>
                    </article>
                  ))}
              </div>
            </section>
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
                      onClick={() => navigateTo(parseStaffPath(buildStaffPath({ kind: "task", taskId: task.id })))}
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

        <aside className="staff-shell__dock-pane">
          <DecisionDock
            task={activeTask}
            route={route}
            selectedDecision={decisionSelection}
            onDecisionChange={(value) => {
              setDecisionSelection(value);
              emitTelemetry("dominant_action_changed", {
                path: route.path,
                decision: value,
              });
            }}
            onOpenMoreInfo={() =>
              navigateTo(parseStaffPath(buildStaffPath({ kind: "more-info", taskId: activeTask.id })))
            }
            onOpenDecision={() =>
              navigateTo(parseStaffPath(buildStaffPath({ kind: "decision", taskId: activeTask.id })))
            }
            onLaunchNext={launchNextTask}
            onOpenSupportStub={() => navigateTo(parseStaffPath("/workspace/support-handoff"))}
            note={draftNote}
            onNoteChange={setDraftNote}
            selectedReason={selectedReason}
            onReasonChange={setSelectedReason}
            selectedDuePick={selectedDuePick}
            onDuePickChange={setSelectedDuePick}
          />

          <section className="staff-shell__authority-card" data-testid="route-authority-card">
            <span className="staff-shell__eyebrow">Route authority</span>
            <strong>{authority.guardDecision.effectivePosture.replaceAll("_", " ")}</strong>
            <p>Manifest validation: {authority.verdict.validationState}. Safe to consume: {String(authority.verdict.safeToConsume)}.</p>
            <p>Digest drift: {authority.verdict.driftState}. Runtime bundle: {authority.manifest.runtimePublicationBundleRef}.</p>
          </section>

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
      </div>
    </main>
  );
}
