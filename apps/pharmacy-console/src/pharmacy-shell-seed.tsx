import React, { startTransition, useEffect, useRef, useState } from "react";
import {
  CasePulse,
  ChosenPharmacyAnchorCard,
  DispatchContinuityWarningStrip,
  DispatchProofStatusStrip,
  HandoffReadinessBoard,
  EligibilityEvidenceDrawer,
  InventoryComparisonWorkspace,
  InventoryTruthPanel,
  OutcomeDecisionDock,
  PHARMACY_ACCESSIBLE_QUIET_POLISH_VISUAL_MODE,
  PHARMACY_MISSION_STACK_RECOVERY_VISUAL_MODE,
  PHARMACY_OPERATIONS_WORKBENCH_VISUAL_MODE,
  PharmacyA11yAnnouncementHub,
  PharmacyAccessibleStatusBadge,
  PharmacyCaseResumeStub,
  PharmacyFocusRouteMap,
  PharmacyCaseWorkbench,
  PharmacyContinuityFrozenOverlay,
  PharmacyReducedMotionBridge,
  PharmacyMissionStackController,
  PharmacyOperationsPanel,
  PharmacyQueuePeekDrawer,
  PharmacyRecoveryControlPanel,
  PharmacyRecoveryDecisionDock,
  PharmacyRecoveryStrip,
  PharmacyOutcomeAssurancePanel,
  PharmacyReferralConfirmationDrawer,
  PharmacySupportRegionResumeCard,
  PharmacyTargetSizeGuard,
  PharmacyWatchWindowReentryBanner,
  PharmacyWorkbenchDecisionDock,
  SharedStatusStrip,
  VecellLogoLockup,
} from "@vecells/design-system";
import {
  resolvePharmacyBounceBackRecoveryPreview,
  type PharmacyBounceBackRecoveryPreviewSnapshot,
} from "../../../packages/domains/pharmacy/src/phase6-pharmacy-bounce-back-preview";
import {
  resolvePharmacyDispatchPreview,
  type PharmacyDispatchPreviewSnapshot,
} from "../../../packages/domains/pharmacy/src/phase6-pharmacy-dispatch-preview";
import {
  resolvePharmacyEligibilityPreview,
  type PharmacyEligibilityPreviewSnapshot,
} from "../../../packages/domains/pharmacy/src/phase6-pharmacy-eligibility-preview";
import {
  resolvePharmacyOutcomeAssurancePreview,
  type PharmacyOutcomeAssurancePreviewSnapshot,
} from "../../../packages/domains/pharmacy/src/phase6-pharmacy-outcome-assurance-preview";
import {
  buildAutomationAnchorElementAttributes,
  buildAutomationSurfaceAttributes,
  resolveAutomationAnchorProfile,
} from "@vecells/persistent-shell";
import {
  PHARMACY_DEFAULT_PATH,
  PHARMACY_SHELL_TASK_ID,
  PHARMACY_SHELL_VISUAL_MODE,
  createInitialPharmacyShellState,
  navigatePharmacyShell,
  openPharmacyCase,
  openPharmacyChildRoute,
  pharmacyCheckpointAndProofMatrixRows,
  pharmacyRouteContractSeedRows,
  resolvePharmacyShellSnapshot,
  returnFromPharmacyChildRoute,
  selectPharmacyCheckpoint,
  selectPharmacyLineItem,
  type PharmacyCaseSeed,
  type PharmacyChildRouteKey,
  type PharmacyCheckpoint,
  type PharmacyRouteKey,
  type PharmacyShellSnapshot,
  type PharmacyShellState,
} from "./pharmacy-shell-seed.model";
import {
  resolvePharmacyWorkbenchViewModels,
} from "./pharmacy-workbench.model";

function titleCase(value: string): string {
  return value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function routeLabel(routeKey: PharmacyRouteKey): string {
  switch (routeKey) {
    case "lane":
      return "Queue";
    case "case":
      return "Workbench";
    case "validate":
      return "Validate";
    case "inventory":
      return "Inventory";
    case "resolve":
      return "Resolve";
    case "handoff":
      return "Handoff";
    case "assurance":
      return "Assurance";
  }
}

function buildPharmacyAnnouncementState(input: {
  snapshot: PharmacyShellSnapshot;
  supportRegionLabel: string;
  selectedAnchorLabel: string;
  recoverySummary: string;
  shouldEscalate: boolean;
}) {
  return {
    politeAnnouncement: [
      routeLabel(input.snapshot.location.routeKey),
      input.snapshot.currentCase.patientLabel,
      `Selected anchor ${input.selectedAnchorLabel}.`,
      `Promoted support ${input.supportRegionLabel}.`,
    ].join(". "),
    assertiveAnnouncement: input.shouldEscalate ? input.recoverySummary : null,
  };
}

function queueToneLabel(queueTone: PharmacyCaseSeed["queueTone"]): string {
  switch (queueTone) {
    case "success":
      return "Ready";
    case "watch":
      return "Watch";
    case "caution":
      return "Guarded";
    case "critical":
      return "Critical";
  }
}

function queueToneBadge(queueTone: PharmacyCaseSeed["queueTone"]) {
  switch (queueTone) {
    case "success":
      return "ready" as const;
    case "watch":
      return "watch" as const;
    case "caution":
      return "guarded" as const;
    case "critical":
      return "blocked" as const;
  }
}

function checkpointTone(checkpoint: PharmacyCheckpoint["state"]): string {
  switch (checkpoint) {
    case "satisfied":
      return "ready";
    case "pending":
      return "neutral";
    case "watch":
      return "guarded";
    case "review_required":
      return "review";
    case "blocked":
      return "blocked";
  }
}

function workbenchTone(
  posture: PharmacyCaseSeed["workbenchPosture"],
): "ready" | "guarded" | "read_only" | "reopen" {
  switch (posture) {
    case "ready":
      return "ready";
    case "guarded":
      return "guarded";
    case "read_only":
      return "read_only";
    case "reopen_for_safety":
      return "reopen";
  }
}

function artifactModeForSnapshot(snapshot: PharmacyShellSnapshot): string {
  switch (snapshot.visualizationMode) {
    case "chart_plus_table":
      return "interactive_live";
    case "table_only":
      return "table_only";
    case "summary_only":
      return "summary_only";
  }
}

function visualizationAuthorityForSnapshot(
  snapshot: PharmacyShellSnapshot,
): "visual_table_summary" | "table_only" | "summary_only" {
  switch (snapshot.visualizationMode) {
    case "chart_plus_table":
      return "visual_table_summary";
    case "table_only":
      return "table_only";
    case "summary_only":
      return "summary_only";
  }
}

function primaryRouteForCheckpoint(checkpointId: string): PharmacyChildRouteKey {
  switch (checkpointId) {
    case "inventory":
      return "inventory";
    case "dispatch":
      return "handoff";
    case "outcome":
      return "resolve";
    case "consent":
    case "validation":
    default:
      return "validate";
  }
}

function routeSummaryEyebrow(routeKey: PharmacyRouteKey): string {
  switch (routeKey) {
    case "lane":
      return "Queue spine";
    case "case":
      return "Validation board";
    case "validate":
      return "Checkpoint review";
    case "inventory":
      return "Inventory truth";
    case "resolve":
      return "Outcome truth";
    case "handoff":
      return "Dispatch proof";
    case "assurance":
      return "Assurance and reopen";
  }
}

function promotedSupportRegionForRoute(input: {
  routeKey: PharmacyRouteKey;
  hasEligibilityPreview: boolean;
  hasRecoveryPreview: boolean;
  hasAssurancePreview: boolean;
}):
  | "operations_queue"
  | "inventory_truth"
  | "eligibility_evidence"
  | "inventory_comparison"
  | "outcome_truth"
  | "handoff_readiness"
  | "outcome_assurance"
  | "bounce_back_recovery" {
  if (input.routeKey === "lane") {
    return "operations_queue";
  }
  if (input.routeKey === "case") {
    return "inventory_truth";
  }
  if (input.routeKey === "validate") {
    return input.hasEligibilityPreview ? "eligibility_evidence" : "inventory_truth";
  }
  if (input.routeKey === "inventory") {
    return "inventory_comparison";
  }
  if (input.routeKey === "resolve") {
    return "outcome_truth";
  }
  if (input.routeKey === "handoff") {
    return "handoff_readiness";
  }
  if (input.hasRecoveryPreview) {
    return "bounce_back_recovery";
  }
  if (input.hasAssurancePreview) {
    return "outcome_assurance";
  }
  return "outcome_truth";
}

function supportRegionLabelForKey(
  key:
    | "operations_queue"
    | "inventory_truth"
    | "eligibility_evidence"
    | "inventory_comparison"
    | "outcome_truth"
    | "handoff_readiness"
    | "outcome_assurance"
    | "bounce_back_recovery",
): string {
  switch (key) {
    case "operations_queue":
      return "Operations queue";
    case "inventory_truth":
      return "Inventory truth";
    case "eligibility_evidence":
      return "Eligibility evidence";
    case "inventory_comparison":
      return "Inventory comparison";
    case "outcome_truth":
      return "Outcome truth";
    case "handoff_readiness":
      return "Handoff readiness";
    case "outcome_assurance":
      return "Outcome assurance";
    case "bounce_back_recovery":
      return "Bounce-back recovery";
  }
}

function toneForRecoveryPosture(
  posture: PharmacyShellSnapshot["recoveryPosture"],
  routeShellPosture: PharmacyShellSnapshot["routeShellPosture"],
  watchWindowState: "clear" | "watch" | "blocked",
  providerHealthState: "nominal" | "degraded" | "outage",
): "ready" | "watch" | "review" | "blocked" {
  if (posture === "blocked" || posture === "recovery_only") {
    return "blocked";
  }
  if (providerHealthState === "outage" || watchWindowState === "blocked") {
    return "blocked";
  }
  if (routeShellPosture === "shell_read_only" || posture === "read_only") {
    return "review";
  }
  if (providerHealthState === "degraded" || watchWindowState === "watch") {
    return "watch";
  }
  return "ready";
}

const PHARMACY_CONTINUITY_STORAGE_KEY = "vecell:pharmacy-shell:continuity:v2";

interface PharmacyPersistedPathState {
  pathname: string;
  selectedCaseId: string;
  activeCheckpointId: string;
  activeLineItemId: string;
  scrollY: number;
}

interface PharmacyPersistedShellState {
  routes: Record<string, PharmacyPersistedPathState>;
}

function readPersistedShellState(): PharmacyPersistedShellState {
  if (typeof window === "undefined") {
    return { routes: {} };
  }
  try {
    const raw = window.sessionStorage.getItem(PHARMACY_CONTINUITY_STORAGE_KEY);
    if (!raw) {
      return { routes: {} };
    }
    const parsed = JSON.parse(raw) as PharmacyPersistedShellState;
    return parsed && typeof parsed === "object" && parsed.routes ? parsed : { routes: {} };
  } catch {
    return { routes: {} };
  }
}

function writePersistedShellState(state: PharmacyPersistedShellState): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(
    PHARMACY_CONTINUITY_STORAGE_KEY,
    JSON.stringify(state),
  );
}

