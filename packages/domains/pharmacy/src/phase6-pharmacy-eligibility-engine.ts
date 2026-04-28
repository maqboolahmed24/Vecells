import { createHash } from "node:crypto";

import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  stableReviewDigest,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";

import {
  createPhase6PharmacyCaseKernelService,
  createPhase6PharmacyCaseKernelStore,
  type AggregateRef,
  type EvaluatePharmacyCaseInput,
  type Phase6PharmacyCaseKernelService,
  type PharmacyPathwayCode,
  type PharmacyServiceType,
} from "./phase6-pharmacy-case-kernel";

const TASK_342 = "seq_342" as const;

type Task342 = typeof TASK_342;

export const phase6PharmacyPathwayCodes = [
  "uncomplicated_uti_female_16_64",
  "shingles_18_plus",
  "acute_otitis_media_1_17",
  "acute_sore_throat_5_plus",
  "acute_sinusitis_12_plus",
  "impetigo_1_plus",
  "infected_insect_bites_1_plus",
] as const satisfies readonly PharmacyPathwayCode[];

export type NamedPharmacyPathwayCode = (typeof phase6PharmacyPathwayCodes)[number];

export const pharmacyRuleThresholdIds = [
  "alpha_required_symptom_weight",
  "eta_excl",
  "eta_global",
  "eta_contra",
  "tau_global_block",
  "tau_path_block",
  "tau_contra_block",
  "tau_req_pass",
  "tau_min_complete",
  "tau_eligible",
  "xi_minor_feature_weight",
  "tau_minor_eligible",
] as const;

export type PharmacyRuleThresholdId = (typeof pharmacyRuleThresholdIds)[number];

export type PharmacyRulePackState =
  | "draft"
  | "compiled"
  | "promoted"
  | "superseded"
  | "retired";

export type PharmacyRulePackOverlapStrategy =
  | "forbid_overlap"
  | "machine_resolved_supersede_previous";

export type PharmacyPathwayGateResult =
  | "eligible"
  | "hard_failed"
  | "fallback_only"
  | "global_blocked";

export type PharmacyEligibilityFinalDisposition =
  | "eligible_choice_pending"
  | "minor_illness_fallback"
  | "ineligible_returned";

export type PharmacyRecommendedLane =
  | PharmacyServiceType
  | "non_pharmacy_return";

export type PharmacyPatientMacroState =
  | "choose_or_confirm"
  | "action_in_progress"
  | "reviewing_next_steps"
  | "completed"
  | "urgent_action";

export type PharmacySexAtBirth = "female" | "male" | "other" | "unknown";

export interface PathwayAgeSexGateSnapshot {
  ageMinYears: number;
  ageMaxYears: number | null;
  sexGate: "any" | "female_only";
}

export interface RequiredSymptomWeightRefSnapshot {
  symptomCode: string;
  thresholdFamilyId: "alpha_required_symptom_weight";
}

export interface PathwayDefinitionSnapshot {
  pathwayCode: NamedPharmacyPathwayCode;
  displayName: string;
  ageSexGate: PathwayAgeSexGateSnapshot;
  requiredSymptoms: readonly string[];
  requiredSymptomWeights: readonly RequiredSymptomWeightRefSnapshot[];
  exclusionRules: readonly string[];
  redFlagRules: readonly string[];
  minorIllnessFallbackRules: readonly string[];
  timingGuardrailRef: AggregateRef<"PathwayTimingGuardrail", Task342>;
  allowedEscalationModes: readonly string[];
  supplyModes: readonly string[];
}

export interface PathwayTimingGuardrailSnapshot {
  guardrailId: string;
  rulePackVersion: string;
  pathwayCode: NamedPharmacyPathwayCode;
  materialityLevel: "high" | "medium" | "low";
  maxRecommendedDelayMinutes: number;
  maxAllowedDelayMinutes: number;
  latestSafeOpeningDeltaMinutes: number;
  suppressionPolicy:
    | "suppress_unsafe"
    | "suppress_from_recommended_frontier"
    | "warn_only";
  warningCopyRef: string;
}

export interface PharmacyRulePackThresholdValues {
  alpha_required_symptom_weight: Record<string, number>;
  eta_excl: number;
  eta_global: number;
  eta_contra: number;
  tau_global_block: number;
  tau_path_block: number;
  tau_contra_block: number;
  tau_req_pass: number;
  tau_min_complete: number;
  tau_eligible: number;
  xi_minor_feature_weight: Record<string, number>;
  tau_minor_eligible: number;
}

export interface PharmacyGlobalRuleDefinition {
  ruleId: string;
  severity: "info" | "warning" | "blocking";
  patientTextRef: string;
  staffTextRef: string;
  nextBestEndpointSuggestion: string;
}

export interface PharmacyPathwayMetadata {
  precedenceOrdinal: number;
  contradictionRuleIds: readonly string[];
  patientEligibleSummaryRef: string;
  patientEligibleNextStepRef: string;
  patientIneligibleSummaryRef: string;
  patientIneligibleNextStepRef: string;
  staffSummaryRef: string;
  nextBestEndpointSuggestion: string;
}

export interface PharmacyMinorIllnessFeatureDefinition {
  featureId: string;
  patientTextRef: string;
  staffTextRef: string;
  polarity: "positive" | "negative";
}

export interface PharmacyMinorIllnessPolicySnapshot {
  entryCondition: string;
  fallbackScoreFormula: string;
  thresholdFamilyRefs: readonly ("xi_minor_feature_weight" | "tau_minor_eligible")[];
  epsilonFloor: number;
  patientSummaryTextRef: string;
  patientNextStepTextRef: string;
  staffSummaryTextRef: string;
  nextBestEndpointSuggestion: string;
}

export interface PharmacyRulePackDraftInput {
  rulePackId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  serviceSpecVersion: string;
  predecessorRulePackId?: string | null;
  pathwayDefinitions: readonly PathwayDefinitionSnapshot[];
  minorIllnessPolicy: PharmacyMinorIllnessPolicySnapshot;
  eligibilityThresholds: readonly PharmacyRuleThresholdId[];
  reconciliationThresholds: readonly string[];
  globalExclusions: readonly string[];
  redFlagBridges: readonly string[];
  timingGuardrails: readonly PathwayTimingGuardrailSnapshot[];
  displayTextRefs: readonly string[];
  immutabilityState: "immutable_once_promoted";
  promotionPolicy: {
    goldenCaseRegressionRequired: true;
    hazardTraceabilityRequired: true;
    inPlaceMutationForbidden: true;
  };
  thresholdValues: PharmacyRulePackThresholdValues;
  pathwayMetadata: Record<NamedPharmacyPathwayCode, PharmacyPathwayMetadata>;
  globalRuleCatalog: Record<string, PharmacyGlobalRuleDefinition>;
  minorIllnessFeatureCatalog: Record<string, PharmacyMinorIllnessFeatureDefinition>;
  displayTextCatalog: Record<string, string>;
  changelogText: string;
  hazardTraceabilityRefs: readonly string[];
  overlapStrategy?: PharmacyRulePackOverlapStrategy;
}

export interface PharmacyRulePackSnapshot extends PharmacyRulePackDraftInput {
  packState: PharmacyRulePackState;
  compileHash: string | null;
  compiledArtifactRef: string | null;
  predecessorRulePackRef: AggregateRef<"PharmacyRulePack", Task342> | null;
  supersededByRulePackRef: AggregateRef<"PharmacyRulePack", Task342> | null;
  lastValidatedAt: string | null;
  lastValidationErrors: readonly string[];
  promotedAt: string | null;
  promotedByRef: string | null;
  promotionReason: string | null;
  retiredAt: string | null;
  version: number;
}

export interface ThresholdSnapshotEntry {
  thresholdId: PharmacyRuleThresholdId;
  serializedValue: string;
}

interface CompiledPathwayDefinition {
  definition: PathwayDefinitionSnapshot;
  metadata: PharmacyPathwayMetadata;
  timingGuardrail: PathwayTimingGuardrailSnapshot;
  requiredSymptomWeights: Record<string, number>;
}

export interface CompiledPharmacyRulePackSnapshot {
  compiledArtifactId: string;
  rulePackRef: AggregateRef<"PharmacyRulePack", Task342>;
  rulePackVersion: string;
  compileHash: string;
  compiledAt: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  overlapStrategy: PharmacyRulePackOverlapStrategy;
  pathwayOrder: readonly NamedPharmacyPathwayCode[];
  thresholdSnapshot: readonly ThresholdSnapshotEntry[];
  thresholdValues: PharmacyRulePackThresholdValues;
  pathways: Record<NamedPharmacyPathwayCode, CompiledPathwayDefinition>;
  minorIllnessPolicy: PharmacyMinorIllnessPolicySnapshot;
  globalExclusions: readonly string[];
  redFlagBridges: readonly string[];
  globalRuleCatalog: Record<string, PharmacyGlobalRuleDefinition>;
  minorIllnessFeatureCatalog: Record<string, PharmacyMinorIllnessFeatureDefinition>;
  displayTextCatalog: Record<string, string>;
  reconciliationThresholds: readonly string[];
  version: number;
}

export interface PharmacySymptomEvidenceSnapshot {
  support: number;
  completeness: number;
}

export interface PharmacyEligibilityEvidenceSnapshot {
  patientAgeYears: number;
  sexAtBirth: PharmacySexAtBirth;
  symptomEvidence: Record<string, PharmacySymptomEvidenceSnapshot>;
  ruleScores: Record<string, number>;
  minorIllnessFeatureScores: Record<string, number>;
  evaluatedAt: string;
}

export interface PathwayEvaluationCandidateSnapshot {
  pathwayCode: NamedPharmacyPathwayCode;
  ageSexGatePass: boolean;
  requiredSymptomSupport: number;
  evidenceCompleteness: number;
  pathwayExclusionScore: number;
  globalExclusionScore: number;
  contradictionScore: number;
  eligibilityConfidence: number;
  hardFailReasonCodes: readonly string[];
}

export interface EligibilityExplanationBundleSnapshot {
  bundleId: string;
  evaluationRef: AggregateRef<"PathwayEligibilityEvaluation", Task342>;
  patientFacingReason: {
    summaryText: string;
    nextStepText: string;
    macroState: PharmacyPatientMacroState;
  };
  staffFacingReason: {
    summaryText: string;
    matchedRuleIds: readonly string[];
    thresholdSnapshot: readonly string[];
  };
  matchedRules: readonly string[];
  nextBestEndpointSuggestion: string;
  sharedEvidenceHash: string;
  generatedAt: string;
  version: number;
}

export interface PathwayEligibilityEvaluationSnapshot {
  evaluationId: string;
  pharmacyCaseRef: AggregateRef<"PharmacyCase", Task342>;
  rulePackRef: AggregateRef<"PharmacyRulePack", Task342>;
  pathwayCode: NamedPharmacyPathwayCode | null;
  evaluatedPathways: readonly PathwayEvaluationCandidateSnapshot[];
  matchedRuleIds: readonly string[];
  thresholdSnapshot: readonly ThresholdSnapshotEntry[];
  rulePackVersion: string;
  ageSexGateResult: "pass" | "fail";
  pathwayGateResult: PharmacyPathwayGateResult;
  exclusionMatches: readonly string[];
  pathwayExclusionScore: number;
  globalExclusionScore: number;
  requiredSymptomSupport: number;
  evidenceCompleteness: number;
  contradictionScore: number;
  eligibilityConfidence: number;
  recommendedLane: PharmacyRecommendedLane;
  finalDisposition: PharmacyEligibilityFinalDisposition;
  unsafeFallbackReasonCode: string | null;
  explanationBundleRef: AggregateRef<"EligibilityExplanationBundle", Task342>;
  timingGuardrailRef: AggregateRef<"PathwayTimingGuardrail", Task342> | null;
  fallbackScore: number | null;
  sharedEvidenceHash: string;
  evidenceSnapshot: PharmacyEligibilityEvidenceSnapshot;
  createdAt: string;
  version: number;
}

