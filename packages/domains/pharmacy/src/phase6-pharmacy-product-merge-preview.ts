import {
  resolvePharmacyBounceBackRecoveryPreview,
  type PharmacyBounceBackRecoveryPreviewSnapshot,
} from "./phase6-pharmacy-bounce-back-preview";
import {
  resolvePharmacyDispatchPreview,
  type PharmacyDispatchPreviewSnapshot,
} from "./phase6-pharmacy-dispatch-preview";
import {
  resolvePharmacyPatientStatusPreview,
  type PharmacyPatientStatusPreviewSnapshot,
} from "./phase6-pharmacy-patient-status-preview";

export const PHARMACY_PRODUCT_MERGE_VISUAL_MODE = "Pharmacy_Product_Merge";

export type PharmacyLoopMergeState = "dispatch_pending" | "urgent_return" | "completed";
export type PharmacyLoopMergeEntryMode =
  | "triage_created"
  | "bounce_back_reopened"
  | "settled_record";
export type PharmacyLoopMergeSeverity = "watch" | "caution" | "critical";
export type PharmacyLoopMergeMessageState =
  | "awaiting_review"
  | "callback_risk"
  | "closed";
export type PharmacyLoopMergeMessageVisibility =
  | "authenticated_summary"
  | "public_safe_summary";

export interface PharmacyLoopMergeNotificationSnapshot {
  readonly channel: "nhs_app_message" | "patient_secure_message" | "ops_watch" | "triage_watch";
  readonly stateLabel: string;
  readonly title: string;
  readonly body: string;
}

export interface PharmacyLoopMergeOpsSnapshot {
  readonly anomalyId: string | null;
  readonly lens: "overview" | null;
  readonly severity: PharmacyLoopMergeSeverity | null;
  readonly title: string | null;
  readonly summary: string | null;
}

export interface PharmacyLoopMergeSnapshot {
  readonly projectionName: "PharmacyLoopMergeSnapshot";
  readonly visualMode: typeof PHARMACY_PRODUCT_MERGE_VISUAL_MODE;
  readonly requestRef: string;
  readonly requestLineageRef: string;
  readonly requestDisplayLabel: string;
  readonly requestStatusLabel: string;
  readonly pharmacyCaseId: string;
  readonly mergeState: PharmacyLoopMergeState;
  readonly entryMode: PharmacyLoopMergeEntryMode;
  readonly childLabel: string;
  readonly childSummary: string;
  readonly authoritativeStateLabel: string;
  readonly dominantNextStepLabel: string;
  readonly patientRouteRef: string;
  readonly requestDetailRouteRef: string;
  readonly requestAnchorRef: string;
  readonly requestLineageLabel: string;
  readonly changedSinceSeenLabel: string;
  readonly freshnessLabel: string;
  readonly messageClusterRef: string;
  readonly messageClusterTitle: string;
  readonly messageClusterPreview: string;
  readonly messageClusterState: PharmacyLoopMergeMessageState;
  readonly messageVisibilityMode: PharmacyLoopMergeMessageVisibility;
  readonly patientNotification: PharmacyLoopMergeNotificationSnapshot;
  readonly staffNotification: PharmacyLoopMergeNotificationSnapshot;
  readonly ops: PharmacyLoopMergeOpsSnapshot;
  readonly triageCardLabel: string;
  readonly triageCountLabel: string;
  readonly triageCardSummary: string;
  readonly triageChangedLabel: string;
  readonly reentrySummary: string;
  readonly supportReplaySummary: string;
  readonly auditSummary: string;
  readonly sourceProjectionRefs: readonly string[];
}

function requirePreview<T>(value: T | null, message: string): T {
  if (value === null) {
    throw new Error(message);
  }
  return value;
}

