import type {
  ReceiptBucket,
  ReceiptCommunicationPosture,
  ReceiptMacroState,
  ReceiptPromiseState,
  ReceiptSimulationState,
} from "./patient-intake-receipt-surface";

export const REQUEST_STATUS_SURFACE_POSTURES = [
  "summary_read_only",
  "recovery_only",
] as const;
export const REQUEST_STATUS_ETA_VISIBILITY = ["visible", "withheld"] as const;

export type RequestStatusSurfacePosture = (typeof REQUEST_STATUS_SURFACE_POSTURES)[number];
export type RequestStatusEtaVisibility = (typeof REQUEST_STATUS_ETA_VISIBILITY)[number];
export type StatusTone = "live" | "safe" | "review" | "blocked" | "continuity";
export type StatusTimelineState = "complete" | "current" | "pending";
export type IntakeRouteAliasSource = "start_request_alias" | "seq_139_contract";

export interface RequestStatusSimulationState {
  surfacePosture: RequestStatusSurfacePosture;
  etaVisibility: RequestStatusEtaVisibility;
  lastMeaningfulUpdateLine: string;
  allowRefreshPatch: boolean;
  nextPatchMacroState: ReceiptMacroState | null;
  nextPatchReceiptBucket: ReceiptBucket | null;
  nextPatchPromiseState: ReceiptPromiseState | null;
  nextPatchCommunicationPosture: ReceiptCommunicationPosture | null;
}

export interface RequestStatusTimelineStepView {
  key: string;
  label: string;
  description: string;
  state: StatusTimelineState;
}

export interface RequestStatusNavigationView {
  label: string;
  dataTestId: string;
  targetPathname: string;
  navigationContractRef: string;
  destinationType: "same_shell_route";
}

export interface RequestStatusActionCardView extends RequestStatusNavigationView {
  title: string;
  body: string;
  tone: StatusTone;
}

export interface RequestStatusSurfaceView {
  contractId: "PHASE1_MINIMAL_TRACK_REQUEST_SURFACE_V1";
  consistencyEnvelopeId: "PHASE1_PATIENT_RECEIPT_CONSISTENCY_ENVELOPE_V1";
  receiptConsistencyKey: string;
  statusConsistencyKey: string;
  requestPublicId: string;
  requestLineageRef: string;
  referenceCode: string;
  macroState: ReceiptMacroState;
  macroStateLabel: string;
  macroStateTone: StatusTone;
  promiseState: ReceiptPromiseState;
  promiseStateLabel: string;
  promiseTone: StatusTone;
  receiptBucket: ReceiptBucket;
  receiptBucketLabel: string;
  surfacePosture: RequestStatusSurfacePosture;
  surfacePostureLabel: string;
  surfacePostureTone: StatusTone;
  title: string;
  summary: string;
  lastMeaningfulUpdateLine: string;
  currentStateHeading: string;
  currentStateBody: string;
  nextStepMessage: string;
  etaVisible: boolean;
  etaNoteTitle: string;
  etaNoteBody: string;
  timelineHeading: string;
  timeline: readonly RequestStatusTimelineStepView[];
  actionNeededCard: RequestStatusActionCardView | null;
  returnLink: RequestStatusNavigationView | null;
  refreshActionLabel: string | null;
  liveRegionMessage: string;
}

interface BuildRequestStatusSurfaceInput {
  draftPublicId: string;
  requestPublicId: string;
  aliasSource: IntakeRouteAliasSource;
  receiptSimulation: ReceiptSimulationState;
  statusSimulation: RequestStatusSimulationState;
}

interface ApplyRequestStatusRefreshPatchInput {
  receiptSimulation: ReceiptSimulationState;
  statusSimulation: RequestStatusSimulationState;
}

interface ApplyRequestStatusRefreshPatchResult {
  receiptSimulation: ReceiptSimulationState;
  statusSimulation: RequestStatusSimulationState;
}

function includesValue<T extends readonly string[]>(values: T, candidate: unknown): candidate is T[number] {
  return typeof candidate === "string" && values.includes(candidate);
}

function formatReferenceCode(requestPublicId: string): string {
  return requestPublicId.replaceAll("_", "-").toUpperCase();
}

function macroStateLabel(macroState: ReceiptMacroState): string {
  switch (macroState) {
    case "received":
      return "Received";
    case "in_review":
      return "In review";
    case "we_need_you":
      return "Action needed";
    case "completed":
      return "Completed";
    case "urgent_action":
      return "Urgent action";
  }
}

