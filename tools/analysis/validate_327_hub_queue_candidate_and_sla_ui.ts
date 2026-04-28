import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  HUB_QUEUE_VISUAL_MODE,
  applyHubQueueChangeBatch,
  bufferHubQueueChangeBatch,
  createInitialHubShellState,
  resolveHubShellSnapshot,
  selectHubOptionCard,
  selectHubQueueFilter,
  selectHubSavedView,
} from "../../apps/hub-desk/src/hub-desk-shell.model.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_FILES = [
  path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.tsx"),
  path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.model.ts"),
  path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.css"),
  path.join(ROOT, "docs", "frontend", "327_hub_queue_candidate_ranking_and_sla_spec.md"),
  path.join(ROOT, "docs", "frontend", "327_hub_queue_candidate_ranking_and_sla_atlas.html"),
  path.join(ROOT, "docs", "frontend", "327_hub_queue_candidate_ranking_topology.mmd"),
  path.join(ROOT, "docs", "frontend", "327_hub_queue_candidate_tokens.json"),
  path.join(ROOT, "docs", "accessibility", "327_hub_queue_candidate_a11y_notes.md"),
  path.join(ROOT, "data", "contracts", "327_hub_queue_workbench_contract.json"),
  path.join(ROOT, "data", "analysis", "327_algorithm_alignment_notes.md"),
  path.join(ROOT, "data", "analysis", "327_queue_risk_visualization_matrix.csv"),
  path.join(ROOT, "data", "analysis", "327_visual_reference_notes.json"),
  path.join(ROOT, "tests", "playwright", "327_hub_queue.helpers.ts"),
  path.join(ROOT, "tests", "playwright", "327_hub_queue_workbench.spec.ts"),
  path.join(ROOT, "tests", "playwright", "327_hub_candidate_stack.spec.ts"),
  path.join(ROOT, "tests", "playwright", "327_hub_queue.visual.spec.ts"),
  path.join(ROOT, "tests", "playwright", "327_hub_queue.accessibility.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:327-hub-queue-candidate-and-sla-ui": "pnpm exec tsx ./tools/analysis/validate_327_hub_queue_candidate_and_sla_ui.ts"';

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
      "- [-] par_327_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_coordination_queue_candidate_ranking_and_sla_visualization",
    ) ||
      checklist.includes(
        "- [X] par_327_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_coordination_queue_candidate_ranking_and_sla_visualization",
      ),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:par_327",
  );
}

function validatePackageScript() {
  const packageJson = read(path.join(ROOT, "package.json"));
  requireCondition(
    packageJson.includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:327-hub-queue-candidate-and-sla-ui",
  );
}

