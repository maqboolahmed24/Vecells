import { useEffect, useMemo, useState } from "react";
import {
  PharmacyInlineAck,
  PharmacyTargetSizeGuard,
} from "@vecells/design-system";

import type {
  PharmacyChoiceDriftRecoverySnapshot,
  PharmacyChoiceFilterBucketKey,
  PharmacyChoicePreviewSnapshot,
  PharmacyChoiceProviderCardSnapshot,
  PharmacyChoiceWarningAcknowledgementSnapshot,
} from "../../../packages/domains/pharmacy/src/phase6-pharmacy-choice-preview";
import "./patient-pharmacy-chooser.css";

export interface PharmacyChoiceController {
  filterBucket: PharmacyChoiceFilterBucketKey;
  mapVisible: boolean;
  selectedProviderId: string | null;
  selectedProvider: PharmacyChoiceProviderCardSnapshot | null;
  recommendedProviders: readonly PharmacyChoiceProviderCardSnapshot[];
  allValidProviders: readonly PharmacyChoiceProviderCardSnapshot[];
  visibleProviders: readonly PharmacyChoiceProviderCardSnapshot[];
  warningPanel: PharmacyChoiceWarningAcknowledgementSnapshot | null;
  warningChecked: boolean;
  warningAcknowledged: boolean;
  driftRecovery: PharmacyChoiceDriftRecoverySnapshot | null;
  canContinue: boolean;
  continueLabel: string;
  continueSummary: string;
  selectionSummary: string;
  selectProvider: (providerId: string) => void;
  setFilterBucket: (bucket: PharmacyChoiceFilterBucketKey) => void;
  toggleMapVisible: () => void;
  setWarningChecked: (checked: boolean) => void;
  acknowledgeWarning: () => void;
  clearSelection: () => void;
  focusChooserList: () => void;
  focusWarningPanel: () => void;
}

export interface PharmacyChoiceDecisionState {
  headline: string;
  summary: string;
  buttonLabel: string;
  mode: "focus_list" | "focus_warning" | "continue";
}

function byPreviewOrder(
  left: PharmacyChoiceProviderCardSnapshot,
  right: PharmacyChoiceProviderCardSnapshot,
): number {
  return left.rankOrdinal - right.rankOrdinal;
}

function providerMatchesFilter(
  provider: PharmacyChoiceProviderCardSnapshot,
  filterBucket: PharmacyChoiceFilterBucketKey,
): boolean {
  if (filterBucket === "all") {
    return true;
  }
  return provider.openBucket === filterBucket;
}

function focusByTestId(testId: string): void {
  if (typeof document === "undefined") {
    return;
  }
  const target = document.querySelector<HTMLElement>(`[data-testid='${testId}']`);
  target?.focus({ preventScroll: false });
}

