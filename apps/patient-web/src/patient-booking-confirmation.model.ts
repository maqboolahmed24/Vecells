import {
  resolveBookingSlotResultsProjectionByScenarioId,
  type BookingSlotResultsProjection,
  type BookingSlotSummaryProjection,
} from "./patient-booking-slot-results.model";
import { type OfferSelectionReservationTruthProjection } from "./patient-booking-offer-selection.model";

export const PATIENT_BOOKING_CONFIRMATION_TASK_ID =
  "par_296_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_confirmation_pending_disputed_and_recovery_states";
export const PATIENT_BOOKING_CONFIRMATION_VISUAL_MODE = "Confirmation_Truth_Studio";

export type ConfirmationSurfaceViewKind =
  | "review"
  | "in_progress"
  | "pending"
  | "recovery"
  | "confirmed";

export type ConfirmationTruthState296 =
  | "pre_commit_review"
  | "booking_in_progress"
  | "confirmation_pending"
  | "reconciliation_required"
  | "confirmed"
  | "failed"
  | "expired"
  | "superseded";

export type ConfirmationPatientVisibilityState =
  | "selected_slot_pending"
  | "provisional_receipt"
  | "booked_summary"
  | "recovery_required";

export type ConfirmationManageExposureState = "hidden" | "summary_only" | "writable";
export type ConfirmationArtifactExposureState = "hidden" | "summary_only" | "handoff_ready";
export type ConfirmationReminderExposureState = "blocked" | "pending_schedule" | "scheduled";
export type ConfirmationAuthoritativeProofClass =
  | "none"
  | "durable_provider_reference"
  | "same_commit_read_after_write"
  | "reconciled_confirmation";
export type ConfirmationRouteFreezeState =
  | "live"
  | "publication_stale"
  | "continuity_drift"
  | "identity_repair_active";
export type ConfirmationTone = "neutral" | "active" | "warn" | "blocked" | "safe";

export type ConfirmationActionRef =
  | "confirm_booking"
  | "wait_for_confirmation"
  | "refresh_confirmation_status"
  | "refresh_confirmation_route"
  | "return_to_selection"
  | "request_support"
  | "open_manage_stub"
  | "open_calendar_export_stub"
  | "open_print_stub"
  | "open_directions_stub"
  | "open_browser_handoff_stub";

export interface ConfirmationSummaryRow {
  readonly label: string;
  readonly value: string;
}

export interface ConfirmationActionProjection {
  readonly actionRef: ConfirmationActionRef;
  readonly label: string;
  readonly detail: string;
  readonly transitionScenarioId: string | null;
  readonly artifactMode?: "calendar" | "print" | "directions" | "browser_handoff";
}

export interface ConfirmationProgressStep {
  readonly stepId: "review" | "dispatch" | "confirmation" | "outcome";
  readonly label: string;
  readonly state: "complete" | "current" | "upcoming";
}

export interface BookingConfirmationProjection {
  readonly projectionName: "BookingConfirmationProjection";
  readonly scenarioId: string;
  readonly bookingCaseId: string;
  readonly viewKind: ConfirmationSurfaceViewKind;
  readonly referenceNowAt: string;
  readonly referenceNowLabel: string;
  readonly slotResultsScenarioId: string;
  readonly selectedSlotId: string;
  readonly selectedReservationTruth: OfferSelectionReservationTruthProjection;
  readonly confirmationTruthState: ConfirmationTruthState296;
  readonly patientVisibilityState: ConfirmationPatientVisibilityState;
  readonly manageExposureState: ConfirmationManageExposureState;
  readonly artifactExposureState: ConfirmationArtifactExposureState;
  readonly reminderExposureState: ConfirmationReminderExposureState;
  readonly routeFreezeState: ConfirmationRouteFreezeState;
  readonly authoritativeProofClass: ConfirmationAuthoritativeProofClass;
  readonly providerReference: string | null;
  readonly stateTone: ConfirmationTone;
  readonly ribbonLabel: string;
  readonly ribbonDetail: string;
  readonly stateHeading: string;
  readonly stateBody: string;
  readonly supportingNote: string;
  readonly provenanceNote: string;
  readonly progressSteps: readonly ConfirmationProgressStep[];
  readonly contactRows: readonly ConfirmationSummaryRow[];
  readonly reminderRows: readonly ConfirmationSummaryRow[];
  readonly stateRows: readonly ConfirmationSummaryRow[];
  readonly bookedSummaryRows: readonly ConfirmationSummaryRow[];
  readonly artifactRows: readonly ConfirmationSummaryRow[];
  readonly primaryAction: ConfirmationActionProjection | null;
  readonly secondaryActions: readonly ConfirmationActionProjection[];
  readonly artifactActions: readonly ConfirmationActionProjection[];
  readonly liveAnnouncement: string;
  readonly autoTransitionScenarioId: string | null;
  readonly autoTransitionDelayMs: number | null;
}

function requireSlotResultsProjection(
  scenarioId: string,
): BookingSlotResultsProjection {
  const projection = resolveBookingSlotResultsProjectionByScenarioId(scenarioId);
  if (!projection) {
    throw new Error(`Missing booking slot results scenario ${scenarioId}`);
  }
  return projection;
}

function requireSlot(
  slotResultsScenarioId: string,
  slotSummaryId: string,
): BookingSlotSummaryProjection {
  const projection = requireSlotResultsProjection(slotResultsScenarioId);
  const slot = projection.slots.find((entry) => entry.slotSummaryId === slotSummaryId);
  if (!slot) {
    throw new Error(
      `Missing slot ${slotSummaryId} in booking slot results scenario ${slotResultsScenarioId}`,
    );
  }
  return slot;
}

function buildTruth(input: {
  slotSummaryId: string;
  truthState: OfferSelectionReservationTruthProjection["truthState"];
  displayExclusivityState: OfferSelectionReservationTruthProjection["displayExclusivityState"];
  countdownMode: OfferSelectionReservationTruthProjection["countdownMode"];
  dominantCue: string;
  reasonRefs?: readonly string[];
  exclusiveUntilAt?: string | null;
}): OfferSelectionReservationTruthProjection {
  return {
    reservationTruthProjectionId: `reservation_truth_${input.slotSummaryId}_${input.truthState}`,
    slotSummaryId: input.slotSummaryId,
    truthState: input.truthState,
    displayExclusivityState: input.displayExclusivityState,
    countdownMode: input.countdownMode,
    exclusiveUntilAt: input.exclusiveUntilAt ?? null,
    truthBasisHash: `truth_basis_${input.slotSummaryId}_${input.truthState}`,
    reasonRefs: input.reasonRefs ?? [],
    dominantCue: input.dominantCue,
  };
}

