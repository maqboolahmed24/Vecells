import fs from "node:fs";
import path from "node:path";

import {
  buildBookingHandoffScenarioSeed,
  BOOKING_TRIAGE_NOTIFICATION_CONTRACT_NAME,
  BOOKING_TRIAGE_NOTIFICATION_TASK_ID,
  renderBookingNotificationStateMatrixCsv,
} from "../../scripts/integration/306_seed_booking_handoff_scenarios.ts";

const ROOT = path.resolve(process.cwd());
const CHECKLIST = path.join(ROOT, "prompt", "checklist.md");

const REQUIRED_FILES = [
  "services/command-api/src/phase4-booking-triage-notification-integration.ts",
  "services/command-api/migrations/142_phase4_booking_triage_notification_integration.sql",
  "scripts/integration/306_seed_booking_handoff_scenarios.ts",
  "tests/integration/306_booking_handoff_idempotency.spec.ts",
  "tests/integration/306_booking_reopen_and_supersession.spec.ts",
  "tests/playwright/306_triage_to_booking_handoff.spec.ts",
  "tests/playwright/306_booking_notification_entry.spec.ts",
  "tests/playwright/306_booking_status_projection.spec.ts",
  "docs/integration/306_booking_triage_notification_integration_spec.md",
  "docs/integration/306_booking_triage_notification_event_map.mmd",
  "docs/frontend/306_booking_handoff_and_notification_surfaces_atlas.html",
  "data/contracts/306_booking_triage_notification_contract.json",
  "data/analysis/306_algorithm_alignment_notes.md",
  "data/analysis/306_booking_notification_state_matrix.csv",
  "data/analysis/306_handoff_gap_register.json",
  "data/analysis/PHASE4_INTERFACE_GAP_BOOKING_TRIAGE_NOTIFICATION_INTEGRATION.json",
  "output/playwright/306-triage-to-booking-handoff-trace.zip",
  "output/playwright/306-booking-notification-entry-trace.zip",
  "output/playwright/306-booking-status-projection-trace.zip",
] as const;

function fail(message: string): never {
  throw new Error(`[306-booking-triage-notification] ${message}`);
}

function read(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    fail(`missing required file ${path.relative(ROOT, filePath)}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath: string): any {
  return JSON.parse(read(filePath));
}

function checklistState(taskPrefix: string): string {
  const pattern = new RegExp(
    `^- \\[([ Xx-])\\] ${taskPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    "m",
  );
  const match = read(CHECKLIST).match(pattern);
  if (!match) {
    fail(`checklist row missing for ${taskPrefix}`);
  }
  return match[1]!.toUpperCase();
}

function validateChecklist(): void {
  if (
    checklistState(
      "seq_304_phase4_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_booking_provider_sandboxes_and_callback_endpoints",
    ) !== "X"
  ) {
    fail("seq_304 must be complete before seq_306");
  }
  if (
    checklistState(
      "seq_305_phase4_use_Playwright_or_other_appropriate_tooling_browser_automation_to_capture_booking_provider_capability_evidence_and_test_credentials",
    ) !== "X"
  ) {
    fail("seq_305 must be complete before seq_306");
  }
  const state = checklistState(
    "seq_306_phase4_merge_Playwright_or_other_appropriate_tooling_integrate_local_booking_with_triage_portal_and_notification_workflows",
  );
  if (!["-", "X"].includes(state)) {
    fail("seq_306 must be claimed or complete");
  }
}

function validateRequiredFiles(): void {
  for (const relativePath of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(ROOT, relativePath))) {
      fail(`missing required artifact ${relativePath}`);
    }
  }
}

