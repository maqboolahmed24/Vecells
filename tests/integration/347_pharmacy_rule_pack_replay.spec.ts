import { describe, expect, it } from "vitest";

import {
  create347EligibilityService,
  deriveCandidateRulePack,
  positivePathwayEvidence,
  seed347Fixtures,
} from "./347_rule_pack.helpers.ts";

describe("347 pharmacy replay and mutation barriers", () => {
  it("replays a historical evaluation against the original and candidate packs", async () => {
    const { service } = create347EligibilityService();
    const baselineRulePackId = await seed347Fixtures(service);

    const initial = await service.evaluateEvidence({
      pharmacyCaseId: "pharmacy_replay_case_347",
      rulePackId: baselineRulePackId,
      evidence: positivePathwayEvidence("acute_otitis_media_1_17"),
      evaluatedAt: "2026-04-23T12:30:00.000Z",
      replayKey: "replay_case_347",
    });

    const candidate = deriveCandidateRulePack(
      "RPK_P6_2026_06_01_V2",
      "2026-06-01T00:00:00.000Z",
      (pack) => {
        pack.thresholdValues.tau_eligible = 0.6;
      },
    );
    await service.importDraftRulePack(candidate);
    await service.validateRulePack(candidate.rulePackId, "2026-04-23T12:31:00.000Z");
    await service.compileRulePack(candidate.rulePackId, "2026-04-23T12:32:00.000Z");

    const replayed = await service.replayHistoricalEvaluation({
      evaluationId: initial.evaluation.evaluationId,
      replayRulePackId: candidate.rulePackId,
    });

    expect(replayed.evaluation.evidenceSnapshot).toEqual(initial.evaluation.evidenceSnapshot);
    expect(replayed.evaluation.rulePackRef.refId).toBe(candidate.rulePackId);
  });

  it("fails golden-case regression when a candidate pack would let fallback bypass a global block", async () => {
    const { service } = create347EligibilityService();
    await seed347Fixtures(service);

    const mutated = deriveCandidateRulePack(
      "RPK_P6_2026_07_01_MUTATED",
      "2026-07-01T00:00:00.000Z",
      (pack) => {
        pack.thresholdValues.tau_global_block = 1;
      },
    );
    await service.importDraftRulePack(mutated);
    await service.validateRulePack(mutated.rulePackId, "2026-04-23T12:33:00.000Z");
    await service.compileRulePack(mutated.rulePackId, "2026-04-23T12:34:00.000Z");

    const regression = await service.runGoldenCaseRegression({
      candidateRulePackId: mutated.rulePackId,
      baselineRulePackId: "RPK_P6_2025_09_23_V1",
    });

    expect(regression.passed).toBe(false);
    expect(
      regression.entries.some(
        (entry) =>
          entry.goldenCaseId === "GC347_004_global_red_flag_block" &&
          entry.failures.includes("forbidden_behavior_drift"),
      ),
    ).toBe(true);

    await expect(
      service.promoteRulePack({
        rulePackId: mutated.rulePackId,
        promotedAt: "2026-04-23T12:35:00.000Z",
        promotedByRef: "operator_347_mutation",
        promotionReason: "unsafe_global_threshold_relaxation",
      }),
    ).rejects.toMatchObject({
      code: "RULE_PACK_PROMOTION_BLOCKED_BY_GOLDEN_CASES",
    });
  });
});
