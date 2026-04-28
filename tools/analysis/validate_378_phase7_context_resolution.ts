import fs from "node:fs";
import path from "node:path";
import { serviceDefinition } from "../../services/command-api/src/service-definition";
import {
  createDefaultPhase7EmbeddedContextApplication,
  createTrustedContextEvidence,
  phase7EmbeddedContextRoutes,
  type BridgeCapabilitySnapshot,
  type LocalSessionBinding,
} from "../../services/command-api/src/phase7-embedded-context-service";

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

function activeSession(): LocalSessionBinding {
  return {
    subjectRef: "subject:test-patient",
    identityBindingRef: "IdentityBinding:test-patient",
    sessionEpochRef: "SessionEpoch:7",
    subjectBindingVersionRef: "SubjectBindingVersion:3",
    sessionState: "active",
    patientShellContinuityKey: "patient-shell-continuity:test-patient",
    entityContinuityKey: "entity-continuity:request-123",
    selectedAnchorRef: "SelectedAnchor:pharmacy-status",
    returnContractRef: "ReturnIntent:request-status",
  };
}

function verifiedBridge(): BridgeCapabilitySnapshot {
  return {
    bridgeCapabilityMatrixRef: "BridgeCapabilityMatrix:nhs-app-js-v2-minimum",
    capabilityState: "verified",
    supportedBridgeActionRefs: [
      "navigation.goToPage",
      "navigation.setBackAction",
      "navigation.clearBackAction",
    ],
    detectedPlatform: "ios",
  };
}

const REQUIRED_FILES = [
  "services/command-api/src/phase7-embedded-context-service.ts",
  "docs/architecture/378_phase7_context_resolver_and_embedded_session_projection.md",
  "docs/api/378_phase7_context_resolution_api.md",
  "data/analysis/378_external_reference_notes.md",
  "data/analysis/378_algorithm_alignment_notes.md",
  "data/test/378_context_resolution_matrix.csv",
  "data/test/378_embedded_nav_eligibility_cases.csv",
  "data/fixtures/378_embedded_context_resolution_examples.json",
  "tools/analysis/validate_378_phase7_context_resolution.ts",
  "tests/unit/378_channel_context_resolver.spec.ts",
  "tests/integration/378_embedded_session_projection_and_safe_downgrade.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:378-phase7-context-resolution"] ===
    "pnpm exec tsx ./tools/analysis/validate_378_phase7_context_resolution.ts",
  "package.json missing validate:378-phase7-context-resolution script.",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_377_/m.test(checklist), "Checklist task 377 must be complete.");
invariant(
  /^- \[(?:-|X)\] par_378_/m.test(checklist),
  "Checklist task 378 must be claimed or complete while validator runs.",
);

const phase7Registry = readJson<{
  launchVerdict?: string;
  tracks?: JsonRecord[];
}>("data/contracts/373_phase7_track_readiness_registry.json");
invariant(
  phase7Registry.launchVerdict === "open_phase7_with_constraints",
  "373 launch verdict must remain open_phase7_with_constraints.",
);
const par378Track = asArray<JsonRecord>(phase7Registry.tracks, "phase7Registry.tracks").find(
  (track) => track.trackId === "par_378",
);
invariant(par378Track?.readinessState === "ready", "par_378 must remain ready in 373 registry.");
invariant(
  par378Track?.launchPacketRef === "data/launchpacks/373_track_launch_packet_378.json",
  "par_378 launch packet drifted.",
);

const launchPacket = readJson<{
  targetTrack?: string;
  launchState?: string;
  mustProduce?: string[];
  constraints?: string[];
}>("data/launchpacks/373_track_launch_packet_378.json");
invariant(launchPacket.targetTrack === "par_378", "Launch packet target drifted.");
invariant(launchPacket.launchState === "ready", "Launch packet must be ready.");
requireArrayIncludes(
  launchPacket.mustProduce,
  [
    "ChannelContextResolver",
    "EmbeddedEntryTokenService",
    "ShellPolicyResolver",
    "EmbeddedShellConsistencyProjection",
    "PatientEmbeddedSessionProjection",
    "PatientEmbeddedNavEligibility",
  ],
  "launchPacket.mustProduce",
);
requireArrayIncludes(
  launchPacket.constraints,
  [
    "signed_or_fenced_server_evidence_required",
    "query_hints_are_presentation_only",
    "same_shell_recovery_must_be_preserved",
  ],
  "launchPacket.constraints",
);

const routeIds = phase7EmbeddedContextRoutes.map((route) => route.routeId);
for (const routeId of [
  "phase7_embedded_context_resolve",
  "phase7_embedded_shell_policy_resolve",
  "phase7_embedded_session_projection_current",
  "phase7_embedded_nav_eligibility_evaluate",
  "phase7_embedded_context_hydration_envelope",
] as const) {
  invariant(routeIds.includes(routeId), `Embedded context route missing ${routeId}.`);
  invariant(
    serviceDefinition.routeCatalog.some((route) => route.routeId === routeId),
    `command-api serviceDefinition missing ${routeId}.`,
  );
}

