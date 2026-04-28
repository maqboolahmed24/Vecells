import { tryResolvePhase3PatientWorkspaceConversationBundle } from "@vecells/domain-kernel";
import type {
  Phase3PatientWorkspaceConversationBundle,
  Phase3PatientWorkspaceConversationRouteKey,
  Phase3PatientWorkspaceConversationScenario,
} from "@vecells/domain-kernel";

import {
  makePatientRequestReturnBundle215,
  resolvePatientHomeRequestsDetailEntry,
  type PatientRequestDetailProjection,
  type PatientRequestReturnBundle,
} from "./patient-home-requests-detail-routes.model";
import {
  resolveWorkflowEntry,
  type PatientCallbackStatusProjection,
  type PatientMoreInfoResponseThreadProjection,
  type PatientMoreInfoStatusProjection,
  type WorkflowEntryProjection,
} from "./patient-more-info-callback-contact-repair.model";
import {
  resolveRecordsCommunicationsEntry,
  type ConversationCommandSettlement,
  type PatientConversationCluster,
  type PatientConversationPreviewDigest,
  type PatientReceiptEnvelope,
  type RecordsCommunicationsEntryProjection,
} from "./patient-records-communications.model";

export const EMBEDDED_REQUEST_STATUS_TASK_ID = "par_390";
export const EMBEDDED_REQUEST_STATUS_VISUAL_MODE = "NHSApp_Embedded_Request_Status";
export const EMBEDDED_REQUEST_STATUS_CONTRACT_REF =
  "EmbeddedRequestStatusContract:390:phase3-request-conversation-callback";
export const EMBEDDED_REQUEST_STATUS_SHELL_CONTINUITY_KEY =
  "patient.portal.requests.embedded.request-status";

export type EmbeddedRequestStatusRouteKey =
  | "status"
  | "more_info"
  | "callback"
  | "messages"
  | "recovery";

export type EmbeddedRequestStatusFixture =
  | "status"
  | "more-info"
  | "callback"
  | "callback-drifted"
  | "messages"
  | "recovery"
  | "read-only"
  | "expired";

export type EmbeddedRequestActionability =
  | "live"
  | "secondary"
  | "read_only"
  | "frozen"
  | "recovery_required";

export interface EmbeddedRequestTimelineItem {
  readonly key: string;
  readonly title: string;
  readonly body: string;
  readonly stateLabel: string;
  readonly tone: "attention" | "info" | "success" | "warning" | "blocked" | "quiet";
  readonly projectionRef: string;
}

export interface EmbeddedRequestCurrentState {
  readonly title: string;
  readonly body: string;
  readonly stateLabel: string;
  readonly nextActionLabel: string;
  readonly actionability: EmbeddedRequestActionability;
  readonly liveRegionMessage: string;
}

export interface EmbeddedRequestContinuityEvidence {
  readonly evidenceRef: string;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly selectedAnchorRef: string;
  readonly shellContinuityKey: typeof EMBEDDED_REQUEST_STATUS_SHELL_CONTINUITY_KEY;
  readonly sameShellState: PatientRequestReturnBundle["sameShellState"];
  readonly routeFamilyRef: "rf_patient_requests_embedded";
  readonly sourceProjectionRefs: readonly string[];
}

