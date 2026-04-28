import {
  resolveBookingSlotResultsProjectionByScenarioId,
  type BookingSlotResultsProjection,
  type BookingSlotSummaryProjection,
} from "./patient-booking-slot-results.model";
import { type OfferSelectionReservationTruthProjection } from "./patient-booking-offer-selection.model";

export const PATIENT_WAITLIST_VIEWS_TASK_ID =
  "par_298_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_waitlist_enrolment_management_and_offer_acceptance_views";
export const PATIENT_WAITLIST_VIEWS_VISUAL_MODE = "Waitlist_Continuation_Studio";

export type WaitlistViewKind =
  | "join_sheet"
  | "manage_status"
  | "offer_actionable"
  | "accepted_pending"
  | "expired_outcome"
  | "fallback_due"
  | "contact_repair";

export type WaitlistEntryMode = "same_shell" | "secure_link";
export type WaitlistPatientVisibleState =
  | "pre_join"
  | "waiting_for_offer"
  | "offer_available"
  | "accepted_pending_booking"
  | "callback_expected"
  | "hub_review_pending"
  | "expired"
  | "closed";
export type WaitlistWindowRiskState = "none" | "on_track" | "at_risk" | "fallback_due" | "overdue";
export type WaitlistReachabilityState = "current" | "delivery_risk" | "repair_required";
export type WaitlistOfferExpiryMode = "none" | "response_window" | "expired" | "superseded";
export type WaitlistFallbackRoute = "stay_local_waitlist" | "callback" | "hub" | "booking_failed";
export type WaitlistFallbackTransferState =
  | "monitoring"
  | "armed"
  | "transfer_pending"
  | "transferred";
export type WaitlistActionRef =
  | "join_waitlist"
  | "accept_waitlist_offer"
  | "return_to_selection"
  | "keep_waitlist_active"
  | "open_newer_offer"
  | "fallback_to_callback"
  | "fallback_to_hub"
  | "repair_contact_route"
  | "open_support";

export interface WaitlistSummaryRow {
  readonly label: string;
  readonly value: string;
}

export interface WaitlistActionProjection {
  readonly actionRef: WaitlistActionRef;
  readonly label: string;
  readonly detail: string;
  readonly transitionScenarioId: string | null;
  readonly tone: "primary" | "secondary";
}

export interface WaitlistContinuationTruthProjection298 {
  readonly patientVisibleState: WaitlistPatientVisibleState;
  readonly windowRiskState: WaitlistWindowRiskState;
  readonly dominantActionRef: WaitlistActionRef;
  readonly fallbackActionRef: WaitlistActionRef | null;
  readonly nextEvaluationAt: string | null;
  readonly generatedAt: string;
}

export interface WaitlistFallbackProjection298 {
  readonly requiredFallbackRoute: WaitlistFallbackRoute;
  readonly triggerClass: string;
  readonly transferState: WaitlistFallbackTransferState;
  readonly headline: string;
  readonly body: string;
}

export interface WaitlistContactRepairProjection298 {
  readonly repairState: "not_required" | "required" | "applied";
  readonly repairEntryLabel: string;
  readonly repairBody: string;
  readonly blockedActionSummary: string;
  readonly maskedDestination: string;
  readonly channelLabel: string;
}

export interface PatientWaitlistViewProjection {
  readonly projectionName: "PatientWaitlistViewProjection";
  readonly scenarioId: string;
  readonly bookingCaseId: string;
  readonly viewKind: WaitlistViewKind;
  readonly entryMode: WaitlistEntryMode;
  readonly referenceNowAt: string;
  readonly referenceNowLabel: string;
  readonly slotResultsScenarioId: string;
  readonly activeOfferSlotId: string | null;
  readonly activeOffer: BookingSlotSummaryProjection | null;
  readonly activeReservationTruth: OfferSelectionReservationTruthProjection | null;
  readonly offerExpiryMode: WaitlistOfferExpiryMode;
  readonly offerResponseDeadlineAt: string | null;
  readonly continuationTruth: WaitlistContinuationTruthProjection298;
  readonly fallback: WaitlistFallbackProjection298;
  readonly reachabilityState: WaitlistReachabilityState;
  readonly contactRepair: WaitlistContactRepairProjection298 | null;
  readonly preferenceSummaryRows: readonly WaitlistSummaryRow[];
  readonly preferenceDisclosureRows: readonly WaitlistSummaryRow[];
  readonly statusRows: readonly WaitlistSummaryRow[];
  readonly contactRows: readonly WaitlistSummaryRow[];
  readonly stateHeading: string;
  readonly stateBody: string;
  readonly supportingNote: string;
  readonly secureLinkNote: string | null;
  readonly primaryAction: WaitlistActionProjection | null;
  readonly secondaryActions: readonly WaitlistActionProjection[];
  readonly stickyActionVisible: boolean;
  readonly liveAnnouncement: string;
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
    reservationTruthProjectionId: `waitlist_truth_${input.slotSummaryId}_${input.truthState}`,
    slotSummaryId: input.slotSummaryId,
    truthState: input.truthState,
    displayExclusivityState: input.displayExclusivityState,
    countdownMode: input.countdownMode,
    exclusiveUntilAt: input.exclusiveUntilAt ?? null,
    truthBasisHash: `waitlist_truth_basis_${input.slotSummaryId}_${input.truthState}`,
    reasonRefs: input.reasonRefs ?? [],
    dominantCue: input.dominantCue,
  };
}

function buildAction(input: {
  actionRef: WaitlistActionRef;
  label: string;
  detail: string;
  tone?: "primary" | "secondary";
  transitionScenarioId?: string | null;
}): WaitlistActionProjection {
  return {
    actionRef: input.actionRef,
    label: input.label,
    detail: input.detail,
    transitionScenarioId: input.transitionScenarioId ?? null,
    tone: input.tone ?? "secondary",
  };
}

