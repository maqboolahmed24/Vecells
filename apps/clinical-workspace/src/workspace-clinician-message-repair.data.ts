import type { RuntimeScenario } from "@vecells/persistent-shell";
import {
  requireCase,
  workspaceFixtureSafePatientLabel,
  type StaffQueueCase,
} from "./workspace-shell.data";

export type ClinicianMessageStage = "detail" | "dispute" | "repair";
export type ClinicianMessageMutationState =
  | "live"
  | "stale_recoverable"
  | "recovery_only"
  | "blocked";
export type ClinicianMessageThreadState =
  | "drafted"
  | "sent"
  | "transport_accepted"
  | "evidence_delivered"
  | "disputed"
  | "repair_pending"
  | "closed";
export type ClinicianMessageRepairKind =
  | "none"
  | "resend"
  | "reissue"
  | "channel_change"
  | "attachment_recovery"
  | "callback_fallback"
  | "route_repair";
export type ClinicianMessageExpectationState =
  | "reply_needed"
  | "awaiting_review"
  | "reviewed"
  | "delivery_repair_required"
  | "closed";
export type ClinicianMessageResolutionGateState =
  | "awaiting_delivery_evidence"
  | "reply_window_open"
  | "repair_route"
  | "closed";
export type ClinicianMessageReceiptPosture =
  | "draft_local"
  | "provider_accepted"
  | "durable_delivery"
  | "manual_attestation"
  | "contradictory_signal"
  | "failed"
  | "expired";
export type ClinicianMessageChronologyKind =
  | "draft"
  | "dispatch"
  | "receipt"
  | "patient_reply"
  | "repair"
  | "support";
export type ClinicianMessageDeliveryTruthStep =
  | "drafted"
  | "sent"
  | "transport_accepted"
  | "evidence_delivered"
  | "disputed"
  | "repair_pending"
  | "closed";

interface ClinicianMessageChronologySeed {
  eventId: string;
  anchorRef: string;
  groupLabel: string;
  kind: ClinicianMessageChronologyKind;
  occurredAtLabel: string;
  actorLabel: string;
  headline: string;
  summary: string;
  receiptPosture: ClinicianMessageReceiptPosture;
  evidenceStrengthLabel: string;
  dispatchEnvelopeRef: string;
  deliveryEvidenceBundleRef: string | null;
  expectationEnvelopeRef: string;
  repairHint: string | null;
  selectedByDefault?: boolean;
}

interface ClinicianMessageRepairActionSeed {
  actionKey: Exclude<ClinicianMessageRepairKind, "none">;
  label: string;
  summary: string;
  enabled: boolean;
  blockedReason: string | null;
  requiredChecks: readonly string[];
}

interface ClinicianMessageSeed {
  taskId: string;
  threadId: string;
  requestLabel: string;
  patientLabel: string;
  participantsLabel: string;
  routeLabel: string;
  threadState: ClinicianMessageThreadState;
  repairKind: ClinicianMessageRepairKind;
  expectationState: ClinicianMessageExpectationState;
  resolutionGateState: ClinicianMessageResolutionGateState;
  latestReceiptPosture: ClinicianMessageReceiptPosture;
  latestDeliveryTruth: ClinicianMessageDeliveryTruthStep;
  latestDispatchEnvelopeRef: string;
  latestDeliveryEvidenceBundleRef: string | null;
  latestExpectationEnvelopeRef: string;
  latestResolutionGateRef: string;
  threadTupleRef: string;
  continuityKey: string;
  mastheadSummary: string;
  riskSummary: string;
  worklistSummary: string;
  dueLabel: string;
  nextAllowedActionLabel: string;
  currentOwnerLabel: string;
  repairScopeSummary: string;
  contradictoryReceiptSummary: string | null;
  callbackFallbackSummary: string | null;
  attachmentRecoverySummary: string | null;
  attachmentRecoveryCheckpointRef: string | null;
  attachmentRecoveryArtifactLabel: string | null;
  chronology: readonly ClinicianMessageChronologySeed[];
  repairActions: readonly ClinicianMessageRepairActionSeed[];
}

export interface ClinicianMessageWorklistRowProjection {
  rowId: string;
  taskId: string;
  threadId: string;
  anchorRef: string;
  patientLabel: string;
  requestLabel: string;
  routeLabel: string;
  threadState: ClinicianMessageThreadState;
  repairKind: ClinicianMessageRepairKind;
  expectationState: ClinicianMessageExpectationState;
  resolutionGateState: ClinicianMessageResolutionGateState;
  latestReceiptPosture: ClinicianMessageReceiptPosture;
  latestDeliveryTruth: ClinicianMessageDeliveryTruthStep;
  summary: string;
  dueLabel: string;
  nextAllowedActionLabel: string;
  selected: boolean;
}

export interface MessageThreadMastheadProjection {
  mastheadId: string;
  threadId: string;
  threadTupleRef: string;
  requestLabel: string;
  patientLabel: string;
  participantsLabel: string;
  routeLabel: string;
  expectationState: ClinicianMessageExpectationState;
  resolutionGateState: ClinicianMessageResolutionGateState;
  latestReceiptPosture: ClinicianMessageReceiptPosture;
  latestDeliveryTruth: ClinicianMessageDeliveryTruthStep;
  latestDispatchEnvelopeRef: string;
  latestDeliveryEvidenceBundleRef: string | null;
  latestExpectationEnvelopeRef: string;
  latestResolutionGateRef: string;
  headline: string;
  summary: string;
  riskSummary: string;
}

export interface DeliveryTruthStepProjection {
  stepId: string;
  stepKey: ClinicianMessageDeliveryTruthStep;
  label: string;
  state: "complete" | "current" | "pending" | "blocked";
  evidenceLabel: string;
}

export interface DeliveryTruthLadderProjection {
  ladderId: string;
  currentTruth: ClinicianMessageDeliveryTruthStep;
  latestReceiptPosture: ClinicianMessageReceiptPosture;
  latestDeliveryEvidenceBundleRef: string | null;
  steps: readonly DeliveryTruthStepProjection[];
}

