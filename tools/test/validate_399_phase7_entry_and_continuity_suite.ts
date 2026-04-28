import fs from "node:fs";
import path from "node:path";

import {
  createDefaultPhase7EmbeddedContextApplication,
  createTrustedContextEvidence,
} from "../../services/command-api/src/phase7-embedded-context-service.ts";
import {
  createDefaultPhase7NhsAppSsoBridgeApplication,
  createPhase7SsoLocalSession,
  createPhase7SsoVerifiedBridge,
} from "../../services/command-api/src/phase7-nhs-app-sso-bridge-service.ts";
import { resolveEmbeddedStartRequestContext } from "../../apps/patient-web/src/embedded-start-request.model.ts";
import { resolveEmbeddedRequestStatusContext } from "../../apps/patient-web/src/embedded-request-status.model.ts";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "docs/tests/399_phase7_embedded_entry_intake_status_and_continuity_suite.md",
  "docs/tests/399_phase7_browser_and_backend_matrix.md",
  "data/test/399_shell_resolution_and_context_cases.csv",
  "data/test/399_sso_and_safe_reentry_cases.csv",
  "data/test/399_intake_resume_and_receipt_cases.csv",
  "data/test/399_request_status_more_info_and_message_cases.csv",
  "data/test/399_suite_results.json",
  "data/test/399_defect_log_and_remediation.json",
  "data/analysis/399_external_reference_notes.md",
  "tools/test/validate_399_phase7_entry_and_continuity_suite.ts",
  "tests/playwright/399_shell_resolution_and_embedded_entry.spec.ts",
  "tests/playwright/399_sso_silent_auth_and_safe_reentry.spec.ts",
  "tests/playwright/399_intake_resume_review_and_receipt.spec.ts",
  "tests/playwright/399_status_more_info_and_messages.spec.ts",
  "tests/integration/399_entry_and_continuity_contract.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:399-phase7-entry-continuity-suite"] ===
    "pnpm exec tsx ./tools/test/validate_399_phase7_entry_and_continuity_suite.ts",
  "package.json missing validate:399-phase7-entry-continuity-suite script.",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_398_/m.test(checklist), "par_398 must be complete before par_399.");
invariant(/^- \[(?:-|X)\] par_399_/m.test(checklist), "par_399 must be claimed or complete.");

const externalNotes = readText("data/analysis/399_external_reference_notes.md");
for (const url of [
  "https://playwright.dev/docs/browser-contexts",
  "https://playwright.dev/docs/auth",
  "https://playwright.dev/docs/trace-viewer",
  "https://playwright.dev/docs/aria-snapshots",
  "https://playwright.dev/docs/test-snapshots",
  "https://playwright.dev/docs/test-assertions",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
  "https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works",
  "https://service-manual.nhs.uk/accessibility",
  "https://service-manual.nhs.uk/design-system/components/error-summary",
]) {
  requireIncludes(externalNotes, url, "399 external reference notes");
}

for (const [file, minimumRows] of [
  ["data/test/399_shell_resolution_and_context_cases.csv", 5],
  ["data/test/399_sso_and_safe_reentry_cases.csv", 9],
  ["data/test/399_intake_resume_and_receipt_cases.csv", 6],
  ["data/test/399_request_status_more_info_and_message_cases.csv", 6],
] as const) {
  invariant(readCsv(file).length >= minimumRows, `${file} missing required scenario rows.`);
}

const results = readJson<{
  status?: string;
  proofs?: Array<{ proofId?: string; status?: string }>;
}>("data/test/399_suite_results.json");
invariant(results.status === "passed", "399 suite results must be passed after verification.");
for (const proofId of [
  "399-backend-entry-continuity-contract",
  "399-shell-resolution-and-embedded-entry",
  "399-sso-silent-auth-and-safe-reentry",
  "399-intake-resume-review-and-receipt",
  "399-status-more-info-and-messages",
]) {
  invariant(
    results.proofs?.some((proof) => proof.proofId === proofId && proof.status === "passed"),
    `399 suite results missing passed proof ${proofId}.`,
  );
}

const defectLog = readJson<{ status?: string; defects?: unknown[] }>(
  "data/test/399_defect_log_and_remediation.json",
);
invariant(defectLog.status === "no_open_defects", "399 defect log has open defects.");
invariant(
  Array.isArray(defectLog.defects) && defectLog.defects.length === 0,
  "399 defect log should be empty.",
);

for (const specPath of [
  "tests/playwright/399_shell_resolution_and_embedded_entry.spec.ts",
  "tests/playwright/399_sso_silent_auth_and_safe_reentry.spec.ts",
  "tests/playwright/399_intake_resume_review_and_receipt.spec.ts",
  "tests/playwright/399_status_more_info_and_messages.spec.ts",
]) {
  const source = readText(specPath);
  for (const needle of [
    "importPlaywright",
    "startPatientWeb",
    "tracing.start",
    "tracing.stop",
    "--run",
  ]) {
    requireIncludes(source, needle, specPath);
  }
}

const backendSource = readText("tests/integration/399_entry_and_continuity_contract.spec.ts");
for (const needle of [
  "createDefaultPhase7EmbeddedContextApplication",
  "createDefaultPhase7NhsAppSsoBridgeApplication",
  "safe_reentry_required",
  "consent_denied",
  "manifest_drift",
  "context_drift",
  "draft_already_promoted",
  "resolveEmbeddedStartRequestContext",
  "resolveEmbeddedRequestStatusContext",
]) {
  requireIncludes(backendSource, needle, "399 backend contract proof");
}

