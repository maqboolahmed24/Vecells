import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "frontend", "209_crosscutting_gate_board.html");
const GATE_PATH = path.join(ROOT, "data", "analysis", "209_crosscutting_parallel_gate.json");
const REGISTRY_PATH = path.join(ROOT, "data", "analysis", "209_crosscutting_shared_interface_seams.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "209_crosscutting_track_matrix.csv");
const MOCK_ACTUAL_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "209_crosscutting_mock_now_vs_actual_later_matrix.csv",
);
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const crosscuttingGateBoardCoverage = [
  "Patient_Account_Support_Gate_Board",
  "TrackLaneGrid",
  "SharedSeamRibbon",
  "MergeGateStrip",
  "OwnershipConflictPanel",
  "MockVsActualBoundaryMap",
  "desktop screenshot",
  "lane-filter mobile screenshot",
  "seam detail state screenshot",
  "merge-gate detail state screenshot",
  "ARIA snapshots for lane grid and seam ribbon",
  "keyboard navigation",
  "reducedMotion",
  "zoom",
  "board and registry parity",
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
  for (const filePath of [HTML_PATH, GATE_PATH, REGISTRY_PATH, MATRIX_PATH, MOCK_ACTUAL_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing seq_209 artifact ${filePath}`);
  }
  const gate = JSON.parse(fs.readFileSync(GATE_PATH, "utf8"));
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
  const mockActual = parseCsv(fs.readFileSync(MOCK_ACTUAL_PATH, "utf8"));
  assertCondition(gate.visualMode === "Patient_Account_Support_Gate_Board", "Visual mode drifted.");
  assertCondition(matrix.length === 13, "Expected 13 task rows.");
  assertCondition(registry.interfaces.length === gate.summary.sharedInterfaceCount, "Registry count drifted.");
  return { gate, registry, matrix, mockActual };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/209_crosscutting_gate_board.html";
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
        reject(new Error("Unable to bind local seq_209 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/209_crosscutting_gate_board.html`,
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
  await page.locator("[data-testid='Patient_Account_Support_Gate_Board']").waitFor();
}

async function screenshot(page, relativePath) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(ROOT, relativePath), fullPage: true });
}

async function assertNoOverflow(page, allowance = 1) {
  const overflow = await page.evaluate(() => {
    const width = document.documentElement.scrollWidth;
    return width - window.innerWidth;
  });
  assertCondition(overflow <= allowance, `Page has horizontal overflow of ${overflow}px.`);
}

async function assertBoardAgreement(page, expected) {
  for (const testId of [
    "Patient_Account_Support_Gate_Board",
    "TrackLaneGrid",
    "SharedSeamRibbon",
    "MergeGateStrip",
    "OwnershipConflictPanel",
    "MockVsActualBoundaryMap",
    "detail-drawer",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }
  assertCondition(
    Number((await page.locator("[data-testid='task-count']").innerText()).trim()) ===
      expected.matrix.length,
    "Task metric drifted from matrix.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='interface-count']").innerText()).trim()) ===
      expected.registry.interfaces.length,
    "Interface metric drifted from registry.",
  );
  assertCondition(
    (await page.locator("[data-testid^='task-card-']").count()) === expected.matrix.length,
    "Rendered task card count drifted.",
  );
  assertCondition(
    (await page.locator("[data-seam-button]").count()) === expected.registry.interfaces.length,
    "Rendered seam ribbon count drifted.",
  );
  assertCondition(
    (await page.locator("[data-merge-gate]").count()) === expected.gate.mergeGates.length,
    "Rendered merge gate count drifted.",
  );
  const embedded = await page.evaluate(() =>
    JSON.parse(document.getElementById("crosscutting-gate-data").textContent),
  );
  const embeddedOwners = new Map(
    embedded.registry.map((item) => [item.interfaceName, item.authoritativeOwnerTask]),
  );
  for (const item of expected.registry.interfaces) {
    assertCondition(
      embeddedOwners.get(item.interfaceName) === item.authoritativeOwnerTask,
      `Embedded registry owner drifted for ${item.interfaceName}.`,
    );
  }
}

async function assertSeamDetail(page) {
  await page.locator("[data-seam-button='PatientSpotlightDecisionProjection']").click();
  const drawer = await page.locator("[data-testid='detail-drawer']").innerText();
  assertCondition(
    drawer.includes("PatientSpotlightDecisionProjection") && drawer.includes("par_210"),
    "Seam detail state did not expose owner.",
  );
  await screenshot(page, "output/playwright/209-crosscutting-seam-detail.png");
}

