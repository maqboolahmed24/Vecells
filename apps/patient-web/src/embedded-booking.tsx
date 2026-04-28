import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  embeddedBookingPath,
  isEmbeddedBookingPath,
  resolveEmbeddedBookingContext,
  type EmbeddedBookingContext,
  type EmbeddedBookingFixture,
  type EmbeddedBookingRouteKey,
} from "./embedded-booking.model";
import type { BookingSlotSummaryProjection } from "./patient-booking-slot-results.model";
import type { OfferSelectionReservationTruthProjection } from "./patient-booking-offer-selection.model";

export { isEmbeddedBookingPath };

function safeWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

function resolveInitial(): EmbeddedBookingContext {
  const ownerWindow = safeWindow();
  return resolveEmbeddedBookingContext({
    pathname: ownerWindow?.location.pathname ?? "/nhs-app/bookings/booking_case_391/offers",
    search: ownerWindow?.location.search ?? "",
  });
}

function formatDateTime(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truthAllowsLiveAction(truth: OfferSelectionReservationTruthProjection | null): boolean {
  return truth?.truthState === "truthful_nonexclusive" || truth?.truthState === "exclusive_held";
}

function useEmbeddedBookingController() {
  const [context, setContext] = useState<EmbeddedBookingContext>(() => resolveInitial());
  const [announcement, setAnnouncement] = useState(context.announcement);
  const [calendarResult, setCalendarResult] = useState<"idle" | "queued" | "blocked">("idle");

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    ownerWindow.document.body.dataset.theme = "light";
    ownerWindow.document.body.dataset.motion = ownerWindow.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "reduced"
      : "full";
  }, []);

  const replaceContext = useCallback(
    (routeKey: EmbeddedBookingRouteKey, fixture: EmbeddedBookingFixture = context.fixture, replace = false) => {
      const ownerWindow = safeWindow();
      const nextPath = embeddedBookingPath({ bookingCaseId: context.bookingCaseId, routeKey, fixture });
      if (ownerWindow) {
        if (replace) {
          ownerWindow.history.replaceState({ routeKey, bookingCaseId: context.bookingCaseId }, "", nextPath);
        } else {
          ownerWindow.history.pushState({ routeKey, bookingCaseId: context.bookingCaseId }, "", nextPath);
        }
      }
      const next = resolveEmbeddedBookingContext({
        pathname: nextPath.split("?")[0] ?? nextPath,
        search: nextPath.includes("?") ? `?${nextPath.split("?")[1]}` : "",
      });
      setContext(next);
      setAnnouncement(next.announcement);
      setCalendarResult("idle");
    },
    [context.bookingCaseId, context.fixture],
  );

  const runCalendarBridge = useCallback(() => {
    if (context.calendarBridgeAction.capability !== "available") {
      setCalendarResult("blocked");
      setAnnouncement(context.calendarBridgeAction.blockedReason ?? "Calendar handoff is not currently available.");
      return;
    }
    setCalendarResult("queued");
    setAnnouncement(
      `Calendar handoff queued through ${context.calendarBridgeAction.bridgeWrapperRef}, not from a leaf component.`,
    );
  }, [context.calendarBridgeAction]);

  const primaryAction = useCallback(() => {
    if (context.routeKey === "offers") {
      replaceContext(
        truthAllowsLiveAction(context.selectedTruth) ? "confirmation" : "recovery",
        truthAllowsLiveAction(context.selectedTruth) ? context.fixture : "recovery",
      );
      return;
    }
    if (context.routeKey === "alternatives") {
      replaceContext(
        context.currentState.actionability === "read_only" ? "recovery" : "confirmation",
        context.currentState.actionability === "read_only" ? "alternatives-drifted" : "confirmed",
      );
      return;
    }
    if (context.routeKey === "waitlist") {
      replaceContext(
        context.currentState.actionability === "read_only" ? "offers" : "confirmation",
        context.currentState.actionability === "read_only" ? "live" : "confirmed",
      );
      return;
    }
    if (context.routeKey === "confirmation") {
      replaceContext(
        context.confirmation.confirmationTruthState === "confirmed" ? "manage" : "confirmation",
        "confirmed",
      );
      return;
    }
    if (context.routeKey === "manage") {
      replaceContext("calendar", "calendar");
      return;
    }
    if (context.routeKey === "calendar") {
      runCalendarBridge();
      return;
    }
    replaceContext("offers", "live");
  }, [context, replaceContext, runCalendarBridge]);

  const secondaryAction = useCallback(() => {
    if (context.routeKey === "offers") {
      replaceContext("waitlist", "waitlist-offer");
      return;
    }
    replaceContext("offers", context.fixture === "exclusive-hold" ? "exclusive-hold" : "live");
  }, [context.fixture, context.routeKey, replaceContext]);

  return {
    context,
    announcement,
    calendarResult,
    navigate: replaceContext,
    primaryAction,
    secondaryAction,
    runCalendarBridge,
  };
}

