import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "apps/clinical-workspace/src/assistive-override.tsx",
  "apps/clinical-workspace/src/assistive-override.css",
  "apps/clinical-workspace/src/assistive-rail.tsx",
  "apps/clinical-workspace/src/App.tsx",
  "docs/frontend/421_override_reason_and_edit_trail_spec.md",
  "docs/frontend/421_override_reason_and_edit_trail_atlas.html",
  "docs/frontend/421_override_reason_and_edit_trail_topology.mmd",
  "docs/frontend/421_override_reason_design_tokens.json",
  "docs/accessibility/421_override_reason_a11y_notes.md",
  "data/contracts/421_override_reason_contract.json",
  "data/analysis/421_algorithm_alignment_notes.md",
  "data/analysis/421_visual_reference_notes.json",
  "data/analysis/421_override_reason_decision_matrix.csv",
  "data/analysis/PHASE8_BATCH_420_427_INTERFACE_GAP_OVERRIDE_AND_EDIT_TRAIL.json",
  "tests/playwright/421_override_reason_flow.spec.ts",
  "tests/playwright/421_edit_trail_keyboard_and_validation.spec.ts",
  "tests/playwright/421_edit_trail_accessibility.spec.ts",
  "tests/playwright/421_edit_trail_visual.spec.ts",
  "tools/analysis/validate_421_override_reason_surface.ts",
] as const;

const REQUIRED_COMPONENTS = [
  "AssistiveEditedByClinicianTrail",
  "AssistiveEditDeltaSummary",
  "AssistiveEditDeltaDrawer",
  "AssistiveOverrideReasonSheet",
  "AssistiveOverrideReasonCodeGroup",
  "AssistiveOverrideReasonValidationState",
  "AssistiveApprovalBurdenNotice",
  "AssistiveHumanArtifactSummary",
  "AssistiveOverrideTrailEventRow",
  "AssistiveOverrideStateAdapter",
] as const;

const REQUIRED_FIXTURES = [
  "accepted-unchanged",
  "accepted-edited",
  "rejected-mandatory",
  "abstained",
  "regenerated",
  "policy-exception",
  "completed-trail",
  "reason-open",
] as const;

const REQUIRED_REASON_CODES = [
  "clinical_safety",
  "evidence_mismatch",
  "patient_context",
  "policy_exception",
  "low_confidence_acceptance",
  "trust_recovery",
  "alternative_more_appropriate",
  "style_only",
] as const;

const REQUIRED_REFERENCE_URLS = [
  "https://service-manual.nhs.uk/accessibility/content",
  "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
  "https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/",
  "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
  "https://playwright.dev/docs/aria-snapshots",
  "https://playwright.dev/docs/browser-contexts",
  "https://playwright.dev/docs/next/test-snapshots",
  "https://playwright.dev/docs/trace-viewer",
  "https://linear.app/docs/keyboard",
  "https://linear.app/docs/conceptual-model",
  "https://carbondesignsystem.com/components/structured-list/usage/",
  "https://carbondesignsystem.com/components/form/usage/",
  "https://carbondesignsystem.com/components/inline-notification/usage/",
] as const;

main();

function main(): void {
  for (const relativePath of REQUIRED_FILES) {
    invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
  }

  const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
  invariant(
    packageJson.scripts?.["validate:421-override-reason-surface"] ===
      "pnpm exec tsx ./tools/analysis/validate_421_override_reason_surface.ts",
    "package.json missing validate:421-override-reason-surface script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[(?:-|X)\] par_421_phase8_track_Playwright_or_other_appropriate_tooling_frontend_build_override_reason_capture_and_edited_by_clinician_trail/m.test(
      checklist,
    ),
    "Checklist task 421 must be claimed or complete while this validator runs.",
  );

  validateUpstreamInputsAndGap();
  validateProductionCode();
  validateContractAndDocs();
  validatePlaywrightSpecs();

  console.log("421 override reason capture and edited-by-clinician trail validated.");
}

