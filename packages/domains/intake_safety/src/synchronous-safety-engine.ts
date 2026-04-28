import { createHash } from "node:crypto";
import {
  type BackboneIdGenerator,
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  type AssimilationSafetyDependencies,
  type ClassificationBasis,
  type ConfidenceBand,
  EvidenceClassificationDecisionDocument,
  type EvidenceClass,
  type EvidenceClassificationDecisionSnapshot,
  type FeatureState,
  type MisclassificationRiskState,
  type PreemptionFallbackState,
  type PreemptionPriority,
  type PreemptionStatus,
  type RequestedSafetyState,
  SafetyDecisionRecordDocument,
  type SafetyDecisionOutcome,
  type SafetyDecisionRecordSnapshot,
  SafetyPreemptionRecordDocument,
  type SafetyPreemptionRecordSnapshot,
  createAssimilationSafetyStore,
} from "./assimilation-safety-backbone";
import {
  createEvidenceBackboneStore,
  type EvidenceBackboneDependencies,
} from "./evidence-backbone";

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

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return uniqueSorted(
    value.flatMap((entry) => {
      const resolved = asString(entry);
      return resolved ? [resolved] : [];
    }),
  );
}

function getNestedValue(target: Record<string, unknown>, path: string): unknown {
  return path
    .split(".")
    .filter(Boolean)
    .reduce<unknown>((cursor, segment) => {
      if (typeof cursor !== "object" || cursor === null || Array.isArray(cursor)) {
        return undefined;
      }
      return (cursor as Record<string, unknown>)[segment];
    }, target);
}

