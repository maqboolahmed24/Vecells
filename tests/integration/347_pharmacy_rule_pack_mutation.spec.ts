import { describe, expect, it } from "vitest";

import {
  cloneInitialRulePack,
  create347EligibilityService,
  deriveCandidateRulePack,
} from "./347_rule_pack.helpers.ts";

describe("347 pharmacy rule-pack mutation barriers", () => {
  it("rejects a fallback entry-condition mutation that would bypass the global-block law", async () => {
    const { service } = create347EligibilityService();
    const mutated = deriveCandidateRulePack(
      "RPK_P6_2026_10_01_ENTRY_MUTATION",
      "2026-10-01T00:00:00.000Z",
      (pack) => {
        pack.minorIllnessPolicy.entryCondition = "no_named_pathway_eligible";
      },
    );

    await service.importDraftRulePack(mutated);
    const validation = await service.validateRulePack(
      mutated.rulePackId,
      "2026-04-23T13:10:00.000Z",
    );

    expect(validation.valid).toBe(false);
    expect(validation.errors.join(" | ")).toContain(
      "minorIllnessPolicy.entryCondition must keep fallback blocked when any global block is active.",
    );
  });

  it("emits a distinct compile hash when threshold mutations change the candidate pack", async () => {
    const { service } = create347EligibilityService();

    const baseline = cloneInitialRulePack();
    await service.importDraftRulePack(baseline);
    await service.validateRulePack(baseline.rulePackId, "2026-04-23T13:11:00.000Z");
    const baselineCompiled = await service.compileRulePack(
      baseline.rulePackId,
      "2026-04-23T13:12:00.000Z",
    );

    const candidate = deriveCandidateRulePack(
      "RPK_P6_2026_11_01_THRESHOLD_MUTATION",
      "2026-11-01T00:00:00.000Z",
      (pack) => {
        pack.thresholdValues.tau_eligible = 0.64;
      },
    );
    await service.importDraftRulePack(candidate);
    await service.validateRulePack(candidate.rulePackId, "2026-04-23T13:13:00.000Z");
    const candidateCompiled = await service.compileRulePack(
      candidate.rulePackId,
      "2026-04-23T13:14:00.000Z",
    );

    expect(candidateCompiled.compileHash).not.toBe(baselineCompiled.compileHash);
  });
});
