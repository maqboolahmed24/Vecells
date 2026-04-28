export const NHS_APP_EMBEDDED_CHANNEL_486_TASK_ID = "seq_486";
export const NHS_APP_EMBEDDED_CHANNEL_486_VISUAL_MODE = "NHSApp_Embedded_Channel_Activation_486";
export const NHS_APP_EMBEDDED_CHANNEL_486_PATH = "/nhs-app/embedded";

export type NHSAppEmbedded486State = "approved" | "deferred" | "blocked" | "unsupported";
export type NHSAppEmbedded486Flow =
  | "start"
  | "status"
  | "booking"
  | "pharmacy"
  | "secure-link"
  | "artifact";

export interface NHSAppEmbedded486FlowContent {
  readonly flow: NHSAppEmbedded486Flow;
  readonly title: string;
  readonly summary: string;
  readonly statusLine: string;
  readonly selectedContext: string;
  readonly primaryAction: string;
}

export interface NHSAppEmbedded486Context {
  readonly taskId: typeof NHS_APP_EMBEDDED_CHANNEL_486_TASK_ID;
  readonly visualMode: typeof NHS_APP_EMBEDDED_CHANNEL_486_VISUAL_MODE;
  readonly state: NHSAppEmbedded486State;
  readonly flow: NHSAppEmbedded486Flow;
  readonly channelExposureState: "enabled" | "deferred_hidden" | "blocked_hidden";
  readonly routePosture: "live" | "placeholder_only" | "read_only" | "blocked";
  readonly statusStrip: string;
  readonly provenance: string;
  readonly selectedAnchorRef: string;
  readonly returnRoute: string;
  readonly safeReturnLabel: string;
  readonly primaryActionVisible: boolean;
  readonly fallbackVisible: boolean;
  readonly unsupportedBridgeState: "none" | "governed_fallback" | "blocked_missing_fallback";
  readonly downloadActionExposed: false;
  readonly printActionExposed: false;
  readonly browserHandoffActionExposed: boolean;
  readonly content: NHSAppEmbedded486FlowContent;
}

const flowContent: Record<NHSAppEmbedded486Flow, NHSAppEmbedded486FlowContent> = {
  start: {
    flow: "start",
    title: "Start a request",
    summary: "Tell the practice what you need. Your answers stay with this request.",
    statusLine: "Draft ready",
    selectedContext: "New medical request",
    primaryAction: "Continue request",
  },
  status: {
    flow: "status",
    title: "Request status",
    summary: "Your request has been received and is waiting for the next practice update.",
    statusLine: "In progress",
    selectedContext: "Request 2049",
    primaryAction: "View request",
  },
  booking: {
    flow: "booking",
    title: "Appointment booking",
    summary: "Choose a suitable appointment slot and return to this request when you are done.",
    statusLine: "Slots available",
    selectedContext: "Booking case 293",
    primaryAction: "Choose a slot",
  },
  pharmacy: {
    flow: "pharmacy",
    title: "Pharmacy update",
    summary: "Check the pharmacy handoff and keep the same request context.",
    statusLine: "With pharmacy",
    selectedContext: "Pharmacy choice",
    primaryAction: "View pharmacy update",
  },
  "secure-link": {
    flow: "secure-link",
    title: "Secure link recovery",
    summary: "We kept the last safe place in your journey so you can continue from here.",
    statusLine: "Ready to return",
    selectedContext: "Secure return",
    primaryAction: "Return to request",
  },
  artifact: {
    flow: "artifact",
    title: "Letter summary",
    summary: "Read the summary in this page. We can send the full file another safe way if needed.",
    statusLine: "Summary available",
    selectedContext: "Appointment letter",
    primaryAction: "Read summary",
  },
};

const knownStates = new Set<NHSAppEmbedded486State>([
  "approved",
  "deferred",
  "blocked",
  "unsupported",
]);
const knownFlows = new Set<NHSAppEmbedded486Flow>([
  "start",
  "status",
  "booking",
  "pharmacy",
  "secure-link",
  "artifact",
]);

export function isNHSAppEmbeddedChannel486Path(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized === NHS_APP_EMBEDDED_CHANNEL_486_PATH;
}

