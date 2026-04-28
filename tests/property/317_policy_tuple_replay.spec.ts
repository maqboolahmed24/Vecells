import { describe, expect, it } from "vitest";

import {
  atMinute,
  buildDegradedPolicyFacts,
  buildEnhancedAccessPolicyCompileInput,
  buildTrustedPolicyFacts,
  setupEnhancedAccessPolicyHarness,
} from "../integration/317_enhanced_access_policy.helpers.ts";
import {
  createPhase5EnhancedAccessPolicyService,
  phase5PolicyEvaluationScopes,
} from "../../packages/domains/hub_coordination/src/phase5-enhanced-access-policy-engine.ts";

describe("317 policy tuple replay properties", () => {
  it("keeps tuple hashes stable for order-only permutations and changes them for semantic deltas", () => {
    const service = createPhase5EnhancedAccessPolicyService();
    const base = buildEnhancedAccessPolicyCompileInput("317_property", "pcn_317_property");
    const baseHash = service.policyTupleHashFromCompileInput(base).policyTupleHash;

    const reorderedVariants = [
      {
        ...base,
        sourceRefs: [...base.sourceRefs].reverse(),
      },
      {
        ...base,
        routingPolicyPack: {
          ...base.routingPolicyPack,
          eligibleSiteRefs: [...base.routingPolicyPack.eligibleSiteRefs].reverse(),
          sourceNamespaceRefs: [...base.routingPolicyPack.sourceNamespaceRefs].reverse(),
        },
      },
      {
        ...base,
        practiceVisibilityPolicy: {
          ...base.practiceVisibilityPolicy,
          hiddenFieldRefs: [...base.practiceVisibilityPolicy.hiddenFieldRefs].reverse(),
          originPracticeVisibleFieldRefs: [
            ...base.practiceVisibilityPolicy.originPracticeVisibleFieldRefs,
          ].reverse(),
        },
      },
    ];

    for (const variant of reorderedVariants) {
      expect(service.policyTupleHashFromCompileInput(variant).policyTupleHash).toBe(baseHash);
    }

    const semanticVariants = [
      {
        ...base,
        varianceWindowPolicy: {
          ...base.varianceWindowPolicy,
          approvedVarianceAfterMinutes: base.varianceWindowPolicy.approvedVarianceAfterMinutes + 1,
        },
      },
      {
        ...base,
        practiceVisibilityPolicy: {
          ...base.practiceVisibilityPolicy,
          minimumNecessaryContractRef: "min_necessary_hub_to_origin_317_property_v2",
        },
      },
      {
        ...base,
        capacityIngestionPolicy: {
          ...base.capacityIngestionPolicy,
          staleThresholdMinutes: base.capacityIngestionPolicy.staleThresholdMinutes + 1,
        },
      },
    ];

    for (const variant of semanticVariants) {
      expect(service.policyTupleHashFromCompileInput(variant).policyTupleHash).not.toBe(baseHash);
    }
  });

  it("replays every declared scope from its stored fixture without semantic drift", async () => {
    const harness = await setupEnhancedAccessPolicyHarness("317_property_replay");
    const trustedFacts = buildTrustedPolicyFacts("317_property_replay");

    for (const [index, scope] of phase5PolicyEvaluationScopes.entries()) {
      const facts =
        scope === "practice_visibility_generation"
          ? buildDegradedPolicyFacts("317_property_replay")
          : scope === "manage_exposure"
            ? buildTrustedPolicyFacts("317_property_replay", {
                requiredWindowFit: 0,
                staleCapacityDetected: true,
                sourceAdmissionSummary: [],
                ackDebtOpen: true,
              })
            : buildTrustedPolicyFacts("317_property_replay", {
                requiredWindowFit: scope === "candidate_snapshot" ? 2 : 1,
              });

      const evaluation = await harness.policyService.evaluateHubCaseAgainstPolicy({
        hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
        pcnRef: harness.claimed.hubCase.servingPcnId,
        evaluationScope: scope,
        evaluatedAt: atMinute(20 + index),
        presentedPolicyTupleHash:
          scope === "practice_visibility_generation" ? "stale_tuple_hash" : null,
        facts,
      });
      const replay = await harness.policyService.replayHistoricalEvaluation({
        policyEvaluationId: evaluation.evaluation.policyEvaluationId,
      });

      expect(replay.matchesStoredEvaluation).toBe(true);
      expect(replay.mismatchFields).toEqual([]);
      expect(replay.originalEvaluation.policyTupleHash).toBe(
        harness.compiled.compiledPolicy.policyTupleHash,
      );
    }

    expect(trustedFacts.routeToNetworkRequested).toBe(true);
  });
});
