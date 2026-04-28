import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "apps/clinical-workspace/src/assistive-confidence.tsx",
  "apps/clinical-workspace/src/assistive-confidence.css",
  "apps/clinical-workspace/src/assistive-rail.tsx",
  "apps/clinical-workspace/src/App.tsx",
  "docs/frontend/420_confidence_rationale_and_provenance_spec.md",
  "docs/frontend/420_confidence_rationale_and_provenance_atlas.html",
  "docs/frontend/420_confidence_provenance_topology.mmd",
  "docs/frontend/420_confidence_provenance_design_tokens.json",
  "docs/accessibility/420_confidence_provenance_a11y_notes.md",
  "data/contracts/420_confidence_provenance_contract.json",
  "data/analysis/420_algorithm_alignment_notes.md",
  "data/analysis/420_visual_reference_notes.json",
  "data/analysis/420_confidence_state_matrix.csv",
  "data/analysis/PHASE8_BATCH_420_427_INTERFACE_GAP_CONFIDENCE_PROVENANCE_VISIBILITY.json",
  "tests/playwright/420_confidence_and_provenance_rendering.spec.ts",
  "tests/playwright/420_confidence_keyboard_and_disclosure.spec.ts",
  "tests/playwright/420_confidence_accessibility.spec.ts",
  "tests/playwright/420_confidence_visual.spec.ts",
  "tools/analysis/validate_420_confidence_provenance.ts",
] as const;

const REQUIRED_COMPONENTS = [
  "AssistiveConfidenceBand",
  "AssistiveConfidenceBandCluster",
  "AssistiveRationaleDigest",
  "AssistiveRationaleExplainer",
  "AssistiveFactorRowList",
  "AssistiveEvidenceCoverageMiniMap",
  "AssistiveFreshnessLine",
  "AssistiveProvenanceFooter",
  "AssistiveProvenanceDrawer",
  "AssistiveConfidenceSuppressionState",
  "AssistiveConfidenceStateAdapter",
] as const;

const REQUIRED_FIXTURES = [
  "healthy",
  "suppressed-degraded",
  "abstention",
  "rationale-open",
  "provenance-open",
  "narrow-folded",
] as const;

const REQUIRED_REFERENCE_URLS = [
  "https://service-manual.nhs.uk/accessibility/content",
  "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
  "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
  "https://playwright.dev/docs/aria-snapshots",
  "https://playwright.dev/docs/browser-contexts",
  "https://playwright.dev/docs/next/test-snapshots",
  "https://linear.app/docs/conceptual-model",
  "https://carbondesignsystem.com/components/accordion/usage/",
  "https://carbondesignsystem.com/components/structured-list/usage/",
  "https://nextjs.org/docs/app/getting-started/layouts-and-pages",
] as const;

main();

function main(): void {
  for (const relativePath of REQUIRED_FILES) {
    invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
  }

  const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
  invariant(
    packageJson.scripts?.["validate:420-confidence-provenance"] ===
      "pnpm exec tsx ./tools/analysis/validate_420_confidence_provenance.ts",
    "package.json missing validate:420-confidence-provenance script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[(?:-|X)\] par_420_phase8_track_Playwright_or_other_appropriate_tooling_frontend_build_confidence_rationale_and_provenance_visibility_components/m.test(
      checklist,
    ),
    "Checklist task 420 must be claimed or complete while this validator runs.",
  );

  validateUpstreamInputsAndGap();
  validateProductionCode();
  validateContractAndDocs();
  validatePlaywrightSpecs();

  console.log("420 confidence, rationale, freshness, and provenance visibility validated.");
}