function persistPathState(nextState: PharmacyShellState, scrollY: number): void {
  if (typeof window === "undefined") {
    return;
  }
  const persisted = readPersistedShellState();
  persisted.routes[nextState.location.pathname] = {
    pathname: nextState.location.pathname,
    selectedCaseId: nextState.selectedCaseId,
    activeCheckpointId: nextState.activeCheckpointId,
    activeLineItemId: nextState.activeLineItemId,
    scrollY,
  };
  writePersistedShellState(persisted);
}

function restoreInitialShellState(pathname: string): PharmacyShellState {
  if (typeof window === "undefined") {
    return createInitialPharmacyShellState(pathname);
  }
  const persisted = readPersistedShellState().routes[pathname];
  return createInitialPharmacyShellState(pathname, {
    selectedCaseId: persisted?.selectedCaseId,
    activeCheckpointId: persisted?.activeCheckpointId,
    activeLineItemId: persisted?.activeLineItemId,
  });
}

function PharmacyDispatchRouteSurface(props: {
  preview: PharmacyDispatchPreviewSnapshot;
  handoffBoard: Parameters<typeof HandoffReadinessBoard>[0]["board"];
  onReturn: () => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <section
      className="pharmacy-support-card"
      data-testid="pharmacy-handoff-route"
      data-dispatch-surface-state={props.preview.surfaceState}
      aria-label="Dispatch proof"
    >
      <header className="pharmacy-support-card__header">
        <div>
          <p className="pharmacy-shell__eyebrow">Dispatch proof</p>
          <h3>{props.preview.statusStrip.title}</h3>
        </div>
        <button
          type="button"
          className="pharmacy-link"
          data-testid="pharmacy-return-button"
          onClick={props.onReturn}
        >
          Return via proof anchor
        </button>
      </header>
      <p className="pharmacy-support-card__summary">{props.preview.drawerSummary}</p>
      {props.preview.continuityWarning ? (
        <DispatchContinuityWarningStrip warning={props.preview.continuityWarning} />
      ) : null}
      <DispatchProofStatusStrip status={props.preview.statusStrip} />
      <ChosenPharmacyAnchorCard
        anchor={props.preview.chosenPharmacy}
        compact
        footer={
          <PharmacyTargetSizeGuard minSizePx={44}>
            <button
              type="button"
              className="pharmacy-button"
              data-testid="open-referral-confirmation-drawer"
              aria-haspopup="dialog"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              Open referral confirmation drawer
            </button>
          </PharmacyTargetSizeGuard>
        }
      />
      <PharmacyReferralConfirmationDrawer
        open={drawerOpen}
        title={props.preview.drawerTitle}
        summary={props.preview.drawerSummary}
        transportLabel={props.preview.transportLabel}
        pathwayLabel={props.preview.pathwayLabel}
        referralSummary={props.preview.referralSummary}
        anchor={props.preview.chosenPharmacy}
        statusStrip={props.preview.statusStrip}
        evidenceRows={props.preview.evidenceRows}
        artifactSummary={props.preview.artifactSummary}
        onClose={() => setDrawerOpen(false)}
      />
      <HandoffReadinessBoard board={props.handoffBoard} />
    </section>
  );
}

function PharmacyAssuranceRouteSurface(props: {
  preview: PharmacyOutcomeAssurancePreviewSnapshot;
  onReturn: () => void;
}) {
  return (
    <section
      className="pharmacy-assurance-route-shell"
      data-testid="pharmacy-assurance-route"
      data-assurance-visual-mode={props.preview.visualMode}
      data-assurance-surface-state={props.preview.surfaceState}
      data-assurance-gate-state={props.preview.gateBinding.gateState}
      aria-label="Outcome assurance and reconciliation"
    >
      <header className="pharmacy-support-card__header">
        <div>
          <p className="pharmacy-shell__eyebrow">Outcome assurance</p>
          <h3>{props.preview.header.title}</h3>
        </div>
        <button
          type="button"
          className="pharmacy-link"
          data-testid="pharmacy-return-button"
          onClick={props.onReturn}
        >
          Return via same case anchor
        </button>
      </header>
      <PharmacyOutcomeAssurancePanel preview={props.preview} />
    </section>
  );
}

function PharmacyRecoveryRouteSurface(props: {
  preview: PharmacyBounceBackRecoveryPreviewSnapshot;
  onReturn: () => void;
}) {
  return (
    <section
      className="pharmacy-assurance-route-shell"
      data-testid="pharmacy-assurance-route"
      data-recovery-visual-mode={props.preview.visualMode}
      data-recovery-surface-state={props.preview.surfaceState}
      data-recovery-bounce-back-type={props.preview.bounceBackBinding.bounceBackType}
      data-recovery-reopened-case-status={props.preview.truthBinding.reopenedCaseStatus}
      aria-label="Bounce-back and reopen recovery"
    >
      <header className="pharmacy-support-card__header">
        <div>
          <p className="pharmacy-shell__eyebrow">Recovery control</p>
          <h3>{props.preview.banner.title}</h3>
        </div>
        <button
          type="button"
          className="pharmacy-link"
          data-testid="pharmacy-return-button"
          onClick={props.onReturn}
        >
          Return via same case anchor
        </button>
      </header>
      <PharmacyRecoveryControlPanel
        preview={props.preview}
        onOpenOriginalRequest={props.onReturn}
      />
    </section>
  );
}

