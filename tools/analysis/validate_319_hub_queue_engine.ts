import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildCaseBinding,
  buildNoTrustedSupplyBindings,
  createHubQueueCase,
  publishQueue,
  setupHubQueueHarness,
  timerByType,
} from "../../tests/integration/319_hub_queue.helpers.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(ROOT, "packages", "domains", "hub_coordination", "src", "phase5-hub-queue-engine.ts"),
  path.join(ROOT, "packages", "domains", "hub_coordination", "tests", "phase5-hub-queue-engine.test.ts"),
  path.join(ROOT, "tests", "integration", "319_hub_queue.helpers.ts"),
  path.join(ROOT, "tests", "integration", "319_hub_queue_projection_and_timer_truth.spec.ts"),
  path.join(ROOT, "tests", "integration", "319_hub_queue_change_batch_and_replay.spec.ts"),
  path.join(ROOT, "tests", "property", "319_hub_queue_ordering_properties.spec.ts"),
  path.join(ROOT, "docs", "architecture", "319_hub_queue_ranking_and_workbench_projection_engine.md"),
  path.join(ROOT, "docs", "api", "319_hub_queue_and_console_projection_api.md"),
  path.join(ROOT, "docs", "ops", "319_hub_timer_and_overload_rules.md"),
  path.join(ROOT, "data", "analysis", "319_external_reference_notes.md"),
  path.join(ROOT, "data", "analysis", "319_queue_simulation_cases.csv"),
  path.join(ROOT, "data", "analysis", "319_projection_consistency_examples.json"),
  path.join(ROOT, "data", "contracts", "PHASE5_BATCH_316_323_INTERFACE_GAP_QUEUE_PATIENT_CHOICE_EXPIRY.json"),
  path.join(ROOT, "data", "contracts", "PHASE5_BATCH_316_323_INTERFACE_GAP_QUEUE_CAPACITY_RESERVATION_BINDING.json"),
  path.join(ROOT, "services", "command-api", "migrations", "147_phase5_hub_queue_engine.sql"),
];

const REQUIRED_SCRIPT =
  '"validate:319-hub-queue-engine": "pnpm exec tsx ./tools/analysis/validate_319_hub_queue_engine.ts"';

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath: string): string {
  requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
  return fs.readFileSync(filePath, "utf8");
}

