export const PATIENT_APPOINTMENT_MANAGE_TASK_ID =
  "par_297_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_appointment_detail_cancel_reschedule_and_reminder_views";
export const PATIENT_APPOINTMENT_MANAGE_VISUAL_MODE = "Manage_Appointment_Studio";

export type AppointmentManageViewKind =
  | "summary"
  | "reschedule"
  | "detail_update"
  | "pending"
  | "recovery"
  | "settled";
export type AppointmentManageTone = "neutral" | "active" | "warn" | "blocked" | "safe";
export type AppointmentManageConfirmationTruth =
  | "confirmed"
  | "confirmation_pending"
  | "reconciliation_required";
export type AppointmentManageExposureState = "hidden" | "summary_only" | "writable";
export type AppointmentManageReminderExposure = "blocked" | "pending_schedule" | "scheduled";
export type AppointmentManageArtifactExposure = "hidden" | "summary_only" | "handoff_ready";
export type AppointmentManageContinuityState = "trusted" | "degraded" | "stale" | "blocked";
export type AppointmentManagePendingState =
  | "idle"
  | "cancel_pending"
  | "reschedule_active"
  | "reschedule_pending"
  | "detail_edit"
  | "detail_pending"
  | "reminder_pending"
  | "repair_required"
  | "settled";
export type AppointmentManageAttendanceMode = "in_person" | "video" | "telephone";
export type AppointmentManageCapabilityRef =
  | "appointment_cancel"
  | "appointment_reschedule"
  | "appointment_detail_update"
  | "reminder_change";
export type AppointmentManageActionRef =
  | "open_cancel"
  | "open_reschedule"
  | "open_detail_update"
  | "return_to_summary"
  | "refresh_manage_status"
  | "refresh_manage_route"
  | "request_support"
  | "repair_contact_route"
  | "change_reminder_to_email"
  | "change_reminder_to_sms"
  | "rebook";

export interface AppointmentManageSummaryRow {
  readonly label: string;
  readonly value: string;
}

export interface AppointmentManageActionProjection {
  readonly actionRef: AppointmentManageActionRef;
  readonly label: string;
  readonly detail: string;
  readonly transitionScenarioId: string | null;
  readonly artifactMode?: "print" | "directions";
}

export interface AppointmentManageSupportPath {
  readonly label: string;
  readonly copy: string;
  readonly actionLabel: string;
}

export interface AppointmentReminderPreferenceProjection {
  readonly heading: string;
  readonly body: string;
  readonly contactRouteState: "verified" | "repair_required" | "delivery_risk" | "summary_only";
  readonly preferenceRows: readonly AppointmentManageSummaryRow[];
  readonly repairRows: readonly AppointmentManageSummaryRow[];
  readonly primaryAction: AppointmentManageActionProjection | null;
  readonly secondaryAction: AppointmentManageActionProjection | null;
}

export interface AppointmentDetailFormPreset {
  readonly arrivalNote: string;
  readonly interpreter: "no" | "yes";
  readonly accessSupport: "standard" | "mobility_help" | "quiet_space";
}

export interface PatientAppointmentManageProjection {
  readonly projectionName: "PatientAppointmentManageProjection";
  readonly scenarioId: string;
  readonly bookingCaseId: string;
  readonly appointmentId: string;
  readonly viewKind: AppointmentManageViewKind;
  readonly stateTone: AppointmentManageTone;
  readonly confirmationTruthState: AppointmentManageConfirmationTruth;
  readonly manageExposureState: AppointmentManageExposureState;
  readonly reminderExposureState: AppointmentManageReminderExposure;
  readonly artifactExposureState: AppointmentManageArtifactExposure;
  readonly continuityState: AppointmentManageContinuityState;
  readonly pendingState: AppointmentManagePendingState;
  readonly attendanceMode: AppointmentManageAttendanceMode;
  readonly manageCapabilityRefs: readonly AppointmentManageCapabilityRef[];
  readonly stateHeading: string;
  readonly stateBody: string;
  readonly supportNote: string;
  readonly appointmentHeading: string;
  readonly appointmentRows: readonly AppointmentManageSummaryRow[];
  readonly appointmentMetaRows: readonly AppointmentManageSummaryRow[];
  readonly attendanceRows: readonly AppointmentManageSummaryRow[];
  readonly pendingRows: readonly AppointmentManageSummaryRow[];
  readonly actionDeck: readonly AppointmentManageActionProjection[];
  readonly reminderPanel: AppointmentReminderPreferenceProjection;
  readonly supportPath: AppointmentManageSupportPath;
  readonly artifactActions: readonly AppointmentManageActionProjection[];
  readonly detailFormPreset: AppointmentDetailFormPreset;
  readonly rescheduleSelectionScenarioId: string | null;
  readonly liveAnnouncement: string;
}

