import {
  resolvePatientHomeRequestsDetailEntry,
  type PatientHomeCompactPanel,
  type PatientHomeRequestsDetailEntryProjection,
  type PatientRequestDetailProjection,
  type PatientRequestDownstreamProjection,
} from "./patient-home-requests-detail-routes.model";
import {
  resolveRecordsCommunicationsEntry,
  type RecordsCommunicationsEntryProjection,
} from "./patient-records-communications.model";
import {
  continuitySnapshotForLocation,
  defaultPatientShellViewMemory,
  parsePatientShellLocation,
  resolveSelectedAppointmentForLocation,
} from "./patient-shell-seed.model";
import {
  resolvePatientBookingWorkspaceEntry,
  type PatientAppointmentWorkspaceProjection293,
} from "./patient-booking-workspace.model";
import {
  PATIENT_BOOKING_ENTRY_IDS,
  bookingEntryPath,
  type PatientBookingEntryFixtureId,
} from "./patient-booking-entry.paths";

export const PATIENT_BOOKING_ENTRY_TASK_ID =
  "par_300_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_record_origin_continuation_and_booking_entry_surfaces";
export const PATIENT_BOOKING_ENTRY_VISUAL_MODE = "Record_Origin_Booking_Entry";

export type BookingEntryOriginType =
  | "home"
  | "requests"
  | "appointments"
  | "record_origin";
export type BookingEntryContinuityPosture =
  | "aligned"
  | "read_only"
  | "recovery_required";
export type BookingEntryReturnPosture =
  | "same_shell_return"
  | "read_only_return"
  | "recovery_bound_return";
export type BookingEntryWritability = "writable" | "read_only" | "blocked";
export type RecordContinuationState =
  | "not_applicable"
  | "aligned"
  | "stale"
  | "awaiting_step_up";
export type BookingEntryActionRef =
  | "continue_booking"
  | "continue_to_selection"
  | "return_to_origin"
  | "review_origin_read_only"
  | "recover_record_continuation"
  | "recheck_entry_continuity"
  | "contact_support";

export interface BookingEntryFactRow {
  readonly label: string;
  readonly value: string;
}

export interface BookingEntryAction {
  readonly actionRef: BookingEntryActionRef;
  readonly label: string;
  readonly tone: "primary" | "secondary" | "warn";
}

export interface BookingEntryContextRibbonProjection {
  readonly eyebrow: string;
  readonly heading: string;
  readonly body: string;
  readonly statusLabel: string;
  readonly statusTone: "safe" | "primary" | "warn" | "blocked";
  readonly summaryRows: readonly BookingEntryFactRow[];
}

export interface BookingSourceBadgeProjection {
  readonly originType: BookingEntryOriginType;
  readonly label: string;
  readonly tone: "home" | "requests" | "appointments" | "record";
  readonly objectRef: string;
}

export interface BookingLaunchSummaryCardProjection {
  readonly heading: string;
  readonly body: string;
  readonly factRows: readonly BookingEntryFactRow[];
}

export interface RecordFollowUpBookingCardProjection {
  readonly heading: string;
  readonly body: string;
  readonly factRows: readonly BookingEntryFactRow[];
  readonly bookingOfferReason: string;
}

export interface BookingEntryNextActionPanelProjection {
  readonly heading: string;
  readonly body: string;
  readonly note: string;
  readonly primaryAction: BookingEntryAction;
  readonly secondaryActions: readonly BookingEntryAction[];
}

export interface BookingQuietReturnStubProjection {
  readonly heading: string;
  readonly body: string;
  readonly action: BookingEntryAction;
}

export interface PatientBookingEntryProjectionAdapter {
  readonly projectionName: "PatientBookingEntryProjectionAdapter";
  readonly adapterRef: string;
  readonly entryFixtureId: PatientBookingEntryFixtureId;
  readonly sourceProjectionRefs: readonly string[];
  readonly navReturnContractRef: string | null;
  readonly requestReturnBundleRef: string | null;
  readonly recordActionContextTokenRef: string | null;
  readonly recordOriginContinuationRef: string | null;
  readonly recoveryContinuationTokenRef: string | null;
  readonly continuityTupleHash: string;
  readonly workspacePreviewRef: string;
}

