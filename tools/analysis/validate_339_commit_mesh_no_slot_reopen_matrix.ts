import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  "tests/integration/339_commit_mesh_no_slot.helpers.ts",
  "tests/integration/339_commit_truth_and_confirmation_gate.spec.ts",
  "tests/integration/339_mesh_route_visibility_and_ack_debt.spec.ts",
  "tests/integration/339_no_slot_callback_return_and_reopen.spec.ts",
  "tests/property/339_monotone_truth_and_fallback_properties.spec.ts",
  "tests/playwright/339_commit_mesh_no_slot_reopen.helpers.ts",
  "tests/playwright/339_hub_commit_confirmation_and_drift.spec.ts",
  "tests/playwright/339_patient_network_confirmation_and_manage.spec.ts",
  "tests/playwright/339_practice_visibility_and_acknowledgement.spec.ts",
  "tests/playwright/339_hub_recovery_and_reopen.spec.ts",
  "docs/testing/339_phase5_commit_mesh_no_slot_reopen_test_plan.md",
  "docs/testing/339_phase5_commit_mesh_no_slot_reopen_lab.html",
  "data/analysis/339_external_reference_notes.md",
  "data/test-reports/339_commit_mesh_no_slot_reopen_results.json",
  "data/test-reports/339_commit_mesh_no_slot_reopen_failure_clusters.json",
  "output/playwright/339-hub-commit-confirmation-and-drift-trace.zip",
  "output/playwright/339-hub-commit-confirmation-and-drift.png",
  "output/playwright/339-hub-commit-confirmation-and-drift.json",
  "output/playwright/339-patient-network-confirmation-and-manage-trace.zip",
  "output/playwright/339-patient-network-confirmation-and-manage.png",
  "output/playwright/339-patient-network-confirmation-and-manage.json",
  "output/playwright/339-practice-visibility-and-acknowledgement-trace.zip",
  "output/playwright/339-practice-visibility-and-acknowledgement.png",
  "output/playwright/339-practice-visibility-and-acknowledgement.json",
  "output/playwright/339-hub-recovery-and-reopen-trace.zip",
  "output/playwright/339-hub-recovery-and-reopen.png",
  "output/playwright/339-hub-recovery-and-reopen.json"
] as const;