function normalizeText(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

function textIncludesAny(text: string, probes: readonly string[]): boolean {
  return probes.some((probe) => text.includes(probe));
}

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

function roundMetric(value: number): number {
  return Number(value.toFixed(6));
}

function nextSafetyId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

export type Phase1SynchronousSafetySeverityClass =
  | "hard_stop"
  | "urgent_contributor"
  | "residual_contributor"
  | "reachability_contributor";

export type Phase1SynchronousSafetyMissingnessMode =
  | "ignore"
  | "conservative_hold"
  | "urgent_review";

export type Phase1SynchronousSafetyContradictionMode =
  | "require_resolution"
  | "clinician_override_only"
  | "latest_highest_assurance";

export type Phase1SynchronousSafetyScoreAxis = "urgent" | "residual" | "both";

export interface Phase1SynchronousSafetyDependencyGroup {
  dependencyGroupRef: string;
  urgentCap: number;
  residualCap: number;
}

export interface Phase1SynchronousSafetyRuleDefinition {
  ruleId: string;
  ruleVersion: string;
  humanReadableName: string;
  clinicalRationale: string;
  owningApproverRef: string;
  effectiveDate: string;
  fixtureSetRefs: readonly string[];
  severityClass: Phase1SynchronousSafetySeverityClass;
  dependencyGroupRef: string;
  logLikelihoodWeight: number;
  criticalFeatureRefs: readonly string[];
  missingnessMode: Phase1SynchronousSafetyMissingnessMode;
  contradictionMode: Phase1SynchronousSafetyContradictionMode;
  calibrationStratumRef: string;
  validityWindowRef: string;
  scoreAxis: Phase1SynchronousSafetyScoreAxis;
  requestTypes?: readonly string[];
}

export interface Phase1SynchronousSafetyRulePack {
  schemaVersion: "PHASE1_SYNCHRONOUS_SAFETY_RULE_PACK_V1";
  rulePackId: string;
  rulePackVersion: string;
  rulePackVersionRef: string;
  upstreamRulebookRef: string;
  authoredConfigReasonCodes: readonly string[];
  calibratorVersionRef: string;
  thresholdUrgent: number;
  thresholdResidual: number;
  contradictionThreshold: number;
  missingnessThreshold: number;
  betaUrgent: number;
  betaResidual: number;
  betaConflictUrgent: number;
  betaConflictResidual: number;
  betaMissingUrgent: number;
  betaMissingResidual: number;
  dependencyGroups: readonly Phase1SynchronousSafetyDependencyGroup[];
  rules: readonly Phase1SynchronousSafetyRuleDefinition[];
}

export interface SynchronousSafetyProbabilityInput {
  requestTypeRef: string;
  axis: "urgent" | "residual";
  rawProbability: number;
}

export interface SynchronousSafetyCalibrator {
  calibratorVersionRef: string;
  calibrate(input: SynchronousSafetyProbabilityInput): number;
}

export interface SynchronousSafetyRulePackLoader {
  loadRulePack(preferredRulePackVersionRef?: string | null): Phase1SynchronousSafetyRulePack;
}

export interface SynchronousSafetyCalibratorResolver {
  resolveCalibrator(requestedCalibratorVersionRef?: string | null): SynchronousSafetyCalibrator;
}

export interface SynchronousSafetyEvidenceCut {
  requestId: string;
  submissionSnapshotFreezeRef: string;
  evidenceSnapshotRef: string;
  normalizedSubmissionRef: string;
  sourceLineageRef: string;
  requestTypeRef: "Symptoms" | "Meds" | "Admin" | "Results";
  requestShape: Record<string, unknown>;
  activeStructuredAnswers: Record<string, unknown>;
  authoredNarrativeText: string | null;
  summaryFragments: readonly string[];
  attachmentRefs: readonly string[];
  contactPreferencesRef: string | null;
  contactAuthorityState:
    | "verified"
    | "assumed_self_service_browser_minimum"
    | "rebind_required"
    | "blocked";
  contactAuthorityClass:
    | "self_asserted"
    | "nhs_login_claim"
    | "verified_destination"
    | "authority_confirmed";
  evidenceReadinessState: "urgent_live_only" | "safety_usable" | "manual_review_only";
  channelCapabilityCeiling: {
    canUploadFiles: boolean;
    canRenderTrackStatus: boolean;
    canRenderEmbedded: boolean;
    mutatingResumeState: "allowed" | "rebind_required" | "blocked";
  };
  identityContext: {
    bindingState:
      | "anonymous"
      | "partial"
      | "verified"
      | "uplift_pending"
      | "identity_repair_required";
    subjectRefPresence: "none" | "masked" | "bound";
    claimResumeState: "not_required" | "pending" | "granted" | "blocked";
    actorBindingState:
      | "anonymous"
      | "partial"
      | "verified"
      | "uplift_pending"
      | "identity_repair_required";
  };
  frozenAt: string;
}

export interface SynchronousSafetyDerivedFeatures {
  featureStates: Record<string, FeatureState>;
  contradictionRatio: number;
  contradictionRefs: readonly string[];
  missingnessRatio: number;
  criticalMissingFeatureRefs: readonly string[];
  activeReachabilityDependencyRefs: readonly string[];
  clinicalKeywordHits: readonly string[];
  reasonCodes: readonly string[];
}

export interface SynchronousSafetyDiagnostics {
  rulePackVersionRef: string;
  calibratorVersionRef: string;
  hardStopRuleRefs: readonly string[];
  urgentContributorRuleRefs: readonly string[];
  residualContributorRuleRefs: readonly string[];
  reachabilityContributorRuleRefs: readonly string[];
  urgentProbability: number;
  residualProbability: number;
  contradictionRatio: number;
  missingnessRatio: number;
  conflictVectorRef: string | null;
  criticalMissingnessRef: string | null;
  activeReachabilityDependencyRefs: readonly string[];
  firedRuleRefs: readonly string[];
  featureStates: Record<string, FeatureState>;
  reasonCodes: readonly string[];
}

export interface SynchronousSafetyEvaluationResult {
  replayed: boolean;
  classification: EvidenceClassificationDecisionSnapshot;
  preemption: SafetyPreemptionRecordSnapshot;
  safetyDecision: SafetyDecisionRecordSnapshot;
  derivedFeatures: SynchronousSafetyDerivedFeatures;
  diagnostics: SynchronousSafetyDiagnostics;
}

export interface EvaluateSynchronousSafetyInput {
  episodeId: string;
  requestId: string;
  currentSafetyDecisionEpoch?: number;
  decidedAt: string;
  evidenceCut: SynchronousSafetyEvidenceCut;
  preferredRulePackVersionRef?: string | null;
  preferredCalibratorVersionRef?: string | null;
}

export const phase1SynchronousSafetyReasonCatalog = [
  {
    reasonCode: "GAP_RESOLVED_PHASE1_SAFETY_WEIGHT_SEEDS_V1",
    class: "config",
    description:
      "par_150 resolved the initial urgent and residual weight seeds as explicit authored configuration instead of prose-only policy.",
  },
  {
    reasonCode: "GAP_RESOLVED_PHASE1_SAFETY_IDENTITY_CALIBRATOR_V1",
    class: "calibration",
    description:
      "The Phase 1 synchronous engine uses an identity calibrator until adjudicated challenge volume is large enough for governed monotone recalibration.",
  },
  {
    reasonCode: "PHASE1_SYNC_SAFETY_CLASSIFIER_CONTENT_SIGNAL_V1",
    class: "classification",
    description:
      "The classification pass derived its dominant evidence class from the frozen canonical submission cut rather than controller-local heuristics.",
  },
  {
    reasonCode: "PHASE1_SYNC_SAFETY_FAIL_CLOSED_MANUAL_REVIEW",
    class: "outcome",
    description:
      "The engine could not safely trust the evidence or runtime posture and therefore settled fallback manual review instead of routine continuation.",
  },
  {
    reasonCode: "PHASE1_SYNC_SAFETY_URGENT_REQUIRED",
    class: "outcome",
    description:
      "The immutable synchronous safety pass requested urgent diversion for the current submission snapshot.",
  },
  {
    reasonCode: "PHASE1_SYNC_SAFETY_RESIDUAL_RISK",
    class: "outcome",
    description:
      "The immutable synchronous safety pass retained residual review posture on the current submission snapshot.",
  },
  {
    reasonCode: "PHASE1_SYNC_SAFETY_SCREEN_CLEAR",
    class: "outcome",
    description:
      "The immutable synchronous safety pass settled a governed screen-clear posture on the current submission snapshot.",
  },
  {
    reasonCode: "PHASE1_SYNC_SAFETY_HARD_STOP_DOMINANT",
    class: "decision_boundary",
    description:
      "A hard-stop rule fired and therefore dominated any softer urgent or residual scoring.",
  },
  {
    reasonCode: "PHASE1_SYNC_SAFETY_CONTACT_TRUST_UNSAFE",
    class: "dependency",
    description:
      "Reachability or contact-authority posture was not safe enough to allow calm routine continuation.",
  },
  {
    reasonCode: "PHASE1_SYNC_SAFETY_EVIDENCE_READINESS_UNTRUSTED",
    class: "dependency",
    description:
      "The normalized submission declared evidence readiness below the threshold required for routine safety clearance.",
  },
] as const;

const hardStopRules = [
  {
    ruleId: "RF142_HS_ACUTE_CHEST_BREATHING",
    ruleVersion: "1.0.0",
    humanReadableName: "Acute chest or breathing red flag",
    clinicalRationale:
      "Chest pain with breathing compromise remains a dominant urgent diversion trigger in the frozen Phase 1 rulebook.",
    owningApproverRef: "CLINICAL_SAFETY_SEED_PANEL_PHASE1_V1",
    effectiveDate: "2026-04-14",
    fixtureSetRefs: ["CASE_150_SYMPTOMS_CHEST_BREATHING", "CASE_150_FAIL_CLOSED_CHEST_SIGNAL"],
    severityClass: "hard_stop",
    dependencyGroupRef: "DG_142_CARDIO_RESP_URGENT",
    logLikelihoodWeight: 1.25,
    criticalFeatureRefs: ["feature.chest_breathing_red_flag"],
    missingnessMode: "conservative_hold",
    contradictionMode: "clinician_override_only",
    calibrationStratumRef: "STRATUM_142_SYMPTOMS_V1",
    validityWindowRef: "VALIDITY_142_PHASE1_RULEBOOK_V1",
    scoreAxis: "urgent",
    requestTypes: ["Symptoms"],
  },
  {
    ruleId: "RF142_HS_STROKE_COLLAPSE_OR_SEIZURE",
    ruleVersion: "1.0.0",
    humanReadableName: "Stroke, collapse, or seizure signal",
    clinicalRationale:
      "Neurological collapse language is a hard-stop pathway and may not be softened by later contradictory low-assurance detail.",
    owningApproverRef: "CLINICAL_SAFETY_SEED_PANEL_PHASE1_V1",
    effectiveDate: "2026-04-14",
    fixtureSetRefs: ["CASE_150_STROKE_COLLAPSE"],
    severityClass: "hard_stop",
    dependencyGroupRef: "DG_142_NEURO_COLLAPSE_URGENT",
    logLikelihoodWeight: 1.2,
    criticalFeatureRefs: ["feature.stroke_collapse_signal"],
    missingnessMode: "conservative_hold",
    contradictionMode: "clinician_override_only",
    calibrationStratumRef: "STRATUM_142_SYMPTOMS_V1",
    validityWindowRef: "VALIDITY_142_PHASE1_RULEBOOK_V1",
    scoreAxis: "urgent",
    requestTypes: ["Symptoms"],
  },
  {
    ruleId: "RF142_HS_ANAPHYLAXIS_OR_SEVERE_MED_REACTION",
    ruleVersion: "1.0.0",
    humanReadableName: "Severe medication reaction signal",
    clinicalRationale:
      "Anaphylaxis and severe medication-reaction language must immediately request urgent diversion in the same request lineage.",
    owningApproverRef: "CLINICAL_SAFETY_SEED_PANEL_PHASE1_V1",
    effectiveDate: "2026-04-14",
    fixtureSetRefs: ["CASE_150_MEDS_SEVERE_REACTION"],
    severityClass: "hard_stop",
    dependencyGroupRef: "DG_142_ALLERGY_MEDS_URGENT",
    logLikelihoodWeight: 1.18,
    criticalFeatureRefs: ["feature.severe_medication_reaction_signal"],
    missingnessMode: "conservative_hold",
    contradictionMode: "clinician_override_only",
    calibrationStratumRef: "STRATUM_142_MEDS_V1",
    validityWindowRef: "VALIDITY_142_PHASE1_RULEBOOK_V1",
    scoreAxis: "urgent",
    requestTypes: ["Meds"],
  },
  {
    ruleId: "RF142_HS_HEAVY_BLEEDING_OR_PREGNANCY_RED_FLAG",
    ruleVersion: "1.0.0",
    humanReadableName: "Heavy bleeding or pregnancy red flag",
    clinicalRationale:
      "Heavy bleeding and pregnancy-red-flag language remain dominant urgent triggers in the Phase 1 authored pack.",
    owningApproverRef: "CLINICAL_SAFETY_SEED_PANEL_PHASE1_V1",
    effectiveDate: "2026-04-14",
    fixtureSetRefs: ["CASE_150_HEAVY_BLEEDING"],
    severityClass: "hard_stop",
    dependencyGroupRef: "DG_142_CARDIO_RESP_URGENT",
    logLikelihoodWeight: 1.1,
    criticalFeatureRefs: ["feature.heavy_bleeding_or_pregnancy_signal"],
    missingnessMode: "conservative_hold",
    contradictionMode: "clinician_override_only",
    calibrationStratumRef: "STRATUM_142_GLOBAL_FALLBACK_V1",
    validityWindowRef: "VALIDITY_142_PHASE1_RULEBOOK_V1",
    scoreAxis: "urgent",
  },
  {
    ruleId: "RF142_HS_SELF_HARM_OR_SAFEGUARDING_SIGNAL",
    ruleVersion: "1.0.0",
    humanReadableName: "Self-harm or safeguarding signal",
    clinicalRationale:
      "Self-harm and safeguarding language must never fall through to routine continuation inside the self-service submit path.",
    owningApproverRef: "CLINICAL_SAFETY_SEED_PANEL_PHASE1_V1",
    effectiveDate: "2026-04-14",
    fixtureSetRefs: ["CASE_150_SELF_HARM_SIGNAL"],
    severityClass: "hard_stop",
    dependencyGroupRef: "DG_142_NEURO_COLLAPSE_URGENT",
    logLikelihoodWeight: 1.16,
    criticalFeatureRefs: ["feature.self_harm_or_safeguarding_signal"],
    missingnessMode: "conservative_hold",
    contradictionMode: "clinician_override_only",
    calibrationStratumRef: "STRATUM_142_GLOBAL_FALLBACK_V1",
    validityWindowRef: "VALIDITY_142_PHASE1_RULEBOOK_V1",
    scoreAxis: "urgent",
  },
] as const satisfies readonly Phase1SynchronousSafetyRuleDefinition[];

const softRules = [
  {
    ruleId: "RF142_UC_SEVERE_PAIN_ESCALATION",
    ruleVersion: "1.0.0",
    humanReadableName: "Severe pain escalation",
    clinicalRationale:
      "Pain with functional impact or chest-sided escalation should materially increase the urgent pathway score.",
    owningApproverRef: "CLINICAL_SAFETY_SEED_PANEL_PHASE1_V1",
    effectiveDate: "2026-04-14",
    fixtureSetRefs: ["CASE_150_SYMPTOMS_PERSISTENT", "CASE_150_RESULTS_HIGH_RISK"],
    severityClass: "urgent_contributor",
    dependencyGroupRef: "DG_142_CARDIO_RESP_URGENT",
    logLikelihoodWeight: 0.48,
    criticalFeatureRefs: ["feature.severe_pain_escalation"],
    missingnessMode: "ignore",
    contradictionMode: "latest_highest_assurance",
    calibrationStratumRef: "STRATUM_142_SYMPTOMS_V1",
    validityWindowRef: "VALIDITY_142_PHASE1_RULEBOOK_V1",
    scoreAxis: "urgent",
    requestTypes: ["Symptoms", "Results"],
  },
  {
    ruleId: "RF142_UC_RAPID_WORSENING_RECENT_ONSET",
    ruleVersion: "1.0.0",
    humanReadableName: "Rapid worsening with recent onset",
    clinicalRationale:
      "Rapid recent worsening increases urgent concern even when no hard-stop antecedent has fired.",
    owningApproverRef: "CLINICAL_SAFETY_SEED_PANEL_PHASE1_V1",
    effectiveDate: "2026-04-14",
    fixtureSetRefs: ["CASE_150_RESULTS_HIGH_RISK"],
    severityClass: "urgent_contributor",
    dependencyGroupRef: "DG_142_CARDIO_RESP_URGENT",
    logLikelihoodWeight: 0.42,
    criticalFeatureRefs: ["feature.rapid_worsening_recent_onset"],
    missingnessMode: "ignore",
    contradictionMode: "latest_highest_assurance",
    calibrationStratumRef: "STRATUM_142_SYMPTOMS_V1",
    validityWindowRef: "VALIDITY_142_PHASE1_RULEBOOK_V1",
    scoreAxis: "urgent",
    requestTypes: ["Symptoms", "Results"],
  },
  {
    ruleId: "RF142_UC_HIGH_RISK_RESULT_WITH_CURRENT_SYMPTOMS",
    ruleVersion: "1.0.0",
    humanReadableName: "High-risk result with current symptoms",
    clinicalRationale:
      "Results language paired with ongoing symptom burden should open the urgent pathway even before human review.",
    owningApproverRef: "CLINICAL_SAFETY_SEED_PANEL_PHASE1_V1",
    effectiveDate: "2026-04-14",
    fixtureSetRefs: ["CASE_150_RESULTS_HIGH_RISK"],
    severityClass: "urgent_contributor",
    dependencyGroupRef: "DG_142_RESULTS_MEDS_TIMING",
    logLikelihoodWeight: 0.44,
    criticalFeatureRefs: ["feature.high_risk_result_with_current_symptoms"],
    missingnessMode: "ignore",
    contradictionMode: "latest_highest_assurance",
    calibrationStratumRef: "STRATUM_142_ADMIN_RESULTS_V1",
    validityWindowRef: "VALIDITY_142_PHASE1_RULEBOOK_V1",
    scoreAxis: "urgent",
    requestTypes: ["Results"],
  },
  {
    ruleId: "RF142_UC_HIGH_RISK_MED_INTERRUPTION",
    ruleVersion: "1.0.0",
    humanReadableName: "High-risk medication interruption",
    clinicalRationale:
      "Medication-interruption narratives with urgent-today posture should increase the urgent pathway score.",
    owningApproverRef: "CLINICAL_SAFETY_SEED_PANEL_PHASE1_V1",
    effectiveDate: "2026-04-14",
    fixtureSetRefs: ["CASE_150_MED_INTERRUPTION"],
    severityClass: "urgent_contributor",
    dependencyGroupRef: "DG_142_RESULTS_MEDS_TIMING",
    logLikelihoodWeight: 0.39,
    criticalFeatureRefs: ["feature.high_risk_medication_interruption"],
    missingnessMode: "ignore",
    contradictionMode: "latest_highest_assurance",
    calibrationStratumRef: "STRATUM_142_MEDS_V1",
    validityWindowRef: "VALIDITY_142_PHASE1_RULEBOOK_V1",
    scoreAxis: "urgent",
    requestTypes: ["Meds"],
  },
  {
    ruleId: "RF142_RC_MODERATE_PERSISTENT_SYMPTOMS",
    ruleVersion: "1.0.0",
    humanReadableName: "Moderate persistent symptoms",
    clinicalRationale:
      "Longer-running symptoms with functional impact should keep the case in residual review even when urgent diversion is not required.",
    owningApproverRef: "CLINICAL_SAFETY_SEED_PANEL_PHASE1_V1",
    effectiveDate: "2026-04-14",
    fixtureSetRefs: ["CASE_150_SYMPTOMS_PERSISTENT"],
    severityClass: "residual_contributor",
    dependencyGroupRef: "DG_142_CARDIO_RESP_URGENT",
    logLikelihoodWeight: 0.37,
    criticalFeatureRefs: ["feature.moderate_persistent_symptoms"],
    missingnessMode: "ignore",
    contradictionMode: "latest_highest_assurance",
    calibrationStratumRef: "STRATUM_142_SYMPTOMS_V1",
    validityWindowRef: "VALIDITY_142_PHASE1_RULEBOOK_V1",
    scoreAxis: "residual",
    requestTypes: ["Symptoms"],
  },
  {
    ruleId: "RF142_RC_RESULTS_UNCLEAR_FOLLOW_UP",
    ruleVersion: "1.0.0",
    humanReadableName: "Results unclear follow-up",
    clinicalRationale:
      "Unclear results follow-up requests retain residual review posture even when no acute urgent outcome is triggered.",
    owningApproverRef: "CLINICAL_SAFETY_SEED_PANEL_PHASE1_V1",
    effectiveDate: "2026-04-14",
    fixtureSetRefs: ["CASE_150_RESULTS_UNCLEAR"],
    severityClass: "residual_contributor",
    dependencyGroupRef: "DG_142_RESULTS_MEDS_TIMING",
    logLikelihoodWeight: 0.34,
    criticalFeatureRefs: ["feature.results_unclear_follow_up"],
    missingnessMode: "ignore",
    contradictionMode: "latest_highest_assurance",
    calibrationStratumRef: "STRATUM_142_ADMIN_RESULTS_V1",
    validityWindowRef: "VALIDITY_142_PHASE1_RULEBOOK_V1",
    scoreAxis: "residual",
    requestTypes: ["Results"],
  },
  {
    ruleId: "RF142_RC_ADMIN_TIME_DEPENDENT_CLINICAL_FORM",
    ruleVersion: "1.0.0",
    humanReadableName: "Time-dependent clinical admin form",
    clinicalRationale:
      "Clinical admin pathways with explicit time dependence should not be screened clear without residual review.",
    owningApproverRef: "CLINICAL_SAFETY_SEED_PANEL_PHASE1_V1",
    effectiveDate: "2026-04-14",
    fixtureSetRefs: ["CASE_150_ADMIN_DEADLINE"],
    severityClass: "residual_contributor",
    dependencyGroupRef: "DG_142_RESULTS_MEDS_TIMING",
    logLikelihoodWeight: 0.28,
    criticalFeatureRefs: ["feature.admin_time_dependent_clinical_form"],
    missingnessMode: "ignore",
    contradictionMode: "latest_highest_assurance",
    calibrationStratumRef: "STRATUM_142_ADMIN_RESULTS_V1",
    validityWindowRef: "VALIDITY_142_PHASE1_RULEBOOK_V1",
    scoreAxis: "residual",
    requestTypes: ["Admin"],
  },
  {
    ruleId: "RF142_RCH_NO_SAFE_CALLBACK_WINDOW",
    ruleVersion: "1.0.0",
    humanReadableName: "No safe callback window",
    clinicalRationale:
      "Unsafe callback or authority posture must hold the case out of calm routine continuation until a safer route exists.",
    owningApproverRef: "CLINICAL_SAFETY_SEED_PANEL_PHASE1_V1",
    effectiveDate: "2026-04-14",
    fixtureSetRefs: ["CASE_150_CONTACT_TRUST_GAP"],
    severityClass: "reachability_contributor",
    dependencyGroupRef: "DG_142_REACHABILITY",
    logLikelihoodWeight: 0.41,
    criticalFeatureRefs: ["feature.no_safe_callback_window"],
    missingnessMode: "urgent_review",
    contradictionMode: "require_resolution",
    calibrationStratumRef: "STRATUM_142_GLOBAL_FALLBACK_V1",
    validityWindowRef: "VALIDITY_142_PHASE1_RULEBOOK_V1",
    scoreAxis: "both",
  },
] as const satisfies readonly Phase1SynchronousSafetyRuleDefinition[];

export const phase1SynchronousSafetyRulePackRegistry = [
  {
    schemaVersion: "PHASE1_SYNCHRONOUS_SAFETY_RULE_PACK_V1",
    rulePackId: "RFRP_142_PHASE1_SYNCHRONOUS_SAFETY_V1",
    rulePackVersion: "1.0.0",
    rulePackVersionRef: "RFRP_142_PHASE1_SYNCHRONOUS_SAFETY_V1@1.0.0",
    upstreamRulebookRef: "data/contracts/142_red_flag_decision_tables.yaml",
    authoredConfigReasonCodes: [
      "GAP_RESOLVED_PHASE1_SAFETY_WEIGHT_SEEDS_V1",
      "GAP_RESOLVED_PHASE1_SAFETY_IDENTITY_CALIBRATOR_V1",
    ],
    calibratorVersionRef: "SCAL_150_IDENTITY_CALIBRATOR_V1",
    thresholdUrgent: 0.083333,
    thresholdResidual: 0.285714,
    contradictionThreshold: 0.55,
    missingnessThreshold: 0.6,
    betaUrgent: -2.75,
    betaResidual: -1.25,
    betaConflictUrgent: 0.6,
    betaConflictResidual: 1.35,
    betaMissingUrgent: 0.9,
    betaMissingResidual: 1.45,
    dependencyGroups: [
      {
        dependencyGroupRef: "DG_142_CARDIO_RESP_URGENT",
        urgentCap: 3.4,
        residualCap: 1.2,
      },
      {
        dependencyGroupRef: "DG_142_NEURO_COLLAPSE_URGENT",
        urgentCap: 3.2,
        residualCap: 1,
      },
      {
        dependencyGroupRef: "DG_142_ALLERGY_MEDS_URGENT",
        urgentCap: 3,
        residualCap: 1,
      },
      {
        dependencyGroupRef: "DG_142_RESULTS_MEDS_TIMING",
        urgentCap: 2.1,
        residualCap: 1.8,
      },
      {
        dependencyGroupRef: "DG_142_REACHABILITY",
        urgentCap: 1.4,
        residualCap: 1.3,
      },
    ],
    rules: [...hardStopRules, ...softRules],
  },
] as const satisfies readonly Phase1SynchronousSafetyRulePack[];

export class StaticSynchronousSafetyRulePackLoader implements SynchronousSafetyRulePackLoader {
  loadRulePack(preferredRulePackVersionRef?: string | null): Phase1SynchronousSafetyRulePack {
    const preferred = preferredRulePackVersionRef?.trim() ?? null;
    if (preferred) {
      const resolved = phase1SynchronousSafetyRulePackRegistry.find(
        (candidate) =>
          candidate.rulePackVersionRef === preferred || candidate.rulePackId === preferred,
      );
      invariant(
        !!resolved,
        "SYNC_SAFETY_RULE_PACK_NOT_FOUND",
        `Unsupported synchronous safety rule pack ${preferred}.`,
      );
      return resolved;
    }

    const resolved = phase1SynchronousSafetyRulePackRegistry[0];
    invariant(
      !!resolved,
      "SYNC_SAFETY_RULE_PACK_NOT_FOUND",
      "No default synchronous safety rule pack is registered.",
    );
    return resolved;
  }
}

export class IdentitySynchronousSafetyCalibrator implements SynchronousSafetyCalibrator {
  readonly calibratorVersionRef = "SCAL_150_IDENTITY_CALIBRATOR_V1";

  calibrate(input: SynchronousSafetyProbabilityInput): number {
    invariant(
      input.rawProbability >= 0 && input.rawProbability <= 1,
      "INVALID_SYNC_SAFETY_PROBABILITY",
      "rawProbability must be between 0 and 1 inclusive.",
    );
    return roundMetric(input.rawProbability);
  }
}

export class StaticSynchronousSafetyCalibratorResolver
  implements SynchronousSafetyCalibratorResolver
{
  private readonly identity = new IdentitySynchronousSafetyCalibrator();

  resolveCalibrator(requestedCalibratorVersionRef?: string | null): SynchronousSafetyCalibrator {
    const requested = requestedCalibratorVersionRef?.trim() ?? null;
    invariant(
      !requested || requested === this.identity.calibratorVersionRef,
      "SYNC_SAFETY_CALIBRATOR_NOT_FOUND",
      `Unsupported synchronous safety calibrator ${requested}.`,
    );
    return this.identity;
  }
}

function buildNarrativeText(input: SynchronousSafetyEvidenceCut): string {
  return normalizeText(
    [input.authoredNarrativeText ?? "", ...input.summaryFragments].filter(Boolean).join(" "),
  );
}

function resolveOnsetRecency(
  answers: Record<string, unknown>,
  frozenAt: string,
): { recent: boolean; persistent: boolean; unresolved: boolean } {
  const onsetPrecision = asString(answers["symptoms.onsetPrecision"]);
  const onsetWindow = asString(answers["symptoms.onsetWindow"]);
  const onsetDate = asString(answers["symptoms.onsetDate"]);

  if (!onsetPrecision) {
    return { recent: false, persistent: false, unresolved: true };
  }

  if (onsetPrecision === "approximate_window") {
    if (!onsetWindow || onsetWindow === "not_sure") {
      return { recent: false, persistent: false, unresolved: true };
    }
    return {
      recent: onsetWindow === "today" || onsetWindow === "last_2_days",
      persistent: onsetWindow === "more_than_week",
      unresolved: false,
    };
  }

  if (onsetPrecision === "exact_date") {
    if (!onsetDate) {
      return { recent: false, persistent: false, unresolved: true };
    }
    const deltaMs = Date.parse(frozenAt) - Date.parse(onsetDate);
    if (Number.isNaN(deltaMs)) {
      return { recent: false, persistent: false, unresolved: true };
    }
    const deltaDays = deltaMs / 86_400_000;
    return {
      recent: deltaDays <= 2,
      persistent: deltaDays > 7,
      unresolved: false,
    };
  }

  return { recent: false, persistent: false, unresolved: onsetPrecision === "unknown" };
}

export function derivePhase1SynchronousSafetyFeatures(
  input: SynchronousSafetyEvidenceCut,
): SynchronousSafetyDerivedFeatures {
  const answers = input.activeStructuredAnswers;
  const requestShape = input.requestShape;
  const narrative = buildNarrativeText(input);
  const severityClues = asStringArray(answers["symptoms.severityClues"]);
  const symptomsCategory =
    asString(answers["symptoms.category"]) ??
    asString(getNestedValue(requestShape, "symptoms.symptomCategoryCode"));
  const chestPainLocation = asString(answers["symptoms.chestPainLocation"]);
  const worseningNow =
    asBoolean(answers["symptoms.worseningNow"]) ??
    asBoolean(getNestedValue(requestShape, "symptoms.worseningNow"));
  const medsUrgency =
    asString(answers["meds.urgency"]) ?? asString(getNestedValue(requestShape, "meds.urgencyCode"));
  const medsQueryType =
    asString(answers["meds.queryType"]) ??
    asString(getNestedValue(requestShape, "meds.queryTypeCode"));
  const resultsQuestion =
    asString(answers["results.question"]) ??
    asString(getNestedValue(requestShape, "results.questionText"));
  const adminSupportType =
    asString(answers["admin.supportType"]) ??
    asString(getNestedValue(requestShape, "admin.supportTypeCode"));
  const adminDeadlineKnown =
    asString(answers["admin.deadlineKnown"]) ??
    asString(getNestedValue(requestShape, "admin.deadlineKnown"));
  const resultsContext =
    asString(answers["results.context"]) ??
    asString(getNestedValue(requestShape, "results.contextCode"));
  const resultsDateKnown = asString(answers["results.dateKnown"]);
  const onset = resolveOnsetRecency(answers, input.frozenAt);

  const chestOrBreathingKeywords = [
    "chest pain",
    "tight chest",
    "shortness of breath",
    "breathing trouble",
    "cannot catch my breath",
    "struggling to breathe",
  ] as const;
  const collapseKeywords = [
    "stroke",
    "collapse",
    "collapsed",
    "seizure",
    "fit",
    "fainted",
    "passed out",
    "one sided weakness",
    "slurred speech",
  ] as const;
  const medReactionKeywords = [
    "anaphylaxis",
    "swollen tongue",
    "swelling in my throat",
    "allergic reaction",
    "severe rash",
    "difficulty breathing after",
  ] as const;
  const bleedingKeywords = [
    "heavy bleeding",
    "bleeding heavily",
    "pregnant and bleeding",
    "pregnancy bleeding",
    "miscarriage",
    "ectopic",
  ] as const;
  const safeguardingKeywords = [
    "self harm",
    "self-harm",
    "suicidal",
    "suicide",
    "abuse",
    "unsafe at home",
    "safeguarding",
  ] as const;
  const resultRiskKeywords = [
    "abnormal",
    "high result",
    "serious result",
    "urgent result",
    "worse",
    "pain",
    "breath",
  ] as const;
  const medInterruptionKeywords = [
    "ran out",
    "out of medication",
    "missed dose",
    "withdrawal",
    "stopped taking",
  ] as const;

  const clinicalKeywordHits = uniqueSorted([
    ...(textIncludesAny(narrative, chestOrBreathingKeywords) ? ["chest_or_breathing"] : []),
    ...(textIncludesAny(narrative, collapseKeywords) ? ["collapse"] : []),
    ...(textIncludesAny(narrative, medReactionKeywords) ? ["med_reaction"] : []),
    ...(textIncludesAny(narrative, bleedingKeywords) ? ["bleeding"] : []),
    ...(textIncludesAny(narrative, safeguardingKeywords) ? ["safeguarding"] : []),
  ]);

  const featureStates: Record<string, FeatureState> = {
    "feature.chest_breathing_red_flag":
      input.requestTypeRef === "Symptoms" &&
      (symptomsCategory === "chest_breathing" ||
        chestPainLocation === "centre_chest" ||
        chestPainLocation === "left_side" ||
        textIncludesAny(narrative, chestOrBreathingKeywords))
        ? "present"
        : input.requestTypeRef === "Symptoms" &&
            !symptomsCategory &&
            textIncludesAny(narrative, chestOrBreathingKeywords)
          ? "unresolved"
          : "absent",
    "feature.stroke_collapse_signal": textIncludesAny(narrative, collapseKeywords)
      ? "present"
      : "absent",
    "feature.severe_medication_reaction_signal":
      input.requestTypeRef === "Meds" && textIncludesAny(narrative, medReactionKeywords)
        ? "present"
        : input.requestTypeRef === "Meds" && !asString(answers["meds.issueDescription"])
          ? "unresolved"
          : "absent",
    "feature.heavy_bleeding_or_pregnancy_signal": textIncludesAny(narrative, bleedingKeywords)
      ? "present"
      : "absent",
    "feature.self_harm_or_safeguarding_signal": textIncludesAny(narrative, safeguardingKeywords)
      ? "present"
      : "absent",
    "feature.severe_pain_escalation":
      symptomsCategory === "pain" ||
      ((symptomsCategory === "chest_breathing" || chestPainLocation !== null) &&
        (severityClues.includes("mobility_affected") ||
          severityClues.includes("sleep_affected") ||
          severityClues.includes("sudden_change")))
        ? "present"
        : "absent",
    "feature.rapid_worsening_recent_onset":
      worseningNow === true && onset.recent
        ? "present"
        : worseningNow === null || onset.unresolved
          ? "unresolved"
          : "absent",
    "feature.high_risk_result_with_current_symptoms":
      input.requestTypeRef === "Results" &&
      (textIncludesAny(narrative, resultRiskKeywords) ||
        textIncludesAny(normalizeText(resultsQuestion), resultRiskKeywords))
        ? "present"
        : input.requestTypeRef === "Results" && !resultsContext
          ? "unresolved"
          : "absent",
    "feature.high_risk_medication_interruption":
      input.requestTypeRef === "Meds" &&
      (medsUrgency === "urgent_today" ||
        textIncludesAny(narrative, medInterruptionKeywords) ||
        (medsQueryType === "repeat_supply" && medsUrgency === "soon"))
        ? "present"
        : input.requestTypeRef === "Meds" && !medsUrgency
          ? "unresolved"
          : "absent",
    "feature.moderate_persistent_symptoms":
      input.requestTypeRef === "Symptoms" &&
      onset.persistent &&
      (severityClues.includes("sleep_affected") ||
        severityClues.includes("work_or_school_affected"))
        ? "present"
        : input.requestTypeRef === "Symptoms" && onset.unresolved
          ? "unresolved"
          : "absent",
    "feature.results_unclear_follow_up":
      input.requestTypeRef === "Results" &&
      (textIncludesAny(normalizeText(resultsQuestion), [
        "what does it mean",
        "what next",
        "follow up",
        "abnormal",
      ]) ||
        resultsDateKnown === "unknown")
        ? "present"
        : input.requestTypeRef === "Results" && !resultsContext
          ? "unresolved"
          : "absent",
    "feature.admin_time_dependent_clinical_form":
      input.requestTypeRef === "Admin" &&
      (adminSupportType === "fit_note" || adminSupportType === "form_or_letter") &&
      adminDeadlineKnown === "deadline_known"
        ? "present"
        : input.requestTypeRef === "Admin" && !adminSupportType
          ? "unresolved"
          : "absent",
    "feature.no_safe_callback_window":
      input.contactAuthorityState === "blocked" ||
      input.contactAuthorityState === "rebind_required" ||
      input.channelCapabilityCeiling.mutatingResumeState !== "allowed"
        ? "present"
        : !input.contactPreferencesRef
          ? "unresolved"
          : "absent",
  };

  const contradictionRefs = uniqueSorted([
    ...(input.requestTypeRef !== "Symptoms" &&
    textIncludesAny(narrative, [...chestOrBreathingKeywords, ...collapseKeywords])
      ? ["CONTRADICTION_NON_SYMPTOM_URGENT_NARRATIVE"]
      : []),
    ...(symptomsCategory === "general" &&
    textIncludesAny(narrative, [...chestOrBreathingKeywords, ...collapseKeywords])
      ? ["CONTRADICTION_GENERAL_CATEGORY_WITH_URGENT_NARRATIVE"]
      : []),
    ...(input.requestTypeRef === "Admin" &&
    textIncludesAny(narrative, [...medReactionKeywords, ...bleedingKeywords])
      ? ["CONTRADICTION_ADMIN_WITH_ACUTE_CLINICAL_NARRATIVE"]
      : []),
  ]);

  const requiredFeatureRefs = uniqueSorted(
    [
      "field.requestTypeRef",
      "field.requestShape",
      "field.contactAuthorityState",
      ...(input.requestTypeRef === "Symptoms"
        ? ["field.symptoms.category", "field.symptoms.onsetPrecision"]
        : input.requestTypeRef === "Meds"
          ? ["field.meds.queryType", "field.meds.urgency"]
          : input.requestTypeRef === "Admin"
            ? ["field.admin.supportType"]
            : ["field.results.context"]),
    ].filter(Boolean),
  );

  const criticalMissingFeatureRefs = uniqueSorted([
    ...(input.requestTypeRef ? [] : ["field.requestTypeRef"]),
    ...(Object.keys(requestShape).length > 0 ? [] : ["field.requestShape"]),
    ...(input.contactAuthorityState ? [] : ["field.contactAuthorityState"]),
    ...(input.requestTypeRef === "Symptoms" && !symptomsCategory
      ? ["field.symptoms.category"]
      : []),
    ...(input.requestTypeRef === "Symptoms" && !asString(answers["symptoms.onsetPrecision"])
      ? ["field.symptoms.onsetPrecision"]
      : []),
    ...(input.requestTypeRef === "Meds" && !medsQueryType ? ["field.meds.queryType"] : []),
    ...(input.requestTypeRef === "Meds" && !medsUrgency ? ["field.meds.urgency"] : []),
    ...(input.requestTypeRef === "Admin" && !adminSupportType ? ["field.admin.supportType"] : []),
    ...(input.requestTypeRef === "Results" && !resultsContext ? ["field.results.context"] : []),
  ]);

  const contradictionRatio =
    contradictionRefs.length === 0
      ? 0
      : contradictionRefs.length / Math.max(2, contradictionRefs.length);
  const missingnessRatio =
    requiredFeatureRefs.length === 0
      ? 0
      : criticalMissingFeatureRefs.length / requiredFeatureRefs.length;

  const activeReachabilityDependencyRefs = uniqueSorted([
    ...(featureStates["feature.no_safe_callback_window"] === "present"
      ? ["DEP_150_NO_SAFE_CALLBACK_WINDOW"]
      : []),
    ...(input.contactAuthorityState === "blocked"
      ? ["DEP_150_CONTACT_AUTHORITY_BLOCKED"]
      : input.contactAuthorityState === "rebind_required"
        ? ["DEP_150_CONTACT_AUTHORITY_REBIND_REQUIRED"]
        : []),
    ...(input.channelCapabilityCeiling.mutatingResumeState !== "allowed"
      ? ["DEP_150_MUTATING_RESUME_NOT_ALLOWED"]
      : []),
  ]);

  const reasonCodes = uniqueSorted([
    ...(input.evidenceReadinessState === "manual_review_only"
      ? ["PHASE1_SYNC_SAFETY_EVIDENCE_READINESS_UNTRUSTED"]
      : []),
    ...(activeReachabilityDependencyRefs.length > 0
      ? ["PHASE1_SYNC_SAFETY_CONTACT_TRUST_UNSAFE"]
      : []),
  ]);

  return {
    featureStates,
    contradictionRatio: roundMetric(contradictionRatio),
    contradictionRefs,
    missingnessRatio: roundMetric(missingnessRatio),
    criticalMissingFeatureRefs,
    activeReachabilityDependencyRefs,
    clinicalKeywordHits,
    reasonCodes,
  };
}

function selectRulesForRequestType(
  rulePack: Phase1SynchronousSafetyRulePack,
  requestTypeRef: SynchronousSafetyEvidenceCut["requestTypeRef"],
): readonly Phase1SynchronousSafetyRuleDefinition[] {
  return rulePack.rules.filter(
    (rule) => !rule.requestTypes || rule.requestTypes.includes(requestTypeRef),
  );
}

function deriveEvidenceClass(
  input: SynchronousSafetyEvidenceCut,
  derived: SynchronousSafetyDerivedFeatures,
): {
  dominantEvidenceClass: EvidenceClass;
  classificationBasis: ClassificationBasis;
  confidenceBand: ConfidenceBand;
  misclassificationRiskState: MisclassificationRiskState;
} {
  const hasClinicalSignals =
    derived.clinicalKeywordHits.length > 0 ||
    Object.entries(derived.featureStates).some(
      ([featureRef, state]) =>
        featureRef !== "feature.no_safe_callback_window" && state === "present",
    );
  const failClosed =
    input.evidenceReadinessState === "manual_review_only" ||
    input.contactAuthorityState === "blocked" ||
    derived.missingnessRatio >= 0.6;
  const urgentHold =
    derived.featureStates["feature.chest_breathing_red_flag"] === "present" ||
    derived.featureStates["feature.stroke_collapse_signal"] === "present" ||
    derived.featureStates["feature.severe_medication_reaction_signal"] === "present" ||
    derived.featureStates["feature.self_harm_or_safeguarding_signal"] === "present";

  return {
    dominantEvidenceClass:
      derived.activeReachabilityDependencyRefs.length > 0 && !hasClinicalSignals
        ? "contact_safety_relevant"
        : input.requestTypeRef === "Admin" && !hasClinicalSignals
          ? "operationally_material_nonclinical"
          : "potentially_clinical",
    classificationBasis: failClosed
      ? "manual_review"
      : derived.activeReachabilityDependencyRefs.length > 0
        ? "route_dependency"
        : "content_signal",
    confidenceBand: failClosed || derived.missingnessRatio > 0.3 ? "low" : "high",
    misclassificationRiskState: failClosed
      ? "fail_closed_review"
      : urgentHold
        ? "urgent_hold"
        : "ordinary",
  };
}

function sumCappedScores(
  rulePack: Phase1SynchronousSafetyRulePack,
  rules: readonly Phase1SynchronousSafetyRuleDefinition[],
  firedRuleIds: ReadonlySet<string>,
): { urgentContribution: number; residualContribution: number } {
  const grouped = new Map<string, { urgent: number; residual: number }>();
  for (const rule of rules) {
    if (!firedRuleIds.has(rule.ruleId)) {
      continue;
    }
    const current = grouped.get(rule.dependencyGroupRef) ?? { urgent: 0, residual: 0 };
    if (rule.scoreAxis === "urgent" || rule.scoreAxis === "both") {
      current.urgent += rule.logLikelihoodWeight;
    }
    if (rule.scoreAxis === "residual" || rule.scoreAxis === "both") {
      current.residual += rule.logLikelihoodWeight;
    }
    grouped.set(rule.dependencyGroupRef, current);
  }
  let urgentContribution = 0;
  let residualContribution = 0;
  for (const group of rulePack.dependencyGroups) {
    const resolved = grouped.get(group.dependencyGroupRef);
    if (!resolved) {
      continue;
    }
    urgentContribution += Math.min(group.urgentCap, resolved.urgent);
    residualContribution += Math.min(group.residualCap, resolved.residual);
  }
  return {
    urgentContribution: roundMetric(urgentContribution),
    residualContribution: roundMetric(residualContribution),
  };
}

function buildDeterministicRecordId(
  prefix: string,
  requestId: string,
  snapshotRef: string,
  epoch: number,
  tupleHash?: string | null,
): string {
  return `${prefix}_${sha256Hex({
    requestId,
    snapshotRef,
    epoch,
    tupleHash: tupleHash ?? null,
  }).slice(0, 20)}`;
}

export class SynchronousSafetyEngine {
  constructor(
    private readonly repositories: AssimilationSafetyDependencies,
    private readonly rulePackLoader: SynchronousSafetyRulePackLoader = new StaticSynchronousSafetyRulePackLoader(),
    private readonly calibratorResolver: SynchronousSafetyCalibratorResolver = new StaticSynchronousSafetyCalibratorResolver(),
    private readonly idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator(
      "synchronous_safety",
    ),
  ) {}

  async evaluateFrozenSubmission(
    input: EvaluateSynchronousSafetyInput,
  ): Promise<SynchronousSafetyEvaluationResult> {
    const requestId = requireRef(input.requestId, "requestId");
    const episodeId = requireRef(input.episodeId, "episodeId");
    const decidedAt = ensureIsoTimestamp(input.decidedAt, "decidedAt");
    ensureIsoTimestamp(input.evidenceCut.frozenAt, "frozenAt");
    const rulePack = this.rulePackLoader.loadRulePack(input.preferredRulePackVersionRef);
    const calibrator = this.calibratorResolver.resolveCalibrator(
      input.preferredCalibratorVersionRef ?? rulePack.calibratorVersionRef,
    );
    const derived = derivePhase1SynchronousSafetyFeatures(input.evidenceCut);
    const evidenceClass = deriveEvidenceClass(input.evidenceCut, derived);
    const activeRules = selectRulesForRequestType(rulePack, input.evidenceCut.requestTypeRef);

    const hardStopRuleRefs = activeRules
      .filter((rule) => rule.severityClass === "hard_stop")
      .filter((rule) =>
        rule.criticalFeatureRefs.some((featureRef) => {
          const state = derived.featureStates[featureRef];
          return (
            state === "present" ||
            (state === "unresolved" && rule.missingnessMode === "conservative_hold")
          );
        }),
      )
      .map((rule) => rule.ruleId)
      .sort();

    const firedRuleIds = new Set<string>(hardStopRuleRefs);
    for (const rule of activeRules) {
      if (rule.severityClass === "hard_stop") {
        continue;
      }
      const hit = rule.criticalFeatureRefs.some(
        (featureRef) => derived.featureStates[featureRef] === "present",
      );
      if (
        hit ||
        (rule.missingnessMode === "urgent_review" &&
          rule.criticalFeatureRefs.some(
            (featureRef) => derived.featureStates[featureRef] === "unresolved",
          ))
      ) {
        firedRuleIds.add(rule.ruleId);
      }
    }

    const urgentContributorRuleRefs = activeRules
      .filter(
        (rule) =>
          firedRuleIds.has(rule.ruleId) &&
          (rule.severityClass === "urgent_contributor" ||
            rule.severityClass === "reachability_contributor") &&
          (rule.scoreAxis === "urgent" || rule.scoreAxis === "both"),
      )
      .map((rule) => rule.ruleId)
      .sort();
    const residualContributorRuleRefs = activeRules
      .filter(
        (rule) =>
          firedRuleIds.has(rule.ruleId) &&
          (rule.severityClass === "residual_contributor" ||
            rule.severityClass === "reachability_contributor") &&
          (rule.scoreAxis === "residual" || rule.scoreAxis === "both"),
      )
      .map((rule) => rule.ruleId)
      .sort();
    const reachabilityContributorRuleRefs = activeRules
      .filter(
        (rule) =>
          firedRuleIds.has(rule.ruleId) && rule.severityClass === "reachability_contributor",
      )
      .map((rule) => rule.ruleId)
      .sort();

    const contributions = sumCappedScores(rulePack, activeRules, firedRuleIds);
    const rawUrgentProbability = sigmoid(
      rulePack.betaUrgent +
        contributions.urgentContribution +
        rulePack.betaConflictUrgent * derived.contradictionRatio +
        rulePack.betaMissingUrgent * derived.missingnessRatio,
    );
    const rawResidualProbability = sigmoid(
      rulePack.betaResidual +
        contributions.residualContribution +
        rulePack.betaConflictResidual * derived.contradictionRatio +
        rulePack.betaMissingResidual * derived.missingnessRatio,
    );
    const urgentProbability = calibrator.calibrate({
      requestTypeRef: input.evidenceCut.requestTypeRef,
      axis: "urgent",
      rawProbability: rawUrgentProbability,
    });
    const residualProbability = calibrator.calibrate({
      requestTypeRef: input.evidenceCut.requestTypeRef,
      axis: "residual",
      rawProbability: rawResidualProbability,
    });

    const conflictVectorRef =
      derived.contradictionRefs.length > 0
        ? `conflict_${sha256Hex({
            requestId,
            contradictionRefs: derived.contradictionRefs,
          }).slice(0, 16)}`
        : null;
    const criticalMissingnessRef =
      derived.criticalMissingFeatureRefs.length > 0
        ? `missing_${sha256Hex({
            requestId,
            missingRefs: derived.criticalMissingFeatureRefs,
          }).slice(0, 16)}`
        : null;

    const failClosed =
      evidenceClass.misclassificationRiskState === "fail_closed_review" ||
      input.evidenceCut.evidenceReadinessState === "urgent_live_only" ||
      input.evidenceCut.contactAuthorityState === "blocked" ||
      input.evidenceCut.channelCapabilityCeiling.mutatingResumeState === "blocked";

    let decisionOutcome: SafetyDecisionOutcome;
    let requestedSafetyState: RequestedSafetyState;
    if (hardStopRuleRefs.length > 0) {
      decisionOutcome = "urgent_required";
      requestedSafetyState = "urgent_diversion_required";
    } else if (failClosed) {
      decisionOutcome = "fallback_manual_review";
      requestedSafetyState = "residual_risk_flagged";
    } else if (urgentProbability >= rulePack.thresholdUrgent) {
      decisionOutcome = "urgent_required";
      requestedSafetyState = "urgent_diversion_required";
    } else if (
      residualContributorRuleRefs.length > 0 ||
      residualProbability >= rulePack.thresholdResidual ||
      derived.contradictionRatio >= rulePack.contradictionThreshold ||
      derived.missingnessRatio >= rulePack.missingnessThreshold
    ) {
      decisionOutcome = "residual_review";
      requestedSafetyState = "residual_risk_flagged";
    } else {
      decisionOutcome = "clear_routine";
      requestedSafetyState = "screen_clear";
    }

    const reasonCodes = uniqueSorted([
      ...rulePack.authoredConfigReasonCodes,
      "PHASE1_SYNC_SAFETY_CLASSIFIER_CONTENT_SIGNAL_V1",
      ...derived.reasonCodes,
      ...(hardStopRuleRefs.length > 0 ? ["PHASE1_SYNC_SAFETY_HARD_STOP_DOMINANT"] : []),
      ...(decisionOutcome === "urgent_required"
        ? ["PHASE1_SYNC_SAFETY_URGENT_REQUIRED"]
        : decisionOutcome === "residual_review"
          ? ["PHASE1_SYNC_SAFETY_RESIDUAL_RISK"]
          : decisionOutcome === "fallback_manual_review"
            ? ["PHASE1_SYNC_SAFETY_FAIL_CLOSED_MANUAL_REVIEW"]
            : ["PHASE1_SYNC_SAFETY_SCREEN_CLEAR"]),
    ]);

    const decisionTupleHash = sha256Hex({
      requestId,
      submissionSnapshotFreezeRef: input.evidenceCut.submissionSnapshotFreezeRef,
      evidenceSnapshotRef: input.evidenceCut.evidenceSnapshotRef,
      rulePackVersionRef: rulePack.rulePackVersionRef,
      calibratorVersionRef: calibrator.calibratorVersionRef,
      hardStopRuleRefs,
      urgentContributorRuleRefs,
      residualContributorRuleRefs,
      reachabilityContributorRuleRefs,
      urgentProbability,
      residualProbability,
      contradictionRatio: derived.contradictionRatio,
      missingnessRatio: derived.missingnessRatio,
      requestedSafetyState,
      decisionOutcome,
    });

    const diagnostics: SynchronousSafetyDiagnostics = {
      rulePackVersionRef: rulePack.rulePackVersionRef,
      calibratorVersionRef: calibrator.calibratorVersionRef,
      hardStopRuleRefs,
      urgentContributorRuleRefs,
      residualContributorRuleRefs,
      reachabilityContributorRuleRefs,
      urgentProbability,
      residualProbability,
      contradictionRatio: derived.contradictionRatio,
      missingnessRatio: derived.missingnessRatio,
      conflictVectorRef,
      criticalMissingnessRef,
      activeReachabilityDependencyRefs: derived.activeReachabilityDependencyRefs,
      firedRuleRefs: [...firedRuleIds].sort(),
      featureStates: derived.featureStates,
      reasonCodes,
    };

    const previousDecisions = await this.repositories.listSafetyDecisionRecordsByRequest(requestId);
    const replayDecision =
      previousDecisions
        .filter(
          (candidate) =>
            candidate.compositeSnapshotRef === input.evidenceCut.evidenceSnapshotRef &&
            candidate.rulePackVersionRef === rulePack.rulePackVersionRef &&
            candidate.calibratorVersionRef === calibrator.calibratorVersionRef &&
            candidate.decisionTupleHash === decisionTupleHash,
        )
        .at(-1) ?? null;
    if (replayDecision) {
      const existingClassification = await this.repositories.getEvidenceClassificationDecision(
        replayDecision.classificationDecisionRef,
      );
      const existingPreemption = await this.repositories.getSafetyPreemptionRecord(
        replayDecision.preemptionRef,
      );
      invariant(
        !!existingClassification && !!existingPreemption,
        "SYNC_SAFETY_REPLAY_CHAIN_INCOMPLETE",
        "Existing synchronous safety replay is missing classification or preemption records.",
      );
      return {
        replayed: true,
        classification: existingClassification,
        preemption: existingPreemption,
        safetyDecision: replayDecision,
        derivedFeatures: derived,
        diagnostics,
      };
    }

    const previousDecision = previousDecisions.at(-1) ?? null;
    const previousClassifications =
      await this.repositories.listEvidenceClassificationDecisionsByRequest(requestId);
    const previousClassification = previousClassifications.at(-1) ?? null;
    const openingSafetyEpoch =
      input.currentSafetyDecisionEpoch ?? previousDecision?.resultingSafetyEpoch ?? 0;
    const nextSafetyEpoch = openingSafetyEpoch + 1;

    const classificationDecisionId = buildDeterministicRecordId(
      "sync_classification",
      requestId,
      input.evidenceCut.submissionSnapshotFreezeRef,
      nextSafetyEpoch,
      rulePack.rulePackVersionRef,
    );
    const preemptionId = buildDeterministicRecordId(
      "sync_preemption",
      requestId,
      input.evidenceCut.submissionSnapshotFreezeRef,
      nextSafetyEpoch,
    );
    const safetyDecisionId = buildDeterministicRecordId(
      "sync_decision",
      requestId,
      input.evidenceCut.submissionSnapshotFreezeRef,
      nextSafetyEpoch,
      decisionTupleHash,
    );

    const existingDecision = await this.repositories.getSafetyDecisionRecord(safetyDecisionId);
    if (existingDecision) {
      const existingClassification =
        await this.repositories.getEvidenceClassificationDecision(classificationDecisionId);
      const existingPreemption = await this.repositories.getSafetyPreemptionRecord(preemptionId);
      invariant(
        !!existingClassification && !!existingPreemption,
        "SYNC_SAFETY_REPLAY_CHAIN_INCOMPLETE",
        "Existing synchronous safety replay is missing classification or preemption records.",
      );
      return {
        replayed: true,
        classification: existingClassification,
        preemption: existingPreemption,
        safetyDecision: existingDecision,
        derivedFeatures: derived,
        diagnostics,
      };
    }

    const screeningRef = `phase1_sync_safety_screen::${input.evidenceCut.submissionSnapshotFreezeRef}`;
    const materialityRef = `phase1_sync_safety_materiality::${input.evidenceCut.submissionSnapshotFreezeRef}`;

    const classification = EvidenceClassificationDecisionDocument.create({
      classificationDecisionId,
      requestId,
      triggeringSnapshotRef: input.evidenceCut.evidenceSnapshotRef,
      evidenceAssimilationRef: screeningRef,
      sourceDomain: "patient_reply",
      governingObjectRef: input.evidenceCut.submissionSnapshotFreezeRef,
      classifiedEvidenceRefs: uniqueSorted([
        input.evidenceCut.evidenceSnapshotRef,
        input.evidenceCut.normalizedSubmissionRef,
        ...input.evidenceCut.attachmentRefs,
      ]),
      classifierVersionRef: "PHASE1_SYNC_SAFETY_CLASSIFIER_V1",
      dominantEvidenceClass: evidenceClass.dominantEvidenceClass,
      classificationBasis: evidenceClass.classificationBasis,
      triggerReasonCodes: reasonCodes,
      activeDependencyRefs: derived.activeReachabilityDependencyRefs,
      confidenceBand: evidenceClass.confidenceBand,
      misclassificationRiskState: evidenceClass.misclassificationRiskState,
      decisionState: "applied",
      supersedesDecisionRef: previousClassification?.classificationDecisionId ?? null,
      decidedByRef: nextSafetyId(this.idGenerator, "sync_safety_classifier"),
      decidedAt,
    }).toSnapshot();
    await this.repositories.saveEvidenceClassificationDecision(
      EvidenceClassificationDecisionDocument.hydrate(classification).toPersistedRow(),
    );

    const preemptionStatus: PreemptionStatus =
      decisionOutcome === "fallback_manual_review"
        ? "blocked_manual_review"
        : decisionOutcome === "urgent_required"
          ? "escalated_urgent"
          : "cleared_routine";
    const fallbackState: PreemptionFallbackState =
      decisionOutcome === "fallback_manual_review" ? "manual_review_required" : "none";
    const preemptionPriority: PreemptionPriority =
      decisionOutcome === "urgent_required" ? "urgent_review" : "routine_review";
    const preemptionReasonCode =
      decisionOutcome === "urgent_required"
        ? "PHASE1_SYNC_SAFETY_URGENT_REQUIRED"
        : decisionOutcome === "fallback_manual_review"
          ? "PHASE1_SYNC_SAFETY_FAIL_CLOSED_MANUAL_REVIEW"
          : requestedSafetyState === "residual_risk_flagged"
            ? "PHASE1_SYNC_SAFETY_RESIDUAL_RISK"
            : "PHASE1_SYNC_SAFETY_SCREEN_CLEAR";

    const preemption = SafetyPreemptionRecordDocument.create({
      preemptionId,
      episodeId,
      requestId,
      triggeringSnapshotRef: input.evidenceCut.evidenceSnapshotRef,
      evidenceAssimilationRef: screeningRef,
      materialDeltaAssessmentRef: materialityRef,
      classificationDecisionRef: classification.classificationDecisionId,
      sourceDomain: "patient_reply",
      evidenceClass: classification.dominantEvidenceClass,
      openingSafetyEpoch: nextSafetyEpoch,
      blockingActionScopeRefs: ["phase1_intake_submit", "triage_task_create"],
      priority: preemptionPriority,
      reasonCode: preemptionReasonCode,
      fallbackState,
      status: preemptionStatus,
      createdAt: decidedAt,
      resolvedAt: preemptionStatus === "blocked_manual_review" ? null : decidedAt,
    }).toSnapshot();
    await this.repositories.saveSafetyPreemptionRecord(
      SafetyPreemptionRecordDocument.hydrate(preemption).toPersistedRow(),
    );

    const safetyDecision = SafetyDecisionRecordDocument.create({
      safetyDecisionId,
      requestId,
      preemptionRef: preemption.preemptionId,
      classificationDecisionRef: classification.classificationDecisionId,
      compositeSnapshotRef: input.evidenceCut.evidenceSnapshotRef,
      sourceDomain: "patient_reply",
      rulePackVersionRef: rulePack.rulePackVersionRef,
      calibratorVersionRef: calibrator.calibratorVersionRef,
      decisionTupleHash,
      hardStopRuleRefs,
      urgentContributorRuleRefs,
      residualContributorRuleRefs,
      activeReachabilityDependencyRefs: derived.activeReachabilityDependencyRefs,
      conflictVectorRef,
      criticalMissingnessRef,
      decisionOutcome,
      requestedSafetyState,
      decisionState: "settled",
      resultingSafetyEpoch: nextSafetyEpoch,
      supersedesSafetyDecisionRef: previousDecision?.safetyDecisionId ?? null,
      decidedAt,
      settledAt: decidedAt,
    }).toSnapshot();
    await this.repositories.saveSafetyDecisionRecord(
      SafetyDecisionRecordDocument.hydrate(safetyDecision).toPersistedRow(),
    );

    return {
      replayed: false,
      classification,
      preemption,
      safetyDecision,
      derivedFeatures: derived,
      diagnostics,
    };
  }
}

export interface SynchronousSafetyServices {
  synchronousSafety: SynchronousSafetyEngine;
}

export function createSynchronousSafetyServices(
  repositories: AssimilationSafetyDependencies = createAssimilationSafetyStore(
    createEvidenceBackboneStore(),
  ),
  options?: {
    idGenerator?: BackboneIdGenerator;
    rulePackLoader?: SynchronousSafetyRulePackLoader;
    calibratorResolver?: SynchronousSafetyCalibratorResolver;
  },
): SynchronousSafetyServices {
  return {
    synchronousSafety: new SynchronousSafetyEngine(
      repositories,
      options?.rulePackLoader,
      options?.calibratorResolver,
      options?.idGenerator,
    ),
  };
}

export type SynchronousSafetyDependencies = AssimilationSafetyDependencies;

export function createSynchronousSafetyStore(
  evidenceBackbone: EvidenceBackboneDependencies = createEvidenceBackboneStore(),
): SynchronousSafetyDependencies {
  return createAssimilationSafetyStore(evidenceBackbone);
}
