import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(
  ROOT,
  "docs",
  "frontend",
  "214_communications_timeline_visibility_atlas.html",
);
const CONTRACT_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "214_communications_timeline_contract.json",
);
const MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "214_preview_visibility_and_placeholder_matrix.csv",
);
const CASES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "214_receipt_callback_reminder_alignment_cases.json",
);
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const communicationsTimelineAtlasCoverage = [
  "Conversation_Braid_Atlas",
  "MessageListRowStates",
  "ClusterShellStates",
  "CallbackCardStates",
  "ReminderNoticeStates",
  "PlaceholderStepUpBoards",
  "TupleAlignmentDiagrams",
  "DeliveryFailureDisputeBoards",
  "ReceiptSettlementBoard",
  "ARIA snapshots for chronology boards",
  "keyboard tabs, disclosures, and anchors",
  "accessibility headings, lists, timestamps, landmarks",
  "reduced motion",
  "mobile viewport",
];

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
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
  for (const filePath of [HTML_PATH, CONTRACT_PATH, MATRIX_PATH, CASES_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing task 214 artifact ${filePath}`);
  }
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
  const cases = JSON.parse(fs.readFileSync(CASES_PATH, "utf8"));
  assertCondition(html.includes("Conversation_Braid_Atlas"), "Atlas visual mode missing.");
  assertCondition(
    contract.visualMode === "Conversation_Braid_Atlas",
    "Contract visual mode drifted.",
  );
  assertCondition(matrix.length >= 10, "Preview visibility matrix needs all critical states.");
  assertCondition(cases.cases.length >= 6, "Receipt/callback/reminder cases missing.");
  return { contract, matrix, cases };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/214_communications_timeline_visibility_atlas.html";
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
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(buffer);
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind local task 214 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/214_communications_timeline_visibility_atlas.html`,
      });
    });
  });
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function openAtlas(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Conversation_Braid_Atlas']").waitFor();
}

async function screenshot(page, relativePath) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(ROOT, relativePath), fullPage: true });
}

async function assertNoOverflow(page, allowance = 2) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assertCondition(overflow <= allowance, `Page has horizontal overflow of ${overflow}px.`);
}

async function selectScenario(page, scenarioId) {
  await page.locator(`[data-scenario-button='${scenarioId}']`).click();
  await page.waitForFunction((id) => document.documentElement.dataset.scenario === id, scenarioId);
}

async function assertRegions(page) {
  await page.locator("[data-testid='ClusterShellStates']").waitFor();
  await page.locator("[data-testid='TupleAlignmentDiagrams']").waitFor();
  const scenarioRegions = [
    ["overview", "MessageListRowStates"],
    ["placeholders", "PlaceholderStepUpBoards"],
    ["tuple", "TupleAlignmentDiagrams"],
    ["callback", "CallbackCardStates"],
    ["receipts", "ReceiptSettlementBoard"],
    ["failures", "DeliveryFailureDisputeBoards"],
  ];
  for (const [scenarioId, testId] of scenarioRegions) {
    await selectScenario(page, scenarioId);
    await page.locator("section[aria-label]").first().waitFor();
    assertCondition(
      (await page.locator(`[data-testid='${testId}']`).count()) >= 1,
      `Missing ${testId}`,
    );
  }
}

async function assertScreenshots(page) {
  const shots = [
    ["overview", "output/playwright/214-overview.png"],
    ["placeholders", "output/playwright/214-placeholders.png"],
    ["tuple", "output/playwright/214-tuple.png"],
    ["callback", "output/playwright/214-callback.png"],
    ["receipts", "output/playwright/214-receipts.png"],
    ["failures", "output/playwright/214-failures.png"],
  ];
  for (const [scenarioId, outputPath] of shots) {
    await selectScenario(page, scenarioId);
    await assertNoOverflow(page);
    await screenshot(page, outputPath);
  }
}

async function assertAriaSnapshots(page) {
  await selectScenario(page, "overview");
  const chronologySnapshot = await page.locator("[data-testid='ChronologyBoard']").ariaSnapshot();
  for (const token of [
    "PatientCommunicationsTimelineProjection",
    "PatientConversationPreviewDigest",
    "awaiting_reply",
  ]) {
    assertCondition(chronologySnapshot.includes(token), `Chronology ARIA missing ${token}`);
  }
  await selectScenario(page, "failures");
  const failureSnapshot = await page
    .locator("[data-testid='DeliveryFailureDisputeBoards']")
    .ariaSnapshot();
  for (const token of ["PORTAL_214_DELIVERY_FAILURE_VISIBLE", "PORTAL_214_DISPUTE_VISIBLE"]) {
    assertCondition(failureSnapshot.includes(token), `Failure ARIA missing ${token}`);
  }
  await selectScenario(page, "tuple");
  const tupleSnapshot = await page
    .locator("[data-testid='ChronologyBoard'] [data-testid='TupleAlignmentDiagrams']")
    .ariaSnapshot();
  for (const token of ["threadTupleHash", "monotoneRevision", "summarySafetyTier"]) {
    assertCondition(tupleSnapshot.includes(token), `Tuple ARIA missing ${token}`);
  }
}

async function assertKeyboardTabsDisclosuresAnchors(page) {
  await page.locator("[data-scenario-button='overview']").focus();
  await page.keyboard.press("ArrowRight");
  assertCondition(
    (await page.locator("[data-scenario-button='placeholders']").getAttribute("aria-selected")) ===
      "true",
    "ArrowRight did not move scenario selection.",
  );
  await page.locator("summary").first().focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await selectScenario(page, "overview");
  await page.locator("a.anchor").first().focus();
  assertCondition(
    (await page.evaluate(() => document.activeElement?.classList.contains("anchor"))) === true,
    "Timeline anchor was not keyboard focusable.",
  );
}

async function assertAccessibility(page) {
  assertCondition((await page.locator("main").count()) === 1, "Expected one main landmark.");
  for (const label of [
    "Communications timeline atlas",
    "Conversation braid scenarios",
    "Chronology board",
    "Projection tuple and controls",
    "Tuple alignment diagrams",
  ]) {
    assertCondition(
      (await page.locator(`[aria-label='${label}']`).count()) >= 1,
      `Missing aria-label ${label}`,
    );
  }
  assertCondition((await page.locator("time[datetime]").count()) >= 3, "Missing timestamps.");
  assertCondition((await page.locator("dl dt").count()) >= 7, "Missing description-list terms.");
  await selectScenario(page, "receipts");
  assertCondition((await page.locator("table th").count()) >= 3, "Missing table headers.");
}

async function assertReducedMotionAndMobile(browser, url) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 840 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await openAtlas(page, url);
  await selectScenario(page, "placeholders");
  await assertNoOverflow(page);
  await screenshot(page, "output/playwright/214-mobile-placeholders.png");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await selectScenario(page, "failures");
  await screenshot(page, "output/playwright/214-reduced-motion.png");
  await context.close();
}

export async function run() {
  getExpected();
  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 940 } });
    await openAtlas(page, url);
    await assertRegions(page);
    await assertScreenshots(page);
    await assertAriaSnapshots(page);
    await assertKeyboardTabsDisclosuresAnchors(page);
    await assertAccessibility(page);
    await assertReducedMotionAndMobile(browser, url);
    await page.close();
  } finally {
    await browser.close();
    await closeServer(server);
  }
  return true;
}

if (process.argv.includes("--run")) {
  run()
    .then(() => {
      console.log("[214-communications-timeline-atlas] validation passed");
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else {
  getExpected();
  console.log(communicationsTimelineAtlasCoverage.join("\n"));
}
