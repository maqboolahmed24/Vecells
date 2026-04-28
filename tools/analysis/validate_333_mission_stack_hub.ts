import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  HUB_MISSION_STACK_VISUAL_MODE,
  createInitialHubShellState,
  navigateHubShell,
  resolveHubShellSnapshot,
  selectHubExceptionRow,
  selectHubOptionCard,
} from "../../apps/hub-desk/src/hub-desk-shell.model.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.tsx"),
  path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.model.ts"),
  path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.css"),
  path.join(ROOT, "docs", "frontend", "333_mobile_and_narrow_screen_hub_workflows_spec.md"),
  path.join(ROOT, "docs", "frontend", "333_mobile_and_narrow_screen_hub_workflows_atlas.html"),
  path.join(ROOT, "docs", "frontend", "333_mission_stack_hub_topology.mmd"),
  path.join(ROOT, "docs", "frontend", "333_mission_stack_hub_tokens.json"),
  path.join(ROOT, "docs", "accessibility", "333_mission_stack_hub_a11y_notes.md"),
  path.join(ROOT, "data", "contracts", "333_mission_stack_hub_contract.json"),
  path.join(ROOT, "data", "analysis", "333_algorithm_alignment_notes.md"),
  path.join(ROOT, "data", "analysis", "333_responsive_state_matrix.csv"),
  path.join(ROOT, "data", "analysis", "333_visual_reference_notes.json"),
  path.join(ROOT, "tests", "playwright", "333_hub_mission_stack_narrow_desktop.spec.ts"),
  path.join(ROOT, "tests", "playwright", "333_hub_mission_stack_tablet.spec.ts"),
  path.join(ROOT, "tests", "playwright", "333_hub_mission_stack_mobile_width.spec.ts"),
  path.join(ROOT, "tests", "playwright", "333_hub_mission_stack.accessibility.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:333-mission-stack-hub": "pnpm exec tsx ./tools/analysis/validate_333_mission_stack_hub.ts"';

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath: string): string {
  requireCondition(
    fs.existsSync(filePath),
    `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`,
  );
  return fs.readFileSync(filePath, "utf8");
}

function validateFiles() {
  for (const filePath of REQUIRED_FILES) {
    read(filePath);
  }
}

