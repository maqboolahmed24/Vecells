import fs from "node:fs";
import path from "node:path";

import {
  EMBEDDED_REQUEST_STATUS_VISUAL_MODE,
  embeddedRequestStatusPath,
  isEmbeddedRequestStatusPath,
  resolveEmbeddedRequestStatusContext,
} from "../../apps/patient-web/src/embedded-request-status.model.ts";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
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
  "apps/patient-web/src/embedded-request-status.model.ts",
  "apps/patient-web/src/embedded-request-status.tsx",
  "apps/patient-web/src/embedded-request-status.css",
  "docs/frontend/390_embedded_request_status_spec.md",
  "docs/frontend/390_embedded_request_status_atlas.html",
  "docs/frontend/390_embedded_request_status_topology.mmd",
  "docs/frontend/390_embedded_request_status_tokens.json",
  "docs/accessibility/390_embedded_request_status_a11y_notes.md",
  "data/contracts/390_embedded_request_status_contract.json",
  "data/analysis/390_algorithm_alignment_notes.md",
  "data/analysis/390_visual_reference_notes.json",
  "data/analysis/390_embedded_request_status_state_matrix.csv",
  "tools/analysis/validate_390_embedded_request_status_ui.ts",
  "tests/playwright/390_embedded_request.helpers.ts",
  "tests/playwright/390_embedded_request_status_and_reply.spec.ts",
  "tests/playwright/390_embedded_request_callback_and_messages.spec.ts",
  "tests/playwright/390_embedded_request_accessibility.spec.ts",
  "tests/playwright/390_embedded_request_visual.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:390-embedded-request-status-ui"] ===
    "pnpm exec tsx ./tools/analysis/validate_390_embedded_request_status_ui.ts",
  "package.json missing validate:390-embedded-request-status-ui script",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_389_/m.test(checklist), "par_389 must be complete before par_390.");
invariant(/^- \[(?:-|X)\] par_390_/m.test(checklist), "par_390 must be claimed or complete.");

const appSource = readText("apps/patient-web/src/App.tsx");
requireIncludes(appSource, "EmbeddedRequestStatusApp", "patient-web App route wiring");
requireIncludes(appSource, "isEmbeddedRequestStatusPath(pathname)", "patient-web App route wiring");
const startRouteIndex = appSource.indexOf("isEmbeddedStartRequestPath(pathname)");
const statusRouteIndex = appSource.indexOf("isEmbeddedRequestStatusPath(pathname)");
const shellRouteIndex = appSource.indexOf("isEmbeddedShellSplitPath(pathname, search)");
invariant(statusRouteIndex > startRouteIndex, "request status route should follow start request route");
invariant(statusRouteIndex < shellRouteIndex, "request status route must precede /nhs-app shell catch-all");

const componentSource = readText("apps/patient-web/src/embedded-request-status.tsx");
for (const componentName of [
  "EmbeddedRequestStatusTimeline",
  "EmbeddedRequestHeaderSummary",
  "EmbeddedRequestStateRibbon",
  "EmbeddedMoreInfoResponseFlow",
  "EmbeddedMoreInfoDueCard",
  "EmbeddedConversationCluster",
  "EmbeddedConversationPreviewRow",
  "EmbeddedCallbackStatusCard",
  "EmbeddedRequestRecoveryBanner",
  "EmbeddedRequestAnchorPreserver",
  "EmbeddedRequestActionReserve",
]) {
  invariant(
    componentSource.includes(`function ${componentName}`) ||
      componentSource.includes(`export function ${componentName}`),
    `component source missing ${componentName}`,
  );
}

for (const hook of [
  "EmbeddedRequestStatusFrame",
  "EmbeddedRequestStatusTimeline",
  "EmbeddedRequestHeaderSummary",
  "EmbeddedRequestActionReserve",
  "data-visual-mode",
  "data-selected-anchor",
  "data-continuity-state",
  "aria-live=\"polite\"",
  "role=\"status\"",
]) {
  requireIncludes(componentSource, hook, "automation and accessibility hooks");
}

