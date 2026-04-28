export type ReminderTimelinePublicationKind330 =
  | "reminder_scheduled"
  | "reminder_suppressed"
  | "reminder_failed"
  | "reminder_delivered"
  | "manage_settlement";

export type NetworkManageCapabilityState330 = "live" | "stale" | "blocked" | "expired";
export type NetworkManageReadOnlyMode330 = "interactive" | "read_only";
export type HubManageSettlementResult330 =
  | "applied"
  | "provider_pending"
  | "stale_recoverable"
  | "blocked_dependency"
  | "identity_recheck_required"
  | "reconciliation_required"
  | "unsupported_capability";
export type HubManageActionScope330 =
  | "cancel"
  | "reschedule"
  | "callback_request"
  | "details_update";
export type NetworkManageScenarioId330 =
  | "network_manage_330_live"
  | "network_manage_330_applied"
  | "network_manage_330_provider_pending"
  | "network_manage_330_contact_repair"
  | "network_manage_330_stale_recoverable"
  | "network_manage_330_read_only"
  | "network_manage_330_reconciliation_required"
  | "network_manage_330_identity_recheck"
  | "network_manage_330_unsupported_reschedule";
export type NetworkManageTimelineRowKind330 =
  | ReminderTimelinePublicationKind330
  | "callback_fallback";
export type NetworkManageTimelineTone330 =
  | "manage"
  | "reminder"
  | "callback"
  | "warning"
  | "blocked"
  | "safe";
export type NetworkManageStatusTone330 = "live" | "pending" | "recovery" | "blocked";
export type NetworkManageDeliveryState330 =
  | "healthy"
  | "attention"
  | "repair_required"
  | "suppressed";
export type NetworkManageReadOnlyReason330 =
  | "confirmation_pending"
  | "supplier_drift"
  | "identity_recheck"
  | "unsupported_capability"
  | "stale_continuity";
export type ContactRouteRepairState330 = "hidden" | "required" | "restored";
export type NetworkManageActionRef330 =
  | HubManageActionScope330
  | "repair_contact_route"
  | "refresh_manage_status"
  | "return_to_manage";
export type NetworkConfirmationScenarioId329 =
  | "network_confirmation_329_pending"
  | "network_confirmation_329_practice_informed"
  | "network_confirmation_329_practice_acknowledged"
  | "network_confirmation_329_disputed"
  | "network_confirmation_329_supplier_drift";

export interface NetworkManageSummaryRow330 {
  readonly label: string;
  readonly value: string;
}

export interface NetworkManageActionProjection330 {
  readonly actionRef: NetworkManageActionRef330;
  readonly label: string;
  readonly detail: string;
  readonly tone: "primary" | "secondary" | "warn";
  readonly transitionScenarioId: NetworkManageScenarioId330 | null;
  readonly announcement: string;
}

export interface NetworkManageCapabilityPanelProjection330 {
  readonly capabilityState: NetworkManageCapabilityState330;
  readonly readOnlyMode: NetworkManageReadOnlyMode330;
  readonly heading: string;
  readonly body: string;
  readonly statusRows: readonly NetworkManageSummaryRow330[];
  readonly blockerRows: readonly NetworkManageSummaryRow330[];
  readonly capabilityRefs: readonly HubManageActionScope330[];
}

export interface ReminderDeliveryStateCardProjection330 {
  readonly deliveryState: NetworkManageDeliveryState330;
  readonly heading: string;
  readonly body: string;
  readonly rows: readonly NetworkManageSummaryRow330[];
}

export interface ReminderTimelineNoticeProjection330 {
  readonly rowId: string;
  readonly rowKind: NetworkManageTimelineRowKind330;
  readonly subthreadType: "reminder" | "callback" | "manage";
  readonly title: string;
  readonly detail: string;
  readonly stateLabel: string;
  readonly tone: NetworkManageTimelineTone330;
  readonly timeLabel: string;
  readonly anchorLabel: string;
}

export interface MessageTimelineClusterProjection330 {
  readonly clusterId: string;
  readonly heading: string;
  readonly summary: string;
  readonly subthreadType: "reminder" | "callback" | "manage";
  readonly rows: readonly ReminderTimelineNoticeProjection330[];
}

export interface HubManageSettlementPanelProjection330 {
  readonly settlementResult: HubManageSettlementResult330;
  readonly heading: string;
  readonly body: string;
  readonly rows: readonly NetworkManageSummaryRow330[];
  readonly action: NetworkManageActionProjection330 | null;
}

export interface ContactRouteRepairInlineJourneyProjection330 {
  readonly repairState: ContactRouteRepairState330;
  readonly heading: string;
  readonly body: string;
  readonly rows: readonly NetworkManageSummaryRow330[];
  readonly primaryAction: NetworkManageActionProjection330 | null;
  readonly secondaryAction: NetworkManageActionProjection330 | null;
}

export interface NetworkManageReadOnlyStateProjection330 {
  readonly reason: NetworkManageReadOnlyReason330;
  readonly heading: string;
  readonly body: string;
  readonly rows: readonly NetworkManageSummaryRow330[];
}

export interface NetworkManageActionPanelProjection330 {
  readonly heading: string;
  readonly body: string;
  readonly primaryActions: readonly NetworkManageActionProjection330[];
  readonly secondaryActions: readonly NetworkManageActionProjection330[];
  readonly footerNote: string;
}

export interface PatientNetworkManageProjection330 {
  readonly scenarioId: NetworkManageScenarioId330;
  readonly pathname: string;
  readonly caseId: string;
  readonly appointmentRef: string;
  readonly threadId: string;
  readonly selectedAnchorRef: string;
  readonly messageContextLabel: string;
  readonly heading: string;
  readonly body: string;
  readonly appointmentHeading: string;
  readonly statusTone: NetworkManageStatusTone330;
  readonly appointmentRows: readonly NetworkManageSummaryRow330[];
  readonly statusRows: readonly NetworkManageSummaryRow330[];
  readonly supportRows: readonly NetworkManageSummaryRow330[];
  readonly capabilityPanel: NetworkManageCapabilityPanelProjection330;
  readonly deliveryStateCard: ReminderDeliveryStateCardProjection330;
  readonly timelineClusters: readonly MessageTimelineClusterProjection330[];
  readonly settlementPanel: HubManageSettlementPanelProjection330 | null;
  readonly contactRepairJourney: ContactRouteRepairInlineJourneyProjection330 | null;
  readonly readOnlyState: NetworkManageReadOnlyStateProjection330 | null;
  readonly actionPanel: NetworkManageActionPanelProjection330;
  readonly focusedTimelineRowId: string;
  readonly patientFacingReference: string;
  readonly liveAnnouncement: string;
}

