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

function requireRequiredFields(
  schemaPath: string,
  fields: readonly string[],
  objectPath?: string[],
): void {
  let node = readJson<JsonRecord>(schemaPath);
  for (const segment of objectPath ?? []) {
    node = asRecord(node[segment], `${schemaPath}.${segment}`);
  }
  const required = asArray<string>(node.required, `${schemaPath}.required`);
  for (const field of fields) {
    invariant(required.includes(field), `${schemaPath} missing required field ${field}.`);
  }
}

const MANIFEST_VERSION = "nhsapp-manifest-v0.1.0-freeze-374";
const RELEASE_APPROVAL_FREEZE_REF = "ReleaseApprovalFreeze:RAF-P7-374-CONTRACT-FREEZE";
const MINIMUM_BRIDGE_REF = "MinimumBridgeCapabilities:phase7-embedded-floor-375-pending";
const NAV_ELIGIBILITY_REF = "PatientEmbeddedNavEligibility:phase7-nav-floor-375-pending";

const REQUIRED_FILES = [
  "docs/architecture/375_phase7_embedded_context_sso_and_navigation_contracts.md",
  "docs/api/375_phase7_embedded_context_sso_navigation_api.md",
  "docs/policy/375_phase7_embedded_trust_and_navigation_guardrails.md",
  "data/contracts/375_phase7_channel_context_schema.json",
  "data/contracts/375_phase7_shell_policy_schema.json",
  "data/contracts/375_phase7_embedded_shell_consistency_projection_schema.json",
  "data/contracts/375_phase7_patient_embedded_session_binding_contract.json",
  "data/contracts/375_phase7_patient_embedded_nav_eligibility_schema.json",
  "data/contracts/375_phase7_sso_bridge_schema.json",
  "data/contracts/375_phase7_return_intent_schema.json",
  "data/contracts/375_phase7_site_link_and_link_resolution_schema.json",
  "data/contracts/375_phase7_navigation_contract_registry.json",
  "data/contracts/375_phase7_bridge_capability_floor_registry.json",
  "data/fixtures/375_phase7_context_resolution_examples.json",
  "data/fixtures/375_phase7_sso_return_examples.json",
  "data/fixtures/375_phase7_navigation_and_lease_examples.json",
  "data/analysis/375_external_reference_notes.json",
  "data/analysis/375_phase7_trust_tier_matrix.csv",
  "data/analysis/375_phase7_return_disposition_matrix.csv",
  "data/analysis/375_phase7_navigation_capability_matrix.csv",
  "tools/analysis/validate_375_phase7_embedded_context_and_sso_contracts.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:375-phase7-embedded-context-and-sso-contracts"] ===
    "pnpm exec tsx ./tools/analysis/validate_375_phase7_embedded_context_and_sso_contracts.ts",
  "package.json missing validate:375-phase7-embedded-context-and-sso-contracts script.",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_374_/m.test(checklist), "Checklist task 374 must be complete.");
invariant(
  /^- \[(?:-|X)\] par_375_/m.test(checklist),
  "Checklist task 375 must be claimed or complete while validator runs.",
);

const phase7Registry = readJson<{ launchVerdict?: string; tracks?: JsonRecord[] }>(
  "data/contracts/373_phase7_track_readiness_registry.json",
);
invariant(
  phase7Registry.launchVerdict === "open_phase7_with_constraints",
  "373 launch verdict must remain open_phase7_with_constraints.",
);
const par375Track = asArray<JsonRecord>(phase7Registry.tracks, "phase7Registry.tracks").find(
  (track) => track.trackId === "par_375",
);
invariant(par375Track?.readinessState === "ready", "par_375 must remain ready in 373 registry.");
invariant(
  par375Track?.launchPacketRef === "data/launchpacks/373_track_launch_packet_375.json",
  "par_375 launch packet drifted.",
);

