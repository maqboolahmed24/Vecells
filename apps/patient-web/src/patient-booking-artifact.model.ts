import {
  resolveBookingConfirmationProjection,
  resolveBookingConfirmationSlot,
  type BookingConfirmationProjection,
} from "./patient-booking-confirmation.model";
import {
  resolvePatientAppointmentManageProjection,
  type AppointmentManageSummaryRow,
  type PatientAppointmentManageProjection,
} from "./patient-appointment-manage.model";
import type {
  BookingArtifactRouteMode,
  BookingArtifactRouteSource,
} from "./patient-booking-workspace.model";

export const PATIENT_BOOKING_ARTIFACT_TASK_ID =
  "par_303_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_accessibility_and_artifact_parity_for_booking_documents";
export const PATIENT_BOOKING_ARTIFACT_VISUAL_MODE = "Booking_Artifact_Frame";

export type BookingArtifactParityPosture = "verified" | "summary_only" | "recovery_only";
export type BookingArtifactGrantState = "granted" | "summary_only" | "blocked";
export type BookingArtifactPrintPosture = "ready" | "summary_only" | "blocked";
export type BookingArtifactHandoffReadiness = "ready" | "summary_only" | "blocked";
export type BookingArtifactActionReadiness = "ready" | "summary_only" | "blocked";

export interface BookingArtifactRow {
  readonly label: string;
  readonly value: string;
}

export interface BookingArtifactModeAction {
  readonly mode: BookingArtifactRouteMode;
  readonly label: string;
  readonly detail: string;
  readonly readiness: BookingArtifactActionReadiness;
}

export interface PatientBookingArtifactProjection {
  readonly projectionName: "PatientBookingArtifactProjection303";
  readonly scenarioId: string;
  readonly bookingCaseId: string;
  readonly source: BookingArtifactRouteSource;
  readonly mode: BookingArtifactRouteMode;
  readonly heading: string;
  readonly summaryLead: string;
  readonly sourceLabel: string;
  readonly returnLabel: string;
  readonly returnPath: string;
  readonly artifactExposureState: "hidden" | "summary_only" | "handoff_ready";
  readonly confirmationTruthState: string;
  readonly reminderExposureState: string;
  readonly sourcePosture: string;
  readonly appointmentHeading: string;
  readonly primaryAttendanceInstruction: string;
  readonly parityPosture: BookingArtifactParityPosture;
  readonly grantState: BookingArtifactGrantState;
  readonly printPosture: BookingArtifactPrintPosture;
  readonly handoffReadiness: BookingArtifactHandoffReadiness;
  readonly artifactPresentationContractRef: string;
  readonly artifactSurfaceFrameRef: string;
  readonly artifactParityDigestRef: string;
  readonly outboundNavigationGrantRef: string | null;
  readonly providerReference: string | null;
  readonly receiptRows: readonly BookingArtifactRow[];
  readonly attendanceRows: readonly BookingArtifactRow[];
  readonly reminderRows: readonly BookingArtifactRow[];
  readonly calendarRows: readonly BookingArtifactRow[];
  readonly printRows: readonly BookingArtifactRow[];
  readonly directionsRows: readonly BookingArtifactRow[];
  readonly browserRows: readonly BookingArtifactRow[];
  readonly parityRows: readonly BookingArtifactRow[];
  readonly metadataRows: readonly BookingArtifactRow[];
  readonly actionTray: readonly BookingArtifactModeAction[];
}

function asRows(rows: readonly AppointmentManageSummaryRow[]): readonly BookingArtifactRow[] {
  return rows.map((row) => ({ label: row.label, value: row.value }));
}