export interface EmbeddedRequestStatusContext {
  readonly taskId: typeof EMBEDDED_REQUEST_STATUS_TASK_ID;
  readonly visualMode: typeof EMBEDDED_REQUEST_STATUS_VISUAL_MODE;
  readonly contractRef: typeof EMBEDDED_REQUEST_STATUS_CONTRACT_REF;
  readonly routeKey: EmbeddedRequestStatusRouteKey;
  readonly requestRef: string;
  readonly fixture: EmbeddedRequestStatusFixture;
  readonly embeddedPath: string;
  readonly canonicalPath: string;
  readonly requestDetail: PatientRequestDetailProjection;
  readonly returnBundle: PatientRequestReturnBundle;
  readonly workflowEntry: WorkflowEntryProjection;
  readonly moreInfoStatus: PatientMoreInfoStatusProjection;
  readonly moreInfoThread: PatientMoreInfoResponseThreadProjection;
  readonly callbackStatus: PatientCallbackStatusProjection;
  readonly recordsEntry: RecordsCommunicationsEntryProjection;
  readonly conversationCluster: PatientConversationCluster;
  readonly conversationPreview: PatientConversationPreviewDigest;
  readonly receiptEnvelope: PatientReceiptEnvelope;
  readonly commandSettlement: ConversationCommandSettlement;
  readonly conversationBundle: Phase3PatientWorkspaceConversationBundle;
  readonly timeline: readonly EmbeddedRequestTimelineItem[];
  readonly currentState: EmbeddedRequestCurrentState;
  readonly continuityEvidence: EmbeddedRequestContinuityEvidence;
  readonly recoveryBanner: {
    readonly visible: boolean;
    readonly title: string;
    readonly body: string;
    readonly actionLabel: string;
  };
  readonly primaryActionLabel: string;
  readonly secondaryActionLabel: string | null;
  readonly announcement: string;
}

function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim() || "/nhs-app/requests/request_211_a/status";
  return trimmed === "/" ? "/nhs-app/requests/request_211_a/status" : trimmed.replace(/\/+$/, "");
}

export function isEmbeddedRequestStatusPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return (
    /^\/nhs-app\/requests\/[^/]+(?:\/(?:status|detail|more-info|callback|messages|conversation|recovery))?$/.test(
      normalized,
    ) ||
    /^\/embedded-request-status(?:\/[^/]+)?(?:\/(?:status|detail|more-info|callback|messages|conversation|recovery))?$/.test(
      normalized,
    )
  );
}

function routeKeyFromSegment(segment: string | null): EmbeddedRequestStatusRouteKey {
  switch (segment) {
    case "more-info":
      return "more_info";
    case "callback":
      return "callback";
    case "messages":
    case "conversation":
      return "messages";
    case "recovery":
      return "recovery";
    case "detail":
    case "status":
    default:
      return "status";
  }
}

function normalizeFixture(
  fixture: string | null,
  routeKey: EmbeddedRequestStatusRouteKey,
): EmbeddedRequestStatusFixture {
  if (
    fixture === "status" ||
    fixture === "more-info" ||
    fixture === "callback" ||
    fixture === "callback-drifted" ||
    fixture === "messages" ||
    fixture === "recovery" ||
    fixture === "read-only" ||
    fixture === "expired"
  ) {
    return fixture;
  }
  if (routeKey === "more_info") return "more-info";
  if (routeKey === "callback") return "callback";
  if (routeKey === "messages") return "messages";
  if (routeKey === "recovery") return "recovery";
  return "status";
}

export function parseEmbeddedRequestStatusLocation(input: {
  readonly pathname: string;
  readonly search?: string;
}): {
  readonly requestRef: string;
  readonly routeKey: EmbeddedRequestStatusRouteKey;
  readonly fixture: EmbeddedRequestStatusFixture;
} {
  const normalized = normalizePathname(input.pathname);
  const params = new URLSearchParams(input.search ?? "");
  const parts = normalized.split("/").filter(Boolean);
  let requestRef = params.get("request") ?? "request_211_a";
  let segment: string | null = params.get("view");

  const requestsIndex = parts.indexOf("requests");
  if (requestsIndex >= 0) {
    requestRef = parts[requestsIndex + 1] ?? requestRef;
    segment = parts[requestsIndex + 2] ?? segment ?? "status";
  }

  const embeddedIndex = parts.indexOf("embedded-request-status");
  if (embeddedIndex >= 0) {
    requestRef = parts[embeddedIndex + 1] ?? requestRef;
    segment = parts[embeddedIndex + 2] ?? segment ?? "status";
  }

  const routeKey = routeKeyFromSegment(segment);
  return {
    requestRef,
    routeKey,
    fixture: normalizeFixture(params.get("fixture"), routeKey),
  };
}