const launchPacket = readJson<{
  targetTrack?: string;
  launchState?: string;
  mustProduce?: string[];
  constraints?: string[];
}>("data/launchpacks/373_track_launch_packet_375.json");
invariant(launchPacket.targetTrack === "par_375", "Launch packet target drifted.");
invariant(launchPacket.launchState === "ready", "Launch packet must be ready.");
for (const requiredObject of [
  "ChannelContext",
  "ChannelContextEvidence",
  "EmbeddedEntryToken",
  "ShellPolicy",
  "SSOEntryGrant",
  "AuthBridgeTransaction",
  "IdentityAssertionBinding",
  "ReturnIntent",
  "NavigationContract",
] as const) {
  invariant(
    asArray<string>(launchPacket.mustProduce, "launchPacket.mustProduce").includes(requiredObject),
    `Launch packet missing ${requiredObject}.`,
  );
}
for (const constraint of [
  "server_evidence_not_query_hint_authority",
  "assertedLoginIdentity_must_be_redacted",
  "do_not_create_second_identity_model",
] as const) {
  invariant(
    asArray<string>(launchPacket.constraints, "launchPacket.constraints").includes(constraint),
    `Launch packet missing constraint ${constraint}.`,
  );
}

const manifestFixture = readJson<{ manifest?: JsonRecord }>(
  "data/fixtures/374_phase7_manifest_example.json",
);
const manifest = asRecord(manifestFixture.manifest, "manifestFixture.manifest");
invariant(manifest.manifestVersion === MANIFEST_VERSION, "375 must inherit 374 manifestVersion.");
invariant(
  manifest.releaseApprovalFreezeRef === RELEASE_APPROVAL_FREEZE_REF,
  "375 must inherit 374 releaseApprovalFreezeRef.",
);
invariant(
  manifest.minimumBridgeCapabilitiesRef === MINIMUM_BRIDGE_REF,
  "375 must freeze 374 bridge capability ref.",
);

const channelContextFields = [
  "channelType",
  "entryMode",
  "trustTier",
  "resolutionDisposition",
  "isEmbedded",
  "userAgentEvidence",
  "queryEvidence",
  "signedContextEvidence",
  "assertedIdentityPresent",
  "deepLinkPresent",
  "jumpOffSource",
  "channelConfidence",
] as const;
requireRequiredFields(
  "data/contracts/375_phase7_channel_context_schema.json",
  channelContextFields,
  ["properties", "channelContext"],
);
requireRequiredFields(
  "data/contracts/375_phase7_channel_context_schema.json",
  [
    "evidenceId",
    "source",
    "observedAt",
    "expiresAt",
    "nonce",
    "signatureState",
    "requestedShell",
    "expectedJourneyPath",
    "cohortRef",
  ],
  ["properties", "channelContextEvidence"],
);
requireRequiredFields(
  "data/contracts/375_phase7_channel_context_schema.json",
  [
    "entryTokenId",
    "journeyPathId",
    "issuedAt",
    "expiresAt",
    "cohortRef",
    "intendedChannel",
    "contextClaims",
  ],
  ["properties", "embeddedEntryToken"],
);
requireRequiredFields("data/contracts/375_phase7_shell_policy_schema.json", [
  "shellPolicyId",
  "channelType",
  "showHeader",
  "showFooter",
  "showBackLink",
  "safeAreaInsetsMode",
  "externalLinkMode",
  "downloadMode",
]);
requireRequiredFields(
  "data/contracts/375_phase7_embedded_shell_consistency_projection_schema.json",
  [
    "consistencyId",
    "journeyPathId",
    "patientShellContinuityKey",
    "entityContinuityKey",
    "bundleVersion",
    "audienceTier",
    "governingObjectVersionRefs",
    "selectedAnchorRef",
    "returnContractRef",
    "placeholderContractRefs",
    "continuityEvidenceRefs",
    "currentBridgeCapabilityMatrixRef",
    "patientEmbeddedNavEligibilityRef",
    "shellState",
    "computedAt",
    "staleAt",
    "causalConsistencyState",
    "projectionTrustState",
  ],
);

const sessionBinding = readJson<{
  patientEmbeddedSessionProjection?: JsonRecord;
  bindingRules?: JsonRecord[];
  exampleProjection?: JsonRecord;
}>("data/contracts/375_phase7_patient_embedded_session_binding_contract.json");
const sessionRequired = asArray<string>(
  asRecord(
    sessionBinding.patientEmbeddedSessionProjection,
    "sessionBinding.patientEmbeddedSessionProjection",
  ).required,
  "session required fields",
);
for (const field of [
  "subjectRef",
  "identityBindingRef",
  "sessionEpochRef",
  "subjectBindingVersionRef",
  "manifestVersionRef",
  "releaseApprovalFreezeRef",
  "channelReleaseFreezeState",
  "minimumBridgeCapabilitiesRef",
  "currentBridgeCapabilityMatrixRef",
  "routeFreezeDispositionRef",
  "experienceContinuityEvidenceRef",
  "eligibilityState",
] as const) {
  invariant(sessionRequired.includes(field), `PatientEmbeddedSessionProjection missing ${field}.`);
}
invariant(
  asRecord(sessionBinding.exampleProjection, "sessionBinding.exampleProjection")
    .manifestVersionRef === MANIFEST_VERSION,
  "Embedded session example must inherit 374 manifest version.",
);