export interface PatientBookingEntryRestoreBundle300 {
  readonly projectionName: "PatientBookingEntryRestoreBundle300";
  readonly entryFixtureId: PatientBookingEntryFixtureId;
  readonly pathname: `/bookings/entry/${string}`;
  readonly originType: BookingEntryOriginType;
  readonly originObjectRef: string;
  readonly returnRouteRef: string;
  readonly selectedAnchorRef: string;
  readonly selectedAnchorLabel: string;
  readonly targetWorkspacePath: string;
  readonly continuityTupleHash: string;
  readonly restoredBy: "query" | "soft_navigation" | "browser_back" | "refresh_replay";
}

export interface PatientBookingEntryProjection {
  readonly projectionName: "PatientBookingEntryProjection";
  readonly visualMode: typeof PATIENT_BOOKING_ENTRY_VISUAL_MODE;
  readonly entryFixtureId: PatientBookingEntryFixtureId;
  readonly pathname: `/bookings/entry/${string}`;
  readonly targetWorkspacePath: string;
  readonly bookingCaseId: string;
  readonly originType: BookingEntryOriginType;
  readonly originObjectRef: string;
  readonly originLabel: string;
  readonly continuityPosture: BookingEntryContinuityPosture;
  readonly returnPosture: BookingEntryReturnPosture;
  readonly entryWritability: BookingEntryWritability;
  readonly recordContinuationState: RecordContinuationState;
  readonly liveAnnouncement: string;
  readonly contextRibbon: BookingEntryContextRibbonProjection;
  readonly sourceBadge: BookingSourceBadgeProjection;
  readonly summaryCard: BookingLaunchSummaryCardProjection;
  readonly recordFollowUpCard: RecordFollowUpBookingCardProjection | null;
  readonly nextActionPanel: BookingEntryNextActionPanelProjection;
  readonly quietReturnStub: BookingQuietReturnStubProjection;
  readonly adapter: PatientBookingEntryProjectionAdapter;
  readonly restoreBundle: PatientBookingEntryRestoreBundle300;
}

interface BookingEntryFixtureSpec {
  readonly entryFixtureId: PatientBookingEntryFixtureId;
  readonly originType: BookingEntryOriginType;
  readonly bookingCaseId: string;
  readonly workspaceRouteKey: "workspace" | "select";
  readonly sourcePath: string;
  readonly returnRouteRef: string;
  readonly selectedAnchorRef: string;
  readonly selectedAnchorLabel: string;
  readonly originObjectRef: string;
  readonly originLabel: string;
  readonly continuityPosture: BookingEntryContinuityPosture;
  readonly returnPosture: BookingEntryReturnPosture;
  readonly entryWritability: BookingEntryWritability;
  readonly recordContinuationState: RecordContinuationState;
  readonly bookingOfferReason: string;
  readonly stageHeading: string;
  readonly stageBody: string;
  readonly liveAnnouncement: string;
}

function tuple(input: string): string {
  let hash = 0;
  for (const character of input) {
    hash = (hash * 33 + character.charCodeAt(0)) >>> 0;
  }
  return `tuple_300_${hash.toString(16).padStart(8, "0")}`;
}

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

function workspacePath(bookingCaseId: string, routeKey: "workspace" | "select"): string {
  return routeKey === "workspace"
    ? `/bookings/${bookingCaseId}`
    : `/bookings/${bookingCaseId}/select`;
}

function buildWorkspaceSearch(projection: {
  originType: BookingEntryOriginType;
  returnRouteRef: string;
  selectedAnchorRef: string;
  selectedAnchorLabel: string;
}): string {
  const params = new URLSearchParams();
  params.set("origin", projection.originType);
  params.set("returnRoute", projection.returnRouteRef);
  params.set("anchor", projection.selectedAnchorRef);
  params.set("anchorLabel", projection.selectedAnchorLabel);
  return `?${params.toString()}`;
}

function toneForPosture(
  posture: BookingEntryContinuityPosture,
): BookingEntryContextRibbonProjection["statusTone"] {
  switch (posture) {
    case "aligned":
      return "safe";
    case "read_only":
      return "warn";
    case "recovery_required":
      return "blocked";
  }
}

function statusLabelForProjection(spec: BookingEntryFixtureSpec): string {
  if (spec.entryWritability === "writable") {
    return "Booking entry is live";
  }
  if (spec.entryWritability === "read_only") {
    return "Booking entry is read only";
  }
  return "Booking entry is recovery bound";
}