export interface PharmacyGoldenCaseSnapshot {
  goldenCaseId: string;
  title: string;
  evidence: PharmacyEligibilityEvidenceSnapshot;
  expectedPathwayCode: NamedPharmacyPathwayCode | null;
  expectedFinalDisposition: PharmacyEligibilityFinalDisposition;
  expectedRecommendedLane: PharmacyRecommendedLane;
  expectedPathwayGateResult: PharmacyPathwayGateResult;
  expectedUnsafeFallbackReasonCode: string | null;
  expectedNextBestEndpointSuggestion: string;
  forbidBehaviorDrift: boolean;
  notes: string;
  version: number;
}

export interface PharmacyRulePackValidationResult {
  rulePackId: string;
  valid: boolean;
  errors: readonly string[];
  warnings: readonly string[];
}

export interface PharmacyGoldenCaseRegressionEntry {
  goldenCaseId: string;
  title: string;
  passed: boolean;
  expectedFinalDisposition: PharmacyEligibilityFinalDisposition;
  actualFinalDisposition: PharmacyEligibilityFinalDisposition;
  expectedPathwayCode: NamedPharmacyPathwayCode | null;
  actualPathwayCode: NamedPharmacyPathwayCode | null;
  expectedRecommendedLane: PharmacyRecommendedLane;
  actualRecommendedLane: PharmacyRecommendedLane;
  expectedPathwayGateResult: PharmacyPathwayGateResult;
  actualPathwayGateResult: PharmacyPathwayGateResult;
  expectedUnsafeFallbackReasonCode: string | null;
  actualUnsafeFallbackReasonCode: string | null;
  failures: readonly string[];
}

export interface PharmacyGoldenCaseRegressionResult {
  candidateRulePackId: string;
  baselineRulePackId: string | null;
  passed: boolean;
  entries: readonly PharmacyGoldenCaseRegressionEntry[];
}

export interface PharmacyRulePackComparisonResult {
  baselineRulePackId: string;
  candidateRulePackId: string;
  thresholdDeltaRefs: readonly string[];
  behaviorChanged: boolean;
  baselineEvaluation: PathwayEligibilityEvaluationSnapshot;
  candidateEvaluation: PathwayEligibilityEvaluationSnapshot;
  candidateExplanationBundle: EligibilityExplanationBundleSnapshot;
}

export interface PharmacyEligibilityEvaluationResult {
  evaluation: PathwayEligibilityEvaluationSnapshot;
  explanationBundle: EligibilityExplanationBundleSnapshot;
  compiledRulePack: CompiledPharmacyRulePackSnapshot;
  replayed: boolean;
}

export interface EvaluateCurrentPharmacyCaseInput {
  pharmacyCaseId: string;
  actorRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  leaseRef: AggregateRef<"RequestLifecycleLease", Task342>;
  expectedOwnershipEpoch: number;
  expectedLineageFenceRef: AggregateRef<"LineageFence", Task342>;
  scopedMutationGateRef: string;
  reasonCode: string;
  scopedMutationGateState?: "admitted" | "denied";
  rulePackId?: string;
  evidence: PharmacyEligibilityEvidenceSnapshot;
  sourceDecisionSupersessionRef?: AggregateRef<"DecisionSupersession", Task342> | null;
  evaluationId?: string;
  idempotencyKey?: string;
}

export interface EvaluateCurrentPharmacyCaseResult
  extends PharmacyEligibilityEvaluationResult {
  caseMutation: Awaited<
    ReturnType<Phase6PharmacyCaseKernelService["evaluatePharmacyCase"]>
  >;
}

interface SnapshotDocument<T> {
  toSnapshot(): T;
}

class StoredDocument<T> implements SnapshotDocument<T> {
  constructor(private readonly snapshot: T) {}

  toSnapshot(): T {
    return structuredClone(this.snapshot);
  }
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
  }
}

function requireText(value: string | null | undefined, field: string): string {
  invariant(
    typeof value === "string" && value.trim().length > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} is required.`,
  );
  return value.trim();
}

function optionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireText(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}_TIMESTAMP`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

function ensureNonNegativeInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative integer.`,
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

function ensureProbability(value: number, field: string): number {
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
    `${field} must be a positive number.`,
  );
  return value;
}

function clampProbability(value: number): number {
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return Number(value.toFixed(6));
}

function canonicalStringify(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalStringify(entry)).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalStringify(entryValue)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(String(value));
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function makeRef<TTarget extends string, TOwner extends string>(
  targetFamily: TTarget,
  refId: string,
  ownerTask: TOwner,
): AggregateRef<TTarget, TOwner> {
  return {
    targetFamily,
    refId: requireText(refId, `${targetFamily}.refId`),
    ownerTask,
  };
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
      row.version > current.version,
      "NON_MONOTONE_SAVE",
      `Persisted version for ${key} must increase monotonically.`,
    );
  }
  map.set(key, structuredClone(row));
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function stableThresholdSnapshot(
  thresholdValues: PharmacyRulePackThresholdValues,
): readonly ThresholdSnapshotEntry[] {
  return pharmacyRuleThresholdIds.map((thresholdId) => ({
    thresholdId,
    serializedValue: canonicalStringify(
      thresholdValues[thresholdId as keyof PharmacyRulePackThresholdValues],
    ),
  }));
}

function normalizeSymptomEvidence(
  input: Record<string, PharmacySymptomEvidenceSnapshot>,
): Record<string, PharmacySymptomEvidenceSnapshot> {
  return Object.fromEntries(
    Object.entries(input)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([symptomCode, evidence]) => [
        symptomCode,
        {
          support: ensureProbability(evidence.support, `${symptomCode}.support`),
          completeness: ensureProbability(
            evidence.completeness,
            `${symptomCode}.completeness`,
          ),
        },
      ]),
  );
}

function normalizeScoreMap(input: Record<string, number>, field: string): Record<string, number> {
  return Object.fromEntries(
    Object.entries(input)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([code, value]) => [code, ensureProbability(value, `${field}.${code}`)]),
  );
}

function normalizeEvidence(
  input: PharmacyEligibilityEvidenceSnapshot,
): PharmacyEligibilityEvidenceSnapshot {
  return {
    patientAgeYears: ensureNonNegativeInteger(input.patientAgeYears, "patientAgeYears"),
    sexAtBirth: input.sexAtBirth,
    symptomEvidence: normalizeSymptomEvidence(input.symptomEvidence),
    ruleScores: normalizeScoreMap(input.ruleScores, "ruleScores"),
    minorIllnessFeatureScores: normalizeScoreMap(
      input.minorIllnessFeatureScores,
      "minorIllnessFeatureScores",
    ),
    evaluatedAt: ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt"),
  };
}

function ensureDisplayText(
  displayTextCatalog: Record<string, string>,
  ref: string,
  errors: string[],
  field: string,
): void {
  const value = displayTextCatalog[ref];
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${field} references missing display text '${ref}'.`);
  }
}

