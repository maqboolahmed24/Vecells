import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildSmokeScenario } from "../../scripts/capacity/336_partner_feed_lib.ts";
import { createInitialHubShellState, resolveHubShellSnapshot } from "../../apps/hub-desk/src/hub-desk-shell.model.ts";
import {
  buildSnapshotCommand,
  setupNetworkCapacityHarness,
} from "../../tests/integration/318_network_capacity.helpers.ts";
import {
  buildNoTrustedSupplyBindings,
  createHubQueueCase,
  publishQueue,
  setupHubQueueHarness,
} from "../../tests/integration/319_hub_queue.helpers.ts";
import {
  EXPECTED_VISIBLE_FIELDS_338,
  materializeVisibilityProjection338,
} from "../../tests/integration/338_scope_capacity.helpers.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  "tests/integration/338_scope_capacity.helpers.ts",
  "tests/integration/338_acting_context_and_visibility_truth.spec.ts",
  "tests/integration/338_capacity_feed_admission_and_quarantine.spec.ts",
  "tests/integration/338_candidate_ranking_and_queue_projection.spec.ts",
  "tests/integration/338_sla_timer_and_breach_posture.spec.ts",
  "tests/property/338_ranking_and_visibility_properties.spec.ts",
  "tests/playwright/338_scope_capacity.helpers.ts",
  "tests/playwright/338_org_boundary_and_scope_switcher.spec.ts",
  "tests/playwright/338_hub_queue_ranking_and_sla.spec.ts",
  "tests/playwright/338_hub_mission_stack_responsive.spec.ts",
  "tests/playwright/338_capacity_degraded_and_quarantined_visuals.spec.ts",
  "docs/testing/338_phase5_scope_capacity_ranking_sla_test_plan.md",
  "docs/testing/338_phase5_scope_capacity_ranking_sla_lab.html",
  "data/analysis/338_external_reference_notes.md",
  "data/test-reports/338_scope_capacity_ranking_sla_results.json",
  "data/test-reports/338_scope_capacity_ranking_sla_failure_clusters.json",
  "data/contracts/PHASE5_BATCH_316_323_INTERFACE_GAP_QUEUE_PATIENT_CHOICE_EXPIRY.json",
  "output/playwright/338-org-boundary-primary-trace.zip",
  "output/playwright/338-org-boundary-isolated-trace.zip",
  "output/playwright/338-org-boundary-denied.png",
  "output/playwright/338-org-boundary-isolated-default.png",
  "output/playwright/338-org-boundary-scope-snapshots.json",
  "output/playwright/338-hub-queue-ranking-and-sla-trace.zip",
  "output/playwright/338-hub-queue-ranking-and-sla.png",
  "output/playwright/338-hub-queue-ranking-and-sla.json",
  "output/playwright/338-hub-mission-stack-mobile-trace.zip",
  "output/playwright/338-hub-mission-stack-tablet-trace.zip",
  "output/playwright/338-hub-mission-stack-320-trace.zip",
  "output/playwright/338-hub-mission-stack-mobile.png",
  "output/playwright/338-hub-mission-stack-tablet.png",
  "output/playwright/338-hub-mission-stack-320-reduced.png",
  "output/playwright/338-hub-mission-stack-responsive.json",
  "output/playwright/338-capacity-degraded-and-quarantined-trace.zip",
  "output/playwright/338-capacity-degraded-and-quarantined.png",
  "output/playwright/338-capacity-degraded-and-quarantined.json",
] as const;

