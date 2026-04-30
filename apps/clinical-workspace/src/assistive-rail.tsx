import { useEffect, useId, useRef, useState, type RefObject } from "react";
import {
  AssistiveDraftSectionDeck,
  buildAssistiveDraftDeckState,
  type AssistiveDraftDeckState,
} from "./assistive-draft";
import {
  AssistiveConfidenceBandCluster,
  AssistiveConfidenceStateAdapter,
  type AssistiveConfidenceState,
} from "./assistive-confidence";
import {
  AssistiveEditedByClinicianTrail,
  AssistiveOverrideStateAdapter,
  type AssistiveOverrideState,
} from "./assistive-override";
import {
  AssistiveTrustStateAdapter,
  AssistiveTrustStateFrame,
  type AssistiveTrustPostureState,
} from "./assistive-trust-posture";
import {
  AssistiveFreezeInPlaceFrame,
  AssistiveFreezeRecoveryStateAdapter,
  type AssistiveFreezeRecoveryState,
} from "./assistive-stale-recovery";
import type { StaffRouteKind, StaffShellLedger, StaffShellRoute } from "./workspace-shell.data";

export const ASSISTIVE_RAIL_VISUAL_MODE = "Assistive_Rail_Quiet_Copilot";
const ASSISTIVE_RAIL_TOGGLE_SHORTCUT = "Alt+A";

export type AssistiveRailPresentationState =
  | "shadow_summary"
  | "observe_only"
  | "loading"
  | "placeholder"
  | "hidden_ready";

export type AssistiveRailTrustState = "trusted" | "degraded" | "shadow_only" | "frozen" | "unknown";

export type AssistiveRailActionabilityState =
  | "observe_only"
  | "regenerate_only"
  | "blocked"
  | "shell_only";

export type AssistiveRailShellState = {
  presentationState: AssistiveRailPresentationState;
  trustState: AssistiveRailTrustState;
  actionabilityState: AssistiveRailActionabilityState;
  capabilityCode: string;
  capabilityFamily: string;
  postureLabel: string;
  title: string;
  summaryHeadline: string;
  summaryBody: string;
  rationaleLine: string;
  selectedAnchorRef: string;
  taskRef: string;
  routeKind: StaffRouteKind;
  provenance: {
    evidenceSnapshotRef: string;
    freshnessState: "current" | "aging" | "stale" | "hidden";
    publicationRef: string;
    runtimeBundleRef: string;
    trustEnvelopeRef: string;
  };
  draftDeck?: AssistiveDraftDeckState;
  confidenceState?: AssistiveConfidenceState;
  overrideState?: AssistiveOverrideState;
  trustPostureState?: AssistiveTrustPostureState;
  freezeRecoveryState?: AssistiveFreezeRecoveryState;
  defaultCollapsed?: boolean;
  freezeNote?: string;
};

export type AssistiveRailStateAdapterInput = {
  route: StaffShellRoute;
  runtimeScenario: StaffShellLedger["runtimeScenario"];
  selectedAnchorRef: string;
  taskRef: string;
  patientLabel: string;
};

