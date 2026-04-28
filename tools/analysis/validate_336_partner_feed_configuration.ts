import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  bootstrapPartnerFeeds,
  buildCapacityFeedConfigurationContract,
  buildPartnerFeedGapRegister,
  buildPartnerFeedPortalAutomationGap,
  renderPartnerCredentialManifestYaml,
  renderPartnerFeedRegistryYaml,
  renderPartnerSiteServiceMapCsv,
  resetPartnerFeeds,
} from "../../scripts/capacity/336_partner_feed_lib.ts";
import { runPartnerFeedVerification } from "../../scripts/capacity/336_verify_partner_feed_bindings.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const CHECKLIST = path.join(ROOT, "prompt", "checklist.md");

const REQUIRED_FILES = [
  "ops/capacity/336_partner_feed_registry.yaml",
  "ops/capacity/336_partner_credential_manifest.yaml",
  "ops/capacity/336_partner_site_service_map.csv",
  "docs/ops/336_network_capacity_feed_setup_runbook.md",
  "docs/security/336_partner_feed_secret_handling.md",
  "data/contracts/336_capacity_feed_configuration_contract.json",
  "data/analysis/336_algorithm_alignment_notes.md",
  "data/analysis/336_external_reference_notes.md",
  "data/analysis/336_partner_feed_gap_register.json",
  "data/analysis/PHASE5_BATCH_332_339_INTERFACE_GAP_PARTNER_FEED_PORTAL_AUTOMATION.json",
  "scripts/capacity/336_partner_feed_lib.ts",
  "scripts/capacity/336_bootstrap_partner_feeds.ts",
  "scripts/capacity/336_verify_partner_feed_bindings.ts",
  "scripts/capacity/336_reset_partner_nonprod_feeds.ts",
  "tests/playwright/336_partner_portal.helpers.ts",
  "tests/playwright/336_partner_portal_capacity_setup.spec.ts",
  "tests/playwright/336_partner_feed_verification.spec.ts",
  "tests/integration/336_capacity_feed_sample_ingest.spec.ts",
  "output/playwright/336-partner-capacity-setup.png",
  "output/playwright/336-partner-capacity-setup-trace.zip",
  "output/playwright/336-partner-feed-verification.png",
  "output/playwright/336-partner-feed-verification-trace.zip",
] as const;

const REQUIRED_SCRIPT =
  '"validate:336-partner-feed-configuration": "pnpm exec tsx ./tools/analysis/validate_336_partner_feed_configuration.ts"';

const FORBIDDEN_TRACKED_TOKENS = [
  "BEGIN PRIVATE KEY",
  "BEGIN CERTIFICATE",
  "plainpassword",
  "client_secret=",
  "bearer ey",
  "password=",
] as const;

const FORBIDDEN_OUTPUT_TOKENS = ["secret://", "vault://", "BEGIN CERTIFICATE"] as const;

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath: string): string {
  const filePath = path.join(ROOT, relativePath);
  requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${relativePath}`);
  return fs.readFileSync(filePath, "utf8");
}

function readJson(relativePath: string): any {
  return JSON.parse(read(relativePath));
}

function checklistState(taskPrefix: string): string {
  const match = read("prompt/checklist.md").match(
    new RegExp(`^- \\[([ Xx-])\\] ${taskPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m"),
  );
  requireCondition(match, `CHECKLIST_ROW_MISSING:${taskPrefix}`);
  return match[1]!.toUpperCase();
}

function validateChecklist(): void {
  requireCondition(
    checklistState(
      "seq_335_phase5_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_mesh_mailboxes_and_cross_org_message_routes",
    ) === "X",
    "DEPENDENCY_INCOMPLETE:seq_335",
  );
  const state = checklistState(
    "seq_336_phase5_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_network_capacity_feeds_and_partner_credentials",
  );
  requireCondition(["-", "X"].includes(state), "TASK_NOT_CLAIMED:seq_336");
}