async function assertMergeGateDetail(page) {
  await page.locator("[data-merge-gate='MG_209_GAP_ARTIFACT_RECONCILED']").click();
  const drawer = await page.locator("[data-testid='detail-drawer']").innerText();
  assertCondition(
    drawer.includes("Parallel gaps are explicit") &&
      drawer.includes("PARALLEL_INTERFACE_GAP_CROSSCUTTING_HOME.json"),
    "Merge gate detail state did not expose gap evidence.",
  );
  await screenshot(page, "output/playwright/209-crosscutting-merge-gate-detail.png");
}

async function assertAriaSnapshots(page) {
  const laneSnapshot = await page.locator("[data-testid='TrackLaneGrid']").ariaSnapshot();
  for (const token of [
    "Patient backend",
    "Patient frontend",
    "Support backend",
    "Support frontend",
    "Patient spotlight",
  ]) {
    assertCondition(laneSnapshot.includes(token), `TrackLaneGrid ariaSnapshot missing ${token}.`);
  }
  const seamSnapshot = await page.locator("[data-testid='SharedSeamRibbon']").ariaSnapshot();
  for (const token of [
    "PatientSpotlightDecisionProjection",
    "PatientRequestsIndexProjection",
    "SupportReplayEvidenceBoundary",
    "par_210",
    "par_219",
  ]) {
    assertCondition(seamSnapshot.includes(token), `SharedSeamRibbon ariaSnapshot missing ${token}.`);
  }
}

async function assertKeyboardNavigation(page) {
  const seamButton = page.locator("[data-seam-button='PatientNavReturnContract']");
  await seamButton.focus();
  const outline = await seamButton.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return `${style.outlineStyle}:${style.outlineWidth}`;
  });
  assertCondition(!outline.startsWith("none"), `Focus visibility missing: ${outline}`);
  await page.keyboard.press("Enter");
  assertCondition(
    (await page.locator("[data-testid='detail-drawer']").innerText()).includes(
      "PatientNavReturnContract",
    ),
    "keyboard navigation seam activation failed.",
  );
  await page.locator("[data-merge-gate='MG_209_INTERFACE_SINGLE_OWNER']").focus();
  await page.keyboard.press("Enter");
  assertCondition(
    (await page.locator("[data-testid='detail-drawer']").innerText()).includes(
      "Shared interfaces have one owner",
    ),
    "keyboard navigation merge gate activation failed.",
  );
}

async function assertResponsiveReducedMotionAndZoom(browser, url) {
  const mobile = await browser.newPage({ viewport: { width: 390, height: 860 } });
  try {
    await openBoard(mobile, url);
    await mobile.locator("[data-lane-filter='support_frontend']").click();
    await assertNoOverflow(mobile, 2);
    const visibleLanes = await mobile.locator(".lane").evaluateAll((lanes) =>
      lanes
        .filter((lane) => window.getComputedStyle(lane).display !== "none")
        .map((lane) => lane.getAttribute("data-lane")),
    );
    assertCondition(
      visibleLanes.length === 1 && visibleLanes[0] === "support_frontend",
      `lane-filter mobile state drifted: ${visibleLanes.join(",")}`,
    );
    await screenshot(mobile, "output/playwright/209-crosscutting-mobile-lane-filter.png");
  } finally {
    await mobile.close();
  }

  const reducedContext = await browser.newContext({
    viewport: { width: 1280, height: 920 },
    reducedMotion: "reduce",
  });
  const reducedPage = await reducedContext.newPage();
  try {
    await openBoard(reducedPage, url);
    const duration = await reducedPage
      .locator(".task-card")
      .first()
      .evaluate((element) => window.getComputedStyle(element).transitionDuration);
    assertCondition(
      Number.parseFloat(duration) <= 0.01,
      `reducedMotion did not collapse transition duration: ${duration}`,
    );
    await screenshot(reducedPage, "output/playwright/209-crosscutting-reduced-motion.png");
  } finally {
    await reducedContext.close();
  }

  const zoomPage = await browser.newPage({ viewport: { width: 980, height: 900 } });
  try {
    await openBoard(zoomPage, url);
    await zoomPage.addStyleTag({ content: "html { font-size: 20px; }" });
    await assertNoOverflow(zoomPage, 2);
    await screenshot(zoomPage, "output/playwright/209-crosscutting-zoom.png");
  } finally {
    await zoomPage.close();
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
    await assertBoardAgreement(page, expected);
    await assertAriaSnapshots(page);
    await assertKeyboardNavigation(page);
    await screenshot(page, "output/playwright/209-crosscutting-desktop.png");
    await assertSeamDetail(page);
    await assertMergeGateDetail(page);
    await page.close();

    await assertResponsiveReducedMotionAndZoom(browser, url);
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
  console.log("209_crosscutting_gate_board.spec.js: syntax ok");
}
