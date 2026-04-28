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

const MANIFEST_VERSION = "nhsapp-manifest-v0.1.0-freeze-374";
const CONFIG_FINGERPRINT = "sha256:374-manifest-tuples-f488ecd-local-freeze-v1";
const RELEASE_CANDIDATE_REF = "release-candidate:phase7-nhs-app-contract-freeze-374";
const RELEASE_APPROVAL_FREEZE_REF = "ReleaseApprovalFreeze:RAF-P7-374-CONTRACT-FREEZE";
const BEHAVIOR_CONTRACT_SET_REF = "BehaviorContractSet:phase7-nhs-app-first-wave";
const SURFACE_SCHEMA_SET_REF = "SurfaceSchemaSet:phase7-patient-routes-v1";
const COMPATIBILITY_EVIDENCE_REF = "CompatibilityEvidence:phase7-bridge-floor-freeze-374";
const MINIMUM_BRIDGE_REF = "MinimumBridgeCapabilities:phase7-embedded-floor-375-pending";
const NAV_ELIGIBILITY_REF = "PatientEmbeddedNavEligibility:phase7-nav-floor-375-pending";

const FIRST_WAVE_ROUTES = [
  "jp_start_medical_request",
  "jp_start_admin_request",
  "jp_continue_draft",
  "jp_request_status",
  "jp_respond_more_info",
  "jp_manage_local_appointment",
  "jp_pharmacy_choice",
  "jp_pharmacy_status",
] as const;

const UI_STATE_KINDS = ["loading", "empty", "warning", "success", "error"] as const;

const REQUIRED_FILES = [
  "docs/architecture/376_phase7_artifact_accessibility_and_guardrail_contracts.md",
  "docs/api/376_phase7_embedded_artifact_and_guardrail_api.md",
  "docs/policy/376_phase7_webview_limit_accessibility_and_release_rules.md",
  "docs/accessibility/376_phase7_embedded_accessibility_contracts.md",
  "data/contracts/376_phase7_binary_artifact_delivery_schema.json",
  "data/contracts/376_phase7_artifact_byte_grant_schema.json",
  "data/contracts/376_phase7_embedded_error_contract_registry.json",
  "data/contracts/376_phase7_channel_degraded_mode_schema.json",
  "data/contracts/376_phase7_ui_state_contract_registry.json",
  "data/contracts/376_phase7_accessibility_semantic_coverage_profile_schema.json",
  "data/contracts/376_phase7_visualization_fallback_contract_registry.json",
  "data/contracts/376_phase7_environment_profile_schema.json",
  "data/contracts/376_phase7_channel_telemetry_contract_registry.json",
  "data/contracts/376_phase7_scal_bundle_schema.json",
  "data/contracts/376_phase7_release_guardrail_policy_schema.json",
  "data/contracts/376_phase7_channel_release_freeze_record_schema.json",
  "data/contracts/376_phase7_route_freeze_policy_matrix.json",
  "data/fixtures/376_phase7_artifact_fallback_examples.json",
  "data/fixtures/376_phase7_release_freeze_examples.json",
  "data/fixtures/376_phase7_embedded_error_copy_examples.json",
  "data/analysis/376_external_reference_notes.json",
  "data/analysis/376_phase7_artifact_mode_matrix.csv",
  "data/analysis/376_phase7_accessibility_coverage_matrix.csv",
  "data/analysis/376_phase7_rollout_guardrail_matrix.csv",
  "tools/analysis/validate_376_phase7_artifact_accessibility_and_guardrail_contracts.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:376-phase7-artifact-accessibility-and-guardrail-contracts"] ===
    "pnpm exec tsx ./tools/analysis/validate_376_phase7_artifact_accessibility_and_guardrail_contracts.ts",
  "package.json missing validate:376-phase7-artifact-accessibility-and-guardrail-contracts script.",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_375_/m.test(checklist), "Checklist task 375 must be complete.");
invariant(
  /^- \[(?:-|X)\] par_376_/m.test(checklist),
  "Checklist task 376 must be claimed or complete while validator runs.",
);