function buildProgressSteps(
  viewKind: ConfirmationSurfaceViewKind,
): readonly ConfirmationProgressStep[] {
  switch (viewKind) {
    case "review":
      return [
        { stepId: "review", label: "Review", state: "current" },
        { stepId: "dispatch", label: "Send booking", state: "upcoming" },
        { stepId: "confirmation", label: "Confirm externally", state: "upcoming" },
        { stepId: "outcome", label: "Outcome", state: "upcoming" },
      ];
    case "in_progress":
      return [
        { stepId: "review", label: "Review", state: "complete" },
        { stepId: "dispatch", label: "Send booking", state: "current" },
        { stepId: "confirmation", label: "Confirm externally", state: "upcoming" },
        { stepId: "outcome", label: "Outcome", state: "upcoming" },
      ];
    case "pending":
    case "recovery":
      return [
        { stepId: "review", label: "Review", state: "complete" },
        { stepId: "dispatch", label: "Send booking", state: "complete" },
        { stepId: "confirmation", label: "Confirm externally", state: "current" },
        { stepId: "outcome", label: "Outcome", state: "upcoming" },
      ];
    case "confirmed":
      return [
        { stepId: "review", label: "Review", state: "complete" },
        { stepId: "dispatch", label: "Send booking", state: "complete" },
        { stepId: "confirmation", label: "Confirm externally", state: "complete" },
        { stepId: "outcome", label: "Outcome", state: "current" },
      ];
    default:
      return [];
  }
}

function buildProjection(input: {
  scenarioId: string;
  bookingCaseId: string;
  viewKind: ConfirmationSurfaceViewKind;
  referenceNowAt: string;
  referenceNowLabel: string;
  slotResultsScenarioId: string;
  selectedSlotId: string;
  selectedReservationTruth: OfferSelectionReservationTruthProjection;
  confirmationTruthState: ConfirmationTruthState296;
  patientVisibilityState: ConfirmationPatientVisibilityState;
  manageExposureState: ConfirmationManageExposureState;
  artifactExposureState: ConfirmationArtifactExposureState;
  reminderExposureState: ConfirmationReminderExposureState;
  routeFreezeState: ConfirmationRouteFreezeState;
  authoritativeProofClass: ConfirmationAuthoritativeProofClass;
  providerReference?: string | null;
  stateTone: ConfirmationTone;
  ribbonLabel: string;
  ribbonDetail: string;
  stateHeading: string;
  stateBody: string;
  supportingNote: string;
  provenanceNote: string;
  contactRows?: readonly ConfirmationSummaryRow[];
  reminderRows?: readonly ConfirmationSummaryRow[];
  stateRows?: readonly ConfirmationSummaryRow[];
  bookedSummaryRows?: readonly ConfirmationSummaryRow[];
  artifactRows?: readonly ConfirmationSummaryRow[];
  primaryAction?: ConfirmationActionProjection | null;
  secondaryActions?: readonly ConfirmationActionProjection[];
  artifactActions?: readonly ConfirmationActionProjection[];
  liveAnnouncement: string;
  autoTransitionScenarioId?: string | null;
  autoTransitionDelayMs?: number | null;
}): BookingConfirmationProjection {
  return {
    projectionName: "BookingConfirmationProjection",
    scenarioId: input.scenarioId,
    bookingCaseId: input.bookingCaseId,
    viewKind: input.viewKind,
    referenceNowAt: input.referenceNowAt,
    referenceNowLabel: input.referenceNowLabel,
    slotResultsScenarioId: input.slotResultsScenarioId,
    selectedSlotId: input.selectedSlotId,
    selectedReservationTruth: input.selectedReservationTruth,
    confirmationTruthState: input.confirmationTruthState,
    patientVisibilityState: input.patientVisibilityState,
    manageExposureState: input.manageExposureState,
    artifactExposureState: input.artifactExposureState,
    reminderExposureState: input.reminderExposureState,
    routeFreezeState: input.routeFreezeState,
    authoritativeProofClass: input.authoritativeProofClass,
    providerReference: input.providerReference ?? null,
    stateTone: input.stateTone,
    ribbonLabel: input.ribbonLabel,
    ribbonDetail: input.ribbonDetail,
    stateHeading: input.stateHeading,
    stateBody: input.stateBody,
    supportingNote: input.supportingNote,
    provenanceNote: input.provenanceNote,
    progressSteps: buildProgressSteps(input.viewKind),
    contactRows: input.contactRows ?? [],
    reminderRows: input.reminderRows ?? [],
    stateRows: input.stateRows ?? [],
    bookedSummaryRows: input.bookedSummaryRows ?? [],
    artifactRows: input.artifactRows ?? [],
    primaryAction: input.primaryAction ?? null,
    secondaryActions: input.secondaryActions ?? [],
    artifactActions: input.artifactActions ?? [],
    liveAnnouncement: input.liveAnnouncement,
    autoTransitionScenarioId: input.autoTransitionScenarioId ?? null,
    autoTransitionDelayMs: input.autoTransitionDelayMs ?? null,
  };
}

const slotReviewNonexclusive = requireSlot(
  "booking_case_294_renderable",
  "slot_summary_294_222_1120",
);
const slotReviewHeld = requireSlot(
  "booking_case_294_renderable",
  "slot_summary_294_211_0910",
);
const slotDisputed = requireSlot(
  "booking_case_294_renderable",
  "slot_summary_294_211_1330",
);

