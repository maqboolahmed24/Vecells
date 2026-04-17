import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "frontend", "213_health_record_parity_state_atlas.html");
const CONTRACT_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "213_health_record_projection_contract.json",
);
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "213_record_parity_and_release_matrix.csv");
const CASES_PATH = path.join(ROOT, "data", "analysis", "213_visualization_fallback_cases.json");
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const recordParityAtlasCoverage = [
  "Record_Parity_Atlas",
  "OverviewBoard",
  "ResultDetailAnatomy",
  "DocumentArtifactBoard",
  "ArtifactParityStateBoard",
  "ChartTableParityBoard",
  "GatedPlaceholderBoard",
  "SourceAuthorityBoard",
  "FollowUpContinuityBoard",
  "overview screenshot",
  "result detail screenshot",
  "document detail screenshot",
  "parity verified screenshot",
  "degraded table screenshot",
  "delayed placeholder screenshot",
  "step-up placeholder screenshot",
  "restricted placeholder screenshot",
  "ARIA snapshots for boards",
  "keyboard tabs and disclosure",
  "accessibility headings labels tables description lists",
  "reduced motion",
  "narrow width",
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
    assertCondition(fs.existsSync(filePath), `Missing task 213 artifact ${filePath}`);
  }
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
  const cases = JSON.parse(fs.readFileSync(CASES_PATH, "utf8"));
  assertCondition(html.includes("Record_Parity_Atlas"), "Atlas visual mode missing.");
  assertCondition(contract.visualMode === "Record_Parity_Atlas", "Contract visual mode drifted.");
  assertCondition(matrix.length >= 10, "Parity matrix needs all critical record states.");
  assertCondition(cases.cases.length >= 6, "Visualization fallback cases missing.");
  return { contract, matrix, cases };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/213_health_record_parity_state_atlas.html";
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
        reject(new Error("Unable to bind local task 213 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/213_health_record_parity_state_atlas.html`,
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
  await page.locator("[data-testid='Record_Parity_Atlas']").waitFor();
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
  for (const testId of [
    "OverviewBoard",
    "SourceAuthorityBoard",
    "ResultDetailAnatomy",
    "DocumentArtifactBoard",
    "ArtifactParityStateBoard",
    "ChartTableParityBoard",
    "GatedPlaceholderBoard",
    "FollowUpContinuityBoard",
  ]) {
    if (testId === "SourceAuthorityBoard" || testId === "OverviewBoard") {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }
  }
  for (const scenarioId of [
    "result-detail",
    "document-detail",
    "parity-verified",
    "degraded-table",
    "delayed-placeholder",
    "follow-up-continuity",
  ]) {
    await selectScenario(page, scenarioId);
    await page.locator("section[aria-label]").first().waitFor();
  }
}

async function assertScreenshots(page) {
  const shots = [
    ["overview", "output/playwright/213-overview.png"],
    ["result-detail", "output/playwright/213-result-detail.png"],
    ["document-detail", "output/playwright/213-document-detail.png"],
    ["parity-verified", "output/playwright/213-parity-verified.png"],
    ["degraded-table", "output/playwright/213-degraded-table.png"],
    ["delayed-placeholder", "output/playwright/213-delayed-placeholder.png"],
    ["step-up-placeholder", "output/playwright/213-step-up-placeholder.png"],
    ["restricted-placeholder", "output/playwright/213-restricted-placeholder.png"],
  ];
  for (const [scenarioId, outputPath] of shots) {
    await selectScenario(page, scenarioId);
    await assertNoOverflow(page);
    await screenshot(page, outputPath);
  }
}

async function assertAriaSnapshots(page) {
  await selectScenario(page, "result-detail");
  const resultSnapshot = await page.locator("[data-testid='OverviewBoard']").ariaSnapshot();
  for (const token of [
    "PatientResultInterpretationProjection",
    "PatientResultInsightProjection",
    "what_this_test_is",
  ]) {
    assertCondition(resultSnapshot.includes(token), `Result ARIA missing ${token}`);
  }
  await selectScenario(page, "degraded-table");
  const authoritySnapshot = await page
    .locator("[data-testid='SourceAuthorityBoard']")
    .ariaSnapshot();
  for (const token of ["summary_provisional", "table_only", "available"]) {
    assertCondition(authoritySnapshot.includes(token), `Authority ARIA missing ${token}`);
  }
}

async function assertKeyboardTabsDisclosuresToggles(page) {
  await page.locator("[data-scenario-button='overview']").focus();
  await page.keyboard.press("ArrowRight");
  assertCondition(
    (await page.locator("[data-scenario-button='result-detail']").getAttribute("aria-selected")) ===
      "true",
    "ArrowRight did not move scenario selection.",
  );
  await page.locator("summary").first().focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.locator("#projectionRefs").focus();
  assertCondition(
    (await page.evaluate(() => document.activeElement?.id)) === "projectionRefs",
    "Projection refs were not keyboard focusable.",
  );
}

async function assertAccessibilityHeadingsLabelsTablesDescriptionLists(page) {
  assertCondition((await page.locator("main").count()) === 1, "Expected one main landmark.");
  for (const label of [
    "Record parity atlas",
    "Record parity scenarios",
    "Overview board",
    "Source authority board",
    "Projection authority details",
  ]) {
    assertCondition(
      (await page.locator(`[aria-label='${label}']`).count()) >= 1,
      `Missing aria-label ${label}`,
    );
  }
  assertCondition((await page.locator("h1").count()) === 1, "Expected one h1.");
  assertCondition((await page.locator("table").count()) >= 1, "Expected at least one table.");
  assertCondition(
    (await page.locator("dl").count()) >= 1,
    "Expected at least one description list.",
  );
}

async function assertDataParity(page, expected) {
  const embedded = await page.evaluate(() => window.__recordParityAtlasData);
  assertCondition(embedded.visualMode === "Record_Parity_Atlas", "Visual mode drifted.");
  assertCondition(embedded.scenarios.length === 10, "Expected ten atlas scenarios.");
  for (const projection of expected.contract.projectionFamily) {
    assertCondition(embedded.projections.includes(projection), `Missing ${projection}`);
  }
  for (const state of ["delayed_release", "step_up_required", "restricted"]) {
    assertCondition(
      expected.matrix.some((row) => row.release_state === state),
      `Matrix missing ${state}`,
    );
  }
  for (const caseId of ["stale_summary_demotes_chart", "step_up_placeholder"]) {
    assertCondition(
      expected.cases.cases.some((item) => item.caseId === caseId),
      `Cases missing ${caseId}`,
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
    const page = await browser.newPage({ viewport: { width: 1500, height: 960 } });
    await openAtlas(page, url);
    await assertRegions(page);
    await assertAccessibilityHeadingsLabelsTablesDescriptionLists(page);
    await assertScreenshots(page);
    await assertAriaSnapshots(page);
    await assertKeyboardTabsDisclosuresToggles(page);
    await assertDataParity(page, expected);

    const reducedContext = await browser.newContext({
      viewport: { width: 1440, height: 920 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await openAtlas(reducedPage, url);
    await selectScenario(reducedPage, "degraded-table");
    await assertNoOverflow(reducedPage);
    await screenshot(reducedPage, "output/playwright/213-reduced-motion.png");
    await reducedContext.close();

    await page.setViewportSize({ width: 390, height: 860 });
    await selectScenario(page, "degraded-table");
    await assertNoOverflow(page);
    await screenshot(page, "output/playwright/213-mobile-degraded-table.png");
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
  console.log(JSON.stringify({ coverage: recordParityAtlasCoverage }, null, 2));
}