type AssistiveRailShellProps = {
  state: AssistiveRailShellState;
  onRailEvent?: (eventName: string, details: Record<string, string>) => void;
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function readRequestedState(): AssistiveRailPresentationState | null {
  if (typeof window === "undefined") {
    return null;
  }
  const value = new URLSearchParams(window.location.search).get("assistiveRail");
  switch (value) {
    case "shadow-summary":
    case "shadow_summary":
      return "shadow_summary";
    case "observe-only":
    case "observe_only":
      return "observe_only";
    case "loading":
      return "loading";
    case "placeholder":
      return "placeholder";
    case "hidden-ready":
    case "hidden_ready":
      return "hidden_ready";
    default:
      return null;
  }
}

function readRequestedCollapse(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const value = new URLSearchParams(window.location.search).get("assistiveRailCollapsed");
  return value === "true" || value === "1";
}

function stateForScenario(
  runtimeScenario: StaffShellLedger["runtimeScenario"],
): Pick<
  AssistiveRailShellState,
  "presentationState" | "trustState" | "actionabilityState" | "postureLabel" | "freezeNote"
> {
  switch (runtimeScenario) {
    case "read_only":
      return {
        presentationState: "observe_only",
        trustState: "degraded",
        actionabilityState: "observe_only",
        postureLabel: "Observe-only",
        freezeNote: "Workspace is read-only; assistive write affordances stay suppressed.",
      };
    case "recovery_only":
      return {
        presentationState: "placeholder",
        trustState: "degraded",
        actionabilityState: "regenerate_only",
        postureLabel: "Recovery only",
        freezeNote: "Continuity requires recovery before a fresh assistive summary can render.",
      };
    case "blocked":
      return {
        presentationState: "placeholder",
        trustState: "frozen",
        actionabilityState: "blocked",
        postureLabel: "Frozen",
        freezeNote: "Assistive status is frozen until the blocking trust envelope clears.",
      };
    case "stale_review":
      return {
        presentationState: "observe_only",
        trustState: "degraded",
        actionabilityState: "observe_only",
        postureLabel: "Stale review",
        freezeNote: "Stale review detected; existing assistive context remains read-only.",
      };
    case "live":
    default:
      return {
        presentationState: "shadow_summary",
        trustState: "shadow_only",
        actionabilityState: "shell_only",
        postureLabel: "Shadow summary",
      };
  }
}

export function AssistiveRailStateAdapter({
  route,
  runtimeScenario,
  selectedAnchorRef,
  taskRef,
  patientLabel,
}: AssistiveRailStateAdapterInput): AssistiveRailShellState {
  const scenarioState = stateForScenario(runtimeScenario);
  const requestedState = readRequestedState();
  const presentationState = requestedState ?? scenarioState.presentationState;
  const routePosture =
    route.kind === "decision"
      ? "Decision support"
      : route.kind === "more-info"
        ? "More-info support"
        : "Review support";

  const overrideState: Partial<AssistiveRailShellState> =
    presentationState === "loading"
      ? {
          trustState: "unknown",
          actionabilityState: "blocked",
          postureLabel: "Loading",
        }
      : presentationState === "placeholder"
        ? {
            trustState: scenarioState.trustState === "frozen" ? "frozen" : "degraded",
            actionabilityState: scenarioState.actionabilityState,
            postureLabel: scenarioState.postureLabel === "Frozen" ? "Frozen" : "Summary",
          }
        : presentationState === "observe_only"
          ? {
              trustState: "degraded",
              actionabilityState: "observe_only",
              postureLabel: "Observe-only",
            }
          : presentationState === "hidden_ready"
            ? {
                trustState: "shadow_only",
                actionabilityState: "shell_only",
                postureLabel: "Ready hidden",
              }
            : {};
  const draftDeck = buildAssistiveDraftDeckState({
    runtimeScenario,
    selectedAnchorRef,
    taskRef,
    routeKind: route.kind,
  });
  const confidenceState = AssistiveConfidenceStateAdapter({
    runtimeScenario,
    selectedAnchorRef,
    taskRef,
    routeKind: route.kind,
  });
  const overrideTrailState = AssistiveOverrideStateAdapter({
    runtimeScenario,
    selectedAnchorRef,
    taskRef,
    routeKind: route.kind,
  });
  const trustPostureState = AssistiveTrustStateAdapter({
    runtimeScenario,
    selectedAnchorRef,
    taskRef,
    routeKind: route.kind,
  });
  const freezeRecoveryState = AssistiveFreezeRecoveryStateAdapter({
    runtimeScenario,
    selectedAnchorRef,
    taskRef,
    routeKind: route.kind,
  });

  return {
    presentationState,
    trustState: overrideState.trustState ?? scenarioState.trustState,
    actionabilityState: overrideState.actionabilityState ?? scenarioState.actionabilityState,
    capabilityCode: "assistive_documentation_shadow",
    capabilityFamily: "Documentation composer",
    postureLabel: overrideState.postureLabel ?? scenarioState.postureLabel,
    title: "Assistive companion",
    summaryHeadline: `${routePosture} for ${patientLabel}`,
    summaryBody:
      "A compact assistive summary can be inspected here, but the clinical review canvas and final human action remain authoritative.",
    rationaleLine:
      presentationState === "shadow_summary"
        ? "Shadow output is shown as evidence-bearing awareness only."
        : presentationState === "observe_only"
          ? "Observe-only status keeps prior context readable without insert or completion cues."
          : presentationState === "hidden_ready"
            ? "Rail host is ready and collapsed until explicitly opened."
            : "The rail keeps its footprint stable while trust, publication, or continuity resolves.",
    selectedAnchorRef,
    taskRef,
    routeKind: route.kind,
    provenance: {
      evidenceSnapshotRef: `evidence_snapshot.${taskRef}.summary_stub`,
      freshnessState:
        presentationState === "hidden_ready"
          ? "hidden"
          : presentationState === "placeholder"
            ? "stale"
            : runtimeScenario === "live"
              ? "current"
              : "aging",
      publicationRef: "surface_publication.phase8.assistive_staff_workspace.v1",
      runtimeBundleRef: "runtime_bundle.phase8.assistive_shadow.v1",
      trustEnvelopeRef: `assistive_trust_envelope.${taskRef}.${selectedAnchorRef}`,
    },
    draftDeck: draftDeck ?? undefined,
    confidenceState: confidenceState ?? undefined,
    overrideState: overrideTrailState ?? undefined,
    trustPostureState: trustPostureState ?? undefined,
    freezeRecoveryState: freezeRecoveryState ?? undefined,
    defaultCollapsed: readRequestedCollapse() || presentationState === "hidden_ready",
    freezeNote: scenarioState.freezeNote,
  };
}

export function AssistiveRailKeyboardController({
  railRef,
  collapsed,
  onCollapse,
  onToggle,
}: {
  railRef: RefObject<HTMLElement | null>;
  collapsed: boolean;
  onCollapse: () => void;
  onToggle: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && !event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        onToggle();
        return;
      }

      if (event.key !== "Escape" || collapsed) {
        return;
      }

      const rail = railRef.current;
      if (!rail || !rail.contains(document.activeElement)) {
        return;
      }

      event.preventDefault();
      onCollapse();
      rail.querySelector<HTMLButtonElement>("[data-assistive-collapse-toggle='true']")?.focus();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [collapsed, onCollapse, onToggle, railRef]);

  return null;
}

