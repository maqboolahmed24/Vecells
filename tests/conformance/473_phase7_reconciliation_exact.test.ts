import { describe, expect, it } from "vitest";
import { buildPhase7ChannelReconciliation } from "../../tools/conformance/reconcile_473_phase7_deferred_channel";

describe("task 473 Phase 7 exact reconciliation scenario", () => {
  it("marks the Phase 7 row exact only when every channel authority input is available", () => {
    const artifact = buildPhase7ChannelReconciliation("ready_to_reconcile");

    expect(artifact.reconciliation.readinessPredicate.state).toBe("ready_to_reconcile");
    expect(artifact.rowPatch.patchState).toBe("ready_to_reconcile");
    expect(artifact.rowPatch.rowStateAfterPatch).toBe("exact");
    expect(artifact.rowPatch.mandatoryForCurrentCoreReleaseAfterPatch).toBe(true);
    expect(artifact.rowPatch.channelActivationPermitted).toBe(true);
    expect(artifact.rowPatch.scalBundleRef).toBe("SCALBundle:396:sandpit-aos:current");
    expect(artifact.masterScorecardAfter.scorecardState).toBe("exact");
    expect(artifact.masterScorecardAfter.channelActivationPermitted).toBe(true);
    expect(artifact.blockers.blockers).toHaveLength(0);
    expect(
      artifact.reconciliation.readinessPredicate.optionalFutureInputStates.every(
        (input) => input.availabilityState === "available",
      ),
    ).toBe(true);
    expect(artifact.coverageMatrix.rows.every((row) => row.coverageState === "exact")).toBe(true);
  });
});
