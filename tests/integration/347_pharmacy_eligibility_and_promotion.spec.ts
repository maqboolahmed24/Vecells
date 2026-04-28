import { describe, expect, it } from "vitest";

import {
  buildEvidence,
  create347EligibilityService,
  deriveCandidateRulePack,
  evaluateSeededCase,
  positivePathwayEvidence,
  seed347Fixtures,
} from "./347_rule_pack.helpers.ts";

describe("347 pharmacy eligibility and promotion", () => {
  it("writes a replayable evaluation and advances the case into eligible choice", async () => {
    const { service } = create347EligibilityService();
    const rulePackId = await seed347Fixtures(service);

    const evaluated = await evaluateSeededCase(service, {
      seed: "347_integration_positive",
      rulePackId,
      evidence: positivePathwayEvidence("shingles_18_plus"),
    });

    expect(evaluated.evaluation.rulePackRef.refId).toBe(rulePackId);
    expect(evaluated.evaluation.pathwayCode).toBe("shingles_18_plus");
    expect(evaluated.evaluation.finalDisposition).toBe("eligible_choice_pending");
    expect(evaluated.caseMutation.pharmacyCase.status).toBe("eligible_choice_pending");
    expect(evaluated.caseMutation.pharmacyCase.serviceType).toBe(
      "clinical_pathway_consultation",
    );
  });

  it("keeps minor-illness fallback explicit and separate from named pathway selection", async () => {
    const { service } = create347EligibilityService();
    const rulePackId = await seed347Fixtures(service);

    const fallback = await evaluateSeededCase(service, {
      seed: "347_integration_minor_fallback",
      rulePackId,
      evidence: buildEvidence({
        patientAgeYears: 31,
        sexAtBirth: "male",
        symptomEvidence: {
          "sore_throat.pain": { support: 0.35, completeness: 0.62 },
          "sore_throat.fever_past_24h": { support: 0.2, completeness: 0.58 },
          "sinusitis.nasal_discharge": { support: 0.3, completeness: 0.55 },
        },
        minorIllnessFeatureScores: {
          symptomBurden: 0.92,
          selfCareFit: 0.9,
          comorbidityPenalty: 0.08,
          escalationNeedPenalty: 0.06,
        },
      }),
    });

    expect(fallback.evaluation.finalDisposition).toBe("minor_illness_fallback");
    expect(fallback.evaluation.pathwayCode).toBeNull();
    expect(fallback.evaluation.pathwayGateResult).toBe("fallback_only");
    expect(fallback.caseMutation.pharmacyCase.status).toBe("eligible_choice_pending");
    expect(fallback.caseMutation.pharmacyCase.serviceType).toBe("minor_illness_fallback");
  });

  it("compares pack versions and exposes threshold deltas for a future candidate pack", async () => {
    const { service } = create347EligibilityService();
    const baselineRulePackId = await seed347Fixtures(service);
    const candidate = deriveCandidateRulePack(
      "RPK_P6_2026_05_01_V2",
      "2026-05-01T00:00:00.000Z",
      (pack) => {
        pack.thresholdValues.tau_eligible = 0.64;
      },
    );
    await service.importDraftRulePack(candidate);
    await service.validateRulePack(candidate.rulePackId, "2026-04-23T12:20:00.000Z");
    await service.compileRulePack(candidate.rulePackId, "2026-04-23T12:21:00.000Z");

    const comparison = await service.comparePackVersions({
      baselineRulePackId,
      candidateRulePackId: candidate.rulePackId,
      pharmacyCaseId: "pharmacy_compare_347",
      evidence: positivePathwayEvidence("acute_sore_throat_5_plus"),
      evaluatedAt: "2026-04-23T12:22:00.000Z",
    });

    expect(comparison.thresholdDeltaRefs).toContain("tau_eligible");
    expect(comparison.baselineEvaluation.rulePackRef.refId).toBe(baselineRulePackId);
    expect(comparison.candidateEvaluation.rulePackRef.refId).toBe(candidate.rulePackId);
  });
});