export interface ClinicianMessageChronologyEventProjection {
  rowId: string;
  anchorRef: string;
  kind: ClinicianMessageChronologyKind;
  occurredAtLabel: string;
  actorLabel: string;
  headline: string;
  summary: string;
  receiptPosture: ClinicianMessageReceiptPosture;
  evidenceStrengthLabel: string;
  dispatchEnvelopeRef: string;
  deliveryEvidenceBundleRef: string | null;
  expectationEnvelopeRef: string;
  repairHint: string | null;
  selected: boolean;
}

export interface ClinicianMessageChronologyGroupProjection {
  groupId: string;
  label: string;
  summary: string;
  rows: readonly ClinicianMessageChronologyEventProjection[];
}

export interface DeliveryDisputeStageProjection {
  stageId: string;
  visible: boolean;
  stageState: "hidden" | "review_live" | "review_frozen";
  selectedEventAnchorRef: string | null;
  contradictoryReceiptSummary: string | null;
  freezeReason: string | null;
  pinnedRouteLabel: string;
  pinnedEvidenceRefs: readonly string[];
  nextRepairLabel: string;
  callbackFallbackSummary: string | null;
}

export interface MessageRepairActionProjection {
  actionId: string;
  actionKey: Exclude<ClinicianMessageRepairKind, "none">;
  label: string;
  summary: string;
  enabled: boolean;
  blockedReason: string | null;
  requiredChecks: readonly string[];
}

export interface AttachmentRecoveryPromptProjection {
  promptId: string;
  visible: boolean;
  headline: string;
  summary: string;
  recoveryArtifactLabel: string | null;
  checkpointRef: string | null;
  actionLabel: string;
}

export interface MessageRepairWorkbenchProjection {
  workbenchId: string;
  stageState: "live" | "stale_recoverable" | "recovery_only" | "blocked";
  repairKind: ClinicianMessageRepairKind;
  dominantActionLabel: string;
  summary: string;
  routeSafetyLabel: string;
  selectedActionKey: Exclude<ClinicianMessageRepairKind, "none">;
  actions: readonly MessageRepairActionProjection[];
  attachmentRecoveryPrompt: AttachmentRecoveryPromptProjection | null;
}

export interface ClinicianMessageDetailSurfaceProjection {
  surfaceId: string;
  taskId: string;
  threadId: string;
  selectedStage: ClinicianMessageStage;
  mutationState: ClinicianMessageMutationState;
  threadState: ClinicianMessageThreadState;
  repairKind: ClinicianMessageRepairKind;
  latestDeliveryTruth: ClinicianMessageDeliveryTruthStep;
  threadTupleRef: string;
  continuityKey: string;
  masthead: MessageThreadMastheadProjection;
  deliveryTruthLadder: DeliveryTruthLadderProjection;
  chronologyGroups: readonly ClinicianMessageChronologyGroupProjection[];
  deliveryDisputeStage: DeliveryDisputeStageProjection;
  repairWorkbench: MessageRepairWorkbenchProjection;
  sourceSummaryPoints: readonly string[];
}

export interface ClinicianMessageWorkbenchProjection {
  routeId: string;
  route: "/workspace/messages";
  visualMode: "Thread_Repair_Studio";
  continuityKey: string;
  queueHealthSummary: string;
  lagSummary: string;
  rowCount: number;
  selectedTaskId: string;
  selectedStage: ClinicianMessageStage;
  mutationState: ClinicianMessageMutationState;
  rows: readonly ClinicianMessageWorklistRowProjection[];
  detailSurface: ClinicianMessageDetailSurfaceProjection;
}

const deliveryTruthSteps: readonly ClinicianMessageDeliveryTruthStep[] = [
  "drafted",
  "sent",
  "transport_accepted",
  "evidence_delivered",
  "disputed",
  "repair_pending",
  "closed",
] as const;

