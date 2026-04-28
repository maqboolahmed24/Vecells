import fs from "node:fs";
import path from "node:path";

import {
  buildModelAuditAndSafetyContract,
  buildModelAuditAndSafetyReadinessEvidence,
  buildModelAuditBaseline,
  buildModelSafetyBaseline,
  readAndValidateModelAuditAndSafetySetup,
  renderAuditAndSafetyReadinessMatrixCsv,
  renderVendorControlMappingMatrixCsv,
} from "../../scripts/assistive/426_model_audit_and_safety_lib.ts";

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "scripts/assistive/426_model_audit_and_safety_lib.ts",
  "ops/onboarding/426_model_audit_and_safety_runbook.md",
  "ops/onboarding/426_audit_export_and_retention_notes.md",
  "data/config/426_model_audit_baseline.example.json",
  "data/config/426_model_safety_baseline.example.json",
  "data/contracts/426_model_audit_and_safety_contract.json",
  "data/analysis/426_algorithm_alignment_notes.md",
  "data/analysis/426_external_reference_notes.md",
  "data/analysis/426_vendor_control_mapping_matrix.csv",
  "data/analysis/426_audit_and_safety_readiness_matrix.csv",
  "tools/browser-automation/426_configure_model_audit_and_safety.spec.ts",
  "tools/browser-automation/426_verify_model_audit_and_safety.spec.ts",
  "tools/browser-automation/426_secret_redaction_helpers.ts",
  "tools/analysis/validate_426_model_audit_and_safety.ts",
  "tests/integration/426_model_audit_and_safety.spec.ts",
] as const;

const REQUIRED_SCRIPT =
  '"validate:426-model-audit-and-safety": "pnpm exec tsx ./tools/analysis/validate_426_model_audit_and_safety.ts"';

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
  validateDocsAndSpecs();
  validateNoRawSecretTokens();

  console.log("426 model audit and safety validated.");
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
    "par_425_phase8_use_Playwright_or_other_appropriate_tooling_browser_automation_to_provision_model_vendor_projects_and_api_keys",
  ]) {
    invariant(checklistState(dependency) === "X", `DEPENDENCY_INCOMPLETE:${dependency}`);
  }

  const taskState = checklistState(
    "par_426_phase8_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_model_audit_logs_and_safety_settings",
  );
  invariant(["-", "X"].includes(taskState), "TASK_NOT_CLAIMED:par_426");
}

function validateGeneratedArtifacts(): void {
  invariant(
    JSON.stringify(readJson("data/config/426_model_audit_baseline.example.json")) ===
      JSON.stringify(buildModelAuditBaseline()),
    "MODEL_AUDIT_BASELINE_DRIFT",
  );
  invariant(
    JSON.stringify(readJson("data/config/426_model_safety_baseline.example.json")) ===
      JSON.stringify(buildModelSafetyBaseline()),
    "MODEL_SAFETY_BASELINE_DRIFT",
  );
  invariant(
    JSON.stringify(readJson("data/contracts/426_model_audit_and_safety_contract.json")) ===
      JSON.stringify(buildModelAuditAndSafetyContract()),
    "MODEL_AUDIT_SAFETY_CONTRACT_DRIFT",
  );
  const generatedSetup = {
    auditBaseline: buildModelAuditBaseline(),
    safetyBaseline: buildModelSafetyBaseline(),
    contract: buildModelAuditAndSafetyContract(),
  };
  invariant(
    read("data/analysis/426_vendor_control_mapping_matrix.csv") ===
      renderVendorControlMappingMatrixCsv(generatedSetup),
    "MODEL_AUDIT_SAFETY_MAPPING_MATRIX_DRIFT",
  );
  invariant(
    read("data/analysis/426_audit_and_safety_readiness_matrix.csv") ===
      renderAuditAndSafetyReadinessMatrixCsv(generatedSetup),
    "MODEL_AUDIT_SAFETY_READINESS_MATRIX_DRIFT",
  );

  const setup = readAndValidateModelAuditAndSafetySetup(ROOT);
  invariant(
    setup.validation.issues.length === 0,
    `MODEL_AUDIT_SAFETY_VALIDATION_FAILED:${JSON.stringify(setup.validation.issues)}`,
  );
  const verifyEvidence = buildModelAuditAndSafetyReadinessEvidence(setup, "verify");
  invariant(
    verifyEvidence.decision === "ready_for_dry_run_rehearsal_verify",
    "MODEL_AUDIT_SAFETY_VERIFY_READINESS_BLOCKED",
  );
  const applyEvidence = buildModelAuditAndSafetyReadinessEvidence(setup, "apply");
  invariant(applyEvidence.decision === "blocked_for_apply", "MODEL_AUDIT_SAFETY_APPLY_NOT_BLOCKED");
  invariant(
    verifyEvidence.auditRows
      .filter((row) => row.providerId === verifyEvidence.primaryProviderId)
      .every((row) => row.status === "verified"),
    "PRIMARY_AUDIT_ROWS_NOT_VERIFIED",
  );
  invariant(
    verifyEvidence.safetyRows
      .filter((row) => row.providerId === verifyEvidence.primaryProviderId)
      .every((row) => row.status === "verified"),
    "PRIMARY_SAFETY_ROWS_NOT_VERIFIED",
  );
}

