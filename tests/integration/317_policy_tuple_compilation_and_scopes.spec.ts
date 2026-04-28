import { describe, expect, it } from "vitest";

import {
  atMinute,
  buildEnhancedAccessPolicyCompileInput,
  buildTrustedPolicyFacts,
  evaluateAcrossAllScopes,
  setupEnhancedAccessPolicyHarness,
} from "./317_enhanced_access_policy.helpers.ts";
import { phase5PolicyEvaluationScopes } from "../../packages/domains/hub_coordination/src/phase5-enhanced-access-policy-engine.ts";

describe("317 policy tuple compilation and scopes", () => {
  it("binds all declared evaluation scopes to one compiled tuple and exact family refs", async () => {
    const harness = await setupEnhancedAccessPolicyHarness("317_scope_matrix");
    const results = await evaluateAcrossAllScopes(
      harness,
      atMinute(5),
      buildTrustedPolicyFacts("317_scope_matrix"),
    );

    expect(results).toHaveLength(phase5PolicyEvaluationScopes.length);
    expect(results.map((value) => value.evaluation.evaluationScope)).toEqual(
      phase5PolicyEvaluationScopes,
    );

    const tupleHashes = new Set(results.map((value) => value.evaluation.policyTupleHash));
    const bundleRefs = new Set(results.map((value) => value.evaluation.compiledPolicyBundleRef));
    expect(tupleHashes).toEqual(new Set([harness.compiled.compiledPolicy.policyTupleHash]));
    expect(bundleRefs).toEqual(new Set([harness.compiled.compiledPolicy.compiledPolicyBundleRef]));

    for (const result of results) {
      expect(result.evaluation.routingPolicyPackRef).toBe(
        harness.compiled.routingPolicyPack.routingPolicyPackId,
      );
      expect(result.evaluation.varianceWindowPolicyRef).toBe(
        harness.compiled.varianceWindowPolicy.varianceWindowPolicyId,
      );
      expect(result.evaluation.serviceObligationPolicyRef).toBe(
        harness.compiled.serviceObligationPolicy.serviceObligationPolicyId,
      );
      expect(result.evaluation.practiceVisibilityPolicyRef).toBe(
        harness.compiled.practiceVisibilityPolicy.practiceVisibilityPolicyId,
      );
      expect(result.evaluation.capacityIngestionPolicyRef).toBe(
        harness.compiled.capacityIngestionPolicy.capacityIngestionPolicyId,
      );
    }

    const persisted = await harness.repositories.listPolicyEvaluationsForCase(
      harness.claimed.hubCase.hubCoordinationCaseId,
    );
    expect(persisted).toHaveLength(phase5PolicyEvaluationScopes.length);
  });

  it("supersedes a prior active tuple and exposes drift for downstream mutable work", async () => {
    const harness = await setupEnhancedAccessPolicyHarness("317_drift");
    const firstPolicy = harness.compiled.compiledPolicy;
    const nextInput = buildEnhancedAccessPolicyCompileInput("317_drift_next", firstPolicy.pcnRef);
    const nextCompile = await harness.policyService.compileEnhancedAccessPolicy({
      ...nextInput,
      policyVersion: "317.policy.317_drift.v2",
      effectiveAt: atMinute(30),
      varianceWindowPolicy: {
        ...nextInput.varianceWindowPolicy,
        policyVersion: "variance.317_drift.v2",
        approvedVarianceAfterMinutes: nextInput.varianceWindowPolicy.approvedVarianceAfterMinutes + 30,
      },
    });

    const drift = await harness.policyService.resolvePolicyTupleDrift({
      pcnRef: firstPolicy.pcnRef,
      boundPolicyTupleHash: firstPolicy.policyTupleHash,
      asOf: atMinute(31),
    });

    expect(drift.driftDisposition).toBe("drifted");
    expect(drift.currentPolicyTupleHash).toBe(nextCompile.compiledPolicy.policyTupleHash);
    await expect(
      harness.policyService.assertPolicyTupleCurrent({
        pcnRef: firstPolicy.pcnRef,
        boundPolicyTupleHash: firstPolicy.policyTupleHash,
        asOf: atMinute(31),
      }),
    ).rejects.toMatchObject({
      code: "POLICY_TUPLE_DRIFT",
    });

    const storedFirst = await harness.repositories.getCompiledPolicy(firstPolicy.policyId);
    expect(storedFirst?.toSnapshot().policyState).toBe("superseded");
    expect(storedFirst?.toSnapshot().effectiveUntil).toBe(atMinute(30));
  });
});
