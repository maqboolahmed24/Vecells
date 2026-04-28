import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "apps/clinical-workspace/src/assistive-draft.tsx",
  "apps/clinical-workspace/src/assistive-draft.css",
  "apps/clinical-workspace/src/assistive-rail.tsx",
  "docs/frontend/419_diffable_note_draft_and_bounded_insert_spec.md",
  "docs/frontend/419_diffable_note_draft_atlas.html",
  "docs/frontend/419_diffable_note_draft_topology.mmd",
  "docs/frontend/419_diffable_note_draft_design_tokens.json",
  "docs/accessibility/419_diffable_note_draft_a11y_notes.md",
  "data/contracts/419_diffable_note_draft_contract.json",
  "data/analysis/419_algorithm_alignment_notes.md",
  "data/analysis/419_visual_reference_notes.json",
  "data/analysis/419_diffable_note_draft_state_matrix.csv",
  "data/analysis/PHASE8_BATCH_412_419_INTERFACE_GAP_DIFFABLE_DRAFT_AND_BOUNDED_INSERT_CONTROLS.json",
  "tests/playwright/419_diffable_note_draft_insert_enabled.spec.ts",
  "tests/playwright/419_diffable_note_draft_insert_blocked.spec.ts",
  "tests/playwright/419_diffable_note_draft_accessibility.spec.ts",
  "tests/playwright/419_diffable_note_draft_visual.spec.ts",
  "tools/analysis/validate_419_diffable_note_draft.ts",
] as const;

const REQUIRED_COMPONENTS = [
  "AssistiveDraftSectionDeck",
  "AssistiveDraftSectionCard",
  "AssistiveDraftDiffBlock",
  "AssistiveTargetSlotPill",
  "AssistiveBoundedInsertBar",
  "AssistivePatchLeaseStatus",
  "AssistiveSectionActionCluster",
  "AssistiveBeforeAfterToggle",
  "AssistiveInsertBlockReason",
  "AssistiveDraftKeyboardNavigator",
] as const;

const REQUIRED_FIXTURES = [
  "insert-enabled",
  "insert-blocked-slot",
  "insert-blocked-session",
  "compare-open",
  "compare-closed",
  "narrow-stacked",
] as const;

const REQUIRED_BLOCK_REASONS = [
  "stale_slot",
  "stale_session",
  "selected_anchor_drift",
  "decision_epoch_drift",
  "publication_drift",
  "trust_posture_drift",
] as const;

const REQUIRED_REFERENCE_URLS = [
  "https://service-manual.nhs.uk/design-system",
  "https://service-manual.nhs.uk/design-system/components/buttons",
  "https://service-manual.nhs.uk/accessibility/design",
  "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/",
  "https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/",
  "https://playwright.dev/docs/aria-snapshots",
  "https://playwright.dev/docs/next/test-snapshots",
  "https://playwright.dev/docs/trace-viewer",
  "https://linear.app/docs/conceptual-model",
  "https://v10.carbondesignsystem.com/components/data-table/usage/",
  "https://carbondesignsystem.com/components/tag/usage/",
  "https://nextjs.org/docs/app/getting-started/layouts-and-pages",
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
    packageJson.scripts?.["validate:419-diffable-note-draft"] ===
      "pnpm exec tsx ./tools/analysis/validate_419_diffable_note_draft.ts",
    "package.json missing validate:419-diffable-note-draft script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[(?:-|X)\] par_419_phase8_track_Playwright_or_other_appropriate_tooling_frontend_build_diffable_note_draft_and_bounded_insert_controls/m.test(
      checklist,
    ),
    "Checklist task 419 must be claimed or complete while this validator runs.",
  );

  validateUpstreamInputsAndGap();
  validateProductionCode();
  validateContractAndDocs();
  validatePlaywrightSpecs();

  console.log("419 diffable note draft and bounded insert controls validated.");
}