function validateUpstreamInputsAndGap(): void {
  for (const upstream of [
    "data/contracts/413_feedback_chain_and_final_human_artifact_contract.json",
    "data/contracts/418_assistive_rail_contract.json",
    "data/contracts/419_diffable_note_draft_contract.json",
    "data/contracts/420_confidence_provenance_contract.json",
  ]) {
    invariant(fs.existsSync(path.join(ROOT, upstream)), `421 requires upstream artifact ${upstream}.`);
  }

  const registry = readJson<{ launchVerdict?: string; tracks?: JsonRecord[] }>(
    "data/contracts/403_phase8_track_readiness_registry.json",
  );
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track421 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find(
    (track) => track.trackId === "par_421",
  );
  invariant(track421, "403 registry missing par_421.");
  invariant(track421.readinessState === "blocked", "Static 403 registry is expected to still block par_421.");
  invariant(
    asArray(track421.blockingRefs, "track421.blockingRefs").includes("GAP403_421_REQUIRES_413"),
    "par_421 blocker ref drifted.",
  );

  const gap = readJson<{
    taskId?: string;
    blockingRef?: string;
    expectedOwnerTask?: string;
    temporaryFallback?: string;
    followUpAction?: string;
  }>("data/analysis/PHASE8_BATCH_420_427_INTERFACE_GAP_OVERRIDE_AND_EDIT_TRAIL.json");
  invariant(gap.taskId === "par_421", "421 gap note task id drifted.");
  invariant(gap.blockingRef === "GAP403_421_REQUIRES_413", "421 gap note blocker ref drifted.");
  invariant(gap.expectedOwnerTask === "par_403", "421 gap note expected owner drifted.");
  requireIncludes(String(gap.temporaryFallback), "413", "421 gap fallback");
  requireIncludes(String(gap.followUpAction), "403_track_launch_packet_421", "421 gap follow-up");
}

function validateProductionCode(): void {
  const source = readText("apps/clinical-workspace/src/assistive-override.tsx");
  for (const component of REQUIRED_COMPONENTS) {
    requireIncludes(source, component, "421 override source");
  }
  for (const fixture of REQUIRED_FIXTURES) {
    requireIncludes(source, fixture, "421 override fixture");
  }
  for (const code of REQUIRED_REASON_CODES) {
    requireIncludes(source, code, "421 reason code");
  }
  for (const snippet of [
    "ASSISTIVE_OVERRIDE_VISUAL_MODE",
    "Assistive_Override_Trail_Review",
    "FinalHumanArtifact",
    "accepted_unchanged",
    "accepted_after_edit",
    "rejected_to_alternative",
    "abstained_by_human",
    "regenerated_superseded",
    "content_material",
    "policy_exception",
    "low_confidence_acceptance",
    "trust_recovery",
    "aria-expanded",
    "aria-controls",
    "role=\"alert\"",
    "Escape",
    "data-note-capture=\"disclosure-fenced\"",
    "assistiveOverride",
    "confidenceDigestRef",
    "provenanceEnvelopeRef",
  ]) {
    requireIncludes(source, snippet, "421 source required snippet");
  }

  const css = readText("apps/clinical-workspace/src/assistive-override.css");
  for (const snippet of [
    "#ffffff",
    "#eef2f7",
    "#d7dfe8",
    "#0f172a",
    "#334155",
    "#64748b",
    "#0f766e",
    "#b7791f",
    "#b42318",
    "#2457ff",
    "padding: 14px",
    "max-width: 320px",
    "max-width: 560px",
    "min-height: 32px",
    "max-height: 112px",
    "gap: 12px",
    "140ms ease-out",
    "120ms ease-out",
    "100ms ease-out",
    "prefers-reduced-motion",
  ]) {
    requireIncludes(css, snippet, "421 override CSS");
  }

  const rail = readText("apps/clinical-workspace/src/assistive-rail.tsx");
  for (const snippet of [
    "AssistiveEditedByClinicianTrail",
    "AssistiveOverrideStateAdapter",
    "overrideState?: AssistiveOverrideState",
    "<AssistiveEditedByClinicianTrail state={state.overrideState} />",
  ]) {
    requireIncludes(rail, snippet, "421 rail integration");
  }
  requireOrder(
    rail,
    "AssistiveConfidenceBandCluster state={state.confidenceState}",
    "AssistiveEditedByClinicianTrail state={state.overrideState}",
    "421 rail should render confidence/provenance before override trail",
  );

  const seed = readText("apps/clinical-workspace/src/staff-shell-seed.tsx");
  requireIncludes(seed, '"assistiveOverride"', "421 route query preservation");

  const app = readText("apps/clinical-workspace/src/App.tsx");
  requireIncludes(app, "./assistive-override.css", "421 App CSS import");

  const barrel = readText("apps/clinical-workspace/src/workspace-shell.tsx");
  for (const component of REQUIRED_COMPONENTS) {
    requireIncludes(barrel, component, "421 workspace-shell exports");
  }
}