function sourceTone(
  originType: BookingEntryOriginType,
): BookingSourceBadgeProjection["tone"] {
  switch (originType) {
    case "home":
      return "home";
    case "requests":
      return "requests";
    case "appointments":
      return "appointments";
    case "record_origin":
      return "record";
  }
}

function homeSource(): {
  homeEntry: PatientHomeRequestsDetailEntryProjection;
  appointmentsPanel: PatientHomeCompactPanel;
} {
  const homeEntry = resolvePatientHomeRequestsDetailEntry({
    pathname: "/home",
    restoredBy: "soft_navigation",
  });
  const appointmentsPanel =
    homeEntry.home.compactPanels.find((panel) => panel.kind === "appointments") ??
    homeEntry.home.compactPanels[0]!;
  return { homeEntry, appointmentsPanel };
}

function requestSource(): {
  requestEntry: PatientHomeRequestsDetailEntryProjection;
  requestDetail: PatientRequestDetailProjection;
  bookingChild: PatientRequestDownstreamProjection | null;
} {
  const requestEntry = resolvePatientHomeRequestsDetailEntry({
    pathname: "/requests/request_211_a",
    restoredBy: "soft_navigation",
  });
  const requestDetail = requestEntry.requestDetail ?? resolvePatientHomeRequestsDetailEntry({
    pathname: "/requests/request_211_a",
    restoredBy: "soft_navigation",
  }).requestDetail!;
  const bookingChild =
    requestDetail.downstream.find((child) => child.childType === "booking") ?? null;
  return { requestEntry, requestDetail, bookingChild };
}

function appointmentSource() {
  const memory = defaultPatientShellViewMemory();
  const location = parsePatientShellLocation("/appointments");
  const continuitySnapshot = continuitySnapshotForLocation(location, memory);
  const appointment = resolveSelectedAppointmentForLocation(memory);
  return { continuitySnapshot, appointment };
}

function recordSource(pathname: string): RecordsCommunicationsEntryProjection {
  return resolveRecordsCommunicationsEntry(pathname);
}

