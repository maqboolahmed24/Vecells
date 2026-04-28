import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "apps/clinical-workspace/src/assistive-workspace-stage.tsx",
  "apps/clinical-workspace/src/assistive-workspace-stage.css",
  "apps/clinical-workspace/src/staff-shell-seed.tsx",
  "apps/clinical-workspace/src/App.tsx",
  "apps/clinical-workspace/src/workspace-shell.tsx",
  "docs/frontend/424_same_shell_assistive_stage_spec.md",
  "docs/frontend/424_same_shell_assistive_stage_atlas.html",
  "docs/frontend/424_same_shell_assistive_stage_topology.mmd",
  "docs/frontend/424_same_shell_assistive_stage_design_tokens.json",
  "docs/accessibility/424_same_shell_assistive_stage_a11y_notes.md",
  "data/contracts/424_same_shell_assistive_stage_contract.json",
  "data/analysis/424_algorithm_alignment_notes.md",
  "data/analysis/424_visual_reference_notes.json",
  "data/analysis/424_stage_promotion_matrix.csv",
  "data/analysis/PHASE8_BATCH_420_427_INTERFACE_GAP_SAME_SHELL_ASSISTIVE_STAGE.json",
  "tests/playwright/424_same_shell_stage_layout.spec.ts",
  "tests/playwright/424_same_shell_stage_keyboard_and_focus.spec.ts",
  "tests/playwright/424_same_shell_stage_responsive.spec.ts",
  "tests/playwright/424_same_shell_stage_accessibility.spec.ts",
  "tests/playwright/424_same_shell_stage_visual.spec.ts",
  "tools/analysis/validate_424_same_shell_stage.ts",
] as const;

const REQUIRED_COMPONENTS = [
  "AssistiveWorkspaceStageHost",
  "AssistiveWorkspaceStageBindingView",
  "AssistiveSummaryStubCluster",
  "AssistiveStagePromoter",
  "AssistiveStagePinController",
  "AssistiveAttentionBudgetCoordinator",
  "AssistiveAnchorSyncBridge",
  "AssistiveDecisionDockCoexistenceFrame",
  "AssistiveResponsiveFoldController",
  "AssistiveWorkspaceStageStateAdapter",
] as const;

const REQUIRED_FIXTURES = ["summary-stub", "promoted", "pinned", "downgraded", "folded"] as const;

const REQUIRED_REFERENCE_URLS = [
  "https://service-manual.nhs.uk/accessibility",
  "https://service-manual.nhs.uk/content",
  "https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/complementary.html",
  "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/",
  "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
  "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
  "https://playwright.dev/docs/aria-snapshots",
  "https://playwright.dev/docs/test-snapshots",
  "https://playwright.dev/docs/emulation",
  "https://playwright.dev/docs/browser-contexts",
  "https://nextjs.org/docs/app/getting-started/layouts-and-pages",
  "https://linear.app/docs/inbox",
  "https://linear.app/docs/display-options",
  "https://carbondesignsystem.com/components/UI-shell-right-panel/usage/",
  "https://carbondesignsystem.com/components/contained-list/usage/",
  "https://carbondesignsystem.com/components/data-table/usage/",
  "https://carbondesignsystem.com/components/tabs/usage/",
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
    packageJson.scripts?.["validate:424-same-shell-stage"] ===
      "pnpm exec tsx ./tools/analysis/validate_424_same_shell_stage.ts",
    "package.json missing validate:424-same-shell-stage script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[(?:-|X)\] par_424_phase8_track_Playwright_or_other_appropriate_tooling_frontend_build_same_shell_assistive_stage_integration_with_workspace/m.test(
      checklist,
    ),
    "Checklist task 424 must be claimed or complete while this validator runs.",
  );

  validateUpstreamInputsAndGap();
  validateProductionCode();
  validateContractAndDocs();
  validatePlaywrightSpecs();

  console.log("424 same-shell assistive stage validated.");
}