const clinicianMessageSeeds: readonly ClinicianMessageSeed[] = [
  {
    taskId: "task-208",
    threadId: "clinician_message_thread::task-208",
    requestLabel: "Booking-intent secure message",
    patientLabel: "Noah Bennett",
    participantsLabel: "Clinician author, approver, patient",
    routeLabel: "Secure message to mobile ending 0317",
    threadState: "transport_accepted",
    repairKind: "none",
    expectationState: "awaiting_review",
    resolutionGateState: "awaiting_delivery_evidence",
    latestReceiptPosture: "provider_accepted",
    latestDeliveryTruth: "transport_accepted",
    latestDispatchEnvelopeRef: "message_dispatch_envelope::task-208::dispatch-2",
    latestDeliveryEvidenceBundleRef: null,
    latestExpectationEnvelopeRef: "thread_expectation_envelope::task-208::current",
    latestResolutionGateRef: "thread_resolution_gate::task-208::current",
    threadTupleRef: "thread_tuple::task-208::dispatch-2",
    continuityKey: "workspace_message_thread::task-208",
    mastheadSummary:
      "Provider acceptance is current, but no evidence bundle has settled durable delivery for this booking-intent thread.",
    riskSummary:
      "Transport accepted is not delivery truth. Keep reassurance and resend controls fenced until delivery evidence or expiry lands.",
    worklistSummary:
      "The outbound secure message is accepted by the provider only. Staff must not treat it as delivered or quietly resend it.",
    dueLabel: "Delivery evidence pending",
    nextAllowedActionLabel: "Hold for delivery evidence",
    currentOwnerLabel: "Booking review lane",
    repairScopeSummary:
      "No repair route is legal yet because the current dispatch envelope is still awaiting authoritative delivery evidence.",
    contradictoryReceiptSummary: null,
    callbackFallbackSummary: null,
    attachmentRecoverySummary: null,
    attachmentRecoveryCheckpointRef: null,
    attachmentRecoveryArtifactLabel: null,
    chronology: [
      {
        eventId: "message-208-draft",
        anchorRef: "message-event-task-208-draft",
        groupLabel: "Outbound thread",
        kind: "draft",
        occurredAtLabel: "12:48",
        actorLabel: "Clinician draft",
        headline: "Draft preserved against the current approval frame",
        summary:
          "The draft is bound to the current approval-required booking path and cannot drift onto a newer thread version silently.",
        receiptPosture: "draft_local",
        evidenceStrengthLabel: "Local draft only",
        dispatchEnvelopeRef: "message_dispatch_envelope::task-208::draft",
        deliveryEvidenceBundleRef: null,
        expectationEnvelopeRef: "thread_expectation_envelope::task-208::draft",
        repairHint: null,
      },
      {
        eventId: "message-208-send",
        anchorRef: "message-event-task-208-send",
        groupLabel: "Outbound thread",
        kind: "dispatch",
        occurredAtLabel: "13:02",
        actorLabel: "Dispatch envelope",
        headline: "Approved message dispatched",
        summary:
          "One immutable dispatch envelope was issued against the current thread version after approval.",
        receiptPosture: "provider_accepted",
        evidenceStrengthLabel: "Transport accepted only",
        dispatchEnvelopeRef: "message_dispatch_envelope::task-208::dispatch-2",
        deliveryEvidenceBundleRef: null,
        expectationEnvelopeRef: "thread_expectation_envelope::task-208::current",
        repairHint: "Do not mark delivered or reissue while this envelope is still awaiting delivery truth.",
      },
      {
        eventId: "message-208-receipt",
        anchorRef: "message-event-task-208-receipt",
        groupLabel: "Receipts and expectation",
        kind: "receipt",
        occurredAtLabel: "13:06",
        actorLabel: "Provider receipt checkpoint",
        headline: "Provider acceptance recorded without delivery proof",
        summary:
          "The provider accepted the message, but there is still no MessageDeliveryEvidenceBundle proving delivery or expiry.",
        receiptPosture: "provider_accepted",
        evidenceStrengthLabel: "No delivery evidence bundle",
        dispatchEnvelopeRef: "message_dispatch_envelope::task-208::dispatch-2",
        deliveryEvidenceBundleRef: null,
        expectationEnvelopeRef: "thread_expectation_envelope::task-208::current",
        repairHint: "Await direct provider receipt, durable channel acknowledgement, or expiry before widening the next step.",
        selectedByDefault: true,
      },
    ],
    repairActions: [
      {
        actionKey: "resend",
        label: "Resend current message",
        summary: "Reuse the current wording only if delivery has actually failed or expired.",
        enabled: false,
        blockedReason:
          "The current gate is still awaiting delivery evidence for the active dispatch envelope.",
        requiredChecks: [],
      },
      {
        actionKey: "reissue",
        label: "Reissue new dispatch envelope",
        summary: "Only legal after the current delivery chain settles as failed, expired, or disputed.",
        enabled: false,
        blockedReason:
          "Reissue would outrun the live dispatch chain and imply a second send before the first one settles.",
        requiredChecks: [],
      },
      {
        actionKey: "channel_change",
        label: "Switch channel",
        summary: "Move the thread to a different legal route when messaging is no longer safe.",
        enabled: false,
        blockedReason:
          "Channel change is not legal while the existing route is still awaiting delivery truth.",
        requiredChecks: [],
      },
      {
        actionKey: "attachment_recovery",
        label: "Recover attachment set",
        summary: "Only required when the current repair scope proves attachment loss or stripping.",
        enabled: false,
        blockedReason: "No attachment-loss signal exists on the current dispatch envelope.",
        requiredChecks: [],
      },
      {
        actionKey: "route_repair",
        label: "Open route repair",
        summary: "Promote route repair when reachability or trust drift blocks the current route.",
        enabled: false,
        blockedReason: "Reachability and trust posture still allow the current message route.",
        requiredChecks: [],
      },
      {
        actionKey: "callback_fallback",
        label: "Fall back to callback",
        summary: "Use callback only if messaging is no longer safe or currently legal.",
        enabled: false,
        blockedReason: "Messaging remains the governed route until delivery truth proves otherwise.",
        requiredChecks: [],
      },
    ],
  },
  {
    taskId: "task-311",
    threadId: "clinician_message_thread::task-311",
    requestLabel: "Returned-evidence review update",
    patientLabel: "Asha Patel",
    participantsLabel: "Clinician author, patient",
    routeLabel: "Secure message to mobile ending 4421",
    threadState: "evidence_delivered",
    repairKind: "none",
    expectationState: "awaiting_review",
    resolutionGateState: "reply_window_open",
    latestReceiptPosture: "durable_delivery",
    latestDeliveryTruth: "evidence_delivered",
    latestDispatchEnvelopeRef: "message_dispatch_envelope::task-311::dispatch-3",
    latestDeliveryEvidenceBundleRef: "message_delivery_evidence_bundle::task-311::dispatch-3",
    latestExpectationEnvelopeRef: "thread_expectation_envelope::task-311::current",
    latestResolutionGateRef: "thread_resolution_gate::task-311::current",
    threadTupleRef: "thread_tuple::task-311::dispatch-3",
    continuityKey: "workspace_message_thread::task-311",
    mastheadSummary:
      "Delivery is evidence-backed and the patient-visible expectation envelope remains aligned with the current review window.",
    riskSummary:
      "The thread is calm and evidence-backed. Keep chronology visible, but no repair path is currently dominant.",
    worklistSummary:
      "This thread shows the quiet baseline: evidence-delivered, review pending, and no repair or contradictory receipt drift.",
    dueLabel: "Reply window open",
    nextAllowedActionLabel: "Review the current thread",
    currentOwnerLabel: "Returned-evidence review",
    repairScopeSummary: "No repair scope is currently active on this thread.",
    contradictoryReceiptSummary: null,
    callbackFallbackSummary: null,
    attachmentRecoverySummary: null,
    attachmentRecoveryCheckpointRef: null,
    attachmentRecoveryArtifactLabel: null,
    chronology: [
      {
        eventId: "message-311-send",
        anchorRef: "message-event-task-311-send",
        groupLabel: "Outbound thread",
        kind: "dispatch",
        occurredAtLabel: "08:42",
        actorLabel: "Dispatch envelope",
        headline: "Clinician update dispatched",
        summary:
          "The message was dispatched from the current review version after returned evidence arrived.",
        receiptPosture: "provider_accepted",
        evidenceStrengthLabel: "Transport accepted",
        dispatchEnvelopeRef: "message_dispatch_envelope::task-311::dispatch-3",
        deliveryEvidenceBundleRef: null,
        expectationEnvelopeRef: "thread_expectation_envelope::task-311::current",
        repairHint: null,
      },
      {
        eventId: "message-311-delivered",
        anchorRef: "message-event-task-311-delivered",
        groupLabel: "Receipts and expectation",
        kind: "receipt",
        occurredAtLabel: "08:45",
        actorLabel: "Delivery evidence bundle",
        headline: "Durable delivery evidence attached",
        summary:
          "The message now has a current MessageDeliveryEvidenceBundle, so the thread may appear delivered without optimism.",
        receiptPosture: "durable_delivery",
        evidenceStrengthLabel: "Direct provider receipt",
        dispatchEnvelopeRef: "message_dispatch_envelope::task-311::dispatch-3",
        deliveryEvidenceBundleRef: "message_delivery_evidence_bundle::task-311::dispatch-3",
        expectationEnvelopeRef: "thread_expectation_envelope::task-311::current",
        repairHint: null,
      },
      {
        eventId: "message-311-awaiting-review",
        anchorRef: "message-event-task-311-awaiting-review",
        groupLabel: "Receipts and expectation",
        kind: "patient_reply",
        occurredAtLabel: "09:02",
        actorLabel: "Expectation envelope",
        headline: "Awaiting clinician review remains current",
        summary:
          "The patient-facing expectation stays aligned with the delivered thread and does not overstate completion.",
        receiptPosture: "durable_delivery",
        evidenceStrengthLabel: "Expectation revision current",
        dispatchEnvelopeRef: "message_dispatch_envelope::task-311::dispatch-3",
        deliveryEvidenceBundleRef: "message_delivery_evidence_bundle::task-311::dispatch-3",
        expectationEnvelopeRef: "thread_expectation_envelope::task-311::current",
        repairHint: null,
        selectedByDefault: true,
      },
    ],
    repairActions: [
      {
        actionKey: "resend",
        label: "Resend current message",
        summary: "Resend is not legal when current delivery truth is already evidence-backed.",
        enabled: false,
        blockedReason: "The current delivery bundle is durable, so resend would create false duplicate reassurance.",
        requiredChecks: [],
      },
      {
        actionKey: "reissue",
        label: "Reissue new dispatch envelope",
        summary: "Reissue only after closure, repair routing, or an explicit reopen decision.",
        enabled: false,
        blockedReason: "The current thread is stable and awaiting review, not reopened for a fresh dispatch.",
        requiredChecks: [],
      },
      {
        actionKey: "channel_change",
        label: "Switch channel",
        summary: "Channel change is reserved for delivery repair or policy-driven route change.",
        enabled: false,
        blockedReason: "No route risk or release freeze currently blocks the message channel.",
        requiredChecks: [],
      },
      {
        actionKey: "attachment_recovery",
        label: "Recover attachment set",
        summary: "Attachment recovery is available only when the delivery chain proves missing or stripped artifacts.",
        enabled: false,
        blockedReason: "The current message bundle does not carry attachment-loss evidence.",
        requiredChecks: [],
      },
      {
        actionKey: "route_repair",
        label: "Open route repair",
        summary: "Route repair stays dormant until reachability or release posture drifts.",
        enabled: false,
        blockedReason: "The current route remains trusted and evidence-backed.",
        requiredChecks: [],
      },
      {
        actionKey: "callback_fallback",
        label: "Fall back to callback",
        summary: "Callback fallback is not currently required.",
        enabled: false,
        blockedReason: "The current secure message path remains valid and readable.",
        requiredChecks: [],
      },
    ],
  },
  {
    taskId: "task-412",
    threadId: "clinician_message_thread::task-412",
    requestLabel: "Urgent inhaler safety secure message",
    patientLabel: "Elena Morris",
    participantsLabel: "Clinician author, support repair reviewer, patient",
    routeLabel: "Secure message route disputed for mobile ending 6631",
    threadState: "disputed",
    repairKind: "route_repair",
    expectationState: "delivery_repair_required",
    resolutionGateState: "repair_route",
    latestReceiptPosture: "contradictory_signal",
    latestDeliveryTruth: "disputed",
    latestDispatchEnvelopeRef: "message_dispatch_envelope::task-412::dispatch-4",
    latestDeliveryEvidenceBundleRef: "message_delivery_evidence_bundle::task-412::dispatch-4",
    latestExpectationEnvelopeRef: "thread_expectation_envelope::task-412::repair",
    latestResolutionGateRef: "thread_resolution_gate::task-412::repair",
    threadTupleRef: "thread_tuple::task-412::dispatch-4",
    continuityKey: "workspace_message_thread::task-412",
    mastheadSummary:
      "The thread holds contradictory same-fence receipts. Delivery truth is frozen into recovery posture until route repair or fallback settles.",
    riskSummary:
      "One signal claims delivery and another proves the patient never received the secure message. The UI must freeze quiet success and keep repair dominant.",
    worklistSummary:
      "Contradictory same-fence receipts block calm delivery. The thread stays visible, but mutation must freeze into bounded repair.",
    dueLabel: "Contradictory delivery evidence",
    nextAllowedActionLabel: "Route repair or callback fallback",
    currentOwnerLabel: "Urgent message repair lane",
    repairScopeSummary:
      "Repair must remain in-shell so the disputed route, message chronology, and current evidence never leave the operator’s view.",
    contradictoryReceiptSummary:
      "Provider acceptance and manual attestation implied delivery, but the patient later confirmed the secure message never arrived on the governed route.",
    callbackFallbackSummary:
      "Callback fallback remains a legal bounded action because messaging is not currently a safe or trusted route for this urgent thread.",
    attachmentRecoverySummary: null,
    attachmentRecoveryCheckpointRef: null,
    attachmentRecoveryArtifactLabel: null,
    chronology: [
      {
        eventId: "message-412-send",
        anchorRef: "message-event-task-412-send",
        groupLabel: "Outbound thread",
        kind: "dispatch",
        occurredAtLabel: "09:12",
        actorLabel: "Dispatch envelope",
        headline: "Urgent secure message dispatched",
        summary:
          "The message left the task shell through one immutable dispatch envelope tied to the urgent review version.",
        receiptPosture: "provider_accepted",
        evidenceStrengthLabel: "Transport accepted",
        dispatchEnvelopeRef: "message_dispatch_envelope::task-412::dispatch-4",
        deliveryEvidenceBundleRef: null,
        expectationEnvelopeRef: "thread_expectation_envelope::task-412::send",
        repairHint: null,
      },
      {
        eventId: "message-412-attestation",
        anchorRef: "message-event-task-412-attestation",
        groupLabel: "Receipts and dispute",
        kind: "receipt",
        occurredAtLabel: "09:16",
        actorLabel: "Manual attestation",
        headline: "Support attestation suggested delivery",
        summary:
          "A manual attestation widened the delivery posture briefly, but it was not strong enough to survive contradictory same-fence evidence.",
        receiptPosture: "manual_attestation",
        evidenceStrengthLabel: "Manual attestation only",
        dispatchEnvelopeRef: "message_dispatch_envelope::task-412::dispatch-4",
        deliveryEvidenceBundleRef: "message_delivery_evidence_bundle::task-412::dispatch-4",
        expectationEnvelopeRef: "thread_expectation_envelope::task-412::send",
        repairHint: "Keep this visible as context, but do not treat it as settled delivery truth.",
      },
      {
        eventId: "message-412-contradiction",
        anchorRef: "message-event-task-412-contradiction",
        groupLabel: "Receipts and dispute",
        kind: "support",
        occurredAtLabel: "09:21",
        actorLabel: "Contradictory receipt review",
        headline: "Contradictory same-fence signal landed",
        summary:
          "A later signal on the same dispatch fence proved the patient never saw the message on the current route.",
        receiptPosture: "contradictory_signal",
        evidenceStrengthLabel: "Contradictory signal",
        dispatchEnvelopeRef: "message_dispatch_envelope::task-412::dispatch-4",
        deliveryEvidenceBundleRef: "message_delivery_evidence_bundle::task-412::dispatch-4",
        expectationEnvelopeRef: "thread_expectation_envelope::task-412::repair",
        repairHint: "Freeze success posture immediately and promote route repair or callback fallback.",
        selectedByDefault: true,
      },
      {
        eventId: "message-412-repair",
        anchorRef: "message-event-task-412-repair",
        groupLabel: "Repair scope",
        kind: "repair",
        occurredAtLabel: "09:27",
        actorLabel: "Reachability repair",
        headline: "Repair route and callback fallback prepared",
        summary:
          "The same shell now exposes route repair, channel reassessment, and callback fallback without hiding the disputed chronology.",
        receiptPosture: "contradictory_signal",
        evidenceStrengthLabel: "Repair posture current",
        dispatchEnvelopeRef: "message_dispatch_envelope::task-412::dispatch-4",
        deliveryEvidenceBundleRef: "message_delivery_evidence_bundle::task-412::dispatch-4",
        expectationEnvelopeRef: "thread_expectation_envelope::task-412::repair",
        repairHint: "Use a legal repair path only after acknowledging the contradictory same-fence evidence.",
      },
    ],
    repairActions: [
      {
        actionKey: "route_repair",
        label: "Open route repair",
        summary: "Repair the disputed route while the current thread remains visible and frozen against stale success.",
        enabled: true,
        blockedReason: null,
        requiredChecks: [
          "Contradictory same-fence evidence reviewed",
          "Current repair checkpoint acknowledged",
        ],
      },
      {
        actionKey: "callback_fallback",
        label: "Switch to callback fallback",
        summary: "Use callback because urgent communication can no longer trust the current message route.",
        enabled: true,
        blockedReason: null,
        requiredChecks: ["Contradictory same-fence evidence reviewed"],
      },
      {
        actionKey: "channel_change",
        label: "Switch channel",
        summary: "Channel change stays visible, but it cannot proceed until the live contradictory tuple is repaired.",
        enabled: false,
        blockedReason:
          "The current tuple is stale-recoverable. Resolve the contradictory same-fence evidence before switching channel.",
        requiredChecks: [],
      },
      {
        actionKey: "resend",
        label: "Resend current message",
        summary: "Resend would silently outrun the contradictory chain and is therefore blocked.",
        enabled: false,
        blockedReason: "The current dispatch envelope is disputed and must not be quietly resent.",
        requiredChecks: [],
      },
      {
        actionKey: "reissue",
        label: "Reissue new dispatch envelope",
        summary: "A new dispatch is legal only after repair routing or explicit reopen settles.",
        enabled: false,
        blockedReason:
          "The current ThreadResolutionGate has not yet authorized a fresh dispatch envelope.",
        requiredChecks: [],
      },
      {
        actionKey: "attachment_recovery",
        label: "Recover attachment set",
        summary: "Attachment recovery is not the current failure mode on this urgent thread.",
        enabled: false,
        blockedReason: "The dominant failure is route contradiction, not attachment loss.",
        requiredChecks: [],
      },
    ],
  },
  {
    taskId: "task-118",
    threadId: "clinician_message_thread::task-118",
    requestLabel: "Ownership clarification secure message",
    patientLabel: "Maya Foster",
    participantsLabel: "Clinician author, support repair reviewer, patient",
    routeLabel: "Secure message to mobile ending 2198 with image attachment",
    threadState: "repair_pending",
    repairKind: "attachment_recovery",
    expectationState: "delivery_repair_required",
    resolutionGateState: "repair_route",
    latestReceiptPosture: "failed",
    latestDeliveryTruth: "repair_pending",
    latestDispatchEnvelopeRef: "message_dispatch_envelope::task-118::dispatch-1",
    latestDeliveryEvidenceBundleRef: "message_delivery_evidence_bundle::task-118::dispatch-1",
    latestExpectationEnvelopeRef: "thread_expectation_envelope::task-118::repair",
    latestResolutionGateRef: "thread_resolution_gate::task-118::repair",
    threadTupleRef: "thread_tuple::task-118::dispatch-1",
    continuityKey: "workspace_message_thread::task-118",
    mastheadSummary:
      "The current thread is not disputed, but it is blocked on attachment recovery after the outbound channel stripped the image.",
    riskSummary:
      "Staff can repair the missing attachment in-shell, but they must not quietly reissue the full message until the repair checkpoint is satisfied.",
    worklistSummary:
      "Attachment stripping created an explicit repair scope. Recovery stays same-shell and must expose the missing artifact, checkpoint, and next legal action.",
    dueLabel: "Attachment recovery open",
    nextAllowedActionLabel: "Recover attachment and reissue",
    currentOwnerLabel: "Repair review lane",
    repairScopeSummary:
      "Attachment recovery is the legal repair path. Keep the failed dispatch, missing artifact, and current checkpoint visible while the repair runs.",
    contradictoryReceiptSummary: null,
    callbackFallbackSummary: null,
    attachmentRecoverySummary:
      "The outbound channel stripped the image attachment. Recover the attachment set before reissuing the message.",
    attachmentRecoveryCheckpointRef: "attachment_recovery_checkpoint::task-118",
    attachmentRecoveryArtifactLabel: "Ownership clarification image bundle",
    chronology: [
      {
        eventId: "message-118-send",
        anchorRef: "message-event-task-118-send",
        groupLabel: "Outbound thread",
        kind: "dispatch",
        occurredAtLabel: "11:18",
        actorLabel: "Dispatch envelope",
        headline: "Clarification message dispatched with image attachment",
        summary:
          "The message left the current thread version with a small image required for the ownership correction.",
        receiptPosture: "provider_accepted",
        evidenceStrengthLabel: "Transport accepted",
        dispatchEnvelopeRef: "message_dispatch_envelope::task-118::dispatch-1",
        deliveryEvidenceBundleRef: null,
        expectationEnvelopeRef: "thread_expectation_envelope::task-118::send",
        repairHint: null,
      },
      {
        eventId: "message-118-failure",
        anchorRef: "message-event-task-118-failure",
        groupLabel: "Receipts and repair",
        kind: "receipt",
        occurredAtLabel: "11:22",
        actorLabel: "Delivery evidence bundle",
        headline: "Attachment stripping blocked delivery",
        summary:
          "The provider accepted the envelope but then returned failure evidence because the image attachment was stripped.",
        receiptPosture: "failed",
        evidenceStrengthLabel: "Direct provider failure",
        dispatchEnvelopeRef: "message_dispatch_envelope::task-118::dispatch-1",
        deliveryEvidenceBundleRef: "message_delivery_evidence_bundle::task-118::dispatch-1",
        expectationEnvelopeRef: "thread_expectation_envelope::task-118::repair",
        repairHint: "Open attachment recovery directly in the repair workbench.",
        selectedByDefault: true,
      },
      {
        eventId: "message-118-repair",
        anchorRef: "message-event-task-118-repair",
        groupLabel: "Receipts and repair",
        kind: "repair",
        occurredAtLabel: "11:27",
        actorLabel: "Repair checkpoint",
        headline: "Attachment recovery scope published",
        summary:
          "The repair checkpoint names the exact artifact set that must rebound before a new dispatch is legal.",
        receiptPosture: "failed",
        evidenceStrengthLabel: "Repair checkpoint current",
        dispatchEnvelopeRef: "message_dispatch_envelope::task-118::dispatch-1",
        deliveryEvidenceBundleRef: "message_delivery_evidence_bundle::task-118::dispatch-1",
        expectationEnvelopeRef: "thread_expectation_envelope::task-118::repair",
        repairHint: "Keep the failed dispatch visible while the operator repairs the attachment set.",
      },
    ],
    repairActions: [
      {
        actionKey: "attachment_recovery",
        label: "Recover attachment set",
        summary: "Rebind the missing image set before any new dispatch is allowed.",
        enabled: true,
        blockedReason: null,
        requiredChecks: [
          "Missing attachment hash confirmed",
          "Replacement attachment ready",
          "Current gate authorizes repair",
        ],
      },
      {
        actionKey: "reissue",
        label: "Reissue repaired message",
        summary: "Reissue is legal only after the attachment recovery checkpoint is satisfied.",
        enabled: false,
        blockedReason: "Attachment recovery must settle before a fresh dispatch envelope can be created.",
        requiredChecks: [],
      },
      {
        actionKey: "resend",
        label: "Resend current message",
        summary: "Resend is blocked because the current envelope already proved attachment failure.",
        enabled: false,
        blockedReason: "The current failed dispatch cannot be reused as if the attachment were still intact.",
        requiredChecks: [],
      },
      {
        actionKey: "channel_change",
        label: "Switch channel",
        summary: "Channel change remains visible, but it is not the dominant repair for this thread.",
        enabled: false,
        blockedReason: "Attachment recovery is the legal repair path on the current gate.",
        requiredChecks: [],
      },
      {
        actionKey: "route_repair",
        label: "Open route repair",
        summary: "Route repair is not required because the route itself still resolves correctly.",
        enabled: false,
        blockedReason: "The failure mode is attachment stripping, not route drift.",
        requiredChecks: [],
      },
      {
        actionKey: "callback_fallback",
        label: "Fall back to callback",
        summary: "Callback remains secondary and is not the current legal repair route.",
        enabled: false,
        blockedReason: "The thread still has a recoverable messaging path through attachment repair.",
        requiredChecks: [],
      },
    ],
  },
] as const;

