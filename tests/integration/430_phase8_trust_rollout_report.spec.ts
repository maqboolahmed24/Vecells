import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE8_TRUST_ROLLOUT_EVALUATOR_VERSION,
  evaluatePhase8TrustRolloutCorpus,
  type Phase8TrustRolloutCorpus,
  type Phase8TrustRolloutReport,
  type Phase8TrustRolloutThresholdConfig,
} from "../../packages/domains/assistive_evaluation/src/phase8-trust-rollout-regression.ts";

const root = path.resolve(__dirname, "..", "..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

describe("430 phase8 trust rollout report", () => {
  it("recomputes deterministic report evidence from fixtures and thresholds", () => {
    const corpus = readJson<Phase8TrustRolloutCorpus>("data/fixtures/430_phase8_trust_rollout_fixtures.json");
    const thresholds = readJson<Phase8TrustRolloutThresholdConfig>("data/config/430_phase8_trust_rollout_thresholds.json");
    const report = readJson<Phase8TrustRolloutReport>("data/analysis/430_phase8_trust_rollout_report.json");

    const recomputed = evaluatePhase8TrustRolloutCorpus(corpus, thresholds, {
      commit: report.commit,
      generatedAt: thresholds.seededClock,
      evaluatorVersion: PHASE8_TRUST_ROLLOUT_EVALUATOR_VERSION,
      command: "pnpm test:phase8:trust-rollout",
    });

    expect(report.summary).toEqual(recomputed.summary);
    expect(report.metrics).toEqual(recomputed.metrics);
    expect(report.thresholdComparisons).toEqual(recomputed.thresholdComparisons);
    expect(report.evidenceArtifactRef).toMatch(/^phase8-trust-rollout-evidence:/);
    expect(report.seededClock).toBe("2026-04-27T11:00:00.000Z");
    expect(report.failedFixtures).toEqual([]);
  });

  it("writes Phase 8 exit consumable trust rollout artifacts", () => {
    const summary = fs.readFileSync(path.join(root, "data/analysis/430_phase8_trust_rollout_summary.md"), "utf8");
    const thresholdTable = fs.readFileSync(path.join(root, "data/analysis/430_phase8_trust_rollout_thresholds.csv"), "utf8");
    const failedFixtures = readJson<string[]>("data/analysis/430_phase8_trust_rollout_failed_fixtures.json");

    expect(summary).toContain("Suite passed: yes");
    expect(summary).toContain("Threshold table");
    expect(thresholdTable).toContain("trustStateCoverageRate");
    expect(thresholdTable).toContain("rolloutVerdictParityRate");
    expect(failedFixtures).toEqual([]);
  });
});