function macroStateTone(macroState: ReceiptMacroState): StatusTone {
  switch (macroState) {
    case "received":
    case "in_review":
      return "live";
    case "completed":
      return "safe";
    case "we_need_you":
      return "review";
    case "urgent_action":
      return "blocked";
  }
}

function receiptBucketLabel(receiptBucket: ReceiptBucket): string {
  switch (receiptBucket) {
    case "same_day":
      return "Same day";
    case "next_working_day":
      return "Next working day";
    case "within_2_working_days":
      return "Within 2 working days";
    case "after_2_working_days":
      return "After 2 working days";
  }
}

function promiseStateLabel(promiseState: ReceiptPromiseState): string {
  switch (promiseState) {
    case "on_track":
      return "On track";
    case "improved":
      return "Improved";
    case "at_risk":
      return "At risk";
    case "revised_downward":
      return "Revised downward";
    case "recovery_required":
      return "Recovery required";
  }
}

function promiseTone(promiseState: ReceiptPromiseState): StatusTone {
  switch (promiseState) {
    case "on_track":
      return "safe";
    case "improved":
      return "continuity";
    case "at_risk":
    case "revised_downward":
      return "review";
    case "recovery_required":
      return "blocked";
  }
}

function surfacePostureLabel(surfacePosture: RequestStatusSurfacePosture): string {
  return surfacePosture === "recovery_only" ? "Recovery only" : "Read only";
}

function surfacePostureTone(surfacePosture: RequestStatusSurfacePosture): StatusTone {
  return surfacePosture === "recovery_only" ? "continuity" : "live";
}

function titleForMacroState(macroState: ReceiptMacroState): string {
  switch (macroState) {
    case "received":
      return "We have your request";
    case "in_review":
      return "Your request is being reviewed";
    case "we_need_you":
      return "Your request may need one more detail";
    case "completed":
      return "Your request review is complete";
    case "urgent_action":
      return "This request now needs urgent attention";
  }
}

function summaryForState(
  macroState: ReceiptMacroState,
  surfacePosture: RequestStatusSurfacePosture,
): string {
  if (surfacePosture === "recovery_only") {
    return "This page is limited while we confirm the safest status for this request.";
  }
  switch (macroState) {
    case "received":
      return "The request was captured and is waiting for the first routine review step.";
    case "in_review":
      return "The first routine review is under way. We will update this page when there is a safe status change.";
    case "we_need_you":
      return "The review may need a follow-up detail, so this page now shows one clear action.";
    case "completed":
      return "The routine review is complete. Keep this page as a reference if you need it.";
    case "urgent_action":
      return "Routine tracking has changed because a faster or safer follow-up path is now required.";
  }
}

function lastMeaningfulUpdateLineForState(macroState: ReceiptMacroState): string {
  switch (macroState) {
    case "received":
      return "Last meaningful update: the request was received into the routine review line.";
    case "in_review":
      return "Last meaningful update: the request moved into the first review step.";
    case "we_need_you":
      return "Last meaningful update: the review flagged that we may need one more detail.";
    case "completed":
      return "Last meaningful update: the routine review path reached a completed state.";
    case "urgent_action":
      return "Last meaningful update: routine tracking changed to urgent follow-up.";
  }
}

function currentStateHeading(macroState: ReceiptMacroState): string {
  switch (macroState) {
    case "received":
      return "Current state";
    case "in_review":
      return "Current review";
    case "we_need_you":
      return "Current action-needed state";
    case "completed":
      return "Current completion state";
    case "urgent_action":
      return "Current urgent state";
  }
}

function currentStateBody(macroState: ReceiptMacroState): string {
  switch (macroState) {
    case "received":
      return "We have the request and have not yet moved it beyond the first received state.";
    case "in_review":
      return "A clinician or coordinator is reviewing the request details.";
    case "we_need_you":
      return "The review may pause for a follow-up detail. This page stays read only until we ask for something specific.";
    case "completed":
      return "The routine review is complete and there is no new patient action to take right now.";
    case "urgent_action":
      return "Routine tracking can no longer stay calm, so this page shows the urgent next step.";
  }
}

