import fs from "node:fs";
import path from "node:path";

import {
  buildProviderCallbackManifest,
  buildProviderSandboxRegistry,
  renderProviderCallbackManifestYaml,
  renderProviderEnvironmentMatrixCsv,
  renderProviderSandboxRegistryYaml,
} from "../../scripts/providers/304_provider_sandbox_lib.ts";

const ROOT = path.resolve(process.cwd());
const CHECKLIST = path.join(ROOT, "prompt", "checklist.md");

const REQUIRED_FILES = [
  "ops/providers/304_provider_sandbox_registry.yaml",
  "ops/providers/304_provider_callback_manifest.yaml",
  "ops/providers/304_provider_environment_matrix.csv",
  "docs/ops/304_booking_provider_sandbox_runbook.md",
  "docs/ops/304_booking_callback_endpoint_runbook.md",
  "data/contracts/304_provider_sandbox_contract.json",
  "data/analysis/304_algorithm_alignment_notes.md",
  "data/analysis/304_provider_setup_gap_register.json",
  "data/analysis/PHASE4_INTERFACE_GAP_PROVIDER_SANDBOX_PORTAL_AUTOMATION.json",
  "scripts/providers/304_provider_sandbox_lib.ts",
  "scripts/providers/304_bootstrap_provider_sandboxes.ts",
  "scripts/providers/304_verify_provider_callbacks.ts",
  "scripts/providers/304_reset_provider_sandboxes.ts",
  "tests/playwright/304_provider_sandbox.helpers.ts",
  "tests/playwright/304_provider_sandbox_portal_setup.spec.ts",
  "tests/playwright/304_provider_callback_registration.spec.ts",
  "tests/integration/304_provider_callback_verification.spec.ts",
  "output/playwright/304-provider-sandbox-portal-setup-trace.zip",
  "output/playwright/304-provider-callback-registration-trace.zip",
] as const;

const FORBIDDEN_TRACKED_TOKENS = [
  "BEGIN PRIVATE KEY",
  "BEGIN CERTIFICATE",
  "api_key=",
  "client_secret=",
  "plainpassword",
  "consolepassword",
  "bearer ey",
] as const;

const FORBIDDEN_OUTPUT_TOKENS = ["secret://", "vault://", "env://"] as const;

function fail(message: string): never {
  throw new Error(`[304-provider-sandbox-setup] ${message}`);
}

function relative(target: string): string {
  return path.relative(ROOT, target);
}