const projectionsByScenario = {
  booking_case_296_review: buildProjection({
    scenarioId: "booking_case_296_review",
    bookingCaseId: "booking_case_296_review",
    viewKind: "review",
    referenceNowAt: "2026-04-19T08:33:00Z",
    referenceNowLabel: "08:33",
    slotResultsScenarioId: "booking_case_294_renderable",
    selectedSlotId: slotReviewNonexclusive.slotSummaryId,
    selectedReservationTruth: buildTruth({
      slotSummaryId: slotReviewNonexclusive.slotSummaryId,
      truthState: "truthful_nonexclusive",
      displayExclusivityState: "nonexclusive",
      countdownMode: "none",
      dominantCue: "Selected, but not held. Confirmation happens after you continue.",
      reasonRefs: ["truthful_nonexclusive", "ranked_snapshot_result"],
    }),
    confirmationTruthState: "pre_commit_review",
    patientVisibilityState: "selected_slot_pending",
    manageExposureState: "hidden",
    artifactExposureState: "hidden",
    reminderExposureState: "blocked",
    routeFreezeState: "live",
    authoritativeProofClass: "none",
    stateTone: "active",
    ribbonLabel: "Ready to confirm",
    ribbonDetail:
      "Review the selected slot, contact route, and reminder preference before the booking request is sent.",
    stateHeading: "Review this booking before you confirm",
    stateBody:
      "The selected slot is pinned here so the patient can verify what they chose without implying that the booking is already complete.",
    supportingNote:
      "You are not booked yet. Final reassurance appears only after the authoritative confirmation truth is confirmed.",
    provenanceNote:
      "The chosen slot stays visible throughout review, pending confirmation, recovery, and confirmed summary states.",
    contactRows: [
      { label: "Contact route", value: "SMS to 07700 900362 if the supplier needs to reach you" },
      { label: "Support path", value: "Practice booking team can continue from this same case" },
    ],
    reminderRows: [
      { label: "Reminder plan", value: "Text reminder 24 hours before the appointment" },
      { label: "Fallback channel", value: "Email confirmation remains secondary until booking truth settles" },
    ],
    stateRows: [
      { label: "Selected slot", value: `${slotReviewNonexclusive.dayLongLabel} at ${slotReviewNonexclusive.startTimeLabel}` },
      { label: "Current posture", value: "Selected, not yet booked" },
      { label: "Mutation state", value: "One confirm action remains available" },
    ],
    primaryAction: {
      actionRef: "confirm_booking",
      label: "Confirm booking",
      detail: "Start the booking attempt and keep this same shell alive while truth settles.",
      transitionScenarioId: "booking_case_296_in_progress",
    },
    secondaryActions: [
      {
        actionRef: "return_to_selection",
        label: "Choose another time",
        detail: "Return to the current ranked slot list without losing the shell context.",
        transitionScenarioId: null,
      },
      {
        actionRef: "request_support",
        label: "Ask for booking help",
        detail: "Use the governed support path instead of continuing alone.",
        transitionScenarioId: null,
      },
    ],
    artifactRows: [
      { label: "Calendar export", value: "Hidden until confirmation truth is confirmed" },
      { label: "Directions", value: "Hidden until confirmation truth is confirmed" },
    ],
    liveAnnouncement: "Review the selected booking details before confirming.",
  }),
  booking_case_296_review_held: buildProjection({
    scenarioId: "booking_case_296_review_held",
    bookingCaseId: "booking_case_296_review_held",
    viewKind: "review",
    referenceNowAt: "2026-04-19T08:33:00Z",
    referenceNowLabel: "08:33",
    slotResultsScenarioId: "booking_case_294_renderable",
    selectedSlotId: slotReviewHeld.slotSummaryId,
    selectedReservationTruth: buildTruth({
      slotSummaryId: slotReviewHeld.slotSummaryId,
      truthState: "exclusive_held",
      displayExclusivityState: "exclusive",
      countdownMode: "hold_expiry",
      exclusiveUntilAt: "2026-04-19T08:39:00Z",
      dominantCue: "Held for you until the real supplier hold expires.",
      reasonRefs: ["exclusive_hold", "real_supplier_hold"],
    }),
    confirmationTruthState: "pre_commit_review",
    patientVisibilityState: "selected_slot_pending",
    manageExposureState: "hidden",
    artifactExposureState: "hidden",
    reminderExposureState: "blocked",
    routeFreezeState: "live",
    authoritativeProofClass: "none",
    stateTone: "active",
    ribbonLabel: "Held slot ready to confirm",
    ribbonDetail:
      "The supplier hold is real, but the patient is still not booked until the confirmation truth chain settles.",
    stateHeading: "Confirm this held slot while the supplier hold is live",
    stateBody:
      "The current hold remains visible as reservation truth. That hold does not grant booked reassurance on its own.",
    supportingNote:
      "Hold countdown language comes only from reservation truth. Booked language still waits for confirmation truth.",
    provenanceNote:
      "The held slot remains the same selected anchor while the confirmation child state changes around it.",
    contactRows: [
      { label: "Contact route", value: "SMS to 07700 900362 if a late change needs acknowledgement" },
      { label: "Support path", value: "Practice booking team can intervene before hold expiry if needed" },
    ],
    reminderRows: [
      { label: "Reminder plan", value: "Text reminder stays blocked until confirmation is final" },
      { label: "Quiet fallback", value: "Email copy stays summary-only until the booking outcome is authoritative" },
    ],
    stateRows: [
      { label: "Selected slot", value: `${slotReviewHeld.dayLongLabel} at ${slotReviewHeld.startTimeLabel}` },
      { label: "Reservation truth", value: "Exclusive hold active" },
      { label: "Current posture", value: "Ready to send the booking request" },
    ],
    primaryAction: {
      actionRef: "confirm_booking",
      label: "Confirm booking",
      detail: "Use the held slot while the current supplier hold remains live.",
      transitionScenarioId: "booking_case_296_in_progress_held",
    },
    secondaryActions: [
      {
        actionRef: "return_to_selection",
        label: "Choose another time",
        detail: "Return to the current ranked slot list instead of using this held slot.",
        transitionScenarioId: null,
      },
      {
        actionRef: "request_support",
        label: "Ask for booking help",
        detail: "Use the support path if the hold is likely to expire before the patient can continue.",
        transitionScenarioId: null,
      },
    ],
    artifactRows: [
      { label: "Calendar export", value: "Hidden until confirmation truth is confirmed" },
      { label: "Directions", value: "Hidden until confirmation truth is confirmed" },
    ],
    liveAnnouncement: "Review the held booking details before confirming.",
  }),
  booking_case_296_in_progress: buildProjection({
    scenarioId: "booking_case_296_in_progress",
    bookingCaseId: "booking_case_296_in_progress",
    viewKind: "in_progress",
    referenceNowAt: "2026-04-19T08:34:00Z",
    referenceNowLabel: "08:34",
    slotResultsScenarioId: "booking_case_294_renderable",
    selectedSlotId: slotReviewNonexclusive.slotSummaryId,
    selectedReservationTruth: buildTruth({
      slotSummaryId: slotReviewNonexclusive.slotSummaryId,
      truthState: "pending_confirmation",
      displayExclusivityState: "none",
      countdownMode: "none",
      dominantCue: "The system is checking the selected slot with the supplier now.",
      reasonRefs: ["pending_confirmation", "authoritative_read_pending"],
    }),
    confirmationTruthState: "booking_in_progress",
    patientVisibilityState: "provisional_receipt",
    manageExposureState: "hidden",
    artifactExposureState: "summary_only",
    reminderExposureState: "blocked",
    routeFreezeState: "live",
    authoritativeProofClass: "none",
    stateTone: "active",
    ribbonLabel: "Booking in progress",
    ribbonDetail:
      "The request is being sent. Duplicate taps are blocked and the same booking attempt resumes if the patient refreshes.",
    stateHeading: "We are sending your booking now",
    stateBody:
      "This is a bounded progress state. It keeps the selected slot visible, blocks duplicate taps, and avoids a blank spinner takeover.",
    supportingNote:
      "You can refresh safely. This route restores the live booking attempt instead of creating a second booking effect.",
    provenanceNote:
      "The selected slot remains pinned while the booking command is in flight and external confirmation has not settled.",
    stateRows: [
      { label: "Booking attempt", value: "Current command effect already in flight" },
      { label: "Duplicate taps", value: "Blocked while this booking attempt is active" },
      { label: "Shell continuity", value: "Refresh-safe resume from the same route family" },
    ],
    primaryAction: {
      actionRef: "wait_for_confirmation",
      label: "Booking in progress",
      detail: "This action stays disabled while the current booking attempt is still in flight.",
      transitionScenarioId: null,
    },
    secondaryActions: [
      {
        actionRef: "request_support",
        label: "Ask for booking help",
        detail: "Support can follow the same booking case if this state stalls.",
        transitionScenarioId: null,
      },
    ],
    artifactRows: [
      { label: "Provisional summary", value: "Visible in-shell only" },
      { label: "Export and print", value: "Still hidden while outcome truth is unresolved" },
    ],
    liveAnnouncement: "Booking in progress. Duplicate confirm taps are now blocked.",
    autoTransitionScenarioId: "booking_case_296_pending",
    autoTransitionDelayMs: 900,
  }),
  booking_case_296_in_progress_held: buildProjection({
    scenarioId: "booking_case_296_in_progress_held",
    bookingCaseId: "booking_case_296_in_progress_held",
    viewKind: "in_progress",
    referenceNowAt: "2026-04-19T08:34:00Z",
    referenceNowLabel: "08:34",
    slotResultsScenarioId: "booking_case_294_renderable",
    selectedSlotId: slotReviewHeld.slotSummaryId,
    selectedReservationTruth: buildTruth({
      slotSummaryId: slotReviewHeld.slotSummaryId,
      truthState: "pending_confirmation",
      displayExclusivityState: "none",
      countdownMode: "none",
      dominantCue: "The held slot is now moving through external confirmation.",
      reasonRefs: ["pending_confirmation", "authoritative_read_pending"],
    }),
    confirmationTruthState: "booking_in_progress",
    patientVisibilityState: "provisional_receipt",
    manageExposureState: "hidden",
    artifactExposureState: "summary_only",
    reminderExposureState: "blocked",
    routeFreezeState: "live",
    authoritativeProofClass: "none",
    stateTone: "active",
    ribbonLabel: "Booking in progress",
    ribbonDetail:
      "The held slot is now being confirmed. Duplicate taps stay blocked and the same route resumes safely.",
    stateHeading: "We are sending the held booking now",
    stateBody:
      "The supplier hold remains part of the preserved provenance, but booked reassurance still waits for confirmation truth.",
    supportingNote:
      "You can refresh safely. This route restores the same booking attempt instead of creating another one.",
    provenanceNote:
      "The held slot remains the chosen anchor while the confirmation child state changes from send to pending to outcome.",
    stateRows: [
      { label: "Booking attempt", value: "Current command effect already in flight" },
      { label: "Duplicate taps", value: "Blocked while this booking attempt is active" },
      { label: "Hold language", value: "Preserved as provenance, not upgraded to booked reassurance" },
    ],
    primaryAction: {
      actionRef: "wait_for_confirmation",
      label: "Booking in progress",
      detail: "This action stays disabled while the current booking attempt is still in flight.",
      transitionScenarioId: null,
    },
    secondaryActions: [
      {
        actionRef: "request_support",
        label: "Ask for booking help",
        detail: "Support can follow the same booking case if this state stalls.",
        transitionScenarioId: null,
      },
    ],
    artifactRows: [
      { label: "Provisional summary", value: "Visible in-shell only" },
      { label: "Export and print", value: "Still hidden while outcome truth is unresolved" },
    ],
    liveAnnouncement: "Booking in progress for the held slot. Duplicate confirm taps are now blocked.",
    autoTransitionScenarioId: "booking_case_296_pending_held",
    autoTransitionDelayMs: 900,
  }),
  booking_case_296_pending: buildProjection({
    scenarioId: "booking_case_296_pending",
    bookingCaseId: "booking_case_296_pending",
    viewKind: "pending",
    referenceNowAt: "2026-04-19T08:36:00Z",
    referenceNowLabel: "08:36",
    slotResultsScenarioId: "booking_case_294_renderable",
    selectedSlotId: slotReviewNonexclusive.slotSummaryId,
    selectedReservationTruth: buildTruth({
      slotSummaryId: slotReviewNonexclusive.slotSummaryId,
      truthState: "pending_confirmation",
      displayExclusivityState: "none",
      countdownMode: "none",
      dominantCue: "The booking has been accepted for processing but is not yet confirmed.",
      reasonRefs: ["pending_confirmation", "provider_processing_acceptance"],
    }),
    confirmationTruthState: "confirmation_pending",
    patientVisibilityState: "provisional_receipt",
    manageExposureState: "hidden",
    artifactExposureState: "summary_only",
    reminderExposureState: "blocked",
    routeFreezeState: "live",
    authoritativeProofClass: "none",
    providerReference: "PEND-441927",
    stateTone: "warn",
    ribbonLabel: "Waiting for authoritative confirmation",
    ribbonDetail:
      "The supplier accepted the request for processing. This is still provisional, so final booked reassurance stays hidden.",
    stateHeading: "We are confirming your booking",
    stateBody:
      "The booking request is no longer being sent, but the authoritative confirmation proof has not settled yet. The patient stays in the same shell with provisional receipt guidance.",
    supportingNote:
      "The provider reference is shown for support or troubleshooting only. It does not mean the booking is final on its own.",
    provenanceNote:
      "The selected slot remains pinned while the route waits for authoritative confirmation or degrades into governed recovery.",
    stateRows: [
      { label: "Current truth", value: "Accepted for processing, not yet booked" },
      { label: "Provider reference", value: "PEND-441927" },
      { label: "Patient-safe next step", value: "Wait here or refresh this same route" },
    ],
    primaryAction: {
      actionRef: "refresh_confirmation_status",
      label: "Refresh confirmation status",
      detail: "Recheck the authoritative confirmation outcome on this same route.",
      transitionScenarioId: "booking_case_296_confirmed",
    },
    secondaryActions: [
      {
        actionRef: "request_support",
        label: "Ask for booking help",
        detail: "Use the governed support path instead of assuming the booking is final.",
        transitionScenarioId: null,
      },
    ],
    artifactRows: [
      { label: "Summary posture", value: "In-shell provisional receipt only" },
      { label: "Export and handoff", value: "Still hidden until confirmation truth is confirmed" },
    ],
    liveAnnouncement: "Booking pending confirmation. Final booked reassurance is still hidden.",
  }),
  booking_case_296_pending_held: buildProjection({
    scenarioId: "booking_case_296_pending_held",
    bookingCaseId: "booking_case_296_pending_held",
    viewKind: "pending",
    referenceNowAt: "2026-04-19T08:36:00Z",
    referenceNowLabel: "08:36",
    slotResultsScenarioId: "booking_case_294_renderable",
    selectedSlotId: slotReviewHeld.slotSummaryId,
    selectedReservationTruth: buildTruth({
      slotSummaryId: slotReviewHeld.slotSummaryId,
      truthState: "pending_confirmation",
      displayExclusivityState: "none",
      countdownMode: "none",
      dominantCue: "The held slot has moved into external confirmation and is no longer described as a booked result.",
      reasonRefs: ["pending_confirmation", "provider_processing_acceptance"],
    }),
    confirmationTruthState: "confirmation_pending",
    patientVisibilityState: "provisional_receipt",
    manageExposureState: "hidden",
    artifactExposureState: "summary_only",
    reminderExposureState: "blocked",
    routeFreezeState: "live",
    authoritativeProofClass: "none",
    providerReference: "PEND-552114",
    stateTone: "warn",
    ribbonLabel: "Waiting for authoritative confirmation",
    ribbonDetail:
      "The held slot request was accepted for processing. Final booked reassurance still waits for confirmation truth.",
    stateHeading: "We are confirming this held booking",
    stateBody:
      "The supplier hold helped secure the slot at selection time, but the patient still needs authoritative confirmation before the summary becomes booked.",
    supportingNote:
      "The provider reference is for support use only while this route remains provisional.",
    provenanceNote:
      "The held slot remains pinned while the booking waits for authoritative confirmation or governed recovery.",
    stateRows: [
      { label: "Current truth", value: "Accepted for processing, not yet booked" },
      { label: "Provider reference", value: "PEND-552114" },
      { label: "Patient-safe next step", value: "Wait here or refresh this same route" },
    ],
    primaryAction: {
      actionRef: "refresh_confirmation_status",
      label: "Refresh confirmation status",
      detail: "Recheck the authoritative confirmation outcome on this same route.",
      transitionScenarioId: "booking_case_296_confirmed_held",
    },
    secondaryActions: [
      {
        actionRef: "request_support",
        label: "Ask for booking help",
        detail: "Use the governed support path instead of assuming this held slot is now booked.",
        transitionScenarioId: null,
      },
    ],
    artifactRows: [
      { label: "Summary posture", value: "In-shell provisional receipt only" },
      { label: "Export and handoff", value: "Still hidden until confirmation truth is confirmed" },
    ],
    liveAnnouncement: "Held booking pending confirmation. Final booked reassurance is still hidden.",
  }),
  booking_case_296_reconciliation: buildProjection({
    scenarioId: "booking_case_296_reconciliation",
    bookingCaseId: "booking_case_296_reconciliation",
    viewKind: "recovery",
    referenceNowAt: "2026-04-19T08:42:00Z",
    referenceNowLabel: "08:42",
    slotResultsScenarioId: "booking_case_294_renderable",
    selectedSlotId: slotDisputed.slotSummaryId,
    selectedReservationTruth: buildTruth({
      slotSummaryId: slotDisputed.slotSummaryId,
      truthState: "disputed",
      displayExclusivityState: "none",
      countdownMode: "none",
      dominantCue: "Confirmation evidence for this selected slot is contradictory and now needs governed recovery.",
      reasonRefs: ["disputed_confirmation", "manual_attention"],
    }),
    confirmationTruthState: "reconciliation_required",
    patientVisibilityState: "recovery_required",
    manageExposureState: "hidden",
    artifactExposureState: "hidden",
    reminderExposureState: "blocked",
    routeFreezeState: "live",
    authoritativeProofClass: "reconciled_confirmation",
    providerReference: "AMB-204117",
    stateTone: "blocked",
    ribbonLabel: "Recovery required",
    ribbonDetail:
      "The authoritative confirmation chain does not yet agree, so the patient gets explanation-first recovery instead of a spinner or success page.",
    stateHeading: "We are checking what happened to this booking",
    stateBody:
      "The current confirmation evidence is contradictory. The same shell keeps the chosen slot visible as provenance while the next safe recovery path is made explicit.",
    supportingNote:
      "Do not rely on callback acceptance, a local success toast, or appointment-row presence alone. The booking is not final until the confirmation truth chain settles.",
    provenanceNote:
      "This selected slot is preserved as provenance only. It remains visible so the patient knows which booking attempt is under review.",
    stateRows: [
      { label: "Current truth", value: "Reconciliation required" },
      { label: "Provider reference", value: "AMB-204117" },
      { label: "Patient-safe next step", value: "Choose another time or ask for booking help" },
    ],
    primaryAction: {
      actionRef: "return_to_selection",
      label: "Choose another time",
      detail: "Return to the ranked results instead of waiting on contradictory confirmation evidence.",
      transitionScenarioId: null,
    },
    secondaryActions: [
      {
        actionRef: "request_support",
        label: "Ask for booking help",
        detail: "Use the support path when this booking requires governed recovery.",
        transitionScenarioId: null,
      },
    ],
    artifactRows: [
      { label: "Summary posture", value: "Recovery-only explanation" },
      { label: "Export and handoff", value: "Hidden while confirmation is disputed" },
    ],
    liveAnnouncement: "Recovery required. This booking is still being checked and is not yet final.",
  }),
  booking_case_296_route_drift: buildProjection({
    scenarioId: "booking_case_296_route_drift",
    bookingCaseId: "booking_case_296_route_drift",
    viewKind: "recovery",
    referenceNowAt: "2026-04-19T08:41:00Z",
    referenceNowLabel: "08:41",
    slotResultsScenarioId: "booking_case_294_renderable",
    selectedSlotId: slotReviewNonexclusive.slotSummaryId,
    selectedReservationTruth: buildTruth({
      slotSummaryId: slotReviewNonexclusive.slotSummaryId,
      truthState: "pending_confirmation",
      displayExclusivityState: "none",
      countdownMode: "none",
      dominantCue: "The selected slot remains visible, but route publication and continuity drift have frozen live confirmation controls.",
      reasonRefs: ["publication_stale", "route_freeze"],
    }),
    confirmationTruthState: "confirmation_pending",
    patientVisibilityState: "recovery_required",
    manageExposureState: "hidden",
    artifactExposureState: "hidden",
    reminderExposureState: "blocked",
    routeFreezeState: "publication_stale",
    authoritativeProofClass: "none",
    providerReference: "PEND-441927",
    stateTone: "blocked",
    ribbonLabel: "Route refresh required",
    ribbonDetail:
      "Route publication or shell continuity drifted, so live confirm controls are frozen in place instead of staying writable on a stale route.",
    stateHeading: "Refresh this booking route before continuing",
    stateBody:
      "The patient stays in the same booking shell with the chosen slot preserved as provenance. Live confirmation posture is frozen until route and continuity proof are refreshed.",
    supportingNote:
      "Generic failure is not used here. The route freezes in place and keeps the selected slot readable until the current shell can be re-proven.",
    provenanceNote:
      "The chosen slot remains visible, but live confirm, export, and reminder controls are suspended until route continuity is restored.",
    stateRows: [
      { label: "Current truth", value: "Pending outcome on a stale route" },
      { label: "Route freeze", value: "Publication stale" },
      { label: "Patient-safe next step", value: "Refresh this route or use the support path" },
    ],
    primaryAction: {
      actionRef: "refresh_confirmation_route",
      label: "Refresh this route",
      detail: "Revalidate route publication and continuity before restoring live confirmation posture.",
      transitionScenarioId: "booking_case_296_pending",
    },
    secondaryActions: [
      {
        actionRef: "request_support",
        label: "Ask for booking help",
        detail: "Use the support path instead of continuing on a stale confirmation route.",
        transitionScenarioId: null,
      },
      {
        actionRef: "return_to_selection",
        label: "Return to slot selection",
        detail: "Go back to the current ranked slot list from the same shell.",
        transitionScenarioId: null,
      },
    ],
    artifactRows: [
      { label: "Summary posture", value: "Frozen route, provenance only" },
      { label: "Export and handoff", value: "Hidden until route continuity is restored" },
    ],
    liveAnnouncement: "Confirmation route frozen. Refresh the route before continuing.",
  }),
  booking_case_296_identity_repair: buildProjection({
    scenarioId: "booking_case_296_identity_repair",
    bookingCaseId: "booking_case_296_identity_repair",
    viewKind: "recovery",
    referenceNowAt: "2026-04-19T08:48:00Z",
    referenceNowLabel: "08:48",
    slotResultsScenarioId: "booking_case_294_renderable",
    selectedSlotId: slotReviewNonexclusive.slotSummaryId,
    selectedReservationTruth: buildTruth({
      slotSummaryId: slotReviewNonexclusive.slotSummaryId,
      truthState: "confirmed",
      displayExclusivityState: "exclusive",
      countdownMode: "none",
      dominantCue: "The booking outcome is confirmed, but identity repair has frozen live controls and artifacts in place.",
      reasonRefs: ["identity_repair_freeze", "summary_only"],
    }),
    confirmationTruthState: "confirmed",
    patientVisibilityState: "recovery_required",
    manageExposureState: "hidden",
    artifactExposureState: "hidden",
    reminderExposureState: "blocked",
    routeFreezeState: "identity_repair_active",
    authoritativeProofClass: "durable_provider_reference",
    providerReference: "BOOK-771204",
    stateTone: "blocked",
    ribbonLabel: "Identity repair freeze active",
    ribbonDetail:
      "Safe context remains visible, but confirm-adjacent mutation, reminder, and artifact controls are suppressed until identity repair is released.",
    stateHeading: "We paused live booking controls while identity is checked",
    stateBody:
      "The booking truth is settled, but the current route is under identity repair freeze. The patient keeps only safe context in place until the lineage can be re-proven.",
    supportingNote:
      "This closes the wrong-patient loophole by suppressing manage, reminder, export, print, directions, and browser handoff while identity repair is still active.",
    provenanceNote:
      "The chosen slot remains visible as safe context while identity repair suppresses wider visibility and any writable follow-up controls.",
    stateRows: [
      { label: "Current truth", value: "Confirmed, but frozen by identity repair" },
      { label: "Provider reference", value: "BOOK-771204" },
      { label: "Patient-safe next step", value: "Use support while identity repair completes" },
    ],
    primaryAction: {
      actionRef: "request_support",
      label: "Use the support path",
      detail: "Continue safely while identity repair is still active.",
      transitionScenarioId: null,
    },
    secondaryActions: [
      {
        actionRef: "return_to_selection",
        label: "Return to slot selection",
        detail: "Return to the safe booking shell anchor instead of using frozen controls.",
        transitionScenarioId: null,
      },
    ],
    artifactRows: [
      { label: "Summary posture", value: "Safe context only" },
      { label: "Export and handoff", value: "Hidden until identity repair releases" },
    ],
    liveAnnouncement: "Identity repair freeze active. Live booking controls are temporarily suppressed.",
  }),
  booking_case_296_confirmed: buildProjection({
    scenarioId: "booking_case_296_confirmed",
    bookingCaseId: "booking_case_296_confirmed",
    viewKind: "confirmed",
    referenceNowAt: "2026-04-19T08:39:00Z",
    referenceNowLabel: "08:39",
    slotResultsScenarioId: "booking_case_294_renderable",
    selectedSlotId: slotReviewNonexclusive.slotSummaryId,
    selectedReservationTruth: buildTruth({
      slotSummaryId: slotReviewNonexclusive.slotSummaryId,
      truthState: "confirmed",
      displayExclusivityState: "exclusive",
      countdownMode: "none",
      dominantCue: "The selected slot is now confirmed by authoritative booking truth.",
      reasonRefs: ["confirmed", "durable_provider_reference"],
    }),
    confirmationTruthState: "confirmed",
    patientVisibilityState: "booked_summary",
    manageExposureState: "writable",
    artifactExposureState: "handoff_ready",
    reminderExposureState: "scheduled",
    routeFreezeState: "live",
    authoritativeProofClass: "durable_provider_reference",
    providerReference: "BOOK-771204",
    stateTone: "safe",
    ribbonLabel: "Booking confirmed",
    ribbonDetail:
      "Authoritative confirmation truth is settled, so the patient now gets a calm booked summary and ready follow-up actions.",
    stateHeading: "Your booking is confirmed",
    stateBody:
      "This booked summary is now lawful because the confirmation truth chain settled to confirmed with a durable provider reference for the same booking lineage.",
    supportingNote:
      "Manage, reminder reassurance, export, print, directions, and browser handoff are now available because both confirmation truth and artifact exposure permit them.",
    provenanceNote:
      "The selected slot remains the same anchor in the shell and now becomes the calm confirmed summary instead of provisional provenance.",
    stateRows: [
      { label: "Confirmed at", value: "08:39" },
      { label: "Provider reference", value: "BOOK-771204" },
      { label: "Reminder state", value: "Scheduled" },
    ],
    bookedSummaryRows: [
      { label: "Appointment", value: `${slotReviewNonexclusive.dayLongLabel}, ${slotReviewNonexclusive.startTimeLabel} to ${slotReviewNonexclusive.endTimeLabel}` },
      { label: "Location", value: `${slotReviewNonexclusive.siteLabel} · ${slotReviewNonexclusive.modalityLabel}` },
      { label: "Clinician", value: slotReviewNonexclusive.clinicianLabel },
      { label: "Arrival", value: "Arrive 10 minutes early with your confirmation reference" },
    ],
    artifactRows: [
      { label: "Calendar export", value: "Ready" },
      { label: "Print and directions", value: "Ready" },
    ],
    primaryAction: {
      actionRef: "open_manage_stub",
      label: "Manage appointment",
      detail: "The manage route becomes ready here and is extended in task 297.",
      transitionScenarioId: null,
    },
    artifactActions: [
      {
        actionRef: "open_calendar_export_stub",
        label: "Export to calendar",
        detail: "Artifact exposure is handoff-ready for calendar export.",
        transitionScenarioId: null,
        artifactMode: "calendar",
      },
      {
        actionRef: "open_print_stub",
        label: "Print summary",
        detail: "Artifact exposure is handoff-ready for print.",
        transitionScenarioId: null,
        artifactMode: "print",
      },
      {
        actionRef: "open_directions_stub",
        label: "Directions",
        detail: "Directions handoff is now lawful from the current artifact contract.",
        transitionScenarioId: null,
        artifactMode: "directions",
      },
      {
        actionRef: "open_browser_handoff_stub",
        label: "Browser handoff",
        detail: "External navigation is permitted by the current outbound navigation grant.",
        transitionScenarioId: null,
        artifactMode: "browser_handoff",
      },
    ],
    liveAnnouncement: "Booking confirmed. Manage and artifact actions are now available.",
  }),
  booking_case_296_confirmed_held: buildProjection({
    scenarioId: "booking_case_296_confirmed_held",
    bookingCaseId: "booking_case_296_confirmed_held",
    viewKind: "confirmed",
    referenceNowAt: "2026-04-19T08:39:00Z",
    referenceNowLabel: "08:39",
    slotResultsScenarioId: "booking_case_294_renderable",
    selectedSlotId: slotReviewHeld.slotSummaryId,
    selectedReservationTruth: buildTruth({
      slotSummaryId: slotReviewHeld.slotSummaryId,
      truthState: "confirmed",
      displayExclusivityState: "exclusive",
      countdownMode: "none",
      dominantCue: "The held slot is now confirmed by authoritative booking truth.",
      reasonRefs: ["confirmed", "durable_provider_reference"],
    }),
    confirmationTruthState: "confirmed",
    patientVisibilityState: "booked_summary",
    manageExposureState: "writable",
    artifactExposureState: "handoff_ready",
    reminderExposureState: "scheduled",
    routeFreezeState: "live",
    authoritativeProofClass: "same_commit_read_after_write",
    providerReference: "BOOK-884031",
    stateTone: "safe",
    ribbonLabel: "Booking confirmed",
    ribbonDetail:
      "The held booking is now confirmed, so the route can safely expose manage and artifact actions.",
    stateHeading: "Your held booking is confirmed",
    stateBody:
      "The selected held slot remained pinned across review, pending, and outcome states. It is now a calm booked summary because confirmation truth is final.",
    supportingNote:
      "The real hold is no longer rendered as a countdown because the booking outcome has already settled to confirmed.",
    provenanceNote:
      "The held slot stayed fixed as the selected anchor and now resolves to a confirmed appointment summary.",
    stateRows: [
      { label: "Confirmed at", value: "08:39" },
      { label: "Provider reference", value: "BOOK-884031" },
      { label: "Reminder state", value: "Scheduled" },
    ],
    bookedSummaryRows: [
      { label: "Appointment", value: `${slotReviewHeld.dayLongLabel}, ${slotReviewHeld.startTimeLabel} to ${slotReviewHeld.endTimeLabel}` },
      { label: "Location", value: `${slotReviewHeld.siteLabel} · ${slotReviewHeld.modalityLabel}` },
      { label: "Clinician", value: slotReviewHeld.clinicianLabel },
      { label: "Arrival", value: "Arrive 10 minutes early with your confirmation reference" },
    ],
    artifactRows: [
      { label: "Calendar export", value: "Ready" },
      { label: "Print and directions", value: "Ready" },
    ],
    primaryAction: {
      actionRef: "open_manage_stub",
      label: "Manage appointment",
      detail: "The manage route becomes ready here and is extended in task 297.",
      transitionScenarioId: null,
    },
    artifactActions: [
      {
        actionRef: "open_calendar_export_stub",
        label: "Export to calendar",
        detail: "Artifact exposure is handoff-ready for calendar export.",
        transitionScenarioId: null,
        artifactMode: "calendar",
      },
      {
        actionRef: "open_print_stub",
        label: "Print summary",
        detail: "Artifact exposure is handoff-ready for print.",
        transitionScenarioId: null,
        artifactMode: "print",
      },
      {
        actionRef: "open_directions_stub",
        label: "Directions",
        detail: "Directions handoff is now lawful from the current artifact contract.",
        transitionScenarioId: null,
        artifactMode: "directions",
      },
      {
        actionRef: "open_browser_handoff_stub",
        label: "Browser handoff",
        detail: "External navigation is permitted by the current outbound navigation grant.",
        transitionScenarioId: null,
        artifactMode: "browser_handoff",
      },
    ],
    liveAnnouncement: "Held booking confirmed. Manage and artifact actions are now available.",
  }),
} as const satisfies Record<string, BookingConfirmationProjection>;

