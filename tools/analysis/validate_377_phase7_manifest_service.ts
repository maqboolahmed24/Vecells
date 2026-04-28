import fs from "node:fs";
import path from "node:path";
import { serviceDefinition } from "../../services/command-api/src/service-definition";
import {
  PHASE7_CONFIG_FINGERPRINT,
  PHASE7_INTAKE_CONVERGENCE_REF,
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
  createDefaultPhase7NhsAppManifestApplication,
  phase7ManifestExposureRoutes,
  type NhsAppIntegrationManifest,
} from "../../services/command-api/src/phase7-nhs-app-manifest-service";

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

function asArray<T = unknown>(value: unknown, label: string): T[] {
  invariant(Array.isArray(value), `${label} must be an array.`);
  return value as T[];
}

function asRecord(value: unknown, label: string): JsonRecord {
  invariant(
    value !== null && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object.`,
  );
  return value as JsonRecord;
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
  invariant(headers.length > 1, `${relativePath} must include a CSV header.`);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    invariant(values.length === headers.length, `${relativePath} has malformed row: ${line}`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}.`);
}

function requireArrayIncludes(
  values: unknown,
  expectedValues: readonly string[],
  label: string,
): string[] {
  const strings = asArray<string>(values, label);
  for (const expectedValue of expectedValues) {
    invariant(strings.includes(expectedValue), `${label} missing ${expectedValue}.`);
  }
  return strings;
}

const REQUIRED_FILES = [
  "services/command-api/src/phase7-nhs-app-manifest-service.ts",
  "docs/architecture/377_phase7_manifest_and_jump_off_service.md",
  "docs/api/377_phase7_manifest_exposure_api.md",
  "docs/ops/377_phase7_manifest_operational_runbook.md",
  "data/analysis/377_external_reference_notes.md",
  "data/analysis/377_algorithm_alignment_notes.md",
  "data/analysis/377_manifest_route_matrix.csv",
  "data/test/377_jump_off_mapping_cases.csv",
  "data/test/377_environment_manifest_parity_cases.csv",
  "data/fixtures/377_manifest_service_resolution_examples.json",
  "tools/analysis/validate_377_phase7_manifest_service.ts",
  "tests/unit/377_manifest_repository.spec.ts",
  "tests/integration/377_jump_off_mapping_and_environment_resolution.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:377-phase7-manifest-service"] ===
    "pnpm exec tsx ./tools/analysis/validate_377_phase7_manifest_service.ts",
  "package.json missing validate:377-phase7-manifest-service script.",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_376_/m.test(checklist), "Checklist task 376 must be complete.");
invariant(
  /^- \[(?:-|X)\] par_377_/m.test(checklist),
  "Checklist task 377 must be claimed or complete while validator runs.",
);

const phase7Registry = readJson<{
  launchVerdict?: string;
  tracks?: JsonRecord[];
}>("data/contracts/373_phase7_track_readiness_registry.json");
invariant(
  phase7Registry.launchVerdict === "open_phase7_with_constraints",
  "373 launch verdict must remain open_phase7_with_constraints.",
);
const par377Track = asArray<JsonRecord>(phase7Registry.tracks, "phase7Registry.tracks").find(
  (track) => track.trackId === "par_377",
);
invariant(par377Track?.readinessState === "ready", "par_377 must remain ready in 373 registry.");
invariant(
  par377Track?.launchPacketRef === "data/launchpacks/373_track_launch_packet_377.json",
  "par_377 launch packet drifted.",
);

const launchPacket = readJson<{
  targetTrack?: string;
  launchState?: string;
  mustProduce?: string[];
  constraints?: string[];
}>("data/launchpacks/373_track_launch_packet_377.json");
invariant(launchPacket.targetTrack === "par_377", "Launch packet target drifted.");
invariant(launchPacket.launchState === "ready", "Launch packet must be ready.");
requireArrayIncludes(
  launchPacket.mustProduce,
  [
    "ManifestRepository",
    "JourneyInventoryLookup",
    "JumpOffResolutionService",
    "ManifestExposureApi",
    "EnvironmentBaseUrlResolver",
  ],
  "launchPacket.mustProduce",
);
requireArrayIncludes(
  launchPacket.constraints,
  ["immutable_manifest_versions_only", "no_environment_folklore", "no_shadow_route_registry"],
  "launchPacket.constraints",
);

