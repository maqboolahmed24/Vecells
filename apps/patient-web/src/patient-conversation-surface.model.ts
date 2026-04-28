import {
  resolvePatientHomeRequestsDetailEntry,
  type PatientHomeRequestsDetailEntryProjection,
  type PatientRequestDetailProjection,
  type PatientRequestReturnBundle,
} from "./patient-home-requests-detail-routes.model";
import {
  resolveWorkflowEntry,
  type PatientCallbackStatusProjection as WorkflowCallbackStatusProjection,
  type PatientContactRepairProjection,
  type PatientMoreInfoResponseThreadProjection,
  type PatientMoreInfoStatusProjection,
  type PatientReachabilitySummaryProjection,
} from "./patient-more-info-callback-contact-repair.model";
import {
  resolveRecordsCommunicationsEntry,
  type ConversationCommandSettlement,
  type ConversationSubthreadProjection,
  type ConversationThreadProjection,
  type PatientComposerLease,
  type PatientConversationCluster,
  type PatientReceiptEnvelope,
} from "./patient-records-communications.model";
import {
  makePhase3PatientWorkspaceConversationParityTupleHash,
  resolvePhase3PatientWorkspaceConversationBundleByRequestRef,
  tryResolvePhase3PatientWorkspaceConversationBundle,
  type Phase3PatientWorkspaceAccessState,
  type Phase3PatientWorkspaceConversationBundle,
  type Phase3PatientWorkspaceConversationRouteKey,
  type Phase3PatientWorkspaceDeliveryPosture,
  type Phase3PatientWorkspaceDueState,
  type Phase3PatientWorkspaceRepairPosture,
  type Phase3PatientWorkspaceReplyEligibilityState,
} from "@vecells/domain-kernel";

export const PATIENT_CONVERSATION_SURFACE_TASK_ID =
  "par_266_phase3_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_conversation_surface_for_more_info_callback_and_message_updates";
export const PATIENT_CONVERSATION_SURFACE_VISUAL_MODE = "Calm_Care_Conversation";
export const PATIENT_CONVERSATION_RETURN_STORAGE_KEY =
  "patient-home-requests-detail-215::return-bundle";
export const PATIENT_CONVERSATION_CONTINUITY_STORAGE_KEY =
  "patient-conversation-266::continuity";

export type PatientConversationRouteKey =
  | "conversation_overview"
  | "conversation_more_info"
  | "conversation_callback"
  | "conversation_messages"
  | "conversation_repair";

export type PatientConversationScenario = "live" | "repair" | "stale" | "blocked" | "expired";
export type PatientConversationOrigin = "request" | "messages";

export type PatientConversationState =
  | "reply_needed"
  | "awaiting_callback"
  | "message_update"
  | "contact_repair"
  | "stale_recoverable"
  | "blocked_policy"
  | "expired_reply_window";

export type PatientConversationDominantAction =
  | "open_more_info_reply"
  | "send_more_info_reply"
  | "check_callback_status"
  | "read_message_update"
  | "repair_contact_route"
  | "return_to_request"
  | "return_to_messages"
  | "recover_in_same_shell"
  | "complete_step_up";

export interface PatientConversationContinuityRecord {
  readonly projectionName: "PatientConversationContinuityRecord";
  readonly requestRef: string;
  readonly routeKey: PatientConversationRouteKey;
  readonly scenario: PatientConversationScenario;
  readonly origin: PatientConversationOrigin;
  readonly anchorRef: string;
  readonly moreInfoStage: "draft" | "check" | "sent";
  readonly moreInfoAnswers: Record<string, string>;
  readonly messageDraft: string;
  readonly messageLocalAckState: "idle" | "pending";
  readonly repairApplied: boolean;
  readonly requestReturnBundleRef: string;
  readonly continuityEvidenceRef: string;
}

