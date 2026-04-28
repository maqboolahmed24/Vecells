import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

const CHECKLIST_PATH = path.join(ROOT, "prompt", "checklist.md");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");

const REQUIRED_FILES = [
  path.join(ROOT, "docs", "governance", "310_phase4_exit_gate_pack.md"),
  path.join(ROOT, "docs", "governance", "310_phase4_go_no_go_decision.md"),
  path.join(ROOT, "docs", "governance", "310_phase4_conformance_scorecard.md"),
  path.join(ROOT, "docs", "governance", "310_phase4_to_phase5_boundary.md"),
  path.join(ROOT, "docs", "governance", "310_phase4_live_vs_sandbox_vs_simulator_boundary.md"),
  path.join(ROOT, "docs", "frontend", "310_phase4_exit_board.html"),
  path.join(ROOT, "data", "analysis", "310_external_reference_notes.json"),
  path.join(ROOT, "data", "analysis", "310_phase4_exit_gate_decision.json"),
  path.join(ROOT, "data", "analysis", "310_phase4_conformance_matrix.csv"),
  path.join(ROOT, "data", "analysis", "310_phase4_evidence_freshness_matrix.csv"),
  path.join(ROOT, "data", "analysis", "310_phase4_open_issues_and_carry_forward.json"),
  path.join(ROOT, "tools", "analysis", "build_310_phase4_exit_gate.ts"),
  path.join(ROOT, "tools", "analysis", "validate_310_phase4_exit_gate.ts"),
  path.join(ROOT, "tests", "playwright", "310_phase4_exit_board.spec.ts"),
];

const REQUIRED_SCRIPT =
  '"validate:310-phase4-exit-gate": "pnpm exec tsx ./tools/analysis/validate_310_phase4_exit_gate.ts"';

const REQUIRED_ROW_IDS = [
  "PH4_ROW_01",
  "PH4_ROW_02",
  "PH4_ROW_03",
  "PH4_ROW_04",
  "PH4_ROW_05",
  "PH4_ROW_06",
  "PH4_ROW_07",
  "PH4_ROW_08",
  "PH4_ROW_09",
  "PH4_ROW_10",
];

const REQUIRED_ISSUE_IDS = ["ISSUE310_001", "ISSUE310_002", "ISSUE310_003", "ISSUE310_004"];
const REQUIRED_FRESHNESS_IDS = [
  "E310_001",
  "E310_002",
  "E310_003",
  "E310_004",
  "E310_005",
  "E310_006",
  "E310_007",
  "E310_008",
];

function read(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function parseJson(filePath: string) {
  return JSON.parse(read(filePath));
}

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  requireCondition(lines.length > 1, "CSV_MISSING_ROWS");
  const parseLine = (line: string) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  };

  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function validateChecklist() {
  const checklist = read(CHECKLIST_PATH);
  requireCondition(
    checklist.includes("- [-] seq_310_phase4_exit_gate_approve_booking_engine_completion") ||
      checklist.includes("- [X] seq_310_phase4_exit_gate_approve_booking_engine_completion"),
    "CHECKLIST_ROW_MISSING_OR_UNCLAIMED:seq_310",
  );
}

function validatePackageScript() {
  const packageJson = read(PACKAGE_JSON_PATH);
  requireCondition(packageJson.includes(REQUIRED_SCRIPT), "PACKAGE_SCRIPT_MISSING:validate:310");
}

