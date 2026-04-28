import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const repoRoot = resolve("/Users/test/Code/V");

const requiredFiles = [
  "packages/domains/pharmacy/src/phase6-pharmacy-operations-engine.ts",
  "packages/domains/pharmacy/src/index.ts",
  "packages/domains/pharmacy/tests/public-api.test.ts",
  "packages/domains/pharmacy/tests/phase6-pharmacy-operations-engine.test.ts",
  "tests/integration/354_pharmacy_operations.helpers.ts",
  "tests/integration/354_pharmacy_operations_queue_membership.spec.ts",
  "tests/integration/354_pharmacy_exception_and_visibility.spec.ts",
  "tests/integration/354_provider_health_and_deltas.spec.ts",
  "tests/integration/354_pharmacy_operations_scale.spec.ts",
  "tests/property/354_pharmacy_operations_determinism.spec.ts",
  "services/command-api/migrations/162_phase6_pharmacy_operations_visibility_and_exception_api.sql",
  "docs/architecture/354_pharmacy_operations_queue_and_visibility_api.md",
  "docs/api/354_pharmacy_operations_and_visibility_api.md",
  "docs/operations/354_pharmacy_exception_taxonomy_and_queue_rules.md",
  "data/analysis/354_external_reference_notes.md",
  "data/analysis/354_queue_membership_and_exception_matrix.csv",
  "data/analysis/354_provider_health_projection_matrix.csv",
  "data/fixtures/354_pharmacy_operations_examples.json",
];

for (const relativePath of requiredFiles) {
  readFileSync(resolve(repoRoot, relativePath), "utf8");
}

const engineSource = readFileSync(
  resolve(repoRoot, "packages/domains/pharmacy/src/phase6-pharmacy-operations-engine.ts"),
  "utf8",
);

for (const needle of [
  "export interface PharmacyOperationsProjectionBuilder",
  "export interface PharmacyPracticeVisibilityProjectionBuilder",
  "export interface PharmacyExceptionClassifier",
  "export interface PharmacyProviderHealthProjectionBuilder",
  "export interface PharmacyWorklistDeltaService",
  "export interface PharmacyOperationsQueryService",
  "async fetchActiveCasesWorklist(",
  "async fetchWaitingForChoiceWorklist(",
  "async fetchDispatchedWaitingOutcomeWorklist(",
  "async fetchBounceBackWorklist(",
  "async fetchDispatchExceptionWorklist(",
  "async fetchProviderHealthSummary(",
  "async fetchProviderHealthDetail(",
  "async fetchPracticeVisibilityModel(",
  "async fetchQueueCountsAndAgeingSummaries(",
  "async fetchChangedSinceSeenDeltas(",
  "export function createPhase6PharmacyOperationsService(",
  "export function createPhase6PharmacyOperationsStore(",
]) {
  assert(engineSource.includes(needle), `354 engine must include ${needle}.`);
}

for (const family of [
  "pharmacy_active_cases_projection",
  "pharmacy_waiting_for_choice_projection",
  "pharmacy_dispatched_waiting_outcome_projection",
  "pharmacy_bounce_back_projection",
  "pharmacy_dispatch_exception_projection",
  "pharmacy_provider_health_projection",
]) {
  assert(engineSource.includes(`"${family}"`), `354 engine must include ${family}.`);
}

for (const exceptionClass of [
  "discovery_unavailable",
  "no_eligible_providers_returned",
  "dispatch_failed",
  "acknowledgement_missing",
  "outcome_unmatched",
  "no_outcome_within_configured_window",
  "conflicting_outcomes",
  "reachability_repair_required",
  "consent_revoked_after_dispatch",
  "dispatch_proof_stale",
]) {
  assert(
    engineSource.includes(`"${exceptionClass}"`),
    `354 engine must include ${exceptionClass}.`,
  );
}

const indexSource = readFileSync(
  resolve(repoRoot, "packages/domains/pharmacy/src/index.ts"),
  "utf8",
);

