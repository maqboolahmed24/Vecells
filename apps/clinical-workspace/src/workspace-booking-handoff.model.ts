export const STAFF_BOOKING_HANDOFF_TASK_ID =
  "par_299_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_staff_booking_handoff_panel_and_assisted_booking_views";
export const STAFF_BOOKING_HANDOFF_VISUAL_MODE = "Assisted_Booking_Control_Panel";

export type StaffBookingExceptionClass =
  | "supplier_endpoint_unavailable"
  | "slot_revalidation_failure"
  | "ambiguous_commit"
  | "patient_self_service_blocked"
  | "capability_mismatch"
  | "linkage_required_blocker"
  | "reminder_delivery_failure"
  | "stale_owner_or_publication_drift";

export type StaffBookingSettlementState =
  | "gated"
  | "pending_settlement"
  | "reacquire_required"
  | "authoritative";
export type StaffBookingConfirmationTruth =
  | "pre_commit_review"
  | "confirmation_pending"
  | "reconciliation_required"
  | "confirmed";
export type StaffBookingReviewLeaseState =
  | "live"
  | "release_pending"
  | "stale_owner"
  | "reacquire_required"
  | "observe_only";
export type StaffBookingFocusLeaseState = "idle" | "active" | "invalidated" | "released";
export type StaffBookingFocusMode = "none" | "comparing" | "confirming";
export type StaffAssistableSupplyMode = "patient_and_staff" | "staff_assist_only";
export type StaffAssistableSlotActionState =
  | "available"
  | "selected"
  | "compare_target"
  | "pending"
  | "confirmed"
  | "unavailable";
export type StaffAssistableSlotReservationTruth =
  | "truthful_nonexclusive"
  | "exclusive_held"
  | "pending_confirmation"
  | "confirmed"
  | "revalidation_required"
  | "expired";
export type StaffBookingRecoveryMode =
  | "linkage_repair"
  | "stale_owner"
  | "publication_drift"
  | "trust_drift"
  | "reconciliation"
  | "reminder_repair";

export interface StaffBookingSummaryRow {
  readonly label: string;
  readonly value: string;
}

export interface StaffBookingQueueRowProjection {
  readonly bookingCaseId: string;
  readonly taskId: string;
  readonly queueKey: string;
  readonly patientLabel: string;
  readonly needLabel: string;
  readonly reasonClass: StaffBookingExceptionClass;
  readonly severity: "info" | "caution" | "critical";
  readonly ageLabel: string;
  readonly settlementState: StaffBookingSettlementState;
  readonly reviewLeaseState: StaffBookingReviewLeaseState;
  readonly selected: boolean;
  readonly routeLabel: string;
  readonly summary: string;
}

export interface StaffAssistableSlotProjection {
  readonly slotId: string;
  readonly startLabel: string;
  readonly endLabel: string;
  readonly dayLabel: string;
  readonly siteLabel: string;
  readonly clinicianLabel: string;
  readonly deliveryModeLabel: string;
  readonly accessLabel: string;
  readonly rankingCue: string;
  readonly travelCue: string;
  readonly supplyMode: StaffAssistableSupplyMode;
  readonly supplyModeLabel: string;
  readonly patientFacingAvailability: string;
  readonly reservationTruth: StaffAssistableSlotReservationTruth;
  readonly reservationTruthLabel: string;
  readonly dominantCue: string;
  readonly actionState: StaffAssistableSlotActionState;
  readonly selected: boolean;
  readonly compareTarget: boolean;
  readonly detailRows: readonly StaffBookingSummaryRow[];
}

export interface AssistedBookingCaseSummaryProjection {
  readonly caseTitle: string;
  readonly patientLabel: string;
  readonly patientRef: string;
  readonly triageNeed: string;
  readonly blockerHeadline: string;
  readonly blockerBody: string;
  readonly selfServiceCapabilityLabel: string;
  readonly staffCapabilityLabel: string;
  readonly dominantActionLabel: string;
  readonly dominantActionDetail: string;
  readonly preferenceRows: readonly StaffBookingSummaryRow[];
  readonly stateRows: readonly StaffBookingSummaryRow[];
}

export interface AssistedSlotCompareStageProjection {
  readonly heading: string;
  readonly body: string;
  readonly selectedSlotId: string | null;
  readonly compareSlotIds: readonly string[];
  readonly compareAnchorRefs: readonly string[];
  readonly quietReturnTargetRef: string;
  readonly focusLeaseState: StaffBookingFocusLeaseState;
  readonly focusMode: StaffBookingFocusMode;
  readonly bufferedQueueChangeCount: number;
  readonly selectedAnchorRef: string;
}

export interface AssistedBookingRecoveryPanelProjection {
  readonly mode: StaffBookingRecoveryMode;
  readonly heading: string;
  readonly body: string;
  readonly blockerRows: readonly StaffBookingSummaryRow[];
  readonly actionLabel: string;
  readonly secondaryLabel: string | null;
  readonly subduedNote: string;
}

export interface TaskSettlementAndReacquireStripProjection {
  readonly settlementState: StaffBookingSettlementState;
  readonly heading: string;
  readonly body: string;
  readonly envelopeRef: string;
  readonly nextTaskLaunchState: "blocked" | "gated" | "ready";
  readonly primaryActionLabel: string;
  readonly secondaryActionLabel: string | null;
  readonly gatingRows: readonly StaffBookingSummaryRow[];
}

export interface StaffBookingCaseSeed {
  readonly bookingCaseId: string;
  readonly taskId: string;
  readonly queueKey: string;
  readonly defaultAnchorRef: string;
  readonly defaultSelectedSlotId: string | null;
  readonly focusMode: StaffBookingFocusMode;
  readonly queueBuffered: boolean;
}