function validateUpstreamInputsAndGap(): void {
  for (const upstream of [
    "data/contracts/411_trust_envelope_projection_contract.json",
    "data/contracts/412_assistive_work_protection_and_insertion_leases_contract.json",
    "data/contracts/414_replayable_provenance_and_trainability_contract.json",
    "data/contracts/415_monitoring_and_trust_projection_contract.json",
    "data/contracts/416_freeze_disposition_and_freshness_invalidations_contract.json",
    "data/contracts/418_assistive_rail_contract.json",
    "data/contracts/419_diffable_note_draft_contract.json",
  ]) {
    invariant(fs.existsSync(path.join(ROOT, upstream)), `420 requires upstream artifact ${upstream}.`);
  }

  const registry = readJson<{ launchVerdict?: string; tracks?: JsonRecord[] }>(
    "data/contracts/403_phase8_track_readiness_registry.json",
  );
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track420 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find(
    (track) => track.trackId === "par_420",
  );
  invariant(track420, "403 registry missing par_420.");
  invariant(track420.readinessState === "deferred", "Static 403 registry is expected to still defer par_420.");
  invariant(
    asArray(track420.blockingRefs, "track420.blockingRefs").includes(
      "WAIT403_420_REQUIRES_411_AND_415",
    ),
    "par_420 blocker ref drifted.",
  );

  const gap = readJson<{
    taskId?: string;
    blockingRef?: string;
    expectedOwnerTask?: string;
    temporaryFallback?: string;
    followUpAction?: string;
  }>("data/analysis/PHASE8_BATCH_420_427_INTERFACE_GAP_CONFIDENCE_PROVENANCE_VISIBILITY.json");
  invariant(gap.taskId === "par_420", "420 gap note task id drifted.");
  invariant(
    gap.blockingRef === "WAIT403_420_REQUIRES_411_AND_415",
    "420 gap note blocker ref drifted.",
  );
  invariant(gap.expectedOwnerTask === "par_403", "420 gap note expected owner drifted.");
  requireIncludes(String(gap.temporaryFallback), "411", "420 gap fallback");
  requireIncludes(String(gap.temporaryFallback), "415", "420 gap fallback");
  requireIncludes(String(gap.followUpAction), "403_track_launch_packet_420", "420 gap follow-up");
}

function validateProductionCode(): void {
  const source = readText("apps/clinical-workspace/src/assistive-confidence.tsx");
  for (const component of REQUIRED_COMPONENTS) {
    requireIncludes(source, component, "420 confidence source");
  }
  for (const fixture of REQUIRED_FIXTURES) {
    requireIncludes(source, fixture, "420 confidence fixtures");
  }
  for (const snippet of [
    "ASSISTIVE_CONFIDENCE_VISUAL_MODE",
    "Assistive_Confidence_Provenance_Prism",
    "AssistiveConfidenceDigest.displayBand",
    "sourceDisplayBand",
    "displayBand",
    "suppressed",
    "insufficient",
    "guarded",
    "supported",
    "strong",
    "trust_degraded",
    "publication_not_current",
    "continuity_not_current",
    "calibration_missing",
    "presentation_contract_limited",
    "aria-expanded",
    "aria-controls",
    "Escape",
    "inputEvidenceSnapshotRef",
    "runtimePublicationBundleRef",
    "assistiveConfidence",
  ]) {
    requireIncludes(source, snippet, "420 source required snippet");
  }
  invariant(!/\\b\\d{1,3}%\\b/.test(source), "420 source must not expose raw percentages.");

  const css = readText("apps/clinical-workspace/src/assistive-confidence.css");
  for (const snippet of [
    "#2457ff",
    "#b7791f",
    "#6b7280",
    "#0f766e",
    "#7c3aed",
    "min-height: 24px",
    "max-width: 296px",
    "max-width: 320px",
    "min-height: 28px",
    "max-width: 344px",
    "gap: 10px",
    "prefers-reduced-motion",
    "120ms ease-out",
    "140ms",
    "100ms ease-out",
  ]) {
    requireIncludes(css, snippet, "420 confidence CSS");
  }

  const rail = readText("apps/clinical-workspace/src/assistive-rail.tsx");
  for (const snippet of [
    "AssistiveConfidenceBandCluster",
    "AssistiveConfidenceStateAdapter",
    "confidenceState?: AssistiveConfidenceState",
    "<AssistiveConfidenceBandCluster state={state.confidenceState} placement=\"rail_card\" />",
  ]) {
    requireIncludes(rail, snippet, "420 rail integration");
  }

  const seed = readText("apps/clinical-workspace/src/staff-shell-seed.tsx");
  requireIncludes(seed, '"assistiveConfidence"', "420 route query preservation");

  const app = readText("apps/clinical-workspace/src/App.tsx");
  requireIncludes(app, "./assistive-confidence.css", "420 App CSS import");

  const barrel = readText("apps/clinical-workspace/src/workspace-shell.tsx");
  for (const component of REQUIRED_COMPONENTS) {
    requireIncludes(barrel, component, "420 workspace-shell exports");
  }
}