const bookingEntryFixtureSpecs: Record<PatientBookingEntryFixtureId, BookingEntryFixtureSpec> = {
  [PATIENT_BOOKING_ENTRY_IDS.homeReady]: {
    entryFixtureId: PATIENT_BOOKING_ENTRY_IDS.homeReady,
    originType: "home",
    bookingCaseId: "booking_case_293_live",
    workspaceRouteKey: "workspace",
    sourcePath: "/home",
    returnRouteRef: "/home",
    selectedAnchorRef: "home-compact-panel-appointments",
    selectedAnchorLabel: "Appointments panel",
    originObjectRef: "home_panel_appointments",
    originLabel: "Home",
    continuityPosture: "aligned",
    returnPosture: "same_shell_return",
    entryWritability: "writable",
    recordContinuationState: "not_applicable",
    bookingOfferReason:
      "The signed-in home shell raised booking from the appointments lane with the current return memory intact.",
    stageHeading: "Book from the same home shell",
    stageBody:
      "The home action keeps its return route, anchor, and quiet posture so you can start booking without losing where you came from.",
    liveAnnouncement:
      "Home booking entry loaded with the appointments panel and return contract preserved.",
  },
  [PATIENT_BOOKING_ENTRY_IDS.requestsReady]: {
    entryFixtureId: PATIENT_BOOKING_ENTRY_IDS.requestsReady,
    originType: "requests",
    bookingCaseId: "booking_case_293_partial",
    workspaceRouteKey: "workspace",
    sourcePath: "/requests/request_211_a",
    returnRouteRef: "/requests/request_211_a",
    selectedAnchorRef: "request-detail-booking-entry",
    selectedAnchorLabel: "Request detail booking follow-up",
    originObjectRef: "request_211_a",
    originLabel: "Request detail",
    continuityPosture: "aligned",
    returnPosture: "same_shell_return",
    entryWritability: "writable",
    recordContinuationState: "not_applicable",
    bookingOfferReason:
      "The request detail still owns the next safe action, and its return bundle remains aligned with the same request lineage.",
    stageHeading: "Continue from request detail",
    stageBody:
      "Booking is being launched as request follow-up. The request detail route, selected anchor, and safe return remain bound before scheduling opens.",
    liveAnnouncement:
      "Request detail booking entry loaded with the request return bundle and selected anchor preserved.",
  },
  [PATIENT_BOOKING_ENTRY_IDS.appointmentsReady]: {
    entryFixtureId: PATIENT_BOOKING_ENTRY_IDS.appointmentsReady,
    originType: "appointments",
    bookingCaseId: "booking_case_297_ready",
    workspaceRouteKey: "select",
    sourcePath: "/appointments",
    returnRouteRef: "/appointments",
    selectedAnchorRef: "appointments-rebook-launch",
    selectedAnchorLabel: "Upcoming appointment rebook action",
    originObjectRef: "appt_002",
    originLabel: "Appointments",
    continuityPosture: "aligned",
    returnPosture: "same_shell_return",
    entryWritability: "writable",
    recordContinuationState: "not_applicable",
    bookingOfferReason:
      "The current appointment itinerary still owns the rebook action, so the next safe step is to continue into slot selection.",
    stageHeading: "Choose a replacement slot",
    stageBody:
      "Appointment context stays visible while the route checks that the return contract and current itinerary anchor still match.",
    liveAnnouncement:
      "Appointment-origin booking entry loaded with the itinerary anchor and safe return preserved.",
  },
  [PATIENT_BOOKING_ENTRY_IDS.appointmentsReadOnly]: {
    entryFixtureId: PATIENT_BOOKING_ENTRY_IDS.appointmentsReadOnly,
    originType: "appointments",
    bookingCaseId: "booking_case_297_ready",
    workspaceRouteKey: "select",
    sourcePath: "/appointments",
    returnRouteRef: "/appointments",
    selectedAnchorRef: "appointments-rebook-launch",
    selectedAnchorLabel: "Upcoming appointment rebook action",
    originObjectRef: "appt_002",
    originLabel: "Appointments",
    continuityPosture: "read_only",
    returnPosture: "read_only_return",
    entryWritability: "read_only",
    recordContinuationState: "not_applicable",
    bookingOfferReason:
      "The appointment summary remains readable, but publication drift means the next route cannot become writable until the continuity tuple is refreshed.",
    stageHeading: "Review the appointment before rebooking",
    stageBody:
      "The booking path is preserved, but controls stay read only because the current appointment publication and return tuple no longer agree strongly enough for live scheduling.",
    liveAnnouncement:
      "Appointment-origin booking entry loaded in read-only posture because the continuity tuple drifted.",
  },
  [PATIENT_BOOKING_ENTRY_IDS.recordOriginReady]: {
    entryFixtureId: PATIENT_BOOKING_ENTRY_IDS.recordOriginReady,
    originType: "record_origin",
    bookingCaseId: "booking_case_293_live",
    workspaceRouteKey: "workspace",
    sourcePath: "/records/results/result_213_fbc",
    returnRouteRef: "/records/results/result_213_fbc",
    selectedAnchorRef: "record-follow-up-booking-trigger",
    selectedAnchorLabel: "Record follow-up booking action",
    originObjectRef: "record_213_result_a",
    originLabel: "Record follow-up",
    continuityPosture: "aligned",
    returnPosture: "same_shell_return",
    entryWritability: "writable",
    recordContinuationState: "aligned",
    bookingOfferReason:
      "The result summary, record-origin continuation envelope, and recovery token still match the current record anchor, so booking can continue safely.",
    stageHeading: "Book from a record follow-up",
    stageBody:
      "This booking path was triggered by a health-record follow-up card. The record anchor stays visible until the booking workspace takes over.",
    liveAnnouncement:
      "Record-origin booking entry loaded with the source result, record continuation, and return route preserved.",
  },
  [PATIENT_BOOKING_ENTRY_IDS.recordOriginRecovery]: {
    entryFixtureId: PATIENT_BOOKING_ENTRY_IDS.recordOriginRecovery,
    originType: "record_origin",
    bookingCaseId: "booking_case_293_live",
    workspaceRouteKey: "workspace",
    sourcePath: "/records/results/result_213_step_up",
    returnRouteRef: "/records/results/result_213_step_up",
    selectedAnchorRef: "record-follow-up-booking-trigger",
    selectedAnchorLabel: "Record follow-up booking action",
    originObjectRef: "record_213_step_up",
    originLabel: "Record follow-up",
    continuityPosture: "recovery_required",
    returnPosture: "recovery_bound_return",
    entryWritability: "blocked",
    recordContinuationState: "awaiting_step_up",
    bookingOfferReason:
      "The record shell kept the result anchor visible, but the release and step-up posture drifted before booking could become writable.",
    stageHeading: "Recover the record context before booking",
    stageBody:
      "The same record-origin shell is still recoverable, so this route keeps the source summary visible and blocks stale booking controls in place.",
    liveAnnouncement:
      "Record-origin booking entry loaded in recovery posture because the record continuation envelope is no longer safe for live booking.",
  },
};

