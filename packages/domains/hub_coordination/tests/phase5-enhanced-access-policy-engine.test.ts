import { describe, expect, it } from "vitest";

import { createPhase5EnhancedAccessPolicyService } from "../src/phase5-enhanced-access-policy-engine.ts";
import {
  atMinute,
  buildDegradedPolicyFacts,
  buildEnhancedAccessPolicyCompileInput,
  buildTrustedPolicyFacts,
  setupEnhancedAccessPolicyHarness,
} from "../../../../tests/integration/317_enhanced_access_policy.helpers.ts";

describe("phase5 enhanced access policy engine", () => {
  it("canonicalizes semantically identical family packs into the same tuple hash", () => {
    const service = createPhase5EnhancedAccessPolicyService();
    const base = buildEnhancedAccessPolicyCompileInput("317_unit_hash", "pcn_317_unit_hash");
    const reordered = {
      ...base,
      sourceRefs: [...base.sourceRefs].reverse(),
      routingPolicyPack: {
        ...base.routingPolicyPack,
        eligibleSiteRefs: [...base.routingPolicyPack.eligibleSiteRefs].reverse(),
        sourceNamespaceRefs: [...base.routingPolicyPack.sourceNamespaceRefs].reverse(),
        sourceRefs: [...base.routingPolicyPack.sourceRefs].reverse(),
      },
      practiceVisibilityPolicy: {
        ...base.practiceVisibilityPolicy,
        originPracticeVisibleFieldRefs: [
          ...base.practiceVisibilityPolicy.originPracticeVisibleFieldRefs,
        ].reverse(),
        hiddenFieldRefs: [...base.practiceVisibilityPolicy.hiddenFieldRefs].reverse(),
      },
      capacityIngestionPolicy: {
        ...base.capacityIngestionPolicy,
        quarantineTriggers: [...base.capacityIngestionPolicy.quarantineTriggers].reverse(),
        degradedTriggers: [...base.capacityIngestionPolicy.degradedTriggers].reverse(),
        sourceRefs: [...base.capacityIngestionPolicy.sourceRefs].reverse(),
      },
    };

    const first = service.policyTupleHashFromCompileInput(base);
    const second = service.policyTupleHashFromCompileInput(reordered);

    expect(first.policyTupleHash).toBe(second.policyTupleHash);
    expect(first.tupleCanonicalPayload).toBe(second.tupleCanonicalPayload);
  });

  it("replays a persisted candidate-snapshot evaluation exactly from the stored fixture", async () => {
    const harness = await setupEnhancedAccessPolicyHarness("317_unit_replay");
    const result = await harness.policyService.evaluateHubCaseAgainstPolicy({
      hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
      pcnRef: harness.claimed.hubCase.servingPcnId,
      evaluationScope: "candidate_snapshot",
      evaluatedAt: atMinute(5),
      facts: buildTrustedPolicyFacts("317_unit_replay"),
    });

    const replay = await harness.policyService.replayHistoricalEvaluation({
      policyEvaluationId: result.evaluation.policyEvaluationId,
    });

    expect(replay.matchesStoredEvaluation).toBe(true);
    expect(replay.mismatchFields).toEqual([]);
    expect(replay.originalEvaluation.evaluationScope).toBe("candidate_snapshot");
    expect(replay.hubCaseBundle?.hubCase.hubCoordinationCaseId).toBe(
      harness.claimed.hubCase.hubCoordinationCaseId,
    );
    expect(replay.evaluation.sourceAdmissionSummary).toEqual(
      result.evaluation.sourceAdmissionSummary,
    );
  });

  it("emits typed exceptions for tuple drift, restricted visibility, and degraded capacity", async () => {
    const harness = await setupEnhancedAccessPolicyHarness("317_unit_exception");
    const result = await harness.policyService.evaluateHubCaseAgainstPolicy({
      hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
      pcnRef: harness.claimed.hubCase.servingPcnId,
      evaluationScope: "practice_visibility_generation",
      evaluatedAt: atMinute(6),
      presentedPolicyTupleHash: "stale_tuple_hash",
      facts: buildDegradedPolicyFacts("317_unit_exception"),
    });

    expect(result.evaluation.varianceDisposition).toBe("outside_window_visible_by_policy");
    expect(result.evaluation.serviceObligationDisposition).toBe("make_up_required");
    expect(result.evaluation.practiceVisibilityDisposition).toBe("visibility_restricted");
    expect(result.evaluation.capacityAdmissionDisposition).toBe("degraded_callback_only");
    expect(result.exceptions.map((value) => value.exceptionCode)).toEqual([
      "POLICY_TUPLE_DRIFT",
      "VARIANCE_OUTSIDE_WINDOW_VISIBLE",
      "SERVICE_OBLIGATION_MAKE_UP_REQUIRED",
      "PRACTICE_VISIBILITY_RESTRICTED",
      "CAPACITY_DEGRADED_CALLBACK_ONLY",
    ]);
  });
});