function nextStepMessage(macroState: ReceiptMacroState): string {
  switch (macroState) {
    case "received":
      return "Next, the request moves into the first review step.";
    case "in_review":
      return "Next, we update this page only if we need more from you or when the review outcome changes.";
    case "we_need_you":
      return "Next, keep the same request reference available and review the saved request if we ask for more detail.";
    case "completed":
      return "Next, keep the request reference if you need to mention this review again.";
    case "urgent_action":
      return "Next, open the urgent guidance path for the safest follow-up action.";
  }
}

function buildTimeline(macroState: ReceiptMacroState): readonly RequestStatusTimelineStepView[] {
  switch (macroState) {
    case "received":
      return [
        {
          key: "received",
          label: "Received",
          description: "The request has been received.",
          state: "current",
        },
        {
          key: "in_review",
          label: "In review",
          description: "The first review begins when the practice reaches this request.",
          state: "pending",
        },
        {
          key: "completed",
          label: "Completed",
          description: "The routine review path ends here when no further patient action is required.",
          state: "pending",
        },
      ];
    case "in_review":
      return [
        {
          key: "received",
          label: "Received",
          description: "The request was captured safely.",
          state: "complete",
        },
        {
          key: "in_review",
          label: "In review",
          description: "The first review pass is under way.",
          state: "current",
        },
        {
          key: "completed",
          label: "Completed",
          description: "The routine review path ends here when the current work is settled.",
          state: "pending",
        },
      ];
    case "we_need_you":
      return [
        {
          key: "received",
          label: "Received",
          description: "The request was captured safely.",
          state: "complete",
        },
        {
          key: "in_review",
          label: "In review",
          description: "The first review began before this status changed to action needed.",
          state: "complete",
        },
        {
          key: "action_needed",
          label: "Action needed",
          description: "The current state may need one more detail from you.",
          state: "current",
        },
        {
          key: "completed",
          label: "Completed",
          description: "The routine review path settles once the needed follow-up is resolved.",
          state: "pending",
        },
      ];
    case "completed":
      return [
        {
          key: "received",
          label: "Received",
          description: "The request was captured safely.",
          state: "complete",
        },
        {
          key: "in_review",
          label: "In review",
          description: "The first review pass took place.",
          state: "complete",
        },
        {
          key: "completed",
          label: "Completed",
          description: "The routine review path is complete.",
          state: "current",
        },
      ];
    case "urgent_action":
      return [
        {
          key: "received",
          label: "Received",
          description: "The request was captured safely.",
          state: "complete",
        },
        {
          key: "in_review",
          label: "In review",
          description: "The initial review moved the request into a more urgent follow-up path.",
          state: "complete",
        },
        {
          key: "urgent_action",
          label: "Urgent action",
          description: "Routine tracking now shows the urgent next step.",
          state: "current",
        },
      ];
  }
}

function statusReceiptPath(
  aliasSource: IntakeRouteAliasSource,
  draftPublicId: string,
  requestPublicId: string,
): string {
  return aliasSource === "seq_139_contract"
    ? `/intake/requests/${requestPublicId}/receipt`
    : `/start-request/${draftPublicId}/receipt`;
}

function urgentGuidancePath(
  aliasSource: IntakeRouteAliasSource,
  draftPublicId: string,
  requestPublicId: string,
): string {
  return aliasSource === "seq_139_contract"
    ? `/intake/requests/${requestPublicId}/urgent-guidance`
    : `/start-request/${draftPublicId}/urgent-guidance`;
}

function buildActionNeededCard(
  macroState: ReceiptMacroState,
  aliasSource: IntakeRouteAliasSource,
  draftPublicId: string,
  requestPublicId: string,
): RequestStatusActionCardView | null {
  switch (macroState) {
    case "we_need_you":
      return {
        title: "Keep this request ready",
        body: "We may need one more detail. Keep this reference available and review the saved request if we ask for more.",
        label: "Review this request",
        dataTestId: "track-action-needed-cta",
        targetPathname: statusReceiptPath(aliasSource, draftPublicId, requestPublicId),
        navigationContractRef: "PNRC_162_ACTION_NEEDED_RETURN_TO_RECEIPT_V1",
        destinationType: "same_shell_route",
        tone: "review",
      };
    case "urgent_action":
      return {
        title: "Open urgent guidance",
        body: "Routine tracking is no longer the safest place to stop. Use urgent guidance for the next action.",
        label: "Open urgent guidance",
        dataTestId: "track-action-needed-cta",
        targetPathname: urgentGuidancePath(aliasSource, draftPublicId, requestPublicId),
        navigationContractRef: "PNRC_162_STATUS_TO_URGENT_GUIDANCE_V1",
        destinationType: "same_shell_route",
        tone: "blocked",
      };
    default:
      return null;
  }
}