export function usePharmacyChoiceController(
  preview: PharmacyChoicePreviewSnapshot | null,
): PharmacyChoiceController {
  const [filterBucket, setFilterBucket] = useState<PharmacyChoiceFilterBucketKey>("all");
  const [mapVisible, setMapVisible] = useState<boolean>(preview?.suggestedMapDefault ?? false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    preview?.choiceSession.selectedProviderRef?.refId ?? null,
  );
  const [warningChecked, setWarningChecked] = useState<boolean>(
    Boolean(preview?.overrideAcknowledgement),
  );
  const [warningAcknowledged, setWarningAcknowledged] = useState<boolean>(
    Boolean(preview?.overrideAcknowledgement),
  );

  useEffect(() => {
    setFilterBucket("all");
    setMapVisible(preview?.suggestedMapDefault ?? false);
    setSelectedProviderId(preview?.choiceSession.selectedProviderRef?.refId ?? null);
    setWarningChecked(Boolean(preview?.overrideAcknowledgement));
    setWarningAcknowledged(Boolean(preview?.overrideAcknowledgement));
  }, [
    preview?.pharmacyCaseId,
    preview?.choiceSession.selectedProviderRef?.refId,
    Boolean(preview?.overrideAcknowledgement),
  ]);

  const providerMap = useMemo(() => {
    const map = new Map<string, PharmacyChoiceProviderCardSnapshot>();
    for (const provider of preview?.providerCards ?? []) {
      map.set(provider.providerId, provider);
    }
    return map;
  }, [preview]);

  const selectedProvider = selectedProviderId ? providerMap.get(selectedProviderId) ?? null : null;
  const visibleProviders = useMemo(
    () =>
      (preview?.providerCards ?? [])
        .filter((provider) => providerMatchesFilter(provider, filterBucket))
        .slice()
        .sort(byPreviewOrder),
    [filterBucket, preview],
  );
  const recommendedProviders = visibleProviders.filter(
    (provider) => provider.groupKey === "recommended",
  );
  const allValidProviders = visibleProviders.filter(
    (provider) => provider.groupKey === "all_valid",
  );
  const warningPanel =
    selectedProvider && selectedProvider.overrideRequirementState !== "none"
      ? preview?.warningAcknowledgement ?? null
      : null;
  const driftRecovery = preview?.driftRecovery ?? null;
  const driftRequiresSafeReselection = Boolean(driftRecovery?.requiresSafeReselection);

  function selectProvider(providerId: string) {
    const provider = providerMap.get(providerId) ?? null;
    setSelectedProviderId(providerId);
    if (provider?.overrideRequirementState === "none") {
      setWarningChecked(false);
      setWarningAcknowledged(false);
    } else {
      setWarningChecked(false);
      setWarningAcknowledged(false);
    }
  }

  function acknowledgeWarning() {
    if (!warningPanel || !warningChecked) {
      return;
    }
    setWarningAcknowledged(true);
  }

  function clearSelection() {
    setSelectedProviderId(null);
    setWarningChecked(false);
    setWarningAcknowledged(false);
  }

  function focusChooserList() {
    focusByTestId("PharmacyChoicePage");
  }

  function focusWarningPanel() {
    focusByTestId("PharmacyWarningAcknowledgementPanel");
  }

  const canContinue =
    !driftRequiresSafeReselection &&
    selectedProvider !== null &&
    (warningPanel === null || warningAcknowledged);

  const continueLabel =
    selectedProvider === null
      ? "Select a pharmacy to continue"
      : warningPanel && !warningAcknowledged
        ? `Acknowledge ${selectedProvider.displayName} to continue`
        : `Continue with ${selectedProvider.displayName}`;
  const continueSummary =
    driftRequiresSafeReselection && driftRecovery
      ? driftRecovery.summary
      : selectedProvider === null
        ? "Pick one pharmacy from the current proof before moving to the next checkpoint."
        : warningPanel && !warningAcknowledged
          ? "The selected pharmacy is still valid, but this warning must be acknowledged in place first."
          : "The chosen pharmacy stays bound to this request as you move to the next step.";
  const selectionSummary =
    selectedProvider === null
      ? preview?.chosenReview.noSelectionLabel ?? "No pharmacy chosen yet"
      : warningPanel && !warningAcknowledged
        ? `${selectedProvider.displayName} is selected, and acknowledgement is still required.`
        : `${selectedProvider.displayName} is selected and ready for the next checkpoint.`;

  return {
    filterBucket,
    mapVisible,
    selectedProviderId,
    selectedProvider,
    recommendedProviders,
    allValidProviders,
    visibleProviders,
    warningPanel,
    warningChecked,
    warningAcknowledged,
    driftRecovery,
    canContinue,
    continueLabel,
    continueSummary,
    selectionSummary,
    selectProvider,
    setFilterBucket,
    toggleMapVisible: () => setMapVisible((current) => !current),
    setWarningChecked,
    acknowledgeWarning,
    clearSelection,
    focusChooserList,
    focusWarningPanel,
  };
}