export function embeddedRequestStatusPath(input: {
  readonly requestRef: string;
  readonly routeKey: EmbeddedRequestStatusRouteKey;
  readonly fixture?: EmbeddedRequestStatusFixture | null;
}): string {
  const segment =
    input.routeKey === "more_info"
      ? "more-info"
      : input.routeKey === "status"
        ? "status"
        : input.routeKey;
  const params = new URLSearchParams();
  if (input.fixture) params.set("fixture", input.fixture);
  return `/nhs-app/requests/${input.requestRef}/${segment}${params.size > 0 ? `?${params.toString()}` : ""}`;
}

function canonicalPathFor(input: {
  readonly requestRef: string;
  readonly routeKey: EmbeddedRequestStatusRouteKey;
  readonly fixture: EmbeddedRequestStatusFixture;
}): string {
  if (input.routeKey === "more_info") {
    if (input.fixture === "expired") return `/requests/${input.requestRef}/more-info/expired`;
    if (input.fixture === "read-only" || input.fixture === "recovery")
      return `/requests/${input.requestRef}/more-info/read-only`;
    return `/requests/${input.requestRef}/more-info`;
  }
  if (input.routeKey === "callback") {
    return input.fixture === "callback-drifted" || input.fixture === "recovery"
      ? `/requests/${input.requestRef}/callback/at-risk`
      : `/requests/${input.requestRef}/callback`;
  }
  if (input.routeKey === "recovery") {
    return `/requests/${input.requestRef}/more-info/read-only`;
  }
  return `/requests/${input.requestRef}`;
}

function conversationRouteKeyFor(
  routeKey: EmbeddedRequestStatusRouteKey,
): Phase3PatientWorkspaceConversationRouteKey {
  if (routeKey === "more_info") return "conversation_more_info";
  if (routeKey === "callback") return "conversation_callback";
  if (routeKey === "messages") return "conversation_messages";
  if (routeKey === "recovery") return "conversation_repair";
  return "conversation_overview";
}

function scenarioFor(fixture: EmbeddedRequestStatusFixture): Phase3PatientWorkspaceConversationScenario {
  if (fixture === "callback-drifted" || fixture === "recovery") return "repair";
  if (fixture === "read-only") return "stale";
  if (fixture === "expired") return "expired";
  return "live";
}

function requireDetail(requestRef: string): PatientRequestDetailProjection {
  const entry = resolvePatientHomeRequestsDetailEntry({
    pathname: `/requests/${requestRef}`,
    restoredBundle: makePatientRequestReturnBundle215(requestRef, "all", "soft_navigation"),
  });
  if (!entry.requestDetail) {
    throw new Error(`EMBEDDED_REQUEST_STATUS_DETAIL_MISSING:${requestRef}`);
  }
  return entry.requestDetail;
}

function workflowPathFor(input: {
  readonly requestRef: string;
  readonly routeKey: EmbeddedRequestStatusRouteKey;
  readonly fixture: EmbeddedRequestStatusFixture;
}): string {
  if (input.fixture === "callback-drifted" || input.routeKey === "recovery") {
    return `/requests/${input.requestRef}/callback/at-risk`;
  }
  if (input.fixture === "expired") return `/requests/${input.requestRef}/more-info/expired`;
  if (input.fixture === "read-only") return `/requests/${input.requestRef}/more-info/read-only`;
  if (input.routeKey === "callback") return `/requests/${input.requestRef}/callback`;
  if (input.routeKey === "more_info") return `/requests/${input.requestRef}/more-info`;
  return `/requests/${input.requestRef}/more-info`;
}

function messagePathFor(bundle: Phase3PatientWorkspaceConversationBundle): string {
  return bundle.routeRefs.messageCluster;
}

