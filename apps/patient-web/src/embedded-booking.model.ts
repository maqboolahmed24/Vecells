import {
  resolveBookingSlotResultsProjectionByScenarioId,
  type BookingSlotResultsProjection,
  type BookingSlotSummaryProjection,
} from "./patient-booking-slot-results.model";
import {
  resolveOfferSelectionProjectionByScenarioId,
  resolveOfferSelectionSlot,
  type OfferSelectionProjection,
  type OfferSelectionReservationTruthProjection,
} from "./patient-booking-offer-selection.model";
import {
  resolveBookingConfirmationProjectionForScenarioId,
  resolveBookingConfirmationSlot,
  type BookingConfirmationProjection,
} from "./patient-booking-confirmation.model";
import {
  resolvePatientAppointmentManageProjectionByScenarioId,
  type PatientAppointmentManageProjection,
} from "./patient-appointment-manage.model";
import {
  resolvePatientNetworkAlternativeChoiceProjectionByScenarioId,
  type PatientNetworkAlternativeChoiceProjection,
} from "./patient-network-alternative-choice.model";
import {
  resolvePatientWaitlistViewProjectionByScenarioId,
  type PatientWaitlistViewProjection,
} from "./patient-waitlist-views.model";

export const EMBEDDED_BOOKING_TASK_ID = "par_391";
export const EMBEDDED_BOOKING_VISUAL_MODE = "NHSApp_Embedded_Booking";
export const EMBEDDED_BOOKING_CONTRACT_REF =
  "EmbeddedBookingContract:391:phase4-phase5-booking-waitlist-manage-calendar";
export const EMBEDDED_BOOKING_SHELL_CONTINUITY_KEY =
  "patient.portal.bookings.embedded.booking-family";

export type EmbeddedBookingRouteKey =
  | "offers"
  | "alternatives"
  | "waitlist"
  | "manage"
  | "confirmation"
  | "calendar"
  | "recovery";

export type EmbeddedBookingFixture =
  | "live"
  | "exclusive-hold"
  | "stale"
  | "waitlist"
  | "waitlist-offer"
  | "waitlist-expired"
  | "alternatives"
  | "alternatives-drifted"
  | "confirmed"
  | "manage"
  | "calendar"
  | "recovery";

export type EmbeddedBookingActionability =
  | "live"
  | "secondary"
  | "confirmation_only"
  | "bridge_gated"
  | "read_only"
  | "frozen"
  | "recovery_required";

export type EmbeddedBookingCalendarCapability = "available" | "not_confirmed" | "bridge_unavailable" | "drifted";

export interface EmbeddedBookingSummaryRow {
  readonly label: string;
  readonly value: string;
}

export interface EmbeddedBookingCalendarBridgeAction {
  readonly actionRef: "nhsapp.storage.addEventToCalendar";
  readonly bridgeWrapperRef: "EmbeddedBookingCalendarBridgeWrapper";
  readonly capability: EmbeddedBookingCalendarCapability;
  readonly subject: string;
  readonly body: string;
  readonly location: string;
  readonly startTimeEpochInSeconds: number;
  readonly endTimeEpochInSeconds: number;
  readonly blockedReason: string | null;
}

export interface EmbeddedBookingCurrentState {
  readonly title: string;
  readonly body: string;
  readonly stateLabel: string;
  readonly nextActionLabel: string;
  readonly actionability: EmbeddedBookingActionability;
  readonly tone: "info" | "success" | "warning" | "blocked";
  readonly liveRegionMessage: string;
}

export interface EmbeddedBookingContinuityEvidence {
  readonly evidenceRef: string;
  readonly bookingCaseId: string;
  readonly selectedAnchorRef: string;
  readonly selectedAnchorLabel: string;
  readonly selectedOfferProvenanceRef: string;
  readonly shellContinuityKey: typeof EMBEDDED_BOOKING_SHELL_CONTINUITY_KEY;
  readonly sameShellState: "preserved" | "read_only" | "recovery_required";
  readonly sourceProjectionRefs: readonly string[];
}

