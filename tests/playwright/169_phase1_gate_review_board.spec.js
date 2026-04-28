import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "governance", "169_phase1_gate_review_board.html");
const DECISION_PATH = path.join(ROOT, "data", "analysis", "169_phase1_exit_gate_decision.json");
const ROWS_PATH = path.join(ROOT, "data", "analysis", "169_phase1_conformance_rows.json");
const EVIDENCE_PATH = path.join(ROOT, "data", "analysis", "169_phase1_evidence_manifest.csv");
const OPEN_ITEMS_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "169_phase1_open_items_and_phase2_carry_forward.json",
);

export const phase1GateReviewBoardCoverage = [
  "family selection sync",
  "verdict rendering",
  "blocked/open-item visibility",
  "keyboard navigation and landmarks",
  "reducedMotion equivalence",
  "diagram/table parity",
  "Red_Flag_Gate_Review_Board",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

function getExpected() {
  for (const filePath of [HTML_PATH, DECISION_PATH, ROWS_PATH, EVIDENCE_PATH, OPEN_ITEMS_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing seq_169 artifact ${filePath}`);
  }
  const decision = JSON.parse(fs.readFileSync(DECISION_PATH, "utf8"));
  const rows = JSON.parse(fs.readFileSync(ROWS_PATH, "utf8"));
  const evidence = parseCsv(fs.readFileSync(EVIDENCE_PATH, "utf8"));
  const openItems = JSON.parse(fs.readFileSync(OPEN_ITEMS_PATH, "utf8"));
  const performanceRow = rows.find(
    (row) => row.capabilityFamilyId === "performance_resilience_proof",
  );
  const notificationRow = rows.find(
    (row) => row.capabilityFamilyId === "confirmation_notification_truth",
  );
  const liveProviderItem = openItems.find(
    (item) => item.itemId === "OI_169_LIVE_PROVIDER_ONBOARDING_AND_DELIVERY_EVIDENCE",
  );
  assertCondition(performanceRow, "Missing performance resilience row.");
  assertCondition(notificationRow, "Missing notification truth row.");
  assertCondition(liveProviderItem, "Missing live provider carry-forward item.");
  return {
    decision,
    rows,
    evidence,
    openItems,
    performanceRow,
    notificationRow,
    liveProviderItem,
    performanceEvidenceCount: evidence.filter(
      (row) => row.capability_family_id === performanceRow.capabilityFamilyId,
    ).length,
    notificationEvidenceCount: evidence.filter(
      (row) => row.capability_family_id === notificationRow.capabilityFamilyId,
    ).length,
  };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/governance/169_phase1_gate_review_board.html";
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
          ? "text/html; charset=utf-8"
          : extension === ".json"
            ? "application/json; charset=utf-8"
            : extension === ".csv"
              ? "text/csv; charset=utf-8"
              : "text/plain; charset=utf-8";
      response.writeHead(200, { "Content-Type": type });
      response.end(buffer);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind local seq_169 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/governance/169_phase1_gate_review_board.html`,
      });
    });
  });
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function openBoard(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Red_Flag_Gate_Review_Board']").waitFor();
}

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assertCondition(overflow <= 1, `Page has horizontal overflow of ${overflow}px.`);
}

async function assertBoardShell(page, expected) {
  for (const testId of [
    "Red_Flag_Gate_Review_Board",
    "board-masthead",
    "gate_dossier_mark",
    "decision-verdict",
    "family-rail",
    "phase-braid",
    "phase-braid-table",
    "conformance-score-ladder",
    "conformance-score-table",
    "open-items-boundary-map",
    "open-items-table",
    "evidence-manifest-table",
    "parity-table",
    "inspector",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }
  assertCondition(
    (await page.locator("[data-testid='decision-verdict']").innerText()).trim() ===
      expected.decision.gateVerdict,
    "Gate verdict rendering drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='approved-count']").innerText()).trim()) ===
      expected.decision.summary.approvedRowCount,
    "Approved row count rendering drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid='family-list'] button").count()) === expected.rows.length,
    "Family rail count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid='conformance-score-table'] tbody tr").count()) ===
      expected.rows.length,
    "Conformance table lost parity with families.",
  );
  assertCondition(
    (await page.locator("[data-testid='open-items-table'] tbody tr").count()) ===
      expected.openItems.length,
    "Open item table lost parity with carry-forward data.",
  );
}