export interface PatientConversationEntryProjection {
  readonly projectionName: "PatientConversationEntryProjection";
  readonly routeKey: PatientConversationRouteKey;
  readonly visualMode: typeof PATIENT_CONVERSATION_SURFACE_VISUAL_MODE;
  readonly pathname: string;
  readonly requestRef: string;
  readonly requestTitle: string;
  readonly maskedPatientRef: string;
  readonly scenario: PatientConversationScenario;
  readonly origin: PatientConversationOrigin;
  readonly shellEntry: PatientHomeRequestsDetailEntryProjection;
  readonly detail: PatientRequestDetailProjection;
  readonly returnBundle: PatientRequestReturnBundle;
  readonly continuity: PatientConversationContinuityRecord;
  readonly patientConversationState: PatientConversationState;
  readonly dominantActionRef: PatientConversationDominantAction;
  readonly dominantActionLabel: string;
  readonly routeTitle: string;
  readonly routeSummary: string;
  readonly routeExplanation: string;
  readonly returnRouteRef: string;
  readonly returnLabel: string;
  readonly phase3ConversationBundleRef: string;
  readonly phase3StaffTaskId: string;
  readonly requestLineageRef: string;
  readonly phase3ConversationClusterRef: string;
  readonly phase3ConversationThreadId: string;
  readonly phase3ReplyWindowCheckpointRef: string;
  readonly phase3MoreInfoCycleRef: string;
  readonly phase3ReminderScheduleRef: string;
  readonly phase3EvidenceDeltaPacketRef: string;
  readonly phase3MoreInfoResponseDispositionRef: string;
  readonly phase3ConversationSettlementRef: string;
  readonly phase3SecureLinkAccessState: Phase3PatientWorkspaceAccessState;
  readonly phase3DueState: Phase3PatientWorkspaceDueState;
  readonly phase3ReplyEligibilityState: Phase3PatientWorkspaceReplyEligibilityState;
  readonly phase3DeliveryPosture: Phase3PatientWorkspaceDeliveryPosture;
  readonly phase3RepairPosture: Phase3PatientWorkspaceRepairPosture;
  readonly phase3ParityTupleHash: string;
  readonly moreInfoStatus: PatientMoreInfoStatusProjection;
  readonly moreInfoThread: PatientMoreInfoResponseThreadProjection;
  readonly callbackStatus: WorkflowCallbackStatusProjection;
  readonly reachabilitySummary: PatientReachabilitySummaryProjection;
  readonly contactRepair: PatientContactRepairProjection;
  readonly activeCluster: PatientConversationCluster;
  readonly conversationThread: ConversationThreadProjection;
  readonly subthreads: readonly ConversationSubthreadProjection[];
  readonly receiptEnvelope: PatientReceiptEnvelope;
  readonly commandSettlement: ConversationCommandSettlement;
  readonly composerLease: PatientComposerLease;
  readonly whatHappensNext: readonly string[];
  readonly blockedActionSummary: string | null;
  readonly acceptedGapRefs: readonly string[];
  readonly sourceProjectionRefs: readonly string[];
}

function tuple(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return `tuple_266_${hash.toString(16).padStart(8, "0")}`;
}

function routeKeyFor(pathname: string): PatientConversationRouteKey {
  if (/^\/requests\/[^/]+\/conversation\/more-info$/.test(pathname)) return "conversation_more_info";
  if (/^\/requests\/[^/]+\/conversation\/callback$/.test(pathname)) return "conversation_callback";
  if (/^\/requests\/[^/]+\/conversation\/messages$/.test(pathname)) return "conversation_messages";
  if (/^\/requests\/[^/]+\/conversation\/repair$/.test(pathname)) return "conversation_repair";
  return "conversation_overview";
}

function requestRefFor(pathname: string): string {
  const match = pathname.match(/^\/requests\/([^/]+)\/conversation(?:\/.*)?$/);
  return match?.[1] ?? "request_211_a";
}

function scenarioFor(search: string | undefined): PatientConversationScenario {
  const scenario = new URLSearchParams(search ?? "").get("state");
  if (
    scenario === "live" ||
    scenario === "repair" ||
    scenario === "stale" ||
    scenario === "blocked" ||
    scenario === "expired"
  ) {
    return scenario;
  }
  return "live";
}

function originFor(search: string | undefined): PatientConversationOrigin {
  return new URLSearchParams(search ?? "").get("origin") === "messages" ? "messages" : "request";
}

function routeKeyToBundleRouteKey(
  routeKey: PatientConversationRouteKey,
): Phase3PatientWorkspaceConversationRouteKey {
  return routeKey;
}

function anchorFor(
  routeKey: PatientConversationRouteKey,
  search: string | undefined,
  continuity: PatientConversationContinuityRecord | null,
  bundle: Phase3PatientWorkspaceConversationBundle,
): string {
  const anchor = new URLSearchParams(search ?? "").get("anchor");
  if (anchor) {
    return anchor;
  }
  if (continuity && continuity.routeKey === routeKey) {
    return continuity.anchorRef;
  }
  if (routeKey === "conversation_messages") return bundle.routeDefaults.messagesAnchorRef;
  if (routeKey === "conversation_callback") return bundle.routeDefaults.callbackAnchorRef;
  if (routeKey === "conversation_repair") return bundle.routeDefaults.repairAnchorRef;
  if (routeKey === "conversation_overview") return bundle.routeDefaults.overviewAnchorRef;
  return bundle.routeDefaults.moreInfoAnchorRef;
}