const application = createDefaultPhase7EmbeddedContextApplication();
const liveResult = application.resolve({
  environment: "sandpit",
  journeyPathId: "jp_pharmacy_status",
  routePath: "/requests/123/pharmacy/status",
  userAgent: "Mozilla/5.0 nhsapp-ios/5.0.0",
  query: { from: "nhsApp", assertedLoginIdentity: "raw-nhs-login-jwt" },
  signedContextEvidence: createTrustedContextEvidence({ journeyPathId: "jp_pharmacy_status" }),
  localSession: activeSession(),
  bridgeCapability: verifiedBridge(),
});
invariant(
  liveResult.channelContext.trustTier === "trusted_embedded",
  "Signed context not trusted.",
);
invariant(
  liveResult.channelContext.resolutionDisposition === "embedded_live",
  "Trusted context must be embedded_live.",
);
invariant(
  liveResult.patientEmbeddedNavEligibility.eligibilityState === "live",
  "Trusted route must be live.",
);
invariant(
  liveResult.embeddedShellConsistencyProjection.patientShellContinuityKey ===
    "patient-shell-continuity:test-patient",
  "patientShellContinuityKey must be preserved.",
);
invariant(
  liveResult.embeddedShellConsistencyProjection.entityContinuityKey ===
    "entity-continuity:request-123",
  "entityContinuityKey must be preserved.",
);
invariant(
  liveResult.channelContext.queryEvidence.assertedLoginIdentity === "redacted",
  "assertedLoginIdentity must be redacted in queryEvidence.",
);
invariant(
  !JSON.stringify(liveResult).includes("raw-nhs-login-jwt"),
  "Raw assertedLoginIdentity leaked into resolution result.",
);

const queryHintResult = application.resolve({
  environment: "sandpit",
  journeyPathId: "jp_pharmacy_status",
  routePath: "/requests/123/pharmacy/status",
  query: { from: "nhsApp" },
});
invariant(
  queryHintResult.channelContext.trustTier === "hinted_embedded",
  "from=nhsApp should only produce hinted_embedded.",
);
invariant(
  queryHintResult.channelContext.resolutionDisposition === "embedded_styling_only",
  "from=nhsApp should only unlock styling posture.",
);
invariant(
  queryHintResult.patientEmbeddedNavEligibility.eligibilityState === "placeholder_only",
  "from=nhsApp must not unlock live actions.",
);
invariant(
  queryHintResult.blockedReasons.includes("query_hint_not_trusted"),
  "Query hint downgrade reason missing.",
);

const userAgentResult = application.resolve({
  environment: "sandpit",
  journeyPathId: "jp_pharmacy_status",
  routePath: "/requests/123/pharmacy/status",
  userAgent: "Mozilla/5.0 nhsapp-android/5.0.0",
});
invariant(
  userAgentResult.channelContext.resolutionDisposition === "embedded_revalidate_only",
  "User-agent evidence should be revalidate-only.",
);
invariant(
  userAgentResult.blockedReasons.includes("user_agent_not_trusted"),
  "User-agent downgrade reason missing.",
);

const tokenApplication = createDefaultPhase7EmbeddedContextApplication();
const token = tokenApplication.issueEmbeddedEntryToken({
  entryTokenId: "EmbeddedEntryToken:validator-replay",
  journeyPathId: "jp_pharmacy_status",
  issuedAt: "2026-04-27T00:10:15.000Z",
  expiresAt: "2026-04-27T00:15:15.000Z",
  cohortRef: "cohort:phase7-internal-sandpit-only",
  environment: "sandpit",
  patientShellContinuityKey: "patient-shell-continuity:test-patient",
  entityContinuityKey: "entity-continuity:request-123",
});
tokenApplication.resolve({
  environment: "sandpit",
  journeyPathId: "jp_pharmacy_status",
  routePath: "/requests/123/pharmacy/status",
  embeddedEntryToken: token,
  localSession: activeSession(),
  bridgeCapability: verifiedBridge(),
});
const replayResult = tokenApplication.resolve({
  environment: "sandpit",
  journeyPathId: "jp_pharmacy_status",
  routePath: "/requests/123/pharmacy/status",
  embeddedEntryToken: token,
  localSession: activeSession(),
  bridgeCapability: verifiedBridge(),
});
invariant(
  replayResult.blockedReasons.includes("embedded_entry_token_replayed"),
  "Embedded entry token replay must be detected.",
);
invariant(
  replayResult.patientEmbeddedNavEligibility.eligibilityState === "blocked",
  "Replayed embedded entry token must block nav eligibility.",
);
invariant(
  replayResult.channelContext.resolutionDisposition === "blocked",
  "Replayed embedded entry token must block resolution disposition.",
);