requireRequiredFields("data/contracts/375_phase7_patient_embedded_nav_eligibility_schema.json", [
  "embeddedNavEligibilityId",
  "journeyPathRef",
  "routeFamilyRef",
  "patientEmbeddedSessionProjectionRef",
  "bridgeCapabilityMatrixRef",
  "minimumBridgeCapabilitiesRef",
  "requiredBridgeActionRefs",
  "allowedBridgeActionRefs",
  "fallbackActionRefs",
  "routeFreezeDispositionRef",
  "continuityEvidenceRef",
  "eligibilityState",
  "evaluatedAt",
]);
requireRequiredFields(
  "data/contracts/375_phase7_sso_bridge_schema.json",
  [
    "entryGrantId",
    "journeyPathId",
    "assertedIdentityHash",
    "requestHash",
    "receivedAt",
    "expiresAt",
    "consumedAt",
    "redactedAt",
    "stateRef",
    "returnIntentRef",
    "consumptionFenceEpoch",
    "originChannelRef",
    "maxRedemptions",
    "redemptionCount",
    "grantState",
  ],
  ["properties", "ssoEntryGrant"],
);
requireRequiredFields(
  "data/contracts/375_phase7_sso_bridge_schema.json",
  [
    "transactionId",
    "entryGrantId",
    "stateHash",
    "nonceHash",
    "codeVerifierRef",
    "promptMode",
    "responseMode",
    "status",
    "errorRef",
    "completedAt",
    "manifestVersionRef",
    "bridgeCapabilityMatrixRef",
    "contextFenceRef",
    "transactionState",
  ],
  ["properties", "authBridgeTransaction"],
);
requireRequiredFields(
  "data/contracts/375_phase7_sso_bridge_schema.json",
  [
    "bindingId",
    "entryGrantRef",
    "assertedIdentityHash",
    "nhsLoginSubjectRef",
    "claimSetHash",
    "localSubjectBindingRef",
    "bindingState",
    "evaluatedAt",
  ],
  ["properties", "identityAssertionBinding"],
);
requireRequiredFields(
  "data/contracts/375_phase7_sso_bridge_schema.json",
  [
    "mergeDecisionId",
    "transactionRef",
    "existingSessionRef",
    "resolvedSessionRef",
    "subjectComparisonState",
    "draftClaimDisposition",
    "resumeIntentDisposition",
    "decision",
    "decidedAt",
  ],
  ["properties", "sessionMergeDecision"],
);
requireRequiredFields(
  "data/contracts/375_phase7_sso_bridge_schema.json",
  [
    "returnDispositionId",
    "transactionRef",
    "outcome",
    "patientRouteRef",
    "appReturnTargetRef",
    "copyVariantRef",
    "allowRetry",
    "evidenceRef",
  ],
  ["properties", "ssoReturnDisposition"],
);
requireRequiredFields("data/contracts/375_phase7_return_intent_schema.json", [
  "returnIntentId",
  "postAuthRoute",
  "postAuthParams",
  "embeddedState",
  "fallbackAppPage",
  "submissionEnvelopeRef",
  "submissionPromotionRecordRef",
  "draftLeaseRef",
  "draftContinuityEvidenceRef",
  "subjectRef",
  "sessionEpochRef",
  "subjectBindingVersionRef",
  "manifestVersionRef",
  "routeFamilyRef",
  "minimumBridgeCapabilitiesRef",
  "lineageFenceEpoch",
  "releaseApprovalFreezeRef",
  "continuityEvidenceRef",
  "routeFreezeDispositionRef",
  "expiresAt",
  "intentState",
]);
requireRequiredFields(
  "data/contracts/375_phase7_site_link_and_link_resolution_schema.json",
  [
    "manifestId",
    "androidAssetLinksRef",
    "iosAssociationRef",
    "allowedPathPatterns",
    "environmentMappings",
    "canonicalGrantServiceRef",
    "routeIntentBindingRequired",
  ],
  ["properties", "siteLinkManifest"],
);
requireRequiredFields(
  "data/contracts/375_phase7_site_link_and_link_resolution_schema.json",
  [
    "resolutionId",
    "incomingPath",
    "channelDetected",
    "embeddedState",
    "subjectLinked",
    "manifestVersionRef",
    "routeFamilyRef",
    "sessionEpochRef",
    "grantFenceState",
    "resolutionOutcome",
  ],
  ["properties", "linkResolutionAudit"],
);