export function resolvePharmacyChoiceDecisionState(
  preview: PharmacyChoicePreviewSnapshot | null,
  controller: PharmacyChoiceController,
): PharmacyChoiceDecisionState | null {
  if (!preview) {
    return null;
  }
  if (controller.driftRecovery?.requiresSafeReselection) {
    return {
      headline: "Choose a current pharmacy",
      summary: controller.continueSummary,
      buttonLabel: controller.driftRecovery.actionLabel,
      mode: "focus_list",
    };
  }
  if (controller.warningPanel && !controller.warningAcknowledged) {
    return {
      headline: "Acknowledge the selected warning",
      summary: controller.continueSummary,
      buttonLabel: controller.continueLabel,
      mode: "focus_warning",
    };
  }
  if (!controller.selectedProvider) {
    return {
      headline: "Select one pharmacy",
      summary: controller.continueSummary,
      buttonLabel: controller.continueLabel,
      mode: "focus_list",
    };
  }
  return {
    headline: "Keep the chosen pharmacy in view",
    summary: controller.continueSummary,
    buttonLabel: controller.continueLabel,
    mode: "continue",
  };
}

function PharmacyProviderAvailabilityStrip({
  provider,
}: {
  provider: PharmacyChoiceProviderCardSnapshot;
}) {
  return (
    <div
      className="patient-pharmacy-chooser__availability-strip"
      data-opening-state={provider.openingState}
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
    </div>
  );
}

export function PharmacyChoiceDriftRecoveryStrip({
  driftRecovery,
  onReview,
}: {
  driftRecovery: PharmacyChoiceDriftRecoverySnapshot | null;
  onReview: () => void;
}) {
  if (!driftRecovery) {
    return null;
  }
  return (
    <section
      className="patient-pharmacy-chooser__drift-strip"
      data-testid="PharmacyChoiceDriftRecoveryStrip"
      data-drift-state={driftRecovery.state}
    >
      <div>
        <p className="patient-pharmacy-chooser__eyebrow">Proof refresh</p>
        <h3>{driftRecovery.title}</h3>
        <p>{driftRecovery.summary}</p>
      </div>
      <button
        type="button"
        className="patient-pharmacy-chooser__secondary-button"
        data-testid="pharmacy-choice-drift-review"
        onClick={onReview}
      >
        {driftRecovery.actionLabel}
      </button>
    </section>
  );
}

export function PharmacyOpenStateFilterBar({
  preview,
  controller,
}: {
  preview: PharmacyChoicePreviewSnapshot;
  controller: PharmacyChoiceController;
}) {
  return (
    <section
      className="patient-pharmacy-chooser__filter-bar"
      data-testid="PharmacyOpenStateFilterBar"
    >
      <div className="patient-pharmacy-chooser__filter-group" role="group" aria-label="Open state filters">
        {preview.filterBuckets.map((bucket) => (
          <PharmacyTargetSizeGuard key={bucket.key} minSizePx={44}>
            <button
              type="button"
              className="patient-pharmacy-chooser__filter-button"
              data-testid={`pharmacy-choice-filter-${bucket.key}`}
              data-active={controller.filterBucket === bucket.key}
              onClick={() => controller.setFilterBucket(bucket.key)}
            >
              <span>{bucket.label}</span>
              <strong>{bucket.count}</strong>
              {bucket.warnedCount > 0 ? (
                <em>{bucket.warnedCount} warned</em>
              ) : null}
            </button>
          </PharmacyTargetSizeGuard>
        ))}
      </div>
      <PharmacyTargetSizeGuard minSizePx={44}>
        <button
          type="button"
          className="patient-pharmacy-chooser__map-toggle"
          data-testid="pharmacy-choice-map-toggle"
          data-active={controller.mapVisible}
          aria-pressed={controller.mapVisible}
          onClick={controller.toggleMapVisible}
        >
          {controller.mapVisible ? "Hide map" : "Show map"}
        </button>
      </PharmacyTargetSizeGuard>
    </section>
  );
}