function fallbackConversationBundle(input: {
  readonly requestRef: string;
  readonly fixture: EmbeddedRequestStatusFixture;
  readonly routeKey: EmbeddedRequestStatusRouteKey;
}): Phase3PatientWorkspaceConversationBundle {
  return (
    tryResolvePhase3PatientWorkspaceConversationBundle({
      requestRef: input.requestRef,
      scenario: scenarioFor(input.fixture),
      routeKey: conversationRouteKeyFor(input.routeKey),
    }) ??
    tryResolvePhase3PatientWorkspaceConversationBundle({
      requestRef: "request_211_a",
      scenario: scenarioFor(input.fixture),
      routeKey: conversationRouteKeyFor(input.routeKey),
    })!
  );
}

function toneFromState(state: string): EmbeddedRequestTimelineItem["tone"] {
  if (/repair|blocked|expired|failed|missed/.test(state)) return "blocked";
  if (/late|risk|needed|attention/.test(state)) return "attention";
  if (/submitted|settled|complete|delivered/.test(state)) return "success";
  if (/scheduled|queued|review|pending/.test(state)) return "info";
  return "quiet";
}

function actionabilityFor(input: {
  readonly routeKey: EmbeddedRequestStatusRouteKey;
  readonly fixture: EmbeddedRequestStatusFixture;
  readonly moreInfoStatus: PatientMoreInfoStatusProjection;
  readonly thread: PatientMoreInfoResponseThreadProjection;
  readonly callback: PatientCallbackStatusProjection;
  readonly preview: PatientConversationPreviewDigest;
}): EmbeddedRequestActionability {
  if (input.fixture === "recovery" || input.fixture === "callback-drifted") return "recovery_required";
  if (input.fixture === "read-only" || input.fixture === "expired") return "frozen";
  if (input.routeKey === "more_info") {
    return input.thread.answerabilityState === "answerable" && input.moreInfoStatus.surfaceState === "reply_needed"
      ? "live"
      : "read_only";
  }
  if (input.routeKey === "callback") {
    return input.callback.surfaceState === "ready" ? "secondary" : "recovery_required";
  }
  if (input.routeKey === "messages") {
    return input.preview.replyNeededState === "needed" ? "live" : "read_only";
  }
  return input.moreInfoStatus.surfaceState === "reply_needed" ? "live" : "secondary";
}

function currentStateFor(input: {
  readonly detail: PatientRequestDetailProjection;
  readonly routeKey: EmbeddedRequestStatusRouteKey;
  readonly fixture: EmbeddedRequestStatusFixture;
  readonly moreInfoStatus: PatientMoreInfoStatusProjection;
  readonly thread: PatientMoreInfoResponseThreadProjection;
  readonly callback: PatientCallbackStatusProjection;
  readonly preview: PatientConversationPreviewDigest;
  readonly actionability: EmbeddedRequestActionability;
  readonly bundle: Phase3PatientWorkspaceConversationBundle;
}): EmbeddedRequestCurrentState {
  const frozen =
    input.actionability === "frozen" || input.actionability === "recovery_required";
  if (input.routeKey === "more_info") {
    return {
      title: frozen ? "Reply is paused" : "Reply needed from you",
      body: frozen
        ? input.bundle.parity.blockedActionSummary ??
          "The previous reply route stays visible, but sending is paused until the latest state is checked."
        : "The practice needs one concise reply before review can continue.",
      stateLabel: input.moreInfoStatus.surfaceState.replaceAll("_", " "),
      nextActionLabel: frozen ? "Review safe summary" : "Continue your reply",
      actionability: input.actionability,
      liveRegionMessage: `More information state is ${input.moreInfoStatus.surfaceState.replaceAll("_", " ")}.`,
    };
  }
  if (input.routeKey === "callback") {
    return {
      title: input.callback.windowRiskState === "repair_required" ? "Callback route needs checking" : "Callback expected",
      body:
        input.callback.windowRiskState === "repair_required"
          ? "The callback remains visible, but reply and callback controls are paused until contact details are checked."
          : "The practice has kept this callback in the request timeline and the current contact route is still usable.",
      stateLabel: input.callback.patientVisibleState.replaceAll("_", " "),
      nextActionLabel:
        input.callback.windowRiskState === "repair_required" ? "Check contact details" : "View callback status",
      actionability: input.actionability,
      liveRegionMessage: `Callback state is ${input.callback.patientVisibleState.replaceAll("_", " ")}.`,
    };
  }
  if (input.routeKey === "messages") {
    return {
      title: input.preview.title,
      body: input.preview.preview,
      stateLabel: input.preview.state.replaceAll("_", " "),
      nextActionLabel:
        input.preview.dominantNextActionRef === "send_secure_reply"
          ? "Reply in this request"
          : "Open message update",
      actionability: input.actionability,
      liveRegionMessage: `Message preview state is ${input.preview.state.replaceAll("_", " ")}.`,
    };
  }
  if (input.routeKey === "recovery") {
    return {
      title: "Latest state changed",
      body:
        input.bundle.parity.blockedActionSummary ??
        "The last safe summary remains in place while live controls are suppressed.",
      stateLabel: input.bundle.parity.deliveryPosture.replaceAll("_", " "),
      nextActionLabel: "Review safe summary",
      actionability: "recovery_required",
      liveRegionMessage: "Request controls are paused because actionability changed.",
    };
  }
  return {
    title: input.detail.statusRibbon.label,
    body: input.detail.patientSafeDetail,
    stateLabel: input.detail.summary.statusText,
    nextActionLabel: input.detail.summary.actionLabel,
    actionability: input.actionability,
    liveRegionMessage: `Request status is ${input.detail.summary.statusText}.`,
  };
}

