import fs from "node:fs";
import path from "node:path";

import {
  buildModelVendorKeyReferenceManifest,
  buildModelVendorProjectAndKeyContract,
  buildModelVendorProjectManifest,
  buildModelVendorRegistry,
  buildReadinessEvidence,
  detectPrimaryConfiguredVendorFromRepository,
  readAndValidateModelVendorSetup,
  renderProjectKeyReadinessMatrixCsv,
} from "../../scripts/assistive/425_model_vendor_project_setup_lib.ts";

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "scripts/assistive/425_model_vendor_project_setup_lib.ts",
  "ops/onboarding/425_model_vendor_project_and_key_runbook.md",
  "ops/onboarding/425_vendor_project_inventory_template.csv",
  "ops/onboarding/425_secret_reference_handling_rules.md",
  "data/config/425_model_vendor_registry.example.yaml",
  "data/config/425_model_vendor_project_manifest.example.json",
  "data/config/425_model_vendor_key_reference_manifest.example.json",
  "data/contracts/425_model_vendor_project_and_key_contract.json",
  "data/analysis/425_algorithm_alignment_notes.md",
  "data/analysis/425_external_reference_notes.md",
  "data/analysis/425_vendor_selection_notes.md",
  "data/analysis/425_project_key_readiness_matrix.csv",
  "tools/browser-automation/425_provision_model_vendor_projects_and_keys.spec.ts",
  "tools/browser-automation/425_verify_model_vendor_projects_and_keys.spec.ts",
  "tools/browser-automation/425_secret_redaction_helpers.ts",
  "tools/analysis/validate_425_model_vendor_project_setup.ts",
  "tests/integration/425_model_vendor_project_setup.spec.ts",
] as const;

const REQUIRED_SCRIPT =
  '"validate:425-model-vendor-project-setup": "pnpm exec tsx ./tools/analysis/validate_425_model_vendor_project_setup.ts"';

