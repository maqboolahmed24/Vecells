import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const repoRoot = resolve("/Users/test/Code/V");

const requiredFiles = [
  "packages/domains/pharmacy/src/phase6-pharmacy-console-engine.ts",
  "packages/domains/pharmacy/src/index.ts",
  "packages/domains/pharmacy/tests/public-api.test.ts",
  "packages/domains/pharmacy/tests/phase6-pharmacy-console-engine.test.ts",
  "tests/integration/355_pharmacy_console.helpers.ts",
  "tests/integration/355_console_summary_and_handoff.spec.ts",
  "tests/integration/355_inventory_fence_and_drift.spec.ts",
  "tests/integration/355_outcome_review_and_assurance.spec.ts",
  "tests/property/355_inventory_freshness_and_fence_properties.spec.ts",
  "services/command-api/migrations/163_phase6_pharmacy_console_support_region_and_inventory_truth.sql",
  "docs/architecture/355_pharmacy_console_backend_projection_contract.md",
  "docs/api/355_pharmacy_console_support_region_and_stock_truth_api.md",
  "docs/operations/355_inventory_freshness_fence_and_handoff_rules.md",
  "data/analysis/355_external_reference_notes.md",
  "data/analysis/355_projection_inventory_and_same_shell_matrix.csv",
  "data/analysis/355_inventory_fence_and_supply_computation_matrix.csv",
  "data/fixtures/355_pharmacy_console_projection_examples.json",
];

for (const relativePath of requiredFiles) {
  readFileSync(resolve(repoRoot, relativePath), "utf8");
}

const engineSource = readFileSync(
  resolve(repoRoot, "packages/domains/pharmacy/src/phase6-pharmacy-console-engine.ts"),
  "utf8",
);

for (const needle of [
  "export interface PharmacyConsoleSummaryProjectionBuilder",
  "export interface PharmacyConsoleWorklistProjectionBuilder",
  "export interface PharmacyCaseWorkbenchProjectionBuilder",
  "export interface MedicationValidationProjectionBuilder",
  "export interface InventoryTruthProjectionBuilder",
  "export interface InventoryComparisonProjectionBuilder",
  "export interface InventoryComparisonFenceService",
  "export interface SupplyComputationService",
  "export interface PharmacyHandoffProjectionBuilder",
  "export interface PharmacyActionSettlementProjectionBuilder",
  "export interface PharmacyConsoleContinuityEvidenceProjectionBuilder",
  "export interface PharmacyAssuranceProjectionBuilder",
  "export function createPhase6PharmacyConsoleStore()",
  "export function createPhase6PharmacyConsoleBackendService(",
  "async fetchConsoleSummaryProjection(pharmacyCaseId, input)",
  "async fetchConsoleWorklist(input)",
  "async fetchCaseWorkbenchProjection(pharmacyCaseId, input)",
  "async fetchMissionProjection(pharmacyCaseId, input)",
  "async fetchMedicationValidationProjection(pharmacyCaseId, input)",
  "async fetchInventoryTruthProjection(pharmacyCaseId, lineItemRef, input)",
  "async fetchInventoryComparisonProjection(pharmacyCaseId, lineItemRef, input)",
  "async createInventoryComparisonFence(command)",
  "async refreshInventoryComparisonFence(command)",
  "async invalidateInventoryComparisonFence(command)",
  "async fetchSupplyComputation(pharmacyCaseId, lineItemRef, candidateRef, input)",
  "async fetchHandoffProjection(pharmacyCaseId, input)",
  "async fetchHandoffWatchProjection(pharmacyCaseId, input)",
  "async fetchActionSettlementProjection(pharmacyCaseId, input)",
  "async fetchConsoleContinuityEvidenceProjection(pharmacyCaseId, input)",
  "async fetchAssuranceProjection(pharmacyCaseId, input)",
  "async fetchChoiceTruthProjection(pharmacyCaseId)",
  "async fetchDispatchTruthProjection(pharmacyCaseId)",
  "async fetchOutcomeTruthProjection(pharmacyCaseId)",
  "async fetchConsentCheckpointProjection(pharmacyCaseId)",
]) {
  assert(engineSource.includes(needle), `355 engine must include ${needle}.`);
}

for (const token of [
  "\"fresh\"",
  "\"aging\"",
  "\"stale\"",
  "\"unavailable\"",
  "\"INVENTORY_FRESHNESS_BLOCKED\"",
  "\"AVAILABILITY_DRIFT\"",
  "\"OUTCOME_REVIEW_OR_GATE_ACTIVE\"",
  "\"ACTION_SETTLEMENT_UNRESOLVED\"",
  "\"review_required\"",
  "\"not_ready\"",
  "\"verified\"",
]) {
  assert(engineSource.includes(token), `355 engine must include ${token}.`);
}

