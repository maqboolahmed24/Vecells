import fs from "node:fs";
import path from "node:path";

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

function requireRequiredFields(schemaPath: string, fields: readonly string[]): void {
  const schema = readJson<{ $id?: string; required?: string[] }>(schemaPath);
  invariant(typeof schema.$id === "string" && schema.$id.length > 0, `${schemaPath} missing $id.`);
  const required = asArray<string>(schema.required, `${schemaPath}.required`);
  for (const field of fields) {
    invariant(required.includes(field), `${schemaPath} missing required field ${field}.`);
  }
}

const MANIFEST_VERSION = "nhsapp-manifest-v0.1.0-freeze-374";
const CONFIG_FINGERPRINT = "sha256:374-manifest-tuples-f488ecd-local-freeze-v1";
const RELEASE_APPROVAL_FREEZE_REF = "ReleaseApprovalFreeze:RAF-P7-374-CONTRACT-FREEZE";
const INTAKE_CONVERGENCE_REF = "IntakeConvergenceContract:phase1-browser-and-nhsapp-shared-v1";

const REQUIRED_FILES = [
  "docs/architecture/374_phase7_nhs_app_manifest_and_inventory_contracts.md",
  "docs/api/374_phase7_manifest_and_jump_off_api.md",
  "docs/policy/374_phase7_manifest_change_control_and_onboarding_rules.md",
  "data/contracts/374_phase7_nhs_app_integration_manifest_schema.json",
  "data/contracts/374_phase7_journey_path_registry.json",
  "data/contracts/374_phase7_jump_off_mapping_schema.json",
  "data/contracts/374_phase7_integration_evidence_pack_schema.json",
  "data/contracts/374_phase7_service_desk_profile_schema.json",
  "data/contracts/374_phase7_manifest_promotion_bundle_schema.json",
  "data/contracts/374_phase7_continuity_evidence_bundle_schema.json",
  "data/contracts/374_phase7_environment_base_url_registry.json",
  "data/fixtures/374_phase7_manifest_example.json",
  "data/fixtures/374_phase7_route_inventory_examples.json",
  "data/analysis/374_external_reference_notes.json",
  "data/analysis/374_phase7_route_inventory_matrix.csv",
  "data/analysis/374_phase7_environment_parity_matrix.csv",
  "data/analysis/374_phase7_manifest_tuple_matrix.csv",
  "tools/analysis/validate_374_phase7_manifest_and_inventory_contracts.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:374-phase7-manifest-and-inventory-contracts"] ===
    "pnpm exec tsx ./tools/analysis/validate_374_phase7_manifest_and_inventory_contracts.ts",
  "package.json missing validate:374-phase7-manifest-and-inventory-contracts script.",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] seq_373_/m.test(checklist), "Checklist task 373 must be complete.");
invariant(
  /^- \[(?:-|X)\] par_374_/m.test(checklist),
  "Checklist task 374 must be claimed or complete while validator runs.",
);

const phase7Registry = readJson<{
  launchVerdict?: string;
  tracks?: JsonRecord[];
}>("data/contracts/373_phase7_track_readiness_registry.json");
invariant(
  phase7Registry.launchVerdict === "open_phase7_with_constraints",
  "373 gate must remain open_phase7_with_constraints.",
);
const par374Track = asArray<JsonRecord>(phase7Registry.tracks, "phase7Registry.tracks").find(
  (track) => track.trackId === "par_374",
);
invariant(par374Track?.readinessState === "ready", "par_374 must remain ready in 373 registry.");
invariant(
  par374Track?.launchPacketRef === "data/launchpacks/373_track_launch_packet_374.json",
  "par_374 launch packet drifted.",
);

const launchPacket = readJson<{
  targetTrack?: string;
  launchState?: string;
  mustProduce?: string[];
  constraints?: string[];
}>("data/launchpacks/373_track_launch_packet_374.json");
invariant(launchPacket.targetTrack === "par_374", "Launch packet target drifted.");
invariant(launchPacket.launchState === "ready", "Launch packet must be ready.");
for (const objectName of [
  "NHSAppIntegrationManifest",
  "JourneyPathDefinition",
  "JumpOffMapping",
  "IntegrationEvidencePack",
  "ManifestPromotionBundle",
  "NHSAppContinuityEvidenceBundle",
  "ServiceDeskProfile",
] as const) {
  invariant(
    asArray<string>(launchPacket.mustProduce, "launchPacket.mustProduce").includes(objectName),
    `Launch packet missing ${objectName}.`,
  );
}
for (const constraint of [
  "open_phase7_with_constraints",
  "manifest_truth_governs_route_exposure",
  "do_not_claim_live_partner_approval",
] as const) {
  invariant(
    asArray<string>(launchPacket.constraints, "launchPacket.constraints").includes(constraint),
    `Launch packet missing constraint ${constraint}.`,
  );
}

