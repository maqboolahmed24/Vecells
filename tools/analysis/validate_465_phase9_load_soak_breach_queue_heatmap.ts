import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertExists(relativePath: string): void {
  assertCondition(fs.existsSync(path.join(root, relativePath)), `Missing ${relativePath}`);
}

function assertIncludes(relativePath: string, fragment: string): void {
  assertCondition(read(relativePath).includes(fragment), `${relativePath} missing ${fragment}`);
}

const requiredFiles = [
  "tests/performance/465_phase9_load_soak_scenarios.ts",
  "tests/performance/465_breach_detection_expected_outcomes.json",
  "tests/performance/465_queue_heatmap_expected_outcomes.json",
  "tests/playwright/465_load_soak.helpers.ts",
  "tests/playwright/465_ops_queue_heatmap_under_load.spec.ts",
  "tests/playwright/465_breach_detection_ui_states.spec.ts",
  "tests/integration/465_breach_risk_engine_contract.test.ts",
  "tests/integration/465_queue_heatmap_projection_contract.test.ts",
  "docs/testing/465_load_soak_breach_queue_heatmap_test_plan.md",
  "data/evidence/465_load_soak_breach_queue_heatmap_results.json",
  "data/analysis/465_algorithm_alignment_notes.md",
  "data/analysis/465_external_reference_notes.json",
  "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_465_LOAD_SOAK_TOOLING.json",
  "tools/analysis/validate_465_phase9_load_soak_breach_queue_heatmap.ts",
];

for (const requiredFile of requiredFiles) {
  assertExists(requiredFile);
}

for (const fragment of [
  "steady_weekday_digital_intake",
  "burst_safety_gate_priority",
  "staff_queue_review_concurrent_updates",
  "appointment_waitlist_pressure",
  "hub_constrained_capacity",
  "pharmacy_bounce_back_load",
  "outbound_comms_retry_secure_link",
  "assistive_vendor_degradation",
  "projection_lag_recovery",
  "alert_threshold_hysteresis",
  "queue_heatmap_cross_slice",
  "evaluateBreachRiskSeries",
  "buildQueueHeatmapProjection",
  "createDestinationSyntheticPayload",
]) {
  assertIncludes("tests/performance/465_phase9_load_soak_scenarios.ts", fragment);
}

for (const scriptName of [
  "test:phase9:load-soak-breach-queue-heatmap",
  "validate:465-phase9-load-soak-breach-queue-heatmap",
]) {
  assertIncludes("package.json", scriptName);
}

const evidence = readJson<any>("data/evidence/465_load_soak_breach_queue_heatmap_results.json");
assertCondition(
  evidence.schemaVersion === "465.phase9.load-soak-breach-queue-heatmap.v1",
  "Unexpected evidence schema",
);
assertCondition(evidence.scenarioCount === 11, "Expected 11 scenarios");
assertCondition(evidence.noSev1OrSev2Defects === true, "Sev-1/Sev-2 gate failed");
assertCondition(evidence.throughputOnlyGapClosed === true, "Throughput-only gap not closed");
assertCondition(evidence.dashboardCalmnessGapClosed === true, "Dashboard calmness gap not closed");
assertCondition(evidence.alertFlappingGapClosed === true, "Alert flapping gap not closed");
assertCondition(evidence.fixtureRealismGapClosed === true, "Fixture realism gap not closed");
assertCondition(evidence.evidenceGapClosed === true, "Evidence gap not closed");
assertCondition(
  evidence.alertDeliveryProbes.every(
    (probe: { redactedSyntheticSummaryOnly: boolean }) =>
      probe.redactedSyntheticSummaryOnly === true,
  ),
  "Alert probe redaction failed",
);

const heatmap = readJson<any>("tests/performance/465_queue_heatmap_expected_outcomes.json");
assertCondition(heatmap.allCellsHaveTableParity === true, "Heatmap table parity failed");
assertCondition(heatmap.cells.length >= 10, "Expected at least 10 heatmap cells");
assertCondition(
  heatmap.cells.every(
    (cell: { visualValue: number; tableValue: number; sortRank: number }, index: number) =>
      cell.visualValue === cell.tableValue && cell.sortRank === index + 1,
  ),
  "Heatmap values or rank ordering drifted",
);

const breach = readJson<any>("tests/performance/465_breach_detection_expected_outcomes.json");
const allEvaluations = breach.scenarios.flatMap(
  (scenario: { evaluations: readonly unknown[] }) => scenario.evaluations,
) as Array<{ transition: string; supportSatisfied: boolean; riskScore: number }>;
assertCondition(
  allEvaluations.some((evaluation) => evaluation.transition === "enter_critical"),
  "Missing critical breach transition",
);
assertCondition(
  allEvaluations
    .filter((evaluation) => evaluation.transition === "enter_critical")
    .every((evaluation) => evaluation.supportSatisfied && evaluation.riskScore >= 88),
  "Critical breach transition did not require support",
);
assertCondition(
  allEvaluations.some((evaluation) => evaluation.transition === "suppressed_by_support"),
  "Missing support-suppressed threshold case",
);

const externalNotes = readJson<any>("data/analysis/465_external_reference_notes.json");
for (const expectedUrl of [
  "https://playwright.dev/docs/network",
  "https://playwright.dev/docs/trace-viewer",
  "https://playwright.dev/docs/screenshots",
  "https://playwright.dev/docs/aria-snapshots",
  "https://nodejs.org/api/perf_hooks.html",
  "https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-testing-dashboards-for-design-and-accessibility/",
  "https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/",
  "https://www.w3.org/TR/WCAG22/",
  "https://service-manual.nhs.uk/design-system/changes-to-design-system-wcag-2-2",
  "https://design-system.service.gov.uk/components/summary-list/",
]) {
  assertCondition(
    externalNotes.references.some((reference: { url: string }) => reference.url === expectedUrl),
    `Missing external reference ${expectedUrl}`,
  );
}

assertCondition(
  /^\- \[(?:-|X)\] par_465_phase9_Playwright_or_other_appropriate_tooling_testing_run_load_soak_breach_detection_and_queue_heatmap_suites/m.test(
    read("prompt/checklist.md"),
  ),
  "Checklist row for par_465 must be claimed or complete",
);

console.log("Task 465 load/soak breach and queue heatmap validation passed.");