function buildProjection(input: {
  scenarioId: string;
  bookingCaseId: string;
  viewKind: WaitlistViewKind;
  entryMode: WaitlistEntryMode;
  referenceNowAt: string;
  referenceNowLabel: string;
  slotResultsScenarioId: string;
  activeOfferSlotId?: string | null;
  activeReservationTruth?: OfferSelectionReservationTruthProjection | null;
  offerExpiryMode?: WaitlistOfferExpiryMode;
  offerResponseDeadlineAt?: string | null;
  continuationTruth: WaitlistContinuationTruthProjection298;
  fallback: WaitlistFallbackProjection298;
  reachabilityState: WaitlistReachabilityState;
  contactRepair?: WaitlistContactRepairProjection298 | null;
  preferenceSummaryRows: readonly WaitlistSummaryRow[];
  preferenceDisclosureRows: readonly WaitlistSummaryRow[];
  statusRows: readonly WaitlistSummaryRow[];
  contactRows: readonly WaitlistSummaryRow[];
  stateHeading: string;
  stateBody: string;
  supportingNote: string;
  secureLinkNote?: string | null;
  primaryAction?: WaitlistActionProjection | null;
  secondaryActions?: readonly WaitlistActionProjection[];
  stickyActionVisible?: boolean;
  liveAnnouncement: string;
}): PatientWaitlistViewProjection {
  const activeOffer = input.activeOfferSlotId
    ? requireSlot(input.slotResultsScenarioId, input.activeOfferSlotId)
    : null;

  return {
    projectionName: "PatientWaitlistViewProjection",
    scenarioId: input.scenarioId,
    bookingCaseId: input.bookingCaseId,
    viewKind: input.viewKind,
    entryMode: input.entryMode,
    referenceNowAt: input.referenceNowAt,
    referenceNowLabel: input.referenceNowLabel,
    slotResultsScenarioId: input.slotResultsScenarioId,
    activeOfferSlotId: input.activeOfferSlotId ?? null,
    activeOffer,
    activeReservationTruth: input.activeReservationTruth ?? null,
    offerExpiryMode: input.offerExpiryMode ?? "none",
    offerResponseDeadlineAt: input.offerResponseDeadlineAt ?? null,
    continuationTruth: input.continuationTruth,
    fallback: input.fallback,
    reachabilityState: input.reachabilityState,
    contactRepair: input.contactRepair ?? null,
    preferenceSummaryRows: input.preferenceSummaryRows,
    preferenceDisclosureRows: input.preferenceDisclosureRows,
    statusRows: input.statusRows,
    contactRows: input.contactRows,
    stateHeading: input.stateHeading,
    stateBody: input.stateBody,
    supportingNote: input.supportingNote,
    secureLinkNote: input.secureLinkNote ?? null,
    primaryAction: input.primaryAction ?? null,
    secondaryActions: input.secondaryActions ?? [],
    stickyActionVisible: input.stickyActionVisible ?? false,
    liveAnnouncement: input.liveAnnouncement,
  };
}

const preferenceSummaryRows = [
  { label: "Preferred site", value: "Community clinic with lift access" },
  { label: "Time of day", value: "Weekday mornings outside school drop-off" },
  { label: "Format", value: "Face-to-face first, phone if capacity changes" },
] as const satisfies readonly WaitlistSummaryRow[];

const preferenceDisclosureRows = [
  { label: "Travel", value: "Up to 25 minutes by bus or train" },
  { label: "Continuity", value: "Same dermatology team if possible" },
  { label: "Contact route", value: "SMS first, email backup already verified" },
  { label: "Fallback", value: "Callback is acceptable if local waitlist can no longer stay safe" },
] as const satisfies readonly WaitlistSummaryRow[];

const waitingContactRows = [
  { label: "Offer route", value: "SMS to ending 0742" },
  { label: "Backup route", value: "Email to samira.ahmed@example.com" },
  { label: "Repair status", value: "Current and verified" },
] as const satisfies readonly WaitlistSummaryRow[];

const repairContactRows = [
  { label: "Offer route", value: "SMS to ending 0742" },
  { label: "Backup route", value: "Email to samira.ahmed@example.com" },
  { label: "Repair status", value: "Reply route blocked until repaired" },
] as const satisfies readonly WaitlistSummaryRow[];

const stayLocalFallback: WaitlistFallbackProjection298 = {
  requiredFallbackRoute: "stay_local_waitlist",
  triggerClass: "none",
  transferState: "monitoring",
  headline: "Local waitlist is still the current safe path.",
  body:
    "The system keeps this request on the local waitlist and rechecks released capacity without losing your current preference summary.",
};

const callbackFallbackArmed: WaitlistFallbackProjection298 = {
  requiredFallbackRoute: "callback",
  triggerClass: "no_safe_laxity",
  transferState: "armed",
  headline: "A callback path now needs to take over.",
  body:
    "Local waitlist can no longer stay ahead of the deadline, so the next safe step is a governed callback rather than indefinite waiting.",
};

const callbackFallbackTransferred: WaitlistFallbackProjection298 = {
  requiredFallbackRoute: "callback",
  triggerClass: "policy_cutoff",
  transferState: "transferred",
  headline: "A callback path is already carrying this request.",
  body:
    "The local waitlist context is preserved here as provenance, but callback coordination is now the governing continuation object.",
};

const contactRepairProjection: WaitlistContactRepairProjection298 = {
  repairState: "required",
  repairEntryLabel: "Repair contact route",
  repairBody:
    "Offer acceptance is fenced until the message route is repaired. We keep the active offer context in place so you do not lose it while you fix the route.",
  blockedActionSummary: "Accept offer is blocked because the current reply route has bounced.",
  maskedDestination: "SMS to ending 0742",
  channelLabel: "SMS",
};