function mutationStateForSeed(
  runtimeScenario: RuntimeScenario,
  seed: ClinicianMessageSeed,
): ClinicianMessageMutationState {
  if (runtimeScenario === "blocked") {
    return "blocked";
  }
  if (runtimeScenario === "read_only" || runtimeScenario === "recovery_only") {
    return "recovery_only";
  }
  if (runtimeScenario === "stale_review" || seed.latestReceiptPosture === "contradictory_signal") {
    return "stale_recoverable";
  }
  return "live";
}

function labelFromToken(value: string): string {
  return value.replaceAll("_", " ");
}

function threadHeadline(seed: ClinicianMessageSeed): string {
  switch (seed.threadState) {
    case "transport_accepted":
      return "Transport accepted is still not delivery truth";
    case "evidence_delivered":
      return "Delivery evidence is current and calm";
    case "disputed":
      return "Contradictory receipts freeze the thread";
    case "repair_pending":
      return "Attachment repair is the current legal route";
    case "closed":
      return "Thread is closed";
    case "drafted":
    case "sent":
    default:
      return "Clinician messaging thread";
  }
}

function currentTruthIndex(
  truth: ClinicianMessageDeliveryTruthStep,
): number {
  return deliveryTruthSteps.indexOf(truth);
}

function buildDeliveryTruthLadder(
  seed: ClinicianMessageSeed,
): DeliveryTruthLadderProjection {
  const currentIndex = currentTruthIndex(seed.latestDeliveryTruth);
  return {
    ladderId: `delivery_truth_ladder::${seed.threadId}`,
    currentTruth: seed.latestDeliveryTruth,
    latestReceiptPosture: seed.latestReceiptPosture,
    latestDeliveryEvidenceBundleRef: seed.latestDeliveryEvidenceBundleRef,
    steps: deliveryTruthSteps.map((stepKey, index) => {
      let state: DeliveryTruthStepProjection["state"];
      if (seed.latestDeliveryTruth === "disputed" && (stepKey === "evidence_delivered" || stepKey === "closed")) {
        state = "blocked";
      } else if (seed.latestDeliveryTruth === "repair_pending" && stepKey === "closed") {
        state = "blocked";
      } else if (index < currentIndex) {
        state = "complete";
      } else if (index === currentIndex) {
        state = "current";
      } else {
        state = "pending";
      }
      return {
        stepId: `delivery_truth_step::${seed.threadId}::${stepKey}`,
        stepKey,
        label: labelFromToken(stepKey),
        state,
        evidenceLabel:
          stepKey === seed.latestDeliveryTruth
            ? seed.latestDeliveryEvidenceBundleRef ?? seed.latestDispatchEnvelopeRef
            : stepKey === "transport_accepted"
              ? seed.latestDispatchEnvelopeRef
              : stepKey === "disputed" || stepKey === "repair_pending"
                ? seed.latestResolutionGateRef
                : "No current evidence",
      };
    }),
  };
}

