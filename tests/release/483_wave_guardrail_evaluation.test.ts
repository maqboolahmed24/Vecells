import { describe, expect, it } from "vitest";
import {
  build483Records,
  build483ScenarioRecords,
  hashValue,
  required483EdgeCases,
} from "../../tools/release/monitor_483_wave1";

describe("483 Wave 1 guardrail evaluation", () => {
  it("marks the active stable scenario exact across guardrails", () => {
    const stable = build483ScenarioRecords("stable", []);

    expect(stable.stabilityVerdict.stabilityState).toBe("stable");
    expect(stable.stabilityVerdict.blockerRefs).toEqual([]);
    expect(stable.guardrailEvaluations.every((entry) => entry.state === "exact")).toBe(true);
    expect(stable.wideningEligibility.wideningEnabled).toBe(true);
  });

  it("covers every required observation edge case", () => {
    const records = build483Records([]);
    const edgeCaseIds = new Set(
      (records.edgeCaseFixtures.fixtures as any[]).map((fixture) => fixture.edgeCaseId),
    );

    for (const edgeCase of required483EdgeCases) {
      expect(edgeCaseIds.has(edgeCase)).toBe(true);
    }
  });

  it("does not hide a tenant-slice incident behind a healthy aggregate", () => {
    const incident = build483ScenarioRecords("tenant_slice_incident", []);

    expect(incident.incidentCorrelation.aggregateState).toBe("exact");
    expect(incident.incidentCorrelation.sliceState).toBe("breached");
    expect(incident.incidentCorrelation.aggregateHealthyButSliceBreach).toBe(true);
    expect(incident.stabilityVerdict.stabilityState).toBe("pause_recommended");
    expect(incident.pauseRecommendations).toHaveLength(1);
    expect(incident.stabilityVerdict.blockerRefs).toContain(
      "blocker:483:tenant-slice-incident-spike-hidden-by-aggregate",
    );
  });

  it("pauses for staff-queue projection lag even when aggregate projection lag is green", () => {
    const lag = build483ScenarioRecords("staff_queue_projection_lag", []);

    expect(lag.projectionLagSample.aggregateMaxLagSeconds).toBeLessThanOrEqual(
      lag.projectionLagSample.threshold,
    );
    expect(lag.projectionLagSample.maxLagSeconds).toBeGreaterThan(
      lag.projectionLagSample.threshold,
    );
    expect(lag.projectionLagSample.routeFamilyRef).toBe("staff_queue");
    expect(lag.stabilityVerdict.stabilityState).toBe("pause_recommended");
  });

  it("pauses for support load while technical probes continue to pass", () => {
    const support = build483ScenarioRecords("support_load_breach", []);

    expect(support.supportSample.technicalProbeState).toBe("exact");
    expect(support.supportSample.state).toBe("breached");
    expect(
      support.guardrailEvaluations
        .filter((entry) => entry.ruleKind !== "support_load")
        .every((entry) => entry.state === "exact"),
    ).toBe(true);
    expect(support.stabilityVerdict.stabilityState).toBe("pause_recommended");
  });

  it("hashes observation verdicts deterministically", () => {
    const stable = build483ScenarioRecords("stable", []);
    const { recordHash, ...withoutHash } = stable.stabilityVerdict;

    expect(recordHash).toBe(hashValue(withoutHash));
  });
});