export interface EmbeddedBookingContext {
  readonly taskId: typeof EMBEDDED_BOOKING_TASK_ID;
  readonly visualMode: typeof EMBEDDED_BOOKING_VISUAL_MODE;
  readonly contractRef: typeof EMBEDDED_BOOKING_CONTRACT_REF;
  readonly routeKey: EmbeddedBookingRouteKey;
  readonly bookingCaseId: string;
  readonly fixture: EmbeddedBookingFixture;
  readonly embeddedPath: string;
  readonly canonicalPath: string;
  readonly slotResults: BookingSlotResultsProjection;
  readonly offerSelection: OfferSelectionProjection;
  readonly selectedOffer: BookingSlotSummaryProjection | null;
  readonly selectedTruth: OfferSelectionReservationTruthProjection | null;
  readonly confirmation: BookingConfirmationProjection;
  readonly confirmationSlot: BookingSlotSummaryProjection;
  readonly waitlist: PatientWaitlistViewProjection;
  readonly manage: PatientAppointmentManageProjection;
  readonly alternatives: PatientNetworkAlternativeChoiceProjection;
  readonly currentState: EmbeddedBookingCurrentState;
  readonly continuityEvidence: EmbeddedBookingContinuityEvidence;
  readonly calendarBridgeAction: EmbeddedBookingCalendarBridgeAction;
  readonly summaryRows: readonly EmbeddedBookingSummaryRow[];
  readonly recoveryBanner: {
    readonly visible: boolean;
    readonly title: string;
    readonly body: string;
    readonly actionLabel: string;
  };
  readonly primaryActionLabel: string;
  readonly secondaryActionLabel: string | null;
  readonly announcement: string;
}

function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim() || "/nhs-app/bookings/booking_case_391/offers";
  return trimmed === "/" ? "/nhs-app/bookings/booking_case_391/offers" : trimmed.replace(/\/+$/, "");
}

export function isEmbeddedBookingPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return (
    /^\/nhs-app\/bookings\/[^/]+(?:\/(?:offers|alternatives|waitlist|manage|confirmation|calendar|recovery))?$/.test(
      normalized,
    ) ||
    /^\/embedded-booking(?:\/[^/]+)?(?:\/(?:offers|alternatives|waitlist|manage|confirmation|calendar|recovery))?$/.test(
      normalized,
    )
  );
}

function routeKeyFromSegment(segment: string | null): EmbeddedBookingRouteKey {
  switch (segment) {
    case "alternatives":
      return "alternatives";
    case "waitlist":
      return "waitlist";
    case "manage":
      return "manage";
    case "confirmation":
      return "confirmation";
    case "calendar":
      return "calendar";
    case "recovery":
      return "recovery";
    case "offers":
    default:
      return "offers";
  }
}

function normalizeFixture(fixture: string | null, routeKey: EmbeddedBookingRouteKey): EmbeddedBookingFixture {
  if (
    fixture === "live" ||
    fixture === "exclusive-hold" ||
    fixture === "stale" ||
    fixture === "waitlist" ||
    fixture === "waitlist-offer" ||
    fixture === "waitlist-expired" ||
    fixture === "alternatives" ||
    fixture === "alternatives-drifted" ||
    fixture === "confirmed" ||
    fixture === "manage" ||
    fixture === "calendar" ||
    fixture === "recovery"
  ) {
    return fixture;
  }
  if (routeKey === "alternatives") return "alternatives";
  if (routeKey === "waitlist") return "waitlist-offer";
  if (routeKey === "manage") return "manage";
  if (routeKey === "confirmation") return "confirmed";
  if (routeKey === "calendar") return "calendar";
  if (routeKey === "recovery") return "recovery";
  return "live";
}

export function parseEmbeddedBookingLocation(input: {
  readonly pathname: string;
  readonly search?: string;
}): {
  readonly bookingCaseId: string;
  readonly routeKey: EmbeddedBookingRouteKey;
  readonly fixture: EmbeddedBookingFixture;
} {
  const normalized = normalizePathname(input.pathname);
  const params = new URLSearchParams(input.search ?? "");
  const parts = normalized.split("/").filter(Boolean);
  let bookingCaseId = params.get("booking") ?? "booking_case_391";
  let segment: string | null = params.get("view");

  const bookingsIndex = parts.indexOf("bookings");
  if (bookingsIndex >= 0) {
    bookingCaseId = parts[bookingsIndex + 1] ?? bookingCaseId;
    segment = parts[bookingsIndex + 2] ?? segment ?? "offers";
  }

  const embeddedIndex = parts.indexOf("embedded-booking");
  if (embeddedIndex >= 0) {
    bookingCaseId = parts[embeddedIndex + 1] ?? bookingCaseId;
    segment = parts[embeddedIndex + 2] ?? segment ?? "offers";
  }

  const routeKey = routeKeyFromSegment(segment);
  return {
    bookingCaseId,
    routeKey,
    fixture: normalizeFixture(params.get("fixture"), routeKey),
  };
}

