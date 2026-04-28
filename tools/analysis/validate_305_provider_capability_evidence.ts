import fs from "node:fs";
import path from "node:path";

import {
  buildProviderCapabilityEvidenceRegistry,
  buildProviderPrerequisiteRegistry,
  buildProviderTestCredentialManifest,
  renderProviderCapabilityEvidenceMatrixCsv,
} from "../../scripts/providers/305_provider_capability_evidence_lib.ts";

const ROOT = path.resolve(process.cwd());
const CHECKLIST = path.join(ROOT, "prompt", "checklist.md");

const REQUIRED_FILES = [
  "data/providers/305_provider_capability_evidence_registry.json",
  "data/providers/305_provider_capability_evidence_matrix.csv",
  "data/providers/305_provider_test_credential_manifest.json",
  "data/providers/305_provider_prerequisite_registry.json",
  "docs/ops/305_provider_capability_evidence_runbook.md",
  "docs/ops/305_provider_test_credential_governance.md",
  "data/contracts/305_provider_capability_evidence_contract.json",
  "data/analysis/305_algorithm_alignment_notes.md",
  "data/analysis/305_provider_evidence_gap_register.json",
  "data/analysis/PHASE4_INTERFACE_GAP_PROVIDER_CAPABILITY_EVIDENCE_OPTUM_IM1.json",
  "data/analysis/PHASE4_INTERFACE_GAP_PROVIDER_CAPABILITY_EVIDENCE_TPP_IM1_PATIENT.json",
  "data/analysis/PHASE4_INTERFACE_GAP_PROVIDER_CAPABILITY_EVIDENCE_TPP_IM1_TRANSACTION.json",
  "data/analysis/PHASE4_INTERFACE_GAP_PROVIDER_CAPABILITY_EVIDENCE_GP_CONNECT_EXISTING.json",
  "scripts/providers/305_provider_capability_evidence_lib.ts",
  "scripts/providers/305_capture_capability_evidence.ts",
  "scripts/providers/305_validate_capability_evidence.ts",
  "tests/playwright/305_provider_capability_evidence.helpers.ts",
  "tests/playwright/305_provider_capability_evidence_capture.spec.ts",
  "tests/playwright/305_provider_portal_capability_observation.spec.ts",
  "tests/integration/305_capability_evidence_registry.spec.ts",
  "output/playwright/305-provider-capability-evidence-capture.png",
  "output/playwright/305-provider-capability-evidence-capture-trace.zip",
  "output/playwright/305-provider-portal-capability-observation.png",
  "output/playwright/305-provider-portal-capability-observation-trace.zip",
] as const;

const FORBIDDEN_TRACKED_TOKENS = [
  "BEGIN PRIVATE KEY",
  "BEGIN CERTIFICATE",
  "api_key=",
  "client_secret=",
  "bearer ey",
  "-----BEGIN",
  "plainpassword",
  "consolepassword",
] as const;

const FORBIDDEN_OUTPUT_TOKENS = ["secret://", "vault://", "env://"] as const;

function fail(message: string): never {
  throw new Error(`[305-provider-capability-evidence] ${message}`);
}