function ChildRoutePanel(props: {
  snapshot: PharmacyShellSnapshot;
  state: PharmacyShellState;
  eligibilityPreview: PharmacyEligibilityPreviewSnapshot | null;
  recoveryPreview: PharmacyBounceBackRecoveryPreviewSnapshot | null;
  assurancePreview: PharmacyOutcomeAssurancePreviewSnapshot | null;
  onOpenChildRoute: (routeKey: PharmacyChildRouteKey) => void;
  onReturn: () => void;
}) {
  const { snapshot } = props;
  const currentCase = snapshot.currentCase;
  const returnToken = props.state.returnToken;
  const dispatchPreview = resolvePharmacyDispatchPreview(currentCase.pharmacyCaseId);
  const workbenchView = resolvePharmacyWorkbenchViewModels(snapshot);

  if (
    props.eligibilityPreview &&
    snapshot.location.routeKey === "validate"
  ) {
    return (
      <EligibilityEvidenceDrawer
        preview={props.eligibilityPreview}
        defaultExpanded={snapshot.location.routeKey === "validate"}
      />
    );
  }

  if (snapshot.location.routeKey === "inventory") {
    return (
      <section data-testid="pharmacy-inventory-route" aria-label="Inventory review">
        <InventoryTruthPanel panel={workbenchView.inventoryTruthPanel} />
        <InventoryComparisonWorkspace
          workspace={workbenchView.inventoryComparisonWorkspace}
        />
        <button
          type="button"
          className="pharmacy-link"
          data-testid="pharmacy-return-button"
          onClick={props.onReturn}
        >
          Return via {returnToken?.returnTokenId ?? "PRT"}
        </button>
      </section>
    );
  }

  if (snapshot.location.routeKey === "validate") {
    return (
      <section className="pharmacy-support-card" data-testid="pharmacy-validate-route" aria-label="Checkpoint review">
        <header className="pharmacy-support-card__header">
          <div>
            <p className="pharmacy-shell__eyebrow">Checkpoint review</p>
            <h3>{snapshot.activeCheckpoint.label}</h3>
          </div>
          <button
            type="button"
            className="pharmacy-link"
            data-testid="pharmacy-return-button"
            onClick={props.onReturn}
          >
            Return via {returnToken?.returnTokenId ?? "PRT"}
          </button>
        </header>
        <p className="pharmacy-support-card__summary">{currentCase.checkpointQuestion}</p>
        <dl className="pharmacy-definition-list">
          <div>
            <dt>Evidence basis</dt>
            <dd>{snapshot.activeCheckpoint.evidenceLabel}</dd>
          </div>
          <div>
            <dt>Current state</dt>
            <dd>{titleCase(snapshot.activeCheckpoint.state)}</dd>
          </div>
          <div>
            <dt>Watch window</dt>
            <dd>{currentCase.watchWindowSummary}</dd>
          </div>
          <div>
            <dt>Support region</dt>
            <dd>{currentCase.supportSummary}</dd>
          </div>
        </dl>
      </section>
    );
  }

  if (snapshot.location.routeKey === "resolve") {
    return (
      <section className="pharmacy-support-card" data-testid="pharmacy-resolve-route" aria-label="Outcome resolution">
        <header className="pharmacy-support-card__header">
          <div>
            <p className="pharmacy-shell__eyebrow">Outcome truth</p>
            <h3>{currentCase.outcomeTruth.summary}</h3>
          </div>
          <button
            type="button"
            className="pharmacy-link"
            data-testid="pharmacy-return-button"
            onClick={props.onReturn}
          >
            Return via {returnToken?.returnTokenId ?? "PRT"}
          </button>
        </header>
        <div className="pharmacy-signal-grid">
          <article className="pharmacy-signal-card" data-tone="review">
            <span>Outcome truth</span>
            <strong>{titleCase(currentCase.outcomeTruth.outcomeTruthState)}</strong>
            <p>{currentCase.outcomeTruth.summary}</p>
          </article>
          <article className="pharmacy-signal-card" data-tone="guarded">
            <span>Confidence</span>
            <strong>{currentCase.outcomeTruth.matchConfidenceLabel}</strong>
            <p>Weak match and manual-review debt stay explicit instead of tinting the shell as quietly resolved.</p>
          </article>
          <article className="pharmacy-signal-card" data-tone="review">
            <span>Manual review</span>
            <strong>{titleCase(currentCase.outcomeTruth.manualReviewState)}</strong>
            <p>{currentCase.reopenSummary}</p>
          </article>
        </div>
      </section>
    );
  }

  if (snapshot.location.routeKey === "handoff") {
    if (dispatchPreview) {
      return (
        <PharmacyDispatchRouteSurface
          preview={dispatchPreview}
          handoffBoard={workbenchView.handoffReadinessBoard}
          onReturn={props.onReturn}
        />
      );
    }
    return <HandoffReadinessBoard board={workbenchView.handoffReadinessBoard} />;
  }

  if (snapshot.location.routeKey === "assurance") {
    if (props.recoveryPreview) {
      return (
        <PharmacyRecoveryRouteSurface
          preview={props.recoveryPreview}
          onReturn={props.onReturn}
        />
      );
    }
    if (props.assurancePreview) {
      return (
        <PharmacyAssuranceRouteSurface
          preview={props.assurancePreview}
          onReturn={props.onReturn}
        />
      );
    }
    return (
      <section className="pharmacy-support-card" data-testid="pharmacy-assurance-route" aria-label="Assurance and reopen">
        <header className="pharmacy-support-card__header">
          <div>
            <p className="pharmacy-shell__eyebrow">Reopen and assurance</p>
            <h3>{currentCase.reopenSummary}</h3>
          </div>
          <button
            type="button"
            className="pharmacy-link"
            data-testid="pharmacy-return-button"
            onClick={props.onReturn}
          >
            Return via {returnToken?.returnTokenId ?? "PRT"}
          </button>
        </header>
        <div className="pharmacy-assurance-grid">
          <article className="pharmacy-signal-card" data-tone="blocked">
            <span>Watch window</span>
            <strong>{currentCase.watchWindowSummary}</strong>
            <p>Late handoff or return signals reopen the same shell rather than creating an unbound follow-up page.</p>
          </article>
          <article className="pharmacy-signal-card" data-tone="review">
            <span>Outcome posture</span>
            <strong>{titleCase(currentCase.outcomeTruth.outcomeTruthState)}</strong>
            <p>{currentCase.outcomeTruth.summary}</p>
          </article>
          <article className="pharmacy-signal-card" data-tone="review">
            <span>Recovery consequence</span>
            <strong>{titleCase(currentCase.workbenchPosture)}</strong>
            <p>{currentCase.supportSummary}</p>
          </article>
        </div>
      </section>
    );
  }

  return <InventoryTruthPanel panel={workbenchView.inventoryTruthPanel} />;
}

export function PharmacyRouteRecoveryFrame({
  snapshot,
  tone,
  recoveryOwnerLabel,
  forceVisible,
  onPrimaryAction,
  onSecondaryAction,
}: {
  snapshot: PharmacyShellSnapshot;
  tone: "ready" | "watch" | "review" | "blocked";
  recoveryOwnerLabel: string;
  forceVisible?: boolean;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
}) {
  if (
    !forceVisible &&
    snapshot.recoveryPosture === "live" &&
    snapshot.routeShellPosture === "shell_live"
  ) {
    return null;
  }

  return (
    <div
      data-testid="PharmacyRouteRecoveryFrame"
      data-recovery-posture={snapshot.recoveryPosture}
      data-route-shell-posture={snapshot.routeShellPosture}
    >
      <PharmacyRecoveryStrip
        strip={{
          tone,
          title:
            snapshot.routeShellPosture === "shell_recovery"
              ? "Recovery-only posture is active"
              : "Read-only truth fence is active",
          summary:
            snapshot.routeShellPosture === "shell_recovery"
              ? snapshot.currentCase.reopenSummary
              : snapshot.currentCase.queueSummary,
          postureLabel: titleCase(snapshot.recoveryPosture),
          recoveryOwnerLabel,
          primaryActionLabel:
            snapshot.location.routeKey === "assurance"
              ? "Return to case"
              : snapshot.recoveryPosture === "recovery_only"
                ? "Open recovery region"
                : "Open support region",
          secondaryActionLabel:
            snapshot.location.routeKey === "assurance" ? undefined : "Return to case root",
        }}
        onPrimaryAction={onPrimaryAction}
        onSecondaryAction={onSecondaryAction}
      />
    </div>
  );
}

export function PharmacyCasePulseHost({
  snapshot,
}: {
  snapshot: PharmacyShellSnapshot;
}) {
  return (
    <section data-testid="PharmacyCasePulseHost">
      <CasePulse pulse={snapshot.casePulse} />
    </section>
  );
}

