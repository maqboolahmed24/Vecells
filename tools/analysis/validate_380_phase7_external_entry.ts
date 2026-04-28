import fs from "node:fs";
import path from "node:path";
import { serviceDefinition } from "../../services/command-api/src/service-definition";
import {
  createDefaultPhase7ExternalEntryApplication,
  phase7ExternalEntryRoutes,
  type ExternalEntrySessionSnapshot,
} from "../../services/command-api/src/phase7-external-entry-service";
import { PHASE7_MANIFEST_VERSION } from "../../services/command-api/src/phase7-nhs-app-manifest-service";

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

function activeSession(
  input?: Partial<ExternalEntrySessionSnapshot>,
): ExternalEntrySessionSnapshot {
  return {
    sessionRef: input?.sessionRef ?? "Session:380-validator",
    subjectRef: input?.subjectRef ?? "Subject:patient-380",
    sessionEpochRef: input?.sessionEpochRef ?? "SessionEpoch:380-validator",
    subjectBindingVersionRef:
      input?.subjectBindingVersionRef ?? "SubjectBindingVersion:patient-380:v1",
    assuranceLevel: input?.assuranceLevel ?? "nhs_p9",
    sessionState: input?.sessionState ?? "active",
    embeddedSessionRef: input?.embeddedSessionRef ?? "EmbeddedSession:380-validator",
  };
}

async function issueStatusGrant() {
  const application = createDefaultPhase7ExternalEntryApplication();
  const session = activeSession();
  const issuance = await application.issueExternalEntryGrant({
    environment: "sandpit",
    entryMode: "nhs_app_site_link",
    journeyPathId: "jp_pharmacy_status",
    incomingPath: "/requests/REQ-380/pharmacy/status?from=nhsApp&token=validator-raw",
    governingObjectRef: "Request:REQ-380",
    governingObjectVersionRef: "RequestVersion:REQ-380:v1",
    sessionEpochRef: session.sessionEpochRef,
    subjectBindingVersionRef: session.subjectBindingVersionRef,
    lineageFenceRef: "LineageFence:REQ-380",
    subjectRef: session.subjectRef,
    issueIdempotencyKey: "validator-380-issue-status",
    opaqueToken: "validator-external-entry-token-380",
  });
  invariant(issuance.materializedToken, "Expected first issue to materialize token.");
  return { application, session, issuance };
}

const REQUIRED_FILES = [
  "services/command-api/src/phase7-external-entry-service.ts",
  "docs/architecture/380_phase7_external_entry_and_site_link_service.md",
  "docs/api/380_phase7_external_entry_resolution_api.md",
  "docs/ops/380_phase7_site_link_and_secure_link_runbook.md",
  "data/analysis/380_external_reference_notes.md",
  "data/analysis/380_algorithm_alignment_notes.md",
  "data/test/380_external_entry_matrix.csv",
  "data/test/380_site_link_environment_matrix.csv",
  "data/test/380_draft_resume_and_promotion_fence_cases.csv",
  "tools/analysis/validate_380_phase7_external_entry.ts",
  "tests/unit/380_site_link_manifest_and_grant_issuance.spec.ts",
  "tests/integration/380_external_entry_resolution_and_recovery.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:380-phase7-external-entry"] ===
    "pnpm exec tsx ./tools/analysis/validate_380_phase7_external_entry.ts",
  "package.json missing validate:380-phase7-external-entry script.",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_379_/m.test(checklist), "par_379 must be complete before par_380.");
invariant(
  /^- \[(?:-|X)\] par_380_/m.test(checklist),
  "par_380 must be claimed or complete while validator runs.",
);

const serviceSource = readText("services/command-api/src/phase7-external-entry-service.ts");
for (const needle of [
  "AccessGrantService",
  "routeIntentBindingRequired",
  "LinkResolutionAudit",
  "draft_promoted_request_shell_only",
  "PHASE7_380_EXTERNAL_ENTRY_GRANT_CANONICAL_ACCESS_GRANT",
]) {
  requireIncludes(serviceSource, needle, "phase7 external entry service");
}

for (const route of phase7ExternalEntryRoutes) {
  invariant(
    serviceDefinition.routeCatalog.some((catalogRoute) => catalogRoute.routeId === route.routeId),
    `serviceDefinition route catalog missing ${route.routeId}.`,
  );
}