const phase7Registry = readJson<{
  launchVerdict?: string;
  tracks?: JsonRecord[];
}>("data/contracts/373_phase7_track_readiness_registry.json");
invariant(
  phase7Registry.launchVerdict === "open_phase7_with_constraints",
  "373 gate must remain open_phase7_with_constraints.",
);
const par376Track = asArray<JsonRecord>(phase7Registry.tracks, "phase7Registry.tracks").find(
  (track) => track.trackId === "par_376",
);
invariant(par376Track?.readinessState === "ready", "par_376 must remain ready in 373 registry.");
invariant(
  par376Track?.launchPacketRef === "data/launchpacks/373_track_launch_packet_376.json",
  "par_376 launch packet drifted.",
);

const launchPacket = readJson<{
  targetTrack?: string;
  launchState?: string;
  mustProduce?: string[];
  constraints?: string[];
}>("data/launchpacks/373_track_launch_packet_376.json");
invariant(launchPacket.targetTrack === "par_376", "Launch packet target drifted.");
invariant(launchPacket.launchState === "ready", "Launch packet must be ready.");
requireArrayIncludes(
  launchPacket.mustProduce,
  [
    "BinaryArtifactDelivery",
    "ArtifactByteGrant",
    "EmbeddedErrorContract",
    "ChannelDegradedMode",
    "AccessibilitySemanticCoverageProfile",
    "ChannelTelemetryPlan",
    "SCALBundle",
    "ReleaseGuardrailPolicy",
    "ChannelReleaseFreezeRecord",
  ],
  "launchPacket.mustProduce",
);
requireArrayIncludes(
  launchPacket.constraints,
  [
    "manual_assistive_testing_required_before_nhs_app_limited_release",
    "SCAL_and_clinical_safety_signoff_required_before_go_live",
    "live_rollback_rehearsal_required_before_widening",
  ],
  "launchPacket.constraints",
);

const carryForwardLedger = readJson<{ carryForwards?: JsonRecord[] }>(
  "data/analysis/372_phase6_carry_forward_ledger.json",
);
const carryForwardIds = asArray<JsonRecord>(
  carryForwardLedger.carryForwards,
  "carryForwardLedger.carryForwards",
).map((entry) => entry.carryForwardId);
for (const carryForwardId of ["CF372_003", "CF372_004", "CF372_006"] as const) {
  invariant(carryForwardIds.includes(carryForwardId), `Missing carry-forward ${carryForwardId}.`);
}

const environmentRegistry = readJson<JsonRecord>(
  "data/contracts/374_phase7_environment_base_url_registry.json",
);
invariant(
  environmentRegistry.manifestVersion === MANIFEST_VERSION,
  "376 must inherit 374 manifestVersion.",
);
invariant(
  environmentRegistry.configFingerprint === CONFIG_FINGERPRINT,
  "376 must inherit 374 configFingerprint.",
);
invariant(
  environmentRegistry.releaseCandidateRef === RELEASE_CANDIDATE_REF,
  "376 must inherit 374 releaseCandidateRef.",
);
invariant(
  environmentRegistry.releaseApprovalFreezeRef === RELEASE_APPROVAL_FREEZE_REF,
  "376 must inherit 374 releaseApprovalFreezeRef.",
);
invariant(
  environmentRegistry.behaviorContractSetRef === BEHAVIOR_CONTRACT_SET_REF,
  "376 must inherit 374 behaviorContractSetRef.",
);
invariant(
  environmentRegistry.surfaceSchemaSetRef === SURFACE_SCHEMA_SET_REF,
  "376 must inherit 374 surfaceSchemaSetRef.",
);
invariant(
  environmentRegistry.compatibilityEvidenceRef === COMPATIBILITY_EVIDENCE_REF,
  "376 must inherit 374 compatibilityEvidenceRef.",
);

const bridgeRegistry = readJson<JsonRecord>(
  "data/contracts/375_phase7_bridge_capability_floor_registry.json",
);
invariant(
  bridgeRegistry.minimumBridgeCapabilitiesRef === MINIMUM_BRIDGE_REF,
  "376 must inherit 375 minimum bridge capability ref.",
);