export function PharmacyProviderCard({
  provider,
  controller,
}: {
  provider: PharmacyChoiceProviderCardSnapshot;
  controller: PharmacyChoiceController;
}) {
  const isSelected = controller.selectedProviderId === provider.providerId;
  return (
    <article
      className="patient-pharmacy-chooser__provider-card"
      data-testid={`pharmacy-provider-card-${provider.providerId}`}
      data-provider-id={provider.providerId}
      data-group-key={provider.groupKey}
      data-selected={isSelected}
      data-warning-state={provider.overrideRequirementState}
      data-opening-state={provider.openingState}
      aria-labelledby={`provider-title-${provider.providerId}`}
    >
      <div className="patient-pharmacy-chooser__provider-header">
        <div>
          <p className="patient-pharmacy-chooser__rank-badge">#{provider.rankOrdinal}</p>
          <h4 id={`provider-title-${provider.providerId}`}>{provider.displayName}</h4>
          <p>{provider.consultationLabel}</p>
        </div>
        <div className="patient-pharmacy-chooser__provider-meta">
          <strong>{provider.distanceLabel}</strong>
          <span>{provider.travelLabel}</span>
        </div>
      </div>
      <PharmacyProviderAvailabilityStrip provider={provider} />
      <div className="patient-pharmacy-chooser__provider-grid">
        <dl>
          <div>
            <dt>Opening</dt>
            <dd>{provider.openingLabel}</dd>
          </div>
          <div>
            <dt>Next contact window</dt>
            <dd>{provider.nextContactLabel}</dd>
          </div>
          <div>
            <dt>Access</dt>
            <dd>{provider.accessLabel}</dd>
          </div>
        </dl>
        <div className="patient-pharmacy-chooser__chip-row">
          {provider.reasonChips.map((chip) => (
            <span
              key={`${provider.providerId}-${chip.label}`}
              className="patient-pharmacy-chooser__chip"
              data-tone={chip.tone}
            >
              {chip.label}
            </span>
          ))}
        </div>
      </div>
      {provider.warningSummary ? (
        <p className="patient-pharmacy-chooser__warning-copy">{provider.warningSummary}</p>
      ) : null}
      <PharmacyTargetSizeGuard minSizePx={44}>
        <button
          type="button"
          className="patient-pharmacy-chooser__card-action"
          data-testid={`pharmacy-provider-select-${provider.providerId}`}
          aria-pressed={isSelected}
          onClick={() => controller.selectProvider(provider.providerId)}
        >
          {isSelected ? "Selected" : "Choose this pharmacy"}
        </button>
      </PharmacyTargetSizeGuard>
    </article>
  );
}

