import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  HUB_RECOVERY_VISUAL_MODE,
  createInitialHubShellState,
  navigateHubShell,
  resolveHubShellSnapshot,
  selectHubExceptionRow,
  selectHubSavedView,
} from "../../apps/hub-desk/src/hub-desk-shell.model.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.tsx"),
  path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.model.ts"),
  path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.css"),
  path.join(ROOT, "docs", "frontend", "331_hub_no_slot_reopen_and_recovery_spec.md"),
  path.join(ROOT, "docs", "frontend", "331_hub_no_slot_reopen_and_recovery_atlas.html"),
  path.join(ROOT, "docs", "frontend", "331_hub_no_slot_reopen_topology.mmd"),
  path.join(ROOT, "docs", "frontend", "331_hub_no_slot_reopen_tokens.json"),
  path.join(ROOT, "docs", "accessibility", "331_hub_no_slot_reopen_a11y_notes.md"),
  path.join(ROOT, "data", "contracts", "331_hub_recovery_and_exception_contract.json"),
  path.join(ROOT, "data", "analysis", "331_algorithm_alignment_notes.md"),
  path.join(ROOT, "data", "analysis", "331_recovery_reopen_state_matrix.csv"),
  path.join(ROOT, "data", "analysis", "331_visual_reference_notes.json"),
  path.join(ROOT, "tests", "playwright", "331_hub_no_slot_recovery.spec.ts"),
  path.join(ROOT, "tests", "playwright", "331_hub_exceptions_workspace.spec.ts"),
  path.join(ROOT, "tests", "playwright", "331_hub_reopen.visual.spec.ts"),
  path.join(ROOT, "tests", "playwright", "331_hub_recovery.accessibility.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:331-hub-recovery-and-exception-ui": "pnpm exec tsx ./tools/analysis/validate_331_hub_recovery_and_exception_ui.ts"';

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
      "- [-] par_331_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_no_slot_reopen_and_urgent_bounce_back_recovery_views",
    ) ||
      checklist.includes(
        "- [X] par_331_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_no_slot_reopen_and_urgent_bounce_back_recovery_views",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_331",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:331-hub-recovery-and-exception-ui",
  );
}

