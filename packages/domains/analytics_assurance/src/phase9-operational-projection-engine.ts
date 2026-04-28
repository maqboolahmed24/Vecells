import {
  PHASE9_ASSURANCE_REPLAY_DETERMINISM_VERSION,
  PHASE9_ASSURANCE_TRUST_EVALUATION_MODEL,
  hashAssurancePayload,
  orderedSetHash,
  type AssuranceGraphCompletenessVerdict,
  type AssuranceSliceTrustRecord,
  type ExperienceContinuityControlEvidence,
  type Phase9AssuranceCompletenessState,
  type Phase9AssuranceTrustState,
  type ProjectionHealthSnapshot,
} from "./phase9-assurance-ledger-contracts";
import type {
  Phase9GraphConsumerContext,
  Phase9GraphVerdictRecord,
  Phase9GraphVerdictState,
} from "./phase9-assurance-graph-verdict-engine";
import {
  PHASE9_OPERATIONAL_CONTRACT_VERSION,
  PHASE9_OPERATIONAL_MODEL_VERSION,
  PHASE9_OPERATIONAL_NORMALIZATION_VERSION,
  calculateBreachRisk,
  calculateQueueAggregateBreachProbability,
  createPhase9OperationalProjectionFixture,
  deriveLiveBoardResumeStrategy,
  derivePermittedDashboardPosture,
  evaluateEquitySliceMetric,
  evaluateMetricAnomaly,
  validateDashboardMetricTileContract,
  validateMetricAggregationTenantScope,
  validateOpsOverviewSliceEnvelope,
  type BreachRiskRecord,
  type BreachRiskSeverity,
  type BreachRiskType,
  type ContinuityControlCode,
  type ContinuityControlHealthProjection,
  type DashboardMetricTileContract,
  type DependencyFallbackState,
  type DependencyHealthRecord,
  type DependencyHealthState,
  type EquitySliceMetric,
  type LiveBoardDeltaWindow,
  type MetricAnomalySnapshot,
  type OperationalActionEligibilityState,
  type OperationalAlertState,
  type OperationalFreshnessState,
  type OperationalRenderMode,
  type OperationalSurfaceCode,
  type OpsOverviewContextFrame,
  type OpsOverviewSliceEnvelope,
  type QueueHealthSnapshot,
} from "./phase9-operational-projection-contracts";

export const PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION =
  "437.phase9.operational-projection-engine.v1";
export const PHASE9_OPERATIONAL_PROJECTION_REPLAY_VERSION =
  "437.phase9.operational-projection-replay.v1";

export type OperationalProjectionEventFamily =
  | "request_intake"
  | "triage_queue"
  | "more_info_loop"
  | "booking_search_commit"
  | "waitlist_movement"
  | "hub_coordination"
  | "pharmacy_dispatch_outcome"
  | "communications_delivery_receipt"
  | "patient_navigation_continuity"
  | "support_replay_investigation"
  | "assistive_session_trust_continuity"
  | "assurance_graph_slice_trust";

export type OperationalProjectionEventType =
  | "arrived"
  | "updated"
  | "cleared"
  | "escalated"
  | "dependency_state"
  | "metric_observation"
  | "continuity_settlement"
  | "continuity_restore"
  | "trust_record"
  | "graph_verdict";

export type OperationalLateEventHandling =
  | "bounded_correction"
  | "projection_rebuild_from_watermark"
  | "quarantine_until_replay";

export type OperationalTimestampSemantics =
  | "domain_occurred_at_authoritative"
  | "settlement_at_authoritative"
  | "provider_receipt_at_authoritative";

export interface OperationalProjectionEventAdapter {
  readonly eventFamily: OperationalProjectionEventFamily;
  readonly sourceProjection: string;
  readonly requiredFields: readonly (keyof OperationalProjectionEvent)[];
  readonly orderingKey: keyof OperationalProjectionEvent;
  readonly dedupeKey: keyof OperationalProjectionEvent;
  readonly tenantScope: keyof OperationalProjectionEvent;
  readonly timestampSemantics: OperationalTimestampSemantics;
  readonly lateEventHandling: OperationalLateEventHandling;
  readonly sourceTrustDependency: string;
}

export interface OperationalProjectionEvent {
  readonly eventId: string;
  readonly eventFamily: OperationalProjectionEventFamily;
  readonly eventType: OperationalProjectionEventType;
  readonly tenantId: string;
  readonly entityRef: string;
  readonly sourceRef: string;
  readonly sourceProjectionRef: string;
  readonly sourceTrustRef: string;
  readonly occurredAt: string;
  readonly recordedAt: string;
  readonly orderingKey: string;
  readonly dedupeKey: string;
  readonly sequence: number;
  readonly entityType?: string;
  readonly queueCode?: string;
  readonly laneCode?: string;
  readonly targetWindowCloseAt?: string;
  readonly workloadMinutes?: number;
  readonly serviceMeanMinutes?: number;
  readonly serviceVarianceMinutesSquared?: number;
  readonly dependencyCode?: string;
  readonly dependencyLatencyMs?: number;
  readonly dependencyError?: boolean;
  readonly dependencyTimeout?: boolean;
  readonly dependencyFallbackState?: DependencyFallbackState;
  readonly dependencyHealthState?: DependencyHealthState;
  readonly dependencyDelayMeanMinutes?: number;
  readonly dependencyDelayVarianceMinutesSquared?: number;
  readonly severity?: BreachRiskSeverity;
  readonly riskType?: BreachRiskType;
  readonly severityWeight?: number;
  readonly breachWindowMinutes?: number;
  readonly calibrationEffectiveSampleSize?: number;
  readonly supportingMetricRefs?: readonly string[];
  readonly metricCode?: string;
  readonly observedValue?: number;
  readonly expectedValue?: number;
  readonly sigmaHat?: number;
  readonly support?: number;
  readonly minimumSupport?: number;
  readonly thresholdPolicyRef?: string;
  readonly equitySliceDefinition?: string;
  readonly equitySampleSize?: number;
  readonly equityVarianceMagnitude?: number;
  readonly continuityControlCode?: ContinuityControlCode;
  readonly settlementOrRestoreRef?: string;
  readonly returnOrContinuationRef?: string;
  readonly experienceContinuityEvidenceRef?: string;
  readonly continuityTupleHash?: string;
  readonly continuitySetHash?: string;
  readonly routeContinuityEvidenceContractRef?: string;
  readonly producerFamilyRef?: string;
  readonly trustRecord?: AssuranceSliceTrustRecord;
  readonly continuityEvidence?: ExperienceContinuityControlEvidence;
  readonly graphVerdict?: Phase9GraphVerdictRecord;
}

export interface OperationalProjectionWindow {
  readonly tenantId: string;
  readonly scopeRef: string;
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly capturedAt: string;
  readonly timeHorizonRef: string;
  readonly filterDigest: string;
}

export interface QueueCapacityPolicy {
  readonly laneCapacityP10WorkloadMinutesPerWorkingMinute: number;
  readonly staffedAvailabilityMultiplier: number;
  readonly serviceMeanMinutes: number;
  readonly serviceVarianceMinutesSquared: number;
}

export interface OperationalProjectionPolicy {
  readonly minimumSupport: number;
  readonly minimumTrustLowerBound: number;
  readonly sourceFreshnessBudgetMs: number;
  readonly trustFreshnessBudgetMs: number;
  readonly lateEventThresholdMs: number;
  readonly breachRiskProbabilityThreshold: number;
  readonly defaultCalibrationEffectiveSampleSize: number;
  readonly defaultQueueCapacity: QueueCapacityPolicy;
  readonly queueCapacityByQueueCode: Readonly<Record<string, QueueCapacityPolicy>>;
  readonly requiredDependencyCodes: readonly string[];
}

export interface MetricAnomalyStateSeed {
  readonly previousEwmaScore?: number;
  readonly previousCusumPositiveScore?: number;
  readonly previousCusumNegativeScore?: number;
  readonly previousAlertState?: OperationalAlertState;
  readonly previousExitHoldCount?: number;
}

export interface Phase9OperationalProjectionInput {
  readonly events: readonly OperationalProjectionEvent[];
  readonly window: OperationalProjectionWindow;
  readonly adapters?: readonly OperationalProjectionEventAdapter[];
  readonly policy?: Partial<OperationalProjectionPolicy>;
  readonly trustRecords?: readonly AssuranceSliceTrustRecord[];
  readonly graphVerdict?: Phase9GraphVerdictRecord;
  readonly previousAnomalyStateByMetricRef?: Readonly<Record<string, MetricAnomalyStateSeed>>;
}

export type ProjectionCorrectionState = "none" | "late_event_correction" | "rebuild_required";
export type BreachRiskConfidenceState = "supported" | "low_support" | "stale_calibration";

export interface TrustAwareQueueHealthSnapshot extends QueueHealthSnapshot {
  readonly queueSnapshotHash: string;
  readonly sourceWindowHash: string;
  readonly sourceEventRefs: readonly string[];
  readonly trustState: Phase9AssuranceTrustState;
  readonly completenessState: Phase9AssuranceCompletenessState;
  readonly projectionHealthRef: string;
  readonly graphVerdictRef: string;
}

export interface BreachRiskExplanationVector {
  readonly explanationVectorRef: string;
  readonly entityRef: string;
  readonly queueCode: string;
  readonly slackWorkingMinutes: number;
  readonly effectiveWorkloadMinutes: number;
  readonly estimatedWaitMinutes: number;
  readonly serviceMeanMinutes: number;
  readonly dependencyDelayMeanMinutes: number;
  readonly conservativeCapacityLowerBound: number;
  readonly confidenceState: BreachRiskConfidenceState;
  readonly calibrationEffectiveSampleSize: number;
  readonly priority: number;
  readonly sourcePriorityRank: number;
  readonly sourceEventRefs: readonly string[];
}

export interface DashboardReadyOperationalTile extends DashboardMetricTileContract {
  readonly sourceSliceEnvelopeRef: string;
  readonly sourceSnapshotRef: string;
  readonly projectionHealthRef: string;
  readonly graphVerdictRef: string;
  readonly riskLowerBound: number;
  readonly riskUpperBound: number;
}

export interface ProjectionReplayReceipt {
  readonly replayWatermark: string;
  readonly acceptedEventRefs: readonly string[];
  readonly duplicateEventRefs: readonly string[];
  readonly lateEventRefs: readonly string[];
  readonly correctionState: ProjectionCorrectionState;
  readonly sourceWindowHash: string;
}

export interface Phase9OperationalProjectionResult {
  readonly schemaVersion: typeof PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION;
  readonly contractVersion: typeof PHASE9_OPERATIONAL_CONTRACT_VERSION;
  readonly tenantId: string;
  readonly window: OperationalProjectionWindow;
  readonly replay: ProjectionReplayReceipt;
  readonly queueHealthSnapshots: readonly TrustAwareQueueHealthSnapshot[];
  readonly breachRiskRecords: readonly BreachRiskRecord[];
  readonly breachRiskExplanationVectors: readonly BreachRiskExplanationVector[];
  readonly dependencyHealthRecords: readonly DependencyHealthRecord[];
  readonly metricAnomalySnapshots: readonly MetricAnomalySnapshot[];
  readonly equitySliceMetrics: readonly EquitySliceMetric[];
  readonly continuityControlHealthProjections: readonly ContinuityControlHealthProjection[];
  readonly projectionHealthSnapshot: ProjectionHealthSnapshot;
  readonly opsOverviewContextFrame: OpsOverviewContextFrame;
  readonly opsOverviewSliceEnvelopes: readonly OpsOverviewSliceEnvelope[];
  readonly liveBoardDeltaWindow: LiveBoardDeltaWindow;
  readonly dashboardTiles: readonly DashboardReadyOperationalTile[];
  readonly snapshotHash: string;
}

export interface Phase9OperationalProjectionEngineFixture {
  readonly schemaVersion: typeof PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION;
  readonly generatedAt: string;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly eventAdapters: readonly OperationalProjectionEventAdapter[];
  readonly baselineEvents: readonly OperationalProjectionEvent[];
  readonly baselineGraphVerdict: Phase9GraphVerdictRecord;
  readonly baselineTrustRecords: readonly AssuranceSliceTrustRecord[];
  readonly baselineResult: Phase9OperationalProjectionResult;
  readonly lateCorrectionResult: Phase9OperationalProjectionResult;
  readonly duplicateResult: Phase9OperationalProjectionResult;
  readonly lowSupportResult: Phase9OperationalProjectionResult;
  readonly staleTrustResult: Phase9OperationalProjectionResult;
  readonly replayHash: string;
}