function validateGeneratedArtifacts(): void {
  const seed = buildBookingHandoffScenarioSeed();
  const contract = readJson(path.join(ROOT, "data/contracts/306_booking_triage_notification_contract.json"));
  const matrix = read(path.join(ROOT, "data/analysis/306_booking_notification_state_matrix.csv"));

  if (contract.taskId !== BOOKING_TRIAGE_NOTIFICATION_TASK_ID) {
    fail("contract taskId drifted");
  }
  if (contract.contractName !== BOOKING_TRIAGE_NOTIFICATION_CONTRACT_NAME) {
    fail("contract name drifted");
  }
  if (contract.schemaVersion !== seed.schemaVersion) {
    fail("contract schema version drifted");
  }
  if (contract.serviceName !== seed.serviceName) {
    fail("contract service name drifted");
  }
  if (JSON.stringify(contract.routeIds) !== JSON.stringify(seed.routeIds)) {
    fail("contract route ids drifted from the service definition");
  }
  if (JSON.stringify(contract.querySurfaces) !== JSON.stringify(seed.querySurfaces)) {
    fail("contract query surfaces drifted from the service definition");
  }
  if (contract.notificationDedupePattern !== seed.notificationDedupePattern) {
    fail("contract notification dedupe pattern drifted");
  }
  if (
    JSON.stringify(contract.seededScenarioRefs) !==
    JSON.stringify(seed.scenarios.map((scenario) => scenario.scenarioId))
  ) {
    fail("contract scenario refs drifted from the scenario seed");
  }
  if (matrix.trim() !== renderBookingNotificationStateMatrixCsv().trim()) {
    fail("state matrix drifted from the scenario seed");
  }
}

function validateSourceMarkers(): void {
  const patientModel = read(
    path.join(ROOT, "apps/patient-web/src/patient-booking-workspace.model.ts"),
  );
  const patientShell = read(
    path.join(ROOT, "apps/patient-web/src/patient-booking-workspace.tsx"),
  );
  const staffModel = read(
    path.join(ROOT, "apps/clinical-workspace/src/workspace-booking-handoff.model.ts"),
  );
  const service = read(
    path.join(ROOT, "services/command-api/src/phase4-booking-triage-notification-integration.ts"),
  );

  for (const token of [
    "booking_case_306_handoff_live",
    "booking_case_306_confirmation_pending",
    "booking_case_306_confirmed",
    "booking_case_306_reopened",
    "resolveNotificationEntry",
  ]) {
    if (!patientModel.includes(token)) {
      fail(`patient workspace model missing token ${token}`);
    }
  }
  for (const token of [
    "booking-notification-entry-banner",
    "data-origin-key",
    "data-notification-state",
    "NotificationEntryBanner",
  ]) {
    if (!patientShell.includes(token)) {
      fail(`patient workspace shell missing token ${token}`);
    }
  }
  for (const token of [
    "booking_case_306_handoff_live",
    "booking_case_306_confirmation_pending",
    "booking_case_306_reopened",
    "booking_case_306_confirmed",
    "overrideStaffBookingCaseId",
  ]) {
    if (!staffModel.includes(token)) {
      fail(`staff booking handoff model missing token ${token}`);
    }
  }
  for (const token of [
    "booking_case_triage_notification_current",
    "workspace_task_accept_booking_handoff",
    "booking_case_refresh_triage_notification",
    "booking_case_dispatch_latest_notification",
    "booking_triage_notification::",
    "statusDigest",
  ]) {
    if (!service.includes(token)) {
      fail(`service integration missing token ${token}`);
    }
  }
}