function validateUpstreamInputsAndGap(): void {
  for (const upstream of [
    "data/contracts/408_documentation_composer_contract.json",
    "data/contracts/411_trust_envelope_projection_contract.json",
    "data/contracts/412_assistive_work_protection_and_insertion_leases_contract.json",
    "data/contracts/413_feedback_chain_and_final_human_artifact_contract.json",
    "data/contracts/414_replayable_provenance_and_trainability_contract.json",
    "data/contracts/418_assistive_rail_contract.json",
  ]) {
    invariant(
      fs.existsSync(path.join(ROOT, upstream)),
      `419 requires upstream artifact ${upstream}.`,
    );
  }

  const registry = readJson<{
    launchVerdict?: string;
    tracks?: JsonRecord[];
  }>("data/contracts/403_phase8_track_readiness_registry.json");
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track419 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find(
    (track) => track.trackId === "par_419",
  );
  invariant(track419, "403 registry missing par_419.");
  invariant(
    track419.readinessState === "blocked",
    "Static 403 registry is expected to still mark par_419 blocked.",
  );
  invariant(
    asArray(track419.blockingRefs, "track419.blockingRefs").includes(
      "GAP403_419_REQUIRES_408_AND_412",
    ),
    "par_419 blocker ref drifted.",
  );

  const gap = readJson<{
    taskId?: string;
    blockingRef?: string;
    missingSurface?: string;
    temporaryFallback?: string;
    followUpAction?: string;
  }>(
    "data/analysis/PHASE8_BATCH_412_419_INTERFACE_GAP_DIFFABLE_DRAFT_AND_BOUNDED_INSERT_CONTROLS.json",
  );
  invariant(gap.taskId === "par_419", "419 gap note task id drifted.");
  invariant(
    gap.blockingRef === "GAP403_419_REQUIRES_408_AND_412",
    "419 gap note blocker ref drifted.",
  );
  requireIncludes(String(gap.temporaryFallback), "408 and 412", "419 gap fallback");
  requireIncludes(String(gap.followUpAction), "403_track_launch_packet_419", "419 gap follow-up");
}

function validateProductionCode(): void {
  const source = readText("apps/clinical-workspace/src/assistive-draft.tsx");
  for (const component of REQUIRED_COMPONENTS) {
    requireIncludes(source, component, "419 assistive draft source");
  }
  for (const fixture of REQUIRED_FIXTURES) {
    requireIncludes(source, fixture, "419 draft fixtures");
  }
  for (const reason of REQUIRED_BLOCK_REASONS) {
    requireIncludes(source, reason, "419 blocked reason code");
  }
  for (const snippet of [
    "ASSISTIVE_DRAFT_VISUAL_MODE",
    "Assistive_Draft_Diff_Deck",
    "assistiveDraft",
    "slotHash",
    "Insert in shown slot",
    "aria-pressed",
    "aria-live",
    "ArrowDown",
    "ArrowUp",
    "Home",
    "End",
    "window.location.search",
  ]) {
    requireIncludes(source, snippet, "419 source required snippet");
  }

  const rail = readText("apps/clinical-workspace/src/assistive-rail.tsx");
  for (const snippet of [
    "buildAssistiveDraftDeckState",
    "draftDeck?: AssistiveDraftDeckState",
    "<AssistiveDraftSectionDeck deck={state.draftDeck} />",
    "AssistiveRailQuietContentWell",
  ]) {
    requireIncludes(rail, snippet, "419 rail integration");
  }

  const seed = readText("apps/clinical-workspace/src/staff-shell-seed.tsx");
  requireIncludes(seed, '"assistiveDraft"', "419 route query preservation");

  const app = readText("apps/clinical-workspace/src/App.tsx");
  requireIncludes(app, "./assistive-draft.css", "419 App CSS import");

  const css = readText("apps/clinical-workspace/src/assistive-draft.css");
  for (const snippet of [
    "#2457ff",
    "#0f766e",
    "#b42318",
    "#e8fff4",
    "#fff1f2",
    "padding: 16px",
    "border-radius: 8px",
    "gap: 12px",
    "min-height: 20px",
    "min-height: 56px",
    "max-width: 220px",
    "--assistive-rail-width: 432px",
    "prefers-reduced-motion",
    "120ms ease-out",
    "140ms ease-out",
    "100ms ease-out",
  ]) {
    requireIncludes(css, snippet, "419 assistive draft CSS");
  }

  const barrel = readText("apps/clinical-workspace/src/workspace-shell.tsx");
  for (const component of REQUIRED_COMPONENTS) {
    requireIncludes(barrel, component, "419 workspace-shell exports");
  }
}