function validatePackageScript(): void {
  invariant(
    read("package.json").includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:426-model-audit-and-safety",
  );
}

function validateDocsAndSpecs(): void {
  const runbook = read("ops/onboarding/426_model_audit_and_safety_runbook.md");
  for (const token of [
    "vecells_assistive_vendor_watch_shadow_twin",
    "dry_run",
    "rehearsal",
    "verify",
    "apply",
    "LIVE_GATE_ASSISTIVE_INTENDED_USE_REVIEW",
    "unsupported-control records",
  ]) {
    requireIncludes(runbook, token, "426 runbook");
  }

  const retention = read("ops/onboarding/426_audit_export_and_retention_notes.md");
  for (const token of [
    "30 days",
    "90 days",
    "metadata_only_redacted_no_prompts_responses",
    "blocked_pending_provider_selection",
    "production",
  ]) {
    requireIncludes(retention, token, "426 retention notes");
  }

  const alignment = read("data/analysis/426_algorithm_alignment_notes.md");
  for (const token of [
    "AssistiveCapabilityWatchTuple",
    "AssistiveReleaseCandidate",
    "AssuranceBaselineSnapshot",
    "RFCBundle",
    "UITelemetryDisclosureFence",
    "RollbackReadinessBundle",
    "No new `PHASE8_BATCH_420_427_INTERFACE_GAP_MODEL_AUDIT_AND_SAFETY_CONFIGURATION.json` is required",
  ]) {
    requireIncludes(alignment, token, "426 algorithm alignment notes");
  }

  const external = read("data/analysis/426_external_reference_notes.md");
  for (const token of [
    "https://platform.openai.com/docs/api-reference/audit-logs?lang=go",
    "https://platform.openai.com/docs/guides/rbac",
    "https://platform.openai.com/docs/models/how-we-use-your-data",
    "https://platform.openai.com/docs/api-reference/moderations?lang=python",
    "https://platform.openai.com/docs/safety-best-practices/understanding-safety-risks",
    "https://playwright.dev/docs/browser-contexts",
    "https://playwright.dev/docs/trace-viewer",
    "https://playwright.dev/docs/screenshots",
  ]) {
    requireIncludes(external, token, "426 external reference notes");
  }

  const lib = read("scripts/assistive/426_model_audit_and_safety_lib.ts");
  for (const token of [
    "validateModelAuditAndSafetySetupDocuments",
    "buildModelAuditAndSafetyReadinessEvidence",
    "CURRENT_BASELINE_REQUIRED_CONTROL_UNSUPPORTED",
    "EXTERNAL_AUDIT_CONFIGURED_WITHOUT_PROVIDER_SELECTION",
    "EXTERNAL_SAFETY_CONFIGURED_WITHOUT_PROVIDER_SELECTION",
    "metadata_only_redacted_no_prompts_responses",
  ]) {
    requireIncludes(lib, token, "426 library");
  }

  const configureSpec = read(
    "tools/browser-automation/426_configure_model_audit_and_safety.spec.ts",
  );
  for (const token of [
    "chromium.launch",
    "browser.newContext",
    "ENVIRONMENT_BROWSER_PROFILES",
    "assertSecretSafePage",
    "run-apply",
    "426-configure-readiness-summary.json",
  ]) {
    requireIncludes(configureSpec, token, "426 configure browser spec");
  }

  const verifySpec = read(
    "tools/browser-automation/426_verify_model_audit_and_safety.spec.ts",
  );
  for (const token of [
    "browser.newContext",
    "audit_logging",
    "event_export",
    "retention",
    "model_allow_list",
    "safety_guardrails",
    "unsupported_controls",
    "apply_blocked",
    "426-verify-readiness-summary.json",
  ]) {
    requireIncludes(verifySpec, token, "426 verify browser spec");
  }

  const integrationTest = read("tests/integration/426_model_audit_and_safety.spec.ts");
  for (const token of [
    "ready_for_dry_run_rehearsal_verify",
    "blocked_for_apply",
    "EXTERNAL_AUDIT_CONFIGURED_WITHOUT_PROVIDER_SELECTION",
    "SAFETY_ALLOW_LIST_TOO_BROAD",
    "RAW_PAYLOAD_FIELD_DETECTED",
  ]) {
    requireIncludes(integrationTest, token, "426 integration tests");
  }
}

function validateNoRawSecretTokens(): void {
  const combined = REQUIRED_FILES.filter(
    (relativePath) => relativePath !== "tools/analysis/validate_426_model_audit_and_safety.ts",
  )
    .map((relativePath) => read(relativePath))
    .join("\n");
  for (const token of RAW_SECRET_TOKENS) {
    invariant(!combined.includes(token), `RAW_SECRET_TOKEN_DETECTED:${token}`);
  }
}

main();

