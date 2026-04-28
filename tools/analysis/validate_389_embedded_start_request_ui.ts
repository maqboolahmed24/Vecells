import fs from "node:fs";
import path from "node:path";

import {
  EMBEDDED_START_REQUEST_CONVERGENCE_REF,
  EMBEDDED_START_REQUEST_VISUAL_MODE,
  createEmbeddedStartRequestMemory,
  isEmbeddedStartRequestPath,
  moveEmbeddedDetailsForward,
  resolveEmbeddedStartRequestContext,
  selectEmbeddedRequestType,
} from "../../apps/patient-web/src/embedded-start-request.model.ts";

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
  "apps/patient-web/src/embedded-start-request.model.ts",
  "apps/patient-web/src/embedded-start-request.tsx",
  "apps/patient-web/src/embedded-start-request.css",
  "docs/frontend/389_embedded_start_request_spec.md",
  "docs/frontend/389_embedded_start_request_atlas.html",
  "docs/frontend/389_embedded_start_request_flow_map.mmd",
  "docs/frontend/389_embedded_start_request_tokens.json",
  "docs/accessibility/389_embedded_start_request_a11y_notes.md",
  "data/contracts/389_embedded_start_request_contract.json",
  "data/analysis/389_algorithm_alignment_notes.md",
  "data/analysis/389_visual_reference_notes.json",
  "data/analysis/389_embedded_start_request_state_matrix.csv",
  "tools/analysis/validate_389_embedded_start_request_ui.ts",
  "tests/playwright/389_embedded_start_request.helpers.ts",
  "tests/playwright/389_embedded_start_request_flow.spec.ts",
  "tests/playwright/389_embedded_start_request_autosave_and_resume.spec.ts",
  "tests/playwright/389_embedded_start_request_accessibility.spec.ts",
  "tests/playwright/389_embedded_start_request_visual.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:389-embedded-start-request-ui"] ===
    "pnpm exec tsx ./tools/analysis/validate_389_embedded_start_request_ui.ts",
  "package.json missing validate:389-embedded-start-request-ui script",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_388_/m.test(checklist), "par_388 must be complete before par_389.");
invariant(/^- \[(?:-|X)\] par_389_/m.test(checklist), "par_389 must be claimed or complete.");

const appSource = readText("apps/patient-web/src/App.tsx");
requireIncludes(appSource, "EmbeddedStartRequestApp", "patient-web App route wiring");
requireIncludes(appSource, "isEmbeddedStartRequestPath(pathname)", "patient-web App route wiring");
const entryRouteIndex = appSource.indexOf("isEmbeddedEntryCorridorPath(pathname)");
const startRouteIndex = appSource.indexOf("isEmbeddedStartRequestPath(pathname)");
const shellRouteIndex = appSource.indexOf("isEmbeddedShellSplitPath(pathname, search)");
invariant(entryRouteIndex >= 0 && startRouteIndex > entryRouteIndex, "start request route should follow entry corridor");
invariant(
  startRouteIndex >= 0 && shellRouteIndex >= 0 && startRouteIndex < shellRouteIndex,
  "start request route must precede /nhs-app shell catch-all",
);

const componentSource = readText("apps/patient-web/src/embedded-start-request.tsx");
for (const componentName of [
  "EmbeddedIntakeFrame",
  "EmbeddedIntakeQuestionCard",
  "EmbeddedDraftSaveChip",
  "EmbeddedValidationSummaryBar",
  "EmbeddedReviewWorkspace",
  "EmbeddedSubmitActionBar",
  "EmbeddedReceiptMorphFrame",
  "EmbeddedResumeDraftBanner",
  "EmbeddedIntakeAnchorRail",
  "EmbeddedIntakeFieldsetAdapter",
  "EmbeddedIntakeProgressStepper",
]) {
  invariant(
    componentSource.includes(`function ${componentName}`) ||
      componentSource.includes(`export function ${componentName}`),
    `component source missing ${componentName}`,
  );
}

