import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "apps/clinical-workspace/src/assistive-stale-recovery.tsx",
  "apps/clinical-workspace/src/assistive-stale-recovery.css",
  "apps/clinical-workspace/src/assistive-rail.tsx",
  "apps/clinical-workspace/src/App.tsx",
  "docs/frontend/423_stale_session_freeze_recovery_spec.md",
  "docs/frontend/423_stale_session_freeze_recovery_atlas.html",
  "docs/frontend/423_stale_session_freeze_recovery_topology.mmd",
  "docs/frontend/423_stale_recovery_design_tokens.json",
  "docs/accessibility/423_stale_recovery_a11y_notes.md",
  "data/contracts/423_stale_freeze_recovery_contract.json",
  "data/analysis/423_algorithm_alignment_notes.md",
  "data/analysis/423_visual_reference_notes.json",
  "data/analysis/423_stale_recovery_state_matrix.csv",
  "data/analysis/PHASE8_BATCH_420_427_INTERFACE_GAP_STALE_FREEZE_RECOVERY.json",
  "tests/playwright/423_stale_freeze_recovery.spec.ts",
  "tests/playwright/423_recovery_keyboard_and_focus.spec.ts",
  "tests/playwright/423_recovery_accessibility.spec.ts",
  "tests/playwright/423_recovery_visual.spec.ts",
  "tools/analysis/validate_423_stale_recovery_surface.ts",
] as const;

const REQUIRED_COMPONENTS = [
  "AssistiveStaleSessionBanner",
  "AssistiveFreezeInPlaceFrame",
  "AssistiveFreezeReasonList",
  "AssistivePreservedArtifactView",
  "AssistiveRegenerateInPlaceActionBar",
  "AssistiveRecoveryExplanationPanel",
  "AssistiveRecoverableNotice",
  "AssistiveStaleControlSuppression",
  "AssistiveRecoveryFocusManager",
  "AssistiveFreezeRecoveryStateAdapter",
] as const;

const REQUIRED_FIXTURES = [
  "trust-drift",
  "publication-drift",
  "selected-anchor-drift",
  "insertion-drift",
  "review-version-drift-editing",
  "decision-epoch-drift",
  "policy-freshness-drift",
  "detail-open",
  "narrow-folded",
  "regenerate-success",
] as const;

const REQUIRED_DRIFT_CATEGORIES = [
  "trust_drift",
  "publication_drift",
  "selected_anchor_drift",
  "insertion_point_invalidation",
  "review_version_drift",
  "decision_epoch_drift",
  "policy_freshness_drift",
] as const;

const REQUIRED_REFERENCE_URLS = [
  "https://service-manual.nhs.uk/design-system/components/error-message",
  "https://service-manual.nhs.uk/design-system/components/warning-callout",
  "https://www.w3.org/WAI/ARIA/apg/patterns/alert/",
  "https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22",
  "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
  "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
  "https://playwright.dev/docs/aria-snapshots",
  "https://playwright.dev/docs/test-snapshots",
  "https://playwright.dev/docs/emulation",
  "https://playwright.dev/docs/browser-contexts",
  "https://linear.app/docs/creating-issues",
  "https://carbondesignsystem.com/components/notification/usage/",
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
    packageJson.scripts?.["validate:423-stale-recovery-surface"] ===
      "pnpm exec tsx ./tools/analysis/validate_423_stale_recovery_surface.ts",
    "package.json missing validate:423-stale-recovery-surface script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[(?:-|X)\] par_423_phase8_track_Playwright_or_other_appropriate_tooling_frontend_build_stale_session_freeze_and_regenerate_in_place_recovery/m.test(
      checklist,
    ),
    "Checklist task 423 must be claimed or complete while this validator runs.",
  );

  validateUpstreamInputsAndGap();
  validateProductionCode();
  validateContractAndDocs();
  validatePlaywrightSpecs();

  console.log("423 stale freeze recovery surface validated.");
}