function validateRulePackDraft(
  input: PharmacyRulePackDraftInput,
): PharmacyRulePackValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    ensureIsoTimestamp(input.effectiveFrom, "effectiveFrom");
    if (input.effectiveTo !== null) {
      ensureIsoTimestamp(input.effectiveTo, "effectiveTo");
      invariant(
        Date.parse(input.effectiveTo) > Date.parse(input.effectiveFrom),
        "INVALID_EFFECTIVE_WINDOW",
        "effectiveTo must be after effectiveFrom.",
      );
    }
  } catch (error) {
    errors.push((error as Error).message);
  }

  const requiredPathways = [...phase6PharmacyPathwayCodes];
  const pathwayCodes = input.pathwayDefinitions.map((entry) => entry.pathwayCode);
  for (const requiredPathway of requiredPathways) {
    if (!pathwayCodes.includes(requiredPathway)) {
      errors.push(`Missing frozen pathway definition for ${requiredPathway}.`);
    }
  }
  if (new Set(pathwayCodes).size !== pathwayCodes.length) {
    errors.push("Pathway definitions must be unique by pathwayCode.");
  }

  const pathwayMetadataEntries = Object.entries(input.pathwayMetadata) as Array<
    [NamedPharmacyPathwayCode, PharmacyPathwayMetadata]
  >;
  if (pathwayMetadataEntries.length !== requiredPathways.length) {
    errors.push("Pathway metadata must exist for all seven frozen pathways.");
  }
  const precedenceOrdinals = pathwayMetadataEntries.map(([, metadata]) => metadata.precedenceOrdinal);
  if (new Set(precedenceOrdinals).size !== precedenceOrdinals.length) {
    errors.push("Pathway precedence ordinals must be unique for deterministic tie-breaking.");
  }

  const thresholdIds = sortedUnique(input.eligibilityThresholds as readonly string[]);
  for (const thresholdId of pharmacyRuleThresholdIds) {
    if (!thresholdIds.includes(thresholdId)) {
      errors.push(`Missing required threshold family '${thresholdId}'.`);
    }
  }

  if (input.minorIllnessPolicy.entryCondition !==
    "clinical_pathway_none_eligible_and_no_global_block_and_pathway_specific_failures_only") {
    errors.push(
      "minorIllnessPolicy.entryCondition must keep fallback blocked when any global block is active.",
    );
  }
  if (input.minorIllnessPolicy.fallbackScoreFormula !== "product_h max(epsilon, m_h(x))^{xi_h}") {
    errors.push("minorIllnessPolicy.fallbackScoreFormula must match the frozen formula.");
  }

  try {
    ensurePositiveNumber(input.minorIllnessPolicy.epsilonFloor, "epsilonFloor");
    ensureProbability(input.thresholdValues.tau_global_block, "tau_global_block");
    ensureProbability(input.thresholdValues.tau_path_block, "tau_path_block");
    ensureProbability(input.thresholdValues.tau_contra_block, "tau_contra_block");
    ensureProbability(input.thresholdValues.tau_req_pass, "tau_req_pass");
    ensureProbability(input.thresholdValues.tau_min_complete, "tau_min_complete");
    ensureProbability(input.thresholdValues.tau_eligible, "tau_eligible");
    ensureProbability(input.thresholdValues.tau_minor_eligible, "tau_minor_eligible");
    ensurePositiveNumber(input.thresholdValues.eta_excl, "eta_excl");
    ensurePositiveNumber(input.thresholdValues.eta_global, "eta_global");
    ensurePositiveNumber(input.thresholdValues.eta_contra, "eta_contra");
  } catch (error) {
    errors.push((error as Error).message);
  }

  const allRequiredSymptoms = new Set<string>();
  const guardrailsById = new Map(
    input.timingGuardrails.map((guardrail) => [guardrail.guardrailId, guardrail]),
  );
  for (const pathway of input.pathwayDefinitions) {
    for (const symptomCode of pathway.requiredSymptoms) {
      allRequiredSymptoms.add(symptomCode);
    }
    if (pathway.requiredSymptoms.length !== pathway.requiredSymptomWeights.length) {
      errors.push(
        `Pathway ${pathway.pathwayCode} must bind every required symptom to alpha_required_symptom_weight.`,
      );
    }
    for (const weightRef of pathway.requiredSymptomWeights) {
      if (!pathway.requiredSymptoms.includes(weightRef.symptomCode)) {
        errors.push(
          `Pathway ${pathway.pathwayCode} weight ref ${weightRef.symptomCode} does not match a required symptom.`,
        );
      }
    }
    const guardrail = guardrailsById.get(pathway.timingGuardrailRef.refId);
    if (!guardrail) {
      errors.push(
        `Pathway ${pathway.pathwayCode} references missing timing guardrail ${pathway.timingGuardrailRef.refId}.`,
      );
    } else {
      if (guardrail.pathwayCode !== pathway.pathwayCode) {
        errors.push(
          `Timing guardrail ${guardrail.guardrailId} must bind back to pathway ${pathway.pathwayCode}.`,
        );
      }
      if (guardrail.rulePackVersion !== input.rulePackId) {
        errors.push(
          `Timing guardrail ${guardrail.guardrailId} must carry rulePackVersion ${input.rulePackId}.`,
        );
      }
    }
    if (!input.pathwayMetadata[pathway.pathwayCode]) {
      errors.push(`Missing pathway metadata for ${pathway.pathwayCode}.`);
    }
  }

  for (const symptomCode of [...allRequiredSymptoms]) {
    if (typeof input.thresholdValues.alpha_required_symptom_weight[symptomCode] !== "number") {
      errors.push(`Missing alpha_required_symptom_weight for symptom ${symptomCode}.`);
    }
  }

  const minorFeatureIds = Object.keys(input.minorIllnessFeatureCatalog).sort();
  for (const featureId of minorFeatureIds) {
    if (typeof input.thresholdValues.xi_minor_feature_weight[featureId] !== "number") {
      errors.push(`Missing xi_minor_feature_weight for minor-illness feature ${featureId}.`);
    }
  }

  for (const ruleId of [...input.globalExclusions, ...input.redFlagBridges]) {
    if (!input.globalRuleCatalog[ruleId]) {
      errors.push(`Missing global rule definition for ${ruleId}.`);
    }
  }

  for (const [pathwayCode, metadata] of pathwayMetadataEntries) {
    if (metadata.contradictionRuleIds.length === 0) {
      warnings.push(`Pathway ${pathwayCode} has no explicit contradiction rules.`);
    }
    ensureDisplayText(
      input.displayTextCatalog,
      metadata.patientEligibleSummaryRef,
      errors,
      `${pathwayCode}.patientEligibleSummaryRef`,
    );
    ensureDisplayText(
      input.displayTextCatalog,
      metadata.patientEligibleNextStepRef,
      errors,
      `${pathwayCode}.patientEligibleNextStepRef`,
    );
    ensureDisplayText(
      input.displayTextCatalog,
      metadata.patientIneligibleSummaryRef,
      errors,
      `${pathwayCode}.patientIneligibleSummaryRef`,
    );
    ensureDisplayText(
      input.displayTextCatalog,
      metadata.patientIneligibleNextStepRef,
      errors,
      `${pathwayCode}.patientIneligibleNextStepRef`,
    );
    ensureDisplayText(
      input.displayTextCatalog,
      metadata.staffSummaryRef,
      errors,
      `${pathwayCode}.staffSummaryRef`,
    );
  }

  ensureDisplayText(
    input.displayTextCatalog,
    input.minorIllnessPolicy.patientSummaryTextRef,
    errors,
    "minorIllnessPolicy.patientSummaryTextRef",
  );
  ensureDisplayText(
    input.displayTextCatalog,
    input.minorIllnessPolicy.patientNextStepTextRef,
    errors,
    "minorIllnessPolicy.patientNextStepTextRef",
  );
  ensureDisplayText(
    input.displayTextCatalog,
    input.minorIllnessPolicy.staffSummaryTextRef,
    errors,
    "minorIllnessPolicy.staffSummaryTextRef",
  );

  for (const rule of Object.values(input.globalRuleCatalog)) {
    ensureDisplayText(input.displayTextCatalog, rule.patientTextRef, errors, `${rule.ruleId}.patientTextRef`);
    ensureDisplayText(input.displayTextCatalog, rule.staffTextRef, errors, `${rule.ruleId}.staffTextRef`);
  }
  for (const feature of Object.values(input.minorIllnessFeatureCatalog)) {
    ensureDisplayText(
      input.displayTextCatalog,
      feature.patientTextRef,
      errors,
      `${feature.featureId}.patientTextRef`,
    );
    ensureDisplayText(
      input.displayTextCatalog,
      feature.staffTextRef,
      errors,
      `${feature.featureId}.staffTextRef`,
    );
  }
  for (const guardrail of input.timingGuardrails) {
    ensureDisplayText(
      input.displayTextCatalog,
      guardrail.warningCopyRef,
      errors,
      `${guardrail.guardrailId}.warningCopyRef`,
    );
  }

  return {
    rulePackId: input.rulePackId,
    valid: errors.length === 0,
    errors: sortedUnique(errors),
    warnings: sortedUnique(warnings),
  };
}

function normalizePathwayDefinitions(
  input: readonly PathwayDefinitionSnapshot[],
): readonly PathwayDefinitionSnapshot[] {
  return [...input]
    .map((pathway) => ({
      ...pathway,
      displayName: requireText(pathway.displayName, `${pathway.pathwayCode}.displayName`),
      requiredSymptoms: sortedUnique(pathway.requiredSymptoms),
      requiredSymptomWeights: [...pathway.requiredSymptomWeights]
        .map((weight) => ({
          symptomCode: requireText(weight.symptomCode, `${pathway.pathwayCode}.symptomCode`),
          thresholdFamilyId: weight.thresholdFamilyId,
        }))
        .sort((left, right) => left.symptomCode.localeCompare(right.symptomCode)),
      exclusionRules: sortedUnique(pathway.exclusionRules),
      redFlagRules: sortedUnique(pathway.redFlagRules),
      minorIllnessFallbackRules: sortedUnique(pathway.minorIllnessFallbackRules),
      allowedEscalationModes: sortedUnique(pathway.allowedEscalationModes),
      supplyModes: sortedUnique(pathway.supplyModes),
    }))
    .sort((left, right) => left.pathwayCode.localeCompare(right.pathwayCode));
}

function normalizeTimingGuardrails(
  input: readonly PathwayTimingGuardrailSnapshot[],
): readonly PathwayTimingGuardrailSnapshot[] {
  return [...input]
    .map((guardrail) => ({
      ...guardrail,
      guardrailId: requireText(guardrail.guardrailId, "guardrailId"),
      rulePackVersion: requireText(guardrail.rulePackVersion, "rulePackVersion"),
      maxRecommendedDelayMinutes: ensureNonNegativeInteger(
        guardrail.maxRecommendedDelayMinutes,
        "maxRecommendedDelayMinutes",
      ),
      maxAllowedDelayMinutes: ensureNonNegativeInteger(
        guardrail.maxAllowedDelayMinutes,
        "maxAllowedDelayMinutes",
      ),
      latestSafeOpeningDeltaMinutes: ensureNonNegativeInteger(
        guardrail.latestSafeOpeningDeltaMinutes,
        "latestSafeOpeningDeltaMinutes",
      ),
      warningCopyRef: requireText(guardrail.warningCopyRef, "warningCopyRef"),
    }))
    .sort((left, right) => left.guardrailId.localeCompare(right.guardrailId));
}

function normalizeRulePackDraft(
  input: PharmacyRulePackDraftInput,
): PharmacyRulePackDraftInput {
  const pathwayMetadata = {} as Record<NamedPharmacyPathwayCode, PharmacyPathwayMetadata>;
  for (const pathwayCode of phase6PharmacyPathwayCodes) {
    const metadata = input.pathwayMetadata[pathwayCode];
    invariant(
      metadata !== undefined,
      "MISSING_PATHWAY_METADATA",
      `Missing pathway metadata for ${pathwayCode}.`,
    );
    pathwayMetadata[pathwayCode] = {
      precedenceOrdinal: ensurePositiveInteger(
        metadata.precedenceOrdinal,
        `${pathwayCode}.precedenceOrdinal`,
      ),
      contradictionRuleIds: sortedUnique(metadata.contradictionRuleIds),
      patientEligibleSummaryRef: requireText(
        metadata.patientEligibleSummaryRef,
        `${pathwayCode}.patientEligibleSummaryRef`,
      ),
      patientEligibleNextStepRef: requireText(
        metadata.patientEligibleNextStepRef,
        `${pathwayCode}.patientEligibleNextStepRef`,
      ),
      patientIneligibleSummaryRef: requireText(
        metadata.patientIneligibleSummaryRef,
        `${pathwayCode}.patientIneligibleSummaryRef`,
      ),
      patientIneligibleNextStepRef: requireText(
        metadata.patientIneligibleNextStepRef,
        `${pathwayCode}.patientIneligibleNextStepRef`,
      ),
      staffSummaryRef: requireText(
        metadata.staffSummaryRef,
        `${pathwayCode}.staffSummaryRef`,
      ),
      nextBestEndpointSuggestion: requireText(
        metadata.nextBestEndpointSuggestion,
        `${pathwayCode}.nextBestEndpointSuggestion`,
      ),
    };
  }

  return {
    ...input,
    rulePackId: requireText(input.rulePackId, "rulePackId"),
    effectiveFrom: ensureIsoTimestamp(input.effectiveFrom, "effectiveFrom"),
    effectiveTo:
      optionalText(input.effectiveTo) === null
        ? null
        : ensureIsoTimestamp(input.effectiveTo!, "effectiveTo"),
    serviceSpecVersion: requireText(input.serviceSpecVersion, "serviceSpecVersion"),
    predecessorRulePackId: optionalText(input.predecessorRulePackId),
    pathwayDefinitions: normalizePathwayDefinitions(input.pathwayDefinitions),
    minorIllnessPolicy: {
      ...input.minorIllnessPolicy,
      entryCondition: requireText(input.minorIllnessPolicy.entryCondition, "entryCondition"),
      fallbackScoreFormula: requireText(
        input.minorIllnessPolicy.fallbackScoreFormula,
        "fallbackScoreFormula",
      ),
      thresholdFamilyRefs: [...input.minorIllnessPolicy.thresholdFamilyRefs].sort(),
      epsilonFloor: ensurePositiveNumber(input.minorIllnessPolicy.epsilonFloor, "epsilonFloor"),
      patientSummaryTextRef: requireText(
        input.minorIllnessPolicy.patientSummaryTextRef,
        "patientSummaryTextRef",
      ),
      patientNextStepTextRef: requireText(
        input.minorIllnessPolicy.patientNextStepTextRef,
        "patientNextStepTextRef",
      ),
      staffSummaryTextRef: requireText(
        input.minorIllnessPolicy.staffSummaryTextRef,
        "staffSummaryTextRef",
      ),
      nextBestEndpointSuggestion: requireText(
        input.minorIllnessPolicy.nextBestEndpointSuggestion,
        "nextBestEndpointSuggestion",
      ),
    },
    eligibilityThresholds: [...input.eligibilityThresholds].sort(),
    reconciliationThresholds: sortedUnique(input.reconciliationThresholds),
    globalExclusions: sortedUnique(input.globalExclusions),
    redFlagBridges: sortedUnique(input.redFlagBridges),
    timingGuardrails: normalizeTimingGuardrails(input.timingGuardrails),
    displayTextRefs: sortedUnique(input.displayTextRefs),
    thresholdValues: {
      alpha_required_symptom_weight: Object.fromEntries(
        Object.entries(input.thresholdValues.alpha_required_symptom_weight)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, value]) => [key, ensurePositiveNumber(value, key)]),
      ),
      eta_excl: ensurePositiveNumber(input.thresholdValues.eta_excl, "eta_excl"),
      eta_global: ensurePositiveNumber(input.thresholdValues.eta_global, "eta_global"),
      eta_contra: ensurePositiveNumber(input.thresholdValues.eta_contra, "eta_contra"),
      tau_global_block: ensureProbability(
        input.thresholdValues.tau_global_block,
        "tau_global_block",
      ),
      tau_path_block: ensureProbability(input.thresholdValues.tau_path_block, "tau_path_block"),
      tau_contra_block: ensureProbability(
        input.thresholdValues.tau_contra_block,
        "tau_contra_block",
      ),
      tau_req_pass: ensureProbability(input.thresholdValues.tau_req_pass, "tau_req_pass"),
      tau_min_complete: ensureProbability(
        input.thresholdValues.tau_min_complete,
        "tau_min_complete",
      ),
      tau_eligible: ensureProbability(input.thresholdValues.tau_eligible, "tau_eligible"),
      xi_minor_feature_weight: Object.fromEntries(
        Object.entries(input.thresholdValues.xi_minor_feature_weight)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, value]) => [key, ensurePositiveNumber(value, key)]),
      ),
      tau_minor_eligible: ensureProbability(
        input.thresholdValues.tau_minor_eligible,
        "tau_minor_eligible",
      ),
    },
    pathwayMetadata,
    globalRuleCatalog: Object.fromEntries(
      Object.entries(input.globalRuleCatalog)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([ruleId, rule]) => [
          ruleId,
          {
            ruleId: requireText(rule.ruleId, `${ruleId}.ruleId`),
            severity: rule.severity,
            patientTextRef: requireText(rule.patientTextRef, `${ruleId}.patientTextRef`),
            staffTextRef: requireText(rule.staffTextRef, `${ruleId}.staffTextRef`),
            nextBestEndpointSuggestion: requireText(
              rule.nextBestEndpointSuggestion,
              `${ruleId}.nextBestEndpointSuggestion`,
            ),
          },
        ]),
    ),
    minorIllnessFeatureCatalog: Object.fromEntries(
      Object.entries(input.minorIllnessFeatureCatalog)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([featureId, feature]) => [
          featureId,
          {
            featureId: requireText(feature.featureId, `${featureId}.featureId`),
            patientTextRef: requireText(feature.patientTextRef, `${featureId}.patientTextRef`),
            staffTextRef: requireText(feature.staffTextRef, `${featureId}.staffTextRef`),
            polarity: feature.polarity,
          },
        ]),
    ),
    displayTextCatalog: Object.fromEntries(
      Object.entries(input.displayTextCatalog)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([ref, text]) => [ref, requireText(text, ref)]),
    ),
    changelogText: requireText(input.changelogText, "changelogText"),
    hazardTraceabilityRefs: sortedUnique(input.hazardTraceabilityRefs),
    overlapStrategy: input.overlapStrategy ?? "forbid_overlap",
  };
}