export function createDefaultRequestStatusSimulation(): RequestStatusSimulationState {
  return {
    surfacePosture: "summary_read_only",
    etaVisibility: "visible",
    lastMeaningfulUpdateLine: lastMeaningfulUpdateLineForState("received"),
    allowRefreshPatch: true,
    nextPatchMacroState: "in_review",
    nextPatchReceiptBucket: "within_2_working_days",
    nextPatchPromiseState: "on_track",
    nextPatchCommunicationPosture: "queued",
  };
}

export function normalizeRequestStatusSimulation(
  partialSimulation: Partial<RequestStatusSimulationState> | null | undefined,
): RequestStatusSimulationState {
  const fallback = createDefaultRequestStatusSimulation();
  if (!partialSimulation) {
    return fallback;
  }
  const nextPatchMacroState = includesValue(
    ["received", "in_review", "we_need_you", "completed", "urgent_action"] as const,
    partialSimulation.nextPatchMacroState,
  )
    ? partialSimulation.nextPatchMacroState
    : fallback.nextPatchMacroState;
  const nextPatchReceiptBucket = includesValue(
    ["same_day", "next_working_day", "within_2_working_days", "after_2_working_days"] as const,
    partialSimulation.nextPatchReceiptBucket,
  )
    ? partialSimulation.nextPatchReceiptBucket
    : fallback.nextPatchReceiptBucket;
  const nextPatchPromiseState = includesValue(
    ["on_track", "improved", "at_risk", "revised_downward", "recovery_required"] as const,
    partialSimulation.nextPatchPromiseState,
  )
    ? partialSimulation.nextPatchPromiseState
    : fallback.nextPatchPromiseState;
  const nextPatchCommunicationPosture = includesValue(
    ["queued", "delivery_pending", "delivered", "recovery_required"] as const,
    partialSimulation.nextPatchCommunicationPosture,
  )
    ? partialSimulation.nextPatchCommunicationPosture
    : fallback.nextPatchCommunicationPosture;
  return {
    surfacePosture: includesValue(REQUEST_STATUS_SURFACE_POSTURES, partialSimulation.surfacePosture)
      ? partialSimulation.surfacePosture
      : fallback.surfacePosture,
    etaVisibility: includesValue(REQUEST_STATUS_ETA_VISIBILITY, partialSimulation.etaVisibility)
      ? partialSimulation.etaVisibility
      : fallback.etaVisibility,
    lastMeaningfulUpdateLine:
      typeof partialSimulation.lastMeaningfulUpdateLine === "string" &&
      partialSimulation.lastMeaningfulUpdateLine.trim().length > 0
        ? partialSimulation.lastMeaningfulUpdateLine.trim()
        : fallback.lastMeaningfulUpdateLine,
    allowRefreshPatch:
      typeof partialSimulation.allowRefreshPatch === "boolean"
        ? partialSimulation.allowRefreshPatch
        : fallback.allowRefreshPatch,
    nextPatchMacroState,
    nextPatchReceiptBucket,
    nextPatchPromiseState,
    nextPatchCommunicationPosture,
  };
}

export function applyRequestStatusRefreshPatch(
  input: ApplyRequestStatusRefreshPatchInput,
): ApplyRequestStatusRefreshPatchResult {
  if (!input.statusSimulation.allowRefreshPatch || !input.statusSimulation.nextPatchMacroState) {
    return input;
  }

  const nextMacroState = input.statusSimulation.nextPatchMacroState;
  const nextPromiseState =
    input.statusSimulation.nextPatchPromiseState ?? input.receiptSimulation.promiseState;
  const nextSurfacePosture =
    nextPromiseState === "recovery_required" || nextMacroState === "urgent_action"
      ? "recovery_only"
      : "summary_read_only";

  return {
    receiptSimulation: {
      ...input.receiptSimulation,
      macroState: nextMacroState,
      receiptBucket:
        input.statusSimulation.nextPatchReceiptBucket ?? input.receiptSimulation.receiptBucket,
      promiseState: nextPromiseState,
      communicationPosture:
        input.statusSimulation.nextPatchCommunicationPosture ??
        input.receiptSimulation.communicationPosture,
      allowInlinePatch: false,
      nextPatchMacroState: null,
      nextPatchPromiseState: null,
      nextPatchCommunicationPosture: null,
    },
    statusSimulation: {
      ...input.statusSimulation,
      surfacePosture: nextSurfacePosture,
      etaVisibility: nextSurfacePosture === "recovery_only" ? "withheld" : "visible",
      lastMeaningfulUpdateLine: lastMeaningfulUpdateLineForState(nextMacroState),
      allowRefreshPatch: false,
      nextPatchMacroState: null,
      nextPatchReceiptBucket: null,
      nextPatchPromiseState: null,
      nextPatchCommunicationPosture: null,
    },
  };
}

