import { describe, expect, it } from "vitest";
import { buildPhase7ChannelReconciliation } from "../../tools/conformance/reconcile_473_phase7_deferred_channel";

describe("task 473 Phase 7 blocked and stale reconciliation scenarios", () => {
  it("blocks reconciliation when a manifest route contract is withdrawn", () => {
    const artifact = buildPhase7ChannelReconciliation("blocked_manifest_route_withdrawn");

    expect(artifact.reconciliation.readinessPredicate.state).toBe("blocked");
    expect(artifact.rowPatch.patchState).toBe("blocked");
    expect(artifact.rowPatch.rowStateAfterPatch).toBe("blocked");
    expect(artifact.masterScorecardAfter.scorecardState).toBe("blocked");
    expect(artifact.masterScorecardAfter.channelActivationPermitted).toBe(false);
    expect(artifact.blockers.blockers[0]?.reasonCode).toBe(
      "manifest_approved_but_route_contract_withdrawn",
    );
    expect(
      artifact.coverageMatrix.rows.some(
        (row) => row.routeFamily === "booking" && row.coverageState === "blocked",
      ),
    ).toBe(true);
  });

  it("freezes reconcile-as-complete when manifest and runtime tuple are stale", () => {
    const artifact = buildPhase7ChannelReconciliation("stale_manifest_runtime_tuple");

    expect(artifact.reconciliation.readinessPredicate.state).toBe("stale");
    expect(artifact.rowPatch.patchState).toBe("stale");
    expect(artifact.rowPatch.rowStateAfterPatch).toBe("stale");
    expect(artifact.masterScorecardAfter.scorecardState).toBe("blocked");
    expect(artifact.blockers.blockers[0]?.reasonCode).toBe("stale_manifest_runtime_tuple");
    expect(
      artifact.coverageMatrix.rows.some(
        (row) => row.routeFamily === "status" && row.coverageState === "stale",
      ),
    ).toBe(true);
  });

  it("covers required edge cases including explicit not-applicable tenants", () => {
    const artifact = buildPhase7ChannelReconciliation();
    const edgeCaseIds = artifact.coverageMatrix.edgeCaseMatrix.map(
      (edgeCase: any) => edgeCase.edgeCaseId,
    );

    for (const edgeCaseId of [
      "sandpit_exact_aos_missing",
      "scal_submitted_not_signed",
      "manifest_approved_route_contract_withdrawn",
      "limited_release_monthly_data_missing",
      "embedded_download_or_print_unsupported_without_fallback",
      "status_freeze_present_booking_pharmacy_absent",
      "scorecard_deferred_but_exposure_flag_on",
      "tenant_not_applicable_explicit",
    ]) {
      expect(edgeCaseIds).toContain(edgeCaseId);
    }

    const notApplicable = buildPhase7ChannelReconciliation("not_applicable_tenant");
    expect(notApplicable.reconciliation.readinessPredicate.state).toBe("not_applicable");
    expect(notApplicable.rowPatch.rowStateAfterPatch).toBe("not_applicable");
    expect(notApplicable.masterScorecardAfter.scorecardState).toBe("exact");
    expect(notApplicable.masterScorecardAfter.channelActivationPermitted).toBe(false);
  });
});
