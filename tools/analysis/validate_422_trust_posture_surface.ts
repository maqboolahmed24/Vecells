import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "apps/clinical-workspace/src/assistive-trust-posture.tsx",
  "apps/clinical-workspace/src/assistive-trust-posture.css",
  "apps/clinical-workspace/src/assistive-rail.tsx",
  "apps/clinical-workspace/src/App.tsx",
  "docs/frontend/422_trust_posture_family_spec.md",
  "docs/frontend/422_trust_posture_family_atlas.html",
  "docs/frontend/422_trust_posture_family_topology.mmd",
  "docs/frontend/422_trust_posture_design_tokens.json",
  "docs/accessibility/422_trust_posture_a11y_notes.md",
  "data/contracts/422_trust_posture_contract.json",
  "data/analysis/422_algorithm_alignment_notes.md",
  "data/analysis/422_visual_reference_notes.json",
  "data/analysis/422_trust_posture_state_matrix.csv",
  "data/analysis/PHASE8_BATCH_420_427_INTERFACE_GAP_TRUST_POSTURE_FAMILY.json",
  "tests/playwright/422_trust_posture_rendering.spec.ts",
  "tests/playwright/422_trust_posture_keyboard_and_recovery.spec.ts",
  "tests/playwright/422_trust_posture_accessibility.spec.ts",
  "tests/playwright/422_trust_posture_visual.spec.ts",
  "tools/analysis/validate_422_trust_posture_surface.ts",
] as const;

const REQUIRED_COMPONENTS = [
  "AssistiveTrustStateFrame",
  "AssistiveTrustStateChip",
  "AssistiveShadowOnlyNotice",
  "AssistiveObserveOnlyNotice",
  "AssistiveDegradedStatePanel",
  "AssistiveQuarantinedStatePanel",
  "AssistiveFrozenStatePanel",
  "AssistiveBlockedByPolicyPanel",
  "AssistiveRecoveryActionPanel",
  "AssistiveTrustStateAdapter",
] as const;

const REQUIRED_FIXTURES = [
  "shadow-only",
  "observe-only",
  "degraded",
  "quarantined",
  "frozen",
  "blocked-by-policy",
  "detail-open",
  "narrow-folded",
] as const;

const REQUIRED_POSTURES = [
  "shadow_only",
  "observe_only",
  "degraded",
  "quarantined",
  "frozen",
  "blocked_by_policy",
] as const;

const REQUIRED_REFERENCE_URLS = [
  "https://service-manual.nhs.uk/content/how-to-write-good-questions-for-forms",
  "https://service-manual.nhs.uk/design-system/components/warning-callout",
  "https://www.w3.org/WAI/ARIA/apg/patterns/alert/",
  "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
  "https://playwright.dev/docs/aria-snapshots",
  "https://playwright.dev/docs/browser-contexts",
  "https://playwright.dev/docs/test-snapshots",
  "https://linear.app/docs",
  "https://carbondesignsystem.com/components/notification/usage/",
  "https://carbondesignsystem.com/components/tag/usage/",
] as const;

main();

function main(): void {
  for (const relativePath of REQUIRED_FILES) {
    invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
  }

  const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
  invariant(
    packageJson.scripts?.["validate:422-trust-posture-surface"] ===
      "pnpm exec tsx ./tools/analysis/validate_422_trust_posture_surface.ts",
    "package.json missing validate:422-trust-posture-surface script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[(?:-|X)\] par_422_phase8_track_Playwright_or_other_appropriate_tooling_frontend_build_shadow_degraded_quarantined_frozen_and_blocked_postures/m.test(
      checklist,
    ),
    "Checklist task 422 must be claimed or complete while this validator runs.",
  );

  validateUpstreamInputsAndGap();
  validateProductionCode();
  validateContractAndDocs();
  validatePlaywrightSpecs();

  console.log("422 assistive trust posture family validated.");
}

