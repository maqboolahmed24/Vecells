import fs from "node:fs";
import path from "node:path";

import {
  EMBEDDED_PHARMACY_VISUAL_MODE,
  embeddedPharmacyPath,
  isEmbeddedPharmacyPath,
  resolveEmbeddedPharmacyContext,
} from "../../apps/patient-web/src/embedded-pharmacy.model.ts";

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
    if (char === "\"" && inQuotes && next === "\"") {
      current += "\"";
      index += 1;
      continue;
    }
    if (char === "\"") {
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
  "apps/patient-web/src/embedded-pharmacy.model.ts",
  "apps/patient-web/src/embedded-pharmacy.tsx",
  "apps/patient-web/src/embedded-pharmacy.css",
  "docs/frontend/392_embedded_pharmacy_spec.md",
  "docs/frontend/392_embedded_pharmacy_atlas.html",
  "docs/frontend/392_embedded_pharmacy_route_topology.mmd",
  "docs/frontend/392_embedded_pharmacy_tokens.json",
  "docs/accessibility/392_embedded_pharmacy_a11y_notes.md",
  "data/contracts/392_embedded_pharmacy_contract.json",
  "data/analysis/392_algorithm_alignment_notes.md",
  "data/analysis/392_visual_reference_notes.json",
  "data/analysis/392_embedded_pharmacy_state_matrix.csv",
  "tools/analysis/validate_392_embedded_pharmacy_ui.ts",
  "tests/playwright/392_embedded_pharmacy.helpers.ts",
  "tests/playwright/392_embedded_pharmacy_choice_and_instructions.spec.ts",
  "tests/playwright/392_embedded_pharmacy_status_and_recovery.spec.ts",
  "tests/playwright/392_embedded_pharmacy_accessibility.spec.ts",
  "tests/playwright/392_embedded_pharmacy_visual.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:392-embedded-pharmacy-ui"] ===
    "pnpm exec tsx ./tools/analysis/validate_392_embedded_pharmacy_ui.ts",
  "package.json missing validate:392-embedded-pharmacy-ui script",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_391_/m.test(checklist), "par_391 must be complete before par_392.");
invariant(/^- \[(?:-|X)\] par_392_/m.test(checklist), "par_392 must be claimed or complete.");

const appSource = readText("apps/patient-web/src/App.tsx");
requireIncludes(appSource, "EmbeddedPharmacyApp", "patient-web App route wiring");
requireIncludes(appSource, "isEmbeddedPharmacyPath(pathname)", "patient-web App route wiring");
const bookingRouteIndex = appSource.indexOf("isEmbeddedBookingPath(pathname)");
const pharmacyRouteIndex = appSource.indexOf("isEmbeddedPharmacyPath(pathname)");
const shellRouteIndex = appSource.indexOf("isEmbeddedShellSplitPath(pathname, search)");
invariant(pharmacyRouteIndex > bookingRouteIndex, "pharmacy route should follow embedded booking route");
invariant(pharmacyRouteIndex < shellRouteIndex, "pharmacy route must precede /nhs-app shell catch-all");

const componentSource = readText("apps/patient-web/src/embedded-pharmacy.tsx");
for (const componentName of [
  "EmbeddedPharmacyChooser",
  "EmbeddedPharmacyChoiceRow",
  "EmbeddedChosenPharmacyCard",
  "EmbeddedPharmacyInstructionsPanel",
  "EmbeddedReferralStatusSurface",
  "EmbeddedPharmacyOutcomeCard",
  "EmbeddedUrgentReturnRecoveryCard",
  "EmbeddedPharmacyRecoveryBanner",
  "EmbeddedChoiceDisclosurePanel",
  "EmbeddedPharmacyDistanceMeta",
  "EmbeddedPharmacyActionReserve",
]) {
  invariant(
    componentSource.includes(`function ${componentName}`) ||
      componentSource.includes(`export function ${componentName}`),
    `component source missing ${componentName}`,
  );
}

