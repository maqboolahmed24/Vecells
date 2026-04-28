import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildCollisionBindings,
  buildSnapshotCommand,
  setupNetworkCapacityHarness,
} from "../../tests/integration/318_network_capacity.helpers.ts";

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
    "phase5-network-capacity-pipeline.ts",
  ),
  path.join(
    ROOT,
    "packages",
    "domains",
    "hub_coordination",
    "tests",
    "phase5-network-capacity-pipeline.test.ts",
  ),
  path.join(ROOT, "tests", "integration", "318_network_capacity.helpers.ts"),
  path.join(ROOT, "tests", "integration", "318_network_capacity_snapshot_and_ledgers.spec.ts"),
  path.join(ROOT, "tests", "integration", "318_capacity_replay_and_migration.spec.ts"),
  path.join(ROOT, "tests", "property", "318_capacity_ordering_properties.spec.ts"),
  path.join(ROOT, "docs", "architecture", "318_capacity_ingestion_and_candidate_snapshot_pipeline.md"),
  path.join(ROOT, "docs", "api", "318_network_capacity_snapshot_api.md"),
  path.join(ROOT, "docs", "security", "318_source_trust_quarantine_and_supply_truth_rules.md"),
  path.join(ROOT, "data", "analysis", "318_external_reference_notes.md"),
  path.join(ROOT, "data", "analysis", "318_candidate_fixture_catalog.csv"),
  path.join(ROOT, "data", "analysis", "318_dominance_frontier_examples.csv"),
  path.join(ROOT, "data", "analysis", "318_supply_exception_examples.json"),
  path.join(
    ROOT,
    "services",
    "command-api",
    "migrations",
    "146_phase5_network_capacity_snapshot_pipeline.sql",
  ),
];

const REQUIRED_SCRIPT =
  '"validate:318-capacity-snapshot-and-rank-proof": "pnpm exec tsx ./tools/analysis/validate_318_capacity_snapshot_and_rank_proof.ts"';

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
      "- [-] par_318_phase5_track_backend_build_network_capacity_ingestion_and_freshness_assessment_pipeline",
    ) ||
      checklist.includes(
        "- [X] par_318_phase5_track_backend_build_network_capacity_ingestion_and_freshness_assessment_pipeline",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_318",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:318-capacity-snapshot-and-rank-proof",
  );
}

function validateMigration() {
  const sql = read(
    path.join(
      ROOT,
      "services",
      "command-api",
      "migrations",
      "146_phase5_network_capacity_snapshot_pipeline.sql",
    ),
  );

  for (const requiredTable of [
    "phase5_network_capacity_adapter_runs",
    "phase5_capacity_source_trust_admissions",
    "phase5_network_slot_candidates",
    "phase5_network_candidate_snapshots",
    "phase5_capacity_rank_proofs",
    "phase5_capacity_rank_explanations",
    "phase5_cross_site_decision_plans",
    "phase5_enhanced_access_minutes_ledgers",
    "phase5_cancellation_make_up_ledgers",
    "phase5_capacity_supply_exceptions",
    "phase5_network_capacity_replay_fixtures",
  ]) {
    requireCondition(sql.includes(requiredTable), `MIGRATION_TABLE_MISSING:${requiredTable}`);
  }

  requireCondition(
    sql.includes("143_phase5_hub_case_kernel.sql"),
    "MIGRATION_DEPENDENCY_NOTE_MISSING:143",
  );
  requireCondition(
    sql.includes("145_phase5_enhanced_access_policy_engine.sql"),
    "MIGRATION_DEPENDENCY_NOTE_MISSING:145",
  );
}

