import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const HTML_PATH = path.join(ROOT, "docs", "frontend", "225_portal_support_exit_board.html");
const DECISION_PATH = path.join(ROOT, "data", "analysis", "225_crosscutting_exit_gate_decision.json");
const ROWS_PATH = path.join(ROOT, "data", "analysis", "225_conformance_rows.json");
const EVIDENCE_PATH = path.join(ROOT, "data", "analysis", "225_evidence_manifest.csv");
const OPEN_ITEMS_PATH = path.join(ROOT, "data", "analysis", "225_open_items_and_phase3_carry_forward.json");
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const portalSupportExitBoardCoverage = [
  "Portal_Support_Baseline_Exit_Board",
  "VerdictBand",
  "CapabilityConformanceLadder",
  "EvidenceManifestPanel",
  "PatientSupportBoundaryMap",
  "OpenItemsCarryForwardTable",
  "approved state screenshot",
  "go-with-constraints state screenshot",
  "withheld state screenshot",
  "ARIA snapshots for the scorecard and boundary map",
  "keyboard accessibility",
  "reduced-motion equivalence",
  "high-zoom overflow checks",
  "board-to-decision parity",
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
    if (!process.argv.includes("--run")) {
      return null;
    }
    throw new Error("This spec requires the `playwright` package when run with --run.");
  }
}

function loadExpected() {
  for (const filePath of [HTML_PATH, DECISION_PATH, ROWS_PATH, EVIDENCE_PATH, OPEN_ITEMS_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing seq_225 artifact ${filePath}`);
  }
  return {
    decision: JSON.parse(fs.readFileSync(DECISION_PATH, "utf8")),
    rows: JSON.parse(fs.readFileSync(ROWS_PATH, "utf8")),
    evidence: parseCsv(fs.readFileSync(EVIDENCE_PATH, "utf8")),
    openItems: JSON.parse(fs.readFileSync(OPEN_ITEMS_PATH, "utf8")),
  };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/225_portal_support_exit_board.html";
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
        reject(new Error("Unable to bind local seq_225 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/225_portal_support_exit_board.html`,
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
  await page.locator("[data-testid='Portal_Support_Baseline_Exit_Board']").waitFor();
}

async function screenshot(page, relativePath) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(ROOT, relativePath), fullPage: true });
}

async function assertNoOverflow(page, allowance = 2) {
  const overflow = await page.evaluate(() => {
    const width = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);
    return width - window.innerWidth;
  });
  assertCondition(overflow <= allowance, `Page has horizontal overflow of ${overflow}px.`);
}

async function assertBoardAgreement(page, expected) {
  for (const testId of [
    "Portal_Support_Baseline_Exit_Board",
    "VerdictBand",
    "CapabilityConformanceLadder",
    "EvidenceManifestPanel",
    "PatientSupportBoundaryMap",
    "OpenItemsCarryForwardTable",
    "conformance-score-table",
    "boundary-map-table",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }

  assertCondition(
    (await page.locator("[data-testid='decision-verdict']").innerText()).trim() ===
      expected.decision.gateVerdict,
    "Default board verdict does not match decision JSON.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='approved-count']").innerText()).trim()) ===
      expected.decision.summary.approvedRowCount,
    "Approved count drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='constrained-count']").innerText()).trim()) ===
      expected.decision.summary.goWithConstraintsRowCount,
    "Constrained count drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='withheld-count']").innerText()).trim()) ===
      expected.decision.summary.withheldRowCount,
    "Withheld count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid='family-list'] button").count()) === expected.rows.length,
    "Conformance ladder row count drifted.",
  );
}

async function assertSelectionSync(page, expected) {
  const targetRow = expected.rows.find(
    (row) => row.capabilityFamilyId === "support_ticket_shell_and_omnichannel_timeline",
  );
  assertCondition(targetRow, "Expected support ticket row.");
  await page.locator(`[data-testid='family-button-${targetRow.capabilityFamilyId}']`).click();
  const inspector = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(inspector.includes(targetRow.capabilityLabel), "Inspector did not update for row selection.");
  assertCondition(inspector.includes(targetRow.owningTasks[0]), "Inspector lost owning task context.");

  const expectedEvidenceCount = expected.evidence.filter(
    (entry) => entry.capability_family_id === targetRow.capabilityFamilyId,
  ).length;
  assertCondition(
    Number((await page.locator("[data-testid='selected-evidence-count']").innerText()).trim()) ===
      expectedEvidenceCount,
    "Selected evidence count drifted.",
  );

  const openItem = expected.openItems.find(
    (item) => item.itemId === "OI_225_PHASE3_TRIAGE_WORKSPACE_CONTRACT_FREEZE",
  );
  assertCondition(openItem, "Expected phase 3 carry-forward item.");
  await page.locator(`[data-testid='open-item-button-${openItem.itemId}']`).click();
  const updatedInspector = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(updatedInspector.includes(openItem.title), "Inspector did not update for boundary selection.");
  assertCondition(
    updatedInspector.includes("seq_226"),
    "Boundary selection lost next owning task context.",
  );
}