for (const hook of [
  "EmbeddedPharmacyFrame",
  "EmbeddedPharmacyChooser",
  "EmbeddedPharmacyActionReserve",
  "data-visual-mode",
  "data-selected-provider",
  "data-continuity-state",
  "aria-live=\"polite\"",
  "aria-expanded",
  "aria-controls",
]) {
  requireIncludes(componentSource, hook, "automation and accessibility hooks");
}

const modelSource = readText("apps/patient-web/src/embedded-pharmacy.model.ts");
for (const canonical of [
  "PharmacyChoiceTruthProjection",
  "PharmacyDispatchTruthProjection",
  "PharmacyOutcomeTruthProjection",
  "PharmacyPatientStatusPreviewSnapshot",
  "EmbeddedPharmacyContinuityEvidence",
]) {
  requireIncludes(modelSource, canonical, "canonical projection binding");
}

const cssSource = readText("apps/patient-web/src/embedded-pharmacy.css").toLowerCase();
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
  "45rem",
  "18px",
  "12px",
  "76px",
  "env(safe-area-inset-bottom",
  "prefers-reduced-motion",
]) {
  requireIncludes(cssSource, token, "embedded pharmacy CSS tokens");
}

invariant(EMBEDDED_PHARMACY_VISUAL_MODE === "NHSApp_Embedded_Pharmacy", "visual mode drift");
invariant(isEmbeddedPharmacyPath("/nhs-app/pharmacy/PHC-2048/choice"), "choice path not recognized");
invariant(isEmbeddedPharmacyPath("/nhs-app/pharmacy/PHC-2184/instructions"), "instructions path not recognized");
invariant(isEmbeddedPharmacyPath("/nhs-app/pharmacy/PHC-2057/status"), "status path not recognized");
invariant(isEmbeddedPharmacyPath("/embedded-pharmacy/PHC-2196/outcome"), "fallback path not recognized");
invariant(!isEmbeddedPharmacyPath("/nhs-app/bookings/booking_case_391/offers"), "booking route should not be pharmacy");

const builtPath = embeddedPharmacyPath({
  pharmacyCaseId: "PHC-2196",
  routeKey: "outcome",
  fixture: "completed",
});
invariant(builtPath.includes("/nhs-app/pharmacy/PHC-2196/outcome"), "embedded pharmacy path builder drift");

const choice = resolveEmbeddedPharmacyContext({
  pathname: "/nhs-app/pharmacy/PHC-2048/choice",
  search: "?fixture=choice",
});
invariant(choice.visualMode === "NHSApp_Embedded_Pharmacy", "choice visual mode drift");
invariant(choice.choicePreview?.truthProjection.projectionState === "choosing", "choice proof missing");
invariant(choice.currentState.actionability === "live", "choice should be live");

const warned = resolveEmbeddedPharmacyContext({
  pathname: "/nhs-app/pharmacy/PHC-2148/choice",
  search: "?fixture=warned-choice",
});
invariant(warned.currentState.actionability === "secondary", "warned choice should be secondary");
invariant(Boolean(warned.choicePreview?.warningAcknowledgement), "warned choice disclosure missing");

const proofRefresh = resolveEmbeddedPharmacyContext({
  pathname: "/nhs-app/pharmacy/PHC-2156/choice",
  search: "?fixture=proof-refresh",
});
invariant(proofRefresh.currentState.actionability === "recovery_required", "proof refresh should require recovery");
invariant(Boolean(proofRefresh.choicePreview?.driftRecovery), "proof refresh drift missing");

const instructions = resolveEmbeddedPharmacyContext({
  pathname: "/nhs-app/pharmacy/PHC-2184/instructions",
  search: "?fixture=referral-sent",
});
invariant(instructions.patientStatusPreview?.surfaceState === "referral_confirmed", "instructions status preview missing");
invariant(Boolean(instructions.patientStatusPreview?.instructionPanel), "instruction panel missing");

