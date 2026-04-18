export type Phase3PatientWorkspaceConversationScenario =
  | "live"
  | "repair"
  | "stale"
  | "blocked"
  | "expired";

export type Phase3PatientWorkspaceConversationRouteKey =
  | "conversation_overview"
  | "conversation_more_info"
  | "conversation_callback"
  | "conversation_messages"
  | "conversation_repair";

export type Phase3PatientWorkspaceAccessState =
  | "signed_in"
  | "secure_link"
  | "step_up_required"
  | "expired_link";

export type Phase3PatientWorkspaceDueState =
  | "in_window"
  | "late_review"
  | "expired"
  | "superseded";

export type Phase3PatientWorkspaceReplyEligibilityState =
  | "answerable"
  | "awaiting_review"
  | "blocked_by_repair"
  | "read_only"
  | "expired";

export type Phase3PatientWorkspaceDeliveryPosture =
  | "reply_needed"
  | "awaiting_review"
  | "callback_visible"
  | "step_up_required"
  | "repair_required"
  | "stale_recoverable";

export type Phase3PatientWorkspaceRepairPosture =
  | "none"
  | "required"
  | "recovering"
  | "recovery_required";

export interface Phase3PatientWorkspaceConversationRouteRefSet {
  overview: `/requests/${string}/conversation`;
  moreInfo: `/requests/${string}/conversation/more-info`;
  callback: `/requests/${string}/conversation/callback`;
  messages: `/requests/${string}/conversation/messages`;
  repair: `/requests/${string}/conversation/repair`;
  messageCluster: `/messages/${string}`;
  messageThread: `/messages/${string}/thread/${string}`;
  messageRepair: `/messages/${string}/repair`;
  workflowMoreInfo: `/requests/${string}/more-info`;
  workflowCallback: `/requests/${string}/callback`;
  workflowCallbackRepair: `/requests/${string}/callback/at-risk`;
  workflowReadOnly: `/requests/${string}/more-info/read-only`;
  workflowExpired: `/requests/${string}/more-info/expired`;
  contactRepair: `/contact-repair/${string}`;
  contactRepairApplied: `/contact-repair/${string}/applied`;
  staffTask: `/workspace/task/${string}`;
  staffMoreInfo: `/workspace/task/${string}/more-info`;
  staffDecision: `/workspace/task/${string}/decision`;
  staffChanged: "/workspace/changed?state=live";
  staffCallbacks: "/workspace/callbacks?state=live";
  staffMessages: "/workspace/messages?state=live";
}

export interface Phase3PatientWorkspaceRouteDefaults {
  overviewAnchorRef: string;
  moreInfoAnchorRef: string;
  callbackAnchorRef: string;
  messagesAnchorRef: string;
  repairAnchorRef: string;
  defaultMessageSubthreadRef: string;
}

export interface Phase3PatientWorkspaceParityProjection {
  dueState: Phase3PatientWorkspaceDueState;
  replyEligibilityState: Phase3PatientWorkspaceReplyEligibilityState;
  deliveryPosture: Phase3PatientWorkspaceDeliveryPosture;
  repairPosture: Phase3PatientWorkspaceRepairPosture;
  dominantNextActionRef: string;
  dominantNextActionLabel: string;
  blockedActionSummary: string | null;
  cycleDispositionLabel: string;
}

export interface Phase3PatientWorkspaceStaffParityProjection {
  moreInfoStageState:
    | "draft"
    | "awaiting_patient_reply"
    | "review_required"
    | "late_review"
    | "repair_required";
  threadAwaitingReviewState: "not_awaiting" | "awaiting_review" | "review_pending";
  changedSinceSeenState: "unchanged" | "material_delta";
  resumePosture: "delta_first" | "direct" | "repair_required";
}