export function PharmacyChosenProviderAnchor({
  snapshot,
}: {
  snapshot: PharmacyShellSnapshot;
}) {
  return (
    <section
      className="pharmacy-panel pharmacy-panel--anchor"
      data-testid="PharmacyChosenProviderAnchor"
      data-anchor-kind="chosen_provider"
    >
      <header className="pharmacy-panel__header">
        <div>
          <p className="pharmacy-shell__eyebrow">Chosen provider anchor</p>
          <h3>{snapshot.currentCase.providerLabel}</h3>
        </div>
        <span className="pharmacy-pill" data-tone={queueToneLabel(snapshot.currentCase.queueTone).toLowerCase()}>
          {snapshot.currentCase.queueLane}
        </span>
      </header>
      <p>{snapshot.currentCase.supportSummary}</p>
      <div className="pharmacy-chip-row">
        <span className="pharmacy-chip">{snapshot.currentCase.pathwayLabel}</span>
        <span className="pharmacy-chip">{snapshot.currentCase.dueLabel}</span>
      </div>
    </section>
  );
}

export function PharmacyQueueSpineHost(props: {
  snapshot: PharmacyShellSnapshot;
  onNavigate: (path: string) => void;
  onOpenCase: (pharmacyCaseId: string) => void;
  selectedAnchorBinding?: ReturnType<typeof resolveAutomationAnchorProfile>["markerBindings"][number];
}) {
  const { snapshot } = props;
  const workbenchView = resolvePharmacyWorkbenchViewModels(snapshot);

  return (
    <aside
      className="pharmacy-shell__queue"
      aria-label="Pharmacy queue spine"
      data-testid="PharmacyQueueSpineHost"
      data-queue-selected-case={snapshot.currentCase.pharmacyCaseId}
    >
      <PharmacyOperationsPanel
        panel={workbenchView.operationsPanel}
        onOpenCase={props.onOpenCase}
      />
      <button
        type="button"
        className="pharmacy-link"
        data-testid="pharmacy-route-button-lane"
        onClick={() => props.onNavigate(PHARMACY_DEFAULT_PATH)}
        {...(props.selectedAnchorBinding
          ? buildAutomationAnchorElementAttributes(props.selectedAnchorBinding, {
              instanceKey: snapshot.currentCase.pharmacyCaseId,
            })
          : {})}
      >
        Keep queue root pinned
      </button>
    </aside>
  );
}