const scenarioAlias: Record<string, keyof typeof projectionsByScenario> = {
  booking_case_293_live: "booking_case_296_review",
  booking_case_293_degraded: "booking_case_296_pending",
  booking_case_293_recovery: "booking_case_296_route_drift",
  booking_case_306_handoff_live: "booking_case_296_review",
  booking_case_306_confirmation_pending: "booking_case_296_pending",
  booking_case_306_confirmed: "booking_case_296_confirmed",
  booking_case_306_reopened: "booking_case_296_route_drift",
  booking_case_295_nonexclusive: "booking_case_296_review",
  booking_case_295_exclusive_hold: "booking_case_296_review_held",
  booking_case_295_checking: "booking_case_296_pending",
  booking_case_295_unavailable: "booking_case_296_reconciliation",
  booking_case_295_stale: "booking_case_296_route_drift",
  booking_case_295_support_fallback: "booking_case_296_route_drift",
  booking_case_295_no_supply: "booking_case_296_route_drift",
};

export const patientBookingConfirmationScenarioIds = Object.keys(
  projectionsByScenario,
) as readonly string[];

function overrideBookingCaseId(
  projection: BookingConfirmationProjection,
  bookingCaseId: string,
): BookingConfirmationProjection {
  return projection.bookingCaseId === bookingCaseId
    ? projection
    : {
        ...projection,
        bookingCaseId,
      };
}