function validateChecklist() {
  const checklist = read(path.join(ROOT, "prompt", "checklist.md"));
  requireCondition(
    checklist.includes(
      "- [-] par_333_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_mobile_and_narrow_screen_hub_workflows",
    ) ||
      checklist.includes(
        "- [X] par_333_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_mobile_and_narrow_screen_hub_workflows",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_333",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:333-mission-stack-hub",
  );
}

function validateFrontendFiles() {
  const app = read(path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.tsx"));
  const css = read(path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.css"));
  const model = read(path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.model.ts"));

  for (const marker of [
    "HubMissionStackLayout",
    "HubNarrowQueueWorkbench",
    "HubCasePulseCompact",
    "HubSupportDrawer",
    "HubDecisionDockBar",
    "HubOptionCardCompactStack",
    "HubNarrowStatusAuthorityStrip",
    "HubExceptionsMissionStackView",
    "HubMissionStackContinuityBinder",
    "HubResponsiveSafeAreaFrame",
  ]) {
    requireCondition(app.includes(marker), `FRONTEND_COMPONENT_MISSING:${marker}`);
  }

  for (const marker of [
    "data-layout-topology",
    "data-breakpoint-class",
    "data-selected-option-card",
    "data-support-drawer-open",
    "data-support-region",
    "data-support-fallback-mode",
    "data-sticky-action-region",
    "data-sticky-decision-dock",
    "data-mission-stack-visual-mode",
  ]) {
    requireCondition(app.includes(marker), `DOM_MARKER_MISSING:${marker}`);
  }

  for (const className of [
    ".hub-responsive-safe-area-frame",
    ".hub-narrow-status-strip",
    ".hub-case-pulse-compact",
    ".hub-narrow-queue-workbench",
    ".hub-option-compact-card",
    ".hub-support-drawer",
    ".hub-decision-dock-bar",
    ".hub-support-trigger-row",
  ]) {
    requireCondition(css.includes(className), `MISSION_STACK_STYLE_MISSING:${className}`);
  }

  requireCondition(
    model.includes("HUB_MISSION_STACK_VISUAL_MODE"),
    "MISSION_STACK_VISUAL_MODE_MISSING",
  );
}

function validateArtifacts() {
  const spec = read(
    path.join(ROOT, "docs", "frontend", "333_mobile_and_narrow_screen_hub_workflows_spec.md"),
  );
  const atlas = read(
    path.join(ROOT, "docs", "frontend", "333_mobile_and_narrow_screen_hub_workflows_atlas.html"),
  );
  const topology = read(path.join(ROOT, "docs", "frontend", "333_mission_stack_hub_topology.mmd"));
  const notes = read(path.join(ROOT, "data", "analysis", "333_visual_reference_notes.json"));
  const alignment = read(path.join(ROOT, "data", "analysis", "333_algorithm_alignment_notes.md"));
  const matrix = read(path.join(ROOT, "data", "analysis", "333_responsive_state_matrix.csv"));
  const a11y = read(path.join(ROOT, "docs", "accessibility", "333_mission_stack_hub_a11y_notes.md"));
  const tokens = JSON.parse(
    read(path.join(ROOT, "docs", "frontend", "333_mission_stack_hub_tokens.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    dimensions?: { supportDrawerWidthPx?: number; touchTargetMinPx?: number };
    motion?: { reducedMotion?: boolean };
  };
  const contract = JSON.parse(
    read(path.join(ROOT, "data", "contracts", "333_mission_stack_hub_contract.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    domMarkers?: string[];
    laws?: Record<string, boolean>;
  };

  requireCondition(spec.includes("HubDecisionDockBar"), "SPEC_CORE_SURFACE_MISSING");
  requireCondition(spec.includes("support drawer"), "SPEC_SUPPORT_DRAWER_MISSING");
  requireCondition(
    atlas.includes('data-testid="HubMissionStackAtlas"') &&
      atlas.includes('data-visual-mode="Hub_Mission_Stack_Premium"'),
    "ATLAS_ROOT_MARKERS_MISSING",
  );
  requireCondition(
    topology.includes('H["HubSupportDrawer"]') &&
      topology.includes('I["HubDecisionDockBar"]'),
    "TOPOLOGY_CORE_NODES_MISSING",
  );

  requireCondition(tokens.taskId === "par_333", "TOKENS_TASK_ID_INVALID");
  requireCondition(tokens.visualMode === HUB_MISSION_STACK_VISUAL_MODE, "TOKENS_VISUAL_MODE_INVALID");
  requireCondition(
    tokens.dimensions?.supportDrawerWidthPx === 360 &&
      tokens.dimensions?.touchTargetMinPx === 44 &&
      tokens.motion?.reducedMotion === true,
    "TOKENS_CORE_VALUES_INVALID",
  );

  requireCondition(contract.taskId === "par_333", "CONTRACT_TASK_ID_INVALID");
  requireCondition(
    contract.visualMode === HUB_MISSION_STACK_VISUAL_MODE,
    "CONTRACT_VISUAL_MODE_INVALID",
  );
  for (const marker of [
    "data-layout-topology",
    "data-breakpoint-class",
    "data-selected-option-card",
    "data-support-drawer-open",
    "data-support-region",
    "data-support-fallback-mode",
    "data-sticky-action-region",
    "data-sticky-decision-dock",
  ]) {
    requireCondition(contract.domMarkers?.includes(marker), `CONTRACT_MARKER_MISSING:${marker}`);
  }
  requireCondition(
    contract.laws?.sameShellFamilyUnderMissionStack === true &&
      contract.laws?.selectedAnchorSurvivesFoldAndReload === true &&
      contract.laws?.selectedOptionSurvivesFoldAndReload === true &&
      contract.laws?.supportRailBecomesDrawer === true &&
      contract.laws?.decisionDockBecomesSingleStickyBar === true &&
      contract.laws?.safeAreaAndReducedMotionRemainSupported === true,
    "CONTRACT_LAWS_INVALID",
  );

  for (const marker of [
    "HubNarrowStatusAuthorityStrip",
    "HubCasePulseCompact",
    "HubNarrowQueueWorkbench",
    "HubSupportDrawer",
    "HubDecisionDockBar",
  ]) {
    requireCondition(alignment.includes(marker), `ALIGNMENT_MARKER_MISSING:${marker}`);
  }

  for (const scenarioId of [
    "queue_narrow_desktop",
    "alternatives_tablet_portrait",
    "audit_tablet_landscape",
    "exceptions_mobile",
    "mobile_reflow_proxy",
  ]) {
    requireCondition(matrix.includes(scenarioId), `RESPONSIVE_MATRIX_ROW_MISSING:${scenarioId}`);
  }

  for (const url of [
    "https://playwright.dev/docs/emulation",
    "https://playwright.dev/docs/test-projects",
    "https://playwright.dev/docs/test-snapshots",
    "https://playwright.dev/docs/trace-viewer-intro",
    "https://playwright.dev/docs/accessibility-testing",
    "https://www.w3.org/WAI/WCAG22/Understanding/reflow",
    "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum",
    "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum",
    "https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    "https://linear.app/now/how-we-redesigned-the-linear-ui",
    "https://service-manual.nhs.uk/design-system/patterns/interruption-page",
  ]) {
    requireCondition(notes.includes(url), `VISUAL_REFERENCE_URL_MISSING:${url}`);
  }

  requireCondition(a11y.includes("44px"), "A11Y_TOUCH_TARGET_RULE_MISSING");
  requireCondition(a11y.includes("320px"), "A11Y_REFLOW_RULE_MISSING");
}

function validateRuntime() {
  const queueState = createInitialHubShellState("/hub/queue");
  const queueSnapshot = resolveHubShellSnapshot(queueState, 920);
  requireCondition(queueSnapshot.layoutMode === "mission_stack", "QUEUE_MISSION_STACK_INVALID");
  requireCondition(queueSnapshot.selectedAnchorId === queueState.selectedQueueAnchorId, "QUEUE_ANCHOR_DRIFT");

  const caseState = selectHubOptionCard(
    createInitialHubShellState("/hub/case/hub-case-104"),
    "opt-104-north-shore",
  );
  const narrowCaseSnapshot = resolveHubShellSnapshot(caseState, 920);
  const wideCaseSnapshot = resolveHubShellSnapshot(caseState, 1440);
  requireCondition(
    narrowCaseSnapshot.selectedOptionCard.optionCardId === "opt-104-north-shore",
    "NARROW_OPTION_ANCHOR_DRIFT",
  );
  requireCondition(
    wideCaseSnapshot.selectedOptionCard.optionCardId === "opt-104-north-shore",
    "WIDE_OPTION_ANCHOR_DRIFT",
  );
  requireCondition(wideCaseSnapshot.layoutMode === "three_panel", "WIDE_LAYOUT_MODE_INVALID");

  const alternativesState = navigateHubShell(caseState, "/hub/alternatives/offer-session-104");
  const alternativesSnapshot = resolveHubShellSnapshot(alternativesState, 820);
  requireCondition(
    alternativesSnapshot.location.routeFamilyRef === "rf_hub_case_management" &&
      alternativesSnapshot.layoutMode === "mission_stack",
    "ALTERNATIVES_MISSION_STACK_INVALID",
  );

  const exceptionsState = selectHubExceptionRow(
    createInitialHubShellState("/hub/exceptions"),
    "exc-loop-031",
  );
  const exceptionsSnapshot = resolveHubShellSnapshot(exceptionsState, 390);
  requireCondition(
    exceptionsSnapshot.layoutMode === "mission_stack" &&
      exceptionsSnapshot.exceptionWorkspace?.selectedExceptionId === "exc-loop-031",
    "EXCEPTIONS_SELECTION_DRIFT",
  );
}

function main() {
  validateFiles();
  validateChecklist();
  validatePackageScript();
  validateFrontendFiles();
  validateArtifacts();
  validateRuntime();
}

main();