export interface StaffBookingHandoffProjection {
  readonly projectionName: "StaffBookingHandoffProjection";
  readonly visualMode: typeof STAFF_BOOKING_HANDOFF_VISUAL_MODE;
  readonly bookingCaseId: string;
  readonly taskId: string;
  readonly queueKey: string;
  readonly exceptionClass: StaffBookingExceptionClass;
  readonly reviewLeaseState: StaffBookingReviewLeaseState;
  readonly focusLeaseState: StaffBookingFocusLeaseState;
  readonly focusMode: StaffBookingFocusMode;
  readonly focusProtected: boolean;
  readonly confirmationTruth: StaffBookingConfirmationTruth;
  readonly settlementState: StaffBookingSettlementState;
  readonly exceptionQueueLabel: string;
  readonly liveAnnouncement: string;
  readonly queueRows: readonly StaffBookingQueueRowProjection[];
  readonly caseSummary: AssistedBookingCaseSummaryProjection;
  readonly slots: readonly StaffAssistableSlotProjection[];
  readonly compareStage: AssistedSlotCompareStageProjection;
  readonly recoveryPanel: AssistedBookingRecoveryPanelProjection;
  readonly settlementStrip: TaskSettlementAndReacquireStripProjection;
}

function rows(entries: Record<string, string>): readonly StaffBookingSummaryRow[] {
  return Object.entries(entries).map(([label, value]) => ({ label, value }));
}

function slot(input: {
  slotId: string;
  startLabel: string;
  endLabel: string;
  dayLabel: string;
  siteLabel: string;
  clinicianLabel: string;
  deliveryModeLabel: string;
  accessLabel: string;
  rankingCue: string;
  travelCue: string;
  supplyMode: StaffAssistableSupplyMode;
  patientFacingAvailability: string;
  reservationTruth: StaffAssistableSlotReservationTruth;
  dominantCue: string;
  actionState: StaffAssistableSlotActionState;
  detailRows: Record<string, string>;
}): StaffAssistableSlotProjection {
  return {
    slotId: input.slotId,
    startLabel: input.startLabel,
    endLabel: input.endLabel,
    dayLabel: input.dayLabel,
    siteLabel: input.siteLabel,
    clinicianLabel: input.clinicianLabel,
    deliveryModeLabel: input.deliveryModeLabel,
    accessLabel: input.accessLabel,
    rankingCue: input.rankingCue,
    travelCue: input.travelCue,
    supplyMode: input.supplyMode,
    supplyModeLabel:
      input.supplyMode === "staff_assist_only" ? "Staff assist only" : "Patient self-service eligible",
    patientFacingAvailability: input.patientFacingAvailability,
    reservationTruth: input.reservationTruth,
    reservationTruthLabel: input.reservationTruth.replaceAll("_", " "),
    dominantCue: input.dominantCue,
    actionState: input.actionState,
    selected: input.actionState === "selected" || input.actionState === "confirmed" || input.actionState === "pending",
    compareTarget: input.actionState === "compare_target",
    detailRows: rows(input.detailRows),
  };
}

function queueRow(input: Omit<StaffBookingQueueRowProjection, "selected">): StaffBookingQueueRowProjection {
  return { ...input, selected: false };
}