function validateUpstreamInputsAndGap(): void {
  for (const upstream of [
    "data/contracts/418_assistive_rail_contract.json",
    "data/contracts/419_diffable_note_draft_contract.json",
    "data/contracts/420_confidence_provenance_contract.json",
    "data/contracts/421_override_reason_contract.json",
    "data/contracts/422_trust_posture_contract.json",
    "data/contracts/423_stale_freeze_recovery_contract.json",
  ]) {
    invariant(
      fs.existsSync(path.join(ROOT, upstream)),
      `424 requires upstream artifact ${upstream}.`,
    );
  }

  const registry = readJson<{ launchVerdict?: string; tracks?: JsonRecord[] }>(
    "data/contracts/403_phase8_track_readiness_registry.json",
  );
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track424 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find(
    (track) => track.trackId === "par_424",
  );
  invariant(!track424, "Static 403 registry unexpectedly contains par_424; update 424 validator.");

  const gap = readJson<{
    taskId?: string;
    missingSurface?: string;
    expectedOwnerTask?: string;
    temporaryFallback?: string;
    followUpAction?: string;
  }>("data/analysis/PHASE8_BATCH_420_427_INTERFACE_GAP_SAME_SHELL_ASSISTIVE_STAGE.json");
  invariant(gap.taskId === "par_424", "424 gap note task id drifted.");
  invariant(gap.expectedOwnerTask === "par_403", "424 gap note expected owner drifted.");
  for (const upstream of ["418", "419", "420", "421", "422", "423"]) {
    requireIncludes(String(gap.temporaryFallback), upstream, "424 gap fallback");
  }
  requireIncludes(String(gap.followUpAction), "403_track_launch_packet_424", "424 gap follow-up");
}

function validateProductionCode(): void {
  const source = readText("apps/clinical-workspace/src/assistive-workspace-stage.tsx");
  for (const component of REQUIRED_COMPONENTS) {
    requireIncludes(source, component, "424 same-shell stage source");
  }
  for (const fixture of REQUIRED_FIXTURES) {
    requireIncludes(source, fixture, "424 fixture");
  }
  for (const snippet of [
    "Assistive_Same_Shell_Stage",
    "assistiveStage",
    'role="complementary"',
    "aria-expanded",
    "aria-controls",
    "aria-pressed",
    'role="tablist"',
    'role="tabpanel"',
    "AttentionBudget",
    "WorkspaceTrustEnvelope",
    "AssistiveCapabilityTrustEnvelope",
    "primaryCanvasMinWidthPx: 720",
    "Escape",
    "window.requestAnimationFrame",
  ]) {
    requireIncludes(source, snippet, "424 source required snippet");
  }

  const css = readText("apps/clinical-workspace/src/assistive-workspace-stage.css");
  for (const snippet of [
    "#f5f7fa",
    "#ffffff",
    "#eef2f7",
    "#d7dfe8",
    "#0f172a",
    "#334155",
    "#64748b",
    "#2457ff",
    "#0f766e",
    "#e2e8f0",
    "--assistive-stage-width: 440px",
    "--assistive-stage-width: 400px",
    "--assistive-stage-width: 360px",
    "min-height: 56px",
    "padding: 16px",
    "140ms ease-out",
    "120ms ease-out",
    "100ms ease-out",
    "prefers-reduced-motion",
  ]) {
    requireIncludes(css, snippet, "424 same-shell stage CSS");
  }

  const seed = readText("apps/clinical-workspace/src/staff-shell-seed.tsx");
  for (const snippet of [
    "AssistiveWorkspaceStageHost",
    "AssistiveWorkspaceStageStateAdapter",
    '"assistiveStage"',
    "promotedAssistiveStageState",
    "staff-shell__layout--assistive-stage",
    "assistiveStageState\n            ? null\n            : assistiveRailState",
  ]) {
    requireIncludes(seed, snippet, "424 staff-shell route wiring");
  }

  const app = readText("apps/clinical-workspace/src/App.tsx");
  requireIncludes(app, "./assistive-workspace-stage.css", "424 App CSS import");

  const barrel = readText("apps/clinical-workspace/src/workspace-shell.tsx");
  for (const component of REQUIRED_COMPONENTS) {
    requireIncludes(barrel, component, "424 workspace-shell exports");
  }
}