function validateDocs() {
  const pack = read(path.join(ROOT, "docs", "governance", "310_phase4_exit_gate_pack.md"));
  requireCondition(pack.includes("Phase 4 exit verdict: `go_with_constraints`"), "PACK_VERDICT_MISSING");
  requireCondition(pack.includes("Widened rollout verdict: `withheld`"), "PACK_ROLLOUT_VERDICT_MISSING");

  const decision = read(path.join(ROOT, "docs", "governance", "310_phase4_go_no_go_decision.md"));
  requireCondition(decision.includes("The authoritative verdict is `go_with_constraints`."), "DECISION_VERDICT_MISSING");
  requireCondition(
    decision.includes("This is a **no-go** for:"),
    "DECISION_NO_GO_SECTION_MISSING",
  );

  const boundary = read(path.join(ROOT, "docs", "governance", "310_phase4_to_phase5_boundary.md"));
  requireCondition(boundary.includes("Phase 5 consumes from Phase 4"), "BOUNDARY_CONSUME_SECTION_MISSING");
  requireCondition(boundary.includes("seq_311"), "BOUNDARY_SEQ311_MISSING");
  requireCondition(boundary.includes("seq_314"), "BOUNDARY_SEQ314_MISSING");

  const liveBoundary = read(
    path.join(ROOT, "docs", "governance", "310_phase4_live_vs_sandbox_vs_simulator_boundary.md"),
  );
  requireCondition(liveBoundary.includes("sandbox provider evidence is not live provider parity"), "LIVE_BOUNDARY_TEXT_MISSING");
}

function validateExternalNotes() {
  const notes = parseJson(path.join(ROOT, "data", "analysis", "310_external_reference_notes.json"));
  requireCondition(notes.taskId === "seq_310_phase4_exit_gate", "NOTES_TASK_ID_DRIFT");
  const sourceUrls = new Set((notes.sourcesReviewed ?? []).map((entry: { url: string }) => entry.url));
  for (const url of [
    "https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance",
    "https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/",
    "https://playwright.dev/docs/trace-viewer",
    "https://playwright.dev/docs/test-snapshots",
    "https://service-manual.nhs.uk/design-system/components/table",
    "https://service-manual.nhs.uk/design-system/patterns/check-answers",
    "https://carbondesignsystem.com/components/data-table/usage/",
    "https://vercel.com/docs/dashboard-features/overview",
    "https://linear.app/docs/triage",
    "https://linear.app/docs/display-options",
  ]) {
    requireCondition(sourceUrls.has(url), `EXTERNAL_SOURCE_MISSING:${url}`);
  }
}

function validateDecisionJson() {
  const decision = parseJson(path.join(ROOT, "data", "analysis", "310_phase4_exit_gate_decision.json"));
  requireCondition(decision.taskId === "seq_310_phase4_exit_gate", "DECISION_TASK_ID_DRIFT");
  requireCondition(decision.verdict === "go_with_constraints", "DECISION_VERDICT_DRIFT");
  requireCondition(decision.phase5EntryVerdict === "approved", "DECISION_PHASE5_ENTRY_DRIFT");
  requireCondition(decision.widenedRolloutVerdict === "withheld", "DECISION_ROLLOUT_DRIFT");
  requireCondition(decision.liveProviderParityVerdict === "withheld", "DECISION_LIVE_PARITY_DRIFT");
  requireCondition(Array.isArray(decision.rows) && decision.rows.length === REQUIRED_ROW_IDS.length, "DECISION_ROWS_COUNT_DRIFT");
  requireCondition(Array.isArray(decision.boundaryItems) && decision.boundaryItems.length === 6, "DECISION_BOUNDARY_ITEMS_DRIFT");
  requireCondition(Array.isArray(decision.liveBoundaryRows) && decision.liveBoundaryRows.length === 5, "DECISION_LIVE_BOUNDARY_DRIFT");
  for (const rowId of REQUIRED_ROW_IDS) {
    requireCondition(
      decision.rows.some((row: { rowId: string }) => row.rowId === rowId),
      `DECISION_ROW_MISSING:${rowId}`,
    );
  }
  requireCondition(
    decision.mandatoryQuestions.some(
      (entry: { questionId: string; answerStatus: string }) =>
        entry.questionId === "Q310_004" && entry.answerStatus === "withheld",
    ),
    "DECISION_QUESTION_Q310_004_DRIFT",
  );
}

function validateConformanceCsv() {
  const rows = parseCsv(read(path.join(ROOT, "data", "analysis", "310_phase4_conformance_matrix.csv")));
  requireCondition(rows.length === REQUIRED_ROW_IDS.length, "CONFORMANCE_ROW_COUNT_DRIFT");
  const ids = new Set(rows.map((row) => row.rowId));
  for (const rowId of REQUIRED_ROW_IDS) {
    requireCondition(ids.has(rowId), `CONFORMANCE_ROW_MISSING:${rowId}`);
  }
  requireCondition(
    rows.some((row) => row.rowId === "PH4_ROW_10" && row.status === "withheld"),
    "CONFORMANCE_WITHHELD_ROW_MISSING",
  );
}

