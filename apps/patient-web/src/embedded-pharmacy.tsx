import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  embeddedPharmacyCaseIdForFixture,
  embeddedPharmacyPath,
  isEmbeddedPharmacyPath,
  resolveEmbeddedPharmacyContext,
  type EmbeddedPharmacyContext,
  type EmbeddedPharmacyFixture,
  type EmbeddedPharmacyRouteKey,
} from "./embedded-pharmacy.model";
import type { PharmacyChoiceProviderCardSnapshot } from "../../../packages/domains/pharmacy/src/phase6-pharmacy-choice-preview";

export { isEmbeddedPharmacyPath };

function safeWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

function resolveInitial(): EmbeddedPharmacyContext {
  const ownerWindow = safeWindow();
  return resolveEmbeddedPharmacyContext({
    pathname: ownerWindow?.location.pathname ?? "/nhs-app/pharmacy/PHC-2048/choice",
    search: ownerWindow?.location.search ?? "",
  });
}

function routeFixture(routeKey: EmbeddedPharmacyRouteKey): EmbeddedPharmacyFixture {
  if (routeKey === "instructions") return "referral-sent";
  if (routeKey === "status") return "dispatch-pending";
  if (routeKey === "outcome") return "completed";
  if (routeKey === "recovery") return "urgent-return";
  return "choice";
}

function warningRequiresAcknowledgement(
  provider: PharmacyChoiceProviderCardSnapshot | null,
): boolean {
  return provider?.overrideRequirementState === "warned_choice_ack_required";
}

function useEmbeddedPharmacyController() {
  const [context, setContext] = useState<EmbeddedPharmacyContext>(() => resolveInitial());
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    context.selectedProvider?.providerId ?? null,
  );
  const [warningAccepted, setWarningAcceptedState] = useState(false);
  const [disclosureOpen, setDisclosureOpen] = useState(true);
  const [announcement, setAnnouncement] = useState(context.announcement);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    ownerWindow.document.body.dataset.theme = "light";
    ownerWindow.document.body.dataset.motion = ownerWindow.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
      ? "reduced"
      : "full";
  }, []);

  useEffect(() => {
    setSelectedProviderId(context.selectedProvider?.providerId ?? null);
    setWarningAcceptedState(false);
    setDisclosureOpen(true);
  }, [context.pharmacyCaseId, context.fixture, context.routeKey, context.selectedProvider]);

  const providerMap = useMemo(() => {
    const map = new Map<string, PharmacyChoiceProviderCardSnapshot>();
    for (const provider of context.choicePreview?.providerCards ?? []) {
      map.set(provider.providerId, provider);
    }
    return map;
  }, [context.choicePreview]);

  const selectedProvider = selectedProviderId
    ? providerMap.get(selectedProviderId) ?? null
    : context.selectedProvider;
  const selectedWarningRequired = warningRequiresAcknowledgement(selectedProvider);
  const choiceBlocked =
    context.currentState.actionability === "recovery_required" ||
    context.currentState.actionability === "frozen" ||
    context.currentState.actionability === "read_only";
  const canContinueChoice =
    context.routeKey !== "choice" ||
    (!choiceBlocked &&
      selectedProvider !== null &&
      (!selectedWarningRequired || warningAccepted));

  const replaceContext = useCallback(
    (
      routeKey: EmbeddedPharmacyRouteKey,
      fixture: EmbeddedPharmacyFixture = routeFixture(routeKey),
      replace = false,
    ) => {
      const ownerWindow = safeWindow();
      const pharmacyCaseId = embeddedPharmacyCaseIdForFixture(fixture);
      const nextPath = embeddedPharmacyPath({ pharmacyCaseId, routeKey, fixture });
      if (ownerWindow) {
        if (replace) {
          ownerWindow.history.replaceState({ routeKey, pharmacyCaseId }, "", nextPath);
        } else {
          ownerWindow.history.pushState({ routeKey, pharmacyCaseId }, "", nextPath);
        }
      }
      const next = resolveEmbeddedPharmacyContext({
        pathname: nextPath.split("?")[0] ?? nextPath,
        search: nextPath.includes("?") ? `?${nextPath.split("?")[1]}` : "",
      });
      setContext(next);
      setAnnouncement(next.announcement);
    },
    [],
  );

  const primaryAction = useCallback(() => {
    if (context.routeKey === "choice") {
      if (!canContinueChoice) {
        setAnnouncement(
          selectedProvider
            ? "Acknowledge the selected pharmacy warning before continuing."
            : "Choose a pharmacy from the current list before continuing.",
        );
        setDisclosureOpen(true);
        return;
      }
      replaceContext("instructions", "referral-sent");
      return;
    }
    if (context.routeKey === "instructions") {
      replaceContext("status", "dispatch-pending");
      return;
    }
    if (context.routeKey === "status") {
      replaceContext(
        context.currentState.actionability === "recovery_required" ? "recovery" : "outcome",
        context.currentState.actionability === "recovery_required" ? "urgent-return" : "completed",
      );
      return;
    }
    if (context.routeKey === "outcome") {
      replaceContext("status", "referral-sent");
      return;
    }
    replaceContext("choice", "choice");
  }, [canContinueChoice, context.currentState.actionability, context.routeKey, replaceContext, selectedProvider]);

  const secondaryAction = useCallback(() => {
    replaceContext("choice", context.fixture === "warned-choice" ? "warned-choice" : "choice");
  }, [context.fixture, replaceContext]);

  return {
    context,
    selectedProvider,
    selectedProviderId,
    warningAccepted,
    selectedWarningRequired,
    disclosureOpen,
    canContinueChoice,
    announcement,
    navigate: replaceContext,
    primaryAction,
    secondaryAction,
    selectProvider(provider: PharmacyChoiceProviderCardSnapshot) {
      if (choiceBlocked) {
        setAnnouncement("Provider change is paused until current pharmacy verified details is safe again.");
        return;
      }
      setSelectedProviderId(provider.providerId);
      setWarningAcceptedState(false);
      setDisclosureOpen(provider.overrideRequirementState !== "none");
      setAnnouncement(`${provider.displayName} selected. ${provider.openingLabel}.`);
    },
    setWarningAccepted(accepted: boolean) {
      setWarningAcceptedState(accepted);
      setAnnouncement(
        accepted
          ? "Warning acknowledged for the selected pharmacy."
          : "Warning acknowledgement removed.",
      );
    },
    toggleDisclosure() {
      setDisclosureOpen((current) => !current);
    },
  };
}