function validateArtifacts() {
  const notes = read(path.join(ROOT, "data", "analysis", "318_external_reference_notes.md"));
  const fixtures = read(path.join(ROOT, "data", "analysis", "318_candidate_fixture_catalog.csv"));
  const dominance = read(path.join(ROOT, "data", "analysis", "318_dominance_frontier_examples.csv"));
  const exceptions = JSON.parse(
    read(path.join(ROOT, "data", "analysis", "318_supply_exception_examples.json")),
  ) as {
    taskId?: string;
    examples?: Array<{ exceptionCode?: string }>;
  };

  for (const marker of [
    "HL7 FHIR R4 Slot",
    "HL7 FHIR R4 Appointment",
    "Primary Care Networks Network Contract DES from April 2026",
    "Network contract DES guidance for 2025/26 in England, Part A, clinical and support services, section 8",
    "Digital clinical safety assurance",
    "DCB0129 / DCB0160 step-by-step guidance",
  ]) {
    requireCondition(notes.includes(marker), `EXTERNAL_REFERENCE_NOTE_MISSING:${marker}`);
  }

  for (const fixtureId of [
    "trusted_required_001",
    "degraded_required_002",
    "trusted_variance_003",
    "quarantined_required_004",
    "trusted_outside_window_005",
  ]) {
    requireCondition(fixtures.includes(fixtureId), `FIXTURE_CATALOG_ENTRY_MISSING:${fixtureId}`);
  }

  requireCondition(
    dominance.includes("dominance_001") && dominance.includes("dominance_002"),
    "DOMINANCE_FRONTIER_EXAMPLES_MISSING",
  );
  requireCondition(exceptions.taskId === "par_318", "SUPPLY_EXCEPTION_EXAMPLES_TASK_ID_INVALID");
  for (const code of [
    "CAPACITY_DEGRADED_CALLBACK_ONLY",
    "CAPACITY_QUARANTINED",
    "CAPACITY_HIDDEN",
    "CAPACITY_POLICY_INVALID",
    "CAPACITY_DEDUPE_COLLISION",
  ]) {
    requireCondition(
      exceptions.examples?.some((entry) => entry.exceptionCode === code) === true,
      `SUPPLY_EXCEPTION_EXAMPLE_MISSING:${code}`,
    );
  }
}

async function validateRuntimeProof() {
  const harness = await setupNetworkCapacityHarness("318_validator");
  const result = await harness.service.buildCandidateSnapshotForCase({
    ...buildSnapshotCommand("318_validator"),
    hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
  });

  requireCondition(result.snapshot !== null, "RUNTIME_SNAPSHOT_MISSING");
  requireCondition(result.rankProof !== null, "RUNTIME_RANK_PROOF_MISSING");
  requireCondition(result.decisionPlan !== null, "RUNTIME_DECISION_PLAN_MISSING");
  requireCondition(result.candidates.length === 5, "RUNTIME_CANDIDATE_COUNT_INVALID");
  requireCondition(
    result.decisionPlan.patientOfferableFrontierRefs.length === 2,
    "RUNTIME_PATIENT_FRONTIER_INVALID",
  );
  requireCondition(
    result.decisionPlan.directCommitFrontierRefs.length === 1,
    "RUNTIME_DIRECT_COMMIT_FRONTIER_INVALID",
  );
  requireCondition(
    result.decisionPlan.callbackReasoningRefs.length === 2,
    "RUNTIME_CALLBACK_FRONTIER_INVALID",
  );
  requireCondition(
    result.decisionPlan.diagnosticOnlyRefs.length === 1,
    "RUNTIME_DIAGNOSTIC_FRONTIER_INVALID",
  );
  requireCondition(
    result.minutesLedger.ledgerState === "make_up_required",
    "RUNTIME_MINUTES_LEDGER_STATE_INVALID",
  );
  requireCondition(
    result.cancellationMakeUpLedger?.makeUpState === "replacement_due",
    "RUNTIME_CANCELLATION_LEDGER_STATE_INVALID",
  );

  const replay = await harness.service.replayCandidateSnapshot({
    snapshotId: result.snapshotId,
  });
  requireCondition(replay.matchesStoredSnapshot, "RUNTIME_REPLAY_MISMATCH");
  requireCondition(replay.mismatchFields.length === 0, "RUNTIME_REPLAY_MISMATCH_FIELDS_PRESENT");

  const collision = await harness.service.buildCandidateSnapshotForCase({
    ...buildSnapshotCommand("318_validator_collision"),
    hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
    adapterBindings: buildCollisionBindings("318_validator_collision"),
    deliveredMinutes: 30,
    cancelledMinutes: 0,
    replacementMinutes: 0,
  });
  requireCondition(
    collision.candidates.length === 1 &&
      collision.supplyExceptions.some((entry) => entry.exceptionCode === "CAPACITY_DEDUPE_COLLISION"),
    "RUNTIME_COLLISION_BEHAVIOUR_INVALID",
  );
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
  console.log("318 capacity snapshot and rank proof validation passed.");
}

await main();
