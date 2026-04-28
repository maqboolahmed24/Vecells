import {
  type CompareAndSetWriteOptions,
  RequestBackboneInvariantError,
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
    `${field} must be between 0 and 1.`,
  );
  return value;
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function minutesBetween(startAt: string, endAt: string): number {
  return Math.round((Date.parse(endAt) - Date.parse(startAt)) / 60000);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function stableQueueDigestHex(value: string): string {
  let left = 0x811c9dc5 ^ value.length;
  let right = 0x9e3779b9 ^ value.length;
  let upper = 0xc2b2ae35 ^ value.length;
  let lower = 0x27d4eb2f ^ value.length;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    left = Math.imul(left ^ code, 0x01000193);
    right = Math.imul(right ^ code, 0x85ebca6b);
    upper = Math.imul(upper ^ code, 0xc2b2ae35);
    lower = Math.imul(lower ^ code, 0x27d4eb2f);
  }

  left = Math.imul(left ^ (right >>> 16), 0x85ebca6b);
  right = Math.imul(right ^ (upper >>> 15), 0xc2b2ae35);
  upper = Math.imul(upper ^ (lower >>> 13), 0x27d4eb2f);
  lower = Math.imul(lower ^ (left >>> 16), 0x165667b1);

  return [left, right, upper, lower]
    .map((segment) => (segment >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

function saveWithCas<T extends { version: number }>(
  map: Map<string, T>,
  key: string,
  row: T,
  options?: CompareAndSetWriteOptions,
): void {
  const current = map.get(key);
  if (options?.expectedVersion !== undefined) {
    invariant(
      current?.version === options.expectedVersion,
      "OPTIMISTIC_CONCURRENCY_MISMATCH",
      `Expected version ${options.expectedVersion} for ${key}, received ${current?.version ?? "missing"}.`,
    );
  } else if (current) {
    invariant(
      current.version < row.version,
      "NON_MONOTONE_SAVE",
      `Persisted version for ${key} must increase monotonically.`,
    );
  }
  map.set(key, row);
}

export const queueRankingContractCatalog = {
  taskId: "par_073",
  visualMode: "Queue_Rank_Explanation_Studio",
  schemaArtifactPaths: [
    "packages/api-contracts/schemas/queue-rank-plan.schema.json",
    "packages/api-contracts/schemas/queue-rank-snapshot.schema.json",
    "packages/api-contracts/schemas/queue-rank-entry.schema.json",
    "packages/api-contracts/schemas/queue-assignment-suggestion-snapshot.schema.json",
  ],
  scenarioCount: 6,
  validatorCount: 6,
} as const;

export const queueRankingSchemas = [
  {
    schemaId: "QueueRankPlan",
    artifactPath: "packages/api-contracts/schemas/queue-rank-plan.schema.json",
    generatedByTask: "par_073",
  },
  {
    schemaId: "QueueRankSnapshot",
    artifactPath: "packages/api-contracts/schemas/queue-rank-snapshot.schema.json",
    generatedByTask: "par_073",
  },
  {
    schemaId: "QueueRankEntry",
    artifactPath: "packages/api-contracts/schemas/queue-rank-entry.schema.json",
    generatedByTask: "par_073",
  },
  {
    schemaId: "QueueAssignmentSuggestionSnapshot",
    artifactPath: "packages/api-contracts/schemas/queue-assignment-suggestion-snapshot.schema.json",
    generatedByTask: "par_073",
  },
] as const;

export type QueueOverloadState = "nominal" | "overload_critical";
export type QueueEligibilityState =
  | "eligible"
  | "held_preemption"
  | "held_trust"
  | "excluded_scope";
export type QueueRiskBand = "none" | "watch" | "warn" | "critical";
export type QueueFairnessPromiseState = "active" | "suppressed_overload";
export type QueueFairnessMergeClass = "critical_bypass" | "routine_fair_merge" | "held";
export type QueueTrustState = "trusted" | "stale" | "quarantined";

export interface QueueEligibilityRuleSet {
  requireTrustedFactCut: boolean;
  requireTrustInputs: boolean;
  blockAssimilationPending: boolean;
  blockPreemptionPending: boolean;
  excludeScopeBlocked: boolean;
}

export interface QueueBandThresholds {
  watch: number;
  warn: number;
  critical: number;
}

export interface QueueLexicographicTierPolicy {
  precedenceKeys: readonly [
    "escalated",
    "slaClass",
    "clinicalPriorityBand",
    "maxRiskBand",
    "duplicateReviewFlag",
    "urgencyCarry",
  ];
  riskBandThresholds: QueueBandThresholds;
  stableTailKeys?: readonly ["withinTierUrgency", "queueEnteredAt", "canonicalTieBreakKey"];
  criticalBypassRule?: string;
}

export interface QueueWithinTierWeightSet {
  thetaSlaCriticalMinutes: number;
  thetaSlaWarnMinutes: number;
  tauSlaMinutes: number;
  tauLateMinutes: number;
  lateHorizonMinutes: number;
  tauReturnMinutes: number;
  returnHorizonMinutes: number;
  tauAgeMinutes: number;
  ageCapMinutes: number;
  minimumServiceMinutes: number;
  betaWarn: number;
  betaLate: number;
  weightSla: number;
  weightAge: number;
  weightResidual: number;
  weightContact: number;
  weightReturn: number;
  weightCarry: number;
  weightVulnerability: number;
  returnBase: number;
  returnDelta: number;
  returnWait: number;
}

export interface QueueFairnessBandPolicy {
  fairnessBandRef: string;
  fixedBandOrder: number;
  q_b: number;
  gamma_age: number;
  A_b_minutes: number;
  H_b_minutes: number;
  s_quantum_minutes: number;
  eligibilitySummary?: string;
}

export interface QueueFairnessMergePolicy {
  algorithm: string;
  C_max: number;
  bands: readonly QueueFairnessBandPolicy[];
}

export interface QueueOverloadGuardPolicy {
  formula: string;
  rhoGuard: number;
  overloadEventId: string;
  suppressedPromises: readonly string[];
  triggeredResponses: readonly string[];
}

export interface QueueAssignmentSuggestionPolicy {
  formula: string;
  candidateWindowSize: number;
  lambda_skill: number;
  lambda_cont: number;
  lambda_load: number;
  lambda_sticky: number;
  lambda_ctx: number;
  lambda_focus: number;
  epsilon_assign: number;
  softWipCapRatio: number;
  mayRewriteCanonicalOrder: boolean;
}

export interface QueueRankPlanPolicyBundle {
  eligibilityRules: QueueEligibilityRuleSet;
  lexicographicTierPolicy: QueueLexicographicTierPolicy;
  withinTierWeightSet: QueueWithinTierWeightSet;
  fairnessMergePolicy: QueueFairnessMergePolicy;
  overloadGuardPolicy: QueueOverloadGuardPolicy;
  assignmentSuggestionPolicy: QueueAssignmentSuggestionPolicy;
}

export interface QueueRankPlanSnapshot {
  queueRankPlanId: string;
  queueFamilyRef: string;
  eligibilityRuleSetRef: string;
  lexicographicTierPolicyRef: string;
  withinTierWeightSetRef: string;
  fairnessMergePolicyRef: string;
  overloadGuardPolicyRef: string;
  assignmentSuggestionPolicyRef: string;
  explanationSchemaRef: string;
  canonicalTieBreakPolicyRef: string;
  planHash: string;
  effectiveAt: string;
  version: number;
  policyBundle: QueueRankPlanPolicyBundle;
}

export interface QueueRankSnapshot {
  rankSnapshotId: string;
  queueRef: string;
  queueRankPlanRef: string;
  asOfAt: string;
  sourceFactCutRef: string;
  trustInputRefs: readonly string[];
  eligibleTaskRefs: readonly string[];
  excludedTaskRefs: readonly string[];
  overloadState: QueueOverloadState;
  fairnessCycleStateRef: string;
  rowOrderHash: string;
  generatedAt: string;
  version: number;
}

export interface QueueRankExplanationPayload {
  planHash: string;
  sourceFactCutRef: string;
  overloadState: QueueOverloadState;
  eligibilityState: QueueEligibilityState;
  holdReasonRefs: readonly string[];
  lexicographicKeys: {
    escalated: number;
    slaClass: number;
    clinicalPriorityBand: number;
    maxRiskBand: number;
    duplicateReviewFlag: number;
    urgencyCarry: number;
  };
  normalizedFactors: {
    slaPressure: number;
    ageLift: number;
    residualRisk: number;
    contactRisk: number;
    returnLift: number;
    urgencyCarry: number;
    vulnerability: number;
    routingGap: number;
    withinTierUrgency: number;
  };
  rawFactors: {
    ageMinutes: number;
    returnAgeMinutes: number;
    expectedServiceMinutes: number;
    dSlaMinutes: number;
    laxityMinutes: number;
    rhoCritical: number | null;
  };
  policyFactors: {
    slaWarn: number;
    slaLate: number;
    priorityOrdinal: number;
    residual: number;
    contactRisk: number;
    returnedFlag: boolean;
    evidenceDeltaSeverity: number;
    coverageFit: number;
    duplicateReviewFlag: boolean;
  };
  fairnessTransition: {
    fairnessBandRef: string;
    before: number;
    after: number;
    promiseState: QueueFairnessPromiseState;
    mergeClass: QueueFairnessMergeClass;
  };
  tieBreak: {
    canonicalTieBreakKey: string;
    queueEnteredAt: string;
  };
}

export interface QueueRankEntrySnapshot {
  rankEntryId: string;
  rankSnapshotRef: string;
  taskRef: string;
  ordinal: number;
  eligibilityState: QueueEligibilityState;
  lexicographicTier: string;
  urgencyScore: number;
  residualBand: QueueRiskBand;
  contactRiskBand: QueueRiskBand;
  duplicateReviewFlag: boolean;
  urgencyCarry: number;
  fairnessBandRef: string;
  fairnessCreditBefore: number;
  fairnessCreditAfter: number;
  canonicalTieBreakKey: string;
  explanationPayloadRef: string;
  generatedAt: string;
  version: number;
  normalizedExplanationPayload: QueueRankExplanationPayload;
}

export interface QueueAssignmentSuggestionRow {
  taskRef: string;
  ordinal: number;
  reviewerRef: string | null;
  suggestionScore: number;
  governedAutoClaimEligible: boolean;
  canonicalTieBreakKey: string;
  explanationPayloadRef: string;
  reasonRefs: readonly string[];
}

export interface QueueAssignmentSuggestionSnapshot {
  suggestionSnapshotId: string;
  rankSnapshotRef: string;
  reviewerScopeRef: string;
  candidateWindowSize: number;
  suggestionRows: readonly QueueAssignmentSuggestionRow[];
  governedAutoClaimRefs: readonly string[];
  generatedAt: string;
  version: number;
  fairnessPromiseState: QueueFairnessPromiseState;
}

export interface QueueRankTaskFact {
  taskRef: string;
  queueEnteredAt: string;
  slaTargetAt: string;
  expectedHandleMinutes: number;
  clinicalPriorityBand: number;
  residualRisk: number;
  contactRisk: number;
  assimilationPending: boolean;
  preemptionPending: boolean;
  escalated: boolean;
  returned: boolean;
  evidenceDeltaSeverity: number;
  urgencyCarry: number;
  vulnerability: number;
  coverageFit: number;
  duplicateReviewFlag: boolean;
  fairnessBandRef: string;
  trustState: QueueTrustState;
  missingTrustInputRefs: readonly string[];
  scopeExcluded: boolean;
  lastMaterialReturnAt?: string | null;
  archetypeRef?: string | null;
}

export interface QueueRankingTelemetry {
  criticalArrivalRatePerHour: number;
  empiricalServiceRatePerHour: number;
  activeReviewerCount: number;
}

export interface QueueRankingFactCut {
  queueRef: string;
  queueFamilyRef: string;
  sourceFactCutRef: string;
  asOfAt: string;
  generatedAt: string;
  trustInputRefs: readonly string[];
  taskFacts: readonly QueueRankTaskFact[];
  telemetry?: QueueRankingTelemetry | null;
}

export interface QueueReviewerFact {
  reviewerRef: string;
  freeCapacity: number;
  loadHeadroom: number;
  eligibleTaskRefs?: readonly string[];
  skillScores: Record<string, number>;
  continuityScores?: Record<string, number>;
  sameContextTaskRefs?: readonly string[];
  contextSwitchCosts?: Record<string, number>;
  focusPenaltyByTaskRef?: Record<string, number>;
}

export interface QueueSnapshotConsumerSet {
  sourceQueueRankSnapshotRef: string | null | undefined;
  queueRowSnapshotRefs: readonly (string | null | undefined)[];
  nextTaskSnapshotRefs: readonly (string | null | undefined)[];
  previewSnapshotRefs: readonly (string | null | undefined)[];
}

export type QueueRankingIdKind =
  | "queueRankPlan"
  | "queueRankSnapshot"
  | "queueRankEntry"
  | "queueAssignmentSuggestionSnapshot";

export interface QueueRankingIdGenerator {
  nextId(kind: QueueRankingIdKind): string;
}

export function createDeterministicQueueRankingIdGenerator(
  seed = "queue_ranking",
): QueueRankingIdGenerator {
  const counters = new Map<QueueRankingIdKind, number>();
  return {
    nextId(kind: QueueRankingIdKind): string {
      const next = (counters.get(kind) ?? 0) + 1;
      counters.set(kind, next);
      return `${seed}_${kind}_${String(next).padStart(4, "0")}`;
    },
  };
}

function normalizeBandThresholds(thresholds: QueueBandThresholds): QueueBandThresholds {
  return {
    watch: ensureUnitInterval(thresholds.watch, "watch"),
    warn: ensureUnitInterval(thresholds.warn, "warn"),
    critical: ensureUnitInterval(thresholds.critical, "critical"),
  };
}

function normalizePlanPolicyBundle(bundle: QueueRankPlanPolicyBundle): QueueRankPlanPolicyBundle {
  const thresholds = normalizeBandThresholds(bundle.lexicographicTierPolicy.riskBandThresholds);
  const weights = bundle.withinTierWeightSet;
  invariant(
    Math.abs(weights.betaWarn + weights.betaLate - 1) < 0.00001,
    "QUEUE_PLAN_INVALID_BETA_SUM",
    "betaWarn and betaLate must sum to 1.",
  );
  invariant(
    bundle.lexicographicTierPolicy.precedenceKeys.join("|") ===
      [
        "escalated",
        "slaClass",
        "clinicalPriorityBand",
        "maxRiskBand",
        "duplicateReviewFlag",
        "urgencyCarry",
      ].join("|"),
    "QUEUE_PLAN_INVALID_PRECEDENCE",
    "Lexicographic precedence must match the canonical queue law.",
  );
  if (bundle.lexicographicTierPolicy.stableTailKeys) {
    invariant(
      bundle.lexicographicTierPolicy.stableTailKeys.join("|") ===
        ["withinTierUrgency", "queueEnteredAt", "canonicalTieBreakKey"].join("|"),
      "QUEUE_PLAN_INVALID_STABLE_TAIL",
      "Stable tail precedence must match the canonical queue law.",
    );
  }

  const bands = [...bundle.fairnessMergePolicy.bands]
    .map((band) => ({
      fairnessBandRef: requireRef(band.fairnessBandRef, "fairnessBandRef"),
      fixedBandOrder: ensurePositiveInteger(band.fixedBandOrder, "fixedBandOrder"),
      q_b: ensureNonNegativeNumber(band.q_b, "q_b"),
      gamma_age: ensureNonNegativeNumber(band.gamma_age, "gamma_age"),
      A_b_minutes: ensureNonNegativeNumber(band.A_b_minutes, "A_b_minutes"),
      H_b_minutes: ensurePositiveInteger(band.H_b_minutes, "H_b_minutes"),
      s_quantum_minutes: ensurePositiveInteger(band.s_quantum_minutes, "s_quantum_minutes"),
      eligibilitySummary: optionalRef(band.eligibilitySummary) ?? undefined,
    }))
    .sort((left, right) => left.fixedBandOrder - right.fixedBandOrder);
  invariant(
    bands.length > 0,
    "QUEUE_PLAN_MISSING_FAIRNESS_BANDS",
    "At least one fairness band is required.",
  );
  invariant(
    bundle.assignmentSuggestionPolicy.mayRewriteCanonicalOrder === false,
    "QUEUE_ASSIGNMENT_REORDER_FORBIDDEN",
    "QueueAssignmentSuggestionSnapshot may not rewrite canonical row order.",
  );

  return {
    eligibilityRules: {
      requireTrustedFactCut: Boolean(bundle.eligibilityRules.requireTrustedFactCut),
      requireTrustInputs: Boolean(bundle.eligibilityRules.requireTrustInputs),
      blockAssimilationPending: Boolean(bundle.eligibilityRules.blockAssimilationPending),
      blockPreemptionPending: Boolean(bundle.eligibilityRules.blockPreemptionPending),
      excludeScopeBlocked: Boolean(bundle.eligibilityRules.excludeScopeBlocked),
    },
    lexicographicTierPolicy: {
      precedenceKeys: bundle.lexicographicTierPolicy.precedenceKeys,
      riskBandThresholds: thresholds,
    },
    withinTierWeightSet: {
      thetaSlaCriticalMinutes: ensureNonNegativeNumber(
        weights.thetaSlaCriticalMinutes,
        "thetaSlaCriticalMinutes",
      ),
      thetaSlaWarnMinutes: ensureNonNegativeNumber(
        weights.thetaSlaWarnMinutes,
        "thetaSlaWarnMinutes",
      ),
      tauSlaMinutes: ensurePositiveInteger(weights.tauSlaMinutes, "tauSlaMinutes"),
      tauLateMinutes: ensurePositiveInteger(weights.tauLateMinutes, "tauLateMinutes"),
      lateHorizonMinutes: ensurePositiveInteger(weights.lateHorizonMinutes, "lateHorizonMinutes"),
      tauReturnMinutes: ensurePositiveInteger(weights.tauReturnMinutes, "tauReturnMinutes"),
      returnHorizonMinutes: ensurePositiveInteger(
        weights.returnHorizonMinutes,
        "returnHorizonMinutes",
      ),
      tauAgeMinutes: ensurePositiveInteger(weights.tauAgeMinutes, "tauAgeMinutes"),
      ageCapMinutes: ensurePositiveInteger(weights.ageCapMinutes, "ageCapMinutes"),
      minimumServiceMinutes: ensurePositiveInteger(
        weights.minimumServiceMinutes,
        "minimumServiceMinutes",
      ),
      betaWarn: ensureUnitInterval(weights.betaWarn, "betaWarn"),
      betaLate: ensureUnitInterval(weights.betaLate, "betaLate"),
      weightSla: ensureNonNegativeNumber(weights.weightSla, "weightSla"),
      weightAge: ensureNonNegativeNumber(weights.weightAge, "weightAge"),
      weightResidual: ensureNonNegativeNumber(weights.weightResidual, "weightResidual"),
      weightContact: ensureNonNegativeNumber(weights.weightContact, "weightContact"),
      weightReturn: ensureNonNegativeNumber(weights.weightReturn, "weightReturn"),
      weightCarry: ensureNonNegativeNumber(weights.weightCarry, "weightCarry"),
      weightVulnerability: ensureNonNegativeNumber(
        weights.weightVulnerability,
        "weightVulnerability",
      ),
      returnBase: ensureUnitInterval(weights.returnBase, "returnBase"),
      returnDelta: ensureUnitInterval(weights.returnDelta, "returnDelta"),
      returnWait: ensureUnitInterval(weights.returnWait, "returnWait"),
    },
    fairnessMergePolicy: {
      algorithm: requireRef(bundle.fairnessMergePolicy.algorithm, "algorithm"),
      C_max: ensurePositiveInteger(bundle.fairnessMergePolicy.C_max, "C_max"),
      bands,
    },
    overloadGuardPolicy: {
      formula: requireRef(bundle.overloadGuardPolicy.formula, "formula"),
      rhoGuard: ensureUnitInterval(bundle.overloadGuardPolicy.rhoGuard, "rhoGuard"),
      overloadEventId: requireRef(
        bundle.overloadGuardPolicy.overloadEventId,
        "overloadEventId",
      ),
      suppressedPromises: uniqueSortedRefs(bundle.overloadGuardPolicy.suppressedPromises),
      triggeredResponses: uniqueSortedRefs(bundle.overloadGuardPolicy.triggeredResponses),
    },
    assignmentSuggestionPolicy: {
      formula: requireRef(bundle.assignmentSuggestionPolicy.formula, "formula"),
      candidateWindowSize: ensurePositiveInteger(
        bundle.assignmentSuggestionPolicy.candidateWindowSize,
        "candidateWindowSize",
      ),
      lambda_skill: ensureNonNegativeNumber(
        bundle.assignmentSuggestionPolicy.lambda_skill,
        "lambda_skill",
      ),
      lambda_cont: ensureNonNegativeNumber(
        bundle.assignmentSuggestionPolicy.lambda_cont,
        "lambda_cont",
      ),
      lambda_load: ensureNonNegativeNumber(
        bundle.assignmentSuggestionPolicy.lambda_load,
        "lambda_load",
      ),
      lambda_sticky: ensureNonNegativeNumber(
        bundle.assignmentSuggestionPolicy.lambda_sticky,
        "lambda_sticky",
      ),
      lambda_ctx: ensureNonNegativeNumber(
        bundle.assignmentSuggestionPolicy.lambda_ctx,
        "lambda_ctx",
      ),
      lambda_focus: ensureNonNegativeNumber(
        bundle.assignmentSuggestionPolicy.lambda_focus,
        "lambda_focus",
      ),
      epsilon_assign: ensureNonNegativeNumber(
        bundle.assignmentSuggestionPolicy.epsilon_assign,
        "epsilon_assign",
      ),
      softWipCapRatio: ensureUnitInterval(
        bundle.assignmentSuggestionPolicy.softWipCapRatio,
        "softWipCapRatio",
      ),
      mayRewriteCanonicalOrder: Boolean(bundle.assignmentSuggestionPolicy.mayRewriteCanonicalOrder),
    },
  };
}

function buildPlanHash(input: {
  queueFamilyRef: string;
  refs: Record<string, string>;
  effectiveAt: string;
  policyBundle: QueueRankPlanPolicyBundle;
}): string {
  return `queue-rank-plan::${stableQueueDigestHex(
    stableStringify({
      queueFamilyRef: input.queueFamilyRef,
      refs: input.refs,
      effectiveAt: input.effectiveAt,
      policyBundle: input.policyBundle,
    }),
  )}`;
}

export function validateQueueRankPlanStructure(
  snapshot: QueueRankPlanSnapshot,
): QueueRankPlanSnapshot {
  const normalized = {
    ...snapshot,
    queueRankPlanId: requireRef(snapshot.queueRankPlanId, "queueRankPlanId"),
    queueFamilyRef: requireRef(snapshot.queueFamilyRef, "queueFamilyRef"),
    eligibilityRuleSetRef: requireRef(snapshot.eligibilityRuleSetRef, "eligibilityRuleSetRef"),
    lexicographicTierPolicyRef: requireRef(
      snapshot.lexicographicTierPolicyRef,
      "lexicographicTierPolicyRef",
    ),
    withinTierWeightSetRef: requireRef(snapshot.withinTierWeightSetRef, "withinTierWeightSetRef"),
    fairnessMergePolicyRef: requireRef(snapshot.fairnessMergePolicyRef, "fairnessMergePolicyRef"),
    overloadGuardPolicyRef: requireRef(snapshot.overloadGuardPolicyRef, "overloadGuardPolicyRef"),
    assignmentSuggestionPolicyRef: requireRef(
      snapshot.assignmentSuggestionPolicyRef,
      "assignmentSuggestionPolicyRef",
    ),
    explanationSchemaRef: requireRef(snapshot.explanationSchemaRef, "explanationSchemaRef"),
    canonicalTieBreakPolicyRef: requireRef(
      snapshot.canonicalTieBreakPolicyRef,
      "canonicalTieBreakPolicyRef",
    ),
    planHash: requireRef(snapshot.planHash, "planHash"),
    effectiveAt: ensureIsoTimestamp(snapshot.effectiveAt, "effectiveAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
    policyBundle: normalizePlanPolicyBundle(snapshot.policyBundle),
  };

  const expectedPlanHash = buildPlanHash({
    queueFamilyRef: normalized.queueFamilyRef,
    refs: {
      eligibilityRuleSetRef: normalized.eligibilityRuleSetRef,
      lexicographicTierPolicyRef: normalized.lexicographicTierPolicyRef,
      withinTierWeightSetRef: normalized.withinTierWeightSetRef,
      fairnessMergePolicyRef: normalized.fairnessMergePolicyRef,
      overloadGuardPolicyRef: normalized.overloadGuardPolicyRef,
      assignmentSuggestionPolicyRef: normalized.assignmentSuggestionPolicyRef,
      explanationSchemaRef: normalized.explanationSchemaRef,
      canonicalTieBreakPolicyRef: normalized.canonicalTieBreakPolicyRef,
    },
    effectiveAt: normalized.effectiveAt,
    policyBundle: normalized.policyBundle,
  });

  invariant(
    normalized.planHash === expectedPlanHash,
    "QUEUE_PLAN_HASH_DRIFT",
    "QueueRankPlan.planHash does not match the normalized plan structure.",
  );
  return normalized;
}

export class QueueRankPlanDocument {
  private constructor(private readonly snapshot: QueueRankPlanSnapshot) {}

  static fromSnapshot(snapshot: QueueRankPlanSnapshot): QueueRankPlanDocument {
    return new QueueRankPlanDocument(validateQueueRankPlanStructure(snapshot));
  }

  static create(input: Omit<QueueRankPlanSnapshot, "planHash">): QueueRankPlanDocument {
    const policyBundle = normalizePlanPolicyBundle(input.policyBundle);
    const effectiveAt = ensureIsoTimestamp(input.effectiveAt, "effectiveAt");
    const snapshot: QueueRankPlanSnapshot = {
      ...input,
      effectiveAt,
      version: ensurePositiveInteger(input.version, "version"),
      queueRankPlanId: requireRef(input.queueRankPlanId, "queueRankPlanId"),
      queueFamilyRef: requireRef(input.queueFamilyRef, "queueFamilyRef"),
      eligibilityRuleSetRef: requireRef(input.eligibilityRuleSetRef, "eligibilityRuleSetRef"),
      lexicographicTierPolicyRef: requireRef(
        input.lexicographicTierPolicyRef,
        "lexicographicTierPolicyRef",
      ),
      withinTierWeightSetRef: requireRef(input.withinTierWeightSetRef, "withinTierWeightSetRef"),
      fairnessMergePolicyRef: requireRef(input.fairnessMergePolicyRef, "fairnessMergePolicyRef"),
      overloadGuardPolicyRef: requireRef(input.overloadGuardPolicyRef, "overloadGuardPolicyRef"),
      assignmentSuggestionPolicyRef: requireRef(
        input.assignmentSuggestionPolicyRef,
        "assignmentSuggestionPolicyRef",
      ),
      explanationSchemaRef: requireRef(input.explanationSchemaRef, "explanationSchemaRef"),
      canonicalTieBreakPolicyRef: requireRef(
        input.canonicalTieBreakPolicyRef,
        "canonicalTieBreakPolicyRef",
      ),
      policyBundle,
      planHash: buildPlanHash({
        queueFamilyRef: input.queueFamilyRef,
        refs: {
          eligibilityRuleSetRef: input.eligibilityRuleSetRef,
          lexicographicTierPolicyRef: input.lexicographicTierPolicyRef,
          withinTierWeightSetRef: input.withinTierWeightSetRef,
          fairnessMergePolicyRef: input.fairnessMergePolicyRef,
          overloadGuardPolicyRef: input.overloadGuardPolicyRef,
          assignmentSuggestionPolicyRef: input.assignmentSuggestionPolicyRef,
          explanationSchemaRef: input.explanationSchemaRef,
          canonicalTieBreakPolicyRef: input.canonicalTieBreakPolicyRef,
        },
        effectiveAt,
        policyBundle,
      }),
    };
    return new QueueRankPlanDocument(validateQueueRankPlanStructure(snapshot));
  }

  toSnapshot(): QueueRankPlanSnapshot {
    return {
      ...this.snapshot,
      policyBundle: JSON.parse(
        stableStringify(this.snapshot.policyBundle),
      ) as QueueRankPlanPolicyBundle,
    };
  }
}

function normalizeRiskBand(value: number, thresholds: QueueBandThresholds): QueueRiskBand {
  const normalized = ensureUnitInterval(value, "riskBandValue");
  if (normalized >= thresholds.critical) {
    return "critical";
  }
  if (normalized >= thresholds.warn) {
    return "warn";
  }
  if (normalized >= thresholds.watch) {
    return "watch";
  }
  return "none";
}

function riskBandRank(value: QueueRiskBand): number {
  switch (value) {
    case "critical":
      return 3;
    case "warn":
      return 2;
    case "watch":
      return 1;
    default:
      return 0;
  }
}

export function buildCanonicalTieBreakKey(input: {
  queueRef: string;
  queueEnteredAt: string;
  taskRef: string;
}): string {
  return `queue-tiebreak::${stableQueueDigestHex(
    `${requireRef(input.queueRef, "queueRef")}::${ensureIsoTimestamp(input.queueEnteredAt, "queueEnteredAt")}::${requireRef(input.taskRef, "taskRef")}`,
  )}`;
}

export function normalizeQueueExplanationPayload(
  payload: QueueRankExplanationPayload,
): QueueRankExplanationPayload {
  return {
    ...payload,
    planHash: requireRef(payload.planHash, "planHash"),
    sourceFactCutRef: requireRef(payload.sourceFactCutRef, "sourceFactCutRef"),
    holdReasonRefs: uniqueSortedRefs(payload.holdReasonRefs),
    fairnessTransition: {
      ...payload.fairnessTransition,
      fairnessBandRef: requireRef(payload.fairnessTransition.fairnessBandRef, "fairnessBandRef"),
      before: Number(payload.fairnessTransition.before.toFixed(6)),
      after: Number(payload.fairnessTransition.after.toFixed(6)),
    },
    normalizedFactors: {
      slaPressure: Number(clamp(payload.normalizedFactors.slaPressure, 0, 1).toFixed(6)),
      ageLift: Number(clamp(payload.normalizedFactors.ageLift, 0, 1).toFixed(6)),
      residualRisk: Number(clamp(payload.normalizedFactors.residualRisk, 0, 1).toFixed(6)),
      contactRisk: Number(clamp(payload.normalizedFactors.contactRisk, 0, 1).toFixed(6)),
      returnLift: Number(clamp(payload.normalizedFactors.returnLift, 0, 1).toFixed(6)),
      urgencyCarry: Number(clamp(payload.normalizedFactors.urgencyCarry, 0, 1).toFixed(6)),
      vulnerability: Number(clamp(payload.normalizedFactors.vulnerability, 0, 1).toFixed(6)),
      routingGap: Number(clamp(payload.normalizedFactors.routingGap, 0, 1).toFixed(6)),
      withinTierUrgency: Number(
        clamp(payload.normalizedFactors.withinTierUrgency, 0, 0.999999).toFixed(6),
      ),
    },
    rawFactors: {
      ageMinutes: Number(payload.rawFactors.ageMinutes.toFixed(3)),
      returnAgeMinutes: Number(payload.rawFactors.returnAgeMinutes.toFixed(3)),
      expectedServiceMinutes: Number(payload.rawFactors.expectedServiceMinutes.toFixed(3)),
      dSlaMinutes: Number(payload.rawFactors.dSlaMinutes.toFixed(3)),
      laxityMinutes: Number(payload.rawFactors.laxityMinutes.toFixed(3)),
      rhoCritical:
        payload.rawFactors.rhoCritical === null
          ? null
          : Number(payload.rawFactors.rhoCritical.toFixed(6)),
    },
    policyFactors: {
      slaWarn: Number(clamp(payload.policyFactors.slaWarn, 0, 1).toFixed(6)),
      slaLate: Number(clamp(payload.policyFactors.slaLate, 0, 1).toFixed(6)),
      priorityOrdinal: ensureNonNegativeNumber(
        payload.policyFactors.priorityOrdinal,
        "priorityOrdinal",
      ),
      residual: Number(clamp(payload.policyFactors.residual, 0, 1).toFixed(6)),
      contactRisk: Number(clamp(payload.policyFactors.contactRisk, 0, 1).toFixed(6)),
      returnedFlag: Boolean(payload.policyFactors.returnedFlag),
      evidenceDeltaSeverity: Number(
        clamp(payload.policyFactors.evidenceDeltaSeverity, 0, 1).toFixed(6),
      ),
      coverageFit: Number(clamp(payload.policyFactors.coverageFit, 0, 1).toFixed(6)),
      duplicateReviewFlag: Boolean(payload.policyFactors.duplicateReviewFlag),
    },
    tieBreak: {
      canonicalTieBreakKey: requireRef(
        payload.tieBreak.canonicalTieBreakKey,
        "canonicalTieBreakKey",
      ),
      queueEnteredAt: ensureIsoTimestamp(payload.tieBreak.queueEnteredAt, "queueEnteredAt"),
    },
  };
}

export function explanationPayloadRef(payload: QueueRankExplanationPayload): string {
  return `queue-explanation::${stableQueueDigestHex(stableStringify(normalizeQueueExplanationPayload(payload)))}`;
}

function normalizeTaskFact(fact: QueueRankTaskFact): QueueRankTaskFact {
  return {
    ...fact,
    taskRef: requireRef(fact.taskRef, "taskRef"),
    queueEnteredAt: ensureIsoTimestamp(fact.queueEnteredAt, "queueEnteredAt"),
    slaTargetAt: ensureIsoTimestamp(fact.slaTargetAt, "slaTargetAt"),
    expectedHandleMinutes: ensureNonNegativeNumber(
      fact.expectedHandleMinutes,
      "expectedHandleMinutes",
    ),
    clinicalPriorityBand: ensurePositiveInteger(fact.clinicalPriorityBand, "clinicalPriorityBand"),
    residualRisk: ensureUnitInterval(fact.residualRisk, "residualRisk"),
    contactRisk: ensureUnitInterval(fact.contactRisk, "contactRisk"),
    evidenceDeltaSeverity: ensureUnitInterval(fact.evidenceDeltaSeverity, "evidenceDeltaSeverity"),
    urgencyCarry: ensureUnitInterval(fact.urgencyCarry, "urgencyCarry"),
    vulnerability: ensureUnitInterval(fact.vulnerability, "vulnerability"),
    coverageFit: ensureUnitInterval(fact.coverageFit, "coverageFit"),
    fairnessBandRef: requireRef(fact.fairnessBandRef, "fairnessBandRef"),
    trustState: fact.trustState,
    missingTrustInputRefs: uniqueSortedRefs(fact.missingTrustInputRefs),
    scopeExcluded: Boolean(fact.scopeExcluded),
    lastMaterialReturnAt: fact.lastMaterialReturnAt
      ? ensureIsoTimestamp(fact.lastMaterialReturnAt, "lastMaterialReturnAt")
      : null,
    archetypeRef: optionalRef(fact.archetypeRef),
  };
}

function normalizeTelemetry(input?: QueueRankingTelemetry | null): QueueRankingTelemetry | null {
  if (!input) {
    return null;
  }
  return {
    criticalArrivalRatePerHour: ensureNonNegativeNumber(
      input.criticalArrivalRatePerHour,
      "criticalArrivalRatePerHour",
    ),
    empiricalServiceRatePerHour: ensureNonNegativeNumber(
      input.empiricalServiceRatePerHour,
      "empiricalServiceRatePerHour",
    ),
    activeReviewerCount: ensurePositiveInteger(input.activeReviewerCount, "activeReviewerCount"),
  };
}

export function validateQueueFactCut(
  factCut: QueueRankingFactCut,
  plan: QueueRankPlanSnapshot,
): QueueRankingFactCut {
  const normalized = {
    ...factCut,
    queueRef: requireRef(factCut.queueRef, "queueRef"),
    queueFamilyRef: requireRef(factCut.queueFamilyRef, "queueFamilyRef"),
    sourceFactCutRef: requireRef(factCut.sourceFactCutRef, "sourceFactCutRef"),
    asOfAt: ensureIsoTimestamp(factCut.asOfAt, "asOfAt"),
    generatedAt: ensureIsoTimestamp(factCut.generatedAt, "generatedAt"),
    trustInputRefs: uniqueSortedRefs(factCut.trustInputRefs),
    taskFacts: factCut.taskFacts.map((task) => normalizeTaskFact(task)),
    telemetry: normalizeTelemetry(factCut.telemetry),
  };

  invariant(
    normalized.queueFamilyRef === plan.queueFamilyRef,
    "QUEUE_FACT_CUT_FAMILY_MISMATCH",
    "QueueRankPlan queueFamilyRef must match the fact cut queueFamilyRef.",
  );
  if (plan.policyBundle.eligibilityRules.requireTrustInputs) {
    invariant(
      normalized.trustInputRefs.length > 0,
      "QUEUE_FACT_CUT_MISSING_TRUST_INPUTS",
      "Queue fact cuts must publish trustInputRefs before snapshot materialization.",
    );
  }
  const allowedFairnessBands = new Set(
    plan.policyBundle.fairnessMergePolicy.bands.map((band) => band.fairnessBandRef),
  );
  for (const task of normalized.taskFacts) {
    invariant(
      allowedFairnessBands.has(task.fairnessBandRef),
      "QUEUE_FACT_CUT_UNKNOWN_FAIRNESS_BAND",
      `Task ${task.taskRef} references unsupported fairness band ${task.fairnessBandRef}.`,
    );
  }
  return normalized;
}

function resolveOverloadState(
  plan: QueueRankPlanSnapshot,
  factCut: QueueRankingFactCut,
  tasks: readonly RankedTaskComputation[],
): { overloadState: QueueOverloadState; rhoCritical: number | null } {
  const telemetry = factCut.telemetry;
  if (!telemetry) {
    return { overloadState: "nominal", rhoCritical: null };
  }

  const criticalTasks = tasks.filter((task) => task.task.escalated || task.slaClass === 3);
  const meanExpectedService =
    criticalTasks.length === 0
      ? plan.policyBundle.withinTierWeightSet.minimumServiceMinutes
      : criticalTasks.reduce(
          (sum, task) =>
            sum +
            Math.max(plan.policyBundle.withinTierWeightSet.minimumServiceMinutes, task.expectedServiceMinutes),
          0,
        ) / criticalTasks.length;

  const rhoCritical =
    (telemetry.criticalArrivalRatePerHour * meanExpectedService) /
    (60 *
      Math.max(1, telemetry.activeReviewerCount) *
      Math.max(0.0001, telemetry.empiricalServiceRatePerHour));

  return {
    overloadState:
      rhoCritical >= plan.policyBundle.overloadGuardPolicy.rhoGuard
        ? "overload_critical"
        : "nominal",
    rhoCritical: Number(rhoCritical.toFixed(6)),
  };
}

interface RankedTaskComputation {
  task: QueueRankTaskFact;
  eligibilityState: QueueEligibilityState;
  holdReasonRefs: readonly string[];
  ageMinutes: number;
  returnAgeMinutes: number;
  expectedServiceMinutes: number;
  dSlaMinutes: number;
  laxityMinutes: number;
  slaClass: number;
  slaWarn: number;
  slaLate: number;
  slaPressure: number;
  priorityOrdinal: number;
  ageLift: number;
  returnLift: number;
  withinTierUrgency: number;
  residualBand: QueueRiskBand;
  contactRiskBand: QueueRiskBand;
  maxRiskBand: number;
  routingGap: number;
  fairnessBandRef: string;
  canonicalTieBreakKey: string;
  lexicographicTier: string;
}

function computeTaskRanking(
  plan: QueueRankPlanSnapshot,
  factCut: QueueRankingFactCut,
  task: QueueRankTaskFact,
  rhoCritical: number | null,
): RankedTaskComputation {
  const thresholds = plan.policyBundle.lexicographicTierPolicy.riskBandThresholds;
  const weights = plan.policyBundle.withinTierWeightSet;
  const ageMinutes = Math.max(0, minutesBetween(task.queueEnteredAt, factCut.asOfAt));
  const returnAgeMinutes = task.lastMaterialReturnAt
    ? Math.max(0, minutesBetween(task.lastMaterialReturnAt, factCut.asOfAt))
    : 0;
  const expectedServiceMinutes = Math.max(
    weights.minimumServiceMinutes,
    task.expectedHandleMinutes,
  );
  const dSlaMinutes = minutesBetween(factCut.asOfAt, task.slaTargetAt);
  const laxityMinutes = dSlaMinutes - expectedServiceMinutes;
  const slaClass =
    laxityMinutes <= 0
      ? 3
      : laxityMinutes <= weights.thetaSlaCriticalMinutes
        ? 2
        : laxityMinutes <= weights.thetaSlaWarnMinutes
          ? 1
          : 0;
  const slaWarn =
    1 / (1 + Math.exp((laxityMinutes - weights.thetaSlaWarnMinutes) / weights.tauSlaMinutes));
  const slaLate = Math.min(
    1,
    Math.log(1 + Math.max(0, -laxityMinutes) / weights.tauLateMinutes) /
      Math.log(1 + weights.lateHorizonMinutes / weights.tauLateMinutes),
  );
  const slaPressure = weights.betaWarn * slaWarn + weights.betaLate * slaLate;
  const ageLift = Math.min(
    1,
    Math.log(1 + ageMinutes / weights.tauAgeMinutes) /
      Math.log(1 + weights.ageCapMinutes / weights.tauAgeMinutes),
  );
  const returnLift = !task.returned
    ? 0
    : Math.min(
        1,
        weights.returnBase +
          weights.returnDelta * task.evidenceDeltaSeverity +
          weights.returnWait *
            Math.min(
              1,
              Math.log(1 + returnAgeMinutes / weights.tauReturnMinutes) /
                Math.log(1 + weights.returnHorizonMinutes / weights.tauReturnMinutes),
            ),
      );
  const withinTierUrgency =
    1 -
    Math.exp(
      -(
        weights.weightSla * slaPressure +
        weights.weightAge * ageLift +
        weights.weightResidual * task.residualRisk +
        weights.weightContact * task.contactRisk +
        weights.weightReturn * returnLift +
        weights.weightCarry * task.urgencyCarry +
        weights.weightVulnerability * task.vulnerability
      ),
    );

  const holdReasonRefs: string[] = [];
  let eligibilityState: QueueEligibilityState = "eligible";
  if (plan.policyBundle.eligibilityRules.excludeScopeBlocked && task.scopeExcluded) {
    eligibilityState = "excluded_scope";
    holdReasonRefs.push("scope_excluded");
  } else if (
    (plan.policyBundle.eligibilityRules.blockPreemptionPending && task.preemptionPending) ||
    (plan.policyBundle.eligibilityRules.blockAssimilationPending && task.assimilationPending)
  ) {
    eligibilityState = "held_preemption";
    if (task.preemptionPending) {
      holdReasonRefs.push("safety_preemption_pending");
    }
    if (task.assimilationPending) {
      holdReasonRefs.push("evidence_assimilation_pending");
    }
  } else if (
    plan.policyBundle.eligibilityRules.requireTrustedFactCut &&
    (task.trustState !== "trusted" || task.missingTrustInputRefs.length > 0)
  ) {
    eligibilityState = "held_trust";
    if (task.trustState !== "trusted") {
      holdReasonRefs.push(`trust_state_${task.trustState}`);
    }
    holdReasonRefs.push(...task.missingTrustInputRefs.map((ref) => `missing_${ref}`));
  }

  const residualBand = normalizeRiskBand(task.residualRisk, thresholds);
  const contactRiskBand = normalizeRiskBand(task.contactRisk, thresholds);
  const maxRiskBand = Math.max(riskBandRank(residualBand), riskBandRank(contactRiskBand));
  const canonicalTieBreakKey = buildCanonicalTieBreakKey({
    queueRef: factCut.queueRef,
    queueEnteredAt: task.queueEnteredAt,
    taskRef: task.taskRef,
  });

  return {
    task,
    eligibilityState,
    holdReasonRefs: uniqueSortedRefs(holdReasonRefs),
    ageMinutes,
    returnAgeMinutes,
    expectedServiceMinutes,
    dSlaMinutes,
    laxityMinutes,
    slaClass,
    slaWarn: Number(clamp(slaWarn, 0, 1).toFixed(6)),
    slaLate: Number(clamp(slaLate, 0, 1).toFixed(6)),
    slaPressure: Number(clamp(slaPressure, 0, 1).toFixed(6)),
    priorityOrdinal: task.clinicalPriorityBand,
    ageLift: Number(clamp(ageLift, 0, 1).toFixed(6)),
    returnLift: Number(clamp(returnLift, 0, 1).toFixed(6)),
    withinTierUrgency: Number(clamp(withinTierUrgency, 0, 0.999999).toFixed(6)),
    residualBand,
    contactRiskBand,
    maxRiskBand,
    routingGap: Number((1 - task.coverageFit).toFixed(6)),
    fairnessBandRef: task.fairnessBandRef,
    canonicalTieBreakKey,
    lexicographicTier: [
      `escalated:${task.escalated ? 1 : 0}`,
      `sla:${slaClass}`,
      `priority:${task.clinicalPriorityBand}`,
      `risk:${maxRiskBand}`,
      `duplicate:${task.duplicateReviewFlag ? 1 : 0}`,
      `carry:${Number(task.urgencyCarry.toFixed(3))}`,
      `rho:${rhoCritical === null ? "na" : rhoCritical.toFixed(3)}`,
    ].join("|"),
  };
}

function baseComparator(left: RankedTaskComputation, right: RankedTaskComputation): number {
  return (
    Number(right.task.escalated) - Number(left.task.escalated) ||
    right.slaClass - left.slaClass ||
    right.task.clinicalPriorityBand - left.task.clinicalPriorityBand ||
    right.maxRiskBand - left.maxRiskBand ||
    Number(right.task.duplicateReviewFlag) - Number(left.task.duplicateReviewFlag) ||
    (right.task.urgencyCarry > left.task.urgencyCarry
      ? 1
      : right.task.urgencyCarry < left.task.urgencyCarry
        ? -1
        : 0) ||
    (right.withinTierUrgency > left.withinTierUrgency
      ? 1
      : right.withinTierUrgency < left.withinTierUrgency
        ? -1
        : 0) ||
    compareIso(left.task.queueEnteredAt, right.task.queueEnteredAt) ||
    left.canonicalTieBreakKey.localeCompare(right.canonicalTieBreakKey)
  );
}

function holdComparator(left: RankedTaskComputation, right: RankedTaskComputation): number {
  const rankForEligibility = (value: QueueEligibilityState) => {
    switch (value) {
      case "held_preemption":
        return 0;
      case "held_trust":
        return 1;
      case "excluded_scope":
        return 2;
      default:
        return -1;
    }
  };
  return (
    rankForEligibility(left.eligibilityState) - rankForEligibility(right.eligibilityState) ||
    baseComparator(left, right)
  );
}

interface FairnessEmission {
  task: RankedTaskComputation;
  beforeCredit: number;
  afterCredit: number;
}

function mergeRoutineByFairness(
  routine: readonly RankedTaskComputation[],
  plan: QueueRankPlanSnapshot,
): readonly FairnessEmission[] {
  const policy = plan.policyBundle.fairnessMergePolicy;
  const queues = new Map<string, RankedTaskComputation[]>();
  const state = new Map<
    string,
    {
      order: number;
      credit: number;
      s_quantum_minutes: number;
      A_b_minutes: number;
      H_b_minutes: number;
      q_b: number;
      gamma_age: number;
    }
  >();

  for (const band of policy.bands) {
    queues.set(band.fairnessBandRef, []);
    state.set(band.fairnessBandRef, {
      order: band.fixedBandOrder,
      credit: 0,
      s_quantum_minutes: band.s_quantum_minutes,
      A_b_minutes: band.A_b_minutes,
      H_b_minutes: band.H_b_minutes,
      q_b: band.q_b,
      gamma_age: band.gamma_age,
    });
  }

  for (const task of [...routine].sort(baseComparator)) {
    const queue = queues.get(task.fairnessBandRef);
    invariant(
      queue !== undefined,
      "QUEUE_UNKNOWN_FAIRNESS_BAND",
      `Unknown fairnessBandRef ${task.fairnessBandRef} cannot be ranked under the active plan.`,
    );
    queue.push(task);
  }

  const emissions: FairnessEmission[] = [];
  while ([...queues.values()].some((queue) => queue.length > 0)) {
    for (const [bandRef, queue] of queues.entries()) {
      if (queue.length === 0) {
        continue;
      }
      const bandState = state.get(bandRef)!;
      const head = queue[0]!;
      const ageDebt = clamp(
        Math.max(0, head.ageMinutes - bandState.A_b_minutes) / bandState.H_b_minutes,
        0,
        1,
      );
      bandState.credit = Math.min(
        policy.C_max,
        bandState.credit + bandState.q_b + bandState.gamma_age * ageDebt,
      );
    }

    const candidates = [...queues.entries()]
      .filter(([, queue]) => queue.length > 0)
      .map(([bandRef, queue]) => {
        const bandState = state.get(bandRef)!;
        const head = queue[0]!;
        const serviceCost = Math.max(
          1,
          head.expectedServiceMinutes / Math.max(1, bandState.s_quantum_minutes),
        );
        return {
          bandRef,
          head,
          bandState,
          score: bandState.credit / serviceCost,
          serviceCost,
        };
      })
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        if (left.bandState.order !== right.bandState.order) {
          return left.bandState.order - right.bandState.order;
        }
        return baseComparator(left.head, right.head);
      });

    const selected = candidates[0]!;
    const queue = queues.get(selected.bandRef)!;
    const emitted = queue.shift()!;
    const beforeCredit = Number(selected.bandState.credit.toFixed(6));
    selected.bandState.credit = Number(
      (selected.bandState.credit - selected.serviceCost).toFixed(6),
    );
    const afterCredit = selected.bandState.credit;
    emissions.push({ task: emitted, beforeCredit, afterCredit });
  }

  return emissions;
}

function buildExplanationPayload(input: {
  plan: QueueRankPlanSnapshot;
  factCut: QueueRankingFactCut;
  overloadState: QueueOverloadState;
  rhoCritical: number | null;
  task: RankedTaskComputation;
  fairnessCreditBefore: number;
  fairnessCreditAfter: number;
  mergeClass: QueueFairnessMergeClass;
}): QueueRankExplanationPayload {
  return normalizeQueueExplanationPayload({
    planHash: input.plan.planHash,
    sourceFactCutRef: input.factCut.sourceFactCutRef,
    overloadState: input.overloadState,
    eligibilityState: input.task.eligibilityState,
    holdReasonRefs: input.task.holdReasonRefs,
    lexicographicKeys: {
      escalated: input.task.task.escalated ? 1 : 0,
      slaClass: input.task.slaClass,
      clinicalPriorityBand: input.task.task.clinicalPriorityBand,
      maxRiskBand: input.task.maxRiskBand,
      duplicateReviewFlag: input.task.task.duplicateReviewFlag ? 1 : 0,
      urgencyCarry: Number(input.task.task.urgencyCarry.toFixed(6)),
    },
    normalizedFactors: {
      slaPressure: input.task.slaPressure,
      ageLift: input.task.ageLift,
      residualRisk: input.task.task.residualRisk,
      contactRisk: input.task.task.contactRisk,
      returnLift: input.task.returnLift,
      urgencyCarry: input.task.task.urgencyCarry,
      vulnerability: input.task.task.vulnerability,
      routingGap: input.task.routingGap,
      withinTierUrgency: input.task.withinTierUrgency,
    },
    rawFactors: {
      ageMinutes: input.task.ageMinutes,
      returnAgeMinutes: input.task.returnAgeMinutes,
      expectedServiceMinutes: input.task.expectedServiceMinutes,
      dSlaMinutes: input.task.dSlaMinutes,
      laxityMinutes: input.task.laxityMinutes,
      rhoCritical: input.rhoCritical,
    },
    policyFactors: {
      slaWarn: input.task.slaWarn,
      slaLate: input.task.slaLate,
      priorityOrdinal: input.task.priorityOrdinal,
      residual: input.task.task.residualRisk,
      contactRisk: input.task.task.contactRisk,
      returnedFlag: input.task.task.returned,
      evidenceDeltaSeverity: input.task.task.evidenceDeltaSeverity,
      coverageFit: input.task.task.coverageFit,
      duplicateReviewFlag: input.task.task.duplicateReviewFlag,
    },
    fairnessTransition: {
      fairnessBandRef: input.task.fairnessBandRef,
      before: input.fairnessCreditBefore,
      after: input.fairnessCreditAfter,
      promiseState: input.overloadState === "overload_critical" ? "suppressed_overload" : "active",
      mergeClass: input.mergeClass,
    },
    tieBreak: {
      canonicalTieBreakKey: input.task.canonicalTieBreakKey,
      queueEnteredAt: input.task.task.queueEnteredAt,
    },
  });
}

export class QueueRankSnapshotDocument {
  private constructor(private readonly snapshot: QueueRankSnapshot) {}

  static create(snapshot: QueueRankSnapshot): QueueRankSnapshotDocument {
    const normalized: QueueRankSnapshot = {
      ...snapshot,
      rankSnapshotId: requireRef(snapshot.rankSnapshotId, "rankSnapshotId"),
      queueRef: requireRef(snapshot.queueRef, "queueRef"),
      queueRankPlanRef: requireRef(snapshot.queueRankPlanRef, "queueRankPlanRef"),
      asOfAt: ensureIsoTimestamp(snapshot.asOfAt, "asOfAt"),
      sourceFactCutRef: requireRef(snapshot.sourceFactCutRef, "sourceFactCutRef"),
      trustInputRefs: uniqueSortedRefs(snapshot.trustInputRefs),
      eligibleTaskRefs: uniqueSortedRefs(snapshot.eligibleTaskRefs),
      excludedTaskRefs: uniqueSortedRefs(snapshot.excludedTaskRefs),
      overloadState: snapshot.overloadState,
      fairnessCycleStateRef: requireRef(snapshot.fairnessCycleStateRef, "fairnessCycleStateRef"),
      rowOrderHash: requireRef(snapshot.rowOrderHash, "rowOrderHash"),
      generatedAt: ensureIsoTimestamp(snapshot.generatedAt, "generatedAt"),
      version: ensurePositiveInteger(snapshot.version, "version"),
    };
    return new QueueRankSnapshotDocument(normalized);
  }

  toSnapshot(): QueueRankSnapshot {
    return {
      ...this.snapshot,
      trustInputRefs: [...this.snapshot.trustInputRefs],
      eligibleTaskRefs: [...this.snapshot.eligibleTaskRefs],
      excludedTaskRefs: [...this.snapshot.excludedTaskRefs],
    };
  }
}

export class QueueRankEntryDocument {
  private constructor(private readonly snapshot: QueueRankEntrySnapshot) {}

  static create(snapshot: QueueRankEntrySnapshot): QueueRankEntryDocument {
    const normalizedExplanationPayload = normalizeQueueExplanationPayload(
      snapshot.normalizedExplanationPayload,
    );
    const explanationRef = explanationPayloadRef(normalizedExplanationPayload);
    invariant(
      explanationRef === snapshot.explanationPayloadRef,
      "QUEUE_ENTRY_EXPLANATION_REF_DRIFT",
      "QueueRankEntry.explanationPayloadRef must match the normalized explanation payload.",
    );
    const normalized: QueueRankEntrySnapshot = {
      ...snapshot,
      rankEntryId: requireRef(snapshot.rankEntryId, "rankEntryId"),
      rankSnapshotRef: requireRef(snapshot.rankSnapshotRef, "rankSnapshotRef"),
      taskRef: requireRef(snapshot.taskRef, "taskRef"),
      ordinal: ensurePositiveInteger(snapshot.ordinal, "ordinal"),
      lexicographicTier: requireRef(snapshot.lexicographicTier, "lexicographicTier"),
      urgencyScore: Number(clamp(snapshot.urgencyScore, 0, 0.999999).toFixed(6)),
      fairnessBandRef: requireRef(snapshot.fairnessBandRef, "fairnessBandRef"),
      fairnessCreditBefore: Number(snapshot.fairnessCreditBefore.toFixed(6)),
      fairnessCreditAfter: Number(snapshot.fairnessCreditAfter.toFixed(6)),
      canonicalTieBreakKey: requireRef(snapshot.canonicalTieBreakKey, "canonicalTieBreakKey"),
      explanationPayloadRef: explanationRef,
      generatedAt: ensureIsoTimestamp(snapshot.generatedAt, "generatedAt"),
      version: ensurePositiveInteger(snapshot.version, "version"),
      normalizedExplanationPayload,
    };
    return new QueueRankEntryDocument(normalized);
  }

  toSnapshot(): QueueRankEntrySnapshot {
    return JSON.parse(stableStringify(this.snapshot)) as QueueRankEntrySnapshot;
  }
}

export class QueueAssignmentSuggestionSnapshotDocument {
  private constructor(private readonly snapshot: QueueAssignmentSuggestionSnapshot) {}

  static create(
    snapshot: QueueAssignmentSuggestionSnapshot,
  ): QueueAssignmentSuggestionSnapshotDocument {
    const normalized: QueueAssignmentSuggestionSnapshot = {
      ...snapshot,
      suggestionSnapshotId: requireRef(snapshot.suggestionSnapshotId, "suggestionSnapshotId"),
      rankSnapshotRef: requireRef(snapshot.rankSnapshotRef, "rankSnapshotRef"),
      reviewerScopeRef: requireRef(snapshot.reviewerScopeRef, "reviewerScopeRef"),
      candidateWindowSize: ensurePositiveInteger(
        snapshot.candidateWindowSize,
        "candidateWindowSize",
      ),
      governedAutoClaimRefs: uniqueSortedRefs(snapshot.governedAutoClaimRefs),
      generatedAt: ensureIsoTimestamp(snapshot.generatedAt, "generatedAt"),
      version: ensurePositiveInteger(snapshot.version, "version"),
      suggestionRows: [...snapshot.suggestionRows]
        .map((row) => ({
          taskRef: requireRef(row.taskRef, "taskRef"),
          ordinal: ensurePositiveInteger(row.ordinal, "ordinal"),
          reviewerRef: optionalRef(row.reviewerRef),
          suggestionScore: Number(row.suggestionScore.toFixed(6)),
          governedAutoClaimEligible: Boolean(row.governedAutoClaimEligible),
          canonicalTieBreakKey: requireRef(row.canonicalTieBreakKey, "canonicalTieBreakKey"),
          explanationPayloadRef: requireRef(row.explanationPayloadRef, "explanationPayloadRef"),
          reasonRefs: uniqueSortedRefs(row.reasonRefs),
        }))
        .sort(
          (left, right) =>
            left.ordinal - right.ordinal || left.taskRef.localeCompare(right.taskRef),
        ),
    };
    return new QueueAssignmentSuggestionSnapshotDocument(normalized);
  }

  toSnapshot(): QueueAssignmentSuggestionSnapshot {
    return JSON.parse(stableStringify(this.snapshot)) as QueueAssignmentSuggestionSnapshot;
  }
}

export interface QueueRankingDependencies {
  getQueueRankPlan(planId: string): Promise<QueueRankPlanDocument | undefined>;
  getLatestQueueRankPlanByFamily(
    queueFamilyRef: string,
  ): Promise<QueueRankPlanDocument | undefined>;
  saveQueueRankPlan(
    plan: QueueRankPlanDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getQueueRankSnapshot(rankSnapshotId: string): Promise<QueueRankSnapshotDocument | undefined>;
  getLatestQueueRankSnapshotByQueue(
    queueRef: string,
  ): Promise<QueueRankSnapshotDocument | undefined>;
  saveQueueRankSnapshot(
    snapshot: QueueRankSnapshotDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listQueueRankEntries(rankSnapshotRef: string): Promise<readonly QueueRankEntryDocument[]>;
  saveQueueRankEntry(
    entry: QueueRankEntryDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getQueueAssignmentSuggestionSnapshot(
    suggestionSnapshotId: string,
  ): Promise<QueueAssignmentSuggestionSnapshotDocument | undefined>;
  getLatestQueueAssignmentSuggestionByRankSnapshotRef(
    rankSnapshotRef: string,
  ): Promise<QueueAssignmentSuggestionSnapshotDocument | undefined>;
  saveQueueAssignmentSuggestionSnapshot(
    snapshot: QueueAssignmentSuggestionSnapshotDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export class InMemoryQueueRankingStore implements QueueRankingDependencies {
  private readonly plans = new Map<string, QueueRankPlanSnapshot>();
  private readonly latestPlanByFamily = new Map<string, string>();
  private readonly snapshots = new Map<string, QueueRankSnapshot>();
  private readonly snapshotIdsByQueue = new Map<string, string[]>();
  private readonly entries = new Map<string, QueueRankEntrySnapshot>();
  private readonly entryIdsBySnapshot = new Map<string, string[]>();
  private readonly suggestionSnapshots = new Map<string, QueueAssignmentSuggestionSnapshot>();
  private readonly suggestionIdsByRankSnapshot = new Map<string, string[]>();

  async getQueueRankPlan(planId: string): Promise<QueueRankPlanDocument | undefined> {
    const snapshot = this.plans.get(planId);
    return snapshot ? QueueRankPlanDocument.fromSnapshot(snapshot) : undefined;
  }

  async getLatestQueueRankPlanByFamily(
    queueFamilyRef: string,
  ): Promise<QueueRankPlanDocument | undefined> {
    const planId = this.latestPlanByFamily.get(queueFamilyRef);
    return planId ? this.getQueueRankPlan(planId) : undefined;
  }

  async saveQueueRankPlan(
    plan: QueueRankPlanDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = plan.toSnapshot();
    saveWithCas(this.plans, snapshot.queueRankPlanId, snapshot, options);
    const currentPlanId = this.latestPlanByFamily.get(snapshot.queueFamilyRef);
    if (!currentPlanId) {
      this.latestPlanByFamily.set(snapshot.queueFamilyRef, snapshot.queueRankPlanId);
      return;
    }
    const current = this.plans.get(currentPlanId)!;
    if (
      current.effectiveAt.localeCompare(snapshot.effectiveAt) < 0 ||
      current.version < snapshot.version
    ) {
      this.latestPlanByFamily.set(snapshot.queueFamilyRef, snapshot.queueRankPlanId);
    }
  }

  async getQueueRankSnapshot(
    rankSnapshotId: string,
  ): Promise<QueueRankSnapshotDocument | undefined> {
    const snapshot = this.snapshots.get(rankSnapshotId);
    return snapshot ? QueueRankSnapshotDocument.create(snapshot) : undefined;
  }

  async getLatestQueueRankSnapshotByQueue(
    queueRef: string,
  ): Promise<QueueRankSnapshotDocument | undefined> {
    const ids = this.snapshotIdsByQueue.get(queueRef) ?? [];
    const latestId = ids.at(-1);
    return latestId ? this.getQueueRankSnapshot(latestId) : undefined;
  }

  async saveQueueRankSnapshot(
    snapshot: QueueRankSnapshotDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const normalized = snapshot.toSnapshot();
    saveWithCas(this.snapshots, normalized.rankSnapshotId, normalized, options);
    const ids = this.snapshotIdsByQueue.get(normalized.queueRef) ?? [];
    if (!ids.includes(normalized.rankSnapshotId)) {
      ids.push(normalized.rankSnapshotId);
      ids.sort((left, right) => {
        const leftSnapshot = this.snapshots.get(left)!;
        const rightSnapshot = this.snapshots.get(right)!;
        return compareIso(leftSnapshot.generatedAt, rightSnapshot.generatedAt);
      });
      this.snapshotIdsByQueue.set(normalized.queueRef, ids);
    }
  }

  async listQueueRankEntries(rankSnapshotRef: string): Promise<readonly QueueRankEntryDocument[]> {
    const ids = this.entryIdsBySnapshot.get(rankSnapshotRef) ?? [];
    return ids
      .map((id) => this.entries.get(id))
      .filter((entry): entry is QueueRankEntrySnapshot => Boolean(entry))
      .sort((left, right) => left.ordinal - right.ordinal)
      .map((entry) => QueueRankEntryDocument.create(entry));
  }

  async saveQueueRankEntry(
    entry: QueueRankEntryDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const snapshot = entry.toSnapshot();
    saveWithCas(this.entries, snapshot.rankEntryId, snapshot, options);
    const ids = this.entryIdsBySnapshot.get(snapshot.rankSnapshotRef) ?? [];
    if (!ids.includes(snapshot.rankEntryId)) {
      ids.push(snapshot.rankEntryId);
      ids.sort();
      this.entryIdsBySnapshot.set(snapshot.rankSnapshotRef, ids);
    }
  }

  async getQueueAssignmentSuggestionSnapshot(
    suggestionSnapshotId: string,
  ): Promise<QueueAssignmentSuggestionSnapshotDocument | undefined> {
    const snapshot = this.suggestionSnapshots.get(suggestionSnapshotId);
    return snapshot ? QueueAssignmentSuggestionSnapshotDocument.create(snapshot) : undefined;
  }

  async getLatestQueueAssignmentSuggestionByRankSnapshotRef(
    rankSnapshotRef: string,
  ): Promise<QueueAssignmentSuggestionSnapshotDocument | undefined> {
    const ids = this.suggestionIdsByRankSnapshot.get(rankSnapshotRef) ?? [];
    const latestId = ids.at(-1);
    return latestId ? this.getQueueAssignmentSuggestionSnapshot(latestId) : undefined;
  }

  async saveQueueAssignmentSuggestionSnapshot(
    snapshot: QueueAssignmentSuggestionSnapshotDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const normalized = snapshot.toSnapshot();
    saveWithCas(this.suggestionSnapshots, normalized.suggestionSnapshotId, normalized, options);
    const ids = this.suggestionIdsByRankSnapshot.get(normalized.rankSnapshotRef) ?? [];
    if (!ids.includes(normalized.suggestionSnapshotId)) {
      ids.push(normalized.suggestionSnapshotId);
      ids.sort((left, right) => {
        const leftSnapshot = this.suggestionSnapshots.get(left)!;
        const rightSnapshot = this.suggestionSnapshots.get(right)!;
        return compareIso(leftSnapshot.generatedAt, rightSnapshot.generatedAt);
      });
      this.suggestionIdsByRankSnapshot.set(normalized.rankSnapshotRef, ids);
    }
  }
}

export function createQueueRankingStore(): QueueRankingDependencies {
  return new InMemoryQueueRankingStore();
}

export function validateQueueRankSnapshotCoherence(
  snapshot: QueueRankSnapshot,
  entries: readonly QueueRankEntrySnapshot[],
): void {
  invariant(
    snapshot.trustInputRefs.length > 0,
    "QUEUE_SNAPSHOT_MISSING_TRUST_INPUTS",
    "QueueRankSnapshot must publish trustInputRefs.",
  );
  invariant(
    entries.length > 0,
    "QUEUE_SNAPSHOT_MISSING_ENTRIES",
    "QueueRankSnapshot must publish QueueRankEntry rows.",
  );
  const entrySnapshotRefs = new Set(entries.map((entry) => entry.rankSnapshotRef));
  invariant(
    entrySnapshotRefs.size === 1 && entrySnapshotRefs.has(snapshot.rankSnapshotId),
    "QUEUE_SNAPSHOT_ENTRY_REF_DRIFT",
    "Every QueueRankEntry must bind the committed QueueRankSnapshot.",
  );
  const eligibleEntries = entries.filter((entry) => entry.eligibilityState === "eligible");
  const eligibleRefs = [...eligibleEntries]
    .sort((left, right) => left.ordinal - right.ordinal)
    .map((entry) => entry.taskRef);
  invariant(
    snapshot.eligibleTaskRefs.join("|") === eligibleRefs.sort().join("|"),
    "QUEUE_SNAPSHOT_ELIGIBLE_REF_DRIFT",
    "QueueRankSnapshot.eligibleTaskRefs drifted from eligible entry rows.",
  );
  const rowOrderHash = `queue-row-order::${stableQueueDigestHex(
    [...entries]
      .sort((left, right) => left.ordinal - right.ordinal)
      .map(
        (entry) =>
          `${entry.ordinal}:${entry.taskRef}:${entry.eligibilityState}:${entry.canonicalTieBreakKey}`,
      )
      .join("|"),
  )}`;
  invariant(
    snapshot.rowOrderHash === rowOrderHash,
    "QUEUE_ROW_ORDER_HASH_DRIFT",
    "QueueRankSnapshot.rowOrderHash does not match the committed entry order.",
  );

  if (snapshot.overloadState === "overload_critical") {
    for (const entry of eligibleEntries) {
      invariant(
        entry.normalizedExplanationPayload.fairnessTransition.promiseState ===
          "suppressed_overload",
        "QUEUE_OVERLOAD_FAIRNESS_PROMISE_DRIFT",
        "Overload-critical snapshots must suppress fairness promises.",
      );
    }
  }
}

export function validateQueueAssignmentSuggestionIsolation(input: {
  rankSnapshot: QueueRankSnapshot;
  entries: readonly QueueRankEntrySnapshot[];
  suggestionSnapshot: QueueAssignmentSuggestionSnapshot;
}): void {
  invariant(
    input.suggestionSnapshot.rankSnapshotRef === input.rankSnapshot.rankSnapshotId,
    "QUEUE_SUGGESTION_SNAPSHOT_REF_DRIFT",
    "QueueAssignmentSuggestionSnapshot must bind the committed QueueRankSnapshot.",
  );
  const entryByTaskRef = new Map(input.entries.map((entry) => [entry.taskRef, entry]));
  const eligibleTopWindow = input.entries
    .filter((entry) => entry.eligibilityState === "eligible")
    .sort((left, right) => left.ordinal - right.ordinal)
    .slice(0, input.suggestionSnapshot.candidateWindowSize)
    .map((entry) => entry.taskRef);

  for (const row of input.suggestionSnapshot.suggestionRows) {
    const entry = entryByTaskRef.get(row.taskRef);
    invariant(
      Boolean(entry),
      "QUEUE_SUGGESTION_UNKNOWN_TASK",
      `Suggestion row ${row.taskRef} is missing a source QueueRankEntry.`,
    );
    invariant(
      eligibleTopWindow.includes(row.taskRef),
      "QUEUE_SUGGESTION_OUTSIDE_WINDOW",
      `Suggestion row ${row.taskRef} sits outside the candidate window.`,
    );
    invariant(
      row.ordinal === entry!.ordinal,
      "QUEUE_SUGGESTION_ORDINAL_MUTATION",
      "Suggestions may not rewrite canonical ordinals.",
    );
    invariant(
      row.canonicalTieBreakKey === entry!.canonicalTieBreakKey,
      "QUEUE_SUGGESTION_TIE_BREAK_MUTATION",
      "Suggestions may not rewrite canonical tie-break keys.",
    );
    invariant(
      row.explanationPayloadRef === entry!.explanationPayloadRef,
      "QUEUE_SUGGESTION_EXPLANATION_MUTATION",
      "Suggestions may not rewrite explanation payload references.",
    );
  }
}

export function validateQueueConsumerSnapshotRefs(input: QueueSnapshotConsumerSet): void {
  const source = requireRef(input.sourceQueueRankSnapshotRef, "sourceQueueRankSnapshotRef");
  const allRefs = [
    ...input.queueRowSnapshotRefs,
    ...input.nextTaskSnapshotRefs,
    ...input.previewSnapshotRefs,
  ].map((value) => requireRef(value, "consumerQueueRankSnapshotRef"));
  const drift = allRefs.find((value) => value !== source);
  invariant(
    drift === undefined,
    "QUEUE_CONSUMER_MIXED_SNAPSHOT_DRIFT",
    "Mixed-snapshot queue truth is forbidden across rows, preview, and next-task candidates.",
  );
}

export interface PublishQueueRankPlanInput
  extends Omit<QueueRankPlanSnapshot, "planHash" | "version"> {
  version?: number;
}

export interface MaterializeQueueRankSnapshotResult {
  plan: QueueRankPlanDocument;
  snapshot: QueueRankSnapshotDocument;
  entries: readonly QueueRankEntryDocument[];
}

export interface SuggestQueueAssignmentsResult {
  snapshot: QueueAssignmentSuggestionSnapshotDocument;
  sourceSnapshot: QueueRankSnapshotDocument;
  sourceEntries: readonly QueueRankEntryDocument[];
}

export class QueueRankingAuthorityService {
  constructor(
    private readonly repositories: QueueRankingDependencies,
    private readonly idGenerator = createDeterministicQueueRankingIdGenerator(),
  ) {}

  async publishPlan(input: PublishQueueRankPlanInput): Promise<QueueRankPlanDocument> {
    const latest = await this.repositories.getLatestQueueRankPlanByFamily(input.queueFamilyRef);
    const plan = QueueRankPlanDocument.create({
      ...input,
      queueRankPlanId: input.queueRankPlanId,
      version: input.version ?? (latest ? latest.toSnapshot().version + 1 : 1),
    });
    await this.repositories.saveQueueRankPlan(plan);
    return plan;
  }

  async materializeRankSnapshot(
    planId: string,
    factCutInput: QueueRankingFactCut,
  ): Promise<MaterializeQueueRankSnapshotResult> {
    const plan = await this.repositories.getQueueRankPlan(planId);
    invariant(Boolean(plan), "QUEUE_PLAN_MISSING", `QueueRankPlan ${planId} was not found.`);
    const planDocument = plan!;
    const planSnapshot = planDocument.toSnapshot();
    const factCut = validateQueueFactCut(factCutInput, planSnapshot);
    const computedPrePass = factCut.taskFacts.map((task) =>
      computeTaskRanking(planSnapshot, factCut, task, null),
    );
    const { overloadState, rhoCritical } = resolveOverloadState(planSnapshot, factCut, computedPrePass);
    const computed = factCut.taskFacts.map((task) =>
      computeTaskRanking(planSnapshot, factCut, task, rhoCritical),
    );
    const eligible = computed.filter((task) => task.eligibilityState === "eligible");
    const held = computed
      .filter((task) => task.eligibilityState !== "eligible")
      .sort(holdComparator);

    const critical = eligible
      .filter((task) => task.task.escalated || task.slaClass === 3)
      .sort(baseComparator);
    const routine = eligible.filter((task) => !critical.includes(task));

    const orderedEligible: Array<{
      task: RankedTaskComputation;
      fairnessCreditBefore: number;
      fairnessCreditAfter: number;
      mergeClass: QueueFairnessMergeClass;
    }> = critical.map((task) => ({
      task,
      fairnessCreditBefore: 0,
      fairnessCreditAfter: 0,
      mergeClass: "critical_bypass",
    }));

    if (overloadState === "overload_critical") {
      orderedEligible.push(
        ...routine.sort(baseComparator).map((task) => ({
          task,
          fairnessCreditBefore: 0,
          fairnessCreditAfter: 0,
          mergeClass: "critical_bypass" as const,
        })),
      );
    } else {
      orderedEligible.push(
        ...mergeRoutineByFairness(routine, planSnapshot).map((emission) => ({
          task: emission.task,
          fairnessCreditBefore: emission.beforeCredit,
          fairnessCreditAfter: emission.afterCredit,
          mergeClass: "routine_fair_merge" as const,
        })),
      );
    }

    const orderedHeld = held.map((task) => ({
      task,
      fairnessCreditBefore: 0,
      fairnessCreditAfter: 0,
      mergeClass: "held" as const,
    }));

    const ordered = [...orderedEligible, ...orderedHeld];
    const fairnessCycleStateRef = `queue-fairness-cycle::${stableQueueDigestHex(
      stableStringify(
        orderedEligible.map((row) => ({
          taskRef: row.task.task.taskRef,
          fairnessBandRef: row.task.fairnessBandRef,
          before: row.fairnessCreditBefore,
          after: row.fairnessCreditAfter,
          mergeClass: row.mergeClass,
        })),
      ),
    )}`;

    const rankSnapshotId = this.idGenerator.nextId("queueRankSnapshot");
    const entries = ordered.map((row, index) => {
      const explanation = buildExplanationPayload({
        plan: planSnapshot,
        factCut,
        overloadState,
        rhoCritical,
        task: row.task,
        fairnessCreditBefore: row.fairnessCreditBefore,
        fairnessCreditAfter: row.fairnessCreditAfter,
        mergeClass: row.mergeClass,
      });
      return QueueRankEntryDocument.create({
        rankEntryId: this.idGenerator.nextId("queueRankEntry"),
        rankSnapshotRef: rankSnapshotId,
        taskRef: row.task.task.taskRef,
        ordinal: index + 1,
        eligibilityState: row.task.eligibilityState,
        lexicographicTier: row.task.lexicographicTier,
        urgencyScore: row.task.withinTierUrgency,
        residualBand: row.task.residualBand,
        contactRiskBand: row.task.contactRiskBand,
        duplicateReviewFlag: row.task.task.duplicateReviewFlag,
        urgencyCarry: row.task.task.urgencyCarry,
        fairnessBandRef: row.task.fairnessBandRef,
        fairnessCreditBefore: row.fairnessCreditBefore,
        fairnessCreditAfter: row.fairnessCreditAfter,
        canonicalTieBreakKey: row.task.canonicalTieBreakKey,
        explanationPayloadRef: explanationPayloadRef(explanation),
        generatedAt: factCut.generatedAt,
        version: 1,
        normalizedExplanationPayload: explanation,
      });
    });

    const rowOrderHash = `queue-row-order::${stableQueueDigestHex(
      entries
        .map((entry) => {
          const snapshot = entry.toSnapshot();
          return `${snapshot.ordinal}:${snapshot.taskRef}:${snapshot.eligibilityState}:${snapshot.canonicalTieBreakKey}`;
        })
        .join("|"),
    )}`;

    const snapshot = QueueRankSnapshotDocument.create({
      rankSnapshotId,
      queueRef: factCut.queueRef,
      queueRankPlanRef: planSnapshot.queueRankPlanId,
      asOfAt: factCut.asOfAt,
      sourceFactCutRef: factCut.sourceFactCutRef,
      trustInputRefs: factCut.trustInputRefs,
      eligibleTaskRefs: orderedEligible.map((row) => row.task.task.taskRef),
      excludedTaskRefs: orderedHeld.map((row) => row.task.task.taskRef),
      overloadState,
      fairnessCycleStateRef,
      rowOrderHash,
      generatedAt: factCut.generatedAt,
      version: 1,
    });

    validateQueueRankSnapshotCoherence(
      snapshot.toSnapshot(),
      entries.map((entry) => entry.toSnapshot()),
    );
    await this.repositories.saveQueueRankSnapshot(snapshot);
    for (const entry of entries) {
      await this.repositories.saveQueueRankEntry(entry);
    }
    return { plan: planDocument, snapshot, entries };
  }

  async deriveAssignmentSuggestionSnapshot(input: {
    rankSnapshotRef: string;
    reviewerScopeRef: string;
    candidateWindowSize?: number;
    reviewers: readonly QueueReviewerFact[];
    generatedAt: string;
  }): Promise<SuggestQueueAssignmentsResult> {
    const sourceSnapshot = await this.repositories.getQueueRankSnapshot(input.rankSnapshotRef);
    invariant(
      Boolean(sourceSnapshot),
      "QUEUE_SNAPSHOT_MISSING",
      `QueueRankSnapshot ${input.rankSnapshotRef} was not found.`,
    );
    const snapshot = sourceSnapshot!.toSnapshot();
    const plan = await this.repositories.getQueueRankPlan(snapshot.queueRankPlanRef);
    invariant(
      Boolean(plan),
      "QUEUE_PLAN_MISSING_FOR_SUGGESTIONS",
      `QueueRankPlan ${snapshot.queueRankPlanRef} was not found.`,
    );
    const planSnapshot = plan!.toSnapshot();
    const entries = (await this.repositories.listQueueRankEntries(snapshot.rankSnapshotId)).map(
      (entry) => entry.toSnapshot(),
    );
    const eligibleEntries = entries
      .filter((entry) => entry.eligibilityState === "eligible")
      .sort((left, right) => left.ordinal - right.ordinal);
    const candidateWindowSize = Math.max(
      1,
      input.candidateWindowSize ??
        planSnapshot.policyBundle.assignmentSuggestionPolicy.candidateWindowSize,
    );
    const windowEntries = eligibleEntries.slice(0, candidateWindowSize);

    const normalizedReviewers = [...input.reviewers]
      .map((reviewer) => ({
        reviewerRef: requireRef(reviewer.reviewerRef, "reviewerRef"),
        freeCapacity: ensureNonNegativeNumber(reviewer.freeCapacity, "freeCapacity"),
        loadHeadroom: ensureUnitInterval(reviewer.loadHeadroom, "loadHeadroom"),
        eligibleTaskRefs: reviewer.eligibleTaskRefs
          ? uniqueSortedRefs(reviewer.eligibleTaskRefs)
          : undefined,
        skillScores: reviewer.skillScores,
        continuityScores: reviewer.continuityScores ?? {},
        sameContextTaskRefs: reviewer.sameContextTaskRefs ?? [],
        contextSwitchCosts: reviewer.contextSwitchCosts ?? {},
        focusPenaltyByTaskRef: reviewer.focusPenaltyByTaskRef ?? {},
      }))
      .sort((left, right) => left.reviewerRef.localeCompare(right.reviewerRef));

    const remainingCapacity = new Map(
      normalizedReviewers.map((reviewer) => [reviewer.reviewerRef, reviewer.freeCapacity]),
    );
    const suggestionRows: QueueAssignmentSuggestionRow[] = [];
    const governedAutoClaimRefs: string[] = [];

    for (const entry of windowEntries) {
      const scored = normalizedReviewers
        .filter((reviewer) => {
          const capacity = remainingCapacity.get(reviewer.reviewerRef) ?? 0;
          if (capacity <= 0) {
            return false;
          }
          if (reviewer.eligibleTaskRefs && !reviewer.eligibleTaskRefs.includes(entry.taskRef)) {
            return false;
          }
          return true;
        })
        .map((reviewer) => {
          const sameContext = reviewer.sameContextTaskRefs.includes(entry.taskRef) ? 1 : 0;
          const skill = clamp(reviewer.skillScores[entry.taskRef] ?? 0, 0, 1);
          const continuity = clamp(reviewer.continuityScores[entry.taskRef] ?? 0, 0, 1);
          const contextSwitch = clamp(reviewer.contextSwitchCosts[entry.taskRef] ?? 0, 0, 1);
          const focusPenalty = clamp(reviewer.focusPenaltyByTaskRef[entry.taskRef] ?? 0, 0, 1);
          const score =
            planSnapshot.policyBundle.assignmentSuggestionPolicy.lambda_skill * skill +
            planSnapshot.policyBundle.assignmentSuggestionPolicy.lambda_cont * continuity +
            planSnapshot.policyBundle.assignmentSuggestionPolicy.lambda_load * reviewer.loadHeadroom +
            planSnapshot.policyBundle.assignmentSuggestionPolicy.lambda_sticky * sameContext -
            planSnapshot.policyBundle.assignmentSuggestionPolicy.lambda_ctx * contextSwitch -
            planSnapshot.policyBundle.assignmentSuggestionPolicy.lambda_focus * focusPenalty;
          return {
            reviewerRef: reviewer.reviewerRef,
            score: Number(score.toFixed(6)),
            loadHeadroom: reviewer.loadHeadroom,
            reasonRefs: uniqueSortedRefs(
              [
                skill > 0 ? "skill_fit" : "",
                continuity > 0 ? "continuity_fit" : "",
                sameContext ? "same_context" : "",
                focusPenalty > 0 ? "focus_penalty_applied" : "",
                contextSwitch > 0 ? "context_switch_penalty_applied" : "",
              ].filter(Boolean),
            ),
          };
        })
        .sort(
          (left, right) =>
            right.score - left.score || left.reviewerRef.localeCompare(right.reviewerRef),
        );

      const best = scored[0];
      const second = scored[1];
      if (best) {
        remainingCapacity.set(best.reviewerRef, (remainingCapacity.get(best.reviewerRef) ?? 0) - 1);
      }

      const governedAutoClaimEligible = Boolean(
        best &&
          best.score > 0 &&
          (!second ||
            best.score - second.score >=
              planSnapshot.policyBundle.assignmentSuggestionPolicy.epsilon_assign) &&
          best.loadHeadroom >=
            1 - planSnapshot.policyBundle.assignmentSuggestionPolicy.softWipCapRatio,
      );
      if (governedAutoClaimEligible && best) {
        governedAutoClaimRefs.push(entry.taskRef);
      }

      suggestionRows.push({
        taskRef: entry.taskRef,
        ordinal: entry.ordinal,
        reviewerRef: best?.reviewerRef ?? null,
        suggestionScore: best?.score ?? 0,
        governedAutoClaimEligible,
        canonicalTieBreakKey: entry.canonicalTieBreakKey,
        explanationPayloadRef: entry.explanationPayloadRef,
        reasonRefs: best?.reasonRefs ?? [],
      });
    }

    const suggestionSnapshot = QueueAssignmentSuggestionSnapshotDocument.create({
      suggestionSnapshotId: this.idGenerator.nextId("queueAssignmentSuggestionSnapshot"),
      rankSnapshotRef: snapshot.rankSnapshotId,
      reviewerScopeRef: requireRef(input.reviewerScopeRef, "reviewerScopeRef"),
      candidateWindowSize,
      suggestionRows,
      governedAutoClaimRefs,
      generatedAt: ensureIsoTimestamp(input.generatedAt, "generatedAt"),
      version: 1,
      fairnessPromiseState:
        snapshot.overloadState === "overload_critical" ? "suppressed_overload" : "active",
    });

    validateQueueAssignmentSuggestionIsolation({
      rankSnapshot: snapshot,
      entries,
      suggestionSnapshot: suggestionSnapshot.toSnapshot(),
    });

    await this.repositories.saveQueueAssignmentSuggestionSnapshot(suggestionSnapshot);
    return {
      snapshot: suggestionSnapshot,
      sourceSnapshot: sourceSnapshot!,
      sourceEntries: entries.map((entry) => QueueRankEntryDocument.create(entry)),
    };
  }

  validateConsumerSnapshotSet(input: QueueSnapshotConsumerSet): void {
    validateQueueConsumerSnapshotRefs(input);
  }
}

export function createQueueRankingAuthorityService(
  repositories = createQueueRankingStore(),
  idGenerator = createDeterministicQueueRankingIdGenerator(),
): QueueRankingAuthorityService {
  return new QueueRankingAuthorityService(repositories, idGenerator);
}

export const queueDefaultPlan = QueueRankPlanDocument.create({
  queueRankPlanId: "queue_rank_plan::phase3_v1",
  queueFamilyRef: "staff_review_routine",
  eligibilityRuleSetRef: "queue_eligibility_rules::phase3_v1",
  lexicographicTierPolicyRef: "queue_lexicographic_policy::phase3_v1",
  withinTierWeightSetRef: "queue_within_tier_weights::phase3_v1",
  fairnessMergePolicyRef: "queue_fairness_merge_policy::phase3_v1",
  overloadGuardPolicyRef: "queue_overload_guard_policy::phase3_v1",
  assignmentSuggestionPolicyRef: "queue_assignment_suggestion_policy::phase3_v1",
  explanationSchemaRef: "schema::queue-rank-explanation-payload@v1",
  canonicalTieBreakPolicyRef: "canonical_tie_break_policy::queue_entered_then_task_hash_v1",
  effectiveAt: "2026-04-16T00:00:00Z",
  version: 1,
  policyBundle: {
    eligibilityRules: {
      requireTrustedFactCut: true,
      requireTrustInputs: true,
      blockAssimilationPending: true,
      blockPreemptionPending: true,
      excludeScopeBlocked: true,
    },
    lexicographicTierPolicy: {
      precedenceKeys: [
        "escalated",
        "slaClass",
        "clinicalPriorityBand",
        "maxRiskBand",
        "duplicateReviewFlag",
        "urgencyCarry",
      ],
      stableTailKeys: ["withinTierUrgency", "queueEnteredAt", "canonicalTieBreakKey"],
      criticalBypassRule: "escalated_i = 1 or slaClass_i = 3",
      riskBandThresholds: {
        watch: 0.25,
        warn: 0.5,
        critical: 0.75,
      },
    },
    withinTierWeightSet: {
      thetaSlaCriticalMinutes: 120,
      thetaSlaWarnMinutes: 480,
      tauSlaMinutes: 90,
      tauLateMinutes: 60,
      lateHorizonMinutes: 480,
      tauReturnMinutes: 120,
      returnHorizonMinutes: 720,
      tauAgeMinutes: 240,
      ageCapMinutes: 1440,
      minimumServiceMinutes: 5,
      betaWarn: 0.4,
      betaLate: 0.6,
      weightSla: 0.28,
      weightAge: 0.12,
      weightResidual: 0.22,
      weightContact: 0.16,
      weightReturn: 0.12,
      weightCarry: 0.07,
      weightVulnerability: 0.03,
      returnBase: 0.35,
      returnDelta: 0.4,
      returnWait: 0.25,
    },
    fairnessMergePolicy: {
      algorithm: "deterministic_service_cost_aware_deficit_round_robin",
      C_max: 4,
      bands: [
        {
          fairnessBandRef: "band_returned_review",
          fixedBandOrder: 1,
          q_b: 1.25,
          gamma_age: 0.4,
          A_b_minutes: 120,
          H_b_minutes: 360,
          s_quantum_minutes: 15,
          eligibilitySummary: "returned_i = 1 and escalated_i = 0 and slaClass_i < 3",
        },
        {
          fairnessBandRef: "band_risk_attention",
          fixedBandOrder: 2,
          q_b: 1.0,
          gamma_age: 0.35,
          A_b_minutes: 180,
          H_b_minutes: 480,
          s_quantum_minutes: 18,
          eligibilitySummary: "non-critical work with residualBand_i >= 2 or contactRiskBand_i >= 2",
        },
        {
          fairnessBandRef: "band_routine",
          fixedBandOrder: 3,
          q_b: 0.85,
          gamma_age: 0.3,
          A_b_minutes: 240,
          H_b_minutes: 600,
          s_quantum_minutes: 20,
          eligibilitySummary: "non-critical routine review work",
        },
        {
          fairnessBandRef: "band_low_intensity",
          fixedBandOrder: 4,
          q_b: 0.7,
          gamma_age: 0.25,
          A_b_minutes: 300,
          H_b_minutes: 720,
          s_quantum_minutes: 12,
          eligibilitySummary: "low-intensity non-critical work that still needs starvation protection",
        },
      ],
    },
    overloadGuardPolicy: {
      formula:
        "rho_crit = lambdaHat_crit * mean(expectedService_i | escalated_i = 1 or slaClass_i = 3) / (m * muHat)",
      rhoGuard: 0.85,
      overloadEventId: "triage.queue.overload_critical",
      suppressedPromises: [
        "starvation_free_copy",
        "routine_eta_promises",
        "fairness_floor_reassurance",
      ],
      triggeredResponses: ["staffing", "diversion", "sla_rebasing"],
    },
    assignmentSuggestionPolicy: {
      formula:
        "assignScore(i,r) = lambda_skill * skill_{i,r} + lambda_cont * continuity_{i,r} + lambda_load * loadHeadroom_r + lambda_sticky * sameContext_{i,r} - lambda_ctx * contextSwitchCost_{i,r} - lambda_focus * focusPenalty_{i,r}",
      candidateWindowSize: 12,
      lambda_skill: 0.38,
      lambda_cont: 0.22,
      lambda_load: 0.18,
      lambda_sticky: 0.1,
      lambda_ctx: 0.07,
      lambda_focus: 0.05,
      epsilon_assign: 0.08,
      softWipCapRatio: 0.9,
      mayRewriteCanonicalOrder: false,
    },
  },
}).toSnapshot();
