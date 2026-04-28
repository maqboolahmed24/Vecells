import fs from "node:fs";
import path from "node:path";
import { serviceDefinition } from "../../services/command-api/src/service-definition";
import {
  createDefaultPhase7NhsAppSsoBridgeApplication,
  createPhase7SsoLocalSession,
  createPhase7SsoVerifiedBridge,
  phase7NhsAppSsoBridgeRoutes,
  type ExistingLocalSession,
} from "../../services/command-api/src/phase7-nhs-app-sso-bridge-service";
import {
  createDefaultPhase7EmbeddedContextApplication,
  createTrustedContextEvidence,
  type EmbeddedContextResolutionResult,
} from "../../services/command-api/src/phase7-embedded-context-service";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";
const RAW_ASSERTED_IDENTITY = "raw-asserted-login-identity-379-validator-secret";

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

function liveEmbeddedContext(input?: {
  manifestDrift?: boolean;
  bridgeUnavailable?: boolean;
}): EmbeddedContextResolutionResult {
  const localSession = createPhase7SsoLocalSession();
  return createDefaultPhase7EmbeddedContextApplication().resolve({
    environment: "sandpit",
    journeyPathId: "jp_pharmacy_status",
    routePath: "/requests/REQ-123/status",
    signedContextEvidence: createTrustedContextEvidence({
      journeyPathId: "jp_pharmacy_status",
    }),
    localSession,
    bridgeCapability: input?.bridgeUnavailable ? null : createPhase7SsoVerifiedBridge(),
    expectedConfigFingerprint: input?.manifestDrift ? "sha256:drifted-config" : undefined,
  });
}

function existingSession(input?: Partial<ExistingLocalSession>): ExistingLocalSession {
  const localSession = createPhase7SsoLocalSession();
  return {
    sessionRef: input?.sessionRef ?? "Session:existing-379-validator",
    subjectRef: input?.subjectRef ?? localSession.subjectRef,
    identityBindingRef: input?.identityBindingRef ?? localSession.identityBindingRef,
    sessionEpochRef: input?.sessionEpochRef ?? localSession.sessionEpochRef,
    subjectBindingVersionRef:
      input?.subjectBindingVersionRef ?? localSession.subjectBindingVersionRef,
    sessionState: input?.sessionState ?? "active",
  };
}

function startSso(input?: {
  submissionEnvelopeRef?: string | null;
  submissionPromotionRecordRef?: string | null;
}) {
  const application = createDefaultPhase7NhsAppSsoBridgeApplication();
  const localSession = createPhase7SsoLocalSession();
  const embeddedContext = liveEmbeddedContext();
  const start = application.captureAndAuthorize({
    environment: "sandpit",
    journeyPathId: "jp_pharmacy_status",
    routePath: "/requests/REQ-123/status",
    rawUrl:
      "/requests/REQ-123/status?from=nhsApp&assertedLoginIdentity=raw-asserted-login-identity-379-validator-secret",
    assertedLoginIdentity: RAW_ASSERTED_IDENTITY,
    expectedSubjectRef: localSession.subjectRef,
    expectedIdentityBindingRef: localSession.identityBindingRef,
    expectedSubjectBindingVersionRef: localSession.subjectBindingVersionRef,
    sessionEpochRef: localSession.sessionEpochRef,
    routeFamilyRef: "pharmacy_status",
    postAuthRoute: "/requests/REQ-123/status",
    submissionEnvelopeRef: input?.submissionEnvelopeRef ?? null,
    submissionPromotionRecordRef: input?.submissionPromotionRecordRef ?? null,
    embeddedContext,
    localSession,
    bridgeCapability: createPhase7SsoVerifiedBridge(),
  });
  return { application, localSession, embeddedContext, start };
}

const REQUIRED_FILES = [
  "services/command-api/src/phase7-nhs-app-sso-bridge-service.ts",
  "docs/architecture/379_phase7_nhs_app_sso_bridge.md",
  "docs/api/379_phase7_sso_bridge_api.md",
  "docs/security/379_phase7_sso_bridge_redaction_and_replay_rules.md",
  "data/analysis/379_external_reference_notes.md",
  "data/analysis/379_algorithm_alignment_notes.md",
  "data/test/379_sso_bridge_state_machine.csv",
  "data/test/379_return_disposition_matrix.csv",
  "data/test/379_redaction_and_replay_checklist.json",
  "data/fixtures/379_sso_bridge_examples.json",
  "tools/analysis/validate_379_phase7_sso_bridge.ts",
  "tests/unit/379_sso_entry_grant_and_callback_fencing.spec.ts",
  "tests/integration/379_identity_binding_session_merge_and_return_intent.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:379-phase7-sso-bridge"] ===
    "pnpm exec tsx ./tools/analysis/validate_379_phase7_sso_bridge.ts",
  "package.json missing validate:379-phase7-sso-bridge script.",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_378_/m.test(checklist), "Checklist task 378 must be complete.");
