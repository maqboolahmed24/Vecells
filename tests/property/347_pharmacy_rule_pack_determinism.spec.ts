import { describe, expect, it } from "vitest";

import {
  create347EligibilityService,
  seed347Fixtures,
} from "../integration/347_rule_pack.helpers.ts";

function reorderEntries<T>(record: Record<string, T>, order: readonly string[]): Record<string, T> {
  const next: Record<string, T> = {};
  for (const key of order) {
    if (key in record) {
      next[key] = record[key]!;
    }
  }
  return next;
}

describe("347 pharmacy rule-pack determinism", () => {
  it("keeps outcome, matched rules, and threshold snapshots stable across evidence map permutations", async () => {
    const { service } = create347EligibilityService();
    const rulePackId = await seed347Fixtures(service);

    const baseEvidence = {
      patientAgeYears: 28,
      sexAtBirth: "female" as const,
      symptomEvidence: {
        "uti.dysuria": { support: 0.96, completeness: 0.9 },
        "uti.frequency": { support: 0.88, completeness: 0.88 },
        "shingles.rash": { support: 0, completeness: 0 }
      },
      ruleScores: {
        "uti.exclusion.complicated": 0,
        "global.high_risk_exclusion": 0
      },
      minorIllnessFeatureScores: {
        symptomBurden: 0.2,
        selfCareFit: 0.2,
        comorbidityPenalty: 0.1,
        escalationNeedPenalty: 0.1
      },
      evaluatedAt: "2026-04-23T12:40:00.000Z"
    };

    const orders = [
      {
        symptomOrder: ["uti.dysuria", "uti.frequency", "shingles.rash"],
        ruleOrder: ["uti.exclusion.complicated", "global.high_risk_exclusion"],
      },
      {
        symptomOrder: ["shingles.rash", "uti.frequency", "uti.dysuria"],
        ruleOrder: ["global.high_risk_exclusion", "uti.exclusion.complicated"],
      },
    ] as const;

    const results = [];
    for (const [index, order] of orders.entries()) {
      results.push(
        await service.evaluateEvidence({
          pharmacyCaseId: `pharmacy_property_case_${index}`,
          rulePackId,
          evidence: {
            ...baseEvidence,
            symptomEvidence: reorderEntries(baseEvidence.symptomEvidence, order.symptomOrder),
            ruleScores: reorderEntries(baseEvidence.ruleScores, order.ruleOrder),
          },
          evaluatedAt: baseEvidence.evaluatedAt,
          replayKey: `property_347_${index}`,
        }),
      );
    }

    expect(results[0]?.evaluation.finalDisposition).toBe(results[1]?.evaluation.finalDisposition);
    expect(results[0]?.evaluation.pathwayCode).toBe(results[1]?.evaluation.pathwayCode);
    expect(results[0]?.evaluation.matchedRuleIds).toEqual(results[1]?.evaluation.matchedRuleIds);
    expect(results[0]?.evaluation.thresholdSnapshot).toEqual(results[1]?.evaluation.thresholdSnapshot);
  });
});