const manifestFields = [
  "manifestId",
  "manifestVersion",
  "baseUrlsByEnvironment",
  "allowedJourneyPaths",
  "jumpOffMappings",
  "requiresNhsLogin",
  "supportsEmbeddedMode",
  "minimumBridgeCapabilitiesRef",
  "telemetryContractRef",
  "cohortRules",
  "serviceDeskProfileRef",
  "evidencePackRef",
  "configFingerprint",
  "releaseCandidateRef",
  "releaseApprovalFreezeRef",
  "behaviorContractSetRef",
  "surfaceSchemaSetRef",
  "compatibilityEvidenceRef",
  "approvedAt",
  "supersedesManifestId",
  "changeNoticeRef",
  "currentReleaseState",
] as const;

const journeyFields = [
  "journeyPathId",
  "routePattern",
  "journeyType",
  "requiresAuth",
  "minimumAssuranceLevel",
  "supportsResume",
  "supportsDeepLink",
  "embeddedReadinessState",
  "minimumBridgeCapabilitiesRef",
  "embeddedNavEligibilityContractRef",
  "fallbackRoute",
  "routeOwner",
  "changeClass",
  "channelFallbackBehaviour",
  "shellConsistencyProfileRef",
  "visibilityTierRef",
  "summarySafetyTier",
  "placeholderContractRef",
  "requiresStepUpForFullDetail",
  "continuityControlCode",
  "continuityEvidenceContractRef",
  "intakeConvergenceContractRef",
  "outboundNavigationPolicyRef",
  "artifactPresentationContractRef",
  "routeFreezeDispositionRef",
] as const;

requireRequiredFields(
  "data/contracts/374_phase7_nhs_app_integration_manifest_schema.json",
  manifestFields,
);
requireRequiredFields("data/contracts/374_phase7_jump_off_mapping_schema.json", [
  "mappingId",
  "nhsAppPlacement",
  "odsVisibilityRule",
  "journeyPathId",
  "copyVariantRef",
  "releaseCohortRef",
]);
requireRequiredFields("data/contracts/374_phase7_integration_evidence_pack_schema.json", [
  "evidencePackId",
  "demoEnvironmentUrl",
  "uxAuditRefs",
  "clinicalSafetyRefs",
  "privacyRefs",
  "SCALRefs",
  "incidentRunbookRefs",
]);
requireRequiredFields("data/contracts/374_phase7_service_desk_profile_schema.json", [
  "serviceDeskProfileId",
  "publicFacingContactMethods",
  "documentedSupportHours",
  "majorIncidentContactPath",
  "clinicalSafetyContactRef",
  "serviceManagementProtocolRef",
  "lastReviewedAt",
]);
requireRequiredFields("data/contracts/374_phase7_manifest_promotion_bundle_schema.json", [
  "bundleId",
  "manifestVersion",
  "environment",
  "configFingerprint",
  "releaseCandidateRef",
  "releaseApprovalFreezeRef",
  "behaviorContractSetRef",
  "surfaceSchemaSetRef",
  "compatibilityEvidenceRef",
  "approvedBy",
  "promotedAt",
  "rollbackRef",
]);
requireRequiredFields("data/contracts/374_phase7_continuity_evidence_bundle_schema.json", [
  "bundleId",
  "manifestVersionRef",
  "journeyPathRef",
  "continuityControlCode",
  "governingContractRef",
  "experienceContinuityEvidenceRefs",
  "validationState",
  "blockingRefs",
  "releaseApprovalFreezeRef",
  "capturedAt",
]);

const journeyRegistry = readJson<{
  taskId?: string;
  schemaVersion?: string;
  classificationAllowedValues?: string[];
  summary?: JsonRecord;
  journeyPaths?: JsonRecord[];
}>("data/contracts/374_phase7_journey_path_registry.json");
invariant(journeyRegistry.taskId === "par_374", "Journey registry task drifted.");
invariant(
  journeyRegistry.schemaVersion === "374.phase7.manifest-inventory.v1",
  "Journey registry schema version drifted.",
);

const allowedClassifications = new Set(
  asArray<string>(
    journeyRegistry.classificationAllowedValues,
    "journeyRegistry.classificationAllowedValues",
  ),
);
for (const classification of [
  "safe_for_nhs_app_now",
  "needs_embedded_adaptation_first",
  "not_suitable_in_phase7",
] as const) {
  invariant(
    allowedClassifications.has(classification),
    `Allowed classifications missing ${classification}.`,
  );
}