function buildChronologyGroups(
  seed: ClinicianMessageSeed,
  selectedAnchorRef: string,
): readonly ClinicianMessageChronologyGroupProjection[] {
  const grouped = new Map<string, ClinicianMessageChronologySeed[]>();
  for (const row of seed.chronology) {
    const existing = grouped.get(row.groupLabel) ?? [];
    existing.push(row);
    grouped.set(row.groupLabel, existing);
  }
  return Array.from(grouped.entries()).map(([label, rows], index) => ({
    groupId: `message_group::${seed.threadId}::${index + 1}`,
    label,
    summary:
      label === "Outbound thread"
        ? "Immutable dispatch and draft truth for the current thread version."
        : label === "Receipts and dispute"
          ? "Accepted checkpoints and contradictory signals reconcile here before any calm delivery claim."
          : "Repair stays visible without hiding chronology or patient context.",
    rows: rows.map((row) => ({
      rowId: row.eventId,
      anchorRef: row.anchorRef,
      kind: row.kind,
      occurredAtLabel: row.occurredAtLabel,
      actorLabel: row.actorLabel,
      headline: row.headline,
      summary: row.summary,
      receiptPosture: row.receiptPosture,
      evidenceStrengthLabel: row.evidenceStrengthLabel,
      dispatchEnvelopeRef: row.dispatchEnvelopeRef,
      deliveryEvidenceBundleRef: row.deliveryEvidenceBundleRef,
      expectationEnvelopeRef: row.expectationEnvelopeRef,
      repairHint: row.repairHint,
      selected:
        selectedAnchorRef === row.anchorRef ||
        (!selectedAnchorRef && Boolean(row.selectedByDefault)),
    })),
  }));
}