const staffAssistableSlots = {
  linkage_primary: slot({
    slotId: "slot_299_linkage_0915",
    startLabel: "09:15",
    endLabel: "09:35",
    dayLabel: "Tue 21 Apr",
    siteLabel: "Community clinic north",
    clinicianLabel: "Dermatology triage clinic",
    deliveryModeLabel: "Face-to-face",
    accessLabel: "Lift access confirmed",
    rankingCue: "Closest match to same-team continuity and lift-access preference.",
    travelCue: "18 minutes by bus from the patient’s saved route.",
    supplyMode: "staff_assist_only",
    patientFacingAvailability: "Patient self-service stayed blocked by linkage requirements.",
    reservationTruth: "truthful_nonexclusive",
    dominantCue: "Visible to staff because linkage is missing on the patient route.",
    actionState: "selected",
    detailRows: {
      "Supplier window": "Live staff-assistable search result",
      "Capability tuple": "same supplier and adapter tuple as the blocked self-service path",
      "Linkage posture": "Requires practice-linked resolution before self-service could ever resume",
    },
  }),
  linkage_secondary: slot({
    slotId: "slot_299_linkage_1110",
    startLabel: "11:10",
    endLabel: "11:30",
    dayLabel: "Tue 21 Apr",
    siteLabel: "Hospital outpatient west",
    clinicianLabel: "Dermatology registrar",
    deliveryModeLabel: "Face-to-face",
    accessLabel: "Standard access",
    rankingCue: "Later fallback slot with the same supplier binding.",
    travelCue: "31 minutes by rail.",
    supplyMode: "patient_and_staff",
    patientFacingAvailability: "Self-service cannot use it until linkage succeeds.",
    reservationTruth: "truthful_nonexclusive",
    dominantCue: "Available if the operator needs a later fallback after linkage explanation.",
    actionState: "available",
    detailRows: {
      "Supplier window": "Live staff search result",
      "Patient path": "Blocked by linkage, not by supplier capacity",
      "Fallback fit": "Suitable if the earlier slot cannot be confirmed with the patient",
    },
  }),
  compare_primary: slot({
    slotId: "slot_299_compare_1040",
    startLabel: "10:40",
    endLabel: "11:00",
    dayLabel: "Wed 22 Apr",
    siteLabel: "Community clinic north",
    clinicianLabel: "Dermatology consultant",
    deliveryModeLabel: "Face-to-face",
    accessLabel: "Lift access confirmed",
    rankingCue: "Best continuity fit and within the patient’s weekday-morning preference.",
    travelCue: "16 minutes by bus.",
    supplyMode: "staff_assist_only",
    patientFacingAvailability: "Hidden from self-service because clinician release requires staff assist.",
    reservationTruth: "exclusive_held",
    dominantCue: "Held on the real supplier hold while the operator compares alternatives.",
    actionState: "selected",
    detailRows: {
      "Reservation scope": "exclusive hold until 10:54",
      "Capacity posture": "Staff-assistable release only",
      "Reason cue": "Same team, lift access, earliest workable time",
    },
  }),
  compare_secondary: slot({
    slotId: "slot_299_compare_1220",
    startLabel: "12:20",
    endLabel: "12:40",
    dayLabel: "Wed 22 Apr",
    siteLabel: "Hospital outpatient west",
    clinicianLabel: "Dermatology registrar",
    deliveryModeLabel: "Face-to-face",
    accessLabel: "Ground-floor clinic",
    rankingCue: "Second-best time if the held slot is released.",
    travelCue: "28 minutes by rail.",
    supplyMode: "patient_and_staff",
    patientFacingAvailability: "Patient self-service could see this supply if the pathway were self-service eligible.",
    reservationTruth: "truthful_nonexclusive",
    dominantCue: "Comparable alternate kept pinned under focus protection.",
    actionState: "compare_target",
    detailRows: {
      "Reservation scope": "No hold yet",
      "Capacity posture": "Publicly bookable supply",
      "Reason cue": "Later time, wider transport window",
    },
  }),
  compare_third: slot({
    slotId: "slot_299_compare_1530",
    startLabel: "15:30",
    endLabel: "15:50",
    dayLabel: "Wed 22 Apr",
    siteLabel: "Community clinic south",
    clinicianLabel: "Consultant-led clinic",
    deliveryModeLabel: "Face-to-face",
    accessLabel: "Wheelchair route confirmed",
    rankingCue: "Useful if morning slots fail revalidation.",
    travelCue: "22 minutes by taxi; outside preferred time band.",
    supplyMode: "staff_assist_only",
    patientFacingAvailability: "Staff-only supply because same-day manual release is required.",
    reservationTruth: "truthful_nonexclusive",
    dominantCue: "Visible but not selected while the compare target remains pinned.",
    actionState: "available",
    detailRows: {
      "Reservation scope": "No hold yet",
      "Capacity posture": "Late-release assistable supply",
      "Reason cue": "Fallback if the morning hold is intentionally released",
    },
  }),
  pending_primary: slot({
    slotId: "slot_299_pending_0910",
    startLabel: "09:10",
    endLabel: "09:30",
    dayLabel: "Thu 23 Apr",
    siteLabel: "Community clinic north",
    clinicianLabel: "Dermatology consultant",
    deliveryModeLabel: "Face-to-face",
    accessLabel: "Lift access confirmed",
    rankingCue: "Selected and dispatched through the same booking core.",
    travelCue: "15 minutes by bus.",
    supplyMode: "staff_assist_only",
    patientFacingAvailability: "Patient flow still required staff assist at selection time.",
    reservationTruth: "pending_confirmation",
    dominantCue: "Accepted for processing is visible, but the booking is not confirmed yet.",
    actionState: "pending",
    detailRows: {
      "Provider reference": "pending durable callback",
      "Commit posture": "accepted_for_processing",
      "Reminder posture": "blocked until confirmation truth settles",
    },
  }),
  stale_primary: slot({
    slotId: "slot_299_stale_0840",
    startLabel: "08:40",
    endLabel: "09:00",
    dayLabel: "Fri 24 Apr",
    siteLabel: "Hospital outpatient west",
    clinicianLabel: "Dermatology registrar",
    deliveryModeLabel: "Face-to-face",
    accessLabel: "Standard access",
    rankingCue: "Previously selected compare anchor.",
    travelCue: "29 minutes by rail.",
    supplyMode: "staff_assist_only",
    patientFacingAvailability: "Staff comparison is preserved while ownership is reacquired.",
    reservationTruth: "revalidation_required",
    dominantCue: "The preserved slot remains visible, but mutation is frozen until reacquire completes.",
    actionState: "selected",
    detailRows: {
      "Ownership posture": "stale owner or publication drift detected",
      "Hold posture": "revalidation required",
      "Quiet return": "summary::booking_case_299_stale_recovery",
    },
  }),
  stale_compare: slot({
    slotId: "slot_299_stale_1020",
    startLabel: "10:20",
    endLabel: "10:40",
    dayLabel: "Fri 24 Apr",
    siteLabel: "Community clinic south",
    clinicianLabel: "Dermatology consultant",
    deliveryModeLabel: "Face-to-face",
    accessLabel: "Wheelchair route confirmed",
    rankingCue: "Prior alternate compare anchor.",
    travelCue: "24 minutes by taxi.",
    supplyMode: "patient_and_staff",
    patientFacingAvailability: "Still visible as provenance, not as a writable target.",
    reservationTruth: "truthful_nonexclusive",
    dominantCue: "Compare anchor is preserved in stale-recoverable posture instead of being replaced.",
    actionState: "compare_target",
    detailRows: {
      "Ownership posture": "preserved compare anchor only",
      "Reservation scope": "not held",
      "Recovery fence": "review_action_lease must be reacquired",
    },
  }),
  confirmed_primary: slot({
    slotId: "slot_299_confirmed_1400",
    startLabel: "14:00",
    endLabel: "14:20",
    dayLabel: "Mon 27 Apr",
    siteLabel: "Community clinic north",
    clinicianLabel: "Dermatology consultant",
    deliveryModeLabel: "Face-to-face",
    accessLabel: "Lift access confirmed",
    rankingCue: "Confirmed booking now serving reminder repair follow-up.",
    travelCue: "16 minutes by bus.",
    supplyMode: "staff_assist_only",
    patientFacingAvailability: "Selection required staff assist; confirmation truth is now confirmed.",
    reservationTruth: "confirmed",
    dominantCue: "Confirmed booking remains pinned while reminder-route repair is handled.",
    actionState: "confirmed",
    detailRows: {
      "Provider reference": "APT-447193",
      "Confirmation proof": "reconciled confirmation",
      "Reminder posture": "delivery failure in repair",
    },
  }),
} as const;

