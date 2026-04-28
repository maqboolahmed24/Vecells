import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  HUB_SHELL_STORAGE_KEY,
  HUB_SHELL_VISUAL_MODE,
  createHubShellHistorySnapshot,
  createInitialHubShellState,
  navigateHubShell,
  resolveHubShellSnapshot,
  returnFromHubChildRoute,
  selectHubCase,
  selectHubSavedView,
} from "../../apps/hub-desk/src/hub-desk-shell.model.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.tsx"),
  path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.model.ts"),
  path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.css"),
  path.join(ROOT, "docs", "frontend", "326_hub_desk_shell_and_start_of_day_spec.md"),
  path.join(ROOT, "docs", "frontend", "326_hub_desk_shell_and_start_of_day_atlas.html"),
  path.join(ROOT, "docs", "frontend", "326_hub_desk_shell_topology.mmd"),
  path.join(ROOT, "docs", "frontend", "326_hub_desk_shell_design_tokens.json"),
  path.join(ROOT, "docs", "accessibility", "326_hub_desk_shell_a11y_notes.md"),
  path.join(ROOT, "data", "contracts", "326_hub_shell_contract.json"),
  path.join(ROOT, "data", "analysis", "326_algorithm_alignment_notes.md"),
  path.join(ROOT, "data", "analysis", "326_hub_shell_state_matrix.csv"),
  path.join(ROOT, "data", "analysis", "326_visual_reference_notes.json"),
  path.join(ROOT, "tests", "playwright", "326_hub_shell.helpers.ts"),
  path.join(ROOT, "tests", "playwright", "326_hub_shell_start_of_day.spec.ts"),
  path.join(ROOT, "tests", "playwright", "326_hub_shell_navigation.spec.ts"),
  path.join(ROOT, "tests", "playwright", "326_hub_shell.visual.spec.ts"),
  path.join(ROOT, "tests", "playwright", "326_hub_shell.accessibility.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:326-hub-shell-and-start-of-day": "pnpm exec tsx ./tools/analysis/validate_326_hub_shell_and_start_of_day.ts"';

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath: string): string {
  requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
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
      "- [-] par_326_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_hub_desk_shell_and_start_of_day_views",
    ) ||
      checklist.includes(
        "- [X] par_326_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_hub_desk_shell_and_start_of_day_views",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_326",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:326-hub-shell-and-start-of-day",
  );
}

