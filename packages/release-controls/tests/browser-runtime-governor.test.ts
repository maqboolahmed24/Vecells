import { describe, expect, it } from "vitest";
import {
  createBrowserRuntimeSimulationHarness,
  resolveBrowserRuntimeDecision,
} from "../src/index.ts";

describe("browser runtime governor", () => {
  it("keeps patient home summary continuity read-only even when healthy", () => {
    const decision = resolveBrowserRuntimeDecision({
      routeFamilyRef: "rf_patient_home",
      environmentRing: "local",
    });

    expect(decision.effectiveBrowserPosture).toBe("read_only");
    expect(decision.actionabilityState).toBe("read_only");
    expect(decision.projectionFreshnessEnvelope.freshnessState).toBe("fresh");
  });

  it("downgrades replay-gap ambiguity into governed recovery posture", () => {
    const decision = resolveBrowserRuntimeDecision({
      routeFamilyRef: "rf_operations_board",
      environmentRing: "local",
      transportState: "replay_gap",
      projectionFreshnessState: "replay_gap",
    });

    expect(decision.effectiveBrowserPosture).toBe("recovery_only");
    expect(decision.reasonRefs).toContain("transport_replay_gap");
    expect(decision.projectionFreshnessEnvelope.freshnessState).toBe("replay_gap");
  });

  it("blocks governance routes when freeze and manifest drift stack together", () => {
    const decision = resolveBrowserRuntimeDecision({
      routeFamilyRef: "rf_governance_shell",
      environmentRing: "production",
      manifestState: "drifted",
      freezeState: "release_frozen",
    });

    expect(decision.effectiveBrowserPosture).toBe("blocked");
    expect(decision.reasonRefs).toContain("browser_manifest_drift");
    expect(decision.reasonRefs).toContain("freeze_release_frozen");
  });

  it("publishes deterministic simulation scenarios", () => {
    const harness = createBrowserRuntimeSimulationHarness();

    expect(harness.catalog.taskId).toBe("par_096");
    expect(harness.scenarios).toHaveLength(5);
    expect(harness.telemetryEvents).toHaveLength(5);
  });
});