export class Phase9OperationalProjectionEngineError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9OperationalProjectionEngineError";
    this.code = code;
  }
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Phase9OperationalProjectionEngineError(code, message);
  }
}

function compactForHash(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => compactForHash(entry));
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, compactForHash(entry)]),
    );
  }
  return value;
}

function projectionHash(value: unknown, namespace: string): string {
  return hashAssurancePayload(compactForHash(value), namespace);
}

function toMs(timestamp: string): number {
  const parsed = Date.parse(timestamp);
  invariant(!Number.isNaN(parsed), "INVALID_TIMESTAMP", `Invalid timestamp ${timestamp}.`);
  return parsed;
}

function minutesBetween(start: string, end: string): number {
  return (toMs(end) - toMs(start)) / 60_000;
}

function durationMinutes(window: OperationalProjectionWindow): number {
  return Math.max(1, minutesBetween(window.windowStart, window.windowEnd));
}

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function finiteOrDefault(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].filter((value) => value.length > 0).sort();
}

function percentile(values: readonly number[], ratio: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(ratio * sorted.length) - 1));
  return sorted[index] ?? 0;
}

function severityWeight(severity: BreachRiskSeverity): number {
  return { low: 1, medium: 1.4, high: 2, critical: 3 }[severity];
}

function worstFallbackState(states: readonly DependencyFallbackState[]): DependencyFallbackState {
  const rank: Record<DependencyFallbackState, number> = {
    not_required: 0,
    available: 1,
    active: 2,
    insufficient: 3,
    blocked: 4,
  };
  return states.reduce<DependencyFallbackState>(
    (worst, current) => (rank[current] > rank[worst] ? current : worst),
    "not_required",
  );
}

function dependencyDelayForQueue(
  events: readonly OperationalProjectionEvent[],
  queueCode: string,
): number {
  const relevant = events.filter(
    (event) =>
      event.eventType === "dependency_state" &&
      (event.queueCode === queueCode || !event.queueCode) &&
      event.dependencyDelayMeanMinutes !== undefined,
  );
  if (relevant.length === 0) {
    return 0;
  }
  return (
    relevant.reduce(
      (total, event) => total + finiteOrDefault(event.dependencyDelayMeanMinutes, 0),
      0,
    ) / relevant.length
  );
}

function dependencyVarianceForQueue(
  events: readonly OperationalProjectionEvent[],
  queueCode: string,
): number {
  const relevant = events.filter(
    (event) =>
      event.eventType === "dependency_state" &&
      (event.queueCode === queueCode || !event.queueCode) &&
      event.dependencyDelayVarianceMinutesSquared !== undefined,
  );
  if (relevant.length === 0) {
    return 0;
  }
  return (
    relevant.reduce(
      (total, event) => total + finiteOrDefault(event.dependencyDelayVarianceMinutesSquared, 0),
      0,
    ) / relevant.length
  );
}

export const defaultOperationalProjectionPolicy: OperationalProjectionPolicy = {
  minimumSupport: 30,
  minimumTrustLowerBound: 0.82,
  sourceFreshnessBudgetMs: 5 * 60 * 1000,
  trustFreshnessBudgetMs: 60 * 60 * 1000,
  lateEventThresholdMs: 10 * 60 * 1000,
  breachRiskProbabilityThreshold: 0.35,
  defaultCalibrationEffectiveSampleSize: 200,
  defaultQueueCapacity: {
    laneCapacityP10WorkloadMinutesPerWorkingMinute: 2,
    staffedAvailabilityMultiplier: 0.85,
    serviceMeanMinutes: 12,
    serviceVarianceMinutesSquared: 16,
  },
  queueCapacityByQueueCode: {
    request_intake: {
      laneCapacityP10WorkloadMinutesPerWorkingMinute: 2.8,
      staffedAvailabilityMultiplier: 0.95,
      serviceMeanMinutes: 8,
      serviceVarianceMinutesSquared: 9,
    },
    triage_queue: {
      laneCapacityP10WorkloadMinutesPerWorkingMinute: 2,
      staffedAvailabilityMultiplier: 0.85,
      serviceMeanMinutes: 12,
      serviceVarianceMinutesSquared: 16,
    },
    more_info_loop: {
      laneCapacityP10WorkloadMinutesPerWorkingMinute: 1.4,
      staffedAvailabilityMultiplier: 0.8,
      serviceMeanMinutes: 16,
      serviceVarianceMinutesSquared: 25,
    },
    booking_commit: {
      laneCapacityP10WorkloadMinutesPerWorkingMinute: 1.6,
      staffedAvailabilityMultiplier: 0.9,
      serviceMeanMinutes: 14,
      serviceVarianceMinutesSquared: 16,
    },
    pharmacy_dispatch: {
      laneCapacityP10WorkloadMinutesPerWorkingMinute: 1.2,
      staffedAvailabilityMultiplier: 0.82,
      serviceMeanMinutes: 20,
      serviceVarianceMinutesSquared: 36,
    },
  },
  requiredDependencyCodes: [
    "messaging_notification_transport",
    "nhs_external_integration",
    "pharmacy_inbox_outbox",
    "model_vendor_audit",
    "event_ingestion_projection_rebuild",
    "database_cache_worker",
  ],
};

export const OPERATIONAL_CONTINUITY_CONTROL_CODES = [
  "patient_nav",
  "record_continuation",
  "conversation_settlement",
  "more_info_reply",
  "support_replay_restore",
  "intake_resume",
  "booking_manage",
  "hub_booking_manage",
  "assistive_session",
  "workspace_task_completion",
  "pharmacy_console_settlement",
] as const satisfies readonly ContinuityControlCode[];

export function getDefaultOperationalProjectionEventAdapters(): readonly OperationalProjectionEventAdapter[] {
  return [
    {
      eventFamily: "request_intake",
      sourceProjection: "RequestIntakeStatusProjection",
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
        "queueCode",
      ],
      orderingKey: "orderingKey",
      dedupeKey: "dedupeKey",
      tenantScope: "tenantId",
      timestampSemantics: "domain_occurred_at_authoritative",
      lateEventHandling: "bounded_correction",
      sourceTrustDependency: "AssuranceSliceTrustRecord:request-intake",
    },
    {
      eventFamily: "triage_queue",
      sourceProjection: "TriageQueueProjection",
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
        "queueCode",
      ],
      orderingKey: "orderingKey",
      dedupeKey: "dedupeKey",
      tenantScope: "tenantId",
      timestampSemantics: "domain_occurred_at_authoritative",
      lateEventHandling: "projection_rebuild_from_watermark",
      sourceTrustDependency: "AssuranceSliceTrustRecord:triage-queue",
    },
    {
      eventFamily: "more_info_loop",
      sourceProjection: "PatientMoreInfoStatusProjection",
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
        "queueCode",
      ],
      orderingKey: "orderingKey",
      dedupeKey: "dedupeKey",
      tenantScope: "tenantId",
      timestampSemantics: "settlement_at_authoritative",
      lateEventHandling: "projection_rebuild_from_watermark",
      sourceTrustDependency: "AssuranceSliceTrustRecord:more-info-loop",
    },
    {
      eventFamily: "booking_search_commit",
      sourceProjection: "BookingConfirmationTruthProjection",
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
        "queueCode",
      ],
      orderingKey: "orderingKey",
      dedupeKey: "dedupeKey",
      tenantScope: "tenantId",
      timestampSemantics: "settlement_at_authoritative",
      lateEventHandling: "projection_rebuild_from_watermark",
      sourceTrustDependency: "AssuranceSliceTrustRecord:booking-confirmation",
    },
    {
      eventFamily: "waitlist_movement",
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
      timestampSemantics: "domain_occurred_at_authoritative",
      lateEventHandling: "bounded_correction",
      sourceTrustDependency: "AssuranceSliceTrustRecord:waitlist",
    },
    {
      eventFamily: "hub_coordination",
      sourceProjection: "HubCoordinationCaseProjection",
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
      timestampSemantics: "domain_occurred_at_authoritative",
      lateEventHandling: "projection_rebuild_from_watermark",
      sourceTrustDependency: "AssuranceSliceTrustRecord:hub-coordination",
    },
    {
      eventFamily: "pharmacy_dispatch_outcome",
      sourceProjection: "PharmacyDispatchTruthProjection",
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
      timestampSemantics: "provider_receipt_at_authoritative",
      lateEventHandling: "projection_rebuild_from_watermark",
      sourceTrustDependency: "AssuranceSliceTrustRecord:pharmacy-dispatch",
    },
    {
      eventFamily: "communications_delivery_receipt",
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
      timestampSemantics: "provider_receipt_at_authoritative",
      lateEventHandling: "bounded_correction",
      sourceTrustDependency: "AssuranceSliceTrustRecord:communications",
    },
    {
      eventFamily: "patient_navigation_continuity",
      sourceProjection: "PatientExperienceContinuityEvidenceProjection",
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
        "continuityControlCode",
      ],
      orderingKey: "orderingKey",
      dedupeKey: "dedupeKey",
      tenantScope: "tenantId",
      timestampSemantics: "settlement_at_authoritative",
      lateEventHandling: "quarantine_until_replay",
      sourceTrustDependency: "AssuranceSliceTrustRecord:patient-continuity",
    },
    {
      eventFamily: "support_replay_investigation",
      sourceProjection: "SupportReplayRestoreSettlement",
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
        "continuityControlCode",
      ],
      orderingKey: "orderingKey",
      dedupeKey: "dedupeKey",
      tenantScope: "tenantId",
      timestampSemantics: "settlement_at_authoritative",
      lateEventHandling: "quarantine_until_replay",
      sourceTrustDependency: "AssuranceSliceTrustRecord:support-replay",
    },
    {
      eventFamily: "assistive_session_trust_continuity",
      sourceProjection: "AssistiveContinuityEvidenceProjection",
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
      timestampSemantics: "settlement_at_authoritative",
      lateEventHandling: "projection_rebuild_from_watermark",
      sourceTrustDependency: "AssuranceSliceTrustRecord:assistive-session",
    },
    {
      eventFamily: "assurance_graph_slice_trust",
      sourceProjection: "AssuranceEvidenceGraphSnapshot",
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
      timestampSemantics: "settlement_at_authoritative",
      lateEventHandling: "quarantine_until_replay",
      sourceTrustDependency: "AssuranceGraphCompletenessVerdict:operational-dashboard",
    },
  ];
}

export function validateOperationalProjectionEventAdapters(
  adapters: readonly OperationalProjectionEventAdapter[] = getDefaultOperationalProjectionEventAdapters(),
): readonly string[] {
  const errors: string[] = [];
  for (const family of [
    "request_intake",
    "triage_queue",
    "more_info_loop",
    "booking_search_commit",
    "waitlist_movement",
    "hub_coordination",
    "pharmacy_dispatch_outcome",
    "communications_delivery_receipt",
    "patient_navigation_continuity",
    "support_replay_investigation",
    "assistive_session_trust_continuity",
    "assurance_graph_slice_trust",
  ] as const satisfies readonly OperationalProjectionEventFamily[]) {
    const adapter = adapters.find((candidate) => candidate.eventFamily === family);
    if (!adapter) {
      errors.push(`EVENT_ADAPTER_MISSING:${family}`);
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
    ] as const satisfies readonly (keyof OperationalProjectionEvent)[]) {
      if (!adapter.requiredFields.includes(field)) {
        errors.push(`EVENT_ADAPTER_FIELD_MISSING:${family}:${String(field)}`);
      }
    }
  }
  return errors.sort();
}