function timelineFor(input: {
  readonly detail: PatientRequestDetailProjection;
  readonly workflow: WorkflowEntryProjection;
  readonly records: RecordsCommunicationsEntryProjection;
  readonly bundle: Phase3PatientWorkspaceConversationBundle;
}): readonly EmbeddedRequestTimelineItem[] {
  const moreInfoState = input.workflow.moreInfoStatus.surfaceState;
  const callbackState = input.workflow.callbackStatus.patientVisibleState;
  const messageState = input.records.activeCluster.previewDigest.state;
  return [
    {
      key: "request",
      title: input.detail.summary.displayLabel,
      body: input.detail.summary.patientSummary,
      stateLabel: input.detail.summary.statusText,
      tone: toneFromState(input.detail.summary.statusTone),
      projectionRef: input.detail.summary.summaryProjectionRef,
    },
    {
      key: "more-info",
      title: "More information",
      body: `Due window: ${new Date(input.workflow.moreInfoStatus.dueAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}. ${input.bundle.parity.cycleDispositionLabel.replaceAll("_", " ")}.`,
      stateLabel: moreInfoState.replaceAll("_", " "),
      tone: toneFromState(moreInfoState),
      projectionRef: input.workflow.moreInfoStatus.moreInfoStatusProjectionId,
    },
    {
      key: "callback",
      title: "Callback",
      body: input.workflow.callbackStatus.callbackExpectationEnvelopeRef,
      stateLabel: callbackState.replaceAll("_", " "),
      tone: toneFromState(input.workflow.callbackStatus.windowRiskState),
      projectionRef: input.workflow.callbackStatus.callbackStatusProjectionId,
    },
    {
      key: "messages",
      title: input.records.activeCluster.previewDigest.title,
      body: input.records.activeCluster.previewDigest.preview,
      stateLabel: messageState.replaceAll("_", " "),
      tone: toneFromState(messageState),
      projectionRef: input.records.activeCluster.previewDigest.previewDigestRef,
    },
  ];
}

function primaryLabelFor(state: EmbeddedRequestCurrentState): string {
  return state.nextActionLabel;
}

function secondaryLabelFor(routeKey: EmbeddedRequestStatusRouteKey): string | null {
  return routeKey === "status" ? null : "Request status";
}