function read(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    fail(`missing required file ${relative(filePath)}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath: string): any {
  return JSON.parse(read(filePath));
}

function checklistState(taskPrefix: string): string {
  const pattern = new RegExp(`^- \\[([ Xx-])\\] ${taskPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m");
  const match = read(CHECKLIST).match(pattern);
  if (!match) {
    fail(`checklist row missing for ${taskPrefix}`);
  }
  return match[1]!.toUpperCase();
}

function validateChecklist(): void {
  if (checklistState("par_303_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_accessibility_and_artifact_parity_for_booking_documents") !== "X") {
    fail("par_303 must be complete before seq_304");
  }
  const taskState = checklistState(
    "seq_304_phase4_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_booking_provider_sandboxes_and_callback_endpoints",
  );
  if (!["-", "X"].includes(taskState)) {
    fail("seq_304 must be claimed or complete");
  }
}

function validateRequiredFiles(): void {
  for (const relativePath of REQUIRED_FILES) {
    const absolutePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(absolutePath)) {
      fail(`missing required artifact ${relativePath}`);
    }
  }
}

async function validateGeneratedArtifacts(): Promise<void> {
  const registryPath = path.join(ROOT, "ops/providers/304_provider_sandbox_registry.yaml");
  const callbackPath = path.join(ROOT, "ops/providers/304_provider_callback_manifest.yaml");
  const matrixPath = path.join(ROOT, "ops/providers/304_provider_environment_matrix.csv");

  if (read(registryPath) !== (await renderProviderSandboxRegistryYaml())) {
    fail("provider sandbox registry YAML drifted from helper output");
  }
  if (read(callbackPath) !== (await renderProviderCallbackManifestYaml())) {
    fail("provider callback manifest YAML drifted from helper output");
  }
  if (read(matrixPath) !== (await renderProviderEnvironmentMatrixCsv())) {
    fail("provider environment matrix CSV drifted from helper output");
  }
}

async function validateContractAndGaps(): Promise<void> {
  const contract = readJson(path.join(ROOT, "data/contracts/304_provider_sandbox_contract.json"));
  const registry = await buildProviderSandboxRegistry();
  const manifest = await buildProviderCallbackManifest();
  const gapRegister = readJson(path.join(ROOT, "data/analysis/304_provider_setup_gap_register.json"));
  const interfaceGap = readJson(
    path.join(ROOT, "data/analysis/PHASE4_INTERFACE_GAP_PROVIDER_SANDBOX_PORTAL_AUTOMATION.json"),
  );

  if (contract.taskId !== "seq_304_phase4_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_booking_provider_sandboxes_and_callback_endpoints") {
    fail("contract taskId drifted");
  }
  if (contract.schemaVersion !== "304.phase4.provider-sandbox.v1") {
    fail("contract schemaVersion drifted");
  }
  if (
    JSON.stringify(contract.supportedProviderCapabilityMatrixRefs) !==
    JSON.stringify(
      [...new Set(registry.sandboxes.map((sandbox) => sandbox.providerCapabilityMatrixRef))],
    )
  ) {
    fail("contract supportedProviderCapabilityMatrixRefs drifted from the registry");
  }
  if (manifest.callbacks.length !== 7) {
    fail("callback manifest must contain seven rows");
  }
  if (!Array.isArray(gapRegister.gaps) || gapRegister.gaps.length !== 4) {
    fail("gap register must contain four manual-bridge gaps");
  }
  if (interfaceGap.gapId !== "PHASE4_INTERFACE_GAP_PROVIDER_SANDBOX_PORTAL_AUTOMATION") {
    fail("interface gap id drifted");
  }
  if (!Array.isArray(interfaceGap.affectedSandboxIds) || interfaceGap.affectedSandboxIds.length !== 4) {
    fail("interface gap must list the four manual-bridge sandboxes");
  }
}

function validateDocsAndTests(): void {
  const runbook = read(path.join(ROOT, "docs/ops/304_booking_provider_sandbox_runbook.md"));
  const callbackRunbook = read(path.join(ROOT, "docs/ops/304_booking_callback_endpoint_runbook.md"));
  const alignment = read(path.join(ROOT, "data/analysis/304_algorithm_alignment_notes.md"));
  const helper = read(path.join(ROOT, "tests/playwright/304_provider_sandbox.helpers.ts"));
  const setupSpec = read(path.join(ROOT, "tests/playwright/304_provider_sandbox_portal_setup.spec.ts"));
  const callbackSpec = read(path.join(ROOT, "tests/playwright/304_provider_callback_registration.spec.ts"));
  const integrationSpec = read(path.join(ROOT, "tests/integration/304_provider_callback_verification.spec.ts"));

  for (const token of [
    "manual bridge",
    "providerAdapterBindingHash",
    "node --experimental-strip-types /Users/test/Code/V/scripts/providers/304_bootstrap_provider_sandboxes.ts",
  ]) {
    if (!runbook.includes(token)) {
      fail(`provider sandbox runbook missing token ${token}`);
    }
  }
  for (const token of ["accepted_new", "semantic_replay", "stale_ignored", "Verify all callback rows"]) {
    if (!callbackRunbook.includes(token) && !callbackSpec.includes(token)) {
      fail(`callback documentation or spec missing token ${token}`);
    }
  }
  for (const token of [
    "Interface Mechanism 1 API standards",
    "GP Connect: Appointment Management - FHIR API",
    "FHIR R4 Appointment",
  ]) {
    if (!alignment.includes(token)) {
      fail(`alignment notes missing reference ${token}`);
    }
  }
  for (const token of [
    "provider-portal-login",
    "sandbox-bootstrap-sandbox_304_vecells_local_gateway_local_twin",
    "callback-verify-all",
  ]) {
    if (!helper.includes(token) && !setupSpec.includes(token) && !callbackSpec.includes(token)) {
      fail(`playwright harness or specs missing token ${token}`);
    }
  }
  for (const token of ["accepted_new", "semantic_replay", "stale_ignored"]) {
    if (!integrationSpec.includes(token)) {
      fail(`integration spec missing decision class ${token}`);
    }
  }
}

function scanTrackedFiles(): void {
  for (const relativePath of [
    "ops/providers/304_provider_sandbox_registry.yaml",
    "ops/providers/304_provider_callback_manifest.yaml",
    "docs/ops/304_booking_provider_sandbox_runbook.md",
    "docs/ops/304_booking_callback_endpoint_runbook.md",
    "data/contracts/304_provider_sandbox_contract.json",
    "data/analysis/304_algorithm_alignment_notes.md",
    "data/analysis/304_provider_setup_gap_register.json",
    "tests/playwright/304_provider_sandbox.helpers.ts",
  ]) {
    const contents = read(path.join(ROOT, relativePath)).toLowerCase();
    for (const forbidden of FORBIDDEN_TRACKED_TOKENS) {
      if (contents.includes(forbidden.toLowerCase())) {
        fail(`${relativePath} contains forbidden raw secret token ${forbidden}`);
      }
    }
  }
}

function scanOutputArtifacts(): void {
  for (const relativePath of [
    "output/playwright/304-provider-sandbox-portal-setup-trace.zip",
    "output/playwright/304-provider-callback-registration-trace.zip",
    "output/playwright/304-provider-sandbox-portal-setup.png",
    "output/playwright/304-provider-callback-registration.png",
  ]) {
    const absolutePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(absolutePath)) {
      fail(`missing expected output artifact ${relativePath}`);
    }
    const bytes = fs.readFileSync(absolutePath);
    const text = bytes.toString("utf8").toLowerCase();
    for (const forbidden of FORBIDDEN_OUTPUT_TOKENS) {
      if (text.includes(forbidden.toLowerCase())) {
        fail(`${relativePath} leaked a secret reference token ${forbidden}`);
      }
    }
  }
}

async function main(): Promise<void> {
  validateChecklist();
  validateRequiredFiles();
  await validateGeneratedArtifacts();
  await validateContractAndGaps();
  validateDocsAndTests();
  scanTrackedFiles();
  scanOutputArtifacts();
  console.log("304 provider sandbox setup validation passed");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