function validateDocsAndTests(): void {
  const spec = read(
    path.join(ROOT, "docs/integration/306_booking_triage_notification_integration_spec.md"),
  );
  const map = read(
    path.join(ROOT, "docs/integration/306_booking_triage_notification_event_map.mmd"),
  );
  const atlas = read(
    path.join(ROOT, "docs/frontend/306_booking_handoff_and_notification_surfaces_atlas.html"),
  );
  const notes = read(path.join(ROOT, "data/analysis/306_algorithm_alignment_notes.md"));
  const gapRegister = readJson(path.join(ROOT, "data/analysis/306_handoff_gap_register.json"));
  const idempotency = read(path.join(ROOT, "tests/integration/306_booking_handoff_idempotency.spec.ts"));
  const reopen = read(path.join(ROOT, "tests/integration/306_booking_reopen_and_supersession.spec.ts"));
  const handoffSpec = read(path.join(ROOT, "tests/playwright/306_triage_to_booking_handoff.spec.ts"));
  const notificationSpec = read(path.join(ROOT, "tests/playwright/306_booking_notification_entry.spec.ts"));
  const statusSpec = read(path.join(ROOT, "tests/playwright/306_booking_status_projection.spec.ts"));

  for (const token of [
    "LifecycleCoordinator",
    "LineageCaseLink",
    "booking_triage_notification::{requestId}::{statusDigest}",
    "/bookings/booking_case_306_confirmation_pending/confirm",
  ]) {
    if (!spec.includes(token)) {
      fail(`integration spec missing token ${token}`);
    }
  }
  for (const token of [
    "accept-booking-handoff",
    "confirmation pending",
    "governed reopen to triage",
  ]) {
    if (!map.toLowerCase().includes(token.toLowerCase())) {
      fail(`event map missing token ${token}`);
    }
  }
  for (const token of [
    "NotificationEntryBanner",
    "same shell",
    "Pending Truth",
    "Recovery stays in place",
  ]) {
    if (!atlas.includes(token)) {
      fail(`frontend atlas missing token ${token}`);
    }
  }
  for (const token of [
    "blueprint/phase-3-the-human-checkpoint.md",
    "booking_confirmation_pending",
    "booking_reopened",
  ]) {
    if (!notes.includes(token)) {
      fail(`algorithm notes missing token ${token}`);
    }
  }
  if (!Array.isArray(gapRegister.gaps) || gapRegister.gaps.length < 2) {
    fail("handoff gap register must contain at least two tracked gaps");
  }
  for (const token of [
    "semantic_replay",
    "requestWorkflowState",
    "booking_case_306_handoff_live",
  ]) {
    if (!idempotency.includes(token)) {
      fail(`idempotency integration spec missing token ${token}`);
    }
  }
  for (const token of ["booking_case_306_reopened", "reopened_to_triage", "triage_active"]) {
    if (!reopen.includes(token)) {
      fail(`reopen integration spec missing token ${token}`);
    }
  }
  for (const token of [
    "booking_case_306_handoff_live",
    "booking_case_306_confirmation_pending",
    "booking_case_306_reopened",
  ]) {
    if (!handoffSpec.includes(token)) {
      fail(`triage-to-booking playwright spec missing token ${token}`);
    }
  }
  for (const token of [
    "booking-notification-entry-banner",
    "confirmation_pending",
    "BookingRecoveryShell",
  ]) {
    if (!notificationSpec.includes(token)) {
      fail(`notification-entry playwright spec missing token ${token}`);
    }
  }
  for (const token of [
    "booking_case_306_confirmed",
    "patient-appointment-manage-view",
    "single-instance",
  ]) {
    if (!statusSpec.includes(token)) {
      fail(`status-projection playwright spec missing token ${token}`);
    }
  }
}

function validateOutputArtifacts(): void {
  for (const relativePath of [
    "output/playwright/306-triage-to-booking-handoff-trace.zip",
    "output/playwright/306-booking-notification-entry-trace.zip",
    "output/playwright/306-booking-status-projection-trace.zip",
  ]) {
    const absolutePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).size === 0) {
      fail(`missing or empty Playwright artifact ${relativePath}`);
    }
  }
}

function main(): void {
  validateChecklist();
  validateRequiredFiles();
  validateGeneratedArtifacts();
  validateSourceMarkers();
  validateDocsAndTests();
  validateOutputArtifacts();
  console.log(
    JSON.stringify(
      {
        taskId: BOOKING_TRIAGE_NOTIFICATION_TASK_ID,
        validated: true,
        scenarioCount: buildBookingHandoffScenarioSeed().scenarios.length,
      },
      null,
      2,
    ),
  );
}

main();
