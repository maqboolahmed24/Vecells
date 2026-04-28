import fs from "node:fs";
import path from "node:path";

import {
  EMBEDDED_PATIENT_ROUTE_TREE,
  EMBEDDED_SHELL_VISUAL_MODE,
  buildEmbeddedShellUrl,
  isEmbeddedShellSplitPath,
  resolveEmbeddedShellContext,
} from "../../apps/patient-web/src/embedded-shell-split.model.ts";

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
  "apps/patient-web/src/embedded-shell-split.model.ts",
  "apps/patient-web/src/embedded-shell-split.tsx",
  "apps/patient-web/src/embedded-shell-split.css",
  "docs/frontend/387_embedded_shell_split_and_recovery_spec.md",
  "docs/frontend/387_embedded_shell_atlas.html",
  "docs/frontend/387_embedded_shell_topology.mmd",
  "docs/frontend/387_embedded_shell_tokens.json",
  "docs/accessibility/387_embedded_shell_a11y_notes.md",
  "data/contracts/387_embedded_shell_contract.json",
  "data/analysis/387_algorithm_alignment_notes.md",
  "data/analysis/387_visual_reference_notes.json",
  "data/analysis/387_embedded_shell_state_matrix.csv",
  "tools/analysis/validate_387_embedded_shell_ui.ts",
  "tests/playwright/387_embedded_shell_continuity.spec.ts",
  "tests/playwright/387_embedded_shell_recovery.spec.ts",
  "tests/playwright/387_embedded_shell_accessibility.spec.ts",
  "tests/playwright/387_embedded_shell_visual.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:387-embedded-shell-ui"] ===
    "pnpm exec tsx ./tools/analysis/validate_387_embedded_shell_ui.ts",
  "package.json missing validate:387-embedded-shell-ui script",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_386_/m.test(checklist), "par_386 must be complete before par_387.");
invariant(/^- \[(?:-|X)\] par_387_/m.test(checklist), "par_387 must be claimed or complete.");

const appSource = readText("apps/patient-web/src/App.tsx");
requireIncludes(appSource, "EmbeddedPatientShellApp", "patient-web App route wiring");
requireIncludes(appSource, "isEmbeddedShellSplitPath(pathname, search)", "patient-web App route wiring");

const componentSource = readText("apps/patient-web/src/embedded-shell-split.tsx");
for (const componentName of [
  "StandaloneShell",
  "EmbeddedShell",
  "EmbeddedShellHeaderFrame",
  "EmbeddedShellStateRibbon",
  "EmbeddedContinuityBanner",
  "EmbeddedRecoveryFrame",
  "EmbeddedActionReserve",
  "EmbeddedSafeAreaContainer",
  "EmbeddedRouteContextBoundary",
]) {
  requireIncludes(componentSource, `function ${componentName}`, "component source");
}

for (const hook of [
  "EmbeddedPatientShellRoot",
  "StandaloneShell",
  "EmbeddedShellHeaderFrame",
  "EmbeddedShellStateRibbon",
  "EmbeddedContinuityBanner",
  "EmbeddedRecoveryFrame",
  "EmbeddedActionReserve",
  "EmbeddedSafeAreaContainer",
  "EmbeddedRouteContextBoundary",
  "data-shell-type",
  "data-channel-profile",
  "data-route-family",
  "data-continuity-key",
  "data-return-anchor",
  "data-dominant-action",
]) {
  requireIncludes(componentSource, hook, "automation hooks");
}

const cssSource = readText("apps/patient-web/src/embedded-shell-split.css").toLowerCase();
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
  "44rem",
  "76px",
  "prefers-reduced-motion",
]) {
  requireIncludes(cssSource, token, "embedded shell CSS tokens");
}

invariant(EMBEDDED_SHELL_VISUAL_MODE === "NHSApp_Embedded_Patient_Shell", "visual mode drift");
invariant(EMBEDDED_PATIENT_ROUTE_TREE.length === 5, "route tree should expose five routes");
for (const routeId of [
  "jp_patient_home",
  "jp_request_status",
  "jp_manage_local_appointment",
  "jp_records_letters_summary",
  "jp_patient_message_thread",
]) {
  invariant(
    EMBEDDED_PATIENT_ROUTE_TREE.some((route) => route.routeId === routeId),
    `route tree missing ${routeId}`,
  );
}

const requestRoute = EMBEDDED_PATIENT_ROUTE_TREE.find((route) => route.routeId === "jp_request_status");
invariant(requestRoute, "request status route missing");
const standaloneUrl = buildEmbeddedShellUrl(requestRoute, "standalone");
const embeddedUrl = buildEmbeddedShellUrl(requestRoute, "embedded");
invariant(standaloneUrl.includes("/requests/REQ-2049/status"), "standalone route URL drift");
invariant(embeddedUrl.includes("/nhs-app/requests/REQ-2049/status"), "embedded route URL drift");
invariant(isEmbeddedShellSplitPath("/nhs-app/requests/REQ-2049/status", ""), "embedded path not recognized");
invariant(
  isEmbeddedShellSplitPath("/requests/REQ-2049/status", "?shell=standalone&phase7=embedded_shell"),
  "standalone shell query path not recognized",
);

const signed = resolveEmbeddedShellContext({
  pathname: "/nhs-app/requests/REQ-2049/status",
  search: "?context=signed&shell=embedded",
});
invariant(signed.shellMode === "embedded", "signed route should render embedded");
invariant(signed.trustTier === "trusted_embedded", "signed route should be trusted");
invariant(signed.shellState === "live", "signed route should be live");

