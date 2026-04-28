import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

const CHECKLIST_PATH = path.join(ROOT, "prompt", "checklist.md");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");
const PLAN_PATH = path.join(
  ROOT,
  "docs",
  "testing",
  "309_phase4_e2e_accessibility_and_load_plan.md",
);
const BOARD_PATH = path.join(ROOT, "docs", "testing", "309_phase4_e2e_evidence_board.html");
const NOTES_PATH = path.join(ROOT, "data", "analysis", "309_external_reference_notes.md");
const RESULTS_PATH = path.join(ROOT, "data", "test-reports", "309_phase4_e2e_results.json");
const ACCESSIBILITY_PATH = path.join(
  ROOT,
  "data",
  "test-reports",
  "309_phase4_accessibility_results.json",
);
const PERFORMANCE_PATH = path.join(
  ROOT,
  "data",
  "test-reports",
  "309_phase4_performance_results.json",
);
const CLUSTERS_PATH = path.join(
  ROOT,
  "data",
  "test-reports",
  "309_phase4_e2e_failure_clusters.json",
);
const CI_PATH = path.join(ROOT, "ci", "309_phase4_local_booking_e2e.yml");

const REQUIRED_FILES = [
  path.join(ROOT, "tests", "playwright", "309_phase4_local_booking.helpers.ts"),
  path.join(ROOT, "tests", "playwright", "309_patient_staff_local_booking_e2e.spec.ts"),
  path.join(ROOT, "tests", "playwright", "309_notification_and_record_origin_reentry.spec.ts"),
  path.join(ROOT, "tests", "playwright", "309_mobile_tablet_desktop_embedded_parity.spec.ts"),
  path.join(ROOT, "tests", "playwright", "309_artifact_print_and_export_parity.spec.ts"),
  path.join(ROOT, "tests", "playwright", "309_accessibility_matrix.spec.ts"),
  path.join(ROOT, "tests", "playwright", "309_visual_regression.spec.ts"),
  path.join(
    ROOT,
    "tests",
    "integration",
    "309_end_to_end_lifecycle_and_notification_truth.spec.ts",
  ),
  path.join(ROOT, "tests", "load", "309_phase4_local_booking_load_probe.ts"),
  PLAN_PATH,
  BOARD_PATH,
  NOTES_PATH,
  RESULTS_PATH,
  ACCESSIBILITY_PATH,
  PERFORMANCE_PATH,
  CLUSTERS_PATH,
  CI_PATH,
];

const REQUIRED_CASE_IDS = [
  "INT309_001",
  "INT309_002",
  "INT309_003",
  "E2E309_001",
  "E2E309_002",
  "E2E309_003",
  "REENTRY309_001",
  "REENTRY309_002",
  "REENTRY309_003",
  "VIEW309_001",
  "VIEW309_002",
  "VIEW309_003",
  "ART309_001",
  "ART309_002",
  "ART309_003",
  "A11Y309_001",
  "A11Y309_002",
  "A11Y309_003",
  "VIS309_001",
  "VIS309_002",
  "LOAD309_001",
  "LOAD309_002",
  "LOAD309_003",
];

const REQUIRED_A11Y_CASE_IDS = ["A11Y309_001", "A11Y309_002", "A11Y309_003"];
const REQUIRED_LOAD_CASE_IDS = ["LOAD309_001", "LOAD309_002", "LOAD309_003"];
const REQUIRED_RESULTS_STATUS_VOCABULARY = ["passed", "failed", "blocked", "unsupported"];
const REQUIRED_SCRIPT =
  '"validate:309-phase4-e2e-suite": "pnpm exec tsx ./tools/analysis/validate_309_phase4_e2e_suite.ts"';

