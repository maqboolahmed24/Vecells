import fs from "node:fs";
import path from "node:path";
import type {
  Phase8AudienceSurface,
  Phase8DisclosureScope,
  Phase8DeviceLayout,
  Phase8InvocationRegressionCorpus,
  Phase8InvocationRegressionReport,
  Phase8InvocationRole,
  Phase8InvocationRouteFamily,
  Phase8InvocationThresholdConfig,
  Phase8InvocationTrustState,
  Phase8KillSwitchLevel,
  Phase8PublicationState,
  Phase8RolloutState,
} from "../../packages/domains/assistive_evaluation/src/phase8-invocation-regression.ts";

const root = process.cwd();

const requiredFiles = [
  "packages/domains/assistive_evaluation/src/phase8-invocation-regression.ts",
  "data/fixtures/429_phase8_invocation_regression_fixtures.json",
  "data/config/429_phase8_invocation_thresholds.json",
  "data/contracts/429_phase8_invocation_regression_contract.json",
  "data/analysis/429_algorithm_alignment_notes.md",
  "data/analysis/429_phase8_invocation_report.json",
  "data/analysis/429_phase8_invocation_summary.md",
  "data/analysis/429_phase8_invocation_failed_fixtures.json",
  "data/analysis/429_phase8_invocation_thresholds.csv",
  "docs/frontend/429_phase8_invocation_regression_harness.html",
  "tools/test/run_phase8_invocation_regression.ts",
  "tests/unit/429_invocation_policy_and_kill_switch.spec.ts",
  "tests/unit/429_surface_visibility_and_draft_insertion.spec.ts",
  "tests/integration/429_phase8_invocation_report.spec.ts",
  "tests/playwright/429_invocation_kill_switch_draft_visibility.spec.ts",
];