export function buildRequestStatusSurface(
  input: BuildRequestStatusSurfaceInput,
): RequestStatusSurfaceView {
  const receiptState = input.receiptSimulation;
  const statusState = input.statusSimulation;
  const etaVisible =
    statusState.etaVisibility === "visible" && receiptState.promiseState !== "recovery_required";
  const returnPathname = statusReceiptPath(
    input.aliasSource,
    input.draftPublicId,
    input.requestPublicId,
  );
  const actionNeededCard = buildActionNeededCard(
    receiptState.macroState,
    input.aliasSource,
    input.draftPublicId,
    input.requestPublicId,
  );

  return {
    contractId: "PHASE1_MINIMAL_TRACK_REQUEST_SURFACE_V1",
    consistencyEnvelopeId: "PHASE1_PATIENT_RECEIPT_CONSISTENCY_ENVELOPE_V1",
    receiptConsistencyKey: `receipt_consistency::${input.requestPublicId}`,
    statusConsistencyKey: `status_consistency::${input.requestPublicId}`,
    requestPublicId: input.requestPublicId,
    requestLineageRef: `request_lineage::${input.requestPublicId}`,
    referenceCode: formatReferenceCode(input.requestPublicId),
    macroState: receiptState.macroState,
    macroStateLabel: macroStateLabel(receiptState.macroState),
    macroStateTone: macroStateTone(receiptState.macroState),
    promiseState: receiptState.promiseState,
    promiseStateLabel: promiseStateLabel(receiptState.promiseState),
    promiseTone: promiseTone(receiptState.promiseState),
    receiptBucket: receiptState.receiptBucket,
    receiptBucketLabel: receiptBucketLabel(receiptState.receiptBucket),
    surfacePosture: statusState.surfacePosture,
    surfacePostureLabel: surfacePostureLabel(statusState.surfacePosture),
    surfacePostureTone: surfacePostureTone(statusState.surfacePosture),
    title: titleForMacroState(receiptState.macroState),
    summary: summaryForState(receiptState.macroState, statusState.surfacePosture),
    lastMeaningfulUpdateLine:
      statusState.lastMeaningfulUpdateLine || lastMeaningfulUpdateLineForState(receiptState.macroState),
    currentStateHeading: currentStateHeading(receiptState.macroState),
    currentStateBody: currentStateBody(receiptState.macroState),
    nextStepMessage: nextStepMessage(receiptState.macroState),
    etaVisible,
    etaNoteTitle: etaVisible ? "Expected review window" : "Expected review window is temporarily unavailable",
    etaNoteBody: etaVisible
      ? `${receiptBucketLabel(receiptState.receiptBucket)}. Current estimate: ${promiseStateLabel(
          receiptState.promiseState,
        )}. This is a review window, not an exact time.`
      : "The expected review window is temporarily hidden while we confirm the safest status.",
    timelineHeading: "Status timeline",
    timeline: buildTimeline(receiptState.macroState),
    actionNeededCard,
    returnLink: actionNeededCard
      ? null
      : {
          label: "Back to receipt",
          dataTestId: "track-return-link",
          targetPathname: returnPathname,
          navigationContractRef: "PNRC_162_RETURN_TO_RECEIPT_V1",
          destinationType: "same_shell_route",
        },
    refreshActionLabel:
      statusState.allowRefreshPatch && statusState.surfacePosture !== "recovery_only" && !actionNeededCard
        ? "Refresh status"
        : null,
    liveRegionMessage:
      statusState.surfacePosture === "recovery_only"
        ? "Tracking is limited while we confirm the safest status."
        : `Tracking ready. Current state: ${macroStateLabel(receiptState.macroState)}.`,
  };
}