function validateContractAndDocs(): void {
  const contract = readJson<{
    taskId?: string;
    visualMode?: string;
    components?: unknown[];
    states?: JsonRecord[];
    blockedReasonCodes?: unknown[];
    invariants?: unknown[];
  }>("data/contracts/419_diffable_note_draft_contract.json");
  invariant(contract.taskId === "par_419", "419 contract task id drifted.");
  invariant(contract.visualMode === "Assistive_Draft_Diff_Deck", "419 visual mode drifted.");
  requireExactSuperset(
    asStringArray(contract.components, "contract.components"),
    REQUIRED_COMPONENTS,
    "419 components",
  );
  requireExactSuperset(
    asArray<JsonRecord>(contract.states, "contract.states").map((state) => String(state.fixture)),
    REQUIRED_FIXTURES,
    "419 fixtures",
  );
  requireExactSuperset(
    asStringArray(contract.blockedReasonCodes, "contract.blockedReasonCodes"),
    REQUIRED_BLOCK_REASONS,
    "419 blocked reason codes",
  );
  requireIncludes(
    JSON.stringify(contract.invariants),
    "browser_focus_is_not_insert_authority",
    "419 invariants",
  );

  const refs = readText("data/analysis/419_visual_reference_notes.json");
  for (const url of REQUIRED_REFERENCE_URLS) {
    requireIncludes(refs, url, "419 visual references");
  }

  const matrix = readText("data/analysis/419_diffable_note_draft_state_matrix.csv");
  for (const state of [
    "insert_enabled_live_patch_lease",
    "insert_blocked_stale_slot",
    "insert_blocked_stale_session",
    "compare_open",
    "compare_closed",
    "narrow_stacked",
  ]) {
    requireIncludes(matrix, state, "419 state matrix");
  }

  for (const doc of [
    "docs/frontend/419_diffable_note_draft_and_bounded_insert_spec.md",
    "docs/accessibility/419_diffable_note_draft_a11y_notes.md",
    "data/analysis/419_algorithm_alignment_notes.md",
    "docs/frontend/419_diffable_note_draft_atlas.html",
    "docs/frontend/419_diffable_note_draft_topology.mmd",
    "docs/frontend/419_diffable_note_draft_design_tokens.json",
  ]) {
    const content = readText(doc);
    requireIncludes(content, "Assistive_Draft_Diff_Deck", doc);
  }
}

function validatePlaywrightSpecs(): void {
  const specs = [
    "tests/playwright/419_diffable_note_draft_insert_enabled.spec.ts",
    "tests/playwright/419_diffable_note_draft_insert_blocked.spec.ts",
    "tests/playwright/419_diffable_note_draft_accessibility.spec.ts",
    "tests/playwright/419_diffable_note_draft_visual.spec.ts",
  ];
  const combined = specs.map(readText).join("\n");
  for (const snippet of [
    "startClinicalWorkspace",
    "browser.newContext",
    "context.tracing.start",
    "AssistiveDraftSectionDeck",
    "Assistive_Draft_Diff_Deck",
    "assistiveDraft=insert-enabled",
    "assistiveDraft=insert-blocked-slot",
    "assistiveDraft=insert-blocked-session",
    "assistiveDraft=compare-open",
    "assistiveDraft=compare-closed",
    "assistiveDraft=narrow-stacked",
  ]) {
    requireIncludes(combined, snippet, "419 Playwright specs");
  }
  requireIncludes(combined, "toMatchAriaSnapshot", "419 ARIA snapshot spec");
  requireIncludes(combined, "toHaveScreenshot", "419 visual snapshot spec");
  requireIncludes(combined, "outputPath(", "419 trace output");
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