function normalizeRulePackSnapshot(
  input: PharmacyRulePackSnapshot,
): PharmacyRulePackSnapshot {
  const normalizedDraft = normalizeRulePackDraft(input);
  return {
    ...normalizedDraft,
    packState: input.packState,
    compileHash: optionalText(input.compileHash),
    compiledArtifactRef: optionalText(input.compiledArtifactRef),
    predecessorRulePackRef:
      input.predecessorRulePackRef === null
        ? null
        : makeRef("PharmacyRulePack", input.predecessorRulePackRef.refId, TASK_342),
    supersededByRulePackRef:
      input.supersededByRulePackRef === null
        ? null
        : makeRef("PharmacyRulePack", input.supersededByRulePackRef.refId, TASK_342),
    lastValidatedAt:
      optionalText(input.lastValidatedAt) === null
        ? null
        : ensureIsoTimestamp(input.lastValidatedAt!, "lastValidatedAt"),
    lastValidationErrors: sortedUnique(input.lastValidationErrors),
    promotedAt:
      optionalText(input.promotedAt) === null
        ? null
        : ensureIsoTimestamp(input.promotedAt!, "promotedAt"),
    promotedByRef: optionalText(input.promotedByRef),
    promotionReason: optionalText(input.promotionReason),
    retiredAt:
      optionalText(input.retiredAt) === null
        ? null
        : ensureIsoTimestamp(input.retiredAt!, "retiredAt"),
    version: ensurePositiveInteger(input.version, "version"),
  };
}

function compileRulePackPayload(
  rulePack: PharmacyRulePackSnapshot,
  compiledAt: string,
  compiledArtifactId: string,
): CompiledPharmacyRulePackSnapshot {
  const pathByCode = new Map(rulePack.pathwayDefinitions.map((pathway) => [pathway.pathwayCode, pathway]));
  const guardrailById = new Map(rulePack.timingGuardrails.map((guardrail) => [guardrail.guardrailId, guardrail]));
  const orderedPathways = [...phase6PharmacyPathwayCodes].sort((left, right) => {
    const leftMeta = rulePack.pathwayMetadata[left];
    const rightMeta = rulePack.pathwayMetadata[right];
    if (leftMeta.precedenceOrdinal !== rightMeta.precedenceOrdinal) {
      return leftMeta.precedenceOrdinal - rightMeta.precedenceOrdinal;
    }
    return left.localeCompare(right);
  });

  const compiledPathways = Object.fromEntries(
    orderedPathways.map((pathwayCode) => {
      const definition = pathByCode.get(pathwayCode);
      invariant(definition, "MISSING_PATHWAY", `Pathway ${pathwayCode} is missing.`);
      const metadata = rulePack.pathwayMetadata[pathwayCode];
      const timingGuardrail = guardrailById.get(definition.timingGuardrailRef.refId);
      invariant(
        timingGuardrail,
        "MISSING_TIMING_GUARDRAIL",
        `Timing guardrail ${definition.timingGuardrailRef.refId} is missing.`,
      );
      const requiredSymptomWeights = Object.fromEntries(
        definition.requiredSymptoms.map((symptomCode) => [
          symptomCode,
          rulePack.thresholdValues.alpha_required_symptom_weight[symptomCode],
        ]),
      );
      return [
        pathwayCode,
        {
          definition,
          metadata,
          timingGuardrail,
          requiredSymptomWeights,
        },
      ];
    }),
  ) as Record<NamedPharmacyPathwayCode, CompiledPathwayDefinition>;

  const canonicalPayload = canonicalStringify({
    rulePackId: rulePack.rulePackId,
    effectiveFrom: rulePack.effectiveFrom,
    effectiveTo: rulePack.effectiveTo,
    serviceSpecVersion: rulePack.serviceSpecVersion,
    overlapStrategy: rulePack.overlapStrategy,
    pathways: orderedPathways.map((pathwayCode) => ({
      pathwayCode,
      definition: compiledPathways[pathwayCode].definition,
      metadata: compiledPathways[pathwayCode].metadata,
      requiredSymptomWeights: compiledPathways[pathwayCode].requiredSymptomWeights,
      timingGuardrail: compiledPathways[pathwayCode].timingGuardrail,
    })),
    minorIllnessPolicy: rulePack.minorIllnessPolicy,
    globalExclusions: rulePack.globalExclusions,
    redFlagBridges: rulePack.redFlagBridges,
    globalRuleCatalog: rulePack.globalRuleCatalog,
    minorIllnessFeatureCatalog: rulePack.minorIllnessFeatureCatalog,
    thresholdSnapshot: stableThresholdSnapshot(rulePack.thresholdValues),
    displayTextCatalog: rulePack.displayTextCatalog,
    reconciliationThresholds: rulePack.reconciliationThresholds,
  });
  const compileHash = sha256Hex(canonicalPayload);

  return {
    compiledArtifactId,
    rulePackRef: makeRef("PharmacyRulePack", rulePack.rulePackId, TASK_342),
    rulePackVersion: rulePack.rulePackId,
    compileHash,
    compiledAt,
    effectiveFrom: rulePack.effectiveFrom,
    effectiveTo: rulePack.effectiveTo,
    overlapStrategy: rulePack.overlapStrategy ?? "forbid_overlap",
    pathwayOrder: orderedPathways,
    thresholdSnapshot: stableThresholdSnapshot(rulePack.thresholdValues),
    thresholdValues: structuredClone(rulePack.thresholdValues),
    pathways: compiledPathways,
    minorIllnessPolicy: structuredClone(rulePack.minorIllnessPolicy),
    globalExclusions: [...rulePack.globalExclusions],
    redFlagBridges: [...rulePack.redFlagBridges],
    globalRuleCatalog: structuredClone(rulePack.globalRuleCatalog),
    minorIllnessFeatureCatalog: structuredClone(rulePack.minorIllnessFeatureCatalog),
    displayTextCatalog: structuredClone(rulePack.displayTextCatalog),
    reconciliationThresholds: [...rulePack.reconciliationThresholds],
    version: 1,
  };
}

function maxRuleScore(ruleIds: readonly string[], ruleScores: Record<string, number>): number {
  if (ruleIds.length === 0) {
    return 0;
  }
  return ruleIds.reduce((highest, ruleId) => Math.max(highest, ruleScores[ruleId] ?? 0), 0);
}