function validateContractAndDocs(): void {
  const contract = readJson<{
    taskId?: string;
    visualMode?: string;
    components?: unknown[];
    states?: JsonRecord[];
    reasonCodes?: unknown[];
    mandatoryReasonConditions?: unknown[];
    privacyRules?: unknown[];
    invariants?: unknown[];
  }>("data/contracts/421_override_reason_contract.json");
  invariant(contract.taskId === "par_421", "421 contract task id drifted.");
  invariant(contract.visualMode === "Assistive_Override_Trail_Review", "421 visual mode drifted.");
  requireExactSuperset(asStringArray(contract.components, "contract.components"), REQUIRED_COMPONENTS, "421 components");
  requireExactSuperset(
    asArray<JsonRecord>(contract.states, "contract.states").map((state) => String(state.fixture)),
    REQUIRED_FIXTURES,
    "421 fixtures",
  );
  requireExactSuperset(asStringArray(contract.reasonCodes, "contract.reasonCodes"), REQUIRED_REASON_CODES, "421 reason codes");
  requireExactSuperset(
    asStringArray(contract.mandatoryReasonConditions, "contract.mandatoryReasonConditions"),
    [
      "content_material",
      "policy_exception",
      "trust_recovery",
      "accepted_after_edit",
      "rejected_to_alternative",
      "abstained_by_human",
      "low_confidence_acceptance",
    ],
    "421 mandatory conditions",
  );
  requireIncludes(JSON.stringify(contract.privacyRules), "free_text_override_notes_disclosure_fenced", "421 privacy rules");
  requireIncludes(JSON.stringify(contract.invariants), "final_human_artifact_primary", "421 invariants");

  const visualNotes = readJson<{ references?: JsonRecord[] }>(
    "data/analysis/421_visual_reference_notes.json",
  );
  const urls = asArray<JsonRecord>(visualNotes.references, "visualNotes.references").map((ref) =>
    String(ref.url),
  );
  requireExactSuperset(urls, REQUIRED_REFERENCE_URLS, "421 visual references");

  for (const doc of [
    "docs/frontend/421_override_reason_and_edit_trail_spec.md",
    "docs/accessibility/421_override_reason_a11y_notes.md",
    "data/analysis/421_algorithm_alignment_notes.md",
  ]) {
    const text = readText(doc);
    requireIncludes(text, "FinalHumanArtifact", doc);
    requireIncludes(text, "reason", doc);
    requireIncludes(text, "free-text", doc);
  }

  const matrix = readText("data/analysis/421_override_reason_decision_matrix.csv");
  for (const fixture of REQUIRED_FIXTURES) {
    requireIncludes(matrix, fixture, "421 decision matrix");
  }
}

function validatePlaywrightSpecs(): void {
  const specs = [
    "tests/playwright/421_override_reason_flow.spec.ts",
    "tests/playwright/421_edit_trail_keyboard_and_validation.spec.ts",
    "tests/playwright/421_edit_trail_accessibility.spec.ts",
    "tests/playwright/421_edit_trail_visual.spec.ts",
  ];

  for (const spec of specs) {
    const source = readText(spec);
    requireIncludes(source, "startClinicalWorkspace", spec);
    requireIncludes(source, "browser.newContext", spec);
    requireIncludes(source, "context.tracing.start", spec);
    requireIncludes(source, "assistiveOverride", spec);
  }

  const flow = readText("tests/playwright/421_override_reason_flow.spec.ts");
  for (const snippet of [
    "accepted-unchanged",
    "accepted-edited",
    "rejected-mandatory",
    "policy-exception",
    "completed-trail",
    "toMatchAriaSnapshot",
  ]) {
    requireIncludes(flow, snippet, "421 flow spec");
  }

  const keyboard = readText("tests/playwright/421_edit_trail_keyboard_and_validation.spec.ts");
  for (const snippet of ["Space", "Escape", "role", "alert", "Optional override note"]) {
    requireIncludes(keyboard, snippet, "421 keyboard spec");
  }

  const accessibility = readText("tests/playwright/421_edit_trail_accessibility.spec.ts");
  for (const snippet of ["fieldset", "legend", "AssistiveHumanArtifactSummary", "free-text"]) {
    requireIncludes(accessibility, snippet, "421 accessibility spec");
  }

  const visual = readText("tests/playwright/421_edit_trail_visual.spec.ts");
  for (const snippet of ["toHaveScreenshot", "rejected-mandatory", "completed-trail", "accepted-edited"]) {
    requireIncludes(visual, snippet, "421 visual spec");
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

function requireOrder(value: string, first: string, second: string, label: string): void {
  const firstIndex = value.indexOf(first);
  const secondIndex = value.indexOf(second);
  invariant(firstIndex >= 0 && secondIndex >= 0 && firstIndex < secondIndex, label);
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
