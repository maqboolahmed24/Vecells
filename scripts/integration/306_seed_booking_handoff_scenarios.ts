import {
  resolveBookingConfirmationProjection,
  type BookingConfirmationProjection,
} from "../../apps/patient-web/src/patient-booking-confirmation.model.ts";
import {
  resolvePatientAppointmentManageProjection,
  type PatientAppointmentManageProjection,
} from "../../apps/patient-web/src/patient-appointment-manage.model.ts";
import {
  resolvePatientBookingWorkspaceEntry,
  type BookingNotificationEntryState,
  type PatientBookingWorkspaceEntryProjection,
} from "../../apps/patient-web/src/patient-booking-workspace.model.ts";
import {
  resolveStaffBookingHandoffProjectionByCaseId,
  type StaffBookingHandoffProjection,
} from "../../apps/clinical-workspace/src/workspace-booking-handoff.model.ts";
import {
  PHASE4_BOOKING_TRIAGE_NOTIFICATION_SCHEMA_VERSION,
  PHASE4_BOOKING_TRIAGE_NOTIFICATION_SERVICE_NAME,
  PHASE4_BOOKING_TRIAGE_NOTIFICATION_QUERY_SURFACES,
  phase4BookingTriageNotificationRoutes,
} from "../../services/command-api/src/phase4-booking-triage-notification-integration.ts";

export const BOOKING_TRIAGE_NOTIFICATION_TASK_ID =
  "seq_306_phase4_merge_Playwright_or_other_appropriate_tooling_integrate_local_booking_with_triage_portal_and_notification_workflows";
export const BOOKING_TRIAGE_NOTIFICATION_CONTRACT_NAME =
  "BookingTriageNotificationIntegrationContract";
export const SECURE_LINK_SEARCH = "?origin=secure_link&returnRoute=%2Frecovery%2Fsecure-link";

export interface BookingHandoffScenarioSeed {
  scenarioId: string;
  bookingCaseId: string;
  requestWorkflowState: "handoff_active" | "confirmation_pending" | "booking_confirmed" | "triage_active";
  statusCode:
    | "booking_handoff_active"
    | "booking_confirmation_pending"
    | "booking_confirmed"
    | "booking_reopened";
  notificationClass:
    | "handoff_entry"
    | "confirmation_pending"
    | "confirmation_confirmed"
    | "reopened_to_triage";
  patientPath: string;
  patientRouteKey: PatientBookingWorkspaceEntryProjection["routeKey"];
  patientShellState: PatientBookingWorkspaceEntryProjection["workspace"]["shellState"];
  patientOriginKey: PatientBookingWorkspaceEntryProjection["workspace"]["returnContract"]["originKey"];
  patientNotificationState: BookingNotificationEntryState;
  patientNotificationTitle: string | null;
  confirmationTruthState: BookingConfirmationProjection["confirmationTruthState"] | null;
  manageConfirmationTruthState: PatientAppointmentManageProjection["confirmationTruthState"] | null;
  staffRoute: string;
  staffExceptionClass: StaffBookingHandoffProjection["exceptionClass"];
  staffConfirmationTruth: StaffBookingHandoffProjection["confirmationTruth"];
  staffSettlementState: StaffBookingHandoffProjection["settlementState"];
}

