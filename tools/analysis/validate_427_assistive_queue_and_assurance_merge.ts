import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "apps/clinical-workspace/src/assistive-queue-assurance-merge.tsx",
  "apps/clinical-workspace/src/assistive-queue-assurance-merge.css",
  "apps/clinical-workspace/src/workspace-queue-workboard.tsx",
  "apps/clinical-workspace/src/staff-shell-seed.tsx",
  "apps/clinical-workspace/src/App.tsx",
  "apps/clinical-workspace/src/workspace-shell.tsx",
  "docs/frontend/427_assistive_queue_and_assurance_merge_spec.md",
  "docs/frontend/427_assistive_queue_and_assurance_merge_atlas.html",
  "docs/frontend/427_assistive_queue_and_assurance_merge_topology.mmd",
  "docs/frontend/427_assistive_queue_and_assurance_design_tokens.json",
  "docs/accessibility/427_assistive_queue_and_assurance_a11y_notes.md",
  "data/contracts/427_assistive_queue_and_assurance_merge_contract.json",
  "data/analysis/427_algorithm_alignment_notes.md",
  "data/analysis/427_visual_reference_notes.json",
  "data/analysis/427_queue_ops_release_signal_matrix.csv",
  "tools/analysis/validate_427_assistive_queue_and_assurance_merge.ts",
  "tests/playwright/427_queue_to_task_assistive_flow.spec.ts",
  "tests/playwright/427_assistive_ops_and_release_surface_flow.spec.ts",
  "tests/playwright/427_queue_ops_release_accessibility.spec.ts",
  "tests/playwright/427_queue_ops_release_visual.spec.ts",
] as const;

const REQUIRED_COMPONENTS = [
  "AssistiveQueueCue",
  "AssistiveQueueContextPocket",
  "AssistiveQueueTrustBadge",
  "AssistiveQueueOpenToStageBridge",
  "AssistiveOpsTrustSummaryCard",
  "AssistiveOpsIncidentAndFreezeStrip",
  "AssistiveReleaseAssuranceSummaryCard",
  "AssistiveReleaseCandidateDeltaBadge",
  "AssistiveCrossSurfaceRecoveryFrame",
  "AssistiveQueueAndAssuranceMergeAdapter",
] as const;

const REQUIRED_REFERENCE_URLS = [
  "https://service-manual.nhs.uk/accessibility",
  "https://service-manual.nhs.uk/accessibility/content",
  "https://www.w3.org/WAI/ARIA/apg/patterns/table/",
  "https://www.w3.org/WAI/ARIA/apg/patterns/grid/",
  "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
  "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/",
  "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
  "https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/",
  "https://playwright.dev/docs/aria-snapshots",
  "https://playwright.dev/docs/test-snapshots",
  "https://playwright.dev/docs/emulation",
  "https://playwright.dev/docs/browser-contexts",
  "https://playwright.dev/docs/trace-viewer",
  "https://linear.app/method/introduction",
  "https://linear.app/docs/display-options",
  "https://linear.app/docs/inbox",
  "https://nextjs.org/docs/app/getting-started/layouts-and-pages",
  "https://nextjs.org/docs/app/guides/preserving-ui-state",
  "https://v10.carbondesignsystem.com/components/data-table/usage/",
  "https://carbondesignsystem.com/patterns/text-toolbar-pattern",
] as const;

