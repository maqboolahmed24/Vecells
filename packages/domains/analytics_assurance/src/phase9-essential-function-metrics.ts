import {
  hashAssurancePayload,
  orderedSetHash,
  type AssuranceSliceTrustRecord,
  type Phase9AssuranceCompletenessState,
  type Phase9AssuranceTrustState,
} from "./phase9-assurance-ledger-contracts";
import type { Phase9GraphVerdictRecord } from "./phase9-assurance-graph-verdict-engine";
import {
  PHASE9_OPERATIONAL_NORMALIZATION_VERSION,
  evaluateEquitySliceMetric,
  evaluateMetricAnomaly,
  validateMetricAggregationTenantScope,
  type EquitySliceMetric,
  type MetricAnomalySnapshot,
  type OperationalAlertState,
  type OperationalFreshnessState,
} from "./phase9-operational-projection-contracts";
import {
  PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION,
  createPhase9OperationalProjectionEngineFixture,
  projectPhase9OperationalWindow,
  type OperationalProjectionEvent,
  type OperationalProjectionWindow,
  type Phase9OperationalProjectionResult,
} from "./phase9-operational-projection-engine";

export const PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION =
  "438.phase9.essential-function-metrics.v1";

export type Phase9MetricFamily =
  | "waitlist_conversion"
  | "pharmacy_bounce_back"
  | "notification_delivery";

export type Phase9MetricLifecycleEventFamily =
  | "waitlist_lifecycle"
  | "pharmacy_lifecycle"
  | "notification_lifecycle"
  | "assurance_metric_trust";

export type Phase9MetricLifecycleEventType =
  | "waitlist_entry_eligible"
  | "slot_available"
  | "waitlist_offer_created"
  | "waitlist_offer_delivered"
  | "waitlist_offer_viewed"
  | "waitlist_offer_accepted"
  | "waitlist_offer_declined"
  | "waitlist_offer_expired"
  | "waitlist_offer_withdrawn"
  | "waitlist_booking_committed"
  | "waitlist_auto_fill_suppressed"
  | "pharmacy_dispatch_created"
  | "pharmacy_dispatch_confirmed"
  | "pharmacy_outcome_received"
  | "pharmacy_bounce_back"
  | "pharmacy_staff_reviewed"
  | "pharmacy_urgent_safe_action"
  | "pharmacy_case_reopened"
  | "communication_envelope_created"
  | "outbound_transport_accepted"
  | "provider_acknowledged"
  | "delivery_succeeded"
  | "delivery_failed"
  | "retry_scheduled"
  | "retry_exhausted"
  | "patient_receipt_recorded"
  | "patient_reply_settled"
  | "metric_trust_record"
  | "metric_graph_verdict";

export type PharmacyBounceBackType =
  | "urgent_gp_return"
  | "routine_gp_return"
  | "unable_to_contact"
  | "safeguarding_concern"
  | "pharmacy_unable_to_complete"
  | "patient_declined";

export type NotificationDeliveryRiskState =
  | "clear"
  | "at_risk"
  | "likely_failed"
  | "disputed"
  | "exhausted";

export type MetricSnapshotState = "trusted" | "degraded" | "blocked";

export interface Phase9MetricLifecycleEventAdapter {
  readonly eventFamily: Phase9MetricLifecycleEventFamily;
  readonly sourceObject: string;
  readonly sourceProjection: string;
  readonly requiredFields: readonly (keyof Phase9MetricLifecycleEvent)[];
  readonly orderingKey: keyof Phase9MetricLifecycleEvent;
  readonly dedupeKey: keyof Phase9MetricLifecycleEvent;
  readonly tenantScope: keyof Phase9MetricLifecycleEvent;
  readonly timestampSemantics: "domain_occurred_at" | "settled_at" | "provider_observed_at";
  readonly authoritativeTruthBoundary: string;
  readonly sourceTrustDependency: string;
}

export interface Phase9MetricLifecycleEvent {
  readonly eventId: string;
  readonly eventFamily: Phase9MetricLifecycleEventFamily;
  readonly eventType: Phase9MetricLifecycleEventType;
  readonly tenantId: string;
  readonly scopeRef: string;
  readonly sourceRef: string;
  readonly sourceProjectionRef: string;
  readonly metricDefinitionRef: string;
  readonly sourceTrustRef: string;
  readonly entityRef: string;
  readonly occurredAt: string;
  readonly recordedAt: string;
  readonly orderingKey: string;
  readonly dedupeKey: string;
  readonly sequence: number;
  readonly routeFamily?: string;
  readonly clinicSessionRef?: string;
  readonly sliceDefinition?: string;
  readonly waitlistEntryRef?: string;
  readonly waitlistOfferRef?: string;
  readonly bookingCaseRef?: string;
  readonly bookingTransactionRef?: string;
  readonly capacityUnitRef?: string;
  readonly autoFillRunRef?: string;
  readonly suppressionReason?: string;
  readonly pharmacyCaseRef?: string;
  readonly dispatchAttemptRef?: string;
  readonly pharmacyOutcomeRef?: string;
  readonly pharmacyBounceBackRef?: string;
  readonly bounceBackType?: PharmacyBounceBackType;
  readonly bounceBackReasonGroup?: string;
  readonly reopenPriorityBand?: 0 | 1 | 2 | 3;
  readonly loopRiskScore?: number;
  readonly communicationEnvelopeRef?: string;
  readonly notificationRef?: string;
  readonly providerAckState?: "accepted" | "failed" | "disputed";
  readonly channel?: "sms" | "email" | "nhs_app" | "voice" | "letter";
  readonly messageClass?: string;
  readonly deliveryRiskState?: NotificationDeliveryRiskState;
  readonly patientReceiptEnvelopeRef?: string;
  readonly conversationSettlementRef?: string;
  readonly lifecycleEvidenceComplete?: boolean;
  readonly trustRecord?: AssuranceSliceTrustRecord;
  readonly graphVerdict?: Phase9GraphVerdictRecord;
}

export interface Phase9EssentialFunctionMetricLineage {
  readonly sourceEventRefs: readonly string[];
  readonly sourceWindowHash: string;
  readonly metricDefinitionRef: string;
  readonly tenantId: string;
  readonly scopeRef: string;
  readonly aggregationWindow: {
    readonly windowStart: string;
    readonly windowEnd: string;
  };
  readonly normalizationVersionRef: typeof PHASE9_OPERATIONAL_NORMALIZATION_VERSION;
  readonly trustState: Phase9AssuranceTrustState;
  readonly completenessState: Phase9AssuranceCompletenessState;
  readonly projectionHealthRef: string;
  readonly graphVerdictRef: string;
  readonly blockingRefs: readonly string[];
}

export interface WaitlistConversionMetricSnapshot extends Phase9EssentialFunctionMetricLineage {
  readonly metricFamily: "waitlist_conversion";
  readonly metricSnapshotId: string;
  readonly eligibleCohortSize: number;
  readonly offersCreated: number;
  readonly offersDelivered: number;
  readonly offersViewed: number;
  readonly offersAccepted: number;
  readonly offersDeclined: number;
  readonly offersExpired: number;
  readonly offersWithdrawn: number;
  readonly bookingsCreatedFromOffers: number;
  readonly timeFromAvailabilityToOfferMinutesP50: number;
  readonly timeFromOfferToAcceptanceMinutesP50: number;
  readonly timeFromAcceptanceToBookingCommitMinutesP50: number;
  readonly conversionRate: number;
  readonly conversionRateByRoute: Readonly<Record<string, number>>;
  readonly conversionRateByClinicSession: Readonly<Record<string, number>>;
  readonly autoFillSuccessRate: number;
  readonly unsafeOrFailedAutoFillSuppressionCount: number;
  readonly equityAccessDelaySlices: readonly EquitySliceMetric[];
  readonly capturedAt: string;
}

export interface PharmacyBounceBackMetricSnapshot extends Phase9EssentialFunctionMetricLineage {
  readonly metricFamily: "pharmacy_bounce_back";
  readonly metricSnapshotId: string;
  readonly dispatchCount: number;
  readonly outcomeCount: number;
  readonly bounceBackCount: number;
  readonly bounceBackReasonGroups: Readonly<Record<string, number>>;
  readonly urgentReturnCount: number;
  readonly routineReturnCount: number;
  readonly noContactCount: number;
  readonly reopenedLoopCount: number;
  readonly reopenPriorityBandCounts: Readonly<Record<string, number>>;
  readonly dispatchToOutcomeLatencyMinutesP50: number;
  readonly bounceBackToStaffReviewMinutesP50: number;
  readonly urgentReturnToSafeActionMinutesP50: number;
  readonly openBounceBackBacklog: number;
  readonly loopRiskState: "clear" | "watch" | "elevated" | "critical";
  readonly patientNotificationStateRefs: readonly string[];
  readonly capturedAt: string;
}

export interface NotificationDeliveryMetricSnapshot extends Phase9EssentialFunctionMetricLineage {
  readonly metricFamily: "notification_delivery";
  readonly metricSnapshotId: string;
  readonly communicationEnvelopeCreated: number;
  readonly outboundTransportAccepted: number;
  readonly providerAcknowledgement: number;
  readonly providerAckFailure: number;
  readonly deliverySuccess: number;
  readonly deliveryFailureOrBounce: number;
  readonly retryScheduled: number;
  readonly retryExhausted: number;
  readonly patientReceiptEnvelope: number;
  readonly patientReplyConversationSettlement: number;
  readonly deliveryRiskStateCounts: Readonly<Record<NotificationDeliveryRiskState, number>>;
  readonly timeToDeliveryMinutesP50: number;
  readonly timeToReceiptMinutesP50: number;
  readonly timeToPatientReplyMinutesP50: number;
  readonly deliveryRateByChannel: Readonly<Record<string, number>>;
  readonly receiptRate: number;
  readonly capturedAt: string;
}

export type Phase9EssentialMetricSnapshot =
  | WaitlistConversionMetricSnapshot
  | PharmacyBounceBackMetricSnapshot
  | NotificationDeliveryMetricSnapshot;

export interface Phase9MetricDashboardDto {
  readonly metricFamily: Phase9MetricFamily;
  readonly stateLabel: "Normal" | "Degraded" | "Blocked";
  readonly stateReason: string;
  readonly topLineValue: string;
  readonly denominator: string;
  readonly window: string;
  readonly trend: "up" | "down" | "flat" | "insufficient";
  readonly riskOrConfidenceBand: string;
  readonly freshnessState: OperationalFreshnessState;
  readonly trustState: Phase9AssuranceTrustState;
  readonly completenessState: Phase9AssuranceCompletenessState;
  readonly drillInSeed: string;
  readonly allowedInvestigationScope: string;
  readonly supportingLifecycleCounts: Readonly<Record<string, number>>;
  readonly blockedOrDegradedExplanation: readonly string[];
}