function validateFrontendFiles() {
  const app = read(path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.tsx"));
  const css = read(path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.css"));
  const model = read(path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.model.ts"));

  for (const marker of [
    "HubNoSlotResolutionPanel",
    "HubCallbackTransferPendingState",
    "HubReturnToPracticeReceipt",
    "HubUrgentBounceBackBanner",
    "HubRecoveryDiffStrip",
    "HubExceptionQueueView",
    "HubExceptionDetailDrawer",
    "HubReopenProvenanceStub",
    "HubSupervisorEscalationPanel",
  ]) {
    requireCondition(app.includes(marker), `FRONTEND_COMPONENT_MISSING:${marker}`);
  }

  for (const marker of [
    "data-hub-recovery",
    "data-fallback-type",
    "data-callback-transfer",
    "data-return-to-practice",
    "data-hub-exception-row",
    "data-reopen-diff",
    "data-supervisor-escalation",
    "data-selected-exception-id",
  ]) {
    requireCondition(app.includes(marker), `DOM_MARKER_MISSING:${marker}`);
  }

  requireCondition(model.includes("HUB_RECOVERY_VISUAL_MODE"), "RECOVERY_VISUAL_MODE_MISSING");
  requireCondition(model.includes("selectedExceptionId"), "SELECTED_EXCEPTION_HISTORY_MISSING");
  requireCondition(css.includes(".hub-recovery-canvas"), "RECOVERY_CANVAS_STYLES_MISSING");
  requireCondition(css.includes(".hub-exception-workspace"), "EXCEPTION_WORKSPACE_STYLES_MISSING");
}

function validateArtifacts() {
  const spec = read(
    path.join(ROOT, "docs", "frontend", "331_hub_no_slot_reopen_and_recovery_spec.md"),
  );
  const atlas = read(
    path.join(ROOT, "docs", "frontend", "331_hub_no_slot_reopen_and_recovery_atlas.html"),
  );
  const contract = JSON.parse(
    read(path.join(ROOT, "data", "contracts", "331_hub_recovery_and_exception_contract.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    domMarkers?: string[];
    laws?: Record<string, boolean>;
  };
  const alignment = read(path.join(ROOT, "data", "analysis", "331_algorithm_alignment_notes.md"));
  const matrix = read(path.join(ROOT, "data", "analysis", "331_recovery_reopen_state_matrix.csv"));
  const notes = read(path.join(ROOT, "data", "analysis", "331_visual_reference_notes.json"));

  requireCondition(contract.taskId === "par_331", "CONTRACT_TASK_ID_INVALID");
  requireCondition(
    contract.visualMode === HUB_RECOVERY_VISUAL_MODE,
    "CONTRACT_VISUAL_MODE_INVALID",
  );
  for (const marker of [
    "data-hub-recovery",
    "data-fallback-type",
    "data-callback-transfer",
    "data-return-to-practice",
    "data-hub-exception-row",
    "data-reopen-diff",
    "data-supervisor-escalation",
  ]) {
    requireCondition(contract.domMarkers?.includes(marker), `CONTRACT_MARKER_MISSING:${marker}`);
  }
  requireCondition(
    contract.laws?.noSlotPreservesPriorContext === true &&
      contract.laws?.callbackPendingCannotLookCalm === true &&
      contract.laws?.repeatBounceRequiresSupervisorEscalation === true &&
      contract.laws?.reopenIsDiffFirstAndAnchorPreserving === true &&
      contract.laws?.exceptionsWorkspacePersistsSelectionAcrossRefresh === true &&
      contract.laws?.exceptionsStaySameShell === true,
    "CONTRACT_LAWS_INVALID",
  );

  requireCondition(
    spec.includes("HubNoSlotResolutionPanel") &&
      spec.includes("HubExceptionQueueView") &&
      spec.includes("generic error"),
    "SPEC_CORE_CONTENT_MISSING",
  );
  requireCondition(
    atlas.includes('data-testid="HubRecoveryAndReopenAtlas"') &&
      atlas.includes('data-visual-mode="Hub_Recovery_And_Reopen"'),
    "ATLAS_ROOT_MARKERS_MISSING",
  );

  for (const marker of [
    "HubFallbackRecord",
    "CallbackFallbackRecord",
    "HubReturnToPracticeRecord",
    "HubCoordinationException",
    "HubFallbackSupervisorEscalation",
    "HubExceptionWorkItem",
  ]) {
    requireCondition(alignment.includes(marker), `ALIGNMENT_MARKER_MISSING:${marker}`);
  }

  for (const scenarioId of [
    "callback_pending_052",
    "urgent_return_031",
    "reopen_diff_041",
    "exceptions_callback_052",
    "exceptions_loop_031",
  ]) {
    requireCondition(matrix.includes(scenarioId), `STATE_MATRIX_ROW_MISSING:${scenarioId}`);
  }

  for (const url of [
    "https://www.w3.org/WAI/ARIA/apg/patterns/alert/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
    "https://www.w3.org/WAI/WCAG22/Understanding/reflow",
    "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum",
    "https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html",
    "https://service-manual.nhs.uk/design-system/patterns/interruption-page",
    "https://service-manual.nhs.uk/design-system/patterns/confirmation-page",
    "https://playwright.dev/docs/best-practices",
    "https://playwright.dev/docs/browser-contexts",
    "https://playwright.dev/docs/aria-snapshots",
    "https://playwright.dev/docs/test-snapshots",
    "https://playwright.dev/docs/trace-viewer-intro",
    "https://linear.app/now/how-we-redesigned-the-linear-ui",
    "https://linear.app/docs/conceptual-model",
  ]) {
    requireCondition(notes.includes(url), `VISUAL_REFERENCE_URL_MISSING:${url}`);
  }
}

function validateRuntime() {
  const callbackState = createInitialHubShellState("/hub/case/hub-case-052");
  const callbackSnapshot = resolveHubShellSnapshot(callbackState, 1440);
  requireCondition(
    callbackSnapshot.recoveryCase?.noSlotResolutionPanel?.fallbackType === "callback_request",
    "CALLBACK_RECOVERY_PANEL_INVALID",
  );
  requireCondition(
    callbackSnapshot.recoveryCase?.callbackTransferPendingState?.blockingRefs.length === 3,
    "CALLBACK_PENDING_BINDING_INVALID",
  );

  const urgentState = createInitialHubShellState("/hub/case/hub-case-031");
  const urgentSnapshot = resolveHubShellSnapshot(urgentState, 1440);
  requireCondition(
    urgentSnapshot.recoveryCase?.returnToPracticeReceipt?.fallbackType ===
      "urgent_return_to_practice",
    "URGENT_RETURN_RECEIPT_INVALID",
  );
  requireCondition(
    urgentSnapshot.recoveryCase?.supervisorEscalationPanel?.bounceCount === 4,
    "SUPERVISOR_ESCALATION_INVALID",
  );

  const reopenState = createInitialHubShellState("/hub/case/hub-case-041");
  const reopenSnapshot = resolveHubShellSnapshot(reopenState, 1440);
  requireCondition(
    reopenSnapshot.recoveryCase?.recoveryDiffStrip?.diffRows.length === 3,
    "REOPEN_DIFF_INVALID",
  );

  const exceptionsState = createInitialHubShellState("/hub/exceptions");
  const exceptionsSnapshot = resolveHubShellSnapshot(exceptionsState, 1440);
  requireCondition(
    exceptionsSnapshot.currentCase.caseId === "hub-case-052",
    "EXCEPTIONS_DEEP_LINK_CASE_INVALID",
  );
  requireCondition(
    exceptionsSnapshot.exceptionWorkspace?.selectedExceptionId === "exc-callback-052",
    "EXCEPTIONS_DEFAULT_SELECTION_INVALID",
  );

  const callbackRecovery = selectHubSavedView(createInitialHubShellState("/hub/queue"), "callback_recovery");
  const exceptionRoute = navigateHubShell(callbackRecovery, "/hub/exceptions");
  const selectedExceptionState = selectHubExceptionRow(exceptionRoute, "exc-loop-031");
  const selectedExceptionSnapshot = resolveHubShellSnapshot(selectedExceptionState, 1440);
  requireCondition(
    selectedExceptionSnapshot.currentCase.caseId === "hub-case-031" &&
      selectedExceptionSnapshot.exceptionWorkspace?.selectedExceptionId === "exc-loop-031",
    "EXCEPTION_SELECTION_DID_NOT_PRESERVE_CASE_ANCHOR",
  );
}

function main() {
  validateFiles();
  validateChecklist();
  validatePackageScript();
  validateFrontendFiles();
  validateArtifacts();
  validateRuntime();
  console.log("331 hub recovery and exception UI validation passed.");
}

main();