function assertEventMatchesAdapter(
  event: OperationalProjectionEvent,
  adapters: readonly OperationalProjectionEventAdapter[],
): void {
  const adapter = adapters.find((candidate) => candidate.eventFamily === event.eventFamily);
  invariant(adapter, "EVENT_ADAPTER_MISSING", `No adapter for ${event.eventFamily}.`);
  for (const field of adapter.requiredFields) {
    const value = event[field];
    invariant(
      value !== undefined &&
        value !== null &&
        (typeof value !== "string" || value.trim().length > 0),
      "EVENT_REQUIRED_FIELD_MISSING",
      `${event.eventId} is missing ${String(field)}.`,
    );
  }
  invariant(event.tenantId.length > 0, "EVENT_TENANT_MISSING", `${event.eventId} tenant missing.`);
  invariant(
    Number.isFinite(event.sequence),
    "EVENT_SEQUENCE_INVALID",
    `${event.eventId} sequence invalid.`,
  );
  toMs(event.occurredAt);
  toMs(event.recordedAt);
}

interface NormalizedEventSet {
  readonly acceptedEvents: readonly OperationalProjectionEvent[];
  readonly duplicateEventRefs: readonly string[];
  readonly lateEventRefs: readonly string[];
  readonly sourceWindowHash: string;
}

function normalizeEvents(
  input: Phase9OperationalProjectionInput,
  adapters: readonly OperationalProjectionEventAdapter[],
  policy: OperationalProjectionPolicy,
): NormalizedEventSet {
  const sourceRefs = input.events.map((event) => ({
    sourceRef: event.eventId,
    tenantScope: event.tenantId,
  }));
  const tenantValidation = validateMetricAggregationTenantScope(input.window.tenantId, sourceRefs);
  invariant(
    tenantValidation.valid,
    "CROSS_TENANT_AGGREGATION_DENIED",
    tenantValidation.errors.join("; "),
  );

  const dedupe = new Map<string, OperationalProjectionEvent>();
  const duplicateEventRefs: string[] = [];
  const lateEventRefs: string[] = [];
  for (const event of input.events) {
    assertEventMatchesAdapter(event, adapters);
    const existing = dedupe.get(event.dedupeKey);
    if (existing) {
      duplicateEventRefs.push(event.eventId);
      continue;
    }
    dedupe.set(event.dedupeKey, event);
  }

  const acceptedEvents = [...dedupe.values()].sort((left, right) => {
    const byOccurred = toMs(left.occurredAt) - toMs(right.occurredAt);
    if (byOccurred !== 0) {
      return byOccurred;
    }
    const byOrdering = left.orderingKey.localeCompare(right.orderingKey);
    if (byOrdering !== 0) {
      return byOrdering;
    }
    const bySequence = left.sequence - right.sequence;
    return bySequence !== 0 ? bySequence : left.eventId.localeCompare(right.eventId);
  });

  const windowStartMs = toMs(input.window.windowStart);
  const capturedAtMs = toMs(input.window.capturedAt);
  for (const event of acceptedEvents) {
    if (
      toMs(event.occurredAt) < windowStartMs ||
      toMs(event.recordedAt) - toMs(event.occurredAt) > policy.lateEventThresholdMs ||
      toMs(event.recordedAt) > capturedAtMs
    ) {
      lateEventRefs.push(event.eventId);
    }
  }

  return {
    acceptedEvents,
    duplicateEventRefs: duplicateEventRefs.sort(),
    lateEventRefs: lateEventRefs.sort(),
    sourceWindowHash: projectionHash(
      {
        tenantId: input.window.tenantId,
        windowStart: input.window.windowStart,
        windowEnd: input.window.windowEnd,
        eventHashes: acceptedEvents.map((event) =>
          projectionHash(event, "phase9.operational-projection.event"),
        ),
      },
      "phase9.operational-projection.source-window",
    ),
  };
}

interface ActiveWorkItem {
  readonly entityRef: string;
  readonly entityType: string;
  readonly queueCode: string;
  readonly laneCode: string;
  readonly firstArrivedAt: string;
  readonly targetWindowCloseAt: string;
  readonly workloadMinutes: number;
  readonly serviceMeanMinutes?: number;
  readonly serviceVarianceMinutesSquared?: number;
  readonly dependencyDelayMeanMinutes?: number;
  readonly dependencyDelayVarianceMinutesSquared?: number;
  readonly severity: BreachRiskSeverity;
  readonly riskType: BreachRiskType;
  readonly severityWeight: number;
  readonly breachWindowMinutes: number;
  readonly calibrationEffectiveSampleSize: number;
  readonly supportingMetricRefs: readonly string[];
  readonly sourceEventRefs: readonly string[];
  readonly escalationCount: number;
}

interface QueueEventAccumulator {
  readonly active: Map<string, ActiveWorkItem>;
  readonly arrivalsByQueue: Map<string, number>;
  readonly clearsByQueue: Map<string, number>;
  readonly escalationsByQueue: Map<string, number>;
  readonly eventRefsByQueue: Map<string, string[]>;
}

function updateActiveItem(
  existing: ActiveWorkItem | undefined,
  event: OperationalProjectionEvent,
): ActiveWorkItem {
  const queueCode = event.queueCode ?? existing?.queueCode;
  invariant(queueCode, "QUEUE_CODE_MISSING", `${event.eventId} does not declare queueCode.`);
  const targetWindowCloseAt =
    event.targetWindowCloseAt ??
    existing?.targetWindowCloseAt ??
    new Date(toMs(event.occurredAt) + 60 * 60_000).toISOString();
  const severity = event.severity ?? existing?.severity ?? "medium";
  const calibrationEffectiveSampleSize =
    event.calibrationEffectiveSampleSize ?? existing?.calibrationEffectiveSampleSize ?? 200;
  return {
    entityRef: event.entityRef,
    entityType: event.entityType ?? existing?.entityType ?? "operational_work_item",
    queueCode,
    laneCode: event.laneCode ?? existing?.laneCode ?? queueCode,
    firstArrivedAt: existing?.firstArrivedAt ?? event.occurredAt,
    targetWindowCloseAt,
    workloadMinutes: Math.max(
      0,
      finiteOrDefault(event.workloadMinutes, existing?.workloadMinutes ?? 10),
    ),
    serviceMeanMinutes: event.serviceMeanMinutes ?? existing?.serviceMeanMinutes,
    serviceVarianceMinutesSquared:
      event.serviceVarianceMinutesSquared ?? existing?.serviceVarianceMinutesSquared,
    dependencyDelayMeanMinutes:
      event.dependencyDelayMeanMinutes ?? existing?.dependencyDelayMeanMinutes,
    dependencyDelayVarianceMinutesSquared:
      event.dependencyDelayVarianceMinutesSquared ??
      existing?.dependencyDelayVarianceMinutesSquared,
    severity,
    riskType: event.riskType ?? existing?.riskType ?? "sla_breach",
    severityWeight: event.severityWeight ?? existing?.severityWeight ?? severityWeight(severity),
    breachWindowMinutes: event.breachWindowMinutes ?? existing?.breachWindowMinutes ?? 60,
    calibrationEffectiveSampleSize,
    supportingMetricRefs: sortedUnique([
      ...(existing?.supportingMetricRefs ?? []),
      ...(event.supportingMetricRefs ?? [`omd_433_${queueCode}_health`]),
    ]),
    sourceEventRefs: sortedUnique([...(existing?.sourceEventRefs ?? []), event.eventId]),
    escalationCount: existing?.escalationCount ?? 0,
  };
}

function accumulateQueueEvents(
  events: readonly OperationalProjectionEvent[],
): QueueEventAccumulator {
  const active = new Map<string, ActiveWorkItem>();
  const arrivalsByQueue = new Map<string, number>();
  const clearsByQueue = new Map<string, number>();
  const escalationsByQueue = new Map<string, number>();
  const eventRefsByQueue = new Map<string, string[]>();

  for (const event of events) {
    if (!event.queueCode) {
      continue;
    }
    const refs = eventRefsByQueue.get(event.queueCode) ?? [];
    refs.push(event.eventId);
    eventRefsByQueue.set(event.queueCode, refs);

    if (event.eventType === "arrived" || event.eventType === "updated") {
      active.set(event.entityRef, updateActiveItem(active.get(event.entityRef), event));
      if (event.eventType === "arrived") {
        arrivalsByQueue.set(event.queueCode, (arrivalsByQueue.get(event.queueCode) ?? 0) + 1);
      }
    } else if (event.eventType === "cleared") {
      active.delete(event.entityRef);
      clearsByQueue.set(event.queueCode, (clearsByQueue.get(event.queueCode) ?? 0) + 1);
    } else if (event.eventType === "escalated") {
      const existing = updateActiveItem(active.get(event.entityRef), event);
      active.set(event.entityRef, { ...existing, escalationCount: existing.escalationCount + 1 });
      escalationsByQueue.set(event.queueCode, (escalationsByQueue.get(event.queueCode) ?? 0) + 1);
    }
  }

  return { active, arrivalsByQueue, clearsByQueue, escalationsByQueue, eventRefsByQueue };
}

interface ProjectionTrustContext {
  readonly freshnessState: OperationalFreshnessState;
  readonly trustState: Phase9AssuranceTrustState;
  readonly completenessState: Phase9AssuranceCompletenessState;
  readonly trustLowerBound: number;
  readonly integrityScore: number;
  readonly blockingRefs: readonly string[];
  readonly graphVerdictRef: string;
}

function trustRecordsFromInput(
  input: Phase9OperationalProjectionInput,
): readonly AssuranceSliceTrustRecord[] {
  return [
    ...(input.trustRecords ?? []),
    ...input.events
      .map((event) => event.trustRecord)
      .filter((record): record is AssuranceSliceTrustRecord => record !== undefined),
  ];
}

function graphVerdictFromInput(
  input: Phase9OperationalProjectionInput,
): Phase9GraphVerdictRecord | undefined {
  return input.graphVerdict ?? input.events.find((event) => event.graphVerdict)?.graphVerdict;
}