for (const exportName of [
  "createPhase6PharmacyOperationsService",
  "createPhase6PharmacyOperationsStore",
  "defaultPharmacyOperationsPolicy",
  "PharmacyOperationsProjectionBuilder",
  "PharmacyPracticeVisibilityProjectionBuilder",
  "PharmacyExceptionClassifier",
  "PharmacyProviderHealthProjectionBuilder",
  "PharmacyWorklistDeltaService",
  "PharmacyOperationsQueryService",
  "PharmacyProviderHealthProjectionSnapshot",
  "PharmacyPracticeVisibilityModelSnapshot",
]) {
  assert(indexSource.includes(exportName), `354 index must publish ${exportName}.`);
}

const publicApiTest = readFileSync(
  resolve(repoRoot, "packages/domains/pharmacy/tests/public-api.test.ts"),
  "utf8",
);

for (const apiName of [
  "createPhase6PharmacyOperationsService",
  "createPhase6PharmacyOperationsStore",
]) {
  assert(publicApiTest.includes(apiName), `Public API test must include ${apiName}.`);
}

const migration = readFileSync(
  resolve(
    repoRoot,
    "services/command-api/migrations/162_phase6_pharmacy_operations_visibility_and_exception_api.sql",
  ),
  "utf8",
);

for (const tableOrView of [
  "phase6_pharmacy_active_cases_projection",
  "phase6_pharmacy_waiting_for_choice_projection",
  "phase6_pharmacy_dispatched_waiting_outcome_projection",
  "phase6_pharmacy_bounce_back_projection",
  "phase6_pharmacy_dispatch_exception_projection",
  "phase6_pharmacy_provider_health_projection",
  "phase6_pharmacy_operations_audit_event",
  "phase6_pharmacy_queue_counts_summary",
  "phase6_pharmacy_provider_health_summary",
  "phase6_pharmacy_exception_rollup_summary",
]) {
  assert(migration.includes(tableOrView), `354 migration must include ${tableOrView}.`);
}

const architectureDoc = readFileSync(
  resolve(repoRoot, "docs/architecture/354_pharmacy_operations_queue_and_visibility_api.md"),
  "utf8",
);
assert(
  architectureDoc.includes("PharmacyOperationsProjectionBuilder") &&
    architectureDoc.includes("pharmacy_provider_health_projection"),
  "354 architecture doc must describe the service family and projection family.",
);

const apiDoc = readFileSync(
  resolve(repoRoot, "docs/api/354_pharmacy_operations_and_visibility_api.md"),
  "utf8",
);
for (const apiNeedle of [
  "fetchActiveCasesWorklist",
  "fetchWaitingForChoiceWorklist",
  "fetchDispatchedWaitingOutcomeWorklist",
  "fetchBounceBackWorklist",
  "fetchDispatchExceptionWorklist",
  "fetchProviderHealthSummary",
  "fetchPracticeVisibilityModel",
  "fetchQueueCountsAndAgeingSummaries",
  "fetchChangedSinceSeenDeltas",
]) {
  assert(apiDoc.includes(apiNeedle), `354 API doc must include ${apiNeedle}.`);
}

const operationsDoc = readFileSync(
  resolve(repoRoot, "docs/operations/354_pharmacy_exception_taxonomy_and_queue_rules.md"),
  "utf8",
);
for (const exceptionClass of [
  "discovery_unavailable",
  "no_eligible_providers_returned",
  "dispatch_failed",
  "acknowledgement_missing",
  "outcome_unmatched",
  "no_outcome_within_configured_window",
  "conflicting_outcomes",
  "reachability_repair_required",
  "consent_revoked_after_dispatch",
  "dispatch_proof_stale",
]) {
  assert(
    operationsDoc.includes(exceptionClass),
    `354 operations doc must include ${exceptionClass}.`,
  );
}

const queueMatrixRows = readFileSync(
  resolve(repoRoot, "data/analysis/354_queue_membership_and_exception_matrix.csv"),
  "utf8",
)
  .trim()
  .split("\n")
  .slice(1);

assert(queueMatrixRows.length === 11, "354 queue matrix must publish eleven scenario rows.");

for (const exceptionClass of [
  "discovery_unavailable",
  "no_eligible_providers_returned",
  "dispatch_failed",
  "acknowledgement_missing",
  "outcome_unmatched",
  "no_outcome_within_configured_window",
  "conflicting_outcomes",
  "reachability_repair_required",
  "consent_revoked_after_dispatch",
  "dispatch_proof_stale",
]) {
  assert(
    queueMatrixRows.some((row) => row.includes(exceptionClass)),
    `354 queue matrix must include ${exceptionClass}.`,
  );
}

