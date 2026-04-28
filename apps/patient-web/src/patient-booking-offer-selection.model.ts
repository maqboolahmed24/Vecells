import {
  patientReasonCueLabel,
  resolveBookingSlotResultsProjectionByScenarioId,
  type BookingSlotResultsProjection,
  type BookingSlotSummaryProjection,
  type CapacityReasonCueRef,
} from "./patient-booking-slot-results.model";

export const PATIENT_BOOKING_OFFER_SELECTION_TASK_ID =
  "par_295_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_offer_selection_flow_with_truthful_hold_posture";
export const PATIENT_BOOKING_OFFER_SELECTION_VISUAL_MODE = "Offer_Selection_Studio";

export type ReservationTruthState =
  | "exclusive_held"
  | "truthful_nonexclusive"
  | "pending_confirmation"
  | "confirmed"
  | "disputed"
  | "released"
  | "expired"
  | "revalidation_required"
  | "unavailable";
export type ReservationDisplayExclusivityState = "exclusive" | "nonexclusive" | "none";
export type ReservationCountdownMode = "none" | "hold_expiry";
export type OfferSelectionCompareMode = "closed" | "open";

export interface OfferSelectionReservationTruthProjection {
  readonly reservationTruthProjectionId: string;
  readonly slotSummaryId: string;
  readonly truthState: ReservationTruthState;
  readonly displayExclusivityState: ReservationDisplayExclusivityState;
  readonly countdownMode: ReservationCountdownMode;
  readonly exclusiveUntilAt: string | null;
  readonly truthBasisHash: string;
  readonly reasonRefs: readonly string[];
  readonly dominantCue: string;
}