requireRequiredFields("data/contracts/376_phase7_binary_artifact_delivery_schema.json", [
  "artifactId",
  "artifactType",
  "artifactSurfaceContextRef",
  "artifactModeTruthProjectionRef",
  "deliveryMode",
  "byteGrantRef",
  "mimeType",
  "filename",
  "contentLengthBytes",
  "checksum",
  "cachePolicy",
  "watermarkMode",
  "ttl",
  "accessScope",
  "channelProfile",
  "selectedAnchorRef",
  "returnContractRef",
  "deliveryState",
  "deliveryTupleHash",
]);
requireRequiredFields("data/contracts/376_phase7_artifact_byte_grant_schema.json", [
  "grantId",
  "artifactId",
  "artifactSurfaceContextRef",
  "artifactModeTruthProjectionRef",
  "bridgeCapabilityMatrixRef",
  "patientEmbeddedNavEligibilityRef",
  "selectedAnchorRef",
  "returnContractRef",
  "expiresAt",
  "maxDownloads",
  "maxBytes",
  "subjectBindingMode",
  "issuedBy",
  "grantState",
  "tupleHash",
]);
requireRequiredFields("data/contracts/376_phase7_channel_degraded_mode_schema.json", [
  "modeId",
  "patientDegradedModeProjectionRef",
  "routeFreezeDispositionRef",
  "releaseRecoveryDispositionRef",
  "affectedRoutes",
  "copyVariant",
  "fallbackBehaviour",
  "noticeCopyRef",
  "primaryActionRef",
  "supportCodeRef",
  "activationRule",
  "killSwitchRef",
  "activatedAt",
]);
requireRequiredFields(
  "data/contracts/376_phase7_accessibility_semantic_coverage_profile_schema.json",
  [
    "profileId",
    "journeyPathRef",
    "accessibleContentVariantRefs",
    "auditEvidenceRefs",
    "uiStateContractRefs",
    "keyboardInteractionContractRef",
    "focusTransitionContractRef",
    "assistiveAnnouncementContractRef",
    "timeoutRecoveryContractRef",
    "freshnessAccessibilityContractRef",
    "automationAnchorProfileRef",
    "surfaceStateSemanticsProfileRef",
    "designContractPublicationBundleRef",
    "visualizationFallbackContractRef",
    "visualizationTableContractRef",
    "manualAssistiveTestingState",
    "deviceLabTestingState",
    "coverageState",
    "lastEvaluatedAt",
  ],
);
requireRequiredFields("data/contracts/376_phase7_environment_profile_schema.json", [
  "environment",
  "baseUrl",
  "journeyPaths",
  "ssoConfigRef",
  "siteLinkConfigRef",
  "telemetryNamespace",
  "allowedCohorts",
  "releaseCandidateRef",
  "releaseApprovalFreezeRef",
  "behaviorContractSetRef",
  "surfaceSchemaSetRef",
  "compatibilityEvidenceRef",
  "watchTupleHash",
  "guardrailPolicyRef",
  "stabilizationCriteriaRef",
  "manifestVersion",
  "configFingerprint",
]);
requireRequiredFields("data/contracts/376_phase7_scal_bundle_schema.json", [
  "bundleId",
  "environment",
  "evidenceRefs",
  "owner",
  "submissionState",
]);
requireRequiredFields("data/contracts/376_phase7_release_guardrail_policy_schema.json", [
  "policyId",
  "minimumSampleSize",
  "maxAuthFailureRate",
  "maxJourneyErrorRate",
  "maxDownloadFailureRate",
  "maxSupportContactRate",
  "freezeDuration",
  "rollbackAction",
]);
requireRequiredFields("data/contracts/376_phase7_channel_release_freeze_record_schema.json", [
  "freezeRecordId",
  "manifestVersionRef",
  "releaseApprovalFreezeRef",
  "cohortRef",
  "journeyPathRefs",
  "triggerType",
  "assuranceSliceTrustRefs",
  "continuityEvidenceRefs",
  "freezeState",
  "openedAt",
  "releasedAt",
  "operatorNoteRef",
]);