export interface Phase3PatientWorkspaceConversationBundle {
  readonly projectionName: "Phase3PatientWorkspaceConversationBundle";
  readonly bundleRef: string;
  readonly schemaVersion: "271.phase3.patient-workspace-conversation-merge.v1";
  readonly taskId: string;
  readonly requestRef: string;
  readonly requestTitle: string;
  readonly requestLineageRef: string;
  readonly clusterRef: string;
  readonly threadId: string;
  readonly subthreadRef: string;
  readonly moreInfoCycleRef: string;
  readonly replyWindowCheckpointRef: string;
  readonly reminderScheduleRef: string;
  readonly callbackCaseRef: string;
  readonly messageThreadRef: string;
  readonly contactRepairCaseRef: string;
  readonly continuityEvidenceRef: string;
  readonly evidenceDeltaPacketRef: string;
  readonly moreInfoResponseDispositionRef: string;
  readonly conversationSettlementRef: string;
  readonly patientReceiptEnvelopeRef: string;
  readonly secureLinkAccessState: Phase3PatientWorkspaceAccessState;
  readonly secureLinkExpiryRef: string;
  readonly scenario: Phase3PatientWorkspaceConversationScenario;
  readonly routeKey: Phase3PatientWorkspaceConversationRouteKey;
  readonly routeRefs: Phase3PatientWorkspaceConversationRouteRefSet;
  readonly routeDefaults: Phase3PatientWorkspaceRouteDefaults;
  readonly parity: Phase3PatientWorkspaceParityProjection;
  readonly staffParity: Phase3PatientWorkspaceStaffParityProjection;
  readonly acceptedGapRefs: readonly string[];
}

interface Phase3PatientWorkspaceConversationSeed {
  taskId: string;
  requestRef: string;
  requestTitle: string;
  requestLineageRef: string;
  clusterRef: string;
  threadId: string;
  subthreadRef: string;
  moreInfoCycleRef: string;
  openReplyWindowCheckpointRef: string;
  expiredReplyWindowCheckpointRef: string;
  reminderScheduleRef: string;
  callbackCaseRef: string;
  messageThreadRef: string;
  contactRepairCaseRef: string;
  continuityEvidenceRef: string;
  evidenceDeltaPacketRef: string;
  moreInfoResponseDispositionRef: string;
  conversationSettlementRef: string;
  patientReceiptEnvelopeRef: string;
  secureLinkExpiryRef: string;
  accessState: Phase3PatientWorkspaceAccessState;
  routeDefaults: Phase3PatientWorkspaceRouteDefaults;
  acceptedGapRefs: readonly string[];
}

function hashToken(seed: string): string {
  let value = 0;
  for (const character of seed) {
    value = (value * 33 + character.charCodeAt(0)) >>> 0;
  }
  return value.toString(16).padStart(8, "0");
}