export function AssistiveCapabilityPostureChip({
  postureLabel,
  trustState,
}: {
  postureLabel: string;
  trustState: AssistiveRailTrustState;
}) {
  return (
    <span
      className="assistive-rail__posture-chip"
      data-testid="AssistiveCapabilityPostureChip"
      data-trust-state={trustState}
    >
      {postureLabel}
    </span>
  );
}

export function AssistiveRailCollapseToggle({
  collapsed,
  controlsId,
  onToggle,
}: {
  collapsed: boolean;
  controlsId: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="assistive-rail__collapse-toggle"
      data-testid="AssistiveRailCollapseToggle"
      data-assistive-collapse-toggle="true"
      aria-label={collapsed ? "Expand assistive rail" : "Collapse assistive rail"}
      aria-controls={controlsId}
      aria-expanded={!collapsed}
      onClick={onToggle}
    >
      <span aria-hidden="true">{collapsed ? ">" : "<"}</span>
    </button>
  );
}

export function AssistiveRailHeader({
  state,
  collapsed,
  controlsId,
  headingId,
  onToggle,
}: {
  state: AssistiveRailShellState;
  collapsed: boolean;
  controlsId: string;
  headingId: string;
  onToggle: () => void;
}) {
  return (
    <header className="assistive-rail__header" data-testid="AssistiveRailHeader">
      <div className="assistive-rail__header-copy">
        <span className="assistive-rail__capability-label">{state.capabilityFamily}</span>
        <h2 id={headingId}>{state.title}</h2>
      </div>
      {!collapsed && (
        <AssistiveCapabilityPostureChip
          postureLabel={state.postureLabel}
          trustState={state.trustState}
        />
      )}
      <AssistiveRailCollapseToggle
        collapsed={collapsed}
        controlsId={controlsId}
        onToggle={onToggle}
      />
    </header>
  );
}