function validateUpstreamInputsAndGap(): void {
  for (const upstream of [
    "data/contracts/412_assistive_work_protection_and_insertion_leases_contract.json",
    "data/contracts/416_freeze_disposition_and_freshness_invalidations_contract.json",
    "data/contracts/418_assistive_rail_contract.json",
    "data/contracts/419_diffable_note_draft_contract.json",
    "data/contracts/420_confidence_provenance_contract.json",
    "data/contracts/422_trust_posture_contract.json",
  ]) {
    invariant(
      fs.existsSync(path.join(ROOT, upstream)),
      `423 requires upstream artifact ${upstream}.`,
    );
  }

  const registry = readJson<{ launchVerdict?: string; tracks?: JsonRecord[] }>(
    "data/contracts/403_phase8_track_readiness_registry.json",
  );
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track423 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find(
    (track) => track.trackId === "par_423",
  );
  invariant(!track423, "Static 403 registry unexpectedly contains par_423; update 423 validator.");

  const gap = readJson<{
    taskId?: string;
    missingSurface?: string;
    expectedOwnerTask?: string;
    temporaryFallback?: string;
    riskIfUnresolved?: string;
    followUpAction?: string;
  }>("data/analysis/PHASE8_BATCH_420_427_INTERFACE_GAP_STALE_FREEZE_RECOVERY.json");
  invariant(gap.taskId === "par_423", "423 gap note task id drifted.");
  requireIncludes(String(gap.missingSurface), "403", "423 gap missing surface");
  invariant(gap.expectedOwnerTask === "par_403", "423 gap note expected owner drifted.");
  for (const upstream of ["412", "416", "418", "419", "420", "422"]) {
    requireIncludes(String(gap.temporaryFallback), upstream, "423 gap fallback");
  }
  requireIncludes(String(gap.followUpAction), "403_track_launch_packet_423", "423 gap follow-up");
}

function validateProductionCode(): void {
  const source = readText("apps/clinical-workspace/src/assistive-stale-recovery.tsx");
  for (const component of REQUIRED_COMPONENTS) {
    requireIncludes(source, component, "423 stale recovery source");
  }
  for (const fixture of REQUIRED_FIXTURES) {
    requireIncludes(source, fixture, "423 stale recovery fixture");
  }
  for (const driftCategory of REQUIRED_DRIFT_CATEGORIES) {
    requireIncludes(source, driftCategory, "423 stale drift category");
  }
  for (const snippet of [
    "ASSISTIVE_FREEZE_RECOVERY_VISUAL_MODE",
    "Assistive_Freeze_Regen_In_Place",
    "AssistiveFreezeFrame",
    "AssistiveFreezeDisposition",
    "ReleaseRecoveryDisposition",
    "ReviewActionLease",
    "AssistiveDraftInsertionPoint",
    "AssistiveDraftPatchLease",
    "assistiveRecovery",
    "role={state.semanticRole}",
    "aria-live",
    "aria-expanded",
    "aria-controls",
    "Escape",
    "event.stopImmediatePropagation()",
    "Accept artifact",
    "Insert draft",
    "Regenerate from stale session",
    "Export artifact",
    "Complete task",
    "window.requestAnimationFrame",
  ]) {
    requireIncludes(source, snippet, "423 source required snippet");
  }

  const css = readText("apps/clinical-workspace/src/assistive-stale-recovery.css");
  for (const snippet of [
    "#ffffff",
    "#f8fafc",
    "#d7dfe8",
    "#0f172a",
    "#334155",
    "#64748b",
    "#1d4ed8",
    "#2457ff",
    "#b7791f",
    "#b42318",
    "padding: 16px",
    "max-height: 320px",
    "min-height: 44px",
    "gap: 8px",
    "min-height: 32px",
    "max-width: 320px",
    "100ms ease-out",
    "120ms ease-out",
    "prefers-reduced-motion",
  ]) {
    requireIncludes(css, snippet, "423 stale recovery CSS");
  }

  const rail = readText("apps/clinical-workspace/src/assistive-rail.tsx");
  for (const snippet of [
    "AssistiveFreezeInPlaceFrame",
    "AssistiveFreezeRecoveryStateAdapter",
    "freezeRecoveryState?: AssistiveFreezeRecoveryState",
    "<AssistiveFreezeInPlaceFrame state={state.freezeRecoveryState} />",
    "state.freezeRecoveryState ? null : state.draftDeck",
  ]) {
    requireIncludes(rail, snippet, "423 rail integration");
  }

  const seed = readText("apps/clinical-workspace/src/staff-shell-seed.tsx");
  requireIncludes(seed, '"assistiveRecovery"', "423 route query preservation");

  const app = readText("apps/clinical-workspace/src/App.tsx");
  requireIncludes(app, "./assistive-stale-recovery.css", "423 App CSS import");

  const barrel = readText("apps/clinical-workspace/src/workspace-shell.tsx");
  for (const component of REQUIRED_COMPONENTS) {
    requireIncludes(barrel, component, "423 workspace-shell exports");
  }
}