invariant(
  /^- \[(?:-|X)\] par_379_/m.test(checklist),
  "Checklist task 379 must be claimed or complete while validator runs.",
);

const phase7Registry = readJson<{
  launchVerdict?: string;
  tracks?: JsonRecord[];
}>("data/contracts/373_phase7_track_readiness_registry.json");
invariant(
  phase7Registry.launchVerdict === "open_phase7_with_constraints",
  "373 launch verdict must remain open_phase7_with_constraints.",
);
const par379Track = asArray<JsonRecord>(phase7Registry.tracks, "phase7Registry.tracks").find(
  (track) => track.trackId === "par_379",
);
invariant(par379Track?.readinessState === "ready", "par_379 must remain ready in 373 registry.");
invariant(
  par379Track?.launchPacketRef === "data/launchpacks/373_track_launch_packet_379.json",
  "par_379 launch packet drifted.",
);

const launchPacket = readJson<{
  targetTrack?: string;
  launchState?: string;
  mustProduce?: string[];
  constraints?: string[];
}>("data/launchpacks/373_track_launch_packet_379.json");
invariant(launchPacket.targetTrack === "par_379", "Launch packet target drifted.");
invariant(launchPacket.launchState === "ready", "Launch packet must be ready.");
requireArrayIncludes(
  launchPacket.mustProduce,
  [
    "NHSAppSsoBridge",
    "SSOEntryGrantStore",
    "AuthBridgeTransactionStore",
    "IdentityAssertionBindingFlow",
    "SessionMergeDecisionFlow",
    "SSOReturnDisposition",
  ],
  "launchPacket.mustProduce",
);
requireArrayIncludes(
  launchPacket.constraints,
  [
    "prompt_none_sso_path_required",
    "single_redemption_grants_only",
    "raw_assertedLoginIdentity_forbidden_in_logs_analytics_referrers_or_history",
  ],
  "launchPacket.constraints",
);

const routeIds = phase7NhsAppSsoBridgeRoutes.map((route) => route.routeId);
for (const routeId of [
  "phase7_nhs_app_sso_entry_capture",
  "phase7_nhs_app_sso_authorize",
  "phase7_nhs_app_sso_callback",
  "phase7_nhs_app_identity_assertion_bind",
  "phase7_nhs_app_sso_return_disposition",
] as const) {
  invariant(routeIds.includes(routeId), `SSO bridge route missing ${routeId}.`);
  invariant(
    serviceDefinition.routeCatalog.some((route) => route.routeId === routeId),
    `command-api serviceDefinition missing ${routeId}.`,
  );
}

const { application, localSession, embeddedContext, start } = startSso();
invariant(
  start.redactedRequest.redirectUrl === "/requests/REQ-123/status?from=nhsApp",
  "Supplier URL must be redacted.",
);
invariant(
  start.redactedRequest.responseHeaders["Cache-Control"] === "no-store",
  "Capture must emit no-store.",
);
invariant(
  start.redactedRequest.responseHeaders["Referrer-Policy"] === "no-referrer",
  "Capture must suppress referrers.",
);
invariant(start.entryGrant.maxRedemptions === 1, "SSOEntryGrant must be single-redemption.");
invariant(
  start.authorizeRequest.parameters.prompt === "none",
  "Authorize request must use prompt=none.",
);
invariant(
  start.authorizeRequest.convertedAssertedIdentityParameter === "asserted_login_identity",
  "Authorize request must convert assertedLoginIdentity to asserted_login_identity.",
);
invariant(
  !JSON.stringify(start).includes(RAW_ASSERTED_IDENTITY),
  "Capture result leaked raw assertedLoginIdentity.",
);
invariant(
  !JSON.stringify({
    grants: application.entryGrantStore.list(),
    transactions: application.transactionStore.list(),
    records: application.recordStore.snapshot(),
    audit: application.listAuditRecords(),
  }).includes(RAW_ASSERTED_IDENTITY),
  "Persistent SSO bridge state leaked raw assertedLoginIdentity.",
);

