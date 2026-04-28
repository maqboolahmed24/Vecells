import {
  CONTACT_TRUTH_REPAIR_ENTRY,
} from "./contact-truth-preference-ui.model";
import {
  resolveOfferSelectionProjection,
  resolveOfferSelectionSlot,
} from "./patient-booking-offer-selection.model";
import {
  resolveBookingSlotResultsProjectionByScenarioId,
  type BookingSlotSummaryProjection,
} from "./patient-booking-slot-results.model";
import {
  resolveBookingConfirmationProjection,
  type BookingConfirmationProjection,
} from "./patient-booking-confirmation.model";
import {
  resolvePatientAppointmentManageProjection,
  type PatientAppointmentManageProjection,
} from "./patient-appointment-manage.model";
import {
  resolvePatientWaitlistViewProjection,
  type PatientWaitlistViewProjection,
} from "./patient-waitlist-views.model";
import {
  type PatientBookingWorkspaceEntryProjection,
} from "./patient-booking-workspace.model";

export const PATIENT_BOOKING_RECOVERY_TASK_ID =
  "par_301_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_action_recovery_envelopes_for_booking_failures";
export const PATIENT_BOOKING_RECOVERY_VISUAL_MODE = "Booking_Recovery_Envelope";

export type BookingRecoverySurfaceKind =
  | "workspace"
  | "selection"
  | "confirmation"
  | "manage"
  | "waitlist";

export type BookingRecoveryChannelMode = "authenticated" | "secure_link";

export type BookingRecoveryReason =
  | "stale_session"
  | "expired_action"
  | "superseded_action"
  | "confirmation_disputed"
  | "confirmation_pending"
  | "wrong_patient"
  | "contact_route_repair_required";

export type BookingRecoverySummaryTier =
  | "booking_safe_summary"
  | "appointment_safe_summary"
  | "identity_hold_summary";

export type BookingRecoveryIdentityHoldState =
  | "clear"
  | "identity_hold"
  | "wrong_patient_freeze";

export type BookingRecoveryTone = "warn" | "blocked" | "safe";

export type BookingRecoveryNextSafeActionRef =
  | "refresh_surface"
  | "choose_another_time"
  | "wait_for_confirmation"
  | "repair_contact_route"
  | "request_support";

export type BookingRecoveryActionRef =
  | "refresh_selection"
  | "return_to_selection"
  | "refresh_confirmation"
  | "refresh_manage"
  | "keep_waitlist_active"
  | "open_newer_offer"
  | "open_contact_repair"
  | "request_support";

export interface BookingRecoveryRow {
  readonly label: string;
  readonly value: string;
}

export interface BookingRecoveryActionProjection {
  readonly actionRef: BookingRecoveryActionRef;
  readonly label: string;
  readonly detail: string;
  readonly tone: "primary" | "secondary";
  readonly transitionScenarioId: string | null;
}

export interface BookingRecoverySummaryCardProjection {
  readonly heading: string;
  readonly body: string;
  readonly rows: readonly BookingRecoveryRow[];
}

export interface BookingRecoveryReasonPanelProjection {
  readonly heading: string;
  readonly body: string;
  readonly rows: readonly BookingRecoveryRow[];
}

export interface BookingRecoveryNextActionCardProjection {
  readonly heading: string;
  readonly body: string;
  readonly primaryAction: BookingRecoveryActionProjection;
  readonly secondaryActions: readonly BookingRecoveryActionProjection[];
}

export interface BookingIdentityHoldPanelProjection {
  readonly heading: string;
  readonly body: string;
  readonly rows: readonly BookingRecoveryRow[];
}

export interface BookingSecureLinkRecoveryFrameProjection {
  readonly heading: string;
  readonly body: string;
}

export interface BookingContactRepairMorphProjection {
  readonly heading: string;
  readonly body: string;
  readonly rows: readonly BookingRecoveryRow[];
  readonly repairPath: string;
}

export interface BookingRecoveryReturnStubProjection {
  readonly heading: string;
  readonly body: string;
  readonly actionLabel: string;
}

export interface BookingRecoveryReasonDefinition {
  readonly reasonCode: BookingRecoveryReason;
  readonly heading: string;
  readonly patientSafeSummary: string;
  readonly nextSafeActionRef: BookingRecoveryNextSafeActionRef;
  readonly defaultSummaryTier: BookingRecoverySummaryTier;
  readonly tone: BookingRecoveryTone;
}

export const BookingRecoveryReasonCatalog: Record<
  BookingRecoveryReason,
  BookingRecoveryReasonDefinition