const pending = resolveEmbeddedPharmacyContext({
  pathname: "/nhs-app/pharmacy/PHC-2057/status",
  search: "?fixture=dispatch-pending",
});
invariant(pending.currentState.actionability === "read_only", "pending proof should be read-only");
invariant(pending.dispatchPreview?.truthBinding.authoritativeProofState === "pending", "pending dispatch truth missing");

const completed = resolveEmbeddedPharmacyContext({
  pathname: "/nhs-app/pharmacy/PHC-2196/outcome",
  search: "?fixture=completed",
});
invariant(completed.patientStatusPreview?.surfaceState === "completed", "completed outcome missing");
invariant(completed.patientStatusPreview?.outcomeTruth.outcomeTruthState === "settled_resolved", "settled outcome truth missing");

const urgent = resolveEmbeddedPharmacyContext({
  pathname: "/nhs-app/pharmacy/PHC-2103/recovery",
  search: "?fixture=urgent-return",
});
invariant(urgent.currentState.actionability === "recovery_required", "urgent return should require recovery");
invariant(urgent.patientStatusPreview?.surfaceState === "urgent_action", "urgent action projection missing");

const contract = readJson<{ visualMode?: string; canonicalBindings?: Record<string, unknown>; components?: unknown[] }>(
  "data/contracts/392_embedded_pharmacy_contract.json",
);
invariant(contract.visualMode === "NHSApp_Embedded_Pharmacy", "contract visual mode drift");
invariant(contract.canonicalBindings?.choice === "PharmacyChoiceTruthProjection", "contract choice binding drift");
invariant(contract.canonicalBindings?.outcome === "PharmacyOutcomeTruthProjection", "contract outcome binding drift");
invariant(Array.isArray(contract.components) && contract.components.length >= 11, "contract missing components");

const tokens = readJson<{ layout?: Record<string, unknown>; color?: Record<string, unknown> }>(
  "docs/frontend/392_embedded_pharmacy_tokens.json",
);
invariant(tokens.layout?.contentMaxWidth === "45rem", "token width drift");
invariant(tokens.layout?.stickyReserveHeight === "76px", "token reserve drift");
invariant(tokens.color?.accent === "#2457FF", "token accent drift");

const visualRefs = readJson<{ references?: Array<{ url?: string }> }>(
  "data/analysis/392_visual_reference_notes.json",
);
const visualUrls = (visualRefs.references ?? []).map((reference) => reference.url ?? "").join("\n");
for (const domain of [
  "nhsconnect.github.io",
  "nhs.uk",
  "service-manual.nhs.uk",
  "w3.org",
  "playwright.dev",
  "linear.app",
  "vercel.com",
  "carbondesignsystem.com",
]) {
  requireIncludes(visualUrls, domain, "visual reference notes");
}

const stateRows = readCsv("data/analysis/392_embedded_pharmacy_state_matrix.csv");
for (const state of [
  "choice_live",
  "warned_choice_ack",
  "proof_refresh_recovery",
  "instructions_referral_sent",
  "dispatch_pending_status",
  "completed_outcome",
  "urgent_return_recovery",
]) {
  invariant(stateRows.some((row) => row.state === state), `state matrix missing ${state}`);
}

for (const relativePath of [
  "tests/playwright/392_embedded_pharmacy_choice_and_instructions.spec.ts",
  "tests/playwright/392_embedded_pharmacy_status_and_recovery.spec.ts",
  "tests/playwright/392_embedded_pharmacy_accessibility.spec.ts",
  "tests/playwright/392_embedded_pharmacy_visual.spec.ts",
]) {
  const testSource = readText(relativePath);
  requireIncludes(testSource, "startPatientWeb", `${relativePath} Playwright server harness`);
  requireIncludes(testSource, "openEmbeddedPharmacy", `${relativePath} route opener`);
}

console.log("validate_392_embedded_pharmacy_ui: ok");
