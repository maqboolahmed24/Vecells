import {
  hashAssurancePayload,
  orderedSetHash,
  type Phase9AssuranceCompletenessState,
  type Phase9AssuranceTrustState,
} from "./phase9-assurance-ledger-contracts";

export const PHASE9_OPERATIONAL_CONTRACT_VERSION = "433.phase9.operational-projection-contracts.v1";
export const PHASE9_OPERATIONAL_MODEL_VERSION = "phase9.operational.breach-risk.gamma.v1";
export const PHASE9_OPERATIONAL_ANOMALY_MODEL_VERSION = "phase9.operational.anomaly.ewma-cusum.v1";
export const PHASE9_OPERATIONAL_NORMALIZATION_VERSION = "phase9.operational.metric-normalization.v1";

export const REQUIRED_PHASE9_OPERATIONAL_CONTRACTS = [
  "SLOProfile",
  "OperationalMetricDefinition",
  "BreachRiskRecord",
  "QueueHealthSnapshot",
  "DependencyHealthRecord",
  "EquitySliceMetric",
  "MetricAnomalySnapshot",
  "ContinuityControlHealthProjection",
  "OpsOverviewContextFrame",
  "OpsOverviewSliceEnvelope",
  "InvestigationDrawerSession",
  "InterventionCandidateLease",
  "LiveBoardDeltaWindow",
] as const;

export type Phase9OperationalContractName = (typeof REQUIRED_PHASE9_OPERATIONAL_CONTRACTS)[number];

export type OperationalAlertState = "normal" | "watch" | "elevated" | "critical";
export type OperationalFreshnessState = "fresh" | "watch" | "stale_review" | "read_only";
export type OperationalViewMode = "live" | "paused" | "replaying";
export type OperationalSurfaceCode =
  | "NorthStarBand"
  | "BottleneckRadar"
  | "CapacityAllocator"
  | "ServiceHealthGrid"
  | "CohortImpactMatrix"
  | "InterventionWorkbench";
export type OperationalActionEligibilityState =
  | "interactive"
  | "observe_only"
  | "stale_reacquire"
  | "read_only_recovery"
  | "blocked";
export type OperationalRenderMode = "interactive" | "observe_only" | "blocked";
export type OperationalDrawerDeltaState = "aligned" | "drifted" | "superseded" | "blocked";
export type InterventionEligibilityState =
  | "executable"
  | "observe_only"
  | "stale_reacquire"
  | "read_only_recovery"
  | "blocked";
export type LiveBoardResumeStrategy =
  | "apply_in_place"
  | "step_review"
  | "reopen_drawer_base"
  | "stale_reacquire";
export type DependencyHealthState = "healthy" | "degraded" | "blocked" | "unknown";
export type DependencyFallbackState = "not_required" | "available" | "active" | "insufficient" | "blocked";
export type ContinuityValidationState = "trusted" | "degraded" | "stale" | "blocked";
export type EquityVarianceState = "normal" | "watch" | "elevated" | "critical" | "insufficient_support";
export type EquityPersistenceState = "new" | "persistent" | "resolved" | "insufficient_support";
export type BreachRiskSeverity = "low" | "medium" | "high" | "critical";
export type BreachRiskType =
  | "sla_breach"
  | "clinical_safety_delay"
  | "access_delay"
  | "delivery_delay"
  | "continuity_drift"
  | "rebuild_staleness";
export type ContinuityControlCode =
  | "patient_nav"
  | "record_continuation"
  | "conversation_settlement"
  | "more_info_reply"
  | "support_replay_restore"
  | "intake_resume"
  | "booking_manage"
  | "hub_booking_manage"
  | "assistive_session"
  | "workspace_task_completion"
  | "pharmacy_console_settlement";

export class Phase9OperationalContractError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9OperationalContractError";
    this.code = code;
  }
}