function matchedRuleIdsFor(
  ruleIds: readonly string[],
  ruleScores: Record<string, number>,
): string[] {
  return ruleIds.filter((ruleId) => (ruleScores[ruleId] ?? 0) > 0).sort();
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function pathwayAgeSexGatePass(
  evidence: PharmacyEligibilityEvidenceSnapshot,
  gate: PathwayAgeSexGateSnapshot,
): boolean {
  if (evidence.patientAgeYears < gate.ageMinYears) {
    return false;
  }
  if (gate.ageMaxYears !== null && evidence.patientAgeYears > gate.ageMaxYears) {
    return false;
  }
  if (gate.sexGate === "female_only" && evidence.sexAtBirth !== "female") {
    return false;
  }
  return true;
}

function evaluateCompiledRulePack(
  compiledRulePack: CompiledPharmacyRulePackSnapshot,
  input: {
    evaluationId: string;
    pharmacyCaseId: string;
    evidence: PharmacyEligibilityEvidenceSnapshot;
    createdAt: string;
  },
): PharmacyEligibilityEvaluationResult {
  const evidence = normalizeEvidence(input.evidence);
  const thresholdValues = compiledRulePack.thresholdValues;
  const evaluatedPathways: PathwayEvaluationCandidateSnapshot[] = [];
  const aggregateMatchedRuleIds = new Set<string>();
  const aggregateExclusionMatches = new Set<string>();
  const perPathwaySelectedPayload: Array<{
    pathwayCode: NamedPharmacyPathwayCode;
    candidate: PathwayEvaluationCandidateSnapshot;
    guardrail: PathwayTimingGuardrailSnapshot;
    nextBestEndpointSuggestion: string;
  }> = [];

  let anyGlobalBlock = false;

  for (const pathwayCode of compiledRulePack.pathwayOrder) {
    const pathway = compiledRulePack.pathways[pathwayCode];
    const ageSexGatePass = pathwayAgeSexGatePass(evidence, pathway.definition.ageSexGate);
    aggregateMatchedRuleIds.add(
      `pathway.${pathwayCode}.age_sex_gate.${ageSexGatePass ? "pass" : "fail"}`,
    );

    const totalWeight = Object.values(pathway.requiredSymptomWeights).reduce(
      (sum, value) => sum + value,
      0,
    );
    invariant(
      totalWeight > 0,
      "EMPTY_REQUIRED_SYMPTOM_WEIGHT_SET",
      `Pathway ${pathwayCode} must have at least one required symptom weight.`,
    );
    const requiredSymptomSupportRaw = pathway.definition.requiredSymptoms.reduce((sum, symptomCode) => {
      const evidencePoint = evidence.symptomEvidence[symptomCode] ?? {
        support: 0,
        completeness: 0,
      };
      if (evidencePoint.support > 0) {
        aggregateMatchedRuleIds.add(symptomCode);
      }
      const weight = pathway.requiredSymptomWeights[symptomCode] ?? 0;
      return sum + weight * evidencePoint.support;
    }, 0);
    const evidenceCompletenessRaw = pathway.definition.requiredSymptoms.reduce((sum, symptomCode) => {
      const evidencePoint = evidence.symptomEvidence[symptomCode] ?? {
        support: 0,
        completeness: 0,
      };
      const weight = pathway.requiredSymptomWeights[symptomCode] ?? 0;
      return sum + weight * evidencePoint.completeness;
    }, 0);

    const requiredSymptomSupport = clampProbability(requiredSymptomSupportRaw / totalWeight);
    const evidenceCompleteness = clampProbability(evidenceCompletenessRaw / totalWeight);

    const pathwayExclusionScore = clampProbability(
      maxRuleScore(pathway.definition.exclusionRules, evidence.ruleScores),
    );
    const pathwayGlobalBridgeRules = sortedUnique([
      ...compiledRulePack.globalExclusions,
      ...compiledRulePack.redFlagBridges,
      ...pathway.definition.redFlagRules,
    ]);
    const globalExclusionScore = clampProbability(
      maxRuleScore(pathwayGlobalBridgeRules, evidence.ruleScores),
    );
    const contradictionScore = clampProbability(
      maxRuleScore(pathway.metadata.contradictionRuleIds, evidence.ruleScores),
    );

    anyGlobalBlock = anyGlobalBlock || globalExclusionScore >= thresholdValues.tau_global_block;

    const eligibilityConfidence = clampProbability(
      (ageSexGatePass ? 1 : 0) *
        requiredSymptomSupport *
        evidenceCompleteness *
        (1 - pathwayExclusionScore) ** thresholdValues.eta_excl *
        (1 - globalExclusionScore) ** thresholdValues.eta_global *
        (1 - contradictionScore) ** thresholdValues.eta_contra,
    );

    const hardFailReasonCodes = sortedUnique([
      ...(ageSexGatePass ? [] : ["age_sex_gate_failed"]),
      ...(pathwayExclusionScore >= thresholdValues.tau_path_block
        ? ["pathway_exclusion_block"]
        : []),
      ...(globalExclusionScore >= thresholdValues.tau_global_block ? ["global_block"] : []),
      ...(contradictionScore >= thresholdValues.tau_contra_block
        ? ["contradiction_block"]
        : []),
    ]);

    const candidate: PathwayEvaluationCandidateSnapshot = {
      pathwayCode,
      ageSexGatePass,
      requiredSymptomSupport,
      evidenceCompleteness,
      pathwayExclusionScore,
      globalExclusionScore,
      contradictionScore,
      eligibilityConfidence,
      hardFailReasonCodes,
    };
    evaluatedPathways.push(candidate);

    for (const matchedRule of matchedRuleIdsFor(pathway.definition.exclusionRules, evidence.ruleScores)) {
      aggregateMatchedRuleIds.add(matchedRule);
      aggregateExclusionMatches.add(matchedRule);
    }
    for (const matchedRule of matchedRuleIdsFor(pathwayGlobalBridgeRules, evidence.ruleScores)) {
      aggregateMatchedRuleIds.add(matchedRule);
    }
    for (const matchedRule of matchedRuleIdsFor(pathway.metadata.contradictionRuleIds, evidence.ruleScores)) {
      aggregateMatchedRuleIds.add(matchedRule);
    }

    const pathwayEligible =
      ageSexGatePass &&
      pathwayExclusionScore < thresholdValues.tau_path_block &&
      globalExclusionScore < thresholdValues.tau_global_block &&
      contradictionScore < thresholdValues.tau_contra_block &&
      requiredSymptomSupport >= thresholdValues.tau_req_pass &&
      evidenceCompleteness >= thresholdValues.tau_min_complete &&
      eligibilityConfidence >= thresholdValues.tau_eligible;

    if (pathwayEligible) {
      perPathwaySelectedPayload.push({
        pathwayCode,
        candidate,
        guardrail: pathway.timingGuardrail,
        nextBestEndpointSuggestion: pathway.metadata.nextBestEndpointSuggestion,
      });
    }
  }

  const selectedPathway = perPathwaySelectedPayload.sort((left, right) => {
    const leftOrdinal = compiledRulePack.pathways[left.pathwayCode].metadata.precedenceOrdinal;
    const rightOrdinal = compiledRulePack.pathways[right.pathwayCode].metadata.precedenceOrdinal;
    if (leftOrdinal !== rightOrdinal) {
      return leftOrdinal - rightOrdinal;
    }
    if (left.candidate.eligibilityConfidence !== right.candidate.eligibilityConfidence) {
      return right.candidate.eligibilityConfidence - left.candidate.eligibilityConfidence;
    }
    return left.pathwayCode.localeCompare(right.pathwayCode);
  })[0] ?? null;

  let recommendedLane: PharmacyRecommendedLane;
  let finalDisposition: PharmacyEligibilityFinalDisposition;
  let selectedPathwayCode: NamedPharmacyPathwayCode | null = null;
  let selectedCandidate: PathwayEvaluationCandidateSnapshot | null = null;
  let selectedGuardrailRef: AggregateRef<"PathwayTimingGuardrail", Task342> | null = null;
  let pathwayGateResult: PharmacyPathwayGateResult;
  let unsafeFallbackReasonCode: string | null = null;
  let fallbackScore: number | null = null;
  let patientSummaryText: string;
  let patientNextStepText: string;
  let patientMacroState: PharmacyPatientMacroState;
  let staffSummaryText: string;
  let nextBestEndpointSuggestion: string;

  if (selectedPathway) {
    selectedPathwayCode = selectedPathway.pathwayCode;
    selectedCandidate = selectedPathway.candidate;
    selectedGuardrailRef = makeRef(
      "PathwayTimingGuardrail",
      selectedPathway.guardrail.guardrailId,
      TASK_342,
    );
    recommendedLane = "clinical_pathway_consultation";
    finalDisposition = "eligible_choice_pending";
    pathwayGateResult = "eligible";
    const metadata = compiledRulePack.pathways[selectedPathway.pathwayCode].metadata;
    patientSummaryText =
      compiledRulePack.displayTextCatalog[metadata.patientEligibleSummaryRef] ??
      metadata.patientEligibleSummaryRef;
    patientNextStepText =
      compiledRulePack.displayTextCatalog[metadata.patientEligibleNextStepRef] ??
      metadata.patientEligibleNextStepRef;
    patientMacroState = "choose_or_confirm";
    staffSummaryText =
      compiledRulePack.displayTextCatalog[metadata.staffSummaryRef] ?? metadata.staffSummaryRef;
    nextBestEndpointSuggestion = metadata.nextBestEndpointSuggestion;
  } else {
    const noClinicalEligible = true;
    const allRejectionsPathwaySpecific = evaluatedPathways.every(
      (candidate) => !candidate.hardFailReasonCodes.includes("global_block"),
    );
    if (noClinicalEligible && !anyGlobalBlock && allRejectionsPathwaySpecific) {
      const epsilon = compiledRulePack.minorIllnessPolicy.epsilonFloor;
      fallbackScore = clampProbability(
        Object.entries(compiledRulePack.thresholdValues.xi_minor_feature_weight).reduce(
          (product, [featureId, weight]) => {
            const rawScore = ensureProbability(
              evidence.minorIllnessFeatureScores[featureId] ?? 0,
              `minorIllnessFeatureScores.${featureId}`,
            );
            const featureDefinition =
              compiledRulePack.minorIllnessFeatureCatalog[featureId] ?? null;
            const normalizedFeatureScore =
              featureDefinition?.polarity === "negative" ? 1 - rawScore : rawScore;
            return (
              product *
              Math.max(epsilon, normalizedFeatureScore) ** weight
            );
          },
          1,
        ),
      );
      for (const featureId of Object.keys(compiledRulePack.thresholdValues.xi_minor_feature_weight)) {
        aggregateMatchedRuleIds.add(`minor_illness.${featureId}`);
      }
      if (fallbackScore >= compiledRulePack.thresholdValues.tau_minor_eligible) {
        recommendedLane = "minor_illness_fallback";
        finalDisposition = "minor_illness_fallback";
        pathwayGateResult = "fallback_only";
        patientSummaryText =
          compiledRulePack.displayTextCatalog[
            compiledRulePack.minorIllnessPolicy.patientSummaryTextRef
          ] ?? compiledRulePack.minorIllnessPolicy.patientSummaryTextRef;
        patientNextStepText =
          compiledRulePack.displayTextCatalog[
            compiledRulePack.minorIllnessPolicy.patientNextStepTextRef
          ] ?? compiledRulePack.minorIllnessPolicy.patientNextStepTextRef;
        patientMacroState = "choose_or_confirm";
        staffSummaryText =
          compiledRulePack.displayTextCatalog[
            compiledRulePack.minorIllnessPolicy.staffSummaryTextRef
          ] ?? compiledRulePack.minorIllnessPolicy.staffSummaryTextRef;
        nextBestEndpointSuggestion =
          compiledRulePack.minorIllnessPolicy.nextBestEndpointSuggestion;
      } else {
        recommendedLane = "non_pharmacy_return";
        finalDisposition = "ineligible_returned";
        pathwayGateResult = "hard_failed";
        unsafeFallbackReasonCode = "minor_fallback_threshold_not_met";
        patientSummaryText = "Pharmacy treatment is not the safest next step for this request.";
        patientNextStepText = "Your practice team should review the next safest option.";
        patientMacroState = "reviewing_next_steps";
        staffSummaryText = "No clinical pathway was eligible and minor-illness fallback did not meet threshold.";
        nextBestEndpointSuggestion = "general_practice_review";
      }
    } else {
      recommendedLane = "non_pharmacy_return";
      finalDisposition = "ineligible_returned";
      pathwayGateResult = anyGlobalBlock ? "global_blocked" : "hard_failed";
      unsafeFallbackReasonCode = anyGlobalBlock
        ? "fallback_blocked_by_global_rule"
        : "fallback_blocked_by_non_pathway_failure";
      const blockingRule = [...aggregateMatchedRuleIds].find((ruleId) =>
        compiledRulePack.redFlagBridges.includes(ruleId) ||
        compiledRulePack.globalExclusions.includes(ruleId),
      );
      const blockingDefinition =
        blockingRule === undefined
          ? null
          : (compiledRulePack.globalRuleCatalog[blockingRule] ?? null);
      patientSummaryText =
        blockingDefinition === null
          ? "Pharmacy treatment is not suitable from the information available."
          : compiledRulePack.displayTextCatalog[blockingDefinition.patientTextRef] ??
            blockingDefinition.patientTextRef;
      patientNextStepText =
        blockingDefinition === null
          ? "Please follow the next advice from your practice team."
          : `Next step: ${blockingDefinition.nextBestEndpointSuggestion.replaceAll("_", " ")}.`;
      patientMacroState = anyGlobalBlock ? "urgent_action" : "reviewing_next_steps";
      staffSummaryText =
        blockingDefinition === null
          ? "Evaluation returned a non-pharmacy route."
          : compiledRulePack.displayTextCatalog[blockingDefinition.staffTextRef] ??
            blockingDefinition.staffTextRef;
      nextBestEndpointSuggestion =
        blockingDefinition?.nextBestEndpointSuggestion ?? "general_practice_review";
    }
  }

  const sharedEvidenceHash = sha256Hex(
    canonicalStringify({
      rulePackId: compiledRulePack.rulePackVersion,
      compileHash: compiledRulePack.compileHash,
      evidence,
    }),
  );

  const thresholdSnapshot = compiledRulePack.thresholdSnapshot;
  const explanationBundleId = `eligibility_bundle_${sha256Hex(
    `${input.evaluationId}::${sharedEvidenceHash}`,
  ).slice(0, 20)}`;
  const evaluationRef = makeRef("PathwayEligibilityEvaluation", input.evaluationId, TASK_342);
  const explanationBundle: EligibilityExplanationBundleSnapshot = {
    bundleId: explanationBundleId,
    evaluationRef,
    patientFacingReason: {
      summaryText: patientSummaryText,
      nextStepText: patientNextStepText,
      macroState: patientMacroState,
    },
    staffFacingReason: {
      summaryText: staffSummaryText,
      matchedRuleIds: sortedUnique([...aggregateMatchedRuleIds]),
      thresholdSnapshot: thresholdSnapshot.map(
        (threshold) => `${threshold.thresholdId}=${threshold.serializedValue}`,
      ),
    },
    matchedRules: sortedUnique([...aggregateMatchedRuleIds]),
    nextBestEndpointSuggestion,
    sharedEvidenceHash,
    generatedAt: input.createdAt,
    version: 1,
  };

  const representativeCandidate =
    selectedCandidate ??
    evaluatedPathways.sort((left, right) => {
      const leftOrdinal = compiledRulePack.pathways[left.pathwayCode].metadata.precedenceOrdinal;
      const rightOrdinal = compiledRulePack.pathways[right.pathwayCode].metadata.precedenceOrdinal;
      if (leftOrdinal !== rightOrdinal) {
        return leftOrdinal - rightOrdinal;
      }
      if (left.eligibilityConfidence !== right.eligibilityConfidence) {
        return right.eligibilityConfidence - left.eligibilityConfidence;
      }
      return left.pathwayCode.localeCompare(right.pathwayCode);
    })[0] ??
    null;

  const evaluation: PathwayEligibilityEvaluationSnapshot = {
    evaluationId: input.evaluationId,
    pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCaseId, TASK_342),
    rulePackRef: compiledRulePack.rulePackRef,
    pathwayCode: selectedPathwayCode,
    evaluatedPathways,
    matchedRuleIds: explanationBundle.matchedRules,
    thresholdSnapshot,
    rulePackVersion: compiledRulePack.rulePackVersion,
    ageSexGateResult:
      selectedCandidate?.ageSexGatePass ?? evaluatedPathways.some((candidate) => candidate.ageSexGatePass)
        ? "pass"
        : "fail",
    pathwayGateResult,
    exclusionMatches: sortedUnique([...aggregateExclusionMatches]),
    pathwayExclusionScore: representativeCandidate?.pathwayExclusionScore ?? 0,
    globalExclusionScore: representativeCandidate?.globalExclusionScore ?? 0,
    requiredSymptomSupport: representativeCandidate?.requiredSymptomSupport ?? 0,
    evidenceCompleteness: representativeCandidate?.evidenceCompleteness ?? 0,
    contradictionScore: representativeCandidate?.contradictionScore ?? 0,
    eligibilityConfidence: representativeCandidate?.eligibilityConfidence ?? 0,
    recommendedLane,
    finalDisposition,
    unsafeFallbackReasonCode,
    explanationBundleRef: makeRef("EligibilityExplanationBundle", explanationBundleId, TASK_342),
    timingGuardrailRef: selectedGuardrailRef,
    fallbackScore,
    sharedEvidenceHash,
    evidenceSnapshot: evidence,
    createdAt: input.createdAt,
    version: 1,
  };

  return {
    evaluation,
    explanationBundle,
    compiledRulePack,
    replayed: false,
  };
}

