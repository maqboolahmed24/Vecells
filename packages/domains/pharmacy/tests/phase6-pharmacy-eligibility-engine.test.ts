import { describe, expect, it } from "vitest";

import {
  cloneInitialRulePack,
  create347EligibilityService,
  deriveCandidateRulePack,
  positivePathwayEvidence,
  seed347Fixtures,
} from "../../../../tests/integration/347_rule_pack.helpers.ts";

describe("phase6 pharmacy eligibility engine", () => {
  it("compiles, promotes, and evaluates the seeded rule pack deterministically", async () => {
    const { service } = create347EligibilityService();
    const rulePackId = await seed347Fixtures(service);

    const evaluated = await service.evaluateEvidence({
      pharmacyCaseId: "pharmacy_case_unit_347",
      rulePackId,
      evidence: positivePathwayEvidence("uncomplicated_uti_female_16_64"),
      evaluatedAt: "2026-04-23T12:00:00.000Z",
      replayKey: "unit_eval_347",
    });

    expect(evaluated.replayed).toBe(false);
    expect(evaluated.evaluation.finalDisposition).toBe("eligible_choice_pending");
    expect(evaluated.evaluation.pathwayCode).toBe("uncomplicated_uti_female_16_64");
    expect(evaluated.explanationBundle.sharedEvidenceHash).toBe(
      evaluated.evaluation.sharedEvidenceHash,
    );

    const replayed = await service.evaluateEvidence({
      pharmacyCaseId: "pharmacy_case_unit_347",
      rulePackId,
      evidence: positivePathwayEvidence("uncomplicated_uti_female_16_64"),
      evaluatedAt: "2026-04-23T12:00:00.000Z",
      replayKey: "unit_eval_347",
    });

    expect(replayed.replayed).toBe(true);
    expect(replayed.evaluation.evaluationId).toBe(evaluated.evaluation.evaluationId);
  });

  it("rejects a pack with missing explanation text before compilation", async () => {
    const { service } = create347EligibilityService();
    const invalid = cloneInitialRulePack();
    delete invalid.displayTextCatalog["copy.guardrail.uti.warning"];

    await service.importDraftRulePack(invalid);
    const validation = await service.validateRulePack(
      invalid.rulePackId,
      "2026-04-23T12:05:00.000Z",
    );

    expect(validation.valid).toBe(false);
    expect(validation.errors.join(" | ")).toContain("copy.guardrail.uti.warning");
  });

  it("blocks overlapping promotion without machine-resolved supersession", async () => {
    const { service } = create347EligibilityService();
    const baselineRulePackId = await seed347Fixtures(service);

    const overlapping = deriveCandidateRulePack(
      "RPK_P6_2026_04_23_V2",
      "2025-09-24T00:00:00.000Z",
      (pack) => {
        pack.overlapStrategy = "forbid_overlap";
      },
    );
    await service.importDraftRulePack(overlapping);
    await service.validateRulePack(overlapping.rulePackId, "2026-04-23T12:10:00.000Z");
    await service.compileRulePack(overlapping.rulePackId, "2026-04-23T12:11:00.000Z");

    await expect(
      service.promoteRulePack({
        rulePackId: overlapping.rulePackId,
        promotedAt: "2026-04-23T12:12:00.000Z",
        promotedByRef: "operator_347_overlap",
        promotionReason: "overlap_probe",
      }),
    ).rejects.toMatchObject({
      code: "OVERLAPPING_RULE_PACK_WINDOW",
    });

    const baseline = await service.getRulePack(baselineRulePackId);
    expect(baseline?.packState).toBe("promoted");
  });
});