function buildContextRibbon(
  spec: BookingEntryFixtureSpec,
  originSummary: string,
  sourceTitle: string,
  targetWorkspace: PatientAppointmentWorkspaceProjection293,
): BookingEntryContextRibbonProjection {
  return {
    eyebrow: "BookingEntryContextRibbon",
    heading: spec.stageHeading,
    body: spec.stageBody,
    statusLabel: statusLabelForProjection(spec),
    statusTone: toneForPosture(spec.continuityPosture),
    summaryRows: [
      { label: "Launch origin", value: spec.originLabel },
      { label: "Source item", value: sourceTitle },
      { label: "Continuity posture", value: humanize(spec.continuityPosture) },
      { label: "Return posture", value: humanize(spec.returnPosture) },
      {
        label: "Booking target",
        value: `${targetWorkspace.serviceLine} · ${humanize(targetWorkspace.capabilityProjection.surfaceState)}`,
      },
      { label: "Why booking is offered", value: originSummary },
    ],
  };
}

function buildNextActionPanel(
  spec: BookingEntryFixtureSpec,
  targetWorkspace: PatientAppointmentWorkspaceProjection293,
): BookingEntryNextActionPanelProjection {
  if (spec.entryWritability === "writable") {
    return {
      heading: "The route has enough continuity proof to continue",
      body:
        spec.workspaceRouteKey === "select"
          ? "The next safe step is to continue to slot selection with the same return contract and selected anchor."
          : "The next safe step is to continue into the booking workspace with the same origin summary and safe return.",
      note:
        "Live booking controls appear only after the entry route confirms the return contract, source anchor, and any record-origin continuation still align.",
      primaryAction: {
        actionRef:
          spec.workspaceRouteKey === "select"
            ? "continue_to_selection"
            : "continue_booking",
        label:
          spec.workspaceRouteKey === "select"
            ? "Continue to selection"
            : "Continue to booking",
        tone: "primary",
      },
      secondaryActions: [
        {
          actionRef: "return_to_origin",
          label: `Return to ${spec.originLabel.toLowerCase()}`,
          tone: "secondary",
        },
        {
          actionRef: "contact_support",
          label: targetWorkspace.supportPath.actionLabel,
          tone: "secondary",
        },
      ],
    };
  }

  if (spec.entryWritability === "read_only") {
    return {
      heading: "The source summary is still safe, but the route is not writable",
      body:
        "The entry surface keeps the appointment context and return memory visible while the booking path stays read only. This prevents stale rebooking from looking live.",
      note:
        "Use the calm return path or recheck continuity. Do not reopen booking from a fresh landing page while the current itinerary shell is still the governing source.",
      primaryAction: {
        actionRef: "review_origin_read_only",
        label: "Return to appointment summary",
        tone: "primary",
      },
      secondaryActions: [
        {
          actionRef: "recheck_entry_continuity",
          label: "Recheck entry continuity",
          tone: "secondary",
        },
        {
          actionRef: "contact_support",
          label: targetWorkspace.supportPath.actionLabel,
          tone: "secondary",
        },
      ],
    };
  }

  return {
    heading: "Recover the governing context before booking continues",
    body:
      "The last safe record summary stays visible, but the route is blocked from opening booking because the current continuation or release posture is stale.",
    note:
      "Revalidate the record context in place. The patient should not be dropped onto a generic booking page or an unrelated section reset.",
    primaryAction: {
      actionRef: "recover_record_continuation",
      label: "Review record recovery",
      tone: "warn",
    },
    secondaryActions: [
      {
        actionRef: "return_to_origin",
        label: "Return to the record",
        tone: "secondary",
      },
      {
        actionRef: "contact_support",
        label: targetWorkspace.supportPath.actionLabel,
        tone: "secondary",
      },
    ],
  };
}