const appointmentRowsBase = [
  { label: "Site", value: "Riverside Access Hub / Room 3" },
  { label: "When", value: "Tuesday 28 April 2026 at 10:40" },
  { label: "Clinician", value: "Dr Maya Iqbal" },
  { label: "Access", value: "Ground-floor route and hearing loop confirmed" },
  { label: "Network reference", value: "NET-APT-330-104" },
] as const satisfies readonly NetworkManageSummaryRow330[];

const supportRowsBase = [
  { label: "Return route", value: "/appointments/network/NET-APT-330-104" },
  { label: "Continuity bundle", value: "booking_manage::hub-case-104::v7" },
  { label: "Visibility posture", value: "Authenticated self-service / message-safe" },
] as const satisfies readonly NetworkManageSummaryRow330[];

function action(
  actionRef: NetworkManageActionRef330,
  label: string,
  detail: string,
  tone: "primary" | "secondary" | "warn",
  transitionScenarioId: NetworkManageScenarioId330 | null,
  announcement: string,
): NetworkManageActionProjection330 {
  return {
    actionRef,
    label,
    detail,
    tone,
    transitionScenarioId,
    announcement,
  };
}

function row(
  rowId: string,
  rowKind: NetworkManageTimelineRowKind330,
  subthreadType: "reminder" | "callback" | "manage",
  title: string,
  detail: string,
  stateLabel: string,
  tone: NetworkManageTimelineTone330,
  timeLabel: string,
  anchorLabel: string,
): ReminderTimelineNoticeProjection330 {
  return {
    rowId,
    rowKind,
    subthreadType,
    title,
    detail,
    stateLabel,
    tone,
    timeLabel,
    anchorLabel,
  };
}

function reminderCluster(rows: readonly ReminderTimelineNoticeProjection330[]) {
  return {
    clusterId: "cluster_reminder",
    heading: "Reminder and delivery chain",
    summary:
      "Reminder truth stays inside the same conversation cluster as delivery risk and repair.",
    subthreadType: "reminder",
    rows,
  } as const satisfies MessageTimelineClusterProjection330;
}

function callbackCluster(rows: readonly ReminderTimelineNoticeProjection330[]) {
  return {
    clusterId: "cluster_callback_and_manage",
    heading: "Fallback and manage settlements",
    summary:
      "Callback fallback and same-shell manage settlement stay in one timeline grammar.",
    subthreadType: "manage",
    rows,
  } as const satisfies MessageTimelineClusterProjection330;
}

const liveReminderRows = [
  row(
    "reminder_scheduled_live",
    "reminder_scheduled",
    "reminder",
    "Reminder scheduled for tomorrow morning",
    "SMS and inbox reminder are both bound to the current contact route snapshot.",
    "Scheduled",
    "reminder",
    "Today at 11:02",
    "Reminder schedule",
  ),
  row(
    "reminder_delivered_live",
    "reminder_delivered",
    "reminder",
    "Reminder route checked and delivered",
    "The latest reminder delivery evidence stayed clear, so the same reminder subthread remains calm.",
    "Delivered",
    "safe",
    "Today at 11:07",
    "Delivery evidence",
  ),
] as const satisfies readonly ReminderTimelineNoticeProjection330[];

const providerPendingManageRow = row(
  "manage_settlement_provider_pending",
  "manage_settlement",
  "manage",
  "Change request sent to the network provider",
  "The requested change is now pending authoritative provider settlement, so calm writable posture pauses in place.",
  "Provider pending",
  "warning",
  "Today at 11:15",
  "Manage settlement",
);

const appliedManageRow = row(
  "manage_settlement_applied",
  "manage_settlement",
  "manage",
  "Appointment details updated in the current shell",
  "The accessibility note was applied without leaving the manage route, and the timeline carries the result.",
  "Applied",
  "manage",
  "Today at 11:14",
  "Manage settlement",
);

const staleManageRow = row(
  "manage_settlement_stale",
  "manage_settlement",
  "manage",
  "Manage status drifted and needs refresh",
  "The last command settled against an older tuple, so the route keeps the appointment anchor but demotes actionability.",
  "Refresh required",
  "warning",
  "Today at 11:17",
  "Stale settlement",
);

const blockedManageRow = row(
  "manage_settlement_blocked",
  "manage_settlement",
  "manage",
  "Manage action blocked by contact-route trust",
  "A delivery dispute and route-authority drift now block mutation until repair rebinds this appointment promise.",
  "Blocked dependency",
  "blocked",
  "Today at 11:12",
  "Blocked manage action",
);

const reconciliationManageRow = row(
  "manage_settlement_reconciliation",
  "manage_settlement",
  "manage",
  "Supplier drift holds network manage in review",
  "The live supplier tuple no longer matches the last safe patient wording, so the route stays review-first.",
  "Reconciliation required",
  "blocked",
  "Today at 11:20",
  "Reconciliation review",
);

const identityManageRow = row(
  "manage_settlement_identity_recheck",
  "manage_settlement",
  "manage",
  "Identity recheck required before another change",
  "The current acting posture must be rebound before this appointment can accept another mutation.",
  "Identity recheck",
  "blocked",
  "Today at 11:23",
  "Identity hold",
);

const unsupportedManageRow = row(
  "manage_settlement_unsupported",
  "manage_settlement",
  "manage",
  "Reschedule is not supported for this booked network slot",
  "This supplier only accepts callback-managed changes for the current slot family, so reschedule stays honestly unavailable.",
  "Unsupported capability",
  "warning",
  "Today at 11:25",
  "Unsupported reschedule",
);

const callbackFallbackRow = row(
  "callback_fallback_notice",
  "callback_fallback",
  "callback",
  "Callback fallback remains available from this same cluster",
  "If the time no longer works or reminder trust is blocked, callback fallback stays separate from reminder notices and slot changes.",
  "Callback fallback",
  "callback",
  "Today at 11:09",
  "Callback fallback",
);

const reminderFailureRow = row(
  "reminder_failed_route_dispute",
  "reminder_failed",
  "reminder",
  "Reminder delivery failed on the verified mobile route",
  "The route is currently disputed, so reminder calmness is replaced with same-shell repair instead of a detached help redirect.",
  "Delivery failed",
  "blocked",
  "Today at 11:10",
  "Reminder failure",
);

const reminderSuppressedRow = row(
  "reminder_suppressed_pending_confirmation",
  "reminder_suppressed",
  "reminder",
  "Reminder suppressed while booking truth is still provisional",
  "The route keeps the appointment anchor visible, but no fresh reminder promise is published until confirmation truth stabilises.",
  "Suppressed",
  "warning",
  "Today at 11:05",
  "Suppressed reminder",
);