function stableTuple(seed: string): string {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `merge_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function buildPendingMerge(
  requestRef: string,
  requestLineageRef: string,
  requestDisplayLabel: string,
  requestStatusLabel: string,
  status: PharmacyPatientStatusPreviewSnapshot,
  dispatch: PharmacyDispatchPreviewSnapshot,
): PharmacyLoopMergeSnapshot {
  return {
    projectionName: "PharmacyLoopMergeSnapshot",
    visualMode: PHARMACY_PRODUCT_MERGE_VISUAL_MODE,
    requestRef,
    requestLineageRef,
    requestDisplayLabel,
    requestStatusLabel,
    pharmacyCaseId: status.pharmacyCaseId,
    mergeState: "dispatch_pending",
    entryMode: "triage_created",
    childLabel: "Pharmacy continuation",
    childSummary:
      dispatch.patientPendingState?.summary ??
      status.nextStepPage?.summary ??
      status.instructionPanel.headlineText,
    authoritativeStateLabel: "Referral proof pending",
    dominantNextStepLabel:
      dispatch.patientPendingState?.dominantActionLabel ??
      status.primaryActionLabel,
    patientRouteRef: `/pharmacy/${status.pharmacyCaseId}/status`,
    requestDetailRouteRef: `/requests/${requestRef}`,
    requestAnchorRef: requestRef,
    requestLineageLabel: status.chosenPharmacyAnchor.requestLineageLabel,
    changedSinceSeenLabel: "Referral handoff still awaiting authoritative proof",
    freshnessLabel: dispatch.statusStrip.proofDeadlineLabel,
    messageClusterRef: "cluster_368_pharmacy_pending",
    messageClusterTitle: "Pharmacy referral update",
    messageClusterPreview:
      dispatch.patientPendingState?.summary ??
      status.instructionPanel.nextStepText,
    messageClusterState: "awaiting_review",
    messageVisibilityMode: "authenticated_summary",
    patientNotification: {
      channel: "nhs_app_message",
      stateLabel: "Pending confirmation",
      title:
        dispatch.patientPendingState?.title ??
        status.instructionPanel.headlineText,
      body:
        dispatch.patientPendingState?.nextStepSummary ??
        status.instructionPanel.nextStepText,
    },
    staffNotification: {
      channel: "ops_watch",
      stateLabel: "Dispatch watch",
      title: dispatch.statusStrip.title,
      body: dispatch.statusStrip.summary,
    },
    ops: {
      anomalyId: null,
      lens: null,
      severity: null,
      title: null,
      summary: null,
    },
    triageCardLabel: "Pharmacy route created",
    triageCountLabel: "1 active",
    triageCardSummary:
      "The triage decision created PHC-2057 and kept the same request anchor visible while referral proof is still pending.",
    triageChangedLabel: "New pharmacy child visible in request lineage",
    reentrySummary:
      "If this route changes later, the same request anchor stays bound to request_211_b rather than creating a detached pharmacy-only history.",
    supportReplaySummary:
      "Support replay follows request_211_b, PHC-2057, and the pending referral proof through the same lineage chain.",
    auditSummary:
      "Audit ties the pending referral state back to the triage-created pharmacy case and the original request anchor.",
    sourceProjectionRefs: [
      status.statusProjection.pharmacyPatientStatusProjectionId,
      dispatch.truthBinding.pharmacyDispatchTruthProjectionId,
      dispatch.statusStrip.title,
      stableTuple(`${requestRef}:${status.pharmacyCaseId}:pending`),
    ],
  };
}

function buildUrgentReturnMerge(
  requestRef: string,
  requestLineageRef: string,
  requestDisplayLabel: string,
  requestStatusLabel: string,
  status: PharmacyPatientStatusPreviewSnapshot,
  recovery: PharmacyBounceBackRecoveryPreviewSnapshot,
): PharmacyLoopMergeSnapshot {
  const warning = recovery.returnMessagePreview.warning;
  return {
    projectionName: "PharmacyLoopMergeSnapshot",
    visualMode: PHARMACY_PRODUCT_MERGE_VISUAL_MODE,
    requestRef,
    requestLineageRef,
    requestDisplayLabel,
    requestStatusLabel,
    pharmacyCaseId: status.pharmacyCaseId,
    mergeState: "urgent_return",
    entryMode: "bounce_back_reopened",
    childLabel: "Urgent pharmacy return",
    childSummary: recovery.banner.summary,
    authoritativeStateLabel: "Urgent return reopened",
    dominantNextStepLabel: status.primaryActionLabel,
    patientRouteRef: `/pharmacy/${status.pharmacyCaseId}/instructions`,
    requestDetailRouteRef: `/requests/${requestRef}`,
    requestAnchorRef: requestRef,
    requestLineageLabel: status.chosenPharmacyAnchor.requestLineageLabel,
    changedSinceSeenLabel: "Urgent return reopened the original request context",
    freshnessLabel: recovery.banner.statusPill,
    messageClusterRef: "cluster_368_pharmacy_urgent_return",
    messageClusterTitle: "Urgent pharmacy return",
    messageClusterPreview: recovery.returnMessagePreview.summary,
    messageClusterState: "callback_risk",
    messageVisibilityMode: "authenticated_summary",
    patientNotification: {
      channel: "patient_secure_message",
      stateLabel: recovery.returnMessagePreview.notificationStateLabel,
      title: recovery.returnMessagePreview.headline,
      body: warning
        ? `${recovery.returnMessagePreview.body} ${warning}`
        : recovery.returnMessagePreview.body,
    },
    staffNotification: {
      channel: "triage_watch",
      stateLabel: recovery.loopRiskEscalationCard.loopRiskLabel,
      title: recovery.banner.title,
      body: recovery.loopRiskEscalationCard.summary,
    },
    ops: {
      anomalyId: "ops-route-pharmacy-2103",
      lens: "overview",
      severity: "critical",
      title: "Urgent pharmacy return reopened the original request",
      summary:
        "PHC-2103 has reopened request_215_callback with the original anchor preserved, and the urgent return posture must stay visible across ops, triage, and patient routes.",
    },
    triageCardLabel: "Urgent pharmacy return",
    triageCountLabel: "1 urgent return",
    triageCardSummary:
      "The reopened pharmacy case stays bound to request_215_callback so triage and operations can resume the original work instead of a detached follow-on.",
    triageChangedLabel: "Urgent return since seen",
    reentrySummary:
      "Open-original-request continuity remains bound to request_215_callback, with bounce-back provenance and the urgent-return message preserved.",
    supportReplaySummary:
      "Support replay follows PHC-2103, the urgent return notification, and the reopened request anchor through one event chain.",
    auditSummary:
      "Audit keeps the bounce-back record, urgent return route, and reopened request anchor on the same lineage path.",
    sourceProjectionRefs: [
      status.statusProjection.pharmacyPatientStatusProjectionId,
      recovery.truthBinding.pharmacyBounceBackTruthProjectionId,
      recovery.notificationBinding?.pharmacyReturnNotificationTriggerId ?? "no_notification_binding",
      stableTuple(`${requestRef}:${status.pharmacyCaseId}:urgent_return`),
    ],
  };
}

function buildCompletedMerge(
  requestRef: string,
  requestLineageRef: string,
  requestDisplayLabel: string,
  requestStatusLabel: string,
  status: PharmacyPatientStatusPreviewSnapshot,
): PharmacyLoopMergeSnapshot {
  return {
    projectionName: "PharmacyLoopMergeSnapshot",
    visualMode: PHARMACY_PRODUCT_MERGE_VISUAL_MODE,
    requestRef,
    requestLineageRef,
    requestDisplayLabel,
    requestStatusLabel,
    pharmacyCaseId: status.pharmacyCaseId,
    mergeState: "completed",
    entryMode: "settled_record",
    childLabel: "Completed pharmacy record",
    childSummary:
      status.outcomePage?.summary ??
      status.instructionPanel.calmCompletionText ??
      status.instructionPanel.headlineText,
    authoritativeStateLabel: "Outcome recorded",
    dominantNextStepLabel: status.primaryActionLabel,
    patientRouteRef: `/pharmacy/${status.pharmacyCaseId}/status`,
    requestDetailRouteRef: `/requests/${requestRef}`,
    requestAnchorRef: requestRef,
    requestLineageLabel: status.chosenPharmacyAnchor.requestLineageLabel,
    changedSinceSeenLabel: "Pharmacy outcome settled and archived into the request record",
    freshnessLabel: status.statusTracker.summary,
    messageClusterRef: "cluster_368_pharmacy_completed",
    messageClusterTitle: "Completed pharmacy outcome",
    messageClusterPreview:
      status.outcomePage?.summary ??
      status.instructionPanel.calmCompletionText ??
      status.instructionPanel.nextStepText,
    messageClusterState: "closed",
    messageVisibilityMode: "public_safe_summary",
    patientNotification: {
      channel: "nhs_app_message",
      stateLabel: "Outcome recorded",
      title: status.instructionPanel.headlineText,
      body:
        status.outcomePage?.calmCompletionText ??
        status.instructionPanel.calmCompletionText ??
        status.instructionPanel.nextStepText,
    },
    staffNotification: {
      channel: "ops_watch",
      stateLabel: "Settled record",
      title: "Pharmacy outcome settled",
      body:
        "The settled pharmacy outcome is visible through the parent request summary and no longer requires an urgent ops or triage follow-on.",
    },
    ops: {
      anomalyId: null,
      lens: null,
      severity: null,
      title: null,
      summary: null,
    },
    triageCardLabel: "Completed pharmacy record",
    triageCountLabel: "1 settled",
    triageCardSummary:
      "The completed pharmacy outcome is readable from the same request-led product flow instead of living only in the pharmacy route.",
    triageChangedLabel: "Completed since seen",
    reentrySummary:
      "If the case reopens later, request_215_closed remains the preserved anchor for any follow-on explanation or audit replay.",
    supportReplaySummary:
      "Support replay sees the completed outcome, the parent request anchor, and the patient-visible summary from one lineage chain.",
    auditSummary:
      "Audit keeps the settled pharmacy outcome linked to request_215_closed rather than creating a second completed history.",
    sourceProjectionRefs: [
      status.statusProjection.pharmacyPatientStatusProjectionId,
      status.statusTracker.title,
      stableTuple(`${requestRef}:${status.pharmacyCaseId}:completed`),
    ],
  };
}

export const pharmacyProductMergePreviewCases = [
  buildPendingMerge(
    "request_211_b",
    "lineage_211_b",
    "Pharmacy referral",
    "Proof pending",
    requirePreview(
      resolvePharmacyPatientStatusPreview("PHC-2057"),
      "PHARMACY_PRODUCT_MERGE_STATUS_PREVIEW_MISSING:PHC-2057",
    ),
    requirePreview(
      resolvePharmacyDispatchPreview("PHC-2057"),
      "PHARMACY_PRODUCT_MERGE_DISPATCH_PREVIEW_MISSING:PHC-2057",
    ),
  ),
  buildUrgentReturnMerge(
    "request_215_callback",
    "lineage_215_callback",
    "Urgent pharmacy return",
    "Urgent review",
    requirePreview(
      resolvePharmacyPatientStatusPreview("PHC-2103"),
      "PHARMACY_PRODUCT_MERGE_STATUS_PREVIEW_MISSING:PHC-2103",
    ),
    requirePreview(
      resolvePharmacyBounceBackRecoveryPreview("PHC-2103"),
      "PHARMACY_PRODUCT_MERGE_RECOVERY_PREVIEW_MISSING:PHC-2103",
    ),
  ),
  buildCompletedMerge(
    "request_215_closed",
    "lineage_215_closed",
    "Pharmacy outcome",
    "Outcome recorded",
    requirePreview(
      resolvePharmacyPatientStatusPreview("PHC-2196"),
      "PHARMACY_PRODUCT_MERGE_STATUS_PREVIEW_MISSING:PHC-2196",
    ),
  ),
] as const satisfies readonly PharmacyLoopMergeSnapshot[];

const mergeByRequestRef = new Map(
  pharmacyProductMergePreviewCases.map((preview) => [preview.requestRef, preview] as const),
);
const mergeByPharmacyCaseId = new Map(
  pharmacyProductMergePreviewCases.map((preview) => [preview.pharmacyCaseId, preview] as const),
);
const mergeByMessageClusterRef = new Map(
  pharmacyProductMergePreviewCases.map((preview) => [preview.messageClusterRef, preview] as const),
);
const mergeByOpsAnomalyId = new Map(
  pharmacyProductMergePreviewCases
    .filter((preview) => preview.ops.anomalyId !== null)
    .map((preview) => [preview.ops.anomalyId!, preview] as const),
);

export function resolvePharmacyProductMergePreviewForRequest(
  requestRef: string | null | undefined,
): PharmacyLoopMergeSnapshot | null {
  return requestRef ? mergeByRequestRef.get(requestRef) ?? null : null;
}

export function resolvePharmacyProductMergePreviewForCase(
  pharmacyCaseId: string | null | undefined,
): PharmacyLoopMergeSnapshot | null {
  return pharmacyCaseId ? mergeByPharmacyCaseId.get(pharmacyCaseId) ?? null : null;
}

export function resolvePharmacyProductMergePreviewForMessageCluster(
  clusterRef: string | null | undefined,
): PharmacyLoopMergeSnapshot | null {
  return clusterRef ? mergeByMessageClusterRef.get(clusterRef) ?? null : null;
}

export function resolvePharmacyProductMergePreviewForOpsAnomaly(
  anomalyId: string | null | undefined,
): PharmacyLoopMergeSnapshot | null {
  return anomalyId ? mergeByOpsAnomalyId.get(anomalyId) ?? null : null;
}