const bridgeRegistry = readJson<{
  minimumBridgeCapabilitiesRef?: string;
  manifestVersionRef?: string;
  releaseApprovalFreezeRef?: string;
  capabilityFloors?: JsonRecord[];
  methodRules?: JsonRecord[];
}>("data/contracts/375_phase7_bridge_capability_floor_registry.json");
invariant(
  bridgeRegistry.minimumBridgeCapabilitiesRef === MINIMUM_BRIDGE_REF,
  "Bridge floor ref drifted.",
);
invariant(
  bridgeRegistry.manifestVersionRef === MANIFEST_VERSION,
  "Bridge floor manifest version drifted.",
);
invariant(
  bridgeRegistry.releaseApprovalFreezeRef === RELEASE_APPROVAL_FREEZE_REF,
  "Bridge floor release freeze drifted.",
);
const capabilityFloors = asArray<JsonRecord>(
  bridgeRegistry.capabilityFloors,
  "bridgeRegistry.capabilityFloors",
);
invariant(
  capabilityFloors.length >= 3,
  "Bridge capability registry must include iOS, Android, and outside-app rows.",
);
for (const method of [
  "navigation.setBackAction",
  "navigation.clearBackAction",
  "navigation.goToPage",
  "navigation.openBrowserOverlay",
  "navigation.openExternalBrowser",
  "storage.addEventToCalendar",
  "storage.downloadFromBytes",
] as const) {
  invariant(
    capabilityFloors.some((floor) =>
      asArray<string>(floor.supportedMethods, "floor.supportedMethods").includes(method),
    ),
    `Bridge capability registry missing ${method}.`,
  );
}
invariant(
  asArray<JsonRecord>(bridgeRegistry.methodRules, "bridgeRegistry.methodRules").some(
    (rule) => rule.method === "tools.isOpenInNHSApp" && rule.authority === "detection_only",
  ),
  "isOpenInNHSApp must be detection-only.",
);

const navigationRegistry = readJson<{
  minimumBridgeCapabilitiesRef?: string;
  patientEmbeddedNavEligibilityContractRef?: string;
  outboundNavigationGrantRule?: JsonRecord;
  navigationContracts?: JsonRecord[];
  bridgeActionLeaseTemplate?: JsonRecord;
  staleLeaseClearTriggers?: string[];
  gapClosures?: string[];
}>("data/contracts/375_phase7_navigation_contract_registry.json");
invariant(
  navigationRegistry.minimumBridgeCapabilitiesRef === MINIMUM_BRIDGE_REF,
  "Navigation registry bridge ref drifted.",
);
invariant(
  navigationRegistry.patientEmbeddedNavEligibilityContractRef === NAV_ELIGIBILITY_REF,
  "Navigation registry nav eligibility ref drifted.",
);
const outboundRule = asRecord(
  navigationRegistry.outboundNavigationGrantRule,
  "navigationRegistry.outboundNavigationGrantRule",
);
invariant(
  outboundRule.canonicalContractRef === "OutboundNavigationGrant",
  "OutboundNavigationGrant must remain canonical.",
);
for (const binding of [
  "bridgeCapabilityMatrixRef",
  "patientEmbeddedNavEligibilityRef",
  "manifestVersionRef",
  "sessionEpochRef",
  "lineageFenceEpoch",
  "selectedAnchorRef",
  "returnContractRef",
  "scrubbedUrlRef",
] as const) {
  invariant(
    asArray<string>(
      outboundRule.requiredEmbeddedBindings,
      "outboundRule.requiredEmbeddedBindings",
    ).includes(binding),
    `OutboundNavigationGrant embedded binding missing ${binding}.`,
  );
}
const navContracts = asArray<JsonRecord>(
  navigationRegistry.navigationContracts,
  "navigationRegistry.navigationContracts",
);
invariant(navContracts.length >= 7, "Navigation registry must cover first-wave safe routes.");
for (const contract of navContracts) {
  invariant(
    contract.patientEmbeddedNavEligibilityRef === NAV_ELIGIBILITY_REF,
    "Navigation contract nav eligibility ref drifted.",
  );
  invariant(
    contract.routeFreezeDispositionRef === "RouteFreezeDisposition:nhs-app-freeze-in-place-v1",
    "Navigation contract freeze disposition drifted.",
  );
  invariant(
    asArray<string>(contract.requiredBridgeCapabilities, "contract.requiredBridgeCapabilities")
      .length > 0,
    `Navigation contract ${String(contract.routeId)} must declare required capabilities.`,
  );
}
for (const trigger of [
  "route_family_drift",
  "manifest_version_drift",
  "session_epoch_drift",
  "lineage_fence_drift",
  "bridge_capability_matrix_drift",
  "patient_embedded_nav_eligibility_drift",
  "continuity_evidence_drift",
] as const) {
  invariant(
    asArray<string>(
      navigationRegistry.staleLeaseClearTriggers,
      "navigationRegistry.staleLeaseClearTriggers",
    ).includes(trigger),
    `Navigation registry missing stale lease trigger ${trigger}.`,
  );
}
for (const gap of [
  "query_hint_equals_trusted_embedded_closed",
  "single_redemption_exact_once",
  "identity_mismatch_no_silent_merge",
  "stale_navigation_lease_clears",
  "deep_links_use_access_grant_service",
] as const) {
  invariant(
    asArray<string>(navigationRegistry.gapClosures, "navigationRegistry.gapClosures").includes(gap),
    `Missing gap closure ${gap}.`,
  );
}