export function EmbeddedPharmacyDistanceMeta({
  provider,
}: {
  readonly provider: PharmacyChoiceProviderCardSnapshot;
}) {
  return (
    <dl className="embedded-pharmacy__distance-meta" data-testid="EmbeddedPharmacyDistanceMeta">
      <div>
        <dt>Distance</dt>
        <dd>{provider.distanceLabel}</dd>
      </div>
      <div>
        <dt>Travel</dt>
        <dd>{provider.travelLabel}</dd>
      </div>
      <div>
        <dt>Opening</dt>
        <dd>{provider.openingLabel}</dd>
      </div>
    </dl>
  );
}

export function EmbeddedPharmacyChoiceRow({
  provider,
  selected,
  disabled,
  onChoose,
}: {
  readonly provider: PharmacyChoiceProviderCardSnapshot;
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly onChoose: () => void;
}) {
  return (
    <article
      className="embedded-pharmacy__choice-row"
      data-testid="EmbeddedPharmacyChoiceRow"
      data-provider-id={provider.providerId}
      data-selected={selected ? "true" : "false"}
      data-warning-state={provider.overrideRequirementState}
      data-opening-state={provider.openingState}
    >
      <div className="embedded-pharmacy__choice-main">
        <div>
          <span className="embedded-pharmacy__rank">#{provider.rankOrdinal}</span>
          <h3>{provider.displayName}</h3>
          <p>{provider.consultationLabel}</p>
        </div>
        <span className="embedded-pharmacy__state-chip" data-tone={provider.warningTitle ? "warning" : "info"}>
          {provider.groupKey === "recommended" ? "Recommended" : "Valid option"}
        </span>
      </div>
      <EmbeddedPharmacyDistanceMeta provider={provider} />
      <div className="embedded-pharmacy__chip-row" aria-label={`${provider.displayName} reasons`}>
        {provider.reasonChips.map((chip) => (
          <span key={`${provider.providerId}-${chip.label}`} data-tone={chip.tone}>
            {chip.label}
          </span>
        ))}
      </div>
      {provider.warningSummary ? (
        <p className="embedded-pharmacy__warning-copy">{provider.warningSummary}</p>
      ) : null}
      <button type="button" onClick={onChoose} disabled={disabled} aria-pressed={selected}>
        {selected ? "Selected pharmacy" : "Choose this pharmacy"}
      </button>
    </article>
  );
}