function deriveProjectionTrustContext(
  input: Phase9OperationalProjectionInput,
  normalized: NormalizedEventSet,
  adapters: readonly OperationalProjectionEventAdapter[],
  policy: OperationalProjectionPolicy,
): ProjectionTrustContext {
  const trustRecords = trustRecordsFromInput(input);
  const graphVerdict = graphVerdictFromInput(input);
  const blockingRefs: string[] = [];
  const observedFamilies = new Set(normalized.acceptedEvents.map((event) => event.eventFamily));
  const coverageScore = adapters.length === 0 ? 1 : observedFamilies.size / adapters.length;
  let trustLowerBound = trustRecords.length === 0 ? 0 : 1;
  let trustState: Phase9AssuranceTrustState = trustRecords.length === 0 ? "unknown" : "trusted";
  let completenessState: Phase9AssuranceCompletenessState =
    coverageScore >= 1 ? "complete" : "partial";
  let freshnessState: OperationalFreshnessState = "fresh";

  if (coverageScore < 1) {
    blockingRefs.push("projection:missing-source-family");
  }

  for (const record of trustRecords) {
    trustLowerBound = Math.min(trustLowerBound, record.trustLowerBound);
    if (
      record.hardBlockState ||
      record.trustState === "quarantined" ||
      record.completenessState === "blocked"
    ) {
      trustState = "quarantined";
      completenessState = "blocked";
      blockingRefs.push(record.assuranceSliceTrustRecordId);
    } else if (
      record.trustState !== "trusted" ||
      record.completenessState !== "complete" ||
      record.trustLowerBound < policy.minimumTrustLowerBound
    ) {
      trustState = trustState === "quarantined" ? "quarantined" : "degraded";
      completenessState = completenessState === "blocked" ? "blocked" : "partial";
      blockingRefs.push(record.assuranceSliceTrustRecordId);
    }
    if (
      toMs(input.window.capturedAt) - toMs(record.lastEvaluatedAt) >
      policy.trustFreshnessBudgetMs
    ) {
      freshnessState = "stale_review";
      trustState = trustState === "quarantined" ? "quarantined" : "degraded";
      blockingRefs.push(`stale:${record.assuranceSliceTrustRecordId}`);
    }
  }

  if (graphVerdict) {
    if (graphVerdict.state === "blocked") {
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
  } else {
    trustState = trustState === "trusted" ? "degraded" : trustState;
    completenessState = completenessState === "complete" ? "partial" : completenessState;
    blockingRefs.push("assurance-graph-verdict:missing");
  }

  if (normalized.lateEventRefs.length > 0) {
    trustState = trustState === "quarantined" ? "quarantined" : "degraded";
    freshnessState = freshnessState === "read_only" ? "read_only" : "watch";
    blockingRefs.push(...normalized.lateEventRefs.map((eventRef) => `late:${eventRef}`));
  }

  const integrityScore = clampUnit(
    Math.min(
      trustLowerBound,
      coverageScore,
      normalized.lateEventRefs.length > 0 ? 0.9 : 1,
      graphVerdict?.state === "complete" ? 1 : graphVerdict ? 0.45 : 0.35,
    ),
  );

  return {
    freshnessState,
    trustState,
    completenessState,
    trustLowerBound: clampUnit(trustLowerBound),
    integrityScore,
    blockingRefs: sortedUnique(blockingRefs),
    graphVerdictRef: graphVerdict?.verdictId ?? "assurance-graph-verdict:missing",
  };
}

function buildDependencyHealthRecords(
  events: readonly OperationalProjectionEvent[],
  input: Phase9OperationalProjectionInput,
  policy: OperationalProjectionPolicy,
): readonly DependencyHealthRecord[] {
  const dependencyCodes = sortedUnique([
    ...policy.requiredDependencyCodes,
    ...events
      .map((event) => event.dependencyCode)
      .filter((dependencyCode): dependencyCode is string => dependencyCode !== undefined),
  ]);
  return dependencyCodes.map((dependencyCode) => {
    const samples = events.filter(
      (event) => event.eventType === "dependency_state" && event.dependencyCode === dependencyCode,
    );
    const latencies = samples
      .map((event) => event.dependencyLatencyMs)
      .filter((latency): latency is number => latency !== undefined && Number.isFinite(latency));
    const errorCount = samples.filter((event) => event.dependencyError).length;
    const timeoutCount = samples.filter((event) => event.dependencyTimeout).length;
    const errorRate = samples.length === 0 ? 0 : errorCount / samples.length;
    const timeoutRate = samples.length === 0 ? 0 : timeoutCount / samples.length;
    const availabilityScore =
      samples.length === 0 ? 0.5 : clampUnit(1 - errorRate * 0.7 - timeoutRate * 0.3);
    const fallbackState = worstFallbackState(
      samples
        .map((event) => event.dependencyFallbackState)
        .filter((state): state is DependencyFallbackState => state !== undefined),
    );
    const explicitState = samples.find(
      (event) => event.dependencyHealthState,
    )?.dependencyHealthState;
    const healthState: DependencyHealthState =
      explicitState ??
      (samples.length === 0
        ? "unknown"
        : fallbackState === "blocked" || availabilityScore < 0.7
          ? "blocked"
          : fallbackState === "insufficient" || availabilityScore < 0.95
            ? "degraded"
            : "healthy");
    return {
      dependencyHealthRecordId: `dhr_437_${projectionHash(
        { dependencyCode, capturedAt: input.window.capturedAt },
        "phase9.operational-projection.dependency.id",
      ).slice(0, 16)}`,
      dependencyCode,
      healthState,
      latencyP95: percentile(latencies, 0.95),
      errorRate,
      timeoutRate,
      fallbackState,
      availabilityScore,
      delayHazardRef: `delay-hazard:${dependencyCode}:${projectionHash(
        samples.map((sample) => sample.eventId),
        "phase9.operational-projection.dependency.delay-hazard",
      ).slice(0, 16)}`,
      capturedAt: input.window.capturedAt,
    };
  });
}

function dependencyDegradationMultiplier(records: readonly DependencyHealthRecord[]): number {
  if (records.length === 0) {
    return 0.85;
  }
  return clampUnit(
    Math.max(
      0.1,
      Math.min(
        ...records.map((record) =>
          record.healthState === "blocked"
            ? 0.35
            : record.healthState === "degraded"
              ? Math.min(0.75, record.availabilityScore)
              : record.healthState === "unknown"
                ? 0.8
                : Math.max(0.9, record.availabilityScore),
        ),
      ),
    ),
  );
}

function buildBreachRisksForQueue(
  queueCode: string,
  activeItems: readonly ActiveWorkItem[],
  queueBasisHash: string,
  input: Phase9OperationalProjectionInput,
  policy: OperationalProjectionPolicy,
  dependencyRecords: readonly DependencyHealthRecord[],
): readonly [readonly BreachRiskRecord[], readonly BreachRiskExplanationVector[]] {
  const queueCapacity = policy.queueCapacityByQueueCode[queueCode] ?? policy.defaultQueueCapacity;
  const active = [...activeItems].sort((left, right) => {
    const byTarget = toMs(left.targetWindowCloseAt) - toMs(right.targetWindowCloseAt);
    if (byTarget !== 0) {
      return byTarget;
    }
    const byArrived = toMs(left.firstArrivedAt) - toMs(right.firstArrivedAt);
    return byArrived !== 0 ? byArrived : left.entityRef.localeCompare(right.entityRef);
  });
  const degradationMultiplier = dependencyDegradationMultiplier(dependencyRecords);
  const records: BreachRiskRecord[] = [];
  const explanations: BreachRiskExplanationVector[] = [];
  let workloadAhead = 0;
  for (let index = 0; index < active.length; index += 1) {
    const item = active[index];
    invariant(item, "ACTIVE_ITEM_MISSING", `Missing active item at ${index}.`);
    const dependencyDelayMeanMinutes =
      item.dependencyDelayMeanMinutes ?? dependencyDelayForQueue(input.events, queueCode);
    const dependencyDelayVarianceMinutesSquared =
      item.dependencyDelayVarianceMinutesSquared ??
      dependencyVarianceForQueue(input.events, queueCode);
    const explanationVectorRef = `explain:437:${projectionHash(
      { queueCode, entityRef: item.entityRef, sourceEventRefs: item.sourceEventRefs },
      "phase9.operational-projection.explanation.id",
    ).slice(0, 16)}`;
    const risk = calculateBreachRisk({
      breachRiskRecordId: `brr_437_${projectionHash(
        { queueCode, entityRef: item.entityRef, capturedAt: input.window.capturedAt },
        "phase9.operational-projection.breach.id",
      ).slice(0, 16)}`,
      entityType: item.entityType,
      entityRef: item.entityRef,
      riskType: item.riskType,
      severity: item.severity,
      predictedAt: input.window.capturedAt,
      windowCloseAt: item.targetWindowCloseAt,
      effectiveWorkloadAheadMinutes: workloadAhead,
      laneCapacityP10WorkloadMinutesPerWorkingMinute:
        queueCapacity.laneCapacityP10WorkloadMinutesPerWorkingMinute,
      staffedAvailabilityMultiplier: queueCapacity.staffedAvailabilityMultiplier,
      dependencyDegradationMultiplier: degradationMultiplier,
      serviceMeanMinutes: item.serviceMeanMinutes ?? queueCapacity.serviceMeanMinutes,
      serviceVarianceMinutesSquared:
        item.serviceVarianceMinutesSquared ?? queueCapacity.serviceVarianceMinutesSquared,
      dependencyDelayMeanMinutes,
      dependencyDelayVarianceMinutesSquared,
      severityWeight: item.severityWeight,
      breachWindowMinutes: item.breachWindowMinutes,
      calibrationEffectiveSampleSize: item.calibrationEffectiveSampleSize,
      queueSnapshotHash: queueBasisHash,
      supportingMetricRefs: item.supportingMetricRefs,
      explanationVectorRef,
    });
    records.push(risk.record);
    explanations.push({
      explanationVectorRef,
      entityRef: item.entityRef,
      queueCode,
      slackWorkingMinutes: risk.slackWorkingMinutes,
      effectiveWorkloadMinutes: risk.effectiveWorkloadMinutes,
      estimatedWaitMinutes: risk.estimatedWaitMinutes,
      serviceMeanMinutes: risk.serviceMeanMinutes,
      dependencyDelayMeanMinutes: risk.dependencyDelayMeanMinutes,
      conservativeCapacityLowerBound: risk.conservativeCapacityLowerBound,
      confidenceState:
        item.calibrationEffectiveSampleSize < policy.minimumSupport
          ? "low_support"
          : risk.record.calibrationVersionRef.includes("stale")
            ? "stale_calibration"
            : "supported",
      calibrationEffectiveSampleSize: item.calibrationEffectiveSampleSize,
      priority: risk.priority,
      sourcePriorityRank: index + 1,
      sourceEventRefs: item.sourceEventRefs,
    });
    workloadAhead += item.workloadMinutes;
  }
  records.sort((left, right) => {
    const probability = right.predictedProbability - left.predictedProbability;
    if (probability !== 0) {
      return probability;
    }
    const severityOrder: Record<BreachRiskSeverity, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };
    const severity = severityOrder[right.severity] - severityOrder[left.severity];
    return severity !== 0 ? severity : left.entityRef.localeCompare(right.entityRef);
  });
  explanations.sort((left, right) =>
    left.explanationVectorRef.localeCompare(right.explanationVectorRef),
  );
  return [records, explanations] as const;
}

function buildMetricAnomalies(
  queueSnapshots: readonly QueueHealthSnapshot[],
  metricEvents: readonly OperationalProjectionEvent[],
  input: Phase9OperationalProjectionInput,
  policy: OperationalProjectionPolicy,
): readonly MetricAnomalySnapshot[] {
  const queueAnomalies = queueSnapshots.map((snapshot) => {
    const metricRef = `omd_433_${snapshot.queueCode}_health`;
    const previous = input.previousAnomalyStateByMetricRef?.[metricRef];
    return evaluateMetricAnomaly({
      metricAnomalySnapshotId: `mas_437_${projectionHash(
        { metricRef, capturedAt: input.window.capturedAt },
        "phase9.operational-projection.anomaly.id",
      ).slice(0, 16)}`,
      metricDefinitionRef: metricRef,
      observedValue: snapshot.depth,
      expectedValue: Math.max(1, snapshot.clearRate),
      sigmaHat: Math.max(1, snapshot.p95Age / 30),
      sigmaFloor: 1,
      previousEwmaScore: previous?.previousEwmaScore,
      previousCusumPositiveScore: previous?.previousCusumPositiveScore,
      previousCusumNegativeScore: previous?.previousCusumNegativeScore,
      previousAlertState: previous?.previousAlertState,
      previousExitHoldCount: previous?.previousExitHoldCount,
      support: Math.max(snapshot.depth, snapshot.arrivalRate + snapshot.clearRate),
      minimumSupport: policy.minimumSupport,
      thresholdPolicyRef: `threshold:${snapshot.queueCode}:ops:v1`,
      capturedAt: input.window.capturedAt,
    }).snapshot;
  });
  const metricAnomalies = metricEvents
    .filter(
      (event) =>
        event.eventType === "metric_observation" &&
        event.metricCode &&
        event.observedValue !== undefined &&
        event.expectedValue !== undefined,
    )
    .map((event) => {
      const metricRef = `omd_437_${event.metricCode}`;
      const previous = input.previousAnomalyStateByMetricRef?.[metricRef];
      return evaluateMetricAnomaly({
        metricAnomalySnapshotId: `mas_437_${projectionHash(
          { metricRef, eventId: event.eventId },
          "phase9.operational-projection.metric-anomaly.id",
        ).slice(0, 16)}`,
        metricDefinitionRef: metricRef,
        observedValue: finiteOrDefault(event.observedValue, 0),
        expectedValue: finiteOrDefault(event.expectedValue, 0),
        sigmaHat: finiteOrDefault(event.sigmaHat, 1),
        sigmaFloor: 0.01,
        previousEwmaScore: previous?.previousEwmaScore,
        previousCusumPositiveScore: previous?.previousCusumPositiveScore,
        previousCusumNegativeScore: previous?.previousCusumNegativeScore,
        previousAlertState: previous?.previousAlertState,
        previousExitHoldCount: previous?.previousExitHoldCount,
        support: finiteOrDefault(event.support, 0),
        minimumSupport: event.minimumSupport ?? policy.minimumSupport,
        thresholdPolicyRef: event.thresholdPolicyRef ?? `threshold:${event.metricCode}:ops:v1`,
        capturedAt: input.window.capturedAt,
      }).snapshot;
    });
  return [...queueAnomalies, ...metricAnomalies].sort((left, right) =>
    left.metricAnomalySnapshotId.localeCompare(right.metricAnomalySnapshotId),
  );
}

