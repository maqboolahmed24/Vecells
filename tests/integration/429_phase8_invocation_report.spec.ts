import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE8_INVOCATION_REGRESSION_EVALUATOR_VERSION,
  evaluatePhase8InvocationCorpus,
  type Phase8InvocationRegressionCorpus,
  type Phase8InvocationRegressionReport,
  type Phase8InvocationThresholdConfig,
} from "../../packages/domains/assistive_evaluation/src/phase8-invocation-regression.ts";

const root = path.resolve(__dirname, "..", "..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

describe("429 phase8 invocation regression report", () => {
  it("recomputes deterministic exit-gate evidence from fixtures and thresholds", () => {
    const corpus = readJson<Phase8InvocationRegressionCorpus>("data/fixtures/429_phase8_invocation_regression_fixtures.json");
    const thresholds = readJson<Phase8InvocationThresholdConfig>("data/config/429_phase8_invocation_thresholds.json");
    const report = readJson<Phase8InvocationRegressionReport>("data/analysis/429_phase8_invocation_report.json");

    const recomputed = evaluatePhase8InvocationCorpus(corpus, thresholds, {
      commit: report.commit,
      generatedAt: thresholds.seededClock,
      evaluatorVersion: PHASE8_INVOCATION_REGRESSION_EVALUATOR_VERSION,
      command: "pnpm test:phase8:invocation",
    });

    expect(report.summary).toEqual(recomputed.summary);
    expect(report.metrics).toEqual(recomputed.metrics);
    expect(report.thresholdComparisons).toEqual(recomputed.thresholdComparisons);
    expect(report.evidenceArtifactRef).toMatch(/^phase8-invocation-evidence:/);
    expect(report.seededClock).toBe("2026-04-27T10:00:00.000Z");
    expect(report.failedFixtures).toEqual([]);
  });

  it("writes human and machine readable artifacts for Phase 8 exit review", () => {
    const summary = fs.readFileSync(path.join(root, "data/analysis/429_phase8_invocation_summary.md"), "utf8");
    const thresholdTable = fs.readFileSync(path.join(root, "data/analysis/429_phase8_invocation_thresholds.csv"), "utf8");
    const failedFixtures = readJson<string[]>("data/analysis/429_phase8_invocation_failed_fixtures.json");

    expect(summary).toContain("Suite passed: yes");
    expect(summary).toContain("Threshold table");
    expect(thresholdTable).toContain("killSwitchCoverageRate");
    expect(thresholdTable).toContain("prohibitedNetworkMutationRate");
    expect(failedFixtures).toEqual([]);
  });
});