function validateContractAndDocs(): void {
  const contract = readJson<{
    taskId?: string;
    visualMode?: string;
    components?: unknown[];
    fixtures?: unknown[];
    driftCategories?: unknown[];
    invariants?: unknown[];
  }>("data/contracts/423_stale_freeze_recovery_contract.json");
  invariant(contract.taskId === "par_423", "423 contract task id drifted.");
  invariant(contract.visualMode === "Assistive_Freeze_Regen_In_Place", "423 visual mode drifted.");
  requireExactSuperset(
    asStringArray(contract.components, "contract.components"),
    REQUIRED_COMPONENTS,
    "423 components",
  );
  requireExactSuperset(
    asStringArray(contract.fixtures, "contract.fixtures"),
    REQUIRED_FIXTURES,
    "423 fixtures",
  );
  requireExactSuperset(
    asStringArray(contract.driftCategories, "contract.driftCategories"),
    REQUIRED_DRIFT_CATEGORIES,
    "423 drift categories",
  );
  requireIncludes(
    JSON.stringify(contract.invariants),
    "stale_artifacts_freeze_in_place",
    "423 invariants",
  );
  requireIncludes(
    JSON.stringify(contract.invariants),
    "stale_controls_suppressed_immediately",
    "423 invariants",
  );
  requireIncludes(
    JSON.stringify(contract.invariants),
    "focus_continuity_is_preserved",
    "423 invariants",
  );

  const visualNotes = readJson<{ references?: JsonRecord[] }>(
    "data/analysis/423_visual_reference_notes.json",
  );
  const urls = asArray<JsonRecord>(visualNotes.references, "visualNotes.references").map((ref) =>
    String(ref.url),
  );
  requireExactSuperset(urls, REQUIRED_REFERENCE_URLS, "423 visual references");

  for (const doc of [
    "docs/frontend/423_stale_session_freeze_recovery_spec.md",
    "docs/accessibility/423_stale_recovery_a11y_notes.md",
    "data/analysis/423_algorithm_alignment_notes.md",
  ]) {
    const text = readText(doc);
    requireIncludes(text, "AssistiveFreezeFrame", doc);
    requireIncludes(text, "ReleaseRecoveryDisposition", doc);
    requireIncludes(text, "AssistiveDraftPatchLease", doc);
  }

  const matrix = readText("data/analysis/423_stale_recovery_state_matrix.csv");
  for (const fixture of REQUIRED_FIXTURES) {
    requireIncludes(matrix, fixture, "423 state matrix");
  }
}

function validatePlaywrightSpecs(): void {
  const specs = [
    "tests/playwright/423_stale_freeze_recovery.spec.ts",
    "tests/playwright/423_recovery_keyboard_and_focus.spec.ts",
    "tests/playwright/423_recovery_accessibility.spec.ts",
    "tests/playwright/423_recovery_visual.spec.ts",
  ];
  const combined = specs.map(readText).join("\n");
  for (const fixture of [
    "trust-drift",
    "publication-drift",
    "selected-anchor-drift",
    "insertion-drift",
    "review-version-drift-editing",
    "decision-epoch-drift",
  ]) {
    requireIncludes(combined, fixture, "423 Playwright fixtures");
  }
  for (const snippet of [
    "toMatchAriaSnapshot",
    "toHaveScreenshot",
    "browser.newContext",
    "tracing.start",
    "tracing.stop",
    "AssistiveFreezeInPlaceFrame",
    "AssistiveRegenerateInPlaceActionBar",
    "AssistiveStaleControlSuppression",
    "Regenerate in place",
    "Recover in place",
    "role",
    "aria-live",
    "Escape",
  ]) {
    requireIncludes(combined, snippet, "423 Playwright required snippet");
  }
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

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}`);
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
  expected: readonly string[],
  label: string,
): void {
  for (const item of expected) {
    invariant(actual.includes(item), `${label} missing ${item}`);
  }
}
