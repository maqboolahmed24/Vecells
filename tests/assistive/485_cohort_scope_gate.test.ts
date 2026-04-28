import { describe, expect, it } from "vitest";
import { build485ScenarioRecords } from "../../tools/assistive/enable_485_visible_modes";

describe("485 assistive cohort and route scope gate", () => {
  it("publishes exact exposure proof for the approved narrow visible-insert cohort", () => {
    const approved = build485ScenarioRecords("visible_insert_approved", []);

    expect(approved.scope.sliceMembershipState).toBe("in_slice");
    expect(approved.exposureProof.visibleStaffCount).toBe(10);
    expect(approved.exposureProof.insertEnabledStaffCount).toBe(10);
    expect(approved.exposureProof.hiddenOutsideCohort).toBe(true);
    expect(approved.exposureProof.broadFlagLeakageState).toBe("none");
  });

  it("hides assistive chrome when the staff cohort is outside the approved slice", () => {
    const hidden = build485ScenarioRecords("hidden_out_of_slice", []);

    expect(hidden.scope.sliceMembershipState).toBe("out_of_slice");
    expect(hidden.scope.scopeState).toBe("hidden");
    expect(hidden.eligibilityVerdict.eligibleMode).toBe("hidden");
    expect(hidden.exposureProof.visibleStaffCount).toBe(0);
    expect(hidden.exposureProof.insertEnabledStaffCount).toBe(0);
  });

  it("keeps visible summary while blocking insert when insert evidence is missing", () => {
    const summary = build485ScenarioRecords("insert_evidence_missing", []);

    expect(summary.rolloutVerdict.rolloutRung).toBe("visible_summary");
    expect(summary.rolloutVerdict.insertEvidenceState).toBe("missing");
    expect(summary.eligibilityVerdict.eligibleMode).toBe("visible_summary");
    expect(summary.eligibilityVerdict.visibleSummaryAllowed).toBe(true);
    expect(summary.eligibilityVerdict.visibleInsertAllowed).toBe(false);
    expect(summary.eligibilityVerdict.insertControlsVisible).toBe(false);
  });

  it("blocks stale route contracts even when staff training is exact", () => {
    const stale = build485ScenarioRecords("route_contract_stale", []);

    expect(stale.trainingEvidence.trainingState).toBe("exact");
    expect(stale.rolloutVerdict.routeContractState).toBe("stale");
    expect(stale.rolloutVerdict.publicationState).toBe("stale");
    expect(stale.eligibilityVerdict.blockerRefs).toContain(
      "blocker:485:surface-route-contract-stale",
    );
    expect(stale.command.commandState).toBe("blocked");
  });

  it("uses one watch tuple with different route-family verdicts without leaking insert controls", () => {
    const visible = build485ScenarioRecords("split_route_visible_insert", []);
    const shadow = build485ScenarioRecords("split_route_shadow_only", []);

    expect(visible.rolloutVerdict.watchTupleHash).toBe(shadow.rolloutVerdict.watchTupleHash);
    expect(visible.rolloutVerdict.routeFamilyRef).toBe("clinical_documentation");
    expect(shadow.rolloutVerdict.routeFamilyRef).toBe("self_care_boundary");
    expect(visible.eligibilityVerdict.visibleInsertAllowed).toBe(true);
    expect(shadow.eligibilityVerdict.visibleInsertAllowed).toBe(false);
    expect(shadow.eligibilityVerdict.eligibleMode).toBe("shadow");
    expect(
      visible.exposureProof.routeModeMap.some(
        (entry) =>
          entry.routeFamilyRef === "self_care_boundary" &&
          entry.mode === "shadow" &&
          !entry.insertControlsVisible,
      ),
    ).toBe(true);
  });
});
