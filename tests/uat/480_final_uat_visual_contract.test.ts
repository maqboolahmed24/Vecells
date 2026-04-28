import { describe, expect, it } from "vitest";
import { build480FinalUATScenarios, hashValue } from "../../tools/testing/run_480_final_uat_visual";

const requiredEdgeCases = [
  "edge_480_nondeterministic_timestamp_or_skeleton_masked",
  "edge_480_dense_ops_table_not_patient_editable",
  "edge_480_support_drawer_focus_live_update",
  "edge_480_blocked_state_visible",
  "edge_480_chart_table_fallback_labels",
  "edge_480_nhs_app_mobile_no_fixed_rail_overflow",
  "edge_480_assistive_provenance_not_authority",
] as const;

describe("480 final UAT and visual regression contract", () => {
  it("enumerates all required role, route, accessibility, and visual edge cases", () => {
    const scenarios = build480FinalUATScenarios();
    const families = new Set(scenarios.map((scenario) => scenario.scenarioFamily));
    const edgeCases = new Set(scenarios.flatMap((scenario) => scenario.requiredEdgeCaseRefs));

    expect(scenarios.length).toBeGreaterThanOrEqual(8);
    expect(families).toEqual(
      new Set([
        "patient",
        "staff",
        "operations",
        "governance_release",
        "assistive_channel",
        "visual_regression",
        "accessibility",
      ]),
    );
    for (const edgeCase of requiredEdgeCases) {
      expect(edgeCases.has(edgeCase)).toBe(true);
    }
  });

  it("keeps the deferred NHS App channel constrained without blocking core web UAT", () => {
    const scenarios = build480FinalUATScenarios();
    const channel = scenarios.find(
      (scenario) => scenario.scenarioId === "uat_480_nhs_app_mobile_channel",
    );
    expect(channel?.expectedState).toBe("accepted_with_constraints");
    expect(channel?.blockerRefs).toContain("constraint:480:nhs-app-channel-deferred");
    expect(channel?.channelScope).toContain("nhs-app-deferred");
  });

  it("binds every scenario to release/runtime tuples and deterministic hashes", () => {
    const scenarios = build480FinalUATScenarios();
    for (const scenario of scenarios) {
      expect(scenario.releaseCandidateRef).toBe("RC_LOCAL_V1");
      expect(scenario.runtimePublicationBundleRef).toBe("rpb::local::authoritative");
      expect(scenario.releaseWatchTupleRef).toBe("RWT_LOCAL_V1");
      expect(scenario.routeRefs.length).toBeGreaterThan(0);
      expect(scenario.viewportRefs.length).toBeGreaterThan(0);
      const { recordHash, ...withoutHash } = scenario;
      expect(recordHash).toBe(hashValue(withoutHash));
    }
  });

  it("uses synthetic-only route and role references", () => {
    const serialized = JSON.stringify(build480FinalUATScenarios());
    expect(serialized).not.toMatch(
      /patientNhs|nhsNumber|Bearer |access_token|refresh_token|PRIVATE KEY|sk_live/i,
    );
  });
});
