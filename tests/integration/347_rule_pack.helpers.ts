import initialRulePack from "../../data/fixtures/347_initial_rule_pack.json";
import goldenCases from "../../data/fixtures/347_golden_cases.json";
import {
  buildCreatePharmacyCaseCommand,
  ref,
} from "./346_pharmacy_case.helpers.ts";
import {
  createPhase6PharmacyCaseKernelService,
  createPhase6PharmacyCaseKernelStore,
  createPhase6PharmacyEligibilityEngineService,
  createPhase6PharmacyEligibilityStore,
  type EvaluateCurrentPharmacyCaseInput,
  type NamedPharmacyPathwayCode,
  type PharmacyEligibilityEvidenceSnapshot,
  type PharmacyGoldenCaseSnapshot,
  type PharmacyRulePackDraftInput,
} from "../../packages/domains/pharmacy/src/index.ts";

const TASK_342 = "seq_342" as const;

const BASE_TIME = Date.parse("2026-04-23T11:00:00.000Z");

function atMinute(offset: number): string {
  return new Date(BASE_TIME + offset * 60_000).toISOString();
}

export function create347EligibilityService() {
  const caseRepositories = createPhase6PharmacyCaseKernelStore();
  const caseKernelService = createPhase6PharmacyCaseKernelService({
    repositories: caseRepositories,
  });
  const repositories = createPhase6PharmacyEligibilityStore();
  const service = createPhase6PharmacyEligibilityEngineService({
    repositories,
    caseKernelService,
  });
  return {
    service,
    repositories,
    caseKernelService,
    caseRepositories,
  };
}

export function cloneInitialRulePack(): PharmacyRulePackDraftInput {
  return structuredClone(initialRulePack) as PharmacyRulePackDraftInput;
}

export function deriveCandidateRulePack(
  nextRulePackId: string,
  effectiveFrom: string,
  mutate?: (pack: PharmacyRulePackDraftInput) => void,
): PharmacyRulePackDraftInput {
  const pack = cloneInitialRulePack();
  pack.rulePackId = nextRulePackId;
  pack.predecessorRulePackId = initialRulePack.rulePackId;
  pack.effectiveFrom = effectiveFrom;
  pack.effectiveTo = null;
  pack.overlapStrategy = "machine_resolved_supersede_previous";
  for (const guardrail of pack.timingGuardrails) {
    guardrail.rulePackVersion = nextRulePackId;
  }
  if (mutate) {
    mutate(pack);
  }
  return pack;
}

export function cloneGoldenCases(): PharmacyGoldenCaseSnapshot[] {
  return structuredClone(goldenCases) as PharmacyGoldenCaseSnapshot[];
}

export async function seed347Fixtures(
  service: ReturnType<typeof create347EligibilityService>["service"],
) {
  const pack = cloneInitialRulePack();
  await service.importDraftRulePack(pack);
  for (const goldenCase of cloneGoldenCases()) {
    await service.importGoldenCase(goldenCase);
  }
  await service.validateRulePack(pack.rulePackId, atMinute(0));
  await service.compileRulePack(pack.rulePackId, atMinute(1));
  await service.promoteRulePack({
    rulePackId: pack.rulePackId,
    promotedAt: atMinute(2),
    promotedByRef: "operator_347_seed",
    promotionReason: "seed_phase6_initial_pack",
  });
  return pack.rulePackId;
}

export function buildEvidence(
  input: Partial<PharmacyEligibilityEvidenceSnapshot> = {},
): PharmacyEligibilityEvidenceSnapshot {
  return {
    patientAgeYears: 31,
    sexAtBirth: "female",
    symptomEvidence: {},
    ruleScores: {},
    minorIllnessFeatureScores: {
      symptomBurden: 0.2,
      selfCareFit: 0.2,
      comorbidityPenalty: 0.1,
      escalationNeedPenalty: 0.1,
    },
    evaluatedAt: atMinute(5),
    ...input,
  };
}

export async function createCandidateCase(
  service: ReturnType<typeof create347EligibilityService>["service"],
  seed: string,
) {
  return service.caseKernelService.createPharmacyCase(
    buildCreatePharmacyCaseCommand(seed, {
      pharmacyCaseId: `pharmacy_case_${seed}`,
      lineageCaseLinkId: `pharmacy_lineage_${seed}`,
      createdAt: atMinute(3),
      slaTargetAt: atMinute(180),
      actorRef: `actor_${seed}`,
      commandActionRecordRef: `create_action_${seed}`,
      commandSettlementRecordRef: `create_settlement_${seed}`,
      scopedMutationGateRef: `scoped_gate_${seed}_create`,
    }),
  );
}

