import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  bootstrapDirectoryAndDispatchCredentials,
  buildDirectoryAndDispatchBindingContract,
  buildDirectorySourceManifest,
  buildDispatchProviderBindingManifest,
  buildSecretReferenceManifest,
  CONTROL_PLANE_VERSION,
  materializeDirectoryDispatchTrackedArtifacts,
  readAndValidateDirectoryDispatchControlPlane,
  renderNonProdProviderBindingMatrixCsv,
  renderProviderCapabilityBindingMatrixCsv,
  renderProviderInventoryTemplateCsv,
  renderVerificationChecklistCsv,
  resetDirectoryAndDispatchRuntime,
  verifyDirectoryAndDispatchReadiness,
} from "../../scripts/pharmacy/366_directory_dispatch_credentials_lib.ts";

const ROOT = "/Users/test/Code/V";
const CHECKLIST_PATH = path.join(ROOT, "prompt", "checklist.md");

const REQUIRED_FILES = [
  "scripts/pharmacy/366_directory_dispatch_credentials_lib.ts",
  "scripts/pharmacy/366_materialize_directory_dispatch_artifacts.ts",
  "scripts/pharmacy/366_bootstrap_directory_and_dispatch_credentials.ts",
  "scripts/pharmacy/366_verify_directory_and_dispatch_readiness.ts",
  "tools/browser-automation/366_redaction_helpers.ts",
  "tools/browser-automation/366_portal.helpers.ts",
  "tools/browser-automation/366_configure_directory_and_dispatch_credentials.spec.ts",
  "tools/browser-automation/366_verify_directory_and_dispatch_readiness.spec.ts",
  "tools/analysis/validate_366_directory_and_dispatch_config.ts",
  "tests/integration/366_directory_dispatch_control_plane.spec.ts",
  "tests/integration/366_directory_dispatch_redaction_and_readiness.spec.ts",
  "ops/onboarding/366_pharmacy_directory_and_dispatch_credentials_runbook.md",
  "ops/onboarding/366_provider_inventory_template.csv",
  "ops/onboarding/366_nonprod_provider_binding_matrix.csv",
  "ops/onboarding/366_redaction_and_secret_handling_rules.md",
  "data/config/366_directory_source_manifest.example.json",
  "data/config/366_dispatch_provider_binding_manifest.example.json",
  "data/config/366_secret_reference_manifest.example.json",
  "data/contracts/366_directory_and_dispatch_binding_contract.json",
  "data/analysis/366_algorithm_alignment_notes.md",
  "data/analysis/366_external_reference_notes.md",
  "data/analysis/366_provider_capability_binding_matrix.csv",
  "data/analysis/366_verification_checklist.csv",
  "output/playwright/366-directory-dispatch-setup.png",
  "output/playwright/366-directory-dispatch-setup-trace.zip",
  "output/playwright/366-directory-dispatch-readiness.png",
  "output/playwright/366-directory-dispatch-readiness-trace.zip",
  "output/playwright/366-credential-portal-state/366_directory_dispatch_runtime_state.json",
  "output/playwright/366-credential-portal-state/366_directory_dispatch_readiness_summary.json",
] as const;

const REQUIRED_SCRIPT =
  '"validate:366-directory-and-dispatch-config": "pnpm exec tsx ./tools/analysis/validate_366_directory_and_dispatch_config.ts"';

const FORBIDDEN_TRACKED_VALUE_TOKENS = [
  "BEGIN PRIVATE KEY",
  "BEGIN CERTIFICATE",
  "client_secret=",
  "password=",
  "bearer ey",
  "\"accessToken\"",
  "\"refreshToken\"",
  "\"sessionToken\"",
] as const;

const FORBIDDEN_EVIDENCE_TOKENS = [
  "secret://",
  "BEGIN PRIVATE KEY",
  "BEGIN CERTIFICATE",
  "client_secret=",
  "password=",
  "bearer ey",
  "pharmacy_directory_dispatch_portal=active",
] as const;

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
  const escaped = taskPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = read("prompt/checklist.md").match(new RegExp(`^- \\[([ Xx-])\\] ${escaped}`, "m"));
  requireCondition(match, `CHECKLIST_ROW_MISSING:${taskPrefix}`);
  return match[1]!.toUpperCase();
}