> = {
  stale_session: {
    reasonCode: "stale_session",
    heading: "This booking route needs to be refreshed",
    patientSafeSummary:
      "The last safe booking context stays visible, but writable actions stay frozen until route continuity is current again.",
    nextSafeActionRef: "refresh_surface",
    defaultSummaryTier: "booking_safe_summary",
    tone: "blocked",
  },
  expired_action: {
    reasonCode: "expired_action",
    heading: "That booking action is no longer live",
    patientSafeSummary:
      "The last chosen time or offer remains visible as provenance only, and the next safe step is made explicit in place.",
    nextSafeActionRef: "choose_another_time",
    defaultSummaryTier: "booking_safe_summary",
    tone: "warn",
  },
  superseded_action: {
    reasonCode: "superseded_action",
    heading: "A newer safe action replaced the one you were viewing",
    patientSafeSummary:
      "The old offer stays visible as provenance so the patient can see what changed without guessing.",
    nextSafeActionRef: "choose_another_time",
    defaultSummaryTier: "booking_safe_summary",
    tone: "warn",
  },
  confirmation_disputed: {
    reasonCode: "confirmation_disputed",
    heading: "We are checking what happened to this booking",
    patientSafeSummary:
      "The chosen slot stays visible, but the booking cannot be presented as confirmed while the confirmation chain is contradictory.",
    nextSafeActionRef: "choose_another_time",
    defaultSummaryTier: "booking_safe_summary",
    tone: "blocked",
  },
  confirmation_pending: {
    reasonCode: "confirmation_pending",
    heading: "This appointment is still being confirmed",
    patientSafeSummary:
      "Summary context remains visible, but manage or follow-up controls stay read-only until confirmation truth settles.",
    nextSafeActionRef: "wait_for_confirmation",
    defaultSummaryTier: "appointment_safe_summary",
    tone: "warn",
  },
  wrong_patient: {
    reasonCode: "wrong_patient",
    heading: "We paused live booking controls while identity is checked",
    patientSafeSummary:
      "Only summary-tier context stays visible while identity is repaired. Wider detail and follow-up actions stay suppressed.",
    nextSafeActionRef: "request_support",
    defaultSummaryTier: "identity_hold_summary",
    tone: "blocked",
  },
  contact_route_repair_required: {
    reasonCode: "contact_route_repair_required",
    heading: "Reachability must be repaired before this booking action can continue",
    patientSafeSummary:
      "The booking context stays visible, but reminder, waitlist, or reply-dependent actions stay fenced until the route is healthy again.",
    nextSafeActionRef: "repair_contact_route",
    defaultSummaryTier: "appointment_safe_summary",
    tone: "blocked",
  },
};

export interface BookingRecoveryEnvelopeProjection {
  readonly projectionName: "BookingRecoveryEnvelopeProjection";
  readonly taskId: typeof PATIENT_BOOKING_RECOVERY_TASK_ID;
  readonly visualMode: typeof PATIENT_BOOKING_RECOVERY_VISUAL_MODE;
  readonly bookingCaseId: string;
  readonly surfaceKind: BookingRecoverySurfaceKind;
  readonly channelMode: BookingRecoveryChannelMode;
  readonly recoveryReason: BookingRecoveryReason;
  readonly recoveryTupleHash: string;
  readonly patientActionRecoveryEnvelopeRef: "PatientActionRecoveryEnvelope";
  readonly patientActionRecoveryProjectionRef: "PatientActionRecoveryProjection";
  readonly recoveryContinuationTokenRef: "RecoveryContinuationToken";
  readonly requestReturnBundleRef: string | null;
  readonly lastSafeSummaryRef: string;
  readonly selectedAnchorRef: string;
  readonly selectedAnchorLabel: string;
  readonly summaryTier: BookingRecoverySummaryTier;
  readonly identityHoldState: BookingRecoveryIdentityHoldState;
  readonly nextSafeActionRef: BookingRecoveryNextSafeActionRef;
  readonly reentryRouteFamily:
    | "rf_patient_booking_workspace"
    | "rf_patient_secure_link_recovery";
  readonly tone: BookingRecoveryTone;
  readonly summaryCard: BookingRecoverySummaryCardProjection;
  readonly reasonPanel: BookingRecoveryReasonPanelProjection;
  readonly nextActionCard: BookingRecoveryNextActionCardProjection;
  readonly identityHoldPanel: BookingIdentityHoldPanelProjection | null;
  readonly secureLinkFrame: BookingSecureLinkRecoveryFrameProjection | null;
  readonly contactRepairMorph: BookingContactRepairMorphProjection | null;
  readonly returnStub: BookingRecoveryReturnStubProjection;
  readonly liveAnnouncement: string;
}