function resolveSummaryRows(
  source: BookingArtifactRouteSource,
  confirmation: BookingConfirmationProjection | null,
  manage: PatientAppointmentManageProjection | null,
): readonly BookingArtifactRow[] {
  if (source === "manage" && manage) {
    return asRows(manage.appointmentRows);
  }
  if (confirmation?.bookedSummaryRows.length) {
    return confirmation.bookedSummaryRows.map((row) => ({ label: row.label, value: row.value }));
  }
  if (confirmation) {
    const slot = resolveBookingConfirmationSlot(confirmation);
    return [
      {
        label: "Appointment",
        value: `${slot.dayLongLabel}, ${slot.startTimeLabel} to ${slot.endTimeLabel}`,
      },
      {
        label: "Location",
        value: `${slot.siteLabel} · ${slot.modalityLabel}`,
      },
      {
        label: "Clinician",
        value: slot.clinicianLabel,
      },
      {
        label: "Arrival",
        value:
          slot.modality === "face_to_face"
            ? "Arrive 10 minutes early and bring your confirmation reference."
            : "Review the summary here before using any secondary handoff.",
      },
    ];
  }
  if (manage) {
    return asRows(manage.appointmentRows);
  }
  return [
    { label: "Appointment", value: "Summary unavailable" },
    { label: "Safe posture", value: "Return to the last safe booking shell." },
  ];
}

function resolveAttendanceRows(
  manage: PatientAppointmentManageProjection | null,
  confirmation: BookingConfirmationProjection | null,
): readonly BookingArtifactRow[] {
  if (manage?.attendanceRows.length) {
    return asRows(manage.attendanceRows);
  }
  if (confirmation) {
    const slot = resolveBookingConfirmationSlot(confirmation);
    return [
      {
        label: "Attendance",
        value:
          slot.modality === "face_to_face"
            ? "Arrive 10 minutes early and check in at reception."
            : "Open the governed handoff from this same-shell summary when ready.",
      },
      { label: "Modality", value: slot.modalityLabel },
      { label: "Site", value: slot.siteLabel },
    ];
  }
  return [{ label: "Attendance", value: "Attendance instructions are not available." }];
}

function resolveReminderRows(
  source: BookingArtifactRouteSource,
  confirmation: BookingConfirmationProjection | null,
  manage: PatientAppointmentManageProjection | null,
): readonly BookingArtifactRow[] {
  if (source === "manage" && manage?.reminderPanel.preferenceRows.length) {
    return asRows(manage.reminderPanel.preferenceRows);
  }
  if (confirmation?.reminderRows.length) {
    return confirmation.reminderRows.map((row) => ({ label: row.label, value: row.value }));
  }
  if (manage?.reminderPanel.preferenceRows.length) {
    return asRows(manage.reminderPanel.preferenceRows);
  }
  return [{ label: "Reminder posture", value: "No reminder evidence is available." }];
}

function resolveSourcePosture(
  source: BookingArtifactRouteSource,
  confirmation: BookingConfirmationProjection | null,
  manage: PatientAppointmentManageProjection | null,
): string {
  if (source === "manage") {
    return manage?.continuityState ?? "trusted";
  }
  return confirmation?.routeFreezeState ?? "live";
}

function resolveExposureState(
  confirmation: BookingConfirmationProjection | null,
  manage: PatientAppointmentManageProjection | null,
): "hidden" | "summary_only" | "handoff_ready" {
  return confirmation?.artifactExposureState ?? manage?.artifactExposureState ?? "summary_only";
}

function buildModeReadiness(
  exposure: "hidden" | "summary_only" | "handoff_ready",
  sourcePosture: string,
  confirmationTruthState: string,
): {
  parityPosture: BookingArtifactParityPosture;
  grantState: BookingArtifactGrantState;
  printPosture: BookingArtifactPrintPosture;
  handoffReadiness: BookingArtifactHandoffReadiness;
} {
  const blockedSource =
    sourcePosture === "identity_repair_active" ||
    sourcePosture === "publication_stale" ||
    sourcePosture === "continuity_drift" ||
    sourcePosture === "stale" ||
    sourcePosture === "blocked";
  if (blockedSource || exposure === "hidden") {
    return {
      parityPosture: "recovery_only",
      grantState: "blocked",
      printPosture: "blocked",
      handoffReadiness: "blocked",
    };
  }
  if (confirmationTruthState !== "confirmed" || exposure === "summary_only") {
    return {
      parityPosture: "summary_only",
      grantState: "summary_only",
      printPosture: "summary_only",
      handoffReadiness: "summary_only",
    };
  }
  return {
    parityPosture: "verified",
    grantState: "granted",
    printPosture: "ready",
    handoffReadiness: "ready",
  };
}

