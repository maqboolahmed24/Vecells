import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  atMinute,
  buildManageActionInput,
  buildManageCapabilitiesInput,
  buildReminderEvidenceInput,
  buildReminderPlanInput,
  currentHubCoordinationCaseId,
  settlePracticeAcknowledgement,
  setupReminderManageHarness,
} from "../../tests/integration/324_hub_manage_reminders.helpers.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(
    ROOT,
    "packages",
    "domains",
    "hub_coordination",
    "src",
    "phase5-reminders-manage-visibility-engine.ts",
  ),
  path.join(
    ROOT,
    "packages",
    "domains",
    "hub_coordination",
    "tests",
    "phase5-reminders-manage-visibility-engine.test.ts",
  ),
  path.join(ROOT, "tests", "integration", "324_hub_manage_reminders.helpers.ts"),
  path.join(ROOT, "tests", "integration", "324_reminder_plan_and_visibility_projection.spec.ts"),
  path.join(ROOT, "tests", "integration", "324_manage_capability_and_settlement.spec.ts"),
  path.join(ROOT, "tests", "integration", "324_manage_replay_and_visibility_refresh.spec.ts"),
  path.join(ROOT, "tests", "property", "324_manage_and_reminder_properties.spec.ts"),
  path.join(
    ROOT,
    "docs",
    "architecture",
    "324_network_reminders_manage_and_practice_visibility_backend.md",
  ),
  path.join(ROOT, "docs", "api", "324_hub_manage_and_reminders_api.md"),
  path.join(
    ROOT,
    "docs",
    "security",
    "324_manage_capability_leases_and_minimum_necessary_visibility.md",
  ),
  path.join(ROOT, "docs", "operations", "324_reminder_delivery_and_reack_runbook.md"),
  path.join(ROOT, "data", "analysis", "324_external_reference_notes.md"),
  path.join(ROOT, "data", "analysis", "324_manage_and_visibility_state_matrix.csv"),
  path.join(ROOT, "data", "analysis", "324_reminder_suppression_cases.csv"),
  path.join(
    ROOT,
    "data",
    "contracts",
    "PHASE5_BATCH_324_331_INTERFACE_GAP_MANAGE_VISIBILITY_TIMELINE_PUBLICATION.json",
  ),
  path.join(
    ROOT,
    "services",
    "command-api",
    "migrations",
    "152_phase5_network_reminders_manage_visibility.sql",
  ),
];

const REQUIRED_SCRIPT =
  '"validate:324-hub-manage-visibility-and-reminders": "pnpm exec tsx ./tools/analysis/validate_324_hub_manage_visibility_and_reminders.ts"';

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath: string): string {
  requireCondition(
    fs.existsSync(filePath),
    `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`,
  );
  return fs.readFileSync(filePath, "utf8");
}

function validateFiles() {
  for (const filePath of REQUIRED_FILES) {
    requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
  }
}