const phase3PatientWorkspaceConversationSeeds = [
  {
    taskId: "task-311",
    requestRef: "request_211_a",
    requestTitle: "Dermatology request",
    requestLineageRef: "lineage_211_a",
    clusterRef: "cluster_214_derm",
    threadId: "thread_214_primary",
    subthreadRef: "subthread_214_latest",
    moreInfoCycleRef: "cycle_216_dermatology_photo",
    openReplyWindowCheckpointRef: "checkpoint_216_open",
    expiredReplyWindowCheckpointRef: "checkpoint_216_expired",
    reminderScheduleRef: "reminder_schedule_216_photo",
    callbackCaseRef: "callback_case_311_ready",
    messageThreadRef: "message_thread_247_a",
    contactRepairCaseRef: "repair_216_sms",
    continuityEvidenceRef: "workspace_continuity_311_patient_conversation",
    evidenceDeltaPacketRef: "evidence_delta_packet::task-311::consequential",
    moreInfoResponseDispositionRef: "response_disposition_237_task_311_accepted_late_review",
    conversationSettlementRef: "conversation_settlement_246_task_311",
    patientReceiptEnvelopeRef: "receipt_cluster_214_derm",
    secureLinkExpiryRef: "secure_link_expiry_271_request_211_a",
    accessState: "signed_in",
    routeDefaults: {
      overviewAnchorRef: "conversation_overview",
      moreInfoAnchorRef: "prompt_216_photo_timing",
      callbackAnchorRef: "callback_status_rail",
      messagesAnchorRef: "subthread_214_latest",
      repairAnchorRef: "contact_repair_prompt",
      defaultMessageSubthreadRef: "subthread_214_latest",
    },
    acceptedGapRefs: [
      "271-live-provider-reminder-transport-simulated",
      "271-staff-patient-projections-still-seed-backed",
    ],
  },
  {
    taskId: "task-412",
    requestRef: "request_215_callback",
    requestTitle: "Phone callback",
    requestLineageRef: "lineage_215_callback",
    clusterRef: "cluster_214_callback",
    threadId: "thread_214_callback",
    subthreadRef: "subthread_214_callback_latest",
    moreInfoCycleRef: "cycle_216_callback_follow_up",
    openReplyWindowCheckpointRef: "checkpoint_412_open",
    expiredReplyWindowCheckpointRef: "checkpoint_412_expired",
    reminderScheduleRef: "reminder_schedule_412_callback",
    callbackCaseRef: "callback_case_412_route_repair",
    messageThreadRef: "message_thread_412_route_repair",
    contactRepairCaseRef: "repair_216_sms",
    continuityEvidenceRef: "workspace_continuity_412_patient_conversation",
    evidenceDeltaPacketRef: "evidence_delta_packet::task-412::consequential",
    moreInfoResponseDispositionRef: "response_disposition_237_task_412_repair_gate",
    conversationSettlementRef: "conversation_settlement_246_task_412",
    patientReceiptEnvelopeRef: "receipt_cluster_214_callback",
    secureLinkExpiryRef: "secure_link_expiry_271_request_215_callback",
    accessState: "secure_link",
    routeDefaults: {
      overviewAnchorRef: "conversation_overview",
      moreInfoAnchorRef: "callback_more_info_stub",
      callbackAnchorRef: "callback_status_rail",
      messagesAnchorRef: "subthread_214_callback_latest",
      repairAnchorRef: "contact_repair_prompt",
      defaultMessageSubthreadRef: "subthread_214_callback_latest",
    },
    acceptedGapRefs: [
      "271-live-provider-callback-transport-simulated",
      "271-step-up-bridge-still-browser-seeded",
    ],
  },
] as const satisfies readonly Phase3PatientWorkspaceConversationSeed[];

const seedByTaskId = new Map<string, Phase3PatientWorkspaceConversationSeed>(
  phase3PatientWorkspaceConversationSeeds.map((seed) => [seed.taskId, seed] as const),
);
const seedByRequestRef = new Map<string, Phase3PatientWorkspaceConversationSeed>(
  phase3PatientWorkspaceConversationSeeds.map((seed) => [seed.requestRef, seed] as const),
);
const seedByClusterRef = new Map<string, Phase3PatientWorkspaceConversationSeed>(
  phase3PatientWorkspaceConversationSeeds.map((seed) => [seed.clusterRef, seed] as const),
);

function bundleRouteRefs(
  seed: Phase3PatientWorkspaceConversationSeed,
): Phase3PatientWorkspaceConversationRouteRefSet {
  return {
    overview: `/requests/${seed.requestRef}/conversation`,
    moreInfo: `/requests/${seed.requestRef}/conversation/more-info`,
    callback: `/requests/${seed.requestRef}/conversation/callback`,
    messages: `/requests/${seed.requestRef}/conversation/messages`,
    repair: `/requests/${seed.requestRef}/conversation/repair`,
    messageCluster: `/messages/${seed.clusterRef}`,
    messageThread: `/messages/${seed.clusterRef}/thread/${seed.threadId}`,
    messageRepair: `/messages/${seed.clusterRef}/repair`,
    workflowMoreInfo: `/requests/${seed.requestRef}/more-info`,
    workflowCallback: `/requests/${seed.requestRef}/callback`,
    workflowCallbackRepair: `/requests/${seed.requestRef}/callback/at-risk`,
    workflowReadOnly: `/requests/${seed.requestRef}/more-info/read-only`,
    workflowExpired: `/requests/${seed.requestRef}/more-info/expired`,
    contactRepair: `/contact-repair/${seed.contactRepairCaseRef}`,
    contactRepairApplied: `/contact-repair/${seed.contactRepairCaseRef}/applied`,
    staffTask: `/workspace/task/${seed.taskId}`,
    staffMoreInfo: `/workspace/task/${seed.taskId}/more-info`,
    staffDecision: `/workspace/task/${seed.taskId}/decision`,
    staffChanged: "/workspace/changed?state=live",
    staffCallbacks: "/workspace/callbacks?state=live",
    staffMessages: "/workspace/messages?state=live",
  };
}