function readinessFor(
  mode: BookingArtifactRouteMode,
  state: {
    grantState: BookingArtifactGrantState;
    printPosture: BookingArtifactPrintPosture;
    handoffReadiness: BookingArtifactHandoffReadiness;
  },
): BookingArtifactActionReadiness {
  if (mode === "receipt") {
    return "ready";
  }
  if (mode === "print") {
    return state.printPosture === "ready"
      ? "ready"
      : state.printPosture === "summary_only"
        ? "summary_only"
        : "blocked";
  }
  if (mode === "calendar") {
    return state.grantState === "granted"
      ? "ready"
      : state.grantState === "summary_only"
        ? "summary_only"
        : "blocked";
  }
  return state.handoffReadiness;
}

function buildModeActions(
  state: {
    grantState: BookingArtifactGrantState;
    printPosture: BookingArtifactPrintPosture;
    handoffReadiness: BookingArtifactHandoffReadiness;
  },
): readonly BookingArtifactModeAction[] {
  return [
    {
      mode: "receipt",
      label: "Receipt",
      detail: "Keep the authoritative appointment summary as the primary artifact.",
      readiness: "ready",
    },
    {
      mode: "calendar",
      label: "Calendar",
      detail: "Review the governed event payload before any calendar export leaves the shell.",
      readiness: readinessFor("calendar", state),
    },
    {
      mode: "print",
      label: "Print",
      detail: "Use the summary-bound print view; do not jump straight to a detached print route.",
      readiness: readinessFor("print", state),
    },
    {
      mode: "directions",
      label: "Directions",
      detail: "Directions handoff stays bound to the same appointment anchor and return contract.",
      readiness: readinessFor("directions", state),
    },
    {
      mode: "browser_handoff",
      label: "Browser handoff",
      detail: "External navigation is secondary and must stay grant-bound and return-safe.",
      readiness: readinessFor("browser_handoff", state),
    },
  ];
}