export function resolveBookingConfirmationProjection(
  bookingCaseId: string,
): BookingConfirmationProjection | null {
  const scenarioId = scenarioAlias[bookingCaseId] ?? bookingCaseId;
  const projection = projectionsByScenario[scenarioId as keyof typeof projectionsByScenario] ?? null;
  return projection ? overrideBookingCaseId(projection, bookingCaseId) : null;
}

export function resolveBookingConfirmationProjectionByScenarioId(
  scenarioId: string,
): BookingConfirmationProjection | null {
  return projectionsByScenario[scenarioId as keyof typeof projectionsByScenario] ?? null;
}

export function resolveBookingConfirmationProjectionForScenarioId(
  bookingCaseId: string,
  scenarioId: string,
): BookingConfirmationProjection | null {
  const projection = resolveBookingConfirmationProjectionByScenarioId(scenarioId);
  return projection ? overrideBookingCaseId(projection, bookingCaseId) : null;
}

export function resolveBookingConfirmationSlot(
  projection: BookingConfirmationProjection,
): BookingSlotSummaryProjection {
  return requireSlot(projection.slotResultsScenarioId, projection.selectedSlotId);
}

export function confirmationStateMatrix(): Array<Record<string, string>> {
  return patientBookingConfirmationScenarioIds.map((scenarioId) => {
    const projection = resolveBookingConfirmationProjectionByScenarioId(scenarioId)!;
    return {
      scenario_id: projection.scenarioId,
      booking_case_id: projection.bookingCaseId,
      route: `/bookings/${projection.bookingCaseId}/confirm`,
      view_kind: projection.viewKind,
      confirmation_truth: projection.confirmationTruthState,
      patient_visibility: projection.patientVisibilityState,
      manage_exposure: projection.manageExposureState,
      artifact_exposure: projection.artifactExposureState,
      reminder_exposure: projection.reminderExposureState,
      route_freeze_state: projection.routeFreezeState,
      reservation_truth: projection.selectedReservationTruth.truthState,
      primary_action: projection.primaryAction?.actionRef ?? "none",
    };
  });
}

