import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  buildSandboxReadinessContract,
  buildTransportAndUpdateRecordSandboxGap,
  buildTransportSandboxManifest,
  buildUpdateRecordObservationManifest,
  materializeTransportSandboxTrackedArtifacts,
  prepareOperatorSubmissionBundle,
  readAndValidateTransportSandboxControlPlane,
  renderMailboxEndpointAndContactMatrixCsv,
  renderRequestStatusTrackerTemplateCsv,
  renderTransportAndObservationMatrixCsv,
  transitionSandboxRequestState,
  verifyUpdateRecordAndTransportSandboxReadiness,
} from "../../scripts/pharmacy/367_update_record_transport_sandbox_lib.ts";

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "scripts/pharmacy/367_update_record_transport_sandbox_lib.ts",
  "scripts/pharmacy/367_materialize_transport_sandbox_artifacts.ts",
  "scripts/pharmacy/367_verify_transport_sandbox_readiness.ts",
  "tools/browser-automation/367_redaction_helpers.ts",
  "tools/browser-automation/367_portal.helpers.ts",
  "tools/browser-automation/367_prepare_operator_submission_bundle.ts",
  "tools/browser-automation/367_request_transport_sandboxes.spec.ts",
  "tools/browser-automation/367_check_request_status_and_capture_evidence.spec.ts",
  "tools/analysis/validate_367_sandbox_readiness.ts",
  "tests/integration/367_transport_sandbox_control_plane.spec.ts",
  "tests/integration/367_transport_sandbox_redaction_and_readiness.spec.ts",
  "ops/onboarding/367_update_record_and_transport_sandbox_runbook.md",
  "ops/onboarding/367_nonprod_request_pack_checklist.md",
  "ops/onboarding/367_mailbox_endpoint_and_contact_matrix.csv",
  "ops/onboarding/367_human_approval_handoff_pack.md",
  "data/config/367_transport_sandbox_manifest.example.json",
  "data/config/367_update_record_observation_manifest.example.json",
  "data/contracts/367_sandbox_readiness_contract.json",
  "data/contracts/PHASE6_BATCH_364_371_INTERFACE_GAP_TRANSPORT_AND_UPDATE_RECORD_SANDBOX.json",
  "data/analysis/367_algorithm_alignment_notes.md",
  "data/analysis/367_external_reference_notes.md",
  "data/analysis/367_transport_and_observation_matrix.csv",
  "data/analysis/367_request_status_tracker_template.csv",
  "output/playwright/367-request-transport-sandboxes.png",
  "output/playwright/367-request-transport-sandboxes-trace.zip",
  "output/playwright/367-transport-sandbox-status.png",
  "output/playwright/367-transport-sandbox-status-trace.zip",
  "output/playwright/367-transport-sandbox-state/367_sandbox_request_runtime_state.json",
  "output/playwright/367-transport-sandbox-state/367_sandbox_readiness_summary.json",
] as const;

const REQUIRED_SCRIPT =
  '"validate:367-sandbox-readiness": "pnpm exec tsx ./tools/analysis/validate_367_sandbox_readiness.ts"';

const FORBIDDEN_VALUE_TOKENS = [
  "secret://",
  "BEGIN PRIVATE KEY",
  "BEGIN CERTIFICATE",
  "client_secret=",
  "password=",
  "bearer ey",
  "\"accessToken\"",
  "\"refreshToken\"",
  "\"sessionToken\"",
  "pharmacy_transport_sandbox_portal=active",
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
  const match = read("prompt/checklist.md").match(
    new RegExp(`^- \\[([ Xx-])\\] ${escaped}`, "m"),
  );
  requireCondition(match, `CHECKLIST_ROW_MISSING:${taskPrefix}`);
  return match[1]!.toUpperCase();
}

function validateChecklist(): void {
  for (const dependency of [
    "par_350_phase6_track_backend_build_dispatch_adapter_transport_contract_and_retry_expiry_logic",
    "par_352_phase6_track_backend_build_pharmacy_outcome_ingest_update_record_observation_and_reconciliation_pipeline",
    "par_353_phase6_track_backend_build_bounce_back_urgent_return_and_reopen_mechanics",
    "seq_366_phase6_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_pharmacy_directory_and_dispatch_provider_credentials",
  ]) {
    requireCondition(
      checklistState(dependency) === "X",
      `DEPENDENCY_INCOMPLETE:${dependency}`,
    );
  }

  const taskState = checklistState(
    "seq_367_phase6_use_Playwright_or_other_appropriate_tooling_browser_automation_to_request_update_record_and_referral_transport_sandboxes",
  );
  requireCondition(["-", "X"].includes(taskState), "TASK_NOT_CLAIMED:seq_367");
}