const requiredRoles: readonly Phase8InvocationRole[] = ["clinician", "admin", "support", "governance", "unauthorised"];
const requiredRoutes: readonly Phase8InvocationRouteFamily[] = [
  "triage",
  "more_info",
  "booking",
  "waitlist",
  "pharmacy",
  "communications",
  "support_replay",
  "assurance_admin",
];
const requiredRollouts: readonly Phase8RolloutState[] = [
  "disabled",
  "shadow",
  "limited_pilot",
  "visible_assistive",
  "frozen",
  "rollback",
];
const requiredTrustStates: readonly Phase8InvocationTrustState[] = [
  "trusted",
  "degraded",
  "stale",
  "quarantined",
  "unknown",
  "hard_blocked",
];
const requiredPublicationStates: readonly Phase8PublicationState[] = [
  "current",
  "stale",
  "mismatch",
  "missing_runtime_bundle",
];
const requiredDisclosureScopes: readonly Phase8DisclosureScope[] = ["full", "partial", "denied", "break_glass_required"];
const requiredDeviceLayouts: readonly Phase8DeviceLayout[] = ["desktop", "narrow", "reduced_motion"];
const requiredSurfaces: readonly Phase8AudienceSurface[] = [
  "staff_workspace",
  "ops_internal",
  "release_admin",
  "support_replay",
  "patient_facing",
  "artifact_preview",
];
const requiredKillSwitches: readonly Exclude<Phase8KillSwitchLevel, "none">[] = [
  "global_model_vendor",
  "tenant",
  "route_family",
  "cohort_slice",
  "workspace_session_stale_freeze",
  "artifact_quarantine",
  "runtime_publication_rollback",
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
assert(packageJson.includes('"test:phase8:invocation"'), "PACKAGE_SCRIPT_MISSING:test:phase8:invocation");
assert(
  packageJson.includes('"validate:429-phase8-invocation-regression"'),
  "PACKAGE_SCRIPT_MISSING:validate:429-phase8-invocation-regression",
);

const corpus = readJson<Phase8InvocationRegressionCorpus>("data/fixtures/429_phase8_invocation_regression_fixtures.json");
assert(corpus.fixtures.length >= 16, "CORPUS_TOO_SMALL");
assert(
  corpus.sourceBlueprintRefs.some((ref) => ref.includes("phase-8-the-assistive-layer")),
  "CORPUS_BLUEPRINT_REF_MISSING",
);

function assertCovered<T extends string>(values: readonly T[], observed: readonly T[], label: string): void {
  const observedSet = new Set(observed);
  for (const value of values) {
    assert(observedSet.has(value), `${label}_MISSING:${value}`);
  }
}

assertCovered(requiredRoles, corpus.fixtures.map((fixture) => fixture.role), "ROLE");
assertCovered(requiredRoutes, corpus.fixtures.map((fixture) => fixture.routeFamily), "ROUTE");
assertCovered(requiredRollouts, corpus.fixtures.map((fixture) => fixture.rolloutState), "ROLLOUT");
assertCovered(requiredTrustStates, corpus.fixtures.map((fixture) => fixture.trustState), "TRUST");
assertCovered(requiredPublicationStates, corpus.fixtures.map((fixture) => fixture.publicationState), "PUBLICATION");
assertCovered(requiredDisclosureScopes, corpus.fixtures.map((fixture) => fixture.disclosureScope), "DISCLOSURE");
assertCovered(requiredDeviceLayouts, corpus.fixtures.map((fixture) => fixture.deviceLayout), "DEVICE");
assertCovered(requiredSurfaces, corpus.fixtures.map((fixture) => fixture.audienceSurface), "SURFACE");
assertCovered(requiredKillSwitches, corpus.fixtures.map((fixture) => fixture.killSwitch), "KILL_SWITCH");

const ids = new Set<string>();
for (const fixture of corpus.fixtures) {
  assert(!ids.has(fixture.fixtureId), `DUPLICATE_FIXTURE:${fixture.fixtureId}`);
  ids.add(fixture.fixtureId);
  assert(fixture.syntheticDataOnly === true, `FIXTURE_NOT_SYNTHETIC:${fixture.fixtureId}`);
  assert(fixture.expected.visibleAffordances.length > 0, `FIXTURE_AFFORDANCES_MISSING:${fixture.fixtureId}`);
  assert(fixture.expected.blockedActions.includes("send_to_patient"), `FIXTURE_SEND_BLOCK_MISSING:${fixture.fixtureId}`);
  assert(fixture.expected.blockedActions.includes("commit_booking"), `FIXTURE_BOOKING_BLOCK_MISSING:${fixture.fixtureId}`);
  assert(fixture.expected.blockedActions.includes("change_pharmacy_outcome"), `FIXTURE_PHARMACY_BLOCK_MISSING:${fixture.fixtureId}`);
  assert(fixture.expected.blockedActions.includes("close_task"), `FIXTURE_TASK_CLOSE_BLOCK_MISSING:${fixture.fixtureId}`);
  assert(fixture.expected.auditEvents.length > 0, `FIXTURE_AUDIT_EXPECTATION_MISSING:${fixture.fixtureId}`);
  assert(fixture.expected.evidenceEvents.length > 0, `FIXTURE_EVIDENCE_EXPECTATION_MISSING:${fixture.fixtureId}`);
}

const thresholdConfig = readJson<Phase8InvocationThresholdConfig>("data/config/429_phase8_invocation_thresholds.json");
const thresholdMetrics = new Set(thresholdConfig.thresholds.map((threshold) => threshold.metric));
for (const metric of [
  "fixturePassRate",
  "allowedInvocationPassRate",
  "blockedInvocationPassRate",
  "killSwitchCoverageRate",
  "killSwitchPassRate",
  "wrongSurfaceLeakRate",
  "autonomousWritePathRate",
  "draftHumanSettlementRate",
  "auditEvidenceCompletenessRate",
  "assuranceEvidenceCompletenessRate",
  "stalePublicationBlockRate",
  "hiddenDomLeakRate",
  "prohibitedNetworkMutationRate",
  "recoveryLegalityRate",
  "surfaceFencePassRate",
]) {
  assert(thresholdMetrics.has(metric), `THRESHOLD_MISSING:${metric}`);
}
assert(
  thresholdConfig.thresholds.every((threshold) => !threshold.temporaryFallback),
  "TEMPORARY_FALLBACK_THRESHOLD_PRESENT",
);

const report = readJson<Phase8InvocationRegressionReport>("data/analysis/429_phase8_invocation_report.json");
assert(report.summary.suitePassed, "REPORT_SUITE_NOT_PASSED");
assert(report.summary.fixtureCount === corpus.fixtures.length, "REPORT_FIXTURE_COUNT_MISMATCH");
assert(report.failedFixtures.length === 0, "REPORT_HAS_UNEXPECTED_FAILURES");
assert(report.thresholdComparisons.every((comparison) => comparison.passed), "REPORT_THRESHOLD_FAILURE");

const engine = readText("packages/domains/assistive_evaluation/src/phase8-invocation-regression.ts");
for (const token of [
  "evaluateInvocationPolicy",
  "evaluateRolloutSlice",
  "highestPrecedenceKillSwitch",
  "enforceDisclosureFence",
  "buildDraftInsertionCommand",
  "settleDraftInsertionCommand",
  "detectProhibitedMutationRequests",
  "wrong_surface_leak",
  "hidden_dom_leak",
  "prohibited_network_mutation",
  "command_settlement_identity_missing",
]) {
  assert(engine.includes(token), `ENGINE_TOKEN_MISSING:${token}`);
}

const playwrightSpec = readText("tests/playwright/429_invocation_kill_switch_draft_visibility.spec.ts");
for (const token of [
  "toMatchAriaSnapshot",
  "toHaveScreenshot",
  "reducedMotion",
  "keyboard",
  "hiddenDom",
  "prohibitedMutation",
  "AllowedInvocationPanel",
  "BlockedInvocationPanel",
  "KillSwitchPanel",
  "DraftInsertionPanel",
  "VisibilityDeniedPanel",
]) {
  assert(playwrightSpec.includes(token), `PLAYWRIGHT_TOKEN_MISSING:${token}`);
}

const harness = readText("docs/frontend/429_phase8_invocation_regression_harness.html");
for (const token of [
  "AllowedInvocationPanel",
  "BlockedInvocationPanel",
  "KillSwitchPanel",
  "DraftInsertionPanel",
  "VisibilityDeniedPanel",
  "Insert draft",
  "Undo insert",
  "data-hidden-dom-sentinel",
]) {
  assert(harness.includes(token), `HARNESS_TOKEN_MISSING:${token}`);
}

console.log("429 phase8 invocation regression suite validated.");