const trustRows = readCsv("data/analysis/375_phase7_trust_tier_matrix.csv");
for (const tier of [
  "trusted_embedded",
  "verified_sso_embedded",
  "hinted_embedded",
  "standalone_or_unknown",
] as const) {
  invariant(
    trustRows.some((row) => row.trustTier === tier),
    `Trust tier matrix missing ${tier}.`,
  );
}
const hintedRow = trustRows.find((row) => row.trustTier === "hinted_embedded");
invariant(
  String(hintedRow?.forbiddenActions).includes("trusted_embedded posture"),
  "Hinted embedded must forbid trusted posture.",
);

const returnRows = readCsv("data/analysis/375_phase7_return_disposition_matrix.csv");
for (const outcome of [
  "silent_success",
  "consent_denied",
  "silent_failure",
  "manifest_drift",
  "context_drift",
  "session_conflict",
  "safe_reentry_required",
] as const) {
  invariant(
    returnRows.some((row) => row.outcome === outcome),
    `Return disposition matrix missing ${outcome}.`,
  );
}
const sessionConflict = returnRows.find((row) => row.outcome === "session_conflict");
invariant(
  sessionConflict?.identityBindingState === "mismatched" &&
    sessionConflict.sessionMergeDecision === "terminate_and_reenter",
  "Session conflict must terminate and re-enter.",
);

const navigationRows = readCsv("data/analysis/375_phase7_navigation_capability_matrix.csv");
invariant(navigationRows.length >= 7, "Navigation capability matrix must cover first-wave routes.");
for (const row of navigationRows) {
  invariant(
    row.patientEmbeddedNavEligibilityRequired === "true",
    `Navigation row ${String(row.routeId)} must require nav eligibility.`,
  );
  invariant(
    row.bridgeActionLeaseRequired === "true",
    `Navigation row ${String(row.routeId)} must require bridge lease.`,
  );
  invariant(
    row.staleLeaseDisposition === "clear_and_route_freeze",
    `Navigation row ${String(row.routeId)} stale lease disposition drifted.`,
  );
}

const contextExamples = readJson<{ examples?: JsonRecord[] }>(
  "data/fixtures/375_phase7_context_resolution_examples.json",
);
const contextExampleMap = new Map(
  asArray<JsonRecord>(contextExamples.examples, "contextExamples.examples").map((example) => [
    String(example.exampleId),
    example,
  ]),
);
invariant(
  contextExampleMap.has("ctx_query_hint_only_not_trusted"),
  "Context examples missing query hint case.",
);
const queryHintExample = asRecord(
  contextExampleMap.get("ctx_query_hint_only_not_trusted"),
  "query hint example",
);
invariant(
  queryHintExample.expectedDisposition === "QUERY_HINT_NOT_TRUSTED",
  "Query hint example must fail trust.",
);
invariant(
  contextExampleMap.has("ctx_ssr_hydration_conflict"),
  "Context examples missing SSR hydration conflict.",
);

