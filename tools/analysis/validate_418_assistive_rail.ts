import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "apps/clinical-workspace/src/assistive-rail.tsx",
  "apps/clinical-workspace/src/assistive-rail.css",
  "docs/frontend/418_assistive_rail_and_shadow_presentation_spec.md",
  "docs/frontend/418_assistive_rail_atlas.html",
  "docs/frontend/418_assistive_rail_topology.mmd",
  "docs/frontend/418_assistive_rail_design_tokens.json",
  "docs/accessibility/418_assistive_rail_a11y_notes.md",
  "data/contracts/418_assistive_rail_contract.json",
  "data/analysis/418_algorithm_alignment_notes.md",
  "data/analysis/418_visual_reference_notes.json",
  "data/analysis/418_assistive_rail_state_matrix.csv",
  "data/analysis/PHASE8_BATCH_412_419_INTERFACE_GAP_ASSISTIVE_RAIL_AND_SHADOW_PRESENTATION.json",
  "tests/playwright/418_assistive_rail_shadow_and_observe_only.spec.ts",
  "tests/playwright/418_assistive_rail_keyboard_and_focus.spec.ts",
  "tests/playwright/418_assistive_rail_accessibility.spec.ts",
  "tests/playwright/418_assistive_rail_visual.spec.ts",
  "tools/analysis/validate_418_assistive_rail.ts",
] as const;

const REQUIRED_COMPONENTS = [
  "AssistiveRailShell",
  "AssistiveRailHeader",
  "AssistiveRailCollapseToggle",
  "AssistiveSummaryStubCard",
  "AssistiveShadowModePanel",
  "AssistiveObserveOnlyPlaceholder",
  "AssistiveCapabilityPostureChip",
  "AssistiveProvenanceFooterStub",
  "AssistiveRailKeyboardController",
  "AssistiveRailStateAdapter",
] as const;

const REQUIRED_STATES = [
  "shadow_summary",
  "observe_only",
  "loading",
  "placeholder",
  "hidden_ready",
] as const;

const REQUIRED_REFERENCE_URLS = [
  "https://service-manual.nhs.uk/design-system",
  "https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/complementary.html",
  "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
  "https://playwright.dev/docs/aria-snapshots",
  "https://playwright.dev/docs/browser-contexts",
  "https://playwright.dev/docs/trace-viewer",
  "https://playwright.dev/docs/emulation",
  "https://linear.app/docs/conceptual-model",
  "https://nextjs.org/docs/app/getting-started/layouts-and-pages",
  "https://carbondesignsystem.com/guidelines/accessibility/keyboard/",
  "https://carbondesignsystem.com/components/search/usage/",
] as const;

main();

function main(): void {
  for (const relativePath of REQUIRED_FILES) {
    invariant(
      fs.existsSync(path.join(ROOT, relativePath)),
      `MISSING_REQUIRED_FILE:${relativePath}`,
    );
  }

  const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
  invariant(
    packageJson.scripts?.["validate:418-assistive-rail"] ===
      "pnpm exec tsx ./tools/analysis/validate_418_assistive_rail.ts",
    "package.json missing validate:418-assistive-rail script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[(?:-|X)\] par_418_phase8_track_Playwright_or_other_appropriate_tooling_frontend_build_assistive_side_panel_and_shadow_mode_presentation/m.test(
      checklist,
    ),
    "Checklist task 418 must be claimed or complete while this validator runs.",
  );

  validateUpstreamInputsAndGap();
  validateProductionCode();
  validateContractAndDocs();
  validatePlaywrightSpecs();

  console.log("418 assistive rail and shadow presentation validated.");
}