async function assertStateScreenshots(page) {
  const states = [
    ["Approved state", "225-approved-state.png", "approved"],
    ["Go-with-constraints state", "225-go-with-constraints-state.png", "go_with_constraints"],
    ["Withheld state", "225-withheld-state.png", "withheld"],
  ];
  for (const [buttonName, fileName, state] of states) {
    await page.getByRole("button", { name: buttonName }).click();
    assertCondition(
      (await page.locator("[data-testid='decision-verdict']").innerText()).trim() === state,
      `${state} preview did not render.`,
    );
    await screenshot(page, `output/playwright/${fileName}`);
  }
  await page.getByRole("button", { name: "Approved state" }).click();
}

async function assertAriaSnapshots(page) {
  const ladderSnapshot = await page.locator("[data-testid='CapabilityConformanceLadder']").ariaSnapshot();
  for (const token of [
    "Patient home and requests",
    "Support ticket shell and omnichannel timeline",
    "Continuity and parity test evidence",
    "approved",
  ]) {
    assertCondition(ladderSnapshot.includes(token), `Scorecard ariaSnapshot missing ${token}.`);
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, "225-scorecard-aria.txt"), ladderSnapshot);

  const boundarySnapshot = await page.locator("[data-testid='PatientSupportBoundaryMap']").ariaSnapshot();
  for (const token of [
    "Freeze the Phase 3 triage workspace state model",
    "Replay the baseline against credentialled live environments",
    "future_live_boundary",
  ]) {
    assertCondition(boundarySnapshot.includes(token), `Boundary ariaSnapshot missing ${token}.`);
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, "225-boundary-aria.txt"), boundarySnapshot);
}

async function assertKeyboardAccessibility(page) {
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const focusedTestId = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
  assertCondition(
    focusedTestId === "family-button-patient_home_and_requests",
    `Expected first family button to receive focus, got ${focusedTestId || "none"}.`,
  );
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  const inspector = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspector.includes("Request detail and typed patient action routing"),
    "Keyboard activation did not select the next ladder row.",
  );
}

async function assertReducedMotion(page, url, playwright) {
  const context = await playwright.chromium.launchPersistentContext("", {
    headless: true,
    reducedMotion: "reduce",
    viewport: { width: 1440, height: 1200 },
  });
  try {
    const reducedPage = context.pages()[0];
    await openBoard(reducedPage, url);
    assertCondition(
      (await reducedPage.locator("[data-testid='family-list'] button").count()) > 0,
      "Reduced-motion board lost ladder content.",
    );
    await screenshot(reducedPage, "output/playwright/225-reduced-motion-state.png");
  } finally {
    await context.close();
  }
}

async function assertHighZoom(page) {
  await page.evaluate(() => {
    document.body.style.zoom = "1.75";
  });
  await assertNoOverflow(page);
  await screenshot(page, "output/playwright/225-high-zoom-state.png");
}

export async function runPortalSupportExitBoardSpec() {
  const playwright = await importPlaywright();
  if (!playwright) {
    return { status: "loaded" };
  }

  const expected = loadExpected();
  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    await openBoard(page, url);
    await assertNoOverflow(page);
    await assertBoardAgreement(page, expected);
    await assertSelectionSync(page, expected);
    await assertStateScreenshots(page);
    await assertAriaSnapshots(page);
    await assertKeyboardAccessibility(page);
    await assertHighZoom(page);
    await assertReducedMotion(page, url, playwright);

    await page.setViewportSize({ width: 390, height: 844 });
    await openBoard(page, url);
    await assertNoOverflow(page);
    await screenshot(page, "output/playwright/225-mobile-state.png");

    return { status: "passed" };
  } finally {
    await browser.close();
    await closeServer(server);
  }
}

if (process.argv.includes("--run")) {
  runPortalSupportExitBoardSpec()
    .then((result) => {
      if (result.status !== "passed") {
        throw new Error(`Unexpected seq_225 result: ${result.status}`);
      }
      console.log("[225] Portal/support exit board proof passed.");
    })
    .catch((error) => {
      console.error("[225] Portal/support exit board proof failed.");
      console.error(error);
      process.exitCode = 1;
    });
}