function hash(input: string): string {
  let value = 0;
  for (const character of input) {
    value = (value * 33 + character.charCodeAt(0)) >>> 0;
  }
  return `recovery_301_${value.toString(16).padStart(8, "0")}`;
}

function basePrimaryAction(
  actionRef: BookingRecoveryActionRef,
  label: string,
  detail: string,
  transitionScenarioId: string | null,
): BookingRecoveryActionProjection {
  return {
    actionRef,
    label,
    detail,
    tone: "primary",
    transitionScenarioId,
  };
}

function baseSecondaryAction(
  actionRef: BookingRecoveryActionRef,
  label: string,
  detail: string,
  transitionScenarioId: string | null = null,
): BookingRecoveryActionProjection {
  return {
    actionRef,
    label,
    detail,
    tone: "secondary",
    transitionScenarioId,
  };
}

function slotRows(slot: BookingSlotSummaryProjection): readonly BookingRecoveryRow[] {
  return [
    { label: "Time", value: `${slot.dayLongLabel} · ${slot.startTimeLabel} to ${slot.endTimeLabel}` },
    { label: "Location", value: `${slot.siteLabel} · ${slot.modalityLabel}` },
    { label: "Clinician", value: slot.clinicianLabel },
  ];
}

function appointmentSafeRows(
  projection: PatientAppointmentManageProjection | BookingConfirmationProjection,
): readonly BookingRecoveryRow[] {
  const sourceRows =
    "appointmentRows" in projection
      ? projection.appointmentRows
      : projection.bookedSummaryRows.length > 0
        ? projection.bookedSummaryRows
        : projection.stateRows;
  return sourceRows.slice(0, 3);
}

function identityHoldRows(
  projection: BookingConfirmationProjection,
): readonly BookingRecoveryRow[] {
  return [
    { label: "Current truth", value: "Confirmed, but frozen by identity repair" },
    { label: "Visible now", value: "Safe summary only" },
    { label: "Next safe step", value: projection.secondaryActions[0]?.label ?? "Use support" },
  ];
}

function waitlistOfferRows(projection: PatientWaitlistViewProjection): readonly BookingRecoveryRow[] {
  if (!projection.activeOffer) {
    return [
      { label: "Current waitlist state", value: projection.stateHeading },
      { label: "Offer posture", value: projection.offerExpiryMode.replaceAll("_", " ") },
      { label: "Fallback", value: projection.fallback.requiredFallbackRoute.replaceAll("_", " ") },
    ];
  }
  return [
    {
      label: "Offer",
      value: `${projection.activeOffer.dayLongLabel} · ${projection.activeOffer.startTimeLabel} to ${projection.activeOffer.endTimeLabel}`,
    },
    {
      label: "Location",
      value: `${projection.activeOffer.siteLabel} · ${projection.activeOffer.modalityLabel}`,
    },
    {
      label: "Clinician",
      value: projection.activeOffer.clinicianLabel,
    },
  ];
}

function workspaceSummaryRows(
  entry: PatientBookingWorkspaceEntryProjection,
): readonly BookingRecoveryRow[] {
  return [
    entry.workspace.needRows[0] ?? { label: "Need", value: entry.workspace.heading },
    entry.workspace.needRows[1] ?? { label: "Current posture", value: entry.workspace.subheading },
    {
      label: "Return path",
      value: `Return to ${entry.workspace.returnContract.originLabel}`,
    },
  ];
}

function secureLinkFrame(
  channelMode: BookingRecoveryChannelMode,
): BookingSecureLinkRecoveryFrameProjection | null {
  if (channelMode !== "secure_link") {
    return null;
  }
  return {
    heading: "Secure-link recovery stays aligned with the signed-in explanation",
    body:
      "This route keeps the same recovery reason and next safe action while staying bound to the secure-link return contract.",
  };
}

function contactRepairProjection(
  blockedActionLabel: string,
  channelLabel: string,
): BookingContactRepairMorphProjection {
  return {
    heading: "Same-shell contact repair stays attached to this booking context",
    body:
      "Reachability repair is a governed next step, not a detached settings detour. The booking summary remains visible while the route is repaired.",
    rows: [
      { label: "Blocked action", value: blockedActionLabel },
      { label: "Repair route", value: CONTACT_TRUTH_REPAIR_ENTRY },
      { label: "Channel", value: channelLabel },
    ],
    repairPath: CONTACT_TRUTH_REPAIR_ENTRY,
  };
}