function validateFrontendFiles() {
  const app = read(path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.tsx"));
  const css = read(path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.css"));
  const appPackage = read(path.join(ROOT, "apps", "hub-desk", "package.json"));

  for (const marker of [
    "HubDeskShellApp",
    "HubDeskShellDocument",
    "HubOwnershipContextChip",
    "HubStatusAuthorityStrip",
    "HubSavedViewRail",
    "HubStartOfDayResumeCard",
    "HubQueueEntryStrip",
    "HubInterruptionDigestPanel",
    "HubCaseStageHost",
    "HubShellContinuityBinder",
  ]) {
    requireCondition(app.includes(marker), `FRONTEND_COMPONENT_MISSING:${marker}`);
  }

  for (const marker of [
    'data-shell="hub"',
    "data-hub-route-family",
    "data-hub-start-of-day",
    "data-selected-anchor",
    "data-shell-status",
    "data-dominant-action",
    "data-testid=\"hub-shell-root\"",
  ]) {
    requireCondition(app.includes(marker), `FRONTEND_DOM_MARKER_MISSING:${marker}`);
  }

  requireCondition(css.includes("scroll-padding-top: 112px;"), "FOCUS_NOT_OBSCURED_RULE_MISSING");
  requireCondition(css.includes("--hub-transition: 0.01ms linear;"), "REDUCED_MOTION_RULE_MISSING");
  requireCondition(
    !appPackage.includes("placeholder shell scaffold"),
    "APP_PACKAGE_DESCRIPTION_STILL_PLACEHOLDER",
  );
}

function validateArtifacts() {
  const contract = JSON.parse(
    read(path.join(ROOT, "data", "contracts", "326_hub_shell_contract.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    continuityStorageKey?: string;
    routeFamilies?: Array<{ path?: string }>;
    savedViews?: Array<{ savedViewId?: string }>;
  };
  const notes = read(path.join(ROOT, "data", "analysis", "326_visual_reference_notes.json"));
  const alignment = read(path.join(ROOT, "data", "analysis", "326_algorithm_alignment_notes.md"));
  const matrix = read(path.join(ROOT, "data", "analysis", "326_hub_shell_state_matrix.csv"));
  const atlas = read(path.join(ROOT, "docs", "frontend", "326_hub_desk_shell_and_start_of_day_atlas.html"));
  const tokens = read(path.join(ROOT, "docs", "frontend", "326_hub_desk_shell_design_tokens.json"));
  const a11y = read(path.join(ROOT, "docs", "accessibility", "326_hub_desk_shell_a11y_notes.md"));

  requireCondition(contract.taskId === "par_326", "CONTRACT_TASK_ID_INVALID");
  requireCondition(contract.visualMode === HUB_SHELL_VISUAL_MODE, "CONTRACT_VISUAL_MODE_INVALID");
  requireCondition(
    contract.continuityStorageKey === HUB_SHELL_STORAGE_KEY,
    "CONTRACT_STORAGE_KEY_INVALID",
  );
  requireCondition(contract.routeFamilies?.length === 5, "CONTRACT_ROUTE_COUNT_INVALID");
  requireCondition(contract.savedViews?.length === 5, "CONTRACT_SAVED_VIEW_COUNT_INVALID");
  for (const requiredPath of [
    "/hub/queue",
    "/hub/case/:hubCoordinationCaseId",
    "/hub/alternatives/:offerSessionId",
    "/hub/exceptions",
    "/hub/audit/:hubCoordinationCaseId",
  ]) {
    requireCondition(
      contract.routeFamilies?.some((entry) => entry.path === requiredPath),
      `CONTRACT_ROUTE_PATH_MISSING:${requiredPath}`,
    );
  }

  for (const marker of [
    "https://linear.app/now/how-we-redesigned-the-linear-ui",
    "https://linear.app/docs/custom-views",
    "https://v10.carbondesignsystem.com/components/data-table/usage/",
    "https://service-manual.nhs.uk/content",
    "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
    "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum",
    "https://playwright.dev/docs/best-practices",
    "https://playwright.dev/docs/browser-contexts",
    "https://playwright.dev/docs/aria-snapshots",
    "https://playwright.dev/docs/test-snapshots",
    "https://web.dev/articles/vitals?hl=en",
  ]) {
    requireCondition(notes.includes(marker), `VISUAL_REFERENCE_URL_MISSING:${marker}`);
  }

  for (const marker of [
    "HubSavedViewRail",
    "HubStatusAuthorityStrip",
    "HubStartOfDayResumeCard",
    "HubQueueEntryStrip",
    "HubInterruptionDigestPanel",
    "HubCaseStageHost",
    "HubShellContinuityBinder",
  ]) {
    requireCondition(alignment.includes(marker), `ALIGNMENT_MARKER_MISSING:${marker}`);
  }

  for (const rowId of [
    "queue_resume_today",
    "queue_ack_watch",
    "queue_callback_recovery",
    "case_observe_only",
    "exceptions_recovery",
    "audit_read_only",
  ]) {
    requireCondition(matrix.includes(rowId), `STATE_MATRIX_ROW_MISSING:${rowId}`);
  }

  requireCondition(
    atlas.includes('data-testid="HubDeskShellAtlas"') &&
      atlas.includes('data-visual-mode="Hub_Desk_Mission_Control"'),
    "ATLAS_ROOT_MARKERS_MISSING",
  );
  requireCondition(atlas.includes("History state restores saved view and queue anchor first."), "ATLAS_CONTINUITY_NOTE_MISSING");
  requireCondition(
    tokens.includes("\"hubAccent\"") || tokens.includes("\"hub_accent\"") || tokens.includes("#2457FF"),
    "TOKEN_EXTENSION_MISSING",
  );
  requireCondition(
    a11y.toLowerCase().includes("reduced motion") || a11y.toLowerCase().includes("reduced-motion"),
    "A11Y_NOTES_REDUCED_MOTION_MISSING",
  );
}

function validateModelRuntime() {
  const initial = createInitialHubShellState("/hub/queue");
  const initialSnapshot = resolveHubShellSnapshot(initial, 1440);
  requireCondition(initial.selectedSavedViewId === "resume_today", "MODEL_DEFAULT_SAVED_VIEW_INVALID");
  requireCondition(initialSnapshot.location.routeFamilyRef === "rf_hub_queue", "MODEL_DEFAULT_ROUTE_FAMILY_INVALID");
  requireCondition(initialSnapshot.routeShellPosture === "shell_live", "MODEL_DEFAULT_SHELL_POSTURE_INVALID");

  const recoveryState = selectHubSavedView(initial, "supplier_drift");
  const recoverySnapshot = resolveHubShellSnapshot(recoveryState, 1440);
  requireCondition(
    recoverySnapshot.routeShellPosture === "shell_recovery_only",
    "MODEL_RECOVERY_POSTURE_INVALID",
  );
  requireCondition(
    recoverySnapshot.currentCase.caseId === "hub-case-041",
    "MODEL_RECOVERY_DEFAULT_CASE_INVALID",
  );

  const observeState = selectHubSavedView(initial, "observe_only");
  const observeSnapshot = resolveHubShellSnapshot(observeState, 1440);
  requireCondition(
    observeSnapshot.routeShellPosture === "shell_read_only",
    "MODEL_OBSERVE_ONLY_POSTURE_INVALID",
  );

  const selectedState = selectHubCase(selectHubSavedView(initial, "ack_watch"), "hub-case-087");
  const selectedHistory = createHubShellHistorySnapshot(selectedState);
  const restored = createInitialHubShellState("/hub/queue", { historySnapshot: selectedHistory });
  requireCondition(restored.selectedSavedViewId === "ack_watch", "MODEL_HISTORY_SAVED_VIEW_RESTORE_INVALID");
  requireCondition(restored.selectedCaseId === "hub-case-087", "MODEL_HISTORY_CASE_RESTORE_INVALID");

  const caseState = navigateHubShell(initial, "/hub/case/hub-case-104");
  const alternativesState = navigateHubShell(caseState, "/hub/alternatives/offer-session-104");
  const returnedState = returnFromHubChildRoute(alternativesState);
  requireCondition(
    returnedState.location.pathname === "/hub/case/hub-case-104",
    "MODEL_CHILD_ROUTE_RETURN_INVALID",
  );
}

async function main() {
  validateFiles();
  validateChecklist();
  validatePackageScript();
  validateFrontendFiles();
  validateArtifacts();
  validateModelRuntime();
  console.log("validate_326_hub_shell_and_start_of_day: ok");
}

await main();
