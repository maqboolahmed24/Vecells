import fs from "node:fs";
import path from "node:path";
import type {
  Phase8FeedbackEventType,
  Phase8RolloutScenario,
  Phase8TrustRolloutCorpus,
  Phase8TrustRolloutReport,
  Phase8TrustRolloutThresholdConfig,
  Phase8TrustState,
} from "../../packages/domains/assistive_evaluation/src/phase8-trust-rollout-regression.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/assistive_evaluation/src/phase8-trust-rollout-regression.ts",
  "data/fixtures/430_phase8_trust_rollout_fixtures.json",
  "data/config/430_phase8_trust_rollout_thresholds.json",
  "data/contracts/430_phase8_trust_rollout_regression_contract.json",
  "data/analysis/430_algorithm_alignment_notes.md",
  "data/analysis/430_phase8_trust_rollout_report.json",
  "data/analysis/430_phase8_trust_rollout_summary.md",
  "data/analysis/430_phase8_trust_rollout_failed_fixtures.json",
  "data/analysis/430_phase8_trust_rollout_thresholds.csv",
  "docs/frontend/430_phase8_trust_rollout_harness.html",
  "tools/test/run_phase8_trust_rollout_regression.ts",
  "tests/unit/430_trust_envelope_and_rollout_policy.spec.ts",
  "tests/unit/430_feedback_chain_evidence.spec.ts",
  "tests/integration/430_phase8_trust_rollout_report.spec.ts",
  "tests/playwright/430_trust_feedback_rollout_visible.spec.ts",
];

const requiredTrustStates: readonly Phase8TrustState[] = [
  "trusted",
  "low_confidence",
  "ungrounded",
  "stale",
  "drift_warning",
  "fairness_variance",
  "red_flag_blocked",
  "quarantined",
  "frozen",
  "rolled_back",
  "partial_disclosure",
];

const requiredFeedbackEvents: readonly Phase8FeedbackEventType[] = [
  "accepted_suggestion",
  "rejected_suggestion",
  "edited_suggestion",
  "override_reason",
  "reliance_without_insertion",
  "rationale_quality",
  "citation_correctness",
  "stale_frozen_feedback",
  "feedback_cancellation",
];