for (const [relativePath, requiredTerms] of Object.entries({
  "docs/architecture/380_phase7_external_entry_and_site_link_service.md": [
    "AccessGrantService",
    "SiteLinkManifest",
    "LinkResolutionAudit",
    "SubmissionIngressRecord",
  ],
  "docs/api/380_phase7_external_entry_resolution_api.md": [
    "/internal/v1/nhs-app/external-entry:resolve",
    "includePhi",
  ],
  "docs/ops/380_phase7_site_link_and_secure_link_runbook.md": [
    "replayed",
    "subject_mismatch",
    "Cache-Control: no-store",
  ],
  "data/analysis/380_external_reference_notes.md": [
    "nhsconnect.github.io",
    "digital.nhs.uk",
    "service-manual.nhs.uk",
  ],
  "data/analysis/380_algorithm_alignment_notes.md": [
    "sessionEpochRef",
    "subjectBindingVersionRef",
    "manifestVersionRef",
    "routeFamilyRef",
  ],
})) {
  const text = readText(relativePath);
  for (const term of requiredTerms) {
    requireIncludes(text, term, relativePath);
  }
}

const externalEntryRows = readCsv("data/test/380_external_entry_matrix.csv");
invariant(externalEntryRows.length >= 7, "External entry matrix must cover at least seven cases.");
invariant(
  externalEntryRows.some(
    (row) => row.grant_state === "replayed" && row.expected_outcome === "bounded_recovery",
  ),
  "External entry matrix must cover replay recovery.",
);
invariant(
  externalEntryRows.some(
    (row) => row.subject_state === "subject_mismatch" && row.expected_outcome === "denied",
  ),
  "External entry matrix must cover subject mismatch denial.",
);

const environmentRows = readCsv("data/test/380_site_link_environment_matrix.csv");
invariant(
  environmentRows.length === 5,
  "Site link environment matrix must cover all five environments.",
);

const draftRows = readCsv("data/test/380_draft_resume_and_promotion_fence_cases.csv");
invariant(
  draftRows.some((row) => row.expected_fence === "draft_promoted_request_shell_only"),
  "Draft matrix must cover promoted draft shell-only recovery.",
);

const manifestApplication = createDefaultPhase7ExternalEntryApplication();
const manifest = manifestApplication.getSiteLinkManifest({ environment: "sandpit" });
invariant(manifest.manifestVersionRef === PHASE7_MANIFEST_VERSION, "Manifest version drifted.");
invariant(
  manifest.canonicalGrantServiceRef === "AccessGrantService",
  "Manifest must cite AccessGrantService.",
);
invariant(
  manifest.allowedPathPatterns.includes("/requests/*"),
  "Manifest missing request site-link path.",
);
const android = manifestApplication.exportAndroidAssetLinks({ environment: "sandpit" });
invariant(
  android.body[0].target.package_name === "uk.nhs.nhsapp.sandpit",
  "Android package drifted.",
);
const ios = manifestApplication.exportIosAssociation({ environment: "sandpit" });
invariant(
  ios.body.applinks.details[0].paths.includes("/requests/*"),
  "iOS association missing request paths.",
);

const { application, session, issuance } = await issueStatusGrant();
const firstResolution = await application.resolveExternalEntry({
  environment: "sandpit",
  entryMode: "nhs_app_site_link",
  journeyPathId: "jp_pharmacy_status",
  incomingPath: "/requests/REQ-380/pharmacy/status?from=nhsApp&token=validator-raw",
  presentedToken: issuance.materializedToken,
  governingObjectRef: "Request:REQ-380",
  governingObjectVersionRef: "RequestVersion:REQ-380:v1",
  lineageFenceRef: "LineageFence:REQ-380",
  currentSession: session,
  redemptionIdempotencyKey: "validator-380-redeem-first",
});
invariant(
  firstResolution.outcome === "resolved_full",
  "First site-link resolution must resolve full.",
);
invariant(
  firstResolution.routeInstruction.includePhi === true,
  "First resolution should include PHI.",
);

const replayResolution = await application.resolveExternalEntry({
  environment: "sandpit",
  entryMode: "nhs_app_site_link",
  journeyPathId: "jp_pharmacy_status",
  incomingPath: "/requests/REQ-380/pharmacy/status?from=nhsApp&token=validator-raw",
  presentedToken: issuance.materializedToken,
  governingObjectRef: "Request:REQ-380",
  governingObjectVersionRef: "RequestVersion:REQ-380:v1",
  lineageFenceRef: "LineageFence:REQ-380",
  currentSession: session,
  redemptionIdempotencyKey: "validator-380-redeem-replay",
});
invariant(replayResolution.grantFenceState === "replayed", "Replay must be fenced.");
invariant(
  replayResolution.outcome === "bounded_recovery",
  "Replay must route to bounded recovery.",
);
invariant(replayResolution.routeInstruction.includePhi === false, "Replay must not include PHI.");