export function resolvePatientBookingArtifactProjection(input: {
  bookingCaseId: string;
  source: BookingArtifactRouteSource;
  mode: BookingArtifactRouteMode;
}): PatientBookingArtifactProjection {
  const confirmation = resolveBookingConfirmationProjection(input.bookingCaseId);
  const manage = resolvePatientAppointmentManageProjection(input.bookingCaseId);
  const exposure = resolveExposureState(confirmation, manage);
  const sourcePosture = resolveSourcePosture(input.source, confirmation, manage);
  const confirmationTruthState =
    confirmation?.confirmationTruthState ?? manage?.confirmationTruthState ?? "confirmation_pending";
  const reminderExposureState =
    confirmation?.reminderExposureState ?? manage?.reminderExposureState ?? "blocked";
  const readiness = buildModeReadiness(exposure, sourcePosture, confirmationTruthState);
  const receiptRows = resolveSummaryRows(input.source, confirmation, manage);
  const attendanceRows = resolveAttendanceRows(manage, confirmation);
  const reminderRows = resolveReminderRows(input.source, confirmation, manage);
  const appointmentHeading =
    manage?.appointmentHeading ?? confirmation?.stateHeading ?? "Appointment artifact summary";
  const providerReference =
    confirmation?.providerReference ??
    manage?.appointmentMetaRows.find((row) => row.label === "Provider reference")?.value ??
    null;
  const primaryAttendanceInstruction =
    attendanceRows[0]?.value ?? "Review the same-shell summary before using any secondary action.";
  const grantRef =
    readiness.grantState === "granted"
      ? `OutboundNavigationGrant::booking_artifact_${input.bookingCaseId}`
      : null;

  return {
    projectionName: "PatientBookingArtifactProjection303",
    scenarioId: `${input.bookingCaseId}:${input.source}:${input.mode}`,
    bookingCaseId: input.bookingCaseId,
    source: input.source,
    mode: input.mode,
    heading:
      input.source === "manage"
        ? "Manage-safe appointment artifact"
        : "Confirmation-safe appointment artifact",
    summaryLead:
      readiness.parityPosture === "verified"
        ? "The summary, print posture, calendar details, and handoff metadata stay bound to the same confirmed appointment anchor."
        : readiness.parityPosture === "summary_only"
          ? "This route keeps a readable appointment summary in shell while richer artifact actions remain summary-only."
          : "This route preserves only the safe appointment summary until continuity or identity recovery releases artifact posture again.",
    sourceLabel: input.source === "manage" ? "Manage appointment" : "Booking confirmation",
    returnLabel:
      input.source === "manage" ? "Return to manage appointment" : "Return to booking confirmation",
    returnPath:
      input.source === "manage"
        ? `/bookings/${input.bookingCaseId}/manage`
        : `/bookings/${input.bookingCaseId}/confirm`,
    artifactExposureState: exposure,
    confirmationTruthState,
    reminderExposureState,
    sourcePosture,
    appointmentHeading,
    primaryAttendanceInstruction,
    parityPosture: readiness.parityPosture,
    grantState: readiness.grantState,
    printPosture: readiness.printPosture,
    handoffReadiness: readiness.handoffReadiness,
    artifactPresentationContractRef: "ArtifactPresentationContract::booking_303",
    artifactSurfaceFrameRef: "PatientArtifactFrame::booking_303",
    artifactParityDigestRef: `booking_artifact_parity_${input.bookingCaseId}`,
    outboundNavigationGrantRef: grantRef,
    providerReference,
    receiptRows,
    attendanceRows,
    reminderRows,
    calendarRows: [
      { label: "Event title", value: appointmentHeading },
      { label: "Appointment reference", value: input.bookingCaseId },
      {
        label: "Payload posture",
        value:
          readiness.grantState === "granted"
            ? "Governed export-ready summary"
            : readiness.grantState === "summary_only"
              ? "Summary-only preview"
              : "Blocked pending recovery",
      },
      {
        label: "Return target",
        value: input.source === "manage" ? "Manage shell" : "Confirmation shell",
      },
    ],
    printRows: [
      {
        label: "Printable meaning",
        value: "Matches the current in-shell receipt and attendance summary.",
      },
      {
        label: "Print posture",
        value:
          readiness.printPosture === "ready"
            ? "Ready from browser print"
            : readiness.printPosture === "summary_only"
              ? "Summary-only preview"
              : "Blocked pending recovery",
      },
      {
        label: "Return target",
        value: input.source === "manage" ? "Manage shell" : "Confirmation shell",
      },
    ],
    directionsRows: [
      {
        label: "Destination",
        value:
          receiptRows.find((row) => row.label === "Location")?.value ?? "Location unavailable",
      },
      {
        label: "Grant posture",
        value:
          readiness.handoffReadiness === "ready"
            ? "Return-safe directions handoff is permitted"
            : readiness.handoffReadiness === "summary_only"
              ? "Summary-only address guidance"
              : "Directions handoff is blocked pending recovery",
      },
      { label: "Scrubbed destination", value: "Maps host with PHI-bearing query removed" },
      {
        label: "Return target",
        value: input.source === "manage" ? "Manage shell" : "Confirmation shell",
      },
    ],
    browserRows: [
      { label: "Destination host", value: "Allowlisted browser handoff target" },
      {
        label: "Grant posture",
        value:
          readiness.handoffReadiness === "ready"
            ? "Short-lived grant ready"
            : readiness.handoffReadiness === "summary_only"
              ? "Summary-only until the route can lawfully widen"
              : "Blocked pending recovery",
      },
      { label: "Scrubbed query", value: "No PHI-bearing query parameters" },
      {
        label: "Return route",
        value: input.source === "manage" ? "Manage appointment" : "Booking confirmation",
      },
    ],
    parityRows: [
      { label: "On-screen summary", value: readiness.parityPosture.replaceAll("_", " ") },
      { label: "Print parity", value: readiness.printPosture.replaceAll("_", " ") },
      { label: "Calendar parity", value: readiness.grantState.replaceAll("_", " ") },
      {
        label: "Handoff readiness",
        value: readiness.handoffReadiness.replaceAll("_", " "),
      },
      { label: "Reminder posture", value: reminderExposureState.replaceAll("_", " ") },
    ],
    metadataRows: [
      { label: "Artifact contract", value: "ArtifactPresentationContract::booking_303" },
      { label: "Artifact frame", value: "PatientArtifactFrame::booking_303" },
      { label: "Parity digest", value: `booking_artifact_parity_${input.bookingCaseId}` },
      { label: "Outbound grant", value: grantRef ?? "Not armed for this posture" },
      { label: "Provider reference", value: providerReference ?? "Not yet available" },
    ],
    actionTray: buildModeActions(readiness),
  };
}

