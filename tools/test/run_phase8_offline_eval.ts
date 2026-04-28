import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  PHASE8_OFFLINE_EVALUATOR_VERSION,
  evaluatePhase8Corpus,
  summarizePhase8EvalReport,
  thresholdComparisonsToCsv,
  type Phase8OfflineEvalCorpus,
  type Phase8ThresholdConfig,
} from "../../packages/domains/assistive_evaluation/src/phase8-offline-regression.ts";

const root = process.cwd();
const corpusPath = path.join(root, "data", "fixtures", "428_phase8_offline_eval_corpus.json");
const thresholdPath = path.join(root, "data", "config", "428_phase8_eval_thresholds.json");
const analysisDir = path.join(root, "data", "analysis");
const reportPath = path.join(analysisDir, "428_phase8_eval_report.json");
const summaryPath = path.join(analysisDir, "428_phase8_eval_summary.md");
const failedFixturesPath = path.join(analysisDir, "428_phase8_failed_fixtures.json");
const thresholdTablePath = path.join(analysisDir, "428_phase8_threshold_comparison_table.csv");

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function currentCommit(): string {
  try {
    return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown-local";
  }
}

const corpus = readJson<Phase8OfflineEvalCorpus>(corpusPath);
const thresholdConfig = readJson<Phase8ThresholdConfig>(thresholdPath);
const report = evaluatePhase8Corpus(corpus, thresholdConfig, {
  commit: currentCommit(),
  generatedAt: thresholdConfig.seededClock,
  evaluatorVersion: PHASE8_OFFLINE_EVALUATOR_VERSION,
  command: "pnpm test:phase8:eval",
});

fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(summaryPath, summarizePhase8EvalReport(report));
fs.writeFileSync(failedFixturesPath, `${JSON.stringify(report.failedFixtures, null, 2)}\n`);
fs.writeFileSync(thresholdTablePath, thresholdComparisonsToCsv(report));

console.log(`Phase 8 offline eval report: ${path.relative(root, reportPath)}`);
console.log(`Suite passed: ${report.summary.suitePassed ? "yes" : "no"}`);
console.log(`Fixtures: ${report.summary.passedFixtureCount}/${report.summary.fixtureCount}`);
console.log(`Thresholds: ${report.summary.thresholdPassCount}/${report.summary.thresholdCount}`);

if (!report.summary.suitePassed) {
  process.exitCode = 1;
}
