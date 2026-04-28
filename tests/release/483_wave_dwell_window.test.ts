import { describe, expect, it } from "vitest";
import { build483ScenarioRecords } from "../../tools/release/monitor_483_wave1";

describe("483 Wave 1 dwell window", () => {
  it("declares stable only after the 24 hour dwell window and sample count are complete", () => {
    const stable = build483ScenarioRecords("stable", []);

    expect(stable.dwellWindowEvidence.minimumObservationHours).toBe(24);
    expect(stable.dwellWindowEvidence.observedHours).toBe(24);
    expect(stable.dwellWindowEvidence.requiredSamples).toBe(288);
    expect(stable.dwellWindowEvidence.observedSamples).toBe(288);
    expect(stable.dwellWindowEvidence.evidenceComplete).toBe(true);
    expect(stable.stabilityVerdict.stabilityState).toBe("stable");
    expect(stable.wideningEligibility.wideningEnabled).toBe(true);
  });

  it("keeps observing when point metrics are green but dwell is incomplete", () => {
    const observing = build483ScenarioRecords("observing", []);

    expect(observing.dwellWindowEvidence.pointMetricsGreen).toBe(true);
    expect(observing.dwellWindowEvidence.dwellSatisfied).toBe(false);
    expect(observing.dwellWindowEvidence.state).toBe("observing");
    expect(observing.stabilityVerdict.stabilityState).toBe("observing");
    expect(observing.wideningEligibility.wideningEnabled).toBe(false);
  });

  it("blocks widening when the dwell window elapsed but approved samples are insufficient", () => {
    const insufficient = build483ScenarioRecords("insufficient_evidence", []);

    expect(insufficient.dwellWindowEvidence.dwellSatisfied).toBe(true);
    expect(insufficient.dwellWindowEvidence.evidenceComplete).toBe(false);
    expect(insufficient.dwellWindowEvidence.state).toBe("insufficient_evidence");
    expect(insufficient.stabilityVerdict.stabilityState).toBe("insufficient_evidence");
    expect(insufficient.wideningEligibility.eligibilityState).toBe("insufficient_evidence");
  });

  it("recommends rollback when runtime publication parity becomes stale", () => {
    const stale = build483ScenarioRecords("runtime_parity_stale", []);

    expect(stale.runtimeHealthSample.state).toBe("stale");
    expect(stale.stabilityVerdict.stabilityState).toBe("rollback_recommended");
    expect(stale.rollbackRecommendations).toHaveLength(1);
    expect(stale.wideningEligibility.wideningEnabled).toBe(false);
  });

  it("blocks stability when active channel monthly data is missing", () => {
    const blocked = build483ScenarioRecords("channel_monthly_missing", []);

    expect(blocked.assistiveChannelPostureSample.activeChannelCohort).toBe(true);
    expect(blocked.assistiveChannelPostureSample.channelMonthlyDataState).toBe("missing");
    expect(blocked.assistiveChannelPostureSample.state).toBe("blocked");
    expect(blocked.stabilityVerdict.stabilityState).toBe("blocked");
  });
});
