import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  atMinute,
  buildImportedCorrelationInput,
  buildSupplierObservationInput,
  prepareBookedManageHarness,
  setupBookedIntegrityHarness,
  setupReconciliationIntegrityHarness,
} from "../../tests/integration/325_hub_background_integrity.helpers.ts";
import {
  createPhase5HubBackgroundIntegrityService,
  ownedObjectFamilies,
  packageContract,
} from "../../packages/domains/hub_coordination/src/index.ts";

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
    "phase5-hub-background-integrity-engine.ts",
  ),
  path.join(
    ROOT,
    "packages",
    "domains",
    "hub_coordination",
    "tests",
    "phase5-hub-background-integrity-engine.test.ts",
  ),
  path.join(ROOT, "tests", "integration", "325_hub_background_integrity.helpers.ts"),
  path.join(ROOT, "tests", "integration", "325_reconciliation_and_imported_confirmation.spec.ts"),
  path.join(ROOT, "tests", "integration", "325_supplier_mirror_and_exception_worker.spec.ts"),
  path.join(ROOT, "tests", "integration", "325_projection_backfill_and_ambiguity.spec.ts"),
  path.join(ROOT, "tests", "property", "325_worker_monotonicity_and_dedupe.spec.ts"),
  path.join(ROOT, "services", "hub-booking-reconciler", "src", "service-definition.ts"),
  path.join(ROOT, "services", "hub-supplier-mirror", "src", "service-definition.ts"),
  path.join(ROOT, "services", "hub-exception-worker", "src", "service-definition.ts"),
  path.join(
    ROOT,
    "services",
    "command-api",
    "migrations",
    "153_phase5_hub_background_integrity_workers.sql",
  ),
  path.join(
    ROOT,
    "docs",
    "architecture",
    "325_hub_reconciler_supplier_mirror_and_exception_worker.md",
  ),
  path.join(ROOT, "docs", "operations", "325_reconciliation_and_supplier_drift_runbook.md"),
  path.join(
    ROOT,
    "docs",
    "security",
    "325_imported_confirmation_correlation_and_worker_fencing.md",
  ),
  path.join(ROOT, "data", "analysis", "325_external_reference_notes.md"),
  path.join(ROOT, "data", "analysis", "325_reconciliation_failure_matrix.csv"),
  path.join(ROOT, "data", "analysis", "325_supplier_drift_cases.csv"),
  path.join(ROOT, "data", "analysis", "325_projection_backfill_ambiguity_cases.csv"),
];

const REQUIRED_SCRIPT =
  '"validate:325-hub-workers-and-backfill": "pnpm exec tsx ./tools/analysis/validate_325_hub_workers_and_backfill.ts"';

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
      "- [-] par_325_phase5_track_backend_build_hub_supplier_mirror_commit_reconciler_and_exception_worker",
    ) ||
      checklist.includes(
        "- [X] par_325_phase5_track_backend_build_hub_supplier_mirror_commit_reconciler_and_exception_worker",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_325",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:325-hub-workers-and-backfill",
  );
}

function validateWorkspace() {
  const workspace = read(path.join(ROOT, "pnpm-workspace.yaml"));
  for (const entry of [
    "services/hub-booking-reconciler",
    "services/hub-supplier-mirror",
    "services/hub-exception-worker",
  ]) {
    requireCondition(workspace.includes(entry), `WORKSPACE_ENTRY_MISSING:${entry}`);
  }
}

function validateMigration() {
  const sql = read(
    path.join(
      ROOT,
      "services",
      "command-api",
      "migrations",
      "153_phase5_hub_background_integrity_workers.sql",
    ),
  );
  for (const table of [
    "phase5_hub_reconciliation_work_leases",
    "phase5_hub_imported_confirmation_correlations",
    "phase5_hub_supplier_observations",
    "phase5_hub_supplier_mirror_checkpoints",
    "phase5_hub_exception_work_items",
    "phase5_hub_exception_audit_rows",
    "phase5_hub_projection_backfill_cursors",
  ]) {
    requireCondition(sql.includes(table), `MIGRATION_TABLE_MISSING:${table}`);
  }
  for (const dependency of [
    "149_phase5_hub_commit_engine.sql",
    "150_phase5_practice_continuity_chain.sql",
    "151_phase5_hub_fallback_workflows.sql",
    "152_phase5_network_reminders_manage_visibility.sql",
  ]) {
    requireCondition(sql.includes(dependency), `MIGRATION_DEPENDENCY_MISSING:${dependency}`);
  }
}