const subjectApplication = createDefaultPhase7ExternalEntryApplication();
const subjectSession = activeSession();
const subjectIssuance = await subjectApplication.issueExternalEntryGrant({
  environment: "sandpit",
  entryMode: "nhs_app_site_link",
  journeyPathId: "jp_pharmacy_status",
  incomingPath: "/requests/REQ-380/pharmacy/status?from=nhsApp",
  governingObjectRef: "Request:REQ-380",
  governingObjectVersionRef: "RequestVersion:REQ-380:v1",
  sessionEpochRef: subjectSession.sessionEpochRef,
  subjectBindingVersionRef: subjectSession.subjectBindingVersionRef,
  lineageFenceRef: "LineageFence:REQ-380",
  subjectRef: subjectSession.subjectRef,
  issueIdempotencyKey: "validator-380-issue-subject",
  opaqueToken: "validator-external-entry-token-380-subject",
});
const subjectMismatch = await subjectApplication.resolveExternalEntry({
  environment: "sandpit",
  entryMode: "nhs_app_site_link",
  journeyPathId: "jp_pharmacy_status",
  incomingPath: "/requests/REQ-380/pharmacy/status?from=nhsApp",
  presentedToken: subjectIssuance.materializedToken,
  governingObjectRef: "Request:REQ-380",
  governingObjectVersionRef: "RequestVersion:REQ-380:v1",
  lineageFenceRef: "LineageFence:REQ-380",
  currentSession: activeSession({
    subjectRef: "Subject:other",
    sessionEpochRef: subjectSession.sessionEpochRef,
    subjectBindingVersionRef: subjectSession.subjectBindingVersionRef,
  }),
  redemptionIdempotencyKey: "validator-380-redeem-subject",
});
invariant(subjectMismatch.outcome === "denied", "Subject mismatch must be denied.");
invariant(
  subjectMismatch.subjectBindingFenceState === "subject_mismatch",
  "Subject mismatch fence must be explicit.",
);

const draftApplication = createDefaultPhase7ExternalEntryApplication();
const draftSession = activeSession();
const draftIssuance = await draftApplication.issueExternalEntryGrant({
  environment: "sandpit",
  entryMode: "continuation_link",
  journeyPathId: "jp_continue_draft",
  incomingPath: "/requests/drafts/DRAFT-380?token=validator-raw",
  governingObjectRef: "Draft:DRAFT-380",
  governingObjectVersionRef: "DraftVersion:DRAFT-380:v1",
  sessionEpochRef: draftSession.sessionEpochRef,
  subjectBindingVersionRef: draftSession.subjectBindingVersionRef,
  lineageFenceRef: "LineageFence:DRAFT-380",
  subjectRef: draftSession.subjectRef,
  issueIdempotencyKey: "validator-380-issue-draft",
  opaqueToken: "validator-external-entry-token-380-draft",
});
const promotedDraft = await draftApplication.resolveExternalEntry({
  environment: "sandpit",
  entryMode: "continuation_link",
  journeyPathId: "jp_continue_draft",
  incomingPath: "/requests/drafts/DRAFT-380?token=validator-raw",
  presentedToken: draftIssuance.materializedToken,
  governingObjectRef: "Draft:DRAFT-380",
  governingObjectVersionRef: "DraftVersion:DRAFT-380:v1",
  lineageFenceRef: "LineageFence:DRAFT-380",
  currentSession: draftSession,
  draftResume: {
    draftRef: "Draft:DRAFT-380",
    expectedSubmissionIngressRecordRef: "SubmissionIngressRecord:380",
    currentSubmissionIngressRecordRef: "SubmissionIngressRecord:380",
    submissionEnvelopeRef: "SubmissionEnvelope:DRAFT-380",
    submissionPromotionRecordRef: "SubmissionPromotionRecord:REQ-380",
    promotedRequestShellRef: "REQ-380",
  },
  redemptionIdempotencyKey: "validator-380-redeem-draft",
});
invariant(promotedDraft.outcome === "bounded_recovery", "Promoted draft must recover.");
invariant(
  promotedDraft.draftResumeFenceState === "draft_promoted_request_shell_only",
  "Promoted draft fence must be explicit.",
);
invariant(
  promotedDraft.routeInstruction.targetRoute === "/requests/REQ-380/status",
  "Promoted draft route drifted.",
);

const auditText = JSON.stringify([
  ...application.listAuditRecords(),
  ...subjectApplication.listAuditRecords(),
  ...draftApplication.listAuditRecords(),
]);
invariant(
  !auditText.includes("validator-external-entry-token-380"),
  "Audit must not persist raw tokens.",
);
invariant(!auditText.includes("validator-raw"), "Audit must not persist raw URL token values.");

console.log("validate_380_phase7_external_entry: ok");