function validateRequiredFiles(): void {
  for (const relativePath of REQUIRED_FILES) {
    requireCondition(
      fs.existsSync(path.join(ROOT, relativePath)),
      `MISSING_REQUIRED_FILE:${relativePath}`,
    );
  }

  const bundleDir = path.join(
    ROOT,
    "output",
    "playwright",
    "367-transport-sandbox-state",
  );
  const bundleFiles = fs
    .readdirSync(bundleDir)
    .filter((entry) => entry.startsWith("367_operator_submission_bundle_"));
  requireCondition(bundleFiles.length > 0, "MISSING_OPERATOR_BUNDLE_EVIDENCE");
}

async function validateGeneratedArtifacts(): Promise<void> {
  requireCondition(
    JSON.stringify(readJson("data/config/367_update_record_observation_manifest.example.json")) ===
      JSON.stringify(await buildUpdateRecordObservationManifest()),
    "UPDATE_RECORD_MANIFEST_DRIFT",
  );
  requireCondition(
    JSON.stringify(readJson("data/config/367_transport_sandbox_manifest.example.json")) ===
      JSON.stringify(await buildTransportSandboxManifest()),
    "TRANSPORT_MANIFEST_DRIFT",
  );
  requireCondition(
    JSON.stringify(readJson("data/contracts/367_sandbox_readiness_contract.json")) ===
      JSON.stringify(await buildSandboxReadinessContract()),
    "READINESS_CONTRACT_DRIFT",
  );
  requireCondition(
    JSON.stringify(
      readJson(
        "data/contracts/PHASE6_BATCH_364_371_INTERFACE_GAP_TRANSPORT_AND_UPDATE_RECORD_SANDBOX.json",
      ),
    ) === JSON.stringify(await buildTransportAndUpdateRecordSandboxGap()),
    "INTERFACE_GAP_DRIFT",
  );
  requireCondition(
    read("ops/onboarding/367_mailbox_endpoint_and_contact_matrix.csv") ===
      (await renderMailboxEndpointAndContactMatrixCsv()),
    "MAILBOX_MATRIX_DRIFT",
  );
  requireCondition(
    read("data/analysis/367_transport_and_observation_matrix.csv") ===
      (await renderTransportAndObservationMatrixCsv()),
    "TRANSPORT_OBSERVATION_MATRIX_DRIFT",
  );
  requireCondition(
    read("data/analysis/367_request_status_tracker_template.csv") ===
      (await renderRequestStatusTrackerTemplateCsv()),
    "REQUEST_STATUS_TRACKER_DRIFT",
  );
}

function validatePackageScript(): void {
  requireCondition(
    read("package.json").includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:367-sandbox-readiness",
  );
}