const RAW_SECRET_TOKENS = [
  "-----BEGIN PRIVATE KEY-----",
  "sk-live-",
  "sk-proj-",
  "Authorization: Bearer ey",
  "client_secret=real",
] as const;

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath: string): string {
  const filePath = path.join(ROOT, relativePath);
  invariant(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${relativePath}`);
  return fs.readFileSync(filePath, "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function readJsonYaml<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function checklistState(taskPrefix: string): string {
  const escaped = taskPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = read("prompt/checklist.md").match(
    new RegExp(`^- \\[([ Xx-])\\] ${escaped}`, "m"),
  );
  invariant(match, `CHECKLIST_ROW_MISSING:${taskPrefix}`);
  return match[1]!.toUpperCase();
}

function requireIncludes(source: string, token: string, label: string): void {
  invariant(source.includes(token), `${label} missing required token: ${token}`);
}

function main(): void {
  validateRequiredFiles();
  validateChecklist();
  validateGeneratedArtifacts();
  validatePackageScript();
  validateRepositoryDetection();
  validateDocsAndSpecs();
  validateNoRawSecretTokens();

  console.log("425 model vendor project setup validated.");
}

function validateRequiredFiles(): void {
  for (const relativePath of REQUIRED_FILES) {
    invariant(
      fs.existsSync(path.join(ROOT, relativePath)),
      `MISSING_REQUIRED_FILE:${relativePath}`,
    );
  }
}

function validateChecklist(): void {
  for (const dependency of [
    "par_420_phase8_track_Playwright_or_other_appropriate_tooling_frontend_build_confidence_rationale_and_provenance_visibility_components",
    "par_421_phase8_track_Playwright_or_other_appropriate_tooling_frontend_build_override_reason_capture_and_edited_by_clinician_trail",
    "par_422_phase8_track_Playwright_or_other_appropriate_tooling_frontend_build_shadow_degraded_quarantined_frozen_and_blocked_postures",
    "par_423_phase8_track_Playwright_or_other_appropriate_tooling_frontend_build_stale_session_freeze_and_regenerate_in_place_recovery",
    "par_424_phase8_track_Playwright_or_other_appropriate_tooling_frontend_build_same_shell_assistive_stage_integration_with_workspace",
  ]) {
    invariant(checklistState(dependency) === "X", `DEPENDENCY_INCOMPLETE:${dependency}`);
  }

  const taskState = checklistState(
    "par_425_phase8_use_Playwright_or_other_appropriate_tooling_browser_automation_to_provision_model_vendor_projects_and_api_keys",
  );
  invariant(["-", "X"].includes(taskState), "TASK_NOT_CLAIMED:par_425");
}

function validateGeneratedArtifacts(): void {
  invariant(
    JSON.stringify(readJsonYaml("data/config/425_model_vendor_registry.example.yaml")) ===
      JSON.stringify(buildModelVendorRegistry()),
    "MODEL_VENDOR_REGISTRY_DRIFT",
  );
  invariant(
    JSON.stringify(readJson("data/config/425_model_vendor_project_manifest.example.json")) ===
      JSON.stringify(buildModelVendorProjectManifest()),
    "MODEL_VENDOR_PROJECT_MANIFEST_DRIFT",
  );
  invariant(
    JSON.stringify(
      readJson("data/config/425_model_vendor_key_reference_manifest.example.json"),
    ) === JSON.stringify(buildModelVendorKeyReferenceManifest()),
    "MODEL_VENDOR_KEY_REFERENCE_MANIFEST_DRIFT",
  );
  invariant(
    JSON.stringify(readJson("data/contracts/425_model_vendor_project_and_key_contract.json")) ===
      JSON.stringify(buildModelVendorProjectAndKeyContract()),
    "MODEL_VENDOR_CONTRACT_DRIFT",
  );
  invariant(
    read("data/analysis/425_project_key_readiness_matrix.csv") ===
      renderProjectKeyReadinessMatrixCsv(),
    "MODEL_VENDOR_READINESS_MATRIX_DRIFT",
  );

  const setup = readAndValidateModelVendorSetup(ROOT);
  invariant(
    setup.validation.issues.length === 0,
    `MODEL_VENDOR_VALIDATION_FAILED:${JSON.stringify(setup.validation.issues)}`,
  );
  const readiness = buildReadinessEvidence(setup, "verify");
  invariant(
    readiness.decision === "ready_for_dry_run_rehearsal_verify",
    "MODEL_VENDOR_VERIFY_READINESS_BLOCKED",
  );
  invariant(
    readiness.projectRows.every((row) => row.applyAllowed === false),
    "MODEL_VENDOR_APPLY_NOT_BLOCKED",
  );
}

function validatePackageScript(): void {
  invariant(
    read("package.json").includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:425-model-vendor-project-setup",
  );
}

function validateRepositoryDetection(): void {
  const detection = detectPrimaryConfiguredVendorFromRepository(ROOT);
  invariant(
    detection.primaryProviderId === "vecells_assistive_vendor_watch_shadow_twin",
    "PRIMARY_PROVIDER_DETECTION_DRIFT",
  );
  invariant(
    detection.detectionState === "watch_only_local_twin",
    `PRIMARY_PROVIDER_DETECTION_NOT_WATCH_ONLY:${detection.detectionState}`,
  );
  invariant(detection.providerSignals.length === 0, "UNEXPECTED_LIVE_PROVIDER_SIGNAL");
}

function validateDocsAndSpecs(): void {
  const runbook = read("ops/onboarding/425_model_vendor_project_and_key_runbook.md");
  for (const token of [
    "vecells_assistive_vendor_watch_shadow_twin",
    "dry_run",
    "rehearsal",
    "verify",
    "apply",
    "LIVE_GATE_ASSISTIVE_INTENDED_USE_REVIEW",
    "masked fingerprint",
    "watch-only",
  ]) {
    requireIncludes(runbook, token, "425 runbook");
  }

  const inventory = read("ops/onboarding/425_vendor_project_inventory_template.csv");
  for (const token of [
    "provider_id",
    "managed_variable_name",
    "masked_fingerprint",
    "provider_not_selected_or_intended_use_review_missing",
  ]) {
    requireIncludes(inventory, token, "425 inventory template");
  }

  const secretRules = read("ops/onboarding/425_secret_reference_handling_rules.md");
  for (const token of [
    "raw API key",
    "secret://",
    "vault://",
    "_REF",
    "fp_sha256_",
    "apply",
  ]) {
    requireIncludes(secretRules, token, "425 secret rules");
  }

  const vendorSelection = read("data/analysis/425_vendor_selection_notes.md");
  for (const token of [
    "Primary configured provider",
    "replaceable_by_simulator",
    "No current baseline runtime config selects OpenAI",
    "CAPTURE_SEC_ASSISTIVE_PREPROD_VENDOR_KEY",
  ]) {
    requireIncludes(vendorSelection, token, "425 vendor selection notes");
  }

  const alignment = read("data/analysis/425_algorithm_alignment_notes.md");
  for (const token of [
    "AssistiveCapabilityTrustEnvelope",
    "AssistiveCapabilityRolloutVerdict",
    "masked fingerprints",
    "No new interface gap file is required",
  ]) {
    requireIncludes(alignment, token, "425 algorithm alignment notes");
  }

  const external = read("data/analysis/425_external_reference_notes.md");
  for (const token of [
    "https://developers.openai.com/api/reference/resources/organization/subresources/projects/subresources/api_keys/methods/list",
    "https://developers.openai.com/api/docs/guides/rbac",
    "https://developers.openai.com/api/reference/overview#authentication",
    "https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety",
    "https://playwright.dev/docs/browser-contexts",
    "https://playwright.dev/docs/trace-viewer",
    "https://playwright.dev/docs/screenshots",
    "blueprint/platform-runtime-and-release-blueprint.md#Security baseline contract",
  ]) {
    requireIncludes(external, token, "425 external reference notes");
  }

  const lib = read("scripts/assistive/425_model_vendor_project_setup_lib.ts");
  for (const token of [
    "detectPrimaryConfiguredVendorFromRepository",
    "resolvePrimaryConfiguredVendor",
    "stableFingerprintForSecretRef",
    "validateModelVendorSetupDocuments",
    "buildReadinessEvidence",
    "EXTERNAL_KEY_READY_WITHOUT_SELECTION",
    "PROJECT_APPLY_ENABLED",
  ]) {
    requireIncludes(lib, token, "425 setup library");
  }

  const provisionSpec = read(
    "tools/browser-automation/425_provision_model_vendor_projects_and_keys.spec.ts",
  );
  for (const token of [
    "chromium.launch",
    "browser.newContext",
    "detectPrimaryConfiguredVendorFromRepository",
    "assertSecretSafePage",
    "run-apply",
    "425-provision-readiness-summary.json",
  ]) {
    requireIncludes(provisionSpec, token, "425 provision browser spec");
  }

  const verifySpec = read(
    "tools/browser-automation/425_verify_model_vendor_projects_and_keys.spec.ts",
  );
  for (const token of [
    "browser.newContext",
    "assertSecretSafePage",
    "masked_fingerprints",
    "apply_blocked",
    "425-verify-readiness-summary.json",
  ]) {
    requireIncludes(verifySpec, token, "425 verify browser spec");
  }

  const integrationTest = read("tests/integration/425_model_vendor_project_setup.spec.ts");
  for (const token of [
    "watch_only_local_twin",
    "ready_for_dry_run_rehearsal_verify",
    "stableFingerprintForSecretRef",
    "EXTERNAL_KEY_READY_WITHOUT_SELECTION",
  ]) {
    requireIncludes(integrationTest, token, "425 integration tests");
  }
}

function validateNoRawSecretTokens(): void {
  const combined = REQUIRED_FILES.filter(
    (relativePath) => relativePath !== "tools/analysis/validate_425_model_vendor_project_setup.ts",
  )
    .map((relativePath) => read(relativePath))
    .join("\n");
  for (const token of RAW_SECRET_TOKENS) {
    invariant(!combined.includes(token), `RAW_SECRET_TOKEN_DETECTED:${token}`);
  }
}

main();