function parityForSeed(input: {
  seed: Phase3PatientWorkspaceConversationSeed;
  scenario: Phase3PatientWorkspaceConversationScenario;
  routeKey: Phase3PatientWorkspaceConversationRouteKey;
}): Phase3PatientWorkspaceParityProjection {
  const { seed, scenario, routeKey } = input;
  if (scenario === "repair") {
    return {
      dueState: "in_window",
      replyEligibilityState: "blocked_by_repair",
      deliveryPosture: "repair_required",
      repairPosture: "required",
      dominantNextActionRef: "repair_contact_route",
      dominantNextActionLabel: "Check contact details",
      blockedActionSummary:
        "Reply and callback stay visible, but both are paused until the contact route is checked.",
      cycleDispositionLabel: "repair_required",
    };
  }
  if (scenario === "stale") {
    return {
      dueState: "superseded",
      replyEligibilityState: "read_only",
      deliveryPosture: "stale_recoverable",
      repairPosture: "recovery_required",
      dominantNextActionRef: "recover_in_same_shell",
      dominantNextActionLabel: "Review the latest update in this page",
      blockedActionSummary:
        "The earlier draft and anchor stay in place so you can compare them with the latest update.",
      cycleDispositionLabel: "superseded",
    };
  }
  if (scenario === "blocked") {
    return {
      dueState: "in_window",
      replyEligibilityState: "read_only",
      deliveryPosture: "step_up_required",
      repairPosture: "recovery_required",
      dominantNextActionRef: "complete_step_up",
      dominantNextActionLabel: "Complete the security step to continue",
      blockedActionSummary:
        "Reading is still available, but sending a reply is paused until the extra security check is complete.",
      cycleDispositionLabel: "step_up_required",
    };
  }
  if (scenario === "expired") {
    return {
      dueState: "expired",
      replyEligibilityState: "expired",
      deliveryPosture: "awaiting_review",
      repairPosture: "none",
      dominantNextActionRef: "return_to_request",
      dominantNextActionLabel: "Return to the request summary",
      blockedActionSummary: null,
      cycleDispositionLabel: "expired",
    };
  }
  if (seed.taskId === "task-412") {
    return {
      dueState: "in_window",
      replyEligibilityState: routeKey === "conversation_messages" ? "read_only" : "blocked_by_repair",
      deliveryPosture: "callback_visible",
      repairPosture: "required",
      dominantNextActionRef: "repair_contact_route",
      dominantNextActionLabel: "Check contact details",
      blockedActionSummary:
        "Reply and callback stay visible, but both are paused until the contact route is checked.",
      cycleDispositionLabel: "repair_required",
    };
  }
  return {
    dueState: "late_review",
    replyEligibilityState:
      routeKey === "conversation_messages" ? "awaiting_review" : "answerable",
    deliveryPosture:
      routeKey === "conversation_messages" ? "awaiting_review" : "reply_needed",
    repairPosture: "none",
    dominantNextActionRef:
      routeKey === "conversation_messages" ? "read_message_update" : "open_more_info_reply",
    dominantNextActionLabel:
      routeKey === "conversation_messages" ? "Read the latest update" : "Continue your reply",
    blockedActionSummary: null,
    cycleDispositionLabel: "late_review",
  };
}