const indexSource = readFileSync(
  resolve(repoRoot, "packages/domains/pharmacy/src/index.ts"),
  "utf8",
);

for (const exportName of [
  "createPhase6PharmacyConsoleBackendService",
  "createPhase6PharmacyConsoleStore",
  "InventoryComparisonFenceSnapshot",
  "SupplyComputationSnapshot",
  "PharmacyConsoleSummaryProjectionSnapshot",
  "PharmacyConsoleWorklistProjectionSnapshot",
  "PharmacyCaseWorkbenchProjectionSnapshot",
  "MedicationValidationProjectionSnapshot",
  "InventoryTruthProjectionSnapshot",
  "InventoryComparisonProjectionSnapshot",
  "PharmacyHandoffProjectionSnapshot",
  "PharmacyHandoffWatchProjectionSnapshot",
  "PharmacyActionSettlementProjectionSnapshot",
  "PharmacyConsentCheckpointProjection",
  "PharmacyConsoleContinuityEvidenceProjectionSnapshot",
  "PharmacyAssuranceProjectionSnapshot",
]) {
  assert(indexSource.includes(exportName), `355 index must publish ${exportName}.`);
}

const publicApiTest = readFileSync(
  resolve(repoRoot, "packages/domains/pharmacy/tests/public-api.test.ts"),
  "utf8",
);

for (const apiName of [
  "createPhase6PharmacyConsoleStore",
  "createPhase6PharmacyConsoleBackendService",
]) {
  assert(publicApiTest.includes(apiName), `Public API test must include ${apiName}.`);
}

const migration = readFileSync(
  resolve(
    repoRoot,
    "services/command-api/migrations/163_phase6_pharmacy_console_support_region_and_inventory_truth.sql",
  ),
  "utf8",
);

for (const tableName of [
  "phase6_pharmacy_medication_line_state",
  "phase6_pharmacy_inventory_support_record",
  "phase6_inventory_comparison_fence",
  "phase6_supply_computation",
  "phase6_pharmacy_console_summary_projection",
  "phase6_pharmacy_console_worklist_projection",
  "phase6_pharmacy_case_workbench_projection",
  "phase6_pharmacy_mission_projection",
  "phase6_medication_validation_projection",
  "phase6_inventory_truth_projection",
  "phase6_inventory_comparison_projection",
  "phase6_pharmacy_handoff_projection",
  "phase6_pharmacy_handoff_watch_projection",
  "phase6_pharmacy_action_settlement_projection",
  "phase6_pharmacy_console_continuity_projection",
  "phase6_pharmacy_assurance_projection",
  "phase6_pharmacy_console_audit_event",
]) {
  assert(migration.includes(tableName), `355 migration must include ${tableName}.`);
}

const architectureDoc = readFileSync(
  resolve(repoRoot, "docs/architecture/355_pharmacy_console_backend_projection_contract.md"),
  "utf8",
);

for (const needle of [
  "PharmacyConsoleSummaryProjectionBuilder",
  "InventoryComparisonFence",
  "SupplyComputation",
  "PharmacyConsoleContinuityEvidenceProjection",
  "same-shell",
]) {
  assert(
    architectureDoc.includes(needle),
    `355 architecture doc must include ${needle}.`,
  );
}

const apiDoc = readFileSync(
  resolve(repoRoot, "docs/api/355_pharmacy_console_support_region_and_stock_truth_api.md"),
  "utf8",
);

for (const apiNeedle of [
  "fetchConsoleSummaryProjection",
  "fetchConsoleWorklist",
  "fetchCaseWorkbenchProjection",
  "fetchMissionProjection",
  "fetchMedicationValidationProjection",
  "fetchInventoryTruthProjection",
  "fetchInventoryComparisonProjection",
  "createInventoryComparisonFence",
  "refreshInventoryComparisonFence",
  "invalidateInventoryComparisonFence",
  "fetchSupplyComputation",
  "fetchHandoffProjection",
  "fetchHandoffWatchProjection",
  "fetchActionSettlementProjection",
  "fetchConsoleContinuityEvidenceProjection",
  "fetchAssuranceProjection",
]) {
  assert(apiDoc.includes(apiNeedle), `355 API doc must include ${apiNeedle}.`);
}

const operationsDoc = readFileSync(
  resolve(repoRoot, "docs/operations/355_inventory_freshness_fence_and_handoff_rules.md"),
  "utf8",
);