function buildEnvelope(input: {
  bookingCaseId: string;
  surfaceKind: BookingRecoverySurfaceKind;
  channelMode: BookingRecoveryChannelMode;
  recoveryReason: BookingRecoveryReason;
  requestReturnBundleRef?: string | null;
  lastSafeSummaryRef: string;
  selectedAnchorRef: string;
  selectedAnchorLabel: string;
  summaryTier?: BookingRecoverySummaryTier;
  identityHoldState?: BookingRecoveryIdentityHoldState;
  reentryRouteFamily?: BookingRecoveryEnvelopeProjection["reentryRouteFamily"];
  summaryCard: BookingRecoverySummaryCardProjection;
  reasonRows: readonly BookingRecoveryRow[];
  nextActionCard: BookingRecoveryNextActionCardProjection;
  identityHoldPanel?: BookingIdentityHoldPanelProjection | null;
  contactRepairMorph?: BookingContactRepairMorphProjection | null;
  returnLabel: string;
  liveAnnouncement: string;
}): BookingRecoveryEnvelopeProjection {
  const definition = BookingRecoveryReasonCatalog[input.recoveryReason];
  return {
    projectionName: "BookingRecoveryEnvelopeProjection",
    taskId: PATIENT_BOOKING_RECOVERY_TASK_ID,
    visualMode: PATIENT_BOOKING_RECOVERY_VISUAL_MODE,
    bookingCaseId: input.bookingCaseId,
    surfaceKind: input.surfaceKind,
    channelMode: input.channelMode,
    recoveryReason: input.recoveryReason,
    recoveryTupleHash: hash(
      `${input.bookingCaseId}:${input.surfaceKind}:${input.recoveryReason}:${input.selectedAnchorRef}:${input.channelMode}`,
    ),
    patientActionRecoveryEnvelopeRef: "PatientActionRecoveryEnvelope",
    patientActionRecoveryProjectionRef: "PatientActionRecoveryProjection",
    recoveryContinuationTokenRef: "RecoveryContinuationToken",
    requestReturnBundleRef: input.requestReturnBundleRef ?? null,
    lastSafeSummaryRef: input.lastSafeSummaryRef,
    selectedAnchorRef: input.selectedAnchorRef,
    selectedAnchorLabel: input.selectedAnchorLabel,
    summaryTier: input.summaryTier ?? definition.defaultSummaryTier,
    identityHoldState: input.identityHoldState ?? "clear",
    nextSafeActionRef: definition.nextSafeActionRef,
    reentryRouteFamily:
      input.reentryRouteFamily ??
      (input.channelMode === "secure_link"
        ? "rf_patient_secure_link_recovery"
        : "rf_patient_booking_workspace"),
    tone: definition.tone,
    summaryCard: input.summaryCard,
    reasonPanel: {
      heading: definition.heading,
      body: definition.patientSafeSummary,
      rows: input.reasonRows,
    },
    nextActionCard: input.nextActionCard,
    identityHoldPanel: input.identityHoldPanel ?? null,
    secureLinkFrame: secureLinkFrame(input.channelMode),
    contactRepairMorph: input.contactRepairMorph ?? null,
    returnStub: {
      heading: "Return stays governed by the current booking continuity",
      body:
        "Quiet return remains available without guessing from browser history, so the patient can leave recovery without losing the governing context.",
      actionLabel: input.returnLabel,
    },
    liveAnnouncement: input.liveAnnouncement,
  };
}

export function resolveWorkspaceBookingRecoveryEnvelope(
  entry: PatientBookingWorkspaceEntryProjection,
  channelMode: BookingRecoveryChannelMode,
): BookingRecoveryEnvelopeProjection | null {
  if (
    entry.routeKey !== "workspace" ||
    entry.workspace.shellState !== "recovery_required"
  ) {
    return null;
  }
  return buildEnvelope({
    bookingCaseId: entry.workspace.bookingCaseId,
    surfaceKind: "workspace",
    channelMode,
    recoveryReason: "stale_session",
    lastSafeSummaryRef: "PatientAppointmentWorkspaceProjection",
    selectedAnchorRef: entry.workspace.continuityEvidence.selectedAnchorRef,
    selectedAnchorLabel: entry.workspace.continuityEvidence.selectedAnchorLabel,
    summaryCard: {
      heading: "Last safe booking summary",
      body:
        "The booking need and return context remain visible while the workspace recovers in place.",
      rows: workspaceSummaryRows(entry),
    },
    reasonRows: [
      { label: "Current shell", value: entry.workspace.shellState.replaceAll("_", " ") },
      {
        label: "Continuity",
        value: entry.workspace.continuityEvidence.continuityState.replaceAll("_", " "),
      },
      {
        label: "Publication",
        value:
          entry.workspace.continuityEvidence.publicationReason ??
          entry.workspace.continuityEvidence.routePublicationState.replaceAll("_", " "),
      },
    ],
    nextActionCard: {
      heading: "Next safe action",
      body:
        "Restore continuity or use support. This workspace does not reopen writable booking from a stale shell.",
      primaryAction: basePrimaryAction(
        "request_support",
        "Restore continuity",
        "Use the existing booking help path while continuity is re-proven.",
        null,
      ),
      secondaryActions: [
        baseSecondaryAction(
          "request_support",
          entry.workspace.supportPath.actionLabel,
          entry.workspace.supportPath.copy,
        ),
      ],
    },
    returnLabel: `Return to ${entry.workspace.returnContract.originLabel}`,
    liveAnnouncement:
      "Booking recovery loaded. The last safe booking summary remains visible while continuity is restored.",
  });
}

