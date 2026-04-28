import { describe, expect, it } from "vitest";
import { createAssistiveFreezePlane } from "../../packages/domains/assistive_freeze/src/index.ts";
import { actor, fixedClock } from "./416_test_helpers.ts";

describe("416 session, anchor, decision, and insert target invalidation", () => {
  it("invalidates affected chains and patch leases on decision or insertion drift", () => {
    const plane = createAssistiveFreezePlane({ clock: fixedClock });

    const invalidation = plane.sessionInvalidations.invalidateSession(
      {
        assistiveSessionRef: "assistive-session:case-001",
        watchTupleHash: "watch-tuple-hash:doc:v1",
        trustProjectionRef: "trust-projection:trusted:v1",
        rolloutVerdictRef: "rollout-verdict:staff-pilot-a",
        affectedFeedbackChainRefs: ["feedback-chain:case-001"],
        affectedPatchLeaseRefs: ["draft-patch-lease:old"],
        affectedWorkProtectionLeaseRefs: ["work-protection-lease:case-001"],
        triggerType: "insertion_point_drift",
        triggerRef: "draft-insertion-point:case-001",
        selectedAnchorRef: "selected-anchor:old",
        decisionEpochRef: "decision-epoch:old",
        insertionPointRef: "draft-insertion-point:case-001",
      },
      actor("session_invalidation_service"),
    );

    expect(invalidation.recoveryRequired).toBe(true);
    expect(invalidation.invalidatedSurfaces).toEqual(
      expect.arrayContaining(["session", "feedback_chain", "draft_patch_lease"]),
    );
    expect(invalidation.staleActionBlockers).toEqual(
      expect.arrayContaining(["accept", "insert", "completion_adjacent"]),
    );
  });

  it("requires explicit reclearance and rejects reuse of the old patch lease", () => {
    const plane = createAssistiveFreezePlane({ clock: fixedClock });
    const invalidation = plane.sessionInvalidations.invalidateSession(
      {
        assistiveSessionRef: "assistive-session:case-001",
        watchTupleHash: "watch-tuple-hash:doc:v1",
        trustProjectionRef: "trust-projection:trusted:v1",
        rolloutVerdictRef: "rollout-verdict:staff-pilot-a",
        affectedPatchLeaseRefs: ["draft-patch-lease:old"],
        triggerType: "selected_anchor_drift",
        triggerRef: "selected-anchor:new",
        selectedAnchorRef: "selected-anchor:old",
      },
      actor("session_invalidation_service"),
    );

    const rejected = plane.reclearance.reclearSession(
      {
        assistiveSessionRef: "assistive-session:case-001",
        previousSessionInvalidationRef: invalidation.sessionInvalidationRecordId,
        previousPatchLeaseRefs: ["draft-patch-lease:old"],
        replacementPatchLeaseRefs: ["draft-patch-lease:old"],
        method: "regeneration",
        requiredFreshRefs: ["policy-freshness:current", "publication-freshness:current"],
        freezeReleased: true,
        policyFresh: true,
        publicationFresh: true,
        trustFresh: true,
      },
      actor("session_reclearance_service"),
    );
    const cleared = plane.reclearance.reclearSession(
      {
        assistiveSessionRef: "assistive-session:case-001",
        previousSessionInvalidationRef: invalidation.sessionInvalidationRecordId,
        previousPatchLeaseRefs: ["draft-patch-lease:old"],
        replacementPatchLeaseRefs: ["draft-patch-lease:new"],
        method: "regeneration",
        requiredFreshRefs: ["policy-freshness:current", "publication-freshness:current"],
        freezeReleased: true,
        policyFresh: true,
        publicationFresh: true,
        trustFresh: true,
      },
      actor("session_reclearance_service"),
    );

    expect(rejected.reclearanceState).toBe("blocked");
    expect(rejected.blockingReasonCodes).toContain("previous_patch_lease_cannot_be_reused");
    expect(cleared.reclearanceState).toBe("cleared");
    expect(cleared.replacementPatchLeaseRefs).toEqual(["draft-patch-lease:new"]);
  });
});