function buildQuietReturnStub(
  spec: BookingEntryFixtureSpec,
): BookingQuietReturnStubProjection {
  return {
    heading: "Safe return stays visible",
    body:
      spec.returnPosture === "same_shell_return"
        ? "If you leave now, the current source shell reopens with the same return target and selected anchor."
        : spec.returnPosture === "read_only_return"
          ? "Return stays available, but it will reopen in a calmer read-only posture until continuity is refreshed."
          : "Return remains tied to the source shell so recovery can reopen the same record anchor instead of dropping you elsewhere.",
    action: {
      actionRef: "return_to_origin",
      label:
        spec.returnPosture === "same_shell_return"
          ? `Return to ${spec.originLabel.toLowerCase()}`
          : spec.returnPosture === "read_only_return"
            ? "Return read only"
            : "Return for recovery",
      tone: "secondary",
    },
  };
}

function resolveAdapterSource(
  spec: BookingEntryFixtureSpec,
): {
  sourceProjectionRefs: readonly string[];
  navReturnContractRef: string | null;
  requestReturnBundleRef: string | null;
  recordActionContextTokenRef: string | null;
  recordOriginContinuationRef: string | null;
  recoveryContinuationTokenRef: string | null;
  originSummary: string;
  sourceTitle: string;
  summaryRows: readonly BookingEntryFactRow[];
  recordFollowUpCard: RecordFollowUpBookingCardProjection | null;
} {
  switch (spec.originType) {
    case "home": {
      const { homeEntry, appointmentsPanel } = homeSource();
      return {
        sourceProjectionRefs: [
          homeEntry.home.projectionName,
          "PatientNavReturnContract",
          ...appointmentsPanel.sourceProjectionRefs,
        ],
        navReturnContractRef: homeEntry.home.navReturnContract.contractRef,
        requestReturnBundleRef: null,
        recordActionContextTokenRef: null,
        recordOriginContinuationRef: null,
        recoveryContinuationTokenRef: null,
        originSummary: spec.bookingOfferReason,
        sourceTitle: appointmentsPanel.label,
        summaryRows: [
          { label: "Origin summary", value: appointmentsPanel.summary },
          { label: "Source state", value: appointmentsPanel.stateLabel },
          {
            label: "Return contract",
            value: homeEntry.home.navReturnContract.returnRouteRef,
          },
          {
            label: "Selected anchor",
            value: spec.selectedAnchorLabel,
          },
          {
            label: "Capability cue",
            value: "Home surfaced the next safe booking action without flattening provenance.",
          },
        ],
        recordFollowUpCard: null,
      };
    }
    case "requests": {
      const { requestDetail, bookingChild } = requestSource();
      return {
        sourceProjectionRefs: [
          requestDetail.projectionName,
          requestDetail.returnBundle.projectionName,
          requestDetail.lineage.projectionName,
          ...(bookingChild ? [bookingChild.projectionName] : []),
        ],
        navReturnContractRef: null,
        requestReturnBundleRef: requestDetail.returnBundle.requestReturnBundleRef,
        recordActionContextTokenRef: null,
        recordOriginContinuationRef: null,
        recoveryContinuationTokenRef: null,
        originSummary: spec.bookingOfferReason,
        sourceTitle: requestDetail.title,
        summaryRows: [
          { label: "Request", value: requestDetail.requestRef },
          { label: "Current action", value: requestDetail.nextAction.actionLabel },
          { label: "Return bundle", value: requestDetail.returnBundle.requestReturnBundleRef },
          { label: "Lineage stage", value: requestDetail.lineage.currentStageRef },
          { label: "Selected anchor", value: requestDetail.returnBundle.selectedAnchorRef },
        ],
        recordFollowUpCard: null,
      };
    }
    case "appointments": {
      const { continuitySnapshot, appointment } = appointmentSource();
      return {
        sourceProjectionRefs: [
          "PatientAppointmentProjection",
          "PatientNavReturnContract",
          "PatientShellConsistencyProjection",
        ],
        navReturnContractRef: `nav_return_contract_appointments_${appointment.id}`,
        requestReturnBundleRef: null,
        recordActionContextTokenRef: null,
        recordOriginContinuationRef: null,
        recoveryContinuationTokenRef: null,
        originSummary: spec.bookingOfferReason,
        sourceTitle: appointment.title,
        summaryRows: [
          { label: "Appointment", value: appointment.id },
          { label: "When", value: appointment.dateLabel },
          { label: "Place", value: appointment.locationLabel },
          { label: "Selected anchor", value: continuitySnapshot.selectedAnchor.anchorId },
          { label: "Continuity key", value: continuitySnapshot.selectedAnchor.continuityFrameRef },
        ],
        recordFollowUpCard: null,
      };
    }
    case "record_origin": {
      const recordEntry = recordSource(spec.sourcePath);
      const sourceItem =
        recordEntry.recordSummaryItems.find(
          (item) => item.routeRef === spec.sourcePath,
        ) ?? recordEntry.recordSummaryItems[0]!;
      return {
        sourceProjectionRefs: [
          recordEntry.projectionName,
          recordEntry.recordSurfaceContext.projectionName,
          recordEntry.followUpEligibility.projectionName,
          recordEntry.recordContinuity.projectionName,
          recordEntry.recordReturnBundle.projectionName,
        ],
        navReturnContractRef: null,
        requestReturnBundleRef: recordEntry.recordReturnBundle.requestReturnBundleRef,
        recordActionContextTokenRef: recordEntry.followUpEligibility.recordActionContextTokenRef,
        recordOriginContinuationRef: recordEntry.recordContinuity.recordOriginContinuationRef,
        recoveryContinuationTokenRef: recordEntry.recordContinuity.recoveryContinuationTokenRef,
        originSummary: spec.bookingOfferReason,
        sourceTitle: sourceItem.title,
        summaryRows: [
          { label: "Source item", value: sourceItem.title },
          { label: "Updated", value: sourceItem.updatedLabel },
          { label: "Eligibility", value: humanize(recordEntry.followUpEligibility.eligibilityState) },
          { label: "Fence", value: humanize(recordEntry.followUpEligibility.eligibilityFenceState) },
          { label: "Continuation", value: humanize(recordEntry.recordContinuity.continuationState) },
        ],
        recordFollowUpCard: {
          heading: "RecordFollowUpBookingCard",
          body:
            "This booking action came from the current record summary. The patient can see which item triggered booking and what continuity proof is still governing the launch.",
          factRows: [
            { label: "Record ref", value: recordEntry.recordSurfaceContext.recordRef },
            { label: "Source title", value: sourceItem.title },
            { label: "Source state", value: humanize(sourceItem.releaseState) },
            {
              label: "Record origin continuation",
              value: recordEntry.recordContinuity.recordOriginContinuationRef,
            },
            {
              label: "Recovery token",
              value: recordEntry.recordContinuity.recoveryContinuationTokenRef,
            },
          ],
          bookingOfferReason: spec.bookingOfferReason,
        },
      };
    }
  }
}