const baseQueueRows = [
  queueRow({
    bookingCaseId: "booking_case_299_linkage_required",
    taskId: "task-412",
    queueKey: "callback-follow-up",
    patientLabel: "Request 412 / Pseudonymised patient",
    needLabel: "Dermatology review within 14 days",
    reasonClass: "linkage_required_blocker",
    severity: "critical",
    ageLabel: "11m",
    settlementState: "gated",
    reviewLeaseState: "live",
    routeLabel: "Linkage required",
    summary: "Self-service could not advance because linkage and local component checks blocked the patient route.",
  }),
  queueRow({
    bookingCaseId: "booking_case_299_compare_live",
    taskId: "task-311",
    queueKey: "recommended",
    patientLabel: "Request 311 / Pseudonymised patient",
    needLabel: "Dermatology continuity booking",
    reasonClass: "patient_self_service_blocked",
    severity: "caution",
    ageLabel: "6m",
    settlementState: "gated",
    reviewLeaseState: "live",
    routeLabel: "Assistable compare",
    summary: "Staff-only supply is available and the operator is actively comparing held versus non-held options.",
  }),
  queueRow({
    bookingCaseId: "booking_case_299_pending_confirmation",
    taskId: "task-208",
    queueKey: "approvals",
    patientLabel: "Request 208 / Pseudonymised patient",
    needLabel: "Follow-up slot already dispatched",
    reasonClass: "ambiguous_commit",
    severity: "caution",
    ageLabel: "2m",
    settlementState: "pending_settlement",
    reviewLeaseState: "release_pending",
    routeLabel: "Pending confirmation",
    summary: "The commit was accepted for processing, but downstream confirmation is still settling.",
  }),
  queueRow({
    bookingCaseId: "booking_case_299_stale_recovery",
    taskId: "task-507",
    queueKey: "changed-since-seen",
    patientLabel: "Request 507 / Pseudonymised patient",
    needLabel: "Assistive compare interrupted by drift",
    reasonClass: "stale_owner_or_publication_drift",
    severity: "critical",
    ageLabel: "18m",
    settlementState: "reacquire_required",
    reviewLeaseState: "stale_owner",
    routeLabel: "Reacquire in place",
    summary: "Ownership or publication drift invalidated the current compare shell and requires explicit reacquire.",
  }),
  queueRow({
    bookingCaseId: "booking_case_299_confirmed",
    taskId: "task-118",
    queueKey: "recommended",
    patientLabel: "Request 118 / Pseudonymised patient",
    needLabel: "Confirmed booking with downstream reminder issue",
    reasonClass: "reminder_delivery_failure",
    severity: "info",
    ageLabel: "23m",
    settlementState: "authoritative",
    reviewLeaseState: "live",
    routeLabel: "Reminder repair only",
    summary: "The booking is confirmed, but reminder delivery repair still needs bounded staff attention.",
  }),
] as const;

function queueRowsFor(selectedCaseId: string): readonly StaffBookingQueueRowProjection[] {
  return baseQueueRows.map((row) => ({ ...row, selected: row.bookingCaseId === selectedCaseId }));
}

