import fs from "node:fs";
import path from "node:path";

import {
  indexSCALBundle,
  load396JsonFile,
  redactSensitiveText,
  redactUrl,
  validateOnboardingAssetsFromFiles,
  type SCALSubmissionBundleManifest,
} from "../../services/command-api/src/phase7-nhs-app-onboarding-service.ts";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "services/command-api/src/phase7-nhs-app-onboarding-service.ts",
  "ops/onboarding/396_nhs_app_sandpit_aos_and_scal_runbook.md",
  "ops/onboarding/396_nhs_app_demo_walkthrough_script.md",
  "ops/onboarding/396_sandpit_and_aos_signoff_checklist.csv",
  "ops/onboarding/396_scal_evidence_inventory.csv",
  "ops/onboarding/396_redaction_and_artifact_handling_rules.md",
  "data/config/396_nhs_app_environment_profile_manifest.example.json",
  "data/config/396_nhs_app_demo_dataset_manifest.example.json",
  "data/config/396_scal_submission_bundle_manifest.example.json",
  "data/contracts/396_nhs_app_onboarding_contract.json",
  "data/analysis/396_algorithm_alignment_notes.md",
  "data/analysis/396_external_reference_notes.md",
  "data/analysis/396_environment_parity_matrix.csv",
  "data/analysis/396_demo_journey_coverage_matrix.csv",
  "tools/browser-automation/396_prepare_sandpit_and_aos_environment.spec.ts",
  "tools/browser-automation/396_verify_demo_environment_readiness.spec.ts",
  "tools/browser-automation/396_capture_scal_evidence_index.spec.ts",
  "tools/browser-automation/396_redaction_helpers.ts",
  "tools/analysis/validate_396_nhs_app_onboarding_assets.ts",
  "tests/unit/396_nhs_app_onboarding_assets.spec.ts",
  "tests/integration/396_nhs_app_onboarding_assets.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:396-nhs-app-onboarding-assets"] ===
    "pnpm exec tsx ./tools/analysis/validate_396_nhs_app_onboarding_assets.ts",
  "package.json missing validate:396-nhs-app-onboarding-assets script.",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_395_/m.test(checklist), "par_395 must be complete before par_396.");
invariant(
  /^- \[(?:-|X)\] par_396_/m.test(checklist),
  "par_396 must be claimed or complete while validator runs.",
);

const serviceSource = readText("services/command-api/src/phase7-nhs-app-onboarding-service.ts");
for (const needle of [
  "NHSAppEnvironmentProfile",
  "IntegrationDemoDataset",
  "ChannelTelemetryPlan",
  "SCALBundle",
  "validateEnvironmentProfileManifest",
  "compareSandpitAOSParity",
  "validateDemoDatasetManifest",
  "createDemoResetPlan",
  "indexSCALBundle",
  "redactSensitiveText",
  "createSignoffReadinessReport",
]) {
  requireIncludes(serviceSource, needle, "396 onboarding service");
}

const externalNotes = readText("data/analysis/396_external_reference_notes.md");
for (const url of [
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
  "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
  "https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/",
  "https://service-manual.nhs.uk/accessibility",
  "https://playwright.dev/docs/browser-contexts",
  "https://playwright.dev/docs/trace-viewer",
]) {
  requireIncludes(externalNotes, url, "396 external reference notes");
}

const report = validateOnboardingAssetsFromFiles({
  root: ROOT,
  environmentProfilePath: "data/config/396_nhs_app_environment_profile_manifest.example.json",
  demoDatasetPath: "data/config/396_nhs_app_demo_dataset_manifest.example.json",
  scalBundlePath: "data/config/396_scal_submission_bundle_manifest.example.json",
});

invariant(report.readinessState === "ready", "396 signoff readiness report must be ready.");
invariant(report.machineReadableSummary.sandpitReady, "Sandpit readiness must be true.");
invariant(report.machineReadableSummary.aosReady, "AOS readiness must be true.");
invariant(
  report.machineReadableSummary.demoResetDeterministic,
  "Demo reset determinism must be true.",
);
invariant(
  report.machineReadableSummary.scalEvidenceExportable,
  "SCAL evidence exportability must be true.",
);

const scalManifest = load396JsonFile<SCALSubmissionBundleManifest>(
  "data/config/396_scal_submission_bundle_manifest.example.json",
  ROOT,
);
const scalIndex = indexSCALBundle(scalManifest);
invariant(scalIndex.rows.length >= 5, "SCAL evidence index must contain at least five rows.");
invariant(
  scalIndex.rows.every((row) => row.freshnessState === "current"),
  "SCAL evidence rows must be current.",
);
invariant(
  scalIndex.rows.some((row) => row.redactionClass === "phi_url" && row.redactionRequired),
  "SCAL evidence index must include PHI URL redaction handling.",
);

const redactedUrl = redactUrl(
  "https://supplier.invalid/path?assertedLoginIdentity=eyJhbGciOiJIUzI1NiJ9.payload.signature&patientId=123",
);
invariant(!redactedUrl.includes("payload.signature"), "redactUrl leaked identity assertion.");
invariant(
  redactedUrl.includes("[REDACTED:assertedLoginIdentity]"),
  "redactUrl did not mark identity assertion redaction.",
);
const redactedText = redactSensitiveText("Bearer abcdefghijklmnopqrstuvwxyz patientId=patient-1");
invariant(
  !redactedText.includes("abcdefghijklmnopqrstuvwxyz"),
  "redactSensitiveText leaked token.",
);

const signoffRows = readCsv("ops/onboarding/396_sandpit_and_aos_signoff_checklist.csv");
for (const checkId of [
  "396_SIGNOFF_SANDPIT_TUPLE_READY",
  "396_SIGNOFF_AOS_TUPLE_READY",
  "396_SIGNOFF_SCAL_INDEX_CURRENT",
  "396_SIGNOFF_ARTIFACT_REDACTION",
]) {
  invariant(
    signoffRows.some((row) => row.check_id === checkId),
    `Signoff checklist missing ${checkId}.`,
  );
}

const browserSpecs = [
  "tools/browser-automation/396_prepare_sandpit_and_aos_environment.spec.ts",
  "tools/browser-automation/396_verify_demo_environment_readiness.spec.ts",
  "tools/browser-automation/396_capture_scal_evidence_index.spec.ts",
] as const;
for (const browserSpec of browserSpecs) {
  const source = readText(browserSpec);
  requireIncludes(source, "chromium.launch", browserSpec);
  requireIncludes(source, "browser.newContext", browserSpec);
  requireIncludes(source, "--run", browserSpec);
}
requireIncludes(
  readText("tools/browser-automation/396_capture_scal_evidence_index.spec.ts"),
  "context.tracing.start",
  "396 capture evidence spec",
);

const redactionSource = readText("tools/browser-automation/396_redaction_helpers.ts");
requireIncludes(redactionSource, "assertedLoginIdentity", "396 redaction helpers");
requireIncludes(redactionSource, "Bearer", "396 redaction helpers");
requireIncludes(redactionSource, "assert396RedactionSafePage", "396 redaction helpers");

console.log("validate_396_nhs_app_onboarding_assets: ok");

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson<T extends JsonRecord>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}.`);
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function readCsv(relativePath: string): JsonRecord[] {
  const lines = readText(relativePath).trim().split(/\r?\n/u).filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "");
  invariant(headers.length > 1, `${relativePath} must have a header.`);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    invariant(values.length === headers.length, `${relativePath} malformed row: ${line}`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}
