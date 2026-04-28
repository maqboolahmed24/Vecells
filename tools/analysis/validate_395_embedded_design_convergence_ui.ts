import fs from "node:fs";
import path from "node:path";

import {
  EMBEDDED_DESIGN_CONVERGENCE_CONTRACT_REF,
  EMBEDDED_DESIGN_CONVERGENCE_VISUAL_MODE,
  EMBEDDED_DESIGN_PUBLICATION_BUNDLE_REF,
  createEmbeddedDesignConvergenceRows,
  embeddedDesignRouteFamilies,
  resolveEmbeddedDesignRouteProfile,
} from "../../apps/patient-web/src/embedded-design-convergence.model.ts";

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
  "apps/patient-web/src/embedded-design-convergence.model.ts",
  "apps/patient-web/src/embedded-design-convergence.tsx",
  "apps/patient-web/src/embedded-design-convergence.css",
  "docs/frontend/395_embedded_design_convergence_spec.md",
  "docs/frontend/395_embedded_design_convergence_atlas.html",
  "docs/frontend/395_embedded_design_convergence_topology.mmd",
  "docs/frontend/395_embedded_design_convergence_tokens.json",
  "docs/accessibility/395_embedded_design_convergence_a11y_notes.md",
  "data/contracts/395_embedded_design_convergence_contract.json",
  "data/analysis/395_algorithm_alignment_notes.md",
  "data/analysis/395_visual_reference_notes.json",
  "data/analysis/395_embedded_design_convergence_matrix.csv",
  "tools/analysis/validate_395_embedded_design_convergence_ui.ts",
  "tests/playwright/395_embedded_design_convergence.helpers.ts",
  "tests/playwright/395_embedded_design_convergence_states_and_copy.spec.ts",
  "tests/playwright/395_embedded_design_convergence_visualization_fallbacks.spec.ts",
  "tests/playwright/395_embedded_design_convergence_accessibility.spec.ts",
  "tests/playwright/395_embedded_design_convergence_visual.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:395-embedded-design-convergence-ui"] ===
    "pnpm exec tsx ./tools/analysis/validate_395_embedded_design_convergence_ui.ts",
  "package.json missing validate:395-embedded-design-convergence-ui script",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_394_/m.test(checklist), "par_394 must be complete before par_395.");
invariant(/^- \[(?:-|X)\] par_395_/m.test(checklist), "par_395 must be claimed or complete.");

invariant(
  EMBEDDED_DESIGN_CONVERGENCE_VISUAL_MODE === "NHSApp_Embedded_Converged_Design_Bundle",
  "visual mode drift",
);
invariant(
  EMBEDDED_DESIGN_CONVERGENCE_CONTRACT_REF === "EmbeddedDesignConvergenceContract:395:phase7-publication-bundle",
  "contract ref drift",
);
invariant(
  EMBEDDED_DESIGN_PUBLICATION_BUNDLE_REF === "DesignContractPublicationBundle:395:embedded-nhs-app-patient-routes",
  "publication bundle drift",
);
invariant(embeddedDesignRouteFamilies.length === 7, "design route family count drift");

const appSource = readText("apps/patient-web/src/App.tsx");
requireIncludes(appSource, "embedded-design-convergence.css", "patient-web App CSS wiring");
requireIncludes(appSource, "EmbeddedDesignBundleProvider", "patient-web App provider wiring");
requireIncludes(appSource, "renderEmbeddedRoute", "patient-web embedded route wiring");
for (const routeFamily of embeddedDesignRouteFamilies) {
  requireIncludes(appSource, `renderEmbeddedRoute("${routeFamily}"`, "patient-web route family design wiring");
}

const componentSource = readText("apps/patient-web/src/embedded-design-convergence.tsx");
for (const componentName of [
  "EmbeddedDesignBundleProvider",
  "EmbeddedStateCopyRegistry",
  "EmbeddedAutomationAnchorRegistry",
  "EmbeddedSemanticGrammarRegistry",
  "EmbeddedIconographyRuleset",
  "EmbeddedVisualizationFallbackAdapter",
  "EmbeddedVisualizationTableSurface",
  "EmbeddedVisualizationParityBanner",
  "EmbeddedBundleAuditPanel",
  "EmbeddedDesignConvergenceLinter",
  "EmbeddedMicrocopyNormalizer",
]) {
  invariant(
    componentSource.includes(`function ${componentName}`) ||
      componentSource.includes(`export function ${componentName}`),
    `component source missing ${componentName}`,
  );
  requireIncludes(componentSource, `data-testid="${componentName}"`, "component automation hooks");
}
for (const hook of [
  "DesignContractPublicationBundle",
  "VisualizationFallbackContract",
  "VisualizationTableContract",
  "VisualizationParityProjection",
  "data-linter-state",
  "data-primary-state-label",
  "data-table-contract-ref",
]) {
  requireIncludes(componentSource, hook, "design convergence source hooks");
}