const projections = {
  booking_case_299_linkage_required: {
    projectionName: "StaffBookingHandoffProjection",
    visualMode: STAFF_BOOKING_HANDOFF_VISUAL_MODE,
    bookingCaseId: "booking_case_299_linkage_required",
    taskId: "task-412",
    queueKey: "callback-follow-up",
    exceptionClass: "linkage_required_blocker",
    reviewLeaseState: "live",
    focusLeaseState: "released",
    focusMode: "none",
    focusProtected: false,
    confirmationTruth: "pre_commit_review",
    settlementState: "gated",
    exceptionQueueLabel: "Booking exception queue",
    liveAnnouncement:
      "Linkage-required blocker remains explicit. Staff may assist through the same booking core without widening supplier scope.",
    queueRows: queueRowsFor("booking_case_299_linkage_required"),
    caseSummary: {
      caseTitle: "Linkage-required assistance",
      patientLabel: "Request 412 / Pseudonymised patient",
      patientRef: "booking_case_299_linkage_required",
      triageNeed: "Follow-up dermatology appointment within 14 days with lift access and weekday transport support.",
      blockerHeadline: "Self-service stopped at the linkage boundary",
      blockerBody:
        "The patient flow cannot proceed until linkage and local consumer requirements are satisfied. Staff can continue only on the same supplier, binding, and capability tuple.",
      selfServiceCapabilityLabel: "assisted_only because linkage and local component checks are still blocking",
      staffCapabilityLabel: "live_staff_assist on the same supplier binding",
      dominantActionLabel: "Explain the blocker, then continue with assisted booking",
      dominantActionDetail: "Keep the blocker visible instead of burying it in notes or swapping to a detached booking page.",
      preferenceRows: rows({
        "Preferred site": "Community clinic with lift access",
        "Time of day": "Weekday mornings outside school drop-off",
        Continuity: "Same dermatology team if possible",
      }),
      stateRows: rows({
        "Exception class": "linkage_required_blocker",
        "Capability tuple": "same supplier and provider adapter binding retained",
        "Current queue posture": "manual assistance is lawful, patient self-service is still blocked",
      }),
    },
    slots: [staffAssistableSlots.linkage_primary, staffAssistableSlots.linkage_secondary],
    compareStage: {
      heading: "Selected slot stays visible while the blocker is explained",
      body:
        "The staff shell keeps the selected assistable slot anchored, but there is no active compare hold until the operator starts a focused compare review.",
      selectedSlotId: "slot_299_linkage_0915",
      compareSlotIds: [],
      compareAnchorRefs: [],
      quietReturnTargetRef: "booking-summary-linkage",
      focusLeaseState: "released",
      focusMode: "none",
      bufferedQueueChangeCount: 0,
      selectedAnchorRef: "booking-slot-slot_299_linkage_0915",
    },
    recoveryPanel: {
      mode: "linkage_repair",
      heading: "Why this stayed in assisted handling",
      body:
        "Linkage requirements remain the authoritative blocker. The staff panel keeps that explanation on-screen so the operator does not improvise off-model workarounds.",
      blockerRows: rows({
        "Blocked patient route": "Self-service booking could not lawfully progress",
        "Local dependency": "Practice-linked component still required",
        "Safe fallback": "Continue with staff assist on the same binding tuple",
      }),
      actionLabel: "Document linkage explanation and continue",
      secondaryLabel: "Open callback fallback",
      subduedNote: "Notes cannot replace the booking core. The blocker must remain explicit and machine-readable.",
    },
    settlementStrip: {
      settlementState: "gated",
      heading: "Task completion is gated until an assisted path is actually selected",
      body:
        "The booking task cannot close from blocker acknowledgement alone. Settlement remains gated until the operator selects, confirms, or routes to governed fallback.",
      envelopeRef: "task_completion_settlement_envelope::booking_case_299_linkage_required",
      nextTaskLaunchState: "blocked",
      primaryActionLabel: "Start assisted booking",
      secondaryActionLabel: "Open waitlist fallback",
      gatingRows: rows({
        "Settlement posture": "gated by active booking work",
        "Next task launch": "blocked while this exception remains open",
        "Quiet return": "booking-summary-linkage",
      }),
    },
  },
  booking_case_299_compare_live: {
    projectionName: "StaffBookingHandoffProjection",
    visualMode: STAFF_BOOKING_HANDOFF_VISUAL_MODE,
    bookingCaseId: "booking_case_299_compare_live",
    taskId: "task-311",
    queueKey: "recommended",
    exceptionClass: "patient_self_service_blocked",
    reviewLeaseState: "live",
    focusLeaseState: "active",
    focusMode: "comparing",
    focusProtected: true,
    confirmationTruth: "pre_commit_review",
    settlementState: "gated",
    exceptionQueueLabel: "Booking exception queue",
    liveAnnouncement:
      "Assistable compare is active. The held slot and compare anchor stay pinned while buffered queue changes wait behind focus protection.",
    queueRows: queueRowsFor("booking_case_299_compare_live"),
    caseSummary: {
      caseTitle: "Assisted compare in progress",
      patientLabel: "Request 311 / Pseudonymised patient",
      patientRef: "booking_case_299_compare_live",
      triageNeed: "Dermatology follow-up within 14 days, same team preferred, weekday mornings preferred, wheelchair route required.",
      blockerHeadline: "Only staff-assistable supply can satisfy the release policy on this pathway",
      blockerBody:
        "Patient self-service is blocked, but staff may compare the same ranked slots through the shared booking core with the current review lease and supplier tuple intact.",
      selfServiceCapabilityLabel: "assisted_only because clinician release requires staff assistance",
      staffCapabilityLabel: "live_staff_assist on the same supplier and adapter binding",
      dominantActionLabel: "Keep the held slot pinned while you compare before confirming",
      dominantActionDetail:
        "Queue churn remains buffered. The active selected slot, compare anchor, and quiet return target stay frozen in place until you release focus protection.",
      preferenceRows: rows({
        "Preferred site": "Community clinic with lift access",
        "Time of day": "Weekday mornings before 12:00",
        Continuity: "Same dermatologist if possible",
      }),
      stateRows: rows({
        "Exception class": "patient_self_service_blocked",
        "Review lease": "live review lease on the active workspace tuple",
        "Buffered queue state": "4 non-disruptive updates waiting behind compare focus",
      }),
    },
    slots: [
      staffAssistableSlots.compare_primary,
      staffAssistableSlots.compare_secondary,
      staffAssistableSlots.compare_third,
    ],
    compareStage: {
      heading: "Held versus fallback compare",
      body:
        "The compare stage stays bounded: one held candidate, one explicit compare target, and one quiet return path. Buffered queue updates cannot replace either anchor while the compare hold is active.",
      selectedSlotId: "slot_299_compare_1040",
      compareSlotIds: ["slot_299_compare_1220"],
      compareAnchorRefs: ["slot_299_compare_1040", "slot_299_compare_1220"],
      quietReturnTargetRef: "booking-compare-stage",
      focusLeaseState: "active",
      focusMode: "comparing",
      bufferedQueueChangeCount: 4,
      selectedAnchorRef: "booking-slot-slot_299_compare_1040",
    },
    recoveryPanel: {
      mode: "publication_drift",
      heading: "Quiet return and recovery stay visible during compare work",
      body:
        "A compare hold does not imply that the shell is calm to close. If publication, queue, or ownership drift lands, this panel becomes the same-shell recovery target instead of replacing the active compare plane.",
      blockerRows: rows({
        "Protected subject": "Held slot plus one compare anchor",
        "Allowed live patch": "blocking-only plus local acknowledgement",
        "Buffered queue batch": "4 waiting changes",
      }),
      actionLabel: "Review buffered queue changes",
      secondaryLabel: "Release compare hold",
      subduedNote: "Accepted-for-processing and provider echoes are still forbidden from looking booked here.",
    },
    settlementStrip: {
      settlementState: "gated",
      heading: "Task completion remains gated while compare focus protection is active",
      body:
        "The shell may warm next-task posture summary-first, but next-task launch and task closure stay blocked until the held slot is either confirmed or released through governed fallback.",
      envelopeRef: "task_completion_settlement_envelope::booking_case_299_compare_live",
      nextTaskLaunchState: "blocked",
      primaryActionLabel: "Confirm held slot",
      secondaryActionLabel: "Open waitlist fallback",
      gatingRows: rows({
        "Settlement posture": "pending explicit booking outcome",
        "Next task launch": "blocked by protected compare work",
        "Quiet return": "booking-compare-stage",
      }),
    },
  },
  booking_case_299_pending_confirmation: {
    projectionName: "StaffBookingHandoffProjection",
    visualMode: STAFF_BOOKING_HANDOFF_VISUAL_MODE,
    bookingCaseId: "booking_case_299_pending_confirmation",
    taskId: "task-208",
    queueKey: "approvals",
    exceptionClass: "ambiguous_commit",
    reviewLeaseState: "release_pending",
    focusLeaseState: "active",
    focusMode: "confirming",
    focusProtected: true,
    confirmationTruth: "confirmation_pending",
    settlementState: "pending_settlement",
    exceptionQueueLabel: "Booking exception queue",
    liveAnnouncement:
      "Confirmation remains pending. The selected slot is still visible, but the task cannot close and no booked chip is shown.",
    queueRows: queueRowsFor("booking_case_299_pending_confirmation"),
    caseSummary: {
      caseTitle: "Pending confirmation",
      patientLabel: "Request 208 / Pseudonymised patient",
      patientRef: "booking_case_299_pending_confirmation",
      triageNeed: "Follow-up dermatology review after urgent callback.",
      blockerHeadline: "Accepted for processing is not the same as confirmed",
      blockerBody:
        "The supplier accepted the booking request for processing, but authoritative confirmation has not returned yet. The staff shell keeps the selected slot visible without collapsing into a booked posture.",
      selfServiceCapabilityLabel: "assisted_only at the time of selection",
      staffCapabilityLabel: "confirmation pending on the same commit lineage",
      dominantActionLabel: "Wait for confirmation or refresh the authoritative read",
      dominantActionDetail: "Keep the patient-facing explanation precise and do not close the task early.",
      preferenceRows: rows({
        "Preferred site": "Community clinic north",
        "Time of day": "Early morning",
        Continuity: "Same team if possible",
      }),
      stateRows: rows({
        "Exception class": "ambiguous_commit",
        "Confirmation truth": "confirmation_pending",
        "Reminder posture": "still blocked because confirmation is not confirmed",
      }),
    },
    slots: [staffAssistableSlots.pending_primary],
    compareStage: {
      heading: "Selected slot remains pinned during reconciliation",
      body:
        "The slot card stays anchored so the operator has stable provenance while callbacks or read-after-write checks settle authoritative truth.",
      selectedSlotId: "slot_299_pending_0910",
      compareSlotIds: [],
      compareAnchorRefs: ["slot_299_pending_0910"],
      quietReturnTargetRef: "booking-confirmation-stage",
      focusLeaseState: "active",
      focusMode: "confirming",
      bufferedQueueChangeCount: 1,
      selectedAnchorRef: "booking-slot-slot_299_pending_0910",
    },
    recoveryPanel: {
      mode: "reconciliation",
      heading: "Reconciliation stays in the same shell",
      body:
        "Authoritative settlement must come from the booking confirmation truth projection. Provider references, local acknowledgement, or reminder-plan presence can widen explanation but cannot make the case look booked.",
      blockerRows: rows({
        "Current truth": "confirmation_pending",
        "Authoritative proof": "not yet durable",
        "Safe operator action": "refresh status or continue governed wait",
      }),
      actionLabel: "Refresh confirmation status",
      secondaryLabel: "Open callback fallback",
      subduedNote: "This route is still writable only for governed refresh or fallback, not for closure.",
    },
    settlementStrip: {
      settlementState: "pending_settlement",
      heading: "Task completion settlement is still provisional",
      body:
        "The booking request was accepted for processing, but quiet completion remains blocked until authoritative downstream settlement lands. The shell preserves the selected slot and current explanation instead of jumping to the next task.",
      envelopeRef: "task_completion_settlement_envelope::booking_case_299_pending_confirmation",
      nextTaskLaunchState: "gated",
      primaryActionLabel: "Refresh authoritative read",
      secondaryActionLabel: "Open reconciliation notes",
      gatingRows: rows({
        "Settlement posture": "pending downstream confirmation",
        "Next task launch": "gated summary-only",
        "Quiet return": "booking-confirmation-stage",
      }),
    },
  },
  booking_case_299_stale_recovery: {
    projectionName: "StaffBookingHandoffProjection",
    visualMode: STAFF_BOOKING_HANDOFF_VISUAL_MODE,
    bookingCaseId: "booking_case_299_stale_recovery",
    taskId: "task-507",
    queueKey: "changed-since-seen",
    exceptionClass: "stale_owner_or_publication_drift",
    reviewLeaseState: "stale_owner",
    focusLeaseState: "invalidated",
    focusMode: "comparing",
    focusProtected: true,
    confirmationTruth: "reconciliation_required",
    settlementState: "reacquire_required",
    exceptionQueueLabel: "Booking exception queue",
    liveAnnouncement:
      "Ownership or publication drift invalidated the current compare hold. The preserved slot and compare anchor remain visible while mutation stays frozen.",
    queueRows: queueRowsFor("booking_case_299_stale_recovery"),
    caseSummary: {
      caseTitle: "Reacquire in place",
      patientLabel: "Request 507 / Pseudonymised patient",
      patientRef: "booking_case_299_stale_recovery",
      triageNeed: "Assistive booking recovery after a supplier or ownership tuple drifted mid-compare.",
      blockerHeadline: "The current booking shell failed closed instead of swapping you to a fresh candidate",
      blockerBody:
        "Ownership or publication changed while compare work was protected. The shell preserved the prior compare state and moved to stale-recoverable posture until the operator explicitly reacquires.",
      selfServiceCapabilityLabel: "not relevant while stale-owner recovery is active",
      staffCapabilityLabel: "frozen until stale-owner or publication recovery clears",
      dominantActionLabel: "Reacquire the booking task before attempting any mutation",
      dominantActionDetail:
        "The stale-owner recovery record is the safe return path. Protected compare anchors remain visible, but every mutation control stays frozen.",
      preferenceRows: rows({
        "Preferred site": "Hospital outpatient west",
        "Time of day": "Morning if possible",
        Continuity: "Same team preferred but not required",
      }),
      stateRows: rows({
        "Exception class": "stale_owner_or_publication_drift",
        "Review lease": "stale_owner",
        "Focus lease": "invalidated compare hold kept visible",
      }),
    },
    slots: [staffAssistableSlots.stale_primary, staffAssistableSlots.stale_compare],
    compareStage: {
      heading: "Preserved compare anchors",
      body:
        "The route keeps the previous slot and compare target visible as provenance. A refreshed slot list does not replace them until the operator explicitly reacquires or abandons the stale shell.",
      selectedSlotId: "slot_299_stale_0840",
      compareSlotIds: ["slot_299_stale_1020"],
      compareAnchorRefs: ["slot_299_stale_0840", "slot_299_stale_1020"],
      quietReturnTargetRef: "booking-stale-recovery",
      focusLeaseState: "invalidated",
      focusMode: "comparing",
      bufferedQueueChangeCount: 3,
      selectedAnchorRef: "booking-slot-slot_299_stale_0840",
    },
    recoveryPanel: {
      mode: "stale_owner",
      heading: "Stale-owner recovery",
      body:
        "The current review-action lease and publication tuple no longer match the active workspace. Reacquire must happen in place so the operator keeps provenance and quiet-return context.",
      blockerRows: rows({
        "Invalidating drift": "ownership or publication",
        "Recovery record": "stale-owner booking recovery already created",
        "Allowed action": "reacquire only",
      }),
      actionLabel: "Reacquire booking task",
      secondaryLabel: "Return to queue anchor",
      subduedNote: "No optimistic continue path is exposed while the stale-owner tuple remains unresolved.",
    },
    settlementStrip: {
      settlementState: "reacquire_required",
      heading: "Task completion and next-task launch are blocked by stale-owner recovery",
      body:
        "The shell preserves the current booking evidence, but completion calmness is blocked until the active review tuple is reacquired and the exception queue can clear the stale condition.",
      envelopeRef: "task_completion_settlement_envelope::booking_case_299_stale_recovery",
      nextTaskLaunchState: "blocked",
      primaryActionLabel: "Reacquire and restore compare",
      secondaryActionLabel: "Open stale-owner evidence",
      gatingRows: rows({
        "Settlement posture": "blocked by stale-owner recovery",
        "Next task launch": "blocked",
        "Quiet return": "booking-stale-recovery",
      }),
    },
  },
  booking_case_299_confirmed: {
    projectionName: "StaffBookingHandoffProjection",
    visualMode: STAFF_BOOKING_HANDOFF_VISUAL_MODE,
    bookingCaseId: "booking_case_299_confirmed",
    taskId: "task-118",
    queueKey: "recommended",
    exceptionClass: "reminder_delivery_failure",
    reviewLeaseState: "live",
    focusLeaseState: "idle",
    focusMode: "none",
    focusProtected: false,
    confirmationTruth: "confirmed",
    settlementState: "authoritative",
    exceptionQueueLabel: "Booking exception queue",
    liveAnnouncement:
      "Booking confirmation is authoritative. The exception queue remains open only for reminder-route repair, not for booking truth.",
    queueRows: queueRowsFor("booking_case_299_confirmed"),
    caseSummary: {
      caseTitle: "Confirmed booking, reminder repair only",
      patientLabel: "Request 118 / Pseudonymised patient",
      patientRef: "booking_case_299_confirmed",
      triageNeed: "Confirmed follow-up dermatology booking with downstream reminder delivery repair.",
      blockerHeadline: "Booking truth is confirmed; only reminder delivery remains in repair",
      blockerBody:
        "The route keeps the confirmed slot visible, but the remaining exception is reminder-route failure. The UI separates reminder repair from booking truth so staff do not misread the task state.",
      selfServiceCapabilityLabel: "staff assist was required at booking time",
      staffCapabilityLabel: "confirmed booking with reminder repair follow-up",
      dominantActionLabel: "Repair the reminder route without reopening booking truth",
      dominantActionDetail: "Manage or artifact follow-ups are now lawful because confirmation truth is authoritative.",
      preferenceRows: rows({
        "Preferred site": "Community clinic north",
        "Time of day": "Afternoon",
        Continuity: "Same team",
      }),
      stateRows: rows({
        "Exception class": "reminder_delivery_failure",
        "Confirmation truth": "confirmed",
        "Reminder posture": "repair required",
      }),
    },
    slots: [staffAssistableSlots.confirmed_primary],
    compareStage: {
      heading: "Confirmed booking provenance",
      body:
        "The confirmed slot remains visible as the stable reference while downstream reminder repair happens in bounded posture.",
      selectedSlotId: "slot_299_confirmed_1400",
      compareSlotIds: [],
      compareAnchorRefs: [],
      quietReturnTargetRef: "booking-confirmed-summary",
      focusLeaseState: "released",
      focusMode: "none",
      bufferedQueueChangeCount: 0,
      selectedAnchorRef: "booking-slot-slot_299_confirmed_1400",
    },
    recoveryPanel: {
      mode: "reminder_repair",
      heading: "Reminder-route repair",
      body:
        "Reminder delivery failed after confirmation. The booking stays confirmed, and the operator works a reminder-specific repair path instead of reopening supplier booking truth.",
      blockerRows: rows({
        "Booking proof": "reconciled confirmation",
        "Reminder plan": "delivery failure requires repair",
        "Safe action": "repair contact route or resend reminder",
      }),
      actionLabel: "Repair reminder route",
      secondaryLabel: "Open confirmed manage handoff",
      subduedNote: "Confirmed posture is stable here; reminder repair should not regress the case back to pending booking language.",
    },
    settlementStrip: {
      settlementState: "authoritative",
      heading: "Task completion is authoritative for booking truth",
      body:
        "The booking confirmation truth is settled. The remaining work is bounded reminder repair, so next-task readiness can stay visible without pretending the reminder issue is part of booking confirmation.",
      envelopeRef: "task_completion_settlement_envelope::booking_case_299_confirmed",
      nextTaskLaunchState: "ready",
      primaryActionLabel: "Open reminder repair",
      secondaryActionLabel: "Launch next governed task",
      gatingRows: rows({
        "Settlement posture": "authoritative for booking truth",
        "Next task launch": "ready",
        "Quiet return": "booking-confirmed-summary",
      }),
    },
  },
} as const satisfies Record<string, StaffBookingHandoffProjection>;