export function resolveSelectionBookingRecoveryEnvelope(
  bookingCaseId: string,
  channelMode: BookingRecoveryChannelMode,
  supportActionLabel: string,
): BookingRecoveryEnvelopeProjection | null {
  const selection = resolveOfferSelectionProjection(bookingCaseId);
  if (!selection) {
    return null;
  }
  const slotResults = resolveBookingSlotResultsProjectionByScenarioId(selection.slotResultsScenarioId);
  const selectedSlot =
    resolveOfferSelectionSlot(slotResults!, selection.selectedSlotId) ?? null;
  const selectedTruth =
    selectedSlot ? selection.reservationTruthBySlotId[selectedSlot.slotSummaryId] ?? null : null;
  if (
    !selectedSlot ||
    !selectedTruth ||
    (selectedTruth.truthState !== "revalidation_required" &&
      selectedTruth.truthState !== "expired" &&
      selectedTruth.truthState !== "released" &&
      selectedTruth.truthState !== "unavailable")
  ) {
    return null;
  }

  const recoveryReason =
    selectedTruth.truthState === "revalidation_required"
      ? "stale_session"
      : "expired_action";

  return buildEnvelope({
    bookingCaseId,
    surfaceKind: "selection",
    channelMode,
    recoveryReason,
    lastSafeSummaryRef: "OfferSelectionProjection",
    selectedAnchorRef: "selected-slot-pin",
    selectedAnchorLabel: "Selected slot provenance",
    summaryCard: {
      heading: "Last safe selected slot",
      body:
        "The chosen time remains visible so the patient can see which booking attempt is being recovered.",
      rows: slotRows(selectedSlot),
    },
    reasonRows: [
      { label: "Snapshot", value: slotResults?.viewState.replaceAll("_", " ") ?? "unknown" },
      { label: "Reservation truth", value: selectedTruth.truthState.replaceAll("_", " ") },
      { label: "Current cue", value: selectedTruth.dominantCue },
    ],
    nextActionCard: {
      heading: "Next safe action",
      body:
        recoveryReason === "stale_session"
          ? "Refresh this route before continuing."
          : "Choose another ranked time or use the support path.",
      primaryAction:
        recoveryReason === "stale_session"
          ? basePrimaryAction(
              "refresh_selection",
              "Refresh results",
              "Refresh the current ranked snapshot before continuing.",
              selection.refreshProjectionRef ?? "booking_case_295_nonexclusive_refreshed",
            )
          : basePrimaryAction(
              "return_to_selection",
              "Choose another time",
              "Return to the ranked results instead of continuing with an expired or unavailable selection.",
              null,
            ),
      secondaryActions: [
        baseSecondaryAction(
          "request_support",
          supportActionLabel,
          "Use the governed booking help path instead of relying on stale selection state.",
        ),
      ],
    },
    returnLabel: "Return to booking origin",
    liveAnnouncement:
      recoveryReason === "stale_session"
        ? "Selection recovery loaded. Refresh the snapshot before continuing."
        : "Selection recovery loaded. The previous slot is no longer live.",
  });
}

