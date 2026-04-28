import fs from "node:fs";
import path from "node:path";

import {
  NHS_APP_COMPATIBILITY_EVIDENCE_REF,
  NHS_APP_MANIFEST_VERSION,
  NHS_APP_READINESS_VISUAL_MODE,
  NHS_APP_RELEASE_APPROVAL_FREEZE_REF,
  NHS_APP_ROUTE_INVENTORY,
  buildNhsAppReadinessUrl,
  filterNhsAppRouteInventory,
  parseNhsAppReadinessUrl,
  resolveNhsAppPreviewConstraints,
} from "../../apps/ops-console/src/nhs-app-readiness-cockpit.model.ts";

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
  invariant(headers.length > 1, `${relativePath} header is malformed`);
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
  "apps/ops-console/src/nhs-app-readiness-cockpit.model.ts",
  "apps/ops-console/src/nhs-app-readiness-cockpit.tsx",
  "apps/ops-console/src/nhs-app-readiness-cockpit.css",
  "docs/frontend/386_nhs_app_readiness_cockpit_spec.md",
  "docs/frontend/386_nhs_app_readiness_cockpit_atlas.html",
  "docs/frontend/386_nhs_app_route_inventory_topology.mmd",
  "docs/frontend/386_nhs_app_readiness_tokens.json",
  "docs/accessibility/386_nhs_app_readiness_a11y_notes.md",
  "data/contracts/386_nhs_app_readiness_ui_contract.json",
  "data/analysis/386_algorithm_alignment_notes.md",
  "data/analysis/386_visual_reference_notes.json",
  "data/analysis/386_route_inventory_matrix.csv",
  "tools/analysis/validate_386_nhs_app_readiness_ui.ts",
  "tests/playwright/386_nhs_app_readiness.helpers.ts",
  "tests/playwright/386_nhs_app_readiness_cockpit.spec.ts",
  "tests/playwright/386_nhs_app_readiness_preview.spec.ts",
  "tests/playwright/386_nhs_app_readiness_accessibility.spec.ts",
  "tests/playwright/386_nhs_app_readiness_visual.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:386-nhs-app-readiness-ui"] ===
    "pnpm exec tsx ./tools/analysis/validate_386_nhs_app_readiness_ui.ts",
  "package.json missing validate:386-nhs-app-readiness-ui script",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_385_/m.test(checklist), "par_385 must be complete before par_386.");
invariant(/^- \[(?:-|X)\] par_386_/m.test(checklist), "par_386 must be claimed or complete.");

const appSource = readText("apps/ops-console/src/App.tsx");
requireIncludes(appSource, "/ops/release/nhs-app", "ops-console App route wiring");
requireIncludes(appSource, "NHSAppReadinessCockpit", "ops-console App route wiring");

const componentSource = readText("apps/ops-console/src/nhs-app-readiness-cockpit.tsx");
for (const componentName of [
  "NHSAppReadinessCockpit",
  "NHSAppRouteInventoryTable",
  "NHSAppRouteInspector",
  "NHSAppEmbeddedPreviewPanel",
  "NHSAppEnvironmentTupleRibbon",
  "NHSAppTopologyStrip",
  "NHSAppEvidenceDrawer",
  "NHSAppPreviewCapabilityPanel",
  "NHSAppRouteFreezeBadgeGroup",
]) {
  requireIncludes(componentSource, `function ${componentName}`, "component source");
}

for (const testId of [
  "NHSAppReadinessCockpit",
  "NHSAppRouteInventoryTable",
  "NHSAppRouteInspector",
  "NHSAppEmbeddedPreviewPanel",
  "NHSAppEnvironmentTupleRibbon",
  "NHSAppEvidenceDrawer",
  "data-current-environment-tuple",
  "data-current-preview-mode",
  "data-current-readiness-verdict",
  "data-current-evidence-drawer-state",
]) {
  requireIncludes(componentSource, testId, "automation hooks");
}

const cssSource = readText("apps/ops-console/src/nhs-app-readiness-cockpit.css");
for (const token of [
  "#f5f7fa",
  "#ffffff",
  "#eef2f6",
  "#fbfcfe",
  "#d6dee8",
  "#111827",
  "#2457ff",
  "#146c43",
  "#a16207",
  "#b42318",
  "#6b7280",
  "prefers-reduced-motion",
  "1280px",
  "1040px",
]) {
  requireIncludes(cssSource.toLowerCase(), token, "readiness CSS tokens");
}

const requiredRouteIds = [
  "jp_start_medical_request",
  "jp_start_admin_request",
  "jp_continue_draft",
  "jp_request_status",
  "jp_respond_more_info",
  "jp_manage_local_appointment",
  "jp_pharmacy_choice",
  "jp_pharmacy_status",
  "jp_waitlist_offer_response",
  "jp_hub_alternative_offer",
  "jp_records_letters_summary",
  "jp_patient_message_thread",
  "jp_urgent_emergency_advice",
] as const;

invariant(NHS_APP_ROUTE_INVENTORY.length === 13, "route inventory must list all 13 manifest routes");
for (const routeId of requiredRouteIds) {
  const route = NHS_APP_ROUTE_INVENTORY.find((candidate) => candidate.journeyPathId === routeId);
  invariant(route, `route inventory missing ${routeId}`);
  invariant(route.releaseTuple.manifestVersionRef === NHS_APP_MANIFEST_VERSION, `${routeId} manifest drift`);
  invariant(
    route.releaseTuple.releaseApprovalFreezeRef === NHS_APP_RELEASE_APPROVAL_FREEZE_REF,
    `${routeId} release freeze drift`,
  );
  invariant(route.evidenceRefs.length > 0, `${routeId} missing evidence refs`);
}