function buildRepairWorkbench(
  seed: ClinicianMessageSeed,
  mutationState: ClinicianMessageMutationState,
): MessageRepairWorkbenchProjection {
  const selectedActionKey =
    (seed.repairActions.find((action) => action.enabled)?.actionKey ??
      seed.repairActions[0]?.actionKey ??
      "route_repair") as Exclude<ClinicianMessageRepairKind, "none">;
  const attachmentRecoveryPrompt =
    seed.attachmentRecoverySummary
      ? {
          promptId: `attachment_recovery_prompt::${seed.threadId}`,
          visible: true,
          headline: "AttachmentRecoveryPrompt",
          summary: seed.attachmentRecoverySummary,
          recoveryArtifactLabel: seed.attachmentRecoveryArtifactLabel,
          checkpointRef: seed.attachmentRecoveryCheckpointRef,
          actionLabel: "Repair attachment set",
        }
      : null;

  return {
    workbenchId: `message_repair_workbench::${seed.threadId}`,
    stageState: mutationState,
    repairKind: seed.repairKind,
    dominantActionLabel:
      seed.repairKind === "route_repair"
        ? "Repair the route or use callback fallback"
        : seed.repairKind === "attachment_recovery"
          ? "Recover attachment set before reissue"
          : seed.repairKind === "none"
            ? "No repair path is currently dominant"
            : `Review ${labelFromToken(seed.repairKind)}`,
    summary: seed.repairScopeSummary,
    routeSafetyLabel: seed.routeLabel,
    selectedActionKey,
    actions: seed.repairActions.map((action) => ({
      actionId: `message_repair_action::${seed.threadId}::${action.actionKey}`,
      actionKey: action.actionKey,
      label: action.label,
      summary: action.summary,
      enabled: action.enabled,
      blockedReason: action.blockedReason,
      requiredChecks: action.requiredChecks,
    })),
    attachmentRecoveryPrompt,
  };
}