const REQUIRED_SCRIPT =
  '"validate:339-commit-mesh-no-slot-reopen": "pnpm exec tsx ./tools/analysis/validate_339_commit_mesh_no_slot_reopen_matrix.ts"';

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath: string): string {
  const filePath = path.join(ROOT, relativePath);
  requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${relativePath}`);
  return fs.readFileSync(filePath, "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function checklistState(taskPrefix: string): string {
  const escaped = taskPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = read("prompt/checklist.md").match(new RegExp(`^- \\[([ Xx-])\\] ${escaped}`, "m"));
  requireCondition(match, `CHECKLIST_ROW_MISSING:${taskPrefix}`);
  return match[1]!.toUpperCase();
}

function validateChecklist(): void {
  for (const dependency of [
    "par_321_phase5_track_backend_build_native_hub_booking_commit_and_practice_continuity_messaging",
    "par_322_phase5_track_backend_build_cross_org_message_and_mesh_dispatch_settlement_chain",
    "par_323_phase5_track_backend_build_no_slot_urgent_bounce_back_callback_fallback_and_reopen_workflows",
    "par_324_phase5_track_backend_build_network_reminders_manage_flows_and_practice_visibility_projections",
    "par_329_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_cross_org_commit_confirmation_and_practice_visibility_surfaces",
    "par_330_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_network_reminders_manage_flows_and_message_timeline_views",
    "par_331_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_no_slot_reopen_and_urgent_bounce_back_recovery_views",
    "par_334_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_cross_org_accessibility_content_and_artifact_handoff_refinements",
    "seq_335_phase5_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_mesh_mailboxes_and_cross_org_message_routes",
    "seq_337_phase5_merge_Playwright_or_other_appropriate_tooling_integrate_network_coordination_with_local_booking_and_patient_portal_manage_flows",
    "seq_338_phase5_Playwright_or_other_appropriate_tooling_testing_run_org_boundary_capacity_ingestion_candidate_ranking_and_sla_suites"
  ]) {
    requireCondition(checklistState(dependency) === "X", `DEPENDENCY_INCOMPLETE:${dependency}`);
  }

  const current = checklistState(
    "seq_339_phase5_Playwright_or_other_appropriate_tooling_testing_run_hub_commit_mesh_dispatch_no_slot_and_reopen_suites",
  );
  requireCondition(["-", "X"].includes(current), "TASK_NOT_CLAIMED:seq_339");
}

function validateRequiredFiles(): void {
  for (const relativePath of REQUIRED_FILES) {
    requireCondition(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
  }
}

function validatePackageScript(): void {
  requireCondition(
    read("package.json").includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:339-commit-mesh-no-slot-reopen",
  );
}

function validateDocsAndNotes(): void {
  const plan = read("docs/testing/339_phase5_commit_mesh_no_slot_reopen_test_plan.md");
  const lab = read("docs/testing/339_phase5_commit_mesh_no_slot_reopen_lab.html");
  const notes = read("data/analysis/339_external_reference_notes.md");

  for (const token of [
    "HubOfferToConfirmationTruthProjection",
    "PracticeVisibilityProjection",
    "callback transfer",
    "practice informed",
    "practice acknowledged",
    "diff-first reopen",
    "machine-readable bundle",
  ]) {
    requireCondition(plan.includes(token), `PLAN_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    'data-testid="Phase5CommitMeshNoSlotReopenLab"',
    "grid-template-columns: 320px minmax(780px, 1fr) 420px",
    "max-width: 1720px",
    "min-height: 72px",
    "minmax(280px, auto)",
    "#3158e0",
    "#0f766e",
    "#7c3aed",
    "#b7791f",
    "#b42318",
    "Keyboard traversal across rail, canvas, inspector, and evidence table stays explicit.",
    "No hover-only disclosure.",
  ]) {
    requireCondition(lab.includes(token), `LAB_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "Isolation | Playwright",
    "Best Practices | Playwright",
    "Snapshot testing | Playwright",
    "Trace viewer | Playwright",
    "Accessibility testing | Playwright",
    "Debugging Tests | Playwright",
    "Understanding Success Criterion 4.1.3: Status Messages",
    "Understanding Success Criterion 1.4.10: Reflow",
    "Dialog (Modal) Pattern | APG | WAI | W3C",
    "Message Exchange for Social Care and Health - NHS England Digital",
    "Interaction methods - NHS England Digital",
    "Confirmation page – NHS digital service manual",
    "Interruption page – NHS digital service manual",
    "Accessed on 2026-04-23",
  ]) {
    requireCondition(notes.includes(token), `EXTERNAL_NOTES_TOKEN_MISSING:${token}`);
  }
}

function validateResultsBundle(): void {
  const results = readJson<{
    overallStatus?: string;
    resolvedRiskRefs?: string[];
    unsupportedGapRefs?: string[];
    environment?: Record<string, unknown>;
    verificationRuns?: Array<{ status?: string; artifactRefs?: string[] }>;
    suiteResults?: Array<{ suiteId?: string; status?: string; caseIds?: string[] }>;
    caseResults?: Array<{ caseId?: string; status?: string; environmentId?: string; seed?: string; artifactRefs?: string[] }>;
  }>("data/test-reports/339_commit_mesh_no_slot_reopen_results.json");

  requireCondition(results.overallStatus === "passed", "RESULTS_OVERALL_STATUS_INVALID");
  requireCondition(results.environment?.cwd === "/Users/test/Code/V", "RESULTS_ENVIRONMENT_CWD_INVALID");
  requireCondition(results.environment?.timezone === "Europe/London", "RESULTS_ENVIRONMENT_TIMEZONE_INVALID");
  requireCondition(Array.isArray(results.unsupportedGapRefs), "RESULTS_UNSUPPORTED_GAP_REFS_MISSING");
  requireCondition(results.unsupportedGapRefs?.length === 0, "RESULTS_UNSUPPORTED_GAP_REFS_NOT_EMPTY");
  requireCondition(
    results.resolvedRiskRefs?.includes("false_calmness_pending_native_commit_gate"),
    "RESOLVED_RISK_MISSING:false_calmness_pending_native_commit_gate",
  );
  requireCondition(
    results.resolvedRiskRefs?.includes("offer_expiry_fence_recorded_at_drift"),
    "RESOLVED_RISK_MISSING:offer_expiry_fence_recorded_at_drift",
  );

  for (const run of results.verificationRuns ?? []) {
    requireCondition(run.status === "passed", `VERIFICATION_RUN_NOT_PASSED:${run.artifactRefs?.[0] ?? "unknown"}`);
    for (const artifactRef of run.artifactRefs ?? []) {
      requireCondition(fs.existsSync(path.join(ROOT, artifactRef)), `VERIFICATION_ARTIFACT_MISSING:${artifactRef}`);
    }
  }

  for (const suiteId of [
    "commit_truth_and_confirmation_gate",
    "mesh_route_visibility_and_ack_debt",
    "no_slot_callback_return_and_reopen",
    "monotone_truth_and_fallback_properties",
    "hub_commit_confirmation_and_drift_browser",
    "patient_network_confirmation_and_manage_browser",
    "practice_visibility_and_acknowledgement_browser",
    "hub_recovery_and_reopen_browser",
  ]) {
    requireCondition(
      results.suiteResults?.some((suite) => suite.suiteId === suiteId && suite.status === "passed"),
      `SUITE_RESULT_MISSING_OR_NOT_PASSED:${suiteId}`,
    );
  }

  for (const caseId of [
    "COMMIT339_001",
    "COMMIT339_002",
    "MESH339_001",
    "MESH339_002",
    "FALLBACK339_001",
    "FALLBACK339_002",
    "PROP339_001",
    "PROP339_002",
    "BROWSER339_001",
    "BROWSER339_002",
    "BROWSER339_003",
    "BROWSER339_004",
  ]) {
    requireCondition(
      results.caseResults?.some((entry) => entry.caseId === caseId && entry.status === "passed"),
      `CASE_RESULT_MISSING_OR_NOT_PASSED:${caseId}`,
    );
  }
}

function validateFailureClusters(): void {
  const clusters = readJson<{
    overallDisposition?: string;
    clusters?: Array<{ clusterId?: string; status?: string; artifactRefs?: string[] }>;
  }>("data/test-reports/339_commit_mesh_no_slot_reopen_failure_clusters.json");

  requireCondition(
    clusters.overallDisposition === "passed_after_repository_owned_fixes",
    "FAILURE_CLUSTER_DISPOSITION_INVALID",
  );

  for (const clusterId of [
    "false_calmness_pending_native_commit_gate",
    "offer_expiry_fence_recorded_at_drift",
  ]) {
    const cluster = clusters.clusters?.find((entry) => entry.clusterId === clusterId);
    requireCondition(cluster, `FAILURE_CLUSTER_MISSING:${clusterId}`);
    requireCondition(cluster.status === "resolved", `FAILURE_CLUSTER_NOT_RESOLVED:${clusterId}`);
    for (const artifactRef of cluster.artifactRefs ?? []) {
      requireCondition(fs.existsSync(path.join(ROOT, artifactRef)), `FAILURE_CLUSTER_ARTIFACT_MISSING:${artifactRef}`);
    }
  }
}

function main(): void {
  validateChecklist();
  validateRequiredFiles();
  validatePackageScript();
  validateDocsAndNotes();
  validateResultsBundle();
  validateFailureClusters();
  console.log("339 commit / MESH / no-slot / reopen validation passed");
}

main();