const contextApplication = createDefaultPhase7EmbeddedContextApplication();
const spoof = contextApplication.resolve({
  environment: "sandpit",
  journeyPathId: "jp_request_status",
  routePath: "/requests/REQ-399/status",
  query: { from: "nhsApp", assertedLoginIdentity: "raw" },
});
invariant(
  spoof.blockedReasons.includes("query_hint_not_trusted"),
  "query hint did not fail closed.",
);
invariant(
  spoof.patientEmbeddedNavEligibility.eligibilityState === "placeholder_only",
  "query hint unlocked live eligibility.",
);

const conflict = contextApplication.resolve({
  environment: "sandpit",
  journeyPathId: "jp_request_status",
  routePath: "/requests/REQ-399/status",
  signedContextEvidence: createTrustedContextEvidence({ journeyPathId: "jp_request_status" }),
  localSession: createPhase7SsoLocalSession(),
  bridgeCapability: createPhase7SsoVerifiedBridge(),
  hydrationContext: {
    trustTier: "standalone_or_unknown",
    resolutionDisposition: "standalone",
    channelType: "standalone_web",
  },
});
invariant(
  conflict.blockedReasons.includes("hydration_conflict"),
  "hydration conflict not detected.",
);
invariant(
  conflict.channelContext.resolutionDisposition === "bounded_recovery",
  "hydration conflict should recover safely.",
);

const application = createDefaultPhase7NhsAppSsoBridgeApplication();
const localSession = createPhase7SsoLocalSession();
const embeddedContext = contextApplication.resolve({
  environment: "sandpit",
  journeyPathId: "jp_pharmacy_status",
  routePath: "/requests/REQ-399/pharmacy/status",
  signedContextEvidence: createTrustedContextEvidence({ journeyPathId: "jp_pharmacy_status" }),
  localSession,
  bridgeCapability: createPhase7SsoVerifiedBridge(),
});
const start = application.captureAndAuthorize({
  environment: "sandpit",
  journeyPathId: "jp_pharmacy_status",
  routePath: "/requests/REQ-399/pharmacy/status",
  rawUrl: "/requests/REQ-399/pharmacy/status?assertedLoginIdentity=raw",
  assertedLoginIdentity: "raw",
  expectedSubjectRef: localSession.subjectRef,
  expectedIdentityBindingRef: localSession.identityBindingRef,
  expectedSubjectBindingVersionRef: localSession.subjectBindingVersionRef,
  sessionEpochRef: localSession.sessionEpochRef,
  routeFamilyRef: "pharmacy_status",
  embeddedContext,
  localSession,
  bridgeCapability: createPhase7SsoVerifiedBridge(),
});
invariant(
  start.authorizeRequest.parameters.prompt === "none",
  "authorize request must use prompt=none.",
);
const first = application.handleCallback({
  ...start.callbackFixture,
  code: "auth-code-399-validator",
  returnedSubjectRef: localSession.subjectRef,
  returnedIdentityBindingRef: localSession.identityBindingRef,
  returnedSubjectBindingVersionRef: localSession.subjectBindingVersionRef,
  assertedIdentityHash: start.entryGrant.assertedIdentityHash,
  existingSession: {
    sessionRef: "Session:399-validator",
    subjectRef: localSession.subjectRef,
    identityBindingRef: localSession.identityBindingRef,
    sessionEpochRef: localSession.sessionEpochRef,
    subjectBindingVersionRef: localSession.subjectBindingVersionRef,
    sessionState: "active",
  },
  currentEmbeddedContext: embeddedContext,
});
const replay = application.handleCallback({
  ...start.callbackFixture,
  code: "auth-code-399-validator",
  returnedSubjectRef: localSession.subjectRef,
  returnedIdentityBindingRef: localSession.identityBindingRef,
  returnedSubjectBindingVersionRef: localSession.subjectBindingVersionRef,
  assertedIdentityHash: start.entryGrant.assertedIdentityHash,
  currentEmbeddedContext: embeddedContext,
});
invariant(
  first.ssoReturnDisposition.outcome === "silent_success",
  "first callback did not succeed.",
);
invariant(
  replay.ssoReturnDisposition.outcome === "safe_reentry_required",
  "replay was not fenced.",
);

const promoted = resolveEmbeddedStartRequestContext({
  pathname: "/nhs-app/start-request/dft_399/resume",
  search: "?fixture=promoted",
});
invariant(
  promoted.draftContinuityEvidence.writableResume === false,
  "promoted draft can still resume.",
);
const moreInfo = resolveEmbeddedRequestStatusContext({
  pathname: "/nhs-app/requests/request_211_a/more-info",
  search: "?fixture=more-info",
});
invariant(
  moreInfo.moreInfoThread.answerabilityState === "answerable",
  "more-info answerability drift.",
);

console.log("validate_399_phase7_entry_and_continuity_suite: ok");

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

function readCsv(relativePath: string): Record<string, string>[] {
  const [headerLine, ...lines] = readText(relativePath).trim().split(/\r?\n/u);
  invariant(headerLine, `${relativePath} missing header.`);
  const headers = parseCsvLine(headerLine);
  return lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}