const success = application.handleCallback({
  ...start.callbackFixture,
  code: "auth-code-379-validator-success",
  returnedSubjectRef: localSession.subjectRef,
  returnedIdentityBindingRef: localSession.identityBindingRef,
  returnedSubjectBindingVersionRef: localSession.subjectBindingVersionRef,
  assertedIdentityHash: start.entryGrant.assertedIdentityHash,
  claimSet: { sub: localSession.subjectRef, vot: "P9.Cp.Cd" },
  existingSession: existingSession(),
  currentEmbeddedContext: embeddedContext,
});
invariant(success.entryGrant?.grantState === "consumed", "Successful callback must consume grant.");
invariant(
  success.transaction?.transactionState === "verified",
  "Successful callback must verify transaction.",
);
invariant(
  success.identityAssertionBinding?.bindingState === "matched",
  "Successful callback must create matched IdentityAssertionBinding.",
);
invariant(
  success.sessionMergeDecision?.decision === "reuse",
  "Same session callback must reuse session.",
);
invariant(
  success.ssoReturnDisposition.outcome === "silent_success",
  "Successful callback must return silent_success.",
);

const replay = application.handleCallback({
  ...start.callbackFixture,
  code: "auth-code-379-validator-replay",
  returnedSubjectRef: localSession.subjectRef,
  returnedIdentityBindingRef: localSession.identityBindingRef,
  returnedSubjectBindingVersionRef: localSession.subjectBindingVersionRef,
  assertedIdentityHash: start.entryGrant.assertedIdentityHash,
  existingSession: existingSession(),
  currentEmbeddedContext: embeddedContext,
});
invariant(
  replay.ssoReturnDisposition.outcome === "safe_reentry_required",
  "Replayed callback must require safe re-entry.",
);
invariant(replay.sessionMergeDecision === null, "Replay must not emit a second session decision.");

const consent = startSso();
const consentResult = consent.application.handleCallback({
  ...consent.start.callbackFixture,
  error: "access_denied",
  errorDescription: "ConsentNotGiven",
});
invariant(
  consentResult.ssoReturnDisposition.outcome === "consent_denied",
  "ConsentNotGiven must map to consent_denied.",
);
invariant(consentResult.entryGrant?.grantState === "denied", "Consent denial must deny grant.");

const mismatch = startSso();
const mismatchResult = mismatch.application.handleCallback({
  ...mismatch.start.callbackFixture,
  code: "auth-code-379-validator-mismatch",
  returnedSubjectRef: "subject:other-patient",
  returnedIdentityBindingRef: "IdentityBinding:other-patient-v1",
  returnedSubjectBindingVersionRef: "SubjectBindingVersion:1",
  assertedIdentityHash: mismatch.start.entryGrant.assertedIdentityHash,
  existingSession: existingSession(),
  currentEmbeddedContext: mismatch.embeddedContext,
});
invariant(
  mismatchResult.identityAssertionBinding?.bindingState === "mismatched",
  "Subject mismatch must produce mismatched binding.",
);
invariant(
  mismatchResult.sessionMergeDecision?.decision === "terminate_and_reenter",
  "Subject mismatch must terminate and re-enter.",
);
invariant(
  mismatchResult.ssoReturnDisposition.outcome === "session_conflict",
  "Subject mismatch must return session_conflict.",
);

const manifestDrift = startSso();
const manifestDriftResult = manifestDrift.application.handleCallback({
  ...manifestDrift.start.callbackFixture,
  code: "auth-code-379-validator-manifest",
  returnedSubjectRef: manifestDrift.localSession.subjectRef,
  returnedIdentityBindingRef: manifestDrift.localSession.identityBindingRef,
  returnedSubjectBindingVersionRef: manifestDrift.localSession.subjectBindingVersionRef,
  assertedIdentityHash: manifestDrift.start.entryGrant.assertedIdentityHash,
  existingSession: existingSession(),
  currentEmbeddedContext: liveEmbeddedContext({ manifestDrift: true }),
});
invariant(
  manifestDriftResult.ssoReturnDisposition.outcome === "manifest_drift",
  "Manifest drift must return manifest_drift.",
);

const contextDrift = startSso();
const contextDriftResult = contextDrift.application.handleCallback({
  ...contextDrift.start.callbackFixture,
  code: "auth-code-379-validator-context",
  returnedSubjectRef: contextDrift.localSession.subjectRef,
  returnedIdentityBindingRef: contextDrift.localSession.identityBindingRef,
  returnedSubjectBindingVersionRef: contextDrift.localSession.subjectBindingVersionRef,
  assertedIdentityHash: contextDrift.start.entryGrant.assertedIdentityHash,
  existingSession: existingSession(),
  currentEmbeddedContext: liveEmbeddedContext({ bridgeUnavailable: true }),
});
invariant(
  contextDriftResult.ssoReturnDisposition.outcome === "context_drift",
  "Non-live embedded context must return context_drift.",
);

