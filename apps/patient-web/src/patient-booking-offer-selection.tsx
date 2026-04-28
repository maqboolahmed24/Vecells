import { startTransition, useEffect, useRef, useState } from "react";
import "./patient-booking-slot-results.css";
import "./patient-booking-offer-selection.css";
import {
  BookingSupportFallbackStub,
  RefineOptionsDrawer,
  SlotSnapshotRecoveryPanel,
  SnapshotCoverageRibbon,
} from "./patient-booking-slot-results";
import {
  groupBookingSlotsByDay,
  patientReasonCueLabel,
  resolveBookingSlotResultsProjectionByScenarioId,
  type BookingSlotDayGroupProjection,
  type BookingSlotResultsProjection,
  type BookingSlotSummaryProjection,
  type SlotRefineFilterKey,
} from "./patient-booking-slot-results.model";
import {
  PATIENT_BOOKING_OFFER_SELECTION_TASK_ID,
  PATIENT_BOOKING_OFFER_SELECTION_VISUAL_MODE,
  resolveOfferSelectionProjection,
  resolveOfferSelectionProjectionByScenarioId,
  resolveOfferSelectionSlot,
  selectedRankCueLabel,
  type OfferSelectionProjection,
  type OfferSelectionReservationTruthProjection,
  type ReservationTruthState,
} from "./patient-booking-offer-selection.model";
import { BookingRecoveryShell } from "./patient-booking-recovery";
import {
  resolveSelectionBookingRecoveryEnvelope,
  type BookingRecoveryActionProjection,
} from "./patient-booking-recovery.model";
import {
  BookingResponsiveStage,
  BookingStickyActionTray,
} from "./patient-booking-responsive";

const OFFER_SELECTION_RESTORE_STORAGE_KEY = "patient-booking-offer-selection-295::restore-bundle";

interface OfferSelectionRestoreBundle295 {
  readonly projectionName: "OfferSelectionRestoreBundle295";
  readonly bookingCaseId: string;
  readonly shellContinuityKey: string;
  readonly scenarioId: string;
  readonly activeDayKey: string | null;
  readonly expandedSlotId: string | null;
  readonly selectedSlotId: string | null;
  readonly compareSlotIds: readonly string[];
  readonly compareOpen: boolean;
  readonly enabledFilters: readonly SlotRefineFilterKey[];
}

export interface OfferSelectionStageProps {
  readonly bookingCaseId: string;
  readonly shellContinuityKey: string;
  readonly supportActionLabel: string;
  readonly onSupportAction: () => void;
  readonly onReturnToOrigin?: (() => void) | null;
  readonly onOpenWaitlistHost?: (() => void) | null;
  readonly onOpenConfirmationHost?: (() => void) | null;
}

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function safeDocument(): Document | undefined {
  return typeof document === "undefined" ? undefined : document;
}

function readRestoreBundle(): OfferSelectionRestoreBundle295 | null {
  const raw = safeWindow()?.sessionStorage.getItem(OFFER_SELECTION_RESTORE_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as OfferSelectionRestoreBundle295;
    return parsed.projectionName === "OfferSelectionRestoreBundle295" ? parsed : null;
  } catch {
    return null;
  }
}