function buildDeliveryDisputeStage(
  seed: ClinicianMessageSeed,
  mutationState: ClinicianMessageMutationState,
  selectedAnchorRef: string,
): DeliveryDisputeStageProjection {
  return {
    stageId: `delivery_dispute_stage::${seed.threadId}`,
    visible:
      seed.threadState === "disputed" ||
      seed.repairKind === "route_repair" ||
      seed.contradictoryReceiptSummary !== null,
    stageState:
      seed.contradictoryReceiptSummary === null
        ? "hidden"
        : mutationState === "live"
          ? "review_live"
          : "review_frozen",
    selectedEventAnchorRef: selectedAnchorRef || null,
    contradictoryReceiptSummary: seed.contradictoryReceiptSummary,
    freezeReason:
      mutationState === "stale_recoverable"
        ? "The thread tuple drifted under contradictory same-fence evidence. Keep repair visible and freeze new mutation until the tuple is revalidated."
        : mutationState === "recovery_only"
          ? "The last safe chronology is preserved, but repair controls remain read-only under current recovery posture."
          : mutationState === "blocked"
            ? "Release truth is blocked. The dispute remains visible, but no live repair mutation is permitted."
            : null,
    pinnedRouteLabel: seed.routeLabel,
    pinnedEvidenceRefs: [
      seed.latestDispatchEnvelopeRef,
      seed.latestDeliveryEvidenceBundleRef ?? "delivery evidence bundle missing",
      seed.latestExpectationEnvelopeRef,
    ],
    nextRepairLabel:
      seed.repairKind === "route_repair"
        ? "Route repair stays dominant"
        : "Repair path review required",
    callbackFallbackSummary: seed.callbackFallbackSummary,
  };
}

