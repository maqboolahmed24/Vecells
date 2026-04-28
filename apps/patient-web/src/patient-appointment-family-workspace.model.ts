import {
  resolveBookingConfirmationProjectionByScenarioId,
  type BookingConfirmationProjection,
} from "./patient-booking-confirmation.model";
import {
  resolvePatientAppointmentManageProjectionByScenarioId,
  type PatientAppointmentManageProjection,
} from "./patient-appointment-manage.model";
import {
  resolvePatientBookingWorkspaceEntry,
  type PatientBookingWorkspaceEntryProjection,
} from "./patient-booking-workspace.model";
import {
  resolvePatientNetworkAlternativeChoiceProjectionByScenarioId,
  type PatientNetworkAlternativeChoiceProjection,
} from "./patient-network-alternative-choice.model";
import {
  resolvePatientNetworkConfirmationProjectionByScenarioId,
  type NetworkConfirmationScenarioId329,
  type PatientNetworkConfirmationProjection329,
} from "./patient-network-confirmation.model";
import {
  resolvePatientNetworkManagePath,
  resolvePatientNetworkManageProjectionByScenarioId,
  type NetworkManageScenarioId330,
  type PatientNetworkManageProjection330,
} from "./patient-network-manage.model";

export const PATIENT_APPOINTMENT_FAMILY_TASK_ID =
  "seq_337_phase5_merge_Playwright_or_other_appropriate_tooling_integrate_network_coordination_with_local_booking_and_patient_portal_manage_flows";
export const PATIENT_APPOINTMENT_FAMILY_VISUAL_MODE = "Unified_Appointment_Family_Workspace";
export const APPOINTMENT_FAMILY_BINDER_STORAGE_KEY =
  "patient-appointment-family-337::continuity-binder";

export type AppointmentFamilyEntrySource337 =
  | "appointments_list"
  | "request_detail"
  | "notification";
export type AppointmentFamilyVariant337 = "default" | "pending";
export type AppointmentFamilyTruthSource337 =
  | "BookingConfirmationTruthProjection"
  | "HubOfferToConfirmationTruthProjection";
export type AppointmentFamilyKind337 =
  | "local_appointment"
  | "network_appointment"
  | "waitlist_continuation"
  | "callback_follow_on";
export type AppointmentFamilyPrimaryState337 =
  | "confirmed"
  | "pending"
  | "waiting"
  | "recovery";
export type AppointmentFamilyTone337 =
  | "family"
  | "local"
  | "network"
  | "waiting"
  | "recovery";
export type AppointmentManageResolutionKind337 =
  | "local_manage"
  | "network_manage"
  | "local_waitlist"
  | "network_choice"
  | "read_only";

export interface AppointmentFamilySummaryRow337 {
  readonly label: string;
  readonly value: string;
}

export interface AppointmentFamilyStatusProjection337 {
  readonly primaryLabel: string;
  readonly secondaryLabel: string;
  readonly state: AppointmentFamilyPrimaryState337;
  readonly tone: AppointmentFamilyTone337;
}

export interface AppointmentManageEntryResolution337 {
  readonly resolutionKind: AppointmentManageResolutionKind337;
  readonly actionLabel: string;
  readonly actionSummary: string;
  readonly routeRef: string | null;
  readonly routeFamilyRef:
    | "rf_patient_booking_manage"
    | "rf_patient_network_manage"
    | "rf_patient_network_choice"
    | "rf_patient_workspace_summary";
  readonly staleCtaSuppressed: boolean;
  readonly returnAnchorLabel: string;
}

export interface AppointmentFamilyTimelineRow337 {
  readonly timelineRowId: string;
  readonly label: string;
  readonly detail: string;
  readonly stateLabel: string;
  readonly tone: AppointmentFamilyTone337;
  readonly timeLabel: string;
}

export interface AppointmentFamilyFallbackProjection337 {
  readonly headline: string;
  readonly body: string;
  readonly tone: AppointmentFamilyTone337;
}

