import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  "tests/playwright/340_phase5_browser_matrix.helpers.ts",
  "tests/playwright/340_patient_choice_truth_and_continuity.spec.ts",
  "tests/playwright/340_cross_org_visibility_and_scope_drift.spec.ts",
  "tests/playwright/340_responsive_same_shell_continuity.spec.ts",
  "tests/playwright/340_accessibility_content_and_regression.spec.ts",
  "docs/test-plans/340_phase5_patient_choice_cross_org_responsive_regression_plan.md",
  "docs/testing/340_phase5_browser_evidence_board.html",
  "data/analysis/340_external_reference_notes.json",
  "data/analysis/340_accessibility_matrix.csv",
  "data/analysis/340_responsive_project_matrix.csv",
  "data/analysis/340_cross_org_visibility_matrix.csv",
  "data/analysis/340_patient_choice_truth_matrix.csv",
  "data/test-results/340_phase5_browser_suite_summary.json",
  "data/test-results/340_phase5_trace_registry.json",
  "data/test-results/340_phase5_visual_baseline_registry.json",
  "data/test-results/340_phase5_aria_snapshot_registry.json",
  "tools/testing/aggregate_340_phase5_browser_results.ts",
  "tools/analysis/validate_340_phase5_browser_suite.ts",
  "output/playwright/340-patient-choice-truth-and-continuity-matrix.json",
  "output/playwright/340-cross-org-visibility-and-scope-drift-matrix.json",
  "output/playwright/340-responsive-same-shell-continuity-matrix.json",
  "output/playwright/340-accessibility-content-and-regression-matrix.json",
] as const;

const REQUIRED_SCRIPT =
  '"validate:340-phase5-browser-suite": "pnpm exec tsx ./tools/analysis/validate_340_phase5_browser_suite.ts"';

const REQUIRED_CASE_IDS = [
  "CHOICE340_001",
  "CHOICE340_002",
  "CHOICE340_003",
  "CHOICE340_004",
  "CHOICE340_005",
  "CHOICE340_006",
  "CHOICE340_007",
  "VIS340_001",
  "VIS340_002",
  "VIS340_003",
  "VIS340_004",
  "VIS340_005",
  "RESP340_001",
  "RESP340_002",
  "RESP340_003",
  "RESP340_004",
  "RESP340_005",
  "RESP340_006",
  "RESP340_007",
  "A11Y340_001",
  "A11Y340_002",
  "A11Y340_003",
  "A11Y340_004",
  "A11Y340_005",
] as const;

const REQUIRED_PROJECT_IDS = [
  "hub_operator_wide_chromium",
  "hub_operator_narrow_chromium",
  "hub_operator_tablet_portrait_chromium",
  "hub_operator_tablet_landscape_chromium",
  "hub_operator_reduced_motion_chromium",
  "cross_org_scope_variation_chromium",
  "patient_authenticated_chromium_wide",
  "patient_wide_desktop_firefox",
  "patient_mobile_portrait_chromium",
  "patient_mobile_portrait_webkit",
  "patient_high_zoom_reflow_chromium",
] as const;

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
    "par_328_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_network_alternatives_choice_and_callback_fallback_views",
    "par_329_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_cross_org_commit_confirmation_and_practice_visibility_surfaces",
    "par_330_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_network_reminders_manage_flows_and_message_timeline_views",
    "par_331_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_no_slot_reopen_and_urgent_bounce_back_recovery_views",
    "par_332_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_org_aware_access_controls_and_acting_context_switcher",
    "par_333_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_mobile_and_narrow_screen_hub_workflows",
    "par_334_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_cross_org_accessibility_content_and_artifact_handoff_refinements",
    "seq_337_phase5_merge_Playwright_or_other_appropriate_tooling_integrate_network_coordination_with_local_booking_and_patient_portal_manage_flows",
    "seq_338_phase5_Playwright_or_other_appropriate_tooling_testing_run_org_boundary_capacity_ingestion_candidate_ranking_and_sla_suites",
    "seq_339_phase5_Playwright_or_other_appropriate_tooling_testing_run_hub_commit_mesh_dispatch_no_slot_and_reopen_suites",
  ]) {
    requireCondition(checklistState(dependency) === "X", `DEPENDENCY_INCOMPLETE:${dependency}`);
  }

  const current = checklistState(
    "seq_340_phase5_Playwright_or_other_appropriate_tooling_testing_run_patient_choice_cross_org_visibility_and_responsive_regression_suites",
  );
  requireCondition(["-", "X"].includes(current), "TASK_NOT_CLAIMED:seq_340");
}