function cloneReturnBundle(
  bundle: PatientRequestReturnBundle,
  routeKey: PatientConversationRouteKey,
  anchorRef: string,
): PatientRequestReturnBundle {
  return {
    ...bundle,
    selectedAnchorRef: anchorRef,
    disclosurePosture: "child_route",
    selectedAnchorTupleHash: tuple(`${bundle.requestRef}:${routeKey}:${anchorRef}`),
    restoredBy: "soft_navigation",
    focusTestId:
      routeKey === "conversation_messages"
        ? "PatientMessageThread"
        : routeKey === "conversation_callback"
          ? "PatientCallbackStatusCard"
          : routeKey === "conversation_repair"
            ? "PatientContactRepairPrompt"
            : "PatientMoreInfoReplySurface",
  };
}

function buildContinuity(
  requestRef: string,
  routeKey: PatientConversationRouteKey,
  scenario: PatientConversationScenario,
  origin: PatientConversationOrigin,
  anchorRef: string,
  returnBundle: PatientRequestReturnBundle,
  continuity: PatientConversationContinuityRecord | null,
): PatientConversationContinuityRecord {
  if (continuity && continuity.requestRef === requestRef) {
    return {
      ...continuity,
      routeKey,
      scenario,
      origin,
      anchorRef,
      requestReturnBundleRef: returnBundle.requestReturnBundleRef,
      continuityEvidenceRef: returnBundle.continuityEvidenceRef,
    };
  }
  return {
    projectionName: "PatientConversationContinuityRecord",
    requestRef,
    routeKey,
    scenario,
    origin,
    anchorRef,
    moreInfoStage: "draft",
    moreInfoAnswers: {
      prompt_216_photo_timing: "Monday morning in daylight",
      prompt_216_symptom_change: "No clear change",
    },
    messageDraft: "",
    messageLocalAckState: "idle",
    repairApplied: false,
    requestReturnBundleRef: returnBundle.requestReturnBundleRef,
    continuityEvidenceRef: returnBundle.continuityEvidenceRef,
  };
}

function workflowPathForScenario(
  bundle: Phase3PatientWorkspaceConversationBundle,
  scenario: PatientConversationScenario,
  continuity: PatientConversationContinuityRecord,
): string {
  if (scenario === "expired") return bundle.routeRefs.workflowExpired;
  if (scenario === "blocked") return bundle.routeRefs.workflowReadOnly;
  if (scenario === "repair") {
    return continuity.repairApplied
      ? bundle.routeRefs.contactRepairApplied
      : bundle.routeRefs.workflowCallbackRepair;
  }
  return bundle.routeKey === "conversation_callback"
    ? bundle.routeRefs.workflowCallback
    : bundle.routeRefs.workflowMoreInfo;
}

function messagePathForScenario(
  bundle: Phase3PatientWorkspaceConversationBundle,
  scenario: PatientConversationScenario,
  routeKey: PatientConversationRouteKey,
): string {
  if (scenario === "repair" || routeKey === "conversation_repair") {
    return bundle.routeRefs.messageRepair;
  }
  if (scenario === "blocked") {
    return bundle.taskId === "task-412" ? bundle.routeRefs.messageCluster : "/messages/cluster_214_stepup";
  }
  if (scenario === "stale") {
    return bundle.taskId === "task-412" ? "/messages/cluster_214_dispute" : bundle.routeRefs.messageCluster;
  }
  return routeKey === "conversation_messages" ? bundle.routeRefs.messageThread : bundle.routeRefs.messageCluster;
}

function adjustMoreInfoStatus(
  status: PatientMoreInfoStatusProjection,
  scenario: PatientConversationScenario,
  continuity: PatientConversationContinuityRecord,
): PatientMoreInfoStatusProjection {
  if (continuity.moreInfoStage === "sent" && scenario === "live") {
    return {
      ...status,
      surfaceState: "reply_submitted",
      dominantActionRef: "return_to_request",
      latestResponseDispositionRef: "response_disposition_266_local_pending_review",
    };
  }
  if (scenario === "stale") {
    return {
      ...status,
      surfaceState: "read_only",
      dominantActionRef: "recover_session",
      placeholderContractRef: "patient_conversation_stale_recovery_266",
    };
  }
  return status;
}