function deliveryCard(
  deliveryState: NetworkManageDeliveryState330,
  heading: string,
  body: string,
  rows: readonly NetworkManageSummaryRow330[],
): ReminderDeliveryStateCardProjection330 {
  return {
    deliveryState,
    heading,
    body,
    rows,
  };
}

function readOnlyState(
  reason: NetworkManageReadOnlyReason330,
  heading: string,
  body: string,
  rows: readonly NetworkManageSummaryRow330[],
): NetworkManageReadOnlyStateProjection330 {
  return {
    reason,
    heading,
    body,
    rows,
  };
}

function settlementPanel(
  settlementResult: HubManageSettlementResult330,
  heading: string,
  body: string,
  rows: readonly NetworkManageSummaryRow330[],
  nextAction: NetworkManageActionProjection330 | null,
): HubManageSettlementPanelProjection330 {
  return {
    settlementResult,
    heading,
    body,
    rows,
    action: nextAction,
  };
}

function repairJourney(
  repairState: ContactRouteRepairState330,
  heading: string,
  body: string,
  rows: readonly NetworkManageSummaryRow330[],
  primaryAction: NetworkManageActionProjection330 | null,
  secondaryAction: NetworkManageActionProjection330 | null,
): ContactRouteRepairInlineJourneyProjection330 {
  return {
    repairState,
    heading,
    body,
    rows,
    primaryAction,
    secondaryAction,
  };
}

function actionPanel(
  heading: string,
  body: string,
  primaryActions: readonly NetworkManageActionProjection330[],
  secondaryActions: readonly NetworkManageActionProjection330[],
  footerNote: string,
): NetworkManageActionPanelProjection330 {
  return {
    heading,
    body,
    primaryActions,
    secondaryActions,
    footerNote,
  };
}

function capabilityPanel(
  capabilityState: NetworkManageCapabilityState330,
  readOnlyMode: NetworkManageReadOnlyMode330,
  heading: string,
  body: string,
  statusRows: readonly NetworkManageSummaryRow330[],
  blockerRows: readonly NetworkManageSummaryRow330[],
  capabilityRefs: readonly HubManageActionScope330[],
): NetworkManageCapabilityPanelProjection330 {
  return {
    capabilityState,
    readOnlyMode,
    heading,
    body,
    statusRows,
    blockerRows,
    capabilityRefs,
  };
}

function buildProjection(
  scenarioId: NetworkManageScenarioId330,
  input: Omit<PatientNetworkManageProjection330, "scenarioId" | "pathname">,
): PatientNetworkManageProjection330 {
  return {
    scenarioId,
    pathname: `/bookings/network/manage/${scenarioId}`,
    ...input,
  };
}