async function assertFamilySelectionSync(page, expected) {
  await page
    .locator(`[data-testid='family-button-${expected.performanceRow.capabilityFamilyId}']`)
    .click();
  const inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes(expected.performanceRow.capabilityLabel),
    "Family selection did not sync the inspector title.",
  );
  assertCondition(
    inspectorText.includes(String(expected.performanceEvidenceCount)),
    "Family selection did not sync the inspector evidence count.",
  );
  assertCondition(
    (await page.locator("[data-testid='evidence-manifest-table'] tbody tr").count()) ===
      expected.performanceEvidenceCount,
    "Family selection did not sync the evidence table.",
  );

  await page
    .locator(`[data-testid='ladder-row-${expected.notificationRow.capabilityFamilyId}']`)
    .focus();
  await page.keyboard.press("Enter");
  const keyboardInspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    keyboardInspectorText.includes(expected.notificationRow.capabilityLabel),
    "Keyboard navigation did not activate the selected ladder row.",
  );
  assertCondition(
    keyboardInspectorText.includes(String(expected.notificationEvidenceCount)),
    "Keyboard selection did not sync evidence count.",
  );
}

async function assertOpenItemVisibility(page, expected) {
  await page
    .locator(`[data-testid='open-item-button-${expected.liveProviderItem.itemId}']`)
    .click();
  const inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes(expected.liveProviderItem.title),
    "Open item selection did not sync the inspector.",
  );
  assertCondition(
    inspectorText.toLowerCase().includes("deferred_non_blocking"),
    "Open item selection did not expose deferred_non_blocking state.",
  );
  assertCondition(
    inspectorText.includes(expected.liveProviderItem.whyNonBlockingNow),
    "Open item selection did not expose non-blocking rationale.",
  );
  assertCondition(
    (await page.locator("[data-testid='blocker-count']").innerText()).trim() === "0",
    "Approved gate should render zero blockers.",
  );
}

async function assertDiagramTableParity(page) {
  const parityText = await page.locator("[data-testid='parity-table']").innerText();
  for (const [visual, table] of [
    ["phase-braid", "phase-braid-table"],
    ["conformance-score-ladder", "conformance-score-table"],
    ["open-items-boundary-map", "open-items-table"],
    ["gate_dossier_mark", "decision-verdict"],
  ]) {
    assertCondition(parityText.includes(visual), `${visual} missing from parity table.`);
    assertCondition(parityText.includes(table), `${table} missing from parity table.`);
  }
}

async function assertReducedMotion(browser, url) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    await openBoard(page, url);
    await assertDiagramTableParity(page);
    const duration = await page
      .locator(".ladder-bar span")
      .first()
      .evaluate((element) => getComputedStyle(element).animationDuration);
    assertCondition(
      Number.parseFloat(duration) <= 1,
      `Reduced motion did not collapse ladder animation: ${duration}`,
    );
  } finally {
    await context.close();
  }
}

export async function run() {
  const expected = getExpected();
  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1040 } });
    await openBoard(page, url);
    await assertNoOverflow(page);
    await assertBoardShell(page, expected);
    await assertFamilySelectionSync(page, expected);
    await assertOpenItemVisibility(page, expected);
    await assertDiagramTableParity(page);
    await page.locator("#gate-main").focus();
    assertCondition(
      (await page.evaluate(() => document.activeElement?.id)) === "gate-main",
      "Main landmark did not accept focus.",
    );
    await page.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openBoard(mobile, url);
    await assertNoOverflow(mobile);
    await mobile.close();

    await assertReducedMotion(browser, url);
  } finally {
    await browser.close();
    await closeServer(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  console.log("169_phase1_gate_review_board.spec.js: syntax ok");
}
