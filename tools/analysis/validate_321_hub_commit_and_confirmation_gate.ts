import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  atMinute,
  beginNativeCommit,
  buildBeginCommitInput,
  buildCommitAuthority,
  buildImportedIngestInput,
  buildManualCaptureInput,
  buildNativeSubmitInput,
  setupHubCommitHarness,
} from "../../tests/integration/321_hub_commit.helpers.ts";

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
    "phase5-hub-commit-engine.ts",
  ),
  path.join(
    ROOT,
    "packages",
    "domains",
    "hub_coordination",
    "tests",
    "phase5-hub-commit-engine.test.ts",
  ),
  path.join(ROOT, "tests", "integration", "321_hub_commit.helpers.ts"),
  path.join(ROOT, "tests", "integration", "321_hub_commit_and_confirmation_truth.spec.ts"),
  path.join(
    ROOT,
    "tests",
    "integration",
    "321_hub_commit_split_brain_and_import_correlation.spec.ts",
  ),
  path.join(ROOT, "tests", "integration", "321_hub_supplier_mirror_and_replay.spec.ts"),
  path.join(ROOT, "tests", "integration", "321_hub_commit_migration_and_artifacts.spec.ts"),
  path.join(ROOT, "tests", "property", "321_hub_commit_idempotency_and_gate_properties.spec.ts"),
  path.join(
    ROOT,
    "docs",
    "architecture",
    "321_hub_commit_attempts_confirmation_gates_and_appointment_truth.md",
  ),
  path.join(ROOT, "docs", "api", "321_hub_commit_and_confirmation_api.md"),
  path.join(ROOT, "docs", "security", "321_commit_fence_idempotency_and_confirmation_rules.md"),
  path.join(ROOT, "data", "analysis", "321_external_reference_notes.md"),
  path.join(ROOT, "data", "analysis", "321_commit_race_and_split_brain_cases.csv"),
  path.join(ROOT, "data", "analysis", "321_imported_confirmation_correlation_examples.json"),
  path.join(ROOT, "services", "command-api", "migrations", "149_phase5_hub_commit_engine.sql"),
];

const REQUIRED_SCRIPT =
  '"validate:321-hub-commit-and-confirmation-gate": "pnpm exec tsx ./tools/analysis/validate_321_hub_commit_and_confirmation_gate.ts"';

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