function buildProjection(input: {
  scenarioId: string;
  bookingCaseId: string;
  appointmentId: string;
  viewKind: AppointmentManageViewKind;
  stateTone: AppointmentManageTone;
  confirmationTruthState: AppointmentManageConfirmationTruth;
  manageExposureState: AppointmentManageExposureState;
  reminderExposureState: AppointmentManageReminderExposure;
  artifactExposureState: AppointmentManageArtifactExposure;
  continuityState: AppointmentManageContinuityState;
  pendingState: AppointmentManagePendingState;
  attendanceMode: AppointmentManageAttendanceMode;
  manageCapabilityRefs: readonly AppointmentManageCapabilityRef[];
  stateHeading: string;
  stateBody: string;
  supportNote: string;
  appointmentHeading: string;
  appointmentRows: readonly AppointmentManageSummaryRow[];
  appointmentMetaRows: readonly AppointmentManageSummaryRow[];
  attendanceRows: readonly AppointmentManageSummaryRow[];
  pendingRows: readonly AppointmentManageSummaryRow[];
  actionDeck?: readonly AppointmentManageActionProjection[];
  reminderPanel: AppointmentReminderPreferenceProjection;
  supportPath: AppointmentManageSupportPath;
  artifactActions?: readonly AppointmentManageActionProjection[];
  detailFormPreset?: AppointmentDetailFormPreset;
  rescheduleSelectionScenarioId?: string | null;
  liveAnnouncement: string;
}): PatientAppointmentManageProjection {
  return {
    projectionName: "PatientAppointmentManageProjection",
    scenarioId: input.scenarioId,
    bookingCaseId: input.bookingCaseId,
    appointmentId: input.appointmentId,
    viewKind: input.viewKind,
    stateTone: input.stateTone,
    confirmationTruthState: input.confirmationTruthState,
    manageExposureState: input.manageExposureState,
    reminderExposureState: input.reminderExposureState,
    artifactExposureState: input.artifactExposureState,
    continuityState: input.continuityState,
    pendingState: input.pendingState,
    attendanceMode: input.attendanceMode,
    manageCapabilityRefs: input.manageCapabilityRefs,
    stateHeading: input.stateHeading,
    stateBody: input.stateBody,
    supportNote: input.supportNote,
    appointmentHeading: input.appointmentHeading,
    appointmentRows: input.appointmentRows,
    appointmentMetaRows: input.appointmentMetaRows,
    attendanceRows: input.attendanceRows,
    pendingRows: input.pendingRows,
    actionDeck: input.actionDeck ?? [],
    reminderPanel: input.reminderPanel,
    supportPath: input.supportPath,
    artifactActions: input.artifactActions ?? [],
    detailFormPreset: input.detailFormPreset ?? {
      arrivalNote: "Please text when the clinic room is ready.",
      interpreter: "no",
      accessSupport: "standard",
    },
    rescheduleSelectionScenarioId: input.rescheduleSelectionScenarioId ?? null,
    liveAnnouncement: input.liveAnnouncement,
  };
}

const baseAppointmentRows = [
  { label: "Date", value: "Tuesday 22 April 2026" },
  { label: "Time", value: "11:20 to 11:40" },
  { label: "Modality", value: "Face-to-face review" },
  { label: "Location", value: "Community dermatology clinic, Floor 2" },
  { label: "Clinician", value: "Dr Maya Iqbal" },
] as const satisfies readonly AppointmentManageSummaryRow[];

const baseAppointmentMetaRows = [
  { label: "Appointment reference", value: "APT-297-448201" },
  { label: "Provider reference", value: "DERM-2026-0422-1120" },
  { label: "Confirmation truth", value: "Confirmed" },
  { label: "Manage posture", value: "Writable from this same shell" },
] as const satisfies readonly AppointmentManageSummaryRow[];

const inPersonAttendanceRows = [
  { label: "Arrival", value: "Arrive 10 minutes early and check in at reception." },
  { label: "Bring", value: "Bring your treatment list and any recent skin photographs." },
  { label: "Access", value: "Lift access and a quiet waiting area are available on request." },
] as const satisfies readonly AppointmentManageSummaryRow[];

const verifiedReminderRows = [
  { label: "Current reminder route", value: "SMS to 07700 900123" },
  { label: "Fallback route", value: "Email to samira.ahmed@example.nhs" },
  { label: "Reminder posture", value: "Scheduled from confirmed booking truth" },
] as const satisfies readonly AppointmentManageSummaryRow[];

const blockedReminderRows = [
  { label: "Current reminder route", value: "SMS route needs repair before reminder changes" },
  { label: "Repair trigger", value: "Recent delivery dispute on the verified mobile route" },
  { label: "Reminder posture", value: "Blocked until the current contact route is rebound" },
] as const satisfies readonly AppointmentManageSummaryRow[];

const repairRows = [
  { label: "Repair step", value: "Confirm the mobile number used for this appointment." },
  { label: "Governed result", value: "Reminder changes reopen only after route authority is current." },
  { label: "Fallback", value: "Support can continue from this same appointment if repair cannot finish now." },
] as const satisfies readonly AppointmentManageSummaryRow[];

const supportPath = {
  label: "Need help with this appointment?",
  copy:
    "Support can continue from this same appointment lineage if online manage actions are blocked, stale, or still settling.",
  actionLabel: "Contact support",
} as const satisfies AppointmentManageSupportPath;

const defaultActionDeck = [
  {
    actionRef: "open_reschedule",
    label: "Reschedule",
    detail: "Open the replacement slot selection stage in the same shell.",
    transitionScenarioId: "booking_case_297_reschedule",
  },
  {
    actionRef: "open_detail_update",
    label: "Update details",
    detail: "Open the administrative update form in this appointment shell.",
    transitionScenarioId: "booking_case_297_detail_edit",
  },
] as const satisfies readonly AppointmentManageActionProjection[];

