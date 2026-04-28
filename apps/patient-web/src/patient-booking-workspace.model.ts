export const PATIENT_BOOKING_WORKSPACE_TASK_ID =
  "par_293_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_appointment_scheduling_workspace";
export const PATIENT_BOOKING_WORKSPACE_VISUAL_MODE = "Appointment_Scheduling_Workspace";

export type BookingArtifactRouteSource = "confirm" | "manage";
export type BookingArtifactRouteMode =
  | "receipt"
  | "calendar"
  | "print"
  | "directions"
  | "browser_handoff";
export type PatientBookingWorkspaceRouteKey =
  | "workspace"
  | "select"
  | "confirm"
  | "manage"
  | "waitlist"
  | "artifacts";
export type BookingWorkspaceShellState =
  | "ready"
  | "loading"
  | "partial"
  | "read_only"
  | "recovery_required"
  | "settled";
export type BookingWorkspaceContinuationState =
  | "preserved"
  | "read_only"
  | "recovery_required";
export type BookingWorkspacePublicationState = "published" | "frozen" | "withdrawn";
export type BookingWorkspaceEmbeddedState = "none" | "active" | "drifted";
export type BookingWorkspaceOriginKey =
  | "home"
  | "requests"
  | "appointments"
  | "record_origin"
  | "recovery"
  | "secure_link";
export type BookingWorkspaceRouteRef =
  | "/home"
  | "/requests"
  | "/appointments"
  | "/records"
  | "/recovery/secure-link"
  | `/requests/${string}`
  | `/records/results/${string}`
  | `/records/documents/${string}`
  | `/bookings/${string}`;
export type BookingWorkspaceCaseStatus =
  | "handoff_received"
  | "capability_checked"
  | "searching_local"
  | "offers_ready"
  | "selecting"
  | "revalidating"
  | "commit_pending"
  | "confirmation_pending"
  | "supplier_reconciliation_pending"
  | "managed"
  | "closed"
  | "booking_failed"
  | "waitlisted";
export type BookingWorkspaceSurfaceState =
  | "self_service_live"
  | "assisted_only"
  | "linkage_required"
  | "local_component_required"
  | "degraded_manual"
  | "recovery_required"
  | "blocked";
export type BookingWorkspaceControlState = "writable" | "read_only" | "blocked";
export type BookingWorkspaceActionScope =
  | "search_slots"
  | "book_slot"
  | "view_booking_summary"
  | "repair_gp_linkage"
  | "launch_local_component"
  | "request_staff_assist"
  | "fallback_contact_practice_support"
  | "fallback_continue_read_only"
  | "fallback_wait_for_confirmation"
  | "refresh_booking_continuity";
export type BookingNotificationEntryState =
  | "none"
  | "handoff_active"
  | "confirmation_pending"
  | "confirmed"
  | "reopened";

export interface BookingWorkspaceNeedRow {
  readonly label: string;
  readonly value: string;
}

export interface BookingWorkspaceWindowNode {
  readonly label: string;
  readonly value: string;
  readonly tone: "neutral" | "primary" | "safe" | "warn" | "blocked";
}

export interface BookingWorkspacePreferenceItem {
  readonly label: string;
  readonly value: string;
}

export interface BookingWorkspaceSupportPath {
  readonly label: string;
  readonly copy: string;
  readonly actionLabel: string;
  readonly actionRef: BookingWorkspaceActionScope;
}

export interface BookingNotificationEntryProjection {
  readonly state: Exclude<BookingNotificationEntryState, "none">;
  readonly title: string;
  readonly body: string;
  readonly channelLabel: string;
}

export interface BookingWorkspaceDominantAction {
  readonly actionRef: BookingWorkspaceActionScope;
  readonly label: string;
  readonly body: string;
  readonly targetRouteRef: string | null;
}

export interface PatientBookingReturnContract {
  readonly projectionName: "PatientNavReturnContract";
  readonly contractRef: string;
  readonly originKey: BookingWorkspaceOriginKey;
  readonly originRouteRef: BookingWorkspaceRouteRef;
  readonly returnRouteRef: BookingWorkspaceRouteRef;
  readonly originLabel: string;
  readonly selectedEntityRef: string | null;
  readonly selectedCandidateRef: string | null;
  readonly selectedAnchorRef: string;
  readonly selectedAnchorLabel: string;
  readonly tupleHash: string;
  readonly continuityState: "preserved" | "quiet" | "recovery_only" | "blocked";
}

export interface PatientPortalContinuityEvidenceBundle293 {
  readonly projectionName: "PatientPortalContinuityEvidenceBundle";
  readonly continuityEvidenceRef: string;
  readonly shellContinuityKey: string;
  readonly continuityState: BookingWorkspaceContinuationState;
  readonly routePublicationState: BookingWorkspacePublicationState;
  readonly embeddedSessionState: BookingWorkspaceEmbeddedState;
  readonly selectedAnchorRef: string;
  readonly selectedAnchorLabel: string;
  readonly selectedAnchorTupleHash: string;
  readonly publicationReason: string | null;
  readonly provenanceActionability: "writable" | "read_only";
}

export interface BookingCapabilityProjection293 {
  readonly projectionName: "BookingCapabilityProjection";
  readonly bookingCapabilityProjectionId: string;
  readonly schemaVersion: "279.phase4.booking-capability-freeze.v1";
  readonly bookingCaseId: string;
  readonly appointmentId: string | null;
  readonly bookingCapabilityResolutionRef: string;
  readonly selectionAudience: "patient";
  readonly requestedActionScope: "search_slots";
  readonly providerAdapterBindingRef: string;
  readonly capabilityTupleHash: string;
  readonly surfaceState: BookingWorkspaceSurfaceState;
  readonly dominantCapabilityCueCode: string;
  readonly controlState: BookingWorkspaceControlState;
  readonly selfServiceActionRefs: readonly BookingWorkspaceActionScope[];
  readonly assistedActionRefs: readonly BookingWorkspaceActionScope[];
  readonly manageActionRefs: readonly BookingWorkspaceActionScope[];
  readonly fallbackActionRefs: readonly BookingWorkspaceActionScope[];
  readonly blockedActionReasonCodes: readonly string[];
  readonly exposedActionScopes: readonly BookingWorkspaceActionScope[];
  readonly parityGroupId: string;
  readonly underlyingCapabilityState:
    | "live_self_service"
    | "assisted_only"
    | "linkage_required"
    | "local_component_required"
    | "degraded_manual"
    | "recovery_only"
    | "blocked";
  readonly renderedAt: string;
  readonly dominantAction: BookingWorkspaceDominantAction;
}

export interface BookingWorkspaceProvenanceCard {
  readonly title: string;
  readonly summary: string;
  readonly meta: string;
}

export interface PatientAppointmentWorkspaceProjection293 {
  readonly projectionName: "PatientAppointmentWorkspaceProjection";
  readonly bookingCaseId: string;
  readonly caseStatus: BookingWorkspaceCaseStatus;
  readonly shellState: BookingWorkspaceShellState;
  readonly patientLabel: string;
  readonly heading: string;
  readonly subheading: string;
  readonly serviceLine: string;
  readonly needRows: readonly BookingWorkspaceNeedRow[];
  readonly needWindow: readonly BookingWorkspaceWindowNode[];
  readonly preferenceSummary: readonly BookingWorkspacePreferenceItem[];
  readonly preferenceDisclosure: readonly BookingWorkspacePreferenceItem[];
  readonly capabilityProjection: BookingCapabilityProjection293;
  readonly continuityEvidence: PatientPortalContinuityEvidenceBundle293;
  readonly returnContract: PatientBookingReturnContract;
  readonly notificationEntry: BookingNotificationEntryProjection | null;
  readonly supportPath: BookingWorkspaceSupportPath;
  readonly provenanceCard: BookingWorkspaceProvenanceCard | null;
  readonly childSurfaceRefs: readonly [
    "slot_results_host",
    "truthful_selection_host",
    "confirmation_host",
    "manage_host",
    "waitlist_host",
    "artifact_host",
  ];
  readonly computedAt: string;
}

export interface BookingWorkspaceRestoreBundle293 {
  readonly projectionName: "BookingWorkspaceRestoreBundle293";
  readonly bookingCaseId: string;
  readonly routeKey: PatientBookingWorkspaceRouteKey;
  readonly pathname: string;
  readonly selectedAnchorRef: string;
  readonly selectedAnchorLabel: string;
  readonly returnContract: PatientBookingReturnContract;
  readonly shellContinuityKey: string;
  readonly scrollStateRef: string | null;
  readonly restoredBy: "query" | "soft_navigation" | "browser_back" | "refresh_replay";
}

export interface PatientBookingWorkspaceEntryProjection {
  readonly routeKey: PatientBookingWorkspaceRouteKey;
  readonly pathname: string;
  readonly workspace: PatientAppointmentWorkspaceProjection293;
  readonly restoreBundle: BookingWorkspaceRestoreBundle293;
  readonly artifactSource: BookingArtifactRouteSource | null;
  readonly artifactMode: BookingArtifactRouteMode | null;
  readonly notificationState: BookingNotificationEntryState;
  readonly stageHeading: string;
  readonly stageCopy: string;
  readonly stageStateLabel: string;
}

function hexHash(input: string): string {
  const raw = Array.from(input)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
  return (raw + "0".repeat(64)).slice(0, 64);
}

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

function routeRefFor(
  bookingCaseId: string,
  routeKey: PatientBookingWorkspaceRouteKey,
): `/bookings/${string}` {
  if (routeKey === "workspace") {
    return `/bookings/${bookingCaseId}`;
  }
  return `/bookings/${bookingCaseId}/${routeKey}`;
}

function resolveArtifactSource(
  bookingCaseId: string,
  value: string | null,
): BookingArtifactRouteSource {
  if (value === "confirm" || value === "manage") {
    return value;
  }
  return bookingCaseId.startsWith("booking_case_297") ? "manage" : "confirm";
}