function validateRequiredFiles(): void {
  for (const relativePath of REQUIRED_FILES) {
    requireCondition(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
  }
}

async function validateGeneratedArtifacts(): Promise<void> {
  requireCondition(
    read("ops/capacity/336_partner_feed_registry.yaml") ===
      (await renderPartnerFeedRegistryYaml()),
    "REGISTRY_YAML_DRIFT",
  );
  requireCondition(
    read("ops/capacity/336_partner_credential_manifest.yaml") ===
      (await renderPartnerCredentialManifestYaml()),
    "CREDENTIAL_MANIFEST_YAML_DRIFT",
  );
  requireCondition(
    read("ops/capacity/336_partner_site_service_map.csv") ===
      (await renderPartnerSiteServiceMapCsv()),
    "SITE_SERVICE_MAP_CSV_DRIFT",
  );
  requireCondition(
    JSON.stringify(readJson("data/contracts/336_capacity_feed_configuration_contract.json")) ===
      JSON.stringify(await buildCapacityFeedConfigurationContract()),
    "CAPACITY_CONTRACT_DRIFT",
  );
  requireCondition(
    JSON.stringify(readJson("data/analysis/336_partner_feed_gap_register.json")) ===
      JSON.stringify(await buildPartnerFeedGapRegister()),
    "GAP_REGISTER_DRIFT",
  );
  requireCondition(
    JSON.stringify(
      readJson("data/analysis/PHASE5_BATCH_332_339_INTERFACE_GAP_PARTNER_FEED_PORTAL_AUTOMATION.json"),
    ) === JSON.stringify(await buildPartnerFeedPortalAutomationGap()),
    "INTERFACE_GAP_DRIFT",
  );
}

function validatePackageScript(): void {
  requireCondition(read("package.json").includes(REQUIRED_SCRIPT), "PACKAGE_SCRIPT_MISSING:validate:336-partner-feed-configuration");
}

function validateDocsAndNotes(): void {
  const runbook = read("docs/ops/336_network_capacity_feed_setup_runbook.md");
  const security = read("docs/security/336_partner_feed_secret_handling.md");
  const alignment = read("data/analysis/336_algorithm_alignment_notes.md");
  const external = read("data/analysis/336_external_reference_notes.md");
  const setupSpec = read("tests/playwright/336_partner_portal_capacity_setup.spec.ts");
  const verifySpec = read("tests/playwright/336_partner_feed_verification.spec.ts");
  const integration = read("tests/integration/336_capacity_feed_sample_ingest.spec.ts");

  for (const token of [
    "336_bootstrap_partner_feeds.ts",
    "336_verify_partner_feed_bindings.ts",
    "336_reset_partner_nonprod_feeds.ts",
    "manual bridge",
    "rollback",
  ]) {
    requireCondition(runbook.includes(token), `RUNBOOK_TOKEN_MISSING:${token}`);
  }
  for (const token of ["secret://", "vault://", "playwright/.auth", "masked fingerprints", "least privilege"]) {
    requireCondition(security.includes(token), `SECURITY_TOKEN_MISSING:${token}`);
  }
  for (const token of [
    "NetworkSlotCandidate",
    "HubCapacityAdapterBindingSnapshot",
    "CapacityRankProof",
    "quarantined_hidden",
    "degraded",
  ]) {
    requireCondition(alignment.includes(token), `ALIGNMENT_TOKEN_MISSING:${token}`);
  }
  for (const token of [
    "GP Connect: Appointment Management - FHIR API",
    "Testing APIs",
    "Foundations FHIR",
    "Digital clinical safety assurance",
    "Best Practices",
    "Authentication",
    "Isolation",
  ]) {
    requireCondition(external.includes(token), `EXTERNAL_NOTE_TOKEN_MISSING:${token}`);
  }
  for (const token of ["manual_bridge_required", "unsupported", "sha256:"]) {
    requireCondition(setupSpec.includes(token), `SETUP_SPEC_TOKEN_MISSING:${token}`);
  }
  for (const token of ["trusted_admitted", "quarantined_excluded", "unsupported_feed_declared"]) {
    requireCondition(verifySpec.includes(token), `VERIFY_SPEC_TOKEN_MISSING:${token}`);
  }
  for (const token of ["trusted_admitted", "quarantined_excluded", "adapter:"]) {
    requireCondition(integration.includes(token), `INTEGRATION_TOKEN_MISSING:${token}`);
  }
}

function scanTrackedFiles(): void {
  for (const relativePath of [
    "ops/capacity/336_partner_feed_registry.yaml",
    "ops/capacity/336_partner_credential_manifest.yaml",
    "docs/security/336_partner_feed_secret_handling.md",
    "data/contracts/336_capacity_feed_configuration_contract.json",
    "data/analysis/336_partner_feed_gap_register.json",
    "tests/playwright/336_partner_portal.helpers.ts",
  ]) {
    const contents = read(relativePath).toLowerCase();
    for (const forbidden of FORBIDDEN_TRACKED_TOKENS) {
      requireCondition(
        !contents.includes(forbidden.toLowerCase()),
        `TRACKED_SECRET_LEAK:${relativePath}:${forbidden}`,
      );
    }
  }
}

function scanOutputArtifacts(): void {
  for (const relativePath of [
    "output/playwright/336-partner-capacity-setup.png",
    "output/playwright/336-partner-capacity-setup-trace.zip",
    "output/playwright/336-partner-feed-verification.png",
    "output/playwright/336-partner-feed-verification-trace.zip",
  ]) {
    const text = fs.readFileSync(path.join(ROOT, relativePath)).toString("utf8").toLowerCase();
    for (const forbidden of FORBIDDEN_OUTPUT_TOKENS) {
      requireCondition(
        !text.includes(forbidden.toLowerCase()),
        `OUTPUT_SECRET_LEAK:${relativePath}:${forbidden}`,
      );
    }
  }
}

async function validateRuntimeProof(): Promise<void> {
  const outputDir = path.join(ROOT, ".artifacts", "capacity", "336-validator");
  await resetPartnerFeeds({ outputDir });
  const first = await bootstrapPartnerFeeds({ outputDir });
  requireCondition(
    first.actions.some((entry) => entry.action === "configured"),
    "RUNTIME_BOOTSTRAP_CONFIGURED_ACTION_MISSING",
  );
  const second = await bootstrapPartnerFeeds({ outputDir });
  requireCondition(
    second.actions.some((entry) => entry.action === "already_current"),
    "RUNTIME_BOOTSTRAP_IDEMPOTENCY_MISSING",
  );
  const summary = await runPartnerFeedVerification(outputDir);
  requireCondition(summary.snapshotId !== null, "RUNTIME_SNAPSHOT_ID_MISSING");
  requireCondition(
    summary.feedChecks.some(
      (entry) =>
        entry.feedId === "feed_336_batch_import_local_twin" &&
        entry.decisionClasses.includes("quarantined_excluded"),
    ),
    "RUNTIME_QUARANTINED_FEED_CHECK_MISSING",
  );
  requireCondition(
    summary.feedChecks.some(
      (entry) =>
        entry.feedId === "feed_336_optum_supported_test" &&
        entry.decisionClasses.includes("manual_bridge_required"),
    ),
    "RUNTIME_MANUAL_BRIDGE_FEED_CHECK_MISSING",
  );
}

async function main() {
  validateChecklist();
  validateRequiredFiles();
  validatePackageScript();
  await validateGeneratedArtifacts();
  validateDocsAndNotes();
  scanTrackedFiles();
  scanOutputArtifacts();
  await validateRuntimeProof();
  console.log("336 partner feed configuration validation passed.");
}

await main();
