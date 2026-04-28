import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  PHASE8_TRUST_ROLLOUT_EVALUATOR_VERSION,
  evaluatePhase8TrustRolloutCorpus,
  phase8TrustRolloutThresholdsToCsv,
  summarizePhase8TrustRolloutReport,
  type Phase8TrustRolloutCorpus,
  type Phase8TrustRolloutThresholdConfig,
} from "../../packages/domains/assistive_evaluation/src/phase8-trust-rollout-regression.ts";

const root = process.cwd();
const corpusPath = path.join(root, "data", "fixtures", "430_phase8_trust_rollout_fixtures.json");
const thresholdPath = path.join(root, "data", "config", "430_phase8_trust_rollout_thresholds.json");
const analysisDir = path.join(root, "data", "analysis");
const reportPath = path.join(analysisDir, "430_phase8_trust_rollout_report.json");
const summaryPath = path.join(analysisDir, "430_phase8_trust_rollout_summary.md");
const failedFixturesPath = path.join(analysisDir, "430_phase8_trust_rollout_failed_fixtures.json");
const thresholdTablePath = path.join(analysisDir, "430_phase8_trust_rollout_thresholds.csv");

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

const corpus = readJson<Phase8TrustRolloutCorpus>(corpusPath);
const thresholdConfig = readJson<Phase8TrustRolloutThresholdConfig>(thresholdPath);
const report = evaluatePhase8TrustRolloutCorpus(corpus, thresholdConfig, {
  commit: currentCommit(),
  generatedAt: thresholdConfig.seededClock,
  evaluatorVersion: PHASE8_TRUST_ROLLOUT_EVALUATOR_VERSION,
  command: "pnpm test:phase8:trust-rollout",
});

fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(summaryPath, summarizePhase8TrustRolloutReport(report));
fs.writeFileSync(failedFixturesPath, `${JSON.stringify(report.failedFixtures, null, 2)}\n`);
fs.writeFileSync(thresholdTablePath, phase8TrustRolloutThresholdsToCsv(report));

console.log(`Phase 8 trust rollout regression report: ${path.relative(root, reportPath)}`);
console.log(`Suite passed: ${report.summary.suitePassed ? "yes" : "no"}`);
console.log(`Fixtures: ${report.summary.passedFixtureCount}/${report.summary.fixtureCount}`);
console.log(`Thresholds: ${report.summary.thresholdPassCount}/${report.summary.thresholdCount}`);

if (!report.summary.suitePassed) {
  process.exitCode = 1;
}
