import { describe, expect, it } from "vitest";
import { createAssistiveMonitoringPlane } from "../../packages/domains/assistive_monitoring/src/index.ts";
import { actor, fixedClock, watchTupleCommand } from "./415_test_helpers.ts";

describe("415 watch tuple and posture projection", () => {
  it("keeps watch tuples immutable and defaults missing visible evidence to shadow-only", () => {
    const plane = createAssistiveMonitoringPlane({ clock: fixedClock });
    const tuple = plane.watchTuples.registerWatchTuple(
      {
        ...watchTupleCommand(),
        assistiveCapabilityWatchTupleId: "watch-tuple:fixed",
      },
      actor("watch_tuple_registry"),
    );

    expect(() =>
      plane.watchTuples.registerWatchTuple(
        {
          ...watchTupleCommand(),
          assistiveCapabilityWatchTupleId: "watch-tuple:fixed",
          promptBundleHash: "prompt-bundle-hash:different",
        },
        actor("watch_tuple_registry"),
      ),
    ).toThrow(/watch_tuple_immutable/);

    const projection = plane.trustProjections.materializeTrustProjection(
      {
        watchTupleHash: tuple.watchTupleHash,
        audienceTier: "staff",
        assuranceSliceTrustRefs: ["assurance-slice:assistive-doc"],
        surfacePublicationState: "published",
        runtimePublicationBundleRef: "runtime-publication:phase8:v1",
        runtimePublicationState: "current",
        assistiveKillSwitchState: "inactive",
        freezeState: "none",
        releaseRecoveryDispositionRef: "release-recovery:assistive:v1",
        calibrationEvidenceState: "missing",
        uncertaintyEvidenceState: "complete",
        outcomeEvidenceState: "complete",
        visibleEvidenceState: "missing",
        disclosureFenceState: "healthy",
      },
      actor("trust_projection_engine"),
    );

    expect(projection.trustState).toBe("shadow_only");
    expect(projection.visibilityEligibilityState).toBe("blocked");
    expect(projection.blockingReasonCodes).toEqual(
      expect.arrayContaining(["calibration_evidence_incomplete", "visible_evidence_incomplete"]),
    );
  });

  it("publishes route and cohort posture without widening across stale publication or slice blockers", () => {
    const plane = createAssistiveMonitoringPlane({ clock: fixedClock });
    const tuple = plane.watchTuples.registerWatchTuple(
      watchTupleCommand(),
      actor("watch_tuple_registry"),
    );
    const projection = plane.trustProjections.materializeTrustProjection(
      {
        watchTupleHash: tuple.watchTupleHash,
        audienceTier: "staff",
        assuranceSliceTrustRefs: ["assurance-slice:assistive-doc"],
        surfacePublicationState: "published",
        runtimePublicationBundleRef: "runtime-publication:phase8:v1",
        runtimePublicationState: "current",
        assistiveKillSwitchState: "inactive",
        freezeState: "none",
        releaseRecoveryDispositionRef: "release-recovery:assistive:v1",
        calibrationEvidenceState: "complete",
        uncertaintyEvidenceState: "complete",
        outcomeEvidenceState: "complete",
        visibleEvidenceState: "complete",
        disclosureFenceState: "healthy",
      },
      actor("trust_projection_engine"),
    );

    const visiblePosture = plane.currentPostures.resolveCurrentPosture(
      {
        trustProjectionRef: projection.assistiveCapabilityTrustProjectionId,
        rolloutSliceContractRef: "rollout-slice:staff-pilot-a",
        routeFamilyRef: "clinical-workspace",
        audienceTier: "staff",
        releaseCohortRef: "release-cohort:staff-pilot-a",
        sliceMembershipState: "in_slice",
        surfaceRouteContractRef: "surface-route-contract:clinical-workspace:v1",
        surfacePublicationRef: "surface-publication:clinical-workspace:v1",
        runtimePublicationBundleRef: "runtime-publication:phase8:v1",
        policyState: "exact",
        publicationState: "published",
        shadowEvidenceState: "complete",
        visibleEvidenceState: "complete",
        insertEvidenceState: "complete",
        commitEvidenceState: "missing",
        rolloutRung: "visible_insert",
      },
      actor("current_posture_resolver"),
    );

    const blockedPosture = plane.currentPostures.resolveCurrentPosture(
      {
        trustProjectionRef: projection.assistiveCapabilityTrustProjectionId,
        rolloutSliceContractRef: "rollout-slice:staff-pilot-b",
        routeFamilyRef: "clinical-workspace",
        audienceTier: "staff",
        releaseCohortRef: "release-cohort:staff-pilot-b",
        sliceMembershipState: "out_of_slice",
        surfaceRouteContractRef: "surface-route-contract:clinical-workspace:v1",
        surfacePublicationRef: "surface-publication:clinical-workspace:v1",
        runtimePublicationBundleRef: "runtime-publication:phase8:v1",
        policyState: "exact",
        publicationState: "stale",
        shadowEvidenceState: "complete",
        visibleEvidenceState: "complete",
        insertEvidenceState: "complete",
        commitEvidenceState: "complete",
        rolloutRung: "visible_commit",
      },
      actor("current_posture_resolver"),
    );

    expect(visiblePosture.postureState).toBe("current");
    expect(visiblePosture.renderPosture).toBe("visible");
    expect(visiblePosture.insertPosture).toBe("enabled");
    expect(blockedPosture.postureState).toBe("blocked");
    expect(blockedPosture.blockingReasonCodes).toEqual(
      expect.arrayContaining(["rollout_slice_not_in_scope", "publication_state_not_published"]),
    );
  });
});