const projectionsByScenario = {
  booking_case_297_ready: buildProjection({
    scenarioId: "booking_case_297_ready",
    bookingCaseId: "booking_case_297_ready",
    appointmentId: "appointment_297_ready",
    viewKind: "summary",
    stateTone: "safe",
    confirmationTruthState: "confirmed",
    manageExposureState: "writable",
    reminderExposureState: "scheduled",
    artifactExposureState: "handoff_ready",
    continuityState: "trusted",
    pendingState: "idle",
    attendanceMode: "in_person",
    manageCapabilityRefs: [
      "appointment_cancel",
      "appointment_reschedule",
      "appointment_detail_update",
      "reminder_change",
    ],
    stateHeading: "This appointment is current and safe to manage here.",
    stateBody:
      "You can review the booked summary, change purely administrative details, or begin cancel or reschedule without leaving the same shell.",
    supportNote:
      "Quiet success stays tied to the current confirmation truth, manage exposure, and continuity evidence.",
    appointmentHeading: "Dermatology follow-up",
    appointmentRows: baseAppointmentRows,
    appointmentMetaRows: baseAppointmentMetaRows,
    attendanceRows: inPersonAttendanceRows,
    pendingRows: [
      { label: "Current settlement", value: "No live manage command" },
      { label: "Continuity evidence", value: "Trusted for the booked appointment lineage" },
      { label: "Safe next step", value: "Choose one action and keep the summary visible" },
    ],
    actionDeck: defaultActionDeck,
    reminderPanel: {
      heading: "ReminderPreferencePanel",
      body:
        "Reminder settings stay visible, but the copy only claims scheduled posture because the current confirmation truth and contact-route evidence are both current.",
      contactRouteState: "verified",
      preferenceRows: verifiedReminderRows,
      repairRows,
      primaryAction: {
        actionRef: "change_reminder_to_email",
        label: "Use email reminders",
        detail: "Reminder preference change submitted. Scheduling truth is pending.",
        transitionScenarioId: "booking_case_297_reminder_pending",
      },
      secondaryAction: {
        actionRef: "repair_contact_route",
        label: "Review contact route",
        detail: "Current verified reminder routes focused.",
        transitionScenarioId: null,
      },
    },
    supportPath,
    artifactActions: [
      {
        actionRef: "refresh_manage_route",
        label: "Print summary",
        detail: "Print handoff is available from the current artifact contract.",
        transitionScenarioId: null,
        artifactMode: "print",
      },
      {
        actionRef: "refresh_manage_route",
        label: "Directions",
        detail: "Directions handoff is available from the current navigation grant.",
        transitionScenarioId: null,
        artifactMode: "directions",
      },
    ],
    liveAnnouncement: "Manage appointment view loaded with live reminder and manage posture.",
  }),
  booking_case_297_reschedule: buildProjection({
    scenarioId: "booking_case_297_reschedule",
    bookingCaseId: "booking_case_297_reschedule",
    appointmentId: "appointment_297_ready",
    viewKind: "reschedule",
    stateTone: "active",
    confirmationTruthState: "confirmed",
    manageExposureState: "writable",
    reminderExposureState: "scheduled",
    artifactExposureState: "summary_only",
    continuityState: "trusted",
    pendingState: "reschedule_active",
    attendanceMode: "in_person",
    manageCapabilityRefs: ["appointment_reschedule"],
    stateHeading: "Pick a replacement time without dropping the current appointment summary.",
    stateBody:
      "The original appointment stays visible until a replacement slot is confirmed. The replacement search reuses the existing selection stage instead of opening a second booking product.",
    supportNote:
      "Ordinary cancellation is frozen while replacement selection is active on this appointment lineage.",
    appointmentHeading: "Dermatology follow-up",
    appointmentRows: baseAppointmentRows,
    appointmentMetaRows: [
      ...baseAppointmentMetaRows.slice(0, 3),
      { label: "Source appointment posture", value: "Reschedule in progress" },
    ],
    attendanceRows: inPersonAttendanceRows,
    pendingRows: [
      { label: "Current settlement", value: "Replacement search opened from this appointment" },
      { label: "Source appointment", value: "Still booked until replacement settles" },
      { label: "Safe next step", value: "Choose one replacement slot or return to summary" },
    ],
    actionDeck: [
      {
        actionRef: "return_to_summary",
        label: "Back to summary",
        detail: "Returned to the quiet appointment summary.",
        transitionScenarioId: "booking_case_297_ready",
      },
    ],
    reminderPanel: {
      heading: "ReminderPreferencePanel",
      body:
        "Reminder scheduling stays summary-only while a replacement slot is still being chosen.",
      contactRouteState: "summary_only",
      preferenceRows: [
        ...verifiedReminderRows.slice(0, 2),
        { label: "Reminder posture", value: "Scheduled on the current appointment until replacement settles" },
      ],
      repairRows,
      primaryAction: null,
      secondaryAction: {
        actionRef: "repair_contact_route",
        label: "Review contact route",
        detail: "Reminder route detail kept visible during reschedule.",
        transitionScenarioId: null,
      },
    },
    supportPath,
    rescheduleSelectionScenarioId: "booking_case_295_nonexclusive",
    liveAnnouncement: "Replacement slot selection opened while the original appointment summary stayed pinned.",
  }),
  booking_case_297_reschedule_pending: buildProjection({
    scenarioId: "booking_case_297_reschedule_pending",
    bookingCaseId: "booking_case_297_reschedule_pending",
    appointmentId: "appointment_297_ready",
    viewKind: "pending",
    stateTone: "warn",
    confirmationTruthState: "confirmed",
    manageExposureState: "summary_only",
    reminderExposureState: "pending_schedule",
    artifactExposureState: "summary_only",
    continuityState: "trusted",
    pendingState: "reschedule_pending",
    attendanceMode: "in_person",
    manageCapabilityRefs: [],
    stateHeading: "We are checking the replacement appointment before changing the original one.",
    stateBody:
      "This manage shell keeps the current appointment visible while the replacement booking settles. It does not claim success or release the original slot early.",
    supportNote:
      "Quiet reschedule success is illegal until the replacement appointment reaches authoritative confirmation.",
    appointmentHeading: "Dermatology follow-up",
    appointmentRows: baseAppointmentRows,
    appointmentMetaRows: [
      ...baseAppointmentMetaRows.slice(0, 2),
      { label: "Source appointment posture", value: "Held while replacement confirmation is pending" },
      { label: "Replacement posture", value: "Supplier pending" },
    ],
    attendanceRows: inPersonAttendanceRows,
    pendingRows: [
      { label: "Current settlement", value: "Supplier pending" },
      { label: "Original appointment", value: "Still visible and still the active booked appointment" },
      { label: "Next safe action", value: "Wait for replacement confirmation or ask for help" },
    ],
    actionDeck: [
      {
        actionRef: "request_support",
        label: "Ask for help",
        detail: "Support path focused while replacement confirmation is still pending.",
        transitionScenarioId: null,
      },
    ],
    reminderPanel: {
      heading: "ReminderPreferencePanel",
      body: "Reminder and handoff actions stay summary-only while the replacement is still pending.",
      contactRouteState: "summary_only",
      preferenceRows: [
        { label: "Current reminder route", value: "SMS to 07700 900123" },
        { label: "Reminder posture", value: "Pending replacement settlement" },
      ],
      repairRows,
      primaryAction: null,
      secondaryAction: {
        actionRef: "request_support",
        label: "Ask for help",
        detail: "Support path focused while reschedule is still pending.",
        transitionScenarioId: null,
      },
    },
    supportPath,
    liveAnnouncement: "Replacement appointment is still pending. The original appointment remains visible.",
  }),
  booking_case_297_cancel_pending: buildProjection({
    scenarioId: "booking_case_297_cancel_pending",
    bookingCaseId: "booking_case_297_cancel_pending",
    appointmentId: "appointment_297_ready",
    viewKind: "pending",
    stateTone: "warn",
    confirmationTruthState: "confirmed",
    manageExposureState: "summary_only",
    reminderExposureState: "blocked",
    artifactExposureState: "summary_only",
    continuityState: "trusted",
    pendingState: "cancel_pending",
    attendanceMode: "in_person",
    manageCapabilityRefs: [],
    stateHeading: "Cancellation has been submitted, but the supplier result is still pending.",
    stateBody:
      "The appointment summary stays visible until cancellation truth is authoritative. This route does not collapse into quiet success on local acknowledgement alone.",
    supportNote:
      "If cancellation becomes ambiguous, this same shell must move into recovery rather than pretending the appointment is gone.",
    appointmentHeading: "Dermatology follow-up",
    appointmentRows: baseAppointmentRows,
    appointmentMetaRows: [
      ...baseAppointmentMetaRows.slice(0, 2),
      { label: "Appointment status", value: "Cancellation pending" },
      { label: "Reminder posture", value: "Suppressed while cancellation is pending" },
    ],
    attendanceRows: inPersonAttendanceRows,
    pendingRows: [
      { label: "Current settlement", value: "Supplier pending" },
      { label: "Patient-safe reading", value: "Do not assume the appointment is cancelled yet" },
      { label: "Safe next action", value: "Check status or ask support if the deadline matters" },
    ],
    reminderPanel: {
      heading: "ReminderPreferencePanel",
      body: "Reminder controls are frozen because cancellation is still settling.",
      contactRouteState: "summary_only",
      preferenceRows: [
        { label: "Current reminder route", value: "SMS to 07700 900123" },
        { label: "Reminder posture", value: "Suppressed while cancellation is pending" },
      ],
      repairRows,
      primaryAction: null,
      secondaryAction: null,
    },
    supportPath,
    actionDeck: [
      {
        actionRef: "refresh_manage_status",
        label: "Check cancellation status",
        detail: "Cancellation status refreshed.",
        transitionScenarioId: "booking_case_297_cancelled",
      },
    ],
    artifactActions: [],
    liveAnnouncement: "Cancellation submitted. The appointment remains visible while supplier truth is pending.",
  }),
  booking_case_297_cancelled: buildProjection({
    scenarioId: "booking_case_297_cancelled",
    bookingCaseId: "booking_case_297_cancelled",
    appointmentId: "appointment_297_ready",
    viewKind: "settled",
    stateTone: "safe",
    confirmationTruthState: "confirmed",
    manageExposureState: "summary_only",
    reminderExposureState: "blocked",
    artifactExposureState: "hidden",
    continuityState: "trusted",
    pendingState: "settled",
    attendanceMode: "in_person",
    manageCapabilityRefs: [],
    stateHeading: "Cancellation is now authoritative.",
    stateBody:
      "The appointment summary remains as a calm record of what was cancelled. Ordinary manage actions are closed and reminder scheduling has been released.",
    supportNote: "If the patient still needs care, open a fresh booking path rather than reusing this cancelled appointment.",
    appointmentHeading: "Dermatology follow-up",
    appointmentRows: baseAppointmentRows,
    appointmentMetaRows: [
      { label: "Appointment reference", value: "APT-297-448201" },
      { label: "Cancellation truth", value: "Confirmed by supplier" },
      { label: "Cancelled at", value: "Monday 20 April 2026, 14:08" },
      { label: "Current posture", value: "Summary-only historical record" },
    ],
    attendanceRows: inPersonAttendanceRows,
    pendingRows: [
      { label: "Current settlement", value: "Applied" },
      { label: "Reminder posture", value: "Released" },
      { label: "Safe next action", value: "Start a fresh booking or contact support" },
    ],
    actionDeck: [
      {
        actionRef: "rebook",
        label: "Book another appointment",
        detail: "Use the support path to start a new booking.",
        transitionScenarioId: null,
      },
    ],
    reminderPanel: {
      heading: "ReminderPreferencePanel",
      body: "Reminder settings are shown as history only because the appointment is cancelled.",
      contactRouteState: "summary_only",
      preferenceRows: [
        { label: "Last reminder route", value: "SMS to 07700 900123" },
        { label: "Reminder posture", value: "No active reminder plan" },
      ],
      repairRows,
      primaryAction: null,
      secondaryAction: null,
    },
    supportPath,
    artifactActions: [],
    liveAnnouncement: "Cancellation is authoritative. The appointment is now a summary-only record.",
  }),
  booking_case_297_detail_edit: buildProjection({
    scenarioId: "booking_case_297_detail_edit",
    bookingCaseId: "booking_case_297_detail_edit",
    appointmentId: "appointment_297_ready",
    viewKind: "detail_update",
    stateTone: "active",
    confirmationTruthState: "confirmed",
    manageExposureState: "writable",
    reminderExposureState: "scheduled",
    artifactExposureState: "handoff_ready",
    continuityState: "trusted",
    pendingState: "detail_edit",
    attendanceMode: "in_person",
    manageCapabilityRefs: ["appointment_detail_update"],
    stateHeading: "Update administrative details without changing clinical meaning.",
    stateBody:
      "This narrow form is limited to capability-safe administrative detail. Clinically meaningful changes must route back into the governed request path instead of mutating the appointment directly.",
    supportNote:
      "The form stays intentionally small so the patient can finish or back out without losing the booked summary.",
    appointmentHeading: "Dermatology follow-up",
    appointmentRows: baseAppointmentRows,
    appointmentMetaRows: baseAppointmentMetaRows,
    attendanceRows: inPersonAttendanceRows,
    pendingRows: [
      { label: "Current settlement", value: "Ready for a purely administrative update" },
      { label: "Blocked input class", value: "Clinical change and worsening-condition text" },
      { label: "Safe next action", value: "Submit a short administrative update or return to summary" },
    ],
    actionDeck: [
      {
        actionRef: "return_to_summary",
        label: "Back to summary",
        detail: "Returned to the quiet appointment summary.",
        transitionScenarioId: "booking_case_297_ready",
      },
    ],
    reminderPanel: {
      heading: "ReminderPreferencePanel",
      body: "Reminder posture stays visible while you edit arrival details.",
      contactRouteState: "verified",
      preferenceRows: verifiedReminderRows,
      repairRows,
      primaryAction: null,
      secondaryAction: {
        actionRef: "repair_contact_route",
        label: "Review contact route",
        detail: "Current reminder routes focused.",
        transitionScenarioId: null,
      },
    },
    supportPath,
    liveAnnouncement: "Administrative detail update form opened in the same manage shell.",
  }),
  booking_case_297_detail_pending: buildProjection({
    scenarioId: "booking_case_297_detail_pending",
    bookingCaseId: "booking_case_297_detail_pending",
    appointmentId: "appointment_297_ready",
    viewKind: "pending",
    stateTone: "warn",
    confirmationTruthState: "confirmed",
    manageExposureState: "summary_only",
    reminderExposureState: "scheduled",
    artifactExposureState: "summary_only",
    continuityState: "trusted",
    pendingState: "detail_pending",
    attendanceMode: "in_person",
    manageCapabilityRefs: [],
    stateHeading: "The administrative update has been submitted and is still settling.",
    stateBody:
      "This route keeps the booked summary visible while the update settles. It does not claim the change is complete until the current manage settlement says it is applied.",
    supportNote: "If the detail update becomes stale or blocked, recovery stays here instead of redirecting to a generic failure page.",
    appointmentHeading: "Dermatology follow-up",
    appointmentRows: baseAppointmentRows,
    appointmentMetaRows: baseAppointmentMetaRows,
    attendanceRows: inPersonAttendanceRows,
    pendingRows: [
      { label: "Current settlement", value: "Supplier pending" },
      { label: "Booked appointment", value: "Still current and still visible" },
      { label: "Safe next action", value: "Wait for settlement or ask support if arrival details are urgent" },
    ],
    actionDeck: [
      {
        actionRef: "refresh_manage_status",
        label: "Check update status",
        detail: "Administrative update status refreshed.",
        transitionScenarioId: "booking_case_297_ready",
      },
    ],
    reminderPanel: {
      heading: "ReminderPreferencePanel",
      body: "Reminder routing stays visible while the administrative update settles.",
      contactRouteState: "verified",
      preferenceRows: verifiedReminderRows,
      repairRows,
      primaryAction: null,
      secondaryAction: null,
    },
    supportPath,
    liveAnnouncement: "Administrative update submitted. The booked summary remains visible while settlement is pending.",
  }),
  booking_case_297_reminder_pending: buildProjection({
    scenarioId: "booking_case_297_reminder_pending",
    bookingCaseId: "booking_case_297_reminder_pending",
    appointmentId: "appointment_297_ready",
    viewKind: "pending",
    stateTone: "warn",
    confirmationTruthState: "confirmed",
    manageExposureState: "summary_only",
    reminderExposureState: "pending_schedule",
    artifactExposureState: "handoff_ready",
    continuityState: "trusted",
    pendingState: "reminder_pending",
    attendanceMode: "in_person",
    manageCapabilityRefs: [],
    stateHeading: "Reminder preference changed locally, but the new reminder plan is still settling.",
    stateBody:
      "This route shows the new reminder preference as pending instead of implying the reminder scheduler has already settled it.",
    supportNote:
      "Reminder exposure may widen again only after the scheduler rebinds to the current contact-route and booking truth.",
    appointmentHeading: "Dermatology follow-up",
    appointmentRows: baseAppointmentRows,
    appointmentMetaRows: baseAppointmentMetaRows,
    attendanceRows: inPersonAttendanceRows,
    pendingRows: [
      { label: "Current settlement", value: "Pending schedule" },
      { label: "Previous route", value: "SMS to 07700 900123 remains the last durable route" },
      { label: "Safe next action", value: "Wait for reminder scheduling truth or ask support" },
    ],
    actionDeck: [],
    reminderPanel: {
      heading: "ReminderPreferencePanel",
      body: "Email reminders have been requested, but the reminder plan is still being rebuilt from current route truth.",
      contactRouteState: "verified",
      preferenceRows: [
        { label: "Requested route", value: "Email to samira.ahmed@example.nhs" },
        { label: "Current durable route", value: "SMS to 07700 900123" },
        { label: "Reminder posture", value: "Pending schedule" },
      ],
      repairRows,
      primaryAction: {
        actionRef: "refresh_manage_status",
        label: "Refresh reminder status",
        detail: "Reminder scheduling status refreshed.",
        transitionScenarioId: "booking_case_297_ready_email",
      },
      secondaryAction: null,
    },
    supportPath,
    liveAnnouncement: "Reminder preference changed, but scheduling truth is still pending.",
  }),
  booking_case_297_ready_email: buildProjection({
    scenarioId: "booking_case_297_ready_email",
    bookingCaseId: "booking_case_297_ready_email",
    appointmentId: "appointment_297_ready",
    viewKind: "summary",
    stateTone: "safe",
    confirmationTruthState: "confirmed",
    manageExposureState: "writable",
    reminderExposureState: "scheduled",
    artifactExposureState: "handoff_ready",
    continuityState: "trusted",
    pendingState: "idle",
    attendanceMode: "in_person",
    manageCapabilityRefs: [
      "appointment_cancel",
      "appointment_reschedule",
      "appointment_detail_update",
      "reminder_change",
    ],
    stateHeading: "Reminder scheduling has settled on the new verified route.",
    stateBody:
      "The appointment remains fully manageable, and reminder posture can now calmly reflect the new verified email route.",
    supportNote: "The shell shows the settled route only after reminder exposure returns to scheduled.",
    appointmentHeading: "Dermatology follow-up",
    appointmentRows: baseAppointmentRows,
    appointmentMetaRows: baseAppointmentMetaRows,
    attendanceRows: inPersonAttendanceRows,
    pendingRows: [
      { label: "Current settlement", value: "Applied" },
      { label: "Continuity evidence", value: "Trusted for the booked appointment lineage" },
      { label: "Safe next step", value: "Continue managing from the same appointment shell" },
    ],
    actionDeck: defaultActionDeck,
    reminderPanel: {
      heading: "ReminderPreferencePanel",
      body:
        "Reminder routing now reflects the settled email preference because the current booking truth and route authority are still current.",
      contactRouteState: "verified",
      preferenceRows: [
        { label: "Current reminder route", value: "Email to samira.ahmed@example.nhs" },
        { label: "Fallback route", value: "SMS to 07700 900123" },
        { label: "Reminder posture", value: "Scheduled from confirmed booking truth" },
      ],
      repairRows,
      primaryAction: {
        actionRef: "change_reminder_to_sms",
        label: "Use SMS reminders",
        detail: "Reminder preference change submitted. Scheduling truth is pending.",
        transitionScenarioId: "booking_case_297_reminder_pending",
      },
      secondaryAction: {
        actionRef: "repair_contact_route",
        label: "Review contact route",
        detail: "Current verified reminder routes focused.",
        transitionScenarioId: null,
      },
    },
    supportPath,
    artifactActions: [
      {
        actionRef: "refresh_manage_route",
        label: "Print summary",
        detail: "Print handoff is available from the current artifact contract.",
        transitionScenarioId: null,
        artifactMode: "print",
      },
      {
        actionRef: "refresh_manage_route",
        label: "Directions",
        detail: "Directions handoff is available from the current navigation grant.",
        transitionScenarioId: null,
        artifactMode: "directions",
      },
    ],
    liveAnnouncement: "Reminder route updated and scheduled on the verified email address.",
  }),
  booking_case_297_reminder_blocked: buildProjection({
    scenarioId: "booking_case_297_reminder_blocked",
    bookingCaseId: "booking_case_297_reminder_blocked",
    appointmentId: "appointment_297_ready",
    viewKind: "recovery",
    stateTone: "blocked",
    confirmationTruthState: "confirmed",
    manageExposureState: "writable",
    reminderExposureState: "blocked",
    artifactExposureState: "summary_only",
    continuityState: "degraded",
    pendingState: "repair_required",
    attendanceMode: "in_person",
    manageCapabilityRefs: [
      "appointment_cancel",
      "appointment_reschedule",
      "appointment_detail_update",
    ],
    stateHeading: "Reminder changes are blocked until the contact route is repaired.",
    stateBody:
      "The reminder path is governed by current route authority. This shell keeps the appointment summary visible and shows repair steps in place instead of sending the patient to a generic settings page.",
    supportNote:
      "Other safe manage actions can stay visible, but reminder-specific reassurance and edits remain blocked until repair is complete.",
    appointmentHeading: "Dermatology follow-up",
    appointmentRows: baseAppointmentRows,
    appointmentMetaRows: [
      ...baseAppointmentMetaRows.slice(0, 2),
      { label: "Reminder posture", value: "Blocked by contact-route repair" },
      { label: "Continuity evidence", value: "Degraded but still summary-safe" },
    ],
    attendanceRows: inPersonAttendanceRows,
    pendingRows: [
      { label: "Current blocker", value: "Reachability dependency failed on the reminder route" },
      { label: "Ordinary manage posture", value: "Cancel, reschedule, and detail update stay available" },
      { label: "Safe next action", value: "Repair the route here or ask support to continue" },
    ],
    actionDeck: defaultActionDeck,
    reminderPanel: {
      heading: "ReminderPreferencePanel",
      body:
        "Reminder and reassurance copy stay blocked because the current route authority is not clear for reminder-dependent actions.",
      contactRouteState: "repair_required",
      preferenceRows: blockedReminderRows,
      repairRows,
      primaryAction: {
        actionRef: "repair_contact_route",
        label: "Repair reminder route",
        detail: "Reminder repair guidance focused.",
        transitionScenarioId: null,
      },
      secondaryAction: {
        actionRef: "request_support",
        label: "Use support path",
        detail: "Support path focused for reminder repair.",
        transitionScenarioId: null,
      },
    },
    supportPath,
    liveAnnouncement: "Reminder route repair is required before reminder changes can continue.",
  }),
  booking_case_297_stale: buildProjection({
    scenarioId: "booking_case_297_stale",
    bookingCaseId: "booking_case_297_stale",
    appointmentId: "appointment_297_ready",
    viewKind: "recovery",
    stateTone: "blocked",
    confirmationTruthState: "confirmed",
    manageExposureState: "summary_only",
    reminderExposureState: "blocked",
    artifactExposureState: "summary_only",
    continuityState: "stale",
    pendingState: "repair_required",
    attendanceMode: "in_person",
    manageCapabilityRefs: [],
    stateHeading: "Refresh this manage view before changing anything.",
    stateBody:
      "The appointment summary remains visible, but continuity evidence for the current manage route drifted. Writable manage posture stays frozen until the route is refreshed under the current publication tuple.",
    supportNote:
      "This closes the generic-manage-failure gap by keeping summary and recovery explanation in place instead of dropping the patient into a detached error route.",
    appointmentHeading: "Dermatology follow-up",
    appointmentRows: baseAppointmentRows,
    appointmentMetaRows: [
      { label: "Appointment reference", value: "APT-297-448201" },
      { label: "Current manage posture", value: "Summary-only until continuity refresh" },
      { label: "Continuity state", value: "Stale" },
      { label: "Route publication", value: "Needs refresh before mutation" },
    ],
    attendanceRows: inPersonAttendanceRows,
    pendingRows: [
      { label: "Current blocker", value: "Continuity evidence drifted after the manage route was opened" },
      { label: "Reminder posture", value: "Summary-only until the route refreshes" },
      { label: "Safe next action", value: "Refresh this route or ask support to continue" },
    ],
    reminderPanel: {
      heading: "ReminderPreferencePanel",
      body: "Reminder and artifact actions stay summary-only while the manage route is stale.",
      contactRouteState: "summary_only",
      preferenceRows: [
        { label: "Current reminder route", value: "Last safe SMS route preserved as provenance" },
        { label: "Reminder posture", value: "Blocked until continuity refresh" },
      ],
      repairRows,
      primaryAction: null,
      secondaryAction: null,
    },
    supportPath,
    actionDeck: [
      {
        actionRef: "refresh_manage_route",
        label: "Refresh this route",
        detail: "Manage route refreshed under the current continuity evidence.",
        transitionScenarioId: "booking_case_297_ready",
      },
    ],
    artifactActions: [],
    liveAnnouncement: "Manage continuity drifted. The appointment summary remains visible while controls stay frozen.",
  }),
  booking_case_297_confirmation_pending: buildProjection({
    scenarioId: "booking_case_297_confirmation_pending",
    bookingCaseId: "booking_case_297_confirmation_pending",
    appointmentId: "appointment_297_ready",
    viewKind: "recovery",
    stateTone: "warn",
    confirmationTruthState: "confirmation_pending",
    manageExposureState: "summary_only",
    reminderExposureState: "blocked",
    artifactExposureState: "summary_only",
    continuityState: "trusted",
    pendingState: "repair_required",
    attendanceMode: "in_person",
    manageCapabilityRefs: [],
    stateHeading: "We are still confirming this appointment, so manage actions stay read-only.",
    stateBody:
      "The booked summary remains visible for orientation, but cancel, reschedule, reminder changes, and detail updates do not unlock until booking confirmation truth returns to confirmed.",
    supportNote:
      "This closes the premature-success gap by suppressing ordinary manage posture while confirmation is still provisional.",
    appointmentHeading: "Dermatology follow-up",
    appointmentRows: baseAppointmentRows,
    appointmentMetaRows: [
      { label: "Appointment reference", value: "APT-297-448201" },
      { label: "Confirmation truth", value: "Confirmation pending" },
      { label: "Manage posture", value: "Summary-only" },
      { label: "Reminder posture", value: "Blocked until confirmation settles" },
    ],
    attendanceRows: inPersonAttendanceRows,
    pendingRows: [
      { label: "Current blocker", value: "Booking confirmation truth is not final" },
      { label: "Visible promise", value: "Booked summary only, not writable manage" },
      { label: "Safe next action", value: "Wait for confirmation or ask support if this is urgent" },
    ],
    reminderPanel: {
      heading: "ReminderPreferencePanel",
      body: "Reminder posture remains blocked because booking confirmation has not fully settled.",
      contactRouteState: "summary_only",
      preferenceRows: [
        { label: "Current reminder route", value: "Last safe SMS route preserved as provenance" },
        { label: "Reminder posture", value: "Blocked while confirmation is pending" },
      ],
      repairRows,
      primaryAction: null,
      secondaryAction: null,
    },
    supportPath,
    actionDeck: [
      {
        actionRef: "refresh_manage_status",
        label: "Refresh confirmation status",
        detail: "Confirmation truth refreshed for this appointment.",
        transitionScenarioId: "booking_case_297_ready",
      },
    ],
    artifactActions: [],
    liveAnnouncement: "Manage actions remain summary-only while confirmation truth is pending.",
  }),
} as const satisfies Record<string, PatientAppointmentManageProjection>;