export function embeddedBookingPath(input: {
  readonly bookingCaseId: string;
  readonly routeKey: EmbeddedBookingRouteKey;
  readonly fixture?: EmbeddedBookingFixture | null;
}): string {
  const params = new URLSearchParams();
  if (input.fixture) params.set("fixture", input.fixture);
  return `/nhs-app/bookings/${input.bookingCaseId}/${input.routeKey}${params.size > 0 ? `?${params.toString()}` : ""}`;
}

function canonicalPathFor(input: {
  readonly bookingCaseId: string;
  readonly routeKey: EmbeddedBookingRouteKey;
}): string {
  if (input.routeKey === "confirmation") return `/bookings/${input.bookingCaseId}/confirm`;
  return `/bookings/${input.bookingCaseId}/${input.routeKey === "offers" ? "select" : input.routeKey}`;
}

function requireProjection<T>(projection: T | null, message: string): T {
  if (!projection) throw new Error(message);
  return projection;
}

function offerScenarioFor(fixture: EmbeddedBookingFixture): string {
  if (fixture === "exclusive-hold") return "booking_case_295_exclusive_hold";
  if (fixture === "stale" || fixture === "recovery" || fixture === "alternatives-drifted") return "booking_case_295_stale";
  return "booking_case_295_nonexclusive";
}

function confirmationScenarioFor(fixture: EmbeddedBookingFixture): string {
  if (fixture === "exclusive-hold") return "booking_case_296_review_held";
  if (fixture === "confirmed" || fixture === "manage" || fixture === "calendar") return "booking_case_296_confirmed";
  if (fixture === "recovery" || fixture === "stale" || fixture === "alternatives-drifted")
    return "booking_case_296_route_drift";
  return "booking_case_296_review";
}

function waitlistScenarioFor(fixture: EmbeddedBookingFixture): string {
  if (fixture === "waitlist-expired") return "booking_case_298_offer_expired";
  if (fixture === "waitlist-offer" || fixture === "waitlist") return "booking_case_298_offer_held";
  return "booking_case_298_waiting";
}

function manageScenarioFor(fixture: EmbeddedBookingFixture): string {
  if (fixture === "recovery" || fixture === "stale" || fixture === "alternatives-drifted")
    return "booking_case_297_stale";
  if (fixture === "calendar" || fixture === "confirmed" || fixture === "manage") return "booking_case_297_ready";
  return "booking_case_297_confirmation_pending";
}

function alternativeScenarioFor(fixture: EmbeddedBookingFixture): string {
  if (fixture === "alternatives-drifted" || fixture === "recovery") return "offer_session_328_publication_drift";
  if (fixture === "alternatives") return "offer_session_328_live";
  return "offer_session_328_regenerated";
}

function selectedTruthFor(
  offerSelection: OfferSelectionProjection,
): OfferSelectionReservationTruthProjection | null {
  return offerSelection.selectedSlotId
    ? offerSelection.reservationTruthBySlotId[offerSelection.selectedSlotId] ?? null
    : null;
}

function truthIsLive(truth: OfferSelectionReservationTruthProjection | null): boolean {
  return truth?.truthState === "truthful_nonexclusive" || truth?.truthState === "exclusive_held";
}