function buildEquitySliceMetrics(
  events: readonly OperationalProjectionEvent[],
  input: Phase9OperationalProjectionInput,
  policy: OperationalProjectionPolicy,
): readonly EquitySliceMetric[] {
  return events
    .filter((event) => event.equitySliceDefinition)
    .map((event) =>
      evaluateEquitySliceMetric({
        equitySliceMetricId: `esm_437_${projectionHash(
          { slice: event.equitySliceDefinition, eventId: event.eventId },
          "phase9.operational-projection.equity.id",
        ).slice(0, 16)}`,
        sliceDefinition: event.equitySliceDefinition ?? "slice:unknown",
        metricSetRef: event.metricCode
          ? `metric-set:${event.metricCode}`
          : "metric-set:ops-overview",
        periodWindow: {
          periodStart: input.window.windowStart,
          periodEnd: input.window.windowEnd,
        },
        effectiveSampleSize: finiteOrDefault(
          event.equitySampleSize,
          finiteOrDefault(event.support, 0),
        ),
        varianceMagnitude: finiteOrDefault(event.equityVarianceMagnitude, 0),
        confidenceBandRef: `confidence:${event.equitySliceDefinition}:${projectionHash(
          event.eventId,
          "phase9.operational-projection.equity.confidence",
        ).slice(0, 12)}`,
        minimumSupport: event.minimumSupport ?? policy.minimumSupport,
      }),
    )
    .sort((left, right) => left.equitySliceMetricId.localeCompare(right.equitySliceMetricId));
}

function buildContinuityControlHealthProjections(
  events: readonly OperationalProjectionEvent[],
  input: Phase9OperationalProjectionInput,
  trustContext: ProjectionTrustContext,
  policy: OperationalProjectionPolicy,
): readonly ContinuityControlHealthProjection[] {
  const trustRecords = trustRecordsFromInput(input);
  return OPERATIONAL_CONTINUITY_CONTROL_CODES.map((controlCode) => {
    const controlEvents = events
      .filter((event) => event.continuityControlCode === controlCode)
      .sort(
        (left, right) =>
          toMs(left.occurredAt) - toMs(right.occurredAt) ||
          left.eventId.localeCompare(right.eventId),
      );
    const evidenceRefs = sortedUnique([
      ...controlEvents
        .map(
          (event) =>
            event.experienceContinuityEvidenceRef ??
            event.continuityEvidence?.continuityControlEvidenceId,
        )
        .filter((ref): ref is string => ref !== undefined),
    ]);
    const tupleHashes = sortedUnique([
      ...controlEvents
        .map((event) => event.continuityTupleHash ?? event.continuityEvidence?.continuityTupleHash)
        .filter((hash): hash is string => hash !== undefined),
    ]);
    const continuitySetHashes = sortedUnique([
      ...controlEvents
        .map((event) => event.continuitySetHash ?? event.continuityEvidence?.continuitySetHash)
        .filter((hash): hash is string => hash !== undefined),
    ]);
    const latestSettlement =
      [...controlEvents].reverse().find((event) => event.settlementOrRestoreRef)
        ?.settlementOrRestoreRef ?? "";
    const latestReturn =
      [...controlEvents].reverse().find((event) => event.returnOrContinuationRef)
        ?.returnOrContinuationRef ?? "";
    const relevantTrustRecords = trustRecords.filter(
      (record) => record.sliceRef.includes(controlCode) || record.sliceRef.includes("ops-overview"),
    );
    const trustLowerBound =
      relevantTrustRecords.length === 0
        ? trustContext.trustLowerBound
        : Math.min(...relevantTrustRecords.map((record) => record.trustLowerBound));
    const blockingRefs: string[] = [];
    if (controlEvents.length === 0) {
      blockingRefs.push(`continuity:${controlCode}:missing-event`);
    }
    if (!latestSettlement) {
      blockingRefs.push(`continuity:${controlCode}:missing-settlement-or-restore`);
    }
    if (!latestReturn) {
      blockingRefs.push(`continuity:${controlCode}:missing-return-or-continuation`);
    }
    if (evidenceRefs.length === 0) {
      blockingRefs.push(`continuity:${controlCode}:missing-experience-evidence`);
    }
    if (tupleHashes.length === 0 || continuitySetHashes.length === 0) {
      blockingRefs.push(`continuity:${controlCode}:missing-continuity-hash`);
    }
    if (relevantTrustRecords.length === 0) {
      blockingRefs.push(`continuity:${controlCode}:missing-assurance-trust-row`);
    }
    for (const record of relevantTrustRecords) {
      if (
        record.hardBlockState ||
        record.trustState !== "trusted" ||
        record.completenessState !== "complete" ||
        record.trustLowerBound < policy.minimumTrustLowerBound
      ) {
        blockingRefs.push(record.assuranceSliceTrustRecordId);
      }
    }
    const validationState =
      blockingRefs.some((ref) => ref.includes("missing") || ref.startsWith("astr_")) ||
      trustContext.completenessState === "blocked"
        ? "blocked"
        : trustContext.freshnessState === "stale_review" ||
            trustContext.freshnessState === "read_only"
          ? "stale"
          : trustLowerBound < policy.minimumTrustLowerBound
            ? "degraded"
            : "trusted";
    const continuitySetHash =
      continuitySetHashes[0] ??
      projectionHash(
        { controlCode, missing: true },
        "phase9.operational-projection.continuity-set.missing",
      );
    return {
      continuityControlHealthProjectionId: `cchp_437_${projectionHash(
        { controlCode, scopeRef: input.window.scopeRef, capturedAt: input.window.capturedAt },
        "phase9.operational-projection.continuity.id",
      ).slice(0, 16)}`,
      controlCode,
      scopeRef: input.window.scopeRef,
      producerFamilyRefs: sortedUnique(
        controlEvents
          .map((event) => event.producerFamilyRef ?? event.continuityEvidence?.producerFamilyRef)
          .filter((ref): ref is string => ref !== undefined),
      ),
      routeContinuityEvidenceContractRefs: sortedUnique(
        controlEvents
          .map(
            (event) =>
              event.routeContinuityEvidenceContractRef ??
              event.continuityEvidence?.routeContinuityEvidenceContractRef,
          )
          .filter((ref): ref is string => ref !== undefined),
      ),
      requiredAssuranceSliceTrustRefs: sortedUnique(
        relevantTrustRecords.map((record) => record.assuranceSliceTrustRecordId),
      ),
      experienceContinuityEvidenceRefs: evidenceRefs,
      continuityTupleHashes: tupleHashes,
      continuitySetHash,
      latestSettlementOrRestoreRef: latestSettlement || `missing:settlement:${controlCode}`,
      latestReturnOrContinuationRef: latestReturn || `missing:return:${controlCode}`,
      supportingSymptomRefs: sortedUnique(
        events
          .filter((event) => event.queueCode || event.dependencyCode)
          .slice(0, 8)
          .map((event) => event.eventId),
      ),
      trustLowerBound: clampUnit(trustLowerBound),
      validationBasisHash: projectionHash(
        {
          controlCode,
          evidenceRefs,
          tupleHashes,
          continuitySetHash,
          latestSettlement,
          latestReturn,
          trustRecords: relevantTrustRecords.map((record) => record.assuranceSliceTrustRecordId),
        },
        "phase9.operational-projection.continuity.validation-basis",
      ),
      validationState,
      blockingRefs: sortedUnique(blockingRefs),
      recommendedHandoffRef:
        validationState === "trusted" ? "handoff:none" : `handoff:continuity-review:${controlCode}`,
      capturedAt: input.window.capturedAt,
    };
  });
}

function buildProjectionHealthSnapshot(
  input: Phase9OperationalProjectionInput,
  normalized: NormalizedEventSet,
  adapters: readonly OperationalProjectionEventAdapter[],
  trustContext: ProjectionTrustContext,
  snapshotHash: string,
  resultHashBasis: unknown,
): ProjectionHealthSnapshot {
  const expectedInputRefs = adapters.map((adapter) => `event-family:${adapter.eventFamily}`).sort();
  const observedInputRefs = sortedUnique([
    ...normalized.acceptedEvents.map((event) => `event:${event.eventId}`),
    ...normalized.acceptedEvents.map((event) => `event-family:${event.eventFamily}`),
    ...trustRecordsFromInput(input).map((record) => `trust:${record.assuranceSliceTrustRecordId}`),
    graphVerdictFromInput(input)?.verdictId ?? "graph-verdict:missing",
  ]);
  const observedFamilies = new Set(normalized.acceptedEvents.map((event) => event.eventFamily));
  const coverageScore = adapters.length === 0 ? 1 : observedFamilies.size / adapters.length;
  const rebuildHash =
    normalized.lateEventRefs.length > 0
      ? projectionHash(
          { resultHashBasis, lateEventRefs: normalized.lateEventRefs },
          "phase9.operational-projection.rebuild",
        )
      : snapshotHash;
  return {
    projectionHealthSnapshotId: `phs_437_${projectionHash(
      { scopeRef: input.window.scopeRef, capturedAt: input.window.capturedAt },
      "phase9.operational-projection.health.id",
    ).slice(0, 16)}`,
    projectionCode: "phase9.live_operational_projections",
    lagMs: Math.max(
      0,
      toMs(input.window.capturedAt) -
        Math.max(
          ...normalized.acceptedEvents.map((event) => toMs(event.recordedAt)),
          toMs(input.window.windowStart),
        ),
    ),
    stalenessState:
      trustContext.freshnessState === "read_only"
        ? "blocked"
        : trustContext.freshnessState === "stale_review"
          ? "stale"
          : trustContext.freshnessState === "watch"
            ? "near_stale"
            : "fresh",
    rebuildState: normalized.lateEventRefs.length > 0 ? "queued" : "not_required",
    trustState: trustContext.trustState,
    completenessState: trustContext.completenessState,
    expectedInputRefs,
    observedInputRefs,
    coverageScore,
    replayMatchScore: snapshotHash === rebuildHash ? 1 : 0.92,
    determinismState: "deterministic",
    snapshotHash,
    rebuildHash,
    integrityScore: trustContext.integrityScore,
    affectedAudienceRefs: ["ops_console", "assurance_dashboard", "support_investigation"],
    capturedAt: input.window.capturedAt,
  };
}

function buildContextFrame(
  input: Phase9OperationalProjectionInput,
  projectionHealth: ProjectionHealthSnapshot,
  queueSnapshots: readonly TrustAwareQueueHealthSnapshot[],
): OpsOverviewContextFrame {
  const boardTupleHash = projectionHash(
    {
      scopeRef: input.window.scopeRef,
      timeHorizonRef: input.window.timeHorizonRef,
      filterDigest: input.window.filterDigest,
      projectionHealthHash: projectionHealth.snapshotHash,
      queueHashes: queueSnapshots.map((snapshot) => snapshot.queueSnapshotHash),
    },
    "phase9.operational-projection.ops-board-tuple",
  );
  return {
    contextFrameId: `oocf_437_${boardTupleHash.slice(0, 16)}`,
    scopeRef: input.window.scopeRef,
    timeHorizonRef: input.window.timeHorizonRef,
    filterDigest: input.window.filterDigest,
    projectionBundleRef: `projection-bundle:437:${projectionHealth.snapshotHash.slice(0, 16)}`,
    macroStateRef: `macro-state:${projectionHealth.trustState}:${projectionHealth.completenessState}`,
    boardStateSnapshotRef: projectionHealth.projectionHealthSnapshotId,
    boardTupleHash,
    activeSelectionLeaseRefs: [`lease:selection:${boardTupleHash.slice(0, 12)}`],
    actionEligibilityFenceRef:
      projectionHealth.trustState === "trusted" && projectionHealth.completenessState === "complete"
        ? `fence:interactive:${boardTupleHash.slice(0, 12)}`
        : `fence:observe-only:${boardTupleHash.slice(0, 12)}`,
    returnTokenRef: `return:ops-overview:${boardTupleHash.slice(0, 12)}`,
    selectedSliceRef: queueSnapshots[0]?.queueHealthSnapshotId ?? "slice:ops-overview:none",
    viewMode: "live",
  };
}

