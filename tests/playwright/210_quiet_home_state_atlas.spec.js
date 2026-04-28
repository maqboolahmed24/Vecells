import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "frontend", "210_quiet_home_state_atlas.html");
const MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "210_spotlight_candidate_and_quiet_home_matrix.csv",
);
const USE_WINDOW_PATH = path.join(ROOT, "data", "analysis", "210_spotlight_use_window_cases.json");
const ALIAS_PATH = path.join(ROOT, "data", "analysis", "210_home_projection_alias_resolution.json");
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const quietHomeStateAtlasCoverage = [
  "Quiet_Home_State_Atlas",
  "SpotlightCandidateLadder",
  "SpotlightUseWindowStrip",
  "QuietHomeEligibilityMap",
  "MockHomeFrame",
  "TupleInspector",
  "MatrixShelf",
  "urgent-safety screenshot",
  "patient-action screenshot",
  "dependency-repair screenshot",
  "quiet-home eligible screenshot",
  "quiet-home blocked screenshot",
  "read-only/recovery downgrade screenshot",
  "ARIA snapshots for scenario rail, mock-home frame, and evidence matrices",
  "keyboard navigation",
  "zoom",
  "reduced motion",
  "mobile rendering",
  "table parity",
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
  for (const filePath of [HTML_PATH, MATRIX_PATH, USE_WINDOW_PATH, ALIAS_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing task 210 artifact ${filePath}`);
  }
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
  const useWindow = JSON.parse(fs.readFileSync(USE_WINDOW_PATH, "utf8"));
  const alias = JSON.parse(fs.readFileSync(ALIAS_PATH, "utf8"));
  assertCondition(html.includes("Quiet_Home_State_Atlas"), "Atlas visual mode missing.");
  assertCondition(matrix.length >= 9, "Candidate matrix needs broad scenario coverage.");
  assertCondition(useWindow.cases.length >= 5, "Use-window cases missing.");
  assertCondition(alias.authoritativeProjection === "PatientHomeProjection", "Alias drifted.");
  return { matrix, useWindow, alias };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/210_quiet_home_state_atlas.html";
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
        reject(new Error("Unable to bind local task 210 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/210_quiet_home_state_atlas.html`,
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
  await page.locator("[data-testid='Quiet_Home_State_Atlas']").waitFor();
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
    "ScenarioRail",
    "SpotlightCandidateLadder",
    "SpotlightUseWindowStrip",
    "QuietHomeEligibilityMap",
    "MockHomeFrame",
    "TupleInspector",
    "MatrixShelf",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }
}

async function assertScenarioScreenshots(page) {
  const shots = [
    ["urgent-safety", "output/playwright/210-urgent-safety-spotlight.png"],
    ["patient-action", "output/playwright/210-patient-action-spotlight.png"],
    ["dependency-repair", "output/playwright/210-dependency-repair-spotlight.png"],
    ["quiet-home-eligible", "output/playwright/210-quiet-home-eligible.png"],
    ["quiet-home-blocked", "output/playwright/210-quiet-home-blocked.png"],
    ["read-only-recovery-downgrade", "output/playwright/210-read-only-recovery-downgrade.png"],
  ];
  for (const [scenarioId, outputPath] of shots) {
    await selectScenario(page, scenarioId);
    await assertNoOverflow(page);
    await screenshot(page, outputPath);
  }
}

async function assertAriaSnapshots(page) {
  await selectScenario(page, "patient-action");
  const railSnapshot = await page.locator("[data-testid='ScenarioRail']").ariaSnapshot();
  const mockSnapshot = await page.locator("[data-testid='MockHomeFrame']").ariaSnapshot();
  const matrixSnapshot = await page.locator("[data-testid='MatrixShelf']").ariaSnapshot();
  for (const token of [
    "Urgent safety spotlight",
    "Patient action spotlight",
    "Quiet home eligible",
  ]) {
    assertCondition(railSnapshot.includes(token), `Scenario rail ARIA missing ${token}`);
  }
  for (const token of ["Patient home", "One reply keeps this moving", "Requests"]) {
    assertCondition(mockSnapshot.includes(token), `Mock home ARIA missing ${token}`);
  }
  for (const token of ["Candidate Ladder", "Quiet Matrix", "Alias Contract"]) {
    assertCondition(matrixSnapshot.includes(token), `Matrix shelf ARIA missing ${token}`);
  }
}

async function assertKeyboard(page) {
  await page.locator("[data-scenario-button='urgent-safety']").focus();
  await page.keyboard.press("ArrowDown");
  assertCondition(
    (await page
      .locator("[data-scenario-button='patient-action']")
      .getAttribute("aria-selected")) === "true",
    "ArrowDown did not move scenario selection.",
  );
}

async function assertTableParity(page, expected) {
  const embedded = await page.evaluate(() => window.__quietHomeAtlasData);
  assertCondition(
    embedded.visualMode === "Quiet_Home_State_Atlas",
    "Embedded visual mode drifted.",
  );
  assertCondition(embedded.scenarios.length === 6, "Expected six atlas scenarios.");
  for (const tier of [
    "urgent_safety",
    "patient_action",
    "dependency_repair",
    "watchful_attention",
    "quiet_home",
  ]) {
    assertCondition(
      expected.matrix.some((row) => row.decision_tier === tier),
      `Matrix missing tier ${tier}`,
    );
  }
  for (const type of [
    "active_request",
    "pending_patient_action",
    "dependency_repair",
    "callback_message_blocker",
    "record_results_cue",
    "contact_reachability_repair",
    "recovery_identity_hold",
  ]) {
    assertCondition(
      expected.matrix.some((row) => row.candidate_type === type),
      `Matrix missing candidate type ${type}`,
    );
  }
  assertCondition(
    expected.useWindow.cases.some((item) => item.windowState === "preempted_by_higher_tier"),
    "Use-window evidence missing preemption.",
  );
  assertCondition(
    expected.alias.aliasProjection === "PatientPortalHomeProjection",
    "Alias evidence missing PatientPortalHomeProjection.",
  );
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
    await screenshot(page, "output/playwright/210-quiet-home-zoom.png");

    const reducedContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await openAtlas(reducedPage, url);
    await selectScenario(reducedPage, "quiet-home-eligible");
    await assertNoOverflow(reducedPage);
    await screenshot(reducedPage, "output/playwright/210-quiet-home-reduced-motion.png");
    await reducedContext.close();

    await page.evaluate(() => {
      document.body.style.zoom = "";
    });
    await page.setViewportSize({ width: 390, height: 840 });
    await selectScenario(page, "read-only-recovery-downgrade");
    await assertNoOverflow(page);
    await screenshot(page, "output/playwright/210-quiet-home-mobile.png");
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
  console.log(JSON.stringify({ coverage: quietHomeStateAtlasCoverage }, null, 2));
}