function serializeEvaluationReplayKey(
  pharmacyCaseId: string,
  rulePackId: string,
  evidence: PharmacyEligibilityEvidenceSnapshot,
): string {
  return stableReviewDigest({
    pharmacyCaseId,
    rulePackId,
    evidence,
  });
}

function serializeGoldenCaseComparison(left: PharmacyRulePackSnapshot, right: PharmacyRulePackSnapshot): string[] {
  const deltas: string[] = [];
  for (const threshold of pharmacyRuleThresholdIds) {
    const leftValue = canonicalStringify(
      left.thresholdValues[threshold as keyof PharmacyRulePackThresholdValues],
    );
    const rightValue = canonicalStringify(
      right.thresholdValues[threshold as keyof PharmacyRulePackThresholdValues],
    );
    if (leftValue !== rightValue) {
      deltas.push(threshold);
    }
  }
  return deltas;
}

export interface Phase6PharmacyEligibilityRepositories {
  getRulePack(rulePackId: string): Promise<SnapshotDocument<PharmacyRulePackSnapshot> | null>;
  listRulePacks(): Promise<readonly SnapshotDocument<PharmacyRulePackSnapshot>[]>;
  getCompiledRulePack(
    compiledArtifactId: string,
  ): Promise<SnapshotDocument<CompiledPharmacyRulePackSnapshot> | null>;
  getCompiledRulePackByPackId(
    rulePackId: string,
  ): Promise<SnapshotDocument<CompiledPharmacyRulePackSnapshot> | null>;
  getEvaluation(
    evaluationId: string,
  ): Promise<SnapshotDocument<PathwayEligibilityEvaluationSnapshot> | null>;
  getExplanationBundle(
    bundleId: string,
  ): Promise<SnapshotDocument<EligibilityExplanationBundleSnapshot> | null>;
  listGoldenCases(): Promise<readonly SnapshotDocument<PharmacyGoldenCaseSnapshot>[]>;
  getGoldenCase(
    goldenCaseId: string,
  ): Promise<SnapshotDocument<PharmacyGoldenCaseSnapshot> | null>;
  findEvaluationReplayKey(replayKey: string): Promise<string | null>;
}