const states = new Set(NHS_APP_ROUTE_INVENTORY.map((route) => route.readinessVerdict));
for (const verdict of ["ready", "conditionally_ready", "placeholder_only", "blocked", "evidence_missing"]) {
  invariant(states.has(verdict), `readiness verdict missing from inventory: ${verdict}`);
}

const sandpitRows = filterNhsAppRouteInventory(NHS_APP_ROUTE_INVENTORY, {
  environment: "sandpit",
  readiness: "blocked",
  audience: "all",
  routeFamily: "all",
  freeze: "all",
});
invariant(
  sandpitRows.some((route) => route.journeyPathId === "jp_waitlist_offer_response"),
  "sandpit blocked filter should expose waitlist route",
);

const parsed = parseNhsAppReadinessUrl(
  "/ops/release/nhs-app/routes/jp_waitlist_offer_response",
  "?env=sandpit&readiness=blocked&preview=reduced_motion&evidence=open",
);
invariant(parsed.selectedJourneyPathId === "jp_waitlist_offer_response", "URL selected route did not parse");
invariant(parsed.filters.environment === "sandpit", "URL environment did not parse");
invariant(parsed.previewMode === "reduced_motion", "URL preview mode did not parse");
invariant(parsed.evidenceDrawerOpen, "URL evidence drawer did not parse");
invariant(
  buildNhsAppReadinessUrl(parsed).includes("jp_waitlist_offer_response"),
  "URL builder did not preserve selected route",
);

const waitlist = NHS_APP_ROUTE_INVENTORY.find(
  (route) => route.journeyPathId === "jp_waitlist_offer_response",
);
invariant(waitlist, "waitlist route missing");
const waitlistPreview = resolveNhsAppPreviewConstraints(waitlist, "reduced_motion");
invariant(waitlistPreview.hiddenSupplierChrome, "preview must hide supplier chrome");
invariant(waitlistPreview.reducedMotion, "preview must support reduced motion");
invariant(waitlistPreview.previewStatus === "redirect", "waitlist preview must redirect to safe route");

const contract = readJson<{
  schemaVersion?: string;
  visualMode?: string;
  routeCount?: number;
  sourceTruth?: JsonRecord;
}>("data/contracts/386_nhs_app_readiness_ui_contract.json");
invariant(contract.schemaVersion === "386.phase7.nhs-app-readiness-ui.v1", "contract schema drift");
invariant(contract.visualMode === NHS_APP_READINESS_VISUAL_MODE, "contract visual mode drift");
invariant(contract.routeCount === 13, "contract route count drift");
invariant(
  contract.sourceTruth?.compatibilityEvidenceRef === NHS_APP_COMPATIBILITY_EVIDENCE_REF,
  "contract compatibility evidence drift",
);

const matrixRows = readCsv("data/analysis/386_route_inventory_matrix.csv");
invariant(matrixRows.length === 13, "route inventory matrix must contain 13 rows");
for (const routeId of requiredRouteIds) {
  invariant(matrixRows.some((row) => row.journeyPathId === routeId), `matrix missing ${routeId}`);
}

const visualRefs = readJson<{ sources?: unknown[] }>("data/analysis/386_visual_reference_notes.json");
invariant(Array.isArray(visualRefs.sources) && visualRefs.sources.length >= 8, "visual refs missing sources");
const visualRefsText = JSON.stringify(visualRefs);
for (const requiredSource of [
  "playwright.dev/docs/accessibility-testing",
  "playwright.dev/docs/aria-snapshots",
  "service-manual.nhs.uk/content",
  "service-manual.nhs.uk/design-system/styles/layout",
  "w3.org/WAI/ARIA/apg/patterns/grid",
  "linear.app/blog/how-we-redesigned-the-linear-ui",
  "nextjs.org/docs/app/getting-started/layouts-and-pages",
  "carbondesignsystem.com/components/data-table/usage",
]) {
  requireIncludes(visualRefsText, requiredSource, "visual reference notes");
}

for (const [relativePath, requiredTerms] of Object.entries({
  "docs/frontend/386_nhs_app_readiness_cockpit_spec.md": [
    "NHSAppReadinessCockpit",
    "URL State",
    "NHSApp_Readiness_Cockpit",
  ],
  "docs/accessibility/386_nhs_app_readiness_a11y_notes.md": [
    "Keyboard Order",
    "Table And Tabs",
    "Evidence Drawer",
  ],
  "data/analysis/386_algorithm_alignment_notes.md": ["377 Manifest", "381 Bridge Runtime", "385 Live Control"],
})) {
  const text = readText(relativePath);
  for (const term of requiredTerms) {
    requireIncludes(text, term, relativePath);
  }
}

for (const relativePath of [
  "tests/playwright/386_nhs_app_readiness_cockpit.spec.ts",
  "tests/playwright/386_nhs_app_readiness_preview.spec.ts",
  "tests/playwright/386_nhs_app_readiness_accessibility.spec.ts",
  "tests/playwright/386_nhs_app_readiness_visual.spec.ts",
]) {
  const text = readText(relativePath);
  requireIncludes(text, "startOpsConsole", relativePath);
  requireIncludes(text, "importPlaywright", relativePath);
  requireIncludes(text, "--run", relativePath);
}

console.log("386 NHS App readiness UI validation passed.");