function validateFrontendFiles() {
  const app = read(path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.tsx"));
  const css = read(path.join(ROOT, "apps", "hub-desk", "src", "hub-desk-shell.css"));

  for (const marker of [
    "HubQueueWorkbench",
    "HubQueueRow",
    "HubQueueSavedViewToolbar",
    "HubRiskBandStrip",
    "HubBreachHorizonMeter",
    "HubOptionCardStack",
    "HubOptionCard",
    "HubBestFitNowStrip",
    "HubEscalationBannerLane",
    "HubDecisionDockHost",
  ]) {
    requireCondition(app.includes(marker), `FRONTEND_COMPONENT_MISSING:${marker}`);
  }

  for (const marker of [
    "data-hub-queue-row",
    "data-risk-band",
    "data-selected-case",
    "data-option-card",
    "data-reservation-truth",
    "data-callback-fallback",
    "data-breach-visualization",
    "data-queue-visual-mode",
  ]) {
    requireCondition(app.includes(marker), `FRONTEND_DOM_MARKER_MISSING:${marker}`);
  }

  requireCondition(css.includes(".hub-queue-candidate-workbench"), "WORKBENCH_LAYOUT_RULE_MISSING");
  requireCondition(css.includes(".hub-breach-meter"), "BREACH_METER_RULE_MISSING");
  requireCondition(css.includes(".hub-callback-card"), "CALLBACK_CARD_RULE_MISSING");
  requireCondition(
    css.includes("grid-template-columns: 336px minmax(0, 1fr) 384px;"),
    "DESKTOP_WORKBENCH_GRID_MISSING",
  );
}

function validateArtifacts() {
  const contract = JSON.parse(
    read(path.join(ROOT, "data", "contracts", "327_hub_queue_workbench_contract.json")),
  ) as {
    taskId?: string;
    visualMode?: string;
    domMarkers?: string[];
    queueChangeLaw?: {
      browserRerankAllowed?: boolean;
      preserveSelectedCase?: boolean;
      preserveSelectedOption?: boolean;
    };
    callbackLaw?: { separateFromRankedRows?: boolean };
  };
  const notes = read(path.join(ROOT, "data", "analysis", "327_visual_reference_notes.json"));
  const alignment = read(path.join(ROOT, "data", "analysis", "327_algorithm_alignment_notes.md"));
  const matrix = read(
    path.join(ROOT, "data", "analysis", "327_queue_risk_visualization_matrix.csv"),
  );
  const atlas = read(
    path.join(ROOT, "docs", "frontend", "327_hub_queue_candidate_ranking_and_sla_atlas.html"),
  );
  const spec = read(
    path.join(ROOT, "docs", "frontend", "327_hub_queue_candidate_ranking_and_sla_spec.md"),
  );

  requireCondition(contract.taskId === "par_327", "CONTRACT_TASK_ID_INVALID");
  requireCondition(contract.visualMode === HUB_QUEUE_VISUAL_MODE, "CONTRACT_VISUAL_MODE_INVALID");
  requireCondition(
    contract.domMarkers?.includes("data-hub-queue-row"),
    "CONTRACT_QUEUE_MARKER_MISSING",
  );
  requireCondition(
    contract.queueChangeLaw?.browserRerankAllowed === false,
    "QUEUE_CHANGE_LAW_INVALID",
  );
  requireCondition(
    contract.queueChangeLaw?.preserveSelectedCase === true,
    "SELECTED_CASE_LAW_INVALID",
  );
  requireCondition(
    contract.queueChangeLaw?.preserveSelectedOption === true,
    "SELECTED_OPTION_LAW_INVALID",
  );
  requireCondition(contract.callbackLaw?.separateFromRankedRows === true, "CALLBACK_LAW_INVALID");

  for (const marker of [
    "https://linear.app/now/how-we-redesigned-the-linear-ui",
    "https://linear.app/docs/custom-views",
    "https://v10.carbondesignsystem.com/components/data-table/usage/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/grid/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/listbox/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
    "https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html",
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
    "HubQueueWorkbench",
    "HubOptionCardProjection",
    "HubDecisionDockHost",
    "QueueChangeBatch",
    "HubEscalationBannerProjection",
  ]) {
    requireCondition(alignment.includes(marker), `ALIGNMENT_MARKER_MISSING:${marker}`);
  }

  for (const rowId of ["critical_callback", "critical_drift", "watch_ack", "watch_same_day"]) {
    requireCondition(matrix.includes(rowId), `RISK_MATRIX_ROW_MISSING:${rowId}`);
  }

  requireCondition(
    atlas.includes('data-testid="HubQueueWorkbenchAtlas"') &&
      atlas.includes('data-visual-mode="Hub_Queue_Risk_Workbench"'),
    "ATLAS_ROOT_MARKERS_MISSING",
  );
  requireCondition(
    spec.includes("browser reranking is forbidden"),
    "SPEC_QUEUE_RERANK_RULE_MISSING",
  );
}

function validateModelRuntime() {
  const initial = createInitialHubShellState("/hub/queue");
  const initialSnapshot = resolveHubShellSnapshot(initial, 1560);
  requireCondition(
    initialSnapshot.queueVisualMode === HUB_QUEUE_VISUAL_MODE,
    "QUEUE_VISUAL_MODE_INVALID",
  );
  requireCondition(initialSnapshot.queueWorkbench.visibleRows.length >= 3, "QUEUE_ROWS_MISSING");
  requireCondition(initialSnapshot.optionCardGroups.length >= 1, "OPTION_GROUPS_MISSING");
  requireCondition(
    initialSnapshot.selectedOptionCard.optionCardId === "opt-104-riverside",
    "DEFAULT_SELECTED_OPTION_INVALID",
  );

  const selectedOptionState = selectHubOptionCard(initial, "opt-104-north-shore");
  const selectedOptionSnapshot = resolveHubShellSnapshot(selectedOptionState, 1560);
  requireCondition(
    selectedOptionSnapshot.selectedOptionCard.optionCardId === "opt-104-north-shore",
    "OPTION_SELECTION_DID_NOT_STICK",
  );
  requireCondition(
    selectedOptionSnapshot.bestFitNowStrip.optionCardId === "opt-104-north-shore",
    "BEST_FIT_STRIP_DID_NOT_TRACK_SELECTION",
  );

  const filteredState = selectHubQueueFilter(initial, "critical");
  const filteredSnapshot = resolveHubShellSnapshot(filteredState, 1560);
  requireCondition(
    filteredSnapshot.queueWorkbench.visibleRows.every((row) => row.riskBand === "critical"),
    "CRITICAL_FILTER_DID_NOT_FILTER_ROWS",
  );

  const bufferedState = bufferHubQueueChangeBatch(selectedOptionState);
  const bufferedSnapshot = resolveHubShellSnapshot(bufferedState, 1560);
  requireCondition(
    bufferedSnapshot.queueWorkbench.queueChangeBatch?.state === "buffered",
    "BUFFERED_BATCH_NOT_PUBLISHED",
  );
  requireCondition(
    bufferedSnapshot.queueWorkbench.visibleRows[0]?.caseId === "hub-case-104",
    "BUFFERED_BATCH_CHANGED_VISIBLE_ORDER_TOO_EARLY",
  );
  requireCondition(
    bufferedSnapshot.selectedOptionCard.optionCardId === "opt-104-north-shore",
    "BUFFERED_BATCH_STOLE_SELECTED_OPTION",
  );

  const appliedSnapshot = resolveHubShellSnapshot(applyHubQueueChangeBatch(bufferedState), 1560);
  requireCondition(
    appliedSnapshot.queueWorkbench.visibleRows[0]?.caseId === "hub-case-087",
    "APPLIED_BATCH_DID_NOT_REORDER_QUEUE",
  );
  requireCondition(
    appliedSnapshot.currentCase.caseId === "hub-case-104",
    "APPLIED_BATCH_STOLE_SELECTED_CASE",
  );
  requireCondition(
    appliedSnapshot.selectedOptionCard.optionCardId === "opt-104-north-shore",
    "APPLIED_BATCH_STOLE_SELECTED_OPTION",
  );

  const callbackSnapshot = resolveHubShellSnapshot(
    selectHubSavedView(initial, "callback_recovery"),
    1560,
  );
  requireCondition(
    callbackSnapshot.callbackFallbackCard?.cardId === "callback-052",
    "CALLBACK_CARD_MISSING",
  );
  requireCondition(
    callbackSnapshot.escalationBanner?.bannerType === "callback_transfer_blocked",
    "CALLBACK_ESCALATION_BANNER_MISSING",
  );
}

async function main() {
  validateFiles();
  validateChecklist();
  validatePackageScript();
  validateFrontendFiles();
  validateArtifacts();
  validateModelRuntime();
  console.log("validate_327_hub_queue_candidate_and_sla_ui: ok");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