export function confirmationAtlasScenarios() {
  return patientBookingConfirmationScenarioIds.map((scenarioId) => {
    const projection = resolveBookingConfirmationProjectionByScenarioId(scenarioId)!;
    return {
      scenarioId: projection.scenarioId,
      bookingCaseId: projection.bookingCaseId,
      viewKind: projection.viewKind,
      confirmationTruthState: projection.confirmationTruthState,
      patientVisibilityState: projection.patientVisibilityState,
      routeFreezeState: projection.routeFreezeState,
      reservationTruth: projection.selectedReservationTruth.truthState,
      headline: projection.stateHeading,
      ribbonLabel: projection.ribbonLabel,
    };
  });
}

export function bookingConfirmationContractSummary() {
  return {
    taskId: PATIENT_BOOKING_CONFIRMATION_TASK_ID,
    visualMode: PATIENT_BOOKING_CONFIRMATION_VISUAL_MODE,
    routes: [
      {
        path: "/bookings/:bookingCaseId/confirm",
        purpose:
          "Render review, in-progress, pending, recovery, and confirmed booking child states inside the same booking shell.",
      },
    ],
    uiPrimitives: [
      "BookingConfirmReviewStage",
      "BookingInProgressState",
      "ConfirmationPendingState",
      "ReconciliationRecoveryState",
      "BookedSummaryChildState",
      "SelectedSlotProvenanceCard",
      "ConfirmationProgressStrip",
      "BookedSummaryMiniList",
      "RecoveryActionPanel",
      "ArtifactSummaryStub",
    ],
    domMarkers: [
      "data-confirmation-truth",
      "data-patient-visibility",
      "data-manage-exposure",
      "data-artifact-exposure",
      "data-route-freeze-state",
      "data-reminder-exposure",
      "data-selected-slot",
      "data-reservation-truth",
    ],
    confirmationTruthStates: [
      "pre_commit_review",
      "booking_in_progress",
      "confirmation_pending",
      "reconciliation_required",
      "confirmed",
      "failed",
      "expired",
      "superseded",
    ],
    scenarioIds: [...patientBookingConfirmationScenarioIds],
  };
}