const modelSource = readText("apps/patient-web/src/embedded-design-convergence.model.ts");
for (const routeFamily of embeddedDesignRouteFamilies) {
  const profile = resolveEmbeddedDesignRouteProfile(routeFamily);
  requireIncludes(modelSource, routeFamily, "design model route family");
  requireIncludes(modelSource, profile.rootTestId, "design model root test id");
  invariant(profile.visualizationFallbacks.length >= 1, `${routeFamily} missing fallback profiles`);
}
invariant(
  resolveEmbeddedDesignRouteProfile("recovery_artifact").visualizationFallbacks.length === 2,
  "recovery artifact should publish two fallback surfaces",
);

const cssSource = readText("apps/patient-web/src/embedded-design-convergence.css").toLowerCase();
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
  "--embedded-entry-canvas",
  "--embedded-intake-canvas",
  "--embedded-request-canvas",
  "--embedded-booking-canvas",
  "--embedded-pharmacy-canvas",
  "--embedded-recovery-canvas",
  "--embedded-shell-canvas",
  "prefers-reduced-motion",
]) {
  requireIncludes(cssSource, token, "design convergence CSS tokens");
}

const contract = readJson<{
  taskId?: string;
  visualMode?: string;
  routeFamilies?: JsonRecord[];
  components?: string[];
}>("data/contracts/395_embedded_design_convergence_contract.json");
invariant(contract.taskId === "par_395", "contract task drift");
invariant(contract.visualMode === EMBEDDED_DESIGN_CONVERGENCE_VISUAL_MODE, "contract visual mode drift");
invariant(contract.routeFamilies?.length === embeddedDesignRouteFamilies.length, "contract route count drift");
for (const row of createEmbeddedDesignConvergenceRows()) {
  invariant(
    contract.routeFamilies?.some(
      (contractRoute) =>
        contractRoute.routeFamily === row.routeFamily &&
        contractRoute.archetype === row.archetype &&
        contractRoute.rootTestId === row.rootTestId,
    ),
    `contract missing route ${row.routeFamily}`,
  );
}

const tokens = readJson<{ palette?: Record<string, string>; motion?: Record<string, string> }>(
  "docs/frontend/395_embedded_design_convergence_tokens.json",
);
invariant(tokens.palette?.accent === "#2457FF", "accent token drift");
invariant(tokens.motion?.standard === "160ms", "motion token drift");

const matrix = readCsv("data/analysis/395_embedded_design_convergence_matrix.csv");
invariant(matrix.length === 8, "matrix should include seven route families and two recovery fallback rows");
for (const routeFamily of embeddedDesignRouteFamilies) {
  const profile = resolveEmbeddedDesignRouteProfile(routeFamily);
  invariant(
    matrix.some((row) => row.route_family === routeFamily && row.root_test_id === profile.rootTestId),
    `matrix missing ${routeFamily}`,
  );
}

const spec = readText("docs/frontend/395_embedded_design_convergence_spec.md");
for (const sourceUrl of [
  "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
  "https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/",
  "https://service-manual.nhs.uk/accessibility/content",
  "https://service-manual.nhs.uk/content",
  "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/",
  "https://playwright.dev/docs/aria-snapshots",
  "https://carbondesignsystem.com/components/data-table/style/",
  "https://linear.app/now/how-we-redesigned-the-linear-ui",
]) {
  requireIncludes(spec, sourceUrl, "spec source references");
}

const visualRefs = readText("data/analysis/395_visual_reference_notes.json");
for (const sourceUrl of [
  "https://playwright.dev/docs/emulation",
  "https://playwright.dev/docs/test-snapshots",
  "https://nextjs.org/docs/app/getting-started/layouts-and-pages",
]) {
  requireIncludes(visualRefs, sourceUrl, "visual reference source references");
}

const helperSource = readText("tests/playwright/395_embedded_design_convergence.helpers.ts");
requireIncludes(helperSource, "runEmbeddedDesignConvergenceAssertions", "395 Playwright helper");
requireIncludes(helperSource, "openEmbeddedDesignRoute", "395 Playwright helper");
for (const specPath of [
  "tests/playwright/395_embedded_design_convergence_states_and_copy.spec.ts",
  "tests/playwright/395_embedded_design_convergence_visualization_fallbacks.spec.ts",
  "tests/playwright/395_embedded_design_convergence_accessibility.spec.ts",
  "tests/playwright/395_embedded_design_convergence_visual.spec.ts",
]) {
  const source = readText(specPath);
  requireIncludes(source, "runEmbeddedDesignConvergenceAssertions", specPath);
  requireIncludes(source, "--run", specPath);
}

console.log(
  JSON.stringify(
    {
      taskId: "par_395",
      visualMode: EMBEDDED_DESIGN_CONVERGENCE_VISUAL_MODE,
      routeFamilies: embeddedDesignRouteFamilies.length,
      fallbackSurfaces: matrix.length,
    },
    null,
    2,
  ),
);

