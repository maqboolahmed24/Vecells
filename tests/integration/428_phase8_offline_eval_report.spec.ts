import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE8_OFFLINE_EVALUATOR_VERSION,
  evaluatePhase8Corpus,
  type Phase8EvalReport,
  type Phase8OfflineEvalCorpus,
  type Phase8ThresholdConfig,
} from "../../packages/domains/assistive_evaluation/src/phase8-offline-regression.ts";

const root = path.resolve(__dirname, "..", "..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

describe("428 phase8 offline eval report", () => {
  it("produces Phase 8 exit-consumable evidence with deterministic metadata", () => {
    const corpus = readJson<Phase8OfflineEvalCorpus>("data/fixtures/428_phase8_offline_eval_corpus.json");
    const thresholds = readJson<Phase8ThresholdConfig>("data/config/428_phase8_eval_thresholds.json");
    const report = readJson<Phase8EvalReport>("data/analysis/428_phase8_eval_report.json");

    const recomputed = evaluatePhase8Corpus(corpus, thresholds, {
      commit: report.commit,
      generatedAt: thresholds.seededClock,
      evaluatorVersion: PHASE8_OFFLINE_EVALUATOR_VERSION,
      command: "pnpm test:phase8:eval",
    });

    expect(report.summary).toEqual(recomputed.summary);
    expect(report.metrics).toEqual(recomputed.metrics);
    expect(report.thresholdComparisons).toEqual(recomputed.thresholdComparisons);
    expect(report.evidenceArtifactRef).toMatch(/^phase8-eval-evidence:/);
    expect(report.modelConfigVersion).toBe("model-config:phase8:offline-deterministic:v1");
    expect(report.seededClock).toBe("2026-04-27T09:00:00.000Z");
    expect(report.failedFixtures).toEqual([]);
  });

  it("writes human and machine readable artifacts without manual spreadsheet interpretation", () => {
    const summary = fs.readFileSync(path.join(root, "data/analysis/428_phase8_eval_summary.md"), "utf8");
    const thresholdTable = fs.readFileSync(
      path.join(root, "data/analysis/428_phase8_threshold_comparison_table.csv"),
      "utf8",
    );
    const failedFixtures = readJson<string[]>("data/analysis/428_phase8_failed_fixtures.json");

    expect(summary).toContain("Suite passed: yes");
    expect(summary).toContain("Threshold table");
    expect(thresholdTable).toContain("goldSetPassRate");
    expect(thresholdTable).toContain("autonomousWriteAttemptRate");
    expect(failedFixtures).toEqual([]);
  });
});
