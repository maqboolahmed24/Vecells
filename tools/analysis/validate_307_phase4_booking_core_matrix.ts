import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

const CHECKLIST_PATH = path.join(ROOT, "prompt", "checklist.md");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");
const PLAN_PATH = path.join(ROOT, "docs", "testing", "307_phase4_booking_core_test_plan.md");
const RESULTS_PATH = path.join(ROOT, "data", "test-reports", "307_booking_core_matrix_results.json");
const CLUSTERS_PATH = path.join(ROOT, "data", "test-reports", "307_booking_core_failure_clusters.json");
const CI_PATH = path.join(ROOT, "ci", "307_phase4_booking_core_matrix.yml");

const REQUIRED_FILES = [
  path.join(ROOT, "tests", "integration", "307_booking_core.helpers.ts"),
  path.join(ROOT, "tests", "integration", "307_capability_matrix.spec.ts"),
  path.join(ROOT, "tests", "integration", "307_slot_snapshot_truth.spec.ts"),
  path.join(ROOT, "tests", "integration", "307_reservation_and_hold_truth.spec.ts"),
  path.join(ROOT, "tests", "integration", "307_commit_replay_and_fencing.spec.ts"),
  path.join(ROOT, "tests", "integration", "307_callback_reorder_and_ambiguous_confirmation.spec.ts"),
  path.join(ROOT, "tests", "integration", "307_compensation_and_recovery.spec.ts"),
  path.join(ROOT, "tests", "property", "307_booking_core_properties.spec.ts"),
  path.join(ROOT, "tests", "load", "307_booking_core_contention_probe.ts"),
  path.join(ROOT, "tests", "playwright", "307_booking_core_browser_truth.spec.ts"),
  path.join(ROOT, "tests", "playwright", "307_booking_core_accessibility_and_status.spec.ts"),
  PLAN_PATH,
  RESULTS_PATH,
  CLUSTERS_PATH,
  CI_PATH,
];

const REQUIRED_CASE_IDS = [
  "CAP307_001",
  "CAP307_002",
  "SNAP307_001",
  "SNAP307_002",
  "SNAP307_003",
  "HOLD307_001",
  "HOLD307_002",
  "HOLD307_003",
  "COMMIT307_001",
  "COMMIT307_002",
  "COMMIT307_003",
  "RECON307_001",
  "RECON307_002",
  "RECON307_003",
  "COMP307_001",
  "COMP307_002",
  "BROWSER307_001",
  "A11Y307_001",
  "PROP307_001",
  "LOAD307_001",
];

const REQUIRED_RESULTS_STATUS_VOCABULARY = ["passed", "failed", "blocked", "unsupported"];
const REQUIRED_SCRIPT =
  "\"validate:307-phase4-booking-core-matrix\": \"pnpm exec tsx ./tools/analysis/validate_307_phase4_booking_core_matrix.ts\"";

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
      "- [-] seq_307_phase4_Playwright_or_other_appropriate_tooling_testing_run_capability_matrix_slot_snapshot_hold_commit_and_compensation_suites",
    ) ||
      checklist.includes(
        "- [X] seq_307_phase4_Playwright_or_other_appropriate_tooling_testing_run_capability_matrix_slot_snapshot_hold_commit_and_compensation_suites",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:seq_307",
  );
}

function validatePackageScript() {
  const packageJson = read(PACKAGE_JSON_PATH);
  requireCondition(packageJson.includes(REQUIRED_SCRIPT), "PACKAGE_SCRIPT_MISSING:validate:307");
}

function validatePlan() {
  const plan = read(PLAN_PATH);
  for (const token of [
    "ProviderCapabilityMatrixRow",
    "SlotSetSnapshot",
    "ReservationTruthProjection",
    "BookingTransaction",
    "ExternalConfirmationGate",
    "CAP307_001",
    "LOAD307_001",
    "pnpm validate:307-phase4-booking-core-matrix",
  ]) {
    requireCondition(plan.includes(token), `TEST_PLAN_TOKEN_MISSING:${token}`);
  }
}

function validateResults() {
  const results = parseJson(RESULTS_PATH);
  requireCondition(results.taskId === "seq_307_phase4_booking_core_matrix", "RESULTS_TASK_ID_DRIFT");
  requireCondition(
    results.schemaVersion === "307.phase4.booking-core-matrix.v1",
    "RESULTS_SCHEMA_VERSION_DRIFT",
  );
  requireCondition(results.overallStatus === "passed", "RESULTS_OVERALL_STATUS_NOT_PASSED");
  requireCondition(
    JSON.stringify(results.statusVocabulary) ===
      JSON.stringify(REQUIRED_RESULTS_STATUS_VOCABULARY),
    "RESULTS_STATUS_VOCABULARY_DRIFT",
  );

  const caseResults = results.caseResults ?? [];
  requireCondition(caseResults.length === REQUIRED_CASE_IDS.length, "RESULT_COUNT_DRIFT");
  const caseIds = new Set(caseResults.map((entry: { caseId: string }) => entry.caseId));
  for (const caseId of REQUIRED_CASE_IDS) {
    requireCondition(caseIds.has(caseId), `CASE_RESULT_MISSING:${caseId}`);
  }
  for (const entry of caseResults) {
    requireCondition(typeof entry.providerRef === "string" && entry.providerRef.length > 0, `CASE_PROVIDER_REF_MISSING:${entry.caseId}`);
    requireCondition(typeof entry.environmentId === "string" && entry.environmentId.length > 0, `CASE_ENVIRONMENT_ID_MISSING:${entry.caseId}`);
    requireCondition(typeof entry.seed === "string" && entry.seed.length > 0, `CASE_SEED_MISSING:${entry.caseId}`);
    requireCondition(Array.isArray(entry.artifactRefs) && entry.artifactRefs.length > 0, `CASE_ARTIFACT_REFS_MISSING:${entry.caseId}`);
    requireCondition(
      REQUIRED_RESULTS_STATUS_VOCABULARY.includes(entry.status),
      `CASE_STATUS_INVALID:${entry.caseId}:${entry.status}`,
    );
  }
}

function validateClusters() {
  const clusters = parseJson(CLUSTERS_PATH);
  requireCondition(
    clusters.taskId === "seq_307_phase4_booking_core_matrix",
    "CLUSTERS_TASK_ID_DRIFT",
  );
  requireCondition(
    clusters.schemaVersion === "307.phase4.booking-core-failure-clusters.v1",
    "CLUSTERS_SCHEMA_VERSION_DRIFT",
  );
  requireCondition(Array.isArray(clusters.clusters), "CLUSTERS_ARRAY_MISSING");
  for (const cluster of clusters.clusters) {
    requireCondition(
      REQUIRED_RESULTS_STATUS_VOCABULARY.includes(cluster.status),
      `CLUSTER_STATUS_INVALID:${cluster.clusterId}`,
    );
    requireCondition(Array.isArray(cluster.caseIds), `CLUSTER_CASE_IDS_MISSING:${cluster.clusterId}`);
  }
}

function main() {
  for (const filePath of REQUIRED_FILES) {
    requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
  }
  validateChecklist();
  validatePackageScript();
  validatePlan();
  validateResults();
  validateClusters();
  console.log("validate_307_phase4_booking_core_matrix: ok");
}

main();