export function EmbeddedChoiceDisclosurePanel({
  context,
  provider,
  open,
  warningAccepted,
  warningRequired,
  onToggle,
  onAccept,
}: {
  readonly context: EmbeddedPharmacyContext;
  readonly provider: PharmacyChoiceProviderCardSnapshot | null;
  readonly open: boolean;
  readonly warningAccepted: boolean;
  readonly warningRequired: boolean;
  readonly onToggle: () => void;
  readonly onAccept: (accepted: boolean) => void;
}) {
  const panel = context.choicePreview?.warningAcknowledgement ?? null;
  const drift = context.choicePreview?.driftRecovery ?? null;
  if (!panel && !drift && !provider?.warningSummary) return null;
  const disclosureId = "embedded-pharmacy-disclosure-body";
  return (
    <section
      className="embedded-pharmacy__disclosure"
      data-testid="EmbeddedChoiceDisclosurePanel"
      data-warning-required={warningRequired ? "true" : "false"}
      data-warning-accepted={warningAccepted ? "true" : "false"}
    >
      <button
        type="button"
        className="embedded-pharmacy__disclosure-button"
        aria-expanded={open}
        aria-controls={disclosureId}
        onClick={onToggle}
      >
        {drift ? drift.title : panel?.title ?? provider?.warningTitle ?? "Choice detail"}
      </button>
      <div id={disclosureId} hidden={!open}>
        <p>{drift?.summary ?? panel?.summary ?? provider?.warningSummary}</p>
        {panel && warningRequired ? (
          <label className="embedded-pharmacy__ack">
            <input
              type="checkbox"
              checked={warningAccepted}
              onChange={(event) => onAccept(event.currentTarget.checked)}
            />
            <span>{panel.checkboxLabel}</span>
          </label>
        ) : null}
      </div>
    </section>
  );
}

export function EmbeddedPharmacyChooser({
  controller,
}: {
  readonly controller: ReturnType<typeof useEmbeddedPharmacyController>;
}) {
  const { context } = controller;
  const providers = context.choicePreview?.providerCards ?? [];
  const disabled =
    context.currentState.actionability === "read_only" ||
    context.currentState.actionability === "frozen" ||
    context.currentState.actionability === "recovery_required";
  return (
    <section
      className="embedded-pharmacy__chooser"
      aria-labelledby="embedded-pharmacy-chooser-title"
      data-testid="EmbeddedPharmacyChooser"
      data-choice-projection-state={context.choicePreview?.truthProjection.projectionState ?? "missing"}
      data-visible-choice-set-hash={context.choicePreview?.truthProjection.visibleChoiceSetHash ?? "missing"}
    >
      <div className="embedded-pharmacy__section-heading">
        <span className="embedded-pharmacy__eyebrow">Pharmacy choice</span>
        <h2 id="embedded-pharmacy-chooser-title">{context.choicePreview?.pageTitle ?? "Choose a pharmacy"}</h2>
        <p>{context.choicePreview?.recommendedSummary ?? "Current options are shown in approved list order."}</p>
      </div>
      <div role="list" className="embedded-pharmacy__choice-list">
        {providers.map((provider) => (
          <div role="listitem" key={provider.providerId}>
            <EmbeddedPharmacyChoiceRow
              provider={provider}
              selected={controller.selectedProviderId === provider.providerId}
              disabled={disabled}
              onChoose={() => controller.selectProvider(provider)}
            />
          </div>
        ))}
      </div>
      <EmbeddedChoiceDisclosurePanel
        context={context}
        provider={controller.selectedProvider}
        open={controller.disclosureOpen}
        warningAccepted={controller.warningAccepted}
        warningRequired={controller.selectedWarningRequired}
        onToggle={controller.toggleDisclosure}
        onAccept={controller.setWarningAccepted}
      />
    </section>
  );
}