function read(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    fail(`missing required file ${path.relative(ROOT, filePath)}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath: string): any {
  return JSON.parse(read(filePath));
}

function checklistState(taskPrefix: string): string {
  const pattern = new RegExp(
    `^- \\[([ Xx-])\\] ${taskPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    "m",
  );
  const match = read(CHECKLIST).match(pattern);
  if (!match) {
    fail(`checklist row missing for ${taskPrefix}`);
  }
  return match[1]!.toUpperCase();
}

function validateChecklist(): void {
  if (
    checklistState(
      "seq_304_phase4_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_booking_provider_sandboxes_and_callback_endpoints",
    ) !== "X"
  ) {
    fail("seq_304 must be complete before seq_305");
  }
  const taskState = checklistState(
    "seq_305_phase4_use_Playwright_or_other_appropriate_tooling_browser_automation_to_capture_booking_provider_capability_evidence_and_test_credentials",
  );
  if (!["-", "X"].includes(taskState)) {
    fail("seq_305 must be claimed or complete");
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
  const registry = await buildProviderCapabilityEvidenceRegistry();
  const credentials = await buildProviderTestCredentialManifest();
  const prerequisites = await buildProviderPrerequisiteRegistry();
  const expectedMatrix = await renderProviderCapabilityEvidenceMatrixCsv();

  const committedRegistry = readJson(
    path.join(ROOT, "data/providers/305_provider_capability_evidence_registry.json"),
  );
  const committedCredentials = readJson(
    path.join(ROOT, "data/providers/305_provider_test_credential_manifest.json"),
  );
  const committedPrerequisites = readJson(
    path.join(ROOT, "data/providers/305_provider_prerequisite_registry.json"),
  );
  const committedMatrix = read(path.join(ROOT, "data/providers/305_provider_capability_evidence_matrix.csv"));

  if (JSON.stringify(committedRegistry) !== JSON.stringify(registry)) {
    fail("committed capability evidence registry drifted from helper output");
  }
  if (JSON.stringify(committedCredentials) !== JSON.stringify(credentials)) {
    fail("committed credential manifest drifted from helper output");
  }
  if (JSON.stringify(committedPrerequisites) !== JSON.stringify(prerequisites)) {
    fail("committed prerequisite registry drifted from helper output");
  }
  if (committedMatrix !== expectedMatrix) {
    fail("committed capability evidence matrix drifted from helper output");
  }
}

async function validateContractAndGaps(): Promise<void> {
  const contract = readJson(
    path.join(ROOT, "data/contracts/305_provider_capability_evidence_contract.json"),
  );
  const gapRegister = readJson(path.join(ROOT, "data/analysis/305_provider_evidence_gap_register.json"));
  const registry = await buildProviderCapabilityEvidenceRegistry();

  if (
    contract.taskId !==
    "seq_305_phase4_use_Playwright_or_other_appropriate_tooling_browser_automation_to_capture_booking_provider_capability_evidence_and_test_credentials"
  ) {
    fail("contract taskId drifted");
  }
  if (contract.schemaVersion !== "305.phase4.provider-capability-evidence.v1") {
    fail("contract schemaVersion drifted");
  }
  if (
    JSON.stringify(contract.supportedProviderCapabilityMatrixRefs) !==
    JSON.stringify(
      [...new Set(registry.evidenceRows.map((row) => row.providerCapabilityMatrixRef))],
    )
  ) {
    fail("contract provider-capability matrix refs drifted");
  }
  if (
    registry.coverageSummary.evidenceRowCount !==
    contract.expectedCoverageSummary.sandboxCount * contract.expectedCoverageSummary.claimCountPerSandbox
  ) {
    fail("contract expected coverage summary drifted from the registry");
  }
  if (!Array.isArray(gapRegister.gaps) || gapRegister.gaps.length !== 4) {
    fail("gap register must contain four provider evidence gaps");
  }

  const providerGapIds = [
    "PHASE4_INTERFACE_GAP_PROVIDER_CAPABILITY_EVIDENCE_OPTUM_IM1",
    "PHASE4_INTERFACE_GAP_PROVIDER_CAPABILITY_EVIDENCE_TPP_IM1_PATIENT",
    "PHASE4_INTERFACE_GAP_PROVIDER_CAPABILITY_EVIDENCE_TPP_IM1_TRANSACTION",
    "PHASE4_INTERFACE_GAP_PROVIDER_CAPABILITY_EVIDENCE_GP_CONNECT_EXISTING",
  ];
  for (const gapId of providerGapIds) {
    const match = read(path.join(ROOT, "data/analysis", `${gapId}.json`));
    if (!match.includes(gapId)) {
      fail(`provider-specific gap file missing ${gapId}`);
    }
  }
}

function validateDocsAndTests(): void {
  const runbook = read(path.join(ROOT, "docs/ops/305_provider_capability_evidence_runbook.md"));
  const governance = read(
    path.join(ROOT, "docs/ops/305_provider_test_credential_governance.md"),
  );
  const alignment = read(path.join(ROOT, "data/analysis/305_algorithm_alignment_notes.md"));
  const helper = read(
    path.join(ROOT, "tests/playwright/305_provider_capability_evidence.helpers.ts"),
  );
  const captureSpec = read(
    path.join(ROOT, "tests/playwright/305_provider_capability_evidence_capture.spec.ts"),
  );
  const observationSpec = read(
    path.join(ROOT, "tests/playwright/305_provider_portal_capability_observation.spec.ts"),
  );
  const integrationSpec = read(
    path.join(ROOT, "tests/integration/305_capability_evidence_registry.spec.ts"),
  );

  for (const token of [
    "manual bridge",
    "providerAdapterBindingHash",
    "capabilityTupleHash",
    "node --experimental-strip-types /Users/test/Code/V/scripts/providers/305_capture_capability_evidence.ts",
  ]) {
    if (!runbook.includes(token)) {
      fail(`runbook missing token ${token}`);
    }
  }
  for (const token of [
    "ROLE_SECURITY_LEAD",
    "ROLE_INTEROPERABILITY_LEAD",
    "masked fingerprint",
    "review-required",
  ]) {
    if (!governance.toLowerCase().includes(token.toLowerCase())) {
      fail(`credential governance missing token ${token}`);
    }
  }
  for (const token of [
    "Interface Mechanism 1 API standards",
    "GP Connect: Appointment Management - FHIR API",
    "HL7 FHIR R4 Appointment",
    "HL7 FHIR R4 Slot",
  ]) {
    if (!alignment.includes(token)) {
      fail(`alignment notes missing reference ${token}`);
    }
  }
  for (const token of [
    "capture-provider-capability-evidence",
    "observation-link-sandbox_304_vecells_local_gateway_local_twin",
    "claim-sandbox_304_vecells_local_gateway_local_twin-search_slots_support",
  ]) {
    if (!helper.includes(token) && !captureSpec.includes(token) && !observationSpec.includes(token)) {
      fail(`playwright helper or specs missing token ${token}`);
    }
  }
  for (const token of ["accepted_new", "semantic_replay", "stale_ignored"]) {
    if (!integrationSpec.includes(token)) {
      fail(`integration spec missing replay decision class ${token}`);
    }
  }
}

function scanTrackedFiles(): void {
  for (const relativePath of [
    "data/providers/305_provider_capability_evidence_registry.json",
    "data/providers/305_provider_test_credential_manifest.json",
    "data/providers/305_provider_prerequisite_registry.json",
    "docs/ops/305_provider_capability_evidence_runbook.md",
    "docs/ops/305_provider_test_credential_governance.md",
    "tests/playwright/305_provider_capability_evidence.helpers.ts",
  ]) {
    const contents = read(path.join(ROOT, relativePath)).toLowerCase();
    for (const forbidden of FORBIDDEN_TRACKED_TOKENS) {
      if (contents.includes(forbidden.toLowerCase())) {
        fail(`${relativePath} contains forbidden raw secret token ${forbidden}`);
      }
    }
  }
}

function scanRuntimeOutputs(): void {
  const observationDir = path.join(ROOT, ".artifacts", "provider-evidence", "305", "observations");
  if (!fs.existsSync(observationDir)) {
    fail("missing provider evidence observation directory");
  }
  const observationFiles = fs
    .readdirSync(observationDir)
    .filter((entry: string) => entry.endsWith(".json"));
  if (observationFiles.length !== 7) {
    fail("expected seven provider evidence observation files");
  }
  for (const entry of observationFiles) {
    const contents = read(path.join(observationDir, entry));
    for (const forbidden of FORBIDDEN_OUTPUT_TOKENS) {
      if (contents.toLowerCase().includes(forbidden.toLowerCase())) {
        fail(`observation artifact ${entry} leaked secret reference ${forbidden}`);
      }
    }
  }

  for (const relativePath of [
    "output/playwright/305-provider-capability-evidence-capture.png",
    "output/playwright/305-provider-capability-evidence-capture-trace.zip",
    "output/playwright/305-provider-portal-capability-observation.png",
    "output/playwright/305-provider-portal-capability-observation-trace.zip",
  ]) {
    const absolutePath = path.join(ROOT, relativePath);
    const bytes = fs.readFileSync(absolutePath);
    const text = bytes.toString("utf8").toLowerCase();
    for (const forbidden of FORBIDDEN_OUTPUT_TOKENS) {
      if (text.includes(forbidden.toLowerCase())) {
        fail(`${relativePath} leaked secret reference ${forbidden}`);
      }
    }
  }
}

async function validateCoverage(): Promise<void> {
  const registry = await buildProviderCapabilityEvidenceRegistry();
  const credentials = await buildProviderTestCredentialManifest();
  const prerequisites = await buildProviderPrerequisiteRegistry();

  if (registry.coverageSummary.sandboxCount !== 7) {
    fail("registry must cover seven sandboxes");
  }
  if (registry.coverageSummary.uniqueProviderRowCount !== 6) {
    fail("registry must cover six unique provider rows");
  }
  if (registry.coverageSummary.evidenceRowCount !== 105) {
    fail("registry must contain 105 evidence rows");
  }
  if (credentials.credentials.length !== 19) {
    fail("credential manifest must contain 19 credential references");
  }
  if (prerequisites.prerequisites.length !== 21) {
    fail("prerequisite registry must contain 21 prerequisite rows");
  }

  for (const row of registry.evidenceRows) {
    if (!row.bookingCapabilityResolutionRef || !row.capabilityTupleHash) {
      fail(`${row.evidenceId} is missing tuple linkage`);
    }
    if (row.evidenceStatus === "current" && row.confidenceLevel !== "verified") {
      fail(`${row.evidenceId} is current without verified confidence`);
    }
    if (
      row.evidenceStatus === "review_required" &&
      row.gapArtifactRef === null &&
      row.sandboxId !== "sandbox_304_tpp_im1_transaction_supported_test" &&
      row.sandboxId !== "sandbox_304_optum_im1_supported_test" &&
      row.sandboxId !== "sandbox_304_tpp_im1_patient_supported_test" &&
      row.sandboxId !== "sandbox_304_gp_connect_integration_candidate"
    ) {
      fail(`${row.evidenceId} is review-required without a truthful gap posture`);
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
  scanRuntimeOutputs();
  await validateCoverage();
  console.log("305 provider capability evidence validation passed");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