for (const canonical of [
  "PatientMoreInfoStatusProjection",
  "PatientConversationPreviewDigest",
  "PatientCallbackStatusProjection",
  "answerabilityState",
  "windowRiskState",
]) {
  requireIncludes(readText("apps/patient-web/src/embedded-request-status.model.ts") + componentSource, canonical, "canonical projection binding");
}

const cssSource = readText("apps/patient-web/src/embedded-request-status.css").toLowerCase();
for (const token of [
  "#f6f8fb",
  "#ffffff",
  "#f3f7fb",
  "#d9e2ec",
  "#0f172a",
  "#334155",
  "#64748b",
  "#2457ff",
  "#146c43",
  "#a16207",
  "#b42318",
  "46rem",
  "20px",
  "12px",
  "72px",
  "env(safe-area-inset-bottom",
  "prefers-reduced-motion",
]) {
  requireIncludes(cssSource, token, "embedded request status CSS tokens");
}

invariant(EMBEDDED_REQUEST_STATUS_VISUAL_MODE === "NHSApp_Embedded_Request_Status", "visual mode drift");
invariant(isEmbeddedRequestStatusPath("/nhs-app/requests/request_211_a/status"), "status path not recognized");
invariant(isEmbeddedRequestStatusPath("/nhs-app/requests/request_211_a/more-info"), "more-info path not recognized");
invariant(isEmbeddedRequestStatusPath("/nhs-app/requests/request_211_a/callback"), "callback path not recognized");
invariant(isEmbeddedRequestStatusPath("/embedded-request-status/request_211_a/status"), "fallback path not recognized");
invariant(!isEmbeddedRequestStatusPath("/nhs-app/start-request"), "start request should not be request status");

const builtPath = embeddedRequestStatusPath({
  requestRef: "request_211_a",
  routeKey: "messages",
  fixture: "messages",
});
invariant(builtPath.includes("/nhs-app/requests/request_211_a/messages"), "embedded path builder drift");

const status = resolveEmbeddedRequestStatusContext({
  pathname: "/nhs-app/requests/request_211_a/status",
  search: "?fixture=status",
});
invariant(status.routeKey === "status", "status route drift");
invariant(status.currentState.actionability === "live", "status should expose live next action for reply-needed fixture");
invariant(status.timeline.length === 4, "status timeline should include request, more-info, callback, messages");
invariant(status.continuityEvidence.routeFamilyRef === "rf_patient_requests_embedded", "route family drift");

const moreInfo = resolveEmbeddedRequestStatusContext({
  pathname: "/nhs-app/requests/request_211_a/more-info",
  search: "?fixture=more-info",
});
invariant(moreInfo.routeKey === "more_info", "more-info route drift");
invariant(moreInfo.moreInfoStatus.projectionName === "PatientMoreInfoStatusProjection", "more-info projection missing");
invariant(moreInfo.moreInfoThread.answerabilityState === "answerable", "more-info should be answerable");
invariant(moreInfo.currentState.actionability === "live", "more-info actionability should be live");

const callback = resolveEmbeddedRequestStatusContext({
  pathname: "/nhs-app/requests/request_211_a/callback",
  search: "?fixture=callback",
});
invariant(callback.callbackStatus.projectionName === "PatientCallbackStatusProjection", "callback projection missing");
invariant(callback.currentState.actionability === "secondary", "callback expected should be secondary");

const drifted = resolveEmbeddedRequestStatusContext({
  pathname: "/nhs-app/requests/request_211_a/callback",
  search: "?fixture=callback-drifted",
});
invariant(drifted.recoveryBanner.visible, "callback-drifted should show recovery banner");
invariant(drifted.currentState.actionability === "recovery_required", "callback drift should suppress live actionability");
invariant(drifted.continuityEvidence.sameShellState === "recovery_required", "drift should mark recovery continuity");

const messages = resolveEmbeddedRequestStatusContext({
  pathname: "/nhs-app/requests/request_211_a/messages",
  search: "?fixture=messages",
});
invariant(messages.conversationPreview.projectionName === "PatientConversationPreviewDigest", "message digest missing");
invariant(messages.routeKey === "messages", "messages route drift");