const projectionsByScenario = {
  network_manage_330_live: buildProjection("network_manage_330_live", {
    caseId: "hub-case-104",
    appointmentRef: "NET-APT-330-104",
    threadId: "thread_network_manage_330_104",
    selectedAnchorRef: "appointment_anchor_330_104",
    messageContextLabel: "Reminder delivery thread",
    heading: "Manage your network appointment from one current timeline",
    body:
      "Summary, reminders, fallback, and manage actions all stay aligned to the current booking and communication truth.",
    appointmentHeading: "Network appointment at Riverside Access Hub",
    statusTone: "live",
    appointmentRows: appointmentRowsBase,
    statusRows: [
      { label: "Confirmation truth", value: "Appointment confirmed" },
      { label: "Manage capability", value: "Live until tuple or continuity drifts" },
      { label: "Reminder posture", value: "Scheduled from current delivery evidence" },
      { label: "Selected message context", value: "Reminder delivery thread" },
    ],
    supportRows: supportRowsBase,
    capabilityPanel: capabilityPanel(
      "live",
      "interactive",
      "Safe actions available now",
      "Every button on this route is leased from the current capability tuple, continuity evidence, and delivery trust.",
      [
        { label: "Capability lease", value: "CAP-104 / current for 12 minutes" },
        { label: "Continuity evidence", value: "booking_manage::hub-case-104::v7 / trusted" },
        { label: "Allowed actions", value: "Cancel, reschedule, callback, details update" },
      ],
      [{ label: "Current blockers", value: "None" }],
      ["cancel", "reschedule", "callback_request", "details_update"],
    ),
    deliveryStateCard: deliveryCard(
      "healthy",
      "Reminder delivery is currently healthy",
      "The latest reminder evidence is still clear, so reminder calmness remains lawful.",
      [
        { label: "Current route", value: "SMS to 07700 900123" },
        { label: "Fallback route", value: "App inbox / same thread cluster" },
        { label: "Latest evidence", value: "Delivered without dispute at 11:07" },
      ],
    ),
    timelineClusters: [
      reminderCluster(liveReminderRows),
      callbackCluster([callbackFallbackRow]),
    ],
    settlementPanel: null,
    contactRepairJourney: null,
    readOnlyState: null,
    actionPanel: actionPanel(
      "Manage actions",
      "These actions remain honest about current booking truth. A local click never pretends the change is already complete.",
      [
        action(
          "reschedule",
          "Request a different time",
          "Send a governed reschedule request and keep this route on the same appointment lineage.",
          "primary",
          "network_manage_330_provider_pending",
          "Different time requested. Provider review is pending.",
        ),
        action(
          "details_update",
          "Update access details",
          "Apply a bounded details update inside the current shell.",
          "secondary",
          "network_manage_330_applied",
          "Accessibility note updated from this same manage route.",
        ),
      ],
      [
        action(
          "callback_request",
          "Request callback instead",
          "Keep callback fallback inside the same cluster without losing this appointment anchor.",
          "secondary",
          "network_manage_330_provider_pending",
          "Callback request submitted. Provider review is pending.",
        ),
        action(
          "cancel",
          "Cancel this appointment",
          "Review the cancellation settlement inside this route.",
          "warn",
          "network_manage_330_applied",
          "Cancellation review completed in the same shell.",
        ),
      ],
      "Destructive and consequential actions settle here, not in detached toasts.",
    ),
    focusedTimelineRowId: "reminder_delivered_live",
    patientFacingReference: "Reminder route is healthy and manage is currently live.",
    liveAnnouncement: "Network manage route loaded with live capability.",
  }),
  network_manage_330_applied: buildProjection("network_manage_330_applied", {
    caseId: "hub-case-104",
    appointmentRef: "NET-APT-330-104",
    threadId: "thread_network_manage_330_104",
    selectedAnchorRef: "appointment_anchor_330_104",
    messageContextLabel: "Manage settlement",
    heading: "Your change stayed inside the current network appointment shell",
    body:
      "The route keeps the appointment anchor visible and records the applied settlement in the same timeline.",
    appointmentHeading: "Network appointment at Riverside Access Hub",
    statusTone: "pending",
    appointmentRows: appointmentRowsBase,
    statusRows: [
      { label: "Confirmation truth", value: "Appointment confirmed" },
      { label: "Manage capability", value: "Live after applied settlement" },
      { label: "Reminder posture", value: "Remains scheduled from current truth" },
      { label: "Selected message context", value: "Manage settlement" },
    ],
    supportRows: supportRowsBase,
    capabilityPanel: capabilityPanel(
      "live",
      "interactive",
      "Capability reopened after the applied settlement",
      "The current change completed safely, so this route can reopen its ordinary actions without leaving the timeline.",
      [
        { label: "Last settlement", value: "Applied to details update / revision 8" },
        { label: "Continuity evidence", value: "Still current after the applied change" },
        { label: "Allowed actions", value: "Live actions remain available" },
      ],
      [{ label: "Current blockers", value: "None" }],
      ["cancel", "reschedule", "callback_request", "details_update"],
    ),
    deliveryStateCard: deliveryCard(
      "healthy",
      "Reminder delivery remains healthy",
      "The applied details change did not detach reminders from the existing thread.",
      [
        { label: "Delivery evidence", value: "Still clear after the change" },
        { label: "Reminder cluster", value: "Same reminder thread / no new silo" },
        { label: "Callback fallback", value: "Still available if this time stops working" },
      ],
    ),
    timelineClusters: [
      reminderCluster(liveReminderRows),
      callbackCluster([appliedManageRow, callbackFallbackRow]),
    ],
    settlementPanel: settlementPanel(
      "applied",
      "Change applied in this same route",
      "The appointment stayed anchored while the accessibility note updated, so the settlement is visible here instead of a quiet success banner.",
      [
        { label: "Settlement result", value: "Applied" },
        { label: "Changed field", value: "Arrival support note / hearing loop reminder" },
        { label: "Command settlement", value: "CMD-STL-330-008" },
      ],
      action(
        "return_to_manage",
        "Return to live manage view",
        "Go back to the live action set without leaving this appointment family.",
        "primary",
        "network_manage_330_live",
        "Returned to the live network manage view.",
      ),
    ),
    contactRepairJourney: null,
    readOnlyState: null,
    actionPanel: actionPanel(
      "Next safe actions",
      "The applied settlement is durable enough to return you to the current manage posture.",
      [
        action(
          "return_to_manage",
          "Return to live manage view",
          "Go back to the live action set.",
          "primary",
          "network_manage_330_live",
          "Returned to the live network manage view.",
        ),
      ],
      [],
      "The timeline keeps the applied result visible even after the route becomes writable again.",
    ),
    focusedTimelineRowId: "manage_settlement_applied",
    patientFacingReference: "The applied settlement is visible in the same appointment timeline.",
    liveAnnouncement: "Applied settlement shown in the current manage route.",
  }),
  network_manage_330_provider_pending: buildProjection("network_manage_330_provider_pending", {
    caseId: "hub-case-104",
    appointmentRef: "NET-APT-330-104",
    threadId: "thread_network_manage_330_104",
    selectedAnchorRef: "appointment_anchor_330_104",
    messageContextLabel: "Provider review pending",
    heading: "Your requested change is now pending provider settlement",
    body:
      "The route preserves the appointment summary and current timeline context while provider-side confirmation is still outstanding.",
    appointmentHeading: "Network appointment at Riverside Access Hub",
    statusTone: "pending",
    appointmentRows: appointmentRowsBase,
    statusRows: [
      { label: "Confirmation truth", value: "Appointment confirmed / change pending" },
      { label: "Manage capability", value: "Demoted while provider review is outstanding" },
      { label: "Reminder posture", value: "Current reminders remain visible, new ones pause" },
      { label: "Selected message context", value: "Provider review pending" },
    ],
    supportRows: supportRowsBase,
    capabilityPanel: capabilityPanel(
      "stale",
      "read_only",
      "Manage is paused while the provider confirms the change",
      "This route keeps the change visible, but it will not pretend the requested change is already complete.",
      [
        { label: "Capability lease", value: "Paused on provider review" },
        { label: "Continuity evidence", value: "Current summary preserved" },
        { label: "Allowed actions", value: "Refresh and callback only" },
      ],
      [{ label: "Current blockers", value: "Provider-side confirmation still outstanding" }],
      ["callback_request"],
    ),
    deliveryStateCard: deliveryCard(
      "attention",
      "Reminder delivery is paused behind provider review",
      "Current reminder history stays visible, but new reminder calmness is deferred until the review settles.",
      [
        { label: "Last clear reminder", value: "Today at 11:07" },
        { label: "Pending review", value: "Provider review still open" },
        { label: "Promise posture", value: "No new reminder promise until review settles" },
      ],
    ),
    timelineClusters: [
      reminderCluster([liveReminderRows[0], reminderSuppressedRow]),
      callbackCluster([providerPendingManageRow, callbackFallbackRow]),
    ],
    settlementPanel: settlementPanel(
      "provider_pending",
      "Provider review is still in flight",
      "The route stays honest about the pending review and keeps the current appointment anchor visible in the meantime.",
      [
        { label: "Settlement result", value: "Provider pending" },
        { label: "Requested action", value: "Network change request sent" },
        { label: "Current next step", value: "Wait for authoritative provider confirmation" },
      ],
      action(
        "refresh_manage_status",
        "Refresh manage status",
        "Check whether the current provider review has settled.",
        "primary",
        "network_manage_330_live",
        "Manage status refreshed. Live capability restored.",
      ),
    ),
    contactRepairJourney: null,
    readOnlyState: readOnlyState(
      "confirmation_pending",
      "This route is temporarily read-only while the change settles",
      "The appointment stays visible, but writable posture pauses until provider confirmation catches up.",
      [
        { label: "Reason", value: "Provider-side confirmation pending" },
        { label: "What stays visible", value: "Appointment anchor, reminder history, callback fallback" },
        { label: "What is suppressed", value: "Fresh calm manage actions and reminder promises" },
      ],
    ),
    actionPanel: actionPanel(
      "Pending-safe actions",
      "This state keeps the request in one shell rather than ejecting you to generic support.",
      [
        action(
          "refresh_manage_status",
          "Refresh manage status",
          "Check whether provider review has completed.",
          "primary",
          "network_manage_330_live",
          "Manage status refreshed. Live capability restored.",
        ),
      ],
      [
        action(
          "callback_request",
          "Keep callback fallback ready",
          "Leave callback fallback visible if you prefer not to wait.",
          "secondary",
          null,
          "Callback fallback stays visible in the current timeline.",
        ),
      ],
      "The same timeline carries provider review, reminder suppression, and callback fallback without splitting them into separate routes.",
    ),
    focusedTimelineRowId: "manage_settlement_provider_pending",
    patientFacingReference: "Provider review is pending and the route is temporarily read-only.",
    liveAnnouncement: "Provider review is pending. Manage posture is temporarily read-only.",
  }),
  network_manage_330_contact_repair: buildProjection("network_manage_330_contact_repair", {
    caseId: "hub-case-104",
    appointmentRef: "NET-APT-330-104",
    threadId: "thread_network_manage_330_104",
    selectedAnchorRef: "appointment_anchor_330_104",
    messageContextLabel: "Reminder failure and repair",
    heading: "Repair the contact route without losing your appointment context",
    body:
      "A reminder delivery dispute now blocks change actions, but the route keeps the appointment anchor, timeline, and callback fallback in place.",
    appointmentHeading: "Network appointment at Riverside Access Hub",
    statusTone: "blocked",
    appointmentRows: appointmentRowsBase,
    statusRows: [
      { label: "Confirmation truth", value: "Appointment confirmed" },
      { label: "Manage capability", value: "Blocked by reminder-route dispute" },
      { label: "Reminder posture", value: "Delivery failure remains visible until repaired" },
      { label: "Selected message context", value: "Reminder failure and repair" },
    ],
    supportRows: supportRowsBase,
    capabilityPanel: capabilityPanel(
      "blocked",
      "read_only",
      "A degraded contact route is blocking manage actions",
      "This route freezes unsafe actions in place instead of hiding them or sending you into detached account maintenance.",
      [
        { label: "Blocked by", value: "Reachability assessment / disputed route authority" },
        { label: "Continuity evidence", value: "Appointment anchor still current" },
        { label: "Still safe", value: "Callback fallback and same-shell repair" },
      ],
      [
        { label: "Primary blocker", value: "Reminder delivery dispute reopened route trust" },
        { label: "Repair path", value: "Repair contact route from this same manage workspace" },
      ],
      [],
    ),
    deliveryStateCard: deliveryCard(
      "repair_required",
      "Reminder route needs repair",
      "The current mobile route is disputed, so reminder trust and manage mutations are both blocked until repair settles.",
      [
        { label: "Disputed route", value: "SMS to 07700 900123" },
        { label: "Latest failure", value: "Carrier reported permanent delivery failure" },
        { label: "Repair branch", value: "Rebind route and replay reminder policy" },
      ],
    ),
    timelineClusters: [
      reminderCluster([liveReminderRows[0], reminderFailureRow]),
      callbackCluster([blockedManageRow, callbackFallbackRow]),
    ],
    settlementPanel: settlementPanel(
      "blocked_dependency",
      "Manage action blocked until contact-route repair completes",
      "The route keeps the blocked action visible and explains the dependency instead of masking the failure behind generic help copy.",
      [
        { label: "Settlement result", value: "Blocked dependency" },
        { label: "Dependency", value: "Current contact route is disputed" },
        { label: "Recovery path", value: "Repair in shell, then re-open manage safely" },
      ],
      action(
        "repair_contact_route",
        "Repair contact route",
        "Rebind the reminder route without leaving this appointment shell.",
        "primary",
        "network_manage_330_live",
        "Contact route repaired. Returning to the live network manage view.",
      ),
    ),
    contactRepairJourney: repairJourney(
      "required",
      "Repair the contact route from this appointment shell",
      "The route preserves the active appointment and timeline context while you repair the disputed reminder path.",
      [
        { label: "Appointment anchor", value: "NET-APT-330-104 remains selected" },
        { label: "Message context", value: "Reminder failure row stays selected during repair" },
        { label: "After repair", value: "Live capability reopens only after the route rebinds" },
      ],
      action(
        "repair_contact_route",
        "Repair contact route",
        "Rebind the reminder route and return to live manage.",
        "primary",
        "network_manage_330_live",
        "Contact route repaired. Returning to the live network manage view.",
      ),
      action(
        "callback_request",
        "Keep callback fallback visible",
        "If repair cannot finish now, callback fallback remains available from the same cluster.",
        "secondary",
        null,
        "Callback fallback remains visible while repair is still required.",
      ),
    ),
    readOnlyState: readOnlyState(
      "stale_continuity",
      "Ordinary manage posture is frozen until repair settles",
      "The route keeps the appointment summary visible, but reminder and mutation calmness stay demoted.",
      [
        { label: "Why the route froze", value: "Reminder route trust is no longer current" },
        { label: "What stays visible", value: "Appointment anchor and reminder failure evidence" },
        { label: "What reopens later", value: "Manage actions after repair completes" },
      ],
    ),
    actionPanel: actionPanel(
      "Repair-safe actions",
      "Repair is the dominant path because callback fallback, reminders, and manage all depend on the same route trust.",
      [
        action(
          "repair_contact_route",
          "Repair contact route",
          "Repair from this same route and preserve the appointment anchor.",
          "primary",
          "network_manage_330_live",
          "Contact route repaired. Returning to the live network manage view.",
        ),
      ],
      [
        action(
          "callback_request",
          "Leave callback fallback visible",
          "Callback fallback remains available if repair must continue later.",
          "secondary",
          null,
          "Callback fallback remains visible while repair is still required.",
        ),
      ],
      "Repair must settle before ordinary reminder or manage calmness is lawful again.",
    ),
    focusedTimelineRowId: "reminder_failed_route_dispute",
    patientFacingReference: "Reminder delivery failed and contact-route repair is now required.",
    liveAnnouncement: "Contact-route repair is required before ordinary manage actions can reopen.",
  }),
  network_manage_330_stale_recoverable: buildProjection("network_manage_330_stale_recoverable", {
    caseId: "hub-case-104",
    appointmentRef: "NET-APT-330-104",
    threadId: "thread_network_manage_330_104",
    selectedAnchorRef: "appointment_anchor_330_104",
    messageContextLabel: "Refresh required",
    heading: "Refresh the current manage lease without losing your place",
    body:
      "The route keeps your appointment and selected message context visible while a stale capability is refreshed.",
    appointmentHeading: "Network appointment at Riverside Access Hub",
    statusTone: "recovery",
    appointmentRows: appointmentRowsBase,
    statusRows: [
      { label: "Confirmation truth", value: "Appointment confirmed" },
      { label: "Manage capability", value: "Stale / refresh recoverable" },
      { label: "Reminder posture", value: "Last safe reminder evidence still visible" },
      { label: "Selected message context", value: "Refresh required" },
    ],
    supportRows: supportRowsBase,
    capabilityPanel: capabilityPanel(
      "stale",
      "read_only",
      "The current manage lease has gone stale",
      "The route keeps the last safe summary visible but demotes stale actions in place until the tuple is refreshed.",
      [
        { label: "Stale reason", value: "Publication bundle drifted after the last read" },
        { label: "Continuity evidence", value: "Appointment lineage still matches" },
        { label: "Allowed actions", value: "Refresh only until the tuple catches up" },
      ],
      [{ label: "Current blockers", value: "Current manage lease is stale" }],
      [],
    ),
    deliveryStateCard: deliveryCard(
      "attention",
      "Reminder history stays visible while the route refreshes",
      "The last safe reminder evidence remains readable, but new calmness does not widen from stale route state.",
      [
        { label: "Last clear evidence", value: "Delivered at 11:07" },
        { label: "Current issue", value: "Publication bundle drift / refresh needed" },
        { label: "Recovery", value: "Refresh from the same manage workspace" },
      ],
    ),
    timelineClusters: [
      reminderCluster(liveReminderRows),
      callbackCluster([staleManageRow, callbackFallbackRow]),
    ],
    settlementPanel: settlementPanel(
      "stale_recoverable",
      "A refresh can safely recover this route",
      "The current action settled against stale route posture, so the route now requests a bounded refresh instead of widening stale calmness.",
      [
        { label: "Settlement result", value: "Stale recoverable" },
        { label: "Detected drift", value: "Publication and route tuple mismatch" },
        { label: "Recovery path", value: "Refresh from the same appointment route" },
      ],
      action(
        "refresh_manage_status",
        "Refresh manage status",
        "Recover the current manage lease without leaving this route.",
        "primary",
        "network_manage_330_live",
        "Manage status refreshed. Live capability restored.",
      ),
    ),
    contactRepairJourney: null,
    readOnlyState: readOnlyState(
      "stale_continuity",
      "The current route is preserving the last safe summary",
      "This state keeps the booked anchor and timeline visible while the capability lease is refreshed.",
      [
        { label: "Reason", value: "Stale manage capability tuple" },
        { label: "Safe to keep", value: "Booked summary and current timeline" },
        { label: "Suppressed", value: "Fresh writable posture until refresh succeeds" },
      ],
    ),
    actionPanel: actionPanel(
      "Refresh-safe actions",
      "The route keeps one explicit recovery path instead of silently hiding its stale state.",
      [
        action(
          "refresh_manage_status",
          "Refresh manage status",
          "Recover the current lease and re-open live actions.",
          "primary",
          "network_manage_330_live",
          "Manage status refreshed. Live capability restored.",
        ),
      ],
      [],
      "Refreshing should keep the current appointment anchor and selected message context intact.",
    ),
    focusedTimelineRowId: "manage_settlement_stale",
    patientFacingReference: "Manage lease is stale, but the route is recoverable from the same shell.",
    liveAnnouncement: "Manage status is stale and can be refreshed from the same route.",
  }),
  network_manage_330_read_only: buildProjection("network_manage_330_read_only", {
    caseId: "hub-case-104",
    appointmentRef: "NET-APT-330-104",
    threadId: "thread_network_manage_330_104",
    selectedAnchorRef: "appointment_anchor_330_104",
    messageContextLabel: "Confirmation still pending",
    heading: "This network appointment is still waiting for final confirmation truth",
    body:
      "The route keeps the appointment summary and timeline visible, but manage and reminder calmness stay provisional until booking truth settles.",
    appointmentHeading: "Network appointment at Riverside Access Hub",
    statusTone: "pending",
    appointmentRows: appointmentRowsBase,
    statusRows: [
      { label: "Confirmation truth", value: "Confirmation pending" },
      { label: "Manage capability", value: "Read-only until booked truth stabilises" },
      { label: "Reminder posture", value: "Suppressed while booking truth is provisional" },
      { label: "Selected message context", value: "Confirmation still pending" },
    ],
    supportRows: supportRowsBase,
    capabilityPanel: capabilityPanel(
      "blocked",
      "read_only",
      "Manage is read-only until booking truth stabilises",
      "A provisional network appointment may preserve the selected slot and current summary, but it may not pretend cancel, reschedule, or reminder calmness already exists.",
      [
        { label: "Current truth", value: "Confirmation still pending" },
        { label: "Continuity evidence", value: "Summary-only posture still current" },
        { label: "Allowed actions", value: "Refresh or wait for authoritative settlement" },
      ],
      [{ label: "Current blockers", value: "Booking confirmation truth is not stable yet" }],
      [],
    ),
    deliveryStateCard: deliveryCard(
      "suppressed",
      "Reminder publication is currently suppressed",
      "Reminder calmness is not lawful while confirmation truth is still provisional.",
      [
        { label: "Suppression cause", value: "Confirmation pending" },
        { label: "Last safe patient wording", value: "Selected slot held / waiting for confirmation" },
        { label: "Timeline posture", value: "Reminder state stays visible as suppressed" },
      ],
    ),
    timelineClusters: [
      reminderCluster([reminderSuppressedRow]),
      callbackCluster([callbackFallbackRow]),
    ],
    settlementPanel: null,
    contactRepairJourney: null,
    readOnlyState: readOnlyState(
      "confirmation_pending",
      "This route is preserving provisional truth without widening calmness",
      "The appointment stays visible, but the route honestly suppresses writable and reminder-ready posture until confirmation settles.",
      [
        { label: "Why read-only", value: "Booking confirmation is still pending" },
        { label: "What stays visible", value: "Selected appointment summary and callback fallback" },
        { label: "What is withheld", value: "Live manage actions and scheduled reminder reassurance" },
      ],
    ),
    actionPanel: actionPanel(
      "Provisional-safe actions",
      "This state stays within the same shell and keeps callback fallback visible without inventing calm confirmation.",
      [
        action(
          "refresh_manage_status",
          "Refresh manage status",
          "Check whether authoritative booking truth is now current.",
          "primary",
          "network_manage_330_live",
          "Manage status refreshed. Live capability restored.",
        ),
      ],
      [],
      "The route stays read-only rather than pretending the pending appointment is fully manageable already.",
    ),
    focusedTimelineRowId: "reminder_suppressed_pending_confirmation",
    patientFacingReference: "Confirmation is still pending and reminders remain suppressed.",
    liveAnnouncement: "This appointment is still confirmation-pending. Manage posture remains read-only.",
  }),
  network_manage_330_reconciliation_required: buildProjection(
    "network_manage_330_reconciliation_required",
    {
      caseId: "hub-case-104",
      appointmentRef: "NET-APT-330-104",
      threadId: "thread_network_manage_330_104",
      selectedAnchorRef: "appointment_anchor_330_104",
      messageContextLabel: "Supplier drift review",
      heading: "Supplier drift is holding this network appointment in review",
      body:
        "The route keeps the last safe appointment summary visible, but stale manage calmness and reminder reassurance stay blocked until review settles.",
      appointmentHeading: "Network appointment at Riverside Access Hub",
      statusTone: "blocked",
      appointmentRows: appointmentRowsBase,
      statusRows: [
        { label: "Confirmation truth", value: "Reconciliation required" },
        { label: "Manage capability", value: "Blocked by supplier drift" },
        { label: "Reminder posture", value: "Visible, but not widened into calm reassurance" },
        { label: "Selected message context", value: "Supplier drift review" },
      ],
      supportRows: supportRowsBase,
      capabilityPanel: capabilityPanel(
        "blocked",
        "read_only",
        "Supplier drift is freezing ordinary manage actions",
        "Imported or mirrored supplier truth no longer matches the last safe patient tuple, so this route keeps review posture visible instead of quietly drifting.",
        [
          { label: "Current issue", value: "Supplier drift / tuple mismatch" },
          { label: "Continuity evidence", value: "Still anchored to the same appointment lineage" },
          { label: "Allowed actions", value: "Refresh after reconciliation only" },
        ],
        [{ label: "Current blockers", value: "Reconciliation review is still open" }],
        [],
      ),
      deliveryStateCard: deliveryCard(
        "attention",
        "Reminder evidence stays visible, but not calm",
        "The route keeps reminder and fallback history visible because supplier drift may reopen patient communication obligations.",
        [
          { label: "Latest reminder evidence", value: "Delivered at 11:07 / review still open" },
          { label: "Current risk", value: "Supplier tuple drift" },
          { label: "Patient posture", value: "Recovery-first / no stale calmness" },
        ],
      ),
      timelineClusters: [
        reminderCluster(liveReminderRows),
        callbackCluster([reconciliationManageRow, callbackFallbackRow]),
      ],
      settlementPanel: settlementPanel(
        "reconciliation_required",
        "Reconciliation is required before manage can reopen",
        "The route stays inside the same appointment and timeline context while supplier review settles the live tuple.",
        [
          { label: "Settlement result", value: "Reconciliation required" },
          { label: "Review cause", value: "Supplier mirror drifted from last safe tuple" },
          { label: "Current next step", value: "Wait for authoritative reconciliation" },
        ],
        action(
          "refresh_manage_status",
          "Refresh after review",
          "Check whether reconciliation has completed.",
          "primary",
          "network_manage_330_read_only",
          "Review status refreshed. The route remains bounded and current.",
        ),
      ),
      contactRepairJourney: null,
      readOnlyState: readOnlyState(
        "supplier_drift",
        "Supplier drift has reopened review posture",
        "The route preserves the booked anchor and message history, but it cannot present ordinary manage calmness until reconciliation clears.",
        [
          { label: "Why read-only", value: "Supplier-side truth drift" },
          { label: "What stays visible", value: "Current appointment summary and message cluster" },
          { label: "What is blocked", value: "Normal manage and reminder reassurance" },
        ],
      ),
      actionPanel: actionPanel(
        "Review-safe actions",
        "This state preserves the appointment context while the reconciliation branch settles.",
        [
          action(
            "refresh_manage_status",
            "Refresh after review",
            "Check whether supplier review has completed.",
            "primary",
            "network_manage_330_read_only",
            "Review status refreshed. The route remains bounded and current.",
          ),
        ],
        [],
        "Reconciliation stays visible as timeline evidence instead of silently rotting behind a calm badge.",
      ),
      focusedTimelineRowId: "manage_settlement_reconciliation",
      patientFacingReference: "Supplier drift is holding this appointment in review.",
      liveAnnouncement: "Supplier drift review is active. Ordinary manage actions remain blocked.",
    },
  ),
  network_manage_330_identity_recheck: buildProjection("network_manage_330_identity_recheck", {
    caseId: "hub-case-104",
    appointmentRef: "NET-APT-330-104",
    threadId: "thread_network_manage_330_104",
    selectedAnchorRef: "appointment_anchor_330_104",
    messageContextLabel: "Identity recheck",
    heading: "Identity recheck is required before another appointment change",
    body:
      "The route keeps the appointment and timeline visible while identity posture is rebound for this same manage lineage.",
    appointmentHeading: "Network appointment at Riverside Access Hub",
    statusTone: "blocked",
    appointmentRows: appointmentRowsBase,
    statusRows: [
      { label: "Confirmation truth", value: "Appointment confirmed" },
      { label: "Manage capability", value: "Identity recheck required" },
      { label: "Reminder posture", value: "Visible, but manage is paused" },
      { label: "Selected message context", value: "Identity recheck" },
    ],
    supportRows: supportRowsBase,
    capabilityPanel: capabilityPanel(
      "blocked",
      "read_only",
      "Manage paused until identity posture is rebound",
      "This route preserves current context while identity assurance is rechecked. It does not silently keep live actionability from stale session state.",
      [
        { label: "Identity posture", value: "Recheck required" },
        { label: "Continuity evidence", value: "Appointment anchor remains current" },
        { label: "Allowed actions", value: "Refresh after identity recheck" },
      ],
      [{ label: "Current blockers", value: "Identity hold on the current manage lease" }],
      [],
    ),
    deliveryStateCard: deliveryCard(
      "attention",
      "Reminder history remains visible during identity recheck",
      "Message context stays intact, but no new change action is lawful until the identity posture is current again.",
      [
        { label: "Reminder evidence", value: "Latest delivery still visible" },
        { label: "Current pause", value: "Identity recheck before mutation" },
        { label: "Current route", value: "Same appointment shell / no redirect" },
      ],
    ),
    timelineClusters: [
      reminderCluster(liveReminderRows),
      callbackCluster([identityManageRow, callbackFallbackRow]),
    ],
    settlementPanel: settlementPanel(
      "identity_recheck_required",
      "Identity recheck is required before the route can mutate again",
      "The route keeps one same-shell recovery step instead of dropping you into generic support or leaving stale buttons live.",
      [
        { label: "Settlement result", value: "Identity recheck required" },
        { label: "Current blocker", value: "Session or subject posture no longer current" },
        { label: "Recovery path", value: "Refresh after identity posture is rebound" },
      ],
      action(
        "refresh_manage_status",
        "Refresh after identity recheck",
        "Recover the current manage posture after identity is rechecked.",
        "primary",
        "network_manage_330_live",
        "Manage status refreshed. Live capability restored.",
      ),
    ),
    contactRepairJourney: null,
    readOnlyState: readOnlyState(
      "identity_recheck",
      "This route is waiting for identity posture to become current again",
      "The appointment and timeline remain visible, but change actions remain blocked until identity is rebound.",
      [
        { label: "Why read-only", value: "Identity recheck required" },
        { label: "What stays visible", value: "Appointment anchor and reminder timeline" },
        { label: "What is blocked", value: "Any fresh mutation from stale session posture" },
      ],
    ),
    actionPanel: actionPanel(
      "Identity-safe actions",
      "This route keeps a bounded recovery path rather than leaving stale session-derived buttons active.",
      [
        action(
          "refresh_manage_status",
          "Refresh after identity recheck",
          "Recover the live capability after identity posture is current.",
          "primary",
          "network_manage_330_live",
          "Manage status refreshed. Live capability restored.",
        ),
      ],
      [],
      "The route preserves appointment context while identity posture catches up.",
    ),
    focusedTimelineRowId: "manage_settlement_identity_recheck",
    patientFacingReference: "Identity recheck is required before another change can be applied.",
    liveAnnouncement: "Identity recheck is required. Manage actions remain blocked until posture is current.",
  }),
  network_manage_330_unsupported_reschedule: buildProjection(
    "network_manage_330_unsupported_reschedule",
    {
      caseId: "hub-case-104",
      appointmentRef: "NET-APT-330-104",
      threadId: "thread_network_manage_330_104",
      selectedAnchorRef: "appointment_anchor_330_104",
      messageContextLabel: "Unsupported reschedule",
      heading: "Reschedule is not available for this network appointment",
      body:
        "The route keeps the appointment summary visible and offers honest fallback instead of pretending the current supplier supports self-service reschedule.",
      appointmentHeading: "Network appointment at Riverside Access Hub",
      statusTone: "recovery",
      appointmentRows: appointmentRowsBase,
      statusRows: [
        { label: "Confirmation truth", value: "Appointment confirmed" },
        { label: "Manage capability", value: "Reschedule unsupported / callback still available" },
        { label: "Reminder posture", value: "Current reminder history stays visible" },
        { label: "Selected message context", value: "Unsupported reschedule" },
      ],
      supportRows: supportRowsBase,
      capabilityPanel: capabilityPanel(
        "blocked",
        "read_only",
        "Reschedule is unsupported for the current booked slot family",
        "This route keeps unsupported capability explicit, so the patient sees the real fallback instead of a dead button or generic help redirect.",
        [
          { label: "Unsupported action", value: "Reschedule" },
          { label: "Still supported", value: "Callback fallback and support-led change" },
          { label: "Continuity evidence", value: "Current summary remains valid" },
        ],
        [{ label: "Current blockers", value: "Supplier does not support self-service reschedule" }],
        ["callback_request"],
      ),
      deliveryStateCard: deliveryCard(
        "healthy",
        "Reminder history remains current",
        "Reminder delivery still belongs to the same cluster even though reschedule is unsupported.",
        [
          { label: "Latest reminder", value: "Delivered successfully" },
          { label: "Unsupported action", value: "Reschedule only" },
          { label: "Fallback path", value: "Callback fallback in the same cluster" },
        ],
      ),
      timelineClusters: [
        reminderCluster(liveReminderRows),
        callbackCluster([unsupportedManageRow, callbackFallbackRow]),
      ],
      settlementPanel: settlementPanel(
        "unsupported_capability",
        "This supplier requires callback-managed changes for this slot",
        "The route stays honest about the unsupported action and points to callback fallback without losing appointment context.",
        [
          { label: "Settlement result", value: "Unsupported capability" },
          { label: "Unsupported action", value: "Reschedule" },
          { label: "Fallback path", value: "Request callback from this same route" },
        ],
        action(
          "callback_request",
          "Request callback instead",
          "Leave the current appointment anchor intact and switch to callback fallback.",
          "primary",
          "network_manage_330_provider_pending",
          "Callback request submitted. Provider review is pending.",
        ),
      ),
      contactRepairJourney: null,
      readOnlyState: readOnlyState(
        "unsupported_capability",
        "Unsupported actions stay explicit inside the same route",
        "The route keeps the appointment and message history visible while demoting the unsupported action and preserving a truthful fallback.",
        [
          { label: "Why read-only", value: "Reschedule is unsupported here" },
          { label: "What stays visible", value: "Appointment summary and reminder history" },
          { label: "Fallback", value: "Callback fallback in the same cluster" },
        ],
      ),
      actionPanel: actionPanel(
        "Fallback-safe actions",
        "Unsupported capability is handled as a same-shell settlement, not as a dead end.",
        [
          action(
            "callback_request",
            "Request callback instead",
            "Keep the appointment anchor and request a callback-managed change.",
            "primary",
            "network_manage_330_provider_pending",
            "Callback request submitted. Provider review is pending.",
          ),
        ],
        [
          action(
            "return_to_manage",
            "Return to live manage overview",
            "Go back to the broader manage overview for this appointment.",
            "secondary",
            "network_manage_330_live",
            "Returned to the live network manage view.",
          ),
        ],
        "Unsupported capability stays visible in the timeline so the patient can understand why callback fallback is the next safe action.",
      ),
      focusedTimelineRowId: "manage_settlement_unsupported",
      patientFacingReference: "Reschedule is unsupported here, but callback fallback remains available.",
      liveAnnouncement: "Reschedule is unsupported for this appointment. Callback fallback remains available.",
    },
  ),
} as const satisfies Record<NetworkManageScenarioId330, PatientNetworkManageProjection330>;