export const defaultStaffBookingCaseId = "booking_case_299_compare_live";

export const staffBookingStateMatrix = [
  {
    bookingCaseId: "booking_case_299_linkage_required",
    exceptionClass: "linkage_required_blocker",
    reviewLeaseState: "live",
    focusLeaseState: "released",
    focusMode: "none",
    confirmationTruth: "pre_commit_review",
    settlementState: "gated",
  },
  {
    bookingCaseId: "booking_case_299_compare_live",
    exceptionClass: "patient_self_service_blocked",
    reviewLeaseState: "live",
    focusLeaseState: "active",
    focusMode: "comparing",
    confirmationTruth: "pre_commit_review",
    settlementState: "gated",
  },
  {
    bookingCaseId: "booking_case_299_pending_confirmation",
    exceptionClass: "ambiguous_commit",
    reviewLeaseState: "release_pending",
    focusLeaseState: "active",
    focusMode: "confirming",
    confirmationTruth: "confirmation_pending",
    settlementState: "pending_settlement",
  },
  {
    bookingCaseId: "booking_case_299_stale_recovery",
    exceptionClass: "stale_owner_or_publication_drift",
    reviewLeaseState: "stale_owner",
    focusLeaseState: "invalidated",
    focusMode: "comparing",
    confirmationTruth: "reconciliation_required",
    settlementState: "reacquire_required",
  },
  {
    bookingCaseId: "booking_case_299_confirmed",
    exceptionClass: "reminder_delivery_failure",
    reviewLeaseState: "live",
    focusLeaseState: "idle",
    focusMode: "none",
    confirmationTruth: "confirmed",
    settlementState: "authoritative",
  },
] as const;