const manifestFixture = readJson<{ manifest?: JsonRecord }>(
  "data/fixtures/374_phase7_manifest_example.json",
);
const frozenManifest = asRecord(manifestFixture.manifest, "manifestFixture.manifest");
invariant(
  frozenManifest.manifestVersion === PHASE7_MANIFEST_VERSION,
  "377 must inherit 374 manifestVersion.",
);
invariant(
  frozenManifest.configFingerprint === PHASE7_CONFIG_FINGERPRINT,
  "377 must inherit 374 configFingerprint.",
);
invariant(
  frozenManifest.releaseApprovalFreezeRef === PHASE7_RELEASE_APPROVAL_FREEZE_REF,
  "377 must inherit 374 releaseApprovalFreezeRef.",
);

const routeIds = phase7ManifestExposureRoutes.map((route) => route.routeId);
for (const routeId of [
  "phase7_nhs_app_manifest_current",
  "phase7_nhs_app_journey_path_lookup",
  "phase7_nhs_app_jump_off_resolve",
  "phase7_nhs_app_environment_resolve",
  "phase7_nhs_app_onboarding_evidence_refs",
] as const) {
  invariant(routeIds.includes(routeId), `Manifest exposure route missing ${routeId}.`);
  invariant(
    serviceDefinition.routeCatalog.some((route) => route.routeId === routeId),
    `command-api serviceDefinition missing ${routeId}.`,
  );
}

const app = createDefaultPhase7NhsAppManifestApplication();
const environment = app.resolveEnvironment({
  environment: "sandpit",
  expectedManifestVersion: PHASE7_MANIFEST_VERSION,
  expectedConfigFingerprint: PHASE7_CONFIG_FINGERPRINT,
  expectedReleaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
});
invariant(environment.parityState === "matching", "Sandpit environment tuple must match.");
invariant(
  environment.baseUrl === "https://sandpit.vecells.invalid/nhs-app",
  "Sandpit base URL drifted.",
);

const exposure = app.getManifestExposure({
  environment: "sandpit",
  expectedManifestVersion: PHASE7_MANIFEST_VERSION,
  expectedConfigFingerprint: PHASE7_CONFIG_FINGERPRINT,
});
invariant(
  exposure.routes.length >= 13,
  "Manifest exposure must include first wave plus inventory.",
);
const intakeRoute = exposure.routes.find(
  (route) => route.journeyPathId === "jp_start_medical_request",
);
invariant(intakeRoute, "Manifest exposure missing medical intake route.");
invariant(
  intakeRoute.intakeConvergenceContractRef === PHASE7_INTAKE_CONVERGENCE_REF,
  "Medical intake route must retain shared intake convergence contract.",
);
invariant(
  intakeRoute.blockedReasons.includes("pending_continuity_validation"),
  "Medical intake route must surface pending continuity validation.",
);
const adaptedRoute = exposure.routes.find(
  (route) => route.journeyPathId === "jp_records_letters_summary",
);
invariant(adaptedRoute, "Manifest exposure missing records letters inventory route.");
invariant(
  adaptedRoute.exposureState === "inventory_only" &&
    adaptedRoute.blockedReasons.includes("requires_embedded_adaptation"),
  "Records route must remain inventory_only and require embedded adaptation.",
);

const resolvedJumpOff = app.resolveJumpOff({
  environment: "sandpit",
  nhsAppPlacement: "gp_services_pharmacy_status",
  odsCode: "A83001",
  releaseCohortRef: "cohort:phase7-internal-sandpit-only",
  expectedManifestVersion: PHASE7_MANIFEST_VERSION,
  expectedConfigFingerprint: PHASE7_CONFIG_FINGERPRINT,
});
invariant(resolvedJumpOff.status === "resolved", "Pharmacy status jump-off should resolve.");
invariant(
  resolvedJumpOff.jumpOffUrlTemplate ===
    "https://sandpit.vecells.invalid/nhs-app/requests/:requestId/pharmacy/status?from=nhsApp",
  "Pharmacy status jump-off URL template drifted.",
);