function validateChecklist() {
  const checklist = read(path.join(ROOT, "prompt", "checklist.md"));
  requireCondition(
    checklist.includes(
      "- [-] par_324_phase5_track_backend_build_network_reminders_manage_flows_and_practice_visibility_projections",
    ) ||
      checklist.includes(
        "- [X] par_324_phase5_track_backend_build_network_reminders_manage_flows_and_practice_visibility_projections",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_324",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:324-hub-manage-visibility-and-reminders",
  );
}

function validateMigration() {
  const sql = read(
    path.join(
      ROOT,
      "services",
      "command-api",
      "migrations",
      "152_phase5_network_reminders_manage_visibility.sql",
    ),
  );
  for (const requiredTable of [
    "phase5_network_reminder_plans",
    "phase5_network_reminder_schedules",
    "phase5_network_reminder_delivery_evidence",
    "phase5_reminder_timeline_publications",
    "phase5_network_manage_capabilities",
    "phase5_hub_manage_settlements",
    "phase5_practice_visibility_projections",
    "phase5_practice_visibility_delta_records",
  ]) {
    requireCondition(sql.includes(requiredTable), `MIGRATION_TABLE_MISSING:${requiredTable}`);
  }
  for (const dependency of [
    "144_phase5_staff_identity_acting_context_visibility.sql",
    "145_phase5_enhanced_access_policy_engine.sql",
    "149_phase5_hub_commit_engine.sql",
    "150_phase5_practice_continuity_chain.sql",
    "151_phase5_hub_fallback_workflows.sql",
  ]) {
    requireCondition(sql.includes(dependency), `MIGRATION_DEPENDENCY_MISSING:${dependency}`);
  }
}

function validateArtifacts() {
  const notes = read(path.join(ROOT, "data", "analysis", "324_external_reference_notes.md"));
  const stateMatrix = read(
    path.join(ROOT, "data", "analysis", "324_manage_and_visibility_state_matrix.csv"),
  );
  const suppressionCases = read(
    path.join(ROOT, "data", "analysis", "324_reminder_suppression_cases.csv"),
  );
  const gap = read(
    path.join(
      ROOT,
      "data",
      "contracts",
      "PHASE5_BATCH_324_331_INTERFACE_GAP_MANAGE_VISIBILITY_TIMELINE_PUBLICATION.json",
    ),
  );
  const architecture = read(
    path.join(
      ROOT,
      "docs",
      "architecture",
      "324_network_reminders_manage_and_practice_visibility_backend.md",
    ),
  );

  for (const marker of [
    "Current Network Contract DES / Enhanced Access obligations",
    "NHS App web integration",
    "HL7 FHIR R4 Appointment",
    "HL7 FHIR R4 Slot",
    "Message Exchange for Social Care and Health (MESH)",
    "Digital clinical safety assurance",
    "DCB0129 / DCB0160 applicability guidance",
  ]) {
    requireCondition(notes.includes(marker), `EXTERNAL_REFERENCE_NOTE_MISSING:${marker}`);
  }

  for (const caseId of [
    "state_324_001",
    "state_324_002",
    "state_324_004",
    "state_324_005",
    "state_324_006",
  ]) {
    requireCondition(stateMatrix.includes(caseId), `STATE_MATRIX_ROW_MISSING:${caseId}`);
  }

  for (const caseId of [
    "suppression_324_001",
    "suppression_324_003",
    "suppression_324_005",
    "suppression_324_006",
  ]) {
    requireCondition(suppressionCases.includes(caseId), `SUPPRESSION_CASE_MISSING:${caseId}`);
  }

  for (const marker of [
    "NetworkReminderPlan",
    "NetworkManageCapabilities",
    "HubManageSettlement",
    "PracticeVisibilityProjection",
    "PracticeVisibilityDeltaRecord",
  ]) {
    requireCondition(architecture.includes(marker), `ARCHITECTURE_MARKER_MISSING:${marker}`);
  }

  for (const field of [
    "\"taskId\"",
    "\"missingSurface\"",
    "\"expectedOwnerTask\"",
    "\"temporaryFallback\"",
    "\"riskIfUnresolved\"",
    "\"followUpAction\"",
  ]) {
    requireCondition(gap.includes(field), `INTERFACE_GAP_FIELD_MISSING:${field}`);
  }
}

async function validateRuntimeProof() {
  const manageHarness = await setupReminderManageHarness("324_validator_manage");
  const blocked = await manageHarness.manageService.compileNetworkManageCapabilities(
    buildManageCapabilitiesInput(manageHarness),
  );
  requireCondition(
    blocked.capabilities.capabilityState === "blocked",
    "RUNTIME_MANAGE_PRE_ACK_SHOULD_BLOCK",
  );
  requireCondition(
    blocked.capabilities.blockedReasonRefs.includes("practice_ack_debt_open"),
    "RUNTIME_MANAGE_PRE_ACK_BLOCKER_MISSING",
  );

  const hubCoordinationCaseId = currentHubCoordinationCaseId(manageHarness);
  await settlePracticeAcknowledgement(manageHarness);
  await manageHarness.manageService.refreshPracticeVisibilityProjection({
    hubCoordinationCaseId,
    visibilityEnvelopeId: manageHarness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
    recordedAt: atMinute(20),
    sourceRefs: ["tools/analysis/validate_324_hub_manage_visibility_and_reminders.ts"],
  });
  const live = await manageHarness.manageService.compileNetworkManageCapabilities(
    buildManageCapabilitiesInput(manageHarness, {
      recordedAt: atMinute(21),
    }),
  );
  requireCondition(
    live.capabilities.capabilityState === "live",
    "RUNTIME_MANAGE_POST_ACK_SHOULD_BE_LIVE",
  );

  const settled = await manageHarness.manageService.executeHubManageAction(
    buildManageActionInput(
      manageHarness,
      live.capabilities.networkManageCapabilitiesId,
      "cancel",
      {
        recordedAt: atMinute(22),
        sourceRefs: ["tools/analysis/validate_324_hub_manage_visibility_and_reminders.ts"],
      },
    ),
  );
  requireCondition(settled.settlement.result === "applied", "RUNTIME_MANAGE_SETTLEMENT_INVALID");
  requireCondition(
    settled.visibilityProjection?.practiceAcknowledgementState === "ack_pending",
    "RUNTIME_MANAGE_VISIBILITY_REACK_MISSING",
  );

  const reminderHarness = await setupReminderManageHarness("324_validator_reminder");
  const reminderCaseId = currentHubCoordinationCaseId(reminderHarness);
  await settlePracticeAcknowledgement(reminderHarness);
  await reminderHarness.manageService.refreshPracticeVisibilityProjection({
    hubCoordinationCaseId: reminderCaseId,
    visibilityEnvelopeId:
      reminderHarness.visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
    recordedAt: atMinute(20),
    sourceRefs: ["tools/analysis/validate_324_hub_manage_visibility_and_reminders.ts"],
  });
  const planned = await reminderHarness.manageService.createOrRefreshReminderPlan(
    buildReminderPlanInput(reminderHarness, {
      recordedAt: atMinute(21),
      scheduledFor: atMinute(121),
      sourceRefs: ["tools/analysis/validate_324_hub_manage_visibility_and_reminders.ts"],
    }),
  );
  const replayed = await reminderHarness.manageService.createOrRefreshReminderPlan(
    buildReminderPlanInput(reminderHarness, {
      recordedAt: atMinute(21),
      scheduledFor: atMinute(121),
      sourceRefs: ["tools/analysis/validate_324_hub_manage_visibility_and_reminders.ts"],
    }),
  );
  requireCondition(replayed.replayed, "RUNTIME_REMINDER_REPLAY_MISSING");

  const failed = await reminderHarness.manageService.recordReminderDeliveryEvidence(
    buildReminderEvidenceInput(
      reminderHarness,
      planned.reminderPlan.networkReminderPlanId,
      planned.reminderSchedule!.networkReminderScheduleId,
      {
        observedAt: atMinute(122),
        evidenceState: "failed",
        transportAckState: "rejected",
        deliveryRiskState: "likely_failed",
        sourceRefs: ["tools/analysis/validate_324_hub_manage_visibility_and_reminders.ts"],
      },
    ),
  );
  requireCondition(
    failed.timelinePublication.publicationKind === "reminder_failed",
    "RUNTIME_REMINDER_FAILURE_TIMELINE_INVALID",
  );
  requireCondition(
    failed.deltaRecord?.deltaReason === "reminder_failure",
    "RUNTIME_REMINDER_FAILURE_DELTA_INVALID",
  );
  requireCondition(
    failed.visibilityProjection?.actionRequiredState === "contact_route_repair",
    "RUNTIME_REMINDER_FAILURE_RECOVERY_INVALID",
  );

  const currentState = await reminderHarness.manageService.queryCurrentReminderManageVisibilityState(
    reminderCaseId,
  );
  requireCondition(
    currentState.latestTimelinePublication?.publicationKind === "reminder_failed",
    "RUNTIME_CURRENT_TIMELINE_STATE_INVALID",
  );
}

async function main() {
  validateFiles();
  validateChecklist();
  validatePackageScript();
  validateMigration();
  validateArtifacts();
  await validateRuntimeProof();
  console.log("validate_324_hub_manage_visibility_and_reminders: ok");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