function validateChecklist() {
  const checklist = read(path.join(ROOT, "prompt", "checklist.md"));
  requireCondition(
    checklist.includes(
      "- [-] par_321_phase5_track_backend_build_native_hub_booking_commit_and_practice_continuity_messaging",
    ) ||
      checklist.includes(
        "- [X] par_321_phase5_track_backend_build_native_hub_booking_commit_and_practice_continuity_messaging",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_321",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:321-hub-commit-and-confirmation-gate",
  );
}

function validateMigration() {
  const sql = read(
    path.join(ROOT, "services", "command-api", "migrations", "149_phase5_hub_commit_engine.sql"),
  );
  for (const requiredTable of [
    "phase5_hub_action_records",
    "phase5_hub_commit_attempts",
    "phase5_hub_booking_evidence_bundles",
    "phase5_hub_appointment_records",
    "phase5_hub_commit_settlements",
    "phase5_hub_continuity_evidence_projections",
    "phase5_hub_commit_reconciliation_records",
    "phase5_hub_supplier_mirror_states",
    "phase5_hub_supplier_drift_hooks",
  ]) {
    requireCondition(sql.includes(requiredTable), `MIGRATION_TABLE_MISSING:${requiredTable}`);
  }
  for (const dependency of [
    "143_phase5_hub_case_kernel.sql",
    "145_phase5_enhanced_access_policy_engine.sql",
    "146_phase5_network_capacity_snapshot_pipeline.sql",
    "148_phase5_alternative_offer_engine.sql",
  ]) {
    requireCondition(sql.includes(dependency), `MIGRATION_DEPENDENCY_MISSING:${dependency}`);
  }
}

function validateArtifacts() {
  const notes = read(path.join(ROOT, "data", "analysis", "321_external_reference_notes.md"));
  const splitBrainCases = read(
    path.join(ROOT, "data", "analysis", "321_commit_race_and_split_brain_cases.csv"),
  );
  const importCorrelation = read(
    path.join(ROOT, "data", "analysis", "321_imported_confirmation_correlation_examples.json"),
  );

  for (const marker of [
    "HL7 FHIR R4 Appointment",
    "HL7 FHIR R4 Slot",
    "Digital clinical safety assurance",
    "DCB0129 / DCB0160 applicability guidance",
    "Booking and Referral Standard (BaRS)",
  ]) {
    requireCondition(notes.includes(marker), `EXTERNAL_REFERENCE_NOTE_MISSING:${marker}`);
  }

  for (const caseId of [
    "race_321_001",
    "race_321_002",
    "split_brain_321_003",
    "split_brain_321_004",
    "race_321_005",
    "split_brain_321_006",
  ]) {
    requireCondition(splitBrainCases.includes(caseId), `SPLIT_BRAIN_CASE_MISSING:${caseId}`);
  }

  for (const exampleId of [
    "import_corr_321_001",
    "import_corr_321_002",
    "import_corr_321_003",
    "import_corr_321_004",
    "import_corr_321_005",
  ]) {
    requireCondition(importCorrelation.includes(exampleId), `IMPORT_CORRELATION_MISSING:${exampleId}`);
  }
}

async function validateRuntimeProof() {
  const nativeHarness = await setupHubCommitHarness("321_validator_native");
  const nativeBegin = await beginNativeCommit(nativeHarness);
  const nativeResult = await nativeHarness.commitService.submitNativeApiCommit(
    await buildNativeSubmitInput(nativeHarness, nativeBegin, {
      response: {
        responseClass: "authoritative_confirmed",
        receiptCheckpointRef: `receipt_${nativeBegin.commitAttempt.commitAttemptId}`,
        adapterCorrelationKey: `corr_${nativeBegin.commitAttempt.commitAttemptId}`,
        providerBookingReference: `booking_${nativeBegin.commitAttempt.commitAttemptId}`,
        supplierAppointmentRef: `supplier_${nativeBegin.commitAttempt.commitAttemptId}`,
        sourceFamilies: [
          "same_commit_read_after_write",
          "durable_provider_reference",
        ],
        hardMatchRefsPassed: [
          "selected_candidate",
          "capacity_unit",
          "provider_binding",
        ],
      },
    }),
  );
  requireCondition(
    nativeResult.settlement.result === "booked_pending_ack",
    "RUNTIME_NATIVE_SETTLEMENT_INVALID",
  );
  requireCondition(
    nativeResult.confirmationGate?.state === "confirmed",
    "RUNTIME_NATIVE_GATE_INVALID",
  );

  const manualHarness = await setupHubCommitHarness("321_validator_manual");
  const manualBegin = await manualHarness.commitService.beginCommitAttempt(
    await buildBeginCommitInput(manualHarness, "manual_pending_confirmation"),
  );
  const weakManual = await manualHarness.commitService.captureManualBookingEvidence(
    await buildManualCaptureInput(manualHarness, manualBegin),
  );
  requireCondition(
    weakManual.settlement.result === "pending_confirmation",
    "RUNTIME_MANUAL_WEAK_SHOULD_STAY_PENDING",
  );
  const strongBase = await buildManualCaptureInput(manualHarness, manualBegin);
  const strongManual = await manualHarness.commitService.captureManualBookingEvidence({
    ...strongBase,
    commitAttemptId: weakManual.commitAttempt.commitAttemptId,
    presentedTruthTupleHash: weakManual.commitAttempt.truthTupleHash,
    recordedAt: atMinute(16),
    evidence: {
      ...strongBase.evidence,
      evidenceSourceFamilies: [
        "manual_operator_entry",
        "manual_independent_call_back",
      ],
    },
  });
  requireCondition(
    strongManual.settlement.result === "booked_pending_ack",
    "RUNTIME_MANUAL_STRONG_SHOULD_CONFIRM",
  );

  const importHarness = await setupHubCommitHarness("321_validator_import");
  const importTruth = (
    await importHarness.offerRepositories.getTruthProjectionForCase(
      importHarness.accepted.hubTransition.hubCase.hubCoordinationCaseId,
    )
  )!.toSnapshot();
  const imported = await importHarness.commitService.ingestImportedConfirmation({
    hubCoordinationCaseId: importHarness.accepted.hubTransition.hubCase.hubCoordinationCaseId,
    actorRef: "import_actor_validator",
    routeIntentBindingRef: "route_import_validator",
    commandActionRecordRef: "action_import_validator",
    commandSettlementRecordRef: "settlement_import_validator",
    recordedAt: atMinute(16),
    idempotencyKey: "import_validator",
    providerAdapterBinding: importHarness.providerAdapterBinding,
    presentedTruthTupleHash: importTruth.truthTupleHash,
    selectedCandidateRef: importHarness.selectedCandidate.candidateId,
    selectedOfferSessionRef: importHarness.accepted.session.alternativeOfferSessionId,
    sourceRefs: ["tools/analysis/validate_321_hub_commit_and_confirmation_gate.ts"],
    authority: await buildCommitAuthority(importHarness, "mark_confirmation_pending", 16),
    importedEvidence: {
      importedEvidenceRef: "imported_validator",
      sourceVersion: importHarness.providerAdapterBinding.sourceVersion,
      supplierBookingReference: "supplier_booking_validator",
      supplierAppointmentRef: "supplier_appointment_validator",
      supplierCorrelationKey: "supplier_corr_validator",
      matchedWindowMinutes: 15,
      evidenceSourceFamilies: [
        "imported_supplier_message",
        "supplier_webhook",
      ],
    },
  });
  requireCondition(
    imported.settlement.result === "booked_pending_ack",
    "RUNTIME_IMPORTED_SETTLEMENT_INVALID",
  );

  const disputeHarness = await setupHubCommitHarness("321_validator_dispute");
  const disputeBegin = await disputeHarness.commitService.beginCommitAttempt(
    await buildBeginCommitInput(disputeHarness, "imported_confirmation"),
  );
  const disputed = await disputeHarness.commitService.ingestImportedConfirmation(
    await buildImportedIngestInput(disputeHarness, disputeBegin, {
      importedEvidence: {
        importedEvidenceRef: "imported_validator_dispute",
        sourceVersion: "wrong_source_version",
        supplierBookingReference: "supplier_booking_dispute",
        supplierAppointmentRef: "supplier_appt_dispute",
        supplierCorrelationKey: "supplier_corr_dispute",
        matchedWindowMinutes: 15,
        evidenceSourceFamilies: ["imported_supplier_message"],
      },
    }),
  );
  requireCondition(
    disputed.settlement.result === "imported_disputed",
    "RUNTIME_IMPORTED_DISPUTE_INVALID",
  );

  const reconcileHarness = await setupHubCommitHarness("321_validator_reconcile");
  const reconcileBegin = await beginNativeCommit(reconcileHarness);
  const reconciled = await reconcileHarness.commitService.submitNativeApiCommit(
    await buildNativeSubmitInput(reconcileHarness, reconcileBegin, {
      response: {
        responseClass: "timeout_unknown",
        receiptCheckpointRef: `receipt_${reconcileBegin.commitAttempt.commitAttemptId}`,
        adapterCorrelationKey: `corr_${reconcileBegin.commitAttempt.commitAttemptId}`,
        sourceFamilies: ["adapter_receipt"],
      },
    }),
  );
  requireCondition(
    reconciled.settlement.result === "reconciliation_required",
    "RUNTIME_RECONCILIATION_INVALID",
  );

  const driftHarness = await setupHubCommitHarness("321_validator_drift");
  const driftBegin = await beginNativeCommit(driftHarness);
  const booked = await driftHarness.commitService.submitNativeApiCommit(
    await buildNativeSubmitInput(driftHarness, driftBegin, {
      response: {
        responseClass: "authoritative_confirmed",
        receiptCheckpointRef: `receipt_${driftBegin.commitAttempt.commitAttemptId}`,
        adapterCorrelationKey: `corr_${driftBegin.commitAttempt.commitAttemptId}`,
        providerBookingReference: `booking_${driftBegin.commitAttempt.commitAttemptId}`,
        supplierAppointmentRef: `supplier_${driftBegin.commitAttempt.commitAttemptId}`,
        sourceFamilies: [
          "same_commit_read_after_write",
          "durable_provider_reference",
        ],
        hardMatchRefsPassed: [
          "selected_candidate",
          "capacity_unit",
          "provider_binding",
        ],
      },
    }),
  );
  const drift = await driftHarness.commitService.recordSupplierMirrorObservation({
    hubAppointmentId: booked.appointment!.hubAppointmentId,
    observedAt: atMinute(20),
    observedStatus: "cancelled",
    supplierVersion: "supplier_v2",
    driftReasonRefs: ["supplier_cancelled_after_booking"],
  });
  requireCondition(
    drift.truthProjection.confirmationTruthState === "blocked_by_drift",
    "RUNTIME_DRIFT_TRUTH_INVALID",
  );
}

async function main() {
  REQUIRED_FILES.forEach((filePath) => read(filePath));
  validateChecklist();
  validatePackageScript();
  validateMigration();
  validateArtifacts();
  await validateRuntimeProof();
  console.log("validate_321_hub_commit_and_confirmation_gate: ok");
}

await main();
