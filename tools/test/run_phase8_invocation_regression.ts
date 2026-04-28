import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  PHASE8_INVOCATION_REGRESSION_EVALUATOR_VERSION,
  evaluatePhase8InvocationCorpus,
  phase8InvocationThresholdsToCsv,
  summarizePhase8InvocationReport,
  type Phase8InvocationRegressionCorpus,
  type Phase8InvocationThresholdConfig,
} from "../../packages/domains/assistive_evaluation/src/phase8-invocation-regression.ts";

const root = process.cwd();
const corpusPath = path.join(root, "data", "fixtures", "429_phase8_invocation_regression_fixtures.json");
const thresholdPath = path.join(root, "data", "config", "429_phase8_invocation_thresholds.json");
const analysisDir = path.join(root, "data", "analysis");
const reportPath = path.join(analysisDir, "429_phase8_invocation_report.json");
const summaryPath = path.join(analysisDir, "429_phase8_invocation_summary.md");
const failedFixturesPath = path.join(analysisDir, "429_phase8_invocation_failed_fixtures.json");
const thresholdTablePath = path.join(analysisDir, "429_phase8_invocation_thresholds.csv");

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

const corpus = readJson<Phase8InvocationRegressionCorpus>(corpusPath);
const thresholdConfig = readJson<Phase8InvocationThresholdConfig>(thresholdPath);
const report = evaluatePhase8InvocationCorpus(corpus, thresholdConfig, {
  commit: currentCommit(),
  generatedAt: thresholdConfig.seededClock,
  evaluatorVersion: PHASE8_INVOCATION_REGRESSION_EVALUATOR_VERSION,
  command: "pnpm test:phase8:invocation",
});

fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(summaryPath, summarizePhase8InvocationReport(report));
fs.writeFileSync(failedFixturesPath, `${JSON.stringify(report.failedFixtures, null, 2)}\n`);
fs.writeFileSync(thresholdTablePath, phase8InvocationThresholdsToCsv(report));

console.log(`Phase 8 invocation regression report: ${path.relative(root, reportPath)}`);
console.log(`Suite passed: ${report.summary.suitePassed ? "yes" : "no"}`);
console.log(`Fixtures: ${report.summary.passedFixtureCount}/${report.summary.fixtureCount}`);
console.log(`Thresholds: ${report.summary.thresholdPassCount}/${report.summary.thresholdCount}`);

if (!report.summary.suitePassed) {
  process.exitCode = 1;
}
