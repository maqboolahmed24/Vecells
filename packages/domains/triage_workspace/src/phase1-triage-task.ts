import { createHash } from "node:crypto";
import {
  createDeterministicBackboneIdGenerator,
  RequestBackboneInvariantError,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
  }
}

function requireRef(value: string | null | undefined, field: string): string {
  invariant(
    typeof value === "string" && value.trim().length > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} is required.`,
  );
  return value.trim();
}

function optionalRef(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}_TIMESTAMP`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function ensureNonNegativeNumber(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative finite number.`,
  );
  return value;
}

function ensureUnitInterval(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value >= 0 && value <= 1,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be between 0 and 1 inclusive.`,
  );
  return value;
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function sha256Hex(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function roundMetric(value: number): number {
  return Number(value.toFixed(6));
}

function quantile(sortedValues: readonly number[], percentile: number): number {
  invariant(sortedValues.length > 0, "QUANTILE_INPUT_EMPTY", "Quantile input may not be empty.");
  if (sortedValues.length === 1) {
    return sortedValues[0] ?? 0;
  }
  const clamped = Math.min(1, Math.max(0, percentile));
  const index = clamped * (sortedValues.length - 1);
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  const lower = sortedValues[lowerIndex] ?? sortedValues[0] ?? 0;
  const upper = sortedValues[upperIndex] ?? sortedValues[sortedValues.length - 1] ?? lower;
  if (lowerIndex === upperIndex) {
    return lower;
  }
  return lower + (upper - lower) * (index - lowerIndex);
}

function weightedQuantile(
  values: readonly number[],
  weights: readonly number[],
  percentile: number,
): number {
  invariant(
    values.length === weights.length && values.length > 0,
    "WEIGHTED_QUANTILE_INPUT_INVALID",
    "Weighted quantile requires one positive weight per value.",
  );
  const pairs = values
    .map((value, index) => ({ value, weight: Math.max(0, weights[index] ?? 0) }))
    .sort((left, right) => left.value - right.value);
  const totalWeight = pairs.reduce((sum, pair) => sum + pair.weight, 0);
  if (totalWeight <= 0) {
    return pairs[pairs.length - 1]?.value ?? 0;
  }
  const target = Math.min(1, Math.max(0, percentile)) * totalWeight;
  let cumulative = 0;
  for (const pair of pairs) {
    cumulative += pair.weight;
    if (cumulative >= target) {
      return pair.value;
    }
  }
  return pairs[pairs.length - 1]?.value ?? 0;
}

function bucketOrder(bucket: PatientReceiptBucket): number {
  switch (bucket) {
    case "same_day":
      return 0;
    case "next_working_day":
      return 1;
    case "within_2_working_days":
      return 2;
    case "after_2_working_days":
      return 3;
  }
}

function compareBuckets(left: PatientReceiptBucket, right: PatientReceiptBucket): number {
  return bucketOrder(left) - bucketOrder(right);
}

function nextTriageId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function createDeterministicRandom(seed: string): () => number {
  let state = Number.parseInt(sha256Hex(seed).slice(0, 8), 16);
  if (!Number.isFinite(state) || state === 0) {
    state = 0x6d2b79f5;
  }
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleArray(values: readonly number[], random: () => number): number {
  invariant(values.length > 0, "SAMPLE_ARRAY_EMPTY", "Cannot sample an empty array.");
  const index = Math.min(values.length - 1, Math.floor(random() * values.length));
  return values[index] ?? values[values.length - 1] ?? 0;
}

export type Phase1TriageServiceBand = "symptoms" | "medication" | "admin" | "results";

export type Phase1ResidualReviewState = "routine_review" | "residual_review";

export type Phase1TriageTaskState =
  | "queued"
  | "claimed"
  | "awaiting_patient"
  | "completed"
  | "urgent_handoff";

export type Phase1TelemetryFreshnessState = "fresh" | "at_risk" | "stale";

export type Phase1TelemetryCoverageState = "complete" | "thin" | "insufficient";

export type Phase1EtaHysteresisDecision =
  | "initial_issue"
  | "held_prior_bucket"
  | "confirmed_improvement"
  | "material_improvement"
  | "revised_downward"
  | "frozen_at_risk"
  | "recovery_required";

export type PatientReceiptBucket =
  | "same_day"
  | "next_working_day"
  | "within_2_working_days"
  | "after_2_working_days";

export type PatientReceiptPromiseState =
  | "on_track"
  | "improved"
  | "at_risk"
  | "revised_downward"
  | "recovery_required";

export type Phase1PatientMacroState =
  | "received"
  | "in_review"
  | "we_need_you"
  | "completed"
  | "urgent_action";

export interface Phase1WorkingSchedule {
  readonly scheduleRef: string;
  readonly timezone: string;
  readonly workingWeekdays: readonly number[];
  readonly startHour: number;
  readonly endHour: number;
}

export interface Phase1ServiceBandPrior {
  readonly serviceBandRef: Phase1TriageServiceBand;
  readonly localHandlingMinutes: readonly number[];
  readonly globalHandlingMinutes: readonly number[];
  readonly localResidualsWorkingMinutes: readonly number[];
  readonly globalResidualsWorkingMinutes: readonly number[];
}

export interface Phase1BucketCalibrationPoint {
  rawProbability: number;
  calibratedProbability: number;
}

export interface Phase1EtaBucketCalibrator {
  readonly bucket: PatientReceiptBucket;
  readonly points: readonly Phase1BucketCalibrationPoint[];
}

export interface Phase1EtaPolicyFixture {
  readonly policyVersionRef: string;
  readonly calibrationVersionRef: string;
  readonly etaPromiseRef: string;
  readonly hysteresisPolicyRef: string;
  readonly schemaResolutionRef: string;
  readonly workingSchedule: Phase1WorkingSchedule;
  readonly sameDayThresholdProbability: number;
  readonly hysteresisMargin: number;
  readonly materialImprovementWorkingMinutes: number;
  readonly kappaShrink: number;
  readonly capacityDistribution: readonly number[];
  readonly capacityFloor: number;
  readonly capacityMax: number;
  readonly tenantBufferWorkingMinutes: number;
  readonly drawCount: number;
  readonly localCalibrationFloor: number;
  readonly serviceBandPriors: readonly Phase1ServiceBandPrior[];
  readonly bucketCalibrators: readonly Phase1EtaBucketCalibrator[];
}

export const phase1TriageTaskSchemaResolutionRef =
  "GAP_RESOLVED_TRIAGE_TASK_PHASE1_SCHEMA_V1";
export const phase1EtaCalibrationVersionRef = "ETA_152_BUCKET_CALIBRATOR_V1";
export const phase1EtaPromiseRef = "ETA_152_CONSERVATIVE_QUEUE_BUCKET_V1";
export const phase1TriageHysteresisPolicyRef = "ETA_152_HYSTERESIS_POLICY_V1";
export const phase1PatientStatusMappingRef = "STATUS_152_PHASE1_MINIMAL_PATIENT_MAPPING_V1";
export const phase1WorkingScheduleRef = "WORKING_HOURS_152_WEEKDAY_0900_1700_EUROPE_LONDON_V1";

export const defaultPhase1EtaPolicyFixture: Phase1EtaPolicyFixture = {
  policyVersionRef: "PHASE1_TRIAGE_ETA_POLICY_V1",
  calibrationVersionRef: phase1EtaCalibrationVersionRef,
  etaPromiseRef: phase1EtaPromiseRef,
  hysteresisPolicyRef: phase1TriageHysteresisPolicyRef,
  schemaResolutionRef: phase1TriageTaskSchemaResolutionRef,
  workingSchedule: {
    scheduleRef: phase1WorkingScheduleRef,
    timezone: "Europe/London",
    workingWeekdays: [1, 2, 3, 4, 5],
    startHour: 9,
    endHour: 17,
  },
  sameDayThresholdProbability: 0.74,
  hysteresisMargin: 0.08,
  materialImprovementWorkingMinutes: 300,
  kappaShrink: 6,
  capacityDistribution: [0.62, 0.74, 0.83, 0.92],
  capacityFloor: 0.58,
  capacityMax: 0.96,
  tenantBufferWorkingMinutes: 18,
  drawCount: 96,
  localCalibrationFloor: 4,
  serviceBandPriors: [
    {
      serviceBandRef: "symptoms",
      localHandlingMinutes: [22, 26, 31, 35, 40],
      globalHandlingMinutes: [25, 30, 36, 42, 48],
      localResidualsWorkingMinutes: [20, 26, 34, 40, 48, 58],
      globalResidualsWorkingMinutes: [28, 36, 44, 54, 66],
    },
    {
      serviceBandRef: "medication",
      localHandlingMinutes: [16, 20, 25, 29, 33],
      globalHandlingMinutes: [19, 24, 28, 33, 38],
      localResidualsWorkingMinutes: [18, 24, 30, 36, 44],
      globalResidualsWorkingMinutes: [24, 30, 36, 44, 52],
    },
    {
      serviceBandRef: "admin",
      localHandlingMinutes: [10, 14, 18, 21, 24],
      globalHandlingMinutes: [12, 16, 20, 24, 28],
      localResidualsWorkingMinutes: [16, 20, 24, 30, 36],
      globalResidualsWorkingMinutes: [20, 24, 30, 36, 42],
    },
    {
      serviceBandRef: "results",
      localHandlingMinutes: [14, 18, 23, 27, 31],
      globalHandlingMinutes: [16, 21, 26, 31, 36],
      localResidualsWorkingMinutes: [18, 24, 30, 38, 46],
      globalResidualsWorkingMinutes: [24, 30, 36, 44, 54],
    },
  ],
  bucketCalibrators: [
    {
      bucket: "same_day",
      points: [
        { rawProbability: 0, calibratedProbability: 0 },
        { rawProbability: 0.5, calibratedProbability: 0.38 },
        { rawProbability: 0.7, calibratedProbability: 0.6 },
        { rawProbability: 0.85, calibratedProbability: 0.8 },
        { rawProbability: 1, calibratedProbability: 0.96 },
      ],
    },
    {
      bucket: "next_working_day",
      points: [
        { rawProbability: 0, calibratedProbability: 0 },
        { rawProbability: 0.4, calibratedProbability: 0.34 },
        { rawProbability: 0.65, calibratedProbability: 0.58 },
        { rawProbability: 0.82, calibratedProbability: 0.76 },
        { rawProbability: 1, calibratedProbability: 0.98 },
      ],
    },
    {
      bucket: "within_2_working_days",
      points: [
        { rawProbability: 0, calibratedProbability: 0 },
        { rawProbability: 0.35, calibratedProbability: 0.31 },
        { rawProbability: 0.6, calibratedProbability: 0.55 },
        { rawProbability: 0.8, calibratedProbability: 0.75 },
        { rawProbability: 1, calibratedProbability: 0.99 },
      ],
    },
    {
      bucket: "after_2_working_days",
      points: [
        { rawProbability: 0, calibratedProbability: 0 },
        { rawProbability: 1, calibratedProbability: 1 },
      ],
    },
  ],
};

export interface PreviousReceiptEnvelopeSummary {
  readonly receiptBucket: PatientReceiptBucket;
  readonly promiseState: PatientReceiptPromiseState;
  readonly etaLowerBoundAt: string | null;
  readonly etaMedianAt: string | null;
  readonly etaUpperBoundAt: string | null;
  readonly bucketConfidence: number;
  readonly monotoneRevision: number;
}

export interface Phase1TriageTaskSnapshot {
  triageTaskSchemaVersion: "PHASE1_TRIAGE_TASK_V1";
  triageTaskId: string;
  requestRef: string;
  requestLineageRef: string;
  submissionPromotionRecordRef: string;
  normalizedSubmissionRef: string;
  receiptConsistencyKey: string;
  statusConsistencyKey: string;
  requestTypeRef: "Symptoms" | "Meds" | "Admin" | "Results";
  serviceBandRef: Phase1TriageServiceBand;
  residualReviewState: Phase1ResidualReviewState;
  workflowQueueRef: string;
  taskState: Phase1TriageTaskState;
  safetyState: "screen_clear" | "residual_risk_flagged";
  residualRiskRuleRefs: readonly string[];
  priorityBandRef: "routine" | "residual_review";
  queueRank: number;
  latestEtaForecastRef: string;
  latestStatusProjectionRef: string;
  schemaResolutionRef: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Phase1TriageEtaForecastSnapshot {
  triageEtaForecastSchemaVersion: "PHASE1_TRIAGE_ETA_FORECAST_V1";
  triageEtaForecastId: string;
  triageTaskRef: string;
  requestRef: string;
  requestLineageRef: string;
  receiptConsistencyKey: string;
  queueSnapshotId: string;
  snapshotObservedAt: string;
  telemetryFreshnessState: Phase1TelemetryFreshnessState;
  queueCompletenessState: Phase1TelemetryCoverageState;
  staffingCoverageState: Phase1TelemetryCoverageState;
  queueRank: number;
  queueSize: number;
  policyVersionRef: string;
  calibrationVersionRef: string;
  etaPromiseRef: string;
  hysteresisPolicyRef: string;
  workingScheduleRef: string;
  simulationSeed: string;
  drawCount: number;
  candidateReceiptBucket: PatientReceiptBucket;
  candidateBucketConfidence: number;
  receiptBucket: PatientReceiptBucket;
  promiseState: PatientReceiptPromiseState;
  etaLowerBoundAt: string | null;
  etaMedianAt: string | null;
  etaUpperBoundAt: string | null;
  calibratedLowerWorkingMinutes: number;
  calibratedMedianWorkingMinutes: number;
  calibratedUpperWorkingMinutes: number;
  bucketConfidence: number;
  rawBucketProbabilities: Record<PatientReceiptBucket, number>;
  calibratedBucketProbabilities: Record<PatientReceiptBucket, number>;
  admissibleBuckets: readonly PatientReceiptBucket[];
  conformalPaddingWorkingMinutes: number;
  hysteresisDecision: Phase1EtaHysteresisDecision;
  generatedAt: string;
  version: number;
}

export interface Phase1PatientStatusProjectionSnapshot {
  patientStatusProjectionSchemaVersion: "PHASE1_PATIENT_STATUS_PROJECTION_V1";
  patientStatusProjectionId: string;
  requestRef: string;
  requestLineageRef: string;
  triageTaskRef: string | null;
  receiptConsistencyKey: string;
  statusConsistencyKey: string;
  macroState: Phase1PatientMacroState;
  summaryState: "waiting" | "action_needed" | "complete" | "blocked";
  nextStepMessageRef: string;
  trustCueRef: string;
  visibleEtaBucket: PatientReceiptBucket;
  promiseState: PatientReceiptPromiseState;
  safetyState: "screen_clear" | "residual_risk_flagged" | "urgent_action";
  residualRiskRuleRefs: readonly string[];
  mappingContractRef: string;
  lastMeaningfulUpdateAt: string;
  generatedAt: string;
  version: number;
}

export class Phase1TriageTaskDocument {
  private readonly snapshot: Phase1TriageTaskSnapshot;

  private constructor(snapshot: Phase1TriageTaskSnapshot) {
    this.snapshot = Phase1TriageTaskDocument.normalize(snapshot);
  }

  static create(input: Omit<Phase1TriageTaskSnapshot, "version">): Phase1TriageTaskDocument {
    return new Phase1TriageTaskDocument({ ...input, version: 1 });
  }

  static hydrate(snapshot: Phase1TriageTaskSnapshot): Phase1TriageTaskDocument {
    return new Phase1TriageTaskDocument(snapshot);
  }

  private static normalize(snapshot: Phase1TriageTaskSnapshot): Phase1TriageTaskSnapshot {
    return {
      ...snapshot,
      triageTaskId: requireRef(snapshot.triageTaskId, "triageTaskId"),
      requestRef: requireRef(snapshot.requestRef, "requestRef"),
      requestLineageRef: requireRef(snapshot.requestLineageRef, "requestLineageRef"),
      submissionPromotionRecordRef: requireRef(
        snapshot.submissionPromotionRecordRef,
        "submissionPromotionRecordRef",
      ),
      normalizedSubmissionRef: requireRef(
        snapshot.normalizedSubmissionRef,
        "normalizedSubmissionRef",
      ),
      receiptConsistencyKey: requireRef(snapshot.receiptConsistencyKey, "receiptConsistencyKey"),
      statusConsistencyKey: requireRef(snapshot.statusConsistencyKey, "statusConsistencyKey"),
      workflowQueueRef: requireRef(snapshot.workflowQueueRef, "workflowQueueRef"),
      residualRiskRuleRefs: uniqueSortedRefs(snapshot.residualRiskRuleRefs),
      latestEtaForecastRef: requireRef(snapshot.latestEtaForecastRef, "latestEtaForecastRef"),
      latestStatusProjectionRef: requireRef(
        snapshot.latestStatusProjectionRef,
        "latestStatusProjectionRef",
      ),
      schemaResolutionRef: requireRef(snapshot.schemaResolutionRef, "schemaResolutionRef"),
      createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
      updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
      queueRank: ensurePositiveInteger(snapshot.queueRank, "queueRank"),
      version: ensurePositiveInteger(snapshot.version, "version"),
    };
  }

  get triageTaskId(): string {
    return this.snapshot.triageTaskId;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): Phase1TriageTaskSnapshot {
    return {
      ...this.snapshot,
      residualRiskRuleRefs: [...this.snapshot.residualRiskRuleRefs],
    };
  }
}

export class Phase1TriageEtaForecastDocument {
  private readonly snapshot: Phase1TriageEtaForecastSnapshot;

  private constructor(snapshot: Phase1TriageEtaForecastSnapshot) {
    this.snapshot = Phase1TriageEtaForecastDocument.normalize(snapshot);
  }

  static create(
    input: Omit<Phase1TriageEtaForecastSnapshot, "version">,
  ): Phase1TriageEtaForecastDocument {
    return new Phase1TriageEtaForecastDocument({ ...input, version: 1 });
  }

  static hydrate(snapshot: Phase1TriageEtaForecastSnapshot): Phase1TriageEtaForecastDocument {
    return new Phase1TriageEtaForecastDocument(snapshot);
  }

  private static normalize(
    snapshot: Phase1TriageEtaForecastSnapshot,
  ): Phase1TriageEtaForecastSnapshot {
    return {
      ...snapshot,
      triageEtaForecastId: requireRef(snapshot.triageEtaForecastId, "triageEtaForecastId"),
      triageTaskRef: requireRef(snapshot.triageTaskRef, "triageTaskRef"),
      requestRef: requireRef(snapshot.requestRef, "requestRef"),
      requestLineageRef: requireRef(snapshot.requestLineageRef, "requestLineageRef"),
      receiptConsistencyKey: requireRef(snapshot.receiptConsistencyKey, "receiptConsistencyKey"),
      queueSnapshotId: requireRef(snapshot.queueSnapshotId, "queueSnapshotId"),
      snapshotObservedAt: ensureIsoTimestamp(snapshot.snapshotObservedAt, "snapshotObservedAt"),
      policyVersionRef: requireRef(snapshot.policyVersionRef, "policyVersionRef"),
      calibrationVersionRef: requireRef(snapshot.calibrationVersionRef, "calibrationVersionRef"),
      etaPromiseRef: requireRef(snapshot.etaPromiseRef, "etaPromiseRef"),
      hysteresisPolicyRef: requireRef(snapshot.hysteresisPolicyRef, "hysteresisPolicyRef"),
      workingScheduleRef: requireRef(snapshot.workingScheduleRef, "workingScheduleRef"),
      simulationSeed: requireRef(snapshot.simulationSeed, "simulationSeed"),
      drawCount: ensurePositiveInteger(snapshot.drawCount, "drawCount"),
      queueRank: ensurePositiveInteger(snapshot.queueRank, "queueRank"),
      queueSize: ensurePositiveInteger(snapshot.queueSize, "queueSize"),
      etaLowerBoundAt: optionalRef(snapshot.etaLowerBoundAt),
      etaMedianAt: optionalRef(snapshot.etaMedianAt),
      etaUpperBoundAt: optionalRef(snapshot.etaUpperBoundAt),
      calibratedLowerWorkingMinutes: ensureNonNegativeNumber(
        snapshot.calibratedLowerWorkingMinutes,
        "calibratedLowerWorkingMinutes",
      ),
      calibratedMedianWorkingMinutes: ensureNonNegativeNumber(
        snapshot.calibratedMedianWorkingMinutes,
        "calibratedMedianWorkingMinutes",
      ),
      calibratedUpperWorkingMinutes: ensureNonNegativeNumber(
        snapshot.calibratedUpperWorkingMinutes,
        "calibratedUpperWorkingMinutes",
      ),
      candidateBucketConfidence: ensureUnitInterval(
        snapshot.candidateBucketConfidence,
        "candidateBucketConfidence",
      ),
      bucketConfidence: ensureUnitInterval(snapshot.bucketConfidence, "bucketConfidence"),
      conformalPaddingWorkingMinutes: ensureNonNegativeNumber(
        snapshot.conformalPaddingWorkingMinutes,
        "conformalPaddingWorkingMinutes",
      ),
      rawBucketProbabilities: normalizeBucketProbabilityRecord(snapshot.rawBucketProbabilities),
      calibratedBucketProbabilities: normalizeBucketProbabilityRecord(
        snapshot.calibratedBucketProbabilities,
      ),
      admissibleBuckets: normalizeBucketList(snapshot.admissibleBuckets),
      generatedAt: ensureIsoTimestamp(snapshot.generatedAt, "generatedAt"),
      version: ensurePositiveInteger(snapshot.version, "version"),
    };
  }

  toSnapshot(): Phase1TriageEtaForecastSnapshot {
    return {
      ...this.snapshot,
      admissibleBuckets: [...this.snapshot.admissibleBuckets],
      rawBucketProbabilities: { ...this.snapshot.rawBucketProbabilities },
      calibratedBucketProbabilities: { ...this.snapshot.calibratedBucketProbabilities },
    };
  }
}

export class Phase1PatientStatusProjectionDocument {
  private readonly snapshot: Phase1PatientStatusProjectionSnapshot;

  private constructor(snapshot: Phase1PatientStatusProjectionSnapshot) {
    this.snapshot = Phase1PatientStatusProjectionDocument.normalize(snapshot);
  }

  static create(
    input: Omit<Phase1PatientStatusProjectionSnapshot, "version">,
  ): Phase1PatientStatusProjectionDocument {
    return new Phase1PatientStatusProjectionDocument({ ...input, version: 1 });
  }

  static hydrate(
    snapshot: Phase1PatientStatusProjectionSnapshot,
  ): Phase1PatientStatusProjectionDocument {
    return new Phase1PatientStatusProjectionDocument(snapshot);
  }

  private static normalize(
    snapshot: Phase1PatientStatusProjectionSnapshot,
  ): Phase1PatientStatusProjectionSnapshot {
    return {
      ...snapshot,
      patientStatusProjectionId: requireRef(
        snapshot.patientStatusProjectionId,
        "patientStatusProjectionId",
      ),
      requestRef: requireRef(snapshot.requestRef, "requestRef"),
      requestLineageRef: requireRef(snapshot.requestLineageRef, "requestLineageRef"),
      triageTaskRef: optionalRef(snapshot.triageTaskRef),
      receiptConsistencyKey: requireRef(snapshot.receiptConsistencyKey, "receiptConsistencyKey"),
      statusConsistencyKey: requireRef(snapshot.statusConsistencyKey, "statusConsistencyKey"),
      nextStepMessageRef: requireRef(snapshot.nextStepMessageRef, "nextStepMessageRef"),
      trustCueRef: requireRef(snapshot.trustCueRef, "trustCueRef"),
      residualRiskRuleRefs: uniqueSortedRefs(snapshot.residualRiskRuleRefs),
      mappingContractRef: requireRef(snapshot.mappingContractRef, "mappingContractRef"),
      lastMeaningfulUpdateAt: ensureIsoTimestamp(
        snapshot.lastMeaningfulUpdateAt,
        "lastMeaningfulUpdateAt",
      ),
      generatedAt: ensureIsoTimestamp(snapshot.generatedAt, "generatedAt"),
      version: ensurePositiveInteger(snapshot.version, "version"),
    };
  }

  toSnapshot(): Phase1PatientStatusProjectionSnapshot {
    return {
      ...this.snapshot,
      residualRiskRuleRefs: [...this.snapshot.residualRiskRuleRefs],
    };
  }
}

function normalizeBucketProbabilityRecord(
  input: Record<PatientReceiptBucket, number>,
): Record<PatientReceiptBucket, number> {
  return {
    same_day: ensureUnitInterval(input.same_day ?? 0, "rawBucketProbabilities.same_day"),
    next_working_day: ensureUnitInterval(
      input.next_working_day ?? 0,
      "rawBucketProbabilities.next_working_day",
    ),
    within_2_working_days: ensureUnitInterval(
      input.within_2_working_days ?? 0,
      "rawBucketProbabilities.within_2_working_days",
    ),
    after_2_working_days: ensureUnitInterval(
      input.after_2_working_days ?? 0,
      "rawBucketProbabilities.after_2_working_days",
    ),
  };
}

function normalizeBucketList(values: readonly PatientReceiptBucket[]): PatientReceiptBucket[] {
  const unique = [...new Set(values)];
  return unique.sort(compareBuckets);
}

export interface Phase1TriageRepositories {
  saveTriageTask(document: Phase1TriageTaskDocument): Promise<void>;
  getTriageTask(triageTaskId: string): Promise<Phase1TriageTaskDocument | undefined>;
  findTriageTaskByRequest(requestRef: string): Promise<Phase1TriageTaskDocument | undefined>;
  listTriageTasks(): Promise<readonly Phase1TriageTaskDocument[]>;
  saveEtaForecast(document: Phase1TriageEtaForecastDocument): Promise<void>;
  getEtaForecast(triageEtaForecastId: string): Promise<Phase1TriageEtaForecastDocument | undefined>;
  findLatestEtaForecastByTask(triageTaskRef: string): Promise<Phase1TriageEtaForecastDocument | undefined>;
  listEtaForecastsByReceiptConsistencyKey(
    receiptConsistencyKey: string,
  ): Promise<readonly Phase1TriageEtaForecastDocument[]>;
  savePatientStatusProjection(document: Phase1PatientStatusProjectionDocument): Promise<void>;
  getPatientStatusProjection(
    patientStatusProjectionId: string,
  ): Promise<Phase1PatientStatusProjectionDocument | undefined>;
  findLatestPatientStatusProjectionByStatusConsistencyKey(
    statusConsistencyKey: string,
  ): Promise<Phase1PatientStatusProjectionDocument | undefined>;
}

export class InMemoryPhase1TriageStore implements Phase1TriageRepositories {
  private readonly tasks = new Map<string, Phase1TriageTaskSnapshot>();
  private readonly taskByRequest = new Map<string, string>();
  private readonly forecasts = new Map<string, Phase1TriageEtaForecastSnapshot>();
  private readonly latestForecastByTask = new Map<string, string>();
  private readonly forecastHistoryByReceiptKey = new Map<string, string[]>();
  private readonly statusProjections = new Map<string, Phase1PatientStatusProjectionSnapshot>();
  private readonly latestStatusByKey = new Map<string, string>();

  async saveTriageTask(document: Phase1TriageTaskDocument): Promise<void> {
    const snapshot = document.toSnapshot();
    invariant(
      !this.tasks.has(snapshot.triageTaskId),
      "TRIAGE_TASK_APPEND_ONLY",
      "Phase 1 TriageTask is append-only.",
    );
    invariant(
      !this.taskByRequest.has(snapshot.requestRef),
      "TRIAGE_TASK_REQUEST_UNIQUE",
      "Only one canonical Phase 1 triage task may exist per request.",
    );
    this.tasks.set(snapshot.triageTaskId, snapshot);
    this.taskByRequest.set(snapshot.requestRef, snapshot.triageTaskId);
  }

  async getTriageTask(triageTaskId: string): Promise<Phase1TriageTaskDocument | undefined> {
    const row = this.tasks.get(triageTaskId);
    return row ? Phase1TriageTaskDocument.hydrate(row) : undefined;
  }

  async findTriageTaskByRequest(requestRef: string): Promise<Phase1TriageTaskDocument | undefined> {
    const taskId = this.taskByRequest.get(requestRef);
    return taskId ? this.getTriageTask(taskId) : undefined;
  }

  async listTriageTasks(): Promise<readonly Phase1TriageTaskDocument[]> {
    return [...this.tasks.values()].map((row) => Phase1TriageTaskDocument.hydrate(row));
  }

  async saveEtaForecast(document: Phase1TriageEtaForecastDocument): Promise<void> {
    const snapshot = document.toSnapshot();
    invariant(
      !this.forecasts.has(snapshot.triageEtaForecastId),
      "TRIAGE_FORECAST_APPEND_ONLY",
      "Phase 1 ETA forecasts are append-only.",
    );
    this.forecasts.set(snapshot.triageEtaForecastId, snapshot);
    this.latestForecastByTask.set(snapshot.triageTaskRef, snapshot.triageEtaForecastId);
    const history = this.forecastHistoryByReceiptKey.get(snapshot.receiptConsistencyKey) ?? [];
    this.forecastHistoryByReceiptKey.set(snapshot.receiptConsistencyKey, [
      ...history,
      snapshot.triageEtaForecastId,
    ]);
  }

  async getEtaForecast(
    triageEtaForecastId: string,
  ): Promise<Phase1TriageEtaForecastDocument | undefined> {
    const row = this.forecasts.get(triageEtaForecastId);
    return row ? Phase1TriageEtaForecastDocument.hydrate(row) : undefined;
  }

  async findLatestEtaForecastByTask(
    triageTaskRef: string,
  ): Promise<Phase1TriageEtaForecastDocument | undefined> {
    const forecastId = this.latestForecastByTask.get(triageTaskRef);
    return forecastId ? this.getEtaForecast(forecastId) : undefined;
  }

  async listEtaForecastsByReceiptConsistencyKey(
    receiptConsistencyKey: string,
  ): Promise<readonly Phase1TriageEtaForecastDocument[]> {
    const history = this.forecastHistoryByReceiptKey.get(receiptConsistencyKey) ?? [];
    const rows = await Promise.all(history.map((forecastId) => this.getEtaForecast(forecastId)));
    return rows.filter((row): row is Phase1TriageEtaForecastDocument => !!row);
  }

  async savePatientStatusProjection(document: Phase1PatientStatusProjectionDocument): Promise<void> {
    const snapshot = document.toSnapshot();
    invariant(
      !this.statusProjections.has(snapshot.patientStatusProjectionId),
      "PATIENT_STATUS_PROJECTION_APPEND_ONLY",
      "Phase 1 patient status projections are append-only.",
    );
    this.statusProjections.set(snapshot.patientStatusProjectionId, snapshot);
    this.latestStatusByKey.set(snapshot.statusConsistencyKey, snapshot.patientStatusProjectionId);
  }

  async getPatientStatusProjection(
    patientStatusProjectionId: string,
  ): Promise<Phase1PatientStatusProjectionDocument | undefined> {
    const row = this.statusProjections.get(patientStatusProjectionId);
    return row ? Phase1PatientStatusProjectionDocument.hydrate(row) : undefined;
  }

  async findLatestPatientStatusProjectionByStatusConsistencyKey(
    statusConsistencyKey: string,
  ): Promise<Phase1PatientStatusProjectionDocument | undefined> {
    const projectionId = this.latestStatusByKey.get(statusConsistencyKey);
    return projectionId ? this.getPatientStatusProjection(projectionId) : undefined;
  }
}

export interface Phase1EtaEngineQueueEntry {
  triageTaskRef: string;
  requestRef: string;
  requestLineageRef: string;
  receiptConsistencyKey: string;
  statusConsistencyKey: string;
  serviceBandRef: Phase1TriageServiceBand;
  residualReviewState: Phase1ResidualReviewState;
  safetyState: "screen_clear" | "residual_risk_flagged";
  residualRiskRuleRefs: readonly string[];
  createdAt: string;
  previousEnvelope?: PreviousReceiptEnvelopeSummary | null;
  recentForecasts?: readonly Phase1TriageEtaForecastSnapshot[];
}

export interface Phase1EtaTelemetryInput {
  freshnessState?: Phase1TelemetryFreshnessState;
  queueCompletenessState?: Phase1TelemetryCoverageState;
  staffingCoverageState?: Phase1TelemetryCoverageState;
}

export interface Phase1EtaForecastAssessment {
  triageTaskRef: string;
  requestRef: string;
  requestLineageRef: string;
  receiptConsistencyKey: string;
  statusConsistencyKey: string;
  queueRank: number;
  queueSize: number;
  candidateReceiptBucket: PatientReceiptBucket;
  candidateBucketConfidence: number;
  publishedReceiptBucket: PatientReceiptBucket;
  promiseState: PatientReceiptPromiseState;
  hysteresisDecision: Phase1EtaHysteresisDecision;
  calibratedLowerWorkingMinutes: number;
  calibratedMedianWorkingMinutes: number;
  calibratedUpperWorkingMinutes: number;
  etaLowerBoundAt: string | null;
  etaMedianAt: string | null;
  etaUpperBoundAt: string | null;
  bucketConfidence: number;
  rawBucketProbabilities: Record<PatientReceiptBucket, number>;
  calibratedBucketProbabilities: Record<PatientReceiptBucket, number>;
  admissibleBuckets: readonly PatientReceiptBucket[];
  conformalPaddingWorkingMinutes: number;
  telemetryFreshnessState: Phase1TelemetryFreshnessState;
  queueCompletenessState: Phase1TelemetryCoverageState;
  staffingCoverageState: Phase1TelemetryCoverageState;
  queueSnapshotId: string;
  simulationSeed: string;
}

export interface Phase1EtaForecastInput {
  tenantId: string;
  snapshotObservedAt: string;
  queueEntries: readonly Phase1EtaEngineQueueEntry[];
  telemetry?: Phase1EtaTelemetryInput;
}

export interface Phase1EtaForecastOutput {
  queueSnapshotId: string;
  orderedTaskRefs: readonly string[];
  assessments: readonly Phase1EtaForecastAssessment[];
}

function resolveBandPrior(
  fixture: Phase1EtaPolicyFixture,
  serviceBandRef: Phase1TriageServiceBand,
): Phase1ServiceBandPrior {
  const prior = fixture.serviceBandPriors.find((candidate) => candidate.serviceBandRef === serviceBandRef);
  invariant(!!prior, "MISSING_SERVICE_BAND_PRIOR", `Missing prior for ${serviceBandRef}.`);
  return prior;
}

function interpolateCalibration(
  calibrator: Phase1EtaBucketCalibrator,
  rawProbability: number,
): number {
  const clamped = Math.min(1, Math.max(0, rawProbability));
  const points = calibrator.points;
  if (points.length === 1) {
    return points[0]?.calibratedProbability ?? clamped;
  }
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    if (!current || !next) {
      continue;
    }
    if (clamped >= current.rawProbability && clamped <= next.rawProbability) {
      const span = next.rawProbability - current.rawProbability || 1;
      const ratio = (clamped - current.rawProbability) / span;
      return roundMetric(
        current.calibratedProbability +
          (next.calibratedProbability - current.calibratedProbability) * ratio,
      );
    }
  }
  return roundMetric(points[points.length - 1]?.calibratedProbability ?? clamped);
}

function localDateParts(date: Date, timezone: string): {
  weekday: number;
  hour: number;
  minute: number;
} {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const weekdayText = parts.find((part) => part.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const weekdayLookup: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return {
    weekday: weekdayLookup[weekdayText] ?? 1,
    hour,
    minute,
  };
}

function isWorkingMinute(date: Date, schedule: Phase1WorkingSchedule): boolean {
  const local = localDateParts(date, schedule.timezone);
  if (!schedule.workingWeekdays.includes(local.weekday)) {
    return false;
  }
  const totalMinutes = local.hour * 60 + local.minute;
  return totalMinutes >= schedule.startHour * 60 && totalMinutes < schedule.endHour * 60;
}

function advanceWorkingMinutes(
  startAt: string,
  workingMinutes: number,
  schedule: Phase1WorkingSchedule,
): string {
  let remaining = Math.max(0, Math.ceil(workingMinutes));
  let cursor = new Date(Date.parse(startAt));
  if (remaining === 0) {
    return cursor.toISOString();
  }
  while (remaining > 0) {
    cursor = new Date(cursor.getTime() + 60_000);
    if (isWorkingMinute(cursor, schedule)) {
      remaining -= 1;
    }
  }
  return cursor.toISOString();
}

function workingMinutesBetween(
  startAt: string,
  endAt: string,
  schedule: Phase1WorkingSchedule,
): number {
  let cursor = new Date(Date.parse(startAt));
  const end = new Date(Date.parse(endAt));
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime()) || end <= cursor) {
    return 0;
  }
  let accrued = 0;
  while (cursor < end) {
    cursor = new Date(cursor.getTime() + 60_000);
    if (cursor <= end && isWorkingMinute(cursor, schedule)) {
      accrued += 1;
    }
  }
  return accrued;
}

function workingMinutesUntilWorkingDayEnd(
  startAt: string,
  schedule: Phase1WorkingSchedule,
  workingDayCount: number,
): number {
  let cursor = new Date(Date.parse(startAt));
  let accrued = 0;
  let remainingDays = workingDayCount;
  let wasInWorkingMinute = isWorkingMinute(cursor, schedule);
  while (remainingDays > 0) {
    cursor = new Date(cursor.getTime() + 60_000);
    const inWorkingMinute = isWorkingMinute(cursor, schedule);
    if (inWorkingMinute) {
      accrued += 1;
    }
    if (wasInWorkingMinute && !inWorkingMinute) {
      remainingDays -= 1;
    }
    wasInWorkingMinute = inWorkingMinute;
  }
  return accrued;
}

function sampleHandlingMinutes(
  entry: Phase1EtaEngineQueueEntry,
  fixture: Phase1EtaPolicyFixture,
  random: () => number,
): number {
  const prior = resolveBandPrior(fixture, entry.serviceBandRef);
  const w = prior.localHandlingMinutes.length / (prior.localHandlingMinutes.length + fixture.kappaShrink);
  const picked =
    random() <= w
      ? sampleArray(prior.localHandlingMinutes, random)
      : sampleArray(prior.globalHandlingMinutes, random);
  return entry.residualReviewState === "residual_review" ? roundMetric(picked * 1.25) : picked;
}

function resolvePaddingWorkingMinutes(
  entry: Phase1EtaEngineQueueEntry,
  fixture: Phase1EtaPolicyFixture,
): number {
  const prior = resolveBandPrior(fixture, entry.serviceBandRef);
  const useLocal = prior.localResidualsWorkingMinutes.length >= fixture.localCalibrationFloor;
  const residuals = useLocal
    ? prior.localResidualsWorkingMinutes
    : prior.globalResidualsWorkingMinutes;
  const weights = residuals.map((_, index) => index + 1);
  return roundMetric(weightedQuantile(residuals, weights, 0.9));
}

function deriveQueueOrder(
  entries: readonly Phase1EtaEngineQueueEntry[],
): readonly Phase1EtaEngineQueueEntry[] {
  return [...entries].sort((left, right) => {
    if (left.residualReviewState !== right.residualReviewState) {
      return left.residualReviewState === "residual_review" ? -1 : 1;
    }
    const createdDifference = Date.parse(left.createdAt) - Date.parse(right.createdAt);
    if (createdDifference !== 0) {
      return createdDifference;
    }
    return left.triageTaskRef.localeCompare(right.triageTaskRef);
  });
}

function bucketProbabilitiesFromDeadlines(
  completionMinutes: readonly number[],
  deadlines: Record<Exclude<PatientReceiptBucket, "after_2_working_days">, number>,
): Record<PatientReceiptBucket, number> {
  const total = Math.max(1, completionMinutes.length);
  const sameDayHits = completionMinutes.filter((value) => value <= deadlines.same_day).length;
  const nextDayHits = completionMinutes.filter((value) => value <= deadlines.next_working_day).length;
  const twoDayHits = completionMinutes.filter((value) => value <= deadlines.within_2_working_days).length;
  return {
    same_day: roundMetric(sameDayHits / total),
    next_working_day: roundMetric(nextDayHits / total),
    within_2_working_days: roundMetric(twoDayHits / total),
    after_2_working_days: 1,
  };
}

function defaultBucketConfidence(
  calibrated: Record<PatientReceiptBucket, number>,
  bucket: PatientReceiptBucket,
): number {
  return roundMetric(calibrated[bucket] ?? (bucket === "after_2_working_days" ? 1 : 0));
}

function resolveCandidateBucket(input: {
  upperWorkingMinutes: number;
  deadlines: Record<Exclude<PatientReceiptBucket, "after_2_working_days">, number>;
  calibratedBucketProbabilities: Record<PatientReceiptBucket, number>;
  fixture: Phase1EtaPolicyFixture;
}): { bucket: PatientReceiptBucket; admissibleBuckets: PatientReceiptBucket[]; confidence: number } {
  const admissible: PatientReceiptBucket[] = [];
  if (input.upperWorkingMinutes <= input.deadlines.same_day) {
    admissible.push("same_day");
  }
  if (input.upperWorkingMinutes <= input.deadlines.next_working_day) {
    admissible.push("next_working_day");
  }
  if (input.upperWorkingMinutes <= input.deadlines.within_2_working_days) {
    admissible.push("within_2_working_days");
  }
  const ordered: readonly PatientReceiptBucket[] = [
    "same_day",
    "next_working_day",
    "within_2_working_days",
  ];
  for (const bucket of ordered) {
    if (
      admissible.includes(bucket) &&
      (input.calibratedBucketProbabilities[bucket] ?? 0) >= input.fixture.sameDayThresholdProbability
    ) {
      return {
        bucket,
        admissibleBuckets: admissible,
        confidence: defaultBucketConfidence(input.calibratedBucketProbabilities, bucket),
      };
    }
  }
  return {
    bucket: "after_2_working_days",
    admissibleBuckets: admissible,
    confidence: defaultBucketConfidence(input.calibratedBucketProbabilities, "after_2_working_days"),
  };
}

function applyHysteresis(input: {
  candidateBucket: PatientReceiptBucket;
  candidateConfidence: number;
  previousEnvelope: PreviousReceiptEnvelopeSummary | null;
  recentForecasts: readonly Phase1TriageEtaForecastSnapshot[];
  telemetryFreshnessState: Phase1TelemetryFreshnessState;
  queueCompletenessState: Phase1TelemetryCoverageState;
  staffingCoverageState: Phase1TelemetryCoverageState;
  candidateUpperWorkingMinutes: number;
  previousUpperWorkingMinutes: number | null;
  fixture: Phase1EtaPolicyFixture;
}): {
  receiptBucket: PatientReceiptBucket;
  promiseState: PatientReceiptPromiseState;
  hysteresisDecision: Phase1EtaHysteresisDecision;
  bucketConfidence: number;
} {
  const degradedTelemetry =
    input.telemetryFreshnessState === "stale" ||
    input.queueCompletenessState === "insufficient" ||
    input.staffingCoverageState === "insufficient";
  const atRiskTelemetry =
    input.telemetryFreshnessState === "at_risk" ||
    input.queueCompletenessState === "thin" ||
    input.staffingCoverageState === "thin";

  if (degradedTelemetry) {
    return {
      receiptBucket: input.previousEnvelope?.receiptBucket ?? "after_2_working_days",
      promiseState: input.previousEnvelope ? "at_risk" : "recovery_required",
      hysteresisDecision: input.previousEnvelope ? "frozen_at_risk" : "recovery_required",
      bucketConfidence: input.previousEnvelope?.bucketConfidence ?? input.candidateConfidence,
    };
  }

  if (!input.previousEnvelope) {
    return {
      receiptBucket: input.candidateBucket,
      promiseState: atRiskTelemetry ? "at_risk" : "on_track",
      hysteresisDecision: "initial_issue",
      bucketConfidence: input.candidateConfidence,
    };
  }

  const bucketComparison = compareBuckets(input.candidateBucket, input.previousEnvelope.receiptBucket);
  if (bucketComparison === 0) {
    if (
      input.previousUpperWorkingMinutes !== null &&
      input.candidateUpperWorkingMinutes >
        input.previousUpperWorkingMinutes + input.fixture.materialImprovementWorkingMinutes / 2
    ) {
      return {
        receiptBucket: input.candidateBucket,
        promiseState: "revised_downward",
        hysteresisDecision: "revised_downward",
        bucketConfidence: input.candidateConfidence,
      };
    }
    return {
      receiptBucket: input.previousEnvelope.receiptBucket,
      promiseState: atRiskTelemetry ? "at_risk" : "on_track",
      hysteresisDecision: "initial_issue",
      bucketConfidence: Math.max(input.previousEnvelope.bucketConfidence, input.candidateConfidence),
    };
  }

  if (bucketComparison > 0) {
    return {
      receiptBucket: input.candidateBucket,
      promiseState: "revised_downward",
      hysteresisDecision: "revised_downward",
      bucketConfidence: input.candidateConfidence,
    };
  }

  const immediateMaterialImprovement =
    input.previousUpperWorkingMinutes !== null &&
    input.previousUpperWorkingMinutes - input.candidateUpperWorkingMinutes >=
      input.fixture.materialImprovementWorkingMinutes;
  const priorForecast = input.recentForecasts[input.recentForecasts.length - 1] ?? null;
  const improvementRepeated =
    priorForecast?.candidateReceiptBucket === input.candidateBucket &&
    (priorForecast.candidateBucketConfidence ?? 0) >=
      input.fixture.sameDayThresholdProbability + input.fixture.hysteresisMargin;

  if (immediateMaterialImprovement) {
    return {
      receiptBucket: input.candidateBucket,
      promiseState: "improved",
      hysteresisDecision: "material_improvement",
      bucketConfidence: input.candidateConfidence,
    };
  }

  if (
    input.candidateConfidence >=
      input.fixture.sameDayThresholdProbability + input.fixture.hysteresisMargin &&
    improvementRepeated
  ) {
    return {
      receiptBucket: input.candidateBucket,
      promiseState: "improved",
      hysteresisDecision: "confirmed_improvement",
      bucketConfidence: input.candidateConfidence,
    };
  }

  return {
    receiptBucket: input.previousEnvelope.receiptBucket,
    promiseState: "on_track",
    hysteresisDecision: "held_prior_bucket",
    bucketConfidence: input.previousEnvelope.bucketConfidence,
  };
}

export class Phase1EtaEngine {
  constructor(private readonly fixture: Phase1EtaPolicyFixture = defaultPhase1EtaPolicyFixture) {}

  forecastSnapshot(input: Phase1EtaForecastInput): Phase1EtaForecastOutput {
    const snapshotObservedAt = ensureIsoTimestamp(input.snapshotObservedAt, "snapshotObservedAt");
    const orderedEntries = deriveQueueOrder(input.queueEntries);
    const queueSnapshotId = `qss_${sha256Hex({
      tenantId: input.tenantId,
      snapshotObservedAt,
      entries: orderedEntries.map((entry) => ({
        triageTaskRef: entry.triageTaskRef,
        serviceBandRef: entry.serviceBandRef,
        residualReviewState: entry.residualReviewState,
        createdAt: entry.createdAt,
      })),
      telemetry: input.telemetry ?? null,
    }).slice(0, 20)}`;
    const simulationSeed = `seed::${queueSnapshotId}`;
    const deadlineWorkingMinutes = {
      same_day: workingMinutesUntilWorkingDayEnd(
        snapshotObservedAt,
        this.fixture.workingSchedule,
        1,
      ),
      next_working_day: workingMinutesUntilWorkingDayEnd(
        snapshotObservedAt,
        this.fixture.workingSchedule,
        2,
      ),
      within_2_working_days: workingMinutesUntilWorkingDayEnd(
        snapshotObservedAt,
        this.fixture.workingSchedule,
        3,
      ),
    };
    const allCompletionMinutes = orderedEntries.map(() => [] as number[]);

    for (let drawIndex = 0; drawIndex < this.fixture.drawCount; drawIndex += 1) {
      const random = createDeterministicRandom(`${simulationSeed}:${drawIndex}`);
      const sampledCapacity = Math.max(
        this.fixture.capacityFloor,
        Math.min(
          this.fixture.capacityMax,
          sampleArray(this.fixture.capacityDistribution, random),
        ),
      );
      let prefixWorkingMinutes = 0;
      orderedEntries.forEach((entry, entryIndex) => {
        const handleMinutes = sampleHandlingMinutes(entry, this.fixture, random);
        const completion =
          prefixWorkingMinutes +
          handleMinutes / Math.max(1e-6, sampledCapacity) +
          this.fixture.tenantBufferWorkingMinutes;
        allCompletionMinutes[entryIndex]?.push(roundMetric(completion));
        prefixWorkingMinutes += handleMinutes / Math.max(1e-6, sampledCapacity);
      });
    }

    const medianMinutes = orderedEntries.map((_, index) =>
      quantile([...((allCompletionMinutes[index] ?? []).sort((left, right) => left - right))], 0.5),
    );
    const upperMinutes = orderedEntries.map((_, index) =>
      quantile([...((allCompletionMinutes[index] ?? []).sort((left, right) => left - right))], 0.9),
    );
    const lowerMinutes = orderedEntries.map((_, index) =>
      quantile([...((allCompletionMinutes[index] ?? []).sort((left, right) => left - right))], 0.1),
    );

    for (let index = 1; index < orderedEntries.length; index += 1) {
      medianMinutes[index] = Math.max(medianMinutes[index] ?? 0, medianMinutes[index - 1] ?? 0);
      upperMinutes[index] = Math.max(upperMinutes[index] ?? 0, upperMinutes[index - 1] ?? 0);
      lowerMinutes[index] = Math.max(lowerMinutes[index] ?? 0, lowerMinutes[index - 1] ?? 0);
    }

    const telemetryFreshnessState = input.telemetry?.freshnessState ?? "fresh";
    const queueCompletenessState = input.telemetry?.queueCompletenessState ?? "complete";
    const staffingCoverageState = input.telemetry?.staffingCoverageState ?? "complete";

    const assessments = orderedEntries.map((entry, index): Phase1EtaForecastAssessment => {
      const completionMinutes = [...((allCompletionMinutes[index] ?? []).sort((left, right) => left - right))];
      const padding = resolvePaddingWorkingMinutes(entry, this.fixture);
      const calibratedLowerWorkingMinutes = roundMetric(Math.max(0, (lowerMinutes[index] ?? 0) - padding));
      const calibratedMedianWorkingMinutes = roundMetric(medianMinutes[index] ?? 0);
      const calibratedUpperWorkingMinutes = roundMetric((upperMinutes[index] ?? 0) + padding);
      const rawBucketProbabilities = bucketProbabilitiesFromDeadlines(
        completionMinutes,
        deadlineWorkingMinutes,
      );
      const calibratedBucketProbabilities = {
        same_day: interpolateCalibration(
          this.fixture.bucketCalibrators.find((candidate) => candidate.bucket === "same_day")!,
          rawBucketProbabilities.same_day,
        ),
        next_working_day: interpolateCalibration(
          this.fixture.bucketCalibrators.find(
            (candidate) => candidate.bucket === "next_working_day",
          )!,
          rawBucketProbabilities.next_working_day,
        ),
        within_2_working_days: interpolateCalibration(
          this.fixture.bucketCalibrators.find(
            (candidate) => candidate.bucket === "within_2_working_days",
          )!,
          rawBucketProbabilities.within_2_working_days,
        ),
        after_2_working_days: 1,
      } satisfies Record<PatientReceiptBucket, number>;
      const candidateResolution = resolveCandidateBucket({
        upperWorkingMinutes: calibratedUpperWorkingMinutes,
        deadlines: deadlineWorkingMinutes,
        calibratedBucketProbabilities,
        fixture: this.fixture,
      });
      const previousEnvelope = entry.previousEnvelope ?? null;
      const previousUpperWorkingMinutes =
        previousEnvelope?.etaUpperBoundAt && previousEnvelope.etaUpperBoundAt.length > 0
          ? workingMinutesBetween(
              snapshotObservedAt,
              previousEnvelope.etaUpperBoundAt,
              this.fixture.workingSchedule,
            )
          : null;
      const hysteresis = applyHysteresis({
        candidateBucket: candidateResolution.bucket,
        candidateConfidence: candidateResolution.confidence,
        previousEnvelope,
        recentForecasts: entry.recentForecasts ?? [],
        telemetryFreshnessState,
        queueCompletenessState,
        staffingCoverageState,
        candidateUpperWorkingMinutes: calibratedUpperWorkingMinutes,
        previousUpperWorkingMinutes,
        fixture: this.fixture,
      });

      return {
        triageTaskRef: entry.triageTaskRef,
        requestRef: entry.requestRef,
        requestLineageRef: entry.requestLineageRef,
        receiptConsistencyKey: entry.receiptConsistencyKey,
        statusConsistencyKey: entry.statusConsistencyKey,
        queueRank: index + 1,
        queueSize: orderedEntries.length,
        candidateReceiptBucket: candidateResolution.bucket,
        candidateBucketConfidence: candidateResolution.confidence,
        publishedReceiptBucket: hysteresis.receiptBucket,
        promiseState: hysteresis.promiseState,
        hysteresisDecision: hysteresis.hysteresisDecision,
        calibratedLowerWorkingMinutes,
        calibratedMedianWorkingMinutes,
        calibratedUpperWorkingMinutes,
        etaLowerBoundAt: advanceWorkingMinutes(
          snapshotObservedAt,
          calibratedLowerWorkingMinutes,
          this.fixture.workingSchedule,
        ),
        etaMedianAt: advanceWorkingMinutes(
          snapshotObservedAt,
          calibratedMedianWorkingMinutes,
          this.fixture.workingSchedule,
        ),
        etaUpperBoundAt: advanceWorkingMinutes(
          snapshotObservedAt,
          calibratedUpperWorkingMinutes,
          this.fixture.workingSchedule,
        ),
        bucketConfidence: hysteresis.bucketConfidence,
        rawBucketProbabilities,
        calibratedBucketProbabilities,
        admissibleBuckets: candidateResolution.admissibleBuckets,
        conformalPaddingWorkingMinutes: padding,
        telemetryFreshnessState,
        queueCompletenessState,
        staffingCoverageState,
        queueSnapshotId,
        simulationSeed,
      };
    });

    return {
      queueSnapshotId,
      orderedTaskRefs: orderedEntries.map((entry) => entry.triageTaskRef),
      assessments,
    };
  }
}

export interface Phase1TriageTaskCreateInput {
  requestRef: string;
  requestLineageRef: string;
  submissionPromotionRecordRef: string;
  normalizedSubmissionRef: string;
  receiptConsistencyKey: string;
  statusConsistencyKey: string;
  tenantId: string;
  requestTypeRef: "Symptoms" | "Meds" | "Admin" | "Results";
  safetyState: "screen_clear" | "residual_risk_flagged";
  residualRiskRuleRefs: readonly string[];
  createdAt: string;
  previousEnvelope?: PreviousReceiptEnvelopeSummary | null;
  telemetry?: Phase1EtaTelemetryInput;
}

export interface Phase1TriageReceiptEnvelopeDraft {
  receiptBucket: PatientReceiptBucket;
  etaPromiseRef: string;
  etaLowerBoundAt: string | null;
  etaMedianAt: string | null;
  etaUpperBoundAt: string | null;
  bucketConfidence: number;
  promiseState: PatientReceiptPromiseState;
  calibrationVersionRef: string;
  statusProjectionVersionRef: string;
  causalToken: string;
  monotoneRevision: number;
}

export interface Phase1TriageTaskCreateResult {
  replayed: boolean;
  triageTask: Phase1TriageTaskSnapshot;
  etaForecast: Phase1TriageEtaForecastSnapshot;
  patientStatusProjection: Phase1PatientStatusProjectionSnapshot;
  receiptEnvelopeDraft: Phase1TriageReceiptEnvelopeDraft;
}

export function resolvePhase1ServiceBand(
  requestTypeRef: Phase1TriageTaskCreateInput["requestTypeRef"],
): Phase1TriageServiceBand {
  switch (requestTypeRef) {
    case "Symptoms":
      return "symptoms";
    case "Meds":
      return "medication";
    case "Admin":
      return "admin";
    case "Results":
      return "results";
  }
}

function nextStepMessageRef(input: {
  taskState: Phase1TriageTaskState;
  promiseState: PatientReceiptPromiseState;
  safetyState: "screen_clear" | "residual_risk_flagged";
}): string {
  if (input.promiseState === "recovery_required") {
    return "STATUS_152_RECOVERY_REQUIRED_MESSAGE_V1";
  }
  if (input.taskState === "claimed") {
    return "STATUS_152_IN_REVIEW_MESSAGE_V1";
  }
  if (input.taskState === "awaiting_patient") {
    return "STATUS_152_NEED_PATIENT_REPLY_MESSAGE_V1";
  }
  if (input.safetyState === "residual_risk_flagged") {
    return "STATUS_152_RESIDUAL_REVIEW_MESSAGE_V1";
  }
  return "STATUS_152_RECEIVED_MESSAGE_V1";
}

function trustCueRef(input: {
  promiseState: PatientReceiptPromiseState;
  safetyState: "screen_clear" | "residual_risk_flagged";
}): string {
  if (input.promiseState === "recovery_required" || input.promiseState === "at_risk") {
    return "TRUST_152_FORECAST_UNCERTAINTY_VISIBLE_V1";
  }
  if (input.safetyState === "residual_risk_flagged") {
    return "TRUST_152_RESIDUAL_REVIEW_VISIBLE_V1";
  }
  return "TRUST_152_CANONICAL_RECEIPT_V1";
}

export class Phase1TriageHandoffService {
  private readonly etaEngine: Phase1EtaEngine;

  constructor(
    readonly repositories: Phase1TriageRepositories,
    private readonly idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator(
      "phase1_triage_workspace",
    ),
    private readonly fixture: Phase1EtaPolicyFixture = defaultPhase1EtaPolicyFixture,
  ) {
    this.etaEngine = new Phase1EtaEngine(fixture);
  }

  async createTriageTask(
    input: Phase1TriageTaskCreateInput,
  ): Promise<Phase1TriageTaskCreateResult> {
    const existing = await this.repositories.findTriageTaskByRequest(input.requestRef);
    if (existing) {
      const task = existing.toSnapshot();
      const forecast = await this.repositories.findLatestEtaForecastByTask(task.triageTaskId);
      const status = await this.repositories.findLatestPatientStatusProjectionByStatusConsistencyKey(
        task.statusConsistencyKey,
      );
      invariant(!!forecast, "TRIAGE_FORECAST_MISSING", "Existing triage task is missing its ETA.");
      invariant(!!status, "TRIAGE_STATUS_MISSING", "Existing triage task is missing its status.");
      const forecastSnapshot = forecast.toSnapshot();
      return {
        replayed: true,
        triageTask: task,
        etaForecast: forecastSnapshot,
        patientStatusProjection: status.toSnapshot(),
        receiptEnvelopeDraft: {
          receiptBucket: forecastSnapshot.receiptBucket,
          etaPromiseRef: forecastSnapshot.etaPromiseRef,
          etaLowerBoundAt: forecastSnapshot.etaLowerBoundAt,
          etaMedianAt: forecastSnapshot.etaMedianAt,
          etaUpperBoundAt: forecastSnapshot.etaUpperBoundAt,
          bucketConfidence: forecastSnapshot.bucketConfidence,
          promiseState: forecastSnapshot.promiseState,
          calibrationVersionRef: forecastSnapshot.calibrationVersionRef,
          statusProjectionVersionRef: task.latestStatusProjectionRef,
          causalToken: forecastSnapshot.triageEtaForecastId,
          monotoneRevision: (input.previousEnvelope?.monotoneRevision ?? 0) + 1,
        },
      };
    }

    const createdAt = ensureIsoTimestamp(input.createdAt, "createdAt");
    const triageTaskId = nextTriageId(this.idGenerator, "phase1_triage_task");
    const existingTasks = await this.repositories.listTriageTasks();
    const existingEntries = await Promise.all(
      existingTasks.map(async (taskDocument) => {
        const task = taskDocument.toSnapshot();
        const recentForecasts = await this.repositories.listEtaForecastsByReceiptConsistencyKey(
          task.receiptConsistencyKey,
        );
        return {
          triageTaskRef: task.triageTaskId,
          requestRef: task.requestRef,
          requestLineageRef: task.requestLineageRef,
          receiptConsistencyKey: task.receiptConsistencyKey,
          statusConsistencyKey: task.statusConsistencyKey,
          serviceBandRef: task.serviceBandRef,
          residualReviewState: task.residualReviewState,
          safetyState: task.safetyState,
          residualRiskRuleRefs: task.residualRiskRuleRefs,
          createdAt: task.createdAt,
          recentForecasts: recentForecasts.map((forecast) => forecast.toSnapshot()),
        } satisfies Phase1EtaEngineQueueEntry;
      }),
    );
    const serviceBandRef = resolvePhase1ServiceBand(input.requestTypeRef);
    const residualReviewState: Phase1ResidualReviewState =
      input.safetyState === "residual_risk_flagged" ? "residual_review" : "routine_review";
    const candidateEntry: Phase1EtaEngineQueueEntry = {
      triageTaskRef: triageTaskId,
      requestRef: requireRef(input.requestRef, "requestRef"),
      requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
      receiptConsistencyKey: requireRef(input.receiptConsistencyKey, "receiptConsistencyKey"),
      statusConsistencyKey: requireRef(input.statusConsistencyKey, "statusConsistencyKey"),
      serviceBandRef,
      residualReviewState,
      safetyState: input.safetyState,
      residualRiskRuleRefs: uniqueSortedRefs(input.residualRiskRuleRefs),
      createdAt,
      previousEnvelope: input.previousEnvelope ?? null,
      recentForecasts: [],
    };
    const etaPreview = this.etaEngine.forecastSnapshot({
      tenantId: requireRef(input.tenantId, "tenantId"),
      snapshotObservedAt: createdAt,
      queueEntries: [...existingEntries, candidateEntry],
      telemetry: input.telemetry,
    });
    const assessment = etaPreview.assessments.find(
      (candidate) => candidate.triageTaskRef === triageTaskId,
    );
    invariant(!!assessment, "TRIAGE_FORECAST_ASSESSMENT_MISSING", "Candidate forecast missing.");

    const etaForecast = Phase1TriageEtaForecastDocument.create({
      triageEtaForecastSchemaVersion: "PHASE1_TRIAGE_ETA_FORECAST_V1",
      triageEtaForecastId: nextTriageId(this.idGenerator, "phase1_triage_eta_forecast"),
      triageTaskRef: triageTaskId,
      requestRef: candidateEntry.requestRef,
      requestLineageRef: candidateEntry.requestLineageRef,
      receiptConsistencyKey: candidateEntry.receiptConsistencyKey,
      queueSnapshotId: assessment.queueSnapshotId,
      snapshotObservedAt: createdAt,
      telemetryFreshnessState: assessment.telemetryFreshnessState,
      queueCompletenessState: assessment.queueCompletenessState,
      staffingCoverageState: assessment.staffingCoverageState,
      queueRank: assessment.queueRank,
      queueSize: assessment.queueSize,
      policyVersionRef: this.fixture.policyVersionRef,
      calibrationVersionRef: this.fixture.calibrationVersionRef,
      etaPromiseRef: this.fixture.etaPromiseRef,
      hysteresisPolicyRef: this.fixture.hysteresisPolicyRef,
      workingScheduleRef: this.fixture.workingSchedule.scheduleRef,
      simulationSeed: assessment.simulationSeed,
      drawCount: this.fixture.drawCount,
      candidateReceiptBucket: assessment.candidateReceiptBucket,
      candidateBucketConfidence: assessment.candidateBucketConfidence,
      receiptBucket: assessment.publishedReceiptBucket,
      promiseState: assessment.promiseState,
      etaLowerBoundAt: assessment.etaLowerBoundAt,
      etaMedianAt: assessment.etaMedianAt,
      etaUpperBoundAt: assessment.etaUpperBoundAt,
      calibratedLowerWorkingMinutes: assessment.calibratedLowerWorkingMinutes,
      calibratedMedianWorkingMinutes: assessment.calibratedMedianWorkingMinutes,
      calibratedUpperWorkingMinutes: assessment.calibratedUpperWorkingMinutes,
      bucketConfidence: assessment.bucketConfidence,
      rawBucketProbabilities: assessment.rawBucketProbabilities,
      calibratedBucketProbabilities: assessment.calibratedBucketProbabilities,
      admissibleBuckets: assessment.admissibleBuckets,
      conformalPaddingWorkingMinutes: assessment.conformalPaddingWorkingMinutes,
      hysteresisDecision: assessment.hysteresisDecision,
      generatedAt: createdAt,
    });
    await this.repositories.saveEtaForecast(etaForecast);

    const macroState: Phase1PatientMacroState =
      assessment.promiseState === "recovery_required"
        ? "received"
        : assessment.promiseState === "at_risk"
          ? "received"
          : "received";
    const patientStatusProjection = Phase1PatientStatusProjectionDocument.create({
      patientStatusProjectionSchemaVersion: "PHASE1_PATIENT_STATUS_PROJECTION_V1",
      patientStatusProjectionId: nextTriageId(this.idGenerator, "phase1_patient_status_projection"),
      requestRef: candidateEntry.requestRef,
      requestLineageRef: candidateEntry.requestLineageRef,
      triageTaskRef: triageTaskId,
      receiptConsistencyKey: candidateEntry.receiptConsistencyKey,
      statusConsistencyKey: candidateEntry.statusConsistencyKey,
      macroState,
      summaryState: assessment.promiseState === "recovery_required" ? "blocked" : "waiting",
      nextStepMessageRef: nextStepMessageRef({
        taskState: "queued",
        promiseState: assessment.promiseState,
        safetyState: input.safetyState,
      }),
      trustCueRef: trustCueRef({
        promiseState: assessment.promiseState,
        safetyState: input.safetyState,
      }),
      visibleEtaBucket: assessment.publishedReceiptBucket,
      promiseState: assessment.promiseState,
      safetyState:
        input.safetyState === "residual_risk_flagged" ? "residual_risk_flagged" : "screen_clear",
      residualRiskRuleRefs: candidateEntry.residualRiskRuleRefs,
      mappingContractRef: phase1PatientStatusMappingRef,
      lastMeaningfulUpdateAt: createdAt,
      generatedAt: createdAt,
    });
    await this.repositories.savePatientStatusProjection(patientStatusProjection);

    const triageTask = Phase1TriageTaskDocument.create({
      triageTaskSchemaVersion: "PHASE1_TRIAGE_TASK_V1",
      triageTaskId,
      requestRef: candidateEntry.requestRef,
      requestLineageRef: candidateEntry.requestLineageRef,
      submissionPromotionRecordRef: requireRef(
        input.submissionPromotionRecordRef,
        "submissionPromotionRecordRef",
      ),
      normalizedSubmissionRef: requireRef(input.normalizedSubmissionRef, "normalizedSubmissionRef"),
      receiptConsistencyKey: candidateEntry.receiptConsistencyKey,
      statusConsistencyKey: candidateEntry.statusConsistencyKey,
      requestTypeRef: input.requestTypeRef,
      serviceBandRef,
      residualReviewState,
      workflowQueueRef: `queue://tenant/${input.tenantId}/${residualReviewState}`,
      taskState: "queued",
      safetyState: input.safetyState,
      residualRiskRuleRefs: candidateEntry.residualRiskRuleRefs,
      priorityBandRef: residualReviewState === "residual_review" ? "residual_review" : "routine",
      queueRank: assessment.queueRank,
      latestEtaForecastRef: etaForecast.toSnapshot().triageEtaForecastId,
      latestStatusProjectionRef: patientStatusProjection.toSnapshot().patientStatusProjectionId,
      schemaResolutionRef: phase1TriageTaskSchemaResolutionRef,
      createdAt,
      updatedAt: createdAt,
    });
    await this.repositories.saveTriageTask(triageTask);

    return {
      replayed: false,
      triageTask: triageTask.toSnapshot(),
      etaForecast: etaForecast.toSnapshot(),
      patientStatusProjection: patientStatusProjection.toSnapshot(),
      receiptEnvelopeDraft: {
        receiptBucket: assessment.publishedReceiptBucket,
        etaPromiseRef: this.fixture.etaPromiseRef,
        etaLowerBoundAt: assessment.etaLowerBoundAt,
        etaMedianAt: assessment.etaMedianAt,
        etaUpperBoundAt: assessment.etaUpperBoundAt,
        bucketConfidence: assessment.bucketConfidence,
        promiseState: assessment.promiseState,
        calibrationVersionRef: this.fixture.calibrationVersionRef,
        statusProjectionVersionRef:
          patientStatusProjection.toSnapshot().patientStatusProjectionId,
        causalToken: etaForecast.toSnapshot().triageEtaForecastId,
        monotoneRevision: (input.previousEnvelope?.monotoneRevision ?? 0) + 1,
      },
    };
  }
}

export function createPhase1TriageStore(): Phase1TriageRepositories {
  return new InMemoryPhase1TriageStore();
}

export function createPhase1EtaEngine(
  fixture: Phase1EtaPolicyFixture = defaultPhase1EtaPolicyFixture,
): Phase1EtaEngine {
  return new Phase1EtaEngine(fixture);
}

export function createPhase1TriageHandoffService(
  repositories: Phase1TriageRepositories = createPhase1TriageStore(),
  options?: {
    idGenerator?: BackboneIdGenerator;
    fixture?: Phase1EtaPolicyFixture;
  },
): Phase1TriageHandoffService {
  return new Phase1TriageHandoffService(
    repositories,
    options?.idGenerator,
    options?.fixture,
  );
}