export function AssistiveSummaryStubCard({ state }: { state: AssistiveRailShellState }) {
  return (
    <section
      className="assistive-rail__summary-card"
      data-testid="AssistiveSummaryStubCard"
      aria-labelledby="assistive-summary-stub-heading"
    >
      <div className="assistive-rail__section-label">Summary summary</div>
      <h3 id="assistive-summary-stub-heading">{state.summaryHeadline}</h3>
      <p>{state.summaryBody}</p>
      <dl className="assistive-rail__summary-facts">
        <div>
          <dt>Selected anchor</dt>
          <dd>{state.selectedAnchorRef}</dd>
        </div>
        <div>
          <dt>Actionability</dt>
          <dd>{state.actionabilityState.replaceAll("_", " ")}</dd>
        </div>
      </dl>
    </section>
  );
}

export function AssistiveShadowModePanel({ state }: { state: AssistiveRailShellState }) {
  const headingId = "assistive-shadow-panel-heading";
  return (
    <section
      className="assistive-rail__mode-panel"
      data-testid="AssistiveShadowModePanel"
      aria-labelledby={headingId}
    >
      <div className="assistive-rail__section-label">Shadow mode</div>
      <h3 id={headingId}>Non-authoritative comparison</h3>
      <p>{state.rationaleLine}</p>
      <ul className="assistive-rail__guard-list">
        <li>No final workflow verified details is inferred from this output.</li>
        <li>Insert and completion controls are reserved for later leased states.</li>
        <li>The case canvas remains the primary review surface.</li>
      </ul>
    </section>
  );
}

export function AssistiveObserveOnlyPlaceholder({ state }: { state: AssistiveRailShellState }) {
  const headingId = "assistive-observe-only-heading";
  return (
    <section
      className="assistive-rail__mode-panel assistive-rail__mode-panel--observe"
      data-testid="AssistiveObserveOnlyPlaceholder"
      aria-labelledby={headingId}
    >
      <div className="assistive-rail__section-label">
        {state.presentationState === "placeholder" ? "Summary" : "Observe-only"}
      </div>
      <h3 id={headingId}>
        {state.presentationState === "placeholder"
          ? "Assistive detail held back"
          : "Read-only assistive status"}
      </h3>
      <p>{state.rationaleLine}</p>
      {state.freezeNote && <p className="assistive-rail__freeze-note">{state.freezeNote}</p>}
    </section>
  );
}

function AssistiveLoadingPanel() {
  return (
    <section
      className="assistive-rail__mode-panel assistive-rail__mode-panel--loading"
      data-testid="AssistiveRailLoadingPanel"
      aria-labelledby="assistive-loading-heading"
      aria-busy="true"
    >
      <div className="assistive-rail__section-label">Loading</div>
      <h3 id="assistive-loading-heading">Checking trust envelope</h3>
      <div className="assistive-rail__skeleton" aria-hidden="true" />
      <div
        className="assistive-rail__skeleton assistive-rail__skeleton--short"
        aria-hidden="true"
      />
      <p>Rail footprint is reserved while renderability resolves.</p>
    </section>
  );
}