function truthTone(truth: OfferSelectionReservationTruthProjection | null): string {
  if (!truth) return "quiet";
  if (truth.truthState === "exclusive_held" || truth.truthState === "confirmed") return "success";
  if (truth.truthState === "truthful_nonexclusive" || truth.truthState === "pending_confirmation") return "info";
  if (truth.truthState === "expired" || truth.truthState === "revalidation_required" || truth.truthState === "disputed")
    return "blocked";
  return "warning";
}

export function EmbeddedReservationTruthBadge({
  truth,
}: {
  readonly truth: OfferSelectionReservationTruthProjection | null;
}) {
  const holdUntil =
    truth?.truthState === "exclusive_held" && truth.countdownMode === "hold_expiry"
      ? formatDateTime(truth.exclusiveUntilAt)
      : null;
  return (
    <div
      className="embedded-booking__truth-badge"
      role="status"
      data-testid="EmbeddedReservationTruthBadge"
      data-reservation-truth={truth?.truthState ?? "none"}
      data-countdown-mode={truth?.countdownMode ?? "none"}
      data-tone={truthTone(truth)}
    >
      <span>Reservation truth</span>
      <strong>{truth?.truthState.replaceAll("_", " ") ?? "No selection"}</strong>
      <small>{holdUntil ? `Held until ${holdUntil}` : truth?.dominantCue ?? "Choose an appointment to continue."}</small>
    </div>
  );
}

export function EmbeddedSlotComparisonStrip({
  context,
}: {
  readonly context: EmbeddedBookingContext;
}) {
  const comparisonSlots = context.offerSelection.compareSlotIds
    .map((slotId) => context.slotResults.slots.find((slot) => slot.slotSummaryId === slotId))
    .filter(Boolean) as BookingSlotSummaryProjection[];
  return (
    <section
      className="embedded-booking__comparison-strip"
      aria-labelledby="embedded-booking-compare-title"
      data-testid="EmbeddedSlotComparisonStrip"
    >
      <h2 id="embedded-booking-compare-title">Comparison</h2>
      <div>
        {[context.selectedOffer, ...comparisonSlots].filter(Boolean).map((slot) => (
          <span key={slot!.slotSummaryId}>
            <strong>{slot!.startTimeLabel}</strong>
            <small>{slot!.siteLabel}</small>
          </span>
        ))}
      </div>
    </section>
  );
}

export function EmbeddedBookingOfferCard({
  slot,
  truth,
  selected,
  onChoose,
}: {
  readonly slot: BookingSlotSummaryProjection;
  readonly truth: OfferSelectionReservationTruthProjection;
  readonly selected: boolean;
  readonly onChoose: () => void;
}) {
  const live = truthAllowsLiveAction(truth);
  return (
    <article
      className="embedded-booking__offer-card"
      data-testid="EmbeddedBookingOfferCard"
      data-selected={selected ? "true" : "false"}
      data-reservation-truth={truth.truthState}
    >
      <div className="embedded-booking__offer-main">
        <div>
          <span className="embedded-booking__eyebrow">{slot.dayShortLabel}</span>
          <h3>{slot.startTimeLabel} to {slot.endTimeLabel}</h3>
          <p>{slot.siteLabel}</p>
        </div>
        <EmbeddedReservationTruthBadge truth={truth} />
      </div>
      <dl className="embedded-booking__meta-grid">
        <div>
          <dt>Type</dt>
          <dd>{slot.modalityLabel}</dd>
        </div>
        <div>
          <dt>Clinician</dt>
          <dd>{slot.clinicianLabel}</dd>
        </div>
        <div>
          <dt>Travel</dt>
          <dd>{slot.travelCue ?? "Travel not needed"}</dd>
        </div>
      </dl>
      <button type="button" onClick={onChoose} disabled={!live}>
        {selected ? "Review selected time" : live ? "Review this time" : "Unavailable"}
      </button>
    </article>
  );
}