function validateUpstreamInputsAndGap(): void {
  for (const upstream of [
    "data/contracts/407_transcript_runtime_contract.json",
    "data/contracts/408_documentation_composer_contract.json",
    "data/contracts/410_capability_control_plane_contract.json",
    "data/contracts/411_trust_envelope_projection_contract.json",
    "data/contracts/412_assistive_work_protection_and_insertion_leases_contract.json",
    "data/contracts/415_monitoring_and_trust_projection_contract.json",
    "data/contracts/416_freeze_disposition_and_freshness_invalidations_contract.json",
  ]) {
    invariant(
      fs.existsSync(path.join(ROOT, upstream)),
      `418 requires upstream artifact ${upstream}.`,
    );
  }

  const registry = readJson<{
    launchVerdict?: string;
    tracks?: JsonRecord[];
  }>("data/contracts/403_phase8_track_readiness_registry.json");
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track418 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find(
    (track) => track.trackId === "par_418",
  );
  invariant(track418, "403 registry missing par_418.");
  invariant(
    track418.readinessState === "blocked",
    "Static 403 registry is expected to still mark par_418 blocked.",
  );
  invariant(
    asArray(track418.blockingRefs, "track418.blockingRefs").includes("GAP403_418_REQUIRES_411"),
    "par_418 blocker ref drifted.",
  );

  const gap = readJson<{
    taskId?: string;
    missingSurface?: string;
    temporaryFallback?: string;
    followUpAction?: string;
  }>(
    "data/analysis/PHASE8_BATCH_412_419_INTERFACE_GAP_ASSISTIVE_RAIL_AND_SHADOW_PRESENTATION.json",
  );
  invariant(gap.taskId === "par_418", "418 gap note task id drifted.");
  requireIncludes(String(gap.missingSurface), "GAP403_418_REQUIRES_411", "418 gap note");
  requireIncludes(
    String(gap.temporaryFallback),
    "411_trust_envelope_projection_contract",
    "418 gap fallback",
  );
  requireIncludes(String(gap.followUpAction), "403_track_launch_packet_418", "418 gap follow-up");
}

function validateProductionCode(): void {
  const source = readText("apps/clinical-workspace/src/assistive-rail.tsx");
  for (const component of REQUIRED_COMPONENTS) {
    requireIncludes(source, component, "418 assistive rail source");
  }
  for (const state of REQUIRED_STATES) {
    requireIncludes(source, state, "418 rail states");
  }
  for (const snippet of [
    "ASSISTIVE_RAIL_VISUAL_MODE",
    "Assistive_Rail_Quiet_Copilot",
    'role="complementary"',
    "aria-expanded",
    "aria-controls",
    "Escape",
    "Alt+A",
    "AssistiveRailQuietContentWell",
    "data-actionability-state",
    "data-trust-state",
  ]) {
    requireIncludes(source, snippet, "418 source required snippet");
  }

  const css = readText("apps/clinical-workspace/src/assistive-rail.css");
  for (const snippet of [
    "--assistive-rail-width: 416px",
    "--assistive-rail-collapsed-width: 56px",
    "384px",
    "344px",
    "92vw",
    "prefers-reduced-motion",
    "140ms ease-out",
    "120ms ease-out",
    "100ms ease-out",
    ".staff-shell__layout--assistive",
    ".assistive-rail--collapsed",
  ]) {
    requireIncludes(css, snippet, "418 assistive rail css");
  }

  const app = readText("apps/clinical-workspace/src/App.tsx");
  requireIncludes(app, "./assistive-rail.css", "418 App CSS import");

  const shell = readText("apps/clinical-workspace/src/staff-shell-seed.tsx");
  for (const snippet of [
    "AssistiveRailShell",
    "AssistiveRailStateAdapter",
    "staff-shell__layout--assistive",
    "assistiveRailState && <AssistiveRailShell state={assistiveRailState} />",
  ]) {
    requireIncludes(shell, snippet, "418 staff shell integration");
  }

  const barrel = readText("apps/clinical-workspace/src/workspace-shell.tsx");
  for (const component of REQUIRED_COMPONENTS) {
    requireIncludes(barrel, component, "418 workspace-shell exports");
  }
}