export const staffBookingPanelContractSummary = {
  taskId: STAFF_BOOKING_HANDOFF_TASK_ID,
  visualMode: STAFF_BOOKING_HANDOFF_VISUAL_MODE,
  domMarkers: [
    "data-shell",
    "data-booking-case",
    "data-exception-class",
    "data-review-lease-state",
    "data-focus-protected",
    "data-confirmation-truth",
    "data-task-settlement",
  ],
  uiPrimitives: [
    "StaffBookingHandoffPanel",
    "BookingExceptionQueuePanel",
    "AssistedBookingCaseSummary",
    "StaffAssistableSlotList",
    "AssistedSlotCompareStage",
    "AssistedBookingRecoveryPanel",
    "TaskSettlementAndReacquireStrip",
  ],
} as const;

const scenarioAlias: Record<string, keyof typeof projections> = {
  booking_case_306_handoff_live: "booking_case_299_compare_live",
  booking_case_306_confirmation_pending: "booking_case_299_pending_confirmation",
  booking_case_306_reopened: "booking_case_299_stale_recovery",
  booking_case_306_confirmed: "booking_case_299_confirmed",
};

function overrideStaffBookingCaseId(
  projection: StaffBookingHandoffProjection,
  bookingCaseId: string,
): StaffBookingHandoffProjection {
  if (projection.bookingCaseId === bookingCaseId) {
    return projection;
  }
  return {
    ...projection,
    bookingCaseId,
    queueRows: projection.queueRows.map((row) =>
      row.bookingCaseId === projection.bookingCaseId ? { ...row, bookingCaseId } : row,
    ),
    caseSummary: {
      ...projection.caseSummary,
      patientRef: bookingCaseId,
    },
  };
}