export async function evaluateSeededCase(
  service: ReturnType<typeof create347EligibilityService>["service"],
  input: {
    seed: string;
    evidence?: Partial<PharmacyEligibilityEvidenceSnapshot>;
    rulePackId?: string;
  },
) {
  const created = await createCandidateCase(service, input.seed);
  const evidence = buildEvidence(input.evidence);
  const command: EvaluateCurrentPharmacyCaseInput = {
    pharmacyCaseId: created.pharmacyCase.pharmacyCaseId,
    actorRef: `actor_${input.seed}`,
    commandActionRecordRef: `eval_action_${input.seed}`,
    commandSettlementRecordRef: `eval_settlement_${input.seed}`,
    recordedAt: evidence.evaluatedAt,
    leaseRef: created.pharmacyCase.leaseRef,
    expectedOwnershipEpoch: created.pharmacyCase.ownershipEpoch,
    expectedLineageFenceRef: created.pharmacyCase.lineageFenceRef,
    scopedMutationGateRef: `scope_gate_${input.seed}_eval`,
    reasonCode: "evaluate_current_case",
    evidence,
    rulePackId: input.rulePackId,
    idempotencyKey: `evaluate_case_${input.seed}`,
  };
  return service.evaluateCurrentPharmacyCase(command);
}

export function positivePathwayEvidence(
  pathwayCode: NamedPharmacyPathwayCode,
): PharmacyEligibilityEvidenceSnapshot {
  switch (pathwayCode) {
    case "uncomplicated_uti_female_16_64":
      return buildEvidence({
        patientAgeYears: 28,
        sexAtBirth: "female",
        symptomEvidence: {
          "uti.dysuria": { support: 0.96, completeness: 0.92 },
          "uti.frequency": { support: 0.9, completeness: 0.9 },
        },
      });
    case "shingles_18_plus":
      return buildEvidence({
        patientAgeYears: 42,
        sexAtBirth: "female",
        symptomEvidence: {
          "shingles.rash": { support: 0.95, completeness: 0.92 },
          "shingles.pain": { support: 0.88, completeness: 0.88 },
        },
      });
    case "acute_otitis_media_1_17":
      return buildEvidence({
        patientAgeYears: 11,
        sexAtBirth: "male",
        symptomEvidence: {
          "aom.ear_pain": { support: 0.94, completeness: 0.9 },
          "aom.inflammation": { support: 0.85, completeness: 0.86 },
        },
      });
    case "acute_sore_throat_5_plus":
      return buildEvidence({
        patientAgeYears: 13,
        sexAtBirth: "female",
        symptomEvidence: {
          "sore_throat.pain": { support: 0.93, completeness: 0.88 },
          "sore_throat.fever_past_24h": { support: 0.8, completeness: 0.82 },
        },
      });
    case "acute_sinusitis_12_plus":
      return buildEvidence({
        patientAgeYears: 21,
        sexAtBirth: "male",
        symptomEvidence: {
          "sinusitis.nasal_discharge": { support: 0.92, completeness: 0.88 },
          "sinusitis.face_pain": { support: 0.83, completeness: 0.82 },
        },
      });
    case "impetigo_1_plus":
      return buildEvidence({
        patientAgeYears: 7,
        sexAtBirth: "female",
        symptomEvidence: {
          "impetigo.crusting_rash": { support: 0.93, completeness: 0.9 },
          "impetigo.localised_lesion": { support: 0.76, completeness: 0.8 },
        },
      });
    case "infected_insect_bites_1_plus":
      return buildEvidence({
        patientAgeYears: 19,
        sexAtBirth: "male",
        symptomEvidence: {
          "bites.inflammation": { support: 0.91, completeness: 0.88 },
          "bites.pain_or_heat": { support: 0.75, completeness: 0.8 },
        },
      });
  }
}

export function pathwayEvaluationRef(evaluationId: string) {
  return ref("PathwayEligibilityEvaluation", evaluationId, TASK_342);
}