export function PharmacyChoiceGroupSection({
  title,
  summary,
  providers,
  controller,
}: {
  title: string;
  summary: string;
  providers: readonly PharmacyChoiceProviderCardSnapshot[];
  controller: PharmacyChoiceController;
}) {
  return (
    <section className="patient-pharmacy-chooser__group" data-testid={`pharmacy-choice-group-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <header className="patient-pharmacy-chooser__group-header">
        <div>
          <p className="patient-pharmacy-chooser__eyebrow">Choice group</p>
          <h3>{title}</h3>
        </div>
        <span className="patient-pharmacy-chooser__group-count">{providers.length}</span>
      </header>
      <p className="patient-pharmacy-chooser__group-summary">{summary}</p>
      {providers.length > 0 ? (
        <div className="patient-pharmacy-chooser__card-stack">
          {providers.map((provider) => (
            <PharmacyProviderCard
              key={provider.providerId}
              provider={provider}
              controller={controller}
            />
          ))}
        </div>
      ) : (
        <p className="patient-pharmacy-chooser__empty-state">
          No providers are in this bucket for the current filter.
        </p>
      )}
    </section>
  );
}

export function PharmacyChoiceMap({
  preview,
  controller,
}: {
  preview: PharmacyChoicePreviewSnapshot;
  controller: PharmacyChoiceController;
}) {
  if (!controller.mapVisible) {
    return null;
  }

  return (
    <aside className="patient-pharmacy-chooser__map" data-testid="PharmacyChoiceMap">
      <header className="patient-pharmacy-chooser__map-header">
        <div>
          <p className="patient-pharmacy-chooser__eyebrow">Map view</p>
          <h3>Same proof, lighter map</h3>
        </div>
        <span>{controller.visibleProviders.length} visible</span>
      </header>
      <p className="patient-pharmacy-chooser__map-summary">{preview.mapSummary}</p>
      <div className="patient-pharmacy-chooser__map-canvas" role="img" aria-label="Map of current pharmacy options">
        {controller.visibleProviders.map((provider) => (
          <button
            key={provider.providerId}
            type="button"
            className="patient-pharmacy-chooser__map-marker"
            data-provider-id={provider.providerId}
            data-selected={controller.selectedProviderId === provider.providerId}
            data-group-key={provider.groupKey}
            data-warning-state={provider.overrideRequirementState}
            style={{
              left: `${provider.mapPoint.xPercent}%`,
              top: `${provider.mapPoint.yPercent}%`,
            }}
            onClick={() => controller.selectProvider(provider.providerId)}
            aria-label={`${provider.rankOrdinal}. ${provider.displayName}. ${provider.openingLabel}. ${provider.warningTitle ?? "No warning"}.`}
          >
            {provider.rankOrdinal}
          </button>
        ))}
      </div>
      <ol className="patient-pharmacy-chooser__map-list">
        {controller.visibleProviders.map((provider) => (
          <li key={`${provider.providerId}-map-row`}>
            <button
              type="button"
              className="patient-pharmacy-chooser__map-row"
              data-provider-id={provider.providerId}
              data-selected={controller.selectedProviderId === provider.providerId}
              onClick={() => controller.selectProvider(provider.providerId)}
            >
              <strong>{provider.rankOrdinal}. {provider.displayName}</strong>
              <span>{provider.mapPoint.areaLabel}</span>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}

export function PharmacyWarningAcknowledgementPanel({
  provider,
  panel,
  controller,
}: {
  provider: PharmacyChoiceProviderCardSnapshot | null;
  panel: PharmacyChoiceWarningAcknowledgementSnapshot | null;
  controller: PharmacyChoiceController;
}) {
  if (!provider || !panel) {
    return null;
  }
  return (
    <section
      className="patient-pharmacy-chooser__warning-panel"
      data-testid="PharmacyWarningAcknowledgementPanel"
      data-provider-id={provider.providerId}
      data-acknowledged={controller.warningAcknowledged}
      tabIndex={-1}
    >
      <div className="patient-pharmacy-chooser__warning-header">
        <div>
          <p className="patient-pharmacy-chooser__eyebrow">Warned choice</p>
          <h3>{panel.title}</h3>
        </div>
        <span className="patient-pharmacy-chooser__warning-provider">{provider.displayName}</span>
      </div>
      <p>{panel.summary}</p>
      <ul className="patient-pharmacy-chooser__warning-points">
        {panel.talkingPoints.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <PharmacyInlineAck
        title="Confirm the warned choice"
        summary={panel.summary}
        checkboxLabel={panel.checkboxLabel}
        actionLabel={panel.acknowledgeLabel}
        checked={controller.warningChecked}
        acknowledged={controller.warningAcknowledged}
        onCheckedChange={controller.setWarningChecked}
        onAcknowledge={controller.acknowledgeWarning}
        noteLabel={panel.scriptRef}
        tone="guarded"
        testId="PharmacyInlineAck"
        checkboxTestId="pharmacy-choice-warning-checkbox"
        actionTestId="pharmacy-choice-acknowledge-warning"
      />
    </section>
  );
}

export function PharmacyChosenProviderReview({
  preview,
  controller,
}: {
  preview: PharmacyChoicePreviewSnapshot;
  controller: PharmacyChoiceController;
}) {
  const previousSelection = preview.driftRecovery?.previousSelectionLabel
    ? {
        label: preview.driftRecovery.previousSelectionLabel,
        summary: preview.driftRecovery.previousSelectionSummary,
      }
    : null;
  return (
    <section
      className="patient-pharmacy-chooser__chosen-review"
      data-testid="PharmacyChosenProviderReview"
      data-provenance-state={
        previousSelection && !controller.selectedProvider ? "read_only" : "current"
      }
    >
      <header className="patient-pharmacy-chooser__group-header">
        <div>
          <p className="patient-pharmacy-chooser__eyebrow">Chosen pharmacy</p>
          <h3>{preview.chosenReview.reviewTitle}</h3>
        </div>
      </header>
      <p>{preview.chosenReview.reviewSummary}</p>
      {controller.selectedProvider ? (
        <article className="patient-pharmacy-chooser__selected-card" data-testid="pharmacy-choice-current-selection">
          <strong>{controller.selectedProvider.displayName}</strong>
          <span>{controller.selectionSummary}</span>
          <span>{controller.selectedProvider.openingLabel}</span>
        </article>
      ) : previousSelection ? (
        <article className="patient-pharmacy-chooser__selected-card" data-testid="pharmacy-choice-provenance-selection">
          <strong>{previousSelection.label}</strong>
          <span>{previousSelection.summary}</span>
          <em>Read-only history</em>
        </article>
      ) : (
        <article className="patient-pharmacy-chooser__selected-card" data-testid="pharmacy-choice-empty-selection">
          <strong>{preview.chosenReview.noSelectionLabel}</strong>
          <span>Select a pharmacy from the current list to continue.</span>
        </article>
      )}
      <PharmacyTargetSizeGuard minSizePx={44}>
        <button
          type="button"
          className="patient-pharmacy-chooser__secondary-button"
          data-testid="pharmacy-choice-change-provider"
          onClick={() => {
            controller.clearSelection();
            controller.focusChooserList();
          }}
        >
          {preview.chosenReview.changeActionLabel}
        </button>
      </PharmacyTargetSizeGuard>
    </section>
  );
}

export function PharmacyChoicePage({
  preview,
  controller,
}: {
  preview: PharmacyChoicePreviewSnapshot;
  controller: PharmacyChoiceController;
}) {
  return (
    <section
      className="patient-pharmacy-chooser"
      data-testid="PharmacyChoicePage"
      data-visible-choice-set-hash={preview.truthProjection.visibleChoiceSetHash}
      data-projection-state={preview.truthProjection.projectionState}
      data-selected-provider-id={controller.selectedProviderId ?? ""}
      data-filter-bucket={controller.filterBucket}
      data-map-visible={controller.mapVisible}
      data-warning-active={Boolean(controller.warningPanel)}
      data-warning-acknowledged={controller.warningAcknowledged}
      tabIndex={-1}
    >
      <div className="patient-pharmacy-chooser__intro">
        <div>
          <p className="patient-pharmacy-chooser__eyebrow">Patient pharmacy chooser</p>
          <h3>{preview.pageTitle}</h3>
        </div>
        <p>{preview.pageSummary}</p>
      </div>

      <PharmacyChoiceDriftRecoveryStrip
        driftRecovery={controller.driftRecovery}
        onReview={controller.focusChooserList}
      />

      <PharmacyOpenStateFilterBar preview={preview} controller={controller} />

      <div
        className="patient-pharmacy-chooser__content"
        data-map-visible={controller.mapVisible}
      >
        <div className="patient-pharmacy-chooser__list">
          <PharmacyChoiceGroupSection
            title="Recommended"
            summary={preview.recommendedSummary}
            providers={controller.recommendedProviders}
            controller={controller}
          />
          <PharmacyChoiceGroupSection
            title="All valid"
            summary={preview.allValidSummary}
            providers={controller.allValidProviders}
            controller={controller}
          />
          <PharmacyWarningAcknowledgementPanel
            provider={controller.selectedProvider}
            panel={controller.warningPanel}
            controller={controller}
          />
        </div>
        <PharmacyChoiceMap preview={preview} controller={controller} />
      </div>
    </section>
  );
}