function staffParityForSeed(input: {
  seed: Phase3PatientWorkspaceConversationSeed;
  scenario: Phase3PatientWorkspaceConversationScenario;
}): Phase3PatientWorkspaceStaffParityProjection {
  const { seed, scenario } = input;
  if (scenario === "repair") {
    return {
      moreInfoStageState: "repair_required",
      threadAwaitingReviewState: "review_pending",
      changedSinceSeenState: "material_delta",
      resumePosture: "repair_required",
    };
  }
  if (scenario === "stale" || scenario === "blocked") {
    return {
      moreInfoStageState: "review_required",
      threadAwaitingReviewState: "review_pending",
      changedSinceSeenState: "material_delta",
      resumePosture: "delta_first",
    };
  }
  if (seed.taskId === "task-311") {
    return {
      moreInfoStageState: "awaiting_patient_reply",
      threadAwaitingReviewState: "review_pending",
      changedSinceSeenState: "material_delta",
      resumePosture: "delta_first",
    };
  }
  return {
    moreInfoStageState: "repair_required",
    threadAwaitingReviewState: "review_pending",
    changedSinceSeenState: "material_delta",
    resumePosture: "repair_required",
  };
}

function buildBundle(
  seed: Phase3PatientWorkspaceConversationSeed,
  input: {
    scenario?: Phase3PatientWorkspaceConversationScenario;
    routeKey?: Phase3PatientWorkspaceConversationRouteKey;
  },
): Phase3PatientWorkspaceConversationBundle {
  const scenario = input.scenario ?? "live";
  const routeKey = input.routeKey ?? "conversation_overview";
  const routeRefs = bundleRouteRefs(seed);
  const parity = parityForSeed({ seed, scenario, routeKey });
  return {
    projectionName: "Phase3PatientWorkspaceConversationBundle",
    bundleRef: `phase3_patient_workspace_conversation_bundle::${seed.taskId}::${scenario}::${routeKey}`,
    schemaVersion: "271.phase3.patient-workspace-conversation-merge.v1",
    taskId: seed.taskId,
    requestRef: seed.requestRef,
    requestTitle: seed.requestTitle,
    requestLineageRef: seed.requestLineageRef,
    clusterRef: seed.clusterRef,
    threadId: seed.threadId,
    subthreadRef: seed.subthreadRef,
    moreInfoCycleRef: seed.moreInfoCycleRef,
    replyWindowCheckpointRef:
      scenario === "expired" ? seed.expiredReplyWindowCheckpointRef : seed.openReplyWindowCheckpointRef,
    reminderScheduleRef: seed.reminderScheduleRef,
    callbackCaseRef: seed.callbackCaseRef,
    messageThreadRef: seed.messageThreadRef,
    contactRepairCaseRef: seed.contactRepairCaseRef,
    continuityEvidenceRef: seed.continuityEvidenceRef,
    evidenceDeltaPacketRef: seed.evidenceDeltaPacketRef,
    moreInfoResponseDispositionRef: seed.moreInfoResponseDispositionRef,
    conversationSettlementRef: seed.conversationSettlementRef,
    patientReceiptEnvelopeRef: seed.patientReceiptEnvelopeRef,
    secureLinkAccessState:
      scenario === "blocked"
        ? "step_up_required"
        : scenario === "expired"
          ? "expired_link"
          : seed.accessState,
    secureLinkExpiryRef: seed.secureLinkExpiryRef,
    scenario,
    routeKey,
    routeRefs,
    routeDefaults: seed.routeDefaults,
    parity,
    staffParity: staffParityForSeed({ seed, scenario }),
    acceptedGapRefs: seed.acceptedGapRefs,
  };
}

function requireSeed<T>(
  seed: T | undefined,
  message: string,
): T {
  if (!seed) {
    throw new Error(message);
  }
  return seed;
}

export function listPhase3PatientWorkspaceConversationTaskIds(): readonly string[] {
  return phase3PatientWorkspaceConversationSeeds.map((seed) => seed.taskId);
}