const scenarioAlias: Record<string, keyof typeof projectionsByScenario> = {
  booking_case_296_confirmed: "booking_case_297_ready",
  booking_case_296_review: "booking_case_297_confirmation_pending",
  booking_case_296_pending: "booking_case_297_confirmation_pending",
  booking_case_296_reconciliation: "booking_case_297_stale",
  booking_case_296_route_drift: "booking_case_297_stale",
  booking_case_296_identity_repair: "booking_case_297_stale",
  booking_case_306_confirmed: "booking_case_297_ready",
  booking_case_306_confirmation_pending: "booking_case_297_confirmation_pending",
  booking_case_306_reopened: "booking_case_297_stale",
};

function overrideBookingCaseId(
  projection: PatientAppointmentManageProjection,
  bookingCaseId: string,
): PatientAppointmentManageProjection {
  return projection.bookingCaseId === bookingCaseId
    ? projection
    : {
        ...projection,
        bookingCaseId,
      };
}

export const patientAppointmentManageScenarioIds = Object.keys(
  projectionsByScenario,
) as readonly string[];

export function resolvePatientAppointmentManageProjection(
  bookingCaseId: string,
): PatientAppointmentManageProjection | null {
  const scenarioId = scenarioAlias[bookingCaseId] ?? bookingCaseId;
  const projection = projectionsByScenario[scenarioId as keyof typeof projectionsByScenario] ?? null;
  return projection ? overrideBookingCaseId(projection, bookingCaseId) : null;
}

