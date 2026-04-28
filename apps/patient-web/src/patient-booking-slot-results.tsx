import { startTransition, useEffect, useRef, useState } from "react";
import "./patient-booking-slot-results.css";
import {
  groupBookingSlotsByDay,
  patientReasonCueLabel,
  PATIENT_BOOKING_SLOT_RESULTS_TASK_ID,
  PATIENT_BOOKING_SLOT_RESULTS_VISUAL_MODE,
  resolveBookingSlotResultsProjection,
  resolveBookingSlotResultsProjectionByScenarioId,
  type BookingSlotDayGroupProjection,
  type BookingSlotResultsProjection,
  type BookingSlotSummaryProjection,
  type SlotRefineFilterKey,
  type SlotSnapshotRecoveryViewState,
} from "./patient-booking-slot-results.model";

const SLOT_RESULTS_RESTORE_STORAGE_KEY = "patient-booking-slot-results-294::restore-bundle";

interface SlotResultsRestoreBundle294 {
  readonly projectionName: "SlotResultsRestoreBundle294";
  readonly bookingCaseId: string;
  readonly shellContinuityKey: string;
  readonly scenarioId: string;
  readonly activeDayKey: string | null;
  readonly expandedSlotId: string | null;
  readonly enabledFilters: readonly SlotRefineFilterKey[];
}

export interface BookingSlotResultsStageProps {
  readonly bookingCaseId: string;
  readonly shellContinuityKey: string;
  readonly supportActionLabel: string;
  readonly onSupportAction: () => void;
  readonly onOpenConfirmationHost?: (() => void) | null;
}

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function safeDocument(): Document | undefined {
  return typeof document === "undefined" ? undefined : document;
}

function readRestoreBundle(): SlotResultsRestoreBundle294 | null {
  const raw = safeWindow()?.sessionStorage.getItem(SLOT_RESULTS_RESTORE_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as SlotResultsRestoreBundle294;
    return parsed.projectionName === "SlotResultsRestoreBundle294" ? parsed : null;
  } catch {
    return null;
  }
}

function writeRestoreBundle(bundle: SlotResultsRestoreBundle294): void {
  safeWindow()?.sessionStorage.setItem(SLOT_RESULTS_RESTORE_STORAGE_KEY, JSON.stringify(bundle));
}

function toggleFilter(
  current: readonly SlotRefineFilterKey[],
  filterKey: SlotRefineFilterKey,
): SlotRefineFilterKey[] {
  return current.includes(filterKey)
    ? current.filter((entry) => entry !== filterKey)
    : [...current, filterKey];
}

function applyRefineFilters(
  slots: readonly BookingSlotSummaryProjection[],
  enabledFilters: readonly SlotRefineFilterKey[],
): BookingSlotSummaryProjection[] {
  return slots.filter((slot) => {
    if (enabledFilters.includes("morning_only") && slot.timeBucket !== "morning") {
      return false;
    }
    if (enabledFilters.includes("preferred_site_only") && !slot.preferredSite) {
      return false;
    }
    if (enabledFilters.includes("accessible_site_only") && !slot.meetsAccessibilityNeed) {
      return false;
    }
    if (enabledFilters.includes("remote_only") && !slot.remoteCapable) {
      return false;
    }
    return true;
  });
}

function toneForViewState(
  viewState: SlotSnapshotRecoveryViewState,
): "complete" | "partial" | "stale" | "none" | "fallback" {
  switch (viewState) {
    case "partial_coverage":
      return "partial";
    case "stale_refresh_required":
      return "stale";
    case "no_supply_confirmed":
      return "none";
    case "support_fallback":
      return "fallback";
    case "renderable":
    default:
      return "complete";
  }
}

function selectionEnabledFor(
  projection: BookingSlotResultsProjection,
  slot: BookingSlotSummaryProjection,
  canContinueToConfirm: boolean,
): boolean {
  return (
    slot.actionabilityState === "available" &&
    projection.viewState !== "stale_refresh_required" &&
    projection.viewState !== "support_fallback" &&
    canContinueToConfirm
  );
}

