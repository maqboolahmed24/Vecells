import {
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import type { StaffShellLedger, StaffShellRoute } from "./workspace-shell.data";

export const ASSISTIVE_SAME_SHELL_STAGE_VISUAL_MODE = "Assistive_Same_Shell_Stage";

export type AssistiveWorkspaceStageFixture =
  | "summary-stub"
  | "promoted"
  | "pinned"
  | "downgraded"
  | "folded";

export type AssistiveWorkspaceStageMode =
  | "summary_stub"
  | "promoted"
  | "pinned"
  | "downgraded"
  | "folded";

export type AssistiveWorkspaceStageTrustState = "trusted" | "degraded" | "shadow_only" | "frozen";

export type AssistiveWorkspaceStageActionability =
  | "interactive"
  | "observe_only"
  | "provenance_only"
  | "blocked";

export type AssistiveStagePromotionState =
  | "allowed"
  | "pinned_by_user"
  | "blocked_by_trust"
  | "folded_by_viewport";

export type AssistiveWorkspaceStageState = {
  fixture: AssistiveWorkspaceStageFixture;
  visualMode: typeof ASSISTIVE_SAME_SHELL_STAGE_VISUAL_MODE;
  stageMode: AssistiveWorkspaceStageMode;
  routeKind: StaffShellRoute["kind"];
  taskRef: string;
  patientLabel: string;
  queueContextRef: string;
  capabilityLabel: string;
  title: string;
  summaryHeading: string;
  summaryLine: string;
  rationaleLine: string;
  trustState: AssistiveWorkspaceStageTrustState;
  actionabilityState: AssistiveWorkspaceStageActionability;
  confidenceLabel: string;
  provenanceLine: string;
  assistiveWorkspaceStageBindingRef: string;
  workspaceTrustEnvelopeRef: string;
  assistiveCapabilityTrustEnvelopeRef: string;
  assistiveFeedbackChainRef: string;
  reviewVersionRef: string;
  policyBundleRef: string;
  publicationRef: string;
  selectedAnchorRef: string;
  quietReturnTargetRef: string;
  insertionPointRef: string;
  attentionBudget: {
    attentionBudgetRef: string;
    supportRegionSlot: "summary_stub" | "side_stage" | "folded_tab";
    promotionState: AssistiveStagePromotionState;
    promotionAllowed: boolean;
    primaryCanvasMinWidthPx: 720;
    stageWidthPx: 440 | 400 | 360;
    blockerLabel: string;
    promotedSupportRegionConflict: "none" | "existing_support_region";
  };
  pin: {
    pinned: boolean;
    canPin: boolean;
    label: string;
  };
  responsive: {
    breakpoint: "desktop_wide" | "desktop_standard" | "tablet" | "narrow";
    foldState: "desktop_stage" | "tablet_stage" | "narrow_folded";
    foldLabel: string;
  };
  contentRows: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
};

export type AssistiveWorkspaceStageStateAdapterInput = {
  route: StaffShellRoute;
  runtimeScenario: StaffShellLedger["runtimeScenario"];
  selectedAnchorRef: string;
  taskRef: string;
  patientLabel: string;
  queueKey: string;
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function readRequestedStageFixture(): AssistiveWorkspaceStageFixture | null {
  if (typeof window === "undefined") {
    return null;
  }
  const value = new URLSearchParams(window.location.search).get("assistiveStage");
  switch (value) {
    case "summary":
    case "summary-stub":
    case "summary_stub":
      return "summary-stub";
    case "promoted":
    case "stage":
      return "promoted";
    case "pinned":
    case "pin":
      return "pinned";
    case "downgraded":
    case "trust-downgraded":
    case "trust_downgraded":
      return "downgraded";
    case "folded":
    case "narrow-folded":
    case "narrow_folded":
      return "folded";
    default:
      return null;
  }
}

function stageWidthForFixture(
  fixture: AssistiveWorkspaceStageFixture,
): AssistiveWorkspaceStageState["attentionBudget"]["stageWidthPx"] {
  switch (fixture) {
    case "folded":
      return 360;
    case "summary-stub":
    case "downgraded":
    case "promoted":
    case "pinned":
    default:
      return 440;
  }
}

function stageModeForFixture(fixture: AssistiveWorkspaceStageFixture): AssistiveWorkspaceStageMode {
  switch (fixture) {
    case "summary-stub":
      return "summary_stub";
    case "pinned":
      return "pinned";
    case "downgraded":
      return "downgraded";
    case "folded":
      return "folded";
    case "promoted":
    default:
      return "promoted";
  }
}

function trustStateForFixture(
  fixture: AssistiveWorkspaceStageFixture,
  runtimeScenario: StaffShellLedger["runtimeScenario"],
): AssistiveWorkspaceStageTrustState {
  if (fixture === "downgraded") {
    return "degraded";
  }
  switch (runtimeScenario) {
    case "read_only":
    case "stale_review":
    case "recovery_only":
      return "degraded";
    case "blocked":
      return "frozen";
    case "live":
    default:
      return fixture === "summary-stub" ? "shadow_only" : "trusted";
  }
}

function actionabilityForTrust(
  trustState: AssistiveWorkspaceStageTrustState,
): AssistiveWorkspaceStageActionability {
  switch (trustState) {
    case "trusted":
      return "interactive";
    case "degraded":
      return "observe_only";
    case "frozen":
      return "provenance_only";
    case "shadow_only":
    default:
      return "observe_only";
  }
}

export function AssistiveWorkspaceStageStateAdapter({
  route,
  runtimeScenario,
  selectedAnchorRef,
  taskRef,
  patientLabel,
  queueKey,
}: AssistiveWorkspaceStageStateAdapterInput): AssistiveWorkspaceStageState | null {
  const fixture = readRequestedStageFixture();
  if (!fixture) {
    return null;
  }

  const trustState = trustStateForFixture(fixture, runtimeScenario);
  const actionabilityState = actionabilityForTrust(trustState);
  const stageMode = stageModeForFixture(fixture);
  const promotionAllowed = trustState === "trusted" || fixture === "pinned" || fixture === "folded";
  const isFolded = fixture === "folded";
  const isPinned = fixture === "pinned";
  const stageWidthPx = stageWidthForFixture(fixture);
  const supportRegionSlot =
    stageMode === "summary_stub" ? "summary_stub" : isFolded ? "folded_tab" : "side_stage";
  const promotionState: AssistiveStagePromotionState =
    fixture === "downgraded"
      ? "blocked_by_trust"
      : isPinned
        ? "pinned_by_user"
        : isFolded
          ? "folded_by_viewport"
          : "allowed";
  const breakpoint = isFolded ? "narrow" : stageWidthPx === 360 ? "tablet" : "desktop_wide";
  const primarySummary =
    fixture === "downgraded"
      ? "Assistive context is preserved in observe-only posture because the current capability trust envelope degraded."
      : fixture === "folded"
        ? "Assistive support is folded into the same shell without covering the task canvas or DecisionDock."
        : "Assistive support can expand beside the task canvas while the clinical review remains dominant.";

  return {
    fixture,
    visualMode: ASSISTIVE_SAME_SHELL_STAGE_VISUAL_MODE,
    stageMode,
    routeKind: route.kind,
    taskRef,
    patientLabel,
    queueContextRef: `queue_context.${queueKey}.${taskRef}`,
    capabilityLabel: "AssistiveWorkspaceStage",
    title:
      fixture === "downgraded"
        ? "Assistive stage downgraded"
        : fixture === "summary-stub"
          ? "Assistive summary"
          : "Assistive workspace stage",
    summaryHeading:
      fixture === "summary-stub"
        ? "Summary stub, not promoted"
        : fixture === "pinned"
          ? "Pinned assistive stage"
          : fixture === "folded"
            ? "Folded assistive stage"
            : fixture === "downgraded"
              ? "Observe-only assistive stage"
              : "Promoted assistive stage",
    summaryLine: primarySummary,
    rationaleLine:
      "Promotion depends on AttentionBudget, WorkspaceTrustEnvelope, AssistiveCapabilityTrustEnvelope, route family, publication posture, and the selected anchor tuple.",
    trustState,
    actionabilityState,
    confidenceLabel:
      trustState === "trusted" ? "Conservative band visible" : "Confidence suppressed",
    provenanceLine: `Evidence snapshot and policy bundle remain bound to ${selectedAnchorRef}.`,
    assistiveWorkspaceStageBindingRef: `assistive_workspace_stage_binding.424.${taskRef}.${selectedAnchorRef}`,
    workspaceTrustEnvelopeRef: `workspace_trust_envelope.424.${taskRef}.${queueKey}`,
    assistiveCapabilityTrustEnvelopeRef: `assistive_capability_trust_envelope.424.${taskRef}.${selectedAnchorRef}`,
    assistiveFeedbackChainRef: `assistive_feedback_chain.417.${taskRef}.same_shell_stage`,
    reviewVersionRef: `review_version.${taskRef}.current`,
    policyBundleRef: "compiled_policy_bundle.phase8.assistive.same_shell",
    publicationRef: "runtime_publication_bundle.424.same_shell_stage",
    selectedAnchorRef,
    quietReturnTargetRef: "decision-dock",
    insertionPointRef: `assistive_draft_insertion_point.${taskRef}.${selectedAnchorRef}`,
    attentionBudget: {
      attentionBudgetRef: `attention_budget.424.${taskRef}.${route.kind}`,
      supportRegionSlot,
      promotionState,
      promotionAllowed,
      primaryCanvasMinWidthPx: 720,
      stageWidthPx,
      blockerLabel:
        fixture === "downgraded"
          ? "Trust posture blocks pinning and fresh insert affordances."
          : "No support-region conflict; primary canvas remains dominant.",
      promotedSupportRegionConflict: "none",
    },
    pin: {
      pinned: isPinned,
      canPin: trustState === "trusted",
      label: isPinned ? "Pinned by clinician" : "Not pinned",
    },
    responsive: {
      breakpoint,
      foldState: isFolded
        ? "narrow_folded"
        : stageWidthPx === 360
          ? "tablet_stage"
          : "desktop_stage",
      foldLabel: isFolded
        ? "Folded into a same-shell tab panel below the split threshold."
        : "Rendered as the bounded fourth support region.",
    },
    contentRows: [
      {
        label: "Artifact",
        value: "Preserved draft awareness",
        detail:
          "Draft, provenance, override, and stale-recovery language are reused from tasks 419 to 423.",
      },
      {
        label: "Queue context",
        value: queueKey,
        detail:
          "The queue pocket stays informational so the stage does not create a second navigation model.",
      },
      {
        label: "Decision dock",
        value: "Dominant action preserved",
        detail:
          "Assistive insert or recovery can only return to the existing DecisionDock or compose slot.",
      },
    ],
  };
}

type StagePromoterProps = {
  state: AssistiveWorkspaceStageState;
  expanded: boolean;
  controlsId: string;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  onPromote: () => void;
  onCollapse: () => void;
};

export function AssistiveStagePromoter({
  state,
  expanded,
  controlsId,
  buttonRef,
  onPromote,
  onCollapse,
}: StagePromoterProps) {
  const disabled = !expanded && !state.attentionBudget.promotionAllowed;
  return (
    <button
      ref={buttonRef}
      type="button"
      className="assistive-stage__button"
      data-testid="AssistiveStagePromoter"
      aria-expanded={expanded}
      aria-controls={controlsId}
      disabled={disabled}
      onClick={expanded ? onCollapse : onPromote}
    >
      {expanded ? "Collapse assistive stage" : "Promote assistive stage"}
    </button>
  );
}

type StagePinControllerProps = {
  state: AssistiveWorkspaceStageState;
  pinned: boolean;
  onTogglePinned: () => void;
};

export function AssistiveStagePinController({
  state,
  pinned,
  onTogglePinned,
}: StagePinControllerProps) {
  return (
    <button
      type="button"
      className="assistive-stage__button assistive-stage__button--pin"
      data-testid="AssistiveStagePinController"
      aria-pressed={pinned}
      disabled={!state.pin.canPin}
      onClick={onTogglePinned}
    >
      {pinned ? "Unpin assistive stage" : "Pin assistive stage"}
    </button>
  );
}

export function AssistiveSummaryStubCluster({
  state,
  controlsId,
  buttonRef,
  onPromote,
}: {
  state: AssistiveWorkspaceStageState;
  controlsId: string;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  onPromote: () => void;
}) {
  const headingId = useId();
  const summaryId = useId();
  return (
    <section
      className="assistive-stage-stub"
      data-testid="AssistiveSummaryStubCluster"
      data-visual-mode={state.visualMode}
      data-stage-mode="summary_stub"
      data-trust-state={state.trustState}
      data-selected-anchor={state.selectedAnchorRef}
      role="region"
      aria-labelledby={headingId}
      aria-describedby={summaryId}
    >
      <div className="assistive-stage-stub__copy">
        <span className="assistive-stage__eyebrow">AssistiveSummaryStub</span>
        <h3 id={headingId}>{state.summaryHeading}</h3>
        <p id={summaryId}>{state.summaryLine}</p>
      </div>
      <div className="assistive-stage-stub__facts" aria-label="Assistive summary posture">
        <span>{state.confidenceLabel}</span>
        <span>{state.provenanceLine}</span>
      </div>
      <AssistiveStagePromoter
        state={state}
        expanded={false}
        controlsId={controlsId}
        buttonRef={buttonRef}
        onPromote={onPromote}
        onCollapse={onPromote}
      />
    </section>
  );
}

export function AssistiveWorkspaceStageBindingView({
  state,
}: {
  state: AssistiveWorkspaceStageState;
}) {
  return (
    <section className="assistive-stage__binding" data-testid="AssistiveWorkspaceStageBindingView">
      <span className="assistive-stage__section-label">AssistiveWorkspaceStageBinding</span>
      <dl>
        <div>
          <dt>Stage binding</dt>
          <dd>{state.assistiveWorkspaceStageBindingRef}</dd>
        </div>
        <div>
          <dt>Workspace trust</dt>
          <dd>{state.workspaceTrustEnvelopeRef}</dd>
        </div>
        <div>
          <dt>Assistive trust</dt>
          <dd>{state.assistiveCapabilityTrustEnvelopeRef}</dd>
        </div>
        <div>
          <dt>Policy bundle</dt>
          <dd>{state.policyBundleRef}</dd>
        </div>
      </dl>
    </section>
  );
}

export function AssistiveAttentionBudgetCoordinator({
  state,
}: {
  state: AssistiveWorkspaceStageState;
}) {
  return (
    <section
      className="assistive-stage__budget"
      data-testid="AssistiveAttentionBudgetCoordinator"
      data-promotion-state={state.attentionBudget.promotionState}
      data-primary-canvas-min-width={state.attentionBudget.primaryCanvasMinWidthPx}
      role="status"
      aria-live="polite"
    >
      <span className="assistive-stage__section-label">AttentionBudget</span>
      <div>
        <strong>{state.attentionBudget.promotionState.replaceAll("_", " ")}</strong>
        <p>{state.attentionBudget.blockerLabel}</p>
      </div>
      <dl>
        <div>
          <dt>Support slot</dt>
          <dd>{state.attentionBudget.supportRegionSlot}</dd>
        </div>
        <div>
          <dt>Stage width</dt>
          <dd>{state.attentionBudget.stageWidthPx}px</dd>
        </div>
        <div>
          <dt>Canvas floor</dt>
          <dd>{state.attentionBudget.primaryCanvasMinWidthPx}px</dd>
        </div>
      </dl>
    </section>
  );
}

export function AssistiveAnchorSyncBridge({ state }: { state: AssistiveWorkspaceStageState }) {
  return (
    <section className="assistive-stage__sync" data-testid="AssistiveAnchorSyncBridge">
      <span className="assistive-stage__section-label">AssistiveAnchorSyncBridge</span>
      <dl>
        <div>
          <dt>Selected anchor</dt>
          <dd>{state.selectedAnchorRef}</dd>
        </div>
        <div>
          <dt>Insertion point</dt>
          <dd>{state.insertionPointRef}</dd>
        </div>
        <div>
          <dt>Quiet return</dt>
          <dd>{state.quietReturnTargetRef}</dd>
        </div>
      </dl>
    </section>
  );
}

export function AssistiveDecisionDockCoexistenceFrame({
  state,
}: {
  state: AssistiveWorkspaceStageState;
}) {
  return (
    <section
      className="assistive-stage__coexistence"
      data-testid="AssistiveDecisionDockCoexistenceFrame"
      data-decision-dock-coexistence="dominant_action_preserved"
    >
      <span className="assistive-stage__section-label">DecisionDock coexistence</span>
      <p>
        The stage remains subordinate to the current DecisionDock focus lease and returns insert or
        recovery intent to the existing dock lane.
      </p>
      <dl>
        <div>
          <dt>Decision dock</dt>
          <dd>{state.quietReturnTargetRef}</dd>
        </div>
        <div>
          <dt>Actionability</dt>
          <dd>{state.actionabilityState}</dd>
        </div>
      </dl>
    </section>
  );
}

export function AssistiveResponsiveFoldController({
  state,
}: {
  state: AssistiveWorkspaceStageState;
}) {
  const tabId = useId();
  const panelId = useId();
  const isFolded = state.responsive.foldState === "narrow_folded";

  if (isFolded) {
    return (
      <section
        className="assistive-stage__fold"
        data-testid="AssistiveResponsiveFoldController"
        data-responsive-mode="narrow_folded"
      >
        <span className="assistive-stage__section-label">Responsive fold</span>
        <div role="tablist" aria-label="Assistive folded stage views">
          <button
            id={tabId}
            type="button"
            role="tab"
            aria-selected="true"
            aria-controls={panelId}
            className="assistive-stage__tab"
          >
            Assistive support
          </button>
        </div>
        <div id={panelId} role="tabpanel" aria-labelledby={tabId} tabIndex={0}>
          <p>{state.responsive.foldLabel}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="assistive-stage__fold"
      data-testid="AssistiveResponsiveFoldController"
      data-responsive-mode={state.responsive.foldState}
    >
      <span className="assistive-stage__section-label">Responsive fold</span>
      <p>{state.responsive.foldLabel}</p>
    </section>
  );
}

function AssistiveStageContentWell({ state }: { state: AssistiveWorkspaceStageState }) {
  return (
    <section className="assistive-stage__content-well" data-testid="AssistiveStageContentWell">
      <span className="assistive-stage__section-label">Assistive content well</span>
      <p>{state.rationaleLine}</p>
      <div className="assistive-stage__content-list">
        {state.contentRows.map((row) => (
          <article key={row.label} className="assistive-stage__content-row">
            <strong>{row.label}</strong>
            <span>{row.value}</span>
            <p>{row.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AssistiveQueueContextPocket({ state }: { state: AssistiveWorkspaceStageState }) {
  return (
    <section className="assistive-stage__queue-pocket" data-testid="AssistiveQueueContextPocket">
      <span className="assistive-stage__section-label">Queue context</span>
      <strong>{state.patientLabel}</strong>
      <p>{state.queueContextRef}</p>
    </section>
  );
}

export function AssistiveWorkspaceStageHost({ state }: { state: AssistiveWorkspaceStageState }) {
  const panelId = useId();
  const headingId = useId();
  const collapseButtonRef = useRef<HTMLButtonElement | null>(null);
  const [stageMode, setStageMode] = useState<AssistiveWorkspaceStageMode>(state.stageMode);
  const [pinned, setPinned] = useState(state.pin.pinned);
  const effectiveMode = state.stageMode === "downgraded" ? "downgraded" : stageMode;
  const expanded = effectiveMode !== "summary_stub";
  const isFolded = effectiveMode === "folded";

  function collapseStage() {
    setStageMode("summary_stub");
  }

  function promoteStage() {
    if (state.attentionBudget.promotionAllowed) {
      setStageMode(pinned ? "pinned" : "promoted");
    }
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && expanded) {
      event.stopPropagation();
      collapseStage();
      window.requestAnimationFrame(() => collapseButtonRef.current?.focus());
    }
  }

  if (!expanded) {
    return (
      <AssistiveSummaryStubCluster
        state={state}
        controlsId={panelId}
        buttonRef={collapseButtonRef}
        onPromote={promoteStage}
      />
    );
  }

  return (
    <aside
      className={classNames(
        "assistive-stage",
        pinned && "assistive-stage--pinned",
        isFolded && "assistive-stage--folded",
      )}
      data-testid="AssistiveWorkspaceStageHost"
      data-visual-mode={state.visualMode}
      data-stage-mode={effectiveMode}
      data-fixture={state.fixture}
      data-pinned={pinned ? "true" : "false"}
      data-trust-state={state.trustState}
      data-actionability-state={state.actionabilityState}
      data-responsive-mode={state.responsive.foldState}
      data-primary-canvas-min-width={state.attentionBudget.primaryCanvasMinWidthPx}
      role="complementary"
      aria-labelledby={headingId}
      onKeyDown={handleKeyDown}
    >
      <header className="assistive-stage__header">
        <div className="assistive-stage__header-copy">
          <span className="assistive-stage__eyebrow">{state.capabilityLabel}</span>
          <h2 id={headingId}>{state.title}</h2>
          <p>{state.summaryLine}</p>
        </div>
        <span className="assistive-stage__posture-chip" data-trust-state={state.trustState}>
          {state.trustState.replaceAll("_", " ")}
        </span>
        <div className="assistive-stage__header-actions">
          <AssistiveStagePinController
            state={state}
            pinned={pinned}
            onTogglePinned={() => setPinned((current) => !current)}
          />
          <AssistiveStagePromoter
            state={state}
            expanded
            controlsId={panelId}
            buttonRef={collapseButtonRef}
            onPromote={promoteStage}
            onCollapse={collapseStage}
          />
        </div>
      </header>
      <div id={panelId} className="assistive-stage__body">
        <AssistiveWorkspaceStageBindingView state={state} />
        <AssistiveAttentionBudgetCoordinator state={state} />
        <AssistiveStageContentWell state={state} />
        <AssistiveAnchorSyncBridge state={state} />
        <AssistiveDecisionDockCoexistenceFrame state={state} />
        <AssistiveResponsiveFoldController state={state} />
        <AssistiveQueueContextPocket state={state} />
      </div>
    </aside>
  );
}
