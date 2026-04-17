import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "governance", "138_phase0_gate_review_board.html");
const DECISION_PATH = path.join(ROOT, "data", "analysis", "138_phase0_exit_gate_decision.json");
const ROWS_PATH = path.join(ROOT, "data", "analysis", "138_phase0_conformance_rows.json");
const OPEN_ITEMS_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "138_phase0_open_items_and_deferred_live_provider_work.json",
);
const DECISION_DOC_PATH = path.join(ROOT, "docs", "governance", "138_phase0_go_no_go_decision.md");
const BOUNDARY_DOC_PATH = path.join(
  ROOT,
  "docs",
  "governance",
  "138_phase0_mock_now_vs_actual_later_boundary.md",
);

export const phase0GateReviewBoardCoverage = [
  "filter by capability family and decision state",
  "selection sync across heat strip, inspector, evidence and open-item tables",
  "keyboard navigation and landmarks",
  "responsive layout and reduced-motion equivalence",
  "heat strip/table parity and evidence timeline/table parity",
  "simulator-first boundary and deferred live-provider notes",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

function extractEmbeddedJson(html, scriptId) {
  const match = html.match(
    new RegExp(
      `<script id="${scriptId}" type="application/json">([\\s\\S]*?)<\\/script>`,
    ),
  );
  assertCondition(match, `Missing embedded JSON script: ${scriptId}`);
  return JSON.parse(match[1]);
}

function getExpected() {
  assertCondition(fs.existsSync(HTML_PATH), "seq_138 gate review board HTML is missing.");
  assertCondition(fs.existsSync(DECISION_PATH), "seq_138 decision export is missing.");
  assertCondition(fs.existsSync(ROWS_PATH), "seq_138 row export is missing.");
  assertCondition(fs.existsSync(OPEN_ITEMS_PATH), "seq_138 open-item export is missing.");

  const html = fs.readFileSync(HTML_PATH, "utf8");
  const decision = JSON.parse(fs.readFileSync(DECISION_PATH, "utf8"));
  const rows = JSON.parse(fs.readFileSync(ROWS_PATH, "utf8"));
  const openItems = JSON.parse(fs.readFileSync(OPEN_ITEMS_PATH, "utf8"));
  const evidenceRows = extractEmbeddedJson(html, "evidence-json");
  const decisionDoc = fs.readFileSync(DECISION_DOC_PATH, "utf8");
  const boundaryDoc = fs.readFileSync(BOUNDARY_DOC_PATH, "utf8");

  const runtimePublicationRow = rows.find(
    (row) => row.rowId === "P0R_138_RUNTIME_PUBLICATION_AND_FREEZE_CONTROL",
  );
  const canonicalRow = rows.find(
    (row) => row.rowId === "P0R_138_CANONICAL_REQUEST_INTAKE_BACKBONE",
  );
  const shellRow = rows.find(
    (row) => row.rowId === "P0R_138_SHELL_AND_CONTINUITY_INFRASTRUCTURE",
  );
  const nextRowAfterCanonical = rows[1];

  assertCondition(runtimePublicationRow, "Missing runtime/publication row.");
  assertCondition(canonicalRow, "Missing canonical request-intake row.");
    assertCondition(shellRow, "Missing shell/continuity row.");
    assertCondition(nextRowAfterCanonical, "Missing the next visible row after canonical.");

  return {
    decision,
    rows,
    openItems,
    evidenceRows,
    runtimePublicationRow,
    canonicalRow,
    shellRow,
    nextRowAfterCanonical,
    runtimePublicationEvidenceCount: evidenceRows.filter(
      (row) =>
        row.capability_family_id === runtimePublicationRow.capabilityFamilyId,
    ).length,
    runtimePublicationOpenItemCount: openItems.filter((item) =>
      runtimePublicationRow.openItemRefs.includes(item.itemId),
    ).length,
    canonicalEvidenceCount: evidenceRows.filter(
      (row) => row.capability_family_id === canonicalRow.capabilityFamilyId,
    ).length,
    decisionDoc,
    boundaryDoc,
  };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/governance/138_phase0_gate_review_board.html";
    }
    const filePath = path.join(rootDir, pathname);
    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end("forbidden");
      return;
    }
    fs.readFile(filePath, (error, buffer) => {
      if (error) {
        response.writeHead(404);
        response.end("not found");
        return;
      }
      const extension = path.extname(filePath);
      const type =
        extension === ".html"
          ? "text/html"
          : extension === ".json"
            ? "application/json"
            : extension === ".csv"
              ? "text/csv"
              : "text/plain";
      response.writeHead(200, { "Content-Type": type });
      response.end(buffer);
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind local seq_138 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/governance/138_phase0_gate_review_board.html`,
      });
    });
  });
}

export async function run() {
  const expected = getExpected();

  assertCondition(
    expected.decisionDoc.includes("go_with_constraints") &&
      expected.decisionDoc.includes("not live-provider readiness"),
    "Decision doc lost the constrained non-live approval boundary.",
  );
  assertCondition(
    expected.boundaryDoc.includes("Mock Now Execution") &&
      expected.boundaryDoc.includes("Actual Production Strategy Later"),
    "Boundary doc lost the mock-now versus actual-later split.",
  );

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1520, height: 1180 } });
    await page.goto(url, { waitUntil: "networkidle" });

    for (const testId of [
      "foundation-gate-board",
      "board-masthead",
      "gate-verdict",
      "filter-rail",
      "suite-strip",
      "suite-table",
      "heat-strip",
      "scorecard-table",
      "evidence-timeline",
      "evidence-table",
      "open-items-table",
      "inspector",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    assertCondition(
      (await page.locator("[data-testid='gate-verdict']").innerText()).trim() ===
        expected.decision.gateVerdict,
      "seq_138 gate verdict drifted.",
    );
    assertCondition(
      Number((await page.locator("[data-testid='approved-row-count']").innerText()).trim()) ===
        expected.decision.summary.approved_row_count,
      "Approved row count drifted.",
    );
    assertCondition(
      Number((await page.locator("[data-testid='constrained-row-count']").innerText()).trim()) ===
        expected.decision.summary.constrained_row_count,
      "Constrained row count drifted.",
    );
    assertCondition(
      Number((await page.locator("[data-testid='blocked-row-count']").innerText()).trim()) ===
        expected.decision.summary.blocked_row_count,
      "Blocked row count drifted.",
    );

    assertCondition(
      (await page.locator("[data-testid='suite-strip'] .suite-pill").count()) ===
        expected.decision.summary.mandatory_suite_count,
      "Suite strip count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='suite-table'] tbody tr").count()) ===
        expected.decision.summary.mandatory_suite_count,
      "Suite table count drifted.",
    );

    assertCondition(
      (await page.locator("[data-testid='heat-strip'] .capability-card").count()) === expected.rows.length,
      "Heat strip should render every capability row by default.",
    );
    assertCondition(
      (await page.locator("[data-testid='scorecard-table'] tbody tr").count()) === expected.rows.length,
      "Scorecard table parity drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='evidence-timeline'] .timeline-card").count()) ===
        expected.canonicalEvidenceCount,
      "Evidence timeline default selection drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='evidence-table'] tbody tr").count()) ===
        expected.canonicalEvidenceCount,
      "Evidence table parity drifted for the default selection.",
    );
    assertCondition(
      (await page.locator("[data-testid='open-items-table'] tbody tr").count()) === 0,
      "The canonical default row must not render deferred live-provider items.",
    );

    await page.locator("[data-testid='filter-status']").selectOption("constrained");
    assertCondition(
      (await page.locator("[data-testid='heat-strip'] .capability-card").count()) ===
        expected.decision.summary.constrained_row_count,
      "Decision-state filtering no longer narrows the heat strip to constrained rows.",
    );

    await page
      .locator("[data-testid='filter-family']")
      .selectOption(expected.runtimePublicationRow.capabilityFamilyId);
    assertCondition(
      (await page.locator("[data-testid='heat-strip'] .capability-card").count()) === 1,
      "Capability-family filtering should isolate the runtime/publication row.",
    );
    assertCondition(
      (await page.locator("[data-testid='scorecard-table'] tbody tr").count()) === 1,
      "Filtered scorecard table lost parity with the heat strip.",
    );

    await page
      .locator(`[data-testid='scorecard-row-${expected.runtimePublicationRow.rowId}']`)
      .click();
    const inspectorAfterSelection = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorAfterSelection.includes(expected.runtimePublicationRow.capabilityLabel) &&
        inspectorAfterSelection.includes("live surface truth remains intentionally withheld"),
      "Selecting the runtime/publication row did not synchronize the inspector.",
    );
    assertCondition(
      (await page
        .locator(`[data-testid='capability-card-${expected.runtimePublicationRow.rowId}']`)
        .getAttribute("data-selected")) === "true",
      "Heat-strip selection did not stay synchronized after table selection.",
    );
    assertCondition(
      (await page.locator("[data-testid='evidence-timeline'] .timeline-card").count()) ===
        expected.runtimePublicationEvidenceCount,
      "Evidence timeline no longer tracks the selected capability family.",
    );
    assertCondition(
      (await page.locator("[data-testid='evidence-table'] tbody tr").count()) ===
        expected.runtimePublicationEvidenceCount,
      "Evidence table lost parity with the timeline for the selected row.",
    );
    assertCondition(
      (await page.locator("[data-testid='open-items-table'] tbody tr").count()) ===
        expected.runtimePublicationOpenItemCount,
      "Open-item table no longer tracks the selected capability family.",
    );
    const evidenceText = await page.locator("[data-testid='evidence-table']").innerText();
    assertCondition(
      evidenceText.includes("release_candidate_tuple.json") &&
        evidenceText.includes("surface_authority_verdicts.json"),
      "Runtime/publication evidence refs drifted out of the selected evidence table.",
    );

    await page.locator("[data-testid='filter-status']").selectOption("all");
    await page.locator("[data-testid='filter-family']").selectOption("all");
    await page
      .locator(`[data-testid='capability-card-${expected.canonicalRow.rowId}']`)
      .focus();
    await page.keyboard.press("ArrowDown");
    assertCondition(
      (await page
        .locator(`[data-testid='capability-card-${expected.runtimePublicationRow.rowId}']`)
        .count()) === 1,
      "Expected runtime/publication card to remain rendered after clearing filters.",
    );
    assertCondition(
      (await page.locator(`[data-testid='capability-card-${expected.nextRowAfterCanonical.rowId}']`).getAttribute("data-selected")) ===
        "true",
      "Arrow-key navigation no longer advances selection across the capability cards.",
    );
    const inspectorAfterKeyboard = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorAfterKeyboard.includes(expected.nextRowAfterCanonical.capabilityLabel),
      "Keyboard navigation did not synchronize the inspector.",
    );

    assertCondition((await page.locator("header[data-testid='board-masthead']").count()) === 1, "Header landmark is missing.");
    assertCondition((await page.locator("nav[data-testid='filter-rail']").count()) === 1, "Navigation landmark is missing.");
    assertCondition((await page.locator("main[data-testid='board-canvas']").count()) === 1, "Main landmark is missing.");
    assertCondition((await page.locator("aside[data-testid='inspector']").count()) === 1, "Inspector landmark is missing.");

    await page.setViewportSize({ width: 980, height: 1120 });
    assertCondition(
      await page.locator("[data-testid='filter-rail']").isVisible(),
      "Filter rail disappeared on narrow layout.",
    );
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared on narrow layout.",
    );
    const widthSafe = await page.evaluate(() => document.documentElement.scrollWidth <= 1000);
    assertCondition(widthSafe, "Responsive layout overflowed horizontally.");

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 920 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      assertCondition(
        (await motionPage.locator("body").getAttribute("data-reduced-motion")) === "true",
        "Reduced-motion posture did not activate.",
      );
      assertCondition(
        (await motionPage.locator("[data-testid='heat-strip'] .capability-card").count()) === expected.rows.length,
        "Reduced-motion rendering changed heat-strip parity.",
      );
      assertCondition(
        (await motionPage.locator("[data-testid='suite-table'] tbody tr").count()) ===
          expected.decision.summary.mandatory_suite_count,
        "Reduced-motion rendering changed suite table parity.",
      );
    } finally {
      await motionPage.close();
    }
  } finally {
    await browser.close();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