function validateArchitectureAndServices() {
  const architecture = read(
    path.join(
      ROOT,
      "docs",
      "architecture",
      "325_hub_reconciler_supplier_mirror_and_exception_worker.md",
    ),
  );
  const reconciler = read(
    path.join(ROOT, "services", "hub-booking-reconciler", "src", "service-definition.ts"),
  );
  const mirror = read(
    path.join(ROOT, "services", "hub-supplier-mirror", "src", "service-definition.ts"),
  );
  const exceptionWorker = read(
    path.join(ROOT, "services", "hub-exception-worker", "src", "service-definition.ts"),
  );
  const security = read(
    path.join(
      ROOT,
      "docs",
      "security",
      "325_imported_confirmation_correlation_and_worker_fencing.md",
    ),
  );

  for (const marker of [
    "HubReconciliationWorkLease",
    "HubImportedConfirmationCorrelation",
    "HubSupplierObservation",
    "HubSupplierMirrorCheckpoint",
    "HubExceptionWorkItem",
    "HubExceptionAuditRow",
    "HubProjectionBackfillCursor",
  ]) {
    requireCondition(architecture.includes(marker), `ARCHITECTURE_MARKER_MISSING:${marker}`);
  }

  for (const marker of [
    "claim_reconciliation_attempt",
    "resolve_reconciliation_attempt",
    "backfill_open_case_truth",
  ]) {
    requireCondition(reconciler.includes(marker), `RECONCILER_ROUTE_MISSING:${marker}`);
  }
  for (const marker of ["ingest_supplier_observation", "query_supplier_checkpoint"]) {
    requireCondition(mirror.includes(marker), `SUPPLIER_MIRROR_ROUTE_MISSING:${marker}`);
  }
  for (const marker of [
    "open_hub_exception_work",
    "claim_hub_exception_work",
    "process_hub_exception_work",
  ]) {
    requireCondition(exceptionWorker.includes(marker), `EXCEPTION_ROUTE_MISSING:${marker}`);
  }
  for (const marker of [
    "provider binding hash",
    "only one active lease",
    "stale_owner_or_stale_lease",
    "backfill_ambiguity_supervision",
  ]) {
    requireCondition(security.includes(marker), `SECURITY_MARKER_MISSING:${marker}`);
  }
}

function validateReferenceNotesAndTables() {
  const notes = read(path.join(ROOT, "data", "analysis", "325_external_reference_notes.md"));
  const reconciliation = read(
    path.join(ROOT, "data", "analysis", "325_reconciliation_failure_matrix.csv"),
  );
  const supplier = read(path.join(ROOT, "data", "analysis", "325_supplier_drift_cases.csv"));
  const backfill = read(
    path.join(ROOT, "data", "analysis", "325_projection_backfill_ambiguity_cases.csv"),
  );

  requireCondition(notes.includes("Accessed on 2026-04-23."), "REFERENCE_ACCESS_DATE_MISSING");
  for (const marker of [
    "https://hl7.org/fhir/R4/appointment.html",
    "https://hl7.org/fhir/R4/slot.html",
    "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh",
    "https://digital.nhs.uk/developer/api-catalogue/message-exchange-for-social-care-and-health-api",
    "https://digital.nhs.uk/developer/architecture/integration-patterns-book/interaction-methods",
    "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
    "https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/",
    "https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance",
  ]) {
    requireCondition(notes.includes(marker), `REFERENCE_URL_MISSING:${marker}`);
  }
  for (const marker of [
    "Borrowed: FHIR still distinguishes appointment lifecycle",
    "Borrowed: MESH still models delivery and receipt as message-transport evidence",
    "Rejected: treating a plausible supplier booking reference or callback arrival as final booking truth",
    "No public official documentation exists for this repository’s internal worker scheduler",
  ]) {
    requireCondition(notes.includes(marker), `REFERENCE_NOTE_MISSING:${marker}`);
  }

  for (const scenarioId of [
    "recon_325_001",
    "recon_325_003",
    "recon_325_006",
  ]) {
    requireCondition(reconciliation.includes(scenarioId), `RECONCILIATION_CASE_MISSING:${scenarioId}`);
  }
  for (const scenarioId of [
    "drift_325_001",
    "drift_325_003",
    "drift_325_004",
  ]) {
    requireCondition(supplier.includes(scenarioId), `SUPPLIER_CASE_MISSING:${scenarioId}`);
  }
  for (const scenarioId of [
    "backfill_325_001",
    "backfill_325_002",
    "backfill_325_005",
  ]) {
    requireCondition(backfill.includes(scenarioId), `BACKFILL_CASE_MISSING:${scenarioId}`);
  }
}

function validatePublicSurface() {
  requireCondition(typeof createPhase5HubBackgroundIntegrityService === "function", "PUBLIC_EXPORT_MISSING:createPhase5HubBackgroundIntegrityService");
  requireCondition(packageContract.objectFamilyCount === 58, "PACKAGE_CONTRACT_COUNT_MISMATCH");
  for (const family of [
    "HubReconciliationWorkLease",
    "HubImportedConfirmationCorrelation",
    "HubSupplierObservation",
    "HubSupplierMirrorCheckpoint",
    "HubExceptionWorkItem",
    "HubExceptionAuditRow",
    "HubProjectionBackfillCursor",
  ]) {
    requireCondition(
      ownedObjectFamilies.some((entry) => entry.canonicalName === family),
      `OWNED_OBJECT_FAMILY_MISSING:${family}`,
    );
  }
}

