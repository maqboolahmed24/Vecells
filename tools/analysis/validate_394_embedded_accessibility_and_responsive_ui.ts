import fs from "node:fs";
import path from "node:path";

import {
  EMBEDDED_ACCESSIBILITY_CONTRACT_REF,
  EMBEDDED_ACCESSIBILITY_VISUAL_MODE,
  createEmbeddedA11yCoverageRows,
  embeddedAccessibilityRouteFamilies,
  embeddedA11yPathForFamily,
  resolveEmbeddedA11yCoverageProfile,
} from "../../apps/patient-web/src/embedded-accessibility-responsive.model.ts";

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
  "apps/patient-web/src/embedded-accessibility-responsive.model.ts",
  "apps/patient-web/src/embedded-accessibility-responsive.tsx",
  "apps/patient-web/src/embedded-accessibility-responsive.css",
  "docs/frontend/394_embedded_accessibility_and_responsive_spec.md",
  "docs/frontend/394_embedded_accessibility_and_responsive_atlas.html",
  "docs/frontend/394_embedded_accessibility_and_responsive_topology.mmd",
  "docs/frontend/394_embedded_accessibility_and_responsive_tokens.json",
  "docs/accessibility/394_embedded_accessibility_and_responsive_a11y_notes.md",
  "data/contracts/394_embedded_accessibility_and_responsive_contract.json",
  "data/analysis/394_algorithm_alignment_notes.md",
  "data/analysis/394_visual_reference_notes.json",
  "data/analysis/394_embedded_accessibility_and_responsive_matrix.csv",
  "tools/analysis/validate_394_embedded_accessibility_and_responsive_ui.ts",
  "tests/playwright/394_embedded_accessibility.helpers.ts",
  "tests/playwright/394_embedded_accessibility_focus_and_keyboard.spec.ts",
  "tests/playwright/394_embedded_accessibility_resize_and_announcements.spec.ts",
  "tests/playwright/394_embedded_accessibility_semantics.spec.ts",
  "tests/playwright/394_embedded_accessibility_visual.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:394-embedded-accessibility-and-responsive-ui"] ===
    "pnpm exec tsx ./tools/analysis/validate_394_embedded_accessibility_and_responsive_ui.ts",
  "package.json missing validate:394-embedded-accessibility-and-responsive-ui script",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_393_/m.test(checklist), "par_393 must be complete before par_394.");
invariant(/^- \[(?:-|X)\] par_394_/m.test(checklist), "par_394 must be claimed or complete.");

invariant(
  EMBEDDED_ACCESSIBILITY_VISUAL_MODE === "NHSApp_Embedded_Accessibility_Responsive_Hardening",
  "visual mode drift",
);
invariant(
  EMBEDDED_ACCESSIBILITY_CONTRACT_REF === "EmbeddedAccessibilityResponsiveContract:394:phase7-cross-route",
  "contract ref drift",
);
invariant(embeddedAccessibilityRouteFamilies.length === 7, "route family count drift");
invariant(
  embeddedA11yPathForFamily("booking").includes("/nhs-app/bookings/booking_case_391/offers"),
  "booking path drift",
);
invariant(
  resolveEmbeddedA11yCoverageProfile("embedded_shell").rootTestId === "EmbeddedPatientShellRoot",
  "embedded shell root drift",
);

const appSource = readText("apps/patient-web/src/App.tsx");
requireIncludes(appSource, "embedded-accessibility-responsive.css", "patient-web App CSS wiring");
requireIncludes(appSource, "EmbeddedAccessibilityResponsiveLayer", "patient-web App route wiring");
for (const routeFamily of embeddedAccessibilityRouteFamilies) {
  requireIncludes(appSource, `routeFamily="${routeFamily}"`, "patient-web App route family wiring");
}
const entryIndex = appSource.indexOf('routeFamily="entry_corridor"');
const shellIndex = appSource.indexOf('routeFamily="embedded_shell"');
const nonEmbeddedIndex = appSource.indexOf("isPatientIntakeMissionFramePath(pathname)");
invariant(entryIndex >= 0 && shellIndex > entryIndex, "embedded layer order drift");
invariant(shellIndex < nonEmbeddedIndex, "embedded shell layer must stay before non-embedded routes");

const componentSource = readText("apps/patient-web/src/embedded-accessibility-responsive.tsx");
for (const componentName of [
  "EmbeddedFocusGuard",
  "EmbeddedFocusRestoreBoundary",
  "EmbeddedSafeAreaObserver",
  "StickyActionObscurationGuard",
  "HostResizeResilienceLayer",
  "AssistiveAnnouncementDedupeBus",
  "EmbeddedKeyboardParityHooks",
  "EmbeddedReducedMotionAdapter",
  "EmbeddedA11yCoverageReporter",
  "EmbeddedRouteSemanticBoundary",
  "EmbeddedTargetSizeUtilities",
]) {
  invariant(
    componentSource.includes(`function ${componentName}`) ||
      componentSource.includes(`export function ${componentName}`),
    `component source missing ${componentName}`,
  );
  requireIncludes(componentSource, `data-testid="${componentName}"`, "component automation hooks");
}
for (const hook of [
  "embedded-a11y-announce",
  "--embedded-a11y-sticky-reserve",
  "--embedded-a11y-scroll-clearance",
  "visualViewport",
  "prefers-reduced-motion",
  "aria-live=\"polite\"",
  "data-announcement-count",
  "data-duplicate-count",
  "data-host-resize-state",
]) {
  requireIncludes(componentSource, hook, "embedded accessibility runtime hooks");
}