const REQUIRED_SCRIPT =
  '"validate:338-scope-capacity-ranking-sla": "pnpm exec tsx ./tools/analysis/validate_338_scope_capacity_ranking_sla_matrix.ts"';

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
  const match = read("prompt/checklist.md").match(
    new RegExp(`^- \\[([ Xx-])\\] ${taskPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m"),
  );
  requireCondition(match, `CHECKLIST_ROW_MISSING:${taskPrefix}`);
  return match[1]!.toUpperCase();
}

function validateChecklist(): void {
  for (const dependency of [
    "par_332_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_org_aware_access_controls_and_acting_context_switcher",
    "par_333_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_mobile_and_narrow_screen_hub_workflows",
    "seq_336_phase5_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_network_capacity_feeds_and_partner_credentials",
    "seq_337_phase5_merge_Playwright_or_other_appropriate_tooling_integrate_network_coordination_with_local_booking_and_patient_portal_manage_flows",
  ]) {
    requireCondition(checklistState(dependency) === "X", `DEPENDENCY_INCOMPLETE:${dependency}`);
  }
  const state = checklistState(
    "seq_338_phase5_Playwright_or_other_appropriate_tooling_testing_run_org_boundary_capacity_ingestion_candidate_ranking_and_sla_suites",
  );
  requireCondition(["-", "X"].includes(state), "TASK_NOT_CLAIMED:seq_338");
}

function validateRequiredFiles(): void {
  for (const relativePath of REQUIRED_FILES) {
    requireCondition(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
  }
}

function validatePackageScript(): void {
  requireCondition(read("package.json").includes(REQUIRED_SCRIPT), "PACKAGE_SCRIPT_MISSING:validate:338-scope-capacity-ranking-sla");
}

function validateDocsAndNotes(): void {
  const plan = read("docs/testing/338_phase5_scope_capacity_ranking_sla_test_plan.md");
  const lab = read("docs/testing/338_phase5_scope_capacity_ranking_sla_lab.html");
  const notes = read("data/analysis/338_external_reference_notes.md");

  for (const token of [
    "Scope drift freeze",
    "Degraded capacity filter",
    "Supplier drift quarantine",
    "Queue delta continuity",
    "Mission stack parity",
    "UNSUPPORTED338_001",
  ]) {
    requireCondition(plan.includes(token), `PLAN_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    'data-testid="Phase5ScopeCapacityRankingSlaLab"',
    "grid-template-columns: 320px minmax(760px, 1fr) 420px",
    "min-height: 72px",
    "#3158e0",
    "#0f766e",
    "#b7791f",
    "#b42318",
    "#5b61f6",
    "Keyboard selection synchronizes",
  ]) {
    requireCondition(lab.includes(token), `LAB_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "Isolation | Playwright",
    "Best Practices | Playwright",
    "Emulation | Playwright",
    "Snapshot testing | Playwright",
    "Trace viewer | Playwright",
    "Reflow",
    "Focus Appearance",
    "Target Size",
    "Dialog (Modal) Pattern",
    "Message Exchange for Social Care and Health",
    "Interaction methods",
    "Slot - FHIR v4.0.1",
    "Appointment - FHIR v4.0.1",
    "Accessed on 2026-04-23",
  ]) {
    requireCondition(notes.includes(token), `EXTERNAL_NOTES_TOKEN_MISSING:${token}`);
  }
}

function validateResultsBundle(): void {
  const results = readJson<{
    overallStatus?: string;
    environment?: Record<string, unknown>;
    verificationRuns?: Array<{ status?: string; artifactRefs?: string[] }>;
    suiteResults?: Array<{ suiteId?: string; status?: string; caseIds?: string[] }>;
    caseResults?: Array<{ caseId?: string; status?: string; environmentId?: string; seed?: string; artifactRefs?: string[] }>;
    unsupportedGapRefs?: string[];
  }>("data/test-reports/338_scope_capacity_ranking_sla_results.json");
  const clusters = readJson<{
    overallDisposition?: string;
    clusters?: Array<{ clusterId?: string; status?: string; artifactRefs?: string[] }>;
  }>("data/test-reports/338_scope_capacity_ranking_sla_failure_clusters.json");

  requireCondition(results.overallStatus === "passed", "RESULTS_OVERALL_STATUS_INVALID");
  requireCondition(results.environment?.cwd === "/Users/test/Code/V", "RESULTS_ENVIRONMENT_CWD_INVALID");
  requireCondition(results.environment?.timezone === "Europe/London", "RESULTS_ENVIRONMENT_TIMEZONE_INVALID");
  requireCondition(
    results.unsupportedGapRefs?.includes(
      "data/contracts/PHASE5_BATCH_316_323_INTERFACE_GAP_QUEUE_PATIENT_CHOICE_EXPIRY.json",
    ),
    "RESULTS_UNSUPPORTED_GAP_REF_MISSING",
  );

  for (const run of results.verificationRuns ?? []) {
    requireCondition(run.status === "passed", `VERIFICATION_RUN_NOT_PASSED:${run.artifactRefs?.[0] ?? "unknown"}`);
    for (const artifactRef of run.artifactRefs ?? []) {
      requireCondition(fs.existsSync(path.join(ROOT, artifactRef)), `VERIFICATION_ARTIFACT_MISSING:${artifactRef}`);
    }
  }

  for (const suiteId of [
    "acting_context_and_visibility_truth",
    "capacity_feed_admission_and_quarantine",
    "candidate_ranking_and_queue_projection",
    "sla_timer_and_breach_posture",
    "ranking_and_visibility_properties",
    "org_boundary_and_scope_switcher_browser",
    "hub_queue_ranking_and_sla_browser",
    "hub_mission_stack_responsive_browser",
    "capacity_degraded_and_quarantined_browser",
  ]) {
    requireCondition(
      results.suiteResults?.some((suite) => suite.suiteId === suiteId && suite.status === "passed"),
      `SUITE_RESULT_MISSING_OR_NOT_PASSED:${suiteId}`,
    );
  }

  requireCondition(
    results.caseResults?.some(
      (entry) =>
        entry.caseId === "UNSUPPORTED338_001" &&
        entry.status === "unsupported" &&
        entry.seed === "patient_choice_expiry_gap",
    ),
    "UNSUPPORTED_CASE_RESULT_MISSING",
  );

  for (const caseId of [
    "SCOPE338_001",
    "SCOPE338_002",
    "CAP338_001",
    "CAP338_002",
    "RANK338_001",
    "RANK338_002",
    "SLA338_001",
    "PROP338_001",
    "PROP338_002",
    "BROWSER338_001",
    "BROWSER338_002",
    "BROWSER338_003",
    "BROWSER338_004",
  ]) {
    requireCondition(
      results.caseResults?.some((entry) => entry.caseId === caseId && entry.status === "passed"),
      `CASE_RESULT_MISSING_OR_NOT_PASSED:${caseId}`,
    );
  }

  requireCondition(
    clusters.overallDisposition === "passed_with_explicit_unsupported_gap",
    "FAILURE_CLUSTER_DISPOSITION_INVALID",
  );
  requireCondition(
    clusters.clusters?.some(
      (cluster) =>
        cluster.clusterId === "patient_choice_expiry_upstream_gap" &&
        cluster.status === "unsupported",
    ),
    "FAILURE_CLUSTER_UNSUPPORTED_GAP_MISSING",
  );
}

function validatePlaywrightProofFiles(): void {
  const orgBoundary = read("tests/playwright/338_org_boundary_and_scope_switcher.spec.ts");
  const queueBrowser = read("tests/playwright/338_hub_queue_ranking_and_sla.spec.ts");
  const missionStack = read("tests/playwright/338_hub_mission_stack_responsive.spec.ts");
  const capacityVisuals = read("tests/playwright/338_capacity_degraded_and_quarantined_visuals.spec.ts");

  for (const token of [
    "buildExpectedHubScenario",
    "startTrace",
    "stopTraceOnError",
    "riverside_medical",
    "south_vale_network",
    "primaryContext",
    "isolatedContext",
  ]) {
    requireCondition(orgBoundary.includes(token), `ORG_BOUNDARY_SPEC_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "hub-buffer-queue-delta",
    "hub-apply-queue-delta",
    "DecisionDock",
    "opt-104-north-shore",
    "hub-case-087",
  ]) {
    requireCondition(queueBrowser.includes(token), `QUEUE_BROWSER_SPEC_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "HubMissionStackLayout",
    "hub-mission-stack-saved-view-callback_recovery",
    "HubMissionStackContinuityBinder",
    "assertNoHorizontalOverflow",
    "reducedMotion: \"reduce\"",
  ]) {
    requireCondition(missionStack.includes(token), `MISSION_STACK_SPEC_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "hub-filter-degraded",
    "supplier_drift",
    "diagnostic_only",
    "direct_commit",
    "hub-callback-fallback",
  ]) {
    requireCondition(capacityVisuals.includes(token), `CAPACITY_VISUAL_SPEC_TOKEN_MISSING:${token}`);
  }
}