function currentStateFor(input: {
  readonly routeKey: EmbeddedBookingRouteKey;
  readonly fixture: EmbeddedBookingFixture;
  readonly offerSelection: OfferSelectionProjection;
  readonly selectedTruth: OfferSelectionReservationTruthProjection | null;
  readonly confirmation: BookingConfirmationProjection;
  readonly waitlist: PatientWaitlistViewProjection;
  readonly manage: PatientAppointmentManageProjection;
  readonly alternatives: PatientNetworkAlternativeChoiceProjection;
}): EmbeddedBookingCurrentState {
  const frozen =
    input.fixture === "stale" ||
    input.fixture === "recovery" ||
    input.fixture === "alternatives-drifted" ||
    input.selectedTruth?.truthState === "revalidation_required";
  if (input.routeKey === "alternatives") {
    const blocked = input.alternatives.truthProjection.offerActionabilityState !== "live_open_choice";
    return {
      title: blocked ? "Alternative offers changed" : input.alternatives.heroTitle,
      body: blocked
        ? input.alternatives.provenanceStub?.body ??
          "The previous alternative-offer set stays visible as read-only provenance while the current set is checked."
        : input.alternatives.heroBody,
      stateLabel: input.alternatives.session.openChoiceState.replaceAll("_", " "),
      nextActionLabel: blocked ? "Review preserved offer set" : "Choose an alternative",
      actionability: blocked ? "read_only" : "secondary",
      tone: blocked ? "blocked" : "info",
      liveRegionMessage: `Alternative offer state is ${input.alternatives.session.openChoiceState.replaceAll("_", " ")}.`,
    };
  }
  if (input.routeKey === "waitlist") {
    const liveOffer = input.waitlist.continuationTruth.patientVisibleState === "offer_available";
    const stale = input.waitlist.offerExpiryMode === "expired" || input.waitlist.offerExpiryMode === "superseded";
    return {
      title: input.waitlist.stateHeading,
      body: input.waitlist.stateBody,
      stateLabel: input.waitlist.continuationTruth.patientVisibleState.replaceAll("_", " "),
      nextActionLabel: stale
        ? "Keep waitlist active"
        : liveOffer
          ? input.waitlist.primaryAction?.label ?? "Accept waitlist offer"
          : "Review waitlist status",
      actionability: stale ? "read_only" : liveOffer ? "live" : "secondary",
      tone: stale ? "warning" : liveOffer ? "success" : "info",
      liveRegionMessage: input.waitlist.liveAnnouncement,
    };
  }
  if (input.routeKey === "manage") {
    const live = input.manage.manageExposureState === "writable" && input.manage.continuityState === "trusted";
    return {
      title: input.manage.stateHeading,
      body: input.manage.stateBody,
      stateLabel: input.manage.manageExposureState.replaceAll("_", " "),
      nextActionLabel: live ? "Manage appointment" : "Review appointment summary",
      actionability: live ? "secondary" : "read_only",
      tone: live ? "success" : "warning",
      liveRegionMessage: input.manage.liveAnnouncement,
    };
  }
  if (input.routeKey === "confirmation" || input.routeKey === "calendar") {
    const confirmed = input.confirmation.confirmationTruthState === "confirmed";
    return {
      title: input.confirmation.stateHeading,
      body: input.confirmation.stateBody,
      stateLabel: input.confirmation.confirmationTruthState.replaceAll("_", " "),
      nextActionLabel:
        input.routeKey === "calendar"
          ? confirmed
            ? "Add to calendar"
            : "Calendar unavailable"
          : confirmed
            ? "View manage options"
            : input.confirmation.primaryAction?.label ?? "Continue",
      actionability: input.routeKey === "calendar" ? (confirmed ? "bridge_gated" : "read_only") : confirmed ? "secondary" : "live",
      tone: confirmed ? "success" : "warning",
      liveRegionMessage: input.confirmation.liveAnnouncement,
    };
  }
  if (frozen) {
    return {
      title: "Availability needs a fresh check",
      body:
        input.selectedTruth?.dominantCue ??
        "The selected appointment is preserved as context, but live booking controls are paused until reservation truth is current.",
      stateLabel: input.selectedTruth?.truthState.replaceAll("_", " ") ?? "recovery required",
      nextActionLabel: "Refresh availability",
      actionability: "recovery_required",
      tone: "blocked",
      liveRegionMessage: "Booking controls are paused because reservation truth changed.",
    };
  }
  return {
    title: "Choose an appointment",
    body: input.offerSelection.selectionNarrative,
    stateLabel: input.selectedTruth?.truthState.replaceAll("_", " ") ?? "no slot selected",
    nextActionLabel: truthIsLive(input.selectedTruth) ? "Review this appointment" : "Choose a time",
    actionability: truthIsLive(input.selectedTruth) ? "live" : "secondary",
    tone: input.selectedTruth?.truthState === "exclusive_held" ? "success" : "info",
    liveRegionMessage: `Booking selection state is ${input.selectedTruth?.truthState.replaceAll("_", " ") ?? "not selected"}.`,
  };
}