export function resolvePatientAppointmentManageProjectionByScenarioId(
  scenarioId: string,
): PatientAppointmentManageProjection | null {
  return projectionsByScenario[scenarioId as keyof typeof projectionsByScenario] ?? null;
}

export function appointmentManageStateMatrix(): Array<Record<string, string>> {
  return patientAppointmentManageScenarioIds.map((scenarioId) => {
    const projection = resolvePatientAppointmentManageProjectionByScenarioId(scenarioId)!;
    return {
      scenario_id: projection.scenarioId,
      booking_case_id: projection.bookingCaseId,
      route: `/bookings/${projection.bookingCaseId}/manage`,
      view_kind: projection.viewKind,
      confirmation_truth: projection.confirmationTruthState,
      manage_exposure: projection.manageExposureState,
      reminder_exposure: projection.reminderExposureState,
      continuity_state: projection.continuityState,
      pending_state: projection.pendingState,
      attendance_mode: projection.attendanceMode,
      manage_capability:
        projection.manageCapabilityRefs.length > 0
          ? projection.manageCapabilityRefs.join("|")
          : "summary_only",
    };
  });
}

export function appointmentManageAtlasScenarios() {
  return patientAppointmentManageScenarioIds.map((scenarioId) => {
    const projection = resolvePatientAppointmentManageProjectionByScenarioId(scenarioId)!;
    return {
      scenarioId: projection.scenarioId,
      bookingCaseId: projection.bookingCaseId,
      viewKind: projection.viewKind,
      confirmationTruthState: projection.confirmationTruthState,
      manageExposureState: projection.manageExposureState,
      reminderExposureState: projection.reminderExposureState,
      continuityState: projection.continuityState,
      pendingState: projection.pendingState,
      attendanceMode: projection.attendanceMode,
      stateHeading: projection.stateHeading,
    };
  });
}

