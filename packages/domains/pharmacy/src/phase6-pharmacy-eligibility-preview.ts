import type { AggregateRef } from "./phase6-pharmacy-case-kernel";
import type {
  EligibilityExplanationBundleSnapshot,
  PathwayEligibilityEvaluationSnapshot,
  PathwayEvaluationCandidateSnapshot,
  PharmacyEligibilityEvidenceSnapshot,
  PharmacyEligibilityFinalDisposition,
  PharmacyPatientMacroState,
  PharmacyPathwayGateResult,
  PharmacyRecommendedLane,
  PharmacySexAtBirth,
  ThresholdSnapshotEntry,
} from "./phase6-pharmacy-eligibility-engine";

const TASK_342 = "seq_342" as const;

type Task342 = typeof TASK_342;

export const PHARMACY_ELIGIBILITY_CLARITY_VISUAL_MODE = "Pharmacy_Eligibility_Clarity";

export type PharmacyEligibilityPublicationState = "current" | "superseded" | "stale";
export type PharmacyEligibilityGateState = "pass" | "fail" | "review" | "bypassed";

export interface PharmacyEligibilityGateViewModel {
  gateId: string;
  label: string;
  state: PharmacyEligibilityGateState;
  summary: string;
  detail: string;
  evidenceLabel: string;
}

export interface PharmacyEligibilityEvidenceSummaryRow {
  label: string;
  value: string;
  detail: string;
  patientSafe: boolean;
}

export interface PharmacyEligibilityPolicyPackMeta {
  rulePackId: string;
  versionLabel: string;
  effectiveFrom: string;
  revisionLabel: string;
  scopeLabel: string;
}

export interface PharmacyEligibilitySupersessionNotice {
  state: Exclude<PharmacyEligibilityPublicationState, "current">;
  title: string;
  summary: string;
  actionLabel: string;
}

export interface PharmacyEligibilityNextStepPanel {
  title: string;
  summary: string;
  primaryActionLabel: string;
  returnPathLabel: string;
  routeLabel: string;
}

export interface PharmacyEligibilityPreviewSnapshot {
  pharmacyCaseId: string;
  visualMode: typeof PHARMACY_ELIGIBILITY_CLARITY_VISUAL_MODE;
  finalDisposition: PharmacyEligibilityFinalDisposition;
  publicationState: PharmacyEligibilityPublicationState;
  decisionTupleHash: string;
  sharedEvidenceHash: string;
  summaryTitle: string;
  summary: string;
  patientSummaryTitle: string;
  patientSummary: string;
  patientNextStep: string;
  staffSummary: string;
  policyPack: PharmacyEligibilityPolicyPackMeta;
  gateLadder: readonly PharmacyEligibilityGateViewModel[];
  evidenceSummary: readonly PharmacyEligibilityEvidenceSummaryRow[];
  nextStepPanel: PharmacyEligibilityNextStepPanel;
  supersessionNotice: PharmacyEligibilitySupersessionNotice | null;
  explanationBundle: EligibilityExplanationBundleSnapshot;
  evaluation: PathwayEligibilityEvaluationSnapshot;
}