function sourceSummaryPoints(
  task: StaffQueueCase,
  seed: ClinicianMessageSeed,
): readonly string[] {
  return [
    task.primaryReason,
    task.previewSummary,
    seed.worklistSummary,
    task.summaryPoints[0] ?? task.secondaryMeta,
  ];
}

function buildWorklistRow(
  seed: ClinicianMessageSeed,
  selectedTaskId: string,
): ClinicianMessageWorklistRowProjection {
  const patientLabel = workspaceFixtureSafePatientLabel(seed.taskId, seed.patientLabel);
  return {
    rowId: `message_worklist_row::${seed.threadId}`,
    taskId: seed.taskId,
    threadId: seed.threadId,
    anchorRef: `message-detail-${seed.taskId}`,
    patientLabel,
    requestLabel: seed.requestLabel,
    routeLabel: seed.routeLabel,
    threadState: seed.threadState,
    repairKind: seed.repairKind,
    expectationState: seed.expectationState,
    resolutionGateState: seed.resolutionGateState,
    latestReceiptPosture: seed.latestReceiptPosture,
    latestDeliveryTruth: seed.latestDeliveryTruth,
    summary: seed.worklistSummary,
    dueLabel: seed.dueLabel,
    nextAllowedActionLabel: seed.nextAllowedActionLabel,
    selected: seed.taskId === selectedTaskId,
  };
}

function requireClinicianMessageSeed(
  taskId: string,
): ClinicianMessageSeed {
  const seed = clinicianMessageSeeds.find((candidate) => candidate.taskId === taskId);
  if (!seed) {
    throw new Error(`CLINICIAN_MESSAGE_SEED_MISSING: ${taskId}`);
  }
  return seed;
}

export function listClinicianMessageWorkbenchTaskIds(): readonly string[] {
  return clinicianMessageSeeds.map((seed) => seed.taskId);
}

export function defaultClinicianMessageWorkbenchTaskId(): string {
  return clinicianMessageSeeds[0]?.taskId ?? "task-208";
}

export function buildClinicianMessageWorkbenchProjection(input: {
  runtimeScenario: RuntimeScenario;
  selectedTaskId: string;
  selectedAnchorRef: string;
  selectedStage: ClinicianMessageStage;
}): ClinicianMessageWorkbenchProjection {
  const seed = requireClinicianMessageSeed(input.selectedTaskId);
  const task = requireCase(seed.taskId);
  const patientLabel = workspaceFixtureSafePatientLabel(seed.taskId, seed.patientLabel);
  const mutationState = mutationStateForSeed(input.runtimeScenario, seed);
  const chronologyGroups = buildChronologyGroups(seed, input.selectedAnchorRef);
  const detailSurface: ClinicianMessageDetailSurfaceProjection = {
    surfaceId: `clinician_message_detail_surface::${seed.threadId}`,
    taskId: seed.taskId,
    threadId: seed.threadId,
    selectedStage: input.selectedStage,
    mutationState,
    threadState: seed.threadState,
    repairKind: seed.repairKind,
    latestDeliveryTruth: seed.latestDeliveryTruth,
    threadTupleRef: seed.threadTupleRef,
    continuityKey: seed.continuityKey,
    masthead: {
      mastheadId: `message_thread_masthead::${seed.threadId}`,
      threadId: seed.threadId,
      threadTupleRef: seed.threadTupleRef,
      requestLabel: seed.requestLabel,
      patientLabel,
      participantsLabel: seed.participantsLabel,
      routeLabel: seed.routeLabel,
      expectationState: seed.expectationState,
      resolutionGateState: seed.resolutionGateState,
      latestReceiptPosture: seed.latestReceiptPosture,
      latestDeliveryTruth: seed.latestDeliveryTruth,
      latestDispatchEnvelopeRef: seed.latestDispatchEnvelopeRef,
      latestDeliveryEvidenceBundleRef: seed.latestDeliveryEvidenceBundleRef,
      latestExpectationEnvelopeRef: seed.latestExpectationEnvelopeRef,
      latestResolutionGateRef: seed.latestResolutionGateRef,
      headline: threadHeadline(seed),
      summary: seed.mastheadSummary,
      riskSummary: seed.riskSummary,
    },
    deliveryTruthLadder: buildDeliveryTruthLadder(seed),
    chronologyGroups,
    deliveryDisputeStage: buildDeliveryDisputeStage(
      seed,
      mutationState,
      input.selectedAnchorRef,
    ),
    repairWorkbench: buildRepairWorkbench(seed, mutationState),
    sourceSummaryPoints: sourceSummaryPoints(task, seed),
  };

  const deliveryLagCount = clinicianMessageSeeds.filter(
    (candidate) =>
      candidate.latestDeliveryTruth === "transport_accepted" ||
      candidate.threadState === "repair_pending" ||
      candidate.threadState === "disputed",
  ).length;

  return {
    routeId: "clinician_message_thread_route",
    route: "/workspace/messages",
    visualMode: "Thread_Repair_Studio",
    continuityKey: seed.continuityKey,
    queueHealthSummary:
      "Chronology, delivery truth, and repair stay in one same-shell studio. Provider acceptance never stands in for real delivery evidence.",
    lagSummary: `${deliveryLagCount} threads still need evidence, repair, or fallback review`,
    rowCount: clinicianMessageSeeds.length,
    selectedTaskId: seed.taskId,
    selectedStage: input.selectedStage,
    mutationState,
    rows: clinicianMessageSeeds.map((candidate) =>
      buildWorklistRow(candidate, seed.taskId),
    ),
    detailSurface,
  };
}
