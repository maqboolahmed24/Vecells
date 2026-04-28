import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  BREACH_RISK_THRESHOLDS,
  LOAD_SOAK_SCENARIOS,
  evaluateBreachRiskSeries,
  runPhase9LoadSoakSuite,
} from "../performance/465_phase9_load_soak_scenarios";

describe("task 465 breach risk engine contract", () => {
  it("covers realistic Phase 9 load seams with deterministic scenarios", () => {
    const evidence = runPhase9LoadSoakSuite();
    expect(evidence.scenarioCount).toBe(11);
    expect(evidence.totalSyntheticEvents).toBeGreaterThan(50_000);
    expect(Object.keys(evidence.requiredScenarioCoverage).sort()).toEqual(
      LOAD_SOAK_SCENARIOS.map((scenario) => scenario.scenarioId).sort(),
    );
    expect(new Set(LOAD_SOAK_SCENARIOS.map((scenario) => scenario.routeFamily)).size).toBe(8);
  });

  it("enters elevated and critical only with support plus thresholds", () => {
    for (const scenario of LOAD_SOAK_SCENARIOS) {
      const outcomes = evaluateBreachRiskSeries(scenario);
      for (const outcome of outcomes) {
        if (outcome.transition === "enter_elevated") {
          expect(outcome.supportSatisfied).toBe(true);
          expect(outcome.riskScore).toBeGreaterThanOrEqual(BREACH_RISK_THRESHOLDS.elevatedEnter);
        }
        if (outcome.transition === "enter_critical") {
          expect(outcome.supportSatisfied).toBe(true);
          expect(outcome.riskScore).toBeGreaterThanOrEqual(BREACH_RISK_THRESHOLDS.criticalEnter);
        }
        if (outcome.transition === "suppressed_by_support") {
          expect(outcome.level).not.toMatch(/elevated|critical/);
        }
      }
    }
  });

  it("proves exit hysteresis and avoids alert flapping", () => {
    const hysteresis = LOAD_SOAK_SCENARIOS.find(
      (scenario) => scenario.scenarioId === "alert_threshold_hysteresis",
    );
    expect(hysteresis).toBeDefined();
    const outcomes = evaluateBreachRiskSeries(hysteresis!);
    expect(outcomes.map((outcome) => outcome.transition)).toContain("enter_elevated");
    expect(outcomes.map((outcome) => outcome.transition)).toContain("enter_critical");
    expect(outcomes.map((outcome) => outcome.transition)).toContain("exit_critical_to_elevated");
    expect(outcomes.map((outcome) => outcome.transition)).toContain("exit_elevated_to_watch");

    const criticalExitIndex = outcomes.findIndex(
      (outcome) => outcome.transition === "exit_critical_to_elevated",
    );
    expect(
      outcomes
        .slice(criticalExitIndex - 1, criticalExitIndex + 1)
        .every((outcome) => outcome.riskScore < BREACH_RISK_THRESHOLDS.criticalExit),
    ).toBe(true);

    const elevatedExitIndex = outcomes.findIndex(
      (outcome) => outcome.transition === "exit_elevated_to_watch",
    );
    expect(
      outcomes
        .slice(elevatedExitIndex - 2, elevatedExitIndex + 1)
        .every((outcome) => outcome.riskScore < BREACH_RISK_THRESHOLDS.elevatedExit),
    ).toBe(true);

    const evidence = runPhase9LoadSoakSuite();
    expect(evidence.alertFlappingGapClosed).toBe(true);
  });

  it("keeps stale, degraded, and quarantined projections fail-closed in operations posture", () => {
    const evidence = runPhase9LoadSoakSuite();
    const degraded = evidence.scenarioOutcomes.find(
      (outcome) => outcome.scenarioId === "assistive_vendor_degradation",
    );
    const stale = evidence.scenarioOutcomes.find(
      (outcome) => outcome.scenarioId === "projection_lag_recovery",
    );
    const quarantined = evidence.scenarioOutcomes.find(
      (outcome) => outcome.scenarioId === "queue_heatmap_cross_slice",
    );

    expect(degraded?.projection.healthState).toBe("degraded");
    expect(degraded?.opsUi.observedHarnessPosture).not.toBe("executable");
    expect(stale?.projection.healthState).toBe("stale");
    expect(stale?.opsUi.observedHarnessPosture).toBe("stale_reacquire");
    expect(quarantined?.projection.healthState).toBe("quarantined");
    expect(quarantined?.opsUi.observedHarnessPosture).toBe("read_only_recovery");
  });

  it("delivers only redacted synthetic breach alert summaries", () => {
    const evidence = runPhase9LoadSoakSuite();
    expect(evidence.alertDeliveryProbes).toHaveLength(1);
    const probe = evidence.alertDeliveryProbes[0]!;
    expect(probe.redactedSyntheticSummaryOnly).toBe(true);
    expect(JSON.stringify(probe.payload)).not.toMatch(
      /https?:\/\/|accessToken|credential|rawWebhookUrl|inlineSecret|nhsNumber|patient/i,
    );
    expect(probe.payload.syntheticSummary.toLowerCase()).toContain("synthetic");
  });

  it("keeps generated evidence artifacts available", () => {
    const root = process.cwd();
    for (const relativePath of [
      "tests/performance/465_breach_detection_expected_outcomes.json",
      "data/evidence/465_load_soak_breach_queue_heatmap_results.json",
      "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_465_LOAD_SOAK_TOOLING.json",
    ]) {
      expect(fs.existsSync(path.join(root, relativePath))).toBe(true);
    }
  });
});
