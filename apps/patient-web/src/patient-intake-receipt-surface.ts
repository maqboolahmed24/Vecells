import type { ContactSummaryView } from "./patient-intake-contact-preferences";

export const RECEIPT_MACRO_STATES = [
  "received",
  "in_review",
  "we_need_you",
  "completed",
  "urgent_action",
] as const;
export const RECEIPT_BUCKETS = [
  "same_day",
  "next_working_day",
  "within_2_working_days",
  "after_2_working_days",
] as const;
export const RECEIPT_PROMISE_STATES = [
  "on_track",
  "improved",
  "at_risk",
  "revised_downward",
  "recovery_required",
] as const;
export const RECEIPT_COMMUNICATION_POSTURES = [
  "queued",
  "delivery_pending",
  "delivered",
  "recovery_required",
] as const;

export type ReceiptMacroState = (typeof RECEIPT_MACRO_STATES)[number];
export type ReceiptBucket = (typeof RECEIPT_BUCKETS)[number];
export type ReceiptPromiseState = (typeof RECEIPT_PROMISE_STATES)[number];
export type ReceiptCommunicationPosture = (typeof RECEIPT_COMMUNICATION_POSTURES)[number];
export type ReceiptSummarySafetyState = "screen_clear" | "residual_risk_flagged";
export type ReceiptTone = "safe" | "continuity" | "review" | "blocked";
export type ReceiptTimelineStepState = "complete" | "current" | "pending";

export interface ReceiptSimulationState {
  macroState: ReceiptMacroState;
  receiptBucket: ReceiptBucket;
  promiseState: ReceiptPromiseState;
  communicationPosture: ReceiptCommunicationPosture;
  summarySafetyState: ReceiptSummarySafetyState;
  allowInlinePatch: boolean;
  nextPatchMacroState: ReceiptMacroState | null;
  nextPatchPromiseState: ReceiptPromiseState | null;
  nextPatchCommunicationPosture: ReceiptCommunicationPosture | null;
}

export interface ReceiptFactView {
  label: string;
  value: string;
  caption: string;
  dataTestId: string;
}

export interface ReceiptTimelineStepView {
  key: string;
  label: string;
  description: string;
  state: ReceiptTimelineStepState;
}

export interface ReceiptActionView {
  label: string;
  dataTestId: string;
  targetPathname: string;
  navigationContractRef: string;
  destinationType: "same_shell_route";
}