function validateFreshnessCsv() {
  const rows = parseCsv(read(path.join(ROOT, "data", "analysis", "310_phase4_evidence_freshness_matrix.csv")));
  requireCondition(rows.length === REQUIRED_FRESHNESS_IDS.length, "FRESHNESS_ROW_COUNT_DRIFT");
  const ids = new Set(rows.map((row) => row.evidenceId));
  for (const evidenceId of REQUIRED_FRESHNESS_IDS) {
    requireCondition(ids.has(evidenceId), `FRESHNESS_ROW_MISSING:${evidenceId}`);
  }
  requireCondition(
    rows.some(
      (row) =>
        row.evidenceId === "E310_006" &&
        row.freshnessState === "missing" &&
        row.blockingOnApproved === "yes",
    ),
    "FRESHNESS_E310_006_DRIFT",
  );
  requireCondition(
    rows.some(
      (row) =>
        row.evidenceId === "E310_005" &&
        row.resultStatus === "failed" &&
        row.freshnessState === "follow_up_required",
    ),
    "FRESHNESS_E310_005_DRIFT",
  );
}

function validateOpenIssues() {
  const issues = parseJson(path.join(ROOT, "data", "analysis", "310_phase4_open_issues_and_carry_forward.json"));
  requireCondition(Array.isArray(issues) && issues.length === REQUIRED_ISSUE_IDS.length, "ISSUE_COUNT_DRIFT");
  const ids = new Set(issues.map((issue: { issueId: string }) => issue.issueId));
  for (const issueId of REQUIRED_ISSUE_IDS) {
    requireCondition(ids.has(issueId), `ISSUE_MISSING:${issueId}`);
  }
  requireCondition(
    issues.some(
      (issue: { issueId: string; ownerTask: string; followOnTasks: string[] }) =>
        issue.issueId === "ISSUE310_001" &&
        issue.ownerTask === "seq_314" &&
        issue.followOnTasks.includes("seq_341"),
    ),
    "ISSUE310_001_OWNER_DRIFT",
  );
}

function validateBoard() {
  const board = read(path.join(ROOT, "docs", "frontend", "310_phase4_exit_board.html"));
  for (const token of [
    'data-testid="Phase4ExitBoard"',
    'data-testid="VerdictRibbon"',
    'data-testid="ConformanceLadder"',
    'data-testid="EvidenceFreshnessMatrix"',
    'data-testid="LiveVsSimulatorBoundaryTable"',
    'data-testid="CarryForwardBoundaryMap"',
    'data-testid="CarryForwardBoundaryTable"',
    'data-testid="OpenIssueInspector"',
    'data-testid="ConformanceFamilyTable"',
    "window.__phase4ExitBoardData",
    "previewVerdict",
  ]) {
    requireCondition(board.includes(token), `BOARD_TOKEN_MISSING:${token}`);
  }
}

function validatePlaywrightSpec() {
  const spec = read(path.join(ROOT, "tests", "playwright", "310_phase4_exit_board.spec.ts"));
  for (const token of [
    "310-phase4-exit-board-go-with-constraints.png",
    "310-phase4-exit-board-approved.png",
    "310-phase4-exit-board-withheld.png",
    "310-phase4-exit-board-aria-snapshots.json",
    "CarryForwardBoundaryMap",
    "ConformanceLadder",
  ]) {
    requireCondition(spec.includes(token), `PLAYWRIGHT_TOKEN_MISSING:${token}`);
  }
}

function main() {
  for (const filePath of REQUIRED_FILES) {
    requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
  }

  validateChecklist();
  validatePackageScript();
  validateDocs();
  validateExternalNotes();
  validateDecisionJson();
  validateConformanceCsv();
  validateFreshnessCsv();
  validateOpenIssues();
  validateBoard();
  validatePlaywrightSpec();

  console.log("validate_310_phase4_exit_gate: ok");
}

main();