assert(
  queueMatrixRows.some((row) => row.includes(",true,true,false,false,false,")),
  "354 queue matrix must include a waiting-for-choice row without exceptions.",
);
assert(
  queueMatrixRows.some((row) => row.includes(",true,false,true,false,true,")),
  "354 queue matrix must include a waiting-outcome exception row.",
);
assert(
  queueMatrixRows.some((row) => row.includes(",true,false,false,true,true,")),
  "354 queue matrix must include a bounce-back exception row.",
);

const providerHealthRows = readFileSync(
  resolve(repoRoot, "data/analysis/354_provider_health_projection_matrix.csv"),
  "utf8",
)
  .trim()
  .split("\n")
  .slice(1);

assert(
  providerHealthRows.length === 6,
  "354 provider health matrix must publish six provider scenarios.",
);
for (const discoveryState of ["healthy", "degraded", "unavailable"]) {
  assert(
    providerHealthRows.some((row) => row.includes(`,${discoveryState},`)),
    `354 provider health matrix must include ${discoveryState}.`,
  );
}
for (const dispatchState of ["healthy", "degraded", "failing"]) {
  assert(
    providerHealthRows.some((row) => row.includes(`,${dispatchState},`)),
    `354 provider health matrix must include ${dispatchState}.`,
  );
}

const fixtures = JSON.parse(
  readFileSync(resolve(repoRoot, "data/fixtures/354_pharmacy_operations_examples.json"), "utf8"),
) as {
  operationsExamples: Array<{
    label: string;
    projectionFamilies: string[];
    exceptionClasses: string[];
  }>;
};

assert(
  fixtures.operationsExamples.length === 6,
  "354 fixtures must publish six canonical operations examples.",
);
for (const family of [
  "pharmacy_active_cases_projection",
  "pharmacy_waiting_for_choice_projection",
  "pharmacy_dispatched_waiting_outcome_projection",
  "pharmacy_bounce_back_projection",
  "pharmacy_dispatch_exception_projection",
  "pharmacy_provider_health_projection",
]) {
  assert(
    fixtures.operationsExamples.some((example) => example.projectionFamilies.includes(family)),
    `354 fixtures must include ${family}.`,
  );
}
for (const exceptionClass of [
  "discovery_unavailable",
  "no_eligible_providers_returned",
  "dispatch_failed",
  "acknowledgement_missing",
  "outcome_unmatched",
  "no_outcome_within_configured_window",
  "conflicting_outcomes",
  "reachability_repair_required",
  "consent_revoked_after_dispatch",
  "dispatch_proof_stale",
]) {
  assert(
    fixtures.operationsExamples.some((example) => example.exceptionClasses.includes(exceptionClass)),
    `354 fixtures must include ${exceptionClass}.`,
  );
}

const externalNotes = readFileSync(
  resolve(repoRoot, "data/analysis/354_external_reference_notes.md"),
  "utf8",
);

for (const url of [
  "https://digital.nhs.uk/developer/api-catalogue/directory-of-healthcare-services",
  "https://digital.nhs.uk/developer/api-catalogue/directory-of-services-search-api",
  "https://digital.nhs.uk/developer/api-catalogue/gp-connect-update-record",
  "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh",
  "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/mesh-guidance-hub/endpoint-lookup-service-and-workflowids",
  "https://www.england.nhs.uk/long-read/changes-to-the-gp-contract-in-2026-27/",
  "https://service-manual.nhs.uk/design-system/components/table",
  "https://service-manual.nhs.uk/design-system/components/summary-list",
  "https://service-manual.nhs.uk/design-system/patterns/interruption-page",
  "https://service-manual.nhs.uk/content/how-we-write",
]) {
  assert(externalNotes.includes(url), `354 external notes must cite ${url}.`);
}

const packageJson = readFileSync(resolve(repoRoot, "package.json"), "utf8");
assert(
  packageJson.includes('"validate:354-pharmacy-operations-projections"'),
  "package.json must expose validate:354-pharmacy-operations-projections.",
);

console.log("validate_354_pharmacy_operations_projections: ok");
