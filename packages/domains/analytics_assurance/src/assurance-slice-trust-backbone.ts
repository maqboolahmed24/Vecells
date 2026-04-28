import { createHash } from "node:crypto";
import {
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
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

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}_TIMESTAMP`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

function ensureNonNegativeNumber(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative number.`,
  );
  return value;
}

function ensurePositiveNumber(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive number.`,
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

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
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
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
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

function nextAssuranceSliceTrustId(idGenerator: BackboneIdGenerator): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(
    "assurance_slice_trust_record",
  );
}

function effectiveSampleSize(weights: readonly number[]): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const squared = weights.reduce((sum, weight) => sum + weight * weight, 0);
  return squared <= 0 ? 1 : (total * total) / squared;
}

function wilsonLowerBound(probability: number, sampleSize: number, z = 1.96): number {
  const p = ensureUnitInterval(probability, "probability");
  const n = Math.max(1, sampleSize);
  const zSquared = z * z;
  const denominator = 1 + zSquared / n;
  const centre = p + zSquared / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + zSquared / (4 * n * n));
  return Math.max(0, Math.min(1, (centre - margin) / denominator));
}

function geometricMean(
  components: readonly [string, number][],
  weights: AssuranceTrustWeights,
): number {
  invariant(
    components.length === 5,
    "ASSURANCE_COMPONENT_COUNT_INVALID",
    "Assurance trust scoring requires exactly five component scores.",
  );
  const [, freshness] = components[0]!;
  const [, coverage] = components[1]!;
  const [, lineage] = components[2]!;
  const [, replay] = components[3]!;
  const [, consistency] = components[4]!;
  const weightedLog =
    weights.freshness * Math.log(Math.max(1e-6, freshness)) +
    weights.coverage * Math.log(Math.max(1e-6, coverage)) +
    weights.lineage * Math.log(Math.max(1e-6, lineage)) +
    weights.replay * Math.log(Math.max(1e-6, replay)) +
    weights.consistency * Math.log(Math.max(1e-6, consistency));
  return Math.exp(weightedLog);
}

function normalizeWeights(overrides?: Partial<AssuranceTrustWeights>): AssuranceTrustWeights {
  const merged = {
    ...defaultAssuranceTrustWeights,
    ...overrides,
  };
  const values = [
    merged.freshness,
    merged.coverage,
    merged.lineage,
    merged.replay,
    merged.consistency,
  ];
  values.forEach((value, index) => ensurePositiveNumber(value, `weight_${index}`));
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    freshness: merged.freshness / total,
    coverage: merged.coverage / total,
    lineage: merged.lineage / total,
    replay: merged.replay / total,
    consistency: merged.consistency / total,
  };
}

function scoreRules(rules: readonly AssuranceWeightedCheck[]): {
  pointScore: number;
  lowerBound: number;
  failedMandatoryRuleIds: string[];
} {
  invariant(
    rules.length > 0,
    "ASSURANCE_RULE_SET_EMPTY",
    "At least one weighted rule is required.",
  );
  const normalizedRules = rules.map((rule) => ({
    ...rule,
    ruleId: requireRef(rule.ruleId, "ruleId"),
    weight: ensurePositiveNumber(rule.weight, "weight"),
  }));
  const totalWeight = normalizedRules.reduce((sum, rule) => sum + rule.weight, 0);
  const satisfiedWeight = normalizedRules.reduce(
    (sum, rule) => sum + (rule.satisfied ? rule.weight : 0),
    0,
  );
  const pointScore = satisfiedWeight / totalWeight;
  const lowerBound = wilsonLowerBound(
    pointScore,
    effectiveSampleSize(normalizedRules.map((rule) => rule.weight)),
  );
  return {
    pointScore,
    lowerBound,
    failedMandatoryRuleIds: normalizedRules
      .filter((rule) => rule.mandatory && !rule.satisfied)
      .map((rule) => rule.ruleId),
  };
}

export type AssuranceTrustState = "trusted" | "degraded" | "quarantined" | "unknown";
export type AssuranceCompletenessState = "complete" | "partial" | "blocked";

export interface AssuranceTrustWeights {
  freshness: number;
  coverage: number;
  lineage: number;
  replay: number;
  consistency: number;
}

export interface AssuranceWeightedCheck {
  ruleId: string;
  weight: number;
  satisfied: boolean;
  mandatory?: boolean;
}

export interface AssuranceSliceTrustEvaluationInput {
  sliceNamespace: string;
  producerScopeRef: string;
  reasonCode: string;
  evaluationModelRef: string;
  evidenceRef: string;
  effectiveAt: string;
  reviewDueAt: string;
  updatedAt: string;
  lagMs: number;
  lagBudgetMs: number;
  tauMs: number;
  coverageChecks: readonly AssuranceWeightedCheck[];
  lineageChecks: readonly AssuranceWeightedCheck[];
  replayChecks: readonly AssuranceWeightedCheck[];
  consistencyChecks: readonly AssuranceWeightedCheck[];
  schemaCompatible: boolean;
  evaluationInputsAvailable: boolean;
  hashVerificationPassed: boolean;
  lineageVerificationPassed: boolean;
  redactionParityPassed: boolean;
  replayDeterminismPassed: boolean;
  mandatoryProducerQuarantinedRefs?: readonly string[];
  blockingProducerRefs?: readonly string[];
  blockingNamespaceRefs?: readonly string[];
  weights?: Partial<AssuranceTrustWeights>;
}

export interface AssuranceSliceTrustRecordSnapshot {
  sliceTrustId: string;
  sliceNamespace: string;
  producerScopeRef: string;
  trustState: AssuranceTrustState;
  completenessState: AssuranceCompletenessState;
  reasonCode: string;
  trustScore: number;
  trustLowerBound: number;
  freshnessScore: number;
  coverageScore: number;
  lineageScore: number;
  replayScore: number;
  consistencyScore: number;
  hardBlockState: boolean;
  blockingProducerRefs: readonly string[];
  blockingNamespaceRefs: readonly string[];
  evaluationModelRef: string;
  evaluationInputHash: string;
  evidenceRef: string;
  effectiveAt: string;
  reviewDueAt: string;
  updatedAt: string;
  version: number;
}

export interface PersistedAssuranceSliceTrustRecordRow extends AssuranceSliceTrustRecordSnapshot {
  aggregateType: "AssuranceSliceTrustRecord";
  persistenceSchemaVersion: 1;
}

export interface AssuranceSliceTrustEvaluationResult {
  readonly snapshot: AssuranceSliceTrustRecordSnapshot;
  readonly blockers: readonly string[];
  readonly failedCoverageRuleIds: readonly string[];
}

export const defaultAssuranceTrustWeights = {
  freshness: 0.2,
  coverage: 0.25,
  lineage: 0.2,
  replay: 0.2,
  consistency: 0.15,
} as const satisfies AssuranceTrustWeights;

export const defaultAssuranceTrustEvaluationModelRef = "assurance_slice_trust_model::par_075_v1";

export function evaluateAssuranceSliceTrust(
  input: AssuranceSliceTrustEvaluationInput,
): AssuranceSliceTrustEvaluationResult {
  const effectiveAt = ensureIsoTimestamp(input.effectiveAt, "effectiveAt");
  const reviewDueAt = ensureIsoTimestamp(input.reviewDueAt, "reviewDueAt");
  const updatedAt = ensureIsoTimestamp(input.updatedAt, "updatedAt");
  invariant(
    compareIso(reviewDueAt, effectiveAt) >= 0,
    "REVIEW_DUE_AT_BEFORE_EFFECTIVE_AT",
    "reviewDueAt must be on or after effectiveAt.",
  );
  invariant(
    compareIso(updatedAt, effectiveAt) >= 0,
    "UPDATED_AT_BEFORE_EFFECTIVE_AT",
    "updatedAt must be on or after effectiveAt.",
  );

  const coverage = scoreRules(input.coverageChecks);
  const lineage = scoreRules(input.lineageChecks);
  const replay = scoreRules(input.replayChecks);
  const consistency = scoreRules(input.consistencyChecks);
  const freshnessScore = Math.exp(
    -Math.max(
      0,
      ensureNonNegativeNumber(input.lagMs, "lagMs") -
        ensureNonNegativeNumber(input.lagBudgetMs, "lagBudgetMs"),
    ) / ensurePositiveNumber(input.tauMs, "tauMs"),
  );
  const weights = normalizeWeights(input.weights);
  const pointScore = geometricMean(
    [
      ["freshness", freshnessScore],
      ["coverage", coverage.pointScore],
      ["lineage", lineage.pointScore],
      ["replay", replay.pointScore],
      ["consistency", consistency.pointScore],
    ],
    weights,
  );
  const lowerBound = geometricMean(
    [
      ["freshness", freshnessScore],
      ["coverage", coverage.lowerBound],
      ["lineage", lineage.lowerBound],
      ["replay", replay.lowerBound],
      ["consistency", consistency.lowerBound],
    ],
    weights,
  );

  const blockingProducerRefs = uniqueSortedRefs([
    ...(input.blockingProducerRefs ?? []),
    ...(input.mandatoryProducerQuarantinedRefs ?? []),
  ]);
  const blockingNamespaceRefs = uniqueSortedRefs(input.blockingNamespaceRefs ?? []);
  const blockers: string[] = [];
  const hardBlockState =
    !input.schemaCompatible ||
    !input.hashVerificationPassed ||
    !input.lineageVerificationPassed ||
    !input.redactionParityPassed ||
    !input.replayDeterminismPassed ||
    coverage.failedMandatoryRuleIds.length > 0 ||
    lineage.failedMandatoryRuleIds.length > 0 ||
    replay.failedMandatoryRuleIds.length > 0 ||
    consistency.failedMandatoryRuleIds.length > 0 ||
    (input.mandatoryProducerQuarantinedRefs?.length ?? 0) > 0;

  if (!input.schemaCompatible) {
    blockers.push("BLOCKER_SCHEMA_INCOMPATIBLE");
  }
  if (!input.hashVerificationPassed) {
    blockers.push("BLOCKER_HASH_VERIFICATION_FAILED");
  }
  if (!input.lineageVerificationPassed) {
    blockers.push("BLOCKER_LINEAGE_VERIFICATION_FAILED");
  }
  if (!input.redactionParityPassed) {
    blockers.push("BLOCKER_REDACTION_PARITY_FAILED");
  }
  if (!input.replayDeterminismPassed) {
    blockers.push("BLOCKER_REPLAY_DIVERGENCE");
  }
  if (coverage.failedMandatoryRuleIds.length > 0) {
    blockers.push("BLOCKER_MANDATORY_COVERAGE_MISSING");
  }
  if (lineage.failedMandatoryRuleIds.length > 0) {
    blockers.push("BLOCKER_MANDATORY_LINEAGE_GAP");
  }
  if (replay.failedMandatoryRuleIds.length > 0) {
    blockers.push("BLOCKER_MANDATORY_REPLAY_GAP");
  }
  if (consistency.failedMandatoryRuleIds.length > 0) {
    blockers.push("BLOCKER_MANDATORY_CONSISTENCY_GAP");
  }
  if ((input.mandatoryProducerQuarantinedRefs?.length ?? 0) > 0) {
    blockers.push("BLOCKER_MANDATORY_PRODUCER_QUARANTINED");
  }

  let completenessState: AssuranceCompletenessState;
  if (!input.evaluationInputsAvailable || hardBlockState) {
    completenessState = "blocked";
  } else if (coverage.pointScore >= 0.999999) {
    completenessState = "complete";
  } else {
    completenessState = "partial";
  }

  let trustState: AssuranceTrustState;
  if (!input.evaluationInputsAvailable) {
    trustState = "unknown";
    blockers.push("BLOCKER_EVALUATION_INPUTS_UNAVAILABLE");
  } else if (hardBlockState || completenessState === "blocked" || lowerBound < 0.4) {
    trustState = "quarantined";
  } else if (lowerBound >= 0.85 && completenessState === "complete") {
    trustState = "trusted";
  } else {
    trustState = "degraded";
  }

  const evaluationInputHash = sha256Hex(
    stableStringify({
      ...input,
      blockingNamespaceRefs,
      blockingProducerRefs,
      mandatoryProducerQuarantinedRefs: uniqueSortedRefs(
        input.mandatoryProducerQuarantinedRefs ?? [],
      ),
      weights,
    }),
  );

  return {
    snapshot: {
      sliceTrustId: "",
      sliceNamespace: requireRef(input.sliceNamespace, "sliceNamespace"),
      producerScopeRef: requireRef(input.producerScopeRef, "producerScopeRef"),
      trustState,
      completenessState,
      reasonCode: requireRef(input.reasonCode, "reasonCode"),
      trustScore: pointScore,
      trustLowerBound: lowerBound,
      freshnessScore,
      coverageScore: coverage.pointScore,
      lineageScore: lineage.pointScore,
      replayScore: replay.pointScore,
      consistencyScore: consistency.pointScore,
      hardBlockState,
      blockingProducerRefs,
      blockingNamespaceRefs,
      evaluationModelRef: requireRef(input.evaluationModelRef, "evaluationModelRef"),
      evaluationInputHash,
      evidenceRef: requireRef(input.evidenceRef, "evidenceRef"),
      effectiveAt,
      reviewDueAt,
      updatedAt,
      version: 1,
    },
    blockers: uniqueSortedRefs(blockers),
    failedCoverageRuleIds: coverage.failedMandatoryRuleIds,
  };
}

export function validateAssuranceSliceTrustRecord(
  snapshot: AssuranceSliceTrustRecordSnapshot,
): AssuranceSliceTrustRecordSnapshot {
  const normalized = {
    ...snapshot,
    sliceTrustId: requireRef(snapshot.sliceTrustId, "sliceTrustId"),
    sliceNamespace: requireRef(snapshot.sliceNamespace, "sliceNamespace"),
    producerScopeRef: requireRef(snapshot.producerScopeRef, "producerScopeRef"),
    reasonCode: requireRef(snapshot.reasonCode, "reasonCode"),
    evaluationModelRef: requireRef(snapshot.evaluationModelRef, "evaluationModelRef"),
    evaluationInputHash: requireRef(snapshot.evaluationInputHash, "evaluationInputHash"),
    evidenceRef: requireRef(snapshot.evidenceRef, "evidenceRef"),
    effectiveAt: ensureIsoTimestamp(snapshot.effectiveAt, "effectiveAt"),
    reviewDueAt: ensureIsoTimestamp(snapshot.reviewDueAt, "reviewDueAt"),
    updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    trustScore: ensureUnitInterval(snapshot.trustScore, "trustScore"),
    trustLowerBound: ensureUnitInterval(snapshot.trustLowerBound, "trustLowerBound"),
    freshnessScore: ensureUnitInterval(snapshot.freshnessScore, "freshnessScore"),
    coverageScore: ensureUnitInterval(snapshot.coverageScore, "coverageScore"),
    lineageScore: ensureUnitInterval(snapshot.lineageScore, "lineageScore"),
    replayScore: ensureUnitInterval(snapshot.replayScore, "replayScore"),
    consistencyScore: ensureUnitInterval(snapshot.consistencyScore, "consistencyScore"),
    blockingProducerRefs: uniqueSortedRefs(snapshot.blockingProducerRefs),
    blockingNamespaceRefs: uniqueSortedRefs(snapshot.blockingNamespaceRefs),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };

  invariant(
    compareIso(normalized.reviewDueAt, normalized.effectiveAt) >= 0,
    "REVIEW_DUE_AT_BEFORE_EFFECTIVE_AT",
    "reviewDueAt must be on or after effectiveAt.",
  );
  invariant(
    compareIso(normalized.updatedAt, normalized.effectiveAt) >= 0,
    "UPDATED_AT_BEFORE_EFFECTIVE_AT",
    "updatedAt must be on or after effectiveAt.",
  );

  if (normalized.trustState === "trusted") {
    invariant(
      !normalized.hardBlockState &&
        normalized.completenessState === "complete" &&
        normalized.trustLowerBound >= 0.85,
      "TRUSTED_STATE_ILLEGAL",
      "trusted records require completeness, no hard block, and trustLowerBound >= 0.85.",
    );
  }

  if (normalized.trustState === "degraded") {
    invariant(
      !normalized.hardBlockState &&
        normalized.completenessState !== "blocked" &&
        normalized.trustLowerBound >= 0.4,
      "DEGRADED_STATE_ILLEGAL",
      "degraded records require bounded diagnostic posture without hard block.",
    );
  }

  if (normalized.trustState === "quarantined") {
    invariant(
      normalized.hardBlockState ||
        normalized.completenessState === "blocked" ||
        normalized.trustLowerBound < 0.4,
      "QUARANTINED_STATE_ILLEGAL",
      "quarantined records require hard block, blocked completeness, or trustLowerBound < 0.4.",
    );
  }

  if (normalized.trustState === "unknown") {
    invariant(
      normalized.completenessState === "blocked",
      "UNKNOWN_STATE_REQUIRES_BLOCKED_COMPLETENESS",
      "unknown records require blocked completeness while evaluation inputs are unavailable.",
    );
  }

  return normalized;
}

export function validateAssuranceSliceTrustThresholds(
  records: readonly AssuranceSliceTrustRecordSnapshot[],
): void {
  records.forEach((record) => validateAssuranceSliceTrustRecord(record));
}

export interface AssuranceSliceTrustDependencies {
  saveAssuranceSliceTrustRecord(
    row: PersistedAssuranceSliceTrustRecordRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getAssuranceSliceTrustRecord(
    sliceTrustId: string,
  ): Promise<PersistedAssuranceSliceTrustRecordRow | null>;
  getCurrentAssuranceSliceTrustRecord(
    sliceNamespace: string,
    producerScopeRef: string,
  ): Promise<PersistedAssuranceSliceTrustRecordRow | null>;
  listAssuranceSliceTrustRecords(): Promise<PersistedAssuranceSliceTrustRecordRow[]>;
}

export class InMemoryAssuranceSliceTrustStore implements AssuranceSliceTrustDependencies {
  private readonly records = new Map<string, PersistedAssuranceSliceTrustRecordRow>();
  private readonly currentByScope = new Map<string, string>();

  async saveAssuranceSliceTrustRecord(
    row: PersistedAssuranceSliceTrustRecordRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const normalized = {
      ...validateAssuranceSliceTrustRecord(row),
      aggregateType: "AssuranceSliceTrustRecord" as const,
      persistenceSchemaVersion: 1 as const,
    };
    saveWithCas(this.records, normalized.sliceTrustId, normalized, options);
    const scopeKey = `${normalized.sliceNamespace}::${normalized.producerScopeRef}`;
    const currentId = this.currentByScope.get(scopeKey);
    const current = currentId ? this.records.get(currentId) : null;
    if (
      !current ||
      compareIso(current.updatedAt, normalized.updatedAt) <= 0 ||
      (current.updatedAt === normalized.updatedAt && current.version <= normalized.version)
    ) {
      this.currentByScope.set(scopeKey, normalized.sliceTrustId);
    }
  }

  async getAssuranceSliceTrustRecord(
    sliceTrustId: string,
  ): Promise<PersistedAssuranceSliceTrustRecordRow | null> {
    return this.records.get(sliceTrustId) ?? null;
  }

  async getCurrentAssuranceSliceTrustRecord(
    sliceNamespace: string,
    producerScopeRef: string,
  ): Promise<PersistedAssuranceSliceTrustRecordRow | null> {
    const key = `${sliceNamespace}::${producerScopeRef}`;
    const id = this.currentByScope.get(key);
    return id ? (this.records.get(id) ?? null) : null;
  }

  async listAssuranceSliceTrustRecords(): Promise<PersistedAssuranceSliceTrustRecordRow[]> {
    return [...this.records.values()].sort((left, right) => {
      const byUpdatedAt = compareIso(left.updatedAt, right.updatedAt);
      if (byUpdatedAt !== 0) {
        return byUpdatedAt;
      }
      return left.sliceTrustId.localeCompare(right.sliceTrustId);
    });
  }
}

export function createAssuranceSliceTrustStore(): AssuranceSliceTrustDependencies {
  return new InMemoryAssuranceSliceTrustStore();
}

export interface EvaluateAssuranceSliceTrustCommand extends AssuranceSliceTrustEvaluationInput {
  sliceTrustId?: string;
}

export function createAssuranceSliceTrustAuthorityService(
  repositories: AssuranceSliceTrustDependencies = createAssuranceSliceTrustStore(),
  idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator(
    "analytics_assurance_slice_trust",
  ),
) {
  return {
    async evaluateAndSave(
      command: EvaluateAssuranceSliceTrustCommand,
    ): Promise<AssuranceSliceTrustEvaluationResult> {
      const evaluated = evaluateAssuranceSliceTrust({
        ...command,
        evaluationModelRef: command.evaluationModelRef || defaultAssuranceTrustEvaluationModelRef,
      });
      const snapshot = validateAssuranceSliceTrustRecord({
        ...evaluated.snapshot,
        sliceTrustId: command.sliceTrustId ?? nextAssuranceSliceTrustId(idGenerator),
      });
      await repositories.saveAssuranceSliceTrustRecord({
        ...snapshot,
        aggregateType: "AssuranceSliceTrustRecord",
        persistenceSchemaVersion: 1,
      });
      return {
        ...evaluated,
        snapshot,
      };
    },
  };
}
