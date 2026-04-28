import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const repoRoot = resolve("/Users/test/Code/V");

const requiredFiles = [
  "packages/domains/pharmacy/src/phase6-pharmacy-bounce-back-engine.ts",
  "packages/domains/pharmacy/src/index.ts",
  "packages/domains/pharmacy/tests/public-api.test.ts",
  "packages/domains/pharmacy/tests/phase6-pharmacy-bounce-back-engine.test.ts",
  "tests/integration/353_pharmacy_bounce_back.helpers.ts",
  "tests/integration/353_pharmacy_urgent_return_and_duty_task.spec.ts",
  "tests/integration/353_pharmacy_no_contact_repair_and_patient_copy.spec.ts",
  "tests/integration/353_pharmacy_bounce_back_queue_and_reopen.spec.ts",
  "tests/integration/353_pharmacy_bounce_back_replay_and_concurrency.spec.ts",
  "tests/property/353_pharmacy_bounce_back_priority_and_loop_properties.spec.ts",
  "services/command-api/migrations/161_phase6_pharmacy_bounce_back_reopen_engine.sql",
  "docs/architecture/353_bounce_back_urgent_return_and_reopen.md",
  "docs/api/353_bounce_back_and_reopen_api.md",
  "docs/operations/353_urgent_return_no_contact_and_loop_escalation_rules.md",
  "data/analysis/353_external_reference_notes.md",
  "data/analysis/353_reopen_priority_and_loop_risk_matrix.csv",
  "data/analysis/353_bounce_back_type_normalization_matrix.csv",
  "data/fixtures/353_bounce_back_examples.json",
];

for (const relativePath of requiredFiles) {
  readFileSync(resolve(repoRoot, relativePath), "utf8");
}

const engineSource = readFileSync(
  resolve(repoRoot, "packages/domains/pharmacy/src/phase6-pharmacy-bounce-back-engine.ts"),
  "utf8",
);

for (const needle of [
  "export interface PharmacyBounceBackNormalizer",
  "export interface PharmacyBounceBackRecordService",
  "export interface PharmacyReopenPriorityCalculator",
  "export interface PharmacyUrgentReturnChannelResolver",
  "export interface PharmacyReopenLeaseService",
  "export interface PharmacyReturnReachabilityBridge",
  "export interface PharmacyBounceBackTruthProjectionBuilder",
  "export interface PharmacyLoopSupervisorEscalationService",
  "async previewNormalizedBounceBack(preview)",
  "async ingestBounceBackEvidence(command)",
  "async reopenCaseFromBounceBack(command)",
  "async getLoopRiskAndSupervisorPosture(pharmacyCaseId)",
  "async resolveSupervisorReview(command)",
  "const inFlightBounceBackByReplayDigest = new Map",
]) {
  assert(engineSource.includes(needle), `353 engine must include ${needle}.`);
}

const migration = readFileSync(
  resolve(repoRoot, "services/command-api/migrations/161_phase6_pharmacy_bounce_back_reopen_engine.sql"),
  "utf8",
);

for (const tableName of [
  "phase6_pharmacy_bounce_back_evidence_envelope",
  "phase6_pharmacy_bounce_back_record",
  "phase6_urgent_return_direct_route_profile",
  "phase6_pharmacy_practice_visibility_projection",
  "phase6_pharmacy_bounce_back_supervisor_review",
  "phase6_pharmacy_return_notification_trigger",
  "phase6_pharmacy_bounce_back_truth_projection",
  "phase6_pharmacy_bounce_back_audit_event",
]) {
  assert(migration.includes(tableName), `353 migration must create ${tableName}.`);
}

const normalizationRows = readFileSync(
  resolve(repoRoot, "data/analysis/353_bounce_back_type_normalization_matrix.csv"),
  "utf8",
)
  .trim()
  .split("\n")
  .slice(1);

assert(
  normalizationRows.length === 8,
  "353 normalization matrix must publish eight normalization rows.",
);

for (const bounceBackType of [
  "urgent_gp_return",
  "routine_gp_return",
  "patient_not_contactable",
  "patient_declined",
  "pharmacy_unable_to_complete",
  "referral_expired",
  "safeguarding_concern",
]) {
  assert(
    normalizationRows.some((row) => row.includes(`,${bounceBackType},`)),
    `353 normalization matrix must include ${bounceBackType}.`,
  );
}

const priorityRows = readFileSync(
  resolve(repoRoot, "data/analysis/353_reopen_priority_and_loop_risk_matrix.csv"),
  "utf8",
)
  .trim()
  .split("\n")
  .slice(1);

assert(priorityRows.length === 8, "353 reopen matrix must publish eight scenario rows.");
assert(
  priorityRows.some((row) => row.startsWith("repeated_non_material_loop,")),
  "353 reopen matrix must include repeated_non_material_loop.",
);
assert(
  priorityRows.some((row) => row.includes(",urgent_bounce_back,")),
  "353 reopen matrix must include an urgent bounce-back row.",
);
assert(
  priorityRows.some((row) => row.includes(",no_contact_return_pending,")),
  "353 reopen matrix must include a no-contact row.",
);

const fixtures = JSON.parse(
  readFileSync(resolve(repoRoot, "data/fixtures/353_bounce_back_examples.json"), "utf8"),
) as {
  bounceBackExamples: Array<{
    bounceBackType: string;
    expectedReopenedCaseStatus: string;
  }>;
};

assert(
  fixtures.bounceBackExamples.length === 7,
  "353 fixtures must cover all seven bounce-back types.",
);
for (const bounceBackType of [
  "urgent_gp_return",
  "routine_gp_return",
  "patient_not_contactable",
  "patient_declined",
  "pharmacy_unable_to_complete",
  "referral_expired",
  "safeguarding_concern",
]) {
  assert(
    fixtures.bounceBackExamples.some((example) => example.bounceBackType === bounceBackType),
    `353 fixtures must include ${bounceBackType}.`,
  );
}

const externalNotes = readFileSync(
  resolve(repoRoot, "data/analysis/353_external_reference_notes.md"),
  "utf8",
);

for (const url of [
  "https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record",
  "https://www.england.nhs.uk/long-read/changes-to-the-gp-contract-in-2026-27/",
  "https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/",
  "https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-%20specification-nhs-pharmacy-first-service/",
  "https://www.england.nhs.uk/wp-content/uploads/2023/11/PRN00936_ii_pharmacy-first-clinical-pathways-version-2.5.pdf",
]) {
  assert(
    externalNotes.includes(url),
    `353 external reference notes must cite ${url}.`,
  );
}

console.log("validate_353_bounce_back_reopen: ok");