const embeddedErrorRegistry = readJson<{
  embeddedErrorContracts?: JsonRecord[];
  rules?: string[];
}>("data/contracts/376_phase7_embedded_error_contract_registry.json");
const embeddedErrorContracts = asArray<JsonRecord>(
  embeddedErrorRegistry.embeddedErrorContracts,
  "embeddedErrorRegistry.embeddedErrorContracts",
);
const requiredErrorCodes = [
  "MISSING_CONTEXT",
  "INVALID_SSO_HANDOFF",
  "EXPIRED_LINK",
  "LOST_SESSION",
  "CHANNEL_UNAVAILABLE",
  "FILE_UNAVAILABLE",
  "UNSUPPORTED_ACTION_IN_APP",
  "ROUTE_FROZEN",
  "TELEMETRY_MISSING",
] as const;
const errorByCode = new Map(embeddedErrorContracts.map((entry) => [entry.errorCode, entry]));
for (const errorCode of requiredErrorCodes) {
  invariant(errorByCode.has(errorCode), `Embedded error registry missing ${errorCode}.`);
}
invariant(
  errorByCode.get("ROUTE_FROZEN")?.retryMode === "route_freeze_disposition",
  "ROUTE_FROZEN must use route_freeze_disposition.",
);
invariant(
  errorByCode.get("TELEMETRY_MISSING")?.retryMode === "route_freeze_disposition",
  "TELEMETRY_MISSING must use route_freeze_disposition.",
);
invariant(
  asArray<string>(embeddedErrorRegistry.rules, "embeddedErrorRegistry.rules").some((rule) =>
    rule.includes("generic"),
  ),
  "Embedded error registry must explicitly ban generic route freeze copy.",
);

const uiRegistry = readJson<{
  requiredStateKinds?: string[];
  uiStateContracts?: JsonRecord[];
  accessibleContentVariants?: JsonRecord[];
  auditEvidenceReferences?: JsonRecord[];
}>("data/contracts/376_phase7_ui_state_contract_registry.json");
requireArrayIncludes(
  uiRegistry.requiredStateKinds,
  UI_STATE_KINDS,
  "uiRegistry.requiredStateKinds",
);
const uiContracts = asArray<JsonRecord>(uiRegistry.uiStateContracts, "uiRegistry.uiStateContracts");
for (const routeId of FIRST_WAVE_ROUTES) {
  invariant(
    uiContracts.some((contract) =>
      asArray<string>(contract.journeyPathRefs, "uiStateContract.journeyPathRefs").includes(
        routeId,
      ),
    ),
    `UI state registry missing route ${routeId}.`,
  );
}
for (const contract of uiContracts) {
  const stateKinds = asArray<JsonRecord>(contract.states, "uiStateContract.states").map(
    (state) => state.stateKind,
  );
  for (const stateKind of UI_STATE_KINDS) {
    invariant(stateKinds.includes(stateKind), `UI state contract missing ${stateKind}.`);
  }
}
invariant(
  asArray(uiRegistry.accessibleContentVariants, "uiRegistry.accessibleContentVariants").length >= 2,
  "UI registry must include accessible content variants.",
);
const auditTypes = asArray<JsonRecord>(
  uiRegistry.auditEvidenceReferences,
  "uiRegistry.auditEvidenceReferences",
).map((entry) => entry.auditType);
for (const auditType of ["automated_accessibility", "manual_assistive_device_lab"] as const) {
  invariant(auditTypes.includes(auditType), `UI registry missing audit type ${auditType}.`);
}

const visualizationRegistry = readJson<{
  visualizationFallbackContracts?: JsonRecord[];
  visualizationTableContracts?: JsonRecord[];
  rules?: string[];
}>("data/contracts/376_phase7_visualization_fallback_contract_registry.json");
invariant(
  asArray(
    visualizationRegistry.visualizationFallbackContracts,
    "visualizationRegistry.visualizationFallbackContracts",
  ).length >= 2,
  "Visualization registry must define fallback contracts.",
);
invariant(
  asArray(
    visualizationRegistry.visualizationTableContracts,
    "visualizationRegistry.visualizationTableContracts",
  ).length >= 2,
  "Visualization registry must define table contracts.",
);
invariant(
  asArray<string>(visualizationRegistry.rules, "visualizationRegistry.rules").some((rule) =>
    rule.includes("chart-only"),
  ),
  "Visualization registry must block chart-only webview surfaces.",
);