function resolveArtifactMode(value: string | null): BookingArtifactRouteMode {
  switch (value) {
    case "calendar":
    case "print":
    case "directions":
    case "browser_handoff":
      return value;
    case "receipt":
    default:
      return "receipt";
  }
}

function parseOriginRoute(
  returnRoute: string | null | undefined,
  originKey: BookingWorkspaceOriginKey,
): BookingWorkspaceRouteRef {
  if (returnRoute === "/recovery/secure-link") {
    return returnRoute;
  }
  if (returnRoute?.startsWith("/requests/")) {
    return returnRoute as `/requests/${string}`;
  }
  if (returnRoute?.startsWith("/records/results/")) {
    return returnRoute as `/records/results/${string}`;
  }
  if (returnRoute?.startsWith("/records/documents/")) {
    return returnRoute as `/records/documents/${string}`;
  }
  if (
    returnRoute === "/home" ||
    returnRoute === "/requests" ||
    returnRoute === "/appointments" ||
    returnRoute === "/records"
  ) {
    return returnRoute;
  }
  switch (originKey) {
    case "home":
      return "/home";
    case "requests":
      return "/requests";
    case "record_origin":
      return "/records";
    case "secure_link":
      return "/recovery/secure-link";
    case "recovery":
      return "/home";
    case "appointments":
    default:
      return "/appointments";
  }
}

function originLabelFor(originKey: BookingWorkspaceOriginKey, routeRef: BookingWorkspaceRouteRef): string {
  if (routeRef === "/recovery/secure-link") {
    return "Secure link";
  }
  if (routeRef.startsWith("/requests/")) {
    return "Request detail";
  }
  if (routeRef.startsWith("/records/results/") || routeRef.startsWith("/records/documents/")) {
    return "Record follow-up";
  }
  switch (originKey) {
    case "home":
      return "Home";
    case "requests":
      return "Requests";
    case "record_origin":
      return "Record follow-up";
    case "secure_link":
      return "Secure link";
    case "recovery":
      return "Recovery route";
    case "appointments":
    default:
      return "Appointments";
  }
}

function defaultAnchorFor(originKey: BookingWorkspaceOriginKey, routeRef: BookingWorkspaceRouteRef): string {
  if (routeRef === "/recovery/secure-link") {
    return "secure-link-booking-resume";
  }
  if (routeRef.startsWith("/requests/")) {
    return "request-booking-launch";
  }
  if (routeRef.startsWith("/records/")) {
    return "record-origin-booking-launch";
  }
  switch (originKey) {
    case "home":
      return "home-booking-launch";
    case "requests":
      return "requests-booking-launch";
    case "record_origin":
      return "record-origin-booking-launch";
    case "secure_link":
      return "secure-link-booking-resume";
    case "recovery":
      return "recovery-booking-anchor";
    case "appointments":
    default:
      return "appointments-upcoming";
  }
}

function defaultAnchorLabelFor(originKey: BookingWorkspaceOriginKey, routeRef: BookingWorkspaceRouteRef): string {
  if (routeRef === "/recovery/secure-link") {
    return "Secure link booking resume";
  }
  if (routeRef.startsWith("/requests/")) {
    return "Request detail action";
  }
  if (routeRef.startsWith("/records/")) {
    return "Record follow-up action";
  }
  switch (originKey) {
    case "home":
      return "Home next action";
    case "requests":
      return "Requests list";
    case "record_origin":
      return "Record follow-up action";
    case "secure_link":
      return "Secure link booking resume";
    case "recovery":
      return "Recovery re-entry";
    case "appointments":
    default:
      return "Appointments summary";
  }
}

function buildReturnContract(input: {
  bookingCaseId: string;
  originKey: BookingWorkspaceOriginKey;
  returnRouteRef?: string | null;
  selectedAnchorRef?: string | null;
  selectedAnchorLabel?: string | null;
  selectedEntityRef?: string | null;
  continuityState?: PatientBookingReturnContract["continuityState"];
}): PatientBookingReturnContract {
  const routeRef = parseOriginRoute(input.returnRouteRef, input.originKey);
  const selectedAnchorRef = input.selectedAnchorRef ?? defaultAnchorFor(input.originKey, routeRef);
  const selectedAnchorLabel =
    input.selectedAnchorLabel ?? defaultAnchorLabelFor(input.originKey, routeRef);
  return {
    projectionName: "PatientNavReturnContract",
    contractRef: `return_${input.bookingCaseId}_${input.originKey}`,
    originKey: input.originKey,
    originRouteRef: routeRef,
    returnRouteRef: routeRef,
    originLabel: originLabelFor(input.originKey, routeRef),
    selectedEntityRef: input.selectedEntityRef ?? input.bookingCaseId,
    selectedCandidateRef: null,
    selectedAnchorRef,
    selectedAnchorLabel,
    tupleHash: hexHash(`${input.bookingCaseId}:${routeRef}:${selectedAnchorRef}`),
    continuityState: input.continuityState ?? "preserved",
  };
}

function capabilityActions(
  bookingCaseId: string,
  surfaceState: BookingWorkspaceSurfaceState,
): BookingCapabilityProjection293 {
  const base = {
    projectionName: "BookingCapabilityProjection" as const,
    bookingCapabilityProjectionId: `cap_${bookingCaseId}`,
    schemaVersion: "279.phase4.booking-capability-freeze.v1" as const,
    bookingCaseId,
    appointmentId: null,
    bookingCapabilityResolutionRef: `resolution_${bookingCaseId}`,
    selectionAudience: "patient" as const,
    requestedActionScope: "search_slots" as const,
    providerAdapterBindingRef: `binding_${bookingCaseId}`,
    capabilityTupleHash: hexHash(`${bookingCaseId}:${surfaceState}`),
    parityGroupId: `parity_${bookingCaseId}`,
    renderedAt: "2026-04-19T08:30:00Z",
  };

  switch (surfaceState) {
    case "self_service_live":
      return {
        ...base,
        surfaceState,
        dominantCapabilityCueCode: "cue_self_service_live",
        controlState: "writable",
        selfServiceActionRefs: ["search_slots", "book_slot", "view_booking_summary"],
        assistedActionRefs: ["request_staff_assist"],
        manageActionRefs: [],
        fallbackActionRefs: ["request_staff_assist"],
        blockedActionReasonCodes: [],
        exposedActionScopes: ["search_slots", "book_slot", "view_booking_summary"],
        underlyingCapabilityState: "live_self_service",
        dominantAction: {
          actionRef: "search_slots",
          label: "Find appointment times",
          body:
            "Search stays in this shell and opens the frozen results host without dropping your return context.",
          targetRouteRef: routeRefFor(bookingCaseId, "select"),
        },
      };
    case "assisted_only":
      return {
        ...base,
        surfaceState,
        dominantCapabilityCueCode: "cue_assisted_only",
        controlState: "read_only",
        selfServiceActionRefs: [],
        assistedActionRefs: ["request_staff_assist"],
        manageActionRefs: [],
        fallbackActionRefs: ["request_staff_assist", "fallback_continue_read_only"],
        blockedActionReasonCodes: ["reason_staff_assist_only"],
        exposedActionScopes: ["request_staff_assist", "view_booking_summary"],
        underlyingCapabilityState: "assisted_only",
        dominantAction: {
          actionRef: "request_staff_assist",
          label: "Need help booking?",
          body:
            "This booking path is staff-assisted today, so the shell stays readable while support takes over the active work.",
          targetRouteRef: "#booking-help-panel",
        },
      };
    case "linkage_required":
      return {
        ...base,
        surfaceState,
        dominantCapabilityCueCode: "cue_linkage_required",
        controlState: "blocked",
        selfServiceActionRefs: [],
        assistedActionRefs: ["request_staff_assist"],
        manageActionRefs: [],
        fallbackActionRefs: ["repair_gp_linkage", "request_staff_assist"],
        blockedActionReasonCodes: ["reason_gp_linkage_required"],
        exposedActionScopes: ["repair_gp_linkage", "request_staff_assist"],
        underlyingCapabilityState: "linkage_required",
        dominantAction: {
          actionRef: "repair_gp_linkage",
          label: "Repair GP linkage",
          body:
            "The booking need and preferences stay visible, but self-service must stay fenced until linkage proof is current again.",
          targetRouteRef: "#booking-help-panel",
        },
      };
    case "local_component_required":
      return {
        ...base,
        surfaceState,
        dominantCapabilityCueCode: "cue_local_component_required",
        controlState: "read_only",
        selfServiceActionRefs: [],
        assistedActionRefs: ["request_staff_assist"],
        manageActionRefs: [],
        fallbackActionRefs: ["launch_local_component", "request_staff_assist"],
        blockedActionReasonCodes: ["reason_local_component_required"],
        exposedActionScopes: ["launch_local_component", "request_staff_assist"],
        underlyingCapabilityState: "local_component_required",
        dominantAction: {
          actionRef: "launch_local_component",
          label: "Open the linked booking service",
          body:
            "The provider requires a governed local component, so this shell keeps the need summary and return contract visible before handoff.",
          targetRouteRef: "#booking-help-panel",
        },
      };
    case "degraded_manual":
      return {
        ...base,
        surfaceState,
        dominantCapabilityCueCode: "cue_degraded_manual",
        controlState: "blocked",
        selfServiceActionRefs: [],
        assistedActionRefs: ["request_staff_assist"],
        manageActionRefs: [],
        fallbackActionRefs: ["fallback_contact_practice_support", "request_staff_assist"],
        blockedActionReasonCodes: ["reason_supplier_degraded_manual"],
        exposedActionScopes: ["fallback_contact_practice_support", "request_staff_assist"],
        underlyingCapabilityState: "degraded_manual",
        dominantAction: {
          actionRef: "fallback_contact_practice_support",
          label: "Use the practice booking line",
          body:
            "Supplier posture is degraded, so the workspace stays in place and promotes the safest manual continuation instead of stale self-service controls.",
          targetRouteRef: "#booking-help-panel",
        },
      };
    case "recovery_required":
      return {
        ...base,
        surfaceState,
        dominantCapabilityCueCode: "cue_recovery_required",
        controlState: "blocked",
        selfServiceActionRefs: [],
        assistedActionRefs: ["request_staff_assist"],
        manageActionRefs: [],
        fallbackActionRefs: ["refresh_booking_continuity", "fallback_continue_read_only"],
        blockedActionReasonCodes: ["reason_governing_object_stale", "reason_publication_frozen"],
        exposedActionScopes: ["refresh_booking_continuity", "view_booking_summary"],
        underlyingCapabilityState: "recovery_only",
        dominantAction: {
          actionRef: "refresh_booking_continuity",
          label: "Restore booking continuity",
          body:
            "Route or evidence drift means the shell can preserve provenance, but it must fail closed before the next writable step.",
          targetRouteRef: "#booking-help-panel",
        },
      };
    case "blocked":
    default:
      return {
        ...base,
        surfaceState: "blocked",
        dominantCapabilityCueCode: "cue_blocked",
        controlState: "blocked",
        selfServiceActionRefs: [],
        assistedActionRefs: ["request_staff_assist"],
        manageActionRefs: [],
        fallbackActionRefs: ["fallback_continue_read_only", "request_staff_assist"],
        blockedActionReasonCodes: ["reason_policy_blocked", "reason_assurance_read_only"],
        exposedActionScopes: ["view_booking_summary", "request_staff_assist"],
        underlyingCapabilityState: "blocked",
        dominantAction: {
          actionRef: "fallback_continue_read_only",
          label: "Review the last safe booking summary",
          body:
            "This shell is intentionally read-only, keeping the selected provenance visible while ordinary controls stay disabled.",
          targetRouteRef: "#booking-provenance-card",
        },
      };
  }
}