async function validateRuntime() {
  const reconciliationHarness = await setupReconciliationIntegrityHarness("325_validate_recon");
  const claim = await reconciliationHarness.integrityService.claimReconciliationAttempt({
    commitAttemptId: reconciliationHarness.reconciliationResult.commitAttempt.commitAttemptId,
    workerRef: "validator_reconciler",
    workerRunRef: "validator_reconciler_run",
    claimedAt: atMinute(25),
  });
  const blocked = await reconciliationHarness.integrityService.claimReconciliationAttempt({
    commitAttemptId: reconciliationHarness.reconciliationResult.commitAttempt.commitAttemptId,
    workerRef: "validator_reconciler_two",
    workerRunRef: "validator_reconciler_run_two",
    claimedAt: atMinute(26),
  });
  requireCondition(claim.blockedByActiveLease === false, "RUNTIME_RECONCILIATION_CLAIM_UNEXPECTEDLY_BLOCKED");
  requireCondition(blocked.blockedByActiveLease === true, "RUNTIME_SECOND_RECONCILIATION_CLAIM_NOT_BLOCKED");

  const bindingMismatch = await reconciliationHarness.integrityService.correlateImportedConfirmation(
    await buildImportedCorrelationInput(reconciliationHarness, {
      providerAdapterBinding: {
        ...reconciliationHarness.providerAdapterBinding,
        sourceIdentity: `${reconciliationHarness.providerAdapterBinding.sourceIdentity}_mismatch`,
      },
      idempotencyKey: "validator_binding_mismatch",
      recordedAt: atMinute(27),
    }),
  );
  requireCondition(bindingMismatch.commitResult === null, "RUNTIME_BINDING_MISMATCH_SETTLED_TRUTH");
  requireCondition(
    bindingMismatch.correlation.correlationState === "evidence_only",
    "RUNTIME_BINDING_MISMATCH_NOT_EVIDENCE_ONLY",
  );
  requireCondition(
    bindingMismatch.correlation.reasonRefs.includes("provider_binding_mismatch"),
    "RUNTIME_BINDING_MISMATCH_REASON_MISSING",
  );

  const bookedHarness = await setupBookedIntegrityHarness("325_validate_drift");
  await prepareBookedManageHarness(bookedHarness);
  const drift = await bookedHarness.integrityService.ingestSupplierMirrorObservation(
    buildSupplierObservationInput(bookedHarness, {
      observedStatus: "cancelled",
    }),
  );
  requireCondition(drift.mirrorState.manageFreezeState === "frozen", "RUNTIME_DRIFT_NOT_FROZEN");
  requireCondition(drift.checkpoint.visibilityDebtReopened === true, "RUNTIME_DRIFT_DID_NOT_REOPEN_VISIBILITY_DEBT");
  requireCondition(
    drift.exception?.exceptionClass === "supplier_drift_detected",
    "RUNTIME_DRIFT_EXCEPTION_NOT_OPENED",
  );

  const appointment = (
    await bookedHarness.commitRepositories.getAppointmentRecord(
      bookedHarness.commitResult.appointment!.hubAppointmentId,
    )
  )!.toSnapshot();
  await bookedHarness.commitRepositories.saveAppointmentRecord(
    {
      ...appointment,
      selectedCandidateRef: `${appointment.selectedCandidateRef}_drifted`,
      version: appointment.version + 1,
    },
    {
      expectedVersion: appointment.version,
    },
  );
  const backfill = await bookedHarness.integrityService.runProjectionBackfill({
    hubCoordinationCaseId: bookedHarness.commitResult.commitAttempt.hubCoordinationCaseId,
    workerRef: "validator_backfill",
    workerRunRef: "validator_backfill_run",
    recordedAt: atMinute(40),
  });
  requireCondition(backfill.cursor.lastVerdict === "ambiguous", "RUNTIME_BACKFILL_DID_NOT_FAIL_CLOSED");
  requireCondition(
    backfill.cursor.ambiguityReasonRefs.includes("appointment_candidate_conflict"),
    "RUNTIME_BACKFILL_AMBIGUITY_REASON_MISSING",
  );
}

async function main() {
  validateFiles();
  validateChecklist();
  validatePackageScript();
  validateWorkspace();
  validateMigration();
  validateArchitectureAndServices();
  validateReferenceNotesAndTables();
  validatePublicSurface();
  await validateRuntime();
  console.log("validate_325_hub_workers_and_backfill: ok");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