function validateContractAndDocs(): void {
  const contract = readJson<{
    taskId?: string;
    visualMode?: string;
    components?: unknown[];
    states?: JsonRecord[];
    suppressionRules?: unknown[];
    forbiddenPrimaryUx?: unknown[];
    invariants?: unknown[];
  }>("data/contracts/420_confidence_provenance_contract.json");
  invariant(contract.taskId === "par_420", "420 contract task id drifted.");
  invariant(
    contract.visualMode === "Assistive_Confidence_Provenance_Prism",
    "420 visual mode drifted.",
  );
  requireExactSuperset(asStringArray(contract.components, "contract.components"), REQUIRED_COMPONENTS, "420 components");
  requireExactSuperset(
    asArray<JsonRecord>(contract.states, "contract.states").map((state) => String(state.fixture)),
    REQUIRED_FIXTURES,
    "420 fixtures",
  );
  requireExactSuperset(
    asStringArray(contract.suppressionRules, "contract.suppressionRules"),
    [
      "trust_degraded",
      "publication_not_current",
      "continuity_not_current",
      "calibration_missing",
      "presentation_contract_limited",
    ],
    "420 suppression rules",
  );
  requireExactSuperset(
    asStringArray(contract.forbiddenPrimaryUx, "contract.forbiddenPrimaryUx"),
    ["raw_percentage", "logit", "posterior_probability", "success_green_certainty"],
    "420 forbidden primary UX",
  );
  requireIncludes(JSON.stringify(contract.invariants), "provenance_footer_visible_before_richer_layers", "420 invariants");

  const visualNotes = readJson<{ references?: JsonRecord[] }>(
    "data/analysis/420_visual_reference_notes.json",
  );
  const urls = asArray<JsonRecord>(visualNotes.references, "visualNotes.references").map((ref) =>
    String(ref.url),
  );
  requireExactSuperset(urls, REQUIRED_REFERENCE_URLS, "420 visual references");

  for (const doc of [
    "docs/frontend/420_confidence_rationale_and_provenance_spec.md",
    "docs/accessibility/420_confidence_provenance_a11y_notes.md",
    "data/analysis/420_algorithm_alignment_notes.md",
  ]) {
    const text = readText(doc);
    requireIncludes(text, "AssistiveConfidenceDigest.displayBand", doc);
    requireIncludes(text, "provenance", doc);
    requireIncludes(text, "raw", doc);
  }

  const matrix = readText("data/analysis/420_confidence_state_matrix.csv");
  for (const fixture of REQUIRED_FIXTURES) {
    requireIncludes(matrix, fixture, "420 state matrix");
  }
}

function validatePlaywrightSpecs(): void {
  const specs = [
    "tests/playwright/420_confidence_and_provenance_rendering.spec.ts",
    "tests/playwright/420_confidence_keyboard_and_disclosure.spec.ts",
    "tests/playwright/420_confidence_accessibility.spec.ts",
    "tests/playwright/420_confidence_visual.spec.ts",
  ];

  for (const spec of specs) {
    const source = readText(spec);
    requireIncludes(source, "startClinicalWorkspace", spec);
    requireIncludes(source, "browser.newContext", spec);
    requireIncludes(source, "context.tracing.start", spec);
    requireIncludes(source, "assistiveConfidence", spec);
  }

  const rendering = readText("tests/playwright/420_confidence_and_provenance_rendering.spec.ts");
  for (const fixture of ["healthy", "suppressed-degraded", "abstention"]) {
    requireIncludes(rendering, fixture, "420 rendering fixtures");
  }
  requireIncludes(rendering, "toMatchAriaSnapshot", "420 rendering ARIA snapshot");

  const keyboard = readText("tests/playwright/420_confidence_keyboard_and_disclosure.spec.ts");
  for (const snippet of ["Why this appears", "Show source lineage", "Escape", "aria-expanded"]) {
    requireIncludes(keyboard, snippet, "420 keyboard spec");
  }

  const accessibility = readText("tests/playwright/420_confidence_accessibility.spec.ts");
  for (const snippet of ["heading", "No raw percentage", "AssistiveConfidenceBandCluster"]) {
    requireIncludes(accessibility, snippet, "420 accessibility spec");
  }

  const visual = readText("tests/playwright/420_confidence_visual.spec.ts");
  for (const snippet of ["toHaveScreenshot", "narrow-folded", "suppressed-degraded"]) {
    requireIncludes(visual, snippet, "420 visual spec");
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

function requireIncludes(value: string, expected: string, label: string): void {
  invariant(value.includes(expected), `${label} missing ${expected}`);
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
  required: readonly string[],
  label: string,
): void {
  for (const item of required) {
    invariant(actual.includes(item), `${label} missing ${item}`);
  }
}
