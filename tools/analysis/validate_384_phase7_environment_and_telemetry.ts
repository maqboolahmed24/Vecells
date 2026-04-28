import fs from "node:fs";
import path from "node:path";

import { serviceDefinition } from "../../services/command-api/src/service-definition.ts";
import {
  createDefaultPhase7EnvironmentTelemetryApplication,
  phase7EnvironmentTelemetryRoutes,
  type EnvironmentProfileFailureReason,
  type TelemetryValidationFailureReason,
} from "../../services/command-api/src/phase7-environment-telemetry-service.ts";
import {
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
} from "../../services/command-api/src/phase7-nhs-app-manifest-service.ts";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

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
  const lines = readText(relativePath).trim().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "");
  invariant(headers.length > 1, `${relativePath} must have a header.`);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    invariant(values.length === headers.length, `${relativePath} malformed row: ${line}`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}.`);
}

const REQUIRED_FILES = [
  "services/command-api/src/phase7-environment-telemetry-service.ts",
  "docs/architecture/384_phase7_environment_profiles_and_telemetry.md",
  "docs/ops/384_phase7_sandpit_aos_scal_runbook.md",
  "docs/data/384_phase7_channel_telemetry_contracts.md",
  "data/analysis/384_external_reference_notes.md",
  "data/analysis/384_algorithm_alignment_notes.md",
  "data/test/384_environment_profile_matrix.csv",
  "data/test/384_demo_dataset_inventory.csv",
  "data/test/384_telemetry_event_validation_matrix.csv",
  "tools/analysis/validate_384_phase7_environment_and_telemetry.ts",
  "tests/unit/384_environment_profiles_and_demo_datasets.spec.ts",
  "tests/integration/384_channel_telemetry_and_scal_bundle.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:384-phase7-environment-and-telemetry"] ===
    "pnpm exec tsx ./tools/analysis/validate_384_phase7_environment_and_telemetry.ts",
  "package.json missing validate:384-phase7-environment-and-telemetry script.",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_383_/m.test(checklist), "par_383 must be complete before par_384.");
invariant(
  /^- \[(?:-|X)\] par_384_/m.test(checklist),
  "par_384 must be claimed or complete while validator runs.",
);

const serviceSource = readText("services/command-api/src/phase7-environment-telemetry-service.ts");
for (const needle of [
  "NHSAppEnvironmentProfile",
  "IntegrationDemoDataset",
  "ChannelTelemetryPlan",
  "TelemetryEventContract",
  "SCALBundle",
  "validateEnvironmentParity",
  "resetDemoDataset",
  "validateTelemetryEvent",
  "assembleSCALBundle",
  "raw_jwt_detected",
  "grant_identifier_detected",
  "patient_identifier_detected",
]) {
  requireIncludes(serviceSource, needle, "environment telemetry service");
}

for (const route of phase7EnvironmentTelemetryRoutes) {
  invariant(
    serviceDefinition.routeCatalog.some((catalogRoute) => catalogRoute.routeId === route.routeId),
    `serviceDefinition route catalog missing ${route.routeId}.`,
  );
}

for (const [relativePath, requiredTerms] of Object.entries({
  "docs/architecture/384_phase7_environment_profiles_and_telemetry.md": [
    "NHSAppEnvironmentProfile",
    "IntegrationDemoDataset",
    "ChannelTelemetryPlan",
    "TelemetryEventContract",
    "SCALBundle",
  ],
  "docs/ops/384_phase7_sandpit_aos_scal_runbook.md": [
    "Sandpit",
    "AOS",
    "SCALBundle",
    "TelemetryEventContract",
  ],
  "docs/data/384_phase7_channel_telemetry_contracts.md": [
    "channelSessionHash",
    "nhs_app_route_entry",
    "raw identifiers",
  ],
  "data/analysis/384_external_reference_notes.md": [
    "digital.nhs.uk",
    "nhsconnect.github.io",
    "SCAL",
    "monthly data",
  ],
  "data/analysis/384_algorithm_alignment_notes.md": [
    "Environment Profiles",
    "Telemetry Contracts",
    "SCAL Bundle",
  ],
})) {
  const text = readText(relativePath);
  for (const term of requiredTerms) {
    requireIncludes(text, term, relativePath);
  }
}

const environmentRows = readCsv("data/test/384_environment_profile_matrix.csv");
for (const failureReason of [
  "manifest_tuple_drift",
  "manifest_route_mismatch",
  "readiness_not_current",
  "demo_dataset_invalid",
] satisfies EnvironmentProfileFailureReason[]) {
  invariant(
    environmentRows.some((row) => String(row.expected_failure_reasons).includes(failureReason)),
    `Environment matrix missing ${failureReason}.`,
  );
}

const datasetRows = readCsv("data/test/384_demo_dataset_inventory.csv");
for (const journeyKind of ["request", "booking", "waitlist", "pharmacy", "status"]) {
  invariant(
    datasetRows.some((row) => row.journey_kind === journeyKind),
    `Demo dataset inventory missing ${journeyKind}.`,
  );
}

const telemetryRows = readCsv("data/test/384_telemetry_event_validation_matrix.csv");
for (const failureReason of [
  "raw_jwt_detected",
  "grant_identifier_detected",
  "patient_identifier_detected",
  "phi_query_string_detected",
  "release_tuple_drift",
] satisfies TelemetryValidationFailureReason[]) {
  invariant(
    telemetryRows.some((row) => String(row.expected_failure_reasons).includes(failureReason)),
    `Telemetry matrix missing ${failureReason}.`,
  );
}

const application = createDefaultPhase7EnvironmentTelemetryApplication();
const inventory = application.listEvidence();
invariant(inventory.environmentProfiles.length >= 5, "Environment profiles seed incomplete.");
invariant(inventory.demoDatasets.length >= 5, "Demo dataset seed incomplete.");
invariant(
  inventory.telemetryEventContracts.length >= 7,
  "Telemetry event contract seed incomplete.",
);
invariant(inventory.telemetryPlans.length >= 5, "Telemetry plan seed incomplete.");

const sandpit = application.validateEnvironmentProfile({ environment: "sandpit" });
invariant(sandpit.parityState === "matching", "Sandpit profile should match.");
invariant(sandpit.routeReadiness[0]?.verdict === "ready", "Sandpit exposed route must be ready.");

const parity = application.validateEnvironmentParity();
invariant(parity.parityState === "matching", "Sandpit AOS live profile parity should match.");

const reset = application.resetDemoDataset({
  environment: "aos",
  now: "2026-04-27T02:00:00.000Z",
});
invariant(reset.integrity.integrityState === "valid", "Reset dataset should be valid.");
invariant(reset.beforeHash === reset.afterHash, "Dataset reset must preserve stable seed hash.");

const telemetryPlan = application.buildTelemetryPlan({ environment: "aos" });
invariant(
  telemetryPlan.eventContractRefs.every((contractRef) =>
    inventory.telemetryEventContracts.some((contract) => contract.contractId === contractRef),
  ),
  "Telemetry plan references missing contracts.",
);

const accepted = application.validateTelemetryEvent({
  eventName: "nhs_app_route_entry",
  environment: "sandpit",
  payload: {
    environment: "sandpit",
    journeyPathId: "jp_pharmacy_status",
    routeFamilyRef: "pharmacy_status",
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    channelSessionHash: "sha256:384-validator-session",
    occurredAt: "2026-04-27T01:20:15.000Z",
    cohortRef: "cohort:phase7-internal-sandpit-only",
    platform: "ios",
    entryMode: "jump_off",
  },
});
invariant(accepted.validationState === "accepted", "Valid telemetry event should pass.");

const rejected = application.validateTelemetryEvent({
  eventName: "nhs_app_sso_result",
  environment: "sandpit",
  payload: {
    environment: "sandpit",
    journeyPathId: "jp_pharmacy_status",
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    channelSessionHash: "sha256:384-validator-session",
    result: "failed",
    occurredAt: "2026-04-27T01:20:15.000Z",
    assertedLoginIdentity: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50In0.signaturePartForTest",
  },
});
invariant(rejected.validationState === "quarantined", "Raw JWT telemetry should quarantine.");
invariant(rejected.failureReasons.includes("raw_jwt_detected"), "Raw JWT failure reason missing.");

const scal = application.assembleSCALBundle({ environment: "aos" });
invariant(scal.submissionState === "ready_for_submission", "AOS SCAL bundle should be ready.");
invariant(scal.routeReadinessRefs.length > 0, "SCAL bundle missing readiness refs.");
invariant(
  scal.evidenceRefs.some((ref) => ref.includes("Telemetry")),
  "SCAL missing telemetry refs.",
);

console.log("validate_384_phase7_environment_and_telemetry: ok");