const ssoExamples = readJson<{ examples?: JsonRecord[] }>(
  "data/fixtures/375_phase7_sso_return_examples.json",
);
const ssoExampleMap = new Map(
  asArray<JsonRecord>(ssoExamples.examples, "ssoExamples.examples").map((example) => [
    String(example.exampleId),
    example,
  ]),
);
for (const exampleId of [
  "sso_silent_success_same_subject",
  "sso_consent_denied",
  "sso_replayed_entry_grant",
  "sso_subject_mismatch",
  "sso_manifest_drift",
] as const) {
  invariant(ssoExampleMap.has(exampleId), `SSO examples missing ${exampleId}.`);
}
const subjectMismatch = asRecord(
  ssoExampleMap.get("sso_subject_mismatch"),
  "subject mismatch example",
);
invariant(
  asRecord(subjectMismatch.identityAssertionBinding, "subjectMismatch.identityAssertionBinding")
    .bindingState === "mismatched",
  "Subject mismatch example must be mismatched.",
);

const navigationExamples = readJson<{ examples?: JsonRecord[] }>(
  "data/fixtures/375_phase7_navigation_and_lease_examples.json",
);
const navExampleMap = new Map(
  asArray<JsonRecord>(navigationExamples.examples, "navigationExamples.examples").map((example) => [
    String(example.exampleId),
    example,
  ]),
);
for (const exampleId of [
  "lease_native_back_request_status",
  "lease_cleared_on_session_drift",
  "overlay_requires_outbound_navigation_grant",
  "external_browser_phi_query_blocked",
] as const) {
  invariant(navExampleMap.has(exampleId), `Navigation examples missing ${exampleId}.`);
}

const externalNotes = readJson<{
  officialSources?: JsonRecord[];
  rejectedOrDeferred?: JsonRecord[];
}>("data/analysis/375_external_reference_notes.json");
const sourceUrls = asArray<JsonRecord>(
  externalNotes.officialSources,
  "externalNotes.officialSources",
).map((source) => String(source.url));
for (const officialUrl of [
  "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
  "https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration",
  "https://service-manual.nhs.uk/accessibility/testing",
] as const) {
  invariant(
    sourceUrls.includes(officialUrl),
    `External notes missing official source ${officialUrl}.`,
  );
}
invariant(
  asArray<JsonRecord>(externalNotes.rejectedOrDeferred, "externalNotes.rejectedOrDeferred").some(
    (decision) => decision.claim === "from=nhsApp query parameter proves trusted embedded mode",
  ),
  "External notes must reject query hint as trust.",
);

const architectureDoc = readText(
  "docs/architecture/375_phase7_embedded_context_sso_and_navigation_contracts.md",
);
for (const requiredTerm of [
  "ChannelContext",
  "PatientEmbeddedSessionProjection",
  "SSOEntryGrant",
  "ReturnIntent",
  "BridgeActionLease",
  "OutboundNavigationGrant",
  "Query hints",
]) {
  requireIncludes(architectureDoc, requiredTerm, "architecture doc");
}

const apiDoc = readText("docs/api/375_phase7_embedded_context_sso_navigation_api.md");
for (const requiredTerm of [
  "QUERY_HINT_NOT_TRUSTED",
  "SSO_ENTRY_REPLAYED",
  "IDENTITY_ASSERTION_MISMATCH",
  "BRIDGE_LEASE_STALE",
]) {
  requireIncludes(apiDoc, requiredTerm, "API doc");
}

const policyDoc = readText("docs/policy/375_phase7_embedded_trust_and_navigation_guardrails.md");
for (const requiredTerm of [
  "User-agent markers are evidence",
  "Raw asserted identity",
  "Silent merge is forbidden",
  "OutboundNavigationGrant",
]) {
  requireIncludes(policyDoc, requiredTerm, "policy doc");
}

console.log(
  JSON.stringify(
    {
      taskId: "par_375",
      verdict: "pass",
      manifestVersion: MANIFEST_VERSION,
      trustTiers: trustRows.length,
      returnDispositions: returnRows.length,
      navigationContracts: navContracts.length,
      officialSources: sourceUrls.length,
    },
    null,
    2,
  ),
);