const hydrationResult = application.resolve({
  environment: "sandpit",
  journeyPathId: "jp_pharmacy_status",
  routePath: "/requests/123/pharmacy/status",
  signedContextEvidence: createTrustedContextEvidence({ journeyPathId: "jp_pharmacy_status" }),
  localSession: activeSession(),
  bridgeCapability: verifiedBridge(),
  hydrationContext: {
    trustTier: "hinted_embedded",
    resolutionDisposition: "embedded_styling_only",
    channelType: "unknown",
  },
});
invariant(
  hydrationResult.blockedReasons.includes("hydration_conflict"),
  "Hydration conflict reason missing.",
);
invariant(
  hydrationResult.channelContext.resolutionDisposition === "bounded_recovery",
  "Hydration conflict must enter bounded recovery.",
);
invariant(
  hydrationResult.hydrationBinding.rehydrateFromServerOnly === true &&
    hydrationResult.hydrationBinding.clientMayRecomputeTrust === false,
  "Hydration binding must be server-owned.",
);

const bridgeUnavailableResult = application.resolve({
  environment: "sandpit",
  journeyPathId: "jp_pharmacy_status",
  routePath: "/requests/123/pharmacy/status",
  signedContextEvidence: createTrustedContextEvidence({ journeyPathId: "jp_pharmacy_status" }),
  localSession: activeSession(),
});
invariant(
  bridgeUnavailableResult.blockedReasons.includes("bridge_capability_unavailable"),
  "Missing bridge capability must be explicit.",
);
invariant(
  bridgeUnavailableResult.patientEmbeddedNavEligibility.eligibilityState === "read_only",
  "Missing bridge capability must downgrade to read_only.",
);

const driftResult = application.resolve({
  environment: "sandpit",
  journeyPathId: "jp_pharmacy_status",
  routePath: "/requests/123/pharmacy/status",
  signedContextEvidence: createTrustedContextEvidence({ journeyPathId: "jp_pharmacy_status" }),
  localSession: activeSession(),
  bridgeCapability: verifiedBridge(),
  expectedConfigFingerprint: "sha256:drifted-config",
});
invariant(driftResult.blockedReasons.includes("manifest_drift"), "Manifest drift reason missing.");
invariant(
  driftResult.patientEmbeddedNavEligibility.eligibilityState === "recovery_required",
  "Manifest drift must not show live actions.",
);

const contextMatrix = readCsv("data/test/378_context_resolution_matrix.csv");
for (const caseId of [
  "signed_context_trusted_even_with_query",
  "query_hint_only",
  "user_agent_only",
  "entry_token_replay",
  "hydration_conflict",
  "validated_sso",
] as const) {
  invariant(
    contextMatrix.some((row) => row.caseId === caseId),
    `Context resolution matrix missing ${caseId}.`,
  );
}
invariant(
  contextMatrix.some(
    (row) =>
      row.caseId === "query_hint_only" &&
      row.expectedTrustTier === "hinted_embedded" &&
      row.expectedEligibilityState === "placeholder_only",
  ),
  "Context matrix must document query hint as placeholder-only.",
);

const navCases = readCsv("data/test/378_embedded_nav_eligibility_cases.csv");
for (const caseId of [
  "pharmacy_status_live",
  "bridge_unavailable_read_only",
  "route_frozen_read_only",
  "kill_switch_blocked",
  "manifest_drift_recovery_required",
] as const) {
  invariant(
    navCases.some((row) => row.caseId === caseId),
    `Embedded nav eligibility cases missing ${caseId}.`,
  );
}

const fixture = readJson<{ examples?: JsonRecord[] }>(
  "data/fixtures/378_embedded_context_resolution_examples.json",
);
requireArrayIncludes(
  asArray<JsonRecord>(fixture.examples, "fixture.examples").map((example) =>
    String(example.scenarioId),
  ),
  [
    "trusted_pharmacy_status_live",
    "query_hint_is_placeholder_only",
    "stale_bridge_safe_downgrade",
    "hydration_conflict_bounded_recovery",
  ],
  "378 resolution fixture scenarios",
);

const externalNotes = readText("data/analysis/378_external_reference_notes.md");
for (const url of [
  "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration",
] as const) {
  requireIncludes(externalNotes, url, "378 external reference notes");
}
requireIncludes(externalNotes, "Rejected", "378 external reference notes");
requireIncludes(externalNotes, "Deferred", "378 external reference notes");

const docs = [
  "docs/architecture/378_phase7_context_resolver_and_embedded_session_projection.md",
  "docs/api/378_phase7_context_resolution_api.md",
  "data/analysis/378_algorithm_alignment_notes.md",
]
  .map((relativePath) => readText(relativePath))
  .join("\n");
for (const term of [
  "ChannelContextResolver",
  "EmbeddedEntryToken",
  "ShellPolicy",
  "EmbeddedShellConsistencyProjection",
  "PatientEmbeddedSessionProjection",
  "PatientEmbeddedNavEligibility",
  "query hints",
  "SSR",
  "hydration",
  "RouteFreezeDisposition",
] as const) {
  requireIncludes(docs, term, "378 docs and algorithm notes");
}

console.log("378 Phase 7 context resolver and embedded session projection validated.");