function read(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function parseJson(filePath: string) {
  return JSON.parse(read(filePath));
}

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function validateChecklist() {
  const checklist = read(CHECKLIST_PATH);
  requireCondition(
    checklist.includes(
      "- [-] seq_309_phase4_Playwright_or_other_appropriate_tooling_testing_run_patient_staff_booking_end_to_end_accessibility_and_load_suites",
    ) ||
      checklist.includes(
        "- [X] seq_309_phase4_Playwright_or_other_appropriate_tooling_testing_run_patient_staff_booking_end_to_end_accessibility_and_load_suites",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:seq_309",
  );
}

function validatePackageScript() {
  const packageJson = read(PACKAGE_JSON_PATH);
  requireCondition(packageJson.includes(REQUIRED_SCRIPT), "PACKAGE_SCRIPT_MISSING:validate:309");
}

function validatePlan() {
  const plan = read(PLAN_PATH);
  for (const token of [
    "PatientAppointmentWorkspaceProjection",
    "BookingNotificationEntryProjection",
    "WaitlistContinuationTruthProjection",
    "PatientAppointmentManageProjection",
    "ExternalConfirmationGate",
    "VIEW309_003",
    "LOAD309_003",
    "pnpm validate:309-phase4-e2e-suite",
  ]) {
    requireCondition(plan.includes(token), `TEST_PLAN_TOKEN_MISSING:${token}`);
  }
}

function validateBoard() {
  const board = read(BOARD_PATH);
  for (const token of [
    'data-testid="Phase4BookingE2EBoard"',
    'data-testid="JourneyScenarioRail"',
    'data-testid="ContinuityFrameSummary"',
    'data-testid="ViewportParityGrid"',
    'data-testid="AccessibilityCoverageTable"',
    'data-testid="PerformanceBudgetStrip"',
    'data-testid="ArtifactAndTraceInspector"',
    'data-testid="FailureClusterTable"',
    "window.__phase4E2EBoardData",
    "Phase4_Local_Booking_E2E_Board",
  ]) {
    requireCondition(board.includes(token), `BOARD_TOKEN_MISSING:${token}`);
  }
}

function validateExternalNotes() {
  const notes = read(NOTES_PATH);
  for (const token of [
    "https://playwright.dev/docs/browser-contexts",
    "https://playwright.dev/docs/accessibility-testing",
    "https://playwright.dev/docs/aria-snapshots",
    "https://playwright.dev/docs/test-snapshots",
    "https://playwright.dev/docs/trace-viewer",
    "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html",
    "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html",
    "https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html",
    "https://service-manual.nhs.uk/design-system/patterns/question-pages",
    "https://service-manual.nhs.uk/design-system/patterns/check-answers",
    "https://service-manual.nhs.uk/design-system/patterns/confirmation-page",
    "https://web.dev/articles/vitals",
    "https://web.dev/articles/optimize-inp",
  ]) {
    requireCondition(notes.includes(token), `EXTERNAL_NOTES_TOKEN_MISSING:${token}`);
  }
}

function validateResults() {
  const results = parseJson(RESULTS_PATH);
  requireCondition(
    results.taskId === "seq_309_phase4_local_booking_e2e_suite",
    "RESULTS_TASK_ID_DRIFT",
  );
  requireCondition(
    results.schemaVersion === "309.phase4.local-booking-e2e-suite.v1",
    "RESULTS_SCHEMA_VERSION_DRIFT",
  );
  requireCondition(
    ["passed", "failed"].includes(results.overallStatus),
    "RESULTS_OVERALL_STATUS_INVALID",
  );
  requireCondition(
    JSON.stringify(results.statusVocabulary) === JSON.stringify(REQUIRED_RESULTS_STATUS_VOCABULARY),
    "RESULTS_STATUS_VOCABULARY_DRIFT",
  );

  const caseResults = results.caseResults ?? [];
  requireCondition(caseResults.length === REQUIRED_CASE_IDS.length, "RESULT_COUNT_DRIFT");
  const caseIds = new Set(caseResults.map((entry: { caseId: string }) => entry.caseId));
  for (const caseId of REQUIRED_CASE_IDS) {
    requireCondition(caseIds.has(caseId), `CASE_RESULT_MISSING:${caseId}`);
  }

  for (const entry of caseResults) {
    requireCondition(
      typeof entry.providerRef === "string" && entry.providerRef.length > 0,
      `CASE_PROVIDER_REF_MISSING:${entry.caseId}`,
    );
    requireCondition(
      typeof entry.environmentId === "string" && entry.environmentId.length > 0,
      `CASE_ENVIRONMENT_ID_MISSING:${entry.caseId}`,
    );
    requireCondition(
      typeof entry.seed === "string" && entry.seed.length > 0,
      `CASE_SEED_MISSING:${entry.caseId}`,
    );
    requireCondition(
      Array.isArray(entry.artifactRefs) && entry.artifactRefs.length > 0,
      `CASE_ARTIFACT_REFS_MISSING:${entry.caseId}`,
    );
    requireCondition(
      REQUIRED_RESULTS_STATUS_VOCABULARY.includes(entry.status),
      `CASE_STATUS_INVALID:${entry.caseId}:${entry.status}`,
    );
  }
}

function validateAccessibility() {
  const accessibility = parseJson(ACCESSIBILITY_PATH);
  requireCondition(
    accessibility.taskId === "seq_309_phase4_local_booking_e2e_suite",
    "ACCESSIBILITY_TASK_ID_DRIFT",
  );
  requireCondition(
    accessibility.schemaVersion === "309.phase4.local-booking-accessibility.v1",
    "ACCESSIBILITY_SCHEMA_VERSION_DRIFT",
  );
  requireCondition(
    accessibility.overallStatus === "passed",
    "ACCESSIBILITY_OVERALL_STATUS_NOT_PASSED",
  );
  const surfaces = accessibility.surfaces ?? [];
  requireCondition(surfaces.length === REQUIRED_A11Y_CASE_IDS.length, "ACCESSIBILITY_COUNT_DRIFT");
  const caseIds = new Set(surfaces.map((entry: { caseId: string }) => entry.caseId));
  for (const caseId of REQUIRED_A11Y_CASE_IDS) {
    requireCondition(caseIds.has(caseId), `ACCESSIBILITY_CASE_MISSING:${caseId}`);
  }
  for (const entry of surfaces) {
    requireCondition(entry.status === "passed", `ACCESSIBILITY_CASE_NOT_PASSED:${entry.caseId}`);
    requireCondition(
      typeof entry.axeViolationCount === "number" && entry.axeViolationCount === 0,
      `ACCESSIBILITY_AXE_COUNT_INVALID:${entry.caseId}`,
    );
    requireCondition(
      Array.isArray(entry.artifactRefs) && entry.artifactRefs.length > 0,
      `ACCESSIBILITY_ARTIFACTS_MISSING:${entry.caseId}`,
    );
  }
}

function validatePerformance() {
  const performance = parseJson(PERFORMANCE_PATH);
  requireCondition(
    performance.taskId === "seq_309_phase4_local_booking_e2e_suite",
    "PERFORMANCE_TASK_ID_DRIFT",
  );
  requireCondition(
    performance.schemaVersion === "309.phase4.local-booking-performance.v1",
    "PERFORMANCE_SCHEMA_VERSION_DRIFT",
  );
  requireCondition(
    ["passed", "failed"].includes(performance.overallStatus),
    "PERFORMANCE_OVERALL_STATUS_INVALID",
  );
  requireCondition(
    performance.supportTargets?.lcpMs === 2500 &&
      performance.supportTargets?.interactionMs === 200 &&
      performance.supportTargets?.cls === 0.1,
    "PERFORMANCE_TARGETS_DRIFT",
  );
  const scenarioResults = performance.scenarioResults ?? [];
  requireCondition(
    scenarioResults.length === REQUIRED_LOAD_CASE_IDS.length,
    "PERFORMANCE_COUNT_DRIFT",
  );
  const caseIds = new Set(scenarioResults.map((entry: { caseId: string }) => entry.caseId));
  for (const caseId of REQUIRED_LOAD_CASE_IDS) {
    requireCondition(caseIds.has(caseId), `PERFORMANCE_CASE_MISSING:${caseId}`);
  }
  for (const entry of scenarioResults) {
    requireCondition(
      REQUIRED_RESULTS_STATUS_VOCABULARY.includes(entry.status),
      `PERFORMANCE_STATUS_INVALID:${entry.caseId}:${entry.status}`,
    );
    requireCondition(
      typeof entry.p75?.loadMs === "number" &&
        typeof entry.p75?.domContentLoadedMs === "number" &&
        typeof entry.p75?.interactionMs === "number" &&
        typeof entry.p75?.cls === "number",
      `PERFORMANCE_P75_MISSING:${entry.caseId}`,
    );
    requireCondition(
      Array.isArray(entry.artifactRefs) && entry.artifactRefs.length > 0,
      `PERFORMANCE_ARTIFACTS_MISSING:${entry.caseId}`,
    );
  }
}

function validateClusters() {
  const clusters = parseJson(CLUSTERS_PATH);
  requireCondition(
    clusters.taskId === "seq_309_phase4_local_booking_e2e_suite",
    "CLUSTERS_TASK_ID_DRIFT",
  );
  requireCondition(
    clusters.schemaVersion === "309.phase4.local-booking-e2e-failure-clusters.v1",
    "CLUSTERS_SCHEMA_VERSION_DRIFT",
  );
  requireCondition(Array.isArray(clusters.clusters), "CLUSTERS_ARRAY_MISSING");
  for (const cluster of clusters.clusters) {
    requireCondition(
      REQUIRED_RESULTS_STATUS_VOCABULARY.includes(cluster.status),
      `CLUSTER_STATUS_INVALID:${cluster.clusterId}`,
    );
    requireCondition(
      Array.isArray(cluster.caseIds),
      `CLUSTER_CASE_IDS_MISSING:${cluster.clusterId}`,
    );
    requireCondition(
      Array.isArray(cluster.artifactRefs),
      `CLUSTER_ARTIFACTS_MISSING:${cluster.clusterId}`,
    );
  }
}

function validateCi() {
  const ci = read(CI_PATH);
  for (const token of [
    "309_end_to_end_lifecycle_and_notification_truth.spec.ts",
    "309_patient_staff_local_booking_e2e.spec.ts",
    "309_notification_and_record_origin_reentry.spec.ts",
    "309_mobile_tablet_desktop_embedded_parity.spec.ts",
    "309_artifact_print_and_export_parity.spec.ts",
    "309_accessibility_matrix.spec.ts",
    "309_visual_regression.spec.ts",
    "309_phase4_local_booking_load_probe.ts",
    "pnpm validate:309-phase4-e2e-suite",
  ]) {
    requireCondition(ci.includes(token), `CI_TOKEN_MISSING:${token}`);
  }
}

function main() {
  for (const filePath of REQUIRED_FILES) {
    requireCondition(
      fs.existsSync(filePath),
      `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`,
    );
  }
  validateChecklist();
  validatePackageScript();
  validatePlan();
  validateBoard();
  validateExternalNotes();
  validateResults();
  validateAccessibility();
  validatePerformance();
  validateClusters();
  validateCi();
  console.log("validate_309_phase4_e2e_suite: ok");
}

main();