const telemetryRegistry = readJson<{
  channelTelemetryPlan?: JsonRecord;
  telemetryEventContracts?: JsonRecord[];
  nhsAppPerformancePackTemplate?: JsonRecord;
  journeyChangeNoticeTemplate?: JsonRecord;
}>("data/contracts/376_phase7_channel_telemetry_contract_registry.json");
const channelTelemetryPlan = asRecord(
  telemetryRegistry.channelTelemetryPlan,
  "telemetryRegistry.channelTelemetryPlan",
);
requireArrayIncludes(
  channelTelemetryPlan.trackedJourneys,
  FIRST_WAVE_ROUTES,
  "channelTelemetryPlan.trackedJourneys",
);
const telemetryEventContracts = asArray<JsonRecord>(
  telemetryRegistry.telemetryEventContracts,
  "telemetryRegistry.telemetryEventContracts",
);
invariant(telemetryEventContracts.length >= 4, "Telemetry registry must define at least 4 events.");
const prohibitedTelemetryFields = [
  "rawJwt",
  "assertedLoginIdentity",
  "accessGrantToken",
  "nhsNumber",
  "phiBearingQueryString",
] as const;
for (const eventContract of telemetryEventContracts) {
  const allowedFields = asArray<string>(
    eventContract.allowedFields,
    `${String(eventContract.contractId)}.allowedFields`,
  );
  const prohibitedFields = requireArrayIncludes(
    eventContract.prohibitedFields,
    prohibitedTelemetryFields,
    `${String(eventContract.contractId)}.prohibitedFields`,
  );
  for (const prohibitedField of prohibitedFields) {
    invariant(
      !allowedFields.includes(prohibitedField),
      `${String(eventContract.contractId)} allows prohibited telemetry field ${prohibitedField}.`,
    );
  }
}
invariant(
  telemetryRegistry.nhsAppPerformancePackTemplate !== undefined,
  "Telemetry registry missing NHSAppPerformancePack template.",
);
invariant(
  telemetryRegistry.journeyChangeNoticeTemplate !== undefined,
  "Telemetry registry missing JourneyChangeNotice template.",
);

const routeFreezeMatrix = readJson<{
  manifestVersionRef?: string;
  releaseApprovalFreezeRef?: string;
  routeFreezeDispositions?: JsonRecord[];
  channelDegradedModes?: JsonRecord[];
  rules?: string[];
}>("data/contracts/376_phase7_route_freeze_policy_matrix.json");
invariant(
  routeFreezeMatrix.manifestVersionRef === MANIFEST_VERSION,
  "Route freeze matrix manifestVersionRef drifted.",
);
invariant(
  routeFreezeMatrix.releaseApprovalFreezeRef === RELEASE_APPROVAL_FREEZE_REF,
  "Route freeze matrix releaseApprovalFreezeRef drifted.",
);
const freezeDispositions = asArray<JsonRecord>(
  routeFreezeMatrix.routeFreezeDispositions,
  "routeFreezeMatrix.routeFreezeDispositions",
);
for (const routeId of FIRST_WAVE_ROUTES) {
  const disposition = freezeDispositions.find((entry) => entry.journeyPathRef === routeId);
  invariant(disposition, `Route freeze matrix missing ${routeId}.`);
  invariant(
    disposition.manifestVersionRef === MANIFEST_VERSION,
    `Route freeze disposition ${routeId} manifestVersionRef drifted.`,
  );
  invariant(
    disposition.releaseApprovalFreezeRef === RELEASE_APPROVAL_FREEZE_REF,
    `Route freeze disposition ${routeId} releaseApprovalFreezeRef drifted.`,
  );
  for (const field of ["patientMessageRef", "safeRouteRef", "supportRecoveryRef"] as const) {
    invariant(
      typeof disposition[field] === "string" && String(disposition[field]).length > 0,
      `Route freeze disposition ${routeId} missing ${field}.`,
    );
  }
}
invariant(
  asArray(routeFreezeMatrix.channelDegradedModes, "routeFreezeMatrix.channelDegradedModes")
    .length >= 1,
  "Route freeze matrix missing ChannelDegradedMode binding.",
);
invariant(
  asArray<string>(routeFreezeMatrix.rules, "routeFreezeMatrix.rules").some((rule) =>
    rule.includes("generic"),
  ),
  "Route freeze matrix must ban generic error rendering.",
);