export interface AppointmentFamilyRow337 {
  readonly familyRef: string;
  readonly requestRef: string | null;
  readonly appointmentRef: string | null;
  readonly kind: AppointmentFamilyKind337;
  readonly truthSource: AppointmentFamilyTruthSource337;
  readonly authorityRef: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly summary: string;
  readonly status: AppointmentFamilyStatusProjection337;
  readonly nextSafeActionLabel: string;
  readonly selectedAnchorRef: string;
  readonly selectedAnchorTupleHash: string;
  readonly appointmentRows: readonly AppointmentFamilySummaryRow337[];
  readonly supportRows: readonly AppointmentFamilySummaryRow337[];
  readonly disclosureRows: readonly AppointmentFamilySummaryRow337[];
  readonly manageEntry: AppointmentManageEntryResolution337;
  readonly timelineRows: readonly AppointmentFamilyTimelineRow337[];
  readonly fallback: AppointmentFamilyFallbackProjection337 | null;
  readonly sourceScenarioRefs: readonly string[];
}

export interface HubLocalReturnAnchorReceiptProjection337 {
  readonly title: string;
  readonly body: string;
  readonly rows: readonly AppointmentFamilySummaryRow337[];
}

export interface PatientAppointmentFamilyWorkspaceProjection337 {
  readonly projectionName: "PatientAppointmentFamilyWorkspaceProjection337";
  readonly taskId: typeof PATIENT_APPOINTMENT_FAMILY_TASK_ID;
  readonly visualMode: typeof PATIENT_APPOINTMENT_FAMILY_VISUAL_MODE;
  readonly variant: AppointmentFamilyVariant337;
  readonly entrySource: AppointmentFamilyEntrySource337;
  readonly requestContextRef: string | null;
  readonly selectedFamilyRef: string;
  readonly selectedAnchorRef: string;
  readonly rows: readonly AppointmentFamilyRow337[];
  readonly selectedRow: AppointmentFamilyRow337;
  readonly headerRows: readonly AppointmentFamilySummaryRow337[];
  readonly returnReceipt: HubLocalReturnAnchorReceiptProjection337 | null;
}

export interface NetworkLocalContinuityBinderState337 {
  readonly projectionName: "NetworkLocalContinuityBinderState337";
  readonly selectedFamilyRef: string;
  readonly selectedAnchorRef: string;
  readonly selectedAnchorLabel: string;
  readonly entrySource: AppointmentFamilyEntrySource337;
  readonly requestContextRef: string | null;
  readonly childRouteRef: string;
  readonly returnTargetRef: string;
  readonly pendingReceipt: boolean;
  readonly recordedAt: string;
}

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function readSearch(search?: string): URLSearchParams {
  const raw = search ?? safeWindow()?.location.search ?? "";
  return new URLSearchParams(raw);
}

