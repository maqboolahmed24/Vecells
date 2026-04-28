import fs from "node:fs";
import path from "node:path";
import { write474CutoverArtifacts } from "./plan_474_cutover";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFile(relativePath: string): void {
  assertCondition(fs.existsSync(path.join(root, relativePath)), `Missing ${relativePath}`);
}

function assertIncludes(relativePath: string, fragment: string): void {
  assertCondition(read(relativePath).includes(fragment), `${relativePath} is missing ${fragment}`);
}

write474CutoverArtifacts();

const requiredFiles = [
  "data/migration/474_schema_migration_plan.json",
  "data/migration/474_projection_backfill_plan.json",
  "data/migration/474_reference_dataset_manifest.json",
  "data/migration/474_read_path_compatibility_window.json",
  "data/migration/474_cutover_runbook.json",
  "data/migration/474_stop_resume_and_rollback_matrix.json",
  "data/migration/474_projection_readiness_verdicts.json",
  "data/contracts/474_migration_cutover.schema.json",
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_474_RELEASE_CANDIDATE_AUTHORITY.json",
  "tools/migration/plan_474_cutover.ts",
  "tools/migration/validate_474_backfill_readiness.ts",
  "docs/runbooks/474_data_migration_backfill_cutover_runbook.md",
  "docs/architecture/474_migration_backfill_topology.mmd",
  "data/analysis/474_algorithm_alignment_notes.md",
  "data/analysis/474_external_reference_notes.json",
  "apps/ops-console/src/migration-cutover-474.model.ts",
  "tests/migration/474_schema_migration_plan.test.ts",
  "tests/migration/474_projection_backfill_plan.test.ts",
  "tests/migration/474_read_path_compatibility.test.ts",
  "tests/migration/474_reference_dataset_masking.test.ts",
  "tests/playwright/474_cutover_readiness_board.spec.ts",
];

for (const requiredFile of requiredFiles) {
  assertFile(requiredFile);
}

const schemaPlan = readJson<any>("data/migration/474_schema_migration_plan.json");
const backfillPlan = readJson<any>("data/migration/474_projection_backfill_plan.json");
const referenceManifest = readJson<any>("data/migration/474_reference_dataset_manifest.json");
const readPathWindow = readJson<any>("data/migration/474_read_path_compatibility_window.json");
const cutoverRunbook = readJson<any>("data/migration/474_cutover_runbook.json");
const rollbackMatrix = readJson<any>("data/migration/474_stop_resume_and_rollback_matrix.json");
const readiness = readJson<any>("data/migration/474_projection_readiness_verdicts.json");
const gap = readJson<any>(
  "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_474_RELEASE_CANDIDATE_AUTHORITY.json",
);

assertCondition(schemaPlan.schemaVersion === "474.programme.migration-cutover.v1", "Bad schema");
assertCondition(schemaPlan.planSetHash.match(/^[a-f0-9]{64}$/), "Plan set hash missing");
assertCondition(
  schemaPlan.migrationPlans.some(
    (plan: any) =>
      plan.changeType === "contractive" &&
      plan.state === "blocked" &&
      plan.contractiveRemovalPermitted === false,
  ),
  "Contractive patient-status migration must be blocked",
);
assertCondition(
  schemaPlan.migrationPlans.some(
    (plan: any) =>
      plan.changeType === "rollforward_only" &&
      typeof plan.manualFallbackBindingRef === "string" &&
      plan.manualFallbackBindingRef.length > 0,
  ),
  "Rollforward-only migration must bind manual fallback",
);
assertCondition(
  backfillPlan.cutoverReadinessState === "ready_with_constraints",
  "Bad cutover state",
);
assertCondition(
  backfillPlan.resumeCheckpoints.every(
    (checkpoint: any) => checkpoint.duplicateWormRowsAfterResume === 0,
  ),
  "Backfill resume must not duplicate WORM rows",
);
assertCondition(
  backfillPlan.poisonRecords.some(
    (record: any) =>
      record.poisonState === "quarantined" &&
      record.tenantWideBlock === false &&
      record.safeToContinue === true,
  ),
  "Poison record quarantine edge case missing",
);
assertCondition(
  referenceManifest.privacyAttestation.noPhi === true,
  "Reference data PHI guard bad",
);
assertCondition(
  referenceManifest.privacyAttestation.noPii === true,
  "Reference data PII guard bad",
);
assertCondition(
  referenceManifest.recordClasses.every((record: any) => record.rawIdentifierFields.length === 0),
  "Reference data must not expose raw identifiers",
);
assertCondition(
  readPathWindow.featureFlagGuards.some(
    (guard: any) =>
      guard.guardId === "ffg_474_new_command_schema_window_start" && guard.state === "blocked",
  ),
  "New command schema feature flag guard missing",
);
assertCondition(
  readiness.destructiveExecutionPermitted === false &&
    cutoverRunbook.programmeCutoverPlan.destructiveExecutionPermitted === false,
  "Production cutover must remain disabled",
);
assertCondition(
  cutoverRunbook.programmeCutoverPlan.dryRunPermitted === true,
  "Dry run should be permitted",
);
assertCondition(
  rollbackMatrix.rollbackDecisions.some((decision: any) =>
    decision.manualFallbackBindingRef.includes("pharmacy"),
  ),
  "Rollback matrix must include pharmacy fallback",
);
assertCondition(gap.destructiveExecutionPermitted === false, "Gap bridge must fail closed");

for (const anchor of [
  'data-testid="migration-474-cutover-board"',
  'data-testid="migration-474-top-strip"',
  'data-testid="migration-474-cutover-ladder"',
  'data-testid="migration-474-heatstrip"',
  'data-testid="migration-474-rollback-matrix"',
  'data-testid="migration-474-reference-manifest"',
  'data-testid="migration-474-right-rail"',
  'data-testid="migration-474-approve-dry-run"',
  'data-testid="migration-474-execute-cutover"',
]) {
  assertIncludes("apps/ops-console/src/operations-shell-seed.tsx", anchor);
}

assertIncludes("package.json", "test:programme:474-migration-cutover");
assertIncludes("package.json", "validate:474-migration-cutover");
assertIncludes(
  "prompt/checklist.md",
  "seq_474_programme_prepare_data_migration_backfill_and_reference_dataset_cutover_plan",
);

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}/i;
for (const artifact of [
  "data/migration/474_schema_migration_plan.json",
  "data/migration/474_projection_backfill_plan.json",
  "data/migration/474_reference_dataset_manifest.json",
  "data/migration/474_read_path_compatibility_window.json",
  "data/migration/474_cutover_runbook.json",
  "data/migration/474_stop_resume_and_rollback_matrix.json",
  "data/migration/474_projection_readiness_verdicts.json",
]) {
  assertCondition(
    !read(artifact).match(forbiddenSurfacePatterns),
    `${artifact} leaked sensitive text`,
  );
}

console.log("Task 474 migration cutover readiness validation passed.");