export function PharmacyCheckpointRail(props: {
  snapshot: PharmacyShellSnapshot;
  onSelectCheckpoint: (checkpointId: string) => void;
}) {
  const { snapshot } = props;

  return (
    <section
      className="pharmacy-checkpoint-rail"
      aria-label="Checkpoint rail"
      data-testid="PharmacyCheckpointRail"
    >
      <header className="pharmacy-panel__header">
        <div>
          <p className="pharmacy-shell__eyebrow">Checkpoint rail</p>
          <h3>Safety and consequence remain visible</h3>
        </div>
      </header>
      <ol className="pharmacy-checkpoint-list">
        {snapshot.currentCase.checkpoints.map((checkpoint) => (
          <li key={checkpoint.checkpointId}>
            <button
              type="button"
              className="pharmacy-checkpoint"
              data-testid={`pharmacy-checkpoint-${checkpoint.checkpointId}`}
              data-selected={checkpoint.checkpointId === snapshot.activeCheckpoint.checkpointId}
              data-tone={checkpointTone(checkpoint.state)}
              onClick={() => props.onSelectCheckpoint(checkpoint.checkpointId)}
            >
              <div>
                <strong>{checkpoint.label}</strong>
                <p>{checkpoint.summary}</p>
              </div>
              <span>{checkpoint.evidenceLabel}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function PharmacySupportRegionHost(props: {
  snapshot: PharmacyShellSnapshot;
  state: PharmacyShellState;
  eligibilityPreview: PharmacyEligibilityPreviewSnapshot | null;
  recoveryPreview: PharmacyBounceBackRecoveryPreviewSnapshot | null;
  assurancePreview: PharmacyOutcomeAssurancePreviewSnapshot | null;
  onOpenChildRoute: (routeKey: PharmacyChildRouteKey) => void;
  onReturn: () => void;
}) {
  const promotedSupportRegion = promotedSupportRegionForRoute({
    routeKey: props.snapshot.location.routeKey,
    hasEligibilityPreview:
      props.snapshot.location.routeKey === "validate" && Boolean(props.eligibilityPreview),
    hasRecoveryPreview:
      props.snapshot.location.routeKey === "assurance" && Boolean(props.recoveryPreview),
    hasAssurancePreview:
      props.snapshot.location.routeKey === "assurance" && Boolean(props.assurancePreview),
  });

  return (
    <section
      data-testid="PharmacySupportRegionHost"
      data-support-region={promotedSupportRegion}
      data-promoted-support-region={promotedSupportRegion}
    >
      <ChildRoutePanel
        snapshot={props.snapshot}
        state={props.state}
        eligibilityPreview={props.eligibilityPreview}
        recoveryPreview={props.recoveryPreview}
        assurancePreview={props.assurancePreview}
        onOpenChildRoute={props.onOpenChildRoute}
        onReturn={props.onReturn}
      />
    </section>
  );
}

export function PharmacyValidationBoardHost(props: {
  snapshot: PharmacyShellSnapshot;
  state: PharmacyShellState;
  eligibilityPreview: PharmacyEligibilityPreviewSnapshot | null;
  recoveryPreview: PharmacyBounceBackRecoveryPreviewSnapshot | null;
  assurancePreview: PharmacyOutcomeAssurancePreviewSnapshot | null;
  onOpenCase: (pharmacyCaseId: string) => void;
  onSelectCheckpoint: (checkpointId: string) => void;
  onSelectLineItem: (lineItemId: string) => void;
  onOpenChildRoute: (routeKey: PharmacyChildRouteKey) => void;
  onReturn: () => void;
  supportRegionContent?: React.ReactNode;
}) {
  const { snapshot } = props;
  const workbenchView = resolvePharmacyWorkbenchViewModels(snapshot);

  return (
    <main
      className="pharmacy-shell__main"
      role="main"
      data-testid="PharmacyValidationBoardHost"
      data-active-checkpoint-summary={snapshot.activeCheckpoint.summary}
    >
      <section className="pharmacy-board-hero" aria-label="Validation board">
        <div className="pharmacy-board-hero__copy">
          <p className="pharmacy-shell__eyebrow">{routeSummaryEyebrow(snapshot.location.routeKey)}</p>
          <h2>{snapshot.currentCase.caseSummary}</h2>
          <p>{snapshot.summarySentence}</p>
        </div>
        <div className="pharmacy-chip-row pharmacy-chip-row--meta">
          <PharmacyAccessibleStatusBadge
            label={snapshot.currentCase.providerLabel}
            tone="neutral"
            contextLabel="Provider"
            compact
            className="pharmacy-chip"
          />
          <PharmacyAccessibleStatusBadge
            label={snapshot.currentCase.pathwayLabel}
            tone="review"
            contextLabel="Pathway"
            compact
            className="pharmacy-chip"
          />
          <PharmacyAccessibleStatusBadge
            label={snapshot.currentCase.dueLabel}
            tone="guarded"
            contextLabel="Due"
            compact
            className="pharmacy-chip"
          />
        </div>
        <nav className="pharmacy-route-nav" aria-label="Pharmacy route posture toggles">
          <PharmacyTargetSizeGuard minSizePx={44}>
            <button
              type="button"
              className="pharmacy-route-nav__button"
              data-active={snapshot.location.routeKey === "case"}
              data-testid="pharmacy-route-button-case"
              aria-pressed={snapshot.location.routeKey === "case"}
              onClick={() => props.onOpenCase(snapshot.currentCase.pharmacyCaseId)}
            >
              Workbench
            </button>
          </PharmacyTargetSizeGuard>
          {(["validate", "inventory", "resolve", "handoff", "assurance"] as const).map((routeKey) => (
            <PharmacyTargetSizeGuard key={routeKey} minSizePx={44}>
              <button
                type="button"
                className="pharmacy-route-nav__button"
                data-active={snapshot.location.routeKey === routeKey}
                data-testid={`pharmacy-route-button-${routeKey}`}
                aria-pressed={snapshot.location.routeKey === routeKey}
                onClick={() => props.onOpenChildRoute(routeKey)}
              >
                {routeLabel(routeKey)}
              </button>
            </PharmacyTargetSizeGuard>
          ))}
        </nav>
      </section>

      <section className="pharmacy-board-grid">
        <PharmacyCheckpointRail
          snapshot={snapshot}
          onSelectCheckpoint={props.onSelectCheckpoint}
        />

        <section className="pharmacy-line-stage" aria-label="Workbench stage">
          <PharmacyCaseWorkbench
            workbench={workbenchView.caseWorkbench}
            supportRegion={
              props.supportRegionContent ?? (
                <PharmacySupportRegionHost
                  snapshot={snapshot}
                  state={props.state}
                  eligibilityPreview={props.eligibilityPreview}
                  recoveryPreview={props.recoveryPreview}
                  assurancePreview={props.assurancePreview}
                  onOpenChildRoute={props.onOpenChildRoute}
                  onReturn={props.onReturn}
                />
              )
            }
            onSelectLineItem={props.onSelectLineItem}
          />
        </section>
      </section>
    </main>
  );
}

function PharmacyMissionStackSupportRegionHost(props: {
  expanded: boolean;
  supportRegionLabel: string;
  snapshot: PharmacyShellSnapshot;
  state: PharmacyShellState;
  eligibilityPreview: PharmacyEligibilityPreviewSnapshot | null;
  recoveryPreview: PharmacyBounceBackRecoveryPreviewSnapshot | null;
  assurancePreview: PharmacyOutcomeAssurancePreviewSnapshot | null;
  onOpenChildRoute: (routeKey: PharmacyChildRouteKey) => void;
  onReturn: () => void;
  onToggle: () => void;
}) {
  return (
    <PharmacySupportRegionResumeCard
      card={{
        title: props.supportRegionLabel,
        summary:
          props.snapshot.location.routeKey === "case" || props.snapshot.location.routeKey === "lane"
            ? "Support work stays reachable as one promoted region inside the same shell."
            : props.snapshot.summarySentence,
        supportRegionLabel: props.supportRegionLabel,
        statusLabel:
          props.snapshot.location.routeKey === "case" || props.snapshot.location.routeKey === "lane"
            ? "Collapsed"
            : "Route active",
        actionLabel: props.expanded ? "Hide support region" : "Resume support region",
        expanded: props.expanded,
      }}
      onToggle={props.onToggle}
    >
      <PharmacySupportRegionHost
        snapshot={props.snapshot}
        state={props.state}
        eligibilityPreview={props.eligibilityPreview}
        recoveryPreview={props.recoveryPreview}
        assurancePreview={props.assurancePreview}
        onOpenChildRoute={props.onOpenChildRoute}
        onReturn={props.onReturn}
      />
    </PharmacySupportRegionResumeCard>
  );
}

export function PharmacyDecisionDockHost(props: {
  snapshot: PharmacyShellSnapshot;
  recoveryPreview: PharmacyBounceBackRecoveryPreviewSnapshot | null;
  assurancePreview: PharmacyOutcomeAssurancePreviewSnapshot | null;
  onOpenChildRoute: (routeKey: PharmacyChildRouteKey) => void;
  dominantActionBinding?: ReturnType<typeof resolveAutomationAnchorProfile>["markerBindings"][number];
}) {
  const { snapshot } = props;
  const workbenchView = resolvePharmacyWorkbenchViewModels(snapshot);

  if (snapshot.location.routeKey === "assurance" && props.recoveryPreview) {
    return (
      <section
        className="pharmacy-decision-dock-host--assurance"
        data-testid="PharmacyDecisionDockHost"
        data-tone={props.recoveryPreview.decisionDock.tone}
        {...(props.dominantActionBinding
          ? buildAutomationAnchorElementAttributes(props.dominantActionBinding, {
              instanceKey: snapshot.currentCase.pharmacyCaseId,
            })
          : {})}
      >
        <PharmacyRecoveryDecisionDock
          dock={props.recoveryPreview.decisionDock}
          onRouteAction={(action) => props.onOpenChildRoute(action.routeTarget)}
        />
      </section>
    );
  }

  if (snapshot.location.routeKey === "assurance" && props.assurancePreview) {
    return (
      <section
        className="pharmacy-decision-dock-host--assurance"
        data-testid="PharmacyDecisionDockHost"
        data-tone={props.assurancePreview.decisionDock.tone}
        {...(props.dominantActionBinding
          ? buildAutomationAnchorElementAttributes(props.dominantActionBinding, {
              instanceKey: snapshot.currentCase.pharmacyCaseId,
            })
          : {})}
      >
        <OutcomeDecisionDock
          dock={props.assurancePreview.decisionDock}
          onRouteAction={(action) => props.onOpenChildRoute(action.routeTarget)}
        />
      </section>
    );
  }

  return (
    <section
      className="pharmacy-decision-dock"
      data-testid="PharmacyDecisionDockHost"
      data-tone={workbenchView.decisionDock.tone}
      {...(props.dominantActionBinding
        ? buildAutomationAnchorElementAttributes(props.dominantActionBinding, {
            instanceKey: snapshot.currentCase.pharmacyCaseId,
          })
        : {})}
    >
      <PharmacyWorkbenchDecisionDock
        dock={workbenchView.decisionDock}
        onRouteAction={(action) => props.onOpenChildRoute(action.routeTarget)}
      />
    </section>
  );
}

export function PharmacyShellFrame(props: {
  state: PharmacyShellState;
  viewportWidth: number;
  onNavigate: (path: string) => void;
  onOpenCase: (pharmacyCaseId: string) => void;
  onSelectCheckpoint: (checkpointId: string) => void;
  onSelectLineItem: (lineItemId: string) => void;
  onOpenChildRoute: (routeKey: PharmacyChildRouteKey) => void;
  onReturn: () => void;
}) {
  const snapshot = resolvePharmacyShellSnapshot(props.state, props.viewportWidth);
  const eligibilityPreview = resolvePharmacyEligibilityPreview(
    snapshot.currentCase.pharmacyCaseId,
  );
  const recoveryPreview = resolvePharmacyBounceBackRecoveryPreview(
    snapshot.currentCase.pharmacyCaseId,
  );
  const assurancePreview = resolvePharmacyOutcomeAssurancePreview(
    snapshot.currentCase.pharmacyCaseId,
  );
  const dispatchPreview = resolvePharmacyDispatchPreview(snapshot.currentCase.pharmacyCaseId);
  const workbenchView = resolvePharmacyWorkbenchViewModels(snapshot);
  const promotedSupportRegion = promotedSupportRegionForRoute({
    routeKey: snapshot.location.routeKey,
    hasEligibilityPreview:
      snapshot.location.routeKey === "validate" && Boolean(eligibilityPreview),
    hasRecoveryPreview:
      snapshot.location.routeKey === "assurance" && Boolean(recoveryPreview),
    hasAssurancePreview:
      snapshot.location.routeKey === "assurance" && Boolean(assurancePreview),
  });
  const automationProfile = resolveAutomationAnchorProfile(props.state.location.routeFamilyRef);
  const selectedAnchorBinding = automationProfile.markerBindings.find(
    (binding) => binding.markerClass === "selected_anchor",
  );
  const dominantActionBinding = automationProfile.markerBindings.find(
    (binding) => binding.markerClass === "dominant_action",
  );
  const focusRestoreBinding = automationProfile.markerBindings.find(
    (binding) => binding.markerClass === "focus_restore",
  );
  const rootAutomationAttributes = buildAutomationSurfaceAttributes(automationProfile, {
    selectedAnchorRef: props.state.continuitySnapshot.selectedAnchor.anchorId,
    focusRestoreRef: props.state.activeLineItemId,
    dominantActionRef: dominantActionBinding?.markerRef ?? snapshot.currentCase.pharmacyCaseId,
    artifactModeState: artifactModeForSnapshot(snapshot),
    recoveryPosture: snapshot.recoveryPosture,
    visualizationAuthority: visualizationAuthorityForSnapshot(snapshot),
    routeShellPosture: snapshot.routeShellPosture,
  });
  const breakpointClass =
    props.viewportWidth < 720 ? "compact" : snapshot.layoutMode === "mission_stack" ? "narrow" : "wide";
  const isMissionStack = snapshot.layoutMode === "mission_stack";
  const childRouteActive =
    snapshot.location.routeKey !== "lane" && snapshot.location.routeKey !== "case";
  const supportRegionLabel = supportRegionLabelForKey(promotedSupportRegion);
  const recoveryOwnerLabel = snapshot.currentCase.recoveryOwnerLabel ?? "Pharmacy console";
  const [queuePeekOpen, setQueuePeekOpen] = useState(false);
  const [supportResumeOpen, setSupportResumeOpen] = useState(childRouteActive);
  const supportRegionRef = useRef<HTMLDivElement | null>(null);
  const proofRiskState = dispatchPreview?.truthBinding.proofRiskState ?? "on_track";
  const recoveryTone = toneForRecoveryPosture(
    snapshot.recoveryPosture,
    snapshot.routeShellPosture,
    workbenchView.watchWindowState,
    workbenchView.providerHealthState,
  );
  const shouldShowRecoveryStrip =
    snapshot.recoveryPosture !== "live" ||
    snapshot.routeShellPosture !== "shell_live" ||
    workbenchView.providerHealthState !== "nominal" ||
    workbenchView.watchWindowState !== "clear" ||
    proofRiskState !== "on_track";
  const showFrozenOverlay =
    isMissionStack &&
    snapshot.location.routeKey !== "assurance" &&
    (snapshot.routeShellPosture !== "shell_live" || snapshot.recoveryPosture !== "live");
  const showWatchWindowReentry =
    isMissionStack &&
    snapshot.location.routeKey !== "assurance" &&
    workbenchView.watchWindowState !== "clear";
  const missionStackSupportExpanded = childRouteActive || supportResumeOpen;

  useEffect(() => {
    if (!isMissionStack && queuePeekOpen) {
      setQueuePeekOpen(false);
    }
  }, [isMissionStack, queuePeekOpen]);

  useEffect(() => {
    if (childRouteActive) {
      setSupportResumeOpen(true);
    }
  }, [childRouteActive, snapshot.location.pathname]);

  useEffect(() => {
    if (!isMissionStack || !missionStackSupportExpanded) {
      return;
    }
    supportRegionRef.current?.scrollIntoView({
      block: "start",
      behavior:
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [isMissionStack, missionStackSupportExpanded]);

  let recoveryTitle = "Recovery watch is active";
  let recoverySummary = snapshot.currentCase.watchWindowSummary;
  if (snapshot.routeShellPosture === "shell_recovery") {
    recoveryTitle = "Recovery-only posture is active";
    recoverySummary = snapshot.currentCase.reopenSummary;
  } else if (workbenchView.providerHealthState === "outage") {
    recoveryTitle = "Provider outage is holding this case";
    recoverySummary = snapshot.currentCase.queueSummary;
  } else if (proofRiskState === "likely_failed") {
    recoveryTitle = "Dispatch proof drift is blocking release";
    recoverySummary = snapshot.currentCase.proofSummary;
  } else if (snapshot.routeShellPosture === "shell_read_only") {
    recoveryTitle = "Read-only truth fence is active";
    recoverySummary = snapshot.currentCase.queueSummary;
  } else if (workbenchView.watchWindowState === "blocked") {
    recoveryTitle = "Watch window re-entry is required";
    recoverySummary = snapshot.currentCase.watchWindowSummary;
  } else if (
    workbenchView.providerHealthState === "degraded" ||
    workbenchView.watchWindowState === "watch" ||
    proofRiskState === "at_risk"
  ) {
    recoveryTitle = "Recovery watch is active";
    recoverySummary = snapshot.currentCase.watchWindowSummary;
  }

  const missionStackSupportRegion = (
    <div ref={supportRegionRef} className="pharmacy-shell__mission-support-region">
      <PharmacyMissionStackSupportRegionHost
        expanded={missionStackSupportExpanded}
        supportRegionLabel={supportRegionLabel}
        snapshot={snapshot}
        state={props.state}
        eligibilityPreview={eligibilityPreview}
        recoveryPreview={recoveryPreview}
        assurancePreview={assurancePreview}
        onOpenChildRoute={(routeKey) => {
          setQueuePeekOpen(false);
          setSupportResumeOpen(true);
          props.onOpenChildRoute(routeKey);
        }}
        onReturn={() => {
          setQueuePeekOpen(false);
          setSupportResumeOpen(true);
          props.onReturn();
        }}
        onToggle={() => setSupportResumeOpen((current) => !current)}
      />
    </div>
  );
  const pharmacyAnnouncementState = buildPharmacyAnnouncementState({
    snapshot,
    supportRegionLabel,
    selectedAnchorLabel: props.state.continuitySnapshot.selectedAnchor.lastKnownLabel,
    recoverySummary,
    shouldEscalate: shouldShowRecoveryStrip && recoveryTone === "blocked",
  });

  return (
    <div
      className={`pharmacy-shell pharmacy-shell--${snapshot.layoutMode}`}
      data-testid="pharmacy-shell-root"
      data-layout-topology={snapshot.layoutMode}
      data-breakpoint-class={breakpointClass}
      data-task-id={PHARMACY_SHELL_TASK_ID}
      data-visual-mode={PHARMACY_SHELL_VISUAL_MODE}
      data-current-path={snapshot.location.pathname}
      data-route-family={snapshot.location.routeFamilyRef}
      data-layout-mode={snapshot.layoutMode}
      data-route-key={snapshot.location.routeKey}
      data-visualization-mode={snapshot.visualizationMode}
      data-selected-case-id={snapshot.currentCase.pharmacyCaseId}
      data-workbench-visual-mode={PHARMACY_OPERATIONS_WORKBENCH_VISUAL_MODE}
      data-workbench-stock-risk={workbenchView.stockRiskBand}
      data-workbench-watch-state={workbenchView.watchWindowState}
      data-workbench-provider-health={workbenchView.providerHealthState}
      data-workbench-settlement-state={workbenchView.settlementState}
      data-workbench-handoff-state={workbenchView.handoffState}
      data-decision-tuple-hash={eligibilityPreview?.decisionTupleHash}
      data-eligibility-bundle-id={eligibilityPreview?.explanationBundle.bundleId}
      data-eligibility-final-disposition={eligibilityPreview?.finalDisposition}
      data-eligibility-publication-state={eligibilityPreview?.publicationState}
      data-eligibility-rule-pack-version={eligibilityPreview?.policyPack.versionLabel}
      data-dispatch-visual-mode={dispatchPreview?.visualMode ?? "none"}
      data-dispatch-surface-state={dispatchPreview?.surfaceState ?? "none"}
      data-dispatch-authoritative-proof-state={
        dispatchPreview?.truthBinding.authoritativeProofState ?? "none"
      }
      data-dispatch-proof-risk-state={dispatchPreview?.truthBinding.proofRiskState ?? "none"}
      data-consent-checkpoint-state={dispatchPreview?.consentBinding.checkpointState ?? "none"}
      data-consent-continuity-state={dispatchPreview?.consentBinding.continuityState ?? "none"}
      data-dispatch-warning-kind={dispatchPreview?.continuityWarning?.kind ?? "none"}
      data-recovery-visual-mode={recoveryPreview?.visualMode ?? "none"}
      data-recovery-surface-state={recoveryPreview?.surfaceState ?? "none"}
      data-recovery-bounce-back-type={
        recoveryPreview?.bounceBackBinding.bounceBackType ?? "none"
      }
      data-recovery-reopened-case-status={
        recoveryPreview?.truthBinding.reopenedCaseStatus ?? "none"
      }
      data-recovery-loop-risk-band={
        recoveryPreview
          ? recoveryPreview.loopSupervisorBinding.loopRisk === null
            ? "none"
            : recoveryPreview.loopSupervisorBinding.loopRisk >= 0.8
              ? "critical"
              : recoveryPreview.loopSupervisorBinding.loopRisk >= 0.6
                ? "high"
                : recoveryPreview.loopSupervisorBinding.loopRisk >= 0.35
                  ? "watch"
                  : "low"
          : "none"
      }
      data-recovery-priority-band={
        recoveryPreview?.truthBinding.reopenPriorityBand ?? "none"
      }
      data-recovery-notification-state={
        recoveryPreview?.truthBinding.patientNotificationState ?? "none"
      }
      data-recovery-urgent-mode={
        recoveryPreview
          ? recoveryPreview.urgentRouteBinding?.routeClass ?? "routine_or_escalated"
          : "none"
      }
      data-assurance-visual-mode={assurancePreview?.visualMode ?? "none"}
      data-assurance-surface-state={assurancePreview?.surfaceState ?? "none"}
      data-assurance-outcome-truth-state={
        assurancePreview?.truthBinding.outcomeTruthState ?? "none"
      }
      data-assurance-manual-review-state={
        assurancePreview?.truthBinding.manualReviewState ?? "none"
      }
      data-assurance-gate-state={assurancePreview?.gateBinding.gateState ?? "none"}
      data-assurance-close-eligibility-state={
        assurancePreview?.truthBinding.closeEligibilityState ?? "none"
      }
      data-assurance-confidence-band={
        assurancePreview?.truthBinding.matchConfidenceBand ?? "none"
      }
      data-selected-case-anchor={props.state.continuitySnapshot.selectedAnchor.anchorId}
      data-selected-checkpoint-id={snapshot.activeCheckpoint.checkpointId}
      data-selected-line-item-id={snapshot.activeLineItem.lineItemId}
      data-active-checkpoint-summary={snapshot.activeCheckpoint.summary}
      data-recovery-posture={snapshot.recoveryPosture}
      data-promoted-support-region={promotedSupportRegion}
      data-support-fallback-mode={snapshot.visualizationMode}
      data-dominant-action-state={snapshot.currentCase.workbenchPosture}
      data-route-shell-posture={snapshot.routeShellPosture}
      data-mission-stack-visual-mode={
        isMissionStack ? PHARMACY_MISSION_STACK_RECOVERY_VISUAL_MODE : "none"
      }
      data-fold-state={isMissionStack ? "folded" : "expanded"}
      data-queue-peek-state={isMissionStack ? (queuePeekOpen ? "open" : "closed") : "disabled"}
      data-support-region-resume-state={
        isMissionStack ? (missionStackSupportExpanded ? "expanded" : "collapsed") : "inline"
      }
      data-continuity-overlay-state={showFrozenOverlay ? "visible" : "clear"}
      data-watch-window-reentry-state={showWatchWindowReentry ? "visible" : "clear"}
      data-sticky-dock-mode={isMissionStack ? "bottom_sticky" : "aside"}
      data-reduced-motion="respect"
      data-pharmacy-a11y-visual-mode={PHARMACY_ACCESSIBLE_QUIET_POLISH_VISUAL_MODE}
      {...rootAutomationAttributes}
    >
      <PharmacyReducedMotionBridge testId="pharmacy-shell-reduced-motion-bridge">
      <header className="pharmacy-shell__masthead" role="banner">
        <div className="pharmacy-shell__brand">
          <VecellLogoLockup
            aria-hidden="true"
            className="pharmacy-insignia"
            style={{ width: 166, height: "auto" }}
          />
          <div>
            <p className="pharmacy-shell__eyebrow">Phase 6 pharmacy mission frame</p>
            <h1>Quiet pharmacy shell with one dominant action</h1>
            <p>
              One case, one checkpoint, one dominant action, one promoted support region.
              Same-shell validation, inventory, handoff, and reopen posture stay causally honest.
            </p>
          </div>
        </div>
        <div className="pharmacy-shell__masthead-meta">
          <PharmacyAccessibleStatusBadge
            label={snapshot.currentCase.queueLane}
            tone={queueToneBadge(snapshot.currentCase.queueTone)}
            contextLabel="Queue lane"
            compact
            className="pharmacy-pill"
          />
          <PharmacyAccessibleStatusBadge
            label={titleCase(snapshot.currentCase.workbenchPosture)}
            tone={workbenchTone(snapshot.currentCase.workbenchPosture)}
            contextLabel="Workbench posture"
            compact
            className="pharmacy-pill"
          />
          <PharmacyAccessibleStatusBadge
            label={titleCase(snapshot.visualizationMode)}
            tone={snapshot.visualizationMode === "chart_plus_table" ? "ready" : snapshot.visualizationMode === "table_only" ? "guarded" : "blocked"}
            contextLabel="Visualization mode"
            compact
            className="pharmacy-pill"
          />
        </div>
      </header>

      <SharedStatusStrip input={snapshot.statusInput} />
      <PharmacyA11yAnnouncementHub
        scopeLabel="Pharmacy console shell"
        politeAnnouncement={pharmacyAnnouncementState.politeAnnouncement}
        assertiveAnnouncement={pharmacyAnnouncementState.assertiveAnnouncement}
        testId="PharmacyShellAnnouncementHub"
      />
      <PharmacyFocusRouteMap
        title="Pharmacy console continuity"
        routeFamilyLabel={snapshot.location.routeFamilyRef}
        currentRouteLabel={routeLabel(snapshot.location.routeKey)}
        selectedAnchorLabel={props.state.continuitySnapshot.selectedAnchor.lastKnownLabel}
        focusReturnLabel={`Pharmacy route ${routeLabel(snapshot.location.routeKey)}`}
        supportRegionLabel={supportRegionLabel}
        compact
        testId="PharmacyShellFocusRouteMap"
      />
      {shouldShowRecoveryStrip ? (
        <PharmacyRouteRecoveryFrame
          snapshot={snapshot}
          tone={recoveryTone}
          recoveryOwnerLabel={recoveryOwnerLabel}
          forceVisible={shouldShowRecoveryStrip}
          onPrimaryAction={() => {
            if (snapshot.location.routeKey === "assurance") {
              setQueuePeekOpen(false);
              setSupportResumeOpen(true);
              props.onReturn();
              return;
            }
            setQueuePeekOpen(false);
            setSupportResumeOpen(true);
            props.onOpenChildRoute("assurance");
          }}
          onSecondaryAction={() => {
            setQueuePeekOpen(false);
            props.onOpenCase(snapshot.currentCase.pharmacyCaseId);
          }}
        />
      ) : null}
      <PharmacyCasePulseHost snapshot={snapshot} />
      {isMissionStack ? (
        <PharmacyMissionStackController
          controller={{
            title: "Folded pharmacy mission stack",
            summary:
              "Queue, case, checkpoint, line, and promoted support region stay in one shell while the layout narrows.",
            caseLabel: snapshot.currentCase.patientLabel,
            routeLabel: routeLabel(snapshot.location.routeKey),
            checkpointLabel: snapshot.activeCheckpoint.label,
            lineItemLabel: snapshot.activeLineItem.medicationLabel,
            queueCountLabel: `${snapshot.queueCases.length} active cases`,
            supportRegionLabel,
            selectedAnchorLabel: props.state.continuitySnapshot.selectedAnchor.lastKnownLabel,
            queueActionLabel: queuePeekOpen ? "Hide queue peek" : "Open queue peek",
            supportActionLabel:
              missionStackSupportExpanded ? "Support region is open" : "Resume support region",
          }}
          onToggleQueue={() => setQueuePeekOpen((current) => !current)}
          onOpenSupport={() => setSupportResumeOpen(true)}
        />
      ) : null}
      {isMissionStack ? (
        <PharmacyCaseResumeStub
          stub={{
            patientLabel: snapshot.currentCase.patientLabel,
            summary: snapshot.currentCase.caseSummary,
            routeLabel: routeLabel(snapshot.location.routeKey),
            checkpointLabel: snapshot.activeCheckpoint.label,
            lineItemLabel: snapshot.activeLineItem.medicationLabel,
            supportRegionLabel,
            recoveryLabel: titleCase(snapshot.recoveryPosture),
          }}
        />
      ) : null}
      {showWatchWindowReentry ? (
        <PharmacyWatchWindowReentryBanner
          banner={{
            tone:
              workbenchView.watchWindowState === "blocked"
                ? "blocked"
                : workbenchView.watchWindowState === "watch"
                  ? "watch"
                  : "ready",
            title: "Watch window re-entry stays in this shell",
            summary: snapshot.currentCase.watchWindowSummary,
            windowLabel: snapshot.currentCase.queueLane,
            ownerLabel: recoveryOwnerLabel,
            actionLabel: "Open recovery region",
          }}
          onAction={() => {
            setQueuePeekOpen(false);
            setSupportResumeOpen(true);
            props.onOpenChildRoute("assurance");
          }}
        />
      ) : null}
      {isMissionStack ? (
        <PharmacyQueuePeekDrawer
          drawer={{
            title: "Queue context",
            summary:
              "The queue remains reachable as a bounded same-shell drawer instead of disappearing on narrow screens.",
            queueCountLabel: `${snapshot.queueCases.length} active cases`,
            selectedCaseLabel: `Selected ${snapshot.currentCase.pharmacyCaseId}`,
            selectedLaneLabel: snapshot.currentCase.queueLane,
            closeActionLabel: "Close queue peek",
            open: queuePeekOpen,
          }}
          onClose={() => setQueuePeekOpen(false)}
        >
          <PharmacyOperationsPanel
            panel={workbenchView.operationsPanel}
            onOpenCase={(pharmacyCaseId) => {
              setQueuePeekOpen(false);
              props.onOpenCase(pharmacyCaseId);
            }}
          />
          <button
            type="button"
            className="pharmacy-link"
            data-testid="pharmacy-queue-peek-root-button"
            onClick={() => {
              setQueuePeekOpen(false);
              props.onNavigate(PHARMACY_DEFAULT_PATH);
            }}
            {...(selectedAnchorBinding
              ? buildAutomationAnchorElementAttributes(selectedAnchorBinding, {
                  instanceKey: snapshot.currentCase.pharmacyCaseId,
                })
              : {})}
          >
            Keep queue root pinned
          </button>
        </PharmacyQueuePeekDrawer>
      ) : null}

      <section className="pharmacy-shell__layout">
        {!isMissionStack ? (
          <PharmacyQueueSpineHost
            snapshot={snapshot}
            onNavigate={props.onNavigate}
            onOpenCase={props.onOpenCase}
            selectedAnchorBinding={selectedAnchorBinding}
          />
        ) : null}
        <div className="pharmacy-shell__mission-stage">
          <PharmacyValidationBoardHost
            snapshot={snapshot}
            state={props.state}
            eligibilityPreview={eligibilityPreview}
            recoveryPreview={recoveryPreview}
            assurancePreview={assurancePreview}
            onOpenCase={(pharmacyCaseId) => {
              setQueuePeekOpen(false);
              props.onOpenCase(pharmacyCaseId);
            }}
            onSelectCheckpoint={props.onSelectCheckpoint}
            onSelectLineItem={props.onSelectLineItem}
            onOpenChildRoute={(routeKey) => {
              setQueuePeekOpen(false);
              setSupportResumeOpen(true);
              props.onOpenChildRoute(routeKey);
            }}
            onReturn={() => {
              setQueuePeekOpen(false);
              setSupportResumeOpen(true);
              props.onReturn();
            }}
            supportRegionContent={isMissionStack ? missionStackSupportRegion : undefined}
          />
          {showFrozenOverlay ? (
            <PharmacyContinuityFrozenOverlay
              overlay={{
                tone: recoveryTone,
                title: "The current route is frozen until truth catches up",
                summary:
                  "The shell is preserving the selected case, checkpoint, and line item, but release actions remain fenced until recovery or revalidation clears.",
                postureLabel: titleCase(snapshot.routeShellPosture),
                actionLabel: "Open recovery region",
              }}
              onAction={() => {
                setQueuePeekOpen(false);
                setSupportResumeOpen(true);
                props.onOpenChildRoute("assurance");
              }}
            />
          ) : null}
        </div>

        {!isMissionStack ? (
          <aside className="pharmacy-shell__decision" aria-label="Decision dock">
            <PharmacyChosenProviderAnchor snapshot={snapshot} />
            <PharmacyDecisionDockHost
              snapshot={snapshot}
              recoveryPreview={recoveryPreview}
              assurancePreview={assurancePreview}
              onOpenChildRoute={props.onOpenChildRoute}
              dominantActionBinding={dominantActionBinding}
            />

            <section className="pharmacy-panel">
              <header className="pharmacy-panel__header">
                <div>
                  <p className="pharmacy-shell__eyebrow">Telemetry log</p>
                  <h3>Recent shell-truth events</h3>
                </div>
                <span>{props.state.telemetry.length} envelopes</span>
              </header>
              <ol className="pharmacy-telemetry-log" data-testid="pharmacy-telemetry-log">
                {props.state.telemetry.slice(-5).reverse().map((envelope) => (
                  <li key={envelope.envelopeId}>
                    <strong>{envelope.eventName}</strong>
                    <span>
                      {String(
                        envelope.payload.pathname ??
                          envelope.payload.proofState ??
                          envelope.payload.checkpointId ??
                          envelope.eventCode,
                      )}
                    </span>
                  </li>
                ))}
              </ol>
              {focusRestoreBinding ? (
                <button
                  type="button"
                  className="pharmacy-link"
                  data-testid="pharmacy-focus-restore-marker"
                  {...buildAutomationAnchorElementAttributes(focusRestoreBinding, {
                    instanceKey: snapshot.activeLineItem.lineItemId,
                  })}
                >
                  {props.state.continuitySnapshot.focusRestoreTargetRef}
                </button>
              ) : null}
            </section>

            <section className="pharmacy-panel">
              <header className="pharmacy-panel__header">
                <div>
                  <p className="pharmacy-shell__eyebrow">Truth matrix</p>
                  <h3>Checkpoint, proof, and outcome posture</h3>
                </div>
              </header>
              <table className="pharmacy-table">
                <caption>Checkpoint and proof matrix</caption>
                <thead>
                  <tr>
                    <th scope="col">Case</th>
                    <th scope="col">Consent</th>
                    <th scope="col">Proof</th>
                    <th scope="col">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {pharmacyCheckpointAndProofMatrixRows.map((row) => (
                    <tr
                      key={row.pharmacyCaseId}
                      data-selected={row.pharmacyCaseId === snapshot.currentCase.pharmacyCaseId}
                    >
                      <td>{row.pharmacyCaseId}</td>
                      <td>{titleCase(row.consentState)}</td>
                      <td>{titleCase(row.proofState)}</td>
                      <td>{titleCase(row.outcomeTruthState)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="pharmacy-panel">
              <header className="pharmacy-panel__header">
                <div>
                  <p className="pharmacy-shell__eyebrow">Route contract</p>
                  <h3>Same-shell route law</h3>
                </div>
              </header>
              <ul className="pharmacy-route-contract-list">
                {pharmacyRouteContractSeedRows.map((row) => (
                  <li key={row.path}>
                    <strong>{row.path}</strong>
                    <span>{row.summary}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        ) : null}
      </section>
      {isMissionStack ? (
        <div
          className="pharmacy-shell__mission-dock"
          data-testid="PharmacyMissionStackDock"
          data-visual-mode={PHARMACY_MISSION_STACK_RECOVERY_VISUAL_MODE}
        >
          <PharmacyDecisionDockHost
            snapshot={snapshot}
            recoveryPreview={recoveryPreview}
            assurancePreview={assurancePreview}
            onOpenChildRoute={(routeKey) => {
              setQueuePeekOpen(false);
              setSupportResumeOpen(true);
              props.onOpenChildRoute(routeKey);
            }}
            dominantActionBinding={dominantActionBinding}
          />
        </div>
      ) : null}
      </PharmacyReducedMotionBridge>
    </div>
  );
}

export const PharmacyShellSeedDocument = PharmacyShellFrame;

export function PharmacyWorkspaceShell() {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );
  const [state, setState] = useState<PharmacyShellState>(() =>
    typeof window === "undefined"
      ? createInitialPharmacyShellState()
      : restoreInitialShellState(window.location.pathname),
  );
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    persistPathState(state, window.scrollY);
  }, [
    state,
    state.location.pathname,
    state.selectedCaseId,
    state.activeCheckpointId,
    state.activeLineItemId,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (!window.location.pathname.startsWith("/workspace/pharmacy")) {
      window.history.replaceState({}, "", PHARMACY_DEFAULT_PATH);
      setState(restoreInitialShellState(PHARMACY_DEFAULT_PATH));
    }

    const handlePopState = () => {
      startTransition(() => {
        setState((current) => navigatePharmacyShell(current, window.location.pathname));
      });
    };
    const handleResize = () => setViewportWidth(window.innerWidth);
    const handleScroll = () => {
      persistPathState(stateRef.current, window.scrollY);
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const persisted = readPersistedShellState().routes[state.location.pathname];
    const nextScrollY = persisted?.scrollY ?? 0;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: nextScrollY, behavior: "auto" });
    });
  }, [state.location.pathname]);

  function commit(nextState: PharmacyShellState, mode: "push" | "replace" = "push") {
    if (typeof window !== "undefined") {
      persistPathState(stateRef.current, window.scrollY);
      const method = mode === "replace" ? "replaceState" : "pushState";
      window.history[method]({}, "", nextState.location.pathname);
    }
    setState(nextState);
  }

  function navigate(path: string) {
    startTransition(() => {
      commit(navigatePharmacyShell(stateRef.current, path));
    });
  }

  function handleOpenCase(pharmacyCaseId: string) {
    startTransition(() => {
      commit(openPharmacyCase(stateRef.current, pharmacyCaseId));
    });
  }

  function handleSelectCheckpoint(checkpointId: string) {
    startTransition(() => {
      setState((current) => selectPharmacyCheckpoint(current, checkpointId));
    });
  }

  function handleSelectLineItem(lineItemId: string) {
    startTransition(() => {
      setState((current) => selectPharmacyLineItem(current, lineItemId));
    });
  }

  function handleOpenChildRoute(routeKey: PharmacyChildRouteKey) {
    startTransition(() => {
      commit(openPharmacyChildRoute(stateRef.current, routeKey));
    });
  }

  function handleReturn() {
    startTransition(() => {
      commit(returnFromPharmacyChildRoute(stateRef.current));
    });
  }

  return (
    <PharmacyShellFrame
      state={state}
      viewportWidth={viewportWidth}
      onNavigate={navigate}
      onOpenCase={handleOpenCase}
      onSelectCheckpoint={handleSelectCheckpoint}
      onSelectLineItem={handleSelectLineItem}
      onOpenChildRoute={handleOpenChildRoute}
      onReturn={handleReturn}
    />
  );
}

export const PharmacyShellSeedApp = PharmacyWorkspaceShell;

export default PharmacyWorkspaceShell;
