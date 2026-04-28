import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildCaptureOutcomeCommand,
  buildChooseProviderCommand,
  buildCloseCommand,
  buildCreatePharmacyCaseCommand,
  buildDispatchCommand,
  buildEvaluateCommand,
  buildReopenCommand,
  buildReserveAuthorityCommand,
  progressCaseToResolved,
  setupEvaluatedEligibleCase,
} from "../../tests/integration/346_pharmacy_case.helpers.ts";
import {
  createPhase6PharmacyCaseKernelService,
  createPhase6PharmacyCaseKernelStore,
} from "../../packages/domains/pharmacy/src/phase6-pharmacy-case-kernel.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(ROOT, "packages", "domains", "pharmacy", "src", "phase6-pharmacy-case-kernel.ts"),
  path.join(ROOT, "packages", "domains", "pharmacy", "src", "index.ts"),
  path.join(ROOT, "packages", "domains", "pharmacy", "tests", "phase6-pharmacy-case-kernel.test.ts"),
  path.join(ROOT, "docs", "architecture", "346_pharmacy_case_state_machine_and_lineage_linkage.md"),
  path.join(ROOT, "docs", "api", "346_pharmacy_case_kernel_api.md"),
  path.join(ROOT, "docs", "operations", "346_pharmacy_case_recovery_and_fencing_rules.md"),
  path.join(ROOT, "data", "analysis", "346_external_reference_notes.md"),
  path.join(ROOT, "data", "analysis", "346_pharmacy_case_transition_cases.csv"),
  path.join(ROOT, "data", "analysis", "346_pharmacy_case_stale_owner_cases.csv"),
  path.join(ROOT, "services", "command-api", "migrations", "154_phase6_pharmacy_case_kernel.sql"),
  path.join(ROOT, "tests", "integration", "346_pharmacy_case.helpers.ts"),
  path.join(ROOT, "tests", "integration", "346_pharmacy_case_lineage_and_authority.spec.ts"),
  path.join(ROOT, "tests", "integration", "346_pharmacy_case_reopen_close_and_replay.spec.ts"),
  path.join(ROOT, "tests", "property", "346_pharmacy_case_idempotency_and_stale_properties.spec.ts"),
  path.join(ROOT, "tools", "analysis", "validate_346_pharmacy_case_kernel.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:346-pharmacy-case-kernel": "pnpm exec tsx ./tools/analysis/validate_346_pharmacy_case_kernel.ts"';

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

function parseCsv(text: string) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/).filter(Boolean);
  requireCondition(Boolean(headerLine), "CSV_HEADER_MISSING");
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function validateChecklist() {
  const checklist = read(path.join(ROOT, "prompt", "checklist.md"));
  requireCondition(
    checklist.includes(
      "- [-] par_346_phase6_track_backend_build_pharmacy_case_state_machine_and_lineage_linkage",
    ) ||
      checklist.includes(
        "- [X] par_346_phase6_track_backend_build_pharmacy_case_state_machine_and_lineage_linkage",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_346",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:346-pharmacy-case-kernel",
  );
}

function validateKernelExports() {
  const kernel = read(
    path.join(ROOT, "packages", "domains", "pharmacy", "src", "phase6-pharmacy-case-kernel.ts"),
  );
  for (const requiredSymbol of [
    "createPhase6PharmacyCaseKernelStore",
    "createPhase6PharmacyCaseKernelService",
    "createPharmacyCase",
    "evaluatePharmacyCase",
    "choosePharmacyProvider",
    "dispatchPharmacyReferral",
    "capturePharmacyOutcome",
    "reopenPharmacyCase",
    "closePharmacyCase",
    "reserveMutationAuthority",
    "verifyMutationAuthority",
  ]) {
    requireCondition(kernel.includes(requiredSymbol), `KERNEL_EXPORT_OR_METHOD_MISSING:${requiredSymbol}`);
  }
}

function validateDocs() {
  const architecture = read(
    path.join(ROOT, "docs", "architecture", "346_pharmacy_case_state_machine_and_lineage_linkage.md"),
  );
  const apiDoc = read(path.join(ROOT, "docs", "api", "346_pharmacy_case_kernel_api.md"));
  const operations = read(
    path.join(ROOT, "docs", "operations", "346_pharmacy_case_recovery_and_fencing_rules.md"),
  );

  for (const keyword of [
    "LineageCaseLink",
    "RequestLifecycleLease",
    "ScopedMutationGate",
    "StaleOwnershipRecoveryRecord",
    "LifecycleCoordinator",
  ]) {
    requireCondition(architecture.includes(keyword), `ARCHITECTURE_KEYWORD_MISSING:${keyword}`);
  }
  for (const keyword of [
    "createPharmacyCase",
    "evaluatePharmacyCase",
    "choosePharmacyProvider",
    "dispatchPharmacyReferral",
    "capturePharmacyOutcome",
    "reopenPharmacyCase",
    "closePharmacyCase",
  ]) {
    requireCondition(apiDoc.includes(keyword), `API_KEYWORD_MISSING:${keyword}`);
  }
  for (const keyword of [
    "stale-owner recovery",
    "LineageFence",
    "RequestLifecycleLease",
    "close",
  ]) {
    requireCondition(
      operations.toLowerCase().includes(keyword.toLowerCase()),
      `OPERATIONS_KEYWORD_MISSING:${keyword}`,
    );
  }
}

function validateMigration() {
  const sql = read(
    path.join(ROOT, "services", "command-api", "migrations", "154_phase6_pharmacy_case_kernel.sql"),
  );
  for (const requiredTable of [
    "phase6_pharmacy_cases",
    "phase6_pharmacy_stale_ownership_recoveries",
    "phase6_pharmacy_case_transition_journal",
    "phase6_pharmacy_case_event_journal",
  ]) {
    requireCondition(sql.includes(requiredTable), `MIGRATION_TABLE_MISSING:${requiredTable}`);
  }
  requireCondition(sql.includes("idx_phase6_pharmacy_cases_lineage"), "MIGRATION_INDEX_MISSING:idx_phase6_pharmacy_cases_lineage");
}

function validateCsvArtifacts() {
  const transitionRows = parseCsv(
    read(path.join(ROOT, "data", "analysis", "346_pharmacy_case_transition_cases.csv")),
  );
  requireCondition(transitionRows.length >= 15, "TRANSITION_CASE_COUNT_DRIFT");
  for (const requiredCommand of [
    "create",
    "evaluate",
    "choose-provider",
    "dispatch",
    "capture-outcome",
    "reopen",
    "close",
  ]) {
    requireCondition(
      transitionRows.some((row) => row.command === requiredCommand),
      `TRANSITION_COMMAND_MISSING:${requiredCommand}`,
    );
  }

  const staleRows = parseCsv(
    read(path.join(ROOT, "data", "analysis", "346_pharmacy_case_stale_owner_cases.csv")),
  );
  requireCondition(staleRows.length >= 4, "STALE_CASE_COUNT_DRIFT");
  for (const staleDimension of ["lease", "ownership_epoch", "lineage_fence", "recovery_open"]) {
    requireCondition(
      staleRows.some((row) => row.stale_dimension === staleDimension),
      `STALE_DIMENSION_MISSING:${staleDimension}`,
    );
  }
}

async function validateRuntimeProof() {
  const resolvedFlow = await progressCaseToResolved("346_validator_close");
  const closed = await resolvedFlow.service.closePharmacyCase(
    buildCloseCommand(resolvedFlow.resolved.pharmacyCase, "346_validator_close"),
  );
  requireCondition(closed.pharmacyCase.status === "closed", "RUNTIME_CLOSE_FAILED");
  requireCondition(closed.lineageCaseLink.ownershipState === "closed", "RUNTIME_LINEAGE_CLOSE_FAILED");

  const staleService = createPhase6PharmacyCaseKernelService({
    repositories: createPhase6PharmacyCaseKernelStore(),
  });
  const created = await staleService.createPharmacyCase(
    buildCreatePharmacyCaseCommand("346_validator_stale"),
  );
  const evaluated = await staleService.evaluatePharmacyCase(
    buildEvaluateCommand(created.pharmacyCase, "346_validator_stale"),
  );
  await expectReject(
    staleService.choosePharmacyProvider(
      buildChooseProviderCommand(evaluated.pharmacyCase, "346_validator_stale", {
        expectedOwnershipEpoch: evaluated.pharmacyCase.ownershipEpoch + 1,
      }),
    ),
    "STALE_OWNERSHIP_EPOCH",
  );
  const staleBundle = await staleService.getPharmacyCase(evaluated.pharmacyCase.pharmacyCaseId);
  requireCondition(staleBundle?.staleOwnerRecovery?.recoveryState === "pending", "RUNTIME_STALE_RECOVERY_NOT_PENDING");
  const reserved = await staleService.reserveMutationAuthority(
    buildReserveAuthorityCommand(staleBundle!.pharmacyCase, "346_validator_stale"),
  );
  requireCondition(reserved.pharmacyCase.staleOwnerRecoveryRef === null, "RUNTIME_STALE_RECOVERY_NOT_CLEARED");

  const reopenFlow = await setupEvaluatedEligibleCase("346_validator_reopen");
  const chosen = await reopenFlow.service.choosePharmacyProvider(
    buildChooseProviderCommand(reopenFlow.evaluated.pharmacyCase, "346_validator_reopen"),
  );
  const dispatched = await reopenFlow.service.dispatchPharmacyReferral(
    buildDispatchCommand(chosen.pharmacyCase, "346_validator_reopen"),
  );
  const returned = await reopenFlow.service.capturePharmacyOutcome(
    buildCaptureOutcomeCommand(dispatched.pharmacyCase, "346_validator_reopen", {
      disposition: "unresolved_returned",
      bounceBackRef: {
        targetFamily: "PharmacyBounceBackRecord",
        refId: "bounce_back_346_validator_reopen",
        ownerTask:
          "seq_344_phase6_freeze_bounce_back_urgent_return_and_practice_visibility_contracts",
      },
    }),
  );
  const reopened = await reopenFlow.service.reopenPharmacyCase(
    buildReopenCommand(returned.pharmacyCase, "346_validator_reopen", {
      idempotencyKey: "validator_reopen",
    }),
  );
  requireCondition(reopened.pharmacyCase.status === "candidate_received", "RUNTIME_REOPEN_FAILED");
}

async function expectReject(promise: Promise<unknown>, expectedCode: string) {
  try {
    await promise;
  } catch (error) {
    requireCondition(
      typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === expectedCode,
      `EXPECTED_REJECTION_CODE_MISMATCH:${expectedCode}`,
    );
    return;
  }
  throw new Error(`EXPECTED_REJECTION_DID_NOT_OCCUR:${expectedCode}`);
}

async function main() {
  for (const filePath of REQUIRED_FILES) {
    read(filePath);
  }
  validateChecklist();
  validatePackageScript();
  validateKernelExports();
  validateDocs();
  validateMigration();
  validateCsvArtifacts();
  await validateRuntimeProof();
  console.log("346 pharmacy case kernel validation passed.");
}

await main();