for (const hook of [
  "EmbeddedIntakeFrame",
  "EmbeddedDraftSaveChip",
  "EmbeddedValidationSummaryBar",
  "EmbeddedSubmitActionBar",
  "EmbeddedReceiptMorphFrame",
  "data-visual-mode",
  "data-route-family",
  "data-selected-anchor",
  "data-envelope-state",
  "role=\"status\"",
  "aria-live=\"polite\"",
]) {
  requireIncludes(componentSource, hook, "automation and accessibility hooks");
}

for (const canonical of [
  "answerProgressiveQuestion",
  "moveEmbeddedDetailsForward",
  "selectEmbeddedRequestType",
  "resolveEmbeddedStartRequestContext",
  "receipt_outcome",
]) {
  requireIncludes(componentSource, canonical, "canonical embedded intake wiring");
}

const cssSource = readText("apps/patient-web/src/embedded-start-request.css").toLowerCase();
for (const token of [
  "#f6f8fb",
  "#ffffff",
  "#f3f6fa",
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
  requireIncludes(cssSource, token, "embedded start request CSS tokens");
}

invariant(EMBEDDED_START_REQUEST_VISUAL_MODE === "NHSApp_Embedded_Start_Request", "visual mode drift");
invariant(isEmbeddedStartRequestPath("/nhs-app/start-request"), "start path not recognized");
invariant(isEmbeddedStartRequestPath("/nhs-app/start-request/dft_389/details"), "details path not recognized");
invariant(isEmbeddedStartRequestPath("/embedded-start-request"), "fallback embedded path not recognized");
invariant(!isEmbeddedStartRequestPath("/nhs-app/requests/REQ-2049/status"), "status shell route should not be start request");

const empty = resolveEmbeddedStartRequestContext({
  pathname: "/nhs-app/start-request",
  search: "?fixture=empty",
});
invariant(empty.step === "request_type", "empty fixture should start at request type");
invariant(empty.draftView.intakeConvergenceContractRef === EMBEDDED_START_REQUEST_CONVERGENCE_REF, "draft convergence drift");
invariant(empty.submissionEnvelope.state === "draft", "empty envelope should be draft");

const selected = selectEmbeddedRequestType(empty.memory, "Symptoms");
invariant(selected.completedStepKeys.includes("request_type"), "request type selection should complete request_type");

const validation = resolveEmbeddedStartRequestContext({
  pathname: "/nhs-app/start-request/dft_389/details",
  search: "?fixture=validation",
});
invariant(validation.step === "details", "validation fixture should resolve details");
invariant(validation.validationIssues.length > 0, "validation fixture should expose detail validation issue");
const blocked = moveEmbeddedDetailsForward(validation.memory);
invariant(!blocked.complete && blocked.validationIssues.length > 0, "empty details should block continuation");

const review = resolveEmbeddedStartRequestContext({
  pathname: "/nhs-app/start-request/dft_389/review",
  search: "?fixture=review",
});
invariant(review.submissionEnvelope.state === "review_ready", "review envelope drift");
invariant(review.progressiveView.activeSummaryChips.length > 0, "review should have canonical summary chips");

const receipt = resolveEmbeddedStartRequestContext({
  pathname: "/nhs-app/start-request/dft_389/receipt",
  search: "?fixture=receipt",
});
invariant(receipt.submissionEnvelope.state === "submitted", "receipt envelope should be submitted");
invariant(Boolean(receipt.submissionEnvelope.promotionRecordRef), "receipt missing promotion record");
invariant(Boolean(receipt.receiptSurface.requestPublicId), "receipt missing public request id");

const promoted = resolveEmbeddedStartRequestContext({
  pathname: "/nhs-app/start-request/dft_389/resume",
  search: "?fixture=promoted",
});
invariant(promoted.step === "resume_recovery", "promoted draft should force recovery step");
invariant(promoted.submissionEnvelope.state === "promoted_recovery", "promoted envelope state drift");
invariant(promoted.draftContinuityEvidence.validationState === "stale", "promoted draft should be stale");
invariant(promoted.draftContinuityEvidence.writableResume === false, "promoted draft must not reopen writable fields");
invariant(promoted.primaryActionLabel === "Open receipt", "promoted action should open receipt");

const contract = readJson<{
  visualMode?: string;
  canonicalBindings?: Record<string, unknown>;
  components?: unknown[];
}>("data/contracts/389_embedded_start_request_contract.json");
invariant(contract.visualMode === "NHSApp_Embedded_Start_Request", "contract visual mode drift");
invariant(
  contract.canonicalBindings?.intakeConvergenceContractRef === EMBEDDED_START_REQUEST_CONVERGENCE_REF,
  "contract convergence ref drift",
);
invariant(Array.isArray(contract.components) && contract.components.length >= 11, "contract missing component list");

const tokens = readJson<{ layout?: Record<string, unknown>; color?: Record<string, unknown> }>(
  "docs/frontend/389_embedded_start_request_tokens.json",
);
invariant(tokens.layout?.contentMaxWidth === "46rem", "token manifest content width drift");
invariant(tokens.layout?.stickyActionReserve === "72px", "token manifest action reserve drift");
invariant(tokens.color?.accent === "#2457FF", "token manifest accent drift");

const visualRefs = readJson<{ references?: Array<{ url?: string }> }>(
  "data/analysis/389_visual_reference_notes.json",
);
const visualUrls = (visualRefs.references ?? []).map((reference) => reference.url ?? "").join("\n");
for (const domain of ["nhsconnect.github.io", "service-manual.nhs.uk", "w3.org", "playwright.dev"]) {
  requireIncludes(visualUrls, domain, "visual reference notes");
}

const stateRows = readCsv("data/analysis/389_embedded_start_request_state_matrix.csv");
for (const state of [
  "empty_request_type",
  "partial_details",
  "validation_error",
  "review_submit",
  "receipt",
  "promoted_recovery",
]) {
  invariant(stateRows.some((row) => row.state === state), `state matrix missing ${state}`);
}

for (const relativePath of [
  "tests/playwright/389_embedded_start_request_flow.spec.ts",
  "tests/playwright/389_embedded_start_request_autosave_and_resume.spec.ts",
  "tests/playwright/389_embedded_start_request_accessibility.spec.ts",
  "tests/playwright/389_embedded_start_request_visual.spec.ts",
]) {
  const source = readText(relativePath);
  requireIncludes(source, "startPatientWeb", `${relativePath} server bootstrap`);
  requireIncludes(source, "importPlaywright", `${relativePath} Playwright import`);
  requireIncludes(source, "--run", `${relativePath} executable runner`);
}

const flowSpec = readText("tests/playwright/389_embedded_start_request_flow.spec.ts");
for (const term of ['fixture: "empty"', 'fixture: "validation"', 'fixture: "review"', "EmbeddedReceiptMorphFrame"]) {
  requireIncludes(flowSpec, term, "flow spec coverage");
}

const autosaveSpec = readText("tests/playwright/389_embedded_start_request_autosave_and_resume.spec.ts");
for (const term of ["EmbeddedDraftSaveChip", 'fixture: "promoted"', "389-autosave-resume-trace.zip"]) {
  requireIncludes(autosaveSpec, term, "autosave/resume spec coverage");
}

const accessibilitySpec = readText("tests/playwright/389_embedded_start_request_accessibility.spec.ts");
for (const term of ["EmbeddedValidationSummaryBar", "EmbeddedSubmitActionBar", "writeAriaSnapshot"]) {
  requireIncludes(accessibilitySpec, term, "accessibility spec coverage");
}

const visualSpec = readText("tests/playwright/389_embedded_start_request_visual.spec.ts");
for (const term of ["389-embedded-start-request-empty.png", "389-embedded-start-request-receipt.png"]) {
  requireIncludes(visualSpec, term, "visual spec coverage");
}

console.log("389 embedded start request UI validation passed");