export function resolveConfirmationBookingRecoveryEnvelope(
  bookingCaseId: string,
  channelMode: BookingRecoveryChannelMode,
  supportActionLabel: string,
): BookingRecoveryEnvelopeProjection | null {
  const projection = resolveBookingConfirmationProjection(bookingCaseId);
  if (!projection || projection.viewKind !== "recovery") {
    return null;
  }
  const slotResults = resolveBookingSlotResultsProjectionByScenarioId(projection.slotResultsScenarioId);
  const slot = slotResults
    ? slotResults.slots.find((entry) => entry.slotSummaryId === projection.selectedSlotId) ?? null
    : null;
  const reason: BookingRecoveryReason =
    projection.routeFreezeState === "identity_repair_active"
      ? "wrong_patient"
      : projection.confirmationTruthState === "reconciliation_required"
        ? "confirmation_disputed"
        : "stale_session";

  return buildEnvelope({
    bookingCaseId,
    surfaceKind: "confirmation",
    channelMode,
    recoveryReason: reason,
    lastSafeSummaryRef: "BookingConfirmationProjection",
    selectedAnchorRef: "booking-confirmation-selected-slot",
    selectedAnchorLabel: "Selected booking provenance",
    summaryTier: reason === "wrong_patient" ? "identity_hold_summary" : "booking_safe_summary",
    identityHoldState: reason === "wrong_patient" ? "wrong_patient_freeze" : "clear",
    summaryCard: {
      heading: "Last safe booking summary",
      body:
        reason === "wrong_patient"
          ? "Only summary-tier context remains visible while identity repair is active."
          : "The selected slot stays visible while confirmation recovery explains what is still known safely.",
      rows:
        reason === "wrong_patient"
          ? identityHoldRows(projection)
          : slot
            ? slotRows(slot)
            : appointmentSafeRows(projection),
    },
    reasonRows: [
      { label: "Confirmation truth", value: projection.confirmationTruthState.replaceAll("_", " ") },
      { label: "Route freeze", value: projection.routeFreezeState.replaceAll("_", " ") },
      { label: "Current cue", value: projection.ribbonDetail },
    ],
    nextActionCard: {
      heading: "Next safe action",
      body:
        reason === "confirmation_disputed"
          ? "Choose another time or use support while the contradictory confirmation chain is resolved."
          : reason === "wrong_patient"
            ? "Use support while identity repair completes."
            : "Refresh this route before attempting another live action.",
      primaryAction:
        reason === "confirmation_disputed"
          ? basePrimaryAction(
              "return_to_selection",
              "Choose another time",
              "Return to the ranked slot list from the same booking shell.",
              null,
            )
          : reason === "wrong_patient"
            ? basePrimaryAction(
                "request_support",
                "Use the support path",
                "Continue safely while identity repair is still active.",
                null,
              )
            : basePrimaryAction(
                "refresh_confirmation",
                "Refresh this route",
                "Revalidate confirmation truth and route continuity before restoring live controls.",
                projection.primaryAction?.transitionScenarioId ?? "booking_case_296_pending",
              ),
      secondaryActions: [
        baseSecondaryAction(
          "request_support",
          supportActionLabel,
          "Use the governed support path instead of assuming the booking is final.",
        ),
      ],
    },
    identityHoldPanel:
      reason === "wrong_patient"
        ? {
            heading: "Identity hold",
            body:
              "This recovery state preserves only safe context. PHI-bearing detail, artifacts, and follow-up actions stay suppressed until identity repair is released.",
            rows: [
              { label: "Visible now", value: "Safe summary only" },
              { label: "Suppressed", value: "Manage, reminders, export, print, directions, and browser handoff" },
              { label: "Reason", value: "Identity repair freeze active" },
            ],
          }
        : null,
    returnLabel: "Return to booking origin",
    liveAnnouncement:
      reason === "confirmation_disputed"
        ? "Booking recovery loaded. Confirmation is disputed and not yet final."
        : reason === "wrong_patient"
          ? "Booking recovery loaded. Identity repair is active."
          : "Booking recovery loaded. Refresh this confirmation route before continuing.",
  });
}