function envelopeActionEligibility(
  trustContext: ProjectionTrustContext,
): OperationalActionEligibilityState {
  if (trustContext.completenessState === "blocked" || trustContext.trustState === "quarantined") {
    return "blocked";
  }
  if (trustContext.freshnessState === "read_only") {
    return "read_only_recovery";
  }
  if (trustContext.freshnessState === "stale_review") {
    return "stale_reacquire";
  }
  if (trustContext.trustState !== "trusted" || trustContext.completenessState !== "complete") {
    return "observe_only";
  }
  return "interactive";
}

function buildSliceEnvelopes(
  input: Phase9OperationalProjectionInput,
  contextFrame: OpsOverviewContextFrame,
  trustContext: ProjectionTrustContext,
): readonly OpsOverviewSliceEnvelope[] {
  const surfaces: readonly OperationalSurfaceCode[] = [
    "NorthStarBand",
    "BottleneckRadar",
    "CapacityAllocator",
    "ServiceHealthGrid",
    "CohortImpactMatrix",
    "InterventionWorkbench",
  ];
  const actionEligibilityState = envelopeActionEligibility(trustContext);
  return surfaces.map((surfaceCode) => {
    const candidate: OpsOverviewSliceEnvelope = {
      sliceEnvelopeId: `oose_437_${projectionHash(
        { surfaceCode, boardTupleHash: contextFrame.boardTupleHash },
        "phase9.operational-projection.slice-envelope.id",
      ).slice(0, 16)}`,
      surfaceCode,
      projectionRef: contextFrame.projectionBundleRef,
      boardTupleHash: contextFrame.boardTupleHash,
      selectedEntityTupleHash: projectionHash(
        { surfaceCode, scopeRef: input.window.scopeRef },
        "phase9.operational-projection.selected-entity",
      ),
      freshnessState: trustContext.freshnessState,
      trustState: trustContext.trustState,
      trustLowerBound: trustContext.trustLowerBound,
      integrityScore: trustContext.integrityScore,
      completenessState: trustContext.completenessState,
      confidenceBandRef: `confidence:${surfaceCode}:${trustContext.trustLowerBound.toFixed(2)}`,
      blockingDependencyRefs: trustContext.blockingRefs,
      releaseTrustFreezeVerdictRef: trustContext.graphVerdictRef,
      actionEligibilityState,
      diagnosticOnlyReasonRef:
        actionEligibilityState === "interactive"
          ? undefined
          : `diagnostic:${surfaceCode}:${trustContext.blockingRefs[0] ?? "projection-degraded"}`,
      renderMode: "blocked",
    };
    const renderMode: OperationalRenderMode = derivePermittedDashboardPosture(candidate);
    const envelope: OpsOverviewSliceEnvelope = { ...candidate, renderMode };
    const validation = validateOpsOverviewSliceEnvelope(envelope);
    invariant(validation.valid, "OPS_SLICE_ENVELOPE_INVALID", validation.errors.join("; "));
    return envelope;
  });
}

function buildDashboardTiles(
  input: Phase9OperationalProjectionInput,
  queueSnapshots: readonly TrustAwareQueueHealthSnapshot[],
  envelopes: readonly OpsOverviewSliceEnvelope[],
  projectionHealth: ProjectionHealthSnapshot,
  trustContext: ProjectionTrustContext,
  risks: readonly BreachRiskRecord[],
): readonly DashboardReadyOperationalTile[] {
  const riskLowerBound =
    risks.length === 0 ? 0 : Math.min(...risks.map((risk) => risk.predictionLowerBound));
  const riskUpperBound =
    risks.length === 0 ? 0 : Math.max(...risks.map((risk) => risk.predictionUpperBound));
  const stateLabel =
    trustContext.trustState === "trusted" &&
    trustContext.completenessState === "complete" &&
    trustContext.freshnessState === "fresh"
      ? "Normal"
      : trustContext.trustState === "quarantined" || trustContext.completenessState === "blocked"
        ? "Blocked"
        : "Degraded";
  const tile = (
    queue: TrustAwareQueueHealthSnapshot,
    index: number,
  ): DashboardReadyOperationalTile => {
    const envelope = envelopes[index % envelopes.length];
    invariant(envelope, "OPS_SLICE_ENVELOPE_MISSING", "Dashboard tile requires a slice envelope.");
    const candidate: DashboardReadyOperationalTile = {
      stateLabel,
      stateReason:
        stateLabel === "Normal"
          ? "Projection is fresh, trusted, complete, and replayable."
          : `Projection is ${trustContext.trustState}/${trustContext.completenessState}; blockers are explicit.`,
      primaryValue: `${queue.depth} open`,
      confidenceOrBound: `${riskLowerBound.toFixed(2)}-${riskUpperBound.toFixed(2)}`,
      lastUpdated: input.window.capturedAt,
      freshnessState: trustContext.freshnessState,
      trustState: trustContext.trustState,
      completenessState: trustContext.completenessState,
      blockingRefs: trustContext.blockingRefs,
      allowedDrillIns:
        envelope.renderMode === "blocked"
          ? []
          : ["queue", "dependency", "breach-risk", "continuity"],
      investigationScopeSeed: projectionHash(
        {
          queueCode: queue.queueCode,
          scopeRef: input.window.scopeRef,
          sourceWindowHash: queue.sourceWindowHash,
        },
        "phase9.operational-projection.investigation-scope",
      ),
      sourceSliceEnvelopeRef: envelope.sliceEnvelopeId,
      sourceSnapshotRef: queue.queueHealthSnapshotId,
      projectionHealthRef: projectionHealth.projectionHealthSnapshotId,
      graphVerdictRef: trustContext.graphVerdictRef,
      riskLowerBound,
      riskUpperBound,
    };
    const validation = validateDashboardMetricTileContract(candidate);
    invariant(validation.valid, "DASHBOARD_TILE_INVALID", validation.errors.join("; "));
    return candidate;
  };
  return queueSnapshots.map(tile);
}

function buildQueueOutputs(
  input: Phase9OperationalProjectionInput,
  normalized: NormalizedEventSet,
  policy: OperationalProjectionPolicy,
  trustContext: ProjectionTrustContext,
  dependencyRecords: readonly DependencyHealthRecord[],
): readonly [
  readonly TrustAwareQueueHealthSnapshot[],
  readonly BreachRiskRecord[],
  readonly BreachRiskExplanationVector[],
] {
  const accumulator = accumulateQueueEvents(normalized.acceptedEvents);
  const queueCodes = sortedUnique([
    ...[...accumulator.eventRefsByQueue.keys()],
    ...[...accumulator.active.values()].map((item) => item.queueCode),
  ]);
  const duration = durationMinutes(input.window);
  const allQueueSnapshots: TrustAwareQueueHealthSnapshot[] = [];
  const allRisks: BreachRiskRecord[] = [];
  const allExplanations: BreachRiskExplanationVector[] = [];
  for (const queueCode of queueCodes) {
    const activeItems = [...accumulator.active.values()].filter(
      (item) => item.queueCode === queueCode,
    );
    const sourceEventRefs = sortedUnique(accumulator.eventRefsByQueue.get(queueCode) ?? []);
    const queueBasisHash = projectionHash(
      {
        queueCode,
        activeEntityRefs: activeItems.map((item) => item.entityRef).sort(),
        sourceEventRefs,
        capturedAt: input.window.capturedAt,
        sourceWindowHash: normalized.sourceWindowHash,
      },
      "phase9.operational-projection.queue.basis",
    );
    const [riskRecords, explanations] = buildBreachRisksForQueue(
      queueCode,
      activeItems,
      queueBasisHash,
      input,
      policy,
      dependencyRecords,
    );
    const aggregateBreachProbability = calculateQueueAggregateBreachProbability(riskRecords);
    const ages = activeItems.map((item) =>
      Math.max(0, minutesBetween(item.firstArrivedAt, input.window.capturedAt)),
    );
    const queueCapacity = policy.queueCapacityByQueueCode[queueCode] ?? policy.defaultQueueCapacity;
    const capacityMinutes =
      duration *
      queueCapacity.laneCapacityP10WorkloadMinutesPerWorkingMinute *
      queueCapacity.staffedAvailabilityMultiplier;
    const utilization = clampUnit(
      activeItems.reduce((total, item) => total + item.workloadMinutes, 0) /
        Math.max(1, capacityMinutes),
    );
    const snapshot: TrustAwareQueueHealthSnapshot = {
      queueHealthSnapshotId: `qhs_437_${queueBasisHash.slice(0, 16)}`,
      queueCode,
      depth: activeItems.length,
      medianAge: percentile(ages, 0.5),
      p95Age: percentile(ages, 0.95),
      arrivalRate: ((accumulator.arrivalsByQueue.get(queueCode) ?? 0) / duration) * 60,
      clearRate: ((accumulator.clearsByQueue.get(queueCode) ?? 0) / duration) * 60,
      utilization,
      aggregateBreachProbability,
      breachRiskCount: riskRecords.filter(
        (record) => record.predictedProbability >= policy.breachRiskProbabilityThreshold,
      ).length,
      escalationCount: accumulator.escalationsByQueue.get(queueCode) ?? 0,
      anomalyState:
        aggregateBreachProbability >= 0.8
          ? "critical"
          : aggregateBreachProbability >= 0.5
            ? "elevated"
            : aggregateBreachProbability >= 0.25
              ? "watch"
              : "normal",
      capturedAt: input.window.capturedAt,
      queueSnapshotHash: queueBasisHash,
      sourceWindowHash: normalized.sourceWindowHash,
      sourceEventRefs,
      trustState: trustContext.trustState,
      completenessState: trustContext.completenessState,
      projectionHealthRef: `phs-pending:${queueBasisHash.slice(0, 12)}`,
      graphVerdictRef: trustContext.graphVerdictRef,
    };
    allQueueSnapshots.push(snapshot);
    allRisks.push(...riskRecords);
    allExplanations.push(...explanations);
  }
  return [
    allQueueSnapshots.sort((left, right) => left.queueCode.localeCompare(right.queueCode)),
    allRisks.sort((left, right) => left.breachRiskRecordId.localeCompare(right.breachRiskRecordId)),
    allExplanations.sort((left, right) =>
      left.explanationVectorRef.localeCompare(right.explanationVectorRef),
    ),
  ] as const;
}

function resultHashBasis(
  input: Phase9OperationalProjectionInput,
  normalized: NormalizedEventSet,
  queueSnapshots: readonly TrustAwareQueueHealthSnapshot[],
  risks: readonly BreachRiskRecord[],
  dependencies: readonly DependencyHealthRecord[],
  anomalies: readonly MetricAnomalySnapshot[],
  equity: readonly EquitySliceMetric[],
  continuity: readonly ContinuityControlHealthProjection[],
): unknown {
  return {
    tenantId: input.window.tenantId,
    window: input.window,
    replay: {
      acceptedEventRefs: normalized.acceptedEvents.map((event) => event.eventId),
      duplicateEventRefs: normalized.duplicateEventRefs,
      lateEventRefs: normalized.lateEventRefs,
      sourceWindowHash: normalized.sourceWindowHash,
    },
    queueSnapshots,
    risks,
    dependencies,
    anomalies,
    equity,
    continuity,
  };
}