const blockedByContinuity = app.resolveJumpOff({
  environment: "sandpit",
  nhsAppPlacement: "gp_services_ask_gp_medical",
  odsCode: "A83001",
  releaseCohortRef: "cohort:phase7-internal-sandpit-only",
});
invariant(blockedByContinuity.status === "blocked", "Medical start must be blocked.");
invariant(
  blockedByContinuity.blockedReasons.includes("pending_continuity_validation"),
  "Medical start missing pending_continuity_validation.",
);

for (const [label, blockedReasons] of [
  [
    "not_in_manifest",
    app.resolveJumpOff({
      environment: "sandpit",
      nhsAppPlacement: "gp_services_unknown",
      odsCode: "A83001",
      releaseCohortRef: "cohort:phase7-internal-sandpit-only",
    }).blockedReasons,
  ],
  [
    "cohort_blocked",
    app.resolveJumpOff({
      environment: "sandpit",
      nhsAppPlacement: "gp_services_pharmacy_status",
      odsCode: "A83001",
      releaseCohortRef: "cohort:future-nhs-app-limited-release",
    }).blockedReasons,
  ],
  [
    "ods_rule_blocked",
    app.resolveJumpOff({
      environment: "sandpit",
      nhsAppPlacement: "gp_services_pharmacy_status",
      odsCode: "Z99999",
      releaseCohortRef: "cohort:phase7-internal-sandpit-only",
    }).blockedReasons,
  ],
  [
    "environment_mismatch",
    app.resolveJumpOff({
      environment: "aos",
      nhsAppPlacement: "gp_services_pharmacy_status",
      odsCode: "A83001",
      releaseCohortRef: "cohort:phase7-internal-sandpit-only",
    }).blockedReasons,
  ],
  [
    "config_fingerprint_mismatch",
    app.resolveJumpOff({
      environment: "sandpit",
      nhsAppPlacement: "gp_services_pharmacy_status",
      odsCode: "A83001",
      releaseCohortRef: "cohort:phase7-internal-sandpit-only",
      expectedConfigFingerprint: "sha256:drift",
    }).blockedReasons,
  ],
] as const) {
  invariant(blockedReasons.includes(label), `Jump-off case missing blocked reason ${label}.`);
}

const onboarding = app.resolveOnboardingEvidence({
  environment: "local_preview",
  expectedManifestVersion: PHASE7_MANIFEST_VERSION,
  expectedConfigFingerprint: PHASE7_CONFIG_FINGERPRINT,
});
invariant(
  onboarding.evidencePack.SCALRefs.includes("SCAL:future-nhs-app-supplier-conformance-assessment"),
  "Onboarding evidence must surface SCAL ref.",
);
invariant(
  onboarding.blockedReasons.includes("pending_continuity_validation"),
  "Onboarding evidence must surface pending continuity blockers.",
);

const currentManifest = app.repository.getManifestByVersion(PHASE7_MANIFEST_VERSION);
invariant(currentManifest, "Current manifest must exist.");
const superseding: NhsAppIntegrationManifest = {
  ...currentManifest,
  manifestId: "nhs-app-integration-manifest-377-validator-superseding",
  manifestVersion: "nhsapp-manifest-v0.1.1-validator-supersession-377",
  configFingerprint: "sha256:377-validator-supersession",
  supersedesManifestId: currentManifest.manifestId,
  changeNoticeRef: "ChangeNotice:CN-P7-377-VALIDATOR",
};
app.saveSupersedingManifest(superseding);
invariant(
  app.repository.getManifestByVersion(PHASE7_MANIFEST_VERSION)?.supersedesManifestId === null,
  "Supersession must not mutate previous manifest.",
);
invariant(
  app.repository.getManifestByVersion("nhsapp-manifest-v0.1.1-validator-supersession-377")
    ?.supersedesManifestId === currentManifest.manifestId,
  "Superseding manifest chain missing.",
);

