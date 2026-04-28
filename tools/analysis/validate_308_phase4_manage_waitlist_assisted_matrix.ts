import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

const CHECKLIST_PATH = path.join(ROOT, "prompt", "checklist.md");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");
const PLAN_PATH = path.join(
  ROOT,
  "docs",
  "testing",
  "308_phase4_manage_waitlist_assisted_test_plan.md",
);
const TRUTH_LAB_PATH = path.join(
  ROOT,
  "docs",
  "testing",
  "308_phase4_manage_waitlist_truth_lab.html",
);
const NOTES_PATH = path.join(ROOT, "data", "analysis", "308_external_reference_notes.md");
const RESULTS_PATH = path.join(
  ROOT,
  "data",
  "test-reports",
  "308_manage_waitlist_assisted_results.json",
);
const CLUSTERS_PATH = path.join(
  ROOT,
  "data",
  "test-reports",
  "308_manage_waitlist_assisted_failure_clusters.json",
);
const CI_PATH = path.join(ROOT, "ci", "308_phase4_manage_waitlist_assisted_matrix.yml");

const REQUIRED_FILES = [
  path.join(ROOT, "tests", "integration", "308_manage_waitlist_assisted.helpers.ts"),
  path.join(ROOT, "tests", "integration", "308_manage_command_truth.spec.ts"),
  path.join(ROOT, "tests", "integration", "308_waitlist_deadline_and_fallback.spec.ts"),
  path.join(ROOT, "tests", "integration", "308_assisted_booking_handoff_and_lease.spec.ts"),
  path.join(ROOT, "tests", "integration", "308_reconciliation_and_dispute_truth.spec.ts"),
  path.join(ROOT, "tests", "property", "308_waitlist_truth_properties.spec.ts"),
  path.join(ROOT, "tests", "playwright", "308_patient_manage_truth.spec.ts"),
  path.join(ROOT, "tests", "playwright", "308_waitlist_offer_and_fallback.spec.ts"),
  path.join(ROOT, "tests", "playwright", "308_staff_assisted_booking_and_recovery.spec.ts"),
  path.join(ROOT, "tests", "playwright", "308_reconciliation_status_and_artifact_parity.spec.ts"),
  PLAN_PATH,
  TRUTH_LAB_PATH,
  NOTES_PATH,
  RESULTS_PATH,
  CLUSTERS_PATH,
  CI_PATH,
];

const REQUIRED_CASE_IDS = [
  "MANAGE308_001",
  "MANAGE308_002",
  "MANAGE308_003",
  "WAIT308_001",
  "WAIT308_002",
  "WAIT308_003",
  "ASSIST308_001",
  "ASSIST308_002",
  "ASSIST308_003",
  "RECON308_001",
  "RECON308_002",
  "RECON308_003",
  "BROWSER308_001",
  "BROWSER308_002",
  "BROWSER308_003",
  "BROWSER308_004",
  "PROP308_001",
];

const REQUIRED_RESULTS_STATUS_VOCABULARY = ["passed", "failed", "blocked", "unsupported"];
const REQUIRED_SCRIPT =
  '"validate:308-phase4-manage-waitlist-assisted-matrix": "pnpm exec tsx ./tools/analysis/validate_308_phase4_manage_waitlist_assisted_matrix.ts"';

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
      "- [-] seq_308_phase4_Playwright_or_other_appropriate_tooling_testing_run_manage_waitlist_assisted_booking_and_reconciliation_suites",
    ) ||
      checklist.includes(
        "- [X] seq_308_phase4_Playwright_or_other_appropriate_tooling_testing_run_manage_waitlist_assisted_booking_and_reconciliation_suites",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:seq_308",
  );
}

function validatePackageScript() {
  const packageJson = read(PACKAGE_JSON_PATH);
  requireCondition(packageJson.includes(REQUIRED_SCRIPT), "PACKAGE_SCRIPT_MISSING:validate:308");
}

function validatePlan() {
  const plan = read(PLAN_PATH);
  for (const token of [
    "PatientAppointmentManageProjection",
    "WaitlistContinuationTruthProjection",
    "WaitlistFallbackObligation",
    "StaffBookingHandoffProjection",
    "ExternalConfirmationGate",
    "BROWSER308_004",
    "pnpm validate:308-phase4-manage-waitlist-assisted-matrix",
  ]) {
    requireCondition(plan.includes(token), `TEST_PLAN_TOKEN_MISSING:${token}`);
  }
}

function validateTruthLab() {
  const lab = read(TRUTH_LAB_PATH);
  for (const token of [
    'data-testid="phase4-manage-waitlist-truth-lab"',
    "--manage-accent",
    "--waitlist-accent",
    "--recovery-accent",
    "--warning-accent",
    "--confirmed-accent",
    "window.__truthLabData",
  ]) {
    requireCondition(lab.includes(token), `TRUTH_LAB_TOKEN_MISSING:${token}`);
  }
}

function validateExternalNotes() {
  const notes = read(NOTES_PATH);
  for (const token of [
    "https://playwright.dev/docs/browser-contexts",
    "https://playwright.dev/docs/aria-snapshots",
    "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html",
    "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html",
    "https://service-manual.nhs.uk/design-system/patterns/question-pages",
    "https://service-manual.nhs.uk/design-system/patterns/check-answers",
    "https://service-manual.nhs.uk/design-system/patterns/confirmation-page",
  ]) {
    requireCondition(notes.includes(token), `EXTERNAL_NOTES_TOKEN_MISSING:${token}`);
  }
}

function validateResults() {
  const results = parseJson(RESULTS_PATH);
  requireCondition(
    results.taskId === "seq_308_phase4_manage_waitlist_assisted_matrix",
    "RESULTS_TASK_ID_DRIFT",
  );
  requireCondition(
    results.schemaVersion === "308.phase4.manage-waitlist-assisted-matrix.v1",
    "RESULTS_SCHEMA_VERSION_DRIFT",
  );
  requireCondition(results.overallStatus === "passed", "RESULTS_OVERALL_STATUS_NOT_PASSED");
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

function validateClusters() {
  const clusters = parseJson(CLUSTERS_PATH);
  requireCondition(
    clusters.taskId === "seq_308_phase4_manage_waitlist_assisted_matrix",
    "CLUSTERS_TASK_ID_DRIFT",
  );
  requireCondition(
    clusters.schemaVersion === "308.phase4.manage-waitlist-assisted-failure-clusters.v1",
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
  }
}

function validateCi() {
  const ci = read(CI_PATH);
  for (const token of [
    "308_manage_command_truth.spec.ts",
    "308_waitlist_deadline_and_fallback.spec.ts",
    "308_assisted_booking_handoff_and_lease.spec.ts",
    "308_reconciliation_and_dispute_truth.spec.ts",
    "308_waitlist_truth_properties.spec.ts",
    "308_patient_manage_truth.spec.ts",
    "308_waitlist_offer_and_fallback.spec.ts",
    "308_staff_assisted_booking_and_recovery.spec.ts",
    "308_reconciliation_status_and_artifact_parity.spec.ts",
    "pnpm validate:308-phase4-manage-waitlist-assisted-matrix",
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
  validateTruthLab();
  validateExternalNotes();
  validateResults();
  validateClusters();
  validateCi();
  console.log("validate_308_phase4_manage_waitlist_assisted_matrix: ok");
}

main();