function adjustMoreInfoThread(
  thread: PatientMoreInfoResponseThreadProjection,
  scenario: PatientConversationScenario,
  continuity: PatientConversationContinuityRecord,
): PatientMoreInfoResponseThreadProjection {
  const answerabilityState =
    scenario === "repair"
      ? "blocked_by_repair"
      : scenario === "blocked" || scenario === "stale"
        ? "read_only"
        : scenario === "expired"
          ? "expired"
          : "answerable";
  return {
    ...thread,
    currentStepIndex: continuity.moreInfoStage === "check" ? 1 : 0,
    answerabilityState,
    focusTransitionRef: continuity.anchorRef,
  };
}

function adjustCallbackStatus(
  status: WorkflowCallbackStatusProjection,
  scenario: PatientConversationScenario,
): WorkflowCallbackStatusProjection {
  if (scenario === "stale") {
    return {
      ...status,
      surfaceState: "read_only",
      dominantActionRef: "return_to_request",
      windowRiskState: "missed_window",
    };
  }
  if (scenario === "blocked") {
    return {
      ...status,
      surfaceState: "read_only",
      dominantActionRef: "return_to_request",
    };
  }
  return status;
}

function adjustReachabilitySummary(
  summary: PatientReachabilitySummaryProjection,
  scenario: PatientConversationScenario,
  continuity: PatientConversationContinuityRecord,
): PatientReachabilitySummaryProjection {
  if (scenario !== "repair") {
    return summary;
  }
  return {
    ...summary,
    verificationState: continuity.repairApplied ? "pending" : "needs_verification",
    routeAuthorityState: continuity.repairApplied ? "current" : "stale_verification",
    deliveryRiskState: continuity.repairApplied ? "at_risk" : "likely_failed",
    repairRequiredState: continuity.repairApplied ? "recovering" : "required",
    summaryState: continuity.repairApplied ? "recovering" : "blocked",
  };
}

function adjustContactRepair(
  repair: PatientContactRepairProjection,
  scenario: PatientConversationScenario,
  continuity: PatientConversationContinuityRecord,
): PatientContactRepairProjection {
  if (scenario === "stale") {
    return {
      ...repair,
      repairState: "recovery_required",
      resultingReachabilityAssessmentRef: "reachability_assessment_266_stale_recovery",
    };
  }
  if (scenario !== "repair") {
    return repair;
  }
  return {
    ...repair,
    repairState: continuity.repairApplied ? "applied" : "ready",
    verificationCheckpointRef: continuity.repairApplied
      ? "verification_checkpoint_266_rebound_pending"
      : repair.verificationCheckpointRef,
    resultingReachabilityAssessmentRef: continuity.repairApplied
      ? "reachability_assessment_266_rebound_pending"
      : repair.resultingReachabilityAssessmentRef,
  };
}

function adjustReceiptEnvelope(
  receipt: PatientReceiptEnvelope,
  scenario: PatientConversationScenario,
  continuity: PatientConversationContinuityRecord,
): PatientReceiptEnvelope {
  if (continuity.messageLocalAckState === "pending" && scenario === "live") {
    return {
      ...receipt,
      localAckState: "shown",
      transportAckState: "accepted",
      deliveryEvidenceState: "pending",
      deliveryRiskState: "at_risk",
      receiptLabel: "Reply sent. The practice still needs to review it.",
    };
  }
  if (scenario === "stale") {
    return {
      ...receipt,
      localAckState: "superseded",
      deliveryEvidenceState: "disputed",
      deliveryRiskState: "disputed",
      receiptLabel: "This update changed while you were reading it.",
    };
  }
  if (scenario === "blocked") {
    return {
      ...receipt,
      localAckState: "none",
      transportAckState: "not_started",
      deliveryEvidenceState: "pending",
      deliveryRiskState: "at_risk",
      receiptLabel: "Read the update after you complete the extra security step.",
    };
  }
  return receipt;
}