function csvEscape(value: string | null): string {
  if (value === null) {
    return "";
  }
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function buildScenario(input: {
  scenarioId: string;
  bookingCaseId: string;
  patientPath: string;
  requestWorkflowState: BookingHandoffScenarioSeed["requestWorkflowState"];
  statusCode: BookingHandoffScenarioSeed["statusCode"];
  notificationClass: BookingHandoffScenarioSeed["notificationClass"];
}): BookingHandoffScenarioSeed {
  const workspaceEntry = resolvePatientBookingWorkspaceEntry({
    pathname: input.patientPath.split("?")[0] ?? input.patientPath,
    search: input.patientPath.includes("?") ? `?${input.patientPath.split("?")[1]}` : "",
  });
  const confirmationProjection =
    workspaceEntry.routeKey === "confirm"
      ? resolveBookingConfirmationProjection(input.bookingCaseId)
      : null;
  const manageProjection =
    workspaceEntry.routeKey === "manage"
      ? resolvePatientAppointmentManageProjection(input.bookingCaseId)
      : null;
  const staffProjection = resolveStaffBookingHandoffProjectionByCaseId(input.bookingCaseId);
  return {
    scenarioId: input.scenarioId,
    bookingCaseId: input.bookingCaseId,
    requestWorkflowState: input.requestWorkflowState,
    statusCode: input.statusCode,
    notificationClass: input.notificationClass,
    patientPath: input.patientPath,
    patientRouteKey: workspaceEntry.routeKey,
    patientShellState: workspaceEntry.workspace.shellState,
    patientOriginKey: workspaceEntry.workspace.returnContract.originKey,
    patientNotificationState: workspaceEntry.notificationState,
    patientNotificationTitle: workspaceEntry.workspace.notificationEntry?.title ?? null,
    confirmationTruthState: confirmationProjection?.confirmationTruthState ?? null,
    manageConfirmationTruthState: manageProjection?.confirmationTruthState ?? null,
    staffRoute: `/workspace/bookings/${input.bookingCaseId}`,
    staffExceptionClass: staffProjection.exceptionClass,
    staffConfirmationTruth: staffProjection.confirmationTruth,
    staffSettlementState: staffProjection.settlementState,
  };
}

export function buildBookingHandoffScenarioSeed() {
  const scenarios = [
    buildScenario({
      scenarioId: "booking_handoff_live_secure_link",
      bookingCaseId: "booking_case_306_handoff_live",
      patientPath: `/bookings/booking_case_306_handoff_live${SECURE_LINK_SEARCH}`,
      requestWorkflowState: "handoff_active",
      statusCode: "booking_handoff_active",
      notificationClass: "handoff_entry",
    }),
    buildScenario({
      scenarioId: "booking_confirmation_pending_secure_link",
      bookingCaseId: "booking_case_306_confirmation_pending",
      patientPath: `/bookings/booking_case_306_confirmation_pending/confirm${SECURE_LINK_SEARCH}`,
      requestWorkflowState: "confirmation_pending",
      statusCode: "booking_confirmation_pending",
      notificationClass: "confirmation_pending",
    }),
    buildScenario({
      scenarioId: "booking_confirmed_secure_link",
      bookingCaseId: "booking_case_306_confirmed",
      patientPath: `/bookings/booking_case_306_confirmed/manage${SECURE_LINK_SEARCH}`,
      requestWorkflowState: "booking_confirmed",
      statusCode: "booking_confirmed",
      notificationClass: "confirmation_confirmed",
    }),
    buildScenario({
      scenarioId: "booking_reopened_secure_link",
      bookingCaseId: "booking_case_306_reopened",
      patientPath: `/bookings/booking_case_306_reopened${SECURE_LINK_SEARCH}`,
      requestWorkflowState: "triage_active",
      statusCode: "booking_reopened",
      notificationClass: "reopened_to_triage",
    }),
  ] as const;

  return {
    taskId: BOOKING_TRIAGE_NOTIFICATION_TASK_ID,
    contractName: BOOKING_TRIAGE_NOTIFICATION_CONTRACT_NAME,
    schemaVersion: PHASE4_BOOKING_TRIAGE_NOTIFICATION_SCHEMA_VERSION,
    serviceName: PHASE4_BOOKING_TRIAGE_NOTIFICATION_SERVICE_NAME,
    querySurfaces: [...PHASE4_BOOKING_TRIAGE_NOTIFICATION_QUERY_SURFACES],
    routeIds: phase4BookingTriageNotificationRoutes.map((route) => route.routeId),
    notificationDedupePattern: "booking_triage_notification::{requestId}::{statusDigest}",
    replayDecisionClasses: ["accepted_new", "semantic_replay", "stale_ignored"] as const,
    scenarios,
  };
}

export function renderBookingNotificationStateMatrixCsv(): string {
  const seed = buildBookingHandoffScenarioSeed();
  const header = [
    "scenario_id",
    "booking_case_id",
    "request_workflow_state",
    "status_code",
    "notification_class",
    "patient_path",
    "patient_route_key",
    "patient_shell_state",
    "patient_origin_key",
    "patient_notification_state",
    "confirmation_truth_state",
    "manage_confirmation_truth_state",
    "staff_route",
    "staff_exception_class",
    "staff_confirmation_truth",
    "staff_settlement_state",
  ];
  const rows = seed.scenarios.map((scenario) => [
    scenario.scenarioId,
    scenario.bookingCaseId,
    scenario.requestWorkflowState,
    scenario.statusCode,
    scenario.notificationClass,
    scenario.patientPath,
    scenario.patientRouteKey,
    scenario.patientShellState,
    scenario.patientOriginKey,
    scenario.patientNotificationState,
    scenario.confirmationTruthState,
    scenario.manageConfirmationTruthState,
    scenario.staffRoute,
    scenario.staffExceptionClass,
    scenario.staffConfirmationTruth,
    scenario.staffSettlementState,
  ]);
  return [header, ...rows]
    .map((row) => row.map((value) => csvEscape(value)).join(","))
    .join("\n");
}

async function main(): Promise<void> {
  console.log(
    JSON.stringify(
      {
        seed: buildBookingHandoffScenarioSeed(),
        stateMatrixCsv: renderBookingNotificationStateMatrixCsv(),
      },
      null,
      2,
    ),
  );
}

if (process.argv.includes("--run")) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