function actionLabelFor(
  projection: BookingSlotResultsProjection,
  slot: BookingSlotSummaryProjection,
): string {
  if (projection.viewState === "stale_refresh_required" || slot.actionabilityState === "frozen") {
    return "Refresh required";
  }
  if (projection.viewState === "support_fallback" || slot.actionabilityState === "support_only") {
    return "Support only";
  }
  return "Continue with this time";
}

function liveVisibleCountLabel(visibleCount: number, snapshotCount: number): string {
  if (visibleCount === snapshotCount) {
    return `${visibleCount} visible`;
  }
  return `${visibleCount} visible of ${snapshotCount}`;
}

function ResultCountAndAnchorBar({
  projection,
  dayGroups,
  activeDayKey,
  visibleCount,
  drawerOpen,
  onToggleDrawer,
  onSelectDay,
}: {
  projection: BookingSlotResultsProjection;
  dayGroups: readonly BookingSlotDayGroupProjection[];
  activeDayKey: string | null;
  visibleCount: number;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  onSelectDay: (dayKey: string) => void;
}) {
  return (
    <section
      className="patient-booking__results-bar"
      aria-label="Snapshot result count and day anchor"
      data-testid="booking-slot-results-count-bar"
    >
      <div className="patient-booking__results-counts">
        <strong>{projection.resultCountLabel}</strong>
        <span>{liveVisibleCountLabel(visibleCount, projection.slotCount)}</span>
        <span>{projection.snapshotCountLabel}</span>
      </div>
      <div className="patient-booking__results-actions">
        <nav
          className="patient-booking__day-jump"
          aria-label={projection.dayJumpLabel}
          data-testid="booking-slot-day-jump"
        >
          {dayGroups.length > 0 ? (
            dayGroups.map((group) => (
              <button
                key={group.dayKey}
                type="button"
                className="patient-booking__day-jump-button"
                aria-current={activeDayKey === group.dayKey ? "true" : undefined}
                data-day-key={group.dayKey}
                onClick={() => onSelectDay(group.dayKey)}
              >
                <span>{group.headingLabel}</span>
                <small>{group.slotCount}</small>
              </button>
            ))
          ) : (
            <span className="patient-booking__day-jump-empty">No day groups in this snapshot</span>
          )}
        </nav>
        <button
          type="button"
          className="patient-booking__secondary-action patient-booking__results-drawer-toggle"
          aria-expanded={drawerOpen}
          aria-controls="refine-options-drawer"
          data-testid="booking-open-refine-options"
          onClick={onToggleDrawer}
        >
          Refine options
        </button>
      </div>
    </section>
  );
}

export function SnapshotCoverageRibbon({
  projection,
}: {
  projection: BookingSlotResultsProjection;
}) {
  const tone = toneForViewState(projection.viewState);
  return (
    <section
      className="patient-booking__coverage-ribbon"
      data-testid="snapshot-coverage-ribbon"
      data-view-state={projection.viewState}
      data-coverage-state={projection.coverageState}
      data-tone={tone}
    >
      <div className="patient-booking__coverage-copy">
        <span className="patient-booking__eyebrow">SnapshotCoverageRibbon</span>
        <h4>{projection.recovery.headline}</h4>
        <p>{projection.recovery.body}</p>
      </div>
      <dl className="patient-booking__coverage-meta">
        <div>
          <dt>Fetched</dt>
          <dd>{projection.fetchedLabel}</dd>
        </div>
        <div>
          <dt>Selectable until</dt>
          <dd>{projection.expiresLabel}</dd>
        </div>
        <div>
          <dt>Coverage</dt>
          <dd>{projection.coverageState.replaceAll("_", " ")}</dd>
        </div>
      </dl>
    </section>
  );
}