export const patientBookingArtifactScenarioIds = [
  "booking_case_296_confirmed",
  "booking_case_297_ready",
  "booking_case_296_pending",
  "booking_case_297_stale",
  "booking_case_296_identity_repair",
] as const;

export function bookingArtifactParityMatrix(): Array<Record<string, string>> {
  return patientBookingArtifactScenarioIds.flatMap((bookingCaseId) =>
    (["receipt", "calendar", "print", "directions", "browser_handoff"] as const).map((mode) => {
      const source: BookingArtifactRouteSource = bookingCaseId.startsWith("booking_case_297")
        ? "manage"
        : "confirm";
      const projection = resolvePatientBookingArtifactProjection({
        bookingCaseId,
        source,
        mode,
      });
      return {
        booking_case_id: projection.bookingCaseId,
        source: projection.source,
        artifact_mode: projection.mode,
        confirmation_truth: projection.confirmationTruthState,
        artifact_exposure: projection.artifactExposureState,
        parity_posture: projection.parityPosture,
        grant_state: projection.grantState,
        print_posture: projection.printPosture,
        handoff_readiness: projection.handoffReadiness,
      };
    }),
  );
}

export function bookingArtifactAtlasScenarios() {
  return patientBookingArtifactScenarioIds.map((bookingCaseId) => {
    const source: BookingArtifactRouteSource = bookingCaseId.startsWith("booking_case_297")
      ? "manage"
      : "confirm";
    const projection = resolvePatientBookingArtifactProjection({
      bookingCaseId,
      source,
      mode: "receipt",
    });
    return {
      bookingCaseId: projection.bookingCaseId,
      source: projection.source,
      heading: projection.heading,
      appointmentHeading: projection.appointmentHeading,
      artifactExposureState: projection.artifactExposureState,
      parityPosture: projection.parityPosture,
      grantState: projection.grantState,
      sourcePosture: projection.sourcePosture,
    };
  });
}

export function bookingArtifactContractSummary() {
  return {
    taskId: PATIENT_BOOKING_ARTIFACT_TASK_ID,
    visualMode: PATIENT_BOOKING_ARTIFACT_VISUAL_MODE,
    routes: ["/bookings/:bookingCaseId/artifacts"],
    uiPrimitives: [
      "PatientBookingArtifactFrame",
      "AppointmentReceiptSummary",
      "AttendanceInstructionPanel",
      "BookingArtifactActionTray",
      "PrintableAppointmentView",
      "CalendarExportSummarySheet",
      "DirectionsHandoffPanel",
      "BookingArtifactParityView",
    ],
    domMarkers: [
      "data-artifact-mode",
      "data-parity-posture",
      "data-grant-state",
      "data-print-posture",
      "data-handoff-readiness",
      "data-artifact-source",
      "data-artifact-exposure",
    ],
    artifactModes: ["receipt", "calendar", "print", "directions", "browser_handoff"],
    artifactSources: ["confirm", "manage"],
  };
}