export function resolvePatientNetworkManageProjection330(
  scenarioId: NetworkManageScenarioId330,
): PatientNetworkManageProjection330 {
  return projectionsByScenario[scenarioId];
}

export function resolvePatientNetworkManageScenarioId330(
  pathname: string,
): NetworkManageScenarioId330 | null {
  const match = pathname.match(/^\/bookings\/network\/manage\/(network_manage_330_[a-z_]+)\/?$/u);
  if (!match?.[1]) {
    return null;
  }
  switch (match[1] as NetworkManageScenarioId330) {
    case "network_manage_330_live":
    case "network_manage_330_applied":
    case "network_manage_330_provider_pending":
    case "network_manage_330_contact_repair":
    case "network_manage_330_stale_recoverable":
    case "network_manage_330_read_only":
    case "network_manage_330_reconciliation_required":
    case "network_manage_330_identity_recheck":
    case "network_manage_330_unsupported_reschedule":
      return match[1] as NetworkManageScenarioId330;
    default:
      return null;
  }
}

export function resolvePatientNetworkManagePath330(
  scenarioId: NetworkManageScenarioId330,
): string {
  return `/bookings/network/manage/${scenarioId}`;
}

export function resolveNetworkManageScenarioFromConfirmation330(
  scenarioId: NetworkConfirmationScenarioId329,
): NetworkManageScenarioId330 {
  switch (scenarioId) {
    case "network_confirmation_329_practice_informed":
    case "network_confirmation_329_practice_acknowledged":
      return "network_manage_330_live";
    case "network_confirmation_329_disputed":
    case "network_confirmation_329_supplier_drift":
      return "network_manage_330_reconciliation_required";
    case "network_confirmation_329_pending":
    default:
      return "network_manage_330_read_only";
  }
}