const journeyPaths = asArray<JsonRecord>(
  journeyRegistry.journeyPaths,
  "journeyRegistry.journeyPaths",
);
invariant(
  journeyPaths.length >= 13,
  "Journey registry must cover at least 13 patient-facing route families.",
);

const routeMap = new Map(journeyPaths.map((route) => [String(route.journeyPathId), route]));
for (const requiredRoute of [
  "jp_start_medical_request",
  "jp_start_admin_request",
  "jp_continue_draft",
  "jp_request_status",
  "jp_respond_more_info",
  "jp_manage_local_appointment",
  "jp_waitlist_offer_response",
  "jp_hub_alternative_offer",
  "jp_pharmacy_choice",
  "jp_pharmacy_status",
] as const) {
  invariant(
    routeMap.has(requiredRoute),
    `Journey registry missing required route ${requiredRoute}.`,
  );
}

const classificationCounts = new Map<string, number>();
for (const route of journeyPaths) {
  for (const field of journeyFields) {
    invariant(
      route[field] !== undefined,
      `Journey ${String(route.journeyPathId)} missing ${field}.`,
    );
  }
  const classification = String(route.classification);
  invariant(
    allowedClassifications.has(classification),
    `Journey ${String(route.journeyPathId)} has invalid classification.`,
  );
  classificationCounts.set(classification, (classificationCounts.get(classification) ?? 0) + 1);
  invariant(
    String(route.artifactPresentationContractRef).startsWith("ArtifactPresentationContract:"),
    `Journey ${String(route.journeyPathId)} must bind ArtifactPresentationContract.`,
  );
  invariant(
    String(route.routeFreezeDispositionRef).startsWith("RouteFreezeDisposition:"),
    `Journey ${String(route.journeyPathId)} must bind RouteFreezeDisposition.`,
  );
}
invariant(
  (classificationCounts.get("safe_for_nhs_app_now") ?? 0) >= 8,
  "Expected at least eight safe route families.",
);
invariant(
  (classificationCounts.get("needs_embedded_adaptation_first") ?? 0) >= 4,
  "Expected adaptation-first route families.",
);
invariant(
  (classificationCounts.get("not_suitable_in_phase7") ?? 0) >= 1,
  "Expected at least one not-suitable route family.",
);

for (const intakeRoute of [
  "jp_start_medical_request",
  "jp_start_admin_request",
  "jp_continue_draft",
] as const) {
  const route = routeMap.get(intakeRoute);
  invariant(
    route?.classification === "safe_for_nhs_app_now",
    `${intakeRoute} must be safe for first-wave candidate inclusion.`,
  );
  invariant(
    route?.intakeConvergenceContractRef === INTAKE_CONVERGENCE_REF,
    `${intakeRoute} must bind shared intake convergence.`,
  );
  invariant(
    route?.continuityControlCode === "intake_resume",
    `${intakeRoute} must bind intake resume continuity.`,
  );
}

const manifestFixture = readJson<{ manifest?: JsonRecord }>(
  "data/fixtures/374_phase7_manifest_example.json",
);
const manifest = asRecord(manifestFixture.manifest, "manifestFixture.manifest");
for (const field of manifestFields) {
  invariant(manifest[field] !== undefined, `Manifest fixture missing ${field}.`);
}
invariant(manifest.manifestVersion === MANIFEST_VERSION, "Manifest version drifted.");
invariant(
  manifest.configFingerprint === CONFIG_FINGERPRINT,
  "Manifest config fingerprint drifted.",
);
invariant(
  manifest.releaseApprovalFreezeRef === RELEASE_APPROVAL_FREEZE_REF,
  "Manifest release approval freeze drifted.",
);
invariant(manifest.requiresNhsLogin === true, "Manifest must require NHS login.");
invariant(
  manifest.supportsEmbeddedMode === true,
  "Manifest must support embedded mode by contract.",
);
invariant(
  manifest.currentReleaseState === "contract_frozen_not_promoted",
  "Manifest must remain contract_frozen_not_promoted.",
);

const allowedJourneyPaths = asArray<string>(
  manifest.allowedJourneyPaths,
  "manifest.allowedJourneyPaths",
);
invariant(
  allowedJourneyPaths.length >= 8,
  "Manifest must include first-wave allowed journey paths.",
);
for (const journeyPathId of allowedJourneyPaths) {
  const route = routeMap.get(journeyPathId);
  invariant(route, `Manifest allowed journey path ${journeyPathId} missing from registry.`);
  invariant(
    route.classification === "safe_for_nhs_app_now",
    `Manifest may only allow safe routes: ${journeyPathId}.`,
  );
}