export function appointmentManageContractSummary() {
  return {
    taskId: PATIENT_APPOINTMENT_MANAGE_TASK_ID,
    visualMode: PATIENT_APPOINTMENT_MANAGE_VISUAL_MODE,
    routes: [
      {
        path: "/bookings/:bookingCaseId/manage",
        purpose:
          "Render appointment summary, attendance, reminder posture, cancel, reschedule, and detail-update states inside the same booking shell.",
      },
    ],
    uiPrimitives: [
      "PatientAppointmentDetailView",
      "AppointmentSummaryCard",
      "AttendanceInstructionPanel",
      "ReminderPreferencePanel",
      "CancelAppointmentFlow",
      "RescheduleEntryStage",
      "AppointmentDetailUpdateForm",
      "ManagePendingOrRecoveryPanel",
      "AssistedFallbackStub",
    ],
    domMarkers: [
      "data-appointment-id",
      "data-manage-capability",
      "data-manage-pending-state",
      "data-reminder-exposure",
      "data-attendance-mode",
      "data-manage-exposure",
      "data-confirmation-truth",
      "data-continuity-state",
    ],
    gatingRules: [
      "Manage actions are writable only while booking confirmation truth is confirmed and continuity evidence is current.",
      "Reminder posture may not imply scheduling success before reminder exposure is scheduled.",
      "The original appointment summary stays visible while cancel, reschedule, or detail-update child states are active.",
      "Reschedule reuses the existing slot selection surface instead of opening a second booking product.",
    ],
  };
}