function validateChecklist(): void {
  requireCondition(
    checklistState(
      "par_365_phase6_track_Playwright_or_other_appropriate_tooling_frontend_build_accessibility_and_micro_interaction_refinements_for_pharmacy_flows",
    ) === "X",
    "DEPENDENCY_INCOMPLETE:par_365",
  );

  const taskState = checklistState(
    "seq_366_phase6_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_pharmacy_directory_and_dispatch_provider_credentials",
  );
  requireCondition(["-", "X"].includes(taskState), "TASK_NOT_CLAIMED:seq_366");
}

function validateRequiredFiles(): void {
  for (const relativePath of REQUIRED_FILES) {
    requireCondition(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
  }
}

async function validateGeneratedArtifacts(): Promise<void> {
  requireCondition(
    JSON.stringify(readJson("data/config/366_directory_source_manifest.example.json")) ===
      JSON.stringify(await buildDirectorySourceManifest()),
    "DIRECTORY_MANIFEST_DRIFT",
  );
  requireCondition(
    JSON.stringify(readJson("data/config/366_dispatch_provider_binding_manifest.example.json")) ===
      JSON.stringify(await buildDispatchProviderBindingManifest()),
    "DISPATCH_MANIFEST_DRIFT",
  );
  requireCondition(
    JSON.stringify(readJson("data/config/366_secret_reference_manifest.example.json")) ===
      JSON.stringify(await buildSecretReferenceManifest()),
    "SECRET_MANIFEST_DRIFT",
  );
  requireCondition(
    JSON.stringify(readJson("data/contracts/366_directory_and_dispatch_binding_contract.json")) ===
      JSON.stringify(await buildDirectoryAndDispatchBindingContract()),
    "BINDING_CONTRACT_DRIFT",
  );
  requireCondition(
    read("ops/onboarding/366_provider_inventory_template.csv") ===
      (await renderProviderInventoryTemplateCsv()),
    "PROVIDER_INVENTORY_TEMPLATE_DRIFT",
  );
  requireCondition(
    read("ops/onboarding/366_nonprod_provider_binding_matrix.csv") ===
      (await renderNonProdProviderBindingMatrixCsv()),
    "NONPROD_BINDING_MATRIX_DRIFT",
  );
  requireCondition(
    read("data/analysis/366_provider_capability_binding_matrix.csv") ===
      (await renderProviderCapabilityBindingMatrixCsv()),
    "PROVIDER_CAPABILITY_MATRIX_DRIFT",
  );
  requireCondition(
    read("data/analysis/366_verification_checklist.csv") ===
      (await renderVerificationChecklistCsv()),
    "VERIFICATION_CHECKLIST_DRIFT",
  );
}

function validatePackageScript(): void {
  requireCondition(
    read("package.json").includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:366-directory-and-dispatch-config",
  );
}

function validateDocsAndTests(): void {
  const runbook = read("ops/onboarding/366_pharmacy_directory_and_dispatch_credentials_runbook.md");
  const redactionRules = read("ops/onboarding/366_redaction_and_secret_handling_rules.md");
  const alignment = read("data/analysis/366_algorithm_alignment_notes.md");
  const external = read("data/analysis/366_external_reference_notes.md");
  const configureSpec = read("tools/browser-automation/366_configure_directory_and_dispatch_credentials.spec.ts");
  const verifySpec = read("tools/browser-automation/366_verify_directory_and_dispatch_readiness.spec.ts");
  const portalHelpers = read("tools/browser-automation/366_portal.helpers.ts");
  const redactionHelpers = read("tools/browser-automation/366_redaction_helpers.ts");

  for (const token of [
    "dry_run",
    "rehearsal",
    "apply",
    "verify",
    "manual bridge",
    "rollback",
    "provider capability",
    "DispatchAdapterBinding",
  ]) {
    requireCondition(runbook.includes(token), `RUNBOOK_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "secret://",
    "masked fingerprints",
    "browser storage state",
    "screenshots and traces are captured only after the secret boundary",
    "manual bridge rows remain explicit",
  ]) {
    requireCondition(redactionRules.includes(token), `REDACTION_RULE_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "PharmacyProviderCapabilitySnapshot",
    "DispatchAdapterBinding",
    "TransportAssuranceProfile",
    "development_local_twin",
    "eps_dos_legacy",
    "does not store",
  ]) {
    requireCondition(alignment.includes(token), `ALIGNMENT_NOTE_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "Directory of Healthcare Services",
    "ODS",
    "Booking and Referral Standard",
    "MESH",
    "shared mailbox",
    "Playwright Isolation",
    "Playwright Trace Viewer",
    "Playwright Best Practices",
  ]) {
    requireCondition(external.includes(token), `EXTERNAL_NOTE_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "source_366_dohs_dev_riverside",
    "binding_366_bars_dev_riverside",
    "safeEvidencePolicy",
    "assertSecretSafePage",
    "manual_bridge_required",
  ]) {
    requireCondition(configureSpec.includes(token), `CONFIGURE_SPEC_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "preserveExistingState: true",
    "binding_366_supplier_integration_hilltop",
    "legacy_compatibility_only",
    "manual_bridge_required",
    "preflight_only",
  ]) {
    requireCondition(verifySpec.includes(token), `VERIFY_SPEC_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "preserveExistingState",
    "buildMaskedFingerprint",
    "assertSecretSafeText",
    "manual_bridge_required",
  ]) {
    requireCondition(portalHelpers.includes(token), `PORTAL_HELPER_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "containsSecretLeak",
    "redactSensitiveText",
    "recordTraceAfterSecretBoundary",
    "allowHar: false",
  ]) {
    requireCondition(redactionHelpers.includes(token), `REDACTION_HELPER_TOKEN_MISSING:${token}`);
  }
}

function scanTrackedFiles(): void {
  for (const relativePath of [
    "data/config/366_directory_source_manifest.example.json",
    "data/config/366_dispatch_provider_binding_manifest.example.json",
    "data/config/366_secret_reference_manifest.example.json",
    "data/contracts/366_directory_and_dispatch_binding_contract.json",
    "ops/onboarding/366_provider_inventory_template.csv",
    "ops/onboarding/366_nonprod_provider_binding_matrix.csv",
    "data/analysis/366_provider_capability_binding_matrix.csv",
    "data/analysis/366_verification_checklist.csv",
  ]) {
    const contents = read(relativePath).toLowerCase();
    for (const forbidden of FORBIDDEN_TRACKED_VALUE_TOKENS) {
      requireCondition(
        !contents.includes(forbidden.toLowerCase()),
        `TRACKED_SECRET_VALUE_LEAK:${relativePath}:${forbidden}`,
      );
    }
  }
}

function scanEvidenceArtifacts(): void {
  for (const relativePath of [
    "output/playwright/366-directory-dispatch-setup.png",
    "output/playwright/366-directory-dispatch-setup-trace.zip",
    "output/playwright/366-directory-dispatch-readiness.png",
    "output/playwright/366-directory-dispatch-readiness-trace.zip",
    "output/playwright/366-credential-portal-state/366_directory_dispatch_readiness_summary.json",
  ]) {
    const contents = fs.readFileSync(path.join(ROOT, relativePath)).toString("utf8").toLowerCase();
    for (const forbidden of FORBIDDEN_EVIDENCE_TOKENS) {
      requireCondition(
        !contents.includes(forbidden.toLowerCase()),
        `EVIDENCE_SECRET_LEAK:${relativePath}:${forbidden}`,
      );
    }
  }
}

function validateRuntimeArtifacts(): void {
  const runtimeState = readJson(
    "output/playwright/366-credential-portal-state/366_directory_dispatch_runtime_state.json",
  ) as {
    version?: string;
    directorySources?: Array<{ sourceId: string }>;
    dispatchBindings?: Array<{ bindingId: string }>;
  };
  const readinessSummary = readJson(
    "output/playwright/366-credential-portal-state/366_directory_dispatch_readiness_summary.json",
  ) as {
    taskId?: string;
    byEnvironment?: Array<{ environmentId: string; readinessState: string }>;
  };

  requireCondition(runtimeState.version === CONTROL_PLANE_VERSION, "RUNTIME_STATE_VERSION_DRIFT");
  requireCondition(
    runtimeState.directorySources?.some((row) => row.sourceId === "source_366_dohs_dev_riverside"),
    "RUNTIME_STATE_MISSING_DEV_DIRECTORY_SOURCE",
  );
  requireCondition(
    runtimeState.dispatchBindings?.some((row) => row.bindingId === "binding_366_bars_dev_riverside"),
    "RUNTIME_STATE_MISSING_DEV_DISPATCH_BINDING",
  );
  requireCondition(readinessSummary.taskId === "seq_366", "READINESS_SUMMARY_TASK_ID_DRIFT");
  requireCondition(
    readinessSummary.byEnvironment?.some(
      (entry) =>
        entry.environmentId === "development_local_twin" &&
        entry.readinessState === "verified",
    ),
    "READINESS_SUMMARY_MISSING_VERIFIED_LOCAL_TWIN",
  );
}

async function validateRuntimeProof(): Promise<void> {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-366-validator-"));
  await materializeDirectoryDispatchTrackedArtifacts(tempRoot);
  const loaded = await readAndValidateDirectoryDispatchControlPlane(tempRoot);
  requireCondition(
    loaded.dispatchManifest.bindings.length >= 5,
    "VALIDATOR_TEMP_CONTROL_PLANE_TOO_SMALL",
  );

  const outputDir = path.join(tempRoot, ".artifacts");
  await resetDirectoryAndDispatchRuntime(outputDir);

  const dryRun = await bootstrapDirectoryAndDispatchCredentials({
    outputDir,
    mode: "dry_run",
    sourceIds: ["source_366_dohs_dev_riverside"],
    bindingIds: ["binding_366_bars_dev_riverside"],
  });
  requireCondition(
    dryRun.actions.every((entry) => entry.action === "would_configure"),
    "DRY_RUN_SHOULD_ONLY_EMIT_WOULD_CONFIGURE",
  );
  const dryRunState = JSON.parse(fs.readFileSync(dryRun.runtimeStatePath, "utf8")) as {
    directorySources: unknown[];
    dispatchBindings: unknown[];
  };
  requireCondition(
    dryRunState.directorySources.length === 0 && dryRunState.dispatchBindings.length === 0,
    "DRY_RUN_MUTATED_RUNTIME_STATE",
  );

  const firstApply = await bootstrapDirectoryAndDispatchCredentials({
    outputDir,
    mode: "apply",
    sourceIds: ["source_366_dohs_dev_riverside"],
    bindingIds: ["binding_366_bars_dev_riverside"],
  });
  requireCondition(
    firstApply.actions.some((entry) => entry.action === "configured"),
    "APPLY_DID_NOT_CONFIGURE_ANY_ROW",
  );
  const secondApply = await bootstrapDirectoryAndDispatchCredentials({
    outputDir,
    mode: "apply",
    sourceIds: ["source_366_dohs_dev_riverside"],
    bindingIds: ["binding_366_bars_dev_riverside"],
  });
  requireCondition(
    secondApply.actions.some((entry) => entry.action === "already_current"),
    "SECOND_APPLY_DID_NOT_BECOME_IDEMPOTENT",
  );

  const readiness = await verifyDirectoryAndDispatchReadiness(outputDir);
  requireCondition(
    readiness.byEnvironment.some(
      (entry) =>
        entry.environmentId === "development_local_twin" &&
        entry.readinessState === "verified",
    ),
    "TEMP_READINESS_MISSING_VERIFIED_LOCAL_TWIN",
  );
  requireCondition(
    readiness.byEnvironment.some(
      (entry) =>
        entry.environmentId === "training_candidate" &&
        entry.readinessState === "manual_bridge_required",
    ),
    "TEMP_READINESS_MISSING_TRAINING_MANUAL_BRIDGE",
  );
}

async function main(): Promise<void> {
  validateChecklist();
  validateRequiredFiles();
  await validateGeneratedArtifacts();
  validatePackageScript();
  validateDocsAndTests();
  scanTrackedFiles();
  scanEvidenceArtifacts();
  validateRuntimeArtifacts();
  await validateRuntimeProof();

  const directoryManifest = readJson("data/config/366_directory_source_manifest.example.json") as {
    sources?: unknown[];
  };
  const dispatchManifest = readJson("data/config/366_dispatch_provider_binding_manifest.example.json") as {
    bindings?: unknown[];
  };
  const secretManifest = readJson("data/config/366_secret_reference_manifest.example.json") as {
    secrets?: unknown[];
  };
  const readinessSummary = readJson(
    "output/playwright/366-credential-portal-state/366_directory_dispatch_readiness_summary.json",
  ) as { byEnvironment?: unknown[] };

  console.log(
    JSON.stringify(
      {
        taskId: "seq_366",
        directorySources: directoryManifest.sources?.length ?? 0,
        dispatchBindings: dispatchManifest.bindings?.length ?? 0,
        secretRefs: secretManifest.secrets?.length ?? 0,
        readinessEnvironments: readinessSummary.byEnvironment?.length ?? 0,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