function adjustCommandSettlement(
  settlement: ConversationCommandSettlement,
  scenario: PatientConversationScenario,
  continuity: PatientConversationContinuityRecord,
): ConversationCommandSettlement {
  if (continuity.messageLocalAckState === "pending" && scenario === "live") {
    return {
      ...settlement,
      authoritativeOutcomeState: "pending",
      calmSettledLanguageAllowed: false,
    };
  }
  if (scenario === "stale" || scenario === "blocked") {
    return {
      ...settlement,
      authoritativeOutcomeState: "recovery_required",
      calmSettledLanguageAllowed: false,
    };
  }
  return settlement;
}

function adjustComposerLease(
  lease: PatientComposerLease,
  scenario: PatientConversationScenario,
  continuity: PatientConversationContinuityRecord,
): PatientComposerLease {
  if (scenario === "repair") {
    return {
      ...lease,
      leaseState: "blocked",
      blockedReasonRef: continuity.repairApplied
        ? "route_repair_rebound_pending"
        : "contact_route_repair_required",
    };
  }
  if (scenario === "stale") {
    return {
      ...lease,
      leaseState: "blocked",
      blockedReasonRef: "stale_recoverable_patient_conversation",
    };
  }
  return lease;
}

function adjustSubthreads(
  subthreads: readonly ConversationSubthreadProjection[],
  continuity: PatientConversationContinuityRecord,
  scenario: PatientConversationScenario,
  threadId: string,
): readonly ConversationSubthreadProjection[] {
  if (continuity.messageLocalAckState !== "pending" || scenario !== "live") {
    return subthreads;
  }
  return [
    {
      projectionName: "ConversationSubthreadProjection",
      subthreadRef: "subthread_266_local_pending",
      threadId,
      subthreadType: "patient_reply",
      timestampLabel: "Just now",
      title: "Your reply is waiting for review",
      body:
        "We have saved your reply in this conversation. It is not confirmed as delivered or reviewed yet.",
      visibilityProjectionRef: "communication_visibility_projection_266_local_pending",
      receiptEnvelopeRef: "receipt_266_local_pending",
    },
    ...subthreads,
  ];
}

function patientConversationStateFor(
  routeKey: PatientConversationRouteKey,
  scenario: PatientConversationScenario,
  continuity: PatientConversationContinuityRecord,
): PatientConversationState {
  if (scenario === "repair") return "contact_repair";
  if (scenario === "stale") return "stale_recoverable";
  if (scenario === "blocked") return "blocked_policy";
  if (scenario === "expired") return "expired_reply_window";
  if (routeKey === "conversation_callback") return "awaiting_callback";
  if (routeKey === "conversation_messages") return "message_update";
  if (continuity.moreInfoStage === "sent") return "message_update";
  return "reply_needed";
}

function dominantActionFor(
  routeKey: PatientConversationRouteKey,
  scenario: PatientConversationScenario,
  origin: PatientConversationOrigin,
  continuity: PatientConversationContinuityRecord,
  bundle: Phase3PatientWorkspaceConversationBundle,
): {
  readonly ref: PatientConversationDominantAction;
  readonly label: string;
} {
  if (routeKey === "conversation_messages" && scenario === "live") {
    return { ref: "read_message_update", label: "Read the latest update" };
  }
  if (routeKey === "conversation_callback" && scenario === "live") {
    return {
      ref: bundle.parity.dominantNextActionRef as PatientConversationDominantAction,
      label: bundle.parity.dominantNextActionLabel,
    };
  }
  if (
    scenario === "repair" ||
    scenario === "stale" ||
    scenario === "blocked" ||
    scenario === "expired"
  ) {
    return {
      ref: bundle.parity.dominantNextActionRef as PatientConversationDominantAction,
      label: bundle.parity.dominantNextActionLabel,
    };
  }
  if (routeKey === "conversation_more_info") {
    return continuity.moreInfoStage === "check"
      ? { ref: "send_more_info_reply", label: "Send this reply" }
      : { ref: "open_more_info_reply", label: "Continue your reply" };
  }
  return origin === "messages"
    ? { ref: "read_message_update", label: "Open the message update" }
    : { ref: "open_more_info_reply", label: "Reply to the practice" };
}

function routeTitleFor(routeKey: PatientConversationRouteKey): string {
  switch (routeKey) {
    case "conversation_more_info":
      return "More information";
    case "conversation_callback":
      return "Callback update";
    case "conversation_messages":
      return "Message update";
    case "conversation_repair":
      return "Contact details";
    default:
      return "Conversation";
  }
}