const artifactExamples = readJson<{ examples?: JsonRecord[] }>(
  "data/fixtures/376_phase7_artifact_fallback_examples.json",
);
const artifactScenarioIds = asArray<JsonRecord>(
  artifactExamples.examples,
  "artifactExamples.examples",
).map((example) => example.scenarioId);
for (const scenarioId of [
  "artifact_summary_first_ready",
  "oversized_pdf_secure_send_later",
  "unsupported_print_replaced_by_download_or_send_later",
  "stale_byte_grant_recovery",
  "safe_browser_handoff_with_outbound_navigation_grant",
] as const) {
  invariant(
    artifactScenarioIds.includes(scenarioId),
    `Artifact fallback examples missing ${scenarioId}.`,
  );
}
for (const example of asArray<JsonRecord>(artifactExamples.examples, "artifactExamples.examples")) {
  const delivery = asRecord(
    example.binaryArtifactDelivery,
    `${String(example.scenarioId)}.delivery`,
  );
  invariant(
    delivery.returnContractRef === "ReturnIntent:phase7-artifact-safe-return" ||
      delivery.returnContractRef === "ReturnIntent:phase7-outbound-safe-return",
    `${String(example.scenarioId)} must define patient-safe return posture.`,
  );
  const byteGrant = example.artifactByteGrant;
  if (byteGrant !== null) {
    const grant = asRecord(byteGrant, `${String(example.scenarioId)}.artifactByteGrant`);
    invariant(
      grant.bridgeCapabilityMatrixRef === MINIMUM_BRIDGE_REF,
      `${String(example.scenarioId)} bridge capability ref drifted.`,
    );
    invariant(
      grant.patientEmbeddedNavEligibilityRef === NAV_ELIGIBILITY_REF,
      `${String(example.scenarioId)} nav eligibility ref drifted.`,
    );
  }
}

const releaseFreezeExamples = readJson<{ examples?: JsonRecord[] }>(
  "data/fixtures/376_phase7_release_freeze_examples.json",
);
const releaseScenarioIds = asArray<JsonRecord>(
  releaseFreezeExamples.examples,
  "releaseFreezeExamples.examples",
).map((example) => example.scenarioId);
for (const scenarioId of [
  "telemetry_missing_opens_route_freeze",
  "threshold_breach_freezes_mutating_route",
  "assurance_slice_degraded_invokes_kill_switch",
  "freeze_released_after_green_window",
] as const) {
  invariant(releaseScenarioIds.includes(scenarioId), `Release examples missing ${scenarioId}.`);
}
for (const example of asArray<JsonRecord>(releaseFreezeExamples.examples, "release examples")) {
  const record = asRecord(
    example.channelReleaseFreezeRecord,
    `${String(example.scenarioId)}.channelReleaseFreezeRecord`,
  );
  invariant(
    record.manifestVersionRef === MANIFEST_VERSION,
    `${String(example.scenarioId)} manifestVersionRef drifted.`,
  );
  invariant(
    record.releaseApprovalFreezeRef === RELEASE_APPROVAL_FREEZE_REF,
    `${String(example.scenarioId)} releaseApprovalFreezeRef drifted.`,
  );
  const patientDisposition = asRecord(
    example.patientDisposition,
    `${String(example.scenarioId)}.patientDisposition`,
  );
  invariant(
    patientDisposition.genericErrorAllowed === false,
    `${String(example.scenarioId)} must disallow generic errors.`,
  );
}

const errorCopyExamples = readJson<{ examples?: JsonRecord[] }>(
  "data/fixtures/376_phase7_embedded_error_copy_examples.json",
);
const errorCopyCodes = asArray<JsonRecord>(
  errorCopyExamples.examples,
  "errorCopyExamples.examples",
).map((example) => example.errorCode);
for (const errorCode of requiredErrorCodes) {
  invariant(errorCopyCodes.includes(errorCode), `Error copy examples missing ${errorCode}.`);
}