export function AssistiveProvenanceFooterStub({ state }: { state: AssistiveRailShellState }) {
  return (
    <footer
      className="assistive-rail__provenance-footer"
      data-testid="AssistiveProvenanceFooterStub"
      aria-label="Support history summary"
    >
      <span>History summary</span>
      <dl>
        <div>
          <dt>Freshness</dt>
          <dd>{state.provenance.freshnessState}</dd>
        </div>
        <div>
          <dt>Trust</dt>
          <dd>{state.trustState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Publication</dt>
          <dd data-publication-ref={state.provenance.publicationRef}>Current</dd>
        </div>
      </dl>
    </footer>
  );
}

function AssistiveContentWell({ state }: { state: AssistiveRailShellState }) {
  if (state.presentationState === "loading") {
    return <AssistiveLoadingPanel />;
  }

  if (state.presentationState === "shadow_summary") {
    return <AssistiveShadowModePanel state={state} />;
  }

  return <AssistiveObserveOnlyPlaceholder state={state} />;
}

export function AssistiveRailShell({ state, onRailEvent }: AssistiveRailShellProps) {
  const headingId = useId();
  const controlsId = useId();
  const railRef = useRef<HTMLElement | null>(null);
  const [collapsed, setCollapsed] = useState(Boolean(state.defaultCollapsed));

  useEffect(() => {
    if (state.presentationState === "hidden_ready") {
      setCollapsed(true);
    }
  }, [state.presentationState]);

  const handleToggle = () => {
    setCollapsed((current) => {
      const next = !current;
      onRailEvent?.(next ? "assistive_rail_collapsed" : "assistive_rail_expanded", {
        taskRef: state.taskRef,
        selectedAnchorRef: state.selectedAnchorRef,
        presentationState: state.presentationState,
      });
      return next;
    });
  };

  const handleCollapse = () => {
    setCollapsed(true);
    onRailEvent?.("assistive_rail_collapsed_by_keyboard", {
      taskRef: state.taskRef,
      selectedAnchorRef: state.selectedAnchorRef,
      presentationState: state.presentationState,
    });
  };

  return (
    <aside
      ref={railRef}
      className={classNames("assistive-rail", collapsed && "assistive-rail--collapsed")}
      role="complementary"
      aria-labelledby={headingId}
      data-testid="AssistiveRailShell"
      data-visual-mode={ASSISTIVE_RAIL_VISUAL_MODE}
      data-rail-state={state.presentationState}
      data-collapsed={collapsed ? "true" : "false"}
      data-actionability-state={state.actionabilityState}
      data-trust-state={state.trustState}
      data-route-kind={state.routeKind}
      data-task-ref={state.taskRef}
      data-selected-anchor-ref={state.selectedAnchorRef}
    >
      <AssistiveRailKeyboardController
        railRef={railRef}
        collapsed={collapsed}
        onCollapse={handleCollapse}
        onToggle={handleToggle}
      />
      <AssistiveRailHeader
        state={state}
        collapsed={collapsed}
        controlsId={controlsId}
        headingId={headingId}
        onToggle={handleToggle}
      />
      <div
        id={controlsId}
        className="assistive-rail__body"
        data-testid="AssistiveRailBody"
        hidden={collapsed}
      >
        <AssistiveSummaryStubCard state={state} />
        <AssistiveContentWell state={state} />
        {state.confidenceState && (
          <AssistiveConfidenceBandCluster state={state.confidenceState} placement="rail_card" />
        )}
        {state.overrideState && <AssistiveEditedByClinicianTrail state={state.overrideState} />}
        {state.trustPostureState && <AssistiveTrustStateFrame state={state.trustPostureState} />}
        {state.freezeRecoveryState && (
          <AssistiveFreezeInPlaceFrame state={state.freezeRecoveryState} />
        )}
        {state.freezeRecoveryState ? null : state.draftDeck ? (
          <AssistiveDraftSectionDeck deck={state.draftDeck} />
        ) : (
          <section
            className="assistive-rail__content-well"
            data-testid="AssistiveRailQuietContentWell"
            aria-label="Future assistive detail host"
            tabIndex={-1}
          >
            <div className="assistive-rail__section-label">Detail host</div>
            <p className="sr-only">{ASSISTIVE_RAIL_TOGGLE_SHORTCUT} toggles this rail.</p>
            <p>
              Later draft, rationale, override, degraded, and stale-recovery views mount here
              without rebuilding the rail chrome.
            </p>
          </section>
        )}
        <AssistiveProvenanceFooterStub state={state} />
      </div>
      {collapsed && (
        <p className="sr-only">
          Assistive rail collapsed. Current posture is {state.postureLabel}.
        </p>
      )}
    </aside>
  );
}
