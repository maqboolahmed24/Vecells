import fs from "node:fs";
import path from "node:path";

import {
  EMBEDDED_ENTRY_PROGRESS_STEPS,
  EMBEDDED_ENTRY_VISUAL_MODE,
  buildEmbeddedEntryUrl,
  isEmbeddedEntryCorridorPath,
  resolveEmbeddedEntryCorridorContext,
  sanitizeEmbeddedEntrySearch,
} from "../../apps/patient-web/src/embedded-entry-corridor.model.ts";

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
    current += char ?? "";
  }
  cells.push(current);
  return cells;
}

function readCsv(relativePath: string): JsonRecord[] {
  const lines = readText(relativePath).trim().split(/\r?\n/).filter(Boolean);
  const headerLine = lines[0];
  invariant(headerLine, `${relativePath} missing header`);
  const headers = parseCsvLine(headerLine);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    invariant(values.length === headers.length, `${relativePath} malformed row: ${line}`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}`);
}

const REQUIRED_FILES = [
  "apps/patient-web/src/embedded-entry-corridor.model.ts",
  "apps/patient-web/src/embedded-entry-corridor.tsx",
  "apps/patient-web/src/embedded-entry-corridor.css",
  "docs/frontend/388_embedded_entry_corridor_spec.md",
  "docs/frontend/388_embedded_entry_corridor_atlas.html",
  "docs/frontend/388_embedded_entry_corridor_topology.mmd",
  "docs/frontend/388_embedded_entry_corridor_tokens.json",
  "docs/accessibility/388_embedded_entry_corridor_a11y_notes.md",
  "data/contracts/388_embedded_entry_corridor_contract.json",
  "data/analysis/388_algorithm_alignment_notes.md",
  "data/analysis/388_visual_reference_notes.json",
  "data/analysis/388_embedded_entry_state_matrix.csv",
  "tools/analysis/validate_388_embedded_entry_corridor_ui.ts",
  "tests/playwright/388_embedded_entry.helpers.ts",
  "tests/playwright/388_embedded_entry_success_and_reauth.spec.ts",
  "tests/playwright/388_embedded_entry_failure_and_recovery.spec.ts",
  "tests/playwright/388_embedded_entry_accessibility.spec.ts",
  "tests/playwright/388_embedded_entry_visual.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:388-embedded-entry-corridor-ui"] ===
    "pnpm exec tsx ./tools/analysis/validate_388_embedded_entry_corridor_ui.ts",
  "package.json missing validate:388-embedded-entry-corridor-ui script",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_387_/m.test(checklist), "par_387 must be complete before par_388.");
invariant(/^- \[(?:-|X)\] par_388_/m.test(checklist), "par_388 must be claimed or complete.");

const appSource = readText("apps/patient-web/src/App.tsx");
requireIncludes(appSource, "EmbeddedEntryCorridorApp", "patient-web App route wiring");
requireIncludes(appSource, "isEmbeddedEntryCorridorPath(pathname)", "patient-web App route wiring");
const entryRouteIndex = appSource.indexOf("isEmbeddedEntryCorridorPath(pathname)");
const shellRouteIndex = appSource.indexOf("isEmbeddedShellSplitPath(pathname, search)");
invariant(entryRouteIndex >= 0 && shellRouteIndex >= 0 && entryRouteIndex < shellRouteIndex, "entry route must precede /nhs-app shell catch-all");

const componentSource = readText("apps/patient-web/src/embedded-entry-corridor.tsx");
for (const componentName of [
  "EmbeddedEntryLanding",
  "EmbeddedIdentityResolverView",
  "EmbeddedEntryStateCard",
  "EmbeddedConsentDeniedView",
  "EmbeddedExpiredSessionView",
  "EmbeddedSafeReentryView",
  "EmbeddedWrongContextRecoveryView",
  "EmbeddedEntryProgressRail",
  "EmbeddedEntryActionCluster",
  "EmbeddedEntryHeaderFrame",
  "EmbeddedEntryStateMachineAdapter",
]) {
  requireIncludes(componentSource, `function ${componentName}`, "component source");
}

for (const hook of [
  "EmbeddedEntryCorridorRoot",
  "EmbeddedEntryStatusCard",
  "EmbeddedEntryActionCluster",
  "data-sensitive-url-redacted",
  "data-return-disposition",
  "data-route-family",
  "data-shell-continuity-key",
  "data-selected-anchor",
]) {
  requireIncludes(componentSource, hook, "automation hooks");
}

for (const rawLeak of [
  "assertedLoginIdentity",
  "asserted_login_identity",
  "JWT",
  "OIDC",
  "nonce",
  "pkce",
  "PKCE",
  "ConsentNotGiven",
  "data-entry-state",
  "data-auth-token",
]) {
  invariant(!componentSource.includes(rawLeak), `component source exposes raw plumbing or forbidden anchor: ${rawLeak}`);
}

const cssSource = readText("apps/patient-web/src/embedded-entry-corridor.css").toLowerCase();
for (const token of [
  "#f6f8fb",
  "#ffffff",
  "#eef3f7",
  "#d9e2ec",
  "#0f172a",
  "#334155",
  "#64748b",
  "#2457ff",
  "#146c43",
  "#a16207",
  "#b42318",
  "34rem",
  "32rem",
  "20px",
  "env(safe-area-inset-bottom",
  "prefers-reduced-motion",
]) {
  requireIncludes(cssSource, token, "embedded entry CSS tokens");
}

invariant(EMBEDDED_ENTRY_VISUAL_MODE === "NHSApp_Embedded_Entry_Corridor", "visual mode drift");
invariant(EMBEDDED_ENTRY_PROGRESS_STEPS.length === 4, "entry progress should have four steps");
invariant(isEmbeddedEntryCorridorPath("/nhs-app/entry"), "entry path not recognized");
invariant(isEmbeddedEntryCorridorPath("/embedded-entry"), "embedded-entry path not recognized");
invariant(!isEmbeddedEntryCorridorPath("/nhs-app/requests/REQ-2049/status"), "shell route should not be entry corridor");

const scrubbed = sanitizeEmbeddedEntrySearch(
  "?entry=landing&route=request_status&assertedLoginIdentity=secret&token=secret&state=secret&nonce=secret&pkce=secret",
);
invariant(scrubbed.sensitiveUrlRedacted, "sensitive URL was not marked redacted");
for (const forbidden of ["assertedLoginIdentity", "token", "state", "nonce", "pkce"]) {
  invariant(!scrubbed.search.includes(forbidden), `scrubbed search still includes ${forbidden}`);
}

const landing = resolveEmbeddedEntryCorridorContext({
  pathname: "/nhs-app/entry",
  search: "?entry=landing&route=request_status",
});
invariant(landing.entryState.title === "Open request status", "landing title drift");
invariant(landing.ssoReturnDisposition.disposition === "entry_ready", "landing disposition drift");
invariant(landing.returnIntent.selectedAnchorRef === landing.selectedAnchorRef, "return intent anchor drift");
invariant(buildEmbeddedEntryUrl({ route: landing.routeNode, entry: "landing" }).includes("/nhs-app/entry"), "entry URL drift");

const success = resolveEmbeddedEntryCorridorContext({
  pathname: "/nhs-app/entry",
  search: "?entry=success&route=request_status&assertedLoginIdentity=secret",
});
invariant(success.entryState.shellHandoffAllowed, "success must allow shell handoff");
invariant(success.ssoReturnDisposition.disposition === "shell_handoff", "success disposition drift");
invariant(success.ssoEntryGrant.rawUrlRedacted, "success raw URL not redacted");
invariant(success.identityAssertionBinding.bindingStatus === "bound", "success binding should be bound after redaction");

const consent = resolveEmbeddedEntryCorridorContext({
  pathname: "/nhs-app/entry",
  search: "?route=request_status&error=access_denied&error_description=ConsentNotGiven",
});
invariant(consent.entryState.title === "You chose not to use your NHS login", "consent-decline title drift");
invariant(consent.ssoReturnDisposition.disposition === "consent_declined", "consent-decline disposition drift");
invariant(!consent.entryState.shellHandoffAllowed, "consent-decline must not hand off");

for (const [entry, expectedTitle] of [
  ["opening", "Opening your NHS login"],
  ["confirming", "Confirming your details"],
  ["expired", "Your session has ended"],
  ["safe_reentry", "Please go back to the NHS App and try again"],
  ["wrong_context", "We could not sign you in here"],
  ["failure", "We could not sign you in here"],
] as const) {
  const context = resolveEmbeddedEntryCorridorContext({
    pathname: "/nhs-app/entry",
    search: `?entry=${entry}&route=request_status`,
  });
  invariant(context.entryState.title === expectedTitle, `${entry} title drift`);
}

const contract = readJson<{
  schemaVersion?: string;
  visualMode?: string;
  components?: unknown[];
  contractObjects?: unknown[];
  privacy?: JsonRecord;
}>("data/contracts/388_embedded_entry_corridor_contract.json");
invariant(contract.schemaVersion === "388.phase7.embedded-entry-corridor.v1", "contract schema drift");
invariant(contract.visualMode === EMBEDDED_ENTRY_VISUAL_MODE, "contract visual mode drift");
invariant(Array.isArray(contract.components) && contract.components.length === 11, "contract component count drift");
invariant(Array.isArray(contract.contractObjects) && contract.contractObjects.length === 7, "contract object count drift");
invariant(contract.privacy?.visibleCopyRawAuthPlumbing === false, "contract must ban raw visible plumbing");
invariant(contract.privacy?.automationAnchorsRawAuthPlumbing === false, "contract must ban raw automation plumbing");

const tokenDoc = readJson<{ visualMode?: string; layout?: JsonRecord }>(
  "docs/frontend/388_embedded_entry_corridor_tokens.json",
);
invariant(tokenDoc.visualMode === EMBEDDED_ENTRY_VISUAL_MODE, "token doc visual mode drift");
invariant(tokenDoc.layout?.surfaceMaxRem === 34, "surface max token drift");
invariant(tokenDoc.layout?.stateCardMaxRem === 32, "state card max token drift");
invariant(tokenDoc.layout?.cardPaddingPx === 20, "card padding token drift");

const matrixRows = readCsv("data/analysis/388_embedded_entry_state_matrix.csv");
invariant(matrixRows.length >= 10, "state matrix must cover success and recovery branches");
for (const scenario of [
  "clean_entry",
  "successful_handoff",
  "silent_reauth_success",
  "consent_denial",
  "session_expiry",
  "wrong_context",
  "safe_reentry",
  "silent_failure",
]) {
  invariant(matrixRows.some((row) => row.scenario === scenario), `state matrix missing ${scenario}`);
}

const visualRefs = readJson<{ sources?: unknown[] }>("data/analysis/388_visual_reference_notes.json");
invariant(Array.isArray(visualRefs.sources) && visualRefs.sources.length >= 14, "visual refs missing sources");
const visualRefsText = JSON.stringify(visualRefs);
for (const requiredSource of [
  "nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance",
  "nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification",
  "nhsconnect.github.io/nhslogin/single-sign-on",
  "digital.nhs.uk/services/nhs-login",
  "service-manual.nhs.uk/content",
  "service-manual.nhs.uk/design-system/components/error-summary",
  "playwright.dev/docs/accessibility-testing",
  "playwright.dev/docs/aria-snapshots",
  "playwright.dev/docs/emulation",
  "playwright.dev/docs/trace-viewer",
  "w3.org/WAI/ARIA/apg/patterns/landmarks",
  "w3c.github.io/wcag/techniques/aria/ARIA22",
  "linear.app/now/how-we-redesigned-the-linear-ui",
  "nextjs.org/docs/app/getting-started/layouts-and-pages",
  "carbondesignsystem.com/components/data-table/usage",
]) {
  requireIncludes(visualRefsText, requiredSource, "visual reference notes");
}

for (const [relativePath, requiredTerms] of Object.entries({
  "docs/frontend/388_embedded_entry_corridor_spec.md": [
    "NHSApp_Embedded_Entry_Corridor",
    "EmbeddedEntryStateMachineAdapter",
    "buildEmbeddedShellUrl",
  ],
  "docs/frontend/388_embedded_entry_corridor_topology.mmd": [
    "EmbeddedEntryStateMachineAdapter",
    "SSOEntryGrant",
    "EmbeddedPatientShellRoot",
  ],
  "docs/accessibility/388_embedded_entry_corridor_a11y_notes.md": [
    "ARIA snapshots",
    "role=\"status\"",
    "role=\"alert\"",
  ],
  "data/analysis/388_algorithm_alignment_notes.md": [
    "Phase 2 Identity Rail",
    "Phase 7 Embedded Shell Rules",
    "Canonical UI Contract Kernel",
  ],
})) {
  const text = readText(relativePath);
  for (const term of requiredTerms) {
    requireIncludes(text, term, relativePath);
  }
}

for (const relativePath of [
  "tests/playwright/388_embedded_entry_success_and_reauth.spec.ts",
  "tests/playwright/388_embedded_entry_failure_and_recovery.spec.ts",
  "tests/playwright/388_embedded_entry_accessibility.spec.ts",
  "tests/playwright/388_embedded_entry_visual.spec.ts",
]) {
  const text = readText(relativePath);
  requireIncludes(text, "startPatientWeb", relativePath);
  requireIncludes(text, "importPlaywright", relativePath);
  requireIncludes(text, "--run", relativePath);
}

console.log("388 embedded entry corridor UI validation passed.");
