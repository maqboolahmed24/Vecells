import React, { startTransition, useEffect, useRef, useState } from "react";
import {
  CrossOrgContentLegend,
  GovernedPlaceholderSummary,
  VecellLogoLockup,
} from "@vecells/design-system";
import {
  buildAutomationAnchorElementAttributes,
  buildAutomationSurfaceAttributes,
  resolveAutomationAnchorProfile,
} from "@vecells/persistent-shell";
import {
  HUB_ACTING_CONTEXT_VISUAL_MODE,
  HUB_DEFAULT_PATH,
  HUB_MISSION_STACK_VISUAL_MODE,
  HUB_QUEUE_VISUAL_MODE,
  HUB_SHELL_STORAGE_KEY,
  HUB_SHELL_VISUAL_MODE,
  activateHubBreakGlass,
  applyHubQueueChangeBatch,
  bufferHubQueueChangeBatch,
  createHubShellHistorySnapshot,
  createInitialHubShellState,
  navigateHubShell,
  revokeHubBreakGlass,
  resolveHubShellSnapshot,
  returnFromHubChildRoute,
  selectHubActingSite,
  selectHubCase,
  selectHubExceptionRow,
  selectHubOrganisation,
  selectHubOptionCard,
  selectHubPurposeOfUse,
  selectHubQueueFilter,
  selectHubSavedView,
  type HubAccessPosture,
  type HubActingOrganisationId,
  type HubActingSiteId,
  type HubBreakGlassState,
  type HubCoordinationCase,
  type HubPurposeOfUseId,
  type HubQueueFilterId,
  type HubRecoveryPosture,
  type HubSavedViewId,
  type HubSeverityTone,
  type HubShellHistorySnapshot,
  type HubShellSnapshot,
  type HubShellState,
} from "./hub-desk-shell.model";
import {
  HubCommitConfirmationPane,
  createInitialHubCommitUiState,
  beginHubNativeBooking,
  attachHubManualProof,
  cancelHubManualProof,
  recordHubSupplierConfirmation,
  acknowledgeHubPracticeVisibility,
  toggleHubImportedReviewState,
  toggleHubContinuityDrawer,
  type HubCommitUiState,
} from "./hub-commit-confirmation-pane";

type HubBreakpointClass = "compact" | "narrow" | "medium" | "expanded" | "wide";
type HubMissionSupportRegion = "interruptions" | "visibility" | "support" | "exceptions";

function titleCase(value: string): string {
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function hubDiagnosticsEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return new URLSearchParams(window.location.search).get("diagnostics") === "hub";
}

function hubPublicText(value: string): string {
  return value
    .replace(/\bHubCallbackTransferPendingState\b/g, "Callback transfer status")
    .replace(/\bHubReturnToPracticeReceipt\b/g, "Practice return receipt")
    .replace(/\bHubUrgentBounceBackBanner\b/g, "Urgent return banner")
    .replace(/\bHubExceptionDetailDrawer\b/g, "Exception detail")
    .replace(/\bHubSupervisorEscalationPanel\b/g, "Supervisor review")
    .replace(/\bauthoritative\b/gi, "confirmed")
    .replace(/\bdelta\b/gi, "change")
    .replace(/\btruthfully\b/gi, "with confirmation")
    .replace(/\btruthful\b/gi, "confirmed")
    .replace(/\bproof\b/gi, "evidence")
    .replace(/\bsame[- ]shell\b/gi, "same case")
    .replace(/\bshell\b/gi, "workspace")
    .replace(/\bposture\b/gi, "status")
    .replace(/\btuple\b/gi, "details")
    .replace(/\bbounded\b/gi, "limited")
    .replace(/\btruth\b/gi, "confirmed information")
    .replace(/\blineage\b/gi, "history")
    .replace(/\bcontract\b/gi, "agreement")
    .replace(/\bplaceholder\b/gi, "limited summary")
    .replace(/\bdiagnostic\b/gi, "review")
    .replace(/\bprovenance\b/gi, "history")
    .replace(/\bstub\b/gi, "summary")
    .replace(/\b[a-z]+(?:_[a-z0-9]+)+\b/g, (token) =>
      titleCase(
        token
          .replace(/truth/g, "confirmed information")
          .replace(/posture/g, "status")
          .replace(/provenance/g, "history")
          .replace(/diagnostic/g, "review")
          .replace(/lineage/g, "history")
          .replace(/contract/g, "agreement")
          .replace(/stub/g, "summary"),
      ),
    );
}

function hubPublicStatusLabel(value: string): string {
  switch (value) {
    case "direct_commit":
      return "Direct booking";
    case "patient_offerable":
      return "Patient offer";
    case "callback_only_reasoning":
      return "Callback only";
    case "diagnostic_only":
      return "Review only";
    case "minimum_necessary":
      return "Minimum necessary";
    case "preserve_writable":
      return "Ready";
    case "preserve_read_only":
      return "Read only";
    case "recovery_required":
      return "Recovery support";
    default:
      return titleCase(value);
  }
}

function minimumNecessaryFieldLabel(field: string): string {
  switch (field) {
    case "hub_internal_free_text":
      return "Additional coordination notes";
    case "cross_site_capacity_detail":
      return "Cross-site capacity detail";
    case "raw_native_booking_proof":
      return "Original booking evidence";
    case "origin_practice_triage_notes":
      return "Origin triage detail";
    case "callback_rationale":
      return "Callback rationale";
    case "alternative_options_other_sites":
      return "Other-site alternatives";
    case "attachment_payload_without_break_glass":
      return "Attachment payload";
    default:
      return titleCase(field);
  }
}

function resolveBreakpointClass(viewportWidth: number): HubBreakpointClass {
  if (viewportWidth < 480) {
    return "compact";
  }
  if (viewportWidth < 768) {
    return "narrow";
  }
  if (viewportWidth < 960) {
    return "medium";
  }
  if (viewportWidth < 1280) {
    return "expanded";
  }
  return "wide";
}

function focusHubActingContextChip(): void {
  if (typeof document === "undefined") {
    return;
  }
  const chip = document.querySelector<HTMLElement>("[data-testid='HubActingContextChip']");
  if (!chip) {
    return;
  }
  window.requestAnimationFrame(() => {
    chip.focus({ preventScroll: true });
  });
}

function focusableElementsWithin(root: HTMLElement | null): HTMLElement[] {
  if (!root) {
    return [];
  }
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
    ),
  ).filter((element) => !element.hasAttribute("disabled"));
}

function defaultMissionSupportRegion(
  snapshot: HubShellSnapshot,
): HubMissionSupportRegion {
  if (snapshot.location.viewMode === "exceptions") {
    return "exceptions";
  }
  if (
    snapshot.actingContextControlPlane.accessDeniedState ||
    snapshot.actingContextControlPlane.accessPosture === "frozen"
  ) {
    return "visibility";
  }
  if (snapshot.location.viewMode === "audit" || snapshot.location.viewMode === "alternatives") {
    return "support";
  }
  return "interruptions";
}

function labelForMissionSupportRegion(region: HubMissionSupportRegion): string {
  switch (region) {
    case "interruptions":
      return "Interruptions";
    case "visibility":
      return "Visibility";
    case "support":
      return "Evidence";
    case "exceptions":
      return "Exception detail";
  }
}

function toneForRecoveryPosture(recoveryPosture: HubRecoveryPosture): HubSeverityTone {
  switch (recoveryPosture) {
    case "live":
      return "ready";
    case "read_only":
      return "watch";
    case "recovery_only":
      return "critical";
  }
}

function hubRecoveryLegendItems() {
  return [
    {
      term: "Callback pending",
      meaning:
        "The hub is arranging callback fallback. This is not calm completion wording and it does not imply practice acknowledgement.",
      tone: "warning" as const,
    },
    {
      term: "Urgent return linked",
      meaning:
        "A practice-facing urgent return workflow is linked, but quiet closure can still be blocked by supervision or acknowledgement debt.",
      tone: "preview" as const,
    },
    {
      term: "Read-only history",
      meaning:
        "Previous options stay visible as evidence and rationale only. They do not reopen unsafe acceptance or hidden detail.",
      tone: "neutral" as const,
    },
  ];
}

function toneForAccessPosture(accessPosture: HubAccessPosture): HubSeverityTone {
  switch (accessPosture) {
    case "writable":
      return "ready";
    case "read_only":
      return "watch";
    case "frozen":
    case "denied":
      return "critical";
  }
}

function toneForBreakGlassState(
  breakGlassState: HubBreakGlassState,
): HubSeverityTone {
  switch (breakGlassState) {
    case "active":
      return "ready";
    case "inactive":
      return "neutral";
    case "expiring":
      return "watch";
    case "revoked":
    case "denied":
      return "critical";
  }
}

function toneForOwnership(state: HubCoordinationCase["ownershipState"]): HubSeverityTone {
  switch (state) {
    case "claimed_active":
      return "ready";
    case "transfer_pending":
      return "watch";
    case "observe_only":
      return "watch";
    case "takeover_required":
      return "critical";
  }
}

function toneForRiskBand(riskBand: "critical" | "watch" | "ready"): HubSeverityTone {
  switch (riskBand) {
    case "critical":
      return "critical";
    case "watch":
      return "watch";
    default:
      return "ready";
  }
}

function toneForTrustState(trustState: "trusted" | "degraded" | "quarantined"): HubSeverityTone {
  switch (trustState) {
    case "trusted":
      return "ready";
    case "degraded":
      return "watch";
    case "quarantined":
      return "critical";
  }
}

function toneForFreshness(freshnessBand: "fresh" | "aging" | "stale"): HubSeverityTone {
  switch (freshnessBand) {
    case "fresh":
      return "ready";
    case "aging":
      return "watch";
    case "stale":
      return "critical";
  }
}

function toneForRetryState(retryState: "retryable" | "waiting_manual" | "closed"): HubSeverityTone {
  switch (retryState) {
    case "retryable":
      return "watch";
    case "waiting_manual":
      return "critical";
    case "closed":
      return "ready";
  }
}

function toneForEscalationState(
  escalationState: "none" | "supervisor_review_required" | "supervisor_reviewed",
): HubSeverityTone {
  switch (escalationState) {
    case "supervisor_review_required":
      return "critical";
    case "supervisor_reviewed":
      return "watch";
    case "none":
      return "neutral";
  }
}

function toneForReservationTruth(
  reservationTruthState:
    | "held"
    | "truthful_nonexclusive"
    | "no_hold"
    | "revalidation_required"
    | "unavailable",
): HubSeverityTone {
  switch (reservationTruthState) {
    case "held":
      return "ready";
    case "truthful_nonexclusive":
    case "no_hold":
      return "neutral";
    case "revalidation_required":
      return "watch";
    case "unavailable":
      return "critical";
  }
}

function readStoredHistorySnapshot(): Partial<HubShellHistorySnapshot> | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(HUB_SHELL_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as Partial<HubShellHistorySnapshot>;
  } catch {
    return null;
  }
}

function readWindowHistorySnapshot(): Partial<HubShellHistorySnapshot> | null {
  if (typeof window === "undefined") {
    return null;
  }
  const state = window.history.state as { hubDesk?: Partial<HubShellHistorySnapshot> } | null;
  return state?.hubDesk ?? null;
}

function writeStoredHistorySnapshot(state: HubShellState): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      HUB_SHELL_STORAGE_KEY,
      JSON.stringify(createHubShellHistorySnapshot(state)),
    );
  } catch {
    // ignore storage failures in preview mode
  }
}

function initialHubDeskState(): HubShellState {
  if (typeof window === "undefined") {
    return createInitialHubShellState(HUB_DEFAULT_PATH);
  }
  return createInitialHubShellState(window.location.pathname, {
    historySnapshot: readWindowHistorySnapshot() ?? readStoredHistorySnapshot(),
  });
}

function HubOwnershipContextChip(props: {
  ownershipState: HubCoordinationCase["ownershipState"];
  label: string;
  testId?: string;
}) {
  return (
    <span
      className="hub-chip hub-chip--ownership"
      data-tone={toneForOwnership(props.ownershipState)}
      data-testid={props.testId}
      data-ownership-state={props.ownershipState}
    >
      {props.label}
    </span>
  );
}

function HubStatusAuthorityStrip(props: { snapshot: HubShellSnapshot }) {
  return (
    <section
      className="hub-status-strip"
      aria-label="Hub status"
      data-testid="HubStatusAuthorityStrip"
      data-shell-status={props.snapshot.routeShellPosture}
    >
      {props.snapshot.statusSignals.map((signal) => (
        <article
          key={signal.signalId}
          className="hub-status-card"
          data-tone={signal.tone}
          data-status-signal={signal.signalId}
        >
          <p className="hub-status-card__label">{hubPublicText(signal.label)}</p>
          <strong>{hubPublicText(signal.value)}</strong>
          <span>{hubPublicText(signal.summary)}</span>
        </article>
      ))}
    </section>
  );
}

function HubActingContextChip(props: {
  snapshot: HubShellSnapshot;
  onOpenDrawer: () => void;
}) {
  const chip = props.snapshot.actingContextControlPlane.actingContextChip;
  return (
    <button
      type="button"
      className="hub-acting-context-chip"
      data-testid="HubActingContextChip"
      data-visual-mode={HUB_ACTING_CONTEXT_VISUAL_MODE}
      data-acting-context-state={chip.contextState}
      data-access-posture={chip.accessPosture}
      data-break-glass-state={chip.breakGlassState}
      onClick={props.onOpenDrawer}
    >
      <div className="hub-acting-context-chip__copy">
        <span className="hub-eyebrow">Acting context</span>
        <strong>{chip.organisationLabel}</strong>
        <span>
          {chip.siteLabel} · {chip.roleLabel}
        </span>
      </div>
      <div className="hub-acting-context-chip__meta">
        <span className="hub-chip" data-tone={toneForAccessPosture(chip.accessPosture)}>
          {hubPublicStatusLabel(chip.accessPosture)}
        </span>
        <span className="hub-chip" data-tone={toneForBreakGlassState(chip.breakGlassState)}>
          {titleCase(chip.breakGlassState)}
        </span>
      </div>
    </button>
  );
}

function HubScopeSummaryStrip(props: {
  snapshot: HubShellSnapshot;
}) {
  const summary = props.snapshot.actingContextControlPlane.scopeSummaryStrip;
  return (
    <section
      className="hub-scope-summary-strip"
      data-testid="HubScopeSummaryStrip"
      data-access-posture={summary.accessPosture}
      data-visibility-envelope-state={summary.visibilityEnvelopeState}
      data-break-glass-state={summary.breakGlassState}
    >
      <article className="hub-scope-summary-card">
        <p className="hub-status-card__label">Organisation</p>
        <strong>{summary.organisationLabel}</strong>
        <span>{summary.siteLabel}</span>
      </article>
      <article className="hub-scope-summary-card">
        <p className="hub-status-card__label">Purpose of use</p>
        <strong>{summary.purposeLabel}</strong>
        <span>{summary.audienceTierLabel}</span>
      </article>
      <article className="hub-scope-summary-card">
        <p className="hub-status-card__label">Visibility</p>
        <strong>{summary.visibilityEnvelopeLabel}</strong>
        <span>{summary.minimumNecessarySummary}</span>
      </article>
      <article className="hub-scope-summary-card">
        <p className="hub-status-card__label">Access status</p>
        <strong>{summary.accessPostureLabel}</strong>
        <span data-scope-generation={summary.switchGenerationLabel} data-scope-details={summary.tupleHash}>
          Current access details
        </span>
      </article>
      <article className="hub-scope-summary-card">
        <p className="hub-status-card__label">Break-glass</p>
        <strong>{titleCase(summary.breakGlassState)}</strong>
        <span>{summary.breakGlassSummary}</span>
      </article>
    </section>
  );
}