export function listPhase3PatientWorkspaceConversationRequestRefs(): readonly string[] {
  return phase3PatientWorkspaceConversationSeeds.map((seed) => seed.requestRef);
}

export function listPhase3PatientWorkspaceConversationClusterRefs(): readonly string[] {
  return phase3PatientWorkspaceConversationSeeds.map((seed) => seed.clusterRef);
}

export function resolvePhase3PatientWorkspaceConversationBundleByTaskId(input: {
  taskId: string;
  scenario?: Phase3PatientWorkspaceConversationScenario;
  routeKey?: Phase3PatientWorkspaceConversationRouteKey;
}): Phase3PatientWorkspaceConversationBundle {
  const seed = requireSeed(
    seedByTaskId.get(input.taskId),
    `PHASE3_PATIENT_WORKSPACE_CONVERSATION_TASK_MISSING:${input.taskId}`,
  );
  return buildBundle(seed, input);
}

export function resolvePhase3PatientWorkspaceConversationBundleByRequestRef(input: {
  requestRef: string;
  scenario?: Phase3PatientWorkspaceConversationScenario;
  routeKey?: Phase3PatientWorkspaceConversationRouteKey;
}): Phase3PatientWorkspaceConversationBundle {
  const seed = requireSeed(
    seedByRequestRef.get(input.requestRef),
    `PHASE3_PATIENT_WORKSPACE_CONVERSATION_REQUEST_MISSING:${input.requestRef}`,
  );
  return buildBundle(seed, input);
}

export function resolvePhase3PatientWorkspaceConversationBundleByClusterRef(input: {
  clusterRef: string;
  scenario?: Phase3PatientWorkspaceConversationScenario;
  routeKey?: Phase3PatientWorkspaceConversationRouteKey;
}): Phase3PatientWorkspaceConversationBundle {
  const seed = requireSeed(
    seedByClusterRef.get(input.clusterRef),
    `PHASE3_PATIENT_WORKSPACE_CONVERSATION_CLUSTER_MISSING:${input.clusterRef}`,
  );
  return buildBundle(seed, input);
}

export function tryResolvePhase3PatientWorkspaceConversationBundle(input: {
  taskId?: string | null;
  requestRef?: string | null;
  clusterRef?: string | null;
  scenario?: Phase3PatientWorkspaceConversationScenario;
  routeKey?: Phase3PatientWorkspaceConversationRouteKey;
}): Phase3PatientWorkspaceConversationBundle | null {
  const scenario = input.scenario;
  const routeKey = input.routeKey;
  if (input.taskId && seedByTaskId.has(input.taskId)) {
    return resolvePhase3PatientWorkspaceConversationBundleByTaskId({
      taskId: input.taskId,
      scenario,
      routeKey,
    });
  }
  if (input.requestRef && seedByRequestRef.has(input.requestRef)) {
    return resolvePhase3PatientWorkspaceConversationBundleByRequestRef({
      requestRef: input.requestRef,
      scenario,
      routeKey,
    });
  }
  if (input.clusterRef && seedByClusterRef.has(input.clusterRef)) {
    return resolvePhase3PatientWorkspaceConversationBundleByClusterRef({
      clusterRef: input.clusterRef,
      scenario,
      routeKey,
    });
  }
  return null;
}

export function makePhase3PatientWorkspaceConversationParityTupleHash(
  bundle: Pick<
    Phase3PatientWorkspaceConversationBundle,
    | "taskId"
    | "requestRef"
    | "clusterRef"
    | "threadId"
    | "moreInfoCycleRef"
    | "replyWindowCheckpointRef"
    | "scenario"
    | "routeKey"
  >,
): string {
  return `pwc_271_${hashToken(
    [
      bundle.taskId,
      bundle.requestRef,
      bundle.clusterRef,
      bundle.threadId,
      bundle.moreInfoCycleRef,
      bundle.replyWindowCheckpointRef,
      bundle.scenario,
      bundle.routeKey,
    ].join("::"),
  )}`;
}