export function resolveManageBookingRecoveryEnvelope(
  bookingCaseId: string,
  channelMode: BookingRecoveryChannelMode,
  supportActionLabel: string,
): BookingRecoveryEnvelopeProjection | null {
  const projection = resolvePatientAppointmentManageProjection(bookingCaseId);
  if (!projection || projection.viewKind !== "recovery") {
    return null;
  }
  const reason: BookingRecoveryReason =
    projection.reminderPanel.contactRouteState === "repair_required"
      ? "contact_route_repair_required"
      : projection.confirmationTruthState === "confirmation_pending"
        ? "confirmation_pending"
        : "stale_session";

  return buildEnvelope({
    bookingCaseId,
    surfaceKind: "manage",
    channelMode,
    recoveryReason: reason,
    lastSafeSummaryRef: "PatientAppointmentManageProjection",
    selectedAnchorRef: "booking-manage-stage",
    selectedAnchorLabel: "Manage appointment studio",
    summaryCard: {
      heading: "Last safe appointment summary",
      body:
        "The appointment stays visible while manage recovery explains what remains safe to do next.",
      rows: appointmentSafeRows(projection),
    },
    reasonRows: [
      { label: "Manage posture", value: projection.manageExposureState.replaceAll("_", " ") },
      { label: "Confirmation truth", value: projection.confirmationTruthState.replaceAll("_", " ") },
      { label: "Current blocker", value: projection.pendingRows[0]?.value ?? projection.stateBody },
    ],
    nextActionCard: {
      heading: "Next safe action",
      body:
        reason === "contact_route_repair_required"
          ? "Open the same-shell repair guidance or use support."
          : reason === "confirmation_pending"
            ? "Refresh confirmation status or wait here."
            : "Refresh this manage route before changing anything.",
      primaryAction:
        reason === "contact_route_repair_required"
          ? basePrimaryAction(
              "open_contact_repair",
              "Review contact repair",
              "Keep the booking summary visible while reminder-route repair guidance opens in place.",
              null,
            )
          : reason === "confirmation_pending"
            ? basePrimaryAction(
                "refresh_manage",
                "Refresh confirmation status",
                "Refresh authoritative confirmation truth for this appointment.",
                projection.actionDeck[0]?.transitionScenarioId ?? "booking_case_297_ready",
              )
            : basePrimaryAction(
                "refresh_manage",
                "Refresh this route",
                "Revalidate manage continuity before restoring writable actions.",
                projection.actionDeck[0]?.transitionScenarioId ?? "booking_case_297_ready",
              ),
      secondaryActions: [
        baseSecondaryAction(
          "request_support",
          supportActionLabel,
          projection.supportPath.copy,
        ),
      ],
    },
    contactRepairMorph:
      reason === "contact_route_repair_required"
        ? contactRepairProjection("Reminder route change", "Reminder and reply route")
        : null,
    returnLabel: "Return to booking origin",
    liveAnnouncement:
      reason === "contact_route_repair_required"
        ? "Manage recovery loaded. Reminder-route repair is required."
        : reason === "confirmation_pending"
          ? "Manage recovery loaded. This appointment is still being confirmed."
          : "Manage recovery loaded. Refresh the route before changing anything.",
  });
}

export function resolveWaitlistBookingRecoveryEnvelope(
  bookingCaseId: string,
  channelMode: BookingRecoveryChannelMode,
  supportActionLabel: string,
): BookingRecoveryEnvelopeProjection | null {
  const projection = resolvePatientWaitlistViewProjection(bookingCaseId);
  if (!projection) {
    return null;
  }
  const reason: BookingRecoveryReason | null =
    projection.reachabilityState === "repair_required"
      ? "contact_route_repair_required"
      : projection.offerExpiryMode === "expired"
        ? "expired_action"
        : projection.offerExpiryMode === "superseded"
          ? "superseded_action"
          : null;
  if (!reason) {
    return null;
  }

  return buildEnvelope({
    bookingCaseId,
    surfaceKind: "waitlist",
    channelMode,
    recoveryReason: reason,
    lastSafeSummaryRef: "PatientWaitlistViewProjection",
    selectedAnchorRef: "patient-waitlist-heading",
    selectedAnchorLabel: "Waitlist continuation",
    summaryCard: {
      heading: "Last safe waitlist summary",
      body:
        "The active offer or waiting context remains visible while the next safe step is explained in one place.",
      rows: waitlistOfferRows(projection),
    },
    reasonRows: [
      { label: "Waitlist state", value: projection.viewKind.replaceAll("_", " ") },
      { label: "Offer posture", value: projection.offerExpiryMode.replaceAll("_", " ") },
      { label: "Current cue", value: projection.stateBody },
    ],
    nextActionCard: {
      heading: "Next safe action",
      body:
        reason === "contact_route_repair_required"
          ? "Repair the route in place or use the support path."
          : reason === "superseded_action"
            ? "Open the newer offer that replaced this one."
            : "Keep the waitlist active or use the support path.",
      primaryAction:
        reason === "contact_route_repair_required"
          ? basePrimaryAction(
              "open_contact_repair",
              "Repair the route",
              "Keep the offer visible while the blocked route is repaired.",
              projection.primaryAction?.transitionScenarioId ?? null,
            )
          : reason === "superseded_action"
            ? basePrimaryAction(
                "open_newer_offer",
                "Open the newer offer",
                "Move to the newer active offer without losing the waitlist context.",
                projection.primaryAction?.transitionScenarioId ?? null,
              )
            : basePrimaryAction(
                "keep_waitlist_active",
                "Keep the waitlist active",
                "Stay on the local waitlist while a new safe offer is found.",
                projection.primaryAction?.transitionScenarioId ?? null,
              ),
      secondaryActions: [
        baseSecondaryAction(
          "request_support",
          supportActionLabel,
          "Use the governed booking help path for this waitlist recovery.",
        ),
      ],
    },
    contactRepairMorph:
      reason === "contact_route_repair_required"
        ? contactRepairProjection(
            projection.contactRepair?.blockedActionSummary ?? "Waitlist offer acceptance",
            projection.contactRepair?.channelLabel ?? "Waitlist reply route",
          )
        : null,
    returnLabel: "Return to booking origin",
    liveAnnouncement:
      reason === "contact_route_repair_required"
        ? "Waitlist recovery loaded. Contact-route repair is required."
        : reason === "superseded_action"
          ? "Waitlist recovery loaded. A newer offer replaced this one."
          : "Waitlist recovery loaded. This offer is no longer live.",
  });
}