const modelSource = readText("apps/patient-web/src/embedded-accessibility-responsive.model.ts");
for (const routeFamily of embeddedAccessibilityRouteFamilies) {
  requireIncludes(modelSource, routeFamily, "embedded accessibility model route family");
}
for (const contract of [
  "EmbeddedRouteSemanticBoundary",
  "EmbeddedFocusGuard",
  "EmbeddedFocusRestoreBoundary",
  "StickyActionObscurationGuard",
  "EmbeddedSafeAreaObserver",
  "HostResizeResilienceLayer",
  "AssistiveAnnouncementDedupeBus",
  "EmbeddedKeyboardParityHooks",
  "EmbeddedReducedMotionAdapter",
  "EmbeddedTargetSizeUtilities",
  "EmbeddedA11yCoverageReporter",
]) {
  requireIncludes(modelSource, contract, "embedded accessibility model contracts");
}

const cssSource = readText("apps/patient-web/src/embedded-accessibility-responsive.css").toLowerCase();
for (const token of [
  "#ffdd00",
  "#003087",
  "44px",
  "24px",
  "env(safe-area-inset-bottom",
  "prefers-reduced-motion",
  "focus-visible",
  "scroll-margin-block-end",
  "embeddedsubmitactionbar",
]) {
  requireIncludes(cssSource, token, "embedded accessibility CSS tokens");
}

const contract = readJson<{
  taskId?: string;
  visualMode?: string;
  routes?: JsonRecord[];
  components?: string[];
}>("data/contracts/394_embedded_accessibility_and_responsive_contract.json");
invariant(contract.taskId === "par_394", "contract task drift");
invariant(contract.visualMode === EMBEDDED_ACCESSIBILITY_VISUAL_MODE, "contract visual mode drift");
invariant(contract.routes?.length === embeddedAccessibilityRouteFamilies.length, "contract route count drift");
for (const row of createEmbeddedA11yCoverageRows()) {
  invariant(
    contract.routes?.some(
      (contractRoute) =>
        contractRoute.routeFamily === row.routeFamily &&
        contractRoute.rootTestId === row.rootTestId &&
        contractRoute.actionTestId === row.actionTestId,
    ),
    `contract missing route ${row.routeFamily}`,
  );
}

const tokens = readJson<{ targetSize?: { embeddedControlMinimumCssPixels?: number; wcagAuditFloorCssPixels?: number } }>(
  "docs/frontend/394_embedded_accessibility_and_responsive_tokens.json",
);
invariant(tokens.targetSize?.embeddedControlMinimumCssPixels === 44, "target size token drift");
invariant(tokens.targetSize?.wcagAuditFloorCssPixels === 24, "WCAG target floor drift");

const matrix = readCsv("data/analysis/394_embedded_accessibility_and_responsive_matrix.csv");
invariant(matrix.length === embeddedAccessibilityRouteFamilies.length, "matrix route count drift");
for (const routeFamily of embeddedAccessibilityRouteFamilies) {
  const profile = resolveEmbeddedA11yCoverageProfile(routeFamily);
  invariant(
    matrix.some((row) => row.route_family === routeFamily && row.root_test_id === profile.rootTestId),
    `matrix missing ${routeFamily}`,
  );
}

const spec = readText("docs/frontend/394_embedded_accessibility_and_responsive_spec.md");
for (const sourceUrl of [
  "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
  "https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/",
  "https://service-manual.nhs.uk/accessibility/content",
  "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum",
  "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum",
  "https://playwright.dev/docs/aria-snapshots",
]) {
  requireIncludes(spec, sourceUrl, "spec source references");
}

const visualRefs = readText("data/analysis/394_visual_reference_notes.json");
for (const sourceUrl of [
  "https://linear.app/now/how-we-redesigned-the-linear-ui",
  "https://playwright.dev/docs/emulation",
  "https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance",
]) {
  requireIncludes(visualRefs, sourceUrl, "visual reference source references");
}

const helperSource = readText("tests/playwright/394_embedded_accessibility.helpers.ts");
requireIncludes(helperSource, "runEmbeddedA11yEquivalentAssertions", "394 Playwright helper");
requireIncludes(helperSource, "openEmbeddedA11yRoute", "394 Playwright helper");
for (const specPath of [
  "tests/playwright/394_embedded_accessibility_focus_and_keyboard.spec.ts",
  "tests/playwright/394_embedded_accessibility_resize_and_announcements.spec.ts",
  "tests/playwright/394_embedded_accessibility_semantics.spec.ts",
  "tests/playwright/394_embedded_accessibility_visual.spec.ts",
]) {
  const source = readText(specPath);
  requireIncludes(source, "runEmbeddedA11yEquivalentAssertions", specPath);
  requireIncludes(source, "--run", specPath);
}

console.log(
  JSON.stringify(
    {
      taskId: "par_394",
      visualMode: EMBEDDED_ACCESSIBILITY_VISUAL_MODE,
      routeFamilies: embeddedAccessibilityRouteFamilies.length,
      coverageRows: createEmbeddedA11yCoverageRows().length,
    },
    null,
    2,
  ),
);