const jumpOffMappings = asArray<JsonRecord>(manifest.jumpOffMappings, "manifest.jumpOffMappings");
invariant(jumpOffMappings.length >= 6, "Manifest must include explicit jump-off mappings.");
for (const mapping of jumpOffMappings) {
  for (const field of [
    "mappingId",
    "nhsAppPlacement",
    "odsVisibilityRule",
    "journeyPathId",
    "copyVariantRef",
    "releaseCohortRef",
  ] as const) {
    invariant(mapping[field] !== undefined, `Jump-off mapping missing ${field}.`);
  }
  const route = routeMap.get(String(mapping.journeyPathId));
  invariant(
    route?.classification === "safe_for_nhs_app_now",
    `Jump-off mapping references unsafe route ${String(mapping.journeyPathId)}.`,
  );
  invariant(
    String(mapping.odsVisibilityRule).startsWith("ods_rule_"),
    `Jump-off mapping ${String(mapping.mappingId)} needs ODS visibility rule.`,
  );
}

const environmentRegistry = readJson<{
  manifestVersion?: string;
  configFingerprint?: string;
  releaseApprovalFreezeRef?: string;
  environments?: JsonRecord[];
  environmentParityAssertions?: string[];
}>("data/contracts/374_phase7_environment_base_url_registry.json");
invariant(
  environmentRegistry.manifestVersion === MANIFEST_VERSION,
  "Environment registry manifest version drifted.",
);
invariant(
  environmentRegistry.configFingerprint === CONFIG_FINGERPRINT,
  "Environment registry fingerprint drifted.",
);
invariant(
  environmentRegistry.releaseApprovalFreezeRef === RELEASE_APPROVAL_FREEZE_REF,
  "Environment registry freeze ref drifted.",
);
const environments = asArray<JsonRecord>(
  environmentRegistry.environments,
  "environmentRegistry.environments",
);
invariant(environments.length === 5, "Environment registry must include five environments.");

const baseUrlsByEnvironment = asRecord(
  manifest.baseUrlsByEnvironment,
  "manifest.baseUrlsByEnvironment",
);
for (const expectedEnvironment of [
  "local_preview",
  "sandpit",
  "aos",
  "limited_release",
  "full_release",
] as const) {
  const row = environments.find((environment) => environment.environment === expectedEnvironment);
  invariant(row, `Environment registry missing ${expectedEnvironment}.`);
  invariant(
    row.manifestVersion === MANIFEST_VERSION,
    `${expectedEnvironment} manifest version drifted.`,
  );
  invariant(
    row.configFingerprint === CONFIG_FINGERPRINT,
    `${expectedEnvironment} config fingerprint drifted.`,
  );
  invariant(
    row.baseUrl === baseUrlsByEnvironment[expectedEnvironment],
    `${expectedEnvironment} base URL does not match manifest.`,
  );
  invariant(
    row.driftDisposition === "block_without_superseding_manifest",
    `${expectedEnvironment} must block drift.`,
  );
}
invariant(
  asArray<string>(
    environmentRegistry.environmentParityAssertions,
    "environmentRegistry.environmentParityAssertions",
  ).length >= 5,
  "Environment registry must spell out parity assertions.",
);

const routeMatrix = readCsv("data/analysis/374_phase7_route_inventory_matrix.csv");
invariant(
  routeMatrix.length === journeyPaths.length,
  "Route matrix row count must match registry route count.",
);
for (const route of journeyPaths) {
  const row = routeMatrix.find((candidate) => candidate.journeyPathId === route.journeyPathId);
  invariant(row, `Route matrix missing ${String(route.journeyPathId)}.`);
  invariant(
    row.classification === route.classification,
    `Route matrix classification drift for ${String(route.journeyPathId)}.`,
  );
}
for (const gap of [
  "route_exists_is_not_eligibility",
  "embedded_intake_binds_same_intake_convergence_contract",
  "partial_visibility_included_in_manifest",
  "continuity_evidence_required_at_promotion",
] as const) {
  invariant(
    routeMatrix.some((row) => String(row.gapClosureRefs).includes(gap)),
    `Route matrix missing gap closure ${gap}.`,
  );
}