function normalizeState(value: string | null): NHSAppEmbedded486State {
  return value && knownStates.has(value as NHSAppEmbedded486State)
    ? (value as NHSAppEmbedded486State)
    : "approved";
}

function normalizeFlow(value: string | null): NHSAppEmbedded486Flow {
  return value && knownFlows.has(value as NHSAppEmbedded486Flow)
    ? (value as NHSAppEmbedded486Flow)
    : "start";
}

export function buildNHSAppEmbedded486Path(
  state: NHSAppEmbedded486State,
  flow: NHSAppEmbedded486Flow,
): string {
  return `${NHS_APP_EMBEDDED_CHANNEL_486_PATH}?state=${encodeURIComponent(state)}&flow=${encodeURIComponent(flow)}`;
}

export function resolveNHSAppEmbedded486Context(input: {
  readonly pathname: string;
  readonly search: string;
}): NHSAppEmbedded486Context {
  const params = new URLSearchParams(input.search);
  const state = normalizeState(params.get("state"));
  const flow = normalizeFlow(params.get("flow"));
  const content = flowContent[flow];
  const selectedAnchorRef = `selected-anchor:486:${flow}`;
  const returnRoute = buildNHSAppEmbedded486Path("approved", "status");

  if (state === "deferred") {
    return {
      taskId: NHS_APP_EMBEDDED_CHANNEL_486_TASK_ID,
      visualMode: NHS_APP_EMBEDDED_CHANNEL_486_VISUAL_MODE,
      state,
      flow,
      channelExposureState: "deferred_hidden",
      routePosture: "placeholder_only",
      statusStrip: "This NHS App route is not available for your practice yet.",
      provenance: "The same request remains available through supported routes.",
      selectedAnchorRef,
      returnRoute,
      safeReturnLabel: "Check request status",
      primaryActionVisible: false,
      fallbackVisible: true,
      unsupportedBridgeState: "none",
      downloadActionExposed: false,
      printActionExposed: false,
      browserHandoffActionExposed: false,
      content,
    };
  }

  if (state === "blocked") {
    return {
      taskId: NHS_APP_EMBEDDED_CHANNEL_486_TASK_ID,
      visualMode: NHS_APP_EMBEDDED_CHANNEL_486_VISUAL_MODE,
      state,
      flow,
      channelExposureState: "blocked_hidden",
      routePosture: "blocked",
      statusStrip: "This route is paused while we check it.",
      provenance: "Your last safe summary is still shown here.",
      selectedAnchorRef,
      returnRoute,
      safeReturnLabel: "Return safely",
      primaryActionVisible: false,
      fallbackVisible: true,
      unsupportedBridgeState: "none",
      downloadActionExposed: false,
      printActionExposed: false,
      browserHandoffActionExposed: false,
      content,
    };
  }

  if (state === "unsupported") {
    return {
      taskId: NHS_APP_EMBEDDED_CHANNEL_486_TASK_ID,
      visualMode: NHS_APP_EMBEDDED_CHANNEL_486_VISUAL_MODE,
      state,
      flow: "artifact",
      channelExposureState: "enabled",
      routePosture: "placeholder_only",
      statusStrip: "The summary is ready in this page.",
      provenance: "The file action is handled another safe way in the NHS App.",
      selectedAnchorRef: "selected-anchor:486:artifact",
      returnRoute,
      safeReturnLabel: "Back to request status",
      primaryActionVisible: false,
      fallbackVisible: true,
      unsupportedBridgeState: "governed_fallback",
      downloadActionExposed: false,
      printActionExposed: false,
      browserHandoffActionExposed: false,
      content: flowContent.artifact,
    };
  }

  return {
    taskId: NHS_APP_EMBEDDED_CHANNEL_486_TASK_ID,
    visualMode: NHS_APP_EMBEDDED_CHANNEL_486_VISUAL_MODE,
    state,
    flow,
    channelExposureState: "enabled",
    routePosture: "live",
    statusStrip: content.statusLine,
    provenance: "Updated just now",
    selectedAnchorRef,
    returnRoute,
    safeReturnLabel: "Back to request status",
    primaryActionVisible: true,
    fallbackVisible: false,
    unsupportedBridgeState: "none",
    downloadActionExposed: false,
    printActionExposed: false,
    browserHandoffActionExposed: false,
    content,
  };
}