const externalNotes = readJson<{
  officialSources?: JsonRecord[];
  rejectedOrDeferredClaims?: JsonRecord[];
  acceptedInto376?: string[];
  carryForwardBindings?: string[];
}>("data/analysis/376_external_reference_notes.json");
const officialUrls = asArray<JsonRecord>(
  externalNotes.officialSources,
  "externalNotes.officialSources",
).map((source) => source.url);
for (const officialUrl of [
  "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
  "https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration",
  "https://service-manual.nhs.uk/accessibility/testing",
  "https://playwright.dev/docs/accessibility-testing",
] as const) {
  invariant(officialUrls.includes(officialUrl), `External reference notes missing ${officialUrl}.`);
}
invariant(
  asArray(externalNotes.rejectedOrDeferredClaims, "externalNotes.rejectedOrDeferredClaims")
    .length >= 5,
  "External reference notes must record rejected/deferred claims.",
);
requireArrayIncludes(
  externalNotes.carryForwardBindings,
  ["CF372_003", "CF372_004", "CF372_006"],
  "externalNotes.carryForwardBindings",
);

const artifactMatrix = readCsv("data/analysis/376_phase7_artifact_mode_matrix.csv");
const artifactModes = artifactMatrix.map((row) => row.mode);
for (const mode of [
  "structured_summary",
  "governed_preview",
  "governed_download",
  "secure_send_later",
  "safe_browser_handoff",
  "placeholder_only",
] as const) {
  invariant(artifactModes.includes(mode), `Artifact mode matrix missing ${mode}.`);
}
invariant(!artifactModes.includes("raw_print"), "Artifact mode matrix must not allow raw_print.");

const accessibilityMatrix = readCsv("data/analysis/376_phase7_accessibility_coverage_matrix.csv");
for (const routeId of FIRST_WAVE_ROUTES) {
  const row = accessibilityMatrix.find((entry) => entry.journeyPathId === routeId);
  invariant(row, `Accessibility coverage matrix missing ${routeId}.`);
  for (const stateKind of UI_STATE_KINDS) {
    invariant(
      String(row.uiStatesRequired).includes(stateKind),
      `Accessibility coverage row ${routeId} missing state ${stateKind}.`,
    );
  }
  invariant(
    row.manualAssistiveTestingState === "required_before_limited_release",
    `${routeId} manual assistive testing must block limited release.`,
  );
  invariant(
    row.deviceLabTestingState === "required_before_limited_release",
    `${routeId} device lab testing must block limited release.`,
  );
}

const rolloutMatrix = readCsv("data/analysis/376_phase7_rollout_guardrail_matrix.csv");
const rolloutTriggers = rolloutMatrix.map((row) => row.triggerType);
for (const triggerType of [
  "telemetry_missing",
  "threshold_breach",
  "assurance_slice_degraded",
  "compatibility_drift",
  "continuity_evidence_degraded",
  "kill_switch",
] as const) {
  invariant(
    rolloutTriggers.includes(triggerType),
    `Rollout guardrail matrix missing ${triggerType}.`,
  );
}
for (const row of rolloutMatrix) {
  invariant(
    row.routeFreezeDispositionRequired === "true",
    `Rollout guardrail ${String(row.triggerType)} must require route freeze disposition.`,
  );
}

const docs = [
  "docs/architecture/376_phase7_artifact_accessibility_and_guardrail_contracts.md",
  "docs/api/376_phase7_embedded_artifact_and_guardrail_api.md",
  "docs/policy/376_phase7_webview_limit_accessibility_and_release_rules.md",
  "docs/accessibility/376_phase7_embedded_accessibility_contracts.md",
]
  .map((relativePath) => readText(relativePath))
  .join("\n");
for (const term of [
  "BinaryArtifactDelivery",
  "ArtifactByteGrant",
  "ChannelDegradedMode",
  "AccessibilitySemanticCoverageProfile",
  "ReleaseGuardrailPolicy",
  "ChannelReleaseFreezeRecord",
  "RouteFreezeDisposition",
  "allowlist-only",
  "WCAG 2.2 AA",
] as const) {
  requireIncludes(docs, term, "376 docs");
}

console.log("376 Phase 7 artifact, accessibility, and guardrail contracts validated.");