export interface OfferSelectionProjection {
  readonly projectionName: "OfferSelectionProjection";
  readonly scenarioId: string;
  readonly bookingCaseId: string;
  readonly slotResultsScenarioId: string;
  readonly referenceNowAt: string;
  readonly referenceNowLabel: string;
  readonly selectedSlotId: string | null;
  readonly compareSlotIds: readonly string[];
  readonly compareLimit: number;
  readonly compareMode: OfferSelectionCompareMode;
  readonly defaultExpandedSlotId: string | null;
  readonly refreshProjectionRef: string | null;
  readonly reservationTruthBySlotId: Readonly<Record<string, OfferSelectionReservationTruthProjection>>;
  readonly selectionNarrative: string;
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

function buildTruth(input: {
  slotSummaryId: string;
  truthState: ReservationTruthState;
  displayExclusivityState: ReservationDisplayExclusivityState;
  countdownMode: ReservationCountdownMode;
  exclusiveUntilAt?: string | null;
  dominantCue: string;
  reasonRefs?: readonly string[];
}): OfferSelectionReservationTruthProjection {
  return {
    reservationTruthProjectionId: `reservation_truth_${input.slotSummaryId}`,
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

function buildTruthMap(
  slots: readonly BookingSlotSummaryProjection[],
  selectedTruth: OfferSelectionReservationTruthProjection | null,
): Readonly<Record<string, OfferSelectionReservationTruthProjection>> {
  return Object.fromEntries(
    slots.map((slot) => {
      const truth =
        selectedTruth?.slotSummaryId === slot.slotSummaryId
          ? selectedTruth
          : buildTruth({
              slotSummaryId: slot.slotSummaryId,
              truthState: "truthful_nonexclusive",
              displayExclusivityState: "nonexclusive",
              countdownMode: "none",
              dominantCue: "Not held yet. Availability is confirmed when you continue.",
              reasonRefs: ["ranked_snapshot_result"],
            });
      return [slot.slotSummaryId, truth];
    }),
  );
}

function buildProjection(input: {
  scenarioId: string;
  bookingCaseId: string;
  slotResultsScenarioId: string;
  referenceNowAt: string;
  referenceNowLabel: string;
  selectedSlotId: string | null;
  compareSlotIds: readonly string[];
  compareLimit?: number;
  compareMode?: OfferSelectionCompareMode;
  defaultExpandedSlotId?: string | null;
  refreshProjectionRef?: string | null;
  selectedTruth?: OfferSelectionReservationTruthProjection | null;
  selectionNarrative: string;
}): OfferSelectionProjection {
  const slotResults = requireSlotResultsProjection(input.slotResultsScenarioId);
  return {
    projectionName: "OfferSelectionProjection",
    scenarioId: input.scenarioId,
    bookingCaseId: input.bookingCaseId,
    slotResultsScenarioId: input.slotResultsScenarioId,
    referenceNowAt: input.referenceNowAt,
    referenceNowLabel: input.referenceNowLabel,
    selectedSlotId: input.selectedSlotId,
    compareSlotIds: input.compareSlotIds,
    compareLimit: input.compareLimit ?? 2,
    compareMode: input.compareMode ?? "closed",
    defaultExpandedSlotId: input.defaultExpandedSlotId ?? input.selectedSlotId,
    refreshProjectionRef: input.refreshProjectionRef ?? null,
    reservationTruthBySlotId: buildTruthMap(slotResults.slots, input.selectedTruth ?? null),
    selectionNarrative: input.selectionNarrative,
  };
}

const projectionsByScenario = {
  booking_case_295_nonexclusive: buildProjection({
    scenarioId: "booking_case_295_nonexclusive",
    bookingCaseId: "booking_case_295_nonexclusive",
    slotResultsScenarioId: "booking_case_294_renderable",
    referenceNowAt: "2026-04-19T08:27:00Z",
    referenceNowLabel: "08:27",
    selectedSlotId: "slot_summary_294_222_1120",
    compareSlotIds: ["slot_summary_294_211_0910", "slot_summary_294_222_1410"],
    selectedTruth: buildTruth({
      slotSummaryId: "slot_summary_294_222_1120",
      truthState: "truthful_nonexclusive",
      displayExclusivityState: "nonexclusive",
      countdownMode: "none",
      dominantCue: "This time is not held yet. We confirm it when you continue.",
      reasonRefs: ["truthful_nonexclusive", "ranked_snapshot_result"],
    }),
    selectionNarrative:
      "Selected does not mean held. This surface keeps the chosen slot pinned while you compare or continue.",
  }),
  booking_case_295_exclusive_hold: buildProjection({
    scenarioId: "booking_case_295_exclusive_hold",
    bookingCaseId: "booking_case_295_exclusive_hold",
    slotResultsScenarioId: "booking_case_294_renderable",
    referenceNowAt: "2026-04-19T08:27:00Z",
    referenceNowLabel: "08:27",
    selectedSlotId: "slot_summary_294_211_0910",
    compareSlotIds: ["slot_summary_294_222_1120"],
    selectedTruth: buildTruth({
      slotSummaryId: "slot_summary_294_211_0910",
      truthState: "exclusive_held",
      displayExclusivityState: "exclusive",
      countdownMode: "hold_expiry",
      exclusiveUntilAt: "2026-04-19T08:39:00Z",
      dominantCue: "Held for you until the real hold expiry.",
      reasonRefs: ["exclusive_hold", "real_supplier_hold"],
    }),
    selectionNarrative:
      "Only a real held reservation may show an expiry countdown or held-for-you language.",
  }),
  booking_case_295_checking: buildProjection({
    scenarioId: "booking_case_295_checking",
    bookingCaseId: "booking_case_295_checking",
    slotResultsScenarioId: "booking_case_294_partial",
    referenceNowAt: "2026-04-19T08:24:00Z",
    referenceNowLabel: "08:24",
    selectedSlotId: "slot_summary_294_222_0845",
    compareSlotIds: ["slot_summary_294_211_0910"],
    selectedTruth: buildTruth({
      slotSummaryId: "slot_summary_294_222_0845",
      truthState: "pending_confirmation",
      displayExclusivityState: "none",
      countdownMode: "none",
      dominantCue: "We're checking this time before confirmation.",
      reasonRefs: ["pending_confirmation", "authoritative_read_pending"],
    }),
    selectionNarrative:
      "Checking posture stays calm and explicit. The slot is selected, but the system is still settling supplier truth.",
  }),
  booking_case_295_unavailable: buildProjection({
    scenarioId: "booking_case_295_unavailable",
    bookingCaseId: "booking_case_295_unavailable",
    slotResultsScenarioId: "booking_case_294_renderable",
    referenceNowAt: "2026-04-19T08:31:00Z",
    referenceNowLabel: "08:31",
    selectedSlotId: "slot_summary_294_211_1330",
    compareSlotIds: ["slot_summary_294_222_1120"],
    selectedTruth: buildTruth({
      slotSummaryId: "slot_summary_294_211_1330",
      truthState: "expired",
      displayExclusivityState: "none",
      countdownMode: "none",
      exclusiveUntilAt: "2026-04-19T08:25:00Z",
      dominantCue: "This selected time is no longer available.",
      reasonRefs: ["reservation_expired", "select_another_slot"],
    }),
    selectionNarrative:
      "The chosen slot remains visible as provenance when truth says it expired or became unavailable.",
  }),
  booking_case_295_stale: buildProjection({
    scenarioId: "booking_case_295_stale",
    bookingCaseId: "booking_case_295_stale",
    slotResultsScenarioId: "booking_case_294_stale",
    referenceNowAt: "2026-04-19T08:14:00Z",
    referenceNowLabel: "08:14",
    selectedSlotId: "slot_summary_294_222_1120",
    compareSlotIds: ["slot_summary_294_222_1410"],
    refreshProjectionRef: "booking_case_295_nonexclusive_refreshed",
    selectedTruth: buildTruth({
      slotSummaryId: "slot_summary_294_222_1120",
      truthState: "revalidation_required",
      displayExclusivityState: "none",
      countdownMode: "none",
      dominantCue: "Refresh the snapshot before you continue with this time.",
      reasonRefs: ["snapshot_expired", "revalidation_required"],
    }),
    selectionNarrative:
      "Selection stays pinned during stale recovery, but action controls freeze until a fresh snapshot lands.",
  }),
  booking_case_295_nonexclusive_refreshed: buildProjection({
    scenarioId: "booking_case_295_nonexclusive_refreshed",
    bookingCaseId: "booking_case_295_stale",
    slotResultsScenarioId: "booking_case_294_refresh_complete",
    referenceNowAt: "2026-04-19T08:28:00Z",
    referenceNowLabel: "08:28",
    selectedSlotId: "slot_summary_294_222_1120",
    compareSlotIds: ["slot_summary_294_222_1410"],
    selectedTruth: buildTruth({
      slotSummaryId: "slot_summary_294_222_1120",
      truthState: "truthful_nonexclusive",
      displayExclusivityState: "nonexclusive",
      countdownMode: "none",
      dominantCue: "Snapshot refreshed. Availability is confirmed when you continue.",
      reasonRefs: ["refresh_complete", "truthful_nonexclusive"],
    }),
    selectionNarrative:
      "A refresh restores writable selection without changing the selected-slot anchor or compare context.",
  }),
  booking_case_295_no_supply: buildProjection({
    scenarioId: "booking_case_295_no_supply",
    bookingCaseId: "booking_case_295_no_supply",
    slotResultsScenarioId: "booking_case_294_no_supply",
    referenceNowAt: "2026-04-19T08:17:00Z",
    referenceNowLabel: "08:17",
    selectedSlotId: null,
    compareSlotIds: [],
    selectionNarrative:
      "No local self-service slot is selected because this completed search returned no local supply.",
  }),
  booking_case_295_support_fallback: buildProjection({
    scenarioId: "booking_case_295_support_fallback",
    bookingCaseId: "booking_case_295_support_fallback",
    slotResultsScenarioId: "booking_case_294_fallback",
    referenceNowAt: "2026-04-19T08:12:00Z",
    referenceNowLabel: "08:12",
    selectedSlotId: null,
    compareSlotIds: [],
    selectionNarrative:
      "Selection context yields to the supported fallback when supplier recovery does not complete cleanly.",
  }),
} as const satisfies Record<string, OfferSelectionProjection>;

const scenarioAlias: Record<string, keyof typeof projectionsByScenario> = {
  booking_case_293_live: "booking_case_295_nonexclusive",
  booking_case_293_degraded: "booking_case_295_checking",
  booking_case_293_recovery: "booking_case_295_stale",
  booking_case_294_renderable: "booking_case_295_nonexclusive",
  booking_case_294_partial: "booking_case_295_checking",
  booking_case_294_stale: "booking_case_295_stale",
  booking_case_294_refresh_complete: "booking_case_295_nonexclusive_refreshed",
  booking_case_294_no_supply: "booking_case_295_no_supply",
  booking_case_294_fallback: "booking_case_295_support_fallback",
};

export const patientBookingOfferSelectionScenarioIds = Object.keys(
  projectionsByScenario,
).filter((scenarioId) => scenarioId !== "booking_case_295_nonexclusive_refreshed");

export function resolveOfferSelectionProjection(
  bookingCaseId: string,
): OfferSelectionProjection | null {
  const scenarioId = scenarioAlias[bookingCaseId] ?? bookingCaseId;
  return projectionsByScenario[scenarioId as keyof typeof projectionsByScenario] ?? null;
}

export function resolveOfferSelectionProjectionByScenarioId(
  scenarioId: string,
): OfferSelectionProjection | null {
  return projectionsByScenario[scenarioId as keyof typeof projectionsByScenario] ?? null;
}

export function resolveOfferSelectionSlot(
  slotResults: BookingSlotResultsProjection,
  slotSummaryId: string | null,
): BookingSlotSummaryProjection | null {
  if (!slotSummaryId) {
    return null;
  }
  return slotResults.slots.find((slot) => slot.slotSummaryId === slotSummaryId) ?? null;
}

export function selectedRankCueRef(
  slot: BookingSlotSummaryProjection | null,
): CapacityReasonCueRef | null {
  return slot?.patientReasonCueRefs[0] ?? null;
}

export function selectedRankCueLabel(
  slot: BookingSlotSummaryProjection | null,
): string | null {
  const cue = selectedRankCueRef(slot);
  return cue ? patientReasonCueLabel(cue) : null;
}

export function offerSelectionStateMatrix(): Array<Record<string, string>> {
  return patientBookingOfferSelectionScenarioIds.map((scenarioId) => {
    const projection = resolveOfferSelectionProjectionByScenarioId(scenarioId)!;
    const slotResults = requireSlotResultsProjection(projection.slotResultsScenarioId);
    const selectedTruth =
      projection.selectedSlotId ? projection.reservationTruthBySlotId[projection.selectedSlotId] : null;
    return {
      scenario_id: projection.scenarioId,
      booking_case_id: projection.bookingCaseId,
      route: `/bookings/${projection.bookingCaseId}/select`,
      view_state: slotResults.viewState,
      coverage_state: slotResults.coverageState,
      selected_slot_id: projection.selectedSlotId ?? "none",
      selected_truth: selectedTruth?.truthState ?? "none",
      compare_slots: String(projection.compareSlotIds.length),
      compare_mode: projection.compareMode,
      countdown_mode: selectedTruth?.countdownMode ?? "none",
      help_visible: String(slotResults.recovery.supportHelpVisible || !projection.selectedSlotId),
      continue_state:
        selectedTruth?.truthState === "exclusive_held" ||
        selectedTruth?.truthState === "truthful_nonexclusive"
          ? "enabled"
          : slotResults.viewState === "renderable" && projection.selectedSlotId
            ? "conditional"
            : "blocked",
    };
  });
}

export function offerSelectionAtlasScenarios() {
  return patientBookingOfferSelectionScenarioIds.map((scenarioId) => {
    const projection = resolveOfferSelectionProjectionByScenarioId(scenarioId)!;
    const slotResults = requireSlotResultsProjection(projection.slotResultsScenarioId);
    return {
      scenarioId: projection.scenarioId,
      bookingCaseId: projection.bookingCaseId,
      selectedSlotId: projection.selectedSlotId,
      selectedTruth:
        projection.selectedSlotId
          ? projection.reservationTruthBySlotId[projection.selectedSlotId]?.truthState ?? "none"
          : "none",
      compareSlots: projection.compareSlotIds.length,
      viewState: slotResults.viewState,
      headline: slotResults.recovery.headline,
      selectionNarrative: projection.selectionNarrative,
    };
  });
}

export function offerSelectionContractSummary() {
  return {
    taskId: PATIENT_BOOKING_OFFER_SELECTION_TASK_ID,
    visualMode: PATIENT_BOOKING_OFFER_SELECTION_VISUAL_MODE,
    routes: ["/bookings/:bookingCaseId/select"],
    uiPrimitives: [
      "OfferSelectionStage",
      "SelectedSlotPin",
      "ReservationTruthBanner",
      "SlotCompareDrawer",
      "SlotReasonCueChip",
      "StickyConfirmTray",
      "SelectionRecoveryPanel",
    ],
    domMarkers: [
      "data-selected-slot",
      "data-reservation-truth",
      "data-countdown-mode",
      "data-compare-open",
      "data-rank-cue",
    ],
    scenarioIds: [...patientBookingOfferSelectionScenarioIds],
  };
}