function validateRequiredFiles(): void {
  for (const relativePath of REQUIRED_FILES) {
    requireCondition(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
  }
}

function validatePackageScript(): void {
  requireCondition(
    read("package.json").includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:340-phase5-browser-suite",
  );
}

function validateDocsAndNotes(): void {
  const plan = read("docs/test-plans/340_phase5_patient_choice_cross_org_responsive_regression_plan.md");
  const board = read("docs/testing/340_phase5_browser_evidence_board.html");
  const notes = read("data/analysis/340_external_reference_notes.json");

  for (const token of [
    "Route Inventory",
    "Risk Class Mapping",
    "Deterministic Fixture Controls",
    "Patient choice visible frontier",
    "Cross-org minimum-necessary",
    "Reduced-motion and high-zoom",
    "Repository-Owned Defects Closed By 340",
    "patient_mission_stack_sticky_primary_visibility_webkit",
    "hub_minimum_necessary_internal_field_token_leak",
    "hub_break_glass_focus_trap_and_drawer_focus_return",
  ]) {
    requireCondition(plan.includes(token), `PLAN_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    'data-testid="Phase5BrowserEvidenceBoard"',
    'data-testid="Phase5BrowserEvidenceMasthead"',
    'data-testid="Phase5BrowserEvidenceSummaryStrip"',
    'data-testid="Phase5BrowserEvidenceNav"',
    'data-testid="Phase5BrowserEvidenceCanvas"',
    'data-testid="Phase5BrowserEvidenceInspector"',
    'data-testid="Phase5BrowserEvidenceTimeline"',
    "max-width: 1720px",
    "grid-template-columns: 280px minmax(0, 1fr) 400px",
    "min-height: 72px",
    "#F6F8FB",
    "#EDF2F7",
    "#3158E0",
    "#5B61F6",
    "No critical failures recorded.",
  ]) {
    requireCondition(board.includes(token), `BOARD_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    '"accessedOn": "2026-04-23"',
    "Accessibility testing | Playwright",
    "Snapshot testing | Playwright",
    "Isolation | Playwright",
    "Emulation | Playwright",
    "Trace viewer | Playwright",
    "Best Practices | Playwright",
    "Understanding Success Criterion 1.4.10: Reflow | WAI | W3C",
    "Understanding Success Criterion 4.1.3: Status Messages | WAI | W3C",
    "Understanding Success Criterion 2.4.13: Focus Appearance | WAI | W3C",
    "Understanding Success Criterion 2.5.8: Target Size (Minimum) | WAI | W3C",
    "Understanding Success Criterion 2.3.3: Animation from Interactions | WAI | W3C",
    "Dialog (Modal) Pattern | APG | WAI | W3C",
    "Disclosure (Show/Hide) Pattern | APG | WAI | W3C",
    "Listbox Pattern | APG | WAI | W3C",
    "Tabs Pattern | APG | WAI | W3C",
    "Confirmation page – NHS digital service manual",
    "Interruption page – NHS digital service manual",
    "Triage – Linear Docs",
    "Vercel Design",
    "Data table usage",
  ]) {
    requireCondition(notes.includes(token), `EXTERNAL_NOTES_TOKEN_MISSING:${token}`);
  }
}

function validateSummaryAndRegistries(): void {
  const summary = readJson<{
    overallStatus?: string;
    statusVocabulary?: string[];
    commitRef?: string;
    shortCommitRef?: string;
    environmentRef?: string;
    gateRecommendation?: string;
    environment?: Record<string, unknown>;
    totalSpecs?: number;
    passedSpecs?: number;
    failedSpecs?: number;
    flakySpecs?: number;
    skippedSpecs?: number;
    flakeCount?: number;
    criticalFailures?: unknown[];
    resolvedRiskRefs?: string[];
    unsupportedGapRefs?: string[];
    scenarioFamilySummaries?: Array<{ familyId?: string; status?: string }>;
    browserProjectSummaries?: Array<{ projectId?: string; status?: string }>;
    suiteResults?: Array<{ suiteId?: string; status?: string; artifactRefs?: string[] }>;
    caseResults?: Array<{ caseId?: string; status?: string; artifactRefs?: string[] }>;
    traceRefs?: string[];
    ariaSnapshotRefs?: string[];
    visualBaselineRefs?: string[];
    verificationRuns?: Array<{ status?: string; artifactRefs?: string[] }>;
    evidenceBoardRef?: string;
  }>("data/test-results/340_phase5_browser_suite_summary.json");

  requireCondition(summary.overallStatus === "passed", "SUMMARY_STATUS_INVALID");
  requireCondition(summary.statusVocabulary?.includes("flaky"), "SUMMARY_STATUS_VOCAB_MISSING:flaky");
  requireCondition(summary.statusVocabulary?.includes("skipped"), "SUMMARY_STATUS_VOCAB_MISSING:skipped");
  requireCondition(summary.commitRef && summary.commitRef.length >= 7, "SUMMARY_COMMIT_REF_INVALID");
  requireCondition(summary.shortCommitRef && summary.shortCommitRef.length >= 7, "SUMMARY_SHORT_COMMIT_INVALID");
  requireCondition(
    summary.environmentRef?.startsWith("local_nonprod_browser_matrix:"),
    "SUMMARY_ENVIRONMENT_REF_INVALID",
  );
  requireCondition(summary.gateRecommendation === "ready_for_seq_341_exit_gate_review", "SUMMARY_GATE_INVALID");
  requireCondition(summary.environment?.cwd === "/Users/test/Code/V", "SUMMARY_CWD_INVALID");
  requireCondition(summary.environment?.timezone === "Europe/London", "SUMMARY_TIMEZONE_INVALID");
  requireCondition(summary.totalSpecs === 4, "SUMMARY_TOTAL_SPECS_INVALID");
  requireCondition(summary.passedSpecs === 4, "SUMMARY_PASSED_SPECS_INVALID");
  requireCondition(summary.failedSpecs === 0, "SUMMARY_FAILED_SPECS_INVALID");
  requireCondition(summary.flakySpecs === 0, "SUMMARY_FLAKY_SPECS_INVALID");
  requireCondition(summary.skippedSpecs === 0, "SUMMARY_SKIPPED_SPECS_INVALID");
  requireCondition(summary.flakeCount === 0, "SUMMARY_FLAKE_COUNT_INVALID");
  requireCondition((summary.criticalFailures ?? []).length === 0, "SUMMARY_CRITICAL_FAILURES_NOT_EMPTY");
  requireCondition((summary.unsupportedGapRefs ?? []).length === 0, "SUMMARY_UNSUPPORTED_GAPS_NOT_EMPTY");

  for (const riskRef of [
    "patient_mission_stack_sticky_primary_visibility_webkit",
    "hub_minimum_necessary_internal_field_token_leak",
    "hub_break_glass_focus_trap_and_drawer_focus_return",
  ]) {
    requireCondition(summary.resolvedRiskRefs?.includes(riskRef), `SUMMARY_RESOLVED_RISK_MISSING:${riskRef}`);
  }

  for (const familyId of [
    "patient_choice_truth",
    "cross_org_visibility",
    "responsive_continuity",
    "accessibility_content",
  ]) {
    requireCondition(
      summary.scenarioFamilySummaries?.some((entry) => entry.familyId === familyId && entry.status === "passed"),
      `SCENARIO_FAMILY_MISSING_OR_NOT_PASSED:${familyId}`,
    );
  }

  for (const suiteId of [
    "patient_choice_truth_and_continuity_browser",
    "cross_org_visibility_and_scope_drift_browser",
    "responsive_same_shell_continuity_browser",
    "accessibility_content_and_regression_browser",
  ]) {
    requireCondition(
      summary.suiteResults?.some((entry) => entry.suiteId === suiteId && entry.status === "passed"),
      `SUITE_RESULT_MISSING_OR_NOT_PASSED:${suiteId}`,
    );
  }

  for (const projectId of REQUIRED_PROJECT_IDS) {
    requireCondition(
      summary.browserProjectSummaries?.some((entry) => entry.projectId === projectId && entry.status === "passed"),
      `PROJECT_SUMMARY_MISSING_OR_NOT_PASSED:${projectId}`,
    );
  }

  for (const caseId of REQUIRED_CASE_IDS) {
    requireCondition(
      summary.caseResults?.some((entry) => entry.caseId === caseId && entry.status === "passed"),
      `CASE_RESULT_MISSING_OR_NOT_PASSED:${caseId}`,
    );
  }

  for (const verificationRun of summary.verificationRuns ?? []) {
    requireCondition(verificationRun.status === "passed", "VERIFICATION_RUN_NOT_PASSED");
    for (const artifactRef of verificationRun.artifactRefs ?? []) {
      requireCondition(fs.existsSync(path.join(ROOT, artifactRef)), `VERIFICATION_ARTIFACT_MISSING:${artifactRef}`);
    }
  }

  requireCondition(summary.evidenceBoardRef === "docs/testing/340_phase5_browser_evidence_board.html", "SUMMARY_BOARD_REF_INVALID");

  const traceRegistry = readJson<{ artifacts?: Array<{ artifactRef?: string; suiteId?: string }> }>(
    "data/test-results/340_phase5_trace_registry.json",
  );
  const visualRegistry = readJson<{ artifacts?: Array<{ artifactRef?: string; suiteId?: string }> }>(
    "data/test-results/340_phase5_visual_baseline_registry.json",
  );
  const ariaRegistry = readJson<{ artifacts?: Array<{ artifactRef?: string; suiteId?: string }> }>(
    "data/test-results/340_phase5_aria_snapshot_registry.json",
  );

  requireCondition((traceRegistry.artifacts ?? []).length >= 11, "TRACE_REGISTRY_TOO_SMALL");
  requireCondition((visualRegistry.artifacts ?? []).length >= 11, "VISUAL_REGISTRY_TOO_SMALL");
  requireCondition((ariaRegistry.artifacts ?? []).length >= 4, "ARIA_REGISTRY_TOO_SMALL");

  for (const registry of [traceRegistry, visualRegistry, ariaRegistry]) {
    for (const artifact of registry.artifacts ?? []) {
      requireCondition(artifact.artifactRef, "REGISTRY_ARTIFACT_REF_MISSING");
      requireCondition(fs.existsSync(path.join(ROOT, artifact.artifactRef!)), `REGISTRY_ARTIFACT_MISSING:${artifact.artifactRef}`);
      requireCondition(artifact.suiteId, "REGISTRY_SUITE_ID_MISSING");
    }
  }

  requireCondition(
    summary.traceRefs?.length === (traceRegistry.artifacts ?? []).length,
    "TRACE_REF_COUNT_MISMATCH",
  );
  requireCondition(
    summary.visualBaselineRefs?.length === (visualRegistry.artifacts ?? []).length,
    "VISUAL_REF_COUNT_MISMATCH",
  );
  requireCondition(
    summary.ariaSnapshotRefs?.length === (ariaRegistry.artifacts ?? []).length,
    "ARIA_REF_COUNT_MISMATCH",
  );
}

function validateMatrices(): void {
  const patientChoiceMatrix = read("data/analysis/340_patient_choice_truth_matrix.csv");
  const crossOrgMatrix = read("data/analysis/340_cross_org_visibility_matrix.csv");
  const responsiveMatrix = read("data/analysis/340_responsive_project_matrix.csv");
  const accessibilityMatrix = read("data/analysis/340_accessibility_matrix.csv");

  for (const token of ["CHOICE340_001", "CHOICE340_007", "offer_entry_328_riverside_1830", "offer_entry_328_wharf_1910"]) {
    requireCondition(patientChoiceMatrix.includes(token), `PATIENT_CHOICE_MATRIX_TOKEN_MISSING:${token}`);
  }
  for (const token of ["VIS340_001", "VIS340_005", "origin_practice_visibility", "leakedFieldCount"]) {
    requireCondition(crossOrgMatrix.includes(token), `CROSS_ORG_MATRIX_TOKEN_MISSING:${token}`);
  }
  for (const token of ["RESP340_003", "mission_stack", "RESP340_007", "transitionDuration"]) {
    requireCondition(responsiveMatrix.includes(token), `RESPONSIVE_MATRIX_TOKEN_MISSING:${token}`);
  }
  for (const token of ["A11Y340_004", "HubActingContextChip", "pendingCopyGuard", "liveRegionRole"]) {
    requireCondition(accessibilityMatrix.includes(token), `ACCESSIBILITY_MATRIX_TOKEN_MISSING:${token}`);
  }
}

function main(): void {
  validateChecklist();
  validateRequiredFiles();
  validatePackageScript();
  validateDocsAndNotes();
  validateSummaryAndRegistries();
  validateMatrices();
  console.log("340 phase5 browser suite validation passed");
}

main();