export function projectPhase9OperationalWindow(
  input: Phase9OperationalProjectionInput,
): Phase9OperationalProjectionResult {
  const adapters = input.adapters ?? getDefaultOperationalProjectionEventAdapters();
  const adapterErrors = validateOperationalProjectionEventAdapters(adapters);
  invariant(adapterErrors.length === 0, "EVENT_ADAPTER_COVERAGE_INVALID", adapterErrors.join("; "));
  const policy: OperationalProjectionPolicy = {
    ...defaultOperationalProjectionPolicy,
    ...input.policy,
  };
  const normalized = normalizeEvents(input, adapters, policy);
  const trustContext = deriveProjectionTrustContext(input, normalized, adapters, policy);
  const dependencyHealthRecords = buildDependencyHealthRecords(
    normalized.acceptedEvents,
    input,
    policy,
  );
  const [rawQueueSnapshots, breachRiskRecords, breachRiskExplanationVectors] = buildQueueOutputs(
    input,
    normalized,
    policy,
    trustContext,
    dependencyHealthRecords,
  );
  const metricAnomalySnapshots = buildMetricAnomalies(
    rawQueueSnapshots,
    normalized.acceptedEvents,
    input,
    policy,
  );
  const equitySliceMetrics = buildEquitySliceMetrics(normalized.acceptedEvents, input, policy);
  const continuityControlHealthProjections = buildContinuityControlHealthProjections(
    normalized.acceptedEvents,
    input,
    trustContext,
    policy,
  );
  const hashBasis = resultHashBasis(
    input,
    normalized,
    rawQueueSnapshots,
    breachRiskRecords,
    dependencyHealthRecords,
    metricAnomalySnapshots,
    equitySliceMetrics,
    continuityControlHealthProjections,
  );
  const snapshotHash = projectionHash(hashBasis, "phase9.operational-projection.result");
  const projectionHealthSnapshot = buildProjectionHealthSnapshot(
    input,
    normalized,
    adapters,
    trustContext,
    snapshotHash,
    hashBasis,
  );
  const queueHealthSnapshots = rawQueueSnapshots.map((snapshot) => ({
    ...snapshot,
    projectionHealthRef: projectionHealthSnapshot.projectionHealthSnapshotId,
  }));
  const opsOverviewContextFrame = buildContextFrame(
    input,
    projectionHealthSnapshot,
    queueHealthSnapshots,
  );
  const opsOverviewSliceEnvelopes = buildSliceEnvelopes(
    input,
    opsOverviewContextFrame,
    trustContext,
  );
  const liveBoardDeltaWindow: LiveBoardDeltaWindow = {
    deltaWindowId: `lbdw_437_${projectionHash(
      {
        boardTupleHash: opsOverviewContextFrame.boardTupleHash,
        lateEventRefs: normalized.lateEventRefs,
      },
      "phase9.operational-projection.live-delta-window.id",
    ).slice(0, 16)}`,
    contextFrameRef: opsOverviewContextFrame.contextFrameId,
    baseBoardTupleHash: opsOverviewContextFrame.boardTupleHash,
    selectionLeaseRefs: opsOverviewContextFrame.activeSelectionLeaseRefs,
    pauseStartedAt: input.window.capturedAt,
    queuedDeltaRefs: normalized.lateEventRefs.map((eventRef) => `delta:late:${eventRef}`),
    queuedTupleDriftRefs:
      trustContext.completenessState === "blocked"
        ? [`tuple-drift:${trustContext.graphVerdictRef}`]
        : [],
    materialChangeCount:
      normalized.lateEventRefs.length +
      breachRiskRecords.filter((risk) => risk.predictedProbability >= 0.5).length,
    resumeStrategy: "apply_in_place",
    resumeCheckpointRef: `checkpoint:${projectionHealthSnapshot.rebuildHash.slice(0, 16)}`,
  };
  const finalizedLiveBoardDeltaWindow: LiveBoardDeltaWindow = {
    ...liveBoardDeltaWindow,
    resumeStrategy: deriveLiveBoardResumeStrategy(liveBoardDeltaWindow),
  };
  const dashboardTiles = buildDashboardTiles(
    input,
    queueHealthSnapshots,
    opsOverviewSliceEnvelopes,
    projectionHealthSnapshot,
    trustContext,
    breachRiskRecords,
  );
  return {
    schemaVersion: PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION,
    contractVersion: PHASE9_OPERATIONAL_CONTRACT_VERSION,
    tenantId: input.window.tenantId,
    window: input.window,
    replay: {
      replayWatermark: projectionHealthSnapshot.rebuildHash,
      acceptedEventRefs: normalized.acceptedEvents.map((event) => event.eventId),
      duplicateEventRefs: normalized.duplicateEventRefs,
      lateEventRefs: normalized.lateEventRefs,
      correctionState:
        normalized.lateEventRefs.length === 0
          ? "none"
          : normalized.lateEventRefs.length > 1
            ? "rebuild_required"
            : "late_event_correction",
      sourceWindowHash: normalized.sourceWindowHash,
    },
    queueHealthSnapshots,
    breachRiskRecords,
    breachRiskExplanationVectors,
    dependencyHealthRecords,
    metricAnomalySnapshots,
    equitySliceMetrics,
    continuityControlHealthProjections,
    projectionHealthSnapshot,
    opsOverviewContextFrame,
    opsOverviewSliceEnvelopes,
    liveBoardDeltaWindow: finalizedLiveBoardDeltaWindow,
    dashboardTiles,
    snapshotHash,
  };
}

export class Phase9OperationalProjectionEngine {
  private readonly resultsBySnapshotHash = new Map<string, Phase9OperationalProjectionResult>();

  project(input: Phase9OperationalProjectionInput): Phase9OperationalProjectionResult {
    const result = projectPhase9OperationalWindow(input);
    this.resultsBySnapshotHash.set(result.snapshotHash, result);
    return result;
  }

  replay(input: Phase9OperationalProjectionInput): Phase9OperationalProjectionResult {
    return projectPhase9OperationalWindow(input);
  }

  fetchProjectionBySnapshotHash(
    snapshotHash: string,
  ): Phase9OperationalProjectionResult | undefined {
    return this.resultsBySnapshotHash.get(snapshotHash);
  }

  assertTenantPartition(input: Phase9OperationalProjectionInput): void {
    const crossTenant = input.events.filter((event) => event.tenantId !== input.window.tenantId);
    invariant(
      crossTenant.length === 0,
      "CROSS_TENANT_AGGREGATION_DENIED",
      crossTenant.map((event) => event.eventId).join(","),
    );
  }
}

function trustRecord(
  sliceRef: string,
  generatedAt: string,
  overrides: Partial<AssuranceSliceTrustRecord> = {},
): AssuranceSliceTrustRecord {
  return {
    assuranceSliceTrustRecordId: `astr_437_${projectionHash(
      { sliceRef, generatedAt },
      "phase9.operational-projection.fixture.trust.id",
    ).slice(0, 16)}`,
    sliceRef,
    scopeRef: "tenant:demo-gp",
    audienceTier: "operations",
    trustState: "trusted",
    completenessState: "complete",
    trustScore: 0.94,
    trustLowerBound: 0.9,
    freshnessScore: 0.95,
    coverageScore: 0.96,
    lineageScore: 0.97,
    replayScore: 1,
    consistencyScore: 0.95,
    hardBlockState: false,
    blockingProducerRefs: [],
    blockingNamespaceRefs: [],
    evaluationModelRef: PHASE9_ASSURANCE_TRUST_EVALUATION_MODEL,
    evaluationInputHash: projectionHash(
      { sliceRef, generatedAt },
      "phase9.operational-projection.fixture.trust.input",
    ),
    lastEvaluatedAt: generatedAt,
    ...overrides,
  };
}

function graphCompletenessVerdict(
  state: Phase9GraphVerdictState,
  generatedAt: string,
): Phase9GraphVerdictRecord {
  const graphHash = projectionHash(
    { graph: "fixture", generatedAt },
    "phase9.operational.fixture.graph",
  );
  const contractVerdictState: AssuranceGraphCompletenessVerdict["verdictState"] =
    state === "blocked" ? "blocked" : state === "stale" ? "stale" : "complete";
  const contractVerdict: AssuranceGraphCompletenessVerdict = {
    assuranceGraphCompletenessVerdictId: `agcv_437_${graphHash.slice(0, 16)}`,
    graphSnapshotRef: "aegs_437_fixture",
    scopeRef: "tenant:demo-gp",
    requiredNodeRefs: ["ledger:ops", "artifact:continuity", "control:ops-dashboard"],
    missingNodeRefs: state === "blocked" ? ["artifact:continuity"] : [],
    orphanNodeRefs: [],
    missingEdgeRefs: state === "blocked" ? ["edge:continuity"] : [],
    supersessionConflictRefs: [],
    crossScopeConflictRefs: [],
    requiredPackRefs: [],
    requiredRetentionRefs: [],
    blockedExportRefs: [],
    verdictState: contractVerdictState,
    decisionHash: projectionHash(
      { graphHash, state },
      "phase9.operational.fixture.graph.contract-verdict",
    ),
    evaluatedAt: generatedAt,
  };
  const payload = {
    graphHash,
    context: "operational_dashboard" as Phase9GraphConsumerContext,
    scopeRef: "tenant:demo-gp",
    state,
    decisionHash: contractVerdict.decisionHash,
  };
  const verdictHash = projectionHash(payload, "phase9.operational.fixture.graph-verdict");
  return {
    verdictId: `agve_437_${verdictHash.slice(0, 16)}`,
    graphSnapshotRef: "aegs_437_fixture",
    graphHash,
    context: "operational_dashboard",
    scopeRef: "tenant:demo-gp",
    state,
    contractVerdict,
    evaluatedRequirements: ["current-graph", "slice-trust", "continuity-evidence"],
    passedRequirements:
      state === "complete" ? ["current-graph", "slice-trust", "continuity-evidence"] : [],
    failedRequirements: state === "complete" ? [] : ["current-graph"],
    orphanEdgeRefs: [],
    missingEdgeRefs: state === "blocked" ? ["edge:continuity"] : [],
    staleEvidenceRefs: state === "stale" ? ["artifact:continuity"] : [],
    contradictionRefs: [],
    visibilityGapRefs: [],
    trustBlockingRefs: [],
    reasonCodes:
      state === "blocked" ? ["MISSING_REQUIRED_EDGE"] : state === "stale" ? ["STALE_EVIDENCE"] : [],
    watermarks: {
      graphWatermark: graphHash,
      requiredLedgerWatermark: graphHash,
    },
    traversal: {
      visitedRefs: ["ledger:ops", "artifact:continuity", "control:ops-dashboard"],
      cycleRefs: [],
      maxDepthReached: false,
    },
    generatedAt,
    evaluatorVersion: "436.phase9.graph-verdict-engine.v1",
    policyHash: projectionHash({ policy: "fixture" }, "phase9.operational.fixture.graph.policy"),
    verdictHash,
  };
}

function baseEvent(
  eventId: string,
  eventFamily: OperationalProjectionEventFamily,
  eventType: OperationalProjectionEventType,
  occurredAt: string,
  overrides: Partial<OperationalProjectionEvent> = {},
): OperationalProjectionEvent {
  return {
    eventId,
    eventFamily,
    eventType,
    tenantId: "tenant:demo-gp",
    entityRef: overrides.entityRef ?? `entity:${eventId}`,
    sourceRef: overrides.sourceRef ?? `source:${eventFamily}:${eventId}`,
    sourceProjectionRef: overrides.sourceProjectionRef ?? `projection:${eventFamily}`,
    sourceTrustRef: overrides.sourceTrustRef ?? `trust:${eventFamily}`,
    occurredAt,
    recordedAt: overrides.recordedAt ?? occurredAt,
    orderingKey: overrides.orderingKey ?? `${occurredAt}:${eventId}`,
    dedupeKey: overrides.dedupeKey ?? `dedupe:${eventId}`,
    sequence: overrides.sequence ?? Number(eventId.match(/(\d+)$/)?.[1] ?? "1"),
    ...overrides,
  };
}

function continuityEvent(
  controlCode: ContinuityControlCode,
  index: number,
  generatedAt: string,
): OperationalProjectionEvent {
  const tupleHash = projectionHash(
    { controlCode, index },
    "phase9.operational.fixture.continuity.tuple",
  );
  return baseEvent(
    `evt-437-continuity-${index.toString().padStart(2, "0")}`,
    controlCode === "support_replay_restore"
      ? "support_replay_investigation"
      : "patient_navigation_continuity",
    controlCode === "support_replay_restore" ? "continuity_restore" : "continuity_settlement",
    generatedAt,
    {
      entityRef: `continuity:${controlCode}:entity`,
      continuityControlCode: controlCode,
      settlementOrRestoreRef: `settlement:${controlCode}:437`,
      returnOrContinuationRef: `return:${controlCode}:437`,
      experienceContinuityEvidenceRef: `ecce_437_${controlCode}`,
      continuityTupleHash: tupleHash,
      continuitySetHash: projectionHash(
        { controlCode, tupleHash },
        "phase9.operational.fixture.continuity.set",
      ),
      routeContinuityEvidenceContractRef: `route-continuity:${controlCode}:v1`,
      producerFamilyRef: `producer:${controlCode}`,
      sequence: 200 + index,
    },
  );
}

