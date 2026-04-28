import fs from "node:fs";
import path from "node:path";
import type {
  Phase8EvalFixtureFamily,
  Phase8EvalReport,
  Phase8OfflineEvalCorpus,
  Phase8ThresholdConfig,
} from "../../packages/domains/assistive_evaluation/src/phase8-offline-regression.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/assistive_evaluation/src/phase8-offline-regression.ts",
  "data/fixtures/428_phase8_offline_eval_corpus.json",
  "data/config/428_phase8_eval_thresholds.json",
  "data/contracts/428_phase8_offline_eval_contract.json",
  "data/analysis/428_algorithm_alignment_notes.md",
  "data/analysis/428_phase8_eval_report.json",
  "data/analysis/428_phase8_eval_summary.md",
  "data/analysis/428_phase8_failed_fixtures.json",
  "data/analysis/428_phase8_threshold_comparison_table.csv",
  "docs/testing/428_phase8_offline_eval_suite.md",
  "docs/frontend/428_phase8_offline_eval_harness.html",
  "tools/test/run_phase8_offline_eval.ts",
  "tests/unit/428_hallucination_grounding_checks.spec.ts",
  "tests/unit/428_red_flag_oracle_and_thresholds.spec.ts",
  "tests/integration/428_phase8_offline_eval_report.spec.ts",
  "tests/playwright/428_phase8_offline_eval_visible_evidence.spec.ts",
];

const requiredFamilies: readonly Phase8EvalFixtureFamily[] = [
  "grounded_safe",
  "missing_evidence",
  "contradictory_source",
  "stale_source",
  "red_flag_symptom",
  "red_flag_medication_pharmacy_loop",
  "red_flag_booking_waitlist_access_delay",
  "hallucination_trap",
  "citation_trap",
  "draft_insertion_boundary",
  "multilingual_low_literacy",
  "protected_characteristic_access_equity",
];

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

for (const relativePath of requiredFiles) {
  assert(fs.existsSync(path.join(root, relativePath)), `MISSING_FILE:${relativePath}`);
}

const packageJson = readText("package.json");
assert(packageJson.includes('"test:phase8:eval"'), "PACKAGE_SCRIPT_MISSING:test:phase8:eval");
assert(
  packageJson.includes('"validate:428-phase8-offline-eval"'),
  "PACKAGE_SCRIPT_MISSING:validate:428-phase8-offline-eval",
);

const corpus = readJson<Phase8OfflineEvalCorpus>("data/fixtures/428_phase8_offline_eval_corpus.json");
assert(corpus.fixtures.length >= 12, "CORPUS_TOO_SMALL");
const families = new Set(corpus.fixtures.map((fixture) => fixture.family));
for (const family of requiredFamilies) {
  assert(families.has(family), `CORPUS_FAMILY_MISSING:${family}`);
}
const fixtureIds = new Set<string>();
for (const fixture of corpus.fixtures) {
  assert(!fixtureIds.has(fixture.fixtureId), `DUPLICATE_FIXTURE:${fixture.fixtureId}`);
  fixtureIds.add(fixture.fixtureId);
  assert(fixture.syntheticDataOnly === true, `FIXTURE_NOT_SYNTHETIC:${fixture.fixtureId}`);
  assert(fixture.sourceArtifacts.length > 0, `FIXTURE_SOURCE_MISSING:${fixture.fixtureId}`);
  assert(fixture.expected.expectedAuditEvents.length > 0, `FIXTURE_AUDIT_EXPECTATION_MISSING:${fixture.fixtureId}`);
  assert(fixture.expected.prohibitedClaims.length > 0, `FIXTURE_PROHIBITED_CLAIMS_MISSING:${fixture.fixtureId}`);
  assert(fixture.fairnessCohortTags.length > 0, `FIXTURE_FAIRNESS_TAGS_MISSING:${fixture.fixtureId}`);
}

const thresholdConfig = readJson<Phase8ThresholdConfig>("data/config/428_phase8_eval_thresholds.json");
const thresholdMetrics = new Set(thresholdConfig.thresholds.map((threshold) => threshold.metric));
for (const metric of [
  "goldSetPassRate",
  "redFlagRecall",
  "falseReassuranceRate",
  "hallucinationRate",
  "citationValidityRate",
  "abstentionDeferralCorrectness",
  "maxCalibrationError",
  "minSliceSupport",
  "maxMulticalibrationGap",
  "maxSelectiveRisk",
  "staleOutputInvalidationRate",
  "autonomousWriteAttemptRate",
]) {
  assert(thresholdMetrics.has(metric), `THRESHOLD_MISSING:${metric}`);
}
assert(
  thresholdConfig.thresholds.every((threshold) => !threshold.temporaryFallback),
  "TEMPORARY_FALLBACK_THRESHOLD_PRESENT",
);

const report = readJson<Phase8EvalReport>("data/analysis/428_phase8_eval_report.json");
assert(report.summary.suitePassed, "REPORT_SUITE_NOT_PASSED");
assert(report.summary.fixtureCount === corpus.fixtures.length, "REPORT_FIXTURE_COUNT_MISMATCH");
assert(report.failedFixtures.length === 0, "REPORT_HAS_UNEXPECTED_FAILURES");
assert(report.thresholdComparisons.every((comparison) => comparison.passed), "REPORT_THRESHOLD_FAILURE");

const engine = readText("packages/domains/assistive_evaluation/src/phase8-offline-regression.ts");
for (const token of [
  "unsupported_claim",
  "fabricated_citation",
  "stale_evidence_without_warning",
  "red_flag_missed",
  "false_reassurance",
  "autonomous_write_attempt",
  "unsafe_draft_insertion",
  "maxMulticalibrationGap",
  "maxSelectiveRisk",
]) {
  assert(engine.includes(token), `ENGINE_TOKEN_MISSING:${token}`);
}

const playwrightSpec = readText("tests/playwright/428_phase8_offline_eval_visible_evidence.spec.ts");
for (const token of [
  "toMatchAriaSnapshot",
  "toHaveScreenshot",
  "reducedMotion",
  "keyboard",
  "AutonomousWriteButton",
  "safe-result-panel",
  "red-flag-result-panel",
  "hallucination-blocked-panel",
  "stale-frozen-panel",
]) {
  assert(playwrightSpec.includes(token), `PLAYWRIGHT_TOKEN_MISSING:${token}`);
}

console.log("428 phase8 offline eval suite validated.");