function validateContractAndDocs(): void {
  const contract = readJson<{
    taskId?: string;
    visualMode?: string;
    components?: unknown[];
    states?: JsonRecord[];
    downstreamConsumers?: unknown[];
    invariants?: unknown[];
  }>("data/contracts/418_assistive_rail_contract.json");
  invariant(contract.taskId === "par_418", "418 contract task id drifted.");
  invariant(contract.visualMode === "Assistive_Rail_Quiet_Copilot", "418 visual mode drifted.");
  requireExactSuperset(
    asStringArray(contract.components, "contract.components"),
    REQUIRED_COMPONENTS,
    "418 components",
  );
  requireExactSuperset(
    asArray<JsonRecord>(contract.states, "contract.states").map((state) => String(state.state)),
    REQUIRED_STATES,
    "418 states",
  );
  requireExactSuperset(
    asStringArray(contract.downstreamConsumers, "contract.downstreamConsumers"),
    ["419", "420", "421", "422", "423", "424"],
    "418 downstream consumers",
  );
  requireIncludes(
    JSON.stringify(contract.invariants),
    "shadow_mode_non_authoritative",
    "418 invariants",
  );

  const refs = readText("data/analysis/418_visual_reference_notes.json");
  for (const url of REQUIRED_REFERENCE_URLS) {
    requireIncludes(refs, url, "418 visual references");
  }

  const matrix = readText("data/analysis/418_assistive_rail_state_matrix.csv");
  for (const state of [...REQUIRED_STATES, "collapsed", "narrow_sheet"]) {
    requireIncludes(matrix, state, "418 state matrix");
  }

  for (const doc of [
    "docs/frontend/418_assistive_rail_and_shadow_presentation_spec.md",
    "docs/accessibility/418_assistive_rail_a11y_notes.md",
    "data/analysis/418_algorithm_alignment_notes.md",
    "docs/frontend/418_assistive_rail_atlas.html",
    "docs/frontend/418_assistive_rail_topology.mmd",
    "docs/frontend/418_assistive_rail_design_tokens.json",
  ]) {
    const content = readText(doc);
    requireIncludes(content, "Assistive_Rail_Quiet_Copilot", doc);
  }
}

function validatePlaywrightSpecs(): void {
  const specs = [
    "tests/playwright/418_assistive_rail_shadow_and_observe_only.spec.ts",
    "tests/playwright/418_assistive_rail_keyboard_and_focus.spec.ts",
    "tests/playwright/418_assistive_rail_accessibility.spec.ts",
    "tests/playwright/418_assistive_rail_visual.spec.ts",
  ];
  const combined = specs.map(readText).join("\n");
  for (const snippet of [
    "startClinicalWorkspace",
    "browser.newContext",
    "context.tracing.start",
    "AssistiveRailShell",
    "Assistive_Rail_Quiet_Copilot",
  ]) {
    requireIncludes(combined, snippet, "418 Playwright specs");
  }
  requireIncludes(combined, "toMatchAriaSnapshot", "418 ARIA snapshot spec");
  requireIncludes(combined, "toHaveScreenshot", "418 visual snapshot spec");
  requireIncludes(combined, "assistiveRail=shadow-summary", "418 shadow fixture");
  requireIncludes(combined, "assistiveRail=observe-only", "418 observe fixture");
  requireIncludes(combined, "assistiveRail=loading", "418 loading fixture");
  requireIncludes(combined, "assistiveRail=placeholder", "418 placeholder fixture");
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function requireIncludes(haystack: string, needle: string, context: string): void {
  invariant(haystack.includes(needle), `${context} missing ${needle}`);
}

function asArray<T>(value: unknown, label: string): T[] {
  invariant(Array.isArray(value), `${label} must be an array.`);
  return value as T[];
}

function asStringArray(value: unknown, label: string): string[] {
  return asArray<unknown>(value, label).map((entry) => String(entry));
}

function requireExactSuperset(
  actual: readonly string[],
  expected: readonly string[],
  label: string,
): void {
  const missing = expected.filter((entry) => !actual.includes(entry));
  invariant(missing.length === 0, `${label} missing ${missing.join(", ")}`);
}