export function EmbeddedBookingOfferRail({
  context,
  onChoose,
}: {
  readonly context: EmbeddedBookingContext;
  readonly onChoose: () => void;
}) {
  const visibleSlots = [
    context.selectedOffer,
    ...context.slotResults.slots.filter((slot) => slot.slotSummaryId !== context.selectedOffer?.slotSummaryId),
  ]
    .filter(Boolean)
    .slice(0, 4) as BookingSlotSummaryProjection[];
  return (
    <section
      className="embedded-booking__offer-rail"
      aria-labelledby="embedded-booking-offers-title"
      data-testid="EmbeddedBookingOfferRail"
    >
      <div className="embedded-booking__section-heading">
        <span className="embedded-booking__eyebrow">Available appointments</span>
        <h2 id="embedded-booking-offers-title">{context.slotResults.resultCountLabel}</h2>
      </div>
      <div role="list" className="embedded-booking__offer-list">
        {visibleSlots.map((slot) => (
          <div role="listitem" key={slot.slotSummaryId}>
            <EmbeddedBookingOfferCard
              slot={slot}
              truth={context.offerSelection.reservationTruthBySlotId[slot.slotSummaryId]!}
              selected={context.offerSelection.selectedSlotId === slot.slotSummaryId}
              onChoose={onChoose}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function EmbeddedAlternativeOfferStack({
  context,
  onChoose,
}: {
  readonly context: EmbeddedBookingContext;
  readonly onChoose: () => void;
}) {
  const readOnly = context.alternatives.truthProjection.offerActionabilityState !== "live_open_choice";
  return (
    <section
      className="embedded-booking__panel"
      aria-labelledby="embedded-alternative-title"
      data-testid="EmbeddedAlternativeOfferStack"
      data-actionability={context.alternatives.truthProjection.offerActionabilityState}
    >
      <div className="embedded-booking__section-heading">
        <span className="embedded-booking__eyebrow">Alternative offers</span>
        <h2 id="embedded-alternative-title">{readOnly ? "Previous alternatives kept as context" : "Network alternatives"}</h2>
      </div>
      <p>{context.alternatives.expiryStrip.body}</p>
      <div role="list" className="embedded-booking__alternative-list">
        {context.alternatives.offerCards.slice(0, 3).map((offer) => (
          <article
            role="listitem"
            key={offer.alternativeOfferEntryId}
            className="embedded-booking__alternative-card"
            data-selection-state={offer.selectionState}
          >
            <div>
              <strong>{offer.patientFacingLabel}</strong>
              <span>{offer.siteLabel}</span>
            </div>
            <p>{offer.recommendationSummary}</p>
            <small>{offer.travelLabel} · {offer.accessibilityLabel}</small>
          </article>
        ))}
      </div>
      {context.alternatives.provenanceStub ? (
        <aside className="embedded-booking__provenance" aria-label="Alternative offer provenance">
          <strong>{context.alternatives.provenanceStub.heading}</strong>
          <p>{context.alternatives.provenanceStub.body}</p>
        </aside>
      ) : null}
      <button type="button" onClick={onChoose} disabled={readOnly}>
        {readOnly ? "Read-only context" : "Continue with alternative"}
      </button>
    </section>
  );
}

export function EmbeddedWaitlistOfferCard({
  context,
  onAccept,
}: {
  readonly context: EmbeddedBookingContext;
  readonly onAccept: () => void;
}) {
  const live = context.waitlist.continuationTruth.patientVisibleState === "offer_available" &&
    context.waitlist.offerExpiryMode !== "expired" &&
    context.waitlist.offerExpiryMode !== "superseded";
  return (
    <section
      className="embedded-booking__panel"
      aria-labelledby="embedded-waitlist-title"
      data-testid="EmbeddedWaitlistOfferCard"
      data-waitlist-state={context.waitlist.continuationTruth.patientVisibleState}
      data-offer-expiry-mode={context.waitlist.offerExpiryMode}
    >
      <div className="embedded-booking__section-heading">
        <span className="embedded-booking__eyebrow">Waitlist</span>
        <h2 id="embedded-waitlist-title">{context.waitlist.stateHeading}</h2>
      </div>
      <p>{context.waitlist.stateBody}</p>
      {context.waitlist.activeOffer && context.waitlist.activeReservationTruth ? (
        <div className="embedded-booking__waitlist-offer">
          <div>
            <strong>{context.waitlist.activeOffer.dayShortLabel} at {context.waitlist.activeOffer.startTimeLabel}</strong>
            <span>{context.waitlist.activeOffer.siteLabel}</span>
          </div>
          <EmbeddedReservationTruthBadge truth={context.waitlist.activeReservationTruth} />
        </div>
      ) : null}
      <dl className="embedded-booking__compact-list">
        {context.waitlist.statusRows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <button type="button" onClick={onAccept} disabled={!live}>
        {live ? context.waitlist.primaryAction?.label ?? "Accept waitlist offer" : "No live waitlist action"}
      </button>
    </section>
  );
}

export function EmbeddedBookingConfirmationFrame({
  context,
}: {
  readonly context: EmbeddedBookingContext;
}) {
  return (
    <section
      className="embedded-booking__panel embedded-booking__confirmation"
      aria-labelledby="embedded-confirmation-title"
      data-testid="EmbeddedBookingConfirmationFrame"
      data-confirmation-truth={context.confirmation.confirmationTruthState}
    >
      <div className="embedded-booking__section-heading">
        <span className="embedded-booking__eyebrow">Confirmation</span>
        <h2 id="embedded-confirmation-title">{context.confirmation.ribbonLabel}</h2>
      </div>
      <p>{context.confirmation.ribbonDetail}</p>
      <div className="embedded-booking__confirmed-slot">
        <strong>{context.confirmationSlot.dayLongLabel}, {context.confirmationSlot.startTimeLabel}</strong>
        <span>{context.confirmationSlot.siteLabel}</span>
      </div>
      <dl className="embedded-booking__compact-list">
        {context.confirmation.stateRows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function EmbeddedReminderPanel({ context }: { readonly context: EmbeddedBookingContext }) {
  return (
    <section
      className="embedded-booking__panel embedded-booking__reminder"
      aria-labelledby="embedded-reminder-title"
      data-testid="EmbeddedReminderPanel"
      data-reminder-exposure={context.manage.reminderExposureState}
    >
      <div className="embedded-booking__section-heading">
        <span className="embedded-booking__eyebrow">Reminders</span>
        <h2 id="embedded-reminder-title">{context.manage.reminderPanel.heading}</h2>
      </div>
      <p>{context.manage.reminderPanel.body}</p>
      <dl className="embedded-booking__compact-list">
        {context.manage.reminderPanel.preferenceRows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function EmbeddedCalendarActionCard({
  context,
  calendarResult,
  onCalendar,
}: {
  readonly context: EmbeddedBookingContext;
  readonly calendarResult: "idle" | "queued" | "blocked";
  readonly onCalendar: () => void;
}) {
  const available = context.calendarBridgeAction.capability === "available";
  return (
    <section
      className="embedded-booking__panel embedded-booking__calendar"
      aria-labelledby="embedded-calendar-title"
      data-testid="EmbeddedCalendarActionCard"
      data-calendar-capability={context.calendarBridgeAction.capability}
      data-bridge-wrapper={context.calendarBridgeAction.bridgeWrapperRef}
      data-bridge-wrapper-contract="EmbeddedBookingCalendarBridgeWrapper"
    >
      <div className="embedded-booking__section-heading">
        <span className="embedded-booking__eyebrow">Calendar</span>
        <h2 id="embedded-calendar-title">Add appointment to calendar</h2>
      </div>
      <p>
        Calendar handoff is centralized through {context.calendarBridgeAction.bridgeWrapperRef} and only opens after
        confirmation truth is confirmed.
      </p>
      <dl className="embedded-booking__compact-list">
        <div>
          <dt>Bridge action</dt>
          <dd>{context.calendarBridgeAction.actionRef}</dd>
        </div>
        <div>
          <dt>Subject</dt>
          <dd>{context.calendarBridgeAction.subject}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{context.calendarBridgeAction.location}</dd>
        </div>
      </dl>
      {calendarResult !== "idle" ? (
        <p role="status" className="embedded-booking__calendar-result">
          {calendarResult === "queued" ? "Calendar handoff queued through the bridge wrapper." : context.calendarBridgeAction.blockedReason}
        </p>
      ) : null}
      <button type="button" onClick={onCalendar} disabled={!available}>
        {available ? "Add to calendar" : "Calendar unavailable"}
      </button>
    </section>
  );
}

export function EmbeddedManageAppointmentWorkspace({
  context,
  onCalendar,
}: {
  readonly context: EmbeddedBookingContext;
  readonly onCalendar: () => void;
}) {
  return (
    <section
      className="embedded-booking__panel embedded-booking__manage"
      aria-labelledby="embedded-manage-title"
      data-testid="EmbeddedManageAppointmentWorkspace"
      data-manage-exposure={context.manage.manageExposureState}
      data-continuity-state={context.manage.continuityState}
    >
      <div className="embedded-booking__section-heading">
        <span className="embedded-booking__eyebrow">Manage appointment</span>
        <h2 id="embedded-manage-title">{context.manage.appointmentHeading}</h2>
      </div>
      <p>{context.manage.supportNote}</p>
      <dl className="embedded-booking__compact-list">
        {context.manage.appointmentRows.slice(0, 4).map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="embedded-booking__manage-actions" aria-label="Manage action cluster">
        {context.manage.actionDeck.slice(0, 2).map((action) => (
          <button key={action.actionRef} type="button" disabled={context.manage.manageExposureState !== "writable"}>
            {action.label}
          </button>
        ))}
        <button type="button" onClick={onCalendar} disabled={context.calendarBridgeAction.capability !== "available"}>
          Add to calendar
        </button>
      </div>
    </section>
  );
}

export function EmbeddedBookingRecoveryBanner({ context }: { readonly context: EmbeddedBookingContext }) {
  if (!context.recoveryBanner.visible) return null;
  return (
    <section
      className="embedded-booking__recovery"
      aria-labelledby="embedded-booking-recovery-title"
      data-testid="EmbeddedBookingRecoveryBanner"
      data-continuity-state={context.continuityEvidence.sameShellState}
    >
      <div>
        <span className="embedded-booking__eyebrow">Recovery</span>
        <h2 id="embedded-booking-recovery-title">{context.recoveryBanner.title}</h2>
        <p>{context.recoveryBanner.body}</p>
      </div>
    </section>
  );
}

function EmbeddedBookingSummary({ context }: { readonly context: EmbeddedBookingContext }) {
  return (
    <section
      className="embedded-booking__summary"
      aria-labelledby="embedded-booking-summary-title"
      data-testid="EmbeddedBookingHeaderSummary"
    >
      <div className="embedded-booking__summary-top">
        <div>
          <span className="embedded-booking__eyebrow">Booking summary</span>
          <h1 id="embedded-booking-summary-title">{context.currentState.title}</h1>
        </div>
        <span className="embedded-booking__state-chip" data-tone={context.currentState.tone}>
          {context.currentState.stateLabel}
        </span>
      </div>
      <p>{context.currentState.body}</p>
      <dl className="embedded-booking__summary-facts">
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

function EmbeddedBookingAnchorPreserver({ context }: { readonly context: EmbeddedBookingContext }) {
  return (
    <aside
      className="embedded-booking__anchor"
      aria-label="Booking continuity"
      data-testid="EmbeddedBookingAnchorPreserver"
      data-selected-anchor={context.continuityEvidence.selectedAnchorRef}
      data-shell-continuity-key={context.continuityEvidence.shellContinuityKey}
    >
      <span className="embedded-booking__eyebrow">Same shell</span>
      <strong>{context.continuityEvidence.selectedAnchorRef}</strong>
      <p>{context.continuityEvidence.selectedOfferProvenanceRef}</p>
    </aside>
  );
}

function EmbeddedBookingActionReserve({
  context,
  onPrimary,
  onSecondary,
}: {
  readonly context: EmbeddedBookingContext;
  readonly onPrimary: () => void;
  readonly onSecondary: () => void;
}) {
  const disabled =
    context.currentState.actionability === "frozen" ||
    (context.currentState.actionability === "read_only" && context.routeKey !== "waitlist");
  return (
    <aside
      className="embedded-booking__action-reserve"
      aria-label="Booking actions"
      data-testid="EmbeddedBookingActionReserve"
      data-actionability={context.currentState.actionability}
    >
      <button type="button" className="embedded-booking__primary-action" onClick={onPrimary} disabled={disabled}>
        {context.primaryActionLabel}
      </button>
      {context.secondaryActionLabel ? (
        <button type="button" className="embedded-booking__secondary-action" onClick={onSecondary}>
          {context.secondaryActionLabel}
        </button>
      ) : null}
    </aside>
  );
}

function EmbeddedBookingRouteBody({
  controller,
}: {
  readonly controller: ReturnType<typeof useEmbeddedBookingController>;
}) {
  const { context } = controller;
  if (context.routeKey === "alternatives") {
    return <EmbeddedAlternativeOfferStack context={context} onChoose={controller.primaryAction} />;
  }
  if (context.routeKey === "waitlist") {
    return <EmbeddedWaitlistOfferCard context={context} onAccept={controller.primaryAction} />;
  }
  if (context.routeKey === "manage") {
    return (
      <>
        <EmbeddedManageAppointmentWorkspace context={context} onCalendar={() => controller.navigate("calendar", "calendar")} />
        <EmbeddedReminderPanel context={context} />
      </>
    );
  }
  if (context.routeKey === "confirmation") {
    return (
      <>
        <EmbeddedBookingConfirmationFrame context={context} />
        <EmbeddedReminderPanel context={context} />
      </>
    );
  }
  if (context.routeKey === "calendar") {
    return (
      <>
        <EmbeddedBookingConfirmationFrame context={context} />
        <EmbeddedCalendarActionCard
          context={context}
          calendarResult={controller.calendarResult}
          onCalendar={controller.runCalendarBridge}
        />
      </>
    );
  }
  if (context.routeKey === "recovery") {
    return (
      <>
        <EmbeddedAlternativeOfferStack context={context} onChoose={controller.primaryAction} />
        <EmbeddedWaitlistOfferCard context={context} onAccept={controller.primaryAction} />
      </>
    );
  }
  return (
    <>
      <EmbeddedSlotComparisonStrip context={context} />
      <EmbeddedBookingOfferRail context={context} onChoose={controller.primaryAction} />
      <EmbeddedAlternativeOfferStack context={context} onChoose={() => controller.navigate("alternatives", "alternatives")} />
      <EmbeddedWaitlistOfferCard context={context} onAccept={() => controller.navigate("waitlist", "waitlist-offer")} />
    </>
  );
}

export function EmbeddedBookingFrame({
  context,
  children,
}: {
  readonly context: EmbeddedBookingContext;
  readonly children: ReactNode;
}) {
  return (
    <main
      className="token-foundation embedded-booking"
      data-testid="EmbeddedBookingFrame"
      data-task-id={context.taskId}
      data-visual-mode={context.visualMode}
      data-route-key={context.routeKey}
      data-booking-case-id={context.bookingCaseId}
      data-selected-anchor={context.continuityEvidence.selectedAnchorRef}
      data-continuity-state={context.continuityEvidence.sameShellState}
    >
      {children}
    </main>
  );
}

export function EmbeddedBookingApp() {
  const controller = useEmbeddedBookingController();
  const { context } = controller;
  return (
    <EmbeddedBookingFrame context={context}>
      <div className="embedded-booking__shell">
        <header className="embedded-booking__masthead" role="banner" data-testid="EmbeddedBookingMasthead">
          <div>
            <span className="embedded-booking__eyebrow">NHS App booking</span>
            <h1>Appointments</h1>
            <p>{context.confirmationSlot.clinicianTypeLabel}</p>
          </div>
          <nav aria-label="Booking views" className="embedded-booking__tabs">
            {(["offers", "alternatives", "waitlist", "manage", "calendar"] as const).map((routeKey) => (
              <button
                key={routeKey}
                type="button"
                aria-current={context.routeKey === routeKey ? "page" : undefined}
                data-active={context.routeKey === routeKey ? "true" : "false"}
                onClick={() =>
                  controller.navigate(
                    routeKey,
                    routeKey === "manage" ? "manage" : routeKey === "calendar" ? "calendar" : context.fixture,
                  )
                }
              >
                {routeKey}
              </button>
            ))}
          </nav>
        </header>
        <EmbeddedBookingSummary context={context} />
        <EmbeddedBookingRecoveryBanner context={context} />
        <EmbeddedBookingAnchorPreserver context={context} />
        <EmbeddedBookingRouteBody controller={controller} />
      </div>
      <EmbeddedBookingActionReserve
        context={context}
        onPrimary={controller.primaryAction}
        onSecondary={controller.secondaryAction}
      />
      <div className="embedded-booking__live" aria-live="polite" data-testid="EmbeddedBookingLiveRegion">
        {controller.announcement}
      </div>
    </EmbeddedBookingFrame>
  );
}

export default EmbeddedBookingApp;
