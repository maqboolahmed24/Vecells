import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createFallbackCallbackPath,
  progressClaimedHubCaseToBookedViaService,
  releaseAndCloseBookedCase,
  setupClaimedHubCase,
} from "../../tests/integration/315_hub_case.helpers.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(ROOT, "packages", "domains", "hub_coordination", "src", "phase5-hub-case-kernel.ts"),
  path.join(ROOT, "docs", "architecture", "315_hub_case_kernel_and_state_machine.md"),
  path.join(ROOT, "docs", "api", "315_network_booking_request_and_hub_case_api.md"),
  path.join(ROOT, "docs", "security", "315_hub_lineage_fence_and_close_blocker_rules.md"),
  path.join(ROOT, "data", "analysis", "315_external_reference_notes.md"),
  path.join(ROOT, "data", "analysis", "315_hub_case_transition_cases.csv"),
  path.join(ROOT, "data", "analysis", "315_hub_lineage_migration_fixture_catalog.csv"),
  path.join(ROOT, "services", "command-api", "migrations", "143_phase5_hub_case_kernel.sql"),
  path.join(ROOT, "tests", "integration", "315_hub_case_lineage_and_ownership.spec.ts"),
  path.join(ROOT, "tests", "integration", "315_hub_case_migration_catalog.spec.ts"),
  path.join(ROOT, "tests", "property", "315_hub_case_kernel_properties.spec.ts"),
  path.join(
    ROOT,
    "packages",
    "domains",
    "hub_coordination",
    "tests",
    "phase5-hub-case-kernel.test.ts",
  ),
];

const REQUIRED_SCRIPT =
  '"validate:315-hub-case-kernel": "pnpm exec tsx ./tools/analysis/validate_315_hub_case_kernel.ts"';

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath: string): string {
  requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
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
      "- [-] par_315_phase5_track_backend_build_network_coordination_case_state_machine_and_lineage_links",
    ) ||
      checklist.includes(
        "- [X] par_315_phase5_track_backend_build_network_coordination_case_state_machine_and_lineage_links",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_315",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(packageJson.includes(REQUIRED_SCRIPT), "PACKAGE_SCRIPT_MISSING:validate:315");
}

function validateMigration() {
  const sql = read(
    path.join(ROOT, "services", "command-api", "migrations", "143_phase5_hub_case_kernel.sql"),
  );
  for (const requiredTable of [
    "phase5_network_booking_requests",
    "phase5_hub_coordination_cases",
    "phase5_hub_case_transition_journal",
    "phase5_hub_event_journal",
  ]) {
    requireCondition(sql.includes(requiredTable), `MIGRATION_TABLE_MISSING:${requiredTable}`);
  }
  requireCondition(
    sql.includes("foundation lineage and command-settlement") ||
      sql.includes("foundation lineage and command-settlement"),
    "MIGRATION_DEPENDENCY_NOTE_MISSING",
  );
}

function validateTransitionCatalog() {
  const rows = parseCsv(read(path.join(ROOT, "data", "analysis", "315_hub_case_transition_cases.csv")));
  requireCondition(rows.length >= 20, "TRANSITION_CASE_COUNT_DRIFT");
  const commands = new Set(rows.map((row) => row.command_id));
  for (const commandId of [
    "validate_intake",
    "queue_hub_case",
    "claim_hub_case",
    "begin_candidate_search",
    "publish_candidates_ready",
    "enter_candidate_revalidating",
    "enter_native_booking_pending",
    "mark_confirmation_pending",
    "mark_booked_pending_practice_ack",
    "mark_booked",
    "mark_callback_offered",
    "mark_escalated_back",
    "close_hub_case",
  ]) {
    requireCondition(commands.has(commandId), `TRANSITION_CASE_MISSING:${commandId}`);
  }
}

function validateFixtureCatalog() {
  const rows = parseCsv(
    read(path.join(ROOT, "data", "analysis", "315_hub_lineage_migration_fixture_catalog.csv")),
  );
  requireCondition(rows.length >= 5, "FIXTURE_CATALOG_COUNT_DRIFT");
  const reasons = new Set(rows.map((row) => row.reason_for_hub_routing));
  requireCondition(reasons.has("callback_reentry"), "FIXTURE_REASON_MISSING:callback_reentry");
  requireCondition(reasons.has("supervisor_return"), "FIXTURE_REASON_MISSING:supervisor_return");
}

async function validateRuntimeProof() {
  const bookedFlow = await setupClaimedHubCase("315_validator_booked");
  const bookedPath = await progressClaimedHubCaseToBookedViaService(
    bookedFlow.service,
    bookedFlow.claimed,
    "315_validator_booked",
  );
  const bookedClosed = await releaseAndCloseBookedCase(
    bookedFlow.service,
    bookedPath.booked,
    "315_validator_booked",
  );
  requireCondition(bookedClosed.closed.hubCase.status === "closed", "RUNTIME_BOOKED_CLOSE_FAILED");
  requireCondition(
    bookedClosed.closed.lineageCaseLink.ownershipState === "closed",
    "RUNTIME_BOOKED_LINEAGE_CLOSE_FAILED",
  );

  const callbackPath = await createFallbackCallbackPath("315_validator_callback");
  requireCondition(
    callbackPath.callbackPending.hubCase.status === "callback_transfer_pending",
    "RUNTIME_CALLBACK_PENDING_FAILED",
  );
  requireCondition(
    callbackPath.closed.hubCase.status === "closed",
    "RUNTIME_CALLBACK_CLOSE_FAILED",
  );
}

async function main() {
  for (const filePath of REQUIRED_FILES) {
    read(filePath);
  }
  validateChecklist();
  validatePackageScript();
  validateMigration();
  validateTransitionCatalog();
  validateFixtureCatalog();
  await validateRuntimeProof();
  console.log("315 hub case kernel validation passed.");
}

await main();