const expired = resolveEmbeddedRequestStatusContext({
  pathname: "/nhs-app/requests/request_211_a/more-info",
  search: "?fixture=expired",
});
invariant(expired.currentState.actionability === "frozen", "expired reply should be frozen");
invariant(expired.recoveryBanner.visible, "expired reply should show recovery banner");

const contract = readJson<{ visualMode?: string; canonicalBindings?: Record<string, unknown>; components?: unknown[] }>(
  "data/contracts/390_embedded_request_status_contract.json",
);
invariant(contract.visualMode === "NHSApp_Embedded_Request_Status", "contract visual mode drift");
invariant(contract.canonicalBindings?.moreInfo === "PatientMoreInfoStatusProjection", "contract more-info binding drift");
invariant(contract.canonicalBindings?.conversation === "PatientConversationPreviewDigest", "contract conversation binding drift");
invariant(Array.isArray(contract.components) && contract.components.length >= 11, "contract missing components");

const tokens = readJson<{ layout?: Record<string, unknown>; color?: Record<string, unknown> }>(
  "docs/frontend/390_embedded_request_status_tokens.json",
);
invariant(tokens.layout?.contentMaxWidth === "46rem", "token manifest width drift");
invariant(tokens.layout?.stickyReserveHeight === "72px", "token manifest reserve drift");
invariant(tokens.color?.accent === "#2457FF", "token accent drift");

const visualRefs = readJson<{ references?: Array<{ url?: string }> }>("data/analysis/390_visual_reference_notes.json");
const visualUrls = (visualRefs.references ?? []).map((reference) => reference.url ?? "").join("\n");
for (const domain of ["nhsconnect.github.io", "service-manual.nhs.uk", "w3.org", "playwright.dev", "linear.app", "carbondesignsystem.com"]) {
  requireIncludes(visualUrls, domain, "visual reference notes");
}

const stateRows = readCsv("data/analysis/390_embedded_request_status_state_matrix.csv");
for (const state of [
  "status_only",
  "more_info_reply",
  "callback_expected",
  "callback_drifted",
  "message_preview",
  "read_only_recovery",
  "expired_reply",
]) {
  invariant(stateRows.some((row) => row.state === state), `state matrix missing ${state}`);
}

for (const relativePath of [
  "tests/playwright/390_embedded_request_status_and_reply.spec.ts",
  "tests/playwright/390_embedded_request_callback_and_messages.spec.ts",
  "tests/playwright/390_embedded_request_accessibility.spec.ts",
  "tests/playwright/390_embedded_request_visual.spec.ts",
]) {
  const source = readText(relativePath);
  requireIncludes(source, "startPatientWeb", `${relativePath} server bootstrap`);
  requireIncludes(source, "importPlaywright", `${relativePath} Playwright import`);
  requireIncludes(source, "--run", `${relativePath} executable runner`);
}

const replySpec = readText("tests/playwright/390_embedded_request_status_and_reply.spec.ts");
for (const term of ["fixture=status", "fixture=more-info", "EmbeddedMoreInfoResponseFlow", "390-status-to-reply-trace.zip"]) {
  requireIncludes(replySpec, term, "status and reply spec coverage");
}

const callbackSpec = readText("tests/playwright/390_embedded_request_callback_and_messages.spec.ts");
for (const term of ["fixture=callback", "fixture=callback-drifted", "fixture=messages", "EmbeddedRequestRecoveryBanner"]) {
  requireIncludes(callbackSpec, term, "callback and messages spec coverage");
}

const accessibilitySpec = readText("tests/playwright/390_embedded_request_accessibility.spec.ts");
for (const term of ["EmbeddedRequestStatusTimeline", "EmbeddedRequestHeaderSummary", "writeAriaSnapshot"]) {
  requireIncludes(accessibilitySpec, term, "accessibility spec coverage");
}

const visualSpec = readText("tests/playwright/390_embedded_request_visual.spec.ts");
for (const term of ["390-embedded-request-status-calm.png", "390-embedded-request-status-recovery.png"]) {
  requireIncludes(visualSpec, term, "visual spec coverage");
}

console.log("390 embedded request status UI validation passed");