const environmentMatrix = readCsv("data/analysis/374_phase7_environment_parity_matrix.csv");
invariant(
  environmentMatrix.length === environments.length,
  "Environment matrix row count must match registry.",
);
for (const row of environmentMatrix) {
  invariant(
    row.manifestVersion === MANIFEST_VERSION,
    `Environment matrix manifest drift in ${String(row.environment)}.`,
  );
  invariant(
    row.configFingerprint === CONFIG_FINGERPRINT,
    `Environment matrix fingerprint drift in ${String(row.environment)}.`,
  );
  invariant(
    row.parityState === "matching",
    `Environment matrix parity must be matching for ${String(row.environment)}.`,
  );
}

const tupleMatrix = readCsv("data/analysis/374_phase7_manifest_tuple_matrix.csv");
for (const tupleKey of [
  "manifestVersion",
  "configFingerprint",
  "releaseCandidateRef",
  "releaseApprovalFreezeRef",
  "behaviorContractSetRef",
  "surfaceSchemaSetRef",
  "compatibilityEvidenceRef",
  "routeInventoryRef",
  "continuityEvidenceRequired",
] as const) {
  const row = tupleMatrix.find((candidate) => candidate.tupleKey === tupleKey);
  invariant(row, `Tuple matrix missing ${tupleKey}.`);
  for (const environment of [
    "local_preview",
    "sandpit",
    "aos",
    "limited_release",
    "full_release",
  ] as const) {
    invariant(row[environment] === row.tupleValue, `Tuple ${tupleKey} drifts in ${environment}.`);
  }
}

const routeExamples = readJson<{ routeInventoryExamples?: JsonRecord[] }>(
  "data/fixtures/374_phase7_route_inventory_examples.json",
);
const exampleIds = new Set(
  asArray<JsonRecord>(
    routeExamples.routeInventoryExamples,
    "routeExamples.routeInventoryExamples",
  ).map((example) => String(example.journeyPathId)),
);
for (const requiredExample of [
  "jp_start_medical_request",
  "jp_continue_draft",
  "jp_request_status",
  "jp_respond_more_info",
  "jp_manage_local_appointment",
  "jp_waitlist_offer_response",
  "jp_hub_alternative_offer",
  "jp_pharmacy_choice",
  "jp_pharmacy_status",
] as const) {
  invariant(exampleIds.has(requiredExample), `Route examples missing ${requiredExample}.`);
}

const externalNotes = readJson<{
  officialSources?: JsonRecord[];
  rejectedOrDeferred?: JsonRecord[];
}>("data/analysis/374_external_reference_notes.json");
const sourceUrls = asArray<JsonRecord>(
  externalNotes.officialSources,
  "externalNotes.officialSources",
).map((source) => String(source.url));
for (const officialUrl of [
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-integration-expression-of-interest-form",
  "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-overview/",
  "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
  "https://service-manual.nhs.uk/accessibility/testing",
] as const) {
  invariant(
    sourceUrls.includes(officialUrl),
    `External notes missing official source ${officialUrl}.`,
  );
}
invariant(
  asArray<JsonRecord>(externalNotes.rejectedOrDeferred, "externalNotes.rejectedOrDeferred").some(
    (decision) => decision.claim === "local manifest approval equals NHS App team approval",
  ),
  "External notes must reject local approval as partner approval.",
);

const architectureDoc = readText(
  "docs/architecture/374_phase7_nhs_app_manifest_and_inventory_contracts.md",
);
for (const requiredTerm of [
  "NHSAppIntegrationManifest",
  "JourneyPathDefinition",
  "JumpOffMapping",
  "open_phase7_with_constraints",
  "contract_frozen_not_promoted",
  "IntakeConvergenceContract",
]) {
  requireIncludes(architectureDoc, requiredTerm, "architecture doc");
}

const apiDoc = readText("docs/api/374_phase7_manifest_and_jump_off_api.md");
for (const requiredTerm of [
  "MANIFEST_TUPLE_DRIFT",
  "JOURNEY_PATH_NOT_ELIGIBLE",
  "CONTINUITY_EVIDENCE_MISSING",
]) {
  requireIncludes(apiDoc, requiredTerm, "API doc");
}

const policyDoc = readText(
  "docs/policy/374_phase7_manifest_change_control_and_onboarding_rules.md",
);
for (const requiredTerm of [
  "Route existence is not eligibility",
  "same manifest tuple",
  "SCAL",
  "connection agreement",
]) {
  requireIncludes(policyDoc, requiredTerm, "policy doc");
}

console.log(
  JSON.stringify(
    {
      taskId: "par_374",
      verdict: "pass",
      manifestVersion: MANIFEST_VERSION,
      routeFamilies: journeyPaths.length,
      safeRoutes: classificationCounts.get("safe_for_nhs_app_now"),
      environments: environments.length,
      officialSources: sourceUrls.length,
    },
    null,
    2,
  ),
);