const projectionsByScenario = {
  booking_case_298_join_sheet: buildProjection({
    scenarioId: "booking_case_298_join_sheet",
    bookingCaseId: "booking_case_298_join_sheet",
    viewKind: "join_sheet",
    entryMode: "same_shell",
    referenceNowAt: "2026-04-20T09:08:00Z",
    referenceNowLabel: "09:08",
    slotResultsScenarioId: "booking_case_294_no_supply",
    continuationTruth: {
      patientVisibleState: "pre_join",
      windowRiskState: "none",
      dominantActionRef: "join_waitlist",
      fallbackActionRef: null,
      nextEvaluationAt: null,
      generatedAt: "2026-04-20T09:08:00Z",
    },
    fallback: stayLocalFallback,
    reachabilityState: "current",
    preferenceSummaryRows,
    preferenceDisclosureRows,
    statusRows: [
      { label: "Last local search", value: "No suitable time was available" },
      { label: "Current option", value: "Join the local waitlist with these preferences" },
      { label: "Safe local window", value: "Until Friday 24 April" },
    ],
    contactRows: waitingContactRows,
    stateHeading: "Join the local waitlist with your current preferences",
    stateBody:
      "We will keep this request moving from the same shell and use the verified contact route already on file if a suitable local time is released.",
    supportingNote:
      "This stays lightweight. You are not creating a second inbox thread or losing the current request context.",
    primaryAction: buildAction({
      actionRef: "join_waitlist",
      label: "Join the waitlist",
      detail: "Keep this request active for released local capacity.",
      tone: "primary",
      transitionScenarioId: "booking_case_298_waiting",
    }),
    secondaryActions: [
      buildAction({
        actionRef: "return_to_selection",
        label: "Keep browsing results",
        detail: "Return to the last frozen results instead of joining now.",
      }),
    ],
    stickyActionVisible: true,
    liveAnnouncement: "Waitlist join sheet loaded.",
  }),
  booking_case_298_waiting: buildProjection({
    scenarioId: "booking_case_298_waiting",
    bookingCaseId: "booking_case_298_waiting",
    viewKind: "manage_status",
    entryMode: "same_shell",
    referenceNowAt: "2026-04-20T09:12:00Z",
    referenceNowLabel: "09:12",
    slotResultsScenarioId: "booking_case_294_no_supply",
    continuationTruth: {
      patientVisibleState: "waiting_for_offer",
      windowRiskState: "on_track",
      dominantActionRef: "keep_waitlist_active",
      fallbackActionRef: null,
      nextEvaluationAt: "2026-04-20T12:00:00Z",
      generatedAt: "2026-04-20T09:12:00Z",
    },
    fallback: stayLocalFallback,
    reachabilityState: "current",
    preferenceSummaryRows,
    preferenceDisclosureRows,
    statusRows: [
      { label: "Joined", value: "Today at 09:10" },
      { label: "Current state", value: "Waiting for a local offer" },
      { label: "Next evaluation", value: "Around 12:00" },
    ],
    contactRows: waitingContactRows,
    stateHeading: "You are now on the local waitlist",
    stateBody:
      "We keep this request active and compare newly released local capacity against the preference summary shown here.",
    supportingNote:
      "If local waitlist stops being the safe next step, this surface will switch to the governed fallback instead of quietly leaving you waiting.",
    secondaryActions: [
      buildAction({
        actionRef: "open_support",
        label: "Get booking help",
        detail: "Ask the practice team to help without losing the waitlist context.",
      }),
    ],
    liveAnnouncement: "You joined the local waitlist.",
  }),
  booking_case_298_waiting_at_risk: buildProjection({
    scenarioId: "booking_case_298_waiting_at_risk",
    bookingCaseId: "booking_case_298_waiting_at_risk",
    viewKind: "manage_status",
    entryMode: "same_shell",
    referenceNowAt: "2026-04-22T10:40:00Z",
    referenceNowLabel: "10:40",
    slotResultsScenarioId: "booking_case_294_no_supply",
    continuationTruth: {
      patientVisibleState: "waiting_for_offer",
      windowRiskState: "at_risk",
      dominantActionRef: "keep_waitlist_active",
      fallbackActionRef: "fallback_to_callback",
      nextEvaluationAt: "2026-04-22T13:00:00Z",
      generatedAt: "2026-04-22T10:40:00Z",
    },
    fallback: stayLocalFallback,
    reachabilityState: "current",
    preferenceSummaryRows,
    preferenceDisclosureRows,
    statusRows: [
      { label: "Joined", value: "Monday 20 April" },
      { label: "Current state", value: "Still waiting locally" },
      { label: "Risk posture", value: "At risk if no new local supply is released soon" },
    ],
    contactRows: waitingContactRows,
    stateHeading: "Local waitlist is still active, but the window is tightening",
    stateBody:
      "The system is still carrying this request locally, while tracking whether callback needs to take over before the safe local window closes.",
    supportingNote:
      "This is an at-risk posture only. It is not yet the fallback decision, so the dominant action remains waitlist status review.",
    secondaryActions: [
      buildAction({
        actionRef: "open_support",
        label: "Ask for support now",
        detail: "Use support if you do not want to wait for another local release.",
      }),
    ],
    liveAnnouncement: "Waitlist status updated to at risk.",
  }),
  booking_case_298_offer_nonexclusive: buildProjection({
    scenarioId: "booking_case_298_offer_nonexclusive",
    bookingCaseId: "booking_case_298_offer_nonexclusive",
    viewKind: "offer_actionable",
    entryMode: "same_shell",
    referenceNowAt: "2026-04-23T08:42:00Z",
    referenceNowLabel: "08:42",
    slotResultsScenarioId: "booking_case_294_renderable",
    activeOfferSlotId: "slot_summary_294_222_1120",
    activeReservationTruth: buildTruth({
      slotSummaryId: "slot_summary_294_222_1120",
      truthState: "truthful_nonexclusive",
      displayExclusivityState: "nonexclusive",
      countdownMode: "none",
      dominantCue: "This offer is not held yet. Availability is confirmed when you accept it.",
      reasonRefs: ["truthful_nonexclusive", "waitlist_offer_response_window"],
    }),
    offerExpiryMode: "response_window",
    offerResponseDeadlineAt: "2026-04-23T11:30:00Z",
    continuationTruth: {
      patientVisibleState: "offer_available",
      windowRiskState: "on_track",
      dominantActionRef: "accept_waitlist_offer",
      fallbackActionRef: null,
      nextEvaluationAt: "2026-04-23T11:30:00Z",
      generatedAt: "2026-04-23T08:42:00Z",
    },
    fallback: stayLocalFallback,
    reachabilityState: "current",
    preferenceSummaryRows,
    preferenceDisclosureRows,
    statusRows: [
      { label: "Offer status", value: "A local offer is available" },
      { label: "Response window", value: "Reply by 11:30 today" },
      { label: "Fallback debt", value: "Still armed until booking settles cleanly" },
    ],
    contactRows: waitingContactRows,
    stateHeading: "A local waitlist offer is ready to review",
    stateBody:
      "This slot matches the current preference summary. The wording stays honest because the offer is still subject to live confirmation when you accept it.",
    supportingNote:
      "The active offer card remains pinned through accept, pending confirmation, expiry, supersession, or fallback.",
    primaryAction: buildAction({
      actionRef: "accept_waitlist_offer",
      label: "Accept this offer",
      detail: "Continue with the current local offer.",
      tone: "primary",
      transitionScenarioId: "booking_case_298_offer_pending",
    }),
    secondaryActions: [
      buildAction({
        actionRef: "open_support",
        label: "Need booking help?",
        detail: "Ask the practice team to review the offer with you.",
      }),
    ],
    stickyActionVisible: true,
    liveAnnouncement: "A nonexclusive waitlist offer is available.",
  }),
  booking_case_298_offer_held: buildProjection({
    scenarioId: "booking_case_298_offer_held",
    bookingCaseId: "booking_case_298_offer_held",
    viewKind: "offer_actionable",
    entryMode: "same_shell",
    referenceNowAt: "2026-04-23T08:45:00Z",
    referenceNowLabel: "08:45",
    slotResultsScenarioId: "booking_case_294_renderable",
    activeOfferSlotId: "slot_summary_294_211_0910",
    activeReservationTruth: buildTruth({
      slotSummaryId: "slot_summary_294_211_0910",
      truthState: "exclusive_held",
      displayExclusivityState: "exclusive",
      countdownMode: "hold_expiry",
      exclusiveUntilAt: "2026-04-23T09:02:00Z",
      dominantCue: "This offer is really held for you until the supplier hold expires.",
      reasonRefs: ["exclusive_hold", "waitlist_offer_hold"],
    }),
    offerExpiryMode: "response_window",
    offerResponseDeadlineAt: "2026-04-23T09:02:00Z",
    continuationTruth: {
      patientVisibleState: "offer_available",
      windowRiskState: "on_track",
      dominantActionRef: "accept_waitlist_offer",
      fallbackActionRef: null,
      nextEvaluationAt: "2026-04-23T09:02:00Z",
      generatedAt: "2026-04-23T08:45:00Z",
    },
    fallback: stayLocalFallback,
    reachabilityState: "current",
    preferenceSummaryRows,
    preferenceDisclosureRows,
    statusRows: [
      { label: "Offer status", value: "Held for you with a real supplier hold" },
      { label: "Hold ends", value: "09:02 today" },
      { label: "Fallback debt", value: "Still armed until booking settles cleanly" },
    ],
    contactRows: waitingContactRows,
    stateHeading: "A held local offer is ready now",
    stateBody:
      "This is the exclusive-hold case. The countdown reflects a real supplier hold rather than a generic response timer.",
    supportingNote:
      "If that hold expires or the offer is superseded, the same card stays visible as read-only provenance.",
    primaryAction: buildAction({
      actionRef: "accept_waitlist_offer",
      label: "Accept this held offer",
      detail: "Continue while the real supplier hold is still active.",
      tone: "primary",
      transitionScenarioId: "booking_case_298_offer_pending",
    }),
    stickyActionVisible: true,
    liveAnnouncement: "A held waitlist offer is available.",
  }),
  booking_case_298_offer_pending: buildProjection({
    scenarioId: "booking_case_298_offer_pending",
    bookingCaseId: "booking_case_298_offer_pending",
    viewKind: "accepted_pending",
    entryMode: "same_shell",
    referenceNowAt: "2026-04-23T08:49:00Z",
    referenceNowLabel: "08:49",
    slotResultsScenarioId: "booking_case_294_renderable",
    activeOfferSlotId: "slot_summary_294_222_1120",
    activeReservationTruth: buildTruth({
      slotSummaryId: "slot_summary_294_222_1120",
      truthState: "pending_confirmation",
      displayExclusivityState: "none",
      countdownMode: "none",
      dominantCue: "This accepted offer is still waiting for booking confirmation.",
      reasonRefs: ["pending_confirmation", "accepted_waitlist_offer"],
    }),
    offerExpiryMode: "none",
    continuationTruth: {
      patientVisibleState: "accepted_pending_booking",
      windowRiskState: "on_track",
      dominantActionRef: "keep_waitlist_active",
      fallbackActionRef: null,
      nextEvaluationAt: "2026-04-23T08:55:00Z",
      generatedAt: "2026-04-23T08:49:00Z",
    },
    fallback: stayLocalFallback,
    reachabilityState: "current",
    preferenceSummaryRows,
    preferenceDisclosureRows,
    statusRows: [
      { label: "Accepted", value: "Today at 08:48" },
      { label: "Current state", value: "Accepted and waiting for booking confirmation" },
      { label: "Fallback debt", value: "Still armed until confirmation truth settles" },
    ],
    contactRows: waitingContactRows,
    stateHeading: "Your accepted offer is still settling",
    stateBody:
      "The slot stays pinned while the booking core confirms supplier truth. This is not yet a calm booked state.",
    supportingNote:
      "Manage, artifact, and reminder posture stay suppressed until authoritative confirmation truth says they can open.",
    secondaryActions: [
      buildAction({
        actionRef: "open_support",
        label: "Get booking help",
        detail: "Ask the practice team to check the current pending state.",
      }),
    ],
    liveAnnouncement: "Waitlist offer accepted. Confirmation is still pending.",
  }),
  booking_case_298_offer_expired: buildProjection({
    scenarioId: "booking_case_298_offer_expired",
    bookingCaseId: "booking_case_298_offer_expired",
    viewKind: "expired_outcome",
    entryMode: "same_shell",
    referenceNowAt: "2026-04-23T11:37:00Z",
    referenceNowLabel: "11:37",
    slotResultsScenarioId: "booking_case_294_renderable",
    activeOfferSlotId: "slot_summary_294_222_1120",
    activeReservationTruth: buildTruth({
      slotSummaryId: "slot_summary_294_222_1120",
      truthState: "expired",
      displayExclusivityState: "none",
      countdownMode: "none",
      dominantCue: "The response window for this offer has ended.",
      reasonRefs: ["offer_expired", "waitlist_provenance_only"],
      exclusiveUntilAt: "2026-04-23T11:30:00Z",
    }),
    offerExpiryMode: "expired",
    offerResponseDeadlineAt: "2026-04-23T11:30:00Z",
    continuationTruth: {
      patientVisibleState: "expired",
      windowRiskState: "on_track",
      dominantActionRef: "keep_waitlist_active",
      fallbackActionRef: null,
      nextEvaluationAt: "2026-04-23T14:00:00Z",
      generatedAt: "2026-04-23T11:37:00Z",
    },
    fallback: stayLocalFallback,
    reachabilityState: "current",
    preferenceSummaryRows,
    preferenceDisclosureRows,
    statusRows: [
      { label: "Offer status", value: "Expired at 11:30 today" },
      { label: "Current continuation", value: "Context kept as read-only provenance" },
      { label: "Next evaluation", value: "Around 14:00" },
    ],
    contactRows: waitingContactRows,
    stateHeading: "That offer has expired",
    stateBody:
      "The active offer stays visible as provenance so you can see exactly what was offered, even though it can no longer be accepted.",
    supportingNote:
      "The next safe step is to keep the waitlist active or ask for support. The UI does not quietly remove the expired offer.",
    primaryAction: buildAction({
      actionRef: "keep_waitlist_active",
      label: "Keep the waitlist active",
      detail: "Stay on the local waitlist for the next suitable release.",
      tone: "primary",
      transitionScenarioId: "booking_case_298_waiting",
    }),
    secondaryActions: [
      buildAction({
        actionRef: "return_to_selection",
        label: "Browse current results",
        detail: "Return to the last frozen results instead of waiting.",
      }),
    ],
    liveAnnouncement: "The waitlist offer expired and remains visible as provenance.",
  }),
  booking_case_298_offer_superseded: buildProjection({
    scenarioId: "booking_case_298_offer_superseded",
    bookingCaseId: "booking_case_298_offer_superseded",
    viewKind: "expired_outcome",
    entryMode: "same_shell",
    referenceNowAt: "2026-04-23T10:14:00Z",
    referenceNowLabel: "10:14",
    slotResultsScenarioId: "booking_case_294_renderable",
    activeOfferSlotId: "slot_summary_294_211_1330",
    activeReservationTruth: buildTruth({
      slotSummaryId: "slot_summary_294_211_1330",
      truthState: "released",
      displayExclusivityState: "none",
      countdownMode: "none",
      dominantCue: "This offer was replaced by a fresher local option.",
      reasonRefs: ["offer_superseded", "provenance_only"],
    }),
    offerExpiryMode: "superseded",
    offerResponseDeadlineAt: "2026-04-23T10:05:00Z",
    continuationTruth: {
      patientVisibleState: "offer_available",
      windowRiskState: "on_track",
      dominantActionRef: "open_newer_offer",
      fallbackActionRef: null,
      nextEvaluationAt: "2026-04-23T12:00:00Z",
      generatedAt: "2026-04-23T10:14:00Z",
    },
    fallback: stayLocalFallback,
    reachabilityState: "current",
    preferenceSummaryRows,
    preferenceDisclosureRows,
    statusRows: [
      { label: "Offer status", value: "Superseded by a newer local option" },
      { label: "Current continuation", value: "A fresher offer is now the live continuation" },
      { label: "Expired window", value: "The earlier response window ended at 10:05" },
    ],
    contactRows: waitingContactRows,
    stateHeading: "That earlier offer was replaced",
    stateBody:
      "We keep the superseded offer visible as read-only provenance and move the dominant action to the newer live offer instead of silently switching context.",
    supportingNote:
      "Superseded and expired are different states. This route keeps them distinct so the patient can see what changed.",
    primaryAction: buildAction({
      actionRef: "open_newer_offer",
      label: "Open the newer offer",
      detail: "Continue with the live offer instead of the superseded one.",
      tone: "primary",
      transitionScenarioId: "booking_case_298_offer_nonexclusive",
    }),
    liveAnnouncement: "The earlier waitlist offer was superseded by a newer option.",
  }),
  booking_case_298_fallback_due: buildProjection({
    scenarioId: "booking_case_298_fallback_due",
    bookingCaseId: "booking_case_298_fallback_due",
    viewKind: "fallback_due",
    entryMode: "same_shell",
    referenceNowAt: "2026-04-24T15:20:00Z",
    referenceNowLabel: "15:20",
    slotResultsScenarioId: "booking_case_294_no_supply",
    continuationTruth: {
      patientVisibleState: "waiting_for_offer",
      windowRiskState: "fallback_due",
      dominantActionRef: "fallback_to_callback",
      fallbackActionRef: "fallback_to_callback",
      nextEvaluationAt: "2026-04-24T15:30:00Z",
      generatedAt: "2026-04-24T15:20:00Z",
    },
    fallback: callbackFallbackArmed,
    reachabilityState: "current",
    preferenceSummaryRows,
    preferenceDisclosureRows,
    statusRows: [
      { label: "Current state", value: "Local waitlist is no longer the next safe step" },
      { label: "Fallback route", value: "Governed callback is now due" },
      { label: "Reason", value: "No safe local slack remains before the deadline" },
    ],
    contactRows: waitingContactRows,
    stateHeading: "The next safe step is callback fallback",
    stateBody:
      "The waitlist preference summary stays visible, but the dominant action switches away from waiting because local continuation is no longer safe.",
    supportingNote:
      "This closes the indefinite-waitlist gap: the UI does not pretend you are still simply waiting once fallback becomes due.",
    primaryAction: buildAction({
      actionRef: "fallback_to_callback",
      label: "Request a callback instead",
      detail: "Move this request onto the governed callback path.",
      tone: "primary",
      transitionScenarioId: "booking_case_298_overdue_callback",
    }),
    secondaryActions: [
      buildAction({
        actionRef: "open_support",
        label: "Get booking help",
        detail: "Ask the practice team to review the safest continuation.",
      }),
    ],
    stickyActionVisible: true,
    liveAnnouncement: "Local waitlist fallback is now due.",
  }),
  booking_case_298_overdue_callback: buildProjection({
    scenarioId: "booking_case_298_overdue_callback",
    bookingCaseId: "booking_case_298_overdue_callback",
    viewKind: "fallback_due",
    entryMode: "same_shell",
    referenceNowAt: "2026-04-24T15:36:00Z",
    referenceNowLabel: "15:36",
    slotResultsScenarioId: "booking_case_294_no_supply",
    continuationTruth: {
      patientVisibleState: "callback_expected",
      windowRiskState: "overdue",
      dominantActionRef: "open_support",
      fallbackActionRef: "fallback_to_callback",
      nextEvaluationAt: "2026-04-24T16:00:00Z",
      generatedAt: "2026-04-24T15:36:00Z",
    },
    fallback: callbackFallbackTransferred,
    reachabilityState: "current",
    preferenceSummaryRows,
    preferenceDisclosureRows,
    statusRows: [
      { label: "Current state", value: "Callback expected" },
      { label: "Transfer state", value: "Transferred at 15:34 today" },
      { label: "Local waitlist posture", value: "Closed as the governing continuation" },
    ],
    contactRows: waitingContactRows,
    stateHeading: "A callback path is now carrying this request",
    stateBody:
      "The local waitlist context remains here as provenance, while the callback path becomes the governing continuation for the next step.",
    supportingNote:
      "Offer acceptance stays suppressed in this overdue posture even if a previous offer card is still visible as history.",
    secondaryActions: [
      buildAction({
        actionRef: "open_support",
        label: "Review callback details",
        detail: "Open support if you need help with the transferred callback path.",
      }),
    ],
    liveAnnouncement: "Callback fallback now governs this waitlist continuation.",
  }),
  booking_case_298_contact_repair: buildProjection({
    scenarioId: "booking_case_298_contact_repair",
    bookingCaseId: "booking_case_298_contact_repair",
    viewKind: "contact_repair",
    entryMode: "same_shell",
    referenceNowAt: "2026-04-23T08:58:00Z",
    referenceNowLabel: "08:58",
    slotResultsScenarioId: "booking_case_294_renderable",
    activeOfferSlotId: "slot_summary_294_222_1120",
    activeReservationTruth: buildTruth({
      slotSummaryId: "slot_summary_294_222_1120",
      truthState: "truthful_nonexclusive",
      displayExclusivityState: "nonexclusive",
      countdownMode: "none",
      dominantCue: "This live offer remains visible, but acceptance is blocked until the contact route is repaired.",
      reasonRefs: ["truthful_nonexclusive", "reachability_blocked"],
    }),
    offerExpiryMode: "response_window",
    offerResponseDeadlineAt: "2026-04-23T11:30:00Z",
    continuationTruth: {
      patientVisibleState: "offer_available",
      windowRiskState: "on_track",
      dominantActionRef: "repair_contact_route",
      fallbackActionRef: null,
      nextEvaluationAt: "2026-04-23T11:30:00Z",
      generatedAt: "2026-04-23T08:58:00Z",
    },
    fallback: stayLocalFallback,
    reachabilityState: "repair_required",
    contactRepair: contactRepairProjection,
    preferenceSummaryRows,
    preferenceDisclosureRows,
    statusRows: [
      { label: "Offer status", value: "Live offer still visible" },
      { label: "Acceptance", value: "Blocked by contact-route repair" },
      { label: "Current fallback debt", value: "Still armed until booking or transfer settles" },
    ],
    contactRows: repairContactRows,
    stateHeading: "Repair the contact route before this offer can continue",
    stateBody:
      "The offer and preference summary stay in the same viewport, but the dominant action switches to contact repair because reply movement is blocked.",
    supportingNote:
      "This closes the detached-contact-repair gap: repair happens in place with the blocked offer context still visible.",
    primaryAction: buildAction({
      actionRef: "repair_contact_route",
      label: "Repair contact route",
      detail: "Restore the reply path without leaving the waitlist continuation.",
      tone: "primary",
      transitionScenarioId: "booking_case_298_contact_repair_resolved",
    }),
    secondaryActions: [
      buildAction({
        actionRef: "open_support",
        label: "Need booking help?",
        detail: "Ask the practice team to help if you cannot repair the route now.",
      }),
    ],
    stickyActionVisible: true,
    liveAnnouncement: "Contact route repair is now required before the offer can continue.",
  }),
  booking_case_298_contact_repair_resolved: buildProjection({
    scenarioId: "booking_case_298_contact_repair_resolved",
    bookingCaseId: "booking_case_298_contact_repair_resolved",
    viewKind: "offer_actionable",
    entryMode: "same_shell",
    referenceNowAt: "2026-04-23T09:02:00Z",
    referenceNowLabel: "09:02",
    slotResultsScenarioId: "booking_case_294_renderable",
    activeOfferSlotId: "slot_summary_294_222_1120",
    activeReservationTruth: buildTruth({
      slotSummaryId: "slot_summary_294_222_1120",
      truthState: "truthful_nonexclusive",
      displayExclusivityState: "nonexclusive",
      countdownMode: "none",
      dominantCue: "The route is repaired and this offer can continue again.",
      reasonRefs: ["truthful_nonexclusive", "contact_route_repaired"],
    }),
    offerExpiryMode: "response_window",
    offerResponseDeadlineAt: "2026-04-23T11:30:00Z",
    continuationTruth: {
      patientVisibleState: "offer_available",
      windowRiskState: "on_track",
      dominantActionRef: "accept_waitlist_offer",
      fallbackActionRef: null,
      nextEvaluationAt: "2026-04-23T11:30:00Z",
      generatedAt: "2026-04-23T09:02:00Z",
    },
    fallback: stayLocalFallback,
    reachabilityState: "current",
    preferenceSummaryRows,
    preferenceDisclosureRows,
    statusRows: [
      { label: "Offer status", value: "Live offer restored after repair" },
      { label: "Reply route", value: "Current and verified again" },
      { label: "Response window", value: "Reply by 11:30 today" },
    ],
    contactRows: waitingContactRows,
    stateHeading: "The route is repaired and the offer is live again",
    stateBody:
      "The same offer context remains pinned, but the dominant action now returns to acceptance because the contact route is healthy again.",
    supportingNote:
      "Repair resolution does not fabricate a new offer or detach the patient into a different shell.",
    primaryAction: buildAction({
      actionRef: "accept_waitlist_offer",
      label: "Accept this offer",
      detail: "Continue now that the reply route is healthy again.",
      tone: "primary",
      transitionScenarioId: "booking_case_298_offer_pending",
    }),
    stickyActionVisible: true,
    liveAnnouncement: "Contact route repaired. The live offer can continue again.",
  }),
  booking_case_298_contact_repair_secure: buildProjection({
    scenarioId: "booking_case_298_contact_repair_secure",
    bookingCaseId: "booking_case_298_contact_repair_secure",
    viewKind: "contact_repair",
    entryMode: "secure_link",
    referenceNowAt: "2026-04-23T08:58:00Z",
    referenceNowLabel: "08:58",
    slotResultsScenarioId: "booking_case_294_renderable",
    activeOfferSlotId: "slot_summary_294_222_1120",
    activeReservationTruth: buildTruth({
      slotSummaryId: "slot_summary_294_222_1120",
      truthState: "truthful_nonexclusive",
      displayExclusivityState: "nonexclusive",
      countdownMode: "none",
      dominantCue:
        "This secure-link offer remains visible, but acceptance is blocked until the contact route is repaired.",
      reasonRefs: ["truthful_nonexclusive", "reachability_blocked", "secure_link_continuation"],
    }),
    offerExpiryMode: "response_window",
    offerResponseDeadlineAt: "2026-04-23T11:30:00Z",
    continuationTruth: {
      patientVisibleState: "offer_available",
      windowRiskState: "on_track",
      dominantActionRef: "repair_contact_route",
      fallbackActionRef: null,
      nextEvaluationAt: "2026-04-23T11:30:00Z",
      generatedAt: "2026-04-23T08:58:00Z",
    },
    fallback: stayLocalFallback,
    reachabilityState: "repair_required",
    contactRepair: contactRepairProjection,
    preferenceSummaryRows,
    preferenceDisclosureRows,
    statusRows: [
      { label: "Entry mode", value: "Verified secure-link continuation" },
      { label: "Offer status", value: "Live offer still visible" },
      { label: "Acceptance", value: "Blocked by contact-route repair" },
    ],
    contactRows: repairContactRows,
    stateHeading: "Repair the contact route before this secure-link offer can continue",
    stateBody:
      "The secure-link shell keeps the offer and preference summary visible, but the dominant action switches to contact repair because reply movement is blocked.",
    supportingNote:
      "This secure-link recovery must explain the same blocker and next safe action as the authenticated route for the same waitlist tuple.",
    secureLinkNote:
      "Secure-link continuation is verified and bound back to the same waitlist context while recovery stays in place.",
    primaryAction: buildAction({
      actionRef: "repair_contact_route",
      label: "Repair contact route",
      detail: "Restore the reply path without leaving the secure-link waitlist continuation.",
      tone: "primary",
      transitionScenarioId: "booking_case_298_secure_link_offer",
    }),
    secondaryActions: [
      buildAction({
        actionRef: "open_support",
        label: "Need booking help?",
        detail: "Ask the practice team to help if you cannot repair the route now.",
      }),
    ],
    stickyActionVisible: true,
    liveAnnouncement:
      "Secure-link contact route repair is now required before the offer can continue.",
  }),
  booking_case_298_secure_link_offer: buildProjection({
    scenarioId: "booking_case_298_secure_link_offer",
    bookingCaseId: "booking_case_298_secure_link_offer",
    viewKind: "offer_actionable",
    entryMode: "secure_link",
    referenceNowAt: "2026-04-23T08:52:00Z",
    referenceNowLabel: "08:52",
    slotResultsScenarioId: "booking_case_294_renderable",
    activeOfferSlotId: "slot_summary_294_222_1120",
    activeReservationTruth: buildTruth({
      slotSummaryId: "slot_summary_294_222_1120",
      truthState: "truthful_nonexclusive",
      displayExclusivityState: "nonexclusive",
      countdownMode: "none",
      dominantCue: "This secure-link continuation still keeps the same offer context and honest nonexclusive wording.",
      reasonRefs: ["truthful_nonexclusive", "secure_link_continuation"],
    }),
    offerExpiryMode: "response_window",
    offerResponseDeadlineAt: "2026-04-23T11:30:00Z",
    continuationTruth: {
      patientVisibleState: "offer_available",
      windowRiskState: "at_risk",
      dominantActionRef: "accept_waitlist_offer",
      fallbackActionRef: "fallback_to_callback",
      nextEvaluationAt: "2026-04-23T11:30:00Z",
      generatedAt: "2026-04-23T08:52:00Z",
    },
    fallback: stayLocalFallback,
    reachabilityState: "current",
    preferenceSummaryRows,
    preferenceDisclosureRows,
    statusRows: [
      { label: "Entry mode", value: "Verified secure-link continuation" },
      { label: "Offer status", value: "Live offer available from the same booking continuation" },
      { label: "Response window", value: "Reply by 11:30 today" },
    ],
    contactRows: waitingContactRows,
    stateHeading: "This secure link resumes the same waitlist continuation",
    stateBody:
      "The shell keeps the same preference summary, support path, and offer card so secure-link acceptance does not feel like a detached mini-site.",
    supportingNote:
      "If this route becomes stale or blocked, the same shell can still degrade into repair or fallback without hiding the active waitlist context.",
    secureLinkNote:
      "Secure-link continuation is verified and bound back to the same booking context before writable actions are shown.",
    primaryAction: buildAction({
      actionRef: "accept_waitlist_offer",
      label: "Accept this offer",
      detail: "Continue from the secure link without losing the same-shell context.",
      tone: "primary",
      transitionScenarioId: "booking_case_298_offer_pending",
    }),
    secondaryActions: [
      buildAction({
        actionRef: "open_support",
        label: "Need booking help?",
        detail: "Ask the practice team to review this secure-link continuation with you.",
      }),
    ],
    stickyActionVisible: true,
    liveAnnouncement: "Secure-link waitlist offer loaded in the same booking shell.",
  }),
} as const satisfies Record<string, PatientWaitlistViewProjection>;