export interface Phase6PharmacyEligibilityStore
  extends Phase6PharmacyEligibilityRepositories {
  saveRulePack(
    snapshot: PharmacyRulePackSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveCompiledRulePack(
    snapshot: CompiledPharmacyRulePackSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveEvaluation(
    snapshot: PathwayEligibilityEvaluationSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveExplanationBundle(
    snapshot: EligibilityExplanationBundleSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveGoldenCase(
    snapshot: PharmacyGoldenCaseSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveEvaluationReplayKey(replayKey: string, evaluationId: string): Promise<void>;
}

export function createPhase6PharmacyEligibilityStore(): Phase6PharmacyEligibilityStore {
  const rulePacks = new Map<string, PharmacyRulePackSnapshot>();
  const compiledRulePacks = new Map<string, CompiledPharmacyRulePackSnapshot>();
  const compiledRulePackByPackId = new Map<string, string>();
  const evaluations = new Map<string, PathwayEligibilityEvaluationSnapshot>();
  const explanationBundles = new Map<string, EligibilityExplanationBundleSnapshot>();
  const goldenCases = new Map<string, PharmacyGoldenCaseSnapshot>();
  const evaluationReplayIndex = new Map<string, string>();

  return {
    async getRulePack(rulePackId) {
      const snapshot = rulePacks.get(rulePackId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async listRulePacks() {
      return [...rulePacks.values()]
        .sort((left, right) => left.rulePackId.localeCompare(right.rulePackId))
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async getCompiledRulePack(compiledArtifactId) {
      const snapshot = compiledRulePacks.get(compiledArtifactId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getCompiledRulePackByPackId(rulePackId) {
      const compiledArtifactId = compiledRulePackByPackId.get(rulePackId);
      if (!compiledArtifactId) {
        return null;
      }
      const snapshot = compiledRulePacks.get(compiledArtifactId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getEvaluation(evaluationId) {
      const snapshot = evaluations.get(evaluationId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async getExplanationBundle(bundleId) {
      const snapshot = explanationBundles.get(bundleId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async listGoldenCases() {
      return [...goldenCases.values()]
        .sort((left, right) => left.goldenCaseId.localeCompare(right.goldenCaseId))
        .map((snapshot) => new StoredDocument(snapshot));
    },

    async getGoldenCase(goldenCaseId) {
      const snapshot = goldenCases.get(goldenCaseId);
      return snapshot ? new StoredDocument(snapshot) : null;
    },

    async findEvaluationReplayKey(replayKey) {
      return evaluationReplayIndex.get(replayKey) ?? null;
    },

    async saveRulePack(snapshot, options) {
      const normalized = normalizeRulePackSnapshot(snapshot);
      saveWithCas(rulePacks, normalized.rulePackId, normalized, options);
    },

    async saveCompiledRulePack(snapshot, options) {
      saveWithCas(
        compiledRulePacks,
        snapshot.compiledArtifactId,
        structuredClone(snapshot),
        options,
      );
      compiledRulePackByPackId.set(snapshot.rulePackRef.refId, snapshot.compiledArtifactId);
    },

    async saveEvaluation(snapshot, options) {
      saveWithCas(
        evaluations,
        snapshot.evaluationId,
        structuredClone(snapshot),
        options,
      );
    },

    async saveExplanationBundle(snapshot, options) {
      saveWithCas(
        explanationBundles,
        snapshot.bundleId,
        structuredClone(snapshot),
        options,
      );
    },

    async saveGoldenCase(snapshot, options) {
      saveWithCas(goldenCases, snapshot.goldenCaseId, structuredClone(snapshot), options);
    },

    async saveEvaluationReplayKey(replayKey, evaluationId) {
      evaluationReplayIndex.set(replayKey, evaluationId);
    },
  };
}

async function requireRulePack(
  repositories: Phase6PharmacyEligibilityRepositories,
  rulePackId: string,
): Promise<PharmacyRulePackSnapshot> {
  const document = await repositories.getRulePack(rulePackId);
  invariant(document, "RULE_PACK_NOT_FOUND", "PharmacyRulePack was not found.");
  return document.toSnapshot();
}

async function requireCompiledRulePackForId(
  repositories: Phase6PharmacyEligibilityRepositories,
  rulePackId: string,
): Promise<CompiledPharmacyRulePackSnapshot> {
  const document = await repositories.getCompiledRulePackByPackId(rulePackId);
  invariant(
    document,
    "COMPILED_RULE_PACK_NOT_FOUND",
    "Compiled rule pack was not found for the requested pack.",
  );
  return document.toSnapshot();
}

async function requireEvaluation(
  repositories: Phase6PharmacyEligibilityRepositories,
  evaluationId: string,
): Promise<PathwayEligibilityEvaluationSnapshot> {
  const document = await repositories.getEvaluation(evaluationId);
  invariant(document, "EVALUATION_NOT_FOUND", "PathwayEligibilityEvaluation was not found.");
  return document.toSnapshot();
}

function buildRulePackSnapshot(
  input: PharmacyRulePackDraftInput,
): PharmacyRulePackSnapshot {
  return {
    ...normalizeRulePackDraft(input),
    packState: "draft",
    compileHash: null,
    compiledArtifactRef: null,
    predecessorRulePackRef:
      optionalText(input.predecessorRulePackId) === null
        ? null
        : makeRef("PharmacyRulePack", input.predecessorRulePackId!, TASK_342),
    supersededByRulePackRef: null,
    lastValidatedAt: null,
    lastValidationErrors: [],
    promotedAt: null,
    promotedByRef: null,
    promotionReason: null,
    retiredAt: null,
    version: 1,
  };
}

function selectActivePackForTime(
  packs: readonly PharmacyRulePackSnapshot[],
  evaluatedAt: string,
): PharmacyRulePackSnapshot {
  const activePacks = packs
    .filter((pack) => pack.packState === "promoted")
    .filter(
      (pack) =>
        compareIso(pack.effectiveFrom, evaluatedAt) <= 0 &&
        (pack.effectiveTo === null || compareIso(evaluatedAt, pack.effectiveTo) < 0),
    )
    .sort((left, right) => compareIso(left.effectiveFrom, right.effectiveFrom));

  invariant(activePacks.length > 0, "NO_ACTIVE_RULE_PACK", "No promoted PharmacyRulePack is active for the requested evaluation time.");
  if (activePacks.length === 1) {
    return activePacks[0]!;
  }

  const machineResolved = activePacks.every(
    (pack) => pack.overlapStrategy === "machine_resolved_supersede_previous",
  );
  invariant(
    machineResolved,
    "OVERLAPPING_ACTIVE_RULE_PACKS",
    "Multiple promoted PharmacyRulePacks overlap without machine-resolved governance.",
  );
  return activePacks[activePacks.length - 1]!;
}

function normalizedGoldenCase(snapshot: PharmacyGoldenCaseSnapshot): PharmacyGoldenCaseSnapshot {
  return {
    ...snapshot,
    goldenCaseId: requireText(snapshot.goldenCaseId, "goldenCaseId"),
    title: requireText(snapshot.title, "title"),
    evidence: normalizeEvidence(snapshot.evidence),
    expectedPathwayCode: snapshot.expectedPathwayCode,
    expectedFinalDisposition: snapshot.expectedFinalDisposition,
    expectedRecommendedLane: snapshot.expectedRecommendedLane,
    expectedPathwayGateResult: snapshot.expectedPathwayGateResult,
    expectedUnsafeFallbackReasonCode: optionalText(snapshot.expectedUnsafeFallbackReasonCode),
    expectedNextBestEndpointSuggestion: requireText(
      snapshot.expectedNextBestEndpointSuggestion,
      "expectedNextBestEndpointSuggestion",
    ),
    notes: requireText(snapshot.notes, "notes"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

export interface Phase6PharmacyEligibilityEngineService {
  readonly repositories: Phase6PharmacyEligibilityStore;
  readonly caseKernelService: Phase6PharmacyCaseKernelService;
  importDraftRulePack(input: PharmacyRulePackDraftInput): Promise<PharmacyRulePackSnapshot>;
  getRulePack(rulePackId: string): Promise<PharmacyRulePackSnapshot | null>;
  validateRulePack(rulePackId: string, validatedAt: string): Promise<PharmacyRulePackValidationResult>;
  compileRulePack(rulePackId: string, compiledAt: string): Promise<CompiledPharmacyRulePackSnapshot>;
  promoteRulePack(input: {
    rulePackId: string;
    promotedAt: string;
    promotedByRef: string;
    promotionReason: string;
  }): Promise<PharmacyRulePackSnapshot>;
  retireRulePack(input: {
    rulePackId: string;
    retiredAt: string;
    retiredByRef: string;
    retirementReason: string;
    supersededByRulePackId?: string | null;
  }): Promise<PharmacyRulePackSnapshot>;
  importGoldenCase(input: PharmacyGoldenCaseSnapshot): Promise<PharmacyGoldenCaseSnapshot>;
  listGoldenCases(): Promise<readonly PharmacyGoldenCaseSnapshot[]>;
  evaluateEvidence(input: {
    pharmacyCaseId: string;
    evidence: PharmacyEligibilityEvidenceSnapshot;
    evaluatedAt: string;
    rulePackId?: string;
    evaluationId?: string;
    replayKey?: string;
  }): Promise<PharmacyEligibilityEvaluationResult>;
  replayHistoricalEvaluation(input: {
    evaluationId: string;
    replayRulePackId?: string;
  }): Promise<PharmacyEligibilityEvaluationResult>;
  comparePackVersions(input: {
    baselineRulePackId: string;
    candidateRulePackId: string;
    pharmacyCaseId: string;
    evidence: PharmacyEligibilityEvidenceSnapshot;
    evaluatedAt: string;
  }): Promise<PharmacyRulePackComparisonResult>;
  runGoldenCaseRegression(input: {
    candidateRulePackId: string;
    baselineRulePackId?: string | null;
  }): Promise<PharmacyGoldenCaseRegressionResult>;
  evaluateCurrentPharmacyCase(
    input: EvaluateCurrentPharmacyCaseInput,
  ): Promise<EvaluateCurrentPharmacyCaseResult>;
}

export function createPhase6PharmacyEligibilityEngineService(input?: {
  repositories?: Phase6PharmacyEligibilityStore;
  caseKernelService?: Phase6PharmacyCaseKernelService;
  idGenerator?: BackboneIdGenerator;
}): Phase6PharmacyEligibilityEngineService {
  const repositories = input?.repositories ?? createPhase6PharmacyEligibilityStore();
  const caseKernelService =
    input?.caseKernelService ??
    createPhase6PharmacyCaseKernelService({
      repositories: createPhase6PharmacyCaseKernelStore(),
    });
  const idGenerator =
    input?.idGenerator ?? createDeterministicBackboneIdGenerator("phase6-pharmacy-eligibility");

  function nextId(kind: string): string {
    return (idGenerator.nextId as unknown as (value: string) => string)(kind);
  }

  async function evaluateWithResolvedPack(
    pharmacyCaseId: string,
    evidence: PharmacyEligibilityEvidenceSnapshot,
    evaluatedAt: string,
    rulePackId?: string,
    evaluationId?: string,
    replayKey?: string,
  ): Promise<PharmacyEligibilityEvaluationResult> {
    const normalizedEvidence = normalizeEvidence({
      ...evidence,
      evaluatedAt,
    });
    const selectedPack =
      rulePackId === undefined
        ? selectActivePackForTime(
            (await repositories.listRulePacks()).map((entry) => entry.toSnapshot()),
            evaluatedAt,
          )
        : await requireRulePack(repositories, rulePackId);

    const selectedRulePackId = selectedPack.rulePackId;
    const evaluationReplayKey =
      replayKey ??
      serializeEvaluationReplayKey(pharmacyCaseId, selectedRulePackId, normalizedEvidence);
    const replayedEvaluationId = await repositories.findEvaluationReplayKey(evaluationReplayKey);
    if (replayedEvaluationId) {
      const replayedEvaluation = await requireEvaluation(repositories, replayedEvaluationId);
      const replayedBundle = await repositories.getExplanationBundle(
        replayedEvaluation.explanationBundleRef.refId,
      );
      invariant(
        replayedBundle,
        "EXPLANATION_BUNDLE_NOT_FOUND",
        "Eligibility explanation bundle was not found for replayed evaluation.",
      );
      return {
        evaluation: replayedEvaluation,
        explanationBundle: replayedBundle.toSnapshot(),
        compiledRulePack: await requireCompiledRulePackForId(repositories, replayedEvaluation.rulePackRef.refId),
        replayed: true,
      };
    }

    const compiledRulePack = await requireCompiledRulePackForId(repositories, selectedRulePackId);
    const materialized = evaluateCompiledRulePack(compiledRulePack, {
      evaluationId: evaluationId ?? nextId("pharmacy_pathway_evaluation"),
      pharmacyCaseId,
      evidence: normalizedEvidence,
      createdAt: evaluatedAt,
    });
    await repositories.saveEvaluation(materialized.evaluation);
    await repositories.saveExplanationBundle(materialized.explanationBundle);
    await repositories.saveEvaluationReplayKey(
      evaluationReplayKey,
      materialized.evaluation.evaluationId,
    );
    return materialized;
  }

  return {
    repositories,
    caseKernelService,

    async importDraftRulePack(draftInput) {
      const snapshot = buildRulePackSnapshot(draftInput);
      const existing = await repositories.getRulePack(snapshot.rulePackId);
      await repositories.saveRulePack(
        snapshot,
        existing ? { expectedVersion: existing.toSnapshot().version } : undefined,
      );
      return snapshot;
    },

    async getRulePack(rulePackId) {
      const document = await repositories.getRulePack(rulePackId);
      return document?.toSnapshot() ?? null;
    },

    async validateRulePack(rulePackId, validatedAt) {
      const existing = await requireRulePack(repositories, rulePackId);
      const result = validateRulePackDraft(existing);
      const nextSnapshot = normalizeRulePackSnapshot({
        ...existing,
        lastValidatedAt: validatedAt,
        lastValidationErrors: [...result.errors],
        version: nextVersion(existing.version),
      });
      await repositories.saveRulePack(nextSnapshot, { expectedVersion: existing.version });
      return result;
    },

    async compileRulePack(rulePackId, compiledAt) {
      const existing = await requireRulePack(repositories, rulePackId);
      const validation = validateRulePackDraft(existing);
      invariant(
        validation.valid,
        "RULE_PACK_VALIDATION_FAILED",
        validation.errors.join(" | "),
      );
      const compiledArtifactId = existing.compiledArtifactRef ?? nextId("compiled_rule_pack");
      const compiled = compileRulePackPayload(existing, compiledAt, compiledArtifactId);
      await repositories.saveCompiledRulePack(
        compiled,
        existing.compiledArtifactRef === null
          ? undefined
          : { expectedVersion: (await requireCompiledRulePackForId(repositories, rulePackId)).version },
      );
      const nextSnapshot = normalizeRulePackSnapshot({
        ...existing,
        packState: existing.packState === "promoted" ? "promoted" : "compiled",
        compileHash: compiled.compileHash,
        compiledArtifactRef: compiled.compiledArtifactId,
        lastValidatedAt: compiledAt,
        lastValidationErrors: [],
        version: nextVersion(existing.version),
      });
      await repositories.saveRulePack(nextSnapshot, { expectedVersion: existing.version });
      return compiled;
    },

    async promoteRulePack(command) {
      const existing = await requireRulePack(repositories, command.rulePackId);
      const validation = await this.validateRulePack(command.rulePackId, command.promotedAt);
      invariant(
        validation.valid,
        "RULE_PACK_PROMOTION_BLOCKED_BY_VALIDATION",
        validation.errors.join(" | "),
      );
      const compiled = await this.compileRulePack(command.rulePackId, command.promotedAt);
      const current = await requireRulePack(repositories, command.rulePackId);
      const regression = await this.runGoldenCaseRegression({
        candidateRulePackId: command.rulePackId,
      });
      invariant(
        regression.passed,
        "RULE_PACK_PROMOTION_BLOCKED_BY_GOLDEN_CASES",
        "Golden-case regression failed for the candidate PharmacyRulePack.",
      );

      const promotedPacks = (await repositories.listRulePacks())
        .map((entry) => entry.toSnapshot())
        .filter((pack) => pack.packState === "promoted" && pack.rulePackId !== current.rulePackId);

      for (const promotedPack of promotedPacks) {
        const overlap =
          compareIso(current.effectiveFrom, promotedPack.effectiveTo ?? "9999-12-31T23:59:59.999Z") < 0 &&
          compareIso(promotedPack.effectiveFrom, current.effectiveTo ?? "9999-12-31T23:59:59.999Z") < 0;
        if (overlap) {
          invariant(
            current.overlapStrategy === "machine_resolved_supersede_previous",
            "OVERLAPPING_RULE_PACK_WINDOW",
            "Overlapping effective windows require machine-resolved supersession governance.",
          );
          const superseded = normalizeRulePackSnapshot({
            ...promotedPack,
            packState: "superseded",
            effectiveTo: current.effectiveFrom,
            supersededByRulePackRef: makeRef("PharmacyRulePack", current.rulePackId, TASK_342),
            retiredAt: command.promotedAt,
            version: nextVersion(promotedPack.version),
          });
          await repositories.saveRulePack(superseded, {
            expectedVersion: promotedPack.version,
          });
        }
      }

      const promoted = normalizeRulePackSnapshot({
        ...current,
        packState: "promoted",
        compileHash: compiled.compileHash,
        compiledArtifactRef: compiled.compiledArtifactId,
        promotedAt: command.promotedAt,
        promotedByRef: command.promotedByRef,
        promotionReason: command.promotionReason,
        lastValidatedAt: command.promotedAt,
        lastValidationErrors: [],
        version: nextVersion(current.version),
      });
      await repositories.saveRulePack(promoted, { expectedVersion: current.version });
      return promoted;
    },

    async retireRulePack(command) {
      const existing = await requireRulePack(repositories, command.rulePackId);
      invariant(
        existing.packState === "promoted" || existing.packState === "compiled",
        "ILLEGAL_RULE_PACK_RETIRE_STATE",
        "Only compiled or promoted packs may be retired.",
      );
      const nextState: PharmacyRulePackState =
        optionalText(command.supersededByRulePackId) === null ? "retired" : "superseded";
      const retired = normalizeRulePackSnapshot({
        ...existing,
        packState: nextState,
        effectiveTo: command.retiredAt,
        retiredAt: command.retiredAt,
        supersededByRulePackRef:
          optionalText(command.supersededByRulePackId) === null
            ? null
            : makeRef("PharmacyRulePack", command.supersededByRulePackId!, TASK_342),
        version: nextVersion(existing.version),
      });
      await repositories.saveRulePack(retired, { expectedVersion: existing.version });
      return retired;
    },

    async importGoldenCase(inputCase) {
      const snapshot = normalizedGoldenCase(inputCase);
      const existing = await repositories.getGoldenCase(snapshot.goldenCaseId);
      await repositories.saveGoldenCase(
        snapshot,
        existing ? { expectedVersion: existing.toSnapshot().version } : undefined,
      );
      return snapshot;
    },

    async listGoldenCases() {
      return (await repositories.listGoldenCases()).map((entry) => entry.toSnapshot());
    },

    async evaluateEvidence(command) {
      return evaluateWithResolvedPack(
        command.pharmacyCaseId,
        command.evidence,
        command.evaluatedAt,
        command.rulePackId,
        command.evaluationId,
        command.replayKey,
      );
    },

    async replayHistoricalEvaluation(command) {
      const original = await requireEvaluation(repositories, command.evaluationId);
      return evaluateWithResolvedPack(
        original.pharmacyCaseRef.refId,
        original.evidenceSnapshot,
        original.evidenceSnapshot.evaluatedAt,
        command.replayRulePackId ?? original.rulePackRef.refId,
        undefined,
      );
    },

    async comparePackVersions(command) {
      const baselineRulePack = await requireRulePack(repositories, command.baselineRulePackId);
      const candidateRulePack = await requireRulePack(repositories, command.candidateRulePackId);
      const baselineEvaluation = await evaluateWithResolvedPack(
        command.pharmacyCaseId,
        command.evidence,
        command.evaluatedAt,
        command.baselineRulePackId,
      );
      const candidateEvaluation = await evaluateWithResolvedPack(
        command.pharmacyCaseId,
        command.evidence,
        command.evaluatedAt,
        command.candidateRulePackId,
      );
      const behaviorChanged =
        baselineEvaluation.evaluation.finalDisposition !==
          candidateEvaluation.evaluation.finalDisposition ||
        baselineEvaluation.evaluation.pathwayCode !==
          candidateEvaluation.evaluation.pathwayCode ||
        baselineEvaluation.evaluation.recommendedLane !==
          candidateEvaluation.evaluation.recommendedLane ||
        baselineEvaluation.evaluation.pathwayGateResult !==
          candidateEvaluation.evaluation.pathwayGateResult;

      return {
        baselineRulePackId: baselineRulePack.rulePackId,
        candidateRulePackId: candidateRulePack.rulePackId,
        thresholdDeltaRefs: serializeGoldenCaseComparison(
          baselineRulePack,
          candidateRulePack,
        ),
        behaviorChanged,
        baselineEvaluation: baselineEvaluation.evaluation,
        candidateEvaluation: candidateEvaluation.evaluation,
        candidateExplanationBundle: candidateEvaluation.explanationBundle,
      };
    },

    async runGoldenCaseRegression(command) {
      const goldenCases = (await repositories.listGoldenCases()).map((entry) => entry.toSnapshot());
      const entries: PharmacyGoldenCaseRegressionEntry[] = [];

      for (const goldenCase of goldenCases) {
        const candidate = await evaluateWithResolvedPack(
          `golden_case_${goldenCase.goldenCaseId}`,
          goldenCase.evidence,
          goldenCase.evidence.evaluatedAt,
          command.candidateRulePackId,
          undefined,
          stableReviewDigest({
            goldenCaseId: goldenCase.goldenCaseId,
            candidateRulePackId: command.candidateRulePackId,
            evaluatedAt: goldenCase.evidence.evaluatedAt,
          }),
        );

        const baseline =
          optionalText(command.baselineRulePackId) === null
            ? null
            : await evaluateWithResolvedPack(
                `golden_case_${goldenCase.goldenCaseId}`,
                goldenCase.evidence,
                goldenCase.evidence.evaluatedAt,
                command.baselineRulePackId!,
                undefined,
                stableReviewDigest({
                  goldenCaseId: goldenCase.goldenCaseId,
                  baselineRulePackId: command.baselineRulePackId,
                  evaluatedAt: goldenCase.evidence.evaluatedAt,
                }),
              );

        const failures: string[] = [];
        if (
          candidate.evaluation.finalDisposition !== goldenCase.expectedFinalDisposition
        ) {
          failures.push("final_disposition_mismatch");
        }
        if (candidate.evaluation.pathwayCode !== goldenCase.expectedPathwayCode) {
          failures.push("selected_pathway_mismatch");
        }
        if (
          candidate.evaluation.recommendedLane !== goldenCase.expectedRecommendedLane
        ) {
          failures.push("recommended_lane_mismatch");
        }
        if (
          candidate.evaluation.pathwayGateResult !== goldenCase.expectedPathwayGateResult
        ) {
          failures.push("pathway_gate_result_mismatch");
        }
        if (
          candidate.evaluation.unsafeFallbackReasonCode !==
          goldenCase.expectedUnsafeFallbackReasonCode
        ) {
          failures.push("unsafe_fallback_reason_mismatch");
        }
        if (
          candidate.explanationBundle.nextBestEndpointSuggestion !==
          goldenCase.expectedNextBestEndpointSuggestion
        ) {
          failures.push("next_best_endpoint_mismatch");
        }
        if (
          goldenCase.forbidBehaviorDrift &&
          baseline !== null &&
          (baseline.evaluation.finalDisposition !== candidate.evaluation.finalDisposition ||
            baseline.evaluation.pathwayCode !== candidate.evaluation.pathwayCode)
        ) {
          failures.push("forbidden_behavior_drift");
        }

        entries.push({
          goldenCaseId: goldenCase.goldenCaseId,
          title: goldenCase.title,
          passed: failures.length === 0,
          expectedFinalDisposition: goldenCase.expectedFinalDisposition,
          actualFinalDisposition: candidate.evaluation.finalDisposition,
          expectedPathwayCode: goldenCase.expectedPathwayCode,
          actualPathwayCode: candidate.evaluation.pathwayCode,
          expectedRecommendedLane: goldenCase.expectedRecommendedLane,
          actualRecommendedLane: candidate.evaluation.recommendedLane,
          expectedPathwayGateResult: goldenCase.expectedPathwayGateResult,
          actualPathwayGateResult: candidate.evaluation.pathwayGateResult,
          expectedUnsafeFallbackReasonCode: goldenCase.expectedUnsafeFallbackReasonCode,
          actualUnsafeFallbackReasonCode: candidate.evaluation.unsafeFallbackReasonCode,
          failures,
        });
      }

      return {
        candidateRulePackId: command.candidateRulePackId,
        baselineRulePackId: command.baselineRulePackId ?? null,
        passed: entries.every((entry) => entry.passed),
        entries,
      };
    },

    async evaluateCurrentPharmacyCase(command) {
      const evaluationResult = await evaluateWithResolvedPack(
        command.pharmacyCaseId,
        command.evidence,
        command.recordedAt,
        command.rulePackId,
        command.evaluationId,
        command.idempotencyKey,
      );
      const evaluation = evaluationResult.evaluation;
      const caseMutation = await caseKernelService.evaluatePharmacyCase({
        pharmacyCaseId: command.pharmacyCaseId,
        actorRef: command.actorRef,
        commandActionRecordRef: command.commandActionRecordRef,
        commandSettlementRecordRef: command.commandSettlementRecordRef,
        recordedAt: command.recordedAt,
        leaseRef: command.leaseRef,
        expectedOwnershipEpoch: command.expectedOwnershipEpoch,
        expectedLineageFenceRef: command.expectedLineageFenceRef,
        scopedMutationGateRef: command.scopedMutationGateRef,
        scopedMutationGateState: command.scopedMutationGateState,
        reasonCode: command.reasonCode,
        idempotencyKey: command.idempotencyKey,
        serviceType:
          evaluation.recommendedLane === "minor_illness_fallback"
            ? "minor_illness_fallback"
            : "clinical_pathway_consultation",
        candidatePathway: evaluation.pathwayCode,
        eligibilityRef: makeRef(
          "PathwayEligibilityEvaluation",
          evaluation.evaluationId,
          TASK_342,
        ),
        evaluationOutcome:
          evaluation.finalDisposition === "ineligible_returned" ? "ineligible" : "eligible",
        sourceDecisionSupersessionRef: command.sourceDecisionSupersessionRef ?? null,
      } satisfies EvaluatePharmacyCaseInput);

      return {
        ...evaluationResult,
        caseMutation,
      };
    },
  };
}