const bookingFixtures = {
  booking_case_293_live: {
    bookingCaseId: "booking_case_293_live",
    caseStatus: "capability_checked" as const,
    shellState: "ready" as const,
    patientLabel: "Samira Ahmed",
    heading: "Schedule the follow-up review",
    subheading:
      "One booking shell keeps the need summary, current preferences, and support path visible while results and confirmation surfaces load later.",
    serviceLine: "Dermatology follow-up",
    needRows: [
      { label: "Need", value: "Follow-up review for the recent flare plan" },
      { label: "Timing", value: "Within the next 14 days" },
      { label: "Clinician", value: "Keep the same community dermatology team" },
      { label: "Format", value: "Face-to-face if possible, phone fallback allowed" },
      { label: "Travel", value: "Avoid the school-run window after 15:15" },
    ],
    needWindow: [
      { label: "Requested", value: "Today", tone: "neutral" },
      { label: "Preferred", value: "10 to 24 Apr", tone: "primary" },
      { label: "Safe latest", value: "2 May", tone: "safe" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Community clinic" },
      { label: "Time of day", value: "Morning" },
      { label: "Mobility", value: "Lift access preferred" },
    ],
    preferenceDisclosure: [
      { label: "Transport", value: "Can travel up to 25 minutes" },
      { label: "Continuity", value: "Same clinician preferred when feasible" },
      { label: "Notifications", value: "SMS and email already verified" },
      { label: "Fallback", value: "Staff call-back is acceptable if supply degrades" },
    ],
    surfaceState: "self_service_live" as const,
    continuityState: "preserved" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: null,
    supportPath: {
      label: "Need help booking?",
      copy:
        "Support can still pick up this booking without resetting your place if the search becomes difficult or the route posture changes.",
      actionLabel: "Ask for booking help",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: null,
  },
  booking_case_293_linkage: {
    bookingCaseId: "booking_case_293_linkage",
    caseStatus: "capability_checked" as const,
    shellState: "read_only" as const,
    patientLabel: "Samira Ahmed",
    heading: "Repair linkage before booking continues",
    subheading:
      "The appointment need stays visible, but the capability tuple requires fresh GP linkage before self-service can continue.",
    serviceLine: "Cardiology review",
    needRows: [
      { label: "Need", value: "Routine cardiology review" },
      { label: "Timing", value: "Within 3 weeks" },
      { label: "Current blocker", value: "GP linkage evidence is stale" },
      { label: "Support path", value: "Practice team can help re-link without losing context" },
    ],
    needWindow: [
      { label: "Requested", value: "Today", tone: "neutral" },
      { label: "Preferred", value: "This month", tone: "primary" },
      { label: "Blocked by", value: "Linkage proof", tone: "warn" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Nearest outpatient site" },
      { label: "Format", value: "Face-to-face preferred" },
    ],
    preferenceDisclosure: [
      { label: "Morning/afternoon", value: "Either" },
      { label: "Travel", value: "Public transport only" },
    ],
    surfaceState: "linkage_required" as const,
    continuityState: "preserved" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: null,
    supportPath: {
      label: "Need help booking?",
      copy:
        "If linkage repair cannot be completed now, the same shell can hand the booking to staff without discarding the current need summary.",
      actionLabel: "Contact the practice team",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: null,
  },
  booking_case_293_local_component: {
    bookingCaseId: "booking_case_293_local_component",
    caseStatus: "capability_checked" as const,
    shellState: "read_only" as const,
    patientLabel: "Samira Ahmed",
    heading: "This booking continues in the linked provider flow",
    subheading:
      "The shell explains why a governed local component is required before the deeper availability flow can open.",
    serviceLine: "Women's health follow-up",
    needRows: [
      { label: "Need", value: "Review the recent investigation results" },
      { label: "Timing", value: "Prefer next available morning" },
      { label: "Current blocker", value: "Provider requires its linked booking component" },
      { label: "Support path", value: "Staff can still help if the linked flow is unavailable" },
    ],
    needWindow: [
      { label: "Requested", value: "Today", tone: "neutral" },
      { label: "Provider path", value: "Linked component", tone: "primary" },
      { label: "Fallback", value: "Assisted support", tone: "safe" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Women's health centre" },
      { label: "Time of day", value: "Morning" },
    ],
    preferenceDisclosure: [
      { label: "Continuity", value: "Any clinician in the same team" },
      { label: "Interpreter", value: "Not required" },
    ],
    surfaceState: "local_component_required" as const,
    continuityState: "preserved" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: null,
    supportPath: {
      label: "Need help booking?",
      copy:
        "If the linked component does not load, staff can continue from the same case without recreating the appointment need.",
      actionLabel: "Use the supported fallback",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: null,
  },
  booking_case_293_assisted: {
    bookingCaseId: "booking_case_293_assisted",
    caseStatus: "capability_checked" as const,
    shellState: "read_only" as const,
    patientLabel: "Samira Ahmed",
    heading: "Support will book this appointment with you",
    subheading:
      "The workspace stays calm and specific while the active booking work is staff-assisted rather than self-service.",
    serviceLine: "Physiotherapy follow-up",
    needRows: [
      { label: "Need", value: "Book the next physiotherapy follow-up" },
      { label: "Timing", value: "Within 10 days" },
      { label: "Current posture", value: "Staff-assisted only" },
      { label: "Patient-safe next step", value: "Keep the need summary visible and request help" },
    ],
    needWindow: [
      { label: "Requested", value: "Today", tone: "neutral" },
      { label: "Support review", value: "Today", tone: "primary" },
      { label: "Safe latest", value: "29 Apr", tone: "safe" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Physio suite" },
      { label: "Time of day", value: "Afternoon" },
    ],
    preferenceDisclosure: [
      { label: "Transport", value: "Wheelchair taxi booked when needed" },
      { label: "Continuity", value: "Same clinician strongly preferred" },
    ],
    surfaceState: "assisted_only" as const,
    continuityState: "preserved" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: null,
    supportPath: {
      label: "Need help booking?",
      copy:
        "A booking adviser can carry the case forward while the shell keeps your return route and selected context intact.",
      actionLabel: "Request staff help",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: null,
  },
  booking_case_293_degraded: {
    bookingCaseId: "booking_case_293_degraded",
    caseStatus: "searching_local" as const,
    shellState: "partial" as const,
    patientLabel: "Samira Ahmed",
    heading: "Supply posture changed while this booking was open",
    subheading:
      "The workspace does not disappear when supplier posture degrades. It keeps the need summary, preferences, and support path visible in place.",
    serviceLine: "Respiratory clinic review",
    needRows: [
      { label: "Need", value: "Routine respiratory review after the inhaler change" },
      { label: "Timing", value: "Within 2 weeks" },
      { label: "Current posture", value: "Manual fallback promoted" },
      { label: "Visible truth", value: "Search can no longer claim current self-service actionability" },
    ],
    needWindow: [
      { label: "Requested", value: "Today", tone: "neutral" },
      { label: "Partial coverage", value: "Supplier degraded", tone: "warn" },
      { label: "Fallback", value: "Call-back safe", tone: "safe" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Respiratory clinic" },
      { label: "Time of day", value: "Morning" },
    ],
    preferenceDisclosure: [
      { label: "Travel", value: "Taxi needed after 30 minutes" },
      { label: "Continuity", value: "Any respiratory clinician" },
    ],
    surfaceState: "degraded_manual" as const,
    continuityState: "preserved" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: "Supplier availability is temporarily degraded for this tuple.",
    supportPath: {
      label: "Need help booking?",
      copy:
        "The practice team can continue from this same case now that the supplier tuple has downgraded to manual handling.",
      actionLabel: "Use the manual fallback",
      actionRef: "fallback_contact_practice_support" as const,
    },
    provenanceCard: {
      title: "Last safe search context",
      summary: "Morning appointments at the respiratory clinic were last seen before the supplier posture downgraded.",
      meta: "Provenance only. Availability must be re-checked before any booking promise is made.",
    },
  },
  booking_case_293_blocked: {
    bookingCaseId: "booking_case_293_blocked",
    caseStatus: "confirmation_pending" as const,
    shellState: "read_only" as const,
    patientLabel: "Samira Ahmed",
    heading: "The booking summary is preserved, but controls are frozen",
    subheading:
      "Policy or assurance drift has blocked ordinary actions, so the shell stays readable and keeps the last safe anchor visible as provenance.",
    serviceLine: "Gastroenterology review",
    needRows: [
      { label: "Need", value: "Follow-up after the recent medication review" },
      { label: "Timing", value: "Still within the requested window" },
      { label: "Current posture", value: "Read-only booking summary" },
      { label: "Why it changed", value: "Assurance or publication proof no longer supports writable controls" },
    ],
    needWindow: [
      { label: "Requested", value: "Today", tone: "neutral" },
      { label: "Selected", value: "24 Apr, 09:10", tone: "primary" },
      { label: "Blocked by", value: "Policy and assurance drift", tone: "blocked" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Gastro clinic" },
      { label: "Time of day", value: "Morning" },
    ],
    preferenceDisclosure: [
      { label: "Transport", value: "Family driver available" },
      { label: "Continuity", value: "Keep the same clinic if possible" },
    ],
    surfaceState: "blocked" as const,
    continuityState: "read_only" as const,
    routePublicationState: "frozen" as const,
    embeddedSessionState: "drifted" as const,
    publicationReason: "Publication froze after the selected slot was anchored.",
    supportPath: {
      label: "Need help booking?",
      copy:
        "Support can still see the preserved booking provenance and continue from the same case once the route posture is reconciled.",
      actionLabel: "Contact support",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: {
      title: "Selected slot preserved as provenance",
      summary: "24 April at 09:10 with the gastro clinic remains visible, but it can no longer be treated as an active self-service choice.",
      meta: "Read-only provenance only. The shell cannot keep stale self-service controls armed.",
    },
  },
  booking_case_293_recovery: {
    bookingCaseId: "booking_case_293_recovery",
    caseStatus: "supplier_reconciliation_pending" as const,
    shellState: "recovery_required" as const,
    patientLabel: "Samira Ahmed",
    heading: "Restore the booking shell before continuing",
    subheading:
      "Continuity evidence drifted after this case was opened, so the shell preserves the last safe shape and asks for an in-place restore rather than leaving the patient stranded.",
    serviceLine: "Rheumatology review",
    needRows: [
      { label: "Need", value: "Book the rheumatology follow-up" },
      { label: "Timing", value: "Prefer the next 2 weeks" },
      { label: "Current posture", value: "Recovery required in place" },
      { label: "Continuity drift", value: "Route publication and embedded session no longer match the active tuple" },
    ],
    needWindow: [
      { label: "Requested", value: "Today", tone: "neutral" },
      { label: "Last safe anchor", value: "Selected slot summary", tone: "primary" },
      { label: "Recovery", value: "Needed before mutation", tone: "blocked" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Rheumatology clinic" },
      { label: "Time of day", value: "Late morning" },
    ],
    preferenceDisclosure: [
      { label: "Travel", value: "Wheelchair access required" },
      { label: "Fallback", value: "Call-back support acceptable" },
    ],
    surfaceState: "recovery_required" as const,
    continuityState: "recovery_required" as const,
    routePublicationState: "withdrawn" as const,
    embeddedSessionState: "drifted" as const,
    publicationReason: "Shell continuity and publication proof drifted after re-entry.",
    supportPath: {
      label: "Need help booking?",
      copy:
        "If recovery cannot complete now, support can continue from the preserved provenance instead of sending the patient to a detached failure page.",
      actionLabel: "Use the recovery path",
      actionRef: "refresh_booking_continuity" as const,
    },
    provenanceCard: {
      title: "Last safe booking anchor",
      summary: "A selected slot summary remains visible so the patient can understand what was in progress before continuity drift forced the shell into recovery.",
      meta: "Preserved for orientation only until continuity proof is refreshed.",
    },
  },
  booking_case_293_partial: {
    bookingCaseId: "booking_case_293_partial",
    caseStatus: "handoff_received" as const,
    shellState: "loading" as const,
    patientLabel: "Samira Ahmed",
    heading: "Preparing the booking workspace",
    subheading:
      "Even while capability and continuity evidence converge, the shell keeps a readable appointment-need frame instead of showing a detached loading page.",
    serviceLine: "Neurology review",
    needRows: [
      { label: "Need", value: "Book the neurology follow-up" },
      { label: "Timing", value: "Within 4 weeks" },
      { label: "Current posture", value: "Partial evidence loading" },
    ],
    needWindow: [
      { label: "Received", value: "Just now", tone: "neutral" },
      { label: "Capability", value: "Checking", tone: "primary" },
      { label: "Support", value: "Visible", tone: "safe" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Nearest neurology site" },
      { label: "Time of day", value: "Any" },
    ],
    preferenceDisclosure: [
      { label: "Notifications", value: "SMS preferred" },
      { label: "Continuity", value: "Any clinician in the team" },
    ],
    surfaceState: "self_service_live" as const,
    continuityState: "preserved" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: null,
    supportPath: {
      label: "Need help booking?",
      copy:
        "Support stays visible even while capability posture is still checking, so the shell never feels empty or misleading.",
      actionLabel: "Keep support visible",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: null,
  },
  booking_case_294_renderable: {
    bookingCaseId: "booking_case_294_renderable",
    caseStatus: "offers_ready" as const,
    shellState: "ready" as const,
    patientLabel: "Samira Ahmed",
    heading: "Choose from the local appointment snapshot",
    subheading:
      "The results stage shows one frozen ranking of local availability, grouped by day and kept inside the same booking shell.",
    serviceLine: "Dermatology follow-up",
    needRows: [
      { label: "Need", value: "Follow-up review for the recent flare plan" },
      { label: "Timing", value: "Within the next 14 days" },
      { label: "Clinician", value: "Keep the same community dermatology team" },
      { label: "Format", value: "Face-to-face if possible, remote fallback allowed" },
      { label: "Travel", value: "Avoid the school-run window after 15:15" },
    ],
    needWindow: [
      { label: "Requested", value: "Today", tone: "neutral" },
      { label: "Preferred", value: "21 to 23 Apr", tone: "primary" },
      { label: "Safe latest", value: "2 May", tone: "safe" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Community clinic" },
      { label: "Time of day", value: "Morning" },
      { label: "Mobility", value: "Lift access preferred" },
    ],
    preferenceDisclosure: [
      { label: "Transport", value: "Can travel up to 25 minutes" },
      { label: "Continuity", value: "Same clinician preferred when feasible" },
      { label: "Notifications", value: "SMS and email already verified" },
      { label: "Snapshot truth", value: "Counts and order come from the frozen snapshot" },
    ],
    surfaceState: "self_service_live" as const,
    continuityState: "preserved" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: null,
    supportPath: {
      label: "Need help booking?",
      copy:
        "Support stays available from the same booking case if browsing becomes difficult or the snapshot needs governed recovery.",
      actionLabel: "Ask for booking help",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: null,
  },
  booking_case_294_partial: {
    bookingCaseId: "booking_case_294_partial",
    caseStatus: "offers_ready" as const,
    shellState: "partial" as const,
    patientLabel: "Samira Ahmed",
    heading: "Browse the current snapshot with partial coverage",
    subheading:
      "Results remain visible and grouped by day, but the shell makes it explicit that one supplier window is still missing.",
    serviceLine: "Dermatology follow-up",
    needRows: [
      { label: "Need", value: "Follow-up review for the recent flare plan" },
      { label: "Timing", value: "Within the next 14 days" },
      { label: "Current posture", value: "Partial supplier coverage" },
      { label: "Patient-safe rule", value: "Do not treat this as final no availability" },
    ],
    needWindow: [
      { label: "Requested", value: "Today", tone: "neutral" },
      { label: "Visible days", value: "21 to 22 Apr", tone: "primary" },
      { label: "Coverage", value: "Still settling", tone: "warn" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Community clinic" },
      { label: "Time of day", value: "Morning" },
      { label: "Mobility", value: "Lift access preferred" },
    ],
    preferenceDisclosure: [
      { label: "Transport", value: "Can travel up to 25 minutes" },
      { label: "Continuity", value: "Same clinician preferred when feasible" },
      { label: "Support", value: "Staff can continue without losing this shell" },
    ],
    surfaceState: "self_service_live" as const,
    continuityState: "preserved" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: "One supplier window is still missing from the current snapshot.",
    supportPath: {
      label: "Need help booking?",
      copy:
        "Support can continue from this partial snapshot if the missing window matters for the patient.",
      actionLabel: "Ask for booking help",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: null,
  },
  booking_case_294_stale: {
    bookingCaseId: "booking_case_294_stale",
    caseStatus: "offers_ready" as const,
    shellState: "ready" as const,
    patientLabel: "Samira Ahmed",
    heading: "Refresh this snapshot before choosing a time",
    subheading:
      "The booking shell preserves the visible day groups and last safe reading position, but selection must pause until the snapshot is refreshed.",
    serviceLine: "Dermatology follow-up",
    needRows: [
      { label: "Need", value: "Follow-up review for the recent flare plan" },
      { label: "Timing", value: "Within the next 14 days" },
      { label: "Current posture", value: "Snapshot expired for selection" },
      { label: "Anchor rule", value: "Preserve the active day while refresh runs in place" },
    ],
    needWindow: [
      { label: "Requested", value: "Today", tone: "neutral" },
      { label: "Preserved day", value: "22 Apr", tone: "primary" },
      { label: "Refresh", value: "Required before mutation", tone: "warn" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Community clinic" },
      { label: "Time of day", value: "Morning" },
      { label: "Mobility", value: "Lift access preferred" },
    ],
    preferenceDisclosure: [
      { label: "Transport", value: "Can travel up to 25 minutes" },
      { label: "Continuity", value: "Same clinician preferred when feasible" },
      { label: "Snapshot truth", value: "Visible rows remain provenance until refresh completes" },
    ],
    surfaceState: "self_service_live" as const,
    continuityState: "preserved" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: "Snapshot expired for selection but the shell remains same-route recoverable.",
    supportPath: {
      label: "Need help booking?",
      copy:
        "If refresh cannot complete right now, staff can continue from the preserved day anchor and booking case.",
      actionLabel: "Ask for booking help",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: {
      title: "Preserved day anchor",
      summary: "The last safe result group remains visible so the patient is not dropped back to the top of the list.",
      meta: "Selection is paused until a fresh snapshot replaces this one.",
    },
  },
  booking_case_294_no_supply: {
    bookingCaseId: "booking_case_294_no_supply",
    caseStatus: "offers_ready" as const,
    shellState: "ready" as const,
    patientLabel: "Samira Ahmed",
    heading: "This search completed without a local appointment",
    subheading:
      "The shell distinguishes a true completed no-supply outcome from partial or stale coverage, then keeps the next safe continuation nearby.",
    serviceLine: "Dermatology follow-up",
    needRows: [
      { label: "Need", value: "Follow-up review for the recent flare plan" },
      { label: "Timing", value: "Within the next 14 days" },
      { label: "Current posture", value: "No local supply confirmed for this policy" },
      { label: "Patient-safe next step", value: "Continue with support rather than refresh guesswork" },
    ],
    needWindow: [
      { label: "Requested", value: "Today", tone: "neutral" },
      { label: "Coverage", value: "Complete", tone: "safe" },
      { label: "Local supply", value: "None in this search", tone: "blocked" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Community clinic" },
      { label: "Time of day", value: "Morning" },
      { label: "Mobility", value: "Lift access preferred" },
    ],
    preferenceDisclosure: [
      { label: "Transport", value: "Can travel up to 25 minutes" },
      { label: "Continuity", value: "Same clinician preferred when feasible" },
      { label: "Fallback", value: "Waitlist or callback may still be available through support" },
    ],
    surfaceState: "self_service_live" as const,
    continuityState: "preserved" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: "The current policy search completed with no local supply.",
    supportPath: {
      label: "Need help booking?",
      copy:
        "Support can continue with the next governed path, such as waitlist or callback, without discarding the booking need.",
      actionLabel: "Ask for booking help",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: null,
  },
  booking_case_294_fallback: {
    bookingCaseId: "booking_case_294_fallback",
    caseStatus: "booking_failed" as const,
    shellState: "read_only" as const,
    patientLabel: "Samira Ahmed",
    heading: "This booking needs the supported fallback route",
    subheading:
      "Supplier recovery did not settle cleanly enough for self-service to continue, so the shell keeps orientation visible and promotes the assisted continuation in place.",
    serviceLine: "Dermatology follow-up",
    needRows: [
      { label: "Need", value: "Follow-up review for the recent flare plan" },
      { label: "Timing", value: "Within the next 14 days" },
      { label: "Current posture", value: "Supported fallback required" },
      { label: "Why self-service stopped", value: "Supplier recovery failed for this snapshot" },
    ],
    needWindow: [
      { label: "Requested", value: "Today", tone: "neutral" },
      { label: "Coverage", value: "Failed", tone: "blocked" },
      { label: "Next safe route", value: "Supported fallback", tone: "warn" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Community clinic" },
      { label: "Time of day", value: "Morning" },
      { label: "Mobility", value: "Lift access preferred" },
    ],
    preferenceDisclosure: [
      { label: "Transport", value: "Can travel up to 25 minutes" },
      { label: "Continuity", value: "Same clinician preferred when feasible" },
      { label: "Fallback", value: "Practice team continues from the same case" },
    ],
    surfaceState: "degraded_manual" as const,
    continuityState: "preserved" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: "Supplier recovery failed, so the shell routed to the supported fallback.",
    supportPath: {
      label: "Need help booking?",
      copy:
        "The practice booking team can continue from this same case now that supplier recovery has fallen back to assisted handling.",
      actionLabel: "Use the supported fallback",
      actionRef: "fallback_contact_practice_support" as const,
    },
    provenanceCard: {
      title: "Last safe search context",
      summary: "The previous search context remains visible, but the next action is the assisted fallback rather than another local browse.",
      meta: "This shell stays readable while the supported fallback takes over.",
    },
  },
  booking_case_297_ready: {
    bookingCaseId: "booking_case_297_ready",
    caseStatus: "managed" as const,
    shellState: "settled" as const,
    patientLabel: "Samira Ahmed",
    heading: "Manage this appointment",
    subheading:
      "The manage surface stays summary-first, quiet, and same-shell safe while booked truth, reminder posture, and continuity evidence remain current.",
    serviceLine: "Dermatology follow-up",
    needRows: [
      { label: "Appointment", value: "22 April at 11:20" },
      { label: "Current posture", value: "Booked and safely manageable" },
      { label: "Reminder route", value: "Scheduled on the current verified route" },
      { label: "Patient-safe next step", value: "Choose one manage action without losing the booked summary" },
    ],
    needWindow: [
      { label: "Booked", value: "22 Apr", tone: "primary" },
      { label: "Manage posture", value: "Writable", tone: "safe" },
      { label: "Support", value: "Still visible", tone: "neutral" },
    ],
    preferenceSummary: [
      { label: "Reminder route", value: "SMS to 07700 900123" },
      { label: "Support", value: "Same-shell fallback visible" },
    ],
    preferenceDisclosure: [
      { label: "Manage truth", value: "Confirmed booking truth and current continuity evidence" },
      { label: "Artifacts", value: "Summary-first and handoff-ready" },
    ],
    surfaceState: "self_service_live" as const,
    continuityState: "preserved" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: null,
    supportPath: {
      label: "Need help with this appointment?",
      copy:
        "Support can continue from this same appointment lineage if an online manage action becomes blocked, stale, or still pending.",
      actionLabel: "Contact support",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: null,
  },
  booking_case_297_cancel_pending: {
    bookingCaseId: "booking_case_297_cancel_pending",
    caseStatus: "managed" as const,
    shellState: "partial" as const,
    patientLabel: "Samira Ahmed",
    heading: "Cancellation is still settling",
    subheading:
      "The manage shell keeps the booked summary visible while cancellation truth is still pending and reminder posture is suppressed.",
    serviceLine: "Dermatology follow-up",
    needRows: [
      { label: "Appointment", value: "22 April at 11:20" },
      { label: "Current posture", value: "Cancellation pending" },
      { label: "Visible truth", value: "Do not assume the appointment is cancelled yet" },
    ],
    needWindow: [
      { label: "Booked", value: "22 Apr", tone: "primary" },
      { label: "Manage settlement", value: "Supplier pending", tone: "warn" },
      { label: "Reminder posture", value: "Suppressed", tone: "blocked" },
    ],
    preferenceSummary: [
      { label: "Reminder route", value: "Frozen while cancellation settles" },
      { label: "Support", value: "Visible in the same shell" },
    ],
    preferenceDisclosure: [
      { label: "Manage truth", value: "Pending manage settlement" },
      { label: "Artifacts", value: "Summary-only" },
    ],
    surfaceState: "degraded_manual" as const,
    continuityState: "preserved" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: "Cancellation settlement is still pending.",
    supportPath: {
      label: "Need help with this appointment?",
      copy:
        "Support can continue from the same appointment if cancellation timing matters before supplier truth settles.",
      actionLabel: "Contact support",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: null,
  },
  booking_case_297_confirmation_pending: {
    bookingCaseId: "booking_case_297_confirmation_pending",
    caseStatus: "confirmation_pending" as const,
    shellState: "read_only" as const,
    patientLabel: "Samira Ahmed",
    heading: "This appointment is still being confirmed",
    subheading:
      "The booked summary remains visible for reassurance, but manage controls stay read-only until confirmation truth returns to confirmed.",
    serviceLine: "Dermatology follow-up",
    needRows: [
      { label: "Appointment", value: "22 April at 11:20" },
      { label: "Current posture", value: "Confirmation pending" },
      { label: "Reminder posture", value: "Blocked until final truth" },
    ],
    needWindow: [
      { label: "Booked summary", value: "Visible", tone: "primary" },
      { label: "Manage posture", value: "Summary-only", tone: "warn" },
      { label: "Next safe path", value: "Refresh or contact support", tone: "neutral" },
    ],
    preferenceSummary: [
      { label: "Reminder route", value: "Summary-only" },
      { label: "Support", value: "Visible in place" },
    ],
    preferenceDisclosure: [
      { label: "Manage truth", value: "Provisional until confirmation settles" },
      { label: "Artifacts", value: "Summary-only" },
    ],
    surfaceState: "blocked" as const,
    continuityState: "read_only" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: "Writable manage posture is suppressed while confirmation is provisional.",
    supportPath: {
      label: "Need help with this appointment?",
      copy:
        "Support can continue from the same appointment if this pending confirmation becomes urgent.",
      actionLabel: "Contact support",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: {
      title: "Booked summary preserved",
      summary: "The appointment summary remains visible, but manage controls stay read-only until booking truth settles.",
      meta: "Summary-safe only while confirmation is pending.",
    },
  },
  booking_case_297_stale: {
    bookingCaseId: "booking_case_297_stale",
    caseStatus: "managed" as const,
    shellState: "recovery_required" as const,
    patientLabel: "Samira Ahmed",
    heading: "Refresh this manage route before changing anything",
    subheading:
      "Continuity evidence drifted after this appointment was opened, so the manage shell keeps the booked summary visible and freezes writable controls in place.",
    serviceLine: "Dermatology follow-up",
    needRows: [
      { label: "Appointment", value: "22 April at 11:20" },
      { label: "Current posture", value: "Summary-only until continuity refresh" },
      { label: "Patient-safe next step", value: "Refresh the route or continue with support" },
    ],
    needWindow: [
      { label: "Booked summary", value: "Visible", tone: "primary" },
      { label: "Continuity", value: "Stale", tone: "blocked" },
      { label: "Next safe path", value: "Refresh route", tone: "warn" },
    ],
    preferenceSummary: [
      { label: "Reminder route", value: "Summary-only while continuity is stale" },
      { label: "Support", value: "Visible in place" },
    ],
    preferenceDisclosure: [
      { label: "Manage truth", value: "Summary-safe only until route refresh completes" },
      { label: "Artifacts", value: "Summary-only" },
    ],
    surfaceState: "recovery_required" as const,
    continuityState: "recovery_required" as const,
    routePublicationState: "frozen" as const,
    embeddedSessionState: "drifted" as const,
    publicationReason: "Manage continuity evidence drifted after route entry.",
    supportPath: {
      label: "Need help with this appointment?",
      copy:
        "Support can continue from the same appointment lineage if continuity cannot refresh immediately.",
      actionLabel: "Contact support",
      actionRef: "refresh_booking_continuity" as const,
    },
    provenanceCard: {
      title: "Current appointment preserved",
      summary: "The current appointment remains visible while the manage route recovers in place.",
      meta: "Writable controls stay frozen until continuity proof is refreshed.",
    },
  },
  booking_case_298_join_sheet: {
    bookingCaseId: "booking_case_298_join_sheet",
    caseStatus: "offers_ready" as const,
    shellState: "ready" as const,
    patientLabel: "Samira Ahmed",
    heading: "Keep this request moving with the local waitlist",
    subheading:
      "The same booking shell can carry the current preference summary into a quieter waitlist continuation when no suitable local time is available now.",
    serviceLine: "Dermatology follow-up",
    needRows: [
      { label: "Need", value: "Follow-up review for the recent flare plan" },
      { label: "Current posture", value: "No suitable local time is available right now" },
      { label: "Patient-safe next step", value: "Join the local waitlist without losing this request context" },
    ],
    needWindow: [
      { label: "Requested", value: "Today", tone: "neutral" },
      { label: "Preferred", value: "This week", tone: "primary" },
      { label: "Safe latest", value: "24 Apr", tone: "safe" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Community clinic with lift access" },
      { label: "Time of day", value: "Weekday morning" },
      { label: "Contact route", value: "SMS first, email backup" },
    ],
    preferenceDisclosure: [
      { label: "Travel", value: "Up to 25 minutes by bus or train" },
      { label: "Continuity", value: "Same dermatology team if possible" },
      { label: "Fallback", value: "Callback is acceptable if local waitlist is no longer safe" },
    ],
    surfaceState: "self_service_live" as const,
    continuityState: "preserved" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: null,
    supportPath: {
      label: "Need help with this waitlist?",
      copy:
        "Support can continue from this same booking shell if you prefer not to wait for another local release or if the route posture changes.",
      actionLabel: "Ask for booking help",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: null,
  },
  booking_case_298_waiting: {
    bookingCaseId: "booking_case_298_waiting",
    caseStatus: "waitlisted" as const,
    shellState: "ready" as const,
    patientLabel: "Samira Ahmed",
    heading: "Your local waitlist request is still moving",
    subheading:
      "The waitlist route stays in the same booking shell and keeps the request need, preference summary, and support path visible while local supply is monitored.",
    serviceLine: "Dermatology follow-up",
    needRows: [
      { label: "Need", value: "Follow-up review for the recent flare plan" },
      { label: "Current posture", value: "Waiting for a local offer" },
      { label: "Patient-safe next step", value: "Keep the waitlist active or ask for support" },
    ],
    needWindow: [
      { label: "Joined", value: "Today", tone: "primary" },
      { label: "Window risk", value: "On track", tone: "safe" },
      { label: "Fallback debt", value: "Still armed", tone: "neutral" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Community clinic with lift access" },
      { label: "Time of day", value: "Weekday morning" },
      { label: "Contact route", value: "SMS first, email backup" },
    ],
    preferenceDisclosure: [
      { label: "Travel", value: "Up to 25 minutes by bus or train" },
      { label: "Continuity", value: "Same dermatology team if possible" },
      { label: "Fallback", value: "Callback is acceptable if local waitlist is no longer safe" },
    ],
    surfaceState: "self_service_live" as const,
    continuityState: "preserved" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: null,
    supportPath: {
      label: "Need help with this waitlist?",
      copy:
        "Support can continue from the same waitlist lineage if local supply stays quiet or if you prefer callback support instead.",
      actionLabel: "Ask for booking help",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: null,
  },
  booking_case_298_offer_nonexclusive: {
    bookingCaseId: "booking_case_298_offer_nonexclusive",
    caseStatus: "waitlisted" as const,
    shellState: "ready" as const,
    patientLabel: "Samira Ahmed",
    heading: "A local waitlist offer is ready to review",
    subheading:
      "The active offer card stays pinned in the same shell so acceptance, pending confirmation, expiry, or fallback never feel detached from the original request.",
    serviceLine: "Dermatology follow-up",
    needRows: [
      { label: "Need", value: "Follow-up review for the recent flare plan" },
      { label: "Current posture", value: "Offer available" },
      { label: "Patient-safe next step", value: "Review the offer and choose the one safe action now" },
    ],
    needWindow: [
      { label: "Offer", value: "Live", tone: "primary" },
      { label: "Window risk", value: "On track", tone: "safe" },
      { label: "Fallback debt", value: "Still armed", tone: "neutral" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Community clinic with lift access" },
      { label: "Time of day", value: "Weekday morning" },
      { label: "Contact route", value: "SMS first, email backup" },
    ],
    preferenceDisclosure: [
      { label: "Travel", value: "Up to 25 minutes by bus or train" },
      { label: "Continuity", value: "Same dermatology team if possible" },
      { label: "Fallback", value: "Callback remains live until booking truth settles" },
    ],
    surfaceState: "self_service_live" as const,
    continuityState: "preserved" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: null,
    supportPath: {
      label: "Need help with this waitlist?",
      copy:
        "Support can review the current waitlist offer with you without dropping the same-shell context.",
      actionLabel: "Ask for booking help",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: null,
  },
  booking_case_298_fallback_due: {
    bookingCaseId: "booking_case_298_fallback_due",
    caseStatus: "waitlisted" as const,
    shellState: "partial" as const,
    patientLabel: "Samira Ahmed",
    heading: "Local waitlist is no longer the safe next step",
    subheading:
      "The waitlist route keeps the preference summary visible, but the dominant action switches to governed fallback once the safe local window is due or overdue.",
    serviceLine: "Dermatology follow-up",
    needRows: [
      { label: "Need", value: "Follow-up review for the recent flare plan" },
      { label: "Current posture", value: "Fallback due" },
      { label: "Patient-safe next step", value: "Move to callback rather than continue waiting locally" },
    ],
    needWindow: [
      { label: "Offer window", value: "Closed", tone: "warn" },
      { label: "Window risk", value: "Fallback due", tone: "warn" },
      { label: "Fallback route", value: "Callback", tone: "blocked" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Community clinic with lift access" },
      { label: "Time of day", value: "Weekday morning" },
      { label: "Contact route", value: "SMS first, email backup" },
    ],
    preferenceDisclosure: [
      { label: "Travel", value: "Up to 25 minutes by bus or train" },
      { label: "Continuity", value: "Same dermatology team if possible" },
      { label: "Fallback", value: "Governed callback is now the next safe path" },
    ],
    surfaceState: "degraded_manual" as const,
    continuityState: "preserved" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: "Local waitlist can no longer stay ahead of the safe deadline.",
    supportPath: {
      label: "Need help with this waitlist?",
      copy:
        "Support can take over the callback path from this same booking shell when local waitlist is no longer safe.",
      actionLabel: "Ask for booking help",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: {
      title: "Waitlist context preserved",
      summary: "The current preference summary remains visible while fallback takes over in place.",
      meta: "Local waitlist no longer governs the next safe step.",
    },
  },
  booking_case_298_contact_repair: {
    bookingCaseId: "booking_case_298_contact_repair",
    caseStatus: "waitlisted" as const,
    shellState: "read_only" as const,
    patientLabel: "Samira Ahmed",
    heading: "Repair the contact route before this offer can continue",
    subheading:
      "The waitlist offer remains visible in the same shell, but acceptance is fenced until the reply route is repaired and verified again.",
    serviceLine: "Dermatology follow-up",
    needRows: [
      { label: "Need", value: "Follow-up review for the recent flare plan" },
      { label: "Current posture", value: "Contact-route repair required" },
      { label: "Patient-safe next step", value: "Repair the route without losing the current offer context" },
    ],
    needWindow: [
      { label: "Offer", value: "Still visible", tone: "primary" },
      { label: "Reachability", value: "Blocked", tone: "blocked" },
      { label: "Fallback debt", value: "Still armed", tone: "warn" },
    ],
    preferenceSummary: [
      { label: "Site", value: "Community clinic with lift access" },
      { label: "Time of day", value: "Weekday morning" },
      { label: "Contact route", value: "SMS route blocked, email backup visible" },
    ],
    preferenceDisclosure: [
      { label: "Travel", value: "Up to 25 minutes by bus or train" },
      { label: "Continuity", value: "Same dermatology team if possible" },
      { label: "Fallback", value: "Support can still continue if repair cannot be completed now" },
    ],
    surfaceState: "blocked" as const,
    continuityState: "read_only" as const,
    routePublicationState: "published" as const,
    embeddedSessionState: "active" as const,
    publicationReason: "Current offer acceptance is fenced by a blocked reply route.",
    supportPath: {
      label: "Need help with this waitlist?",
      copy:
        "Support can continue from this same offer context if the reply route cannot be repaired right now.",
      actionLabel: "Ask for booking help",
      actionRef: "request_staff_assist" as const,
    },
    provenanceCard: {
      title: "Offer context preserved",
      summary: "The current waitlist offer stays visible while contact-route repair takes over in place.",
      meta: "Acceptance stays suppressed until the route is repaired.",
    },
  },
} as const;

type BookingFixtureId = keyof typeof bookingFixtures;
type BookingFixture = (typeof bookingFixtures)[BookingFixtureId];
type ResolvedBookingFixture = Omit<BookingFixture, "bookingCaseId"> & {
  bookingCaseId: string;
};

const bookingFixtureAlias: Partial<Record<string, BookingFixtureId>> = {
  booking_case_295_nonexclusive: "booking_case_294_renderable",
  booking_case_295_exclusive_hold: "booking_case_294_renderable",
  booking_case_295_checking: "booking_case_294_partial",
  booking_case_295_unavailable: "booking_case_294_renderable",
  booking_case_295_stale: "booking_case_294_stale",
  booking_case_295_nonexclusive_refreshed: "booking_case_294_renderable",
  booking_case_295_no_supply: "booking_case_294_no_supply",
  booking_case_295_support_fallback: "booking_case_294_fallback",
  booking_case_296_review: "booking_case_294_renderable",
  booking_case_296_review_held: "booking_case_294_renderable",
  booking_case_296_in_progress: "booking_case_294_renderable",
  booking_case_296_in_progress_held: "booking_case_294_renderable",
  booking_case_296_pending: "booking_case_294_partial",
  booking_case_296_pending_held: "booking_case_294_partial",
  booking_case_296_confirmed: "booking_case_294_renderable",
  booking_case_296_confirmed_held: "booking_case_294_renderable",
  booking_case_296_reconciliation: "booking_case_294_fallback",
  booking_case_296_route_drift: "booking_case_294_stale",
  booking_case_296_identity_repair: "booking_case_294_fallback",
  booking_case_297_reschedule: "booking_case_297_ready",
  booking_case_297_reschedule_pending: "booking_case_297_ready",
  booking_case_297_detail_edit: "booking_case_297_ready",
  booking_case_297_detail_pending: "booking_case_297_ready",
  booking_case_297_reminder_pending: "booking_case_297_ready",
  booking_case_297_ready_email: "booking_case_297_ready",
  booking_case_297_cancelled: "booking_case_297_ready",
  booking_case_297_reminder_blocked: "booking_case_297_ready",
  booking_case_298_waiting: "booking_case_298_waiting",
  booking_case_298_waiting_at_risk: "booking_case_298_waiting",
  booking_case_298_offer_nonexclusive: "booking_case_298_offer_nonexclusive",
  booking_case_298_offer_held: "booking_case_298_offer_nonexclusive",
  booking_case_298_offer_pending: "booking_case_298_offer_nonexclusive",
  booking_case_298_offer_expired: "booking_case_298_offer_nonexclusive",
  booking_case_298_offer_superseded: "booking_case_298_offer_nonexclusive",
  booking_case_298_fallback_due: "booking_case_298_fallback_due",
  booking_case_298_overdue_callback: "booking_case_298_fallback_due",
  booking_case_298_contact_repair: "booking_case_298_contact_repair",
  booking_case_298_contact_repair_secure: "booking_case_298_contact_repair",
  booking_case_298_secure_link_offer: "booking_case_298_offer_nonexclusive",
  booking_case_306_handoff_live: "booking_case_293_live",
  booking_case_306_confirmation_pending: "booking_case_294_partial",
  booking_case_306_confirmed: "booking_case_297_ready",
  booking_case_306_reopened: "booking_case_293_recovery",
};

const manageFixtureAlias: Partial<Record<string, BookingFixtureId>> = {
  booking_case_296_review: "booking_case_297_confirmation_pending",
  booking_case_296_pending: "booking_case_297_confirmation_pending",
  booking_case_296_confirmed: "booking_case_297_ready",
  booking_case_296_reconciliation: "booking_case_297_stale",
  booking_case_296_route_drift: "booking_case_297_stale",
  booking_case_296_identity_repair: "booking_case_297_stale",
  booking_case_306_confirmed: "booking_case_297_ready",
  booking_case_306_confirmation_pending: "booking_case_297_confirmation_pending",
  booking_case_306_reopened: "booking_case_297_stale",
};

function anchorForRoute(
  routeKey: PatientBookingWorkspaceRouteKey,
  fixture: ResolvedBookingFixture,
  preferredAnchorRef?: string | null,
  preferredAnchorLabel?: string | null,
): { ref: string; label: string } {
  if (preferredAnchorRef && preferredAnchorLabel) {
    return { ref: preferredAnchorRef, label: preferredAnchorLabel };
  }
  if (routeKey === "confirm") {
    return { ref: "booking-content-stage", label: "Confirmation host" };
  }
  if (routeKey === "manage") {
    return { ref: "booking-manage-stage", label: "Manage appointment studio" };
  }
  if (routeKey === "waitlist") {
    return { ref: "booking-content-stage", label: "Waitlist continuation studio" };
  }
  if (routeKey === "artifacts") {
    return { ref: "booking-artifact-stage", label: "Booking artifact frame" };
  }
  if (fixture.provenanceCard && routeKey !== "workspace") {
    return { ref: "booking-provenance-card", label: "Last safe booking summary" };
  }
  switch (routeKey) {
    case "select":
      return { ref: "booking-content-stage", label: "Availability host" };
    case "workspace":
    default:
      return { ref: "booking-capability-posture-panel", label: "Capability posture" };
  }
}

function resolveNotificationEntry(
  bookingCaseId: string,
  routeKey: PatientBookingWorkspaceRouteKey,
  returnContract: PatientBookingReturnContract,
): BookingNotificationEntryProjection | null {
  if (returnContract.originKey !== "secure_link") {
    return null;
  }

  const channelLabel = "Secure link re-entry";
  if (bookingCaseId === "booking_case_306_handoff_live") {
    return {
      state: "handoff_active",
      title: "Booking handoff is active in the same booking shell",
      body:
        "This secure-link route re-entered the same booking shell, so the current handoff, summary context, and return contract remain visible while booking continuity settles.",
      channelLabel,
    };
  }

  if (bookingCaseId === "booking_case_306_confirmation_pending" || routeKey === "confirm") {
    return {
      state: "confirmation_pending",
      title: "Confirmation is still settling in the same booking shell",
      body:
        "The secure-link entry keeps the selected booking context pinned here while authoritative confirmation catches up. Accepted-for-processing still reads as pending, not booked.",
      channelLabel,
    };
  }

  if (bookingCaseId === "booking_case_306_confirmed" || routeKey === "manage") {
    return {
      state: "confirmed",
      title: "Confirmed booking resumed from the secure-link entry",
      body:
        "This secure-link return stays inside the same booking shell with the confirmed summary, next lawful actions, and original return path still attached to the case lineage.",
      channelLabel,
    };
  }

  if (bookingCaseId === "booking_case_306_reopened") {
    return {
      state: "reopened",
      title: "The booking case reopened back to recovery",
      body:
        "The secure-link path kept the same booking shell alive while booking truth drifted. Recovery now explains the reopened posture without dropping the patient into a detached fallback page.",
      channelLabel,
    };
  }

  return null;
}

function buildWorkspaceProjection(
  fixture: ResolvedBookingFixture,
  routeKey: PatientBookingWorkspaceRouteKey,
  returnContract: PatientBookingReturnContract,
  preferredAnchorRef?: string | null,
  preferredAnchorLabel?: string | null,
): PatientAppointmentWorkspaceProjection293 {
  const anchor = anchorForRoute(routeKey, fixture, preferredAnchorRef, preferredAnchorLabel);
  const capabilityProjection = capabilityActions(fixture.bookingCaseId, fixture.surfaceState);
  const notificationEntry = resolveNotificationEntry(fixture.bookingCaseId, routeKey, returnContract);
  return {
    projectionName: "PatientAppointmentWorkspaceProjection",
    bookingCaseId: fixture.bookingCaseId,
    caseStatus: fixture.caseStatus,
    shellState: fixture.shellState,
    patientLabel: fixture.patientLabel,
    heading: fixture.heading,
    subheading: fixture.subheading,
    serviceLine: fixture.serviceLine,
    needRows: fixture.needRows,
    needWindow: fixture.needWindow,
    preferenceSummary: fixture.preferenceSummary,
    preferenceDisclosure: fixture.preferenceDisclosure,
    capabilityProjection,
    continuityEvidence: {
      projectionName: "PatientPortalContinuityEvidenceBundle",
      continuityEvidenceRef: `continuity_${fixture.bookingCaseId}`,
      shellContinuityKey: `shell_${fixture.bookingCaseId}`,
      continuityState: fixture.continuityState,
      routePublicationState: fixture.routePublicationState,
      embeddedSessionState: fixture.embeddedSessionState,
      selectedAnchorRef: anchor.ref,
      selectedAnchorLabel: anchor.label,
      selectedAnchorTupleHash: hexHash(`${fixture.bookingCaseId}:${anchor.ref}`),
      publicationReason: fixture.publicationReason,
      provenanceActionability:
        fixture.continuityState === "preserved" && capabilityProjection.controlState === "writable"
          ? "writable"
          : "read_only",
    },
    returnContract,
    notificationEntry,
    supportPath: fixture.supportPath,
    provenanceCard: fixture.provenanceCard,
    childSurfaceRefs: [
      "slot_results_host",
      "truthful_selection_host",
      "confirmation_host",
      "manage_host",
      "waitlist_host",
      "artifact_host",
    ],
    computedAt: "2026-04-19T08:30:00Z",
  };
}

function stageSummary(
  routeKey: PatientBookingWorkspaceRouteKey,
  workspace: PatientAppointmentWorkspaceProjection293,
): Pick<
  PatientBookingWorkspaceEntryProjection,
  "stageHeading" | "stageCopy" | "stageStateLabel"
> {
  if (workspace.shellState === "loading") {
    return {
      stageHeading: "Capability and continuity are still converging",
      stageCopy:
        "The shell keeps the appointment need, preference summary, and support path visible while the first lawful posture settles.",
      stageStateLabel: "Loading posture",
    };
  }

  if (workspace.shellState === "recovery_required") {
    return {
      stageHeading: "Recovery stays in place",
      stageCopy:
        "Later results and confirmation child surfaces will still mount here, but only after continuity proof is refreshed.",
      stageStateLabel: "Recovery required",
    };
  }

  if (workspace.shellState === "read_only") {
    return {
      stageHeading: "Read-only provenance remains visible",
      stageCopy:
        "The content stage keeps the last safe booking anchor legible so the patient is not pushed into a detached fallback page.",
      stageStateLabel: "Read-only shell",
    };
  }

  switch (routeKey) {
    case "select":
      return {
        stageHeading: "Frozen slot-results host",
        stageCopy:
          "Task 294 mounts day-grouped slot results here, while this task keeps the shell, summary rail, and support posture stable.",
        stageStateLabel: "Selection child host",
      };
    case "confirm":
      return {
        stageHeading: "Confirmation child host",
        stageCopy:
          "Tasks 295 and 296 mount truthful selection, confirmation-pending, and recovery detail here without replacing the booking shell.",
        stageStateLabel: "Confirmation child host",
      };
    case "manage":
      return {
        stageHeading: "Manage appointment studio",
        stageCopy:
          "Task 297 mounts appointment detail, reminder posture, cancel, reschedule, and recovery states here while preserving the booked summary in the same shell.",
        stageStateLabel: "Manage child host",
      };
    case "waitlist":
      return {
        stageHeading: "Waitlist continuation studio",
        stageCopy:
          "Task 298 mounts join-waitlist, waitlist status, live offer acceptance, expiry, fallback, and contact-route repair here while the surrounding booking shell stays stable.",
        stageStateLabel: "Waitlist child host",
      };
    case "artifacts":
      return {
        stageHeading: "Booking artifact frame",
        stageCopy:
          "Task 303 mounts the summary-first receipt, attendance, calendar, print, and governed handoff panels here without leaving the booking shell.",
        stageStateLabel: "Artifact child host",
      };
    case "workspace":
    default:
      return {
        stageHeading: "Booking workspace entry",
        stageCopy:
          "This shell frames the booking need, preference summary, capability posture, and return contract before deeper availability or confirmation surfaces open.",
        stageStateLabel: "Entry posture",
      };
  }
}

export function isPatientBookingWorkspacePath(pathname: string): boolean {
  return /^\/bookings\/[^/]+(?:\/(?:select|confirm|manage|waitlist|artifacts))?$/.test(pathname);
}

export function parsePatientBookingWorkspacePath(pathname: string): {
  bookingCaseId: string;
  routeKey: PatientBookingWorkspaceRouteKey;
} | null {
  const match = /^\/bookings\/([^/]+)(?:\/(select|confirm|manage|waitlist|artifacts))?$/.exec(pathname);
  if (!match) {
    return null;
  }
  return {
    bookingCaseId: match[1] ?? "booking_case_293_live",
    routeKey: (match[2] as PatientBookingWorkspaceRouteKey | undefined) ?? "workspace",
  };
}

export function resolvePatientBookingWorkspaceEntry(input: {
  pathname: string;
  search?: string | null;
  restoredBundle?: BookingWorkspaceRestoreBundle293 | null;
  restoredBy?: BookingWorkspaceRestoreBundle293["restoredBy"];
}): PatientBookingWorkspaceEntryProjection {
  const parsed = parsePatientBookingWorkspacePath(input.pathname) ?? {
    bookingCaseId: "booking_case_293_live",
    routeKey: "workspace" as const,
  };
  const resolvedFixtureId =
    (bookingFixtures[parsed.bookingCaseId as BookingFixtureId]
      ? parsed.bookingCaseId
      : parsed.routeKey === "manage"
        ? manageFixtureAlias[parsed.bookingCaseId] ?? bookingFixtureAlias[parsed.bookingCaseId]
        : bookingFixtureAlias[parsed.bookingCaseId]) ?? "booking_case_293_live";
  const baseFixture = bookingFixtures[resolvedFixtureId as BookingFixtureId] ?? bookingFixtures.booking_case_293_live;
  const fixture: ResolvedBookingFixture =
    baseFixture.bookingCaseId === parsed.bookingCaseId
      ? baseFixture
      : {
          ...baseFixture,
          bookingCaseId: parsed.bookingCaseId,
        };
  const params = new URLSearchParams(input.search ?? "");
  const restoredBundle = input.restoredBundle ?? null;
  const artifactSource =
    parsed.routeKey === "artifacts"
      ? resolveArtifactSource(parsed.bookingCaseId, params.get("artifactSource"))
      : null;
  const artifactMode =
    parsed.routeKey === "artifacts" ? resolveArtifactMode(params.get("artifactMode")) : null;
  const originKey =
    (params.get("origin") as BookingWorkspaceOriginKey | null) ??
    restoredBundle?.returnContract.originKey ??
    "appointments";
  const selectedAnchorRef =
    params.get("anchor") ??
    (restoredBundle?.shellContinuityKey === `shell_${fixture.bookingCaseId}`
      ? restoredBundle.selectedAnchorRef
      : null);
  const selectedAnchorLabel =
    params.get("anchorLabel") ??
    (restoredBundle?.shellContinuityKey === `shell_${fixture.bookingCaseId}`
      ? restoredBundle.selectedAnchorLabel
      : null);
  const returnContract = buildReturnContract({
    bookingCaseId: fixture.bookingCaseId,
    originKey,
    returnRouteRef: params.get("returnRoute") ?? restoredBundle?.returnContract.returnRouteRef ?? null,
    selectedAnchorRef,
    selectedAnchorLabel,
    selectedEntityRef: fixture.bookingCaseId,
    continuityState:
      fixture.continuityState === "preserved"
        ? "preserved"
        : fixture.continuityState === "recovery_required"
          ? "recovery_only"
          : "blocked",
  });
  const workspace = buildWorkspaceProjection(
    fixture,
    parsed.routeKey,
    returnContract,
    selectedAnchorRef,
    selectedAnchorLabel,
  );
  const stage = stageSummary(parsed.routeKey, workspace);
  return {
    routeKey: parsed.routeKey,
    pathname: routeRefFor(fixture.bookingCaseId, parsed.routeKey),
    workspace,
    restoreBundle: {
      projectionName: "BookingWorkspaceRestoreBundle293",
      bookingCaseId: fixture.bookingCaseId,
      routeKey: parsed.routeKey,
      pathname: routeRefFor(fixture.bookingCaseId, parsed.routeKey),
      selectedAnchorRef: workspace.continuityEvidence.selectedAnchorRef,
      selectedAnchorLabel: workspace.continuityEvidence.selectedAnchorLabel,
      returnContract,
      shellContinuityKey: workspace.continuityEvidence.shellContinuityKey,
      scrollStateRef: null,
      restoredBy: input.restoredBy ?? "query",
    },
    artifactSource,
    artifactMode,
    notificationState: workspace.notificationEntry?.state ?? "none",
    ...stage,
  };
}

export const patientBookingWorkspaceFixtureIds = Object.keys(bookingFixtures) as readonly BookingFixtureId[];

export function patientBookingWorkspaceStateMatrix(): Array<Record<string, string>> {
  return patientBookingWorkspaceFixtureIds.map((fixtureId) => {
    const entry = resolvePatientBookingWorkspaceEntry({
      pathname: `/bookings/${fixtureId}`,
      search: "?origin=appointments",
    });
    return {
      bookingCaseId: entry.workspace.bookingCaseId,
      caseStatus: entry.workspace.caseStatus,
      shellState: entry.workspace.shellState,
      surfaceState: entry.workspace.capabilityProjection.surfaceState,
      controlState: entry.workspace.capabilityProjection.controlState,
      continuityState: entry.workspace.continuityEvidence.continuityState,
      routePublicationState: entry.workspace.continuityEvidence.routePublicationState,
      dominantAction: entry.workspace.capabilityProjection.dominantAction.actionRef,
      returnRouteRef: entry.workspace.returnContract.returnRouteRef,
      stageHeading: entry.stageHeading,
    };
  });
}

export function bookingWorkspaceAtlasScenarios() {
  return patientBookingWorkspaceFixtureIds.map((fixtureId) => {
    const entry = resolvePatientBookingWorkspaceEntry({
      pathname: `/bookings/${fixtureId}`,
      search: "?origin=appointments",
    });
    return {
      bookingCaseId: entry.workspace.bookingCaseId,
      heading: entry.workspace.heading,
      shellState: entry.workspace.shellState,
      caseStatus: entry.workspace.caseStatus,
      surfaceState: entry.workspace.capabilityProjection.surfaceState,
      continuityState: entry.workspace.continuityEvidence.continuityState,
      dominantAction: entry.workspace.capabilityProjection.dominantAction.label,
      routeKey: entry.routeKey,
      supportAction: entry.workspace.supportPath.actionLabel,
      originLabel: entry.workspace.returnContract.originLabel,
    };
  });
}

export function bookingWorkspaceContractSummary() {
  return {
    taskId: PATIENT_BOOKING_WORKSPACE_TASK_ID,
    visualMode: PATIENT_BOOKING_WORKSPACE_VISUAL_MODE,
    routes: [
      "/bookings/:bookingCaseId",
      "/bookings/:bookingCaseId/select",
      "/bookings/:bookingCaseId/confirm",
      "/bookings/:bookingCaseId/manage",
      "/bookings/:bookingCaseId/waitlist",
      "/bookings/:bookingCaseId/artifacts",
    ],
    childSurfaceRefs: [
      "slot_results_host",
      "truthful_selection_host",
      "confirmation_host",
      "manage_host",
      "waitlist_host",
      "artifact_host",
    ],
    fixtureIds: [...patientBookingWorkspaceFixtureIds],
  };
}

export { humanize };