export function bookingRecoveryStateMatrix(): Array<Record<string, string>> {
  const rows: Array<Record<string, string>> = [];

  const workspaceEntry = {
    pathname: "/bookings/booking_case_293_recovery",
    routeKey: "workspace",
  } as const;
  rows.push({
    scenario_id: "booking_case_293_recovery",
    surface_kind: "workspace",
    route: workspaceEntry.pathname,
    reason: "stale_session",
    channel_mode: "authenticated",
    next_safe_action: "request_support",
  });

  for (const [bookingCaseId, surfaceKind, reason] of [
    ["booking_case_295_stale", "selection", "stale_session"],
    ["booking_case_295_unavailable", "selection", "expired_action"],
    ["booking_case_296_reconciliation", "confirmation", "confirmation_disputed"],
    ["booking_case_296_route_drift", "confirmation", "stale_session"],
    ["booking_case_296_identity_repair", "confirmation", "wrong_patient"],
    ["booking_case_297_stale", "manage", "stale_session"],
    ["booking_case_297_confirmation_pending", "manage", "confirmation_pending"],
    ["booking_case_297_reminder_blocked", "manage", "contact_route_repair_required"],
    ["booking_case_298_offer_expired", "waitlist", "expired_action"],
    ["booking_case_298_offer_superseded", "waitlist", "superseded_action"],
    ["booking_case_298_contact_repair", "waitlist", "contact_route_repair_required"],
    ["booking_case_298_contact_repair_secure", "waitlist", "contact_route_repair_required"],
  ] as const) {
    rows.push({
      scenario_id: bookingCaseId,
      surface_kind: surfaceKind,
      route:
        surfaceKind === "manage"
          ? `/bookings/${bookingCaseId}/manage`
          : surfaceKind === "waitlist"
            ? `/bookings/${bookingCaseId.replace("_secure", "")}/waitlist`
            : surfaceKind === "confirmation"
              ? `/bookings/${bookingCaseId}/confirm`
              : `/bookings/${bookingCaseId}/select`,
      reason,
      channel_mode: bookingCaseId.endsWith("_secure") ? "secure_link" : "authenticated",
      next_safe_action:
        reason === "contact_route_repair_required"
          ? "repair_contact_route"
          : reason === "confirmation_pending"
            ? "wait_for_confirmation"
            : reason === "confirmation_disputed" || reason === "expired_action" || reason === "superseded_action"
              ? "choose_another_time"
              : "refresh_surface",
    });
  }

  return rows;
}

export function bookingRecoveryContractSummary() {
  return {
    taskId: PATIENT_BOOKING_RECOVERY_TASK_ID,
    visualMode: PATIENT_BOOKING_RECOVERY_VISUAL_MODE,
    routes: [
      "/bookings/:bookingCaseId",
      "/bookings/:bookingCaseId/select",
      "/bookings/:bookingCaseId/confirm",
      "/bookings/:bookingCaseId/manage",
      "/bookings/:bookingCaseId/waitlist",
    ],
    uiPrimitives: [
      "BookingRecoveryShell",
      "BookingRecoveryReasonPanel",
      "BookingRecoverySummaryCard",
      "BookingRecoveryNextActionCard",
      "BookingIdentityHoldPanel",
      "BookingSecureLinkRecoveryFrame",
      "BookingContactRepairMorph",
      "BookingRecoveryReturnStub",
      "BookingRecoveryReasonCatalog",
    ],
    domMarkers: [
      "data-recovery-reason",
      "data-summary-tier",
      "data-identity-hold-state",
      "data-next-safe-action",
      "data-reentry-route-family",
      "data-channel-mode",
    ],
    scenarioIds: bookingRecoveryStateMatrix().map((row) => row.scenario_id),
  };
}