const scenarioAlias: Record<string, keyof typeof projectionsByScenario> = {
  booking_case_295_no_supply: "booking_case_298_join_sheet",
  booking_case_295_support_fallback: "booking_case_298_fallback_due",
};

function overrideBookingCaseId(
  projection: PatientWaitlistViewProjection,
  bookingCaseId: string,
): PatientWaitlistViewProjection {
  return projection.bookingCaseId === bookingCaseId
    ? projection
    : {
        ...projection,
        bookingCaseId,
      };
}

export const patientWaitlistViewScenarioIds = Object.keys(projectionsByScenario).filter(
  (scenarioId) => scenarioId !== "booking_case_298_contact_repair_resolved",
) as readonly string[];

export function resolvePatientWaitlistViewProjection(
  bookingCaseId: string,
): PatientWaitlistViewProjection | null {
  const scenarioId = scenarioAlias[bookingCaseId] ?? bookingCaseId;
  const projection = projectionsByScenario[scenarioId as keyof typeof projectionsByScenario] ?? null;
  return projection ? overrideBookingCaseId(projection, bookingCaseId) : null;
}

export function resolvePatientWaitlistViewProjectionByScenarioId(
  scenarioId: string,
): PatientWaitlistViewProjection | null {
  return projectionsByScenario[scenarioId as keyof typeof projectionsByScenario] ?? null;
}