export interface Phase9MetricAlertHook {
  readonly alertHookId: string;
  readonly alertCode:
    | "waitlist_conversion_drop"
    | "waitlist_offer_expiry_rise"
    | "pharmacy_urgent_return_backlog"
    | "pharmacy_bounce_back_reason_spike"
    | "notification_delivery_failure_spike"
    | "notification_receipt_reply_latency_degradation"
    | "notification_channel_transport_failure"
    | "slice_access_inequity_persistence";
  readonly metricFamily: Phase9MetricFamily;
  readonly anomalyRef: string;
  readonly alertState: OperationalAlertState;
  readonly support: number;
  readonly blockingRefs: readonly string[];
}

export interface Phase9EssentialFunctionMetricsInput {
  readonly events: readonly Phase9MetricLifecycleEvent[];
  readonly window: OperationalProjectionWindow;
  readonly adapters?: readonly Phase9MetricLifecycleEventAdapter[];
  readonly trustRecords?: readonly AssuranceSliceTrustRecord[];
  readonly graphVerdict?: Phase9GraphVerdictRecord;
  readonly previousAnomalyStateByMetricRef?: Readonly<
    Record<
      string,
      {
        readonly previousEwmaScore?: number;
        readonly previousCusumPositiveScore?: number;
        readonly previousCusumNegativeScore?: number;
        readonly previousAlertState?: OperationalAlertState;
        readonly previousExitHoldCount?: number;
      }
    >
  >;
}

export interface Phase9EssentialFunctionMetricsResult {
  readonly schemaVersion: typeof PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION;
  readonly projectionEngineVersion: typeof PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION;
  readonly tenantId: string;
  readonly sourceWindowHash: string;
  readonly acceptedEventRefs: readonly string[];
  readonly duplicateEventRefs: readonly string[];
  readonly lateEventRefs: readonly string[];
  readonly waitlistConversion: WaitlistConversionMetricSnapshot;
  readonly pharmacyBounceBack: PharmacyBounceBackMetricSnapshot;
  readonly notificationDelivery: NotificationDeliveryMetricSnapshot;
  readonly anomalySnapshots: readonly MetricAnomalySnapshot[];
  readonly alertHooks: readonly Phase9MetricAlertHook[];
  readonly dashboardDtos: readonly Phase9MetricDashboardDto[];
  readonly projectionResult: Phase9OperationalProjectionResult;
  readonly resultHash: string;
}

export interface Phase9EssentialFunctionMetricsFixture {
  readonly schemaVersion: typeof PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION;
  readonly generatedAt: string;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly adapters: readonly Phase9MetricLifecycleEventAdapter[];
  readonly baselineEvents: readonly Phase9MetricLifecycleEvent[];
  readonly baselineTrustRecords: readonly AssuranceSliceTrustRecord[];
  readonly baselineGraphVerdict: Phase9GraphVerdictRecord;
  readonly baselineResult: Phase9EssentialFunctionMetricsResult;
  readonly duplicateNotificationResult: Phase9EssentialFunctionMetricsResult;
  readonly lateBookingCommitResult: Phase9EssentialFunctionMetricsResult;
  readonly incompleteLifecycleResult: Phase9EssentialFunctionMetricsResult;
  readonly replayHash: string;
}

export class Phase9EssentialFunctionMetricsError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9EssentialFunctionMetricsError";
    this.code = code;
  }
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Phase9EssentialFunctionMetricsError(code, message);
  }
}

function toMs(timestamp: string): number {
  const parsed = Date.parse(timestamp);
  invariant(!Number.isNaN(parsed), "INVALID_TIMESTAMP", `Invalid timestamp ${timestamp}.`);
  return parsed;
}

function minutesBetween(start: string, end: string): number {
  return (toMs(end) - toMs(start)) / 60_000;
}

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].filter((value) => value.length > 0).sort();
}

function percentile(values: readonly number[], ratio: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
  return sorted[index] ?? 0;
}