const promotedDraft = startSso({
  submissionEnvelopeRef: "SubmissionEnvelope:REQ-123-draft",
  submissionPromotionRecordRef: "SubmissionPromotionRecord:REQ-123-promoted",
});
const promotedDraftResult = promotedDraft.application.handleCallback({
  ...promotedDraft.start.callbackFixture,
  code: "auth-code-379-validator-promoted",
  returnedSubjectRef: promotedDraft.localSession.subjectRef,
  returnedIdentityBindingRef: promotedDraft.localSession.identityBindingRef,
  returnedSubjectBindingVersionRef: promotedDraft.localSession.subjectBindingVersionRef,
  assertedIdentityHash: promotedDraft.start.entryGrant.assertedIdentityHash,
  existingSession: existingSession(),
  currentEmbeddedContext: promotedDraft.embeddedContext,
});
invariant(
  promotedDraftResult.returnIntentValidation.invalidReason === "draft_already_promoted",
  "Promoted draft must not reopen mutable draft state.",
);
invariant(
  promotedDraftResult.ssoReturnDisposition.outcome === "safe_reentry_required",
  "Promoted draft must require safe re-entry.",
);

const stateMachine = readCsv("data/test/379_sso_bridge_state_machine.csv");
for (const caseId of [
  "silent_success_same_subject",
  "consent_denied",
  "callback_replay",
  "subject_mismatch",
  "manifest_drift",
  "promoted_draft_resume",
] as const) {
  invariant(
    stateMachine.some((row) => row.caseId === caseId),
    `SSO bridge state machine missing ${caseId}.`,
  );
}

const dispositions = readCsv("data/test/379_return_disposition_matrix.csv");
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
    dispositions.some((row) => row.outcome === outcome),
    `Return disposition matrix missing ${outcome}.`,
  );
}

const checklistJson = readJson<{ checks?: JsonRecord[] }>(
  "data/test/379_redaction_and_replay_checklist.json",
);
requireArrayIncludes(
  asArray<JsonRecord>(checklistJson.checks, "redaction checklist checks").map((check) =>
    String(check.checkId),
  ),
  ["RAW_001", "RAW_002", "RAW_003", "SSO_001", "SSO_002", "REPLAY_001", "RETURN_001"],
  "redaction and replay checklist",
);

const fixture = readJson<{ examples?: JsonRecord[] }>("data/fixtures/379_sso_bridge_examples.json");
requireArrayIncludes(
  asArray<JsonRecord>(fixture.examples, "fixture.examples").map((example) =>
    String(example.scenarioId),
  ),
  [
    "silent_success_same_subject",
    "consent_denied",
    "entry_grant_replay",
    "subject_mismatch_session_conflict",
    "manifest_drift_recovery",
  ],
  "379 SSO bridge fixture scenarios",
);

const externalNotes = readText("data/analysis/379_external_reference_notes.md");
for (const url of [
  "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
  "https://nhsconnect.github.io/nhslogin/single-sign-on/",
  "https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
] as const) {
  requireIncludes(externalNotes, url, "379 external reference notes");
}
requireIncludes(externalNotes, "Rejected", "379 external reference notes");
requireIncludes(externalNotes, "Deferred", "379 external reference notes");

const docs = [
  "docs/architecture/379_phase7_nhs_app_sso_bridge.md",
  "docs/api/379_phase7_sso_bridge_api.md",
  "docs/security/379_phase7_sso_bridge_redaction_and_replay_rules.md",
  "data/analysis/379_algorithm_alignment_notes.md",
]
  .map((relativePath) => readText(relativePath))
  .join("\n");
for (const term of [
  "SSOEntryGrantStore",
  "AuthBridgeTransactionStore",
  "IdentityAssertionBinding",
  "SessionMergeDecision",
  "ReturnIntent",
  "SSOReturnDisposition",
  "asserted_login_identity",
  "prompt=none",
  "no-store",
  "no-referrer",
  "ConsentNotGiven",
] as const) {
  requireIncludes(docs, term, "379 docs and algorithm notes");
}

const source = readText("services/command-api/src/phase7-nhs-app-sso-bridge-service.ts");
for (const term of [
  "assertedLoginIdentity",
  "rawAssertedIdentityPersisted: false",
  "maxRedemptions: 1",
  "Referrer-Policy",
  "Cache-Control",
] as const) {
  requireIncludes(source, term, "379 SSO bridge source");
}

console.log("379 Phase 7 NHS App SSO bridge validated.");
