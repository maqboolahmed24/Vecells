import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "frontend", "211_request_lineage_action_atlas.html");
const MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "211_request_lineage_ordering_and_action_matrix.csv",
);
const CASES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "211_request_route_settlement_and_recovery_cases.json",
);
const GAP_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT.json",
);
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const requestLineageActionAtlasCoverage = [
  "Request_Lineage_Action_Atlas",
  "LineageOrderBraid",
  "ActionRoutingEnvelopeMap",
  "SettlementLadder",
  "MockListDetailFrame",
  "SafetyInterruptionStrip",
  "MatrixShelf",
  "request list default state screenshot",
  "request detail actionable state screenshot",
  "request detail read-only state screenshot",
  "settlement pending state screenshot",
  "safety interruption state screenshot",
  "identity-hold or recovery-required state screenshot",
  "ARIA snapshots for list pane, detail pane, and routing inspector",
  "keyboard navigation",
  "zoom",
  "reduced motion",
  "mobile rendering",
  "machine-readable table parity",
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
  for (const filePath of [HTML_PATH, MATRIX_PATH, CASES_PATH, GAP_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing task 211 artifact ${filePath}`);
  }
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
  const cases = JSON.parse(fs.readFileSync(CASES_PATH, "utf8"));
  const gap = JSON.parse(fs.readFileSync(GAP_PATH, "utf8"));
  assertCondition(html.includes("Request_Lineage_Action_Atlas"), "Atlas visual mode missing.");
  assertCondition(matrix.length >= 9, "Matrix needs representative request states.");
  assertCondition(cases.cases.length >= 6, "Routing and settlement cases missing.");
  assertCondition(gap.expectedOwnerTask.includes("par_212"), "Request context gap owner drifted.");
  return { matrix, cases, gap };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/211_request_lineage_action_atlas.html";
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
        reject(new Error("Unable to bind local task 211 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/211_request_lineage_action_atlas.html`,
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
  await page.locator("[data-testid='Request_Lineage_Action_Atlas']").waitFor();
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

async function assertCoreRegions(page) {
  for (const testId of [
    "MockListDetailFrame",
    "RequestListPane",
    "RequestDetailPane",
    "RoutingInspector",
    "LineageOrderBraid",
    "ActionRoutingEnvelopeMap",
    "SettlementLadder",
    "SafetyInterruptionStrip",
    "MatrixShelf",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }
}

async function assertScenarioScreenshots(page) {
  const shots = [
    ["list-default", "output/playwright/211-request-list-default.png"],
    ["detail-actionable", "output/playwright/211-request-detail-actionable.png"],
    ["detail-read-only", "output/playwright/211-request-detail-read-only.png"],
    ["settlement-pending", "output/playwright/211-settlement-pending.png"],
    ["safety-interruption", "output/playwright/211-safety-interruption.png"],
    ["identity-hold", "output/playwright/211-identity-hold-recovery.png"],
  ];
  for (const [scenarioId, outputPath] of shots) {
    await selectScenario(page, scenarioId);
    await assertNoOverflow(page);
    await screenshot(page, outputPath);
  }
}

async function assertAriaSnapshots(page) {
  await selectScenario(page, "detail-actionable");
  const listSnapshot = await page.locator("[data-testid='RequestListPane']").ariaSnapshot();
  const detailSnapshot = await page.locator("[data-testid='RequestDetailPane']").ariaSnapshot();
  const inspectorSnapshot = await page.locator("[data-testid='RoutingInspector']").ariaSnapshot();
  for (const token of ["Requests", "request_211_a", "Reply needed"]) {
    assertCondition(listSnapshot.includes(token), `List pane ARIA missing ${token}`);
  }
  for (const token of [
    "Detail",
    "One reply can move this request",
    "PatientActionRoutingProjection",
  ]) {
    assertCondition(detailSnapshot.includes(token), `Detail pane ARIA missing ${token}`);
  }
  for (const token of ["Routing Inspector", "routeIntentBindingRef", "authoritativeOutcomeState"]) {
    assertCondition(inspectorSnapshot.includes(token), `Routing inspector ARIA missing ${token}`);
  }
}

async function assertKeyboard(page) {
  await page.locator("[data-scenario-button='list-default']").focus();
  await page.keyboard.press("ArrowRight");
  assertCondition(
    (await page
      .locator("[data-scenario-button='detail-actionable']")
      .getAttribute("aria-selected")) === "true",
    "ArrowRight did not move scenario selection.",
  );
}

async function assertTableParity(page, expected) {
  const embedded = await page.evaluate(() => window.__requestLineageActionAtlasData);
  assertCondition(
    embedded.visualMode === "Request_Lineage_Action_Atlas",
    "Embedded visual mode drifted.",
  );
  assertCondition(embedded.scenarios.length === 6, "Expected six atlas scenarios.");
  for (const state of [
    "local_acknowledged",
    "pending_authoritative_confirmation",
    "external_observation_received",
    "authoritative_outcome_settled",
    "disputed_recovery_required",
  ]) {
    assertCondition(
      expected.cases.settlementStates.includes(state),
      `Cases missing settlement state ${state}`,
    );
  }
  for (const region of [
    "LineageOrderBraid",
    "ActionRoutingEnvelopeMap",
    "SettlementLadder",
    "SafetyInterruptionStrip",
    "MatrixShelf",
  ]) {
    assertCondition(
      expected.matrix.some((row) => row.atlas_region === region),
      `Matrix missing atlas region ${region}`,
    );
  }
}

async function run() {
  const expected = getExpected();
  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1600, height: 980 } });
    await openAtlas(page, url);
    await assertCoreRegions(page);
    await assertScenarioScreenshots(page);
    await assertAriaSnapshots(page);
    await assertKeyboard(page);
    await assertTableParity(page, expected);

    await page.setViewportSize({ width: 1920, height: 920 });
    await page.evaluate(() => {
      document.body.style.zoom = "1.1";
    });
    await assertNoOverflow(page, 4);
    await screenshot(page, "output/playwright/211-request-lineage-zoom.png");

    const reducedContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await openAtlas(reducedPage, url);
    await selectScenario(reducedPage, "settlement-pending");
    await assertNoOverflow(reducedPage);
    await screenshot(reducedPage, "output/playwright/211-request-lineage-reduced-motion.png");
    await reducedContext.close();

    await page.evaluate(() => {
      document.body.style.zoom = "";
    });
    await page.setViewportSize({ width: 390, height: 840 });
    await selectScenario(page, "safety-interruption");
    await assertNoOverflow(page);
    await screenshot(page, "output/playwright/211-request-lineage-mobile.png");
  } finally {
    if (browser) await browser.close();
    await closeServer(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  console.log(JSON.stringify({ coverage: requestLineageActionAtlasCoverage }, null, 2));
}
