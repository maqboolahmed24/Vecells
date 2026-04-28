import { describe, expect, it } from "vitest";
import {
  build477FinalSignoffArtifacts,
  type Signoff477Scenario,
} from "../../tools/assurance/prepare_477_final_signoffs";

describe("Task 477 fail-closed exception gate", () => {
  it.each([
    ["missing_signoff", "privacy_records"],
    ["expired_signoff", "clinical_safety"],
    ["tuple_mismatch", "regulatory_dtac"],
    ["blocked", "privacy_records"],
    ["exception_blocking", "downstream_launch_authority"],
  ] as const)("blocks launch approval for %s", (scenario: Signoff477Scenario, laneId) => {
    const { finalSignoffRegister: register } = build477FinalSignoffArtifacts(scenario);

    expect(register.signoffReviewPermitted).toBe(false);
    expect(register.launchApprovalPermitted).toBe(false);
    expect(register.launchDecision.signoffBlockerCount).toBeGreaterThan(0);

    const laneBlocked =
      register.authorities.some(
        (authority) =>
          authority.laneId === laneId &&
          ["missing", "expired", "tuple_mismatch", "blocked"].includes(authority.signoffState),
      ) ||
      register.activeExceptions.some(
        (entry) => entry.laneId === laneId && entry.effectiveClassification === "launch-blocking",
      );
    expect(laneBlocked).toBe(true);
  });

  it("keeps source algorithm classification authoritative over declared non-blocking labels", () => {
    const { finalSignoffRegister: register } = build477FinalSignoffArtifacts("exception_blocking");
    const overridden = register.activeExceptions.find(
      (entry) => entry.exceptionId === "ex_477_exception_register_understates_blocker",
    );

    expect(overridden?.declaredClassification).toBe("BAU-follow-up");
    expect(overridden?.sourceAlgorithmClassification).toBe("launch-blocking");
    expect(overridden?.effectiveClassification).toBe("launch-blocking");
  });

  it("records all required edge-case proofs as blocking when they enter scope", () => {
    const { finalSignoffRegister: register } = build477FinalSignoffArtifacts();
    expect(register.edgeCaseRegressionFixtures.map((edge) => edge.edgeCaseId)).toEqual(
      expect.arrayContaining([
        "edge_477_clinical_core_web_signed_assistive_visible_missing",
        "edge_477_dpia_old_telemetry_destination",
        "edge_477_medium_pentest_waiver_missing_expiry",
        "edge_477_supplier_tenant_scope_mismatch",
        "edge_477_accessibility_desktop_only",
        "edge_477_dtac_superseded_release_candidate",
        "edge_477_exception_non_blocking_claim_overridden",
      ]),
    );

    for (const edge of register.edgeCaseRegressionFixtures) {
      expect(edge.sourceAlgorithmClassification).toBe("launch-blocking");
      expect((edge.blockerRefs as readonly string[]).length).toBeGreaterThan(0);
    }
  });
});