const requiredRolloutScenarios: readonly Phase8RolloutScenario[] = [
  "shadow_only",
  "internal_only",
  "pilot_cohort",
  "tenant_limited_pilot",
  "route_family_limited_pilot",
  "frozen_rollout",
  "rollback",
  "global_disable",
  "publication_mismatch",
  "expired_slice",
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
assert(packageJson.includes('"test:phase8:trust-rollout"'), "PACKAGE_SCRIPT_MISSING:test:phase8:trust-rollout");
assert(
  packageJson.includes('"validate:430-phase8-trust-rollout-regression"'),
  "PACKAGE_SCRIPT_MISSING:validate:430-phase8-trust-rollout-regression",
);

const corpus = readJson<Phase8TrustRolloutCorpus>("data/fixtures/430_phase8_trust_rollout_fixtures.json");
assert(corpus.fixtures.length >= 11, "CORPUS_TOO_SMALL");
assert(
  corpus.sourceBlueprintRefs.some((ref) => ref.includes("phase-8-the-assistive-layer")),
  "CORPUS_PHASE8_BLUEPRINT_REF_MISSING",
);

function requireCoverage<T extends string>(required: readonly T[], observed: readonly T[], label: string): void {
  const observedSet = new Set(observed);
  for (const value of required) {
    assert(observedSet.has(value), `${label}_MISSING:${value}`);
  }
}

requireCoverage(requiredTrustStates, corpus.fixtures.map((fixture) => fixture.trustEnvelope.trustState), "TRUST_STATE");
requireCoverage(
  requiredFeedbackEvents,
  corpus.fixtures.flatMap((fixture) => (fixture.feedbackRecord ? [fixture.feedbackRecord.eventType] : [])),
  "FEEDBACK_EVENT",
);
requireCoverage(requiredRolloutScenarios, corpus.fixtures.map((fixture) => fixture.rolloutVerdict.scenario), "ROLLOUT");

for (const fixture of corpus.fixtures) {
  assert(fixture.syntheticDataOnly === true, `FIXTURE_NOT_SYNTHETIC:${fixture.fixtureId}`);
  assert(fixture.trustEnvelope.trustEnvelopeRef, `TRUST_ENVELOPE_REF_MISSING:${fixture.fixtureId}`);
  assert(fixture.expected.auditEvents.length > 0, `AUDIT_EVENTS_MISSING:${fixture.fixtureId}`);
  assert(fixture.expected.evidenceEvents.length > 0, `EVIDENCE_EVENTS_MISSING:${fixture.fixtureId}`);
  assert(fixture.expected.blockedActions.includes("send_to_patient"), `SEND_BLOCK_MISSING:${fixture.fixtureId}`);
  assert(fixture.expected.blockedActions.includes("commit_booking"), `BOOKING_BLOCK_MISSING:${fixture.fixtureId}`);
  assert(fixture.expected.blockedActions.includes("change_pharmacy_outcome"), `PHARMACY_BLOCK_MISSING:${fixture.fixtureId}`);
  assert(fixture.expected.blockedActions.includes("close_task"), `TASK_CLOSE_BLOCK_MISSING:${fixture.fixtureId}`);
}

const thresholds = readJson<Phase8TrustRolloutThresholdConfig>("data/config/430_phase8_trust_rollout_thresholds.json");
const thresholdMetrics = new Set(thresholds.thresholds.map((threshold) => threshold.metric));
for (const metric of [
  "fixturePassRate",
  "trustEnvelopeFixturePassRate",
  "trustStateCoverageRate",
  "propagationPassRate",
  "feedbackEvidenceCompletenessRate",
  "feedbackIdempotencyRate",
  "feedbackAuthoritativeMutationRate",
  "rolloutScenarioCoverageRate",
  "rolloutVerdictParityRate",
  "visibleRolloutPinningRate",
  "opsReleaseLanguageParityRate",
  "distinctDegradedStateRate",
  "staleCurrentMismatchRate",
  "hiddenDomLeakRate",
  "prohibitedNetworkMutationRate",
  "auditEvidenceCompletenessRate",
]) {
  assert(thresholdMetrics.has(metric), `THRESHOLD_MISSING:${metric}`);
}
assert(thresholds.thresholds.every((threshold) => !threshold.temporaryFallback), "TEMPORARY_FALLBACK_THRESHOLD_PRESENT");

const report = readJson<Phase8TrustRolloutReport>("data/analysis/430_phase8_trust_rollout_report.json");
assert(report.summary.suitePassed, "REPORT_SUITE_NOT_PASSED");
assert(report.summary.fixtureCount === corpus.fixtures.length, "REPORT_FIXTURE_COUNT_MISMATCH");
assert(report.failedFixtures.length === 0, "REPORT_HAS_FAILED_FIXTURES");
assert(report.thresholdComparisons.every((comparison) => comparison.passed), "REPORT_THRESHOLD_FAILURE");

const engine = readText("packages/domains/assistive_evaluation/src/phase8-trust-rollout-regression.ts");
for (const token of [
  "evaluateRolloutVerdict",
  "evaluateFeedbackRecord",
  "detectTrustRolloutProhibitedRequests",
  "confidence_without_provenance",
  "provenance_disclosure_violation",
  "feedback_authoritative_mutation",
  "rollout_publication_not_pinned",
  "ops_release_language_drift",
  "hidden_dom_leak",
]) {
  assert(engine.includes(token), `ENGINE_TOKEN_MISSING:${token}`);
}

const playwrightSpec = readText("tests/playwright/430_trust_feedback_rollout_visible.spec.ts");
for (const token of [
  "toMatchAriaSnapshot",
  "toHaveScreenshot",
  "reducedMotion",
  "keyboard",
  "hiddenBlockedContent",
  "prohibitedMutation",
  "TrustedEnvelopePanel",
  "FeedbackCapturePanel",
  "RolloutCardPanel",
  "FrozenStatePanel",
]) {
  assert(playwrightSpec.includes(token), `PLAYWRIGHT_TOKEN_MISSING:${token}`);
}

console.log("430 phase8 trust rollout regression suite validated.");