function routeSummaryFor(
  routeKey: PatientConversationRouteKey,
  state: PatientConversationState,
): string {
  if (state === "contact_repair") {
    return "Your reply or callback depends on checking the safest contact route first.";
  }
  if (state === "stale_recoverable") {
    return "A newer update changed this conversation while you were reading it.";
  }
  if (state === "blocked_policy") {
    return "This message stays visible, but the next action is paused until the extra check is complete.";
  }
  if (state === "expired_reply_window") {
    return "The reply window has closed, so this page keeps the safe summary and next step.";
  }
  switch (routeKey) {
    case "conversation_callback":
      return "See the latest callback timing, any risk to the callback, and what to do now.";
    case "conversation_messages":
      return "Read the latest update and keep the message status honest while review is still pending.";
    case "conversation_more_info":
      return "Answer the current question in the same shell and keep the request context in place.";
    default:
      return "This route keeps reply, callback, and message updates in one calm request view.";
  }
}

function routeExplanationFor(state: PatientConversationState): string {
  switch (state) {
    case "contact_repair":
      return "We will not promise that a reply or callback can continue until the contact route is safe again.";
    case "stale_recoverable":
      return "The last safe context stays visible so you can understand what changed before you continue.";
    case "blocked_policy":
      return "This page explains why the next step is paused instead of sending you back to the home page.";
    case "expired_reply_window":
      return "You can still review what the practice asked for and return to the request without losing your place.";
    default:
      return "The next step stays obvious, and any waiting or pending state is described in plain language.";
  }
}

function nextStepsFor(
  state: PatientConversationState,
  dominantActionLabel: string,
): readonly string[] {
  if (state === "contact_repair") {
    return [
      "Check the contact route shown on this page.",
      "Wait for us to confirm the updated route.",
      "Return to your request when the route is ready again.",
    ];
  }
  if (state === "stale_recoverable") {
    return [
      "Review the changed part of the conversation.",
      "Confirm the current next step in this same page.",
      "Return only when the latest context matches what you need to do.",
    ];
  }
  if (state === "blocked_policy") {
    return [
      "Complete the extra check if you can.",
      "Come back to this conversation once the page says you can continue.",
      "Use the request summary if you only need the safe overview.",
    ];
  }
  if (state === "expired_reply_window") {
    return [
      "Review the question and why it mattered.",
      "Use the request summary to see what happens next.",
      "Wait for the practice to send the next safe update.",
    ];
  }
  return [
    dominantActionLabel,
    "Keep reading the summary before you move to another action.",
    "Use the return button if you want to go back to the same request summary.",
  ];
}

function blockedActionSummaryFor(state: PatientConversationState): string | null {
  if (state === "contact_repair") {
    return "Reply and callback stay visible, but both are paused until the contact route is checked.";
  }
  if (state === "blocked_policy") {
    return "Reading is still available, but sending a reply is paused until the extra security check is complete.";
  }
  if (state === "stale_recoverable") {
    return "The earlier draft and anchor stay in place so you can compare them with the latest update.";
  }
  return null;
}

export function isPatientConversationPath(pathname: string): boolean {
  return /^\/requests\/[^/]+\/conversation(?:\/(?:more-info|callback|messages|repair))?$/.test(
    pathname,
  );
}