function fail(code: string, message: string): never {
  throw new Phase9OperationalContractError(code, message);
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    fail(code, message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function ensureFiniteNumber(value: number, field: string): number {
  invariant(Number.isFinite(value), `INVALID_${field.toUpperCase()}`, `${field} must be finite.`);
  return value;
}

function ensureUnitInterval(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value >= 0 && value <= 1,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be between 0 and 1.`,
  );
  return value;
}

function ensurePositiveNumber(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be positive.`,
  );
  return value;
}

function minutesBetween(start: string, end: string): number {
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  invariant(!Number.isNaN(startMs) && !Number.isNaN(endMs), "INVALID_TIMESTAMP_RANGE", "Invalid timestamp range.");
  return (endMs - startMs) / 60_000;
}

export interface Phase9OperationalFieldDefinition {
  readonly fieldName: string;
  readonly fieldType: string;
  readonly required: boolean;
  readonly enumRef?: Phase9OperationalEnumName;
  readonly notes: string;
}

export interface Phase9OperationalContractDefinition {
  readonly contractName: Phase9OperationalContractName;
  readonly schemaVersion: typeof PHASE9_OPERATIONAL_CONTRACT_VERSION;
  readonly sourceAlgorithmRef: string;
  readonly fieldNames: readonly string[];
  readonly requiredFields: readonly string[];
  readonly optionalFields: readonly string[];
  readonly fields: readonly Phase9OperationalFieldDefinition[];
  readonly enumValues: Record<string, readonly string[]>;
  readonly tenantScopeConstraints: readonly string[];
  readonly identityKeys: readonly string[];
  readonly idempotencyKeys: readonly string[];
  readonly versioningStrategy: readonly string[];
  readonly canonicalHashInputs: readonly string[];
  readonly piiPhiClassification: string;
  readonly retentionClassRef: string;
  readonly auditEventMapping: readonly string[];
  readonly migrationCompatibilityNotes: readonly string[];
  readonly validStateExamples: readonly string[];
  readonly invalidStateExamples: readonly string[];
}

export const phase9OperationalEnumValues = {
  alertState: ["normal", "watch", "elevated", "critical"],
  anomalyState: ["normal", "watch", "elevated", "critical"],
  freshnessState: ["fresh", "watch", "stale_review", "read_only"],
  trustState: ["trusted", "degraded", "quarantined", "unknown"],
  completenessState: ["complete", "partial", "blocked"],
  viewMode: ["live", "paused", "replaying"],
  surfaceCode: [
    "NorthStarBand",
    "BottleneckRadar",
    "CapacityAllocator",
    "ServiceHealthGrid",
    "CohortImpactMatrix",
    "InterventionWorkbench",
  ],
  actionEligibilityState: ["interactive", "observe_only", "stale_reacquire", "read_only_recovery", "blocked"],
  renderMode: ["interactive", "observe_only", "blocked"],
  deltaState: ["aligned", "drifted", "superseded", "blocked"],
  eligibilityState: ["executable", "observe_only", "stale_reacquire", "read_only_recovery", "blocked"],
  resumeStrategy: ["apply_in_place", "step_review", "reopen_drawer_base", "stale_reacquire"],
  healthState: ["healthy", "degraded", "blocked", "unknown"],
  fallbackState: ["not_required", "available", "active", "insufficient", "blocked"],
  validationState: ["trusted", "degraded", "stale", "blocked"],
  varianceState: ["normal", "watch", "elevated", "critical", "insufficient_support"],
  persistenceState: ["new", "persistent", "resolved", "insufficient_support"],
  severity: ["low", "medium", "high", "critical"],
  riskType: [
    "sla_breach",
    "clinical_safety_delay",
    "access_delay",
    "delivery_delay",
    "continuity_drift",
    "rebuild_staleness",
  ],
  controlCode: [
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
  ],
} as const;

type Phase9OperationalEnumName = keyof typeof phase9OperationalEnumValues;

function field(
  fieldName: string,
  fieldType: string,
  required = true,
  enumRef?: Phase9OperationalEnumName,
): Phase9OperationalFieldDefinition {
  return {
    fieldName,
    fieldType,
    required,
    enumRef,
    notes: enumRef
      ? `Enum pinned by phase9OperationalEnumValues.${enumRef}.`
      : "Pinned by Phase 9B operational projection source algorithm.",
  };
}

const phase9OperationalFieldSpecs = {
  SLOProfile: [
    field("sloProfileId", "string"),
    field("functionCode", "string"),
    field("availabilityTarget", "number"),
    field("latencyTarget", "number"),
    field("freshnessTarget", "number"),
    field("restoreTarget", "number"),
    field("workingTimeCalendarRef", "string"),
    field("alertThresholds", "SLOAlertThresholds"),
    field("calibrationPolicyRef", "string"),
  ],
  OperationalMetricDefinition: [
    field("metricDefinitionId", "string"),
    field("metricCode", "string"),
    field("sourceProjection", "string"),
    field("numeratorSpec", "MetricExpressionSpec"),
    field("denominatorSpec", "MetricExpressionSpec"),
    field("aggregationWindow", "AggregationWindowSpec"),
    field("tenantScope", "string"),
    field("ownerRole", "string"),
    field("baselineModelRef", "string"),
    field("minimumSupport", "number"),
    field("thresholdPolicyRef", "string"),
    field("normalizationVersionRef", "string"),
  ],
  BreachRiskRecord: [
    field("breachRiskRecordId", "string"),
    field("entityType", "string"),
    field("entityRef", "string"),
    field("riskType", "BreachRiskType", true, "riskType"),
    field("severity", "BreachRiskSeverity", true, "severity"),
    field("predictedAt", "iso-timestamp"),
    field("windowCloseAt", "iso-timestamp"),
    field("predictedProbability", "number"),
    field("predictionLowerBound", "number"),
    field("predictionUpperBound", "number"),
    field("modelVersionRef", "string"),
    field("calibrationVersionRef", "string"),
    field("queueSnapshotHash", "sha256-hex"),
    field("supportingMetricRefs", "readonly string[]"),
    field("explanationVectorRef", "string"),
  ],
  QueueHealthSnapshot: [
    field("queueHealthSnapshotId", "string"),
    field("queueCode", "string"),
    field("depth", "number"),
    field("medianAge", "number"),
    field("p95Age", "number"),
    field("arrivalRate", "number"),
    field("clearRate", "number"),
    field("utilization", "number"),
    field("aggregateBreachProbability", "number"),
    field("breachRiskCount", "number"),
    field("escalationCount", "number"),
    field("anomalyState", "OperationalAlertState", true, "anomalyState"),
    field("capturedAt", "iso-timestamp"),
  ],
  DependencyHealthRecord: [
    field("dependencyHealthRecordId", "string"),
    field("dependencyCode", "string"),
    field("healthState", "DependencyHealthState", true, "healthState"),
    field("latencyP95", "number"),
    field("errorRate", "number"),
    field("timeoutRate", "number"),
    field("fallbackState", "DependencyFallbackState", true, "fallbackState"),
    field("availabilityScore", "number"),
    field("delayHazardRef", "string"),
    field("capturedAt", "iso-timestamp"),
  ],
  EquitySliceMetric: [
    field("equitySliceMetricId", "string"),
    field("sliceDefinition", "string"),
    field("metricSetRef", "string"),
    field("periodWindow", "PeriodWindowSpec"),
    field("effectiveSampleSize", "number"),
    field("varianceMagnitude", "number"),
    field("confidenceBandRef", "string"),
    field("persistenceState", "EquityPersistenceState", true, "persistenceState"),
    field("varianceState", "EquityVarianceState", true, "varianceState"),
  ],
  MetricAnomalySnapshot: [
    field("metricAnomalySnapshotId", "string"),
    field("metricDefinitionRef", "string"),
    field("observedValue", "number"),
    field("expectedValue", "number"),
    field("standardizedResidual", "number"),
    field("ewmaScore", "number"),
    field("cusumPositiveScore", "number"),
    field("cusumNegativeScore", "number"),
    field("support", "number"),
    field("alertState", "OperationalAlertState", true, "alertState"),
    field("thresholdPolicyRef", "string"),
    field("capturedAt", "iso-timestamp"),
  ],
  ContinuityControlHealthProjection: [
    field("continuityControlHealthProjectionId", "string"),
    field("controlCode", "ContinuityControlCode", true, "controlCode"),
    field("scopeRef", "string"),
    field("producerFamilyRefs", "readonly string[]"),
    field("routeContinuityEvidenceContractRefs", "readonly string[]"),
    field("requiredAssuranceSliceTrustRefs", "readonly string[]"),
    field("experienceContinuityEvidenceRefs", "readonly string[]"),
    field("continuityTupleHashes", "readonly string[]"),
    field("continuitySetHash", "sha256-hex"),
    field("latestSettlementOrRestoreRef", "string"),
    field("latestReturnOrContinuationRef", "string"),
    field("supportingSymptomRefs", "readonly string[]"),
    field("trustLowerBound", "number"),
    field("validationBasisHash", "sha256-hex"),
    field("validationState", "ContinuityValidationState", true, "validationState"),
    field("blockingRefs", "readonly string[]"),
    field("recommendedHandoffRef", "string"),
    field("capturedAt", "iso-timestamp"),
  ],
  OpsOverviewContextFrame: [
    field("contextFrameId", "string"),
    field("scopeRef", "string"),
    field("timeHorizonRef", "string"),
    field("filterDigest", "sha256-hex"),
    field("projectionBundleRef", "string"),
    field("macroStateRef", "string"),
    field("boardStateSnapshotRef", "string"),
    field("boardTupleHash", "sha256-hex"),
    field("activeSelectionLeaseRefs", "readonly string[]"),
    field("actionEligibilityFenceRef", "string"),
    field("returnTokenRef", "string"),
    field("selectedSliceRef", "string"),
    field("viewMode", "OperationalViewMode", true, "viewMode"),
  ],
  OpsOverviewSliceEnvelope: [
    field("sliceEnvelopeId", "string"),
    field("surfaceCode", "OperationalSurfaceCode", true, "surfaceCode"),
    field("projectionRef", "string"),
    field("boardTupleHash", "sha256-hex"),
    field("selectedEntityTupleHash", "sha256-hex"),
    field("freshnessState", "OperationalFreshnessState", true, "freshnessState"),
    field("trustState", "Phase9AssuranceTrustState", true, "trustState"),
    field("trustLowerBound", "number"),
    field("integrityScore", "number"),
    field("completenessState", "Phase9AssuranceCompletenessState", true, "completenessState"),
    field("confidenceBandRef", "string"),
    field("blockingDependencyRefs", "readonly string[]"),
    field("releaseTrustFreezeVerdictRef", "string"),
    field("actionEligibilityState", "OperationalActionEligibilityState", true, "actionEligibilityState"),
    field("diagnosticOnlyReasonRef", "string", false),
    field("renderMode", "OperationalRenderMode", true, "renderMode"),
  ],
  InvestigationDrawerSession: [
    field("drawerSessionId", "string"),
    field("openedFromSurface", "OperationalSurfaceCode", true, "surfaceCode"),
    field("sourceSliceEnvelopeRef", "string"),
    field("sourceSnapshotRef", "string"),
    field("sourceBoardTupleHash", "sha256-hex"),
    field("selectedEntityRef", "string"),
    field("selectedEntityTupleHash", "sha256-hex"),
    field("continuityQuestionHash", "sha256-hex"),
    field("baseContinuityControlHealthProjectionRef", "string"),
    field("baseOpsContinuityEvidenceSliceRef", "string"),
    field("baseExperienceContinuityEvidenceRefs", "readonly string[]"),
    field("baseAssuranceSliceTrustRefs", "readonly string[]"),
    field("baseContinuityTupleHashes", "readonly string[]"),
    field("baseContinuitySetHash", "sha256-hex"),
    field("baseLatestSettlementOrRestoreRef", "string"),
    field("returnContextFrameRef", "string"),
    field("diffBaseRef", "string"),
    field("observeOnlyReasonRef", "string"),
    field("deltaState", "OperationalDrawerDeltaState", true, "deltaState"),
    field("lastDeltaComputedAt", "iso-timestamp"),
  ],
  InterventionCandidateLease: [
    field("candidateLeaseId", "string"),
    field("candidateRef", "string"),
    field("actionScopeRef", "string"),
    field("sourceSliceEnvelopeRef", "string"),
    field("opsBoardStateSnapshotRef", "string"),
    field("opsSelectionLeaseRef", "string"),
    field("opsRouteIntentRef", "string"),
    field("opsDeltaGateRef", "string"),
    field("opsReturnTokenRef", "string"),
    field("boardTupleHash", "sha256-hex"),
    field("selectedEntityTupleHash", "sha256-hex"),
    field("releaseTrustFreezeVerdictRef", "string"),
    field("governingObjectRef", "string"),
    field("eligibilityState", "InterventionEligibilityState", true, "eligibilityState"),
    field("policyBundleRef", "string"),
    field("expiresAt", "iso-timestamp"),
  ],
  LiveBoardDeltaWindow: [
    field("deltaWindowId", "string"),
    field("contextFrameRef", "string"),
    field("baseBoardTupleHash", "sha256-hex"),
    field("selectionLeaseRefs", "readonly string[]"),
    field("pauseStartedAt", "iso-timestamp"),
    field("queuedDeltaRefs", "readonly string[]"),
    field("queuedTupleDriftRefs", "readonly string[]"),
    field("materialChangeCount", "number"),
    field("resumeStrategy", "LiveBoardResumeStrategy", true, "resumeStrategy"),
    field("resumeCheckpointRef", "string"),
  ],
} as const satisfies Record<Phase9OperationalContractName, readonly Phase9OperationalFieldDefinition[]>;

function enumValuesForFields(fields: readonly Phase9OperationalFieldDefinition[]): Record<string, readonly string[]> {
  const values: Record<string, readonly string[]> = {};
  for (const spec of fields) {
    if (spec.enumRef) {
      values[spec.fieldName] = phase9OperationalEnumValues[spec.enumRef];
    }
  }
  return values;
}

function identityKeyFor(contractName: Phase9OperationalContractName): string {
  const fields = phase9OperationalFieldSpecs[contractName];
  const idField = fields.find((spec) => spec.fieldName.endsWith("Id"));
  invariant(idField, "OPERATIONAL_ID_FIELD_MISSING", `${contractName} is missing an identity field.`);
  return idField.fieldName;
}

function operationalContractDefinition(
  contractName: Phase9OperationalContractName,
): Phase9OperationalContractDefinition {
  const fields = phase9OperationalFieldSpecs[contractName];
  const identityKey = identityKeyFor(contractName);
  const requiredFields = fields.filter((spec) => spec.required).map((spec) => spec.fieldName);
  const optionalFields = fields.filter((spec) => !spec.required).map((spec) => spec.fieldName);
  return {
    contractName,
    schemaVersion: PHASE9_OPERATIONAL_CONTRACT_VERSION,
    sourceAlgorithmRef: "blueprint/phase-9-the-assurance-ledger.md#9B",
    fieldNames: fields.map((spec) => spec.fieldName),
    requiredFields,
    optionalFields,
    fields,
    enumValues: enumValuesForFields(fields),
    tenantScopeConstraints: [
      "Metric definitions and snapshots must carry tenantScope, scopeRef, or actionScopeRef where aggregation can cross boundaries.",
      "Cross-tenant aggregation is denied unless a governed visibility projection policy narrows every source into the same explicit scope.",
      "Dashboard DTOs may not contain PHI unless the selected investigation scope explicitly grants it; normal operations overview DTOs are reference-only.",
    ],
    identityKeys: [identityKey],
    idempotencyKeys: [identityKey, "tenantScope|scopeRef|actionScopeRef", "normalizationVersionRef|modelVersionRef"],
    versioningStrategy: [
      `contract schema pinned to ${PHASE9_OPERATIONAL_CONTRACT_VERSION}`,
      `breach-risk model pinned to ${PHASE9_OPERATIONAL_MODEL_VERSION}`,
      `anomaly model pinned to ${PHASE9_OPERATIONAL_ANOMALY_MODEL_VERSION}`,
      `normalization pinned to ${PHASE9_OPERATIONAL_NORMALIZATION_VERSION}`,
      "baseline, calibration, threshold, working-calendar, and dashboard posture policies are versioned refs, never local constants",
    ],
    canonicalHashInputs: fields.map((spec) => spec.fieldName),
    piiPhiClassification:
      "Operational reference metadata only; dashboard DTOs must use refs and bounded scope seeds rather than inline PHI.",
    retentionClassRef: "operational_projection_short_window_with_assurance_refs",
    auditEventMapping: [
      `analytics_assurance.phase9.${contractName}.created`,
      `analytics_assurance.phase9.${contractName}.evaluated`,
      `analytics_assurance.phase9.${contractName}.downgraded_or_superseded`,
    ],
    migrationCompatibilityNotes: [
      "Unsupported metric normalization versions fail closed and cannot promote dashboard posture.",
      "Calibration, baseline, and threshold model changes require deterministic replay against fixture event streams.",
      "Late, duplicate, and out-of-order events update projection rebuild paths, not live request handling.",
    ],
    validStateExamples: [`data/fixtures/433_phase9_operational_projection_fixtures.json#/examples/${contractName}`],
    invalidStateExamples: [
      `invalid:${contractName}:missing-required-field`,
      `invalid:${contractName}:bad-enum-or-trust-boundary-bypass`,
    ],
  };
}

export const phase9OperationalContractDefinitions = REQUIRED_PHASE9_OPERATIONAL_CONTRACTS.map(
  operationalContractDefinition,
) as readonly Phase9OperationalContractDefinition[];

export interface Phase9OperationalValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export function validateOperationalContractDefinitionCoverage(
  definitions: readonly Phase9OperationalContractDefinition[] = phase9OperationalContractDefinitions,
): Phase9OperationalValidationResult {
  const errors: string[] = [];
  const names = new Set(definitions.map((definition) => definition.contractName));
  for (const requiredName of REQUIRED_PHASE9_OPERATIONAL_CONTRACTS) {
    if (!names.has(requiredName)) {
      errors.push(`MISSING_OPERATIONAL_CONTRACT:${requiredName}`);
    }
  }
  if (names.size !== definitions.length) {
    errors.push("DUPLICATE_OPERATIONAL_CONTRACT_NAME");
  }
  const allFields = new Set(definitions.flatMap((definition) => definition.fieldNames));
  for (const fieldName of [
    "freshnessState",
    "trustState",
    "completenessState",
    "trustLowerBound",
    "aggregateBreachProbability",
    "standardizedResidual",
    "ewmaScore",
    "cusumPositiveScore",
    "cusumNegativeScore",
    "effectiveSampleSize",
    "boardTupleHash",
    "actionEligibilityState",
    "renderMode",
  ]) {
    if (!allFields.has(fieldName)) {
      errors.push(`MISSING_REQUIRED_OPERATIONAL_AXIS:${fieldName}`);
    }
  }
  for (const definition of definitions) {
    if (definition.requiredFields.length === 0) {
      errors.push(`CONTRACT_REQUIRED_FIELDS_EMPTY:${definition.contractName}`);
    }
    if (definition.versioningStrategy.length === 0 || definition.canonicalHashInputs.length === 0) {
      errors.push(`CONTRACT_METADATA_INCOMPLETE:${definition.contractName}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateOperationalContractObject(
  contractName: Phase9OperationalContractName,
  value: unknown,
): Phase9OperationalValidationResult {
  if (!isRecord(value)) {
    return { valid: false, errors: [`OPERATIONAL_OBJECT_NOT_RECORD:${contractName}`] };
  }
  const definition = phase9OperationalContractDefinitions.find((candidate) => candidate.contractName === contractName);
  invariant(definition, "OPERATIONAL_CONTRACT_DEFINITION_MISSING", `${contractName} definition is missing.`);
  const errors: string[] = [];
  for (const requiredField of definition.requiredFields) {
    const fieldValue = value[requiredField];
    if (
      fieldValue === undefined ||
      fieldValue === null ||
      (typeof fieldValue === "string" && fieldValue.trim().length === 0)
    ) {
      errors.push(`MISSING_REQUIRED_FIELD:${contractName}.${requiredField}`);
    }
  }
  for (const fieldSpec of definition.fields) {
    if (!fieldSpec.enumRef) {
      continue;
    }
    const fieldValue = value[fieldSpec.fieldName];
    if (fieldValue !== undefined && !phase9OperationalEnumValues[fieldSpec.enumRef].includes(fieldValue as never)) {
      errors.push(`INVALID_ENUM:${contractName}.${fieldSpec.fieldName}:${String(fieldValue)}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function assertValidOperationalContractObject(
  contractName: Phase9OperationalContractName,
  value: unknown,
): void {
  const result = validateOperationalContractObject(contractName, value);
  invariant(result.valid, "OPERATIONAL_CONTRACT_OBJECT_INVALID", result.errors.join("; "));
}

export interface SLOAlertThresholds {
  readonly watch: number;
  readonly elevated: number;
  readonly critical: number;
}

export interface SLOProfile {
  readonly sloProfileId: string;
  readonly functionCode: string;
  readonly availabilityTarget: number;
  readonly latencyTarget: number;
  readonly freshnessTarget: number;
  readonly restoreTarget: number;
  readonly workingTimeCalendarRef: string;
  readonly alertThresholds: SLOAlertThresholds;
  readonly calibrationPolicyRef: string;
}

export interface MetricExpressionSpec {
  readonly expressionRef: string;
  readonly sourceFieldRefs: readonly string[];
}

export interface AggregationWindowSpec {
  readonly windowRef: string;
  readonly durationMinutes: number;
  readonly maxLookbackMinutes: number;
}

export interface PeriodWindowSpec {
  readonly periodStart: string;
  readonly periodEnd: string;
}

export interface OperationalMetricDefinition {
  readonly metricDefinitionId: string;
  readonly metricCode: string;
  readonly sourceProjection: string;
  readonly numeratorSpec: MetricExpressionSpec;
  readonly denominatorSpec: MetricExpressionSpec;
  readonly aggregationWindow: AggregationWindowSpec;
  readonly tenantScope: string;
  readonly ownerRole: string;
  readonly baselineModelRef: string;
  readonly minimumSupport: number;
  readonly thresholdPolicyRef: string;
  readonly normalizationVersionRef: string;
}

export interface BreachRiskRecord {
  readonly breachRiskRecordId: string;
  readonly entityType: string;
  readonly entityRef: string;
  readonly riskType: BreachRiskType;
  readonly severity: BreachRiskSeverity;
  readonly predictedAt: string;
  readonly windowCloseAt: string;
  readonly predictedProbability: number;
  readonly predictionLowerBound: number;
  readonly predictionUpperBound: number;
  readonly modelVersionRef: string;
  readonly calibrationVersionRef: string;
  readonly queueSnapshotHash: string;
  readonly supportingMetricRefs: readonly string[];
  readonly explanationVectorRef: string;
}

export interface QueueHealthSnapshot {
  readonly queueHealthSnapshotId: string;
  readonly queueCode: string;
  readonly depth: number;
  readonly medianAge: number;
  readonly p95Age: number;
  readonly arrivalRate: number;
  readonly clearRate: number;
  readonly utilization: number;
  readonly aggregateBreachProbability: number;
  readonly breachRiskCount: number;
  readonly escalationCount: number;
  readonly anomalyState: OperationalAlertState;
  readonly capturedAt: string;
}

export interface DependencyHealthRecord {
  readonly dependencyHealthRecordId: string;
  readonly dependencyCode: string;
  readonly healthState: DependencyHealthState;
  readonly latencyP95: number;
  readonly errorRate: number;
  readonly timeoutRate: number;
  readonly fallbackState: DependencyFallbackState;
  readonly availabilityScore: number;
  readonly delayHazardRef: string;
  readonly capturedAt: string;
}

export interface EquitySliceMetric {
  readonly equitySliceMetricId: string;
  readonly sliceDefinition: string;
  readonly metricSetRef: string;
  readonly periodWindow: PeriodWindowSpec;
  readonly effectiveSampleSize: number;
  readonly varianceMagnitude: number;
  readonly confidenceBandRef: string;
  readonly persistenceState: EquityPersistenceState;
  readonly varianceState: EquityVarianceState;
}

export interface MetricAnomalySnapshot {
  readonly metricAnomalySnapshotId: string;
  readonly metricDefinitionRef: string;
  readonly observedValue: number;
  readonly expectedValue: number;
  readonly standardizedResidual: number;
  readonly ewmaScore: number;
  readonly cusumPositiveScore: number;
  readonly cusumNegativeScore: number;
  readonly support: number;
  readonly alertState: OperationalAlertState;
  readonly thresholdPolicyRef: string;
  readonly capturedAt: string;
}

export interface ContinuityControlHealthProjection {
  readonly continuityControlHealthProjectionId: string;
  readonly controlCode: ContinuityControlCode;
  readonly scopeRef: string;
  readonly producerFamilyRefs: readonly string[];
  readonly routeContinuityEvidenceContractRefs: readonly string[];
  readonly requiredAssuranceSliceTrustRefs: readonly string[];
  readonly experienceContinuityEvidenceRefs: readonly string[];
  readonly continuityTupleHashes: readonly string[];
  readonly continuitySetHash: string;
  readonly latestSettlementOrRestoreRef: string;
  readonly latestReturnOrContinuationRef: string;
  readonly supportingSymptomRefs: readonly string[];
  readonly trustLowerBound: number;
  readonly validationBasisHash: string;
  readonly validationState: ContinuityValidationState;
  readonly blockingRefs: readonly string[];
  readonly recommendedHandoffRef: string;
  readonly capturedAt: string;
}

export interface OpsOverviewContextFrame {
  readonly contextFrameId: string;
  readonly scopeRef: string;
  readonly timeHorizonRef: string;
  readonly filterDigest: string;
  readonly projectionBundleRef: string;
  readonly macroStateRef: string;
  readonly boardStateSnapshotRef: string;
  readonly boardTupleHash: string;
  readonly activeSelectionLeaseRefs: readonly string[];
  readonly actionEligibilityFenceRef: string;
  readonly returnTokenRef: string;
  readonly selectedSliceRef: string;
  readonly viewMode: OperationalViewMode;
}

export interface OpsOverviewSliceEnvelope {
  readonly sliceEnvelopeId: string;
  readonly surfaceCode: OperationalSurfaceCode;
  readonly projectionRef: string;
  readonly boardTupleHash: string;
  readonly selectedEntityTupleHash: string;
  readonly freshnessState: OperationalFreshnessState;
  readonly trustState: Phase9AssuranceTrustState;
  readonly trustLowerBound: number;
  readonly integrityScore: number;
  readonly completenessState: Phase9AssuranceCompletenessState;
  readonly confidenceBandRef: string;
  readonly blockingDependencyRefs: readonly string[];
  readonly releaseTrustFreezeVerdictRef: string;
  readonly actionEligibilityState: OperationalActionEligibilityState;
  readonly diagnosticOnlyReasonRef?: string;
  readonly renderMode: OperationalRenderMode;
}

export interface InvestigationDrawerSession {
  readonly drawerSessionId: string;
  readonly openedFromSurface: OperationalSurfaceCode;
  readonly sourceSliceEnvelopeRef: string;
  readonly sourceSnapshotRef: string;
  readonly sourceBoardTupleHash: string;
  readonly selectedEntityRef: string;
  readonly selectedEntityTupleHash: string;
  readonly continuityQuestionHash: string;
  readonly baseContinuityControlHealthProjectionRef: string;
  readonly baseOpsContinuityEvidenceSliceRef: string;
  readonly baseExperienceContinuityEvidenceRefs: readonly string[];
  readonly baseAssuranceSliceTrustRefs: readonly string[];
  readonly baseContinuityTupleHashes: readonly string[];
  readonly baseContinuitySetHash: string;
  readonly baseLatestSettlementOrRestoreRef: string;
  readonly returnContextFrameRef: string;
  readonly diffBaseRef: string;
  readonly observeOnlyReasonRef: string;
  readonly deltaState: OperationalDrawerDeltaState;
  readonly lastDeltaComputedAt: string;
}

export interface InterventionCandidateLease {
  readonly candidateLeaseId: string;
  readonly candidateRef: string;
  readonly actionScopeRef: string;
  readonly sourceSliceEnvelopeRef: string;
  readonly opsBoardStateSnapshotRef: string;
  readonly opsSelectionLeaseRef: string;
  readonly opsRouteIntentRef: string;
  readonly opsDeltaGateRef: string;
  readonly opsReturnTokenRef: string;
  readonly boardTupleHash: string;
  readonly selectedEntityTupleHash: string;
  readonly releaseTrustFreezeVerdictRef: string;
  readonly governingObjectRef: string;
  readonly eligibilityState: InterventionEligibilityState;
  readonly policyBundleRef: string;
  readonly expiresAt: string;
}

export interface LiveBoardDeltaWindow {
  readonly deltaWindowId: string;
  readonly contextFrameRef: string;
  readonly baseBoardTupleHash: string;
  readonly selectionLeaseRefs: readonly string[];
  readonly pauseStartedAt: string;
  readonly queuedDeltaRefs: readonly string[];
  readonly queuedTupleDriftRefs: readonly string[];
  readonly materialChangeCount: number;
  readonly resumeStrategy: LiveBoardResumeStrategy;
  readonly resumeCheckpointRef: string;
}

export interface DashboardMetricTileContract {
  readonly stateLabel: string;
  readonly stateReason: string;
  readonly primaryValue: string;
  readonly confidenceOrBound: string;
  readonly lastUpdated: string;
  readonly freshnessState: OperationalFreshnessState;
  readonly trustState: Phase9AssuranceTrustState;
  readonly completenessState: Phase9AssuranceCompletenessState;
  readonly blockingRefs: readonly string[];
  readonly allowedDrillIns: readonly string[];
  readonly investigationScopeSeed: string;
}

export const OPS_DASHBOARD_DATA_BOUNDARY_FIELDS = [
  "stateLabel",
  "stateReason",
  "primaryValue",
  "confidenceOrBound",
  "lastUpdated",
  "freshnessState",
  "trustState",
  "completenessState",
  "blockingRefs",
  "allowedDrillIns",
  "investigationScopeSeed",
] as const;

export const essentialFunctionMetricSeeds = [
  ["request_intake_health", "RequestIntakeStatusProjection"],
  ["triage_queue_health", "TriageQueueProjection"],
  ["more_info_loop_latency", "PatientMoreInfoStatusProjection"],
  ["booking_search_success", "PatientAppointmentWorkspaceProjection"],
  ["booking_commit_success", "BookingConfirmationTruthProjection"],
  ["waitlist_conversion", "WaitlistContinuationTruthProjection"],
  ["hub_coordination_delay", "HubCoordinationCaseProjection"],
  ["pharmacy_dispatch_latency", "PharmacyDispatchTruthProjection"],
  ["pharmacy_bounce_back_outcome_latency", "PharmacyOutcomeTruthProjection"],
  ["patient_message_delivery", "PatientCommunicationVisibilityProjection"],
  ["patient_home_navigation_continuity", "PatientExperienceContinuityEvidenceProjection"],
  ["record_followup_recovery_integrity", "PatientRecordFollowUpEligibilityProjection"],
  ["conversation_settlement_support_replay", "ConversationThreadProjection"],
  ["support_replay_restore_integrity", "SupportReplayRestoreSettlement"],
  ["assistive_session_trust_continuity", "AssuranceSliceTrustRecord"],
  ["evidence_graph_health", "AssuranceEvidenceGraphSnapshot"],
  ["projection_rebuild_health", "ProjectionHealthSnapshot"],
  ["dependency_health", "DependencyHealthRecord"],
  ["audit_projection_staleness", "ControlStatusSnapshot"],
] as const;

export function createOperationalMetricDefinition(
  metricCode: string,
  sourceProjection: string,
  tenantScope = "tenant:demo-gp",
): OperationalMetricDefinition {
  return {
    metricDefinitionId: `omd_433_${metricCode}`,
    metricCode,
    sourceProjection,
    numeratorSpec: {
      expressionRef: `metric:${metricCode}:numerator:v1`,
      sourceFieldRefs: [`${sourceProjection}.currentState`, `${sourceProjection}.settlementState`],
    },
    denominatorSpec: {
      expressionRef: `metric:${metricCode}:denominator:v1`,
      sourceFieldRefs: [`${sourceProjection}.eligibleExposureSet`],
    },
    aggregationWindow: {
      windowRef: "ops:last-60m",
      durationMinutes: 60,
      maxLookbackMinutes: 240,
    },
    tenantScope,
    ownerRole: "operations_lead",
    baselineModelRef: `baseline:${metricCode}:calendar-segment:v1`,
    minimumSupport: 30,
    thresholdPolicyRef: `threshold:${metricCode}:ops:v1`,
    normalizationVersionRef: PHASE9_OPERATIONAL_NORMALIZATION_VERSION,
  };
}

export const essentialFunctionMetricDefinitions = essentialFunctionMetricSeeds.map(([metricCode, sourceProjection]) =>
  createOperationalMetricDefinition(metricCode, sourceProjection),
) as readonly OperationalMetricDefinition[];

export function hashOperationalMetricDefinition(metricDefinition: OperationalMetricDefinition): string {
  return hashAssurancePayload(metricDefinition, "phase9.operational.metricDefinition");
}

export interface CalibrationPoint {
  readonly rawProbability: number;
  readonly calibratedProbability: number;
}

export interface BreachRiskCalculationInput {
  readonly breachRiskRecordId: string;
  readonly entityType: string;
  readonly entityRef: string;
  readonly riskType: BreachRiskType;
  readonly severity: BreachRiskSeverity;
  readonly predictedAt: string;
  readonly windowCloseAt: string;
  readonly workingMinuteSlack?: number;
  readonly effectiveWorkloadAheadMinutes: number;
  readonly laneCapacityP10WorkloadMinutesPerWorkingMinute: number;
  readonly staffedAvailabilityMultiplier: number;
  readonly dependencyDegradationMultiplier: number;
  readonly serviceMeanMinutes: number;
  readonly serviceVarianceMinutesSquared: number;
  readonly dependencyDelayMeanMinutes: number;
  readonly dependencyDelayVarianceMinutesSquared: number;
  readonly severityWeight: number;
  readonly breachWindowMinutes: number;
  readonly modelVersionRef?: string;
  readonly calibrationVersionRef?: string;
  readonly calibrationEffectiveSampleSize?: number;
  readonly calibrationMap?: readonly CalibrationPoint[];
  readonly queueSnapshotHash: string;
  readonly supportingMetricRefs: readonly string[];
  readonly explanationVectorRef: string;
}

export interface BreachRiskComputation {
  readonly slackWorkingMinutes: number;
  readonly effectiveWorkloadMinutes: number;
  readonly conservativeCapacityLowerBound: number;
  readonly estimatedWaitMinutes: number;
  readonly serviceMeanMinutes: number;
  readonly dependencyDelayMeanMinutes: number;
  readonly totalRiskHorizonMeanMinutes: number;
  readonly totalRiskHorizonVariance: number;
  readonly gammaShape: number;
  readonly gammaScale: number;
  readonly rawBreachProbability: number;
  readonly calibratedBreachProbability: number;
  readonly predictionLowerBound: number;
  readonly predictionUpperBound: number;
  readonly priority: number;
  readonly record: BreachRiskRecord;
}

function logGamma(z: number): number {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  let x = 0.9999999999998099;
  const shifted = z - 1;
  for (let index = 0; index < coefficients.length; index += 1) {
    x += coefficients[index]! / (shifted + index + 1);
  }
  const t = shifted + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(x);
}

function regularizedGammaP(shape: number, x: number): number {
  ensurePositiveNumber(shape, "gammaShape");
  if (x <= 0) {
    return 0;
  }
  if (x < shape + 1) {
    let ap = shape;
    let sum = 1 / shape;
    let delta = sum;
    for (let n = 1; n <= 100; n += 1) {
      ap += 1;
      delta *= x / ap;
      sum += delta;
      if (Math.abs(delta) < Math.abs(sum) * 1e-12) {
        break;
      }
    }
    return clampUnit(sum * Math.exp(-x + shape * Math.log(x) - logGamma(shape)));
  }
  let b = x + 1 - shape;
  let c = 1 / 1e-30;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= 100; i += 1) {
    const an = -i * (i - shape);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) {
      d = 1e-30;
    }
    c = b + an / c;
    if (Math.abs(c) < 1e-30) {
      c = 1e-30;
    }
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-12) {
      break;
    }
  }
  return clampUnit(1 - Math.exp(-x + shape * Math.log(x) - logGamma(shape)) * h);
}

function gammaSurvival(value: number, shape: number, scale: number): number {
  if (value <= 0) {
    return 1;
  }
  return clampUnit(1 - regularizedGammaP(shape, value / scale));
}

function applyMonotoneCalibration(rawProbability: number, calibrationMap?: readonly CalibrationPoint[]): number {
  const raw = ensureUnitInterval(rawProbability, "rawProbability");
  if (!calibrationMap || calibrationMap.length === 0) {
    return raw;
  }
  const sorted = [...calibrationMap].sort((left, right) => left.rawProbability - right.rawProbability);
  let previous = sorted[0]!;
  for (const current of sorted) {
    ensureUnitInterval(current.rawProbability, "calibrationRawProbability");
    ensureUnitInterval(current.calibratedProbability, "calibrationCalibratedProbability");
    if (raw <= current.rawProbability) {
      const span = Math.max(1e-6, current.rawProbability - previous.rawProbability);
      const t = clampUnit((raw - previous.rawProbability) / span);
      return clampUnit(
        previous.calibratedProbability + t * (current.calibratedProbability - previous.calibratedProbability),
      );
    }
    previous = current;
  }
  return clampUnit(sorted[sorted.length - 1]!.calibratedProbability);
}

function wilsonInterval(probability: number, sampleSize: number, z = 1.96): readonly [number, number] {
  const p = ensureUnitInterval(probability, "probability");
  const n = Math.max(1, sampleSize);
  const zSquared = z * z;
  const denominator = 1 + zSquared / n;
  const center = p + zSquared / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + zSquared / (4 * n * n));
  return [clampUnit((center - margin) / denominator), clampUnit((center + margin) / denominator)] as const;
}

export function calculateBreachRisk(input: BreachRiskCalculationInput): BreachRiskComputation {
  const slackWorkingMinutes = ensureFiniteNumber(
    input.workingMinuteSlack ?? minutesBetween(input.predictedAt, input.windowCloseAt),
    "workingMinuteSlack",
  );
  const effectiveWorkloadMinutes = Math.max(0, ensureFiniteNumber(input.effectiveWorkloadAheadMinutes, "B_i"));
  const conservativeCapacityLowerBound =
    ensurePositiveNumber(input.laneCapacityP10WorkloadMinutesPerWorkingMinute, "laneCapacityP10") *
    ensurePositiveNumber(input.staffedAvailabilityMultiplier, "staffedAvailabilityMultiplier") *
    ensurePositiveNumber(input.dependencyDegradationMultiplier, "dependencyDegradationMultiplier");
  const estimatedWaitMinutes = effectiveWorkloadMinutes / Math.max(1e-6, conservativeCapacityLowerBound);
  const serviceMeanMinutes = ensurePositiveNumber(input.serviceMeanMinutes, "serviceMeanMinutes");
  const dependencyDelayMeanMinutes = Math.max(0, ensureFiniteNumber(input.dependencyDelayMeanMinutes, "D_i"));
  const totalRiskHorizonMeanMinutes = estimatedWaitMinutes + serviceMeanMinutes + dependencyDelayMeanMinutes;
  const totalRiskHorizonVariance =
    Math.max(1e-6, input.serviceVarianceMinutesSquared) +
    Math.max(0, input.dependencyDelayVarianceMinutesSquared);
  const gammaShape =
    (totalRiskHorizonMeanMinutes * totalRiskHorizonMeanMinutes) / Math.max(1e-6, totalRiskHorizonVariance);
  const gammaScale = totalRiskHorizonVariance / Math.max(1e-6, totalRiskHorizonMeanMinutes);
  const rawBreachProbability =
    slackWorkingMinutes > 0 ? gammaSurvival(slackWorkingMinutes, gammaShape, gammaScale) : 1;
  const calibratedBreachProbability = applyMonotoneCalibration(rawBreachProbability, input.calibrationMap);
  const [predictionLowerBound, predictionUpperBound] = wilsonInterval(
    calibratedBreachProbability,
    input.calibrationEffectiveSampleSize ?? 200,
  );
  const priority =
    ensurePositiveNumber(input.severityWeight, "severityWeight") *
    calibratedBreachProbability *
    (1 + Math.max(0, -slackWorkingMinutes) / ensurePositiveNumber(input.breachWindowMinutes, "breachWindowMinutes"));
  const record: BreachRiskRecord = {
    breachRiskRecordId: input.breachRiskRecordId,
    entityType: input.entityType,
    entityRef: input.entityRef,
    riskType: input.riskType,
    severity: input.severity,
    predictedAt: input.predictedAt,
    windowCloseAt: input.windowCloseAt,
    predictedProbability: calibratedBreachProbability,
    predictionLowerBound,
    predictionUpperBound,
    modelVersionRef: input.modelVersionRef ?? PHASE9_OPERATIONAL_MODEL_VERSION,
    calibrationVersionRef: input.calibrationVersionRef ?? "calibration:identity:v1",
    queueSnapshotHash: input.queueSnapshotHash,
    supportingMetricRefs: input.supportingMetricRefs,
    explanationVectorRef: input.explanationVectorRef,
  };
  assertValidOperationalContractObject("BreachRiskRecord", record);
  return {
    slackWorkingMinutes,
    effectiveWorkloadMinutes,
    conservativeCapacityLowerBound,
    estimatedWaitMinutes,
    serviceMeanMinutes,
    dependencyDelayMeanMinutes,
    totalRiskHorizonMeanMinutes,
    totalRiskHorizonVariance,
    gammaShape,
    gammaScale,
    rawBreachProbability,
    calibratedBreachProbability,
    predictionLowerBound,
    predictionUpperBound,
    priority,
    record,
  };
}

export function calculateQueueAggregateBreachProbability(
  records: readonly Pick<BreachRiskRecord, "predictedProbability" | "entityRef" | "riskType">[],
): number {
  const deduped = new Map<string, number>();
  for (const record of records) {
    const key = `${record.entityRef}:${record.riskType}`;
    const probability = ensureUnitInterval(record.predictedProbability, "predictedProbability");
    deduped.set(key, Math.max(deduped.get(key) ?? 0, probability));
  }
  return clampUnit(1 - [...deduped.values()].reduce((product, probability) => product * (1 - probability), 1));
}

export interface MetricAnomalyPolicy {
  readonly lambda: number;
  readonly cusumSlack: number;
  readonly watchResidual: number;
  readonly elevatedScore: number;
  readonly criticalScore: number;
  readonly exitWatchResidual: number;
  readonly exitElevatedScore: number;
  readonly exitCriticalScore: number;
  readonly exitHoldEvaluations: number;
}

export const defaultMetricAnomalyPolicy: MetricAnomalyPolicy = {
  lambda: 0.35,
  cusumSlack: 0.5,
  watchResidual: 1,
  elevatedScore: 2,
  criticalScore: 4,
  exitWatchResidual: 0.5,
  exitElevatedScore: 1.2,
  exitCriticalScore: 2.5,
  exitHoldEvaluations: 2,
};

export interface MetricAnomalyEvaluationInput {
  readonly metricAnomalySnapshotId: string;
  readonly metricDefinitionRef: string;
  readonly observedValue: number;
  readonly expectedValue: number;
  readonly sigmaHat: number;
  readonly sigmaFloor: number;
  readonly previousEwmaScore?: number;
  readonly previousCusumPositiveScore?: number;
  readonly previousCusumNegativeScore?: number;
  readonly previousAlertState?: OperationalAlertState;
  readonly previousExitHoldCount?: number;
  readonly support: number;
  readonly minimumSupport: number;
  readonly thresholdPolicyRef: string;
  readonly capturedAt: string;
  readonly policy?: Partial<MetricAnomalyPolicy>;
}

export interface MetricAnomalyEvaluation {
  readonly snapshot: MetricAnomalySnapshot;
  readonly exitHoldCount: number;
}

function alertRank(state: OperationalAlertState): number {
  return { normal: 0, watch: 1, elevated: 2, critical: 3 }[state];
}

function alertFromRank(rank: number): OperationalAlertState {
  if (rank >= 3) {
    return "critical";
  }
  if (rank >= 2) {
    return "elevated";
  }
  if (rank >= 1) {
    return "watch";
  }
  return "normal";
}

export function evaluateMetricAnomaly(input: MetricAnomalyEvaluationInput): MetricAnomalyEvaluation {
  const policy = { ...defaultMetricAnomalyPolicy, ...input.policy };
  const sigma = Math.max(ensurePositiveNumber(input.sigmaFloor, "sigmaFloor"), Math.abs(input.sigmaHat));
  const standardizedResidual = (input.observedValue - input.expectedValue) / sigma;
  const ewmaScore =
    ensureUnitInterval(policy.lambda, "lambda") * standardizedResidual +
    (1 - policy.lambda) * (input.previousEwmaScore ?? 0);
  const cusumPositiveScore = Math.max(
    0,
    (input.previousCusumPositiveScore ?? 0) + standardizedResidual - policy.cusumSlack,
  );
  const cusumNegativeScore = Math.max(
    0,
    (input.previousCusumNegativeScore ?? 0) - standardizedResidual - policy.cusumSlack,
  );
  const support = Math.max(0, input.support);
  let candidateState: OperationalAlertState = "normal";
  if (support >= input.minimumSupport) {
    const absoluteEwma = Math.abs(ewmaScore);
    const oneSidedCusum = Math.max(cusumPositiveScore, cusumNegativeScore);
    if (absoluteEwma >= policy.criticalScore || oneSidedCusum >= policy.criticalScore) {
      candidateState = "critical";
    } else if (absoluteEwma >= policy.elevatedScore || oneSidedCusum >= policy.elevatedScore) {
      candidateState = "elevated";
    } else if (Math.abs(standardizedResidual) >= policy.watchResidual) {
      candidateState = "watch";
    }
  }
  const previousState = input.previousAlertState ?? "normal";
  let exitHoldCount = input.previousExitHoldCount ?? 0;
  if (alertRank(candidateState) < alertRank(previousState)) {
    const lowerExitSatisfied =
      Math.abs(standardizedResidual) <= policy.exitWatchResidual &&
      Math.abs(ewmaScore) <= policy.exitElevatedScore &&
      Math.max(cusumPositiveScore, cusumNegativeScore) <= policy.exitCriticalScore;
    exitHoldCount = lowerExitSatisfied ? exitHoldCount + 1 : 0;
    if (exitHoldCount < policy.exitHoldEvaluations) {
      candidateState = previousState;
    }
  } else {
    exitHoldCount = 0;
  }
  const snapshot: MetricAnomalySnapshot = {
    metricAnomalySnapshotId: input.metricAnomalySnapshotId,
    metricDefinitionRef: input.metricDefinitionRef,
    observedValue: input.observedValue,
    expectedValue: input.expectedValue,
    standardizedResidual,
    ewmaScore,
    cusumPositiveScore,
    cusumNegativeScore,
    support,
    alertState: candidateState,
    thresholdPolicyRef: input.thresholdPolicyRef,
    capturedAt: input.capturedAt,
  };
  assertValidOperationalContractObject("MetricAnomalySnapshot", snapshot);
  return { snapshot, exitHoldCount };
}

export interface EquitySliceMetricInput {
  readonly equitySliceMetricId: string;
  readonly sliceDefinition: string;
  readonly metricSetRef: string;
  readonly periodWindow: PeriodWindowSpec;
  readonly effectiveSampleSize: number;
  readonly varianceMagnitude: number;
  readonly confidenceBandRef: string;
  readonly minimumSupport: number;
  readonly watchThreshold?: number;
  readonly elevatedThreshold?: number;
  readonly criticalThreshold?: number;
  readonly previousVarianceState?: EquityVarianceState;
}

export function evaluateEquitySliceMetric(input: EquitySliceMetricInput): EquitySliceMetric {
  const effectiveSampleSize = Math.max(0, input.effectiveSampleSize);
  const varianceMagnitude = Math.max(0, input.varianceMagnitude);
  if (effectiveSampleSize < input.minimumSupport) {
    return {
      equitySliceMetricId: input.equitySliceMetricId,
      sliceDefinition: input.sliceDefinition,
      metricSetRef: input.metricSetRef,
      periodWindow: input.periodWindow,
      effectiveSampleSize,
      varianceMagnitude,
      confidenceBandRef: input.confidenceBandRef,
      persistenceState: "insufficient_support",
      varianceState: "insufficient_support",
    };
  }
  const critical = input.criticalThreshold ?? 0.25;
  const elevated = input.elevatedThreshold ?? 0.15;
  const watch = input.watchThreshold ?? 0.08;
  const varianceState: EquityVarianceState =
    varianceMagnitude >= critical
      ? "critical"
      : varianceMagnitude >= elevated
        ? "elevated"
        : varianceMagnitude >= watch
          ? "watch"
          : "normal";
  return {
    equitySliceMetricId: input.equitySliceMetricId,
    sliceDefinition: input.sliceDefinition,
    metricSetRef: input.metricSetRef,
    periodWindow: input.periodWindow,
    effectiveSampleSize,
    varianceMagnitude,
    confidenceBandRef: input.confidenceBandRef,
    persistenceState:
      input.previousVarianceState && input.previousVarianceState === varianceState && varianceState !== "normal"
        ? "persistent"
        : varianceState === "normal"
          ? "resolved"
          : "new",
    varianceState,
  };
}

export interface TenantMetricSourceRef {
  readonly sourceRef: string;
  readonly tenantScope: string;
}

export function validateMetricAggregationTenantScope(
  expectedTenantScope: string,
  sources: readonly TenantMetricSourceRef[],
): Phase9OperationalValidationResult {
  const errors = sources
    .filter((source) => source.tenantScope !== expectedTenantScope)
    .map((source) => `CROSS_TENANT_METRIC_SOURCE:${source.sourceRef}`);
  return { valid: errors.length === 0, errors };
}

export function derivePermittedDashboardPosture(
  envelope: Pick<
    OpsOverviewSliceEnvelope,
    "freshnessState" | "trustState" | "completenessState" | "actionEligibilityState"
  >,
): OperationalRenderMode {
  if (
    envelope.freshnessState !== "fresh" ||
    envelope.trustState !== "trusted" ||
    envelope.completenessState !== "complete" ||
    envelope.actionEligibilityState !== "interactive"
  ) {
    return envelope.actionEligibilityState === "blocked" || envelope.trustState === "quarantined" ? "blocked" : "observe_only";
  }
  return "interactive";
}

export function validateOpsOverviewSliceEnvelope(envelope: OpsOverviewSliceEnvelope): Phase9OperationalValidationResult {
  const errors = [...validateOperationalContractObject("OpsOverviewSliceEnvelope", envelope).errors];
  const permittedRenderMode = derivePermittedDashboardPosture(envelope);
  if (envelope.renderMode !== permittedRenderMode) {
    errors.push(`DASHBOARD_POSTURE_MISMATCH:${envelope.sliceEnvelopeId}:${permittedRenderMode}`);
  }
  if (envelope.renderMode === "interactive" && envelope.blockingDependencyRefs.length > 0) {
    errors.push(`DASHBOARD_INTERACTIVE_WITH_BLOCKERS:${envelope.sliceEnvelopeId}`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateDashboardMetricTileContract(value: unknown): Phase9OperationalValidationResult {
  if (!isRecord(value)) {
    return { valid: false, errors: ["DASHBOARD_TILE_NOT_RECORD"] };
  }
  const errors: string[] = [];
  for (const fieldName of OPS_DASHBOARD_DATA_BOUNDARY_FIELDS) {
    if (value[fieldName] === undefined || value[fieldName] === null) {
      errors.push(`DASHBOARD_FIELD_MISSING:${fieldName}`);
    }
  }
  if (
    value.freshnessState === "fresh" &&
    value.trustState === "trusted" &&
    value.completenessState === "complete"
  ) {
    return { valid: errors.length === 0, errors };
  }
  if (value.stateLabel === "Normal" && errors.length === 0) {
    errors.push("DASHBOARD_STALE_OR_INCOMPLETE_MARKED_NORMAL");
  }
  return { valid: errors.length === 0, errors };
}

export interface InterventionCandidateEligibilityInput {
  readonly sourceSlice: OpsOverviewSliceEnvelope;
  readonly boardTupleHash: string;
  readonly selectedEntityTupleHash: string;
  readonly selectionLeaseState: "live" | "stale_review" | "invalidated" | "released";
  readonly deltaGateState: "safe_apply" | "released" | "frozen_diagnostic" | "reconcile_required" | "stale_reacquire" | "read_only_recovery";
  readonly releaseSurfaceAuthorityState: "live" | "diagnostic_only" | "recovery_only" | "blocked";
  readonly drawerDeltaState?: OperationalDrawerDeltaState;
  readonly continuityMatchesSession?: boolean;
}

export function deriveInterventionCandidateEligibility(
  input: InterventionCandidateEligibilityInput,
): InterventionEligibilityState {
  if (input.releaseSurfaceAuthorityState === "blocked" || input.sourceSlice.renderMode === "blocked") {
    return "blocked";
  }
  if (input.drawerDeltaState === "blocked") {
    return "blocked";
  }
  if (
    input.drawerDeltaState === "drifted" ||
    input.drawerDeltaState === "superseded" ||
    input.continuityMatchesSession === false ||
    input.boardTupleHash !== input.sourceSlice.boardTupleHash ||
    input.selectedEntityTupleHash !== input.sourceSlice.selectedEntityTupleHash ||
    input.selectionLeaseState !== "live" ||
    input.deltaGateState === "stale_reacquire"
  ) {
    return "stale_reacquire";
  }
  if (input.deltaGateState === "read_only_recovery" || input.releaseSurfaceAuthorityState === "recovery_only") {
    return "read_only_recovery";
  }
  if (
    input.sourceSlice.renderMode !== "interactive" ||
    input.deltaGateState === "frozen_diagnostic" ||
    input.deltaGateState === "reconcile_required" ||
    input.releaseSurfaceAuthorityState !== "live"
  ) {
    return "observe_only";
  }
  return "executable";
}

export function deriveLiveBoardResumeStrategy(window: Pick<LiveBoardDeltaWindow, "materialChangeCount" | "queuedTupleDriftRefs">): LiveBoardResumeStrategy {
  if (window.queuedTupleDriftRefs.length > 0) {
    return "stale_reacquire";
  }
  if (window.materialChangeCount >= 3) {
    return "step_review";
  }
  if (window.materialChangeCount > 0) {
    return "apply_in_place";
  }
  return "reopen_drawer_base";
}

export type Phase9OperationalContractObject =
  | SLOProfile
  | OperationalMetricDefinition
  | BreachRiskRecord
  | QueueHealthSnapshot
  | DependencyHealthRecord
  | EquitySliceMetric
  | MetricAnomalySnapshot
  | ContinuityControlHealthProjection
  | OpsOverviewContextFrame
  | OpsOverviewSliceEnvelope
  | InvestigationDrawerSession
  | InterventionCandidateLease
  | LiveBoardDeltaWindow;

export interface Phase9OperationalProjectionFixture {
  readonly schemaVersion: typeof PHASE9_OPERATIONAL_CONTRACT_VERSION;
  readonly phase8ExitPacketRef: string;
  readonly phase9AssuranceContractsRef: string;
  readonly generatedAt: string;
  readonly contractNames: readonly Phase9OperationalContractName[];
  readonly metricDefinitions: readonly OperationalMetricDefinition[];
  readonly metricDefinitionSetHash: string;
  readonly breachRiskTerms: BreachRiskComputation;
  readonly queueAggregateBreachProbability: number;
  readonly dashboardDataBoundaryFields: readonly string[];
  readonly examples: Record<Phase9OperationalContractName, Phase9OperationalContractObject>;
  readonly contractSetHash: string;
}

function sampleHash(label: string): string {
  return hashAssurancePayload({ sample: label }, "phase9.operational.fixture.sample");
}

export function createPhase9OperationalProjectionFixture(): Phase9OperationalProjectionFixture {
  const now = "2026-04-27T09:00:00.000Z";
  const tenantScope = "tenant:demo-gp";
  const boardTupleHash = sampleHash("ops.overview.boardTuple");
  const selectedEntityTupleHash = sampleHash("ops.overview.selectedEntity");
  const metricDefinitions = essentialFunctionMetricDefinitions;
  const metricDefinitionSetHash = orderedSetHash(
    metricDefinitions.map((definition) => hashOperationalMetricDefinition(definition)),
    "phase9.operational.metricDefinitionSet",
  );

  const sloProfile: SLOProfile = {
    sloProfileId: "slo_433_request_intake",
    functionCode: "request_intake_health",
    availabilityTarget: 0.995,
    latencyTarget: 15,
    freshnessTarget: 2,
    restoreTarget: 60,
    workingTimeCalendarRef: "calendar:gp-working-time:v1",
    alertThresholds: { watch: 0.2, elevated: 0.5, critical: 0.8 },
    calibrationPolicyRef: "calibration:ops:identity:v1",
  };

  const breachRiskTerms = calculateBreachRisk({
    breachRiskRecordId: "brr_433_triage_case_001",
    entityType: "triage_task",
    entityRef: "triage-task:demo-001",
    riskType: "sla_breach",
    severity: "high",
    predictedAt: now,
    windowCloseAt: "2026-04-27T10:00:00.000Z",
    effectiveWorkloadAheadMinutes: 84,
    laneCapacityP10WorkloadMinutesPerWorkingMinute: 2,
    staffedAvailabilityMultiplier: 0.8,
    dependencyDegradationMultiplier: 0.75,
    serviceMeanMinutes: 12,
    serviceVarianceMinutesSquared: 16,
    dependencyDelayMeanMinutes: 8,
    dependencyDelayVarianceMinutesSquared: 9,
    severityWeight: 2,
    breachWindowMinutes: 60,
    calibrationEffectiveSampleSize: 300,
    queueSnapshotHash: sampleHash("queue.snapshot"),
    supportingMetricRefs: ["omd_433_triage_queue_health", "omd_433_dependency_health"],
    explanationVectorRef: "explain:triage-task:demo-001",
  });

  const lowerRiskTerms = calculateBreachRisk({
    ...breachRiskTerms.record,
    breachRiskRecordId: "brr_433_triage_case_002",
    entityRef: "triage-task:demo-002",
    effectiveWorkloadAheadMinutes: 20,
    laneCapacityP10WorkloadMinutesPerWorkingMinute: 2.5,
    staffedAvailabilityMultiplier: 1,
    dependencyDegradationMultiplier: 1,
    serviceMeanMinutes: 10,
    serviceVarianceMinutesSquared: 9,
    dependencyDelayMeanMinutes: 0,
    dependencyDelayVarianceMinutesSquared: 0,
    severityWeight: 1,
    breachWindowMinutes: 60,
    queueSnapshotHash: sampleHash("queue.snapshot"),
    supportingMetricRefs: ["omd_433_triage_queue_health"],
    explanationVectorRef: "explain:triage-task:demo-002",
  });

  const queueAggregateBreachProbability = calculateQueueAggregateBreachProbability([
    breachRiskTerms.record,
    lowerRiskTerms.record,
  ]);

  const queueHealthSnapshot: QueueHealthSnapshot = {
    queueHealthSnapshotId: "qhs_433_triage",
    queueCode: "triage_queue",
    depth: 42,
    medianAge: 18,
    p95Age: 92,
    arrivalRate: 5.2,
    clearRate: 4.7,
    utilization: 0.88,
    aggregateBreachProbability: queueAggregateBreachProbability,
    breachRiskCount: 7,
    escalationCount: 2,
    anomalyState: "watch",
    capturedAt: now,
  };

  const dependencyHealthRecord: DependencyHealthRecord = {
    dependencyHealthRecordId: "dhr_433_message_transport",
    dependencyCode: "patient_message_transport",
    healthState: "degraded",
    latencyP95: 240,
    errorRate: 0.03,
    timeoutRate: 0.01,
    fallbackState: "available",
    availabilityScore: 0.96,
    delayHazardRef: "delay-hazard:message-transport:p95",
    capturedAt: now,
  };

  const equitySliceMetric = evaluateEquitySliceMetric({
    equitySliceMetricId: "esm_433_waitlist_age_band",
    sliceDefinition: "age_band:65_plus",
    metricSetRef: "metric-set:waitlist-conversion",
    periodWindow: {
      periodStart: "2026-04-01T00:00:00.000Z",
      periodEnd: "2026-04-27T09:00:00.000Z",
    },
    effectiveSampleSize: 118,
    varianceMagnitude: 0.11,
    confidenceBandRef: "confidence:waitlist-age-band:433",
    minimumSupport: 30,
  });

  const anomaly = evaluateMetricAnomaly({
    metricAnomalySnapshotId: "mas_433_triage_queue",
    metricDefinitionRef: "omd_433_triage_queue_health",
    observedValue: 0.71,
    expectedValue: 0.48,
    sigmaHat: 0.08,
    sigmaFloor: 0.05,
    support: 96,
    minimumSupport: 30,
    thresholdPolicyRef: "threshold:triage_queue_health:ops:v1",
    capturedAt: now,
  }).snapshot;

  const continuityProjection: ContinuityControlHealthProjection = {
    continuityControlHealthProjectionId: "cchp_433_patient_nav",
    controlCode: "patient_nav",
    scopeRef: tenantScope,
    producerFamilyRefs: ["patient-portal", "operations-console"],
    routeContinuityEvidenceContractRefs: ["route-continuity:patient-nav:v1"],
    requiredAssuranceSliceTrustRefs: ["astr_432_ops_overview"],
    experienceContinuityEvidenceRefs: ["ecce_432_ops_overview"],
    continuityTupleHashes: [sampleHash("continuity.tuple.patient-nav")],
    continuitySetHash: sampleHash("continuity.set.patient-nav"),
    latestSettlementOrRestoreRef: "settlement:patient-nav:433",
    latestReturnOrContinuationRef: "return-contract:patient-nav:433",
    supportingSymptomRefs: ["qhs_433_triage", "dhr_433_message_transport"],
    trustLowerBound: 0.9,
    validationBasisHash: sampleHash("continuity.validation.basis"),
    validationState: "trusted",
    blockingRefs: [],
    recommendedHandoffRef: "handoff:none",
    capturedAt: now,
  };

  const contextFrame: OpsOverviewContextFrame = {
    contextFrameId: "oocf_433_ops_overview",
    scopeRef: tenantScope,
    timeHorizonRef: "ops:horizon:today",
    filterDigest: sampleHash("ops.filter.digest"),
    projectionBundleRef: "projection-bundle:ops-overview:433",
    macroStateRef: "macro-state:watch",
    boardStateSnapshotRef: "ops-board-snapshot:433",
    boardTupleHash,
    activeSelectionLeaseRefs: ["ops-selection-lease:433"],
    actionEligibilityFenceRef: "ops-action-fence:433",
    returnTokenRef: "ops-return-token:433",
    selectedSliceRef: "slice-envelope:433:north-star",
    viewMode: "live",
  };

  const sliceEnvelope: OpsOverviewSliceEnvelope = {
    sliceEnvelopeId: "oose_433_north_star",
    surfaceCode: "NorthStarBand",
    projectionRef: "ops-overview-projection:433",
    boardTupleHash,
    selectedEntityTupleHash,
    freshnessState: "fresh",
    trustState: "trusted",
    trustLowerBound: 0.9,
    integrityScore: 0.98,
    completenessState: "complete",
    confidenceBandRef: "confidence:ops-overview:433",
    blockingDependencyRefs: [],
    releaseTrustFreezeVerdictRef: "release-trust-freeze-verdict:432",
    actionEligibilityState: "interactive",
    renderMode: "interactive",
  };

  const investigationDrawerSession: InvestigationDrawerSession = {
    drawerSessionId: "ids_433_triage_case_001",
    openedFromSurface: "BottleneckRadar",
    sourceSliceEnvelopeRef: sliceEnvelope.sliceEnvelopeId,
    sourceSnapshotRef: queueHealthSnapshot.queueHealthSnapshotId,
    sourceBoardTupleHash: boardTupleHash,
    selectedEntityRef: "triage-task:demo-001",
    selectedEntityTupleHash,
    continuityQuestionHash: sampleHash("continuity.question.patient-nav"),
    baseContinuityControlHealthProjectionRef: continuityProjection.continuityControlHealthProjectionId,
    baseOpsContinuityEvidenceSliceRef: "ops-continuity-evidence-slice:433",
    baseExperienceContinuityEvidenceRefs: ["ecce_432_ops_overview"],
    baseAssuranceSliceTrustRefs: ["astr_432_ops_overview"],
    baseContinuityTupleHashes: continuityProjection.continuityTupleHashes,
    baseContinuitySetHash: continuityProjection.continuitySetHash,
    baseLatestSettlementOrRestoreRef: continuityProjection.latestSettlementOrRestoreRef,
    returnContextFrameRef: contextFrame.contextFrameId,
    diffBaseRef: "diff-base:433:triage-case-001",
    observeOnlyReasonRef: "observe-only:none",
    deltaState: "aligned",
    lastDeltaComputedAt: now,
  };

  const interventionCandidateLease: InterventionCandidateLease = {
    candidateLeaseId: "icl_433_triage_rebalance",
    candidateRef: "intervention:triage-rebalance:433",
    actionScopeRef: tenantScope,
    sourceSliceEnvelopeRef: sliceEnvelope.sliceEnvelopeId,
    opsBoardStateSnapshotRef: contextFrame.boardStateSnapshotRef,
    opsSelectionLeaseRef: "ops-selection-lease:433",
    opsRouteIntentRef: "route-intent:/ops/overview:intervention",
    opsDeltaGateRef: "ops-delta-gate:433",
    opsReturnTokenRef: contextFrame.returnTokenRef,
    boardTupleHash,
    selectedEntityTupleHash,
    releaseTrustFreezeVerdictRef: sliceEnvelope.releaseTrustFreezeVerdictRef,
    governingObjectRef: "triage-queue:demo",
    eligibilityState: deriveInterventionCandidateEligibility({
      sourceSlice: sliceEnvelope,
      boardTupleHash,
      selectedEntityTupleHash,
      selectionLeaseState: "live",
      deltaGateState: "safe_apply",
      releaseSurfaceAuthorityState: "live",
      drawerDeltaState: investigationDrawerSession.deltaState,
      continuityMatchesSession: true,
    }),
    policyBundleRef: "policy-bundle:ops-interventions:v1",
    expiresAt: "2026-04-27T09:15:00.000Z",
  };

  const liveBoardDeltaWindow: LiveBoardDeltaWindow = {
    deltaWindowId: "lbdw_433_ops_overview_pause",
    contextFrameRef: contextFrame.contextFrameId,
    baseBoardTupleHash: boardTupleHash,
    selectionLeaseRefs: contextFrame.activeSelectionLeaseRefs,
    pauseStartedAt: now,
    queuedDeltaRefs: ["ops-delta:433:001"],
    queuedTupleDriftRefs: [],
    materialChangeCount: 1,
    resumeStrategy: "apply_in_place",
    resumeCheckpointRef: "resume-checkpoint:433",
  };

  const examples = {
    SLOProfile: sloProfile,
    OperationalMetricDefinition: metricDefinitions[0]!,
    BreachRiskRecord: breachRiskTerms.record,
    QueueHealthSnapshot: queueHealthSnapshot,
    DependencyHealthRecord: dependencyHealthRecord,
    EquitySliceMetric: equitySliceMetric,
    MetricAnomalySnapshot: anomaly,
    ContinuityControlHealthProjection: continuityProjection,
    OpsOverviewContextFrame: contextFrame,
    OpsOverviewSliceEnvelope: sliceEnvelope,
    InvestigationDrawerSession: investigationDrawerSession,
    InterventionCandidateLease: interventionCandidateLease,
    LiveBoardDeltaWindow: liveBoardDeltaWindow,
  } satisfies Record<Phase9OperationalContractName, Phase9OperationalContractObject>;

  for (const contractName of REQUIRED_PHASE9_OPERATIONAL_CONTRACTS) {
    assertValidOperationalContractObject(contractName, examples[contractName]);
  }

  const contractSetHash = orderedSetHash(
    phase9OperationalContractDefinitions.map((definition) => ({
      contractName: definition.contractName,
      requiredFields: definition.requiredFields,
      enumValues: definition.enumValues,
      canonicalHashInputs: definition.canonicalHashInputs,
    })),
    "phase9.operational.contractSet",
  );

  return {
    schemaVersion: PHASE9_OPERATIONAL_CONTRACT_VERSION,
    phase8ExitPacketRef: "data/contracts/431_phase8_exit_packet.json",
    phase9AssuranceContractsRef: "data/contracts/432_phase9_assurance_ledger_contracts.json",
    generatedAt: now,
    contractNames: REQUIRED_PHASE9_OPERATIONAL_CONTRACTS,
    metricDefinitions,
    metricDefinitionSetHash,
    breachRiskTerms,
    queueAggregateBreachProbability,
    dashboardDataBoundaryFields: OPS_DASHBOARD_DATA_BOUNDARY_FIELDS,
    examples,
    contractSetHash,
  };
}

export function phase9OperationalMetricMatrixToCsv(
  metricDefinitions: readonly OperationalMetricDefinition[] = essentialFunctionMetricDefinitions,
): string {
  const rows = [
    [
      "metricCode",
      "sourceProjection",
      "tenantScope",
      "aggregationWindow",
      "minimumSupport",
      "thresholdPolicyRef",
      "normalizationVersionRef",
      "definitionHash",
    ],
    ...metricDefinitions.map((definition) => [
      definition.metricCode,
      definition.sourceProjection,
      definition.tenantScope,
      definition.aggregationWindow.windowRef,
      String(definition.minimumSupport),
      definition.thresholdPolicyRef,
      definition.normalizationVersionRef,
      hashOperationalMetricDefinition(definition),
    ]),
  ];
  return `${rows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = cell.replaceAll('"', '""');
          return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
        })
        .join(","),
    )
    .join("\n")}\n`;
}

export function summarizePhase9OperationalContractFreeze(
  fixture: Phase9OperationalProjectionFixture = createPhase9OperationalProjectionFixture(),
): string {
  return [
    "# 433 Phase 9 Operational Projection Contract Freeze",
    "",
    `Schema version: ${fixture.schemaVersion}`,
    `Phase 8 exit packet: ${fixture.phase8ExitPacketRef}`,
    `Phase 9 assurance contracts: ${fixture.phase9AssuranceContractsRef}`,
    `Contract count: ${fixture.contractNames.length}`,
    `Contract set hash: ${fixture.contractSetHash}`,
    `Metric definition count: ${fixture.metricDefinitions.length}`,
    `Metric definition set hash: ${fixture.metricDefinitionSetHash}`,
    `Fixture aggregate breach probability: ${fixture.queueAggregateBreachProbability.toFixed(6)}`,
    "",
    "## Frozen Contracts",
    "",
    ...fixture.contractNames.map((contractName) => `- ${contractName}`),
    "",
    "## Dashboard Boundary",
    "",
    ...OPS_DASHBOARD_DATA_BOUNDARY_FIELDS.map((fieldName) => `- ${fieldName}`),
    "",
    "## Fail-Closed Rules",
    "",
    "- Stale, degraded, quarantined, or incomplete slices cannot render as interactive or normal.",
    "- Queue-level breach probability is rendered from `P_any_breach_q = 1 - prod(1 - P_breach_i)` after deduplication.",
    "- Low-support equity slices are `insufficient_support`, not normal.",
    "- Intervention leases degrade when board tuple, selected entity tuple, release posture, delta gate, selection lease, or continuity proof basis drifts.",
    "- Dashboard DTOs expose refs and scope seeds, not inline PHI.",
    "",
  ].join("\n");
}

export function phase9OperationalAlgorithmAlignmentNotes(): string {
  return [
    "# 433 Phase 9 Operational Algorithm Alignment Notes",
    "",
    "- Source algorithm: `blueprint/phase-9-the-assurance-ledger.md#9B`.",
    "- Breach risk freezes working-minute slack, effective workload, conservative capacity lower bound, estimated wait, service time, dependency delay, Gamma moments, calibrated probability, Wilson interval bounds, queue-level aggregate probability, and priority.",
    "- Anomaly state freezes expected value source, standardized residual, EWMA, positive and negative CUSUM, minimum support, hysteresis, alert states, and de-escalation holds.",
    "- Essential-function metrics are versioned definitions over operational source projections, not UI-local counters.",
    "- Trust and completeness boundaries require freshness, trust, completeness, affected scope, graph or verdict refs where assurance-derived, blockers, and permitted dashboard posture.",
    "- Dashboard contracts expose `stateLabel`, `stateReason`, `primaryValue`, `confidenceOrBound`, `lastUpdated`, `trustState`, `blockingRefs`, `allowedDrillIns`, and `investigationScopeSeed`.",
    "- Unsupported metric normalization, cross-tenant aggregation, missing trust/completeness state, stale projection, or low-support equity data fail closed.",
    "",
  ].join("\n");
}