export function createPhase9OperationalProjectionEngineFixture(): Phase9OperationalProjectionEngineFixture {
  const generatedAt = "2026-04-27T09:10:00.000Z";
  const window: OperationalProjectionWindow = {
    tenantId: "tenant:demo-gp",
    scopeRef: "tenant:demo-gp",
    windowStart: "2026-04-27T08:00:00.000Z",
    windowEnd: "2026-04-27T09:10:00.000Z",
    capturedAt: generatedAt,
    timeHorizonRef: "ops:last-70m",
    filterDigest: projectionHash(
      { filter: "all-essential-functions" },
      "phase9.operational.fixture.filter",
    ),
  };
  const baselineTrustRecords = [
    trustRecord("slice:ops-overview", generatedAt),
    ...OPERATIONAL_CONTINUITY_CONTROL_CODES.map((controlCode) =>
      trustRecord(`slice:${controlCode}`, generatedAt),
    ),
  ];
  const baselineGraphVerdict = graphCompletenessVerdict("complete", generatedAt);
  const operationalFixture = createPhase9OperationalProjectionFixture();
  const baselineEvents: OperationalProjectionEvent[] = [
    baseEvent("evt-437-001", "request_intake", "arrived", "2026-04-27T08:05:00.000Z", {
      entityRef: "request:intake:001",
      entityType: "request",
      queueCode: "request_intake",
      targetWindowCloseAt: "2026-04-27T09:30:00.000Z",
      workloadMinutes: 9,
      severity: "medium",
      supportingMetricRefs: ["omd_433_request_intake_health"],
    }),
    baseEvent("evt-437-002", "triage_queue", "arrived", "2026-04-27T08:10:00.000Z", {
      entityRef: "triage-task:001",
      entityType: "triage_task",
      queueCode: "triage_queue",
      targetWindowCloseAt: "2026-04-27T09:35:00.000Z",
      workloadMinutes: 22,
      serviceMeanMinutes: 12,
      serviceVarianceMinutesSquared: 16,
      severity: "high",
      calibrationEffectiveSampleSize: 180,
      supportingMetricRefs: ["omd_433_triage_queue_health", "omd_433_dependency_health"],
    }),
    baseEvent("evt-437-003", "triage_queue", "arrived", "2026-04-27T08:18:00.000Z", {
      entityRef: "triage-task:002",
      entityType: "triage_task",
      queueCode: "triage_queue",
      targetWindowCloseAt: "2026-04-27T10:00:00.000Z",
      workloadMinutes: 12,
      severity: "medium",
      calibrationEffectiveSampleSize: 180,
      supportingMetricRefs: ["omd_433_triage_queue_health"],
    }),
    baseEvent("evt-437-004", "triage_queue", "escalated", "2026-04-27T08:45:00.000Z", {
      entityRef: "triage-task:001",
      entityType: "triage_task",
      queueCode: "triage_queue",
      targetWindowCloseAt: "2026-04-27T09:35:00.000Z",
      workloadMinutes: 22,
      severity: "high",
    }),
    baseEvent("evt-437-005", "more_info_loop", "arrived", "2026-04-27T08:22:00.000Z", {
      entityRef: "more-info:001",
      entityType: "more_info_request",
      queueCode: "more_info_loop",
      targetWindowCloseAt: "2026-04-27T11:00:00.000Z",
      workloadMinutes: 16,
      severity: "medium",
    }),
    baseEvent("evt-437-006", "booking_search_commit", "arrived", "2026-04-27T08:25:00.000Z", {
      entityRef: "booking:commit:001",
      entityType: "booking_commit",
      queueCode: "booking_commit",
      targetWindowCloseAt: "2026-04-27T09:50:00.000Z",
      workloadMinutes: 18,
      severity: "medium",
    }),
    baseEvent("evt-437-007", "booking_search_commit", "cleared", "2026-04-27T08:50:00.000Z", {
      entityRef: "booking:commit:cleared",
      entityType: "booking_commit",
      queueCode: "booking_commit",
    }),
    baseEvent(
      "evt-437-008",
      "waitlist_movement",
      "metric_observation",
      "2026-04-27T08:55:00.000Z",
      {
        metricCode: "waitlist_conversion",
        observedValue: 0.62,
        expectedValue: 0.68,
        sigmaHat: 0.05,
        support: 88,
        equitySliceDefinition: "postcode_decile:3",
        equitySampleSize: 88,
        equityVarianceMagnitude: 0.09,
      },
    ),
    baseEvent("evt-437-009", "hub_coordination", "dependency_state", "2026-04-27T08:58:00.000Z", {
      dependencyCode: "nhs_external_integration",
      dependencyLatencyMs: 420,
      dependencyError: false,
      dependencyTimeout: false,
      dependencyFallbackState: "available",
      dependencyDelayMeanMinutes: 4,
      dependencyDelayVarianceMinutesSquared: 4,
    }),
    baseEvent(
      "evt-437-010",
      "pharmacy_dispatch_outcome",
      "dependency_state",
      "2026-04-27T08:59:00.000Z",
      {
        dependencyCode: "pharmacy_inbox_outbox",
        dependencyLatencyMs: 900,
        dependencyError: false,
        dependencyTimeout: false,
        dependencyFallbackState: "available",
        dependencyDelayMeanMinutes: 6,
        dependencyDelayVarianceMinutesSquared: 9,
      },
    ),
    baseEvent(
      "evt-437-011",
      "communications_delivery_receipt",
      "dependency_state",
      "2026-04-27T09:00:00.000Z",
      {
        dependencyCode: "messaging_notification_transport",
        dependencyLatencyMs: 240,
        dependencyError: false,
        dependencyTimeout: false,
        dependencyFallbackState: "available",
        dependencyDelayMeanMinutes: 2,
        dependencyDelayVarianceMinutesSquared: 1,
      },
    ),
    baseEvent(
      "evt-437-012",
      "assistive_session_trust_continuity",
      "trust_record",
      "2026-04-27T09:02:00.000Z",
      {
        trustRecord: baselineTrustRecords[0],
      },
    ),
    baseEvent(
      "evt-437-013",
      "assurance_graph_slice_trust",
      "graph_verdict",
      "2026-04-27T09:03:00.000Z",
      {
        graphVerdict: baselineGraphVerdict,
      },
    ),
    baseEvent(
      "evt-437-014",
      "communications_delivery_receipt",
      "metric_observation",
      "2026-04-27T09:04:00.000Z",
      {
        metricCode: "patient_message_delivery",
        observedValue: 0.97,
        expectedValue: 0.98,
        sigmaHat: 0.02,
        support: 145,
      },
    ),
    ...OPERATIONAL_CONTINUITY_CONTROL_CODES.map((controlCode, index) =>
      continuityEvent(controlCode, index + 1, "2026-04-27T09:05:00.000Z"),
    ),
  ];
  const engine = new Phase9OperationalProjectionEngine();
  const baselineInput: Phase9OperationalProjectionInput = {
    events: baselineEvents,
    window,
    trustRecords: baselineTrustRecords,
    graphVerdict: baselineGraphVerdict,
  };
  const baselineResult = engine.project(baselineInput);
  const lateCorrectionResult = engine.replay({
    ...baselineInput,
    events: [
      ...baselineEvents,
      baseEvent("evt-437-late-001", "triage_queue", "arrived", "2026-04-27T07:58:00.000Z", {
        recordedAt: "2026-04-27T09:08:00.000Z",
        entityRef: "triage-task:late",
        entityType: "triage_task",
        queueCode: "triage_queue",
        targetWindowCloseAt: "2026-04-27T09:20:00.000Z",
        workloadMinutes: 14,
        severity: "high",
        calibrationEffectiveSampleSize: 120,
      }),
    ],
  });
  const duplicateResult = engine.replay({
    ...baselineInput,
    events: [
      ...baselineEvents,
      {
        ...baselineEvents[0]!,
        eventId: "evt-437-duplicate-001",
      },
    ],
  });
  const lowSupportResult = engine.replay({
    ...baselineInput,
    events: [
      ...baselineEvents.filter((event) => event.eventId !== "evt-437-002"),
      baseEvent("evt-437-low-support-001", "triage_queue", "arrived", "2026-04-27T08:10:00.000Z", {
        entityRef: "triage-task:low-support",
        entityType: "triage_task",
        queueCode: "triage_queue",
        targetWindowCloseAt: "2026-04-27T09:35:00.000Z",
        workloadMinutes: 22,
        severity: "high",
        calibrationEffectiveSampleSize: 6,
        supportingMetricRefs: ["omd_433_triage_queue_health", "omd_433_dependency_health"],
      }),
    ],
  });
  const staleTrustRecords = [
    trustRecord("slice:ops-overview", "2026-04-25T09:00:00.000Z", {
      trustState: "degraded",
      completenessState: "partial",
      trustLowerBound: 0.72,
      lastEvaluatedAt: "2026-04-25T09:00:00.000Z",
    }),
  ];
  const staleTrustResult = engine.replay({
    ...baselineInput,
    trustRecords: staleTrustRecords,
    graphVerdict: graphCompletenessVerdict("stale", generatedAt),
  });
  const replayed = engine.replay(baselineInput);
  return {
    schemaVersion: PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION,
    generatedAt,
    sourceAlgorithmRefs: [
      "blueprint/phase-9-the-assurance-ledger.md#9A",
      "blueprint/phase-9-the-assurance-ledger.md#9B",
      "data/contracts/432_phase9_assurance_ledger_contracts.json",
      "data/contracts/433_phase9_operational_projection_contracts.json",
      "data/contracts/436_phase9_graph_verdict_engine_contract.json",
    ],
    eventAdapters: getDefaultOperationalProjectionEventAdapters(),
    baselineEvents,
    baselineGraphVerdict,
    baselineTrustRecords,
    baselineResult,
    lateCorrectionResult,
    duplicateResult,
    lowSupportResult,
    staleTrustResult,
    replayHash: orderedSetHash(
      [
        operationalFixture.contractSetHash,
        baselineResult.snapshotHash,
        replayed.snapshotHash,
        PHASE9_ASSURANCE_REPLAY_DETERMINISM_VERSION,
      ],
      "phase9.operational-projection.fixture.replay-hash",
    ),
  };
}

export function phase9OperationalProjectionEngineSummary(
  fixture: Phase9OperationalProjectionEngineFixture = createPhase9OperationalProjectionEngineFixture(),
): string {
  return [
    "# 437 Phase 9 Operational Projection Engine",
    "",
    `Schema version: ${fixture.schemaVersion}`,
    `Generated at: ${fixture.generatedAt}`,
    `Adapter count: ${fixture.eventAdapters.length}`,
    `Baseline snapshot hash: ${fixture.baselineResult.snapshotHash}`,
    `Replay hash: ${fixture.replayHash}`,
    `Queue snapshots: ${fixture.baselineResult.queueHealthSnapshots.length}`,
    `Breach risk records: ${fixture.baselineResult.breachRiskRecords.length}`,
    `Continuity controls: ${fixture.baselineResult.continuityControlHealthProjections.length}`,
    "",
    "## Control Posture",
    "",
    "- Event adapters declare family, required fields, ordering key, dedupe key, tenant scope, timestamp semantics, late-event handling, and source-trust dependency.",
    "- Queue health is derived from authoritative events and carries source window hash, trust state, completeness state, and projection health refs.",
    "- Breach risk composes the frozen task 433 Gamma/Wilson formula and records explanation vectors with slack, workload, capacity, dependency delay, confidence, and stable rank.",
    "- Dashboard DTOs fail closed through the frozen OpsOverviewSliceEnvelope render posture and DashboardMetricTileContract boundary.",
    "- Late and duplicate events are explicit replay facts; duplicates do not double-count and late events queue correction or rebuild.",
    "",
  ].join("\n");
}

export function phase9OperationalProjectionEventAdapterMatrixCsv(
  adapters: readonly OperationalProjectionEventAdapter[] = getDefaultOperationalProjectionEventAdapters(),
): string {
  const rows = [
    [
      "eventFamily",
      "sourceProjection",
      "requiredFields",
      "orderingKey",
      "dedupeKey",
      "tenantScope",
      "timestampSemantics",
      "lateEventHandling",
      "sourceTrustDependency",
    ],
    ...adapters.map((adapter) => [
      adapter.eventFamily,
      adapter.sourceProjection,
      adapter.requiredFields.join("|"),
      adapter.orderingKey,
      adapter.dedupeKey,
      adapter.tenantScope,
      adapter.timestampSemantics,
      adapter.lateEventHandling,
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
