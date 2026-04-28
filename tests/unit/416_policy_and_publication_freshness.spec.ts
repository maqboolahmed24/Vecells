import { describe, expect, it } from "vitest";
import { createAssistiveFreezePlane } from "../../packages/domains/assistive_freeze/src/index.ts";
import { actor, fixedClock } from "../integration/416_test_helpers.ts";

describe("416 policy and publication freshness", () => {
  it("invalidates actionability when policy refs drift from the active bundle tuple", () => {
    const plane = createAssistiveFreezePlane({ clock: fixedClock });

    const verdict = plane.policyFreshness.validatePolicyFreshness(
      {
        assistiveSessionRef: "assistive-session:case-001",
        watchTupleHash: "watch-tuple-hash:doc:v1",
        releaseCandidateRef: "assistive-release-candidate:rc1",
        routeFamilyRef: "clinical-workspace",
        expectedPolicyBundleRef: "compiled-policy-bundle:phase8:v2",
        sessionPolicyBundleRef: "compiled-policy-bundle:phase8:v1",
        promptPolicyBundleRef: "compiled-policy-bundle:phase8:v2",
        approvalGatePolicyBundleRef: "compiled-policy-bundle:phase8:v2",
        thresholdSetPolicyBundleRef: "compiled-policy-bundle:phase8:v2",
      },
      actor("policy_freshness_validator"),
    );

    expect(verdict.freshnessState).toBe("mismatched");
    expect(verdict.invalidatesActionability).toBe(true);
    expect(verdict.blockingReasonCodes).toContain("policy_freshness_tuple_mismatch");
    expect(verdict.driftedRefs).toEqual(
      expect.arrayContaining(["sessionPolicyBundleRef:compiled-policy-bundle:phase8:v1"]),
    );
  });

  it("freezes in place when surface or runtime publication drifts", () => {
    const plane = createAssistiveFreezePlane({ clock: fixedClock });

    const verdict = plane.publicationFreshness.validatePublicationFreshness(
      {
        assistiveSessionRef: "assistive-session:case-001",
        routeFamilyRef: "clinical-workspace",
        surfaceBindingRef: "assistive-surface-binding:case-001",
        expectedSurfaceRouteContractRef: "surface-route-contract:clinical-workspace:v2",
        actualSurfaceRouteContractRef: "surface-route-contract:clinical-workspace:v1",
        expectedSurfacePublicationRef: "surface-publication:clinical-workspace:v2",
        actualSurfacePublicationRef: "surface-publication:clinical-workspace:v1",
        expectedRuntimePublicationBundleRef: "runtime-publication:phase8:v2",
        actualRuntimePublicationBundleRef: "runtime-publication:phase8:v1",
        surfacePublicationState: "stale",
        runtimePublicationState: "current",
      },
      actor("publication_freshness_validator"),
    );

    expect(verdict.freshnessState).toBe("stale");
    expect(verdict.invalidatesActionability).toBe(true);
    expect(verdict.blockingReasonCodes).toEqual(
      expect.arrayContaining(["publication_freshness_tuple_mismatch", "surface_publication_stale"]),
    );
  });
});