function validateUpstreamInputsAndGap(): void {
  for (const upstream of [
    "data/contracts/415_monitoring_and_trust_projection_contract.json",
    "data/contracts/416_freeze_disposition_and_freshness_invalidations_contract.json",
    "data/contracts/418_assistive_rail_contract.json",
    "data/contracts/419_diffable_note_draft_contract.json",
    "data/contracts/420_confidence_provenance_contract.json",
    "data/contracts/421_override_reason_contract.json",
  ]) {
    invariant(fs.existsSync(path.join(ROOT, upstream)), `422 requires upstream artifact ${upstream}.`);
  }

  const registry = readJson<{ launchVerdict?: string; tracks?: JsonRecord[] }>(
    "data/contracts/403_phase8_track_readiness_registry.json",
  );
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track422 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find(
    (track) => track.trackId === "par_422",
  );
  invariant(!track422, "Static 403 registry unexpectedly contains par_422; update 422 validator.");

  const gap = readJson<{
    taskId?: string;
    missingSurface?: string;
    expectedOwnerTask?: string;
    temporaryFallback?: string;
    riskIfUnresolved?: string;
    followUpAction?: string;
  }>("data/analysis/PHASE8_BATCH_420_427_INTERFACE_GAP_TRUST_POSTURE_FAMILY.json");
  invariant(gap.taskId === "par_422", "422 gap note task id drifted.");
  requireIncludes(String(gap.missingSurface), "403", "422 gap missing surface");
  invariant(gap.expectedOwnerTask === "par_403", "422 gap note expected owner drifted.");
  requireIncludes(String(gap.temporaryFallback), "415", "422 gap fallback");
  requireIncludes(String(gap.temporaryFallback), "416", "422 gap fallback");
  requireIncludes(String(gap.followUpAction), "403_track_launch_packet_422", "422 gap follow-up");
}

function validateProductionCode(): void {
  const source = readText("apps/clinical-workspace/src/assistive-trust-posture.tsx");
  for (const component of REQUIRED_COMPONENTS) {
    requireIncludes(source, component, "422 trust posture source");
  }
  for (const fixture of REQUIRED_FIXTURES) {
    requireIncludes(source, fixture, "422 trust fixture");
  }
  for (const posture of REQUIRED_POSTURES) {
    requireIncludes(source, posture, "422 trust posture");
  }
  for (const snippet of [
    "ASSISTIVE_TRUST_POSTURE_VISUAL_MODE",
    "Assistive_Trust_Posture_Ladder",
    "AssistiveCapabilityTrustEnvelope",
    "AssistiveCapabilityRolloutVerdict",
    "ReleaseRecoveryDisposition",
    "role={state.semanticRole}",
    "aria-live",
    "aria-expanded",
    "aria-controls",
    "Escape",
    "blocked_by_policy",
    "No local assistive action is available.",
    "data-trust-envelope-ref",
    "assistiveTrust",
  ]) {
    requireIncludes(source, snippet, "422 source required snippet");
  }

  const css = readText("apps/clinical-workspace/src/assistive-trust-posture.css");
  for (const snippet of [
    "#ffffff",
    "#eef2f7",
    "#d7dfe8",
    "#0f172a",
    "#334155",
    "#64748b",
    "#6b7280",
    "#8b5e00",
    "#b7791f",
    "#b42318",
    "#1d4ed8",
    "#7f1d1d",
    "padding: 16px",
    "min-height: 24px",
    "max-width: 300px",
    "min-height: 36px",
    "gap: 10px",
    "max-width: 320px",
    "120ms ease-out",
    "prefers-reduced-motion",
  ]) {
    requireIncludes(css, snippet, "422 trust posture CSS");
  }

  const rail = readText("apps/clinical-workspace/src/assistive-rail.tsx");
  for (const snippet of [
    "AssistiveTrustStateFrame",
    "AssistiveTrustStateAdapter",
    "trustPostureState?: AssistiveTrustPostureState",
    "<AssistiveTrustStateFrame state={state.trustPostureState} />",
  ]) {
    requireIncludes(rail, snippet, "422 rail integration");
  }

  const seed = readText("apps/clinical-workspace/src/staff-shell-seed.tsx");
  requireIncludes(seed, '"assistiveTrust"', "422 route query preservation");

  const app = readText("apps/clinical-workspace/src/App.tsx");
  requireIncludes(app, "./assistive-trust-posture.css", "422 App CSS import");

  const barrel = readText("apps/clinical-workspace/src/workspace-shell.tsx");
  for (const component of REQUIRED_COMPONENTS) {
    requireIncludes(barrel, component, "422 workspace-shell exports");
  }
}