async function validateAuthoritativeFacts(): Promise<void> {
  const hubProjection = await materializeVisibilityProjection338("hub_desk_visibility", "338_validator_hub");
  const originProjection = await materializeVisibilityProjection338(
    "origin_practice_visibility",
    "338_validator_origin",
  );
  const siteProjection = await materializeVisibilityProjection338("servicing_site_visibility", "338_validator_site");

  requireCondition(
    Object.keys(hubProjection.projection.visibleFields).sort().join("|") ===
      [...EXPECTED_VISIBLE_FIELDS_338.hub_desk_visibility].sort().join("|"),
    "HUB_VISIBILITY_FIELDS_DRIFT",
  );
  requireCondition(
    Object.keys(originProjection.projection.visibleFields).sort().join("|") ===
      [...EXPECTED_VISIBLE_FIELDS_338.origin_practice_visibility].sort().join("|"),
    "ORIGIN_VISIBILITY_FIELDS_DRIFT",
  );
  requireCondition(
    Object.keys(siteProjection.projection.visibleFields).sort().join("|") ===
      [...EXPECTED_VISIBLE_FIELDS_338.servicing_site_visibility].sort().join("|"),
    "SITE_VISIBILITY_FIELDS_DRIFT",
  );

  const capacityHarness = await setupNetworkCapacityHarness("338_validator_capacity");
  const smoke = await buildSmokeScenario();
  const capacitySnapshot = await capacityHarness.service.buildCandidateSnapshotForCase({
    ...buildSnapshotCommand("338_validator_capacity"),
    hubCoordinationCaseId: capacityHarness.claimed.hubCase.hubCoordinationCaseId,
    adapterBindings: smoke.bindings,
    deliveredMinutes: 120,
    cancelledMinutes: 0,
    replacementMinutes: 0,
  });
  const admissions = new Map(
    capacitySnapshot.sourceAdmissions.map((admission) => [admission.sourceRef, admission.admissionDisposition]),
  );
  requireCondition(
    admissions.get("feed_336_gp_connect_local_twin") === "trusted_admitted",
    "CAPACITY_TRUSTED_ADMISSION_DRIFT",
  );
  requireCondition(
    admissions.get("feed_336_batch_import_local_twin") === "quarantined_excluded",
    "CAPACITY_QUARANTINE_DRIFT",
  );

  const queueHarness = await setupHubQueueHarness("338_validator_queue");
  const urgent = await createHubQueueCase(queueHarness, {
    name: "urgent",
    priorityBand: "urgent",
    dueMinute: 18,
    latestSafeOfferMinute: 11,
    originPracticeOds: "PRA_338_VALIDATOR_URGENT",
    state: "coordinator_selecting",
  });
  const noTrusted = await createHubQueueCase(queueHarness, {
    name: "no_trusted",
    dueMinute: 70,
    originPracticeOds: "PRA_338_VALIDATOR_NO_TRUST",
    state: "candidates_ready",
    snapshotBindings: buildNoTrustedSupplyBindings("338_validator_no_trusted"),
  });
  const selecting = await createHubQueueCase(queueHarness, {
    name: "selecting",
    dueMinute: 55,
    originPracticeOds: "PRA_338_VALIDATOR_SELECTING",
    state: "coordinator_selecting",
  });
  const published = await publishQueue(queueHarness, [selecting, urgent, noTrusted], {
    selectedAnchorRef: urgent.current.hubCase.hubCoordinationCaseId,
  });
  requireCondition(
    published.rankEntries.map((entry) => entry.taskRef).join("|") ===
      published.workbenchProjection.visibleRowRefs.join("|"),
    "QUEUE_PROJECTION_ORDER_DRIFT",
  );
  requireCondition(
    published.workbenchProjection.visibleRowRefs[0] === urgent.current.hubCase.hubCoordinationCaseId,
    "QUEUE_URGENT_HEAD_DRIFT",
  );

  const driftSnapshot = resolveHubShellSnapshot(
    createInitialHubShellState("/hub/queue", {
      historySnapshot: { selectedSavedViewId: "supplier_drift" },
    }),
    1560,
  );
  requireCondition(
    driftSnapshot.selectedOptionCard.optionCardId === "opt-041-current" &&
      driftSnapshot.selectedOptionCard.sourceTrustState === "quarantined" &&
      driftSnapshot.selectedOptionCard.offerabilityState === "diagnostic_only",
    "SUPPLIER_DRIFT_SNAPSHOT_DRIFT",
  );

  const missionStackSnapshot = resolveHubShellSnapshot(
    createInitialHubShellState("/hub/queue", {
      historySnapshot: { selectedSavedViewId: "callback_recovery" },
    }),
    390,
  );
  requireCondition(
    missionStackSnapshot.layoutMode === "mission_stack" &&
      missionStackSnapshot.currentCase.caseId === "hub-case-052" &&
      missionStackSnapshot.selectedOptionCard.optionCardId === "opt-052-variance",
    "MISSION_STACK_SNAPSHOT_DRIFT",
  );
}

async function main(): Promise<void> {
  validateChecklist();
  validateRequiredFiles();
  validatePackageScript();
  validateDocsAndNotes();
  validateResultsBundle();
  validatePlaywrightProofFiles();
  await validateAuthoritativeFacts();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