function metricHash(value: unknown, namespace: string): string {
  return hashAssurancePayload(value, namespace);
}

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function mapToRecord(map: Map<string, number>): Record<string, number> {
  return Object.fromEntries([...map.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

export function getDefaultPhase9MetricLifecycleEventAdapters(): readonly Phase9MetricLifecycleEventAdapter[] {
  return [
    {
      eventFamily: "waitlist_lifecycle",
      sourceObject: "WaitlistOffer",
      sourceProjection: "WaitlistContinuationTruthProjection",
      requiredFields: [
        "eventId",
        "eventFamily",
        "eventType",
        "tenantId",
        "entityRef",
        "occurredAt",
        "recordedAt",
        "dedupeKey",
        "orderingKey",
        "sourceTrustRef",
      ],
      orderingKey: "orderingKey",
      dedupeKey: "dedupeKey",
      tenantScope: "tenantId",
      timestampSemantics: "domain_occurred_at",
      authoritativeTruthBoundary:
        "WaitlistEntry, WaitlistOffer, WaitlistDeadlineEvaluation, WaitlistFallbackObligation, BookingConfirmationTruthProjection",
      sourceTrustDependency: "AssuranceSliceTrustRecord:waitlist-conversion",
    },
    {
      eventFamily: "pharmacy_lifecycle",
      sourceObject: "PharmacyBounceBackRecord",
      sourceProjection: "PharmacyOutcomeTruthProjection",
      requiredFields: [
        "eventId",
        "eventFamily",
        "eventType",
        "tenantId",
        "entityRef",
        "occurredAt",
        "recordedAt",
        "dedupeKey",
        "orderingKey",
        "sourceTrustRef",
      ],
      orderingKey: "orderingKey",
      dedupeKey: "dedupeKey",
      tenantScope: "tenantId",
      timestampSemantics: "settled_at",
      authoritativeTruthBoundary:
        "PharmacyDispatchAttempt, PharmacyOutcomeSettlement, PharmacyBounceBackRecord, PharmacyConsoleContinuityEvidenceProjection",
      sourceTrustDependency: "AssuranceSliceTrustRecord:pharmacy-bounce-back",
    },
    {
      eventFamily: "notification_lifecycle",
      sourceObject: "CommunicationEnvelope",
      sourceProjection: "PatientCommunicationVisibilityProjection",
      requiredFields: [
        "eventId",
        "eventFamily",
        "eventType",
        "tenantId",
        "entityRef",
        "occurredAt",
        "recordedAt",
        "dedupeKey",
        "orderingKey",
        "sourceTrustRef",
      ],
      orderingKey: "orderingKey",
      dedupeKey: "dedupeKey",
      tenantScope: "tenantId",
      timestampSemantics: "provider_observed_at",
      authoritativeTruthBoundary:
        "CommunicationEnvelope, AdapterReceiptCheckpoint, PatientReceiptEnvelope, ConversationCommandSettlement",
      sourceTrustDependency: "AssuranceSliceTrustRecord:notification-delivery",
    },
    {
      eventFamily: "assurance_metric_trust",
      sourceObject: "AssuranceSliceTrustRecord",
      sourceProjection: "ProjectionHealthSnapshot",
      requiredFields: [
        "eventId",
        "eventFamily",
        "eventType",
        "tenantId",
        "entityRef",
        "occurredAt",
        "recordedAt",
        "dedupeKey",
        "orderingKey",
        "sourceTrustRef",
      ],
      orderingKey: "orderingKey",
      dedupeKey: "dedupeKey",
      tenantScope: "tenantId",
      timestampSemantics: "settled_at",
      authoritativeTruthBoundary: "ProjectionHealthSnapshot and AssuranceGraphCompletenessVerdict",
      sourceTrustDependency: "AssuranceGraphCompletenessVerdict:operational-dashboard",
    },
  ];
}

export function validatePhase9MetricLifecycleEventAdapters(
  adapters: readonly Phase9MetricLifecycleEventAdapter[] = getDefaultPhase9MetricLifecycleEventAdapters(),
): readonly string[] {
  const errors: string[] = [];
  for (const family of [
    "waitlist_lifecycle",
    "pharmacy_lifecycle",
    "notification_lifecycle",
    "assurance_metric_trust",
  ] as const satisfies readonly Phase9MetricLifecycleEventFamily[]) {
    const adapter = adapters.find((candidate) => candidate.eventFamily === family);
    if (!adapter) {
      errors.push(`METRIC_LIFECYCLE_ADAPTER_MISSING:${family}`);
      continue;
    }
    for (const field of [
      "eventId",
      "eventFamily",
      "eventType",
      "tenantId",
      "entityRef",
      "occurredAt",
      "recordedAt",
      "dedupeKey",
      "orderingKey",
      "sourceTrustRef",
    ] as const satisfies readonly (keyof Phase9MetricLifecycleEvent)[]) {
      if (!adapter.requiredFields.includes(field)) {
        errors.push(`METRIC_LIFECYCLE_ADAPTER_FIELD_MISSING:${family}:${String(field)}`);
      }
    }
  }
  return errors.sort();
}

function assertEventMatchesAdapter(
  event: Phase9MetricLifecycleEvent,
  adapters: readonly Phase9MetricLifecycleEventAdapter[],
): void {
  const adapter = adapters.find((candidate) => candidate.eventFamily === event.eventFamily);
  invariant(adapter, "METRIC_LIFECYCLE_ADAPTER_MISSING", `No adapter for ${event.eventFamily}.`);
  for (const field of adapter.requiredFields) {
    const value = event[field];
    invariant(
      value !== undefined && value !== null && (typeof value !== "string" || value.trim().length > 0),
      "METRIC_LIFECYCLE_EVENT_FIELD_MISSING",
      `${event.eventId} is missing ${String(field)}.`,
    );
  }
  toMs(event.occurredAt);
  toMs(event.recordedAt);
  invariant(Number.isFinite(event.sequence), "METRIC_LIFECYCLE_SEQUENCE_INVALID", event.eventId);
}

interface NormalizedMetricEvents {
  readonly acceptedEvents: readonly Phase9MetricLifecycleEvent[];
  readonly duplicateEventRefs: readonly string[];
  readonly lateEventRefs: readonly string[];
  readonly sourceWindowHash: string;
}

function normalizeMetricEvents(
  input: Phase9EssentialFunctionMetricsInput,
  adapters: readonly Phase9MetricLifecycleEventAdapter[],
): NormalizedMetricEvents {
  const tenantValidation = validateMetricAggregationTenantScope(
    input.window.tenantId,
    input.events.map((event) => ({ sourceRef: event.eventId, tenantScope: event.tenantId })),
  );
  invariant(
    tenantValidation.valid,
    "CROSS_TENANT_METRIC_AGGREGATION_DENIED",
    tenantValidation.errors.join("; "),
  );

  const deduped = new Map<string, Phase9MetricLifecycleEvent>();
  const duplicateEventRefs: string[] = [];
  for (const event of input.events) {
    assertEventMatchesAdapter(event, adapters);
    if (deduped.has(event.dedupeKey)) {
      duplicateEventRefs.push(event.eventId);
      continue;
    }
    deduped.set(event.dedupeKey, event);
  }
  const acceptedEvents = [...deduped.values()].sort((left, right) => {
    const byTime = toMs(left.occurredAt) - toMs(right.occurredAt);
    if (byTime !== 0) {
      return byTime;
    }
    const byOrdering = left.orderingKey.localeCompare(right.orderingKey);
    if (byOrdering !== 0) {
      return byOrdering;
    }
    return left.sequence - right.sequence || left.eventId.localeCompare(right.eventId);
  });
  const windowStartMs = toMs(input.window.windowStart);
  const capturedAtMs = toMs(input.window.capturedAt);
  const lateEventRefs = acceptedEvents
    .filter((event) => toMs(event.occurredAt) < windowStartMs || toMs(event.recordedAt) > capturedAtMs)
    .map((event) => event.eventId)
    .sort();
  return {
    acceptedEvents,
    duplicateEventRefs: duplicateEventRefs.sort(),
    lateEventRefs,
    sourceWindowHash: metricHash(
      {
        tenantId: input.window.tenantId,
        windowStart: input.window.windowStart,
        windowEnd: input.window.windowEnd,
        eventHashes: acceptedEvents.map((event) => metricHash(event, "phase9.438.metric.event")),
      },
      "phase9.438.metric.source-window",
    ),
  };
}

interface MetricTrustContext {
  readonly freshnessState: OperationalFreshnessState;
  readonly trustState: Phase9AssuranceTrustState;
  readonly completenessState: Phase9AssuranceCompletenessState;
  readonly snapshotState: MetricSnapshotState;
  readonly projectionHealthRef: string;
  readonly graphVerdictRef: string;
  readonly blockingRefs: readonly string[];
}

function trustRecordsFromInput(input: Phase9EssentialFunctionMetricsInput): readonly AssuranceSliceTrustRecord[] {
  return [
    ...(input.trustRecords ?? []),
    ...input.events
      .map((event) => event.trustRecord)
      .filter((record): record is AssuranceSliceTrustRecord => record !== undefined),
  ];
}

function graphVerdictFromInput(input: Phase9EssentialFunctionMetricsInput): Phase9GraphVerdictRecord | undefined {
  return input.graphVerdict ?? input.events.find((event) => event.graphVerdict)?.graphVerdict;
}

function deriveMetricTrustContext(
  input: Phase9EssentialFunctionMetricsInput,
  normalized: NormalizedMetricEvents,
): MetricTrustContext {
  const trustRecords = trustRecordsFromInput(input);
  const graphVerdict = graphVerdictFromInput(input);
  const blockingRefs: string[] = [];
  let trustState: Phase9AssuranceTrustState = trustRecords.length === 0 ? "unknown" : "trusted";
  let completenessState: Phase9AssuranceCompletenessState = "complete";
  let freshnessState: OperationalFreshnessState = "fresh";

  for (const record of trustRecords) {
    if (record.hardBlockState || record.trustState === "quarantined" || record.completenessState === "blocked") {
      trustState = "quarantined";
      completenessState = "blocked";
      blockingRefs.push(record.assuranceSliceTrustRecordId);
    } else if (record.trustState !== "trusted" || record.completenessState !== "complete" || record.trustLowerBound < 0.82) {
      trustState = trustState === "quarantined" ? "quarantined" : "degraded";
      completenessState = completenessState === "blocked" ? "blocked" : "partial";
      blockingRefs.push(record.assuranceSliceTrustRecordId);
    }
  }
  if (!graphVerdict) {
    trustState = trustState === "trusted" ? "degraded" : trustState;
    completenessState = completenessState === "complete" ? "partial" : completenessState;
    blockingRefs.push("graph-verdict:missing");
  } else if (graphVerdict.state === "blocked") {
    trustState = "quarantined";
    completenessState = "blocked";
    freshnessState = "read_only";
    blockingRefs.push(graphVerdict.verdictId);
  } else if (graphVerdict.state === "stale" || graphVerdict.state === "partial") {
    trustState = trustState === "quarantined" ? "quarantined" : "degraded";
    completenessState = completenessState === "blocked" ? "blocked" : "partial";
    freshnessState = "stale_review";
    blockingRefs.push(graphVerdict.verdictId);
  }
  if (normalized.lateEventRefs.length > 0) {
    trustState = trustState === "quarantined" ? "quarantined" : "degraded";
    freshnessState = freshnessState === "read_only" ? "read_only" : "watch";
    blockingRefs.push(...normalized.lateEventRefs.map((eventRef) => `late:${eventRef}`));
  }
  for (const event of normalized.acceptedEvents) {
    if (event.lifecycleEvidenceComplete === false) {
      trustState = trustState === "quarantined" ? "quarantined" : "degraded";
      completenessState = completenessState === "blocked" ? "blocked" : "partial";
      blockingRefs.push(`incomplete-lifecycle:${event.eventId}`);
    }
  }

  const snapshotState: MetricSnapshotState =
    trustState === "quarantined" || completenessState === "blocked"
      ? "blocked"
      : trustState !== "trusted" || completenessState !== "complete" || freshnessState !== "fresh"
        ? "degraded"
        : "trusted";
  return {
    freshnessState,
    trustState,
    completenessState,
    snapshotState,
    projectionHealthRef: "projection-health:pending-437-link",
    graphVerdictRef: graphVerdict?.verdictId ?? "graph-verdict:missing",
    blockingRefs: sortedUnique(blockingRefs),
  };
}

function buildLineage(
  metricDefinitionRef: string,
  input: Phase9EssentialFunctionMetricsInput,
  normalized: NormalizedMetricEvents,
  trust: MetricTrustContext,
  events: readonly Phase9MetricLifecycleEvent[],
): Phase9EssentialFunctionMetricLineage {
  return {
    sourceEventRefs: sortedUnique(events.map((event) => event.eventId)),
    sourceWindowHash: normalized.sourceWindowHash,
    metricDefinitionRef,
    tenantId: input.window.tenantId,
    scopeRef: input.window.scopeRef,
    aggregationWindow: {
      windowStart: input.window.windowStart,
      windowEnd: input.window.windowEnd,
    },
    normalizationVersionRef: PHASE9_OPERATIONAL_NORMALIZATION_VERSION,
    trustState: trust.trustState,
    completenessState: trust.completenessState,
    projectionHealthRef: trust.projectionHealthRef,
    graphVerdictRef: trust.graphVerdictRef,
    blockingRefs: trust.blockingRefs,
  };
}

interface WaitlistOfferState {
  readonly offerRef: string;
  readonly entryRef: string;
  readonly routeFamily: string;
  readonly clinicSessionRef: string;
  readonly capacityUnitRef: string;
  createdAt?: string;
  deliveredAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  expiredAt?: string;
  withdrawnAt?: string;
  bookingCommittedAt?: string;
}

function offerKey(event: Phase9MetricLifecycleEvent): string {
  return event.waitlistOfferRef ?? event.entityRef;
}

function waitlistEntryKey(event: Phase9MetricLifecycleEvent): string {
  return event.waitlistEntryRef ?? event.entityRef;
}

function computeRatesByGroup(
  offers: readonly WaitlistOfferState[],
  group: (offer: WaitlistOfferState) => string,
): Record<string, number> {
  const totals = new Map<string, number>();
  const booked = new Map<string, number>();
  for (const offer of offers) {
    const key = group(offer);
    increment(totals, key);
    if (offer.bookingCommittedAt) {
      increment(booked, key);
    }
  }
  return Object.fromEntries(
    [...totals.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, total]) => [key, total === 0 ? 0 : (booked.get(key) ?? 0) / total]),
  );
}

function buildWaitlistSnapshot(
  input: Phase9EssentialFunctionMetricsInput,
  normalized: NormalizedMetricEvents,
  trust: MetricTrustContext,
): WaitlistConversionMetricSnapshot {
  const events = normalized.acceptedEvents.filter((event) => event.eventFamily === "waitlist_lifecycle");
  const eligibleEntries = new Set<string>();
  const slotAvailableAtByCapacity = new Map<string, string>();
  const offers = new Map<string, WaitlistOfferState>();
  let unsafeOrFailedAutoFillSuppressionCount = 0;

  for (const event of events) {
    if (event.eventType === "waitlist_entry_eligible") {
      eligibleEntries.add(waitlistEntryKey(event));
    }
    if (event.eventType === "slot_available" && event.capacityUnitRef) {
      slotAvailableAtByCapacity.set(event.capacityUnitRef, event.occurredAt);
    }
    if (event.eventType === "waitlist_auto_fill_suppressed") {
      unsafeOrFailedAutoFillSuppressionCount += 1;
    }
    if (!event.waitlistOfferRef && !event.entityRef.includes("offer")) {
      continue;
    }
    const key = offerKey(event);
    const previous = offers.get(key);
    const next: WaitlistOfferState = previous ?? {
      offerRef: key,
      entryRef: event.waitlistEntryRef ?? event.entityRef,
      routeFamily: event.routeFamily ?? "booking",
      clinicSessionRef: event.clinicSessionRef ?? "clinic-session:unknown",
      capacityUnitRef: event.capacityUnitRef ?? "capacity:unknown",
    };
    if (event.eventType === "waitlist_offer_created") {
      next.createdAt = event.occurredAt;
    } else if (event.eventType === "waitlist_offer_delivered") {
      next.deliveredAt = event.occurredAt;
    } else if (event.eventType === "waitlist_offer_viewed") {
      next.viewedAt = event.occurredAt;
    } else if (event.eventType === "waitlist_offer_accepted") {
      next.acceptedAt = event.occurredAt;
    } else if (event.eventType === "waitlist_offer_declined") {
      next.declinedAt = event.occurredAt;
    } else if (event.eventType === "waitlist_offer_expired") {
      next.expiredAt = event.occurredAt;
    } else if (event.eventType === "waitlist_offer_withdrawn") {
      next.withdrawnAt = event.occurredAt;
    } else if (event.eventType === "waitlist_booking_committed") {
      next.bookingCommittedAt = event.occurredAt;
    }
    offers.set(key, next);
  }

  const offerList = [...offers.values()].filter((offer) => offer.createdAt);
  const availabilityToOffer = offerList
    .map((offer) => {
      const availableAt = slotAvailableAtByCapacity.get(offer.capacityUnitRef);
      return availableAt && offer.createdAt ? minutesBetween(availableAt, offer.createdAt) : undefined;
    })
    .filter((value): value is number => value !== undefined && value >= 0);
  const offerToAcceptance = offerList
    .map((offer) => (offer.createdAt && offer.acceptedAt ? minutesBetween(offer.createdAt, offer.acceptedAt) : undefined))
    .filter((value): value is number => value !== undefined && value >= 0);
  const acceptanceToCommit = offerList
    .map((offer) =>
      offer.acceptedAt && offer.bookingCommittedAt ? minutesBetween(offer.acceptedAt, offer.bookingCommittedAt) : undefined,
    )
    .filter((value): value is number => value !== undefined && value >= 0);
  const equityAccessDelaySlices = events
    .filter((event) => event.sliceDefinition)
    .map((event) =>
      evaluateEquitySliceMetric({
        equitySliceMetricId: `esm_438_${metricHash(
          { slice: event.sliceDefinition, eventId: event.eventId },
          "phase9.438.waitlist.equity.id",
        ).slice(0, 16)}`,
        sliceDefinition: event.sliceDefinition ?? "slice:unknown",
        metricSetRef: "metric-set:waitlist-conversion",
        periodWindow: {
          periodStart: input.window.windowStart,
          periodEnd: input.window.windowEnd,
        },
        effectiveSampleSize: eligibleEntries.size,
        varianceMagnitude: event.eventType === "waitlist_offer_expired" ? 0.18 : 0.07,
        confidenceBandRef: `confidence:waitlist:${metricHash(event.eventId, "phase9.438.waitlist.equity.confidence").slice(0, 12)}`,
        minimumSupport: 3,
      }),
    );
  const offersCreated = offerList.length;
  const bookingsCreatedFromOffers = offerList.filter((offer) => offer.bookingCommittedAt).length;
  return {
    ...buildLineage("omd_438_waitlist_conversion", input, normalized, trust, events),
    metricFamily: "waitlist_conversion",
    metricSnapshotId: `wcm_438_${metricHash(
      { sourceWindowHash: normalized.sourceWindowHash, metric: "waitlist" },
      "phase9.438.waitlist.snapshot.id",
    ).slice(0, 16)}`,
    eligibleCohortSize: eligibleEntries.size,
    offersCreated,
    offersDelivered: offerList.filter((offer) => offer.deliveredAt).length,
    offersViewed: offerList.filter((offer) => offer.viewedAt).length,
    offersAccepted: offerList.filter((offer) => offer.acceptedAt).length,
    offersDeclined: offerList.filter((offer) => offer.declinedAt).length,
    offersExpired: offerList.filter((offer) => offer.expiredAt).length,
    offersWithdrawn: offerList.filter((offer) => offer.withdrawnAt).length,
    bookingsCreatedFromOffers,
    timeFromAvailabilityToOfferMinutesP50: percentile(availabilityToOffer, 0.5),
    timeFromOfferToAcceptanceMinutesP50: percentile(offerToAcceptance, 0.5),
    timeFromAcceptanceToBookingCommitMinutesP50: percentile(acceptanceToCommit, 0.5),
    conversionRate: offersCreated === 0 ? 0 : bookingsCreatedFromOffers / offersCreated,
    conversionRateByRoute: computeRatesByGroup(offerList, (offer) => offer.routeFamily),
    conversionRateByClinicSession: computeRatesByGroup(offerList, (offer) => offer.clinicSessionRef),
    autoFillSuccessRate: offersCreated === 0 ? 0 : bookingsCreatedFromOffers / offersCreated,
    unsafeOrFailedAutoFillSuppressionCount,
    equityAccessDelaySlices,
    capturedAt: input.window.capturedAt,
  };
}

interface PharmacyCaseState {
  dispatchAt?: string;
  outcomeAt?: string;
  bounceAt?: string;
  staffReviewAt?: string;
  urgentSafeActionAt?: string;
  reopenedAt?: string;
  bounceBackRef?: string;
  bounceBackType?: PharmacyBounceBackType;
  reasonGroup?: string;
  priorityBand?: 0 | 1 | 2 | 3;
  loopRiskScore?: number;
  notificationRefs: Set<string>;
}

function buildPharmacySnapshot(
  input: Phase9EssentialFunctionMetricsInput,
  normalized: NormalizedMetricEvents,
  trust: MetricTrustContext,
): PharmacyBounceBackMetricSnapshot {
  const events = normalized.acceptedEvents.filter((event) => event.eventFamily === "pharmacy_lifecycle");
  const cases = new Map<string, PharmacyCaseState>();
  const dispatchRefs = new Set<string>();
  const outcomeRefs = new Set<string>();
  const bounceRefs = new Set<string>();
  const reopenedRefs = new Set<string>();
  const reasonGroups = new Map<string, number>();
  const priorityBands = new Map<string, number>();

  const stateFor = (event: Phase9MetricLifecycleEvent): PharmacyCaseState => {
    const key = event.pharmacyCaseRef ?? event.entityRef;
    const state = cases.get(key) ?? { notificationRefs: new Set<string>() };
    cases.set(key, state);
    return state;
  };

  for (const event of events) {
    const state = stateFor(event);
    if (event.communicationEnvelopeRef) {
      state.notificationRefs.add(event.communicationEnvelopeRef);
    }
    if (event.eventType === "pharmacy_dispatch_created" || event.eventType === "pharmacy_dispatch_confirmed") {
      state.dispatchAt ??= event.occurredAt;
      dispatchRefs.add(event.dispatchAttemptRef ?? event.entityRef);
    } else if (event.eventType === "pharmacy_outcome_received") {
      state.outcomeAt = event.occurredAt;
      outcomeRefs.add(event.pharmacyOutcomeRef ?? event.entityRef);
    } else if (event.eventType === "pharmacy_bounce_back") {
      state.bounceAt = event.occurredAt;
      state.bounceBackRef = event.pharmacyBounceBackRef ?? event.entityRef;
      state.bounceBackType = event.bounceBackType ?? "routine_gp_return";
      state.reasonGroup = event.bounceBackReasonGroup ?? state.bounceBackType;
      state.priorityBand = event.reopenPriorityBand ?? (state.bounceBackType === "urgent_gp_return" ? 3 : 1);
      state.loopRiskScore = event.loopRiskScore ?? 0;
      bounceRefs.add(state.bounceBackRef);
      increment(reasonGroups, state.reasonGroup);
      increment(priorityBands, String(state.priorityBand));
    } else if (event.eventType === "pharmacy_staff_reviewed") {
      state.staffReviewAt = event.occurredAt;
    } else if (event.eventType === "pharmacy_urgent_safe_action") {
      state.urgentSafeActionAt = event.occurredAt;
    } else if (event.eventType === "pharmacy_case_reopened") {
      state.reopenedAt = event.occurredAt;
      reopenedRefs.add(event.pharmacyCaseRef ?? event.entityRef);
    }
  }
  const caseList = [...cases.values()];
  const dispatchToOutcome = caseList
    .map((state) => (state.dispatchAt && state.outcomeAt ? minutesBetween(state.dispatchAt, state.outcomeAt) : undefined))
    .filter((value): value is number => value !== undefined && value >= 0);
  const bounceToReview = caseList
    .map((state) => (state.bounceAt && state.staffReviewAt ? minutesBetween(state.bounceAt, state.staffReviewAt) : undefined))
    .filter((value): value is number => value !== undefined && value >= 0);
  const urgentToSafe = caseList
    .map((state) =>
      state.bounceBackType === "urgent_gp_return" && state.bounceAt && state.urgentSafeActionAt
        ? minutesBetween(state.bounceAt, state.urgentSafeActionAt)
        : undefined,
    )
    .filter((value): value is number => value !== undefined && value >= 0);
  const openBounceBackBacklog = caseList.filter((state) => state.bounceAt && !state.staffReviewAt).length;
  const maxLoopRisk = Math.max(0, ...caseList.map((state) => state.loopRiskScore ?? 0));
  return {
    ...buildLineage("omd_438_pharmacy_bounce_back", input, normalized, trust, events),
    metricFamily: "pharmacy_bounce_back",
    metricSnapshotId: `pbm_438_${metricHash(
      { sourceWindowHash: normalized.sourceWindowHash, metric: "pharmacy" },
      "phase9.438.pharmacy.snapshot.id",
    ).slice(0, 16)}`,
    dispatchCount: dispatchRefs.size,
    outcomeCount: outcomeRefs.size,
    bounceBackCount: bounceRefs.size,
    bounceBackReasonGroups: mapToRecord(reasonGroups),
    urgentReturnCount: caseList.filter(
      (state) => state.bounceBackType === "urgent_gp_return" || state.bounceBackType === "safeguarding_concern",
    ).length,
    routineReturnCount: caseList.filter((state) => state.bounceBackType === "routine_gp_return").length,
    noContactCount: caseList.filter((state) => state.bounceBackType === "unable_to_contact").length,
    reopenedLoopCount: reopenedRefs.size,
    reopenPriorityBandCounts: mapToRecord(priorityBands),
    dispatchToOutcomeLatencyMinutesP50: percentile(dispatchToOutcome, 0.5),
    bounceBackToStaffReviewMinutesP50: percentile(bounceToReview, 0.5),
    urgentReturnToSafeActionMinutesP50: percentile(urgentToSafe, 0.5),
    openBounceBackBacklog,
    loopRiskState: maxLoopRisk >= 0.8 ? "critical" : maxLoopRisk >= 0.6 ? "elevated" : maxLoopRisk >= 0.3 ? "watch" : "clear",
    patientNotificationStateRefs: sortedUnique(caseList.flatMap((state) => [...state.notificationRefs])),
    capturedAt: input.window.capturedAt,
  };
}

interface NotificationState {
  createdAt?: string;
  acceptedAt?: string;
  ackAt?: string;
  ackFailureAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  retryScheduledAt?: string;
  retryExhaustedAt?: string;
  receiptAt?: string;
  replyAt?: string;
  channel: string;
  riskState: NotificationDeliveryRiskState;
}

function notificationKey(event: Phase9MetricLifecycleEvent): string {
  return event.notificationRef ?? event.communicationEnvelopeRef ?? event.entityRef;
}

function buildNotificationSnapshot(
  input: Phase9EssentialFunctionMetricsInput,
  normalized: NormalizedMetricEvents,
  trust: MetricTrustContext,
): NotificationDeliveryMetricSnapshot {
  const events = normalized.acceptedEvents.filter((event) => event.eventFamily === "notification_lifecycle");
  const notifications = new Map<string, NotificationState>();
  const stateFor = (event: Phase9MetricLifecycleEvent): NotificationState => {
    const key = notificationKey(event);
    const state = notifications.get(key) ?? {
      channel: event.channel ?? "unknown",
      riskState: event.deliveryRiskState ?? "clear",
    };
    state.channel = event.channel ?? state.channel;
    state.riskState = event.deliveryRiskState ?? state.riskState;
    notifications.set(key, state);
    return state;
  };
  for (const event of events) {
    const state = stateFor(event);
    if (event.eventType === "communication_envelope_created") {
      state.createdAt = event.occurredAt;
    } else if (event.eventType === "outbound_transport_accepted") {
      state.acceptedAt = event.occurredAt;
    } else if (event.eventType === "provider_acknowledged") {
      if (event.providerAckState === "failed") {
        state.ackFailureAt = event.occurredAt;
        state.riskState = "likely_failed";
      } else {
        state.ackAt = event.occurredAt;
      }
    } else if (event.eventType === "delivery_succeeded") {
      state.deliveredAt = event.occurredAt;
      state.riskState = event.deliveryRiskState ?? "clear";
    } else if (event.eventType === "delivery_failed") {
      state.failedAt = event.occurredAt;
      state.riskState = event.deliveryRiskState ?? "likely_failed";
    } else if (event.eventType === "retry_scheduled") {
      state.retryScheduledAt = event.occurredAt;
      state.riskState = event.deliveryRiskState ?? "at_risk";
    } else if (event.eventType === "retry_exhausted") {
      state.retryExhaustedAt = event.occurredAt;
      state.riskState = "exhausted";
    } else if (event.eventType === "patient_receipt_recorded") {
      state.receiptAt = event.occurredAt;
    } else if (event.eventType === "patient_reply_settled") {
      state.replyAt = event.occurredAt;
    }
  }
  const list = [...notifications.values()];
  const riskCounts = new Map<NotificationDeliveryRiskState, number>();
  for (const risk of ["clear", "at_risk", "likely_failed", "disputed", "exhausted"] as const) {
    riskCounts.set(risk, 0);
  }
  for (const state of list) {
    riskCounts.set(state.riskState, (riskCounts.get(state.riskState) ?? 0) + 1);
  }
  const byChannelTotals = new Map<string, number>();
  const byChannelDelivered = new Map<string, number>();
  for (const state of list) {
    increment(byChannelTotals, state.channel);
    if (state.deliveredAt) {
      increment(byChannelDelivered, state.channel);
    }
  }
  const deliveryRateByChannel = Object.fromEntries(
    [...byChannelTotals.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([channel, total]) => [channel, total === 0 ? 0 : (byChannelDelivered.get(channel) ?? 0) / total]),
  );
  const deliveryLatencies = list
    .map((state) => (state.createdAt && state.deliveredAt ? minutesBetween(state.createdAt, state.deliveredAt) : undefined))
    .filter((value): value is number => value !== undefined && value >= 0);
  const receiptLatencies = list
    .map((state) => (state.createdAt && state.receiptAt ? minutesBetween(state.createdAt, state.receiptAt) : undefined))
    .filter((value): value is number => value !== undefined && value >= 0);
  const replyLatencies = list
    .map((state) => (state.createdAt && state.replyAt ? minutesBetween(state.createdAt, state.replyAt) : undefined))
    .filter((value): value is number => value !== undefined && value >= 0);
  return {
    ...buildLineage("omd_438_notification_delivery", input, normalized, trust, events),
    metricFamily: "notification_delivery",
    metricSnapshotId: `ndm_438_${metricHash(
      { sourceWindowHash: normalized.sourceWindowHash, metric: "notification" },
      "phase9.438.notification.snapshot.id",
    ).slice(0, 16)}`,
    communicationEnvelopeCreated: list.filter((state) => state.createdAt).length,
    outboundTransportAccepted: list.filter((state) => state.acceptedAt).length,
    providerAcknowledgement: list.filter((state) => state.ackAt).length,
    providerAckFailure: list.filter((state) => state.ackFailureAt).length,
    deliverySuccess: list.filter((state) => state.deliveredAt).length,
    deliveryFailureOrBounce: list.filter((state) => state.failedAt).length,
    retryScheduled: list.filter((state) => state.retryScheduledAt).length,
    retryExhausted: list.filter((state) => state.retryExhaustedAt).length,
    patientReceiptEnvelope: list.filter((state) => state.receiptAt).length,
    patientReplyConversationSettlement: list.filter((state) => state.replyAt).length,
    deliveryRiskStateCounts: Object.fromEntries(riskCounts.entries()) as Record<NotificationDeliveryRiskState, number>,
    timeToDeliveryMinutesP50: percentile(deliveryLatencies, 0.5),
    timeToReceiptMinutesP50: percentile(receiptLatencies, 0.5),
    timeToPatientReplyMinutesP50: percentile(replyLatencies, 0.5),
    deliveryRateByChannel,
    receiptRate: list.length === 0 ? 0 : list.filter((state) => state.receiptAt).length / list.length,
    capturedAt: input.window.capturedAt,
  };
}

function anomaly(
  input: Phase9EssentialFunctionMetricsInput,
  idSeed: string,
  metricDefinitionRef: string,
  observedValue: number,
  expectedValue: number,
  sigmaHat: number,
  support: number,
  minimumSupport = 3,
): MetricAnomalySnapshot {
  const previous = input.previousAnomalyStateByMetricRef?.[metricDefinitionRef];
  return evaluateMetricAnomaly({
    metricAnomalySnapshotId: `mas_438_${metricHash({ idSeed, metricDefinitionRef }, "phase9.438.anomaly.id").slice(0, 16)}`,
    metricDefinitionRef,
    observedValue,
    expectedValue,
    sigmaHat,
    sigmaFloor: 0.01,
    previousEwmaScore: previous?.previousEwmaScore,
    previousCusumPositiveScore: previous?.previousCusumPositiveScore,
    previousCusumNegativeScore: previous?.previousCusumNegativeScore,
    previousAlertState: previous?.previousAlertState,
    previousExitHoldCount: previous?.previousExitHoldCount,
    support,
    minimumSupport,
    thresholdPolicyRef: `threshold:${metricDefinitionRef}:438:v1`,
    capturedAt: input.window.capturedAt,
  }).snapshot;
}

function buildAnomalySnapshots(
  input: Phase9EssentialFunctionMetricsInput,
  waitlist: WaitlistConversionMetricSnapshot,
  pharmacy: PharmacyBounceBackMetricSnapshot,
  notification: NotificationDeliveryMetricSnapshot,
): readonly MetricAnomalySnapshot[] {
  const offerExpiryRate = waitlist.offersCreated === 0 ? 0 : waitlist.offersExpired / waitlist.offersCreated;
  const bounceBackRate = pharmacy.dispatchCount === 0 ? 0 : pharmacy.bounceBackCount / pharmacy.dispatchCount;
  const notificationFailureRate =
    notification.communicationEnvelopeCreated === 0
      ? 0
      : (notification.deliveryFailureOrBounce + notification.providerAckFailure) / notification.communicationEnvelopeCreated;
  const channelFailureRate = notification.communicationEnvelopeCreated === 0 ? 0 : notification.providerAckFailure / notification.communicationEnvelopeCreated;
  const maxEquityVariance = Math.max(0, ...waitlist.equityAccessDelaySlices.map((slice) => slice.varianceMagnitude));
  return [
    anomaly(input, "waitlist_conversion_drop", "omd_438_waitlist_conversion_drop", 1 - waitlist.conversionRate, 0.25, 0.08, waitlist.offersCreated),
    anomaly(input, "waitlist_offer_expiry_rise", "omd_438_waitlist_offer_expiry_rise", offerExpiryRate, 0.12, 0.05, waitlist.offersCreated),
    anomaly(input, "pharmacy_urgent_return_backlog", "omd_438_pharmacy_urgent_return_backlog", pharmacy.openBounceBackBacklog, 0, 1, pharmacy.bounceBackCount),
    anomaly(input, "pharmacy_bounce_back_reason_spike", "omd_438_pharmacy_bounce_back_reason_spike", bounceBackRate, 0.1, 0.05, pharmacy.dispatchCount),
    anomaly(input, "notification_delivery_failure_spike", "omd_438_notification_delivery_failure_spike", notificationFailureRate, 0.03, 0.02, notification.communicationEnvelopeCreated),
    anomaly(input, "notification_receipt_reply_latency_degradation", "omd_438_notification_receipt_reply_latency_degradation", notification.timeToReceiptMinutesP50 + notification.timeToPatientReplyMinutesP50, 20, 10, notification.patientReceiptEnvelope + notification.patientReplyConversationSettlement),
    anomaly(input, "notification_channel_transport_failure", "omd_438_notification_channel_transport_failure", channelFailureRate, 0.01, 0.02, notification.communicationEnvelopeCreated),
    anomaly(input, "slice_access_inequity_persistence", "omd_438_slice_access_inequity_persistence", maxEquityVariance, 0.08, 0.04, waitlist.eligibleCohortSize),
  ].sort((left, right) => left.metricAnomalySnapshotId.localeCompare(right.metricAnomalySnapshotId));
}

function buildAlertHooks(
  anomalies: readonly MetricAnomalySnapshot[],
  trust: MetricTrustContext,
): readonly Phase9MetricAlertHook[] {
  const codeByMetric = new Map<string, Phase9MetricAlertHook["alertCode"]>([
    ["omd_438_waitlist_conversion_drop", "waitlist_conversion_drop"],
    ["omd_438_waitlist_offer_expiry_rise", "waitlist_offer_expiry_rise"],
    ["omd_438_pharmacy_urgent_return_backlog", "pharmacy_urgent_return_backlog"],
    ["omd_438_pharmacy_bounce_back_reason_spike", "pharmacy_bounce_back_reason_spike"],
    ["omd_438_notification_delivery_failure_spike", "notification_delivery_failure_spike"],
    ["omd_438_notification_receipt_reply_latency_degradation", "notification_receipt_reply_latency_degradation"],
    ["omd_438_notification_channel_transport_failure", "notification_channel_transport_failure"],
    ["omd_438_slice_access_inequity_persistence", "slice_access_inequity_persistence"],
  ]);
  const familyFor = (code: Phase9MetricAlertHook["alertCode"]): Phase9MetricFamily =>
    code.startsWith("waitlist") || code.startsWith("slice")
      ? "waitlist_conversion"
      : code.startsWith("pharmacy")
        ? "pharmacy_bounce_back"
        : "notification_delivery";
  return anomalies.map((snapshot) => {
    const alertCode = codeByMetric.get(snapshot.metricDefinitionRef);
    invariant(alertCode, "UNKNOWN_ALERT_METRIC", snapshot.metricDefinitionRef);
    return {
      alertHookId: `mah_438_${metricHash(
        { alertCode, anomalyRef: snapshot.metricAnomalySnapshotId },
        "phase9.438.alert-hook.id",
      ).slice(0, 16)}`,
      alertCode,
      metricFamily: familyFor(alertCode),
      anomalyRef: snapshot.metricAnomalySnapshotId,
      alertState: snapshot.alertState,
      support: snapshot.support,
      blockingRefs: snapshot.support < 3 ? [`low-support:${snapshot.metricDefinitionRef}`] : trust.blockingRefs,
    };
  });
}

function metricStateLabel(trust: MetricTrustContext, alertStates: readonly OperationalAlertState[]): "Normal" | "Degraded" | "Blocked" {
  if (trust.snapshotState === "blocked") {
    return "Blocked";
  }
  if (trust.snapshotState === "degraded" || alertStates.some((state) => state === "critical" || state === "elevated")) {
    return "Degraded";
  }
  return "Normal";
}

function buildDashboardDtos(
  input: Phase9EssentialFunctionMetricsInput,
  trust: MetricTrustContext,
  waitlist: WaitlistConversionMetricSnapshot,
  pharmacy: PharmacyBounceBackMetricSnapshot,
  notification: NotificationDeliveryMetricSnapshot,
  anomalies: readonly MetricAnomalySnapshot[],
): readonly Phase9MetricDashboardDto[] {
  const metricPrefixByFamily: Readonly<Record<Phase9MetricFamily, string>> = {
    waitlist_conversion: "waitlist",
    pharmacy_bounce_back: "pharmacy",
    notification_delivery: "notification",
  };
  const state = (family: Phase9MetricFamily) =>
    metricStateLabel(
      trust,
      anomalies
        .filter((anomalySnapshot) =>
          anomalySnapshot.metricDefinitionRef.includes(metricPrefixByFamily[family]),
        )
        .map((anomalySnapshot) => anomalySnapshot.alertState),
    );
  const dto = (
    metricFamily: Phase9MetricFamily,
    topLineValue: string,
    denominator: string,
    counts: Readonly<Record<string, number>>,
  ): Phase9MetricDashboardDto => {
    const stateLabel = state(metricFamily);
    return {
      metricFamily,
      stateLabel,
      stateReason:
        stateLabel === "Normal"
          ? "Lifecycle evidence is complete, trusted, and inside the active projection window."
          : `Lifecycle evidence is ${trust.trustState}/${trust.completenessState}; blockers are explicit.`,
      topLineValue,
      denominator,
      window: `${input.window.windowStart}/${input.window.windowEnd}`,
      trend: "flat",
      riskOrConfidenceBand:
        stateLabel === "Normal" ? "bounded:trusted" : `bounded:${trust.freshnessState}:${trust.snapshotState}`,
      freshnessState: trust.freshnessState,
      trustState: trust.trustState,
      completenessState: trust.completenessState,
      drillInSeed: metricHash(
        { metricFamily, sourceWindow: waitlist.sourceWindowHash },
        "phase9.438.dashboard.drill-in",
      ),
      allowedInvestigationScope: `scope:${input.window.scopeRef}:metric:${metricFamily}`,
      supportingLifecycleCounts: counts,
      blockedOrDegradedExplanation: trust.blockingRefs,
    };
  };
  return [
    dto("waitlist_conversion", `${Math.round(waitlist.conversionRate * 100)}%`, `${waitlist.offersCreated} offers`, {
      eligibleCohortSize: waitlist.eligibleCohortSize,
      offersCreated: waitlist.offersCreated,
      offersAccepted: waitlist.offersAccepted,
      bookingsCreatedFromOffers: waitlist.bookingsCreatedFromOffers,
      offersExpired: waitlist.offersExpired,
    }),
    dto("pharmacy_bounce_back", `${pharmacy.openBounceBackBacklog} open`, `${pharmacy.dispatchCount} dispatches`, {
      dispatchCount: pharmacy.dispatchCount,
      outcomeCount: pharmacy.outcomeCount,
      bounceBackCount: pharmacy.bounceBackCount,
      urgentReturnCount: pharmacy.urgentReturnCount,
      reopenedLoopCount: pharmacy.reopenedLoopCount,
    }),
    dto("notification_delivery", `${notification.deliverySuccess} delivered`, `${notification.communicationEnvelopeCreated} envelopes`, {
      communicationEnvelopeCreated: notification.communicationEnvelopeCreated,
      outboundTransportAccepted: notification.outboundTransportAccepted,
      providerAcknowledgement: notification.providerAcknowledgement,
      deliverySuccess: notification.deliverySuccess,
      patientReceiptEnvelope: notification.patientReceiptEnvelope,
      patientReplyConversationSettlement: notification.patientReplyConversationSettlement,
    }),
  ];
}

function projectionEventsFromSnapshots(
  input: Phase9EssentialFunctionMetricsInput,
  waitlist: WaitlistConversionMetricSnapshot,
  pharmacy: PharmacyBounceBackMetricSnapshot,
  notification: NotificationDeliveryMetricSnapshot,
): readonly OperationalProjectionEvent[] {
  const base = createPhase9OperationalProjectionEngineFixture();
  const metricEvents: OperationalProjectionEvent[] = [
    {
      eventId: "evt-438-projection-waitlist",
      eventFamily: "waitlist_movement",
      eventType: "metric_observation",
      tenantId: input.window.tenantId,
      entityRef: waitlist.metricSnapshotId,
      sourceRef: waitlist.metricSnapshotId,
      sourceProjectionRef: "WaitlistConversionMetricSnapshot",
      sourceTrustRef: waitlist.metricDefinitionRef,
      occurredAt: input.window.capturedAt,
      recordedAt: input.window.capturedAt,
      orderingKey: `438:${waitlist.metricSnapshotId}`,
      dedupeKey: `438:waitlist:${waitlist.sourceWindowHash}`,
      sequence: 438001,
      metricCode: "waitlist_conversion",
      observedValue: waitlist.conversionRate,
      expectedValue: 0.7,
      sigmaHat: 0.08,
      support: waitlist.offersCreated,
      minimumSupport: 3,
      equitySliceDefinition: waitlist.equityAccessDelaySlices[0]?.sliceDefinition,
      equitySampleSize: waitlist.eligibleCohortSize,
      equityVarianceMagnitude: waitlist.equityAccessDelaySlices[0]?.varianceMagnitude,
    },
    {
      eventId: "evt-438-projection-pharmacy",
      eventFamily: "pharmacy_dispatch_outcome",
      eventType: "metric_observation",
      tenantId: input.window.tenantId,
      entityRef: pharmacy.metricSnapshotId,
      sourceRef: pharmacy.metricSnapshotId,
      sourceProjectionRef: "PharmacyBounceBackMetricSnapshot",
      sourceTrustRef: pharmacy.metricDefinitionRef,
      occurredAt: input.window.capturedAt,
      recordedAt: input.window.capturedAt,
      orderingKey: `438:${pharmacy.metricSnapshotId}`,
      dedupeKey: `438:pharmacy:${pharmacy.sourceWindowHash}`,
      sequence: 438002,
      metricCode: "pharmacy_bounce_back",
      observedValue: pharmacy.openBounceBackBacklog,
      expectedValue: 0,
      sigmaHat: 1,
      support: pharmacy.dispatchCount,
      minimumSupport: 3,
    },
    {
      eventId: "evt-438-projection-notification",
      eventFamily: "communications_delivery_receipt",
      eventType: "metric_observation",
      tenantId: input.window.tenantId,
      entityRef: notification.metricSnapshotId,
      sourceRef: notification.metricSnapshotId,
      sourceProjectionRef: "NotificationDeliveryMetricSnapshot",
      sourceTrustRef: notification.metricDefinitionRef,
      occurredAt: input.window.capturedAt,
      recordedAt: input.window.capturedAt,
      orderingKey: `438:${notification.metricSnapshotId}`,
      dedupeKey: `438:notification:${notification.sourceWindowHash}`,
      sequence: 438003,
      metricCode: "patient_message_delivery",
      observedValue: notification.communicationEnvelopeCreated === 0 ? 0 : notification.deliverySuccess / notification.communicationEnvelopeCreated,
      expectedValue: 0.96,
      sigmaHat: 0.03,
      support: notification.communicationEnvelopeCreated,
      minimumSupport: 3,
    },
  ];
  const tenantAlignedBaselineEvents = base.baselineEvents.map((event) => ({
    ...event,
    tenantId: input.window.tenantId,
  }));
  return [...tenantAlignedBaselineEvents, ...metricEvents];
}

function resultHash(result: Omit<Phase9EssentialFunctionMetricsResult, "resultHash">): string {
  return metricHash(
    {
      sourceWindowHash: result.sourceWindowHash,
      acceptedEventRefs: result.acceptedEventRefs,
      duplicateEventRefs: result.duplicateEventRefs,
      lateEventRefs: result.lateEventRefs,
      waitlistConversion: result.waitlistConversion,
      pharmacyBounceBack: result.pharmacyBounceBack,
      notificationDelivery: result.notificationDelivery,
      anomalyRefs: result.anomalySnapshots.map((snapshot) => snapshot.metricAnomalySnapshotId),
      dashboardDtos: result.dashboardDtos,
      projectionSnapshotHash: result.projectionResult.snapshotHash,
    },
    "phase9.438.metrics.result",
  );
}

export function buildPhase9EssentialFunctionMetrics(
  input: Phase9EssentialFunctionMetricsInput,
): Phase9EssentialFunctionMetricsResult {
  const adapters = input.adapters ?? getDefaultPhase9MetricLifecycleEventAdapters();
  const adapterErrors = validatePhase9MetricLifecycleEventAdapters(adapters);
  invariant(adapterErrors.length === 0, "METRIC_LIFECYCLE_ADAPTER_INVALID", adapterErrors.join("; "));
  const normalized = normalizeMetricEvents(input, adapters);
  const trust = deriveMetricTrustContext(input, normalized);
  const waitlistConversion = buildWaitlistSnapshot(input, normalized, trust);
  const pharmacyBounceBack = buildPharmacySnapshot(input, normalized, trust);
  const notificationDelivery = buildNotificationSnapshot(input, normalized, trust);
  const anomalySnapshots = buildAnomalySnapshots(input, waitlistConversion, pharmacyBounceBack, notificationDelivery);
  const alertHooks = buildAlertHooks(anomalySnapshots, trust);
  const dashboardDtos = buildDashboardDtos(input, trust, waitlistConversion, pharmacyBounceBack, notificationDelivery, anomalySnapshots);
  const projectionSeed = createPhase9OperationalProjectionEngineFixture();
  const projectionResult = projectPhase9OperationalWindow({
    events: projectionEventsFromSnapshots(input, waitlistConversion, pharmacyBounceBack, notificationDelivery),
    window: input.window,
    trustRecords: input.trustRecords ?? projectionSeed.baselineTrustRecords,
    graphVerdict: input.graphVerdict ?? projectionSeed.baselineGraphVerdict,
    previousAnomalyStateByMetricRef: input.previousAnomalyStateByMetricRef,
  });
  const resultWithoutHash = {
    schemaVersion: PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION,
    projectionEngineVersion: PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION,
    tenantId: input.window.tenantId,
    sourceWindowHash: normalized.sourceWindowHash,
    acceptedEventRefs: normalized.acceptedEvents.map((event) => event.eventId),
    duplicateEventRefs: normalized.duplicateEventRefs,
    lateEventRefs: normalized.lateEventRefs,
    waitlistConversion: {
      ...waitlistConversion,
      projectionHealthRef: projectionResult.projectionHealthSnapshot.projectionHealthSnapshotId,
    },
    pharmacyBounceBack: {
      ...pharmacyBounceBack,
      projectionHealthRef: projectionResult.projectionHealthSnapshot.projectionHealthSnapshotId,
    },
    notificationDelivery: {
      ...notificationDelivery,
      projectionHealthRef: projectionResult.projectionHealthSnapshot.projectionHealthSnapshotId,
    },
    anomalySnapshots,
    alertHooks,
    dashboardDtos,
    projectionResult,
  } satisfies Omit<Phase9EssentialFunctionMetricsResult, "resultHash">;
  return {
    ...resultWithoutHash,
    resultHash: resultHash(resultWithoutHash),
  };
}

export class Phase9EssentialFunctionMetricsEngine {
  project(input: Phase9EssentialFunctionMetricsInput): Phase9EssentialFunctionMetricsResult {
    return buildPhase9EssentialFunctionMetrics(input);
  }

  replay(input: Phase9EssentialFunctionMetricsInput): Phase9EssentialFunctionMetricsResult {
    return buildPhase9EssentialFunctionMetrics(input);
  }
}

export const computePhase9EssentialFunctionMetrics = buildPhase9EssentialFunctionMetrics;
export const getDefaultEssentialFunctionMetricAdapters =
  getDefaultPhase9MetricLifecycleEventAdapters;
export const validateEssentialFunctionMetricAdapters =
  validatePhase9MetricLifecycleEventAdapters;

export type EssentialFunctionMetricLifecycleEvent = Phase9MetricLifecycleEvent;
export type EssentialFunctionMetricDashboardDto = Phase9MetricDashboardDto;
export type EssentialFunctionMetricAlert = Phase9MetricAlertHook;
export type EssentialFunctionMetricSnapshot = Phase9EssentialMetricSnapshot;

function baseMetricEvent(
  eventId: string,
  eventFamily: Phase9MetricLifecycleEventFamily,
  eventType: Phase9MetricLifecycleEventType,
  occurredAt: string,
  overrides: Partial<Phase9MetricLifecycleEvent> = {},
): Phase9MetricLifecycleEvent {
  return {
    eventId,
    eventFamily,
    eventType,
    tenantId: "tenant:demo-gp",
    scopeRef: "tenant:demo-gp",
    sourceRef: overrides.sourceRef ?? `source:${eventFamily}:${eventId}`,
    sourceProjectionRef: overrides.sourceProjectionRef ?? `projection:${eventFamily}`,
    metricDefinitionRef: overrides.metricDefinitionRef ?? `omd_438_${eventFamily}`,
    sourceTrustRef: overrides.sourceTrustRef ?? `trust:${eventFamily}`,
    entityRef: overrides.entityRef ?? `entity:${eventId}`,
    occurredAt,
    recordedAt: overrides.recordedAt ?? occurredAt,
    orderingKey: overrides.orderingKey ?? `${occurredAt}:${eventId}`,
    dedupeKey: overrides.dedupeKey ?? `dedupe:${eventId}`,
    sequence: overrides.sequence ?? Number(eventId.match(/(\d+)$/)?.[1] ?? "1"),
    lifecycleEvidenceComplete: true,
    ...overrides,
  };
}

function metricTrustRecord(sliceRef: string, generatedAt: string, overrides: Partial<AssuranceSliceTrustRecord> = {}): AssuranceSliceTrustRecord {
  return {
    assuranceSliceTrustRecordId: `astr_438_${metricHash({ sliceRef, generatedAt }, "phase9.438.fixture.trust.id").slice(0, 16)}`,
    sliceRef,
    scopeRef: "tenant:demo-gp",
    audienceTier: "operations",
    trustState: "trusted",
    completenessState: "complete",
    trustScore: 0.94,
    trustLowerBound: 0.9,
    freshnessScore: 0.96,
    coverageScore: 0.96,
    lineageScore: 0.97,
    replayScore: 1,
    consistencyScore: 0.95,
    hardBlockState: false,
    blockingProducerRefs: [],
    blockingNamespaceRefs: [],
    evaluationModelRef: "phase9.assurance.slice-trust.lower-bound.v1",
    evaluationInputHash: metricHash({ sliceRef, generatedAt }, "phase9.438.fixture.trust.input"),
    lastEvaluatedAt: generatedAt,
    ...overrides,
  };
}

export function createPhase9EssentialFunctionMetricsFixture(): Phase9EssentialFunctionMetricsFixture {
  const generatedAt = "2026-04-27T09:20:00.000Z";
  const projectionFixture = createPhase9OperationalProjectionEngineFixture();
  const window: OperationalProjectionWindow = {
    tenantId: "tenant:demo-gp",
    scopeRef: "tenant:demo-gp",
    windowStart: "2026-04-27T08:00:00.000Z",
    windowEnd: "2026-04-27T09:20:00.000Z",
    capturedAt: generatedAt,
    timeHorizonRef: "ops:last-80m",
    filterDigest: metricHash({ filter: "438-essential-functions" }, "phase9.438.fixture.filter"),
  };
  const baselineTrustRecords = [
    metricTrustRecord("slice:waitlist-conversion", generatedAt),
    metricTrustRecord("slice:pharmacy-bounce-back", generatedAt),
    metricTrustRecord("slice:notification-delivery", generatedAt),
  ];
  const baselineGraphVerdict = projectionFixture.baselineGraphVerdict;
  const baselineEvents: Phase9MetricLifecycleEvent[] = [
    baseMetricEvent("evt-438-001", "waitlist_lifecycle", "waitlist_entry_eligible", "2026-04-27T08:00:00.000Z", {
      entityRef: "waitlist-entry:001",
      waitlistEntryRef: "waitlist-entry:001",
      routeFamily: "booking",
      clinicSessionRef: "clinic-session:am",
      sliceDefinition: "postcode_decile:3",
    }),
    baseMetricEvent("evt-438-002", "waitlist_lifecycle", "waitlist_entry_eligible", "2026-04-27T08:01:00.000Z", {
      entityRef: "waitlist-entry:002",
      waitlistEntryRef: "waitlist-entry:002",
      routeFamily: "booking",
      clinicSessionRef: "clinic-session:am",
    }),
    baseMetricEvent("evt-438-003", "waitlist_lifecycle", "slot_available", "2026-04-27T08:05:00.000Z", {
      entityRef: "capacity:001",
      capacityUnitRef: "capacity:001",
    }),
    baseMetricEvent("evt-438-004", "waitlist_lifecycle", "waitlist_offer_created", "2026-04-27T08:10:00.000Z", {
      entityRef: "waitlist-offer:001",
      waitlistEntryRef: "waitlist-entry:001",
      waitlistOfferRef: "waitlist-offer:001",
      capacityUnitRef: "capacity:001",
      routeFamily: "booking",
      clinicSessionRef: "clinic-session:am",
      sliceDefinition: "postcode_decile:3",
    }),
    baseMetricEvent("evt-438-005", "waitlist_lifecycle", "waitlist_offer_delivered", "2026-04-27T08:12:00.000Z", {
      entityRef: "waitlist-offer:001",
      waitlistEntryRef: "waitlist-entry:001",
      waitlistOfferRef: "waitlist-offer:001",
      capacityUnitRef: "capacity:001",
    }),
    baseMetricEvent("evt-438-006", "waitlist_lifecycle", "waitlist_offer_viewed", "2026-04-27T08:15:00.000Z", {
      entityRef: "waitlist-offer:001",
      waitlistEntryRef: "waitlist-entry:001",
      waitlistOfferRef: "waitlist-offer:001",
      capacityUnitRef: "capacity:001",
    }),
    baseMetricEvent("evt-438-007", "waitlist_lifecycle", "waitlist_offer_accepted", "2026-04-27T08:20:00.000Z", {
      entityRef: "waitlist-offer:001",
      waitlistEntryRef: "waitlist-entry:001",
      waitlistOfferRef: "waitlist-offer:001",
      capacityUnitRef: "capacity:001",
    }),
    baseMetricEvent("evt-438-008", "waitlist_lifecycle", "waitlist_booking_committed", "2026-04-27T08:35:00.000Z", {
      entityRef: "waitlist-offer:001",
      waitlistEntryRef: "waitlist-entry:001",
      waitlistOfferRef: "waitlist-offer:001",
      bookingCaseRef: "booking-case:001",
      bookingTransactionRef: "booking-tx:001",
      capacityUnitRef: "capacity:001",
    }),
    baseMetricEvent("evt-438-009", "waitlist_lifecycle", "waitlist_offer_created", "2026-04-27T08:12:00.000Z", {
      entityRef: "waitlist-offer:002",
      waitlistEntryRef: "waitlist-entry:002",
      waitlistOfferRef: "waitlist-offer:002",
      routeFamily: "booking",
      clinicSessionRef: "clinic-session:am",
    }),
    baseMetricEvent("evt-438-010", "waitlist_lifecycle", "waitlist_offer_expired", "2026-04-27T08:45:00.000Z", {
      entityRef: "waitlist-offer:002",
      waitlistEntryRef: "waitlist-entry:002",
      waitlistOfferRef: "waitlist-offer:002",
    }),
    baseMetricEvent("evt-438-011", "waitlist_lifecycle", "waitlist_auto_fill_suppressed", "2026-04-27T08:48:00.000Z", {
      entityRef: "auto-fill:001",
      autoFillRunRef: "auto-fill:001",
      suppressionReason: "unsafe_stale_capacity_truth",
    }),
    baseMetricEvent("evt-438-012", "pharmacy_lifecycle", "pharmacy_dispatch_created", "2026-04-27T08:10:00.000Z", {
      entityRef: "pharmacy-case:001",
      pharmacyCaseRef: "pharmacy-case:001",
      dispatchAttemptRef: "dispatch:001",
      communicationEnvelopeRef: "comm:pharmacy:001",
    }),
    baseMetricEvent("evt-438-013", "pharmacy_lifecycle", "pharmacy_dispatch_confirmed", "2026-04-27T08:12:00.000Z", {
      entityRef: "pharmacy-case:001",
      pharmacyCaseRef: "pharmacy-case:001",
      dispatchAttemptRef: "dispatch:001",
    }),
    baseMetricEvent("evt-438-014", "pharmacy_lifecycle", "pharmacy_outcome_received", "2026-04-27T08:55:00.000Z", {
      entityRef: "pharmacy-case:001",
      pharmacyCaseRef: "pharmacy-case:001",
      pharmacyOutcomeRef: "outcome:001",
    }),
    baseMetricEvent("evt-438-015", "pharmacy_lifecycle", "pharmacy_bounce_back", "2026-04-27T09:00:00.000Z", {
      entityRef: "pharmacy-case:001",
      pharmacyCaseRef: "pharmacy-case:001",
      pharmacyBounceBackRef: "bounce:001",
      bounceBackType: "urgent_gp_return",
      bounceBackReasonGroup: "urgent_gp_action",
      reopenPriorityBand: 3,
      loopRiskScore: 0.7,
      communicationEnvelopeRef: "comm:pharmacy:001",
    }),
    baseMetricEvent("evt-438-016", "pharmacy_lifecycle", "pharmacy_case_reopened", "2026-04-27T09:05:00.000Z", {
      entityRef: "pharmacy-case:001",
      pharmacyCaseRef: "pharmacy-case:001",
    }),
    baseMetricEvent("evt-438-017", "pharmacy_lifecycle", "pharmacy_bounce_back", "2026-04-27T09:06:00.000Z", {
      entityRef: "pharmacy-case:002",
      pharmacyCaseRef: "pharmacy-case:002",
      pharmacyBounceBackRef: "bounce:002",
      bounceBackType: "routine_gp_return",
      bounceBackReasonGroup: "unable_to_complete",
      reopenPriorityBand: 1,
      loopRiskScore: 0.2,
    }),
    baseMetricEvent("evt-438-018", "pharmacy_lifecycle", "pharmacy_bounce_back", "2026-04-27T09:07:00.000Z", {
      entityRef: "pharmacy-case:003",
      pharmacyCaseRef: "pharmacy-case:003",
      pharmacyBounceBackRef: "bounce:003",
      bounceBackType: "unable_to_contact",
      bounceBackReasonGroup: "no_contact",
      reopenPriorityBand: 2,
      loopRiskScore: 0.4,
    }),
    baseMetricEvent("evt-438-019", "notification_lifecycle", "communication_envelope_created", "2026-04-27T08:20:00.000Z", {
      entityRef: "notification:001",
      notificationRef: "notification:001",
      communicationEnvelopeRef: "comm:001",
      channel: "sms",
      messageClass: "waitlist_offer",
    }),
    baseMetricEvent("evt-438-020", "notification_lifecycle", "outbound_transport_accepted", "2026-04-27T08:21:00.000Z", {
      entityRef: "notification:001",
      notificationRef: "notification:001",
      communicationEnvelopeRef: "comm:001",
      channel: "sms",
    }),
    baseMetricEvent("evt-438-021", "notification_lifecycle", "provider_acknowledged", "2026-04-27T08:22:00.000Z", {
      entityRef: "notification:001",
      notificationRef: "notification:001",
      communicationEnvelopeRef: "comm:001",
      providerAckState: "accepted",
      channel: "sms",
    }),
    baseMetricEvent("evt-438-022", "notification_lifecycle", "delivery_succeeded", "2026-04-27T08:24:00.000Z", {
      entityRef: "notification:001",
      notificationRef: "notification:001",
      communicationEnvelopeRef: "comm:001",
      channel: "sms",
      deliveryRiskState: "clear",
    }),
    baseMetricEvent("evt-438-023", "notification_lifecycle", "patient_receipt_recorded", "2026-04-27T08:30:00.000Z", {
      entityRef: "notification:001",
      notificationRef: "notification:001",
      communicationEnvelopeRef: "comm:001",
      patientReceiptEnvelopeRef: "receipt:001",
      channel: "sms",
    }),
    baseMetricEvent("evt-438-024", "notification_lifecycle", "patient_reply_settled", "2026-04-27T08:45:00.000Z", {
      entityRef: "notification:001",
      notificationRef: "notification:001",
      communicationEnvelopeRef: "comm:001",
      conversationSettlementRef: "conversation-settlement:001",
      channel: "sms",
    }),
    baseMetricEvent("evt-438-025", "notification_lifecycle", "communication_envelope_created", "2026-04-27T08:25:00.000Z", {
      entityRef: "notification:002",
      notificationRef: "notification:002",
      communicationEnvelopeRef: "comm:002",
      channel: "email",
      messageClass: "pharmacy_return",
    }),
    baseMetricEvent("evt-438-026", "notification_lifecycle", "provider_acknowledged", "2026-04-27T08:26:00.000Z", {
      entityRef: "notification:002",
      notificationRef: "notification:002",
      communicationEnvelopeRef: "comm:002",
      providerAckState: "failed",
      channel: "email",
      deliveryRiskState: "likely_failed",
    }),
    baseMetricEvent("evt-438-027", "notification_lifecycle", "delivery_failed", "2026-04-27T08:27:00.000Z", {
      entityRef: "notification:002",
      notificationRef: "notification:002",
      communicationEnvelopeRef: "comm:002",
      channel: "email",
      deliveryRiskState: "likely_failed",
    }),
    baseMetricEvent("evt-438-028", "notification_lifecycle", "retry_scheduled", "2026-04-27T08:28:00.000Z", {
      entityRef: "notification:002",
      notificationRef: "notification:002",
      communicationEnvelopeRef: "comm:002",
      channel: "email",
      deliveryRiskState: "at_risk",
    }),
    baseMetricEvent("evt-438-029", "assurance_metric_trust", "metric_trust_record", "2026-04-27T09:10:00.000Z", {
      entityRef: "trust:438",
      trustRecord: baselineTrustRecords[0],
    }),
    baseMetricEvent("evt-438-030", "assurance_metric_trust", "metric_graph_verdict", "2026-04-27T09:11:00.000Z", {
      entityRef: "graph:438",
      graphVerdict: baselineGraphVerdict,
    }),
  ];
  const baselineInput: Phase9EssentialFunctionMetricsInput = {
    events: baselineEvents,
    window,
    trustRecords: baselineTrustRecords,
    graphVerdict: baselineGraphVerdict,
  };
  const baselineResult = buildPhase9EssentialFunctionMetrics(baselineInput);
  const duplicateNotificationResult = buildPhase9EssentialFunctionMetrics({
    ...baselineInput,
    events: [
      ...baselineEvents,
      {
        ...baselineEvents.find((event) => event.eventId === "evt-438-023")!,
        eventId: "evt-438-duplicate-receipt",
      },
    ],
  });
  const lateBookingCommitResult = buildPhase9EssentialFunctionMetrics({
    ...baselineInput,
    events: [
      ...baselineEvents,
      baseMetricEvent("evt-438-late-booking", "waitlist_lifecycle", "waitlist_booking_committed", "2026-04-27T07:58:00.000Z", {
        recordedAt: "2026-04-27T09:19:00.000Z",
        entityRef: "waitlist-offer:002",
        waitlistEntryRef: "waitlist-entry:002",
        waitlistOfferRef: "waitlist-offer:002",
        bookingCaseRef: "booking-case:late",
        bookingTransactionRef: "booking-tx:late",
      }),
    ],
  });
  const incompleteLifecycleResult = buildPhase9EssentialFunctionMetrics({
    ...baselineInput,
    events: baselineEvents.map((event) =>
      event.eventId === "evt-438-008" ? { ...event, lifecycleEvidenceComplete: false } : event,
    ),
  });
  const replayed = buildPhase9EssentialFunctionMetrics(baselineInput);
  return {
    schemaVersion: PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION,
    generatedAt,
    sourceAlgorithmRefs: [
      "blueprint/phase-9-the-assurance-ledger.md#9A",
      "blueprint/phase-9-the-assurance-ledger.md#9B",
      "blueprint/phase-4-the-booking-engine.md#4G",
      "blueprint/phase-6-the-pharmacy-loop.md#6G",
      "blueprint/patient-account-and-communications-blueprint.md#Callback-and-message-visibility",
      "data/contracts/437_phase9_operational_projection_engine_contract.json",
    ],
    adapters: getDefaultPhase9MetricLifecycleEventAdapters(),
    baselineEvents,
    baselineTrustRecords,
    baselineGraphVerdict,
    baselineResult,
    duplicateNotificationResult,
    lateBookingCommitResult,
    incompleteLifecycleResult,
    replayHash: orderedSetHash(
      [baselineResult.resultHash, replayed.resultHash, baselineResult.projectionResult.snapshotHash],
      "phase9.438.fixture.replay",
    ),
  };
}

export function summarizePhase9EssentialFunctionMetrics(
  fixture: Phase9EssentialFunctionMetricsFixture = createPhase9EssentialFunctionMetricsFixture(),
): string {
  return [
    "# 438 Phase 9 Essential Function Metrics",
    "",
    `Schema version: ${fixture.schemaVersion}`,
    `Generated at: ${fixture.generatedAt}`,
    `Adapter count: ${fixture.adapters.length}`,
    `Baseline result hash: ${fixture.baselineResult.resultHash}`,
    `Replay hash: ${fixture.replayHash}`,
    `Waitlist conversion: ${(fixture.baselineResult.waitlistConversion.conversionRate * 100).toFixed(1)}%`,
    `Pharmacy bounce-back backlog: ${fixture.baselineResult.pharmacyBounceBack.openBounceBackBacklog}`,
    `Notification receipt rate: ${(fixture.baselineResult.notificationDelivery.receiptRate * 100).toFixed(1)}%`,
    "",
    "## Lifecycle Truth",
    "",
    "- Waitlist conversion is counted from WaitlistOffer and BookingConfirmationTruthProjection lifecycle events, not notification state alone.",
    "- Pharmacy metrics preserve dispatch, outcome, bounce-back, urgent return, no-contact, review, and reopen states.",
    "- Notification delivery keeps provider acknowledgement, transport delivery, patient receipt, and conversation settlement distinct.",
    "- All snapshots carry source event refs, source window hash, metric definition refs, trust/completeness state, projection health refs, graph verdict refs, and explicit blockers.",
    "- Metric observations are fed back into the task 437 operational projection engine.",
    "",
  ].join("\n");
}

export const phase9EssentialFunctionMetricsSummary = summarizePhase9EssentialFunctionMetrics;

export function phase9MetricLifecycleAdapterMatrixCsv(
  adapters: readonly Phase9MetricLifecycleEventAdapter[] = getDefaultPhase9MetricLifecycleEventAdapters(),
): string {
  const rows = [
    [
      "eventFamily",
      "sourceObject",
      "sourceProjection",
      "requiredFields",
      "orderingKey",
      "dedupeKey",
      "tenantScope",
      "timestampSemantics",
      "authoritativeTruthBoundary",
      "sourceTrustDependency",
    ],
    ...adapters.map((adapter) => [
      adapter.eventFamily,
      adapter.sourceObject,
      adapter.sourceProjection,
      adapter.requiredFields.join("|"),
      adapter.orderingKey,
      adapter.dedupeKey,
      adapter.tenantScope,
      adapter.timestampSemantics,
      adapter.authoritativeTruthBoundary,
      adapter.sourceTrustDependency,
    ]),
  ];
  return `${rows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = String(cell).replaceAll('"', '""');
          return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
        })
        .join(","),
    )
    .join("\n")}\n`;
}

export const phase9EssentialFunctionMetricAdapterMatrixCsv =
  phase9MetricLifecycleAdapterMatrixCsv;