function validateContractAndDocs(): void {
  const contract = readJson<{
    taskId?: string;
    visualMode?: string;
    components?: unknown[];
    states?: JsonRecord[];
    invariants?: unknown[];
  }>("data/contracts/422_trust_posture_contract.json");
  invariant(contract.taskId === "par_422", "422 contract task id drifted.");
  invariant(contract.visualMode === "Assistive_Trust_Posture_Ladder", "422 visual mode drifted.");
  requireExactSuperset(asStringArray(contract.components, "contract.components"), REQUIRED_COMPONENTS, "422 components");
  requireExactSuperset(
    asArray<JsonRecord>(contract.states, "contract.states").map((state) => String(state.fixture)),
    REQUIRED_FIXTURES,
    "422 fixtures",
  );
  requireExactSuperset(
    asArray<JsonRecord>(contract.states, "contract.states").map((state) => String(state.posture)),
    REQUIRED_POSTURES,
    "422 postures",
  );
  requireIncludes(JSON.stringify(contract.invariants), "degraded_not_healthy", "422 invariants");
  requireIncludes(JSON.stringify(contract.invariants), "blocked_by_policy_no_local_workaround", "422 invariants");

  const visualNotes = readJson<{ references?: JsonRecord[] }>(
    "data/analysis/422_visual_reference_notes.json",
  );
  const urls = asArray<JsonRecord>(visualNotes.references, "visualNotes.references").map((ref) =>
    String(ref.url),
  );
  requireExactSuperset(urls, REQUIRED_REFERENCE_URLS, "422 visual references");

  for (const doc of [
    "docs/frontend/422_trust_posture_family_spec.md",
    "docs/accessibility/422_trust_posture_a11y_notes.md",
    "data/analysis/422_algorithm_alignment_notes.md",
  ]) {
    const text = readText(doc);
    requireIncludes(text, "AssistiveCapabilityTrustEnvelope", doc);
    requireIncludes(text, "blocked_by_policy", doc);
    requireIncludes(text, "quarantined", doc);
    requireIncludes(text, "frozen", doc);
  }

  const matrix = readText("data/analysis/422_trust_posture_state_matrix.csv");
  for (const fixture of REQUIRED_FIXTURES) {
    requireIncludes(matrix, fixture, "422 state matrix");
  }
}

function validatePlaywrightSpecs(): void {
  const specs = [
    "tests/playwright/422_trust_posture_rendering.spec.ts",
    "tests/playwright/422_trust_posture_keyboard_and_recovery.spec.ts",
    "tests/playwright/422_trust_posture_accessibility.spec.ts",
    "tests/playwright/422_trust_posture_visual.spec.ts",
  ];

  for (const spec of specs) {
    const source = readText(spec);
    requireIncludes(source, "startClinicalWorkspace", spec);
    requireIncludes(source, "browser.newContext", spec);
    requireIncludes(source, "context.tracing.start", spec);
    requireIncludes(source, "assistiveTrust", spec);
  }

  const rendering = readText("tests/playwright/422_trust_posture_rendering.spec.ts");
  for (const snippet of ["shadow-only", "observe-only", "degraded", "quarantined", "frozen", "blocked-by-policy", "toMatchAriaSnapshot"]) {
    requireIncludes(rendering, snippet, "422 rendering spec");
  }

  const keyboard = readText("tests/playwright/422_trust_posture_keyboard_and_recovery.spec.ts");
  for (const snippet of ["Review recovery options", "Escape", "aria-expanded", "reducedMotion"]) {
    requireIncludes(keyboard, snippet, "422 keyboard spec");
  }

  const accessibility = readText("tests/playwright/422_trust_posture_accessibility.spec.ts");
  for (const snippet of ["role", "alert", "status", "No local assistive action"]) {
    requireIncludes(accessibility, snippet, "422 accessibility spec");
  }

  const visual = readText("tests/playwright/422_trust_posture_visual.spec.ts");
  for (const snippet of ["toHaveScreenshot", "shadow-only", "observe-only", "degraded", "quarantined", "frozen", "blocked-by-policy"]) {
    requireIncludes(visual, snippet, "422 visual spec");
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