export function waitlistViewStateMatrix(): Array<Record<string, string>> {
  return patientWaitlistViewScenarioIds.map((scenarioId) => {
    const projection = resolvePatientWaitlistViewProjectionByScenarioId(scenarioId)!;
    return {
      scenario_id: projection.scenarioId,
      booking_case_id: projection.bookingCaseId,
      route: `/bookings/${projection.bookingCaseId}/waitlist`,
      view_kind: projection.viewKind,
      entry_mode: projection.entryMode,
      patient_visible_state: projection.continuationTruth.patientVisibleState,
      window_risk_state: projection.continuationTruth.windowRiskState,
      reservation_truth: projection.activeReservationTruth?.truthState ?? "none",
      offer_expiry_mode: projection.offerExpiryMode,
      reachability_state: projection.reachabilityState,
      fallback_route: projection.fallback.requiredFallbackRoute,
    };
  });
}

export function waitlistAtlasScenarios() {
  return patientWaitlistViewScenarioIds.map((scenarioId) => {
    const projection = resolvePatientWaitlistViewProjectionByScenarioId(scenarioId)!;
    return {
      scenarioId: projection.scenarioId,
      bookingCaseId: projection.bookingCaseId,
      viewKind: projection.viewKind,
      entryMode: projection.entryMode,
      patientVisibleState: projection.continuationTruth.patientVisibleState,
      windowRiskState: projection.continuationTruth.windowRiskState,
      reservationTruth: projection.activeReservationTruth?.truthState ?? "none",
      offerExpiryMode: projection.offerExpiryMode,
      fallbackRoute: projection.fallback.requiredFallbackRoute,
      reachabilityState: projection.reachabilityState,
      stateHeading: projection.stateHeading,
    };
  });
}

export function waitlistViewContractSummary() {
  return {
    taskId: PATIENT_WAITLIST_VIEWS_TASK_ID,
    visualMode: PATIENT_WAITLIST_VIEWS_VISUAL_MODE,
    routes: [
      {
        path: "/bookings/:bookingCaseId/waitlist",
        purpose:
          "Render join-waitlist, waitlist management, active offer acceptance, expiry, fallback, and contact-route repair in the signed-in booking shell.",
      },
    ],
    uiPrimitives: [
      "JoinWaitlistSheet",
      "WaitlistPreferenceSummary",
      "WaitlistManageView",
      "ActiveWaitlistOfferCard",
      "WaitlistOfferAcceptView",
      "WaitlistContinuationStatePanel",
      "WaitlistFallbackPanel",
      "WaitlistContactRepairMorph",
      "WaitlistExpiryOutcome",
      "ExpiryOrSupersessionProvenanceCard",
    ],
    domMarkers: [
      "data-waitlist-state",
      "data-continuation-truth",
      "data-reservation-truth",
      "data-offer-expiry-mode",
      "data-fallback-route",
      "data-entry-mode",
      "data-reachability-state",
    ],
    scenarioIds: [...patientWaitlistViewScenarioIds],
  };
}