export function EmbeddedChosenPharmacyCard({
  context,
  selectedProvider,
}: {
  readonly context: EmbeddedPharmacyContext;
  readonly selectedProvider: PharmacyChoiceProviderCardSnapshot | null;
}) {
  const label = selectedProvider?.displayName ?? context.chosenProviderLabel;
  const summary =
    selectedProvider?.consultationLabel ??
    context.chosenProviderSummary ??
    "The chosen provider stays visible across pharmacy routes.";
  return (
    <section
      className="embedded-pharmacy__summary"
      aria-labelledby="embedded-pharmacy-summary-title"
      data-testid="EmbeddedChosenPharmacyCard"
      data-selected-provider={context.continuityEvidence.selectedProviderRef}
      data-continuity-state={context.continuityEvidence.sameShellState}
    >
      <div className="embedded-pharmacy__summary-top">
        <div>
          <span className="embedded-pharmacy__eyebrow">Chosen pharmacy</span>
          <h1 id="embedded-pharmacy-summary-title">{label}</h1>
        </div>
        <span className="embedded-pharmacy__state-chip" data-tone={context.currentState.tone}>
          {context.currentState.stateLabel}
        </span>
      </div>
      <p>{summary}</p>
      <dl className="embedded-pharmacy__summary-facts">
        {context.summaryRows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function EmbeddedPharmacyInstructionsPanel({
  context,
}: {
  readonly context: EmbeddedPharmacyContext;
}) {
  const panel = context.patientStatusPreview?.instructionPanel;
  const nextStep = context.patientStatusPreview?.nextStepPage;
  return (
    <section
      className="embedded-pharmacy__panel"
      aria-labelledby="embedded-pharmacy-instructions-title"
      data-testid="EmbeddedPharmacyInstructionsPanel"
      data-instruction-macro-state={panel?.macroState ?? "fallback"}
    >
      <div className="embedded-pharmacy__section-heading">
        <span className="embedded-pharmacy__eyebrow">Instructions</span>
        <h2 id="embedded-pharmacy-instructions-title">
          {panel?.headlineText ?? nextStep?.title ?? "What happens next"}
        </h2>
      </div>
      <ol className="embedded-pharmacy__instruction-list">
        <li>{panel?.nextStepText ?? nextStep?.summary ?? context.currentState.body}</li>
        {panel?.whoOrWhereText ? <li>{panel.whoOrWhereText}</li> : null}
        {panel?.whenExpectationText ? <li>{panel.whenExpectationText}</li> : null}
        <li>
          {panel?.symptomsWorsenText ??
            "If your symptoms get worse while this pharmacy referral is in progress, use NHS 111 or contact your GP practice."}
        </li>
      </ol>
      {panel?.warningText ? (
        <p className="embedded-pharmacy__warning-copy" role="status">
          {panel.warningText}
        </p>
      ) : null}
    </section>
  );
}

export function EmbeddedReferralStatusSurface({
  context,
}: {
  readonly context: EmbeddedPharmacyContext;
}) {
  const tracker = context.patientStatusPreview?.statusTracker;
  return (
    <section
      className="embedded-pharmacy__panel"
      aria-labelledby="embedded-pharmacy-status-title"
      data-testid="EmbeddedReferralStatusSurface"
      data-status-surface-state={context.patientStatusPreview?.surfaceState ?? context.dispatchPreview?.surfaceState ?? "fallback"}
      data-dispatch-proof-state={context.dispatchPreview?.truthBinding.authoritativeProofState ?? "none"}
    >
      <div className="embedded-pharmacy__section-heading">
        <span className="embedded-pharmacy__eyebrow">Referral status</span>
        <h2 id="embedded-pharmacy-status-title">
          {tracker?.title ?? context.dispatchPreview?.statusStrip.title ?? "Referral status"}
        </h2>
        <p>{tracker?.summary ?? context.dispatchPreview?.statusStrip.summary ?? context.currentState.body}</p>
      </div>
      {tracker ? (
        <ol className="embedded-pharmacy__status-steps">
          {tracker.steps.map((step) => (
            <li key={step.stepId} data-state={step.state}>
              <strong>{step.label}</strong>
              <span>{step.summary}</span>
            </li>
          ))}
        </ol>
      ) : (
        <dl className="embedded-pharmacy__compact-list">
          <div>
            <dt>Dispatch proof</dt>
            <dd>{context.dispatchPreview?.truthBinding.authoritativeProofState ?? "Not started"}</dd>
          </div>
          <div>
            <dt>Transport</dt>
            <dd>{context.dispatchPreview?.transportLabel ?? "Not shown"}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}

export function EmbeddedPharmacyOutcomeCard({
  context,
}: {
  readonly context: EmbeddedPharmacyContext;
}) {
  const outcome = context.patientStatusPreview?.outcomePage;
  return (
    <section
      className="embedded-pharmacy__panel embedded-pharmacy__outcome"
      aria-labelledby="embedded-pharmacy-outcome-title"
      data-testid="EmbeddedPharmacyOutcomeCard"
      data-outcome-truth={context.patientStatusPreview?.outcomeTruth.outcomeTruthState ?? "waiting"}
    >
      <div className="embedded-pharmacy__section-heading">
        <span className="embedded-pharmacy__eyebrow">Outcome</span>
        <h2 id="embedded-pharmacy-outcome-title">{outcome?.title ?? "Outcome not recorded yet"}</h2>
      </div>
      <p>{outcome?.summary ?? "This page will show the pharmacy outcome when it is recorded and safe to show."}</p>
      {outcome?.calmCompletionText ? <p>{outcome.calmCompletionText}</p> : null}
      {outcome?.warningText ? <p className="embedded-pharmacy__warning-copy">{outcome.warningText}</p> : null}
    </section>
  );
}

export function EmbeddedUrgentReturnRecoveryCard({
  context,
}: {
  readonly context: EmbeddedPharmacyContext;
}) {
  const review = context.patientStatusPreview?.reviewNextStepPage;
  if (context.currentState.actionability !== "recovery_required" && !review) return null;
  return (
    <section
      className="embedded-pharmacy__urgent"
      aria-labelledby="embedded-pharmacy-urgent-title"
      data-testid="EmbeddedUrgentReturnRecoveryCard"
      data-recovery-fixture={context.fixture}
      role={review?.announcementRole === "alert" ? "alert" : "status"}
    >
      <span className="embedded-pharmacy__eyebrow">Urgent return</span>
      <h2 id="embedded-pharmacy-urgent-title">{review?.title ?? context.currentState.title}</h2>
      <p>{review?.reviewText ?? context.currentState.body}</p>
      {review?.warningText ? <p>{review.warningText}</p> : null}
    </section>
  );
}

export function EmbeddedPharmacyRecoveryBanner({
  context,
}: {
  readonly context: EmbeddedPharmacyContext;
}) {
  if (!context.recoveryBanner.visible) return null;
  return (
    <section
      className="embedded-pharmacy__recovery"
      aria-labelledby="embedded-pharmacy-recovery-title"
      data-testid="EmbeddedPharmacyRecoveryBanner"
      data-continuity-state={context.continuityEvidence.sameShellState}
    >
      <div>
        <span className="embedded-pharmacy__eyebrow">Recovery</span>
        <h2 id="embedded-pharmacy-recovery-title">{context.recoveryBanner.title}</h2>
        <p>{context.recoveryBanner.body}</p>
      </div>
    </section>
  );
}

function EmbeddedPharmacyRouteBody({
  controller,
}: {
  readonly controller: ReturnType<typeof useEmbeddedPharmacyController>;
}) {
  const { context } = controller;
  if (context.routeKey === "choice") {
    return <EmbeddedPharmacyChooser controller={controller} />;
  }
  if (context.routeKey === "instructions") {
    return <EmbeddedPharmacyInstructionsPanel context={context} />;
  }
  if (context.routeKey === "outcome") {
    return <EmbeddedPharmacyOutcomeCard context={context} />;
  }
  if (context.routeKey === "recovery") {
    return (
      <>
        <EmbeddedUrgentReturnRecoveryCard context={context} />
        <EmbeddedReferralStatusSurface context={context} />
      </>
    );
  }
  return <EmbeddedReferralStatusSurface context={context} />;
}

export function EmbeddedPharmacyActionReserve({
  context,
  canContinueChoice,
  onPrimary,
  onSecondary,
}: {
  readonly context: EmbeddedPharmacyContext;
  readonly canContinueChoice: boolean;
  readonly onPrimary: () => void;
  readonly onSecondary: () => void;
}) {
  const disabled =
    context.currentState.actionability === "frozen" ||
    (context.routeKey === "choice" && !canContinueChoice);
  return (
    <aside
      className="embedded-pharmacy__action-reserve"
      aria-label="Pharmacy actions"
      data-testid="EmbeddedPharmacyActionReserve"
      data-actionability={context.currentState.actionability}
    >
      <button type="button" className="embedded-pharmacy__primary-action" onClick={onPrimary} disabled={disabled}>
        {context.routeKey === "choice" && !canContinueChoice
          ? "Choose a pharmacy to continue"
          : context.primaryActionLabel}
      </button>
      {context.secondaryActionLabel ? (
        <button type="button" className="embedded-pharmacy__secondary-action" onClick={onSecondary}>
          {context.secondaryActionLabel}
        </button>
      ) : null}
    </aside>
  );
}

export function EmbeddedPharmacyFrame({
  context,
  children,
}: {
  readonly context: EmbeddedPharmacyContext;
  readonly children: ReactNode;
}) {
  return (
    <main
      className="token-foundation embedded-pharmacy"
      data-testid="EmbeddedPharmacyFrame"
      data-task-id={context.taskId}
      data-visual-mode={context.visualMode}
      data-route-key={context.routeKey}
      data-pharmacy-case-id={context.pharmacyCaseId}
      data-selected-provider={context.continuityEvidence.selectedProviderRef}
      data-continuity-state={context.continuityEvidence.sameShellState}
      data-choice-projection-state={context.choicePreview?.truthProjection.projectionState ?? "none"}
      data-dispatch-proof-state={context.dispatchPreview?.truthBinding.authoritativeProofState ?? "none"}
      data-outcome-truth={context.patientStatusPreview?.outcomeTruth.outcomeTruthState ?? "none"}
    >
      {children}
    </main>
  );
}

export function EmbeddedPharmacyApp() {
  const controller = useEmbeddedPharmacyController();
  const { context } = controller;
  return (
    <EmbeddedPharmacyFrame context={context}>
      <div className="embedded-pharmacy__shell">
        <header className="embedded-pharmacy__masthead" role="banner" data-testid="EmbeddedPharmacyMasthead">
          <div>
            <span className="embedded-pharmacy__eyebrow">NHS App pharmacy</span>
            <h1>Pharmacy referral</h1>
            <p>{context.currentState.body}</p>
          </div>
          <nav aria-label="Pharmacy views" className="embedded-pharmacy__tabs">
            {(["choice", "instructions", "status", "outcome", "recovery"] as const).map((routeKey) => (
              <button
                key={routeKey}
                type="button"
                aria-current={context.routeKey === routeKey ? "page" : undefined}
                data-active={context.routeKey === routeKey ? "true" : "false"}
                onClick={() => controller.navigate(routeKey, routeFixture(routeKey))}
              >
                {routeKey}
              </button>
            ))}
          </nav>
        </header>
        <EmbeddedChosenPharmacyCard context={context} selectedProvider={controller.selectedProvider} />
        <EmbeddedPharmacyRecoveryBanner context={context} />
        <EmbeddedPharmacyRouteBody controller={controller} />
      </div>
      <EmbeddedPharmacyActionReserve
        context={context}
        canContinueChoice={controller.canContinueChoice}
        onPrimary={controller.primaryAction}
        onSecondary={controller.secondaryAction}
      />
      <div className="embedded-pharmacy__live" aria-live="polite" data-testid="EmbeddedPharmacyLiveRegion">
        {controller.announcement}
      </div>
    </EmbeddedPharmacyFrame>
  );
}

export default EmbeddedPharmacyApp;