export function SlotSnapshotRecoveryPanel({
  projection,
  onRefresh,
  onSupportAction,
}: {
  projection: BookingSlotResultsProjection;
  onRefresh: () => void;
  onSupportAction: () => void;
}) {
  if (projection.viewState === "renderable") {
    return null;
  }
  const supportsRefresh = projection.viewState === "stale_refresh_required";
  return (
    <section
      className="patient-booking__recovery-panel"
      data-testid="slot-snapshot-recovery-panel"
      data-view-state={projection.viewState}
    >
      <div>
        <span className="patient-booking__eyebrow">SlotSnapshotRecoveryPanel</span>
        <h4>{projection.recovery.headline}</h4>
        <p>{projection.recovery.body}</p>
      </div>
      <div className="patient-booking__recovery-actions">
        {supportsRefresh ? (
          <button
            type="button"
            className="patient-booking__primary-action"
            data-testid="booking-refresh-snapshot"
            onClick={onRefresh}
          >
            {projection.recovery.actionLabel ?? "Refresh results"}
          </button>
        ) : null}
        {projection.recovery.supportHelpVisible ? (
          <button
            type="button"
            className="patient-booking__secondary-action"
            data-testid="booking-recovery-support"
            onClick={onSupportAction}
          >
            {projection.recovery.secondaryActionLabel ?? "Need help booking?"}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function SlotDayHeader({
  group,
  active,
}: {
  group: BookingSlotDayGroupProjection;
  active: boolean;
}) {
  return (
    <header className="patient-booking__day-header">
      <div>
        <small>{active ? "Current day anchor" : "Available day"}</small>
        <h4>{group.longHeadingLabel}</h4>
      </div>
      <span>{group.slotCountLabel}</span>
    </header>
  );
}

export function SlotSummaryRow({
  projection,
  slot,
  expanded,
  canContinueToConfirm,
  onToggle,
  onContinue,
}: {
  projection: BookingSlotResultsProjection;
  slot: BookingSlotSummaryProjection;
  expanded: boolean;
  canContinueToConfirm: boolean;
  onToggle: () => void;
  onContinue: () => void;
}) {
  const selectionEnabled = selectionEnabledFor(projection, slot, canContinueToConfirm);
  const disclosureId = `${slot.slotSummaryId}-details`;
  const primaryCue = slot.patientReasonCueRefs[0] ? patientReasonCueLabel(slot.patientReasonCueRefs[0]) : null;

  return (
    <article
      className="patient-booking__slot-row"
      data-slot-id={slot.slotSummaryId}
      data-day-key={slot.dayKey}
      data-expanded={expanded}
      data-actionability={slot.actionabilityState}
    >
      <button
        type="button"
        className="patient-booking__slot-summary"
        aria-expanded={expanded}
        aria-controls={disclosureId}
        onClick={onToggle}
      >
        <div className="patient-booking__slot-summary-main">
          <strong>
            {slot.startTimeLabel} to {slot.endTimeLabel}
          </strong>
          <span>
            {slot.siteLabel} · {slot.modalityLabel}
          </span>
        </div>
        <div className="patient-booking__slot-summary-meta">
          <span>{slot.clinicianLabel}</span>
          {primaryCue ? (
            <span className="patient-booking__slot-cue" data-testid="booking-slot-reason-cue">
              {primaryCue}
            </span>
          ) : null}
        </div>
      </button>
      <div
        id={disclosureId}
        className="patient-booking__slot-details"
        hidden={!expanded}
        data-testid="booking-slot-details"
      >
        <dl className="patient-booking__slot-details-grid">
          <div>
            <dt>Clinician</dt>
            <dd>{slot.clinicianTypeLabel}</dd>
          </div>
          <div>
            <dt>Travel</dt>
            <dd>{slot.travelCue ?? "Standard travel"}</dd>
          </div>
          <div>
            <dt>Access</dt>
            <dd>{slot.accessibilityCue ?? "Standard access information"}</dd>
          </div>
          <div>
            <dt>Reason</dt>
            <dd>
              {slot.patientReasonCueRefs.length > 0
                ? slot.patientReasonCueRefs.map(patientReasonCueLabel).join(", ")
                : "Ranked from the current snapshot"}
            </dd>
          </div>
        </dl>
        <div className="patient-booking__slot-footer">
          <span className="patient-booking__slot-truth">
            {projection.viewState === "stale_refresh_required"
              ? "Selection is paused until this snapshot is refreshed."
              : "This remains a frozen snapshot result, not a live supplier guarantee."}
          </span>
          <button
            type="button"
            className="patient-booking__primary-action"
            disabled={!selectionEnabled}
            aria-disabled={!selectionEnabled}
            data-testid="booking-slot-continue"
            onClick={onContinue}
          >
            {actionLabelFor(projection, slot)}
          </button>
        </div>
      </div>
    </article>
  );
}

export function DayGroupedSlotList({
  projection,
  dayGroups,
  activeDayKey,
  expandedSlotId,
  canContinueToConfirm,
  onSelectDay,
  onToggleSlot,
  onContinueToConfirm,
}: {
  projection: BookingSlotResultsProjection;
  dayGroups: readonly BookingSlotDayGroupProjection[];
  activeDayKey: string | null;
  expandedSlotId: string | null;
  canContinueToConfirm: boolean;
  onSelectDay: (dayKey: string) => void;
  onToggleSlot: (slotId: string) => void;
  onContinueToConfirm: () => void;
}) {
  if (projection.viewState === "no_supply_confirmed" || projection.viewState === "support_fallback") {
    return null;
  }
  return (
    <div className="patient-booking__day-groups" data-testid="day-grouped-slot-list">
      {dayGroups.map((group) => (
        <section
          key={group.dayKey}
          className="patient-booking__day-group"
          data-slot-day={group.dayKey}
          data-day-active={activeDayKey === group.dayKey}
          tabIndex={-1}
        >
          <div className="patient-booking__day-anchor">
            <button
              type="button"
              className="patient-booking__day-anchor-button"
              onClick={() => onSelectDay(group.dayKey)}
            >
              Jump to this day
            </button>
          </div>
          <SlotDayHeader group={group} active={activeDayKey === group.dayKey} />
          <div className="patient-booking__slot-stack">
            {group.slots.map((slot) => (
              <SlotSummaryRow
                key={slot.slotSummaryId}
                projection={projection}
                slot={slot}
                expanded={expandedSlotId === slot.slotSummaryId}
                canContinueToConfirm={canContinueToConfirm}
                onToggle={() => onToggleSlot(slot.slotSummaryId)}
                onContinue={onContinueToConfirm}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function RefineOptionsDrawer({
  projection,
  drawerOpen,
  enabledFilters,
  onClose,
  onToggleFilter,
}: {
  projection: BookingSlotResultsProjection;
  drawerOpen: boolean;
  enabledFilters: readonly SlotRefineFilterKey[];
  onClose: () => void;
  onToggleFilter: (filterKey: SlotRefineFilterKey) => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (drawerOpen) {
      headingRef.current?.focus();
    }
  }, [drawerOpen]);

  if (!drawerOpen) {
    return null;
  }

  return (
    <>
      <div className="patient-booking__drawer-backdrop" onClick={onClose} />
      <aside
        id="refine-options-drawer"
        className="patient-booking__refine-drawer"
        aria-labelledby="refine-options-title"
        data-testid="refine-options-drawer"
      >
        <div className="patient-booking__refine-header">
          <div>
            <span className="patient-booking__eyebrow">RefineOptionsDrawer</span>
            <h4 id="refine-options-title" ref={headingRef} tabIndex={-1}>
              Refine within this snapshot
            </h4>
          </div>
          <button type="button" className="patient-booking__secondary-action" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="patient-booking__refine-copy">
          These controls only narrow what is already in the frozen snapshot. They do not fetch live supplier availability.
        </p>
        <div className="patient-booking__refine-options">
          {projection.refineOptions.map((option) => (
            <label key={option.optionId} className="patient-booking__refine-option">
              <input
                type="checkbox"
                checked={enabledFilters.includes(option.filterKey)}
                onChange={() => onToggleFilter(option.filterKey)}
              />
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          ))}
        </div>
      </aside>
    </>
  );
}

export function BookingSupportFallbackStub({
  projection,
  supportActionLabel,
  onSupportAction,
}: {
  projection: BookingSlotResultsProjection;
  supportActionLabel: string;
  onSupportAction: () => void;
}) {
  if (
    !projection.recovery.supportHelpVisible &&
    projection.viewState !== "no_supply_confirmed" &&
    projection.viewState !== "support_fallback"
  ) {
    return null;
  }
  return (
    <aside
      className="patient-booking__support-stub"
      data-testid="booking-support-fallback-stub"
    >
      <div>
        <span className="patient-booking__eyebrow">BookingSupportFallbackStub</span>
        <h4>{projection.supportFallback.title}</h4>
        <p>{projection.supportFallback.body}</p>
      </div>
      <button
        type="button"
        className="patient-booking__secondary-action"
        data-testid="booking-slot-support-action"
        onClick={onSupportAction}
      >
        {supportActionLabel}
      </button>
    </aside>
  );
}

function deriveInitialState(
  bookingCaseId: string,
  shellContinuityKey: string,
): {
  projection: BookingSlotResultsProjection | null;
  restoreBundle: SlotResultsRestoreBundle294 | null;
} {
  const restoreBundle = readRestoreBundle();
  const restoredProjection =
    restoreBundle?.bookingCaseId === bookingCaseId &&
    restoreBundle?.shellContinuityKey === shellContinuityKey
      ? resolveBookingSlotResultsProjectionByScenarioId(restoreBundle.scenarioId)
      : null;
  return {
    projection: restoredProjection ?? resolveBookingSlotResultsProjection(bookingCaseId),
    restoreBundle:
      restoreBundle?.bookingCaseId === bookingCaseId &&
      restoreBundle?.shellContinuityKey === shellContinuityKey
        ? restoreBundle
        : null,
  };
}

export function BookingSlotResultsStage({
  bookingCaseId,
  shellContinuityKey,
  supportActionLabel,
  onSupportAction,
  onOpenConfirmationHost,
}: BookingSlotResultsStageProps) {
  const initial = deriveInitialState(bookingCaseId, shellContinuityKey);
  const [scenarioId, setScenarioId] = useState(initial.projection?.scenarioId ?? bookingCaseId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [enabledFilters, setEnabledFilters] = useState<readonly SlotRefineFilterKey[]>(
    initial.restoreBundle?.enabledFilters ?? [],
  );
  const [activeDayKey, setActiveDayKey] = useState<string | null>(
    initial.restoreBundle?.activeDayKey ?? initial.projection?.activeDayKey ?? null,
  );
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(
    initial.restoreBundle?.expandedSlotId ?? null,
  );
  const [announcement, setAnnouncement] = useState("Slot results loaded.");
  const firstRenderRef = useRef(true);
  const canContinueToConfirm = typeof onOpenConfirmationHost === "function";

  const projection =
    resolveBookingSlotResultsProjectionByScenarioId(scenarioId) ??
    resolveBookingSlotResultsProjection(bookingCaseId);

  if (!projection) {
    return (
      <section className="patient-booking__results-shell" data-testid="booking-slot-results-stage">
        <p>Slot results are not available for this booking case.</p>
      </section>
    );
  }

  const filteredSlots = applyRefineFilters(projection.slots, enabledFilters);
  const dayGroups = groupBookingSlotsByDay(filteredSlots);
  const firstVisibleDay = dayGroups[0]?.dayKey ?? null;
  const firstVisibleSlot = dayGroups[0]?.slots[0]?.slotSummaryId ?? null;

  useEffect(() => {
    if (!dayGroups.some((group) => group.dayKey === activeDayKey)) {
      setActiveDayKey(firstVisibleDay);
    }
    const visibleSlot = filteredSlots.some((slot) => slot.slotSummaryId === expandedSlotId);
    if (!visibleSlot) {
      setExpandedSlotId(firstVisibleSlot);
    }
  }, [activeDayKey, dayGroups, expandedSlotId, filteredSlots, firstVisibleDay, firstVisibleSlot]);

  useEffect(() => {
    writeRestoreBundle({
      projectionName: "SlotResultsRestoreBundle294",
      bookingCaseId,
      shellContinuityKey,
      scenarioId: projection.scenarioId,
      activeDayKey,
      expandedSlotId,
      enabledFilters,
    });
  }, [activeDayKey, bookingCaseId, enabledFilters, expandedSlotId, projection.scenarioId, shellContinuityKey]);

  useEffect(() => {
    if (!activeDayKey) {
      return;
    }
    const target = safeDocument()?.querySelector<HTMLElement>(`[data-slot-day='${activeDayKey}']`);
    if (!target) {
      return;
    }
    target.scrollIntoView({
      block: "start",
      behavior: firstRenderRef.current ? "auto" : "smooth",
    });
    firstRenderRef.current = false;
  }, [activeDayKey, projection.scenarioId]);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };
    safeWindow()?.addEventListener("keydown", onKeyDown);
    return () => safeWindow()?.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  function handleSelectDay(dayKey: string): void {
    startTransition(() => {
      setActiveDayKey(dayKey);
      setAnnouncement(`Jumped to ${dayKey}.`);
    });
  }

  function handleToggleSlot(slotId: string): void {
    startTransition(() => {
      setExpandedSlotId((current) => {
        const next = current === slotId ? null : slotId;
        setAnnouncement(next ? "Slot details expanded." : "Slot details collapsed.");
        return next;
      });
    });
  }

  function handleToggleFilter(filterKey: SlotRefineFilterKey): void {
    startTransition(() => {
      setEnabledFilters((current) => toggleFilter(current, filterKey));
      setAnnouncement(`Refine options updated: ${filterKey.replaceAll("_", " ")}.`);
    });
  }

  function handleRefresh(): void {
    const refreshProjectionRef = projection!.refreshProjectionRef;
    if (!refreshProjectionRef) {
      return;
    }
    const next = resolveBookingSlotResultsProjectionByScenarioId(refreshProjectionRef);
    if (!next) {
      return;
    }
    startTransition(() => {
      setScenarioId(next.scenarioId);
      setAnnouncement("Results refreshed in place.");
    });
  }

  function handleContinueToConfirm(): void {
    if (typeof onOpenConfirmationHost === "function") {
      onOpenConfirmationHost();
    }
  }

  return (
    <section
      className="patient-booking__results-shell"
      data-testid="booking-slot-results-stage"
      data-task-id={PATIENT_BOOKING_SLOT_RESULTS_TASK_ID}
      data-visual-mode={PATIENT_BOOKING_SLOT_RESULTS_VISUAL_MODE}
      data-view-state={projection.viewState}
      data-coverage-state={projection.coverageState}
      data-day-anchor={activeDayKey ?? "none"}
      data-visible-result-count={String(filteredSlots.length)}
      data-snapshot-result-count={String(projection.slotCount)}
    >
      <SnapshotCoverageRibbon projection={projection} />
      <ResultCountAndAnchorBar
        projection={projection}
        dayGroups={dayGroups}
        activeDayKey={activeDayKey}
        visibleCount={filteredSlots.length}
        drawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen((current) => !current)}
        onSelectDay={handleSelectDay}
      />
      <SlotSnapshotRecoveryPanel
        projection={projection}
        onRefresh={handleRefresh}
        onSupportAction={onSupportAction}
      />
      <DayGroupedSlotList
        projection={projection}
        dayGroups={dayGroups}
        activeDayKey={activeDayKey}
        expandedSlotId={expandedSlotId}
        canContinueToConfirm={canContinueToConfirm}
        onSelectDay={handleSelectDay}
        onToggleSlot={handleToggleSlot}
        onContinueToConfirm={handleContinueToConfirm}
      />
      {projection.viewState === "no_supply_confirmed" || projection.viewState === "support_fallback" ? (
        <div className="patient-booking__empty-state" data-testid="booking-slot-empty-state">
          <strong>{projection.resultSummary}</strong>
          <p>
            {projection.viewState === "no_supply_confirmed"
              ? "The snapshot finished cleanly for this policy. Continue using the support route rather than assuming more local supply is hiding behind filters."
              : "This route no longer supports self-service booking from the current supplier posture. Use the assisted continuation below."}
          </p>
        </div>
      ) : null}
      <BookingSupportFallbackStub
        projection={projection}
        supportActionLabel={supportActionLabel}
        onSupportAction={onSupportAction}
      />
      <RefineOptionsDrawer
        projection={projection}
        drawerOpen={drawerOpen}
        enabledFilters={enabledFilters}
        onClose={() => setDrawerOpen(false)}
        onToggleFilter={handleToggleFilter}
      />
      <div className="patient-booking__results-live" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </section>
  );
}