export function resolvePatientConversationEntry(input: {
  readonly pathname: string;
  readonly search?: string;
  readonly continuity?: PatientConversationContinuityRecord | null;
}): PatientConversationEntryProjection {
  const routeKey = routeKeyFor(input.pathname);
  const requestRef = requestRefFor(input.pathname);
  const scenario = scenarioFor(input.search);
  const origin = originFor(input.search);
  const phase3Bundle =
    tryResolvePhase3PatientWorkspaceConversationBundle({
      requestRef,
      scenario,
      routeKey: routeKeyToBundleRouteKey(routeKey),
    }) ??
    resolvePhase3PatientWorkspaceConversationBundleByRequestRef({
      requestRef: "request_211_a",
      scenario,
      routeKey: routeKeyToBundleRouteKey(routeKey),
    });
  const shellSource = resolvePatientHomeRequestsDetailEntry({
    pathname: `/requests/${phase3Bundle.requestRef}`,
    restoredBundle: input.continuity
      ? {
          ...resolvePatientHomeRequestsDetailEntry({
            pathname: `/requests/${phase3Bundle.requestRef}`,
          }).returnBundle,
          selectedAnchorRef: input.continuity.anchorRef,
          disclosurePosture: "child_route",
        }
      : null,
  });
  const detail = shellSource.requestDetail;
  if (!detail) {
    throw new Error("PATIENT_CONVERSATION_266_DETAIL_CONTEXT_MISSING");
  }

  const anchorRef = anchorFor(routeKey, input.search, input.continuity ?? null, phase3Bundle);
  const returnBundle = cloneReturnBundle(detail.returnBundle, routeKey, anchorRef);
  const continuity = buildContinuity(
    phase3Bundle.requestRef,
    routeKey,
    scenario,
    origin,
    anchorRef,
    returnBundle,
    input.continuity ?? null,
  );

  const workflow = resolveWorkflowEntry(workflowPathForScenario(phase3Bundle, scenario, continuity));
  const messageEntry = resolveRecordsCommunicationsEntry(
    messagePathForScenario(phase3Bundle, scenario, routeKey),
  );

  const moreInfoStatus = {
    ...adjustMoreInfoStatus(workflow.moreInfoStatus, scenario, continuity),
    cycleRef: phase3Bundle.moreInfoCycleRef,
    requestRef: phase3Bundle.requestRef,
    replyWindowCheckpointRef: phase3Bundle.replyWindowCheckpointRef,
    reminderScheduleRef: phase3Bundle.reminderScheduleRef,
    latestResponseDispositionRef:
      continuity.moreInfoStage === "sent"
        ? "response_disposition_266_local_pending_review"
        : phase3Bundle.moreInfoResponseDispositionRef,
    requestReturnBundleRef: returnBundle.requestReturnBundleRef,
    selectedAnchorRef: continuity.anchorRef,
    dueAt:
      phase3Bundle.parity.dueState === "expired"
        ? "2026-04-17T18:00:00.000Z"
        : "2026-04-17T18:00:00.000Z",
    lateReplyReviewUntilAt: "2026-04-18T12:00:00.000Z",
    experienceContinuityEvidenceRef: phase3Bundle.continuityEvidenceRef,
  };
  const moreInfoThread = {
    ...adjustMoreInfoThread(workflow.moreInfoThread, scenario, continuity),
    cycleRef: phase3Bundle.moreInfoCycleRef,
    requestRef: phase3Bundle.requestRef,
    requestLineageRef: phase3Bundle.requestLineageRef,
    requestReturnBundleRef: returnBundle.requestReturnBundleRef,
    focusTransitionRef: continuity.anchorRef,
  };
  const callbackStatus = {
    ...adjustCallbackStatus(workflow.callbackStatus, scenario),
    callbackCaseRef: phase3Bundle.callbackCaseRef,
    requestRef: phase3Bundle.requestRef,
    requestReturnBundleRef: returnBundle.requestReturnBundleRef,
    selectedAnchorRef: continuity.anchorRef,
    patientVisibleState:
      phase3Bundle.taskId === "task-412" || scenario === "repair"
        ? "route_repair_required"
        : workflow.callbackStatus.patientVisibleState,
    windowRiskState:
      phase3Bundle.parity.repairPosture === "required"
        ? "repair_required"
        : workflow.callbackStatus.windowRiskState,
    experienceContinuityEvidenceRef: phase3Bundle.continuityEvidenceRef,
  };
  const reachabilitySummary = adjustReachabilitySummary(
    workflow.reachabilitySummary,
    scenario,
    continuity,
  );
  const contactRepair = {
    ...adjustContactRepair(workflow.contactRepair, scenario, continuity),
    repairCaseRef: phase3Bundle.contactRepairCaseRef,
    governingObjectRef: phase3Bundle.requestRef,
    requestReturnBundleRef: returnBundle.requestReturnBundleRef,
    resumeContinuationRef: phase3Bundle.routeRefs.overview,
  };
  const receiptEnvelope = adjustReceiptEnvelope(
    messageEntry.receiptEnvelope,
    scenario,
    continuity,
  );
  const commandSettlement = adjustCommandSettlement(
    messageEntry.commandSettlement,
    scenario,
    continuity,
  );
  const composerLease = adjustComposerLease(messageEntry.composerLease, scenario, continuity);
  const activeCluster = {
    ...messageEntry.activeCluster,
    clusterRef: phase3Bundle.clusterRef,
    governingObjectRef: phase3Bundle.requestRef,
    selectedAnchorRef: continuity.anchorRef,
    clusterRouteRef: phase3Bundle.routeRefs.messageCluster,
  };
  const conversationThread = {
    ...messageEntry.conversationThread,
    threadId: phase3Bundle.threadId,
    clusterRef: phase3Bundle.clusterRef,
    threadTupleHash: tuple(`${phase3Bundle.clusterRef}:${phase3Bundle.threadId}`),
    composerLeaseRef: `composer_lease_${phase3Bundle.clusterRef}`,
  };
  const subthreads = adjustSubthreads(
    messageEntry.subthreads.map((subthread) => ({
      ...subthread,
      threadId: phase3Bundle.threadId,
    })),
    continuity,
    scenario,
    phase3Bundle.threadId,
  );

  const patientConversationState = patientConversationStateFor(routeKey, scenario, continuity);
  const dominantAction = dominantActionFor(routeKey, scenario, origin, continuity, phase3Bundle);
  const routeTitle = routeTitleFor(routeKey);
  const routeSummary = routeSummaryFor(routeKey, patientConversationState);
  const routeExplanation = routeExplanationFor(patientConversationState);
  const returnRouteRef =
    origin === "messages" ? activeCluster.clusterRouteRef : detail.returnBundle.detailRouteRef;
  const returnLabel = origin === "messages" ? "Return to message cluster" : "Return to request";
  const phase3ParityTupleHash = makePhase3PatientWorkspaceConversationParityTupleHash(phase3Bundle);

  return {
    projectionName: "PatientConversationEntryProjection",
    routeKey,
    visualMode: PATIENT_CONVERSATION_SURFACE_VISUAL_MODE,
    pathname: input.pathname,
    requestRef: phase3Bundle.requestRef,
    requestTitle: detail.title,
    maskedPatientRef: shellSource.home.maskedPatientRef,
    scenario,
    origin,
    shellEntry: {
      ...shellSource,
      pathname: input.pathname,
      requestDetail: detail,
      returnBundle,
    },
    detail,
    returnBundle,
    continuity,
    patientConversationState,
    dominantActionRef: dominantAction.ref,
    dominantActionLabel: dominantAction.label,
    routeTitle,
    routeSummary,
    routeExplanation,
    returnRouteRef,
    returnLabel,
    phase3ConversationBundleRef: phase3Bundle.bundleRef,
    phase3StaffTaskId: phase3Bundle.taskId,
    requestLineageRef: phase3Bundle.requestLineageRef,
    phase3ConversationClusterRef: phase3Bundle.clusterRef,
    phase3ConversationThreadId: phase3Bundle.threadId,
    phase3ReplyWindowCheckpointRef: phase3Bundle.replyWindowCheckpointRef,
    phase3MoreInfoCycleRef: phase3Bundle.moreInfoCycleRef,
    phase3ReminderScheduleRef: phase3Bundle.reminderScheduleRef,
    phase3EvidenceDeltaPacketRef: phase3Bundle.evidenceDeltaPacketRef,
    phase3MoreInfoResponseDispositionRef: phase3Bundle.moreInfoResponseDispositionRef,
    phase3ConversationSettlementRef: phase3Bundle.conversationSettlementRef,
    phase3SecureLinkAccessState: phase3Bundle.secureLinkAccessState,
    phase3DueState: phase3Bundle.parity.dueState,
    phase3ReplyEligibilityState: phase3Bundle.parity.replyEligibilityState,
    phase3DeliveryPosture: phase3Bundle.parity.deliveryPosture,
    phase3RepairPosture: phase3Bundle.parity.repairPosture,
    phase3ParityTupleHash,
    moreInfoStatus,
    moreInfoThread,
    callbackStatus,
    reachabilitySummary,
    contactRepair,
    activeCluster,
    conversationThread,
    subthreads,
    receiptEnvelope,
    commandSettlement,
    composerLease,
    whatHappensNext: nextStepsFor(patientConversationState, dominantAction.label),
    blockedActionSummary:
      phase3Bundle.parity.blockedActionSummary ?? blockedActionSummaryFor(patientConversationState),
    acceptedGapRefs: phase3Bundle.acceptedGapRefs,
    sourceProjectionRefs: [
      "Phase3PatientWorkspaceConversationBundle",
      "PatientRequestReturnBundle",
      "PatientMoreInfoStatusProjection",
      "PatientMoreInfoResponseThreadProjection",
      "PatientCallbackStatusProjection",
      "PatientReachabilitySummaryProjection",
      "PatientContactRepairProjection",
      "PatientConversationCluster",
      "ConversationThreadProjection",
      "ConversationSubthreadProjection",
      "PatientReceiptEnvelope",
      "ConversationCommandSettlement",
      "PatientComposerLease",
    ],
  };
}