function writeRestoreBundle(bundle: OfferSelectionRestoreBundle295): void {
  safeWindow()?.sessionStorage.setItem(OFFER_SELECTION_RESTORE_STORAGE_KEY, JSON.stringify(bundle));
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

function liveVisibleCountLabel(visibleCount: number, snapshotCount: number): string {
  if (visibleCount === snapshotCount) {
    return `${visibleCount} visible`;
  }
  return `${visibleCount} visible of ${snapshotCount}`;
}

function deriveInitialState(
  bookingCaseId: string,
  shellContinuityKey: string,
): {
  selection: OfferSelectionProjection | null;
  restoreBundle: OfferSelectionRestoreBundle295 | null;
} {
  const restoreBundle = readRestoreBundle();
  const restoredSelection =
    restoreBundle?.bookingCaseId === bookingCaseId &&
    restoreBundle?.shellContinuityKey === shellContinuityKey
      ? resolveOfferSelectionProjectionByScenarioId(restoreBundle.scenarioId)
      : null;
  return {
    selection: restoredSelection ?? resolveOfferSelectionProjection(bookingCaseId),
    restoreBundle:
      restoreBundle?.bookingCaseId === bookingCaseId &&
      restoreBundle?.shellContinuityKey === shellContinuityKey
        ? restoreBundle
        : null,
  };
}

function truthTone(
  truthState: ReservationTruthState | "none",
): "exclusive" | "nonexclusive" | "checking" | "unavailable" | "neutral" {
  switch (truthState) {
    case "exclusive_held":
    case "confirmed":
      return "exclusive";
    case "truthful_nonexclusive":
      return "nonexclusive";
    case "pending_confirmation":
    case "revalidation_required":
      return "checking";
    case "released":
    case "expired":
    case "disputed":
    case "unavailable":
      return "unavailable";
    case "none":
    default:
      return "neutral";
  }
}

function reservationHeadline(
  truth: OfferSelectionReservationTruthProjection | null,
): string {
  switch (truth?.truthState) {
    case "exclusive_held":
      return "Held for you";
    case "truthful_nonexclusive":
      return "Not held yet";
    case "pending_confirmation":
      return "Checking this time";
    case "confirmed":
      return "Confirmed";
    case "revalidation_required":
      return "Refresh before continuing";
    case "released":
      return "Reservation released";
    case "expired":
      return "Hold expired";
    case "disputed":
      return "Needs manual review";
    case "unavailable":
      return "No longer available";
    default:
      return "Select a slot";
  }
}

function reservationBody(
  truth: OfferSelectionReservationTruthProjection | null,
): string {
  switch (truth?.truthState) {
    case "exclusive_held":
      return "This slot is really held. You can continue while the supplier hold remains active.";
    case "truthful_nonexclusive":
      return "This slot is selected, but not reserved. Availability is confirmed when you continue.";
    case "pending_confirmation":
      return "The system is checking this slot with the supplier. Avoid changing course until that check settles.";
    case "confirmed":
      return "This slot is already confirmed.";
    case "revalidation_required":
      return "The selected slot needs a fresh snapshot before confirmation can continue.";
    case "released":
      return "This selected slot is no longer reserved. Choose another time or ask for help.";
    case "expired":
      return "The hold on this selected slot has ended. Keep it as reference, but choose another time.";
    case "disputed":
      return "This selected slot needs manual review before the booking can continue.";
    case "unavailable":
      return "This selected slot is no longer available. Choose another option from the ranked list.";
    default:
      return "Choose a ranked slot to see truthful reservation guidance.";
  }
}

function truthShortCue(
  truth: OfferSelectionReservationTruthProjection | null,
): string {
  switch (truth?.truthState) {
    case "exclusive_held":
      return "Held";
    case "truthful_nonexclusive":
      return "Not held";
    case "pending_confirmation":
      return "Checking";
    case "confirmed":
      return "Confirmed";
    case "revalidation_required":
      return "Refresh required";
    case "released":
      return "Released";
    case "expired":
      return "Expired";
    case "disputed":
      return "Manual review";
    case "unavailable":
      return "Unavailable";
    default:
      return "No selection";
  }
}

function countdownLabel(
  truth: OfferSelectionReservationTruthProjection | null,
  referenceNowAt: string,
): string | null {
  if (truth?.countdownMode !== "hold_expiry" || !truth.exclusiveUntilAt) {
    return null;
  }
  const remainingMs = Date.parse(truth.exclusiveUntilAt) - Date.parse(referenceNowAt);
  const remainingMinutes = Math.max(0, Math.round(remainingMs / 60_000));
  return `${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} remaining`;
}

function canContinueToConfirm(
  slotResults: BookingSlotResultsProjection,
  truth: OfferSelectionReservationTruthProjection | null,
  onOpenConfirmationHost?: (() => void) | null,
): boolean {
  if (typeof onOpenConfirmationHost !== "function") {
    return false;
  }
  if (
    slotResults.viewState === "stale_refresh_required" ||
    slotResults.viewState === "support_fallback" ||
    slotResults.viewState === "no_supply_confirmed"
  ) {
    return false;
  }
  return truth?.truthState === "exclusive_held" || truth?.truthState === "truthful_nonexclusive";
}

function rowSelectionState(
  slotResults: BookingSlotResultsProjection,
  truth: OfferSelectionReservationTruthProjection | null,
  selected: boolean,
): "selected" | "selectable" | "checking" | "unavailable" | "frozen" | "support_only" {
  if (slotResults.viewState === "support_fallback" || slotResults.viewState === "no_supply_confirmed") {
    return "support_only";
  }
  if (slotResults.viewState === "stale_refresh_required") {
    return "frozen";
  }
  if (!selected) {
    return "selectable";
  }
  switch (truth?.truthState) {
    case "pending_confirmation":
    case "revalidation_required":
      return "checking";
    case "released":
    case "expired":
    case "disputed":
    case "unavailable":
      return "unavailable";
    case "exclusive_held":
    case "truthful_nonexclusive":
    case "confirmed":
    default:
      return "selected";
  }
}

function selectionTruthText(
  selectionState: ReturnType<typeof rowSelectionState>,
): string {
  switch (selectionState) {
    case "selected":
      return "Selected state stays separate from reservation truth.";
    case "checking":
      return "This slot is selected, but confirmation is still checking.";
    case "unavailable":
      return "This slot stays visible as provenance, but it can no longer be confirmed.";
    case "frozen":
      return "Selection is paused until this snapshot is refreshed.";
    case "support_only":
      return "This route now requires the supported fallback instead of more self-service selection.";
    case "selectable":
    default:
      return "This ranked result can be selected without implying a hold.";
  }
}

function focusCompareTrigger(): void {
  safeDocument()
    ?.querySelector<HTMLElement>("[data-compare-trigger='open-compare']")
    ?.focus({ preventScroll: true });
}

function ResultCountAndAnchorBar({
  projection,
  dayGroups,
  activeDayKey,
  visibleCount,
  drawerOpen,
  compareCount,
  compareDisabled,
  onToggleDrawer,
  onSelectDay,
  onOpenCompare,
}: {
  projection: BookingSlotResultsProjection;
  dayGroups: readonly BookingSlotDayGroupProjection[];
  activeDayKey: string | null;
  visibleCount: number;
  drawerOpen: boolean;
  compareCount: number;
  compareDisabled: boolean;
  onToggleDrawer: () => void;
  onSelectDay: (dayKey: string) => void;
  onOpenCompare: () => void;
}) {
  return (
    <section
      className="patient-booking__results-bar"
      aria-label="Selection controls and day anchor"
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
        <div className="patient-booking__offer-actions">
          <button
            type="button"
            className="patient-booking__secondary-action"
            data-compare-trigger="open-compare"
            disabled={compareDisabled}
            aria-disabled={compareDisabled}
            onClick={onOpenCompare}
          >
            Compare {compareCount > 0 ? `${compareCount + 1} slots` : "slots"}
          </button>
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
      </div>
    </section>
  );
}

export function SlotReasonCueChip({
  reasonCueRef,
}: {
  reasonCueRef: string;
}) {
  return (
    <span className="patient-booking__offer-chip" data-rank-cue={reasonCueRef}>
      {patientReasonCueLabel(reasonCueRef as Parameters<typeof patientReasonCueLabel>[0])}
    </span>
  );
}

export function ReservationTruthBanner({
  truth,
  referenceNowAt,
}: {
  truth: OfferSelectionReservationTruthProjection | null;
  referenceNowAt: string;
}) {
  const tone = truthTone(truth?.truthState ?? "none");
  const countdown = countdownLabel(truth, referenceNowAt);
  return (
    <section
      className="patient-booking__truth-banner"
      data-testid="reservation-truth-banner"
      data-reservation-truth={truth?.truthState ?? "none"}
      data-countdown-mode={truth?.countdownMode ?? "none"}
      data-tone={tone}
    >
      <div className="patient-booking__truth-copy">
        <span className="patient-booking__eyebrow">ReservationTruthBanner</span>
        <strong>{reservationHeadline(truth)}</strong>
        <p>{reservationBody(truth)}</p>
      </div>
      <div className="patient-booking__truth-meta">
        <span>{truthShortCue(truth)}</span>
        {countdown ? <strong>{countdown}</strong> : null}
      </div>
    </section>
  );
}

export function SelectedSlotPin({
  slot,
  truth,
  referenceNowAt,
  compareCount,
  canOpenCompare,
  onOpenCompare,
  compareActionMode = "visible",
  eyebrow = "SelectedSlotPin",
  title,
}: {
  slot: BookingSlotSummaryProjection | null;
  truth: OfferSelectionReservationTruthProjection | null;
  referenceNowAt: string;
  compareCount: number;
  canOpenCompare: boolean;
  onOpenCompare: () => void;
  compareActionMode?: "visible" | "hidden";
  eyebrow?: string;
  title?: string;
}) {
  return (
    <aside
      className="patient-booking__selected-pin"
      data-testid="selected-slot-pin"
      data-selected-slot={slot?.slotSummaryId ?? "none"}
    >
      <div className="patient-booking__section-head">
        <span className="patient-booking__eyebrow">{eyebrow}</span>
        <h4>{title ?? (slot ? "Current selection" : "No slot selected")}</h4>
      </div>
      {slot ? (
        <>
          <div className="patient-booking__selected-summary">
            <strong>
              {slot.startTimeLabel} to {slot.endTimeLabel}
            </strong>
            <span>{slot.dayLongLabel}</span>
            <span>
              {slot.siteLabel} · {slot.modalityLabel}
            </span>
            <span>{slot.clinicianLabel}</span>
          </div>
          <div className="patient-booking__selected-chip-set">
            {slot.patientReasonCueRefs.slice(0, 2).map((reasonCueRef) => (
              <SlotReasonCueChip key={reasonCueRef} reasonCueRef={reasonCueRef} />
            ))}
          </div>
          <ReservationTruthBanner truth={truth} referenceNowAt={referenceNowAt} />
          <dl className="patient-booking__selected-facts">
            <div>
              <dt>Reason cue</dt>
              <dd>{selectedRankCueLabel(slot) ?? "Ranked from the current snapshot"}</dd>
            </div>
            <div>
              <dt>Access</dt>
              <dd>{slot.accessibilityCue ?? "Standard access information"}</dd>
            </div>
            <div>
              <dt>Travel</dt>
              <dd>{slot.travelCue ?? "Standard travel"}</dd>
            </div>
          </dl>
          {compareActionMode === "visible" ? (
            <div className="patient-booking__selected-actions">
              <button
                type="button"
                className="patient-booking__secondary-action"
                disabled={!canOpenCompare}
                aria-disabled={!canOpenCompare}
                onClick={onOpenCompare}
              >
                Compare {compareCount > 0 ? `${compareCount + 1} slots` : "later"}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <p className="patient-booking__selected-empty">
          Choose one ranked slot to pin its summary, truth posture, and next step without losing the wider list.
        </p>
      )}
    </aside>
  );
}

export function StickyConfirmTray({
  slot,
  truth,
  canContinue,
  onContinue,
}: {
  slot: BookingSlotSummaryProjection | null;
  truth: OfferSelectionReservationTruthProjection | null;
  canContinue: boolean;
  onContinue: () => void;
}) {
  return (
    <BookingStickyActionTray
      testId="sticky-confirm-tray"
      primaryTestId="sticky-confirm-continue"
      title={slot ? `${slot.dayShortLabel} · ${slot.startTimeLabel}` : "No slot selected"}
      detail={truthShortCue(truth)}
      primaryActionLabel="Continue to confirmation"
      primaryActionRef="book_slot"
      primaryDisabled={!canContinue}
      onPrimaryAction={onContinue}
    />
  );
}

export function SelectionRecoveryPanel({
  slotResults,
  truth,
  supportActionLabel,
  onRefresh,
  onSupportAction,
}: {
  slotResults: BookingSlotResultsProjection;
  truth: OfferSelectionReservationTruthProjection | null;
  supportActionLabel: string;
  onRefresh: () => void;
  onSupportAction: () => void;
}) {
  if (
    slotResults.viewState === "renderable" &&
    truth?.truthState !== "released" &&
    truth?.truthState !== "expired" &&
    truth?.truthState !== "revalidation_required" &&
    truth?.truthState !== "unavailable" &&
    truth?.truthState !== "disputed"
  ) {
    return null;
  }

  const needsRefresh =
    slotResults.viewState === "stale_refresh_required" || truth?.truthState === "revalidation_required";

  return (
    <section
      className="patient-booking__selection-recovery"
      data-testid="selection-recovery-panel"
      data-reservation-truth={truth?.truthState ?? "none"}
      data-view-state={slotResults.viewState}
    >
      <div>
        <span className="patient-booking__eyebrow">SelectionRecoveryPanel</span>
        <h4>
          {needsRefresh
            ? "Refresh before continuing"
            : truth?.truthState === "expired" || truth?.truthState === "released"
              ? "Choose another ranked time"
              : truth?.truthState === "unavailable"
                ? "This selected time is no longer available"
                : "Use the next safe path"}
        </h4>
        <p>{reservationBody(truth)}</p>
      </div>
      <div className="patient-booking__selection-recovery-actions">
        {needsRefresh ? (
          <button
            type="button"
            className="patient-booking__primary-action"
            onClick={onRefresh}
          >
            Refresh results
          </button>
        ) : null}
        <button
          type="button"
          className="patient-booking__secondary-action"
          onClick={onSupportAction}
        >
          {supportActionLabel}
        </button>
      </div>
    </section>
  );
}

function OfferSelectionRow({
  slotResults,
  slot,
  truth,
  selected,
  expanded,
  compareSelected,
  compareLimitReached,
  canContinueSelected,
  onToggle,
  onSelect,
  onContinue,
  onToggleCompare,
}: {
  slotResults: BookingSlotResultsProjection;
  slot: BookingSlotSummaryProjection;
  truth: OfferSelectionReservationTruthProjection | null;
  selected: boolean;
  expanded: boolean;
  compareSelected: boolean;
  compareLimitReached: boolean;
  canContinueSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onContinue: () => void;
  onToggleCompare: () => void;
}) {
  const selectionState = rowSelectionState(slotResults, truth, selected);
  const disclosureId = `${slot.slotSummaryId}-details`;
  const primaryCue = slot.patientReasonCueRefs[0] ? patientReasonCueLabel(slot.patientReasonCueRefs[0]) : null;

  return (
    <article
      className="patient-booking__slot-row patient-booking__slot-row--offer"
      data-slot-id={slot.slotSummaryId}
      data-day-key={slot.dayKey}
      data-expanded={expanded}
      data-selection-state={selectionState}
      data-selected-slot={selected ? "true" : "false"}
      data-reservation-truth={selected ? truth?.truthState ?? "none" : "none"}
      data-rank-cue={slot.patientReasonCueRefs[0] ?? "none"}
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
          <div className="patient-booking__slot-summary-chipline">
            {selected ? (
              <span className="patient-booking__slot-pill patient-booking__slot-pill--selected">Selected</span>
            ) : null}
            {primaryCue ? (
              <span className="patient-booking__slot-cue" data-testid="booking-slot-reason-cue">
                {primaryCue}
              </span>
            ) : null}
          </div>
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
          <span className="patient-booking__slot-truth">{selectionTruthText(selectionState)}</span>
          <div className="patient-booking__offer-row-actions">
            <button
              type="button"
              className="patient-booking__secondary-action"
              data-compare-button-id={`compare-${slot.slotSummaryId}`}
              disabled={!compareSelected && compareLimitReached}
              aria-disabled={!compareSelected && compareLimitReached}
              onClick={onToggleCompare}
            >
              {compareSelected ? "Remove from compare" : "Add to compare"}
            </button>
            {selected ? (
              <button
                type="button"
                className="patient-booking__primary-action"
                data-testid="booking-slot-continue"
                disabled={!canContinueSelected}
                aria-disabled={!canContinueSelected}
                onClick={onContinue}
              >
                Continue with this time
              </button>
            ) : (
              <button
                type="button"
                className="patient-booking__primary-action"
                data-testid="booking-slot-select"
                onClick={onSelect}
              >
                Select this slot
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function OfferSelectionDayList({
  slotResults,
  dayGroups,
  activeDayKey,
  expandedSlotId,
  selectedSlotId,
  compareSlotIds,
  compareLimit,
  canContinueSelected,
  onSelectDay,
  onToggleSlot,
  onSelectSlot,
  onContinueToConfirm,
  onToggleCompareSlot,
  truthBySlotId,
}: {
  slotResults: BookingSlotResultsProjection;
  dayGroups: readonly BookingSlotDayGroupProjection[];
  activeDayKey: string | null;
  expandedSlotId: string | null;
  selectedSlotId: string | null;
  compareSlotIds: readonly string[];
  compareLimit: number;
  canContinueSelected: boolean;
  onSelectDay: (dayKey: string) => void;
  onToggleSlot: (slotId: string) => void;
  onSelectSlot: (slotId: string) => void;
  onContinueToConfirm: () => void;
  onToggleCompareSlot: (slotId: string) => void;
  truthBySlotId: Readonly<Record<string, OfferSelectionReservationTruthProjection>>;
}) {
  if (slotResults.viewState === "no_supply_confirmed" || slotResults.viewState === "support_fallback") {
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
          <header className="patient-booking__day-header">
            <div>
              <small>{activeDayKey === group.dayKey ? "Current day anchor" : "Available day"}</small>
              <h4>{group.longHeadingLabel}</h4>
            </div>
            <span>{group.slotCountLabel}</span>
          </header>
          <div className="patient-booking__slot-stack">
            {group.slots.map((slot) => (
              <OfferSelectionRow
                key={slot.slotSummaryId}
                slotResults={slotResults}
                slot={slot}
                truth={truthBySlotId[slot.slotSummaryId] ?? null}
                selected={selectedSlotId === slot.slotSummaryId}
                expanded={expandedSlotId === slot.slotSummaryId}
                compareSelected={compareSlotIds.includes(slot.slotSummaryId)}
                compareLimitReached={compareSlotIds.length >= compareLimit && !compareSlotIds.includes(slot.slotSummaryId)}
                canContinueSelected={selectedSlotId === slot.slotSummaryId ? canContinueSelected : false}
                onToggle={() => onToggleSlot(slot.slotSummaryId)}
                onSelect={() => onSelectSlot(slot.slotSummaryId)}
                onContinue={onContinueToConfirm}
                onToggleCompare={() => onToggleCompareSlot(slot.slotSummaryId)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function SlotCompareDrawer({
  open,
  slots,
  selectedSlotId,
  referenceNowAt,
  truthsBySlotId,
  onClose,
  onSelectSlot,
}: {
  open: boolean;
  slots: readonly BookingSlotSummaryProjection[];
  selectedSlotId: string | null;
  referenceNowAt: string;
  truthsBySlotId: Readonly<Record<string, OfferSelectionReservationTruthProjection>>;
  onClose: () => void;
  onSelectSlot: (slotId: string) => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (open) {
      headingRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="patient-booking__drawer-backdrop" onClick={onClose} />
      <aside
        className="patient-booking__compare-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-drawer-title"
        data-testid="slot-compare-drawer"
        data-compare-open="true"
      >
        <div className="patient-booking__compare-header">
          <div>
            <span className="patient-booking__eyebrow">SlotCompareDrawer</span>
            <h4 id="compare-drawer-title" ref={headingRef} tabIndex={-1}>
              Compare without losing your current selection
            </h4>
          </div>
          <button type="button" className="patient-booking__secondary-action" onClick={onClose}>
            Close compare
          </button>
        </div>
        <p className="patient-booking__compare-copy">
          Order stays tied to the ranked snapshot. The selected slot stays marked without being moved to the top.
        </p>
        <div className="patient-booking__compare-grid">
          {slots.map((slot) => {
            const truth = truthsBySlotId[slot.slotSummaryId] ?? null;
            return (
              <article
                key={slot.slotSummaryId}
                className="patient-booking__compare-card"
                data-selected-slot={selectedSlotId === slot.slotSummaryId ? "true" : "false"}
                data-reservation-truth={truth?.truthState ?? "none"}
              >
                <div className="patient-booking__compare-card-head">
                  <div>
                    <strong>
                      {slot.dayShortLabel} · {slot.startTimeLabel}
                    </strong>
                    <span>{slot.siteLabel}</span>
                  </div>
                  {selectedSlotId === slot.slotSummaryId ? (
                    <span className="patient-booking__slot-pill patient-booking__slot-pill--selected">
                      Selected
                    </span>
                  ) : null}
                </div>
                <div className="patient-booking__selected-chip-set">
                  {slot.patientReasonCueRefs.slice(0, 2).map((reasonCueRef) => (
                    <SlotReasonCueChip key={reasonCueRef} reasonCueRef={reasonCueRef} />
                  ))}
                </div>
                <ReservationTruthBanner truth={truth} referenceNowAt={referenceNowAt} />
                <dl className="patient-booking__compare-facts">
                  <div>
                    <dt>Clinician</dt>
                    <dd>{slot.clinicianLabel}</dd>
                  </div>
                  <div>
                    <dt>Modality</dt>
                    <dd>{slot.modalityLabel}</dd>
                  </div>
                  <div>
                    <dt>Travel</dt>
                    <dd>{slot.travelCue ?? "Standard travel"}</dd>
                  </div>
                  <div>
                    <dt>Access</dt>
                    <dd>{slot.accessibilityCue ?? "Standard access information"}</dd>
                  </div>
                </dl>
                {selectedSlotId !== slot.slotSummaryId ? (
                  <button
                    type="button"
                    className="patient-booking__primary-action"
                    onClick={() => onSelectSlot(slot.slotSummaryId)}
                  >
                    Make this the selected slot
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      </aside>
    </>
  );
}

function OfferSelectionEmptyState({
  slotResults,
  onOpenWaitlistHost,
}: {
  slotResults: BookingSlotResultsProjection;
  onOpenWaitlistHost?: (() => void) | null;
}) {
  if (slotResults.viewState !== "no_supply_confirmed" && slotResults.viewState !== "support_fallback") {
    return null;
  }
  return (
    <section
      className="patient-booking__empty-state patient-booking__offer-empty"
      data-testid="booking-slot-empty-state"
    >
      <span className="patient-booking__eyebrow">OfferSelectionStage</span>
      <strong>{slotResults.recovery.headline}</strong>
      <p>{slotResults.recovery.body}</p>
      {slotResults.viewState === "no_supply_confirmed" && typeof onOpenWaitlistHost === "function" ? (
        <div className="patient-booking__offer-actions">
          <button
            type="button"
            className="patient-booking__primary-action"
            data-testid="booking-open-waitlist"
            onClick={onOpenWaitlistHost}
          >
            Join the waitlist
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function OfferSelectionStage({
  bookingCaseId,
  shellContinuityKey,
  supportActionLabel,
  onSupportAction,
  onReturnToOrigin,
  onOpenWaitlistHost,
  onOpenConfirmationHost,
}: OfferSelectionStageProps) {
  const initial = deriveInitialState(bookingCaseId, shellContinuityKey);
  const [scenarioId, setScenarioId] = useState(initial.selection?.scenarioId ?? bookingCaseId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(initial.restoreBundle?.compareOpen ?? false);
  const [enabledFilters, setEnabledFilters] = useState<readonly SlotRefineFilterKey[]>(
    initial.restoreBundle?.enabledFilters ?? [],
  );
  const [activeDayKey, setActiveDayKey] = useState<string | null>(
    initial.restoreBundle?.activeDayKey ?? null,
  );
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(
    initial.restoreBundle?.expandedSlotId ?? null,
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(
    initial.restoreBundle?.selectedSlotId ?? initial.selection?.selectedSlotId ?? null,
  );
  const [compareSlotIds, setCompareSlotIds] = useState<readonly string[]>(
    initial.restoreBundle?.compareSlotIds ?? initial.selection?.compareSlotIds ?? [],
  );
  const [announcement, setAnnouncement] = useState("Offer selection loaded.");
  const firstRenderRef = useRef(true);

  const selection =
    resolveOfferSelectionProjectionByScenarioId(scenarioId) ??
    resolveOfferSelectionProjection(bookingCaseId);
  const slotResults = selection
    ? resolveBookingSlotResultsProjectionByScenarioId(selection.slotResultsScenarioId)
    : null;

  useEffect(() => {
    if (!compareOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCompareOpen(false);
        setAnnouncement("Compare closed.");
        safeWindow()?.setTimeout(() => focusCompareTrigger(), 0);
      }
    };
    safeWindow()?.addEventListener("keydown", onKeyDown);
    return () => safeWindow()?.removeEventListener("keydown", onKeyDown);
  }, [compareOpen]);

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

  if (!selection || !slotResults) {
    return (
      <section className="patient-booking__results-shell" data-testid="booking-slot-results-stage">
        <p>Offer selection is not available for this booking case.</p>
      </section>
    );
  }

  const activeSelection = selection;
  const activeSlotResults = slotResults;

  const filteredSlots = applyRefineFilters(activeSlotResults.slots, enabledFilters);
  const dayGroups = groupBookingSlotsByDay(filteredSlots);
  const firstVisibleDay = dayGroups[0]?.dayKey ?? null;
  const selectedSlot =
    resolveOfferSelectionSlot(activeSlotResults, selectedSlotId) ??
    resolveOfferSelectionSlot(activeSlotResults, activeSelection.selectedSlotId);
  const selectedTruth =
    (selectedSlot ? activeSelection.reservationTruthBySlotId[selectedSlot.slotSummaryId] : null) ?? null;
  const firstVisibleSlotId = dayGroups[0]?.slots[0]?.slotSummaryId ?? selectedSlot?.slotSummaryId ?? null;

  useEffect(() => {
    if (!selectedSlotId && selectedSlot?.slotSummaryId) {
      setSelectedSlotId(selectedSlot.slotSummaryId);
    }
  }, [selectedSlot, selectedSlotId]);

  useEffect(() => {
    if (!dayGroups.some((group) => group.dayKey === activeDayKey)) {
      setActiveDayKey(selectedSlot?.dayKey ?? firstVisibleDay);
    }
    const visibleSlot = filteredSlots.some((slot) => slot.slotSummaryId === expandedSlotId);
    if (!visibleSlot) {
      setExpandedSlotId(selectedSlot?.slotSummaryId ?? firstVisibleSlotId);
    }
  }, [activeDayKey, dayGroups, expandedSlotId, filteredSlots, firstVisibleDay, firstVisibleSlotId, selectedSlot]);

  useEffect(() => {
    const validCompareSlots = compareSlotIds.filter((slotId) =>
      activeSlotResults.slots.some((slot) => slot.slotSummaryId === slotId),
    );
    if (validCompareSlots.length !== compareSlotIds.length) {
      setCompareSlotIds(validCompareSlots);
    }
  }, [activeSlotResults.slots, compareSlotIds]);

  useEffect(() => {
    writeRestoreBundle({
      projectionName: "OfferSelectionRestoreBundle295",
      bookingCaseId,
      shellContinuityKey,
      scenarioId: activeSelection.scenarioId,
      activeDayKey,
      expandedSlotId,
      selectedSlotId,
      compareSlotIds,
      compareOpen,
      enabledFilters,
    });
  }, [
    activeDayKey,
    bookingCaseId,
    compareOpen,
    compareSlotIds,
    enabledFilters,
    expandedSlotId,
    selectedSlotId,
    activeSelection.scenarioId,
    shellContinuityKey,
  ]);

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
  }, [activeDayKey, activeSelection.scenarioId]);

  const canContinueSelected = canContinueToConfirm(activeSlotResults, selectedTruth, onOpenConfirmationHost);
  const orderedCompareSlots = activeSlotResults.slots.filter(
    (slot) => slot.slotSummaryId === selectedSlot?.slotSummaryId || compareSlotIds.includes(slot.slotSummaryId),
  );
  const recoveryProjection = resolveSelectionBookingRecoveryEnvelope(
    activeSelection.scenarioId,
    "authenticated",
    supportActionLabel,
  );

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
    const nextSelection = activeSelection.refreshProjectionRef
      ? resolveOfferSelectionProjectionByScenarioId(activeSelection.refreshProjectionRef)
      : activeSelection.slotResultsScenarioId === "booking_case_294_stale"
        ? resolveOfferSelectionProjectionByScenarioId("booking_case_295_nonexclusive_refreshed")
        : null;
    if (!nextSelection) {
      return;
    }
    startTransition(() => {
      setScenarioId(nextSelection.scenarioId);
      setCompareOpen(false);
      setAnnouncement("Selection refreshed in place.");
    });
  }

  function handleSelectSlot(slotId: string): void {
    const slot = resolveOfferSelectionSlot(activeSlotResults, slotId);
    if (!slot) {
      return;
    }
    startTransition(() => {
      setSelectedSlotId(slotId);
      setExpandedSlotId(slotId);
      setActiveDayKey(slot.dayKey);
      setCompareSlotIds((current) => current.filter((entry) => entry !== slotId));
      setAnnouncement(`Selected ${slot.dayShortLabel} at ${slot.startTimeLabel}.`);
    });
  }

  function handleContinueToConfirm(): void {
    if (!canContinueSelected) {
      return;
    }
    onOpenConfirmationHost?.();
  }

  function handleToggleCompareSlot(slotId: string): void {
    if (selectedSlotId === slotId) {
      return;
    }
    startTransition(() => {
      setCompareSlotIds((current) => {
        if (current.includes(slotId)) {
          setAnnouncement("Removed a slot from compare.");
          return current.filter((entry) => entry !== slotId);
        }
        if (current.length >= activeSelection.compareLimit) {
          setAnnouncement("Compare keeps at most three slots including the current selection.");
          return current;
        }
        setAnnouncement("Added a slot to compare.");
        return [...current, slotId];
      });
    });
  }

  function handleOpenCompare(): void {
    if (compareSlotIds.length === 0) {
      return;
    }
    startTransition(() => {
      setCompareOpen(true);
      setAnnouncement("Compare opened.");
    });
  }

  function handleCloseCompare(): void {
    startTransition(() => {
      setCompareOpen(false);
      setAnnouncement("Compare closed.");
    });
    safeWindow()?.setTimeout(() => focusCompareTrigger(), 0);
  }

  function handleRecoveryAction(action: BookingRecoveryActionProjection): void {
    switch (action.actionRef) {
      case "refresh_selection":
        setAnnouncement(action.detail);
        handleRefresh();
        return;
      case "return_to_selection":
        startTransition(() => {
          setScenarioId(action.transitionScenarioId ?? "booking_case_295_nonexclusive");
          setCompareOpen(false);
          setAnnouncement(action.detail);
        });
        return;
      case "request_support":
      default:
        setAnnouncement(action.detail);
        onSupportAction();
    }
  }

  return (
    <section
      className="patient-booking__results-shell patient-booking__offer-stage"
      data-testid="booking-slot-results-stage"
      data-stage-name="OfferSelectionStage"
      data-task-id={PATIENT_BOOKING_OFFER_SELECTION_TASK_ID}
      data-visual-mode={PATIENT_BOOKING_OFFER_SELECTION_VISUAL_MODE}
      data-view-state={activeSlotResults.viewState}
      data-coverage-state={activeSlotResults.coverageState}
      data-day-anchor={activeDayKey ?? "none"}
      data-visible-result-count={String(filteredSlots.length)}
      data-snapshot-result-count={String(activeSlotResults.slotCount)}
      data-selected-slot={selectedSlot?.slotSummaryId ?? "none"}
      data-reservation-truth={selectedTruth?.truthState ?? "none"}
      data-countdown-mode={selectedTruth?.countdownMode ?? "none"}
      data-compare-open={compareOpen ? "true" : "false"}
      data-rank-cue={selectedSlot?.patientReasonCueRefs[0] ?? "none"}
    >
      {recoveryProjection ? (
        <BookingRecoveryShell
          projection={recoveryProjection}
          onAction={handleRecoveryAction}
          onReturn={onReturnToOrigin ?? onSupportAction}
        />
      ) : (
        <>
          <SnapshotCoverageRibbon projection={activeSlotResults} />
          <ResultCountAndAnchorBar
            projection={activeSlotResults}
            dayGroups={dayGroups}
            activeDayKey={activeDayKey}
            visibleCount={filteredSlots.length}
            drawerOpen={drawerOpen}
            compareCount={compareSlotIds.length}
            compareDisabled={compareSlotIds.length === 0}
            onToggleDrawer={() => setDrawerOpen((current) => !current)}
            onSelectDay={handleSelectDay}
            onOpenCompare={handleOpenCompare}
          />
          <BookingResponsiveStage
            stageName="OfferSelectionStage"
            testId="offer-selection-responsive-stage"
            railToggleLabel="View selected slot summary"
            railTitle="Selected slot and reservation truth"
            foldedPinned={
              <SelectedSlotPin
                slot={selectedSlot}
                truth={selectedTruth}
                referenceNowAt={activeSelection.referenceNowAt}
                compareCount={compareSlotIds.length}
                canOpenCompare={compareSlotIds.length > 0}
                onOpenCompare={handleOpenCompare}
              />
            }
            rail={
              <div className="patient-booking__offer-rail">
                <SelectedSlotPin
                  slot={selectedSlot}
                  truth={selectedTruth}
                  referenceNowAt={activeSelection.referenceNowAt}
                  compareCount={compareSlotIds.length}
                  canOpenCompare={compareSlotIds.length > 0}
                  onOpenCompare={handleOpenCompare}
                />
              </div>
            }
            stickyTray={
              <StickyConfirmTray
                slot={selectedSlot}
                truth={selectedTruth}
                canContinue={canContinueSelected}
                onContinue={handleContinueToConfirm}
              />
            }
            main={
              <div className="patient-booking__offer-main">
                <SlotSnapshotRecoveryPanel
                  projection={activeSlotResults}
                  onRefresh={handleRefresh}
                  onSupportAction={onSupportAction}
                />
                <SelectionRecoveryPanel
                  slotResults={activeSlotResults}
                  truth={selectedTruth}
                  supportActionLabel={supportActionLabel}
                  onRefresh={handleRefresh}
                  onSupportAction={onSupportAction}
                />
                <OfferSelectionEmptyState
                  slotResults={activeSlotResults}
                  onOpenWaitlistHost={onOpenWaitlistHost}
                />
                <OfferSelectionDayList
                  slotResults={activeSlotResults}
                  dayGroups={dayGroups}
                  activeDayKey={activeDayKey}
                  expandedSlotId={expandedSlotId}
                  selectedSlotId={selectedSlot?.slotSummaryId ?? null}
                  compareSlotIds={compareSlotIds}
                  compareLimit={activeSelection.compareLimit}
                  canContinueSelected={canContinueSelected}
                  onSelectDay={handleSelectDay}
                  onToggleSlot={handleToggleSlot}
                  onSelectSlot={handleSelectSlot}
                  onContinueToConfirm={handleContinueToConfirm}
                  onToggleCompareSlot={handleToggleCompareSlot}
                  truthBySlotId={activeSelection.reservationTruthBySlotId}
                />
                <BookingSupportFallbackStub
                  projection={activeSlotResults}
                  supportActionLabel={supportActionLabel}
                  onSupportAction={onSupportAction}
                />
              </div>
            }
          />
          <RefineOptionsDrawer
            projection={slotResults}
            drawerOpen={drawerOpen}
            enabledFilters={enabledFilters}
            onClose={() => setDrawerOpen(false)}
            onToggleFilter={handleToggleFilter}
          />
          <SlotCompareDrawer
            open={compareOpen}
            slots={orderedCompareSlots}
            selectedSlotId={selectedSlot?.slotSummaryId ?? null}
            referenceNowAt={activeSelection.referenceNowAt}
            truthsBySlotId={activeSelection.reservationTruthBySlotId}
            onClose={handleCloseCompare}
            onSelectSlot={(slotId) => {
              handleSelectSlot(slotId);
              handleCloseCompare();
            }}
          />
        </>
      )}
      <div className="patient-booking__results-live" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </section>
  );
}
