import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const repoRoot = resolve("/Users/test/Code/V");

const requiredFiles = [
  "packages/domains/pharmacy/src/phase6-pharmacy-outcome-reconciliation-engine.ts",
  "packages/domains/pharmacy/src/phase6-pharmacy-case-kernel.ts",
  "packages/domains/pharmacy/src/phase6-pharmacy-patient-status-engine.ts",
  "packages/domains/pharmacy/tests/public-api.test.ts",
  "packages/domains/pharmacy/tests/phase6-pharmacy-outcome-reconciliation-engine.test.ts",
  "tests/integration/352_pharmacy_outcome.helpers.ts",
  "tests/integration/352_pharmacy_outcome_parser_sources.spec.ts",
  "tests/integration/352_pharmacy_outcome_ingest_and_replay.spec.ts",
  "tests/integration/352_pharmacy_outcome_review_queue.spec.ts",
  "tests/integration/352_pharmacy_outcome_gate_resolution.spec.ts",
  "tests/property/352_pharmacy_outcome_replay_and_match_properties.spec.ts",
  "services/command-api/migrations/160_phase6_pharmacy_outcome_reconciliation_pipeline.sql",
  "docs/architecture/352_pharmacy_outcome_ingest_and_reconciliation.md",
  "docs/api/352_pharmacy_outcome_ingest_and_truth_api.md",
  "docs/operations/352_outcome_review_unmatched_and_reopen_rules.md",
  "data/analysis/352_external_reference_notes.md",
  "data/analysis/352_outcome_match_threshold_matrix.csv",
  "data/analysis/352_outcome_source_normalization_matrix.csv",
  "data/analysis/352_replay_and_collision_review_matrix.csv",
  "data/fixtures/352_outcome_source_examples.json",
  "data/fixtures/352_outcome_reconciliation_examples.json",
];

for (const relativePath of requiredFiles) {
  readFileSync(resolve(repoRoot, relativePath), "utf8");
}

const engineSource = readFileSync(
  resolve(repoRoot, "packages/domains/pharmacy/src/phase6-pharmacy-outcome-reconciliation-engine.ts"),
  "utf8",
);

for (const needle of [
  "export interface OutcomeEvidenceEnvelopeSnapshot",
  "export interface PharmacyOutcomeIngestAttemptSnapshot",
  "export interface PharmacyOutcomeReconciliationGateSnapshot",
  "export interface PharmacyOutcomeSettlementSnapshot",
  "export interface PharmacyOutcomeReplayClassifier",
  "export interface PharmacyOutcomeMatcher",
  "export interface PharmacyOutcomeSafetyBridge",
  "export interface Phase6PharmacyOutcomeReconciliationService",
  "async ingestOutcomeEvidence(command)",
  "async resolveOutcomeReconciliationGate(command)",
]) {
  assert(
    engineSource.includes(needle),
    `352 engine must include ${needle}.`,
  );
}

const migration = readFileSync(
  resolve(repoRoot, "services/command-api/migrations/160_phase6_pharmacy_outcome_reconciliation_pipeline.sql"),
  "utf8",
);

for (const tableName of [
  "phase6_outcome_evidence_envelope",
  "phase6_outcome_source_provenance",
  "phase6_normalized_pharmacy_outcome_evidence",
  "phase6_pharmacy_outcome_match_scorecard",
  "phase6_pharmacy_outcome_ingest_attempt",
  "phase6_pharmacy_outcome_reconciliation_gate",
  "phase6_pharmacy_outcome_settlement",
  "phase6_pharmacy_outcome_audit_event",
]) {
  assert(
    migration.includes(tableName),
    `352 migration must create ${tableName}.`,
  );
}

const thresholdRows = readFileSync(
  resolve(repoRoot, "data/analysis/352_outcome_match_threshold_matrix.csv"),
  "utf8",
)
  .trim()
  .split("\n")
  .slice(1);

assert(
  thresholdRows.length === 8,
  "352 threshold matrix must publish the eight canonical threshold rows.",
);
for (const threshold of [
  "tau_patient_floor",
  "tau_service_floor",
  "tau_route_floor",
  "tau_match_time",
  "tau_strong_match",
  "tau_posterior_strong",
  "delta_match",
  "tau_contra_apply",
]) {
  assert(
    thresholdRows.some((row) => row.startsWith(`${threshold},`)),
    `352 threshold matrix must include ${threshold}.`,
  );
}

const normalizationRows = readFileSync(
  resolve(repoRoot, "data/analysis/352_outcome_source_normalization_matrix.csv"),
  "utf8",
)
  .trim()
  .split("\n")
  .slice(1);

assert(
  normalizationRows.length === 4,
  "352 source normalization matrix must cover the four source families.",
);
for (const sourceType of [
  "gp_workflow_observation",
  "direct_structured_message",
  "email_ingest",
  "manual_structured_capture",
]) {
  assert(
    normalizationRows.some((row) => row.startsWith(`${sourceType},`)),
    `352 source normalization matrix must include ${sourceType}.`,
  );
}

const replayRows = readFileSync(
  resolve(repoRoot, "data/analysis/352_replay_and_collision_review_matrix.csv"),
  "utf8",
)
  .trim()
  .split("\n")
  .slice(1);

for (const decisionClass of [
  "exact_replay",
  "semantic_replay",
  "collision_review",
  "distinct",
]) {
  assert(
    replayRows.some((row) => row.includes(`,${decisionClass},`)),
    `352 replay matrix must include ${decisionClass}.`,
  );
}

const sourceExamples = JSON.parse(
  readFileSync(resolve(repoRoot, "data/fixtures/352_outcome_source_examples.json"), "utf8"),
) as {
  sourceExamples: Array<{ sourceType: string; trustClass: string; expectedDecision: string }>;
};

assert(
  sourceExamples.sourceExamples.length === 4,
  "352 source fixtures must cover all four source families.",
);
assert(
  sourceExamples.sourceExamples.some(
    (example) =>
      example.sourceType === "gp_workflow_observation" &&
      example.expectedDecision === "resolved_pending_projection",
  ),
  "352 source fixtures must prove routine GP workflow completion can settle.",
);

const reconciliationExamples = JSON.parse(
  readFileSync(resolve(repoRoot, "data/fixtures/352_outcome_reconciliation_examples.json"), "utf8"),
) as {
  reconciliationExamples: Array<{ settlementResult: string }>;
};

for (const settlementResult of [
  "resolved_pending_projection",
  "reopened_for_safety",
  "review_required",
  "unmatched",
]) {
  assert(
    reconciliationExamples.reconciliationExamples.some(
      (example) => example.settlementResult === settlementResult,
    ),
    `352 reconciliation fixtures must include ${settlementResult}.`,
  );
}

const externalNotes = readFileSync(
  resolve(repoRoot, "data/analysis/352_external_reference_notes.md"),
  "utf8",
);

for (const url of [
  "https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record",
  "https://digital.nhs.uk/developer/api-catalogue/gp-connect-update-record",
  "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh",
  "https://digital.nhs.uk/developer/api-catalogue/message-exchange-for-social-care-and-health-api",
  "https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/",
  "https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/",
  "https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/",
  "https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance",
  "https://www.hl7.org/fhir/r4/observation.html",
]) {
  assert(
    externalNotes.includes(url),
    `352 external reference notes must cite ${url}.`,
  );
}

console.log("validate_352_outcome_reconciliation: ok");