function validateContractAndDocs(): void {
  const contract = readJson<{
    taskId?: string;
    visualMode?: string;
    components?: unknown[];
    fixtures?: unknown[];
    invariants?: unknown[];
  }>("data/contracts/424_same_shell_assistive_stage_contract.json");
  invariant(contract.taskId === "par_424", "424 contract task id drifted.");
  invariant(contract.visualMode === "Assistive_Same_Shell_Stage", "424 visual mode drifted.");
  requireExactSuperset(
    asStringArray(contract.components, "contract.components"),
    REQUIRED_COMPONENTS,
    "424 components",
  );
  requireExactSuperset(
    asStringArray(contract.fixtures, "contract.fixtures"),
    REQUIRED_FIXTURES,
    "424 fixtures",
  );
  for (const invariantName of [
    "assistive_stage_lives_inside_staff_workspace_shell",
    "primary_case_canvas_remains_dominant",
    "decision_dock_focus_lease_remains_visible",
    "pinning_may_not_outrun_trust",
    "narrow_layout_is_same_shell_fold_not_mobile_fork",
  ]) {
    requireIncludes(
      asStringArray(contract.invariants, "contract.invariants").join("\n"),
      invariantName,
      "424 invariants",
    );
  }

  const visualNotes = readText("data/analysis/424_visual_reference_notes.json");
  for (const url of REQUIRED_REFERENCE_URLS) {
    requireIncludes(visualNotes, url, "424 visual reference notes");
  }

  const promotionMatrix = readText("data/analysis/424_stage_promotion_matrix.csv");
  for (const fixture of REQUIRED_FIXTURES) {
    requireIncludes(promotionMatrix, fixture, "424 promotion matrix");
  }

  for (const doc of [
    "docs/frontend/424_same_shell_assistive_stage_spec.md",
    "docs/frontend/424_same_shell_assistive_stage_atlas.html",
    "docs/frontend/424_same_shell_assistive_stage_topology.mmd",
    "docs/accessibility/424_same_shell_assistive_stage_a11y_notes.md",
    "data/analysis/424_algorithm_alignment_notes.md",
  ]) {
    const content = readText(doc);
    requireIncludes(content, "Assistive", doc);
    requireIncludes(content, "DecisionDock", doc);
  }
}

function validatePlaywrightSpecs(): void {
  const specs = [
    "tests/playwright/424_same_shell_stage_layout.spec.ts",
    "tests/playwright/424_same_shell_stage_keyboard_and_focus.spec.ts",
    "tests/playwright/424_same_shell_stage_responsive.spec.ts",
    "tests/playwright/424_same_shell_stage_accessibility.spec.ts",
    "tests/playwright/424_same_shell_stage_visual.spec.ts",
  ];
  const combined = specs.map(readText).join("\n");
  for (const fixture of REQUIRED_FIXTURES) {
    requireIncludes(combined, `assistiveStage=${fixture}`, "424 Playwright fixtures");
  }
  for (const snippet of [
    "browser.newContext",
    "context.tracing.start",
    "toMatchAriaSnapshot",
    "toHaveScreenshot",
    "AssistiveWorkspaceStageHost",
    "AssistiveSummaryStubCluster",
    "decision-dock",
    "task-canvas-frame",
    "role",
    "complementary",
    "aria-pressed",
    "aria-expanded",
  ]) {
    requireIncludes(combined, snippet, "424 Playwright required snippet");
  }
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function asArray<T>(value: unknown, label: string): T[] {
  invariant(Array.isArray(value), `${label} must be an array.`);
  return value as T[];
}

function asStringArray(value: unknown, label: string): string[] {
  return asArray<unknown>(value, label).map((item) => String(item));
}

function requireExactSuperset(
  actual: readonly string[],
  required: readonly string[],
  label: string,
): void {
  for (const item of required) {
    invariant(actual.includes(item), `${label} missing ${item}.`);
  }
}

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing "${needle}".`);
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