const queryHint = resolveEmbeddedShellContext({
  pathname: "/requests/REQ-2049/status",
  search: "?from=nhsApp",
});
invariant(queryHint.shellMode === "embedded", "query hint should request embedded shell");
invariant(queryHint.trustTier === "query_hint_only", "query hint should not be trusted");
invariant(queryHint.shellState === "revalidate_only", "query hint should revalidate");
invariant(queryHint.recovery.mutationState === "frozen", "query hint actions should be frozen");

const routeFreeze = resolveEmbeddedShellContext({
  pathname: "/nhs-app/appointments/APT-778/manage",
  search: "?context=signed&scenario=route_freeze",
});
invariant(routeFreeze.shellState === "recovery_only", "route freeze should recover in shell");
invariant(routeFreeze.navEligibility.eligibilityState === "read_only", "route freeze should be read-only");

const wrongPatient = resolveEmbeddedShellContext({
  pathname: "/nhs-app/requests/REQ-2049/status",
  search: "?context=signed&scenario=wrong_patient",
});
invariant(wrongPatient.shellState === "blocked", "wrong-patient route should block");

const contract = readJson<{
  schemaVersion?: string;
  visualMode?: string;
  routeCount?: number;
  onePortalTwoShellLaw?: JsonRecord;
}>("data/contracts/387_embedded_shell_contract.json");
invariant(contract.schemaVersion === "387.phase7.embedded-shell.v1", "contract schema drift");
invariant(contract.visualMode === EMBEDDED_SHELL_VISUAL_MODE, "contract visual mode drift");
invariant(contract.routeCount === 5, "contract route count drift");
invariant(contract.onePortalTwoShellLaw?.singleRouteTree === true, "contract must assert single route tree");
invariant(contract.onePortalTwoShellLaw?.forkedRouteContent === false, "contract must ban forked route content");

const tokenDoc = readJson<{ visualMode?: string; layout?: JsonRecord }>(
  "docs/frontend/387_embedded_shell_tokens.json",
);
invariant(tokenDoc.visualMode === EMBEDDED_SHELL_VISUAL_MODE, "token doc visual mode drift");
invariant(tokenDoc.layout?.stickyActionReservePx === 76, "sticky action token drift");

const matrixRows = readCsv("data/analysis/387_embedded_shell_state_matrix.csv");
invariant(matrixRows.length >= 8, "state matrix must cover live and recovery states");
for (const scenario of [
  "embedded_signed_live",
  "embedded_query_hint",
  "embedded_stale_continuity",
  "embedded_wrong_patient",
  "embedded_route_freeze",
  "safe_browser_handoff_return",
]) {
  invariant(matrixRows.some((row) => row.scenario === scenario), `state matrix missing ${scenario}`);
}

const visualRefs = readJson<{ sources?: unknown[] }>("data/analysis/387_visual_reference_notes.json");
invariant(Array.isArray(visualRefs.sources) && visualRefs.sources.length >= 12, "visual refs missing sources");
const visualRefsText = JSON.stringify(visualRefs);
for (const requiredSource of [
  "playwright.dev/docs/accessibility-testing",
  "playwright.dev/docs/aria-snapshots",
  "playwright.dev/docs/emulation",
  "playwright.dev/docs/trace-viewer",
  "playwright.dev/docs/test-snapshots",
  "nhsconnect.github.io/nhsapp-developer-documentation/web-integration-overview",
  "nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance",
  "service-manual.nhs.uk/content",
  "service-manual.nhs.uk/design-system/components/error-summary",
  "w3.org/WAI/ARIA/apg/patterns/landmarks",
  "linear.app/now/how-we-redesigned-the-linear-ui",
  "nextjs.org/docs/app/getting-started/layouts-and-pages",
]) {
  requireIncludes(visualRefsText, requiredSource, "visual reference notes");
}

for (const [relativePath, requiredTerms] of Object.entries({
  "docs/frontend/387_embedded_shell_split_and_recovery_spec.md": [
    "one-portal-two-shell law",
    "EmbeddedRecoveryFrame",
    "sessionStorage",
  ],
  "docs/frontend/387_embedded_shell_topology.mmd": [
    "StandaloneShell",
    "EmbeddedShell",
    "EmbeddedShellConsistencyProjection",
  ],
  "docs/accessibility/387_embedded_shell_a11y_notes.md": [
    "ARIA snapshots",
    "role=\"status\"",
    "duplicate supplier chrome",
  ],
  "data/analysis/387_algorithm_alignment_notes.md": [
    "Phase 7 Shell Split",
    "Canonical UI Contract Kernel",
    "route_freeze",
  ],
})) {
  const text = readText(relativePath);
  for (const term of requiredTerms) {
    requireIncludes(text, term, relativePath);
  }
}

for (const relativePath of [
  "tests/playwright/387_embedded_shell_continuity.spec.ts",
  "tests/playwright/387_embedded_shell_recovery.spec.ts",
  "tests/playwright/387_embedded_shell_accessibility.spec.ts",
  "tests/playwright/387_embedded_shell_visual.spec.ts",
]) {
  const text = readText(relativePath);
  requireIncludes(text, "startPatientWeb", relativePath);
  requireIncludes(text, "importPlaywright", relativePath);
  requireIncludes(text, "--run", relativePath);
}

console.log("387 embedded shell UI validation passed.");