for (const docNeedle of [
  "freshnessRatio",
  "InventoryComparisonFence",
  "SupplyComputation",
  "handoff_ready",
  "ACTION_SETTLEMENT_UNRESOLVED",
]) {
  assert(
    operationsDoc.includes(docNeedle),
    `355 operations doc must include ${docNeedle}.`,
  );
}

const projectionRows = readFileSync(
  resolve(repoRoot, "data/analysis/355_projection_inventory_and_same_shell_matrix.csv"),
  "utf8",
)
  .trim()
  .split("\n")
  .slice(1);

assert(projectionRows.length === 16, "355 projection matrix must publish sixteen rows.");
for (const projectionFamily of [
  "PharmacyConsoleSummaryProjection",
  "PharmacyConsoleWorklistProjection",
  "PharmacyCaseWorkbenchProjection",
  "PharmacyMissionProjection",
  "MedicationValidationProjection",
  "InventoryTruthProjection",
  "InventoryComparisonProjection",
  "PharmacyHandoffProjection",
  "PharmacyHandoffWatchProjection",
  "PharmacyActionSettlementProjection",
  "PharmacyChoiceTruthProjection",
  "PharmacyDispatchTruthProjection",
  "PharmacyOutcomeTruthProjection",
  "PharmacyConsentCheckpointProjection",
  "PharmacyConsoleContinuityEvidenceProjection",
  "PharmacyAssuranceProjection",
]) {
  assert(
    projectionRows.some((row) => row.startsWith(`${projectionFamily},`)),
    `355 projection matrix must include ${projectionFamily}.`,
  );
}

const fenceRows = readFileSync(
  resolve(repoRoot, "data/analysis/355_inventory_fence_and_supply_computation_matrix.csv"),
  "utf8",
)
  .trim()
  .split("\n")
  .slice(1);

assert(fenceRows.length === 8, "355 fence matrix must publish eight scenario rows.");
for (const scenario of [
  "exact_fresh_review_required",
  "exact_fresh_verified_after_fence",
  "exact_aging_reviewable",
  "exact_stale_hard_stop",
  "exact_unavailable_fail_closed",
  "therapeutic_substitute_requires_fence",
  "partial_supply_requires_math",
  "availability_drift_invalidates_fence",
]) {
  assert(
    fenceRows.some((row) => row.startsWith(`${scenario},`)),
    `355 fence matrix must include ${scenario}.`,
  );
}

const fixtures = JSON.parse(
  readFileSync(
    resolve(repoRoot, "data/fixtures/355_pharmacy_console_projection_examples.json"),
    "utf8",
  ),
) as {
  consoleProjectionExamples: Array<{
    label: string;
    handoffReadinessState: string;
    assuranceState: string;
  }>;
};

assert(
  fixtures.consoleProjectionExamples.length === 5,
  "355 fixtures must publish five console examples.",
);
for (const label of [
  "package-ready-review-before-fence",
  "fenced-exact-candidate-ready-for-handoff",
  "stale-inventory-hard-stop",
  "fence-invalidated-after-availability-drift",
  "outcome-review-blocks-calm-handoff",
]) {
  assert(
    fixtures.consoleProjectionExamples.some((example) => example.label === label),
    `355 fixtures must include ${label}.`,
  );
}

const externalNotes = readFileSync(
  resolve(repoRoot, "data/analysis/355_external_reference_notes.md"),
  "utf8",
);

for (const url of [
  "https://www.sps.nhs.uk/articles/managing-expired-stock-and-decommissioned-products/",
  "https://www.gov.uk/government/publications/guidelines-for-standard-operating-procedures/guidelines-for-standard-operating-procedures",
  "https://www.gov.uk/government/publications/transporting-controlled-drugs-guidance-on-security-measures",
  "https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/",
  "https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-%20specification-nhs-pharmacy-first-service/",
  "https://service-manual.nhs.uk/design-system/patterns/interruption-page",
  "https://service-manual.nhs.uk/design-system/components/error-summary",
  "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html",
  "https://www.w3.org/WAI/WCAG22/Understanding/reflow",
]) {
  assert(
    externalNotes.includes(url),
    `355 external reference notes must cite ${url}.`,
  );
}

const packageJson = readFileSync(resolve(repoRoot, "package.json"), "utf8");
assert(
  packageJson.includes(
    "\"validate:355-console-backend-contract\": \"pnpm exec tsx ./tools/analysis/validate_355_console_backend_contract.ts\"",
  ),
  "package.json must publish validate:355-console-backend-contract.",
);

console.log("validate_355_console_backend_contract: ok");