function familyTupleHash(seed: string): string {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `apt_family_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function requireCondition<T>(value: T | null | undefined, message: string): T {
  if (value == null) {
    throw new Error(message);
  }
  return value;
}

function bookingWaitlistEntry(bookingCaseId: string): PatientBookingWorkspaceEntryProjection {
  return requireCondition(
    resolvePatientBookingWorkspaceEntry({
      pathname: `/bookings/${bookingCaseId}/waitlist`,
      search: "?origin=appointments&returnRoute=/appointments",
      restoredBy: "query",
    }),
    `APPOINTMENT_FAMILY_WAITLIST_ENTRY_MISSING:${bookingCaseId}`,
  );
}

function bookingConfirmation(
  scenarioId: string,
): BookingConfirmationProjection {
  return requireCondition(
    resolveBookingConfirmationProjectionByScenarioId(scenarioId),
    `APPOINTMENT_FAMILY_LOCAL_CONFIRMATION_MISSING:${scenarioId}`,
  );
}

function localManage(
  scenarioId: string,
): PatientAppointmentManageProjection {
  return requireCondition(
    resolvePatientAppointmentManageProjectionByScenarioId(scenarioId),
    `APPOINTMENT_FAMILY_LOCAL_MANAGE_MISSING:${scenarioId}`,
  );
}

function networkManage(
  scenarioId: string,
): PatientNetworkManageProjection330 {
  return requireCondition(
    resolvePatientNetworkManageProjectionByScenarioId(
      scenarioId as NetworkManageScenarioId330,
    ),
    `APPOINTMENT_FAMILY_NETWORK_MANAGE_MISSING:${scenarioId}`,
  );
}

function networkConfirmation(
  scenarioId: string,
): PatientNetworkConfirmationProjection329 {
  return requireCondition(
    resolvePatientNetworkConfirmationProjectionByScenarioId(
      scenarioId as NetworkConfirmationScenarioId329,
    ),
    `APPOINTMENT_FAMILY_NETWORK_CONFIRMATION_MISSING:${scenarioId}`,
  );
}

function networkChoice(
  scenarioId: string,
): PatientNetworkAlternativeChoiceProjection {
  return requireCondition(
    resolvePatientNetworkAlternativeChoiceProjectionByScenarioId(scenarioId),
    `APPOINTMENT_FAMILY_NETWORK_CHOICE_MISSING:${scenarioId}`,
  );
}

function appendFamilyQuery(
  pathname: string,
  params: Record<string, string | null | undefined>,
): string {
  const url = new URL(pathname, "https://vecells.local");
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return `${url.pathname}${url.search}`;
}

function localManageRoute(
  bookingCaseId: string,
  familyRef: string,
  label: string,
): string {
  return appendFamilyQuery(`/bookings/${bookingCaseId}/manage`, {
    origin: "appointments",
    returnRoute: "/appointments",
    anchor: familyRef,
    anchorLabel: label,
    familyRef,
  });
}

function localWaitlistRoute(
  bookingCaseId: string,
  familyRef: string,
  label: string,
): string {
  return appendFamilyQuery(`/bookings/${bookingCaseId}/waitlist`, {
    origin: "appointments",
    returnRoute: "/appointments",
    anchor: familyRef,
    anchorLabel: label,
    familyRef,
  });
}

function networkManageRoute(scenarioId: string, familyRef: string): string {
  return appendFamilyQuery(
    resolvePatientNetworkManagePath(scenarioId as NetworkManageScenarioId330),
    {
      familyRef,
      entry: "appointments_list",
    },
  );
}

function networkChoiceRoute(scenarioId: string, familyRef: string): string {
  return appendFamilyQuery(`/bookings/network/${scenarioId}`, {
    familyRef,
    entry: "appointments_list",
  });
}

function localStatus(
  confirmation: BookingConfirmationProjection,
  manage: PatientAppointmentManageProjection,
): AppointmentFamilyStatusProjection337 {
  if (
    confirmation.confirmationTruthState === "confirmed" &&
    manage.manageExposureState === "writable"
  ) {
    return {
      primaryLabel: "Appointment confirmed",
      secondaryLabel: "Manage live",
      state: "confirmed",
      tone: "local",
    };
  }
  if (confirmation.confirmationTruthState === "confirmation_pending") {
    return {
      primaryLabel: "Confirmation pending",
      secondaryLabel: "Manage summary only",
      state: "pending",
      tone: "waiting",
    };
  }
  return {
    primaryLabel: "Recovery required",
    secondaryLabel: "Manage frozen",
    state: "recovery",
    tone: "recovery",
  };
}

function networkStatus(
  confirmation: PatientNetworkConfirmationProjection329,
  manage: PatientNetworkManageProjection330,
): AppointmentFamilyStatusProjection337 {
  if (confirmation.state === "calm_confirmed") {
    return {
      primaryLabel: "Appointment confirmed",
      secondaryLabel: confirmation.disclosureRows[1]?.label ?? "Practice informed",
      state: "confirmed",
      tone: "network",
    };
  }
  if (confirmation.state === "blocked") {
    return {
      primaryLabel: "Recovery required",
      secondaryLabel: "Manage frozen",
      state: "recovery",
      tone: "recovery",
    };
  }
  return {
    primaryLabel: "Confirmation pending",
    secondaryLabel: "Manage summary only",
    state: "pending",
    tone: "waiting",
  };
}

function waitlistStatus(
  entry: PatientBookingWorkspaceEntryProjection,
): AppointmentFamilyStatusProjection337 {
  return entry.workspace.caseStatus === "waitlisted" &&
    entry.workspace.capabilityProjection.surfaceState === "degraded_manual"
    ? {
        primaryLabel: "Fallback due",
        secondaryLabel: "Callback now safer",
        state: "recovery",
        tone: "waiting",
      }
    : {
        primaryLabel: "Waitlist active",
        secondaryLabel: "Local monitoring continues",
        state: "waiting",
        tone: "waiting",
      };
}

function choiceStatus(
  projection: PatientNetworkAlternativeChoiceProjection,
): AppointmentFamilyStatusProjection337 {
  if (projection.truthProjection.offerActionabilityState === "live_open_choice") {
    return {
      primaryLabel: "Choice set visible",
      secondaryLabel: "Callback fallback available",
      state: "waiting",
      tone: "network",
    };
  }
  return {
    primaryLabel: "Recovery required",
    secondaryLabel: "Choice set held as provenance",
    state: "recovery",
    tone: "recovery",
  };
}

export function AppointmentManageEntryResolver(input: {
  readonly kind: AppointmentFamilyKind337;
  readonly familyRef: string;
  readonly title: string;
  readonly variant: AppointmentFamilyVariant337;
}): AppointmentManageEntryResolution337 {
  switch (input.kind) {
    case "local_appointment":
      if (input.variant === "pending") {
        return {
          resolutionKind: "read_only",
          actionLabel: "Review current status",
          actionSummary:
            "This local appointment keeps the same family slot, but writable manage stays frozen until local confirmation truth settles again.",
          routeRef: localManageRoute("booking_case_297_confirmation_pending", input.familyRef, input.title),
          routeFamilyRef: "rf_patient_booking_manage",
          staleCtaSuppressed: true,
          returnAnchorLabel: input.title,
        };
      }
      return {
        resolutionKind: "local_manage",
        actionLabel: "Open local manage",
        actionSummary:
          "Use the local manage route because current booking confirmation truth is confirmed and continuity remains current.",
        routeRef: localManageRoute("booking_case_297_ready", input.familyRef, input.title),
        routeFamilyRef: "rf_patient_booking_manage",
        staleCtaSuppressed: false,
        returnAnchorLabel: input.title,
      };
    case "network_appointment":
      if (input.variant === "pending") {
        return {
          resolutionKind: "read_only",
          actionLabel: "Review network status",
          actionSummary:
            "Network calmness stays suppressed while confirmation truth or continuity remain provisional, so this opens the read-only network manage route instead of a writable CTA.",
          routeRef: networkManageRoute("network_manage_330_read_only", input.familyRef),
          routeFamilyRef: "rf_patient_network_manage",
          staleCtaSuppressed: true,
          returnAnchorLabel: input.title,
        };
      }
      return {
        resolutionKind: "network_manage",
        actionLabel: "Open network manage",
        actionSummary:
          "Use the network manage route because the hub-managed appointment is the current authority for reminder, callback, and settlement posture.",
        routeRef: networkManageRoute("network_manage_330_live", input.familyRef),
        routeFamilyRef: "rf_patient_network_manage",
        staleCtaSuppressed: false,
        returnAnchorLabel: input.title,
      };
    case "waitlist_continuation":
      return {
        resolutionKind: "network_choice",
        actionLabel: "Open callback recovery",
        actionSummary:
          "Do not reopen stale local waitlist controls. The safe next step is the linked hub-managed follow-on route where callback and network recovery stay explicit.",
        routeRef: networkChoiceRoute("offer_session_328_live", input.familyRef),
        routeFamilyRef: "rf_patient_network_choice",
        staleCtaSuppressed: true,
        returnAnchorLabel: input.title,
      };
    case "callback_follow_on":
      return {
        resolutionKind: "network_choice",
        actionLabel: "Open current choice set",
        actionSummary:
          "This follow-on family resolves through the network choice route because callback fallback and open-choice provenance still belong to hub truth.",
        routeRef: networkChoiceRoute("offer_session_328_live", input.familyRef),
        routeFamilyRef: "rf_patient_network_choice",
        staleCtaSuppressed: false,
        returnAnchorLabel: input.title,
      };
    default:
      return {
        resolutionKind: "read_only",
        actionLabel: "Review current status",
        actionSummary: "Review the current status in place.",
        routeRef: null,
        routeFamilyRef: "rf_patient_workspace_summary",
        staleCtaSuppressed: true,
        returnAnchorLabel: input.title,
      };
  }
}

function localAppointmentRow(
  variant: AppointmentFamilyVariant337,
): AppointmentFamilyRow337 {
  const confirmation = bookingConfirmation(
    variant === "pending" ? "booking_case_296_pending" : "booking_case_296_confirmed",
  );
  const manage = localManage(
    variant === "pending" ? "booking_case_297_confirmation_pending" : "booking_case_297_ready",
  );
  const title = "Local dermatology follow-up";
  const familyRef = "family_local_confirmed";

  return {
    familyRef,
    requestRef: "request_211_a",
    appointmentRef: manage.appointmentId,
    kind: "local_appointment",
    truthSource: "BookingConfirmationTruthProjection",
    authorityRef: confirmation.projectionName,
    title,
    eyebrow: "Local appointment",
    summary:
      variant === "pending"
        ? "The appointment remains in the family list, but the row stays provisional while local confirmation truth is not final."
        : "The appointment keeps the familiar local manage grammar, but it now sits beside hub-managed work with the same family wording.",
    status: localStatus(confirmation, manage),
    nextSafeActionLabel:
      variant === "pending" ? "Review current status" : "Open local manage",
    selectedAnchorRef: familyRef,
    selectedAnchorTupleHash: familyTupleHash(`${familyRef}:${confirmation.confirmationTruthState}`),
    appointmentRows: manage.appointmentRows.slice(0, 4),
    supportRows: manage.reminderPanel.preferenceRows.slice(0, 2),
    disclosureRows: [
      { label: "Truth source", value: confirmation.projectionName },
      { label: "Manage exposure", value: manage.manageExposureState.replaceAll("_", " ") },
      { label: "Reminder posture", value: manage.reminderExposureState.replaceAll("_", " ") },
    ],
    manageEntry: AppointmentManageEntryResolver({
      kind: "local_appointment",
      familyRef,
      title,
      variant,
    }),
    timelineRows: [
      {
        timelineRowId: `${familyRef}-booking-truth`,
        label: "Booking truth",
        detail: confirmation.ribbonDetail,
        stateLabel: confirmation.ribbonLabel,
        tone: confirmation.confirmationTruthState === "confirmed" ? "local" : "waiting",
        timeLabel: confirmation.referenceNowLabel,
      },
      {
        timelineRowId: `${familyRef}-manage`,
        label: "Manage posture",
        detail: manage.stateBody,
        stateLabel: manage.manageExposureState.replaceAll("_", " "),
        tone: manage.manageExposureState === "writable" ? "local" : "waiting",
        timeLabel: "Current",
      },
      {
        timelineRowId: `${familyRef}-reminder`,
        label: "Reminder posture",
        detail: manage.reminderPanel.body,
        stateLabel: manage.reminderExposureState.replaceAll("_", " "),
        tone: manage.reminderExposureState === "scheduled" ? "family" : "waiting",
        timeLabel: "Current",
      },
    ],
    fallback: null,
    sourceScenarioRefs: [confirmation.scenarioId, manage.scenarioId],
  };
}

function networkAppointmentRow(
  variant: AppointmentFamilyVariant337,
): AppointmentFamilyRow337 {
  const confirmation = networkConfirmation(
    variant === "pending"
      ? "network_confirmation_329_pending"
      : "network_confirmation_329_practice_informed",
  );
  const manage = networkManage(
    variant === "pending" ? "network_manage_330_read_only" : "network_manage_330_live",
  );
  const title = "Network access hub review";
  const familyRef = "family_network_live";

  return {
    familyRef,
    requestRef: "request_211_a",
    appointmentRef: manage.appointmentRef,
    kind: "network_appointment",
    truthSource: "HubOfferToConfirmationTruthProjection",
    authorityRef: "HubOfferToConfirmationTruthProjection",
    title,
    eyebrow: "Network-managed appointment",
    summary:
      variant === "pending"
        ? "The hub-managed appointment stays visible, but the row must remain provisional while confirmation truth and manage continuity are still guarded."
        : "The hub-managed appointment uses the same confirmed wording as local work, with practice-informed detail kept as secondary disclosure.",
    status: networkStatus(confirmation, manage),
    nextSafeActionLabel:
      variant === "pending" ? "Review network status" : "Open network manage",
    selectedAnchorRef: familyRef,
    selectedAnchorTupleHash: familyTupleHash(`${familyRef}:${confirmation.state}`),
    appointmentRows: confirmation.appointmentRows,
    supportRows: manage.statusRows.slice(0, 3),
    disclosureRows: confirmation.disclosureRows.map((row) => ({
      label: row.label,
      value: row.value,
    })),
    manageEntry: AppointmentManageEntryResolver({
      kind: "network_appointment",
      familyRef,
      title,
      variant,
    }),
    timelineRows: manage.timelineClusters.flatMap((cluster) =>
      cluster.rows.map((row) => ({
        timelineRowId: row.rowId,
        label: row.title,
        detail: row.detail,
        stateLabel: row.stateLabel,
        tone:
          row.tone === "blocked"
            ? "recovery"
            : row.tone === "callback"
              ? "network"
              : row.tone === "warning"
                ? "waiting"
                : "network",
        timeLabel: row.timeLabel,
      })),
    ),
    fallback:
      manage.timelineClusters.flatMap((cluster) => cluster.rows).find((row) => row.rowKind === "callback_fallback")
        ? {
            headline: "Callback fallback stays separate",
            body: "Callback remains a governed secondary path inside the same appointment family instead of being merged into confirmed wording.",
            tone: "network",
          }
        : null,
    sourceScenarioRefs: [confirmation.scenarioId, manage.scenarioId],
  };
}

function waitlistRow(): AppointmentFamilyRow337 {
  const entry = bookingWaitlistEntry("booking_case_298_fallback_due");
  const title = "Local waitlist continuation";
  const familyRef = "family_waitlist_fallback_due";

  return {
    familyRef,
    requestRef: "request_211_a",
    appointmentRef: null,
    kind: "waitlist_continuation",
    truthSource: "BookingConfirmationTruthProjection",
    authorityRef: "BookingConfirmationTruthProjection",
    title,
    eyebrow: "Local waitlist",
    summary:
      "The local waitlist keeps its current need and preference summary visible, but calm appointment wording stays suppressed because hub recovery is now the next safe step.",
    status: waitlistStatus(entry),
    nextSafeActionLabel: "Open callback recovery",
    selectedAnchorRef: familyRef,
    selectedAnchorTupleHash: familyTupleHash(`${familyRef}:${entry.workspace.caseStatus}`),
    appointmentRows: entry.workspace.needRows,
    supportRows: entry.workspace.preferenceSummary,
    disclosureRows: entry.workspace.preferenceDisclosure,
    manageEntry: AppointmentManageEntryResolver({
      kind: "waitlist_continuation",
      familyRef,
      title,
      variant: "default",
    }),
    timelineRows: [
      {
        timelineRowId: `${familyRef}-waitlist`,
        label: "Waitlist posture",
        detail: entry.stageCopy,
        stateLabel: entry.workspace.needRows[1]?.value ?? "Waiting",
        tone: "waiting",
        timeLabel: "Current",
      },
      {
        timelineRowId: `${familyRef}-fallback`,
        label: "Fallback debt",
        detail: entry.workspace.provenanceCard?.summary ?? entry.workspace.supportPath.copy,
        stateLabel: "Callback now safer",
        tone: "recovery",
        timeLabel: "Current",
      },
      {
        timelineRowId: `${familyRef}-continuity`,
        label: "Continuity",
        detail:
          "The selected need, preferences, and family anchor remain preserved while the next safe route changes from local waiting to hub-managed follow-on work.",
        stateLabel: entry.workspace.continuityEvidence.continuityState.replaceAll("_", " "),
        tone: "family",
        timeLabel: "Current",
      },
    ],
    fallback: {
      headline: "Fallback is now the governing path",
      body:
        entry.workspace.provenanceCard?.summary ??
        "The family preserves local waitlist provenance, but current truth requires hub-managed callback follow-on instead of another local waitlist CTA.",
      tone: "recovery",
    },
    sourceScenarioRefs: [entry.workspace.bookingCaseId],
  };
}

function callbackRow(): AppointmentFamilyRow337 {
  const choice = networkChoice("offer_session_328_live");
  const title = "Callback-safe network follow-on";
  const familyRef = "family_callback_follow_on";

  return {
    familyRef,
    requestRef: "request_211_a",
    appointmentRef: null,
    kind: "callback_follow_on",
    truthSource: "HubOfferToConfirmationTruthProjection",
    authorityRef: "HubOfferToConfirmationTruthProjection",
    title,
    eyebrow: "Hub follow-on",
    summary:
      "The hub follow-on route keeps open choice and callback fallback together so a callback-safe next step does not masquerade as a confirmed appointment.",
    status: choiceStatus(choice),
    nextSafeActionLabel: "Open current choice set",
    selectedAnchorRef: familyRef,
    selectedAnchorTupleHash: familyTupleHash(`${familyRef}:${choice.truthProjection.offerState}`),
    appointmentRows: choice.heroRows,
    supportRows: choice.serviceRows,
    disclosureRows: [
      { label: "Offer actionability", value: choice.truthProjection.offerActionabilityState.replaceAll("_", " ") },
      { label: "Fallback linkage", value: choice.truthProjection.fallbackLinkState.replaceAll("_", " ") },
      { label: "Choice posture", value: choice.session.patientChoiceState.replaceAll("_", " ") },
    ],
    manageEntry: AppointmentManageEntryResolver({
      kind: "callback_follow_on",
      familyRef,
      title,
      variant: "default",
    }),
    timelineRows: [
      {
        timelineRowId: `${familyRef}-offer`,
        label: "Choice visibility",
        detail: choice.heroBody,
        stateLabel: choice.truthProjection.offerState.replaceAll("_", " "),
        tone: "network",
        timeLabel: "Current",
      },
      {
        timelineRowId: `${familyRef}-callback`,
        label: "Callback fallback",
        detail: choice.callbackFallbackCard.body,
        stateLabel: choice.callbackFallbackCard.eligibilityState.replaceAll("_", " "),
        tone:
          choice.callbackFallbackCard.eligibilityState === "visible" ? "network" : "recovery",
        timeLabel: "Current",
      },
      {
        timelineRowId: `${familyRef}-provenance`,
        label: "Truth tuple",
        detail:
          "The follow-on route stays bound to hub truth and keeps the last safe option set visible if publication or subject binding drifts.",
        stateLabel: choice.truthProjection.confirmationTruthState.replaceAll("_", " "),
        tone: "family",
        timeLabel: "Current",
      },
    ],
    fallback: {
      headline: "Callback stays explicit",
      body:
        "Callback fallback remains a governed second path, not a hidden side effect of the network choice card.",
      tone: "network",
    },
    sourceScenarioRefs: [choice.scenarioId],
  };
}

function rowsForVariant(
  variant: AppointmentFamilyVariant337,
): readonly AppointmentFamilyRow337[] {
  return [
    localAppointmentRow(variant),
    networkAppointmentRow(variant),
    waitlistRow(),
    callbackRow(),
  ];
}

function receiptFromBinder(
  binder: NetworkLocalContinuityBinderState337 | null,
): HubLocalReturnAnchorReceiptProjection337 | null {
  if (!binder?.pendingReceipt) {
    return null;
  }
  return {
    title: "Returned with family anchor preserved",
    body:
      "The selected appointment family, source route, and downstream return target stayed bound while local and hub-managed routes switched underneath.",
    rows: [
      { label: "Selected family", value: binder.selectedAnchorLabel },
      { label: "Source", value: binder.entrySource.replaceAll("_", " ") },
      { label: "Child route", value: binder.childRouteRef },
      { label: "Return target", value: binder.returnTargetRef },
    ],
  };
}

export function readNetworkLocalContinuityBinder(): NetworkLocalContinuityBinderState337 | null {
  const ownerWindow = safeWindow();
  const raw = ownerWindow?.sessionStorage.getItem(APPOINTMENT_FAMILY_BINDER_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as NetworkLocalContinuityBinderState337;
    return parsed.projectionName === "NetworkLocalContinuityBinderState337" ? parsed : null;
  } catch {
    return null;
  }
}

export function NetworkLocalContinuityBinder(
  state:
    | (Omit<NetworkLocalContinuityBinderState337, "projectionName"> & {
        readonly projectionName?: NetworkLocalContinuityBinderState337["projectionName"];
      })
    | null,
): NetworkLocalContinuityBinderState337 | null {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return null;
  }
  if (!state) {
    ownerWindow.sessionStorage.removeItem(APPOINTMENT_FAMILY_BINDER_STORAGE_KEY);
    return null;
  }
  const binder: NetworkLocalContinuityBinderState337 = {
    projectionName: "NetworkLocalContinuityBinderState337",
    ...state,
  };
  ownerWindow.sessionStorage.setItem(
    APPOINTMENT_FAMILY_BINDER_STORAGE_KEY,
    JSON.stringify(binder),
  );
  return binder;
}

export function clearNetworkLocalContinuityBinderReceipt(): void {
  const existing = readNetworkLocalContinuityBinder();
  if (!existing) {
    return;
  }
  NetworkLocalContinuityBinder({ ...existing, pendingReceipt: false });
}

export function resolveAppointmentFamilyWorkspaceSearch(input?: {
  readonly search?: string;
  readonly requestContextRef?: string | null;
  readonly entrySource?: AppointmentFamilyEntrySource337;
  readonly selectedFamilyRef?: string | null;
  readonly variant?: AppointmentFamilyVariant337;
}): PatientAppointmentFamilyWorkspaceProjection337 {
  const params = readSearch(input?.search);
  const binder = readNetworkLocalContinuityBinder();
  const variant = (input?.variant ??
    (params.get("variant") as AppointmentFamilyVariant337 | null) ??
    "default") as AppointmentFamilyVariant337;
  const entrySource = (input?.entrySource ??
    (params.get("entry") as AppointmentFamilyEntrySource337 | null) ??
    binder?.entrySource ??
    "appointments_list") as AppointmentFamilyEntrySource337;
  const rows = rowsForVariant(variant);
  const selectedFamilyRef =
    input?.selectedFamilyRef ??
    params.get("family") ??
    binder?.selectedFamilyRef ??
    rows[0]?.familyRef ??
    "family_local_confirmed";
  const selectedRow =
    rows.find((row) => row.familyRef === selectedFamilyRef) ?? requireCondition(rows[0], "APPOINTMENT_FAMILY_ROWS_EMPTY");
  const requestContextRef =
    input?.requestContextRef ?? params.get("request") ?? binder?.requestContextRef ?? null;

  return {
    projectionName: "PatientAppointmentFamilyWorkspaceProjection337",
    taskId: PATIENT_APPOINTMENT_FAMILY_TASK_ID,
    visualMode: PATIENT_APPOINTMENT_FAMILY_VISUAL_MODE,
    variant,
    entrySource,
    requestContextRef,
    selectedFamilyRef: selectedRow.familyRef,
    selectedAnchorRef: selectedRow.selectedAnchorRef,
    rows,
    selectedRow,
    headerRows: [
      { label: "Family wording", value: "Equivalent truths share equivalent labels" },
      { label: "Current authority", value: selectedRow.truthSource },
      { label: "Entry source", value: entrySource.replaceAll("_", " ") },
    ],
    returnReceipt: receiptFromBinder(binder),
  };
}

export function UnifiedAppointmentFamilyResolver(input?: {
  readonly search?: string;
  readonly requestContextRef?: string | null;
  readonly entrySource?: AppointmentFamilyEntrySource337;
  readonly selectedFamilyRef?: string | null;
  readonly variant?: AppointmentFamilyVariant337;
}): PatientAppointmentFamilyWorkspaceProjection337 {
  return resolveAppointmentFamilyWorkspaceSearch(input);
}

export function appointmentsWorkspaceHref337(input: {
  readonly familyRef?: string | null;
  readonly entrySource?: AppointmentFamilyEntrySource337;
  readonly requestContextRef?: string | null;
  readonly variant?: AppointmentFamilyVariant337;
}): string {
  return appendFamilyQuery("/appointments", {
    family: input.familyRef ?? null,
    entry: input.entrySource ?? null,
    request: input.requestContextRef ?? null,
    variant: input.variant ?? null,
  });
}

export function appointmentFamilyStateMatrix337(): Array<Record<string, string>> {
  return (["default", "pending"] as const).flatMap((variant) =>
    rowsForVariant(variant).map((row) => ({
      variant,
      family_ref: row.familyRef,
      kind: row.kind,
      truth_source: row.truthSource,
      primary_status: row.status.primaryLabel,
      secondary_status: row.status.secondaryLabel,
      manage_resolution: row.manageEntry.resolutionKind,
      manage_route: row.manageEntry.routeRef ?? "none",
      stale_cta_suppressed: String(row.manageEntry.staleCtaSuppressed),
      next_safe_action: row.nextSafeActionLabel,
    })),
  );
}