const auditPayload = JSON.stringify(app.listAuditRecords());
invariant(!auditPayload.includes("A83001"), "Audit payload leaked raw ODS code.");
invariant(auditPayload.includes("sha256:"), "Audit payload should retain hashed identifiers.");

const jumpOffCases = readCsv("data/test/377_jump_off_mapping_cases.csv");
for (const caseId of [
  "pharmacy_status_resolves",
  "medical_start_blocks_on_continuity",
  "placement_not_in_manifest",
  "cohort_blocked",
  "ods_blocked",
  "environment_blocked_for_internal_cohort",
  "config_fingerprint_mismatch",
] as const) {
  invariant(
    jumpOffCases.some((row) => row.caseId === caseId),
    `Jump-off mapping cases missing ${caseId}.`,
  );
}

const parityCases = readCsv("data/test/377_environment_manifest_parity_cases.csv");
for (const environmentName of [
  "local_preview",
  "sandpit",
  "aos",
  "limited_release",
  "full_release",
] as const) {
  invariant(
    parityCases.some(
      (row) => row.environment === environmentName && row.expectedParityState === "matching",
    ),
    `Environment parity cases missing matching row for ${environmentName}.`,
  );
}
invariant(
  parityCases.some((row) => row.expectedBlockedReason === "manifest_version_mismatch"),
  "Environment parity cases missing manifest_version_mismatch.",
);
invariant(
  parityCases.some((row) => row.expectedBlockedReason === "config_fingerprint_mismatch"),
  "Environment parity cases missing config_fingerprint_mismatch.",
);

const routeMatrix = readCsv("data/analysis/377_manifest_route_matrix.csv");
invariant(routeMatrix.length >= 13, "Manifest route matrix must include all route inventory rows.");
for (const routeId of [
  "jp_start_medical_request",
  "jp_start_admin_request",
  "jp_continue_draft",
  "jp_request_status",
  "jp_respond_more_info",
  "jp_manage_local_appointment",
  "jp_pharmacy_choice",
  "jp_pharmacy_status",
] as const) {
  invariant(
    routeMatrix.some((row) => row.journeyPathId === routeId),
    `Manifest route matrix missing first-wave route ${routeId}.`,
  );
}

const fixture = readJson<{ examples?: JsonRecord[] }>(
  "data/fixtures/377_manifest_service_resolution_examples.json",
);
requireArrayIncludes(
  asArray<JsonRecord>(fixture.examples, "fixture.examples").map((example) =>
    String(example.scenarioId),
  ),
  ["trusted_pharmacy_status_jump_off", "start_medical_waits_for_continuity"],
  "377 resolution fixture scenarios",
);

const externalNotes = readText("data/analysis/377_external_reference_notes.md");
for (const url of [
  "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration",
] as const) {
  requireIncludes(externalNotes, url, "377 external reference notes");
}
requireIncludes(externalNotes, "Rejected", "377 external reference notes");
requireIncludes(externalNotes, "Deferred", "377 external reference notes");

const docs = [
  "docs/architecture/377_phase7_manifest_and_jump_off_service.md",
  "docs/api/377_phase7_manifest_exposure_api.md",
  "docs/ops/377_phase7_manifest_operational_runbook.md",
  "data/analysis/377_algorithm_alignment_notes.md",
]
  .map((relativePath) => readText(relativePath))
  .join("\n");
for (const term of [
  "NHSAppIntegrationManifest",
  "JourneyPathDefinition",
  "JumpOffMapping",
  "manifestVersion",
  "configFingerprint",
  "RouteFreezeDisposition",
  "IntakeConvergenceContract",
  "pending_continuity_validation",
] as const) {
  requireIncludes(docs, term, "377 docs and algorithm notes");
}

console.log("377 Phase 7 manifest and jump-off service validated.");