export function resolveEmbeddedRequestStatusContext(input: {
  readonly pathname: string;
  readonly search?: string;
}): EmbeddedRequestStatusContext {
  const parsed = parseEmbeddedRequestStatusLocation(input);
  const canonicalPath = canonicalPathFor(parsed);
  const detail = requireDetail(parsed.requestRef);
  const workflow = resolveWorkflowEntry(workflowPathFor(parsed));
  const conversationBundle = fallbackConversationBundle(parsed);
  const records = resolveRecordsCommunicationsEntry(messagePathFor(conversationBundle));
  const actionability = actionabilityFor({
    routeKey: parsed.routeKey,
    fixture: parsed.fixture,
    moreInfoStatus: workflow.moreInfoStatus,
    thread: workflow.moreInfoThread,
    callback: workflow.callbackStatus,
    preview: records.activeCluster.previewDigest,
  });
  const currentState = currentStateFor({
    detail,
    routeKey: parsed.routeKey,
    fixture: parsed.fixture,
    moreInfoStatus: workflow.moreInfoStatus,
    thread: workflow.moreInfoThread,
    callback: workflow.callbackStatus,
    preview: records.activeCluster.previewDigest,
    actionability,
    bundle: conversationBundle,
  });
  const timeline = timelineFor({ detail, workflow, records, bundle: conversationBundle });
  const recoveryVisible =
    parsed.fixture === "recovery" ||
    parsed.fixture === "callback-drifted" ||
    parsed.fixture === "read-only" ||
    parsed.fixture === "expired";
  return {
    taskId: EMBEDDED_REQUEST_STATUS_TASK_ID,
    visualMode: EMBEDDED_REQUEST_STATUS_VISUAL_MODE,
    contractRef: EMBEDDED_REQUEST_STATUS_CONTRACT_REF,
    routeKey: parsed.routeKey,
    requestRef: detail.requestRef,
    fixture: parsed.fixture,
    embeddedPath: embeddedRequestStatusPath(parsed),
    canonicalPath,
    requestDetail: detail,
    returnBundle: detail.returnBundle,
    workflowEntry: workflow,
    moreInfoStatus: workflow.moreInfoStatus,
    moreInfoThread: workflow.moreInfoThread,
    callbackStatus: workflow.callbackStatus,
    recordsEntry: records,
    conversationCluster: records.activeCluster,
    conversationPreview: records.activeCluster.previewDigest,
    receiptEnvelope: records.receiptEnvelope,
    commandSettlement: records.commandSettlement,
    conversationBundle,
    timeline,
    currentState,
    continuityEvidence: {
      evidenceRef: conversationBundle.continuityEvidenceRef,
      requestRef: detail.requestRef,
      requestLineageRef: detail.requestLineageRef,
      selectedAnchorRef:
        parsed.routeKey === "messages"
          ? records.timelineAnchor.anchorRef
          : parsed.routeKey === "callback"
            ? conversationBundle.routeDefaults.callbackAnchorRef
            : parsed.routeKey === "more_info"
              ? conversationBundle.routeDefaults.moreInfoAnchorRef
              : detail.returnBundle.selectedAnchorRef,
      shellContinuityKey: EMBEDDED_REQUEST_STATUS_SHELL_CONTINUITY_KEY,
      sameShellState:
        actionability === "recovery_required" || actionability === "frozen"
          ? "recovery_required"
          : detail.returnBundle.sameShellState,
      routeFamilyRef: "rf_patient_requests_embedded",
      sourceProjectionRefs: [
        "PatientRequestSummaryProjection",
        "PatientMoreInfoStatusProjection",
        "PatientConversationPreviewDigest",
        "PatientCallbackStatusProjection",
        "Phase3PatientWorkspaceConversationBundle",
      ],
    },
    recoveryBanner: {
      visible: recoveryVisible,
      title:
        parsed.fixture === "expired"
          ? "The reply window has ended"
          : parsed.fixture === "callback-drifted" || parsed.fixture === "recovery"
            ? "Action state changed"
            : "This action is read-only",
      body:
        conversationBundle.parity.blockedActionSummary ??
        "The last safe summary is preserved in this request while live controls are paused.",
      actionLabel: "Review safe summary",
    },
    primaryActionLabel: primaryLabelFor(currentState),
    secondaryActionLabel: secondaryLabelFor(parsed.routeKey),
    announcement: currentState.liveRegionMessage,
  };
}