function calendarActionFor(input: {
  readonly confirmation: BookingConfirmationProjection;
  readonly slot: BookingSlotSummaryProjection;
  readonly fixture: EmbeddedBookingFixture;
}): EmbeddedBookingCalendarBridgeAction {
  const confirmed = input.confirmation.confirmationTruthState === "confirmed";
  const start = Date.UTC(2026, 3, 22, 10, 20, 0) / 1000;
  return {
    actionRef: "nhsapp.storage.addEventToCalendar",
    bridgeWrapperRef: "EmbeddedBookingCalendarBridgeWrapper",
    capability:
      input.fixture === "recovery"
        ? "drifted"
        : confirmed
          ? "available"
          : "not_confirmed",
    subject: input.confirmation.stateHeading,
    body: `Booked through the governed embedded booking route. Reference ${input.confirmation.providerReference ?? "pending"}.`,
    location: input.slot.siteLabel,
    startTimeEpochInSeconds: start,
    endTimeEpochInSeconds: start + 20 * 60,
    blockedReason: confirmed ? null : "Calendar handoff opens only after authoritative confirmation truth is confirmed.",
  };
}

function summaryRowsFor(input: {
  readonly selectedOffer: BookingSlotSummaryProjection | null;
  readonly selectedTruth: OfferSelectionReservationTruthProjection | null;
  readonly confirmation: BookingConfirmationProjection;
  readonly waitlist: PatientWaitlistViewProjection;
  readonly manage: PatientAppointmentManageProjection;
}): readonly EmbeddedBookingSummaryRow[] {
  const slotLabel = input.selectedOffer
    ? `${input.selectedOffer.dayLongLabel}, ${input.selectedOffer.startTimeLabel} to ${input.selectedOffer.endTimeLabel}`
    : "No selected slot";
  return [
    { label: "Selected offer", value: slotLabel },
    { label: "Reservation truth", value: input.selectedTruth?.truthState.replaceAll("_", " ") ?? "none" },
    { label: "Confirmation truth", value: input.confirmation.confirmationTruthState.replaceAll("_", " ") },
    { label: "Waitlist posture", value: input.waitlist.continuationTruth.patientVisibleState.replaceAll("_", " ") },
    { label: "Manage posture", value: input.manage.manageExposureState.replaceAll("_", " ") },
  ];
}

function continuityFor(input: {
  readonly bookingCaseId: string;
  readonly currentState: EmbeddedBookingCurrentState;
  readonly selectedOffer: BookingSlotSummaryProjection | null;
  readonly selectedTruth: OfferSelectionReservationTruthProjection | null;
  readonly confirmation: BookingConfirmationProjection;
  readonly waitlist: PatientWaitlistViewProjection;
  readonly manage: PatientAppointmentManageProjection;
  readonly alternatives: PatientNetworkAlternativeChoiceProjection;
}): EmbeddedBookingContinuityEvidence {
  const sameShellState =
    input.currentState.actionability === "recovery_required"
      ? "recovery_required"
      : input.currentState.actionability === "read_only" || input.currentState.actionability === "frozen"
        ? "read_only"
        : "preserved";
  return {
    evidenceRef: "experience_continuity::embedded_booking::phase7::391",
    bookingCaseId: input.bookingCaseId,
    selectedAnchorRef:
      input.selectedOffer?.slotSummaryId ??
      input.alternatives.session.selectedAnchorRef ??
      input.waitlist.activeOfferSlotId ??
      input.manage.appointmentId,
    selectedAnchorLabel:
      input.selectedOffer?.startTimeLabel ??
      input.alternatives.selectedOfferEntryId ??
      input.waitlist.stateHeading,
    selectedOfferProvenanceRef:
      input.selectedTruth?.truthBasisHash ??
      input.confirmation.selectedReservationTruth.truthBasisHash ??
      input.alternatives.session.offerSetHash,
    shellContinuityKey: EMBEDDED_BOOKING_SHELL_CONTINUITY_KEY,
    sameShellState,
    sourceProjectionRefs: [
      "OfferSelectionProjection",
      "BookingSlotResultsProjection",
      "BookingConfirmationProjection",
      "PatientWaitlistViewProjection",
      "PatientAppointmentManageProjection",
      "PatientNetworkAlternativeChoiceProjection",
    ],
  };
}