function makeRef<TTarget extends string>(
  targetFamily: TTarget,
  refId: string,
): AggregateRef<TTarget, Task342> {
  return {
    targetFamily,
    refId,
    ownerTask: TASK_342,
  };
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `phx_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function thresholdSnapshot(
  rows: ReadonlyArray<readonly [string, string]>,
): readonly ThresholdSnapshotEntry[] {
  return rows.map(([thresholdId, serializedValue]) => ({
    thresholdId: thresholdId as ThresholdSnapshotEntry["thresholdId"],
    serializedValue,
  }));
}

function candidate(input: {
  pathwayCode: PathwayEvaluationCandidateSnapshot["pathwayCode"];
  ageSexGatePass: boolean;
  requiredSymptomSupport: number;
  evidenceCompleteness: number;
  pathwayExclusionScore: number;
  globalExclusionScore: number;
  contradictionScore: number;
  eligibilityConfidence: number;
  hardFailReasonCodes: readonly string[];
}): PathwayEvaluationCandidateSnapshot {
  return { ...input };
}

function evidence(input: {
  patientAgeYears: number;
  sexAtBirth: PharmacySexAtBirth;
  symptomEvidence: PharmacyEligibilityEvidenceSnapshot["symptomEvidence"];
  ruleScores: PharmacyEligibilityEvidenceSnapshot["ruleScores"];
  minorIllnessFeatureScores: PharmacyEligibilityEvidenceSnapshot["minorIllnessFeatureScores"];
  evaluatedAt: string;
}): PharmacyEligibilityEvidenceSnapshot {
  return { ...input };
}

function buildPreview(input: {
  pharmacyCaseId: string;
  bundleId: string;
  evaluationId: string;
  rulePackId: string;
  rulePackVersion: string;
  rulePackEffectiveFrom: string;
  revisionLabel: string;
  scopeLabel: string;
  publicationState: PharmacyEligibilityPublicationState;
  pathwayCode: PathwayEligibilityEvaluationSnapshot["pathwayCode"];
  evaluatedPathways: readonly PathwayEvaluationCandidateSnapshot[];
  matchedRuleIds: readonly string[];
  thresholdRows: ReadonlyArray<readonly [string, string]>;
  ageSexGateResult: PathwayEligibilityEvaluationSnapshot["ageSexGateResult"];
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
  timingGuardrailId: string | null;
  fallbackScore: number | null;
  evidenceSnapshot: PharmacyEligibilityEvidenceSnapshot;
  patientSummaryTitle: string;
  patientSummary: string;
  patientNextStep: string;
  patientMacroState: PharmacyPatientMacroState;
  staffSummary: string;
  nextBestEndpointSuggestion: string;
  summaryTitle: string;
  summary: string;
  gateLadder: readonly PharmacyEligibilityGateViewModel[];
  evidenceSummary: readonly PharmacyEligibilityEvidenceSummaryRow[];
  nextStepPanel: PharmacyEligibilityNextStepPanel;
  supersessionNotice: PharmacyEligibilitySupersessionNotice | null;
  createdAt: string;
  generatedAt: string;
  version: number;
}): PharmacyEligibilityPreviewSnapshot {
  const sharedEvidenceHash = stableHash(
    JSON.stringify({
      pharmacyCaseId: input.pharmacyCaseId,
      evidenceSnapshot: input.evidenceSnapshot,
    }),
  );
  const decisionTupleHash = stableHash(
    [
      input.pharmacyCaseId,
      input.bundleId,
      input.evaluationId,
      input.rulePackVersion,
      input.finalDisposition,
      input.recommendedLane,
      sharedEvidenceHash,
    ].join("::"),
  );
  const thresholds = thresholdSnapshot(input.thresholdRows);
  const explanationBundle: EligibilityExplanationBundleSnapshot = {
    bundleId: input.bundleId,
    evaluationRef: makeRef("PathwayEligibilityEvaluation", input.evaluationId),
    patientFacingReason: {
      summaryText: input.patientSummary,
      nextStepText: input.patientNextStep,
      macroState: input.patientMacroState,
    },
    staffFacingReason: {
      summaryText: input.staffSummary,
      matchedRuleIds: input.matchedRuleIds,
      thresholdSnapshot: input.thresholdRows.map(
        ([thresholdId, serializedValue]) => `${thresholdId}=${serializedValue}`,
      ),
    },
    matchedRules: input.matchedRuleIds,
    nextBestEndpointSuggestion: input.nextBestEndpointSuggestion,
    sharedEvidenceHash,
    generatedAt: input.generatedAt,
    version: input.version,
  };
  const evaluation: PathwayEligibilityEvaluationSnapshot = {
    evaluationId: input.evaluationId,
    pharmacyCaseRef: makeRef("PharmacyCase", input.pharmacyCaseId),
    rulePackRef: makeRef("PharmacyRulePack", input.rulePackId),
    pathwayCode: input.pathwayCode,
    evaluatedPathways: input.evaluatedPathways,
    matchedRuleIds: input.matchedRuleIds,
    thresholdSnapshot: thresholds,
    rulePackVersion: input.rulePackVersion,
    ageSexGateResult: input.ageSexGateResult,
    pathwayGateResult: input.pathwayGateResult,
    exclusionMatches: input.exclusionMatches,
    pathwayExclusionScore: input.pathwayExclusionScore,
    globalExclusionScore: input.globalExclusionScore,
    requiredSymptomSupport: input.requiredSymptomSupport,
    evidenceCompleteness: input.evidenceCompleteness,
    contradictionScore: input.contradictionScore,
    eligibilityConfidence: input.eligibilityConfidence,
    recommendedLane: input.recommendedLane,
    finalDisposition: input.finalDisposition,
    unsafeFallbackReasonCode: input.unsafeFallbackReasonCode,
    explanationBundleRef: makeRef("EligibilityExplanationBundle", input.bundleId),
    timingGuardrailRef: input.timingGuardrailId
      ? makeRef("PathwayTimingGuardrail", input.timingGuardrailId)
      : null,
    fallbackScore: input.fallbackScore,
    sharedEvidenceHash,
    evidenceSnapshot: input.evidenceSnapshot,
    createdAt: input.createdAt,
    version: input.version,
  };

  return {
    pharmacyCaseId: input.pharmacyCaseId,
    visualMode: PHARMACY_ELIGIBILITY_CLARITY_VISUAL_MODE,
    finalDisposition: input.finalDisposition,
    publicationState: input.publicationState,
    decisionTupleHash,
    sharedEvidenceHash,
    summaryTitle: input.summaryTitle,
    summary: input.summary,
    patientSummaryTitle: input.patientSummaryTitle,
    patientSummary: input.patientSummary,
    patientNextStep: input.patientNextStep,
    staffSummary: input.staffSummary,
    policyPack: {
      rulePackId: input.rulePackId,
      versionLabel: input.rulePackVersion,
      effectiveFrom: input.rulePackEffectiveFrom,
      revisionLabel: input.revisionLabel,
      scopeLabel: input.scopeLabel,
    },
    gateLadder: input.gateLadder,
    evidenceSummary: input.evidenceSummary,
    nextStepPanel: input.nextStepPanel,
    supersessionNotice: input.supersessionNotice,
    explanationBundle,
    evaluation,
  };
}

export const pharmacyEligibilityPreviewCases = [
  buildPreview({
    pharmacyCaseId: "PHC-2048",
    bundleId: "PEB-2048-V1",
    evaluationId: "PHEVAL-2048-V1",
    rulePackId: "RPK_P6_2026_04_23_V1",
    rulePackVersion: "P6-2026.04.23-r1",
    rulePackEffectiveFrom: "23 Apr 2026",
    revisionLabel: "Eligibility pack r1",
    scopeLabel: "Named pathway review",
    publicationState: "current",
    pathwayCode: "impetigo_1_plus",
    evaluatedPathways: [
      candidate({
        pathwayCode: "impetigo_1_plus",
        ageSexGatePass: true,
        requiredSymptomSupport: 0.89,
        evidenceCompleteness: 0.94,
        pathwayExclusionScore: 0.08,
        globalExclusionScore: 0.06,
        contradictionScore: 0.04,
        eligibilityConfidence: 0.91,
        hardFailReasonCodes: [],
      }),
    ],
    matchedRuleIds: ["impetigo.entry.criteria", "tau_req_pass", "tau_eligible"],
    thresholdRows: [
      ["tau_req_pass", "0.62"],
      ["tau_eligible", "0.68"],
      ["tau_min_complete", "0.60"],
    ],
    ageSexGateResult: "pass",
    pathwayGateResult: "eligible",
    exclusionMatches: [],
    pathwayExclusionScore: 0.08,
    globalExclusionScore: 0.06,
    requiredSymptomSupport: 0.89,
    evidenceCompleteness: 0.94,
    contradictionScore: 0.04,
    eligibilityConfidence: 0.91,
    recommendedLane: "clinical_pathway_consultation",
    finalDisposition: "eligible_choice_pending",
    unsafeFallbackReasonCode: null,
    timingGuardrailId: "PTG-IMPETIGO-R1",
    fallbackScore: null,
    evidenceSnapshot: evidence({
      patientAgeYears: 22,
      sexAtBirth: "female",
      symptomEvidence: {
        "impetigo.crusting_lesions": { support: 0.94, completeness: 0.96 },
        "impetigo.localised_spread": { support: 0.82, completeness: 0.92 },
      },
      ruleScores: {
        "impetigo.entry.criteria": 0.89,
        "global.high_risk_exclusion": 0.06,
      },
      minorIllnessFeatureScores: {
        symptomBurden: 0.12,
        selfCareFit: 0.18,
        comorbidityPenalty: 0.04,
        escalationNeedPenalty: 0.02,
      },
      evaluatedAt: "2026-04-24T08:42:00.000Z",
    }),
    patientSummaryTitle: "Pharmacy can continue with this request",
    patientSummary: "The symptoms fit the impetigo pathway.",
    patientNextStep:
      "Continue with pharmacy choice or confirmation while the same request shell keeps the current review in view.",
    patientMacroState: "choose_or_confirm",
    staffSummary:
      "Impetigo pathway met gateway, symptom support, and completeness thresholds.",
    nextBestEndpointSuggestion: "community_pharmacy_supply",
    summaryTitle: "Eligible for pharmacy handling",
    summary:
      "The compiled rule pack keeps this case inside the pharmacy route because the named pathway, evidence completeness, and safety checks all stayed within threshold.",
    gateLadder: [
      {
        gateId: "age_and_sex_gate",
        label: "Age and sex gate",
        state: "pass",
        summary: "The case fits the age and sex boundary for the named pathway.",
        detail: "No boundary override or drift was required.",
        evidenceLabel: "Age 22 / female boundary satisfied",
      },
      {
        gateId: "named_pathway_fit",
        label: "Named pathway fit",
        state: "pass",
        summary: "The impetigo pathway stayed above the required symptom threshold.",
        detail: "Required symptom support remained strong enough to keep the named pathway active.",
        evidenceLabel: "Required support 0.89",
      },
      {
        gateId: "exclusion_and_red_flags",
        label: "Exclusions and red flags",
        state: "pass",
        summary: "No blocking exclusion or red-flag bridge fired.",
        detail: "Global and pathway-specific safety fences remained below their blocking thresholds.",
        evidenceLabel: "Global exclusion 0.06",
      },
      {
        gateId: "evidence_completeness",
        label: "Evidence completeness",
        state: "pass",
        summary: "The available evidence was complete enough to make the pathway decision auditable.",
        detail: "Completeness stayed above the pack threshold and contradiction remained low.",
        evidenceLabel: "Completeness 0.94 / contradiction 0.04",
      },
      {
        gateId: "minor_illness_fallback",
        label: "Minor illness fallback",
        state: "bypassed",
        summary: "Fallback logic was not needed because the named pathway stayed lawful.",
        detail: "The case never dropped into the fallback-only lane.",
        evidenceLabel: "Bypassed",
      },
      {
        gateId: "final_routing",
        label: "Final routing",
        state: "pass",
        summary: "The final disposition remains inside pharmacy with choice still pending.",
        detail: "The patient and staff surfaces should both show pharmacy as the current route.",
        evidenceLabel: "eligible_choice_pending",
      },
    ],
    evidenceSummary: [
      {
        label: "Evidence tuple",
        value: "Age 22 / female / 2 symptom signals",
        detail: "Derived from the immutable evaluation tuple for this case.",
        patientSafe: true,
      },
      {
        label: "Required symptom support",
        value: "0.89",
        detail: "Above tau_req_pass for the active pathway.",
        patientSafe: false,
      },
      {
        label: "Evidence completeness",
        value: "0.94",
        detail: "High enough to keep the pathway decision auditable.",
        patientSafe: false,
      },
      {
        label: "Shared evidence hash",
        value: "Derived from the frozen evidence tuple",
        detail: "Both staff and patient surfaces point back to the same evidence hash.",
        patientSafe: true,
      },
    ],
    nextStepPanel: {
      title: "Keep the pharmacy route in view",
      summary:
        "Continue through the same request shell. Choice and later dispatch proof will reuse this exact explanation tuple.",
      primaryActionLabel: "Continue with pharmacy choice",
      returnPathLabel: "Stay in the same pharmacy request shell",
      routeLabel: "Clinical pathway consultation",
    },
    supersessionNotice: null,
    createdAt: "2026-04-24T08:42:00.000Z",
    generatedAt: "2026-04-24T08:42:10.000Z",
    version: 1,
  }),
  buildPreview({
    pharmacyCaseId: "PHC-2090",
    bundleId: "PEB-2090-V1",
    evaluationId: "PHEVAL-2090-V1",
    rulePackId: "RPK_P6_2026_04_23_V1",
    rulePackVersion: "P6-2026.04.23-r1",
    rulePackEffectiveFrom: "23 Apr 2026",
    revisionLabel: "Eligibility pack r1",
    scopeLabel: "Named pathway review",
    publicationState: "current",
    pathwayCode: null,
    evaluatedPathways: [
      candidate({
        pathwayCode: "acute_sore_throat_5_plus",
        ageSexGatePass: true,
        requiredSymptomSupport: 0.44,
        evidenceCompleteness: 0.74,
        pathwayExclusionScore: 0.18,
        globalExclusionScore: 0.86,
        contradictionScore: 0.13,
        eligibilityConfidence: 0.28,
        hardFailReasonCodes: ["global.high_risk_exclusion"],
      }),
    ],
    matchedRuleIds: ["global.high_risk_exclusion"],
    thresholdRows: [
      ["tau_global_block", "0.80"],
      ["eta_global", "0.86"],
      ["tau_min_complete", "0.60"],
    ],
    ageSexGateResult: "pass",
    pathwayGateResult: "global_blocked",
    exclusionMatches: ["global.high_risk_exclusion"],
    pathwayExclusionScore: 0.18,
    globalExclusionScore: 0.86,
    requiredSymptomSupport: 0.44,
    evidenceCompleteness: 0.74,
    contradictionScore: 0.13,
    eligibilityConfidence: 0.28,
    recommendedLane: "non_pharmacy_return",
    finalDisposition: "ineligible_returned",
    unsafeFallbackReasonCode: "global.high_risk_exclusion",
    timingGuardrailId: null,
    fallbackScore: null,
    evidenceSnapshot: evidence({
      patientAgeYears: 34,
      sexAtBirth: "male",
      symptomEvidence: {
        "sore_throat.pain": { support: 0.44, completeness: 0.78 },
        "sore_throat.fever_past_24h": { support: 0.36, completeness: 0.7 },
      },
      ruleScores: {
        "acute_sore_throat_5_plus": 0.44,
        "global.high_risk_exclusion": 0.86,
      },
      minorIllnessFeatureScores: {
        symptomBurden: 0.34,
        selfCareFit: 0.22,
        comorbidityPenalty: 0.72,
        escalationNeedPenalty: 0.68,
      },
      evaluatedAt: "2026-04-24T08:51:00.000Z",
    }),
    patientSummaryTitle: "Pharmacy is not the safest next step",
    patientSummary:
      "Pharmacy treatment is not the safest next step for this request.",
    patientNextStep:
      "Your practice team should review the next safest option. This request stays in the same shell so you can keep the current route and next step in view.",
    patientMacroState: "reviewing_next_steps",
    staffSummary:
      "A high-risk exclusion triggered. Pharmacy First is not appropriate for this evidence set.",
    nextBestEndpointSuggestion: "return_to_general_practice",
    summaryTitle: "Route this request back to practice review",
    summary:
      "The explanation bundle blocks pharmacy handling because the global safety score crossed the pack threshold. The patient-safe copy must stay short, but the underlying decision tuple remains the same.",
    gateLadder: [
      {
        gateId: "age_and_sex_gate",
        label: "Age and sex gate",
        state: "pass",
        summary: "The case was old enough for named pathway review.",
        detail: "Boundary screening did not block evaluation.",
        evidenceLabel: "Age 34 / open boundary",
      },
      {
        gateId: "named_pathway_fit",
        label: "Named pathway fit",
        state: "fail",
        summary: "No named pharmacy pathway stayed strong enough to carry the decision.",
        detail: "Symptom support stayed below the pathway threshold, so the ladder could not lawfully continue on a named route.",
        evidenceLabel: "Required support 0.44",
      },
      {
        gateId: "global_safety_gate",
        label: "Global safety gate",
        state: "fail",
        summary: "A global high-risk exclusion blocked pharmacy routing.",
        detail: "This is the causal blocker that both staff and patient copy need to reflect, even though only the staff view exposes the rule detail.",
        evidenceLabel: "Global exclusion 0.86 > 0.80",
      },
      {
        gateId: "evidence_completeness",
        label: "Evidence completeness",
        state: "review",
        summary: "The evidence tuple is complete enough to justify the return decision but not strong enough to rescue a pharmacy route.",
        detail: "Completeness remained above the minimum threshold while the global risk score still blocked progression.",
        evidenceLabel: "Completeness 0.74 / contradiction 0.13",
      },
      {
        gateId: "minor_illness_fallback",
        label: "Minor illness fallback",
        state: "bypassed",
        summary: "Fallback was not available after the global high-risk exclusion fired.",
        detail: "The bundle must not imply a lower-risk pharmacy route when the exclusion gate has already blocked the flow.",
        evidenceLabel: "Bypassed by safety block",
      },
      {
        gateId: "final_routing",
        label: "Final routing",
        state: "fail",
        summary: "The case returns to practice review instead of staying inside pharmacy.",
        detail: "Patient and staff surfaces should both point to the same non-pharmacy route.",
        evidenceLabel: "ineligible_returned",
      },
    ],
    evidenceSummary: [
      {
        label: "Evidence tuple",
        value: "Age 34 / male / 2 symptom signals",
        detail: "This frozen tuple feeds both the patient and staff explanations.",
        patientSafe: true,
      },
      {
        label: "Blocking rule",
        value: "Global high-risk exclusion",
        detail: "The staff view may expose the blocking class. The patient view must stay short and actionable.",
        patientSafe: false,
      },
      {
        label: "Completeness",
        value: "0.74",
        detail: "Enough to support the return decision without claiming pharmacy suitability.",
        patientSafe: false,
      },
      {
        label: "Evidence hash",
        value: "Shared tuple hash",
        detail: "Same evidence anchor across staff and patient surfaces.",
        patientSafe: true,
      },
    ],
    nextStepPanel: {
      title: "Use the practice route for this request",
      summary:
        "Keep the same request shell open, review the next safe step, and avoid silent dead ends or generic rejection wording.",
      primaryActionLabel: "Review the next safe step",
      returnPathLabel: "Stay in the same request shell while the practice route is prepared",
      routeLabel: "General practice review",
    },
    supersessionNotice: null,
    createdAt: "2026-04-24T08:51:00.000Z",
    generatedAt: "2026-04-24T08:51:10.000Z",
    version: 1,
  }),
  buildPreview({
    pharmacyCaseId: "PHC-2124",
    bundleId: "PEB-2124-V1",
    evaluationId: "PHEVAL-2124-V1",
    rulePackId: "RPK_P6_2026_04_23_V1",
    rulePackVersion: "P6-2026.04.23-r1",
    rulePackEffectiveFrom: "23 Apr 2026",
    revisionLabel: "Eligibility pack r1",
    scopeLabel: "Fallback review",
    publicationState: "superseded",
    pathwayCode: null,
    evaluatedPathways: [
      candidate({
        pathwayCode: "acute_sinusitis_12_plus",
        ageSexGatePass: true,
        requiredSymptomSupport: 0.56,
        evidenceCompleteness: 0.83,
        pathwayExclusionScore: 0.32,
        globalExclusionScore: 0.24,
        contradictionScore: 0.12,
        eligibilityConfidence: 0.58,
        hardFailReasonCodes: ["pathway_support_below_tau_eligible"],
      }),
    ],
    matchedRuleIds: ["minor_illness.entry_condition", "tau_minor_eligible"],
    thresholdRows: [
      ["tau_minor_eligible", "0.55"],
      ["tau_min_complete", "0.60"],
      ["tau_eligible", "0.68"],
    ],
    ageSexGateResult: "pass",
    pathwayGateResult: "fallback_only",
    exclusionMatches: [],
    pathwayExclusionScore: 0.32,
    globalExclusionScore: 0.24,
    requiredSymptomSupport: 0.56,
    evidenceCompleteness: 0.83,
    contradictionScore: 0.12,
    eligibilityConfidence: 0.58,
    recommendedLane: "minor_illness_fallback",
    finalDisposition: "minor_illness_fallback",
    unsafeFallbackReasonCode: null,
    timingGuardrailId: "PTG-SINUSITIS-R1",
    fallbackScore: 0.61,
    evidenceSnapshot: evidence({
      patientAgeYears: 41,
      sexAtBirth: "female",
      symptomEvidence: {
        "sinusitis.nasal_discharge": { support: 0.58, completeness: 0.84 },
        "sinusitis.facial_pain": { support: 0.54, completeness: 0.81 },
      },
      ruleScores: {
        "acute_sinusitis_12_plus": 0.56,
        "global.high_risk_exclusion": 0.24,
      },
      minorIllnessFeatureScores: {
        symptomBurden: 0.78,
        selfCareFit: 0.76,
        comorbidityPenalty: 0.18,
        escalationNeedPenalty: 0.12,
      },
      evaluatedAt: "2026-04-24T09:04:00.000Z",
    }),
    patientSummaryTitle: "Pharmacy advice may still be suitable",
    patientSummary:
      "A minor illness consultation may still be suitable at a community pharmacy.",
    patientNextStep:
      "Choose a pharmacy if you would still like pharmacy advice for this lower-risk presentation.",
    patientMacroState: "reviewing_next_steps",
    staffSummary:
      "No named clinical pathway passed, but minor-illness fallback remained lawfully available.",
    nextBestEndpointSuggestion: "community_pharmacy_minor_illness_consultation",
    summaryTitle: "Fallback remains lawful, but this explainer is no longer current",
    summary:
      "This bundle still shows why minor-illness fallback was allowed, but a newer explanation bundle has superseded it. Keep the surface read-only until the refreshed tuple is loaded.",
    gateLadder: [
      {
        gateId: "age_and_sex_gate",
        label: "Age and sex gate",
        state: "pass",
        summary: "The case stayed within age and sex bounds for named pathway review.",
        detail: "Boundary review did not block evaluation.",
        evidenceLabel: "Age 41 / open boundary",
      },
      {
        gateId: "named_pathway_fit",
        label: "Named pathway fit",
        state: "fail",
        summary: "No named pathway stayed above the full eligibility threshold.",
        detail: "Pathway support was not strong enough to keep the case on a named route.",
        evidenceLabel: "Support 0.56 < tau_eligible 0.68",
      },
      {
        gateId: "exclusion_and_red_flags",
        label: "Exclusions and red flags",
        state: "pass",
        summary: "No blocking red-flag or high-risk rule fired.",
        detail: "The case remained eligible for fallback review because the blocking exclusions stayed below threshold.",
        evidenceLabel: "Global exclusion 0.24",
      },
      {
        gateId: "evidence_completeness",
        label: "Evidence completeness",
        state: "pass",
        summary: "The evidence tuple remained complete enough for fallback review.",
        detail: "Completeness was stable enough to support the lower-risk route.",
        evidenceLabel: "Completeness 0.83",
      },
      {
        gateId: "minor_illness_fallback",
        label: "Minor illness fallback",
        state: "pass",
        summary: "Fallback stayed lawfully available for this tuple.",
        detail: "This is the causal reason the surface still points to pharmacy advice rather than return-to-practice routing.",
        evidenceLabel: "Fallback score 0.61",
      },
      {
        gateId: "final_routing",
        label: "Final routing",
        state: "review",
        summary: "The case points to the fallback route, but this specific explanation bundle is superseded.",
        detail: "The decision remains visible for audit, but the UI must not imply that the older bundle is still current.",
        evidenceLabel: "superseded",
      },
    ],
    evidenceSummary: [
      {
        label: "Evidence tuple",
        value: "Age 41 / female / 2 symptom signals",
        detail: "Still pinned to the superseded bundle for review only.",
        patientSafe: true,
      },
      {
        label: "Named pathway support",
        value: "0.56",
        detail: "Below tau_eligible, so the bundle fell through to fallback review.",
        patientSafe: false,
      },
      {
        label: "Fallback score",
        value: "0.61",
        detail: "Above tau_minor_eligible for the superseded bundle.",
        patientSafe: false,
      },
      {
        label: "Bundle posture",
        value: "Superseded",
        detail: "A newer explanation bundle must replace this one before staff treat it as current.",
        patientSafe: true,
      },
    ],
    nextStepPanel: {
      title: "Refresh before acting on this explanation",
      summary:
        "The fallback route is still visible for audit, but the current bundle is no longer authoritative for live action.",
      primaryActionLabel: "Refresh the explanation bundle",
      returnPathLabel: "Keep the case in the same validation shell while the newer tuple loads",
      routeLabel: "Minor illness fallback",
    },
    supersessionNotice: {
      state: "superseded",
      title: "A newer explanation bundle is available",
      summary:
        "Freeze calm or writable posture until the rule ladder, evidence tuple, and next-step copy are refreshed from the newer bundle.",
      actionLabel: "Refresh explanation",
    },
    createdAt: "2026-04-24T09:04:00.000Z",
    generatedAt: "2026-04-24T09:04:12.000Z",
    version: 1,
  }),
] as const satisfies readonly PharmacyEligibilityPreviewSnapshot[];

const pharmacyEligibilityPreviewMap = new Map(
  pharmacyEligibilityPreviewCases.map((preview) => [preview.pharmacyCaseId, preview] as const),
);

export function resolvePharmacyEligibilityPreview(
  pharmacyCaseId: string | null | undefined,
): PharmacyEligibilityPreviewSnapshot | null {
  if (!pharmacyCaseId) {
    return null;
  }
  return pharmacyEligibilityPreviewMap.get(pharmacyCaseId) ?? null;
}