export function resolveStaffBookingHandoffProjectionByCaseId(
  bookingCaseId: string | null | undefined,
): StaffBookingHandoffProjection {
  const requestedCaseId = bookingCaseId ?? defaultStaffBookingCaseId;
  const scenarioId = scenarioAlias[requestedCaseId] ?? requestedCaseId;
  const projection =
    projections[scenarioId as keyof typeof projections] ?? projections[defaultStaffBookingCaseId];
  return overrideStaffBookingCaseId(projection, requestedCaseId);
}

export function listStaffBookingHandoffProjections(): readonly StaffBookingHandoffProjection[] {
  return Object.values(projections);
}

export function resolveStaffBookingCaseSeed(
  bookingCaseId: string | null | undefined,
): StaffBookingCaseSeed {
  const projection = resolveStaffBookingHandoffProjectionByCaseId(bookingCaseId);
  return {
    bookingCaseId: projection.bookingCaseId,
    taskId: projection.taskId,
    queueKey: projection.queueKey,
    defaultAnchorRef: projection.compareStage.selectedAnchorRef,
    defaultSelectedSlotId: projection.compareStage.selectedSlotId,
    focusMode: projection.focusMode,
    queueBuffered: projection.compareStage.bufferedQueueChangeCount > 0,
  };
}