export function resolveEmbeddedBookingContext(input: {
  readonly pathname: string;
  readonly search?: string;
}): EmbeddedBookingContext {
  const parsed = parseEmbeddedBookingLocation(input);
  const offerSelection = requireProjection(
    resolveOfferSelectionProjectionByScenarioId(offerScenarioFor(parsed.fixture)),
    `EMBEDDED_BOOKING_OFFER_MISSING:${parsed.fixture}`,
  );
  const slotResults = requireProjection(
    resolveBookingSlotResultsProjectionByScenarioId(offerSelection.slotResultsScenarioId),
    `EMBEDDED_BOOKING_SLOT_RESULTS_MISSING:${offerSelection.slotResultsScenarioId}`,
  );
  const selectedOffer = resolveOfferSelectionSlot(slotResults, offerSelection.selectedSlotId);
  const selectedTruth = selectedTruthFor(offerSelection);
  const confirmation = requireProjection(
    resolveBookingConfirmationProjectionForScenarioId(parsed.bookingCaseId, confirmationScenarioFor(parsed.fixture)),
    `EMBEDDED_BOOKING_CONFIRMATION_MISSING:${parsed.fixture}`,
  );
  const confirmationSlot = resolveBookingConfirmationSlot(confirmation);
  const waitlist = requireProjection(
    resolvePatientWaitlistViewProjectionByScenarioId(waitlistScenarioFor(parsed.fixture)),
    `EMBEDDED_BOOKING_WAITLIST_MISSING:${parsed.fixture}`,
  );
  const manage = requireProjection(
    resolvePatientAppointmentManageProjectionByScenarioId(manageScenarioFor(parsed.fixture)),
    `EMBEDDED_BOOKING_MANAGE_MISSING:${parsed.fixture}`,
  );
  const alternatives = requireProjection(
    resolvePatientNetworkAlternativeChoiceProjectionByScenarioId(alternativeScenarioFor(parsed.fixture)),
    `EMBEDDED_BOOKING_ALTERNATIVES_MISSING:${parsed.fixture}`,
  );
  const currentState = currentStateFor({
    routeKey: parsed.routeKey,
    fixture: parsed.fixture,
    offerSelection,
    selectedTruth,
    confirmation,
    waitlist,
    manage,
    alternatives,
  });
  const continuityEvidence = continuityFor({
    bookingCaseId: parsed.bookingCaseId,
    currentState,
    selectedOffer,
    selectedTruth,
    confirmation,
    waitlist,
    manage,
    alternatives,
  });
  const calendarBridgeAction = calendarActionFor({ confirmation, slot: confirmationSlot, fixture: parsed.fixture });
  const recoveryVisible =
    currentState.actionability === "recovery_required" ||
    parsed.fixture === "stale" ||
    parsed.fixture === "alternatives-drifted" ||
    parsed.fixture === "recovery";
  return {
    taskId: EMBEDDED_BOOKING_TASK_ID,
    visualMode: EMBEDDED_BOOKING_VISUAL_MODE,
    contractRef: EMBEDDED_BOOKING_CONTRACT_REF,
    routeKey: parsed.routeKey,
    bookingCaseId: parsed.bookingCaseId,
    fixture: parsed.fixture,
    embeddedPath: embeddedBookingPath(parsed),
    canonicalPath: canonicalPathFor(parsed),
    slotResults,
    offerSelection,
    selectedOffer,
    selectedTruth,
    confirmation,
    confirmationSlot,
    waitlist,
    manage,
    alternatives,
    currentState,
    continuityEvidence,
    calendarBridgeAction,
    summaryRows: summaryRowsFor({ selectedOffer, selectedTruth, confirmation, waitlist, manage }),
    recoveryBanner: {
      visible: recoveryVisible,
      title: parsed.fixture === "alternatives-drifted" ? "Alternative offers changed" : "Booking action paused",
      body:
        currentState.body ||
        "The last safe booking context remains visible while live controls are suppressed.",
      actionLabel: "Review safe booking context",
    },
    primaryActionLabel: currentState.nextActionLabel,
    secondaryActionLabel: parsed.routeKey === "offers" ? "Join waitlist" : "Back to offers",
    announcement: currentState.liveRegionMessage,
  };
}