export interface ReceiptSurfaceView {
  contractId: "PHASE1_SAME_SHELL_RECEIPT_SURFACE_V1";
  consistencyEnvelopeId: string;
  receiptConsistencyKey: string;
  statusConsistencyKey: string;
  requestPublicId: string;
  requestLineageRef: string;
  copyVariantRef: "COPYVAR_142_SAFE_CLEAR_V1" | "COPYVAR_142_SAFE_REVIEW_V1";
  macroState: ReceiptMacroState;
  macroStateLabel: string;
  receiptBucket: ReceiptBucket;
  receiptBucketLabel: string;
  promiseState: ReceiptPromiseState;
  promiseStateLabel: string;
  promiseTone: ReceiptTone;
  communicationPosture: ReceiptCommunicationPosture;
  title: string;
  summary: string;
  currentStateHeading: string;
  currentStateBody: string;
  nextStepMessage: string;
  contactPlanNote: string;
  communicationBridgeNote: string;
  facts: readonly ReceiptFactView[];
  promiseNoteTitle: string;
  promiseNoteBody: string;
  timelineHeading: string;
  timeline: readonly ReceiptTimelineStepView[];
  trackRequestAction: ReceiptActionView;
  patchActionLabel: string | null;
  patchActionTargetMacroState: ReceiptMacroState | null;
  liveRegionMessage: string;
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
      return "Complete";
    case "urgent_action":
      return "Urgent action";
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

function promiseTone(promiseState: ReceiptPromiseState): ReceiptTone {
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

function confirmationTitle(summarySafetyState: ReceiptSummarySafetyState): ReceiptSurfaceView["title"] {
  return summarySafetyState === "residual_risk_flagged"
    ? "Your request has been sent for review"
    : "Your request has been sent";
}

function confirmationSummary(
  summarySafetyState: ReceiptSummarySafetyState,
  promiseState: ReceiptPromiseState,
): string {
  if (promiseState === "recovery_required") {
    return "We kept the request in the same lineage, but the current promise now needs a bounded recovery posture instead of a calmer receipt assumption.";
  }
  return summarySafetyState === "residual_risk_flagged"
    ? "We captured the request and marked it for closer review before the routine next step is chosen."
    : "We captured the request in the routine review path and kept the same shell lineage intact.";
}

function currentStateHeading(macroState: ReceiptMacroState): string {
  switch (macroState) {
    case "received":
      return "What happened just now";
    case "in_review":
      return "What is happening now";
    case "we_need_you":
      return "What needs your attention";
    case "completed":
      return "Where this request stands";
    case "urgent_action":
      return "Why the calm receipt changed";
  }
}

function currentStateBody(
  macroState: ReceiptMacroState,
  summarySafetyState: ReceiptSummarySafetyState,
): string {
  switch (macroState) {
    case "received":
      return summarySafetyState === "residual_risk_flagged"
        ? "We received the request and placed it into the review line with an added review-sensitive check."
        : "We received the request and placed it into the routine review line.";
    case "in_review":
      return "A clinician or coordinator is now reviewing the request details in the same lineage.";
    case "we_need_you":
      return "We need one more detail from you before routine review can continue.";
    case "completed":
      return "The routine review path for this request is complete.";
    case "urgent_action":
      return "The request can no longer keep a calm routine receipt posture and now needs a faster, bounded follow-up.";
  }
}

function nextStepMessage(macroState: ReceiptMacroState): string {
  switch (macroState) {
    case "received":
      return "Next, a clinician or coordinator starts the first review pass.";
    case "in_review":
      return "Next, we will update this same request if we need anything else or when review moves on.";
    case "we_need_you":
      return "Next, open the tracking view when you are ready to answer the new request for detail.";
    case "completed":
      return "Next, use the tracking view if you need the final reference again or want to confirm the closing state.";
    case "urgent_action":
      return "Next, use the tracking view or urgent guidance path for the safest follow-up action.";
  }
}

function communicationBridgeNote(
  communicationPosture: ReceiptCommunicationPosture,
  contactSummaryView: ContactSummaryView,
): string {
  switch (communicationPosture) {
    case "queued":
      return `A confirmation is queued for ${contactSummaryView.preferredRouteLabel.toLowerCase()} ${contactSummaryView.preferredDestinationMasked}; queued is not the same as delivered.`;
    case "delivery_pending":
      return "The confirmation handoff was accepted by the delivery service, but delivery is not yet confirmed.";
    case "delivered":
      return `Delivery evidence has been recorded for ${contactSummaryView.preferredRouteLabel.toLowerCase()} ${contactSummaryView.preferredDestinationMasked}.`;
    case "recovery_required":
      return "The planned confirmation route now needs recovery. We are not claiming delivery right now.";
  }
}

function contactPlanNote(contactSummaryView: ContactSummaryView): string {
  const followUpBoundary =
    contactSummaryView.followUpPermissionState === "granted"
      ? "Routine follow-up is allowed on the preferred route."
      : "Routine follow-up is not currently allowed on the preferred route.";
  return `${contactSummaryView.preferredRouteLabel} ${contactSummaryView.preferredDestinationMasked}. ${followUpBoundary}`;
}

function promiseNoteBody(
  promiseState: ReceiptPromiseState,
  receiptBucket: ReceiptBucket,
  communicationPosture: ReceiptCommunicationPosture,
): string {
  const bucketLabel = receiptBucketLabel(receiptBucket).toLowerCase();
  switch (promiseState) {
    case "on_track":
      return `The current estimate still sits inside the ${bucketLabel} bucket.`;
    case "improved":
      return `The estimate has improved, but we still show the safer ${bucketLabel} bucket rather than a more precise timestamp.`;
    case "at_risk":
      return `The current signals narrow confidence, so the receipt keeps the conservative ${bucketLabel} bucket visible.`;
    case "revised_downward":
      return `The expected wait widened, so the receipt now shows the more conservative ${bucketLabel} bucket.`;
    case "recovery_required":
      return communicationPosture === "recovery_required"
        ? "The receipt cannot keep a calm delivery or timing promise right now. Follow the bounded recovery guidance instead of assuming confirmation has arrived."
        : "The receipt cannot keep a calm timing promise right now, so the next safe step is shown conservatively.";
  }
}

function buildTimeline(
  macroState: ReceiptMacroState,
  nextStep: string,
): readonly ReceiptTimelineStepView[] {
  const secondStepState: ReceiptTimelineStepState =
    macroState === "received" ? "pending" : macroState === "in_review" ? "current" : "complete";
  const thirdStepKey =
    macroState === "completed"
      ? "completed"
      : macroState === "we_need_you"
        ? "we_need_you"
        : macroState === "urgent_action"
          ? "urgent_action"
          : "next_update";
  const thirdStepLabel =
    macroState === "completed"
      ? "Complete"
      : macroState === "we_need_you"
        ? "We need you"
        : macroState === "urgent_action"
          ? "Recovery required"
          : "Next update";
  const thirdStepState: ReceiptTimelineStepState =
    macroState === "received" || macroState === "in_review" ? "pending" : "current";
  return [
    {
      key: "received",
      label: "Received",
      description: "Your request was captured in the same request lineage.",
      state: macroState === "received" ? "current" : "complete",
    },
    {
      key: "in_review",
      label: "In review",
      description: "A clinician or coordinator reads the request details.",
      state: secondStepState,
    },
    {
      key: thirdStepKey,
      label: thirdStepLabel,
      description: nextStep,
      state: thirdStepState,
    },
  ];
}

export function createDefaultReceiptSimulation(): ReceiptSimulationState {
  return {
    macroState: "received",
    receiptBucket: "within_2_working_days",
    promiseState: "on_track",
    communicationPosture: "queued",
    summarySafetyState: "screen_clear",
    allowInlinePatch: true,
    nextPatchMacroState: "in_review",
    nextPatchPromiseState: "on_track",
    nextPatchCommunicationPosture: "delivery_pending",
  };
}

export function normalizeReceiptSimulation(
  partialState: Partial<ReceiptSimulationState> | null | undefined,
): ReceiptSimulationState {
  const fallback = createDefaultReceiptSimulation();
  return {
    macroState: includesValue(RECEIPT_MACRO_STATES, partialState?.macroState)
      ? partialState.macroState
      : fallback.macroState,
    receiptBucket: includesValue(RECEIPT_BUCKETS, partialState?.receiptBucket)
      ? partialState.receiptBucket
      : fallback.receiptBucket,
    promiseState: includesValue(RECEIPT_PROMISE_STATES, partialState?.promiseState)
      ? partialState.promiseState
      : fallback.promiseState,
    communicationPosture: includesValue(
      RECEIPT_COMMUNICATION_POSTURES,
      partialState?.communicationPosture,
    )
      ? partialState.communicationPosture
      : fallback.communicationPosture,
    summarySafetyState:
      partialState?.summarySafetyState === "residual_risk_flagged"
        ? "residual_risk_flagged"
        : fallback.summarySafetyState,
    allowInlinePatch:
      typeof partialState?.allowInlinePatch === "boolean"
        ? partialState.allowInlinePatch
        : fallback.allowInlinePatch,
    nextPatchMacroState: includesValue(RECEIPT_MACRO_STATES, partialState?.nextPatchMacroState)
      ? partialState.nextPatchMacroState
      : fallback.nextPatchMacroState,
    nextPatchPromiseState: includesValue(
      RECEIPT_PROMISE_STATES,
      partialState?.nextPatchPromiseState,
    )
      ? partialState.nextPatchPromiseState
      : fallback.nextPatchPromiseState,
    nextPatchCommunicationPosture: includesValue(
      RECEIPT_COMMUNICATION_POSTURES,
      partialState?.nextPatchCommunicationPosture,
    )
      ? partialState.nextPatchCommunicationPosture
      : fallback.nextPatchCommunicationPosture,
  };
}

export function applyInlineReceiptPatch(
  state: ReceiptSimulationState,
): ReceiptSimulationState {
  if (!state.allowInlinePatch || !state.nextPatchMacroState) {
    return state;
  }
  return {
    ...state,
    macroState: state.nextPatchMacroState,
    promiseState: state.nextPatchPromiseState ?? state.promiseState,
    communicationPosture: state.nextPatchCommunicationPosture ?? state.communicationPosture,
    allowInlinePatch: false,
    nextPatchMacroState: null,
    nextPatchPromiseState: null,
    nextPatchCommunicationPosture: null,
  };
}

export function buildReceiptSurface(input: {
  requestPublicId: string;
  contactSummaryView: ContactSummaryView;
  simulationState: ReceiptSimulationState;
}): ReceiptSurfaceView {
  const simulationState = normalizeReceiptSimulation(input.simulationState);
  const referenceCode = formatReferenceCode(input.requestPublicId);
  const nextStep = nextStepMessage(simulationState.macroState);
  return {
    contractId: "PHASE1_SAME_SHELL_RECEIPT_SURFACE_V1",
    consistencyEnvelopeId: `pce_${input.requestPublicId}`,
    receiptConsistencyKey: `receipt_consistency::${input.requestPublicId}`,
    statusConsistencyKey: `status_consistency::${input.requestPublicId}`,
    requestPublicId: input.requestPublicId,
    requestLineageRef: `request_lineage::${input.requestPublicId}`,
    copyVariantRef:
      simulationState.summarySafetyState === "residual_risk_flagged"
        ? "COPYVAR_142_SAFE_REVIEW_V1"
        : "COPYVAR_142_SAFE_CLEAR_V1",
    macroState: simulationState.macroState,
    macroStateLabel: macroStateLabel(simulationState.macroState),
    receiptBucket: simulationState.receiptBucket,
    receiptBucketLabel: receiptBucketLabel(simulationState.receiptBucket),
    promiseState: simulationState.promiseState,
    promiseStateLabel: promiseStateLabel(simulationState.promiseState),
    promiseTone: promiseTone(simulationState.promiseState),
    communicationPosture: simulationState.communicationPosture,
    title: confirmationTitle(simulationState.summarySafetyState),
    summary: confirmationSummary(
      simulationState.summarySafetyState,
      simulationState.promiseState,
    ),
    currentStateHeading: currentStateHeading(simulationState.macroState),
    currentStateBody: currentStateBody(
      simulationState.macroState,
      simulationState.summarySafetyState,
    ),
    nextStepMessage: nextStep,
    contactPlanNote: contactPlanNote(input.contactSummaryView),
    communicationBridgeNote: communicationBridgeNote(
      simulationState.communicationPosture,
      input.contactSummaryView,
    ),
    facts: [
      {
        label: "Reference",
        value: referenceCode,
        caption: "Use this reference if you need to contact the practice.",
        dataTestId: "receipt-reference-fact",
      },
      {
        label: "Current state",
        value: macroStateLabel(simulationState.macroState),
        caption: "The patient-safe macro state comes from the same consistency envelope as tracking.",
        dataTestId: "receipt-state-fact",
      },
      {
        label: "ETA bucket",
        value: receiptBucketLabel(simulationState.receiptBucket),
        caption: "Phase 1 remains bucketized. Exact timestamps are not shown here.",
        dataTestId: "receipt-eta-fact",
      },
    ],
    promiseNoteTitle: `Promise state: ${promiseStateLabel(simulationState.promiseState)}`,
    promiseNoteBody: promiseNoteBody(
      simulationState.promiseState,
      simulationState.receiptBucket,
      simulationState.communicationPosture,
    ),
    timelineHeading: "What happens next",
    timeline: buildTimeline(simulationState.macroState, nextStep),
    trackRequestAction: {
      label: "Track this request",
      dataTestId: "receipt-track-request-action",
      targetPathname: `/intake/requests/${input.requestPublicId}/status`,
      navigationContractRef: "PNRC_161_TRACK_REQUEST_V1",
      destinationType: "same_shell_route",
    },
    patchActionLabel:
      simulationState.allowInlinePatch && simulationState.nextPatchMacroState
        ? "Refresh current state"
        : null,
    patchActionTargetMacroState: simulationState.nextPatchMacroState,
    liveRegionMessage:
      simulationState.macroState === "received"
        ? "Receipt ready. Your request has been sent."
        : `Receipt updated. Current state: ${macroStateLabel(simulationState.macroState)}.`,
  };
}