function validateDocsAndTests(): void {
  const runbook = read("ops/onboarding/367_update_record_and_transport_sandbox_runbook.md");
  const checklist = read("ops/onboarding/367_nonprod_request_pack_checklist.md");
  const handoff = read("ops/onboarding/367_human_approval_handoff_pack.md");
  const alignment = read("data/analysis/367_algorithm_alignment_notes.md");
  const external = read("data/analysis/367_external_reference_notes.md");
  const requestSpec = read("tools/browser-automation/367_request_transport_sandboxes.spec.ts");
  const statusSpec = read(
    "tools/browser-automation/367_check_request_status_and_capture_evidence.spec.ts",
  );
  const portalHelpers = read("tools/browser-automation/367_portal.helpers.ts");
  const redactionHelpers = read("tools/browser-automation/367_redaction_helpers.ts");

  for (const token of [
    "Update Record",
    "MESH",
    "BARS",
    "manual_stop_before_submit",
    "status_check_only",
    "urgent_return_safety_net",
    "does not prove clinical completion",
  ]) {
    requireCondition(runbook.includes(token), `RUNBOOK_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "update_record_367_integration_pairing",
    "transport_367_mesh_training_mailbox",
    "transport_367_nhsmail_deployment_safetynet",
    "deployment_candidate",
    "training_candidate",
    "awaiting_response",
  ]) {
    requireCondition(checklist.includes(token), `REQUEST_CHECKLIST_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "named operator",
    "manual approval",
    "monitored mailbox",
    "expiry",
    "sandbox/live tuple",
    "operator handoff",
  ]) {
    requireCondition(handoff.includes(token), `HANDOFF_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "Rule 3",
    "6D",
    "6F",
    "6G",
    "350",
    "352",
    "353",
    "366",
    "update_record_367_deployment_observation",
    "transport_367_bars_deployment_preflight",
  ]) {
    requireCondition(alignment.includes(token), `ALIGNMENT_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "GP Connect: Update Record",
    "Connect to a Path to Live environment",
    "Apply for a MESH mailbox",
    "Booking and Referral - FHIR API",
    "Playwright Isolation",
    "Playwright Authentication",
    "Rejected or not adopted",
  ]) {
    requireCondition(external.includes(token), `EXTERNAL_NOTE_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "manual_stop_required",
    "transport_367_mesh_training_mailbox",
    "assertSecretSafePage",
    "367_operator_submission_bundle_",
  ]) {
    requireCondition(requestSpec.includes(token), `REQUEST_SPEC_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "verification-request-transport_367_nhsmail_deployment_safetynet",
    "request_state:submitted",
    "preserveExistingState: true",
    "367_sandbox_readiness_summary.json",
  ]) {
    requireCondition(statusSpec.includes(token), `STATUS_SPEC_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "manual_stop_required",
    "prepareOperatorSubmissionBundle",
    "verifyUpdateRecordAndTransportSandboxReadiness",
    "readAndValidateTransportSandboxControlPlane",
  ]) {
    requireCondition(portalHelpers.includes(token), `PORTAL_HELPER_TOKEN_MISSING:${token}`);
  }

  for (const token of [
    "collectTrackedSecretRefs",
    "containsSensitiveLeak",
    "assertSecretSafePage",
  ]) {
    requireCondition(redactionHelpers.includes(token), `REDACTION_HELPER_TOKEN_MISSING:${token}`);
  }
}

function validateOutputEvidenceSafety(): void {
  const runtimeState = read(
    "output/playwright/367-transport-sandbox-state/367_sandbox_request_runtime_state.json",
  );
  const readinessSummary = read(
    "output/playwright/367-transport-sandbox-state/367_sandbox_readiness_summary.json",
  );
  const bundleDir = path.join(
    ROOT,
    "output",
    "playwright",
    "367-transport-sandbox-state",
  );
  const bundleFiles = fs
    .readdirSync(bundleDir)
    .filter((entry) => entry.startsWith("367_operator_submission_bundle_"));

  for (const token of FORBIDDEN_VALUE_TOKENS) {
    requireCondition(!runtimeState.includes(token), `RUNTIME_STATE_LEAK:${token}`);
    requireCondition(!readinessSummary.includes(token), `READINESS_SUMMARY_LEAK:${token}`);
  }

  for (const bundleFile of bundleFiles) {
    const bundleText = fs.readFileSync(path.join(bundleDir, bundleFile), "utf8");
    for (const token of FORBIDDEN_VALUE_TOKENS) {
      requireCondition(!bundleText.includes(token), `BUNDLE_LEAK:${bundleFile}:${token}`);
    }
  }
}

async function validateControlPlaneRuntime(): Promise<void> {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-367-validator-root-"));
  await materializeTransportSandboxTrackedArtifacts(tempRoot);
  const loaded = await readAndValidateTransportSandboxControlPlane(tempRoot);
  requireCondition(loaded.updateManifest.observations.length === 3, "UPDATE_RECORD_COUNT_DRIFT");
  requireCondition(loaded.transportManifest.transports.length === 5, "TRANSPORT_COUNT_DRIFT");

  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-367-validator-output-"));
  await prepareOperatorSubmissionBundle({
    outputDir,
    requestIds: [
      "update_record_367_integration_pairing",
      "transport_367_mesh_training_mailbox",
    ],
  });
  await transitionSandboxRequestState({
    requestId: "transport_367_mesh_training_mailbox",
    action: "submit_request",
    outputDir,
  });
  const summary = await verifyUpdateRecordAndTransportSandboxReadiness(outputDir);
  requireCondition(summary.updateRecordChecks.length === 3, "UPDATE_CHECK_COUNT_DRIFT");
  requireCondition(summary.transportChecks.length === 5, "TRANSPORT_CHECK_COUNT_DRIFT");
  requireCondition(summary.byEnvironment.length === 4, "ENVIRONMENT_SUMMARY_COUNT_DRIFT");
}

async function main(): Promise<void> {
  validateChecklist();
  validateRequiredFiles();
  validatePackageScript();
  await validateGeneratedArtifacts();
  validateDocsAndTests();
  validateOutputEvidenceSafety();
  await validateControlPlaneRuntime();

  console.log(
    JSON.stringify(
      {
        taskId: "seq_367",
        status: "ok",
        updateRecordRequests: 3,
        transportRequests: 5,
        outputEvidenceDir: "output/playwright/367-transport-sandbox-state",
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