const REQUIRED_SCRIPT =
  '"validate:427-assistive-queue-and-assurance-merge": "pnpm exec tsx ./tools/analysis/validate_427_assistive_queue_and_assurance_merge.ts"';

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath: string): string {
  const filePath = path.join(ROOT, relativePath);
  invariant(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${relativePath}`);
  return fs.readFileSync(filePath, "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function checklistState(taskPrefix: string): string {
  const escaped = taskPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = read("prompt/checklist.md").match(
    new RegExp(`^- \\[([ Xx-])\\] ${escaped}`, "m"),
  );
  invariant(match, `CHECKLIST_ROW_MISSING:${taskPrefix}`);
  return match[1]!.toUpperCase();
}

function requireIncludes(source: string, token: string, label: string): void {
  invariant(source.includes(token), `${label} missing required token: ${token}`);
}

function main(): void {
  validateRequiredFiles();
  validateChecklist();
  validatePackageScript();
  validateProductionCode();
  validateDocsAndContracts();
  validatePlaywrightSpecs();

  console.log("427 assistive queue and assurance merge validated.");
}

function validateRequiredFiles(): void {
  for (const relativePath of REQUIRED_FILES) {
    invariant(
      fs.existsSync(path.join(ROOT, relativePath)),
      `MISSING_REQUIRED_FILE:${relativePath}`,
    );
  }
}

function validateChecklist(): void {
  for (const dependency of [
    "par_420_phase8_track_Playwright_or_other_appropriate_tooling_frontend_build_confidence_rationale_and_provenance_visibility_components",
    "par_421_phase8_track_Playwright_or_other_appropriate_tooling_frontend_build_override_reason_capture_and_edited_by_clinician_trail",
    "par_422_phase8_track_Playwright_or_other_appropriate_tooling_frontend_build_shadow_degraded_quarantined_frozen_and_blocked_postures",
    "par_423_phase8_track_Playwright_or_other_appropriate_tooling_frontend_build_stale_session_freeze_and_regenerate_in_place_recovery",
    "par_424_phase8_track_Playwright_or_other_appropriate_tooling_frontend_build_same_shell_assistive_stage_integration_with_workspace",
    "par_425_phase8_use_Playwright_or_other_appropriate_tooling_browser_automation_to_provision_model_vendor_projects_and_api_keys",
    "par_426_phase8_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_model_audit_logs_and_safety_settings",
  ]) {
    invariant(checklistState(dependency) === "X", `DEPENDENCY_INCOMPLETE:${dependency}`);
  }
  const taskState = checklistState(
    "par_427_phase8_merge_Playwright_or_other_appropriate_tooling_integrate_assistive_layer_with_workspace_queue_and_assurance_streams",
  );
  invariant(["-", "X"].includes(taskState), "TASK_NOT_CLAIMED:par_427");
}

function validatePackageScript(): void {
  invariant(
    read("package.json").includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:427-assistive-queue-and-assurance-merge",
  );
}

function validateProductionCode(): void {
  const source = read("apps/clinical-workspace/src/assistive-queue-assurance-merge.tsx");
  for (const component of REQUIRED_COMPONENTS) {
    requireIncludes(source, component, "427 continuum source");
  }
  for (const snippet of [
    "Assistive_Queue_Assurance_Continuum",
    "shadow_only",
    "observe_only",
    "degraded",
    "frozen",
    "blocked_by_policy",
    "No autonomous write",
    "data/config/426_model_audit_baseline.example.json",
    "data/config/426_model_safety_baseline.example.json",
    "role=\"status\"",
    "role={alerting ? \"alert\" : \"status\"}",
  ]) {
    requireIncludes(source, snippet, "427 continuum source");
  }

  const css = read("apps/clinical-workspace/src/assistive-queue-assurance-merge.css");
  for (const snippet of [
    "#FFFFFF",
    "#F5F7FA".toLowerCase(),
    "#EEF2F7".toLowerCase(),
    "#D7DFE8".toLowerCase(),
    "#0F172A".toLowerCase(),
    "#334155",
    "#64748B".toLowerCase(),
    "#2457FF".toLowerCase(),
    "#0F766E".toLowerCase(),
    "#B42318".toLowerCase(),
    "#E2E8F0".toLowerCase(),
    "max-width: 140px",
    "width: min(280px, 100%)",
    "min-width: 280px",
    "min-width: 320px",
    "gap: 6px",
    "padding: 14px",
    "120ms ease-out",
    "prefers-reduced-motion",
  ]) {
    requireIncludes(css.toLowerCase(), snippet.toLowerCase(), "427 continuum CSS");
  }

  const queue = read("apps/clinical-workspace/src/workspace-queue-workboard.tsx");
  for (const snippet of [
    "AssistiveQueueCue",
    "AssistiveQueueContextPocket",
    "AssistiveQueueOpenToStageBridge",
    "buildAssistiveQueueAndAssuranceMergeState",
    "assistiveMergeState",
  ]) {
    requireIncludes(queue, snippet, "427 queue wiring");
  }

  const shell = read("apps/clinical-workspace/src/staff-shell-seed.tsx");
  for (const snippet of [
    "AssistiveQueueAndAssuranceMergeAdapter",
    "AssistiveQueueOpenToStageBridge",
    "buildAssistiveQueueAndAssuranceMergeState",
    "\"assistiveMerge\"",
    "assistiveQueueAssuranceState",
  ]) {
    requireIncludes(shell, snippet, "427 staff shell wiring");
  }

  const app = read("apps/clinical-workspace/src/App.tsx");
  requireIncludes(app, "./assistive-queue-assurance-merge.css", "427 App CSS import");

  const barrel = read("apps/clinical-workspace/src/workspace-shell.tsx");
  for (const component of REQUIRED_COMPONENTS) {
    requireIncludes(barrel, component, "427 workspace-shell exports");
  }
}

function validateDocsAndContracts(): void {
  const contract = readJson<{
    taskId?: string;
    visualMode?: string;
    components?: string[];
    invariants?: string[];
    upstreamRefs?: string[];
  }>("data/contracts/427_assistive_queue_and_assurance_merge_contract.json");
  invariant(contract.taskId === "par_427", "427 contract task id drifted.");
  invariant(
    contract.visualMode === "Assistive_Queue_Assurance_Continuum",
    "427 visual mode drifted.",
  );
  for (const component of REQUIRED_COMPONENTS) {
    invariant(contract.components?.includes(component), `427 contract missing ${component}`);
  }
  for (const invariantName of [
    "queue_rows_remain_compact",
    "raw_confidence_not_displayed_in_queue",
    "same_shell_task_open_preserves_queue_context",
    "ops_and_release_reuse_trust_vocabulary",
    "cross_surface_recovery_grammar_is_shared",
    "release_assurance_binds_to_426_audit_and_safety",
  ]) {
    invariant(contract.invariants?.includes(invariantName), `427 invariant missing ${invariantName}`);
  }
  for (const upstream of [
    "data/contracts/424_same_shell_assistive_stage_contract.json",
    "data/contracts/425_model_vendor_project_and_key_contract.json",
    "data/contracts/426_model_audit_and_safety_contract.json",
  ]) {
    invariant(contract.upstreamRefs?.includes(upstream), `427 upstream missing ${upstream}`);
  }

  const spec = read("docs/frontend/427_assistive_queue_and_assurance_merge_spec.md");
  for (const token of REQUIRED_COMPONENTS) {
    requireIncludes(spec, token, "427 spec");
  }

  const tokens = read("docs/frontend/427_assistive_queue_and_assurance_design_tokens.json");
  for (const token of [
    "queueCueMaxWidthPx",
    "queueDetailPocketWidthPx",
    "opsSummaryCardMinWidthPx",
    "releaseAssuranceSummaryCardMinWidthPx",
    "rowToTaskOpenMs",
  ]) {
    requireIncludes(tokens, token, "427 design tokens");
  }

  const visualNotes = read("data/analysis/427_visual_reference_notes.json");
  for (const url of REQUIRED_REFERENCE_URLS) {
    requireIncludes(visualNotes, url, "427 visual reference notes");
  }

  const alignment = read("data/analysis/427_algorithm_alignment_notes.md");
  for (const token of [
    "AssistiveWorkspaceStageBinding",
    "AssistiveOpsSurfaceBinding",
    "AssistiveCapabilityTrustEnvelope",
    "AssistiveCapabilityRolloutVerdict",
    "AssuranceBaselineSnapshot",
    "AssistiveReleaseCandidate",
    "ReleaseRecoveryDisposition",
    "No new `PHASE8_BATCH_420_427_INTERFACE_GAP_ASSISTIVE_QUEUE_AND_ASSURANCE_MERGE.json` is required",
  ]) {
    requireIncludes(alignment, token, "427 algorithm alignment notes");
  }

  const matrix = read("data/analysis/427_queue_ops_release_signal_matrix.csv");
  for (const token of REQUIRED_COMPONENTS) {
    if (token === "AssistiveQueueAndAssuranceMergeAdapter") {
      continue;
    }
    requireIncludes(matrix, token, "427 signal matrix");
  }
}

function validatePlaywrightSpecs(): void {
  const combined = [
    "tests/playwright/427_queue_to_task_assistive_flow.spec.ts",
    "tests/playwright/427_assistive_ops_and_release_surface_flow.spec.ts",
    "tests/playwright/427_queue_ops_release_accessibility.spec.ts",
    "tests/playwright/427_queue_ops_release_visual.spec.ts",
  ]
    .map((file) => read(file))
    .join("\n");
  for (const token of [
    "startClinicalWorkspace",
    "browser.newContext",
    "toMatchAriaSnapshot",
    "toHaveScreenshot",
    "AssistiveQueueCue",
    "AssistiveWorkspaceStageHost",
    "AssistiveOpsTrustSummaryCard",
    "AssistiveReleaseAssuranceSummaryCard",
    "AssistiveCrossSurfaceRecoveryFrame",
    "assertNoHorizontalOverflow",
    "context.tracing.start",
  ]) {
    requireIncludes(combined, token, "427 Playwright specs");
  }
}

main();