export const patientBookingEntryFixtureIds = Object.values(
  PATIENT_BOOKING_ENTRY_IDS,
) as readonly PatientBookingEntryFixtureId[];

export function isPatientBookingEntryPath(pathname: string): boolean {
  return /^\/bookings\/entry\/[^/]+$/.test(pathname);
}

export function parsePatientBookingEntryPath(
  pathname: string,
): PatientBookingEntryFixtureId | null {
  const match = /^\/bookings\/entry\/([^/]+)$/.exec(pathname);
  if (!match) {
    return null;
  }
  const entryId = match[1] as PatientBookingEntryFixtureId;
  return patientBookingEntryFixtureIds.includes(entryId) ? entryId : null;
}

export function resolvePatientBookingEntryProjection(input: {
  pathname: string;
  restoredBundle?: PatientBookingEntryRestoreBundle300 | null;
  restoredBy?: PatientBookingEntryRestoreBundle300["restoredBy"];
}): PatientBookingEntryProjection {
  const entryFixtureId =
    parsePatientBookingEntryPath(input.pathname) ??
    input.restoredBundle?.entryFixtureId ??
    PATIENT_BOOKING_ENTRY_IDS.homeReady;
  const spec = bookingEntryFixtureSpecs[entryFixtureId];
  const targetPath = workspacePath(spec.bookingCaseId, spec.workspaceRouteKey);
  const search = buildWorkspaceSearch(spec);
  const workspaceEntry = resolvePatientBookingWorkspaceEntry({
    pathname: targetPath,
    search,
  });
  const adapterSource = resolveAdapterSource(spec);
  const adapter: PatientBookingEntryProjectionAdapter = {
    projectionName: "PatientBookingEntryProjectionAdapter",
    adapterRef: `patient_booking_entry_adapter_${spec.entryFixtureId}`,
    entryFixtureId: spec.entryFixtureId,
    sourceProjectionRefs: adapterSource.sourceProjectionRefs,
    navReturnContractRef: adapterSource.navReturnContractRef,
    requestReturnBundleRef: adapterSource.requestReturnBundleRef,
    recordActionContextTokenRef: adapterSource.recordActionContextTokenRef,
    recordOriginContinuationRef: adapterSource.recordOriginContinuationRef,
    recoveryContinuationTokenRef: adapterSource.recoveryContinuationTokenRef,
    continuityTupleHash: tuple(
      [
        spec.entryFixtureId,
        spec.continuityPosture,
        spec.returnPosture,
        spec.selectedAnchorRef,
        adapterSource.recordOriginContinuationRef ?? "no_record_origin",
      ].join(":"),
    ),
    workspacePreviewRef: workspaceEntry.workspace.projectionName,
  };
  const targetWorkspacePath = `${targetPath}${search}`;
  const contextRibbon = buildContextRibbon(
    spec,
    adapterSource.originSummary,
    adapterSource.sourceTitle,
    workspaceEntry.workspace,
  );

  return {
    projectionName: "PatientBookingEntryProjection",
    visualMode: PATIENT_BOOKING_ENTRY_VISUAL_MODE,
    entryFixtureId: spec.entryFixtureId,
    pathname: bookingEntryPath(spec.entryFixtureId),
    targetWorkspacePath,
    bookingCaseId: spec.bookingCaseId,
    originType: spec.originType,
    originObjectRef: spec.originObjectRef,
    originLabel: spec.originLabel,
    continuityPosture: spec.continuityPosture,
    returnPosture: spec.returnPosture,
    entryWritability: spec.entryWritability,
    recordContinuationState: spec.recordContinuationState,
    liveAnnouncement: spec.liveAnnouncement,
    contextRibbon,
    sourceBadge: {
      originType: spec.originType,
      label: spec.originLabel,
      tone: sourceTone(spec.originType),
      objectRef: spec.originObjectRef,
    },
    summaryCard: {
      heading: "BookingLaunchSummaryCard",
      body:
        spec.entryWritability === "writable"
          ? "The entry layer keeps provenance, return memory, and current booking capability visible before the booking workspace becomes interactive."
          : spec.entryWritability === "read_only"
            ? "The entry layer preserves the last safe summary and explains why the route is not writable yet."
            : "The entry layer preserves the record-origin summary and recovery path while stale controls stay suppressed.",
      factRows: [
        ...adapterSource.summaryRows,
        {
          label: "Workspace target",
          value: workspaceEntry.workspace.heading,
        },
      ],
    },
    recordFollowUpCard: adapterSource.recordFollowUpCard,
    nextActionPanel: buildNextActionPanel(spec, workspaceEntry.workspace),
    quietReturnStub: buildQuietReturnStub(spec),
    adapter,
    restoreBundle: {
      projectionName: "PatientBookingEntryRestoreBundle300",
      entryFixtureId: spec.entryFixtureId,
      pathname: bookingEntryPath(spec.entryFixtureId),
      originType: spec.originType,
      originObjectRef: spec.originObjectRef,
      returnRouteRef: spec.returnRouteRef,
      selectedAnchorRef: spec.selectedAnchorRef,
      selectedAnchorLabel: spec.selectedAnchorLabel,
      targetWorkspacePath,
      continuityTupleHash: adapter.continuityTupleHash,
      restoredBy: input.restoredBy ?? "query",
    },
  };
}

export function patientBookingEntryStateMatrix(): Array<Record<string, string>> {
  return patientBookingEntryFixtureIds.map((entryFixtureId) => {
    const projection = resolvePatientBookingEntryProjection({
      pathname: bookingEntryPath(entryFixtureId),
    });
    return {
      entry_fixture_id: projection.entryFixtureId,
      origin_type: projection.originType,
      origin_object_ref: projection.originObjectRef,
      continuity_posture: projection.continuityPosture,
      return_posture: projection.returnPosture,
      entry_writable: projection.entryWritability,
      record_continuation_state: projection.recordContinuationState,
      booking_case_id: projection.bookingCaseId,
      target_workspace_path: projection.targetWorkspacePath,
    };
  });
}