function validateChecklist() {
  const checklist = read(path.join(ROOT, "prompt", "checklist.md"));
  requireCondition(
    checklist.includes(
      "- [-] par_319_phase5_track_backend_build_coordination_queue_candidate_ranking_and_sla_breach_risk_engine",
    ) ||
      checklist.includes(
        "- [X] par_319_phase5_track_backend_build_coordination_queue_candidate_ranking_and_sla_breach_risk_engine",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_319",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:319-hub-queue-engine",
  );
}

function validateMigration() {
  const sql = read(
    path.join(ROOT, "services", "command-api", "migrations", "147_phase5_hub_queue_engine.sql"),
  );
  for (const requiredTable of [
    "phase5_hub_queue_rank_plans",
    "phase5_hub_queue_fairness_cycles",
    "phase5_hub_queue_rank_snapshots",
    "phase5_hub_queue_risk_explanations",
    "phase5_hub_queue_rank_entries",
    "phase5_hub_queue_timers",
    "phase5_hub_queue_change_batches",
    "phase5_hub_queue_workbench_projections",
    "phase5_hub_case_console_projections",
    "phase5_hub_option_card_projections",
    "phase5_hub_posture_projections",
    "phase5_hub_escalation_banner_projections",
    "phase5_hub_console_consistency_projections",
    "phase5_hub_queue_replay_fixtures",
  ]) {
    requireCondition(sql.includes(requiredTable), `MIGRATION_TABLE_MISSING:${requiredTable}`);
  }
  requireCondition(sql.includes("143_phase5_hub_case_kernel.sql"), "MIGRATION_DEPENDENCY_MISSING:143");
  requireCondition(
    sql.includes("145_phase5_enhanced_access_policy_engine.sql"),
    "MIGRATION_DEPENDENCY_MISSING:145",
  );
  requireCondition(
    sql.includes("146_phase5_network_capacity_snapshot_pipeline.sql"),
    "MIGRATION_DEPENDENCY_MISSING:146",
  );
}

function validateArtifacts() {
  const notes = read(path.join(ROOT, "data", "analysis", "319_external_reference_notes.md"));
  const casesCsv = read(path.join(ROOT, "data", "analysis", "319_queue_simulation_cases.csv"));
  const consistency = JSON.parse(
    read(path.join(ROOT, "data", "analysis", "319_projection_consistency_examples.json")),
  ) as { taskId?: string; examples?: Array<{ exampleId?: string }> };

  for (const marker of [
    "Digital clinical safety assurance",
    "Step by step guidance for DCB 0129 and DCB 0160",
    "Digital clinical safety strategy",
  ]) {
    requireCondition(notes.includes(marker), `EXTERNAL_REFERENCE_NOTE_MISSING:${marker}`);
  }

  for (const scenarioId of [
    "simulation_001",
    "simulation_002",
    "simulation_003",
    "simulation_004",
    "simulation_005",
    "simulation_006",
  ]) {
    requireCondition(casesCsv.includes(scenarioId), `SIMULATION_CASE_MISSING:${scenarioId}`);
  }

  requireCondition(consistency.taskId === "par_319", "PROJECTION_CONSISTENCY_TASK_ID_INVALID");
  requireCondition(
    (consistency.examples?.length ?? 0) >= 2,
    "PROJECTION_CONSISTENCY_EXAMPLES_MISSING",
  );
}

async function validateRuntimeProof() {
  const harness = await setupHubQueueHarness("319_validator");
  const critical = await createHubQueueCase(harness, {
    name: "critical",
    priorityBand: "urgent",
    dueMinute: 18,
    latestSafeOfferMinute: 10,
    originPracticeOds: "PRA_VALIDATOR_CRITICAL",
    state: "coordinator_selecting",
    expectedCoordinationMinutes: 18,
  });
  const noTrusted = await createHubQueueCase(harness, {
    name: "no_trusted",
    dueMinute: 70,
    originPracticeOds: "PRA_VALIDATOR_NO_TRUST",
    state: "candidates_ready",
    snapshotBindings: buildNoTrustedSupplyBindings("319_validator_no_trust"),
  });
  const practiceAck = await createHubQueueCase(harness, {
    name: "practice_ack",
    dueMinute: 80,
    originPracticeOds: "PRA_VALIDATOR_ACK",
    state: "booked_pending_practice_ack",
    practiceAckDueMinute: 3,
  });
  const callbackBlocked = await createHubQueueCase(harness, {
    name: "callback_blocked",
    dueMinute: 75,
    originPracticeOds: "PRA_VALIDATOR_CALLBACK",
    state: "callback_transfer_pending",
  });

  const result = await publishQueue(harness, [critical, noTrusted, practiceAck, callbackBlocked], {
    selectedAnchorRef: callbackBlocked.current.hubCase.hubCoordinationCaseId,
    caseBindings: [
      buildCaseBinding(critical),
      buildCaseBinding(noTrusted),
      buildCaseBinding(practiceAck),
      buildCaseBinding(callbackBlocked, { callbackTransferBlocked: true }),
    ],
  });

  requireCondition(
    result.rankEntries[0]?.taskRef === critical.current.hubCase.hubCoordinationCaseId,
    "RUNTIME_CRITICAL_ORDER_INVALID",
  );
  requireCondition(
    result.escalationBanners.some((banner) => banner.bannerType === "no_trusted_supply"),
    "RUNTIME_NO_TRUST_BANNER_MISSING",
  );
  requireCondition(
    result.escalationBanners.some((banner) => banner.bannerType === "practice_ack_overdue"),
    "RUNTIME_PRACTICE_ACK_BANNER_MISSING",
  );
  requireCondition(
    result.escalationBanners.some((banner) => banner.bannerType === "callback_transfer_blocked"),
    "RUNTIME_CALLBACK_BANNER_MISSING",
  );
  requireCondition(
    timerByType(
      result,
      practiceAck.current.hubCase.hubCoordinationCaseId,
      "practice_notification_overdue",
    )?.timerState === "overdue",
    "RUNTIME_ACK_TIMER_STATE_INVALID",
  );
  requireCondition(
    result.consistencyProjection.freezeControls === true ||
      result.consistencyProjection.freezeControls === false,
    "RUNTIME_CONSISTENCY_PROJECTION_MISSING",
  );

  const replay = await harness.queueService.replayHubQueueOrder({
    rankSnapshotId: result.rankSnapshot.rankSnapshotId,
  });
  requireCondition(replay.matchesStoredSnapshot, "RUNTIME_REPLAY_MISMATCH");
  requireCondition(replay.mismatchFields.length === 0, "RUNTIME_REPLAY_MISMATCH_FIELDS_PRESENT");
}

async function main() {
  for (const filePath of REQUIRED_FILES) {
    read(filePath);
  }
  validateChecklist();
  validatePackageScript();
  validateMigration();
  validateArtifacts();
  await validateRuntimeProof();
  console.log("319 hub queue engine validation passed.");
}

await main();