function ActingSiteSwitcher(props: {
  descriptor: HubShellSnapshot["actingContextControlPlane"]["organisationSwitchDrawer"]["actingSiteSwitcher"];
  onSelectSite: (siteId: HubActingSiteId) => void;
}) {
  return (
    <section className="hub-control-plane-section" data-testid="ActingSiteSwitcher">
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Site</p>
          <h3>{props.descriptor.title}</h3>
        </div>
      </header>
      <p className="hub-control-plane-section__summary">{props.descriptor.summary}</p>
      <div className="hub-scope-option-list">
        {props.descriptor.options.map((option) => (
          <button
            key={option.optionId}
            type="button"
            className="hub-scope-option"
            data-scope-option-state={option.state}
            data-scope-option-outcome={option.outcome}
            data-site-option={option.optionId}
            disabled={option.state === "blocked"}
            onClick={() => props.onSelectSite(option.optionId as HubActingSiteId)}
          >
            <div>
              <strong>{option.label}</strong>
              <span>{option.summary}</span>
            </div>
            <span className="hub-chip" data-tone={option.state === "blocked" ? "critical" : option.state === "pending" ? "watch" : "neutral"}>
              {titleCase(option.state)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function PurposeOfUsePanel(props: {
  descriptor: HubShellSnapshot["actingContextControlPlane"]["organisationSwitchDrawer"]["purposePanel"];
  onSelectPurpose: (purposeId: HubPurposeOfUseId) => void;
}) {
  return (
    <section className="hub-control-plane-section" data-testid="PurposeOfUsePanel">
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Purpose</p>
          <h3>{props.descriptor.title}</h3>
        </div>
      </header>
      <p className="hub-control-plane-section__summary">{props.descriptor.summary}</p>
      <div className="hub-scope-option-list">
        {props.descriptor.options.map((option) => (
          <button
            key={option.optionId}
            type="button"
            className="hub-scope-option"
            data-scope-option-state={option.state}
            data-scope-option-outcome={option.outcome}
            data-purpose-option={option.optionId}
            disabled={option.state === "blocked"}
            onClick={() => props.onSelectPurpose(option.optionId as HubPurposeOfUseId)}
          >
            <div>
              <strong>{option.label}</strong>
              <span>{option.summary}</span>
            </div>
            <span className="hub-chip" data-tone={option.state === "blocked" ? "critical" : option.state === "pending" ? "watch" : "neutral"}>
              {titleCase(option.state)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function VisibilityEnvelopeLegend(props: {
  descriptor: HubShellSnapshot["actingContextControlPlane"]["visibilityEnvelopeLegend"];
}) {
  return (
    <section className="hub-visibility-legend" data-testid="VisibilityEnvelopeLegend">
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Audience tier</p>
          <h3>{props.descriptor.title}</h3>
        </div>
      </header>
      <p className="hub-control-plane-section__summary">{props.descriptor.summary}</p>
      <div className="hub-visibility-legend__rows">
        {props.descriptor.rows.map((row) => (
          <article
            key={row.tierId}
            className="hub-visibility-legend__row"
            data-current={row.current}
            data-audience-tier={row.tierId}
          >
            <strong>{row.label}</strong>
            <span>{row.visibleSummary}</span>
            <small>{row.hiddenSummary}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function AccessScopeTransitionReceipt(props: {
  receipt: HubShellSnapshot["actingContextControlPlane"]["accessScopeTransitionReceipt"];
}) {
  if (!props.receipt) {
    return null;
  }
  return (
    <section
      className="hub-scope-transition-receipt"
      data-testid="AccessScopeTransitionReceipt"
      data-scope-transition-outcome={props.receipt.outcome}
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Scope transition</p>
          <h3>{props.receipt.title}</h3>
        </div>
        <span
          className="hub-chip"
          data-tone={
            props.receipt.outcome === "preserve_writable"
              ? "ready"
              : props.receipt.outcome === "preserve_read_only"
                ? "watch"
                : "critical"
          }
        >
          {titleCase(props.receipt.outcome)}
        </span>
      </header>
      <p className="hub-control-plane-section__summary">{props.receipt.summary}</p>
      <dl className="hub-fact-grid">
        <div>
          <dt>Previous scope</dt>
          <dd>{props.receipt.previousScopeLabel}</dd>
        </div>
        <div>
          <dt>Current scope</dt>
          <dd>{props.receipt.currentScopeLabel}</dd>
        </div>
        <div>
          <dt>Preserved anchor</dt>
          <dd>{props.receipt.preservedAnchorLabel}</dd>
        </div>
        <div>
          <dt>Return rules</dt>
          <dd>{props.receipt.returnContractSummary}</dd>
        </div>
      </dl>
    </section>
  );
}

function ScopeDriftFreezeBanner(props: {
  banner: HubShellSnapshot["actingContextControlPlane"]["scopeDriftFreezeBanner"];
  onOpenDrawer: () => void;
}) {
  if (!props.banner) {
    return null;
  }
  return (
    <section
      className="hub-scope-drift-banner"
      data-testid="ScopeDriftFreezeBanner"
      data-scope-drift-class={props.banner.driftClass}
    >
      <div>
        <p className="hub-eyebrow">Scope drift</p>
        <h3>{props.banner.title}</h3>
        <p>{props.banner.summary}</p>
      </div>
      <button type="button" className="hub-secondary-button" onClick={props.onOpenDrawer}>
        {props.banner.actionLabel}
      </button>
    </section>
  );
}

function MinimumNecessaryPlaceholderBlock(props: {
  block: HubShellSnapshot["actingContextControlPlane"]["minimumNecessaryPlaceholders"][number];
}) {
  return (
    <article
      className="hub-placeholder-block"
      data-testid="MinimumNecessaryPlaceholderBlock"
      data-placeholder-reason={props.block.reason}
      data-audience-tier={props.block.audienceTierId}
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Minimum necessary</p>
          <h3>{props.block.title}</h3>
        </div>
        <span className="hub-chip" data-tone={props.block.reason === "elevation_required" ? "watch" : "neutral"}>
          {titleCase(props.block.reason)}
        </span>
      </header>
      <p className="hub-control-plane-section__summary">{props.block.summary}</p>
      <ul className="hub-highlight-list">
        {props.block.hiddenFields.map((field) => (
          <li key={field}>{minimumNecessaryFieldLabel(field)}</li>
        ))}
      </ul>
    </article>
  );
}

function HubAccessDeniedState(props: {
  state: NonNullable<HubShellSnapshot["actingContextControlPlane"]["accessDeniedState"]>;
  onOpenDrawer: () => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <section
      className="hub-access-denied-state"
      data-testid="HubAccessDeniedState"
      data-access-posture="denied"
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Access denied</p>
          <h2>{props.state.title}</h2>
        </div>
        <span className="hub-chip" data-tone="critical">
          Denied
        </span>
      </header>
      <p className="hub-control-plane-section__summary">{props.state.summary}</p>
      <dl className="hub-fact-grid">
        {props.state.reasonRows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="hub-control-plane-actions">
        <button type="button" className="hub-primary-button" onClick={props.onOpenDrawer}>
          {props.state.recoveryActionLabel}
        </button>
        <button type="button" className="hub-secondary-button" onClick={() => props.onNavigate("/hub/queue")}>
          {props.state.queueActionLabel}
        </button>
      </div>
    </section>
  );
}

function BreakGlassReasonModal(props: {
  descriptor: HubShellSnapshot["actingContextControlPlane"]["breakGlassReasonModal"];
  open: boolean;
  selectedReasonId: string;
  onSelectReason: (reasonId: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!props.open) {
      return;
    }
    const focusables = focusableElementsWithin(dialogRef.current);
    const selectedReason =
      dialogRef.current?.querySelector<HTMLElement>(
        `[data-break-glass-reason='${props.selectedReasonId}']`,
      ) ?? null;
    const initialFocusTarget = selectedReason ?? focusables[0] ?? dialogRef.current;
    initialFocusTarget?.focus({ preventScroll: true });
  }, [props.open, props.selectedReasonId]);

  if (!props.open) {
    return null;
  }
  return (
    <div className="hub-modal-scrim" role="presentation">
      <div
        ref={dialogRef}
        className="hub-break-glass-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hub-break-glass-title"
        data-testid="BreakGlassReasonModal"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key !== "Tab") {
            return;
          }
          const focusables = focusableElementsWithin(dialogRef.current);
          if (focusables.length === 0) {
            event.preventDefault();
            dialogRef.current?.focus({ preventScroll: true });
            return;
          }
          const first = focusables[0]!;
          const last = focusables[focusables.length - 1]!;
          const active = document.activeElement as HTMLElement | null;
          if (event.shiftKey) {
            if (!active || active === first || !dialogRef.current?.contains(active)) {
              event.preventDefault();
              last.focus({ preventScroll: true });
            }
            return;
          }
          if (!active || active === last || !dialogRef.current?.contains(active)) {
            event.preventDefault();
            first.focus({ preventScroll: true });
          }
        }}
      >
        <header className="hub-subpanel-header">
          <div>
            <p className="hub-eyebrow">Break-glass</p>
            <h2 id="hub-break-glass-title">{props.descriptor.title}</h2>
          </div>
          <button type="button" className="hub-link-button" onClick={props.onClose}>
            Close
          </button>
        </header>
        <p className="hub-control-plane-section__summary">{props.descriptor.summary}</p>
        {props.descriptor.allowed ? (
          <div className="hub-scope-option-list">
            {props.descriptor.reasons.map((reason) => (
              <button
                key={reason.reasonId}
                type="button"
                className="hub-scope-option"
                data-selected={props.selectedReasonId === reason.reasonId}
                data-break-glass-reason={reason.reasonId}
                onClick={() => props.onSelectReason(reason.reasonId)}
              >
                <div>
                  <strong>{reason.label}</strong>
                  <span>{reason.summary}</span>
                </div>
                <span className="hub-chip" data-tone={reason.requiresJustification ? "watch" : "neutral"}>
                  {reason.requiresJustification ? "Justification" : "Standard"}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <article className="hub-placeholder-block" data-placeholder-reason="out_of_scope">
            <header className="hub-subpanel-header">
              <div>
                <p className="hub-eyebrow">Denied</p>
                <h3>Break-glass cannot start here</h3>
              </div>
            </header>
            <p className="hub-control-plane-section__summary">
              {props.descriptor.denialSummary}
            </p>
          </article>
        )}
        <div className="hub-control-plane-actions">
          <button type="button" className="hub-primary-button" onClick={props.onConfirm}>
            {props.descriptor.allowed ? "Activate break-glass" : "Record denial"}
          </button>
          <button type="button" className="hub-secondary-button" onClick={props.onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function OrganisationSwitchDrawer(props: {
  snapshot: HubShellSnapshot;
  open: boolean;
  onClose: () => void;
  onSelectOrganisation: (organisationId: HubActingOrganisationId) => void;
  onSelectSite: (siteId: HubActingSiteId) => void;
  onSelectPurpose: (purposeId: HubPurposeOfUseId) => void;
  onOpenBreakGlass: () => void;
  onRevokeBreakGlass: () => void;
}) {
  if (!props.open) {
    return null;
  }
  const drawer = props.snapshot.actingContextControlPlane.organisationSwitchDrawer;
  const summary = props.snapshot.actingContextControlPlane.scopeSummaryStrip;
  return (
    <aside
      className="hub-org-switch-drawer"
      data-testid="OrganisationSwitchDrawer"
      data-visual-mode={HUB_ACTING_CONTEXT_VISUAL_MODE}
      aria-labelledby="hub-org-switch-title"
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Control plane</p>
          <h2 id="hub-org-switch-title">{drawer.title}</h2>
        </div>
        <button type="button" className="hub-link-button" onClick={props.onClose}>
          Close
        </button>
      </header>
      <p className="hub-control-plane-section__summary">{drawer.summary}</p>
      <section className="hub-control-plane-section">
        <header className="hub-subpanel-header">
          <div>
            <p className="hub-eyebrow">Current access details</p>
            <h3>{summary.organisationLabel}</h3>
          </div>
        </header>
        <p className="hub-control-plane-section__summary">
          {summary.siteLabel} · {summary.purposeLabel} · {summary.audienceTierLabel}
        </p>
      </section>
      <section className="hub-control-plane-section">
        <header className="hub-subpanel-header">
          <div>
            <p className="hub-eyebrow">Organisation</p>
            <h3>Choose organisation</h3>
          </div>
        </header>
        <div className="hub-scope-option-list">
          {drawer.organisationOptions.map((option) => (
            <button
              key={option.optionId}
              type="button"
              className="hub-scope-option"
              data-scope-option-state={option.state}
              data-scope-option-outcome={option.outcome}
              data-organisation-option={option.optionId}
              onClick={() => props.onSelectOrganisation(option.optionId as HubActingOrganisationId)}
            >
              <div>
                <strong>{option.label}</strong>
                <span>{option.summary}</span>
              </div>
              <span
                className="hub-chip"
                data-tone={
                  option.outcome === "preserve_writable"
                    ? "ready"
                    : option.outcome === "preserve_read_only"
                      ? "watch"
                      : "critical"
                }
              >
                {titleCase(option.state)}
              </span>
            </button>
          ))}
        </div>
      </section>
      <ActingSiteSwitcher descriptor={drawer.actingSiteSwitcher} onSelectSite={props.onSelectSite} />
      <PurposeOfUsePanel descriptor={drawer.purposePanel} onSelectPurpose={props.onSelectPurpose} />
      <section className="hub-control-plane-section">
        <header className="hub-subpanel-header">
          <div>
            <p className="hub-eyebrow">Elevation</p>
            <h3>Break-glass and expiry</h3>
          </div>
        </header>
        <p className="hub-control-plane-section__summary">{drawer.breakGlassSummary}</p>
        <div className="hub-control-plane-actions">
          <button type="button" className="hub-primary-button" onClick={props.onOpenBreakGlass}>
            Open break-glass reasons
          </button>
          <button type="button" className="hub-secondary-button" onClick={props.onRevokeBreakGlass}>
            Revoke break-glass
          </button>
        </div>
      </section>
      <VisibilityEnvelopeLegend descriptor={props.snapshot.actingContextControlPlane.visibilityEnvelopeLegend} />
    </aside>
  );
}

function HubSavedViewRail(props: {
  snapshot: HubShellSnapshot;
  onNavigate: (path: string) => void;
  onSelectSavedView: (savedViewId: HubSavedViewId) => void;
}) {
  const scopeSummary = props.snapshot.actingContextControlPlane.scopeSummaryStrip;
  const savedViews = [
    "resume_today",
    "ack_watch",
    "callback_recovery",
    "supplier_drift",
    "observe_only",
  ] as const;

  return (
    <nav className="hub-nav-rail" aria-label="Hub navigation" data-testid="HubSavedViewRail">
      <section className="hub-nav-section">
        <p className="hub-section-label">Routes</p>
        <div className="hub-nav-link-list">
          <button
            type="button"
            className="hub-nav-link"
            data-active={props.snapshot.location.viewMode === "queue"}
            data-testid="hub-nav-queue"
            onClick={() => props.onNavigate("/hub/queue")}
          >
            Start of day
          </button>
          <button
            type="button"
            className="hub-nav-link"
            data-active={props.snapshot.location.viewMode === "case"}
            data-testid="hub-nav-case"
            onClick={() => props.onNavigate(`/hub/case/${props.snapshot.currentCase.caseId}`)}
          >
            Active case
          </button>
          <button
            type="button"
            className="hub-nav-link"
            data-active={props.snapshot.location.viewMode === "exceptions"}
            data-testid="hub-nav-exceptions"
            onClick={() => props.onNavigate("/hub/exceptions")}
          >
            Exceptions
          </button>
          <button
            type="button"
            className="hub-nav-link"
            data-active={props.snapshot.location.viewMode === "audit"}
            data-testid="hub-nav-audit"
            onClick={() => props.onNavigate(`/hub/audit/${props.snapshot.currentCase.caseId}`)}
          >
            Audit
          </button>
        </div>
      </section>

      <section className="hub-nav-section">
        <p className="hub-section-label">Saved views</p>
        <div className="hub-saved-view-list">
          {savedViews.map((savedViewId) => {
            const savedView =
              props.snapshot.savedView.savedViewId === savedViewId
                ? props.snapshot.savedView
                : undefined;
            const label = savedView ? savedView.label : titleCase(savedViewId);
            const active = props.snapshot.savedView.savedViewId === savedViewId;

            return (
              <button
                key={savedViewId}
                type="button"
                className="hub-saved-view-card"
                data-active={active}
                data-testid={`hub-saved-view-${savedViewId}`}
                onClick={() => props.onSelectSavedView(savedViewId)}
              >
                <strong>{label}</strong>
                <span>
                  {active
                    ? props.snapshot.savedView.summary
                    : savedViewId === "resume_today"
                      ? "Same-day queue and confirmation-bound work."
                      : savedViewId === "ack_watch"
                        ? "Booked cases still blocked by acknowledgement debt."
                        : savedViewId === "callback_recovery"
                          ? "No-slot recovery and callback publication blockers."
                          : savedViewId === "supplier_drift"
                            ? "Supplier drift, frozen manage status, and reopened visibility debt."
                            : "Read-only multi-user review without ownership takeover."}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="hub-nav-section hub-nav-section--context">
        <p className="hub-section-label">Acting context</p>
        <p className="hub-rail-copy">
          {scopeSummary.organisationLabel} / {scopeSummary.siteLabel}. {scopeSummary.audienceTierLabel}
          {" "}stays bound to the active saved view, queue row, and case anchor.
        </p>
      </section>
    </nav>
  );
}

function HubBreachHorizonMeter(props: {
  label: string;
  summary: string;
  probability: number;
  tone: HubSeverityTone;
  compact?: boolean;
}) {
  return (
    <div
      className={`hub-breach-meter${props.compact ? " hub-breach-meter--compact" : ""}`}
      data-breach-visualization={props.compact ? "row_meter" : "summary_strip"}
      data-tone={props.tone}
      aria-label={`${props.label}. ${props.summary}`}
    >
      <div className="hub-breach-meter__copy">
        <strong>{props.label}</strong>
        <span>{props.summary}</span>
      </div>
      <div className="hub-breach-meter__bar" aria-hidden="true">
        <span style={{ width: `${Math.max(8, Math.round(props.probability * 100))}%` }} />
      </div>
      <span className="hub-breach-meter__value">{Math.round(props.probability * 100)}%</span>
    </div>
  );
}

function HubQueueSavedViewToolbar(props: {
  snapshot: HubShellSnapshot;
  onSelectSavedView: (savedViewId: HubSavedViewId) => void;
  onSelectFilter: (filterId: HubQueueFilterId) => void;
  onBufferQueueDelta: () => void;
  onApplyQueueDelta: () => void;
}) {
  const savedViews = [
    "resume_today",
    "ack_watch",
    "callback_recovery",
    "supplier_drift",
    "observe_only",
  ] as const;
  const filters: readonly {
    filterId: HubQueueFilterId;
    label: string;
    summary: string;
  }[] = [
    { filterId: "all", label: "All rows", summary: "Keep authoritative order intact." },
    {
      filterId: "critical",
      label: "Critical",
      summary: "Imminent breach or recovery-required rows only.",
    },
    {
      filterId: "same_day",
      label: "Same day",
      summary: "Today-bound work without reranking it locally.",
    },
    {
      filterId: "degraded",
      label: "Trust issues",
      summary: "Rows where degraded or quarantined supply matters.",
    },
    { filterId: "callback", label: "Callback", summary: "Rows with a lawful callback fallback." },
  ];
  const batch = props.snapshot.queueWorkbench.queueChangeBatch;

  return (
    <section className="hub-workbench-toolbar" aria-label="Queue workbench controls">
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Queue workbench</p>
          <h3>Queue view</h3>
        </div>
        <span>{props.snapshot.queueWorkbench.toolbarSummary}</span>
      </header>
      <div className="hub-workbench-toolbar__saved-views">
        {savedViews.map((savedViewId) => {
          const active = props.snapshot.savedView.savedViewId === savedViewId;
          return (
            <button
              key={savedViewId}
              type="button"
              className="hub-workbench-filter"
              data-active={active}
              data-saved-view-chip={savedViewId}
              data-testid={`hub-workbench-saved-view-${savedViewId}`}
              onClick={() => props.onSelectSavedView(savedViewId)}
            >
              {active ? props.snapshot.savedView.label : titleCase(savedViewId)}
            </button>
          );
        })}
      </div>
      <div className="hub-workbench-toolbar__filters" role="toolbar" aria-label="Queue filters">
        {filters.map((filter) => (
          <button
            key={filter.filterId}
            type="button"
            className="hub-workbench-filter"
            data-active={props.snapshot.queueWorkbench.selectedFilterId === filter.filterId}
            data-filter-id={filter.filterId}
            data-testid={`hub-filter-${filter.filterId}`}
            onClick={() => props.onSelectFilter(filter.filterId)}
          >
            <span>{filter.label}</span>
            <small>{filter.summary}</small>
          </button>
        ))}
      </div>
      <div className="hub-workbench-toolbar__batch">
        <p>{props.snapshot.queueWorkbench.savedViewSummary}</p>
        {batch ? (
          batch.state === "buffered" ? (
            <button
              type="button"
              className="hub-secondary-button"
              data-testid="hub-apply-queue-delta"
              onClick={props.onApplyQueueDelta}
            >
              {hubPublicText(batch.actionLabel)}
            </button>
          ) : (
            <span className="hub-chip" data-tone="ready">
              {hubPublicText(batch.actionLabel)}
            </span>
          )
        ) : (
          <button
            type="button"
            className="hub-secondary-button"
            data-testid="hub-buffer-queue-delta"
            onClick={props.onBufferQueueDelta}
          >
            Check for queue updates
          </button>
        )}
      </div>
    </section>
  );
}

function HubRiskBandStrip(props: { snapshot: HubShellSnapshot }) {
  return (
    <section className="hub-risk-strip" aria-label="Queue risk summary">
      {props.snapshot.queueWorkbench.riskSummary.map((item) => (
        <article
          key={item.riskBand}
          className="hub-risk-chip"
          data-risk-band={item.riskBand}
          data-tone={toneForRiskBand(item.riskBand)}
        >
          <div>
            <p>{item.label}</p>
            <strong>{item.count}</strong>
          </div>
          <span>{hubPublicText(item.summary)}</span>
        </article>
      ))}
    </section>
  );
}

function HubQueueRow(props: {
  row: HubShellSnapshot["queueWorkbench"]["visibleRows"][number];
  rank: number;
  selectedAnchorAttributes: Readonly<Record<string, string>>;
  onSelectCase: (caseId: string) => void;
  onOpenCase: (caseId: string) => void;
}) {
  return (
    <li
      className="hub-queue-row"
      data-hub-queue-row={props.row.caseId}
      data-selected-case={props.row.selected ? "true" : "false"}
      data-risk-band={props.row.riskBand}
      data-delta-buffered={props.row.deltaBuffered ? "true" : "false"}
    >
      <button
        type="button"
        className="hub-queue-row__main"
        aria-current={props.row.selected ? "true" : undefined}
        onClick={() => props.onSelectCase(props.row.caseId)}
        {...props.selectedAnchorAttributes}
      >
        <span className="hub-queue-row__rank">#{props.rank}</span>
        <span className="hub-queue-row__body">
          <strong>{props.row.patientLabel}</strong>
          <span>{hubPublicText(props.row.queueSummary)}</span>
          <small>
            {props.row.priorityBand} / {props.row.timerLabel}
          </small>
        </span>
      </button>
      <div className="hub-queue-row__signals">
        <span className="hub-chip" data-tone={toneForRiskBand(props.row.riskBand)}>
          {titleCase(props.row.riskBand)}
        </span>
        <HubOwnershipContextChip
          ownershipState={props.row.ownershipState}
          label={props.row.ownershipLabel}
        />
        <button
          type="button"
          className="hub-link-button"
          data-testid={`hub-open-case-${props.row.caseId}`}
          onClick={() => props.onOpenCase(props.row.caseId)}
        >
          Open case
        </button>
      </div>
      <div className="hub-queue-row__meta">
        <HubBreachHorizonMeter
          label={`${Math.round(props.row.breachProbability * 100)}% breach pressure`}
          summary={hubPublicText(props.row.breachSummary)}
          probability={props.row.breachProbability}
          tone={toneForRiskBand(props.row.riskBand)}
          compact
        />
        <p>{hubPublicText(props.row.trustSummary)}</p>
      </div>
    </li>
  );
}

function HubQueueWorkbench(props: {
  snapshot: HubShellSnapshot;
  selectedAnchorAttributes: (caseId: string) => Readonly<Record<string, string>>;
  onSelectSavedView: (savedViewId: HubSavedViewId) => void;
  onSelectFilter: (filterId: HubQueueFilterId) => void;
  onSelectCase: (caseId: string) => void;
  onOpenCase: (caseId: string) => void;
  onBufferQueueDelta: () => void;
  onApplyQueueDelta: () => void;
}) {
  const batch = props.snapshot.queueWorkbench.queueChangeBatch;

  return (
    <aside
      className="hub-queue-workbench"
      aria-label="Hub queue workbench"
      data-testid="HubQueueWorkbench"
      data-queue-visual-mode={HUB_QUEUE_VISUAL_MODE}
    >
      <HubQueueSavedViewToolbar
        snapshot={props.snapshot}
        onSelectSavedView={props.onSelectSavedView}
        onSelectFilter={props.onSelectFilter}
        onBufferQueueDelta={props.onBufferQueueDelta}
        onApplyQueueDelta={props.onApplyQueueDelta}
      />
      <HubRiskBandStrip snapshot={props.snapshot} />
      {batch ? (
        <section
          className="hub-queue-batch"
          data-queue-change-state={batch.state}
          aria-live={batch.state === "buffered" ? "polite" : "off"}
        >
          <strong>{hubPublicText(batch.summary)}</strong>
          <p>{hubPublicText(batch.followUpLabel)}</p>
        </section>
      ) : null}
      <ol className="hub-queue-workbench__list">
        {props.snapshot.queueWorkbench.visibleRows.map((row, index) => (
          <HubQueueRow
            key={row.caseId}
            row={row}
            rank={index + 1}
            selectedAnchorAttributes={props.selectedAnchorAttributes(row.caseId)}
            onSelectCase={props.onSelectCase}
            onOpenCase={props.onOpenCase}
          />
        ))}
      </ol>
      <p className="hub-queue-workbench__footer">
        {hubPublicText(props.snapshot.queueWorkbench.fairnessMergeState)}
      </p>
    </aside>
  );
}

function HubBestFitNowStrip(props: { snapshot: HubShellSnapshot }) {
  return (
    <section
      className="hub-best-fit-strip"
      aria-label="Best fit now"
      data-option-card={props.snapshot.bestFitNowStrip.optionCardId}
    >
      <div>
        <p className="hub-eyebrow">Best fit now</p>
        <h2>{props.snapshot.selectedOptionCard.title}</h2>
        <p className="hub-best-fit-strip__summary">
          {hubPublicText(props.snapshot.bestFitNowStrip.summary)}
        </p>
      </div>
      <dl className="hub-best-fit-strip__facts">
        {props.snapshot.bestFitNowStrip.facts.map((fact) => (
          <div key={fact.label}>
            <dt>{hubPublicText(fact.label)}</dt>
            <dd>{hubPublicText(fact.value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HubEscalationBannerLane(props: {
  snapshot: HubShellSnapshot;
  onNavigate: (path: string) => void;
}) {
  const banner = props.snapshot.escalationBanner;
  if (!banner) {
    return null;
  }

  return (
    <section
      className="hub-escalation-banner"
      aria-live="polite"
      data-banner-type={banner.bannerType}
      data-tone={banner.severityBand}
    >
      <div>
        <p className="hub-eyebrow">Escalation</p>
              <h3>{hubPublicText(banner.title)}</h3>
              <p>{hubPublicText(banner.summary)}</p>
      </div>
      <button
        type="button"
        className="hub-secondary-button"
        onClick={() => props.onNavigate(`/hub/case/${props.snapshot.currentCase.caseId}`)}
      >
          {hubPublicText(banner.actionLabel)}
      </button>
    </section>
  );
}

function HubOptionCard(props: {
  card: HubShellSnapshot["optionCardGroups"][number]["cards"][number];
  onSelectOption: (optionCardId: string) => void;
}) {
  return (
    <article
      className="hub-option-card"
      data-option-card={props.card.optionCardId}
      data-selected={props.card.selectedState ? "true" : "false"}
      data-reservation-truth={props.card.reservationTruthState}
      data-offerability-state={props.card.offerabilityState}
    >
      <button
        type="button"
        className="hub-option-card__select"
        onClick={() => props.onSelectOption(props.card.optionCardId)}
      >
        <div className="hub-option-card__rank">
          <span>#{props.card.rankOrdinal}</span>
          <small>W{props.card.windowClass}</small>
        </div>
        <div className="hub-option-card__body">
          <div className="hub-option-card__header">
            <div>
              <h3>{props.card.title}</h3>
              <p>{hubPublicText(props.card.secondaryLine)}</p>
            </div>
            <span
              className="hub-chip"
              data-tone={props.card.approvedVarianceVisible ? "watch" : "ready"}
            >
          {hubPublicText(props.card.comparisonLabel)}
            </span>
          </div>
          <div className="hub-option-card__chip-row">
            <span className="hub-chip" data-tone={toneForTrustState(props.card.sourceTrustState)}>
              {titleCase(props.card.sourceTrustState)} trust
            </span>
            <span className="hub-chip" data-tone={toneForFreshness(props.card.freshnessBand)}>
              {props.card.freshnessSummary}
            </span>
            <span
              className="hub-chip"
              data-tone={toneForReservationTruth(props.card.reservationTruthState)}
            >
              {hubPublicText(props.card.reservationTruthSummary)}
            </span>
            <span className="hub-chip" data-tone="neutral">
              {hubPublicStatusLabel(props.card.offerabilityState)}
            </span>
          </div>
          <div className="hub-option-card__reasons">
            {props.card.rankReasons.map((reason) => (
              <span key={reason.reasonId} className="hub-reason-chip">
                {hubPublicText(reason.label)}
              </span>
            ))}
          </div>
          {props.card.selectedState ? (
            <div className="hub-option-card__detail">
              <p>{hubPublicText(props.card.dominantActionSummary)}</p>
              <ul>
                {props.card.rankReasons.map((reason) => (
                  <li key={reason.reasonId}>{hubPublicText(reason.summary)}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </button>
    </article>
  );
}

function HubOptionCardStack(props: {
  snapshot: HubShellSnapshot;
  onSelectOption: (optionCardId: string) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="hub-option-stack" aria-label="Ranked candidate stack">
      {props.snapshot.optionCardGroups.map((group) => (
        <section
          key={group.groupId}
          className="hub-option-group"
          data-window-class={group.windowClass}
        >
          <header className="hub-option-group__header">
            <div>
              <p className="hub-eyebrow">Window class {group.windowClass}</p>
              <h3>{group.label}</h3>
            </div>
            <span>{hubPublicText(group.summary)}</span>
          </header>
          <div className="hub-option-group__cards">
            {group.cards.map((card) => (
              <HubOptionCard
                key={card.optionCardId}
                card={card}
                onSelectOption={props.onSelectOption}
              />
            ))}
          </div>
        </section>
      ))}
      {props.snapshot.callbackFallbackCard ? (
        <article
          className="hub-callback-card"
          data-callback-fallback="true"
          data-testid="hub-callback-fallback"
        >
          <div>
            <p className="hub-eyebrow">Callback fallback</p>
            <h3>{hubPublicText(props.snapshot.callbackFallbackCard.title)}</h3>
            <p>{hubPublicText(props.snapshot.callbackFallbackCard.summary)}</p>
            <small>{hubPublicText(props.snapshot.callbackFallbackCard.followUpLabel)}</small>
          </div>
          <button
            type="button"
            className="hub-secondary-button"
            onClick={() =>
              props.onNavigate(props.snapshot.callbackFallbackCard?.routePath ?? "/hub/exceptions")
            }
          >
            {props.snapshot.callbackFallbackCard.actionLabel}
          </button>
        </article>
      ) : null}
    </section>
  );
}

function HubDecisionDockHost(props: {
  snapshot: HubShellSnapshot;
  onNavigate: (path: string) => void;
  dominantActionAttributes: Readonly<Record<string, string>>;
}) {
  const { decisionDockHost } = props.snapshot;
  return (
    <section
      className="hub-decision-dock"
      aria-label="Next action"
      data-testid="HubDecisionDockHost"
      data-dominant-region="true"
      data-selected-option={props.snapshot.selectedOptionCard.optionCardId}
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Next action</p>
          <h3>{hubPublicText(decisionDockHost.title)}</h3>
        </div>
        <span
          className="hub-chip"
          data-tone={toneForRecoveryPosture(props.snapshot.recoveryPosture)}
        >
          {hubPublicText(decisionDockHost.posture)}
        </span>
      </header>
      <p className="hub-decision-dock__summary">{hubPublicText(decisionDockHost.summary)}</p>
      <ul className="hub-highlight-list hub-highlight-list--dock">
        {decisionDockHost.consequenceItems.map((item) => (
          <li key={item}>{hubPublicText(item)}</li>
        ))}
      </ul>
      <dl className="hub-fact-grid">
        {decisionDockHost.supportingFacts.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        className="hub-primary-button"
        data-testid="hub-resume-dominant-action"
        onClick={() => props.onNavigate(decisionDockHost.dominantActionPath)}
        {...props.dominantActionAttributes}
      >
        {decisionDockHost.dominantActionLabel}
      </button>
    </section>
  );
}

function HubRecoveryMessagePreview(props: {
  preview: {
    title: string;
    summary: string;
    rows: readonly { label: string; value: string }[];
  };
}) {
  return (
    <article className="hub-recovery-preview">
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Preview</p>
          <h4>{props.preview.title}</h4>
        </div>
      </header>
      <p>{props.preview.summary}</p>
      <dl className="hub-fact-grid">
        {props.preview.rows.map((row) => (
          <div key={`${props.preview.title}-${row.label}`}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function HubNoSlotResolutionPanel(props: {
  panel: NonNullable<HubShellSnapshot["recoveryCase"]>["noSlotResolutionPanel"];
  onNavigate: (path: string) => void;
}) {
  if (!props.panel) {
    return null;
  }
  return (
    <section
      className="hub-recovery-panel hub-recovery-panel--no-slot"
      data-hub-recovery="true"
      data-fallback-type={props.panel.fallbackType}
      data-testid="HubNoSlotResolutionPanel"
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Recovery</p>
          <h3>{props.panel.title}</h3>
        </div>
        <span className="hub-chip" data-tone="critical">
          {props.panel.outcomeLabel}
        </span>
      </header>
      <p className="hub-recovery-panel__summary">{hubPublicText(props.panel.summary)}</p>
      <dl className="hub-fact-grid">
        {props.panel.rationaleRows.map((row) => (
          <div key={row.label}>
            <dt>{hubPublicText(row.label)}</dt>
            <dd>{hubPublicText(row.value)}</dd>
          </div>
        ))}
      </dl>
      <div className="hub-recovery-panel__actions">
        {props.panel.actions.map((action) => (
          <button
            key={action.actionId}
            type="button"
            className={action.tone === "critical" ? "hub-primary-button" : "hub-secondary-button"}
            data-tone={action.tone}
            onClick={() => props.onNavigate(action.targetPath)}
          >
            <strong>{action.label}</strong>
            <span>{action.summary}</span>
          </button>
        ))}
      </div>
      <div className="hub-recovery-panel__preview-grid">
        <HubRecoveryMessagePreview preview={props.panel.patientPreview} />
        <HubRecoveryMessagePreview preview={props.panel.practicePreview} />
      </div>
    </section>
  );
}

function HubCallbackTransferPendingState(props: {
  panel: NonNullable<HubShellSnapshot["recoveryCase"]>["callbackTransferPendingState"];
}) {
  if (!props.panel) {
    return null;
  }
  return (
    <section
      className="hub-recovery-panel hub-recovery-panel--callback"
      data-hub-recovery="true"
      data-callback-transfer="pending"
      data-testid="HubCallbackTransferPendingState"
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Callback</p>
          <h3>{props.panel.title}</h3>
        </div>
        <span className="hub-chip" data-tone="critical">
          Pending linkage
        </span>
      </header>
      <p className="hub-recovery-panel__summary">{props.panel.summary}</p>
      <dl className="hub-fact-grid">
        {props.panel.blockingRefs.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="hub-recovery-note-grid">
        <article className="hub-recovery-note">
          <p className="hub-eyebrow">Patient verified details</p>
          <strong>{hubPublicText(props.panel.patientCopy)}</strong>
        </article>
        <article className="hub-recovery-note">
          <p className="hub-eyebrow">Next safe action</p>
          <strong>{hubPublicText(props.panel.nextSafeAction)}</strong>
        </article>
      </div>
    </section>
  );
}

function HubReturnToPracticeReceipt(props: {
  panel: NonNullable<HubShellSnapshot["recoveryCase"]>["returnToPracticeReceipt"];
}) {
  if (!props.panel) {
    return null;
  }
  return (
    <section
      className="hub-recovery-panel hub-recovery-panel--return"
      data-hub-recovery="true"
      data-return-to-practice={props.panel.fallbackType}
      data-testid="HubReturnToPracticeReceipt"
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Return</p>
          <h3>{hubPublicText(props.panel.title)}</h3>
        </div>
        <span className="hub-chip" data-tone="critical">
          Linked receipt
        </span>
      </header>
      <p className="hub-recovery-panel__summary">{hubPublicText(props.panel.summary)}</p>
      <dl className="hub-fact-grid">
        {props.panel.receiptRows.map((row) => (
          <div key={row.label}>
            <dt>{hubPublicText(row.label)}</dt>
            <dd>{hubPublicText(row.value)}</dd>
          </div>
        ))}
      </dl>
      <p className="hub-recovery-panel__footer-copy">
        {hubPublicText(props.panel.reopenLinkageSummary)}
      </p>
    </section>
  );
}

function HubUrgentBounceBackBanner(props: {
  banner: NonNullable<HubShellSnapshot["recoveryCase"]>["urgentBounceBackBanner"];
  onNavigate: (path: string) => void;
}) {
  if (!props.banner) {
    return null;
  }
  return (
    <section
      className="hub-recovery-banner"
      data-hub-recovery="true"
      data-fallback-type="urgent_return_to_practice"
      data-testid="HubUrgentBounceBackBanner"
    >
      <div>
        <p className="hub-eyebrow">Urgent bounce-back</p>
        <h3>{hubPublicText(props.banner.title)}</h3>
        <p>{hubPublicText(props.banner.summary)}</p>
      </div>
      <div className="hub-recovery-banner__actions">
        <span className="hub-chip" data-tone="critical">
          {hubPublicText(props.banner.dueLabel)}
        </span>
        <button
          type="button"
          className="hub-secondary-button"
          onClick={() => props.onNavigate("/hub/exceptions")}
        >
          {hubPublicText(props.banner.actionLabel)}
        </button>
      </div>
    </section>
  );
}

function HubRecoveryDiffStrip(props: {
  panel: NonNullable<HubShellSnapshot["recoveryCase"]>["recoveryDiffStrip"];
}) {
  if (!props.panel) {
    return null;
  }
  return (
    <section
      className="hub-recovery-diff"
      data-hub-recovery="true"
      data-reopen-diff={props.panel.diffId}
      data-testid="HubRecoveryDiffStrip"
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Reopen diff</p>
          <h3>{hubPublicText(props.panel.title)}</h3>
        </div>
      </header>
      <p className="hub-recovery-panel__summary">{hubPublicText(props.panel.summary)}</p>
      <div className="hub-recovery-diff__rows">
        {props.panel.diffRows.map((row) => (
          <article key={row.label} className="hub-recovery-diff__row">
            <strong>{hubPublicText(row.label)}</strong>
            <div>
              <span>{hubPublicText(row.previousValue)}</span>
              <span aria-hidden="true">→</span>
              <span>{hubPublicText(row.nextValue)}</span>
            </div>
            <p>{hubPublicText(row.explanation)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function HubReopenProvenanceStub(props: {
  panel: NonNullable<HubShellSnapshot["recoveryCase"]>["reopenProvenanceStub"];
}) {
  if (!props.panel) {
    return null;
  }
  return (
    <section
      className="hub-recovery-panel hub-recovery-panel--history"
      data-hub-recovery="true"
      data-testid="HubReopenProvenanceStub"
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">History</p>
          <h3>{hubPublicText(props.panel.title)}</h3>
        </div>
      </header>
      <p className="hub-recovery-panel__summary">{hubPublicText(props.panel.summary)}</p>
      <dl className="hub-fact-grid">
        {props.panel.preservedRows.map((row) => (
          <div key={row.label}>
            <dt>{hubPublicText(row.label)}</dt>
            <dd>{hubPublicText(row.value)}</dd>
          </div>
        ))}
      </dl>
      <p className="hub-recovery-panel__footer-copy">{hubPublicText(props.panel.lawSummary)}</p>
    </section>
  );
}

function HubSupervisorEscalationPanel(props: {
  panel: NonNullable<HubShellSnapshot["recoveryCase"]>["supervisorEscalationPanel"];
}) {
  if (!props.panel) {
    return null;
  }
  return (
    <section
      className="hub-recovery-panel hub-recovery-panel--supervisor"
      data-hub-recovery="true"
      data-supervisor-escalation="true"
      data-testid="HubSupervisorEscalationPanel"
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Supervisor</p>
          <h3>{props.panel.title}</h3>
        </div>
        <span className="hub-chip" data-tone="critical">
          Bounce {props.panel.bounceCount}
        </span>
      </header>
      <p className="hub-recovery-panel__summary">{props.panel.summary}</p>
      <div className="hub-recovery-note-grid">
        <article className="hub-recovery-note">
          <p className="hub-eyebrow">Novelty score</p>
          <strong>{props.panel.noveltyScore.toFixed(2)}</strong>
        </article>
        <article className="hub-recovery-note">
          <p className="hub-eyebrow">Threshold</p>
          <strong>{props.panel.noveltyThreshold.toFixed(2)}</strong>
        </article>
      </div>
      <dl className="hub-fact-grid">
        {props.panel.actionRows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HubRecoveryCaseCanvas(props: {
  snapshot: HubShellSnapshot;
  onNavigate: (path: string) => void;
}) {
  const recoveryCase = props.snapshot.recoveryCase;
  if (!recoveryCase || props.snapshot.location.viewMode !== "case") {
    return null;
  }
  return (
    <section
      className="hub-recovery-canvas"
      data-hub-recovery="true"
      data-visual-mode={recoveryCase.visualMode}
      data-fallback-type={recoveryCase.fallbackType}
      data-testid="HubRecoveryCaseCanvas"
    >
      <header className="hub-recovery-canvas__masthead">
        <div>
          <p className="hub-eyebrow">Recovery mode</p>
          <h2>{recoveryCase.mastheadTitle}</h2>
          <p>{recoveryCase.mastheadSummary}</p>
        </div>
        <span className="hub-chip" data-tone={toneForRecoveryPosture(props.snapshot.recoveryPosture)}>
          {titleCase(recoveryCase.fallbackType)}
        </span>
      </header>
      <GovernedPlaceholderSummary
        title="Why some cross-organisation detail stays limited"
        summary="Recovery keeps the current fallback, history, and return rationale visible, but it does not widen hidden operational detail without a lawful need."
        rows={[
          {
            label: "Fallback type",
            value: titleCase(recoveryCase.fallbackType),
          },
          {
            label: "Patient wording",
            value:
              recoveryCase.noSlotResolutionPanel?.patientPreview.summary ??
              recoveryCase.returnToPracticeReceipt?.summary ??
              recoveryCase.mastheadSummary,
          },
          {
            label: "Practice wording",
            value:
              recoveryCase.noSlotResolutionPanel?.practicePreview.summary ??
              recoveryCase.returnToPracticeReceipt?.reopenLinkageSummary ??
              "Practice-facing detail remains limited until the current recovery linkage is lawful.",
          },
        ]}
        reasonLabel={titleCase(recoveryCase.fallbackType)}
      />
      <CrossOrgContentLegend
        title="Recovery wording legend"
        summary="Recovery, callback, and return wording remain explicit about what is pending, linked, or history-only."
        items={hubRecoveryLegendItems()}
      />
      <HubUrgentBounceBackBanner banner={recoveryCase.urgentBounceBackBanner} onNavigate={props.onNavigate} />
      <HubRecoveryDiffStrip panel={recoveryCase.recoveryDiffStrip} />
      <HubNoSlotResolutionPanel panel={recoveryCase.noSlotResolutionPanel} onNavigate={props.onNavigate} />
      <HubCallbackTransferPendingState panel={recoveryCase.callbackTransferPendingState} />
      <HubReturnToPracticeReceipt panel={recoveryCase.returnToPracticeReceipt} />
      <HubSupervisorEscalationPanel panel={recoveryCase.supervisorEscalationPanel} />
      <HubReopenProvenanceStub panel={recoveryCase.reopenProvenanceStub} />
    </section>
  );
}

function HubExceptionDetailDrawer(props: {
  detail: NonNullable<HubShellSnapshot["exceptionWorkspace"]>["detailDrawer"];
  onNavigate: (path: string) => void;
}) {
  return (
    <aside
      className="hub-exception-drawer"
      data-testid="HubExceptionDetailDrawer"
      data-open="true"
      aria-labelledby="hub-exception-drawer-title"
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Detail drawer</p>
          <h3 id="hub-exception-drawer-title">{hubPublicText(props.detail.title)}</h3>
        </div>
        <span className="hub-chip" data-tone="watch">
          {hubPublicText(titleCase(props.detail.fallbackType))}
        </span>
      </header>
      <p className="hub-recovery-panel__summary">{hubPublicText(props.detail.summary)}</p>
      <dl className="hub-fact-grid">
        {props.detail.blockerRows.map((row) => (
          <div key={`blocker-${row.label}`}>
            <dt>{hubPublicText(row.label)}</dt>
            <dd>{hubPublicText(row.value)}</dd>
          </div>
        ))}
      </dl>
      <section className="hub-exception-drawer__section">
        <header className="hub-subpanel-header">
          <div>
            <p className="hub-eyebrow">Evidence</p>
            <h4>Current authority set</h4>
          </div>
        </header>
        <dl className="hub-fact-grid">
          {props.detail.evidenceRows.map((row) => (
            <div key={`evidence-${row.label}`}>
              <dt>{hubPublicText(row.label)}</dt>
              <dd>{hubPublicText(row.value)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="hub-exception-drawer__section">
        <header className="hub-subpanel-header">
          <div>
            <p className="hub-eyebrow">Next safe actions</p>
            <h4>Limited recovery steps</h4>
          </div>
        </header>
        <ul className="hub-highlight-list">
          {props.detail.nextSafeActions.map((action) => (
            <li key={action}>{hubPublicText(action)}</li>
          ))}
        </ul>
        <p className="hub-recovery-panel__footer-copy">
          {hubPublicText(props.detail.escalationSummary)}
        </p>
      </section>
      <button
        type="button"
        className="hub-primary-button"
        onClick={() => props.onNavigate(props.detail.routePath)}
      >
        Open active recovery case
      </button>
    </aside>
  );
}

function HubExceptionQueueView(props: {
  snapshot: HubShellSnapshot;
  onSelectException: (exceptionId: string) => void;
  onNavigate: (path: string) => void;
}) {
  const workspace = props.snapshot.exceptionWorkspace;
  if (!workspace) {
    return null;
  }
  return (
    <section
      className="hub-exception-workspace"
      data-hub-recovery="true"
      data-visual-mode={workspace.visualMode}
      data-testid="HubExceptionQueueView"
    >
      <div className="hub-exception-list-pane">
        <header className="hub-subpanel-header">
          <div>
            <p className="hub-eyebrow">Exceptions</p>
            <h2>{workspace.title}</h2>
          </div>
          <span>{workspace.rows.length} open</span>
        </header>
        <p className="hub-recovery-panel__summary">{workspace.summary}</p>
        <div className="hub-exception-list" role="list" aria-label="Hub exception queue">
          {workspace.rows.map((row) => (
            <button
              key={row.exceptionId}
              type="button"
              className="hub-exception-row"
              data-hub-exception-row={row.exceptionId}
              data-active={row.active}
              data-tone={row.severity}
              data-fallback-type={row.fallbackType}
              data-testid={`hub-exception-row-${row.exceptionId}`}
              aria-current={row.active ? "true" : undefined}
              aria-controls="hub-exception-drawer-title"
              onClick={() => props.onSelectException(row.exceptionId)}
            >
              <div className="hub-exception-row__copy">
                <strong>{row.title}</strong>
                <span>{row.summary}</span>
              </div>
              <div className="hub-exception-row__meta">
                <span className="hub-chip" data-tone={row.severity}>
                  {titleCase(row.exceptionClass)}
                </span>
                <span className="hub-chip" data-tone={toneForRetryState(row.retryState)}>
                  {titleCase(row.retryState)}
                </span>
                <span className="hub-chip" data-tone={toneForEscalationState(row.escalationState)}>
                  {titleCase(row.escalationState)}
                </span>
                <small>{row.dueLabel}</small>
                <small>{row.updatedAt}</small>
              </div>
            </button>
          ))}
        </div>
      </div>
      <HubExceptionDetailDrawer detail={workspace.detailDrawer} onNavigate={props.onNavigate} />
    </section>
  );
}

function HubQueueCandidateWorkbench(props: {
  snapshot: HubShellSnapshot;
  commitUiState: HubCommitUiState;
  selectedAnchorAttributes: (caseId: string) => Readonly<Record<string, string>>;
  dominantActionAttributes: Readonly<Record<string, string>>;
  onNavigate: (path: string) => void;
  onSelectSavedView: (savedViewId: HubSavedViewId) => void;
  onSelectFilter: (filterId: HubQueueFilterId) => void;
  onSelectCase: (caseId: string) => void;
  onOpenCase: (caseId: string) => void;
  onSelectOption: (optionCardId: string) => void;
  onBufferQueueDelta: () => void;
  onApplyQueueDelta: () => void;
  onReturn: () => void;
  onOpenScopeDrawer: () => void;
  onBeginNativeBooking: (caseId: string) => void;
  onAttachManualProof: (caseId: string) => void;
  onCancelManualProof: () => void;
  onRecordSupplierConfirmation: (caseId: string) => void;
  onAcknowledgePractice: (caseId: string) => void;
  onToggleImportedReview: (caseId: string) => void;
  onToggleContinuityDrawer: (caseId: string) => void;
}) {
  const isQueue = props.snapshot.location.viewMode === "queue";
  const controlPlane = props.snapshot.actingContextControlPlane;
  const selectedRow =
    props.snapshot.queueWorkbench.visibleRows.find((row) => row.selected) ??
    props.snapshot.queueWorkbench.visibleRows[0];

  return (
    <section
      className="hub-queue-candidate-workbench"
      data-testid={isQueue ? "hub-start-of-day" : "hub-case-route"}
      data-hub-start-of-day={isQueue ? "true" : undefined}
      data-queue-visual-mode={props.snapshot.queueVisualMode}
    >
      <HubQueueWorkbench
        snapshot={props.snapshot}
        selectedAnchorAttributes={props.selectedAnchorAttributes}
        onSelectSavedView={props.onSelectSavedView}
        onSelectFilter={props.onSelectFilter}
        onSelectCase={props.onSelectCase}
        onOpenCase={props.onOpenCase}
        onBufferQueueDelta={props.onBufferQueueDelta}
        onApplyQueueDelta={props.onApplyQueueDelta}
      />
      <div className="hub-queue-candidate-workbench__centre">
        <AccessScopeTransitionReceipt receipt={controlPlane.accessScopeTransitionReceipt} />
        <ScopeDriftFreezeBanner
          banner={controlPlane.scopeDriftFreezeBanner}
          onOpenDrawer={props.onOpenScopeDrawer}
        />
        {controlPlane.accessDeniedState ? (
          <HubAccessDeniedState
            state={controlPlane.accessDeniedState}
            onOpenDrawer={props.onOpenScopeDrawer}
            onNavigate={props.onNavigate}
          />
        ) : (
          <>
            <HubBestFitNowStrip snapshot={props.snapshot} />
            {selectedRow ? (
              <HubBreachHorizonMeter
                label={`${Math.round(selectedRow.breachProbability * 100)}% current queue pressure`}
                summary={selectedRow.breachSummary}
                probability={selectedRow.breachProbability}
                tone={toneForRiskBand(selectedRow.riskBand)}
              />
            ) : null}
            <HubEscalationBannerLane snapshot={props.snapshot} onNavigate={props.onNavigate} />
            {!isQueue ? (
              <HubRecoveryCaseCanvas snapshot={props.snapshot} onNavigate={props.onNavigate} />
            ) : null}
            <HubOptionCardStack
              snapshot={props.snapshot}
              onSelectOption={props.onSelectOption}
              onNavigate={props.onNavigate}
            />
            {controlPlane.minimumNecessaryPlaceholders.length > 0 ? (
              <section className="hub-placeholder-grid">
                {controlPlane.minimumNecessaryPlaceholders.map((block) => (
                  <MinimumNecessaryPlaceholderBlock key={block.blockId} block={block} />
                ))}
              </section>
            ) : null}
            {!isQueue ? (
              <>
                <HubCaseStageHost
                  snapshot={props.snapshot}
                  onNavigate={props.onNavigate}
                  onReturn={props.onReturn}
                />
                {controlPlane.accessPosture !== "frozen" ? (
                  <HubCommitConfirmationPane
                    snapshot={props.snapshot}
                    uiState={props.commitUiState}
                    onBeginNativeBooking={props.onBeginNativeBooking}
                    onAttachManualProof={props.onAttachManualProof}
                    onCancelManualProof={props.onCancelManualProof}
                    onRecordSupplierConfirmation={props.onRecordSupplierConfirmation}
                    onAcknowledgePractice={props.onAcknowledgePractice}
                    onToggleImportedReview={props.onToggleImportedReview}
                    onToggleContinuityDrawer={props.onToggleContinuityDrawer}
                  />
                ) : null}
              </>
            ) : null}
          </>
        )}
      </div>
      <div className="hub-queue-candidate-workbench__right">
        {controlPlane.accessDeniedState || controlPlane.accessPosture === "frozen" ? (
          <VisibilityEnvelopeLegend descriptor={controlPlane.visibilityEnvelopeLegend} />
        ) : (
          <HubDecisionDockHost
            snapshot={props.snapshot}
            onNavigate={props.onNavigate}
            dominantActionAttributes={props.dominantActionAttributes}
          />
        )}
        <HubInterruptionDigestPanel snapshot={props.snapshot} onNavigate={props.onNavigate} />
      </div>
    </section>
  );
}

function HubResponsiveSafeAreaFrame(props: {
  snapshot: HubShellSnapshot;
  breakpointClass: HubBreakpointClass;
  children: React.ReactNode;
}) {
  return (
    <section
      className="hub-responsive-safe-area-frame"
      data-testid="HubResponsiveSafeAreaFrame"
      data-layout-topology="mission_stack"
      data-breakpoint-class={props.breakpointClass}
      data-visual-mode={HUB_MISSION_STACK_VISUAL_MODE}
      data-support-fallback-mode="drawer"
    >
      {props.children}
    </section>
  );
}

function HubNarrowStatusAuthorityStrip(props: {
  snapshot: HubShellSnapshot;
  onOpenScopeDrawer: () => void;
}) {
  return (
    <section
      className="hub-narrow-status-strip"
      data-testid="HubNarrowStatusAuthorityStrip"
      aria-label="Mission stack status authority"
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Mission stack</p>
          <h2>Current status</h2>
        </div>
        <button
          type="button"
          className="hub-secondary-button"
          onClick={props.onOpenScopeDrawer}
        >
          Scope and visibility
        </button>
      </header>
      <div className="hub-narrow-status-strip__signals">
        {props.snapshot.statusSignals.map((signal) => (
          <article
            key={signal.signalId}
            className="hub-narrow-status-card"
            data-tone={signal.tone}
          >
            <p className="hub-section-label">{signal.label}</p>
            <strong>{signal.value}</strong>
            <span>{signal.summary}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function HubCasePulseCompact(props: { snapshot: HubShellSnapshot }) {
  return (
    <section
      className="hub-case-pulse-compact"
      data-testid="HubCasePulseCompact"
      data-view-mode={props.snapshot.location.viewMode}
      data-current-case={props.snapshot.currentCase.caseId}
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Case pulse</p>
          <h2>{props.snapshot.currentCase.patientLabel}</h2>
        </div>
        <div className="hub-case-pulse-compact__chips">
          <HubOwnershipContextChip
            ownershipState={props.snapshot.currentCase.ownershipState}
            label={props.snapshot.currentCase.ownershipLabel}
          />
          <span
            className="hub-chip"
            data-tone={toneForRecoveryPosture(props.snapshot.recoveryPosture)}
          >
            {titleCase(props.snapshot.location.viewMode)}
          </span>
        </div>
      </header>
      <p className="hub-case-pulse-compact__summary">
        {hubPublicText(props.snapshot.currentCase.queueSummary)}
      </p>
      <dl className="hub-case-pulse-compact__facts">
        <div>
          <dt>Checkpoint</dt>
          <dd>{hubPublicText(props.snapshot.currentCase.currentCheckpointLabel)}</dd>
        </div>
        <div>
          <dt>Freshness</dt>
          <dd>{hubPublicText(props.snapshot.currentCase.freshestEvidenceLabel)}</dd>
        </div>
        <div>
          <dt>Selected option</dt>
          <dd>{props.snapshot.selectedOptionCard.title}</dd>
        </div>
        <div>
          <dt>Trust</dt>
          <dd>{hubPublicText(props.snapshot.selectedOptionCard.sourceTrustSummary)}</dd>
        </div>
      </dl>
    </section>
  );
}

function HubNarrowQueueWorkbench(props: {
  snapshot: HubShellSnapshot;
  selectedAnchorAttributes: (caseId: string) => Readonly<Record<string, string>>;
  onSelectSavedView: (savedViewId: HubSavedViewId) => void;
  onSelectFilter: (filterId: HubQueueFilterId) => void;
  onSelectCase: (caseId: string) => void;
  onBufferQueueDelta: () => void;
  onApplyQueueDelta: () => void;
}) {
  const batch = props.snapshot.queueWorkbench.queueChangeBatch;
  const savedViews = [
    "resume_today",
    "ack_watch",
    "callback_recovery",
    "supplier_drift",
    "observe_only",
  ] as const;
  const filters: readonly {
    filterId: HubQueueFilterId;
    label: string;
    summary: string;
  }[] = [
    { filterId: "all", label: "All rows", summary: "Keep authoritative order intact." },
    {
      filterId: "critical",
      label: "Critical",
      summary: "Imminent breach or recovery-required rows only.",
    },
    {
      filterId: "same_day",
      label: "Same day",
      summary: "Today-bound work without reranking it locally.",
    },
    {
      filterId: "degraded",
      label: "Trust issues",
      summary: "Rows where degraded or quarantined supply matters.",
    },
    { filterId: "callback", label: "Callback", summary: "Rows with a lawful callback fallback." },
  ];
  const selectedRow =
    props.snapshot.queueWorkbench.visibleRows.find((row) => row.selected) ??
    props.snapshot.queueWorkbench.visibleRows[0];
  const visibleRows =
    props.snapshot.location.viewMode === "queue"
      ? props.snapshot.queueWorkbench.visibleRows
      : [
          selectedRow,
          ...props.snapshot.queueWorkbench.visibleRows
            .filter((row) => row.caseId !== selectedRow?.caseId)
            .slice(0, 2),
        ].filter((row): row is NonNullable<typeof row> => row != null);

  return (
    <section
      className="hub-narrow-queue-workbench"
      data-testid="HubNarrowQueueWorkbench"
      aria-label="Mission stack queue workbench"
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Queue context</p>
          <h2>{props.snapshot.savedView.label}</h2>
        </div>
        <span>{visibleRows.length} visible</span>
      </header>

      <nav
        className="hub-narrow-queue-workbench__saved-views"
        aria-label="Hub mission stack saved views"
      >
        {savedViews.map((savedViewId) => (
          <button
            key={savedViewId}
            type="button"
            className="hub-saved-view-card hub-saved-view-card--compact"
            data-active={props.snapshot.savedView.savedViewId === savedViewId}
            data-testid={`hub-mission-stack-saved-view-${savedViewId}`}
            onClick={() => props.onSelectSavedView(savedViewId)}
          >
            <strong>
              {props.snapshot.savedView.savedViewId === savedViewId
                ? props.snapshot.savedView.label
                : titleCase(savedViewId)}
            </strong>
            <span>{props.snapshot.queueWorkbench.savedViewSummary}</span>
          </button>
        ))}
      </nav>

      <div
        className="hub-narrow-queue-workbench__filters"
        role="toolbar"
        aria-label="Hub mission stack queue filters"
      >
        {filters.map((filter) => (
          <button
            key={filter.filterId}
            type="button"
            className="hub-workbench-filter"
            data-active={props.snapshot.queueWorkbench.selectedFilterId === filter.filterId}
            data-testid={`hub-mission-stack-filter-${filter.filterId}`}
            onClick={() => props.onSelectFilter(filter.filterId)}
          >
            <span>{filter.label}</span>
            <small>{filter.summary}</small>
          </button>
        ))}
      </div>

      <div className="hub-risk-strip">
        {props.snapshot.queueWorkbench.riskSummary.map((chip) => (
          <article
            key={chip.riskBand}
            className="hub-risk-chip"
            data-tone={toneForRiskBand(chip.riskBand)}
          >
            <div>
              <strong>{chip.count}</strong>
              <span>{chip.label}</span>
            </div>
            <p>{hubPublicText(chip.summary)}</p>
          </article>
        ))}
      </div>

      {batch ? (
        <section
          className="hub-queue-batch"
          data-queue-change-state={batch.state}
          aria-live={batch.state === "buffered" ? "polite" : "off"}
        >
          <strong>{hubPublicText(batch.summary)}</strong>
          <p>{hubPublicText(batch.followUpLabel)}</p>
          <div className="hub-control-plane-actions">
            <button
              type="button"
              className="hub-secondary-button"
              onClick={props.onBufferQueueDelta}
            >
              Preview change
            </button>
            <button
              type="button"
              className="hub-primary-button"
              onClick={props.onApplyQueueDelta}
            >
              Apply update
            </button>
          </div>
        </section>
      ) : null}

      <ol className="hub-narrow-queue-workbench__list">
        {visibleRows.map((row, index) => (
          <li
            key={row.caseId}
            className="hub-narrow-queue-row"
            data-selected-case={row.selected}
            data-hub-queue-row={row.caseId}
          >
            <button
              type="button"
              className="hub-narrow-queue-row__main"
              onClick={() => props.onSelectCase(row.caseId)}
              {...props.selectedAnchorAttributes(row.caseId)}
            >
              <div className="hub-narrow-queue-row__rank">
                <span>{index + 1}</span>
                <small>{row.queueLabel}</small>
              </div>
              <div className="hub-narrow-queue-row__body">
                <strong>{row.patientLabel}</strong>
                <span>{hubPublicText(row.queueSummary)}</span>
                <div className="hub-narrow-queue-row__signals">
                  <span className="hub-chip" data-tone={toneForRiskBand(row.riskBand)}>
                    {hubPublicText(row.breachSummary)}
                  </span>
                  <span className="hub-chip" data-tone="neutral">
                    {hubPublicText(row.trustSummary)}
                  </span>
                  <span className="hub-chip" data-tone="neutral">
                    {row.freshnessLabel}
                  </span>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ol>

      <p className="hub-queue-workbench__footer">
        {props.snapshot.queueWorkbench.fairnessMergeState}
      </p>
    </section>
  );
}

function HubOptionCardCompactStack(props: {
  snapshot: HubShellSnapshot;
  onSelectOption: (optionCardId: string) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <section
      className="hub-option-compact-stack"
      data-testid="HubOptionCardCompactStack"
      aria-label="Mission stack ranked candidate stack"
    >
      {props.snapshot.optionCardGroups.map((group) => (
        <section
          key={group.groupId}
          className="hub-option-compact-group"
          data-window-class={group.windowClass}
        >
          <header className="hub-option-compact-group__header">
            <div>
              <p className="hub-eyebrow">Window class {group.windowClass}</p>
              <h3>{group.label}</h3>
            </div>
            <span>{group.summary}</span>
          </header>
          <div className="hub-option-compact-group__cards">
            {group.cards.map((card) => (
              <button
                key={card.optionCardId}
                type="button"
                className="hub-option-compact-card"
                data-option-card={card.optionCardId}
                data-selected={card.selectedState ? "true" : "false"}
                data-reservation-truth={card.reservationTruthState}
                data-offerability-state={card.offerabilityState}
                onClick={() => props.onSelectOption(card.optionCardId)}
              >
                <div className="hub-option-compact-card__header">
                  <div className="hub-option-compact-card__rank">
                    <span>#{card.rankOrdinal}</span>
                    <small>W{card.windowClass}</small>
                  </div>
                  <div className="hub-option-compact-card__copy">
                    <strong>{card.title}</strong>
                  <span>{hubPublicText(card.secondaryLine)}</span>
                  </div>
                  <span
                    className="hub-chip"
                    data-tone={card.approvedVarianceVisible ? "watch" : "ready"}
                  >
                    {hubPublicText(card.comparisonLabel)}
                  </span>
                </div>
                <div className="hub-option-compact-card__chips">
                  <span className="hub-chip" data-tone={toneForTrustState(card.sourceTrustState)}>
                    {titleCase(card.sourceTrustState)}
                  </span>
                  <span className="hub-chip" data-tone={toneForFreshness(card.freshnessBand)}>
                    {card.freshnessSummary}
                  </span>
                  <span
                    className="hub-chip"
                    data-tone={toneForReservationTruth(card.reservationTruthState)}
                  >
                    {hubPublicText(card.reservationTruthSummary)}
                  </span>
                </div>
                <div className="hub-option-compact-card__reasons">
                  {card.rankReasons.map((reason) => (
                    <span key={reason.reasonId} className="hub-reason-chip">
                      {hubPublicText(reason.label)}
                    </span>
                  ))}
                </div>
                {card.selectedState ? (
                  <p className="hub-option-compact-card__summary">
                    {hubPublicText(card.dominantActionSummary)}
                  </p>
                ) : null}
              </button>
            ))}
          </div>
        </section>
      ))}
      {props.snapshot.callbackFallbackCard ? (
        <article
          className="hub-callback-card hub-callback-card--compact"
          data-callback-fallback="true"
          data-testid="hub-callback-fallback"
        >
          <div>
            <p className="hub-eyebrow">Callback fallback</p>
            <h3>{props.snapshot.callbackFallbackCard.title}</h3>
            <p>{props.snapshot.callbackFallbackCard.summary}</p>
            <small>{props.snapshot.callbackFallbackCard.followUpLabel}</small>
          </div>
          <button
            type="button"
            className="hub-secondary-button"
            onClick={() =>
              props.onNavigate(props.snapshot.callbackFallbackCard?.routePath ?? "/hub/exceptions")
            }
          >
            {props.snapshot.callbackFallbackCard.actionLabel}
          </button>
        </article>
      ) : null}
    </section>
  );
}

function HubExceptionsMissionStackView(props: {
  snapshot: HubShellSnapshot;
  onSelectException: (exceptionId: string) => void;
  onOpenSupportRegion: (region: HubMissionSupportRegion) => void;
}) {
  const workspace = props.snapshot.exceptionWorkspace;
  if (!workspace) {
    return null;
  }

  return (
    <section
      className="hub-exceptions-mission-stack"
      data-testid="HubExceptionsMissionStackView"
      data-selected-exception={workspace.selectedExceptionId}
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Exceptions</p>
          <h2>{workspace.title}</h2>
        </div>
        <span>{workspace.rows.length} open</span>
      </header>
      <p className="hub-recovery-panel__summary">{workspace.summary}</p>
      <article className="hub-exceptions-mission-stack__detail-stub">
        <strong>{workspace.detailDrawer.title}</strong>
        <span>{workspace.detailDrawer.summary}</span>
        <button
          type="button"
          className="hub-secondary-button"
          onClick={() => props.onOpenSupportRegion("exceptions")}
        >
          Open exception detail
        </button>
      </article>
      <div className="hub-exception-list" role="list" aria-label="Mission stack exception queue">
        {workspace.rows.map((row) => (
          <button
            key={row.exceptionId}
            type="button"
            className="hub-exception-row"
            data-hub-exception-row={row.exceptionId}
            data-active={row.active}
            data-tone={row.severity}
            data-fallback-type={row.fallbackType}
            data-testid={`hub-exception-row-${row.exceptionId}`}
            onClick={() => {
              props.onSelectException(row.exceptionId);
              props.onOpenSupportRegion("exceptions");
            }}
          >
            <div className="hub-exception-row__copy">
              <strong>{row.title}</strong>
              <span>{row.summary}</span>
            </div>
            <div className="hub-exception-row__meta">
              <span className="hub-chip" data-tone={row.severity}>
                {titleCase(row.exceptionClass)}
              </span>
              <span className="hub-chip" data-tone={toneForRetryState(row.retryState)}>
                {titleCase(row.retryState)}
              </span>
              <span className="hub-chip" data-tone={toneForEscalationState(row.escalationState)}>
                {titleCase(row.escalationState)}
              </span>
              <small>{row.dueLabel}</small>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function HubSupportDrawer(props: {
  snapshot: HubShellSnapshot;
  open: boolean;
  region: HubMissionSupportRegion;
  onClose: () => void;
  onOpenScopeDrawer: () => void;
  onNavigate: (path: string) => void;
}) {
  if (!props.open) {
    return null;
  }

  let content: React.ReactNode;
  switch (props.region) {
    case "visibility":
      content = (
        <div className="hub-support-drawer__stack">
          <HubScopeSummaryStrip snapshot={props.snapshot} />
          <VisibilityEnvelopeLegend
            descriptor={props.snapshot.actingContextControlPlane.visibilityEnvelopeLegend}
          />
          {props.snapshot.actingContextControlPlane.accessDeniedState ? (
            <HubAccessDeniedState
              state={props.snapshot.actingContextControlPlane.accessDeniedState}
              onOpenDrawer={props.onOpenScopeDrawer}
              onNavigate={props.onNavigate}
            />
          ) : null}
        </div>
      );
      break;
    case "support":
      content = <HubRightRailHost snapshot={props.snapshot} />;
      break;
    case "exceptions":
      content = props.snapshot.exceptionWorkspace ? (
        <HubExceptionDetailDrawer
          detail={props.snapshot.exceptionWorkspace.detailDrawer}
          onNavigate={props.onNavigate}
        />
      ) : (
        <HubRightRailHost snapshot={props.snapshot} />
      );
      break;
    case "interruptions":
    default:
      content = <HubInterruptionDigestPanel snapshot={props.snapshot} onNavigate={props.onNavigate} />;
      break;
  }

  return (
    <>
      <button
        type="button"
        className="hub-support-drawer__scrim"
        aria-label="Close support drawer"
        onClick={props.onClose}
      />
      <aside
        className="hub-support-drawer"
        data-testid="HubSupportDrawer"
        data-open="true"
        data-support-region={props.region}
        aria-labelledby="hub-support-drawer-title"
      >
        <header className="hub-subpanel-header">
          <div>
            <p className="hub-eyebrow">Support drawer</p>
            <h2 id="hub-support-drawer-title">{labelForMissionSupportRegion(props.region)}</h2>
          </div>
          <button type="button" className="hub-secondary-button" onClick={props.onClose}>
            Close
          </button>
        </header>
        {content}
      </aside>
    </>
  );
}

function HubDecisionDockBar(props: {
  snapshot: HubShellSnapshot;
  dominantActionAttributes: Readonly<Record<string, string>>;
  onNavigate: (path: string) => void;
  onOpenScopeDrawer: () => void;
}) {
  const blocked =
    props.snapshot.actingContextControlPlane.accessDeniedState ||
    props.snapshot.actingContextControlPlane.accessPosture === "frozen";
  const dockTitle = blocked ? "Recovery action" : props.snapshot.decisionDockHost.title;
  const dockSummary = blocked
    ? props.snapshot.actingContextControlPlane.accessDeniedState?.summary ??
      props.snapshot.actingContextControlPlane.scopeDriftFreezeBanner?.summary ??
      props.snapshot.decisionDockHost.summary
    : props.snapshot.decisionDockHost.summary;
  const actionLabel = blocked
    ? "Review scope and visibility"
    : props.snapshot.decisionDockHost.dominantActionLabel;
  const actionTone = blocked ? "critical" : toneForRecoveryPosture(props.snapshot.recoveryPosture);

  return (
    <section
      className="hub-decision-dock-bar"
      data-testid="HubDecisionDockBar"
      data-dominant-region="true"
      data-sticky-decision-dock="true"
      data-selected-option={props.snapshot.selectedOptionCard.optionCardId}
    >
      <div className="hub-decision-dock-bar__copy">
        <p className="hub-eyebrow">Next action</p>
        <strong>{hubPublicText(dockTitle)}</strong>
        <span>{hubPublicText(dockSummary)}</span>
      </div>
      <div className="hub-decision-dock-bar__facts">
        {props.snapshot.decisionDockHost.supportingFacts.slice(0, 2).map((fact) => (
          <span key={fact.label} className="hub-chip" data-tone="neutral">
            {hubPublicText(fact.label)}: {hubPublicText(fact.value)}
          </span>
        ))}
      </div>
      <button
        type="button"
        className="hub-primary-button"
        data-tone={actionTone}
        data-testid="hub-mission-stack-dominant-action"
        onClick={() =>
          blocked
            ? props.onOpenScopeDrawer()
            : props.onNavigate(props.snapshot.decisionDockHost.dominantActionPath)
        }
        {...(blocked ? {} : props.dominantActionAttributes)}
      >
        {actionLabel}
      </button>
    </section>
  );
}

function HubMissionStackContinuityBinder(props: {
  snapshot: HubShellSnapshot;
  state: HubShellState;
  focusRestoreAttributes: Readonly<Record<string, string>>;
  supportDrawerOpen: boolean;
  supportRegion: HubMissionSupportRegion;
  breakpointClass: HubBreakpointClass;
}) {
  return (
    <div
      className="hub-visually-hidden"
      data-testid="HubMissionStackContinuityBinder"
      data-support-drawer-open={props.supportDrawerOpen ? "true" : "false"}
      data-support-region={props.supportRegion}
      data-breakpoint-class={props.breakpointClass}
      data-selected-option-card={props.state.selectedOptionCardId}
      data-current-layout="mission_stack"
    >
      <HubShellContinuityBinder
        snapshot={props.snapshot}
        state={props.state}
        focusRestoreAttributes={props.focusRestoreAttributes}
      />
    </div>
  );
}

function HubMissionStackLayout(props: {
  snapshot: HubShellSnapshot;
  state: HubShellState;
  breakpointClass: HubBreakpointClass;
  commitUiState: HubCommitUiState;
  supportDrawerOpen: boolean;
  supportRegion: HubMissionSupportRegion;
  selectedAnchorAttributes: (caseId: string) => Readonly<Record<string, string>>;
  dominantActionAttributes: Readonly<Record<string, string>>;
  onNavigate: (path: string) => void;
  onSelectSavedView: (savedViewId: HubSavedViewId) => void;
  onSelectFilter: (filterId: HubQueueFilterId) => void;
  onSelectCase: (caseId: string) => void;
  onSelectException: (exceptionId: string) => void;
  onSelectOption: (optionCardId: string) => void;
  onBufferQueueDelta: () => void;
  onApplyQueueDelta: () => void;
  onReturn: () => void;
  onOpenScopeDrawer: () => void;
  onOpenSupportRegion: (region: HubMissionSupportRegion) => void;
  onCloseSupportDrawer: () => void;
  onBeginNativeBooking: (caseId: string) => void;
  onAttachManualProof: (caseId: string) => void;
  onCancelManualProof: () => void;
  onRecordSupplierConfirmation: (caseId: string) => void;
  onAcknowledgePractice: (caseId: string) => void;
  onToggleImportedReview: (caseId: string) => void;
  onToggleContinuityDrawer: (caseId: string) => void;
}) {
  const controlPlane = props.snapshot.actingContextControlPlane;
  const showCandidateStack =
    props.snapshot.location.viewMode === "queue" ||
    props.snapshot.location.viewMode === "case" ||
    props.snapshot.location.viewMode === "alternatives";
  const showStageHost =
    props.snapshot.location.viewMode !== "queue" &&
    props.snapshot.location.viewMode !== "exceptions";
  const showCommitPane =
    (props.snapshot.location.viewMode === "case" ||
      props.snapshot.location.viewMode === "audit") &&
    controlPlane.accessPosture !== "frozen";
  const supportOptions: readonly HubMissionSupportRegion[] =
    props.snapshot.location.viewMode === "exceptions"
      ? ["exceptions", "visibility"]
      : ["interruptions", "support", "visibility"];

  return (
    <HubResponsiveSafeAreaFrame
      snapshot={props.snapshot}
      breakpointClass={props.breakpointClass}
    >
      <HubNarrowStatusAuthorityStrip
        snapshot={props.snapshot}
        onOpenScopeDrawer={props.onOpenScopeDrawer}
      />
      <HubCasePulseCompact snapshot={props.snapshot} />
      <HubNarrowQueueWorkbench
        snapshot={props.snapshot}
        selectedAnchorAttributes={props.selectedAnchorAttributes}
        onSelectSavedView={props.onSelectSavedView}
        onSelectFilter={props.onSelectFilter}
        onSelectCase={props.onSelectCase}
        onBufferQueueDelta={props.onBufferQueueDelta}
        onApplyQueueDelta={props.onApplyQueueDelta}
      />

      <section
        className="hub-mission-stack__primary"
        data-testid="HubMissionStackLayout"
        data-visual-mode={HUB_MISSION_STACK_VISUAL_MODE}
      >
        <AccessScopeTransitionReceipt receipt={controlPlane.accessScopeTransitionReceipt} />
        <ScopeDriftFreezeBanner
          banner={controlPlane.scopeDriftFreezeBanner}
          onOpenDrawer={props.onOpenScopeDrawer}
        />

        {props.snapshot.location.viewMode === "exceptions" ? (
          <HubExceptionsMissionStackView
            snapshot={props.snapshot}
            onSelectException={props.onSelectException}
            onOpenSupportRegion={props.onOpenSupportRegion}
          />
        ) : controlPlane.accessDeniedState ? (
          <HubAccessDeniedState
            state={controlPlane.accessDeniedState}
            onOpenDrawer={props.onOpenScopeDrawer}
            onNavigate={props.onNavigate}
          />
        ) : (
          <>
            {showCandidateStack ? <HubBestFitNowStrip snapshot={props.snapshot} /> : null}
            {showCandidateStack ? (
              <HubEscalationBannerLane snapshot={props.snapshot} onNavigate={props.onNavigate} />
            ) : null}
            {props.snapshot.location.viewMode === "case" ? (
              <HubRecoveryCaseCanvas snapshot={props.snapshot} onNavigate={props.onNavigate} />
            ) : null}
            {showCandidateStack ? (
              <HubOptionCardCompactStack
                snapshot={props.snapshot}
                onSelectOption={props.onSelectOption}
                onNavigate={props.onNavigate}
              />
            ) : null}
            {controlPlane.minimumNecessaryPlaceholders.length > 0 ? (
              <section className="hub-placeholder-grid">
                {controlPlane.minimumNecessaryPlaceholders.map((block) => (
                  <MinimumNecessaryPlaceholderBlock key={block.blockId} block={block} />
                ))}
              </section>
            ) : null}
            {showStageHost ? (
              <HubCaseStageHost
                snapshot={props.snapshot}
                onNavigate={props.onNavigate}
                onReturn={props.onReturn}
              />
            ) : null}
            {showCommitPane ? (
              <HubCommitConfirmationPane
                snapshot={props.snapshot}
                uiState={props.commitUiState}
                onBeginNativeBooking={props.onBeginNativeBooking}
                onAttachManualProof={props.onAttachManualProof}
                onCancelManualProof={props.onCancelManualProof}
                onRecordSupplierConfirmation={props.onRecordSupplierConfirmation}
                onAcknowledgePractice={props.onAcknowledgePractice}
                onToggleImportedReview={props.onToggleImportedReview}
                onToggleContinuityDrawer={props.onToggleContinuityDrawer}
              />
            ) : null}
          </>
        )}
      </section>

      {props.snapshot.location.viewMode !== "exceptions" ? (
        <section className="hub-mission-stack__support-stub" data-testid="HubMissionSupportStub">
          <header className="hub-subpanel-header">
            <div>
              <p className="hub-eyebrow">Blocker and evidence</p>
              <h3>{props.snapshot.rightRailHost.title}</h3>
            </div>
            <span>{props.snapshot.rightRailHost.summary}</span>
          </header>
          <dl className="hub-fact-grid">
            {props.snapshot.rightRailHost.items.slice(0, 2).map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className="hub-support-trigger-row" data-testid="HubSupportTriggerRow">
        {supportOptions.map((region) => (
          <button
            key={region}
            type="button"
            className="hub-secondary-button hub-support-trigger-row__button"
            data-active={
              props.supportDrawerOpen && props.supportRegion === region ? "true" : "false"
            }
            data-support-region={region}
            onClick={() => props.onOpenSupportRegion(region)}
          >
            {labelForMissionSupportRegion(region)}
          </button>
        ))}
      </section>

      <HubSupportDrawer
        snapshot={props.snapshot}
        open={props.supportDrawerOpen}
        region={props.supportRegion}
        onClose={props.onCloseSupportDrawer}
        onOpenScopeDrawer={props.onOpenScopeDrawer}
        onNavigate={props.onNavigate}
      />

      <HubDecisionDockBar
        snapshot={props.snapshot}
        dominantActionAttributes={props.dominantActionAttributes}
        onNavigate={props.onNavigate}
        onOpenScopeDrawer={props.onOpenScopeDrawer}
      />
    </HubResponsiveSafeAreaFrame>
  );
}

function HubStartOfDayResumeCard(props: {
  snapshot: HubShellSnapshot;
  dominantActionAttributes: Readonly<Record<string, string>>;
  onNavigate: (path: string) => void;
}) {
  const { resumeCard } = props.snapshot;
  return (
    <article
      className="hub-resume-card"
      data-testid="HubStartOfDayResumeCard"
      data-dominant-region="true"
      data-dominant-action={resumeCard.dominantActionLabel}
    >
      <div className="hub-resume-card__header">
        <div>
          <p className="hub-eyebrow">Start of day</p>
          <h2>{resumeCard.title}</h2>
        </div>
        <HubOwnershipContextChip
          ownershipState={props.snapshot.currentCase.ownershipState}
          label={props.snapshot.currentCase.ownershipLabel}
        />
      </div>
      <p className="hub-resume-card__summary">{hubPublicText(resumeCard.summary)}</p>
      <dl className="hub-fact-grid">
        {resumeCard.supportingFacts.map((fact) => (
          <div key={fact.label}>
            <dt>{hubPublicText(fact.label)}</dt>
            <dd>{hubPublicText(fact.value)}</dd>
          </div>
        ))}
      </dl>
      <div className="hub-resume-card__footer">
        <p>{hubPublicText(resumeCard.dominantActionSummary)}</p>
        <button
          type="button"
          className="hub-primary-button"
          data-testid="hub-resume-dominant-action"
          onClick={() => props.onNavigate(resumeCard.dominantActionPath)}
          {...props.dominantActionAttributes}
        >
          {resumeCard.dominantActionLabel}
        </button>
      </div>
    </article>
  );
}

function HubQueueEntryStrip(props: {
  snapshot: HubShellSnapshot;
  selectedAnchorAttributes: (caseId: string) => Readonly<Record<string, string>>;
  onSelectCase: (caseId: string) => void;
  onOpenCase: (caseId: string) => void;
}) {
  return (
    <section
      className="hub-queue-entry-strip"
      aria-label="Queue entry strip"
      data-testid="HubQueueEntryStrip"
      data-selected-anchor={props.snapshot.selectedAnchorId}
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Recommended queue</p>
          <h3>{props.snapshot.savedView.queueLabel}</h3>
        </div>
        <span>{props.snapshot.queueRows.length} queued cases</span>
      </header>
      <div className="hub-queue-entry-list">
        {props.snapshot.queueRows.map((row) => (
          <article
            key={row.caseId}
            className="hub-queue-entry-row"
            data-selected={row.selected}
            data-selected-anchor={row.selected ? "true" : "false"}
          >
            <button
              type="button"
              className="hub-queue-entry-row__main"
              onClick={() => props.onSelectCase(row.caseId)}
              {...props.selectedAnchorAttributes(row.caseId)}
            >
              <span className="hub-queue-entry-row__rank">
                #{props.snapshot.queueRows.indexOf(row) + 1}
              </span>
              <span className="hub-queue-entry-row__body">
                <strong>{row.patientLabel}</strong>
                <span>{hubPublicText(row.queueSummary)}</span>
                <small>{row.metaLine}</small>
              </span>
            </button>
            <div className="hub-queue-entry-row__actions">
              <HubOwnershipContextChip
                ownershipState={row.ownershipState}
                label={row.ownershipLabel}
              />
              <button
                type="button"
                className="hub-link-button"
                data-testid={`hub-open-case-${row.caseId}`}
                onClick={() => props.onOpenCase(row.caseId)}
              >
                Open case
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HubInterruptionDigestPanel(props: {
  snapshot: HubShellSnapshot;
  onNavigate: (path: string) => void;
}) {
  const dominantId = props.snapshot.interruptionRows[0]?.interruptionId ?? null;

  return (
    <aside
      className="hub-interruption-digest"
      aria-label="Hub interruption digest"
      data-testid="HubInterruptionDigestPanel"
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Interruption digest</p>
          <h3>Limited blockers</h3>
        </div>
        <span>{props.snapshot.interruptionRows.length} items</span>
      </header>
      <div className="hub-interruption-list">
        {props.snapshot.interruptionRows.map((row) => (
          <article
            key={row.interruptionId}
            className="hub-interruption-row"
            data-tone={row.severity}
            data-dominant={row.interruptionId === dominantId ? "true" : "false"}
            data-interruption-kind={row.kind}
          >
            <div className="hub-interruption-row__copy">
              <strong>{row.label}</strong>
              <p>{row.summary}</p>
              <small>{row.dueLabel}</small>
            </div>
            <button
              type="button"
              className="hub-link-button"
              data-testid={`hub-open-interruption-${row.caseId}`}
              onClick={() => props.onNavigate(row.routePath)}
            >
              {row.dominantActionLabel}
            </button>
          </article>
        ))}
      </div>
    </aside>
  );
}

function HubCaseStageHost(props: {
  snapshot: HubShellSnapshot;
  onNavigate: (path: string) => void;
  onReturn: () => void;
}) {
  const { caseStageHost, location } = props.snapshot;
  const showReturn = location.viewMode === "alternatives" || location.viewMode === "audit";

  return (
    <section
      className="hub-case-stage-host"
      aria-label="Hub case stage host"
      data-testid="HubCaseStageHost"
      data-host-mode={caseStageHost.hostMode}
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Case stage host</p>
          <h3>{hubPublicText(caseStageHost.title)}</h3>
        </div>
        {showReturn ? (
          <button
            type="button"
            className="hub-link-button"
            data-testid="hub-return-button"
            onClick={props.onReturn}
          >
            Return to case
          </button>
        ) : null}
      </header>
      <p className="hub-case-stage-host__summary">{hubPublicText(caseStageHost.summary)}</p>
      <div className="hub-case-stage-host__prompt">
        <strong>{hubPublicText(caseStageHost.primaryPrompt)}</strong>
        <p>{hubPublicText(caseStageHost.secondaryPrompt)}</p>
      </div>
      <ul className="hub-highlight-list">
        {caseStageHost.highlights.map((highlight) => (
          <li key={highlight}>{hubPublicText(highlight)}</li>
        ))}
      </ul>
      <div className="hub-case-stage-host__actions">
        <button
          type="button"
          className="hub-primary-button"
          data-testid={
            location.viewMode === "case"
              ? "hub-open-alternatives"
              : location.viewMode === "queue"
                ? "hub-open-active-case"
                : "hub-open-stage-action"
          }
          onClick={() => props.onNavigate(caseStageHost.primaryActionPath)}
        >
          {hubPublicText(caseStageHost.primaryActionLabel)}
        </button>
        {location.viewMode === "case" ? (
          <button
            type="button"
            className="hub-secondary-button"
            data-testid="hub-open-audit"
            onClick={() => props.onNavigate(`/hub/audit/${props.snapshot.currentCase.caseId}`)}
          >
            Open audit host
          </button>
        ) : null}
      </div>
    </section>
  );
}

function HubRightRailHost(props: { snapshot: HubShellSnapshot }) {
  return (
    <section
      className="hub-right-rail-host"
      aria-label="Hub right rail host"
      data-testid="HubRightRailHost"
    >
      <header className="hub-subpanel-header">
        <div>
          <p className="hub-eyebrow">Right rail host</p>
          <h3>{hubPublicText(props.snapshot.rightRailHost.title)}</h3>
        </div>
        <span data-tone={toneForRecoveryPosture(props.snapshot.recoveryPosture)}>
          {hubPublicStatusLabel(props.snapshot.recoveryPosture)}
        </span>
      </header>
      <p className="hub-right-rail-host__summary">{hubPublicText(props.snapshot.rightRailHost.summary)}</p>
      <dl className="hub-fact-grid">
        {props.snapshot.rightRailHost.items.map((item) => (
          <div key={item.label}>
            <dt>{hubPublicText(item.label)}</dt>
            <dd>{hubPublicText(item.value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HubShellContinuityBinder(props: {
  snapshot: HubShellSnapshot;
  state: HubShellState;
  focusRestoreAttributes: Readonly<Record<string, string>>;
}) {
  const showDiagnostics = hubDiagnosticsEnabled();
  return (
    <div
      className="hub-visually-hidden"
      data-testid="HubShellContinuityBinder"
      data-selected-anchor={props.snapshot.selectedAnchorId}
      data-active-case-anchor={props.snapshot.activeCaseAnchorId}
      data-selected-exception={props.state.selectedExceptionId}
      data-selected-option-card={props.state.selectedOptionCardId}
      data-selected-organisation={props.state.selectedOrganisationId}
      data-selected-site={props.state.selectedSiteId}
      data-selected-purpose={props.state.selectedPurposeId}
      data-saved-view={props.state.selectedSavedViewId}
      data-current-path={props.state.location.pathname}
    >
      <span
        data-testid="hub-focus-restore-marker"
        data-dom-marker="focus-restore"
        {...props.focusRestoreAttributes}
        hidden
        aria-hidden="true"
      />
      {showDiagnostics ? (
        <ol data-testid="hub-telemetry-log">
          {props.state.telemetry.slice(-10).map((entry) => (
            <li key={entry.envelopeId}>
              {entry.eventName}:
              {String(entry.payload.caseId ?? entry.payload.pathname ?? entry.eventCode)}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function HubStartOfDayView(props: {
  snapshot: HubShellSnapshot;
  commitUiState: HubCommitUiState;
  selectedAnchorAttributes: (caseId: string) => Readonly<Record<string, string>>;
  dominantActionAttributes: Readonly<Record<string, string>>;
  onSelectSavedView: (savedViewId: HubSavedViewId) => void;
  onSelectFilter: (filterId: HubQueueFilterId) => void;
  onSelectCase: (caseId: string) => void;
  onOpenCase: (caseId: string) => void;
  onSelectOption: (optionCardId: string) => void;
  onBufferQueueDelta: () => void;
  onApplyQueueDelta: () => void;
  onNavigate: (path: string) => void;
  onReturn: () => void;
  onOpenScopeDrawer: () => void;
  onBeginNativeBooking: (caseId: string) => void;
  onAttachManualProof: (caseId: string) => void;
  onCancelManualProof: () => void;
  onRecordSupplierConfirmation: (caseId: string) => void;
  onAcknowledgePractice: (caseId: string) => void;
  onToggleImportedReview: (caseId: string) => void;
  onToggleContinuityDrawer: (caseId: string) => void;
}) {
  return (
    <HubQueueCandidateWorkbench
      snapshot={props.snapshot}
      commitUiState={props.commitUiState}
      selectedAnchorAttributes={props.selectedAnchorAttributes}
      dominantActionAttributes={props.dominantActionAttributes}
      onNavigate={props.onNavigate}
      onSelectSavedView={props.onSelectSavedView}
      onSelectFilter={props.onSelectFilter}
      onSelectCase={props.onSelectCase}
      onOpenCase={props.onOpenCase}
      onSelectOption={props.onSelectOption}
      onBufferQueueDelta={props.onBufferQueueDelta}
      onApplyQueueDelta={props.onApplyQueueDelta}
      onReturn={props.onReturn}
      onOpenScopeDrawer={props.onOpenScopeDrawer}
      onBeginNativeBooking={props.onBeginNativeBooking}
      onAttachManualProof={props.onAttachManualProof}
      onCancelManualProof={props.onCancelManualProof}
      onRecordSupplierConfirmation={props.onRecordSupplierConfirmation}
      onAcknowledgePractice={props.onAcknowledgePractice}
      onToggleImportedReview={props.onToggleImportedReview}
      onToggleContinuityDrawer={props.onToggleContinuityDrawer}
    />
  );
}

function HubDeskShellDocument(props: {
  state: HubShellState;
  commitUiState: HubCommitUiState;
  viewportWidth: number;
  reducedMotion: "respect" | "reduce";
  drawerOpen: boolean;
  breakGlassModalOpen: boolean;
  selectedBreakGlassReasonId: string;
  onNavigate: (path: string) => void;
  onOpenScopeDrawer: () => void;
  onCloseScopeDrawer: () => void;
  onSelectSavedView: (savedViewId: HubSavedViewId) => void;
  onSelectFilter: (filterId: HubQueueFilterId) => void;
  onSelectCase: (caseId: string) => void;
  onSelectException: (exceptionId: string) => void;
  onSelectOrganisation: (organisationId: HubActingOrganisationId) => void;
  onSelectSite: (siteId: HubActingSiteId) => void;
  onSelectPurpose: (purposeId: HubPurposeOfUseId) => void;
  onOpenBreakGlass: () => void;
  onCloseBreakGlass: () => void;
  onSelectBreakGlassReason: (reasonId: string) => void;
  onConfirmBreakGlass: () => void;
  onRevokeBreakGlass: () => void;
  onOpenCase: (caseId: string) => void;
  onSelectOption: (optionCardId: string) => void;
  onBufferQueueDelta: () => void;
  onApplyQueueDelta: () => void;
  onReturn: () => void;
  onBeginNativeBooking: (caseId: string) => void;
  onAttachManualProof: (caseId: string) => void;
  onCancelManualProof: () => void;
  onRecordSupplierConfirmation: (caseId: string) => void;
  onAcknowledgePractice: (caseId: string) => void;
  onToggleImportedReview: (caseId: string) => void;
  onToggleContinuityDrawer: (caseId: string) => void;
}) {
  const snapshot = resolveHubShellSnapshot(props.state, props.viewportWidth);
  const automationProfile = resolveAutomationAnchorProfile(snapshot.location.routeFamilyRef);
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
    selectedAnchorRef: snapshot.selectedAnchorId,
    focusRestoreRef: props.state.continuitySnapshot.focusRestoreTargetRef,
    dominantActionRef: snapshot.dominantActionRef,
    artifactModeState: snapshot.artifactModeState,
    recoveryPosture: snapshot.recoveryPosture,
    visualizationAuthority: snapshot.visualizationAuthority,
    routeShellPosture: snapshot.routeShellPosture,
  });

  const selectedAnchorAttributes = (caseId: string) =>
    selectedAnchorBinding
      ? buildAutomationAnchorElementAttributes(selectedAnchorBinding, {
          instanceKey: caseId,
        })
      : {};
  const dominantActionAttributes = dominantActionBinding
    ? buildAutomationAnchorElementAttributes(dominantActionBinding, {
        instanceKey: snapshot.currentCase.caseId,
      })
    : {};
  const focusRestoreAttributes = focusRestoreBinding
    ? buildAutomationAnchorElementAttributes(focusRestoreBinding, {
        instanceKey: snapshot.currentCase.caseId,
      })
    : {};
  const breakpointClass = resolveBreakpointClass(props.viewportWidth);
  const [supportDrawerOpen, setSupportDrawerOpen] = useState(false);
  const [supportRegion, setSupportRegion] = useState<HubMissionSupportRegion>(() =>
    defaultMissionSupportRegion(snapshot),
  );
  const isMissionStack = snapshot.layoutMode === "mission_stack";

  useEffect(() => {
    if (!isMissionStack) {
      setSupportDrawerOpen(false);
      return;
    }

    setSupportRegion((current) => {
      const fallbackRegion = defaultMissionSupportRegion(snapshot);
      if (snapshot.location.viewMode === "exceptions") {
        return "exceptions";
      }
      if (
        snapshot.actingContextControlPlane.accessDeniedState ||
        snapshot.actingContextControlPlane.accessPosture === "frozen"
      ) {
        return "visibility";
      }
      if (current === "exceptions") {
        return fallbackRegion;
      }
      return current;
    });
  }, [
    isMissionStack,
    snapshot.location.viewMode,
    snapshot.currentCase.caseId,
    snapshot.actingContextControlPlane.accessDeniedState?.stateId,
    snapshot.actingContextControlPlane.accessPosture,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (
      supportDrawerOpen ||
      props.drawerOpen &&
      (snapshot.actingContextControlPlane.accessDeniedState ||
        snapshot.actingContextControlPlane.scopeDriftFreezeBanner)
    ) {
      return;
    }

    const dominantSelector =
      snapshot.actingContextControlPlane.accessDeniedState
        ? "[data-testid='HubAccessDeniedState']"
        : snapshot.actingContextControlPlane.scopeDriftFreezeBanner
          ? "[data-testid='ScopeDriftFreezeBanner']"
          : snapshot.location.viewMode === "case" && snapshot.recoveryCase
        ? "[data-testid='HubRecoveryCaseCanvas']"
        : snapshot.location.viewMode === "exceptions"
          ? "[data-testid='HubExceptionQueueView']"
          : null;
    if (!dominantSelector) {
      return;
    }

    const handle = window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(dominantSelector)
        ?.scrollIntoView({ block: "start", inline: "nearest" });
    });
    return () => window.cancelAnimationFrame(handle);
  }, [
    supportDrawerOpen,
    props.drawerOpen,
    snapshot.actingContextControlPlane.accessDeniedState?.stateId,
    snapshot.actingContextControlPlane.scopeDriftFreezeBanner?.bannerId,
    snapshot.location.pathname,
    snapshot.location.viewMode,
    snapshot.currentCase.caseId,
    snapshot.recoveryCase?.caseId,
  ]);

  return (
    <div
      className={`hub-desk-shell hub-desk-shell--${snapshot.layoutMode}`}
      data-testid="hub-shell-root"
      data-shell="hub"
      data-hub-route-family={snapshot.location.routeFamilyRef}
      data-current-path={snapshot.location.pathname}
      data-view-mode={snapshot.location.viewMode}
      data-layout-mode={snapshot.layoutMode}
      data-layout-topology={snapshot.layoutMode}
      data-breakpoint-class={breakpointClass}
      data-selected-case-id={snapshot.currentCase.caseId}
      data-selected-anchor={snapshot.selectedAnchorId}
      data-selected-exception-id={props.state.selectedExceptionId}
      data-selected-option-card={props.state.selectedOptionCardId}
      data-scope-drawer-open={props.drawerOpen ? "true" : "false"}
      data-support-drawer-open={supportDrawerOpen ? "true" : "false"}
      data-support-region={isMissionStack ? supportRegion : "rail"}
      data-support-fallback-mode={isMissionStack ? "drawer" : "inline"}
      data-sticky-action-region={isMissionStack ? "bottom_bar" : "right_rail"}
      data-acting-organisation={props.state.selectedOrganisationId}
      data-acting-site={props.state.selectedSiteId}
      data-purpose-of-use={props.state.selectedPurposeId}
      data-audience-tier={
        snapshot.actingContextControlPlane.visibilityEnvelopeLegend.currentAudienceTierId
      }
      data-access-posture={snapshot.actingContextControlPlane.accessPosture}
      data-break-glass-state={snapshot.actingContextControlPlane.scopeSummaryStrip.breakGlassState}
      data-visibility-envelope-state={
        snapshot.actingContextControlPlane.scopeSummaryStrip.visibilityEnvelopeState
      }
      data-saved-view-id={props.state.selectedSavedViewId}
      data-shell-status={snapshot.routeShellPosture}
      data-artifact-mode={snapshot.artifactModeState}
      data-dominant-action={snapshot.decisionDockHost.dominantActionLabel}
      data-visual-mode={HUB_SHELL_VISUAL_MODE}
      data-mission-stack-visual-mode={isMissionStack ? HUB_MISSION_STACK_VISUAL_MODE : undefined}
      data-queue-visual-mode={snapshot.queueVisualMode}
      data-reduced-motion={props.reducedMotion}
      data-route-mutation={snapshot.routeMutationEnabled ? "enabled" : "disabled"}
      {...rootAutomationAttributes}
    >
      <header
        className={`hub-desk-shell__masthead${
          isMissionStack ? " hub-desk-shell__masthead--mission-stack" : ""
        }`}
        role="banner"
      >
        <div className="hub-desk-shell__brand">
          <VecellLogoLockup
            aria-hidden="true"
            className="hub-desk-shell__brand-mark"
            style={{ width: 168, height: "auto" }}
          />
          <div>
            <p className="hub-eyebrow">Current programme hub shell</p>
            <h1>Hub desk mission control</h1>
            <p className="hub-desk-shell__lead">
              One saved view, one current queue anchor, and one calm resume path before deeper
              coordination surfaces mount.
            </p>
          </div>
        </div>
        <div className="hub-desk-shell__masthead-meta">
          <HubActingContextChip snapshot={snapshot} onOpenDrawer={props.onOpenScopeDrawer} />
          <span className="hub-chip" data-tone={toneForRecoveryPosture(snapshot.recoveryPosture)}>
            {hubPublicStatusLabel(snapshot.recoveryPosture)}
          </span>
          <HubOwnershipContextChip
            ownershipState={snapshot.currentCase.ownershipState}
            label={snapshot.currentCase.ownershipLabel}
            testId="HubOwnershipContextChip"
          />
        </div>
      </header>

      {isMissionStack ? (
        <main className="hub-desk-shell__main hub-desk-shell__main--mission-stack" role="main">
          <HubMissionStackLayout
            snapshot={snapshot}
            state={props.state}
            breakpointClass={breakpointClass}
            commitUiState={props.commitUiState}
            supportDrawerOpen={supportDrawerOpen}
            supportRegion={supportRegion}
            selectedAnchorAttributes={selectedAnchorAttributes}
            dominantActionAttributes={dominantActionAttributes}
            onNavigate={props.onNavigate}
            onSelectSavedView={props.onSelectSavedView}
            onSelectFilter={props.onSelectFilter}
            onSelectCase={props.onSelectCase}
            onSelectException={(exceptionId) => {
              props.onSelectException(exceptionId);
              setSupportRegion("exceptions");
            }}
            onSelectOption={props.onSelectOption}
            onBufferQueueDelta={props.onBufferQueueDelta}
            onApplyQueueDelta={props.onApplyQueueDelta}
            onReturn={props.onReturn}
            onOpenScopeDrawer={props.onOpenScopeDrawer}
            onOpenSupportRegion={(region) => {
              setSupportRegion(region);
              setSupportDrawerOpen(true);
            }}
            onCloseSupportDrawer={() => {
              setSupportDrawerOpen(false);
            }}
            onBeginNativeBooking={props.onBeginNativeBooking}
            onAttachManualProof={props.onAttachManualProof}
            onCancelManualProof={props.onCancelManualProof}
            onRecordSupplierConfirmation={props.onRecordSupplierConfirmation}
            onAcknowledgePractice={props.onAcknowledgePractice}
            onToggleImportedReview={props.onToggleImportedReview}
            onToggleContinuityDrawer={props.onToggleContinuityDrawer}
          />
        </main>
      ) : (
        <>
          <HubStatusAuthorityStrip snapshot={snapshot} />
          <HubScopeSummaryStrip snapshot={snapshot} />

          <div className="hub-desk-shell__body">
            <HubSavedViewRail
              snapshot={snapshot}
              onNavigate={props.onNavigate}
              onSelectSavedView={props.onSelectSavedView}
            />

            <main className="hub-desk-shell__main" role="main">
              {snapshot.location.viewMode === "queue" ? (
                <HubStartOfDayView
                  snapshot={snapshot}
                  commitUiState={props.commitUiState}
                  selectedAnchorAttributes={selectedAnchorAttributes}
                  dominantActionAttributes={dominantActionAttributes}
                  onSelectSavedView={props.onSelectSavedView}
                  onSelectFilter={props.onSelectFilter}
                  onSelectCase={props.onSelectCase}
                  onOpenCase={props.onOpenCase}
                  onSelectOption={props.onSelectOption}
                  onBufferQueueDelta={props.onBufferQueueDelta}
                  onApplyQueueDelta={props.onApplyQueueDelta}
                  onNavigate={props.onNavigate}
                  onReturn={props.onReturn}
                  onOpenScopeDrawer={props.onOpenScopeDrawer}
                  onBeginNativeBooking={props.onBeginNativeBooking}
                  onAttachManualProof={props.onAttachManualProof}
                  onCancelManualProof={props.onCancelManualProof}
                  onRecordSupplierConfirmation={props.onRecordSupplierConfirmation}
                  onAcknowledgePractice={props.onAcknowledgePractice}
                  onToggleImportedReview={props.onToggleImportedReview}
                  onToggleContinuityDrawer={props.onToggleContinuityDrawer}
                />
              ) : snapshot.location.viewMode === "case" ? (
                <HubQueueCandidateWorkbench
                  snapshot={snapshot}
                  commitUiState={props.commitUiState}
                  selectedAnchorAttributes={selectedAnchorAttributes}
                  dominantActionAttributes={dominantActionAttributes}
                  onNavigate={props.onNavigate}
                  onSelectSavedView={props.onSelectSavedView}
                  onSelectFilter={props.onSelectFilter}
                  onSelectCase={props.onSelectCase}
                  onOpenCase={props.onOpenCase}
                  onSelectOption={props.onSelectOption}
                  onBufferQueueDelta={props.onBufferQueueDelta}
                  onApplyQueueDelta={props.onApplyQueueDelta}
                  onReturn={props.onReturn}
                  onOpenScopeDrawer={props.onOpenScopeDrawer}
                  onBeginNativeBooking={props.onBeginNativeBooking}
                  onAttachManualProof={props.onAttachManualProof}
                  onCancelManualProof={props.onCancelManualProof}
                  onRecordSupplierConfirmation={props.onRecordSupplierConfirmation}
                  onAcknowledgePractice={props.onAcknowledgePractice}
                  onToggleImportedReview={props.onToggleImportedReview}
                  onToggleContinuityDrawer={props.onToggleContinuityDrawer}
                />
              ) : snapshot.location.viewMode === "exceptions" ? (
                snapshot.actingContextControlPlane.accessDeniedState ? (
                  <HubAccessDeniedState
                    state={snapshot.actingContextControlPlane.accessDeniedState}
                    onOpenDrawer={props.onOpenScopeDrawer}
                    onNavigate={props.onNavigate}
                  />
                ) : (
                  <HubExceptionQueueView
                    snapshot={snapshot}
                    onSelectException={props.onSelectException}
                    onNavigate={props.onNavigate}
                  />
                )
              ) : (
                <section
                  className="hub-case-route-shell"
                  data-testid={`hub-${snapshot.location.viewMode}-route`}
                >
                  {snapshot.actingContextControlPlane.accessDeniedState ? (
                    <HubAccessDeniedState
                      state={snapshot.actingContextControlPlane.accessDeniedState}
                      onOpenDrawer={props.onOpenScopeDrawer}
                      onNavigate={props.onNavigate}
                    />
                  ) : (
                    <>
                      <HubQueueEntryStrip
                        snapshot={snapshot}
                        selectedAnchorAttributes={selectedAnchorAttributes}
                        onSelectCase={props.onSelectCase}
                        onOpenCase={props.onOpenCase}
                      />
                      <div className="hub-case-route-shell__centre-column">
                        <AccessScopeTransitionReceipt
                          receipt={snapshot.actingContextControlPlane.accessScopeTransitionReceipt}
                        />
                        <ScopeDriftFreezeBanner
                          banner={snapshot.actingContextControlPlane.scopeDriftFreezeBanner}
                          onOpenDrawer={props.onOpenScopeDrawer}
                        />
                        {snapshot.actingContextControlPlane.minimumNecessaryPlaceholders.length > 0 ? (
                          <section className="hub-placeholder-grid">
                            {snapshot.actingContextControlPlane.minimumNecessaryPlaceholders.map((block) => (
                              <MinimumNecessaryPlaceholderBlock key={block.blockId} block={block} />
                            ))}
                          </section>
                        ) : null}
                        <HubCaseStageHost
                          snapshot={snapshot}
                          onNavigate={props.onNavigate}
                          onReturn={props.onReturn}
                        />
                        {snapshot.location.viewMode === "audit" &&
                        snapshot.actingContextControlPlane.accessPosture !== "frozen" ? (
                          <HubCommitConfirmationPane
                            snapshot={snapshot}
                            uiState={props.commitUiState}
                            onBeginNativeBooking={props.onBeginNativeBooking}
                            onAttachManualProof={props.onAttachManualProof}
                            onCancelManualProof={props.onCancelManualProof}
                            onRecordSupplierConfirmation={props.onRecordSupplierConfirmation}
                            onAcknowledgePractice={props.onAcknowledgePractice}
                            onToggleImportedReview={props.onToggleImportedReview}
                            onToggleContinuityDrawer={props.onToggleContinuityDrawer}
                          />
                        ) : null}
                      </div>
                      <div className="hub-case-route-shell__right-column">
                        <VisibilityEnvelopeLegend
                          descriptor={snapshot.actingContextControlPlane.visibilityEnvelopeLegend}
                        />
                        <HubInterruptionDigestPanel snapshot={snapshot} onNavigate={props.onNavigate} />
                        <HubRightRailHost snapshot={snapshot} />
                      </div>
                    </>
                  )}
                </section>
              )}
            </main>
          </div>
        </>
      )}

      <OrganisationSwitchDrawer
        snapshot={snapshot}
        open={props.drawerOpen}
        onClose={props.onCloseScopeDrawer}
        onSelectOrganisation={props.onSelectOrganisation}
        onSelectSite={props.onSelectSite}
        onSelectPurpose={props.onSelectPurpose}
        onOpenBreakGlass={props.onOpenBreakGlass}
        onRevokeBreakGlass={props.onRevokeBreakGlass}
      />
      <BreakGlassReasonModal
        descriptor={snapshot.actingContextControlPlane.breakGlassReasonModal}
        open={props.breakGlassModalOpen}
        selectedReasonId={props.selectedBreakGlassReasonId}
        onSelectReason={props.onSelectBreakGlassReason}
        onConfirm={props.onConfirmBreakGlass}
        onClose={props.onCloseBreakGlass}
      />

      {isMissionStack ? (
        <HubMissionStackContinuityBinder
          snapshot={snapshot}
          state={props.state}
          focusRestoreAttributes={focusRestoreAttributes}
          supportDrawerOpen={supportDrawerOpen}
          supportRegion={supportRegion}
          breakpointClass={breakpointClass}
        />
      ) : (
        <HubShellContinuityBinder
          snapshot={snapshot}
          state={props.state}
          focusRestoreAttributes={focusRestoreAttributes}
        />
      )}
    </div>
  );
}

function HubDeskShellApp() {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );
  const [reducedMotion, setReducedMotion] = useState<"respect" | "reduce">(() => {
    if (typeof window === "undefined") {
      return "respect";
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduce" : "respect";
  });
  const [state, setState] = useState<HubShellState>(() => initialHubDeskState());
  const [commitUiState, setCommitUiState] = useState<HubCommitUiState>(() =>
    createInitialHubCommitUiState(),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [breakGlassModalOpen, setBreakGlassModalOpen] = useState(false);
  const [selectedBreakGlassReasonId, setSelectedBreakGlassReasonId] = useState(
    "urgent_clinical_safety",
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handlePopState = (event: PopStateEvent) => {
      startTransition(() => {
        setState(
          createInitialHubShellState(window.location.pathname, {
            historySnapshot:
              (event.state as { hubDesk?: Partial<HubShellHistorySnapshot> } | null)?.hubDesk ??
              readWindowHistorySnapshot() ??
              readStoredHistorySnapshot(),
          }),
        );
      });
    };
    const handleResize = () => setViewportWidth(window.innerWidth);
    const handleMotionChange = () => setReducedMotion(media.matches ? "reduce" : "respect");

    if (!window.location.pathname.startsWith("/hub/")) {
      const initial = createInitialHubShellState(HUB_DEFAULT_PATH);
      window.history.replaceState(
        { hubDesk: createHubShellHistorySnapshot(initial) },
        "",
        HUB_DEFAULT_PATH,
      );
      setState(initial);
    } else if (
      !(window.history.state as { hubDesk?: Partial<HubShellHistorySnapshot> } | null)?.hubDesk
    ) {
      window.history.replaceState(
        { hubDesk: createHubShellHistorySnapshot(state) },
        "",
        state.location.pathname,
      );
    }

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("resize", handleResize);
    media.addEventListener("change", handleMotionChange);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("resize", handleResize);
      media.removeEventListener("change", handleMotionChange);
    };
  }, [state]);

  useEffect(() => {
    writeStoredHistorySnapshot(state);
    if (typeof window !== "undefined") {
      Object.assign(window, {
        __hubDeskState: {
          pathname: state.location.pathname,
          selectedSavedViewId: state.selectedSavedViewId,
          selectedCaseId: state.selectedCaseId,
          selectedQueueAnchorId: state.selectedQueueAnchorId,
          activeCaseAnchorId: state.activeCaseAnchorId,
          selectedExceptionId: state.selectedExceptionId,
          selectedOptionCardId: state.selectedOptionCardId,
          selectedOrganisationId: state.selectedOrganisationId,
          selectedSiteId: state.selectedSiteId,
          selectedPurposeId: state.selectedPurposeId,
          breakGlassBaseState: state.breakGlassBaseState,
          selectedQueueFilterId: state.selectedQueueFilterId,
          queueChangeState: state.queueChangeState,
          telemetryCount: state.telemetry.length,
        },
      });
    }
  }, [state]);

  useEffect(() => {
    if (!drawerOpen) {
      setBreakGlassModalOpen(false);
    }
  }, [drawerOpen]);

  const applyShellState = (nextState: HubShellState, mode: "push" | "replace" = "push") => {
    if (typeof window !== "undefined") {
      const historySnapshot = createHubShellHistorySnapshot(nextState);
      const method = mode === "replace" ? "replaceState" : "pushState";
      window.history[method]({ hubDesk: historySnapshot }, "", nextState.location.pathname);
    }
    setState(nextState);
  };

  return (
    <HubDeskShellDocument
      state={state}
      commitUiState={commitUiState}
      viewportWidth={viewportWidth}
      reducedMotion={reducedMotion}
      drawerOpen={drawerOpen}
      breakGlassModalOpen={breakGlassModalOpen}
      selectedBreakGlassReasonId={selectedBreakGlassReasonId}
      onNavigate={(path) => {
        startTransition(() => {
          applyShellState(navigateHubShell(state, path), "push");
        });
      }}
      onOpenScopeDrawer={() => {
        setDrawerOpen(true);
      }}
      onCloseScopeDrawer={() => {
        setDrawerOpen(false);
        focusHubActingContextChip();
      }}
      onSelectSavedView={(savedViewId) => {
        startTransition(() => {
          applyShellState(selectHubSavedView(state, savedViewId), "push");
        });
      }}
      onSelectFilter={(filterId) => {
        startTransition(() => {
          applyShellState(selectHubQueueFilter(state, filterId), "replace");
        });
      }}
      onSelectCase={(caseId) => {
        startTransition(() => {
          applyShellState(selectHubCase(state, caseId), "push");
        });
      }}
      onOpenCase={(caseId) => {
        startTransition(() => {
          const selected = selectHubCase(state, caseId);
          applyShellState(navigateHubShell(selected, `/hub/case/${caseId}`), "push");
        });
      }}
      onSelectException={(exceptionId: string) => {
        startTransition(() => {
          applyShellState(selectHubExceptionRow(state, exceptionId), "replace");
        });
      }}
      onSelectOrganisation={(organisationId) => {
        startTransition(() => {
          applyShellState(selectHubOrganisation(state, organisationId), "replace");
        });
      }}
      onSelectSite={(siteId) => {
        startTransition(() => {
          applyShellState(selectHubActingSite(state, siteId), "replace");
        });
      }}
      onSelectPurpose={(purposeId) => {
        startTransition(() => {
          applyShellState(selectHubPurposeOfUse(state, purposeId), "replace");
        });
      }}
      onOpenBreakGlass={() => {
        setBreakGlassModalOpen(true);
      }}
      onCloseBreakGlass={() => {
        setBreakGlassModalOpen(false);
        focusHubActingContextChip();
      }}
      onSelectBreakGlassReason={(reasonId: string) => {
        setSelectedBreakGlassReasonId(reasonId);
      }}
      onConfirmBreakGlass={() => {
        startTransition(() => {
          applyShellState(activateHubBreakGlass(state, selectedBreakGlassReasonId), "replace");
          setBreakGlassModalOpen(false);
          focusHubActingContextChip();
        });
      }}
      onRevokeBreakGlass={() => {
        startTransition(() => {
          applyShellState(revokeHubBreakGlass(state), "replace");
          setBreakGlassModalOpen(false);
          focusHubActingContextChip();
        });
      }}
      onReturn={() => {
        startTransition(() => {
          applyShellState(returnFromHubChildRoute(state), "push");
        });
      }}
      onSelectOption={(optionCardId) => {
        startTransition(() => {
          applyShellState(selectHubOptionCard(state, optionCardId), "replace");
        });
      }}
      onBufferQueueDelta={() => {
        startTransition(() => {
          applyShellState(bufferHubQueueChangeBatch(state), "replace");
        });
      }}
      onApplyQueueDelta={() => {
        startTransition(() => {
          applyShellState(applyHubQueueChangeBatch(state), "replace");
        });
      }}
      onBeginNativeBooking={(caseId) => {
        startTransition(() => {
          setCommitUiState((current) => beginHubNativeBooking(current, caseId));
        });
      }}
      onAttachManualProof={(caseId) => {
        startTransition(() => {
          setCommitUiState((current) => attachHubManualProof(current, caseId));
        });
      }}
      onCancelManualProof={() => {
        startTransition(() => {
          setCommitUiState((current) => cancelHubManualProof(current));
        });
      }}
      onRecordSupplierConfirmation={(caseId) => {
        startTransition(() => {
          setCommitUiState((current) => recordHubSupplierConfirmation(current, caseId));
        });
      }}
      onAcknowledgePractice={(caseId) => {
        startTransition(() => {
          setCommitUiState((current) => acknowledgeHubPracticeVisibility(current, caseId));
        });
      }}
      onToggleImportedReview={(caseId) => {
        startTransition(() => {
          setCommitUiState((current) => toggleHubImportedReviewState(current, caseId));
        });
      }}
      onToggleContinuityDrawer={(caseId) => {
        startTransition(() => {
          setCommitUiState((current) => toggleHubContinuityDrawer(current, caseId));
        });
      }}
    />
  );
}

export {
  AccessScopeTransitionReceipt,
  ActingSiteSwitcher,
  BreakGlassReasonModal,
  HubBestFitNowStrip,
  HubActingContextChip,
  HubAccessDeniedState,
  HubBreachHorizonMeter,
  HubCasePulseCompact,
  HubCallbackTransferPendingState,
  HubCaseStageHost,
  HubDecisionDockHost,
  HubDecisionDockBar,
  HubDeskShellApp,
  HubDeskShellDocument,
  HubEscalationBannerLane,
  HubExceptionDetailDrawer,
  HubExceptionQueueView,
  HubExceptionsMissionStackView,
  HubInterruptionDigestPanel,
  HubMissionStackContinuityBinder,
  HubMissionStackLayout,
  HubNarrowQueueWorkbench,
  HubNarrowStatusAuthorityStrip,
  HubNoSlotResolutionPanel,
  HubOptionCard,
  HubOptionCardCompactStack,
  HubOptionCardStack,
  HubOwnershipContextChip,
  HubQueueEntryStrip,
  HubQueueRow,
  HubQueueSavedViewToolbar,
  HubQueueWorkbench,
  HubRecoveryDiffStrip,
  HubReopenProvenanceStub,
  HubRiskBandStrip,
  HubSavedViewRail,
  HubShellContinuityBinder,
  HubScopeSummaryStrip,
  MinimumNecessaryPlaceholderBlock,
  OrganisationSwitchDrawer,
  PurposeOfUsePanel,
  ScopeDriftFreezeBanner,
  HubStartOfDayResumeCard,
  HubStatusAuthorityStrip,
  HubSupervisorEscalationPanel,
  HubReturnToPracticeReceipt,
  HubResponsiveSafeAreaFrame,
  HubSupportDrawer,
  HubUrgentBounceBackBanner,
  VisibilityEnvelopeLegend,
};
